import {escapeHTML as esc} from './storage.js';
import {THERMAL_SIZE_LAB_ID, THERMAL_SIZE_DEFAULTS, normalizeThermalSizeInput, evaluateThermalSize} from './thermal-size-model.js';
import {validateThermalSizeDataset} from './thermal-size-source.js';
import {thermalNumber as num, thermalSizeGeometry, thermalSizeRatios, thermalChartHorizon, thermalTemperatureChart, thermalSphereReadout} from './thermal-size-diagrams.js';
export {THERMAL_SIZE_LAB_ID} from './thermal-size-model.js';
const owners = new WeakMap(), mounts = new WeakMap(), clone = value => structuredClone(value);
const MODES = {size:'看大小與熱流', temperature:'看溫度與時間'};
const DETAILS = {advanced:'材料與溫度', writing:'判讀與修訂', numbers:'完整計算', assumptions:'模型假設與界線', sources:'完整來源', records:'保留紀錄', summary:'完整摘要'};
const FIELDS = {
  rAMm:{label:'A 半徑', unit:'mm', min:1, max:50, step:1},
  radiusRatio:{label:'B / A 半徑', unit:'倍', min:1, max:4, step:.25},
  h:{label:'對流係數 h', unit:'W / (m²·K)', min:1, max:100, step:1},
  k:{label:'導熱係數 k', unit:'W / (m·K)', min:.05, max:5, step:.05},
  volumetricHeatCapacity:{label:'體積熱容量 ρc', unit:'J / (m³·K)', min:500000, max:5000000, step:100000},
  initialC:{label:'初始溫度', unit:'°C', min:0, max:100, step:1},
  ambientC:{label:'固定環境溫度', unit:'°C', min:0, max:100, step:1},
  targetFraction:{label:'溫差完成比例', unit:'%', min:.1, max:.95, step:.05},
  timeSeconds:{label:'觀察時間', unit:'分鐘', min:0, max:86400, step:30},
};
const fresh = () => ({input:{...THERMAL_SIZE_DEFAULTS}, mode:'size', details:[], rounds:[], selected:{}, records:[], events:[], savedVersions:[], seen:{views:[], disclosures:[], sources:[], references:[]}, cursor:{started:false, rounds:{}, events:0}});
const remember = (array, value) => {if (!array.includes(value)) array.push(value);};
const words = value => Array.isArray(value) ? value.map(words).join('；') : value && typeof value === 'object' ? Object.values(value).map(words).join('；') : String(value ?? '');
const textWriting = value => `原判讀與理由：${value.prediction || '未填'}\n觀察：${value.observation || '未填'}\n修訂：${value.revision || '未填'}`;
const exposureText = seen => `曾顯示畫面：${seen.views.join('、') || '無'}；曾展開依據：${seen.disclosures.join('、') || '無'}；曾核對解釋：${seen.references.join('、') || '無'}；開啟來源：${seen.sources.join('、') || '無'}。曾顯示或開啟不表示已讀；本課不宣稱盲測。`;
const inputText = p => `A 半徑=${p.rAMm} mm；B/A 半徑=${p.radiusRatio}；h=${p.h} W/(m²·K)；k=${p.k} W/(m·K)；ρc=${p.volumetricHeatCapacity} J/(m³·K)；Ti=${p.initialC} °C；T∞=${p.ambientC} °C；f=${p.targetFraction}；觀察時間=${p.timeSeconds} s。`;
const preamble = '【大小、儲熱與加熱冷卻】thermal-size-v1\n教學用均質球、常物性、固定環境溫度、均一且固定的對流係數；無相變、蒸發或內部產熱。參數是假設，不是具名食品實測。向球內傳熱為正。';
let serial = 0;
async function defaultLoad(signal) {const r = await fetch(new URL('../data/thermal-size.json', import.meta.url), {signal}); if (!r.ok) throw new Error('Thermal size sources unavailable'); return r.json();}
export function mountThermalSizeLab(root, id = THERMAL_SIZE_LAB_ID, {draftOwner, draftKey = id, onSaveSummary, loadData = defaultLoad} = {}) {
  if (!root?.querySelector || !root?.addEventListener) throw new TypeError('A DOM container is required');
  if (id !== THERMAL_SIZE_LAB_ID) throw new RangeError('Unknown thermal size activity');
  mounts.get(root)?.(); let slot;
  if (draftOwner && typeof draftOwner === 'object') {if (!owners.has(draftOwner)) owners.set(draftOwner, new Map()); const map = owners.get(draftOwner), key = String(draftKey); if (!map.has(key)) map.set(key, {data:fresh()}); slot = map.get(key); slot.dispose?.();} else slot = {data:fresh()};
  const d = slot.data, prefix = `thermal-size-${++serial}`, $ = name => root.querySelector(`[data-ts-${name}]`), action = name => root.querySelector(`[data-ts-action="${name}"]`);
  let data = null, disposed = false, epoch = 0, abort = null, feedback = ''; slot.saveStatus ??= '';
  const key = () => JSON.stringify(Object.fromEntries(Object.entries(d.input).filter(([id]) => id !== 'timeSeconds')));
  const current = () => d.rounds.find(r => r.id === d.selected[key()]) || null;
  const sourceText = ids => data.sources.filter(s => ids.includes(s.id)).map(s => `${s.title}\n${s.url}\n定位：${words(s.locator)}`).join('\n');
  function sourceList(ids) {return `<ul class="ts-source-list">${data.sources.filter(s => ids.includes(s.id)).map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-ts-source="${esc(s.id)}">${esc(s.title)} ↗</a><p class="ts-caption">${esc(words(s.locator))}</p></li>`).join('')}</ul>`;}
  const evaluated = () => evaluateThermalSize(d.input);
  function quantities(result) {
    return result.spheres.map(s => `${s.id} 半徑${num(s.radiusM * 1000)}mm；V=${num(s.volumeM3 * 1e6, 5)}cm³；A=${num(s.areaM2 * 1e4, 5)}cm²；V/A=${num(s.characteristicLengthM * 1000, 5)}mm；ρcV=${num(s.heatCapacityJPerK, 5)}J/K；Q∞,in=${num(s.totalHeatJ, 5)}J；Qdot_in(0)=${num(s.initialHeatFlowW, 6)}W；初始體積平均溫變率=${num(s.initialMeanRateKPerS, 6)}K/s；Bi=${num(s.biot, 6)}；${result.direction === 'equilibrium' ? `等溫${num(result.input.initialC)}°C；完成比例未定義，時間不計算` : s.applicable ? `τ=${num(s.tauSeconds, 4)}s；目前T=${num(s.temperatureC, 5)}°C；達標t=${num(s.targetTimeSeconds, 4)}s（近均溫近似）` : '近均溫模型不適用：τ、T(t)、達標時間皆不作預測'}`).join('\n');
  }
  function context() {
    const r = evaluated(), i = r.input;
    return {key:key(), input:clone(i), result:clone(r), title:`A ${num(i.rAMm)}mm ↔ B ${num(i.rAMm * i.radiusRatio)}mm｜h=${num(i.h)}｜${num(i.initialC)}→${num(i.ambientC)}°C｜目標${num(i.targetFraction * 100)}%`, calculation:quantities(r), sources:sourceText(data.sources.map(s => s.id)), version:data.version ?? data.schemaVersion};
  }
  function question(c) {
    if (c.result.direction === 'equilibrium') return {prompt:'初始與環境等溫時，如何解讀完成比例？', answer:'undefined', choices:[['zero','比例是 0%，等待時間無限長'],['undefined','沒有初始溫差，比例未定義'],['complete','有 100% 的熱量已傳完']], explanation:'兩球皆無淨熱流、維持初始溫度。完成比例的分母 T∞−Ti 為零，因此不計算比例或該比例的達標時間。'};
    if (c.result.spheres.some(s => !s.applicable)) return {prompt:'有球未通過近均溫篩選，該球的達標時間應如何處理？', answer:'unknown', choices:[['unknown','標為未知，另選能描述內部溫差的模型'],['formula','仍直接使用近均溫公式'],['zero','表示沒有熱傳，所以時間為零']], explanation:'Bi ≥ 0.1 時，本課不使用單一溫度近似預測該球的 T(t) 或達標時間。幾何、總能量差及均勻初始溫度下的初始能量收支仍有意義。平板課是另一種幾何，不能直接代入球半徑。'};
    if (c.input.radiusRatio === 1) return {prompt:'兩球大小、材料與換熱條件都相同，如何比較達標時間？', answer:'equal', choices:[['equal','兩球達標時間相同'],['double','B 需要兩倍時間'],['unknown','即使這些條件相同，也完全無法比較']], explanation:'兩球的 V/A、h、ρc 與完成比例都相同，且都通過本課篩選，因此近均溫模型的時間常數與達標時間相同。'};
    return {prompt:'兩球都通過篩選，B 達到相同溫差完成比例需要多久？', answer:'radius', choices:[['radius',`約為 A 的 ${num(c.input.radiusRatio)} 倍（半徑比）`],['area',`約為 A 的 ${num(c.input.radiusRatio ** 2)} 倍（面積比）`],['volume',`約為 A 的 ${num(c.input.radiusRatio ** 3)} 倍（體積比）`]], explanation:`在相同 h、材料、溫度條件與完成比例下，近均溫模型 t_f = −ρc(V/A) ln(1−f)/h。球的 V/A=R/3，因此時間比是半徑比 ${num(c.input.radiusRatio)}。加熱與冷卻互換只有在這些線性模型條件不变時才對稱。`};
  }
  function ensureRound(force = false) {
    if (current() && !force) return current();
    if (d.rounds.length >= 40) {feedback = '已保留 40 輪，不覆寫舊判讀。請先保存或複製。'; return null;}
    const c = context(), r = {id:d.rounds.length + 1, context:c, question:question(c), choice:'', writing:{prediction:'', observation:'', revision:''}, first:null, review:null}; d.rounds.push(r); d.selected[key()] = r.id; return r;
  }
  const hasDraft = r => !!r && (!!r.choice || Object.values(r.writing).some(Boolean));
  const choiceLabel = r => r.question.choices.find(c => c[0] === r.choice)?.[1] || '未選';
  function freezeFirst(r, trigger) {if (r && !r.first) r.first = clone({id:r.id, context:r.context, trigger, question:r.question.prompt, choice:r.choice, choiceLabel:choiceLabel(r), writing:r.writing, exposure:d.seen});}
  function leave(trigger) {const r = current(); if (r && (hasDraft(r) || r.review)) freezeFirst(r, trigger);}
  const contextText = c => `${inputText(c.input)}\n${c.calculation}\n來源版本：${c.version}\n${c.sources}`;
  const firstText = r => `第 ${r.id} 輪｜${r.context.title}\n${r.trigger}\n題目：${r.question}\n首次選擇：${r.choiceLabel}\n${textWriting(r.writing)}\n當時條件計算（是否曾顯示見下方）：\n${contextText(r.context)}\n${exposureText(r.exposure)}`;
  const reviewText = r => `第 ${r.id} 輪核對｜${r.context.title}\n${r.review.assessed ? `首次選擇${r.review.correct ? '符合' : '不符合'}此模型的判讀界線。` : '未作答即看參考，不計作答結果。'}\n${r.question.explanation}\n${exposureText(r.review.exposure)}`;
  function appendPlan() {
    const next = clone(d.cursor), parts = [], versions = [];
    for (const r of d.rounds) {
      const old = next.rounds[r.id] || {first:false, review:false, context:false, writing:''};
      if (r.first && !old.first) parts.push(firstText(r.first)); if (r.review && !old.review) parts.push(reviewText(r));
      if (!r.first && hasDraft(r) && !old.context) parts.push(`第 ${r.id} 輪未核對草稿條件｜${r.context.title}\n${contextText(r.context)}`);
      const version = JSON.stringify({choice:r.choice, writing:r.writing});
      if (version !== old.writing && (hasDraft(r) || old.writing)) {const text = `第 ${r.id} 輪目前文字版本｜${r.context.title}\n${r.first ? '首次選擇已固定' : '尚未核對的草稿'}：${choiceLabel(r)}\n${textWriting(r.writing)}`; parts.push(text); versions.push({roundId:r.id, text});}
      if (r.first || r.review || hasDraft(r) || old.writing) next.rounds[r.id] = {first:!!r.first, review:!!r.review, context:old.context || !!r.first || hasDraft(r), writing:version};
    }
    parts.push(...d.events.slice(next.events).map((e, i) => `紀錄 ${next.events + i + 1}｜${e.label}\n${e.text}`)); next.events = d.events.length;
    if (parts.length && !next.started) {parts.unshift(preamble); next.started = true;}
    return {text:parts.join('\n\n'), next, versions};
  }
  function fullText() {const rounds = d.rounds.filter(r => r.first || r.review || hasDraft(r) || d.savedVersions.some(v => v.roundId === r.id)); if (!rounds.length && !d.events.length) return ''; return [preamble, ...rounds.flatMap(r => [r.first ? firstText(r.first) : `第 ${r.id} 輪｜${r.context.title}｜尚未核對\n${contextText(r.context)}`, ...(r.review ? [reviewText(r)] : []), ...d.savedVersions.filter(v => v.roundId === r.id).map(v => v.text), `目前選擇：${choiceLabel(r)}\n${textWriting(r.writing)}`]), ...d.events.map((e, i) => `紀錄 ${i + 1}｜${e.label}\n${e.text}`)].join('\n\n');}
  function control(name, type = 'range') {const f = FIELDS[name]; return `<label for="${prefix}-${name}"><span>${f.label} <output data-ts-value="${name}"></output></span><input type="${type}" id="${prefix}-${name}" data-ts-field="${name}" min="${f.min}" max="${f.max}" step="${f.step}" disabled><span class="ts-caption">${f.unit}</span></label>`;}
  root.innerHTML = `<section class="thermal-size-lab" aria-labelledby="${prefix}-title"><h2 id="${prefix}-title">大一點，為什麼升溫與降溫較慢？</h2><p class="ts-caption">兩顆同材料的球，比較儲熱、熱流與時間。</p><nav class="ts-modes" aria-label="大小與熱傳畫面">${Object.entries(MODES).map(([id, label]) => `<button type="button" data-ts-mode="${id}">${label}</button>`).join('')}</nav><p role="status" data-ts-load-status>正在核對來源…</p><button type="button" data-ts-action="retry" hidden>重試載入</button><div class="ts-controls">${['rAMm','radiusRatio','h'].map(id => control(id)).join('')}</div><div class="ts-condition"><p data-ts-condition></p><button type="button" data-ts-action="swap">交換加熱／冷卻</button></div><section data-ts-panel="size"><div data-ts-geometry></div><div data-ts-ratios></div><p class="ts-caption">B / A 倍數；溫變率指均勻初始溫度下的體積平均。球的直徑按比例示意。</p></section><section data-ts-panel="temperature" hidden><div class="ts-target-controls">${control('targetFraction')}${control('timeSeconds')}</div><div class="ts-temperature-pair" data-ts-temperatures></div><figure><figcaption>A 實線 · B 虛線；水平點線為目標溫度</figcaption><div class="ts-chart-scroll" tabindex="0" role="region" aria-label="溫度時間圖；窄螢幕可局部左右捲動" data-ts-chart></div></figure></section><p class="ts-boundary" data-ts-boundary></p><section class="ts-question"><h3 data-ts-question></h3><div class="ts-choices" role="group" aria-label="留下我的判讀" data-ts-choices></div><div class="ts-actions"><button type="button" data-ts-action="check">核對我的判讀</button><button type="button" data-ts-action="reveal">先看參考解釋</button><button type="button" data-ts-action="new">新一輪判讀</button></div><p role="status" data-ts-answer></p></section><div class="ts-actions"><button type="button" data-ts-action="record">保留這組觀察</button><span data-ts-count></span><button type="button" class="ts-primary" data-ts-action="save">保存到本課筆記</button></div><p role="status" data-ts-feedback></p><p role="status" data-ts-save-status></p><details data-ts-details="advanced"><summary>材料與溫度設定</summary><p>兩球共用這些條件；數值為教學假設，調整範圍不代表食品的實測範圍。</p><div class="ts-advanced">${['k','volumetricHeatCapacity','initialC','ambientC'].map(id => control(id, 'number')).join('')}</div></details><details data-ts-details="writing"><summary>寫下判讀、觀察與修訂</summary><p class="ts-caption" data-ts-writing-context></p>${[['prediction','原判讀與理由'],['observation','我觀察到的變化'],['revision','我的修訂']].map(([id, label]) => `<label for="${prefix}-${id}">${label}<textarea id="${prefix}-${id}" data-ts-${id} rows="3" maxlength="1200"></textarea></label>`).join('')}<p class="ts-preserved" data-ts-first></p></details><details data-ts-details="numbers"><summary>完整算式、數值與單位</summary><div data-ts-numbers></div></details><details data-ts-details="assumptions"><summary>模型假設與適用界線</summary><div data-ts-assumptions></div><a href="#process/proc-thermal-processing/proc-heat-penetration-scale/observe">看另一種幾何：平板的熱穿透 →</a><p>平板半厚度與球半徑不同，這裡不轉移參數或結果。</p></details><details data-ts-details="sources"><summary>完整來源與定位</summary><div data-ts-sources></div></details><details data-ts-details="records"><summary>回看觀察與原判讀</summary><div data-ts-records></div></details><details data-ts-details="summary"><summary>待存內容與完整摘要</summary><label for="${prefix}-append">這次會附加的內容<textarea id="${prefix}-append" data-ts-append rows="5" readonly></textarea></label><label for="${prefix}-summary">完整摘要（含已保存文字版本）<textarea id="${prefix}-summary" data-ts-summary rows="6" readonly></textarea></label><button type="button" data-ts-action="copy">選取完整摘要</button><p class="ts-caption">同頁返回可接續。重新整理前請保存筆記；過長內容會保留供複製。</p></details></section>`;
  function drawSummary() {if (disposed) return; $('append').value = appendPlan().text; $('summary').value = fullText(); action('save').disabled = !!slot.pending || !$('append').value || typeof onSaveSummary !== 'function'; $('save-status').textContent = slot.saveStatus;}
  const roundLimit = () => !current() && d.rounds.length >= 40;
  const roundLimitText = '已保留 40 輪；此新條件不能再建立判讀。可返回原條件修訂，或保存、複製既有內容。';
  function drawWriting() {const r = current(); $('writing-context').textContent = r ? `第 ${r.id} 輪｜${r.context.title}` : roundLimit() ? roundLimitText : '可先寫下判讀；切換條件、畫面或核對時會保留原稿。'; for (const name of ['prediction','observation','revision']) {$(name).value = r?.writing[name] || ''; $(name).disabled = !data || roundLimit(); $(name).readOnly = name === 'prediction' && !!r?.first;} $('first').textContent = r?.first ? `已固定首次選擇：${r.first.choiceLabel}\n原判讀：${r.first.writing.prediction || '未填'}\n${exposureText(r.first.exposure)}` : '';}
  function drawQuestion() {const r = current(), q = r?.question || (data ? question(context()) : null); $('question').textContent = q?.prompt || '等待來源核對。'; $('choices').innerHTML = q ? q.choices.map(([id, label]) => `<button type="button" data-ts-choice="${id}" aria-pressed="${r?.choice === id}"${!data || r?.first || roundLimit() ? ' disabled' : ''}>${esc(label)}</button>`).join('') : ''; action('check').disabled = !data || !r?.choice || !!r?.review; action('reveal').disabled = !data || !!r?.review || roundLimit(); action('new').disabled = !data || d.rounds.length >= 40; $('answer').textContent = r?.review ? `${r.review.assessed ? (r.review.correct ? '符合此模型的判讀界線。' : '請保留原判讀，再依觀察修訂。') : '已顯示參考，未記作答結果。'} ${q.explanation}` : '';}
  function drawRecords() {const rounds = d.rounds.filter(r => r.first || r.review || hasDraft(r)); $('count').textContent = `已保留 ${d.records.length} 組`; $('records').innerHTML = rounds.map(r => `<article><h3>第 ${r.id} 輪 · ${esc(r.context.title)}</h3><p class="ts-record-text">${esc(r.first ? firstText(r.first) : textWriting(r.writing))}</p>${r.review ? `<p class="ts-record-text">${esc(reviewText(r))}</p>` : ''}</article>`).join('') + d.records.map((r, i) => `<article><h3>觀察 ${i + 1}</h3><p class="ts-record-text">${esc(r.text)}</p></article>`).join(''); if (!rounds.length && !d.records.length) $('records').textContent = '尚未保留觀察或作答。';}
  function drawNumbers(result) {$('numbers').innerHTML = `<p>向球內為正：加熱的 Q 與 Qdot 為正，冷卻為負。ρc 是體積熱容量，不是比熱 c。</p><p class="ts-equation">V = 4πR³/3；A = 4πR²；L<sub>c</sub> = V/A = R/3<br>Bi = hR/(3k)；Q∞,in = ρcV(T∞−Ti)<br>Qdot_in(0) = hA(T∞−Ti)<br>初始體積平均 dT/dt = Qdot_in(0)/(ρcV)</p><p class="ts-equation">通過近均溫篩選且符合假設時：<br>τ = ρcV/(hA)；T(t) = T∞+(Ti−T∞)e<sup>−t/τ</sup><br>f = (T−Ti)/(T∞−Ti)；t<sub>f</sub> = −τ ln(1−f)</p><p>k 不直接出現在 τ 式中，仍決定能否忽略內部溫差。Bi &lt; 0.1 是工程篩選慣例，並不保證所有食品都有相同誤差。</p><p class="ts-record-text">${esc(quantities(result))}</p>`;}
  function draw() {
    if (disposed) return;
    for (const mode of Object.keys(MODES)) {root.querySelector(`[data-ts-panel="${mode}"]`).hidden = mode !== d.mode; root.querySelector(`[data-ts-mode="${mode}"]`).setAttribute('aria-pressed', String(mode === d.mode));}
    for (const [id, field] of Object.entries(FIELDS)) {const node = root.querySelector(`[data-ts-field="${id}"]`), displayed = num(id === 'targetFraction' ? d.input[id] * 100 : id === 'timeSeconds' ? d.input[id] / 60 : d.input[id]); node.value = String(d.input[id]); node.disabled = !data; node.setAttribute('aria-valuetext', `${displayed} ${field.unit}`); root.querySelector(`[data-ts-value="${id}"]`).textContent = displayed;}
    action('record').disabled = !data; action('swap').disabled = !data;
    if (data) {
      const result = evaluated(), i = result.input;
      $('condition').textContent = `${result.direction === 'equilibrium' ? '等溫' : result.direction === 'heating' ? '加熱' : '冷卻'} ${num(i.initialC)} → ${num(i.ambientC)} °C · 相同材料、相同 h`;
      $('geometry').innerHTML = thermalSizeGeometry(result); $('ratios').innerHTML = thermalSizeRatios(result);
      if (d.mode === 'temperature') {$('temperatures').innerHTML = result.spheres.map(s => thermalSphereReadout(result, s)).join(''); $('chart').innerHTML = thermalTemperatureChart(result);}
      const time = root.querySelector('[data-ts-field="timeSeconds"]'); time.max = String(thermalChartHorizon(result)); time.step = '1';
      const blocked = result.spheres.filter(s => !s.applicable).map(s => s.id);
      $('boundary').textContent = `${blocked.length ? `${blocked.join('、')} 的 Bi ≥ 0.1：不以近均溫模型預測其溫度與達標時間。` : 'A、B 的 Bi < 0.1：可在下方假設內使用近均溫近似。'} 教學參數；不包含食品相變或安全殺菌判定。`;
      remember(d.seen.views, MODES[d.mode]); drawNumbers(result);
    } else {for (const name of ['geometry','ratios','temperatures','chart','condition','boundary','numbers','sources','assumptions']) $(name).innerHTML = '';}
    drawQuestion(); drawWriting(); drawRecords(); $('feedback').textContent = data && roundLimit() ? roundLimitText : feedback; drawSummary();
  }
  function updateField(node) {
    const name = node.dataset.tsField; if (!Object.hasOwn(FIELDS, name)) return;
    try {if (node.value.trim() === '') throw new Error('blank'); const value = Number(node.value), next = normalizeThermalSizeInput({...d.input, [name]:value}); if (value === d.input[name]) return; if (name !== 'timeSeconds') leave('切換條件前保留原判讀'); d.input = {...next}; feedback = ''; draw();}
    catch {feedback = '此數值超出教學範圍；已保留上一組有效條件。'; draw();}
  }
  function onInput(event) {if (disposed || !data || !root.contains(event.target)) return; if (event.target.dataset.tsField && event.target.type === 'range') return updateField(event.target); const name = ['prediction','observation','revision'].find(n => event.target === $(n)); if (!name) return; const r = current() || ensureRound(); if (!r) return draw(); if (name === 'prediction' && r.first) return; r.writing[name] = String(event.target.value).slice(0, 1200); drawSummary(); drawRecords();}
  function onChange(event) {if (disposed || !data || !root.contains(event.target) || !event.target.dataset.tsField) return; updateField(event.target);}
  function eventRoom() {if (d.events.length < 120) return true; feedback = '已保留 120 項紀錄，不覆寫。請先保存或複製。'; return false;}
  function save() {const plan = appendPlan(); if (!plan.text || slot.pending || typeof onSaveSummary !== 'function') return; if (plan.text.length > 10000) {slot.saveStatus = '尚未保存：本次超過 10,000 字元。全文完整保留，可選取摘要複製。'; return drawSummary();} const token = {}; slot.pending = token; slot.saveStatus = '正在保存固定的本次內容；仍可繼續修訂。'; drawSummary(); const finish = (ok, error) => {if (slot.pending !== token) return; slot.pending = null; if (ok === true) {d.cursor = plan.next; d.savedVersions.push(...plan.versions); slot.saveStatus = '已附加本次內容；重複按下不會重複加入。';} else slot.saveStatus = error ? `尚未保存：${error?.message || '儲存失敗'}。待存內容完整保留。` : '尚未保存：請檢查筆記容量與儲存狀態。待存內容完整保留。'; slot.refresh?.();}; try {const result = onSaveSummary(plan.text); if (result && typeof result.then === 'function') Promise.resolve(result).then(finish, error => finish(false, error)); else finish(result);} catch (error) {finish(false, error);}}
  function onClick(event) {
    if (disposed || !root.contains(event.target)) return;
    const link = event.target.closest('[data-ts-source]'); if (link) {if (!data) return; const id = link.dataset.tsSource; if (data.sources.some(s => s.id === id) && !d.seen.sources.includes(id)) {if (!eventRoom()) {event.preventDefault?.(); return draw();} leave('開啟來源前保留原判讀'); remember(d.seen.sources, id); d.events.push({label:'開啟來源（不表示已讀）', text:sourceText([id])});} drawQuestion(); drawWriting(); drawSummary(); return;}
    const mode = event.target.closest('[data-ts-mode]'); if (mode) {const id = mode.dataset.tsMode; if (!Object.hasOwn(MODES, id) || d.mode === id) return; if (data) leave('切換觀察畫面前保留原判讀'); d.mode = id; return draw();}
    const choice = event.target.closest('[data-ts-choice]'); if (choice && data) {const r = current() || ensureRound(); if (!r) return draw(); if (!r.first && r.question.choices.some(c => c[0] === choice.dataset.tsChoice)) r.choice = choice.dataset.tsChoice; drawQuestion(); drawWriting(); drawSummary(); root.querySelector(`[data-ts-choice="${choice.dataset.tsChoice}"]`)?.focus(); return;}
    const button = event.target.closest('[data-ts-action]'); if (!button || button.disabled) return; const name = button.dataset.tsAction;
    if (name === 'retry') return load(); if (name === 'copy') {$('summary').focus(); $('summary').select(); return;} if (name === 'save') return save(); if (!data) return;
    if (name === 'swap') {leave('互換初始與環境溫度前保留原判讀'); d.input = {...d.input, initialC:d.input.ambientC, ambientC:d.input.initialC}; feedback = '';}
    else if (name === 'check' || name === 'reveal') {const r = current() || ensureRound(); if (!r || r.review || name === 'check' && !r.choice) return; freezeFirst(r, name === 'check' ? '核對我的判讀' : '先看參考解釋'); r.review = clone({assessed:!!r.choice, correct:r.choice === r.question.answer, exposure:d.seen}); remember(d.seen.references, r.context.key); feedback = '首次選擇與原文已保留；可在修訂欄留下新判斷。';}
    else if (name === 'new') {if (d.rounds.length >= 40) {feedback = '已保留 40 輪，不覆寫原判讀。'; return draw();} leave('新一輪前保留原判讀'); ensureRound(true); feedback = '已開始新一輪；舊判讀與曾顯示資料仍保留。';}
    else if (name === 'record') {if (d.records.length >= 32) {feedback = '已保留 32 組，不覆寫舊觀察。'; return draw();} if (!eventRoom()) return draw(); leave('保留觀察前固定原判讀'); const c = context(), text = `${c.title}\n觀察時間${num(d.input.timeSeconds / 60)}分鐘｜畫面：${MODES[d.mode]}\n${contextText(c)}\n${exposureText(d.seen)}`; if (!d.records.some(r => r.text === text)) {d.records.push({text}); d.events.push({label:'保留熱傳觀察', text});} feedback = '已保留條件與數值。保存到本課筆記後，會納入匯出與還原。';}
    draw();
  }
  function onToggle(event) {if (disposed || !root.contains(event.target) || !event.target.dataset.tsDetails) return; const id = event.target.dataset.tsDetails, wasOpen = d.details.includes(id); d.details = d.details.filter(v => v !== id); if (event.target.open) d.details.push(id); if (data && event.target.open && !wasOpen && ['numbers','assumptions','sources'].includes(id)) {leave('展開依據前保留原判讀'); remember(d.seen.disclosures, DETAILS[id]);} drawQuestion(); drawWriting(); drawSummary();}
  async function load() {
    const token = ++epoch; abort?.abort(); abort = new AbortController(); data = null; action('retry').hidden = true; $('load-status').textContent = '正在核對來源…'; draw();
    try {const raw = await loadData(abort.signal); if (disposed || token !== epoch) return; const checked = validateThermalSizeDataset(raw), identity = JSON.stringify(checked); if (slot.datasetIdentity && slot.datasetIdentity !== identity) throw new Error('Dataset changed during an existing session'); slot.datasetIdentity = identity; data = checked;
      $('sources').innerHTML = sourceList(data.sources.map(s => s.id)) + '<h3>逐項依據</h3>' + data.claims.map(c => `<article><p>${esc(c.text)}</p><p class="ts-caption">${esc(words(c.locator))}</p>${sourceList(c.sourceIds)}</article>`).join('');
      $('assumptions').innerHTML = `<ul>${[...data.assumptions, ...data.limits].map(t => `<li>${esc(words(t))}</li>`).join('')}</ul>`;
      for (const id of ['numbers','assumptions','sources']) if (d.details.includes(id)) {leave('載入時依據已展開；保留原判讀'); remember(d.seen.disclosures, DETAILS[id]);}
      $('load-status').textContent = ''; draw();
    } catch {if (disposed || token !== epoch) return; data = null; $('load-status').textContent = '來源未能讀取或通過核對。既有文字與觀察仍在，可重試載入。'; action('retry').hidden = false; draw();}
  }
  for (const node of root.querySelectorAll('[data-ts-details]')) node.open = d.details.includes(node.dataset.tsDetails);
  action('save').hidden = typeof onSaveSummary !== 'function';
  root.addEventListener('click', onClick); root.addEventListener('input', onInput); root.addEventListener('change', onChange); root.addEventListener('toggle', onToggle, true);
  const dispose = () => {if (disposed) return; disposed = true; epoch++; abort?.abort(); for (const [name, fn] of [['click',onClick],['input',onInput],['change',onChange]]) root.removeEventListener(name, fn); root.removeEventListener('toggle', onToggle, true); if (slot.dispose === dispose) {slot.dispose = null; slot.refresh = null;} if (mounts.get(root) === dispose) mounts.delete(root);}; slot.dispose = dispose; slot.refresh = drawSummary; mounts.set(root, dispose); draw(); load(); return dispose;
}
