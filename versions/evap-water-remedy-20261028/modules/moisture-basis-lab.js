// Wet-basis / dry-basis drying ledger: dry matter is conserved, only water leaves.
// Constant water-removal rate is a stated assumption of the exercise, not a drying-curve model.

export const MOISTURE_BASIS_ID = 'moisture-basis-ledger';

export const PRESETS = {
  exam115: {label: '115 加工第 5 題：200 kg 濕穀，30 wb% → 0.125 db，每小時除水 5 kg', mass: 200, initial: 30, initialBasis: 'wb', target: 0.125, targetBasis: 'db', rate: 5},
  practice: {label: '本課練習：80 kg 果肉，75 wb% → 20 wb%，每小時除水 5 kg', mass: 80, initial: 75, initialBasis: 'wb', target: 20, targetBasis: 'wb', rate: 5}
};

export const SOURCES = {
  fao: {short: 'FAO', label: 'FAO Farm Structures in Tropical Climates：Moisture Content（濕基、乾基定義與換算）', url: 'https://www.fao.org/4/s1250e/S1250E0u.htm'},
  ntu115: {short: '115 加工第 5 題', label: '臺大 115 學年度碩士班招生考試 食品加工學（題號 240）第 5 題', url: 'https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-240.pdf'}
};

// Wet basis entered in %, dry basis entered as kg water / kg dry matter (a ratio, may exceed 1).
export function toDryBasis(value, basis) {
  if (basis === 'wb') { const w = value / 100; if (!(w >= 0 && w < 1)) throw new RangeError('wet basis must be 0–<100%'); return w / (1 - w); }
  if (!(value >= 0)) throw new RangeError('dry basis must be ≥ 0');
  return value;
}
export const toWetPercent = X => 100 * X / (1 + X);

export function ledger({mass, initial, initialBasis, target, targetBasis, rate}) {
  const X0 = toDryBasis(initial, initialBasis), X1 = toDryBasis(target, targetBasis);
  const solids = mass / (1 + X0), water0 = mass - solids, water1 = solids * X1, removed = water0 - water1;
  return {X0, X1, w0: toWetPercent(X0), w1: toWetPercent(X1), solids, water0, water1, finalMass: solids + water1, removed, hours: rate > 0 ? removed / rate : NaN};
}

// Answers produced by the three commonest slips, so a learner's number can be diagnosed.
export function commonSlips(input) {
  const out = [];
  const swap = b => (b === 'wb' ? 'db' : 'wb');
  const conv = (v, from) => from === 'wb' ? v / 100 : v * 100; // reinterpret the same digits in the other basis
  try { out.push({id: 'target-basis', hint: '把目標水分的基準看錯（乾基當濕基或反之）。', hours: ledger({...input, target: conv(input.target, input.targetBasis), targetBasis: swap(input.targetBasis)}).hours}); } catch {}
  try { out.push({id: 'initial-basis', hint: '把初始水分的基準看錯。', hours: ledger({...input, initial: conv(input.initial, input.initialBasis), initialBasis: swap(input.initialBasis)}).hours}); } catch {}
  const w0 = input.initialBasis === 'wb' ? input.initial / 100 : input.initial / (1 + input.initial);
  const w1 = input.targetBasis === 'wb' ? input.target / 100 : input.target;
  out.push({id: 'subtract', hint: '直接用總重乘以「水分相減」，忽略分母（乾物質）不變、總重會變。', hours: input.mass * (w0 - w1) / input.rate});
  return out.filter(s => Number.isFinite(s.hours) && s.hours > 0);
}

export function diagnose(answer, input, tol = 0.02) {
  const right = ledger(input).hours;
  if (!Number.isFinite(answer)) return {state: 'empty'};
  if (Math.abs(answer - right) <= Math.max(tol, tol * right)) return {state: 'right', right};
  const slip = commonSlips(input).find(s => Math.abs(answer - s.hours) <= Math.max(tol, tol * s.hours) && Math.abs(s.hours - right) > tol);
  return slip ? {state: 'slip', right, slip} : {state: 'wrong', right};
}

