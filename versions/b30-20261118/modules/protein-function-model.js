// Original finite evidence cases. No DH, pH, process or efficacy simulator.
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const clone=v=>JSON.parse(JSON.stringify(v));
const lock=(o,k,v)=>Object.defineProperty(o,k,{value:freeze(v),writable:false,configurable:false,enumerable:true});
export const PROTEIN_FUNCTION_VERSION='protein-function/1';
export const PROTEIN_FUNCTION_SOURCES=freeze([
 {id:'protein-function-source-sun2022',title:'Sun 等2022：麵筋蛋白水解物及苦味',url:'https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2022.1022257/full',scope:'原研究的DH為已切肽鍵/初始肽鍵；同DH的苦味仍可因酵素而異。只採定義和非唯一性，不採製備配方或本台數字。'},
 {id:'protein-function-source-perez2024',title:'Pérez-Gálvez 等2024：界面及乳化性質',url:'https://pure.au.dk/ws/portalfiles/portal/451934351/1-s2.0-S0268005X24004090-main.pdf',scope:'作者機構全文：在指定原料、酵素、pH下分測吸附、界面力學及乳化行為；端點不同，不能以單一DH互相取代。'}
]);
export const PROTEIN_FUNCTION_REMEDIATION=freeze([
 {token:'protein-dh',lesson:'protein-hydrolysis',label:'DH分母與同DH的不同切法',why:'DH是切斷肽鍵的比例，不是殘基或蛋白質量比例；一個比例不能唯一指定切點。'},
 {token:'protein-cut-count',lesson:'protein-hydrolysis-balance',label:'線性鏈切k鍵得到k+1段',why:'只在段數與鍵數混淆時補這段；它不取代DH定義。'},
 {token:'protein-charge',lesson:'protein-peptide-termini',label:'新末端與條件式質子化',why:'新增N/C端不等於淨電荷必增加；需pH、pKa與環境。'},
 {token:'protein-solubility',lesson:'protein-salt-ph',label:'溶解／回收端點與食品條件',why:'pH、離子條件、構形及歷史可共同影響觀察；上清回收不是所有功能的代理。'},
 {token:'protein-network',lesson:'protein-networks',label:'界面與網絡的多種作用',why:'上清、界面成膜與物理穩定需各自量測；不能以一個端點保證另一個。'},
 {token:'protein-nutrition',lesson:'protein-alternative-quality',label:'營養需要獨立胺基酸與消化端點',why:'功能性與DH不是消化率或營養品質；體外端點也不直接等於迴腸資料。'}
].map(r=>({...r,href:`#learn/proteins/${r.lesson}/understand?prep=${r.token}`})));
export const PROTEIN_FUNCTION_DIAGNOSTIC=freeze([
 {id:'denominator',label:'DH=20%的分母是什麼？',options:[['residues','原始胺基酸殘基數'],['bonds','原始可計入的肽鍵總數'],['mass','原始蛋白質質量']],answer:'bonds',why:'DH=h/h_tot：已切肽鍵/初始肽鍵。這個比例不直接報告各肽段、溶解性或食品功能。',remedies:['protein-dh']},
 {id:'distribution',label:'兩批同DH，能否唯一指定肽段分布？',options:[['same','可以，長度與序列必相同'],['nonunique','不可以，切點與序列分布仍需資訊'],['free','表示已全變成游離胺基酸']],answer:'nonunique',why:'相同切鍵比例可以由不同切點達成。對未改質線性鏈，切k鍵得到k+1段，但這不指定各段長度或序列。',remedies:['protein-dh','protein-cut-count']},
 {id:'termini',label:'新增N/C端後，哪個推論有條件？',options:[['must','淨電荷和溶解性都必上升'],['conditional','需pH/pKa/側鏈及量測條件，不能保證功能單調改善'],['none','切肽鍵不會新增末端']],answer:'conditional',why:'新末端是結構推論；其正負質子化貢獻可相抵，且構形、序列、離子條件共同影響功能。新增末端不能單獨證明溶解或乳化改善。',remedies:['protein-charge','protein-solubility']}
]);
export const PROTEIN_FUNCTION_VIEWS=freeze([
 {id:'diagnostic',label:'可跳過的先備診斷'}, {id:'guided',label:'讀取功能記錄：中性乳化目標'},
 {id:'acid-regular',label:'撤除提示：酸飲的兩項目標'}, {id:'acid-strict',label:'撤除提示：收緊同一產品目標'}
]);
export const PROTEIN_FUNCTION_CHOICES=freeze([['A','A'],['B','B'],['both','A與B都符合'],['neither','A與B都不符合'],['need-evidence','尚有候選物，需要補記錄']]);
export const PROTEIN_FUNCTION_WORKED=freeze({structure:{residues:11,bonds:10,cuts:2,S1:{sites:[1,6],lengths:[1,5,5]},S2:{sites:[3,7],lengths:[3,4,4]}},W:{W1:{M1:90,E:20},W2:{M1:65,E:5},minimumM1:60,maximumE:10},reason:'S1/S2各切2/10=20%，都形成3段，但分布不同。這不是功能A/B的序列。獨立W1/W2題設的條件相同：W1的上清回收90%較高卻析油20%超線；W2同時符合≥60%與≤10%。作答依序列條件、觀察、兩項判準、候選機制及還缺的證據；不能把較高上清當成膜或營養較好。'});
const assay='M1：按題設共同蛋白基準校正的上清蛋白/肽回收量÷投入蛋白量×100%；同一校正及回收資格，不是單分子平衡溶解度。';
const cn={condition:'C_N',pH:7,ionicStrengthMolL:0.05,proteinPeptideMgMl:10,temperatureC:25,M1:{A:70,B:90},E:{A:5,B:18},Edefinition:'E：同一觀察終點t_E的分離油質量÷初始油質量×100%。',criteria:{minimumM1:60,maximumE:10}};
const ca={condition:'C_A',pH:4,ionicStrengthMolL:0.02,proteinPeptideMgMl:5,temperatureC:25,M1:{A:45,B:85},sensoryMethod:'題設同條件感官法的0–10序位苦味等級；只作次序和本題門檻比較。'};
const trial=()=>({answers:{},response:'',revision:'',firstChoices:{},beforeSupport:[],first:null,revisionChecks:[]});
export function createProteinFunctionDraft(){return {view:'diagnostic',trials:Object.fromEntries(PROTEIN_FUNCTION_VIEWS.map(v=>[v.id,trial()])),workedSeen:false,hintSeen:false,sensorySeen:false,sourcesSeen:false,skipped:false,continueRequests:0,remedyRequests:[],contexts:[],displayLog:[],details:{}};}
function validView(v){if(!PROTEIN_FUNCTION_VIEWS.some(x=>x.id===v))throw new RangeError('Unknown protein-function view');return v;}
export function getProteinFunctionTrial(d){validView(d?.view);if(!d?.trials?.[d.view])throw new TypeError('A protein-function draft is required');return d.trials[d.view];}
export function setProteinFunctionView(d,v){getProteinFunctionTrial(d);d.view=validView(v);return d;}
export function proteinFunctionContext(d){validView(d?.view);if(d.view==='diagnostic')return {version:PROTEIN_FUNCTION_VERSION,view:d.view,given:'未改質、無環的線性多肽；DH是題設比例，不是效能模型。'};return {version:PROTEIN_FUNCTION_VERSION,view:d.view,record:'獨立原創假想A/B記錄；同起始蛋白標記、同方法DH20%，未提供序列分布或營養端點。',assay,...clone(d.view==='guided'?cn:ca),...(d.view==='guided'?{}:{criteria:{minimumM1:80,maximumBitterness:d.view==='acid-strict'?3:7},sensory:d.sensorySeen?{A:2,B:6}:null})};}
function contextId(d,c=proteinFunctionContext(d)){const key=JSON.stringify(c);let i=d.contexts.findIndex(x=>JSON.stringify(x)===key);if(i<0){d.contexts.push(freeze(clone(c)));i=d.contexts.length-1;}return i+1;}
export function markProteinFunctionShown(d){getProteinFunctionTrial(d);const id=contextId(d);if(d.displayLog.at(-1)!==id)d.displayLog.push(id);return id;}
function exposure(d){return {worked:d.workedSeen,hint:d.hintSeen,sensory:d.sensorySeen,sources:d.sourcesSeen,shownContexts:[...new Set(d.displayLog)]};}
export function setProteinFunctionAnswer(d,k,value){const t=getProteinFunctionTrial(d),keys=d.view==='diagnostic'?PROTEIN_FUNCTION_DIAGNOSTIC.map(x=>x.id):['choice'];if(!keys.includes(k)||typeof value!=='string')throw new TypeError('Unknown answer or non-text raw value');t.answers[k]=value;if(value&&!Object.hasOwn(t.firstChoices,k))lock(t.firstChoices,k,{value,contextId:contextId(d),exposure:exposure(d)});return d;}
export function setProteinFunctionText(d,kind,value){const t=getProteinFunctionTrial(d);if(typeof value!=='string'||!['response','revision'].includes(kind))throw new TypeError('Text is required');if(kind==='response'&&t.first)return false;t[kind]=value;return true;}
function support(d,kind){const t=getProteinFunctionTrial(d);t.beforeSupport.push(freeze({kind,answers:clone(t.answers),response:t.response,revision:t.revision,contextId:contextId(d),exposure:exposure(d)}));}
export function requestProteinFunctionSupport(d,kind){getProteinFunctionTrial(d);if(kind==='worked'){if(d.view!=='guided')throw new RangeError('Worked support is only in the guided view');if(!d.workedSeen){support(d,kind);d.workedSeen=true;return true;}}
 else if(kind==='hint'){if(d.view!=='guided')throw new RangeError('No hints in faded practice');if(!d.hintSeen){support(d,kind);d.hintSeen=true;return true;}}
 else if(kind==='sensory'){if(!d.view.startsWith('acid-'))throw new RangeError('No sensory record for this view');if(!d.sensorySeen){support(d,kind);d.sensorySeen=true;return true;}}
 else if(kind==='sources'){if(!d.sourcesSeen){support(d,kind);d.sourcesSeen=true;return true;}}
 else throw new RangeError('Unknown support');return false;}
