import {escapeHTML as esc} from './storage.js';

export const osmoticNumber = (value, digits = 4) => typeof value === 'number' && Number.isFinite(value)
  ? value !== 0 && Math.abs(value) < 10 ** -digits
    ? value.toExponential(3)
    : Number(value.toFixed(digits)).toLocaleString('en-US', {maximumFractionDigits:digits})
  : '—';
const n = osmoticNumber;
const ready = state => state?.status === 'IDEAL_LOCAL_MODEL';
const unavailable = () => '<p class="od-empty">來源未通過核對，數值與圖線保留未知。</p>';
export const osmoticDirection = state => !ready(state) ? '水流方向未知'
  : state.result.direction === 'reverse-osmosis' ? state.input.bulkMmolL===0?'B → P・壓差驅動':'B → P・逆滲透'
    : state.result.direction === 'osmosis' ? 'P → B・滲透' : '淨水通量為零';

export function osmoticReadings(state) {
  const result = ready(state) ? state.result : {};
  const scalar = (key,label,unit,main=false) => `<div class="${main?'od-current':'od-secondary-reading'}"><dt>${label}</dt><dd><strong data-od-reading="${key}"${ready(state)?` data-od-raw="${result[key]}"`:''}>${n(result[key])}</strong><span>${unit}</span></dd></div>`;
  return `<dl>${scalar('waterFluxLmh','水通量 J','L / (m²·h)',true)}</dl><p class="od-direction" data-od-direction="${ready(state)?state.result.direction:'unknown'}">${esc(osmoticDirection(state))}</p><dl class="od-secondary-readings">${scalar('membraneOsmoticBar','膜面滲透壓 πm','bar')}${scalar('effectivePressureBar','有效驅動壓差 ΔP − πm','bar')}</dl>`;
}

export function osmoticFlow(state, prefix = 'osmotic-driving') {
  if (!ready(state)) return unavailable();
  const r=state.result, p=state.input, forward=r.direction==='reverse-osmosis', zero=r.direction==='zero';
  const arrowId=`${prefix}-water-arrow`;
  const arrow=zero
    ? '<path d="M7 45H93" class="od-zero-line" data-od-water-arrow="zero"/>'
    : `<path d="M${forward?'7 45H88':'93 45H12'}" class="od-water-line" marker-end="url(#${esc(arrowId)})" data-od-water-arrow="${forward?'B-to-P':'P-to-B'}"/>`;
  const direction=forward?p.bulkMmolL===0?'水由B純水側到P純水側':'水由B溶液側到P純水側':zero?'淨水通量為零':'水由P純水側到B溶液側';
  return `<div class="od-local-patch" data-od-local-patch role="group" aria-label="局部膜片，${direction}；兩側主體由外部維持。">
    <section class="od-side od-bulk-side"><h4>B ${p.bulkMmolL===0?'純水':'溶液'}側</h4><p>主體 Cb <strong data-od-bulk-concentration>${n(p.bulkMmolL)}</strong><span class="od-unit">mmol/L</span></p><p>膜面 Cm <strong data-od-membrane-concentration data-od-raw="${r.membraneMolL*1000}">${n(r.membraneMolL*1000)}</strong><span class="od-unit">mmol/L</span></p><p class="od-caption">PB = PP + ${n(p.pressureBar)} bar</p></section>
    <div class="od-film-gap"><span>完全截留膜</span><svg viewBox="0 0 100 100" class="od-water-arrow" role="img" aria-label="${direction}"><defs><marker id="${esc(arrowId)}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" class="od-arrow-fill"/></marker></defs><rect x="40" y="5" width="20" height="82" rx="3" class="od-membrane-symbol"/>${arrow}</svg><span class="od-flow-horizontal" aria-hidden="true">${zero?'J = 0':forward?'B → P':'P → B'}</span><span class="od-flow-vertical" aria-hidden="true" data-od-vertical-direction>${zero?'J = 0':forward?'B ↓ P':'P ↑ B'}</span></div>
    <section class="od-side od-pure-side"><h4>P 純水側</h4><p>Cp <strong>0</strong><span class="od-unit">mmol/L</span></p><p>πP <strong>0</strong><span class="od-unit">bar</span></p><p class="od-caption">PP 為壓力參考側</p></section>
  </div><p class="od-caption od-local-boundary">局部 ΔP = PB − PP；兩側主體由外部持續維持。</p>`;
}

