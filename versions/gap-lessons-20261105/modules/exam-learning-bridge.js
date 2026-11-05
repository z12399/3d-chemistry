import {escapeHTML} from './storage.js';
import {questionStatus,nextQuestion} from './exam-engine.js';
import {criterionRemedies,safeRemediationHref} from './exam-remediation.js';
import {withExamReturn} from './exam-return.js';
const esc=value=>escapeHTML(String(value??''));
const GAP_LEVELS=new Set(['missing','partial','unsure']);
const LEVEL_TITLES={met:'有寫清楚',partial:'部分寫到',missing:'尚未寫到',unsure:'待查確認'};
const href=question=>question.type==='text'?'#exam/written?question='+encodeURIComponent(question.id):'#exam?question='+encodeURIComponent(question.id);
const reference=question=>question.examRef?`${question.examRef.year} · ${question.examRef.question}`:'';
export function examRemedyHref(lessonHref,questionId,attemptId) {
  if(!safeRemediationHref(lessonHref)) return '#exam';
  return withExamReturn(lessonHref,{questionId,attemptId});
}

/** Lessons for the points this attempt's self-assessment left open, in rubric
 * order. Only explicit criterion links count; a topic-level link is never a gap remedy. */
export function attemptRemedyQueue(question,attempt){
  const ratings=new Map((attempt?.selfAssessment?.ratings||[]).map(rating=>[rating.criterionId,rating.level]));
  const lessons=new Map(),unmapped=[];let gapCount=0;
  for(const criterion of question?.rubric||[]){
    const level=ratings.get(criterion.id);
    if(!GAP_LEVELS.has(level))continue;
    gapCount++;
    const remedies=criterionRemedies(question,criterion);
    if(!remedies.length){unmapped.push({criterion,level});continue;}
    for(const {scopeNote,...remedy} of remedies){
      if(!lessons.has(remedy.lessonId))lessons.set(remedy.lessonId,{...remedy,gaps:[]});
      lessons.get(remedy.lessonId).gaps.push({criterion,level,scopeNote:scopeNote||''});
    }
  }
  return {items:[...lessons.values()],unmapped,gapCount};
}

/** Where this lesson sits in the exam remedy the user arrived from, if any. */
export function examLessonContext({bank,writtenBank,state,lessonId,subject,examReturn=null}) {
  const questions=[...(bank?.questions||[]),...(writtenBank?.questions||[])].filter(question=>question.subject===subject&&question.remediation?.some(remedy=>remedy.lessonId===lessonId));
  const back=examReturn?questions.find(question=>question.id===examReturn.questionId)||null:null;
  const attempt=back?.type==='text'&&examReturn.attemptId?state?.attempts?.find(item=>item.id===examReturn.attemptId&&item.questionId===back.id&&item.questionVersion===back.version)||null:null;
  const queue=attempt?.selfAssessment&&!attempt.conflicted?attemptRemedyQueue(back,attempt):null;
  const position=queue?queue.items.findIndex(item=>item.lessonId===lessonId):-1;
  const next=queue?queue.items.find((item,index)=>index>position)||null:null;
  const backHref=back?href(back)+(attempt?'&attempt='+encodeURIComponent(attempt.id):''):'';
  const fresh=back&&back.type!=='text'?nextQuestion(bank,state,{domainId:back.domainId,excludeIds:[back.id]}):null;
  return {questions,back,attempt,requestedAttempt:back?examReturn.attemptId||null:null,queue,position,next,backHref,fresh,state,examReturn:back?{questionId:back.id,attemptId:attempt?.id||null}:null};
}

const levelBadge=level=>`<span class="exam-level" data-level="${esc(level)}">${esc(LEVEL_TITLES[level]||level)}</span>`;

/** A short reminder above the lesson: which exam point brought the user here. */
export function renderExamLessonFocus(context) {
  const {back,attempt,requestedAttempt,queue,position,backHref}=context||{};
  if(!back)return '';
  const item=position>=0?queue.items[position]:null;
  const body=back.type!=='text'?'<p>這一課對應這道基礎診斷的觀念。讀完換一道新題檢查，比重看同一題更能看出是否會用。</p>'
    :!attempt?(requestedAttempt?'<p>找不到連結指定的那份原稿；回到題目可查看最近的作答。</p>':'<p>這一課與這道歷屆題相關。讀完回到題目，用自己的話寫一次。</p>')
    :attempt.conflicted?'<p>這份原稿有待釐清的並行作答；回到題目先確認要保留的版本。</p>'
    :!attempt.selfAssessment?'<p>這份原稿還沒保存逐項自評。回去核對要點後，就知道這一課要補哪一點。</p>'
    :item?`<p>這一課對應你在這份原稿自評的缺口；讀的時候找出原稿少寫的那一環：</p><ul class="exam-focus-gaps">${item.gaps.map(gap=>`<li>${levelBadge(gap.level)}<div><strong>${esc(gap.criterion.label)}</strong>${gap.scopeNote?`<small>${esc(gap.scopeNote)}</small>`:''}</div></li>`).join('')}</ul>`
    :'<p>這一課是本題的相關課程；這份原稿的自評沒有把對應要點列為缺口。</p>';
  const count=queue?.items.length?`<span class="exam-focus-count">${position>=0?`補課清單第 ${position+1}／${queue.items.length} 課`:`這份原稿的補課清單共 ${queue.items.length} 課`}</span>`:'';
  return `<section class="exam-lesson-focus" aria-labelledby="exam-lesson-focus-title"><p class="exam-bridge-eyebrow">補課中 · ${back.type==='text'?'歷屆申論':'基礎診斷'}${back.examRef?' · 臺大 '+esc(reference(back)):''}</p><h2 id="exam-lesson-focus-title">${esc(back.title)}</h2>${body}<div class="exam-focus-actions"><a href="${esc(backHref)}">回到這次作答 →</a>${count}</div></section>`;
}

