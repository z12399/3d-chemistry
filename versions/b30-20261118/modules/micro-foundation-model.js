// Fixed synthetic prerequisite records, not culture, pathogen or processing protocols.
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;},clone=v=>JSON.parse(JSON.stringify(v));
const lock=(o,k,v)=>Object.defineProperty(o,k,{value:freeze(v),writable:false,configurable:false,enumerable:true});
export const MICRO_FOUNDATION_VERSION='micro-foundation/1';
export const MICRO_FOUNDATION_BRANCHES=freeze({
 'd-value':{title:'D值：先分log下降與條件，再讀存活模型',anchor:'micro-spores',href:'#micro/micro-identity/micro-spores/observe',guided:'條件A的模型記錄 D_A',faded:'撤提示：另一條件的記錄 D_B'},
 cfu:{title:'CFU：先定可計數單位與原樣品基準',anchor:'micro-growth-cycle',href:'#micro/micro-growth/micro-growth-cycle/observe',guided:'有菌落的合成報告 C_A',faded:'撤提示：零菌落報告 C_B'}
});
export const MICRO_FOUNDATION_SOURCES=freeze([
 {id:'micro-source-dz',title:'FDA：Sterilizing Symbols (D,Z,F)',url:'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/inspection-guides/sterilizing-symbols-d-z-f',scope:'僅採D為指定條件的一個十倍下降及其基準；不移植排程或食品安全保證。'},
 {id:'micro-source-model-limits',title:'USDA ARS：Predictive Microbiology Overview',url:'https://pmp.ars.usda.gov/overview.aspx',scope:'僅採生存曲線可能有肩部、拖尾及模型須有適用條件；本台不擬合原始數據。'},
 {id:'micro-source-growth',title:'OpenStax Microbiology §9.1',url:'https://openstax.org/books/microbiology/pages/9-1-how-microbes-grow',scope:'CFU是指定條件下的菌落形成單位，聚集與回收使它不等於逐顆細胞或所有可存活個體。'},
 {id:'micro-source-plate-count',title:'FDA BAM Chapter3：Aerobic Plate Count',url:'https://www.fda.gov/food/laboratory-methods-food/bam-chapter-3-aerobic-plate-count',scope:'只採報告基準與零菌落仍需方法限定的原則；以下V、比例、報告刻度是合成題設，不是該方法程序、已驗LOD或真濃度上界。'}
]);
export const MICRO_FOUNDATION_REMEDIATION=freeze([
 {token:'d-log-scale',branch:'d-value',href:'#micro/micro-control/micro-decimal-reduction/understand?microprep=d-log-scale',label:'線性數量與log下降',why:'一個D是剩原量十分之一，不是每次減同一顆數。'},
 {token:'d-conditions',branch:'d-value',href:'#micro/micro-control/micro-decimal-reduction/understand?microprep=d-conditions',label:'D值的條件及模型',why:'先核對菌體、材料、溫度、回收方法和有效區間，不能跨條件借D。'},
 {token:'d-expectation',branch:'d-value',href:'#micro/micro-control/micro-decimal-reduction/understand?microprep=d-expectation',label:'族群期望量，不是逐顆保證',why:'小於1的連續模型值不是把一個個體切碎，也不等於確定零。'},
 {token:'d-nondetection',branch:'d-value',href:'#micro/micro-control/micro-decimal-reduction/understand?microprep=d-nondetection',label:'未檢出與零的不同',why:'未見菌落仍有取樣與回收邊界，不能當整批無存活的證明。'},
 {token:'cfu-unit',branch:'cfu',href:'#micro/micro-measurement/micro-plate-count/understand?microprep=cfu-unit',label:'菌落形成單位與個體細胞',why:'一個可形成菌落的單位可包含聚集細胞；不能自動逐顆換算。'},
 {token:'cfu-original-basis',branch:'cfu',href:'#micro/micro-measurement/micro-count-represented-sample/understand?microprep=cfu-original-basis',label:'測試量、比例與原樣品當量',why:'先將測試液量換成相同量綱的原樣品當量，再以菌落數除以該當量。'},
 {token:'cfu-recovery',branch:'cfu',href:'#micro/micro-measurement/micro-plate-count/understand?microprep=cfu-recovery',label:'在條件下可回收，不等於所有可存活者',why:'未成落有多種解釋；需對應測量，不能只由CFU辨認每個個體的生理狀態。'},
 {token:'cfu-nondetection',branch:'cfu',href:'#micro/micro-measurement/micro-count-represented-sample/understand?microprep=cfu-nondetection',label:'零觀察、報告刻度與偵測限制',why:'按給定規則回報小於一菌落刻度，不是保證真濃度在此上界內。'}
]);
const question=(id,label,options,answer,why,remedies)=>({id,label,options,answer,why,remedies});
export const MICRO_FOUNDATION_DIAGNOSTIC=freeze({
 'd-value':[
 question('log','在同一條件的log-linear模型中，每經一個D，哪個量固定？',[['tenfold','存留比例乘1/10，log10下降1'],['count','每次減同一顆數'],['zero','一個D後每顆都確定消失']],'tenfold','同一模型中N/N0每個D乘0.1；線性減少顆數隨剩量改變，D不保證每個個體的命運。',['d-log-scale']),
 question('conditions','能把條件A的D值直接搬到另一基質或回收方法B嗎？',[['match','先核對B的條件與模型資料'],['borrow','同菌名就可直接搬'],['mean','取兩篇D平均便能驗證B']],'match','D屬條件及模型；菌體、基質、溫度、回收與區間改變，不能只靠名稱或平均值外推。',['d-conditions']),
 question('expectation','某指定模型算得末量0.1個可計數單位，合理解讀是？',[['population','在明列基準下的族群期望量；非確定零'],['fraction','每個個體都只剩十分之一'],['none','已證整批零存活，未檢出也等於零']],'population','連續期望量小於1不等於分數個個體或逐顆消失保證；零觀察另有取樣和回收限制。',['d-expectation','d-nondetection'])
 ],
 cfu:[
 question('unit','一個CFU最直接表示什麼？',[['countable','在指定條件可形成菌落的單位'],['cell','恰好一顆活細胞'],['all','所有能以任何方式存活的細胞']],'countable','CFU可來自單細胞或聚集單位，且須在該回收條件成落；不是所有可存活者的逐顆總數。',['cfu-unit','cfu-recovery']),
 question('basis','V是以抽象體積U記錄的測試液量，f已含原始均質液體積當量/測試液體積；一菌落對應的每U原樣品報告刻度為？',[['inverse','1/(V×f)每U原樣品'],['divide','1/(V/f)，比例要反過來'],['forget','只寫1/V，不用原樣品基準']],'inverse','測到的原樣品當量是V×f；菌落數除這個當量才回到每U原樣品。g與mL不能任意互換。',['cfu-original-basis']),
 question('recovery','一份報告零菌落時，哪個結論成立？',[['observed','該條件未觀察到菌落；不能證所有個體已死'],['dead','每個細胞都已死亡'],['vbnc','必已唯一證明所有細胞是VBNC']],'observed','零觀察與真零不同；未成落可能關乎數量、聚集或回收，單一結果不能唯一判活死或VBNC。',['cfu-recovery','cfu-nondetection'])
 ]
});
export const MICRO_FOUNDATION_VIEWS=freeze([{id:'diagnostic',label:'可跳過的先備診斷'},{id:'guided',label:'指定條件的報告判讀'},{id:'faded',label:'撤提示：換條件與補記錄'}]);
const commonModel='原創合成記錄，非實驗數據或操作指南。u是抽象時間單位；U是原始均質液與本報告共用的抽象體積單位，原樣品指本筆原始均質液，不換算成均質前食品克數。沒有對應實際菌株、食品、培養條件或熱處理排程。';
const records=freeze({
 'd-value':{
  guided:{id:'D_A',model:commonModel,condition:'A：同一菌體狀態、材料、固定溫度及回收定義；只在本指定區間採log-linear族群模型。',basis:'N是此固定樣品基準下的可計數單位模型期望量，不是每個個體的確定命運。',initial:1000,interval:'2 D_A',dRecord:'D_A為A條件的一個十倍下降所需u；本題區間恰為2D_A。'},
  faded:{id:'D_B',model:commonModel,condition:'另一條件B：材料與回收定義均改變。',basis:'N仍以本筆固定樣品基準表示；不與另一份記錄合併成實測曲線。',initial:100,interval:'3 u',dRecord:null,modelRecord:null}
 },
 cfu:{
  guided:{id:'C_A',model:commonModel,condition:'本題指定可用的有效合成報告；計數與量測定義已給，不指示任何培養或取樣程序，也不聲稱符合特定實驗方法規範。',basis:'f已定義為原始均質液體積當量/測試液體積；V和Vf都以同一U計，不含均質前食品g↔液體mL換算。',colonies:40,testedAmount:'0.25 U',originalFraction:'0.01',recovery:'只能指該報告條件的菌落形成單位，無獨立逐顆細胞或所有可存活個體資料。'},
  faded:{id:'C_B',model:commonModel,condition:'另一份合成報告，原樣品換算記錄未附。',basis:'題設報告規則：零菌落時回報「小於一菌落對應的原樣品基準刻度」；這不是已驗LOD、95%上界或真濃度保證。',colonies:0,testedAmount:'0.5 U',originalFraction:null,recovery:'沒有另外的逐顆活性或回收完整度證據。'}
 }
});
export const MICRO_FOUNDATION_SUPPLEMENTS=freeze({
 'd-value':{label:'查看B的獨立條件／模型記錄',record:{condition:'這是B本身的指定模型記錄，非由A搬來。',dB:'1 u',validity:'僅此3u區間指定log-linear；D_B與N的回收定義一致。'}},
 cfu:{label:'查看本報告原樣品當量記錄',record:{condition:'獨立報告欄位，非從零菌落倒算。',fraction:'0.2',basis:'0.5U測試量×0.2=0.1U原始均質樣品當量；同一量綱。'}}
});
export const MICRO_FOUNDATION_WORKED=freeze({
 'd-value':{given:'獨立W：自己的條件W在指定區間採log-linear，N0=10000，區間=1D_W。未給實際溫度、菌株或食品。',reason:'先核W自己的條件，再用存留比例0.1得期望N=1000。可報1log下降，不把1000當逐顆存活保證。W不是當前D_A或D_B的答案。'},
 cfu:{given:'獨立W報告：12菌落；題設已換回的測試原樣品當量為0.02U，回收定義固定。',reason:'先讀當量基準，再算12/0.02=600CFU/U；可報在該條件下的菌落形成單位濃度，不能把12或600當逐顆細胞。W不是當前C_A或C_B的答案。'}
});
function branchInfo(branch){if(typeof branch!=='string'||!Object.hasOwn(MICRO_FOUNDATION_BRANCHES,branch))throw new RangeError('Unknown microbial prerequisite branch');return MICRO_FOUNDATION_BRANCHES[branch];}
function validView(view){if(!MICRO_FOUNDATION_VIEWS.some(x=>x.id===view))throw new RangeError('Unknown microbial prerequisite task');return view;}
const trial=()=>({answers:{},response:'',revision:'',firstChoices:{},beforeSupport:[],first:null,revisionChecks:[]});
export function createMicroFoundationDraft(branch){branchInfo(branch);const d={view:'diagnostic',trials:Object.fromEntries(MICRO_FOUNDATION_VIEWS.map(x=>[x.id,trial()])),workedSeen:false,hintSeen:false,recordSeen:false,sourcesSeen:false,skipped:false,continueRequests:0,remedyRequests:[],contexts:[],displayLog:[],details:{}};lock(d,'branch',branch);return d;}
export function getMicroFoundationTrial(d){branchInfo(d?.branch);validView(d?.view);if(!d?.trials?.[d.view])throw new TypeError('A microbial prerequisite draft is required');return d.trials[d.view];}
export function setMicroFoundationView(d,view){getMicroFoundationTrial(d);d.view=validView(view);return d;}
export function microFoundationContext(d){getMicroFoundationTrial(d);return d.view==='diagnostic'?{version:MICRO_FOUNDATION_VERSION,branch:d.branch,view:d.view,given:'只核對定義、基準與模型條件，沒有培養或處理程序。'}:{version:MICRO_FOUNDATION_VERSION,branch:d.branch,view:d.view,...clone(records[d.branch][d.view]),...(d.view==='faded'?{supplement:d.recordSeen?clone(MICRO_FOUNDATION_SUPPLEMENTS[d.branch].record):null}:{})};}
function contextId(d){const c=microFoundationContext(d),s=JSON.stringify(c);let i=d.contexts.findIndex(x=>JSON.stringify(x)===s);if(i<0){d.contexts.push(freeze(c));i=d.contexts.length-1;}return i+1;}
export function markMicroFoundationShown(d){const id=contextId(d);if(d.displayLog.at(-1)!==id)d.displayLog.push(id);return id;}
const exposure=d=>({worked:d.workedSeen,hint:d.hintSeen,record:d.recordSeen,sources:d.sourcesSeen,shown:[...new Set(d.displayLog)]});
export function setMicroFoundationAnswer(d,key,raw){const t=getMicroFoundationTrial(d),keys=d.view==='diagnostic'?MICRO_FOUNDATION_DIAGNOSTIC[d.branch].map(x=>x.id):['amount','claim','evidence'];if(!keys.includes(key)||typeof raw!=='string')throw new TypeError('Unknown answer or non-text raw value');t.answers[key]=raw;if(raw&&!Object.hasOwn(t.firstChoices,key))lock(t.firstChoices,key,{value:raw,contextId:contextId(d),exposure:exposure(d)});return d;}
export function setMicroFoundationText(d,kind,raw){const t=getMicroFoundationTrial(d);if(!['response','revision'].includes(kind)||typeof raw!=='string')throw new TypeError('Text is required');if(kind==='response'&&t.first)return false;t[kind]=raw;return true;}
function beforeSupport(d,kind){const t=getMicroFoundationTrial(d);t.beforeSupport.push(freeze({kind,answers:clone(t.answers),response:t.response,revision:t.revision,contextId:contextId(d),exposure:exposure(d)}));}
export function requestMicroFoundationSupport(d,kind){getMicroFoundationTrial(d);const flag={worked:'workedSeen',hint:'hintSeen',record:'recordSeen',sources:'sourcesSeen'}[kind];if(!flag||(['worked','hint'].includes(kind)&&d.view!=='guided')||(kind==='record'&&d.view!=='faded'))throw new RangeError('Unsupported support for this task');if(d[flag])return false;beforeSupport(d,kind);d[flag]=true;return true;}
export function skipMicroFoundationDiagnostic(d){getMicroFoundationTrial(d);d.skipped=true;d.view='guided';return d;}
export function requestMicroFoundationRemedy(d,token){if(!MICRO_FOUNDATION_REMEDIATION.some(r=>r.token===token&&r.branch===d.branch))throw new RangeError('Foreign or unknown remedy');d.remedyRequests.push(freeze({token,contextId:contextId(d)}));}
export function requestMicroFoundationContinue(d){getMicroFoundationTrial(d);d.continueRequests++;}
export function parseMicroFoundationAmount(raw){if(typeof raw!=='string'||!raw.trim()||raw.length>128)return null;const s=raw.trim(),m=/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d+))?$/i.exec(s);if(!m)return null;const n=Number(s),fraction=m[3]??m[4]??'',digits=(m[2]??'')+fraction,coefficient=BigInt(digits||'0')*(m[1]==='-'?-1n:1n),power=Number(m[5]??'0')-fraction.length;if(!Number.isFinite(n)||!Number.isInteger(power)||Math.abs(power)>1000||(coefficient!==0n&&n===0))return null;return {numerator:power>=0?coefficient*10n**BigInt(power):coefficient,denominator:power<0?10n**BigInt(-power):1n};}
export function microFoundationFields(branch,view){branchInfo(branch);validView(view);if(view==='diagnostic')return MICRO_FOUNDATION_DIAGNOSTIC[branch];const isD=branch==='d-value';return [
 {id:'amount',type:'number',label:isD?'本筆末端模型期望量（填數值；缺條件時填「資料不足」）':'本筆每U原樣品的值：C_A填CFU濃度，C_B填一菌落報告刻度（不足填「資料不足」）'},
 {id:'claim',label:'當次資料能支持哪種結論？',options:isD?[['log-linear','在本條件指定模型中做族群量換算'],['need-b','需B本身的D及有效模型記錄'],['fractional-expectation','B指定模型給小於1的期望量，非確定零'],['borrow','用A的D或另一研究直接保證B']]:[['countable-units','給定條件下的菌落形成單位濃度'],['need-basis','缺原樣品當量記錄，尚不能換算刻度'],['below-step','按題設規則回報小於一菌落刻度'],['all-cells','已知全部活細胞數或真濃度為零']]},
 {id:'evidence',label:'哪個證據界線保留得當？',options:isD?[['conditional-population','模型與回收基準限定族群量，非逐顆或安全保證'],['individual','期望量小於1就保證每個個體死亡'],['zero','未檢出便證明整批數量零']]:[['recovery-limited','只能報本條件可回收單位；其他活性狀態另需證據'],['exact-cells','一個CFU必等於一顆細胞'],['true-upper','零菌落保證真濃度小於該刻度'],['vbnc-only','零菌落唯一證明是VBNC']]}
 ];}
