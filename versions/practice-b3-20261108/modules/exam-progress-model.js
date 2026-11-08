import {summarizeExam,questionStatus,nextQuestion} from './exam-engine.js';
import {criterionRemedies} from './exam-remediation.js';

export const PREPARATION_SUBJECTS = {chemistry:'食品化學',processing:'食品加工學',microbiology:'食品微生物學'};
const LEVELS=['met','partial','missing','unsure','unassessed'];
const emptyLevels=()=>Object.fromEntries(LEVELS.map(level=>[level,0]));
const severity={partial:1,missing:0,unsure:2,unassessed:3,met:4};
export const writtenQuestionHref=id=>'#exam/written?question='+encodeURIComponent(id);
const attemptHref=attempt=>attempt?.paperOrigin?.href||writtenQuestionHref(attempt.questionId)+'&attempt='+encodeURIComponent(attempt.id);
const hasAnswer=attempt=>!!attempt.response?.trim()||!!attempt.sketch?.length;

/** A rubric summary describes the user's latest sealed draft, not the official
 * exam score. Unwritten/unassessed points remain explicitly unknown. */
export function preparationQuestion(question,state,bank){
  const status=questionStatus(bank,state,question.id);
  const submitted=status.attempts.filter(a=>a.submittedAt).sort((a,b)=>a.submittedAt.localeCompare(b.submittedAt)||a.id.localeCompare(b.id));
  const latest=submitted.at(-1)||null,first=submitted.find(a=>a.independent&&!a.conflicted)||null;
  const assessment=latest&&!latest.conflicted?latest.selfAssessment:null;
  const ratingMap=new Map((assessment?.ratings||[]).map(r=>[r.criterionId,r]));
  const firstRatings=new Map((first?.selfAssessment?.ratings||[]).map(r=>[r.criterionId,r]));
  const levels=emptyLevels();let improved=0,regressed=0,resolved=0;
  const criteria=(question.rubric||[]).map(item=>{
    const rating=ratingMap.get(item.id),level=rating?.level||'unassessed',before=firstRatings.get(item.id)?.level||'unassessed';
    levels[level]++;
    if(first&&latest&&first.id!==latest.id&&assessment&&first.selfAssessment){
      const rank={missing:0,partial:1,met:2};
      if(before in rank&&level in rank){if(rank[level]>rank[before])improved++;if(rank[level]<rank[before])regressed++;}
      else if(['unsure','unassessed'].includes(before)&&level in rank)resolved++;
    }
    return {...item,level,before,evidence:rating?.evidence||''};
  });
  const draft=status.latest&&!status.latest.submittedAt?status.latest:null;
  const hasOlderDrafts=status.attempts.some(a=>!a.submittedAt&&a.id!==draft?.id);
  const conflicted=latest?.conflicted===true;
  const blank=!!latest&&!hasAnswer(latest);
  const stateLabel=conflicted?'conflict':!latest?draft?'draft':'unwritten':!latest.selfAssessment?blank?'blank':'unchecked':levels.missing||levels.partial?'needs-work':levels.unsure?'uncertain':'self-met';
  const sealedHref=latest?attemptHref(latest):null,draftHref=draft?attemptHref(draft):null;
  return {question,latest,first,draft,hasOlderDrafts,criteria,levels,state:stateLabel,independent:!!first,submitted:submitted.some(a=>!a.conflicted&&hasAnswer(a)),sealed:submitted.some(a=>!a.conflicted),blank,
    assessed:!!assessment,fullyAssessed:!!assessment&&!levels.unsure&&!levels.unassessed,
    improved,regressed,resolved,hasCompared:!!first?.selfAssessment&&!!assessment&&first.id!==latest.id,
    href:sealedHref||draftHref||writtenQuestionHref(question.id),sealedHref,draftHref};
}
function aggregate(rows,totalQuestions){
  const levels=emptyLevels();for(const row of rows)for(const level of LEVELS)levels[level]+=row.levels[level];
  return {total:totalQuestions,available:rows.length,submitted:rows.filter(r=>r.submitted).length,
    independent:rows.filter(r=>r.independent).length,assessed:rows.filter(r=>r.assessed).length,
    fullyAssessed:rows.filter(r=>r.fullyAssessed).length,needsWork:rows.filter(r=>r.levels.missing||r.levels.partial).length,
    uncertain:rows.filter(r=>r.levels.unsure).length,unwritten:Math.max(0,totalQuestions-rows.filter(r=>r.submitted).length),
    selfMet:rows.filter(r=>r.state==='self-met').length,levels,criterionCount:rows.reduce((n,r)=>n+r.criteria.length,0),
    sealed:rows.filter(r=>r.sealed).length,blank:rows.filter(r=>r.blank&&!r.assessed).length,
    compared:rows.filter(r=>r.hasCompared).length,improved:rows.reduce((n,r)=>n+r.improved,0),regressed:rows.reduce((n,r)=>n+r.regressed,0)};
}
export function summarizePreparation({bank,writtenBank,state,subject,papers=[]}={}){
  state||={attempts:[]};writtenBank||={questions:[],papers:[]};
  const rows=(writtenBank.questions||[]).filter(q=>q.type==='text'&&(!subject||q.subject===subject)).map(q=>preparationQuestion(q,state,writtenBank));
  const paperDefinitions=(writtenBank.papers||[]).filter(p=>!subject||p.subject===subject);
  const expected=paperDefinitions.reduce((n,p)=>n+(Number.isSafeInteger(p.totalQuestions)&&p.totalQuestions>0?p.totalQuestions:0),0);
  const total=Math.max(expected,rows.length),summary=aggregate(rows,total);
  const subjects=Object.entries(PREPARATION_SUBJECTS).filter(([id])=>!subject||id===subject).map(([id,title])=>{
    const selected=rows.filter(row=>row.question.subject===id),expected=paperDefinitions.filter(p=>p.subject===id).reduce((n,p)=>n+(p.totalQuestions||0),0);
    return {id,title,...aggregate(selected,Math.max(expected,selected.length)),rows:selected};
  });
  const gaps=rows.flatMap(row=>row.criteria.filter(c=>['missing','partial','unsure'].includes(c.level)).map(criterion=>({questionId:row.question.id,questionTitle:row.question.title,subject:row.question.subject,criterion,href:row.sealedHref||row.href,attemptId:row.latest?.id,remediation:criterionRemedies(row.question,criterion)})))
    .sort((a,b)=>severity[a.criterion.level]-severity[b.criterion.level]);
  const nextRow=rows.find(r=>r.state==='conflict')||rows.find(r=>r.draft)||rows.find(r=>r.state==='unchecked')||rows.find(r=>r.state==='needs-work')||rows.find(r=>r.state==='uncertain')||rows.find(r=>r.state==='blank')||rows.find(r=>r.state==='unwritten');
  let next=null;
  if(nextRow){
    const reason=nextRow.state==='conflict'?'conflict':nextRow.draft?'draft':nextRow.state;
    const text={conflict:['先核對兩份同時提交的原稿','核對原稿'],draft:['接著寫完這份原稿','繼續作答'],unchecked:['先找出原稿缺了哪些要點','開始核對'],blank:['這題交卷時留白，先回看卡住的地方','查看空白原稿'],uncertain:['把待確認的要點釐清','繼續核對'],unwritten:[summary.submitted?'再寫一道尚未練過的原題':'先寫一道原題，看看卡在哪裡','開始作答'],'needs-work':['補好這題的缺口，再保留原稿重寫','回到作答與補課']};
    const [title,label]=text[reason]||text.unwritten;next={title,label,questionTitle:nextRow.question.title,questionId:nextRow.question.id,href:reason==='draft'?nextRow.draftHref:nextRow.href,reason};
  }
  const selectedPapers=papers.filter(paper=>!subject||paper.subject===subject);
  const active=papers.filter(paper=>paper.status==='active').sort((a,b)=>(a.deadlineAt||a.startedAt).localeCompare(b.deadlineAt||b.startedAt)||a.id.localeCompare(b.id))[0];
  // A running or expired-but-unsealed paper remains the actionable priority.
  // Historical gaps must not steer a learner away while this clock is running.
  if(active)next={title:active.deadlinePassed?'這場練習已到截止時間，回去核對原稿':'先回到仍在計時的整卷',label:active.deadlinePassed?'查看到期練習':'繼續這場整卷',questionTitle:PREPARATION_SUBJECTS[active.subject]+' · 已留下 '+active.answered+' / '+active.total+' 題內容',href:active.href,reason:'active-paper'};
  const diagnostic=bank?.domains&&bank?.questions?summarizeExam(bank,state,subject?{subject}:{}):null;
  const nextDiagnostic=bank?.domains?nextQuestion(bank,state,subject?{subject}:{}):null;
  return {...summary,subjects,rows,gaps,next,diagnostic,nextDiagnostic,papers:selectedPapers,years:[...new Set(paperDefinitions.map(p=>p.year).filter(Boolean))]};
}
