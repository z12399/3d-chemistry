/** Steady positive-rate flow models. No time dependence, structure, pipe flow or lethality. */
export const RHEOLOGY_LAB_ID = 'rheology-flow-evidence';
export const RHEOLOGY_SYNTHETIC = Object.freeze([
  Object.freeze({id:'teaching-a',label:'A · 牛頓教學材料',K:0.2,n:1,tau0:0,temperatureC:20,shearRange:Object.freeze([1,400]),parameterOrigin:'synthetic'}),
  Object.freeze({id:'teaching-b',label:'B · 剪切變稀教學材料',K:2,n:0.5,tau0:0,temperatureC:20,shearRange:Object.freeze([1,400]),parameterOrigin:'synthetic'}),
]);
export const RHEOLOGY_SOURCES = Object.freeze([
  {title:'Tetra Pak · Rheology',url:'https://dairyprocessinghandbook.tetrapak.com/chapter/rheology',note:'剪切率、應力、表觀黏度與模型概念；沒有採用典型數值表。'},
  {title:'臺大 114-2 食品加工工程課綱',url:'https://nol.ntu.edu.tw/nol/coursesearch/print_table.php?class=&course_id=641+U3270&dpt_code=6410&lang=CH&semester=114-2&ser_no=27187',note:'流體流動與單元操作的學習範圍，非考試權重。'},
].map(Object.freeze));
function finite(value,name){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(name+' must be finite');return value;}
export function validateFlowRow(row){
  if(!row||typeof row!=='object'||Array.isArray(row))throw new TypeError('Flow row required');
  for(const key of ['K','n','tau0','temperatureC'])finite(row[key],key);
  if(row.K<=0||row.n<=0||row.tau0<0)throw new RangeError('Positive K/n and nonnegative yield stress required');
  if(!Array.isArray(row.shearRange)||row.shearRange.length!==2)throw new TypeError('Positive shear domain required');
  const [lo,hi]=row.shearRange;finite(lo,'range minimum');finite(hi,'range maximum');
  if(lo<=0||hi<=lo)throw new RangeError('Flow domain must be increasing and positive');
  if(!['synthetic','published-fit'].includes(row.parameterOrigin))throw new TypeError('Evidence identity required');
  if(typeof row.id!=='string'||!row.id||typeof row.label!=='string'||!row.label)throw new TypeError('Row identity required');
  return row;
}
export function evaluateFlow(row,shearRate){
  validateFlowRow(row);finite(shearRate,'shear rate');
  if(shearRate<row.shearRange[0]||shearRate>row.shearRange[1])throw new RangeError('No extrapolation outside stated shear range');
  const rateStress=row.K*shearRate**row.n,stress=row.tau0+rateStress,viscosity=stress/shearRate;
  if(![rateStress,stress,viscosity].every(Number.isFinite))throw new RangeError('Model overflow');
  return {id:row.id,shearRate,stress,viscosity,yieldTerm:row.tau0,rateTerm:rateStress,temperatureC:row.temperatureC,parameterOrigin:row.parameterOrigin};
}
export function commonShearRange(rows){
  if(!Array.isArray(rows)||!rows.length)throw new TypeError('Rows required');
  rows.forEach(validateFlowRow);
  const range=[Math.max(...rows.map(r=>r.shearRange[0])),Math.min(...rows.map(r=>r.shearRange[1]))];
  if(range[1]<=range[0])throw new RangeError('No shared shear-rate interval');
  return range;
}
export function sampleFlow(row,count=65,range=row.shearRange){
  validateFlowRow(row);
  if(!Number.isInteger(count)||count<2||count>500)throw new RangeError('Sample count must be 2–500');
  if(!Array.isArray(range)||range.length!==2)throw new TypeError('Sampling range required');
  const [lo,hi]=range;finite(lo,'minimum');finite(hi,'maximum');
  if(lo<row.shearRange[0]||hi>row.shearRange[1]||hi<=lo)throw new RangeError('Invalid sampling domain');
  return Array.from({length:count},(_,i)=>evaluateFlow(row,i===0?lo:i===count-1?hi:lo*(hi/lo)**(i/(count-1))));
}
export function validateRheologyData(data){
  if(data?.version!==1||data.id!=='rheology-published'||!Array.isArray(data.rows)||data.rows.length<2)throw new TypeError('Unknown published data schema');
  if(typeof data.source?.url!=='string'||!/^https:\/\//.test(data.source.url)||typeof data.source?.table!=='string')throw new TypeError('Traceable source/table required');
  if(typeof data.conditions?.protocol!=='string'||typeof data.conditions?.variabilityNote!=='string')throw new TypeError('Measurement and uncertainty identity required');
  finite(data.conditions.temperatureC,'measurement temperature');
  const domain=data.conditions.shearRange;
  if(!Array.isArray(domain)||domain.length!==2||!domain.every(x=>typeof x==='number'&&Number.isFinite(x))||domain[0]<=0||domain[1]<=domain[0])throw new RangeError('Measurement range invalid');
  const ids=new Set();
  data.rows.forEach(row=>{
    validateFlowRow(row);
    if(ids.has(row.id)||row.parameterOrigin!=='published-fit')throw new TypeError('Published row identity invalid');ids.add(row.id);
    if(row.temperatureC!==data.conditions.temperatureC||row.shearRange.some((x,i)=>x!==domain[i]))throw new RangeError('Rows must share the declared measurement conditions');
    for(const key of ['K','n','tau0']){finite(row.sd?.[key],'SD '+key);if(row.sd[key]<0)throw new RangeError('Negative SD');}
    if(row.reportedViscosityAt100){
      const v=row.reportedViscosityAt100;finite(v.mean,'reported viscosity');finite(v.sd,'reported viscosity SD');
      if(v.mean<=0||v.sd<0||v.unit!=='Pa·s'||v.origin!=='Table 1 reported summary'||domain[0]>100||domain[1]<100)throw new RangeError('Reported viscosity identity invalid');
    }
  });
  commonShearRange(data.rows);
  if(!Array.isArray(data.limits)||!data.limits.length)throw new TypeError('Scope limits required');
  return data;
}
/** Checks a learner's arithmetic only. It never scores mechanistic understanding. */
export function checkViscosityAnswer(stress,shearRate,answer){
  finite(stress,'stress');finite(shearRate,'shear rate');
  if(stress<0||shearRate<=0)throw new RangeError('Positive-rate reading required');
  const expected=stress/shearRate;
  if(!Number.isFinite(expected))throw new RangeError('Apparent viscosity overflow');
  if(typeof answer!=='string'||!answer.trim()||!/^\+?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(answer.trim()))return {valid:false,correct:false,expected};
  const value=Number(answer);
  return {valid:Number.isFinite(value),correct:Number.isFinite(value)&&Math.abs(value-expected)<=Math.max(0.000001,expected*0.01),expected,value};
}
export const RHEOLOGY_CLAIMS=Object.freeze([
  {id:'bond',prompt:'剪切率提高時表觀黏度降低，能否據此確認糖苷鍵水解？',answer:'insufficient',explanation:'流動阻力可能因取向、顆粒重排、弱作用改變等下降；若主張骨架切割，還需相應分子量、還原端或糖組成等化學證據。曲線不能指定唯一機制。'},
  {id:'time',prompt:'同一條穩態模型曲線，能否證明材料有觸變恢復？',answer:'insufficient',explanation:'本模型沒有時間軸或結構恢復。觸變需固定條件的時間測試、掃描歷史及恢復資料；剪切變稀和時間依賴須分開。'},
  {id:'processing',prompt:'兩批產品有相同 V/Q 名義停留時間，能否斷定每一份產品都接受相同熱處理？',answer:'insufficient',explanation:'V/Q 只給名義平均。還缺實際流動與停留時間分布、溫度歷程、設備與食品物性，以及相關微生物控制的驗證；本曲線不計算壓降、流速分布或殺菌效果。'},
  {id:'point',prompt:'在同一溫度與剪切率，兩條曲線給出不同表觀黏度，能否反駁「在所有剪切率下流動行為相同」？',answer:'supported',explanation:'在相同條件找到一個不同的模型讀值，足以反駁所有剪切率下皆相同的說法；仍不等於確認唯一微結構或真實食品製程效能。'},
].map(Object.freeze));
