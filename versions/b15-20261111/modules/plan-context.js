// 讀書清單帶進課頁：每一課顯示它在清單的位置，以及清單的下一課。
// 純函式（不碰 DOM、不碰儲存）；資料來自 data/study-plan.json（scripts/build-study-plan.mjs 產生）。
import {escapeHTML as esc} from './storage.js';

const fmt = (n) => (Math.round(n * 10) / 10).toString();
const hashOf = (href) => { const i = String(href || '').indexOf('#'); return i < 0 ? '' : String(href).slice(i); };
const SAFE_HASH = /^#(?:learn|process|micro)\/[a-z0-9-]+\/[a-z0-9-]+\/understand$/;

/** 一科的閱讀順序：第一、二輪（含總覽課，照清單頁的順序），再來第三輪（以前考過的在前，與清單頁相同）。 */
export function planSequence(subject) {
  const rest = Array.isArray(subject?.rest) ? subject.rest : [];
  return [...(Array.isArray(subject?.lessons) ? subject.lessons : []), ...rest.filter((l) => l.earlier), ...rest.filter((l) => !l.earlier)]
    .filter((row) => row && typeof row.id === 'string' && SAFE_HASH.test(hashOf(row.href)));
}

/** 這一課在它自己那一科清單裡的位置；找不到回傳 null。subjectId 是 chemistry／processing／microbiology。 */
export function planPosition(plan, subjectId, lessonId) {
  const subject = Array.isArray(plan?.subjects) ? plan.subjects.find((s) => s.id === subjectId) : null;
  if (!subject || !subject.summary) return null;
  const rows = planSequence(subject), index = rows.findIndex((row) => row.id === lessonId);
  if (index < 0) return null;
  const row = rows[index], s = subject.summary;
  // 名次只數有分數的課（總覽課不佔名次），與清單頁的編號一致
  const rank = rows.slice(0, index + 1).filter((r) => (r.round === 1 || r.round === 2) && !r.overview).length;
  let label;
  if (row.overview) label = row.round === 3 ? '主題總覽（第三輪）' : `主題總覽（排在第${row.round === 1 ? '一' : '二'}輪）`;
  else if (row.round === 1) label = `第一輪 第 ${rank}／${s.firstRound} 課`;
  else if (row.round === 2) label = `第二輪 第 ${rank}／${s.askedLessons} 課`;
  else label = row.earlier ? '第三輪（近兩年沒考到，103–113 學年考過）' : '第三輪（近兩年沒考到）';
  const points = !row.overview && Number.isFinite(row.points) && row.points > 0 ? `近兩年對應 ${fmt(row.points)} 分` : '';
  const next = rows[index + 1] || null;
  return {
    subjectName: subject.name, listHref: `./study-plan.html#${subject.mapKey}`, label, points, round: row.round, overview: !!row.overview,
    next: next ? {id: next.id, title: next.title, hash: hashOf(next.href)} : null,
  };
}

/** 課頁上方的一條：清單連結、位置、清單的下一課。 */
export function renderPlanStrip(position) {
  if (!position) return '';
  const next = position.next ? `<a class="plan-strip-next" href="${esc(position.next.hash)}">清單的下一課：${esc(position.next.title)} →</a>` : '';
  return `<aside class="plan-strip" aria-label="這一課在讀書清單的位置"><p class="plan-strip-where"><a href="${esc(position.listHref)}">讀書清單</a><span>${esc(position.subjectName)} · ${esc(position.label)}${position.points ? ` · ${esc(position.points)}` : ''}</span></p>${next}</aside>`;
}

/** 檢查理解那一步最下面的主要按鈕：照清單走的下一課。 */
export function renderPlanNext(position) {
  return position?.next ? `<a class="button-primary learning-primary plan-next" href="${esc(position.next.hash)}">讀書清單的下一課：${esc(position.next.title)} →</a>` : '';
}
