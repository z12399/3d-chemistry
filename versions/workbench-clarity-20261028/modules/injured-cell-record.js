import { getVerifiedInjuredCellData } from './injured-cell-source.js';
import {
  INJURED_CELL_ACTIVITY_ID,
  INJURED_CELL_CASE_IDS,
  normalizeInjuredCellInput,
  evaluateInjuredCellComparison,
  getInjuredCellCase,
  getInjuredCellSourceEvidence
} from './injured-cell-model.js';

export const INJURED_CELL_SESSION_SCHEMA = 'injured-cell-session/v1';
export const INJURED_CELL_SESSION_LIMITS = Object.freeze({ bytes: 2097152, rounds: 100, text: 10000, provenance: 100000 });
export const INJURED_CELL_CLAIM_IDS = Object.freeze(['unselected', 'method-change', 'method-gap', 'mixed', 'self', 'death']);
export const INJURED_CELL_EVENT_KINDS = Object.freeze([
  'counts-displayed', 'comparison-displayed', 'overview-displayed', 'share-displayed', 'research-displayed',
  'source-activation', 'source-contextmenu', 'fulltext-displayed', 'history-result-displayed'
]);

const WORKING = ['input', 'claim', 'reason', 'observation', 'revision', 'nextEvidence'];
const WRITING = ['reason', 'observation', 'revision', 'nextEvidence'];
const VIEW_SCOPES = ['counts', 'comparison', 'overview', 'share', 'research'];
const VIEW_KINDS = Object.freeze({
  'counts-displayed': 'counts', 'comparison-displayed': 'comparison', 'overview-displayed': 'overview',
  'share-displayed': 'share', 'research-displayed': 'research'
});
const EXPOSURE_KEYS = ['displayedHere', 'sourceActivations', 'sourceContextMenus', 'importedClaims'];
const ORIGIN_KEYS = ['kind', 'fileName', 'originalSetId', 'priorProvenanceRaw', 'importedEventHorizon', 'importedSnapshotHorizon'];
const encoder = new TextEncoder();
const contexts = new WeakMap();
const json = value => JSON.stringify(value, null, 2) + '\n';
const copy = value => JSON.parse(JSON.stringify(value));
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const stable = value => Array.isArray(value) ? '[' + value.map(stable).join(',') + ']' : plain(value)
  ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}' : JSON.stringify(value);
const same = (left, right) => stable(left) === stable(right);
const sameSet = (left, right) => same([...left].sort(), [...right].sort());
function fail(message, code = 'INJURED_CELL_RECORD_INVALID') { const error = new Error(message); error.code = code; throw error; }
function exact(value, keys, label) {
  if (!plain(value) || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key)) || Object.keys(value).some(key => !keys.includes(key))) fail(`${label} 欄位不完整或含未知欄位。`);
}
function text(value, label, maximum = INJURED_CELL_SESSION_LIMITS.text) {
  if (typeof value !== 'string' || value.length > maximum) fail(`${label} 必須是最多 ${maximum} 字元的文字；沒有截短內容。`);
}
function identifier(value, label) { if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value)) fail(`${label} ID 無效。`); }
function list(value, label) { if (!Array.isArray(value)) fail(`${label} 必須是陣列。`); }
function unique(value, label) { if (new Set(value.map(stable)).size !== value.length) fail(`${label} 含重複項目。`); }

// Object inputs must be data, not objects with getters/toJSON callbacks or hidden state.
function jsonData(value, label = '資料', ancestors = new Set(), depth = 0) {
  if (depth > 80) fail(`${label} 巢狀層數過多。`);
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') { if (!Number.isFinite(value)) fail(`${label} 不能含非有限數值。`); return; }
  if (typeof value !== 'object' || (!Array.isArray(value) && !plain(value))) fail(`${label} 只接受普通 JSON 資料。`);
  if (ancestors.has(value)) fail(`${label} 不能含循環引用。`);
  ancestors.add(value);
  const keys = Reflect.ownKeys(value);
  if (keys.some(key => typeof key !== 'string')) fail(`${label} 不能含 symbol 欄位。`);
  if (Array.isArray(value) && (keys.length !== value.length + 1 || keys.some(key => key !== 'length' && !/^(0|[1-9][0-9]*)$/.test(key)))) fail(`${label} 陣列含空洞或額外欄位。`);
  for (const key of keys) {
    if (Array.isArray(value) && key === 'length') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) fail(`${label} 不能含 getter、setter 或隱藏欄位。`);
    jsonData(descriptor.value, label, ancestors, depth + 1);
  }
  ancestors.delete(value);
}

