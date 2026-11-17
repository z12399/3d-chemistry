import {escapeHTML as esc} from './storage.js';
import {EVAPORATION_BALANCE_ID, EVAPORATION_BALANCE_DEFAULTS, normalizeEvaporationInput, evaluateEvaporationBalance} from './evaporation-balance-model.js';
import {validateEvaporationBalanceDataset} from './evaporation-balance-source.js';
import {evaporationNumber as num, evaporationFlow, evaporationEquipment, evaporationReadings, evaporationBoundary, BALANCE_TEXT, EQUIPMENT_TEXT} from './evaporation-balance-diagrams.js';
export {EVAPORATION_BALANCE_ID} from './evaporation-balance-model.js';
const owners = new WeakMap(), mounts = new WeakMap(), clone = value => structuredClone(value);
const MODES = {flow:'追蹤蒸汽', equipment:'檢查傳熱面積'};
const DETAILS = {advanced:'進料與設備設定', writing:'判讀與修訂', numbers:'逐效收支', assumptions:'模型假設與界線', sources:'完整來源', records:'保留紀錄', summary:'完整摘要'};
const FIELDS = {
  feedFlowKgS:{label:'進料流率 F', unit:'kg/s', min:.5, max:10, step:.1},
  feedSolidFraction:{label:'原料固形物', unit:'質量 %', min:.05, max:.2, step:.01, percent:true},
  productSolidFraction:{label:'目標固形物', unit:'質量 %', min:.05, max:.6, step:.001, percent:true},
  feedTemperatureC:{label:'進料溫度', unit:'°C', min:20, max:80, step:1},
  intermediateTemperatureC:{label:'第一效沸點 T1', unit:'°C；雙效使用', min:50, max:120, step:10},
  uFirstKwM2K:{label:'第一效／單效 U', unit:'kW / (m²·K)', min:.2, max:5, step:.1},
  uSecondKwM2K:{label:'第二效 U', unit:'kW / (m²·K)', min:.2, max:5, step:.1},
  availableFirstAreaM2:{label:'第一效／單效可供面積', unit:'m²', min:0, max:100, step:1},
  availableSecondAreaM2:{label:'第二效可供面積', unit:'m²', min:0, max:100, step:1},
};
const fresh = () => ({input:{...EVAPORATION_BALANCE_DEFAULTS}, mode:'flow', kind:'double', details:[], rounds:[], selected:{}, records:[], events:[], savedVersions:[], seen:{views:[], disclosures:[], sources:[], references:[]}, cursor:{started:false, rounds:{}, events:0}});
const remember = (array, value) => {if (!array.includes(value)) array.push(value);};
const words = value => Array.isArray(value) ? value.map(words).join('；') : value && typeof value === 'object' ? Object.values(value).map(words).join('；') : String(value ?? '');
const textWriting = value => `原判讀與理由：${value.prediction || '未填'}\n觀察：${value.observation || '未填'}\n修訂：${value.revision || '未填'}`;
const exposureText = seen => `曾顯示畫面：${seen.views.join('、') || '無'}；曾展開依據：${seen.disclosures.join('、') || '無'}；曾核對解釋：${seen.references.join('、') || '無'}；開啟來源：${seen.sources.join('、') || '無'}。曾顯示或開啟不表示已讀；本課不宣稱盲測。`;
const inputText = p => `F=${p.feedFlowKgS}kg/s；xf=${p.feedSolidFraction}；xp=${p.productSolidFraction}；Tf=${p.feedTemperatureC}°C；T1=${p.intermediateTemperatureC}°C；Ts=120°C；T2=50°C；U1=${p.uFirstKwM2K}、U2=${p.uSecondKwM2K}kW/(m²·K)；可供A1=${p.availableFirstAreaM2}、A2=${p.availableSecondAreaM2}m²。`;
const preamble = '【单效與雙效蒸發收支】evaporation-balance-v1\n穩態順流假想非揮發溶質水溶液；水焓使用同一 NIST 表，溶質 cp=1.6kJ/(kg·K)、Tref=0.01°C。忽略沸點上升、混合熱、熱損失；固定熱力條件求所需面積，不求面積不足時的新產能。';
let serial = 0;
async function defaultLoad(signal) {const r = await fetch(new URL('../data/evaporation-balance.json', import.meta.url), {signal}); if (!r.ok) throw new Error('Evaporation balance sources unavailable'); return r.json();}
export function mountEvaporationBalanceLab(root, id = EVAPORATION_BALANCE_ID, {draftOwner, draftKey = id, onSaveSummary, loadData = defaultLoad} = {}) {
  if (!root?.querySelector || !root?.addEventListener) throw new TypeError('A DOM container is required');
  if (id !== EVAPORATION_BALANCE_ID) throw new RangeError('Unknown evaporation balance activity');
  mounts.get(root)?.(); let slot;
  if (draftOwner && typeof draftOwner === 'object') {if (!owners.has(draftOwner)) owners.set(draftOwner, new Map()); const map = owners.get(draftOwner), key = String(draftKey); if (!map.has(key)) map.set(key, {data:fresh()}); slot = map.get(key); slot.dispose?.();} else slot = {data:fresh()};
  const d = slot.data, prefix = `evaporation-balance-${++serial}`, $ = name => root.querySelector(`[data-eb-${name}]`), action = name => root.querySelector(`[data-eb-action="${name}"]`);
  let data = null, disposed = false, epoch = 0, abort = null, feedback = ''; slot.saveStatus ??= '';
  const key = () => JSON.stringify({kind:d.kind, mode:d.mode, ...d.input});
  const current = () => d.rounds.find(r => r.id === d.selected[key()]) || null;
  const sourceText = ids => data.sources.filter(s => ids.includes(s.id)).map(s => `${s.title}\n${s.url}\n定位：${words(s.locator)}`).join('\n');
  function sourceList(ids) {return `<ul class="eb-source-list">${data.sources.filter(s => ids.includes(s.id)).map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-eb-source="${esc(s.id)}">${esc(s.title)} ↗</a><p class="eb-caption">${esc(words(s.locator))}</p></li>`).join('')}</ul>`;}
  const evaluated = () => evaluateEvaporationBalance(d.input, data);
  function quantities(r, kind) {
    const c=r[kind], v=c.raw || {}, common=r.common;
    return `${kind==='double'?'雙效':'單效'}｜${BALANCE_TEXT[c.balanceStatus]||c.balanceStatus}；${EQUIPMENT_TEXT[c.equipmentStatus]||c.equipmentStatus}\nP=${num(common?.productFlowKgS)}、E=${num(common?.totalEvaporationKgS)}、S=${num(c.summary.steamFlowKgS)}kg/s；E/S=${num(c.summary.steamEconomy)}。\n原始代數：S=${num(v.steamFlowKgS)}、V1=${num(v.vapor1FlowKgS)}、V2=${num(v.vapor2FlowKgS)}、L1=${num(v.intermediateLiquidFlowKgS)}kg/s；x1=${num(v.intermediateSolidFraction)}；外供Q=${num(v.externalDutyKw)}、再用Q=${num(v.reusedDutyKw)}kW。\n${c.effects.map(e=>`效${e.index}：T=${num(e.temperatureC)}°C，p=${num(e.pressureMPa*1000)}kPa；Q=${num(e.heatDutyKw)}kW；質量/溶質殘差=${num(e.massResidualKgS,10)}/${num(e.soluteResidualKgS,10)}kg/s，焓殘差=${num(e.energyResidualKw,8)}kW。`).join('\n')}\n${c.equipment.map(e=>`效${e.index}：ΔT=${num(e.deltaTemperatureK)}K；所需A=${num(e.requiredAreaM2)}m²；${EQUIPMENT_TEXT[e.status]||e.status}。`).join('\n')}${c.flash?`\n末效汽化的等效分解：液流降溫=${num(c.flash.sensibleEquivalentVaporKgS)}，凝結供熱=${num(c.flash.heatingEquivalentVaporKgS)}kg/s；非額外物流。`:''}`;
  }
  function context() {
    const r=evaluated(), i=r.input;
    return {key:key(), kind:d.kind, mode:d.mode, input:clone(i), result:clone(r), title:`${d.kind==='double'?'雙效':'單效'}｜${MODES[d.mode]}｜${num(i.feedSolidFraction*100)}→${num(i.productSolidFraction*100)}%｜進料${num(i.feedTemperatureC)}°C`, calculation:quantities(r,d.kind), sources:sourceText(data.sources.map(s=>s.id)), version:data.version??data.schemaVersion};
  }
  function question(c) {
    const v=c.result[c.kind];
    if(v.balanceStatus!=='BALANCE_OK') return {prompt:'目前收支狀態如何使用？',answer:'blocked',choices:[['blocked','保留原因與原始代數，暫不算通常經濟性'],['clamp','把負值改成零，繼續算節能'],['half','双效仍可固定視為省一半']],explanation:'沒有正蒸發與正供熱的有效解，或資料／殘差未通過時，不把代數診斷當作可操作流量；E/S 也不能用未定義的 S 計算。'};
    if(v.equipmentStatus==='NONPOSITIVE_DRIVING_TEMPERATURE') return {prompt:'有一效的溫差為零，收支成立就能運行嗎？',answer:'no',choices:[['no','有限面積無法傳入這筆正熱負荷'],['yes','收支成立即代表設備可供'],['zero','所需面積應設為零']],explanation:'正 Q 需要正的 U A ΔT。ΔT=0 時沒有有限正面積能供應此熱量；形式上的收支不代表可運行的設備。'};
    if(c.mode==='equipment') return {prompt:'固定這組收支，只將 U 減半會怎樣？',answer:'area',choices:[['area','熱負荷與 S 不變；所需面積加倍'],['steam','外供蒸汽 S 加倍，面積不變'],['capacity','自動得到一半產能']],explanation:'本課先由固定條件解 Q 和 S，再用 A=Q/(UΔT) 求需求。U 減半只使需求面積加倍；面積不足的實際產能需要另一個求解模式。'};
    if(c.kind==='single')return {prompt:'單效的外供熱負荷應包含哪些？',answer:'both',choices:[['both','汽化能量，加上進料到沸點的液體焓差'],['latent','只要汽化熱，進料冷熱不影響'],['half','總蒸發量固定除以二即可']],explanation:'單效 Qs=Eλ2+H(F,T2)−H(F,Tf)。冷進料需要升溫；高於沸點的熱進料可提供顯熱。外供 S=Qs/λs，仍需通過正供熱與設備檢查。'};
    return {prompt:'雙效第二效的汽化能量來自哪裡？',answer:'both',choices:[['both','前效蒸氣凝結，加上液流降溫'],['steam','只計前效蒸氣的全部比焓'],['new','再加入一筆同量外供新鮮蒸汽']],explanation:'V1 在第二效加熱側由蒸氣變成同溫凝結水，只釋出相差焓；L1 從 T1 降至 T2 的液流顯熱也在第二效收支內。V1 是內部再用，外供只有 S。'};
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
  function control(name, type = 'range') {const f = FIELDS[name], scale=f.percent?100:1; return `<label for="${prefix}-${name}"><span>${f.label} <output data-eb-value="${name}"></output></span><input type="${type}" id="${prefix}-${name}" data-eb-field="${name}" min="${f.min*scale}" max="${f.max*scale}" step="${f.step*scale}" disabled><span class="eb-caption">${f.unit}</span></label>`;}
  root.innerHTML = `<section class="evaporation-balance-lab" aria-labelledby="${prefix}-title"><h2 id="${prefix}-title">同樣蒸掉水，蒸汽去哪裡？</h2><p class="eb-caption">固定進料與產品終點，追蹤供熱，再檢查設備。</p><nav class="eb-modes" aria-label="蒸發觀察畫面">${Object.entries(MODES).map(([id,label])=>`<button type="button" data-eb-mode="${id}">${label}</button>`).join('')}</nav><p role="status" data-eb-load-status>正在核對來源…</p><button type="button" data-eb-action="retry" hidden>重試載入</button><div class="eb-controls"><div><span>配置</span><div class="eb-kind" role="group" aria-label="蒸發效數"><button type="button" data-eb-kind="single">單效</button><button type="button" data-eb-kind="double">雙效</button></div></div>${control('feedTemperatureC')}${control('productSolidFraction')}</div><p class="eb-caption" data-eb-condition></p><div class="eb-readings" data-eb-readings></div><section data-eb-panel="flow"><div class="eb-flow-scroll" tabindex="0" role="region" aria-label="蒸發流程圖；窄螢幕可局部左右捲動" data-eb-flow></div><p class="eb-caption">橙線為蒸氣，藍線為液流。箭頭表示物流方向，線寬不表示流量。</p></section><section data-eb-panel="equipment" hidden><div class="eb-equipment-controls">${control('uFirstKwM2K')}${control('uSecondKwM2K')}</div><div class="eb-equipment" data-eb-equipment></div></section><p class="eb-boundary" data-eb-boundary></p><section class="eb-question"><h3 data-eb-question></h3><div class="eb-choices" role="group" aria-label="留下我的判讀" data-eb-choices></div><div class="eb-actions"><button type="button" data-eb-action="check">核對我的判讀</button><button type="button" data-eb-action="reveal">先看參考解釋</button><button type="button" data-eb-action="new">新一輪判讀</button></div><p role="status" data-eb-answer></p></section><div class="eb-actions"><button type="button" data-eb-action="record">保留這組觀察</button><span data-eb-count></span><button type="button" class="eb-primary" data-eb-action="save">保存到本課筆記</button></div><p role="status" data-eb-feedback></p><p role="status" data-eb-save-status></p><details data-eb-details="advanced"><summary>進料、第一效沸點與可供面積</summary><p>兩種配置共用進料與產品終點。這些是假想教學範圍；Ts 固定 120°C、末效固定 50°C。</p><div class="eb-advanced">${['feedFlowKgS','feedSolidFraction','intermediateTemperatureC','availableFirstAreaM2','availableSecondAreaM2'].map(id=>control(id,id==='intermediateTemperatureC'?'range':'number')).join('')}</div><p>濃度控制使用質量百分比；收支內換成質量分率 x。T1 與第二效面積只用於雙效；第一效 U 與面積也用來比較單效。</p></details><details data-eb-details="writing"><summary>寫下判讀、觀察與修訂</summary><p class="eb-caption" data-eb-writing-context></p>${[['prediction','原判讀與理由'],['observation','我觀察到的變化'],['revision','我的修訂']].map(([id,label])=>`<label for="${prefix}-${id}">${label}<textarea id="${prefix}-${id}" data-eb-${id} rows="3" maxlength="1200"></textarea></label>`).join('')}<p class="eb-preserved" data-eb-first></p></details><details data-eb-details="numbers"><summary>逐效收支、完整算式與殘差</summary><div data-eb-numbers></div></details><details data-eb-details="assumptions"><summary>物性、模型假設與適用界線</summary><div data-eb-assumptions></div></details><details data-eb-details="sources"><summary>完整來源與定位</summary><div data-eb-sources></div></details><details data-eb-details="records"><summary>回看觀察與原判讀</summary><div data-eb-records></div></details><details data-eb-details="summary"><summary>待存內容與完整摘要</summary><label for="${prefix}-append">這次會附加的內容<textarea id="${prefix}-append" data-eb-append rows="5" readonly></textarea></label><label for="${prefix}-summary">完整摘要（含已保存文字版本）<textarea id="${prefix}-summary" data-eb-summary rows="6" readonly></textarea></label><button type="button" data-eb-action="copy">選取完整摘要</button><p class="eb-caption">同頁返回可接續。重新整理前請保存筆記；過長內容會完整保留供複製。</p></details></section>`;
  function drawSummary() {if (disposed) return; $('append').value = appendPlan().text; $('summary').value = fullText(); action('save').disabled = !!slot.pending || !$('append').value || typeof onSaveSummary !== 'function'; $('save-status').textContent = slot.saveStatus;}
  const roundLimit = () => !current() && d.rounds.length >= 40;
  const roundLimitText = '已保留 40 輪；此新條件不能再建立判讀。可返回原條件修訂，或保存、複製既有內容。';
  function drawWriting() {const r = current(); $('writing-context').textContent = r ? `第 ${r.id} 輪｜${r.context.title}` : roundLimit() ? roundLimitText : '可先寫下判讀；切換條件、畫面或核對時會保留原稿。'; for (const name of ['prediction','observation','revision']) {$(name).value = r?.writing[name] || ''; $(name).disabled = !data || roundLimit(); $(name).readOnly = name === 'prediction' && !!r?.first;} $('first').textContent = r?.first ? `已固定首次選擇：${r.first.choiceLabel}\n原判讀：${r.first.writing.prediction || '未填'}\n${exposureText(r.first.exposure)}` : '';}
  function drawQuestion() {const r = current(), q = r?.question || (data ? question(context()) : null); $('question').textContent = q?.prompt || '等待來源核對。'; $('choices').innerHTML = q ? q.choices.map(([id, label]) => `<button type="button" data-eb-choice="${id}" aria-pressed="${r?.choice === id}"${!data || r?.first || roundLimit() ? ' disabled' : ''}>${esc(label)}</button>`).join('') : ''; action('check').disabled = !data || !r?.choice || !!r?.review; action('reveal').disabled = !data || !!r?.review || roundLimit(); action('new').disabled = !data || d.rounds.length >= 40; $('answer').textContent = r?.review ? `${r.review.assessed ? (r.review.correct ? '符合此模型的判讀界線。' : '請保留原判讀，再依觀察修訂。') : '已顯示參考，未記作答結果。'} ${q.explanation}` : '';}
  function drawRecords() {const rounds = d.rounds.filter(r => r.first || r.review || hasDraft(r)); $('count').textContent = `已保留 ${d.records.length} 組`; $('records').innerHTML = rounds.map(r => `<article><h3>第 ${r.id} 輪 · ${esc(r.context.title)}</h3><p class="eb-record-text">${esc(r.first ? firstText(r.first) : textWriting(r.writing))}</p>${r.review ? `<p class="eb-record-text">${esc(reviewText(r))}</p>` : ''}</article>`).join('') + d.records.map((r, i) => `<article><h3>觀察 ${i + 1}</h3><p class="eb-record-text">${esc(r.text)}</p></article>`).join(''); if (!rounds.length && !d.records.length) $('records').textContent = '尚未保留觀察或作答。';}
  function drawNumbers(r) {
    const c=r[d.kind];
    const stream = v => v ? `${v.id}｜${num(v.massFlowKgS)} kg/s；固形物 ${num(v.solidFraction*100)}%；${num(v.temperatureC)}°C；比焓 ${num(v.specificEnthalpyKjKg)} kJ/kg；焓流率 ${num(v.enthalpyFlowKw)} kW` : '—';
    $('numbers').innerHTML = `<p class="eb-equation">${d.kind==='single'?'P=Fxf/xp；E=F−P<br>Qs+Fhf=Ph2+Ehv,2<br>Qs=Eλ2+H(F,T2)−H(F,Tf)<br>Qs=S(hv,s−hw,s)；As=Qs/[U1(Ts−T2)]<br>E/S 為蒸汽經濟性':'P=Fxf/xp；E=F−P；L1=F−V1；V2=E−V1<br>Q1+Fhf=L1h1+V1hv,1；Q2+L1h1=Ph2+V2hv,2<br>Q1=S(hv,s−hw,s)；Q2=V1(hv,1−hw,1)<br>Aᵢ=Qᵢ/(UᵢΔTᵢ)；E/S 為蒸汽經濟性'}</p><p>流率 kg/s；比焓 kJ/kg；焓流率與熱負荷 kW；面積 m²。${d.kind==='single'?'進料焓在其原溫度取值，產品及蒸發水在50°C離開；外供蒸汽的凝結水在120°C離開。':'第二效的 V1 凝結水離開於 T1，不能改用 T2。Q1+Q2 不是外供鍋爐熱。'}</p><p class="eb-record-text">${esc(quantities(r,d.kind))}</p>${c.effects.map(e=>`<details><summary>第 ${e.index} 效完整物流帳</summary>${[['inlet','進料'],['liquid','液相出口'],['vapor','新蒸出水'],['heatingVapor','加熱側蒸氣'],['heatingCondensate','加熱側凝結水']].map(([k,label])=>`<p>${label}：${esc(stream(e[k]))}</p>`).join('')}</details>`).join('')}<details><summary>整體外界收支</summary><pre>${esc(JSON.stringify(c.overall,null,2))}</pre></details><p>質量數值容差依流量尺度設定；殘差只是計算閉合檢查，不表示真實食品模型準確度。</p>`;
  }
  function draw() {
    if(disposed)return;
    for(const mode of Object.keys(MODES)){root.querySelector(`[data-eb-panel="${mode}"]`).hidden=mode!==d.mode;root.querySelector(`[data-eb-mode="${mode}"]`).setAttribute('aria-pressed',String(mode===d.mode));}
    for(const kind of ['single','double']){const button=root.querySelector(`[data-eb-kind="${kind}"]`);button.setAttribute('aria-pressed',String(kind===d.kind));button.disabled=!data;}
    for(const [id,f] of Object.entries(FIELDS)){const node=root.querySelector(`[data-eb-field="${id}"]`),shown=num(f.percent?d.input[id]*100:d.input[id]);node.value=String(f.percent?d.input[id]*100:d.input[id]);node.disabled=!data || d.kind==='single'&&['intermediateTemperatureC','uSecondKwM2K','availableSecondAreaM2'].includes(id);node.setAttribute('aria-valuetext',`${shown} ${f.unit}`);root.querySelector(`[data-eb-value="${id}"]`).textContent=shown;}
    action('record').disabled=!data;
    if(data){const r=evaluated();$('condition').textContent=`F ${num(d.input.feedFlowKgS)} kg/s · 原料 ${num(d.input.feedSolidFraction*100)}% · 末效 50°C · 理想溶液收支`;$('readings').innerHTML=evaporationReadings(r,d.kind);$('flow').innerHTML=evaporationFlow(r,d.kind);$('equipment').innerHTML=evaporationEquipment(r,d.kind);$('boundary').textContent=evaporationBoundary(r,d.kind);remember(d.seen.views,`${d.kind==='double'?'雙效':'單效'}・${MODES[d.mode]}`);drawNumbers(r);}
    else for(const name of ['readings','flow','equipment','condition','boundary','numbers','sources','assumptions'])$(name).innerHTML='';
    drawQuestion();drawWriting();drawRecords();$('feedback').textContent=data&&roundLimit()?roundLimitText:feedback;drawSummary();
  }
  function updateField(node) {
    const name = node.dataset.ebField; if (!Object.hasOwn(FIELDS, name)) return;
    try {if (node.value.trim() === '') throw new Error('blank'); const value = Number(node.value)/(FIELDS[name].percent?100:1), next = normalizeEvaporationInput({...d.input, [name]:value}); if (value === d.input[name]) return; leave('切換條件前保留原判讀'); d.input = {...next}; feedback = ''; draw();}
    catch {feedback = '此數值超出教學範圍；已保留上一組有效條件。'; draw();}
  }
  function onInput(event) {if (disposed || !data || !root.contains(event.target)) return; if (event.target.dataset.ebField && event.target.type === 'range') return updateField(event.target); const name = ['prediction','observation','revision'].find(n => event.target === $(n)); if (!name) return; const r = current() || ensureRound(); if (!r) return draw(); if (name === 'prediction' && r.first) return; r.writing[name] = String(event.target.value).slice(0, 1200); $('writing-context').textContent = `第 ${r.id} 輪｜${r.context.title}`; drawSummary(); drawRecords();}
  function onChange(event) {if (disposed || !data || !root.contains(event.target) || !event.target.dataset.ebField) return; updateField(event.target);}
  function eventRoom() {if (d.events.length < 120) return true; feedback = '已保留 120 項紀錄，不覆寫。請先保存或複製。'; return false;}
  function save() {const plan = appendPlan(); if (!plan.text || slot.pending || typeof onSaveSummary !== 'function') return; if (plan.text.length > 10000) {slot.saveStatus = '尚未保存：本次超過 10,000 字元。全文完整保留，可選取摘要複製。'; return drawSummary();} const token = {}; slot.pending = token; slot.saveStatus = '正在保存固定的本次內容；仍可繼續修訂。'; drawSummary(); const finish = (ok, error) => {if (slot.pending !== token) return; slot.pending = null; if (ok === true) {d.cursor = plan.next; d.savedVersions.push(...plan.versions); slot.saveStatus = '已附加本次內容；重複按下不會重複加入。';} else slot.saveStatus = error ? `尚未保存：${error?.message || '儲存失敗'}。待存內容完整保留。` : '尚未保存：請檢查筆記容量與儲存狀態。待存內容完整保留。'; slot.refresh?.();}; try {const result = onSaveSummary(plan.text); if (result && typeof result.then === 'function') Promise.resolve(result).then(finish, error => finish(false, error)); else finish(result);} catch (error) {finish(false, error);}}
  function onClick(event) {
    if (disposed || !root.contains(event.target)) return;
    const link = event.target.closest('[data-eb-source]'); if (link) {if (!data) return; const id = link.dataset.ebSource; if (data.sources.some(s => s.id === id) && !d.seen.sources.includes(id)) {if (!eventRoom()) {event.preventDefault?.(); return draw();} leave('開啟來源前保留原判讀'); remember(d.seen.sources, id); d.events.push({label:'開啟來源（不表示已讀）', text:sourceText([id])});} drawQuestion(); drawWriting(); drawSummary(); return;}
    const kind = event.target.closest('[data-eb-kind]'); if(kind && data && ['single','double'].includes(kind.dataset.ebKind) && d.kind!==kind.dataset.ebKind){leave('切換效數前保留原判讀'); d.kind=kind.dataset.ebKind; return draw();}
    const mode = event.target.closest('[data-eb-mode]'); if (mode) {const id = mode.dataset.ebMode; if (!Object.hasOwn(MODES, id) || d.mode === id) return; if (data) leave('切換觀察畫面前保留原判讀'); d.mode = id; return draw();}
    const choice = event.target.closest('[data-eb-choice]'); if (choice && data) {const r = current() || ensureRound(); if (!r) return draw(); if (!r.first && r.question.choices.some(c => c[0] === choice.dataset.ebChoice)) r.choice = choice.dataset.ebChoice; drawQuestion(); drawWriting(); drawSummary(); root.querySelector(`[data-eb-choice="${choice.dataset.ebChoice}"]`)?.focus(); return;}
    const button = event.target.closest('[data-eb-action]'); if (!button || button.disabled) return; const name = button.dataset.ebAction;
    if (name === 'retry') return load(); if (name === 'copy') {$('summary').focus(); $('summary').select(); return;} if (name === 'save') return save(); if (!data) return;
    if (name === 'check' || name === 'reveal') {const r = current() || ensureRound(); if (!r || r.review || name === 'check' && !r.choice) return; freezeFirst(r, name === 'check' ? '核對我的判讀' : '先看參考解釋'); r.review = clone({assessed:!!r.choice, correct:r.choice === r.question.answer, exposure:d.seen}); remember(d.seen.references, r.context.key); feedback = '首次選擇與原文已保留；可在修訂欄留下新判斷。';}
    else if (name === 'new') {if (d.rounds.length >= 40) {feedback = '已保留 40 輪，不覆寫原判讀。'; return draw();} leave('新一輪前保留原判讀'); ensureRound(true); feedback = '已開始新一輪；舊判讀與曾顯示資料仍保留。';}
    else if (name === 'record') {if (d.records.length >= 32) {feedback = '已保留 32 組，不覆寫舊觀察。'; return draw();} if (!eventRoom()) return draw(); leave('保留觀察前固定原判讀'); const c = context(), text = `${c.title}\n畫面：${MODES[d.mode]}\n${contextText(c)}\n${exposureText(d.seen)}`; if (!d.records.some(r => r.text === text)) {d.records.push({text}); d.events.push({label:'保留蒸發觀察', text});} feedback = '已保留條件與數值。保存到本課筆記後，會納入匯出與還原。';}
    draw();
  }
  function onToggle(event) {if (disposed || !root.contains(event.target) || !event.target.dataset.ebDetails) return; const id = event.target.dataset.ebDetails, wasOpen = d.details.includes(id); d.details = d.details.filter(v => v !== id); if (event.target.open) d.details.push(id); if (data && event.target.open && !wasOpen && ['numbers','assumptions','sources'].includes(id)) {leave('展開依據前保留原判讀'); remember(d.seen.disclosures, DETAILS[id]);} drawQuestion(); drawWriting(); drawSummary();}
  async function load() {
    const token = ++epoch; abort?.abort(); abort = new AbortController(); data = null; action('retry').hidden = true; $('load-status').textContent = '正在核對來源…'; draw();
    try {const raw = await loadData(abort.signal); if (disposed || token !== epoch) return; const checked = validateEvaporationBalanceDataset(raw), identity = JSON.stringify(checked); if (slot.datasetIdentity && slot.datasetIdentity !== identity) throw new Error('Dataset changed during an existing session'); slot.datasetIdentity = identity; data = checked;
      $('sources').innerHTML = sourceList(data.sources.map(s => s.id)) + '<h3>逐項依據</h3>' + data.claims.map(c => `<article><p>${esc(c.text)}</p><p class="eb-caption">${esc(words(c.locator))}</p>${sourceList(c.sourceIds)}</article>`).join('');
      $('assumptions').innerHTML = `<h3>水的飽和物性</h3><p>NISTIR 5078 Table 1 的選定表值。λ 由同列 h汽−h液計算；進料僅在線性內插範圍內取液焓，各效溫度使用原表列。壓力與溫度相連，不能另行指定。</p><div class="eb-table-scroll" tabindex="0" role="region" aria-label="水的物性表；窄螢幕可局部左右捲動"><table><thead><tr><th scope="col">°C</th><th scope="col">kPa</th><th scope="col">h液 kJ/kg</th><th scope="col">h汽 kJ/kg</th><th scope="col">λ kJ/kg</th></tr></thead><tbody>${data.properties.rows.map(p=>`<tr data-eb-water-row="${p.temperatureC}"><td>${num(p.temperatureC)}</td><td>${num(p.pressureMPa*1000,4)}</td><td>${num(p.hLiquidKjKg,3)}</td><td>${num(p.hVaporKjKg,3)}</td><td>${num(p.hVaporKjKg-p.hLiquidKjKg,3)}</td></tr>`).join('')}</tbody></table></div><h3>模型假設與適用界線</h3><ul>${[...data.assumptions, ...data.limits].map(t => `<li>${esc(words(t))}</li>`).join('')}</ul>`;
      for (const id of ['numbers','assumptions','sources']) if (d.details.includes(id)) {leave('載入時依據已展開；保留原判讀'); remember(d.seen.disclosures, DETAILS[id]);}
      $('load-status').textContent = ''; draw();
    } catch {if (disposed || token !== epoch) return; data = null; $('load-status').textContent = '來源未能讀取或通過核對。既有文字與觀察仍在，可重試載入。'; action('retry').hidden = false; draw();}
  }
  for (const node of root.querySelectorAll('[data-eb-details]')) node.open = d.details.includes(node.dataset.ebDetails);
  action('save').hidden = typeof onSaveSummary !== 'function';
  root.addEventListener('click', onClick); root.addEventListener('input', onInput); root.addEventListener('change', onChange); root.addEventListener('toggle', onToggle, true);
  const dispose = () => {if (disposed) return; disposed = true; epoch++; abort?.abort(); for (const [name, fn] of [['click',onClick],['input',onInput],['change',onChange]]) root.removeEventListener(name, fn); root.removeEventListener('toggle', onToggle, true); if (slot.dispose === dispose) {slot.dispose = null; slot.refresh = null;} if (mounts.get(root) === dispose) mounts.delete(root);}; slot.dispose = dispose; slot.refresh = drawSummary; mounts.set(root, dispose); draw(); load(); return dispose;
}
