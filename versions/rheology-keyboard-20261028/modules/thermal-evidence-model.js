// Conditional original records and a reference-account exercise, not a food-process validation tool.
export const THERMAL_EVIDENCE_ID='thermal-evidence-chain';
export const THERMAL_EVIDENCE_VERSION='thermal-evidence-original-v1';
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const clone=x=>structuredClone(x),lock=(o,k)=>Object.defineProperty(o,k,{value:o[k],enumerable:true,writable:false,configurable:false});
export const THERMAL_EVIDENCE_STAGES=freeze([{id:'diagnose',title:'診斷：先分數量、角色與證據'},{id:'worked',title:'示範：定義、小帳與證據用途'},{id:'guided',title:'部分提示：同樣有簽名，查了什麼？'},{id:'transfer',title:'無提示遷移：產品、位置與儀器的對應'}]);
export const THERMAL_EVIDENCE_GUIDED_CASES=freeze([{id:'index-review',label:'V紀錄：核對索引及簽名'},{id:'content-review',label:'V紀錄：比較所引文件內容'}]);
export const THERMAL_EVIDENCE_TRANSFERS=freeze([{id:'product-particles',label:'產品N／顆粒B的紀錄'},{id:'sensor-id',label:'產品M／感測器Z的紀錄'}]);
export const THERMAL_EVIDENCE_QUESTIONS=freeze([
 {id:'capability',text:'設計對指定產品、對象與條件達成目標，有哪些適用的科學依據？'},
 {id:'operation',text:'本次實際控制觀察與既定要求，能建立什麼關係？'},
 {id:'system',text:'這些查核與紀錄，支持制度的哪些工作按計畫運作？'},
]);
export const THERMAL_EVIDENCE_REMEDIATION=freeze([
 {id:'fourier',label:'Fo與食品內部熱穿透',href:'#process/proc-thermal-processing/proc-heat-penetration-profile/understand',why:'若把熱擴散的無因次時間當成微生物作用，先補幾何、物性與局部歷程。'},
 {id:'d',label:'D的十進位減少定義',href:'#micro/micro-control/micro-decimal-reduction/understand',why:'若分不清單位時間與log減少，先問D對應的對象、條件與單位。'},
 {id:'z',label:'z與參考溫度',href:'#micro/micro-control/micro-z-temperature/understand',why:'若用不同Tref或不同響應的D相除，先補參考條件與模型配對。'},
 {id:'history',label:'局部熱歷程與Fref',href:'#process/proc-thermal-processing/proc-equivalent-time/understand',why:'若把設備設定當全部食品作用，先分位置、歷程及參考溫度的累積。'},
 {id:'position',label:'冷區與有限空間取證',href:'#process/proc-thermal-processing/proc-temperature-history/understand',why:'若把連續液相的測點當所有顆粒內部，先核對實際量測物件與涵蓋範圍。'},
 {id:'sampling',label:'有限陰性與抽樣前提',href:'#micro/micro-measurement/micro-sampling-probability/understand',why:'若把幾份陰性當整批為零，先補抽樣單位、獨立性與檢測能力。'},
]);
export const THERMAL_EVIDENCE_SOURCES=freeze([
 {id:'thermal-path-source-cxc1-2022',title:'Codex CXC 1-1969：General Principles of Food Hygiene（2022修訂，2023版）',url:'https://www.fao.org/4/cc6125en/cc6125en.pdf',scope:'只取定義與§6、§19.11中確效、監測、查核的角色及用途；不移植操作要求、製程參數或法規判定。'},
 {id:'thermal-path-source-cxg69-2008',title:'Codex CXG 69-2008：Validation of Food Safety Control Measures',url:'https://www.fao.org/input/download/standards/11022/CXG_069e.pdf',scope:'只取§III／IV／VI的定義、科學依據與確效證據用途；採2008原則及2013編輯修訂，不把本題合成證據包當真實確效研究。'},
 {id:'micro-source-dz',title:'FDA：Sterilizing Symbols (D, Z, F)',url:'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/inspection-guides/sterilizing-symbols-d-z-f',scope:'只採D、z、F的模型定義及條件；歷史技術指引不作本課現行規範或食品處理排程。'},
 {id:'heat-penetration-source-uw-slab',title:'University of Washington：Transient one-dimensional heat conduction',url:'https://faculty.washington.edu/baneyx/340/Transient_conduction.pdf',scope:'只用Fo的熱擴散與幾何尺度意義。原有熱穿透課保留完整模型；本台不新增熱解或由Fo預測殺滅。'},
 {id:'thermal-source-heat-studies',title:'FDA：Low Acid Canned Food22',url:'https://www.fda.gov/guide-inspections-low-acid-canned-food-22',scope:'只取熱分布／熱穿透、產品條件與量測位置需對應的概念；不採食品加工數值或操作程序。'},
 {id:'thermal-source-binomial',title:'NIST：Binomial Distribution',url:'https://itl.nist.gov/div898/handbook/eda/section3/eda366i.htm',scope:'只用有限抽樣及給定參數的機率模型界線；本台不反推真實陽性率或設定抽樣計畫。'},
 {id:'thermal-source-independent-trials',title:'NIST CSRC：Binomial distribution的獨立試驗定義',url:'https://csrc.nist.gov/glossary/term/binomial_distribution',scope:'只取獨立同分布前提。群聚樣本不能僅靠報告張數當作相同數目的獨立證據。'},
]);
export const THERMAL_EVIDENCE_DIAGNOSTIC=freeze([
 {question:'Fo、Fref、Dref各是什麼量？Fo的Lchar與log減少數Llog有什麼差別？',reference:'本台Fo是Fourier數，描述熱擴散與幾何尺度的無因次時間：Fo=αt/Lchar²。Lchar是幾何長度。Fref是某一指定響應及局部歷程在Tref下的等效作用時間；Dref是同一響應在該參考條件減少1 log所需的時間。Llog是log減少數，不是幾何長度。'},
 {question:'若D、z、Tref或觀測位置不同，兩個F或F/D數字可以直接代用嗎？z提供的是什麼？',reference:'D是指定條件的1 log時間，z描述D隨溫度改變的幅度，Tref定義等效時間的參考點。F與D須配對同一響應、參考條件、模型及單位；局部歷程也不能用設備設定或另一相的位置替代。'},
 {question:'一份校正文件或一份操作紀錄，是否永遠只屬確效、監測、查核其中一箱？用發生在之前或之後分類足夠嗎？',reference:'角色看它回答什麼問題及如何使用：確效取得控制措施能達到預定結果的證據；監測是有計畫的觀察／測量以評估控制；查核在監測之外用方法、程序或評估確認系統或控制按意圖運作。校正可支持量測可信度，操作紀錄既是監測結果，也可供查核審閱；不是一份紀錄只能一類，也不能只看先後時間。'},
]);
const blank=()=>({response:'',revision:'',hintSeen:false,remediesRequested:[],checked:null});
export function createThermalEvidenceDraft(){return {stageId:'diagnose',worked:{fo:'0.2',fref:'2',dref:'1'},guidedCaseId:'index-review',guided:{fref:'2',negativeReports:'6'},transferCaseId:'product-particles',transfer:{fref:'2',negativeReports:'6'},trials:Object.fromEntries(THERMAL_EVIDENCE_STAGES.map(s=>[s.id,blank()])),seenStages:[],details:{},synthesis:''};}
/** Bounded requests only: opening a link is not evidence that it was read. */
export function requestThermalEvidenceRemedy(d,id){const t=d.trials?.[d.stageId];if(!t||!THERMAL_EVIDENCE_REMEDIATION.some(r=>r.id===id))return false;if(!Array.isArray(t.remediesRequested)){t.remediesRequested=[];t.remediesEarlierUnknown=true;}if(!t.remediesRequested.includes(id))t.remediesRequested.push(id);return true;}
export function markThermalEvidenceStageSeen(d){if(!THERMAL_EVIDENCE_STAGES.some(s=>s.id===d.stageId))throw new RangeError('Unknown thermal evidence stage');if(!d.seenStages.includes(d.stageId))d.seenStages.push(d.stageId);}
export function setThermalEvidenceStage(d,id){if(!THERMAL_EVIDENCE_STAGES.some(s=>s.id===id))throw new RangeError('Unknown stage');d.stageId=id;}
export function setThermalEvidenceCase(d,id){if(d.stageId==='guided'&&THERMAL_EVIDENCE_GUIDED_CASES.some(s=>s.id===id))d.guidedCaseId=id;else if(d.stageId==='transfer'&&THERMAL_EVIDENCE_TRANSFERS.some(s=>s.id===id))d.transferCaseId=id;else throw new RangeError('Unknown case');}
export function setThermalEvidenceControl(d,key,value){if(!['worked','guided','transfer'].includes(d.stageId)||!Object.hasOwn(d[d.stageId],key)||typeof value!=='string')throw new TypeError('Unsupported raw control');d[d.stageId][key]=value;}
function decimal(raw,max=1000000){
 if(raw===null||raw===undefined||raw==='')return {status:'missing',value:null,scaled:null,raw};
 if(typeof raw!=='string'||raw.length>32||! /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(raw))return {status:'invalid',value:null,scaled:null,raw};
 const [whole,fraction='']=raw.split('.'),scaled=BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0'));
 if(scaled>BigInt(max)*1000000n)return {status:'invalid',value:null,scaled:null,raw};
 return {status:'observed',value:Number(scaled)/1e6,scaled,raw};
}
const publicNumber=({scaled,...rest})=>rest;
const exactDecimal=n=>{const whole=n/1000000n,fraction=(n%1000000n).toString().padStart(6,'0').replace(/0+$/,'');return whole.toString()+(fraction?'.'+fraction:'');};
const binding=()=>({responseId:'R',referenceId:'T-star',zId:'z-star',timeUnit:'u'});
const bindingValid=b=>b&&typeof b==='object'&&!Array.isArray(b)&&['responseId','referenceId','zId','timeUnit'].every(k=>typeof b[k]==='string'&&/^[A-Za-z0-9-]{1,48}$/.test(b[k]));
/** Given Fref and Dref only; no temperature integration, processing schedule or real survival estimate. */
export function evaluateThermalReference(input={}){
 const unknown={logReduction:null,criterionMet:null,safety:null,realFoodEffect:null,modelCriterion:2};
 if(!input||typeof input!=='object')return {...unknown,status:'invalid',reason:'需要明示原始輸入與參考綁定。'};
 const f=decimal(input.fref),d=decimal(input.dref);
 if(f.status!=='observed'||d.status!=='observed')return {...unknown,status:f.status==='invalid'||d.status==='invalid'?'invalid':'missing',fref:publicNumber(f),dref:publicNumber(d),reason:'Fref與Dref須為本例0–10⁶的普通十進位，最多六位小數；未知不補零。這是輸入域，不是有效食品參數域。'};
 if(d.scaled===0n)return {...unknown,status:'undefined-zero-d',fref:publicNumber(f),dref:publicNumber(d),reason:'Dref作為1 log時間必須大於零；零分母不能換成無限殺滅或安全。'};
 if(!bindingValid(input.bindingF)||!bindingValid(input.bindingD)||['responseId','referenceId','zId','timeUnit'].some(k=>input.bindingF[k]!==input.bindingD[k]))return {...unknown,status:'not-comparable',fref:publicNumber(f),dref:publicNumber(d),reason:'F與D的響應、Tref、z模型或時間單位未明示配對；不以數字可除替代科學可比性。'};
 return {...unknown,status:'conditional-account',fref:publicNumber(f),dref:publicNumber(d),logReduction:Number(f.scaled)/Number(d.scaled),criterionMet:f.scaled>=2n*d.scaled,exactCriterionComparison:{leftRaw:f.raw,relation:f.scaled<2n*d.scaled?'<':f.scaled>2n*d.scaled?'>':'=',rightRaw:exactDecimal(2n*d.scaled)},reason:'Llog=Fref/Dref只在題設同一局部響應與線性log模型下成立；2是本題原創比較線，不是食品安全門檻。'};
}
export function summarizeThermalReports(raw,structure){
 structure=typeof structure==='string'&&structure?structure:'未提供位置關係';
 if(raw===null||raw===undefined||raw==='')return {status:'missing',reportCount:null,negativeReports:null,structure,safety:null};
 if(typeof raw!=='string'||! /^(?:0|[1-9]\d?)$/.test(raw)||Number(raw)>50)return {status:'invalid',reportCount:null,negativeReports:null,structure,safety:null};
 const n=Number(raw);return {status:n===0?'no-reports':'reported',reportCount:n,negativeReports:n,structure,independenceEstablished:false,detectionSensitivity:null,batchPositiveRate:null,safety:null};
}
const sameKeys=(a,b,keys)=>keys.every(k=>typeof a[k]==='string'&&a[k]===b[k]);
export function thermalEvidenceContext(d,id=d.stageId){
 if(id==='diagnose')return {stageId:id};
 const current=id==='worked'?{fref:d.worked.fref,negativeReports:'6'}:clone(d[id]);
 if(!current)throw new RangeError('Unknown stage');
 const productChanged=id==='transfer'&&d.transferCaseId==='product-particles',sensorChanged=id==='transfer'&&d.transferCaseId==='sensor-id';
 if(id==='guided'&&!THERMAL_EVIDENCE_GUIDED_CASES.some(s=>s.id===d.guidedCaseId)||id==='transfer'&&!THERMAL_EVIDENCE_TRANSFERS.some(s=>s.id===d.transferCaseId))throw new RangeError('Unknown case');
 const product=productChanged?'N':'M',particleClass=productChanged?'P-B':'P-A',sensorId=sensorChanged?'Z':'S1',object=productChanged?'連續液相位置q':'材料P-A內部指定位置q';
 return {stageId:id,caseId:id==='guided'?d.guidedCaseId:id==='transfer'?d.transferCaseId:'worked-base',origin:'original-synthetic-dossier',account:{fref:current.fref,dref:id==='worked'?d.worked.dref:'1',bindingF:binding(),bindingD:binding()},fourierRaw:id==='worked'?d.worked.fo:null,documents:{
  science:{id:'S',title:'研究摘要S',product:'M',particleClass:'P-A',packageId:'K',measuredObject:'材料P-A內部指定位置q',responseId:'R',referenceId:'T-star',zId:'z-star',timeUnit:'u',target:'本題Llog比較線2',substantiveBasisGiven:true,text:'題設假定這份原創研究摘要包含R響應、指定材料／顆粒／包裝、量測物件及控制條件的科學依據，支持其所列適用範圍；未冒充真實實驗。'},
  operation:{id:'O',title:'當次紀錄O',runId:'R37',product,particleClass,packageId:'K',measuredObject:object,sensorId,responseId:'R',referenceId:'T-star',zId:'z-star',timeUnit:'u',rawRecordComplete:true,fref:current.fref,text:'本題假定O依既定觀察計畫記錄當次控制；列有產品欄、儀器序號、觀察物件及原始歷程檔案，Fref依表列模型換算。'},
  calibration:{id:'C',title:'儀器文件C',sensorId:'S1',coverage:'本次觀察期間',referenceCheckDocumented:true,text:'文件記載S1的相應量測範圍及標準比對，涵蓋本題所列觀察期間；不給真實儀器規格或校正操作。'},
  review:{id:'V',title:'獨立複核V',reviewer:'非當次操作人的角色J',runId:'R37',product:'M',sensorId:'S1',mode:id==='guided'&&d.guidedCaseId==='index-review'?'index-signatures':'contents-reconciled',records:['S','O','C'],text:id==='guided'&&d.guidedCaseId==='index-review'?'本表只記載文件索引與簽名存在，內容比較欄未填。':'本表記載依所引文件逐項比較產品、感測器、觀察與計畫要求；產品欄M、儀器欄S1。'},
  sampling:{id:'N',title:'樣本報告N',negativeReports:current.negativeReports,locationGroup:id==='transfer'?'同一容器的同一區域':'所列數個取樣位置',reportedOutcome:'各報告記為ND',method:'原創方法代號δ',detectionCapability:null,samplingFrame:null,text:'報告所列結果、張數、方法代號與取樣位置如表。'},
 }};
}
export function evaluateThermalEvidence(c){
 const unknown={safety:null,wholeFoodEffect:null,releaseDecision:null};
 if(!c||typeof c!=='object'||!THERMAL_EVIDENCE_STAGES.some(s=>s.id===c.stageId))return {...unknown,status:'invalid-context'};
 if(c.stageId==='diagnose')return {...unknown,status:'diagnostic'};
 if(!c.documents?.science||!c.documents?.operation||!c.documents?.calibration||!c.documents?.review||!c.documents?.sampling)return {...unknown,status:'invalid-context'};
 const {science:s,operation:o,calibration:k,review:v,sampling:n}=c.documents,account=evaluateThermalReference(c.account),modelKeys=['responseId','referenceId','zId','timeUnit'],scopeMatches=sameKeys(s,o,['product','particleClass','packageId','measuredObject',...modelKeys]),modelBindingMatches=bindingValid(c.account?.bindingF)&&bindingValid(c.account?.bindingD)&&sameKeys(o,c.account.bindingF,modelKeys)&&sameKeys(s,c.account.bindingD,modelKeys),calibrationMatches=k.sensorId===o.sensorId&&k.coverage==='本次觀察期間'&&k.referenceCheckDocumented===true,reviewAddressesCurrent=sameKeys(v,o,['runId','product','sensorId'])&&Array.isArray(v.records)&&v.records.includes('S')&&v.records.includes('O')&&v.records.includes('C'),contentReview=v.mode==='contents-reconciled';
 const fourier=c.fourierRaw===null?null:publicNumber(decimal(c.fourierRaw)),reports=summarizeThermalReports(n.negativeReports,n.locationGroup);
 return {...unknown,status:'conditional-dossier',account,fourier,reports,scopeMatches,modelBindingMatches,calibrationMatches,reviewAddressesCurrent,contentReview,
  capability:s.substantiveBasisGiven===true&&scopeMatches?'within-stated-study-scope':'applicability-not-established',
  operation:!scopeMatches||!modelBindingMatches||!calibrationMatches||o.rawRecordComplete!==true?'recorded-values-only':account.status!=='conditional-account'?'comparison-unavailable':account.criterionMet?'recorded-criterion-consistent':'recorded-criterion-not-met',
  system:contentReview&&reviewAddressesCurrent?'listed-content-review-documented':'limited-or-unmatched-review',
 };
}
const fmt=n=>n===null?'未知':Number(n.toPrecision(8)).toString();
export function thermalEvidenceReference(c){
 const r=evaluateThermalEvidence(c),steps=[];
 if(c.stageId==='diagnose')return {result:r,steps:THERMAL_EVIDENCE_DIAGNOSTIC.map(x=>x.reference),selfCheck:'能否先說量與單位、再說要回答的證據問題？已掌握者可直接去遷移；不以點過參考認定學會。'};
 if(c.stageId==='worked'){
  steps.push('先定義：Fo描述熱擴散相對幾何尺度的無因次時間；Fref是局部響應在參考條件的等效時間，Dref是相同響應的1 log時間。Lchar是長度，Llog是log減少數。');
  if(r.fourier?.status==='observed')steps.push(`Fo的給定原文=${c.fourierRaw}；沒有對應局部熱歷程及適用響應時，這個數字不提供Fref或殺滅。`);else steps.push('Fo輸入未知或不符本例輸入域，不補成0；它與Fref/Dref帳分開。');
 }
 steps.push(r.account.reason,r.account.status==='conditional-account'?`本題局部條件帳：Fref=${r.account.fref.raw} u，Dref=${r.account.dref.raw} u，Llog≈${fmt(r.account.logReduction)}（小數近似）；按原文精確比較，Fref ${r.account.exactCriterionComparison.relation} 2×Dref（${r.account.exactCriterionComparison.rightRaw} u），所以${r.account.criterionMet?'數學上達到':'數學上未達'}原創比較線2。這不是整個食品或真實安全判定。`:'目前不能建立相應的Fref/Dref比較，原始文字保留。');
 steps.push('【設計能力／確效依據】'+(r.capability==='within-stated-study-scope'?'在題設宣告S研究內容確如所列、且產品／顆粒／包裝／觀察物件相符下，S支持該範圍的設計能力論述；本工具沒有真的核實研究或確效食品。':'S的產品、顆粒、包裝或觀察物件與O未對應，不能把原適用範圍當成新條件的設計證據。需要對新條件的相應科學及空間／熱穿透證據。'));
 steps.push('【當次控制／監測】'+(r.operation==='recorded-criterion-consistent'?'O記載的本次局部指標在原題設要求內，C對應當次感測器及期間，支持這些已列控制觀察的符合性；有限位置不是所有物件。':r.operation==='recorded-criterion-not-met'?'在本題配對與儀器前提下，O記載值低於原創比較線；應如實報這項不符合，不能改稱缺資料或安全。':r.operation==='comparison-unavailable'?'O仍可作當次記錄，但其指標與Dref資料不足或無效，現在不能判這項數值符合性。':'O的原始報值仍存在；目前產品／觀察物件、F/D模型綁定或C的儀器對應未建立，不能把它升級成當次實際控制符合。需對應物件、模型、儀器及相符條件的證據。'));
 steps.push('【制度／查核】'+(r.system==='listed-content-review-documented'?'V列明由非當次操作角色比較S/O/C，且對應所列run、產品和感測器，支持已列的內容查核工作有紀錄。這不使S適用性、儀器或操作偏差自動消失，也不是一份V證明整套制度有效。':'V只有索引／簽名核對，或其run、產品／儀器欄與O不同。可報已做的文件動作，尚不能稱完成相應內容查核或當前制度符合性。'));
 steps.push(r.calibrationMatches?'C支持本次量測可信度；在對應研究／量測範圍成立時，校正文件也可供科學研究的方法審查或獨立查核使用，不能把一份文件永久鎖在單一類別。':'C的儀器或涵蓋條件與O不符；一份名為校正的文件不能自動替另一感測器背書。');
 if(r.reports.status==='reported')steps.push(`N有${r.reports.reportCount}份ND報告，位置關係為「${r.reports.structure}」。可保留有限未檢出結果，但獨立性、檢出能力與全批率未建立；不由張數推出全批為零。`);else if(r.reports.status==='no-reports')steps.push('N的報告數為0：沒有陰性報告，不是已測得全批零問題。');else steps.push('N報告數未知或不符本例整數輸入域；不補成0，也不借用別案例的陰性結果。');
 steps.push('確效、監測與查核按所回答的問題及實際內容分工，不只按之前／之後；O可供查核。若有適當研究設計、分析與適用性前提，運行資料也可作確效證據；本題一次O不會因此自動證明能力。C可支持多個相符證據環節。冷區及抽樣的原工作台仍處理各自位置／獨立性問題，本台不替代它們。','所有文件、數字與u單位都是原創合成題設，不是食品處理溫時、微生物試驗或放行證據。');
 return {result:r,steps,selfCheck:'三問各寫：目前哪句有紀錄支持、適用的對象與範圍、還不能支持什麼，以及哪種新增證據能補該缺口。不要僅把S/O/C/V各分一箱，也不要一律回答資訊不足。'};
}
export function showThermalEvidenceHint(d){if(d.stageId!=='guided')return false;d.trials.guided.hintSeen=true;return true;}
export function checkThermalEvidenceResponse(d){const t=d.trials[d.stageId];if(!t||t.checked)return false;const context=thermalEvidenceContext(d);t.checked=freeze(clone({context,response:t.response,hintSeen:t.hintSeen,remediesRequested:Array.isArray(t.remediesRequested)?[...t.remediesRequested]:null,...(t.remediesEarlierUnknown?{remediesEarlierUnknown:true}:{}),seenStages:[...d.seenStages],result:evaluateThermalEvidence(context),assessed:false}));lock(t,'response');return true;}
export function thermalEvidenceResponseStale(d,id=d.stageId){const t=d.trials[id];return !!t?.checked&&JSON.stringify(t.checked.context)!==JSON.stringify(thermalEvidenceContext(d,id));}
// Fixed instructional prose is identified once by version. All factual fields,
// original inputs and changed conditions remain in the context registry below.
function factualContext(c){
 if(c.stageId==='diagnose')return {stageId:c.stageId};
 const {documents,...rest}=c;
 return {...rest,documents:Object.fromEntries(Object.entries(documents).map(([id,{title,text,...facts}])=>[id,facts]))};
}
function shortFeedback(c,r){
 if(r.status==='diagnostic')return THERMAL_EVIDENCE_DIAGNOSTIC.map(x=>x.reference);
 const a=r.account,lines=[];
 lines.push(a.status==='conditional-account'?`原文Fref=${a.fref.raw} u；Dref=${a.dref.raw} u；Llog≈${fmt(a.logReduction)}。精確Fref ${a.exactCriterionComparison.relation} 2Dref（${a.exactCriterionComparison.rightRaw} u），${a.criterionMet?'達到':'未達'}本題比較線；非安全判定。`:`小帳狀態：${a.status}；${a.reason}`);
 if(r.fourier)lines.push(`Fo原文=${c.fourierRaw}；${r.fourier.status}，不換成Fref或食品效果。`);
 const cap={'within-stated-study-scope':'S在題設給定科學內容與相符範圍內支持設計論述','applicability-not-established':'S/O對象或適用範圍未對應，不能沿用設計依據'},op={'recorded-criterion-consistent':'已列局部控制觀察符合原題設比較線','recorded-criterion-not-met':'已列局部控制觀察未達原題設比較線','comparison-unavailable':'當次指標資料不足或無效，不能判此數值符合性','recorded-values-only':'O報值存在；物件、模型、原始紀錄或儀器對應未建立，不能升級為當次實際符合'},sys={'listed-content-review-documented':'V對應當次對象並記載內容比較；只支持已列查核工作','limited-or-unmatched-review':'V只查索引／簽名或對象不符，未建立相應內容查核'};
 lines.push(`設計：${cap[r.capability]}。`,`當次：${op[r.operation]}。`,`制度：${sys[r.system]}。不以一份V證明整套有效。`,`對應核對：S/O範圍=${r.scopeMatches?'相符':'未建立'}；帳與文件模型=${r.modelBindingMatches?'相符':'未建立'}；C/當次儀器=${r.calibrationMatches?'相符':'未建立'}。`);
 lines.push(`N：${r.reports.status}；張數=${r.reports.reportCount===null?'未知':r.reports.reportCount}；位置關係=${r.reports.structure}。有限ND不證全批為零，獨立性及檢出能力仍未建立。`);
 return lines;
}
export const THERMAL_EVIDENCE_SUMMARY_VERSION='thermal-evidence-summary/2';
/** Notes remain plain strings. This version frames free text by exact UTF-16
 * length, so a student's own headings cannot impersonate another answer slot.
 * Registries preserve JSON factual fields; arrays are replaced as whole values.
 * No note importer or production summary decoder is introduced. */
