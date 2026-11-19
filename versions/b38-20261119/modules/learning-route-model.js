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

/** 一條一條讀的承接句小標：線的第一站「起點」；線中間沒有承接對象的站「另一個起點」；其餘「承接」。 */
export function stopLabel(stop) {
  const text = String(stop?.link || '').replace(/^起點：/, '');
  const label = !stop || stop.index === 0 ? '起點' : stop.after ? '承接' : '另一個起點';
  return {label, text};
}

/**
 * 一站和其他站的關係（全貌圖的選取與一條一條讀的「相關的站」共用）。
 * before＝先備的站：它承接的站＋跨線連結裡它用到的站；after＝後面用到它的站：承接它的站＋用到它的站。
 * 每一項 {stop, why, direct}（direct＝線上直接的承接）；同一站只出現一次（有 why 的優先）；先列直接承接的站，再列同一條線，再列其他線（各照路線順序）。
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

/** 上一站＝同一條線上、清單順序的前一站（b37：與 nextStop 互為反向）；線的第一站沒有上一站。 */
export function previousStop(model, id) {
  const stop = model?.byId?.get(id);
  return stop && stop.index > 0 ? stop.line.stops[stop.index - 1] || null : null;
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

/** 課名下方的一段（b31）：「學習路線・脂質氧化・第 3／8 站」、承接句（內文字級）、上一站／下一站。
 *  保留 .plan-strip／.plan-strip-where／.plan-strip-next；近兩年對應分數是這一行尾端的淡字。 */
export function renderRouteStrip(position) {
  if (!position) return '';
  const {stop, prev, next} = position;
  const place = `・${esc(position.lineShort)}・<span class="route-strip-no">第 ${position.number}／${position.total} 站</span>${position.foundation ? '・基礎課' : ''}`;
  const where = `<p class="plan-strip-where"><a href="${esc(position.routeHref)}">學習路線</a><span>${place}</span>${position.points ? `<span class="route-strip-points">${esc(position.points)}</span>` : ''}</p>`;
  const link = position.link.text ? `<p class="route-strip-link">${esc(position.link.text)}</p>` : '';
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
