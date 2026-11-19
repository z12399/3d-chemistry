// 考古題缺口補課：114、115 學年直接考到、原本課程沒有對應內容的題目。
// 讀 data/gap-lessons.json；每個要點標示依據（讀到原文／二手摘要／背景知識）。
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));
const root = document.getElementById('gl-main');
const SUBJECT_ORDER = ['chem', 'proc', 'micro'];

const sourceLinks = (ids, sources) => ids.length
  ? '<span class="gl-src">來源：' + ids.map(id => {
      const s = sources[id];
      return s && s.url ? '<a href="' + esc(s.url) + '" rel="noopener noreferrer" target="_blank">' + esc(id) + '</a>' : esc(id);
    }).join('、') + '</span>'
  : '';

function pointHtml(p, data) {
  return '<li class="gl-point"><div class="gl-point-head"><h4>' + esc(p.h) + '</h4><span class="gl-basis gl-basis-' + esc(p.basis) + '">' + esc(data.basisText[p.basis] || p.basis) + '</span></div><p>' + esc(p.t) + '</p>' + sourceLinks(p.src || [], data.sources) + '</li>';
}

function lessonHtml(l, data) {
  const qs = l.questions.map(q => '<li><b>' + q.year + ' 學年 ' + esc(l.subjectName) + ' 第 ' + esc(q.qid) + ' 題' + (q.points ? '（' + q.points + ' 分）' : '') + '</b>' + (q.verbatim === false ? ' <span class="gl-basis gl-basis-background">題意摘要</span>' : '') + '<br>' + esc(q.text) + '</li>').join('');
  const skeleton = l.skeleton.map(s => '<li>' + esc(s) + '</li>').join('');
  const checks = l.selfcheck.map(c => '<details class="em-details"><summary>' + esc(c.q) + '</summary><p>' + esc(c.a) + '</p></details>').join('');
  return '<article class="em-sheet gl-lesson" id="' + esc(l.id) + '" aria-labelledby="' + esc(l.id) + '-h">' +
    '<h2 id="' + esc(l.id) + '-h">' + esc(l.title) + '</h2>' +
    '<p class="em-lead">' + esc(l.subjectName) + '</p>' +
    '<h3>考過的題目</h3><ul class="gl-questions">' + qs + '</ul>' +
    '<p class="gl-principle"><b>先記住這條原理：</b>' + esc(l.principle) + '</p>' +
    '<h3>要點與依據</h3><ol class="gl-points">' + l.points.map(p => pointHtml(p, data)).join('') + '</ol>' +
    '<div class="em-note"><b>容易寫歪的地方：</b>' + esc(l.trap) + '</div>' +
    '<h3>答題架構（依題意整理，不是官方解答）</h3><ol class="gl-skeleton">' + skeleton + '</ol>' +
    (l.foodLink ? '<p class="em-lead">延伸：' + esc(l.foodLink) + '</p>' : '') +
    (l.courseLessons && l.courseLessons.length ? '<p class="em-lead gl-course-links"><b>課程版本：</b>' + l.courseLessons.map(c => '<a href="' + esc(c.href) + '">' + esc(c.title) + '</a>').join('、') + '</p>' : '') +
    '<h3>自我檢查</h3>' + checks +
    (l.caveat ? '<div class="em-note"><b>這一課的限制：</b>' + esc(l.caveat) + '</div>' : '') +
    '</article>';
}

function render(data) {
  const lessons = data.lessons.slice().sort((a, b) => SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject));
  const nav = lessons.map(l => '<a class="em-chip gl-chip" href="#' + esc(l.id) + '">' + esc(l.subjectName) + '・' + esc(l.title) + '</a>').join('');
  const sources = Object.entries(data.sources).map(([id, s]) =>
    '<li><b>' + esc(id) + '</b>　' + (s.url ? '<a href="' + esc(s.url) + '" rel="noopener noreferrer" target="_blank">' + esc(s.label) + '</a>' : esc(s.label) + '（沒有可直接開啟的網址）') + '<br><span class="em-lead">' + esc(s.how) + '</span></li>').join('');
  const pending = data.pending.map(p => '<li><b>' + esc(p.title) + '</b>：' + esc(p.why) + '</li>').join('');
  root.innerHTML =
    '<h1>缺口補課</h1>' +
    '<p class="em-lead">' + esc(data.intro) + '</p>' +
    '<p><a href="./exam-map.html">← 回完整考題資料</a></p>' +
    '<nav class="em-tabs" aria-label="補課清單">' + nav + '</nav>' +
    lessons.map(l => lessonHtml(l, data)).join('') +
    '<section class="em-sheet"><h2>還沒寫的缺口</h2><ul class="gl-pending">' + pending + '</ul></section>' +
    '<section class="em-sheet"><h2>來源與讀取方式</h2><ol class="gl-sources">' + sources + '</ol></section>';
  if (location.hash.length > 1) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView();
  }
}

fetch('./data/gap-lessons.json')
  .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(render)
  .catch(err => {
    root.innerHTML = '<section class="em-loading" role="alert"><h1>讀取失敗</h1><p>' + esc(err.message) + '</p></section>';
  });
