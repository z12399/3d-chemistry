import {escapeHTML as esc} from './storage.js';
export const evaporationNumber = (v, digits = 4) => typeof v === 'number' && Number.isFinite(v) ? v !== 0 && Math.abs(v) < 10 ** -digits ? v.toExponential(3) : Number(v.toFixed(digits)).toLocaleString('en-US', {maximumFractionDigits:digits}) : '—';
const n = evaporationNumber;
export const BALANCE_TEXT = Object.freeze({BALANCE_OK:'收支成立', UNKNOWN_PROPERTIES:'物性資料無法核對', INVALID_CONCENTRATION_ORDER:'目標較稀，需稀釋', NO_EVAPORATION_TARGET:'沒有濃縮目標', INFEASIBLE_EVAPORATION_SPLIT:'出現不符合此流程的蒸發分配', DEGENERATE_EVAPORATION_SPLIT:'其中一效沒有正蒸發量', INFEASIBLE_EXTERNAL_HEAT:'此條件需要移熱，非正蒸汽供熱', DEGENERATE_EXTERNAL_HEAT:'外供熱為零，經濟性未定義', NUMERICAL_FAILURE:'收支殘差未通過核對'});
export const EQUIPMENT_TEXT = Object.freeze({EQUIPMENT_SUFFICIENT:'指定面積足夠', AREA_INSUFFICIENT:'指定面積不足', NONPOSITIVE_DRIVING_TEMPERATURE:'無正傳熱溫差', NOT_EVALUATED:'不計算設備需求'});
export function evaporationBoundary(r, kind) {
  const c = r[kind];
  if (c.balanceStatus !== 'BALANCE_OK') return `${BALANCE_TEXT[c.balanceStatus] || '此模型無可用解'}。保留原始代數診斷；不提供通常的蒸汽經濟性或設備解。`;
  if (c.equipmentStatus === 'NONPOSITIVE_DRIVING_TEMPERATURE') return '收支可形式上閉合，但有一效的傳熱溫差為零；有限面積無法供應正熱負荷。這不是可運行的節能案例。';
  if (c.equipmentStatus === 'AREA_INSUFFICIENT') return '以下是指定流量與溫度所需的理論收支；可供面積不足。本模式沒有求出較低產能或新的終濃度。';
  return '收支成立，指定面積足夠；僅在本課假想溶液與固定條件內。未模擬沸點上升、品質或安全。';
}
export function evaporationReadings(r, kind) {
  const c = r[kind], usable = c.balanceStatus === 'BALANCE_OK';
  return [['外供新鮮蒸汽 S', c.summary.steamFlowKgS, 'kg/s'], ['總蒸發水 E', usable ? c.summary.evaporatedFlowKgS : c.balanceStatus === 'NO_EVAPORATION_TARGET' ? 0 : null, 'kg/s'], ['蒸汽經濟性 E/S', c.summary.steamEconomy, 'kg 水 / kg 外供蒸汽']].map(([label,v,unit]) => `<article><p>${label}</p><strong>${n(v)}</strong><span>${unit}</span></article>`).join('');
}
export function evaporationFlow(r, kind) {
  const c = r[kind], d = kind === 'double';
  if (c.balanceStatus !== 'BALANCE_OK') return `<div class="eb-empty"><h3>${esc(BALANCE_TEXT[c.balanceStatus] || '沒有可用流程')}</h3><p>下方完整收支保留原始代數值；此處不把它畫成正常操作。</p></div>`;
  const raw = c.raw, p = r.input, common = r.common;
  const v1 = raw.vapor1FlowKgS, v2 = raw.vapor2FlowKgS, s = raw.steamFlowKgS;
  const text = (x,y,t,extra='') => `<text x="${x}" y="${y}" ${extra}>${esc(t)}</text>`;
  const path = (d, cls) => `<path d="${d}" class="eb-${cls}" marker-end="url(#eb-${cls}-arrow)"/>`;
  const vessel = (x,label,temp,pressure) => `<rect x="${x}" y="100" width="165" height="154" rx="18" class="eb-vessel"/><path d="M${x+38} 101V253" class="eb-divider"/>${text(x+100,135,label,'text-anchor="middle" class="eb-bold"')}${text(x+100,164,`${n(temp)} °C`,'text-anchor="middle"')}${text(x+100,189,`${n(pressure*1000,3)} kPa`,'text-anchor="middle"')}${text(x+18,184,'熱','text-anchor="middle"')}`;
  const markers = ['liquid','steam'].map(cls=>`<marker id="eb-${cls}-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" class="eb-fill-${cls}"/></marker>`).join('');
  let body;
  if (d) {
    body = vessel(180,'第一效',p.intermediateTemperatureC,common.water.first.pressureMPa) + vessel(515,'第二效',50,common.water.final.pressureMPa)
      + path('M8 205H260','liquid') + text(12,174,`進料 F ${n(p.feedFlowKgS)} kg/s`) + text(12,196,`${n(p.feedTemperatureC)} °C · ${n(p.feedSolidFraction*100)}%`)
      + path('M8 115H192','steam') + text(10,84,`外供 S ${n(s)} kg/s`) + text(10,106,'120 °C 蒸汽')
      + path('M282 100V44H530V118','steam') + text(320,33,`V1 ${n(v1)} kg/s · 再用蒸氣`)
      + path('M345 226H595','liquid') + text(369,190,`液流 L1 ${n(raw.intermediateLiquidFlowKgS)}`) + text(369,213,`kg/s · ${n(raw.intermediateSolidFraction*100,2)}%`)
      + path('M620 100V67H832','steam') + text(651,42,`V2 ${n(v2)} kg/s`) + text(683,64,'末效新蒸出水')
      + path('M680 226H832','liquid') + text(698,188,`產品 P ${n(common.productFlowKgS)}`) + text(698,210,`kg/s · ${n(p.productSolidFraction*100)}%`)
      + path('M198 254V296H328','liquid') + text(178,324,`S 凝結水 ${n(s)} kg/s · 120 °C`)
      + path('M534 254V296H671','liquid') + text(502,324,`V1 凝結水 ${n(v1)} kg/s · ${n(p.intermediateTemperatureC)} °C`);
  } else {
    body = vessel(365,'單效',50,common.water.final.pressureMPa)
      + path('M36 205H445','liquid') + text(40,168,`進料 F ${n(p.feedFlowKgS)} kg/s`) + text(40,192,`${n(p.feedTemperatureC)} °C · ${n(p.feedSolidFraction*100)}%`)
      + path('M36 115H378','steam') + text(40,84,`外供 S ${n(s)} kg/s · 120 °C`)
      + path('M465 100V48H832','steam') + text(535,36,`蒸發水 E ${n(common.totalEvaporationKgS)} kg/s · 50 °C`)
      + path('M530 226H832','liquid') + text(585,184,`產品 P ${n(common.productFlowKgS)} kg/s`) + text(585,208,`${n(p.productSolidFraction*100)}% · 50 °C`)
      + path('M384 254V294H575','liquid') + text(337,325,`S 凝結水 ${n(s)} kg/s · 120 °C`);
  }
  return `<svg class="eb-flow" viewBox="0 0 840 345" role="img" aria-label="${d?'雙效順流：V1在第二效凝結供熱，外供只有S':'單效：外供蒸汽凝結，進料分為產品與蒸發水'}"><defs>${markers}</defs>${body}</svg>`;
}
export function evaporationEquipment(r,kind) {
  const c=r[kind];
  if(c.balanceStatus!=='BALANCE_OK') return '<p>收支不成立或退化，所需面積不計算。</p>';
  return c.equipment.map(e=>{
    const maximum=Math.max(e.requiredAreaM2??0,e.availableAreaM2,1), width=v=>Math.max(0,100*v/maximum);
    const required=e.requiredAreaM2===null?'<p class="eb-unavailable">所需面積不存在有限值，無法畫出定量長條。</p>':`<div class="eb-bar-row" data-eb-required-bar="${e.index}"><span>所需</span><div><i style="width:${width(e.requiredAreaM2)}%"></i></div><span>${n(e.requiredAreaM2,2)} m²</span></div>`;
    return `<article data-eb-equipment="${e.index}"><h3>${kind==='single'?'單效':`第 ${e.index} 效`} · ΔT = ${n(e.deltaTemperatureK)} K</h3><p class="eb-area-result">${e.requiredAreaM2===null?'有限面積無法供熱':`所需 ${n(e.requiredAreaM2,2)} m²`}</p>${required}<div class="eb-bar-row"><span>可供</span><div><i class="eb-available" style="width:${width(e.availableAreaM2)}%"></i></div><span>${n(e.availableAreaM2,2)} m²</span></div><p>${esc(EQUIPMENT_TEXT[e.status]||e.status)}${e.areaShortfallM2>0?` · 尚差 ${n(e.areaShortfallM2,2)} m²`:''}</p></article>`;
  }).join('');
}
