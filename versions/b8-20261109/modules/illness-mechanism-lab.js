// Infection, toxin made in the gut, or toxin already in the food: sort organisms, then test what reheating can and cannot undo.
// FDA Bad Bug Book, 2nd ed. (2012) supplies background and onset ranges; the reheat exercise is a hypothetical comparison, not a treatment guide.

export const ILLNESS_MECHANISM_ID = 'illness-mechanism-sort';

export const CLASSES = {
  preformed: {label: '食品中已形成毒素（中毒）', short: '已形成毒素'},
  gut: {label: '活菌進入腸道後才產毒', short: '腸內產毒'},
  infection: {label: '活菌侵入或定殖（感染）', short: '感染'}
};

export const ORGANISMS = [
  {id: 'saureus', name: '金黃色葡萄球菌', latin: 'Staphylococcus aureus', cls: 'preformed', onset: [1, 7], typical: '平均 2–4 h', reheatSurvives: true,
    quote: '葡萄球菌腸毒素具耐熱性；加熱殺死細菌，未必使已形成的毒素失活。', page: 89},
  {id: 'cereusE', name: '蠟樣芽孢桿菌（嘔吐型）', latin: 'Bacillus cereus', cls: 'preformed', onset: [0.5, 6], typical: '', reheatSurvives: true,
    quote: '嘔吐型與 cereulide 有關，cereulide 對 pH 穩定，並耐熱、耐蛋白酶。', page: 93},
  {id: 'cereusD', name: '蠟樣芽孢桿菌（腹瀉型）', latin: 'Bacillus cereus', cls: 'gut', onset: [6, 15], typical: '附錄另列較寬的 2–36 h', reheatSurvives: false,
    quote: '吃下受汙染食品後，細菌在小腸內產生毒性物質，引起腹瀉與腹絞痛。', page: 92},
  {id: 'perfringens', name: '產氣莢膜梭菌', latin: 'Clostridium perfringens', cls: 'gut', onset: [2, 36], typical: '約 16 h（附錄平均 6–12 h）', reheatSurvives: false,
    quote: '消化道中的毒素生成與孢子形成相關；營養細胞完成孢子形成溶解時釋出腸毒素。此病歸類為食品感染。', page: 84},
  {id: 'salmonella', name: '沙門氏菌', latin: 'Salmonella', cls: 'infection', onset: [12, 74], typical: '平均 18–36 h', reheatSurvives: false,
    quote: '附錄 5 將沙門氏菌與彎曲桿菌等列在 12–74 小時、以下消化道症狀與發燒為主的一組。', page: 267},
  {id: 'campylobacter', name: '空腸彎曲桿菌', latin: 'Campylobacter jejuni', cls: 'infection', onset: [12, 74], typical: '平均 18–36 h', reheatSurvives: false,
    quote: '一般而言，C. jejuni 藉侵入並定殖人類胃腸道造成感染。', page: 16}
];

export const SOURCE = {label: 'U.S. FDA（2012）Bad Bug Book: Foodborne Pathogenic Microorganisms and Natural Toxins, 2nd ed.（附錄 5 發病時間；各章機制）', url: 'https://www.fda.gov/media/83271/download'};

export function grade(answers) {
  return ORGANISMS.map(o => ({id: o.id, answer: answers[o.id] || null, correct: answers[o.id] === o.cls}));
}

// In the stated hypothetical, stillRisk denotes a possible preformed-toxin illness, not guaranteed toxin survival or illness.
export function afterReheat() {
  return ORGANISMS.map(o => ({id: o.id, stillRisk: o.reheatSurvives}));
}

const drafts = new WeakMap();
let instance = 0;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