export function skipProteinFunctionDiagnostic(d){getProteinFunctionTrial(d);d.skipped=true;d.view='guided';return d;}
export function requestProteinFunctionRemedy(d,token){if(!PROTEIN_FUNCTION_REMEDIATION.some(r=>r.token===token))throw new RangeError('Unknown remedy');d.remedyRequests.push(freeze({token,contextId:contextId(d)}));}
export function requestProteinFunctionContinue(d){getProteinFunctionTrial(d);d.continueRequests++;}
const choiceLabel=x=>PROTEIN_FUNCTION_CHOICES.find(v=>v[0]===x)?.[1]??String(x??'未作答');
export function evaluateProteinFunction(view,answers={},sensorySeen=false){validView(view);if(typeof sensorySeen!=='boolean')throw new TypeError('Sensory exposure must be a boolean');if(!answers||typeof answers!=='object')answers={};let fields;
 if(view==='diagnostic')fields=PROTEIN_FUNCTION_DIAGNOSTIC.map(q=>({id:q.id,label:q.label,complete:q.options.some(o=>o[0]===answers[q.id]),correct:answers[q.id]===q.answer,expected:q.options.find(o=>o[0]===q.answer)[1],why:q.why,remedies:q.remedies}));
 else{const expected=view==='guided'?'A':!sensorySeen?'need-evidence':view==='acid-strict'?'neither':'B';const why=view==='guided'?'C_N下A的M1=70≥60且E=5≤10；B雖M1=90較高，E=18>10，所以A符合本題兩項規格。E只支持指定終點的析油比較，不是直接成膜或吸附資料。':!sensorySeen?'C_A下A的M1=45<80已不符合；B的85≥80，只支持B通過M1項。苦味仍未知，B是待補記錄的候選，不能先判已通過，也不能稱兩者都不符合。':view==='acid-strict'?'C_A同一記錄，A的45<80；B雖85≥80但苦味6>3；所以這次兩者都不符合。這不同於缺感官資料時的待補證據。':'C_A下B的85≥80且苦味6≤7；A的45<80，即使苦味2較低仍不符合，所以B符合本題兩項規格。苦味等級只按題設序位/門檻解讀，不能說B是A三倍苦或消費者必偏好A。';fields=[{id:'choice',label:'依本次兩項目標判斷',complete:PROTEIN_FUNCTION_CHOICES.some(o=>o[0]===answers.choice),correct:answers.choice===expected,expected:choiceLabel(expected),why,remedies:['protein-solubility','protein-network','protein-nutrition']}];}
 return freeze({fields,correctCount:fields.filter(x=>x.correct).length,total:fields.length,complete:fields.every(x=>x.complete),correct:fields.every(x=>x.correct),reasonAutograded:false,nutritionalQuality:null,uniqueMechanism:null});}
