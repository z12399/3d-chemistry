// 學習路線頁（route.html）：全貌圖（所有站排成一圈、跨線連結收在圈內）與「一條一條讀」（每條線一站一站列出承接句）。
// 資料：data/learning-route.json（路線）＋ data/study-plan.json（課名、連結、近兩年對應分數）。版面全由資料順序算出，每次一樣。
import {buildRouteModel, ringLayout, laneLayout, nextToRead, splitLink, polar, bundlePath, esc} from './learning-route-model.js';
import {attemptedLessons} from './study-plan.js';

const SIZE = 1144, C = SIZE / 2, R = 330, LABEL_R = R + 15, SUBJECT_R = 534;
const LABEL_EM = 16; // 圖上站名的字級（viewBox 單位）
const fmt = (n) => (Math.round(n * 10) / 10).toString();
const r1 = (v) => Math.round(v * 10) / 10;
const pt = (r, deg) => polar(C, C, r, deg).map(r1);

/* ---------------- 共用小片段 ---------------- */

function tags(stop, state, {short = false} = {}) {
  const out = [];
  if (state.next.has(stop.id)) out.push('<span class="rt-tag rt-tag-next">接著讀</span>');
  if (state.done.has(stop.id)) out.push('<span class="rt-tag rt-tag-done">✓ 做過自測</span>');
  if (stop.foundation) out.push(`<span class="rt-tag rt-tag-f" title="近兩年沒直接考，後面的站要用">基礎課${short ? '' : '（近兩年沒直接考，後面的站要用）'}</span>`);
  if (stop.points > 0) out.push(`<span class="rt-tag rt-tag-pts">近兩年對應 ${fmt(stop.points)} 分</span>`);
  return out.join('');
}

const whereText = (stop) => `${stop.subject.name} · ${stop.line.short} 第 ${stop.number}／${stop.line.size} 站`;
const readLink = (stop, cls = 'rt-read') => (stop.hash ? `<a class="${cls}" href="./index.html${esc(stop.hash)}">讀這一課：${esc(stop.title)} →</a>` : '');

/** 它靠哪些站、哪些站靠它（線上的承接＋跨線連結）。hrefOf 決定點了去哪裡（圖上選取或文字檢視）。 */
function relations(model, stop, hrefOf) {
  const item = (other, kind, why) => `<li><a href="${esc(hrefOf(other))}" data-rel="${esc(other.id)}">${esc(other.name)}</a><span class="rt-rel-where">${esc(kind)}</span>${why ? `<span class="rt-rel-why">${esc(why)}</span>` : ''}</li>`;
  const after = stop.after ? model.byId.get(stop.after) : null;
  const uses = [...(after ? [item(after, `承接的站 · 同一條線第 ${after.number} 站`, '')] : []), ...stop.uses.map((k) => item(k.from, k.sameLine ? `同一條線第 ${k.from.number} 站` : whereText(k.from), k.why))];
  const usedBy = [...stop.children.map((c) => item(c, `接在它後面 · 同一條線第 ${c.number} 站`, '')), ...stop.usedBy.map((k) => item(k.to, k.sameLine ? `同一條線第 ${k.to.number} 站` : whereText(k.to), k.why))];
  return {uses, usedBy, html: `<h4>它靠哪些站</h4>${uses.length ? `<ul class="rt-rel">${uses.join('')}</ul>` : '<p class="rt-rel-none">這是起點，不靠其他站。</p>'}
    <h4>哪些站靠它</h4>${usedBy.length ? `<ul class="rt-rel">${usedBy.join('')}</ul>` : '<p class="rt-rel-none">目前沒有站接在它後面。</p>'}`};
}

/* ---------------- 接著讀 ---------------- */