export function evaluateMicroFoundation(branch,view,answers={},recordSeen=false){branchInfo(branch);validView(view);if(typeof recordSeen!=='boolean')throw new TypeError('Record exposure must be boolean');if(!answers||typeof answers!=='object')answers={};let fields;if(view==='diagnostic')fields=MICRO_FOUNDATION_DIAGNOSTIC[branch].map(q=>({id:q.id,label:q.label,complete:q.options.some(x=>x[0]===answers[q.id]),correct:answers[q.id]===q.answer,expected:q.options.find(x=>x[0]===q.answer)[1],why:q.why,remedies:q.remedies}));else{
 const isD=branch==='d-value',guided=view==='guided',qs=microFoundationFields(branch,view),unknown=!guided&&!recordSeen,expected=isD?(guided?'10':'0.1'):(guided?'16000':'10'),parsed=parseMicroFoundationAmount(answers.amount),exact=parseMicroFoundationAmount(expected),claim=isD?(guided?'log-linear':unknown?'need-b':'fractional-expectation'):(guided?'countable-units':unknown?'need-basis':'below-step'),evidence=isD?'conditional-population':'recovery-limited';
 const amountWhy=isD?(guided?'A指定2D_A使存留比例10^-2；1000×0.01=10是本筆基準的模型期望量，不是10個必定存活的個體。':unknown?'B已改材料與回收定義；未給B的D及模型，不能用A的D填末量或把未知當0。':'B獨立記錄給D_B=1u，3u為3D_B；100×10^-3=0.1是族群模型期望量，非確定零。'):(guided?'原樣品當量Vf=0.25U×0.01=0.0025U；40/0.0025=16000CFU/U。不把U換成未給的g或mL。':unknown?'已知本報告零菌落，但缺原樣品比例f；不能由零倒算f，尚不能報每U原樣品的一菌落刻度。':'補記錄給原樣品當量0.5U×0.2=0.1U，刻度1/0.1=10CFU/U。按題設規則回報<10；不是保證真濃度<10或已驗LOD。');
 const claimWhy=isD?(guided?'條件A及log-linear區間已明列，可做此指定族群模型換算；不能以D比較不同研究的內在耐受性。':unknown?'B的D和曲線形狀待查；條件名字或A的紀錄都不能補出B模型。':'B自己的記錄才支持本段3log換算；0.1是連續期望量，不能據此宣稱必無一個體。'):(guided?'菌落來自可回收單位，可能涉及聚集；16000CFU/U不是16000顆細胞/U，也不涵蓋所有可存活狀態。':unknown?'零觀察先保留為零觀察；取得V與f同基準記錄後，才能按題設定義報告刻度。':'<10是本題明示的報告慣例，不是真濃度的統計上界。零觀察不能唯一解釋為死光或VBNC。');
 const evidenceWhy=isD?'D與N需共用明列條件及回收基準；模型期望量不保證單一個體命運、未檢出或整批食品安全。':'CFU受聚集、回收與取樣影響；要談逐顆活性或VBNC需獨立證據，不能由單一菌落數唯一判斷。';
 fields=[{id:'amount',label:qs[0].label,complete:unknown?typeof answers.amount==='string'&&answers.amount.trim()==='資料不足':parsed!==null,correct:unknown?typeof answers.amount==='string'&&answers.amount.trim()==='資料不足':parsed!==null&&parsed.numerator*exact.denominator===exact.numerator*parsed.denominator,expected:unknown?'資料不足':expected+(isD?' 個模型期望單位':' CFU/U（C_B為報告刻度）'),why:amountWhy,remedies:isD?['d-log-scale','d-conditions']:['cfu-original-basis','cfu-nondetection']},...[
 ['claim',claim,claimWhy,isD?['d-conditions','d-expectation']:['cfu-unit','cfu-nondetection']],['evidence',evidence,evidenceWhy,isD?['d-expectation','d-nondetection']:['cfu-recovery','cfu-nondetection']]
 ].map(([id,key,why,remedies])=>{const q=qs.find(x=>x.id===id);return {id,label:q.label,complete:q.options.some(x=>x[0]===answers[id]),correct:answers[id]===key,expected:q.options.find(x=>x[0]===key)[1],why,remedies};})];
 }
 return freeze({fields,correctCount:fields.filter(x=>x.correct).length,total:fields.length,complete:fields.every(x=>x.complete),correct:fields.every(x=>x.correct),reasonAutograded:false,individualGuarantee:null,trueCellCount:null,foodSafety:null});}
