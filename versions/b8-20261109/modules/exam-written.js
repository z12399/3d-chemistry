import {escapeHTML} from './storage.js';
import {summarizeWritten, questionStatus, EXAM_MAX_IMPORT_BYTES} from './exam-engine.js';
import {mountExamSketch,validateSketchStrokes} from './exam-sketch.js';
import {renderExamTabs} from './exam-room.js';
import {examRemedyHref} from './exam-learning-bridge.js';
import {textareaValue} from './workbench-session.js';
import {criterionRemedies,groupRemediationGaps} from './exam-remediation.js';
import {readPreparationEvidence} from './exam-preparation-evidence.js';
import {summarizePreparation} from './exam-progress-model.js';

const esc=value=>escapeHTML(String(value??''));
const subjects={chemistry:'食品化學',processing:'食品加工學',microbiology:'食品微生物學'};
const levels=[{id:'met',title:'有寫清楚'},{id:'partial',title:'部分寫到'},{id:'missing',title:'尚未寫到'},{id:'unsure',title:'待查確認'}];
const levelTitle=id=>levels.find(level=>level.id===id)?.title||'待查確認';
const prose=value=>Array.isArray(value)?value.join('\n\n'):String(value??'');
const dateLabel=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'';
const hrefFor=(id,attemptId)=>'#exam/written?question='+encodeURIComponent(id)+(attemptId?'&attempt='+encodeURIComponent(attemptId):'');
const sourceLink=(url,title)=>/^https:\/\//.test(String(url||''))?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)} ↗</a>`:esc(title);
const questionLabel=question=>`臺大 ${question.examRef?.year||''} · ${question.examRef?.question||''}`;
const attemptsFor=(state,question)=>(state.attempts||[]).filter(attempt=>attempt.questionId===question.id&&attempt.questionVersion===question.version);
const latestFor=(state,question)=>questionStatus({questions:[question]},state,question.id).latest;
const numberLabel=value=>Number.isFinite(value)?Number(value.toFixed(2)).toString():'—';
const scratchByStore=new WeakMap(),unloadOwners=new WeakSet();
function scratchFor(store){if(!scratchByStore.has(store))scratchByStore.set(store,{responses:new Map(),assessments:new Map(),sketches:new Map(),recoveryTargets:new Map()});return scratchByStore.get(store);}
const attemptLabel=attempt=>attempt?.conflicted?'並行提交':attempt?.independent?'獨立原稿':attempt?.supportReasons?.includes('unverified-conditions')?'作答條件未核實':attempt?.supportedAt?'輔助原稿':'複習原稿';
function prepareWrittenLeave(store){
  // The guard belongs to the store, not to one rendered route. It can be kept
  // by an entry shell after the written page has been disposed.
  const scratch=scratchFor(store);let flushed=true,persistence,error='';
  try{flushed=scratch.flush?.()!==false;}catch(cause){flushed=false;error=cause.message||'未存內容尚未保存。';}
  try{persistence=store.retryPersistence?.();}catch(cause){error=cause.message||'備考紀錄尚未保存。';persistence={ok:false,persisted:false};}
  const fail=(questionId,attemptId,text)=>({ok:false,href:questionId?hrefFor(questionId,attemptId):'#exam/written',error:text});
  for(const collection of [scratch.responses,scratch.sketches]){
    for(const [questionId,pending] of collection){
      if(pending.dirty)return fail(questionId,pending.attemptId,'文字或草圖尚未保存，請先重試保存；若原稿已在其他分頁封存，可將未存內容另存新草稿。');
    }
  }
  for(const [attemptId,pending] of scratch.assessments){
    if(!pending.dirty)continue;
    const attempt=store.state.attempts.find(item=>item.id===attemptId);
    return fail(attempt?.questionId,attemptId,'自評更動尚未保存。請先保存這次自評，或撤回未保存的更動後再離開。');
  }
  if(!flushed||persistence?.ok===false||store.volatile?.size){
    const pending=[...(store.volatile?.values?.()||[])][0],attempt=store.state.attempts.find(item=>item.id===pending?.attemptId);
    const questionId=attempt?.questionId||pending?.questionId,attemptId=attempt?.id||pending?.attemptId,result=fail(questionId,attemptId,error||persistence?.error||store.error||'備考紀錄仍只保留在本頁，請先重試保存或下載備份。');
    if(questionId&&store.bank?.questions?.some(item=>item.id===questionId&&item.type!=='text'))result.href='#exam?question='+encodeURIComponent(questionId)+(attemptId?'&attempt='+encodeURIComponent(attemptId):'');
    return result;
  }
  return true;
}
function guardUnsavedWork(store){
  if(typeof window==='undefined'||unloadOwners.has(store))return;
  window.addEventListener('beforeunload',event=>{
    const scratch=scratchFor(store);
    scratch.flush?.();
    if([...scratch.responses.values(),...scratch.assessments.values(),...scratch.sketches.values()].some(value=>value.dirty)||store.volatile?.size){event.preventDefault();event.returnValue='';}
  });
  unloadOwners.add(store);
}
function scoreMarkup(assessment,question){
  if(!assessment)return '';
  const uncertain=assessment.possibleScore>assessment.score;
  const value=uncertain?`${numberLabel(assessment.score)}–${numberLabel(assessment.possibleScore)}`:numberLabel(assessment.score);
  return `<div class="written-score"><div class="written-score-number">${value}<small> / ${numberLabel(assessment.maxScore??question.maxScore)}</small></div><div class="written-score-description"><strong>自評參考</strong><p>${uncertain?'還有待查要點；區間上限是假設待查項全部符合。':'這是依自己勾選與原稿引文計算的參考分數。'}</p><p class="exam-small">${esc(question.scoreLabel||'教學參考自評，非官方評分')}</p></div></div>`;
}

