import {COCOA_STRUCTURE_DATA} from './cocoa-structure-data.js';

export const COCOA_LAB_ID = 'cocoa-structure-evidence';

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const COCOA_DEFAULTS = deepFreeze({
  structure: {g1: 'P', g2: 'S', g3: 'O'},
  evidence: {metric: 'meltingC', baselineId: 'commercial', comparisonId: 'recrystallized'},
});

export const COCOA_RESIDUES = COCOA_STRUCTURE_DATA.residues;

const SLOTS = ['g1', 'g2', 'g3'];
const RESIDUE_IDS = ['P', 'O', 'S'];
const METRIC_IDS = ['meltingC', 'bendingModulusNmm2'];
const ELEMENTS = ['C', 'H', 'O'];
const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';

function exactObject(value, keys, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError(`${name} must be a plain object.`);
  }
  if (Reflect.ownKeys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) {
    throw new TypeError(`${name} must contain exactly ${keys.join(', ')}.`);
  }
}

function enumInput(value, allowed, name) {
  if (typeof value !== 'string') throw new TypeError(`${name} must be a string.`);
  if (!allowed.includes(value)) throw new RangeError(`${name} is outside the supported choices.`);
}

function finiteNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number.`);
  }
  return value;
}

function formula(atoms) {
  return ELEMENTS.map(element => `${element}${atoms[element] === 1 ? '' : atoms[element]}`).join('');
}

function displayFormula(text) {
  return text.replace(/\d/g, digit => SUBSCRIPTS[Number(digit)]);
}

function copy(value) {
  if (Array.isArray(value)) return value.map(copy);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)]));
  }
  return value;
}

/**
 * An atom ledger for a neutral triacylglycerol and a 2D connectivity exercise.
 * Subtracting three waters is a formal formula balance, not a biochemical
 * synthesis mechanism or a preparation procedure.
 * g1/g2/g3 are diagram positions, not a stereospecific sn assignment.
 * Matching the published POS connectivity does not identify or generate a
 * beta crystal, a unit cell, molecular conformation, melting point or texture.
 */
export function evaluateCocoaStructure(values = COCOA_DEFAULTS.structure) {
  exactObject(values, SLOTS, 'Structure inputs');
  SLOTS.forEach(slot => enumInput(values[slot], RESIDUE_IDS, slot));

  const slots = Object.fromEntries(SLOTS.map(slot => [slot, values[slot]]));
  const counts = {P: 0, O: 0, S: 0};
  const glycerol = {C: 3, H: 8, O: 3};
  const freeAcids = {C: 0, H: 0, O: 0};
  const waterRemoved = {molecules: 3, atoms: {C: 0, H: 6, O: 3}};
  const scaffoldAtoms = {C: 3, H: 5, O: 3};
  const acylAtoms = {C: 0, H: 0, O: 0};
  let doubleBonds = 0;
  const chains = SLOTS.map(slot => {
    const residueId = slots[slot];
    const residue = COCOA_RESIDUES[residueId];
    counts[residueId] += 1;
    for (const element of ELEMENTS) {
      freeAcids[element] += residue.acidAtoms[element];
      acylAtoms[element] += residue.acylAtoms[element];
    }
    doubleBonds += residue.doubleBonds;
    return {slot, residueId, ...copy(residue)};
  });
  const atoms = Object.fromEntries(ELEMENTS.map(element =>
    [element, glycerol[element] + freeAcids[element] - waterRemoved.atoms[element]]));
  const productFormula = formula(atoms);
  const compositionMatches = counts.P === 1 && counts.O === 1 && counts.S === 1;
  const middleOleoyl = slots.g2 === 'O';
  const outerPalmitoylStearoyl = [slots.g1, slots.g3].sort().join('') === 'PS';
  const target = {
    formula: 'C55H104O6',
    sameFormula: productFormula === 'C55H104O6',
    compositionMatches,
    middleOleoyl,
    outerPalmitoylStearoyl,
    matches: compositionMatches && middleOleoyl && outerPalmitoylStearoyl,
    matchScope: 'connectivity-only-not-beta-crystal-form',
  };

  return {
    kind: 'stoichiometric-structure-calculation',
    slots, counts, atoms,
    formula: productFormula,
    formulaDisplay: displayFormula(productFormula),
    esterGroups: 3,
    carbonylGroups: 3,
    doubleBonds,
    target,
    balance: {
      glycerol,
      freeAcids,
      waterRemoved,
      product: {...atoms},
      scaffoldAtoms,
      acylAtoms,
      residual: Object.fromEntries(ELEMENTS.map(element =>
        [element, scaffoldAtoms[element] + acylAtoms[element] - atoms[element]])),
    },
    chains,
    sourceIds: [...COCOA_STRUCTURE_DATA.structureContract.sourceIds],
  };
}

function metricRow(group, metric) {
  const measurement = group.metrics[metric];
  const mean = finiteNumber(measurement.mean, `${group.id}.${metric}.mean`);
  const se = finiteNumber(measurement.se, `${group.id}.${metric}.se`);
  if (mean <= 0 || se < 0) throw new RangeError('Frozen means must be positive and SE must be non-negative.');
  return {id: group.id, label: group.label, labelZh: group.labelZh, form: group.form,
    mean, se, letters: [...measurement.letters], exactN: measurement.exactN,
    ...(measurement.reportedNRange ? {reportedNRange: [...measurement.reportedNRange]} : {})};
}

/**
 * Compare two published group summaries for the same Table 2 metric.
 * For the ratio-scale bending metric, the relative difference is
 * (comparison - baseline) / baseline. Celsius has an arbitrary zero, so a
 * Celsius percentage is not emitted. Differences in degree Celsius are valid.
 * These are descriptive arithmetic contrasts, not an effect-size test.
 * SE bars are copied as reported. No confidence interval, raw observations,
 * p-value, error propagation or sensory conclusion is reconstructed.
 */
export function compareCocoaEvidence(values = COCOA_DEFAULTS.evidence) {
  exactObject(values, ['metric', 'baselineId', 'comparisonId'], 'Evidence inputs');
  enumInput(values.metric, METRIC_IDS, 'metric');
  const groups = COCOA_STRUCTURE_DATA.materials.groups;
  const groupIds = groups.map(group => group.id);
  enumInput(values.baselineId, groupIds, 'baselineId');
  enumInput(values.comparisonId, groupIds, 'comparisonId');
  const baseline = metricRow(groups.find(group => group.id === values.baselineId), values.metric);
  const comparison = metricRow(groups.find(group => group.id === values.comparisonId), values.metric);
  const meanDifference = finiteNumber(comparison.mean - baseline.mean, 'meanDifference');
  const relativeDifferenceApplicable = values.metric === 'bendingModulusNmm2';
  const relativeDifference = relativeDifferenceApplicable
    ? finiteNumber(meanDifference / baseline.mean, 'relativeDifference') : null;
  const relativeDifferencePercent = relativeDifferenceApplicable
    ? finiteNumber(relativeDifference * 100, 'relativeDifferencePercent') : null;
  const sharedLetters = baseline.letters.filter(letter => comparison.letters.includes(letter));
  const sameGroup = baseline.id === comparison.id;
  const status = sameGroup ? 'same-group' : sharedLetters.length ? 'shared-letter' : 'no-shared-letter';
  const notes = {
    'same-group': '同一組與自己比較；差值為零，沒有新增組間比較證據。',
    'shared-letter': '共享作者分組字母；此表未將這兩組判為顯著不同，不能解讀成已證明等效。',
    'no-shared-letter': '沒有共享作者分組字母；依原表比較規則屬顯著不同分組，不由本模型重算 p 值。',
  };
  const metricDefinition = COCOA_STRUCTURE_DATA.materials.metrics[values.metric];
  return {
    kind: 'published-summary-comparison',
    metric: values.metric,
    metricLabel: metricDefinition.label,
    unit: metricDefinition.unit,
    baseline,
    comparison,
    meanDifference,
    relativeDifference,
    relativeDifferencePercent,
    relativeDifferenceApplicable,
    relativeDifferenceNote: relativeDifferenceApplicable
      ? '以所選基準組均值為分母的描述性差值比例，不是統計顯著性或口感效果。'
      : '攝氏溫度的零點可平移；只比較溫差，不以攝氏均值作分母宣稱百分比變化。',
    sharedLetters,
    authorGrouping: {status, note: notes[status]},
    errorKind: 'SE',
    sourceIds: [...COCOA_STRUCTURE_DATA.materials.sourceIds],
    limits: [...COCOA_STRUCTURE_DATA.materials.limits],
  };
}
