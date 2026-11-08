import {escapeHTML} from './storage.js';
import {textareaValue} from './workbench-session.js';
import {mountExamSketch,validateSketchStrokes} from './exam-sketch.js';
import {createExamPaperManifest,EXAM_PAPER_TOOLS,EXAM_PAPER_MAX_IMPORT_BYTES} from './exam-paper-model.js';
import {renderExamTabs} from './exam-navigation.js';

const esc=value=>escapeHTML(String(value??''));
// HTML ignores one LF immediately after <pre>; protect authored leading LFs.
const preValue=value=>'\n'+esc(value);
const subjects={chemistry:'食品化學',processing:'食品加工學',microbiology:'食品微生物學'};
const toolLabels={calculator:'計算機',notes:'個人筆記／教材',web:'網站／解答',peopleAi:'他人／AI',courseHints:'課內提示',paper:'紙筆作答'};
const seenLabels={unknown:'不確定',unseen:'自述未見',seen:'曾看過原題或解答'};
const stateLabels={blank:'空白',partial:'部分稿','self-complete':'自認完成'};
const reasonLabels={submitted:'提前交卷',deadline:'時間到',interrupted:'中斷封存'};
const number=value=>Number.isFinite(value)?String(Number(value.toFixed(2))):'—';
const date=value=>value?new Date(value).toLocaleString('zh-TW'):'—';
const href=(runId,questionId)=>'#exam/paper'+(runId?'?run='+encodeURIComponent(runId)+(questionId?'&question='+encodeURIComponent(questionId):''):'');
const scratchByStore=new WeakMap(),unloadOwners=new WeakSet();
function scratchFor(store){if(!scratchByStore.has(store))scratchByStore.set(store,{responses:new Map(),strokes:new Map(),targets:new Map(),flush:null});return scratchByStore.get(store);}
const keyFor=(runId,questionId)=>`${runId}/${questionId}`;
function pendingItems(scratch){const keys=new Set([...scratch.responses.keys(),...scratch.strokes.keys()]);return [...keys].map(key=>({key,text:scratch.responses.get(key)||null,drawing:scratch.strokes.get(key)||null}));}
function guard(store,examStore){
  if(typeof window==='undefined'||unloadOwners.has(store))return;
  window.addEventListener('beforeunload',event=>{const scratch=scratchFor(store);scratch.flush?.();if(pendingItems(scratch).length||store.volatile?.size||examStore?.volatile?.size){event.preventDefault();event.returnValue='';}});
  unloadOwners.add(store);
}
function download(value,name){
  const blob=new Blob([value],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

/** Returns a cleanup function with .prepareLeave() and .flush(). The leave guard
 * survives a route disposal through the store's scratch registry. */
export function mountExamPaper(container,{bank,store,examStore,onNavigate,initialRunId,initialQuestionId}={}){
  if(!container||!store||!bank)throw new TypeError('限時整卷需要題庫、容器與儲存庫。');
  examStore=examStore||store.examStore;const scratch=scratchFor(store),originalClass=container.className;
  let disposed=false,runId=initialRunId||null,questionId=initialQuestionId||null,setupPaperId=bank.papers?.[0]?.id||'',message='',messageError=false;
  let responseTimer=null,tickTimer=null,sketch=null,importEpoch=0,rendering=false,renderedText='';const viewSketches=[],listeners=[];
  const setup={minutes:'',policy:{calculator:false,notes:false,web:false,peopleAi:false,courseHints:false,paper:true},seen:{}};
  const $=selector=>container.querySelector(selector),$$=selector=>[...container.querySelectorAll(selector)];
  const currentRun=()=>runId?store.getRun(runId):null;
  const currentQuestion=()=>currentRun()?.questions.find(q=>q.id===questionId)||null;
  const activeKey=()=>keyFor(runId,questionId);
  const say=(value,error=false)=>{message=value||'';messageError=error;if(disposed)return;const target=$('[data-paper-status]');if(target){target.textContent=message||store.error||'';target.dataset.error=String(error||!!store.error);}};
  const outcome=(result,success)=>{if(result?.ok===false){say(result.error||'這次操作尚未完成。',true);return false;}if(result?.persisted===false)say(result.error||'原稿只保留在本頁，請重試保存或下載備份。',true);else if(success)say(success);return true;};
  const listen=(target,type,handler)=>{target?.addEventListener?.(type,handler);if(target)listeners.push(()=>target.removeEventListener?.(type,handler));};
  const remaining=run=>Math.max(0,Date.parse(run.deadlineAt)-Date.parse(store.now()));
  const timerText=run=>{const seconds=Math.ceil(remaining(run)/1000);return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;};
  function rememberText(){
    if(disposed)return;
    const input=$('[data-paper-response]');if(!input||!runId||!questionId)return;
    if(input.value===renderedText&&!scratch.responses.has(activeKey()))return;
    const q=currentQuestion();if(input.value!==q?.response)scratch.responses.set(activeKey(),{runId,questionId,value:input.value,observedAt:store.now()});
    else scratch.responses.delete(activeKey());
  }
  function saveText(){
    if(responseTimer!==null){clearTimeout(responseTimer);responseTimer=null;}
    rememberText();const pending=scratch.responses.get(activeKey());if(!pending)return true;
    const result=store.saveAnswer(pending.runId,pending.questionId,pending.value);
    if(!outcome(result,'文字草稿已保存。'))return false;
    const q=result.run?.questions.find(q=>q.id===pending.questionId);
    if(q?.response!==pending.value){say('保存後內容不一致；未存文字仍保留。',true);return false;}
    // Accepted volatile data are already exportable in the ledger. Navigation
    // still checks store.volatile; this is separate from a rejected scratch edit.
    scratch.responses.delete(activeKey());renderedText=pending.value;updateQuestionStatuses(result.run);return true;
  }
  function queueText(){
    rememberText();if(responseTimer!==null)clearTimeout(responseTimer);const run=currentRun();
    if(run?.status!=='active'||remaining(run)<=2000){saveText();if(currentRun()?.status==='sealed')render();return;}
    say('正在保存文字草稿…');responseTimer=setTimeout(()=>{responseTimer=null;if(!disposed){saveText();if(currentRun()?.status==='sealed')render();}},300);
  }
  function rememberStroke(stroke){
    const key=activeKey(),entry=scratch.strokes.get(key)||{runId,questionId,strokes:[],observedAt:store.now()};
    const old=entry.strokes.find(item=>item.id===stroke.id);
    if(old&&JSON.stringify(old)!==JSON.stringify(stroke))throw Error('同一筆畫識別有不同內容，請先下載救援檔。');
    if(!old)entry.strokes.push(validateSketchStrokes([stroke])[0]);scratch.strokes.set(key,entry);return entry;
  }
  function saveStrokes(){
    const key=activeKey(),pending=scratch.strokes.get(key);let run=currentRun(),q=run?.questions.find(q=>q.id===questionId),result={ok:true,persisted:!store.volatile?.size};
    if(!pending)return {...result,strokes:q?.sketch||[],canUndo:!!q?.sketchCanUndo};
    for(const stroke of [...pending.strokes]){
      const old=q?.sketch.find(item=>item.id===stroke.id);
      if(old&&JSON.stringify(old)!==JSON.stringify(stroke)){say('筆畫識別衝突；未存筆畫仍保留。',true);return {ok:false,error:message};}
      if(!old){result=store.sketch(pending.runId,pending.questionId,'stroke',stroke);if(!outcome(result))return result;run=result.run;q=run.questions.find(q=>q.id===pending.questionId);}
      pending.strokes=pending.strokes.filter(item=>item.id!==stroke.id);
    }
    scratch.strokes.delete(key);updateQuestionStatuses(run);return {...result,strokes:q?.sketch||[],canUndo:!!q?.sketchCanUndo};
  }
  function saveStroke(stroke){try{rememberStroke(stroke);return saveStrokes();}catch(error){say(error.message,true);return {ok:false,error:message};}}
  function changeSketch(operation){const saved=saveStrokes();if(!saved.ok)return saved;const result=store.sketch(runId,questionId,operation);outcome(result);updateQuestionStatuses(result.run);return result;}
  function flush(){
    if(responseTimer!==null){clearTimeout(responseTimer);responseTimer=null;}
    const textOk=saveText(),sketchOk=sketch?.flush()!==false,strokesOk=saveStrokes().ok!==false;
    return textOk&&sketchOk&&strokesOk;
  }
  function prepareLeave(){
    const flushed=(scratch.flush||flush)(),result=store.retryPersist();const written=examStore?.retryPersistence?.();
    const pending=pendingItems(scratch)[0],identity=pending?.text||pending?.drawing;
    if(!flushed||pending||!result.ok||!result.persisted||written?.ok===false||examStore?.volatile?.size){
      const error=pending?'未存或超時內容仍留在救援區。請重試保存，或明確另存不限時練習稿。':store.error||examStore?.error||'紀錄尚未持久保存，請先重試或下載備份。';
      say(error,true);return {ok:false,href:href(identity?.runId||runId,identity?.questionId||questionId),error};
    }
    return true;
  }
  function updateQuestionStatuses(run=currentRun()){
    if(!run||disposed)return;for(const button of $$('[data-paper-question]')){const q=run.questions.find(q=>q.id===button.dataset.paperQuestion);if(q){const label=button.querySelector?.('[data-paper-question-state]');if(label)label.textContent=stateLabels[q.status];button.dataset.state=q.status;}}
  }
  function disposeSketches(){if(sketch){sketch.dispose();sketch=null;}viewSketches.splice(0).forEach(item=>item.dispose());}
  function routeTo(hrefValue){const ready=prepareLeave();if(ready!==true)return false;if(onNavigate)onNavigate(hrefValue);else if(typeof window!=='undefined')window.location.hash=hrefValue;return true;}
  function updateAddress(){if(typeof window==='undefined'||!/^#exam\/paper(?:\?|$)/.test(window.location.hash||''))return;try{window.history.replaceState(window.history.state,'',href(runId,questionId));}catch{}}
  function selectQuestion(id){
    if(!flush()){render();return;}
    if(!currentRun()?.questions.some(q=>q.id===id))return;disposeSketches();questionId=id;updateAddress();render();$('h2')?.focus?.({preventScroll:true});
  }
  function seal(reason){
    flush();const result=store.seal(runId,reason);if(!outcome(result,'整卷原稿已封存；未存內容仍會留在救援區。'))return;render();
  }
  function tick({resumed=false}={}){
    if(disposed||!runId||rendering)return;
    const before=currentRun();if(!before||before.status!=='active')return;
    const result=store.checkDeadline(runId,{resumed});if(!outcome(result))return;
    const run=result.run;if(run.status==='sealed'){rememberText();sketch?.flush();say('時間已到，最後保存的原稿已封存。未存或超時內容另列於救援區。',!!pendingItems(scratch).length);render();return;}
    const target=$('[data-paper-timer]');if(target)target.textContent=timerText(run);
    if(run.clockUncertain){const warning=$('[data-paper-clock]');if(warning){warning.hidden=false;warning.textContent='曾觀察到時鐘倒退；此場作答條件未核實。';}}
  }
  function knownSeen(id){examStore?.refresh();store.refresh();return (examStore?.state.attempts||[]).some(a=>a.questionId===id)||store.state.runs.some(run=>run.questions.some(q=>q.id===id));}
  function setupManifest(){try{return createExamPaperManifest(bank,setupPaperId);}catch{return null;}}
  function rememberSetup(){
    const minutes=$('[data-paper-minutes]');if(minutes)setup.minutes=minutes.value;
    for(const input of $$('[data-paper-policy]'))setup.policy[input.dataset.paperPolicy]=input.checked;
    for(const input of $$('[data-paper-initial-seen]'))setup.seen[input.dataset.paperInitialSeen]=input.value;
  }
  function setupMarkup(){
    const manifest=setupManifest();
    return `<section class="paper-setup"><h2>設定這次練習</h2><p>時長與工具政策由你設定。這些原卷未刊作答時長或工具規則，不代表正式考場規定。</p><form data-paper-start>
      <div class="paper-settings"><label>原卷<select data-paper-select>${(bank.papers||[]).map(p=>`<option value="${esc(p.id)}" ${p.id===setupPaperId?'selected':''}>${esc(p.year)} 學年 ${esc(subjects[p.subject]||p.subject)} · ${esc(p.totalQuestions)} 題</option>`).join('')}</select></label>
      <label>自訂限時（分鐘）<input data-paper-minutes type="number" min="1" max="1440" step="1" required value="${esc(setup.minutes)}" inputmode="numeric" placeholder="請輸入分鐘"></label></div>
      <fieldset><legend>本次允許的工具</legend><div class="paper-tool-grid">${EXAM_PAPER_TOOLS.map(tool=>`<label><input type="checkbox" data-paper-policy="${tool}" ${setup.policy[tool]?'checked':''}>${toolLabels[tool]}</label>`).join('')}</div><p class="paper-small">允許使用不會記成已實際使用；作答時另行記錄。</p></fieldset>
      <fieldset><legend>開始前：是否曾看過原題或解答</legend><button type="button" data-paper-bulk-unseen>將未有系統紀錄的題目自述為未見</button><div class="paper-seen-list">${(manifest?.questions||[]).map(q=>{const known=knownSeen(q.id);return `<label>第 ${q.number} 題${known?'<span>系統已記錄曾接觸</span>':''}<select data-paper-initial-seen="${esc(q.id)}" ${known?'disabled':''}>${Object.entries(seenLabels).map(([value,label])=>`<option value="${value}" ${(known?'seen':setup.seen[q.id]||'unknown')===value?'selected':''}>${label}</option>`).join('')}</select></label>`;}).join('')}</div></fieldset>
      <p>開始後以經過時間計算，切換分頁或關閉不會暫停。交卷後才銜接逐題參考與自評。</p><button type="submit" class="paper-primary" ${!manifest||store.locked?'disabled':''}>開始這份原卷</button></form></section>
      <section class="paper-history"><h2>先前整卷紀錄</h2>${store.state.runs.length?`<div class="paper-history-list">${[...store.state.runs].reverse().map(run=>`<button data-paper-open="${esc(run.id)}"><strong>${esc(subjects[run.subject])}</strong><span>${esc(date(run.startedAt))}</span><span>${number(run.minutes)} 分鐘 · ${run.status==='active'?'進行中':esc(reasonLabels[run.reason]||'已封存')}</span></button>`).join('')}</div>`:'<p>尚未開始整卷練習。</p>'}</section>`;
  }
  function originalFigure(q){const figure=q.originalFigure;return figure?`<figure class="paper-original-figure"><a href="${esc(figure.url)}" target="_blank" rel="noopener noreferrer" data-paper-original><img src="${esc(figure.src)}" alt="${esc(figure.alt)}"></a><figcaption>${esc(figure.caption)}</figcaption></figure>`:'';}
  function runMarkup(run){
    if(!run.questions.some(q=>q.id===questionId))questionId=run.questions[0]?.id||null;
    const q=run.questions.find(q=>q.id===questionId),active=run.status==='active',paper=bank.papers.find(p=>p.id===run.paperId),summary=store.assessmentSummary(run.id,examStore);
    const score=summary.possibleScore>summary.selfScore?`${number(summary.selfScore)}–${number(summary.possibleScore)}`:number(summary.selfScore);
    return `<section class="paper-run"><div class="paper-run-heading"><div><h2 tabindex="-1">${esc(subjects[run.subject])} · ${active?'整卷作答':'封存原稿'}</h2><p>${number(run.minutes)} 分鐘 · ${esc(date(run.startedAt))} 開始</p></div>${active?`<div class="paper-timer" aria-label="剩餘時間"><span data-paper-timer>${timerText(run)}</span><small>剩餘時間</small></div>`:`<strong class="paper-seal-label">${esc(reasonLabels[run.reason]||'已封存')}</strong>`}</div>
      <p class="paper-warning" data-paper-clock ${run.clockUncertain?'':'hidden'}>${run.clockUncertain?'曾觀察到時鐘倒退；此場作答條件未核實。':''}</p>
      ${run.offlineExpired?'<p class="paper-warning">離開或背景期間已逾時，封存的是最後保存版本；無法取得截止瞬間稿。</p>':''}
      ${run.conflicted?'<p class="paper-warning">此場含並行或封存後匯入的變更。所有事件與封存候選都保留在備份中，暫不銜接計分。</p>':''}
      ${summary.evidenceLocked?`<p class="paper-warning">連結的逐題紀錄讀取異常，暫不計入自評分數。${esc(summary.evidenceError)}</p>`:''}
      <details class="paper-conditions"><summary>本場工具政策與實際使用</summary><p>允許：${esc(EXAM_PAPER_TOOLS.filter(tool=>run.toolPolicy[tool]).map(tool=>toolLabels[tool]).join('、')||'無上述工具')}</p><p>已記錄：${esc(run.toolUses.map(use=>`${use.tool==='original-paper'?'查看官方原卷':toolLabels[use.tool]}${use.questionId?'（第 '+run.questions.find(q=>q.id===use.questionId)?.number+' 題）':'（整卷）'}`).join('、')||'尚無使用紀錄')}</p><p class="paper-small">系統紀錄與使用者自述，不能驗證外部行為。</p></details>
      ${active?'':`<section class="paper-summary"><h3>封存與自評進度</h3><p>空白 ${summary.blank} 題 · 部分稿 ${run.questions.filter(q=>q.status==='partial').length} 題 · 自認完成 ${run.questions.filter(q=>q.status==='self-complete').length} 題</p><p>已自評 ${summary.assessed} / ${run.questions.length} 題 · 待評 ${summary.pending} 題</p><p>${summary.assessed?`已評部分 ${score} / ${number(summary.maxScoreOfAssessed)} 分`:'尚無自評分數'}。教學規準自評，非臺大官方成績；待評題不算成 0。</p><p>已見 ${run.questions.filter(q=>q.seenStatus==='seen').length} 題 · 不確定 ${run.questions.filter(q=>q.seenStatus==='unknown').length} 題。這份原稿不能推估錄取率或未見題表現。</p></section>`}
      <div class="paper-layout"><nav class="paper-question-nav" aria-label="整卷題號">${run.questions.map(item=>`<button type="button" data-paper-question="${esc(item.id)}" data-state="${item.status}" ${item.id===questionId?'aria-current="true"':''}><span>第 ${item.number} 題 · ${item.points} 分</span><small data-paper-question-state>${stateLabels[item.status]}</small></button>`).join('')}</nav>
      <article class="paper-question"><header><h3>第 ${q.number} 題 · 原題 ${q.points} 分</h3><span>${esc(seenLabels[q.seenStatus])}${q.seen.systemSeen?'（系統有紀錄）':''}</span></header>
      <div class="paper-original">${esc(q.originalPrompt)}</div>${originalFigure(q)}
      ${/^https:\/\//.test(paper?.url||'')?`<p><a href="${esc(paper.url)}#page=${q.page}" target="_blank" rel="noopener noreferrer" data-paper-original>核對官方原卷第 ${q.page} 頁 ↗</a></p>`:''}
      ${active?`<label class="paper-response-label">你的原稿<textarea data-paper-response maxlength="12000" rows="12" placeholder="在此記錄推理、計算與作答。">${textareaValue(scratch.responses.get(activeKey())?.value??q.response)}</textarea></label><div data-paper-sketch></div>
      <label class="paper-complete"><input type="checkbox" data-paper-complete ${q.selfComplete?'checked':''}>我認為這題已寫完（不代表答對）</label>
      <details><summary>記錄已見與實際工具使用</summary><label>是否曾看過原題或解答<select data-paper-seen>${Object.entries(seenLabels).map(([value,label])=>`<option value="${value}" ${q.seenStatus===value?'selected':''}>${label}</option>`).join('')}</select></label><p class="paper-small">已有的已見紀錄不會因重新選「未見」而清除。</p><div class="paper-tool-grid">${EXAM_PAPER_TOOLS.map(tool=>`<button type="button" data-paper-use="${tool}">記錄使用${toolLabels[tool]}</button>`).join('')}</div></details>
      <div class="paper-end-actions"><button type="button" data-paper-submit class="paper-primary">提前交卷並封存</button><button type="button" data-paper-stop>中斷並封存</button></div>`:
      `<h4>這題的限時原稿</h4><pre class="paper-sealed-response">${preValue(q.response||'（文字空白）')}</pre><div data-paper-sealed-sketch></div><p>${esc(stateLabels[q.status])} · ${esc(seenLabels[q.seenStatus])}</p><button type="button" data-paper-assess ${run.conflicted||!examStore?'disabled':''}>${summary.questions.find(item=>item.questionId===q.id)?.assessment?'回看這題自評':'銜接這題參考與自評'}</button><p class="paper-small">先匯接這份固定原稿，再到逐題頁展開參考；不會另建第二套分數。</p>`}
      </article></div></section>`;
  }
  function rescueMarkup(){
    const items=pendingItems(scratch);if(!items.length)return '';
    return `<section class="paper-rescue" aria-label="未存內容救援"><h2>未存／超時內容仍保留</h2><p>以下內容沒有加入限時封存原稿。另存為不限時練習也不會補算限時分數。</p>${items.map((item,i)=>{const identity=item.text||item.drawing;return `<article><h3>${esc(identity.questionId)}</h3>${item.text?`<pre>${preValue(item.text.value||'（未存文字為空白）')}</pre>`:''}${item.drawing?`<p>${item.drawing.strokes.length} 筆未存筆畫</p><div data-paper-rescue-sketch="${i}"></div>`:''}<button type="button" data-paper-rescue="${esc(item.key)}" ${!examStore?'disabled':''}>將未存內容另存不限時練習稿</button></article>`;}).join('')}<button type="button" data-paper-download-rescue>下載完整救援檔</button></section>`;
  }
  function recoveryExport(){return JSON.stringify({kind:'exam-paper-rescue',schemaVersion:1,exportedAt:store.now(),timedBackup:JSON.parse(store.export({examStore})),pending:pendingItems(scratch).map(item=>({text:item.text,drawing:item.drawing,scope:'未納入限時原稿，不可補算限時分數'}))},null,2);}
  function forkPending(key){
    if(!examStore){say('需要既有作答儲存庫才能另存練習稿。',true);return;}
    // Freeze the pending pointer into the same scratch entry before retargeting.
    if(key===activeKey())sketch?.flush();const text=scratch.responses.get(key),drawing=scratch.strokes.get(key),identity=text||drawing;if(!identity)return;
    examStore.refresh();let targetId=scratch.targets.get(key),target=examStore.state.attempts.find(a=>a.id===targetId&&!a.submittedAt);
    if(!target){const result=examStore.start(identity.questionId);if(!outcome(result))return;target=result.attempt;targetId=target.id;scratch.targets.set(key,targetId);}
    for(const reason of ['prior-familiarity','unverified-conditions'])if(!outcome(examStore.noteSupport(targetId,reason)))return;
    if(text&&!outcome(examStore.saveDraft(targetId,text.value)))return;
    for(const stroke of drawing?.strokes||[]){
      examStore.refresh();target=examStore.state.attempts.find(a=>a.id===targetId);const existing=target?.sketch.find(item=>item.id===stroke.id);
      if(existing&&JSON.stringify(existing)!==JSON.stringify(stroke)){say('另存草稿的筆畫識別衝突；救援內容未清除。',true);return;}
      if(!existing&&!outcome(examStore.sketch(targetId,'stroke',stroke)))return;
    }
    const persisted=examStore.retryPersistence?.()||{ok:true,persisted:!examStore.volatile?.size};examStore.refresh();target=examStore.state.attempts.find(a=>a.id===targetId);
    const copied=(!text||target?.draft===text.value)&&(drawing?.strokes||[]).every(stroke=>target?.sketch.some(item=>JSON.stringify(item)===JSON.stringify(stroke)));
    if(!persisted.ok||!persisted.persisted||examStore.volatile?.size||!copied){say('不限時草稿尚未持久保存；救援內容仍保留，重試會沿用同一份草稿。',true);render();return;}
    // Dispose can retry an old pointer; remove its callbacks before deleting
    // scratch, then verify the complete transfer again on the next render.
    disposeSketches();scratch.responses.delete(key);scratch.strokes.delete(key);scratch.targets.delete(key);
    say('未存內容已持久另存不限時草稿；限時原稿保留不變。');render();
    const targetHref='#exam/written?question='+encodeURIComponent(identity.questionId)+'&attempt='+encodeURIComponent(targetId)+'&paperReturn='+encodeURIComponent(identity.runId)+'&paperQuestion='+encodeURIComponent(identity.questionId);
    const link=$('[data-paper-recovered-link]');if(link){link.hidden=false;link.href=targetHref;link.textContent='開啟另存的不限時練習稿';}
  }
  function wire(){
    $('[data-paper-start]')?.addEventListener('submit',event=>{event.preventDefault();rememberSetup();const result=store.start(setupPaperId,{minutes:Number(setup.minutes),toolPolicy:setup.policy,seen:setup.seen});if(!outcome(result))return;runId=result.run.id;questionId=result.run.questions[0]?.id;updateAddress();render();});
    $('[data-paper-select]')?.addEventListener('change',event=>{rememberSetup();setupPaperId=event.target.value;render();});
    $('[data-paper-bulk-unseen]')?.addEventListener('click',()=>{rememberSetup();for(const q of setupManifest()?.questions||[])if(!knownSeen(q.id))setup.seen[q.id]='unseen';render();});
    for(const button of $$('[data-paper-open]'))button.addEventListener('click',()=>{if(!flush())return;runId=button.dataset.paperOpen;questionId=null;store.checkDeadline(runId,{resumed:true});updateAddress();render();});
    for(const button of $$('[data-paper-question]'))button.addEventListener('click',()=>selectQuestion(button.dataset.paperQuestion));
    if($('[data-paper-response]'))renderedText=$('[data-paper-response]').value;
    $('[data-paper-response]')?.addEventListener('input',queueText);
    $('[data-paper-complete]')?.addEventListener('change',event=>{if(!flush()){render();return;}const result=store.setComplete(runId,questionId,event.target.checked);outcome(result);updateQuestionStatuses(result.run);});
    $('[data-paper-seen]')?.addEventListener('change',event=>{if(!flush()){render();return;}outcome(store.setSeen(runId,questionId,event.target.value));render();});
    for(const button of $$('[data-paper-use]'))button.addEventListener('click',()=>{if(!flush()){render();return;}outcome(store.noteTool(runId,button.dataset.paperUse,{questionId}),'已記錄實際工具使用。');render();});
    for(const link of $$('[data-paper-original]'))link.addEventListener('click',event=>{const run=currentRun();if(run?.status==='active'){if(!flush()||!outcome(store.noteTool(runId,'original-paper',{questionId}))){event.preventDefault();render();}}});
    $('[data-paper-submit]')?.addEventListener('click',()=>seal('submitted'));$('[data-paper-stop]')?.addEventListener('click',()=>seal('interrupted'));
    $('[data-paper-assess]')?.addEventListener('click',()=>{const result=store.bridgeQuestion(runId,questionId,examStore);if(!outcome(result))return;routeTo('#exam/written?question='+encodeURIComponent(questionId)+'&attempt='+encodeURIComponent(result.attemptId)+'&paperReturn='+encodeURIComponent(runId)+'&paperQuestion='+encodeURIComponent(questionId));});
    $('[data-paper-new]')?.addEventListener('click',()=>{if(prepareLeave()!==true)return;disposeSketches();runId=null;questionId=null;updateAddress();render();});
    $('[data-paper-back]')?.addEventListener('click',event=>{event.preventDefault();routeTo('#exam/progress');});
    $('[data-paper-recovered-link]')?.addEventListener('click',event=>{event.preventDefault();routeTo(event.currentTarget.getAttribute('href'));});
    $('[data-paper-retry]')?.addEventListener('click',()=>{const saved=flush(),result=store.retryPersist(),written=examStore?.retryPersistence?.();outcome(result,saved&&result.persisted&&written?.persisted!==false?'已重試保存。':'仍有未存內容，請查看救援區。');render();});
    $('[data-paper-download]')?.addEventListener('click',()=>{flush();const rescue=pendingItems(scratch).length>0;download(rescue?recoveryExport():store.export({examStore}),`exam-paper-${rescue?'rescue-':''}${new Date().toISOString().replace(/[:.]/g,'-')}.json`);say(rescue?'已啟動救援檔下載；請確認檔案完整保存。':'已啟動整卷備份下載。');render();});
    $('[data-paper-download-rescue]')?.addEventListener('click',()=>{download(recoveryExport(),`exam-paper-rescue-${Date.now()}.json`);say('已啟動救援檔下載；未存內容仍留在本頁。');});
    for(const button of $$('[data-paper-rescue]'))button.addEventListener('click',()=>forkPending(button.dataset.paperRescue));
    $('[data-paper-import]')?.addEventListener('change',async event=>{
      const file=event.target.files?.[0],epoch=++importEpoch;if(!file)return;
      if(!flush()){say('先處理本頁未存內容，再還原其他備份。',true);render();return;}
      if(file.size>EXAM_PAPER_MAX_IMPORT_BYTES){say('備份超過 32 MB，請保留原檔。',true);return;}
      try{const text=await file.text();if(disposed||epoch!==importEpoch)return;const result=store.import(text,{examStore});if(!outcome(result,'備份已併入，既有整卷與逐題自評保留。'))return;if(runId)store.checkDeadline(runId,{resumed:true});render();}catch(error){if(!disposed)say(error.message||'備份讀取失敗。',true);}
    });
    const run=currentRun(),q=run?.questions.find(q=>q.id===questionId),canvas=$('[data-paper-sketch]');
    if(canvas&&q)sketch=mountExamSketch(canvas,{strokes:q.sketch,canUndo:q.sketchCanUndo,onStroke:saveStroke,onUndo:()=>changeSketch('undo'),onClear:()=>changeSketch('clear'),onError:text=>say(text,true)});
    const sealed=$('[data-paper-sealed-sketch]');if(sealed&&q?.sketch.length)viewSketches.push(mountExamSketch(sealed,{strokes:q.sketch,readOnly:true}));
    const items=pendingItems(scratch);for(const host of $$('[data-paper-rescue-sketch]')){const item=items[Number(host.dataset.paperRescueSketch)];if(item?.drawing)viewSketches.push(mountExamSketch(host,{strokes:item.drawing.strokes,readOnly:true}));}
  }
  function render(){
    if(disposed||rendering)return;rendering=true;
    try{
      disposeSketches();store.refresh();const run=currentRun();if(runId&&!run){message='找不到這場整卷紀錄，已回到設定頁。';messageError=true;runId=null;questionId=null;}
      container.className='learning-studio exam-room exam-paper';
      container.innerHTML=`${renderExamTabs('paper')}<div class="paper-shell"><header class="paper-header"><div><a href="#exam/progress" data-paper-back>← 備考總覽</a><h1>限時整卷練習</h1><p>保存一次面對整份原卷的作答，再逐題核對與自評。</p></div>${run?'<button type="button" data-paper-new>查看其他紀錄／新練習</button>':''}</header>
        <p class="paper-status" role="status" aria-live="polite" data-paper-status data-error="${messageError||!!store.error}">${esc(message||store.error)}</p>
        ${run?runMarkup(run):setupMarkup()}${rescueMarkup()}
        <footer class="paper-backup"><button type="button" data-paper-retry>重試保存</button><button type="button" data-paper-download>下載整卷備份</button><label class="paper-import-label">還原／併入備份<input data-paper-import type="file" accept="application/json,.json"></label><a href="#" data-paper-recovered-link hidden></a><p>備份包含封存原稿與已銜接的逐題自評。救援檔另含未納入限時原稿的內容，不會自動算分。</p></footer></div>`;
      wire();
    }finally{rendering=false;}
  }
  store.refresh();if(runId){const result=store.checkDeadline(runId,{resumed:true});if(!result.ok){message=result.error;messageError=true;}}
  scratch.flush=flush;guard(store,examStore);render();
  if(typeof window!=='undefined'){
    tickTimer=setInterval(()=>tick(),250);
    listen(window,'focus',()=>tick({resumed:true}));
    listen(window,'pagehide',()=>{flush();if(runId)store.checkDeadline(runId,{resumed:true});});
    listen(window,'storage',event=>{if(event.key?.startsWith('food-exam-paper-v1:')){rememberText();store.refresh();sketch?.flush();render();}});
    if(typeof document!=='undefined')listen(document,'visibilitychange',()=>{if(document.visibilityState==='hidden'){flush();if(runId)store.checkDeadline(runId,{resumed:true});}else tick({resumed:true});});
  }
  const cleanup=()=>{if(disposed)return;flush();disposeSketches();disposed=true;importEpoch++;if(responseTimer!==null)clearTimeout(responseTimer);if(tickTimer!==null)clearInterval(tickTimer);listeners.splice(0).forEach(remove=>remove());container.className=originalClass;};
  cleanup.prepareLeave=prepareLeave;cleanup.flush=flush;return cleanup;
}