function renderNext(model, state) {
  const total = model.stops.length, doneCount = model.stops.filter((s) => state.done.has(s.id)).length;
  const rows = model.subjects.map((subject) => {
    const stop = nextToRead(model, state.done, subject.id);
    const doneHere = subject.stops.filter((s) => state.done.has(s.id)).length;
    if (!stop) return `<li class="rt-next-item" style="--c:${subject.color}"><span class="rt-next-where"><b class="rt-next-subject">${esc(subject.name)}</b>${doneHere}／${subject.stops.length} 站做過自測</span><span class="rt-next-name">這一科的路線都讀過一輪了</span></li>`;
    return `<li class="rt-next-item" style="--c:${subject.color}"><span class="rt-next-where"><b class="rt-next-subject">${esc(subject.name)}</b>${esc(stop.line.short)} 第 ${stop.number}／${stop.line.size} 站${stop.foundation ? ' · 基礎課' : ''} · <a class="rt-next-locate" href="#${esc(stop.id)}">看承接句</a></span>
      ${stop.hash ? `<a class="rt-next-name" href="./index.html${esc(stop.hash)}">${esc(stop.name)}</a>` : `<span class="rt-next-name">${esc(stop.name)}</span>`}</li>`;
  }).join('');
  return `<div class="rt-next-head"><h2 id="rt-next-title">接著讀</h2><p class="rt-next-note">依路線順序，每科第一個還沒做過自測的站 · 已做過自測 ${doneCount}／${total} 站</p></div>
    <ul class="rt-next-list">${rows}</ul>`;
}

/* ---------------- 全貌圖 ---------------- */

function arcPath(r, a1, a2, reverse = false) {
  const [x1, y1] = pt(r, reverse ? a2 : a1), [x2, y2] = pt(r, reverse ? a1 : a2);
  return `M${x1},${y1}A${r},${r} 0 ${Math.abs(a2 - a1) > 180 ? 1 : 0} ${reverse ? 0 : 1} ${x2},${y2}`;
}

