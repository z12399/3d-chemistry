/** Exam evidence is separate from lesson progress. Only submitted, unseen items
 * contribute to diagnostic evidence. Local records are a study aid, not a secure exam. */
import {validateSketchOperation,replayExamSketch} from './exam-sketch-state.js';
export const EXAM_STORAGE_PREFIX = 'food-exam-evidence-v1:';
export const EXAM_SCHEMA_VERSION = 1;
export const EXAM_MAX_IMPORT_BYTES = 32 * 1024 * 1024;
const SUBJECTS = {chemistry:'食品化學', processing:'食品加工學', microbiology:'食品微生物學'};
const MAX_EVENTS = 12000;
const MAX_RESPONSE = 12000;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/;
const validId = value => typeof value === 'string' && ID.test(value);
const clone = value => JSON.parse(JSON.stringify(value));
const compare = (a,b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id);
const persistenceOrder = (a,b) => (a.type==='start'?0:1)-(b.type==='start'?0:1) || compare(a,b);
const validTime = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString()===value;
const message = error => error instanceof Error ? error.message : String(error);
function uid() { return globalThis.crypto?.randomUUID?.() || `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`; }
function plain(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype,null].includes(Object.getPrototypeOf(value)); }
function exactKeys(value, keys) { return Object.keys(value).every(key=>keys.includes(key)) && keys.every(key=>Object.hasOwn(value,key)); }
function validateEvent(value) {
  if (!plain(value) || !['start','draft','submit','reveal','self-assess','support','sketch'].includes(value.type) || !validId(value.id) || !validId(value.attemptId) || !validTime(value.at)) throw Error('作答紀錄格式無效。');
  const keys = ['id','type','attemptId','at'];
  if (value.type === 'start') {
    keys.push('questionId','questionVersion');
    if (!validId(value.questionId) || !Number.isSafeInteger(value.questionVersion) || value.questionVersion < 1) throw Error('題目識別或版本無效。');
  }
  if (['draft','submit'].includes(value.type)) {
    keys.push('response');
    if (typeof value.response !== 'string' || value.response.length > MAX_RESPONSE) throw Error('答案格式無效或超過 12,000 字。');
  }
  if(value.type==='self-assess') {
    keys.push('ratings');
    if(!Array.isArray(value.ratings)||value.ratings.length>30) throw Error('對答案項目格式無效。');
    const ids=new Set();
    for(const rating of value.ratings) {
      if(!plain(rating)||!exactKeys(rating,['criterionId','level','evidence'])||!validId(rating.criterionId)||ids.has(rating.criterionId)||!['met','partial','missing','unsure'].includes(rating.level)||typeof rating.evidence!=='string'||rating.evidence.length>MAX_RESPONSE) throw Error('對答案項目或原答引用格式無效。');
      ids.add(rating.criterionId);
    }
  }
  if(value.type==='support') {
    keys.push('reason');
    if(!['task-breakdown','prior-familiarity','outside-help','unverified-conditions'].includes(value.reason)) throw Error('作答輔助類型無效。');
  }
  if(value.type==='sketch'){
    keys.push('operation');if(value.operation==='stroke')keys.push('stroke');
    validateSketchOperation({operation:value.operation,...(Object.hasOwn(value,'stroke')?{stroke:value.stroke}:{})});
  }
  if (!exactKeys(value,keys)) throw Error('作答紀錄含有不支援的欄位。');
  const canonical=Object.fromEntries(keys.map(key=>[key,clone(value[key])]));
  if(canonical.ratings)canonical.ratings=canonical.ratings.map(rating=>({criterionId:rating.criterionId,level:rating.level,evidence:rating.evidence}));
  return canonical;
}
export function validateExamEvents(input) {
  if (!Array.isArray(input) || input.length > MAX_EVENTS) throw Error('作答紀錄數量超過目前支援範圍。');
  const byId = new Map();
  for (const raw of input) {
    const event = validateEvent(raw), old = byId.get(event.id);
    if (old && JSON.stringify(old) !== JSON.stringify(event)) throw Error('同一筆紀錄有不同內容；已停止合併。');
    byId.set(event.id,event);
  }
  const events = [...byId.values()].sort(compare), starts = new Map();
  for (const event of events.filter(event=>event.type==='start')) {
    if (starts.has(event.attemptId)) throw Error('同一次作答有重複起始紀錄。');
    starts.set(event.attemptId,event);
  }
  for (const event of events) {
    const start = starts.get(event.attemptId);
    if (!start || event.at < start.at) throw Error('作答紀錄缺少起始資料或時間順序無效。');
  }
  return events;
}
export function gradeExamResponse(question, response) {
  if (!question || typeof response !== 'string' || !response.trim()) return null;
  if (question.type === 'choice') {
    if (!question.options?.some(option=>option.id===response)) return null;
    return response === question.answer.optionId;
  }
  if (question.type === 'numeric') {
    const text = response.trim().replace(/[−–]/g,'-');
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return null;
    const actual = Number(text), expected = question.answer?.value, tolerance = question.answer?.tolerance ?? 0;
    if (![actual,expected,tolerance].every(Number.isFinite) || tolerance < 0) return null;
    return Math.abs(actual-expected) <= tolerance + Number.EPSILON*Math.max(1,Math.abs(actual),Math.abs(expected))*4;
  }
  return null;
}
export function buildExamState(bank, input) {
  const events = validateExamEvents(input), byAttempt = new Map();
  for (const event of events.filter(event=>event.type==='start')) {
    byAttempt.set(event.attemptId, {id:event.attemptId,questionId:event.questionId,questionVersion:event.questionVersion,startedAt:event.at,
      submittedAt:null,response:'',draft:'',revealedAt:null,supportedAt:null,supportReasons:[],independent:false,correct:null,available:false,conflicted:false,conflictingResponses:[],selfAssessment:null,
      sketch:[],sketchCanUndo:false,sketchConflict:false,conflictingSketch:[],_sketchOperations:[],_lateSketchOperations:[]});
  }
  for (const event of events) {
    const attempt = byAttempt.get(event.attemptId);
    if (event.type === 'draft') attempt.draft = event.response;
    if (event.type === 'reveal' && !attempt.revealedAt) attempt.revealedAt = event.at;
    if (event.type === 'support') {if(!attempt.supportedAt)attempt.supportedAt=event.at;if(!attempt.supportReasons.includes(event.reason))attempt.supportReasons.push(event.reason);}
    if(event.type==='sketch'){
      const operation={operation:event.operation,...(event.stroke?{stroke:event.stroke}:{})};
      if(attempt.submittedAt){attempt.conflicted=true;attempt.sketchConflict=true;attempt._lateSketchOperations.push(operation);}
      else attempt._sketchOperations.push(operation);
    }
    if (event.type === 'submit') {
      if(!attempt.submittedAt) { attempt.response=event.response; attempt.submittedAt=event.at; attempt.submitEventId=event.id; }
      else { attempt.conflicted=true;attempt.conflictingResponses.push({at:event.at,response:event.response}); }
    }
  }
  for(const attempt of byAttempt.values()){
    const sketch=replayExamSketch(attempt._sketchOperations);attempt.sketch=sketch.strokes;attempt.sketchCanUndo=sketch.canUndo;
    if(attempt.sketchConflict)attempt.conflictingSketch=replayExamSketch([...attempt._sketchOperations,...attempt._lateSketchOperations]).strokes;
    delete attempt._sketchOperations;delete attempt._lateSketchOperations;
  }
  const attempts = [...byAttempt.values()].sort((a,b)=>a.startedAt.localeCompare(b.startedAt)||a.id.localeCompare(b.id));
  const submissions = attempts.filter(attempt=>attempt.submittedAt).sort((a,b)=>a.submittedAt.localeCompare(b.submittedAt)||a.submitEventId.localeCompare(b.submitEventId));
  const seen = new Set();
  for (const attempt of submissions) {
    const key = attempt.questionId;
    const question = bank.questions.find(question=>question.id===attempt.questionId && question.version===attempt.questionVersion);
    // A wording/version correction is not a fresh item. Preserve exposure across
    // versions; genuinely new parallel items get a new question ID.
    const exposed = attempts.some(other=>other.questionId===attempt.questionId && ((other.revealedAt && other.revealedAt <= attempt.submittedAt)||(other.supportedAt && other.supportedAt <= attempt.submittedAt)));
    attempt.available = !!question;
    attempt.correct = gradeExamResponse(question,attempt.response);
    const answerable=question?.type==='text'?(!!attempt.response.trim()||attempt.sketch.length>0):attempt.correct!==null;
    attempt.independent = !!question && !seen.has(key) && !exposed && !attempt.conflicted && answerable;
    attempt.draft = attempt.response;
    seen.add(key);
  }
  for (const attempt of attempts) {
    if (!attempt.submittedAt) attempt.available = bank.questions.some(question=>question.id===attempt.questionId && question.version===attempt.questionVersion);
    delete attempt.submitEventId;
  }
  for(const event of events.filter(event=>event.type==='self-assess')) {
    const attempt=byAttempt.get(event.attemptId),question=bank.questions.find(question=>question.id===attempt.questionId&&question.version===attempt.questionVersion);
    if(!attempt.submittedAt||!attempt.revealedAt||event.at<attempt.submittedAt||event.at<attempt.revealedAt) throw Error('對答案必須在提交原答、開啟參考要點之後。');
    if(question&&!attempt.conflicted) attempt.selfAssessment={...scoreWrittenAssessment(question,attempt,event.ratings),at:event.at};
  }
  return {schemaVersion:EXAM_SCHEMA_VERSION,attempts};
}
const normalizeQuote = text => text.replace(/\s+/g,' ').trim();
export function scoreWrittenAssessment(question,attempt,ratings) {
  if(question?.type!=='text'||!Array.isArray(question.rubric)||!attempt?.submittedAt||!attempt.revealedAt) throw Error('先提交申論答案並開啟參考要點，才能對答案。');
  if(attempt.conflicted) throw Error('並行提交的答案需先釐清，不納入對答案分數；請另開一次作答。');
  if(!Array.isArray(ratings)||ratings.length!==question.rubric.length) throw Error('請逐項選擇對答案狀態；不確定的項目可保留待查。');
  const byId=new Map(ratings.map(rating=>[rating.criterionId,rating]));
  if(byId.size!==ratings.length) throw Error('對答案項目不能重複。');
  let score=0,possibleScore=0,assessedCount=0,maxScore=0;
  const original=normalizeQuote(attempt.response);
  for(const item of question.rubric) {
    const rating=byId.get(item.id);
    if(!rating||!['met','partial','missing','unsure'].includes(rating.level)||typeof rating.evidence!=='string') throw Error('對答案項目不符合這份題目的參考規準。');
    if(!Number.isFinite(item.points)||item.points<=0) throw Error('參考規準分值無效。');
    maxScore+=item.points;
    if(['met','partial'].includes(rating.level)) {
      const quote=normalizeQuote(rating.evidence);
      const sketchEvidence=quote==='[封存草圖]'&&attempt.sketch?.length>0;
      if(!sketchEvidence&&(quote.length<Math.max(1,Math.min(8,original.length))||!original.includes(quote))) throw Error('請從已提交的原答複製一句作為依據，或以 [封存草圖] 指向已提交的圖；解析中的新文字不能補算到原答。');
      const points=item.points*(rating.level==='met'?1:0.5);score+=points;possibleScore+=points;assessedCount++;
    } else if(rating.level==='unsure') possibleScore+=item.points;
    else assessedCount++;
  }
  if(Number.isFinite(question.maxScore)&&Math.abs(maxScore-question.maxScore)>0.000001) throw Error('對答案分配總分與題目分值不一致。');
  return {ratings:clone(ratings),score,possibleScore,maxScore,assessedCount,criterionCount:question.rubric.length};
}
export function summarizeWritten(bank,state,{subject}={}) {
  const questions=bank.questions.filter(question=>question.type==='text'&&(!subject||question.subject===subject)).map(question=>{
    const status=questionStatus(bank,state,question.id),attempts=status.attempts;
    const sealed=attempts.filter(attempt=>attempt.submittedAt).sort((a,b)=>a.submittedAt.localeCompare(b.submittedAt)||a.id.localeCompare(b.id));
    const submitted=sealed.filter(attempt=>!attempt.conflicted);
    const latest=status.latest,firstIndependent=submitted.find(attempt=>attempt.independent)||null;
    const latestSealed=sealed.at(-1)||null;
    const assessmentAttempt=latestSealed&&!latestSealed.conflicted&&latestSealed.selfAssessment?latestSealed:null;
    return {...question,latest,firstIndependent,lastSubmitted:submitted.at(-1)||null,assessmentAttempt,status:latest?.submittedAt?(latest.selfAssessment?'self-assessed':'submitted'):latest?'draft':'unwritten'};
  });
  const assessed=questions.filter(question=>question.assessmentAttempt);
  return {total:questions.length,submitted:questions.filter(question=>question.lastSubmitted).length,
    independentSubmitted:questions.filter(question=>question.firstIndependent).length,selfAssessed:assessed.length,
    fullyAssessed:assessed.filter(question=>question.assessmentAttempt.selfAssessment.assessedCount===question.assessmentAttempt.selfAssessment.criterionCount).length,
    partiallyAssessed:assessed.filter(question=>question.assessmentAttempt.selfAssessment.assessedCount<question.assessmentAttempt.selfAssessment.criterionCount).length,
    unassessedCount:questions.filter(question=>question.latest?.submittedAt&&!question.latest.selfAssessment&&!question.latest.conflicted).length,
    selfScore:assessed.reduce((sum,question)=>sum+question.assessmentAttempt.selfAssessment.score,0),
    possibleScore:assessed.reduce((sum,question)=>sum+question.assessmentAttempt.selfAssessment.possibleScore,0),
    maxScoreOfAssessed:assessed.reduce((sum,question)=>sum+question.assessmentAttempt.selfAssessment.maxScore,0),questions};
}
export function questionStatus(bank,state,id) {
  const question = bank.questions.find(question=>question.id===id);
  const attempts = (state?.attempts||[]).filter(attempt=>attempt.questionId===id && attempt.questionVersion===question?.version);
  const ordered = [...attempts].sort((a,b)=>(a.submittedAt||a.startedAt).localeCompare(b.submittedAt||b.startedAt)||a.id.localeCompare(b.id));
  const allVersions=(state?.attempts||[]).filter(attempt=>attempt.questionId===id);
  return {attempts,latest:ordered.at(-1)||null,seen:allVersions.some(attempt=>attempt.submittedAt||attempt.revealedAt||attempt.supportedAt),priorVersionSeen:allVersions.some(attempt=>attempt.questionVersion!==question?.version&&(attempt.submittedAt||attempt.revealedAt||attempt.supportedAt)),hasDraft:[...ordered].reverse().find(attempt=>!attempt.submittedAt)||null};
}
function domainSummary(bank,state,domain) {
  const questionIds = new Set(bank.questions.filter(question=>question.domainId===domain.id).map(question=>question.id));
  const attempts = (state?.attempts||[]).filter(attempt=>questionIds.has(attempt.questionId) && attempt.available && attempt.submittedAt);
  const independent = attempts.filter(attempt=>attempt.independent).sort((a,b)=>a.submittedAt.localeCompare(b.submittedAt)||a.id.localeCompare(b.id));
  const right = new Set(independent.filter(attempt=>attempt.correct).map(attempt=>attempt.questionId));
  const lastWrongIndex=independent.findLastIndex(attempt=>attempt.correct===false);
  const currentRight=new Set(independent.slice(lastWrongIndex+1).filter(attempt=>attempt.correct).map(attempt=>attempt.questionId));
  const lastIndependent = independent.at(-1), lastAttempt = [...attempts].sort((a,b)=>a.submittedAt.localeCompare(b.submittedAt)||a.id.localeCompare(b.id)).at(-1)||null;
  const status = !independent.length ? 'untested' : lastIndependent.correct === false ? 'needs-work' : currentRight.size >= 2 ? 'verified' : 'awaiting-variant';
  const next = bank.questions.find(question=>question.domainId===domain.id && !questionStatus(bank,state,question.id).seen);
  return {...domain,status,tested:independent.length>0,testedCount:new Set(independent.map(attempt=>attempt.questionId)).size,reviewCount:attempts.length-independent.length,correctCount:right.size,currentCorrectCount:currentRight.size,lastIndependentErrorAt:lastWrongIndex>=0?independent[lastWrongIndex].submittedAt:null,independentCount:independent.length,nextQuestionId:next?.id||null,lastAttempt};
}
export function summarizeExam(bank,state,{subject}={}) {
  const domains = bank.domains.filter(domain=>!subject||domain.subject===subject).map(domain=>domainSummary(bank,state,domain));
  const count = list=>({total:list.length,tested:list.filter(domain=>domain.tested).length,independentCorrect:list.filter(domain=>domain.correctCount>0 && domain.status!=='needs-work').length,verified:list.filter(domain=>domain.status==='verified').length});
  const subjects = Object.entries(SUBJECTS).filter(([id])=>!subject||id===subject).map(([id,title])=>({id,title,...count(domains.filter(domain=>domain.subject===id))}));
  const allowed = new Set(bank.questions.filter(question=>!subject||question.subject===subject).map(question=>question.id));
  return {...count(domains),attemptCount:(state?.attempts||[]).filter(attempt=>attempt.submittedAt&&attempt.available&&allowed.has(attempt.questionId)).length,domains,subjects,nextQuestionId:nextQuestion(bank,state,{subject})?.id||null};
}
export function nextQuestion(bank,state,{subject,domainId,excludeIds=[]}={}) {
  const domains = bank.domains.filter(domain=>(!subject||domain.subject===subject)&&(!domainId||domain.id===domainId)).map(domain=>domainSummary(bank,state,domain));
  const order = {'needs-work':0,'untested':1,'awaiting-variant':2,'verified':3};
  domains.sort((a,b)=>order[a.status]-order[b.status]);
  for (const domain of domains) {
    const question = bank.questions.find(question=>question.domainId===domain.id && !excludeIds.includes(question.id) && !questionStatus(bank,state,question.id).seen);
    if (question) return question;
  }
  return null;
}

