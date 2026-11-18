// 頂欄的「更多」（b31）：原生 <details>，鍵盤（Enter／空白鍵）與觸控本來就能開關；
// 這裡只補三件事：點外面或焦點移出去就收起、按 Esc 收起並回到「更多」、點了選項或換頁（hash）後收起。
const menus = [...document.querySelectorAll('details.site-more')];
const close = (more, focus) => {
  if (!more.open) return;
  more.open = false;
  if (focus) more.querySelector('summary')?.focus();
};
for (const more of menus) {
  more.addEventListener('click', (event) => { if (event.target.closest('a, button')) close(more); });
  more.addEventListener('focusout', (event) => { if (event.relatedTarget && !more.contains(event.relatedTarget)) close(more); });
}
document.addEventListener('click', (event) => { for (const more of menus) if (!more.contains(event.target)) close(more); });
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  for (const more of menus) if (more.open) { event.preventDefault(); close(more, true); }
});
window.addEventListener('hashchange', () => menus.forEach((more) => close(more)));
