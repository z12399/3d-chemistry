import {
 MALTING_BEER_ID,MALTING_BEER_SOURCES,MALTING_BEER_CASES,MALTING_BEER_STAGES,
 MALTING_BEER_CONDITIONS,MALTING_BEER_POOLS,MALTING_BEER_ENZYMES,
 createMaltingBeerDraft,getMaltingBeerCase,getMaltingBeerTrial,setMaltingBeerControl,
 chooseMaltingBeerAnswer,canCheckMaltingBeer,checkMaltingBeer,currentMaltingBeerDiffers,
 illustrateMaltingAmylase,maltingBeerContextText,buildMaltingBeerSummary
} from './malting-beer-model.js';
import {createWorkbenchSessionStore,subscribeWorkbench,refreshWorkbenchFeedback,markWorkbenchChanged,saveWorkbenchSummary,escapeHtml as esc,textareaValue} from './workbench-session.js';
export {MALTING_BEER_ID} from './malting-beer-model.js';
const sessions=createWorkbenchSessionStore({createDraft:createMaltingBeerDraft,buildSummary:buildMaltingBeerSummary});
let instance=0;

export function mountMaltingBeerLab(container,id=MALTING_BEER_ID,options={}){
 if(id!==MALTING_BEER_ID)throw new RangeError('Unsupported malting/beer activity');
 if(!container||typeof container.querySelector!=='function')throw new TypeError('A DOM container is required');
 const {draftOwner,draftKey=id,onSaveSummary}=options,owner=draftOwner&&['object','function'].includes(typeof draftOwner)?draftOwner:container;
 const record=sessions.get(owner,draftKey),draft=record.draft,prefix=`mb-${++instance}`;let disposed=false;
 refreshWorkbenchFeedback(record);
 container.innerHTML=`<section class="malting-beer-lab" data-mb-lab aria-labelledby="${prefix}-title">
  <header><h3 id="${prefix}-title">從穀粒到麥汁，哪一段供應了什麼？</h3><p>選角色、改前提、追一次切割，再判斷麥汁資料能支持什麼。</p></header>
  <p class="mb-scope">這是原創有限概念鏈，沒有時間、溫度、配方或培養操作，也不計算真實糖量、酒精、品質或安全。</p>
  <label class="mb-task" for="${prefix}-case">推理任務<select id="${prefix}-case" data-mb-case>${MALTING_BEER_CASES.map(x=>`<option value="${x.id}">${esc(x.title)}</option>`).join('')}</select></label>
  <div class="mb-layout"><section class="mb-chain-panel" aria-label="材料與角色對照">
   <div data-mb-chain></div>
   <div class="mb-controls">
    <label data-mb-stage-control for="${prefix}-stage">要辨認的角色<select id="${prefix}-stage" data-mb-stage>${MALTING_BEER_STAGES.map(x=>`<option value="${x.id}">${esc(x.label)}</option>`).join('')}</select></label>
    <section data-mb-givens aria-label="只改一個給定前提">${MALTING_BEER_CONDITIONS.map(x=>`<label for="${prefix}-${x.id}">${esc(x.label)}<select id="${prefix}-${x.id}" data-mb-given="${x.id}"><option value="yes">是</option><option value="no">否／未給</option></select></label>`).join('')}<p>旗標是本題已給的資訊，不由麥色或乾燥名稱自動推定；模型只檢查這三個前提。</p></section>
    <section data-mb-enzyme-control><label for="${prefix}-enzyme">本課指定的一次作用<select id="${prefix}-enzyme" data-mb-enzyme>${MALTING_BEER_ENZYMES.map(x=>`<option value="${x.id}">${esc(x.label)}</option>`).join('')}</select></label><p class="mb-residue-chain">非還原端 G1 — G2 — G3 — G4 — G5 — G6 還原端<br>相鄰處均為α1→4鍵；G代表葡萄糖殘基，圖式不畫完整原子。</p><div data-mb-fragments></div></section>
    <label data-mb-pool-control for="${prefix}-pool">題目另給的物質池<select id="${prefix}-pool" data-mb-pool>${MALTING_BEER_POOLS.map(x=>`<option value="${x.id}">${esc(x.label)}</option>`).join('')}</select></label>
   </div>
  </section><section class="mb-stage" data-mb-stage-panel></section></div>
  <p class="mb-error" data-mb-error role="status"></p>
  <div class="mb-nav"><button type="button" data-mb-previous>上一項</button><button type="button" data-mb-next>下一項</button></div>
  <details data-mb-detail="synthesis"><summary>整合成自己的考試短答</summary><label for="${prefix}-synthesis">哪個角色改變哪個物件，哪些結論還缺證據？<textarea id="${prefix}-synthesis" data-mb-synthesis rows="4" maxlength="1600">${textareaValue(draft.synthesis)}</textarea></label></details>
  <details data-mb-detail="scope"><summary>來源、指定例子與推論界線</summary><p>主表是角色鏈，不是完整釀造程序。三個供糖旗標只檢查可及性、所選酵素能作用及環境相符；資料不足不等於實測轉化為零。麥汁組成與酵母利用另看相符資料。</p><p>切割例固定六個殘基，α一次指定切第3鍵，β一次從非還原端釋一個麥芽糖。這是給定拓撲示意，不是選位規則、真實六糖效率、完整原子／水收支或全部澱粉的分解模擬。</p>${MALTING_BEER_SOURCES.map(x=>`<p><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.label)} ↗</a><br>${esc(x.scope)}</p>`).join('')}</details>
  <details data-mb-detail="summary" data-mb-summary-detail><summary>複製目前完整摘要</summary><label for="${prefix}-summary">可手動選取複製的作答摘要<textarea id="${prefix}-summary" data-mb-summary readonly rows="8"></textarea></label><p>原筆記加上摘要超過10,000字時，請先複製，再整理筆記。內容不截斷；只重試不能突破原長度限制。</p></details>
  <div class="mb-save-row"><button type="button" data-mb-save>附加初答、核對與修訂到本課筆記</button><p data-mb-save-status role="status"></p></div>
  <p class="mb-small">七項任務共23個有限槽；切換角色或條件另留草稿，切回可看原核對。初答在首次核對時固定，修訂另存；自由文字未自動評分。草稿限本頁工作階段，成功附加的摘要才隨原筆記匯出，重新載入不重建未保存盤面。</p>
 </section>`;
 const root=container.querySelector('[data-mb-lab]'),$=selector=>root.querySelector(selector);
 const detailState=()=>root.querySelectorAll('[data-mb-detail]').forEach(n=>{draft.details[n.dataset.mbDetail]=n.open;});
 const restoreDetails=()=>root.querySelectorAll('[data-mb-detail]').forEach(n=>{n.open=Boolean(draft.details[n.dataset.mbDetail]);});
 function flushText(){const t=getMaltingBeerTrial(draft),reason=$('[data-mb-reason]'),revision=$('[data-mb-revision]');if(reason&&!t.checked)t.reason=reason.value;if(revision&&t.checked)t.revision=revision.value;draft.synthesis=$('[data-mb-synthesis]').value;}
 function updateSummary(){$('[data-mb-summary]').value=buildMaltingBeerSummary(draft);}
 function updateSave(){if(disposed)return;$('[data-mb-save]').disabled=Boolean(record.pending);$('[data-mb-save-status]').textContent=record.message;if(record.status==='failed'){$('[data-mb-summary-detail]').open=true;draft.details.summary=true;}}
 const changed=()=>{updateSummary();markWorkbenchChanged(record);};
 function renderControls(){
  $('[data-mb-case]').value=draft.caseId;$('[data-mb-stage]').value=draft.stageId;$('[data-mb-pool]').value=draft.poolId;$('[data-mb-enzyme]').value=draft.enzymeId;
  $('[data-mb-stage-control]').hidden=draft.caseId!=='role';$('[data-mb-givens]').hidden=draft.caseId!=='conversion';$('[data-mb-pool-control]').hidden=draft.caseId!=='pool';$('[data-mb-enzyme-control]').hidden=draft.caseId!=='enzyme';
  for(const item of MALTING_BEER_CONDITIONS)$(`[data-mb-given="${item.id}"]`).value=draft.conditions[item.id]?'yes':'no';
 }
 function renderChain(){
  const current=draft.caseId==='role'?draft.stageId:['pool'].includes(draft.caseId)?'fermentation':['conversion','enzyme','evidence'].includes(draft.caseId)?'mashing':draft.caseId==='separation'?'separation':null,trial=getMaltingBeerTrial(draft);
  $('[data-mb-chain]').innerHTML=`<div class="mb-table-scroll"><table><caption>選定角色的材料與作用；不是溫時操作清單</caption><thead><tr><th scope="col">角色</th><th scope="col">追蹤物件與目的</th></tr></thead><tbody>${MALTING_BEER_STAGES.map(item=>`<tr${item.id===current?' class="mb-current-row"':''}><th scope="row">${esc(item.label)}</th><td>${esc(item.input)}<br>${draft.caseId==='role'&&item.id===current&&!trial.checked?'先用右側選項判斷其目的，核對後再對照。':esc(item.purpose)}</td></tr>`).join('')}</tbody></table></div>`;
  const fragment=$('[data-mb-fragments]');fragment.hidden=!trial.checked||draft.caseId!=='enzyme';
  if(draft.caseId==='enzyme'&&trial.checked){const r=illustrateMaltingAmylase(draft.enzymeId);fragment.innerHTML=`<p class="mb-fragment-result">本課指定一次後：${r.fragments.map(part=>esc(part.join('—'))).join(' ＋ ')}<br>殘基數：6 → ${r.fragments.map(part=>part.length).join(' ＋ ')}；可發酵性仍未由本圖量測。</p>`;}else fragment.innerHTML='';
 }
 function updateCheck(){const t=getMaltingBeerTrial(draft);$('[data-mb-check]').disabled=!canCheckMaltingBeer(draft);const current=$('[data-mb-current-status]');if(current)current.textContent=currentMaltingBeerDiffers(draft)?'目前選項已改；上方仍是首次核對，不能當成目前答案已答對。':'目前選項與首次核對相同；自由文字修訂不自動評分。';}
 function feedbackHTML(t){const s=t.checkedSnapshot;if(!s)return '';return `<h4 data-mb-feedback-heading tabindex="-1">${s.correct?'首次核對：符合本題給定與界線。':'首次核對：需要修訂。'}</h4><p data-mb-choice-feedback>${esc(s.feedback)}</p><p>${esc(s.explanation)}</p><p data-mb-current-status></p><label for="${prefix}-revision">對照後的修訂<textarea id="${prefix}-revision" data-mb-revision rows="3" maxlength="900">${textareaValue(t.revision)}</textarea></label><details data-mb-detail="history"><summary>看初答與核對條件</summary><p>初答：${esc(getMaltingBeerCase(s.caseId).options.find(x=>x.id===s.choice)?.label||s.choice)}</p><p>${esc(maltingBeerContextText(s.context))}</p><p>核對前理由：${esc(s.reason||'未填')}</p></details>`;}
 function renderStage(){
  const item=getMaltingBeerCase(draft.caseId),t=getMaltingBeerTrial(draft),i=MALTING_BEER_CASES.findIndex(x=>x.id===item.id);
  renderControls();renderChain();$('[data-mb-previous]').disabled=i===0;$('[data-mb-next]').disabled=i===MALTING_BEER_CASES.length-1;
  $('[data-mb-stage-panel]').innerHTML=`<h4 id="${prefix}-question" data-mb-question tabindex="-1">${esc(item.prompt)}</h4><fieldset aria-labelledby="${prefix}-question"><legend>先選一個判讀</legend>${item.options.map(x=>`<label class="mb-choice"><input type="radio" name="${prefix}-${item.id}" data-mb-choice value="${x.id}"${t.choice===x.id?' checked':''}><span>${esc(x.label)}</span></label>`).join('')}</fieldset><label for="${prefix}-reason">核對前理由（選填）<textarea id="${prefix}-reason" data-mb-reason rows="3" maxlength="900"${t.checked?' readonly':''}>${textareaValue(t.reason)}</textarea></label><button type="button" data-mb-check${t.checked?' disabled':''}>${t.checked?'已保留首次核對':'保留初答並核對'}</button><section class="mb-feedback" data-mb-feedback aria-live="polite"${t.checked?'':' hidden'}>${feedbackHTML(t)}</section>`;
  $('[data-mb-error]').textContent='';restoreDetails();updateCheck();updateSummary();
 }
 function control(key,value){flushText();detailState();setMaltingBeerControl(draft,key,value);renderStage();changed();}
 const onInput=e=>{if(disposed)return;const t=getMaltingBeerTrial(draft),n=e.target;if(n.matches('[data-mb-reason]')&&!t.checked)t.reason=n.value;else if(n.matches('[data-mb-revision]')&&t.checked)t.revision=n.value;else if(n.matches('[data-mb-synthesis]'))draft.synthesis=n.value;else return;changed();};
 const onChange=e=>{
  if(disposed)return;const n=e.target;
  try{
   if(n.matches('[data-mb-choice]')){chooseMaltingBeerAnswer(draft,n.value);updateCheck();changed();return;}
   if(n.matches('[data-mb-case]'))control('caseId',n.value);
   else if(n.matches('[data-mb-stage]'))control('stageId',n.value);
   else if(n.matches('[data-mb-pool]'))control('poolId',n.value);
   else if(n.matches('[data-mb-enzyme]'))control('enzymeId',n.value);
   else if(n.matches('[data-mb-given]')){if(!['yes','no'].includes(n.value))throw new RangeError('Unknown boolean selection');control(n.dataset.mbGiven,n.value==='yes');}
  }catch{renderControls();$('[data-mb-error]').textContent='未支援的條件或選項；原條件與作答保留，沒有把輸入當成零或「否」。';}
 };
 const onClick=e=>{
  if(disposed)return;const b=e.target.closest('button');if(!b||!root.contains(b)||b.disabled)return;
  if(b.matches('[data-mb-check]')){flushText();detailState();if(checkMaltingBeer(draft)){renderStage();changed();$('[data-mb-feedback-heading]')?.focus?.({preventScroll:true});}}
  else if(b.matches('[data-mb-save]')){flushText();changed();saveWorkbenchSummary(record,onSaveSummary);}
  else if(b.matches('[data-mb-next]')||b.matches('[data-mb-previous]')){const i=MALTING_BEER_CASES.findIndex(x=>x.id===draft.caseId)+(b.matches('[data-mb-next]')?1:-1);if(i>=0&&i<MALTING_BEER_CASES.length){control('caseId',MALTING_BEER_CASES[i].id);$('[data-mb-question]')?.focus?.({preventScroll:true});}}
 };
 const onToggle=e=>{if(!disposed&&e.target.matches('[data-mb-detail]'))draft.details[e.target.dataset.mbDetail]=e.target.open;};
 renderStage();updateSave();const unsubscribe=subscribeWorkbench(record,updateSave);
 root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('click',onClick);root.addEventListener('toggle',onToggle,true);
 return()=>{if(disposed)return;flushText();detailState();disposed=true;unsubscribe();changed();root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('click',onClick);root.removeEventListener('toggle',onToggle,true);};
}
