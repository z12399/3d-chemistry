import {safeRemediationHref} from './exam-remediation.js';

// The exam question (and attempt) a lesson visit came from. It travels in the
// lesson URL, so moving between the lesson's own steps, reloading or sharing the
// link keeps the same remedy context. Unknown or malformed values are dropped.
const QUESTION_ID=/^[a-z0-9][a-z0-9-]{0,119}$/;
const ATTEMPT_ID=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/;

export function readExamReturn(hash){
  const value=String(hash||''),delimiter=value.indexOf('?');
  if(delimiter<0||!safeRemediationHref(value))return null;
  const params=new URLSearchParams(value.slice(delimiter+1)),questionId=params.get('examReturn'),attemptId=params.get('examAttempt');
  if(!questionId||!QUESTION_ID.test(questionId))return null;
  return {questionId,attemptId:attemptId&&ATTEMPT_ID.test(attemptId)?attemptId:null};
}

export function withExamReturn(lessonHref,context){
  const value=String(lessonHref||'');
  if(!context||!safeRemediationHref(value)||!QUESTION_ID.test(String(context.questionId||'')))return value;
  const [path,query='']=value.split('?'),params=new URLSearchParams(query);
  params.set('examReturn',context.questionId);
  if(typeof context.attemptId==='string'&&ATTEMPT_ID.test(context.attemptId))params.set('examAttempt',context.attemptId);
  else params.delete('examAttempt');
  return path+'?'+params.toString();
}
