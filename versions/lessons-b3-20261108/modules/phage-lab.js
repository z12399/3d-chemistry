import {escapeHTML as esc} from './storage.js';
import {
  PHAGE_LAB_ID, GENOME_LABELS, PROGENY_LABELS, validatePhageDataset,
  getPhageExample, getPhageStructure, getPhagePath, getCycleStage,
  getEvidenceCase, getEvidenceLevel, assessCyclePrediction, assessHostEvidence,
} from './phage-model.js';
import {phageStructureSvg, phageCycleSvg, phageEvidenceSvg, OBSERVATION_LABELS} from './phage-diagrams.js';
export {PHAGE_LAB_ID} from './phage-model.js';

const drafts = new WeakMap(), mounts = new WeakMap();
const clone = value => structuredClone(value), signature = value => JSON.stringify(value);
const MODES = ['structure', 'cycle', 'evidence'];
const MODE_LABELS = {structure:'看構造', cycle:'走一遍週期', evidence:'判讀宿主證據'};
const AXES = {genome:'圖中追蹤的基因體狀態', progeny:'成熟子代粒子的圖示位置'};
const LABELS = {genome:GENOME_LABELS, progeny:PROGENY_LABELS};
const DETAIL_LABELS = {writing:'自己的判讀', structure:'構造與例子的界線', reference:'本步機制與來源', sources:'完整來源', limits:'模型界線', records:'已保留紀錄', summary:'完整摘要', partSource:'構造來源'};
const MAX_ATTEMPTS = 48, MAX_RECORDS = 32, MAX_JOURNAL = 160;
const freshWriting = () => ({prediction:'', observation:'', revision:''});
const fresh = () => ({mode:'structure', example:'t4', part:'capsid', path:'t4-lytic', stage:'attachment', caseId:null, level:null, observationScope:'nucleic-acid',
  attempts:[], selectedAttempts:{}, annotations:{}, records:[], journal:[], details:[], claimDetails:[],
  seen:{structures:[], cycles:[], cards:[], reviews:[], sources:[], details:[], claims:[]},
  cursor:{started:false, attempts:{}, annotations:{}, journal:0}, savedVersions:[]});
const remember = (values, value) => {if (!values.includes(value)) values.push(value);};
const textValue = value => Array.isArray(value) ? value.map(textValue).join('；') : value && typeof value === 'object' ? Object.values(value).map(textValue).join('；') : String(value ?? '');
const bodyText = writing => `原判讀與理由：${writing.prediction || '未填'}\n觀察：${writing.observation || '未填'}\n修訂：${writing.revision || '未填'}`;
const preamble = () => '【噬菌體：結構、宿主與生命週期】phage-evidence-v1\n具名例子的來源化概念圖；不是顯微影像、實測比例、同步感染時間表或感染成功率。途徑按鈕用於比較圖示；證據卡是自編題設。';
const safeUrl = value => {try {const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;} catch {return null;}};
let serial = 0;
async function defaultLoad(signal) {
  const response = await fetch(new URL('../data/phage-evidence.json', import.meta.url), {signal});
  if (!response.ok) throw new Error('Phage evidence data unavailable');
  return response.json();
}

