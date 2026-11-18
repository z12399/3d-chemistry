// Radical ledger for metal-promoted lipid oxidation and chain-breaking antioxidants.
// Exact stoichiometric bookkeeping of a few teaching equations; no rates, yields or shelf life.

export const RADICAL_LEDGER_ID = 'radical-ledger';

export const SPECIES = [
  {id: 'LH', label: 'LH', name: '不飽和脂質'},
  {id: 'LOOH', label: 'LOOH', name: '氫過氧化物'},
  {id: 'Fe2', label: 'Fe²⁺', name: '亞鐵'},
  {id: 'Fe3', label: 'Fe³⁺', name: '鐵（III）'},
  {id: 'LO', label: 'LO•', name: '烷氧自由基', radical: true},
  {id: 'LOO', label: 'LOO•', name: '過氧自由基', radical: true},
  {id: 'L', label: 'L•', name: '脂質自由基', radical: true},
  {id: 'LOH', label: 'LOH', name: '脂質醇'},
  {id: 'TocOH', label: 'TocOH', name: 'α-生育醇'},
  {id: 'TocO', label: 'TocO•', name: '生育醇自由基', radical: true, quiet: true},
  {id: 'AscH', label: 'AscH', name: '抗壞血酸棕櫚酸酯'},
  {id: 'Asc', label: 'Asc•', name: '抗壞血酸自由基', radical: true, quiet: true}
];

