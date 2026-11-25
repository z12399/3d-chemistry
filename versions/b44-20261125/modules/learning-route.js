// 學習路線頁（route.html）。b41（2026-11-23）：一課＝一個完整的主題，裡面分小節。
// 全貌圖：三科 → 每科的課（一張卡片＝一課，卡片裡是它的小節編號清單，主要動作「讀這一課 →」）；
// 逐課看：每一課先寫「這一課在講什麼」，下面照順序列小節與承接句。
// 資料：data/learning-route.json（lines＝課、stops＝小節）＋ data/study-plan.json（小節標題、連結、近兩年對應分數）。
// 版面全由資料順序決定，不寫死課名或節數；程式裡沿用 line／stop 的變數名。
import {buildRouteModel, nextToRead, courseEntry, lineSubtitle, stopLabel, stopRelations, esc} from './learning-route-model.js';
import {attemptedLessons} from './study-plan.js';

const fmt = (n) => (Math.round(n * 10) / 10).toString();
/** 「梅納反應 第 2 節」；只有一個小節的課只寫課名。 */
const whereText = (stop) => (stop.line.size > 1 ? `${stop.line.short} 第 ${stop.number} 節` : stop.line.short);

/* ---------------- 共用小片段 ---------------- */

/** 小節名旁的安靜記號：接著讀、做過自測、基礎、近兩年對應分數。 */
function tags(stop, state) {
  const out = [];
  if (state.next.has(stop.id)) out.push('<span class="rt-tag rt-tag-next">接著讀</span>');
  if (state.done.has(stop.id)) out.push('<span class="rt-tag rt-tag-done">✓ 做過自測</span>');
  if (stop.foundation) out.push('<span class="rt-tag rt-tag-f">基礎</span>');
  if (stop.points > 0) out.push(`<span class="rt-tag rt-tag-pts">近兩年對應 ${fmt(stop.points)} 分</span>`);
  return out.join('');
}

const readLink = (stop, cls) => (stop.hash ? `<a class="${cls}" href="./index.html${esc(stop.hash)}">讀這一節：${esc(stop.title)} →</a>` : '');

/** 先備的小節／後面用到它的小節兩組；沒有內容的那一組不顯示。hrefOf 決定點了去哪裡。 */
function relationGroups(rel, hrefOf, here) {
  const where = (stop) => (stop.line === here.line ? `同一課 · 第 ${stop.number} 節` : `${stop.subject === here.subject ? '' : stop.subject.name + ' · '}${whereText(stop)}`);
  const item = (direct) => ({stop, why, direct: d}) => `<li><a href="${esc(hrefOf(stop))}" data-rel="${esc(stop.id)}">${esc(stop.name)}</a><span class="rt-rel-where">${esc(where(stop))}${d ? ` · ${direct}` : ''}</span>${why ? `<span class="rt-rel-why">${esc(why)}</span>` : ''}</li>`;
  const group = (title, list, cls, direct) => (list.length ? `<div class="rt-rel-group ${cls}"><h4>${title}</h4><ul class="rt-rel">${list.map(item(direct)).join('')}</ul></div>` : '');
  return group('先備的小節', rel.before, 'is-before', '這一節直接承接它') + group('後面用到它的小節', rel.after, 'is-after', '直接承接這一節');
}

/* ---------------- 接著讀（三科各一行） ---------------- */

function renderNext(model, state) {
  const total = model.stops.length, doneCount = model.stops.filter((s) => state.done.has(s.id)).length;
  const rows = model.subjects.map((subject) => {
    const stop = nextToRead(model, state.done, subject.id);
    const head = `<b class="rt-next-subject">${esc(subject.name)}</b>`;
    if (!stop) return `<li class="rt-next-item" style="--c:${subject.color}">${head}<span class="rt-next-name">這一科的路線都讀過一輪了</span></li>`;
    const text = `<span class="rt-next-course">${esc(stop.line.short)}</span>${stop.line.size > 1 ? `<span class="rt-next-sep" aria-hidden="true"> · </span><span class="rt-next-no">第 ${stop.number} 節</span> ${esc(stop.name)}` : ''}`;
    const name = stop.hash ? `<a class="rt-next-name" href="./index.html${esc(stop.hash)}">${text} →</a>` : `<span class="rt-next-name">${text}</span>`;
    return `<li class="rt-next-item" style="--c:${subject.color}">${head}${name}</li>`;
  }).join('');
  return `<div class="rt-next-head"><h2 id="rt-next-title">接著讀</h2><p class="rt-next-note">每科第一個還沒做過自測的小節 · 已做過自測 ${doneCount}／${total} 節</p></div>
    <ul class="rt-next-list">${rows}</ul>`;
}