function sourceContext(handle) {
  const catalogue = getVerifiedInjuredCellData(handle);
  if (!catalogue) fail('來源尚未通過核對。', 'INJURED_CELL_RECORD_SOURCE');
  if (contexts.has(handle)) return contexts.get(handle);
  const cases = new Map(), research = new Map();
  for (const caseId of INJURED_CELL_CASE_IDS) {
    const result = getInjuredCellCase(handle, caseId);
    if (!result.ok) fail('原創題設無法解析。');
    cases.set(caseId, result.case);
  }
  for (const item of catalogue.sourceSupplement.contexts) {
    const result = getInjuredCellSourceEvidence(handle, item.id);
    if (!result.ok) fail('來源補充無法解析。');
    research.set(item.id, result.evidence);
  }
  const context = { catalogue, cases, research, sources: new Map(catalogue.sources.map(item => [item.id, item])) };
  contexts.set(handle, context);
  return context;
}
function input(value, handle, caseId = null) {
  const result = normalizeInjuredCellInput(value, handle);
  if (!result.ok) fail(result.issues.map(issue => issue.message).join(' '));
  if (caseId !== null && result.input.caseId !== caseId) fail('更換案例必須另開一輪；沒有改寫原輪次。');
  return result.input;
}
function working(value, handle, caseId, label) {
  exact(value, WORKING, label); input(value.input, handle, caseId);
  if (!INJURED_CELL_CLAIM_IDS.includes(value.claim)) fail(`${label} 有未知初判類別。`);
  for (const key of WRITING) text(value[key], `${label}/${key}`);
}
const firstAnswered = value => value.claim !== 'unselected' || value.reason.trim() !== '';
const emptyExposure = () => Object.fromEntries(EXPOSURE_KEYS.map(key => [key, []]));
function defaultInput(caseId) { return { caseId, numeratorId: 'r-before', denominatorId: 'r-after', shareDenominatorId: 'r-after' }; }
function blankWorking(caseId) { return { input: defaultInput(caseId), claim: 'unselected', reason: '', observation: '', revision: '', nextEvidence: '' }; }
function newRound(roundId, caseId) { return { roundId, caseId, working: blankWorking(caseId), initial: null, revisions: [], events: [] }; }
const nextId = (items, prefix) => { let n = 1; while (items.includes(`${prefix}${n}`)) n++; return `${prefix}${n}`; };
const localOrigin = setId => ({ kind: 'local', fileName: '', originalSetId: setId, priorProvenanceRaw: '', importedEventHorizon: {}, importedSnapshotHorizon: {} });
function selected(session) {
  const set = session.recordSets.find(item => item.setId === session.activeSelection.setId);
  const round = set?.rounds.find(item => item.roundId === session.activeSelection.roundId);
  if (!round) fail('目前輪次不存在。');
  const revision = session.activeSelection.revisionId === null ? null : round.revisions.find(item => item.revisionId === session.activeSelection.revisionId);
  if (session.activeSelection.revisionId !== null && !revision) fail('選取的歷史版本不存在。');
  return { set, round, revision };
}
function historyGuard(session) { if (session.activeSelection.revisionId !== null) fail('歷史版本唯讀；請先回到目前工作稿。'); }
function budget(session) {
  if (session.recordSets.reduce((sum, set) => sum + set.rounds.length, 0) > INJURED_CELL_SESSION_LIMITS.rounds) fail('工作階段超過 100 輪；原工作保留。');
  if (encoder.encode(json(session)).byteLength > INJURED_CELL_SESSION_LIMITS.bytes) fail('工作階段超過 2 MiB；原工作保留。');
}
function referenceValid(ref, context, type) {
  if (typeof ref !== 'string') return false;
  if (type === 'case') return ref.startsWith('case:') && context.cases.has(ref.slice(5));
  if (type === 'context') return ref.startsWith('context:') && context.research.has(ref.slice(8));
  if (type === 'source') return ref.startsWith('source:') && context.sources.has(ref.slice(7));
  return false;
}
function scopeRefs(kind, scopes, refs, chosenInput, context, historyRevision = null, exposureOnly = false) {
  if (!INJURED_CELL_EVENT_KINDS.includes(kind)) fail('未知顯示或來源事件。');
  list(scopes, '顯示範圍'); list(refs, '事件引用'); unique(scopes, '顯示範圍'); unique(refs, '事件引用');
  if (scopes.some(scope => typeof scope !== 'string') || refs.some(ref => typeof ref !== 'string')) fail('範圍及引用必須是字串。');
  if (Object.hasOwn(VIEW_KINDS, kind)) {
    const scope = VIEW_KINDS[kind];
    if (!same(scopes, [scope])) fail('事件與顯示範圍不一致。');
    if (scope === 'research') {
      if (!refs.length || refs.some(ref => !referenceValid(ref, context, 'context'))) fail('來源補充必須引用已核對的研究情境。');
    } else if (!same(refs, [`case:${chosenInput.caseId}`])) fail('原創題設事件引用不一致。');
  } else if (kind === 'source-activation' || kind === 'source-contextmenu') {
    if (!same(scopes, ['source']) || refs.length !== 1 || !referenceValid(refs[0], context, 'source')) fail('來源操作必須引用一筆已核對來源。');
  } else if (kind === 'fulltext-displayed') {
    if (!same(scopes, ['fulltext']) || refs.length) fail('全文顯示範圍無效。');
  } else {
    if (!scopes.length || scopes.some(scope => !VIEW_SCOPES.includes(scope))) fail('歷史結果顯示範圍無效。');
    if (scopes.some(scope => scope !== 'research') && !refs.includes(`case:${chosenInput.caseId}`)) fail('歷史題設引用遺漏。');
    if (scopes.includes('research') && !refs.some(ref => referenceValid(ref, context, 'context'))) fail('歷史研究情境引用遺漏。');
    if (refs.some(ref => ref !== `case:${chosenInput.caseId}` && !referenceValid(ref, context, 'context'))) fail('歷史結果引用未知。');
    if (!scopes.includes('research') && refs.some(ref => ref.startsWith('context:'))) fail('未顯示研究補充卻引用研究情境。');
    if (scopes.every(scope => scope === 'research') && refs.includes(`case:${chosenInput.caseId}`)) fail('研究補充不能混入原創數據引用。');
    if (!exposureOnly) {
      if (!historyRevision || !same(chosenInput, historyRevision.workingSnapshot.input)) fail('歷史結果必須使用該版本的 input。');
      const captured = historyRevision.viewsAtCapture.filter(view => scopes.includes(view.scope));
      if (!sameSet(captured.map(view => view.scope), scopes) || !sameSet([...new Set(captured.flatMap(view => view.refs))], refs)) fail('歷史結果不得回填未保留的顯示範圍或研究引用。');
    }
  }
}
function exposure(value, handle, context, label) {
  exact(value, EXPOSURE_KEYS, label);
  for (const key of EXPOSURE_KEYS) {
    list(value[key], label); unique(value[key], label);
    for (const item of value[key]) {
      exact(item, ['kind', 'input', 'scopes', 'refs'], label); input(item.input, handle);
      scopeRefs(item.kind, item.scopes, item.refs, item.input, context, null, true);
      if (key === 'sourceActivations' && item.kind !== 'source-activation' || key === 'sourceContextMenus' && item.kind !== 'source-contextmenu' || key === 'displayedHere' && ['source-activation', 'source-contextmenu'].includes(item.kind)) fail(`${label} 來源分類不一致。`);
    }
  }
}
function viewsAt(round, chosenInput, horizon) {
  const found = new Map();
  for (const event of round.events.slice(0, horizon)) {
    if (event.historyRevisionId !== null || !Object.hasOwn(VIEW_KINDS, event.kind) || !same(event.input, chosenInput)) continue;
    const scope = VIEW_KINDS[event.kind], previous = found.get(scope) || [];
    found.set(scope, [...new Set([...previous, ...event.refs])].sort());
  }
  return VIEW_SCOPES.filter(scope => found.has(scope)).map(scope => ({ scope, refs: found.get(scope) }));
}
function validateOrigin(origin, setId, rounds, depth = 0) {
  if (depth > 40) fail('匯入來源鏈過深；沒有截短。');
  exact(origin, ORIGIN_KEYS, '紀錄來源');
  if (!['local', 'imported'].includes(origin.kind)) fail('未知紀錄來源。');
  text(origin.fileName, '原檔名', 500); identifier(origin.originalSetId, '原紀錄組'); text(origin.priorProvenanceRaw, '先前來源', INJURED_CELL_SESSION_LIMITS.provenance);
  if (!plain(origin.importedEventHorizon) || !plain(origin.importedSnapshotHorizon)) fail('匯入事件或版本邊界無效。');
  if (origin.kind === 'local') {
    if (origin.fileName !== '' || origin.priorProvenanceRaw !== '' || origin.originalSetId !== setId || Object.keys(origin.importedEventHorizon).length || Object.keys(origin.importedSnapshotHorizon).length) fail('本頁紀錄來源不一致。');
    return;
  }
  const roundIds = rounds.map(round => round.roundId);
  if (!sameSet(Object.keys(origin.importedEventHorizon), roundIds) || !sameSet(Object.keys(origin.importedSnapshotHorizon), roundIds)) fail('匯入邊界必須完整對應每輪。');
  for (const round of rounds) {
    const count = origin.importedEventHorizon[round.roundId], horizon = origin.importedSnapshotHorizon[round.roundId];
    if (!Number.isSafeInteger(count) || count < 0 || count > round.events.length) fail('匯入事件邊界超出輪次。');
    exact(horizon, ['initial', 'revisions'], '匯入版本邊界');
    if (typeof horizon.initial !== 'boolean' || horizon.initial && !round.initial || !Number.isSafeInteger(horizon.revisions) || horizon.revisions < 0 || horizon.revisions > round.revisions.length) fail('匯入版本邊界超出輪次。');
    if (horizon.revisions && !horizon.initial) fail('匯入修訂缺少同時匯入的初判。');
    const firstRequiredEvents = round.initial ? round.initial.eventHorizon + (['manual', 'retain-revision'].includes(round.initial.trigger) ? 0 : 1) : 0;
    if (horizon.initial && firstRequiredEvents > count || round.revisions.slice(0, horizon.revisions).some(revision => revision.eventHorizon > count)) fail('匯入版本先於其必要的事件邊界。');
    if (!horizon.initial && (round.events.slice(0, count).some(event => event.kind !== 'counts-displayed') || round.initial && round.initial.eventHorizon < count)) fail('匯入事件需要同時保留初判邊界。');
  }
  let prior;
  try { prior = JSON.parse(origin.priorProvenanceRaw); } catch { fail('先前來源不是有效 JSON。'); }
  jsonData(prior, '先前來源');
  validateOrigin(prior, origin.originalSetId, rounds, depth + 1);
}

