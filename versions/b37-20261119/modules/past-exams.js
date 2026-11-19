// 歷屆考題：三科各四節（考什麼／怎麼出／重點放哪／往年回顧），以 114、115 學年為主。
// 讀 data/exam-map.json 與 data/exam-written-bank.json；純函式與 DOM 分開，可在 Node 測試。
export const SUBJECTS = ['chem', 'proc', 'micro'];
export const PRIMARY_YEARS = [114, 115];
export const EARLIER_YEARS = [103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113];
export const SECTION_TITLES = ['考什麼（近兩年）', '怎麼出', '重點放哪', '往年回顧（103–113）'];
const NAME = {chem: '食品化學', proc: '食品加工學', micro: '食品微生物學'};
const BANK_SUBJECT = {chem: 'chemistry', proc: 'processing', micro: 'microbiology'};
const ROOT = {chem: 'learn', proc: 'process', micro: 'micro'};
export const SKILL = {mechanism: '機制推理', recall: '記憶', compare: '比較', calc: '計算', graph: '圖表判讀', structure: '結構', case: '案例', design: '設計'};
const CN = {一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9};
const ROMAN = {I: 1, V: 5, X: 10, L: 50, C: 100};
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));
const pct = v => (Math.round(v * 10) / 10) + '%';

// ---------- 題號比對 ----------
export function chineseToNumber(text) {
  if (!text) return NaN;
  if (text === '十') return 10;
  const i = text.indexOf('十');
  if (i < 0) return text.length === 1 && CN[text] ? CN[text] : NaN;
  const tens = i === 0 ? 1 : CN[text[0]], ones = text.slice(i + 1) ? CN[text.slice(i + 1)] : 0;
  return tens && ones !== undefined ? tens * 10 + ones : NaN;
}
export function romanToNumber(text) {
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const v = ROMAN[text[i]], next = ROMAN[text[i + 1]] || 0;
    if (!v) return NaN;
    n += v < next ? -v : v;
  }
  return n;
}
// 把題號拆成「大題」與「小題」：'9(1)'→{main:'9',sub:'1'}、'五(a)'→{main:'5',sub:'a'}、'I-1'→{main:'1',sub:'1'}、'10a'→{main:'10',sub:'a'}
export function parseQid(qid) {
  const s = String(qid ?? '').trim().replace(/^第/, '').replace(/題/, '').replace(/[（）]/g, ch => (ch === '（' ? '(' : ')'));
  const m = /^([IVXLC]+|[一二三四五六七八九十]+|\d+)(.*)$/.exec(s);
  if (!m) return {main: s, sub: ''};
  const head = m[1];
  const main = /^\d+$/.test(head) ? String(Number(head)) : /^[IVXLC]+$/.test(head) ? String(romanToNumber(head)) : String(chineseToNumber(head));
  const sub = m[2].replace(/[-()\s]/g, '').toLowerCase();
  return {main, sub};
}

// 對應的課：各要點的 remediationLessonIds 聯集（首次出現順序）；要點沒有時用 remediation[0]（同 scripts/build-study-plan.mjs）。
export function lessonsForQuestion(q) {
  const byId = new Map((q?.remediation || []).map(x => [x.lessonId, x]));
  const seen = new Set(), out = [];
  for (const r of q?.rubric || []) {
    const ids = r.remediationLessonIds?.length ? r.remediationLessonIds : (q.remediation || []).slice(0, 1).map(x => x.lessonId);
    for (const id of ids) {
      const l = byId.get(id);
      if (!l || !l.title || seen.has(id)) continue;
      seen.add(id);
      out.push({lessonId: id, title: l.title, href: './index.html' + l.href});
    }
  }
  return out;
}
export const LESSON_LIMIT = 4;