function ringSVG(model, ring, state) {
  const maxPts = Math.max(1, ...model.stops.map((s) => s.points));
  const angle = ring.angleOf, step = ring.step;
  const lineMid = new Map(ring.lines.map((l) => [l.line, (l.from + step + l.to) / 2]));
  const subjectMid = new Map(ring.subjects.map((s) => [s.subject, (s.from + s.to) / 2]));
  const parts = [];
  parts.push(`<title id="rt-map-title">三科 ${model.lines.length} 條原理線的全貌圖</title>
    <desc id="rt-map-desc">圓周上依序排著三科的原理線，每條線以粗體線名開頭，後面是它的站；彩色短弧把一站接到它承接的站，圈內的灰線是 ${model.links.length} 條跨線連結。點一站可看它的承接句與連結；同樣的內容也以文字列在「一條一條讀」。</desc>
    <defs><marker id="rt-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1L9,5L0,9z" fill="#0b4c43"/></marker></defs>`);
  // 科目：外圈的弧與科名（下半圈的字反向走，才不會倒著讀）
  for (const s of ring.subjects) {
    const mid = (s.from + s.to) / 2, bottom = Math.sin(mid * Math.PI / 180) > 0.1;
    parts.push(`<path class="rt-subject-arc" d="${arcPath(SUBJECT_R, s.from + 0.6, s.to - 0.6)}" stroke="${s.subject.color}"/>`);
    parts.push(`<path id="rt-sp-${s.subject.key}" d="${arcPath(bottom ? SUBJECT_R + 27 : SUBJECT_R + 9, s.from, s.to, bottom)}" fill="none"/>`);
    parts.push(`<text class="rt-subject-name" fill="${s.subject.color}"><textPath href="#rt-sp-${s.subject.key}" startOffset="50%" text-anchor="middle">${esc(s.subject.name)}・${s.subject.lines.length} 條線・${s.subject.stops.length} 站</textPath></text>`);
  }
  // 每條線的軌道（淡）
  for (const l of ring.lines) parts.push(`<path class="rt-track" d="${arcPath(R, l.from + step, l.to - step / 2)}" stroke="${l.line.subject.color}"/>`);
  // 跨線連結（淡淡地畫，選到一站才加粗）
  const hub = (line) => pt(R * 0.6, lineMid.get(line)), shub = (subject) => pt(R * 0.22, subjectMid.get(subject));
  parts.push('<g class="rt-links">');
  for (const k of model.links) {
    const a1 = angle.get(k.from.id), a2 = angle.get(k.to.id);
    const p1 = pt(R - 9, a1), p2 = pt(R - 11, a2);
    let pts;
    if (k.sameLine) pts = [p1, pt(R * 0.74, (a1 + a2) / 2), p2];
    else if (k.sameSubject) pts = [p1, hub(k.from.line), shub(k.from.subject), hub(k.to.line), p2];
    else pts = [p1, hub(k.from.line), shub(k.from.subject), shub(k.to.subject), hub(k.to.line), p2];
    parts.push(`<path class="rt-xlink" data-from="${esc(k.from.id)}" data-to="${esc(k.to.id)}" d="${bundlePath(pts, k.sameLine ? 1 : 0.85)}"/>`);
  }
  parts.push('</g><g class="rt-afters">');
  // 線上一站接一站：往圈內彎的短弧，顏色是科目
  for (const stop of model.stops) {
    if (!stop.after) continue;
    const a1 = angle.get(stop.after), a2 = angle.get(stop.id), slots = Math.round(Math.abs(a2 - a1) / step);
    const [x1, y1] = pt(R - 6, a1), [x2, y2] = pt(R - 6, a2), [cx, cy] = pt(R - 14 - Math.min(120, 11 * slots), (a1 + a2) / 2);
    parts.push(`<path class="rt-after" data-from="${esc(stop.after)}" data-to="${esc(stop.id)}" stroke="${stop.subject.color}" d="M${x1},${y1}Q${r1(cx)},${r1(cy)} ${x2},${y2}"/>`);
  }
  parts.push('</g><g class="rt-stars">');
  for (const slot of ring.slots) {
    const deg = r1(slot.angle), flip = Math.cos(slot.angle * Math.PI / 180) < -1e-6;
    const textAttrs = flip ? `x="${C + LABEL_R}" y="${C}" text-anchor="end" transform="rotate(180 ${C + LABEL_R} ${C})"` : `x="${C + LABEL_R}" y="${C}"`;
    if (slot.type === 'line') {
      parts.push(`<a class="rt-linename" href="#${esc(slot.line.id)}" transform="rotate(${deg} ${C} ${C})" aria-label="${esc(slot.subject.name)}第 ${slot.line.number} 條原理線：${esc(slot.line.title)}（到「一條一條讀」看這條線）"><path class="rt-linetick" d="M${C + R - 7},${C}H${C + R + 7}" stroke="${slot.subject.color}"/><text class="rt-linelabel" ${textAttrs} dy=".35em" fill="${slot.subject.color}">${esc(slot.line.short)}</text></a>`);
      continue;
    }
    const s = slot.stop, rad = s.foundation ? 4.6 : r1(4.2 + 3.8 * Math.sqrt(s.points / maxPts));
    const width = [...s.name].reduce((w, ch) => w + (/[\x20-\x7e]/.test(ch) ? 0.55 : 1), 0) * LABEL_EM + 24;
    const cls = ['rt-star', s.foundation ? 'is-f' : '', state.done.has(s.id) ? 'is-done' : '', state.next.has(s.id) ? 'is-next' : ''].filter(Boolean).join(' ');
    const label = `${whereText(s)}：${s.name}${s.foundation ? '（基礎課）' : ''}${state.done.has(s.id) ? '（做過自測）' : ''}${state.next.has(s.id) ? '（接著讀）' : ''}`;
    parts.push(`<g class="${cls}" data-stop="${esc(s.id)}" role="button" tabindex="-1" aria-pressed="false" aria-label="${esc(label)}" transform="rotate(${deg} ${C} ${C})" style="--c:${s.subject.color}">
      <rect class="rt-hit" x="${C + R - 13}" y="${C - 8.5}" width="${r1(width)}" height="17" rx="8.5"/>
      <circle class="rt-halo" cx="${C + R}" cy="${C}" r="${r1(rad + 4.5)}"/>
      <circle class="rt-dot" cx="${C + R}" cy="${C}" r="${rad}"/>
      <text class="rt-label" ${textAttrs} dy=".35em">${esc(s.name)}${state.done.has(s.id) ? '<tspan class="rt-check"> ✓</tspan>' : ''}</text></g>`);
  }
  parts.push('</g>');
  return `<svg class="rt-ring" viewBox="0 0 ${SIZE} ${SIZE}" role="group" aria-labelledby="rt-map-title rt-map-desc" focusable="false">${parts.join('')}</svg>`;
}

