import {validateOsmoticDrivingDataset} from './osmotic-driving-source.js';

/** Local, externally maintained reservoirs; one ideal nonionic rejected solute.
 * Positive solvent flux is bulk solution -> pure-water side. No batch inventory,
 * fouling state, membrane calibration, time evolution or pump model is implied.
 */
export const OSMOTIC_DRIVING_ID = 'processing-osmotic-driving';
export const OSMOTIC_DRIVING_DEFAULTS = Object.freeze({
  pressureBar: 2, bulkMmolL: 25, massTransferLmh: 20, boundaryMode: 'film',
});

const DOMAINS = Object.freeze({
  pressureBar: Object.freeze([0, 3]),
  bulkMmolL: Object.freeze([0, 50]),
  massTransferLmh: Object.freeze([10, 100]),
});

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

// Remove only negative zero, never a small signed nonzero value.
const cleanZero = value => value === 0 ? 0 : value;

export function normalizeOsmoticDrivingInput(input = {}) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) {
    throw new TypeError('Osmotic driving input must be a plain object');
  }
  const normalized = {...OSMOTIC_DRIVING_DEFAULTS};
  for (const key of Reflect.ownKeys(input)) {
    if (typeof key !== 'string' || !Object.hasOwn(OSMOTIC_DRIVING_DEFAULTS, key)) {
      throw new TypeError('Unknown osmotic driving input field');
    }
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError('Input requires enumerable data properties; accessors are unsupported');
    }
    const value = descriptor.value;
    if (key === 'boundaryMode') {
      if (value !== 'film' && value !== 'well-mixed') {
        throw new TypeError('boundaryMode must be film or well-mixed');
      }
    } else {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new TypeError(`${key} must be a finite number`);
      }
      const [low, high] = DOMAINS[key];
      if (value < low || value > high) {
        throw new RangeError(`${key} is outside the reviewed teaching domain`);
      }
      // Positive concentrations need normal mol/L precision after unit conversion.
      if (key === 'bulkMmolL' && value > 0 && value / 1000 < 2 ** -1022) {
        throw new RangeError('bulkMmolL is too small for reliable mol/L representation');
      }
    }
    normalized[key] = typeof value === 'number' ? cleanZero(value) : value;
  }
  return Object.freeze(normalized);
}

function unavailable(input) {
  return freeze({status: 'UNKNOWN_SOURCE', input, version: null, constants: null,
    result: null, profile: [], pressureCurve: []});
}

function filmFlux(pressureBar, bulkOsmoticBar, permeabilityLmhBar, massTransferLmh) {
  const reference = permeabilityLmhBar * (pressureBar - bulkOsmoticBar);
  if (bulkOsmoticBar === 0 || reference === 0) return cleanZero(reference);
  let low = Math.min(0, reference), high = Math.max(0, reference);
  const residual = flux => flux - reference
    + permeabilityLmhBar * bulkOsmoticBar * Math.expm1(flux / massTransferLmh);
  // F' = 1 + Lp*piB*exp(J/k)/k > 0. The signed root is bracketed by 0 and J0.
  // expm1 preserves the film correction close to the stall pressure.
  for (let iteration = 0; iteration < 100; iteration++) {
    const midpoint = low + (high - low) / 2;
    if (midpoint === low || midpoint === high) break;
    const value = residual(midpoint);
    if (value === 0) return cleanZero(midpoint);
    if (value > 0) high = midpoint;
    else low = midpoint;
  }
  return cleanZero(Math.abs(residual(low)) <= Math.abs(residual(high)) ? low : high);
}

function allFinite(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (value && typeof value === 'object') return Object.values(value).every(allFinite);
  return true;
}

/** Invalid input throws, even when source data is missing. A missing or altered
 * reviewed dataset returns no numeric model output, curve or profile.
 */
export function evaluateOsmoticDriving(input = {}, sourceDataset) {
  const normalized = normalizeOsmoticDrivingInput(input);
  let data;
  try { data = validateOsmoticDrivingDataset(sourceDataset); }
  catch { return unavailable(normalized); }

  const {temperatureK, permeabilityLmhBar, gasConstantLBarMolK} = data.constants;
  const constants = {temperatureK, permeabilityLmhBar, gasConstantLBarMolK};
  const rt = gasConstantLBarMolK * temperatureK;
  const bulkMolL = normalized.bulkMmolL / 1000;
  const bulkOsmoticBar = rt * bulkMolL;
  const wellMixedFluxLmh = cleanZero(permeabilityLmhBar * (normalized.pressureBar - bulkOsmoticBar));
  const waterFluxLmh = normalized.boundaryMode === 'well-mixed' ? wellMixedFluxLmh
    : filmFlux(normalized.pressureBar, bulkOsmoticBar, permeabilityLmhBar, normalized.massTransferLmh);
  const exponent = normalized.boundaryMode === 'film' ? waterFluxLmh / normalized.massTransferLmh : 0;
  const concentrationFactor = Math.exp(exponent);
  const membraneMolL = bulkMolL * concentrationFactor;
  const membraneOsmoticBar = rt * membraneMolL;
  const effectivePressureBar = cleanZero(normalized.pressureBar - membraneOsmoticBar);
  const result = {
    bulkMolL, membraneMolL, bulkOsmoticBar, membraneOsmoticBar, effectivePressureBar,
    waterFluxLmh, wellMixedFluxLmh,
    polarizationFactor: normalized.bulkMmolL === 0 ? null : concentrationFactor,
    direction: waterFluxLmh > 0 ? 'reverse-osmosis' : waterFluxLmh < 0 ? 'osmosis' : 'zero',
    residualLmh: cleanZero(waterFluxLmh - permeabilityLmhBar * effectivePressureBar),
  };
  const profile = Array.from({length: 21}, (_, index) => {
    const fraction = index / 20;
    return {fraction, concentrationMmolL: normalized.bulkMmolL * Math.exp(exponent * fraction)};
  });
  const pressureCurve = Array.from({length: 61}, (_, index) => {
    const pressureBar = 3 * index / 60;
    return {pressureBar,
      filmFluxLmh: filmFlux(pressureBar, bulkOsmoticBar, permeabilityLmhBar, normalized.massTransferLmh),
      wellMixedFluxLmh: cleanZero(permeabilityLmhBar * (pressureBar - bulkOsmoticBar)),
    };
  });
  const output = {status: 'IDEAL_LOCAL_MODEL', version: data.version,
    input: normalized, constants, result, profile, pressureCurve};
  if (!allFinite(output)) throw new RangeError('Numerical result is unavailable within the reviewed domain');
  return freeze(output);
}
