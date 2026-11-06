// Molecular bookkeeping and published observations are intentionally separate.
export const YOGURT_LAB_ID = 'fermented-milk-evidence';
export const YOGURT_LAB_SOURCES = Object.freeze([
  {id:'yogurt-source-bierzunska2019',title:'Bierzuńska et al. (2019), Foods 8:548, Table 3',url:'https://doi.org/10.3390/foods8110548'}
]);
export const YOGURT_PRODUCTS = Object.freeze([
  {id:'glucose',label:'葡萄糖',formula:'C₆H₁₂O₆',atoms:{C:6,H:12,O:6}},
  {id:'galactose',label:'半乳糖',formula:'C₆H₁₂O₆',atoms:{C:6,H:12,O:6}},
  {id:'lactic',label:'乳酸',formula:'C₃H₆O₃',atoms:{C:3,H:6,O:3}}
]);
export const YOGURT_REACTIONS = Object.freeze([
  {id:'hydrolysis',label:'乳糖水解',input:'乳糖 + H₂O',inputFormula:'C₁₂H₂₂O₁₁ + H₂O',atoms:{C:12,H:24,O:12},expected:{glucose:1,galactose:1,lactic:0},reference:'乳糖 + H₂O → 葡萄糖 + 半乳糖',scope:'水解先拆開兩個單糖；不等於它們已被發酵。'},
  {id:'homolactic',label:'葡萄糖同型發酵',input:'葡萄糖',inputFormula:'C₆H₁₂O₆',atoms:{C:6,H:12,O:6},expected:{glucose:0,galactose:0,lactic:2},reference:'C₆H₁₂O₆ → 2 C₃H₆O₃',scope:'以一個葡萄糖作中性分子式記帳，省略 ATP／輔酶循環、酸解離及其他碳去向；不是整份乳糖的實測收率。'}
]);
export function evaluateYogurtProducts(reactionId,counts) {
  const reaction=YOGURT_REACTIONS.find(x=>x.id===reactionId);
  if(!reaction) throw new RangeError('Unknown reaction');
  if(!counts || typeof counts!=='object' || Array.isArray(counts) || Object.keys(counts).some(k=>!YOGURT_PRODUCTS.some(p=>p.id===k))) throw new TypeError('Invalid product selection');
  const normalized=Object.fromEntries(YOGURT_PRODUCTS.map(p=>[p.id,Object.hasOwn(counts,p.id)?counts[p.id]:0]));
  if(Object.values(normalized).some(n=>!Number.isInteger(n)||n<0||n>4)) throw new RangeError('Product counts must be integers from 0 to 4');
  const atomsOut={C:0,H:0,O:0};
  for(const p of YOGURT_PRODUCTS) for(const e of Object.keys(atomsOut)) atomsOut[e]+=p.atoms[e]*normalized[p.id];
  const carbonBalanced=atomsOut.C===reaction.atoms.C;
  const atomBalanced=Object.keys(atomsOut).every(e=>atomsOut[e]===reaction.atoms[e]);
  const correct=YOGURT_PRODUCTS.every(p=>normalized[p.id]===reaction.expected[p.id]);
  const productText=YOGURT_PRODUCTS.filter(p=>normalized[p.id]).map(p=>(normalized[p.id]===1?'':normalized[p.id]+' ')+p.label).join(' + ')||'尚未選產物';
  return {reactionId,counts:normalized,atomsIn:{...reaction.atoms},atomsOut,carbonBalanced,atomBalanced,correct,
    equationText:reaction.input+' → '+productText,referenceText:reaction.reference,
    feedback:correct?'符合這條指定反應的產物與計量。':atomBalanced?'元素帳平衡，但產物身分不符合指定反應。葡萄糖與半乳糖有相同分子式，結構仍不同。':'先核對產物身分與數量，再看左右元素帳。',scope:reaction.scope};
}
export function validateYogurtData(data) {
  if(data?.schema!=='yogurt-fermented-milk-measurements/v1') throw new TypeError('Unsupported fermented milk data');
  const ts=['control','wpc80','pwp'], ms=['ph','sws','whc'], ds=[0,10,21];
  const unique=(arr,expected)=>Array.isArray(arr)&&arr.length===expected.length&&new Set(arr).size===arr.length&&arr.every(x=>expected.includes(x));
  if(!unique(data.treatments?.map(x=>x.id),ts)||!unique(data.metrics?.map(x=>x.id),ms)||!unique(data.conditions?.days,ds)) throw new TypeError('Incomplete comparison axes');
  const nonempty=v=>typeof v==='string'&&v.trim().length>0;
  if(data.source?.doi!=='10.3390/foods8110548'||data.source?.table!==3||data.source?.license!=='CC BY 4.0'||!nonempty(data.source?.title)||data.source?.url!=='https://doi.org/10.3390/foods8110548'||data.source?.licenseUrl!=='https://creativecommons.org/licenses/by/4.0/') throw new TypeError('Missing study attribution');
  if(data.conditions.storageC!==3||data.conditions.storagePlusMinusC!==0.5||data.conditions.nPerCell!==8||data.conditions.nPerTreatmentAcrossThreeDays!==24||!nonempty(data.conditions.dayZeroDefinition)||!nonempty(data.conditions.batchIndependence)) throw new TypeError('Incorrect study conditions');
  for(const t of data.treatments) if(!nonempty(t.label)||!nonempty(t.description)) throw new TypeError('Missing treatment identity');
  for(const m of data.metrics) if(m.unit!==(m.id==='ph'?'dimensionless':'%')||!nonempty(m.label)||!nonempty(m.definition)||!nonempty(m.lettersScope)) throw new TypeError('Missing measurement basis');
  if(!Array.isArray(data.observations)||data.observations.length!==27) throw new TypeError('Expected 27 published observations');
  const seen=new Set();
  for(const r of data.observations){
    const key=[r.treatmentId,r.day,r.metricId].join('/');
    if(seen.has(key)||!ts.includes(r.treatmentId)||!ms.includes(r.metricId)||!ds.includes(r.day)) throw new TypeError('Invalid or duplicate observation');
    seen.add(key);
    if(!Number.isFinite(r.mean)||!Number.isFinite(r.sd)||r.sd<0||r.mean<0||r.mean>(r.metricId==='ph'?14:100)||r.n!==8) throw new TypeError('Invalid reported statistic');
    for(const [text,n] of [[r.meanText,r.mean],[r.sdText,r.sd]]) if(typeof text!=='string'||!/^\d+(\.\d+)?$/.test(text)||Number(text)!==n) throw new TypeError('Reported precision does not match number');
    if(typeof r.letters!=='string'||! /^[a-z]+$/.test(r.letters)) throw new TypeError('Missing table letters');
  }
  return data;
}
export function compareYogurtRecords(data,selection) {
  validateYogurtData(data);
  const s=selection;
  if(!s||!['treatment','storage'].includes(s.mode)||!data.metrics.some(x=>x.id===s.metricId)) throw new RangeError('Invalid comparison');
  const aKey=s.mode==='treatment'?[s.treatmentA,s.day]:[s.treatmentId,s.dayA];
  const bKey=s.mode==='treatment'?[s.treatmentB,s.day]:[s.treatmentId,s.dayB];
  const get=([t,d])=>{
    const r=data.observations.find(x=>x.treatmentId===t&&x.day===d&&x.metricId===s.metricId);
    if(!r) throw new RangeError('No published observation at this setting');
    return {...r,label:data.treatments.find(x=>x.id===t).label+' · 第 '+d+' 日'};
  };
  const a=get(aKey),b=get(bKey),delta=b.mean-a.mean;
  const metric=data.metrics.find(x=>x.id===s.metricId);
  const values=data.observations.filter(r=>r.metricId===s.metricId);
  // Fixed axes across all selections of a metric; pH uses a labeled dot axis.
  const axis=s.metricId==='ph'?[4.3,4.6]:s.metricId==='sws'?[0,5]:[60,100];
  if(values.some(r=>r.mean-r.sd<axis[0]||r.mean+r.sd>axis[1])) throw new RangeError('Published values fall outside the fixed display axis');
  return {selection:{...s},a,b,metric,delta,deltaUnit:s.metricId==='ph'?'pH 單位':'百分點',relation:delta>0?'higher':delta<0?'lower':'same',sameRecord:a.treatmentId===b.treatmentId&&a.day===b.day,axis,
    note:'差值由刊載均值另算；SD 是原文標準差，沒有計算差值的不確定度或新的顯著性檢定。'};
}
export const YOGURT_CLAIMS=Object.freeze([
  {id:'physical',text:'這些記錄可比較本研究條件下的 pH、自然離水與 WHC。',answer:'supported',explanation:'表 3 直接報告這三種量；比較仍限於作者的材料、處理、貯藏點及量測方法。'},
  {id:'lactose',text:'pH 下降，足以算出乳糖全部轉成多少乳酸。',answer:'insufficient',explanation:'pH 不是乳酸含量；這張表沒有乳糖、半乳糖與乳酸的量測，也沒有完整碳收支。'},
  {id:'culture',text:'這張表證明經典兩菌優格的共生機制。',answer:'insufficient',explanation:'本研究使用 S. thermophilus、L. acidophilus 與 B. animalis subsp. lactis，並非典型兩菌組合；這張表也沒有單培／共培與機制對照。'},
  {id:'safety',text:'離水較少、WHC 較高，就能證明產品安全。',answer:'insufficient',explanation:'物理品質讀值不能代替微生物與產品製程的安全證據。'}
]);
export function evaluateYogurtClaim(id,answer){
  const claim=YOGURT_CLAIMS.find(c=>c.id===id);
  if(!claim||!['supported','insufficient'].includes(answer)) throw new RangeError('Choose a claim and evidence judgment');
  return {...claim,correct:answer===claim.answer,chosen:answer};
}
