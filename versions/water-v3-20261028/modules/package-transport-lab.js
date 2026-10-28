import {escapeHTML as esc} from './storage.js';
import {PACKAGE_TRANSPORT_ID as PACKAGE_TRANSPORT_LAB_ID, PACKAGE_TRANSPORT_DEFAULTS, normalizePackageTransportInput, evaluatePackageTransport, samplePackageTransport} from './package-transport-model.js';
import {validatePackageTransportDataset} from './package-transport-source.js';
import {packageNumber as num, packageVessel, packageCurve, packageReadings, packageBoundary} from './package-transport-diagrams.js';
export {PACKAGE_TRANSPORT_ID as PACKAGE_TRANSPORT_LAB_ID} from './package-transport-model.js';
const owners = new WeakMap(), mounts = new WeakMap(), clone = value => structuredClone(value);
const MODES = {maintained:'固定兩側分壓', finite:'空容器分壓可變'};
const DETAILS = {advanced:'內側分壓與容積', judgement:'判讀與核對', writing:'觀察與修訂', numbers:'完整算式與收支', assumptions:'模型假設與界線', sources:'完整來源', records:'保留紀錄', summary:'完整摘要'};
const FIELDS = {
  thicknessMicrometre:{label:'膜厚 L',unit:'μm',min:10,max:200,step:1},
  areaM2:{label:'有效膜面積 A',unit:'m²',min:.01,max:.2,step:.005},
  timeDays:{label:'觀察時間 t',unit:'日',min:0,max:100,step:1},
  initialInsidePartialPressureKpa:{label:'內側初始分壓',unit:'kPa O₂',min:0,max:42,step:.5},
  receiverVolumeL:{label:'空容器容積 V',unit:'L',min:.01,max:1,step:.01},
};
const fresh = () => ({input:{...PACKAGE_TRANSPORT_DEFAULTS}, mode:'finite', details:[], rounds:[], selected:{}, records:[], events:[], savedVersions:[], seen:{views:[], disclosures:[], sources:[], references:[]}, cursor:{started:false, rounds:{}, events:0}});
const remember = (array, value) => {if (!array.includes(value)) array.push(value);};
const words = value => Array.isArray(value) ? value.map(words).join('；') : value && typeof value === 'object' ? Object.values(value).map(words).join('；') : String(value ?? '');
const textWriting = value => `原判讀與理由：${value.prediction || '未填'}\n觀察：${value.observation || '未填'}\n修訂：${value.revision || '未填'}`;
const exposureText = seen => `曾顯示畫面：${seen.views.join('、') || '無'}；曾展開依據：${seen.disclosures.join('、') || '無'}；曾核對解釋：${seen.references.join('、') || '無'}；開啟來源：${seen.sources.join('、') || '無'}。曾顯示或開啟不表示已讀；本課不宣稱盲測。`;
const inputText = (p,mode) => `邊界=${MODES[mode]}；L=${p.thicknessMicrometre}μm；A=${p.areaM2}m²；${mode==='finite'?'內側初始':'內側維持'}p=${p.initialInsidePartialPressureKpa}kPa；t=${p.timeDays}日；V=${p.receiverVolumeL}L。P=1000μmol·μm/(m²·日·kPa)；外側p=21kPa；T=298.15K。`;
const preamble = '【包材傳質：膜片與空容器】package-transport-v1\n假想均質、常滲透係數膜；僅氧氣、等溫、膜準穩態。固定分壓由供排氣維持，穿膜量不等於庫存增加；空容器用理想氣體收支，不固定內部總壓。不計水氣、食品反應、封口缺陷、膜內暫態或保存期限。';
let serial = 0;
async function defaultLoad(signal) {const r = await fetch(new URL('../data/package-transport.json', import.meta.url), {signal}); if (!r.ok) throw new Error('Package transport sources unavailable'); return r.json();}
export function mountPackageTransportLab(root, id = PACKAGE_TRANSPORT_LAB_ID, {draftOwner, draftKey = id, onSaveSummary, loadData = defaultLoad} = {}) {
  if (!root?.querySelector || !root?.addEventListener) throw new TypeError('A DOM container is required');
  if (id !== PACKAGE_TRANSPORT_LAB_ID) throw new RangeError('Unknown package transport activity');
  mounts.get(root)?.(); let slot;
  if (draftOwner && typeof draftOwner === 'object') {if (!owners.has(draftOwner)) owners.set(draftOwner, new Map()); const map = owners.get(draftOwner), key = String(draftKey); if (!map.has(key)) map.set(key, {data:fresh()}); slot = map.get(key); slot.dispose?.();} else slot = {data:fresh()};
  const d = slot.data, prefix = `package-transport-${++serial}`, $ = name => root.querySelector(`[data-pt-${name}]`), action = name => root.querySelector(`[data-pt-action="${name}"]`);
  let data = null, disposed = false, epoch = 0, abort = null, feedback = ''; slot.saveStatus ??= '';
  const key = () => JSON.stringify({mode:d.mode, ...d.input});
  const current = () => d.rounds.find(r => r.id === d.selected[key()]) || null;
  const sourceText = ids => data.sources.filter(s => ids.includes(s.id)).map(s => `${s.title}\n${s.url}\n定位：${words(s.locator)}`).join('\n');
  function sourceList(ids) {return `<ul class="pt-source-list">${data.sources.filter(s => ids.includes(s.id)).map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-pt-source="${esc(s.id)}">${esc(s.title)} ↗</a><p class="pt-caption">${esc(words(s.locator))}</p>${s.publisher ? `<p class="pt-caption">發布者：${esc(words(s.publisher))}</p>` : ''}${s.note ? `<p class="pt-caption">${esc(words(s.note))}</p>` : ''}</li>`).join('')}</ul>`;}
  const evaluated = () => evaluatePackageTransport(d.input, data);
  function quantities(r, mode) {
    if(r.status!=='MODEL_OK') return '來源或數值核對未通過；不提供正常曲線或傳輸量。';
    const v=r[mode], m=r.material;
    return `${MODES[mode]}｜${v.boundaryMeaning}\n透過度Π=${num(m.permeanceMicromolM2DayKpa)}μmol/(m²·日·kPa)；t=${num(v.timeDays)}日；內側p=${num(v.pInsideKpa)}kPa；Δp=${num(v.deltaPressureKpa)}kPa。\nJ=${num(v.fluxMicromolM2Day)}μmol/(m²·日)；整膜速率=${num(v.rateMicromolDay)}μmol/日；穿膜累積=${num(v.signedTransferredMicromol)}μmol。\n初始容器氧量=${num(r.initial.receiverInventoryMicromol)}μmol；當前容器氧量=${num(v.receiverInventoryMicromol)}μmol。\n容器庫存改變=${num(v.receiverInventoryChangeMicromol)}μmol；邊界供排氣補償=${num(v.boundaryCompensationMicromol)}μmol。\n收支殘差（庫存改變−穿膜量−邊界補償）=${num(v.conservationResidualMicromol)}μmol。\n初始J=${num(r.initial.fluxMicromolM2Day)}μmol/(m²·日)；初始整膜速率=${num(r.initial.rateMicromolDay)}μmol/日；空容器時間常數τ=${num(r.timeConstantDays)}日。`;
  }
  function context() {
    const r=evaluated();
    return {key:key(),mode:d.mode,input:clone(r.input),result:clone(r),title:`${MODES[d.mode]}｜L ${num(d.input.thicknessMicrometre)}μm｜A ${num(d.input.areaM2)}m²｜${num(d.input.timeDays)}日`,calculation:quantities(r,d.mode),sources:sourceText(data.sources.map(s=>s.id)),version:data.version??data.schemaVersion??data.schema};
  }
  function question(c) {
    if(c.result.status!=='MODEL_OK') return {prompt:'這組資料尚未通過核對，怎麼使用？',answer:'unknown',choices:[['unknown','保留未知，先核對來源或重試'],['zero','把缺資料當作零傳輸'],['predict','照常預測食品保存期']],explanation:'來源或數值未通過時，不能用零或舊結果代替未知。'};
    if(c.result.initial.deltaPressureKpa===0) return {prompt:'兩側氧分壓相同，這個模型給什麼結果？',answer:'zero',choices:[['zero','淨通量為零；不表示膜不透氧'],['thick','只要膜厚夠小仍必定流入'],['safe','已證明食品不氧化']],explanation:'驅動差為零使J與淨穿膜量為零；材料仍有透過度，也未模擬食品或微觀雙向通過。'};
    if(c.result.initial.deltaPressureKpa<0) return {prompt:'內側氧分壓高於外側，負的淨通量代表什麼？',answer:'out',choices:[['out','淨氧氣由內側流出，負號保留方向'],['error','膜透過度變成負數'],['zero','應把所有負值改成零']],explanation:'本課以向內為正。內側分壓較高時，Δp、J與瞬時傳輸速率為負；t=0的穿膜累積為零，經過正時間才有負的累積量。常正透過度沒有改變。'};
    if(c.mode==='maintained') return {prompt:'分壓持續固定，穿過膜的氧全留在容器嗎？',answer:'boundary',choices:[['boundary','供排氣補償穿膜量；庫存保持不變'],['all','穿膜累積就是容器增加量'],['none','分壓不變代表沒有氧穿膜']],explanation:'固定V、T與內側分壓需邊界供排氣。正向穿膜時需同量排出；反向穿膜時需補入。這是維持條件的理想氣庫，不是食品耗氧反應。'};
    return {prompt:'空容器內氧逐漸累積，流入速度會一直相同嗎？',answer:'decline',choices:[['decline','分壓差縮小，淨流入速度逐漸下降'],['same','膜面積不變，所以速度必定不變'],['more','氧越多，淨流入速度必定越快']],explanation:'常P並不等於常J。剛性空容器中p隨氧量上升，Δp下降；穿膜積分等於容器氧量增加，初始速率×時間只是另一個固定分壓邊界的結果。'};
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
  const contextText = c => `${inputText(c.input,c.mode)}\n${c.calculation}\n來源版本：${c.version}\n${c.sources}`;
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
  function control(name,type='range') {const f=FIELDS[name];return `<label for="${prefix}-${name}"><span><span data-pt-label="${name}">${f.label}</span> <output data-pt-value="${name}"></output></span><input type="${type}" id="${prefix}-${name}" data-pt-field="${name}" min="${f.min}" max="${f.max}" step="${f.step}" disabled><span class="pt-caption">${f.unit}</span></label>`;}
  root.innerHTML = `<section class="package-transport-lab" aria-labelledby="${prefix}-title"><h2 id="${prefix}-title">氧能一直以相同速度透入嗎？</h2><p class="pt-caption">改膜厚與面積，再看邊界條件如何改變穿膜量。</p><nav class="pt-modes" aria-label="氧氣傳輸的邊界條件">${Object.entries(MODES).map(([id,label])=>`<button type="button" data-pt-mode="${id}">${label}</button>`).join('')}</nav><p role="status" data-pt-load-status>正在核對來源…</p><button type="button" data-pt-action="retry" hidden>重試載入</button><div class="pt-controls">${['thicknessMicrometre','areaM2','timeDays'].map(id=>control(id)).join('')}</div><p class="pt-caption" data-pt-condition></p><div class="pt-visuals"><figure><figcaption>目前的膜與兩側氣體</figcaption><div class="pt-vessel-scroll" tabindex="0" role="region" aria-label="膜與兩側氣體示意；窄螢幕可局部左右捲動" data-pt-vessel></div></figure><figure><figcaption>內側氧分壓隨時間改變</figcaption><div class="pt-curve-scroll" tabindex="0" role="region" aria-label="氧分壓曲線；窄螢幕可局部左右捲動" data-pt-curve></div></figure></div><div class="pt-readings" data-pt-readings></div><p class="pt-boundary" data-pt-boundary></p><div class="pt-actions"><button type="button" data-pt-action="record">保留這組觀察</button><span data-pt-count></span><button type="button" class="pt-primary" data-pt-action="save">保存到本課筆記</button></div><p role="status" data-pt-feedback></p><p role="status" data-pt-save-status></p><details data-pt-details="advanced"><summary>內側分壓與空容器容積</summary><div class="pt-advanced">${control('initialInsidePartialPressureKpa','number')}${control('receiverVolumeL','number')}</div><p data-pt-advanced-boundary></p><p class="pt-caption">外側氧分壓固定21kPa、溫度25°C。P=1000μmol·μm/(m²·日·kPa)是指定的假想材性，沒有使用某種真實薄膜的性能值。</p></details><details data-pt-details="judgement"><summary>先留下判讀，再核對理由</summary><section class="pt-question"><h3 data-pt-question></h3><div class="pt-choices" role="group" aria-label="留下我的判讀" data-pt-choices></div><div class="pt-actions"><button type="button" data-pt-action="check">核對我的判讀</button><button type="button" data-pt-action="reveal">先看參考解釋</button><button type="button" data-pt-action="new">新一輪判讀</button></div><p role="status" data-pt-answer></p></section></details><details data-pt-details="writing"><summary>寫下判讀、觀察與修訂</summary><p class="pt-caption" data-pt-writing-context></p>${[['prediction','原判讀與理由'],['observation','我觀察到的變化'],['revision','我的修訂']].map(([id,label])=>`<label for="${prefix}-${id}">${label}<textarea id="${prefix}-${id}" data-pt-${id} rows="3" maxlength="1200"></textarea></label>`).join('')}<p class="pt-preserved" data-pt-first></p></details><details data-pt-details="numbers"><summary>從材性到通量：完整算式與收支</summary><div data-pt-numbers></div></details><details data-pt-details="assumptions"><summary>模型假設與未計算的部分</summary><div data-pt-assumptions></div></details><details data-pt-details="sources"><summary>完整來源與定位</summary><div data-pt-sources></div></details><details data-pt-details="records"><summary>回看觀察與原判讀</summary><div data-pt-records></div></details><details data-pt-details="summary"><summary>待存內容與完整摘要</summary><label for="${prefix}-append">這次會附加的內容<textarea id="${prefix}-append" data-pt-append rows="5" readonly></textarea></label><label for="${prefix}-summary">完整摘要（含已保存文字版本）<textarea id="${prefix}-summary" data-pt-summary rows="6" readonly></textarea></label><button type="button" data-pt-action="copy">選取完整摘要</button><p class="pt-caption">同頁返回可接續。重新整理前請保存筆記；過長內容完整保留供複製。</p></details></section>`;
  function drawSummary() {if (disposed) return; $('append').value = appendPlan().text; $('summary').value = fullText(); action('save').disabled = !!slot.pending || !$('append').value || typeof onSaveSummary !== 'function'; $('save-status').textContent = slot.saveStatus;}
  const roundLimit = () => !current() && d.rounds.length >= 40;
  const roundLimitText = '已保留 40 輪；此新條件不能再建立判讀。可返回原條件修訂，或保存、複製既有內容。';
  function drawWriting() {const r = current(); $('writing-context').textContent = r ? `第 ${r.id} 輪｜${r.context.title}` : roundLimit() ? roundLimitText : '可先寫下判讀；切換條件、畫面或核對時會保留原稿。'; for (const name of ['prediction','observation','revision']) {$(name).value = r?.writing[name] || ''; $(name).disabled = !data || roundLimit(); $(name).readOnly = name === 'prediction' && !!r?.first;} $('first').textContent = r?.first ? `已固定首次選擇：${r.first.choiceLabel}\n原判讀：${r.first.writing.prediction || '未填'}\n${exposureText(r.first.exposure)}` : '';}
  function drawQuestion() {const r = current(), q = r?.question || (data ? question(context()) : null); $('question').textContent = q?.prompt || '等待來源核對。'; $('choices').innerHTML = q ? q.choices.map(([id, label]) => `<button type="button" data-pt-choice="${id}" aria-pressed="${r?.choice === id}"${!data || r?.first || roundLimit() ? ' disabled' : ''}>${esc(label)}</button>`).join('') : ''; action('check').disabled = !data || !r?.choice || !!r?.review; action('reveal').disabled = !data || !!r?.review || roundLimit(); action('new').disabled = !data || d.rounds.length >= 40; $('answer').textContent = r?.review ? `${r.review.assessed ? (r.review.correct ? '符合此模型的判讀界線。' : '請保留原判讀，再依觀察修訂。') : '已顯示參考，未記作答結果。'} ${q.explanation}` : '';}
  function drawRecords() {const rounds = d.rounds.filter(r => r.first || r.review || hasDraft(r)); $('count').textContent = `已保留 ${d.records.length} 組`; $('records').innerHTML = rounds.map(r => `<article><h3>第 ${r.id} 輪 · ${esc(r.context.title)}</h3><p class="pt-record-text">${esc(r.first ? firstText(r.first) : textWriting(r.writing))}</p>${r.review ? `<p class="pt-record-text">${esc(reviewText(r))}</p>` : ''}</article>`).join('') + d.records.map((r, i) => `<article><h3>觀察 ${i + 1}</h3><p class="pt-record-text">${esc(r.text)}</p></article>`).join(''); if (!rounds.length && !d.records.length) $('records').textContent = '尚未保留觀察或作答。';}
  function drawNumbers(r) {
    $('numbers').innerHTML=`<p class="pt-equation">Π=P/L；J=Π(p外−p內)；ṅ=A J；穿膜累積量=∫ṅdt。<br>Π是透過度，P是含厚度基準的滲透係數，J是每面積通量；三者不可直接混用。</p><p>本課採μmol莫耳量，沒有把不明標準狀態的cm³當作氧量。向內為正，向外為負；零淨通量不代表膜完全阻氧。</p><p class="pt-equation">${d.mode==='finite'?'空容器：n=pV/(RμT)；dn/dt=AJ。<br>τ=V/(AΠRμT)；p(t)=p外+(p初−p外)e^(−t/τ)。<br>Δn=V[p(t)−p初]/(RμT)=∫AJdt。':'固定分壓：p內=p初（維持值）；穿膜累積量=AΠ(p外−p內)t。<br>容器庫存改變=0；邊界供排氣補償=−穿膜累積量。'}</p><p>Rμ=8.31446261815324×10⁻⁶ kPa·L/(μmol·K)，T=298.15K。V以L、p以kPa、t以日代入；P內的μm與膜厚L相消。${d.mode==='finite'?'內部其他氣體量不變，內部總壓會隨氧量改變；圖中是氧分壓，不是氧氣百分比。':'固定V、T與分壓需要理想邊界氣庫供排氣；這不是封閉食品袋。'}</p><p class="pt-record-text">${esc(quantities(r,d.mode))}</p><h3>同一初始條件，兩種邊界</h3><p>固定分壓穿膜累積：${num(r.maintained?.signedTransferredMicromol)}μmol；空容器穿膜累積：${num(r.finite?.signedTransferredMicromol)}μmol。</p><p>真實材料可能隨溫濕度、膜厚、加工狀態或分壓而改變P。此處線性定係數是指定模型，不能直接用於未知膜片、WVTR或整包性能排名。</p>`;
  }
  function draw() {
    if(disposed)return;
    for(const mode of Object.keys(MODES)){const node=root.querySelector(`[data-pt-mode="${mode}"]`);node.setAttribute('aria-pressed',String(mode===d.mode));node.disabled=!data;}
    for(const [id,f] of Object.entries(FIELDS)){const node=root.querySelector(`[data-pt-field="${id}"]`),shown=num(d.input[id]);node.value=String(d.input[id]);node.disabled=!data || d.mode==='maintained'&&id==='receiverVolumeL';node.setAttribute('aria-valuetext',`${shown} ${f.unit}`);root.querySelector(`[data-pt-value="${id}"]`).textContent=shown;}
    root.querySelector('[data-pt-label="initialInsidePartialPressureKpa"]').textContent=d.mode==='finite'?'內側初始分壓':'內側維持分壓';
    $('advanced-boundary').textContent=d.mode==='finite'?'空容器保持剛性、定容、等溫，沒有食品或耗氧反應。氧透入或流出會改變內側分壓；其他氣體量保持不變。':'兩側分壓由理想氣庫維持；固定容積只決定庫存基數，不改穿膜速率與累積量，因此此模式停用容積控制。';
    action('record').disabled=!data;
    if(data){const r=evaluated();$('condition').textContent=`假想常P膜 · 25°C · 外側氧分壓21kPa · ${MODES[d.mode]}`;$('readings').innerHTML=packageReadings(r,d.mode);$('vessel').innerHTML=packageVessel(r,d.mode,prefix);$('curve').innerHTML=packageCurve(samplePackageTransport(d.input,data),d.mode,r,prefix);$('boundary').textContent=packageBoundary(r,d.mode);remember(d.seen.views,MODES[d.mode]);drawNumbers(r);}
    else for(const name of ['readings','vessel','curve','condition','boundary','numbers','sources','assumptions'])$(name).innerHTML='';
    drawQuestion();drawWriting();drawRecords();$('feedback').textContent=data&&roundLimit()?roundLimitText:feedback;drawSummary();
  }
  function updateField(node) {
    const name = node.dataset.ptField; if (!Object.hasOwn(FIELDS, name)) return;
    try {if (node.value.trim() === '') throw new Error('blank'); const value = Number(node.value), next = normalizePackageTransportInput({...d.input, [name]:value}); if (value === d.input[name]) return; leave('切換條件前保留原判讀'); d.input = {...next}; feedback = ''; draw();}
    catch {feedback = '此數值超出教學範圍；已保留上一組有效條件。'; draw();}
  }
  function onInput(event) {if (disposed || !data || !root.contains(event.target)) return; if (event.target.dataset.ptField && event.target.type === 'range') return updateField(event.target); const name = ['prediction','observation','revision'].find(n => event.target === $(n)); if (!name) return; const r = current() || ensureRound(); if (!r) return draw(); if (name === 'prediction' && r.first) return; r.writing[name] = String(event.target.value).slice(0, 1200); $('writing-context').textContent = `第 ${r.id} 輪｜${r.context.title}`; drawSummary(); drawRecords();}
  function onChange(event) {if (disposed || !data || !root.contains(event.target) || !event.target.dataset.ptField) return; updateField(event.target);}
  function eventRoom() {if (d.events.length < 120) return true; feedback = '已保留 120 項紀錄，不覆寫。請先保存或複製。'; return false;}
  function save() {const plan = appendPlan(); if (!plan.text || slot.pending || typeof onSaveSummary !== 'function') return; if (plan.text.length > 10000) {slot.saveStatus = '尚未保存：本次超過 10,000 字元。全文完整保留，可選取摘要複製。'; return drawSummary();} const token = {}; slot.pending = token; slot.saveStatus = '正在保存固定的本次內容；仍可繼續修訂。'; drawSummary(); const finish = (ok, error) => {if (slot.pending !== token) return; slot.pending = null; if (ok === true) {d.cursor = plan.next; d.savedVersions.push(...plan.versions); slot.saveStatus = '已附加本次內容；重複按下不會重複加入。';} else slot.saveStatus = error ? `尚未保存：${error?.message || '儲存失敗'}。待存內容完整保留。` : '尚未保存：請檢查筆記容量與儲存狀態。待存內容完整保留。'; slot.refresh?.();}; try {const result = onSaveSummary(plan.text); if (result && typeof result.then === 'function') Promise.resolve(result).then(finish, error => finish(false, error)); else finish(result);} catch (error) {finish(false, error);}}
  function onClick(event) {
    if (disposed || !root.contains(event.target)) return;
    const link = event.target.closest('[data-pt-source]'); if (link) {if (!data) return; const id = link.dataset.ptSource; if (data.sources.some(s => s.id === id) && !d.seen.sources.includes(id)) {if (!eventRoom()) {event.preventDefault?.(); return draw();} leave('開啟來源前保留原判讀'); remember(d.seen.sources, id); d.events.push({label:'開啟來源（不表示已讀）', text:sourceText([id])});} drawQuestion(); drawWriting(); drawSummary(); return;}
    const mode = event.target.closest('[data-pt-mode]'); if (mode) {const id = mode.dataset.ptMode; if (!Object.hasOwn(MODES, id) || d.mode === id) return; if (data) leave('切換觀察畫面前保留原判讀'); d.mode = id; return draw();}
    const choice = event.target.closest('[data-pt-choice]'); if (choice && data) {const r = current() || ensureRound(); if (!r) return draw(); if (!r.first && r.question.choices.some(c => c[0] === choice.dataset.ptChoice)) r.choice = choice.dataset.ptChoice; drawQuestion(); drawWriting(); drawSummary(); root.querySelector(`[data-pt-choice="${choice.dataset.ptChoice}"]`)?.focus(); return;}
    const button = event.target.closest('[data-pt-action]'); if (!button || button.disabled) return; const name = button.dataset.ptAction;
    if (name === 'retry') return load(); if (name === 'copy') {$('summary').focus(); $('summary').select(); return;} if (name === 'save') return save(); if (!data) return;
    if (name === 'check' || name === 'reveal') {const r = current() || ensureRound(); if (!r || r.review || name === 'check' && !r.choice) return; freezeFirst(r, name === 'check' ? '核對我的判讀' : '先看參考解釋'); r.review = clone({assessed:!!r.choice, correct:r.choice === r.question.answer, exposure:d.seen}); remember(d.seen.references, r.context.key); feedback = '首次選擇與原文已保留；可在修訂欄留下新判斷。';}
    else if (name === 'new') {if (d.rounds.length >= 40) {feedback = '已保留 40 輪，不覆寫原判讀。'; return draw();} leave('新一輪前保留原判讀'); ensureRound(true); feedback = '已開始新一輪；舊判讀與曾顯示資料仍保留。';}
    else if (name === 'record') {if (d.records.length >= 32) {feedback = '已保留 32 組，不覆寫舊觀察。'; return draw();} if (!eventRoom()) return draw(); leave('保留觀察前固定原判讀'); const c = context(), text = `${c.title}\n畫面：${MODES[d.mode]}\n${contextText(c)}\n${exposureText(d.seen)}`; if (!d.records.some(r => r.text === text)) {d.records.push({text}); d.events.push({label:'保留包材傳質觀察', text});} feedback = '已保留條件與數值。保存到本課筆記後，會納入匯出與還原。';}
    draw();
  }
  function onToggle(event) {if (disposed || !root.contains(event.target) || !event.target.dataset.ptDetails) return; const id = event.target.dataset.ptDetails, wasOpen = d.details.includes(id); d.details = d.details.filter(v => v !== id); if (event.target.open) d.details.push(id); if (data && event.target.open && !wasOpen && ['numbers','assumptions','sources'].includes(id)) {leave('展開依據前保留原判讀'); remember(d.seen.disclosures, DETAILS[id]);} drawQuestion(); drawWriting(); drawSummary();}
  async function load() {
    const token = ++epoch; abort?.abort(); abort = new AbortController(); data = null; action('retry').hidden = true; $('load-status').textContent = '正在核對來源…'; draw();
    try {const raw = await loadData(abort.signal); if (disposed || token !== epoch) return; const checked = validatePackageTransportDataset(raw), identity = JSON.stringify(checked); if (slot.datasetIdentity && slot.datasetIdentity !== identity) throw new Error('Dataset changed during an existing session'); slot.datasetIdentity = identity; data = checked;
      $('sources').innerHTML = sourceList(data.sources.map(s => s.id)) + '<h3>逐項依據</h3>' + data.claims.map(c => `<article><p>${esc(c.text)}</p><p class="pt-caption">${esc(words(c.locator))}</p>${c.limit ? `<p class="pt-caption">適用界線：${esc(words(c.limit))}</p>` : ''}${sourceList(c.sourceIds)}</article>`).join('');
      $('assumptions').innerHTML = `<ul>${[...data.assumptions,...data.limits].map(t=>`<li>${esc(words(t))}</li>`).join('')}</ul>`;
      for (const id of ['numbers','assumptions','sources']) if (d.details.includes(id)) {leave('載入時依據已展開；保留原判讀'); remember(d.seen.disclosures, DETAILS[id]);}
      $('load-status').textContent = ''; draw();
    } catch {if (disposed || token !== epoch) return; data = null; $('load-status').textContent = '來源未能讀取或通過核對。既有文字與觀察仍在，可重試載入。'; action('retry').hidden = false; draw();}
  }
  for (const node of root.querySelectorAll('[data-pt-details]')) node.open = d.details.includes(node.dataset.ptDetails);
  action('save').hidden = typeof onSaveSummary !== 'function';
  root.addEventListener('click', onClick); root.addEventListener('input', onInput); root.addEventListener('change', onChange); root.addEventListener('toggle', onToggle, true);
  const dispose = () => {if (disposed) return; disposed = true; epoch++; abort?.abort(); for (const [name, fn] of [['click',onClick],['input',onInput],['change',onChange]]) root.removeEventListener(name, fn); root.removeEventListener('toggle', onToggle, true); if (slot.dispose === dispose) {slot.dispose = null; slot.refresh = null;} if (mounts.get(root) === dispose) mounts.delete(root);}; slot.dispose = dispose; slot.refresh = drawSummary; mounts.set(root, dispose); draw(); load(); return dispose;
}
