// 學習路線（b26）：把 data/learning-route.json（三科 → 課 → 小節）與 data/study-plan.json（小節標題、連結、分數）
// 合成一份可查詢的模型。這裡只放純函式（不碰 DOM、不碰儲存），路線圖頁（learning-route.js）與課文頁共用。
// b41（2026-11-23）：資料格式不變，lines[] 就是「課」、stops[] 就是「小節」；程式裡沿用 line／stop 的變數名，讀者看得到的字一律是課與小節。

export const SUBJECT_META = Object.freeze({
  chemistry: Object.freeze({key: 'chem', color: '#11665a', soft: '#e3f1ec'}),
  processing: Object.freeze({key: 'proc', color: '#2b5b9c', soft: '#e6eef9'}),
  microbiology: Object.freeze({key: 'micro', color: '#8a3a7e', soft: '#f6e9f3'}),
});

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = (n) => (Math.round(n * 10) / 10).toString();
const hashOf = (href) => { const i = String(href || '').indexOf('#'); return i < 0 ? '' : String(href).slice(i); };
const SAFE_HASH = /^#(?:learn|process|micro)\/[a-z0-9-]+\/[a-z0-9-]+\/understand$/;

/** 課名的短稱：「脂質氧化：自由基連鎖反應」→「脂質氧化」。 */
export const lineShortName = (title) => String(title || '').split('：')[0].trim();

/** 起點小節的承接句以「起點：」開頭；拆成標示與句子。 */
export function splitLink(link) {
  const text = String(link || '');
  return text.startsWith('起點：') ? {label: '起點', text: text.slice(3)} : {label: '承接', text};
}

/** 承接句小標：一課的第一節「起點」；課中間沒有承接對象的小節「另一個起點」；其餘「承接」。 */
export function stopLabel(stop) {
  const text = String(stop?.link || '').replace(/^起點：/, '');
  const label = !stop || stop.index === 0 ? '起點' : stop.after ? '承接' : '另一個起點';
  return {label, text};
}

/**
 * 一個小節和其他小節的關係（全貌圖的選取與逐課看的「相關的小節」共用）。
 * before＝先備的小節：它承接的小節＋跨課連結裡它用到的小節；after＝後面用到它的小節：承接它的小節＋用到它的小節。
 * 每一項 {stop, why, direct}（direct＝課裡直接的承接）；同一節只出現一次（有 why 的優先）；先列直接承接的，再列同一課，再列其他課（各照路線順序）。
 */
export function stopRelations(model, stop) {
  if (!stop) return {before: [], after: []};
  const collect = (direct, pairs) => {
    const seen = new Map();
    for (const [other, why, isDirect] of [...direct.map(([o, w]) => [o, w, true]), ...pairs]) {
      if (!other || other === stop) continue;
      const old = seen.get(other.id);
      if (!old) seen.set(other.id, {stop: other, why: why || '', direct: !!isDirect});
      else if (!old.why && why) old.why = why;
    }
    const rank = (r) => (r.direct ? 0 : r.stop.line === stop.line ? 1 : 2);
    return [...seen.values()].sort((a, b) => rank(a) - rank(b) || a.stop.order - b.stop.order);
  };
  const afterStop = stop.after ? model?.byId?.get(stop.after) : null;
  return {
    before: collect(afterStop ? [[afterStop, '']] : [], stop.uses.map((k) => [k.from, k.why])),
    after: collect(stop.children.map((c) => [c, stopLabel(c).text]), stop.usedBy.map((k) => [k.to, k.why])),
  };
}

/** 從讀書清單取每一節的標題、連結與近兩年對應分數（同一節出現在兩科時，取有分數的那一筆）。 */
function lessonTable(plan) {
  const table = new Map();
  for (const subject of Array.isArray(plan?.subjects) ? plan.subjects : []) {
    for (const row of [...(subject.lessons || []), ...(subject.rest || [])]) {
      if (!row || typeof row.id !== 'string') continue;
      const old = table.get(row.id);
      const points = Number.isFinite(row.points) ? row.points : 0;
      if (!old || (points > old.points)) table.set(row.id, {title: row.title || row.id, href: row.href || '', points, round: row.round});
    }
  }
  return table;
}

/**
 * 合成路線模型。route 格式不對時回傳 null。plan 可缺（標題退回小節名、沒有連結）。
 * 回傳 {subjects, lines（課）, stops（小節）, byId, links}；每一節帶 subject／line／第幾節／承接對象／承接它的小節／跨課連結。
 */
