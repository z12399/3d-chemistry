// 學習路線（b26）：把 data/learning-route.json（三科 → 原理線 → 站）與 data/study-plan.json（課名、連結、分數）
// 合成一份可查詢的模型。這裡只放純函式（不碰 DOM、不碰儲存），路線圖頁（learning-route.js）與課程頁上方那一條共用。

export const SUBJECT_META = Object.freeze({
  chemistry: Object.freeze({key: 'chem', color: '#11665a', soft: '#e3f1ec'}),
  processing: Object.freeze({key: 'proc', color: '#2b5b9c', soft: '#e6eef9'}),
  microbiology: Object.freeze({key: 'micro', color: '#8a3a7e', soft: '#f6e9f3'}),
});

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = (n) => (Math.round(n * 10) / 10).toString();
const hashOf = (href) => { const i = String(href || '').indexOf('#'); return i < 0 ? '' : String(href).slice(i); };
const SAFE_HASH = /^#(?:learn|process|micro)\/[a-z0-9-]+\/[a-z0-9-]+\/understand$/;

/** 線名的短稱：「脂質氧化：自由基連鎖反應」→「脂質氧化」。 */
export const lineShortName = (title) => String(title || '').split('：')[0].trim();

/** 起點站的承接句以「起點：」開頭；拆成標示與句子。 */
export function splitLink(link) {
  const text = String(link || '');
  return text.startsWith('起點：') ? {label: '起點', text: text.slice(3)} : {label: '承接', text};
}

/** 從讀書清單取每一課的課名、連結與近兩年對應分數（同一課出現在兩科時，取有分數的那一筆）。 */
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
 * 合成路線模型。route 格式不對時回傳 null。plan 可缺（課名退回站名、沒有連結）。
 * 回傳 {subjects, lines, stops, byId, links}；每一站帶 subject／line／第幾站／承接對象／子站／跨站連結。
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
  return {subjects, lines, stops, byId, links};
}

/** 照路線讀的下一站：同一條線的下一站；線讀完了是同科下一條線的第一站；整科讀完回傳 null。 */
export function nextStop(model, id) {
  const stop = model?.byId?.get(id);
  if (!stop) return null;
  const inLine = stop.line.stops[stop.index + 1];
  if (inLine) return {stop: inLine, newLine: false};
  const lineIndex = stop.subject.lines.indexOf(stop.line);
  for (const line of stop.subject.lines.slice(lineIndex + 1)) if (line.stops.length) return {stop: line.stops[0], newLine: true};
  return null;
}

/** 上一站＝這一站承接的站（承接句裡的「上一站」）；起點站沒有上一站。 */
export function previousStop(model, id) {
  const stop = model?.byId?.get(id);
  return stop && stop.after ? model.byId.get(stop.after) || null : null;
}

/** 課程頁要的位置：哪一科、哪一條線、第幾站、承接句、上一站、下一站。不在路線上回傳 null。 */
export function routePosition(model, id) {
  const stop = model?.byId?.get(id);
  if (!stop) return null;
  return {
    stop, subjectName: stop.subject.name, lineTitle: stop.line.title, lineShort: stop.line.short,
    number: stop.number, total: stop.line.size, label: `${stop.line.short} 第 ${stop.number}／${stop.line.size} 站`,
    link: splitLink(stop.link), points: stop.points > 0 ? `近兩年對應 ${fmt(stop.points)} 分` : '',
    foundation: stop.foundation, routeHref: `./route.html#${encodeURIComponent(stop.id)}`,
    prev: previousStop(model, id), next: nextStop(model, id),
  };
}

/** 依路線順序，這一科第一個還沒做過自測的站；全都做過回傳 null。subjectId 是 chemistry／processing／microbiology。 */
export function nextToRead(model, done, subjectId) {
  const subject = model?.subjects?.find((s) => s.id === subjectId);
  if (!subject) return null;
  const set = done instanceof Set ? done : new Set(done || []);
  return subject.stops.find((s) => !set.has(s.id)) || null;
}

/** 課頁上方的一條：路線位置、承接句、上一站與下一站。保留 .plan-strip／.plan-strip-where／.plan-strip-next。 */
export function renderRouteStrip(position) {
  if (!position) return '';
  const {stop, prev, next} = position;
  const where = `<p class="plan-strip-where"><a href="${esc(position.routeHref)}">學習路線</a><span>${esc(position.subjectName)} · ${esc(position.label)}${position.foundation ? ' · 基礎課' : ''}</span>${position.points ? `<span class="route-strip-points">${esc(position.points)}</span>` : ''}</p>`;
  const link = position.link.text ? `<p class="route-strip-link"><b>${esc(position.link.label)}</b>${esc(position.link.text)}</p>` : '';
  const prevA = prev && prev.hash ? `<a class="route-strip-prev" href="${esc(prev.hash)}" title="${esc(prev.title)}">← 上一站：${esc(prev.name)}</a>` : '';
  const nextA = next && next.stop.hash ? `<a class="plan-strip-next" href="${esc(next.stop.hash)}" title="${esc(next.stop.title)}">${next.newLine ? `下一條線：${esc(next.stop.line.short)} · ${esc(next.stop.name)}` : `下一站：${esc(next.stop.name)}`} →</a>` : '';
  const steps = prevA || nextA ? `<p class="route-strip-steps">${prevA}${nextA}</p>` : '';
  return `<aside class="plan-strip route-strip" aria-label="這一課在學習路線上的位置" data-route-stop="${esc(stop.id)}">${where}${link}${steps}</aside>`;
}