// 找 written-bank 中對應的題：先比大題＋小題；地圖把子題拆列而題庫沒拆時，連到母題。
export function matchWrittenQuestion(bank, year, subjectKey, qid) {
  const want = parseQid(qid);
  const pool = (bank?.questions || []).filter(q => q.examRef && Number(q.examRef.year) === Number(year) && q.subject === BANK_SUBJECT[subjectKey]);
  const parsed = pool.map(q => ({q, ...parseQid(q.examRef.question)}));
  const exact = parsed.find(p => p.main === want.main && p.sub === want.sub);
  const parent = !exact && want.sub ? parsed.find(p => p.main === want.main && p.sub === '') : null;
  const hit = exact || parent;
  if (!hit) return null;
  return {id: hit.q.id, title: hit.q.title, page: hit.q.examRef.page || null, parent: !exact, lessons: lessonsForQuestion(hit.q), href: './exam.html#exam/written?question=' + encodeURIComponent(hit.q.id)};
}

export const paperFor = (map, subjectKey, year) => (map?.papers || []).find(p => p.year === Number(year) && p.subject === subjectKey) || null;
export const pdfHref = (url, page) => url ? url + (page ? '#page=' + page : '') : '';

export function topicRoot(map, topicId) {
  for (const s of Object.values(map?.subjects || {})) for (const l of s.lessons || []) {
    const m = /^#([\w-]+)\/([\w-]+)\//.exec(l.route || '');
    if (m && m[2] === topicId) return m[1];
  }
  return /^proc-/.test(topicId) ? 'process' : /^micro-/.test(topicId) ? 'micro' : 'learn';
}
export const topicHref = (map, topicId) => './index.html#' + topicRoot(map, topicId) + '/' + topicId;
function topicTitle(map, topicId) {
  for (const s of Object.values(map?.subjects || {})) { const t = (s.topics || []).find(x => x.id === topicId); if (t) return t.title; }
  return topicId || '';
}

// ---------- 考什麼（近兩年） ----------
export function questionsForYear(map, subjectKey, year, bank) {
  const paper = paperFor(map, subjectKey, year);
  const bankPaper = (bank?.papers || []).find(p => p.year === Number(year) && p.subject === BANK_SUBJECT[subjectKey]);
  const rows = (map?.questions || []).filter(q => q.year === Number(year) && q.subject === subjectKey).map(q => {
    const match = bank ? matchWrittenQuestion(bank, year, subjectKey, q.qid) : null;
    const inv = bankPaper?.questionInventory?.find(i => String(i.number) === parseQid(q.qid).main);
    return {qid: q.qid, points: q.points ?? null, summary: q.summary, topic: q.topic, topicTitle: topicTitle(map, q.topic), topicHref: q.topic ? topicHref(map, q.topic) : '', skill: q.skill, match, pdf: pdfHref(paper?.url, match?.page || inv?.page)};
  });
  const sum = rows.reduce((a, r) => a + (r.points || 0), 0);
  const mains = new Set(rows.map(r => parseQid(r.qid).main));
  return {year: Number(year), rows, count: bankPaper?.totalQuestions || mains.size, points: bankPaper?.totalPoints || sum, paperUrl: paper?.url || ''};
}

// ---------- 怎麼出 ----------
export function skillRows(subject) {
  const p = subject?.skills?.primary || {}, e = subject?.skills?.earlier || {};
  return Object.keys(SKILL).map(key => ({key, label: SKILL[key], primary: Number(p[key] || 0), earlier: Number(e[key] || 0)}))
    .filter(r => r.primary || r.earlier).sort((a, b) => b.primary - a.primary || b.earlier - a.earlier);
}
export function changeSentences(subject, threshold = 8) {
  return skillRows(subject).filter(r => Math.abs(r.primary - r.earlier) >= threshold)
    .sort((a, b) => Math.abs(b.primary - b.earlier) - Math.abs(a.primary - a.earlier))
    .map(r => r.label + '從 ' + r.earlier + '% ' + (r.primary > r.earlier ? '升到 ' : '降到 ') + r.primary + '%');
}

