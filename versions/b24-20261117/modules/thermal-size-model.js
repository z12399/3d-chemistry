/** Two homogeneous spheres with shared, constant material and convection inputs.
 * All calculations use SI units; rAMm is converted from millimetres at the edge.
 * Lc=V/A=r/3 is not the half-thickness used by the separate plane-wall PDE model.
 * Bi<0.1 only screens the near-uniform approximation; it is not an error bound.
 * No phase change, radiation, internal generation, deformation or spatial PDE.
 */
export const THERMAL_SIZE_LAB_ID = 'processing-thermal-size';
export const THERMAL_SIZE_DEFAULTS = Object.freeze({
  rAMm:10, radiusRatio:2, h:5, k:0.5, volumetricHeatCapacity:3500000,
  initialC:20, ambientC:80, targetFraction:0.8, timeSeconds:3600,
});

// Authored teaching control limits, not a measured material or process domain.
const bounds = Object.freeze({
  rAMm:[1,50], radiusRatio:[1,4], h:[1,100], k:[0.05,5],
  volumetricHeatCapacity:[500000,5000000], initialC:[0,100], ambientC:[0,100],
  targetFraction:[0.1,0.95], timeSeconds:[0,86400],
});

export function normalizeThermalSizeInput(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) {
    throw new TypeError('Thermal-size input must be a plain object');
  }
  const result = {...THERMAL_SIZE_DEFAULTS};
  for (const key of Reflect.ownKeys(input)) {
    if (typeof key !== 'string' || !Object.hasOwn(bounds, key)) {
      throw new TypeError('Unknown thermal-size input field');
    }
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!Object.hasOwn(descriptor, 'value')) throw new TypeError('Input accessors are not supported');
    const value = descriptor.value, [low, high] = bounds[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${key} must be a finite number`);
    if (value < low || value > high) throw new RangeError(`${key} must be in [${low}, ${high}]`);
    result[key] = value === 0 ? 0 : value;
  }
  return Object.freeze(result);
}

export function evaluateThermalSize(input = {}) {
  const p = normalizeThermalSizeInput(input);
  const delta = p.ambientC - p.initialC;
  const equilibrium = delta === 0;
  const direction = equilibrium ? 'equilibrium' : delta > 0 ? 'heating' : 'cooling';
  const targetTemperatureC = p.initialC + p.targetFraction * delta;
  const makeSphere = (id, radiusMm) => {
    const radiusM = radiusMm / 1000;
    const volumeM3 = 4 * Math.PI * radiusM ** 3 / 3;
    const areaM2 = 4 * Math.PI * radiusM ** 2;
    const characteristicLengthM = radiusM / 3;
    const heatCapacityJPerK = p.volumetricHeatCapacity * volumeM3;
    const initialHeatFlowW = equilibrium ? 0 : p.h * areaM2 * delta;
    const totalHeatJ = equilibrium ? 0 : heatCapacityJPerK * delta;
    // Exact energy-balance rate at the uniform initial state, not a center rate.
    const initialMeanRateKPerS = equilibrium ? 0 : initialHeatFlowW / heatCapacityJPerK;
    // Equivalent to h*(r/3)/k. The mm form avoids an extra rounding step at Bi=.1.
    const biot = p.h * radiusMm / (3000 * p.k);
    const applicable = biot < 0.1;
    const tauSeconds = applicable ? p.volumetricHeatCapacity * characteristicLengthM / p.h : null;
    const progressFraction = applicable && !equilibrium ? -Math.expm1(-p.timeSeconds / tauSeconds) : null;
    const temperatureC = applicable ? equilibrium ? p.initialC : p.initialC + delta * progressFraction : null;
    const targetTimeSeconds = applicable && !equilibrium ? -tauSeconds * Math.log1p(-p.targetFraction) : null;
    return Object.freeze({
      id, radiusM, volumeM3, areaM2, characteristicLengthM, heatCapacityJPerK,
      initialHeatFlowW, totalHeatJ, initialMeanRateKPerS, biot, applicable,
      status:!applicable ? 'blocked-biot' : equilibrium ? 'equilibrium' : 'lumped',
      tauSeconds, temperatureC, targetTemperatureC, targetTimeSeconds, progressFraction,
      equilibriumTemperatureC:equilibrium ? p.initialC : null,
    });
  };
  const spheres = Object.freeze([makeSphere('A', p.rAMm), makeSphere('B', p.rAMm * p.radiusRatio)]);
  const s = p.radiusRatio;
  // Derived B/A scalings avoid unstable division of two tiny signed heat values.
  const ratios = Object.freeze({
    radius:s, area:s ** 2, volume:s ** 3, heatCapacity:s ** 3,
    totalHeat:equilibrium ? null : s ** 3,
    initialHeatFlow:equilibrium ? null : s ** 2,
    initialMeanRate:equilibrium ? null : 1 / s,
    timeToTarget:!equilibrium && spheres.every(sphere => sphere.applicable) ? s : null,
  });
  return Object.freeze({input:p, direction, spheres, ratios});
}