/** Append-only event keys avoid a shared read/modify/write blob: two tabs saving
 * different attempts cannot erase one another. Scores are always recomputed. */
export class ExamStore {
  constructor(bank,options={}) {
    this.bank=bank; this.events=[]; this.volatile=new Map(); this.rawRecovery=[]; this.error=''; this.locked=false;
    this.now=options.now||(()=>new Date().toISOString()); this.makeId=options.makeId||uid;
    try { this.storage=Object.hasOwn(options,'storage')?options.storage:globalThis.localStorage; }
    catch(error) { this.storage=null; this.error='此瀏覽器暫時不能保存作答紀錄，請下載備份。'; }
    this.refresh();
  }
  refresh() {
    const entries=[], recovery=[]; this.locked=false;
    try {
      if (this.storage) {
        for(let i=0;i<this.storage.length;i++) {
          const key=this.storage.key(i);
          if(!key?.startsWith(EXAM_STORAGE_PREFIX)) continue;
          const raw=this.storage.getItem(key); recovery.push({key,raw});
        }
        for(const {key,raw} of recovery) {
          const event=JSON.parse(raw);
          if(key!==EXAM_STORAGE_PREFIX+event.id) throw Error('作答紀錄的識別不一致。');
          entries.push(event);
        }
      }
      entries.push(...this.volatile.values());
      this.events=validateExamEvents(entries); this.state=buildExamState(this.bank,this.events); this.rawRecovery=[];
      this.error=!this.storage||this.volatile.size?'紀錄目前只保留在此分頁；請下載備份，關閉前不要遺失答案。':'';
    } catch(error) {
      this.locked=true; this.rawRecovery=recovery;
      this.error='作答紀錄讀取異常，已停止寫入並保留原資料。請先下載備份。'+message(error);
      this.state ||= {schemaVersion:EXAM_SCHEMA_VERSION,attempts:[]};
    }
    return this.state;
  }
  _append(type,attemptId,extra={}) {
    this.refresh();
    if(this.locked) return {ok:false,error:this.error};
    let at=this.now();
    const latest=this.events.reduce((value,event)=>event.at>value?event.at:value,'');
    if(latest&&at<=latest) at=new Date(Date.parse(latest)+1).toISOString();
    const event={id:this.makeId(),type,attemptId,at,...extra};
    try { buildExamState(this.bank,[...this.events,event]); }
    catch(error) { return {ok:false,error:message(error)}; }
    this.volatile.set(event.id,event);
    const result=this._persistEvidence();
    return {...result,attempt:this.state.attempts.find(attempt=>attempt.id===attemptId)};
  }
  retryPersistence() {
    return this._persistEvidence();
  }
  _persistEvidence() {
    this.refresh();
    if(this.locked) return {ok:false,persisted:false,error:this.error};
    let persisted=false;
    try {
      if(this.storage) {
        // Persist dependency events first, including a start/draft that was kept
        // in memory during an earlier quota failure. Stop at the first failure.
        for(const pending of [...this.volatile.values()].sort(persistenceOrder)) {
          const key=EXAM_STORAGE_PREFIX+pending.id,raw=JSON.stringify(pending),existing=this.storage.getItem(key);
          if(existing!==null&&existing!==raw) throw Error('紀錄識別重複。');
          this.storage.setItem(key,raw);
          if(this.storage.getItem(key)!==raw) throw Error('保存後讀回不一致。');
          this.volatile.delete(pending.id);
        }
        persisted=true;
      }
    } catch(error) { this.error='保存失敗；答案仍留在此分頁，請下載備份。'+message(error); }
    this.refresh();
    return {ok:true,persisted,error:this.error};
  }
  start(questionId) {
    const question=this.bank.questions.find(question=>question.id===questionId);
    if(!question) return {ok:false,error:'找不到這道題目。'};
    return this._append('start',this.makeId(),{questionId,questionVersion:question.version});
  }
  _attempt(id) { this.refresh(); return this.state.attempts.find(attempt=>attempt.id===id); }
  saveDraft(id,response) {
    const attempt=this._attempt(id);
    if(!attempt||attempt.submittedAt) return {ok:false,error:'這次答案已交出或找不到，請另開一次複習。'};
    if(typeof response!=='string'||response.length>MAX_RESPONSE) return {ok:false,error:'答案最多 12,000 字，請先複製較長的內容。'};
    if(attempt.draft===response) return {...this._persistEvidence(),attempt};
    return this._append('draft',id,{response});
  }
  submit(id,response) {
    const attempt=this._attempt(id);
    if(!attempt||attempt.submittedAt) return {ok:false,error:'這次答案已交出或找不到，請另開一次複習。'};
    const question=this.bank.questions.find(question=>question.id===attempt.questionId&&question.version===attempt.questionVersion);
    if(!question) return {ok:false,error:'題目版本已更新，舊草稿已保留，請回到總覽開啟新題。'};
    if(question.type==='text') {
      if(typeof response!=='string'||(!response.trim()&&!attempt.sketch.length)||response.length>MAX_RESPONSE) return {ok:false,error:'請先寫下自己的作答（最多 12,000 字）或畫出草圖，再提交答案。'};
    } else if(gradeExamResponse(question,response)===null) return {ok:false,error:question.type==='numeric'?'請輸入有效數字（單位已列在欄位旁）。':'請先選一個答案，或選擇先看解析。'};
    return this._append('submit',id,{response});
  }
  reveal(id) {
    const attempt=this._attempt(id);
    if(!attempt) return {ok:false,error:'找不到這次作答。'};
    if(attempt.revealedAt) return {...this._persistEvidence(),attempt};
    return this._append('reveal',id);
  }
  selfAssess(id,ratings) {
    const attempt=this._attempt(id),question=this.bank.questions.find(question=>question.id===attempt?.questionId&&question.version===attempt?.questionVersion);
    try {scoreWrittenAssessment(question,attempt,ratings);}
    catch(error) {return {ok:false,error:message(error)};}
    return this._append('self-assess',id,{ratings});
  }
  noteSupport(id,reason) {
    const attempt=this._attempt(id);
    if(!attempt)return {ok:false,error:'找不到這次作答。'};
    if(attempt.supportReasons.includes(reason))return {...this._persistEvidence(),attempt};
    return this._append('support',id,{reason});
  }
  sketch(id,operation,stroke){
    const attempt=this._attempt(id);
    if(!attempt||attempt.submittedAt)return {ok:false,error:'這次答案已交出或找不到；若要改圖，請保留答案另開一次重寫。'};
    let payload;
    try{payload=validateSketchOperation({operation,...(stroke?{stroke}:{})});}catch(error){return {ok:false,error:message(error)};}
    if((operation==='undo'&&!attempt.sketchCanUndo)||(operation==='clear'&&!attempt.sketch.length))return {...this._persistEvidence(),attempt,strokes:attempt.sketch,canUndo:attempt.sketchCanUndo};
    const result=this._append('sketch',id,payload);
    return {...result,...(result.attempt?{strokes:result.attempt.sketch,canUndo:result.attempt.sketchCanUndo}:{})};
  }
  export() {
    this.refresh();
    return JSON.stringify({schemaVersion:EXAM_SCHEMA_VERSION,bankVersion:this.bank.bankVersion,exportedAt:this.now(),events:this.events,
      ...(this.locked?{recovery:this.rawRecovery}:{} )},null,2);
  }
  import(value) {
    this.refresh();
    if(this.locked) return {ok:false,error:this.error};
    try {
      if(typeof value==='string' && new TextEncoder().encode(value).byteLength>EXAM_MAX_IMPORT_BYTES) throw Error('作答紀錄超過 32 MB，尚未匯入；請保留原檔。');
      const data=typeof value==='string'?JSON.parse(value):value;
      if(!plain(data)||data.schemaVersion!==EXAM_SCHEMA_VERSION||!Array.isArray(data.events)||data.recovery) throw Error('請選擇版本 1 的正常作答備份；救援檔不會自動覆寫現有紀錄。');
      const incoming=validateExamEvents(data.events),byId=new Map(this.events.map(event=>[event.id,event]));
      for(const event of incoming){
        const old=byId.get(event.id);
        if(old&&JSON.stringify(old)!==JSON.stringify(event))throw Error('同一筆紀錄有不同內容；已停止合併。');
        byId.set(event.id,event);
      }
      const merged=validateExamEvents([...byId.values()]);
      buildExamState(this.bank,merged);
      const oldIds=new Set(this.events.map(event=>event.id)), added=merged.filter(event=>!oldIds.has(event.id));
      // All validation happens before the first write. Failed writes remain exportable
      // in memory; append-only keys make a partial import safe to retry.
      for(const event of added) this.volatile.set(event.id,event);
      let persisted=true;
      for(const event of [...merged].sort(persistenceOrder)) {
        if(!this.volatile.has(event.id)) continue;
        try {
          if(!this.storage) throw Error('儲存空間不可用');
          const key=EXAM_STORAGE_PREFIX+event.id,raw=JSON.stringify(event),existing=this.storage.getItem(key);
          if(existing!==null&&existing!==raw) throw Error('同一紀錄已被其他分頁修改');
          this.storage.setItem(key,raw);
          if(this.storage.getItem(key)!==raw) throw Error('讀回不一致');
          this.volatile.delete(event.id);
        } catch(error) { persisted=false; break; }
      }
      this.refresh();
      return {ok:true,added:added.length,persisted,error:this.error};
    } catch(error) { return {ok:false,error:message(error)}; }
  }
}
