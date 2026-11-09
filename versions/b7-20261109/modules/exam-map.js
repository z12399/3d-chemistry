// 考古題地圖：以 114、115 學年為主要依據，103–113 學年為次要依據。
// 讀 data/exam-map.json，呈現逐題編碼的統計與索引。
const SUBJECTS = ['chem', 'proc', 'micro'];
const SKILL = {recall: '記憶', mechanism: '機制推理', structure: '結構', graph: '圖表判讀', calc: '計算', compare: '比較', case: '案例', design: '設計'};
const TIER_TEXT = {
  A: '114 與 115 學年的題目都對應到這一課',
  B: '114 或 115 其中一年的題目對應到這一課',
  C: '114、115 沒有，但 103–113 中 3 個以上學年出現',
  D: '114、115 沒有，103–113 中 1–2 個學年出現',
  E: '13 年內的題目都沒對應到這一課'
};
const TIER_SHORT = {A: '兩年都考', B: '一年考到', C: '舊題常見', D: '舊題偶見', E: '未對應'};
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));
const root = document.getElementById('em-main');
const defaultFilter = () => ({year: '', range: '', topic: '', text: '', concept: '', gapOnly: false});
const state = {data: null, subject: 'chem', filter: defaultFilter(), tiers: {A: true, B: true, C: false, D: false, E: false}};
const lessonIndex = {};
const isP = y => y === 114 || y === 115;

const strip = (years, all) => '<span class="em-strip" aria-hidden="true">' + all.map(y => '<i class="' + (years.includes(y) ? 'on' : '') + (isP(y) ? ' rc' : '') + '"></i>').join('') + '</span>';
const yearsText = years => years.length ? years.join('、') + ' 學年' : '無';
const lessonLink = id => {
  const l = lessonIndex[id];
  return l ? '<a href="./index.html' + esc(l.route) + '">' + esc(l.title) + '</a>' : esc(id);
};

function heatCell(v, y) {
  const cls = 'c' + (isP(y) ? ' p' : '');
  if (!v) return '<td class="' + cls + '"></td>';
  const a = Math.min(0.9, 0.15 + v / 45);
  return '<td class="' + cls + '" style="background:rgba(17,102,90,' + a.toFixed(2) + ');color:' + (a > 0.5 ? '#fff' : 'inherit') + '" title="該年此主題占 ' + v + '%">' + Math.round(v) + '</td>';
}

function skillBlock(sk) {
  const bar = (label, text) => {
    const row = sk[label];
    const items = Object.entries(row).filter(([k]) => k !== '_n').sort((a, b) => b[1] - a[1]);
    return '<div><div class="em-meta">' + text + '（' + row._n + ' 題，依配分）：' + items.map(([k, v]) => (SKILL[k] || k) + ' ' + v + '%').join('、') + '</div><div class="em-skillbar" role="img" aria-label="' + text + '題型比例">' + items.map(([k, v]) => '<span class="sk-' + k + '" style="width:' + v + '%"></span>').join('') + '</div></div>';
  };
  return bar('primary', '114–115 學年（主要）') + bar('earlier', '103–113 學年（次要）');
}

function directionSection(s) {
  const d = state.data.subjects[s];
  const gaps = state.data.directGaps.filter(g => g.subject === s);
  return '<section class="em-sheet em-primary" aria-labelledby="em-h-dir"><h2 id="em-h-dir">' + esc(d.name) + '：114、115 學年的出題方向（主要依據）</h2><p class="em-lead">這兩年的卷面總分各 100，下面每一點都對應到具體題號。只有兩年樣本，「這兩年沒考」不等於「之後不考」。</p><ul class="em-points">' + d.direction.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
    '<p><button type="button" class="em-chip" data-range="primary">只看 114–115 的題目（' + state.data.questions.filter(q => q.subject === s && isP(q.year)).length + ' 題）</button></p>' +
    (gaps.length ? '<h3>這兩年直接考到、但現有課程偏淺或沒有的內容</h3><ul class="em-points">' + gaps.map(g => '<li><b>' + g.year + ' 學年第 ' + esc(g.qid) + ' 題：</b>' + esc(g.summary) + '<div class="em-meta">缺口：' + esc(g.gap) + '</div></li>').join('') + '</ul>' : '<p class="em-meta">這兩年的題目在現有課程中都找得到對應。</p>') + '</section>';
}

