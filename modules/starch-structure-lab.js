import {escapeHTML as esc} from './storage.js';
import {STARCH_STRUCTURE_ID, STARCH_TOPOLOGIES, createStarchState, cutStarchBond, undoStarchCut, resetStarchCuts, starchHydrolysis, starchFormulaText} from './starch-structure-model.js';
export {STARCH_STRUCTURE_ID as STARCH_STRUCTURE_LAB_ID} from './starch-structure-model.js';

let instanceSequence = 0;

export const STARCH_STRUCTURE_SOURCES = Object.freeze([
  Object.freeze({title: 'ASM · Starch Agar Protocol', url: 'https://asm.org/asm/media/protocol-images/starch-agar-protocol.pdf', note: '第 3 頁 Figure 1：α(1→4) 與 α(1→6) 連接。這裡只引用鍵型，不把任選切口當成酵素專一性。'}),
  Object.freeze({title: 'Fine Structure of Corn Amylose and Amylopectin Fractions with Various Molecular Weights', url: 'https://pubs.acs.org/jafcau/article/45/10/3840/70545/Fine-Structure-of-Corn-Amylose-and-Amylopectin', note: '原始研究的玉米 amylose 分畫仍可有少量分支；無分支圖是本活動選定的簡化片段。'})
]);

// Layout is a diagram of connectivity, not molecular coordinates or bond angles.
const mainPoints = Object.fromEntries(Array.from({length: 6}, (_, i) => [`n${i + 1}`, [40 + i * 56, 214]]));
const layouts = {
  linear9: {...mainPoints, n7: [320, 142], n8: [264, 88], n9: [208, 34]},
  branched9: {...mainPoints, b1: [152, 142], b2: [220, 88], b3: [288, 34]}
};
const describeBond = edge => `${edge.donor} C1 → ${edge.acceptor} O${edge.acceptorCarbon} · ${edge.linkage}`;
const formulaHTML = atoms => starchFormulaText(atoms).replace(/(\d+)/g, '<sub>$1</sub>');
const equationHTML = equation => esc(equation).replace(/([CHO])(\d+)/g, '$1<sub>$2</sub>');

