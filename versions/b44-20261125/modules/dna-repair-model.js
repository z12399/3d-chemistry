import {validateDnaRepairDataset, DNA_REPAIR_DATASET_IDENTITY} from './dna-repair-source.js';
export {validateDnaRepairDataset} from './dna-repair-source.js';

export const DNA_REPAIR_ID = 'dna-repair-evidence';
export const DNA_REPAIR_DEFAULTS = Object.freeze({mode: 'mechanism', substrate: 'a-oxog', strain: 'mutY'});
const KEYS = Object.freeze(['mode', 'substrate', 'strain']);
const CHOICES = Object.freeze({mode: ['mechanism', 'genetic'], substrate: ['a-oxog', 'a-g', 'c-oxog'], strain: ['gt100', 'mutY', 'mutM', 'mutS']});
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
deepFreeze(CHOICES);

/** A complete three-field record is required; use {...DNA_REPAIR_DEFAULTS} in callers.
 * No implicit defaults, coercion, unknown keys, accessors or custom prototypes.
 * Ordinary and null-prototype plain records are accepted and normalized to a copy.
 */
export function normalizeDnaRepairInput(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) {
    throw new TypeError('DNA repair input must be a complete plain data object');
  }
  const keys = Reflect.ownKeys(input);
  if (keys.length !== KEYS.length || keys.some(key => typeof key !== 'string' || !KEYS.includes(key))) {
    throw new TypeError('DNA repair input requires exactly mode, substrate and strain');
  }
  const result = {};
  for (const key of KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError('DNA repair input requires own enumerable data fields');
    }
    if (typeof descriptor.value !== 'string' || !CHOICES[key].includes(descriptor.value)) {
      throw new RangeError('Unmeasured DNA repair ' + key);
    }
    result[key] = descriptor.value;
  }
  return Object.freeze(result);
}
function site(base, damaged, apSite = false) {
  return {base, basePresent: base !== null, baseDamaged: damaged, sugar: 'deoxyribose', sugarPresent: true,
    phosphatePresent: true, apSite, glycosidicBond: base === null ? 'absent' : 'present'};
}
function mechanismFor(substrate) {
  const removed = substrate.reportedRemovedBase;
  return {
    substrateId: substrate.id, label: substrate.label,
    before: {target: site(substrate.targetBase, substrate.targetBaseDamaged), opposite: site(substrate.oppositeBase, substrate.oppositeBaseDamaged), backboneContinuous: true, chemicalBackboneCleavage: false, repairComplete: false},
    after: {target: site(removed === null ? substrate.targetBase : null, false, substrate.apSiteGenerated), opposite: site(substrate.oppositeBase, substrate.oppositeBaseDamaged), backboneContinuous: true, chemicalBackboneCleavage: false, repairComplete: false},
    removedBase: removed, removedFrom: removed === null ? null : 'target', apSiteGenerated: substrate.apSiteGenerated,
    releasedBase: removed === null ? null : {base: removed, from: 'target', attachedToSugar: false, partOfDnaBackbone: false, conceptualOnly: true},
    backboneContinuous: true, chemicalBackboneCleavage: false, repairComplete: false, reportedChoice: substrate.reportedChoice,
    conceptualOnly: true, step: 'base-excision-only', sourceStatement: substrate.sourceStatement,
    sourceId: 'michaels1992', locator: substrate.locator,
  };
}

/** Select only reviewed mechanisms or the two original Table1 cells; never derive
 * rates, ratios, significance, mutation classes, survival or a completed repair.
 */
export function evaluateDnaRepair(input, sourceDataset) {
  const normalized = normalizeDnaRepairInput(input);
  let source;
  try { source = validateDnaRepairDataset(sourceDataset); }
  catch {
    return deepFreeze({status: 'UNKNOWN_SOURCE', input: normalized, datasetIdentity: null, mechanism: null,
      rows: [], comparison: null, conditions: null, limits: []});
  }
  const mechanism = normalized.mode === 'mechanism'
    ? mechanismFor(source.substrates.find(row => row.id === normalized.substrate)) : null;
  const rows = normalized.mode === 'genetic' ? source.rows.filter(row => row.strainId === normalized.strain) : [];
  const comparison = normalized.mode === 'mechanism'
    ? {kind: 'mechanism', statement: mechanism.sourceStatement, statisticalStatus: 'not-applicable', quantitativeConnectionToCellEvidence: false}
    : {kind: 'genetic', strainId: normalized.strain, statement: source.displayMetadata.geneticDescriptions[normalized.strain],
      statisticalStatus: 'not-provided', statisticalMessage: source.statistics.message,
      quantitativeConnectionToMechanism: false};
  return deepFreeze({status: 'SOURCE_BOUND_EVIDENCE', input: normalized, datasetIdentity: DNA_REPAIR_DATASET_IDENTITY,
    mechanism, rows, comparison, conditions: source.fixedConditions, limits: source.limits});
}
