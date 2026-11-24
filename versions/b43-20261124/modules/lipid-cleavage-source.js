import { parseBoundedJSON, validateGraphShape } from './lipid-cleavage-input.js';

export const LIPID_CLEAVAGE_DATA_SHA256 = 'ad5fcd8ba470efada20414a48c0b0b50a5a1fa2143a3087f737731338b909ff2';
const MAX_BYTES = 262144;
const verified = new WeakSet();
function fail(code) { throw Object.assign(new Error(code), { code }); }
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
async function fromBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > MAX_BYTES) fail('lipid-source-size');
  if (!globalThis.crypto?.subtle) fail('lipid-source-sha-unavailable');
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
  if (hash !== LIPID_CLEAVAGE_DATA_SHA256) fail('lipid-source-hash');
  let text; try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { fail('lipid-source-encoding'); }
  const parsed = parseBoundedJSON(text, MAX_BYTES); if (!parsed.ok) fail('lipid-source-json');
  const catalogue = parsed.value;
  if (catalogue?.schemaVersion !== 'lipid-cleavage-cases/v1' || catalogue.caseId !== 'P2016-PC-alkoxyl-12' || catalogue.graphContractManifestSha256 !== 'ba2e226788cf34a487264938744aaaa38327d218b8b2b3579e97789c6f85f8f2' || catalogue.researchManifestSha256 !== 'c9a5d608af87489c771280a09198f2aab08bd39f9780edd1e9151fc3e4710ee8') fail('lipid-source-identity');
  if (!Array.isArray(catalogue.graphs) || catalogue.graphs.length !== 9 || catalogue.graphs.some(g => validateGraphShape(g).length)) fail('lipid-source-shape');
  if (new Set(catalogue.graphs.map(g => `${g.geometryVariant}/${g.state}`)).size !== 9) fail('lipid-source-states');
  const sourceIdentity = { caseId: catalogue.caseId, dataSha256: hash, graphContractManifestSha256: catalogue.graphContractManifestSha256, sourceManifestSha256: catalogue.researchManifestSha256, rootApprovalSha256: catalogue.rootApprovalSha256 };
  const handle = freeze({ catalogue, sourceIdentity }); verified.add(handle); return handle;
}
export async function parseLipidCleavageCasesText(text) {
  if (typeof text !== 'string') fail('lipid-source-text-required');
  if (text.length > MAX_BYTES) fail('lipid-source-size');
  return fromBytes(new TextEncoder().encode(text));
}
export async function loadLipidCleavageCases({ fetchImpl = globalThis.fetch, url = new URL('../data/lipid-cleavage-cases.json', import.meta.url), signal } = {}) {
  if (typeof fetchImpl !== 'function') fail('lipid-source-fetch-unavailable');
  if (signal?.aborted) fail('lipid-source-aborted');
  let response; try { response = await fetchImpl(url, { signal, cache: 'no-store' }); } catch { fail(signal?.aborted ? 'lipid-source-aborted' : 'lipid-source-network'); }
  if (!response?.ok || typeof response.arrayBuffer !== 'function') fail('lipid-source-response');
  const length = Number(response.headers?.get?.('content-length'));
  if (Number.isFinite(length) && length > MAX_BYTES) fail('lipid-source-size');
  let bytes; try { bytes = new Uint8Array(await response.arrayBuffer()); } catch { fail('lipid-source-read'); }
  if (signal?.aborted) fail('lipid-source-aborted');
  return fromBytes(bytes);
}
export function getVerifiedLipidCleavageData(handle) { return verified.has(handle) ? handle : null; }
