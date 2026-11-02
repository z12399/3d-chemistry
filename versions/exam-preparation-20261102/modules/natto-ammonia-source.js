// Authority comes from exact reviewed bytes, then a module-private handle.
const EXPECTED_SHA256 = 'bf410584fcb74e5266abd5cb1fe55b933a1cc9626f0121324ebdea683f7fb6fc';
const EXPECTED_BYTES = 25529;
const MAX_BYTES = 262144;
const SOURCE_URL = new URL('../data/natto-ammonia-evidence.json', import.meta.url);
const catalogues = new WeakMap();
const comparisonIds = ['glutdh-double', 'urease-single', 'combined'];
const endpoints = ['headspace-ammonia-release', 'food-urea-stock'];

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function keys(value, expected) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype
    && Object.keys(value).length === expected.length
    && expected.every(key => Object.hasOwn(value, key));
}

function strings(value) {
  return Array.isArray(value) && value.length > 0
    && value.every(item => typeof item === 'string' && item.length > 0);
}

function shape(data) {
  const top = ['schema', 'datasetId', 'version', 'activityId', 'title', 'choices', 'studyContext', 'sources', 'strains', 'comparisons', 'evidence', 'provenance', 'limitations'];
  if (!keys(data, top) || data.schema !== 'natto-ammonia-evidence/v1'
    || data.datasetId !== 'natto-ammonia-evidence' || data.version !== '2026-10-16.1'
    || data.activityId !== 'natto-ammonia-evidence' || !strings(data.limitations)) return false;
  const choiceFields = ['hypothesis', 'ammoniaPrediction', 'ureaPrediction'];
  if (!keys(data.choices, choiceFields) || !choiceFields.every(field =>
    Array.isArray(data.choices[field]) && data.choices[field].length > 0
    && new Set(data.choices[field].map(item => item.id)).size === data.choices[field].length
    && data.choices[field].every(item => keys(item, ['id', 'label']) && strings([item.id, item.label])))) return false;
  if (!Array.isArray(data.sources) || data.sources.length !== 1
    || !keys(data.sources[0], ['id', 'title', 'url', 'pdfUrl', 'doi', 'citation', 'pdfIdentity', 'limitations'])
    || data.sources[0].id !== 'natto-ammonia-source-kada2008') return false;
  if (!Array.isArray(data.strains) || data.strains.length !== 4
    || data.strains.map(item => item.id).join('|') !== 'r22|SKGUD3|SKURE1|SKRGU1'
    || !data.strains.every(item => keys(item, ['id', 'label', 'inactivationDescription']))) return false;
  if (!Array.isArray(data.comparisons) || data.comparisons.map(item => item.id).join('|') !== comparisonIds.join('|')
    || !Array.isArray(data.evidence) || data.evidence.length !== 8
    || new Set(data.evidence.map(item => item.id)).size !== 8) return false;
  const memberOrder = [['r22', 'SKGUD3'], ['r22', 'SKURE1'], ['r22', 'SKGUD3', 'SKRGU1']];
  for (const [index, comparison] of data.comparisons.entries()) {
    if (!keys(comparison, ['id', 'label', 'question', 'members', 'conditions', 'evidenceRefs', 'availability', 'limits'])
      || !Array.isArray(comparison.members) || comparison.members.map(item => item.id).join('|') !== memberOrder[index].join('|')
      || !comparison.members.every(item => keys(item, ['id', 'label', 'role', 'inactivationDescription']))
      || !strings(comparison.conditions) || !strings(comparison.limits) || !strings(comparison.evidenceRefs)
      || !keys(comparison.availability, endpoints)) return false;
    for (const endpoint of endpoints) {
      const reported = endpoint === endpoints[0] || comparison.id === 'urease-single';
      if (comparison.availability[endpoint] !== (reported ? 'reported' : 'not-reported')) return false;
      const records = data.evidence.filter(item => item.comparisonId === comparison.id && item.endpointKind === endpoint);
      if (records.length !== (reported ? 2 : 0)) return false;
    }
    const expectedRefs = data.evidence.filter(item => item.comparisonId === comparison.id).map(item => item.id);
    if (comparison.evidenceRefs.join('|') !== expectedRefs.join('|')) return false;
  }
  return data.evidence.every(item =>
    keys(item, ['id', 'comparisonId', 'endpointKind', 'availability', 'statementKind', 'statement', 'sourceId', 'locator', 'measurementDomain', 'limitations', 'reporting', 'precision'])
    && comparisonIds.includes(item.comparisonId) && endpoints.includes(item.endpointKind)
    && item.availability === 'reported' && item.sourceId === data.sources[0].id
    && ['qualitative-source-statement', 'source-approximate-text'].includes(item.statementKind)
    && strings([item.statement, item.measurementDomain]) && strings(item.limitations)
    && keys(item.locator, ['pdfPage', 'printedPage', 'figure', 'section', 'url'])
    && item.locator.printedPage === 1868 + item.locator.pdfPage
    && item.locator.url === `${data.sources[0].pdfUrl}#page=${item.locator.pdfPage}`
    && keys(item.reporting, ['replicates', 'uncertainty', 'graphPointValues'])
    && item.reporting.replicates.status === 'not-reported' && item.reporting.replicates.value === null
    && item.reporting.uncertainty.status === 'not-reported' && item.reporting.uncertainty.kind === null
    && item.reporting.graphPointValues.status === 'not-provided' && item.reporting.graphPointValues.values === null);
}

