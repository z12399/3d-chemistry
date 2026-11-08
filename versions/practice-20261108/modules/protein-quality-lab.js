import {escapeHTML as esc} from './storage.js';
import {PROTEIN_QUALITY_LAB_ID, PROTEIN_BASIS_IDS, validateProteinQualityDataset, getProteinSample, getProteinPattern, evaluateProteinProfile} from './protein-quality-model.js';
import {PROTEIN_GROUP_LABELS as GROUPS, PROTEIN_GROUP_FORMULAS as SYMBOLS, proteinNumber as num, proteinRatioChart, proteinSelectedCalculation} from './protein-quality-diagrams.js';
export {PROTEIN_QUALITY_LAB_ID} from './protein-quality-model.js';

const owners = new WeakMap(), mounts = new WeakMap(), clone = value => structuredClone(value), signature = value => JSON.stringify(value);
const BASIS = {'crude-protein':'粗蛋白（原文氮換算）', 'amino-acid-sum':'原文無水胺基酸總量'};
const MODE = {composition:'對照胺基酸', evidence:'看消化證據'};
const DETAILS = {writing:'判讀與修訂', numbers:'原始數值與計算', methods:'完整方法與限制', sources:'完整來源', records:'保留紀錄', summary:'完整摘要'};
const MAX_ROUNDS = 40, MAX_RECORDS = 32, MAX_EVENTS = 120;
const words = value => Array.isArray(value) ? value.map(words).join('；') : value && typeof value === 'object' ? Object.values(value).map(words).join('；') : String(value ?? '');
const fresh = () => ({a:'tm-blanched', b:'ad-blanched', pattern:'young-child', basis:'crude-protein', group:'SAA', mode:'composition', details:[],
  rounds:[], selected:{}, records:[], events:[], seen:{profiles:[], methods:[], sources:[], references:[], disclosures:[]}, savedVersions:[], cursor:{started:false, rounds:{}, events:0}});
const remember = (array, value) => {if (!array.includes(value)) array.push(value);};
const safeUrl = value => {try {const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;} catch {return null;}};
const resultUnit = unit => ({score_percent:'分（原文評分）', fraction:'（比例）'}[unit] || unit);
const preamble = '【替代蛋白：組成、分母與消化證據】protein-quality-evidence-v1\n表列平均值的組成比值不等於體內吸收量或全面營養排名。資料來自具名樣本與選定來源表格；計算未傳播原始變異。';
const writingText = value => `原判讀與理由：${value.prediction || '未填'}\n觀察：${value.observation || '未填'}\n修訂：${value.revision || '未填'}`;
const exposureText = seen => `曾顯示組成：${seen.profiles.join('、') || '無'}；曾顯示方法：${seen.methods.join('、') || '無'}；曾核對解釋：${seen.references.join('、') || '無'}；曾展開依據：${seen.disclosures.join('、') || '無'}；開啟來源：${seen.sources.join('、') || '無'}。曾顯示或開啟不表示已讀；本課不宣稱盲測。`;
let serial = 0;
async function defaultLoad(signal) {
  const response = await fetch(new URL('../data/protein-quality.json', import.meta.url), {signal});
  if (!response.ok) throw new Error('Protein quality dataset unavailable');
  return response.json();
}

