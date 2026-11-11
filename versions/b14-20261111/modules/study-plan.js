// 課程：依考試重點排（study-plan.html）。資料由 scripts/build-study-plan.mjs 產生的 data/study-plan.json 提供：
// 每一課「近兩年對應的分數」＝114、115 學年各題參考要點的配分，平均分給要點標示要讀的課。
// 這裡只負責呈現：每科一句「要讀多少」、三輪清單、以及這個瀏覽器裡做過自測的課。
export const SUBJECT_KEYS = Object.freeze({chem: 'chemistry', proc: 'processing', micro: 'microbiology'});
const STORAGE_KEYS = Object.freeze({chemistry: 'food-chemistry-learning-v1', processing: 'food-processing-learning-v1', microbiology: 'food-microbiology-learning-v1'});
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** 這個瀏覽器裡做過自測（選過答案）的課 id。讀不到或格式不對就當作沒有。 */
export function attemptedLessons(storage) {
  const done = new Set();
  for (const key of Object.values(STORAGE_KEYS)) {
    try {
      const records = JSON.parse(storage?.getItem(key) || 'null')?.records;
      if (records && typeof records === 'object') for (const [id, record] of Object.entries(records)) if (Number.isInteger(record?.answer)) done.add(id);
    } catch { /* 損壞的紀錄不影響清單 */ }
  }
  return done;
}

/** 一句話說清楚這科要讀多少。 */
export function headline(subject) {
  const s = subject.summary;
  return `${subject.name}共 ${s.courseLessons} 課。近兩年（114、115 學年）的 ${s.questions} 題考題用到其中 ${s.askedLessons} 課；先讀分數最集中的 ${s.firstRound} 課，就涵蓋近兩年 ${s.firstRoundShare}% 的分數（前 ${s.halfLessons} 課就過半）。${s.overviewLessons ? `另有 ${s.overviewLessons} 課主題總覽，排在它涵蓋的課前面，不算在課數裡。` : ''}`;
}

/** 三輪的課數與已做過自測的課數。 */
export function rounds(subject, done = new Set()) {
  const first = subject.lessons.filter((l) => l.round === 1), second = subject.lessons.filter((l) => l.round === 2);
  const scoredFirst = first.filter((l) => !l.overview), scoredSecond = second.filter((l) => !l.overview);
  const earlier = subject.rest.filter((l) => l.earlier), never = subject.rest.filter((l) => !l.earlier);
  const count = (list) => list.filter((l) => done.has(l.id)).length;
  const content = (list) => list.filter((l) => !l.overview);
  return {first, second, earlier, never, earlierCount: content(earlier).length, neverCount: content(never).length,
    done: {first: count(scoredFirst), second: count(scoredSecond), third: count(content(subject.rest))}};
}

const questionChip = (q) => `<a class="sp-q" href="./exam.html#exam/written?question=${encodeURIComponent(q.id)}" title="寫這題（${esc(q.label)}，${q.points} 分）">${esc(q.label)}</a>`;

function lessonRow(lesson, index, maxPoints, done) {
  if (lesson.overview) return `<li class="sp-lesson sp-overview${done.has(lesson.id) ? ' is-done' : ''}">
    <span class="sp-rank" aria-hidden="true">總覽</span>
    <div class="sp-main"><a class="sp-title" href="${esc(lesson.href)}">${esc(lesson.title)}</a>
      <span class="sp-topic">${esc(lesson.topicTitle)} · 先讀這一課，再讀它涵蓋的 ${lesson.covers} 課${done.has(lesson.id) ? ' · <span class="sp-done">做過自測</span>' : ''}</span></div>
    <div class="sp-points"></div>
  </li>`;
  const width = Math.max(4, Math.round(lesson.points / maxPoints * 100));
  return `<li class="sp-lesson${done.has(lesson.id) ? ' is-done' : ''}">
    <span class="sp-rank" aria-hidden="true">${index + 1}</span>
    <div class="sp-main"><a class="sp-title" href="${esc(lesson.href)}">${esc(lesson.title)}</a>
      <span class="sp-topic">${esc(lesson.topicTitle)}${lesson.otherSubject ? `（${esc(lesson.subjectName)}的課）` : ''}${done.has(lesson.id) ? ' · <span class="sp-done">做過自測</span>' : ''}</span>
      <span class="sp-asked">考過：${lesson.questions.map(questionChip).join('')}</span></div>
    <div class="sp-points"><span class="sp-bar" aria-hidden="true"><span style="width:${width}%"></span></span><strong>${fmt(lesson.points)} 分</strong></div>
  </li>`;
}

