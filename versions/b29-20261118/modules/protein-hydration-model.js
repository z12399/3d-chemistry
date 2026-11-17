import {validateProteinHydrationDataset} from './protein-hydration-source.js';

export const PROTEIN_HYDRATION_ID = 'protein-hydration-evidence';
export const PROTEIN_HYDRATION_DEFAULTS = Object.freeze({
  caseId: 'water-subzero',
  basis: 'protein-plus-selected-water',
  proteinMassG: 1,
});

const CASE_IDS = Object.freeze(['water-subzero', 'lyophilized', 'buffered', 'water-ambient']);
const BASIS_UNITS = Object.freeze({
  'dry-protein': 'g 所選水／100 g 乾蛋白',
  'protein-plus-selected-water': 'g 所選水／100 g（乾蛋白＋所選水）',
});
const INPUT_KEYS = Object.freeze(Object.keys(PROTEIN_HYDRATION_DEFAULTS));
const REPORT_KEYS = Object.freeze([
  'hGWaterPerGProtein', 'hPlusMinus', 'nmrX', 'nmrXPlusMinus', 'powderWaterWtPercent',
]);
const CALCULATION_KEYS = Object.freeze([
  'selectedWaterMassG', 'selectedSubsystemMassG', 'waterPerProteinPercent',
  'waterInSubsystemFraction', 'waterInSubsystemPercent', 'displayValue', 'displayUnit',
]);

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function nullFields(keys) {
  return Object.fromEntries(keys.map(key => [key, null]));
}

/** A partial plain-data input overlays defaults. Step is UI guidance only.
 * Descriptors are checked before reading values so accessors are never run.
 */
export function normalizeProteinHydrationInput(input = {}) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) {
    throw new TypeError('Protein hydration input must be a plain data object');
  }
  const keys = Reflect.ownKeys(input);
  if (keys.some(key => typeof key !== 'string' || !INPUT_KEYS.includes(key))) {
    throw new TypeError('Unknown protein hydration input field');
  }
  const normalized = {...PROTEIN_HYDRATION_DEFAULTS};
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError('Protein hydration input fields must be enumerable data');
    }
    normalized[key] = descriptor.value;
  }
  if (!CASE_IDS.includes(normalized.caseId)) throw new RangeError('Unknown protein hydration case');
  if (typeof normalized.basis !== 'string' || !Object.hasOwn(BASIS_UNITS, normalized.basis)) {
    throw new RangeError('Unknown protein hydration mass basis');
  }
  if (typeof normalized.proteinMassG !== 'number' || !Number.isFinite(normalized.proteinMassG)
      || normalized.proteinMassG < 0.1 || normalized.proteinMassG > 10) {
    throw new RangeError('Protein teaching mass must be a finite number from 0.1 to 10 g');
  }
  return Object.freeze(normalized);
}

/** Exact mass bookkeeping for the selected source h; x is never an input to h.
 * Missing or altered sources retain a deliberately empty numerical state.
 */
export function evaluateProteinHydration(input = {}, sourceDataset) {
  const normalized = normalizeProteinHydrationInput(input);
  let source;
  try {
    source = validateProteinHydrationDataset(sourceDataset);
  } catch {
    return freeze({
      status: 'UNKNOWN_SOURCE', input: normalized, version: null, case: null,
      reported: nullFields(REPORT_KEYS), calculation: nullFields(CALCULATION_KEYS),
    });
  }
  const selectedCase = source.cases.find(value => value.id === normalized.caseId);
  const result = {
    status: selectedCase.numericalStatus,
    input: normalized,
    version: source.version,
    case: selectedCase,
    reported: Object.fromEntries(REPORT_KEYS.map(key => [key, selectedCase[key]])),
    calculation: {...nullFields(CALCULATION_KEYS), displayUnit: BASIS_UNITS[normalized.basis]},
  };
  if (selectedCase.numericalStatus === 'CENTRAL_VALUES') {
    const h = selectedCase.hGWaterPerGProtein;
    const selectedWaterMassG = h * normalized.proteinMassG;
    const waterInSubsystemFraction = h / (1 + h);
    const waterPerProteinPercent = 100 * h;
    const waterInSubsystemPercent = 100 * waterInSubsystemFraction;
    result.calculation = {
      selectedWaterMassG,
      selectedSubsystemMassG: normalized.proteinMassG + selectedWaterMassG,
      waterPerProteinPercent,
      waterInSubsystemFraction,
      waterInSubsystemPercent,
      displayValue: normalized.basis === 'dry-protein' ? waterPerProteinPercent : waterInSubsystemPercent,
      displayUnit: BASIS_UNITS[normalized.basis],
    };
  }
  return freeze(result);
}