export function mountExamWritten(container,{bank,store,onNavigate,initialQuestionId,initialAttemptId,returnToPaper}={}){
  if(!container||!store)throw new TypeError('歷屆題作答需要容器與紀錄。');
  bank=bank&&Array.isArray(bank.questions)?bank:{schemaVersion:1,questions:[],scope:{}};
  let disposed=false,subject='all',activeId=null,activeAttemptId=null,message='',messageError=false,responseTimer=null,importEpoch=0,sketchController=null,renderedDraft=false;
  const sketchControllers=[],sketchViews=[];
  const originalClass=container.className,scratch=scratchFor(store);
  const $=selector=>container.querySelector(selector),$$=selector=>[...container.querySelectorAll(selector)];
  const live=()=>!disposed&&container.isConnected!==false;
  const question=()=>bank.questions.find(item=>item.id===activeId)||null;
  const attempt=()=>store.state.attempts.find(item=>item.id===activeAttemptId)||(question()?latestFor(store.state,question()):null);
  const focusHeading=()=>{const target=$('h1');if(target){target.tabIndex=-1;target.focus({preventScroll:true});}};
  const setMessage=(text,error=false)=>{message=text||'';messageError=error;const target=$('[data-written-status]');if(target){target.textContent=message||store.error||'';target.dataset.error=String(error||!!store.error);}updateRecoveryControls();};
  const assessmentMessage=(text,error=false)=>{const target=$('[data-written-assessment-status]');if(target){target.textContent=text;target.dataset.error=String(error);}};
  const operation=(action,success)=>{
    if(!live())return null;
    try{
      const result=action();
      if(result?.ok===false||result===false){setMessage(result?.error||store.error||'這次變更尚未完成。',true);return null;}
      if(result?.persisted===false)setMessage(result.error||store.error||'作答暫存在本頁，請下載備份。',true);
      else if(success)setMessage(success);
      return result??{ok:true};
    }catch(error){setMessage(error.message||'這次操作未完成。',true);return null;}
  };
  function pendingRecovery(){
    const response=scratch.responses.get(activeId),sketch=scratch.sketches.get(activeId);
    const text=response?.dirty?response:null,drawing=sketch?.dirty?sketch:null;
    const ids=[...new Set([text?.attemptId,drawing?.attemptId].filter(Boolean))];
    const source=ids.length===1?store.state.attempts.find(item=>item.id===ids[0]&&item.questionId===activeId&&item.questionVersion===question()?.version):null;
    return {text,drawing,source,canFork:!!source?.submittedAt&&!!(text||drawing),mixed:ids.length>1};
  }
  function updateRecoveryControls(){
    const pending=pendingRecovery();
    $$('[data-written-retry-sketch]').forEach(button=>{button.hidden=!scratch.sketches.get(activeId)?.dirty;});
    const panel=$('[data-written-pending-recovery]');if(panel)panel.hidden=!pending.canFork;
    const button=$('[data-written-fork-pending]');if(button){button.hidden=!pending.canFork;button.disabled=!!store.locked;}
    const text=$('[data-written-pending-text]');if(text){text.hidden=!pending.text;text.textContent=pending.text?.value||'（未存文字為空白）';}
    const count=$('[data-written-pending-count]');if(count)count.textContent=pending.drawing?`另有 ${pending.drawing.strokes.length} 筆未存筆畫。`:'';
  }
  function captureClosedResponse(){
    const current=attempt(),source=$('[data-written-response]');
    if(!renderedDraft||!current?.submittedAt||!source)return;
    if(source.value!==current.response)scratch.responses.set(activeId,{value:source.value,attemptId:current.id,dirty:true});
    else if(scratch.responses.get(activeId)?.attemptId===current.id)scratch.responses.delete(activeId);
  }
  function selectAttempt(id){
    const q=question(),local=scratch.sketches.get(activeId)?.dirty?scratch.sketches.get(activeId):scratch.responses.get(activeId);
    const retained=local?.dirty&&store.state.attempts.find(item=>item.id===local.attemptId&&item.questionId===activeId&&item.questionVersion===q?.version);
    const selected=id&&store.state.attempts.find(item=>item.id===id&&item.questionId===activeId&&item.questionVersion===q?.version);
    if(id&&!selected){message='找不到這份作答，或它不屬於目前題目版本；已開啟最近的原稿。';messageError=true;}
    return retained?.id||selected?.id||(q?latestFor(store.state,q)?.id:null)||null;
  }
  function begin(){
    if(!live())return null;
    const q=question();if(!q)return null;
    const result=operation(()=>store.start(q.id));
    if(!result)return null;
    activeAttemptId=result.attempt?.id||latestFor(store.state,q)?.id||null;
    return attempt();
  }
  function sketchResult(current,result={ok:true}){
    return {...result,strokes:current?.sketch||[],canUndo:!!current?.sketchCanUndo};
  }
  function rememberStroke(stroke){
    const local=scratch.sketches.get(activeId)||{attemptId:attempt()?.id||null,strokes:[],dirty:true};
    if(!local.strokes.some(item=>item.id===stroke.id))local.strokes.push(validateSketchStrokes([stroke])[0]);
    local.dirty=true;scratch.sketches.set(activeId,local);return local;
  }
  function saveSketches(){
    const local=scratch.sketches.get(activeId);
    if(!local?.dirty)return sketchResult(attempt());
    let current=local.attemptId?store.state.attempts.find(item=>item.id===local.attemptId):attempt()||begin();
    if(!current||current.submittedAt){setMessage('這段草圖尚未加入原稿；原作答可能已在另一分頁封存。筆畫仍保留，可另存新草稿或先下載救援檔。',true);return null;}
    local.attemptId=current.id;activeAttemptId=current.id;
    let result={ok:true,persisted:!store.volatile?.size};
    for(const stroke of [...local.strokes]){
      const existing=current.sketch?.find(item=>item.id===stroke.id);
      if(existing&&JSON.stringify(existing)!==JSON.stringify(stroke)){setMessage('同一筆畫出現不同內容；未覆寫草圖，請先下載救援檔。',true);return null;}
      if(!existing){result=operation(()=>store.sketch(current.id,'stroke',stroke));if(!result)return null;current=result.attempt||store.state.attempts.find(item=>item.id===current.id)||current;}
      local.strokes=local.strokes.filter(item=>item.id!==stroke.id);
    }
    scratch.sketches.delete(activeId);updateRecoveryControls();return sketchResult(current,result);
  }
  function saveStroke(stroke){rememberStroke(stroke);return saveSketches()||{ok:false,error:message||store.error};}
  function changeSketch(action){
    if(!saveSketches())return {ok:false,error:message||store.error};
    const current=attempt();
    if(!current)return {ok:false,error:'請先畫出草圖。'};
    return operation(()=>store.sketch(current.id,action))||{ok:false,error:message||store.error};
  }
  function flushSketch(){
    if(sketchController&&!sketchController.flush())return false;
    return !!saveSketches();
  }
  function disposeSketches(){
    sketchControllers.splice(0).forEach(controller=>controller.dispose());sketchController=null;
  }
  function sketchMarkup(strokes,{editable=false,canUndo=false,label='封存草圖',showEmpty=false}={}){
    if(!editable&&!showEmpty&&!strokes?.length)return '';
    const index=sketchViews.length;sketchViews.push({strokes:strokes||[],editable,canUndo});
    return `<div data-written-sketch="${index}" aria-label="${esc(label)}"></div>`;
  }
  function readResponse(){return $('[data-written-response]')?.value??scratch.responses.get(activeId)?.value??attempt()?.draft??'';}
  function saveResponse(){
    if(!live()||!question())return true;
    captureClosedResponse();
    if(attempt()?.submittedAt){
      if(scratch.responses.get(activeId)?.dirty){setMessage('原稿已在其他分頁封存；本頁未存文字仍保留，可另存為新草稿。',true);return false;}
      return true;
    }
    if(responseTimer!==null){clearTimeout(responseTimer);responseTimer=null;}
    const value=readResponse();
    if(!value&& !attempt())return true;
    const current=attempt()||begin();
    scratch.responses.set(activeId,{value,attemptId:current?.id||null,dirty:true});
    if(!current)return false;
    const result=operation(()=>store.saveDraft(current.id,value),'原稿草稿已保存；尚未封存。');
    if(result)scratch.responses.set(activeId,{value,attemptId:current.id,dirty:false});
    return !!result;
  }
  function queueResponse(){
    if(!live())return;
    scratch.responses.set(activeId,{value:readResponse(),attemptId:attempt()?.id||null,dirty:true});
    if(responseTimer!==null)clearTimeout(responseTimer);
    setMessage(store.error||'正在保存原稿草稿…',!!store.error);
    responseTimer=setTimeout(()=>{responseTimer=null;if(live())saveResponse();},600);
  }
  const preserve=()=>{const responseSaved=!activeId||!$('[data-written-response]')?true:saveResponse();const sketchSaved=flushSketch();return sketchSaved&&responseSaved;};
  function navigate(href){
    if(!live()||!preserve())return;
    if(onNavigate){onNavigate(href);return;}
    if(!/^#exam\/written(?:\?|$)/.test(href)){if(typeof window!=='undefined')window.location.hash=href;return;}
    const query=new URLSearchParams(href.split('?')[1]||''),id=query.get('question');
    disposeSketches();
    activeId=bank.questions.some(item=>item.id===id)?id:null;message='';messageError=false;activeAttemptId=activeId?selectAttempt(query.get('attempt')):null;render();
  }
  function forkPending(){
    if(!live())return;
    captureClosedResponse();sketchController?.flush();
    const pending=pendingRecovery();
    if(!pending.canFork){setMessage(pending.mixed?'未存內容來自不同原稿，請先匯出救援檔保留。':'目前沒有需要從封存原稿另存的內容。',true);return;}
    const text=pending.text?.value,strokes=validateSketchStrokes(pending.drawing?.strokes||[]),sourceId=pending.source.id;
    const previousTarget=scratch.recoveryTargets.get(sourceId);
    let target=previousTarget&&store.state.attempts.find(item=>item.id===previousTarget&&item.questionId===activeId&&item.questionVersion===question().version&&!item.submittedAt);
    if(!target){const result=operation(()=>store.start(activeId));if(!result?.attempt)return;target=result.attempt;scratch.recoveryTargets.set(sourceId,target.id);}
    if(!operation(()=>store.noteSupport(target.id,'prior-familiarity')))return;
    if(responseTimer!==null){clearTimeout(responseTimer);responseTimer=null;}
    if(text!==undefined)scratch.responses.set(activeId,{value:text,attemptId:target.id,dirty:true});else scratch.responses.delete(activeId);
    if(strokes.length)scratch.sketches.set(activeId,{strokes,attemptId:target.id,dirty:true});else scratch.sketches.delete(activeId);
    scratch.recoveryTargets.delete(sourceId);
    // A failed pointer can still be held by the old controller. Retarget its
    // raw stroke before disposal so its final flush can only write the new draft.
    disposeSketches();activeAttemptId=target.id;
    if(typeof window!=='undefined'&&/^#exam\/written(?:\?|$)/.test(window.location.hash||'')){
      const query=new URLSearchParams(window.location.hash.split('?')[1]||'');query.set('question',activeId);query.set('attempt',target.id);
      try{window.history?.replaceState(window.history.state,'','#exam/written?'+query.toString());}catch{}
    }
    let saved=true;
    if(text!==undefined){const result=operation(()=>store.saveDraft(target.id,text));if(result)scratch.responses.set(activeId,{value:text,attemptId:target.id,dirty:false});else saved=false;}
    if(!saveSketches())saved=false;
    if(saved)setMessage(store.error||'未存內容已另存新草稿；封存原稿保留不變，這次列為輔助／複習。',!!store.error);
    render();$('[data-written-response]')?.focus({preventScroll:true});
  }
  const status=()=>`<p class="exam-status" data-written-status data-error="${messageError||!!store.error}" role="status" aria-live="polite">${esc(message||store.error||'')}</p>`;
  const warning=()=>store.error||store.locked?`<div class="exam-alert" role="alert">${esc(store.error||'目前無法寫入紀錄，請先下載備份。')}</div>`:'';
  const backup=()=>`<section class="exam-backup"><h2>保留完整作答</h2><p>文字原稿、草圖、自評與基礎診斷共用一份備考備份。已封存的原稿會一直保留，重寫另開一次。</p><div class="exam-actions"><button class="exam-button" type="button" data-written-export>匯出備考紀錄</button><button class="exam-button" type="button" data-written-import>匯入備考紀錄</button><button class="exam-button" type="button" data-written-retry-sketch ${scratch.sketches.get(activeId)?.dirty?'':'hidden'}>重試保存未存草圖</button><input data-written-file type="file" accept=".json,application/json" hidden></div></section>`;
  function card(row){
    const current=row.latest,incomplete=current?.selfAssessment&&current.selfAssessment.assessedCount<current.selfAssessment.criterionCount;
    const unsaved=current&&scratch.assessments.get(current.id)?.dirty;
    const blank=current?.submittedAt&&!current.response?.trim()&&!current.sketch?.length;
    const label=current?.conflicted?'並行提交，需核對':unsaved?'自評更動尚未保存':blank?'空白封存，待回看':row.status==='self-assessed'?incomplete?'自評仍有待查':'已完成要點核對':row.status==='submitted'?'已封存，待自評':row.status==='draft'?'草稿未封存':'還沒寫過';
    const prompt=prose(row.originalPrompt||row.prompt),preview=prompt.length>150?prompt.slice(0,150)+'…':prompt;
    const target=current?.paperOrigin?.href||hrefFor(row.id,current?.id);
    return `<li class="written-question-card" data-written-card="${esc(row.id)}"><p class="written-question-key">${esc(questionLabel(row))} · ${esc(subjects[row.subject]||'')}</p><h3>${esc(row.title)}</h3><p class="written-prompt-preview">${esc(preview)}</p><div class="exam-question-meta"><span class="exam-badge">${label}</span>${current?.paperOrigin?'<span>來自限時整卷</span>':''}${row.examRef?.originalPoints?`<span>原題 ${esc(row.examRef.originalPoints)} 分</span>`:''}${row.suggestedMinutes?`<span>建議 ${esc(row.suggestedMinutes)} 分鐘</span>`:''}</div><button class="exam-button" type="button" data-written-question="${esc(row.id)}" data-written-target="${esc(target)}">${blank?'回看這題留白':row.status==='unwritten'?'寫這一題':row.status==='draft'?'繼續寫原稿':row.status==='submitted'?'對照要點自評':incomplete?'繼續核對待查要點':'查看原稿與自評'} →</button></li>`;
  }
  function dashboard(){
    const evidence=readPreparationEvidence(store),options=subject==='all'?{}:{subject};
    const preparation=summarizePreparation({writtenBank:bank,...evidence,...options});
    const summary={...summarizeWritten(bank,evidence.state,options),submitted:preparation.submitted,blank:preparation.blank};
    const papers=(Array.isArray(bank.papers)?bank.papers:[]).filter(paper=>subject==='all'||paper.subject===subject);
    const paperTotal=papers.reduce((total,paper)=>total+(Number.isInteger(paper.totalQuestions)&&paper.totalQuestions>0?paper.totalQuestions:0),0);
    const total=paperTotal||summary.total;
    const missing=papers.flatMap(paper=>(paper.questionInventory||[]).filter(item=>!item.questionId||!bank.questions.some(q=>q.id===item.questionId)).map(item=>({paper,...item})));
    const missingList=missing.length?`<details class="exam-details"><summary>尚待整理 ${missing.length} 題（仍計入原卷分母）</summary><p class="exam-small">這些原題尚未加入頁內作答，不會把題庫未齊當成你已完成準備。</p><ul class="written-pending-list">${missing.map(item=>`<li><div><strong>${esc(subjects[item.paper.subject]||'')} · 第 ${esc(item.number)} 題</strong><span>${esc(item.paper.year)} 年 · 原題 ${esc(item.originalPoints)} 分 · 尚待整理</span></div>${sourceLink(item.paper.url+(item.paper.url.includes('#')?'':'#page='+item.page),'查看官方原題')}</li>`).join('')}</ul></details>`:'';
    const next=preparation.next;
    return `<header class="exam-header"><div class="written-intro"><p class="exam-eyebrow">WRITE IT THROUGH</p><h1>歷屆題作答</h1><p>把完整題意寫成自己的答案，再對照作答要點，找出還缺哪一段推理。</p></div><a class="exam-button" href="#learn/map">回課程目錄</a></header>${warning()}${evidence.warnings.filter(text=>text!==store.error).map(text=>`<p class="exam-alert" role="alert">${esc(text)}</p>`).join('')}
      ${!bank.questions.length?'<div class="exam-empty"><h2>完整題目仍在準備</h2><p>先從基礎診斷留下作答結果，完整題意與參考要點確認後會放在這裡。</p><a class="exam-button" href="#exam">前往基礎診斷 →</a></div>':`<fieldset class="exam-subjects"><legend>查看科目</legend>${[{id:'all',title:'三科合看'},...Object.entries(subjects).map(([id,title])=>({id,title}))].map(item=>`<button type="button" class="exam-button" data-written-subject="${item.id}" aria-pressed="${subject===item.id}">${item.title}</button>`).join('')}</fieldset>
      <dl class="exam-metrics"><div class="exam-metric"><dt>已封存作答</dt><dd>${summary.submitted}<small> / ${total}</small></dd><p>留有文字或草圖的原稿${summary.blank?`；另有 ${summary.blank} 題最近交卷時留白`:''}。</p></div><div class="exam-metric"><dt>獨立寫過</dt><dd>${summary.independentSubmitted}<small> / ${total}</small></dd><p>首次提交前，未看要點或使用輔助。</p></div><div class="exam-metric"><dt>已完成要點核對</dt><dd>${summary.fullyAssessed??0}<small> / ${total}</small></dd><p>${summary.partiallyAssessed?`仍有 ${summary.partiallyAssessed} 題自評待查。`:'每項已作判斷，不代表全部掌握。'}</p></div></dl>
      <p class="written-scope-note">${summary.total<total?`目前可練 ${summary.total} / ${total} 題，其他原題仍整理中。`:`${paperTotal?'原卷共':'目前已載入'} ${total} 題。`}這是原題作答與核對的進度，不是通過率；自評不會換算成官方成績。</p>
      ${next?`<section class="exam-next"><div><p class="exam-eyebrow">NEXT STEP</p><h2>${esc(next.title)}</h2><p>${esc(next.questionTitle)}</p></div><button class="exam-button exam-button-primary" type="button" data-written-question="${esc(next.questionId||'')}" data-written-target="${esc(next.href)}">${esc(next.label)} →</button></section>`:''}
      <section class="exam-section"><div class="exam-section-heading"><h2>選一道歷屆題</h2><p class="exam-small">目前 ${summary.total} 題可作答${paperTotal?` · 原卷共 ${paperTotal} 題`:''}</p></div><ul class="written-question-list">${summary.questions.map(card).join('')}</ul>${missingList}</section>`}
      <details class="exam-details"><summary>題目與自評的範圍</summary><p class="exam-small">${esc(prose(typeof bank.scope==='string'?bank.scope:bank.scope?.statement||'題意依公開歷屆題本整理，作答要點與自評配分為教學參考。'))}</p><p class="exam-small">每題保留官方題本連結。自評需要你核對原稿中的依據，系統不會替你判定申論內容是否正確。</p></details>${status()}${backup()}`;
  }
  function responseForm(q,a){
    const submitted=!!a?.submittedAt,local=scratch.responses.get(q.id);
    renderedDraft=!submitted;
    const response=submitted?a.response:local?.dirty&&(!local.attemptId||local.attemptId===a?.id)?local.value:a?.draft||'';
    const pending=scratch.sketches.get(q.id),sameDraft=pending?.dirty&&(!pending.attemptId||pending.attemptId===a?.id)&&!submitted;
    const sketches=[...(a?.sketch||[]),...(sameDraft?pending.strokes.filter(stroke=>!a?.sketch?.some(item=>item.id===stroke.id)):[])];
    const sketch=sketchMarkup(sketches,{editable:!submitted&&!store.locked,canUndo:!!a?.sketchCanUndo||!!sameDraft,label:submitted?'這次封存的草圖':'這次作答的草圖',showEmpty:!submitted});
    const pendingState=pendingRecovery();
    const recovery=pending?.dirty?`<div class="exam-alert" role="alert">這題有尚未保存的筆畫。${pendingState.canFork?'原稿已封存，可在下方將未存內容另存新草稿。':'請重試保存；若仍無法保存，匯出備考紀錄會另外保留救援資料。'}${!sameDraft?sketchMarkup(pending.strokes,{label:'尚未保存的救援草圖'}):''}</div>`:'';
    const pendingPanel=`<section class="written-pending-recovery" data-written-pending-recovery ${pendingState.canFork?'':'hidden'} aria-label="保留未存內容"><h2>這份原稿已在其他分頁封存</h2><p>本頁未存的文字與筆畫仍保留。另存會建立一份輔助／複習草稿，原封存內容保持不變。</p><div class="written-prose" data-written-pending-text ${pendingState.text?'':'hidden'}>${esc(pendingState.text?.value||'（未存文字為空白）')}</div><p class="exam-small" data-written-pending-count>${pendingState.drawing?`另有 ${pendingState.drawing.strokes.length} 筆未存筆畫。`:''}</p><button class="exam-button exam-button-primary" type="button" data-written-fork-pending ${pendingState.canFork?'':'hidden'} ${store.locked?'disabled':''}>保留封存原稿，將未存內容另存新草稿</button><p class="exam-small">新草稿帶入未存內容；已封存的文字與草圖仍可在先前原稿中對照。也可以先匯出救援檔。</p></section>`;
    const prior=questionStatus(bank,store.state,q.id).priorVersionSeen;
    const supported=(store.state.attempts||[]).filter(item=>item.questionId===q.id&&item.supportedAt);
    const supportReasons=new Set(supported.flatMap(item=>item.supportReasons||[]));
    const declaredHelp=supportReasons.has('outside-help')||supportReasons.has('prior-familiarity');
    const supportedNotice=[supportReasons.has('unverified-conditions')?'作答條件未核實；這次不列入獨立原稿。':'',supportReasons.has('task-breakdown')?'已看作答步驟，這次列為輔助練習。':'',declaredHelp?'已註記先前練習或查閱資料，這次列為輔助練習。':''].filter(Boolean).join(' ');
    const counts=attemptsFor(store.state,q).filter(item=>item.submittedAt).length;
    return `<form data-written-form>${!submitted?`<label class="written-support-declaration"><input type="checkbox" data-written-support ${declaredHelp?'checked disabled':store.locked?'disabled':''}><span>這題以前練過，或這次有查資料</span></label>`:''}<label class="exam-answer-label" for="written-response">${submitted?'這次封存的原稿':'先寫自己的答案'}</label><textarea id="written-response" data-written-response class="exam-answer written-response" rows="11" maxlength="12000" ${submitted||store.locked?'readonly':''} placeholder="依題目要求寫出定義、推理、計算或比較；寫不完整也可以留下目前想法。">${textareaValue(response)}</textarea><div class="written-response-meta">${submitted?`<span>${esc(dateLabel(a.submittedAt))} · ${attemptLabel(a)}</span>`:'<span>停筆後自動保存文字；草圖每筆放開後保存。文字最多 12,000 字。</span>'}</div>${sketch}${recovery}
      ${!submitted?`<div class="exam-actions"><button class="exam-button exam-button-primary" type="submit">封存原稿，對照要點</button><button class="exam-button" type="button" data-written-save>保存草稿</button>${!a?.revealedAt?'<button class="exam-button" type="button" data-written-reveal>還不會，先看要點</button>':''}</div><p class="exam-small" data-written-practice-notice style="margin-top:10px">${supportedNotice}${prior?'曾練過舊版，這次列為複習。':a?.revealedAt?'已看過本題要點；後續原稿列為複習。':!supportedNotice?(counts?'重寫會保留先前原稿，列為複習。':'封存後保留這份原稿；需要修改時，可另開一次重寫。'):''}</p>`:`<div class="written-submission-note">${a.conflicted?'同一次作答收到不同提交，暫不計入獨立練習或自評結果。':'這份原稿已封存。下方自評請以這份文字與草圖為依據；要補寫可以保留原稿，另寫一次。'}</div>`}</form>${pendingPanel}${status()}`;
  }
  function draftThumbnail(strokes){
    if(!strokes?.length)return '';
    const paths=validateSketchStrokes(strokes).map(stroke=>{
      const points=stroke.points.map(([x,y])=>[Number((x*800).toFixed(3)),Number((y*500).toFixed(3))]);
      return points.length===1?`<circle cx="${points[0][0]}" cy="${points[0][1]}" r="${stroke.width/2}" fill="#17232d"/>`:`<polyline points="${points.map(point=>point.join(',')).join(' ')}" fill="none" stroke="#17232d" stroke-width="${stroke.width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join('');
    return `<svg class="written-draft-thumbnail" viewBox="0 0 800 500" role="img" aria-label="未完成草稿的草圖縮圖，${strokes.length} 筆畫"><rect width="800" height="500" fill="white"/>${paths}</svg>`;
  }
  function unfinishedDrafts(q,a){
    const drafts=attemptsFor(store.state,q).filter(item=>!item.submittedAt).sort((left,right)=>right.startedAt.localeCompare(left.startedAt)||right.id.localeCompare(left.id));
    if(!drafts.length)return '';
    return `<section class="exam-section written-unfinished-drafts"><h2>未完成草稿</h2><p class="exam-small">每份草稿分別保留。開回較早的一份，不會覆蓋其他草稿或封存原稿。</p><ul class="written-draft-list">${drafts.map(item=>{
      const local=scratch.responses.get(q.id),pending=scratch.sketches.get(q.id),value=local?.dirty&&local.attemptId===item.id?local.value:item.draft||'';
      const strokes=[...(item.sketch||[]),...(pending?.dirty&&pending.attemptId===item.id?pending.strokes.filter(stroke=>!item.sketch?.some(saved=>saved.id===stroke.id)):[])];
      const excerpt=value.trim().slice(0,160)+(value.trim().length>160?'…':'');
      return `<li data-written-draft="${esc(item.id)}"><div><p class="exam-small">${esc(dateLabel(item.startedAt))} 開始 · 文字 ${value.length} 字 · 草圖 ${strokes.length} 筆畫</p><p class="written-draft-excerpt">${esc(excerpt||'這份草稿尚未留下文字。')}</p>${item.id===a?.id?'<span class="exam-badge">目前正在編輯</span>':`<button class="exam-button" type="button" data-written-restore-draft="${esc(item.id)}">恢復這份草稿 →</button>`}</div>${draftThumbnail(strokes)}</li>`;
    }).join('')}</ul></section>`;
  }
  function ratingsFor(q,a){
    const draft=scratch.assessments.get(a.id);
    return q.rubric.map(criterion=>({...{criterionId:criterion.id,level:'unsure',evidence:''},...((draft?.dirty?draft.ratings:a.selfAssessment?.ratings)||[]).find(rating=>rating.criterionId===criterion.id)}));
  }
  function selfAssessment(q,a){
    if(!a?.submittedAt||!a?.revealedAt||a.conflicted)return '';
    const ratings=ratingsFor(q,a),dirty=scratch.assessments.get(a.id)?.dirty;
    return `<section class="written-self-assessment" aria-labelledby="written-assessment-title"><h2 id="written-assessment-title" tabindex="-1">用原稿核對每個要點</h2><p>選「有寫清楚」或「部分寫到」時，從上方原稿複製相符的原句${a.sketch?.length?'，或選「以封存草圖為依據」指向這次的圖':''}。無法確認就選「待查確認」。</p><p class="exam-small">這是你對原稿的自評；系統只確認引文出自原稿${a.sketch?.length?'或封存草圖確實存在':''}，不會替你判定申論${a.sketch?.length?'或圖像':''}對錯。</p>${scoreMarkup(a.selfAssessment,q)}
      <form data-written-assessment><div class="written-rubric-list">${q.rubric.map((criterion,index)=>{
        const rating=ratings.find(item=>item.criterionId===criterion.id),needsEvidence=['met','partial'].includes(rating.level);
        return `<article class="written-criterion" data-written-criterion="${esc(criterion.id)}"><div class="written-criterion-heading"><h3>${index+1}. ${esc(criterion.label)}</h3><span>參考 ${esc(criterion.points)} 分</span></div><fieldset class="written-ratings"><legend>這份原稿有做到嗎？</legend>${levels.map(level=>`<label class="written-rating"><input type="radio" name="written-rating-${index}" data-written-rating="${esc(criterion.id)}" value="${level.id}" ${rating.level===level.id?'checked':''}><span>${level.title}</span></label>`).join('')}</fieldset>
          <div data-written-evidence-box="${esc(criterion.id)}" ${needsEvidence?'':'hidden'}><label class="written-evidence-label" for="written-evidence-${index}">原稿中支持這項自評的原句${a.sketch?.length?'或草圖':''}</label><textarea id="written-evidence-${index}" data-written-evidence="${esc(criterion.id)}" class="exam-answer written-evidence" rows="3" maxlength="12000" placeholder="逐字複製原稿中的一句或一段，不必在這裡補寫新解釋。">${textareaValue(rating.evidence)}</textarea><div class="written-evidence-help"><p class="exam-small">${esc(criterion.evidenceHint||'選取原稿中相符的完整句子，作為自評依據。')}</p><button class="exam-button" type="button" data-written-quote="${esc(criterion.id)}">填入選取的原句</button>${a.sketch?.length?`<button class="exam-button" type="button" data-written-sketch-evidence="${esc(criterion.id)}">以封存草圖為依據</button>`:''}</div></div>
          <details><summary>怎樣判斷這個要點</summary><p class="written-explanation">${esc(criterion.explanation)}</p></details></article>`;
      }).join('')}</div><div class="exam-actions"><button class="exam-button exam-button-primary" type="submit">保存這次自評</button><button class="exam-button" type="button" data-written-reset-assessment>撤回未保存的自評更動</button><button class="exam-button" type="button" data-written-retry>保留原稿，再寫一次</button></div><p class="exam-status" data-written-assessment-status data-error="false" role="status">${dirty?'自評更動尚未保存。':a.selfAssessment?'已保存自評；若調整勾選，請再次保存。':'尚未保存自評；所有要點可以先保留為「待查確認」。'}</p></form></section>`;
  }
  function reference(q,a){
    if(!a?.revealedAt)return a?.submittedAt?'<button class="exam-button" type="button" data-written-reveal style="margin-top:20px">展開參考要點</button>':'';
    const figures=(Array.isArray(q.referenceFigures)?q.referenceFigures:[]).filter(item=>/^assets\/exam\/reference-[a-z0-9-]+\.svg$/.test(String(item?.src||''))).map(item=>`<figure class="written-reference-figure"><img src="${esc(item.src)}" alt="${esc(item.alt||'教學參考圖')}" loading="lazy"><figcaption>${esc(item.caption||'作答要點示意')} · 教學繪製，非官方解答。 <a href="${esc(item.src)}" target="_blank" rel="noopener noreferrer">放大參考圖 ↗</a></figcaption></figure>`).join('');
    return `<section class="exam-section"><h2>${a.submittedAt?'核對作答要求':'先理解作答要求'}</h2>${!a.submittedAt?'<p class="exam-small">這次還沒有提交，不會記成答錯。讀完後可回到上方寫一份複習原稿。</p>':''}<details class="exam-details" ${a.submittedAt?'':'open'}><summary>參考作答方向</summary><ol class="written-reference-answer">${(q.referenceAnswer||[]).map(paragraph=>`<li>${esc(paragraph)}</li>`).join('')}</ol>${figures}<p class="exam-small">${esc(q.scoreLabel||'教學參考自評，非官方評分')}</p></details>${!a.submittedAt?`<details class="exam-details"><summary>這題要回答哪些要點</summary><ol>${q.rubric.map(criterion=>`<li>${esc(criterion.label)}</li>`).join('')}</ol></details>`:''}</section>`;
  }
  function conflict(q,a){
    if(!a?.conflicted)return '';
    const responses=[{at:a.submittedAt,response:a.response},...(a.conflictingResponses||[])].filter((item,index,list)=>list.findIndex(other=>other.at===item.at&&other.response===item.response)===index);
    const sketches=a.sketchConflict?`<div class="written-comparison"><article><h3>原先封存的草圖</h3>${sketchMarkup(a.sketch,{showEmpty:true,label:'原先封存的草圖'})}</article><article><h3>合併較晚筆畫的版本</h3><p class="exam-small">這個版本保留封存後收到的草圖操作，未取代原先封存的圖。</p>${sketchMarkup(a.conflictingSketch,{showEmpty:true,label:'合併較晚操作後的草圖'})}</article></div>`:'';
    return `<section class="exam-feedback" data-result="review"><h2>這次作答有並行提交</h2><p>不同分頁提交的原稿全部保留。請先核對內容，再另開一次重寫；這次不計入獨立練習或自評統計。</p><ol class="written-history-list">${responses.map(item=>`<li><p class="exam-small">${esc(dateLabel(item.at))}</p><div class="written-prose">${esc(item.response)}</div></li>`).join('')}</ol>${sketches}${scratch.assessments.get(a.id)?.dirty?'<p>這份原稿仍有未保存的自評更動；並行內容核對前，請先撤回這些更動。</p><button class="exam-button" type="button" data-written-reset-assessment>撤回未保存的自評更動</button>':''}<button class="exam-button" type="button" data-written-retry>保留這些原稿，再寫一次</button></section>`;
  }
  function comparison(q,a){
    const earlier=attemptsFor(store.state,q).filter(item=>item.submittedAt&&item.id!==a?.id);
    if(!earlier.length)return '';
    const first=earlier.find(item=>item.independent)||earlier[0];
    return `<details class="exam-details"><summary>${a?.submittedAt?'比較前後兩份原稿':'回看之前的原稿'} · 保留 ${earlier.length} 次作答</summary>${a?.submittedAt?`<div class="written-comparison"><article><h3>較早的${attemptLabel(first)}</h3><p class="exam-small">${esc(dateLabel(first.submittedAt))}</p><div class="written-prose">${esc(first.response)}</div>${sketchMarkup(first.sketch)}</article><article><h3>這次原稿</h3><p class="exam-small">${esc(dateLabel(a.submittedAt))}</p><div class="written-prose">${esc(a.response)}</div>${sketchMarkup(a.sketch)}</article></div>`:''}<ol class="written-history-list">${[...earlier].reverse().map(item=>`<li><p>${esc(dateLabel(item.submittedAt))} · ${attemptLabel(item)}</p><div class="written-prose">${esc(item.response)}</div>${sketchMarkup(item.sketch)}${scoreMarkup(item.selfAssessment,q)}</li>`).join('')}</ol></details>`;
  }
  function nextSteps(q,a){
    if(!a?.revealedAt)return '';
    const next=bank.questions.find(item=>item.subject===q.subject&&item.id!==q.id&&!questionStatus(bank,store.state,item.id).seen)||bank.questions.find(item=>item.id!==q.id&&!questionStatus(bank,store.state,item.id).seen);
    const gaps=(a.selfAssessment?.ratings||[]).filter(rating=>['missing','partial','unsure'].includes(rating.level)).map(rating=>({rating,criterion:q.rubric.find(criterion=>criterion.id===rating.criterionId)})).filter(gap=>gap.criterion);
    const grouped=groupRemediationGaps(gaps.map(({rating,criterion})=>({questionId:q.id,questionTitle:q.title,subject:q.subject,attemptId:a.id,href:hrefFor(q.id,a.id),criterion:{...criterion,level:rating.level},remediation:criterionRemedies(q,criterion)})));
    const gapLinks=grouped.length?`<ul class="written-gap-lessons">${grouped.map(group=>`<li data-written-remedy-group="${esc(group.remedy?.lessonId||'unmapped')}"><strong>${esc(group.kind==='lesson'?group.remedy.title:'先核對本題解說')}</strong><p class="exam-small">${group.kind==='lesson'?`這一課對應 ${group.criteria.length} 個待補或待查要點`:'尚無精準對應課程；保留這個要點，不列為已補齊。'}</p><ul class="written-remedy-criteria">${group.criteria.map(criterion=>`<li data-written-gap="${esc(criterion.id)}"><span>${esc(criterion.label)}</span><span class="exam-badge">${esc(levelTitle(criterion.level))}</span></li>`).join('')}</ul>${group.kind==='lesson'?`<div class="exam-remedies"><a href="${esc(examRemedyHref(group.remedy.href,q.id,a.id))}" data-written-remedy>補這一課 →</a></div>`:''}${group.scopeNotes.map(note=>`<p class="exam-small">${esc(note)}</p>`).join('')}</li>`).join('')}</ul>`:'';
    const related=`<div class="exam-remedies">${(q.remediation||[]).filter(item=>/^#(?:learn|process|micro)\/[a-z0-9-]+\/[a-z0-9-]+\/(?:understand|observe|check)(?:\?|$)/.test(item.href)).map(item=>`<a href="${esc(examRemedyHref(item.href,q.id,a?.id))}" data-written-remedy>${esc(item.title)} →</a>`).join('')}</div>`;
    return `<section class="exam-section"><h2>接下來補哪裡</h2><p class="exam-small">${gaps.length?'依已保存的自評，逐項找到對應內容。':'先保存逐項自評，就能把缺口對到補強課程。'}</p>${gapLinks}${gaps.length?`<details class="exam-details"><summary>本題其他相關課程</summary>${related}</details>`:related}<p class="exam-small" style="margin-top:10px">讀完課程後，按課程頁的「回到這次作答」，即可回來核對或重寫。</p><div class="written-footer-actions">${next?`<button class="exam-button exam-button-primary" type="button" data-written-question="${esc(next.id)}">換一道題再寫 →</button>`:''}<button class="exam-button" type="button" data-written-home>回歷屆題總覽</button></div></section>`;
  }
  function questionPage(q){
    const a=attempt();
    const figure=q.originalFigure&&/^assets\/exam\/[a-zA-Z0-9_-]+\.png$/.test(q.originalFigure.src)?`<figure class="written-original-figure"><img src="${esc(q.originalFigure.src)}" alt="${esc(q.originalFigure.alt)}" loading="lazy"><figcaption>${esc(q.originalFigure.caption)} <a href="${esc(q.originalFigure.src)}" target="_blank" rel="noopener noreferrer">放大看原圖 ↗</a></figcaption></figure>`:'';
    return `<header class="exam-header"><div><p class="exam-eyebrow">${esc(subjects[q.subject]||'')} · 歷屆題作答</p><h1>${esc(q.title)}</h1></div><button type="button" class="exam-button" data-written-home>← 歷屆題總覽</button></header>${warning()}<article class="exam-question-sheet"><div class="exam-question-meta"><span class="exam-badge">${q.originalPrompt?'歷屆原題':'歷屆題意整理'}</span><span>${esc(questionLabel(q))}</span>${q.examRef?.originalPoints?`<span>原題 ${esc(q.examRef.originalPoints)} 分</span>`:''}${q.suggestedMinutes?`<span>建議作答 ${esc(q.suggestedMinutes)} 分鐘</span>`:''}<span>${sourceLink(q.examRef?.url,'核對官方題本')}</span></div><h2>${q.originalPrompt?'原題':'完整任務要求'}</h2><div class="written-task">${esc(prose(q.originalPrompt||q.prompt))}</div>${figure}${q.originalPrompt?`<details class="exam-details" data-written-outline><summary>把題目整理成作答步驟（展開後列為輔助練習）</summary><p style="white-space:pre-wrap">${esc(prose(q.prompt))}</p></details>`:''}${responseForm(q,a)}</article>${unfinishedDrafts(q,a)}${conflict(q,a)}${reference(q,a)}${selfAssessment(q,a)}${comparison(q,a)}${nextSteps(q,a)}
      <details class="exam-details"><summary>原題來源與參考範圍</summary><p>${sourceLink(q.examRef?.url,questionLabel(q)+' · 官方題本')}</p><p class="exam-small">${esc(prose(q.limitations))}</p>${a?.revealedAt&&q.answerSources?.length?`<h3>參考依據</h3><ul>${q.answerSources.map(item=>`<li>${sourceLink(item.url,item.title)}</li>`).join('')}</ul>`:'<p class="exam-small">解題參考來源會在開啟要點後顯示。</p>'}</details>${backup()}`;
  }
  function captureRatings(){
    if(!live())return [];
    const q=question(),a=attempt();if(!q||!a)return [];
    const selected=$$('[data-written-rating]'),evidence=$$('[data-written-evidence]');
    const ratings=q.rubric.map(criterion=>({criterionId:criterion.id,level:selected.find(input=>input.dataset.writtenRating===criterion.id&&input.checked)?.value||'unsure',evidence:evidence.find(input=>input.dataset.writtenEvidence===criterion.id)?.value||''}));
    scratch.assessments.set(a.id,{ratings,dirty:true});assessmentMessage('自評更動尚未保存。');return ratings;
  }
  function bind(){
    $$('[data-written-sketch]').forEach(host=>{
      const view=sketchViews[Number(host.dataset.writtenSketch)];if(!view)return;
      const controller=mountExamSketch(host,{strokes:view.strokes,readOnly:!view.editable,canUndo:view.canUndo,onStroke:saveStroke,onUndo:()=>changeSketch('undo'),onClear:()=>changeSketch('clear'),onError:text=>setMessage(text,true)});
      sketchControllers.push(controller);if(view.editable)sketchController=controller;
    });
    $$('[data-written-question]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.writtenTarget||hrefFor(button.dataset.writtenQuestion))));
    $$('[data-written-restore-draft]').forEach(button=>button.addEventListener('click',()=>{
      if(!live()||!preserve())return;
      try{store.refresh?.();}catch(error){setMessage(error.message||'暫時無法讀取草稿。',true);return;}
      const target=store.state.attempts.find(item=>item.id===button.dataset.writtenRestoreDraft&&item.questionId===activeId&&item.questionVersion===question()?.version);
      if(!target||target.submittedAt){setMessage('這份草稿已在其他分頁封存或無法讀取；目前作答保持不變。',true);return;}
      navigate(hrefFor(activeId,target.id));
    }));
    $$('[data-written-home]').forEach(button=>button.addEventListener('click',()=>navigate('#exam/written')));
    $$('.exam-room-tabs a,[data-written-remedy]').forEach(link=>link.addEventListener('click',event=>{if(!preserve())event.preventDefault();}));
    $$('[data-written-subject]').forEach(button=>button.addEventListener('click',()=>{subject=button.dataset.writtenSubject;render();$$('[data-written-subject]').find(item=>item.dataset.writtenSubject===subject)?.focus({preventScroll:true});}));
    $('[data-written-response]')?.addEventListener('input',queueResponse);
    $('[data-written-response]')?.addEventListener('blur',()=>{if(scratch.responses.get(activeId)?.dirty)saveResponse();});
    $('[data-written-save]')?.addEventListener('click',preserve);
    $('[data-written-outline]')?.addEventListener('toggle',event=>{
      const details=event.currentTarget;if(!details.open||!live()||attempt()?.submittedAt)return;
      const a=attempt()||begin();if(!a||!operation(()=>store.noteSupport(a.id,'task-breakdown'))){details.open=false;return;}
      const notice=$('[data-written-practice-notice]');if(notice)notice.textContent='已看作答步驟，這次列為輔助練習。';
      setMessage(store.error||'已記錄作答步驟輔助；參考答案仍未展開。',!!store.error);
    });
    $('[data-written-support]')?.addEventListener('change',event=>{
      const input=event.currentTarget;if(!input.checked)return;
      const a=attempt()||begin();if(!a||!operation(()=>store.noteSupport(a.id,'outside-help'))){input.checked=false;return;}
      input.disabled=true;const notice=$('[data-written-practice-notice]');if(notice)notice.textContent='已註記先前練習或查閱資料，這次列為輔助練習。';
      setMessage(store.error||'已保留這次作答的輔助情況。',!!store.error);
    });
    $('[data-written-form]')?.addEventListener('submit',event=>{
      event.preventDefault();if(!live())return;
      if(!flushSketch())return;
      const response=readResponse();
      if(!response.trim()&&!attempt()?.sketch?.length){setMessage('先留下一段自己的作答或畫出草圖，再封存原稿；也可以選擇先看要點。',true);$('[data-written-response]')?.focus();return;}
      if(responseTimer!==null){clearTimeout(responseTimer);responseTimer=null;}
      const a=attempt()||begin();if(!a||!operation(()=>store.submit(a.id,response)))return;
      scratch.responses.delete(activeId);scratch.sketches.delete(activeId);operation(()=>store.reveal(a.id));render();$('#written-assessment-title')?.focus({preventScroll:true});$('#written-assessment-title')?.scrollIntoView({block:'start'});
    });
    $('[data-written-reveal]')?.addEventListener('click',()=>{
      if(!live()||!preserve())return;
      const a=attempt()||begin();if(!a||!operation(()=>store.reveal(a.id),'已開啟參考要點；後續原稿列為複習。'))return;render();
    });
    $$('[data-written-retry]').forEach(button=>button.addEventListener('click',()=>{
      if(!preserve())return;
      const a=begin();if(!a)return;scratch.responses.delete(activeId);scratch.sketches.delete(activeId);setMessage('已另開一份重寫草稿，之前的原稿與自評仍保留。');render();$('[data-written-response]')?.focus();
    }));
    $$('[data-written-rating]').forEach(input=>input.addEventListener('change',()=>{
      const ratings=captureRatings(),rating=ratings.find(item=>item.criterionId===input.dataset.writtenRating),box=$$('[data-written-evidence-box]').find(item=>item.dataset.writtenEvidenceBox===rating.criterionId);
      if(box)box.hidden=!['met','partial'].includes(rating.level);
    }));
    $$('[data-written-evidence]').forEach(input=>input.addEventListener('input',captureRatings));
    $$('[data-written-quote]').forEach(button=>button.addEventListener('click',()=>{
      const source=$('[data-written-response]'),quote=source?.value.slice(source.selectionStart,source.selectionEnd)||'',target=$$('[data-written-evidence]').find(input=>input.dataset.writtenEvidence===button.dataset.writtenQuote);
      if(!quote.trim()){assessmentMessage('先在上方封存原稿中選取一句或一段文字，再按「填入選取的原句」。',true);source?.focus({preventScroll:true});return;}
      if(target){target.value=quote;captureRatings();target.focus({preventScroll:true});}
    }));
    $$('[data-written-sketch-evidence]').forEach(button=>button.addEventListener('click',()=>{
      if(!attempt()?.sketch?.length)return;
      const target=$$('[data-written-evidence]').find(input=>input.dataset.writtenEvidence===button.dataset.writtenSketchEvidence);
      if(target){target.value='[封存草圖]';captureRatings();target.focus({preventScroll:true});}
    }));
    $('[data-written-assessment]')?.addEventListener('submit',event=>{
      event.preventDefault();if(!live())return;const a=attempt();if(!a)return;
      const ratings=captureRatings(),result=operation(()=>store.selfAssess(a.id,ratings));
      if(!result){assessmentMessage(message||store.error||'自評尚未保存，請檢查原稿引文。',true);return;}
      scratch.assessments.set(a.id,{ratings,dirty:false});if(result.persisted!==false)setMessage('已保存這次原稿自評。');render();$('#written-assessment-title')?.focus({preventScroll:true});
    });
    $('[data-written-reset-assessment]')?.addEventListener('click',()=>{const a=attempt();if(!a)return;scratch.assessments.delete(a.id);setMessage('已撤回未保存的自評更動；封存原稿與已保存的自評保留。');render();$('#written-assessment-title')?.focus({preventScroll:true});});
    $('[data-written-fork-pending]')?.addEventListener('click',forkPending);
    $('[data-written-retry-sketch]')?.addEventListener('click',()=>{if(preserve()){setMessage(store.error||'未存草圖已加入這次原稿。',!!store.error);render();}});
    $('[data-written-export]')?.addEventListener('click',()=>{
      if(!live())return;
      preserve();try{
        const exported=store.export(),content=typeof exported==='string'?JSON.parse(exported):exported;
        const responses=[...scratch.responses].filter(([,value])=>value.dirty).map(([questionId,value])=>({questionId,...value})),sketches=[...scratch.sketches].filter(([,value])=>value.dirty).map(([questionId,value])=>({questionId,...value}));
        const rescued=responses.length>0||sketches.length>0;
        if(rescued)content.recovery={...(content.recovery?{storedRecovery:content.recovery}:{}),writtenResponses:responses,writtenSketches:sketches,note:'含尚未加入正式紀錄的原稿或筆畫。救援檔不會直接匯入覆寫；請保留原檔並回到作答頁重試保存，若原稿已封存可將未存內容另存新草稿。'};
        const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json;charset=utf-8'})),anchor=document.createElement('a');anchor.href=url;anchor.download='food-exam-'+(rescued?'recovery-':'progress-')+new Date().toISOString().slice(0,10)+'.json';anchor.hidden=true;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
        setMessage(rescued?'已準備救援檔下載，內含未存文字與筆畫；此檔不會直接匯入，請保留原檔並重試保存。':'已準備備考紀錄下載，包含已保存的草圖。尚未按「保存自評」的勾選不在備份中。',rescued);
      }catch(error){setMessage(error.message||'匯出未完成。',true);}
    });
    $('[data-written-import]')?.addEventListener('click',()=>{if(preserve())$('[data-written-file]')?.click();});
    $('[data-written-file]')?.addEventListener('change',async event=>{
      const input=event.currentTarget,file=input.files?.[0],epoch=++importEpoch;if(!file)return;
      if(file.size>EXAM_MAX_IMPORT_BYTES){setMessage(`備考紀錄超過 ${EXAM_MAX_IMPORT_BYTES/1024/1024} MB，尚未匯入。`,true);input.value='';return;}
      try{const content=await file.text();if(!live()||epoch!==importEpoch||input!==$('[data-written-file]')||!preserve())return;const result=operation(()=>store.import(content));if(result){if(result.persisted!==false)setMessage('已合併備考紀錄，既有原稿與自評仍保留。');render();}}catch(error){if(live()&&epoch===importEpoch)setMessage(error.message||'讀取備份失敗。',true);}finally{if(live()&&input.isConnected)input.value='';}
    });
  }
  function render(){if(!live()||sketchControllers.length&&!flushSketch())return false;disposeSketches();sketchViews.length=0;renderedDraft=false;container.className='learning-studio exam-room exam-written';container.setAttribute('data-view','exam-written');container.innerHTML=renderExamTabs('written')+(/^#exam\/paper\?run=[a-zA-Z0-9%._:-]+(?:&question=[a-zA-Z0-9%._:-]+)?$/.test(returnToPaper||'')?`<p class="written-paper-return"><a class="exam-button" href="${esc(returnToPaper)}">← 回這場整卷與自評彙整</a></p>`:'')+(question()?questionPage(question()):dashboard());bind();updateRecoveryControls();focusHeading();return true;}
  try{store.refresh?.();}catch(error){message=error.message;messageError=true;}
  const routeQuery=new URLSearchParams(typeof window!=='undefined'?window.location.hash.split('?')[1]||'':''),routeId=initialQuestionId||routeQuery.get('question');
  if(routeId&&bank.questions.some(item=>item.id===routeId)){activeId=routeId;activeAttemptId=selectAttempt(initialAttemptId||routeQuery.get('attempt'));}
  else if(routeId){message='這道歷屆題目前尚未載入，請從下方重新選題。';messageError=true;}
  const flush=()=>{if(live())return preserve();return true;};
  scratch.flush=flush;guardUnsavedWork(store);render();
  const onStorage=event=>{if(!live()||(event?.key&&!event.key.startsWith('food-exam-evidence-v1:')&&!event.key.startsWith('food-exam-paper-v1:')))return;try{store.refresh?.();}catch{}if(!activeId)render();else{captureClosedResponse();updateRecoveryControls();}};
  if(typeof window!=='undefined')window.addEventListener('storage',onStorage);
  const cleanup=()=>{if(disposed)return;flush();disposeSketches();if(scratch.flush===flush)delete scratch.flush;if(responseTimer!==null)clearTimeout(responseTimer);disposed=true;importEpoch++;if(typeof window!=='undefined')window.removeEventListener('storage',onStorage);container.className=originalClass;};
  cleanup.prepareLeave=()=>{
    const result=prepareWrittenLeave(store);
    if(result!==true&&live())setMessage(result.error,true);
    return result;
  };
  return cleanup;
}