const drafts = new WeakMap();
let instance = 0;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const n = (x, d = 2) => Number.isFinite(x) ? (+x.toFixed(d)).toString() : '—';
const link = k => `<a href="${SOURCES[k].url}" target="_blank" rel="noopener noreferrer">${esc(SOURCES[k].short)}</a>`;

function barsSVG(r) {
  const W = 420, H = 230, B = 34, T = 16, max = Math.max(r.solids + r.water0, 1), h = v => (H - T - B) * v / max;
  const col = (x, solids, water, label) => `<rect x="${x}" y="${H - B - h(solids)}" width="110" height="${h(solids)}" class="mb-solid"/><rect x="${x}" y="${H - B - h(solids) - h(water)}" width="110" height="${h(water)}" class="mb-water"/><text x="${x + 55}" y="${H - B - h(solids) / 2 + 5}" text-anchor="middle" class="mb-in">${n(solids, 1)}</text>${h(water) > 16 ? `<text x="${x + 55}" y="${H - B - h(solids) - h(water) / 2 + 5}" text-anchor="middle" class="mb-in">${n(water, 1)}</text>` : ''}<text x="${x + 55}" y="${H - 12}" text-anchor="middle">${label}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="mb-chart" role="img" aria-label="乾燥前水 ${n(r.water0, 1)} kg、乾物質 ${n(r.solids, 1)} kg；乾燥後水 ${n(r.water1, 1)} kg">${col(60, r.solids, r.water0, '乾燥前')}${col(250, r.solids, r.water1, '乾燥後')}<line x1="40" x2="${W - 10}" y1="${H - B}" y2="${H - B}" class="mb-axis"/></svg>`;
}