function renderSubject(s) {
  const d = state.data.subjects[s];
  const years = state.data.years;
  const heat = '<div class="em-scroll"><table class="em-heat"><caption class="em-meta">格內數字＝該年這科總分中，此主題所占百分比（以題目的主要主題計）。橘框的 114、115 是主要依據。</caption><thead><tr><th scope="col">主題</th>' + years.map(y => '<th scope="col"' + (isP(y) ? ' class="p"' : '') + '>' + y + '</th>').join('') + '<th scope="col">出現年數</th><th scope="col">114–115 占分</th><th scope="col">103–113 占分</th></tr></thead><tbody>' +
    d.topics.map(t => '<tr><th scope="row">' + esc(t.title) + '</th>' + years.map(y => heatCell(t.byYear[String(y)], y)).join('') + '<td>' + t.nYears + '/13</td><td><b>' + t.shareP + '%</b></td><td>' + t.shareS + '%</td></tr>').join('') +
    '</tbody></table></div>';
  const own = d.lessons.filter(l => l.ownSubject);
  const counts = {A: 0, B: 0, C: 0, D: 0, E: 0};
  own.forEach(l => counts[l.tier]++);
  const tierChips = ['A', 'B', 'C', 'D', 'E'].map(t => '<button type="button" class="em-chip" data-tier="' + t + '" aria-pressed="' + state.tiers[t] + '" title="' + esc(TIER_TEXT[t]) + '">' + t + ' ' + TIER_SHORT[t] + ' · ' + counts[t] + ' 課</button>').join(' ');
  const shown = own.filter(l => state.tiers[l.tier]);
  const lessonList = '<ul class="em-list">' + shown.map(l => '<li class="em-item"><span class="em-badge ' + l.tier + '" title="' + esc(TIER_TEXT[l.tier]) + '">' + l.tier + '</span><div><a href="./index.html' + esc(l.route) + '">' + esc(l.title) + '</a> ' + strip(l.years, years) + '<div class="em-meta">' + (l.primary.length || l.earlier ? '114–115：' + (l.primary.length ? l.primary.join('、') + ' 學年' : '無') + ' · 103–113：' + l.earlier + ' 個學年 · 共 ' + l.nQ + ' 題' : '歷年題目未對應到這一課') + '</div></div></li>').join('') + '</ul>';
  const cBoth = d.concepts.filter(c => c.group === 'both');
  const cOne = d.concepts.filter(c => c.group === 'one' && c.earlier >= 2);
  const cEarlier = d.concepts.filter(c => c.group === 'earlier');
  const conceptItem = c => '<li class="em-item"><span class="em-badge ' + (c.group === 'both' ? 'A' : c.group === 'one' ? 'B' : 'C') + '">' + c.nYears + '</span><div><button type="button" class="em-chip" data-concept="' + esc(c.name) + '">' + esc(c.name) + '</button> ' + strip(c.years, years) + '<div class="em-meta">114–115：' + (c.primary.length ? c.primary.join('、') + ' 學年' : '無') + ' · 103–113：' + c.earlier + ' 個學年 · 對應課程：' + (c.lessons.length ? c.lessons.map(lessonLink).join('、') : '<span class="em-tag gap">尚無對應課程</span>') + '</div></div></li>';
  const group = (title, list, open) => list.length ? '<details class="em-details"' + (open ? ' open' : '') + '><summary>' + title + '（' + list.length + '）</summary><ul class="em-list">' + list.map(conceptItem).join('') + '</ul></details>' : '';
  const concepts = group('主要：114、115 兩年都出現的概念', cBoth, true) + group('主要：只在 114 或 115 出現，但過去也考過 2 個學年以上', cOne, true) + group('次要：114、115 沒出現，但 103–113 反覆出現（3 個學年以上）', cEarlier, false);
  return directionSection(s) +
    '<section class="em-sheet" aria-labelledby="em-h-topics"><h2 id="em-h-topics">' + esc(d.name) + '：每年考什麼</h2><p class="em-lead">共 ' + d.nQ + ' 個題目紀錄（103–115 學年，各年卷面總分 100）。顏色越深，該主題在當年占分越高；主題依 114–115 的占分排序。</p>' + heat + '<h3>題型取向有沒有變</h3>' + skillBlock(d.skills) + '</section>' +
    '<section class="em-sheet" aria-labelledby="em-h-concepts"><h2 id="em-h-concepts">反覆出現的概念</h2><p class="em-lead">先看 114、115 的，再看過去的。點概念名稱，可在下方逐題索引看歷年實際怎麼問。<span class="em-legend">年份條：<span class="em-strip"><i class="on"></i></span>＝103–113 有出現，<span class="em-strip"><i class="on rc"></i></span>＝114、115 有出現。</span></p>' + concepts + '</section>' +
    '<section class="em-sheet" aria-labelledby="em-h-lessons"><h2 id="em-h-lessons">現有課程怎麼排先後</h2><p class="em-lead">先看 114、115，再看 103–113。A 級是兩年都考到，B 級是其中一年，C、D 級只在舊題出現，E 級 13 年都沒對應到。E 級不是不重要，只是歷年題目沒有直接問到；時間不夠時才建議後讀。</p><div class="em-filter" role="group" aria-label="課程分級篩選">' + tierChips + '</div>' + lessonList + '</section>' +
    '<div id="em-qwrap">' + questionSection(s) + '</div>';
}

