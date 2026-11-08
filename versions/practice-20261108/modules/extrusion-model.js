/** Discrete Table 2 observations. No fitted surface, interpolation, or kinetics. */
import {EXTRUSION_ROWS} from '../data/extrusion-evidence.js';

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const EXTRUSION_LAB_ID = 'proc-extrusion-evidence';
export const EXTRUSION_DEFAULT_INPUT = deepFreeze({axis:'temperature',metric:'expansion',variety:'Fortuna',moisture:16.5,temperature:175});
export const EXTRUSION_AXES = deepFreeze([
  {id:'temperature',label:'擠壓溫度（作者所報）',unit:'°C'},
  {id:'moisture',label:'含水百分比（作者所報）',unit:'%'},
  {id:'variety',label:'稻米品種',unit:''},
]);
export const EXTRUSION_METRICS = deepFreeze([
  {id:'expansion',label:'直徑膨脹比 E = D/d',unit:'無因次',sourceKey:'E',valueKey:'diameterExpansionRatio',
    sourceStage:'擠出物經 50°C 風乾至作者所報 6% 含水後量測；該含水量乾／濕基未交代。',
    boundary:'E 是擠出物直徑與模孔直徑之比。原文 axial／radial 命名不一致；採直徑定義，不能讀成長度、面積或體積膨脹比。'},
  {id:'specific-volume',label:'乾基比容 SV',unit:'mL/g 乾物',sourceKey:'SV',valueKey:'specificVolumeMlPerGDryMatter',
    sourceStage:'擠出物經 50°C 風乾至作者所報 6% 含水後量測；該含水量乾／濕基未交代。',
    boundary:'SV 是擠出物體積除以乾物質重量，與直徑膨脹比是不同指標；沒有額外量測，不能換算孔隙率。'},
  {id:'smec',label:'比機械能耗 SMEC',unit:'J/g（進料含水參照）',sourceKey:'SMEC',valueKey:'smecJPerGFeedMoisture',
    sourceStage:'穩態擠壓時由扭矩、轉速與產出質量流率計算；產出質量以進料含水量作參照。',
    boundary:'SMEC 為每單位質量的機械能；不是乾基、電耗、加熱能、乾燥能或全製程總能耗。'},
]);

const varieties = ['Fortuna','Paso 144'];
const fieldKeys = ['axis','metric','variety','moisture','temperature'];
const rowKeys = {temperature:'extrusionTemperatureC',moisture:'moisturePercentReported',variety:'variety'};
const observationBoundary = '只比較 Table 2 已刊載的離散紀錄，三次中心條件分列保留；不內插、擬合或外推最佳條件。逐格 SD／SE／CI 與兩列顯著性未提供，數值差不能當作顯著性、普遍因果或食品安全證據。';
const axisBoundaries = {
  temperature:'溫度為作者所報擠壓溫度；感測器位置、熱區及是否為物料實測溫度未交代。',
  moisture:'含水百分比為作者所報；乾／濕基未交代，不能據此反算加水量。',
  variety:'品種連同其他組成一起改變，不能把差值歸因於單獨的直鏈澱粉含量。Paso 144 直鏈澱粉在摘要為 27%、Methods 為 28%，原文不一致。',
};

function validateInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || ![Object.prototype,null].includes(Object.getPrototypeOf(input)))
    throw new TypeError('請提供含五個必要欄位的參數物件。');
  for (const key of Reflect.ownKeys(input)) {
    if (!fieldKeys.includes(key)) throw new TypeError('含有未知參數欄位。');
    if (!Object.hasOwn(Object.getOwnPropertyDescriptor(input,key),'value')) throw new TypeError('參數必須為直接值。');
  }
  for (const key of fieldKeys) if (!Object.hasOwn(input,key)) throw new TypeError('缺少必要參數：'+key);
  if (!EXTRUSION_AXES.some(axis=>axis.id===input.axis)) throw new RangeError('未知的比較方向。');
  if (!EXTRUSION_METRICS.some(metric=>metric.id===input.metric)) throw new RangeError('未知的量測指標。');
  if (!varieties.includes(input.variety)) throw new RangeError('未知的稻米品種。');
  for (const [key,levels] of [['moisture',[14,16.5,19]],['temperature',[160,175,190]]]) {
    if (typeof input[key] !== 'number' || !Number.isFinite(input[key])) throw new TypeError('數值參數必須為有限數字，不能用文字或空白代替。');
    if (!levels.includes(input[key])) throw new RangeError('只可選擇原研究已量測的條件。');
  }
  return Object.fromEntries(fieldKeys.map(key=>[key,input[key]]));
}