export function mountPhageLab(root, id = PHAGE_LAB_ID, {draftOwner, draftKey = id, onSaveSummary, loadData = defaultLoad} = {}) {
  if (!root?.querySelector || !root?.addEventListener) throw new TypeError('A DOM container is required');
  if (id !== PHAGE_LAB_ID) throw new RangeError('Unknown phage activity');
  mounts.get(root)?.();
  let slot;
  if (draftOwner && typeof draftOwner === 'object') {
    if (!drafts.has(draftOwner)) drafts.set(draftOwner, new Map());
    const lessons = drafts.get(draftOwner), key = String(draftKey);
    if (!lessons.has(key)) lessons.set(key, {data:fresh()});
    slot = lessons.get(key); slot.dispose?.();
  } else slot = {data:fresh()};
  const d = slot.data, prefix = `phage-${++serial}`;
  const $ = name => root.querySelector(`[data-ph-${name}]`);
  const action = name => root.querySelector(`[data-ph-action="${name}"]`);
  let disposed = false, dataset = null, epoch = 0, abort = null, feedback = '';
  slot.saveStatus ??= '';
  const contextKey = (kind, first, second) => `${kind}:${first}:${second}`;
  const currentKey = () => d.mode === 'cycle' ? contextKey('cycle', d.path, d.stage) : contextKey('evidence', d.caseId, d.level);
  const activeAttempt = () => d.mode === 'structure' ? null : d.attempts.find(a => a.id === d.selectedAttempts[currentKey()]) || null;
  const annotationKey = () => `structure:${d.example}:${d.part}`;
  const sourceText = ids => (ids || []).map(id => dataset?.sources.find(s => s.id === id)).filter(Boolean).map(s => `${s.title}\n${s.url}\n定位：${textValue(s.locator)}`).join('\n');
  const sourceLink = source => safeUrl(source?.url) ? `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer" data-ph-source="${esc(source.id)}">${esc(source.title)} ↗</a>` : esc(source?.title || '來源未提供');
  const sourceList = ids => `<ul class="ph-source-list">${(ids || []).map(id => dataset?.sources.find(s => s.id === id)).filter(Boolean).map(s => `<li>${sourceLink(s)}<p>${esc(textValue(s.locator))}</p></li>`).join('')}</ul>`;
  const exposureText = seen => `曾顯示構造：${seen.structures.join('、') || '無'}；曾顯示週期題目：${seen.cycles.join('、') || '無'}；曾揭示證據卡：${seen.cards.join('、') || '無'}；曾核對參考：${seen.reviews.join('、') || '無'}；曾顯示逐項依據：${seen.claims.join('、') || '無'}；曾展開：${seen.details.map(id => DETAIL_LABELS[id] || id).join('、') || '無'}；開啟來源：${seen.sources.join('、') || '無'}。開啟不等於已讀；本課不宣稱盲測。`;

  function visibleContext(kind, first, second) {
    if (kind === 'cycle') {
      const path = getPhagePath(dataset, first), stage = getCycleStage(dataset, first, second), example = getPhageExample(dataset, path.exampleId);
      return {title:`${example.shortLabel}｜${path.label}｜${stage.label}`, prompt:stage.prompt, shownEvidence:[], pathScope:textValue(path.scope)};
    }
    const item = getEvidenceCase(dataset, first), level = getEvidenceLevel(dataset, first, second);
    return {title:`${item.title}｜${level.label}`, prompt:level.prompt,
      shownEvidence:level.cardIds.map(id => {const card = item.cards.find(c => c.id === id); return {id:`${item.id}:${card.id}`, label:card.label, text:card.text, observationScope:card.observationScope, observationLabel:card.observationLabel, sourceIds:card.sourceIds, claimIds:card.claimIds};}),
      pathScope:'自編題設；來源支持判讀界線，不是論文的實测時間序列。'};
  }
  function ensureAttempt(kind, first, second, force = false) {
    const key = contextKey(kind, first, second), prior = d.attempts.find(a => a.id === d.selectedAttempts[key]);
    if (prior && !force) return prior;
    if (d.attempts.length >= MAX_ATTEMPTS) {feedback = `已保留 ${MAX_ATTEMPTS} 輪，不覆寫原判讀。請先保存或複製摘要。`; return null;}
    const a = {id:d.attempts.length + 1, kind, firstId:first, secondId:second, context:visibleContext(kind, first, second),
      answers:{genome:'', progeny:''}, choice:'', choiceLabel:'', writing:freshWriting(), first:null, review:null};
    d.attempts.push(a); d.selectedAttempts[key] = a.id; return a;
  }
  function choicesText(a) {
    if (a.kind === 'cycle') return Object.keys(AXES).map(key => `${AXES[key]}：${LABELS[key][a.answers[key]] || '未選'}`).join('；');
    return dataset ? getEvidenceLevel(dataset, a.firstId, a.secondId).choices.find(c => c.id === a.choice)?.label || '未選' : a.first?.choiceText || a.choiceLabel || '未選';
  }
  const complete = a => a && (a.kind === 'cycle' ? Object.keys(AXES).every(key => Object.hasOwn(LABELS[key], a.answers[key])) : !!a.choice);
  const hasDraft = a => a && (a.choice || Object.values(a.answers).some(Boolean) || Object.values(a.writing).some(Boolean));
  function freezeFirst(a, trigger) {
    if (!a || a.first) return;
    a.first = clone({attemptId:a.id, title:a.context.title, trigger, choiceText:choicesText(a), answers:a.answers, choice:a.choice,
      writing:a.writing, context:a.context, exposure:d.seen, version:dataset.version});
  }
  function leaveAttempt(trigger, includeBlank = false) {
    const a = activeAttempt(); if (a && (includeBlank || hasDraft(a))) freezeFirst(a, trigger);
  }
  function referenceText(a) {
    if (a.kind === 'cycle') {
      const stage = getCycleStage(dataset, a.firstId, a.secondId);
      return `${Object.keys(AXES).map(key => `${AXES[key]}：${LABELS[key][stage.answers[key]]}`).join('\n')}\n${stage.explanation}\n界線：${textValue(stage.limits)}\n${sourceText(stage.sourceIds)}`;
    }
    const level = getEvidenceLevel(dataset, a.firstId, a.secondId);
    return `${level.choices.find(c => c.id === level.answerId).label}\n${level.explanation}\n界線：${textValue(level.limits)}\n${sourceText(level.sourceIds)}`;
  }
  function revealReference(trigger) {
    const a = activeAttempt(); if (!a || a.review) return;
    freezeFirst(a, trigger);
    const assessment = complete(a) ? (a.kind === 'cycle' ? assessCyclePrediction(dataset, a.firstId, a.secondId, a.answers) : assessHostEvidence(dataset, a.firstId, a.secondId, a.choice)) : null;
    a.review = clone({trigger, assessment, reference:referenceText(a), exposure:d.seen, version:dataset.version});
    remember(d.seen.reviews, contextKey(a.kind, a.firstId, a.secondId));
  }
  const firstText = first => `第 ${first.attemptId} 輪｜${first.title}\n動作：${first.trigger}\n當時題目：${first.context.prompt}\n當時已揭示資料：${first.context.shownEvidence.map(c => `[${c.id}] ${c.label}：${c.text}（觀察對象：${OBSERVATION_LABELS[c.observationScope]}；${c.observationLabel}；來源：${c.sourceIds.join('、')}）`).join('；') || '無證據卡'}\n${first.context.pathScope}\n首次選擇：${first.choiceText}\n${bodyText(first.writing)}\n${exposureText(first.exposure)}\n資料版本：${first.version}`;
  const reviewText = a => `第 ${a.id} 輪｜${a.context.title}\n動作：${a.review.trigger}\n核對參考：\n${a.review.reference}\n${exposureText(a.review.exposure)}\n資料版本：${a.review.version}`;
  function room() {if (d.journal.length < MAX_JOURNAL) return true; feedback = `已保留 ${MAX_JOURNAL} 項紀錄，不覆寫。請先保存或複製摘要。`; return false;}
  const log = (label, text) => d.journal.push({number:d.journal.length + 1, label, text});
  function appendPlan() {
    const next = clone(d.cursor), parts = [], versions = [];
    for (const a of d.attempts) {
      const prior = next.attempts[a.id] || {first:false, review:false, version:''};
      const version = signature({answers:a.answers, choice:a.choice, writing:a.writing});
      if (a.first && !prior.first) parts.push(firstText(a.first));
      if (a.review && !prior.review) parts.push(reviewText(a));
      if (version !== prior.version && (hasDraft(a) || prior.version)) {
        const text = `第 ${a.id} 輪目前文字版本｜${a.context.title}\n${a.first ? '首次選擇已固定' : '尚未核對的預測草稿'}：${choicesText(a)}\n${bodyText(a.writing)}`;
        parts.push(text); versions.push({attemptId:a.id, text});
      }
      if (a.first || a.review || hasDraft(a) || prior.version) next.attempts[a.id] = {first:!!a.first, review:!!a.review, version};
    }
    for (const [key, value] of Object.entries(d.annotations)) {
      const old = next.annotations[key];
      if (value.text !== old && (value.text || old)) {
        const text = `構造註記｜${value.context}\n${value.text || '目前已清空文字'}\n資料版本：${value.version}\n${value.sources}`;
        parts.push(text); versions.push({annotationKey:key, text}); next.annotations[key] = value.text;
      }
    }
    parts.push(...d.journal.slice(next.journal).map(e => `紀錄 ${e.number}｜${e.label}\n${e.text}`)); next.journal = d.journal.length;
    if (parts.length && !next.started) {parts.unshift(preamble()); next.started = true;}
    return {text:parts.join('\n\n'), next, versions};
  }
  function fullText() {
    if (!d.savedVersions.length && !d.journal.length && !Object.values(d.annotations).some(a => a.text) && !d.attempts.some(a => a.first || a.review || hasDraft(a))) return '';
    return [preamble(), ...d.attempts.flatMap(a => [a.first ? firstText(a.first) : `第 ${a.id} 輪｜${a.context.title}｜尚未核對`,
      ...(a.review ? [reviewText(a)] : []), ...d.savedVersions.filter(v => v.attemptId === a.id).map(v => v.text), `目前選擇：${choicesText(a)}\n${bodyText(a.writing)}`]),
      ...d.savedVersions.filter(v => v.annotationKey).map(v => v.text), ...Object.values(d.annotations).map(a => `目前構造註記｜${a.context}\n${a.text || '目前已清空文字'}\n資料版本：${a.version}\n${a.sources}`),
      ...d.journal.map(e => `紀錄 ${e.number}｜${e.label}\n${e.text}`)].join('\n\n');
  }

  root.innerHTML = `<section class="phage-lab" aria-labelledby="${prefix}-title">
    <h2 id="${prefix}-title">接上細菌，就能製造新噬菌體嗎？</h2><p class="ph-lead">從具名構造走到生命週期，再分清每份證據能支持的結論。</p>
    <nav class="ph-modes" aria-label="噬菌體學習畫面">${MODES.map(mode => `<button type="button" data-ph-mode="${mode}">${MODE_LABELS[mode]}</button>`).join('')}</nav>
    <p class="ph-caption" role="status" data-ph-load-status>正在載入來源化教材…</p><button type="button" data-ph-action="retry" hidden>重試載入</button>
    <label class="ph-example-control" for="${prefix}-example" data-ph-example-control>觀察哪個例子<select id="${prefix}-example" data-ph-example disabled></select></label>
    <section data-ph-panel="structure"><div class="ph-structure-grid"><figure><figcaption data-ph-example-name></figcaption><div class="ph-diagram" tabindex="0" role="region" aria-label="噬菌體選定構造，可用鍵盤選取，窄螢幕可局部捲動" data-ph-structure></div><p class="ph-caption">選定構造的概念配置；非實測比例或感染時的固定姿態。</p></figure><aside class="ph-reading"><h3 data-ph-part-title></h3><p data-ph-part-reading></p><div data-ph-part-sources></div></aside></div><div class="ph-part-buttons" role="group" aria-label="選擇噬菌體構造" data-ph-parts></div></section>
    <section data-ph-panel="cycle" hidden><label for="${prefix}-path">比較哪條途徑<select id="${prefix}-path" data-ph-path disabled></select></label><p class="ph-caption" data-ph-path-scope></p><nav class="ph-stage-nav" aria-label="生命週期概念階段" data-ph-stages></nav><div class="ph-step-controls"><button type="button" data-ph-action="previous-stage">上一步</button><h3 data-ph-stage-title></h3><button type="button" data-ph-action="next-stage">下一步</button></div><p data-ph-stage-prompt></p><figure><div class="ph-diagram ph-cycle-diagram" tabindex="0" role="region" aria-label="目前生命週期概念圖，窄螢幕可局部捲動" data-ph-cycle-diagram></div><figcaption class="ph-caption">階段圖用於概念比較，沒有時間比例或粒子數意義。</figcaption></figure><div class="ph-predictions">${Object.entries(AXES).map(([key, label]) => `<label for="${prefix}-${key}">${label}<select id="${prefix}-${key}" data-ph-prediction-choice="${key}"><option value="">先留下我的判讀</option>${Object.entries(LABELS[key]).map(([id, text]) => `<option value="${esc(id)}">${esc(text)}</option>`).join('')}</select></label>`).join('')}</div><div class="ph-reading" data-ph-cycle-result hidden></div></section>
    <section data-ph-panel="evidence" hidden><label for="${prefix}-case">判讀哪組證據<select id="${prefix}-case" data-ph-case disabled></select></label><p class="ph-caption" data-ph-case-prompt></p><p class="ph-caption">自編題設。按步驟揭示資料；順序代表提供資訊的次序。</p><nav class="ph-level-nav" aria-label="證據揭示步驟" data-ph-levels></nav><figure><div class="ph-diagram ph-evidence-diagram" tabindex="0" role="region" aria-label="目前證據觀察對象，可用鍵盤選取，窄螢幕可局部捲動" data-ph-evidence-diagram></div><figcaption class="ph-caption">有資料不等於陽性；未提供不等於陰性。</figcaption><p data-ph-evidence-map-reading></p></figure><div class="ph-evidence-cards" data-ph-cards></div><p class="ph-task-prompt" data-ph-evidence-prompt></p><div class="ph-choice-list" role="group" aria-label="目前證據能支持的判讀" data-ph-choices></div><div class="ph-reading" data-ph-evidence-result hidden></div></section>
    <div class="ph-check-actions" data-ph-check-actions hidden><button type="button" data-ph-action="check">核對我的判讀</button><button type="button" data-ph-action="reveal">先看參考解釋</button><button type="button" data-ph-action="new">新一輪判讀</button><p role="status" data-ph-answer></p></div>
    <div class="ph-record-actions"><button type="button" data-ph-action="record">保留這次觀察</button><span data-ph-count></span><button type="button" class="ph-primary" data-ph-action="save">保存到本課筆記</button></div><p role="status" data-ph-feedback></p><p role="status" data-ph-save-status></p>
    <details data-ph-details="writing"><summary>寫下判讀、觀察與修訂</summary><p class="ph-caption" data-ph-writing-context></p>${[['prediction','原判讀與理由'],['observation','我看到的構造、階段或證據'],['revision','我的修訂']].map(([key, label]) => `<label for="${prefix}-${key}" data-ph-writing-field="${key}">${label}<textarea id="${prefix}-${key}" rows="3" maxlength="1200" data-ph-${key}></textarea></label>`).join('')}<p class="ph-preserved" data-ph-first></p></details>
    <details data-ph-details="structure" data-ph-structure-disclosure><summary>這個例子與構造圖的完整界線</summary><div data-ph-structure-detail></div></details>
    <details data-ph-details="reference" data-ph-reference-disclosure><summary>這一步的機制、解釋與來源</summary><div data-ph-reference></div></details>
    <details data-ph-details="sources"><summary>完整來源與逐項依據</summary><div data-ph-sources></div></details>
    <details data-ph-details="limits"><summary>這個模型能回答到哪裡？</summary><div data-ph-limits></div></details>
    <details data-ph-details="records"><summary>回看觀察與原判讀</summary><div data-ph-records></div></details>
    <details class="ph-summary" data-ph-details="summary"><summary>待存內容與完整摘要</summary><label for="${prefix}-append">這次會附加的內容<textarea id="${prefix}-append" data-ph-append readonly rows="5"></textarea></label><label for="${prefix}-summary">完整摘要（包含已保存文字版本）<textarea id="${prefix}-summary" data-ph-summary readonly rows="6"></textarea></label><button type="button" data-ph-action="copy">選取完整摘要</button><p class="ph-caption">同頁返回可接續；重新整理前請保存筆記。內容過長會拒絕保存，全文仍可複製。</p></details>
  </section>`;

  function drawSummary() {
    if (disposed) return;
    $('append').value = appendPlan().text; $('summary').value = fullText();
    action('save').disabled = !!slot.pending || !$('append').value || typeof onSaveSummary !== 'function';
    $('save-status').textContent = slot.saveStatus;
  }
  function drawWriting() {
    const structure = d.mode === 'structure', a = activeAttempt();
    $('writing-context').textContent = structure ? '這份觀察只屬於目前的例子與構造。' : a ? `第 ${a.id} 輪｜${a.context.title}。離開已有作答的題目、揭示後續證據或展開逐項依據時，也會固定原判讀。` : '等待教材載入。';
    for (const key of ['prediction', 'observation', 'revision']) {
      root.querySelector(`[data-ph-writing-field="${key}"]`).hidden = structure && key !== 'observation';
      $(key).value = structure ? (key === 'observation' ? d.annotations[annotationKey()]?.text || '' : '') : a?.writing[key] || '';
      $(key).readOnly = !structure && key === 'prediction' && !!a?.first;
      $(key).disabled = structure ? !dataset && !d.annotations[annotationKey()] : !a;
    }
    $('first').textContent = a?.first ? `已固定首次選擇：${a.first.choiceText}\n原判讀：${a.first.writing.prediction || '未填'}\n${exposureText(a.first.exposure)}` : '';
  }
  function drawStructure() {
    const example = getPhageExample(dataset, d.example), part = getPhageStructure(dataset, d.example, d.part);
    $('example-name').textContent = example.label;
    $('structure').innerHTML = phageStructureSvg(example, d.part, prefix);
    $('part-title').textContent = part.label; $('part-reading').textContent = part.description;
    $('parts').innerHTML = example.structures.map(p => `<button type="button" data-ph-part="${esc(p.id)}" aria-pressed="${p.id === d.part}">${esc(p.shortLabel || p.label)}</button>`).join('');
    $('part-sources').innerHTML = `<details data-ph-details="partSource"${d.details.includes('partSource') ? ' open' : ''}><summary>這個構造的來源</summary>${sourceList(part.sourceIds)}</details>`;
    $('structure-detail').innerHTML = `<h3>${esc(example.label)}</h3><p>${esc(example.summary)}</p><p>${esc(textValue(example.scope))}</p><p>只畫本課選定部位。未畫出的構造不代表不存在，圖示配置不表示所有粒子或所有時間都有相同姿態。</p>${sourceList([...new Set(example.structures.flatMap(p => p.sourceIds))])}`;
    $('reference').innerHTML = `<p>選擇構造可看功能；其來源與完整界線在上方展開區。</p>`;
    remember(d.seen.structures, `${d.example}:${d.part}`);
  }
  function drawCycle() {
    const path = getPhagePath(dataset, d.path), stage = getCycleStage(dataset, d.path, d.stage), example = getPhageExample(dataset, d.example), a = activeAttempt();
    $('path').innerHTML = dataset.paths.filter(p => p.exampleId === d.example).map(p => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join(''); $('path').value = d.path;
    $('path-scope').textContent = `${textValue(path.scope)} 依階段提示判讀，再核對圖示；途徑按鈕用於比較。`;
    $('stages').innerHTML = path.stageIds.map((id, index) => `<button type="button" data-ph-stage="${esc(id)}" aria-pressed="${id === d.stage}"><span>${index + 1}</span>${esc(getCycleStage(dataset, d.path, id).label)}</button>`).join('');
    $('stage-title').textContent = stage.label; $('stage-prompt').textContent = stage.prompt;
    $('cycle-diagram').innerHTML = phageCycleSvg(example, stage, {revealed:!!a?.review, prefix});
    action('previous-stage').disabled = path.stageIds.indexOf(d.stage) === 0;
    action('next-stage').disabled = path.stageIds.indexOf(d.stage) === path.stageIds.length - 1;
    for (const key of Object.keys(AXES)) {const select = root.querySelector(`[data-ph-prediction-choice="${key}"]`); select.value = a?.answers[key] || ''; select.disabled = !a || !!a.first;}
    $('cycle-result').hidden = !a?.review;
    $('cycle-result').innerHTML = a?.review ? `<h3>這一步的圖示參考</h3><p>${esc(Object.keys(AXES).map(key => LABELS[key][stage.answers[key]]).join('；'))}</p>` : '';
    $('reference').innerHTML = a?.review ? `<h3>${esc(stage.label)}</h3><p>${esc(stage.explanation)}</p><p>${esc(textValue(stage.limits))}</p>${sourceList(stage.sourceIds)}` : '<p>此步尚未核對。先留下判讀，或按「先看參考解釋」；未核對的圖不透露參考結果。</p>';
    remember(d.seen.cycles, `${d.path}:${d.stage}`);
  }
  function drawEvidence() {
    const item = getEvidenceCase(dataset, d.caseId), level = getEvidenceLevel(dataset, d.caseId, d.level), a = activeAttempt();
    $('case').value = d.caseId; $('case-prompt').textContent = item.prompt;
    $('levels').innerHTML = item.levels.map((l, index) => `<button type="button" data-ph-level="${esc(l.id)}" aria-pressed="${l.id === d.level}">${index + 1}. ${esc(l.label)}</button>`).join('');
    $('evidence-diagram').innerHTML = phageEvidenceSvg(item, level, d.observationScope, prefix);
    const scopedCards = item.cards.filter(card => level.cardIds.includes(card.id) && card.observationScope === d.observationScope);
    $('evidence-map-reading').textContent = `${OBSERVATION_LABELS[d.observationScope]}：${scopedCards.length ? scopedCards.map(card => card.observationLabel).join('；') : '這組資料尚未提供此對象的觀察。'}`;
    $('cards').innerHTML = level.cardIds.map(id => {const card = item.cards.find(c => c.id === id); return `<article class="ph-evidence-card" data-ph-card="${esc(card.id)}"><h3>${esc(card.label)}</h3><p>${esc(card.text)}</p></article>`;}).join('');
    $('evidence-prompt').textContent = level.prompt;
    $('choices').innerHTML = level.choices.map(c => `<button type="button" data-ph-choice="${esc(c.id)}" aria-pressed="${a?.choice === c.id}"${a?.first ? ' disabled' : ''}>${esc(c.label)}</button>`).join('');
    $('evidence-result').hidden = !a?.review;
    $('evidence-result').innerHTML = a?.review ? `<h3>目前證據能支持的判讀</h3><p>${esc(level.choices.find(c => c.id === level.answerId).label)}</p>` : '';
    $('reference').innerHTML = a?.review ? `<h3>${esc(level.label)}</h3><p>${esc(level.explanation)}</p><p>${esc(textValue(level.limits))}</p>${sourceList(level.sourceIds)}` : '<p>這組證據尚未核對。新增證據前會保留目前的原判讀，之後仍可回看與寫下修訂。</p>';
    level.cardIds.forEach(id => remember(d.seen.cards, `${item.id}:${id}`));
  }
  function draw() {
    if (disposed) return;
    for (const button of root.querySelectorAll('[data-ph-mode]')) button.setAttribute('aria-pressed', String(button.dataset.phMode === d.mode));
    for (const panel of root.querySelectorAll('[data-ph-panel]')) panel.hidden = panel.dataset.phPanel !== d.mode;
    $('example-control').hidden = d.mode === 'evidence'; $('example').value = d.example; $('example').disabled = !dataset;
    $('structure-disclosure').hidden = d.mode !== 'structure'; $('reference-disclosure').hidden = d.mode === 'structure';
    $('path').disabled = !dataset; $('case').disabled = !dataset;
    $('check-actions').hidden = d.mode === 'structure'; $('count').textContent = `${d.records.length} / ${MAX_RECORDS} 組`;
    $('feedback').textContent = feedback; action('record').disabled = !dataset;
    const a = activeAttempt();
    action('check').disabled = !dataset || !a || !!a.review || !complete(a);
    action('reveal').disabled = !dataset || !a || !!a.review; action('new').disabled = !dataset || !a;
    if (dataset) {if (d.mode === 'structure') drawStructure(); else if (d.mode === 'cycle') drawCycle(); else drawEvidence();}
    else {
      for (const name of ['structure', 'parts', 'part-sources', 'structure-detail', 'reference', 'cycle-diagram', 'evidence-diagram', 'stages', 'levels', 'cards', 'choices', 'sources', 'limits']) $(name).innerHTML = '';
      for (const name of ['example-name', 'part-title', 'part-reading', 'path-scope', 'stage-title', 'stage-prompt', 'case-prompt', 'evidence-prompt', 'evidence-map-reading']) $(name).textContent = '';
      $('cycle-result').hidden = true; $('evidence-result').hidden = true;
      for (const key of Object.keys(AXES)) root.querySelector(`[data-ph-prediction-choice="${key}"]`).disabled = true;
      action('previous-stage').disabled = true; action('next-stage').disabled = true;
    }
    $('answer').textContent = a?.review ? (a.review.trigger === '先看參考解釋' ? '已查看參考；首次選擇與原文仍保留。' : a.kind === 'cycle' ? `兩項判讀中 ${a.review.assessment.correctCount} 項與圖示參考一致，可補寫修訂。` : `${a.review.assessment.correct ? '與本題參考一致。' : '與本題參考不同。'}原判讀已固定，可補寫修訂。`) : a?.first ? '原判讀已在切換或顯示新資料前固定；尚未核對，可核對或補寫修訂。' : '';
    drawWriting();
    $('records').innerHTML = d.records.map((r, index) => `<article><h3>觀察 ${index + 1}</h3><p class="ph-record-text">${esc(r.text)}</p></article>`).join('') + d.attempts.filter(a => a.first).map(a => `<details><summary>第 ${a.id} 輪 · ${esc(a.context.title)}</summary><p class="ph-record-text">${esc(firstText(a.first))}</p>${a.review ? `<p class="ph-record-text">${esc(reviewText(a))}</p>` : ''}</details>`).join('');
    drawSummary();
  }
  function setCycle(pathId, stageId) {
    const path = getPhagePath(dataset, pathId); getCycleStage(dataset, pathId, stageId);
    if (d.mode === 'cycle' && d.path === pathId && d.stage === stageId) return true;
    if (!ensureAttempt('cycle', pathId, stageId)) return false;
    leaveAttempt('切換前保留原判讀'); d.mode = 'cycle'; d.path = pathId; d.stage = stageId; d.example = path.exampleId;
    if (!getPhageExample(dataset, d.example).structures.some(p => p.id === d.part)) d.part = getPhageExample(dataset, d.example).structures[0].id;
    feedback = ''; return true;
  }
  function setEvidence(caseId, levelId) {
    const item = getEvidenceCase(dataset, caseId); getEvidenceLevel(dataset, caseId, levelId);
    if (d.mode === 'evidence' && d.caseId === caseId && d.level === levelId) return true;
    if (!ensureAttempt('evidence', caseId, levelId)) return false;
    const advancing = d.mode === 'evidence' && d.caseId === caseId && item.levels.findIndex(l => l.id === levelId) > item.levels.findIndex(l => l.id === d.level);
    leaveAttempt(advancing ? '揭示後續證據前保留原判讀' : '切換前保留原判讀', advancing);
    d.mode = 'evidence'; d.caseId = caseId; d.level = levelId;
    const current = getEvidenceLevel(dataset, caseId, levelId); d.observationScope = item.cards.find(card => card.id === current.cardIds.at(-1)).observationScope;
    feedback = ''; return true;
  }
  function onInput(event) {
    if (disposed || !root.contains(event.target)) return;
    const key = ['prediction', 'observation', 'revision'].find(key => event.target === $(key)); if (!key || event.target.disabled) return;
    if (d.mode === 'structure') {
      if (key !== 'observation') return;
      const previous = d.annotations[annotationKey()], example = dataset ? getPhageExample(dataset, d.example) : null, part = example ? getPhageStructure(dataset, d.example, d.part) : null;
      d.annotations[annotationKey()] = {context:example ? `${example.label}｜${part.label}` : previous?.context || `${d.example}｜${d.part}`, version:dataset?.version ?? previous?.version ?? 'unknown', text:String(event.target.value), sources:part ? sourceText(part.sourceIds) : previous?.sources || ''};
    } else {const a = activeAttempt(); if (!a) return; if (key === 'prediction' && a.first) {event.target.value = a.writing[key]; return;} a.writing[key] = String(event.target.value);}
    if (!slot.pending) slot.saveStatus = ''; drawSummary();
  }
  function onChange(event) {
    if (disposed || !root.contains(event.target) || !dataset) return;
    if (event.target === $('example')) {
      const id = event.target.value; if (!dataset.examples.some(e => e.id === id)) return;
      if (d.mode === 'cycle') {const path = dataset.paths.find(p => p.exampleId === id); setCycle(path.id, path.stageIds[0]);}
      else {d.example = id; d.part = getPhageExample(dataset, id).structures[0].id; feedback = '';}
      return draw();
    }
    if (event.target === $('path')) {const path = dataset.paths.find(p => p.id === event.target.value && p.exampleId === d.example); if (path) setCycle(path.id, path.stageIds[0]); return draw();}
    if (event.target === $('case')) {const item = dataset.evidenceCases.find(c => c.id === event.target.value); if (item) setEvidence(item.id, item.levels[0].id); return draw();}
    const key = event.target.dataset.phPredictionChoice, a = activeAttempt();
    if (Object.hasOwn(AXES, key) && a?.kind === 'cycle' && !a.first) {if (event.target.value === '' || Object.hasOwn(LABELS[key], event.target.value)) a.answers[key] = event.target.value; return draw();}
    if (Object.hasOwn(AXES, key)) draw();
  }
  function observationText() {
    if (d.mode === 'structure') {const e = getPhageExample(dataset, d.example), p = getPhageStructure(dataset, d.example, d.part); return `${e.label}｜${p.label}\n${p.description}\n${textValue(e.scope)}\n${d.annotations[annotationKey()]?.text || ''}\n${sourceText(p.sourceIds)}`;}
    const a = activeAttempt(); if (!a) return '';
    return `${a.first ? firstText(a.first) : `${a.context.title}\n當時已揭示資料：${a.context.shownEvidence.map(c => `${c.label}：${c.text}`).join('；') || '無證據卡'}\n尚未核對：${choicesText(a)}`}\n${a.kind === 'evidence' ? `觀察圖目前選取：${$('evidence-map-reading').textContent}\n` : ''}${a.review ? reviewText(a) : '尚未顯示參考'}\n${bodyText(a.writing)}`;
  }
  function onClick(event) {
    if (disposed || !root.contains(event.target)) return;
    const link = event.target.closest('[data-ph-source]');
    if (link) {const id = link.dataset.phSource; if (!d.seen.sources.includes(id)) {if (!room()) {event.preventDefault?.(); return draw();} remember(d.seen.sources, id); log('開啟來源（不代表已讀）', `${id}\n${sourceText([id])}`);} drawSummary(); return;}
    const mode = event.target.closest('[data-ph-mode]');
    if (mode) {
      const target = mode.dataset.phMode; if (!MODES.includes(target)) return;
      feedback = '';
      if (target === 'structure') {if (dataset) leaveAttempt('切換前保留原判讀'); d.mode = target;}
      else if (dataset && target === 'cycle') {const path = dataset.paths.find(p => p.id === d.path && p.exampleId === d.example) || dataset.paths.find(p => p.exampleId === d.example); setCycle(path.id, path.stageIds.includes(d.stage) ? d.stage : path.stageIds[0]);}
      else if (dataset && target === 'evidence') setEvidence(d.caseId, d.level);
      return draw();
    }
    if (dataset) {
      const scope = event.target.closest('[data-phage-scope]');
      if (scope) {const id = scope.dataset.phageScope; if (Object.hasOwn(OBSERVATION_LABELS, id)) {d.observationScope = id; draw(); root.querySelector(`[data-phage-scope="${id}"]`)?.focus();} return;}
      const part = event.target.closest('[data-ph-part],[data-phage-part]');
      if (part) {const id = part.dataset.phPart || part.dataset.phagePart, selector = part.dataset.phPart ? 'data-ph-part' : 'data-phage-part'; if (getPhageExample(dataset, d.example).structures.some(p => p.id === id)) {d.part = id; feedback = ''; draw(); root.querySelector(`[${selector}="${id}"]`)?.focus();} return;}
      const stage = event.target.closest('[data-ph-stage]'); if (stage) {const id = stage.dataset.phStage; if (getPhagePath(dataset, d.path).stageIds.includes(id)) setCycle(d.path, id); draw(); root.querySelector(`[data-ph-stage="${id}"]`)?.focus(); return;}
      const level = event.target.closest('[data-ph-level]'); if (level) {const id = level.dataset.phLevel; if (getEvidenceCase(dataset, d.caseId).levels.some(l => l.id === id)) setEvidence(d.caseId, id); draw(); root.querySelector(`[data-ph-level="${id}"]`)?.focus(); return;}
      const choice = event.target.closest('[data-ph-choice]'); if (choice) {const a = activeAttempt(), id = choice.dataset.phChoice, option = a?.kind === 'evidence' ? getEvidenceLevel(dataset, a.firstId, a.secondId).choices.find(c => c.id === id) : null; if (option && !a.first) {a.choice = id; a.choiceLabel = option.label;} draw(); root.querySelector(`[data-ph-choice="${id}"]`)?.focus(); return;}
    }
    const button = event.target.closest('[data-ph-action]'); if (!button || button.disabled) return;
    const name = button.dataset.phAction;
    if (name === 'retry') {load(); return;}
    if (name === 'copy') {$('summary').focus(); $('summary').select(); return;}
    if (name === 'save') {
      const plan = appendPlan(); if (!plan.text || slot.pending || typeof onSaveSummary !== 'function') return;
      if (plan.text.length > 10000) {slot.saveStatus = '尚未保存：本次超過 10,000 字元。完整內容保留，可選取摘要複製。'; return drawSummary();}
      const token = {}; slot.pending = token; slot.saveStatus = '正在保存；本次內容已固定，仍可繼續修訂。'; drawSummary();
      const finish = (ok, error) => {if (slot.pending !== token) return; slot.pending = null; if (ok === true) {d.cursor = plan.next; d.savedVersions.push(...plan.versions); slot.saveStatus = '已附加本次內容；重複按下不會重複加入。';} else slot.saveStatus = error ? `尚未保存：${error?.message || '儲存失敗'}。待存內容完整保留。` : '尚未保存：請檢查筆記容量與儲存狀態。待存內容完整保留。'; slot.refresh?.();};
      try {const value = onSaveSummary(plan.text); if (value && typeof value.then === 'function') Promise.resolve(value).then(finish, error => finish(false, error)); else finish(value);} catch (error) {finish(false, error);} return;
    }
    if (!dataset) return;
    if (name === 'previous-stage' || name === 'next-stage') {const path = getPhagePath(dataset, d.path), index = path.stageIds.indexOf(d.stage) + (name === 'previous-stage' ? -1 : 1); if (path.stageIds[index]) setCycle(d.path, path.stageIds[index]);}
    else if (name === 'record') {
      if (d.records.length >= MAX_RECORDS) {feedback = `已保留 ${MAX_RECORDS} 組，不覆寫舊觀察。請先保存或複製。`; return draw();}
      if (!room()) return draw(); const text = observationText();
      if (text && !d.records.some(r => r.text === text)) {d.records.push({text}); log('保留觀察', text);} feedback = '已保留；切換例子、階段或證據不會改寫這組觀察。';
    } else if (name === 'check' || name === 'reveal') {
      const a = activeAttempt(); if (!a || a.review || (name === 'check' && !complete(a))) return;
      revealReference(name === 'check' ? '核對我的判讀' : '先看參考解釋'); feedback = '首次選擇與原文已保留，修訂欄可繼續書寫。';
    } else if (name === 'new') {
      if (d.attempts.length >= MAX_ATTEMPTS) {feedback = `已保留 ${MAX_ATTEMPTS} 輪，不覆寫原判讀。請先保存或複製摘要。`; return draw();}
      const a = activeAttempt(); if (a) {freezeFirst(a, '開始新一輪前保留原判讀'); if (ensureAttempt(a.kind, a.firstId, a.secondId, true)) feedback = '已開始新一輪；原判讀與文字仍保留。';}
    }
    draw();
  }
  function onKey(event) {if (disposed || !['Enter', ' '].includes(event.key) || !event.target.closest('[data-phage-part],[data-phage-scope]')) return; event.preventDefault(); onClick(event);}
  function onToggle(event) {
    if (disposed || !root.contains(event.target)) return;
    const claimId = event.target.dataset.phClaim;
    if (claimId && dataset?.claims.some(claim => claim.id === claimId)) {
      d.claimDetails = d.claimDetails.filter(id => id !== claimId);
      if (event.target.open) {d.claimDetails.push(claimId); remember(d.seen.claims, claimId);}
      return drawSummary();
    }
    if (!event.target.dataset.phDetails) return;
    const id = event.target.dataset.phDetails, wasOpen = d.details.includes(id);
    if (id === 'sources' && event.target.open && !wasOpen && dataset) {
      freezeFirst(activeAttempt(), '展開逐項依據前保留原判讀');
      dataset.claims.forEach(claim => remember(d.seen.claims, claim.id));
    }
    d.details = d.details.filter(value => value !== id);
    if (event.target.open) {d.details.push(id); if (['structure', 'reference', 'sources', 'limits', 'partSource'].includes(id)) remember(d.seen.details, id);}
    if (id === 'sources' && dataset) draw(); else drawSummary();
  }
  async function load() {
    const token = ++epoch; abort?.abort(); abort = new AbortController(); dataset = null;
    $('load-status').textContent = '正在載入並核對教材…'; action('retry').hidden = true; draw();
    try {
      const raw = await loadData(abort.signal); if (disposed || token !== epoch) return;
      const checked = validatePhageDataset(raw), identity = signature(checked);
      if (slot.datasetIdentity && slot.datasetIdentity !== identity) throw new Error('Dataset changed during an existing learning session');
      slot.datasetIdentity = identity; dataset = checked;
      if (!dataset.examples.some(e => e.id === d.example)) d.example = dataset.examples[0].id;
      if (!getPhageExample(dataset, d.example).structures.some(p => p.id === d.part)) d.part = getPhageExample(dataset, d.example).structures[0].id;
      if (!dataset.paths.some(p => p.id === d.path && p.exampleId === d.example)) d.path = dataset.paths.find(p => p.exampleId === d.example).id;
      if (!getPhagePath(dataset, d.path).stageIds.includes(d.stage)) d.stage = getPhagePath(dataset, d.path).stageIds[0];
      if (!dataset.evidenceCases.some(c => c.id === d.caseId)) d.caseId = dataset.evidenceCases[0].id;
      if (!getEvidenceCase(dataset, d.caseId).levels.some(l => l.id === d.level)) d.level = getEvidenceCase(dataset, d.caseId).levels[0].id;
      if (d.mode === 'cycle') ensureAttempt('cycle', d.path, d.stage); else if (d.mode === 'evidence') ensureAttempt('evidence', d.caseId, d.level);
      if (d.details.includes('sources')) {
        freezeFirst(activeAttempt(), '已展開來源載入逐項依據前保留原判讀');
        dataset.claims.forEach(claim => remember(d.seen.claims, claim.id));
      }
      $('example').innerHTML = dataset.examples.map(e => `<option value="${esc(e.id)}">${esc(e.label)}</option>`).join('');
      $('case').innerHTML = dataset.evidenceCases.map(c => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('');
      $('sources').innerHTML = sourceList(dataset.sources.map(s => s.id)) + `<h3>逐項依據與適用範圍</h3>${dataset.claims.map(claim => `<details data-ph-claim="${esc(claim.id)}"${d.claimDetails.includes(claim.id) ? ' open' : ''}><summary>${esc(claim.claim)}</summary><p>${esc(claim.evidence.map(evidence => `${evidence.sourceId}：${textValue(evidence.locator)}`).join('；'))}</p>${claim.limits ? `<p>適用範圍：${esc(textValue(claim.limits))}</p>` : ''}${sourceList(claim.sourceIds)}</details>`).join('')}`;
      $('limits').innerHTML = `<ul>${dataset.limits.map(value => `<li>${esc(textValue(value))}</li>`).join('')}</ul>`;
      $('load-status').textContent = '依來源整理的概念示意；每個例子的適用範圍分開保留。'; draw();
    } catch (error) {
      if (disposed || token !== epoch) return;
      dataset = null; $('load-status').textContent = '教材未能讀取或通過核對。文字與已保留觀察仍在，請重試。'; action('retry').hidden = false; draw();
    }
  }
  for (const details of root.querySelectorAll('[data-ph-details]')) details.open = d.details.includes(details.dataset.phDetails);
  action('save').hidden = typeof onSaveSummary !== 'function';
  root.addEventListener('click', onClick); root.addEventListener('change', onChange); root.addEventListener('input', onInput); root.addEventListener('keydown', onKey); root.addEventListener('toggle', onToggle, true);
  const dispose = () => {if (disposed) return; disposed = true; epoch++; abort?.abort(); for (const [event, fn] of [['click', onClick], ['change', onChange], ['input', onInput], ['keydown', onKey]]) root.removeEventListener(event, fn); root.removeEventListener('toggle', onToggle, true); if (slot.dispose === dispose) {slot.dispose = null; slot.refresh = null;} if (mounts.get(root) === dispose) mounts.delete(root);};
  slot.dispose = dispose; slot.refresh = drawSummary; mounts.set(root, dispose); draw(); load(); return dispose;
}
