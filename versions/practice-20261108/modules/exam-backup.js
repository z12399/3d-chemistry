/** One download preserves both ordinary practice and timed-paper evidence.
 * Validation runs against isolated ledgers before either real ledger is staged. */
import {ExamStore,EXAM_STORAGE_PREFIX,EXAM_MAX_IMPORT_BYTES} from './exam-engine.js';
import {ExamPaperStore,EXAM_PAPER_STORAGE_PREFIX,paperAttemptId} from './exam-paper-model.js';

export const EXAM_PRACTICE_BACKUP_KIND='food-exam-backup';
export const EXAM_PRACTICE_BACKUP_VERSION=2;
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const message=error=>error instanceof Error?error.message:String(error);

class ShadowStorage {
  constructor(){this.items=new Map();}
  get length(){return this.items.size;}
  key(index){return [...this.items.keys()][index]??null;}
  getItem(key){return this.items.get(key)??null;}
  setItem(key,value){this.items.set(key,String(value));}
}

function requireResult(result){if(!result.ok)throw Error(result.error||'備份驗證失敗，尚未更動既有紀錄。');return result;}
function parsedBackup(value){
  const raw=typeof value==='string'?value:JSON.stringify(value);
  if(typeof raw!=='string'||new TextEncoder().encode(raw).byteLength>EXAM_MAX_IMPORT_BYTES)throw Error('備考備份超過 32 MB 或格式無效；尚未匯入，請保留原檔。');
  const data=JSON.parse(raw);if(!plain(data))throw Error('請選擇正常的備考備份。');
  const envelopes=[data,data.exam,data.paper,data.examEvidence,data.paper?.examEvidence];
  if(envelopes.some(item=>plain(item)&&['recovery','examRecovery'].some(key=>Object.hasOwn(item,key))))throw Error('救援檔不會自動覆寫現有紀錄，請保留原檔。');
  return data;
}

export class ExamPracticeStore extends ExamStore {
  constructor(bank,{writtenBank,...options}={}){
    if(!writtenBank||!Array.isArray(writtenBank.papers)||!Array.isArray(writtenBank.questions))throw Error('完整備考儲存庫需要申論原卷題庫。');
    super(bank,options);
    this.writtenBank=writtenBank;
    this.paperStore=new ExamPaperStore(writtenBank,{storage:this.storage,now:this.now,makeId:this.makeId,examStore:this});
  }

  _notePaperExposure(attemptId){
    this.refresh();this.paperStore.refresh();
    const attempt=this.state.attempts.find(item=>item.id===attemptId);
    if(!attempt||attempt.submittedAt||this.bank.questions.find(question=>question.id===attempt.questionId)?.type!=='text')return {ok:true,persisted:!this.volatile.size,attempt};
    const reason=this.paperStore.locked?'unverified-conditions':this.paperStore.state.runs.some(run=>run.questions.some(question=>question.id===attempt.questionId))?'prior-familiarity':null;
    if(reason){const result=this.noteSupport(attemptId,reason);return {...result,attempt:this.state.attempts.find(item=>item.id===attemptId)};}
    return {ok:true,persisted:!this.volatile.size,attempt};
  }

  start(questionId){
    const question=this.bank.questions.find(item=>item.id===questionId);
    if(question?.type!=='text'||!this.paperStore)return super.start(questionId);
    this.refresh();this.paperStore.refresh();
    const reason=this.paperStore.locked?'unverified-conditions':this.paperStore.state.runs.some(run=>run.questions.some(item=>item.id===questionId))?'prior-familiarity':null;
    if(!reason)return super.start(questionId);
    let at=this.now();const latest=this.events.reduce((value,event)=>event.at>value?event.at:value,'');
    if(latest&&at<=latest)at=new Date(Date.parse(latest)+1).toISOString();
    const attemptId=this.makeId();
    // The start and its known exposure are accepted together. At the event cap,
    // failure must not leave an unmarked draft that could look independent.
    const events=[{id:this.makeId(),type:'start',attemptId,at,questionId,questionVersion:question.version},
      {id:this.makeId(),type:'support',attemptId,at:new Date(Date.parse(at)+1).toISOString(),reason}];
    const result=super.import({schemaVersion:1,events});
    return {...result,attempt:result.ok?this.state.attempts.find(item=>item.id===attemptId):undefined};
  }

  submit(attemptId,response){
    const exposure=this._notePaperExposure(attemptId);if(!exposure.ok)return exposure;
    return super.submit(attemptId,response);
  }

