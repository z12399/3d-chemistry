// Heteroatom origin of five-membered heterocycles (furan O, pyrrole N, thiophene S).
// Element bookkeeping is exact: a ring heteroatom needs a precursor carrying that element.
// Whether a pathway is supported comes only from the cited sources; anything else stays unverified.

export const HETEROCYCLE_LAB_ID = 'heterocycle-origin';

export const PRECURSORS = [
  {id: 'sugar', label: '還原糖', detail: '葡萄糖、核糖等', elements: ['C', 'H', 'O']},
  {id: 'ascorbic', label: '抗壞血酸', detail: '維生素 C', elements: ['C', 'H', 'O']},
  {id: 'pufa', label: '多元不飽和脂肪酸', detail: '如亞麻油酸', elements: ['C', 'H', 'O']},
  {id: 'amino', label: '不含硫的胺基酸', detail: '如甘胺酸、離胺酸', elements: ['C', 'H', 'O', 'N']},
  {id: 'cysteine', label: '半胱胺酸', detail: '含硫胺基酸', elements: ['C', 'H', 'O', 'N', 'S']}
];

export const RINGS = [
  {id: 'furan', name: '呋喃', latin: 'furan', element: 'O', elementName: '氧'},
  {id: 'pyrrole', name: '吡咯', latin: 'pyrrole', element: 'N', elementName: '氮'},
  {id: 'thiophene', name: '噻吩', latin: 'thiophene', element: 'S', elementName: '硫'}
];

