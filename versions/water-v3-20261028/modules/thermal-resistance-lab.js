// Series thermal resistances per unit area: 1/U = Σ R. Shows which layer limits heat flow and what speeding up one layer buys.
// Plane, steady, one-dimensional; parameter values are teaching settings, not measured properties of a named food or plant.

export const THERMAL_RESISTANCE_ID = 'thermal-resistance-chain';

export const SCENARIOS = {
  block: {label: '厚塊食品：熱水加熱容器內的食品', layers: [
    {id: 'hOut', kind: 'conv', name: '加熱水 → 容器外表面（對流）', h: 500},
    {id: 'wall', kind: 'cond', name: '容器壁（導熱）', L: 1, k: 16},
    {id: 'food', kind: 'cond', name: '食品表面 → 中心（導熱，取半厚）', L: 20, k: 0.5}
  ], dT: 60},
  evaporator: {label: '蒸發器加熱面：蒸汽 → 管壁 → 汙垢 → 沸騰液', layers: [
    {id: 'hSteam', kind: 'conv', name: '蒸汽冷凝側（對流）', h: 10000},
    {id: 'wall', kind: 'cond', name: '管壁（導熱）', L: 2, k: 16},
    {id: 'fouling', kind: 'foul', name: '汙垢層（額外熱阻）', Rf: 0.0002},
    {id: 'hLiquid', kind: 'conv', name: '料液沸騰側（對流）', h: 2000}
  ], dT: 20}
};

export function resistance(layer) {
  if (layer.kind === 'conv') { if (!(layer.h > 0)) throw new RangeError('h 需大於 0'); return 1 / layer.h; }
  if (layer.kind === 'cond') { if (!(layer.k > 0) || !(layer.L >= 0)) throw new RangeError('k 需大於 0、厚度不可為負'); return (layer.L / 1000) / layer.k; }
  if (!(layer.Rf >= 0)) throw new RangeError('汙垢熱阻不可為負'); return layer.Rf;
}

export function chain(layers, dT) {
  const R = layers.map(resistance), total = R.reduce((a, b) => a + b, 0), q = dT / total;
  return {R, total, U: 1 / total, q, drops: R.map(r => q * r), shares: R.map(r => r / total)};
}

// Heat-flux gain when one layer is made `factor` times better (h×factor, k×factor, or Rf÷factor).
export function improve(layers, dT, id, factor = 2) {
  const base = chain(layers, dT).q;
  const better = layers.map(l => l.id !== id ? l : l.kind === 'conv' ? {...l, h: l.h * factor} : l.kind === 'cond' ? {...l, k: l.k * factor} : {...l, Rf: l.Rf / factor});
  return chain(better, dT).q / base - 1;
}

export const SOURCES = {
  lienhard: {label: 'Lienhard IV & Lienhard V（2024）A Heat Transfer Textbook, 6th ed., v6.00, Ch. 2：熱阻與電路類比、總傳熱係數 U', url: 'https://ahtt.mit.edu/'}
};

const drafts = new WeakMap();
let instance = 0;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const sig = x => !Number.isFinite(x) ? '—' : x >= 100 ? Math.round(x).toLocaleString('en-US') : x >= 1 ? x.toFixed(1) : x.toPrecision(2);
const COLORS = ['#6f8fb5', '#8590a0', '#b8902a', '#b4692e', '#14665d'];

