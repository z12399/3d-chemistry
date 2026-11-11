import {escapeHTML as esc} from './storage.js';
import {YOGURT_LAB_ID,YOGURT_PRODUCTS,YOGURT_REACTIONS,evaluateYogurtProducts,validateYogurtData,compareYogurtRecords,YOGURT_CLAIMS,evaluateYogurtClaim} from './yogurt-model.js';
export {YOGURT_LAB_ID} from './yogurt-model.js';

const STEPS=['cause','evidence','explain'];
const HEADINGS={cause:'乳糖的碳，接著去了哪裡？',evidence:'換一個觀測，結論還一樣嗎？',explain:'哪些解釋，已經有證據支持？'};
const RELATIONS={higher:'B 的刊載均值較高',lower:'B 的刊載均值較低',same:'兩筆刊載均值相同'};
const JUDGMENTS={supported:'這份資料可以支持',insufficient:'目前證據還不夠'};
const option=(value,label)=>`<option value="${esc(String(value))}">${esc(label)}</option>`;
const safeHref=value=>typeof value==='string'&&/^#[a-z][a-z0-9/-]*$/i.test(value)?value:'#learn/review';
const sourceHref=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
const fmt=value=>Number.isFinite(value)?String(Number(value.toPrecision(6))):'—';
const marker=(x,y,kind)=>kind==='a'?`<circle class="yl-dot yl-dot-a" cx="${x}" cy="${y}" r="9"/>`:`<path class="yl-dot yl-dot-b" d="M${x} ${y-11}L${x+11} ${y}L${x} ${y+11}L${x-11} ${y}Z"/>`;
const fresh=()=>({choice:'',checked:false,reference:false,seen:false});
const drafts=new WeakMap();
const detailKeys=['chain','table','writing','initial','revision','source','notes'];
function draftFor(owner,key,startStep) {
  const create=()=>({step:startStep,reactionId:'hydrolysis',claimId:YOGURT_CLAIMS[0].id,
    visited:new Set([startStep]),reactionStates:new Map(YOGURT_REACTIONS.map(x=>[x.id,{counts:Object.fromEntries(YOGURT_PRODUCTS.map(p=>[p.id,0])),checked:false,reference:false,seen:false,touched:false}])),
    selection:{mode:'treatment',metricId:'ph',day:0,treatmentA:'control',treatmentB:'pwp',treatmentId:'control',dayA:0,dayB:21},
    evidence:fresh(),claims:new Map(YOGURT_CLAIMS.map(x=>[x.id,fresh()])),
    writing:{draft:'',initial:'',revision:'',retained:false,context:null,initialContext:null},viewedData:false,
    open:Object.fromEntries(detailKeys.map(key=>[key,false])),writingStatus:'',structureStatus:'',
    savedParts:null,savedVersions:[],review:'',saving:false,saveStatus:'',views:new Set()});
  if(!owner||!['object','function'].includes(typeof owner))return create();
  let byLesson=drafts.get(owner);if(!byLesson){byLesson=new Map();drafts.set(owner,byLesson);}
  const lesson=typeof key==='string'&&key?key:YOGURT_LAB_ID;
  if(!byLesson.has(lesson))byLesson.set(lesson,create());
  return byLesson.get(lesson);
}
let instance=0;

