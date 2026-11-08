/** Single-point GOPOD teaching model. Content and recovery presets are hypothetical batch means;
 * the separate reread preset contains fixed hypothetical readings of the same extract. */
export const FOOD_ANALYSIS_ID = 'food-analysis-chain';

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const FOOD_ANALYSIS_LIMITS = deepFreeze({
  assayAliquotMl: 0.1, reagentMl: 3, standardMgMl: 1,
  rangeMinUg: 4, rangeMaxUg: 100, maxDilutionSteps: 8,
});

export const FOOD_ANALYSIS_SOURCES = deepFreeze([
  {title:'Neogen / Megazyme K-GLUC 官方方法（08/23）',url:'https://prod-docs.megazyme.com/documents/Assay_Protocol/K-GLUC_DATA.pdf'},
  {title:'Megazyme K-GLUC 方法確效報告（March 2021）',url:'https://prod-docs.megazyme.com/documents/Validation_Report/K-GLUC_Validation_Report.pdf'},
  {title:'Megazyme：GOPOD 顯色的可能干擾',url:'https://support.megazyme.com/support/solutions/articles/8000033832-is-the-glucose-colour-production-in-the-d-glucose-assay-kit-gopod-format-k-gluc-affected-by-any-c'},
  {title:'IUBMB：glucose oxidase EC 1.1.3.4',url:'https://iubmb.qmul.ac.uk/enzyme/EC1/1/3/4.html'},
  {title:'Eurachem：方法驗證、校正與加標回收（2025）',url:'https://www.eurachem.org/images/stories/Guides/pdf/MV_guide_3rd_ed_V1_EN.pdf'},
]);

const common = {rawBlank:0.030,rawStandard:1.030,sampleMassG:5,extractFinalMl:100};
export const FOOD_ANALYSIS_CASES = deepFreeze([
  {id:'f1',label:'未稀釋 · F = 1',inputs:{...common,rawSample:1.280,dilutions:[]}},
  {id:'f5',label:'取 2 mL 定容 10 mL · F = 5',inputs:{...common,rawSample:0.280,dilutions:[{aliquotMl:2,finalMl:10}]}},
  {id:'f10',label:'取 1 mL 定容 10 mL · F = 10',inputs:{...common,rawSample:0.155,dilutions:[{aliquotMl:1,finalMl:10}]}},
]);
export const CASES = FOOD_ANALYSIS_CASES;

export const FOOD_REREAD_CASE = deepFreeze({
  id:'same-extract-reread',label:'同一萃取液重讀 · 固定假想資料',
  readings:[2450,2500,2550],unit:'mg/100 g',
  evidence:'original-hypothetical-same-extract-rereads',
  independentOfCurrentAnalysis:true,independentOfRecoveryCases:true,
  context:'固定假想同一萃取液重讀案例；不是目前分析或加標回收流程產生的新測量。',
});

/** New editable record; choosing another preset is the only operation that pairs a new reading with a new dilution. */
export function createAnalysisInputs(caseId='f5') {
  const selected=FOOD_ANALYSIS_CASES.find(item=>item.id===caseId);
  if(!selected)throw new RangeError('未知的食品分析教學紀錄。');
  return {...selected.inputs,dilutions:selected.inputs.dilutions.map(step=>({...step}))};
}

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const issue=(code,field,message)=>({code,field,message});
const error=(out,code,field,message)=>out.errors.push(issue(code,field,message));
const INPUT_KEYS=['rawBlank','rawStandard','rawSample','sampleMassG','extractFinalMl','dilutions'];
function result() {
  return {net:{standard:null,sample:null},analysisSolutionMgMl:null,assayUg:null,range:'invalid',errors:[],
    dilutionFactor:null,extractMgMl:null,totalMg:null,mgPer100g:null,usable:false};
}
function finite(value) { return typeof value==='number'&&Number.isFinite(value); }

