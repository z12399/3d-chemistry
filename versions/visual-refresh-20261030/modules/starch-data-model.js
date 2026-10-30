/** Published DSC summaries. No thermogram, kinetics, crystallinity or texture prediction. */
export const STARCH_SAMPLE_IDS=Object.freeze(['wheat','normal-maize','potato']);
export const STARCH_THERMAL_IDS=Object.freeze(['onset','peak','end','enthalpy']);
export const STARCH_PHASE_IDS=Object.freeze(['gelatinization','retrogradation']);
const fail=message=>{throw new TypeError(message);};
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
function text(value,label){if(typeof value!=='string'||!value.trim()||value.length>3000)fail(`${label} 必須是有限的非空文字。`);}
function fields(value,keys,label){if(!object(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))fail(`${label} 欄位不完整或包含未知欄位。`);}
function https(value){text(value,'網址');let url;try{url=new URL(value);}catch{fail('資料來源網址無效。');}if(url.protocol!=='https:'||url.username||url.password)fail('資料来源必須使用不含登入資訊的 HTTPS 網址。');}
function freeze(value){if(object(value)||Array.isArray(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function measure(value,label){
  fields(value,['mean','sd','meanText','sdText','letters'],label);
  for(const key of ['mean','sd'])if(!Number.isFinite(value[key])||value[key]<0)fail(`${label} 的均值與 SD 必須是非負有限值。`);
  for(const key of ['mean','sd'])if(typeof value[key+'Text']!=='string'||!/^(0|[1-9]\d*)(\.\d+)?$/.test(value[key+'Text'])||value[key+'Text'].length>24||Number(value[key+'Text'])!==value[key])fail(`${label} 刊載文字與數值不符。`);
  if(typeof value.letters!=='string'||!/^[a-z](,[a-z])*$/.test(value.letters)||new Set(value.letters.split(',')).size!==value.letters.split(',').length)fail(`${label} 統計字母無效。`);
}
export function validateStarchData(data){
  fields(data,['schema','source','methods','samples'],'澱粉量測資料');
  if(data.schema!=='starch-thermal-measurements/v1')fail('未知澱粉資料版本。');
  fields(data.source,['title','authors','year','doi','url','license','licenseUrl','table'],'來源');
  for(const key of ['title','table'])text(data.source[key],key);
  if(data.source.year!==2023||data.source.doi!=='10.3390/foods12122281'||data.source.license!=='CC BY 4.0'||data.source.licenseUrl!=='https://creativecommons.org/licenses/by/4.0/')fail('來源身份或授權不符合本資料集。');
  if(!Array.isArray(data.source.authors)||data.source.authors.length!==3)fail('原始來源應有三位作者。');data.source.authors.forEach(a=>text(a,'作者'));
  https(data.source.url);https(data.source.licenseUrl);
  if(!Array.isArray(data.methods)||data.methods.length<1||data.methods.length>20)fail('缺少研究方法。');data.methods.forEach(m=>text(m,'方法'));
  if(!Array.isArray(data.samples)||data.samples.length!==3)fail('必須保留三個指定樣品。');
  for(let i=0;i<data.samples.length;i++){
    const s=data.samples[i];fields(s,['id','label','amylose',...STARCH_PHASE_IDS],'樣品');
    if(s.id!==STARCH_SAMPLE_IDS[i])fail('樣品身份、順序或完整性不符合資料集。');text(s.label,'樣品名稱');measure(s.amylose,'直鏈澱粉');
    if(s.amylose.mean>100)fail('直鏈澱粉百分比超出範圍。');
    for(const phase of STARCH_PHASE_IDS){fields(s[phase],STARCH_THERMAL_IDS,'DSC 摘要量');for(const metric of STARCH_THERMAL_IDS)measure(s[phase][metric],metric);
      if(s[phase].onset.mean>s[phase].peak.mean||s[phase].peak.mean>s[phase].end.mean||s[phase].enthalpy.mean<=0)fail('熱轉變溫度順序或正焓值不合理。');
    }
  }
  return freeze(data);
}
function checkMetric(id){if(!STARCH_THERMAL_IDS.includes(id))fail('未知 DSC 指標。');}
function sample(data,id){const found=data.samples.find(s=>s.id===id);if(!found)fail('未知澱粉樣品。');return found;}
export function starchThermalReading(data,sampleId,metric='enthalpy'){
  checkMetric(metric);validateStarchData(data);const s=sample(data,sampleId),first=s.gelatinization[metric],reheat=s.retrogradation[metric];
  return {sampleId,label:s.label,first:{...first},reheat:{...reheat},difference:reheat.mean-first.mean,
    // A ratio of published means, not the mean/SD of replicate ratios.
    enthalpyRatio:metric==='enthalpy'?reheat.mean/first.mean*100:null};
}
export function starchThermalScale(data,metric='enthalpy'){
  checkMetric(metric);validateStarchData(data);
  const max=Math.max(...data.samples.flatMap(s=>STARCH_PHASE_IDS.map(p=>s[p][metric].mean+s[p][metric].sd)));
  const step=metric==='enthalpy'?5:10;
  return Math.ceil(max/step)*step;
}
/** Compare letters only within the same original Table 3 row (a column in our
 * transposed display), never across heating phases. */
export function starchSampleComparison(data,phase,metric,fromId,toId){
  checkMetric(metric);if(!STARCH_PHASE_IDS.includes(phase))fail('未知量測階段。');validateStarchData(data);
  const from=sample(data,fromId)[phase][metric],to=sample(data,toId)[phase][metric];
  const sharedLetters=from.letters.split(',').filter(letter=>to.letters.split(',').includes(letter));
  return {difference:to.mean-from.mean,sharedLetters,significance:fromId===toId?'same-sample':sharedLetters.length?'not-declared-different':'different'};
}
