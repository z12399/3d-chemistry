import { getVerifiedInjuredCellData } from './injured-cell-source.js';

export const INJURED_CELL_ACTIVITY_ID = 'injured-cell-evidence';
export const INJURED_CELL_CASE_IDS = Object.freeze(['equal-baseline', 'existing-gap']);
export const INJURED_CELL_COUNT_IDS = Object.freeze(['r-before', 's-before', 'r-after', 's-after']);
export const INJURED_CELL_SHARE_DENOMINATOR_IDS = Object.freeze(['r-after', 'r-before', 'all-living']);
const inputKeys = ['caseId', 'numeratorId', 'denominatorId', 'shareDenominatorId'];

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function invalid(code, path, message) {
  return freeze({ ok: false, issues: [{ code, path, message }] });
}

function unverified() {
  return invalid('source-unverified', 'source', '先讀取並驗證核定來源。');
}

export function normalizeInjuredCellInput(raw, handle) {
  if (!getVerifiedInjuredCellData(handle)) return unverified();
  let descriptors;
  try {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(raw))) {
      return invalid('input-type', 'input', '選擇必須是完整四欄位物件。');
    }
    const ownKeys = Reflect.ownKeys(raw);
    descriptors = Object.getOwnPropertyDescriptors(raw);
    if (ownKeys.length !== inputKeys.length || !inputKeys.every(key => Object.hasOwn(descriptors, key))
      || inputKeys.some(key => !Object.hasOwn(descriptors[key], 'value') || !descriptors[key].enumerable)) {
      return invalid('input-keys', 'input', '必須提供四個可列舉資料欄位，不接受額外欄位、符號或存取器。');
    }
  } catch {
    return invalid('input-type', 'input', '無法讀取選擇物件。');
  }
  const input = Object.fromEntries(inputKeys.map(key => [key, descriptors[key].value]));
  for (const key of inputKeys) {
    const allowed = key === 'caseId' ? INJURED_CELL_CASE_IDS
      : key === 'shareDenominatorId' ? INJURED_CELL_SHARE_DENOMINATOR_IDS : INJURED_CELL_COUNT_IDS;
    if (typeof input[key] !== 'string' || !allowed.includes(input[key])) {
      return invalid('input-value', 'input.' + key, '欄位值不在核定選項中。');
    }
  }
  return freeze({ ok: true, input });
}

export function getInjuredCellCase(handle, caseId) {
  const data = getVerifiedInjuredCellData(handle);
  if (!data) return unverified();
  const item = data.cases.find(entry => entry.id === caseId);
  return item ? freeze({ ok: true, case: item })
    : invalid('case-id', 'caseId', '找不到這組原創題設。');
}

function classify(numerator, denominator) {
  if (numerator.id === denominator.id) {
    return {
      kind: 'same-cell', direction: 'same', label: '同一格除以自己',
      interpretation: '同一計數除以自己必為 1，log 為 0；這個恆等比較沒有提供前後變化或死亡的證據。',
      allowsSameMethodReduction: false, allowsSameTimeMethodGap: false,
    };
  }
  if (numerator.method === denominator.method) {
    const forward = numerator.phase === 'before';
    return {
      kind: 'same-method-time',
      direction: forward ? 'before-over-after' : 'after-over-before',
      label: forward ? numerator.method + ' 方法的表觀 log 減少' : numerator.method + ' 方法的處理後／前比值',
      interpretation: forward
        ? '同一方法的處理前計數除以處理後計數；正的 log 可描述這個方法的表觀計數減少，不能直接等同死亡。'
        : '這是同一方法處理後相對處理前的有方向變化；本題為負 log。表觀 log 減少採反向的處理前／後比值，不能把符號忽略。',
      allowsSameMethodReduction: forward, allowsSameTimeMethodGap: false,
    };
  }
  if (numerator.phase === denominator.phase) {
    return {
      kind: 'same-time-methods',
      direction: numerator.method === 'R' ? 'r-over-s' : 's-over-r',
      label: numerator.phaseLabel + '的 ' + numerator.method + '／' + denominator.method + ' 方法差',
      interpretation: '同一時點的兩方法計數比；交換分子分母會讓 log 符號反轉。它描述方法相依差距，不是同一方法的前後減少或死亡。',
      allowsSameMethodReduction: false, allowsSameTimeMethodGap: true,
    };
  }
  return {
    kind: 'mixed-method-time', direction: 'mixed', label: '同時混合方法與時間',
    interpretation: '分子分母同時改變方法與時間。比值仍可計算，但不能單獨標成同一方法的 log 減少、同一時點的方法差或死亡。',
    allowsSameMethodReduction: false, allowsSameTimeMethodGap: false,
  };
}

