import {
  validatePackageTransportDataset,
  PACKAGE_TRANSPORT_DEFAULTS,
  PACKAGE_TRANSPORT_DOMAINS,
  PACKAGE_TRANSPORT_CONFIGURATION,
} from './package-transport-source.js';

/** Oxygen transport through one fictional, homogeneous constant-P film.
 * Positive transfer is from the maintained exterior into the receiver.
 * Both boundary models use the same rigid receiver volume and temperature.
 * Maintained pressure requires explicit compensating supply/removal of oxygen.
 */
export const PACKAGE_TRANSPORT_ID = 'processing-package-transport';
export {PACKAGE_TRANSPORT_DEFAULTS, PACKAGE_TRANSPORT_CONFIGURATION};
export const PACKAGE_TRANSPORT_LIMITS = PACKAGE_TRANSPORT_DOMAINS;

const MEANING = Object.freeze({
  maintained: '固定體積與溫度的接收器；兩側氧分壓由外界維持。供排氣補償量抵消穿膜累積，因此接收器氧庫存不變。',
  finite: '固定體積、恆溫的空接收器，只有外側氧分壓維持不變；沒有供排氣補償、反應或其他出入口，穿膜累積等於內部氧庫存變化。',
});
const MODE_NUMBERS = Object.freeze([
  'timeDays', 'pInsideKpa', 'deltaPressureKpa', 'fluxMicromolM2Day',
  'rateMicromolDay', 'signedTransferredMicromol', 'receiverInventoryMicromol',
  'receiverInventoryChangeMicromol', 'boundaryCompensationMicromol',
  'conservationResidualMicromol',
]);

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

// Normalize negative zero without altering any negative nonzero result.
const cleanZero = value => value === 0 ? 0 : value;

export function normalizePackageTransportInput(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) {
    throw new TypeError('Package transport input must be a plain object');
  }
  const normalized = {...PACKAGE_TRANSPORT_DEFAULTS};
  for (const key of Reflect.ownKeys(input)) {
    if (typeof key !== 'string' || !Object.hasOwn(PACKAGE_TRANSPORT_DOMAINS, key)) {
      throw new TypeError('Unknown package transport input field');
    }
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError('Input requires enumerable data properties; accessors are unsupported');
    }
    const value = descriptor.value;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(`${key} must be a finite number`);
    }
    const [low, high] = PACKAGE_TRANSPORT_DOMAINS[key];
    if (value < low || value > high) {
      throw new RangeError(`${key} is outside the reviewed teaching controls`);
    }
    normalized[key] = cleanZero(value);
  }
  return Object.freeze(normalized);
}

function unknownMode(boundaryMode) {
  return {
    boundaryMode, boundaryMeaning: MEANING[boundaryMode],
    ...Object.fromEntries(MODE_NUMBERS.map(key => [key, null])),
  };
}

function unavailable(input, status) {
  return freeze({
    status, input, model: null, configuration: null,
    material: {permeabilityMicromolMicrometreM2DayKpa: null, permeanceMicromolM2DayKpa: null},
    initial: {pInsideKpa: null, deltaPressureKpa: null, fluxMicromolM2Day: null,
      rateMicromolDay: null, receiverInventoryMicromol: null},
    timeConstantDays: null, maintained: unknownMode('maintained'), finite: unknownMode('finite'),
  });
}

function prepare(input, sourceDataset) {
  let data;
  try {data = validatePackageTransportDataset(sourceDataset);} catch {
    return {unavailable: unavailable(input, 'UNKNOWN_SOURCE')};
  }
  const configuration = data.configuration;
  const material = {
    permeabilityMicromolMicrometreM2DayKpa: configuration.permeabilityMicromolMicrometreM2DayKpa,
    permeanceMicromolM2DayKpa: configuration.permeabilityMicromolMicrometreM2DayKpa / input.thicknessMicrometre,
  };
  // kPa L / (micromol K); no gas-volume standard or material measurement is implied.
  const gasConstantKpaLMicromolK = configuration.gasConstantKpaLMolK * 1e-6;
  const inventoryCapacityMicromolKpa = input.receiverVolumeL
    / (gasConstantKpaLMicromolK * configuration.temperatureK);
  const conductanceMicromolDayKpa = input.areaM2 * material.permeanceMicromolM2DayKpa;
  const deltaPressureKpa = cleanZero(configuration.outsidePartialPressureKpa - input.initialInsidePartialPressureKpa);
  const fluxMicromolM2Day = cleanZero(material.permeanceMicromolM2DayKpa * deltaPressureKpa);
  const initial = {
    pInsideKpa: input.initialInsidePartialPressureKpa, deltaPressureKpa, fluxMicromolM2Day,
    rateMicromolDay: cleanZero(input.areaM2 * fluxMicromolM2Day),
    receiverInventoryMicromol: inventoryCapacityMicromolKpa * input.initialInsidePartialPressureKpa,
  };
  return {
    input, configuration, material, initial, inventoryCapacityMicromolKpa,
    timeConstantDays: inventoryCapacityMicromolKpa / conductanceMicromolDayKpa,
    model: {id: data.modelId, activityId: PACKAGE_TRANSPORT_ID, sourceVersion: data.version,
      species: data.species, parameterBasis: data.parameterBasis},
  };
}

