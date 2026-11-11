// Dryer air balance on a dry-air basis: water removed from the feed sets the dry-air flow through ΔY,
// and the same dry-air flow times the heater Δh gives the ideal heater duty.
// States in "air" mode come from the existing reviewed psychrometric model (ideal mixture, 101.325 kPa).
import {dryingAirPath, PSYCHROMETRIC_LIMITS, PSYCHROMETRIC_SOURCES} from './psychrometric-model.js';

export const DRYER_AIR_ID = 'dryer-air-ledger';

export const PRESETS = {
  practice: {label: '本課練習：120 kg/h 果泥 80→20 wb%，YB 0.010、YC 0.020、hA 50、hB 90', mode: 'given', feed: 120, wIn: 80, wOut: 20, YB: 0.010, YC: 0.020, hA: 50, hB: 90, inletTC: 25, inletRH: 0.6, heatingDeltaC: 35, progress: 0.6},
  transfer: {label: '本課延伸：同上，但出口只能到 YC 0.015', mode: 'given', feed: 120, wIn: 80, wOut: 20, YB: 0.010, YC: 0.015, hA: 50, hB: 90, inletTC: 25, inletRH: 0.6, heatingDeltaC: 35, progress: 0.6},
  air: {label: '由空氣狀態推：25°C、RH 60%，加熱 35°C，出口走到飽和差的 60%', mode: 'air', feed: 120, wIn: 80, wOut: 20, YB: 0.010, YC: 0.020, hA: 50, hB: 90, inletTC: 25, inletRH: 0.6, heatingDeltaC: 35, progress: 0.6}
};

export function feedBalance(feed, wInPct, wOutPct) {
  const wi = wInPct / 100, wo = wOutPct / 100;
  if (!(feed > 0) || !(wi >= 0 && wi < 1) || !(wo >= 0 && wo < 1)) throw new RangeError('進料需 > 0，濕基水分需在 0–100% 之間。');
  if (!(wo < wi)) throw new RangeError('成品水分需低於進料水分。');
  const solids = feed * (1 - wi), product = solids / (1 - wo);
  return {solids, product, water: feed - product};
}

export function airStates(s) {
  if (s.mode === 'given') {
    if (!(s.YC > s.YB) || !(s.YB >= 0)) throw new RangeError('出口含濕比 YC 需大於入口 YB。');
    if (!(s.hB > s.hA)) throw new RangeError('加熱後焓 hB 需大於加熱前 hA。');
    return {YB: s.YB, YC: s.YC, hA: s.hA, hB: s.hB, given: true};
  }
  const p = dryingAirPath({inletTC: s.inletTC, inletRH: s.inletRH, heatingDeltaC: s.heatingDeltaC, progress: s.progress, dryAirFlowKgH: 1});
  if (!(p.C.humidityRatio > p.B.humidityRatio)) throw new RangeError('出口進程需大於 0，空氣才會帶走水。');
  return {YB: p.B.humidityRatio, YC: p.C.humidityRatio, hA: p.A.hKJkgDa, hB: p.B.hKJkgDa, A: p.A, B: p.B, C: p.C, sat: p.saturationEnd, given: false};
}

export function ledger(s) {
  const f = feedBalance(s.feed, s.wIn, s.wOut), a = airStates(s);
  const dY = a.YC - a.YB, dryAir = f.water / dY, heaterKJh = dryAir * (a.hB - a.hA);
  return {...f, ...a, dY, dryAir, moistAirIn: dryAir * (1 + a.YB), heaterKW: heaterKJh / 3600, heaterKJh};
}

export function sensitivity(s, progresses = [0.3, 0.5, 0.7, 0.9]) {
  return progresses.map(progress => { try { const r = ledger({...s, mode: 'air', progress}); return {progress, dryAir: r.dryAir, heaterKW: r.heaterKW, exitT: r.C.tDbC, exitRH: r.C.rh}; } catch { return {progress}; } });
}

