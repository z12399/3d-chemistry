/** Local timed practice, not a proctored examination. The ledger preserves wall
 * times and frozen originals; assessment belongs exclusively to ExamStore. */
import {validateSketchOperation,replayExamSketch} from './exam-sketch-state.js';
import {validateExamEvents,buildExamState} from './exam-engine.js';

export const EXAM_PAPER_STORAGE_PREFIX='food-exam-paper-v1:';
export const EXAM_PAPER_SCHEMA_VERSION=1;
export const EXAM_PAPER_MAX_IMPORT_BYTES=32*1024*1024;
export const EXAM_PAPER_TOOLS=Object.freeze(['calculator','notes','web','peopleAi','courseHints','paper']);
const MAX_EVENTS=12000,MAX_TEXT=12000,ID=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/;
const clone=value=>JSON.parse(JSON.stringify(value));
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const id=value=>typeof value==='string'&&ID.test(value);
const time=value=>typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
const errorText=error=>error instanceof Error?error.message:String(error);
const order=(a,b)=>a.seq-b.seq||a.at.localeCompare(b.at)||a.id.localeCompare(b.id);
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const uid=()=>globalThis.crypto?.randomUUID?.()||`p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function keys(value,required){if(!plain(value)||Object.keys(value).length!==required.length||required.some(key=>!Object.hasOwn(value,key)))throw Error('整卷紀錄包含缺少或不支援的欄位。');}
function text(value,max=MAX_TEXT){if(typeof value!=='string'||value.length>max)throw Error('文字格式無效或超過支援長度。');return value;}
function policy(value){keys(value,EXAM_PAPER_TOOLS);if(EXAM_PAPER_TOOLS.some(key=>typeof value[key]!=='boolean'))throw Error('請明確設定本次六類工具的允許條件。');return Object.fromEntries(EXAM_PAPER_TOOLS.map(key=>[key,value[key]]));}
function seen(value){if(!['unseen','seen','unknown'].includes(value))throw Error('已見題狀態無效。');return value;}
function figure(value){
  if(value===null)return null;
  keys(value,['src','url','page','alt','caption','required']);
  text(value.src,2000);text(value.url,2000);text(value.alt,2000);text(value.caption,2000);
  if(!Number.isSafeInteger(value.page)||value.page<1||typeof value.required!=='boolean')throw Error('原題圖像欄位無效。');
  // A restored manifest may only point at a local asset or an HTTPS source.
  if(!/^(?:assets\/[a-zA-Z0-9_./-]+|https:\/\/[^\s]+)$/.test(value.src)||!/^https:\/\/[^\s]+$/.test(value.url)||value.src.split('/').includes('..'))throw Error('原題圖像來源無效。');
  return {src:value.src,url:value.url,page:value.page,alt:value.alt,caption:value.caption,required:value.required};
}
function manifest(value){
  keys(value,['id','subject','bankVersion','totalPoints','questions']);
  if(!id(value.id)||!['chemistry','processing','microbiology'].includes(value.subject)||typeof value.bankVersion!=='string'||value.bankVersion.length>160||!Number.isFinite(value.totalPoints)||value.totalPoints<=0||!Array.isArray(value.questions)||!value.questions.length||value.questions.length>100)throw Error('整卷題目清單無效。');
  const ids=new Set();let previous=0,total=0;
  const questions=value.questions.map(q=>{
    keys(q,['id','version','number','page','points','originalPrompt','originalFigure']);
    if(!id(q.id)||ids.has(q.id)||!Number.isSafeInteger(q.version)||q.version<1||!Number.isSafeInteger(q.number)||q.number<=previous||!Number.isSafeInteger(q.page)||q.page<1||!Number.isFinite(q.points)||q.points<=0||!text(q.originalPrompt).trim())throw Error('原題序、版本或配分無效。');
    ids.add(q.id);previous=q.number;total+=q.points;
    return {id:q.id,version:q.version,number:q.number,page:q.page,points:q.points,originalPrompt:q.originalPrompt,originalFigure:figure(q.originalFigure)};
  });
  if(Math.abs(total-value.totalPoints)>1e-6)throw Error('原題配分與整卷總分不一致。');
  return {id:value.id,subject:value.subject,bankVersion:value.bankVersion,totalPoints:value.totalPoints,questions};
}
export function createExamPaperManifest(bank,paperId){
  const paper=bank?.papers?.find(item=>item.id===paperId);
  if(!paper||!Array.isArray(paper.questionInventory)||paper.questionInventory.length!==paper.totalQuestions)throw Error('這份原卷尚未具有完整題目目錄。');
  const questions=[...paper.questionInventory].sort((a,b)=>a.number-b.number).map(entry=>{
    const q=bank.questions.find(item=>item.id===entry.questionId);
    if(!q||q.type!=='text'||q.subject!==paper.subject||q.maxScore!==entry.originalPoints)throw Error('原卷有尚未提供或配分不一致的申論題，不能開始整卷練習。');
    return {id:q.id,version:q.version,number:entry.number,page:entry.page,points:entry.originalPoints,originalPrompt:q.originalPrompt,originalFigure:q.originalFigure||null};
  });
  return freeze(manifest({id:paper.id,subject:paper.subject,bankVersion:bank.bankVersion,totalPoints:paper.totalPoints,questions}));
}
function event(raw){
  if(!plain(raw)||!id(raw.id)||!id(raw.runId)||raw.runId.length>64||!time(raw.at)||!Number.isSafeInteger(raw.seq)||raw.seq<0)throw Error('整卷事件識別或時間無效。');
  const base=['id','runId','type','at','seq'];let extra={};
  if(raw.type==='start'){
    keys(raw,[...base,'paper','minutes','deadlineAt','toolPolicy','initialSeen']);
    if(raw.seq!==0||!Number.isFinite(raw.minutes)||raw.minutes<1||raw.minutes>1440||!time(raw.deadlineAt)||Date.parse(raw.deadlineAt)!==Date.parse(raw.at)+Math.round(raw.minutes*60000))throw Error('自訂時長或截止時間無效。');
    const paper=manifest(raw.paper);
    if(!Array.isArray(raw.initialSeen)||raw.initialSeen.length!==paper.questions.length)throw Error('缺少逐題已見狀態。');
    const initialSeen=raw.initialSeen.map((item,i)=>{keys(item,['questionId','selfReport','systemSeen']);if(item.questionId!==paper.questions[i].id||typeof item.systemSeen!=='boolean')throw Error('已見狀態與題序不符。');return {questionId:item.questionId,selfReport:seen(item.selfReport),systemSeen:item.systemSeen};});
    extra={paper,minutes:raw.minutes,deadlineAt:raw.deadlineAt,toolPolicy:policy(raw.toolPolicy),initialSeen};
  }else{
    if(raw.seq<1)throw Error('整卷事件順序無效。');
    if(raw.type==='answer'){keys(raw,[...base,'questionId','response']);extra={questionId:raw.questionId,response:text(raw.response)};}
    else if(raw.type==='sketch'){const names=raw.operation==='stroke'?['questionId','operation','stroke']:['questionId','operation'];keys(raw,[...base,...names]);extra={questionId:raw.questionId,...validateSketchOperation({operation:raw.operation,...(Object.hasOwn(raw,'stroke')?{stroke:raw.stroke}:{})})};}
    else if(raw.type==='complete'){keys(raw,[...base,'questionId','value']);if(typeof raw.value!=='boolean')throw Error('自認完成標記無效。');extra={questionId:raw.questionId,value:raw.value};}
    else if(raw.type==='seen'){keys(raw,[...base,'questionId','value']);extra={questionId:raw.questionId,value:seen(raw.value)};}
    else if(raw.type==='tool'){keys(raw,[...base,'questionId','tool','note']);if(raw.questionId!==null&&!id(raw.questionId)||![...EXAM_PAPER_TOOLS,'original-paper'].includes(raw.tool))throw Error('實際工具使用紀錄無效。');extra={questionId:raw.questionId,tool:raw.tool,note:text(raw.note,1000)};}
    else if(raw.type==='clock'){keys(raw,base);}
    else if(raw.type==='seal'){
      keys(raw,[...base,'reason','offlineExpired','sourceIds','snapshot']);
      if(!['submitted','deadline','interrupted'].includes(raw.reason)||typeof raw.offlineExpired!=='boolean'||!Array.isArray(raw.sourceIds)||raw.sourceIds.some(item=>!id(item))||new Set(raw.sourceIds).size!==raw.sourceIds.length||!plain(raw.snapshot))throw Error('整卷封存欄位無效。');
      extra={reason:raw.reason,offlineExpired:raw.offlineExpired,sourceIds:[...raw.sourceIds],snapshot:clone(raw.snapshot)};
    }else throw Error('不支援的整卷事件。');
    if(Object.hasOwn(extra,'questionId')&&extra.questionId!==null&&!id(extra.questionId))throw Error('整卷題目識別無效。');
  }
  return {id:raw.id,runId:raw.runId,type:raw.type,at:raw.at,seq:raw.seq,...extra};
}
function replay(start,events){
  const questions=start.paper.questions.map((q,i)=>({...clone(q),response:'',sketch:[],sketchCanUndo:false,selfComplete:false,updatedAt:null,
    seen:{selfReport:start.initialSeen[i].selfReport,systemSeen:start.initialSeen[i].systemSeen,everReportedSeen:start.initialSeen[i].selfReport==='seen'},_operations:[]}));
  const byId=new Map(questions.map(q=>[q.id,q])),toolUses=[];let latest=start.at,clockUncertain=false;
  for(const e of [...events].sort(order)){
    if(e.type==='start'||e.type==='seal')continue;
    if(e.at<latest)clockUncertain=true;latest=e.at>latest?e.at:latest;
    const q=e.questionId?byId.get(e.questionId):null;
    if(e.questionId&&!q)throw Error('整卷事件不屬於此份原卷。');
    if(e.type==='answer'){q.response=e.response;q.updatedAt=e.at;}
    if(e.type==='sketch'){q._operations.push({operation:e.operation,...(e.stroke?{stroke:e.stroke}:{})});q.updatedAt=e.at;}
    if(e.type==='complete')q.selfComplete=e.value;
    if(e.type==='seen'){q.seen.selfReport=e.value;q.seen.everReportedSeen||=e.value==='seen';}
    if(e.type==='tool')toolUses.push({id:e.id,at:e.at,questionId:e.questionId,tool:e.tool,note:e.note});
  }
  for(const q of questions){const sketch=replayExamSketch(q._operations);q.sketch=sketch.strokes;q.sketchCanUndo=sketch.canUndo;delete q._operations;q.seenStatus=q.seen.systemSeen||q.seen.everReportedSeen?'seen':q.seen.selfReport;q.status=!q.response.trim()&&!q.sketch.length?'blank':q.selfComplete?'self-complete':'partial';}
  return {questions,toolUses,clockUncertain,lastObservedAt:latest};
}
function snapshot(start,events,seal){
  const result=replay(start,events);
  return {...result,clockUncertain:result.clockUncertain||seal.at<result.lastObservedAt,
    startedAt:start.at,deadlineAt:start.deadlineAt,sealedAt:seal.at,reason:seal.reason,offlineExpired:seal.offlineExpired,
    cutoffAt:seal.reason==='deadline'?start.deadlineAt:seal.at,minutes:start.minutes,toolPolicy:clone(start.toolPolicy)};
}
export function validateExamPaperEvents(input){
  if(!Array.isArray(input))throw Error('整卷備份不是事件清單。');
  const byId=new Map();
  for(const raw of input){const e=event(raw),old=byId.get(e.id);if(old&&!equal(old,e))throw Error('同一整卷事件有不同內容；已停止合併。');byId.set(e.id,e);}
  if(byId.size>MAX_EVENTS)throw Error('整卷事件數量超過目前支援範圍，請保留原備份。');
  const events=[...byId.values()].sort((a,b)=>a.runId.localeCompare(b.runId)||order(a,b)),starts=new Map();
  for(const e of events.filter(e=>e.type==='start')){if(starts.has(e.runId))throw Error('同一整卷有多個起始事件。');starts.set(e.runId,e);}
  for(const e of events){
    const start=starts.get(e.runId);if(!start)throw Error('整卷事件缺少起始設定。');
    if(e.type!=='start'&&e.questionId&&!start.paper.questions.some(q=>q.id===e.questionId))throw Error('整卷事件的題目不在原卷中。');
    if(e.type==='seal'){
      const source=e.sourceIds.map(key=>byId.get(key));
      if(!source.some(x=>x?.id===start.id)||source.some(x=>!x||x.runId!==e.runId||x.type==='seal'||x.seq>=e.seq)||!equal(e.snapshot,snapshot(start,source,e)))throw Error('封存原稿與其來源事件不一致，未更動既有原稿。');
      if(e.reason==='deadline'&&e.at<start.deadlineAt||e.offlineExpired&&e.reason!=='deadline')throw Error('截止或離線封存時間無效。');
      if(source.some(x=>!['start','clock'].includes(x.type)&&x.at>=start.deadlineAt))throw Error('截止後的變更不能混入限時原稿。');
    }
  }
  return events;
}
export function buildExamPaperState(input){
  const events=validateExamPaperEvents(input),runs=[];
  for(const start of events.filter(e=>e.type==='start')){
    const own=events.filter(e=>e.runId===start.runId),seals=own.filter(e=>e.type==='seal').sort(order),sealed=seals[0]||null;
    const working=replay(start,own),sourceIds=new Set(sealed?.sourceIds||[]),retainedChanges=sealed?own.filter(e=>e.type!=='seal'&&!sourceIds.has(e.id)).map(e=>e.id):[];
    const seqs=new Set();let concurrent=false;for(const e of own){if(seqs.has(e.seq))concurrent=true;seqs.add(e.seq);}
    const effective=sealed?sealed.snapshot:working;
    runs.push({id:start.runId,paperId:start.paper.id,subject:start.paper.subject,bankVersion:start.paper.bankVersion,totalPoints:start.paper.totalPoints,
      minutes:start.minutes,toolPolicy:clone(start.toolPolicy),startedAt:start.at,deadlineAt:start.deadlineAt,status:sealed?'sealed':'active',
      ...clone(effective),sealedAt:sealed?.at||null,sealEventId:sealed?.id||null,snapshot:sealed?clone(sealed.snapshot):null,
      conflicted:seals.length>1||retainedChanges.length>0||concurrent,sealCount:seals.length,
      sealCandidates:seals.map(e=>({eventId:e.id,snapshot:clone(e.snapshot)})),retainedChanges,workingQuestions:working.questions,
      lastSeq:Math.max(...own.map(e=>e.seq))});
  }
  runs.sort((a,b)=>a.startedAt.localeCompare(b.startedAt)||a.id.localeCompare(b.id));
  return freeze({schemaVersion:EXAM_PAPER_SCHEMA_VERSION,runs});
}
export function paperAttemptId(runId,questionIndex){
  if(!id(runId)||runId.length>64||!Number.isSafeInteger(questionIndex)||questionIndex<0||questionIndex>99)throw Error('整卷與題目識別無效。');
  return `paper:${runId}:q${questionIndex+1}`;
}
function mergeEvents(existing,incoming){return validateExamPaperEvents([...existing,...incoming]);}
export function bridgePlanFromRun(run,questionId){
  if(!run||run.status!=='sealed')throw Error('先交卷或截止封存，才能銜接逐題自評。');
  if(run.conflicted)throw Error('整卷有並行或封存後匯入事件，先保留備份；暫不將有衝突的原稿計分。');
  const index=run.questions.findIndex(q=>q.id===questionId),q=run.questions[index];if(!q)throw Error('找不到本卷題目。');
  const attemptId=paperAttemptId(run.id,index),events=[];
  const add=(type,extra={},at=run.startedAt)=>events.push({id:`${attemptId}:${String(events.length).padStart(6,'0')}:${type}`,type,attemptId,at,...extra});
  add('start',{questionId:q.id,questionVersion:q.version});
  const reasons=new Set(),uses=run.toolUses.filter(use=>use.questionId===null||use.questionId===q.id);
  if(q.seenStatus==='seen')reasons.add('prior-familiarity');
  if(q.seenStatus==='unknown'||run.clockUncertain||run.offlineExpired||run.reason==='interrupted')reasons.add('unverified-conditions');
  if(uses.some(use=>['notes','web','peopleAi'].includes(use.tool)))reasons.add('outside-help');
  if(uses.some(use=>use.tool==='courseHints'))reasons.add('task-breakdown');
  if(uses.some(use=>use.tool!=='original-paper'&&!run.toolPolicy[use.tool]))reasons.add('unverified-conditions');
  for(const reason of [...reasons].sort())add('support',{reason});
  for(const stroke of q.sketch)add('sketch',{operation:'stroke',stroke:clone(stroke)});
  // Blank responses remain submitted-but-unassessed evidence, never an invented
  // zero. ExamStore's import validator accepts such a sealed blank original.
  add('submit',{response:q.response},run.cutoffAt<run.startedAt?run.startedAt:run.cutoffAt);
  return freeze({attemptId,events,runId:run.id,questionId,blank:q.status==='blank'});
}

export class ExamPaperStore {
  constructor(bank,options={}){
    this.bank=bank;this.now=options.now||(()=>new Date().toISOString());this.makeId=options.makeId||uid;this.examStore=options.examStore||null;
    this.events=[];this.volatile=new Map();this.observedHighWater=new Map();this.rawRecovery=[];this.error='';this.locked=false;this.state=freeze({schemaVersion:1,runs:[]});
    try{this.storage=Object.hasOwn(options,'storage')?options.storage:globalThis.localStorage;}catch{this.storage=null;}
    this.refresh();
  }
  refresh(){
    const rawRecovery=[];this.locked=false;
    try{
      const entries=[];
      if(this.storage){for(let i=0;i<this.storage.length;i++){const key=this.storage.key(i);if(key?.startsWith(EXAM_PAPER_STORAGE_PREFIX))rawRecovery.push({key,raw:this.storage.getItem(key)});}
        for(const entry of rawRecovery){const e=JSON.parse(entry.raw);if(entry.key!==EXAM_PAPER_STORAGE_PREFIX+e.id)throw Error('整卷儲存識別不一致。');entries.push(e);}}
      entries.push(...this.volatile.values());const validated=validateExamPaperEvents(entries),state=buildExamPaperState(validated);
      this.events=freeze(validated);this.state=state;this.rawRecovery=[];this.error=!this.storage||this.volatile.size?'整卷原稿目前只保留在此分頁；請重試保存或下載備份。':'';
    }catch(error){this.locked=true;this.rawRecovery=rawRecovery;this.error='整卷紀錄讀取異常，已保留原資料並停止寫入。'+errorText(error);}
    return this.state;
  }
  _flush(){
    if(!this.storage)return false;
    try{for(const pending of [...this.volatile.values()].sort((a,b)=>(a.type==='start'?0:1)-(b.type==='start'?0:1)||a.runId.localeCompare(b.runId)||order(a,b))){
      const key=EXAM_PAPER_STORAGE_PREFIX+pending.id,raw=JSON.stringify(pending),old=this.storage.getItem(key);
      if(old!==null&&old!==raw)throw Error('整卷事件識別衝突。');this.storage.setItem(key,raw);if(this.storage.getItem(key)!==raw)throw Error('整卷保存後讀回不一致。');this.volatile.delete(pending.id);
    }return true;}catch{return false;}
  }
  retryPersist(){this.refresh();if(this.locked)return {ok:false,persisted:false,error:this.error};const persisted=this._flush();this.refresh();return {ok:!this.locked,persisted:persisted&&!this.volatile.size,error:this.error};}
  _append(type,runId,extra={},at=this.now()){
    this.refresh();if(this.locked)return {ok:false,error:this.error};
    const run=this.state.runs.find(item=>item.id===runId);
    if(type!=='start'&&type!=='seal'&&run?.status!=='active')return {ok:false,error:'這份整卷原稿已封存或不存在。',run};
    if(type==='seal'&&run?.status==='sealed')return {...this.retryPersist(),run:this.getRun(runId)};
    if(!['start','seal','clock'].includes(type)&&run&&time(at)&&at>=run.deadlineAt){
      const ended=this.seal(runId,'deadline',{at});return {...ended,ok:false,expired:true,error:ended.error||'已到截止時間；先前保存的原稿已封存。'};
    }
    const e={id:this.makeId(),runId,type,at,seq:type==='start'?0:(run?.lastSeq??0)+1,...extra};
    try{buildExamPaperState([...this.events,e]);}catch(error){return {ok:false,error:errorText(error)};}
    this.volatile.set(e.id,freeze(e));const persisted=this._flush();this.refresh();
    return {ok:!this.locked,persisted:persisted&&!this.volatile.size,error:this.error,run:this.state.runs.find(item=>item.id===runId)};
  }
  start(paperId,{minutes,toolPolicy,seen:seenReports={}}={}){
    this.refresh();if(this.locked)return {ok:false,error:this.error};
    try{
      const paper=createExamPaperManifest(this.bank,paperId);policy(toolPolicy);this.examStore?.refresh();
      if(this.examStore?.locked)throw Error('連結作答紀錄讀取異常，無法核對已見狀態；請先保存救援備份並釐清。');
      const initialSeen=paper.questions.map(q=>({questionId:q.id,selfReport:seen(seenReports[q.id]??'unknown'),systemSeen:
        (this.examStore?.state.attempts||[]).some(a=>a.questionId===q.id)||this.state.runs.some(run=>run.questions.some(item=>item.id===q.id))}));
      const at=this.now();if(!time(at)||!Number.isFinite(minutes)||minutes<1||minutes>1440)throw Error('請設定 1–1,440 分鐘的自訂限時。');
      return this._append('start',this.makeId(),{paper,minutes,deadlineAt:new Date(Date.parse(at)+Math.round(minutes*60000)).toISOString(),toolPolicy:policy(toolPolicy),initialSeen},at);
    }catch(error){return {ok:false,error:errorText(error)};}
  }
  getRun(runId){this.refresh();return this.state.runs.find(run=>run.id===runId)||null;}
  _active(runId){
    const deadline=this.checkDeadline(runId);if(!deadline.ok)return deadline;
    const run=deadline.run;if(run.status!=='active')return {ok:false,error:'這份整卷原稿已封存；修改請另建練習。',run};
    if(run.conflicted)return {ok:false,error:'此整卷有並行事件，請保留備份並釐清後另開練習。',run};
    return {ok:true,run};
  }
  saveAnswer(runId,questionId,response){
    const current=this._active(runId);if(!current.ok)return current;
    const q=current.run.questions.find(q=>q.id===questionId);if(!q)return {ok:false,error:'找不到本卷題目。'};
    if(q.response===response)return {...this.retryPersist(),run:this.getRun(runId)};
    return this._append('answer',runId,{questionId,response});
  }
  sketch(runId,questionId,operation,stroke){
    const current=this._active(runId);if(!current.ok)return current;
    const q=current.run.questions.find(q=>q.id===questionId);if(!q)return {ok:false,error:'找不到本卷題目。'};
    if(operation==='undo'&&!q.sketchCanUndo||operation==='clear'&&!q.sketch.length)return {...this.retryPersist(),run:this.getRun(runId),strokes:q.sketch,canUndo:q.sketchCanUndo};
    let payload;try{payload=validateSketchOperation({operation,...(stroke?{stroke}:{})});}catch(error){return {ok:false,error:errorText(error)};}
    const result=this._append('sketch',runId,{questionId,...payload}),next=result.run?.questions.find(q=>q.id===questionId);
    return {...result,...(next?{strokes:next.sketch,canUndo:next.sketchCanUndo}:{})};
  }
  setComplete(runId,questionId,value){const active=this._active(runId);return active.ok?this._append('complete',runId,{questionId,value}):active;}
  setSeen(runId,questionId,value){const active=this._active(runId);return active.ok?this._append('seen',runId,{questionId,value}):active;}
  noteTool(runId,tool,{questionId=null,note=''}={}){const active=this._active(runId);return active.ok?this._append('tool',runId,{questionId,tool,note}):active;}
  checkDeadline(runId,{resumed=false}={}){
    const run=this.getRun(runId);if(this.locked)return {ok:false,error:this.error};if(!run)return {ok:false,error:'找不到這場整卷練習。'};
    const at=this.now();if(!time(at))return {ok:false,error:'目前時鐘格式無效，原稿已保留。'};
    const highWater=this.observedHighWater.get(runId)>run.lastObservedAt?this.observedHighWater.get(runId):run.lastObservedAt;
    this.observedHighWater.set(runId,at>highWater?at:highWater);
    if(run.status==='active'&&at>=run.deadlineAt)return this.seal(runId,'deadline',{offlineExpired:resumed,at});
    if(run.status==='active'&&at<highWater&&!run.clockUncertain){
      // Preserve the earlier observation before recording the backward reading.
      // Ordinary display ticks keep high-water time in memory; periodic/resume
      // checkpoints retain it across reload without writing on every timer tick.
      if(highWater>run.lastObservedAt){const saved=this._append('clock',runId,{},highWater);if(!saved.ok)return saved;}
      const result=this._append('clock',runId,{},at);return {...result,remainingMs:Math.max(0,Date.parse(run.deadlineAt)-Date.parse(at)),clockUncertain:true};
    }
    if(run.status==='active'&&at>run.lastObservedAt&&(resumed||Date.parse(at)-Date.parse(run.lastObservedAt)>=30000)){
      const result=this._append('clock',runId,{},at);return {...result,remainingMs:Math.max(0,Date.parse(run.deadlineAt)-Date.parse(at)),clockUncertain:result.run?.clockUncertain||false};
    }
    return {ok:true,persisted:!this.volatile.size,error:this.error,run,remainingMs:run.status==='active'?Math.max(0,Date.parse(run.deadlineAt)-Date.parse(at)):0,clockUncertain:run.clockUncertain||at<run.lastObservedAt};
  }
  seal(runId,reason='submitted',{offlineExpired=false,at=this.now()}={}){
    let run=this.getRun(runId);if(this.locked)return {ok:false,error:this.error};if(!run)return {ok:false,error:'找不到這場整卷練習。'};
    if(run.status==='sealed')return {...this.retryPersist(),run:this.getRun(runId)};
    const highWater=this.observedHighWater.get(runId)>run.lastObservedAt?this.observedHighWater.get(runId):run.lastObservedAt;
    if(at<highWater&&!run.clockUncertain){
      if(highWater>run.lastObservedAt){const observed=this._append('clock',runId,{},highWater);if(!observed.ok)return observed;}
      const reversed=this._append('clock',runId,{},at);if(!reversed.ok)return reversed;run=reversed.run;
    }
    if(at>=run.deadlineAt)reason='deadline';
    const source=this.events.filter(e=>e.runId===runId&&e.type!=='seal'&&(['start','clock'].includes(e.type)||e.at<run.deadlineAt)),start=source.find(e=>e.type==='start'),meta={at,reason,offlineExpired};
    return this._append('seal',runId,{reason,offlineExpired,sourceIds:source.map(e=>e.id),snapshot:snapshot(start,source,meta)},at);
  }
  bridgePlan(runId,questionId){
    const run=this.getRun(runId),plan=bridgePlanFromRun(run,questionId),q=run.questions.find(q=>q.id===questionId);
    const current=this.bank.questions.find(item=>item.id===q.id&&item.version===q.version);if(!current)throw Error('此原稿的題目版本已更新；原稿仍保留，暫不能套用新規準。');
    return plan;
  }
  bridgeQuestion(runId,questionId,examStore=this.examStore){
    try{
      if(!examStore)throw Error('需要既有作答儲存庫，才能銜接自評。');
      const plan=this.bridgePlan(runId,questionId);examStore.refresh();
      const preview=buildExamState(examStore.bank,validateExamEvents([...examStore.events,...plan.events])),attempt=preview.attempts.find(a=>a.id===plan.attemptId),original=this.getRun(runId).questions.find(q=>q.id===questionId);
      if(!attempt.conflicted&&(attempt.response!==original.response||!equal(attempt.sketch,original.sketch)))throw Error('既有逐題紀錄與整卷原稿不一致；尚未覆寫或銜接。');
      const result=examStore.import({schemaVersion:1,events:plan.events});
      return {...result,attemptId:plan.attemptId,attempt:result.ok?examStore.state.attempts.find(a=>a.id===plan.attemptId):null};
    }catch(error){return {ok:false,error:errorText(error)};}
  }
  assessmentSummary(runId,examStore=this.examStore){
    const run=this.getRun(runId);if(!run)return null;examStore?.refresh();
    const questions=run.questions.map((q,index)=>{
      const attemptId=paperAttemptId(run.id,index),attempt=examStore?.state.attempts.find(a=>a.id===attemptId)||null;
      let linkValid=false;
      if(attempt&&!examStore?.locked&&run.status==='sealed'&&!run.conflicted){
        const plan=bridgePlanFromRun(run,q.id),own=(examStore?.events||[]).filter(e=>e.attemptId===attemptId);
        linkValid=plan.events.every(expected=>own.some(actual=>equal(actual,expected)))&&attempt.questionId===q.id&&attempt.questionVersion===q.version&&attempt.response===q.response&&equal(attempt.sketch,q.sketch);
      }
      return {questionId:q.id,points:q.points,status:q.status,attemptId,attempt,linkValid,assessment:linkValid&&!attempt.conflicted?attempt.selfAssessment:null};
    });
    const assessed=questions.filter(q=>q.assessment);
    return {runId,questions,evidenceLocked:!!examStore?.locked,evidenceError:examStore?.locked?examStore.error:'',assessed:assessed.length,pending:questions.length-assessed.length,blank:questions.filter(q=>q.status==='blank').length,
      selfScore:assessed.reduce((sum,q)=>sum+q.assessment.score,0),possibleScore:assessed.reduce((sum,q)=>sum+q.assessment.possibleScore,0),maxScoreOfAssessed:assessed.reduce((sum,q)=>sum+q.assessment.maxScore,0)};
  }
  export({examStore=this.examStore}={}){
    this.refresh();examStore?.refresh();
    const attempts=new Set(this.state.runs.flatMap(run=>run.questions.map((_,index)=>paperAttemptId(run.id,index))));
    return JSON.stringify({kind:'exam-paper-backup',schemaVersion:1,bankVersion:this.bank.bankVersion,exportedAt:this.now(),events:this.events,
      examEvidence:{schemaVersion:1,events:(examStore?.events||[]).filter(e=>attempts.has(e.attemptId))},
      ...(this.locked?{recovery:this.rawRecovery}:{}),...(examStore?.locked?{examRecovery:examStore.rawRecovery}: {})},null,2);
  }
  import(value,{examStore=this.examStore}={}){
    this.refresh();if(this.locked)return {ok:false,error:this.error};
    try{
      const raw=typeof value==='string'?value:JSON.stringify(value);if(new TextEncoder().encode(raw).byteLength>EXAM_PAPER_MAX_IMPORT_BYTES)throw Error('整卷備份超過 32 MB，請保留原檔。');
      const data=JSON.parse(raw);if(!plain(data)||data.kind!=='exam-paper-backup'||data.schemaVersion!==1||data.recovery||data.examRecovery)throw Error('請選擇正常的版本 1 整卷備份；救援檔不會自動覆寫。');
      const incoming=validateExamPaperEvents(data.events),merged=mergeEvents(this.events,incoming),mergedState=buildExamPaperState(merged);
      const linked=data.examEvidence||{schemaVersion:1,events:[]};if(linked.schemaVersion!==1)throw Error('連結作答備份版本無效。');
      const evidence=validateExamEvents(linked.events);
      if(evidence.length){
        if(!examStore)throw Error('此備份含逐題自評，請同時提供作答儲存庫以保留評分。');examStore.refresh();if(examStore.locked)throw Error(examStore.error);
        const allowed=new Set(mergedState.runs.flatMap(run=>run.questions.map((_,i)=>paperAttemptId(run.id,i))));
        if(evidence.some(e=>!allowed.has(e.attemptId)))throw Error('備份含不屬於這些整卷的作答紀錄。');
        // Linked assessment must include the actual frozen original, not merely
        // a plausible attempt ID. Additional conflict events remain preservable.
        for(const run of mergedState.runs)for(const [index,q] of run.questions.entries()){
          const own=evidence.filter(e=>e.attemptId===paperAttemptId(run.id,index));if(!own.length)continue;
          // A newly merged branch can conflict with an already valid bridge.
          // Its original seal is still immutable and can be backed up intact.
          const candidates=run.sealCandidates.map(candidate=>bridgePlanFromRun({...run,...candidate.snapshot,conflicted:false},q.id));
          if(!candidates.some(plan=>plan.events.every(expected=>{const actual=own.find(e=>e.id===expected.id);return actual&&equal(actual,expected);})))throw Error('逐題備份與封存原稿不一致，尚未寫入任何資料。');
        }
        const preview=buildExamState(examStore.bank,validateExamEvents([...examStore.events,...evidence]));
        for(const attempt of preview.attempts.filter(a=>evidence.some(e=>e.attemptId===a.id))){
          if(attempt.conflicted)continue;
          const originalCandidates=mergedState.runs.flatMap(run=>run.questions.flatMap((q,i)=>paperAttemptId(run.id,i)===attempt.id?run.sealCandidates.map(candidate=>candidate.snapshot.questions.find(item=>item.id===q.id)):[]));
          if(!originalCandidates.some(q=>q&&attempt.response===q.response&&equal(attempt.sketch,q.sketch)))throw Error('逐題作答或草圖與封存原稿不一致，尚未寫入任何資料。');
        }
      }
      const oldIds=new Set(this.events.map(e=>e.id)),added=merged.filter(e=>!oldIds.has(e.id));
      for(const e of added)this.volatile.set(e.id,freeze(e));const persisted=this._flush();this.refresh();
      const linkedResult=evidence.length?examStore.import({schemaVersion:1,events:evidence}):{ok:true,persisted:true};
      return {ok:!this.locked&&linkedResult.ok,added:added.length,persisted:persisted&&!this.volatile.size&&linkedResult.persisted,error:this.error||linkedResult.error||'',linked:linkedResult};
    }catch(error){return {ok:false,error:errorText(error)};}
  }
}