function onsetSVG(narrow = false) {
  // Narrow screens put each name above its bar so text keeps a readable size after scaling.
  const W = narrow ? 360 : 640, rowH = narrow ? 46 : 30, T = 22, L = narrow ? 10 : 220, R = 18, H = T + ORGANISMS.length * rowH + 34;
  const max = 80, xs = h => L + (Math.log10(h + 0.5) - Math.log10(0.5)) / (Math.log10(max + 0.5) - Math.log10(0.5)) * (W - L - R);
  const ticks = [0.5, 1, 2, 6, 12, 24, 72].map(h => `<line x1="${xs(h)}" x2="${xs(h)}" y1="${T}" y2="${H - 28}" class="im-grid"/><text x="${xs(h)}" y="${H - 12}" text-anchor="middle">${h}</text>`).join('');
  const bars = ORGANISMS.map((o, i) => { const y = T + i * rowH + (narrow ? 20 : 6); const label = narrow ? `<text x="${L}" y="${y - 5}" text-anchor="start">${esc(o.name)}</text>` : `<text x="${L - 8}" y="${y + 13}" text-anchor="end">${esc(o.name)}</text>`; return `${label}<rect x="${xs(o.onset[0])}" y="${y}" width="${Math.max(4, xs(o.onset[1]) - xs(o.onset[0]))}" height="${narrow ? 14 : 18}" rx="4" class="im-bar im-${o.cls}"/>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="im-chart${narrow ? ' im-narrow' : ''}" role="img" aria-label="各病原的發病時間範圍（對數時間軸，小時）">${ticks}${bars}<text x="${W - R}" y="14" text-anchor="end" class="im-unit">時間軸：小時</text></svg>`;
}

export function mountIllnessMechanismLab(container, id = ILLNESS_MECHANISM_ID, options = {}) {
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const {draftOwner, draftKey = id, onSaveSummary} = options;
  let store = null;
  if (draftOwner && typeof draftOwner === 'object') { store = drafts.get(draftOwner); if (!store) { store = new Map(); drafts.set(draftOwner, store); } }
  const state = store?.get(draftKey) || {answers: {}, checked: false, reheat: {}, reheatChecked: false, savedCursor: ''};
  store?.set(draftKey, state);
  const prefix = `im-${++instance}`;
  let disposed = false;

  container.innerHTML = `<section class="illness-lab" data-im-lab="${esc(id)}" aria-labelledby="${prefix}-title">
    <header class="im-head"><p class="im-kicker">動手分類</p><h3 id="${prefix}-title">感染、腸內產毒，還是吃下已形成的毒素？</h3><p class="im-hint">先替每種病原選一類，再核對 FDA 的說明；接著在指定假想條件下，判斷哪些疾病仍可能發生。</p></header>
    <ol class="im-list">${ORGANISMS.map(o => `<li class="im-row" data-im-row="${o.id}"><div class="im-name"><strong>${esc(o.name)}</strong><i>${esc(o.latin)}</i></div><label class="im-pick"><span class="sr-only">${esc(o.name)}的類別</span><select data-im-answer="${o.id}"><option value="">選擇類別</option>${Object.entries(CLASSES).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join('')}</select></label><p class="im-feedback" data-im-feedback="${o.id}" hidden></p></li>`).join('')}</ol>
    <div class="im-actions"><button type="button" data-im-action="check">核對分類</button><span data-im-score role="status"></span></div>
    <section class="im-onset" data-im-onset hidden><h4>發病時間（FDA 附錄 5 與各章；對數時間軸）</h4><div data-im-chart></div><p class="im-legend">${Object.entries(CLASSES).map(([k, c]) => `<span><i class="im-sw im-${k}"></i>${c.short}</span>`).join('')}</p><p class="im-insight">在此頁列出的參考範圍中，兩種預成毒素案例的起病時間下限較早；區間可能重疊，不能只憑起病時間判定病因。它們都是先在食品中形成毒素，攝入後作用，不需先在腸道增殖或產毒。</p></section>
    <section class="im-reheat" aria-labelledby="${prefix}-reheat"><h4 id="${prefix}-reheat">假設一鍋菜曾受污染並在室溫放置，上桌前重新加熱；本題假設所列病原的所有可存活型態（包括芽孢）均已失活，且此後沒有再污染。若事先形成的毒素仍有足夠活性，哪些疾病仍可能發生？</h4>
      <div class="im-checks">${ORGANISMS.map(o => `<label class="im-check"><input type="checkbox" data-im-reheat="${o.id}"><span>${esc(o.name)}</span></label>`).join('')}</div>
      <div class="im-actions"><button type="button" data-im-action="reheat">核對</button><span data-im-reheat-result role="status"></span></div></section>
    <details class="im-detail" data-im-detail="write"><summary>附加本課筆記（選填）</summary><div class="im-save"><button type="button" data-im-action="save">附加分類結果到本課筆記</button><span data-im-save-status role="status"></span></div></details>
    <details class="im-detail" data-im-detail="bounds"><summary>判讀界線與來源</summary><ul>
      <li>發病時間是 FDA 列出的大致範圍；同一病原在附錄與本章可能寫不同範圍（如腹瀉型蠟樣芽孢桿菌），以本章為準並並列附錄值。</li>
      <li>此題是假想比較：假設所列病原的可存活型態均已失活，且沒有後續再污染；肉毒桿菌毒素等未納入本工作台。殺死細菌不能保證已形成的耐熱毒素失活；殘餘活性仍受毒素及處理條件影響，不能只憑殺菌結果判定。</li>
      <li>對應官方題目：<a href="https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-241.pdf" target="_blank" rel="noopener noreferrer">115 食微第六題</a>、<a href="https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-259.pdf" target="_blank" rel="noopener noreferrer">114 第 7 題</a>；本工作台是判讀練習，不是官方答案。</li>
    </ul><p><a href="${SOURCE.url}" target="_blank" rel="noopener noreferrer">${esc(SOURCE.label)}</a></p></details>
  </section>`;

  const root = container.querySelector('.illness-lab');
  const $ = s => root.querySelector(s);
  root.querySelectorAll('[data-im-answer]').forEach(s => { s.value = state.answers[s.dataset.imAnswer] || ''; });
  root.querySelectorAll('[data-im-reheat]').forEach(b => { b.checked = !!state.reheat[b.dataset.imReheat]; });

  function renderCheck() {
    const rows = grade(state.answers), done = state.checked;
    let right = 0;
    for (const r of rows) {
      const o = ORGANISMS.find(x => x.id === r.id), fb = $(`[data-im-feedback="${r.id}"]`), row = $(`[data-im-row="${r.id}"]`);
      row.dataset.imState = done ? (r.correct ? 'right' : 'wrong') : '';
      fb.hidden = !done;
      if (done) { if (r.correct) right++; fb.innerHTML = `${r.correct ? '✓' : `應為「${CLASSES[o.cls].label}」。`} ${esc(o.quote)}<span class="im-cite">FDA p.${o.page}；發病 ${o.onset[0]}–${o.onset[1]} h${o.typical ? '，' + esc(o.typical) : ''}</span>`; }
    }
    $('[data-im-score]').textContent = done ? `${right} / ${rows.length} 正確` : '';
    $('[data-im-onset]').hidden = !done;
    if (done) $('[data-im-chart]').innerHTML = onsetSVG(root.clientWidth < 560);
  }
  function renderReheat() {
    const out = $('[data-im-reheat-result]');
    if (!state.reheatChecked) { out.textContent = ''; return; }
    const truth = afterReheat(), wrong = truth.filter(t => !!state.reheat[t.id] !== t.stillRisk);
    out.dataset.imState = wrong.length ? 'wrong' : 'right';
    out.textContent = wrong.length ? `還有 ${wrong.length} 項不對。本題假設所列病原的可存活型態均已失活且沒有再污染；金黃色葡萄球菌及嘔吐型蠟樣芽孢桿菌的預成毒素若仍有足夠活性，中毒仍可能發生。` : '正確：金黃色葡萄球菌腸毒素與 cereulide 耐熱；殺死細菌不保證已形成的毒素失活。若殘存活性足以致病，中毒仍可能發生；其餘四項依本題假設缺少所需的可存活微生物。';
  }
  renderCheck(); renderReheat();
  const onResize = () => { if (!disposed && state.checked) $('[data-im-chart]').innerHTML = onsetSVG(root.clientWidth < 560); };
  window.addEventListener?.('resize', onResize);

  const onInput = event => {
    if (disposed) return;
    const t = event.target;
    if (t.matches('[data-im-answer]')) { state.answers[t.dataset.imAnswer] = t.value; state.checked = false; renderCheck(); }
    else if (t.matches('[data-im-reheat]')) { state.reheat[t.dataset.imReheat] = t.checked; state.reheatChecked = false; renderReheat(); }
  };
  const onClick = event => {
    if (disposed) return;
    const a = event.target.closest?.('[data-im-action]')?.dataset.imAction;
    if (a === 'check') { state.checked = true; renderCheck(); }
    else if (a === 'reheat') { state.reheatChecked = true; renderReheat(); }
    else if (a === 'save') {
      const status = $('[data-im-save-status]'), rows = grade(state.answers);
      const text = ['【感染／腸內產毒／已形成毒素】', ...ORGANISMS.map(o => `${o.name}：${state.answers[o.id] ? CLASSES[state.answers[o.id]].short : '未選'}${state.checked ? (rows.find(r => r.id === o.id).correct ? ' ✓' : `（應為${CLASSES[o.cls].short}）`) : ''}`)].join('\n');
      if (text === state.savedCursor) { status.textContent = '這份內容已附加過，沒有重複附加。'; return; }
      let ok = false;
      try { ok = typeof onSaveSummary === 'function' && onSaveSummary(text) === true; } catch { ok = false; }
      if (ok) { state.savedCursor = text; status.textContent = '已附加到本課筆記。'; } else status.textContent = '沒有附加成功。';
    }
  };
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('click', onClick);
  return () => { disposed = true; window.removeEventListener?.('resize', onResize); root.removeEventListener('input', onInput); root.removeEventListener('change', onInput); root.removeEventListener('click', onClick); };
}
