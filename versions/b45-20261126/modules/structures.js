// 畫結構練習集：讀 data/structure-drills.json。每題先給任務與提示，揭示後顯示結構圖與自評要點；勾選狀態存在本機。
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));
const root = document.getElementById('sd-main');
const STORE = 'structure-drills-v1';

function readChecks() { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch { return {}; } }
function writeChecks(v) { try { localStorage.setItem(STORE, JSON.stringify(v)); } catch { /* 隱私模式或空間不足：只影響記憶勾選 */ } }

function drillHtml(d, checks) {
  const asked = (d.asked || []).map(a => '<li><b>' + esc(a.year) + ' 學年 食品化學 ' + esc(a.q) + '（' + esc(a.points) + ' 分）</b><br>' + esc(a.text) + '</li>').join('');
  const steps = (d.steps || []).map(s => '<li>' + esc(s) + '</li>').join('');
  const figures = (d.figures || []).map(f => '<figure class="sd-figure"><img src="./' + esc(f.src) + '" alt="' + esc(f.alt) + '"><figcaption>' + esc(f.caption) + '</figcaption></figure>').join('');
  const saved = checks[d.id] || [];
  const points = (d.checkpoints || []).map((c, i) => '<li><label><input type="checkbox" data-drill="' + esc(d.id) + '" data-index="' + i + '"' + (saved.includes(i) ? ' checked' : '') + '> <span>' + esc(c) + '</span></label></li>').join('');
  const lessons = (d.lessons || []).map(l => '<a class="em-chip" href="' + esc(l.href) + '">' + esc(l.label) + ' →</a>').join('');
  const q = d.question ? '<a class="em-chip" href="./exam.html#exam/written?question=' + esc(d.question) + '">到原題作答與自評 →</a>' : '';
  return '<article class="em-sheet sd-drill" id="' + esc(d.id) + '" aria-labelledby="' + esc(d.id) + '-h">' +
    '<h2 id="' + esc(d.id) + '-h">' + esc(d.title) + '</h2>' +
    '<h3>考過的題目</h3><ul class="gl-questions">' + asked + '</ul>' +
    '<p class="gl-principle"><b>任務：</b>' + esc(d.task) + '</p>' +
    '<h3>先想這幾步（不看答案）</h3><ol class="gl-skeleton">' + steps + '</ol>' +
    '<details class="em-details sd-reveal"><summary>揭示結構與自評要點</summary>' +
    '<div class="sd-figures">' + figures + '</div>' +
    '<h3>自評要點（畫完後逐項勾選）</h3><ul class="sd-check" data-count="' + (d.checkpoints || []).length + '">' + points + '</ul>' +
    '<p class="sd-progress" data-progress="' + esc(d.id) + '">' + saved.length + ' / ' + (d.checkpoints || []).length + ' 項</p>' +
    '<div class="sd-links">' + lessons + q + '</div>' +
    '</details></article>';
}

function render(data) {
  const checks = readChecks();
  const drills = data.drills || [];
  const nav = drills.map(d => '<a class="em-chip gl-chip" href="#' + esc(d.id) + '">' + esc(d.title) + '</a>').join('');
  root.innerHTML =
    '<h1>' + esc(data.title) + '</h1>' +
    '<p class="em-lead">' + esc(data.intro) + '</p>' +
    '<p class="em-lead">共 ' + drills.length + ' 題，合計 ' + drills.reduce((s, d) => s + (d.asked || []).reduce((a, x) => a + (x.points || 0), 0), 0) + ' 分的原題。</p>' +
    '<nav class="em-tabs" aria-label="題目清單">' + nav + '</nav>' +
    drills.map(d => drillHtml(d, checks)).join('');

  root.querySelectorAll('.sd-check input').forEach(box => box.addEventListener('change', () => {
    const state = readChecks();
    const id = box.dataset.drill, i = Number(box.dataset.index);
    const set = new Set(state[id] || []);
    if (box.checked) set.add(i); else set.delete(i);
    state[id] = Array.from(set).sort((a, b) => a - b);
    writeChecks(state);
    const total = root.querySelector('#' + CSS.escape(id) + ' .sd-check').dataset.count;
    root.querySelector('[data-progress="' + id + '"]').textContent = state[id].length + ' / ' + total + ' 項';
  }));

  if (location.hash.length > 1) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView();
  }
}

fetch('./data/structure-drills.json')
  .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(render)
  .catch(err => {
    root.innerHTML = '<section class="em-loading" role="alert"><h1>讀取失敗</h1><p>' + esc(err.message) + '</p></section>';
  });
