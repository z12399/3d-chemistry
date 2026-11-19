import {FERMENTATION_REDOX_SOURCES} from './fermentation-redox-model.js';
import {FERMENTATION_SOURCES} from './fermentation-state-model.js';
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const clone=x=>structuredClone(x),lock=(o,k)=>Object.defineProperty(o,k,{value:o[k],enumerable:true,writable:false,configurable:false});
export const FERMENTATION_PATH_ID='fermentation-evidence-chain';
export const FERMENTATION_PATH_STAGES=freeze([{id:'diagnose',title:'診斷：用語、物理軸與證據層次'},{id:'worked',title:'示範：把選定碳、還原當量與ATP帳分開'},{id:'guided',title:'部分提示：先報觀察，再提出解釋'},{id:'transfer',title:'無提示遷移：緩衝、方法與量測對象改了'}]);
export const FERMENTATION_PATH_ROUTES=freeze([{id:'homolactic',label:'選定EMP＋L-LDH支路'},{id:'alcoholic',label:'選定EMP＋酵母型乙醇支路'}]);
export const FERMENTATION_PATH_TRANSFERS=freeze([{id:'buffer-method',label:'B緩衝及M2／IS2資料'},{id:'dna-object',label:'B的DNA標記量測'}]);
export const FERMENTATION_PATH_REMEDIATION=freeze([
 {id:'meaning',label:'發酵種的工作與pH界線',href:'#micro/micro-fermentation/micro-starter-cultures/understand',why:'若把變酸當完整菌株或品質判定，先分開pH、酸量、產物與目的。'},
 {id:'redox',label:'碳、NAD與ATP局部帳',href:'#micro/micro-fermentation/micro-fermentation-redox/understand',why:'若淨NAD變化為零就以為不需NAD，先查回收段與末端再生的先後。'},
 {id:'physical',label:'固液物理狀態與傳遞',href:'#process/proc-fermentation/proc-fermentation-physical-state/understand',why:'若由固液直接判有氧無氧，先把支撐／自由液相與氧可利用性分軸。'},
 {id:'count',label:'菌落形成單位的量測對象',href:'#micro/micro-measurement/micro-plate-count/understand',why:'若把CFU當每個活細胞或具名菌株數，先補培養可回收性與聚集問題。'},
 {id:'series',label:'時間序列、選窗與外推',href:'#micro/micro-growth/micro-growth-estimation/understand',why:'若把幾個端點直接說成固定速度或因果，先分觀察、擬合、未用點與外部驗證。'},
 {id:'signal',label:'產物訊號與方法身分',href:'#micro/micro-fermentation/micro-soy-fermentation-evidence/understand',why:'若把兩種內標比值相加或當產量，先固定化合物、方法、基準與回收。'},
 {id:'dna',label:'DNA訊號不等於可培養性',href:'#micro/micro-measurement/micro-pcr-viability/understand',why:'若把DNA copies當CFU或存活，先補檢測到核酸與可培養性的差別。'},
]);
const redoxIds=['fermentation-source-openstax82','fermentation-source-openstax84'];
export const FERMENTATION_PATH_SOURCES=freeze([
 {id:'micro-source-isapp-fermented-foods-2021',title:'Marco等／ISAPP（2021）：Fermented foods共識定義',url:'https://doi.org/10.1038/s41575-020-00390-5',fullTextUrl:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7925329/',scope:'只取Defining fermentation的食品定義：所期望的微生物生長及食品成分酵素轉換。與狹義所選生化反應分層；不採健康效益、菌株功效或製造／培養操作。'},
 ...FERMENTATION_REDOX_SOURCES.filter(s=>redoxIds.includes(s.id)).map(s=>({id:s.id,title:s.title,url:s.url,scope:s.acceptedUses.join('；')+' 僅採所選理想計量，不採動力學、菌株產率或食品安全推論。'})),
 ...FERMENTATION_SOURCES.filter(s=>s.id==='fermentation-state-source-smits1998').map(s=>({id:s.id,title:s.label,url:s.url,scope:s.scope})),
 {id:'growth-source-lp95',title:'Letizia等（2023）：LP95豆奶的菌數與pH觀察',url:'https://doi.org/10.3390/antiox12071442',scope:'沿用原課對S1/S2的觀測量、選窗及推論限制。下列三觀測序號完全原創，未重用作者數字、溫度、時間、變異或實驗條件，也不冒充獨立重複。'},
 {id:'soy-source-lee2013',title:'Lee等（2013）：Comparative Volatile Profiles in Soy Sauce According to Inoculated Microorganisms',url:'https://www.jstage.jst.go.jp/article/bbb/77/11/77_130362/_article',scope:'只沿用同化合物／同方法內標比值的身分及跨方法不可合成產量的界線。本台P、M1/M2與所有數字都是原創，不是Lee實驗資料。'},
 {id:'micro-source-dairy-acidity',title:'University of Wisconsin–Madison CDR：Acidity and Moisture',url:'https://cdr.wisc.edu/controlling-acidity-moisture',scope:'沿用既有課的pH、滴定酸度及緩衝區別；沒有從pH生成酸量、曲線、食品參數或安全門檻。'},
 {id:'micro-source-pcr-primary',title:'Nocker、Cheung、Camper（2006）：Live vs. Dead Bacteria的核酸檢測原始研究',url:'https://pubmed.ncbi.nlm.nih.gov/16753236/',scope:'沿用既有摘要閱讀範圍的核酸與存活／可培養性區別；不採方法操作條件、效能數值或新實驗。'},
]);
export const FERMENTATION_PATH_DIAGNOSTIC=freeze([
 {question:'發酵食品的製程、水解作用與生化發酵反應是同一層意思嗎？若題目要品質、機制或製程比較，各要哪一類證據？',reference:'ISAPP的食品定義著重所期望的微生物生長與食品成分的酵素轉換。發酵食品整體製程還可能有分離等操作，不能把整條流程當單一生化淨式。品質目標要對應品質端點，代謝或調控解釋要能區分候選機制，製程限制則另問傳遞、空間、回收與比較條件。'},
 {question:'連續液相或固體支撐，能否直接決定有氧／無氧、所有位置的氧或實際代謝路徑？',reference:'固／液描述支撐與自由液相；氧的供應、可利用性和局部分布是另一軸。物理名稱不直接給氧狀態或路徑證據；食品製程用語也不能代替選定生化反應的定義。'},
 {question:'一個選定路徑完整進行後NAD淨變為零、ATP淨增2，是否表示不需要NAD，或ATP餘額就是2？',reference:'NAD可反覆受還原並被氧化回收，淨變零不表示池為零或不需參與。淨ATP是形成減投入；餘額還要加已知初值。計量終點本身不證明啟動可行性、速度或菌株產率。'},
]);
const empty=()=>({response:'',revision:'',hintSeen:false,checked:null});
export function createFermentationPathDraft(){const transferCases=Object.fromEntries(FERMENTATION_PATH_TRANSFERS.map(c=>[c.id,{pHFinal:'5.9',countFinal:'',productFinal:'40'}]));return {stageId:'diagnose',worked:{route:'homolactic',completedGlucoseUnits:'1'},guided:{pHFinal:'5.1',countFinal:'2000',productFinal:'4'},transferCaseId:'buffer-method',transferCases,transfer:transferCases['buffer-method'],seenTransferCases:[],trials:Object.fromEntries(FERMENTATION_PATH_STAGES.map(s=>[s.id,empty()])),seenStages:[],details:{},synthesis:''};}
export function markFermentationPathStageSeen(d){if(!FERMENTATION_PATH_STAGES.some(s=>s.id===d.stageId))throw new RangeError('Unknown fermentation path stage');if(!d.seenStages.includes(d.stageId))d.seenStages.push(d.stageId);if(d.stageId==='transfer'&&!d.seenTransferCases.includes(d.transferCaseId))d.seenTransferCases.push(d.transferCaseId);}
export function setFermentationPathStage(d,id){if(!FERMENTATION_PATH_STAGES.some(s=>s.id===id))throw new RangeError('Unknown fermentation path stage');d.stageId=id;}
export function setFermentationPathCase(d,id){if(!FERMENTATION_PATH_TRANSFERS.some(s=>s.id===id))throw new RangeError('Unknown transfer case');d.transferCaseId=id;d.transfer=d.transferCases[id];if(d.stageId==='transfer'&&!d.seenTransferCases.includes(id))d.seenTransferCases.push(id);}
export function setFermentationPathControl(d,key,value){
 if(!['worked','guided','transfer'].includes(d.stageId)||!Object.hasOwn(d[d.stageId],key)||typeof value!=='string')throw new TypeError('Unsupported raw fermentation-path control');
 if(key==='route'&&!FERMENTATION_PATH_ROUTES.some(s=>s.id===value))throw new RangeError('Unknown selected route');d[d.stageId][key]=value;
}
/** Conditional completed-extent ledger. It deliberately makes no claim of startup feasibility. */
export function summarizeSelectedFermentation(input={}){
 const unknown={availability:null,atpBalance:null,elapsedTime:null,rate:null,pH:null,strain:null,safety:null};
 if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['route','completedGlucoseUnits'].includes(k))||!FERMENTATION_PATH_ROUTES.some(s=>s.id===input.route)||typeof input.completedGlucoseUnits!=='string'||! /^[0-5]$/.test(input.completedGlucoseUnits))return {...unknown,status:'invalid',reason:'僅接受明示的兩條路徑與0–5整數已完成份數；原始文字保留，不補零，也不接受未建模的NAD池或ATP初值作可行性判定。'};
 const g=Number(input.completedGlucoseUnits),ethanol=input.route==='alcoholic';
 return {...unknown,status:'conditional-ledger',completedGlucoseUnits:g,glucoseCarbon:6*g,lactateUnits:ethanol?0:2*g,ethanolUnits:ethanol?2*g:0,co2Units:ethanol?2*g:0,productCarbon:6*g,nadReduced:2*g,nadReoxidized:2*g,nadNetChange:0,atpFormed:4*g,atpInvested:2*g,atpNet:2*g,reason:'題設已完成指定EMP末端路徑，ADP/Pi視為可用；只核對局部計量，未建啟動、濃度、時間、菌株、生物量或所有H/O/P/電荷帳。'};
}
const MAX_SCALED=1000000n;
function observation(raw,max,allowND=false){
 if(raw==='')return {raw,status:'not-measured',value:null,scaled:null};
 if(allowND&&raw==='ND')return {raw,status:'not-detected',value:null,scaled:null};
 if(typeof raw!=='string'||raw.length>32||! /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(raw))return {raw,status:'invalid',value:null,scaled:null};
 const [whole,fraction='']=raw.split('.'),scaled=BigInt(whole)*MAX_SCALED+BigInt(fraction.padEnd(6,'0'));
 if(scaled>BigInt(max)*MAX_SCALED)return {raw,status:'invalid',value:null,scaled:null};
 return {raw,status:'observed',value:Number(scaled)/1e6,scaled};
}
const direction=(a,b)=>a===null||b===null?'unknown':b>a?'increase':b<a?'decrease':'same';
/** Comparisons describe reported observations; they are not flux or cause estimates. */
export function summarizeFermentationObservations(raws,{kind='signal'}={}){
 const max=kind==='pH'?14:kind==='count'?1e9:kind==='signal'?1e6:null;
 if(max===null||!Array.isArray(raws)||raws.length!==3)return {status:'invalid',observations:[],endpointDirection:'unknown',endpointChange:null,stepDirections:[],rate:null};
 const parsed=raws.map(raw=>observation(raw,max,kind!=='pH')),first=parsed[0],last=parsed[2],change=first.scaled===null||last.scaled===null?null:Number(last.scaled-first.scaled)/1e6;
 return {status:parsed.some(x=>x.status==='invalid')?'invalid':parsed.some(x=>x.value===null)?'incomplete':'observed',observations:parsed.map(({scaled,...rest})=>rest),endpointDirection:direction(first.scaled,last.scaled),endpointChange:change,stepDirections:[direction(parsed[0].scaled,parsed[1].scaled),direction(parsed[1].scaled,parsed[2].scaled)],rate:null};
}
const baseA=()=>({id:'A',matrix:'原創基質A',buffer:'此題的比較基準',pH:['6.4','5.6','5.1'],count:['1000','2000','2000'],countKind:'CFU',countUnit:'CFU/mL',product:['1','2','4'],productMethod:'M1',internalStandard:'IS1',productTarget:'同一指定產物P（教學代號）',productUnit:'P峰面積／IS1峰面積（無因次）'});
export function fermentationPathContext(d,id=d.stageId){
 if(id==='diagnose')return {stageId:id};
 if(id==='worked')return {stageId:id,selected:clone(d.worked)};
 if(id==='guided'){const a=baseA();a.pH[2]=d.guided.pHFinal;a.count[2]=d.guided.countFinal;a.product[2]=d.guided.productFinal;return {stageId:id,origin:'original-synthetic-observations',observations:['觀測1','觀測2','觀測3'],elapsedTimes:null,replicates:null,series:[a]};}
 if(id==='transfer'){
  const dna=d.transferCaseId==='dna-object';if(!FERMENTATION_PATH_TRANSFERS.some(s=>s.id===d.transferCaseId))throw new RangeError('Unknown transfer case');
  const b={id:'B',matrix:'另一原創基質B',buffer:'獨立同條件緩衝比較：B較A強（本題給定）',pH:['6.4','6.1',d.transfer.pHFinal],count:dna?['1000','2000',d.transfer.countFinal]:['','',d.transfer.countFinal],countKind:dna?'DNA-marker':'CFU',countUnit:dna?'DNA標記copies/mL':'CFU/mL',product:['10','20',d.transfer.productFinal],productMethod:dna?'M1':'M2',internalStandard:dna?'IS1':'IS2',productTarget:'同一指定產物P（教學代號）',productUnit:dna?'P峰面積／IS1峰面積（無因次）':'P峰面積／IS2峰面積（無因次）'};
  return {stageId:id,caseId:d.transferCaseId,origin:'original-synthetic-observations',observations:['觀測1','觀測2','觀測3'],elapsedTimes:null,replicates:null,series:[baseA(),b],note:'這是新題獨立給定的A/B資料，不把上一段草稿當成新題實測。'};
 }
 throw new RangeError('Unknown fermentation path stage');
}
export function evaluateFermentationPath(c){
 const unknown={strain:null,pathwayIdentity:null,causalMechanism:null,acidAmount:null,metabolicFlux:null,elapsedTime:null,safety:null,qualityRanking:null};
 if(!c||typeof c!=='object'||!FERMENTATION_PATH_STAGES.some(s=>s.id===c.stageId))return {...unknown,status:'invalid-context'};
 if(c.stageId==='diagnose')return {...unknown,status:'diagnostic'};
 if(c.stageId==='worked')return {...unknown,status:'selected-model',ledger:summarizeSelectedFermentation(c.selected)};
 if(!Array.isArray(c.series)||c.series.length<1||c.series.length>2)return {...unknown,status:'invalid-context'};
 const series=c.series.map(s=>({id:s.id,pH:summarizeFermentationObservations(s.pH,{kind:'pH'}),count:summarizeFermentationObservations(s.count,{kind:'count'}),countKind:s.countKind,countUnit:s.countUnit,product:summarizeFermentationObservations(s.product,{kind:'signal'}),productMethod:s.productMethod,internalStandard:s.internalStandard}));
 return {...unknown,status:'descriptive-observations',series,crossProductBasisSame:series.length===2?Boolean(c.series[0].productTarget)&&c.series[0].productTarget===c.series[1].productTarget&&series[0].productMethod===series[1].productMethod&&series[0].internalStandard===series[1].internalStandard:null};
}
const fmt=n=>n===null?'未知':Number(n.toPrecision(8)).toString(),labelDir={increase:'升高',decrease:'降低',same:'相同',unknown:'無法由首末兩項建立方向'};
function observedText(label,r,unit){const present=r.observations.map((o,i)=>`觀測${i+1}=${o.status==='observed'?fmt(o.value)+' '+unit:o.status==='not-measured'?'未量測':o.status==='not-detected'?'此方法ND，不能補0':'無效原文「'+o.raw+'」（不符本例輸入域，並非宣告物理上不可能）'}`).join('；');return `${label}：${present}。首末報值${labelDir[r.endpointDirection]}${r.endpointChange===null?'':`，差=${fmt(r.endpointChange)} ${unit}`}。這是報值差，不是每小時速率。`;}
export function fermentationPathReference(c){
 const r=evaluateFermentationPath(c),steps=[];
 if(c.stageId==='diagnose')return {result:r,steps:FERMENTATION_PATH_DIAGNOSTIC.map(x=>x.reference),selfCheck:'若能在新例子分清問題層次與所需證據，可略過對應補救；不因點過參考就標記學會。'};
 if(c.stageId==='worked'){
  const l=r.ledger;
  if(l.status==='invalid')steps.push(l.reason);
  else steps.push(`只在題設已完成${l.completedGlucoseUnits}份選定路徑下：核心葡萄糖碳=${l.glucoseCarbon}；${c.selected.route==='homolactic'?`產物L-乳酸根${l.lactateUnits}份`:`產物乙醇${l.ethanolUnits}份＋CO₂${l.co2Units}份`}，產物核心碳=${l.productCarbon}。`,`EMP使NAD⁺受還原${l.nadReduced}份，選定末端還原使NADH再氧化${l.nadReoxidized}份，淨變=${l.nadNetChange}。淨變零不表示NAD池為零或不需要NAD。`,`ATP累計形成${l.atpFormed}、累計投入${l.atpInvested}，所以淨增加${l.atpNet}；初始ATP未給，最終餘額未知。LDH或酵母PDC／ADH末端步驟不另外形成ATP。`,l.reason,'這不是啟動可行性或速率模擬。若問能否啟動，必須另查初始物種／ATP與各步需求；不能把已完成計量當成證明。');
 }else{
  for(const s of r.series){steps.push(`【${s.id}的觀察，不是機制】`,observedText('pH',s.pH,'pH單位'),observedText(s.countKind==='CFU'?'可培養菌落形成單位濃度':'DNA標記拷貝濃度',s.count,s.countUnit),observedText(`產物P在${s.productMethod}/${s.internalStandard}下的內標訊號`,s.product,'無因次比值'));
   steps.push(s.countKind==='CFU'?'CFU報值只對應所用可培養計數；不等於每個活細胞或具名菌株數，末兩值相同也不證明細胞未代謝。':'DNA標記copies不是CFU；核酸訊號不直接證明可培養性、存活或具名發酵菌株的數量。');
  }
  if(c.stageId==='transfer')steps.push('【比較前提已改】B有較強緩衝的獨立題設；pH首末變化與酸量不是同一物件，不能據較小pH變化排序產酸。若要判酸生成／消耗，需相符的酸量、組成、底物與物料邊界資料。',r.crossProductBasisSame?'此版本P使用同方法與內標，可保留報值比較；跨基質的化學總量或產率仍需校正、回收及相符物料基準。':'A/B產物方法與內標不同；可描述各自系列的報值方向，不能把M2比M1的數字大直接稱為產物更多，也不能把兩法相加。');
  steps.push('【候選機制與取證】pH、可培養計數或DNA、產物訊號是不同觀測；可提出產酸、回收性、基質緩衝或產物生成／消耗等候選，但這三列沒有指定唯一菌種、代謝路徑或因果。需能區分候選的身分、相符底物／產物、方法回收與對照證據。','觀測1–3只是先後序號，不是等時間間隔或培養排程；未給實際時間，不報速率、代時或代謝通量。三列不是n=3獨立重複，沒有重建個別樣本、統計顯著性或實驗曲線。');
 }
 steps.push('品質目標、代謝／調控解釋與製程傳遞／回收限制分層作答；這裡沒有安全、保存期、菌株效力或通用最佳條件判定。');
 return {result:r,steps,selfCheck:'能否先用具體端點或方向寫一句有資料支持的話，再另寫機制候選、條件與缺少的取證？若只說「都不知道」，回看哪些原始報值其實已給。'};
}
export function showFermentationPathHint(d){if(d.stageId!=='guided')return false;d.trials.guided.hintSeen=true;return true;}
export function checkFermentationPathResponse(d){const t=d.trials[d.stageId];if(!t||t.checked)return false;const context=fermentationPathContext(d);t.checked=freeze(clone({context,response:t.response,hintSeen:t.hintSeen,seenStages:[...d.seenStages],seenTransferCases:[...d.seenTransferCases],result:evaluateFermentationPath(context),assessed:false}));lock(t,'response');return true;}
export function fermentationPathResponseStale(d,id=d.stageId){const t=d.trials[id];return !!t?.checked&&JSON.stringify(t.checked.context)!==JSON.stringify(fermentationPathContext(d,id));}
export function buildFermentationPathSummary(d){
 const lines=['【發酵備考路徑：語義、選定計量、觀察與機制】','所有三列數字為原創合成觀察，未冒充來源研究或實驗曲線；觀測序號不是培養時間。自由文字不自動評分。'];
 for(const s of FERMENTATION_PATH_STAGES){const t=d.trials[s.id];lines.push(s.title,`目前題設：${JSON.stringify(fermentationPathContext(d,s.id))}`,`作答：${t.response}`,`修訂：${t.revision}`);if(t.checked)lines.push(`首次核對題設：${JSON.stringify(t.checked.context)}`,`首次作答：${t.checked.response}`,`曾看部分提示：${t.checked.hintSeen?'是':'否'}`,`首次核對前曾顯示：${t.checked.seenStages.map(id=>FERMENTATION_PATH_STAGES.find(x=>x.id===id).title).join('、')||'無記錄'}；顯示不代表已讀懂，不宣稱盲測。`,`首次核對前在遷移段選入的版本：${(t.checked.seenTransferCases||[]).join('、')||'無記錄'}；摘要或其他頁的曝光另有限制。`,...fermentationPathReference(t.checked.context).steps,'參考核對未評分自由文字或宣告掌握。');else lines.push('尚未核對；這段參考解答不放進摘要。');if(fermentationPathResponseStale(d,s.id))lines.push('目前題設已改；首次核對只屬歷史，不能當作目前作答判定。');}
 for(const id of d.seenTransferCases){if(id===d.transferCaseId)continue;const context=fermentationPathContext({...d,transferCaseId:id,transfer:d.transferCases[id]},'transfer');lines.push(`另一已顯示遷移版本的 B 題設：${JSON.stringify({caseId:id,series:context.series[1]})}`);}
 lines.push('自己的整合：'+d.synthesis,'具體補救入口：',...FERMENTATION_PATH_REMEDIATION.map(x=>x.label+' '+x.href),'來源與範圍：',...FERMENTATION_PATH_SOURCES.map(x=>x.title+' '+x.url+'；'+x.scope),'草稿只在同一頁面工作階段；成功附加的摘要才隨原「發酵種」課筆記保存。');return lines.join('\n');
}
