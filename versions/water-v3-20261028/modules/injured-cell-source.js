// Reviewed candidate bytes mint authority; callers cannot self-declare verification.
const EXPECTED_SHA256 = 'b934379de78eadba469604c640759fa12abf71481e60bc658a354607c3e91a17';
const EXPECTED_BYTES = 22248;
const MAX_BYTES = 262144;
const SOURCE_URL = new URL('../data/injured-cell-evidence.json', import.meta.url);
const PAPER_URL = 'https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2016.01376/full';
const PDF_URL = 'https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2016.01376/pdf';
const SOURCE_ID = 'injured-cell-source-espina2016';
const CASE_IDS = ['equal-baseline', 'existing-gap'];
const COUNT_IDS = ['r-before', 's-before', 'r-after', 's-after'];
const CONTEXTS = [
  ['wt-3-untreated', 3, false, 'Viable'],
  ['wt-3-treated', 3, true, 'Inhibited'],
  ['wt-4-untreated', 4, false, 'Inhibited'],
  ['wt-6-treated', 6, true, 'Non-viable'],
];
const catalogues = new WeakMap();

function failure(code, message, cause) {
  const error = new Error(message);
  error.code = code;
  if (cause !== undefined) error.cause = cause;
  return error;
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
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

function text(value) {
  return typeof value === 'string' && value.length > 0;
}

function texts(value) {
  return Array.isArray(value) && value.length > 0 && value.every(text);
}

function definitionLocator(value) {
  return keys(value, ['pdfPage', 'section', 'url']) && value.pdfPage === 4
    && value.section === 'Determination of the State of Cells Grown in Agar Media Containing NaCl'
    && value.url === PDF_URL + '#page=4';
}

function contextShape(context, expected) {
  const [id, salt, treated, classification] = expected;
  if (!keys(context, ['id', 'origin', 'sourceId', 'organism', 'label', 'condition', 'publishedClassification', 'observations', 'limitations'])
    || context.id !== id || context.origin !== 'published-classification' || context.sourceId !== SOURCE_ID
    || context.organism !== 'E. coli BW25113 WT' || !text(context.label) || !texts(context.limitations)) return false;
  const condition = context.condition;
  if (!keys(condition, ['initialMedium', 'initialNaClPercent', 'treatmentState', 'treatmentLabel', 'treatmentLocator', 'interpretation', 'treatmentTemperatureC', 'treatmentDurationMin'])
    || condition.initialMedium !== 'M9 agar' || condition.initialNaClPercent !== salt
    || condition.treatmentState !== (treated ? 'thermally-treated' : 'untreated')
    || condition.treatmentTemperatureC !== (treated ? 55 : null)
    || condition.treatmentDurationMin !== (treated ? 10 : null)
    || !text(condition.treatmentLabel) || !text(condition.interpretation)
    || !definitionLocator(condition.treatmentLocator)) return false;
  const published = context.publishedClassification;
  if (!keys(published, ['status', 'label', 'locator']) || published.status !== 'reported'
    || published.label !== classification || !keys(published.locator, ['pdfPage', 'table', 'row', 'column', 'url'])
    || published.locator.pdfPage !== 6 || published.locator.table !== '1'
    || published.locator.row !== salt + '% NaCl'
    || published.locator.column !== 'State of WT ' + (treated ? 'thermally treated' : 'untreated') + ' cells'
    || published.locator.url !== PDF_URL + '#page=6') return false;
  if (!keys(context.observations, ['first', 'second'])) return false;
  const viable = classification === 'Viable';
  for (const phase of ['first', 'second']) {
    const observation = context.observations[phase];
    const expectedStatus = viable && phase === 'second' ? 'not-reported' : 'definition-derived';
    const expectedValue = phase === 'first' ? (viable ? 'growth-observed' : 'no-colonies-observed')
      : viable ? null : classification === 'Inhibited' ? 'positive' : 'negative-below-threshold';
    if (!keys(observation, ['status', 'value', 'label', 'basis', 'locator'])
      || observation.status !== expectedStatus || observation.value !== expectedValue
      || !text(observation.label) || !text(observation.basis) || !definitionLocator(observation.locator)) return false;
  }
  return true;
}

function shape(data) {
  const top = ['schema', 'datasetId', 'version', 'activityId', 'lessonId', 'title', 'countDefinitions', 'cases', 'shareDenominators', 'sources', 'sourceSupplement', 'provenance', 'limitations'];
  if (!keys(data, top) || data.schema !== 'injured-cell-evidence/v1'
    || data.datasetId !== 'injured-cell-evidence' || data.version !== '2026-10-16.1'
    || data.activityId !== 'injured-cell-evidence' || data.lessonId !== 'micro-injured-cells'
    || !text(data.title) || !texts(data.limitations)) return false;
  if (!Array.isArray(data.countDefinitions) || data.countDefinitions.length !== 4) return false;
  for (const [index, definition] of data.countDefinitions.entries()) {
    if (!keys(definition, ['id', 'label', 'symbol', 'method', 'methodLabel', 'phase', 'phaseLabel', 'unit'])
      || definition.id !== COUNT_IDS[index] || definition.method !== (index % 2 === 0 ? 'R' : 'S')
      || definition.phase !== (index < 2 ? 'before' : 'after') || definition.unit !== 'CFU/g'
      || ![definition.label, definition.symbol, definition.methodLabel, definition.phaseLabel].every(text)) return false;
  }
  if (!Array.isArray(data.cases) || data.cases.length !== 2) return false;
  for (const [index, item] of data.cases.entries()) {
    if (!keys(item, ['id', 'label', 'origin', 'originLabel', 'sourceId', 'unit', 'counts', 'assumptions', 'eligibility', 'allLiving', 'lessonLocator'])
      || item.id !== CASE_IDS[index] || item.origin !== 'original-teaching-data' || item.sourceId !== null
      || !text(item.label) || !text(item.originLabel) || item.unit !== 'CFU/g' || !texts(item.assumptions)
      || !keys(item.counts, COUNT_IDS)) return false;
    const expectedCounts = [2000000, index === 0 ? 2000000 : 200000, 20000, 200];
    if (!COUNT_IDS.every((id, offset) => Number.isSafeInteger(item.counts[id]) && item.counts[id] === expectedCounts[offset])) return false;
    const eligibility = item.eligibility;
    if (!keys(eligibility, ['sameTarget', 'comparableSampleBasis', 'sameOriginalMassBasis', 'allQuantifiable', 'premisesKind', 'singleCellTracking', 'totalLivingMeasured'])
      || !['sameTarget', 'comparableSampleBasis', 'sameOriginalMassBasis', 'allQuantifiable'].every(key => eligibility[key] === true)
      || eligibility.premisesKind !== 'teaching-assumptions' || eligibility.singleCellTracking !== false || eligibility.totalLivingMeasured !== false) return false;
    if (!keys(item.allLiving, ['status', 'value', 'unit', 'reason']) || item.allLiving.status !== 'unknown'
      || item.allLiving.value !== null || item.allLiving.unit !== null || !text(item.allLiving.reason)) return false;
    if (!keys(item.lessonLocator, ['path', 'pointer']) || item.lessonLocator.path !== 'app/dist/data/microbiology-curriculum.json'
      || item.lessonLocator.pointer !== '/topics/3/lessons/2/practice' + (index === 1 ? '/transfer' : '')) return false;
  }
  if (!Array.isArray(data.shareDenominators) || data.shareDenominators.length !== 3) return false;
  const shares = ['r-after', 'r-before', 'all-living'];
  if (!data.shareDenominators.every((item, index) => keys(item, ['id', 'label', 'countId', 'availability'])
    && item.id === shares[index] && text(item.label) && item.countId === (index === 2 ? null : shares[index])
    && item.availability === (index === 2 ? 'unknown' : 'given'))) return false;
  if (!Array.isArray(data.sources) || data.sources.length !== 1) return false;
  const source = data.sources[0];
  if (!keys(source, ['id', 'title', 'url', 'pdfUrl', 'doi', 'authors', 'citation', 'pdfIdentity', 'license', 'adaptation', 'scope', 'limitations'])
    || source.id !== SOURCE_ID || !text(source.title) || source.url !== PAPER_URL || source.pdfUrl !== PDF_URL
    || source.doi !== '10.3389/fmicb.2016.01376' || !texts(source.authors) || source.authors.length !== 3
    || ![source.citation, source.adaptation, source.scope].every(text) || !texts(source.limitations)
    || !keys(source.pdfIdentity, ['bytes', 'sha256']) || source.pdfIdentity.bytes !== 1101420
    || source.pdfIdentity.sha256 !== 'd6d9bd2d53c25162c669ef9ecd40b38793d672168f8f3a807fa238ed37a59a6f'
    || !keys(source.license, ['id', 'label', 'url']) || source.license.id !== 'CC-BY-4.0'
    || !text(source.license.label) || source.license.url !== 'https://creativecommons.org/licenses/by/4.0/') return false;
  const supplement = data.sourceSupplement;
  if (!keys(supplement, ['role', 'contexts', 'reporting', 'negativeDefinition', 'sourceIssues', 'limitations'])
    || supplement.role !== 'expandable-source-supplement' || !Array.isArray(supplement.contexts)
    || supplement.contexts.length !== 4 || !supplement.contexts.every((context, index) => contextShape(context, CONTEXTS[index]))
    || !texts(supplement.limitations)) return false;
  const reporting = supplement.reporting;
  if (!keys(reporting, ['kind', 'repeatStatement', 'independentReplicateCount', 'uncertainty', 'locator'])
    || reporting.kind !== 'representative-experiment' || !text(reporting.repeatStatement)
    || !keys(reporting.independentReplicateCount, ['status', 'value'])
    || reporting.independentReplicateCount.status !== 'not-specified-as-independent-n' || reporting.independentReplicateCount.value !== null
    || !keys(reporting.uncertainty, ['status', 'kind', 'value']) || reporting.uncertainty.status !== 'not-reported'
    || reporting.uncertainty.kind !== null || reporting.uncertainty.value !== null || !definitionLocator(reporting.locator)) return false;
  const negative = supplement.negativeDefinition;
  if (!keys(negative, ['kind', 'comparison', 'value', 'unit', 'zeroEquivalent', 'deathEquivalent', 'description', 'locator'])
    || negative.kind !== 'operational-negative-threshold' || negative.comparison !== '<' || negative.value !== 5
    || negative.unit !== 'CFU/plate' || negative.zeroEquivalent !== false || negative.deathEquivalent !== false
    || !text(negative.description) || !definitionLocator(negative.locator)) return false;
  const issueIds = ['printed-equation-conflict', 'mutant-name-conflict', 'fig1-no-exact-pairs', 'fig8-different-measurement'];
  const issueStatuses = ['unresolved', 'unresolved-excluded', 'not-used-for-counts', 'not-used-for-counts'];
  const issuePages = [4, 4, 5, 10];
  if (!Array.isArray(supplement.sourceIssues) || supplement.sourceIssues.length !== 4
    || !supplement.sourceIssues.every((issue, index) => keys(issue, ['id', 'status', 'locator', 'statement', 'handling'])
      && issue.id === issueIds[index] && issue.status === issueStatuses[index] && text(issue.statement) && text(issue.handling)
      && keys(issue.locator, ['pdfPage', 'item', 'url']) && issue.locator.pdfPage === issuePages[index]
      && text(issue.locator.item) && issue.locator.url === PDF_URL + '#page=' + issuePages[index])) return false;
  const provenance = data.provenance;
  if (!keys(provenance, ['originalCaseBasis', 'sourceReview', 'denominatorReview', 'separation'])
    || !text(provenance.originalCaseBasis) || !text(provenance.separation)) return false;
  const reviews = [
    ['sourceReview', 'injured-cell-source-review-2026-10-16', 'ddd9da45609adb401679fc9a1ab081a80d92d0d7eb7b19f2643495db91463869', 'b38dc9e4b2042517a313da31e25220343e68dad2e06a2bf0099fb118eb22954d'],
    ['denominatorReview', 'injured-cell-denominator-review-2026-10-16', 'edd73b89b5970424b346b8f176a29ae78f0fc622981f63013c8c164d403871dc', 'b4cfa5ba1e0577f455d8ec0c19b12d2a0844fe8c1f243d47395f65c0a6b4d3af'],
  ];
  return reviews.every(([key, folder, reportHash, manifestHash]) => keys(provenance[key], ['reportPath', 'reportSha256', 'manifestPath', 'manifestSha256'])
    && provenance[key].reportPath === 'output/' + folder + '/REPORT-v1.md' && provenance[key].reportSha256 === reportHash
    && provenance[key].manifestPath === 'output/' + folder + '/MANIFEST-v1.json' && provenance[key].manifestSha256 === manifestHash);
}

export async function parseInjuredCellData(rawText) {
  if (typeof rawText !== 'string') throw failure('source-type', '來源必須是原始 JSON 文字。');
  if (rawText.length > MAX_BYTES) throw failure('source-size', '來源超過大小上限。');
  const bytes = new TextEncoder().encode(rawText);
  if (bytes.byteLength > MAX_BYTES) throw failure('source-size', '來源超過大小上限。');
  if (bytes.byteLength !== EXPECTED_BYTES) throw failure('source-integrity', '來源位元組與核定版本不同。');
  if (!globalThis.crypto?.subtle?.digest) throw failure('source-crypto', '無法驗證來源指紋。');
  let digest;
  try {
    digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  } catch (error) {
    throw failure('source-crypto', '來源指紋計算失敗。', error);
  }
  const sha256 = Array.from(new Uint8Array(digest), item => item.toString(16).padStart(2, '0')).join('');
  if (sha256 !== EXPECTED_SHA256) throw failure('source-integrity', '來源指紋與核定版本不同。');
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (error) {
    throw failure('source-json', '來源 JSON 無法解析。', error);
  }
  if (!shape(data)) throw failure('source-shape', '來源欄位、身分或未知狀態不符合核定契約。');
  data.sourceIdentity = { datasetId: data.datasetId, version: data.version, sha256 };
  const handle = Object.freeze(Object.create(null));
  catalogues.set(handle, freeze(data));
  return handle;
}

function checkAbort(signal) {
  if (signal?.aborted) throw failure('source-aborted', '來源讀取已取消。');
}

export async function loadInjuredCellData({ fetchImpl = globalThis.fetch, signal } = {}) {
  checkAbort(signal);
  if (typeof fetchImpl !== 'function') throw failure('source-fetch', '無法使用來源讀取功能。');
  let response;
  try {
    // The injected reader may mutate its argument; never expose the private URL object.
    response = await fetchImpl(new URL(SOURCE_URL.href), { cache: 'no-store', signal });
  } catch (error) {
    checkAbort(signal);
    throw failure('source-network', '來源讀取失敗。', error);
  }
  checkAbort(signal);
  if (!response?.ok) throw failure('source-http', '無法讀取核定來源。');
  const advertised = Number(response.headers?.get?.('content-length'));
  if (Number.isFinite(advertised) && advertised > MAX_BYTES) throw failure('source-size', '來源超過大小上限。');
  if (typeof response.arrayBuffer !== 'function') throw failure('source-type', '來源不是位元組資料。');
  let bytes;
  try {
    bytes = await response.arrayBuffer();
  } catch (error) {
    checkAbort(signal);
    throw failure('source-network', '來源內容讀取失敗。', error);
  }
  checkAbort(signal);
  if (!(bytes instanceof ArrayBuffer)) throw failure('source-type', '來源不是位元組資料。');
  if (bytes.byteLength > MAX_BYTES) throw failure('source-size', '來源超過大小上限。');
  let rawText;
  try {
    // Keep a BOM in the text so byte-identity checking rejects it.
    rawText = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch (error) {
    throw failure('source-utf8', '來源不是有效的 UTF-8 文字。', error);
  }
  const handle = await parseInjuredCellData(rawText);
  checkAbort(signal);
  return handle;
}

export function getVerifiedInjuredCellData(handle) {
  return catalogues.get(handle) ?? null;
}

