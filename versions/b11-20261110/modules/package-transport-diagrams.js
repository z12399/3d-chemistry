import {escapeHTML as esc} from './storage.js';

export const packageNumber = (v, digits = 4) => typeof v === 'number' && Number.isFinite(v)
  ? v !== 0 && Math.abs(v) < 10 ** -digits ? v.toExponential(3)
    : Number(v.toFixed(digits)).toLocaleString('en-US', {maximumFractionDigits:digits}) : '—';
const n = packageNumber;
const ready = r => r?.status === 'MODEL_OK';
const unavailable = () => '<p class="pt-empty">來源或數值尚未通過核對，暫不畫正常傳輸結果。</p>';

export function packageBoundary(r, mode) {
  if (!ready(r)) return '資料尚未通過核對；缺資料保留未知。';
  if (r.initial.deltaPressureKpa === 0) return '兩側氧分壓相同，淨傳輸為零；不代表膜完全阻氧，也未判定食品狀態。';
  if (mode === 'maintained') return '分壓由供排氣持續維持。穿膜累積量與邊界補償相抵，容器內氧量保持不變。';
  return r.initial.deltaPressureKpa > 0
    ? '氧在空容器內累積，分壓差逐漸縮小；這裡的穿膜累積等於容器氧量增加。'
    : '內側氧分壓較高，氧向外流；負的穿膜累積等於容器氧量減少。';
}

export function packageReadings(r, mode) {
  const v = ready(r) ? r[mode] : {};
  return [
    ['每面積淨通量 J', 'fluxMicromolM2Day', 'μmol / (m²·日)'],
    ['整膜淨傳輸速率', 'rateMicromolDay', 'μmol / 日'],
    ['穿膜累積傳輸量', 'signedTransferredMicromol', 'μmol'],
  ].map(([label,key,unit]) => `<article><p>${label}</p><strong data-pt-reading="${key}"${ready(r) ? ` data-pt-raw="${v[key]}"` : ''}>${n(v[key])}</strong><span>${unit}</span></article>`).join('');
}

export function packageVessel(r, mode, prefix = 'package-transport') {
  if (!ready(r)) return unavailable();
  const v = r[mode], p = r.input, positive = v.deltaPressureKpa > 0, zero = v.deltaPressureKpa === 0;
  const arrowId = `${prefix}-transfer-arrow`;
  const text = (x,y,t,extra='') => `<text x="${x}" y="${y}" ${extra}>${esc(t)}</text>`;
  const arrow = zero ? '<path d="M132 151H210" class="pt-transfer-zero"/>'
    : `<path d="M${positive ? '132 151H210' : '210 151H132'}" class="pt-transfer" marker-end="url(#${esc(arrowId)})"/>`;
  return `<svg class="pt-vessel" viewBox="0 0 340 310" role="img" aria-label="外側氧分壓21kPa，內側${n(v.pInsideKpa)}kPa，${zero ? '淨傳輸為零' : positive ? '向內淨傳輸' : '向外淨傳輸'}。示意不是實際尺寸。"><defs><marker id="${esc(arrowId)}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" class="pt-arrow-fill"/></marker></defs><rect x="10" y="63" width="120" height="153" rx="14" class="pt-gas-outside"/><rect x="210" y="63" width="120" height="153" rx="14" class="pt-gas-inside"/><rect x="158" y="62" width="24" height="155" rx="3" class="pt-membrane"/>${text(70,42,'外側氣庫','text-anchor="middle"')}${text(270,42,mode==='finite'?'空容器':'內側氣庫','text-anchor="middle"')}${text(70,100,'O₂ 分壓','text-anchor="middle"')}${text(70,129,'21','text-anchor="middle" class="pt-svg-value"')}${text(70,154,'kPa','text-anchor="middle"')}${text(270,100,'O₂ 分壓','text-anchor="middle"')}${text(270,129,n(v.pInsideKpa),'text-anchor="middle" class="pt-svg-value" data-pt-vessel-pressure')}${text(270,154,'kPa','text-anchor="middle" data-pt-vessel-pressure-unit')}${text(70,189,'持續維持','text-anchor="middle"')}${text(270,189,mode==='finite'?`${n(p.receiverVolumeL)} L · 定容`:'供排氣維持','text-anchor="middle"')}${arrow}${text(170,245,`膜厚 ${n(p.thicknessMicrometre)} μm`,'text-anchor="middle"')}${text(170,274,`有效面積 ${n(p.areaM2)} m²`,'text-anchor="middle"')}${text(170,302,`第 ${n(p.timeDays)} 日 · ${zero?'淨傳輸為零':positive?'正值向內':'負值向外'}`,'text-anchor="middle"')}</svg>`;
}

export function packageCurve(sample, mode, r, prefix = 'package-transport') {
  if (!ready(r) || sample?.status !== 'MODEL_OK' || !sample.points.length) return unavailable();
  const x0=48, y0=32, width=364, height=216, end=sample.endTimeDays;
  const x = t => x0 + (end > 0 ? t/end*width : 0);
  const y = p => y0 + height - p/42*height;
  const points = sample.points.map(point => ({timeDays:point.timeDays, pressureKpa:point[mode].pInsideKpa}));
  const path = points.map((point,i)=>`${i ? 'L' : 'M'}${x(point.timeDays).toFixed(5)} ${y(point.pressureKpa).toFixed(5)}`).join(' ');
  const endpoint = points.at(-1), text = (a,b,t,extra='') => `<text x="${a}" y="${b}" ${extra}>${esc(t)}</text>`;
  const ticks = end > 0 ? [0,end/2,end] : [0];
  const yTicks = [0,21,42].map(value => `<path d="M${x0} ${y(value)}H${x0+width}" class="pt-grid"/>${text(x0-10,y(value)+5,n(value),'text-anchor="end"')}`).join('');
  return `<svg class="pt-curve" viewBox="0 0 440 310" role="img" aria-label="${mode==='finite'?'空容器':'固定分壓'}：0至${n(end)}日，內側氧分壓由${n(points[0].pressureKpa)}到${n(endpoint.pressureKpa)}kPa。橙色虛線是外側21kPa。">${yTicks}<path d="M${x0} ${y0}V${y0+height}H${x0+width}" class="pt-axis"/><path d="M${x0} ${y(21)}H${x0+width}" class="pt-outside-line"/>${end>0 ? `<path d="${path}" class="pt-pressure-line" data-pt-pressure-path/>` : ''}<circle cx="${x(endpoint.timeDays)}" cy="${y(endpoint.pressureKpa)}" r="5" class="pt-endpoint" data-pt-curve-endpoint data-pt-time="${endpoint.timeDays}" data-pt-pressure="${endpoint.pressureKpa}"/>${ticks.map(t=>text(x(t),274,n(t,2),'text-anchor="middle"')).join('')}${text(8,20,'kPa')}${text(x0+width,300,'日','text-anchor="end"')}${text(x0,300,'實線：內側　虛線：外側21kPa')}${end===0?text(x0+35,62,'t=0：尚未累積穿膜量'):''}</svg>`;
}