/* ---------------- 全貌圖：一張卡片＝一課 ---------------- */

function mapStop(stop, state) {
  const cls = ['rt-mstop', stop.foundation ? 'is-f' : '', state.done.has(stop.id) ? 'is-done' : '', state.next.has(stop.id) ? 'is-next' : ''].filter(Boolean).join(' ');
  const sr = [stop.foundation ? '基礎' : '', state.next.has(stop.id) ? '接著讀' : '', state.done.has(stop.id) ? '做過自測' : ''].filter(Boolean).join('、');
  return `<li><button type="button" class="${cls}" data-stop="${esc(stop.id)}" tabindex="-1" aria-pressed="false">
    <span class="rt-mno" aria-hidden="true">${stop.number}</span><span class="rt-mname">${esc(stop.name)}${state.done.has(stop.id) ? '<span class="rt-mcheck" aria-hidden="true"> ✓</span>' : ''}${sr ? `<span class="pe-sr">（${sr}）</span>` : ''}</span>${stop.foundation ? '<span class="rt-mf" aria-hidden="true">基礎</span>' : ''}${state.next.has(stop.id) ? '<span class="rt-mnext" aria-hidden="true">接著讀</span>' : ''}<span class="rt-mmark"></span>${stop.points > 0 ? `<span class="rt-mpts" title="近兩年對應 ${fmt(stop.points)} 分">${fmt(stop.points)} 分</span>` : ''}</button></li>`;
}

function courseCard(line, state) {
  const doneHere = line.stops.filter((s) => state.done.has(s.id)).length;
  const entry = courseEntry(line, state.done);
  const single = line.size === 1, only = line.stops[0];
  const sub = lineSubtitle(line.title);
  const meta = single
    ? [only?.foundation ? '基礎' : '', only?.points > 0 ? `近兩年對應 ${fmt(only.points)} 分` : '', state.done.has(only?.id) ? '✓ 做過自測' : ''].filter(Boolean).join(' · ')
    : `${line.size} 個小節 · 做過自測 ${doneHere} 節`;
  const go = entry?.hash ? `<a class="rt-course-go" href="./index.html${esc(entry.hash)}">讀這一課 →</a>` : '';
  // b43：有延伸小節的課，安靜地多一行連到課頁
  const extras = line.unit?.extras?.length ? `<a class="rt-mline-extra" href="./index.html${esc(line.unit.hash)}">另有 ${line.unit.extras.length} 個延伸小節 →</a>` : '';
  const attrs = single && only ? ` data-single="${esc(only.id)}"` : '';
  return `<li class="rt-mline${single ? ' is-single' : ''}" data-line="${esc(line.id)}"${attrs}>
      <a class="rt-mline-head" href="#${esc(line.id)}" title="到「逐課看」看這一課"><span class="rt-mline-no">${line.number}</span><span class="rt-mline-text"><span class="rt-mline-name">${esc(line.short)}</span>${sub ? `<span class="rt-mline-sub">${esc(sub)}</span>` : ''}</span></a>
      ${meta ? `<p class="rt-mline-meta">${esc(meta)}<span class="rt-mmark"></span></p>` : ''}
      ${single ? '' : `<ol class="rt-mstops" aria-label="${esc(line.short)}的 ${line.size} 個小節">${line.stops.map((s) => mapStop(s, state)).join('')}</ol>`}
      ${go}${extras}</li>`;
}

function renderMap(model, state) {
  const subjects = model.subjects.map((subject) => `<section class="rt-msub" data-subject="${subject.key}" style="--c:${subject.color};--c-soft:${subject.soft}" aria-labelledby="rt-msub-${subject.key}">
      <h3 class="rt-msub-head" id="rt-msub-${subject.key}">${esc(subject.name)}<span>${subject.lines.length} 課 · ${subject.stops.length} 個小節</span></h3>
      <ol class="rt-mlines">${subject.lines.map((line) => courseCard(line, state)).join('')}</ol></section>`).join('');
  return `<h2 class="pe-sr">全貌圖</h2>
    <p class="rt-legend"><span><i class="rt-k-f" aria-hidden="true">基礎</i>近兩年沒直接考、後面要用到</span><span><b class="rt-k-check" aria-hidden="true">✓</b>做過自測</span><span><i class="rt-k-pts">n 分</i>近兩年對應分數</span><span class="rt-legend-tip">點小節看它和哪些小節有關；點課名看整課</span></p>
    <div class="rt-map">${subjects}</div>
    ${moreUnits(model)}`;
}

