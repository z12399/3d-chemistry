import {escapeHTML as esc} from './storage.js';
import {SOY_FERMENTATION_LAB_ID,validateSoyFermentationData,compareSoyFermentation} from './soy-fermentation-model.js';

export {SOY_FERMENTATION_LAB_ID} from './soy-fermentation-model.js';
const drafts=new WeakMap();
let sequence=0;
const predictionChoices=[['mixed-highest','混合最高'],['mixed-not-highest','混合非最高'],['reserve','先保留']];
const categories=[['hydrolysis','酵素作用'],['metabolism','微生物代謝'],['separation','物理分離']];
const treatmentLabels={NT:'未額外接種',LA:'額外乳酸菌',YE:'額外酵母',LY:'額外混合接種'};
const measurements=[
  {id:'absolute-counts',label:'菌株別絕對量',note:'分辨各菌株的數量變化；菌量本身仍不能直接給出代謝通量。'},
  {id:'time-series',label:'底物與產物時間序列',note:'比較變化先後與累積；仍需量測回收率、相分配與其他產物，不能只靠終點峰面積閉合物料帳。'},
  {id:'controlled-ph',label:'受控 pH 與獨立批次',note:'讓其他條件可比並增加獨立發酵批次，以檢查 pH 這個候選解釋；這份原表沒有提供這項對照結果。'},
  {id:'inoculation-order',label:'接種時序與獨立批次',note:'增加獨立批次並比較接種順序；這是候選機制的後續檢驗，不是本研究已量到的時序效應。'},
  {id:'phase-sampling',label:'固液分配與取樣',note:'比較液相、固相及取樣位置；清液濃度不能直接當全槽總庫存。'},
  {id:'calibration-sensory',label:'校正濃度與感官比較',note:'分別量測可比的濃度與適當設計的感官結果；峰面積較大不能取代偏好或風味強度的量測。'},
];
const freshWriting=()=>({prediction:'',revision:'',measurement:'',reason:''});
const freshCursor=()=>({observationCount:0,cases:{},pending:freshWriting(),sourceOpened:[],sources:{},datasets:{},batches:0});
const fresh=()=>({mode:'process',example:'lee2013',stage:null,processAction:null,method:'spme',compoundCode:'ac01',cases:{},activeKey:'pending',pending:freshWriting(),sourceOpened:[],sourceSnapshot:[],datasetSnapshot:null,observations:[],saveCursor:freshCursor(),event:0});
const clone=value=>structuredClone(value);
const choiceLabel=value=>predictionChoices.find(([id])=>id===value)?.[1]||'未預測';
const categoryLabel=value=>categories.find(([id])=>id===value)?.[1]||'未作答';
const fmt=value=>Number(Number(value).toPrecision(3)).toLocaleString('en-US',{maximumFractionDigits:8,useGrouping:false});
const sourceLink=source=>{
  try{const url=new URL(source.url);if(url.protocol==='https:'&&!url.username&&!url.password)return `<a href="${esc(url.href)}" data-sf-source="${esc(source.id)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>`;}catch{}
  return esc(source.title);
};
const cellText=cell=>`${cell.treatment}：${cell.status==='not-detected'?'ND':`${cell.printedMean} ± ${cell.printedSd}（SD）`}；作者字母 ${cell.publishedLetters}`;

function plot(comparison,prefix){
  const {row,cells}=comparison;
  const max=Math.max(...cells.filter(cell=>cell.status==='reported').map(cell=>cell.mean+cell.sd));
  const upper=max>0?max*1.25:1,base=270,plotHeight=205,y=value=>base-value/upper*plotHeight;
  const ticks=Array.from({length:5},(_,index)=>upper*index/4);
  const bars=cells.map((cell,index)=>{
    const x=150+index*180;
    if(cell.status==='not-detected')return `<g class="sf-series-${index}"><text x="${x}" y="220" class="sf-nd">ND</text><text x="${x}" y="242" class="sf-letter">作者字母 ${esc(cell.publishedLetters)}</text><text x="${x}" y="302" class="sf-treatment">${cell.treatment}</text><text x="${x}" y="326" class="sf-treatment-note">${treatmentLabels[cell.treatment]}</text></g>`;
    const low=cell.mean-cell.sd,high=cell.mean+cell.sd;
    return `<g class="sf-series-${index}"><rect class="sf-bar" x="${x-42}" y="${y(cell.mean)}" width="84" height="${base-y(cell.mean)}"/><path class="sf-error" d="M${x},${y(low)} V${y(high)} M${x-9},${y(low)} H${x+9} M${x-9},${y(high)} H${x+9}"/><text x="${x}" y="${y(high)-30}" class="sf-value">${esc(cell.printedMean)} ± ${esc(cell.printedSd)}</text><text x="${x}" y="${y(high)-10}" class="sf-letter">${esc(cell.publishedLetters)}</text><text x="${x}" y="302" class="sf-treatment">${cell.treatment}</text><text x="${x}" y="326" class="sf-treatment-note">${treatmentLabels[cell.treatment]}</text></g>`;
  }).join('');
  return `<figure class="sf-chart" aria-labelledby="${prefix}-chart-title"><figcaption id="${prefix}-chart-title">${esc(row.label)} <span>對內標峰面積比（無因次）</span></figcaption><p class="sf-chart-note">柱：刊載均值　線：SD　小寫字母：作者比較分組</p><svg viewBox="0 0 840 350" role="img" aria-labelledby="${prefix}-plot-title ${prefix}-plot-description"><title id="${prefix}-plot-title">${esc(row.label)}的四個額外接種處理</title><desc id="${prefix}-plot-description">${esc(cells.map(cellText).join('；'))}。ND 未檢出，不是零。SD 為萃取重複的刊載值。</desc>${ticks.map(value=>`<g class="sf-tick"><line x1="62" x2="810" y1="${y(value)}" y2="${y(value)}"/><text x="51" y="${y(value)+5}">${fmt(value)}</text></g>`).join('')}${bars}</svg></figure>`;
}