export async function parseNattoAmmoniaSource(rawText) {
  if (typeof rawText !== 'string') throw fail('source-type', '來源必須是原始 JSON 文字。');
  if (rawText.length > MAX_BYTES) throw fail('source-size', '來源超過大小上限。');
  const bytes = new TextEncoder().encode(rawText);
  if (bytes.byteLength > MAX_BYTES) throw fail('source-size', '來源超過大小上限。');
  if (bytes.byteLength !== EXPECTED_BYTES) throw fail('source-integrity', '來源位元組與核定版本不同。');
  if (!globalThis.crypto?.subtle) throw fail('source-crypto', '無法驗證來源指紋。');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const sha256 = Array.from(new Uint8Array(digest), item => item.toString(16).padStart(2, '0')).join('');
  if (sha256 !== EXPECTED_SHA256) throw fail('source-integrity', '來源指紋與核定版本不同。');
  const data = JSON.parse(rawText);
  if (!shape(data)) throw fail('source-shape', '來源欄位不符合核定契約。');
  data.sourceIdentity = { datasetId: data.datasetId, version: data.version, sha256 };
  const handle = Object.freeze(Object.create(null));
  catalogues.set(handle, freeze(data));
  return handle;
}

function checkAbort(signal) {
  if (signal?.aborted) throw fail('source-aborted', '來源讀取已取消。');
}

export async function loadNattoAmmoniaSource({ signal } = {}) {
  checkAbort(signal);
  const response = await globalThis.fetch(SOURCE_URL, { cache: 'no-store', signal });
  checkAbort(signal);
  if (!response?.ok) throw fail('source-http', '無法讀取核定來源。');
  const advertised = Number(response.headers?.get?.('content-length'));
  if (Number.isFinite(advertised) && advertised > MAX_BYTES) throw fail('source-size', '來源超過大小上限。');
  const bytes = await response.arrayBuffer();
  checkAbort(signal);
  if (!(bytes instanceof ArrayBuffer)) throw fail('source-type', '來源不是位元組資料。');
  if (bytes.byteLength > MAX_BYTES) throw fail('source-size', '來源超過大小上限。');
  // Preserve a BOM so integrity validation rejects it instead of silently stripping it.
  const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  const handle = await parseNattoAmmoniaSource(text);
  checkAbort(signal);
  return handle;
}

export function getVerifiedNattoAmmoniaData(handle) {
  return catalogues.get(handle) ?? null;
}
