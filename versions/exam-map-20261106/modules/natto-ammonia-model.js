import { getVerifiedNattoAmmoniaData } from './natto-ammonia-source.js';

export const NATTO_AMMONIA_ACTIVITY_ID = 'natto-ammonia-evidence';
export const NATTO_COMPARISON_IDS = Object.freeze(['glutdh-double', 'urease-single', 'combined']);
const endpoints = ['headspace-ammonia-release', 'food-urea-stock'];
const inputKeys = ['comparisonId', 'hypothesis', 'ammoniaPrediction', 'ureaPrediction'];

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

export function normalizeNattoAmmoniaInput(raw, handle) {
  const data = getVerifiedNattoAmmoniaData(handle);
  if (!data) return unverified();
  let descriptors;
  try {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(raw))) {
      return invalid('input-type', 'input', '預測必須是四欄位物件。');
    }
    const ownKeys = Reflect.ownKeys(raw);
    descriptors = Object.getOwnPropertyDescriptors(raw);
    if (ownKeys.length !== inputKeys.length || !inputKeys.every(key => Object.hasOwn(descriptors, key))
      || inputKeys.some(key => !Object.hasOwn(descriptors[key], 'value'))) {
      return invalid('input-keys', 'input', '必須完整提供四個欄位，不接受額外欄位或存取器。');
    }
  } catch {
    return invalid('input-type', 'input', '無法讀取預測物件。');
  }
  const input = Object.fromEntries(inputKeys.map(key => [key, descriptors[key].value]));
  for (const key of inputKeys) {
    const allowed = key === 'comparisonId' ? NATTO_COMPARISON_IDS : data.choices[key].map(choice => choice.id);
    if (typeof input[key] !== 'string' || !allowed.includes(input[key])) {
      return invalid('input-value', `input.${key}`, '欄位值不在核定選項中。');
    }
  }
  // These are the student's claims. Never grade or replace an unavailable-endpoint prediction.
  return freeze({ ok: true, input });
}

export function getNattoComparison(handle, comparisonId) {
  const data = getVerifiedNattoAmmoniaData(handle);
  if (!data) return unverified();
  const comparison = data.comparisons.find(item => item.id === comparisonId);
  return comparison ? freeze({ ok: true, comparison })
    : invalid('comparison-id', 'comparisonId', '找不到這組核定比較。');
}

export function getNattoEvidence(handle, comparisonId, endpointKind) {
  const result = getNattoComparison(handle, comparisonId);
  if (!result.ok) return result;
  if (!endpoints.includes(endpointKind)) return invalid('endpoint-kind', 'endpointKind', '量測域不在核定選項中。');
  const data = getVerifiedNattoAmmoniaData(handle);
  const comparison = result.comparison;
  const records = data.evidence.filter(item => comparison.evidenceRefs.includes(item.id) && item.endpointKind === endpointKind);
  return freeze({
    ok: true,
    evidence: {
      comparisonId, endpointKind, availability: comparison.availability[endpointKind],
      records, limits: comparison.limits,
    },
  });
}