const drafts = new WeakMap();
let instance = 0;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const n = (x, d = 1) => Number.isFinite(x) ? (+x.toFixed(d)).toLocaleString('en-US') : '—';

export function mountDryerAirLab(container, id = DRYER_AIR_ID, options = {}) {
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const {draftOwner, draftKey = id, onSaveSummary} = options;
  let store = null;
  if (draftOwner && typeof draftOwner === 'object') { store = drafts.get(draftOwner); if (!store) { store = new Map(); drafts.set(draftOwner, store); } }
  const state = store?.get(draftKey) || {...PRESETS.practice, savedCursor: ''};
  store?.set(draftKey, state);
  const prefix = `da-${++instance}`;
  let disposed = false;
  const L = PSYCHROMETRIC_LIMITS;
  const field = (k, label, step, unit, extra = '') => `<label class="da-field"><span>${label}</span><span class="da-input"><input type="number" inputmode="decimal" step="${step}" data-da-input="${k}" ${extra}><small>${unit}</small></span></label>`;

  container.innerHTML = `<section class="dryer-air-lab" data-da-lab="${esc(id)}" aria-labelledby="${prefix}-title">
    <header class="da-head"><p class="da-kicker">動手計算</p><h3 id="${prefix}-title">要除掉這些水，需要多少乾空氣、多大的加熱器？</h3><p class="da-hint">先由乾物質守恆算除水量，再用同一份乾空氣做水收支（ΔY）與加熱器能量收支（Δh）。</p></header>
    <label class="da-preset"><span>套用情境</span><select data-da-preset>${Object.entries(PRESETS).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('')}<option value="custom">自訂</option></select></label>
    <fieldset class="da-group"><legend>進料</legend>${field('feed', '進料量', 'any', 'kg/h', 'min="0"')}${field('wIn', '進料水分', 'any', '% 濕基', 'min="0" max="99.9"')}${field('wOut', '成品水分', 'any', '% 濕基', 'min="0" max="99.9"')}</fieldset>
    <fieldset class="da-group"><legend>空氣狀態</legend>
      <div class="da-mode" role="radiogroup" aria-label="空氣狀態來源">${[['given', '題目給定 Y 與 h'], ['air', '由外氣與加熱推算']].map(([v, t]) => `<label class="da-choice"><input type="radio" name="${prefix}-mode" value="${v}" data-da-mode><span>${t}</span></label>`).join('')}</div>
      <div class="da-given" data-da-panel="given">${field('YB', '入口 YB（=YA）', '0.001', 'kg 水/kg 乾空氣', 'min="0"')}${field('YC', '出口 YC', '0.001', 'kg 水/kg 乾空氣', 'min="0"')}${field('hA', '加熱前 hA', 'any', 'kJ/kg 乾空氣')}${field('hB', '加熱後 hB', 'any', 'kJ/kg 乾空氣')}</div>
      <div class="da-air" data-da-panel="air">${field('inletTC', '外氣溫度', '0.5', `°C（${L.inletTC.join('–')}）`, `min="${L.inletTC[0]}" max="${L.inletTC[1]}"`)}${field('inletRH', '外氣相對濕度', '0.05', `（${L.inletRH.join('–')}）`, `min="${L.inletRH[0]}" max="${L.inletRH[1]}"`)}${field('heatingDeltaC', '加熱升溫', '1', `°C（0–${L.heatingDeltaC[1]}）`, `min="0" max="${L.heatingDeltaC[1]}"`)}
        <label class="da-field"><span>出口走到飽和差的 <output data-da-out="progress"></output></span><input type="range" min="0.05" max="1" step="0.05" data-da-input="progress"></label></div>
    </fieldset>
    <p class="da-error" data-da-error role="alert" hidden></p>
    <div class="da-results" aria-live="polite" data-da-results></div>
    <div class="da-sens" data-da-sens></div>
    <details class="da-detail" data-da-detail="why"><summary>為什麼要用「乾空氣」當基準？</summary><p>空氣通過乾燥器時會吸水，濕空氣總量一直變，但乾空氣的量不變。含濕比 Y 是 kg 水／kg 乾空氣，焓 h 是 kJ／kg 乾空氣，所以除水量 = 乾空氣流量 × (YC − YB)，加熱器負荷 = 乾空氣流量 × (hB − hA)。加熱只升溫、不加水，所以 YA = YB。</p></details>
    <details class="da-detail" data-da-detail="write"><summary>附加本課筆記（選填）</summary><div class="da-save"><button type="button" data-da-action="save">附加目前計算到本課筆記</button><span data-da-save-status role="status"></span></div></details>
    <details class="da-detail" data-da-detail="bounds"><summary>判讀界線與來源</summary><ul>
      <li>穩態、乾空氣守恆、無漏氣、無凝結；乾物質不流失。加熱器負荷是理想值，不含設備散熱、風機或燃料轉換損失。</li>
      <li>「由外氣推算」模式中 B→C 採定焓數學路徑（略去食品顯熱、補入液水顯焓與熱損失），出口進程只是含濕比差的比例，不是時間或乾燥效率；能否達到要看傳熱傳質與停留時間。</li>
      <li>濕空氣性質沿用本站濕空氣線圖模型：總壓 101.325 kPa、理想混合近似。</li>
      <li>對應官方題目：<a href="https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-240.pdf" target="_blank" rel="noopener noreferrer">115 加工第 5 題</a>、<a href="https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-258.pdf" target="_blank" rel="noopener noreferrer">114 加工第 5 題</a>；本工作台是計算練習，不是官方答案。</li>
    </ul><ol>${PSYCHROMETRIC_SOURCES.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></li>`).join('')}</ol></details>
  </section>`;

  const root = container.querySelector('.dryer-air-lab');
  const $ = s => root.querySelector(s);
  const keys = ['feed', 'wIn', 'wOut', 'YB', 'YC', 'hA', 'hB', 'inletTC', 'inletRH', 'heatingDeltaC', 'progress'];
  function fill() {
    keys.forEach(k => { $(`[data-da-input="${k}"]`).value = state[k]; });
    root.querySelectorAll('[data-da-mode]').forEach(r => { r.checked = r.value === state.mode; });
    const p = Object.entries(PRESETS).find(([, v]) => v.mode === state.mode && keys.every(k => v[k] === state[k]));
    $('[data-da-preset]').value = p ? p[0] : 'custom';
  }
  function render() {
    $('[data-da-panel="given"]').hidden = state.mode !== 'given';
    $('[data-da-panel="air"]').hidden = state.mode !== 'air';
    $('[data-da-out="progress"]').textContent = Math.round(state.progress * 100) + '%';
    const err = $('[data-da-error]');
    let r;
    try { r = ledger(state); err.hidden = true; }
    catch (e) { err.hidden = false; err.textContent = /[一-鿿]/.test(e.message) ? e.message : '輸入超出模型範圍，請檢查數值。'; $('[data-da-results]').innerHTML = ''; $('[data-da-sens]').innerHTML = ''; return; }
    const states = r.given ? '' : `<p class="da-states">A ${n(r.A.tDbC)}°C，RH ${n(r.A.rh * 100, 0)}% → B ${n(r.B.tDbC)}°C，RH ${n(r.B.rh * 100, 0)}% → C ${n(r.C.tDbC)}°C，RH ${n(r.C.rh * 100, 0)}%（YB ${r.YB.toFixed(4)}、YC ${r.YC.toFixed(4)}；hA ${n(r.hA)}、hB ${n(r.hB)} kJ/kg 乾空氣）</p>`;
    $('[data-da-results]').innerHTML = `${states}<ol class="da-steps">
      <li><span>乾物質</span><span>${n(state.feed)} × (1 − ${n(state.wIn)}%) = <strong>${n(r.solids, 2)}</strong> kg/h</span></li>
      <li><span>成品</span><span>${n(r.solids, 2)} ÷ (1 − ${n(state.wOut)}%) = <strong>${n(r.product, 2)}</strong> kg/h</span></li>
      <li><span>除水</span><span>${n(state.feed)} − ${n(r.product, 2)} = <strong>${n(r.water, 2)}</strong> kg/h</span></li>
      <li><span>乾空氣</span><span>${n(r.water, 2)} ÷ (${r.YC.toFixed(4)} − ${r.YB.toFixed(4)}) = <strong data-da-dryair>${n(r.dryAir, 0)}</strong> kg 乾空氣/h</span></li>
      <li><span>加熱器</span><span>${n(r.dryAir, 0)} × (${n(r.hB)} − ${n(r.hA)}) = ${n(r.heaterKJh, 0)} kJ/h = <strong data-da-kw>${n(r.heaterKW, 1)}</strong> kW</span></li>
      <li><span>入口濕空氣</span><span>${n(r.dryAir, 0)} × (1 + ${r.YB.toFixed(4)}) = ${n(r.moistAirIn, 0)} kg/h（不是乾空氣量）</span></li></ol>`;
    const sens = sensitivity(state, [...new Set([0.3, 0.5, 0.7, 0.9, state.progress])].sort((a, b) => a - b)).filter(x => Number.isFinite(x.dryAir));
    $('[data-da-sens]').innerHTML = state.mode === 'air' && sens.length ? `<table class="da-table"><caption>出口越接近飽和，需要的空氣越少（同一外氣與加熱）</caption><thead><tr><th scope="col">出口進程</th><th scope="col">出口</th><th scope="col">乾空氣 kg/h</th><th scope="col">加熱器 kW</th></tr></thead><tbody>${sens.map(x => `<tr${Math.abs(x.progress - state.progress) < 1e-9 ? ' class="da-current"' : ''}><td>${Math.round(x.progress * 100)}%</td><td>${n(x.exitT)}°C，RH ${n(x.exitRH * 100, 0)}%</td><td>${n(x.dryAir, 0)}</td><td>${n(x.heaterKW, 1)}</td></tr>`).join('')}</tbody></table>` : '';
  }
  fill(); render();

  const onInput = event => {
    if (disposed) return;
    const t = event.target;
    if (t.matches('[data-da-preset]')) { if (PRESETS[t.value]) { Object.assign(state, PRESETS[t.value]); fill(); render(); } return; }
    if (t.matches('[data-da-mode]')) { state.mode = t.value; $('[data-da-preset]').value = 'custom'; render(); return; }
    if (t.matches('[data-da-input]')) { state[t.dataset.daInput] = parseFloat(t.value); $('[data-da-preset]').value = 'custom'; render(); }
  };
  const onClick = event => {
    if (disposed || !event.target.closest?.('[data-da-action="save"]')) return;
    const status = $('[data-da-save-status]');
    let r; try { r = ledger(state); } catch { status.textContent = '輸入有誤，無法附加。'; return; }
    const text = `【乾燥機空氣收支】進料 ${n(state.feed)} kg/h，${n(state.wIn)}→${n(state.wOut)} wb%；除水 ${n(r.water, 2)} kg/h\nYB ${r.YB.toFixed(4)}、YC ${r.YC.toFixed(4)}；乾空氣 ${n(r.dryAir, 0)} kg/h；加熱器 ${n(r.heaterKW, 1)} kW（${state.mode === 'given' ? '題目給定狀態' : '定焓近似推算'}）`;
    if (text === state.savedCursor) { status.textContent = '這份內容已附加過，沒有重複附加。'; return; }
    let ok = false;
    try { ok = typeof onSaveSummary === 'function' && onSaveSummary(text) === true; } catch { ok = false; }
    if (ok) { state.savedCursor = text; status.textContent = '已附加到本課筆記。'; } else status.textContent = '沒有附加成功；可先複製上方計算。';
  };
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('click', onClick);
  return () => { disposed = true; root.removeEventListener('input', onInput); root.removeEventListener('change', onInput); root.removeEventListener('click', onClick); };
}
