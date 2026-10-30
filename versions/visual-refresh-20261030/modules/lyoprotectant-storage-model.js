import {
  validateLyoprotectantStorageDataset,
  LYOPROTECTANT_STORAGE_SOURCE_DATA_SHA256,
} from './lyoprotectant-storage-source.js';

export {validateLyoprotectantStorageDataset} from './lyoprotectant-storage-source.js';

export const LYOPROTECTANT_STORAGE_ID = 'lyoprotectant-storage-evidence';
export const LYOPROTECTANT_STORAGE_DEFAULTS = Object.freeze({
  mode: 'formulas',
  formulaA: 'sucrose',
  formulaB: 'sucrose-micellar-casein',
  monthA: 0,
  monthB: 9,
});

const INPUT_KEYS = Object.freeze(Object.keys(LYOPROTECTANT_STORAGE_DEFAULTS));
const FORMULAS = Object.freeze([
  'sucrose', 'sucrose-micellar-casein', 'sucrose-whey', 'sucrose-inulin',
]);
const MONTHS = Object.freeze([0, 0.5, 1, 3, 9]);

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** Accept only discrete choices from the reviewed study; do not coerce values.
 * Inspect descriptors before reading any input field, so getters never execute.
 * Null-prototype records are plain data; custom prototypes are not accepted.
 */
export function normalizeLyoprotectantStorageInput(input = {}) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) {
    throw new TypeError('Lyoprotectant storage input must be a plain data object');
  }
  const keys = Reflect.ownKeys(input);
  if (keys.some(key => typeof key !== 'string' || !INPUT_KEYS.includes(key))) {
    throw new TypeError('Unknown lyoprotectant storage input field');
  }
  const normalized = {...LYOPROTECTANT_STORAGE_DEFAULTS};
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError('Lyoprotectant storage input requires enumerable data fields');
    }
    normalized[key] = descriptor.value;
  }
  if (!['formulas', 'times'].includes(normalized.mode)) {
    throw new RangeError('Unknown lyoprotectant storage comparison mode');
  }
  for (const key of ['formulaA', 'formulaB']) {
    if (typeof normalized[key] !== 'string' || !FORMULAS.includes(normalized[key])) {
      throw new RangeError(`Unknown lyoprotectant storage ${key}`);
    }
  }
  for (const key of ['monthA', 'monthB']) {
    if (typeof normalized[key] !== 'number'
        || !MONTHS.some(month => Object.is(normalized[key], month))) {
      throw new RangeError(`Unmeasured lyoprotectant storage ${key}`);
    }
  }
  return Object.freeze(normalized);
}

function emptyResult(status, input, source = null) {
  return deepFreeze({
    status,
    input,
    datasetIdentity: source
      ? `${source.schema}@${source.version}#${LYOPROTECTANT_STORAGE_SOURCE_DATA_SHA256}`
      : null,
    rows: [],
    comparison: null,
    conditions: source?.fixedConditions ?? null,
    limits: source?.limits ?? [],
  });
}

/** Select exactly two reported rows, with no numerical derivation or prediction.
 * Invalid input throws even when the dataset is invalid. Unreviewed source data
 * returns UNKNOWN_SOURCE and no trustworthy values. A duplicate selection returns
 * SAME_OBSERVATION and no pair or statistical judgement.
 */
export function evaluateLyoprotectantStorage(input = {}, sourceDataset) {
  const normalized = normalizeLyoprotectantStorageInput(input);
  let source;
  try {
    source = validateLyoprotectantStorageDataset(sourceDataset);
  } catch {
    return emptyResult('UNKNOWN_SOURCE', normalized);
  }

  const isFormulas = normalized.mode === 'formulas';
  const formulaB = isFormulas ? normalized.formulaB : normalized.formulaA;
  const monthB = isFormulas ? normalized.monthA : normalized.monthB;
  if (normalized.formulaA === formulaB && normalized.monthA === monthB) {
    return emptyResult('SAME_OBSERVATION', normalized, source);
  }
  const rowA = source.rows.find(row => (
    row.formulaId === normalized.formulaA && row.storageMonths === normalized.monthA
  ));
  const rowB = source.rows.find(row => (
    row.formulaId === formulaB && row.storageMonths === monthB
  ));

  // Source letters encode comparisons only within a single storage time.
  // Cross-time comparisons never enter this branch or inspect the letters.
  let statisticalStatus = 'not-tested';
  if (isFormulas) {
    const lettersA = new Set(rowA.tukeyLetters);
    const sharedLetter = [...rowB.tukeyLetters].some(letter => lettersA.has(letter));
    statisticalStatus = sharedLetter ? 'source-not-significant' : 'source-significant';
  }
  return deepFreeze({
    status: 'REPORTED_EVIDENCE',
    input: normalized,
    datasetIdentity: `${source.schema}@${source.version}#${LYOPROTECTANT_STORAGE_SOURCE_DATA_SHA256}`,
    rows: [rowA, rowB],
    comparison: {
      kind: normalized.mode,
      statisticalStatus,
      message: source.displayMetadata.statisticalMessages[statisticalStatus],
    },
    conditions: source.fixedConditions,
    limits: source.limits,
  });
}
