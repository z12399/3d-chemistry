import {
  validateProteinSolventDataset,
  PROTEIN_SOLVENT_SOURCE_DATA_SHA256,
} from './protein-solvent-source.js';

export {validateProteinSolventDataset} from './protein-solvent-source.js';

export const PROTEIN_SOLVENT_ID = 'protein-solvent-evidence';
export const PROTEIN_SOLVENT_DEFAULTS = Object.freeze({
  study: 'rnase',
  wpiObservable: 'supernatant',
  revealConformation: false,
});

const INPUT_KEYS = Object.freeze(Object.keys(PROTEIN_SOLVENT_DEFAULTS));
const WPI_OBSERVABLES = Object.freeze({
  supernatant: 'wpi-supernatant-fraction',
  cd: 'wpi-cd-composition',
  turbidity: 'wpi-turbidity',
});

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

/** A discrete source selection, never a new treatment or assay input.
 * Descriptors are checked before reading fields; no coercion is performed.
 */
export function normalizeProteinSolventInput(input = {}) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) {
    throw new TypeError('Protein solvent input must be a plain data object');
  }
  const keys = Reflect.ownKeys(input);
  if (keys.some(key => typeof key !== 'string' || !INPUT_KEYS.includes(key))) {
    throw new TypeError('Unknown protein solvent input field');
  }
  const normalized = {...PROTEIN_SOLVENT_DEFAULTS};
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError('Protein solvent input fields must be enumerable data');
    }
    normalized[key] = descriptor.value;
  }
  if (!['rnase', 'wpi'].includes(normalized.study)) {
    throw new RangeError('Unknown protein solvent study');
  }
  if (typeof normalized.wpiObservable !== 'string'
      || !Object.hasOwn(WPI_OBSERVABLES, normalized.wpiObservable)) {
    throw new RangeError('Unknown protein solvent observable');
  }
  if (typeof normalized.revealConformation !== 'boolean') {
    throw new TypeError('Protein conformation reveal must be Boolean');
  }
  return Object.freeze(normalized);
}

function unknownSource(input) {
  return freeze({
    status: 'UNKNOWN_SOURCE', input, version: null, datasetIdentity: null,
    comparison: null, observable: null, rows: [], visibleEvidenceIds: [],
    hiddenEvidenceIds: [], context: null, unknowns: [], conflicts: [],
  });
}

/** Select a reviewed pair with its method and limits. There is deliberately
 * no numeric derivation, interpolation, state simulation or learner grading.
 */
export function evaluateProteinSolvent(input = {}, sourceDataset) {
  const normalized = normalizeProteinSolventInput(input);
  let source;
  try {
    source = validateProteinSolventDataset(sourceDataset);
  } catch {
    return unknownSource(normalized);
  }

  const isRnase = normalized.study === 'rnase';
  const comparison = source.comparisons.find(item => item.id === (
    isRnase ? 'rnase-within-study' : 'wpi-within-observable'
  ));
  const observableId = isRnase ? 'rnase-solubility' : WPI_OBSERVABLES[normalized.wpiObservable];
  const observable = source.observables.find(item => item.id === observableId);
  const rows = comparison.conditions.map(conditionId => ({
    condition: source.conditions.find(item => item.id === conditionId),
    measurements: source.observations.filter(item => (
      item.conditionId === conditionId && item.observableId === observableId
    )),
    conformation: isRnase && normalized.revealConformation
      ? source.observations.find(item => (
        item.conditionId === conditionId && item.observableId === 'rnase-conformation'
      ))
      : null,
  }));
  const visibleEvidenceIds = rows.flatMap(row => [
    ...row.measurements.map(item => item.id),
    ...(row.conformation ? [row.conformation.id] : []),
  ]);
  const hiddenEvidenceIds = isRnase && !normalized.revealConformation
    ? source.observations.filter(item => item.observableId === 'rnase-conformation').map(item => item.id)
    : [];

  return freeze({
    status: 'REPORTED_EVIDENCE',
    input: normalized,
    version: source.version,
    datasetIdentity: `${source.schema}@${source.version}#${PROTEIN_SOLVENT_SOURCE_DATA_SHA256}`,
    comparison,
    observable,
    rows,
    visibleEvidenceIds,
    hiddenEvidenceIds,
    context: {
      preparation: isRnase ? [] : source.wpiPreparation,
      ribbon: isRnase ? null : source.interaction.wpiPermanentRibbon,
      boundary: isRnase
        ? '同一來源的兩個固定條件；刊載溶解度、作者構形標記與未提供的ΔG／Tm分開判讀。'
        : source.interaction.wpiPermanentBoundary,
      limits: source.nonGoals,
    },
    unknowns: source.unknowns.filter(item => item.id.startsWith(isRnase ? 'rnase-' : 'wpi-')),
    conflicts: source.conflictsAndExclusions,
  });
}
