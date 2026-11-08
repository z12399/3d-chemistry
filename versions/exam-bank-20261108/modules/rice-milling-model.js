// Source-selected comparisons only: no interpolation or process prediction.
export const RICE_MILLING_LAB_ID='rice-milling-evidence';
export const RICE_MILLING_SOURCE_IDS=Object.freeze(['rice-source-ntu114-q7','rice-source-kijima-2015','rice-source-fao-grain']);
const copy=value=>structuredClone(value);
const own=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));
const text=value=>typeof value==='string'&&value.trim().length>0;
const expectedRows=[
 ['room-20','time',20,null,'4.2','table'],['room-35','time',35,null,'2.5','table'],['room-50','time',50,null,'1.8','table'],['room-65','time',65,null,'1.9','table'],
 ['warm-30-15','temperature',15,30,'6.3','prose'],['warm-40-15','temperature',15,40,'8.2','prose'],
 ['warm-30-30','temperature',30,30,'3.3','prose'],['warm-40-30','temperature',30,40,'4.7','prose'],
 ['warm-30-45','temperature',45,30,'2.3','prose'],['warm-40-45','temperature',45,40,'3.1','prose'],
 ['market-dry-coarse','market',null,null,'8.9','table'],['market-dry-fine','market',null,null,'11.8','table'],['market-wet-air','market',null,null,'3.5','table']
];
const requiredSourceFields=['id','title','publisher','url','locator','note','localPath','sha256'];

export function validateRiceMillingData(data){
 if(!own(data,['schema','sourcePacketSha256','sources','grain','study','series','rows','limits'])||data.schema!=='rice-milling-evidence/v1')throw new TypeError('Invalid rice milling data identity or fields.');
 if(!/^[a-f0-9]{64}$/.test(data.sourcePacketSha256))throw new TypeError('Missing source packet digest.');
 if(!Array.isArray(data.sources)||data.sources.length!==3||data.sources.some((s,i)=>s.id!==RICE_MILLING_SOURCE_IDS[i]))throw new RangeError('Rice source identities/order changed.');
 for(const s of data.sources){
  if(!requiredSourceFields.every(k=>text(s[k]))||!s.url.startsWith('https://')||!/^[a-f0-9]{64}$/.test(s.sha256))throw new TypeError('Incomplete rice source evidence.');
 }
 if(!own(data.grain,['parts','stages','scope'])||!text(data.grain.scope))throw new TypeError('Missing grain scope.');
 if(!Array.isArray(data.grain.parts)||data.grain.parts.map(p=>p.id).join(',')!=='hull,outer,germ,endosperm')throw new RangeError('Grain parts must distinguish outer layers from starchy endosperm.');
 for(const part of data.grain.parts)if(!['id','label','composition','role','note','sourceId'].every(k=>text(part[k]))||part.sourceId!==RICE_MILLING_SOURCE_IDS[2])throw new TypeError('Incomplete grain part.');
 if(!Array.isArray(data.grain.stages)||data.grain.stages.map(s=>s.id).join(',')!=='paddy,brown,white,flour')throw new RangeError('Milling stages are not interchangeable.');
 for(const stage of data.grain.stages)if(!['id','label','operation','result','scope','sourceId'].every(k=>text(stage[k]))||!RICE_MILLING_SOURCE_IDS.includes(stage.sourceId))throw new TypeError('Incomplete grain process stage.');
 if(!own(data.study,['material','preparation','replicates','assay','particleSummary','scope'])||!Object.values(data.study).every(text))throw new TypeError('Incomplete milling study context.');
 if(!Array.isArray(data.series)||data.series.map(s=>s.id).join(',')!=='time,temperature,market')throw new RangeError('Only three reviewed source comparisons are supported.');
 for(const s of data.series)if(!['id','label','condition','comparisonScope','sourceId','locator'].every(k=>text(s[k]))||s.sourceId!==RICE_MILLING_SOURCE_IDS[1])throw new TypeError('Incomplete series context.');
 if(!Array.isArray(data.rows)||data.rows.length!==expectedRows.length)throw new RangeError('Missing or extra source rows, including untranscribed figure bars.');
 for(let i=0;i<expectedRows.length;i++){
  const [id,seriesId,minutes,temperature,value,basis]=expectedRows[i],r=data.rows[i];
  if(!own(r,['id','seriesId','label','soakMinutes','temperatureC','damage','sourceId','locator','numericBasis','note']))throw new TypeError('Unexpected source row fields.');
  if(r.id!==id||r.seriesId!==seriesId||r.soakMinutes!==minutes||r.temperatureC!==temperature||r.numericBasis!==basis||r.sourceId!==RICE_MILLING_SOURCE_IDS[1])throw new RangeError('Source condition changed.');
  if(!own(r.damage,['value','text','unit'])||r.damage.value!==Number(value)||r.damage.text!==value||r.damage.unit!=='%')throw new RangeError('Published damage value, precision or unit changed.');
  if(![r.label,r.locator,r.note].every(text))throw new TypeError('Missing row provenance or scope.');
 }
 if(!Array.isArray(data.limits)||data.limits.length<5||!data.limits.every(text))throw new TypeError('Rice milling limits are required.');
 return data;
}