function questionSection(s) {
  const d = state.data.subjects[s];
  const f = state.filter;
  const topics = d.topics.map(t => '<option value="' + esc(t.id) + '"' + (f.topic === t.id ? ' selected' : '') + '>' + esc(t.title) + '</option>').join('');
  const years = state.data.years.slice().reverse().map(y => '<option value="' + y + '"' + (String(f.year) === String(y) ? ' selected' : '') + '>' + y + ' 學年</option>').join('');
  const range = '<option value="">全部學年</option><option value="primary"' + (f.range === 'primary' ? ' selected' : '') + '>只看 114–115（主要）</option><option value="earlier"' + (f.range === 'earlier' ? ' selected' : '') + '>只看 103–113（次要）</option>';
  const list = state.data.questions.filter(q => q.subject === s && (!f.year || q.year === Number(f.year)) && (!f.range || (f.range === 'primary') === isP(q.year)) && (!f.topic || q.topic === f.topic) && (!f.concept || q.concepts.includes(f.concept)) && (!f.gapOnly || q.gap) && (!f.text || (q.summary + ' ' + q.concepts.join(' ')).toLowerCase().includes(f.text.toLowerCase())))
    .sort((a, b) => b.year - a.year);
  const paper = y => state.data.papers.find(p => p.year === y && p.subject === s);
  const items = list.slice(0, 120).map(q => {
    const p = paper(q.year);
    return '<div class="em-q' + (isP(q.year) ? ' primary' : '') + '"><div class="em-head">' + q.year + ' 學年 · 第 ' + esc(q.qid) + ' 題' + (q.points ? '（' + q.points + ' 分）' : '') + (p ? ' <a href="' + esc(p.url) + '" rel="noopener" target="_blank">原卷 PDF</a>' : '') + '</div><p>' + esc(q.summary) + (q.low ? ' <span class="em-tag gap">讀圖信心較低，請以原卷為準</span>' : '') + '</p><div>' + (SKILL[q.skill] ? '<span class="em-tag">' + SKILL[q.skill] + '</span>' : '') + q.concepts.map(c => '<span class="em-tag">' + esc(c) + '</span>').join('') + (q.gap ? '<span class="em-tag gap">現有課程未涵蓋或偏淺</span>' : '') + '</div>' + (q.lessons.length ? '<div class="em-meta">可讀：' + q.lessons.map(lessonLink).join('、') + '</div>' : '') + '</div>';
  }).join('');
  return '<section class="em-sheet" aria-labelledby="em-h-q"><h2 id="em-h-q">逐題索引</h2><div class="em-filter"><label>範圍 <select data-f="range">' + range + '</select></label><label>學年 <select data-f="year"><option value="">全部</option>' + years + '</select></label><label>主題 <select data-f="topic"><option value="">全部</option>' + topics + '</select></label><input type="search" data-f="text" placeholder="搜尋題目或概念" value="' + esc(f.text) + '" aria-label="搜尋題目或概念"><label><input type="checkbox" data-f="gapOnly"' + (f.gapOnly ? ' checked' : '') + '> 只看缺課的題</label>' + (f.concept ? '<button type="button" class="em-chip" data-clear-concept aria-pressed="true">概念：' + esc(f.concept) + ' ✕</button>' : '') + '</div><p class="em-count" role="status">符合 ' + list.length + ' 題' + (list.length > 120 ? '（只顯示最近 120 題，請縮小篩選）' : '') + '</p><div id="em-qlist">' + (items || '<p class="em-meta">沒有符合的題目。</p>') + '</div></section>';
}