export function buildRouteModel(route, plan) {
  if (!route || route.format !== 'learning-route/v1' || !Array.isArray(route.subjects)) return null;
  const table = lessonTable(plan);
  const subjects = [], lines = [], stops = [], byId = new Map();
  for (const s of route.subjects) {
    const meta = SUBJECT_META[s.id] || {key: s.id, color: '#4f5d69', soft: '#f7f8f5'};
    const subject = {id: s.id, name: s.name, key: meta.key, color: meta.color, soft: meta.soft, lines: [], stops: []};
    subjects.push(subject);
    (s.lines || []).forEach((l) => {
      const line = {id: l.id, title: l.title, short: lineShortName(l.title), principle: l.principle || '', subject, number: subject.lines.length + 1, stops: []};
      subject.lines.push(line); lines.push(line);
      (l.stops || []).forEach((st, i) => {
        if (!st || typeof st.lesson !== 'string' || byId.has(st.lesson)) return;
        const info = table.get(st.lesson);
        const hash = hashOf(info?.href);
        const stop = {
          id: st.lesson, name: st.name || st.lesson, link: st.link || '', after: st.after ?? null, foundation: !!st.foundation,
          title: info?.title || st.name || st.lesson, hash: SAFE_HASH.test(hash) ? hash : '', points: info?.points || 0,
          subject, line, index: i, number: i + 1, order: stops.length, children: [], uses: [], usedBy: [],
        };
        line.stops.push(stop); subject.stops.push(stop); stops.push(stop); byId.set(stop.id, stop);
      });
    });
  }
  for (const line of lines) line.size = line.stops.length;
  for (const stop of stops) {
    if (stop.after && byId.has(stop.after)) byId.get(stop.after).children.push(stop);
    else stop.after = null;
  }
  const links = [];
  for (const k of Array.isArray(route.links) ? route.links : []) {
    const from = byId.get(k?.from), to = byId.get(k?.to);
    if (!from || !to || from === to) continue;
    const link = {from, to, why: String(k.why || ''), sameLine: from.line === to.line, sameSubject: from.subject === to.subject};
    links.push(link); from.usedBy.push(link); to.uses.push(link);
  }
  const {units, sectionById} = buildUnits(route, subjects, table);
  return {subjects, lines, stops, byId, links, units, sectionById};
}

/* ---------------- b43：全站每個小節都屬於一課 ---------------- */
// 課（unit）＝第一輪的課（lines，含全貌 overview 與延伸小節 extras）＋第一輪以外的課（subjects[].more）。
// 小節（section）的種類：overview（先看全貌，不編號）、core（第一輪小節）、extra（延伸小節，節號接在第一輪之後）、more（第一輪以外的課的小節）。
// stops／byId 仍然只有第一輪；units／sectionById 才是全站。

const SUBJECT_ROOT = Object.freeze({chemistry: 'learn', processing: 'process', microbiology: 'micro'});
/** 課頁的網址：#learn/course/<課 id>（三科的根用這一課所屬的科）。 */
export const unitHash = (unit) => `#${SUBJECT_ROOT[unit?.subject?.id] || 'learn'}/course/${unit?.id || ''}`;
/** 課程目錄的網址。 */
export const catalogHash = (subjectId) => `#${SUBJECT_ROOT[subjectId] || 'learn'}/map`;
const COURSE_HASH = /^#(learn|process|micro)\/course\/([a-z0-9-]+)(?:[/?]|$)/;
/** 課頁網址 → 課 id；不是課頁回傳 ''。 */
export const unitIdFromHash = (hash) => COURSE_HASH.exec(String(hash || ''))?.[2] || '';

