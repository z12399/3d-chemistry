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
    if(question.type==='text')return latest?.selfAssessment?'已有答案與參考對答案':latest?.submittedAt?'答案已提交，待核對要點':status.seen?'已看要點，可再寫一版':'尚未獨立作答';
    return latest?.submittedAt?(latest.correct?(latest.independent?'曾獨立答對':'曾複習答對'):'上次需要補強'):status.seen?'已看解析，待換題檢測':status.hasDraft?'有未完成的草稿':'尚未檢測';
  };
  const base=questions.filter(question=>question.type!=='text'),written=questions.filter(question=>question.type==='text');
  const fresh=back?.type!=='text'&&back?nextQuestion(bank,state,{domainId:back.domainId,excludeIds:[back.id]}):null;
  return `<section class="exam-lesson-bridge" aria-labelledby="exam-lesson-bridge-title"><div><p class="exam-bridge-eyebrow">學完，試著用在考題上</p><h2 id="exam-lesson-bridge-title">這一課，我真的會用了嗎？</h2></div>
    ${back?`<p class="exam-bridge-return">你正在補「${esc(back.title)}」的內容。<a href="${esc(backHref)}">回到這次作答 →</a>${fresh?` <a href="${esc(href(fresh))}">換一道未看過的題檢查 →</a>`:''}</p>`:''}
    <details${back?' open':''}><summary>${written.length?'考題與快速測驗':'本課相關的快速測驗'} · ${questions.length} 道</summary><ul>${[...written,...base].map(question=>`<li><div><strong>${question.type==='text'?'歷屆申論':'快速測驗'} · ${esc(question.title)}</strong><span>${esc(reference(question))} · ${esc(label(question))}</span></div><a href="${esc(href(question))}">${questionStatus({questions},state,question.id).seen?'查看與重練':'獨立試答'} →</a></li>`).join('')}</ul></details>
    <p class="exam-bridge-note">用作答檢查這段學習的效果；課文讀完不會自動增加備考成績。</p></section>`;
}