function renderGaps() {
  const g = state.data.gaps;
  return '<section class="em-sheet" aria-labelledby="em-h-gaps"><h2 id="em-h-gaps">考過卻還沒有課的內容（各科合併）</h2><p class="em-lead">先列 114、115 學年有出現的類別，再列只在 103–113 出現的。這些題目在現有 243 堂課裡找不到對應或明顯偏淺；多數已用關鍵字再查過課程資料（例如 HPP、洋菜、碘價、雜環胺在課程中確實沒有出現）。補課前仍需另找可靠來源，不能只靠這份清單。</p>' +
    g.map(c => '<details class="em-gap' + (c.primaryHits ? ' primary' : '') + '"><summary><b>' + esc(c.cluster) + '</b> <span class="em-meta">· ' + (c.primaryHits ? '114–115 有 ' + c.primaryHits + ' 題 · ' : '114–115 沒有 · ') + '103–113 有 ' + c.earlierYears + ' 個學年 · ' + c.subjects.map(s => state.data.subjects[s].name).join('／') + '</span></summary><div class="em-meta" style="margin:.4rem 0">出現學年：' + yearsText(c.years) + '</div>' + c.examples.slice(0, 6).map(e => '<p><b>' + e.year + ' ' + esc(state.data.subjects[e.subject].name) + ' 第 ' + esc(e.qid) + ' 題：</b>' + esc(e.summary) + '</p>').join('') + (c.examples.length > 6 ? '<p class="em-meta">另有 ' + (c.examples.length - 6) + ' 題，見各科逐題索引的「只看缺課的題」。</p>' : '') + '</details>').join('') + '</section>';
}

function render() {
  const d = state.data;
  const tabs = SUBJECTS.map(s => '<button type="button" role="tab" id="em-tab-' + s + '" aria-selected="' + (state.subject === s) + '" data-subject="' + s + '">' + d.subjects[s].name + '</button>').join('');
  const total = d.questions.length;
  root.innerHTML = '<h1>考古題地圖（臺大食科所）</h1><p class="em-lead">以 <b>114、115 學年</b>為主要依據（出題方向有變），103–113 學年為次要依據。13 年 × 3 科共 39 份考卷、' + total + ' 個題目紀錄。</p>' +
    '<div class="em-note"><b>怎麼讀這份資料：</b>這是歷年「出過什麼」的整理，不是「今年一定會考什麼」的預測。114、115 只有兩年，我把它們當主要參考方向，但單看兩年無法判斷趨勢會不會延續，所以舊題仍保留作次要參考。103–113 學年為丙組、114 學年起為甲組，三科名稱相同，所以合併比較；官方沒有提供解答。<details class="em-details"><summary>編碼方法與限制</summary><ul><li>39 份卷都是掃描影像（沒有文字層），由人工智慧逐頁讀圖後逐題記錄題型、概念與對應課程；配分以卷面為準，卷面只標大題總分時不拆分。</li><li>概念標籤是自由命名後再合併同義詞，細項次數可能有少量誤差；尚未逐題人工複核，細節請以原卷為準。</li><li>「對應課程」依課程標題比對，同一題最多對應 3 課，可能漏掉內容相關但標題不同的課。</li><li>科技英文不在這份分析內。</li></ul></details></div>' +
    '<div class="em-tabs" role="tablist" aria-label="科目">' + tabs + '</div><div id="em-panel" role="tabpanel" aria-labelledby="em-tab-' + state.subject + '">' + renderSubject(state.subject) + '</div>' + renderGaps();
}