/** Published observations stay read-only; drafts live only within this document. */
export function mountYogurtLab(container,id=YOGURT_LAB_ID,{startStep='cause',draftOwner,draftKey=YOGURT_LAB_ID,onSaveSummary,reviewHref='#learn/review',onOpenStructure,fetcher=globalThis.fetch}={}) {
  if(!container?.querySelector||!container?.addEventListener)throw new TypeError('A DOM container is required');
  if(id!==YOGURT_LAB_ID)throw new RangeError('Unknown fermented milk activity');
  if(!STEPS.includes(startStep))throw new RangeError('Unknown fermented milk step');
  const prefix=`yogurt-lab-${++instance}`,abort=new AbortController(),$=selector=>container.querySelector(selector),$$=selector=>container.querySelectorAll(selector);
  const state=draftFor(draftOwner,draftKey,startStep),{visited,reactionStates,selection,evidence,claims,writing}=state;
  let disposed=false,data=null,{step,reactionId,claimId,viewedData}=state,historyVersion=-1;
  const anyReference=()=>[...reactionStates.values(),evidence,...claims.values()].some(x=>x.seen);
  const context=()=>({viewedData,referenceSeen:anyReference()});
  const contextText=value=>value?`${value.viewedData?'已看原表觀測':'尚未看原表觀測'}；${value.referenceSeen?'已看核對／參考':'尚未看核對／參考'}`:'尚未留下文字';
  const control=name=>$(`[data-yl-control="${name}"]`),action=name=>$(`[data-yl-action="${name}"]`);
  const text=(selector,value)=>{$(selector).textContent=value;};
  const invalidate=state=>{state.checked=false;state.reference=false;};
  const changed=()=>{if(!state.saving)state.saveStatus='';};
  const unit=metric=>metric.id==='ph'?'pH（無單位）':`${metric.label} · %`;
  const reading=r=>`${r.label}：${r.meanText} ± ${r.sdText} SD${r.metricId==='ph'?'':' %'}（原表字母 ${r.letters}）`;
  const timing=()=>`${data.conditions.storageC} ± ${data.conditions.storagePlusMinusC}°C 貯藏；第 0 日為發酵結束 24 h 後`;
  container.innerHTML='<p role="status">正在讀取發酵乳研究的原表觀測…</p>';

  function build() {
    const source=sourceHref(data.source.url),license=sourceHref(data.source.licenseUrl);
    const treatments=data.treatments.map(x=>option(x.id,x.label)).join(''),days=data.conditions.days.map(day=>option(day,`第 ${day} 日`)).join('');
    container.innerHTML=`<section class="yogurt-lab" aria-labelledby="${prefix}-title">
      <header class="yl-header"><p class="yl-kicker"><span id="${prefix}-title">發酵乳案例工作台</span> · <span data-yl-evidence-label></span></p></header>
      <nav class="yl-steps" aria-label="案例步驟">${STEPS.map((s,i)=>`<button type="button" data-yl-step="${s}" aria-pressed="false">${['碳的去向','讀研究記錄','修訂解釋'][i]}</button>`).join('')}</nav>
      <h2 class="yl-heading" tabindex="-1" data-yl-heading></h2>
      <section data-yl-panel="cause">
        <label class="yl-field" for="${prefix}-reaction">這次要推哪一條淨反應？<select id="${prefix}-reaction" data-yl-control="reaction">${YOGURT_REACTIONS.map(x=>option(x.id,x.label)).join('')}</select></label>
        <p class="yl-question">選產物與數量，再檢查元素帳。相同分子式不代表相同結構。</p>
        <div class="yl-products">${YOGURT_PRODUCTS.map(p=>`<label class="yl-product" for="${prefix}-${p.id}"><span><strong>${esc(p.label)}</strong><small>${esc(p.formula)} · 每份 ${p.atoms.C} C</small></span><select id="${prefix}-${p.id}" data-yl-product="${p.id}" aria-label="${esc(p.label)}產物份數">${[0,1,2,3,4].map(n=>option(n,`${n} 份`)).join('')}</select></label>`).join('')}</div>
        <div class="yl-equation"><span class="yl-muted">你的產物選擇</span><p data-yl-reaction-equation></p><p class="yl-carbon" data-yl-carbon></p></div>
        <div class="yl-actions"><button type="button" class="yl-primary" data-yl-action="cause-check">核對這條反應</button><button type="button" data-yl-action="cause-reference">看參考淨式</button><button type="button" data-yl-action="cause-reset">清空產物</button></div>
        <p class="yl-feedback" role="status" data-yl-cause-feedback></p><p class="yl-reference" data-yl-cause-reference hidden></p>
        <p class="yl-muted" data-yl-reaction-scope></p>
        <details data-yl-details="chain"><summary>從反應，走到蛋白與離水</summary><p class="yl-chain">代謝產酸 → 酸鹼／緩衝 → 蛋白間作用 → 離水與持水觀察</p><p>這是因果問題的連接示意，不是凝膠物理模擬。組成、菌株、食品熱歷程與量測方法也會影響解釋。</p><p>不把一個葡萄糖的淨式當作整份乳糖的實測收率；未計算菌群動力學、乳酸量、pH 或網路結構。</p>${typeof onOpenStructure==='function'?'<button type="button" data-yl-action="structure">對照乳糖水解 3D</button><p>既有結構工具只供水解對照，不代表本研究的完整發酵機構。同一頁內返回可接續；重載前請先附加筆記。</p>':''}<p role="status" data-yl-structure-status></p></details>
      </section>
      <section data-yl-panel="evidence" hidden>
        <nav class="yl-comparison-modes" aria-label="資料比較方式"><button type="button" data-yl-mode="treatment" aria-pressed="false">同日比處理</button><button type="button" data-yl-mode="storage" aria-pressed="false">同處理比日數</button></nav>
        <div class="yl-control-grid"><label class="yl-field" for="${prefix}-metric">觀察指標<select id="${prefix}-metric" data-yl-control="metricId">${data.metrics.map(x=>option(x.id,x.label)).join('')}</select></label><label class="yl-field" data-yl-treatment-control for="${prefix}-day">共同貯藏日<select id="${prefix}-day" data-yl-control="day">${days}</select></label><label class="yl-field" data-yl-storage-control hidden for="${prefix}-treatment">共同處理<select id="${prefix}-treatment" data-yl-control="treatmentId">${treatments}</select></label></div>
        <div class="yl-control-grid" data-yl-treatment-control><label class="yl-field" for="${prefix}-a">A · 處理<select id="${prefix}-a" data-yl-control="treatmentA">${treatments}</select></label><label class="yl-field" for="${prefix}-b">B · 處理<select id="${prefix}-b" data-yl-control="treatmentB">${treatments}</select></label></div>
        <div class="yl-control-grid" data-yl-storage-control hidden><label class="yl-field" for="${prefix}-day-a">A · 貯藏日<select id="${prefix}-day-a" data-yl-control="dayA">${days}</select></label><label class="yl-field" for="${prefix}-day-b">B · 貯藏日<select id="${prefix}-day-b" data-yl-control="dayB">${days}</select></label></div>
        <p class="yl-condition" data-yl-condition></p>
        <div class="yl-plot-layout"><div><div class="yl-chart" data-yl-chart></div><div class="yl-readings">${['a','b'].map((key,i)=>`<div class="yl-reading"><span data-yl-reading-label="${key}"></span><strong data-yl-reading-value="${key}"></strong><small data-yl-reading-meta="${key}"></small></div>`).join('')}</div></div><aside class="yl-equation yl-principle"><span class="yl-muted">旁邊的原理，不是這張圖的產率</span><p>乳糖 + H₂O<br>→ 葡萄糖 + 半乳糖</p><p>C₆H₁₂O₆ → 2 C₃H₆O₃</p><small>同型乳酸淨式；本表沒有測乳糖或乳酸含量。</small></aside></div>
        <p class="yl-caption" data-yl-caption></p><p class="yl-muted" data-yl-metric-definition></p>
        <p class="yl-question">只看這兩筆刊載均值，B 相對 A 如何？</p><div class="yl-choices">${Object.entries(RELATIONS).map(([value,label])=>`<button type="button" data-yl-relation="${value}" aria-pressed="false">${label}</button>`).join('')}</div>
        <div class="yl-actions"><button type="button" class="yl-primary" data-yl-action="evidence-check">核對我的判讀</button><button type="button" data-yl-action="evidence-reference">看差值與界線</button></div>
        <p class="yl-feedback" role="status" data-yl-evidence-feedback></p><p class="yl-reference" data-yl-difference hidden></p>
        <details data-yl-details="table"><summary>查看這個指標的原表值</summary><div class="yl-table-wrap" tabindex="0" role="region" aria-label="原表指標數值，可橫向捲動"><table><caption data-yl-table-caption></caption><thead><tr><th scope="col">處理</th>${data.conditions.days.map(day=>`<th scope="col">第 ${day} 日</th>`).join('')}</tr></thead><tbody data-yl-table></tbody></table></div><p>字母保留原文，只在 Table 3 同一指標欄的比較域內判讀。不能由 SD 重疊自行判定顯著性，也沒有重算 ANOVA／Tukey。</p></details>
      </section>
      <section data-yl-panel="explain" hidden>
        <p class="yl-evidence-context" data-yl-writing-evidence></p>
        <details data-yl-details="writing"><summary>初稿與保留</summary><div data-yl-initial-editor><label class="yl-field" for="${prefix}-draft">留下你目前的解釋<textarea id="${prefix}-draft" rows="3" data-yl-control="draft" placeholder="這份證據支持什麼？哪些環節還沒有量測？"></textarea></label><p class="yl-muted" data-yl-draft-timing></p><button type="button" data-yl-action="retain">保留這份初稿</button></div>
        <details data-yl-initial-archive data-yl-details="initial" hidden><summary>查看保留的初稿</summary><p class="yl-own-text" data-yl-original></p><p class="yl-muted" data-yl-original-timing></p></details></details>
        <h4 class="yl-subheading" tabindex="-1" data-yl-claim-heading>挑一句說法，檢查證據夠不夠</h4><label class="yl-field" for="${prefix}-claim">要檢查的說法<select id="${prefix}-claim" data-yl-control="claim">${YOGURT_CLAIMS.map((x,i)=>option(x.id,`${i+1} · ${['直接觀測','乳糖轉化','菌群機制','安全結論'][i]}`)).join('')}</select></label><p class="yl-claim" data-yl-claim></p>
        <div class="yl-choices">${Object.entries(JUDGMENTS).map(([value,label])=>`<button type="button" data-yl-judgment="${value}" aria-pressed="false">${label}</button>`).join('')}</div>
        <div class="yl-actions"><button type="button" class="yl-primary" data-yl-action="claim-check">核對這句判斷</button><button type="button" data-yl-action="claim-reference">對照證據範圍</button></div><p class="yl-feedback" role="status" data-yl-claim-feedback></p>
        <details data-yl-details="revision"><summary>看過證據後的修訂</summary><label class="yl-field" for="${prefix}-revision">看過證據後，我會怎麼修改？<textarea id="${prefix}-revision" rows="4" data-yl-control="revision" placeholder="保留哪一句、改掉哪一句？還需要什麼證據？"></textarea></label><p class="yl-muted">上方只核對選定命題；你的自由文字不會自動評分。</p></details><p class="yl-feedback" role="status" data-yl-writing-status></p>
      </section>
      <nav class="yl-bottom-nav" aria-label="切換案例步驟"><button type="button" data-yl-action="previous">上一步</button><button type="button" data-yl-action="next">下一步</button></nav>
      <p class="yl-source-line">原文觀測：${source?`<a href="${esc(source)}" target="_blank" rel="noopener noreferrer">Foods ${esc(String(data.source.year))} · Table ${esc(String(data.source.table))} ↗</a>`:'來源網址無法使用'} · mean ± SD，n = ${data.conditions.nPerCell}</p>
      <details data-yl-details="source"><summary>研究條件、方法與資料界線</summary><p>${esc(data.source.title)}</p><p>${esc(data.source.authors.join('；'))} · ${esc(data.source.journal)} ${data.source.year}</p><p>${esc(timing())}。n=${data.conditions.nPerCell}；原文未充分區分獨立生產批次與量測重複。</p><ul>${data.treatments.map(t=>`<li>${esc(t.label)}：${esc(t.description)}</li>`).join('')}</ul><p>這份研究的菌種不是經典兩菌優格組合。原表 0.0 ± 0.0 保留作者四捨五入，不能證明精確為零、沒有變異或方法檢出限。</p><p>自然離水與離心 WHC 是不同操作量，不能寫成 WHC = 100 − SWS。處理比較也不能證明其他因素全部相同。</p><p>本輪只採 Table 3；沒有補作 TA、firmness、菌數或連續發酵曲線，也不預測製程安全或通用保存期限。</p><p>原表數字與字母保留，以原創點圖重繪；${license?`<a href="${esc(license)}" target="_blank" rel="noopener noreferrer">${esc(data.source.license)}</a>`:esc(data.source.license)}。反應淨式是分開的教學記帳，不是此表的實測結果。</p></details>
      <details data-yl-details="notes"><summary>保留本次操作</summary><p>同一頁內離開再回來可接續。重載前請附加到本課筆記並匯出；操作與保存不代表已掌握。</p><label class="yl-field">回看已附加內容<select data-yl-review></select></label><pre class="yl-own-text" data-yl-review-text></pre><label class="yl-field" for="${prefix}-summary">完整目前摘要<textarea id="${prefix}-summary" rows="9" readonly data-yl-summary></textarea></label><label class="yl-field">本次將附加的新增內容<textarea rows="7" readonly data-yl-append></textarea></label><div class="yl-actions"><button type="button" data-yl-action="select-summary">選取完整摘要</button>${typeof onSaveSummary==='function'?'<button type="button" class="yl-primary" data-yl-action="save">附加到本課筆記</button>':''}</div><p class="yl-feedback" role="status" data-yl-save-status></p><a href="${esc(safeHref(reviewHref))}">到我的複習查看筆記 →</a></details>
    </section>`;
    if(step==='evidence')viewedData=true;
    for(const key of detailKeys){const panel=$('[data-yl-details="'+key+'"]');panel.open=state.open[key];panel.ontoggle=onToggle;}
    state.views.add(drawJournal);render();
  }

  function summaryParts() {
    const parts={intro:'發酵乳案例｜原理記帳＋原論文貯藏觀測\n\n研究與記帳分開，沒有模擬發酵速率、凝膠幾何或安全條件。'};
    if(visited.has('cause'))for(const reaction of YOGURT_REACTIONS){const draft=reactionStates.get(reaction.id),v=evaluateYogurtProducts(reaction.id,draft.counts);parts['reaction-'+reaction.id]=`${reaction.label}｜${draft.touched?'自己的選擇：'+v.equationText:'尚未選產物'}；${draft.checked?'已核對':'未核對'}；${draft.seen?'曾看核對／參考':'未看核對／參考'}${draft.checked||draft.reference?'\n\n核對／參考：'+v.feedback+' 參考淨式 '+v.referenceText:''}`;}
    else parts.reaction='反應：尚未操作。';
    if(viewedData){const c=compareYogurtRecords(data,selection),lines=[`原文觀測｜${c.metric.label}；${selection.mode==='treatment'?'同日比處理':'同處理比日數'}；${timing()}`,`A ${reading(c.a)}`,`B ${reading(c.b)}`,`自己的讀數判斷：${RELATIONS[evidence.choice]||'未作答'}；${evidence.checked?'已核對':'未核對'}；${evidence.seen?'曾看核對／參考':'未看核對／參考'}`];if(evidence.checked||evidence.reference)lines.push(`B − A = ${deltaText(c)} ${c.deltaUnit}。${c.sameRecord?'A/B 是同一筆，不是獨立比較。 ':''}${c.note}`);parts.evidence=lines.join('\n\n');}
    else parts.evidence='原文觀測：尚未查看。';
    parts.initial=`自己的初稿（${writing.retained?'已保留':'未按保留'}）：${writing.retained?writing.initial:writing.draft||'未寫'}\n\n初稿狀態：${contextText(writing.retained?writing.initialContext:writing.context)}`;
    parts.revision=`自己的修訂：${writing.revision||'未寫'}（自由文字未自動評分）`;
    if(visited.has('explain'))for(const claim of YOGURT_CLAIMS){const draft=claims.get(claim.id);if(draft.choice||draft.seen)parts['claim-'+claim.id]=`命題：${claim.text}\n自己的判斷：${JUDGMENTS[draft.choice]||'未作答'}；${draft.checked?'已核對':'未核對'}；${draft.seen?'曾看核對／參考':'未看核對／參考'}${draft.checked||draft.reference?'\n已查看參考：'+claim.explanation:''}`;}
    parts.source=`來源：${data.source.title}，Table ${data.source.table}；${data.source.url}；${data.source.license}。\n\nmean ± SD，n=${data.conditions.nPerCell}；批次／重測的獨立性不充分明確。pH 不等於乳酸量；SWS 不是 100 − WHC。查看參考、保存與選項核對都不代表已掌握。`;
    return parts;
  }
  function summary() {return Object.values(summaryParts()).join('\n\n');}
  function syncDraft() {Object.assign(state,{step,reactionId,claimId,viewedData});}
  function syncPanels() {for(const key of detailKeys){const panel=$('[data-yl-details="'+key+'"]');if(panel)state.open[key]=panel.open;}}
  function pending() {
    const parts=Object.freeze(summaryParts()),full=Object.values(parts).join('\n\n');
    const changedParts=Object.entries(parts).filter(([key,value])=>!state.savedParts||state.savedParts[key]!==value).map(([,value])=>value);
    return Object.freeze({parts,full,text:!state.savedParts?full:changedParts.length?['發酵乳案例｜本次變更（接續已保存摘要）',...changedParts].join('\n\n'):''});
  }
  function drawJournal() {
    if(disposed||!data)return;
    const next=pending();$('[data-yl-summary]').value=next.full;$('[data-yl-append]').value=next.text;
    const select=$('[data-yl-review]');
    if(historyVersion!==state.savedVersions.length){select.innerHTML='<option value="">選擇已附加內容</option>'+state.savedVersions.map((_,i)=>option('saved-'+(i+1),'已附加摘要 '+(i+1))).join('');historyVersion=state.savedVersions.length;}
    select.value=state.review;
    const saved=state.savedVersions.find((_,i)=>state.review==='saved-'+(i+1));
    text('[data-yl-review-text]',saved?saved.text:'已附加的文字固定保留；回看不改寫目前初稿、修訂或比較條件。');
    text('[data-yl-save-status]',state.saveStatus||(!next.text?'沒有尚未附加的新內容。':next.text.length>10000?'新增內容超過 10,000 字，尚未保存；完整文字保留，可選取複製。':'只附加尚未保存或後來修改的內容。'));
    if(action('save'))action('save').disabled=state.saving||!next.text;
  }
  function save() {
    if(state.saving||typeof onSaveSummary!=='function')return;
    const captured=pending();if(!captured.text)return;
    if(captured.text.length>10000){state.saveStatus='新增內容超過 10,000 字，尚未保存、未送出、未截斷；完整文字可複製。';drawJournal();return;}
    state.saving=true;state.saveStatus='正在附加…';drawJournal();
    const settle=success=>{
      state.saving=false;
      if(success){state.savedParts=captured.parts;state.savedVersions.push(Object.freeze({text:captured.text,full:captured.full}));state.saveStatus='已追加這批新增內容到本課筆記；後續修改仍保留。';}
      else state.saveStatus='尚未保存；初稿、修訂與待附加文字仍保留，可重試或複製。';
      for(const update of state.views)update();
    };
    try{const result=onSaveSummary(captured.text);if(result&&typeof result.then==='function')Promise.resolve(result).then(value=>settle(value===true),()=>settle(false));else settle(result===true);}catch{settle(false);}
  }
  function onToggle(event) {if(disposed||!data||!event?.target?.dataset?.ylDetails)return;syncPanels();}
  function deltaText(c) {const digits=Math.max(2,...[c.a.meanText,c.b.meanText].map(s=>s.split('.')[1]?.length||0));return (Math.abs(c.delta)<10**(-digits)/2?0:c.delta).toFixed(digits);}
  function draw(c) {
    const [min,max]=c.axis,start=100,end=625,x=n=>start+(n-min)/(max-min)*(end-start);
    const ticks=selection.metricId==='ph'?[4.3,4.4,4.5,4.6]:selection.metricId==='sws'?[0,1,2,3,4,5]:[60,70,80,90,100];
    const groups=[['a',c.a,70],['b',c.b,155]];
    $('[data-yl-chart]').innerHTML=`<svg viewBox="0 0 680 250" role="img" aria-label="${esc(c.metric.label)}，兩筆離散刊載均值與 SD；不是連續曲線"><title>${esc(reading(c.a))}；${esc(reading(c.b))}</title>${ticks.map(t=>`<path class="yl-grid" d="M${x(t)} 38V190"/><text class="yl-tick" x="${x(t)}" y="231" text-anchor="middle">${fmt(t)}</text>`).join('')}<path class="yl-axis" d="M${start} 193H${end}"/>${groups.map(([key,r,y])=>`<g data-yl-observation="${key}"><text class="yl-series-label" x="43" y="${y+8}">${key.toUpperCase()}</text><path class="yl-error" data-yl-error="${key}" d="M${x(r.mean-r.sd)} ${y}H${x(r.mean+r.sd)}M${x(r.mean-r.sd)} ${y-12}V${y+12}M${x(r.mean+r.sd)} ${y-12}V${y+12}"/>${marker(x(r.mean),y,key)}</g>`).join('')}</svg>`;
    for(const [key,r] of groups){text(`[data-yl-reading-label="${key}"]`,`${key.toUpperCase()} · ${r.label}`);text(`[data-yl-reading-value="${key}"]`,`${r.meanText} ± ${r.sdText}${r.metricId==='ph'?'':' %'}`);text(`[data-yl-reading-meta="${key}"]`,`mean ± SD；原表字母 ${r.letters}`);}
    text('[data-yl-caption]',`${unit(c.metric)} · 固定軸 ${fmt(min)}–${fmt(max)}${min!==0?'，起點不是 0':''}。圓點 A、菱形 B；短線為 SD。`);
  }
  function render() {
    if(disposed||!data)return;
    syncDraft();syncPanels();
    text('[data-yl-evidence-label]',step==='cause'?'原理示意 · 自己選產物':step==='evidence'?'已發表觀測 · Foods 2019 Table 3':'自己的解釋 · 對照證據範圍');text('[data-yl-heading]',HEADINGS[step]);
    for(const node of $$('[data-yl-step]'))node.setAttribute('aria-pressed',String(node.dataset.ylStep===step));
    for(const node of $$('[data-yl-panel]'))node.hidden=node.dataset.ylPanel!==step;
    const reaction=reactionStates.get(reactionId),v=evaluateYogurtProducts(reactionId,reaction.counts);
    control('reaction').value=reactionId;for(const node of $$('[data-yl-product]'))node.value=String(reaction.counts[node.dataset.ylProduct]);
    text('[data-yl-reaction-equation]',v.equationText);text('[data-yl-carbon]',`左側 ${v.atomsIn.C} C → 右側 ${v.atomsOut.C} C`);text('[data-yl-reaction-scope]',v.scope);
    action('cause-check').disabled=!reaction.touched;text('[data-yl-cause-feedback]',reaction.checked?v.feedback:reaction.reference?'參考已展開；你的產物選擇沒有被代填。':'');
    $('[data-yl-cause-reference]').hidden=!(reaction.checked||reaction.reference);text('[data-yl-cause-reference]',reaction.checked||reaction.reference?v.referenceText:'');
    for(const node of $$('[data-yl-mode]'))node.setAttribute('aria-pressed',String(node.dataset.ylMode===selection.mode));
    for(const node of $$('[data-yl-treatment-control]'))node.hidden=selection.mode!=='treatment';for(const node of $$('[data-yl-storage-control]'))node.hidden=selection.mode!=='storage';
    for(const key of Object.keys(selection))if(control(key))control(key).value=String(selection[key]);
    const c=compareYogurtRecords(data,selection);draw(c);text('[data-yl-condition]',timing());text('[data-yl-metric-definition]',c.metric.definition);
    for(const node of $$('[data-yl-relation]'))node.setAttribute('aria-pressed',String(node.dataset.ylRelation===evidence.choice));
    action('evidence-check').disabled=!evidence.choice;
    text('[data-yl-evidence-feedback]',evidence.checked?`${evidence.choice===c.relation?'讀数與刊載均值相符。':'再對照 A、B 的刊載均值。'}${c.sameRecord?' A、B 是同一筆觀測，不能當獨立比較。':''}`:evidence.reference?'差值與界線已展開；不代表已自行作答。':c.sameRecord?'A、B 目前選到同一筆觀測，並非兩份獨立資料。':'');
    $('[data-yl-difference]').hidden=!(evidence.checked||evidence.reference);text('[data-yl-difference]',evidence.checked||evidence.reference?`B − A = ${deltaText(c)} ${c.deltaUnit}。${c.note}`:'');
    text('[data-yl-table-caption]',`Table 3 · ${unit(c.metric)} · mean ± SD（統計字母）`);
    $('[data-yl-table]').innerHTML=data.treatments.map(t=>`<tr><th scope="row">${esc(t.label)}</th>${data.conditions.days.map(day=>{const r=data.observations.find(x=>x.treatmentId===t.id&&x.day===day&&x.metricId===selection.metricId);return `<td>${esc(r.meanText)} ± ${esc(r.sdText)} (${esc(r.letters)})</td>`;}).join('')}</tr>`).join('');
    if(control('draft').value!==writing.draft)control('draft').value=writing.draft;control('draft').readOnly=writing.retained;if(control('revision').value!==writing.revision)control('revision').value=writing.revision;control('claim').value=claimId;
    text('[data-yl-writing-evidence]',viewedData?`目前已看：${unit(c.metric)}；A ${reading(c.a)}；B ${reading(c.b)}`:'尚未查看原表觀測。你可先留下想法，再回第二步對照。');
    $('[data-yl-initial-editor]').hidden=writing.retained;$('[data-yl-initial-archive]').hidden=!writing.retained;action('retain').disabled=!writing.draft.trim();
    text('[data-yl-draft-timing]',writing.draft?`這份文字最後修改時：${contextText(writing.context)}`:`目前：${contextText(context())}`);text('[data-yl-original]',writing.initial);text('[data-yl-original-timing]',`保留初稿時：${contextText(writing.initialContext)}`);
    const claim=YOGURT_CLAIMS.find(x=>x.id===claimId),draft=claims.get(claimId);text('[data-yl-claim]',claim.text);
    for(const node of $$('[data-yl-judgment]'))node.setAttribute('aria-pressed',String(node.dataset.ylJudgment===draft.choice));action('claim-check').disabled=!draft.choice;
    text('[data-yl-claim-feedback]',draft.checked?`${evaluateYogurtClaim(claimId,draft.choice).correct?'這句判斷符合證據範圍。':'這句判斷需要調整。'} ${claim.explanation}`:draft.reference?`參考：${claim.explanation}`:'');
    text('[data-yl-writing-status]',state.writingStatus);text('[data-yl-structure-status]',state.structureStatus);
    action('previous').disabled=step===STEPS[0];action('next').disabled=step===STEPS.at(-1);drawJournal();
  }
  function move(next) {if(!STEPS.includes(next)||next===step)return;step=next;visited.add(step);if(step==='evidence')viewedData=true;changed();render();$('[data-yl-heading]').focus({preventScroll:true});$('[data-yl-heading]').scrollIntoView?.({block:'nearest',behavior:'instant'});}
  function selectionChanged() {invalidate(evidence);for(const draft of claims.values())invalidate(draft);changed();state.writingStatus='觀測選擇已改變；草稿保留，請重新核對解釋。';render();}
  function onChange(event) {
    if(disposed||!data||!container.contains(event.target))return;const node=event.target,key=node.dataset?.ylControl,value=node.value;
    if(node.hasAttribute('data-yl-review')){state.review=state.savedVersions.some((_,i)=>value==='saved-'+(i+1))?value:'';drawJournal();return;}
    if(node.dataset?.ylProduct&&step==='cause') {const product=node.dataset.ylProduct;if(!YOGURT_PRODUCTS.some(p=>p.id===product)||! /^[0-4]$/.test(value)){render();return;}const state=reactionStates.get(reactionId);state.counts[product]=Number(value);state.touched=true;invalidate(state);}
    else if(key==='reaction'&&step==='cause'&&reactionStates.has(value))reactionId=value;
    else if(key==='claim'&&step==='explain'&&claims.has(value))claimId=value;
    else if(step==='evidence'&&['metricId','day','treatmentA','treatmentB','treatmentId','dayA','dayB'].includes(key)) {
      if(selection.mode==='treatment'&&['treatmentId','dayA','dayB'].includes(key)||selection.mode==='storage'&&['day','treatmentA','treatmentB'].includes(key))return;
      const next={...selection,[key]:key.startsWith('day')?Number(value):value};
      if(key.startsWith('day')&&!['0','10','21'].includes(value)){render();return;}
      try{compareYogurtRecords(data,next);}catch{render();return;}Object.assign(selection,next);selectionChanged();return;
    }else return;changed();render();
  }
  function onInput(event) {
    if(disposed||!data||step!=='explain'||!container.contains(event.target))return;const key=event.target.dataset?.ylControl;
    if(key==='draft'&&!writing.retained){writing.draft=event.target.value;writing.context=context();}
    else if(key==='revision'){writing.revision=event.target.value;claims.get(claimId).reference=false;}
    else return;changed();state.writingStatus='';render();
  }
  function onClick(event) {
    if(disposed||!data)return;const node=event.target?.closest?.('button');if(!node||!container.contains(node)||node.disabled)return;
    if(node.dataset.ylStep){move(node.dataset.ylStep);return;}
    if(node.dataset.ylMode&&step==='evidence'){if(!['treatment','storage'].includes(node.dataset.ylMode)||node.dataset.ylMode===selection.mode)return;selection.mode=node.dataset.ylMode;selectionChanged();return;}
    if(node.dataset.ylRelation&&step==='evidence'&&Object.hasOwn(RELATIONS,node.dataset.ylRelation)){evidence.choice=node.dataset.ylRelation;invalidate(evidence);}
    else if(node.dataset.ylJudgment&&step==='explain'&&Object.hasOwn(JUDGMENTS,node.dataset.ylJudgment)){const draft=claims.get(claimId);draft.choice=node.dataset.ylJudgment;invalidate(draft);}
    else {
      const name=node.dataset.ylAction;
      if(name==='previous'||name==='next'){move(STEPS[STEPS.indexOf(step)+(name==='next'?1:-1)]);return;}
      if(name==='select-summary'){$('[data-yl-summary]').focus();$('[data-yl-summary]').select?.();return;}
      if(name==='save'&&typeof onSaveSummary==='function'){save();return;}
      if(name==='structure'&&step==='cause'&&typeof onOpenStructure==='function'){try{onOpenStructure();}catch{state.structureStatus='結構工具目前無法開啟；本頁操作仍保留。';text('[data-yl-structure-status]',state.structureStatus);}return;}
      if(name==='cause-check'&&step==='cause'){const state=reactionStates.get(reactionId);if(!state.touched)return;state.checked=true;state.seen=true;}
      else if(name==='cause-reference'&&step==='cause'){const state=reactionStates.get(reactionId);state.reference=true;state.seen=true;}
      else if(name==='cause-reset'&&step==='cause'){const state=reactionStates.get(reactionId);state.counts=Object.fromEntries(YOGURT_PRODUCTS.map(p=>[p.id,0]));state.touched=false;invalidate(state);}
      else if(name==='evidence-check'&&step==='evidence'&&evidence.choice){evidence.checked=true;evidence.seen=true;}
      else if(name==='evidence-reference'&&step==='evidence'){evidence.reference=true;evidence.seen=true;}
      else if(name==='claim-check'&&step==='explain'&&claims.get(claimId).choice){const state=claims.get(claimId);state.checked=true;state.seen=true;}
      else if(name==='claim-reference'&&step==='explain'){const state=claims.get(claimId);state.reference=true;state.seen=true;}
      else if(name==='retain'&&step==='explain'&&!writing.retained&&writing.draft.trim()){writing.initial=writing.draft;writing.initialContext=Object.freeze(context());writing.retained=true;state.writingStatus='初稿已保留；接著檢查命題或寫下修訂。';changed();render();$('[data-yl-claim-heading]').focus({preventScroll:true});$('[data-yl-claim-heading]').scrollIntoView?.({block:'nearest',behavior:'instant'});return;}
      else return;
    }
    changed();render();
  }
  container.addEventListener('change',onChange);container.addEventListener('input',onInput);container.addEventListener('click',onClick);
  const ready=(async()=>{try{const response=await fetcher('./data/yogurt-fermented-milk-measurements.json',{signal:abort.signal});if(disposed)return;if(!response.ok)throw new Error('Missing published data');const loaded=await response.json();if(disposed)return;data=validateYogurtData(loaded);build();}catch{if(!disposed){data=null;container.innerHTML='<p role="alert">發酵乳資料無法載入或格式不完整。請重新整理；目前沒有用示意數字代替原表觀測。</p>';}}})();
  const dispose=()=>{if(disposed)return;syncDraft();syncPanels();disposed=true;state.views.delete(drawJournal);for(const key of detailKeys){const panel=$('[data-yl-details="'+key+'"]');if(panel)panel.ontoggle=null;}abort.abort();container.removeEventListener('change',onChange);container.removeEventListener('input',onInput);container.removeEventListener('click',onClick);};dispose.ready=ready;return dispose;
}