function legendHTML(model) {
  const dot = (fill, stroke, r = 6) => `<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/></svg>`;
  return `<h2 id="rt-panel-title" tabindex="-1">怎麼看這張圖</h2>
    <p>圓周上是三科的 ${model.lines.length} 條原理線：粗體字是線名，後面依序是它的站。<strong>點任何一站</strong>，這裡會列出它承接什麼、靠哪些站、哪些站靠它。</p>
    <ul class="rt-legend">
      <li>${dot('#11665a', '#11665a', 5)}<span>第一輪的課；點越大，近兩年對應的分數越多</span></li>
      <li>${dot('#fff', '#11665a', 4.6)}<span>基礎課（近兩年沒直接考，後面的站要用）</span></li>
      <li><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M2,6Q10,18 18,6" fill="none" stroke="#2b5b9c" stroke-width="2"/></svg><span>同一條線上，一站接一站（顏色是科目）</span></li>
      <li><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M2,16C8,2 12,2 18,16" fill="none" stroke="#8d989f" stroke-width="1.4"/></svg><span>跨線連結：一站也用到另一條線教的東西（共 ${model.links.length} 條）；選到一站才加粗，箭頭指向用到它的站</span></li>
      <li><span class="rt-legend-mark rt-legend-done">✓</span><span>做過自測</span></li>
      <li><span class="rt-legend-mark rt-legend-next" aria-hidden="true"></span><span>接著讀</span></li>
    </ul>
    <p class="rt-panel-tip">用鍵盤：按 Tab 移到圖上，方向鍵換站，Enter 選取，Esc 取消。手機上可以按「放大圖」再左右捲動。</p>`;
}

function detailHTML(model, stop, state) {
  const rel = relations(model, stop, (other) => `#map/${other.id}`);
  const link = splitLink(stop.link);
  return `<p class="rt-detail-where" style="--c:${stop.subject.color}"><span class="rt-swatch" aria-hidden="true"></span>${esc(whereText(stop))}</p>
    <h2 id="rt-panel-title" class="rt-detail-name" tabindex="-1">${esc(stop.name)}</h2>
    <p class="rt-tags">${tags(stop, state)}</p>
    <p class="rt-link"><b>${link.label}</b>${esc(link.text)}</p>
    ${readLink(stop)}
    <div class="rt-detail-rel">${rel.html}</div>
    <p class="rt-detail-more"><a href="#${esc(stop.id)}">在「一條一條讀」看整條線 →</a><button type="button" class="rt-clear">取消選取</button></p>`;
}

/* ---------------- 一條一條讀 ---------------- */

function lanesSVG(row, width, stop) {
  const X = (lane) => 10 + lane * 16, Y = 15, w = 20 + (width - 1) * 16;
  const color = stop.subject.color, out = [];
  for (const l of row.pass) out.push(`<line x1="${X(l)}" y1="0" x2="${X(l)}" y2="100%"/>`);
  if (row.fromTop) out.push(`<line x1="${X(row.lane)}" y1="0" x2="${X(row.lane)}" y2="${Y}"/>`);
  if (row.toBottom) out.push(`<line x1="${X(row.lane)}" y1="${Y}" x2="${X(row.lane)}" y2="100%"/>`);
  for (const l of row.branches) out.push(`<path d="M${X(row.lane)},${Y}C${X(row.lane)},${Y + 14} ${X(l)},${Y + 10} ${X(l)},${Y + 24}" fill="none"/><line x1="${X(l)}" y1="${Y + 24}" x2="${X(l)}" y2="100%"/>`);
  const dot = stop.foundation ? `<circle cx="${X(row.lane)}" cy="${Y}" r="5.5" fill="#fff" stroke-width="2.4"/>` : `<circle cx="${X(row.lane)}" cy="${Y}" r="6.5" fill="${color}" stroke="none"/>`;
  return `<svg class="rt-lanes" width="${w}" aria-hidden="true" focusable="false" stroke="${color}" stroke-width="2.4">${out.join('')}${dot}</svg>`;
}