/** b43：第一輪以外還有幾課（由資料算）→ 全部課程。 */
function moreUnits(model) {
  const n = (model.units || []).filter((u) => !u.firstRound).length;
  return n ? `<p class="rt-more-units">第一輪以外還有 ${n} 課，需要時再讀。<a href="./index.html#learn/map">全部課程 →</a></p>` : '';
}

function detailHTML(model, stop, state) {
  const {label, text} = stopLabel(stop);
  const rel = stopRelations(model, stop);
  const groups = relationGroups(rel, (other) => `#map/${other.id}`, stop);
  const t = tags(stop, state);
  return `<div class="rt-detail-top"><p class="rt-detail-where">${esc(stop.subject.name)} · ${esc(whereText(stop))}</p><button type="button" class="rt-clear" aria-label="取消選取">關閉 ✕</button></div>
    <h3 class="rt-detail-name" id="rt-detail-title" tabindex="-1">${esc(stop.name)}</h3>
    ${t ? `<p class="rt-tags">${t}</p>` : ''}
    <p class="rt-link"><b>${label}</b>${esc(text)}</p>
    <p class="rt-detail-actions">${readLink(stop, 'rt-read')}<a class="rt-detail-line" href="#${esc(stop.id)}">在「逐課看」看整課 →</a></p>
    ${groups ? `<div class="rt-detail-rel">${groups}</div>` : ''}`;
}

/* ---------------- 逐課看 ---------------- */

function stopRow(model, stop, state) {
  const {label, text} = stopLabel(stop);
  const rel = stopRelations(model, stop), count = rel.before.length + rel.after.length;
  const more = count ? `<details class="rt-more"><summary>相關的小節（${count}）</summary>${relationGroups(rel, (other) => `#${other.id}`, stop)}</details>` : '';
  const cls = ['rt-stop', stop.foundation ? 'is-f' : '', state.done.has(stop.id) ? 'is-done' : '', state.next.has(stop.id) ? 'is-next' : ''].filter(Boolean).join(' ');
  const single = stop.line.size === 1;
  return `<li class="${cls}" id="rt-${esc(stop.id)}" data-stop="${esc(stop.id)}" tabindex="-1">
    <div class="rt-stop-body">
      <p class="rt-stop-head">${single ? '' : `<span class="rt-stop-no">第 ${stop.number} 節</span>`}<strong class="rt-stop-name">${esc(stop.name)}</strong>${tags(stop, state)}</p>
      <p class="rt-link"><b>${label}</b>${esc(text)}</p>
      ${readLink(stop, 'rt-stop-read')}
      ${more}
    </div></li>`;
}

function renderRead(model, state) {
  const tabs = model.subjects.map((s, i) => `<button type="button" role="tab" id="rt-stab-${s.key}" data-subject="${s.key}" aria-controls="rt-subject-${s.key}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${esc(s.name)}</button>`).join('');
  const subjects = model.subjects.map((subject, si) => {
    const doneHere = subject.stops.filter((s) => state.done.has(s.id)).length;
    const lines = subject.lines.map((line, li) => {
      const next = subject.lines[li + 1];
      return `<li class="rt-line${line.size === 1 ? ' is-single' : ''}" id="rt-line-${esc(line.id)}" tabindex="-1" style="--c:${subject.color};--c-soft:${subject.soft}">
        <h3><span class="rt-line-no">第 ${line.number} 課 · ${line.size} 個小節</span>${esc(line.title)}</h3>
        ${line.principle ? `<p class="rt-principle"><b>這一課在講什麼</b>${esc(line.principle)}</p>` : ''}
        <ol class="rt-stops">${line.stops.map((stop) => stopRow(model, stop, state)).join('')}</ol>
        <p class="rt-line-end">${next ? `這一課讀完，接著讀第 ${next.number} 課：<a href="#${esc(next.id)}">${esc(next.title)}</a>` : `這是${esc(subject.name)}的最後一課。`}</p></li>`;
    }).join('');
    return `<section class="rt-subject" id="rt-subject-${subject.key}" data-subject="${subject.key}" role="tabpanel" aria-labelledby="rt-stab-${subject.key}"${si ? ' hidden' : ''} style="--c:${subject.color}">
      <p class="rt-subject-count">${esc(subject.name)} · ${subject.lines.length} 課 · ${subject.stops.length} 個小節 · 做過自測 ${doneHere} 節</p>
      <ol class="rt-lines">${lines}</ol></section>`;
  }).join('');
  return `<h2 class="pe-sr">逐課看</h2>
    <p class="rt-read-lead">每一課先寫這一課在講什麼，下面照順序列出小節；每一節的承接句說明它用到前面哪一節教的東西。</p>
    <div class="pe-tabs rt-subject-tabs" role="tablist" aria-label="科目">${tabs}</div>${subjects}`;
}