function restList(list, done) {
  const byTopic = new Map();
  for (const l of list) { if (!byTopic.has(l.topicId)) byTopic.set(l.topicId, {title: l.topicTitle, lessons: []}); byTopic.get(l.topicId).lessons.push(l); }
  return `<ul class="sp-rest">${[...byTopic.values()].map((t) => `<li><span class="sp-rest-topic">${esc(t.title)}</span>${t.lessons.map((l) => `<a href="${esc(l.href)}"${done.has(l.id) || l.overview ? ` class="${[l.overview ? 'sp-rest-overview' : '', done.has(l.id) ? 'is-done' : ''].filter(Boolean).join(' ')}"` : ''}>${esc(l.title)}</a>`).join('')}</li>`).join('')}</ul>`;
}

export function renderSubject(subject, done = new Set()) {
  const s = subject.summary, r = rounds(subject, done);
  const maxPoints = Math.max(1, ...subject.lessons.map((l) => l.points));
  // 名次只數有分數的課；總覽課不佔名次
  const numbered = (list, offset) => { let n = offset; return list.map((l) => [l, l.overview ? -1 : n++]); };
  const seg = (n, cls, label) => (n ? `<span class="${cls}" style="flex:${n}" title="${label} ${n} 課"><b>${n}</b></span>` : '');
  const other = s.otherSubjectLessons ? `其中 ${s.otherSubjectLessons} 課放在別科的課程裡（清單上有標示）。` : '';
  const topTopics = subject.topics.slice(0, 3).map((t) => `${esc(t.title)}（${fmt(t.points)} 分）`).join('、');
  return `<section class="pe-sec sp-summary" aria-labelledby="sp-h-${subject.mapKey}">
    <h2 id="sp-h-${subject.mapKey}">要讀多少</h2>
    <p class="sp-headline">${esc(headline(subject))}</p>
    <div class="sp-split" role="img" aria-label="${s.courseLessons} 課分三輪：第一輪 ${s.firstRound} 課、第二輪 ${s.secondRound} 課、第三輪 ${s.thirdRound} 課">${seg(s.firstRound, 'r1', '第一輪')}${seg(s.secondRound, 'r2', '第二輪')}${seg(s.thirdRound, 'r3', '第三輪')}</div>
    <ul class="sp-legend"><li><i class="r1"></i>第一輪：先讀，涵蓋近兩年 ${s.firstRoundShare}% 的分數</li><li><i class="r2"></i>第二輪：近兩年也考到，補上其餘分數</li><li><i class="r3"></i>第三輪：近兩年沒考到</li></ul>
    <p class="pe-meta">分數最集中的主題：${topTopics}。${other}寫完這科近兩年的 ${s.questions} 題大約要 ${Math.round(s.minutes / 60)} 小時。</p>
    <p class="sp-progress" data-sp-progress>第一輪你做過自測的有 <strong>${r.done.first}</strong> / ${s.firstRound} 課${r.done.second ? `，第二輪 ${r.done.second} / ${s.secondRound} 課` : ''}。<span class="pe-meta">（只算這個瀏覽器的紀錄）</span></p>
  </section>
  <section class="pe-sec" aria-labelledby="sp-r1-${subject.mapKey}">
    <h2 id="sp-r1-${subject.mapKey}">第一輪：先讀這 ${s.firstRound} 課</h2>
    <p class="pe-lead">依近兩年對應的分數由高到低排。每一課後面列出考過它的題目，讀完就點進去寫。</p>
    <ol class="sp-list">${numbered(r.first, 0).map(([l, i]) => lessonRow(l, i, maxPoints, done)).join('')}</ol>
  </section>
  <section class="pe-sec" aria-labelledby="sp-r2-${subject.mapKey}">
    <details class="sp-fold"><summary><h2 id="sp-r2-${subject.mapKey}">第二輪：再讀這 ${s.secondRound} 課</h2><span class="pe-lead">近兩年也考到，每課分數較少；補上剩下約 ${100 - s.firstRoundShare}% 的分數。</span></summary>
    <ol class="sp-list" start="${s.firstRound + 1}">${numbered(r.second, s.firstRound).map(([l, i]) => lessonRow(l, i, maxPoints, done)).join('')}</ol></details>
  </section>
  <section class="pe-sec" aria-labelledby="sp-r3-${subject.mapKey}">
    <details class="sp-fold"><summary><h2 id="sp-r3-${subject.mapKey}">第三輪：近兩年沒考到的 ${s.thirdRound} 課</h2><span class="pe-lead">有時間再讀。${r.earlierCount} 課在 103–113 學年考過，${r.neverCount} 課 13 年都沒有對到考題。</span></summary>
    ${r.earlier.length ? `<h3>以前（103–113 學年）考過 · ${r.earlierCount} 課</h3>${restList(r.earlier, done)}` : ''}
    ${r.never.length ? `<h3>13 年都沒有對到考題 · ${r.neverCount} 課</h3>${restList(r.never, done)}` : ''}</details>
  </section>`;
}

