// Explicit teaching parameters. No experimental fluorescence or assay cutoff.
export const QPCR_LAB_ID='qpcr-evidence';
export const QPCR_VERSION='qpcr-evidence/v1';
export const QPCR_SCALE=1e-6; // arbitrary fluorescence units per target copy
export const QPCR_MAX_CYCLE=40;
export const QPCR_SIGNAL_CEILING=4; // display bound, not a plateau or validated exponential limit
export const QPCR_DEFAULTS=Object.freeze({logA:'3',logB:'2',efficiency:'100',threshold:'1',cycle:'10',slope:String(-1/Math.log10(2)),intercept:'40',queryCq:'28'});

function number(raw,label,min,max){
 if((typeof raw!=='string'&&typeof raw!=='number')||String(raw).trim()==='')throw new RangeError(label+'尚未填寫');
 if(typeof raw==='string'&&!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw.trim()))throw new RangeError(label+'須填十進位數字');
 const value=Number(raw);if(!Number.isFinite(value)||value<min||value>max)throw new RangeError(`${label}須為 ${min} 至 ${max}`);return value;
}
export function parseSignal(raw){return {logA:number(raw.logA,'A 起始 log₁₀ 拷貝數',0,6),logB:number(raw.logB,'B 起始 log₁₀ 拷貝數',0,6),efficiency:number(raw.efficiency,'每循環效率（%）',20,100)/100,threshold:number(raw.threshold,'閾值（a.u.）',.2,2),cycle:number(raw.cycle,'循環',0,QPCR_MAX_CYCLE)};}
export function signalAt(copies,efficiency,cycle){
 copies=number(copies,'拷貝數',1,1e6);efficiency=number(efficiency,'效率',.2,1);cycle=number(cycle,'循環',0,QPCR_MAX_CYCLE);
 return QPCR_SCALE*copies*(1+efficiency)**cycle;
}
export function crossingCycle(copies,efficiency,threshold){
 copies=number(copies,'拷貝數',1,1e6);efficiency=number(efficiency,'效率',.2,1);threshold=number(threshold,'閾值',.2,2);
 const cycle=Math.log(threshold/(QPCR_SCALE*copies))/Math.log1p(efficiency);
 if(cycle<=0)return {value:null,status:'already-above-at-zero',mathematicalCycle:cycle};
 if(cycle>QPCR_MAX_CYCLE)return {value:null,status:'outside-cycle-window',mathematicalCycle:cycle};
 return {value:cycle,status:'crossed',mathematicalCycle:cycle};
}
export function compareSignals(raw){
 const p=parseSignal(raw),a=10**p.logA,b=10**p.logB,A=crossingCycle(a,p.efficiency,p.threshold),B=crossingCycle(b,p.efficiency,p.threshold);
 const delta=A.value!==null&&B.value!==null?B.value-A.value:null;
 return {parameters:p,copiesA:a,copiesB:b,cqA:A,cqB:B,deltaCqBminusA:delta,ratioAoverB:delta===null?null:(1+p.efficiency)**delta,inputRatioAoverB:a/b,signalA:signalAt(a,p.efficiency,p.cycle),signalB:signalAt(b,p.efficiency,p.cycle)};
}
export function standardCurve(raw){
 const slope=number(raw.slope,'斜率 b',-10,-1),intercept=number(raw.intercept,'截距 a',20,50),queryCq=number(raw.queryCq,'待反算 Cq',0,50);
 const efficiency=10**(-1/slope)-1,standards=[1,2,3,4,5].map(logCopies=>({logCopies,copies:10**logCopies,cq:intercept+slope*logCopies}));
 const logCopies=(queryCq-intercept)/slope,copies=10**logCopies,inRange=logCopies>=1-1e-12&&logCopies<=5+1e-12;
 return {slope,intercept,queryCq,efficiency,standards,logCopies,copies,inRange,abovePhysicalEfficiency:efficiency>1+1e-12,
  calibrationWithinCycleWindow:standards.every(p=>p.cq>0&&p.cq<=QPCR_MAX_CYCLE)};
}