function comparisonReading(comparison){
  const reported=comparison.cells.filter(cell=>cell.status==='reported');
  const highest=Math.max(...reported.map(cell=>cell.mean));
  const leaders=reported.filter(cell=>cell.mean===highest).map(cell=>cell.treatment);
  if(!comparison.ranking.complete)return `已報數值中 ${leaders.join('、')} 的均值最大；有 ND，四組排序不完整，不判預測對錯。`;
  const mixed=comparison.cells.find(cell=>cell.treatment==='LY');
  if(mixed.mean===highest)return `LY 的刊載均值${leaders.length>1?'並列':''}最高；此處比較均值，不把它當作風味最佳或機制證明。`;
  return `${leaders.join('、')} 的刊載均值${leaders.length>1?'並列':''}最高，LY 不是最高；均值排序與作者字母分組分開判讀。`;
}

/** Source-bound process actions and published signals, with explicit reveal history. */
export function mountSoyFermentationLab(root,id=SOY_FERMENTATION_LAB_ID,{draftOwner,onSaveSummary,fetcher=globalThis.fetch}={}){
  if(id!==SOY_FERMENTATION_LAB_ID)throw new RangeError('Unknown soy fermentation activity');
  if(!root||typeof root.querySelector!=='function'||typeof root.addEventListener!=='function')throw new TypeError('A DOM container is required');
  const owned=draftOwner&&typeof draftOwner==='object';
  if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,fresh());
  const draft=owned?drafts.get(draftOwner):fresh(),prefix=`soy-fermentation-${++sequence}`;
  const $=selector=>root.querySelector(selector),field=name=>$(`[data-sf-${name}]`),action=name=>$(`[data-sf-action="${name}"]`);
  let data=null,disposed=false,epoch=0,aborter=null,feedback='',saveStatus='';

  root.innerHTML=`<section class="soy-fermentation-lab" aria-labelledby="${prefix}-title"><h2 id="${prefix}-title" class="sf-sr-only">醬油：製程、接種與量測</h2>
    <div class="sf-topbar"><div class="sf-modes" role="group" aria-label="工作台模式"><button type="button" data-sf-mode="process" aria-pressed="true" disabled>製程與作用</button><button type="button" data-sf-mode="evidence" aria-pressed="false" disabled>接種與讀值</button></div><p class="sf-identity" data-sf-identity>研究與製造者示例分開讀取</p></div>
    <p class="sf-load-status" role="status" data-sf-load-status>正在核對醬油來源資料…</p><button type="button" data-sf-action="retry" hidden>重試讀取資料</button>
    <div data-sf-ready hidden>
      <section data-sf-process-panel><div class="sf-controls"><label for="${prefix}-example">流程來源<select id="${prefix}-example" data-sf-example></select></label></div><nav class="sf-process-flow" data-sf-flow aria-label="製程階段"></nav><p class="sf-process-note" data-sf-process-note></p>
        <div class="sf-stage"><div class="sf-stage-heading"><h3 data-sf-stage-title></h3><span data-sf-stage-state></span></div><p data-sf-stage-summary></p><label class="sf-action-field" for="${prefix}-process-action" data-sf-action-field>看哪個作用<select id="${prefix}-process-action" data-sf-process-action></select></label><p class="sf-arrow-label" data-sf-arrow-label></p><div class="sf-classification" data-sf-classification><p data-sf-classification-prompt>這個作用屬於哪一類？</p><div class="sf-choice-row" role="group" aria-label="判斷作用類別">${categories.map(([value,label])=>`<button type="button" data-sf-category="${value}" aria-pressed="false">${label}</button>`).join('')}<button type="button" data-sf-action="answer">查看解答</button></div></div><p class="sf-answer" role="status" data-sf-answer></p></div>
      </section>
      <section data-sf-evidence-panel hidden><div class="sf-controls"><label for="${prefix}-method">萃取方法<select id="${prefix}-method" data-sf-method></select></label><label for="${prefix}-compound">化合物<select id="${prefix}-compound" data-sf-compound></select></label></div><p class="sf-prediction-prompt" data-sf-prediction-prompt>按刊載均值比較，混合接種 LY 會最高嗎？</p><div class="sf-choice-row sf-prediction-row" role="group" aria-label="揭示前的選擇">${predictionChoices.map(([value,label])=>`<button type="button" data-sf-prediction="${value}" aria-pressed="false">${label}</button>`).join('')}<button type="button" class="sf-primary" data-sf-action="reveal">直接揭示</button></div><div data-sf-chart></div><p class="sf-reading" data-sf-reading></p><p class="sf-row-identity" data-sf-row-identity></p><p class="sf-small">NT 未額外接種，仍有背景微生物。只比較同方法、同化合物；數值不代表菌量或感官強度。</p></section>
      <div class="sf-record-row"><button type="button" class="sf-primary" data-sf-action="record">記下這次觀察</button><p class="sf-feedback" role="status" data-sf-feedback></p></div>
    </div>
    <details class="sf-details" data-sf-writing-details><summary>修訂與下一項量測</summary><p class="sf-small" data-sf-writing-context>資料尚未載入，可以先保留文字。</p><div class="sf-writing-grid"><label for="${prefix}-prediction">我原先的理由<textarea id="${prefix}-prediction" data-sf-prediction-text rows="3" maxlength="900" placeholder="我預期這樣的原因是…"></textarea></label><label for="${prefix}-revision">讀值或解答後的修訂<textarea id="${prefix}-revision" data-sf-revision rows="3" maxlength="1200" placeholder="哪項證據讓我修正？目前還不能說什麼？"></textarea></label></div><label class="sf-measurement-field" for="${prefix}-measurement">我提出的後續設計<select id="${prefix}-measurement" data-sf-measurement><option value="">先不選</option>${measurements.map(item=>`<option value="${item.id}">${item.label}</option>`).join('')}</select></label><p class="sf-small" data-sf-measurement-note>選擇要補的證據，並寫下它能區分哪兩個解釋。這裡沒有新增實測結果。</p><label for="${prefix}-reason">為什麼需要這項量測？<textarea id="${prefix}-reason" data-sf-reason rows="3" maxlength="1000"></textarea></label><button type="button" data-sf-action="record-writing" disabled>連同目前文字記下</button></details>
    <details class="sf-details" data-sf-records-details><summary>已記錄的觀察 <span data-sf-count>0 / 32</span></summary><div data-sf-records></div></details>
    <details class="sf-details" data-sf-summary-details><summary>檢查並保存摘要</summary><label for="${prefix}-summary">完整摘要：來源、初次選擇、讀值與修訂<textarea id="${prefix}-summary" data-sf-summary rows="9" readonly></textarea></label><button type="button" data-sf-action="copy">選取完整摘要</button><label for="${prefix}-append-preview">本次附加內容：尚未保存的觀察與變更<textarea id="${prefix}-append-preview" data-sf-append-preview rows="7" readonly></textarea></label><p class="sf-small" data-sf-append-status></p><div class="sf-choice-row"><button type="button" data-sf-action="copy-append">選取本次附加內容</button>${typeof onSaveSummary==='function'?'<button type="button" class="sf-primary" data-sf-action="save" disabled>附加到本課筆記</button>':''}</div><p class="sf-save-status" role="status" data-sf-save-status></p><p class="sf-small">只在確認成功後才標記已附加；失敗時可保留相同內容重試。課筆記合計上限 10,000 字，超限請先複製並整理筆記。同課返回可延續；重新整理前請保存或複製。</p></details>
    <details class="sf-details" data-sf-source-panel hidden><summary>研究條件與來源</summary><div data-sf-study></div><div data-sf-treatments></div><p>圖上的小寫字母是作者比較分組；鑑定碼 A／C 另列。SD 和 n=3 對應萃取重複，獨立發酵批次數未交代。同字母不證明相等。原表註腳寫八組，但表內只有四處理；保留這項疑點，未重算顯著性。</p><ul class="sf-sources" data-sf-sources></ul><ul class="sf-limits" data-sf-limits></ul></details>
  </section>`;

  const datasetKey=()=>`${data.schema}:${data.provenance?.sourceAudit?.sha256||data.sources[0].snapshot.sha256}`;
  const currentComparison=()=>compareSoyFermentation(data,{method:draft.method,compoundCode:draft.compoundCode});
  const currentProcess=()=>{
    const example=data.processExamples.find(item=>item.id===draft.example);
    const stage=example.stages.find(item=>item.id===draft.stage);
    return {example,stage,item:stage.actions.find(item=>item.id===draft.processAction)};
  };
  const activeCase=()=>draft.cases[draft.activeKey]||null;
  const writing=()=>activeCase()?.writing||draft.pending;
  function selectCase(key,context){
    if(!draft.cases[key]){
      draft.cases[key]={context:clone(context),choice:null,everSeen:false,firstReveal:null,writing:freshWriting()};
      if(draft.activeKey==='pending'){draft.cases[key].writing=clone(draft.pending);draft.pending=freshWriting();}
    }
    draft.activeKey=key;
  }
  function normalizeControls(){
    if(!data.processExamples.some(item=>item.id===draft.example))draft.example=data.processExamples[0].id;
    const example=data.processExamples.find(item=>item.id===draft.example);
    if(!example.stages.some(item=>item.id===draft.stage))draft.stage=example.stages[0].id;
    const stage=example.stages.find(item=>item.id===draft.stage);
    if(!stage.actions.some(item=>item.id===draft.processAction))draft.processAction=stage.actions[0].id;
    if(!data.methods.some(item=>item.id===draft.method))draft.method=data.methods[0].id;
    const rows=data.rows.filter(row=>row.method===draft.method);
    if(!rows.some(row=>row.compoundCode===draft.compoundCode))draft.compoundCode=rows[0].compoundCode;
  }
  function firstReveal(item){
    if(item.everSeen)return;
    item.firstReveal={choice:item.choice,prediction:item.writing.prediction,event:++draft.event,sourceOpened:[...draft.sourceOpened]};
    item.everSeen=true;
  }
  function drawProcess(){
    const {example,stage,item}=currentProcess();
    selectCase(`${datasetKey()}:action:${example.id}:${stage.id}:${item.id}`,{kind:'process',title:`${example.label} · ${stage.label} · ${item.label}`,exampleId:example.id,stageId:stage.id,actionId:item.id,sourceRefs:[...new Set([...example.sourceRefs,...stage.sourceRefs,...item.sourceRefs])]});
    const entry=activeCase(),classifiable=categories.some(([value])=>value===item.type);
    field('example').innerHTML=data.processExamples.map(value=>`<option value="${esc(value.id)}">${esc(value.label)}</option>`).join('');field('example').value=example.id;
    field('flow').innerHTML=example.stages.map((value,index)=>`<button type="button" data-sf-stage="${esc(value.id)}" aria-pressed="${value.id===stage.id}"><span>${index+1}</span>${esc(value.label)}</button>`).join('');
    field('process-note').textContent=example.note;field('stage-title').textContent=stage.label;field('stage-state').textContent=stage.state;field('stage-summary').textContent=stage.summary;
    field('process-action').innerHTML=stage.actions.map(value=>`<option value="${esc(value.id)}">${esc(value.label)}</option>`).join('');field('process-action').value=item.id;field('action-field').hidden=stage.actions.length<2;field('arrow-label').hidden=stage.actions.length>1;field('arrow-label').textContent=item.label;
    field('classification').hidden=!classifiable;
    field('classification-prompt').textContent=entry.everSeen?'已看解答；現在可修訂分類。':'判斷目前這個作用；同階段可並行多種作用。';
    root.querySelectorAll('[data-sf-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sfCategory===entry.choice)));
    action('answer').disabled=entry.everSeen;
    if(!classifiable)field('answer').textContent=`${data.actionTypes.find(type=>type.id===item.type).label}。${item.explanation}`;
    else field('answer').textContent=entry.everSeen?`初次選擇：${categoryLabel(entry.firstReveal.choice)}。來源對應：${categoryLabel(item.type)}。${item.explanation}`:'';
    field('identity').textContent=example.kind==='research-method'?'Lee 2013 · 四處理研究的製程':'製造者日本式示例 · 沒有四處理量測';
  }
  function drawEvidence(){
    const comparison=currentComparison(),{row}=comparison,method=data.methods.find(item=>item.id===draft.method);
    selectCase(`${datasetKey()}:row:${row.id}`,{kind:'evidence',title:`${method.label} · ${row.label}`,rowId:row.id,method:row.method,compoundCode:row.compoundCode,sourceRefs:[...row.sourceRefs]});
    const entry=activeCase();
    field('method').innerHTML=data.methods.map(item=>`<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('');field('method').value=draft.method;
    field('compound').innerHTML=data.rows.filter(item=>item.method===draft.method).map(item=>`<option value="${esc(item.compoundCode)}">${esc(item.label)}</option>`).join('');field('compound').value=draft.compoundCode;
    field('prediction-prompt').textContent=entry.everSeen?`本列已揭示。首次選擇：${choiceLabel(entry.firstReveal.choice)}；現在改選屬讀值後修訂。`:'按刊載均值比較，混合接種 LY 會最高嗎？';
    root.querySelectorAll('[data-sf-prediction]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sfPrediction===entry.choice)));
    action('reveal').disabled=entry.everSeen;action('reveal').textContent=entry.everSeen?'本列已揭示':entry.choice?'揭示本列':'直接揭示';
    field('chart').innerHTML=entry.everSeen?plot(comparison,prefix):'<div class="sf-unrevealed"><p>先選一個想法，或直接揭示四組讀值。</p><span>不作答也能繼續；這會記為未預測。</span></div>';
    field('reading').textContent=entry.everSeen?comparisonReading(comparison):'';
    field('row-identity').textContent=entry.everSeen?`Table ${row.sourceLocation.table} · ${row.id} · 鑑定碼 ${row.identificationCode}：${data.study.identificationCodes[row.identificationCode]}。內標：${method.internalStandard}。`:`${method.label} · Table ${row.sourceLocation.table} · ${row.label}`;
    field('identity').textContent='Lee 2013 · 發酵 3 個月終點 · 四個額外接種處理';
  }
  function drawWriting(){
    const value=writing(),entry=activeCase();
    field('prediction-text').value=value.prediction;field('revision').value=value.revision;field('measurement').value=value.measurement;field('reason').value=value.reason;
    field('writing-context').textContent=entry?`${entry.context.title}。${entry.everSeen?'已揭示；原先理由的首次快照會保留，後续編輯不改寫。':'目前尚未在此案例揭示。'}${draft.sourceOpened.length?'已開啟過來源連結，無法確認閱讀範圍。':''}`:'資料尚未載入，可以先保留文字。';
    field('measurement-note').textContent=measurements.find(item=>item.id===value.measurement)?.note||'選擇要補的證據，並寫下它能區分哪兩個解釋。這裡沒有新增實測結果。';
  }
  function writingText(value){
    const measure=measurements.find(item=>item.id===value.measurement);
    return [`原先理由：${value.prediction||'未填'}`,`修訂：${value.revision||'未填'}`,`我提出的後續設計：${measure?.label||'未選'}${measure?`（研究設計；${measure.note}）`:''}`,`量測理由：${value.reason||'未填'}`].join('\n');
  }
  function describeObservation(item,index){
    const lines=[`${index+1}. ${item.context.title}`,`案例：${item.caseKey}`,`來源：${item.sourceRefs.join('、')}`];
    if(item.kind==='evidence')lines.push(`量：對該方法內標峰面積比；${item.methodLabel}；內標 ${item.internalStandard}`,`鑑定碼 ${item.row.identificationCode}；Table ${item.row.sourceLocation.table}`, ...item.row.cells.map(cellText),item.reading);
    else lines.push(`流程身份：${item.exampleKind}；${item.stageSummary}`,`作用：${item.actionLabel}`,item.answer===null?'本次未揭示分類解答':`來源對應：${item.answer}；${item.explanation}`);
    const first=item.firstReveal;
    lines.push(first?`本案例首次揭示前：${item.kind==='evidence'?choiceLabel(first.choice):categoryLabel(first.choice)}；事件 ${first.event}；當時開啟來源連結 ${first.sourceOpened.length?'是':'否'}（不能證明真盲測）\n首次理由：${first.prediction||'未填'}`:'首次揭示：尚未發生或此作用不屬三類判斷',`記錄時選擇：${item.kind==='evidence'?choiceLabel(item.choice):categoryLabel(item.choice)}`,writingText(item.writing));
    return lines.join('\n');
  }
  function summary(){
    const sources=[...draft.sourceSnapshot,...draft.observations.flatMap(item=>item.sources)];
    const unique=[...new Map(sources.map(source=>[`${source.id}:${source.url}`,source])).values()];
    const caseDrafts=Object.values(draft.cases).filter(item=>item.choice||item.everSeen||Object.values(item.writing).some(Boolean));
    return ['醬油：製程、接種與量測','Lee 2013 實驗與製造者日本式示例分開；NT 不是無菌。',`已開啟來源連結：${draft.sourceOpened.join('、')||'無紀錄'}；這不是未接觸原文的盲測證明。`,`已記錄 ${draft.observations.length} 次觀察`,...draft.observations.map(describeObservation),'','目前各案例草稿（後續文字不改寫上述快照）',...caseDrafts.map(item=>`${item.context.title} [${item.context.rowId||item.context.actionId}]\n已揭示：${item.everSeen?'是':'否'}；當前選擇：${item.context.kind==='evidence'?choiceLabel(item.choice):categoryLabel(item.choice)}${item.firstReveal?`\n首次揭示前：${item.context.kind==='evidence'?choiceLabel(item.firstReveal.choice):categoryLabel(item.firstReveal.choice)}；首次理由：${item.firstReveal.prediction||'未填'}；事件 ${item.firstReveal.event}；當時曾開啟來源：${item.firstReveal.sourceOpened.join('、')||'無紀錄'}`:''}\n${writingText(item.writing)}`),...(Object.values(draft.pending).some(Boolean)?['尚未載入資料的文字',writingText(draft.pending)]:[]),'','讀值限同方法同化合物。ND 不是0；小寫字母是原作者分組，大寫碼是鑑定依據；SD/n=3 為萃取重複，發酵批次數未報。','終點訊號不直接識別菌量、通量、風味偏好或減鹽安全。下一項量測屬研究設計，沒有產生新的實測結果。',...unique.map(source=>`${source.id}：${source.title}\n${source.url}`)].join('\n');
  }
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const caseState=entry=>({context:clone(entry.context),choice:entry.choice,everSeen:entry.everSeen,firstReveal:clone(entry.firstReveal),writing:clone(entry.writing)});
  const observationState=item=>({context:clone(item.context),choice:item.choice,everSeen:!!item.firstReveal,firstReveal:clone(item.firstReveal),writing:clone(item.writing)});
  function firstRevealText(value,kind){
    if(!value)return '首次揭示：尚未發生或此作用不屬三類判斷';
    return `首次揭示前：${kind==='evidence'?choiceLabel(value.choice):categoryLabel(value.choice)}；事件 ${value.event}；當時已開來源：${value.sourceOpened.join('、')||'無紀錄'}\n首次理由：${value.prediction||'未填'}`;
  }
  function appendObservation(item,index){
    const lines=[`觀察 ${index+1} [${item.context.rowId||item.context.actionId}] ${item.context.title}`,`來源 ${item.sourceRefs.join('、')}`];
    if(item.kind==='evidence')lines.push(`Table ${item.row.sourceLocation.table}；鑑定 ${item.row.identificationCode}；內標 ${item.internalStandard}；量為峰面積比（無因次）`,...item.row.cells.map(cellText),item.reading);
    else lines.push(`流程 ${item.exampleKind}；${item.stageSummary}`,`作用：${item.actionLabel}`,item.answer===null?'未揭示分類解答':`來源對應：${item.answer}；${item.explanation}`);
    lines.push(firstRevealText(item.firstReveal,item.kind),`記錄時選擇：${item.kind==='evidence'?choiceLabel(item.choice):categoryLabel(item.choice)}`,writingText(item.writing));
    return lines.join('\n');
  }
  function caseDelta(entry,before){
    const lines=[`案例更新 [${entry.context.rowId||entry.context.actionId}] ${entry.context.title}`];
    if(!before)lines.push(`來源 ${entry.context.sourceRefs.join('、')}`);
    if(!before||before.everSeen!==entry.everSeen)lines.push(`已揭示：${entry.everSeen?'是':'否'}`);
    if(!before||!same(before.firstReveal,entry.firstReveal))lines.push(firstRevealText(entry.firstReveal,entry.context.kind));
    if(!before||before.choice!==entry.choice)lines.push(`目前選擇：${entry.context.kind==='evidence'?choiceLabel(entry.choice):categoryLabel(entry.choice)}`);
    const labels={prediction:'原先理由（目前文字）',revision:'修訂',measurement:'我提出的後續設計',reason:'量測理由'};
    for(const [key,label] of Object.entries(labels)){
      if(before&&before.writing[key]===entry.writing[key])continue;
      const raw=entry.writing[key],measurement=key==='measurement'?measurements.find(value=>value.id===raw):null;
      lines.push(`${label}：${measurement?`${measurement.label}（研究設計；${measurement.note}）`:raw||'未填／已清空'}`);
    }
    return lines.join('\n');
  }
  function appendPlan(){
    const cursor=draft.saveCursor,next=clone(cursor),blocks=[],newObservations=draft.observations.slice(cursor.observationCount);
    const represented=new Map(newObservations.map(item=>[item.caseKey,observationState(item)]));
    for(let index=cursor.observationCount;index<draft.observations.length;index++)blocks.push(appendObservation(draft.observations[index],index));
    next.observationCount=draft.observations.length;
    const meaningful=Object.entries(draft.cases).filter(([key,entry])=>cursor.cases[key]||entry.choice||entry.everSeen||Object.values(entry.writing).some(Boolean));
    for(const [key,entry] of meaningful){
      const current=caseState(entry);next.cases[key]=current;
      if(same(current,cursor.cases[key])||same(current,represented.get(key)))continue;
      blocks.push(caseDelta(current,cursor.cases[key]));
    }
    if(!same(draft.pending,cursor.pending)){blocks.push(`尚未載入資料的文字更新\n${writingText(draft.pending)}`);next.pending=clone(draft.pending);}
    const opened=draft.sourceOpened.filter(id=>!cursor.sourceOpened.includes(id));next.sourceOpened=[...draft.sourceOpened];
    if(opened.length)blocks.push(`本次新增來源連結紀錄：${opened.join('、')}。只記本工作台開啟行為，不能證明閱讀範圍或真盲測。`);
    const refs=new Set([...draft.observations.flatMap(item=>item.sourceRefs),...meaningful.flatMap(([,entry])=>entry.context.sourceRefs),...draft.sourceOpened]);
    const sourceBank=[...draft.observations.flatMap(item=>item.sources),...draft.sourceSnapshot];
    const sources=[...new Map(sourceBank.filter(source=>refs.has(source.id)).map(source=>[`${source.id}:${source.snapshot?.sha256||source.url}`,source])).values()];
    for(const source of sources){
      const key=`${source.id}:${source.snapshot?.sha256||source.url}`,signature=JSON.stringify(source);
      next.sources[key]=signature;if(cursor.sources[key]===signature)continue;
      blocks.push(`來源 ${source.id}：${source.title}\n${source.url}${source.doi?`\nDOI ${source.doi}`:''}\n出版／提供者：${source.publisher}\n定位：${source.locator}\n來源說明：${source.note}\n封存 ${source.snapshot?.path||'未提供'}（${source.snapshot?.kind||'未提供'}）；SHA-256 ${source.snapshot?.sha256||'未提供'}`);
    }
    const datasetBank=[...draft.observations.map(item=>item.dataset),draft.datasetSnapshot].filter(Boolean);
    const datasets=[...new Map(datasetBank.map(dataset=>[`${dataset.id}:${dataset.provenance?.sourceAudit?.sha256||dataset.schema}`,dataset])).values()];
    for(const dataset of datasets){
      const key=`${dataset.id}:${dataset.provenance?.sourceAudit?.sha256||dataset.schema}`,signature=JSON.stringify(dataset);
      if(next.datasets[key]===signature)continue;next.datasets[key]=signature;
      blocks.push(`資料身份 ${dataset.id}；${dataset.schema}\n來源轉錄 ${dataset.provenance?.sourceAudit?.path||'未提供'}；SHA-256 ${dataset.provenance?.sourceAudit?.sha256||'未提供'}\n來源凍結 ${dataset.provenance?.sourceFreeze?.path||'未提供'}；SHA-256 ${dataset.provenance?.sourceFreeze?.sha256||'未提供'}\n建置 ${dataset.provenance?.builtBy||'未提供'}；來源檔案已核對：${dataset.provenance?.allSourceFilesVerified===true?'是':'未確認'}`);
    }
    if(!blocks.length)return {text:'',next,newObservationCount:0};
    next.batches=cursor.batches+1;
    const boundary=cursor.batches===0?'Lee 實驗與製造者示例分開；NT 不是無菌。只比較同法同物的峰面積比。SD/n=3 是萃取重複，非三個獨立發酵批次；ND 不是0；作者小寫分組與大寫鑑定碼分開。同字母不證明相等。原表註腳稱 8 samples，與四處理欄不一致；保留疑點，未重算作者統計。首次只指本案例首次揭示，不能證明真盲測。終點訊號不證明菌量、機制、偏好或減鹽安全。後續量測屬自己提出的設計。':'本次為增量附加；前次觀察保留。讀值限同法同物，SD為萃取重複，ND不當0；新增設計未產生新實測值。';
    return {text:[`醬油工作台 · 第 ${next.batches} 次附加`,...blocks,boundary].join('\n\n'),next,newObservationCount:newObservations.length};
  }
  function drawSummary(){
    if(disposed)return;
    const plan=appendPlan();field('summary').value=summary();field('append-preview').value=plan.text;field('save-status').textContent=saveStatus;
    field('append-status').textContent=plan.text?`本次 ${plan.text.length.toLocaleString('en-US')} 字，新增 ${plan.newObservationCount} 份觀察及尚未保存的變更。保存按鈕只附加以上預覽；完整摘要仍可另行複製。`:'目前沒有尚未附加的變更；完整摘要仍可查看與複製。';
    action('copy-append').disabled=!plan.text;
    const save=action('save');if(save)save.disabled=!draft.observations.length||!plan.text;
  }
  function drawRecords(){
    field('count').textContent=`${draft.observations.length} / 32`;
    field('records').innerHTML=draft.observations.length?draft.observations.map((item,index)=>`<article class="sf-record"><h3>${index+1}. ${esc(item.context.title)}</h3><p>${esc(describeObservation(item,index).split('\n').slice(1).join('\n'))}</p></article>`).join(''):'<p>還沒有記錄；可以先探索流程，再比較一列讀值。</p>';
  }
  function draw(){
    if(disposed||!data)return;
    normalizeControls();field('process-panel').hidden=draft.mode!=='process';field('evidence-panel').hidden=draft.mode!=='evidence';
    root.querySelectorAll('[data-sf-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sfMode===draft.mode)));
    if(draft.mode==='process')drawProcess();else drawEvidence();
    const canRecord=draft.mode==='process'||activeCase().everSeen;
    action('record').disabled=!canRecord;action('record-writing').disabled=!canRecord;
    field('feedback').textContent=feedback;drawWriting();drawRecords();drawSummary();
  }
  function record(){
    if(disposed||!data)return;
    const entry=activeCase();if(!entry||(draft.mode==='evidence'&&!entry.everSeen))return;
    let candidate={kind:draft.mode,caseKey:draft.activeKey,context:clone(entry.context),choice:entry.choice,firstReveal:clone(entry.firstReveal),writing:clone(entry.writing),sourceOpened:[...draft.sourceOpened],dataset:{id:data.id,schema:data.schema,provenance:clone(data.provenance)}};
    if(draft.mode==='evidence'){
      const comparison=currentComparison(),method=data.methods.find(item=>item.id===draft.method);
      Object.assign(candidate,{row:clone(comparison.row),reading:comparisonReading(comparison),methodLabel:method.label,internalStandard:method.internalStandard,sourceRefs:[...comparison.sourceRefs]});
    }else{
      const {example,stage,item}=currentProcess(),show=entry.everSeen||!categories.some(([value])=>value===item.type);
      Object.assign(candidate,{exampleKind:example.kind,stageSummary:stage.summary,actionLabel:item.label,answer:show?data.actionTypes.find(type=>type.id===item.type).label:null,explanation:show?item.explanation:null,sourceRefs:[...new Set([...example.sourceRefs,...stage.sourceRefs,...item.sourceRefs])]});
    }
    candidate.sources=clone(data.sources.filter(source=>candidate.sourceRefs.includes(source.id)));
    if(draft.observations.some(item=>JSON.stringify(item)===JSON.stringify(candidate)))feedback='這份選擇、讀值與文字已記錄，沒有重複增加。';
    else if(draft.observations.length>=32)feedback='已保留 32 份快照，請先複製或保存摘要。現有紀錄不會被覆蓋。';
    else{draft.observations.push(clone(candidate));feedback=`已保留第 ${draft.observations.length} 份快照；後續操作不改寫。`;saveStatus='';}
    draw();
  }
  function click(event){
    if(disposed)return;
    const source=event.target.closest?.('[data-sf-source]');
    if(source&&root.contains(source)){
      const sourceId=source.dataset.sfSource;if(!draft.sourceOpened.includes(sourceId)){draft.sourceOpened.push(sourceId);saveStatus='';}
      drawWriting();drawSummary();return;
    }
    const button=event.target.closest?.('button');if(!button||!root.contains(button)||button.disabled)return;
    const name=button.dataset.sfAction;
    if(name==='retry'){load();return;}
    if(name==='copy'){field('summary').focus();field('summary').select();saveStatus='已選取摘要；按 Ctrl+C 複製。';drawSummary();return;}
    if(name==='copy-append'){field('append-preview').focus();field('append-preview').select();saveStatus='已選取本次附加內容；按 Ctrl+C 複製。';drawSummary();return;}
    if(name==='save'&&draft.observations.length&&typeof onSaveSummary==='function'){
      const plan=appendPlan();if(!plan.text)return;let saved=false,errorMessage='';
      if(plan.text.length>10000)errorMessage=`本次附加內容共 ${plan.text.length.toLocaleString('en-US')} 字，已超過本課筆記 10,000 字上限。`;
      else try{saved=onSaveSummary(plan.text)===true;}catch(error){errorMessage=error?.message||String(error);}
      if(saved)draft.saveCursor=plan.next;
      if(disposed)return;
      if(saved)saveStatus='本次預覽已附加到本課筆記；後續只附加新的觀察與修訂。';
      else saveStatus=`尚未保存。${errorMessage||'儲存端未確認成功。'} 未前移保存進度，也未截斷內容；請先複製完整摘要或本次附加內容，必要時整理本課筆記後重試。`;
      drawSummary();return;
    }
    if(!data)return;
    if(button.dataset.sfMode){if(!['process','evidence'].includes(button.dataset.sfMode))return;draft.mode=button.dataset.sfMode;feedback='';draw();return;}
    if(button.dataset.sfStage){const example=data.processExamples.find(item=>item.id===draft.example);if(!example.stages.some(item=>item.id===button.dataset.sfStage))return;draft.stage=button.dataset.sfStage;feedback='';draw();return;}
    const entry=activeCase();
    if(button.dataset.sfPrediction&&draft.mode==='evidence'){
      if(!predictionChoices.some(([value])=>value===button.dataset.sfPrediction))return;entry.choice=button.dataset.sfPrediction;saveStatus='';draw();return;
    }
    if(button.dataset.sfCategory&&draft.mode==='process'){
      if(!categories.some(([value])=>value===currentProcess().item.type)||!categories.some(([value])=>value===button.dataset.sfCategory))return;entry.choice=button.dataset.sfCategory;saveStatus='';draw();return;
    }
    if((name==='reveal'&&draft.mode==='evidence')||(name==='answer'&&draft.mode==='process'&&categories.some(([value])=>value===currentProcess().item.type))){firstReveal(entry);saveStatus='';draw();return;}
    if(name==='record'||name==='record-writing')record();
  }
  function change(event){
    if(disposed)return;const target=event.target;
    if(target===field('measurement')){if(!measurements.some(item=>item.id===target.value)&&target.value!=='')return;writing().measurement=target.value;saveStatus='';drawWriting();drawSummary();return;}
    if(!data)return;
    if(target===field('example')){if(!data.processExamples.some(item=>item.id===target.value))return;draft.example=target.value;}
    else if(target===field('process-action')){if(!currentProcess().stage.actions.some(item=>item.id===target.value))return;draft.processAction=target.value;}
    else if(target===field('method')){if(!data.methods.some(item=>item.id===target.value))return;draft.method=target.value;}
    else if(target===field('compound')){if(!data.rows.some(item=>item.method===draft.method&&item.compoundCode===target.value))return;draft.compoundCode=target.value;}
    else return;
    feedback='';saveStatus='';draw();
  }
  function input(event){
    if(disposed)return;const target=event.target,value=writing();
    if(target===field('prediction-text'))value.prediction=target.value.slice(0,900);
    else if(target===field('revision'))value.revision=target.value.slice(0,1200);
    else if(target===field('reason'))value.reason=target.value.slice(0,1000);
    else return;saveStatus='';drawSummary();
  }
  function drawSources(){
    const study=data.study;
    field('study').innerHTML=`<p>${esc(study.baseMaterial)} 製麴：${esc(study.koji.inoculated)}，${study.koji.durationHours} h。${esc(study.koji.backgroundMicroorganisms)}</p><p>加入的鹽液 ${study.brineAddition.printedSaltPercent}%；麴：鹽液 ${esc(study.brineAddition.printedKojiToBrineRatio)}，比例基準未說明。Table 1 四組樣品鹽 ${study.finalSampleSalt.value}${esc(study.finalSampleSalt.unit)}。${esc(study.moromiTemperatureNote)}</p><p>${esc(study.quantity)} ${esc(study.statistics.sameLettersMeaning)}</p>`;
    field('treatments').innerHTML=`<div class="sf-treatment-grid">${data.treatments.map(item=>`<article><h4>${esc(item.id)} · ${treatmentLabels[item.id]}</h4><p>${item.additionalInocula.length?item.additionalInocula.map(inoculum=>`${esc(inoculum.organism)} ${esc(inoculum.strainCode)}：${inoculum.initialCfuPerMl.toLocaleString('en-US')} CFU/mL`).join('<br>'):esc(item.meaning)}</p></article>`).join('')}</div>`;
    field('sources').innerHTML=data.sources.map(source=>`<li>${sourceLink(source)}<p>${esc(source.locator)}。${esc(source.note)}</p></li>`).join('');
    field('limits').innerHTML=data.limits.map(item=>`<li>${esc(item.rule)}</li>`).join('');
  }
  async function load(){
    if(disposed)return;const token=++epoch;aborter?.abort();aborter=new AbortController();data=null;
    field('ready').hidden=true;field('source-panel').hidden=true;field('chart').innerHTML='';action('record').disabled=true;action('record-writing').disabled=true;
    root.querySelectorAll('[data-sf-mode]').forEach(button=>button.disabled=true);field('load-status').textContent='正在核對醬油來源資料…';action('retry').hidden=true;drawWriting();drawRecords();drawSummary();
    try{
      const response=await fetcher(new URL('../data/soy-fermentation-evidence.json',import.meta.url),{signal:aborter.signal});
      if(!response.ok)throw new Error('Source response unavailable');
      const incoming=await response.json();if(disposed||token!==epoch)return;
      data=validateSoyFermentationData(incoming);draft.sourceSnapshot=clone(data.sources);draft.datasetSnapshot={id:data.id,schema:data.schema,provenance:clone(data.provenance)};normalizeControls();drawSources();
      field('ready').hidden=false;field('source-panel').hidden=false;field('load-status').textContent='';root.querySelectorAll('[data-sf-mode]').forEach(button=>button.disabled=false);draw();
    }catch(error){
      if(disposed||token!==epoch||error?.name==='AbortError')return;
      data=null;field('ready').hidden=true;field('source-panel').hidden=true;field('chart').innerHTML='';action('record').disabled=true;action('record-writing').disabled=true;root.querySelectorAll('[data-sf-mode]').forEach(button=>button.disabled=true);field('load-status').textContent='資料未能載入或核對，暫不顯示流程與讀值。可重試；文字、舊紀錄與摘要仍可查看、複製和保存。';action('retry').hidden=false;
    }
  }
  root.addEventListener('click',click);root.addEventListener('change',change);root.addEventListener('input',input);load();
  return()=>{if(disposed)return;disposed=true;epoch++;aborter?.abort();root.removeEventListener('click',click);root.removeEventListener('change',change);root.removeEventListener('input',input);};
}