function signature(d){const t=getMicroFoundationTrial(d);return JSON.stringify({answers:t.answers,response:t.response,revision:t.revision,context:microFoundationContext(d)});}
export function latestMicroFoundationCheck(d){const t=getMicroFoundationTrial(d);return t.revisionChecks.at(-1)??t.first;}
export function microFoundationStale(d){const c=latestMicroFoundationCheck(d);return Boolean(c&&c.signature!==signature(d));}
export function checkMicroFoundation(d){const t=getMicroFoundationTrial(d),sig=signature(d);if(latestMicroFoundationCheck(d)?.signature===sig)return false;const first=!t.first,s={answers:clone(t.answers),response:first?t.response:t.revision,contextId:contextId(d),exposure:exposure(d),result:evaluateMicroFoundation(d.branch,d.view,t.answers,d.recordSeen),signature:sig};if(first){lock(t,'response',t.response);lock(t,'first',s);}else t.revisionChecks.push(freeze(s));return true;}
export function microFoundationReference(d){getMicroFoundationTrial(d);return d.branch==='d-value'?['先列N的樣品基準、回收定義及本筆條件；D是十倍下降，不是固定顆數。','僅在指定log-linear區間用N=N0×10^(-t/D)；B缺記錄時先報資訊不足，不借A。','小於1是族群期望量，非分數個個體或必定零；未檢出要另核取樣及回收界線。','不同研究的D、菌體狀態和材料不能直接合成同一製程的保證；不推個體命運或食品安全。']:['先標CFU的量測對象，再把V與f換成同量綱的原樣品當量Vf。','有菌落時按題設資料算CFU/U；不能從CFU逐顆數細胞，或把g與mL任意互換。','零觀察按題設reporting convention處理；一菌落刻度不是已驗LOD、95%上界或真濃度保證。','不能由單一CFU結果唯一判死亡、VBNC或代謝停滯；需對應方法及獨立狀態證據。'];}
export function buildMicroFoundationSummary(d){getMicroFoundationTrial(d);const texts=[],feedback=[],exposures=[],policy={reasonAutograded:false,individualGuarantee:null,trueCellCount:null,foodSafety:null};let policyUsed=false;const intern=(arr,v,prefix)=>{const str=typeof v==='string'?v:JSON.stringify(v);let i=arr.findIndex(x=>x===str);if(i<0){arr.push(str);i=arr.length-1;}return prefix+(i+1);},tid=v=>intern(texts,v,'T'),xid=v=>intern(exposures,v,'X'),fid=v=>intern(feedback,v,'F');
 const packedResult=r=>{const out={...r,fields:r.fields.map(fid)};if(Object.entries(policy).every(([k,v])=>Object.hasOwn(r,k)&&r[k]===v)){for(const k of Object.keys(policy))delete out[k];out.policy='G1';policyUsed=true;}return out;},snap=s=>({answers:s.answers,text:tid(s.response),context:s.contextId,exposure:xid(s.exposure),feedback:s.result?packedResult(s.result):undefined});
 const rows=Object.entries(d.trials).filter(([id,v])=>d.displayLog.some(n=>d.contexts[n-1]?.view===id)||Object.keys(v.answers).length||v.response||v.revision||v.first||v.beforeSupport.length).map(([id,v])=>({slot:id,currentAnswers:v.answers,response:tid(v.response),revision:tid(v.revision),firstChoices:Object.fromEntries(Object.entries(v.firstChoices).map(([k,s])=>[k,{value:s.value,context:s.contextId,exposure:xid(s.exposure)}])),beforeSupport:v.beforeSupport.map(s=>({kind:s.kind,...snap(s),revision:tid(s.revision)})),firstChecked:v.first?snap(v.first):null,revisionChecks:v.revisionChecks.map(snap)}));
 const contextRows=d.contexts.map((c,i)=>{const baseCopy={...c};delete baseCopy.supplement;const j=Object.hasOwn(c,'supplement')?d.contexts.slice(0,i).findIndex(p=>{if(!Object.hasOwn(p,'supplement'))return false;const prior={...p};delete prior.supplement;return JSON.stringify(prior)===JSON.stringify(baseCopy);}):-1;return `C${i+1} ${JSON.stringify(j<0?c:{base:`C${j+1}`,supplement:c.supplement})}`;});
 return [`【${MICRO_FOUNDATION_BRANCHES[d.branch].title}｜${MICRO_FOUNDATION_VERSION}】`,'全部合成報告／抽象同量綱單位；無培養或處理程序。結構化欄核對，自由理由自評，不宣稱盲測。',`branch=${d.branch}；實際顯示順序C=${JSON.stringify(d.displayLog)}；跳診斷=${d.skipped}；返回原課請求=${d.continueRequests}`,`目前曝光=${xid(exposure(d))}；補救請求=${JSON.stringify(d.remedyRequests)}`,'題設C登錄（實際引用，非未訪題庫；含base者保留該C全部欄位，再以本列supplement覆寫還原）：',...contextRows,d.workedSeen?'已顯示獨立W：'+JSON.stringify(MICRO_FOUNDATION_WORKED[d.branch]):'未顯示獨立W。',d.hintSeen?'已顯示部分提示：先定計數對象及原樣品基準，核條件與模型，再分可得量和未附證據。':'未顯示部分提示。','首選/支援前/首次核對/修訂（C題設、X曝光、F當時feedback、T原文；首選非首次核對）：',JSON.stringify(rows),'曝光X：',...exposures.map((x,i)=>`X${i+1} ${x}`),...(policyUsed?['共用核對政策G1（feedback含policy時合併還原）：',`G1 ${JSON.stringify(policy)}`]:[]),'只有已核對者的feedback F：',...feedback.map((f,i)=>`F${i+1} ${f}`),'完整使用者原文T（相同原文只登一次，不裁切）：',...texts.map((s,i)=>`T${i+1}:\n${s}\n`),'來源ID：'+MICRO_FOUNDATION_SOURCES.map(s=>s.id).join('；')].join('\n');}