// ---------- 重點放哪 ----------
export function topicRanking(subject) {
  const topics = subject?.topics || [];
  const rows = topics.filter(t => t.shareP > 0).slice().sort((a, b) => b.shareP - a.shareP || b.shareS - a.shareS);
  const top3 = Math.round(rows.slice(0, 3).reduce((a, t) => a + t.shareP, 0) * 10) / 10;
  const dropped = topics.filter(t => t.shareP === 0 && t.shareS >= 5).sort((a, b) => b.shareS - a.shareS);
  const both = topics.filter(t => t.inBoth).sort((a, b) => b.shareP - a.shareP);
  const max = Math.max(1, ...topics.map(t => Math.max(t.shareP, t.shareS)));
  return {rows, top3, dropped, both, max, totalP: Math.round(rows.reduce((a, t) => a + t.shareP, 0) * 10) / 10};
}

// ---------- 往年回顧 ----------
export const yearLevel = v => (v >= 10 ? 2 : v > 0 ? 1 : 0);
export function historyRows(subject, years = EARLIER_YEARS) {
  return (subject?.topics || []).map(t => ({id: t.id, title: t.title, shareS: t.shareS, levels: years.map(y => yearLevel(Number(t.byYear?.[String(y)] || 0)))}))
    .filter(r => r.levels.some(Boolean)).sort((a, b) => b.shareS - a.shareS);
}

// ---------- HTML 樣板 ----------
const bar = (value, max, cls) => '<span class="pe-bar ' + cls + '"><span style="width:' + (max ? Math.min(100, value / max * 100).toFixed(1) : 0) + '%"></span></span>';

export function lessonsHTML(lessons) {
  if (!lessons || !lessons.length) return '';
  const a = l => '<a href="' + esc(l.href) + '">' + esc(l.title) + '</a>';
  const rest = lessons.slice(LESSON_LIMIT);
  return '<div class="pe-lessons"><span class="pe-lessons-label">對應的課：</span>' + lessons.slice(0, LESSON_LIMIT).map(a).join('・') +
    (rest.length ? '<details class="pe-more"><summary>還有 ' + rest.length + ' 課</summary>' + rest.map(a).join('・') + '</details>' : '') + '</div>';
}

export function yearTableHTML(view) {
  const head = '<p class="pe-yearline">這年共 ' + view.count + ' 題、' + view.points + ' 分' + (view.paperUrl ? '，<a href="' + esc(view.paperUrl) + '" target="_blank" rel="noopener">原卷 PDF →</a>' : '') + '</p>';
  const rows = view.rows.map(r => '<tr><th scope="row" data-label="題號">第 ' + esc(r.qid) + ' 題</th><td data-label="配分">' + (r.points == null ? '—' : r.points + ' 分') + '</td><td data-label="題意" class="pe-sum">' + esc(r.summary) + lessonsHTML(r.match?.lessons) + '</td><td data-label="主題">' + (r.topic ? '<a href="' + esc(r.topicHref) + '">' + esc(r.topicTitle) + '</a>' : '—') + '</td><td data-label="" class="pe-act">' +
    (r.match ? '<a class="pe-write" href="' + esc(r.match.href) + '"' + (r.match.parent ? ' title="連到整題（含這個小題）"' : '') + '>寫這題 →</a>' : r.pdf ? '<a href="' + esc(r.pdf) + '" target="_blank" rel="noopener">原卷 PDF</a>' : '') + '</td></tr>').join('');
  return '<h3>' + view.year + ' 學年</h3>' + head + '<table class="pe-qtable"><thead><tr><th scope="col">題號</th><th scope="col">配分</th><th scope="col">題意</th><th scope="col">主題</th><th scope="col"><span class="pe-sr">動作</span></th></tr></thead><tbody>' + rows + '</tbody></table>';
}