function stopRow(model, stop, row, width, prev, state) {
  const link = splitLink(stop.link);
  const after = stop.after ? model.byId.get(stop.after) : null;
  const from = after && prev && after !== prev ? `<span class="rt-from">接在第 ${after.number} 站「${esc(after.name)}」之後</span>` : '';
  const crossUses = stop.uses.length, crossUsed = stop.usedBy.length;
  const rel = crossUses + crossUsed ? relations({byId: model.byId}, {...stop, after: null, children: []}, (other) => `#${other.id}`) : null;
  const more = rel ? `<details class="rt-more"><summary>還連到 ${crossUses + crossUsed} 站${crossUses && crossUsed ? `（它靠 ${crossUses} 站、${crossUsed} 站靠它）` : crossUses ? '（它靠的站）' : '（靠它的站）'}</summary>
      ${crossUses ? `<h4>它也靠</h4><ul class="rt-rel">${rel.uses.join('')}</ul>` : ''}${crossUsed ? `<h4>這些站也靠它</h4><ul class="rt-rel">${rel.usedBy.join('')}</ul>` : ''}</details>` : '';
  const cls = ['rt-stop', stop.foundation ? 'is-f' : '', state.done.has(stop.id) ? 'is-done' : '', state.next.has(stop.id) ? 'is-next' : ''].filter(Boolean).join(' ');
  return `<li class="${cls}" id="rt-${esc(stop.id)}" data-stop="${esc(stop.id)}" tabindex="-1" style="--lanes:${20 + (width - 1) * 16}px">
    ${lanesSVG(row, width, stop)}
    <div class="rt-stop-body">
      <p class="rt-stop-head"><span class="rt-stop-no">第 ${stop.number} 站</span><strong class="rt-stop-name">${esc(stop.name)}</strong>${tags(stop, state, {short: true})}</p>
      <p class="rt-link">${from}<b>${link.label}</b>${esc(link.text)}</p>
      <p class="rt-stop-actions">${readLink(stop, 'rt-stop-read')}<a class="rt-stop-map" href="#map/${esc(stop.id)}">在全貌圖上看</a></p>
      ${more}
    </div></li>`;
}

function renderRead(model, state) {
  const tabs = model.subjects.map((s, i) => `<button type="button" role="tab" id="rt-stab-${s.key}" data-subject="${s.key}" aria-controls="rt-subject-${s.key}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${esc(s.name)}</button>`).join('');
  const subjects = model.subjects.map((subject, si) => {
    const doneHere = subject.stops.filter((s) => state.done.has(s.id)).length;
    const index = subject.lines.map((l) => `<li><a href="#${esc(l.id)}"><span>${l.number}</span>${esc(l.short)}</a></li>`).join('');
    const lines = subject.lines.map((line, li) => {
      const {rows, width} = laneLayout(line.stops);
      const next = subject.lines[li + 1];
      const stops = line.stops.map((stop, i) => stopRow(model, stop, rows[i], width, line.stops[i - 1] || null, state)).join('');
      return `<li class="rt-line" id="rt-line-${esc(line.id)}" tabindex="-1" style="--c:${subject.color};--c-soft:${subject.soft}">
        <h3><span class="rt-line-no">第 ${line.number} 條線 · ${line.size} 站</span>${esc(line.title)}</h3>
        <p class="rt-principle"><b>主軸原理</b>${esc(line.principle)}</p>
        <ol class="rt-stops">${stops}</ol>
        <p class="rt-line-end">${next ? `這條線讀完，接著讀第 ${next.number} 條線：<a href="#${esc(next.id)}">${esc(next.title)}</a>` : `這是${esc(subject.name)}的最後一條線。`}</p></li>`;
    }).join('');
    return `<section class="rt-subject" id="rt-subject-${subject.key}" data-subject="${subject.key}" role="tabpanel" aria-labelledby="rt-stab-${subject.key}"${si ? ' hidden' : ''} style="--c:${subject.color}">
      <h2>${esc(subject.name)}<span>${subject.lines.length} 條原理線 · ${subject.stops.length} 站 · 做過自測 ${doneHere} 站</span></h2>
      <nav class="rt-line-index" aria-label="${esc(subject.name)}的原理線"><ol>${index}</ol></nav>
      <ol class="rt-lines">${lines}</ol></section>`;
  }).join('');
  return `<h2 class="pe-sr">一條一條讀</h2>
    <p class="rt-read-lead">每條線開頭是它的主軸原理，下面一站接一站；每一站的「承接」說明上一站教了什麼、這一站拿來做什麼。左邊的線分岔時，表示兩站都接在同一站後面。</p>
    <div class="pe-tabs rt-subject-tabs" role="tablist" aria-label="科目">${tabs}</div>${subjects}`;
}

/* ---------------- 掛上頁面 ---------------- */

