import {DRYING_SOURCES,solveDryingLedger,dryingLedgerRows} from './drying-chain-model.js';
export const DRYING_PATH_ID='drying-evidence-chain';
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const clone=x=>structuredClone(x);
const lock=(o,k)=>Object.defineProperty(o,k,{value:o[k],enumerable:true,writable:false,configurable:false});
export const DRYING_PATH_STAGES=freeze([{id:'diagnose',title:'診斷：分母、平衡與歷程'},{id:'worked',title:'示範：同一批，但每個結論用自己的證據'},{id:'guided',title:'部分提示：分開檢查各類前提'},{id:'transfer',title:'無提示遷移：換了時間點與系統邊界'}]);
export const DRYING_PATH_GUIDED_CASES=freeze([{id:'nonwater',label:'非水分損失未排除；另有合格平衡濕度觀察',assumptionId:'unverified',rhKind:'sample-headspace',equilibrium:'yes',temperatureRelation:'same',sampleTemperature:'25',humidityTemperature:'25'},{id:'unsettled',label:'僅失水已核實；濕度仍在變化，尚未平衡',assumptionId:'only-water',rhKind:'sample-headspace',equilibrium:'no',temperatureRelation:'same',sampleTemperature:'25',humidityTemperature:'25'}]);
export const DRYING_PATH_REMEDIATION=freeze([
 {id:'basis',label:'濕基／乾基與非水分帳',href:'#process/proc-balances/proc-mass-basis/understand',why:'如果不確定分母，先用同一份水和非水分換算，別把兩種百分比當兩個不同樣品。'},
 {id:'aw',label:'水活性的同溫平衡定義',href:'#learn/water/water-activity/understand',why:'如果把RH、含水量與aw視為同一量，先分清測量對象與平衡前提。'},
 {id:'isotherm',label:'不同材料的吸濕比較',href:'#learn/water/water-sorption-comparison/understand',why:'如果想從含水率直接填aw，先看為何材料、溫度與狀態要有相符資料。'},
 {id:'rate',label:'乾燥速率與終點的差別',href:'#process/proc-drying/proc-drying-rate/understand',why:'如果用終點重量推乾燥時間，先補過程速率與指定條件；初末量不是完整歷程。'},
]);
const adopted=['proc-source-moisture-basis','drying-source-water-activity','proc-source-food-drying','drying-source-growth-survival'];
export const DRYING_PATH_SOURCES=freeze(DRYING_SOURCES.filter(x=>adopted.includes(x.id)).map(x=>({...x})));
export const DRYING_PATH_DIAGNOSTIC=freeze([
 {id:'basis',question:'同一個樣品含5 g水與20 g非水分。濕基、乾基水分百分比各是多少？為何可以不同？',reference:'濕基=5/(5+20)=20%；乾基=5/20=25%。水量相同，總樣品質量與非水分質量兩個分母不同。'},
 {id:'aw',question:'知道含水量或一個周圍空氣RH數字，何時才足以寫出樣品aw？缺條件時你會保留什麼未知？',reference:'aw不是含水率。可把與樣品平衡的同溫頭空間ERH除以100；一般周圍空氣、出口瞬時RH、溫度不符或未平衡都不足以通用換算。沒有材料相符的關係，也不由含水量填aw。'},
 {id:'rate',question:'只知道乾燥前後重量，能否算出乾燥時間或乾燥速率？你還需要哪一類資料？',reference:'初末重量描述狀態差；尚未給耗時，連平均質量減少率也不能算，更沒有瞬時速率或整段乾燥時間模型。需相應時間與歷程、傳質及條件資料。'},
]);
const trial=()=>({response:'',revision:'',checked:null,hintSeen:false});
export function createDryingPathDraft(){return {stageId:'diagnose',guidedCaseId:'nonwater',guided:{initialMass:'100',initialWaterPercent:'80',finalMass:'25',relativeHumidity:'55'},transfer:{currentMass:'',relativeHumidity:'65'},trials:Object.fromEntries(DRYING_PATH_STAGES.map(s=>[s.id,trial()])),seenStages:[],details:{},synthesis:''};}
export function markDryingPathStageSeen(d){if(!DRYING_PATH_STAGES.some(s=>s.id===d.stageId))throw new RangeError('Unknown drying path stage');if(!d.seenStages.includes(d.stageId))d.seenStages.push(d.stageId);}
const numeric=(raw,max=1e9)=>{
 if(typeof raw!=='string'||raw.length>40||! /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw))return null;
 const [,f='']=raw.split('.');const n=Number(raw);return f.length<=12&&Number.isFinite(n)&&n<=max?n:null;
};
const temperature=raw=>{if(typeof raw!=='string'||raw.length>40||! /^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw))return null;const negative=raw.startsWith('-'),s=negative?raw.slice(1):raw,[whole,fraction='']=s.split('.');if(fraction.length>12||!Number.isFinite(Number(raw)))return null;return {value:Number(raw),exact:(negative?-1n:1n)*BigInt((whole||'0')+fraction.padEnd(12,'0'))};};
/** Equilibrium RH conversion only. No sorption curve, temperature correction or safety threshold. */
export function qualifyDryingActivity(input={}){
 const common={aw:null,safety:null,shelfLife:null};
 if(!input||typeof input!=='object')return {...common,status:'invalid',reason:'缺少測量條件。'};
 if(!['sample-headspace','ambient','outlet'].includes(input.rhKind)||!['yes','no','unknown'].includes(input.equilibrium)||!['same','different','unknown'].includes(input.temperatureRelation))return {...common,status:'invalid',reason:'測量對象、平衡或同溫資格未明示為可識別狀態。'};
 if(input.relativeHumidity==='')return {...common,status:'unknown',reason:'未提供相對濕度觀察；不補成0%。'};
 const rh=numeric(input.relativeHumidity,100);
 if(rh===null)return {...common,status:'invalid',reason:'RH須為0–100的非負普通十進位；空白以外的無效文字、指數或超限值原樣保留，不補零。'};
 const sampleT=temperature(input.sampleTemperature),humidityT=temperature(input.humidityTemperature);
 if(!sampleT||!humidityT)return {...common,status:'unqualified',reason:'樣品或濕度觀察的實際溫度未知／無效；不能只憑「同溫」標記換算aw。',relativeHumidity:rh};
 if(input.temperatureRelation==='same'&&sampleT.exact!==humidityT.exact)return {...common,status:'conflicting-temperature',reason:'「同溫」標記與實際溫度數字矛盾；保留原始觀察，不校正RH，也不換算樣品aw。',relativeHumidity:rh};
 if(input.rhKind!=='sample-headspace'||input.equilibrium!=='yes'||input.temperatureRelation!=='same')return {...common,status:'unqualified',reason:'這個RH尚不能作為樣品同溫平衡ERH：須是與樣品平衡的頭空間、已平衡且溫度相符。沒有通用溫度校正或材料吸濕曲線。',relativeHumidity:rh};
 return {...common,status:'qualified',aw:rh/100,relativeHumidity:rh,reason:'僅在題設已核實的樣品頭空間、同溫平衡條件下，aw=ERH/100；沒有安全或保存期結論。'};
}
export function setDryingPathStage(d,id){if(!DRYING_PATH_STAGES.some(s=>s.id===id))throw new RangeError('Unknown drying path stage');d.stageId=id;}
export function setDryingPathCase(d,id){if(!DRYING_PATH_GUIDED_CASES.some(s=>s.id===id))throw new RangeError('Unknown guided case');d.guidedCaseId=id;}
export function setDryingPathControl(d,key,value){if(!['guided','transfer'].includes(d.stageId)||!Object.hasOwn(d[d.stageId],key)||typeof value!=='string')throw new TypeError('Unsupported raw drying-path control');d[d.stageId][key]=value;}
export function dryingPathContext(d,id=d.stageId){
 if(id==='diagnose')return {stageId:id};
 if(id==='worked')return {stageId:id,boundary:'no-addition-only-loss',initialMass:'100',initialWaterPercent:'80',finalMass:'25',massUnit:'g',assumptionId:'only-water',relativeHumidity:'40',rhKind:'sample-headspace',equilibrium:'yes',temperatureRelation:'same',sampleTemperature:'25',humidityTemperature:'25',waterPhase:'liquid',activityReference:'pure-liquid-water',timePoint:'乾燥出口的同批樣品，之後另在同溫達平衡量測'};
 if(id==='guided'){const profile=DRYING_PATH_GUIDED_CASES.find(x=>x.id===d.guidedCaseId);if(!profile)throw new RangeError('Unknown guided case');return {stageId:id,caseId:profile.id,boundary:'no-addition-only-loss',...profile,...clone(d.guided),massUnit:'g',waterPhase:'liquid',activityReference:'pure-liquid-water',timePoint:'所述終點與相符的頭空間觀察'};}
 if(id==='transfer')return {stageId:id,boundary:'post-open-exchange',...clone(d.transfer),massUnit:'g',rhKind:'ambient',equilibrium:'unknown',temperatureRelation:'different',sampleTemperature:'20',humidityTemperature:'25',historicalExit:{initialMass:'100',initialWaterPercent:'80',finalMass:'25',massUnit:'g',assumptionId:'only-water'},timePoint:'乾燥出口之後曾開放放置；交換量及非水分保留未核實，現在要判讀的是放置後樣品'};
 throw new RangeError('Unknown drying path stage');
}
export function evaluateDryingPath(c){
 const unknown={aw:null,dryingTime:null,dryingRate:null,safety:null,shelfLife:null};
 if(!c||typeof c!=='object'||!DRYING_PATH_STAGES.some(s=>s.id===c.stageId))return {...unknown,status:'invalid-context',ledger:null,activity:null};
 if(c.stageId==='diagnose')return {...unknown,status:'diagnostic',ledger:null,activity:null};
 let activity=qualifyDryingActivity(c);
 if(c.boundary==='post-open-exchange'){
  const current=c.currentMass===''?{status:'missing',mass:null}:numeric(c.currentMass)===null?{status:'invalid',mass:null}:{status:'observed',mass:numeric(c.currentMass)};
  if(current.mass===0)activity={...activity,status:'undefined-empty-sample',aw:null,reason:'當前總量已知為零，沒有樣品可指派水活性；RH原始觀察保留。'};
  return {...unknown,status:'open-boundary',historicalLedger:solveDryingLedger(c.historicalExit),ledger:null,currentMassObservation:current,currentWater:current.mass===0?0:null,currentNonwater:current.mass===0?0:null,wetBasis:null,dryBasis:null,activity,aw:activity.aw,reason:current.mass===0?'當前總量為零：水與非水分庫存皆為零，但空樣本沒有濕基／乾基分母；歷史出口與現在仍不可混作同一狀態。':'舊收支只描述乾燥出口；放置後的交換與非水保留未核實。現在總量即使有量到，也沒有相符的水／非水分帳。'};
 }
 const ledger=solveDryingLedger(c);
 if(ledger.valid&&ledger.finalMass.min===0)activity={...activity,status:'undefined-empty-sample',aw:null,reason:'終點總量已知為零；沒有樣品可指派aw，原始RH數字仍保留，不把空樣本當作aw為零。'};
 else if(ledger.valid&&ledger.finalSolids.identified&&ledger.finalSolids.min===0&&ledger.finalWater.min>0&&c.waterPhase==='liquid'&&c.activityReference==='pure-liquid-water'){
  activity={...activity,expectedAwFromPureLiquidReference:1};
  if(activity.status==='qualified'&&activity.aw!==1)activity={...activity,status:'conflicting-observations',observedAwFromRh:activity.aw,aw:null,reason:'質量前提已識別為純液水，且以同溫純液水作標準，定義上aw應為1；所給已平衡ERH卻不是100%，兩項觀察前提不相容。保留RH原文與預期1待核對，不能把不相容RH換出的數字當作已驗證aw。'};
 }
 return {...unknown,status:ledger.valid?'bounded':'invalid-ledger',ledger,activity,aw:activity.aw,reason:'質量約束與水活性測量各用自己的前提；其中一項不足，不會抹去另一項獨立可知的量。'};
}
const fmt=v=>v===null?'未知':Number(v.toPrecision(8)).toString();
export function dryingPathReference(c){
 if(c.stageId==='diagnose')return {steps:DRYING_PATH_DIAGNOSTIC.map(x=>x.reference),rows:[],result:evaluateDryingPath(c),selfCheck:'能說出每個分母、平衡資格與尚缺的歷程，就可直接跳到遷移；不會以點擊認定已掌握。'};
 const r=evaluateDryingPath(c),steps=[],rows=[];
 if(c.boundary==='post-open-exchange'){
  steps.push('先分時間點：原始100 g、80% wb到出口25 g且僅失水的帳，仍能描述出口；它不能自動變成開放放置後的當前狀態。',r.reason);
  if(r.currentMassObservation.status==='missing')steps.push('放置後沒有秤重，連目前總質量也未知；不是0 g。');
  else if(r.currentMassObservation.status==='invalid')steps.push('當前質量文字無效，保留原稿待核對，不借用出口25 g補值。');
  else steps.push(`放置後總質量觀察=${fmt(r.currentMassObservation.mass)} g；${r.currentMassObservation.mass===0?'空樣本基準無定義。':'只確定總量，不足以單獨指認水量、非水量或兩種含水基準。'}`);
  steps.push('【另造的反例，非本次已量到的交換】出口25 g若含水5 g、非水20 g，之後吸入10 g水且流失15 g非水，會變20 g＝水15 g＋非水5 g。總量淨減5 g，水卻增加；只看淨減重不能核實「無添加、兩類只減不增」。',r.activity.reason,r.aw===null?'此題設目前沒有合格的樣品aw換算。':`另有獨立合格觀察可給目前aw=${fmt(r.aw)}；質量帳未知不會抹去它，但它也不補成水量或安全結論。`);
 }else{
  if(r.ledger.valid){rows.push(...dryingLedgerRows(r.ledger));steps.push('先列時間點與系統邊界：題設沒有添加，水／非水分的去向依所選案例核實程度處理。',c.assumptionId==='only-water'?'僅水離開且非水分保留時，先由起始濕基算非水分，再用終點總量扣除；濕基與乾基使用不同分母。':'非水分損失未排除時，總減重不全指定為水。沿用既有精確庫存約束給範圍；不能擅自保留舊乾基分母。');}
  else steps.push('這組質量輸入不能支持目前帳：'+r.ledger.error+' 原始輸入仍保留，不截負水量或補零。');
  steps.push(r.activity.reason,r.activity.aw===null?'aw保持未知；即使質量帳可以成立，也不能補這個缺項。':`這個獨立同溫平衡觀察給aw=${fmt(r.activity.aw)}；不必先由含水率猜aw，也不會因此把未定的質量帳補成單點。`);
 }
 steps.push('端點狀態不是完整乾燥歷程。未給時間／速率資料，不推乾燥耗時、瞬時速率或通用最佳條件。','去水／低aw影響生長條件的概念，不等於活微生物已被消除；本題沒有存活、安全或保存期證據。');
 return {result:r,steps,rows,selfCheck:'分別核對：哪些量由質量帳得到、哪些由合格平衡觀察得到、哪些因新時間點或邊界改變而失效？能否指出仍缺的資料，而不是只抄一個百分比？'};
}
export function showDryingPathHint(d){if(d.stageId!=='guided')return false;d.trials.guided.hintSeen=true;return true;}
export function checkDryingPathResponse(d){const t=d.trials[d.stageId];if(!t||t.checked)return false;const context=dryingPathContext(d);t.checked=freeze(clone({context,response:t.response,hintSeen:t.hintSeen,seenStages:[...d.seenStages],result:evaluateDryingPath(context),assessed:false}));lock(t,'response');return true;}
export function dryingPathResponseStale(d,id=d.stageId){const t=d.trials[id];return !!t?.checked&&JSON.stringify(t.checked.context)!==JSON.stringify(dryingPathContext(d,id));}
export function buildDryingPathSummary(d){
 const lines=['【乾燥備考路徑：分母、平衡、歷程與系統邊界】','所有數字為原創假想材料；不是實驗曲線、乾燥排程、食品安全參數或完整官方答案。自由文字不自動評分。'];
 for(const s of DRYING_PATH_STAGES){const t=d.trials[s.id];lines.push(s.title,`目前題設：${JSON.stringify(dryingPathContext(d,s.id))}`,`作答：${t.response}`,`修訂：${t.revision}`);if(t.checked){const ref=dryingPathReference(t.checked.context);lines.push(`首次核對題設：${JSON.stringify(t.checked.context)}`,`首次作答：${t.checked.response}`,`曾看部分提示：${t.checked.hintSeen?'是':'否'}`,`核對前曾顯示階段：${t.checked.seenStages.map(id=>DRYING_PATH_STAGES.find(x=>x.id===id).title).join('、')||'無記錄'}；顯示不代表已讀懂，也不宣稱盲測。`,...ref.steps,...ref.rows.map(r=>`${r.label}：${r.value} ${r.unit}；${r.note}`),'核對是參考推理與自評，不代表文字答對或已掌握。');}else lines.push('尚未核對；此段參考解答不放入摘要。');if(dryingPathResponseStale(d,s.id))lines.push('目前條件已變；首次核對保留歷史，不能當作目前作答判定。');}
 lines.push('自己的整合：'+d.synthesis,'具體補救：',...DRYING_PATH_REMEDIATION.map(x=>x.label+' '+x.href),'來源與限定：',...DRYING_PATH_SOURCES.map(x=>x.label+' '+x.url+'；'+x.scope),'草稿只在同一頁面工作階段；成功附加的完整摘要才隨原乾燥品質課筆記保存。');return lines.join('\n');
}
