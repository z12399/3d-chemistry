import {fitMichaelisMenten} from './enzyme-kinetics-model.js';
export const ENZYME_EVIDENCE_ID='enzyme-evidence-chain';
export const ENZYME_EVIDENCE_VERSION='enzyme-measurement-enquiry-v1';
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;},clone=x=>structuredClone(x),lock=(o,k)=>Object.defineProperty(o,k,{value:o[k],enumerable:true,writable:false,configurable:false});
export const ENZYME_EVIDENCE_CASES=freeze([{id:'paired-signal',title:'案件A：兩份訊號記錄'},{id:'new-matrix',title:'案件B：另一基質的資料'}]);
export const ENZYME_EVIDENCE_PACKETS=freeze([{id:'blank',title:'配對空白資料'},{id:'calibration',title:'同基質校正記錄'},{id:'window',title:'此時間窗的條件記錄'},{id:'profile',title:'多受質濃度資料'},{id:'sites',title:'有效催化位點記錄'}]);
export const ENZYME_EVIDENCE_SOURCES=freeze([
 {id:'enzyme-source-iubmb-steady',title:'IUBMB：速率、準穩態與解離常數',url:'https://iubmb.qmul.ac.uk/kinetics/ek1t3.html',scope:'初速、準穩態與指定機構的條件；本台不把有限窗口斜率自動稱v₀，也不以Km代替Kd。'},
 {id:'enzyme-source-iubmb-inhibition',title:'IUBMB：催化位、MM及抑制分類',url:'https://iubmb.qmul.ac.uk/kinetics/ek4t6.html',scope:'有效位點基準、表觀周轉與動力學模型；不能由曲線形狀確認結合位置或本徵催化常數。'},
 {id:'enzyme-source-iubmb-activity',title:'IUBMB：機制證據與活性單位',url:'https://iubmb.qmul.ac.uk/kinetics/ek7.html',scope:'指定條件與活性單位的意義；下列數據不是任何酵素或食品效能。'},
 {id:'enzyme-source-wellesley-assay',title:'Wellesley College：Enzyme Kinetics教材',url:'https://sites.google.com/wellesley.edu/researchweeklabmanual/daily-lab-manuals/day-4-enzyme-kinetics-2',scope:'只採量測／空白及校正需對應的教學概念；不提供實驗操作程序或移植條件參數。'},
 {id:'enzyme-source-nist-calibration',title:'NIST：Calibration Data Analysis and Model Validation',url:'https://www.itl.nist.gov/div898/handbook/mpc/section3/mpc365.htm',scope:'只取校正範圍、殘差及適用性；AU=b+m[P]與全部數字是原創題設，不冒稱NIST酵素資料。'},
 {id:'enzyme-source-nist-nonlinear',title:'NIST：Nonlinear Least Squares Regression',url:'https://www.itl.nist.gov/div898/handbook/pmd/section1/pmd142.htm',scope:'原尺度條件擬合及限制；直接重用既有fitMichaelisMenten，不新增solver，不輸出實驗信賴區間或機制證明。'},
]);
export const ENZYME_EVIDENCE_REMEDIATION=freeze([
 {id:'rate',label:'訊號、空白與初速',href:'#learn/enzymes/enzyme-initial-rate/understand'},
 {id:'steady',label:'ES庫存穩定與準穩態',href:'#learn/enzymes/enzyme-steady-state/understand'},
 {id:'turnover',label:'有效催化位的分母',href:'#learn/enzymes/enzyme-turnover/understand'},
 {id:'mixed',label:'抑制模型及表觀參數',href:'#learn/enzymes/enzyme-mixed-inhibition/understand'},
 {id:'fitting',label:'原尺度擬合與辨識',href:'#learn/enzymes/enzyme-kinetic-fitting/understand'},
 {id:'limits',label:'同曲線的競爭解釋',href:'#learn/enzymes/enzyme-evidence-limits/understand'},
]);
const fresh=controls=>({controls,opened:[],prediction:'',initial:null,response:'',checked:null,revision:'',hintSeen:false});
export function createEnzymeEvidenceDraft(){return {caseId:'paired-signal',visited:[],workedSeen:false,workedOpen:false,cases:{'paired-signal':fresh({mA:'0.010',mB:'0.005',activeA:'',activeB:''}),'new-matrix':fresh({mA:'0.020',mB:'0.020',activeA:'2',activeB:'1'})},details:{},synthesis:''};}
export function markEnzymeEvidenceCaseShown(d){if(!ENZYME_EVIDENCE_CASES.some(x=>x.id===d.caseId))throw new RangeError('Unknown case');if(!d.visited.includes(d.caseId))d.visited.push(d.caseId);}
const current=d=>d.cases[d.caseId];
export function selectEnzymeEvidenceCase(d,id){if(!ENZYME_EVIDENCE_CASES.some(x=>x.id===id))throw new RangeError('Unknown case');d.caseId=id;}
function scaled(raw,{signed=true,max=1000000}={}){
 if(raw===null||raw===undefined||raw==='')return {raw,status:'missing',value:null,exact:null};
 if(typeof raw!=='string'||raw.length>32||! /^(?:-?(?:0|[1-9]\d*)(?:\.\d{1,6})?)$/.test(raw))return {raw,status:'invalid',value:null,exact:null};
 const negative=raw.startsWith('-'),s=negative?raw.slice(1):raw,[whole,fraction='']=s.split('.'),n=(negative?-1n:1n)*(BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0')));
 if(!signed&&n<0n||n>BigInt(max)*1000000n||n< -BigInt(max)*1000000n)return {raw,status:'invalid',value:null,exact:null};
 return {raw,status:'observed',value:Number(n)/1e6,exact:n};
}
const publicNumber=({exact,...rest})=>rest;
const ratio=(n,d)=>({value:Number(n)/Number(d),numerator:n.toString(),denominator:d.toString()});
/** Endpoint window slopes of the given observations, not another progress-curve solver or OLS fit. */
export function analyzeEnzymeSignal({times,sample,blank=null}={}){
 const empty={rawSignalSlope:null,correctedSignalSlope:null,corrected:[],stepSlopes:[],linearAcrossGivenPoints:null,concentrationRate:null};
 if(!Array.isArray(times)||!Array.isArray(sample)||times.length!==3||sample.length!==3)return {...empty,status:'invalid-shape'};
 const t=times.map(x=>scaled(x,{signed:false})),a=sample.map(x=>scaled(x));
 if(t.some(x=>x.status!=='observed')||t[1].exact<=t[0].exact||t[2].exact<=t[1].exact)return {...empty,status:'invalid-time',rawTimes:times};
 const window=t[2].exact-t[0].exact,raw=a[0].exact===null||a[2].exact===null?null:ratio(a[2].exact-a[0].exact,window);
 if(blank===null)return {...empty,status:'sample-only',rawSignalSlope:raw,rawSample:sample};
 if(!Array.isArray(blank)||blank.length!==3)return {...empty,status:'invalid-blank',rawSignalSlope:raw};
 const b=blank.map(x=>scaled(x)),corrected=a.map((x,i)=>x.exact===null||b[i].exact===null?null:x.exact-b[i].exact),end=corrected[0]===null||corrected[2]===null?null:ratio(corrected[2]-corrected[0],window),slopes=[0,1].map(i=>corrected[i]===null||corrected[i+1]===null?null:ratio(corrected[i+1]-corrected[i],t[i+1].exact-t[i].exact));
 const linear=slopes.some(x=>x===null)?null:BigInt(slopes[0].numerator)*BigInt(slopes[1].denominator)===BigInt(slopes[1].numerator)*BigInt(slopes[0].denominator);
 return {...empty,status:end?'paired-window-slope':'incomplete-pairs',rawSignalSlope:raw,correctedSignalSlope:end,corrected:corrected.map(n=>n===null?null:Number(n)/1e6),stepSlopes:slopes,linearAcrossGivenPoints:linear,rawSample:sample,rawBlank:blank};
}
/** b may be nonzero; a time-constant intercept changes P levels, not their slope. */
export function calibrateEnzymeSlope(signal,calibration){
 const unknown={productSlope:null,formalConvertedSlope:null,conditionalInitialRate:null};
 const q=signal?.correctedSignalSlope;
 if(!q||typeof q.numerator!=='string'||typeof q.denominator!=='string'||q.numerator.length>80||q.denominator.length>80||! /^-?\d+$/.test(q.numerator)||! /^-?\d+$/.test(q.denominator)||BigInt(q.denominator)===0n)return {...unknown,status:'corrected-slope-unavailable'};
 if(!calibration||calibration.status!=='provided')return {...unknown,status:'calibration-unavailable'};
 const m=scaled(calibration.m),intercept=scaled(calibration.b);
 if(m.status!=='observed')return {...unknown,status:m.status==='missing'?'sensitivity-missing':'invalid-sensitivity',rawM:calibration.m};
 if(m.exact===0n)return {...unknown,status:'zero-sensitivity',rawM:calibration.m};
 const formal=ratio(BigInt(signal.correctedSignalSlope.numerator)*1000000n,BigInt(signal.correctedSignalSlope.denominator)*m.exact),givenRange=calibration.validSignalRange;
 if(calibration.matrixMatched!==true||calibration.interceptConstant!==true||calibration.responseUnit!=='AU'||calibration.productUnit!=='μM'||!Array.isArray(givenRange)||givenRange.length!==2||givenRange.some(x=>!Number.isFinite(x))||givenRange[0]>givenRange[1]||!Array.isArray(signal.corrected)||signal.corrected.length!==3)return {...unknown,status:'calibration-qualification-unavailable',formalConvertedSlope:formal,intercept:publicNumber(intercept)};
 if(signal.corrected.some(x=>x===null||x<givenRange[0]||x>givenRange[1]))return {...unknown,status:'outside-or-missing-qualified-range',formalConvertedSlope:formal,intercept:publicNumber(intercept)};
 return {...unknown,status:formal.value<0?'signed-product-slope':'calibrated-product-slope',formalConvertedSlope:formal,productSlope:formal,intercept:publicNumber(intercept),timeUnit:'s',productUnit:'μM'};
}
export function evaluateEnzymeSiteRatio(vmax,rawSites){
 const e=scaled(rawSites,{signed:false}),base={apparentPerSitePerMinute:null,apparentPerSitePerSecond:null,intrinsicCatalyticConstant:null,rawSites};
 if(typeof vmax!=='number'||!Number.isFinite(vmax)||vmax<0||vmax>1e12)return {...base,status:'model-maximum-unavailable'};
 if(e.status!=='observed')return {...base,status:e.status==='missing'?'sites-missing':'invalid-sites'};
 if(e.exact===0n)return {...base,status:vmax>0?'conflicting-zero-sites':'undefined-zero-over-zero'};
 return {...base,status:'conditional-apparent-turnover',apparentPerSitePerMinute:vmax/e.value,apparentPerSitePerSecond:vmax/e.value/60};
}
function caseBase(id){
 const second=id==='new-matrix';
 return {version:ENZYME_EVIDENCE_VERSION,caseId:id,origin:'original-synthetic-assay',substrateConcentration:second?'20':'500',substrateUnit:'μM',substrateAtWindowStart:true,times:second?['10','10.2','10.4']:['10','20','30'],timeUnit:'s',responseUnit:'AU',sampleA:second?['0.064','0.066','0.068']:['0.160','0.240','0.320'],sampleB:second?['0.062','0.063','0.064']:['0.080','0.120','0.160'],productStoichiometry:'本題選定產物按1:1記帳',conditionId:second?'C-B':'C-A'};
}
function packet(id,key,controls){
 const second=id==='new-matrix';
 if(key==='blank')return {status:'provided',times:second?['10','10.2','10.4']:['10','20','30'],A:second?['0.040','0.040','0.040']:['0.040','0.050','0.060'],B:second?['0.040','0.040','0.040']:['0.020','0.025','0.030'],unit:'AU',timeUnit:'s'};
 if(key==='calibration')return {status:'provided',conditionId:second?'C-B':'C-A',A:{status:'provided',m:controls.mA,b:'0.020',responseUnit:'AU',productUnit:'μM',matrixMatched:true,interceptConstant:true,validSignalRange:[-0.05,0.4]},B:{status:'provided',m:controls.mB,b:second?'0.020':'-0.010',responseUnit:'AU',productUnit:'μM',matrixMatched:true,interceptConstant:true,validSignalRange:[-0.05,0.4]},note:'AU校正=b+m[P]；b在此窗口內固定。校正按各自基質與所列訊號範圍給定，不是實測效能。'};
 if(key==='window')return {status:'provided',conditionId:second?'C-B':'C-A',times:second?['10','10.2','10.4']:['10','20','30'],timeUnit:'s',mixingSettledBeforeFirstPoint:true,postTransient:true,earlySubstrateChangeSmallGiven:true,calibrationAtQualification:{A:second?'0.020':'0.010',B:second?'0.020':'0.005'},oneToOneInventoryApproximationGiven:true,noSubstrateInputDuringWindowGiven:true,substrateIntermediatePoolNegligibleGiven:true,reverseAndProductEffectsNegligibleGiven:true,effectiveSitesStableInWindowGiven:true,note:'初速資格是針對所列原校正及條件給定。m改變後保留新形式換算，但原資格需重新核對；不以任何通用耗損百分比當通過門檻。'};
 if(!second)return {status:'not-provided'};
 if(key==='profile')return {status:'provided',conditionId:'C-B',substrates:[5,10,20,40,80],A:[12,20,30,40,48],B:[6,10,15,20,24],substrateUnit:'μM',rateUnit:'μM/min',initialRateConditionsGiven:true,origin:'original-no-noise-MM-points',note:'本題按指定MM模型生成，未加量測雜訊；不是實驗點、信賴區間或真實抑制作用證據。'};
 if(key==='sites')return {status:'provided',conditionId:'C-B',A:controls.activeA,B:controls.activeB,unit:'μM有效催化位點',sameConditionsAndWindowGiven:true,equivalentSitesGiven:true,note:'本題給定獨立計量，代表同一條件與窗口的有效催化位點，不是總蛋白或酵素分子濃度；等效位點及簡單MM適用性是明示前提。'};
 throw new RangeError('Unknown evidence packet');
}
export function visibleEnzymeEvidenceContext(d,id=d.caseId){
 if(!ENZYME_EVIDENCE_CASES.some(x=>x.id===id))throw new RangeError('Unknown case');
 const t=d.cases[id];return {...caseBase(id),caseShownInSession:d.visited.includes(id),workedSeen:d.workedSeen,hintSeen:t.hintSeen,opened:[...t.opened],evidence:Object.fromEntries(t.opened.map(k=>[k,packet(id,k,t.controls)]))};
}
function freezeInitial(d,trigger){const t=current(d);if(t.initial)return;t.initial=freeze(clone({prediction:t.prediction,trigger,context:visibleEnzymeEvidenceContext(d)}));lock(t,'prediction');}
export function openEnzymeEvidence(d,key){if(!ENZYME_EVIDENCE_PACKETS.some(x=>x.id===key))throw new RangeError('Unknown packet');const t=current(d);if(t.opened.includes(key))return false;freezeInitial(d,'查看記錄：'+ENZYME_EVIDENCE_PACKETS.find(x=>x.id===key).title);t.opened.push(key);return true;}
export function showEnzymeEvidenceWorked(d){if(d.caseId!=='paired-signal')return false;freezeInitial(d,'查看示範');d.workedSeen=true;d.workedOpen=!d.workedOpen;return true;}
export function showEnzymeEvidenceHint(d){if(d.caseId!=='paired-signal')return false;freezeInitial(d,'查看部分提示');current(d).hintSeen=true;return true;}
export function setEnzymeEvidenceControl(d,key,value){
 const t=current(d);if(!Object.hasOwn(t.controls,key)||typeof value!=='string')throw new TypeError('Unsupported raw control');
 const required=key.startsWith('m')?'calibration':'sites';if(!t.opened.includes(required)||packet(d.caseId,required,t.controls).status!=='provided')throw new RangeError('Evidence not provided');t.controls[key]=value;
}
const fitProfile=(p,key)=>fitMichaelisMenten(p.substrates.map((substrate,i)=>({substrate,velocity:p[key][i]})),{kmBounds:[.001,1000]});
const sameTimes=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===3&&b.length===3&&a.every((v,i)=>{const x=scaled(v,{signed:false}),y=scaled(b[i],{signed:false});return x.exact!==null&&y.exact!==null&&x.exact===y.exact;});
const currentToProfile=(m,p,key,index)=>{const r=m.calibration.productSlope,target=scaled(String(p[key][index]));if(!r||target.exact===null)return null;return BigInt(r.numerator)*60n*1000000n===target.exact*BigInt(r.denominator);};
export function evaluateEnzymeEvidence(c){
 const unknown={bindingMechanism:null,intrinsicCatalyticChange:null,foodEffect:null};
 if(!c||!ENZYME_EVIDENCE_CASES.some(x=>x.id===c.caseId)||!c.evidence)return {...unknown,status:'invalid-context'};
 const results={},w=c.evidence.window,b=c.evidence.blank,unitMatched=c.timeUnit==='s'&&c.responseUnit==='AU',blankMatched=b?.status==='provided'&&typeof c.timeUnit==='string'&&c.timeUnit.length>0&&typeof c.responseUnit==='string'&&c.responseUnit.length>0&&b.timeUnit===c.timeUnit&&b.unit===c.responseUnit&&sameTimes(c.times,b.times);
 for(const key of ['A','B']){
  const trace=analyzeEnzymeSignal({times:c.times,sample:c['sample'+key],blank:blankMatched?b[key]:null}),calibration=!unitMatched?{status:'measurement-units-not-matched',productSlope:null,formalConvertedSlope:null}:c.evidence.calibration?.status==='provided'&&c.evidence.calibration.conditionId!==c.conditionId?{status:'calibration-condition-not-matched',productSlope:null,formalConvertedSlope:null}:calibrateEnzymeSlope(trace,c.evidence.calibration?.[key]),substrate=scaled(c.substrateConcentration,{signed:false});
  trace.rawUnit=(typeof c.responseUnit==='string'?c.responseUnit:'未明示訊號單位')+'/'+(typeof c.timeUnit==='string'?c.timeUnit:'未明示時間單位');trace.blankPairStatus=blankMatched?'matched':b?.status==='provided'?'time-or-unit-mismatch':'not-provided';
  const t0=scaled(c.times?.[0],{signed:false}),t1=scaled(c.times?.[2],{signed:false}),dt=t0.exact===null||t1.exact===null?null:Number(t1.exact-t0.exact)/1e6,change=calibration.productSlope&&dt!==null?calibration.productSlope.value*dt:null,fraction=change!==null&&substrate.value>0?Math.abs(change)/substrate.value:null,originalM=scaled(w?.calibrationAtQualification?.[key]),currentM=scaled(c.evidence.calibration?.[key]?.m),qualificationCalibrationMatches=originalM.exact!==null&&currentM.exact!==null&&originalM.exact===currentM.exact,inventoryPremises=w?.oneToOneInventoryApproximationGiven===true&&w.noSubstrateInputDuringWindowGiven===true&&w.substrateIntermediatePoolNegligibleGiven===true&&c.substrateAtWindowStart===true&&c.substrateUnit==='μM',substrateInventoryConflict=inventoryPremises&&change>0&&fraction!==null&&fraction>1;
  const qualified=w?.status==='provided'&&w.conditionId===c.conditionId&&w.timeUnit===c.timeUnit&&sameTimes(c.times,w.times)&&w.mixingSettledBeforeFirstPoint===true&&w.postTransient===true&&w.earlySubstrateChangeSmallGiven===true&&qualificationCalibrationMatches&&inventoryPremises&&!substrateInventoryConflict&&w.reverseAndProductEffectsNegligibleGiven===true&&w.effectiveSitesStableInWindowGiven===true&&trace.linearAcrossGivenPoints===true&&calibration.productSlope!==null&&calibration.productSlope.value>=0;
  results[key]={trace,calibration,windowSubstrateChange:change,windowChangeFraction:fraction,qualificationCalibrationMatches,substrateInventoryConflict,conditionalInitialRate:qualified?calibration.productSlope.value:null};
 }
 const p=c.evidence.profile,s=c.evidence.sites;let profiles=null,sites=null,traceProfileConsistency=null,perSiteProfilesCompatible=null;
 if(p?.status==='provided'&&p.conditionId===c.conditionId&&p.rateUnit==='μM/min'&&p.substrateUnit==='μM'&&p.initialRateConditionsGiven===true){try{profiles={A:fitProfile(p,'A'),B:fitProfile(p,'B')};const index=p.substrates.indexOf(Number(c.substrateConcentration));if(index>=0)traceProfileConsistency={A:currentToProfile(results.A,p,'A',index),B:currentToProfile(results.B,p,'B',index)};}catch{profiles=null;}}
 if(profiles&&s?.status==='provided'&&s.conditionId===c.conditionId&&s.sameConditionsAndWindowGiven===true&&s.equivalentSitesGiven===true&&s.unit==='μM有效催化位點')sites={A:evaluateEnzymeSiteRatio(profiles.A.vmax,s.A),B:evaluateEnzymeSiteRatio(profiles.B.vmax,s.B)};
 if(sites&&['A','B'].every(k=>sites[k].status==='conditional-apparent-turnover')){const a=scaled(s.A,{signed:false}),b=scaled(s.B,{signed:false});perSiteProfilesCompatible=p.A.every((v,i)=>{const x=scaled(String(v)),y=scaled(String(p.B[i]));return x.exact!==null&&y.exact!==null&&x.exact*b.exact===y.exact*a.exact;});}
 return {...unknown,status:'evidence-dependent',measurements:results,profiles,sites,traceProfileConsistency,perSiteProfilesCompatible};
}
const fmt=n=>n===null?'未知':Number(n.toPrecision(8)).toString();
export function enzymeEvidenceReference(c){
 const r=evaluateEnzymeEvidence(c),steps=[];
 for(const key of ['A','B']){
  const m=r.measurements[key],raw=m.trace.rawSignalSlope?.value,corr=m.trace.correctedSignalSlope?.value,v=m.calibration.productSlope?.value;
  steps.push(`${key}：樣品訊號窗口斜率${raw===undefined?'未知':fmt(raw)} ${m.trace.rawUnit}；逐時配對空白後${corr===undefined?'尚無可報斜率':fmt(corr)+' '+m.trace.rawUnit}。這是有限窗口，不是自動成立的初速。`);
  if(m.trace.blankPairStatus==='time-or-unit-mismatch')steps.push(`${key}：空白時間點或訊號／時間單位與樣品未對應，未將它們當逐時配對資料扣除。`);
  if(v===undefined)steps.push(`${key}：濃度斜率尚不能報（${{'calibration-unavailable':'尚無同基質校正','corrected-slope-unavailable':'配對後斜率不足','sensitivity-missing':'靈敏度未知','invalid-sensitivity':'靈敏度原文無效','zero-sensitivity':'m=0不能換算','calibration-qualification-unavailable':'校正對象、單位或固定截距前提不足','outside-or-missing-qualified-range':'訊號缺項或超出給定有效範圍','measurement-units-not-matched':'訊號／時間單位未對應本例換算','calibration-condition-not-matched':'校正記錄與案件條件未對應'}[m.calibration.status]??'仍需核對校正'}）；已知原訊號斜率不因此抹去。`);
  else steps.push(`${key}：按各自有效m換算的產物濃度窗口斜率=${fmt(v)} μM/s。固定截距b不改斜率；不能用固定首點空白代替逐時漂移。${v<0?'負的換算斜率保留為觀測，與本題指定正向生成/MM模型不相容，不截成零。':''}`);
  steps.push(`${key}：${m.conditionalInitialRate===null?'目前沒有完整相符的初速資格，或斜率與正向模型不相容；不把上述窗口數字直接命名v₀。':`在本題已給定的初速近似條件下，可條件式報v₀≈${fmt(m.conditionalInitialRate)} μM/s。三點線性只是其中一項，不是所有假設的證明。`}`);
  if(v!==undefined&&m.windowChangeFraction!==null)steps.push(`${key}：按新換算的窗口產物變化=${fmt(m.windowSubstrateChange)} μM，變化絕對值約占窗口起點[S]的${fmt(m.windowChangeFraction*100)}%。${m.substrateInventoryConflict?'已超過本題1:1、無補料且忽略中間體受質儲量時的近似可用庫存，資料／前提不相容。':''}${!m.qualificationCalibrationMatches?'校正m與原初速資格記錄不同，需重新核實資格，不套通用耗損門檻。':''}`);
 }
 if(r.profiles){for(const key of ['A','B'])steps.push(`${key}的原創多受質點以既有NLS模組得Vfit≈${fmt(r.profiles[key].vmax)} μM/min、Kfit≈${fmt(r.profiles[key].km)} μM；零／極小殘差來自模型生成點，不能當實驗精度或結合證明。`);}else steps.push('尚無此案相符的多受質初速資料；一個[S]下的相同或不同速率，不給完整Vmax/Km或抑制分類。');
 if(r.traceProfileConsistency)for(const key of ['A','B'])if(r.traceProfileConsistency[key]===false)steps.push(`${key}：按目前校正換算的同[S]窗口斜率（換成μM/min）與已給多受質表的對應速率不同；保留兩份各自報值，先核對校正、初速資格及條件，不能默認拼成同一一致證據鏈。`);
 if(r.sites){for(const key of ['A','B']){const s=r.sites[key];steps.push(s.status==='conditional-apparent-turnover'?`${key}：Vfit/[E]active≈${fmt(s.apparentPerSitePerMinute)} min⁻¹≈${fmt(s.apparentPerSitePerSecond)} s⁻¹，僅為指定MM及等效位點前提下的表觀每位點周轉；不是已證實的本徵kcat。`:s.status==='conflicting-zero-sites'?`${key}：有效位點給0，卻有正Vfit，這些前提／資料不相容，不能算無限周轉。`:`${key}：有效位點缺值、無效或零分母，未給表觀周轉；不拿蛋白毫克數補分母。`);}steps.push(r.perSiteProfilesCompatible===true?'只就多受質表與獨立位點資料，在明示模型內各點的位點正規化比例相容，量差可解釋此表的比例；這不證明無抑制、整案資料一致或本徵催化相同。':r.perSiteProfilesCompatible===false?'目前有效位點比例與多受質速率比例不相符，不能說位點量差已足以解釋此表；仍需查每位點作用、量測或其他條件。':'有效位點資料缺值／無效／零分母，未建立量差可以解釋多受質表的結論。');}else steps.push('尚未取得相符有效位點資料，不能把Vmax差異直接翻成每位點催化差異。');
 steps.push('結論分三層：報出有資料支持的訊號／產物速率；交代初速與模型條件；再提出可區分量測、有效酵素量與抑制等解釋的證據。曲線、擬合或3D都不單獨指認真實結合位置。');
 return {result:r,steps};
}
export function checkEnzymeEvidence(d){const t=current(d);if(t.checked)return false;freezeInitial(d,'查看參考核對');const context=visibleEnzymeEvidenceContext(d);t.checked=freeze(clone({response:t.response,context,result:evaluateEnzymeEvidence(context)}));lock(t,'response');return true;}
export function enzymeEvidenceStale(d,id=d.caseId){const t=d.cases[id];return !!t.checked&&JSON.stringify(t.checked.context)!==JSON.stringify(visibleEnzymeEvidenceContext(d,id));}
function compactFeedback(r){
 const out=[];for(const key of ['A','B']){const m=r.measurements[key];out.push(`${key}：原訊號斜率=${fmt(m.trace.rawSignalSlope?.value??null)} ${m.trace.rawUnit}；配對空白後=${fmt(m.trace.correctedSignalSlope?.value??null)} ${m.trace.rawUnit}；配對狀態=${m.trace.blankPairStatus}；校正狀態=${m.calibration.status}；產物窗口斜率=${fmt(m.calibration.productSlope?.value??null)} μM/s；條件式初速=${fmt(m.conditionalInitialRate)} μM/s；庫存不相容=${m.substrateInventoryConflict?'是':'未見此矛盾'}。`);}
 if(r.profiles)out.push(...['A','B'].map(k=>`${k}：Vfit≈${fmt(r.profiles[k].vmax)} μM/min；Kfit≈${fmt(r.profiles[k].km)} μM；模型生成點並非實測精度。`));
 if(r.sites)out.push(...['A','B'].map(k=>`${k}有效位點：${r.sites[k].status}；表觀每位點周轉≈${fmt(r.sites[k].apparentPerSitePerMinute)} min⁻¹，非本徵kcat證明。`));
 if(r.traceProfileConsistency)out.push('同[S]窗口與多點表對照：'+JSON.stringify(r.traceProfileConsistency)+'；false時不能默認拼成一致鏈。');
 out.push('有效位點／多點表比例：'+(r.perSiteProfilesCompatible===true?'在本題條件內相容':r.perSiteProfilesCompatible===false?'不相符':'未建立')+'。未見資料保留未知，單一[S]不給完整參數；結合機制、本徵催化及是否有共同變化仍未確定。');return out;
}
export function buildEnzymeEvidenceSummary(d){
 const entries=[],ids=new Map(),register=c=>{const k=JSON.stringify(c);if(!ids.has(k)){ids.set(k,'C'+(entries.length+1));entries.push({id:ids.get(k),context:c});}return ids.get(k);};
 const cases=ENZYME_EVIDENCE_CASES.map(s=>{const t=d.cases[s.id],included=d.visited.includes(s.id)||t.initial||t.checked||t.opened.length||[t.prediction,t.response,t.revision].some(x=>x.length>0);return {s,t,included,current:included?register(visibleEnzymeEvidenceContext(d,s.id)):null,initial:t.initial?register(t.initial.context):null,checked:t.checked?register(t.checked.context):null};});
 const lines=['【酵素量測取證：從訊號到速率與解釋】','固定版本：'+ENZYME_EVIDENCE_VERSION,'兩案是獨立原創合成資料；不是實驗、真實食品或菌株效能。曾顯示不表示讀懂，不宣稱盲測。','題設登錄（僅曾顯示或已有草稿／事件的案件；未開證據不放入）：',...entries.map(x=>x.id+' '+JSON.stringify(x.context))];
 for(const {s,t,included,current,initial,checked}of cases){lines.push(s.title);if(!included){lines.push('未記錄顯示或作答，本案原始資料未加入摘要。');continue;}lines.push(d.visited.includes(s.id)?'本案曾在本工作階段顯示；不表示已讀懂。':'本案已有草稿／事件，但未記錄畫面顯示。','目前題設='+current);if(t.initial)lines.push('補證據前題設='+initial,'初判固定觸發='+t.initial.trigger,'補證據前完整初判：',t.initial.prediction);else lines.push('初判尚未固定：',t.prediction);if(t.checked)lines.push('首次核對題設='+checked,'首次完整推理：',t.checked.response,...compactFeedback(t.checked.result));else lines.push('尚未看參考，不放入答案。','目前完整推理：',t.response);lines.push('完整修訂：',t.revision);if(enzymeEvidenceStale(d,s.id))lines.push('目前可見證據／條件已改，首次核對只屬歷史，不能當作目前判定。');}
 lines.push('自己的完整整合：',d.synthesis,'來源：',...ENZYME_EVIDENCE_SOURCES.map(x=>x.title+' '+x.url+'；'+x.scope),'具體補救：',...ENZYME_EVIDENCE_REMEDIATION.map(x=>x.label+' '+x.href),'只有成功附加的摘要隨原初速課筆記保存；草稿限同一頁面工作階段，長答不截斷。');return lines.join('\n');
}
