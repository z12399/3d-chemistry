/** A read-only view joins frozen paper originals to ordinary practice.
 * It never imports an attempt, reveals guidance, assigns a score or writes storage. */
import {buildExamState} from './exam-engine.js';
import {bridgePlanFromRun,paperAttemptId} from './exam-paper-model.js';

const hasAnswer=question=>!!question.response?.trim()||!!question.sketch?.length;
const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right);
export const preparationPaperHref=(runId,questionId)=>'#exam/paper?run='+encodeURIComponent(runId)+(questionId?'&question='+encodeURIComponent(questionId):'');

export function projectPreparationEvidence({bank,events=[],paperState={runs:[]},examLocked=false,paperLocked=false,now=null}={}){
  const warnings=[],origins=new Map(),blocked=new Set(),virtual=[],papers=[];
  if(examLocked)return {state:{schemaVersion:1,attempts:[]},papers:[],warnings:['作答紀錄讀取異常，暫停彙總；請先下載救援備份並核對原資料。']};
  const ordinary=buildExamState(bank,events),existing=new Map(events.map(event=>[event.id,event]));
  if(paperLocked){
    warnings.push('限時整卷紀錄讀取異常；相關原稿與自評暫不計入總覽，請到限時整卷保留救援備份。');
    for(const attempt of ordinary.attempts)if(attempt.id.startsWith('paper:'))blocked.add(attempt.id);
  }else for(const run of paperState.runs||[]){
    const paper={id:run.id,paperId:run.paperId,subject:run.subject,status:run.status,startedAt:run.startedAt,sealedAt:run.sealedAt,
      reason:run.reason,conflicted:!!run.conflicted,deadlinePassed:run.status==='active'&&typeof now==='string'&&now>=run.deadlineAt,total:run.questions.length,answered:run.questions.filter(hasAnswer).length,
      blank:run.questions.filter(question=>!hasAnswer(question)).length,assessed:0,pending:run.questions.length,unavailable:0,
      href:preparationPaperHref(run.id)};
    papers.push(paper);
    for(const [index,question] of run.questions.entries()){
      const attemptId=paperAttemptId(run.id,index),origin={runId:run.id,questionId:question.id,href:preparationPaperHref(run.id,question.id),blank:!hasAnswer(question),conflicted:!!run.conflicted};
      if(run.status!=='sealed')continue;
      origins.set(attemptId,origin);
      if(run.conflicted){blocked.add(attemptId);continue;}
      if(!bank.questions.some(item=>item.id===question.id&&item.version===question.version)){paper.unavailable++;blocked.add(attemptId);continue;}
      try{
        const plan=bridgePlanFromRun(run,question.id);
        if(plan.events.some(event=>existing.has(event.id)&&!same(existing.get(event.id),event)))throw Error('事件識別不符');
        // Exact frozen text and geometry must survive the whole linked ledger,
        // including extra pre-submit operations that share the reserved ID.
        const own=events.filter(event=>event.attemptId===attemptId);
        const preview=buildExamState(bank,[...own,...plan.events]).attempts.find(attempt=>attempt.id===attemptId);
        if(!preview.conflicted&&(preview.response!==question.response||!same(preview.sketch,question.sketch)))throw Error('封存原稿不符');
        virtual.push(...plan.events);
      }catch{
        origin.conflicted=true;paper.conflicted=true;blocked.add(attemptId);
      }
    }
  }
  let state;
  try{state=buildExamState(bank,[...events.filter(event=>!blocked.has(event.attemptId)),...virtual]);}
  catch{
    warnings.push('整卷與逐題紀錄暫時無法合併顯示；原資料仍保留，請到各場整卷核對。');
    state={...ordinary,attempts:ordinary.attempts.filter(attempt=>!attempt.id.startsWith('paper:'))};
  }
  for(const attempt of state.attempts){
    const origin=origins.get(attempt.id);if(origin)attempt.paperOrigin=origin;
  }
  for(const paper of papers){
    paper.assessed=state.attempts.filter(attempt=>attempt.paperOrigin?.runId===paper.id&&!attempt.conflicted&&attempt.selfAssessment).length;
    paper.pending=paper.total-paper.assessed;
  }
  // A conflict cannot silently leave an older independent result looking current.
  // These display-only markers never enter either event ledger.
  for(const id of blocked){
    const origin=origins.get(id);if(!origin)continue;
    const run=paperState.runs.find(item=>item.id===origin.runId),question=run.questions.find(item=>item.id===origin.questionId);
    if(!bank.questions.some(item=>item.id===question.id&&item.version===question.version))continue;
    state.attempts.push({id,questionId:question.id,questionVersion:question.version,startedAt:run.startedAt,submittedAt:run.cutoffAt||run.sealedAt,
      response:question.response,draft:question.response,sketch:question.sketch,available:true,independent:false,conflicted:true,selfAssessment:null,paperOrigin:{...origin,conflicted:true}});
  }
  return {state,papers:papers.sort((a,b)=>b.startedAt.localeCompare(a.startedAt)||b.id.localeCompare(a.id)),warnings};
}

export function readPreparationEvidence(store){
  store.refresh();store.paperStore?.refresh();
  if(!store.paperStore)return {state:store.state,papers:[],warnings:store.error?[store.error]:[]};
  return projectPreparationEvidence({bank:store.bank,events:store.events,paperState:store.paperStore?.state,
    examLocked:store.locked,paperLocked:store.paperStore?.locked,now:store.now()});
}
