/** Original two-group accounting exercise. It is not a complete amino-acid score. */
export const PROTEIN_PATH_ID='protein-evidence-chain';
export const PROTEIN_PATH_STAGES=Object.freeze([
 {id:'diagnose',title:'先診斷：你正在回答哪種蛋白問題？'},
 {id:'worked',title:'示範：先算供應量，再找限制'},
 {id:'guided',title:'部分提示：自己重建混合推理'},
 {id:'transfer',title:'無提示遷移：換分母後還能作答嗎？'},
]);
export const PROTEIN_PATH_SOURCES=Object.freeze([{id:'fao2013',title:'FAO 2013：Dietary protein quality evaluation in human nutrition',url:'https://www.fao.org/4/i3124e/i3124e.pdf',scope:'沿用既有替代蛋白課已核對來源：印刷頁19–23的組成評估、Table 5 p29的參考模式、pp3–5的消化證據與暫行處理。本台兩個虛構胺基酸組及數值不是FAO需求值或實驗結果。'}]);
export const PROTEIN_PATH_REMEDIATION=Object.freeze([
 {id:'content',label:'含量的分母與量測對象',href:'#learn/processing/processing-analysis/understand',why:'先分清樣品量、氮換算蛋白與直接量到的物件。'},
 {id:'backbone',label:'胺基酸如何接成蛋白',href:'#learn/proteins/protein-peptide-backbone/understand',why:'若胺基酸與肽鍵仍混淆，先補骨架，再讀組成與水解。'},
 {id:'nutrition',label:'組成、參考需求與消化證據',href:'#learn/proteins/protein-alternative-quality/understand',why:'核對同一蛋白分母、各組參考值、缺項及消化方法。'},
 {id:'function',label:'結構與加工功能',href:'#learn/proteins/protein-structure-hierarchy/understand',why:'把摺疊、聚集或成膠等功能證據與營養評估分開。'},
]);
export const PROTEIN_PATH_DIAGNOSTICS=Object.freeze([
 {id:'amount',prompt:'甲粉每100 g的氮換算蛋白較多。這個觀察直接回答哪一軸？',answer:'content',feedback:'它首先是特定方法與每100 g分母下的含量。尚不能推出各必需胺基酸供應、消化可利用性或成膠能力。',remedy:'content'},
 {id:'gel',prompt:'同一量測條件下，乙樣品形成更強的凝膠。這直接支持哪一軸？',answer:'function',feedback:'凝膠強度是指定條件下的加工功能證據；不能由此讀出限制胺基酸、人體消化或蛋白含量。',remedy:'function'},
 {id:'profile',prompt:'比較每克蛋白的必需胺基酸、明示需求模式與相應消化資料，是在處理哪一軸？',answer:'nutrition',feedback:'這些資料用於營養品質評估；仍要交代族群、分母、方法及缺項，不能變成全面食品排名。',remedy:'nutrition'},
]);
export const PROTEIN_PATH_AXES=Object.freeze([{id:'content',label:'含量／量測分母'},{id:'nutrition',label:'營養品質／供應與利用'},{id:'function',label:'加工功能／材料表現'}]);
export const PROTEIN_PATH_PROFILES=Object.freeze({a:Object.freeze({label:'原創蛋白A',x:30,y:90}),b:Object.freeze({label:'原創蛋白B',x:90,y:30}),reference:Object.freeze({x:60,y:60})});
const clone=x=>structuredClone(x);
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const stage=id=>PROTEIN_PATH_STAGES.some(s=>s.id===id);
const num=value=>typeof value==='string'&&value.length<=24&&/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(value)&&Number.isFinite(Number(value))&&Number(value)<=100?Number(value):null;
const scale=value=>{const [whole,fraction='']=value.split('.');return BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0'));};
const empty=()=>({response:'',reason:'',revision:'',checked:null,hintSeen:false});
export function createProteinPathDraft(){return {stageId:'diagnose',diagnostics:Object.fromEntries(PROTEIN_PATH_DIAGNOSTICS.map(x=>[x.id,{choice:'',reason:'',checked:null,revision:''}])),guided:{basis:'protein',shareA:'25',proteinA:'20',proteinB:'40'},transfer:{basis:'food',shareA:'50',proteinA:'20',proteinB:'40'},trials:{worked:empty(),guided:empty(),transfer:empty()},details:{},synthesis:''};}
/** The only arithmetic is a stated two-group mass ledger. Missing active input stays missing. */
export function evaluateProteinMix(input={}){
 const basis=input.basis,share=num(input.shareA);
 if(!['protein','food'].includes(basis))return {status:'invalid',reason:'請明示混合比例是蛋白質量還是食品質量。',proteinShareA:null,rows:null,minimum:null,limiting:[],diaas:null};
 if(share===null)return {status:'invalid',reason:'A比例須為0–100的普通十進位百分比，最多六位小數；空白、指數或超長文字不補成零。',proteinShareA:null,rows:null,minimum:null,limiting:[],diaas:null};
 let aw=scale(input.shareA),bw=100000000n-aw,pa=share/100;
 if(basis==='food'){
  const ca=share===0?0:num(input.proteinA),cb=share===100?0:num(input.proteinB);
  if(ca===null||cb===null)return {status:'missing',reason:'食品質量比例不足以給蛋白混合比例；需各有貢獻原料的蛋白含量（g/100 g食品）。',proteinShareA:null,rows:null,minimum:null,limiting:[],diaas:null};
  aw*=share===0?0n:scale(input.proteinA);bw*=share===100?0n:scale(input.proteinB);
  const total=aw+bw;
  if(total===0n)return {status:'undefined',reason:'題設組合的總蛋白為零，每克混合蛋白的組成沒有定義。',proteinShareA:null,rows:null,minimum:null,limiting:[],diaas:null};
  pa=Number(aw)/Number(total);
 }
 const rows=['x','y'].map(id=>({id,label:id.toUpperCase(),mgPerGProtein:pa*PROTEIN_PATH_PROFILES.a[id]+(1-pa)*PROTEIN_PATH_PROFILES.b[id],referenceMgPerGProtein:PROTEIN_PATH_PROFILES.reference[id]}));
 for(const r of rows)r.ratio=r.mgPerGProtein/r.referenceMgPerGProtein;
 const minimum=Math.min(...rows.map(r=>r.ratio)),limiting=aw===bw?['X','Y']:aw>bw?['X']:['Y'];
 return {status:'identified',reason:'只在本題兩組與同一分母內成立；完整必需胺基酸資料及相應消化證據未給。',proteinShareA:pa,rows,minimum,limiting,limitingComparison:'exact-decimal-input',displayRounded:true,diaas:null,weightedIndividualMinimum:0.5};
}
export function setProteinPathStage(d,id){if(!stage(id))throw new RangeError('Unknown protein path stage');d.stageId=id;}
export function setProteinPathControl(d,key,value){
 if(!['guided','transfer'].includes(d.stageId)||!['basis','shareA','proteinA','proteinB'].includes(key)||typeof value!=='string')throw new TypeError('Unsupported control');
 if(key==='basis'&&!['food','protein'].includes(value))throw new RangeError('Unsupported basis');
 d[d.stageId][key]=value;
}
export function chooseProteinDiagnostic(d,id,choice){const q=PROTEIN_PATH_DIAGNOSTICS.find(x=>x.id===id);if(!q||!PROTEIN_PATH_AXES.some(x=>x.id===choice))throw new RangeError('Unknown diagnostic');d.diagnostics[id].choice=choice;}
export function checkProteinDiagnostic(d,id){
 const q=PROTEIN_PATH_DIAGNOSTICS.find(x=>x.id===id);if(!q)throw new RangeError('Unknown diagnostic');const t=d.diagnostics[id];
 if(t.checked||!t.choice)return false;
 t.checked=freeze(clone({choice:t.choice,reason:t.reason,correct:t.choice===q.answer,feedback:q.feedback,remedy:q.remedy}));Object.defineProperty(t,'reason',{value:t.reason,enumerable:true,writable:false});return true;
}
export function proteinDiagnosticStale(d,id){const t=d.diagnostics[id];return !!t?.checked&&t.choice!==t.checked.choice;}
export function proteinPathContext(d,id=d.stageId){
 if(!['worked','guided','transfer'].includes(id))return null;
 return {stageId:id,...(id==='worked'?{basis:'protein',shareA:'50',proteinA:'20',proteinB:'40'}:clone(d[id]))};
}
export function checkProteinPathResponse(d){
 const id=d.stageId;if(!['worked','guided','transfer'].includes(id))return false;
 const t=d.trials[id];if(t.checked)return false;
 const context=proteinPathContext(d),result=evaluateProteinMix(context);
 t.checked=freeze(clone({context,response:t.response,reason:t.reason,hintSeen:t.hintSeen,result,assessed:false}));
 for(const key of ['response','reason'])Object.defineProperty(t,key,{value:t[key],enumerable:true,writable:false});return true;
}
export function proteinPathResponseStale(d,id=d.stageId){const t=d.trials[id];return !!t?.checked&&JSON.stringify(t.checked.context)!==JSON.stringify(proteinPathContext(d,id));}
export function showProteinPathHint(d){if(d.stageId!=='guided')return false;d.trials.guided.hintSeen=true;return true;}
const fmt=x=>x===null?'未定義':Number(x.toFixed(5)).toString();
export function proteinPathReference(context){
 const r=evaluateProteinMix(context);
 if(r.status!=='identified')return {result:r,steps:[r.reason,'保留可知與未知；不要把缺值設成零，也不要換成未給定的假設。','本台沒有完整組成與所需消化資料，DIAAS仍未知。'],answer:'目前不足以建立每克混合蛋白的兩組比較；DIAAS仍未知。'};
 return {result:r,steps:[context.basis==='food'?`先把食品比例換成蛋白供應比例：A貢獻占${fmt(r.proteinShareA*100)}%。`:`題設已給蛋白質量比例：A占${context.shareA}%。`,`按蛋白質量加權兩組：${r.rows.map(x=>`${x.label}=${fmt(x.mgPerGProtein)} mg/g蛋白`).join('；')}。`,`再各自除以本題參考60 mg/g：${r.rows.map(x=>`${x.label}比值=${fmt(x.ratio)}`).join('；')}。`,`本題兩組最低比值=${fmt(r.minimum)}，最低組=${r.limiting.join('、')}；先混組成再取最低，不能平均各原料最低值0.5。`,'顯示最多五位小數；極近值顯示相同不代表真相等，最低組用題設十進位的精確權重比較。','未給完整必需胺基酸及相應消化證據；不能稱完整AAS、DIAAS、人體吸收量或全面營養排名。'],answer:`本題兩組最低比值為${fmt(r.minimum)}，最低組${r.limiting.join('、')}；DIAAS及其他未給資料保持未知。`};
}
export function buildProteinPathSummary(d){
 const lines=['【蛋白備考路徑：分問題、分母、混合與證據】','原創兩組材料與參考60 mg/g均為題設，並非實驗或完整AAS；自由文字沒有自動評分。'];
 for(const q of PROTEIN_PATH_DIAGNOSTICS){const t=d.diagnostics[q.id];lines.push(`診斷：${q.prompt}`,`目前選擇：${PROTEIN_PATH_AXES.find(x=>x.id===t.choice)?.label??'未選'}`,`理由：${t.reason}`,t.checked?`首次核對：${t.checked.correct?'軸別相符':'需修訂'}；初答：${PROTEIN_PATH_AXES.find(x=>x.id===t.checked.choice)?.label??'未選'}；初答理由：${t.checked.reason}\n${t.checked.feedback}`:'尚未核對',`修訂：${t.revision}`,proteinDiagnosticStale(d,q.id)?'目前選擇已改；首次核對不是目前選擇的判定。':'');}
 for(const id of ['worked','guided','transfer']){
  const t=d.trials[id],context=proteinPathContext(d,id);lines.push(PROTEIN_PATH_STAGES.find(x=>x.id===id).title,`目前題設：${JSON.stringify(context)}`,`作答：${t.response}`,`理由／條件：${t.reason}`,`修訂：${t.revision}`);
  if(t.checked)lines.push(`首次核對題設：${JSON.stringify(t.checked.context)}`,`首次作答：${t.checked.response}`,`首次理由／條件：${t.checked.reason}`,`曾開部分提示：${t.checked.hintSeen?'是':'否'}`,...proteinPathReference(t.checked.context).steps,'自由文字未自動評分。');else lines.push('尚未揭示核對；未把參考解答放進這份摘要。');
  if(proteinPathResponseStale(d,id))lines.push('目前題設已改；首次核對保留歷史，不能當目前已作答或已掌握。');
 }
 lines.push(`自己的整合：${d.synthesis}`,'補救入口：',...PROTEIN_PATH_REMEDIATION.map(x=>`${x.label} ${x.href}`),'來源：',...PROTEIN_PATH_SOURCES.map(x=>`${x.title}\n${x.url}\n${x.scope}`),'草稿只在同一頁面工作階段；僅成功附加的摘要隨原課筆記保存。');return lines.join('\n');
}
