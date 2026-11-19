import {escapeHTML as esc} from './storage.js';

// Presentation only: every quantity and feasible step is supplied by the model adapter.
export function rosNumber(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  if (Object.is(value, -0) || value === 0) return '0';
  if (Math.abs(value) < 0.000001) return value.toExponential(3);
  return new Intl.NumberFormat('en-US', {maximumFractionDigits: 6, useGrouping: false}).format(value);
}

const count = (key, value) => `<strong data-ros-pool="${esc(key)}" data-ros-raw="${esc(String(value))}">${rosNumber(value)}</strong>`;
const step = (id, label, info, prefix, locked) => `<button type="button" class="ros-reaction" data-ros-reaction="${id}" aria-describedby="${prefix}-need-${id}" ${locked ? 'disabled' : ''}>${label}</button><p class="ros-step-note" id="${prefix}-need-${id}" data-ros-need="${id}">${esc(info)}</p>`;

export function rosReactionNetwork({pools, stepNotes, prefix, locked = false, lastReactionId = ''}) {
  return `<div class="ros-network" aria-label="SOD 形成過氧化氫，再選兩條清除路徑；目前量以 µmol 表示">
    <div class="ros-sod-lane">
      <article class="ros-pool ros-superoxide"><span class="ros-species">O₂•−</span><span>超氧陰離子</span>${count('superoxideUmol', pools.superoxideUmol)}<span class="ros-kind">自由基 ROS</span></article>
      <div class="ros-sod-step ${lastReactionId === 'sod' ? 'ros-last-step' : ''}"><span class="ros-arrow" aria-hidden="true">→</span>${step('sod', '走 SOD 這一步', stepNotes.sod, prefix, locked)}</div>
      <article class="ros-pool ros-peroxide"><span class="ros-species">H₂O₂</span><span>過氧化氫</span>${count('peroxideUmol', pools.peroxideUmol)}<span class="ros-kind">非自由基 ROS</span></article>
    </div>
    <p class="ros-fork-label">↓ H₂O₂ 的兩個去向</p>
    <div class="ros-branches">
      <article class="ros-branch ${lastReactionId === 'catalase' ? 'ros-last-step' : ''}"><span class="ros-path-name">Catalase</span><p class="ros-path-formula">2 H₂O₂ → O₂ + 2 H₂O</p>${step('catalase', '由 catalase 分解', stepNotes.catalase, prefix, locked)}<p class="ros-cost">每去除 2 µmol H₂O₂<br>形成 1 µmol O₂ · 不耗外加 NADH</p></article>
      <article class="ros-branch ${lastReactionId === 'nadh-peroxidase' ? 'ros-last-step' : ''}"><span class="ros-path-name">NADH peroxidase</span><p class="ros-path-formula">H₂O₂ + NADH + H⁺ → NAD⁺ + 2 H₂O</p>${step('nadh-peroxidase', '用 NADH 還原', stepNotes['nadh-peroxidase'], prefix, locked)}<p class="ros-cost">每去除 2 µmol H₂O₂<br>消耗 2 µmol NADH · 不形成 O₂</p></article>
    </div>
    <div class="ros-cofactor" aria-label="輔酶目前量"><span>NADH ${count('nadhUmol', pools.nadhUmol)}</span><span aria-hidden="true">→</span><span>NAD⁺ ${count('nadOxUmol', pools.nadOxUmol)}</span><span class="ros-caption">沒有自動再生</span></div>
  </div>`;
}

export function rosOutcome(superoxide, peroxide) {
  if (superoxide === 0 && peroxide === 0) return '目前追蹤的兩種 ROS 均為 0；這不能判定菌體存活。';
  if (superoxide === 0) return `超氧目前為 0；仍有 H₂O₂ ${rosNumber(peroxide)} µmol。`;
  if (peroxide === 0) return `H₂O₂ 為 0；仍有超氧 ${rosNumber(superoxide)} µmol。`;
  return `仍有超氧 ${rosNumber(superoxide)}、H₂O₂ ${rosNumber(peroxide)} µmol。`;
}