function renderPanelOnly() {
  const panel = document.getElementById('em-panel');
  panel.setAttribute('aria-labelledby', 'em-tab-' + state.subject);
  panel.innerHTML = renderSubject(state.subject);
}

function refreshQuestions(keepFocus) {
  const wrap = document.getElementById('em-qwrap');
  if (!wrap) return;
  wrap.innerHTML = questionSection(state.subject);
  if (keepFocus) {
    const el = document.querySelector('[data-f="' + keepFocus + '"]');
    if (el) {
      el.focus();
      if (el.setSelectionRange && el.type === 'search') el.setSelectionRange(el.value.length, el.value.length);
    }
  }
}

function scrollToQuestions() {
  const h = document.getElementById('em-h-q');
  h.scrollIntoView({block: 'start'});
  h.tabIndex = -1;
  h.focus({preventScroll: true});
}

function onClick(ev) {
  const t = ev.target.closest('button');
  if (!t) return;
  if (t.dataset.subject) {
    state.subject = t.dataset.subject;
    state.filter = defaultFilter();
    history.replaceState(null, '', '#' + state.subject);
    document.querySelectorAll('[role=tab]').forEach(b => b.setAttribute('aria-selected', String(b === t)));
    renderPanelOnly();
  } else if (t.dataset.tier) {
    state.tiers[t.dataset.tier] = !state.tiers[t.dataset.tier];
    renderPanelOnly();
    document.querySelector('[data-tier="' + t.dataset.tier + '"]')?.focus();
  } else if (t.dataset.concept) {
    state.filter = Object.assign(defaultFilter(), {concept: t.dataset.concept});
    refreshQuestions();
    scrollToQuestions();
  } else if (t.dataset.range) {
    state.filter = Object.assign(defaultFilter(), {range: t.dataset.range});
    refreshQuestions();
    scrollToQuestions();
  } else if (t.hasAttribute('data-clear-concept')) {
    state.filter.concept = '';
    refreshQuestions();
  }
}

function onInput(ev) {
  const el = ev.target.closest('[data-f]');
  if (!el || !el.isConnected) return;
  // 搜尋框即時更新；下拉與核取方塊在 change 時更新，避免同一次操作重繪兩次。
  if ((ev.type === 'input') !== (el.type === 'search')) return;
  const k = el.dataset.f;
  state.filter[k] = el.type === 'checkbox' ? el.checked : el.value;
  refreshQuestions(k);
}

async function init() {
  try {
    const res = await fetch('./data/exam-map.json', {cache: 'no-cache'});
    if (!res.ok) throw new Error('HTTP ' + res.status);
    state.data = await res.json();
  } catch (err) {
    root.innerHTML = '<section class="em-sheet"><h1>讀不到考古題資料</h1><p>請重新整理頁面；若仍失敗，可先從 <a href="./exam.html">我的備考進度</a> 開始。</p><p class="em-meta">' + esc(err.message) + '</p></section>';
    return;
  }
  Object.values(state.data.subjects).forEach(s => s.lessons.forEach(l => { lessonIndex[l.id] = l; }));
  const h = location.hash.replace('#', '');
  if (SUBJECTS.includes(h)) state.subject = h;
  render();
  window.addEventListener('hashchange', () => {
    const next = location.hash.replace('#', '');
    if (SUBJECTS.includes(next) && next !== state.subject) {
      state.subject = next;
      state.filter = defaultFilter();
      render();
    }
  });
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
}

init();
