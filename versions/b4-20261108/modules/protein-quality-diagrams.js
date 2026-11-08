import {escapeHTML as esc} from './storage.js';

export const PROTEIN_GROUP_LABELS = Object.freeze({HIS:'組胺酸', ILE:'異白胺酸', LEU:'白胺酸', LYS:'離胺酸', SAA:'含硫胺基酸', AAA:'芳香族胺基酸', THR:'蘇胺酸', TRP:'色胺酸', VAL:'纈胺酸'});
export const PROTEIN_GROUP_FORMULAS = Object.freeze({HIS:'His', ILE:'Ile', LEU:'Leu', LYS:'Lys', SAA:'Met + Cys', AAA:'Phe + Tyr', THR:'Thr', TRP:'Trp', VAL:'Val'});
export const proteinNumber = (value, digits = 2) => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '未提供';

/** Native buttons keep each plotted row readable and selectable at browser zoom. */
export function proteinRatioChart(profiles, selected = 'SAA') {
  if (!Array.isArray(profiles) || profiles.length !== 2 || profiles.some(p => !Array.isArray(p.rows))) throw new TypeError('Two evaluated protein profiles are required');
  const groups = Object.keys(PROTEIN_GROUP_LABELS);
  if (profiles.some(p => p.rows.length !== groups.length || p.rows.some((r, i) => r.groupId !== groups[i] || (r.ratio !== null && (!Number.isFinite(r.ratio) || r.ratio < 0))))) throw new TypeError('Invalid protein ratio chart rows');
  const values = profiles.flatMap(p => p.rows.map(r => r.ratio)).filter(v => v !== null);
  const maximum = Math.max(1.5, Math.ceil(Math.max(0, ...values) * 2) / 2);
  const reference = 100 / maximum;
  return `<div class="pq-ratio-chart" data-pq-chart-max="${maximum}">
    <div class="pq-axis" aria-hidden="true"><span>胺基酸組</span><span class="pq-axis-track"><span>0</span><span style="left:${reference}%">1 倍</span><span>${maximum} 倍</span></span><span>A</span><span>B</span></div>
    ${groups.map((id, index) => {
      const rows = profiles.map(p => p.rows[index]);
      const label = `${PROTEIN_GROUP_LABELS[id]}（${PROTEIN_GROUP_FORMULAS[id]}）；A ${rows[0].ratio === null ? '無法計算' : proteinNumber(rows[0].ratio) + ' 倍'}；B ${rows[1].ratio === null ? '無法計算' : proteinNumber(rows[1].ratio) + ' 倍'}`;
      return `<button type="button" class="pq-chart-row" data-pq-group="${id}" aria-pressed="${selected === id}" aria-label="${esc(label)}"><span class="pq-row-label">${PROTEIN_GROUP_LABELS[id]}<span>${PROTEIN_GROUP_FORMULAS[id]}</span></span><span class="pq-bar-pair" aria-hidden="true"><span class="pq-reference" style="left:${reference}%"></span>${rows.map((row, side) => `<span class="pq-bar-track"><span class="pq-bar pq-bar-${side}" style="width:${row.ratio === null ? 0 : row.ratio / maximum * 100}%"></span>${row.ratio === null ? '<span class="pq-unknown-mark">資料不足</span>' : ''}</span>`).join('')}</span>${rows.map((row, side) => `<span class="pq-ratio-value pq-value-${side}" data-pq-ratio="${side}:${id}">${row.ratio === null ? '—' : proteinNumber(row.ratio)}</span>`).join('')}</button>`;
    }).join('')}
  </div>`;
}

export function proteinSelectedCalculation(sample, profile, selected) {
  const row = profile.rows.find(r => r.groupId === selected);
  if (!row) throw new RangeError('Unknown protein group');
  const aa = row.aminoAcidIds.map(id => sample.aminoAcids[id]);
  const source = aa.map((value, i) => `${row.aminoAcidIds[i]} ${value ? proteinNumber(value.mean, 2) : '此表未提供'}`).join(' + ');
  const unit = sample.aminoAcidBasis === 'g_per_100g_crude_protein' ? 'g／100 g 粗蛋白' : 'g／100 g 乾燥樣本';
  let calculation;
  if (!profile.basisSupported) calculation = '此來源未提供所選蛋白分母，無法換算。';
  else if (row.missingAminoAcids.length) calculation = `此表缺少 ${row.missingAminoAcids.join('、')}；不以 0 補入。`;
  else calculation = sample.aminoAcidBasis === 'g_per_100g_crude_protein'
    ? `${proteinNumber(row.sourceMean)} × 10 = ${proteinNumber(row.mgPerGProtein)} mg／g 蛋白；再 ÷ ${proteinNumber(row.referenceMgPerGProtein, 1)} = ${proteinNumber(row.ratio)} 倍。`
    : `${proteinNumber(row.sourceMean)} ÷ ${proteinNumber(profile.denominator.mean)} × 1000 = ${proteinNumber(row.mgPerGProtein)} mg／g 蛋白；再 ÷ ${proteinNumber(row.referenceMgPerGProtein, 1)} = ${proteinNumber(row.ratio)} 倍。`;
  return {source:`${source}（${unit}）`, calculation, reference:`參考模式：${proteinNumber(row.referenceMgPerGProtein, 1)} mg／g 蛋白`, row};
}