function buildUnits(route, subjects, table) {
  const units = [], sectionById = new Map();
  const section = (unit, id, name, kind, number, extra = {}) => {
    if (typeof id !== 'string' || !id || sectionById.has(id)) return null;
    const info = table.get(id), hash = hashOf(info?.href);
    const sec = {id, name: name || (kind === 'overview' ? '先看全貌' : info?.title || id), title: info?.title || name || id, hash: SAFE_HASH.test(hash) ? hash : '',
      points: info?.points || 0, unit, kind, number, follows: null, stop: null, ...extra};
    sectionById.set(id, sec);
    return sec;
  };
  route.subjects.forEach((s, si) => {
    const subject = subjects[si];
    subject.units = []; subject.more = [];
    const make = (data, firstRound, line) => {
      const unit = {id: data.id, title: data.title || data.id, short: lineShortName(data.title), sub: lineSubtitle(data.title), principle: data.principle || '', subject, firstRound, line: line || null,
        number: firstRound ? line.number : subject.more.length + 1, overview: null, core: [], extras: [], sections: [], numbered: []};
      unit.overview = data.overview ? section(unit, data.overview, '', 'overview', null) : null;
      if (firstRound) {
        for (const stop of line.stops) { const sec = section(unit, stop.id, stop.name, 'core', stop.number, {stop, title: stop.title, points: stop.points}); if (sec) unit.core.push(sec); }
        const coreCount = unit.core.length;
        for (const ex of Array.isArray(data.extras) ? data.extras : []) {
          const sec = section(unit, ex?.lesson, ex?.name, 'extra', coreCount + unit.extras.length + 1);
          if (!sec) continue;
          sec.follows = Number.isInteger(ex.follows) && ex.follows >= 1 && ex.follows <= coreCount ? ex.follows : null;
          unit.extras.push(sec);
        }
      } else {
        for (const st of Array.isArray(data.stops) ? data.stops : []) { const sec = section(unit, st?.lesson, st?.name, 'more', unit.core.length + 1); if (sec) unit.core.push(sec); }
      }
      unit.numbered = [...unit.core, ...unit.extras];
      unit.sections = [...(unit.overview ? [unit.overview] : []), ...unit.numbered];
      unit.size = unit.numbered.length;
      unit.hash = unitHash(unit);
      units.push(unit); subject.units.push(unit);
      if (!firstRound) subject.more.push(unit);
      return unit;
    };
    (s.lines || []).forEach((l, i) => { const line = subject.lines[i]; if (line) line.unit = make(l, true, line); });
    for (const m of Array.isArray(s.more) ? s.more : []) if (m && typeof m.id === 'string') make(m, false, null);
  });
  return {units, sectionById};
}

/** 任何一個小節 → 它的課與前後（D1）。不屬於任何一課回傳 null。
 *  prev：上一節（或 null）；next：{href, label（安靜的連結字）, primary（檢查理解那一步的主要按鈕字）, section?, kind:'section'|'unit'|'course'|'catalog'}；
 *  extrasHint：第一輪的最後一節、這一課有延伸小節時 {count, href}。 */
export function unitPosition(model, id) {
  const section = model?.sectionById?.get(id);
  if (!section) return null;
  const unit = section.unit, kind = section.kind, numbered = unit.numbered;
  const go = (sec, label, primary = label) => (sec ? {href: sec.hash, label, primary, section: sec, kind: 'section'} : null);
  let prev = null, next = null, extrasHint = null;
  if (kind === 'core') {
    prev = section.stop ? model.sectionById.get(previousStop(model, section.id)?.id) || null : null;
    const n = nextStop(model, section.id);
    if (n) next = {href: n.stop.hash, label: nextLabel(n), primary: n.newLine ? `這一課讀完了，${nextLabel(n)}` : nextLabel(n), section: model.sectionById.get(n.stop.id) || null, kind: n.newLine ? 'unit' : 'section'};
    if (section === unit.core.at(-1) && unit.extras.length) extrasHint = {count: unit.extras.length, href: unit.hash};
  } else if (kind === 'extra') {
    const i = unit.extras.indexOf(section);
    prev = i > 0 ? unit.extras[i - 1] : (section.follows ? unit.core[section.follows - 1] : unit.core.at(-1)) || null;
    next = unit.extras[i + 1] ? go(unit.extras[i + 1], `下一節：${unit.extras[i + 1].name}`)
      : {href: unit.hash, label: `回到這一課：${unit.short}`, primary: `延伸小節讀完了，回到這一課：${unit.short}`, kind: 'course'};
  } else if (kind === 'overview') {
    next = numbered[0] ? go(numbered[0], `第 1 節：${numbered[0].name}`, `看完全貌，從第 1 節讀起：${numbered[0].name}`) : null;
  } else {
    const i = numbered.indexOf(section);
    prev = numbered[i - 1] || null;
    if (numbered[i + 1]) next = go(numbered[i + 1], `下一節：${numbered[i + 1].name}`);
    else {
      const more = unit.subject.more, following = more[more.indexOf(unit) + 1];
      const first = following ? following.sections[0] : null;
      if (first) {
        const label = `下一課：${following.short}${first.kind === 'overview' || following.sections.length === 1 ? '' : ` · ${first.name}`}`;
        next = {href: first.hash, label, primary: `這一課讀完了，${label}`, section: first, kind: 'unit'};
      } else next = {href: catalogHash(unit.subject.id), label: '回到課程目錄', primary: '這一課讀完了，回到課程目錄', kind: 'catalog'};
    }
  }
  if (next && !next.href) next = null;
  if (prev && !prev.hash) prev = null;
  return {section, unit, kind, number: section.number, follows: section.follows, single: unit.sections.length === 1,
    points: section.points > 0 ? `近兩年對應 ${fmt(section.points)} 分` : '', prev, next, extrasHint, courseHref: unit.hash,
    route: kind === 'core' ? routePosition(model, section.id) : null};
}