/** 檢查理解那一步最下面的主要按鈕：路線的下一站。 */
export function renderRouteNext(position) {
  const next = position?.next;
  if (!next || !next.stop.hash) return '';
  const label = next.newLine ? `學習路線的下一條線：${next.stop.line.short} · ${next.stop.name}` : `學習路線的下一站：${next.stop.name}`;
  return `<a class="button-primary learning-primary plan-next" href="${esc(next.stop.hash)}">${esc(label)} →</a>`;
}

/**
 * 一條線的「軌道」排法（像地鐵支線）：站照陣列順序一列一列排；第一個子站沿用父站的軌道，
 * 其餘子站從父站分出新軌道，一直到那個子站出現。回傳每一列要畫的線段與整條線用了幾條軌道。
 * 每一列：lane（這一站的軌道）、fromTop（上面有線接下來）、toBottom（往下接子站）、
 * pass（直穿這一列的其他軌道）、branches（從這一站分出去的新軌道）。
 */
export function laneLayout(stops) {
  const list = Array.isArray(stops) ? stops : [];
  const childrenOf = new Map(list.map((s) => [s.id, []]));
  for (const s of list) if (s.after && childrenOf.has(s.after)) childrenOf.get(s.after).push(s.id);
  const reserved = new Map(); // lane → 等著接上來的站
  const free = (skip) => { let i = 0; while (reserved.has(i) || i === skip) i++; return i; };
  let width = 1;
  const rows = list.map((s) => {
    let lane = [...reserved].find(([, id]) => id === s.id)?.[0];
    const fromTop = lane !== undefined;
    if (fromTop) reserved.delete(lane); else lane = free(-1);
    const pass = [...reserved.keys()].sort((a, b) => a - b);
    const kids = childrenOf.get(s.id) || [];
    const branches = [];
    if (kids.length) {
      reserved.set(lane, kids[0]);
      for (const kid of kids.slice(1)) { const l = free(lane); reserved.set(l, kid); branches.push(l); }
    }
    width = Math.max(width, lane + 1, ...pass.map((l) => l + 1), ...branches.map((l) => l + 1));
    return {id: s.id, lane, fromTop, toBottom: kids.length > 0, pass, branches};
  });
  return {rows, width};
}

/**
 * 全貌圖（星圖）的固定排法：所有站排在一個圓上，三科各占一段、每條線一段（線名占一格）。
 * 角度只由資料的順序決定，每次都一樣。回傳每一格的角度（度，0 在右邊、順時針）。
 */
export function ringLayout(model, {lineGap = 0.45, subjectGap = 1.2, start = -90} = {}) {
  const slots = [];
  let units = 0;
  for (const subject of model.subjects) {
    units += subjectGap / 2;
    subject.lines.forEach((line, i) => {
      if (i) units += lineGap;
      slots.push({type: 'line', line, subject, at: units}); units += 1;
      for (const stop of line.stops) { slots.push({type: 'stop', stop, line, subject, at: units}); units += 1; }
    });
    units += subjectGap / 2;
  }
  const step = 360 / units;
  for (const slot of slots) slot.angle = start + (slot.at + 0.5) * step;
  const angleOf = new Map(slots.filter((s) => s.type === 'stop').map((s) => [s.stop.id, s.angle]));
  const span = (list) => ({from: Math.min(...list.map((s) => s.angle)) - step / 2, to: Math.max(...list.map((s) => s.angle)) + step / 2});
  const subjects = model.subjects.map((subject) => ({subject, ...span(slots.filter((s) => s.subject === subject))}));
  const lines = model.lines.map((line) => ({line, ...span(slots.filter((s) => s.line === line))}));
  return {slots, step, angleOf, subjects, lines};
}

/** 角度（度）與半徑 → 座標。 */
export const polar = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];

/** 均勻三次 B 樣條（同 d3.curveBasis）＋拉直係數 beta（同 d3.curveBundle），用來把跨線連結收成一束。 */
export function bundlePath(points, beta = 0.85) {
  const n = points.length - 1;
  if (n < 1) return '';
  const [x0, y0] = points[0], [xn, yn] = points[n];
  const pts = points.map(([x, y], i) => { const t = i / n; return [beta * x + (1 - beta) * (x0 + t * (xn - x0)), beta * y + (1 - beta) * (y0 + t * (yn - y0))]; });
  const r = (v) => Math.round(v * 10) / 10;
  let d = '', a0, b0, a1, b1, k = 0;
  const seg = (x, y) => { d += `C${r((2 * a0 + a1) / 3)},${r((2 * b0 + b1) / 3)} ${r((a0 + 2 * a1) / 3)},${r((b0 + 2 * b1) / 3)} ${r((a0 + 4 * a1 + x) / 6)},${r((b0 + 4 * b1 + y) / 6)}`; };
  for (const [x, y] of pts) {
    if (k === 0) d += `M${r(x)},${r(y)}`;
    else if (k === 2) { d += `L${r((5 * a0 + a1) / 6)},${r((5 * b0 + b1) / 6)}`; seg(x, y); }
    else if (k > 2) seg(x, y);
    a0 = a1; a1 = x; b0 = b1; b1 = y; k++;
  }
  if (k === 2) d += `L${r(a1)},${r(b1)}`;
  else if (k > 2) { seg(a1, b1); d += `L${r(a1)},${r(b1)}`; }
  return d;
}