export function buildThermalEvidenceSummary(d){
 const texts=[],contexts=[],feedback=[],textIds=new Map(),contextIds=new Map(),feedbackIds=new Map();
 const textId=value=>{if(typeof value!=='string')throw new TypeError('Thermal summary free text must be a string');if(!textIds.has(value)){textIds.set(value,'T'+(texts.length+1));texts.push(value);}return textIds.get(value);};
 const register=(value,items,ids,prefix)=>{const key=JSON.stringify(value);if(!ids.has(key)){ids.set(key,prefix+(items.length+1));items.push(value);}return ids.get(key);};
 const contextId=c=>register(factualContext(c),contexts,contextIds,'C');
 const feedbackId=c=>{
  let reference;try{reference=shortFeedback(c.context,c.result);}catch{reference=['首次核對原始結果原樣保留；部分歷史欄位未提供，不補值、不重算。'];}
  return register({result:c.result,reference},feedback,feedbackIds,'F');
 };
 const rows=THERMAL_EVIDENCE_STAGES.map(s=>{
  const t=d.trials[s.id],row={stage:s.id,title:s.title,current:contextId(thermalEvidenceContext(d,s.id)),response:textId(t.response),revision:textId(t.revision),hintSeen:t.hintSeen,remediesRequested:Array.isArray(t.remediesRequested)?[...t.remediesRequested]:null,...(t.remediesEarlierUnknown?{remediesEarlierUnknown:true}:{}),stale:thermalEvidenceResponseStale(d,s.id),first:null};
  if(t.checked){const {context,response,result,...meta}=t.checked;row.first={metadata:meta,context:contextId(context),response:textId(response),feedback:feedbackId(t.checked)};}
  return row;
 });
 const synthesis=textId(d.synthesis);
 // Ordinary complete workflows exceeded the note limit with shallow deltas.
 // Object paths omit removed keys; arrays/nonobjects are replaced atomically.
 const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
 const difference=(base,value)=>{
  const omit=[],delta=[];
  const walk=(a,b,path)=>{
   if(JSON.stringify(a)===JSON.stringify(b))return;
   if(object(a)&&object(b)){
    for(const key of Object.keys(a))if(!Object.hasOwn(b,key))omit.push([...path,key]);
    for(const [key,item]of Object.entries(b)){if(Object.hasOwn(a,key))walk(a[key],item,[...path,key]);else delta.push([[...path,key],item]);}
   }else delta.push([path,b]);
  };
  walk(base,value,[]);return {omit,delta};
 };
 const pack=(items,prefix)=>items.map((value,i)=>{
  let best={data:value},bestLength=JSON.stringify(best).length;
  for(let j=0;j<i;j++){
   const {omit,delta}=difference(items[j],value),candidate={base:prefix+(j+1),...(omit.length?{omit}:{}),...(delta.length?{delta}:{})},length=JSON.stringify(candidate).length;
   if(length<bestLength){best=candidate;bestLength=length;}
  }
  return best;
 });
 const metadata={definition:THERMAL_EVIDENCE_VERSION,currentStage:d.stageId,seenStages:[...d.seenStages],contexts:pack(contexts,'C'),feedback:pack(feedback,'F'),stages:rows,synthesis,sources:THERMAL_EVIDENCE_SOURCES,remedies:THERMAL_EVIDENCE_REMEDIATION.map(x=>[x.label,x.href]),boundary:"全局界線：安全、整個食品效果與放行均未知。確效／監測／查核按問題與用途分工；O在適當研究設計下也可作確效依據，C可支持相符量測與查核，不是一份紀錄固定一箱。",draft:"草稿只在同一頁面工作階段；成功附加的完整摘要才隨原微生物「製程確效」課筆記保存。"};
 const index=texts.map((value,i)=>({id:'T'+(i+1),length:value.length}));
 const reading=rows.map(r=>r.title+'｜目前題設 '+r.current+'；原答 '+r.response+'；修訂 '+r.revision+'；'+(r.first?'首次核對：題設 '+r.first.context+'／原答 '+r.first.response+'／要點 '+r.first.feedback:'尚未核對')+(r.stale?'。目前條件已改；首次核對只屬歷史。':''));
 const header=['【熱處理證據路徑：量、適用性、當次觀察與查核用途】','摘要編碼：'+THERMAL_EVIDENCE_SUMMARY_VERSION,'原創S/O/C/V/N與u模型；不是實際食品效力或安全證明。自由文字未自動評分；看過不表示掌握。','讀法：C為題設，F為首次核對結果與要點，T為完整文字；M保留欄位及引用。C/F含base時先還原基底，再刪omit路徑、以delta覆寫；陣列整體替換。',"補救請求見M.stages：目前與first.metadata首次分列；null／remediesEarlierUnknown指此前未記錄；請求≠讀懂。","補救入口見M.remedies（名稱、網址）；保存與推論界線見M.draft、M.boundary。",...reading,'M '+JSON.stringify(metadata),'文字索引 '+JSON.stringify(index),'原文區：依索引的UTF-16長度逐段讀取；每段只另加一個LF分隔，不屬原文。'].join('\n')+'\n';
 return header+texts.map((value,i)=>'T'+(i+1)+':\n'+value+'\n').join('');
}