export function subjectPanelHTML(map, bank, key) {
  const s = map.subjects[key];
  const name = s.name || NAME[key];
  // 1 考什麼
  const what = '<section class="pe-sec" aria-labelledby="pe-' + key + '-what"><h2 id="pe-' + key + '-what">' + SECTION_TITLES[0] + '</h2><p class="pe-lead">' + esc(name) + ' 114、115 學年的每一題。題意是改寫的一句話；「寫這題」會開啟逐字題目與參考要點。</p>' +
    PRIMARY_YEARS.slice().reverse().map(y => yearTableHTML(questionsForYear(map, key, y, bank))).join('') + '</section>';
  // 2 怎麼出
  const skills = skillRows(s);
  const smax = Math.max(1, ...skills.map(r => Math.max(r.primary, r.earlier)));
  const changes = changeSentences(s);
  const how = '<section class="pe-sec" aria-labelledby="pe-' + key + '-how"><h2 id="pe-' + key + '-how">' + SECTION_TITLES[1] + '</h2><h3>題型</h3><p class="pe-lead">依配分計算的占比。深色是近兩年（114、115 學年），淺色是 103–113 學年。</p><ul class="pe-bars">' +
    skills.map(r => '<li><span class="pe-label">' + r.label + '</span><span class="pe-pair">' + bar(r.primary, smax, 'now') + bar(r.earlier, smax, 'before') + '</span><span class="pe-num">' + r.primary + '%<small>以前 ' + r.earlier + '%</small></span></li>').join('') + '</ul>' +
    (changes.length ? '<p class="pe-change">' + changes.join('；') + '。</p>' : '') +
    '<h3>出題方向（兩年的觀察）</h3>' + s.direction.map(t => '<p class="pe-dir">' + esc(t) + '</p>').join('') + '</section>';
  // 3 重點放哪
  const rank = topicRanking(s);
  const li = t => '<li><a href="' + esc(topicHref(map, t.id)) + '">' + esc(t.title) + '</a> <small>近兩年 ' + pct(t.shareP) + '・以前 ' + pct(t.shareS) + '</small></li>';
  const focus = '<section class="pe-sec" aria-labelledby="pe-' + key + '-focus"><h2 id="pe-' + key + '-focus">' + SECTION_TITLES[2] + '</h2><p class="pe-lead">各主題占總分的比例，依近兩年由大到小。前三個主題合計占 ' + rank.top3 + '%。</p><ul class="pe-bars pe-topics">' +
    rank.rows.map(t => '<li><span class="pe-label">' + esc(t.title) + '</span><span class="pe-pair">' + bar(t.shareP, rank.max, 'now') + bar(t.shareS, rank.max, 'before') + '</span><span class="pe-num">近兩年占 ' + pct(t.shareP) + '<small>以前 ' + pct(t.shareS) + '</small></span><a class="pe-go" href="' + esc(topicHref(map, t.id)) + '">看課程 →</a></li>').join('') + '</ul>' +
    '<div class="pe-lists"><div><h3>近兩年沒考、以前常考</h3>' + (rank.dropped.length ? '<ul>' + rank.dropped.map(li).join('') + '</ul>' : '<p class="pe-meta">沒有。</p>') + '</div><div><h3>兩年都考</h3>' + (rank.both.length ? '<ul>' + rank.both.map(li).join('') + '</ul>' : '<p class="pe-meta">沒有。</p>') + '</div></div>' +
    '<p class="pe-meta">只有兩年樣本：「近兩年沒考」不等於之後不考。</p></section>';
  // 4 往年回顧
  const hist = historyRows(s);
  const mark = l => (l === 2 ? '<td class="l2" title="占該年 10% 以上">●</td>' : l === 1 ? '<td class="l1" title="有考，不到 10%">○</td>' : '<td></td>');
  const past = '<section class="pe-sec" aria-labelledby="pe-' + key + '-past"><h2 id="pe-' + key + '-past">' + SECTION_TITLES[3] + '</h2><p class="pe-lead">● 占該年 10% 以上　○ 有考但不到 10%　空白＝沒考</p><div class="pe-scroll"><table class="pe-heat"><thead><tr><th scope="col">主題</th>' +
    EARLIER_YEARS.map(y => '<th scope="col">' + y + '</th>').join('') + '</tr></thead><tbody>' +
    hist.map(r => '<tr><th scope="row">' + esc(r.title) + '</th>' + r.levels.map(mark).join('') + '</tr>').join('') +
    '</tbody><tfoot><tr><th scope="row">原卷</th>' + EARLIER_YEARS.map(y => { const p = paperFor(map, key, y); return '<td>' + (p ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener" aria-label="' + y + ' 學年原卷">原卷 →</a>' : '') + '</td>'; }).join('') + '</tr></tfoot></table></div>' +
    '<p class="pe-meta">這 11 年是丙組的考卷；114 年起改為甲組，科目名相同。</p></section>';
  // 節尾：考過但現有課程沒有的內容
  const gaps = (map.directGaps || []).filter(g => g.subject === key);
  const gapBlock = '<section class="pe-sec pe-gaps" aria-labelledby="pe-' + key + '-gaps"><h3 id="pe-' + key + '-gaps">考過但現有課程沒有的內容</h3>' + (gaps.length ? '<ul>' + gaps.map(g => {
    const m = matchWrittenQuestion(bank, g.year, key, g.qid), p = paperFor(map, key, g.year);
    return '<li><b>' + g.year + ' 學年第 ' + esc(g.qid) + ' 題：</b>' + esc(g.summary) + '<div class="pe-meta">課程還沒有：' + esc(g.gap) + '</div>' + (p ? '<a href="' + esc(pdfHref(p.url, m?.page)) + '" target="_blank" rel="noopener">原卷 →</a>' : '') + '</li>';
  }).join('') + '</ul>' : '<p class="pe-meta">近兩年的題目在現有課程中都找得到對應。</p>') + '</section>';
  return what + how + focus + past + gapBlock;
}

// ---------- DOM ----------
export function initTabs(root, onSelect) {
  const tabs = [...root.querySelectorAll('[role=tab]')];
  const select = (key, focus) => {
    if (!SUBJECTS.includes(key)) key = 'chem';
    tabs.forEach(t => {
      const on = t.dataset.subject === key;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    root.querySelectorAll('[role=tabpanel]').forEach(p => { p.hidden = p.dataset.subject !== key; });
    if (onSelect) onSelect(key);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { history.replaceState(null, '', '#' + t.dataset.subject); select(t.dataset.subject); });
    t.addEventListener('keydown', ev => {
      const n = {ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1}[ev.key];
      if (n === undefined) return;
      ev.preventDefault();
      const next = tabs[(n + tabs.length) % tabs.length];
      history.replaceState(null, '', '#' + next.dataset.subject);
      select(next.dataset.subject, true);
    });
  });
  const fromHash = () => select(location.hash.replace('#', ''));
  window.addEventListener('hashchange', fromHash);
  fromHash();
  return select;
}

export function mount(root, data) {
  SUBJECTS.forEach(key => {
    const panel = root.querySelector('#pe-panel-' + key);
    if (panel) panel.innerHTML = subjectPanelHTML(data.map, data.bank, key);
  });
}

function showError(root, err) {
  root.querySelectorAll('[role=tabpanel]').forEach(p => { p.innerHTML = '<div class="pe-sec"><p><b>讀不到考題資料。</b>請重新整理頁面；也可以直接看各年的原卷或到 <a href="./exam.html#exam/written">練習</a> 寫考題。</p><p class="pe-meta">' + esc(err.message) + '</p></div>'; });
}

async function load(url) {
  const res = await fetch(url, {cache: 'no-cache'});
  if (!res.ok) throw new Error(url + ' HTTP ' + res.status);
  return res.json();
}

export async function init(root) {
  initTabs(root);
  try {
    const [map, bank] = await Promise.all([load('./data/exam-map.json'), load('./data/exam-written-bank.json')]);
    mount(root, {map, bank});
  } catch (err) {
    showError(root, err);
  }
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('pe-main');
  if (root) init(root);
}