export function mount(root = document) {
  const $ = (sel) => root.querySelector(sel);
  const viewTabs = [...root.querySelectorAll('.rt-views [role=tab]')];
  const panels = {map: $('#rt-view-map'), read: $('#rt-view-read')};
  const wide = () => typeof matchMedia !== 'function' || matchMedia('(min-width: 760px)').matches;
  let model = null, state = null, selected = '', subjectKey = 'chem';

  const showView = (view, focus) => {
    viewTabs.forEach((t) => { const on = t.dataset.view === view; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    for (const [k, p] of Object.entries(panels)) p.hidden = k !== view;
  };
  const showSubject = (key, focus) => {
    const tabs = [...root.querySelectorAll('.rt-subject-tabs [role=tab]')];
    if (!tabs.some((t) => t.dataset.subject === key)) key = 'chem';
    subjectKey = key;
    tabs.forEach((t) => { const on = t.dataset.subject === key; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    root.querySelectorAll('.rt-subject').forEach((s) => { s.hidden = s.dataset.subject !== key; });
  };

  const select = (id, {focusPanel = false} = {}) => {
    const svg = $('.rt-ring'), panel = $('.rt-panel');
    if (!svg || !panel) return;
    const stop = model.byId.get(id) || null;
    selected = stop ? stop.id : '';
    svg.classList.toggle('has-sel', !!stop);
    const related = new Set();
    if (stop) {
      if (stop.after) related.add(stop.after);
      stop.children.forEach((c) => related.add(c.id));
      stop.uses.forEach((k) => related.add(k.from.id));
      stop.usedBy.forEach((k) => related.add(k.to.id));
    }
    svg.querySelectorAll('.rt-star').forEach((g) => {
      const sid = g.dataset.stop;
      g.classList.toggle('is-sel', sid === selected);
      g.classList.toggle('is-rel', related.has(sid));
      g.setAttribute('aria-pressed', String(sid === selected));
    });
    svg.querySelectorAll('.rt-xlink,.rt-after').forEach((p) => {
      const on = !!stop && (p.dataset.from === selected || p.dataset.to === selected);
      p.classList.toggle('is-on', on);
    });
    // 加粗的連結移到最上層，才不會被其他線蓋住
    const links = svg.querySelector('.rt-links');
    svg.querySelectorAll('.rt-xlink.is-on').forEach((p) => links.appendChild(p));
    panel.innerHTML = stop ? detailHTML(model, stop, state) : legendHTML(model);
    if (stop) setRoving(stop.id);
    if (focusPanel) panel.querySelector('#rt-panel-title')?.focus({preventScroll: true});
  };

  const stars = () => [...root.querySelectorAll('.rt-star')];
  const setRoving = (id) => stars().forEach((g) => { g.tabIndex = g.dataset.stop === id ? 0 : -1; });

  const locate = (el) => {
    if (!el) return;
    root.querySelectorAll('.rt-stop.is-target,.rt-line.is-target').forEach((x) => x.classList.remove('is-target'));
    el.classList.add('is-target');
    el.scrollIntoView({block: el.classList.contains('rt-line') ? 'start' : 'center'});
    el.focus({preventScroll: true});
  };

  const route = () => {
    if (!model) return;
    const raw = decodeURIComponent(location.hash.slice(1));
    if (!raw) { if (wide()) { showView('map'); select(selected); } else { showView('read'); showSubject(subjectKey); } return; }
    if (raw === 'map' || raw.startsWith('map/')) {
      showView('map');
      const id = raw.slice(4);
      select(id, {focusPanel: !!id && model.byId.has(id)});
      return;
    }
    const subject = model.subjects.find((s) => s.key === raw);
    if (subject) { showView('read'); showSubject(subject.key); return; }
    const line = model.lines.find((l) => l.id === raw);
    if (line) { showView('read'); showSubject(line.subject.key); locate(document.getElementById('rt-line-' + line.id)); return; }
    const stop = model.byId.get(raw);
    if (stop) { showView('read'); showSubject(stop.subject.key); locate(document.getElementById('rt-' + stop.id)); return; }
    showView(wide() ? 'map' : 'read');
  };

  const tabKeys = (tabs, onPick) => tabs.forEach((t, i) => t.addEventListener('keydown', (e) => {
    const to = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault(); onPick(tabs[to], true);
  }));
  const pickView = (t, focus) => {
    const view = t.dataset.view;
    history.replaceState(null, '', view === 'map' ? (selected ? '#map/' + selected : '#map') : '#' + subjectKey);
    showView(view, focus);
    if (view === 'map') select(selected);
  };
  viewTabs.forEach((t) => t.addEventListener('click', () => pickView(t)));
  tabKeys(viewTabs, pickView);

  window.addEventListener('hashchange', route);

  return (async () => {
    try {
      const [routeData, plan] = await Promise.all([
        fetch('./data/learning-route.json', {cache: 'no-cache'}).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }),
        fetch('./data/study-plan.json', {cache: 'no-cache'}).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      model = buildRouteModel(routeData, plan);
      if (!model) throw new Error('資料格式不符');
      let done = new Set();
      try { done = attemptedLessons(window.localStorage); } catch { /* 讀不到本機紀錄就當作都還沒做 */ }
      const next = new Set(model.subjects.map((s) => nextToRead(model, done, s.id)?.id).filter(Boolean));
      state = {done, next};
      $('#rt-next').innerHTML = renderNext(model, state);
      const ring = ringLayout(model);
      panels.map.innerHTML = `<h2 class="pe-sr">全貌圖</h2><div class="rt-map">
        <div class="rt-map-figure"><div class="rt-map-tools"><p>${model.subjects.map((s) => `<span class="rt-key" style="--c:${s.color}">${esc(s.name)}</span>`).join('')}</p><button type="button" class="rt-zoom" aria-pressed="false">放大圖</button></div>
        <div class="rt-map-scroll">${ringSVG(model, ring, state)}</div></div>
        <aside class="rt-panel" aria-labelledby="rt-panel-title"></aside></div>`;
      panels.read.innerHTML = renderRead(model, state);
      const subjectTabs = [...root.querySelectorAll('.rt-subject-tabs [role=tab]')];
      const pickSubject = (t, focus) => { history.replaceState(null, '', '#' + t.dataset.subject); showSubject(t.dataset.subject, focus); };
      subjectTabs.forEach((t) => t.addEventListener('click', () => pickSubject(t)));
      tabKeys(subjectTabs, pickSubject);

      const svg = $('.rt-ring');
      const order = stars().map((g) => g.dataset.stop);
      setRoving(order[0]);
      const choose = (id) => { history.replaceState(null, '', '#map/' + id); select(id); };
      svg.addEventListener('click', (e) => { const g = e.target.closest('.rt-star'); if (g) { choose(g.dataset.stop); g.focus({preventScroll: true}); } });
      svg.addEventListener('keydown', (e) => {
        const g = e.target.closest?.('.rt-star');
        if (!g) return;
        const i = order.indexOf(g.dataset.stop);
        let to = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % order.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i - 1 + order.length) % order.length;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = order.length - 1;
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(g.dataset.stop); return; }
        else if (e.key === 'Escape') { e.preventDefault(); history.replaceState(null, '', '#map'); select(''); setRoving(g.dataset.stop); return; }
        if (to < 0) return;
        e.preventDefault();
        setRoving(order[to]);
        svg.querySelector(`.rt-star[data-stop="${order[to]}"]`)?.focus();
      });
      panels.map.addEventListener('click', (e) => {
        if (e.target.closest('.rt-clear')) { history.replaceState(null, '', '#map'); select(''); svg.querySelector('.rt-star[tabindex="0"]')?.focus({preventScroll: true}); }
        const zoom = e.target.closest('.rt-zoom');
        if (zoom) { const on = zoom.getAttribute('aria-pressed') !== 'true'; zoom.setAttribute('aria-pressed', String(on)); zoom.textContent = on ? '縮小圖' : '放大圖'; panels.map.querySelector('.rt-map').classList.toggle('is-zoomed', on);
          // 放大後把選到的那一站（沒選就是圖的上緣中間）捲到框裡看得到的地方
          const box = panels.map.querySelector('.rt-map-scroll'), star = selected && svg.querySelector(`.rt-star[data-stop="${selected}"] .rt-dot`);
          if (on && box) {
            const b = box.getBoundingClientRect(), r = star ? star.getBoundingClientRect() : null;
            box.scrollLeft = r ? box.scrollLeft + r.left - b.left - b.width / 2 : (box.scrollWidth - box.clientWidth) / 2;
            box.scrollTop = r ? box.scrollTop + r.top - b.top - b.height / 2 : 0;
          } }
      });
      route();
    } catch (error) {
      const msg = `<p class="pe-loading" role="alert">學習路線暫時讀不到（${esc(error.message)}）。可以先看<a href="./study-plan.html">讀書清單</a>或<a href="./index.html#learn/map">依章節看課程</a>。</p>`;
      $('#rt-next').innerHTML = '<h2 id="rt-next-title">接著讀</h2>' + msg;
      panels.map.innerHTML = msg; panels.read.innerHTML = msg;
    }
  })();
}

if (typeof document !== 'undefined' && document.getElementById('rt-main')) mount();