export function mountThermalResistanceLab(container, id = THERMAL_RESISTANCE_ID, options = {}) {
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const {draftOwner, draftKey = id, onSaveSummary} = options;
  let store = null;
  if (draftOwner && typeof draftOwner === 'object') { store = drafts.get(draftOwner); if (!store) { store = new Map(); drafts.set(draftOwner, store); } }
  const fresh = key => ({scenario: key, layers: structuredClone(SCENARIOS[key].layers), dT: SCENARIOS[key].dT});
  const state = store?.get(draftKey) || {...fresh('block'), prediction: '', savedCursor: ''};
  store?.set(draftKey, state);
  const prefix = `tr-${++instance}`;
  let disposed = false;

  container.innerHTML = `<section class="resistance-lab" data-tr-lab="${esc(id)}" aria-labelledby="${prefix}-title">
    <header class="tr-head"><p class="tr-kicker">動手比較</p><h3 id="${prefix}-title">熱從介質走到食品中心，卡在哪一段？</h3><p class="tr-hint">每一層都是一個熱阻，串起來相加：1/U = ΣR。熱流量由總熱阻決定，最大的那一段最「卡」。</p></header>
    <label class="tr-scenario"><span>情境</span><select data-tr-scenario>${Object.entries(SCENARIOS).map(([k, s]) => `<option value="${k}">${esc(s.label)}</option>`).join('')}</select></label>
    <fieldset class="tr-predict"><legend>先猜：把哪一層改善成兩倍，熱流量增加最多？</legend><div data-tr-predict></div></fieldset>
    <div class="tr-layers" data-tr-layers></div>
    <label class="tr-dt"><span>總溫差 ΔT <output data-tr-out="dT"></output> °C</span><input type="range" min="5" max="100" step="1" data-tr-input="dT"></label>
    <div class="tr-results" aria-live="polite" data-tr-results></div>
    <details class="tr-detail" data-tr-detail="why"><summary>為什麼加快外面的水流，中心仍然升溫慢？</summary><p>串聯熱阻相加，熱流量 q = ΔT／ΣR。若食品本身導熱的熱阻佔大部分，再怎麼提高外側對流係數 h，也只能縮小原本就小的那一段，總熱阻幾乎不變。反過來，蒸發器加熱面若主要卡在汙垢層或料液側，就該從那裡下手（${'<a href="' + SOURCES.lienhard.url + '" target="_blank" rel="noopener noreferrer">Lienhard 第 2 章</a>'}）。</p></details>
    <details class="tr-detail" data-tr-detail="write"><summary>附加本課筆記（選填）</summary><div class="tr-save"><button type="button" data-tr-action="save">附加目前比較到本課筆記</button><span data-tr-save-status role="status"></span></div></details>
    <details class="tr-detail" data-tr-detail="bounds"><summary>判讀界線與來源</summary><ul>
      <li>平面、穩態、一維、每層物性固定、無內部生熱；以每 m² 計。真實食品加熱多為非穩態：本工作台比較的是哪一段限制熱流，不是中心達溫所需時間。</li>
      <li>各層 h、k、厚度與汙垢熱阻都是教學指定值，不是特定食品、容器或設備的量測值。</li>
      <li>對應官方題目：<a href="https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-240.pdf" target="_blank" rel="noopener noreferrer">115 加工第 3、4 題</a>、<a href="https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-258.pdf" target="_blank" rel="noopener noreferrer">114 第 1 題</a>、<a href="https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/113/113-274.pdf" target="_blank" rel="noopener noreferrer">113 第 1 題</a>的前置概念；不是官方答案。</li>
    </ul><p><a href="${SOURCES.lienhard.url}" target="_blank" rel="noopener noreferrer">${esc(SOURCES.lienhard.label)}</a></p></details>
  </section>`;

  const root = container.querySelector('.resistance-lab');
  const $ = s => root.querySelector(s);
  function layerHTML(l, i) {
    const f = (key, label, unit, min, max, step) => `<label class="tr-f"><span>${label}</span><span class="tr-in"><input type="number" min="${min}" max="${max}" step="${step}" data-tr-layer="${i}" data-tr-key="${key}" value="${l[key]}"><small>${unit}</small></span></label>`;
    const body = l.kind === 'conv' ? f('h', '對流係數 h', 'W/(m²·K)', 1, 50000, 'any') : l.kind === 'cond' ? f('L', '厚度', 'mm', 0, 200, 'any') + f('k', '導熱係數 k', 'W/(m·K)', 0.01, 500, 'any') : f('Rf', '汙垢熱阻', 'm²·K/W', 0, 0.01, 'any');
    return `<div class="tr-layer" style="--c:${COLORS[i % COLORS.length]}"><h4><i></i>${esc(l.name)}</h4><div class="tr-fields">${body}</div></div>`;
  }
  function build() {
    $('[data-tr-scenario]').value = state.scenario;
    $('[data-tr-layers]').innerHTML = state.layers.map(layerHTML).join('');
    $('[data-tr-predict]').innerHTML = state.layers.map(l => `<label class="tr-choice"><input type="radio" name="${prefix}-pred" value="${l.id}" data-tr-pred${state.prediction === l.id ? ' checked' : ''}><span>${esc(l.name.split('（')[0])}</span></label>`).join('');
    $('[data-tr-input="dT"]').value = state.dT;
  }
  function render() {
    $('[data-tr-out="dT"]').textContent = state.dT;
    let r;
    try { r = chain(state.layers, state.dT); } catch (e) { $('[data-tr-results]').innerHTML = `<p class="tr-error" role="alert">${esc(e.message)}</p>`; return; }
    const gains = state.layers.map(l => improve(state.layers, state.dT, l.id));
    const best = gains.indexOf(Math.max(...gains));
    const bar = state.layers.map((l, i) => `<span style="flex-grow:${Math.max(r.shares[i], 0.001)};--c:${COLORS[i % COLORS.length]}" title="${esc(l.name)} ${Math.round(r.shares[i] * 100)}%">${r.shares[i] > 0.08 ? Math.round(r.shares[i] * 100) + '%' : ''}</span>`).join('');
    const predicted = state.prediction ? (state.prediction === state.layers[best].id ? '<p class="tr-verdict tr-right">猜對了：改善熱阻最大的那一層效果最大。</p>' : `<p class="tr-verdict tr-wrong">實際效果最大的是「${esc(state.layers[best].name.split('（')[0])}」。熱阻小的層改善再多，總熱阻也降不了多少。</p>`) : '';
    $('[data-tr-results]').innerHTML = `<div class="tr-bar" aria-hidden="true">${bar}</div>
      <table class="tr-table"><caption>每 m² 的熱阻、溫降與「改善成兩倍」的效果</caption><thead><tr><th scope="col">層</th><th scope="col">R<br><small>m²·K/W</small></th><th scope="col">佔比</th><th scope="col">溫降 °C</th><th scope="col">改善兩倍時 q</th></tr></thead><tbody>${state.layers.map((l, i) => `<tr data-tr-row="${l.id}"${i === best ? ' class="tr-best"' : ''}><th scope="row"><i style="--c:${COLORS[i % COLORS.length]}"></i>${esc(l.name.split('（')[0])}</th><td>${sig(r.R[i])}</td><td>${Math.round(r.shares[i] * 100)}%</td><td>${sig(r.drops[i])}</td><td data-tr-gain="${l.id}">+${Math.round(gains[i] * 100)}%</td></tr>`).join('')}</tbody></table>
      <p class="tr-sum">總熱阻 ${sig(r.total)} m²·K/W → U = <strong data-tr-u>${sig(r.U)}</strong> W/(m²·K)；熱通量 q = ΔT／ΣR = <strong data-tr-q>${sig(r.q)}</strong> W/m²</p>${predicted}`;
  }
  build(); render();

  const onInput = event => {
    if (disposed) return;
    const t = event.target;
    if (t.matches('[data-tr-scenario]')) { Object.assign(state, fresh(t.value)); state.prediction = ''; build(); render(); return; }
    if (t.matches('[data-tr-layer]')) { const v = parseFloat(t.value); if (Number.isFinite(v)) { state.layers[+t.dataset.trLayer][t.dataset.trKey] = v; render(); } return; }
    if (t.matches('[data-tr-input="dT"]')) { state.dT = Number(t.value); render(); return; }
    if (t.matches('[data-tr-pred]')) { state.prediction = t.value; render(); }
  };
  const onClick = event => {
    if (disposed || !event.target.closest?.('[data-tr-action="save"]')) return;
    const status = $('[data-tr-save-status]');
    let r; try { r = chain(state.layers, state.dT); } catch { status.textContent = '輸入有誤，無法附加。'; return; }
    const text = [`【串聯熱阻】${SCENARIOS[state.scenario].label}；ΔT ${state.dT}°C；U ${sig(r.U)} W/(m²·K)；q ${sig(r.q)} W/m²`, ...state.layers.map((l, i) => `${l.name.split('（')[0]}：R ${sig(r.R[i])}（${Math.round(r.shares[i] * 100)}%），改善兩倍 q +${Math.round(improve(state.layers, state.dT, l.id) * 100)}%`)].join('\n');
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