/* ---------------- 掛上頁面 ---------------- */

const SUBJECT_ALIAS = {chemistry: 'chem', processing: 'proc', microbiology: 'micro'};

export function mount(root = document) {
  const $ = (sel) => root.querySelector(sel);
  const viewTabs = [...root.querySelectorAll('.rt-views [role=tab]')];
  const panels = {map: $('#rt-view-map'), read: $('#rt-view-read')};
  let model = null, state = null, selected = '', subjectKey = 'chem';

  const showView = (view, focus) => {
    viewTabs.forEach((t) => { const on = t.dataset.view === view; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    for (const [k, p] of Object.entries(panels)) p.hidden = k !== view;
  };
  const showSubject = (key, focus) => {
    const tabs = [...root.querySelectorAll('.rt-subject-tabs [role=tab]')];
    if (!tabs.some((t) => t.dataset.subject === key)) key = tabs[0]?.dataset.subject || 'chem';
    subjectKey = key;
    tabs.forEach((t) => { const on = t.dataset.subject === key; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    root.querySelectorAll('.rt-subject').forEach((s) => { s.hidden = s.dataset.subject !== key; });
  };

  /* 全貌圖：選取一個小節。只有一個小節的課沒有清單，整張卡片代表那一節。 */
  const mapStops = () => [...root.querySelectorAll('.rt-mstop')];
  const buttonOf = (id) => root.querySelector(`.rt-mstop[data-stop="${CSS.escape(id)}"]`);
  const cardOf = (id) => buttonOf(id)?.closest('.rt-mline') || root.querySelector(`.rt-mline[data-single="${CSS.escape(id)}"]`);
  const setRoving = (id) => mapStops().forEach((b) => { b.tabIndex = b.dataset.stop === id ? 0 : -1; });

  /** 詳情放在被選那張課卡所在的那一列下面（橫跨整列），讀者的視線不用跳到別處。 */
  const placeDetail = () => {
    const detail = root.querySelector('.rt-mdetail');
    if (!detail || !selected) return;
    const card = cardOf(selected);
    if (!card) return;
    const list = card.parentElement;
    detail.remove();
    const cards = [...list.querySelectorAll(':scope > .rt-mline')];
    const top = card.offsetTop;
    let last = card;
    for (const c of cards) if (Math.abs(c.offsetTop - top) < 4) last = c;
    last.after(detail);
  };

  const select = (id, {scroll = false} = {}) => {
    const map = $('.rt-map');
    if (!map) return;
    const stop = model.byId.get(id) || null;
    selected = stop ? stop.id : '';
    map.classList.toggle('has-sel', !!stop);
    const rel = stopRelations(model, stop);
    const before = new Set(rel.before.map((r) => r.stop.id)), after = new Set(rel.after.map((r) => r.stop.id));
    const mark = (el, sid) => {
      const isSel = sid === selected, isBefore = before.has(sid), isAfter = !isBefore && after.has(sid);
      el.classList.toggle('is-sel', isSel);
      el.classList.toggle('is-before', isBefore);
      el.classList.toggle('is-after', isAfter);
      if (el.matches('button')) el.setAttribute('aria-pressed', String(isSel));
      const m = el.querySelector('.rt-mmark');
      if (m) m.textContent = isBefore ? '先備' : isAfter ? '後面用到' : '';
    };
    for (const b of mapStops()) mark(b, b.dataset.stop);
    for (const c of root.querySelectorAll('.rt-mline[data-single]')) mark(c, c.dataset.single);
    root.querySelectorAll('.rt-mline').forEach((c) => c.classList.toggle('has-rel', !!stop && (c.matches('.is-sel,.is-before,.is-after') || !!c.querySelector('.is-sel,.is-before,.is-after'))));
    root.querySelector('.rt-mdetail')?.remove();
    if (!stop) return;
    const detail = document.createElement('li');
    detail.className = 'rt-mdetail';
    detail.setAttribute('role', 'region');
    detail.setAttribute('aria-labelledby', 'rt-detail-title');
    detail.style.setProperty('--c', stop.subject.color);
    detail.innerHTML = detailHTML(model, stop, state);
    const card = cardOf(stop.id);
    card.after(detail);
    placeDetail();
    if (buttonOf(stop.id)) setRoving(stop.id);
    // 從網址選到的小節：把那張課卡捲到畫面上方，下面接著就是說明
    if (scroll) card.scrollIntoView({block: 'start'});
  };

  const locate = (el) => {
    if (!el) return;
    root.querySelectorAll('.rt-stop.is-target,.rt-line.is-target').forEach((x) => x.classList.remove('is-target'));
    el.classList.add('is-target');
    el.scrollIntoView({block: el.classList.contains('rt-line') ? 'start' : 'center'});
    el.focus({preventScroll: true});
  };

  /** 網址：沒有 hash 或 #map… 開全貌圖；#chem／#proc／#micro、#<課>、#<小節> 開「逐課看」並定位。 */
  const route = () => {
    if (!model) return;
    const raw = decodeURIComponent(location.hash.slice(1));
    if (!raw || raw === 'map' || raw.startsWith('map/')) {
      showView('map');
      const id = raw.startsWith('map/') ? raw.slice(4) : '';
      select(id, {scroll: !!id});
      return;
    }
    const key = SUBJECT_ALIAS[raw] || raw;
    const subject = model.subjects.find((s) => s.key === key);
    if (subject) { showView('read'); showSubject(subject.key); return; }
    const line = model.lines.find((l) => l.id === raw);
    if (line) { showView('read'); showSubject(line.subject.key); locate(document.getElementById('rt-line-' + line.id)); return; }
    const stop = model.byId.get(raw);
    if (stop) { showView('read'); showSubject(stop.subject.key); locate(document.getElementById('rt-' + stop.id)); return; }
    showView('map'); select('');
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
      const count = $('[data-route-count]');
      if (count) count.textContent = `${model.lines.length} 課`;
      $('#rt-next').innerHTML = renderNext(model, state);
      panels.map.innerHTML = renderMap(model, state);
      panels.read.innerHTML = renderRead(model, state);
      const subjectTabs = [...root.querySelectorAll('.rt-subject-tabs [role=tab]')];
      const pickSubject = (t, focus) => { history.replaceState(null, '', '#' + t.dataset.subject); showSubject(t.dataset.subject, focus); };
      subjectTabs.forEach((t) => t.addEventListener('click', () => pickSubject(t)));
      tabKeys(subjectTabs, pickSubject);

      const map = $('.rt-map');
      // 鍵盤順序只走有按鈕的小節（只有一個小節的課沒有清單）
      const order = model.stops.filter((s) => buttonOf(s.id));
      setRoving(order[0]?.id);
      const choose = (id) => { history.replaceState(null, '', '#map/' + id); select(id); };
      const clear = (focusId) => { history.replaceState(null, '', '#map'); select(''); if (focusId && buttonOf(focusId)) { setRoving(focusId); buttonOf(focusId).focus({preventScroll: true}); } };
      map.addEventListener('click', (e) => {
        if (e.target.closest('.rt-clear')) { clear(selected); return; }
        const b = e.target.closest('.rt-mstop');
        if (!b) return;
        if (b.dataset.stop === selected) clear(selected);
        else choose(b.dataset.stop);
      });
      map.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && selected) { e.preventDefault(); clear(selected); return; }
        const b = e.target.closest?.('.rt-mstop');
        if (!b) return;
        const stop = model.byId.get(b.dataset.stop), at = order.indexOf(stop);
        let to = null;
        if (e.key === 'ArrowDown') to = order[(at + 1) % order.length];
        else if (e.key === 'ArrowUp') to = order[(at - 1 + order.length) % order.length];
        else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          // 左右：到前後一課（跨科照路線順序，跳過沒有清單的課），盡量停在同一個節次
          const lines = model.lines.filter((l) => l.stops.some((s) => buttonOf(s.id)));
          const li = lines.indexOf(stop.line), step = e.key === 'ArrowRight' ? 1 : -1;
          const line = lines[(li + step + lines.length) % lines.length];
          to = line ? line.stops[Math.min(stop.index, line.stops.length - 1)] : null;
        } else if (e.key === 'Home') to = order[0];
        else if (e.key === 'End') to = order.at(-1);
        if (!to) return;
        e.preventDefault();
        setRoving(to.id);
        buttonOf(to.id)?.focus();
      });
      let resizeTimer = 0;
      window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(placeDetail, 120); });
      route();
    } catch (error) {
      const msg = `<p class="pe-loading" role="alert">學習路線暫時讀不到（${esc(error.message)}）。可以先看<a href="./study-plan.html">讀書清單</a>或<a href="./index.html#learn/map">依章節看課程</a>。</p>`;
      $('#rt-next').innerHTML = '<h2 id="rt-next-title">接著讀</h2>' + msg;
      panels.map.innerHTML = msg; panels.read.innerHTML = msg;
    }
  })();
}

if (typeof document !== 'undefined' && document.getElementById('rt-main')) mount();
