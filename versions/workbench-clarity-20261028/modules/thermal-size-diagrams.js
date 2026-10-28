import {escapeHTML as esc} from './storage.js';
import {evaluateThermalSize} from './thermal-size-model.js';

export const thermalNumber = (value, digits = 2) => {
  if (value === null || !Number.isFinite(value)) return '無法判定';
  // Small, nonzero geometry or rates must not become an apparent exact zero.
  if (value !== 0 && Math.abs(value) < 10 ** -digits) return value.toPrecision(3);
  return Number(value.toFixed(digits)).toLocaleString('en-US', {maximumFractionDigits:digits});
};
const n = thermalNumber;
export function thermalSizeGeometry(result) {
  const {spheres, input} = result;
  return `<div class="ts-spheres">${spheres.map((s, i) => `<article class="ts-sphere-card"><h3>${s.id} · 半徑 ${n(s.radiusM * 1000)} mm</h3><div class="ts-sphere-space" aria-hidden="true"><div class="ts-sphere ts-color-${i}" style="width:${150 * (i ? 1 : 1 / input.radiusRatio)}px;height:${150 * (i ? 1 : 1 / input.radiusRatio)}px"></div></div><p>表面積 <strong>${n(s.areaM2 * 1e4)} cm²</strong><br>體積 <strong>${n(s.volumeM3 * 1e6)} cm³</strong></p><p class="ts-caption">V / A = ${n(s.characteristicLengthM * 1000)} mm</p></article>`).join('')}</div>`;
}
export function thermalSizeRatios(result) {
  const ratio = result.input.radiusRatio, eq = result.direction === 'equilibrium';
  const rows = [['相同溫變的儲熱需求', eq ? null : ratio ** 3, '體積'], ['初始總熱流大小', eq ? null : ratio ** 2, '表面積'], ['初始平均溫變率大小', eq ? null : 1 / ratio, '表面積 / 體積']];
  return `<div class="ts-ratio-grid">${rows.map(([label, value, reason]) => `<article><p>${label}</p><strong>${value === null ? '皆為 0' : `${n(value)} 倍`}</strong><p class="ts-caption">${reason}${value === null ? '；不計 0 / 0' : '（B / A）'}</p></article>`).join('')}</div>`;
}
export function thermalChartHorizon(result) {
  const times = result.spheres.map(s => s.targetTimeSeconds).filter(t => t !== null && Number.isFinite(t));
  return Math.min(86400, Math.max(600, ...times.map(t => t * 1.25), result.input.timeSeconds));
}
/** Only accepted lumped-model curves are drawn; no high-Bi hypothetical curve. */
export function thermalTemperatureChart(result) {
  const {input, spheres, direction} = result, horizon = thermalChartHorizon(result);
  if (direction === 'equilibrium') return '<p class="ts-empty-chart">初始溫度等於環境溫度。兩球維持等溫，沒有可定義的溫差完成比例。</p>';
  const valid = spheres.filter(s => s.applicable);
  if (!valid.length) return '<p class="ts-empty-chart">兩球都未通過近均溫篩選。此模型不產生溫度曲線或達標時間。</p>';
  const low = Math.min(input.initialC, input.ambientC), high = Math.max(input.initialC, input.ambientC);
  const x = t => 56 + t / horizon * 490, y = t => 218 - (t - low) / (high - low) * 182;
  const target = input.initialC + input.targetFraction * (input.ambientC - input.initialC);
  const series = valid.map(s => {
    const points = Array.from({length:101}, (_, index) => {
      const t = index / 100 * horizon, evaluated = evaluateThermalSize({...input, timeSeconds:t}).spheres.find(v => v.id === s.id);
      return `${x(t).toFixed(2)},${y(evaluated.temperatureC).toFixed(2)}`;
    }).join(' ');
    return `<polyline data-ts-curve="${s.id}" points="${points}" fill="none" stroke="${s.id === 'A' ? '#246b75' : '#a76636'}" stroke-width="3"${s.id === 'B' ? ' stroke-dasharray="9 5"' : ''}/><circle cx="${x(input.timeSeconds)}" cy="${y(s.temperatureC)}" r="5" fill="${s.id === 'A' ? '#246b75' : '#a76636'}"/>`;
  }).join('');
  return `<svg class="ts-chart" viewBox="0 0 600 278" role="img" aria-label="近均溫模型的溫度與時間；A實線，B虛線。未通過篩選的球不繪製曲線。"><line x1="56" y1="36" x2="56" y2="218" stroke="#70868b"/><line x1="56" y1="218" x2="546" y2="218" stroke="#70868b"/><line x1="56" y1="${y(target)}" x2="546" y2="${y(target)}" stroke="#8b8a72" stroke-dasharray="3 5"/><line x1="${x(input.timeSeconds)}" y1="36" x2="${x(input.timeSeconds)}" y2="218" stroke="#bac7ca"/>${series}<g fill="#324f55" font-size="16"><text x="12" y="23">°C</text><text x="46" y="42" text-anchor="end">${n(high, 1)}</text><text x="46" y="222" text-anchor="end">${n(low, 1)}</text><text x="56" y="245" text-anchor="middle">0</text><text x="301" y="245" text-anchor="middle">${n(horizon / 120, 1)}</text><text x="546" y="245" text-anchor="middle">${n(horizon / 60, 1)}</text><text x="301" y="270" text-anchor="middle">時間（分鐘）</text></g></svg>`;
}
export function thermalSphereReadout(result, sphere) {
  const eq = result.direction === 'equilibrium', {input} = result;
  return `<article class="ts-temperature-card"><h3>${esc(sphere.id)} · Bi = ${n(sphere.biot, 4)}</h3><p class="ts-result">${eq ? `${n(input.initialC)} °C · 維持等溫` : sphere.applicable ? `${n(sphere.temperatureC)} °C` : '溫度：無法由本模型判定'}</p><p>${eq ? '無溫差，完成比例未定義' : sphere.applicable ? `達到 ${n(input.targetFraction * 100)}%：${n(sphere.targetTimeSeconds / 60)} 分鐘（目標 ${n(sphere.targetTemperatureC)} °C）${sphere.targetTimeSeconds > 86400 ? '（超出本圖 24 小時觀察窗）' : ''}` : 'Bi ≥ 0.1；達標時間未知'}</p><p class="ts-caption">${sphere.applicable ? '通過近均溫篩選；仍需符合下方假設' : '幾何與初始能量收支仍可計算'}</p></article>`;
}
