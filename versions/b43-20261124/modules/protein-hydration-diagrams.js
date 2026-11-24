import {escapeHTML as esc} from './storage.js';

export const hydrationNumber = (value, digits = 4) => typeof value === 'number' && Number.isFinite(value)
  ? value !== 0 && Math.abs(value) < 10 ** -digits ? value.toExponential(3)
    : Number(value.toFixed(digits)).toLocaleString('en-US', {maximumFractionDigits:digits}) : '—';
const n = hydrationNumber;
const central = result => result?.status === 'CENTRAL_VALUES';
const reviewed = result => central(result) || result?.status === 'NO_REVIEWED_POINT';
const reading = (name, value, extra = '') => `<strong data-ph-reading="${name}"${typeof value === 'number' && Number.isFinite(value) ? ` data-ph-raw="${value}"` : ''}${extra}>${n(value)}</strong>`;
const plusMinus = (value, uncertainty) => `${n(value)}${typeof uncertainty === 'number' ? ` ± ${n(uncertainty)}` : ''}`;

/** A mass ledger, never a molecular surface or hydration-shell geometry. */
export function hydrationMass(result) {
  if (!reviewed(result)) return '';
  if (!central(result)) return `<div class="ph-unknown"><p>本活動未選定可換算的單點值。</p><p class="ph-caption">${esc(result.case.summary)}</p><dl><div><dt>所選水質量</dt><dd>${reading('selectedWaterMassG',null)} g</dd></div><div><dt>乾蛋白＋所選水</dt><dd>${reading('selectedSubsystemMassG',null)} g</dd></div></dl></div>`;
  const c = result.calculation, proteinPercent = 100 - c.waterInSubsystemPercent;
  const dryBasis = result.input.basis === 'dry-protein';
  return `<div class="ph-mass-ledger">
    <div class="ph-mass-parts"><article class="ph-protein-part"><span>乾蛋白基準</span><strong data-ph-protein-mass>${n(result.input.proteinMassG)} <small>g</small></strong></article><span class="ph-plus" aria-hidden="true">＋</span><article class="ph-water-part"><span>這筆 h 所指的水</span><span>${reading('selectedWaterMassG',c.selectedWaterMassG)} <small>g</small></span></article></div>
    <div class="ph-mass-bar" data-ph-mass-bar role="img" aria-label="質量比例：乾蛋白 ${n(proteinPercent,2)}%，所選水 ${n(c.waterInSubsystemPercent,2)}%。分母為乾蛋白加所選水，圖長不表示分子尺寸。"><span class="ph-protein-bar" style="width:${proteinPercent}%"></span><span class="ph-water-bar" style="width:${c.waterInSubsystemPercent}%"></span></div>
    <div class="ph-denominator-track" aria-hidden="true"><span class="ph-denominator-bracket" style="width:${dryBasis ? proteinPercent : 100}%"></span></div>
    <p class="ph-denominator-label" data-ph-diagram-denominator>目前分母：${dryBasis ? '乾蛋白' : '乾蛋白＋所選水'}</p>
    <p class="ph-mass-total">所選合計質量 ${reading('selectedSubsystemMassG',c.selectedSubsystemMassG)} g</p>
    <p class="ph-caption">質量比例示意；不代表水合層的形狀。</p>
  </div>`;
}

export function hydrationReadings(result) {
  if (!reviewed(result)) return '';
  const r = result.reported, c = result.calculation;
  const ready = central(result), dry = result.input.basis === 'dry-protein';
  const display = ready ? hydrationNumber(c.displayValue,2) : '—';
  return `<div class="ph-current-result"><p>這個分母下的換算值</p><output data-ph-reading="displayValue"${ready ? ` data-ph-raw="${c.displayValue}"` : ''}>${display}</output><p class="ph-result-unit" data-ph-display-unit>${esc(c.displayUnit || (dry ? 'g 所選水／100 g 乾蛋白' : 'g 所選水／100 g（乾蛋白＋所選水）'))}</p></div>
    <dl class="ph-reported"><div><dt>刊載 h <span>g 所選水／g 乾蛋白</span></dt><dd data-ph-reading="hGWaterPerGProtein"${ready ? ` data-ph-raw="${r.hGWaterPerGProtein}"` : ''}>${plusMinus(r.hGWaterPerGProtein,r.hPlusMinus)}</dd></div><div><dt>NMR 獨立讀值 x</dt><dd data-ph-reading="nmrX"${typeof r.nmrX === 'number' ? ` data-ph-raw="${r.nmrX}"` : ''}>${plusMinus(r.nmrX,r.nmrXPlusMinus)}</dd></div></dl>`;
}

export function hydrationBoundary(result) {
  if (!reviewed(result)) return '';
  if (result.input.caseId === 'water-ambient') return '20°C 是本活動提出的外推情境，沒有沿用低溫 h；全液態的 NMR 訊號不能自行指定為水合層。';
  if (result.input.caseId === 'buffered') return '論文有緩衝液的量測與描述；本活動未選定可換算的單點 h，不以零或純水值替代。';
  if (result.input.caseId === 'lyophilized') return `換算 ${n(result.calculation.waterInSubsystemPercent,4)}%，可核對原文四捨五入的 12.7 wt%。粉末是另一種樣品狀態，不能接成水中升溫曲線。`;
  return '分母只含乾蛋白與這筆 h 所指的水，不含其餘溶劑水；換算值不是整份溶液含水率，也不是 NMR x。';
}