export const SOURCES = {
  efsa2017: {label: 'EFSA CONTAM Panel（2017）Risks for public health related to the presence of furan and methylfurans in food. EFSA Journal 15(10):5005', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7009982/'},
  perez2004: {label: 'Perez Locas & Yaylayan（2004）Origin and mechanistic pathways of formation of the parent furan – a food toxicant. J Agric Food Chem 52:6830–6836', url: 'https://pubs.acs.org/doi/10.1021/jf0490403'},
  wood2019: {label: 'Wood, Furkert & Brimble（2019）2-Formylpyrrole natural products: origin, structural diversity, bioactivity and synthesis. Nat Prod Rep 36:289–306', url: 'https://pubmed.ncbi.nlm.nih.gov/30039828/'},
  mottram1998: {label: 'Mottram（1998）Flavour formation in meat and meat products: a review. Food Chem 62:415–424', url: 'https://doi.org/10.1016/S0308-8146(98)00076-4'},
  elmore2002: {label: 'Elmore, Campo, Enser & Mottram（2002）Effect of lipid composition on meat-like model systems containing cysteine, ribose, and polyunsaturated fatty acids. J Agric Food Chem 50:1126–1132', url: 'https://pubs.acs.org/doi/10.1021/jf0108718'},
  hofmann1998: {label: 'Hofmann & Schieberle（1998）2-propionyl-1-pyrroline 等烘焙氣味物在梅納型反應中的貢獻與生成', url: 'https://portal.fis.tum.de/en/publications/flavor-contribution-and-formation-of-the-intense-roast-smelling-o/'},
  ntu114: {label: '臺大 114 學年度碩士班招生考試 食品化學（題號 257）第 3 題', url: 'https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-257.pdf'}
};

// Which supplied precursors the cited sources name for each ring class. Only these count as "supported".
const SUPPORTED = {
  furan: {any: ['sugar', 'ascorbic', 'pufa', 'amino', 'cysteine'], note: 'EFSA 列出抗壞血酸、胺基酸、碳水化合物、不飽和脂肪酸與類胡蘿蔔素為呋喃前驅物；單一前驅物即可提供環上的氧。', sources: ['efsa2017', 'perez2004']},
  pyrrole: {all: [['amino', 'cysteine'], ['sugar']], note: '2-甲醯吡咯類由胺與醣經梅納化學生成：環上的氮來自胺，碳骨架來自醣衍生的二羰基（如 3-脫氧葡萄糖酮）。', sources: ['wood2019']},
  thiophene: {all: [['cysteine'], ['sugar']], note: '半胱胺酸分解釋出的硫化氫，與醣的梅納片段反應生成含硫雜環（含噻吩），帶來肉香、烘烤香。', sources: ['mottram1998', 'elmore2002']}
};

export function evaluateRings(selected) {
  const chosen = new Set(selected);
  const elements = new Set();
  for (const p of PRECURSORS) if (chosen.has(p.id)) p.elements.forEach(e => elements.add(e));
  return RINGS.map(ring => {
    const rule = SUPPORTED[ring.id];
    const carriers = PRECURSORS.filter(p => chosen.has(p.id) && p.elements.includes(ring.element)).map(p => p.id);
    if (!elements.has(ring.element)) return {ring: ring.id, state: 'impossible', carriers, note: `所選前驅物都不含${ring.elementName}（${ring.element}），環上的${ring.element}沒有來源；不論加熱多久都不會出現這個雜原子。`};
    const supported = rule.any ? rule.any.some(id => chosen.has(id)) : rule.all.every(group => group.some(id => chosen.has(id)));
    if (supported) return {ring: ring.id, state: 'supported', carriers, note: rule.note, sources: rule.sources};
    return {ring: ring.id, state: 'unverified', carriers, note: `組合中有含${ring.element}的前驅物，但本課引用的來源沒有描述這個組合生成${ring.id === 'pyrrole' ? '吡咯' : '噻吩'}；元素帳成立不代表會發生，先標為未核實。`};
  });
}

export const PROCESSES = [
  {id: 'coffee', label: '咖啡烘焙（乾熱）', points: [
    ['呋喃', 'EFSA 2017 彙整資料中，整顆烘焙咖啡豆的呋喃濃度最高；另在所述熱轉化條件下，乾熱生成通常較加壓殺菌高。兩者是不同證據，不能由監測濃度排名換算生成量。在該評估中，成人膳食暴露以咖啡為主；咖啡中 2-甲基呋喃可約為呋喃的 4 倍。', 'efsa2017']],
    boundary: '數值與排序來自 EFSA 彙整的監測資料，不代表每批咖啡或每種沖煮方式。'},
  {id: 'canned', label: '罐裝、瓶裝食品加熱殺菌', points: [
    ['呋喃', 'EFSA 點名罐裝與瓶裝食品（含含肉的嬰兒食品）；嬰幼兒以即食餐為主要暴露來源。', 'efsa2017'],
    ['呋喃', '食品特性、加工／烹調條件及散失共同決定食用時濃度；EFSA 所指散失主要經蒸發。報告認為市售已加工食品重熱的影響有限，仍取決於消費者的處理行為，不能當成每種食品固定結果。', 'efsa2017']],
    boundary: '揮發散失只改變留在食品裡的量，不代表沒有生成。'},
  {id: 'meat', label: '肉品加熱（含半胱胺酸、核糖與脂質）', points: [
    ['噻吩等含硫雜環', '熟肉風味主要來自加熱時的梅納反應與脂質降解；含硫雜環帶來鹹香、肉香、烘烤與燉煮風味。', 'mottram1998'],
    ['含硫雜環', '在半胱胺酸–核糖模式系統加入脂質後，許多原有揮發物減少或消失；作者推測半胱胺酸分解的硫化氫轉而與脂質降解產物反應。', 'elmore2002']],
    boundary: '模式系統結果不能直接換算成某塊肉的風味強度。'},
  {id: 'bake', label: '烘焙與加熱醣–胺基酸配方', points: [
    ['吡咯', '胺與醣經梅納化學生成 2-甲醯吡咯類；同一類反應也產生褐變產物。', 'wood2019'],
    ['名稱陷阱', '米飯、麵包的烘焙香 2-乙醯-1-吡咯啉（2-acetyl-1-pyrroline）是吡咯「啉」，不是芳香的吡咯環；脯胺酸–葡萄糖系統中可生成此類強烈烘焙氣味物。', 'hofmann1998']],
    boundary: '本課沒有核實個別吡咯的香氣閾值，因此不排序吡咯的香氣貢獻。'}
];

export const QUALITY = [
  {ring: 'furan', aroma: '呋喃類是加熱食品的常見揮發物。', safety: 'IARC 將呋喃列為 2B（可能對人類致癌）。EFSA 以暴露邊際（MOE）評估認為有健康疑慮，且無法排除與 DNA 直接作用，因此未訂定每日可耐受攝取量。', sources: ['efsa2017']},
  {ring: 'pyrrole', aroma: '屬梅納產物，與褐變同時生成；本課來源未指定單一香氣貢獻。', safety: '本課未引用吡咯的安全評估。', sources: ['wood2019']},
  {ring: 'thiophene', aroma: '含硫雜環提供鹹香、肉香、烘烤、燉煮風味，是熟肉風味的重要成分。', safety: '本課未引用噻吩的安全評估。', sources: ['mottram1998']}
];

const DEFAULT_STATE = () => ({selected: ['sugar', 'amino'], process: 'coffee', prediction: '', revision: '', savedCursor: ''});
const drafts = new WeakMap();
let instance = 0;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const ringName = id => RINGS.find(r => r.id === id)?.name || id;
const STATE_LABEL = {supported: '有來源支持', impossible: '不可能：缺雜原子', unverified: '本課來源未核實'};

function ringSVG(element) {
  const pts = [[30, 6], [54, 23], [45, 51], [15, 51], [6, 23]];
  const path = pts.map(p => p.join(',')).join(' ');
  return `<svg class="hc-ring" viewBox="0 0 60 60" aria-hidden="true"><polygon points="${path}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><line x1="17" y1="46" x2="11" y2="27" stroke="currentColor" stroke-width="2"/><line x1="40" y1="47" x2="48" y2="27" stroke="currentColor" stroke-width="2"/><circle cx="30" cy="8" r="9.5" class="hc-hetero"/><text x="30" y="12.5" text-anchor="middle">${element}</text></svg>`;
}

function summaryText(state, results) {
  const chosen = PRECURSORS.filter(p => state.selected.includes(p.id)).map(p => p.label).join('、') || '未選前驅物';
  const lines = [`【雜環的雜原子從哪來】前驅物：${chosen}`];
  for (const r of results) lines.push(`${ringName(r.ring)}：${STATE_LABEL[r.state]}`);
  const proc = PROCESSES.find(p => p.id === state.process);
  if (proc) lines.push(`加工情境：${proc.label}`);
  if (state.prediction.trim()) lines.push(`我的預測：${state.prediction.trim()}`);
  if (state.revision.trim()) lines.push(`我的修訂：${state.revision.trim()}`);
  return lines.join('\n');
}

export function mountHeterocycleOriginLab(container, id = HETEROCYCLE_LAB_ID, options = {}) {
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const {draftOwner, draftKey = id, onSaveSummary} = options;
  let store = null;
  if (draftOwner && typeof draftOwner === 'object') { store = drafts.get(draftOwner); if (!store) { store = new Map(); drafts.set(draftOwner, store); } }
  const state = store?.get(draftKey) || DEFAULT_STATE();
  store?.set(draftKey, state);
  const prefix = `hc-${++instance}`;
  let disposed = false;

  container.innerHTML = `<section class="heterocycle-lab" data-hc-lab="${esc(id)}" aria-labelledby="${prefix}-title">
    <header class="hc-head"><p class="hc-kicker">動手推斷</p><h3 id="${prefix}-title">環上的 O、N、S，從哪個前驅物來？</h3><p class="hc-hint">五元雜環的延伸，不是六元吡嗪的生成模型。勾選前驅物，核對環上雜原子的來源；元素帳不等於生成量或香氣貢獻。</p></header>
    <div class="hc-main">
      <fieldset class="hc-precursors"><legend>加熱前的前驅物</legend>${PRECURSORS.map(p => `<label class="hc-chip"><input type="checkbox" value="${p.id}" data-hc-precursor="${p.id}"><span><strong>${p.label}</strong><small>${p.detail} · 含 ${p.elements.join('、')}</small></span></label>`).join('')}</fieldset>
      <div class="hc-rings" data-hc-rings aria-live="polite"></div>
    </div>
    <p class="hc-rule">元素帳是硬條件：缺某元素就不可能出現該雜原子。元素帳成立時，仍要有來源描述該生成途徑，才標為「有來源支持」。</p>
    <section class="hc-process" aria-labelledby="${prefix}-proc"><div class="hc-process-head"><h4 id="${prefix}-proc">哪種加工？品質與安全怎麼說</h4><label class="hc-select"><span class="sr-only">加工情境</span><select data-hc-process>${PROCESSES.map(p => `<option value="${p.id}">${p.label}</option>`).join('')}</select></label></div><div data-hc-process-body></div></section>
    <details class="hc-quality" data-hc-detail="quality"><summary>三類雜環對品質的影響（香氣與安全）</summary><div class="hc-quality-grid">${QUALITY.map(q => `<article><h5>${ringName(q.ring)}</h5><p><b>風味</b>${esc(q.aroma)}</p><p><b>安全</b>${esc(q.safety)}</p><p class="hc-cite">${q.sources.map(s => `<a href="${SOURCES[s].url}" target="_blank" rel="noopener noreferrer">${esc(SOURCES[s].label.split('（')[0])}</a>`).join('、')}</p></article>`).join('')}</div></details>
    <details class="hc-write" data-hc-detail="write"><summary>先寫預測，再修訂（選填）</summary>
      <label for="${prefix}-prediction">操作前：拿掉所有含氮前驅物後，哪幾類雜環還可能生成？為什麼？</label><textarea id="${prefix}-prediction" data-hc-field="prediction" rows="3" maxlength="2000"></textarea>
      <label for="${prefix}-revision">操作後：你的判斷有沒有改？哪一項證據讓你改？</label><textarea id="${prefix}-revision" data-hc-field="revision" rows="3" maxlength="2000"></textarea>
      <div class="hc-save"><button type="button" data-hc-action="save">附加本課筆記</button><span data-hc-save-status role="status"></span></div>
    </details>
    <details class="hc-bounds" data-hc-detail="bounds"><summary>判讀界線與來源</summary><ul>
      <li>本工作台只做元素帳與來源對照，不計算生成量、速率或濃度。</li>
      <li>「有來源支持」表示引用文獻描述了這類前驅物組合的生成途徑，不表示任何配方都會生成可測量的量。</li>
      <li>呋喃的前驅物還包括類胡蘿蔔素（EFSA），本工作台未列入選項。</li>
      <li>對應官方題目：114 食品化學第 3 題；本工作台是判讀練習，不是官方答案，也不涵蓋整題配分。</li>
    </ul><ol class="hc-sources">${Object.values(SOURCES).map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('')}</ol></details>
  </section>`;

  const root = container.querySelector('.heterocycle-lab');
  const $ = sel => root.querySelector(sel);
  root.querySelectorAll('[data-hc-precursor]').forEach(box => { box.checked = state.selected.includes(box.value); });
  $('[data-hc-process]').value = state.process;
  $('[data-hc-field="prediction"]').value = state.prediction;
  $('[data-hc-field="revision"]').value = state.revision;

  function renderRings() {
    const results = evaluateRings(state.selected);
    $('[data-hc-rings]').innerHTML = results.map(r => {
      const ring = RINGS.find(x => x.id === r.ring);
      const carriers = r.carriers.map(c => PRECURSORS.find(p => p.id === c).label).join('、');
      return `<article class="hc-card hc-${r.state}" data-hc-ring="${r.ring}" data-hc-state="${r.state}">
        <div class="hc-card-top">${ringSVG(ring.element)}<div><h4>${ring.name} <span>${ring.latin}</span></h4><p class="hc-badge">${STATE_LABEL[r.state]}</p></div></div>
        <p class="hc-carriers">環上 ${ring.element} 可來自：${carriers || '（無）'}</p>
        <p class="hc-note">${esc(r.note)}</p>
        ${r.sources ? `<p class="hc-cite">${r.sources.map(s => `<a href="${SOURCES[s].url}" target="_blank" rel="noopener noreferrer">${esc(SOURCES[s].label.split('（')[0])}</a>`).join('、')}</p>` : ''}
      </article>`;
    }).join('');
    return results;
  }
  function renderProcess() {
    const proc = PROCESSES.find(p => p.id === state.process) || PROCESSES[0];
    $('[data-hc-process-body]').innerHTML = `<ul class="hc-points">${proc.points.map(([tag, text, src]) => `<li><span class="hc-tag">${esc(tag)}</span><span>${esc(text)} <a class="hc-src" href="${SOURCES[src].url}" target="_blank" rel="noopener noreferrer">${esc(SOURCES[src].label.split('（')[0])}</a></span></li>`).join('')}</ul><p class="hc-boundary">${esc(proc.boundary)}</p>`;
  }
  renderRings(); renderProcess();

  const onChange = event => {
    if (disposed) return;
    const t = event.target;
    if (t.matches('[data-hc-precursor]')) {
      state.selected = [...root.querySelectorAll('[data-hc-precursor]:checked')].map(b => b.value);
      renderRings();
    } else if (t.matches('[data-hc-process]')) {
      state.process = t.value; renderProcess();
    }
  };
  const onInput = event => {
    const t = event.target;
    if (t.matches('[data-hc-field]')) state[t.dataset.hcField] = t.value;
  };
  const onClick = event => {
    const t = event.target.closest?.('[data-hc-action="save"]');
    if (!t || disposed) return;
    const status = $('[data-hc-save-status]');
    const text = summaryText(state, evaluateRings(state.selected));
    if (text === state.savedCursor) { status.textContent = '這份內容已附加過，沒有重複附加。'; return; }
    let ok = false;
    try { ok = typeof onSaveSummary === 'function' && onSaveSummary(text) === true; } catch { ok = false; }
    if (ok) { state.savedCursor = text; status.textContent = '已附加到本課筆記。'; }
    else status.textContent = '沒有附加成功；文字仍保留在上方，可先複製。';
  };
  root.addEventListener('change', onChange);
  root.addEventListener('input', onInput);
  root.addEventListener('click', onClick);
  return () => {
    disposed = true;
    root.removeEventListener('change', onChange);
    root.removeEventListener('input', onInput);
    root.removeEventListener('click', onClick);
  };
}
