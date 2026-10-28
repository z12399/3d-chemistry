/** Published Table 1 summaries, not a frying-process or safety model.
 * Means, SD and display precision are separate from derived mean ratios.
 * Letters only compare cycles within the SAME oil and metric.
 */
export const FRYING_METRIC_IDS=Object.freeze(['induction','acid','pav','tpc']);
export const FRYING_OIL_IDS=Object.freeze(['soybean','canola']);
export const FRYING_CYCLES=Object.freeze([0,5,10,15,20]);
export const FRYING_UNITS=Object.freeze({induction:'h',acid:'mg KOH/g',pav:'無因次',tpc:'%'});
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const fail=message=>{throw new TypeError(message);};
function fields(value,keys,label){
  if(!isObject(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.prototype.hasOwnProperty.call(value,key)))fail(`${label} 的欄位不完整或包含未知欄位。`);
}
function text(value,label,max=1000){if(typeof value!=='string'||!value.trim()||value.length>max)fail(`${label} 必須是非空且長度有限的文字。`);}
function https(value,label){text(value,label);let url;try{url=new URL(value);}catch{fail(`${label} 不是有效網址。`);}if(url.protocol!=='https:'||url.username||url.password)fail(`${label} 必須是沒有登入資訊的 HTTPS 網址。`);}
function finite(value,label){if(typeof value!=='number'||!Number.isFinite(value))fail(`${label} 必須是有限數值。`);return value;}
function metricId(id){if(!FRYING_METRIC_IDS.includes(id))fail('未知的油品質指標。');return id;}
function cycle(value){if(!FRYING_CYCLES.includes(value))fail('只提供 0、5、10、15、20 次的實測取樣點。');return value;}
function deepFreeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(deepFreeze);Object.freeze(value);}return value;}
function printed(value,numeric,decimals,label){
  if(typeof value!=='string'||value.length>32||!new RegExp(`^(?:0|[1-9]\\d*)\\.\\d{${decimals}}$`).test(value)||Number(value)!==numeric)fail(`${label} 的刊載字串精度與數值不一致。`);
}

/** Validate the complete two-oil/five-cycle/four-metric table, then freeze and
 * return the SAME object. No values, order, text, units or letters are changed.
 * Unknown fields, gaps and duplicates are rejected instead of repaired.
 */
export function validateFryingData(data){
  fields(data,['schema','source','methods','metrics','oils'],'資料集');
  if(data.schema!=='frying-measurements/v1')fail('不支援這個油炸量測資料版本。');
  const s=data.source;
  fields(s,['title','authors','year','doi','url','pdfUrl','license','licenseUrl','table'],'原始來源');
  text(s.title,'論文標題');
  if(!Array.isArray(s.authors)||s.authors.length!==4)fail('原始來源必須列出四位作者。');
  for(const author of s.authors)text(author,'作者',100);
  if(new Set(s.authors).size!==4||s.year!==2021||s.doi!=='10.3390/foods10050972'||s.table!=='Table 1')fail('原始來源的作者、年份、DOI 或表號不符合所選研究。');
  for(const name of ['url','pdfUrl','licenseUrl'])https(s[name],name);
  if(s.license!=='CC BY 4.0'||s.licenseUrl!=='https://creativecommons.org/licenses/by/4.0/')fail('來源授權必須標示 CC BY 4.0 與其正式授權網址。');
  if(!Array.isArray(data.methods)||data.methods.length<1||data.methods.length>12)fail('資料必須有精簡的量測方法與研究界線。');
  for(const method of data.methods)text(method,'方法說明');
  if(!Array.isArray(data.metrics)||data.metrics.length!==FRYING_METRIC_IDS.length)fail('資料必須完整包含四個指定指標。');
  for(let i=0;i<data.metrics.length;i++){
    const m=data.metrics[i];fields(m,['id','label','unit','definition','method','boundary'],'指標');
    if(m.id!==FRYING_METRIC_IDS[i]||m.unit!==FRYING_UNITS[m.id])fail('指標識別碼、排列或單位不符合原表。');
    for(const key of ['label','definition','method','boundary'])text(m[key],`指標 ${key}`);
  }
  if(!Array.isArray(data.oils)||data.oils.length!==FRYING_OIL_IDS.length)fail('資料必須完整包含兩種指定油樣。');
  for(let i=0;i<data.oils.length;i++){
    const oil=data.oils[i];fields(oil,['id','label','points'],'油樣');
    if(oil.id!==FRYING_OIL_IDS[i])fail('油樣識別碼或排列不符合原表。');text(oil.label,'油樣名稱');
    if(!Array.isArray(oil.points)||oil.points.length!==FRYING_CYCLES.length)fail('每種油樣必須有五個指定取樣點。');
    for(let j=0;j<oil.points.length;j++){
      const point=oil.points[j];fields(point,['cycle',...FRYING_METRIC_IDS],'取樣點');
      if(point.cycle!==FRYING_CYCLES[j])fail('取樣次數、排列或完整性不符合 0、5、10、15、20。');
      for(const id of FRYING_METRIC_IDS){
        const value=point[id];fields(value,['mean','sd','meanText','sdText','letters'],'量測值');
        finite(value.mean,'均值');finite(value.sd,'SD');
        if(value.mean<0||value.sd<0)fail('均值與 SD 不能是負值。');
        if(id==='tpc'&&(value.mean>100||value.sd>100))fail('TPC 的均值與 SD 使用百分比尺度，不能超過 100。');
        const decimals=id==='pav'?1:id==='tpc'&&oil.id==='soybean'&&point.cycle!==0?1:2;
        printed(value.meanText,value.mean,decimals,'均值');printed(value.sdText,value.sd,2,'SD');
        if(typeof value.letters!=='string'||!/^[a-e]{1,5}$/.test(value.letters)||[...new Set(value.letters)].sort().join('')!==value.letters)fail('顯著性字母必須是原表 a–e 的不重複、排序小寫字母。');
        finite(value.mean-value.sd,'均值減 SD');finite(value.mean+value.sd,'均值加 SD');
      }
    }
  }
  return deepFreeze(data);
}

