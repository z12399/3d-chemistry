import {escapeHTML as esc} from './storage.js';
import {RHEOLOGY_LAB_ID,RHEOLOGY_SYNTHETIC,RHEOLOGY_SOURCES,RHEOLOGY_CLAIMS,evaluateFlow,commonShearRange,sampleFlow,validateRheologyData,checkViscosityAnswer} from './rheology-model.js';

const drafts=new WeakMap();
const mounted=new WeakMap(),activeOwners=new WeakMap();
let sequence=0;
const fmt=value=>Number(value).toLocaleString('en-US',{maximumSignificantDigits:5,useGrouping:false});
const fresh=()=>({step:0,rates:{teaching:100,published:100},prediction:'',revision:'',observations:[],claims:{},calculations:{teaching:{rowId:'teaching-b',answer:'',result:null},published:{rowId:'',answer:'',result:null}},saved:new Set(),first:null,pastExposure:'unknown',exposure:{model:false,published:false,parameters:false,claims:[]}});
const initialConditions=()=>({temperatureC:20,shearRateS:100,stressPa:20,viscosityPaS:0.2,identity:'指定教學共同點，非食品實測'});
const exposureCopy=value=>({model:value?.model??null,published:value?.published??null,parameters:value?.parameters??null,claims:[...(value?.claims??[])]});
const identity=mode=>mode==='published'?'研究參數重建，非原始量測點':'20°C 教學參數，非特定食品';
function safeLink(url,label){
  try {const value=new URL(url);if(value.protocol==='https:'&&!value.username&&!value.password)return `<a href="${esc(value.href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;}catch{}
  return esc(label);
}
function chart(rows,rate,metric,mode,prefix){
  const domain=commonShearRange(rows),points=rows.map(row=>sampleFlow(row,81,domain));
  const width=480,height=276,left=64,right=22,top=25,bottom=52,plotWidth=width-left-right,plotHeight=height-top-bottom;
  const all=points.flat(),isViscosity=metric==='viscosity',values=all.map(point=>point[metric]);
  const low=isViscosity?10**Math.floor(Math.log10(Math.min(...values))):0;
  const high=isViscosity?10**Math.ceil(Math.log10(Math.max(...values))):Math.ceil(Math.max(...values)/10)*10;
  const x=value=>left+Math.log(value/domain[0])/Math.log(domain[1]/domain[0])*plotWidth;
  const y=value=>top+plotHeight-(isViscosity?Math.log(value/low)/Math.log(high/low):value/high)*plotHeight;
  const xTicks=[...new Set([domain[0],...[.1,1,10,100,1000].filter(v=>v>domain[0]&&v<domain[1]),domain[1]])];
  const yTicks=isViscosity?Array.from({length:Math.round(Math.log10(high/low))+1},(_,i)=>low*10**i):[0,high/2,high];
  const label=isViscosity?'表觀黏度 ηapp / Pa·s':'剪應力 τ / Pa';
  const title=`${identity(mode)}：${label}`;
  const readings=rows.map(row=>{const p=evaluateFlow(row,rate);return `${row.label} ${fmt(p[metric])} ${isViscosity?'Pa·s':'Pa'}`;}).join('；');
  return `<figure class="rh-chart"><figcaption>${esc(label)}${isViscosity?'<small>對數縱軸；每大格為 10 倍</small>':'<small>線性縱軸，從零開始</small>'}</figcaption><svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${prefix}-${metric}-title ${prefix}-${metric}-desc"><title id="${prefix}-${metric}-title">${esc(title)}</title><desc id="${prefix}-${metric}-desc">剪切率 ${fmt(rate)} s⁻¹；${esc(readings)}。橫軸採對數刻度。數字也列於下方表格。</desc>${yTicks.map(t=>`<line class="rh-grid" x1="${left}" x2="${width-right}" y1="${y(t)}" y2="${y(t)}"/><text class="rh-tick" x="${left-9}" y="${y(t)+4}" text-anchor="end">${fmt(t)}</text>`).join('')}${xTicks.map(t=>`<line class="rh-grid" x1="${x(t)}" x2="${x(t)}" y1="${top}" y2="${top+plotHeight}"/><text class="rh-tick" x="${x(t)}" y="${top+plotHeight+20}" text-anchor="middle">${fmt(t)}</text>`).join('')}<line class="rh-current-line" x1="${x(rate)}" x2="${x(rate)}" y1="${top}" y2="${top+plotHeight}"/>${points.map((series,i)=>`<path class="rh-curve rh-series-${i%2}" d="${series.map((p,j)=>`${j?'L':'M'}${x(p.shearRate).toFixed(2)},${y(p[metric]).toFixed(2)}`).join(' ')}"/>`).join('')}${rows.map((row,i)=>{const value=evaluateFlow(row,rate);return `<circle class="rh-point rh-series-${i%2}" cx="${x(rate)}" cy="${y(value[metric])}" r="${i===0?6:3.5}"/>`;}).join('')}<text class="rh-axis-label" x="${left+plotWidth/2}" y="${height-7}" text-anchor="middle">剪切率 γ̇ / s⁻¹（對數橫軸）</text></svg><p class="rh-chart-origin">${esc(identity(mode))}</p></figure>`;
}

/** Immediate disposer. Published data may load later; it never owns the route. */
export function mountRheologyLab(root,{draftOwner,onSaveSummary,fetcher=globalThis.fetch}={}){
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  const owned=draftOwner&&typeof draftOwner==='object';
  mounted.get(root)?.dispose();
  if(owned)activeOwners.get(draftOwner)?.dispose();
  if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,fresh());
  const draft=owned?drafts.get(draftOwner):fresh(),prefix=`rheology-${++sequence}`;
  if(!Object.hasOwn(draft,'first')){
    draft.first={version:1,text:draft.prediction,trigger:'legacy',at:null,conditions:initialConditions(),pastExposure:'unknown',exposure:{model:null,published:null,parameters:null,claims:[]},chronology:'未記錄，既有文字不回補為操作前初答'};
    draft.pastExposure='unknown';draft.exposure={model:null,published:null,parameters:null,claims:[]};
  }
  const $=selector=>root.querySelector(selector),field=name=>$(`[data-rh-${name}]`);
  let disposed=false,epoch=0,aborter=null,published=null,loading=false,dataError='',feedback='',saveStatus='',predictionControl=null,firstStatus='';
  const token={dispose:null},ownsView=()=>!disposed&&mounted.get(root)===token&&(!owned||activeOwners.get(draftOwner)===token)&&predictionControl===field('prediction');
  const mode=()=>draft.step===1?'published':'teaching';
  const rowsFor=kind=>kind==='published'?published?.rows??[]:RHEOLOGY_SYNTHETIC;
  function renderTemplate(){root.innerHTML=`<section class="rheology-lab" data-rheology-lab="${RHEOLOGY_LAB_ID}" aria-labelledby="${prefix}-title">
    <header class="rh-heading rh-sr-only"><p class="rh-kicker">流動曲線與證據</p><h2 id="${prefix}-title">同一個黏度數字，流動就一樣嗎？</h2></header>
    <section class="rh-prediction" data-rh-first-entry><h3>先留下本次判斷，再開模型</h3><p>20°C 的指定教學材料 A 與 B，在 100 s⁻¹ 時同有 τ = 20 Pa、ηapp = 0.2 Pa·s。單靠這一點，能否判定它們在其他剪切率也相同？說明理由，並選一個想補看的條件。</p><label class="rh-field" for="${prefix}-prediction">${draft.first?'已封存的本次初答（不可改寫；之後請用修訂欄）':'本次初答，可先自由作答'}<textarea id="${prefix}-prediction" rows="3" maxlength="1800" data-rh-prediction ${draft.first?'readonly':''} placeholder="先寫自己的判斷、理由與想補看的條件。"></textarea></label>${draft.first?'':`<label class="rh-field" for="${prefix}-past">先前是否看過本課正文、圖表或解析？（可不填）<select id="${prefix}-past" data-rh-first-past><option value="unknown">未記錄／不填</option><option value="possible">可能看過</option><option value="seen">已看過</option></select></label><div class="rh-observe-actions"><button type="button" data-rh-action="commit-first" data-rh-first-commit>封存初答，再開模型</button><button type="button" data-rh-action="explore-first" data-rh-first-explore>先探索（可不填初答）</button></div>`}<p role="status" data-rh-first-status></p><p class="rh-small">只記錄本次工作區的作答與開啟順序。課文、示意圖及先前閱讀可能已提供線索；不宣稱盲測或從未看過。未保存草稿重新整理即可能失去，請保存或複製摘要。</p></section>
    ${draft.first?`
    <div class="rh-steps" role="tablist" aria-label="流變探究步驟">${['找第二個觀測','讀食品研究','修訂與轉移'].map((title,i)=>`<button type="button" role="tab" id="${prefix}-tab-${i}" aria-controls="${prefix}-panel-${i}" aria-selected="${draft.step===i}" tabindex="${draft.step===i?0:-1}" data-rh-step="${i}"><span>0${i+1}</span>${title}</button>`).join('')}</div>
    <div class="rh-explorer" data-rh-explorer>
      <div class="rh-rate-controls"><label class="rh-field rh-slider-label" for="${prefix}-slider"><span class="rh-slider-caption">改變剪切率 γ̇ <span class="rh-small">沿對數刻度移動</span></span><input type="range" id="${prefix}-slider" min="0" max="1000" step="1" data-rh-rate-slider></label><label class="rh-field rh-number-label" for="${prefix}-rate">數值 / s⁻¹<input type="number" id="${prefix}-rate" step="any" inputmode="decimal" data-rh-rate-number></label><div class="rh-presets" role="group" aria-label="剪切率快選">${[10,100,300].map(rate=>`<button type="button" data-rh-preset="${rate}">${rate} s⁻¹</button>`).join('')}</div></div>
      <p class="rh-feedback" role="status" data-rh-rate-status></p>
      <div class="rh-explorer-heading"><h3 class="rh-sr-only" data-rh-case-title></h3><p class="rh-case-identity" data-rh-case-identity></p><div class="rh-legend" data-rh-legend></div></div>
      <div class="rh-charts" data-rh-charts></div>
      <div class="rh-table-scroll" data-rh-current-table></div><p class="rh-comparison" data-rh-comparison></p>
      <div class="rh-observe-actions"><button type="button" class="rh-primary" data-rh-action="record">記錄這個觀測</button><span data-rh-record-count></span><button type="button" data-rh-action="clear">清空觀測紀錄</button></div><p class="rh-feedback" role="status" data-rh-feedback></p>
      <details class="rh-definition-details"><summary>剪切率、剪應力與表觀黏度</summary><p class="rh-definitions">剪切率：相鄰流層的速度差相對於間距，單位 s⁻¹；它不是泵浦流量。剪應力：每面積的切向力，單位 Pa。表觀黏度：ηapp = τ / γ̇。</p></details>
      <details class="rh-calculation"><summary>自己算一次：ηapp = τ / γ̇</summary><div class="rh-calculation-grid"><label class="rh-field" for="${prefix}-calc-material">計算哪個材料？<select id="${prefix}-calc-material" data-rh-calc-material></select></label><p data-rh-calc-given></p><label class="rh-field" for="${prefix}-calc-answer">我的計算值 / Pa·s<input type="text" inputmode="decimal" id="${prefix}-calc-answer" maxlength="80" data-rh-calc-answer placeholder="自行輸入結果"></label><button type="button" data-rh-action="check">核對計算</button></div><p role="status" data-rh-calc-feedback></p><p class="rh-small">只核對這次算式，容許 1% 四捨五入差異；不代表理解或掌握流變。</p></details>
    </div>
    <section class="rh-step-panel" role="tabpanel" id="${prefix}-panel-0" aria-labelledby="${prefix}-tab-0" data-rh-panel="0">
      <p>初答已另外封存。現在從相同的讀值出發，選第二個條件，檢查原判斷。A：牛頓模型 τ = 0.2γ̇；B：冪律模型 τ = 2γ̇⁰·⁵。這些是教學指定參數，不代表特定食品。</p>
    </section>
    <section class="rh-step-panel" role="tabpanel" id="${prefix}-panel-1" aria-labelledby="${prefix}-tab-1" data-rh-panel="1" hidden>
      <p class="rh-data-status" role="status" data-rh-data-status></p><button type="button" data-rh-action="retry" hidden>重試讀取研究資料</button><details class="rh-metadata"><summary>原表參數、量測條件與來源</summary><div class="rh-research-intro"><h3>研究參數能回答什麼？</h3><p>比較 4°C 優格的上升掃描擬合曲線。下圖由已刊參數重建，<strong>不是原始量測點，也未證明各點達穩態</strong>。</p></div><div data-rh-metadata></div></details>
    </section>
    <section class="rh-step-panel" role="tabpanel" id="${prefix}-panel-2" aria-labelledby="${prefix}-tab-2" data-rh-panel="2" hidden>
      <h3>用觀測支持修訂，保留原來的想法</h3><div class="rh-original"><strong>已封存的本次初答；是否先看過線索另見封存紀錄</strong><p data-rh-original></p></div><label class="rh-field" for="${prefix}-revision">操作後的解釋與修訂（可編輯，人工參考檢核）<textarea id="${prefix}-revision" rows="4" maxlength="2600" data-rh-revision placeholder="指出選了哪個條件、兩個讀值如何不同，以及哪些結論仍缺證據。"></textarea></label>
      <div class="rh-claims"><h3>把結論帶到另一個問題</h3><p class="rh-small">各自選擇後核對理由；這裡不自動評定掌握，也不代寫你的修訂。</p>${RHEOLOGY_CLAIMS.map(claim=>`<div class="rh-claim"><label for="${prefix}-claim-${claim.id}">${esc(claim.prompt)}</label><select id="${prefix}-claim-${claim.id}" data-rh-claim="${esc(claim.id)}"><option value="">先作自己的判斷</option><option value="supported">目前證據支持</option><option value="insufficient">目前證據不足</option></select><p role="status" data-rh-claim-feedback="${esc(claim.id)}"></p></div>`).join('')}</div>
      <details class="rh-summary-details"><summary>檢查並保存本次探究摘要</summary><label class="rh-field" for="${prefix}-summary">資料身份、觀測、計算與自己的文字<textarea id="${prefix}-summary" readonly rows="10" data-rh-summary></textarea></label><div class="rh-observe-actions"><button type="button" data-rh-action="copy">選取摘要文字</button>${typeof onSaveSummary==='function'?'<button type="button" class="rh-primary" data-rh-action="save">附加到本課筆記</button>':''}</div><p role="status" data-rh-save-status></p><p class="rh-small">未保存草稿只在本頁暫留；重新整理前請保存或複製。保存成功才會防止相同摘要重複附加。</p></details>
    </section>
    <details class="rh-records"><summary>已選觀測 <span data-rh-record-total></span></summary><div class="rh-table-scroll" data-rh-records></div></details>
    <details class="rh-boundaries"><summary>模型範圍與概念來源</summary><p>教學 A：μ = 0.2 Pa·s；教學 B：K = 2 Pa·s⁰·⁵、n = 0.5。只在 20°C、1–400 s⁻¹ 的指定模型範圍比較。ηapp 下降時，τ 仍可能增加。</p><p>研究曲線採 Herschel–Bulkley：τ = τ₀ + Kγ̇ⁿ，ηapp = τ/γ̇。τ₀ 是擬合外推參數，不是實測零剪切屈服證據；不將曲線延伸到零。</p><p>曲線不唯一指定微觀結構，也不證明凝膠、糖苷鍵水解、觸變恢復、黏彈性或 G′／G″。本工作區不計算壓降、管內流速分布、停留時間分布或殺菌效果。</p><ul>${RHEOLOGY_SOURCES.map(source=>`<li>${safeLink(source.url,source.title)} — ${esc(source.note)}</li>`).join('')}</ul></details>
    <p><a href="#learn/colloids/colloid-flow-evidence/check">完成觀察後，前往本課原有短答與雙支路停留時間遷移</a>：自由文字依參考解答與規準自行檢核，不由本台自動評分。看過答案再作答時，請當作修訂複習。</p>`:''}
  </section>`;
    predictionControl=field('prediction');predictionControl.value=draft.first?.text??draft.prediction;predictionControl.readOnly=!!draft.first;
    if(draft.first){field('revision').value=draft.revision;for(const select of root.querySelectorAll('[data-rh-claim]'))select.value=draft.claims[select.dataset.rhClaim]??'';}
    else field('first-past').value=draft.pastExposure;
  }

  function drawFirst(){
    if(!ownsView())return;
    field('first-status').textContent=draft.first?draft.first.trigger==='legacy'?'既有文字的作答／曝光先後未記錄；保留原文，不回補為已驗證操作前初答。':`已於 ${draft.first.at} 封存；${draft.first.trigger==='explore'?'由「先探索」開啟，空白初答也如實保留':'先封存初答再開啟模型'}。先前閱讀：${draft.first.pastExposure==='seen'?'自述已看過':draft.first.pastExposure==='possible'?'自述可能看過':'未記錄'}。`:firstStatus||'尚未封存，也尚未在本工作區打開模型。';
  }
  function freezeFirst(trigger){
    if(!ownsView()||draft.first)return;
    if(trigger==='commit'&&!draft.prediction.trim()){firstStatus='請先寫下自己的初答，或明確選擇「先探索」。';drawFirst();return;}
    draft.first={version:1,text:draft.prediction,trigger,at:new Date().toISOString(),conditions:initialConditions(),pastExposure:draft.pastExposure,exposure:exposureCopy(draft.exposure),chronology:'本工作區封存後才開啟模型，先前閱讀未核實'};
    renderTemplate();drawStep();loadPublished();
  }

  function calculationText(kind){
    const calc=draft.calculations[kind],context=calc.context;
    if(!context)return `${identity(kind)}：尚未輸入計算值。`;
    return `${context.identity}；輸入時材料=${context.label}；γ̇=${fmt(context.rate)} s⁻¹；τ=${fmt(context.stress)} Pa；${fmt(context.temperatureC)}°C；自己輸入=${calc.answer||'（未填）'} Pa·s；${!calculationIsCurrent(kind)?'這是前次條件的輸入，尚未對新條件核對':calc.result===null?'目前條件尚未核對':calc.result.valid?(calc.result.correct?'算式核對相符（非掌握評分）':'算式核對未相符'):'輸入尚不是有效非負數值'}。`;
  }
  function calculationContext(kind){
    const calc=draft.calculations[kind],row=rowsFor(kind).find(item=>item.id===calc.rowId);if(!row)return null;
    const point=evaluateFlow(row,draft.rates[kind]);
    return {rowId:row.id,label:row.label,rate:point.shearRate,stress:point.stress,temperatureC:row.temperatureC,identity:identity(kind),K:row.K,n:row.n,tau0:row.tau0};
  }
  function calculationIsCurrent(kind){
    const context=draft.calculations[kind].context,current=calculationContext(kind);
    return !!context&&!!current&&['rowId','rate','temperatureC','K','n','tau0'].every(key=>context[key]===current[key]);
  }
  function summary(){
    const dataIdentity=published?`${published.id} v${published.version}；${published.source.title??'研究來源'}；${published.source.table}；${published.source.url}；${published.conditions.protocol}`:'研究資料尚未載入或未通過核對。';
    const observations=draft.observations.map((item,i)=>`${i+1}. ${item.identity}；${item.temperatureC}°C；γ̇=${fmt(item.rate)} s⁻¹\n${item.readings.map(p=>`   ${p.label}：τ=${fmt(p.stress)} Pa；ηapp=${fmt(p.viscosity)} Pa·s`).join('\n')}${item.source?'\n   '+item.source:''}`).join('\n');
    const claims=RHEOLOGY_CLAIMS.map(c=>`${c.prompt}\n自己的判斷：${draft.claims[c.id]==='supported'?'目前證據支持':draft.claims[c.id]==='insufficient'?'目前證據不足':'（未選）'}`).join('\n');
    return `流動曲線與證據\n教學身份：20°C；A μ=0.2 Pa·s；B K=2 Pa·s^0.5、n=0.5；1–400 s⁻¹。\n研究身份：${dataIdentity}\n研究數值為參數重建，非原始量測點；上升掃描擬合未證明各點達穩態；參數 SD 未傳播為曲線信賴區間。\n\n本次初答紀錄：${JSON.stringify({version:draft.first.version,trigger:draft.first.trigger,at:draft.first.at,conditions:draft.first.conditions,pastExposure:draft.first.pastExposure,exposure:draft.first.exposure,chronology:draft.first.chronology})}\n只記錄本工作區開啟順序，不宣稱盲測；null 表示未記錄，false 只限本次工作區尚未開啟。\n已封存初答：\n${draft.first.text}\n\n選定觀測：\n${observations||'（尚未記錄）'}\n\n自己的計算：\n${calculationText('teaching')}\n${calculationText('published')}\n\n操作後解釋與修訂（目前可編輯草稿）：\n${draft.revision||'（未填）'}\n\n遷移判斷：\n${claims}\n目前工作區曝光：${JSON.stringify(draft.exposure)}。claims 只記錄曾請求回饋的題目，不等於答對或掌握。`;
  }
  function drawSummary(){
    if(!ownsView()||!draft.first)return;const value=summary();field('summary').value=value;field('original').textContent=draft.first.text||'（封存時未填初答；不回補成操作前文字。）';
    field('save-status').textContent=saveStatus;
    const save=$('[data-rh-action="save"]');if(save)save.disabled=draft.saved.has(value);
  }
  function drawRecords(){
    if(!ownsView()||!draft.first)return;
    field('record-count').textContent=`已記錄 ${draft.observations.length} / 12 個條件`;
    field('record-total').textContent=`（${draft.observations.length} / 12）`;
    field('records').innerHTML=draft.observations.length?`<table><caption>每一列保留記錄時的材料身份與條件。</caption><thead><tr><th scope="col">資料／溫度</th><th scope="col">γ̇ / s⁻¹</th><th scope="col">材料</th><th scope="col">τ / Pa</th><th scope="col">ηapp / Pa·s</th></tr></thead><tbody>${draft.observations.flatMap(item=>item.readings.map(p=>`<tr><td>${esc(item.identity)}<br>${fmt(item.temperatureC)}°C</td><td>${fmt(item.rate)}</td><td>${esc(p.label)}</td><td>${fmt(p.stress)}</td><td>${fmt(p.viscosity)}</td></tr>`)).join('')}</tbody></table>`:'<p class="rh-small">尚未記錄。回前兩步選一個剪切率，再按「記錄這個觀測」。</p>';
    $('[data-rh-action="clear"]').disabled=draft.observations.length===0;
  }
  function drawCalculation(){
    if(!ownsView()||!draft.first)return;const kind=mode(),rows=rowsFor(kind);if(!rows.length)return;
    const calc=draft.calculations[kind];if(!rows.some(row=>row.id===calc.rowId))calc.rowId=rows[1]?.id??rows[0].id;
    const row=rows.find(item=>item.id===calc.rowId),point=evaluateFlow(row,draft.rates[kind]);
    field('calc-material').innerHTML=rows.map(item=>`<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('');field('calc-material').value=calc.rowId;
    field('calc-given').textContent=`${identity(kind)}：τ = ${fmt(point.stress)} Pa，γ̇ = ${fmt(point.shearRate)} s⁻¹。用 τ ÷ γ̇ 求 ηapp。`;
    field('calc-answer').value=calc.answer;
    field('calc-feedback').textContent=calc.context&&!calculationIsCurrent(kind)?`保留的是前次「${calc.context.label}，${fmt(calc.context.temperatureC)}°C、${fmt(calc.context.rate)} s⁻¹」條件的輸入；尚未對新條件核對。修改數值或明確按核對，才將這份答案用於目前條件。`:calc.result===null?'尚未核對目前條件。':!calc.result.valid?'請自行輸入有效非負數值，例如 0.2；單位為 Pa·s。':calc.result.correct?'這次算式相符。請另外解釋它能支持什麼結論；這不是掌握評分。':`這次算式未相符。請核對 τ ÷ γ̇；目前模型值為 ${fmt(calc.result.expected)} Pa·s。`;
  }
  function drawExplorer(preserveNumber=false){
    if(!ownsView()||!draft.first)return;const kind=mode(),rows=rowsFor(kind),available=draft.step!==2&&rows.length>0;
    field('explorer').hidden=!available;if(!available)return;
    draft.exposure.model=true;if(kind==='published')draft.exposure.published=true;
    const domain=commonShearRange(rows),rate=draft.rates[kind],points=rows.map(row=>evaluateFlow(row,rate));
    field('case-title').textContent=kind==='published'?'已刊優格參數的同條件比較':'兩個教學材料的同條件比較';
    field('case-identity').textContent=`${identity(kind)} · ${rows[0].temperatureC}°C · ${fmt(domain[0])}–${fmt(domain[1])} s⁻¹`;
    field('rate-number').min=String(domain[0]);field('rate-number').max=String(domain[1]);if(!preserveNumber)field('rate-number').value=String(rate);
    field('rate-slider').value=String(Math.round(Math.log(rate/domain[0])/Math.log(domain[1]/domain[0])*1000));
    field('rate-slider').setAttribute('aria-valuetext',`${fmt(rate)} s⁻¹`);
    field('legend').innerHTML=rows.map((row,i)=>`<span class="rh-legend-item"><i class="rh-swatch rh-swatch-${i%2}" aria-hidden="true"></i>${esc(row.label)}</span>`).join('');
    field('charts').innerHTML=chart(rows,rate,'stress',kind,prefix)+chart(rows,rate,'viscosity',kind,prefix);
    field('current-table').innerHTML=`<table><caption>${esc(identity(kind))} · ${rows[0].temperatureC}°C · 目前 γ̇ = ${fmt(rate)} s⁻¹</caption><thead><tr><th scope="col">材料</th><th scope="col">τ / Pa</th><th scope="col">ηapp / Pa·s</th></tr></thead><tbody>${points.map((point,i)=>`<tr><th scope="row">${esc(rows[i].label)}</th><td>${fmt(point.stress)}</td><td>${fmt(point.viscosity)}</td></tr>`).join('')}</tbody></table>`;
    const equal=Math.abs(points[0].viscosity-points[1].viscosity)<1e-10;
    field('comparison').textContent=equal?'這個條件下，兩個模型的讀值相同；再找第二個剪切率比較。':`這個條件下，${points[0].viscosity>points[1].viscosity?rows[0].label:rows[1].label} 的表觀黏度較高。這個差異只對應圖上所列的條件。`;
    for(const button of root.querySelectorAll('[data-rh-preset]'))button.disabled=Number(button.dataset.rhPreset)<domain[0]||Number(button.dataset.rhPreset)>domain[1];
    field('feedback').textContent=feedback;drawCalculation();drawRecords();
  }
  function drawClaims(){
    if(!ownsView()||!draft.first)return;
    for(const claim of RHEOLOGY_CLAIMS){const chosen=draft.claims[claim.id];$(`[data-rh-claim-feedback="${claim.id}"]`).textContent=chosen?`${chosen===claim.answer?'與目前證據相符。':'請再核對可支持的範圍。'}${claim.explanation}`:'';}
  }
  function drawStep(preserveNumber=false){
    if(!ownsView())return;drawFirst();if(!draft.first)return;
    if(draft.step===0)draft.exposure.parameters=true;
    for(const button of root.querySelectorAll('[data-rh-step]')){const active=Number(button.dataset.rhStep)===draft.step;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}
    for(const panel of root.querySelectorAll('[data-rh-panel]'))panel.hidden=Number(panel.dataset.rhPanel)!==draft.step;
    if(!preserveNumber)field('rate-status').textContent='';drawExplorer(preserveNumber);drawRecords();drawClaims();drawSummary();
  }
  function metadata(){
    const source=published.source,conditions=published.conditions;
    const methods=[conditions.instrument,conditions.geometry].filter(value=>typeof value==='string'&&value.length).map(value=>esc(value)).join('；');
    return `<p>${safeLink(source.url,source.title??'研究原文')} · ${esc(source.table)}${source.doi?` · DOI ${esc(source.doi)}`:''}${source.licenseUrl?` · 原文授權：${safeLink(source.licenseUrl,'CC BY 4.0')}`:''}</p>${methods?`<p>量測設備與幾何：${methods}</p>`:''}<div class="rh-table-scroll"><table><caption>刊載模型參數與 100 s⁻¹ 黏度摘要：平均值 ± SD；不是原始逐點資料。</caption><thead><tr><th scope="col">材料</th><th scope="col">τ₀ / Pa</th><th scope="col">K / Pa·sⁿ</th><th scope="col">n</th><th scope="col">原表 ηapp（100 s⁻¹）/ Pa·s</th></tr></thead><tbody>${published.rows.map(row=>`<tr><th scope="row">${esc(row.label)}</th><td>${fmt(row.tau0)} ± ${fmt(row.sd.tau0)}</td><td>${fmt(row.K)} ± ${fmt(row.sd.K)}</td><td>${fmt(row.n)} ± ${fmt(row.sd.n)}</td><td>${row.reportedViscosityAt100?`${fmt(row.reportedViscosityAt100.mean)} ± ${fmt(row.reportedViscosityAt100.sd)}`:'原文未列'}</td></tr>`).join('')}</tbody></table></div><p>${esc(conditions.protocol)}</p><p>${esc(conditions.variabilityNote)}</p><p>τ = τ₀ + Kγ̇ⁿ；ηapp = τ/γ̇。τ₀ 是擬合外推，不是實測零剪切屈服證據。不同 n 的 K 量綱不同，不應單獨按 K 大小替兩個材料排黏度。</p><ul>${published.limits.map(limit=>`<li>${esc(limit.replace('reportedViscosityAt100','原表 100 s⁻¹ 表觀黏度摘要'))}</li>`).join('')}</ul>`;
  }
  async function loadPublished(){
    if(!ownsView()||!draft.first)return;const current=++epoch;aborter?.abort();aborter=new AbortController();loading=true;dataError='';
    field('data-status').textContent='正在讀取並核對研究資料…';$('[data-rh-action="retry"]').hidden=true;
    try{
      if(typeof fetcher!=='function')throw new Error('Fetch unavailable');
      const response=await fetcher(new URL('../data/rheology-published.json',import.meta.url),{signal:aborter.signal});if(!ownsView()||current!==epoch)return;
      if(!response?.ok)throw new Error('Research data unavailable');
      const data=await response.json();if(!ownsView()||current!==epoch)return;
      published=validateRheologyData(data);loading=false;draft.calculations.published.result=null;
      const domain=commonShearRange(published.rows);if(draft.rates.published<domain[0]||draft.rates.published>domain[1]){draft.rates.published=Math.min(domain[1],Math.max(domain[0],100));draft.calculations.published.result=null;}
      field('metadata').innerHTML=metadata();field('data-status').textContent='研究參數已核對。圖與目前讀值皆為參數重建，非原始量測點。';drawStep(document.activeElement===field('rate-number')||!!field('rate-status').textContent);
    }catch(error){
      if(!ownsView()||current!==epoch)return;loading=false;published=null;dataError='研究資料無法讀取或未通過核對；教學模型仍可操作。請重試。';
      field('data-status').textContent=dataError;field('metadata').textContent='資料尚未通過核對，暫不顯示研究曲線或參數。';$('[data-rh-action="retry"]').hidden=false;drawStep(document.activeElement===field('rate-number')||!!field('rate-status').textContent);
    }
  }
  function setRate(value,preserveNumber=false){
    if(!ownsView()||!draft.first)return;
    const kind=mode(),rows=rowsFor(kind);if(!rows.length)return;const domain=commonShearRange(rows);
    if(typeof value!=='number'||!Number.isFinite(value)||value<domain[0]||value>domain[1]){field('rate-status').textContent=`請輸入 ${fmt(domain[0])}–${fmt(domain[1])} s⁻¹ 的有效正數；圖仍保留前一個有效條件。`;return;}
    if(value!==draft.rates[kind]){draft.rates[kind]=value;draft.calculations[kind].result=null;saveStatus='';feedback='';}
    field('rate-status').textContent='';drawExplorer(preserveNumber);drawSummary();
  }
  function record(){
    if(!ownsView()||!draft.first)return;
    const kind=mode(),rows=rowsFor(kind);if(!rows.length||draft.step===2)return;
    const rate=draft.rates[kind],key=`${kind}:${rate.toPrecision(12)}`;
    if(draft.observations.some(item=>item.key===key))feedback='這個資料與剪切率已記錄，沒有重複加入。';
    else if(draft.observations.length>=12)feedback='已達 12 個觀測條件。請先複製／保存摘要，再清空觀測以開始下一組。';
    else {draft.observations.push({key,mode:kind,rate,identity:identity(kind),temperatureC:rows[0].temperatureC,readings:rows.map(row=>({...evaluateFlow(row,rate),label:row.label})),source:kind==='published'?`${published.id} v${published.version}；${published.source.table}；${published.source.url}`:''});feedback='已保留這個條件的兩個材料讀值。';saveStatus='';}
    field('feedback').textContent=feedback;drawRecords();drawSummary();
  }
  const onInput=event=>{
    if(!ownsView()||!root.contains(event.target))return;const target=event.target;
    if(target.matches('[data-rh-prediction]')){if(draft.first){target.value=draft.first.text;return;}draft.prediction=target.value;firstStatus='';drawFirst();}
    else if(!draft.first)return;
    else if(target.matches('[data-rh-revision]')){draft.revision=target.value;saveStatus='';drawSummary();}
    else if(target.matches('[data-rh-rate-number]'))setRate(target.value.trim()===''?NaN:Number(target.value),true);
    else if(target.matches('[data-rh-rate-slider]')){const rows=rowsFor(mode());if(!rows.length)return;const [lo,hi]=commonShearRange(rows),fraction=Number(target.value)/1000;setRate(fraction===0?lo:fraction===1?hi:Number((lo*(hi/lo)**fraction).toPrecision(8)));}
    else if(target.matches('[data-rh-calc-answer]')){const calc=draft.calculations[mode()];calc.answer=target.value;calc.context=calculationContext(mode());calc.result=null;saveStatus='';field('calc-feedback').textContent='尚未核對目前條件。';drawSummary();}
  };
  const onChange=event=>{
    if(!ownsView()||!root.contains(event.target))return;const target=event.target;
    if(target.matches('[data-rh-first-past]')){if(!draft.first&&['unknown','possible','seen'].includes(target.value))draft.pastExposure=target.value;return;}
    if(!draft.first)return;
    if(target.matches('[data-rh-calc-material]')){if(!rowsFor(mode()).some(row=>row.id===target.value))return;const calc=draft.calculations[mode()];calc.rowId=target.value;calc.result=null;saveStatus='';drawCalculation();drawSummary();}
    else if(target.matches('[data-rh-claim]')){const id=target.dataset.rhClaim;if(!RHEOLOGY_CLAIMS.some(claim=>claim.id===id)||!['','supported','insufficient'].includes(target.value))return;draft.claims[id]=target.value;if(target.value&&!draft.exposure.claims.includes(id))draft.exposure.claims.push(id);saveStatus='';drawClaims();drawSummary();}
  };
  const onClick=event=>{
    if(!ownsView()||!root.contains(event.target))return;
    if(event.target.closest('[data-rh-first-commit]')){freezeFirst('commit');return;}
    if(event.target.closest('[data-rh-first-explore]')){freezeFirst('explore');return;}
    if(!draft.first){firstStatus='請先封存初答，或明確選擇「先探索」。';drawFirst();return;}
    const step=event.target.closest('[data-rh-step]');
    if(step){const next=Number(step.dataset.rhStep);if([0,1,2].includes(next)){draft.step=next;feedback='';drawStep();}return;}
    const preset=event.target.closest('[data-rh-preset]');if(preset){setRate(Number(preset.dataset.rhPreset));return;}
    const button=event.target.closest('[data-rh-action]');if(!button||button.disabled)return;const action=button.dataset.rhAction;
    if(action==='retry'){if(!loading)loadPublished();return;}
    if(action==='record'){record();return;}
    if(action==='clear'){draft.observations=[];feedback='已清空觀測；原先預測、修訂與自己輸入的計算值仍保留。';saveStatus='';drawExplorer();drawRecords();drawSummary();return;}
    if(action==='check'){const rows=rowsFor(mode()),calc=draft.calculations[mode()],row=rows.find(item=>item.id===calc.rowId);if(!row)return;const p=evaluateFlow(row,draft.rates[mode()]);calc.context=calculationContext(mode());calc.result=checkViscosityAnswer(p.stress,p.shearRate,calc.answer);saveStatus='';drawCalculation();drawSummary();return;}
    if(action==='copy'){field('summary').focus();field('summary').select();return;}
    if(action==='save'&&typeof onSaveSummary==='function'){
      const value=summary();if(draft.saved.has(value))return;
      let success=false;try{success=onSaveSummary(value)===true;}catch{}
      if(!ownsView())return;if(success){draft.saved.add(value);saveStatus='已附加到本課筆記；自己的草稿仍保留。';}else saveStatus='尚未保存；請選取摘要複製，或重試保存。';drawSummary();
    }
  };
  const onKeydown=event=>{
    if(!ownsView()||!draft.first||!root.contains(event.target)||!event.target.matches('[data-rh-step]'))return;
    const key=event.key;let next=draft.step;if(key==='ArrowRight')next=(next+1)%3;else if(key==='ArrowLeft')next=(next+2)%3;else if(key==='Home')next=0;else if(key==='End')next=2;else return;
    event.preventDefault();draft.step=next;feedback='';drawStep();$(`[data-rh-step="${next}"]`).focus();
  };
  const onToggle=event=>{if(!ownsView()||!draft.first||!root.contains(event.target)||!event.target.open)return;if(event.target.matches('.rh-metadata')||event.target.matches('.rh-boundaries')){draft.exposure.parameters=true;drawSummary();}};
  const dispose=()=>{if(disposed)return;disposed=true;epoch++;aborter?.abort();root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('click',onClick);root.removeEventListener('keydown',onKeydown);root.removeEventListener('toggle',onToggle,true);if(mounted.get(root)===token)mounted.delete(root);if(owned&&activeOwners.get(draftOwner)===token)activeOwners.delete(draftOwner);};
  token.dispose=dispose;mounted.set(root,token);if(owned)activeOwners.set(draftOwner,token);
  root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('click',onClick);root.addEventListener('keydown',onKeydown);root.addEventListener('toggle',onToggle,true);
  renderTemplate();drawStep();if(draft.first)loadPublished();
  return dispose;
}
