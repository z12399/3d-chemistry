/** Original symbolic aroma evidence cases. No empirical release, reaction or sensory prediction. */
export const AROMA_EVIDENCE_ID='aroma-evidence-chain';
export const AROMA_EVIDENCE_VERSION='aroma-evidence-v1';
const clone=x=>structuredClone(x),freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;},lock=(o,k)=>Object.defineProperty(o,k,{value:o[k],enumerable:true,writable:false,configurable:false});
export const AROMA_EVIDENCE_CASES=freeze([{id:'closed-pair',title:'兩個比較瓶的端點與氣相'},{id:'changed-records',title:'另一基質與另一份分析記錄'}]);
export const AROMA_EVIDENCE_VARIANTS=freeze([{id:'gas-record',label:'版本一：氣樣記錄'},{id:'fiber-record',label:'版本二：纖維記錄'}]);
export const AROMA_EVIDENCE_SOURCES=freeze([
 {id:'cf-pyrazine-paths',title:'Shibamoto與Bernhard (1977)：吡嗪形成路徑',url:'https://www.tandfonline.com/doi/abs/10.1080/00021369.1977.10862443',fullTextUrl:'https://www.jstage.jst.go.jp/article/bbb1961/41/1/41_1_143/_pdf',scope:'只採所研究糖／氨模型的α-胺基羰基與成環支路假說；作者未隔離中間體，偏好含羥基成環中間體脫水，不把外加O₂當必要條件。'},
 {id:'flavor-partition',title:'Roberts等 (2003)：乳液中的香氣釋放',url:'https://pubmed.ncbi.nlm.nih.gov/12502406/',scope:'基質、分配及量測條件的重要性；本台K、體積與存量不是該研究數據，也不把真實多相食品簡化成通用兩相公式。'},
 {id:'cf-sunflower-aroma',title:'Laemont與Barringer (2023)：葵花籽香氣研究',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10670587/',scope:'方法與感官端點分開閱讀；頭空間分析不是食品總量，喜好不是強度。本台沒有重現其處理條件或數據。'},
 {id:'sensory-source-mixtures-2012',title:'Johnson等 (2012)：氣味混合物辨識',url:'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0042693',scope:'混合物感知需直接證據；不由單一分子氣相濃度推總強度、喜好或安全。'},
]);
export const AROMA_EVIDENCE_REMEDIATION=freeze([
 {id:'maillard',label:'先有糖與胺基的反應網絡',href:'#learn/browning/browning-maillard/understand'},
 {id:'strecker',label:'Strecker分支與含氮中間體',href:'#learn/flavor/flavor-strecker/understand'},
 {id:'carbon',label:'Strecker碳骨架的去向',href:'#learn/browning/browning-strecker-carbon-map/understand'},
 {id:'partition',label:'同溫、同基準的分配係數',href:'#learn/flavor/flavor-partition/understand'},
 {id:'threshold',label:'閾值的單位、基質與途徑',href:'#learn/flavor/flavor-threshold-basis/understand'},
 {id:'oav',label:'OAV候選篩選與混合物證據',href:'#learn/flavor/flavor-odor-activity/understand'},
]);
const trial=controls=>({controls,response:'',beforeSupport:null,checked:null,revision:'',hintSeen:false});
export function createAromaEvidenceDraft(){return {caseId:'closed-pair',variant:'gas-record',visited:[],seenVariants:[],shownContexts:[],displayLog:[],workedSeen:false,workedOpen:false,mechanismSeen:false,cases:{'closed-pair':trial({nA:'120',nB:'120',kA:'0.1',kB:'0.05',gasB:'100',mB:'100'}),'changed-records':trial({nA:'120',nB:'180',kA:'0.1',kB:'0.05',gasB:'50',mB:'200'})},details:{},synthesis:''};}
export function selectAromaEvidenceCase(d,id){if(!AROMA_EVIDENCE_CASES.some(x=>x.id===id))throw new RangeError('Unknown case');d.caseId=id;}
export function markAromaEvidenceCaseShown(d){
 if(!AROMA_EVIDENCE_CASES.some(x=>x.id===d.caseId))throw new RangeError('Unknown case');if(!d.visited.includes(d.caseId))d.visited.push(d.caseId);
 d.seenVariants??=[];d.shownContexts??=[];d.displayLog??=[];const variant=d.caseId==='closed-pair'?'paired-equilibrium':d.variant;if(!d.seenVariants.includes(variant))d.seenVariants.push(variant);
 const context=visibleAromaEvidenceContext(d),key=JSON.stringify(context);let index=d.shownContexts.findIndex(c=>JSON.stringify(c)===key);if(index<0){index=d.shownContexts.length;d.shownContexts.push(freeze(clone(context)));}const id=index+1;if(d.displayLog.at(-1)!==id)d.displayLog.push(id);
}
export function setAromaEvidenceVariant(d,id){if(d.caseId!=='changed-records'||!AROMA_EVIDENCE_VARIANTS.some(x=>x.id===id))throw new RangeError('Unknown variant');d.variant=id;}
function number(raw,{signed=false}={}){
 if(raw===null||raw===undefined||raw==='')return {raw,status:'missing',value:null,exact:null};
 if(typeof raw!=='string'||raw.length>32||! /^(?:-?(?:0|[1-9]\d*)(?:\.\d{1,6})?)$/.test(raw))return {raw,status:'invalid',value:null,exact:null};
 const neg=raw.startsWith('-'),s=neg?raw.slice(1):raw,[w,f='']=s.split('.'),n=(neg?-1n:1n)*(BigInt(w)*1000000n+BigInt(f.padEnd(6,'0')));
 if(!signed&&n<0n||n>1000000000000n||n< -1000000000000n)return {raw,status:'invalid',value:null,exact:null};
 return {raw,status:'given',value:Number(n)/1e6,exact:n};
}
const publicNumber=({exact,...x})=>x,quotient=(n,d)=>{if(d<0n){n=-n;d=-d;}return {value:Number(n)/Number(d),numerator:n.toString(),denominator:d.toString()};},equal=(a,b)=>a!==null&&b!==null&&BigInt(a.numerator)*BigInt(b.denominator)===BigInt(b.numerator)*BigInt(a.denominator),compare=(a,b)=>a===null||b===null?null:BigInt(a.numerator)*BigInt(b.denominator)>BigInt(b.numerator)*BigInt(a.denominator)?1:equal(a,b)?0:-1;
/** K=Cgas/Cliquid, both ng/mL, specified single-liquid/gas equilibrium. N is retained endpoint inventory. */
export function solveAromaInventory(input={}){
 if(!input||typeof input!=='object')input={};
 const n=number(input.inventory),l=number(input.liquidVolume),g=number(input.gasVolume),k=number(input.coefficient),t=number(input.temperature,{signed:true}),kt=number(input.coefficientTemperature,{signed:true});
 const base={raw:{...input},knownInventory:n.status==='given'&&input.inventoryUnit==='ng'?n.value:null,inputs:{inventory:publicNumber(n),liquidVolume:publicNumber(l),gasVolume:publicNumber(g),coefficient:publicNumber(k)},liquidConcentration:null,gasConcentration:null,liquidMass:null,gasMass:null,cumulativeFormation:null};
 if([n,l,g,k].some(x=>x.status!=='given'))return {...base,status:'missing-or-invalid-number'};
 if(l.exact===0n||g.exact===0n)return {...base,status:'two-phases-require-positive-volumes'};
 if(input.inventoryUnit!=='ng'||input.volumeUnit!=='mL'||input.coefficientBasis!=='ng/mL / ng/mL')return {...base,status:'unit-basis-not-matched'};
 if(typeof input.compound!=='string'||!input.compound||input.boundary!=='sealed-before-sampling'||input.equilibrium!=='given'||input.phases!=='one-liquid-one-gas'||input.inventoryConstant!=='given')return {...base,status:'equilibrium-boundary-not-qualified'};
 if(t.exact===null||kt.exact===null||t.exact!==kt.exact)return {...base,status:'coefficient-temperature-not-matched'};
 const denominator=l.exact*1000000n+k.exact*g.exact;
 return {...base,status:'qualified-conditional-equilibrium',liquidConcentration:quotient(n.exact*1000000n,denominator),gasConcentration:quotient(n.exact*k.exact,denominator),liquidMass:quotient(n.exact*l.exact,denominator),gasMass:quotient(n.exact*k.exact*g.exact,denominator*1000000n)};
}
/** This is a supplied, matrix/method/compound-bound calibration; no peak-to-concentration universal conversion. */
export function calibrateAromaSignal(record={}){
 if(!record||typeof record!=='object')record={};
 const signal=number(record.signal,{signed:true}),m=number(record.calibration?.m,{signed:true}),b=number(record.calibration?.b,{signed:true}),base={rawSignal:publicNumber(signal),signalUnit:record.signalUnit??null,formalConcentration:null,gasConcentration:null};
 if(signal.status!=='given')return {...base,status:'signal-missing-or-invalid'};
 const cal=record.calibration;if(!cal||cal.status!=='provided')return {...base,status:'calibration-not-provided'};
 if(m.status!=='given'||b.status!=='given')return {...base,status:'calibration-number-missing-or-invalid'};
 if(m.exact===0n)return {...base,status:'zero-sensitivity'};
 const formal=quotient(signal.exact-b.exact,m.exact);base.formalConcentration=formal;
 const temperature=number(record.temperature,{signed:true}),calTemperature=number(cal.temperature,{signed:true});
 if(record.method!=='gas-aliquot'||cal.method!==record.method||typeof record.conditionId!=='string'||!record.conditionId||cal.conditionId!==record.conditionId||typeof record.compound!=='string'||!record.compound||cal.compound!==record.compound||record.phase!=='gas'||cal.phase!=='gas'||typeof record.signalUnit!=='string'||!record.signalUnit||cal.signalUnit!==record.signalUnit||cal.concentrationUnit!=='ng/mL'||temperature.exact===null||calTemperature.exact===null||temperature.exact!==calTemperature.exact)return {...base,status:'calibration-object-or-condition-not-matched'};
 const range=cal.signalRange;if(!Array.isArray(range)||range.length!==2||range.some(x=>!Number.isFinite(x))||range[0]>range[1]||signal.value<range[0]||signal.value>range[1])return {...base,status:'outside-qualified-range'};
 if(formal.value<0)return {...base,status:'negative-derived-concentration'};
 return {...base,status:'qualified-calibrated-gas',gasConcentration:formal};
}
function vessel({n,k,id,gas='100',equilibrium='given',boundary='sealed-before-sampling',temperature='25',coefficientTemperature='25'}){return {compound:'P',conditionId:id,inventory:n,inventoryUnit:'ng',liquidVolume:'10',gasVolume:gas,volumeUnit:'mL',coefficient:k,coefficientBasis:'ng/mL / ng/mL',temperature,coefficientTemperature,equilibrium,boundary,phases:'one-liquid-one-gas',inventoryConstant:'given'};}
function instrument({id,signal,m,method='gas-aliquot',signalUnit='AU'}){return {compound:'P',phase:'gas',conditionId:id,temperature:'25',method,signal,signalUnit,calibration:method==='gas-aliquot'?{status:'provided',compound:'P',phase:'gas',conditionId:id,temperature:'25',method,signalUnit,concentrationUnit:'ng/mL',m,b:'10',signalRange:[0,1000]}:{status:'not-provided'}};}
export function visibleAromaEvidenceContext(d,id=d.caseId){
 if(!AROMA_EVIDENCE_CASES.some(x=>x.id===id))throw new RangeError('Unknown case');const t=d.cases[id],c=t.controls,second=id==='changed-records',fiber=second&&d.variant==='fiber-record';
 return {version:AROMA_EVIDENCE_VERSION,caseId:id,variant:second?d.variant:'paired-equilibrium',origin:'original-synthetic-P',caseShown:d.visited.includes(id),seenCases:[...d.visited],seenVariants:[...(d.seenVariants??[])],workedSeen:d.workedSeen,mechanismSeen:d.mechanismSeen,hintSeen:t.hintSeen,inventoryBoundary:'取樣前瓶內液相與氣相合計的P期末存量；兩組均以ng/完整比較瓶報告',A:vessel({n:c.nA,k:c.kA,id:'matrix-A-gas25'}),B:vessel({n:c.nB,k:c.kB,id:second?'matrix-C-gas25':'matrix-B-gas25',gas:c.gasB,equilibrium:fiber?'not-established':'given',boundary:fiber?'fiber-sampling':'sealed-before-sampling'}),analysis:{A:instrument({id:'matrix-A-gas25',signal:'70',m:'100'}),B:instrument({id:second?'matrix-C-gas25':'matrix-B-gas25',signal:second?'154':'50',m:c.mB,method:fiber?'fiber-extract':'gas-aliquot',signalUnit:fiber?'area-unit':'AU'})},sensory:{record:'not-provided',object:'指定氣味強度與整體喜好分開'}};
}
const current=d=>d.cases[d.caseId];
function retainBeforeSupport(d,trigger){const t=current(d);if(!t.beforeSupport)t.beforeSupport=freeze(clone({response:t.response,trigger,context:visibleAromaEvidenceContext(d)}));}
export function showAromaEvidenceWorked(d){if(d.caseId!=='closed-pair')return false;retainBeforeSupport(d,'查看獨立示範');d.workedSeen=true;d.workedOpen=!d.workedOpen;return true;}
export function showAromaEvidenceHint(d){if(d.caseId!=='closed-pair')return false;retainBeforeSupport(d,'查看部分提示');current(d).hintSeen=true;return true;}
export function markAromaMechanismSeen(d){retainBeforeSupport(d,'展開機制支線');d.mechanismSeen=true;}
export function setAromaEvidenceControl(d,key,value){const t=current(d);if(!Object.hasOwn(t.controls,key)||typeof value!=='string')throw new TypeError('Unsupported raw input');t.controls[key]=value;}
export function evaluateAromaEvidence(c){
 if(!c||!AROMA_EVIDENCE_CASES.some(x=>x.id===c.caseId)||!c.A||!c.B||!c.analysis?.A||!c.analysis?.B)return {status:'invalid-context',cumulativeFormation:null,perceivedIntensity:null,preference:null};
 const sameTemperature=(a,b)=>{const x=number(a,{signed:true}),y=number(b,{signed:true});return x.exact!==null&&y.exact!==null&&x.exact===y.exact;},A=solveAromaInventory(c.A),B=solveAromaInventory(c.B),a=calibrateAromaSignal(c.analysis.A),b=calibrateAromaSignal(c.analysis.B),binding=(v,r)=>v.raw.compound===r.compound&&v.raw.conditionId===r.conditionId&&sameTemperature(v.raw.temperature,r.temperature),consistent=(v,r,analysis)=>v.gasConcentration&&r.gasConcentration?binding(v,analysis)?equal(v.gasConcentration,r.gasConcentration):false:null,analysisComparable=c.analysis.A.compound===c.analysis.B.compound&&sameTemperature(c.analysis.A.temperature,c.analysis.B.temperature);
 return {status:'evidence-dependent',A,B,analysis:{A:a,B:b},agreement:{A:consistent(A,a,c.analysis.A),B:consistent(B,b,c.analysis.B)},inventoryOrder:typeof c.A.compound!=='string'||!c.A.compound||c.A.compound!==c.B.compound||A.knownInventory===null||B.knownInventory===null?null:compare(quotient(number(c.B.inventory).exact,1000000n),quotient(number(c.A.inventory).exact,1000000n)),gasOrder:analysisComparable?compare(b.gasConcentration,a.gasConcentration):null,analysisComparable,cumulativeFormation:null,perceivedIntensity:null,preference:null};
}
const fmt=n=>n===null?'未知':Number(n.toPrecision(8)).toString(),qfmt=q=>q?fmt(q.value):'未知';
export function aromaEvidenceReference(c){
 const r=evaluateAromaEvidence(c);if(r.status==='invalid-context')return {result:r,steps:['題設未完整，保留原文再核對。']};const steps=[];
 for(const key of ['A','B']){const v=r[key],a=r.analysis[key];steps.push(`${key}：P期末總存量=${v.knownInventory===null?'未知':v.inputs.inventory.raw} ng/完整比較瓶。這個端點不是累積生成量。`);if(v.status==='qualified-conditional-equilibrium')steps.push(`${key}：由N=C_lV_l+C_gV_g與K=C_g/C_l，得C_l≈${qfmt(v.liquidConcentration)}、C_g≈${qfmt(v.gasConcentration)} ng/mL；液相量≈${qfmt(v.liquidMass)}、氣相量≈${qfmt(v.gasMass)} ng。近似顯示不替代原始值。`);else steps.push(`${key}：未算兩相平衡量（${{'missing-or-invalid-number':'某項數字缺失或無效，未知不補0','two-phases-require-positive-volumes':'兩相各須有正體積','unit-basis-not-matched':'量與濃度基準未相符','equilibrium-boundary-not-qualified':'目前邊界／平衡資格不支持該兩相帳','coefficient-temperature-not-matched':'K與樣品溫度未知或不相符'}[v.status]??v.status}）；獨立已知存量仍可報。`);steps.push(`${key}：原始訊號=${a.rawSignal.status==='given'?fmt(a.rawSignal.value):'未知'} ${a.signalUnit??'未明示單位'}。${a.gasConcentration?`按本案相符校正，C_g=(訊號−b)/m≈${qfmt(a.gasConcentration)} ng/mL。`:`尚不能報校正氣相濃度（${{'calibration-not-provided':'未附該方法校正','zero-sensitivity':'m=0不能反算','signal-missing-or-invalid':'訊號原文缺失／無效','calibration-number-missing-or-invalid':'校正數字缺失／無效','calibration-object-or-condition-not-matched':'分析物、相、方法、條件或單位未對應','outside-qualified-range':'超出所給校正範圍','negative-derived-concentration':'形式反算為負，不能當非負濃度'}[a.status]??a.status}）。`}`);if(r.agreement[key]===false)steps.push(`${key}：平衡帳與分析讀值／條件不相容，須保留兩份觀察分別查明，不能默默拼成一致證據。`);}
 steps.push(r.inventoryOrder===null?'目前缺相符存量，未排序期末存量。':`依原始十進位數字精確比較，B相對A的期末總存量${r.inventoryOrder===0?'相同':r.inventoryOrder>0?'較高':'較低'}；${r.gasOrder===null?'目前沒有兩筆可對照的校正氣相濃度。':`本題各自校正後的氣相濃度${r.gasOrder===0?'相同':r.gasOrder>0?'B較高':'B較低'}。`}跨基質的這個物理濃度比較，仍不是共同基質的OAV或感知排序。`);
 for(const key of ['A','B']){if(r[key].status==='qualified-conditional-equilibrium'&&r[key].knownInventory===0)steps.push(`${key}：N=0時本模型兩相濃度皆0，但C_g/C_l是0/0未定義；不能由此反推已測K=0。`);if(r[key].status==='qualified-conditional-equilibrium'&&r[key].inputs.coefficient.value===0)steps.push(`${key}：K=0僅是本台允許的數學極限，不冒稱任何真實吡嗪已測分配常數。`);}
 steps.push('K是同基準濃度比，不是氣相質量分率，也不給釋放速率；相體積與當時總存量同樣要進帳。');
 steps.push('一條有來源的候選支路：Shibamoto與Bernhard (1977)在特定糖／氨模型提出α-胺基羰基片段→成環中間體→後續芳香化的解釋，偏好含羥基中間體脫水；作者未隔離所提中間體，這不是唯一路徑，也不把外加O₂當必要條件。它尚不是本案P已沿此支路形成的證明。');
 steps.push('本案25°C只屬分配與分析條件，不能當作先前形成的溫度歷程。還需查前驅物、反應pH／水狀態及時間—溫度歷程等，結合可區分支路的生成／轉化觀察；不能由給定K、顏色或氣相端點選定形成機制。');
 steps.push('形成假說要另有初始存量、逸散／轉移與後續轉化的邊界帳，才能區分累積生成與期末留存；同色、單一峰面積或一個期末量都不單獨證明形成速率或機制。');
 steps.push('若改成纖維萃取峰面積，需該方法對指定分析物及基質的校正，並核取樣是否擾動平衡；沒有這些資格時不能拿峰面積當C_g或套未受擾兩相帳。感知強度需對應條件的直接感官證據；喜好是另一問題，OAV不相加成強度。');
 return {result:r,steps};
}
export function checkAromaEvidence(d){const t=current(d);if(t.checked)return false;retainBeforeSupport(d,'首次核對');const context=visibleAromaEvidenceContext(d);t.checked=freeze(clone({response:t.response,context,result:evaluateAromaEvidence(context)}));lock(t,'response');return true;}
const facts=c=>{const {caseShown,seenCases,seenVariants,workedSeen,mechanismSeen,hintSeen,...rest}=c;return rest;},exposure=c=>({caseShown:c.caseShown,seenCases:c.seenCases,seenVariants:c.seenVariants??[],workedSeen:c.workedSeen,mechanismSeen:c.mechanismSeen,hintSeen:c.hintSeen});
export function aromaEvidenceStale(d,id=d.caseId){const t=d.cases[id];return !!t.checked&&JSON.stringify(facts(t.checked.context))!==JSON.stringify(facts(visibleAromaEvidenceContext(d,id)));}
function compact(r){const out=[];if(r.status!=='evidence-dependent')return ['當時題設未完整。'];for(const k of ['A','B']){const v=r[k],a=r.analysis[k];out.push(`${k}：期末N=${v.knownInventory===null?'未知':v.inputs.inventory.raw} ng；平衡=${v.status}；C_l≈${qfmt(v.liquidConcentration)}、C_g≈${qfmt(v.gasConcentration)} ng/mL；液/氣相量≈${qfmt(v.liquidMass)}/${qfmt(v.gasMass)} ng；分析=${a.status}；校正C_g≈${qfmt(a.gasConcentration)} ng/mL；帳與分析相容=${r.agreement[k]===null?'未建立':r.agreement[k]?'是':'否'}。`);}out.push('候選支路可引1977特定糖／氨模型：α-胺基羰基→成環中間體→後續芳香化；未隔離中間體，非唯一路徑或O₂必需。25°C僅分配／分析，不能代生成歷程證據。','可報端點與條件分開；期末存量不等於累積生成，氣相濃度不等於強度／喜好／安全。');return out;}
export function buildAromaEvidenceSummary(d){
 const contexts=[],ids=new Map(),register=c=>{const context=facts(c),key=JSON.stringify(context);if(!ids.has(key)){ids.set(key,'C'+(contexts.length+1));contexts.push({id:ids.get(key),context});}return ids.get(key);},cases=AROMA_EVIDENCE_CASES.map(s=>{const t=d.cases[s.id],included=d.visited.includes(s.id)||t.beforeSupport||t.checked||t.response.length||t.revision.length,c=included?visibleAromaEvidenceContext(d,s.id):null;return {s,t,included,current:included?register(c):null,currentExposure:c?exposure(c):null,before:t.beforeSupport?register(t.beforeSupport.context):null,checked:t.checked?register(t.checked.context):null};});
 const displays=(d.shownContexts??[]).map((c,i)=>({id:'V'+(i+1),facts:register(c),exposure:exposure(c)}));
 const lines=['【吡嗪到感知：香氣證據鏈】','固定題設版本：'+AROMA_EVIDENCE_VERSION,'全為原創合成數字／校正／比較案，非實測曲線或真實食品參數。曾顯示不代表讀懂，不宣稱盲測。','題設登錄（僅曾顯示或已有作答／事件的案件；固定定義依上述版本）：',...contexts.map(x=>x.id+' '+JSON.stringify(x.context))];
 lines.push('實際畫面顯示登錄（同一題設與曝光用V編號引用；不表示讀懂）：',...displays.map(x=>x.id+' 題設='+x.facts+' 曝光='+JSON.stringify(x.exposure)),'顯示先後（連續完全相同畫面去重）：'+((d.displayLog??[]).map(id=>'V'+id).join(' → ')||'尚未記錄實際顯示'));
 for(const {s,t,included,current,currentExposure,before,checked}of cases){lines.push(s.title);if(!included){lines.push('未記錄顯示或作答，未加入本案原始資料。');continue;}lines.push(d.visited.includes(s.id)?'本案曾顯示；不表示已讀懂。':'本案已有稿／事件，但未記錄畫面顯示。','目前題設='+current,'目前曝光='+JSON.stringify(currentExposure));if(t.beforeSupport)lines.push('首次支援／核對前題設='+before,'當時曝光='+JSON.stringify(exposure(t.beforeSupport.context)),'固定觸發='+t.beforeSupport.trigger,'當時完整原稿：',t.beforeSupport.response);if(t.checked)lines.push('首次核對題設='+checked,'核對時曝光='+JSON.stringify(exposure(t.checked.context)),'首次完整答案：',t.checked.response,...compact(t.checked.result));else lines.push('尚未核對，不放參考答案。','目前完整答案：',t.response);lines.push('完整修訂：',t.revision);if(aromaEvidenceStale(d,s.id))lines.push('條件已改；首次核對保留為歷史，不當作目前判定。');}
 lines.push('自己的完整作答原則：',d.synthesis,'來源及採用範圍：',...AROMA_EVIDENCE_SOURCES.map(s=>s.title+' '+(s.fullTextUrl??s.url)+'；'+s.scope),'具體補救：',...AROMA_EVIDENCE_REMEDIATION.map(s=>s.label+' '+s.href),'摘要只於明示成功附加時隨本課筆記保存；同頁草稿及完整長答不截斷。');return lines.join('\n');
}
