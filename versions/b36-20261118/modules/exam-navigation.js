const TABS=[['written','#exam/written','寫考題'],['paper','#exam/paper','限時整卷'],['diagnostic','#exam','快速測驗']];
export function renderExamTabs(active='diagnostic') {
  return `<nav class="exam-room-tabs" aria-label="練習方式">${TABS.map(([id,href,label])=>`<a href="${href}" ${active===id?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
}
/** 另外兩種練習（b31）：放在頁面說明之後，不夾在分頁與大標題之間。 */
export function renderOtherPractice() {
  return `<p class="exam-other-practice">其他練習：<a href="./terms.html">名詞解釋（食品微生物）</a> · <a href="./structures.html">畫結構（食品化學）</a></p>`;
}
