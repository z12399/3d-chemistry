export const MEMBRANE_BALANCE_ID = 'membrane-balance-evidence';

// Numerical support is restricted to finite normal positive derived quantities.
// Expected zeros at complete rejection, and signed balance residuals, are valid.
const MIN_NORMAL = 2 ** -1022;

function finiteNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number.`);
  }
}

function positiveInput(value, name) {
  finiteNumber(value, name);
  if (value <= 0) throw new RangeError(`${name} must be greater than zero.`);
}

function positiveResult(value, name) {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} overflows the supported finite numeric range.`);
  }
  if (value < MIN_NORMAL) {
    throw new RangeError(`${name} underflows the supported normal numeric range.`);
  }
  return value;
}

function residual(value, name) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} is not finite.`);
  return value;
}

/**
 * A hypothetical, well-mixed, constant-inventory steady membrane vessel.
 * Its continuous retentate bleed has the same concentration as its bulk.
 * rejection is the paired bulk/permeate concentration ratio, not an intrinsic
 * membrane property or an averaged rejection for a general cross-flow module.
 * No density, solvent balance, hydraulic law, fouling or startup is modeled.
 */
export function evaluateMembraneBalance(values = {}) {
  if (values === null || typeof values !== 'object' || Array.isArray(values)) {
    throw new TypeError('Membrane balance inputs must be an object.');
  }
  const {
    theta,
    rejection,
    feedFlow = 100,
    feedConcentration = 12,
    area = 2,
    collectionHours = 0.5,
  } = values;

  finiteNumber(theta, 'theta');
  finiteNumber(rejection, 'rejection');
  if (theta <= 0 || theta >= 1) throw new RangeError('theta must be strictly between zero and one.');
  if (rejection < 0 || rejection > 1) throw new RangeError('rejection must be between zero and one, inclusive.');
  for (const [name, value] of Object.entries({feedFlow, feedConcentration, area, collectionHours})) {
    positiveInput(value, name);
  }

  const retainedVolumeFraction = 1 - theta;
  const passedConcentrationFraction = 1 - rejection;
  // Avoid cancellation in 1 - theta * rejection near complete recovery/rejection.
  const denominator = retainedVolumeFraction + theta * passedConcentrationFraction;
  const retentateFlow = positiveResult(feedFlow * retainedVolumeFraction, 'retentateFlow');
  const permeateFlow = positiveResult(feedFlow * theta, 'permeateFlow');
  const bulkConcentration = positiveResult(feedConcentration / denominator, 'bulkConcentration');
  const permeateConcentration = rejection === 1 ? 0
    : positiveResult(bulkConcentration * passedConcentrationFraction, 'permeateConcentration');
  const feedSoluteFlow = positiveResult(feedFlow * feedConcentration, 'feedSoluteFlow');
  const retentateSoluteFlow = positiveResult(retentateFlow * bulkConcentration, 'retentateSoluteFlow');
  const permeateSoluteFlow = rejection === 1 ? 0
    : positiveResult(permeateFlow * permeateConcentration, 'permeateSoluteFlow');
  const retentateRecovery = positiveResult(retainedVolumeFraction / denominator, 'retentateRecovery');
  const permeateRecovery = rejection === 1 ? 0
    : positiveResult(theta * passedConcentrationFraction / denominator, 'permeateRecovery');
  const flux = positiveResult(permeateFlow / area, 'flux');
  const permeateVolume = positiveResult(permeateFlow * collectionHours, 'permeateVolume');
  const concentrationFactor = positiveResult(1 / denominator, 'concentrationFactor');

  return {
    inputs: {theta, rejection, feedFlow, feedConcentration, area, collectionHours},
    retentateFlow,
    permeateFlow,
    bulkConcentration,
    permeateConcentration,
    feedSoluteFlow,
    retentateSoluteFlow,
    permeateSoluteFlow,
    retentateRecovery,
    permeateRecovery,
    flux,
    permeateVolume,
    // Subtract in sequence: adding two very large outlet terms may overflow.
    // Preserve signed floating-point residuals instead of silently clamping them.
    volumeResidual: residual((feedFlow - retentateFlow) - permeateFlow, 'volumeResidual'),
    soluteResidual: residual((feedSoluteFlow - retentateSoluteFlow) - permeateSoluteFlow, 'soluteResidual'),
    concentrationFactor,
  };
}