function diagram(topologyId, id) {
  const graph = STARCH_TOPOLOGIES[topologyId], points = layouts[topologyId];
  return `<svg viewBox="0 0 360 254" aria-labelledby="${id}-diagram-title ${id}-diagram-desc" class="starch-structure-svg"><title id="${id}-diagram-title">${graph.label}：九個葡萄糖殘基的連接</title><desc id="${id}-diagram-desc">圓點是殘基，不是原子。可選擇連接線，或使用圖下方的選單。排布不表示鍵角、距離或顆粒形狀。</desc>
    ${graph.bonds.map(edge => {
      const [x1, y1] = points[edge.donor], [x2, y2] = points[edge.acceptor], x = (x1 + x2) / 2, y = (y1 + y2) / 2;
      return `<g class="starch-edge" data-starch-bond="${edge.id}" role="button" tabindex="0" aria-pressed="false" aria-label="${describeBond(edge)}"><line class="starch-edge-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><circle class="starch-edge-hit" cx="${x}" cy="${y}" r="25"/><circle class="starch-edge-focus" cx="${x}" cy="${y}" r="11"/><path class="starch-edge-cut" d="M ${x - 5} ${y - 5} l 10 10 M ${x + 5} ${y - 5} l -10 10"/></g>`;
    }).join('')}
    ${graph.residues.map(residueId => { const [x, y] = points[residueId]; return `<g class="starch-residue" data-starch-residue="${residueId}" aria-hidden="true"><circle cx="${x}" cy="${y}" r="17"/><text x="${x}" y="${y + 4}">${residueId}</text></g>`; }).join('')}
  </svg>`;
}

/** Synchronous mount; nine-residue cuts remain local. The optional spatial lab owns its saved observations. */
export function mountStarchStructureLab(container, id = STARCH_STRUCTURE_ID, {onOpenLinear3D, draftOwner, onSaveSummary} = {}) {
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  if (id !== STARCH_STRUCTURE_ID) throw new RangeError('Unknown starch structure activity');
  const domId = `${id}-${++instanceSequence}`;
  let disposed = false, current = 'branched9', disposeSpatial = null;
  const states = {linear9: createStarchState('linear9'), branched9: createStarchState('branched9')};
  const selections = {linear9: 'n4-n3', branched9: 'b1-n3'};
  const $ = selector => container.querySelector(selector);
  container.innerHTML = `<div data-starch-spatial-root><p role="status">正在準備直鏈／支鏈澱粉 3D 空間觀察…</p></div>
  <details class="starch-connectivity-disclosure"><summary>再看九個殘基的連接與水解</summary><section class="starch-structure-lab" aria-labelledby="${domId}-title">
    <header><p class="starch-structure-kicker">連接與水解 · 教學示意</p><h2 id="${domId}-title">選一條鍵，看片段怎麼分開</h2><p class="starch-structure-boundary">連接示意；不預測酵素切法、幾何或速率。</p></header>
    <div class="starch-structure-tools"><label for="${domId}-topology">比較結構<select id="${domId}-topology" data-starch-topology><option value="branched9">支鏈片段 · 9 個殘基</option><option value="linear9">直鏈片段 · 9 個殘基</option></select></label><span>每個圓點 = 1 個葡萄糖殘基</span></div>
    <div class="starch-structure-workspace"><div class="starch-structure-canvas" data-starch-diagram></div><div class="starch-structure-inspector">
    <div class="starch-bond-choice"><label for="${domId}-bond">選擇連接<select id="${domId}-bond" data-starch-select></select></label><p class="starch-selected-bond" data-starch-selected></p><p class="starch-selected-note" data-starch-selected-note></p></div>
    <div class="starch-structure-actions"><button type="button" class="button-primary" data-starch-action="cut">水解選定鍵</button><button type="button" data-starch-action="undo">撤回一步</button><button type="button" class="starch-reset" data-starch-action="reset">重設此圖</button></div>
    <p class="starch-structure-feedback" role="status" aria-live="polite" data-starch-feedback>先選鍵，再水解；目前尚未切開。</p>
    <section class="starch-fragments" aria-label="目前片段"><p data-starch-summary></p><div class="starch-fragment-list" data-starch-fragments></div></section>
    <div class="starch-equation-block" aria-label="累計水解反應式"><p class="starch-equation" data-starch-equation></p><p class="starch-water" data-starch-water></p></div></div></div>
    <details class="starch-structure-details"><summary>查看原子收支</summary><div class="starch-structure-detail-body"><div class="starch-table-scroll" tabindex="0" role="region" aria-label="原子收支"><table><thead><tr><th scope="col">原子</th><th scope="col">原料 + 水</th><th scope="col">產物總和</th></tr></thead><tbody data-starch-balance></tbody></table></div><div data-starch-fragment-formulas></div><p class="starch-structure-note">這是從完整九殘基片段累計到目前狀態的淨收支。同分子式不表示同一結構；此處不指定新還原端的 α／β 比例或反應機構。</p></div></details>
    ${typeof onOpenLinear3D === 'function' ? '<button type="button" class="starch-open-3d" data-starch-action="3d">對照直鏈五糖 3D ↗</button>' : ''}
    <details class="starch-structure-details"><summary>這張圖能說明什麼？</summary><div class="starch-structure-detail-body"><p>兩張圖都只有 9 個葡萄糖殘基、8 條糖苷鍵。支鏈的 b1 C1 接到 n3 O6；主鏈的 n4 C1 接到同一 n3 的 O4。n3 的 C1 則接到 n2 O4。線的方向與彎折只為排版，不表示分子的幾何。</p><p>直鏈澱粉（amylose）以 α(1→4) 連接為主，也可能含少量分支；這張直鏈圖刻意不含分支。支鏈圖只示範一個分支點，其分支比例、鏈長與分布不代表天然支鏈澱粉。</p><p>這裡處理分子內的共價連接，不是澱粉顆粒、糊體或凝膠的尺度。糊化與回凝不能用這裡的「切鍵」代替，也不能由這九個殘基直接預測黏度、熱峰或口感。</p><p>每水解一條鍵消耗一個 H₂O，得到兩個分開的片段。無環、未取代的中性葡聚糖片段，DP = n 時總式為 C₆ₙH₁₀ₙ₊₂O₅ₙ₊₁；分支不改變這個總式。計算把新端基的 H 與 OH 納入收支，圖上只顯示殘基連接。操作只保留在本次頁面；撤回是編輯紀錄，不是在模擬逆反應。</p><ul>${STARCH_STRUCTURE_SOURCES.map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><span>${esc(source.note)}</span></li>`).join('')}</ul></div></details>
  </section></details>`;

  function buildDiagram() {
    const graph = STARCH_TOPOLOGIES[current];
    $('[data-starch-diagram]').innerHTML = diagram(current, domId);
    $('[data-starch-select]').innerHTML = graph.bonds.map(edge => `<option value="${edge.id}">${describeBond(edge)}</option>`).join('');
  }
  function draw() {
    const state = states[current], graph = STARCH_TOPOLOGIES[current], result = starchHydrolysis(current, state.cutIds);
    const selected = graph.bonds.find(edge => edge.id === selections[current]);
    $('[data-starch-topology]').value = current;
    $('[data-starch-select]').value = selected.id;
    $('[data-starch-selected]').textContent = `${selected.linkage} · ${selected.donor} C1 → ${selected.acceptor} O${selected.acceptorCarbon}`;
    const acceptorBranches = graph.bonds.filter(edge => edge.acceptor === selected.acceptor && !state.cutIds.includes(edge.id)).length;
    $('[data-starch-selected-note]').textContent = state.cutIds.includes(selected.id) ? '這條鍵已水解，可改選另一條，或撤回一步。' : selected.acceptorCarbon === 6 ? (acceptorBranches > 1 ? '這條鍵接到受體的 O6，此處同時保有 O4 連接，形成分支。' : '這條鍵仍接到 O6，但此處的 O4 連接已切開，不再構成分支。') : '這條鍵接到受體的 O4。';
    $('[data-starch-action="cut"]').disabled = state.cutIds.includes(selected.id);
    $('[data-starch-action="undo"]').disabled = state.cutIds.length === 0;
    $('[data-starch-action="reset"]').disabled = state.cutIds.length === 0;
    for (const edge of graph.bonds) {
      const element = $(`[data-starch-bond="${edge.id}"]`), cut = state.cutIds.includes(edge.id);
      element.setAttribute('aria-pressed', String(edge.id === selected.id));
      element.setAttribute('aria-label', describeBond(edge) + (cut ? '，已水解' : '，尚未水解'));
      element.dataset.cut = String(cut);
    }
    result.fragments.forEach((fragment, index) => fragment.residueIds.forEach(residueId => {
      $(`[data-starch-residue="${residueId}"]`).dataset.fragment = String(index % 4);
    }));
    $('[data-starch-summary]').textContent = `目前 ${result.fragments.length} 個片段 · ${result.fragments.length} 個還原端 · 共 9 個葡萄糖單元`;
    $('[data-starch-fragments]').innerHTML = result.fragments.map((fragment, index) => `<span class="starch-fragment" data-fragment="${index % 4}"><span>片段 ${index + 1}</span><strong>DP ${fragment.dp}</strong><span class="starch-fragment-end">還原端 ${fragment.reducingEnd}</span></span>`).join('');
    $('[data-starch-equation]').innerHTML = equationHTML(result.equation);
    $('[data-starch-water]').textContent = result.waterCount ? `累計水解 ${result.waterCount} 條鍵，消耗 ${result.waterCount} 個 H₂O。` : '尚未水解：消耗 0 個 H₂O。';
    $('[data-starch-balance]').innerHTML = ['C', 'H', 'O'].map(element => `<tr><th scope="row">${element}</th><td>${result.reactants[element]}</td><td>${result.products[element]}</td></tr>`).join('');
    $('[data-starch-fragment-formulas]').innerHTML = `<ul class="starch-fragment-formulas">${result.fragments.map((fragment, index) => `<li><strong>片段 ${index + 1} · DP ${fragment.dp}</strong><span>${formulaHTML(fragment.atoms)} · ${fragment.residueIds.join('、')}</span></li>`).join('')}</ul>`;
  }
  function selectBond(bondId) {
    if (!STARCH_TOPOLOGIES[current].bonds.some(edge => edge.id === bondId)) return;
    selections[current] = bondId;
    $('[data-starch-feedback]').textContent = '';
    draw();
  }
  function onClick(event) {
    if (disposed) return;
    const target = event.target?.closest?.('[data-starch-bond], [data-starch-action]');
    if (!target || !container.contains(target)) return;
    if (target.dataset.starchBond) { selectBond(target.dataset.starchBond); return; }
    const action = target.dataset.starchAction, state = states[current];
    if (action === '3d') { if (typeof onOpenLinear3D === 'function') onOpenLinear3D(); return; }
    if (action === 'cut') {
      const selected = selections[current];
      if (state.cutIds.includes(selected)) return;
      states[current] = cutStarchBond(state, selected);
      const result = starchHydrolysis(current, states[current].cutIds);
      $('[data-starch-feedback]').textContent = `已水解 ${selected}；累計用 ${result.waterCount} 個 H₂O，得到 ${result.fragments.length} 個片段。`;
    } else if (action === 'undo') {
      if (!state.cutIds.length) return;
      selections[current] = state.cutIds.at(-1);
      states[current] = undoStarchCut(state);
      $('[data-starch-feedback]').textContent = '已撤回最近一次操作；這不是化學逆反應。';
    } else if (action === 'reset') {
      states[current] = resetStarchCuts(state);
      $('[data-starch-feedback]').textContent = '已還原此圖，另一張圖的操作保留。';
    } else return;
    draw();
  }
  function onChange(event) {
    if (disposed || !container.contains(event.target)) return;
    if (event.target?.matches?.('[data-starch-topology]')) {
      if (!Object.hasOwn(STARCH_TOPOLOGIES, event.target.value)) { event.target.value = current; return; }
      current = event.target.value; buildDiagram(); draw();
      $('[data-starch-feedback]').textContent = '已切換結構；兩張圖各自保留本次操作。';
    } else if (event.target?.matches?.('[data-starch-select]')) {
      selectBond(event.target.value);
      // Restore the previous valid option even if a synthetic event supplied an invalid value.
      event.target.value = selections[current];
    }
  }
  function onKeydown(event) {
    if (disposed || !['Enter', ' '].includes(event.key)) return;
    const target = event.target?.closest?.('[data-starch-bond]');
    if (!target || !container.contains(target)) return;
    event.preventDefault(); selectBond(target.dataset.starchBond);
  }
  buildDiagram(); draw();
  container.addEventListener('click', onClick);
  container.addEventListener('change', onChange);
  container.addEventListener('keydown', onKeydown);
  const spatialRoot = $('[data-starch-spatial-root]');
  // The chemistry tests use a small event fixture; only a real DOM loads WebGL.
  if (spatialRoot && spatialRoot.ownerDocument && typeof spatialRoot.ownerDocument.createElement === 'function') {
    import('./starch-spatial-lab.js').then(module => {
      if (disposed || !container.contains(spatialRoot)) return;
      const dispose = module.mountStarchSpatialLab(spatialRoot, {
        draftOwner,
        onSaveSummary: summary => disposed ? false : (typeof onSaveSummary === 'function' ? onSaveSummary(summary) : false)
      });
      if (disposed || !container.contains(spatialRoot)) {
        if (typeof dispose === 'function') dispose();
      } else if (typeof dispose === 'function') disposeSpatial = dispose;
    }).catch(() => {
      if (disposed || !container.contains(spatialRoot)) return;
      spatialRoot.innerHTML = '<p role="status">3D 空間觀察暫時無法載入，仍可展開下方的九殘基連接與水解。</p>';
    });
  }
  return () => {
    if (disposed) return;
    disposed = true;
    disposeSpatial?.();
    disposeSpatial = null;
    container.removeEventListener('click', onClick);
    container.removeEventListener('change', onChange);
    container.removeEventListener('keydown', onKeydown);
  };
}
