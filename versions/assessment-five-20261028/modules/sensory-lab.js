import {escapeHTML as esc} from './storage.js';
import {SENSORY_EXPERIMENT_IDS, SENSORY_STIMULI, SENSORY_SOURCES, SENSORY_SCENARIOS, createSensoryScenario, evaluateActivityValue, compareActivityValues} from './sensory-threshold-model.js';
import {SENSORY_TASTE_STUDY} from './sensory-taste-data.js';
export {SENSORY_EXPERIMENT_IDS} from './sensory-threshold-model.js';

let instance = 0;
const channels = {taste: '味覺', smell: '嗅覺', chemesthesis: '口腔化學刺激感'};
const predictions = {possible: '可以相除', incompatible: '不能直接相除'};
const rankings = {left: 'A 較高', right: 'B 較高', equal: '相同', incompatible: '不能直接排名'};
const phaseLabel = value => ({liquid: '液相', gas: '氣相'}[value] ?? value ?? '未註明相態');
const routeLabel = value => ({orthonasal: '鼻前嗅覺', retronasal: '鼻後嗅覺', taste: '味覺'}[value] ?? value ?? '未註明路徑');
const typeLabel = value => ({detection: '偵測閾值', recognition: '辨認閾值'}[value] ?? value ?? '未註明閾值類型');
const fmt = value => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  if (value !== 0 && (Math.abs(value) < .001 || Math.abs(value) >= 1e7)) return value.toExponential(3);
  return value.toLocaleString('en-US', {maximumSignificantDigits: 5});
};
const blankDraft = () => ({choice: '', checked: false, revealed: false, referenceSeen: false, checkedSeen: false});
const mark = (draft, labels) => `${draft.choice ? `自己的選擇：${labels[draft.choice] ?? draft.choice}（${draft.checked ? '已核對' : '未核對'}）` : '尚未自行作答'}${draft.referenceSeen ? '；曾查看參考' : ''}`;
const issues = result => (result.comparisonIssues ?? []).map(item => item.message).join('；');
const metadata = part => `${part.matrix} · ${phaseLabel(part.phase)}`;
const thresholdMetadata = record => `${typeLabel(record.threshold.thresholdType)} · ${routeLabel(record.threshold.route)}`;
const ratioName = record => record.threshold.thresholdType === 'detection' ? '偵測 OAV' : '辨認閾值比 c/T';
const raw = part => `${fmt(part.value)} ${part.unit}`;
const recordText = record => `${record.label}：C = ${raw(record.concentration)}（${metadata(record.concentration)}）；T = ${raw(record.threshold)}（${metadata(record.threshold)}；${thresholdMetadata(record)}）`;
const sourceList = sources => sources.filter(source => /^https:\/\//.test(source.url)).map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></li>`).join('');

// Page-lifetime ownership: one active view for each owner/key; no browser storage.
const owners = new WeakMap(), containers = new WeakMap();
function acquire(container, id, options, create) {
  const owner = options.draftOwner, usable = owner !== null && (typeof owner === 'object' || typeof owner === 'function');
  const key = options.draftKey ?? `${id}:${options.startStep ?? 'basis'}`;
  let slots;
  if (usable) { slots = owners.get(owner); if (!slots) owners.set(owner, slots = new Map()); }
  let memory = slots?.get(key);
  if (memory && memory.id !== id) throw new RangeError('Sensory draft key belongs to another activity');
  if (!memory) {
    memory = {id, data: create(), saved: new Map(), writing: new Map(), history: [], disclosures: {}, pending: null, status: '', active: null};
    slots?.set(key, memory);
  }
  containers.get(container)?.dispose(); memory.active?.dispose();
  return memory;
}
function attachView(container, memory, render, dispose) {
  const view = {render, dispose}; memory.active = view; containers.set(container, view);
  return () => { if (memory.active === view) memory.active = null; if (containers.get(container) === view) containers.delete(container); };
}
function journalMarkup(prefix, canSave, reviewHref) {
  const href = typeof reviewHref === 'string' && /^#(?:learn|process|micro)\/review$/.test(reviewHref) ? reviewHref : '#learn/review';
  return `<details class="sn-details" data-sn-disclosure="writing"><summary>寫下自己的解釋（選填）</summary><div class="sn-detail-body">
    <p class="sn-note">按保留後，原文與首次編寫時的條件固定保存；之後可另寫修訂。這裡不自動評分。</p>
    <label for="${prefix}-draft">我的原始解釋<textarea id="${prefix}-draft" data-sn-write="draft"></textarea></label>
    <button type="button" data-sn-action="retain-original">保留這份原文</button><p class="sn-note" data-sn-writing-context></p>
    <details data-sn-disclosure="original"><summary>查看已保留原文與當時條件</summary><pre class="sn-raw" data-sn-original></pre></details>
    <label for="${prefix}-revision">我的修訂<textarea id="${prefix}-revision" data-sn-write="revision" disabled></textarea></label>
    <p class="sn-note" data-sn-stale></p></div></details>
    <details class="sn-details" data-sn-disclosure="notes"><summary>保留本次判斷</summary><div class="sn-detail-body">
    <p class="sn-note">切換情境或暫時離開本課會保留本頁草稿；重新整理後須從已存筆記查看。首次存目前情境，之後只追加變更。</p>
    <label for="${prefix}-summary">完整摘要<textarea id="${prefix}-summary" data-sn-summary readonly></textarea></label>
    <label for="${prefix}-delta">這次將追加的內容<textarea id="${prefix}-delta" data-sn-delta readonly></textarea></label>
    <div class="sn-actions"><button type="button" data-sn-action="select-summary">選取完整摘要</button><button type="button" data-sn-action="select-delta">選取待存內容</button>${canSave ? '<button type="button" class="sn-primary" data-sn-action="save-summary">存到本課筆記</button>' : ''}</div>
    <p class="sn-feedback" role="status" data-sn-save-status></p><label for="${prefix}-history">本頁已成功追加的紀錄<select id="${prefix}-history" data-sn-history><option value="">選擇紀錄</option></select></label><pre class="sn-raw" data-sn-history-text></pre>
    <a href="${esc(href)}">到我的複習查看筆記 →</a></div></details>`;
}
function createJournal(container, memory, {key, parts, context, fingerprint, onSaveSummary, render}) {
  const $ = selector => container.querySelector(selector);
  let selectedHistory = '', historyCount = -1;
  const writer = () => {
    const stateKey = key();
    if (!memory.writing.has(stateKey)) memory.writing.set(stateKey, {draft: '', original: null, revision: '', firstContext: null, lastContext: null, originalContext: null, revisionContext: null, fingerprint: null});
    return memory.writing.get(stateKey);
  };
  // Native <details> changes open synchronously but dispatches toggle later.
  // Restore only at mount; ordinary renders read live disclosure state.
  for (const detail of container.querySelectorAll('[data-sn-disclosure]')) detail.open = Boolean(memory.disclosures[detail.dataset.snDisclosure]);
  function captureDisclosures() {
    for (const detail of container.querySelectorAll('[data-sn-disclosure]')) {
      memory.disclosures[detail.dataset.snDisclosure] = detail.open;
      if (detail.open && detail.dataset.snDisclosure === 'sources') memory.data.sourceSeen = true;
    }
  }
  const snapshot = () => {
    captureDisclosures();
    const body = {...parts()}, state = writer();
    if (state.draft || state.original !== null) {
      body.writingStatus = state.original === null ? '原文狀態：尚未保留的解釋草稿。' : '原文狀態：已保留，不能覆寫。';
      body.writingText = `我的原文（原樣）：\n${state.original ?? state.draft}`;
      body.writingFirstContext = `首次編寫條件：${state.firstContext}`;
      body.writingLastContext = `最近編寫條件：${state.lastContext}`;
      if (state.original !== null) body.writingRetainedContext = `保留原文時條件：${state.originalContext}`;
    }
    if (state.revision) {
      body.revisionText = `我的修訂（原樣）：\n${state.revision}`;
      body.revisionContext = `修訂時條件：${state.revisionContext}`;
    }
    return {key: key(), parts: body, full: Object.values(body).filter(Boolean).join('\n')};
  };
  const delta = snap => {
    const saved = memory.saved.get(snap.key);
    if (!saved) return snap.full;
    const changed = Object.entries(snap.parts).filter(([name, value]) => value !== saved[name]);
    if (Object.hasOwn(saved, 'writingText') && !Object.hasOwn(snap.parts, 'writingText')) changed.push(['writingCleared', '未保留草稿已清空。']);
    if (Object.hasOwn(saved, 'revisionText') && !Object.hasOwn(snap.parts, 'revisionText')) changed.push(['revisionCleared', '修訂已清空。']);
    return changed.length ? [`${snap.parts.title} · 本次變更`, snap.parts.identity, snap.parts.mode, ...changed.filter(([name]) => !['title', 'identity', 'mode'].includes(name)).map(([, value]) => value)].filter(Boolean).join('\n') : '';
  };
  function refresh() {
    const state = writer(), snap = snapshot(), pendingText = delta(snap);
    const draft = $('[data-sn-write="draft"]'), revision = $('[data-sn-write="revision"]');
    if (draft.value !== state.draft) draft.value = state.draft;
    if (revision.value !== state.revision) revision.value = state.revision;
    draft.readOnly = state.original !== null; revision.disabled = state.original === null;
    $('[data-sn-action="retain-original"]').disabled = state.original !== null || !state.draft.trim();
    $('[data-sn-original]').textContent = state.original === null ? '尚未保留原文。' : `${state.original}\n\n首次編寫條件：${state.firstContext}\n保留原文時條件：${state.originalContext}`;
    $('[data-sn-writing-context]').textContent = state.firstContext ? `首次編寫條件：${state.firstContext}` : '尚未開始編寫。首次編寫時會記錄當時已顯示或查看的資料。';
    $('[data-sn-stale]').textContent = state.original !== null && state.fingerprint !== fingerprint() ? '目前條件已改變；已保留原文仍屬於當時條件，可在修訂中說明。' : '';
    $('[data-sn-summary]').value = snap.full; $('[data-sn-delta]').value = pendingText;
    const over = pendingText.length > 10000;
    $('[data-sn-save-status]').textContent = memory.pending ? '正在追加筆記；目前仍可繼續操作。' : over ? '待存內容超過 10,000 字元，尚未送出；完整文字仍保留，可選取複製。' : !pendingText ? '已追加到本課筆記，可到我的複習查看。' : memory.status;
    const save = $('[data-sn-action="save-summary"]'); if (save) save.disabled = Boolean(memory.pending) || !pendingText || over;
    if (historyCount !== memory.history.length) {
      historyCount = memory.history.length;
      $('[data-sn-history]').innerHTML = '<option value="">選擇紀錄</option>' + memory.history.map((item, i) => `<option value="${i}">第 ${i + 1} 次 · ${esc(item.identity)}</option>`).join('');
      $('[data-sn-history]').value = selectedHistory;
    }
  }
  function input(target) {
    const name = target?.dataset?.snWrite;
    if (!['draft', 'revision'].includes(name)) return false;
    const state = writer();
    if ((name === 'draft' && state.original !== null) || (name === 'revision' && state.original === null)) { refresh(); return true; }
    if (target.value === state[name]) return true;
    captureDisclosures();
    state[name] = target.value;
    if (name === 'draft') { state.firstContext ??= context(); state.lastContext = context(); }
    else state.revisionContext = context();
    memory.status = ''; refresh(); return true;
  }
  function save() {
    const snap = snapshot(), text = delta(snap);
    if (!text || text.length > 10000 || memory.pending || typeof onSaveSummary !== 'function') { refresh(); return; }
    const pending = {snap, text}; memory.pending = pending; memory.status = ''; refresh();
    const finish = success => {
      if (memory.pending !== pending) return;
      memory.pending = null;
      if (success === true) {
        memory.saved.set(snap.key, {...snap.parts});
        memory.history.push({identity: snap.parts.identity, submitted: text, full: snap.full}); memory.status = '';
      } else memory.status = '尚未保存；完整摘要與待存内容仍保留，可重試或選取複製。';
      memory.active?.render();
    };
    try {
      const result = onSaveSummary(text);
      if (result !== null && (typeof result === 'object' || typeof result === 'function') && typeof result.then === 'function') Promise.resolve(result).then(finish, () => finish(false));
      else finish(result);
    } catch { finish(false); }
  }
  function action(name) {
    if (name === 'retain-original') {
      captureDisclosures();
      const state = writer(); if (state.original === null && state.draft.trim()) { state.original = state.draft; state.originalContext = context(); state.fingerprint = fingerprint(); memory.status = ''; render(); } return true;
    }
    if (name === 'save-summary') { save(); return true; }
    if (['select-summary', 'select-delta'].includes(name)) { const field = $(name === 'select-summary' ? '[data-sn-summary]' : '[data-sn-delta]'); field.focus(); field.select?.(); return true; }
    return false;
  }
  function change(target) {
    if (!target?.hasAttribute?.('data-sn-history')) return false;
    selectedHistory = target.value;
    const item = /^(?:0|[1-9]\d*)$/.test(selectedHistory) ? memory.history[Number(selectedHistory)] : null;
    $('[data-sn-history-text]').textContent = item ? `當次追加：\n${item.submitted}\n\n當時完整摘要：\n${item.full}` : '';
    return true;
  }
  function toggle(event) {
    const target = event.target; if (!target?.dataset?.snDisclosure || !container.contains(target)) return;
    memory.disclosures[target.dataset.snDisclosure] = target.open;
    if (target.open && target.dataset.snDisclosure === 'sources') { memory.data.sourceSeen = true; refresh(); }
  }
  return {refresh, input, action, change, toggle, capture: captureDisclosures};
}


/** Concept routes and explicitly hypothetical threshold pairs. Writes no browser storage or mastery state. */
export function mountSensoryLab(container, id = 'sensory-channels', options = {}) {
  const {startStep = 'basis', onSaveSummary, reviewHref} = options;
  if (!container || typeof container.querySelector !== 'function' || typeof container.addEventListener !== 'function') throw new TypeError('A DOM container is required');
  if (!SENSORY_EXPERIMENT_IDS.includes(id)) throw new RangeError('Unknown sensory activity');
  if (id === 'sensory-taste-evidence') return mountTasteEvidence(container, {...options, startStep});
  if (!['basis', 'compare'].includes(startStep)) throw new RangeError('Unknown sensory starting step');
  const isChannels = id === 'sensory-channels', prefix = `sensory-${++instance}`, $ = selector => container.querySelector(selector);
  const memory = acquire(container, id, options, () => ({stimulusId: SENSORY_STIMULI[0]?.id, scenarioId: SENSORY_SCENARIOS[0]?.id, sourceSeen: false,
    channelDrafts: Object.fromEntries(SENSORY_STIMULI.map(item => [item.id, blankDraft()])),
    scenarioDrafts: Object.fromEntries(SENSORY_SCENARIOS.map(item => [item.id, {factor: 1, side: 'left', step: startStep, left: blankDraft(), right: blankDraft(), compare: blankDraft()}]))}));
  let disposed = false, {stimulusId, scenarioId} = memory.data;
  const {channelDrafts, scenarioDrafts} = memory.data;
  let {side, step} = scenarioDrafts[scenarioId];
  if (!stimulusId || !scenarioId) throw new Error('Sensory learning data are unavailable');
  const stimulus = () => SENSORY_STIMULI.find(item => item.id === stimulusId);
  const scenario = () => { const item = createSensoryScenario(scenarioId); item.left.concentration.value *= scenarioDrafts[scenarioId].factor; return item; };
  const draft = () => isChannels ? channelDrafts[stimulusId] : scenarioDrafts[scenarioId][step === 'basis' ? side : 'compare'];
  const revealed = () => draft().checked || draft().revealed;
  const choiceButtons = (values, group) => Object.entries(values).map(([value, label]) => `<button type="button" data-sn-choice="${esc(value)}" data-sn-group="${group}" aria-pressed="false">${esc(label)}</button>`).join('');
  const valueBlock = (label, hook) => `<div class="sn-number"><span>${label}</span><strong data-sn-number="${hook}">—</strong><small data-sn-meta="${hook}"></small></div>`;
  container.innerHTML = `<section class="sensory-lab" aria-labelledby="${prefix}-title">
    <header><p class="sn-evidence">${isChannels ? '感覺路徑 · 概念示意' : '原創假想配對 · 非食品實測閾值'}</p><h2 id="${prefix}-title">${isChannels ? '從刺激走到感覺' : '濃度與閾值工作台'}</h2></header>
    <div class="sn-workspace"><div class="sn-task">${isChannels ? `<label for="${prefix}-stimulus">選一個刺激情境<select id="${prefix}-stimulus" data-sn-control="stimulus">${SENSORY_STIMULI.map(item => `<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('')}</select></label>
      <h3 class="sn-question" data-sn-heading tabindex="-1">這個感覺主要經哪個系統？</h3><p class="sn-target" data-sn-target></p>
      <div class="sn-choices" role="group" aria-label="選擇感覺系統">${choiceButtons(channels, 'channel')}</div>` :
    `<label for="${prefix}-scenario">選一組假想情境<select id="${prefix}-scenario" data-sn-control="scenario">${SENSORY_SCENARIOS.map(item => `<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('')}</select></label>
      <nav class="sn-steps" aria-label="活動值步驟"><button type="button" data-sn-step="basis" aria-pressed="false">1 · 核對基準</button><button type="button" data-sn-step="compare" aria-pressed="false">2 · 比較兩筆</button></nav>
      <h3 class="sn-question" data-sn-heading tabindex="-1"></h3>
      <section data-sn-panel="basis"><label class="sn-side" for="${prefix}-side">這次核對<select id="${prefix}-side" data-sn-control="side"><option value="left">示例分子 A</option><option value="right">示例分子 B</option></select></label><div class="sn-numbers">${valueBlock('濃度 C', 'concentration')}${valueBlock('閾值 T', 'threshold')}</div><p class="sn-note" data-sn-threshold-context></p><p class="sn-note" data-sn-basis-context hidden></p><div class="sn-choices" role="group" aria-label="判斷單筆基準">${choiceButtons(predictions, 'basis')}</div></section>
      <section data-sn-panel="compare"><div class="sn-factor"><label for="${prefix}-factor">A 濃度倍率 <output data-sn-factor-value>1 ×</output><input id="${prefix}-factor" data-sn-control="factor" type="range" min="0" max="10" step="0.5" value="1" aria-describedby="${prefix}-factor-scope"></label><button type="button" data-sn-action="reset-factor">還原倍率</button></div><p class="sn-note" id="${prefix}-factor-scope" data-sn-factor-context></p><div class="sn-pair">${['left', 'right'].map((key, index) => `<article class="sn-record"><h4 data-sn-label="${key}">示例分子 ${index ? 'B' : 'A'}</h4><dl><div><dt>C</dt><dd data-sn-raw="${key}-concentration"></dd></div><div><dt>T</dt><dd data-sn-raw="${key}-threshold"></dd></div></dl><p class="sn-note" data-sn-record-meta="${key}"></p></article>`).join('')}</div><div class="sn-choices sn-rank-choices" role="group" aria-label="判斷活動值排名">${choiceButtons(rankings, 'compare')}</div></section>`}
    </div><aside class="sn-current"><div class="sn-actions"><button type="button" class="sn-primary" data-sn-action="check" disabled>核對我的判斷</button><button type="button" class="sn-text" data-sn-action="reference">看參考</button></div>
    <p class="sn-feedback" role="status" data-sn-feedback></p>
    <section class="sn-result" data-sn-result hidden><h4 data-sn-result-title></h4><div data-sn-result-body></div><p class="sn-explanation" data-sn-explanation></p></section>
    ${isChannels ? '<p class="sn-boundary">連接表示感覺路徑；不模擬受體動態、速度或強度。</p>' : '<div class="sn-formula"><p data-sn-formula></p><small data-sn-formula-note></small></div><p class="sn-boundary">活動值不等於感覺強度；也不保證每個人都能察覺。</p>'}
    </aside></div><details class="sn-details" data-sn-disclosure="sources"><summary>條件、界線與來源</summary><div class="sn-detail-body" data-sn-details></div></details>
    ${journalMarkup(prefix, typeof onSaveSummary === 'function', reviewHref)}
  </section>`;

  function equation(record, result) {
    if (!result.usable || !result.convertedUnits) return `${ratioName(record)} = —（這筆濃度與閾值不能直接相除）`;
    const converted = result.convertedUnits;
    return `${ratioName(record)} = ${fmt(converted.concentration)} ${converted.unit} ÷ ${fmt(converted.threshold)} ${converted.unit} = ${fmt(result.value)}`;
  }
  function verdict(expected, labels) {
    const state = draft();
    if (state.revealed && !state.checked) return `參考已展開。${state.choice ? `你的選擇「${labels[state.choice]}」仍保留，尚未核對。` : '尚未自行作答。'}`;
    if (!state.checked) return state.choice ? '已選擇，按「核對我的判斷」查看。' : '';
    return state.choice === expected ? '這次判斷與題設相符。' : `這次判斷需調整：${labels[expected]}。`;
  }
  function renderChannels() {
    const item = stimulus();
    $('[data-sn-target]').textContent = `這次只追蹤：${item.percept}`;
    $('[data-sn-feedback]').textContent = revealed() ? verdict(item.expectedChoice, channels) : draft().choice ? '已選擇，按「核對我的判斷」查看。' : '';
    $('[data-sn-result-title]').textContent = revealed() ? channels[item.expectedChoice] : '';
    $('[data-sn-result-body]').innerHTML = revealed() ? `<ol class="sn-route" aria-label="當前感覺路徑">${item.pathNodes.map(node => `<li>${esc(node)}</li>`).join('')}</ol>` : '';
    $('[data-sn-explanation]').textContent = revealed() ? item.explanation : '';
    const sources = SENSORY_SOURCES.filter(source => item.sourceIds.includes(source.id));
    $('[data-sn-details]').innerHTML = `<p>${esc(item.boundary)}</p><p>五種基本味覺是甜、酸、鹹、苦、鮮；辣與涼的指定感受在本活動歸為化學刺激感。實際食物通常同時牽涉多種感覺。</p><ul>${sourceList(sources)}</ul>`;
  }
  function renderValues() {
    const current = scenario(), record = current[side], result = evaluateActivityValue(record), pair = compareActivityValues(current.left, current.right);
    const isBasis = step === 'basis', shown = revealed();
    const factor = scenarioDrafts[scenarioId].factor;
    $('[data-sn-control="factor"]').value = String(factor);
    $('[data-sn-control="factor"]').setAttribute('aria-valuetext', `${fmt(factor)} 倍`);
    $('[data-sn-factor-value]').textContent = `${fmt(factor)} ×`;
    $('[data-sn-factor-context]').textContent = `${factor === 1 ? '題設原值 · 假想情境' : '修改的假想情境'}。只改 A 濃度；閾值與 B 保持題設，不是新實測。`;
    $('[data-sn-basis-context]').hidden = factor === 1;
    $('[data-sn-basis-context]').textContent = `修改的假想情境：A 原濃度 ${raw(SENSORY_SCENARIOS.find(item => item.id === scenarioId).left.concentration)} × ${fmt(factor)} = ${raw(current.left.concentration)}；T 與 B 不變，不是新實測。`;
    for (const key of ['basis', 'compare']) {
      $(`[data-sn-panel="${key}"]`).hidden = step !== key;
      $(`[data-sn-step="${key}"]`).setAttribute('aria-pressed', String(step === key));
    }
    $('[data-sn-heading]').textContent = isBasis ? '這筆濃度與閾值，能直接相除嗎？' : '這兩筆比值，能排名嗎？';
    for (const key of ['concentration', 'threshold']) {
      $(`[data-sn-number="${key}"]`).textContent = raw(record[key]);
      $(`[data-sn-meta="${key}"]`).textContent = metadata(record[key]);
    }
    $('[data-sn-threshold-context]').textContent = thresholdMetadata(record);
    for (const key of ['left', 'right']) {
      const value = current[key];
      $(`[data-sn-label="${key}"]`).textContent = value.label;
      for (const part of ['concentration', 'threshold']) $(`[data-sn-raw="${key}-${part}"]`).textContent = `${raw(value[part])} · ${metadata(value[part])}`;
      $(`[data-sn-record-meta="${key}"]`).textContent = thresholdMetadata(value);
    }
    const expected = isBasis ? result.usable ? 'possible' : 'incompatible' : pair.usable ? pair.activityOrder : 'incompatible';
    $('[data-sn-feedback]').textContent = shown ? verdict(expected, isBasis ? predictions : rankings) : draft().choice ? '已選擇，按「核對我的判斷」查看。' : '';
    $('[data-sn-result-title]').textContent = shown ? isBasis ? result.usable ? '基準相容，可以計算' : '基準尚不相容' : pair.usable ? `比值排名：${rankings[pair.activityOrder]}` : '這兩筆不能直接排名' : '';
    $('[data-sn-result-body]').innerHTML = !shown ? '' : isBasis ? result.usable ? `<p class="sn-answer-number">${fmt(result.value)}<small>${ratioName(record)} · 無因次</small></p>` : `<p>${esc(issues(result))}</p>` : `<dl class="sn-pair-results"><div><dt>A 的${ratioName(current.left)}</dt><dd>${pair.left.usable ? fmt(pair.left.value) : '—'}</dd></div><div><dt>B 的${ratioName(current.right)}</dt><dd>${pair.right.usable ? fmt(pair.right.value) : '—'}</dd></div></dl>${pair.usable ? `<p class="sn-note">濃度排序：${esc(rankings[pair.concentrationOrder])}；比值排序：${esc(rankings[pair.activityOrder])}。</p>` : `<p>${esc(issues(pair))}</p>`}`;
    $('[data-sn-explanation]').textContent = shown ? isBasis ? result.interpretation : pair.interpretation : '';
    $('[data-sn-formula]').textContent = !shown ? isBasis ? `${ratioName(record)} = 濃度 C ÷ 對應閾值 T` : '各筆比值 = 濃度 C ÷ 對應閾值 T' : isBasis ? equation(record, result) : `A：${equation(current.left, pair.left)}\nB：${equation(current.right, pair.right)}`;
    $('[data-sn-formula-note]').textContent = shown && !isBasis && !pair.usable ? pair.left.usable && pair.right.usable ? '各筆可計算，不代表兩筆具有可比較的條件；不能據此排名。' : '先處理單筆基準差異，再談兩筆的排名。' : '先核對基質、相態與單位基準，再換成相容單位。OAV 是這些嗅覺假想案例的 odor activity value。';
    const context = current.context, sources = SENSORY_SOURCES.filter(source => ['sensory-source-mixtures-2012', 'sensory-source-oav-niu-2020', 'sensory-source-astm-e679'].includes(source.id));
    $('[data-sn-details]').innerHTML = `<p>原始設定：${esc(current.description)}</p><p>兩個分子是示例 A、B，所有濃度和閾值均為原創假想數字，不是任何物質的通用常數。調整倍率只改 A 的題設濃度。</p>${context ? `<p>${esc(context.label)}${context.conditions ? `：${esc(typeof context.conditions === 'string' ? context.conditions : JSON.stringify(context.conditions))}` : ''}</p>` : ''}<p>單筆計算仍需對應的基質、相態與濃度基準；兩筆排名另外核對閾值定義、感覺路徑及測試條件。單位可換算不代表基質相同。</p><p>本活動不推論混合物的加成、遮蔽或協同，不把 OAV 排名當作喜好或感覺強度排名。</p><ul>${sourceList(sources)}</ul>`;
  }
  const stateKey = () => isChannels ? stimulusId : scenarioId;
  const exposure = () => {
    const answers = isChannels ? [draft()] : ['left', 'right', 'compare'].map(key => scenarioDrafts[scenarioId][key]);
    return `接觸紀錄：${answers.some(item => item.checkedSeen) ? '曾核對並顯示結果' : '尚未核對結果'}；${answers.some(item => item.referenceSeen) ? '曾查看參考' : '尚未查看參考'}；${memory.data.sourceSeen ? '本課曾展開條件與來源' : '本課尚未展開條件與來源'}。`;
  };
  const fingerprint = () => isChannels ? stimulusId : `${scenarioId}:A×${scenarioDrafts[scenarioId].factor}`;
  const context = () => `${isChannels ? stimulus().label : `${scenario().label}；A×${fmt(scenarioDrafts[scenarioId].factor)}；${step === 'basis' ? `核對 ${side === 'left' ? 'A' : 'B'}` : '比較兩筆'}`}；${exposure()}`;
  function summaryParts() {
    if (isChannels) {
      const item = stimulus(), state = draft();
      return {title:'感覺路徑 · 概念示意', identity:`情境：${item.label}`, percept:`指定知覺：${item.percept}`, choice:mark(state, channels), route:revealed() ? `參考路徑：${item.pathNodes.join(' → ')}。${item.explanation}` : '參考路徑尚未展開。', boundary:`界線：${item.boundary}`, exposure:exposure(), mastery:'本次核對或查看參考不代表已掌握。'};
    }
    const current = scenario(), state = scenarioDrafts[scenarioId], pair = compareActivityValues(current.left, current.right);
    const original = SENSORY_SCENARIOS.find(item => item.id === scenarioId);
    const parts = {title:'活動值 · 原創假想配對，非實測', identity:`情境：${current.label}`, focus:`目前操作：${step === 'basis' ? `核對 ${side === 'left' ? 'A' : 'B'}` : '比較兩筆'}`, factor:`${state.factor === 1 ? '題設原值' : '修改的假想情境'}：A 原濃度 ${raw(original.left.concentration)} × ${fmt(state.factor)} = ${raw(current.left.concentration)}；只改 A 濃度，T 與 B 不變。`};
    for (const key of ['left', 'right']) {
      const record = current[key], result = evaluateActivityValue(record), answer = state[key], name = key === 'left' ? 'A' : 'B';
      parts[`${key}Record`] = recordText(record);
      parts[`${key}Choice`] = `${name} 單筆判斷：${mark(answer, predictions)}`;
      parts[`${key}Result`] = answer.checked || answer.revealed ? `${name}：${equation(record, result)}${result.usable ? '' : `；${issues(result)}`}` : `${name} 單筆參考尚未展開。`;
    }
    parts.compare = `兩筆排名：${mark(state.compare, rankings)}`;
    parts.compareResult = state.compare.checked || state.compare.revealed ? `參考：A 的${ratioName(current.left)} = ${pair.left.usable ? fmt(pair.left.value) : '—'}；B 的${ratioName(current.right)} = ${pair.right.usable ? fmt(pair.right.value) : '—'}；${pair.usable ? rankings[pair.activityOrder] : `不排名：${issues(pair)}`}。` : '兩筆排名參考尚未展開。';
    parts.exposure = exposure();
    parts.boundary = '活動值不是感覺強度，也不保證每個人察覺；本次核對或查看參考不代表已掌握。';
    return parts;
  }
  const journal = createJournal(container, memory, {key: stateKey, parts: summaryParts, context, fingerprint, onSaveSummary, render});
  function render() {
    if (disposed) return;
    Object.assign(memory.data, {stimulusId, scenarioId}); Object.assign(scenarioDrafts[scenarioId], {side, step});
    if (isChannels) $('[data-sn-control="stimulus"]').value = stimulusId;
    else { $('[data-sn-control="scenario"]').value = scenarioId; $('[data-sn-control="side"]').value = side; }
    isChannels ? renderChannels() : renderValues();
    const activeGroup = isChannels ? 'channel' : step;
    for (const button of container.querySelectorAll('[data-sn-choice]')) button.setAttribute('aria-pressed', String(button.dataset.snGroup === activeGroup && draft().choice === button.dataset.snChoice));
    $('[data-sn-action="check"]').disabled = !draft().choice;
    $('[data-sn-result]').hidden = !revealed();
    journal.refresh();
  }
  function moveTo(next) {
    if (!['basis', 'compare'].includes(next) || next === step || isChannels) return;
    step = next; render();
    const heading = $('[data-sn-heading]'); heading.focus?.({preventScroll: true}); heading.scrollIntoView?.({block: 'start', behavior: 'instant'});
  }
  function onChange(event) {
    if (disposed) return;
    if (container.contains(event.target) && journal.change(event.target)) return;
    const target = event.target?.closest?.('[data-sn-control]'); if (!target || !container.contains(target)) return;
    const type = target.dataset.snControl, value = target.value;
    if (type === 'factor') { setFactor(target); return; }
    if (type === 'stimulus' && isChannels && Object.hasOwn(channelDrafts, value)) stimulusId = value;
    else if (type === 'scenario' && !isChannels && Object.hasOwn(scenarioDrafts, value)) { scenarioId = value; ({side, step} = scenarioDrafts[scenarioId]); }
    else if (type === 'side' && !isChannels && ['left', 'right'].includes(value)) side = value;
    else { target.value = type === 'stimulus' ? stimulusId : type === 'scenario' ? scenarioId : side; return; }
    render();
  }
  function setFactor(target) {
    if (isChannels || disposed) return;
    const text = target.value, value = typeof text === 'string' && /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ? Number(text) : NaN;
    const state = scenarioDrafts[scenarioId];
    if (!Number.isFinite(value) || value < 0 || value > 10 || !Number.isInteger(value * 2)) { target.value = String(state.factor); return; }
    if (state.factor === value) return;
    state.factor = value;
    for (const key of ['left', 'compare']) Object.assign(state[key], {checked: false, revealed: false});
    render();
  }
  function onInput(event) {
    if (disposed) return;
    if (container.contains(event.target) && journal.input(event.target)) return;
    const target = event.target?.closest?.('[data-sn-control="factor"]');
    if (target && container.contains(target)) setFactor(target);
  }
  function onClick(event) {
    if (disposed) return;
    const target = event.target?.closest?.('button'); if (!target || !container.contains(target) || target.disabled) return;
    if (target.dataset.snStep) { moveTo(target.dataset.snStep); return; }
    const choice = target.dataset.snChoice, group = isChannels ? 'channel' : step;
    if (choice && target.dataset.snGroup === group) {
      const allowed = isChannels ? channels : step === 'basis' ? predictions : rankings;
      if (!Object.hasOwn(allowed, choice)) return;
      Object.assign(draft(), {choice, checked: false, revealed: false}); render(); return;
    }
    const action = target.dataset.snAction;
    if (journal.action(action)) return;
    if (action === 'reset-factor' && !isChannels) { const field = $('[data-sn-control="factor"]'); field.value = '1'; setFactor(field); return; }
    if (action === 'check' && draft().choice) Object.assign(draft(), {checked: true, checkedSeen: true});
    else if (action === 'reference') Object.assign(draft(), {revealed: true, referenceSeen: true});
    else return;
    render();
  }
  function onToggle(event) { if (!disposed) journal.toggle(event); }
  function dispose() { if (disposed) return; journal.capture(); disposed = true; container.removeEventListener('click', onClick); container.removeEventListener('change', onChange); container.removeEventListener('input', onInput); container.removeEventListener('toggle', onToggle, true); release(); }
  const release = attachView(container, memory, render, dispose);
  container.addEventListener('click', onClick); container.addEventListener('change', onChange); container.addEventListener('input', onInput); container.addEventListener('toggle', onToggle, true);
  render(); return dispose;
}

function mountTasteEvidence(container, options) {
  const {startStep, onSaveSummary, reviewHref} = options;
  if (!['basis', 'threshold', 'intensity'].includes(startStep)) throw new RangeError('Unknown taste evidence starting step');
  const study = SENSORY_TASTE_STUDY, prefix = `sensory-${++instance}`, $ = selector => container.querySelector(selector);
  const memory = acquire(container, 'sensory-taste-evidence', options, () => ({sampleId: study.samples[0].id, sourceSeen: false, states: Object.fromEntries(study.samples.map(item => [item.id, {mode: startStep === 'intensity' ? 'intensity' : 'threshold', threshold: blankDraft(), intensity: blankDraft()}]))}));
  let disposed = false, {sampleId} = memory.data;
  const {states} = memory.data;
  let mode = states[sampleId].mode;
  const current = () => study.samples.find(item => item.id === sampleId), draft = () => states[sampleId][mode];
  const labels = {threshold: {limited: '察覺到與認出味質是不同問題', universal: '超過平均值，每個人都能認出'}, intensity: {limited: '只能讀取這三點的群體摘要', universal: '可按濃度倍數預測個人感受'}};
  container.innerHTML = `<section class="sensory-lab" aria-labelledby="${prefix}-title"><header><p class="sn-evidence">已發表研究 · 65 位女性的群體摘要</p><h2 id="${prefix}-title">同一種味，三種量測問題</h2></header>
    <div class="sn-workspace"><div class="sn-task"><label for="${prefix}-sample">代表刺激<select id="${prefix}-sample" data-sn-control="sample">${study.samples.map(item => `<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('')}</select></label>
    <nav class="sn-steps" aria-label="味覺資料模式"><button type="button" data-sn-mode="threshold" aria-pressed="false">偵測與辨認閾值</button><button type="button" data-sn-mode="intensity" aria-pressed="false">超閾值強度</button></nav>
    <h3 class="sn-question" data-sn-heading tabindex="-1"></h3>
    <section data-sn-panel="threshold"><div class="sn-numbers">${['dt', 'rt'].map((key, index) => `<div class="sn-number"><span>${index ? '辨認 RT' : '偵測 DT'}</span><strong data-sn-study="${key}"></strong><small>mM · mean ± SE</small></div>`).join('')}</div><p class="sn-note">DT：察覺有味；RT：認出味質。兩者來自不同判定問題。</p></section>
    <section data-sn-panel="intensity"><p class="sn-note">三個離散濃度的觀測；強度是 gLMS 評分，GM ± SE。</p><table class="sn-observations"><caption data-sn-study-caption></caption><thead><tr><th scope="col">濃度 · mM</th><th scope="col">強度 · gLMS<br><small>GM ± SE</small></th></tr></thead><tbody data-sn-study-rows></tbody></table></section>
    <p class="sn-note sn-study-statistic" data-sn-study-statistic></p></div><aside class="sn-current"><p class="sn-interpretation-question">這份資料支持哪個解讀？</p>
    <div class="sn-choices" role="group" aria-label="判讀味覺研究"><button type="button" data-sn-evidence-choice="limited" aria-pressed="false"></button><button type="button" data-sn-evidence-choice="universal" aria-pressed="false"></button></div>
    <div class="sn-actions"><button type="button" class="sn-primary" data-sn-action="check" disabled>核對我的判斷</button><button type="button" class="sn-text" data-sn-action="reference">看參考</button></div><p class="sn-feedback" role="status" data-sn-feedback></p>
    <p class="sn-boundary">SE 是標準誤，不是 SD 或 95% 信賴區間。這些味覺資料不代入嗅覺 OAV。</p>
    </aside></div><details class="sn-details" data-sn-disclosure="sources"><summary>研究條件、限制與原表</summary><div class="sn-detail-body"><ul>${study.conditions.map(value => `<li>${esc(value)}</li>`).join('')}</ul><ul>${study.limits.map(value => `<li>${esc(value)}</li>`).join('')}</ul><p>${esc(study.citation)}</p><p><a href="${esc(study.sourceUrl)}" target="_blank" rel="noopener noreferrer">閱讀研究原表 3、4 ↗</a> · <a href="${esc(study.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(study.license)} ↗</a></p><p>${esc(study.adaptation)}</p></div></details>
    ${journalMarkup(prefix, typeof onSaveSummary === 'function', reviewHref)}
  </section>`;
  const stateKey = () => `${sampleId}:${mode}`;
  const exposure = () => `接觸紀錄：目前${mode === 'threshold' ? 'DT／RT 研究摘要' : '三點強度研究表'}已在作答前顯示；${draft().checkedSeen ? '曾核對解讀' : '尚未核對解讀'}；${draft().referenceSeen ? '曾查看參考' : '尚未查看參考'}；${memory.data.sourceSeen ? '本課曾展開條件與來源' : '本課尚未展開條件與來源'}。`;
  const context = () => `${current().label}；${mode === 'threshold' ? '偵測與辨認閾值' : '超閾值強度'}；${exposure()}`;
  function summaryParts() {
    const item = current();
    return {title:'味覺研究資料判讀 · Webb et al. (2015)', identity:`代表刺激：${item.label}（${item.compound}）`, mode:`目前模式：${mode === 'threshold' ? '偵測與辨認閾值' : '超閾值強度'}`, evidence:'以下為研究提供的群體摘要，不是自己的量測：',
      data:mode === 'threshold' ? `DT = ${item.dt.displayMean} ± ${item.dt.displaySe} mM；RT = ${item.rt.displayMean} ± ${item.rt.displaySe} mM（mean ± SE）。` : item.intensity.map(point => `${point.displayConcentration} mM：${point.displayGM} ± ${point.displaySe} gLMS（GM ± SE）。`).join('\n'),
      choice:mark(draft(), labels[mode]), exposure:exposure(), boundary:`界線：${study.interpretation}`, source:`來源：${study.sourceUrl}；${study.license}。`, mastery:'本次核對或查看參考不代表已掌握。'};
  }
  const journal = createJournal(container, memory, {key: stateKey, parts: summaryParts, context, fingerprint: stateKey, onSaveSummary, render});
  function render() {
    if (disposed) return;
    memory.data.sampleId = sampleId; states[sampleId].mode = mode;
    $('[data-sn-control="sample"]').value = sampleId;
    const item = current(), state = draft();
    for (const key of ['threshold', 'intensity']) {
      $(`[data-sn-panel="${key}"]`).hidden = key !== mode;
      $(`[data-sn-mode="${key}"]`).setAttribute('aria-pressed', String(key === mode));
    }
    $('[data-sn-heading]').textContent = mode === 'threshold' ? '察覺有味，和認出味質一樣嗎？' : '濃度升高，群體評分如何改變？';
    for (const key of ['dt', 'rt']) $(`[data-sn-study="${key}"]`).textContent = `${item[key].displayMean} ± ${item[key].displaySe}`;
    $('[data-sn-study-caption]').textContent = `${item.label} · 原表 4`;
    $('[data-sn-study-rows]').innerHTML = item.intensity.map(point => `<tr><th scope="row">${esc(point.displayConcentration)}</th><td>${esc(point.displayGM)} ± ${esc(point.displaySe)}</td></tr>`).join('');
    $('[data-sn-study-statistic]').textContent = mode === 'threshold' ? study.thresholdStatistic : study.intensityStatistic;
    for (const button of container.querySelectorAll('[data-sn-evidence-choice]')) {
      button.textContent = labels[mode][button.dataset.snEvidenceChoice]; button.setAttribute('aria-pressed', String(state.choice === button.dataset.snEvidenceChoice));
    }
    $('[data-sn-action="check"]').disabled = !state.choice;
    $('[data-sn-feedback]').textContent = state.checked ? `${state.choice === 'limited' ? '這次判讀與資料的範圍相符。' : '這次判讀超出資料範圍。'}${study.interpretation}` : state.revealed ? `參考：${study.interpretation} ${state.choice ? '自己的選擇仍保留，尚未核對。' : '尚未自行作答。'}` : state.choice ? '已選擇，按「核對我的判斷」查看。' : '';
    journal.refresh();
  }
  function onChange(event) {
    if (disposed) return;
    if (container.contains(event.target) && journal.change(event.target)) return;
    const target = event.target?.closest?.('[data-sn-control="sample"]'); if (!target || !container.contains(target)) return;
    if (!Object.hasOwn(states, target.value)) { target.value = sampleId; return; }
    sampleId = target.value; mode = states[sampleId].mode; render();
  }
  function onClick(event) {
    if (disposed) return;
    const target = event.target?.closest?.('button'); if (!target || !container.contains(target) || target.disabled) return;
    const nextMode = target.dataset.snMode, choice = target.dataset.snEvidenceChoice, action = target.dataset.snAction;
    if (journal.action(action)) return;
    if (nextMode && ['threshold', 'intensity'].includes(nextMode) && nextMode !== mode) {
      mode = nextMode; render(); const heading = $('[data-sn-heading]'); heading.focus?.({preventScroll: true}); heading.scrollIntoView?.({block: 'start', behavior: 'instant'}); return;
    }
    if (Object.hasOwn(labels[mode], choice ?? '')) Object.assign(draft(), {choice, checked: false, revealed: false});
    else if (action === 'check' && draft().choice) Object.assign(draft(), {checked: true, checkedSeen: true});
    else if (action === 'reference') Object.assign(draft(), {revealed: true, referenceSeen: true});
    else return;
    render();
  }
  function onInput(event) { if (!disposed && container.contains(event.target)) journal.input(event.target); }
  function onToggle(event) { if (!disposed) journal.toggle(event); }
  function dispose() { if (disposed) return; journal.capture(); disposed = true; container.removeEventListener('click', onClick); container.removeEventListener('change', onChange); container.removeEventListener('input', onInput); container.removeEventListener('toggle', onToggle, true); release(); }
  const release = attachView(container, memory, render, dispose);
  container.addEventListener('click', onClick); container.addEventListener('change', onChange); container.addEventListener('input', onInput); container.addEventListener('toggle', onToggle, true);
  render(); return dispose;
}
