// Net charge of a real protein sequence versus pH, from Henderson–Hasselbalch per ionizable group.
// Average pK values are a model: they ignore local environments, so the model pI is not a measured pI.

export const PROTEIN_CHARGE_ID = 'protein-charge-curve';

// Bovine β-lactoglobulin variant A, mature chain 1–162 as deposited in PDB 6FXB chain A.
export const BLG_SEQUENCE = 'LIVTQTMKGLDIQKVAGTWYSLAMAASDISLLDAQSAPLRVYVEELKPTPEGDLEILLQKWENDECAQKKIIAEKTKIPAVFKIDALNENKVLVLDTDYKKYLLFCMENSAEPEQSLVCQCLVRTPEVDDEALEKFDKALKALPMHIRLSFNPTQLEEQCHI';
export const DISULFIDE_CYS = [66, 106, 119, 160];

export const GROUPS = [
  {id: 'Nt', label: 'N 端 α-NH₃⁺', sign: 1},
  {id: 'K', label: 'Lys 側鏈', sign: 1},
  {id: 'R', label: 'Arg 側鏈', sign: 1},
  {id: 'H', label: 'His 側鏈', sign: 1},
  {id: 'Ct', label: 'C 端 α-COOH', sign: -1},
  {id: 'D', label: 'Asp 側鏈', sign: -1},
  {id: 'E', label: 'Glu 側鏈', sign: -1},
  {id: 'C', label: '游離 Cys 側鏈', sign: -1},
  {id: 'Y', label: 'Tyr 側鏈', sign: -1}
];

export const PK_SETS = {
  folded: {label: '摺疊蛋白實測平均（Grimsley 等 2009）', pk: {Nt: 7.7, K: 10.5, R: 13.8, H: 6.6, Ct: 3.3, D: 3.5, E: 4.2, C: 6.8, Y: 10.3}},
  peptide: {label: '丙胺酸五肽模型值（Thurlkill 等 2006）', pk: {Nt: 8.0, K: 10.4, R: 13.8, H: 6.54, Ct: 3.67, D: 3.67, E: 4.25, C: 8.55, Y: 9.84}}
};