function fixedContext(input) {
  if (input.axis==='temperature') return `固定品種 ${input.variety}、作者所報含水 ${input.moisture}%（乾／濕基未交代）；比較溫度。`;
  if (input.axis==='moisture') return `固定品種 ${input.variety}、作者所報擠壓溫度 ${input.temperature}°C；比較含水百分比。`;
  return `固定作者所報含水 ${input.moisture}%（乾／濕基未交代）與擠壓溫度 ${input.temperature}°C；比較兩個完整品種。`;
}

/** Select observed rows only. The supplied object is complete or rejected. */
export function getExtrusionComparison(input=EXTRUSION_DEFAULT_INPUT) {
  const checked = validateInput(input);
  const axis = EXTRUSION_AXES.find(entry=>entry.id===checked.axis);
  const metric = EXTRUSION_METRICS.find(entry=>entry.id===checked.metric);
  const held = EXTRUSION_AXES.filter(entry=>entry.id!==checked.axis);
  const rows = EXTRUSION_ROWS.filter(row=>held.every(entry=>row[rowKeys[entry.id]]===checked[entry.id]));
  rows.sort((a,b)=>{
    const first=a[rowKeys[axis.id]],second=b[rowKeys[axis.id]];
    const difference=axis.id==='variety' ? varieties.indexOf(first)-varieties.indexOf(second) : first-second;
    return difference || a.tableRow-b.tableRow;
  });
  const points=rows.map(row=>{
    const x=row[rowKeys[axis.id]], sourceText=row.rawSourceStrings[metric.sourceKey];
    const center=row.centerRunOrdinal===null ? '' : ` · 中心條件第 ${row.centerRunOrdinal} 列`;
    return {id:row.id,x,label:`${x}${axis.unit}${center} · Table 2 第 ${row.tableRow} 列`,
      value:row.adoptedEndpoints[metric.valueKey],sourceText,displayValue:sourceText,row};
  });
  return deepFreeze({input:checked,metric,xLabel:axis.label,xUnit:axis.unit,points,
    fixedContext:fixedContext(checked),boundary:metric.boundary+' '+axisBoundaries[axis.id]+' '+observationBoundary});
}

// Decimal arithmetic keeps the original table's precision, including 3.50.
// BigInt is used only internally; public records remain JSON serializable.
function reportedDifference(left,right) {
  const parts=[left,right].map(value=>value.split('.'));
  const places=Math.max(...parts.map(part=>(part[1]||'').length));
  const scaled=parts.map(([whole,fraction=''])=>BigInt(whole+fraction.padEnd(places,'0')));
  const difference=scaled[1]-scaled[0],negative=difference<0n;
  const magnitude=(negative ? -difference : difference).toString().padStart(places+1,'0');
  const decimal=places ? magnitude.slice(0,-places)+'.'+magnitude.slice(-places) : magnitude;
  const text=(negative ? '-' : difference>0n ? '+' : '')+decimal;
  return {value:Number(text),text};
}

/** B minus A; both records must belong to the currently selected slice. */
export function compareTwoRows(input,rowAId,rowBId) {
  const comparison=getExtrusionComparison(input);
  const left=comparison.points.find(point=>point.id===rowAId);
  const right=comparison.points.find(point=>point.id===rowBId);
  if (!left || !right) throw new RangeError('兩筆紀錄都必須屬於目前比較條件。');
  const changedVariables=EXTRUSION_AXES.flatMap(axis=>{
    const from=left.row[rowKeys[axis.id]],to=right.row[rowKeys[axis.id]];
    return from===to ? [] : [{id:axis.id,label:axis.label,from,to}];
  });
  const sameRow=left.id===right.id,sameSettings=changedVariables.length===0;
  const onlyRequestedFactor=changedVariables.length===1 && changedVariables[0].id===comparison.input.axis;
  const delta=reportedDifference(left.sourceText,right.sourceText);
  const reason=sameRow ? 'A、B 是同一筆紀錄，差值為零；不構成兩次觀察。'
    : sameSettings ? 'A、B 是相同列示條件下的不同中心製程列；此差值不能稱為比較軸造成的效應。'
    : comparison.input.axis==='variety' ? '兩列的溫度與含水設定相同，完整品種不同；僅作刊載值的算術比較。'
    : '兩列的其他列示條件相同，只改變所選比較軸；僅作刊載值的算術比較。';
  return deepFreeze({comparable:true,reason,delta:delta.value,deltaText:delta.text,unit:comparison.metric.unit,
    changedVariables,left,right,metric:comparison.metric,requestedAxis:comparison.input.axis,
    onlyRequestedFactor,sameSettings,sameRow,boundary:reason+' '+comparison.boundary});
}