/** 課頁與目錄用：這一課做過自測的節數（全貌不算）。done：做過自測的小節 id。 */
export const unitDoneCount = (unit, done) => unit.numbered.filter((s) => done.has(s.id)).length;
/** 「4 個小節 · 延伸 7 個」：全貌不算在 n 裡。 */
export const unitSizeText = (unit) => (unit.firstRound && unit.extras.length ? `${unit.core.length} 個小節 · 延伸 ${unit.extras.length} 個` : `${unit.size} 個小節`);
/** 這一課的近兩年對應分數（各節加總）。 */
export const unitPoints = (unit) => unit.sections.reduce((n, s) => n + (s.points || 0), 0);

/** 課文頁最上面（b43：每一個小節都有）：課名、副標＋可展開的「這一課在講什麼」、小節導覽（全貌 → 第一輪 1…n → 收起來的「延伸 n 節」）。
 *  只有一個小節的課回傳空字串。 */
export function renderUnitHead(position, done = new Set()) {
  if (!position || position.single) return '';
  const {section, unit} = position;
  const about = unit.principle
    ? `<details class="course-about"><summary>${unit.sub ? `<span class="course-sub">${esc(unit.sub)}</span>` : ''}<span class="course-about-toggle">這一課在講什麼</span></summary><p>${esc(unit.principle)}</p></details>`
    : (unit.sub ? `<p class="course-sub">${esc(unit.sub)}</p>` : '');
  const item = (s) => {
    const isDone = done.has(s.id), here = s === section, ov = s.kind === 'overview';
    const inner = ov ? `<span class="course-sec-name">全貌</span>` : `<span class="course-sec-no">${s.number}</span><span class="course-sec-name">${esc(s.name)}</span>${isDone ? '<span class="course-sec-done" aria-label="做過自測">✓</span>' : ''}`;
    const cls = ['course-sec', ov ? 'is-overview' : '', s.kind === 'extra' ? 'is-extra' : '', here ? 'is-current' : '', isDone && !ov ? 'is-done' : ''].filter(Boolean).join(' ');
    const label = ov ? ` aria-label="先看全貌"` : '';
    return `<li>${s.hash ? `<a class="${cls}" href="${esc(s.hash)}" title="${esc(s.title)}"${label}${here ? ' aria-current="page"' : ''}>${inner}</a>` : `<span class="${cls}"${label}${here ? ' aria-current="page"' : ''}>${inner}</span>`}</li>`;
  };
  const main = [...(unit.overview ? [unit.overview] : []), ...unit.core];
  const extras = unit.extras.length
    ? `<details class="course-extras"${section.kind === 'extra' ? ' open' : ''}><summary><span class="course-extras-label">延伸 ${unit.extras.length} 節</span><span class="course-extras-note">機制細節、數據判讀與應用</span></summary><ol>${unit.extras.map(item).join('')}</ol></details>`
    : '';
  return `<header class="course-head" data-course="${esc(unit.id)}"><h1 class="course-title">${esc(unit.short)}</h1>${about}</header>
    <nav class="course-sections" aria-label="${esc(unit.short)}的小節"><ol>${main.map(item).join('')}</ol>${extras}</nav>`;
}

/** 小節標題上方的安靜小字（第一輪以外的種類）：延伸「第 7 節 · 延伸 · 接第 2 節」、全貌「先看全貌」、第一輪以外的課「第 3 節」。 */
export function renderUnitKicker(position) {
  if (!position) return '';
  if (position.kind === 'overview') return '<p class="section-kicker"><span class="section-no">先看全貌</span></p>';
  const meta = [position.kind === 'extra' ? '延伸' : '', position.kind === 'extra' && position.follows ? `接第 ${position.follows} 節` : '', position.points ? esc(position.points) : ''].filter(Boolean).join('<span aria-hidden="true"> · </span>');
  return `<p class="section-kicker"><span class="section-no">第 ${position.number} 節</span>${meta ? `<span class="section-meta">${meta}</span>` : ''}</p>`;
}