/** Descriptive sample SD of same-extract rereads; not a full-method precision study. */
export function evaluateRepeatability(readings) {
  const out={n:Array.isArray(readings)?readings.length:null,mean:null,sampleVariance:null,sampleSd:null,
    rsdPercent:null,rsdUndefinedReason:null,usable:false,errors:[],unit:'mg/100 g',
    boundary:'僅描述同一萃取液重讀的離散程度；不涵蓋獨立萃取或完整方法精密度，也不是方法驗證或接受標準。0–100000 mg/100 g 是數值教學域，非方法量程。'};
  if(!Array.isArray(readings)) {
    error(out,'invalid-readings','readings','重讀資料必須是數值陣列。');return out;
  }
  if(readings.length<2||readings.length>1000) {
    error(out,'invalid-reading-count','readings','樣本標準差需要 2–1000 個重讀值。');return out;
  }
  for(let index=0;index<readings.length;index++) {
    const field=`readings[${index}]`;
    if(!Object.hasOwn(readings,index))error(out,'missing-reading',field,'重讀陣列不能有缺值或空槽。');
    else if(!finite(readings[index]))error(out,'invalid-number',field,'重讀值必須是有限數字；空白不代表零。');
    else if(readings[index]<0||readings[index]>100000)error(out,'reading-outside-domain',field,'重讀值須在 0–100000 mg/100 g 的數值教學域內；此域不是方法量程。');
  }
  if(out.errors.length)return out;
  // Identical readings have their exact common mean; summation round-off must
  // not manufacture nonzero variance for e.g. three readings of 0.1.
  const identical=readings.every(value=>value===readings[0]);
  const mean=identical?readings[0]:readings.reduce((sum,value)=>sum+value,0)/readings.length;
  if(mean===0&&readings.some(value=>value>0)) {
    error(out,'arithmetic-underflow','mean','正重讀值的平均數太小，無法表示；不能當作零平均值。');return out;
  }
  const sampleVariance=readings.reduce((sum,value)=>sum+(value-mean)**2,0)/(readings.length-1);
  if(sampleVariance===0&&readings.some(value=>value!==mean)) {
    error(out,'arithmetic-underflow','sampleVariance','非零變異太小，無法表示；不能當作零標準差。');return out;
  }
  const sampleSd=Math.sqrt(sampleVariance);
  const rsdPercent=mean===0?null:100*sampleSd/mean;
  if(!finite(mean)||!finite(sampleVariance)||!finite(sampleSd)||(rsdPercent!==null&&!finite(rsdPercent))) {
    error(out,'arithmetic-overflow','readings','重讀統計超出可表示的數值範圍。');return out;
  }
  if(sampleSd>0&&rsdPercent===0) {
    error(out,'arithmetic-underflow','rsdPercent','非零相對標準差太小，無法表示；不能當作零 RSD。');return out;
  }
  out.mean=mean;out.sampleVariance=sampleVariance;out.sampleSd=sampleSd;out.rsdPercent=rsdPercent;
  out.rsdUndefinedReason=mean===0?'zero-mean':null;out.usable=true;
  return out;
}