export function riceMillingRows(data,seriesId){
 if(!data.series.some(s=>s.id===seriesId))throw new RangeError('Unknown source comparison.');
 return copy(data.rows.filter(r=>r.seriesId===seriesId));
}

export function compareRiceMilling(data,parameters){
 validateRiceMillingData(data);
 if(!own(parameters,['series','from','to']))throw new TypeError('Select named source rows; no numerical extrapolation parameters.');
 const series=data.series.find(s=>s.id===parameters.series);
 if(!series)throw new RangeError('Unknown comparison series.');
 const from=data.rows.find(r=>r.id===parameters.from),to=data.rows.find(r=>r.id===parameters.to);
 if(!from||!to||from.seriesId!==series.id||to.seriesId!==series.id)throw new RangeError('Rows from different preparation contexts cannot be paired here.');
 if(series.id==='temperature'&&(from.soakMinutes!==to.soakMinutes||from.temperatureC!==30||to.temperatureC!==40))throw new RangeError('Temperature comparison holds reported soaking time fixed, 30 to 40 C.');
 // Original precision is one decimal place. Difference is percentage points,
 // not a percentage of bonds broken, a p value, or a fitted damage trajectory.
 const difference=Math.round((to.damage.value-from.damage.value)*10)/10;
 return copy({series,from,to,difference:{value:difference,unit:'百分點'},relation:difference===0?'equal':difference>0?'higher':'lower',
  inference:series.id==='market'?'市售樣品的觀察差；原料與製備條件未完全配對，不能單獨歸因磨法。':'指定製備條件的報告均值差；未提供 SD 或顯著性，不推成普遍最佳條件。',
  unitMeaning:'沿用原文損傷率（%）；差值為百分點，不另假設乾濕基、分母或已斷裂糖苷鍵比例。',
  sourceRefs:[{sourceId:series.sourceId,locator:series.locator},...Array.from(new Set([from.locator,to.locator]),locator=>({sourceId:series.sourceId,locator}))]
 });
}

export function riceGrainSelection(data,stageId,partId){
 validateRiceMillingData(data);
 const stage=data.grain.stages.find(s=>s.id===stageId),part=data.grain.parts.find(p=>p.id===partId);
 if(!stage||!part)throw new RangeError('Unknown grain stage or part.');
 const retained=stageId==='paddy'||stageId==='brown'&&partId!=='hull'||['white','flour'].includes(stageId)&&partId==='endosperm';
 return copy({stage,part,predominantlyRetained:retained,scope:'是否主要保留的製程示意；碾白程度與實際殘留量未量化，米糠餾分可含胚與胚乳細屑。'});
}