export function mountProteinQualityLab(root, id = PROTEIN_QUALITY_LAB_ID, {draftOwner, draftKey = id, onSaveSummary, loadData = defaultLoad} = {}) {
  if (!root?.querySelector || !root?.addEventListener) throw new TypeError('A DOM container is required');
  if (id !== PROTEIN_QUALITY_LAB_ID) throw new RangeError('Unknown protein quality activity');
  mounts.get(root)?.();
  let slot;
  if (draftOwner && typeof draftOwner === 'object') {
    if (!owners.has(draftOwner)) owners.set(draftOwner, new Map());
    const map = owners.get(draftOwner), key = String(draftKey);
    if (!map.has(key)) map.set(key, {data:fresh()});
    slot = map.get(key); slot.dispose?.();
  } else slot = {data:fresh()};
  const d = slot.data, prefix = `protein-quality-${++serial}`;
  const $ = name => root.querySelector(`[data-pq-${name}]`), action = name => root.querySelector(`[data-pq-action="${name}"]`);
  let data = null, disposed = false, epoch = 0, abort = null, feedback = '';
  slot.saveStatus ??= '';
  const key = () => `${d.a}:${d.b}:${d.pattern}:${d.basis}`;
  const current = () => d.rounds.find(r => r.id === d.selected[key()]) || null;
  const pair = () => [d.a, d.b].map(sampleId => ({sample:getProteinSample(data, sampleId), profile:evaluateProteinProfile(data, {sampleId, patternId:d.pattern, basisId:d.basis})}));
  const sourceText = ids => ids.map(id => data.sources.find(s => s.id === id)).filter(Boolean).map(s => `${s.title}\n${s.url}\n定位：${words(s.locator)}`).join('\n');
  const sourceList = ids => `<ul class="pq-source-list">${ids.map(id => data.sources.find(s => s.id === id)).filter(Boolean).map(s => `<li>${safeUrl(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-pq-source="${esc(s.id)}">${esc(s.title)} ↗</a>` : esc(s.title)}<p class="pq-caption">${esc(words(s.locator))}</p></li>`).join('')}</ul>`;
  function profileText(sample, profile) {
    return `${sample.label}｜${sample.sourceId} ${sample.table} ${sample.sourceColumn}\n原表基準：${sample.aminoAcidBasis}；蛋白分母：${BASIS[profile.basisId]}${profile.denominator ? ` ${num(profile.denominator.mean)} g／100 g 乾燥樣本` : ' 未提供'}\n${profile.rows.map(row => `${SYMBOLS[row.groupId]}：${row.ratio === null ? `無法計算（${row.status}）` : `${num(row.mgPerGProtein)} ÷ ${num(row.referenceMgPerGProtein, 1)} = ${num(row.ratio)} 倍`}`).join('；')}\n${profile.complete ? `完整最低組成比值 ${num(profile.minimumRatio)} 倍，組成評分 ${num(profile.scorePercent, 1)}；最低組 ${profile.limitingGroupIds.map(g => SYMBOLS[g]).join('、')}` : '資料不完整；完整最低比值、組成評分與全體限制胺基酸均無法判定。'}`;
  }
  function context() {
    const values = pair(), pattern = getProteinPattern(data, d.pattern), ids = [...new Set([...values.map(v => v.sample.sourceId), pattern.sourceId])];
    return {key:key(), a:d.a, b:d.b, pattern:d.pattern, basis:d.basis,
      title:`${values[0].sample.label} ↔ ${values[1].sample.label}｜${pattern.label}｜${BASIS[d.basis]}`,
      profiles:values.map(v => profileText(v.sample, v.profile)), complete:values.every(v => v.profile.complete),
      sourceIds:ids, sources:sourceText(ids), version:data.version ?? data.schemaVersion};
  }
  function question(c) {
    return c.complete ? {prompt:'只看目前組成圖，能支持哪種結論？', answer:'composition', choices:[
      {id:'composition', label:'能比較選定基準下的胺基酸組成'},
      {id:'absorbed', label:'已知人體實際可吸收的胺基酸量'},
      {id:'winner', label:'能決定哪種原料全面較有營養'}],
      explanation:'目前比值只由表列胺基酸、選定蛋白分母與參考模式換算。消化測量對象與方法仍需另外核對；更高比值不能單獨證明全面營養優勢。'}
      : {prompt:'目前能確定兩個樣本的完整最低組成比值嗎？', answer:'incomplete', choices:[
        {id:'zero', label:'可以，把未提供的胺基酸設成零'},
        {id:'observed', label:'可以，使用看得到的最低值'},
        {id:'incomplete', label:'不能，先補足缺項或蛋白分母'}],
        explanation:'完整最低值需要九組比值都可計算。此表缺項或未提供所選分母時，只能保留可觀察資料；最低已觀測比值不能冒充全表的限制胺基酸。'};
  }
  function ensureRound(force = false) {
    if (current() && !force) return current();
    if (d.rounds.length >= MAX_ROUNDS) {feedback = `已保留 ${MAX_ROUNDS} 輪，不覆寫。請先保存或複製摘要。`; return null;}
    const c = context(), r = {id:d.rounds.length + 1, context:c, question:question(c), choice:'', writing:{prediction:'', observation:'', revision:''}, first:null, review:null, methodText:null};
    d.rounds.push(r); d.selected[key()] = r.id; return r;
  }
  const hasDraft = r => !!r && (!!r.choice || Object.values(r.writing).some(Boolean));
  const choiceLabel = r => r.question.choices.find(c => c.id === r.choice)?.label || '未選';
  function freezeFirst(r, trigger) {
    if (!r || r.first) return;
    r.first = clone({id:r.id, context:r.context, trigger, question:r.question.prompt, choice:r.choice, choiceLabel:choiceLabel(r), writing:r.writing, exposure:d.seen});
  }
  function leave(trigger) {const r = current(); if (r && (hasDraft(r) || r.review || r.methodText)) freezeFirst(r, trigger);}
  const firstText = first => `第 ${first.id} 輪｜${first.context.title}\n${first.trigger}\n當時題目：${first.question}\n首次選擇：${first.choiceLabel}\n${writingText(first.writing)}\n條件對應的計算快照（是否曾顯示見下方）：\n${first.context.profiles.join('\n')}\n${exposureText(first.exposure)}\n資料版本：${first.context.version}\n${first.context.sources}`;
  const reviewText = r => `第 ${r.id} 輪核對｜${r.context.title}\n${r.review.trigger}\n${r.review.assessed ? `首次選擇${r.review.correct ? '符合' : '不符合'}這份資料的判讀界線。` : '未作答即看參考；不計作答結果。'}\n${r.question.explanation}\n${exposureText(r.review.exposure)}`;
  function eventRoom() {if (d.events.length < MAX_EVENTS) return true; feedback = `已保留 ${MAX_EVENTS} 項紀錄，不覆寫。請先保存或複製。`; return false;}
  function appendPlan() {
    const next = clone(d.cursor), parts = [], versions = [];
    for (const r of d.rounds) {
      const old = next.rounds[r.id] || {first:false, review:false, method:false, writing:''};
      if (r.first && !old.first) parts.push(firstText(r.first));
      if (r.review && !old.review) parts.push(reviewText(r));
      if (r.methodText && !old.method) parts.push(`第 ${r.id} 輪揭示消化證據｜${r.context.title}\n${r.methodText}`);
      const version = signature({choice:r.choice, writing:r.writing});
      if (version !== old.writing && (hasDraft(r) || old.writing)) {
        const text = `第 ${r.id} 輪目前文字版本｜${r.context.title}\n${r.first ? '首次選擇已固定' : '尚未核對的判讀草稿'}：${choiceLabel(r)}\n${writingText(r.writing)}`;
        parts.push(text); versions.push({roundId:r.id, text});
      }
      if (r.first || r.review || r.methodText || hasDraft(r) || old.writing) next.rounds[r.id] = {first:!!r.first, review:!!r.review, method:!!r.methodText, writing:version};
    }
    parts.push(...d.events.slice(next.events).map((e, i) => `紀錄 ${next.events + i + 1}｜${e.label}\n${e.text}`)); next.events = d.events.length;
    if (parts.length && !next.started) {parts.unshift(preamble); next.started = true;}
    return {text:parts.join('\n\n'), next, versions};
  }
  function fullText() {
    const rounds = d.rounds.filter(r => r.first || r.review || r.methodText || hasDraft(r) || d.savedVersions.some(v => v.roundId === r.id));
    if (!rounds.length && !d.events.length) return '';
    return [preamble, ...rounds.flatMap(r => [r.first ? firstText(r.first) : `第 ${r.id} 輪｜${r.context.title}｜尚未核對`,
      ...(r.review ? [reviewText(r)] : []), ...(r.methodText ? [`揭示的消化證據：\n${r.methodText}`] : []), ...d.savedVersions.filter(v => v.roundId === r.id).map(v => v.text),
      `目前選擇：${choiceLabel(r)}\n${writingText(r.writing)}`]), ...d.events.map((e, i) => `紀錄 ${i + 1}｜${e.label}\n${e.text}`)].join('\n\n');
  }

  root.innerHTML = `<section class="protein-quality-lab" aria-labelledby="${prefix}-title">
    <h2 id="${prefix}-title">蛋白質含量高，營養品質就比較好嗎？</h2><p class="pq-caption">先對齊胺基酸與參考模式，再看消化證據能回答到哪裡。</p>
    <nav class="pq-modes" aria-label="替代蛋白學習畫面">${Object.entries(MODE).map(([id, label]) => `<button type="button" data-pq-mode="${id}">${label}</button>`).join('')}</nav>
    <p class="pq-caption" role="status" data-pq-load-status>正在讀取來源資料…</p><button type="button" data-pq-action="retry" hidden>重試載入</button>
    <div class="pq-controls"><label class="pq-sample-a" for="${prefix}-a"><span>A 樣本</span><select id="${prefix}-a" data-pq-a disabled></select></label><label class="pq-sample-b" for="${prefix}-b"><span>B 樣本</span><select id="${prefix}-b" data-pq-b disabled></select></label><label for="${prefix}-pattern"><span>參考模式</span><select id="${prefix}-pattern" data-pq-pattern disabled></select></label><label for="${prefix}-basis"><span>蛋白分母</span><select id="${prefix}-basis" data-pq-basis disabled>${Object.entries(BASIS).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select></label></div>
    <section data-pq-panel="composition"><div class="pq-pair-results" data-pq-results></div><div class="pq-profile-grid"><figure><figcaption>九組胺基酸比值</figcaption><div class="pq-chart-scroll" tabindex="0" role="region" aria-label="胺基酸對照圖，各列可點選；窄螢幕可局部捲動" data-pq-chart></div><p class="pq-caption">1 倍＝選定參考模式。A 為藍綠、B 為棕色；點選一列看算式。<span class="pq-scroll-note">窄螢幕可左右捲動圖表。</span></p></figure><aside class="pq-reading" data-pq-reading></aside></div><p class="pq-caption">依表列平均值換算；尚未校正消化率，也未推算誤差或統計差異。</p></section>
    <section data-pq-panel="evidence" hidden><h3>研究測到哪一步？</h3><p class="pq-caption">保留研究自己的方法與結果；不把體外估計改稱人体實測。</p><div class="pq-evidence-grid" data-pq-evidence></div></section>
    <section class="pq-question"><h3 data-pq-question></h3><div class="pq-choices" role="group" aria-label="先留下我的判讀" data-pq-choices></div><div class="pq-actions"><button type="button" data-pq-action="check">核對我的判讀</button><button type="button" data-pq-action="reveal">先看參考解釋</button><button type="button" data-pq-action="new">新一輪判讀</button></div><p role="status" data-pq-answer></p></section>
    <div class="pq-actions pq-save-actions"><button type="button" data-pq-action="record">保留這組觀察</button><span data-pq-count></span><button type="button" class="pq-primary" data-pq-action="save">保存到本課筆記</button></div><p role="status" data-pq-feedback></p><p role="status" data-pq-save-status></p>
    <details data-pq-details="writing"><summary>寫下判讀、觀察與修訂</summary><p class="pq-caption" data-pq-writing-context></p>${[['prediction','原判讀與理由'],['observation','我看到的數值或方法'],['revision','我的修訂']].map(([id, label]) => `<label for="${prefix}-${id}">${label}<textarea id="${prefix}-${id}" data-pq-${id} rows="3" maxlength="1200"></textarea></label>`).join('')}<p class="pq-preserved" data-pq-first></p></details>
    <details data-pq-details="numbers"><summary>原始數值、單位與完整計算</summary><div data-pq-numbers></div></details>
    <details data-pq-details="methods"><summary>完整方法、適用範圍與其他評估因素</summary><div data-pq-methods></div></details>
    <details data-pq-details="sources"><summary>完整來源與定位</summary><div data-pq-sources></div></details>
    <details data-pq-details="records"><summary>回看觀察與原判讀</summary><div data-pq-records></div></details>
    <details data-pq-details="summary"><summary>待存內容與完整摘要</summary><label for="${prefix}-append">這次會附加的內容<textarea id="${prefix}-append" data-pq-append rows="5" readonly></textarea></label><label for="${prefix}-summary">完整摘要（含已保存文字版本）<textarea id="${prefix}-summary" data-pq-summary rows="6" readonly></textarea></label><button type="button" data-pq-action="copy">選取完整摘要</button><p class="pq-caption">同頁返回可接續。重新整理前請保存筆記；過長內容會保留供複製。</p></details>
  </section>`;

  function drawSummary() {
    if (disposed) return;
    $('append').value = appendPlan().text; $('summary').value = fullText();
    action('save').disabled = !!slot.pending || !$('append').value || typeof onSaveSummary !== 'function'; $('save-status').textContent = slot.saveStatus;
  }
  function drawWriting() {
    const r = current(); $('writing-context').textContent = r ? `第 ${r.id} 輪｜${r.context.title}。切換比較條件或揭示方法會保留當時原判讀。` : '等待資料載入。';
    for (const name of ['prediction','observation','revision']) {$(name).value = r?.writing[name] || ''; $(name).disabled = !r; $(name).readOnly = name === 'prediction' && !!r?.first;}
    $('first').textContent = r?.first ? `已固定首次選擇：${r.first.choiceLabel}\n原判讀：${r.first.writing.prediction || '未填'}\n${exposureText(r.first.exposure)}` : '';
  }
  function drawQuestion() {
    const r = current(); $('question').textContent = r?.question.prompt || '等待來源資料。';
    $('choices').innerHTML = r ? r.question.choices.map(choice => `<button type="button" data-pq-choice="${choice.id}" aria-pressed="${r.choice === choice.id}"${r.first || !data ? ' disabled' : ''}>${esc(choice.label)}</button>`).join('') : '';
    action('check').disabled = !data || !r?.choice || !!r.review; action('reveal').disabled = !data || !r || !!r.review; action('new').disabled = !data;
    $('answer').textContent = r?.review ? `${r.review.assessed ? (r.review.correct ? '這份判讀符合目前資料界線。' : '請保留原判讀，再依資料界線修訂。') : '已顯示參考，未記作答結果。'} ${r.question.explanation}` : '';
  }
  function resultMarkup(sample, profile, letter) {
    const line = profile.complete ? `最低組成比值 ${num(profile.minimumRatio)} 倍（${profile.limitingGroupIds.map(id => SYMBOLS[id]).join('、')}）` : '完整最低組成比值：無法判定';
    const explanation = !profile.basisSupported ? '此表未提供所選蛋白分母。' : profile.complete ? `組成評分 ${num(profile.scorePercent, 1)}；未校正消化率。` : '此表缺 Cys／Trp；最低已觀測值不等於全表最低值。';
    return `<article><h3>${letter} · ${esc(sample.label)}</h3><p class="pq-result">${esc(line)}</p><p>${esc(explanation)}</p></article>`;
  }
  function drawComposition() {
    const values = pair(); $('chart').innerHTML = proteinRatioChart(values.map(v => v.profile), d.group);
    $('reading').innerHTML = `<h3>${GROUPS[d.group]} · ${SYMBOLS[d.group]}</h3>${values.map((value, i) => {const calculation = proteinSelectedCalculation(value.sample, value.profile, d.group); return `<article><h3>${i ? 'B' : 'A'} · ${esc(value.sample.label)}</h3><p>${esc(calculation.source)}</p><p class="pq-calculation">${esc(calculation.calculation)}</p><p class="pq-caption">${esc(calculation.reference)}</p></article>`;}).join('')}`;
    $('results').innerHTML = values.map((v, i) => resultMarkup(v.sample, v.profile, i ? 'B' : 'A')).join('');
    if (d.mode === 'composition') remember(d.seen.profiles, key());
  }
  function evidenceFor(sample) {return data.digestibilityEvidence.find(e => e.id === sample.digestibilityEvidenceId);}
  function methodText(sample, evidence) {
    return `${sample.label}\n測量方法：${words(evidence.method)}\n觀察對象：${words(evidence.observed)}\n能支持：${words(evidence.canConclude)}\n不能支持：${words(evidence.cannotConclude)}\n${(evidence.reportedResults || []).filter(r => r.sampleId === sample.id).map(r => `${r.label}：${r.value}${r.sd == null ? '' : ` ± ${r.sd}`} ${resultUnit(r.unit)}；${words(r.locator)}`).join('\n')}\n${sourceText(evidence.sourceIds)}`;
  }
  function revealMethods(trigger) {
    const r = current(); if (!data || !r || r.methodText) return;
    if (hasDraft(r)) freezeFirst(r, trigger);
    r.methodText = pair().map(v => methodText(v.sample, evidenceFor(v.sample))).join('\n\n') + `\n${exposureText(d.seen)}`;
    for (const value of pair()) remember(d.seen.methods, value.sample.digestibilityEvidenceId);
  }
  function drawEvidence() {
    $('evidence').innerHTML = pair().map(({sample}, index) => {
      const e = evidenceFor(sample), results = (e.reportedResults || []).filter(r => r.sampleId === sample.id);
      const observation = e.id === 'hammer-infogest' ? '分餾後分析各胺基酸；作者據此估計體外消化品質。' : 'OPA 量測游離胺基，與逐項胺基酸的消化測量不同。';
      return `<article><h3>${index ? 'B' : 'A'} · ${esc(sample.label)}</h3><div class="pq-evidence-path"><div class="pq-evidence-step"><strong>組成分析</strong><p>${esc(sample.table)}，${sample.missingAminoAcids.length ? '此表未提供 Cys／Trp' : '九組可由原表換算'}。</p></div><div class="pq-evidence-step"><strong>${esc(e.label)}</strong><p>${observation}</p></div><div class="pq-evidence-step" data-pq-evidence-kind="unknown"><strong>人體效果：未知</strong><p>尚非人體迴腸實測，不能推得人體吸收量或健康效果。</p></div></div>${results.map(r => `<p class="pq-result">${esc(r.label)}：${num(r.value, r.value < 2 ? 2 : 1)}${r.sd == null ? '' : ` ± ${num(r.sd, r.value < 2 ? 2 : 1)}`} ${esc(resultUnit(r.unit))}</p>`).join('')}<p class="pq-caption">原研究結果保留原條件；不隨上方參考模式或分母重算。</p></article>`;
    }).join('');
  }
  function drawNumbers() {
    const values = pair(), pattern = getProteinPattern(data, d.pattern);
    $('numbers').innerHTML = `<p>使用表列平均值計算，不把 ±SD 當成可信區間，也不由四捨五入後的欄位推算显著差異。個別 AA 與無水殘基質量分開保留。</p>${values.map(({sample, profile}, i) => `<h3>${i ? 'B' : 'A'} · ${esc(sample.label)}</h3><p>${esc(sample.taxon)}；${esc(sample.processing)}</p><p>來源：${esc(sample.sourceId)} ${esc(sample.table)}，${esc(sample.sourceColumn)}。${sample.aminoAcidBasis === 'g_per_100g_crude_protein' ? 'AA 單位：g／100 g 粗蛋白。' : 'AA 單位：g／100 g 乾燥樣本；個別 AA 使用自由胺基酸分子量。'}</p><p>粗蛋白 ${num(sample.proteinDenominators.crude?.mean)} ± ${num(sample.proteinDenominators.crude?.sd)}；無水 AA 總量 ${sample.proteinDenominators.anhydrous ? `${num(sample.proteinDenominators.anhydrous.mean)} ± ${num(sample.proteinDenominators.anhydrous.sd)}` : '此表未提供'}（g／100 g 乾燥樣本）。乾物質比例：${sample.dryMatterPercent ? `${num(sample.dryMatterPercent.mean)} ± ${num(sample.dryMatterPercent.sd)}%` : '未提供，不反推鮮重'}。</p><div class="pq-table-scroll" tabindex="0" role="region" aria-label="${i ? 'B' : 'A'} 樣本原始胺基酸表"><table><thead><tr><th>原表 AA</th><th>平均值 ±SD</th><th>來源欄文字</th></tr></thead><tbody>${Object.entries(sample.aminoAcids).map(([id, cell]) => `<tr><th>${esc(id)}</th><td>${cell ? `${num(cell.mean)} ± ${num(cell.sd)}` : '此表未提供'}</td><td>${cell ? esc(cell.sourceCell) : 'unknown；不補零'}</td></tr>`).join('')}</tbody></table></div><div class="pq-table-scroll" tabindex="0" role="region" aria-label="${i ? 'B' : 'A'} 樣本九組比值計算"><table><thead><tr><th>胺基酸組</th><th>mg／g 蛋白</th><th>參考 mg／g</th><th>比值</th></tr></thead><tbody>${profile.rows.map(r => `<tr><th>${SYMBOLS[r.groupId]}</th><td>${num(r.mgPerGProtein)}</td><td>${num(r.referenceMgPerGProtein, 1)}</td><td>${num(r.ratio)}</td></tr>`).join('')}</tbody></table></div>`).join('')}<p>參考模式：${esc(pattern.label)}，FAO 2013 Table 5（印刷頁29）。Met+Cys 合為含硫組；Phe+Tyr 合為芳香族組。本頁保留高於 1 的組成比值，不做上限截斷。</p>`;
  }
  function drawRecords() {
    const rounds = d.rounds.filter(r => r.first || r.review || r.methodText || hasDraft(r));
    $('count').textContent = `已保留 ${d.records.length} 組觀察`;
    $('records').innerHTML = rounds.map(r => `<article><h3>第 ${r.id} 輪 · ${esc(r.context.title)}</h3><p class="pq-record-text">${esc(r.first ? firstText(r.first) : writingText(r.writing))}</p>${r.review ? `<p class="pq-record-text">${esc(reviewText(r))}</p>` : ''}</article>`).join('') + d.records.map((r, i) => `<article><h3>觀察 ${i + 1}</h3><p class="pq-record-text">${esc(r.text)}</p></article>`).join('');
    if (!rounds.length && !d.records.length) $('records').textContent = '尚未保留觀察或作答。';
  }
  function draw() {
    if (disposed) return;
    for (const mode of Object.keys(MODE)) {root.querySelector(`[data-pq-panel="${mode}"]`).hidden = d.mode !== mode; root.querySelector(`[data-pq-mode="${mode}"]`).setAttribute('aria-pressed', String(d.mode === mode));}
    for (const name of ['a','b','pattern','basis']) {$(name).disabled = !data; $(name).value = d[name];}
    action('record').disabled = !data;
    if (data) {drawComposition(); if (d.mode === 'evidence') drawEvidence(); drawNumbers();}
    else for (const name of ['chart','reading','results','evidence','numbers','methods','sources']) $(name).innerHTML = '';
    drawQuestion(); drawWriting(); drawRecords(); $('feedback').textContent = feedback; drawSummary();
  }
  function onChange(event) {
    if (disposed || !data || !root.contains(event.target)) return;
    const name = ['a','b','pattern','basis'].find(n => event.target === $(n)); if (!name) return;
    const value = event.target.value;
    const allowed = name === 'basis' ? PROTEIN_BASIS_IDS : name === 'pattern' ? ['young-child','older'] : data.samples.map(s => s.id);
    if (!allowed.includes(value) || value === d[name]) return;
    leave('切換比較條件前保留原判讀'); d[name] = value; feedback = ''; ensureRound();
    if (d.mode === 'evidence' || d.details.includes('methods')) revealMethods('已開啟方法畫面；固定當時判讀後顯示');
    draw();
  }
  function onInput(event) {
    if (disposed || !root.contains(event.target)) return;
    const name = ['prediction','observation','revision'].find(n => event.target === $(n)), r = current();
    if (!name || !r || name === 'prediction' && r.first) return;
    r.writing[name] = String(event.target.value).slice(0, 1200); drawSummary(); drawRecords();
  }
  function save() {
    const plan = appendPlan(); if (!plan.text || slot.pending || typeof onSaveSummary !== 'function') return;
    if (plan.text.length > 10000) {slot.saveStatus = '尚未保存：本次超過 10,000 字元。全文完整保留，可選取摘要複製。'; return drawSummary();}
    const token = {}; slot.pending = token; slot.saveStatus = '正在保存固定的本次內容；仍可繼續修訂。'; drawSummary();
    const finish = (ok, error) => {if (slot.pending !== token) return; slot.pending = null; if (ok === true) {d.cursor = plan.next; d.savedVersions.push(...plan.versions); slot.saveStatus = '已附加本次內容；重複按下不會重複加入。';} else slot.saveStatus = error ? `尚未保存：${error?.message || '儲存失敗'}。待存內容完整保留。` : '尚未保存：請檢查筆記容量與儲存狀態。待存內容完整保留。'; slot.refresh?.();};
    try {const result = onSaveSummary(plan.text); if (result && typeof result.then === 'function') Promise.resolve(result).then(finish, error => finish(false, error)); else finish(result);} catch (error) {finish(false, error);}
  }
  function onClick(event) {
    if (disposed || !root.contains(event.target)) return;
    const link = event.target.closest('[data-pq-source]');
    if (link) {if (!data) return; const id = link.dataset.pqSource; if (data.sources.some(s => s.id === id) && !d.seen.sources.includes(id)) {if (!eventRoom()) {event.preventDefault?.(); return draw();} if (hasDraft(current())) freezeFirst(current(), '開啟來源前保留原判讀'); remember(d.seen.sources, id); d.events.push({label:'開啟來源（不代表已讀）', text:sourceText([id])});} drawQuestion(); drawWriting(); drawSummary(); return;}
    const mode = event.target.closest('[data-pq-mode]');
    if (mode) {const target = mode.dataset.pqMode; if (!Object.hasOwn(MODE, target) || target === d.mode) return; if (target === 'evidence' && data) revealMethods('顯示消化方法前保留原判讀'); d.mode = target; return draw();}
    const group = event.target.closest('[data-pq-group]');
    if (group && data) {const id = group.dataset.pqGroup; if (Object.hasOwn(GROUPS, id)) {d.group = id; draw(); root.querySelector(`[data-pq-group="${id}"]`)?.focus();} return;}
    const choice = event.target.closest('[data-pq-choice]');
    if (choice && data) {const r = current(); if (r && !r.first && r.question.choices.some(c => c.id === choice.dataset.pqChoice)) r.choice = choice.dataset.pqChoice; drawQuestion(); drawSummary(); root.querySelector(`[data-pq-choice="${choice.dataset.pqChoice}"]`)?.focus(); return;}
    const button = event.target.closest('[data-pq-action]'); if (!button || button.disabled) return;
    const name = button.dataset.pqAction;
    if (name === 'retry') return load();
    if (name === 'copy') {$('summary').focus(); $('summary').select(); return;}
    if (name === 'save') return save();
    if (!data) return;
    const r = current();
    if (name === 'check' || name === 'reveal') {
      if (!r || r.review || name === 'check' && !r.choice) return;
      freezeFirst(r, name === 'check' ? '核對我的判讀' : '未作答也可先看參考');
      r.review = clone({trigger:name === 'check' ? '核對我的判讀' : '先看參考解釋', assessed:!!r.choice, correct:r.choice === r.question.answer, exposure:d.seen});
      remember(d.seen.references, r.context.key); feedback = '首次選擇與原文已保留；可在修訂欄留下新判斷。';
    } else if (name === 'new') {
      if (d.rounds.length >= MAX_ROUNDS) {feedback = `已保留 ${MAX_ROUNDS} 輪，不覆寫原判讀。請先保存或複製。`; return draw();}
      freezeFirst(r, '新一輪前保留原判讀'); ensureRound(true);
      if (d.mode === 'evidence' || d.details.includes('methods')) revealMethods('這輪開始時方法已顯示');
      feedback = '已開始新一輪；舊判讀仍保留，曾顯示的資料也會一併記錄。';
    } else if (name === 'record') {
      if (d.records.length >= MAX_RECORDS) {feedback = `已保留 ${MAX_RECORDS} 組，不覆寫舊觀察。請先保存或複製。`; return draw();}
      if (!eventRoom()) return draw();
      const c = context(), text = `${c.title}\n選取胺基酸：${GROUPS[d.group]}（${SYMBOLS[d.group]}）\n${c.profiles.join('\n\n')}\n目前畫面：${MODE[d.mode]}\n${exposureText(d.seen)}\n資料版本：${c.version}\n${c.sources}`;
      if (!d.records.some(v => v.text === text)) {d.records.push({text}); d.events.push({label:'保留組成觀察', text});}
      feedback = '已保留這組條件與數值。保存到本課筆記後，會納入匯出與還原。';
    }
    draw();
  }
  function onToggle(event) {
    if (disposed || !root.contains(event.target) || !event.target.dataset.pqDetails) return;
    const id = event.target.dataset.pqDetails, wasOpen = d.details.includes(id);
    d.details = d.details.filter(v => v !== id); if (event.target.open) d.details.push(id);
    if (data && event.target.open && !wasOpen) {
      if (id === 'methods') {revealMethods('展開完整方法前保留原判讀'); data.digestibilityEvidence.forEach(e => remember(d.seen.methods, e.id));}
      if (id === 'sources' && hasDraft(current())) freezeFirst(current(), '展開來源前保留原判讀');
      if (['sources','methods','numbers'].includes(id)) remember(d.seen.disclosures, DETAILS[id]);
    }
    drawQuestion(); drawWriting(); drawSummary();
  }
  async function load() {
    const token = ++epoch; abort?.abort(); abort = new AbortController(); data = null; action('retry').hidden = true; $('load-status').textContent = '正在核對來源資料…'; draw();
    try {
      const raw = await loadData(abort.signal); if (disposed || token !== epoch) return;
      const checked = validateProteinQualityDataset(raw), identity = signature(checked);
      if (slot.datasetIdentity && slot.datasetIdentity !== identity) throw new Error('Dataset changed during an existing learning session');
      slot.datasetIdentity = identity; data = checked;
      for (const name of ['a','b']) $(name).innerHTML = data.samples.map(s => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join('');
      $('pattern').innerHTML = data.patterns.filter(p => ['young-child','older'].includes(p.id)).map(p => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('');
      ensureRound();
      if (d.mode === 'evidence' || d.details.includes('methods')) revealMethods('載入時方法已展開；保留當時判讀');
      if (d.details.includes('methods')) data.digestibilityEvidence.forEach(e => remember(d.seen.methods, e.id));
      if (d.details.includes('sources') && hasDraft(current())) freezeFirst(current(), '載入時來源已展開；保留當時判讀');
      $('sources').innerHTML = sourceList(data.sources.map(s => s.id)) + '<h3>逐項依據</h3>' + data.claims.map(c => `<article><p>${esc(c.text)}</p><p class="pq-caption">${esc(words(c.locator))}</p>${sourceList(c.sourceIds)}</article>`).join('');
      $('methods').innerHTML = data.digestibilityEvidence.map(e => `<article><h3>${esc(e.label)}</h3><p>${esc(words(e.method))}</p><p>觀察：${esc(words(e.observed))}</p><p>能支持：${esc(words(e.canConclude))}</p><p>界線：${esc(words(e.cannotConclude))}</p>${sourceList(e.sourceIds)}</article>`).join('') + `<ul>${(data.limits || []).map(v => `<li>${esc(words(v))}</li>`).join('')}</ul>`;
      for (const id of ['sources','methods','numbers']) if (d.details.includes(id)) remember(d.seen.disclosures, DETAILS[id]);
      $('load-status').textContent = '具名樣本的組成比較；原文方法與完整數字可展開查看。'; draw();
    } catch (error) {
      if (disposed || token !== epoch) return;
      data = null; $('load-status').textContent = '資料未能讀取或通過核對。既有文字與觀察仍在，可重試載入。'; action('retry').hidden = false; draw();
    }
  }
  for (const node of root.querySelectorAll('[data-pq-details]')) node.open = d.details.includes(node.dataset.pqDetails);
  action('save').hidden = typeof onSaveSummary !== 'function';
  root.addEventListener('click', onClick); root.addEventListener('change', onChange); root.addEventListener('input', onInput); root.addEventListener('toggle', onToggle, true);
  const dispose = () => {if (disposed) return; disposed = true; epoch++; abort?.abort(); for (const [name, fn] of [['click',onClick],['change',onChange],['input',onInput]]) root.removeEventListener(name, fn); root.removeEventListener('toggle', onToggle, true); if (slot.dispose === dispose) {slot.dispose = null; slot.refresh = null;} if (mounts.get(root) === dispose) mounts.delete(root);};
  slot.dispose = dispose; slot.refresh = drawSummary; mounts.set(root, dispose); draw(); load(); return dispose;
}