function pointAt(oil,id,index){
  const point=oil.points.find(point=>point.cycle===index);
  return {cycle:point.cycle,...point[id]};
}
function ratioOf(numerator,denominator){
  if(denominator===0)fail('基準均值為零，不能計算均值比或百分比變化。');
  return finite(numerator/denominator,'均值比');
}

/** Each returned point is a new object. sd/meanText/sdText always retain their
 * ORIGINAL observed units/precision, including in ratio mode. The transformed
 * display value has no inferred ratio SD, so lower/upper are null in that mode.
 * Absolute lower/upper are mean +/- SD, not confidence intervals or clipped
 * physical limits. No interpolation or unobserved cycles are generated.
 */
export function fryingSeries(data,id,mode='absolute'){
  metricId(id);if(mode!=='absolute'&&mode!=='ratio')fail('只支援 absolute 原值或 ratio 起始比模式。');
  validateFryingData(data);
  return data.oils.map(oil=>{
    const baseline=oil.points[0][id].mean;
    if(mode==='ratio'&&baseline===0)fail('起始均值為零，不能計算起始比。');
    const points=oil.points.map(point=>{
      const original=pointAt(oil,id,point.cycle);
      return {...original,value:mode==='absolute'?original.mean:ratioOf(original.mean,baseline),
        lower:mode==='absolute'?original.mean-original.sd:null,upper:mode==='absolute'?original.mean+original.sd:null};
    });
    return {oilId:oil.id,label:oil.label,points};
  });
}

/** Compare two cycles of exactly one oil/metric. Shared letters mean that the
 * table did not declare this pair different, NOT equivalence or equal means.
 * Difference uses the original metric units (TPC: percentage POINTS), whereas
 * percentChange is relative to the selected from-cycle mean.
 */
export function fryingComparison(data,id,oilId,fromCycle,toCycle){
  metricId(id);if(!FRYING_OIL_IDS.includes(oilId))fail('比較必須指定同一個已知油樣，不能跨油種解讀字母。');
  cycle(fromCycle);cycle(toCycle);validateFryingData(data);
  const oil=data.oils.find(oil=>oil.id===oilId),from=pointAt(oil,id,fromCycle),to=pointAt(oil,id,toCycle);
  const difference=finite(to.mean-from.mean,'均值差'),ratio=ratioOf(to.mean,from.mean),percentChange=finite(difference/from.mean*100,'百分比變化');
  const sharedLetters=[...from.letters].filter(letter=>to.letters.includes(letter)).join('');
  return {from,to,difference,ratio,percentChange,sharedLetters,
    significance:fromCycle===toCycle?'same-point':sharedLetters?'not-declared':'different'};
}