function signature(d){const t=getProteinFunctionTrial(d);return JSON.stringify({answers:t.answers,response:t.response,revision:t.revision,context:proteinFunctionContext(d)});}
export function latestProteinFunctionCheck(d){const t=getProteinFunctionTrial(d);return t.revisionChecks.at(-1)??t.first;}
export function proteinFunctionStale(d){const c=latestProteinFunctionCheck(d);return Boolean(c&&c.signature!==signature(d));}
export function checkProteinFunction(d){const t=getProteinFunctionTrial(d),sig=signature(d);if(latestProteinFunctionCheck(d)?.signature===sig)return false;const first=!t.first,snapshot={answers:clone(t.answers),response:first?t.response:t.revision,contextId:contextId(d),exposure:exposure(d),result:evaluateProteinFunction(d.view,t.answers,d.sensorySeen),signature:sig};if(first){lock(t,'response',t.response);lock(t,'first',snapshot);}else t.revisionChecks.push(freeze(snapshot));return true;}
export function proteinFunctionReference(d){validView(d?.view);return ['先列當次C_N或C_A、M1分母與方法；有E時列固定t_E的析油基準。','逐項對照本次目標，分開已不合、已符合及仍缺記錄；不能只挑最大上清值。','切點、序列、電荷、構形及兩親性可作候選解釋；本題未提供A/B分布或界面機制量測，不能指定唯一原因。',...(d.view.startsWith('acid-')?['C_N到C_A同時改pH、I與蛋白/肽濃度；新記錄支持各條件下的端點比較，不能單獨證明pH造成差異。']:[]),'營養需獨立胺基酸及合格消化資料；苦味需獨立感官端點。原創規格不是食品安全、消費者接受或通用效能保證。'];}
export function buildProteinFunctionSummary(d){getProteinFunctionTrial(d);const text=[],textId=v=>{let i=text.indexOf(v);if(i<0){text.push(v);i=text.length-1;}return `T${i+1}`;},feedback=[],feedbackId=v=>{const s=JSON.stringify(v);let i=feedback.indexOf(s);if(i<0){feedback.push(s);i=feedback.length-1;}return `F${i+1}`;};
 const snap=s=>({answers:s.answers,text:textId(s.response),context:s.contextId,exposure:s.exposure,feedback:s.result?feedbackId(s.result):undefined});
 const rows=Object.entries(d.trials).filter(([id,t])=>d.displayLog.some(n=>d.contexts[n-1]?.view===id)||Object.keys(t.answers).length||t.response||t.revision||t.first||t.beforeSupport.length).map(([id,t])=>({slot:id,currentAnswers:t.answers,response:textId(t.response),revision:textId(t.revision),firstChoices:t.firstChoices,beforeSupport:t.beforeSupport.map(s=>({kind:s.kind,...snap(s),revision:textId(s.revision)})),firstChecked:t.first?snap(t.first):null,revisionChecks:t.revisionChecks.map(snap)}));
 return ['【蛋白水解的功能推理｜'+PROTEIN_FUNCTION_VERSION+'】','原創假想資料／任務門檻；無效能曲線。自由理由未自動評分；看過支援不等於學會。',`實際顯示順序（題設C編號）：${JSON.stringify(d.displayLog)}`,`支援曝光：${JSON.stringify(exposure(d))}；跳診斷：${d.skipped}；返回原課請求：${d.continueRequests}`,`補救請求：${JSON.stringify(d.remedyRequests)}`,'題設登錄（只登錄顯示／作答／支援／核對實際引用；非全部題庫）：',...d.contexts.map((c,i)=>`C${i+1} ${JSON.stringify(c)}`),d.workedSeen?'曾顯示獨立示範W（非功能A/B）：'+JSON.stringify(PROTEIN_FUNCTION_WORKED):'未顯示獨立示範W。',d.hintSeen?'曾顯示guided提示：將每個觀察分別對照規格，再分機制假說與尚缺端點。':'未顯示guided提示。','答案／支援前／首次核對與修訂（T=原文，F=當時feedback；首次選擇不是首次核對）：',JSON.stringify(rows),'當時feedback登錄（只有已核對者）：',...feedback.map((f,i)=>`F${i+1} ${f}`),'完整使用者原文登錄（不裁切；相同原文僅登一次）：',...text.map((t,i)=>`T${i+1}:\n${t}\n`),'來源：'+PROTEIN_FUNCTION_SOURCES.map(s=>s.id).join('；')].join('\n');}