function keysMatch(value,keys) {
  return isObject(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
}
function validateInputs(inputs,out) {
  if(!keysMatch(inputs,INPUT_KEYS)) {
    error(out,'invalid-shape','inputs','分析紀錄欄位不完整或含有未知欄位。');return false;
  }
  for(const key of INPUT_KEYS.filter(key=>key!=='dilutions')) {
    if(!finite(inputs[key]))error(out,'invalid-number',key,'讀值、質量與體積必須是有限數字；空白欄不能當成零。');
  }
  for(const key of ['sampleMassG','extractFinalMl']) {
    if(finite(inputs[key])&&inputs[key]<=0)error(out,'nonpositive-input',key,'試料質量與萃取定容體積必須大於零。');
  }
  if(!Array.isArray(inputs.dilutions)||inputs.dilutions.length>FOOD_ANALYSIS_LIMITS.maxDilutionSteps) {
    error(out,'invalid-dilutions','dilutions',`稀釋步驟必須是陣列，最多 ${FOOD_ANALYSIS_LIMITS.maxDilutionSteps} 步。`);
  } else inputs.dilutions.forEach((step,index)=>{
    const path=`dilutions[${index}]`;
    if(!keysMatch(step,['aliquotMl','finalMl']))error(out,'invalid-dilution-shape',path,'每步稀釋都要有取樣體積與定容體積。');
    else if(!finite(step.aliquotMl)||!finite(step.finalMl)||step.aliquotMl<=0||step.finalMl<=0)error(out,'invalid-dilution-volume',path,'稀釋的取樣與定容體積必須是大於零的有限數字。');
    else if(step.finalMl<step.aliquotMl)error(out,'concentration-not-dilution',path,'定容體積不可小於取樣體積；本模型只處理稀釋。');
  });
  // Array holes are not records (forEach intentionally does not visit them).
  if(Array.isArray(inputs.dilutions))for(let i=0;i<inputs.dilutions.length;i++)if(!Object.hasOwn(inputs.dilutions,i))error(out,'missing-dilution',`dilutions[${i}]`,'稀釋步驟不能缺漏。');
  return out.errors.length===0;
}

/**
 * Input A values are given hypothetical batch means before reagent-blank subtraction.
 * analysisSolutionMgMl describes the 0.1 mL solution BEFORE adding GOPOD, not the 3.1 mL reaction.
 * Out-of-range arithmetic is retained through assayUg only; no usable food-content result is extrapolated.
 */
export function evaluateAnalysis(inputs) {
  const out=result();
  if(!validateInputs(inputs,out))return out;
  const standard=inputs.rawStandard-inputs.rawBlank,sample=inputs.rawSample-inputs.rawBlank;
  if(!finite(standard)||!finite(sample)) {
    error(out,'arithmetic-overflow','net','扣空白後超出可表示的數值範圍。');return out;
  }
  out.net={standard,sample};
  if(standard<=0) {
    error(out,'nonpositive-standard','rawStandard','標準扣除試劑空白後必須大於零，才能作比值計算。');return out;
  }
  let factor=1;
  for(const step of inputs.dilutions) {
    const ratio=step.finalMl/step.aliquotMl;
    factor*=ratio;
    if(!finite(ratio)||!finite(factor)) {
      error(out,'arithmetic-overflow','dilutions','累積稀釋倍數超出可表示的數值範圍。');return out;
    }
  }
  out.dilutionFactor=factor;
  const concentration=sample/standard*FOOD_ANALYSIS_LIMITS.standardMgMl;
  const ug=concentration*FOOD_ANALYSIS_LIMITS.assayAliquotMl*1000;
  if(!finite(concentration)||!finite(ug)||(sample!==0&&concentration===0)||(concentration!==0&&ug===0)) {
    error(out,'arithmetic-overflow','analysisSolutionMgMl','濃度計算超出可表示的數值範圍，不能以零或無限大代替。');return out;
  }
  out.analysisSolutionMgMl=concentration;out.assayUg=ug;
  if(sample<0) {
    error(out,'negative-net-signal','rawSample','樣品扣空白後為負；保留負讀值供查核，不裁成零或報告負含量。');return out;
  }
  // Numerical round-off tolerance only (1e-12 micrograms), not an analytical acceptance margin.
  const tolerance=1e-12;
  if(ug<FOOD_ANALYSIS_LIMITS.rangeMinUg-tolerance) {out.range='below-working-range';return out;}
  if(ug>FOOD_ANALYSIS_LIMITS.rangeMaxUg+tolerance) {out.range='above-working-range';return out;}
  out.range='within-range';
  const extract=concentration*factor,total=extract*inputs.extractFinalMl,content=total/inputs.sampleMassG*100;
  if(!finite(extract)||!finite(total)||!finite(content)||extract===0||total===0||content===0) {
    error(out,'arithmetic-overflow','mgPer100g','樣品回算超出可表示的數值範圍，請檢查質量、體積與稀釋紀錄。');return out;
  }
  // No hydrolysis or added glucose in this original-sample branch: glucose cannot exceed its entire mass.
  // Tolerance covers floating-point rounding of exactly 100 g/100 g, not an analytical acceptance interval.
  if(content>100000+16*Number.EPSILON*100000) {
    error(out,'mass-balance-exceeded','mgPer100g','回算的葡萄糖超過原樣品總質量；請檢查質量、稀釋紀錄與方法干擾，不能報為有效含量。');return out;
  }
  out.extractMgMl=extract;out.totalMg=total;out.mgPer100g=content;out.usable=true;
  return out;
}

const recoveryInputs={rawBlank:0.030,rawStandard:1.030,rawUnspiked:0.280};
const recoveryContext={sampleMassG:5,extractFinalMl:100,dilutions:[{aliquotMl:2,finalMl:10}],pairedFinalMl:10,
  evidence:'hypothetical-paired-batch-means',independentOfCurrentAnalysis:true};
export const FOOD_RECOVERY_CASES=deepFreeze([
  {id:'pre-extraction',label:'萃取前加標',inputs:{...recoveryInputs,rawSpiked:0.370,addedMg:50},
    context:{...recoveryContext,comparisonBasis:'whole-extract-mg',additionStage:'before-extraction'}},
  {id:'post-extraction',label:'萃取後加標',inputs:{...recoveryInputs,rawSpiked:0.375,addedMg:1},
    context:{...recoveryContext,comparisonBasis:'analysis-flask-mg',additionStage:'after-extraction-before-assay'}},
]);

/**
 * Independent paired teaching records: identical sample equivalents and matched final volumes.
 * Overrides may change ONLY the five explicit readings/spike-mass fields, never the paired geometry.
 * A computed recovery is descriptive, including values below 0 or above 100; usable does not mean acceptable recovery.
 * No automatic correction of the main sample result, and no claim of native-analyte extraction efficiency.
 */
export function evaluateRecovery(stage,overrides={}) {
  const canonical=stage==='pre'?'pre-extraction':stage==='post'?'post-extraction':stage;
  const out={stage:typeof canonical==='string'?canonical:null,usable:false,errors:[],unspiked:null,spiked:null,
    comparisonBasis:null,unspikedMg:null,spikedMg:null,addedMg:null,recoveredAddedMg:null,recoveryPercent:null,context:null};
  const selected=FOOD_RECOVERY_CASES.find(item=>item.id===canonical);
  if(!selected) {error(out,'unknown-recovery-stage','stage','請選擇萃取前或萃取後的成對加標案例。');return out;}
  const allowed=['rawBlank','rawStandard','rawUnspiked','rawSpiked','addedMg'];
  if(!isObject(overrides)||Object.keys(overrides).some(key=>!allowed.includes(key))) {
    error(out,'invalid-recovery-overrides','overrides','回收案例只接受指定讀值與加入質量；配對體積及樣品等量不可混用。');return out;
  }
  const values={...selected.inputs,...overrides};
  for(const key of allowed)if(!finite(values[key]))error(out,'invalid-number',key,'加標紀錄必須是有限數字；空白欄不能當成零。');
  if(finite(values.addedMg)&&values.addedMg<=0)error(out,'nonpositive-spike','addedMg','已加入的葡萄糖質量必須大於零。');
  if(out.errors.length)return out;
  out.context={...selected.context,dilutions:selected.context.dilutions.map(step=>({...step}))};
  out.comparisonBasis=out.context.comparisonBasis;out.addedMg=values.addedMg;
  const base={rawBlank:values.rawBlank,rawStandard:values.rawStandard,sampleMassG:out.context.sampleMassG,
    extractFinalMl:out.context.extractFinalMl,dilutions:out.context.dilutions};
  out.unspiked=evaluateAnalysis({...base,rawSample:values.rawUnspiked});
  out.spiked=evaluateAnalysis({...base,rawSample:values.rawSpiked});
  if(!out.unspiked.usable||!out.spiked.usable) {
    error(out,'unusable-paired-reading','paired-readings','加標與未加標兩份都必須有有效標準及範圍內的讀值，才能判讀回收。');return out;
  }
  const before=canonical==='pre-extraction'?out.unspiked.totalMg:out.unspiked.analysisSolutionMgMl*out.context.pairedFinalMl;
  const after=canonical==='pre-extraction'?out.spiked.totalMg:out.spiked.analysisSolutionMgMl*out.context.pairedFinalMl;
  const recovered=after-before,percent=recovered/values.addedMg*100;
  if(!finite(before)||!finite(after)||!finite(recovered)||!finite(percent)||(recovered!==0&&percent===0)) {
    error(out,'arithmetic-overflow','recoveryPercent','回收計算超出可表示的數值範圍，不能以零或無限大代替。');return out;
  }
  out.unspikedMg=before;out.spikedMg=after;out.recoveredAddedMg=recovered;out.recoveryPercent=percent;out.usable=true;
  return out;
}