function relatedQuestions(questions,state) {
  const label=question=>{
    const status=questionStatus({questions},state,question.id),latest=status.latest;
    if(latest?.conflicted)return '有待釐清的並行作答';
    if(question.type==='text')return latest?.selfAssessment?'已有原稿與參考自評':latest?.submittedAt?'原稿已提交，待核對要點':status.seen?'已看要點，可再寫一版':'尚未獨立作答';
    return latest?.submittedAt?(latest.correct?(latest.independent?'曾獨立答對':'曾複習答對'):'上次需要補強'):status.seen?'已看解析，待換題檢測':status.hasDraft?'有未完成的草稿':'尚未檢測';
  };
  const base=questions.filter(question=>question.type!=='text'),written=questions.filter(question=>question.type==='text');
  return `<details><summary>${written.length?'本課相關的歷屆題與基礎診斷':'本課相關的基礎診斷'} · ${questions.length} 道</summary><ul>${[...written,...base].map(question=>`<li><div><strong>${question.type==='text'?'歷屆申論':'基礎診斷'} · ${esc(question.title)}</strong><span>${esc(reference(question))} · ${esc(label(question))}</span></div><a href="${esc(href(question))}">${questionStatus({questions},state,question.id).seen?'查看與重練':'獨立試答'} →</a></li>`).join('')}</ul></details>`;
}

/** After the lesson's check step: continue the remedy, or go back and rewrite. */
export function renderExamLessonApply(context) {
  const {questions=[],back,attempt,requestedAttempt,queue,position,next,backHref,fresh,state,examReturn}=context||{};
  if(!questions.length)return '';
  const list=relatedQuestions(questions,state),note='<p class="exam-bridge-note">用作答檢查這段學習的效果；課文讀完不會自動增加備考成績。</p>';
  if(!back)return `<section class="exam-lesson-bridge" aria-labelledby="exam-lesson-bridge-title"><div><p class="exam-bridge-eyebrow">學完，試著用在考題上</p><h2 id="exam-lesson-bridge-title">這一課，我真的會用了嗎？</h2></div>${list}${note}</section>`;
  if(back.type!=='text')return `<section class="exam-lesson-bridge exam-lesson-next" aria-labelledby="exam-lesson-bridge-title"><div><p class="exam-bridge-eyebrow">學完，試著用在考題上</p><h2 id="exam-lesson-bridge-title">用新題檢查「${esc(back.title)}」</h2></div><div class="exam-next-actions">${fresh?`<a class="exam-next-primary" href="${esc(href(fresh))}">換一道未看過的題檢查 →</a>`:''}<a${fresh?'':' class="exam-next-primary"'} href="${esc(backHref)}">回到這次作答 →</a></div>${list}${note}</section>`;
  const items=queue?.items||[];
  const lead=!attempt?(requestedAttempt?'找不到連結指定的那份原稿；回到題目可查看最近的作答。':'讀完這一課，回到題目用自己的話寫一次，再對照要點自評。')
    :attempt.conflicted?'這份原稿有待釐清的並行作答；回到題目先確認要保留的版本。'
    :!queue?'這份原稿還沒保存逐項自評；先回去核對要點，再決定要補哪幾課。'
    :items.length?`這份原稿自評有 ${queue.gapCount} 個要點待補，對應下列 ${items.length} 課。可以依序補完，也可以隨時回去重寫。`
    :queue.gapCount?'這份原稿自評的缺口沒有對應課程；回原題對照參考解說。':'這份原稿的自評沒有列出待補的要點。';
  const queueList=items.length?`<ol class="exam-remedy-queue">${items.map((item,index)=>`<li${index===position?' aria-current="step"':''}><span class="exam-queue-index" aria-hidden="true">${index+1}</span><div><strong>${esc(item.title)}</strong><span>${item.gaps.map(gap=>`${esc(gap.criterion.label)} · ${esc(LEVEL_TITLES[gap.level])}`).join('；')}</span></div>${index===position?'<span class="exam-queue-here">目前這一課</span>':`<a href="${esc(withExamReturn(item.href,examReturn))}">前往這一課 →</a>`}</li>`).join('')}</ol>`:'';
  const unmapped=queue?.unmapped.length&&items.length?`<p class="exam-small">${queue.unmapped.map(gap=>`「${esc(gap.criterion.label)}」`).join('、')}沒有對應課程；回原題對照參考解說。</p>`:'';
  const actions=`<div class="exam-next-actions">${next?`<a class="exam-next-primary" href="${esc(withExamReturn(next.href,examReturn))}">下一課：${esc(next.title)} →</a>`:''}<a${next?'':' class="exam-next-primary"'} href="${esc(backHref)}">${queue?'回到這次作答，準備重寫':'回到這次作答'} →</a></div>`;
  const rewrite=queue?'<p class="exam-bridge-note">讀過課程不會自動改變備考進度。回到原題後按「保留原稿，再寫一次」，寫完重新自評；備考總覽會和首次獨立原稿比較每個要點。</p>':note;
  return `<section class="exam-lesson-bridge exam-lesson-next" aria-labelledby="exam-lesson-bridge-title"><div><p class="exam-bridge-eyebrow">學完，回到考題</p><h2 id="exam-lesson-bridge-title">${items.length?'接下來：補完這份原稿的缺口':'接下來：回到原題檢查'}</h2></div><p class="exam-next-lead">${esc(lead)}</p>${queueList}${unmapped}${actions}${rewrite}${list}</section>`;
}
