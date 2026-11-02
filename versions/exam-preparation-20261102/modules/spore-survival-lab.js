// Under-delivered heat step: compare log reductions of Salmonella (vegetative) and B. cereus spores
// with published D-values. Log-linear, isothermal teaching model; not a process schedule.

export const SPORE_SURVIVAL_ID = 'spore-survival';

export const SALMONELLA_D = {
  breast: {label: '雞胸肉，62.5°C', d: 0.66, temp: 62.5},
  thigh: {label: '雞腿肉，62.5°C', d: 0.84, temp: 62.5}
};
export const SPORE_D = {
  beef: {label: '牛肉漿，70°C', d: 2.3, temp: 70},
  milk: {label: '脫脂乳，70°C', d: 8.6, temp: 70}
};

export const SOURCES = {
  juneja2007: {short: 'Juneja 2007', label: 'Juneja（2007）Thermal inactivation of Salmonella spp. in ground chicken breast or thigh meat. Int J Food Sci Technol 42:1443–1448（四菌株混合；62.5°C D：胸肉 0.66 min、腿肉 0.84 min）', url: 'https://doi.org/10.1111/j.1365-2621.2006.01362.x'},
  soni2022: {short: 'Soni 等 2022', label: 'Soni, Bremer & Brightwell（2022）A comprehensive review of variability in the thermal resistance (D-values) of food-borne pathogens. Foods 11:4117（Table 2：B. cereus NZRM 984 芽孢 D70 牛肉漿 2.3 min、脫脂乳 8.6 min）', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9777713/'},
  setlow2006: {short: 'Setlow 等 2006', label: 'Setlow 等（2006）原始研究：核心 Ca-DPA、皮層肽聚糖及多因素抗性；本課不採實驗操作條件', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1482921/'},
  openstaxSpore: {short: 'OpenStax 3.3', label: 'OpenStax Microbiology §3.3 Unique characteristics of prokaryotic cells（內生孢子的皮層、外衣與脫水休眠）', url: 'https://openstax.org/books/microbiology/pages/3-3-unique-characteristics-of-prokaryotic-cells'},
  openstaxGram: {short: 'OpenStax 2.4', label: 'OpenStax Microbiology §2.4 Staining microscopic specimens（革蘭氏染色步驟與顏色）', url: 'https://openstax.org/books/microbiology/pages/2-4-staining-microscopic-specimens'},
  ntu115: {short: '115 食微第 3 題', label: '臺大 115 學年度碩士班招生考試 食品微生物學（題號 241）第三題', url: 'https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-241.pdf'}
};

export function logReduction(minutes, d) { return minutes / d; }

export function survivors({designed, delivered, startLog, salmonella = 'breast', spore = 'beef'}) {
  const t = designed * delivered / 100;
  const sal = SALMONELLA_D[salmonella], sp = SPORE_D[spore];
  const make = (row, kind) => {
    const L = logReduction(t, row.d), plannedL = logReduction(designed, row.d);
    return {kind, d: row.d, temp: row.temp, L, plannedL, endLog: startLog - L, plannedEndLog: startLog - plannedL};
  };
  return {minutes: t, salmonella: make(sal, 'salmonella'), spore: make(sp, 'spore')};
}

const drafts = new WeakMap();
let instance = 0;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const link = k => `<a href="${SOURCES[k].url}" target="_blank" rel="noopener noreferrer">${esc(SOURCES[k].short)}</a>`;
const fmt = (x, d = 1) => (Math.abs(x) < 0.05 ? 0 : x).toFixed(d);
const level = endLog => endLog < 0 ? '模型值 < 1 CFU/g' : endLog === 0 ? '模型值 = 1 CFU/g' : `約 10^${fmt(endLog)} CFU/g`;

function barsSVG(r, startLog) {
  const W = 520, H = 220, L = 46, B = 30, T = 14, top = Math.max(6, Math.ceil(startLog)), ys = v => T + (1 - Math.max(0, v) / top) * (H - T - B);
  const bar = (x, res, color, name) => `<rect x="${x}" y="${ys(res.endLog)}" width="120" height="${H - B - ys(res.endLog)}" class="${color}"/><line x1="${x - 8}" x2="${x + 128}" y1="${ys(res.plannedEndLog)}" y2="${ys(res.plannedEndLog)}" class="ss-planned"/><text x="${x + 60}" y="${H - 10}" text-anchor="middle">${name}</text><text x="${x + 60}" y="${Math.max(T + 12, ys(res.endLog) - 6)}" text-anchor="middle" class="ss-val">${res.endLog < 0 ? '<0' : res.endLog === 0 ? '0' : fmt(res.endLog)}</text>`;
  const ticks = Array.from({length: top + 1}, (_, i) => i).filter(i => i % (top > 8 ? 2 : 1) === 0).map(i => `<text x="${L - 8}" y="${ys(i) + 4}" text-anchor="end">${i}</text><line x1="${L}" x2="${W - 8}" y1="${ys(i)}" y2="${ys(i)}" class="ss-grid"/>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="ss-chart" role="img" aria-label="處理後剩餘 log CFU/g：沙門氏菌 ${fmt(r.salmonella.endLog)}，芽孢 ${fmt(r.spore.endLog)}">${ticks}<line x1="${L}" x2="${L}" y1="${T}" y2="${H - B}" class="ss-axis"/><text x="12" y="${T + 4}" class="ss-unit">log</text>${bar(110, r.salmonella, 'ss-sal', '沙門氏菌')}${bar(330, r.spore, 'ss-spore', '蠟樣芽孢桿菌芽孢')}</svg>`;
}

export function mountSporeSurvivalLab(container, id = SPORE_SURVIVAL_ID, options = {}) {
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const {draftOwner, draftKey = id, onSaveSummary} = options;
  let store = null;
  if (draftOwner && typeof draftOwner === 'object') { store = drafts.get(draftOwner); if (!store) { store = new Map(); drafts.set(draftOwner, store); } }
  const state = store?.get(draftKey) || {designed: 5, delivered: 60, startLog: 4, salmonella: 'breast', spore: 'beef', prediction: '', gram: '', note: '', savedCursor: ''};
  store?.set(draftKey, state);
  const prefix = `ss-${++instance}`;
  let disposed = false;

  container.innerHTML = `<section class="spore-lab" data-ss-lab="${esc(id)}" aria-labelledby="${prefix}-title">
    <header class="ss-head"><p class="ss-kicker">動手比較</p><h3 id="${prefix}-title">這些 D 值能回答哪個問題？</h3><p class="ss-hint">以下各自代入刊載 D 值做等溫對數線性計算；兩組研究、溫度、基質與回收條件不同。可描述各組模型的 log 下降與末端量，不能由兩條柱直接決定同一產品的存活者或事故污染源。原題初判只保留為待證假說，不由本圖判成正確。</p></header>
    <fieldset class="ss-predict"><legend>保留原題初判（待證）：殺菌不足時，哪一種較可能存活並成為汙染來源？</legend>${[['salmonella', '沙門氏菌'], ['spore', '芽孢桿菌（芽孢）']].map(([v, t]) => `<label class="ss-choice"><input type="radio" name="${prefix}-pred" value="${v}" data-ss-pred><span>${t}</span></label>`).join('')}</fieldset>
    <div class="ss-main">
      <div class="ss-controls">
        <label><span>設計的保溫時間 <output data-ss-out="designed"></output> 分</span><input type="range" min="1" max="20" step="1" data-ss-input="designed"></label>
        <label><span>實際做到 <output data-ss-out="delivered"></output>%</span><input type="range" min="0" max="100" step="5" data-ss-input="delivered"></label>
        <label><span>處理前菌量 10^<output data-ss-out="startLog"></output> CFU/g</span><input type="range" min="1" max="7" step="1" data-ss-input="startLog"></label>
        <label class="ss-select"><span>沙門氏菌 D 值的基質</span><select data-ss-input="salmonella">${Object.entries(SALMONELLA_D).map(([k, v]) => `<option value="${k}">${v.label}：D = ${v.d} 分</option>`).join('')}</select></label>
        <label class="ss-select"><span>芽孢 D 值的基質</span><select data-ss-input="spore">${Object.entries(SPORE_D).map(([k, v]) => `<option value="${k}">${v.label}：D = ${v.d} 分</option>`).join('')}</select></label>
      </div>
      <div class="ss-result" aria-live="polite"><div data-ss-chart></div><p class="ss-legend"><span class="ss-key ss-key-planned"></span>虛線：各自代入完整比較時間的模型量</p><dl class="ss-read" data-ss-read></dl></div>
    </div>
    <p class="ss-caveat">兩組 D 值來自不同研究與溫度／基質／方法；本台只各自沿用其指定等溫參數，不代表兩者經歷同一真實熱歷程。改變溫度需另有該對象適用的 D(T) 或經驗證的溫度關係，不能只用本圖換算；也不能由刊載值單獨確定事故來源、每份樣品的存活者或食品安全。</p>
    <details class="ss-detail" data-ss-detail="why"><summary>為什麼芽孢比較耐熱？</summary>
      <p>部分 <i>Bacillus</i>、<i>Clostridium</i> 等細菌可形成內生孢子。構造不可混寫：皮層（cortex）主要是肽聚糖，Ca-DPA 主要位於核心（core），不是皮層。核心較低含水量、保護蛋白及多層結構等共同影響抗性；<i>Bacillus</i> 原始研究支持這些區分（${link('setlow2006')}）。沙門氏菌不形成內生孢子，但不能只靠型態名稱或這兩組不同條件的 D 值，對所有真實熱處理作同一存活排序。</p></details>
    <details class="ss-detail" data-ss-detail="gram"><summary>分離到的菌做革蘭氏染色，會是什麼顏色？</summary>
      <fieldset class="ss-gram"><legend>先猜芽孢桿菌的營養細胞顏色</legend>${[['purple', '紫色'], ['red', '紅色']].map(([v, t]) => `<label class="ss-choice"><input type="radio" name="${prefix}-gram" value="${v}" data-ss-gram><span>${t}</span></label>`).join('')}</fieldset>
      <p data-ss-gram-answer hidden></p>
      <ol class="ss-steps"><li>結晶紫初染：所有細胞先染成紫色。</li><li>碘液媒染：與結晶紫形成複合物。</li><li>酒精（或丙酮／酒精）脫色：肽聚糖層厚的細胞較不受影響，保留紫色。</li><li>番紅複染：被脫色的細胞染成紅色。</li></ol>
      <p>革蘭氏陽性（紫）、陰性（紅）。內生孢子本身另用孔雀綠加熱的孢子染色法觀察（${link('openstaxGram')}）。</p></details>
    <details class="ss-detail" data-ss-detail="write"><summary>寫下你的判斷（選填）</summary>
      <label for="${prefix}-note">先列兩組條件，再用各自的 log 下降與末端模型量描述結果；回顧原題初判仍缺哪些同一產品的證據，不能把模型較高的柱直接當成事故來源。</label><textarea id="${prefix}-note" data-ss-field="note" rows="4" maxlength="3000"></textarea>
      <div class="ss-save"><button type="button" data-ss-action="save">附加本課筆記</button><span data-ss-save-status role="status"></span></div></details>
    <details class="ss-detail" data-ss-detail="bounds"><summary>判讀界線與來源</summary><ul>
      <li>計算採等溫、對數線性模型：剩餘 log = 起始 log − t／D；不含升溫時間、肩部或拖尾，也不代表每個食品位置都達到同一溫度。</li>
      <li>D 值為指定菌株、基質與方法下的刊載值；選擇性培養基可能低估受傷菌的存活。</li>
      <li>對應官方題目：${link('ntu115')}；本工作台是判讀練習，不是官方答案，也不是製程驗證。</li>
    </ul><ol>${Object.values(SOURCES).map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('')}</ol></details>
  </section>`;

  const root = container.querySelector('.spore-lab');
  const $ = s => root.querySelector(s);
  root.querySelectorAll('[data-ss-input]').forEach(el => { el.value = state[el.dataset.ssInput]; });
  root.querySelectorAll('[data-ss-pred]').forEach(r => { r.checked = r.value === state.prediction; });
  root.querySelectorAll('[data-ss-gram]').forEach(r => { r.checked = r.value === state.gram; });
  $('[data-ss-field="note"]').value = state.note;

  function render() {
    for (const k of ['designed', 'delivered', 'startLog']) $(`[data-ss-out="${k}"]`).textContent = state[k];
    const r = survivors(state);
    $('[data-ss-chart]').innerHTML = barsSVG(r, state.startLog);
    const row = (name, res) => `<div data-ss-row="${res.kind}"><dt>${name}</dt><dd>減少 <strong>${fmt(res.L)}</strong> log（設計應為 ${fmt(res.plannedL)}）→ ${level(res.endLog)}</dd></div>`;
    $('[data-ss-read]').innerHTML = `<div><dt>實際保溫</dt><dd><strong>${fmt(r.minutes)}</strong> 分（設計 ${state.designed} 分）</dd></div>` + row('沙門氏菌', r.salmonella) + row('芽孢', r.spore);
    const g = $('[data-ss-gram-answer]');
    g.hidden = !state.gram;
    if (state.gram) g.innerHTML = state.gram === 'purple' ? '<strong>猜對了：</strong>芽孢桿菌是革蘭氏陽性，營養細胞呈紫色。' : '<strong>再想想：</strong>芽孢桿菌是革蘭氏陽性，營養細胞會保留結晶紫而呈紫色；紅色是革蘭氏陰性（如沙門氏菌）。';
  }
  render();

  const onInput = event => {
    if (disposed) return;
    const t = event.target;
    if (t.matches('[data-ss-input]')) { const k = t.dataset.ssInput; state[k] = ['salmonella', 'spore'].includes(k) ? t.value : Number(t.value); render(); }
    else if (t.matches('[data-ss-pred]')) state.prediction = t.value;
    else if (t.matches('[data-ss-gram]')) { state.gram = t.value; render(); }
    else if (t.matches('[data-ss-field="note"]')) state.note = t.value;
  };
  const onClick = event => {
    if (disposed || !event.target.closest?.('[data-ss-action="save"]')) return;
    const status = $('[data-ss-save-status]'), r = survivors(state);
    const text = [`【殺菌不足比較】設計 ${state.designed} 分、實際 ${state.delivered}%（${fmt(r.minutes)} 分），起始 10^${state.startLog} CFU/g`,
      `沙門氏菌（${SALMONELLA_D[state.salmonella].label}，D ${r.salmonella.d}）：減少 ${fmt(r.salmonella.L)} log → ${level(r.salmonella.endLog)}`,
      `芽孢（${SPORE_D[state.spore].label}，D ${r.spore.d}）：減少 ${fmt(r.spore.L)} log → ${level(r.spore.endLog)}`,
      state.prediction ? `我的初判：${state.prediction === 'spore' ? '芽孢桿菌' : '沙門氏菌'}` : '', state.note.trim() ? '我的判斷：' + state.note.trim() : '', '模型界線：兩組研究／溫度／基質／方法不同；以上各自為條件式模型量。原題初判仍是待證假說，不能由此判定同一產品的存活者、事故來源或食品安全。'].filter(Boolean).join('\n');
    if (text === state.savedCursor) { status.textContent = '這份內容已附加過，沒有重複附加。'; return; }
    let ok = false;
    try { ok = typeof onSaveSummary === 'function' && onSaveSummary(text) === true; } catch { ok = false; }
    if (ok) { state.savedCursor = text; status.textContent = '已附加到本課筆記。'; } else status.textContent = '沒有附加成功；文字仍保留在上方，可先複製。';
  };
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('click', onClick);
  return () => { disposed = true; root.removeEventListener('input', onInput); root.removeEventListener('change', onInput); root.removeEventListener('click', onClick); };
}
