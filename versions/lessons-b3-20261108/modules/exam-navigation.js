export function renderExamTabs(active='diagnostic') {
  return `<nav class="exam-room-tabs" aria-label="備考方式"><a href="#exam/progress" ${active==='progress'?'aria-current="page"':''}>備考總覽</a><a href="#exam" ${active==='diagnostic'?'aria-current="page"':''}>基礎診斷</a><a href="#exam/written" ${active==='written'?'aria-current="page"':''}>歷屆題作答</a><a href="#exam/paper" ${active==='paper'?'aria-current="page"':''}>限時整卷</a></nav>`;
}