export const SOURCES = {
  grimsley2009: {short: 'Grimsley 等 2009', label: 'Grimsley, Scholtz & Pace（2009）A summary of the measured pK values of the ionizable groups in folded proteins. Protein Sci 18:247–251（Table I 平均值）', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2708032/'},
  thurlkill2006: {short: 'Thurlkill 等 2006', label: 'Thurlkill, Grimsley, Scholtz & Pace（2006）pK values of the ionizable groups of proteins. Protein Sci 15:1214–1218（丙胺酸五肽模型值）', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2242523/'},
  fitch2015: {short: 'Fitch 等 2015', label: 'Fitch 等（2015）Arginine: its pKa value revisited. Protein Sci 24:752–761（胍基 pKa 13.8）', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4420524/'},
  pdb6fxb: {short: 'PDB 6FXB', label: 'RCSB PDB 6FXB：Bovine beta-lactoglobulin variant A at pH 4.0（A 鏈序列與 SSBOND 記錄）', url: 'https://www.rcsb.org/structure/6FXB'},
  golebiowski2020: {short: 'Gołębiowski 等 2020', label: 'Gołębiowski 等（2020）Isolation and Self-Association Studies of Beta-Lactoglobulin. Int J Mol Sci 21:9711（等電點附近約 pH 5.0 形成寡聚體）', url: 'https://doi.org/10.3390/ijms21249711'},
  ntu115: {short: '115 食化第 6 題', label: '臺大 115 學年度碩士班招生考試 食品化學（題號 239）第 6 題', url: 'https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-239.pdf'}
};

export function composition(sequence = BLG_SEQUENCE, disulfideCys = DISULFIDE_CYS) {
  const n = {Nt: 1, Ct: 1, K: 0, R: 0, H: 0, D: 0, E: 0, C: 0, Y: 0};
  [...sequence].forEach((aa, i) => {
    if (aa === 'C') { if (!disulfideCys.includes(i + 1)) n.C += 1; }
    else if (aa in n) n[aa] += 1;
  });
  return n;
}

// Henderson–Hasselbalch: fraction carrying its charge.
export function chargedFraction(sign, pK, pH) {
  return sign > 0 ? 1 / (1 + 10 ** (pH - pK)) : 1 / (1 + 10 ** (pK - pH));
}

export function groupCharges(pH, pkSet = 'folded', counts = composition()) {
  const pk = PK_SETS[pkSet].pk;
  return GROUPS.map(g => {
    const f = chargedFraction(g.sign, pk[g.id], pH);
    return {...g, count: counts[g.id], pK: pk[g.id], fraction: f, contribution: g.sign * counts[g.id] * f};
  });
}

export function netCharge(pH, pkSet = 'folded', counts = composition()) {
  return groupCharges(pH, pkSet, counts).reduce((s, g) => s + g.contribution, 0);
}

export function modelPI(pkSet = 'folded', counts = composition()) {
  let lo = 0, hi = 14;
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (netCharge(mid, pkSet, counts) > 0) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

// Single-group view of the exam statement: a protein with pI 6 placed at pH 5.
export function signAtPH(pI, pH) {
  return pH < pI ? 'positive' : pH > pI ? 'negative' : 'zero';
}

const drafts = new WeakMap();
let instance = 0;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = (x, d = 2) => (Math.abs(x) < 0.005 ? 0 : x).toFixed(d);
const link = k => `<a href="${SOURCES[k].url}" target="_blank" rel="noopener noreferrer">${esc(SOURCES[k].short)}</a>`;

function chartSVG(pkSet, pH) {
  const W = 560, H = 260, L = 44, R = 12, T = 12, B = 34, xs = p => L + (p / 14) * (W - L - R);
  const qMax = 30, ys = q => T + (1 - (q + qMax) / (2 * qMax)) * (H - T - B);
  const pts = []; for (let p = 0; p <= 14.0001; p += 0.1) pts.push(`${xs(p).toFixed(1)},${ys(Math.max(-qMax, Math.min(qMax, netCharge(p, pkSet)))).toFixed(1)}`);
  const pi = modelPI(pkSet), q = netCharge(pH, pkSet);
  const ticksX = [0, 2, 4, 6, 8, 10, 12, 14].map(p => `<line x1="${xs(p)}" y1="${H - B}" x2="${xs(p)}" y2="${H - B + 4}" class="pc-axis"/><text x="${xs(p)}" y="${H - B + 18}" text-anchor="middle">${p}</text>`).join('');
  const ticksY = [-30, -15, 0, 15, 30].map(v => `<text x="${L - 6}" y="${ys(v) + 4}" text-anchor="end">${v > 0 ? '+' + v : v}</text><line x1="${L}" y1="${ys(v)}" x2="${W - R}" y2="${ys(v)}" class="${v === 0 ? 'pc-zero' : 'pc-grid'}"/>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="pc-chart" role="img" aria-label="淨電荷對 pH 曲線；模型 pI ${fmt(pi)}，目前 pH ${fmt(pH, 1)} 淨電荷 ${fmt(q, 1)}">${ticksY}${ticksX}<line x1="${L}" y1="${T}" x2="${L}" y2="${H - B}" class="pc-axis"/><polyline points="${pts.join(' ')}" class="pc-curve"/><line x1="${xs(pi)}" y1="${T}" x2="${xs(pi)}" y2="${H - B}" class="pc-pi"/><text x="${xs(pi) + 4}" y="${T + 12}" class="pc-pi-label">模型 pI ${fmt(pi)}</text><circle cx="${xs(pH)}" cy="${ys(Math.max(-qMax, Math.min(qMax, q)))}" r="6" class="pc-dot"/><text x="${(L + W - R) / 2}" y="${H - 2}" text-anchor="middle">pH</text></svg>`;
}

export function mountProteinChargeLab(container, id = PROTEIN_CHARGE_ID, options = {}) {
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const {draftOwner, draftKey = id, onSaveSummary} = options;
  let store = null;
  if (draftOwner && typeof draftOwner === 'object') { store = drafts.get(draftOwner); if (!store) { store = new Map(); drafts.set(draftOwner, store); } }
  const state = store?.get(draftKey) || {pH: 7, pkSet: 'folded', prediction: '', revealed: false, note: '', savedCursor: ''};
  store?.set(draftKey, state);
  const prefix = `pc-${++instance}`;
  let disposed = false;
  const counts = composition();

  container.innerHTML = `<section class="protein-charge-lab" data-pc-lab="${esc(id)}" aria-labelledby="${prefix}-title">
    <header class="pc-head"><p class="pc-kicker">動手計算</p><h3 id="${prefix}-title">pH 改變時，β-乳球蛋白帶多少淨電荷？</h3><p class="pc-hint">用 6FXB 的實際序列，每個可解離基團各算一次 Henderson–Hasselbalch，再加總。</p></header>
    <section class="pc-exam" aria-labelledby="${prefix}-exam"><h4 id="${prefix}-exam">先判斷：pI 為 6 的蛋白放在 pH 5，淨電荷是？</h4>
      <div class="pc-choices" role="radiogroup" aria-labelledby="${prefix}-exam">${[['positive', '帶正電'], ['negative', '帶負電'], ['zero', '約為零']].map(([v, t]) => `<label class="pc-choice"><input type="radio" name="${prefix}-pred" value="${v}" data-pc-pred><span>${t}</span></label>`).join('')}</div>
      <button type="button" data-pc-action="reveal">看推理</button><div class="pc-reveal" data-pc-reveal hidden></div></section>
    <div class="pc-main">
      <div class="pc-plot"><div data-pc-chart></div>
        <label class="pc-slider" for="${prefix}-ph"><span>pH <output data-pc-ph></output></span><input id="${prefix}-ph" type="range" min="1" max="13" step="0.1" data-pc-input="pH"></label>
        <label class="pc-set"><span>pK 值來源</span><select data-pc-input="pkSet">${Object.entries(PK_SETS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></label></div>
      <div class="pc-readout" aria-live="polite"><p class="pc-net"><span>淨電荷</span><strong data-pc-net></strong><small data-pc-sign></small></p><p class="pc-pi-read">模型 pI <strong data-pc-pi></strong></p>
        <table class="pc-table"><caption>各基團的帶電量（個數 × 帶電分率）</caption><thead><tr><th scope="col">基團</th><th scope="col">個數</th><th scope="col">pK</th><th scope="col">貢獻</th></tr></thead><tbody data-pc-rows></tbody></table></div>
    </div>
    <p class="pc-gap">模型 pI 與文獻描述的「等電點附近約 pH 5.0」（${link('golebiowski2020')}）不一致：平均 pK 忽略了每個基團在蛋白質內的鄰近電荷、氫鍵與埋藏程度。切換兩組 pK 可看出 pI 對 pK 假設有多敏感。</p>
    <details class="pc-detail" data-pc-detail="write"><summary>寫下你的解釋（選填）</summary>
      <label for="${prefix}-note">用 Henderson–Hasselbalch 說明：pH 低於 pI 時，為什麼淨電荷偏正？</label><textarea id="${prefix}-note" data-pc-field="note" rows="4" maxlength="3000"></textarea>
      <div class="pc-save"><button type="button" data-pc-action="save">附加本課筆記</button><span data-pc-save-status role="status"></span></div></details>
    <details class="pc-detail" data-pc-detail="bounds"><summary>判讀界線與來源</summary><ul>
      <li>序列與雙硫鍵取自 ${link('pdb6fxb')} A 鏈：Cys66–Cys160、Cys106–Cys119 形成雙硫鍵不解離，只有 Cys121 計入。</li>
      <li>每個基團都用同一個平均 pK，並假設彼此獨立；不含鹽、溫度、結合離子或構形變化。曲線是模型，不是滴定實測。</li>
      <li>Arg 胍基採 ${link('fitch2015')} 的 13.8；兩組 pK 都用這個值。</li>
      <li>對應官方題目：${link('ntu115')}；本工作台是判讀練習，不是官方答案。</li>
    </ul><ol>${Object.values(SOURCES).map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('')}</ol></details>
  </section>`;

  const root = container.querySelector('.protein-charge-lab');
  const $ = s => root.querySelector(s);
  $('[data-pc-input="pH"]').value = state.pH;
  $('[data-pc-input="pkSet"]').value = state.pkSet;
  $('[data-pc-field="note"]').value = state.note;
  root.querySelectorAll('[data-pc-pred]').forEach(r => { r.checked = r.value === state.prediction; });

  function renderReveal() {
    const box = $('[data-pc-reveal]');
    box.hidden = !state.revealed;
    if (!state.revealed) return;
    const right = signAtPH(6, 5) === state.prediction;
    box.innerHTML = `<p class="${right ? 'pc-right' : 'pc-wrong'}">${state.prediction ? (right ? '你的判斷正確：帶正電。' : '答案是帶正電。') : '答案是帶正電。'}</p><p>pI 是淨電荷為零的 pH。pH 5 比 pI 低 1：對每個基團，[HA]/[A⁻] = 10<sup>pK−pH</sup>，pH 越低越偏向質子化形式。酸性基團（–COOH）較少帶負電，鹼性基團（–NH₃⁺）較多保持正電，所以淨電荷比在 pI 時（約為零）更偏正。用下方曲線把 pH 拉到模型 pI 的左側，也會看到同樣的方向。</p>`;
  }
  function render() {
    $('[data-pc-ph]').textContent = Number(state.pH).toFixed(1);
    $('[data-pc-chart]').innerHTML = chartSVG(state.pkSet, Number(state.pH));
    const rows = groupCharges(Number(state.pH), state.pkSet, counts), q = rows.reduce((s, g) => s + g.contribution, 0);
    $('[data-pc-net]').textContent = (q > 0.005 ? '+' : '') + fmt(q, 1);
    $('[data-pc-sign]').textContent = q > 0.05 ? '偏正' : q < -0.05 ? '偏負' : '約為零';
    $('[data-pc-net]').closest('.pc-net').dataset.pcSignState = q > 0.05 ? 'positive' : q < -0.05 ? 'negative' : 'zero';
    $('[data-pc-pi]').textContent = fmt(modelPI(state.pkSet));
    $('[data-pc-rows]').innerHTML = rows.map(g => `<tr data-pc-group="${g.id}"><th scope="row">${g.label}</th><td>${g.count}</td><td>${g.pK}</td><td class="${g.contribution > 0.005 ? 'pc-pos' : g.contribution < -0.005 ? 'pc-neg' : ''}">${g.contribution > 0.005 ? '+' : ''}${fmt(g.contribution)}</td></tr>`).join('');
    renderReveal();
  }
  render();

  const onInput = event => {
    if (disposed) return;
    const t = event.target;
    if (t.matches('[data-pc-input]')) { state[t.dataset.pcInput] = t.dataset.pcInput === 'pH' ? Number(t.value) : t.value; render(); }
    else if (t.matches('[data-pc-field="note"]')) state.note = t.value;
    else if (t.matches('[data-pc-pred]')) state.prediction = t.value;
  };
  const onClick = event => {
    if (disposed) return;
    const action = event.target.closest?.('[data-pc-action]')?.dataset.pcAction;
    if (action === 'reveal') { state.revealed = true; renderReveal(); }
    else if (action === 'save') {
      const status = $('[data-pc-save-status]');
      const text = [`【淨電荷曲線】pK 來源：${PK_SETS[state.pkSet].label}；模型 pI ${fmt(modelPI(state.pkSet))}`, `pH ${Number(state.pH).toFixed(1)} 時淨電荷 ${fmt(netCharge(Number(state.pH), state.pkSet), 1)}`, state.prediction ? `pI 6 / pH 5 的初判：${({positive: '帶正電', negative: '帶負電', zero: '約為零'})[state.prediction]}` : '', state.note.trim() ? '我的解釋：' + state.note.trim() : ''].filter(Boolean).join('\n');
      if (text === state.savedCursor) { status.textContent = '這份內容已附加過，沒有重複附加。'; return; }
      let ok = false;
      try { ok = typeof onSaveSummary === 'function' && onSaveSummary(text) === true; } catch { ok = false; }
      if (ok) { state.savedCursor = text; status.textContent = '已附加到本課筆記。'; } else status.textContent = '沒有附加成功；文字仍保留在上方，可先複製。';
    }
  };
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('click', onClick);
  return () => { disposed = true; root.removeEventListener('input', onInput); root.removeEventListener('change', onInput); root.removeEventListener('click', onClick); };
}