function solveAt(prepared, timeDays) {
  const {input, material, initial, timeConstantDays, inventoryCapacityMicromolKpa} = prepared;
  const maintainedTransfer = cleanZero(initial.rateMicromolDay * timeDays);
  const maintained = {
    boundaryMode: 'maintained', boundaryMeaning: MEANING.maintained, timeDays,
    pInsideKpa: initial.pInsideKpa, deltaPressureKpa: initial.deltaPressureKpa,
    fluxMicromolM2Day: initial.fluxMicromolM2Day, rateMicromolDay: initial.rateMicromolDay,
    signedTransferredMicromol: maintainedTransfer,
    receiverInventoryMicromol: initial.receiverInventoryMicromol,
    receiverInventoryChangeMicromol: 0,
    boundaryCompensationMicromol: cleanZero(-maintainedTransfer),
    conservationResidualMicromol: 0,
  };
  const elapsedTimeConstants = timeDays / timeConstantDays;
  // Subnormal x loses relative precision before the molar integral need do so.
  // Its nonlinear correction is unrepresentable; use the continuous linear limit.
  const subnormalClock = timeDays > 0 && elapsedTimeConstants < 2 ** -1022;
  const remainingFraction = Math.exp(-elapsedTimeConstants);
  const gainedFraction = -Math.expm1(-elapsedTimeConstants);
  // t*(1-exp(-x))/x keeps the t->0 integral and avoids cancelling 1-exp(-x).
  // A subnormal positive t can make x round to zero; its integral limit is t.
  const integratedTimeDays = elapsedTimeConstants === 0 ? timeDays
    : timeDays * (gainedFraction / elapsedTimeConstants);
  const signedTransferredMicromol = cleanZero(initial.rateMicromolDay * integratedTimeDays);
  // Preserve residual driving force independently even when pInside rounds to pOutside.
  const deltaPressureKpa = cleanZero(initial.deltaPressureKpa * remainingFraction);
  const pressureChangeKpa = subnormalClock
    ? signedTransferredMicromol / inventoryCapacityMicromolKpa
    : initial.deltaPressureKpa * gainedFraction;
  const pInsideKpa = input.initialInsidePartialPressureKpa + pressureChangeKpa;
  const fluxMicromolM2Day = cleanZero(material.permeanceMicromolM2DayKpa * deltaPressureKpa);
  const inventoryChange = subnormalClock
    ? signedTransferredMicromol
    : cleanZero(inventoryCapacityMicromolKpa * initial.deltaPressureKpa * gainedFraction);
  const finite = {
    boundaryMode: 'finite', boundaryMeaning: MEANING.finite, timeDays, pInsideKpa, deltaPressureKpa,
    fluxMicromolM2Day, rateMicromolDay: cleanZero(input.areaM2 * fluxMicromolM2Day),
    signedTransferredMicromol,
    // Preserve tiny representable inventory changes before pressure rounding.
    receiverInventoryMicromol: initial.receiverInventoryMicromol + inventoryChange,
    receiverInventoryChangeMicromol: inventoryChange,
    boundaryCompensationMicromol: 0,
    conservationResidualMicromol: cleanZero(inventoryChange - signedTransferredMicromol),
  };
  const numeric = [timeConstantDays, ...Object.values(initial), ...Object.values(material),
    ...MODE_NUMBERS.flatMap(key => [maintained[key], finite[key]])];
  const scale = Math.max(1, initial.receiverInventoryMicromol, finite.receiverInventoryMicromol,
    Math.abs(inventoryChange), Math.abs(signedTransferredMicromol));
  const valid = numeric.every(Number.isFinite) && timeConstantDays > 0
    && Math.abs(finite.conservationResidualMicromol) <= 128 * Number.EPSILON * scale;
  return {valid, timeDays, maintained, finite};
}

/** Invalid input throws. Missing or altered reviewed source data fails closed. */
export function evaluatePackageTransport(input = {}, sourceDataset) {
  const normalized = normalizePackageTransportInput(input);
  const prepared = prepare(normalized, sourceDataset);
  if (prepared.unavailable) return prepared.unavailable;
  const point = solveAt(prepared, normalized.timeDays);
  if (!point.valid) return unavailable(normalized, 'NUMERICAL_FAILURE');
  return freeze({
    status: 'MODEL_OK', input: normalized, model: prepared.model,
    configuration: prepared.configuration, material: prepared.material, initial: prepared.initial,
    timeConstantDays: prepared.timeConstantDays, maintained: point.maintained, finite: point.finite,
  });
}

/** Exactly 41 points, including both endpoints. Zero horizon contains valid t=0 states. */
export function samplePackageTransport(input = {}, sourceDataset, endTimeDays) {
  const normalized = normalizePackageTransportInput(input);
  const horizon = endTimeDays === undefined ? normalized.timeDays : endTimeDays;
  if (typeof horizon !== 'number' || !Number.isFinite(horizon)) {
    throw new TypeError('Curve end time must be a finite number');
  }
  const [low, high] = PACKAGE_TRANSPORT_DOMAINS.timeDays;
  if (horizon < low || horizon > high) throw new RangeError('Curve end time is outside the reviewed domain');
  const end = cleanZero(horizon);
  const prepared = prepare(normalized, sourceDataset);
  const failed = status => freeze({status, input: normalized, endTimeDays: end, pointCount: 0,
    initial: unavailable(normalized, status).initial, timeConstantDays: null, points: []});
  if (prepared.unavailable) return failed(prepared.unavailable.status);
  const points = Array.from({length: 41}, (_, index) => {
    const timeDays = index === 40 ? end : end * (index / 40);
    return solveAt(prepared, timeDays);
  });
  if (points.some(point => !point.valid)) return failed('NUMERICAL_FAILURE');
  return freeze({status: 'MODEL_OK', input: normalized, endTimeDays: end, pointCount: points.length,
    initial: prepared.initial, timeConstantDays: prepared.timeConstantDays,
    points: points.map(({timeDays, maintained, finite}) => ({timeDays, maintained, finite}))});
}
