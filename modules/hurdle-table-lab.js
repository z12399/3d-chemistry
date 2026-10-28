// FDA Food Code pH × water-activity interaction tables (Tables A and B), as reproduced by Texas DSHS.
// The tables decide only "non-TCS" versus "product assessment (PA) required"; PA means treat as TCS until shown otherwise.

export const HURDLE_TABLE_ID = 'hurdle-interaction-table';

// Table A: heat-treated to destroy vegetative cells and subsequently packaged (spore control).
export const TABLE_A = {
  title: '表 A：加熱殺滅營養細胞後包裝（控制芽孢）',
  aw: [{label: '≤ 0.92', test: a => a <= 0.92}, {label: '> 0.92–0.95', test: a => a > 0.92 && a <= 0.95}, {label: '> 0.95', test: a => a > 0.95}],
  ph: [{label: '≤ 4.6', test: p => p <= 4.6}, {label: '> 4.6–5.6', test: p => p > 4.6 && p <= 5.6}, {label: '> 5.6', test: p => p > 5.6}],
  cells: [['NTCS', 'NTCS', 'NTCS'], ['NTCS', 'NTCS', 'PA'], ['NTCS', 'PA', 'PA']]
};
// Table B: not heat-treated, or heat-treated but not packaged (vegetative cells and spores).
export const TABLE_B = {
  title: '表 B：未加熱，或加熱但未包裝（控制營養細胞與芽孢）',
  aw: [{label: '< 0.88', test: a => a < 0.88}, {label: '0.88–0.90', test: a => a >= 0.88 && a <= 0.90}, {label: '> 0.90–0.92', test: a => a > 0.90 && a <= 0.92}, {label: '> 0.92', test: a => a > 0.92}],
  ph: [{label: '< 4.2', test: p => p < 4.2}, {label: '4.2–4.6', test: p => p >= 4.2 && p <= 4.6}, {label: '> 4.6–5.0', test: p => p > 4.6 && p <= 5.0}, {label: '> 5.0', test: p => p > 5.0}],
  cells: [['NTCS', 'NTCS', 'NTCS', 'NTCS'], ['NTCS', 'NTCS', 'NTCS', 'PA'], ['NTCS', 'NTCS', 'PA', 'PA'], ['NTCS', 'PA', 'PA', 'PA']]
};

export const EXAMPLES = [
  {id: 'melon', label: '切開的甜瓜（未加熱）', heated: false, packaged: false, pH: 6.5, aw: 0.995, note: '哈密瓜 pH 約 6.2–7.1、水活性 > 0.99；本例 0.995 為查表代表值，不是原文報告的單一測值。刀切面可帶入病原。'},
  {id: 'sprouts', label: '生芽菜（未加熱）', heated: false, packaged: false, pH: 6.6, aw: 0.995, note: 'pH > 6.5、水活性 > 0.99，無法以這兩項阻止病原生長。'},
  {id: 'parmesan', label: '帕瑪森起司（加熱凝乳後熟成、包裝）', heated: true, packaged: true, pH: 6.5, aw: 0.72, note: '水活性 0.68–0.76、pH 約 6.5。'},
  {id: 'dressing', label: '沙拉醬（分裝）', heated: false, packaged: false, pH: 4.0, aw: 0.84, note: '配方 pH 3.6–4.4、水活性 < 0.85。'}
];

export const LIMITS = [
  ['Clostridium botulinum A、B 型（蛋白分解型）', '生長與產毒的限制 pH 4.7；水活性 0.93'],
  ['Bacillus cereus、Clostridium perfringens', '允許生長或產毒的最低水活性 0.93'],
  ['Staphylococcus aureus', '最低生長 pH 4.2；最低產毒水活性 0.88'],
  ['Listeria monocytogenes', '最低生長 pH 接近 4.4']
];

export const SOURCES = {
  dshs: {label: 'Texas DSHS（2017）How to determine whether foods require time/temperature control for safety (TCS)（重製 2005 FDA Food Code 表 A、表 B 與限制值說明）', url: 'https://www.dshs.texas.gov/foodestablishments/pdf/GuidanceDocs/How-to-determine-if-foods-require-time-and-temperature'},
  foodcode: {label: 'FDA Food Code（TCS 食品定義中的 pH／水活性交互作用表）', url: 'https://www.fda.gov/food/retail-food-protection/fda-food-code'}
};

export function tableFor(heated, packaged) { return heated && packaged ? TABLE_A : TABLE_B; }

export function classify({heated, packaged, pH, aw}) {
  const t = tableFor(heated, packaged);
  const r = t.aw.findIndex(x => x.test(aw)), c = t.ph.findIndex(x => x.test(pH));
  if (r < 0 || c < 0) throw new RangeError('pH 或水活性超出表格範圍');
  return {table: t === TABLE_A ? 'A' : 'B', row: r, col: c, result: t.cells[r][c]};
}