export const SOURCES = {
  tang2000: {short: 'Tang 等 2000', label: 'Tang, Zhang, Qian & Shen（2000）The mechanism of Fe2+-initiated lipid peroxidation in liposomes. Biochem J 352:27–36', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1221429/'},
  tadolini1997: {short: 'Tadolini 等 1997', label: 'Tadolini 等（1997）Iron(III) stimulation of lipid hydroperoxide-dependent lipid peroxidation. Free Radic Res 27:563–576', url: 'https://doi.org/10.3109/10715769709097860'},
  aruoma1989: {short: 'Aruoma 等 1989', label: 'Aruoma, Halliwell 等（1989）The mechanism of initiation of lipid peroxidation. Biochem J 258:617–620', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1138407/'},
  packer1979: {short: 'Packer 等 1979', label: 'Packer, Slater & Willson（1979）Direct observation of a free radical interaction between vitamin E and vitamin C. Nature 278:737–738', url: 'https://doi.org/10.1038/278737a0'},
  doert2022: {short: 'Doert 等 2022', label: 'Doert, Grebenteuch, Kroh & Rohn（2022）α-tocopherol、phosphatidylethanolamine 與 L-ascorbyl palmitate 在散裝油中經穩定與再生 α-生育醇產生協同抗氧化. Food Chem 391:133084', url: 'https://doi.org/10.1016/j.foodchem.2022.133084'},
  ntu115: {short: '115 食化第 5 題', label: '臺大 115 學年度碩士班招生考試 食品化學（題號 239）第 5 題', url: 'https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-239.pdf'},
  ntu114: {short: '114 食化第 8 題', label: '臺大 114 學年度碩士班招生考試 食品化學（題號 257）第 8 題', url: 'https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-257.pdf'}
};

export const REACTIONS = [
  {id: 'fe2-looh', group: 'metal', text: 'Fe²⁺ + LOOH → Fe³⁺ + LO• + OH⁻', use: {Fe2: 1, LOOH: 1}, make: {Fe3: 1, LO: 1}, note: '亞鐵分解既有的氫過氧化物，啟動新的自由基。', source: 'tang2000'},
  {id: 'fe3-looh', group: 'metal', text: 'Fe³⁺ + LOOH → Fe²⁺ + LOO• + H⁺', use: {Fe3: 1, LOOH: 1}, make: {Fe2: 1, LOO: 1}, note: 'Fe³⁺ 也能促進依賴氫過氧化物的過氧化，鐵回到 Fe²⁺。', source: 'tadolini1997'},
  {id: 'lo-lh', group: 'chain', text: 'LO• + LH → LOH + L•', use: {LO: 1, LH: 1}, make: {LOH: 1, L: 1}, note: '烷氧自由基奪取氫（教學示意的傳播步驟）。'},
  {id: 'l-o2', group: 'chain', text: 'L• + O₂ → LOO•', use: {L: 1}, make: {LOO: 1}, note: '氧氣充足時，脂質自由基加氧（O₂ 視為不限量）。'},
  {id: 'loo-lh', group: 'chain', text: 'LOO• + LH → LOOH + L•', use: {LOO: 1, LH: 1}, make: {LOOH: 1, L: 1}, note: '鏈傳播：自由基數不變，氫過氧化物增加一個。'},
  {id: 'loo-toc', group: 'anti', text: 'LOO• + TocOH → LOOH + TocO•', use: {LOO: 1, TocOH: 1}, make: {LOOH: 1, TocO: 1}, note: '斷鏈：生育醇給氫，換成較不活潑的生育醇自由基；生育醇被消耗。'},
  {id: 'toc-asc', group: 'anti', text: 'TocO• + AscH → TocOH + Asc•', use: {TocO: 1, AscH: 1}, make: {TocOH: 1, Asc: 1}, note: '抗壞血酸類供氫再生的計量示意，AscH 在帳本代表酯的還原基團；所引 Packer 研究維生素 C，並非此酯在任意油相的直接驗證。', source: 'packer1979'},
  {id: 'fe3-asc', group: 'pro', text: 'Fe³⁺ + AscH → Fe²⁺ + Asc• + H⁺', use: {Fe3: 1, AscH: 1}, make: {Fe2: 1, Asc: 1}, note: '可能的促氧化支路：以 AscH 簡記還原基團。所引研究是抗壞血酸／鐵系統；此式不證明抗壞血酸棕櫚酸酯在所有食品都有相同效應。', source: 'aruoma1989'}
];

export function initialCounts({iron = true, tocopherol = true, palmitate = true} = {}) {
  const c = Object.fromEntries(SPECIES.map(s => [s.id, 0]));
  c.LH = 6; c.LOOH = 2;
  if (iron) c.Fe2 = 1;
  if (tocopherol) c.TocOH = 2;
  if (palmitate) c.AscH = 2;
  return c;
}

export function canApply(counts, reactionId) {
  const r = REACTIONS.find(x => x.id === reactionId);
  return !!r && Object.entries(r.use).every(([k, n]) => counts[k] >= n);
}

export function applyReaction(counts, reactionId) {
  if (!canApply(counts, reactionId)) throw new RangeError('Reaction not available: ' + reactionId);
  const r = REACTIONS.find(x => x.id === reactionId), next = {...counts};
  for (const [k, n] of Object.entries(r.use)) next[k] -= n;
  for (const [k, n] of Object.entries(r.make)) next[k] += n;
  return next;
}

export function replay(setup, steps) {
  let counts = initialCounts(setup);
  for (const id of steps) counts = applyReaction(counts, id);
  return counts;
}

// Observations the learner can earn; each is checked from the exact step history.
export function findings(setup, steps) {
  const start = initialCounts(setup), now = replay(setup, steps), out = [];
  const count = id => steps.filter(s => s === id).length;
  if (count('fe2-looh') >= 1 && count('fe3-looh') >= 1 && now.Fe2 + now.Fe3 === start.Fe2 + start.Fe3)
    out.push({id: 'iron-cycle', text: '鐵完成一次 Fe²⁺→Fe³⁺→Fe²⁺ 循環：鐵的總量沒變，卻把兩個 LOOH 轉成兩個自由基。微量金屬像觸媒一樣反覆作用。'});
  if (count('loo-toc') >= 1)
    out.push({id: 'chain-break', text: `生育醇攔下過氧自由基：每攔一次就消耗一個 TocOH（目前剩 ${now.TocOH}）。它延緩鏈傳播，但不會把已生成的 LOOH 變回脂質。`});
  if (count('toc-asc') >= 1)
    out.push({id: 'regenerate', text: `在本帳本的所選路徑中，TocOH 已再生，AscH 被消耗（剩 ${now.AscH}）。這解釋一種再生分工，不能由一步反應證明抗氧化協同；還須交代各成分劑量、定義相加參考，再以同條件的單劑與組合比較指定氧化端點。`});
  if (count('fe3-asc') >= 1)
    out.push({id: 'pro-oxidant', text: '本示意式可把 Fe³⁺ 還原成 Fe²⁺，再讓它分解 LOOH，展示可能的促氧化支路。是否影響實際食品，要核對鐵的形態、還原劑、分布與反應條件，不能僅由按鈕步數判定淨效應。'});
  return out;
}

const SETUP_LABELS = {iron: '微量鐵（1 Fe²⁺）', tocopherol: 'α-生育醇（2）', palmitate: '抗壞血酸棕櫚酸酯（2）'};
const GROUPS = [['metal', '金屬促進分解'], ['chain', '自由基鏈'], ['anti', '抗氧化'], ['pro', '可能的促氧化']];
const drafts = new WeakMap();
let instance = 0;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const srcLink = key => `<a href="${SOURCES[key].url}" target="_blank" rel="noopener noreferrer">${esc(SOURCES[key].short)}</a>`;

export function mountRadicalLedgerLab(container, id = RADICAL_LEDGER_ID, options = {}) {
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const {draftOwner, draftKey = id, onSaveSummary} = options;
  let store = null;
  if (draftOwner && typeof draftOwner === 'object') { store = drafts.get(draftOwner); if (!store) { store = new Map(); drafts.set(draftOwner, store); } }
  const state = store?.get(draftKey) || {setup: {iron: true, tocopherol: true, palmitate: true}, steps: [], note: '', savedCursor: ''};
  store?.set(draftKey, state);
  const prefix = `rl-${++instance}`;
  let disposed = false;

  container.innerHTML = `<section class="radical-lab" data-rl-lab="${esc(id)}" aria-labelledby="${prefix}-title">
    <header class="rl-head"><p class="rl-kicker">動手記帳</p><h3 id="${prefix}-title">鐵、生育醇、抗壞血酸棕櫚酸酯，各在哪一步作用？</h3><p class="rl-hint">選起始添加物，再自己一步步執行反應，看每個物種的數量怎麼變。 改變起始添加物會清除反應步驟與目前發現；解釋欄位保留。</p></header>
    <fieldset class="rl-setup"><legend>油裡一開始有什麼（另有 6 LH、2 LOOH，O₂ 不限量）</legend>${Object.entries(SETUP_LABELS).map(([k, v]) => `<label class="rl-toggle"><input type="checkbox" data-rl-setup="${k}"><span>${v}</span></label>`).join('')}</fieldset>
    <div class="rl-main">
      <div class="rl-reactions" data-rl-reactions></div>
      <div class="rl-side"><div class="rl-ledger" data-rl-ledger aria-live="polite"></div>
        <div class="rl-actions"><button type="button" data-rl-action="undo">上一步</button><button type="button" data-rl-action="reset">重新開始</button></div>
        <ol class="rl-steps" data-rl-steps></ol></div>
    </div>
    <section class="rl-findings" aria-labelledby="${prefix}-find"><h4 id="${prefix}-find">你發現了什麼</h4><ul data-rl-findings></ul></section>
    <details class="rl-detail" data-rl-detail="chips"><summary>連到題目：洋芋片為何加 L-ascorbyl palmitate？</summary>
      <p>抗壞血酸棕櫚酸酯接上長碳鏈後較具親脂性，實際分布仍受食品基質與界面影響。Doert 的散裝油研究是在 α-生育醇、磷脂醯乙醇胺（PE）與抗壞血酸棕櫚酸酯的三元系統觀察協同，不能省略 PE 就當成任意二元配方的通則（${srcLink('doert2022')}）。</p>
      <p>研究討論生育醇的穩定與從氧化產物再生；本帳本沒有 PE 或 α-生育醇醌（α-TQ）的反應池。「TocO• + AscH」只是供氫再生的一條簡化式，不是該三元研究完整機制的重建。Packer 研究的是維生素 C 與生育醇自由基的交互作用，材料也不同（${srcLink('packer1979')}）。</p>
      <p>抗壞血酸／鐵研究提供可能促氧化支路的依據（${srcLink('aruoma1989')}），不直接驗證此酯在洋芋片的淨效果。作答時先說明可行分工，再列食品中需核對的分布、鐵形態、單劑與組合對照及氧化端點；本工作台不預測添加量、協同大小或貨架期。</p></details>
    <details class="rl-detail" data-rl-detail="write"><summary>寫下你的解釋（選填）</summary>
      <label for="${prefix}-note">為什麼微量金屬會促進氧化？抗壞血酸棕櫚酸酯與生育醇怎麼分工？</label><textarea id="${prefix}-note" data-rl-field="note" rows="4" maxlength="3000"></textarea>
      <div class="rl-save"><button type="button" data-rl-action="save">附加本課筆記</button><span data-rl-save-status role="status"></span></div></details>
    <details class="rl-detail" data-rl-detail="bounds"><summary>判讀界線與來源</summary><ul>
      <li>這是精確計量的教學帳本：只核對原子／電荷團與物種數，不代表反應速率、先後機率或產物比例。按鈕可執行不代表在食品中一定以這個順序發生。</li>
      <li>反應按鈕及說明自載入即可見，屬有提示的機制示範，不是無提示測驗。「活性鏈自由基」只加總本帳本選定的 LO•、LOO•、L•，不是實測活性或總自由基效力。維生素 C、其酯與 PE 三元研究的材料及條件須分別保留。</li>
      <li>螯合劑（如檸檬酸）與單重態氧、光氧化未納入本帳本。</li>
      <li>對應官方題目：${srcLink('ntu115')}、${srcLink('ntu114')}；本工作台是判讀練習，不是官方答案。</li>
    </ul><ol class="rl-sources">${Object.values(SOURCES).map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('')}</ol></details>
  </section>`;

  const root = container.querySelector('.radical-lab');
  const $ = s => root.querySelector(s);
  root.querySelectorAll('[data-rl-setup]').forEach(b => { b.checked = !!state.setup[b.dataset.rlSetup]; });
  $('[data-rl-field="note"]').value = state.note;

  function render() {
    const counts = replay(state.setup, state.steps);
    $('[data-rl-reactions]').innerHTML = GROUPS.map(([g, title]) => `<div class="rl-group rl-${g}"><h4>${title}</h4>${REACTIONS.filter(r => r.group === g).map(r => {
      const ok = canApply(counts, r.id);
      return `<button type="button" class="rl-reaction" data-rl-reaction="${r.id}"${ok ? '' : ' disabled'}><span class="rl-eq">${r.text}</span><small>${esc(r.note)}${r.source ? ' · ' + esc(SOURCES[r.source].short) : ''}</small></button>`;
    }).join('')}</div>`).join('');
    const radicals = SPECIES.filter(s => s.radical && !s.quiet).reduce((n, s) => n + counts[s.id], 0);
    $('[data-rl-ledger]').innerHTML = `<table><caption>目前物種數</caption><tbody>${SPECIES.map(s => `<tr class="${s.radical ? 'rl-rad' : ''}${counts[s.id] === 0 ? ' rl-zero' : ''}" data-rl-species="${s.id}"><th scope="row">${s.label}<small>${s.name}</small></th><td>${counts[s.id]}</td></tr>`).join('')}</tbody></table><p class="rl-sum">活性鏈自由基（LO•、LOO•、L•）：<strong data-rl-active>${radicals}</strong>　鐵總量：<strong>${counts.Fe2 + counts.Fe3}</strong></p>`;
    $('[data-rl-steps]').innerHTML = state.steps.length ? state.steps.map(s => `<li>${REACTIONS.find(r => r.id === s).text}</li>`).join('') : '<li class="rl-empty">尚未執行反應</li>';
    const f = findings(state.setup, state.steps);
    $('[data-rl-findings]').innerHTML = f.length ? f.map(x => `<li data-rl-finding="${x.id}">${esc(x.text)}</li>`).join('') : '<li class="rl-empty">試著讓鐵完成一次循環，或用生育醇攔下一個過氧自由基。</li>';
    $('[data-rl-action="undo"]').disabled = state.steps.length === 0;
  }
  render();

  const onClick = event => {
    if (disposed) return;
    const reaction = event.target.closest?.('[data-rl-reaction]');
    if (reaction && !reaction.disabled) {
      const id = reaction.dataset.rlReaction, order = REACTIONS.map(r => r.id);
      state.steps.push(id); render();
      // Keep keyboard focus in the workbench: same button if still usable, else the next usable one, else undo.
      const buttons = order.slice(order.indexOf(id)).concat(order.slice(0, order.indexOf(id))).map(r => root.querySelector(`[data-rl-reaction="${r}"]`));
      (buttons.find(b => b && !b.disabled) || $('[data-rl-action="undo"]'))?.focus();
      return;
    }
    const action = event.target.closest?.('[data-rl-action]')?.dataset.rlAction;
    if (action === 'undo') { state.steps.pop(); render(); }
    else if (action === 'reset') { state.steps = []; render(); }
    else if (action === 'save') {
      const status = $('[data-rl-save-status]');
      const setup = Object.entries(SETUP_LABELS).filter(([k]) => state.setup[k]).map(([, v]) => v).join('、') || '無添加';
      const text = [`【自由基帳本】起始：${setup}`, `執行：${state.steps.map(s => REACTIONS.find(r => r.id === s).text).join('；') || '無'}`, ...findings(state.setup, state.steps).map(f => '發現：' + f.text), state.note.trim() ? '我的解釋：' + state.note.trim() : ''].filter(Boolean).join('\n');
      if (text === state.savedCursor) { status.textContent = '這份內容已附加過，沒有重複附加。'; return; }
      let ok = false;
      try { ok = typeof onSaveSummary === 'function' && onSaveSummary(text) === true; } catch { ok = false; }
      if (ok) { state.savedCursor = text; status.textContent = '已附加到本課筆記。'; } else status.textContent = '沒有附加成功；文字仍保留在上方，可先複製。';
    }
  };
  const onChange = event => {
    const box = event.target.closest?.('[data-rl-setup]');
    if (!box || disposed) return;
    state.setup = {...state.setup, [box.dataset.rlSetup]: box.checked};
    state.steps = [];
    render();
  };
  const onInput = event => { if (disposed) return; if (event.target.matches?.('[data-rl-field="note"]')) state.note = event.target.value; };
  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  root.addEventListener('input', onInput);
  return () => { disposed = true; root.removeEventListener('click', onClick); root.removeEventListener('change', onChange); root.removeEventListener('input', onInput); };
}