/** 小節標題與提問之後：← 上一節／下一節 →（第一輪以外的種類；第一輪的小節用 renderRouteStrip）。 */
export function renderUnitStrip(position) {
  if (!position) return '';
  const {prev, next, section} = position;
  const prevA = prev ? `<a class="route-strip-prev" href="${esc(prev.hash)}" title="${esc(prev.title)}">← 上一節：${esc(prev.kind === 'overview' ? '先看全貌' : prev.name)}</a>` : '';
  const nextA = next ? `<a class="plan-strip-next" href="${esc(next.href)}"${next.section ? ` title="${esc(next.section.title)}"` : ''}>${esc(next.label)} →</a>` : '';
  return prevA || nextA ? `<aside class="plan-strip route-strip unit-strip" aria-label="這一節的前後" data-unit-section="${esc(section.id)}"><p class="route-strip-steps">${prevA}${nextA}</p></aside>` : '';
}

/** 第一輪的最後一節、這一課有延伸小節：一個安靜的連結「這一課還有 n 個延伸小節 →」。 */
export function renderExtrasHint(position) {
  const h = position?.extrasHint;
  return h ? `<p class="unit-extras-hint"><a href="${esc(h.href)}">這一課還有 ${h.count} 個延伸小節 →</a></p>` : '';
}

/** 照路線讀的下一節：同一課的下一節；這一課讀完了是同科下一課的第一節（newLine）；整科讀完回傳 null。 */
export function nextStop(model, id) {
  const stop = model?.byId?.get(id);
  if (!stop) return null;
  const inLine = stop.line.stops[stop.index + 1];
  if (inLine) return {stop: inLine, newLine: false};
  const lineIndex = stop.subject.lines.indexOf(stop.line);
  for (const line of stop.subject.lines.slice(lineIndex + 1)) if (line.stops.length) return {stop: line.stops[0], newLine: true};
  return null;
}

/** 上一節＝同一課裡、清單順序的前一節（b37：與 nextStop 互為反向）；一課的第一節沒有上一節。 */
export function previousStop(model, id) {
  const stop = model?.byId?.get(id);
  return stop && stop.index > 0 ? stop.line.stops[stop.index - 1] || null : null;
}

/** 課文頁要的位置（b41：一課＝一個完整的主題，裡面分小節）：哪一科、哪一課、第幾節、承接句、上一節、下一節（或下一課）。
 *  不在路線上回傳 null。single＝這一課只有一個小節（課文頁不顯示小節導覽與「第 1 節」）。 */
export function routePosition(model, id) {
  const stop = model?.byId?.get(id);
  if (!stop) return null;
  const line = stop.line;
  return {
    stop, line, subjectName: stop.subject.name, lineTitle: line.title, lineShort: line.short, lineSub: lineSubtitle(line.title), principle: line.principle,
    number: stop.number, total: line.size, single: line.size === 1, label: line.size === 1 ? line.short : `${line.short} 第 ${stop.number}／${line.size} 節`,
    link: splitLink(stop.link), points: stop.points > 0 ? `近兩年對應 ${fmt(stop.points)} 分` : '',
    foundation: stop.foundation, routeHref: `./route.html#${encodeURIComponent(stop.id)}`, courseHref: `./route.html#${encodeURIComponent(line.id)}`,
    prev: previousStop(model, id), next: nextStop(model, id),
  };
}

/** 課名冒號後的副標：「梅納反應：機制、Strecker 降解與香氣」→「機制、Strecker 降解與香氣」。 */
export const lineSubtitle = (title) => { const t = String(title || ''); const i = t.indexOf('：'); return i < 0 ? '' : t.slice(i + 1).trim(); };

/** 依路線順序，這一科第一個還沒做過自測的小節；全都做過回傳 null。subjectId 是 chemistry／processing／microbiology。 */
export function nextToRead(model, done, subjectId) {
  const subject = model?.subjects?.find((s) => s.id === subjectId);
  if (!subject) return null;
  const set = done instanceof Set ? done : new Set(done || []);
  return subject.stops.find((s) => !set.has(s.id)) || null;
}

/** 「讀這一課 →」要去的小節：這一課第一個還沒做過自測的小節；都做過就是第一節。 */
export function courseEntry(line, done) {
  const set = done instanceof Set ? done : new Set(done || []);
  return line?.stops?.find((s) => !set.has(s.id)) || line?.stops?.[0] || null;
}