// Hurdle effect: neither factor alone (with the other at its least restrictive band) gives NTCS, but together they do.
export function hurdleEffect(s) {
  const t = tableFor(s.heated, s.packaged), {row, col, result} = classify(s);
  const worstAw = t.aw.length - 1, worstPh = t.ph.length - 1;
  const phAlone = t.cells[worstAw][col] === 'NTCS', awAlone = t.cells[row][worstPh] === 'NTCS';
  return {combined: result === 'NTCS' && !phAlone && !awAlone, phAlone, awAlone};
}

const drafts = new WeakMap();
let instance = 0;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

export function mountHurdleTableLab(container, id = HURDLE_TABLE_ID, options = {}) {
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const {draftOwner, draftKey = id, onSaveSummary} = options;
  let store = null;
  if (draftOwner && typeof draftOwner === 'object') { store = drafts.get(draftOwner); if (!store) { store = new Map(); drafts.set(draftOwner, store); } }
  const defaultExample = EXAMPLES.find(item => item.id === 'melon');
  const state = store?.get(draftKey) || {heated: defaultExample.heated, packaged: defaultExample.packaged, pH: defaultExample.pH, aw: defaultExample.aw, example: defaultExample.id, savedCursor: ''};
  store?.set(draftKey, state);
  const prefix = `ht-${++instance}`;
  let disposed = false;
  const yesNo = (k, q) => `<fieldset class="ht-q"><legend>${q}</legend>${[['true', '是'], ['false', '否']].map(([v, t]) => `<label class="ht-choice"><input type="radio" name="${prefix}-${k}" value="${v}" data-ht-flag="${k}"><span>${t}</span></label>`).join('')}</fieldset>`;

  container.innerHTML = `<section class="hurdle-lab" data-ht-lab="${esc(id)}" aria-labelledby="${prefix}-title">
    <header class="ht-head"><p class="ht-kicker">動手判讀</p><h3 id="${prefix}-title">依歷史表格，如何判讀 pH 與水活性？</h3><p class="ht-hint">依 2005 年美國 FDA Food Code 的交互作用表練習判讀；「PA」表示需進一步產品評估，原文件在評估前將其視為 TCS。本活動是教學示例，不作現行法規或實際食品安全判定。</p></header>
    <label class="ht-example"><span>帶入例子</span><select data-ht-example>${EXAMPLES.map(e => `<option value="${e.id}">${esc(e.label)}</option>`).join('')}<option value="custom">自訂</option></select></label>
    <div class="ht-flow">${yesNo('heated', '1. 是否經加熱殺滅營養細胞？')}${yesNo('packaged', '2. 加熱後是否包裝以防再汙染？')}</div>
    <div class="ht-main">
      <div class="ht-sliders">
        <label><span>pH <output data-ht-out="pH"></output></span><input type="range" min="3" max="7.5" step="0.1" data-ht-input="pH"></label>
        <label><span>水活性 a<sub>w</sub> <output data-ht-out="aw"></output></span><input type="range" min="0.68" max="1.00" step="0.005" data-ht-input="aw"></label>
        <p class="ht-verdict" data-ht-verdict aria-live="polite"></p>
        <p class="ht-hurdle" data-ht-hurdle hidden></p>
        <p class="ht-example-note" data-ht-note></p>
      </div>
      <div class="ht-table-wrap" data-ht-table></div>
    </div>
    <details class="ht-detail" data-ht-detail="why"><summary>表格的界線從哪裡來？</summary><table class="ht-limits"><tbody>${LIMITS.map(([o, v]) => `<tr><th scope="row"><i>${esc(o.split('（')[0])}</i>${o.includes('（') ? '（' + esc(o.split('（')[1]) : ''}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table><p>加熱並包裝後，營養型病原已被殺滅且不再汙染，剩下芽孢形成菌，所以表 A 可容許較高的 pH 與水活性；未加熱或未包裝時，還要擋住營養細胞（如 <i>S. aureus</i>），表 B 的界線較嚴。同時用幾個單獨不足以抑菌的條件，就是「障礙效應」。</p></details>
    <details class="ht-detail" data-ht-detail="write"><summary>附加本課筆記（選填）</summary><div class="ht-save"><button type="button" data-ht-action="save">附加目前判讀到本課筆記</button><span data-ht-save-status role="status"></span></div></details>
    <details class="ht-detail" data-ht-detail="bounds"><summary>判讀界線與來源</summary><ul>
      <li>表格只處理 pH 與水活性；防腐劑、溫度、氣體、競爭菌等其他障礙不在表內，遇到時需產品評估或挑戰試驗。</li>
      <li>多成分食品（如加料麵包、壽司）在不同成分的交界 pH、水活性可能不同，應分開評估。</li>
      <li>表 A 第一列：德州文件表格寫「< 0.92」，同文內文寫「0.92 或以下」皆為非 TCS；本工作台採內文的 ≤ 0.92。</li>
      <li>對應官方題目：<a href="https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-241.pdf" target="_blank" rel="noopener noreferrer">115 食微第七題（Hurdle technology）</a>等；本工作台是判讀練習，不是官方答案或法規諮詢。</li>
    </ul><ol>${Object.values(SOURCES).map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('')}</ol></details>
  </section>`;

  const root = container.querySelector('.hurdle-lab');
  const $ = s => root.querySelector(s);
  function fill() {
    $('[data-ht-input="pH"]').value = state.pH; $('[data-ht-input="aw"]').value = state.aw;
    root.querySelectorAll('[data-ht-flag]').forEach(r => { r.checked = String(state[r.dataset.htFlag]) === r.value; });
    $('[data-ht-example]').value = state.example;
  }
  function render() {
    $('[data-ht-out="pH"]').textContent = Number(state.pH).toFixed(1);
    $('[data-ht-out="aw"]').textContent = Number(state.aw).toFixed(3);
    $('[data-ht-flag="packaged"][value="true"]').closest('fieldset').classList.toggle('ht-muted', !state.heated);
    const t = tableFor(state.heated, state.packaged), c = classify(state), h = hurdleEffect(state);
    $('[data-ht-table]').innerHTML = `<table class="ht-grid" data-ht-which="${c.table}"><caption>${t.title}</caption><thead><tr><th scope="col">a<sub>w</sub> ＼ pH</th>${t.ph.map(p => `<th scope="col">${p.label}</th>`).join('')}</tr></thead><tbody>${t.aw.map((a, r) => `<tr><th scope="row">${a.label}</th>${t.cells[r].map((v, k) => `<td class="ht-${v.toLowerCase()}${r === c.row && k === c.col ? ' ht-here' : ''}"${r === c.row && k === c.col ? ' aria-current="true"' : ''}>${v === 'NTCS' ? '非 TCS' : 'PA'}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const v = $('[data-ht-verdict]');
    v.dataset.htResult = c.result;
    v.innerHTML = c.result === 'NTCS' ? `<strong>非 TCS</strong>（2005 表 ${c.table} 的教學分類）；不作現行法規或實際食品安全判定。` : `<strong>需產品評估（PA）</strong>（2005 表 ${c.table} 的教學分類）；不作現行法規或實際食品安全判定。`;
    const hb = $('[data-ht-hurdle]');
    hb.hidden = !h.combined;
    if (h.combined) hb.textContent = '障礙效應：依這張歷史表，單看 pH 或水活性都未落入非 TCS 格；兩者組合落入非 TCS 格。這是表格條件下的分類。';
    const ex = EXAMPLES.find(e => e.id === state.example);
    $('[data-ht-note]').textContent = ex ? ex.note : '';
  }
  fill(); render();

  const onInput = event => {
    if (disposed) return;
    const t = event.target;
    if (t.matches('[data-ht-example]')) { const e = EXAMPLES.find(x => x.id === t.value); if (e) Object.assign(state, {heated: e.heated, packaged: e.packaged, pH: e.pH, aw: e.aw, example: e.id}); else state.example = 'custom'; fill(); render(); return; }
    if (t.matches('[data-ht-flag]')) { state[t.dataset.htFlag] = t.value === 'true'; state.example = 'custom'; $('[data-ht-example]').value = 'custom'; render(); return; }
    if (t.matches('[data-ht-input]')) { state[t.dataset.htInput] = Number(t.value); state.example = 'custom'; $('[data-ht-example]').value = 'custom'; render(); }
  };
  const onClick = event => {
    if (disposed || !event.target.closest?.('[data-ht-action="save"]')) return;
    const status = $('[data-ht-save-status]'), c = classify(state), h = hurdleEffect(state);
    const text = `【pH × 水活性交互作用表】${state.heated ? '加熱' : '未加熱'}、${state.packaged ? '包裝' : '未包裝'} → 表 ${c.table}；pH ${Number(state.pH).toFixed(1)}、aw ${Number(state.aw).toFixed(3)} → ${c.result === 'NTCS' ? '非 TCS' : '需產品評估（PA）'}${h.combined ? '（障礙效應）' : ''}`;
    if (text === state.savedCursor) { status.textContent = '這份內容已附加過，沒有重複附加。'; return; }
    let ok = false;
    try { ok = typeof onSaveSummary === 'function' && onSaveSummary(text) === true; } catch { ok = false; }
    if (ok) { state.savedCursor = text; status.textContent = '已附加到本課筆記。'; } else status.textContent = '沒有附加成功。';
  };
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('click', onClick);
  return () => { disposed = true; root.removeEventListener('input', onInput); root.removeEventListener('change', onInput); root.removeEventListener('click', onClick); };
}
