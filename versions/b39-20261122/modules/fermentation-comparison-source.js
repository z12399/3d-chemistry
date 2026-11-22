// Only this module can create a verified immutable source handle.
export const FERMENTATION_COMPARISON_SOURCE_IDENTITY = Object.freeze({
  datasetId: 'fermentation-comparison-cases',
  version: '2026-10-16.1',
  sha256: '9919fda1814c77de751002f3b570c289cff7683b651e5e6c87a6e38794bf14bb',
});

const MAX_SOURCE_BYTES = 262144;
const verifiedSources = new WeakSet();
const expectedReferences = [
  ...['smf', 'ssf'].flatMap(mode => [25, 30, 37, 40, 45, 50].map(t => `oa2018-t3-${mode}-${t}c`)),
  ...[0, 120, 150, 180].map(rpm => `oa2018-t4-smf-${rpm}rpm`),
];

function sourceError(code, message) {
  const error = new Error(message);
  error.name = 'FermentationComparisonSourceError';
  error.code = code;
  return error;
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function notAborted(signal) {
  if (!signal?.aborted) return;
  if (signal.reason instanceof Error) throw signal.reason;
  throw new DOMException('Source loading aborted.', 'AbortError');
}

async function parseBytes(bytes, signal) {
  notAborted(signal);
  if (bytes.byteLength > MAX_SOURCE_BYTES) throw sourceError('SOURCE_SIZE', 'Source exceeds the accepted byte limit.');
  if (!globalThis.crypto?.subtle) throw sourceError('SOURCE_CRYPTO', 'SHA-256 verification is unavailable.');
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes));
  const sha256 = [...digest].map(b => b.toString(16).padStart(2, '0')).join('');
  notAborted(signal);
  if (sha256 !== FERMENTATION_COMPARISON_SOURCE_IDENTITY.sha256) {
    throw sourceError('SOURCE_BYTES_MISMATCH', 'Source bytes do not match the approved catalogue.');
  }
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw sourceError('SOURCE_UTF8', 'Source is not valid UTF-8.');
  }
  let catalogue;
  try {
    catalogue = JSON.parse(text);
  } catch {
    throw sourceError('SOURCE_JSON', 'Source is not valid JSON.');
  }
  const ids = catalogue?.cases?.map(row => row.referenceId);
  if (catalogue?.schema !== 'fermentation-comparison-cases/v1'
      || catalogue.datasetId !== FERMENTATION_COMPARISON_SOURCE_IDENTITY.datasetId
      || catalogue.version !== FERMENTATION_COMPARISON_SOURCE_IDENTITY.version
      || catalogue.activityId !== 'fermentation-comparison-design'
      || !Array.isArray(ids) || ids.length !== 16 || new Set(ids).size !== 16
      || expectedReferences.some(id => !ids.includes(id))
      || catalogue.cases.some(row => row.origin !== 'reported' || row.immutable !== true || !row.result)
      || catalogue.sources.length !== 2 || catalogue.series.length !== 3) {
    throw sourceError('SOURCE_SHAPE', 'Approved source contract is inconsistent.');
  }
  // The complete raw-byte pin, rather than a self-declared hash or partial shape,
  // covers all conditions, nulls, units, provenance and published values.
  const source = freeze({ catalogue, sourceIdentity: { ...FERMENTATION_COMPARISON_SOURCE_IDENTITY } });
  verifiedSources.add(source);
  return source;
}

export function isVerifiedFermentationComparisonSource(source) {
  return Boolean(source && typeof source === 'object' && verifiedSources.has(source));
}

export async function parseFermentationComparisonSource(rawText) {
  if (typeof rawText !== 'string') throw sourceError('SOURCE_TYPE', 'Source text must be a string.');
  return parseBytes(new TextEncoder().encode(rawText));
}

export async function loadFermentationComparisonSource({
  fetchImpl = globalThis.fetch,
  url = new URL('../data/fermentation-comparison-cases.json', import.meta.url).href,
  signal,
} = {}) {
  if (typeof fetchImpl !== 'function') throw sourceError('SOURCE_FETCH', 'Source loading is unavailable.');
  notAborted(signal);
  const response = await fetchImpl(url, { signal, cache: 'no-store' });
  notAborted(signal);
  if (!response?.ok) throw sourceError('SOURCE_HTTP', `Source request failed (${response?.status ?? 'unknown'}).`);
  if (typeof response.arrayBuffer !== 'function') throw sourceError('SOURCE_RESPONSE', 'Raw response bytes are unavailable.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  notAborted(signal);
  return parseBytes(bytes, signal);
}