export function osmoticProfile(state) {
  if (!ready(state) || !state.profile?.length) return unavailable();
  const width=340, height=150;
  const max=Math.max(state.input.bulkMmolL,...state.profile.map(p=>p.concentrationMmolL));
  const maxLabel=n(max,2);
  const ceiling=max>0?max*1.18:1;
  const x=f=>f*width,y=c=>height-c/ceiling*height;
  const path=state.profile.map((p,i)=>`${i?'L':'M'}${x(p.fraction).toFixed(4)} ${y(p.concentrationMmolL).toFixed(4)}`).join(' ');
  const factor=state.result.polarizationFactor;
  const caption=state.input.bulkMmolL===0?'純水邊界：Cb = Cm = 0；Cm/Cb 未定義。'
    :state.input.boundaryMode==='well-mixed'?'充分混合：Cm = Cb，沒有膜面濃度差。'
      :state.result.direction==='osmosis'?'反向水流：膜面濃度低於主體。此為局部膜模型的延伸。'
        :state.result.direction==='zero'?'淨通量為零：膜面與主體濃度相同。':'正向水流：膜面濃度高於主體。';
  return `<figure class="od-profile" style="--od-profile-gutter:max(64px, calc(${maxLabel.length+1}ch + 10px))"><figcaption>主體到膜面的濃度</figcaption><p class="od-axis-label">濃度（mmol/L）</p><div class="od-chart-body od-profile-body"><span class="od-y-tick" style="bottom:0" data-od-profile-zero>0</span>${max>0?`<span class="od-y-tick" style="bottom:${max/ceiling*100}%">${maxLabel}</span>`:''}<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="標準化位置0為主體，1為膜面；不是實際膜厚。${esc(caption)}"><path d="M0 0V${height}H${width}" class="od-axis"/><path d="M0 ${y(state.input.bulkMmolL)}H${width}" class="od-reference-line"/><path d="${path}" class="od-film-line" data-od-profile-path/></svg></div><div class="od-x-labels"><span>0 主體</span><span>1 膜面</span></div><p class="od-caption" data-od-profile-caption>${esc(caption)}</p><p class="od-caption">位置是正規化距離；虛線為 Cb。<span data-od-factor${factor===null?'':` data-od-raw="${factor}"`}>Cm/Cb：${factor===null?'未定義':n(factor)}</span></p></figure>`;
}

export function osmoticPressure(state) {
  if (!ready(state) || !state.pressureCurve?.length) return unavailable();
  const width=418,height=225;
  const x=p=>p/3*width,y=j=>(6.5-j)/9.5*height;
  const path=key=>state.pressureCurve.map((p,i)=>`${i?'L':'M'}${x(p.pressureBar).toFixed(4)} ${y(p[key]).toFixed(4)}`).join(' ');
  const pi=state.result.bulkOsmoticBar;
  return `<figure class="od-pressure-chart"><figcaption>壓差改變時，水流如何改變？</figcaption><div class="od-chart-legend"><span class="od-film-key">固定邊界層</span><span class="od-reference-key">充分混合</span></div><p class="od-axis-label">水通量 J（LMH）</p><div class="od-chart-body od-pressure-body">${[-3,0,3,6].map(j=>`<span class="od-y-tick" style="bottom:${(j+3)/9.5*100}%">${j}</span>`).join('')}<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="不同壓差的獨立穩態情境。實線為固定膜邊界層，虛線為充分混合；兩線在${n(pi)}bar零通量。">${[-3,0,3,6].map(j=>`<path d="M0 ${y(j)}H${width}" class="${j===0?'od-zero-axis':'od-grid'}"/>`).join('')}<path d="M0 0V${height}H${width}" class="od-axis"/><path d="M${x(pi)} 0V${height}" class="od-stall-line" data-od-stall-line data-od-raw="${pi}"/><path d="${path('wellMixedFluxLmh')}" class="od-reference-line" data-od-pressure-reference/><path d="${path('filmFluxLmh')}" class="od-film-line" data-od-pressure-film/><circle cx="${x(state.input.pressureBar)}" cy="${y(state.result.waterFluxLmh)}" r="5.5" class="od-current-point" data-od-pressure-point data-od-mode="${state.input.boundaryMode}" data-od-pressure="${state.input.pressureBar}" data-od-flux="${state.result.waterFluxLmh}"/></svg></div><div class="od-x-labels">${[0,1,2,3].map(p=>`<span>${p}</span>`).join('')}</div><p class="od-x-axis-title">局部 ΔP（bar）</p><p data-od-stall-label>零通量壓差：πB = ${n(pi)} bar</p><p class="od-caption">每個點是另一組外部維持的穩態條件；橫軸不是時間。本模型沒有有限壓力下的硬性通量平台。</p></figure>`;
}

export function osmoticPlant(data, selectedId) {
  if (!data?.plantComponents?.length) return unavailable();
  return `<div class="od-plant-map" role="group" aria-label="乳清RO設備思考，五個構件為質性功能關聯，不是管路配置。">${data.plantComponents.map(item=>`<button type="button" class="od-plant-item od-plant-${esc(item.id)}" data-od-plant="${esc(item.id)}" aria-pressed="${item.id===selectedId}">${esc(item.label)}</button>`).join('')}</div><p class="od-caption">連線代表功能關聯，不是管路配置或設備尺寸。</p>`;
}