export function createInjuredCellSession(handle) {
  const { catalogue } = sourceContext(handle), setId = 'set1', roundId = 'round1';
  return validateInjuredCellSession({
    schema: INJURED_CELL_SESSION_SCHEMA, activityId: INJURED_CELL_ACTIVITY_ID, sourceIdentity: copy(catalogue.sourceIdentity),
    recordSets: [{ setId, provenance: localOrigin(setId), rounds: [newRound(roundId, INJURED_CELL_CASE_IDS[0])] }],
    activeSelection: { setId, roundId, revisionId: null }
  }, handle);
}

/** All historical rounds and all import boundaries are checked before a copy can escape. */
export function validateInjuredCellSession(raw, handle) {
  const context = sourceContext(handle);
  if (typeof raw === 'string' && encoder.encode(raw).byteLength > INJURED_CELL_SESSION_LIMITS.bytes) fail('工作階段超過 2 MiB。');
  let value;
  try { value = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { fail('工作階段不是有效 JSON。'); }
  jsonData(value, '工作階段');
  exact(value, ['schema', 'activityId', 'sourceIdentity', 'recordSets', 'activeSelection'], '工作階段');
  if (value.schema !== INJURED_CELL_SESSION_SCHEMA || value.activityId !== INJURED_CELL_ACTIVITY_ID) fail('不支援工作階段版本或活動。');
  exact(value.sourceIdentity, ['datasetId', 'version', 'sha256'], '來源識別');
  if (['datasetId', 'version', 'sha256'].some(key => value.sourceIdentity[key] !== context.catalogue.sourceIdentity[key])) fail('來源識別與目前已核對的資料不同。');
  list(value.recordSets, '紀錄組');
  if (!value.recordSets.length || value.recordSets.length > INJURED_CELL_SESSION_LIMITS.rounds) fail('紀錄組數量無效。');
  unique(value.recordSets.map(set => set?.setId), '紀錄組');
  let count = 0;
  for (const set of value.recordSets) {
    exact(set, ['setId', 'provenance', 'rounds'], '紀錄組'); identifier(set.setId, '紀錄組'); list(set.rounds, '輪次');
    if (!set.rounds.length) fail('紀錄組沒有輪次。');
    count += set.rounds.length; if (count > INJURED_CELL_SESSION_LIMITS.rounds) fail('工作階段超過 100 輪。');
    unique(set.rounds.map(round => round?.roundId), '輪次');
    for (const round of set.rounds) {
      exact(round, ['roundId', 'caseId', 'working', 'initial', 'revisions', 'events'], '輪次'); identifier(round.roundId, '輪次');
      if (!context.cases.has(round.caseId)) fail('未知案例。');
      working(round.working, handle, round.caseId, '目前工作稿');
      list(round.revisions, '修訂'); unique(round.revisions.map(revision => revision?.revisionId), '修訂'); list(round.events, '事件');
      if (round.initial !== null) {
        const first = round.initial;
        exact(first, ['input', 'claim', 'reason', 'trigger', 'answered', 'eventHorizon', 'exposureBefore'], '初判');
        input(first.input, handle, round.caseId); text(first.reason, '初判理由');
        if (!INJURED_CELL_CLAIM_IDS.includes(first.claim) || !['manual', 'retain-revision', ...INJURED_CELL_EVENT_KINDS.filter(kind => kind !== 'counts-displayed')].includes(first.trigger)) fail('初判類別或觸發無效。');
        if (typeof first.answered !== 'boolean' || first.answered !== firstAnswered(first)) fail('初判作答狀態不一致。');
        if (round.working.claim !== first.claim || round.working.reason !== first.reason) fail('初判與理由已固定；沒有改寫原判。');
        if (!Number.isSafeInteger(first.eventHorizon) || first.eventHorizon < 0 || first.eventHorizon > round.events.length || round.events.slice(0, first.eventHorizon).some(event => event.kind !== 'counts-displayed')) fail('初判事件邊界無效。');
        exposure(first.exposureBefore, handle, context, '初判先見');
      } else if (round.revisions.length || round.events.some(event => event.kind !== 'counts-displayed')) fail('非題設顯示或修訂缺少固定初判。');
      for (const revision of round.revisions) {
        exact(revision, ['revisionId', 'workingSnapshot', 'eventHorizon', 'viewsAtCapture', 'exposureAtCapture'], '修訂'); identifier(revision.revisionId, '修訂');
        working(revision.workingSnapshot, handle, round.caseId, '修訂工作稿');
        if (!round.initial || revision.workingSnapshot.claim !== round.initial.claim || revision.workingSnapshot.reason !== round.initial.reason) fail('修訂改寫了固定初判。');
        if (!Number.isSafeInteger(revision.eventHorizon) || revision.eventHorizon < round.initial.eventHorizon || revision.eventHorizon > round.events.length) fail('修訂事件邊界無效。');
        list(revision.viewsAtCapture, '修訂顯示範圍');
        for (const view of revision.viewsAtCapture) { exact(view, ['scope', 'refs'], '修訂顯示範圍'); list(view.refs, '修訂顯示引用'); }
        exposure(revision.exposureAtCapture, handle, context, '修訂先見');
      }
      for (const [index, event] of round.events.entries()) {
        exact(event, ['sequence', 'kind', 'input', 'scopes', 'refs', 'detail', 'historyRevisionId'], '事件');
        if (event.sequence !== index + 1) fail('事件序列無效。');
        input(event.input, handle, round.caseId); text(event.detail, '事件說明', 5000);
        let history = null;
        if (event.historyRevisionId !== null) {
          history = round.revisions.find(revision => revision.revisionId === event.historyRevisionId);
          if (!history || history.eventHorizon >= event.sequence || !same(event.input, history.workingSnapshot.input)) fail('歷史事件的版本、順序或 input 不一致。');
          if (Object.hasOwn(VIEW_KINDS, event.kind)) fail('歷史結果必須明示 history-result-displayed。');
        } else if (event.kind === 'history-result-displayed') fail('歷史事件缺少版本識別。');
        scopeRefs(event.kind, event.scopes, event.refs, event.input, context, history);
      }
      if (round.initial && !['manual', 'retain-revision'].includes(round.initial.trigger)) {
        const firstEvent = round.events[round.initial.eventHorizon];
        if (!firstEvent || firstEvent.kind !== round.initial.trigger || !same(firstEvent.input, round.initial.input)) fail('初判與首次揭示事件不一致。');
      }
      let priorHorizon = -1;
      for (const revision of round.revisions) {
        if (revision.eventHorizon < priorHorizon || !same(revision.viewsAtCapture, viewsAt(round, revision.workingSnapshot.input, revision.eventHorizon))) fail('修訂顯示範圍與當時 input／事件不一致。');
        priorHorizon = revision.eventHorizon;
      }
    }
    validateOrigin(set.provenance, set.setId, set.rounds);
  }
  exact(value.activeSelection, ['setId', 'roundId', 'revisionId'], '目前選取');
  selected(value); budget(value);
  return copy(value);
}

const importedEvent = (set, round, event) => set.provenance.kind === 'imported' && event.sequence <= set.provenance.importedEventHorizon[round.roundId];
function importedSnapshot(set, round, revision = null) {
  if (set.provenance.kind !== 'imported') return false;
  const horizon = set.provenance.importedSnapshotHorizon[round.roundId];
  return revision ? round.revisions.indexOf(revision) < horizon.revisions : horizon.initial;
}
const exposureEntry = event => ({ kind: event.kind, input: copy(event.input), scopes: copy(event.scopes), refs: copy(event.refs) });
function collectedExposure(session) {
  const result = emptyExposure(), seen = Object.fromEntries(EXPOSURE_KEYS.map(key => [key, new Set()]));
  const add = (kind, item) => { const signature = stable(item); if (!seen[kind].has(signature)) { result[kind].push(copy(item)); seen[kind].add(signature); } };
  for (const set of session.recordSets) for (const round of set.rounds) {
    if (importedSnapshot(set, round) && round.initial) for (const items of Object.values(round.initial.exposureBefore)) for (const item of items) add('importedClaims', item);
    for (const revision of round.revisions) if (importedSnapshot(set, round, revision)) for (const items of Object.values(revision.exposureAtCapture)) for (const item of items) add('importedClaims', item);
    for (const event of round.events) {
      const key = importedEvent(set, round, event) ? 'importedClaims' : event.kind === 'source-activation' ? 'sourceActivations' : event.kind === 'source-contextmenu' ? 'sourceContextMenus' : 'displayedHere';
      add(key, exposureEntry(event));
    }
  }
  return result;
}
function freezeInitial(session, round, trigger) {
  if (round.initial) return;
  round.initial = { input: copy(round.working.input), claim: round.working.claim, reason: round.working.reason, trigger, answered: firstAnswered(round.working), eventHorizon: round.events.length, exposureBefore: collectedExposure(session) };
}

export function updateInjuredCellSession(session, action, handle) {
  const next = validateInjuredCellSession(session, handle), context = sourceContext(handle);
  jsonData(action, '操作'); if (!plain(action) || typeof action.type !== 'string') fail('操作無效。');
  const { set, round, revision } = selected(next);
  switch (action.type) {
    case 'working': {
      exact(action, ['type', 'patch'], '工作稿操作'); historyGuard(next);
      if (!plain(action.patch) || Object.keys(action.patch).some(key => !WORKING.includes(key))) fail('未知工作稿欄位。');
      if (round.initial && ['claim', 'reason'].some(key => Object.hasOwn(action.patch, key) && action.patch[key] !== round.initial[key])) fail('初判與理由已固定；後續想法請寫入修訂。');
      if (Object.hasOwn(action.patch, 'input')) input(action.patch.input, handle, round.caseId);
      for (const [key, value] of Object.entries(action.patch)) round.working[key] = copy(value);
      break;
    }
    case 'freeze-initial':
      exact(action, ['type', 'trigger'], '固定初判操作'); historyGuard(next);
      if (action.trigger !== 'manual') fail('手動固定初判的 trigger 必須是 manual。');
      freezeInitial(next, round, action.trigger); break;
    case 'expose': {
      exact(action, ['type', 'kind', 'input', 'scopes', 'refs', 'detail'], '顯示操作');
      input(action.input, handle, round.caseId);
      const visibleInput = revision ? revision.workingSnapshot.input : round.working.input;
      if (!same(action.input, visibleInput)) fail('顯示事件 input 與當時選取不同；未記成另一份結果。');
      if (revision && Object.hasOwn(VIEW_KINDS, action.kind)) fail('歷史結果必須明示 history-result-displayed。');
      if (!revision && action.kind === 'history-result-displayed') fail('請先選取實際歷史版本。');
      scopeRefs(action.kind, action.scopes, action.refs, action.input, context, revision); text(action.detail, '事件說明', 5000);
      if (action.kind !== 'counts-displayed') freezeInitial(next, round, action.kind);
      const content = { kind: action.kind, input: copy(action.input), scopes: copy(action.scopes), refs: copy(action.refs), detail: action.detail, historyRevisionId: revision?.revisionId ?? null };
      const last = round.events.at(-1);
      if (!last || importedEvent(set, round, last) || !same(Object.fromEntries(Object.keys(content).map(key => [key, last[key]])), content)) round.events.push({ sequence: round.events.length + 1, ...content });
      break;
    }
    case 'retain-revision': {
      exact(action, ['type'], '保留版本操作'); historyGuard(next); freezeInitial(next, round, 'retain-revision');
      const content = { workingSnapshot: copy(round.working), eventHorizon: round.events.length, viewsAtCapture: viewsAt(round, round.working.input, round.events.length), exposureAtCapture: collectedExposure(next) };
      const last = round.revisions.at(-1);
      if (!last || importedSnapshot(set, round, last) || !same(Object.fromEntries(Object.keys(content).map(key => [key, last[key]])), content)) round.revisions.push({ revisionId: nextId(round.revisions.map(item => item.revisionId), 'revision'), ...content });
      break;
    }
    case 'new-round': {
      exact(action, ['type', 'caseId'], '新輪操作'); if (!INJURED_CELL_CASE_IDS.includes(action.caseId)) fail('未知案例。');
      let target = next.recordSets.find(item => item.provenance.kind === 'local');
      if (!target) { const setId = nextId(next.recordSets.map(item => item.setId), 'set'); target = { setId, provenance: localOrigin(setId), rounds: [] }; next.recordSets.push(target); }
      const roundId = nextId(target.rounds.map(item => item.roundId), 'round');
      target.rounds.push(newRound(roundId, action.caseId)); next.activeSelection = { setId: target.setId, roundId, revisionId: null }; break;
    }
    case 'select':
      exact(action, ['type', 'setId', 'roundId', 'revisionId'], '選取操作'); next.activeSelection = { setId: action.setId, roundId: action.roundId, revisionId: action.revisionId }; break;
    default: fail('不支援這個操作。');
  }
  return validateInjuredCellSession(next, handle);
}

export function serializeInjuredCellSession(session, handle) { return json(validateInjuredCellSession(session, handle)); }
export function mergeInjuredCellSession(base, incomingRaw, handle, options = {}) {
  jsonData(options, '匯入選項'); if (!plain(options) || Object.keys(options).some(key => key !== 'fileName')) fail('未知匯入選項。');
  const fileName = Object.hasOwn(options, 'fileName') ? options.fileName : ''; text(fileName, '原檔名', 500);
  const next = validateInjuredCellSession(base, handle), incoming = validateInjuredCellSession(incomingRaw, handle);
  for (const original of incoming.recordSets) {
    const set = copy(original), setId = nextId(next.recordSets.map(item => item.setId), 'set'); set.setId = setId;
    set.provenance = {
      kind: 'imported', fileName, originalSetId: original.setId, priorProvenanceRaw: JSON.stringify(original.provenance),
      importedEventHorizon: Object.fromEntries(set.rounds.map(round => [round.roundId, round.events.length])),
      importedSnapshotHorizon: Object.fromEntries(set.rounds.map(round => [round.roundId, { initial: !!round.initial, revisions: round.revisions.length }]))
    };
    next.recordSets.push(set);
  }
  return validateInjuredCellSession(next, handle);
}

const CLAIM_LABELS = Object.freeze({ unselected: '未選', 'method-change': '同一方法的前後變化', 'method-gap': '同一時點的方法差', mixed: '方法與時間都不同', self: '同一格與自己比較', death: '直接解讀為死亡' });
const SCOPE_LABELS = Object.freeze({ counts: '原創四格題設', comparison: '所選比較', overview: '前後與方法差總覽', share: '百分比分母', research: '出版來源補充', source: '來源連結', fulltext: '完整紀錄文字' });
const boundary = '本活動的原創四格題設預設可見；以下保留計算前想法與後續操作，不是盲測。實際顯示範圍以事件及來源分類為準。原創 CFU/g 與出版研究分類分開，沒有短答評分、學會的宣告、死亡或受傷比例鑑定。顯示或啟動不表示閱讀／理解；匯入不視為本頁觀測。';
function inputText(value) { return `案例：${value.caseId}；分子：${value.numeratorId}；分母：${value.denominatorId}；差額分母：${value.shareDenominatorId}`; }
function workingText(value) {
  return `${inputText(value.input)}\n使用者初判：${CLAIM_LABELS[value.claim]} [${value.claim}]\n理由：${value.reason || '未填'}\n觀察：${value.observation || '未填'}\n修訂：${value.revision || '未填'}\n下一份證據：${value.nextEvidence || '未填'}`;
}
function exposureText(value, imported = false) {
  const labels = { displayedHere: imported ? '原檔自述的本頁顯示' : '本頁顯示', sourceActivations: imported ? '原檔自述的來源啟動' : '來源啟動', sourceContextMenus: imported ? '原檔自述的來源選單' : '來源選單', importedClaims: imported ? '原檔保存的匯入自述' : '匯入自述' };
  return (imported ? '以下為匯入檔自述（保留原分類，不視為本頁觀測）。\n' : '') + EXPOSURE_KEYS.map(key => `${labels[key]}：${value[key].length ? value[key].map(item => `[${item.kind}] ${inputText(item.input)}；${item.scopes.map(scope => SCOPE_LABELS[scope]).join('、')}；${item.refs.join('、') || '無來源引用'}`).join('\n') : '無此紀錄'}`).join('\n');
}
function firstText(set, round) {
  const first = round.initial;
  if (!first) return '初判尚未固定；目前為工作稿。四格題設是否顯示依事件紀錄，不宣稱盲測。';
  const imported = importedSnapshot(set, round);
  return `固定初判${imported ? '（匯入檔自述）' : '（本頁保留）'}：題設預設可見、計算前的想法；實際先見範圍列於下方；trigger=${first.trigger}\n${first.answered ? '已留下初判或理由' : '未作答先看；不算首次作答結果'}\n${inputText(first.input)}\n使用者初判：${CLAIM_LABELS[first.claim]} [${first.claim}]\n理由：${first.reason || '未填'}\n${exposureText(first.exposureBefore, imported)}`;
}
function computedText(chosenInput, scopes, handle) {
  const result = evaluateInjuredCellComparison(chosenInput, handle);
  if (!result.ok) fail('歷史 input 的算術無法重算；沒有改用目前控制。');
  const parts = [];
  if (scopes.includes('counts')) { const data = getInjuredCellCase(handle, chosenInput.caseId); parts.push(`原創題設 ${data.case.originLabel}\n${JSON.stringify(data.case.counts)} ${data.case.unit}`); }
  if (scopes.includes('comparison')) parts.push('當時所選比較（以保存 input 重算）：\n' + JSON.stringify(result.comparison, null, 2));
  if (scopes.includes('overview')) parts.push('當時前後與方法差總覽（以保存案例重算）：\n' + JSON.stringify(result.summary, null, 2));
  if (scopes.includes('share')) parts.push('當時百分比分母（未知仍保留 null／unknown）：\n' + JSON.stringify(result.share, null, 2));
  return parts.join('\n');
}
function eventText(set, round, event, handle) {
  return `事件 ${event.sequence} ${event.kind}｜${importedEvent(set, round, event) ? '匯入檔自述' : '本頁紀錄'}${event.historyRevisionId ? `｜歷史版本 ${event.historyRevisionId}` : ''}\n${inputText(event.input)}\n範圍：${event.scopes.map(scope => SCOPE_LABELS[scope]).join('、')}\n引用：${event.refs.join('、') || '無'}\n${event.detail}\n${computedText(event.input, event.scopes, handle)}`;
}
function revisionText(set, round, revision, handle) {
  const imported = importedSnapshot(set, round, revision);
  return `保留版本 ${revision.revisionId}${imported ? '（匯入檔自述）' : '（本頁保留）'}\n${workingText(revision.workingSnapshot)}\n當時已顯示範圍：${revision.viewsAtCapture.map(view => `${SCOPE_LABELS[view.scope]} [${view.refs.join('、')}]`).join('；') || '尚無相同 input 的結果顯示紀錄'}\n${computedText(revision.workingSnapshot.input, revision.viewsAtCapture.map(view => view.scope), handle)}\n${exposureText(revision.exposureAtCapture, imported)}`;
}
function heading(set, round, context) { return `${set.setId}/${round.roundId}｜${context.cases.get(round.caseId).label}${set.provenance.kind === 'imported' ? '｜紀錄組由匯入建立，可含後續本頁操作' : ''}`; }
function collectRefs(value, refs = new Set()) {
  if (Array.isArray(value)) for (const item of value) collectRefs(item, refs);
  else if (plain(value)) for (const [key, item] of Object.entries(value)) {
    if (key === 'refs' && Array.isArray(item)) for (const ref of item) refs.add(ref);
    else collectRefs(item, refs);
  }
  return refs;
}
function referenceAppendix(refs, context) {
  const parts = [];
  for (const ref of refs) {
    if (ref.startsWith('case:')) parts.push(`原創題設原記錄 ${ref}\n${JSON.stringify(context.cases.get(ref.slice(5)), null, 2)}`);
    else if (ref.startsWith('context:')) parts.push(`出版來源補充原記錄 ${ref}（不改寫原分類、來源字串或未知）\n${JSON.stringify(context.research.get(ref.slice(8)), null, 2)}`);
    else parts.push(`來源原記錄 ${ref}\n${JSON.stringify(context.sources.get(ref.slice(7)), null, 2)}`);
  }
  return parts.length ? '\n\n本次文字所引用的原始記錄\n' + parts.join('\n\n') : '';
}

export function injuredCellFullText(session, handle) {
  const value = validateInjuredCellSession(session, handle), context = sourceContext(handle), refs = collectRefs(value);
  const parts = [boundary, `來源識別：${JSON.stringify(value.sourceIdentity)}`, `目前選取：${JSON.stringify(value.activeSelection)}`];
  for (const set of value.recordSets) {
    parts.push(`紀錄來源 ${set.setId}\n${JSON.stringify(set.provenance, null, 2)}`);
    for (const round of set.rounds) {
      refs.add(`case:${round.caseId}`);
      parts.push(heading(set, round, context), firstText(set, round), ...round.events.map(event => eventText(set, round, event, handle)), ...round.revisions.map(revision => revisionText(set, round, revision, handle)), `目前工作稿（含未保留文字${set.provenance.kind === 'imported' ? '及可能的匯入後續寫' : ''}）\n${workingText(round.working)}`);
    }
  }
  return parts.join('\n\n') + referenceAppendix(refs, context) + '\n';
}

export function buildInjuredCellSummary(session, handle, cursor = {}) {
  const value = validateInjuredCellSession(session, handle), context = sourceContext(handle);
  jsonData(cursor, '筆記游標'); if (!plain(cursor)) fail('筆記游標無效。');
  const next = copy(cursor), parts = [], refs = new Set(), keys = new Set(value.recordSets.flatMap(set => set.rounds.map(round => `${set.setId}/${round.roundId}`)));
  if (Object.keys(next).some(key => !keys.has(key))) fail('筆記游標引用未知輪次。');
  for (const set of value.recordSets) for (const round of set.rounds) {
    const key = `${set.setId}/${round.roundId}`, prior = Object.hasOwn(next, key) ? next[key] : { initial: false, revisions: 0, events: 0, workingSignature: '' };
    exact(prior, ['initial', 'revisions', 'events', 'workingSignature'], '筆記游標');
    if (typeof prior.initial !== 'boolean' || prior.initial && !round.initial || !Number.isSafeInteger(prior.revisions) || prior.revisions < 0 || prior.revisions > round.revisions.length || !Number.isSafeInteger(prior.events) || prior.events < 0 || prior.events > round.events.length) fail('筆記游標超出保留紀錄。');
    text(prior.workingSignature, '工作稿游標', 300000);
    if (prior.workingSignature !== '') {
      let old; try { old = JSON.parse(prior.workingSignature); } catch { fail('工作稿游標不是有效 JSON。'); }
      jsonData(old, '工作稿游標'); working(old, handle, round.caseId, '工作稿游標');
    }
    const lines = [];
    if (round.initial && !prior.initial) { lines.push(firstText(set, round)); collectRefs(round.initial, refs); }
    for (const event of round.events.slice(prior.events)) { lines.push(eventText(set, round, event, handle)); collectRefs(event, refs); }
    for (const revision of round.revisions.slice(prior.revisions)) { lines.push(revisionText(set, round, revision, handle)); collectRefs(revision, refs); }
    const workingSignature = JSON.stringify(round.working);
    if (workingSignature !== prior.workingSignature) lines.push(`目前工作稿（含尚未保留文字${set.provenance.kind === 'imported' ? '；由匯入建立，可含本頁續寫' : ''}）\n${workingText(round.working)}`);
    if (lines.length) {
      refs.add(`case:${round.caseId}`);
      parts.push(`${heading(set, round, context)}\n來源 ${value.sourceIdentity.datasetId}/${value.sourceIdentity.version}/${value.sourceIdentity.sha256}\n${lines.join('\n\n')}`);
      next[key] = { initial: !!round.initial, revisions: round.revisions.length, events: round.events.length, workingSignature };
    }
  }
  return { text: parts.length ? boundary + '\n\n' + parts.join('\n\n') + referenceAppendix(refs, context) : '', cursor: next };
}