export function mountMoistureBasisLab(container, id = MOISTURE_BASIS_ID, options = {}) {
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const {draftOwner, draftKey = id, onSaveSummary} = options;
  let store = null;
  if (draftOwner && typeof draftOwner === 'object') { store = drafts.get(draftOwner); if (!store) { store = new Map(); drafts.set(draftOwner, store); } }
  const state = store?.get(draftKey) || {...PRESETS.exam115, answer: '', checked: false, savedCursor: ''};
  store?.set(draftKey, state);
  const prefix = `mb-${++instance}`;
  let disposed = false;
  const num = (k, label, step, unit) => `<label class="mb-field"><span>${label}</span><span class="mb-input"><input type="number" inputmode="decimal" step="${step}" min="0" data-mb-input="${k}" id="${prefix}-${k}"><small>${unit}</small></span></label>`;
  const basis = k => `<select data-mb-input="${k}" aria-label="基準"><option value="wb">濕基 %</option><option value="db">乾基（kg 水／kg 乾物）</option></select>`;

  container.innerHTML = `<section class="moisture-lab" data-mb-lab="${esc(id)}" aria-labelledby="${prefix}-title">
    <header class="mb-head"><p class="mb-kicker">動手計算</p><h3 id="${prefix}-title">乾到進倉條件，要除掉多少水、花多久？</h3><p class="mb-hint">本題假設只移除水，乾物質前後不變。本台已顯示完整步驟與結果，供示範和對照自己的算法；這不是揭答前的檢索練習。</p></header>
    <label class="mb-preset"><span>套用題目</span><select data-mb-preset>${Object.entries(PRESETS).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('')}<option value="custom">自訂</option></select></label>
    <div class="mb-inputs">
      ${num('mass', '濕料質量', 'any', 'kg')}
      <div class="mb-field"><span>初始水分</span><span class="mb-input"><input type="number" inputmode="decimal" step="any" min="0" data-mb-input="initial" aria-label="初始水分數值">${basis('initialBasis')}</span></div>
      <div class="mb-field"><span>目標水分</span><span class="mb-input"><input type="number" inputmode="decimal" step="any" min="0" data-mb-input="target" aria-label="目標水分數值">${basis('targetBasis')}</span></div>
      ${num('rate', '乾燥機除水速率', 'any', 'kg 水／h')}
    </div>
    <div class="mb-try"><label for="${prefix}-answer">你算出的乾燥時間</label><span class="mb-input"><input id="${prefix}-answer" type="number" inputmode="decimal" step="any" data-mb-answer><small>h</small></span><button type="button" data-mb-action="check">核對</button><p data-mb-feedback role="status"></p></div>
    <div class="mb-main">
      <ol class="mb-steps" data-mb-steps aria-live="polite"></ol>
      <div class="mb-plot"><div data-mb-chart></div><p class="mb-key"><span class="mb-sw mb-solid"></span>乾物質（不變）<span class="mb-sw mb-water"></span>水</p></div>
    </div>
    <p class="mb-error" data-mb-error role="alert" hidden></p>
    <details class="mb-detail" data-mb-detail="why"><summary>乾基和濕基差在哪？</summary><p>濕基水分 w = 水／（水＋乾物質），分母是整份濕料；乾基水分 X = 水／乾物質，可超過 1。互換：X = w／(1 − w)，w = X／(1 + X)（${link('fao')}）。乾燥時總重一直變，乾物質不變，所以用乾基做收支最直接。</p></details>
    <details class="mb-detail" data-mb-detail="write"><summary>附加本課筆記（選填）</summary><div class="mb-save"><button type="button" data-mb-action="save">附加目前計算到本課筆記</button><span data-mb-save-status role="status"></span></div></details>
    <details class="mb-detail" data-mb-detail="bounds"><summary>判讀界線與來源</summary><ul>
      <li>假設乾燥只移除水、乾物質無流失或增加；除水速率由題目給定為定值。實際乾燥有恆速期與減速期，速率會變。</li>
      <li>對應官方題目：${link('ntu115')}；本工作台是計算練習，不是官方答案。</li></ul>
      <ol>${Object.values(SOURCES).map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('')}</ol></details>
  </section>`;

  const root = container.querySelector('.moisture-lab');
  const $ = s => root.querySelector(s);
  const fields = ['mass', 'initial', 'initialBasis', 'target', 'targetBasis', 'rate'];
  function fill() { fields.forEach(k => { $(`[data-mb-input="${k}"]`).value = state[k]; }); $('[data-mb-answer]').value = state.answer; const p = Object.entries(PRESETS).find(([, v]) => fields.every(k => v[k] === state[k])); $('[data-mb-preset]').value = p ? p[0] : 'custom'; }
  function input() { return Object.fromEntries(fields.map(k => [k, state[k]])); }
  function render() {
    const err = $('[data-mb-error]');
    let r;
    try { r = ledger(input()); if (!(r.removed > 0)) throw new RangeError('目標水分不低於初始水分，不需要除水。'); if (!(state.rate > 0)) throw new RangeError('除水速率需大於 0。'); err.hidden = true; }
    catch (e) { err.hidden = false; err.textContent = e instanceof RangeError && /[一-鿿]/.test(e.message) ? e.message : '請檢查輸入：濕基需在 0–100% 之間，數值不可為負。'; $('[data-mb-steps]').innerHTML = ''; $('[data-mb-chart]').innerHTML = ''; return; }
    $('[data-mb-steps]').innerHTML = [
      ['初始乾基', `X₀ = ${state.initialBasis === 'wb' ? `${n(state.initial)}% ÷ (100 − ${n(state.initial)})%` : n(state.initial)} = <strong>${n(r.X0, 4)}</strong> kg/kg（濕基 ${n(r.w0)}%）`],
      ['乾物質（守恆）', `${n(state.mass)} ÷ (1 + ${n(r.X0, 4)}) = <strong>${n(r.solids)}</strong> kg`],
      ['初始水', `${n(state.mass)} − ${n(r.solids)} = <strong>${n(r.water0)}</strong> kg`],
      ['目標乾基', `X₁ = <strong>${n(r.X1, 4)}</strong> kg/kg（濕基 ${n(r.w1)}%）`],
      ['目標水', `${n(r.solids)} × ${n(r.X1, 4)} = <strong>${n(r.water1)}</strong> kg；成品 ${n(r.finalMass)} kg`],
      ['需除水', `${n(r.water0)} − ${n(r.water1)} = <strong>${n(r.removed)}</strong> kg`],
      ['時間', `${n(r.removed)} ÷ ${n(state.rate)} = <strong data-mb-hours>${n(r.hours)}</strong> h`]
    ].map(([t, v]) => `<li><span>${t}</span><span>${v}</span></li>`).join('');
    $('[data-mb-chart]').innerHTML = barsSVG(r);
    renderFeedback();
  }
  function renderFeedback() {
    const fb = $('[data-mb-feedback]');
    if (!state.checked) { fb.textContent = ''; fb.className = ''; return; }
    let d; try { d = diagnose(parseFloat(state.answer), input()); } catch { d = {state: 'wrong'}; }
    fb.className = 'mb-fb-' + d.state;
    fb.textContent = d.state === 'empty' ? '先填入你算的時數。' : d.state === 'right' ? `正確：${n(d.right)} h。` : d.state === 'slip' ? `你的數字正好是常見錯誤的結果：${d.slip.hint} 對照右側逐步帳，正確是 ${n(d.right)} h。` : `和逐步帳不同（正確 ${n(d.right)} h）。先檢查乾物質與兩端水量。`;
    fb.dataset.mbState = d.state;
  }
  fill(); render();

  const onInput = event => {
    if (disposed) return;
    const t = event.target;
    if (t.matches('[data-mb-preset]')) { if (PRESETS[t.value]) { Object.assign(state, PRESETS[t.value]); state.checked = false; fill(); render(); } return; }
    if (t.matches('[data-mb-input]')) { const k = t.dataset.mbInput; state[k] = k.endsWith('Basis') ? t.value : parseFloat(t.value); state.checked = false; $('[data-mb-preset]').value = 'custom'; render(); }
    else if (t.matches('[data-mb-answer]')) { state.answer = t.value; }
  };
  const onClick = event => {
    if (disposed) return;
    const a = event.target.closest?.('[data-mb-action]')?.dataset.mbAction;
    if (a === 'check') { state.checked = true; renderFeedback(); }
    else if (a === 'save') {
      const status = $('[data-mb-save-status]');
      let r; try { r = ledger(input()); } catch { status.textContent = '輸入有誤，無法附加。'; return; }
      const text = [`【乾基／濕基收支】${n(state.mass)} kg，${n(state.initial)} ${state.initialBasis === 'wb' ? 'wb%' : 'db'} → ${n(state.target)} ${state.targetBasis === 'wb' ? 'wb%' : 'db'}，除水 ${n(state.rate)} kg/h`, `乾物質 ${n(r.solids)} kg；初始水 ${n(r.water0)} kg；目標水 ${n(r.water1)} kg；需除水 ${n(r.removed)} kg；時間 ${n(r.hours)} h`, state.answer !== '' ? `我的答案：${state.answer} h` : ''].filter(Boolean).join('\n');
      if (text === state.savedCursor) { status.textContent = '這份內容已附加過，沒有重複附加。'; return; }
      let ok = false;
      try { ok = typeof onSaveSummary === 'function' && onSaveSummary(text) === true; } catch { ok = false; }
      if (ok) { state.savedCursor = text; status.textContent = '已附加到本課筆記。'; } else status.textContent = '沒有附加成功；可先複製右側計算。';
    }
  };
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('click', onClick);
  return () => { disposed = true; root.removeEventListener('input', onInput); root.removeEventListener('change', onInput); root.removeEventListener('click', onClick); };
}