/** 下一步的字：同一課的下一節「下一節：小節名」；這一課讀完了「下一課：課名 · 第一節名」（下一課只有一節就只寫課名）。 */
export function nextLabel(next) {
  if (!next) return '';
  return next.newLine ? `下一課：${next.stop.line.short}${next.stop.line.size > 1 ? ` · ${next.stop.name}` : ''}` : `下一節：${next.stop.name}`;
}

/** 課文頁最上面（多個小節的課）：課名（大標）、副標＋可展開的「這一課在講什麼」、小節導覽（目前這一節有選取狀態，做過自測的有勾）。
 *  done：做過自測的小節 id。只有一個小節的課回傳空字串（大標維持原本的小節標題）。 */
export function renderCourseHead(position, done = new Set()) {
  if (!position || position.single) return '';
  const {stop, line} = position;
  const about = position.principle
    ? `<details class="course-about"><summary>${position.lineSub ? `<span class="course-sub">${esc(position.lineSub)}</span>` : ''}<span class="course-about-toggle">這一課在講什麼</span></summary><p>${esc(position.principle)}</p></details>`
    : (position.lineSub ? `<p class="course-sub">${esc(position.lineSub)}</p>` : '');
  const items = line.stops.map((s) => {
    const isDone = done.has(s.id), here = s === stop;
    const inner = `<span class="course-sec-no">${s.number}</span><span class="course-sec-name">${esc(s.name)}</span>${isDone ? '<span class="course-sec-done" aria-label="做過自測">✓</span>' : ''}`;
    const cls = ['course-sec', here ? 'is-current' : '', isDone ? 'is-done' : ''].filter(Boolean).join(' ');
    return `<li>${s.hash ? `<a class="${cls}" href="${esc(s.hash)}" title="${esc(s.title)}"${here ? ' aria-current="page"' : ''}>${inner}</a>` : `<span class="${cls}"${here ? ' aria-current="page"' : ''}>${inner}</span>`}</li>`;
  }).join('');
  return `<header class="course-head" data-course="${esc(line.id)}"><h1 class="course-title">${esc(line.short)}</h1>${about}</header>
    <nav class="course-sections" aria-label="${esc(line.short)}的 ${line.size} 個小節"><ol>${items}</ol></nav>`;
}

/** 小節標題上方的安靜小字：「第 2 節」（單一小節的課不寫）、基礎、近兩年對應分數、回學習路線的連結。 */
export function renderSectionKicker(position) {
  if (!position) return '';
  const meta = [position.foundation ? '基礎' : '', position.points ? esc(position.points) : '', `<a href="${esc(position.routeHref)}">在學習路線上看</a>`].filter(Boolean).join('<span aria-hidden="true"> · </span>');
  return `<p class="section-kicker">${position.single ? '' : `<span class="section-no">第 ${position.number} 節</span>`}<span class="section-meta">${meta}</span></p>`;
}

/** 小節標題與提問之後的一段：承接句（內文字級）、← 上一節／下一節 →（或下一課）。保留 .plan-strip／.plan-strip-next 的 class。 */
export function renderRouteStrip(position) {
  if (!position) return '';
  const {stop, prev, next} = position;
  const link = position.link.text ? `<p class="route-strip-link">${esc(position.link.text)}</p>` : '';
  const prevA = prev && prev.hash ? `<a class="route-strip-prev" href="${esc(prev.hash)}" title="${esc(prev.title)}">← 上一節：${esc(prev.name)}</a>` : '';
  const nextA = next && next.stop.hash ? `<a class="plan-strip-next" href="${esc(next.stop.hash)}" title="${esc(next.stop.title)}">${esc(nextLabel(next))} →</a>` : '';
  const steps = prevA || nextA ? `<p class="route-strip-steps">${prevA}${nextA}</p>` : '';
  return link || steps ? `<aside class="plan-strip route-strip" aria-label="這一節在學習路線上的前後" data-route-stop="${esc(stop.id)}">${link}${steps}</aside>` : '';
}

/** 檢查理解那一步最下面的主要按鈕：「下一節：…」；這一課最後一節是「這一課讀完了，下一課：…」。 */
export function renderRouteNext(position) {
  const next = position?.next;
  if (!next || !next.stop.hash) return '';
  const label = next.newLine ? `這一課讀完了，${nextLabel(next)}` : nextLabel(next);
  return `<a class="button-primary learning-primary plan-next" href="${esc(next.stop.hash)}">${esc(label)} →</a>`;
}