export function initTabs(root, onSelect) {
  const tabs = [...root.querySelectorAll('[role=tab]')];
  const keys = tabs.map((t) => t.dataset.subject);
  const select = (key, focus) => {
    if (!keys.includes(key)) key = keys[0];
    tabs.forEach((t) => { const on = t.dataset.subject === key; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    root.querySelectorAll('[role=tabpanel]').forEach((p) => { p.hidden = p.dataset.subject !== key; });
    root.querySelectorAll('[data-sp-chapters]').forEach((a) => { a.href = `./index.html#${{chem: 'learn', proc: 'process', micro: 'micro'}[key]}/map`; });
    onSelect?.(key);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { history.replaceState(null, '', '#' + t.dataset.subject); select(t.dataset.subject); });
    t.addEventListener('keydown', (e) => {
      const to = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
      if (to < 0) return;
      e.preventDefault(); history.replaceState(null, '', '#' + keys[to]); select(keys[to], true);
    });
  });
  const fromHash = () => select(location.hash.slice(1));
  window.addEventListener('hashchange', fromHash);
  fromHash();
}

export async function mount(root = document) {
  initTabs(root);
  const panels = [...root.querySelectorAll('[role=tabpanel]')];
  try {
    const response = await fetch('./data/study-plan.json', {cache: 'no-cache'});
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const plan = await response.json();
    if (plan.format !== 'study-plan/v1' || !Array.isArray(plan.subjects)) throw new Error('資料格式不符');
    let done = new Set();
    try { done = attemptedLessons(window.localStorage); } catch { /* 無法讀取本機紀錄時照常顯示清單 */ }
    for (const panel of panels) {
      const subject = plan.subjects.find((s) => s.mapKey === panel.dataset.subject);
      panel.innerHTML = subject ? renderSubject(subject, done) : '<p class="pe-loading">沒有這一科的資料。</p>';
    }
    const method = root.querySelector('[data-sp-method]');
    if (method) method.textContent = plan.method;
  } catch (error) {
    for (const panel of panels) panel.innerHTML = `<p class="pe-loading" role="alert">讀書清單暫時讀不到（${esc(error.message)}）。請重新整理，或先<a href="./index.html#learn/map">依章節看課程</a>。</p>`;
  }
}

if (typeof document !== 'undefined') mount();