function summarize(counts) {
  const r0 = counts['r-before'];
  const s0 = counts['s-before'];
  const rt = counts['r-after'];
  const st = counts['s-after'];
  const g0 = Math.log10(r0 / s0);
  const g = Math.log10(rt / st);
  const deltaG = g - g0;
  const DR = Math.log10(r0 / rt);
  const DS = Math.log10(s0 / st);
  return {
    g0, g, deltaG, DR, DS, unit: 'log10',
    definitions: {
      g0: 'log10(R₀/S₀)：處理前方法差',
      g: 'log10(Rₜ/Sₜ)：處理後方法差',
      deltaG: 'g − g₀ = Dₛ − Dᵣ：方法差的改變',
      DR: 'log10(R₀/Rₜ)：R 方法的表觀 log 減少',
      DS: 'log10(S₀/Sₜ)：S 方法的表觀 log 減少',
    },
    interpretation: '方法差由 ' + g0 + ' log 變為 ' + g + ' log，改變 ' + deltaG
      + ' log；這是原創四數的描述算術，不能單憑差距辨識受傷、死亡或唯一機制。',
    canInferInjuryFraction: false, canInferDeath: false,
  };
}

function shareOfDifference(item, definition) {
  const difference = item.counts['r-after'] - item.counts['s-after'];
  const unknown = definition.id === 'all-living';
  const denominatorValue = unknown ? null : item.counts[definition.countId];
  return {
    denominatorId: definition.id, difference, differenceUnit: item.unit,
    denominatorValue, denominatorUnit: unknown ? 'unknown' : item.unit,
    status: unknown ? 'unknown' : 'calculated',
    ratio: unknown ? null : difference / denominatorValue,
    percent: unknown ? null : (difference * 100) / denominatorValue,
    unit: '%', label: definition.label,
    interpretation: unknown
      ? '全部活細胞分母沒有被這四個 CFU 計數量得，因此比例未知；不補零，也不以 R 計數替代。'
      : '同一差額 Rₜ − Sₜ 除以「' + definition.label
        + '」所得的計數差額比例；換分母會改變比例，這不是已辨識的受傷率或死亡率。',
    canInferInjuryFraction: false, canInferDeath: false,
  };
}

export function evaluateInjuredCellComparison(raw, handle) {
  const normalized = normalizeInjuredCellInput(raw, handle);
  if (!normalized.ok) return normalized;
  const data = getVerifiedInjuredCellData(handle);
  const input = normalized.input;
  const item = data.cases.find(entry => entry.id === input.caseId);
  const numerator = data.countDefinitions.find(entry => entry.id === input.numeratorId);
  const denominator = data.countDefinitions.find(entry => entry.id === input.denominatorId);
  const numeratorValue = item.counts[numerator.id];
  const denominatorValue = item.counts[denominator.id];
  const ratio = numeratorValue / denominatorValue;
  const shareDefinition = data.shareDenominators.find(entry => entry.id === input.shareDenominatorId);
  return freeze({
    ok: true, input, caseId: item.id,
    comparison: {
      numeratorId: numerator.id, denominatorId: denominator.id,
      numeratorValue, denominatorValue, countUnit: item.unit,
      ratio, ratioUnit: '1', log10Ratio: Math.log10(ratio), logUnit: 'log10',
      ...classify(numerator, denominator), allowsDeathInference: false,
    },
    summary: summarize(item.counts),
    share: shareOfDifference(item, shareDefinition),
    sourceIdentity: data.sourceIdentity,
  });
}

export function getInjuredCellSourceEvidence(handle, contextId) {
  const data = getVerifiedInjuredCellData(handle);
  if (!data) return unverified();
  const supplement = data.sourceSupplement;
  const context = supplement.contexts.find(entry => entry.id === contextId);
  if (!context) return invalid('source-context-id', 'contextId', '找不到這個固定研究情境。');
  const source = data.sources.find(entry => entry.id === context.sourceId);
  return freeze({
    ok: true,
    evidence: {
      context, source, reporting: supplement.reporting,
      negativeDefinition: supplement.negativeDefinition,
      limitations: supplement.limitations,
      sourceIssues: supplement.sourceIssues,
    },
  });
}

