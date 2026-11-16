import {escapeHTML} from './storage.js';
import {questionStatus,nextQuestion} from './exam-engine.js';
const esc=value=>escapeHTML(String(value??''));
const href=question=>question.type==='text'?'#exam/written?question='+encodeURIComponent(question.id):'#exam?question='+encodeURIComponent(question.id);
const lessonRoute=/^#(learn|process|micro)\/([a-z0-9-]+)\/([a-z0-9-]+)\/(understand|observe|check)$/;
const evidenceId=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/;
/** Return context belongs to one lesson, not to the whole learning session. */
export function examLessonReturnContext(hash='') {
  if(typeof hash!=='string'||hash.length>2048||hash.indexOf('?')!==hash.lastIndexOf('?'))return null;
  const [path,query='']=hash.split('?'),match=path.match(lessonRoute);
  if(!match)return null;
  const params=new URLSearchParams(query),questionId=params.get('examReturn'),attemptId=params.get('examAttempt');
  if(params.getAll('examReturn').length!==1||!evidenceId.test(questionId||''))return null;
  if(params.has('examAttempt')&&(params.getAll('examAttempt').length!==1||!evidenceId.test(attemptId||'')))return null;
  const pathParams=new URLSearchParams(params);pathParams.delete('examReturn');pathParams.delete('examAttempt');
  const pathQuery=pathParams.toString();
  return {root:match[1],topicId:match[2],lessonId:match[3],questionId,attemptId,pathContextHash:path+(pathQuery?'?'+pathQuery:'')};
}
export function withExamLessonReturn(href,context) {
  if(!context)return href;
  const [path,query='']=String(href).split('?'),match=path.match(lessonRoute);
  if(!match||match[1]!==context.root||match[2]!==context.topicId||match[3]!==context.lessonId)return href;
  const params=new URLSearchParams(query);params.set('examReturn',context.questionId);
  if(context.attemptId)params.set('examAttempt',context.attemptId);else params.delete('examAttempt');
  return path+'?'+params.toString();
}
export function examRemedyHref(lessonHref,questionId,attemptId) {
  if(!/^#(?:learn|process|micro)\/[a-z0-9-]+\/[a-z0-9-]+\/(?:understand|observe|check)(?:\?|$)/.test(lessonHref)) return '#exam';
  const [path,query='']=lessonHref.split('?'),params=new URLSearchParams(query);params.set('examReturn',questionId);
  if(typeof attemptId==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/.test(attemptId))params.set('examAttempt',attemptId);
  return path+'?'+params.toString();
}
export function renderExamLessonBridge({bank,writtenBank,state,lessonId,subject,hash=''}) {
  const questions=[...(bank?.questions||[]),...(writtenBank?.questions||[])].filter(question=>question.subject===subject&&question.remediation?.some(remedy=>remedy.lessonId===lessonId));
  if(!questions.length)return '';
  const returnContext=examLessonReturnContext(hash),backId=returnContext?.questionId;
  const back=questions.find(question=>question.id===backId);
  const requestedAttempt=returnContext?.attemptId;
  const backAttempt=back&&state?.attempts?.find(attempt=>attempt.id===requestedAttempt&&attempt.questionId===back.id&&attempt.questionVersion===back.version);
  const backHref=back?href(back)+(backAttempt?'&attempt='+encodeURIComponent(backAttempt.id):''):'';
  const reference=question=>question.examRef?`${question.examRef.year} · ${question.examRef.question}`:'';
  const label=question=>{
    const status=questionStatus({questions},state,question.id),latest=status.latest;
    if(latest?.conflicted)return '有待釐清的並行作答';
    if(question.type==='text')return latest?.selfAssessment?'已寫並對過要點':latest?.submittedAt?'已交卷，還沒對要點':status.seen?'看過要點，可再寫':'還沒寫';
    return latest?.submittedAt?(latest.correct?(latest.independent?'答對過':'複習後答對'):'上次答錯'):status.seen?'看過解析':status.hasDraft?'有未完成的草稿':'還沒做';
  };
  const base=questions.filter(question=>question.type!=='text'),written=questions.filter(question=>question.type==='text');
  const fresh=back?.type!=='text'&&back?nextQuestion(bank,state,{domainId:back.domainId,excludeIds:[back.id]}):null;
  const row=(question,again,first)=>{const seen=questionStatus({questions},state,question.id).seen;return `<li><div><strong>${esc(question.title)}</strong><span>${question.type==='text'?esc(reference(question)):'快速測驗'} · ${esc(label(question))}</span></div><a href="${esc(href(question))}">${seen?again:first} →</a></li>`;};
  const returnLine=back?`<p class="exam-bridge-return">你正在補「${esc(back.title)}」的內容。<a href="${esc(backHref)}">回到這次作答 →</a>${fresh?` <a href="${esc(href(fresh))}">換一道未看過的題檢查 →</a>`:''}</p>`:'';
  const groups=[['exam-lesson-bridge-title','考過這一課的題目',written,'再寫一次','寫這題'],['exam-lesson-bridge-quiz-title','這一課的快速測驗',base,'再做一次','做這題']].filter(item=>item[2].length);
  const body=groups.map(([id,title,items,again,first],index)=>`<h2 id="${id}">${title}</h2>${index===0?returnLine:''}
    <ul>${items.map(question=>row(question,again,first)).join('')}</ul>`).join('');
  return `<section class="exam-lesson-bridge" aria-labelledby="${groups[0][0]}">${body}</section>`;
}