  export(){
    return JSON.stringify({kind:EXAM_PRACTICE_BACKUP_KIND,schemaVersion:EXAM_PRACTICE_BACKUP_VERSION,bankVersion:this.bank.bankVersion,exportedAt:this.now(),
      exam:JSON.parse(super.export()),paper:JSON.parse(this.paperStore.export({examStore:this}))},null,2);
  }

  retryPersistence(){
    const exam=super.retryPersistence();
    if(!this.paperStore)return exam;
    const paper=this.paperStore.retryPersist(),errors=[exam.error,paper.error].filter(Boolean);
    return {ok:exam.ok&&paper.ok,persisted:exam.persisted&&paper.persisted,error:[...new Set(errors)].join(' '),exam,paper};
  }

  _previewArchive(data){
    this.refresh();this.paperStore.refresh();
    if(this.locked||this.paperStore.locked)throw Error([this.error,this.paperStore.error].filter(Boolean).join(' '));
    const beforeExam=JSON.stringify(this.events),beforePaper=JSON.stringify(this.paperStore.events),storage=new ShadowStorage();
    // Seed validated current events directly. Re-importing a current export as a
    // bootstrap would incorrectly make incoming data responsible for historical
    // branches or conflicts that the user is trying to preserve.
    for(const event of this.events)storage.setItem(EXAM_STORAGE_PREFIX+event.id,JSON.stringify(event));
    for(const event of this.paperStore.events)storage.setItem(EXAM_PAPER_STORAGE_PREFIX+event.id,JSON.stringify(event));
    const exam=new ExamStore(this.bank,{storage,now:this.now,makeId:this.makeId});
    const paper=new ExamPaperStore(this.writtenBank,{storage,now:this.now,makeId:this.makeId,examStore:exam});
    if(data.kind===EXAM_PRACTICE_BACKUP_KIND){
      if(data.schemaVersion!==EXAM_PRACTICE_BACKUP_VERSION||!plain(data.exam)||!plain(data.paper))throw Error('請選擇版本 2 的完整備考備份。');
      requireResult(exam.import(data.exam));
      requireResult(paper.import(data.paper,{examStore:exam}));
    }else requireResult(paper.import(data,{examStore:exam}));

    // A full archive can introduce linked evidence through its ordinary ledger,
    // while the paper section contains no duplicate of that evidence. Validate
    // every merged relationship, including already-held linked attempts. Use
    // one run per envelope so the 32 MB input cap is not applied to the sum of
    // all previously saved sessions when restoring one small additional file.
    for(const run of paper.state.runs){
      const attempts=new Set(run.questions.map((_,index)=>paperAttemptId(run.id,index)));
      const linked=exam.events.filter(event=>attempts.has(event.attemptId));if(!linked.length)continue;
      requireResult(paper.import({kind:'exam-paper-backup',schemaVersion:1,events:paper.events.filter(event=>event.runId===run.id),
        examEvidence:{schemaVersion:1,events:linked}},{examStore:exam}));
    }
    this.refresh();this.paperStore.refresh();
    if(this.locked||this.paperStore.locked||beforeExam!==JSON.stringify(this.events)||beforePaper!==JSON.stringify(this.paperStore.events))throw Error('預驗期間紀錄有變更；尚未寫入備份，請重新匯入。');
    return {examEvents:exam.events,paperEvents:paper.events};
  }

  import(value){
    try{
      const data=parsedBackup(value);
      // Paper bridging deliberately uses the existing schema-1 path. It must
      // not recurse into a full archive import or create a second paper store.
      if(!Object.hasOwn(data,'kind')&&data.schemaVersion===1)return super.import(data);
      if(data.kind!==EXAM_PRACTICE_BACKUP_KIND&&data.kind!=='exam-paper-backup')throw Error('不支援這種備份；請選擇完整備考、舊版逐題或整卷備份。');
      const preview=this._previewArchive(data),examIds=new Set(this.events.map(event=>event.id)),paperIds=new Set(this.paperStore.events.map(event=>event.id));
      const examAdded=preview.examEvents.filter(event=>!examIds.has(event.id)),paperAdded=preview.paperEvents.filter(event=>!paperIds.has(event.id));
      // Stage both complete ledgers before attempting storage. A quota failure
      // in either half leaves all accepted evidence available to export/retry.
      for(const event of examAdded)this.volatile.set(event.id,event);
      for(const event of paperAdded)this.paperStore.volatile.set(event.id,event);
      const result=this.retryPersistence();
      return {...result,added:examAdded.length+paperAdded.length,examAdded:examAdded.length,paperAdded:paperAdded.length};
    }catch(error){return {ok:false,persisted:false,error:message(error)};}
  }
}
