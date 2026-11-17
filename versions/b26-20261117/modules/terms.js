// 名詞解釋集：讀 data/micro-terms.json。每個名詞四句（定義／機制／食品例／易混淆），可遮住答案自測、依分類篩選。
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));
const root = document.getElementById('tm-main');

const sourceLinks = (ids, sources) => ids.length
  ? '<p class="gl-src">來源：' + ids.map(id => {
      const s = sources[id];
      return s && s.url ? '<a href="' + esc(s.url) + '" rel="noopener noreferrer" target="_blank">' + esc(id) + '</a>' : esc(id);
    }).join('、') + '</p>'
  : '<p class="gl-src">來源：無可直接引用的原文，此條為背景知識。</p>';

function askedBadges(t) {
  if (!t.asked || !t.asked.length) return '<span class="tm-asked tm-asked-extra">延伸</span>';
  return t.asked.map(a => '<span class="tm-asked">' + esc(a.year) + ' 第' + esc(a.q) + '題' + (a.points ? '・' + esc(a.points) + '分' : '') + '</span>').join('');
}

function termHtml(t, data) {
  const rows = [['定義', t.definition], ['機制', t.mechanism], ['食品例', t.example], ['易混淆', t.confusion]]
    .map(([k, v]) => '<div class="tm-row"><span class="tm-key">' + k + '</span><p>' + esc(v) + '</p></div>').join('');
  return '<details class="em-details tm-term" id="' + esc(t.id) + '" data-group="' + esc(t.group) + '" data-asked="' + (t.asked && t.asked.length ? 'yes' : 'no') + '">' +
    '<summary><span class="tm-name"><b>' + esc(t.en) + '</b> <span class="tm-zh">' + esc(t.zh) + '</span></span><span class="tm-meta">' + askedBadges(t) + '<span class="gl-basis gl-basis-' + esc(t.basis) + '">' + esc(data.basisText[t.basis] || t.basis) + '</span></span></summary>' +
    '<div class="tm-body">' + rows + sourceLinks(t.src || [], data.sources) +
    (t.lesson ? '<p class="tm-lesson"><a href="./index.html' + esc(t.lesson) + '">到相關課程 →</a></p>' : '') +
    '</div></details>';
}

function render(data) {
  const groups = data.groups || [];
  const terms = data.terms || [];
  const asked = terms.filter(t => t.asked && t.asked.length).length;
  const tabs = ['<button type="button" data-filter="all" aria-pressed="true">全部（' + terms.length + '）</button>']
    .concat(groups.map(g => '<button type="button" data-filter="' + esc(g.id) + '" aria-pressed="false">' + esc(g.title) + '（' + terms.filter(t => t.group === g.id).length + '）</button>'))
    .join('');
  const sources = Object.entries(data.sources).map(([id, s]) =>
    '<li><b>' + esc(id) + '</b>　' + (s.url ? '<a href="' + esc(s.url) + '" rel="noopener noreferrer" target="_blank">' + esc(s.label) + '</a>' : esc(s.label)) + '<br><span class="em-lead">' + esc(s.how) + '</span></li>').join('');
  root.innerHTML =
    '<h1>' + esc(data.title) + '</h1>' +
    '<p class="em-lead">' + esc(data.intro) + '</p>' +
    '<p class="em-lead">共 ' + terms.length + ' 個名詞，其中 ' + asked + ' 個曾直接考過；每題約 3 分鐘，先寫四句再揭示。</p>' +
    '<div class="tm-controls"><nav class="em-tabs" aria-label="分類">' + tabs + '</nav>' +
    '<div class="tm-actions"><button type="button" class="em-chip" data-action="open-all">全部展開</button><button type="button" class="em-chip" data-action="close-all">全部收合（自測）</button><label class="tm-only"><input type="checkbox" data-action="only-asked"> 只看考過的</label></div></div>' +
    '<section class="tm-list" aria-live="polite">' + terms.map(t => termHtml(t, data)).join('') + '</section>' +
    '<section class="em-sheet"><h2>來源與讀取方式</h2><ol class="gl-sources">' + sources + '</ol></section>';

  const cards = Array.from(root.querySelectorAll('.tm-term'));
  const state = {group: 'all', onlyAsked: false};
  const apply = () => {
    cards.forEach(c => { c.hidden = !((state.group === 'all' || c.dataset.group === state.group) && (!state.onlyAsked || c.dataset.asked === 'yes')); });
  };
  root.querySelectorAll('.em-tabs button').forEach(b => b.addEventListener('click', () => {
    state.group = b.dataset.filter;
    root.querySelectorAll('.em-tabs button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    apply();
  }));
  root.querySelector('[data-action="open-all"]').addEventListener('click', () => cards.forEach(c => { if (!c.hidden) c.open = true; }));
  root.querySelector('[data-action="close-all"]').addEventListener('click', () => cards.forEach(c => { c.open = false; }));
  root.querySelector('[data-action="only-asked"]').addEventListener('change', e => { state.onlyAsked = e.target.checked; apply(); });

  if (location.hash.length > 1) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && target.classList.contains('tm-term')) { target.open = true; target.scrollIntoView(); }
  }
}

fetch('./data/micro-terms.json')
  .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(render)
  .catch(err => {
    root.innerHTML = '<section class="em-loading" role="alert"><h1>讀取失敗</h1><p>' + esc(err.message) + '</p></section>';
  });
