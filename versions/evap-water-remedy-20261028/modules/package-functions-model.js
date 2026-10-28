// Original qualitative design briefs and a bounded primary-study reading. No performance simulator.
export const PACKAGE_FUNCTIONS_ID='package-functions-reasoning';
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const text=v=>typeof v==='string'?v:'';
const lock=(o,k,v)=>Object.defineProperty(o,k,{value:v,writable:false,configurable:false,enumerable:true});
export const PACKAGE_FUNCTIONS=freeze([
 {id:'containment',label:'容裝',purpose:'把給定數量與形態的食品維持成可搬運、分配的單位。',evidence:'對應食品與使用條件下的容裝、散落／洩漏、運輸及取用觀察；不能只看包材名稱。'},
 {id:'protection',label:'保護',purpose:'針對本食品的水分、氧氣、壓損等需求提出保護假設。',evidence:'相符的整包與封口、搬運及產品品質端點；膜片阻隔數值不是整包／開封後表現。'},
 {id:'convenience',label:'便利',purpose:'讓指定使用者完成攜帶、開啟、取份與再封等任務。',evidence:'指定使用者在明確任務下的觀察、可完成性與困難原因；設計名稱不等於易用已證。'},
 {id:'communication',label:'資訊傳遞',purpose:'讓使用者辨認內容與理解所需使用資訊。',evidence:'目標使用者能否辨認並理解相關內容與操作；圖示或文字存在不等於理解正確。'}
]);
export const PACKAGE_FEATURES=freeze([
 {id:'tray',label:'支撐托盤',intent:'本題設計者想把餅乾定位成一組，並減少搬運時的擠壓。',functions:['containment','protection'],tradeoff:'托盤占用空間，開啟及拿取是否合適仍待觀察；沒有材料或環境效益比較。',evidence:'匹配搬運條件的完整包裝與破碎／取用觀察。'},
 {id:'portion',label:'獨立份量包',intent:'本題想把食品分成可帶走的單位，並讓一次取份較明確。',functions:['containment','convenience'],tradeoff:'多一層或多個包裝也可能增加開啟動作；未證實每個人更方便或總材料較少。',evidence:'指定使用者的攜帶、開啟與取份任務；沒有分裝成功率或保存期資料。'},
 {id:'reseal',label:'可再封結構',intent:'本題想在開封後重新收攏剩餘食品，並支援多次取用。',functions:['containment','convenience'],tradeoff:'重新合上不等於恢復出廠原封；是否限制水分交換需另有整包證據。',evidence:'反覆取用／收攏觀察與相符的再封後包裝、產品品質測試。'},
 {id:'barrier',label:'阻隔層',intent:'本題想降低指定物質交換的影響；尚未給定材料、封口或實測值。',functions:['protection'],tradeoff:'保護的目的不決定能否開啟、取用或辨讀；也沒有通用最佳材料。',evidence:'相符條件下的膜片、封口、整包與產品端點，並清楚區分尚缺的層級。'},
 {id:'opening',label:'開啟拉片及位置提示',intent:'本題想提示從哪裡開始，並提供可施力的開啟位置。',functions:['convenience','communication'],tradeoff:'有拉片或提示不表示指定使用者看得懂、抓得住或開得開。',evidence:'目標使用者的辨認與實際開啟觀察；不能只由外觀或指力推成功。'},
 {id:'label',label:'內容與取用資訊',intent:'本題想讓人辨認內容，並理解如何取份／處理剩餘食品。',functions:['communication','convenience'],tradeoff:'字多不代表辨讀佳；這裡沒有法規完整性、健康宣稱或正確理解的認證。',evidence:'指定使用者的辨識、理解與操作任務；不能用標示存在替代測試。'}
]);
export const PACKAGE_CONTEXTS=freeze([
 {id:'family',label:'原情境：家中多次取用',given:'原創乾脆食品案例：家中分次取用，需收攏剩餘餅乾、避免散落，並保留內容與取用資訊。材料、封口、環境、保存期及實際使用資料未給。'},
 {id:'commute',label:'遷移：外出攜帶一次份量',given:'仍是原創同種乾脆食品，但使用情境改成外出攜帶一次份量。要重問攜帶、開啟、散落與所需資訊；不能沿用家中取用的便利結論。'},
 {id:'grip',label:'遷移：開啟能力需要核查',given:'食品相同，但要服務開啟動作有困難的使用者。這不是已量得的人體能力資料；需要對應使用者與實際任務證據，不能直接套另一研究的結果。'}
]);
export const PACKAGE_PLANS=freeze([
 {id:'whole',label:'原案A：一個整包',given:'同量餅乾放在一個包裝；只給設計描述，沒有材料、尺寸、封口或使用測量。'},
 {id:'portions',label:'原案B：分成多個份量包',given:'同量餅乾分成數個份量單位；只給設計描述，未指定份數、額外材料量、開啟成功或品質改善。'}
]);
export const PACKAGE_SOURCES=freeze([
 {id:'package-four-functions-authority',label:'OSU Extension：Sustainable Food Packaging Options（2021）',url:'https://extension.okstate.edu/fact-sheets/sustainable-food-packaging-options',scope:'大學推廣資料列出容裝、保護、便利、資訊四種功能；本課只用功能框架及設計考量，不把其環境論述換成原創案例的環境效益。'},
 {id:'package-usability-primary',label:'Bell、Walton與Tapsell（2016）：包裝開啟原始研究',url:'https://doi.org/10.1016/j.appet.2015.12.004',scope:'40位NSW社區自立、年齡超過65歲且自述狀況良好者的便利樣本，觀察醫院供應食品包裝開啟；不是正式健康篩檢或住院者試驗，也不是原創餅乾方案的比較。只作質性研究範圍判讀。'}
]);
const opts=(...rows)=>rows.map(([id,label])=>({id,label}));
export const PACKAGE_STATIONS=freeze([
 {id:'needs',title:'1．先把同一食品的需求說清楚',prompt:'只憑這個原案及目前使用情境，哪個結論站得住？',options:opts(['requirements','先列容裝、保護、便利與資訊需求；方案是否達成仍需相符證據'],['small','份量包必定對所有人更方便、更耐存'],['barrier','只要膜片阻隔較高，其他功能便已完成'],['universal','只看包裝名稱便能選出通用最佳方案'])},
 {id:'feature',title:'2．一項特徵可以連到幾種功能？',prompt:'依本題已明示的設計用途，多選被連結的功能，再限定這種連結的意思。其他合理用途可寫理由，但未自動評分。',options:opts(['bounded','這些是題目明示的多功能設計意圖；尚未證實成效'],['exclusive','每個特徵科學上只能屬於一種功能'],['validated','勾到功能就表示已完成實驗驗證'],['all','任何特徵都已證實同時達成全部四功能'])},
 {id:'evidence',title:'3．為這個功能挑相符的證據',prompt:'依目前所選功能，甚麼證據鏈可減少把設計意圖誤當成效？',options:opts(['matched','核對相符使用情境、完整包裝／使用者任務及該功能端點；未知保留'],['film','所有功能都只需要膜片阻隔一個數字'],['claim','包裝印有功能或圖示便足以確認達成'],['test-all','有一個端點通過，便代表其他端點與所有情境也通過'])},
 {id:'study',title:'4．原始研究究竟測了誰與甚麼？',prompt:'Bell等開啟研究，可以支持哪個範圍的判讀？',options:opts(['scoped','指定社區高齡者與指定包裝的開啟觀察有其範圍；新設計仍待測'],['all-users','它直接代表全部住院者與所有使用者的成功率'],['package-ranking','它已證明本題分裝比整包容易開'],['life','開得開就表示保存期與食品安全已驗證'])},
 {id:'transfer',title:'5．換了使用情境，原判讀還能搬嗎？',prompt:'與原本家中多次取用情境相比，應如何處理現在的判讀？',options:opts(['reassess','使用情境已變，重問四功能需求與相符證據，保留舊判讀為歷史'],['retained','使用情境未變，仍只保留原有設計假說與未知'],['same-name','食品名稱相同，所以所有便利與品質結論都可直接沿用'],['reseal','任何再封結構都可恢復原封性能'])},
 {id:'synthesis',title:'6．把分散判斷組成申論',prompt:'哪種答案有交代功能、因果鏈、取捨與證據界線？',options:opts(['chain','同一食品四需求→特徵可能如何作用→可能代價→相符端點與未知'],['list','只列四個名詞，不交代食品或作用'],['only-protection','只寫氧氣阻隔即可當完整四功能答案'],['guarantee','直接宣布所選包裝安全、耐存且對所有人最佳'])}
]);
const maps={station:new Map(PACKAGE_STATIONS.map(x=>[x.id,x])),function:new Map(PACKAGE_FUNCTIONS.map(x=>[x.id,x])),feature:new Map(PACKAGE_FEATURES.map(x=>[x.id,x])),context:new Map(PACKAGE_CONTEXTS.map(x=>[x.id,x])),plan:new Map(PACKAGE_PLANS.map(x=>[x.id,x]))};
const find=(kind,id)=>{const v=maps[kind].get(id);if(!v)throw new RangeError('Unknown package '+kind);return v;};
export const getPackageStation=id=>find('station',id);
export const getPackageContext=id=>find('context',id);
export const getPackagePlan=id=>find('plan',id);
export function validatePackageSet(kind,ids){if(!['feature','function'].includes(kind)||!Array.isArray(ids))throw new TypeError('A package selection array is required');const seen=new Set();for(const id of ids){find(kind,id);if(seen.has(id))throw new RangeError('Duplicate package selection');seen.add(id);}const source=kind==='feature'?PACKAGE_FEATURES:PACKAGE_FUNCTIONS;return source.filter(x=>seen.has(x.id)).map(x=>x.id);}
function valid(d){if(!d||typeof d!=='object'||!d.trials||Array.isArray(d.trials))throw new TypeError('A package draft is required');getPackageStation(d.stationId);getPackageContext(d.contextId);getPackagePlan(d.planId);find('function',d.functionId);validatePackageSet('feature',d.featureIds);validatePackageSet('function',d.functionIds);return d;}
export function createPackageDraft(){return {stationId:'needs',contextId:'family',planId:'whole',featureIds:['portion','reseal'],functionIds:[],functionId:'protection',trials:{},synthesis:'',details:{}};}
export function setPackageControl(d,key,value){valid(d);if(key==='stationId')getPackageStation(value);else if(key==='contextId')getPackageContext(value);else if(key==='planId')getPackagePlan(value);else if(key==='featureIds')value=validatePackageSet('feature',value);else if(key==='functionIds')value=validatePackageSet('function',value);else if(key==='functionId')find('function',value);else throw new RangeError('Unavailable package control');d[key]=value;return d;}
export function getPackageTrial(d){valid(d);if(!Object.hasOwn(d.trials,d.stationId))d.trials[d.stationId]={prediction:'',predictionReason:'',revealed:null,choice:'',reason:'',checked:null,revision:''};return d.trials[d.stationId];}
export function packageContext(d){valid(d);return {stationId:d.stationId,contextId:d.contextId,planId:d.planId,featureIds:validatePackageSet('feature',d.featureIds),functionId:d.functionId};}
export function packageContextLabel(c){getPackageStation(c.stationId);return [getPackageContext(c.contextId).label,getPackagePlan(c.planId).label,'提出的特徵：'+(validatePackageSet('feature',c.featureIds).map(id=>find('feature',id).label).join('、')||'未選'),'取證焦點：'+find('function',c.functionId).label].join('；');}
export function intendedPackageFunctions(featureIds){const ids=validatePackageSet('feature',featureIds),set=new Set(ids.flatMap(id=>find('feature',id).functions));return PACKAGE_FUNCTIONS.filter(f=>set.has(f.id)).map(f=>f.id);}
export function packageLedger(d){valid(d);const features=d.featureIds.map(id=>find('feature',id));return PACKAGE_FUNCTIONS.map(f=>({functionId:f.id,label:f.label,purpose:f.purpose,features:features.filter(x=>x.functions.includes(f.id)).map(x=>x.label),evidence:f.evidence,status:'原創設計用途，尚未驗證',performance:null}));}
export function getPackageEvidence(d){
 const c=packageContext(d),feature=d.featureIds.map(id=>find('feature',id)),base={context:c,rows:packageLedger(d),performance:null,shelfLife:null,safety:null,environmentalBenefit:null};
 if(d.stationId==='study')return {...base,rows:[],title:'Bell等2016：指定使用者與開啟任務',origin:'primary-study',sourceIds:['package-usability-primary'],paragraphs:[
  '原始研究以40位NSW社區自立、年齡超過65歲且自述狀況良好者的便利樣本，觀察多款醫院供應食品包裝的開啟；受試者不是住院者。此為自述狀況，不是正式健康篩檢。',
  '作者記錄一次開啟任務的完成情況、時間／嘗試及主觀困難，也量測握力／捏力；部分參與者仍無法開啟某些包裝。這不是同一特徵的隨機改版比較，不能由關聯推特徵的獨立因果效果。',
  '各產品測試與問卷的分母不一致，原表不同欄位也須分開讀；本課不計算或移植失敗率、開啟時間或通用門檻。',
  '有人報告拉片小或缺少開啟提示，不表示加大拉片或增加圖示已被此研究證實有效。原創餅乾整包／分裝、再封、資訊理解、保存期與安全皆未在此得到驗證。'
 ]};
 return {...base,title:'原創設計簡報：'+getPackageStation(d.stationId).title,origin:'original-qualitative-case',sourceIds:['package-four-functions-authority'],paragraphs:[getPackageContext(c.contextId).given,getPackagePlan(c.planId).given,'以下特徵是你在原案上提出的改動，不宣稱原案本來就有；設計用途不是已測成效，勾選只是整理題目給定的線索。',...feature.map(f=>f.label+'：'+f.intent+' 可能取捨／未知：'+f.tradeoff+' 需要：'+f.evidence),feature.length?'同一特徵可連到數種功能；表列用途僅是本題明示框架，不排除你能另作有理由的功能連結。':'沒有選特徵時，不替它補功能或成效。',d.stationId==='evidence'?'目前聚焦'+find('function',d.functionId).label+'：'+find('function',d.functionId).evidence:'四功能是相互配合的目的；沒有通用分數、最佳方案、保存期或安全輸出。']};
}
export function getPackagePrediction(d){valid(d);return {prompt:d.stationId==='feature'?'在看線索整理前，先猜這組特徵能否同時連到不同功能。':d.stationId==='study'?'這份開啟研究會直接代表本題新包裝與所有使用者嗎？':'只憑目前原案、特徵與情境，能否先宣布方案已達成目的？',options:[{id:'yes',label:'我暫時認為可以'},{id:'no',label:'我暫時認為不能／需要額外前提'},{id:'unknown',label:'目前不確定，先保留問題'}]};}
export function choosePackagePrediction(d,value){const t=getPackageTrial(d);if(t.revealed)throw new Error('First package prediction is retained');if(!getPackagePrediction(d).options.some(o=>o.id===value))throw new RangeError('Unknown package prediction');t.prediction=value;return d;}
export function canRevealPackage(d){const t=getPackageTrial(d);return !t.revealed&&getPackagePrediction(d).options.some(o=>o.id===t.prediction);}
export function revealPackageEvidence(d){const t=getPackageTrial(d);if(!canRevealPackage(d))return false;const snapshot=freeze({prediction:t.prediction,predictionReason:text(t.predictionReason),context:packageContext(d),functionIds:validatePackageSet('function',d.functionIds),evidence:getPackageEvidence(d)});lock(t,'revealed',snapshot);lock(t,'prediction',snapshot.prediction);lock(t,'predictionReason',snapshot.predictionReason);return true;}
export function choosePackageAnswer(d,id){if(!getPackageStation(d.stationId).options.some(o=>o.id===id))throw new RangeError('Unknown package answer');getPackageTrial(d).choice=id;return d;}
export function evaluatePackage(d){valid(d);const s=getPackageStation(d.stationId),t=getPackageTrial(d),expected=intendedPackageFunctions(d.featureIds),selected=validatePackageSet('function',d.functionIds),answer={needs:'requirements',feature:'bounded',evidence:'matched',study:'scoped',transfer:d.contextId==='family'?'retained':'reassess',synthesis:'chain'}[s.id];let feedback,explanation,ready=true;
 if(s.id==='feature'){ready=expected.length>0&&selected.length>0;const missing=expected.filter(id=>!selected.includes(id)),extra=selected.filter(id=>!expected.includes(id));feedback=!ready?'先選特徵及至少一個功能，才有本題線索可核對。':missing.length||extra.length?'依本題明示用途，尚缺：'+(missing.map(id=>find('function',id).label).join('、')||'無')+'；額外連結：'+(extra.map(id=>find('function',id).label).join('、')||'無')+'。額外用途不是科學上不可能，但本題未給支持線索，請另寫因果理由與所需證據。':'你完整辨認本題給定的多功能用途；這仍不是成效驗證。';explanation='同一特徵可服務不同功能。本題只核對明示的設計用途，不建立排他的科學分類；其他合理連結及自由理由未自動評分。';if(t.choice==='exclusive')feedback='特徵與功能可以多對多；本題已明示同一特徵的多種目的。';else if(t.choice==='validated'||t.choice==='all')feedback='功能連結是設計意圖，不能當作性能、保存期或安全的實測。';return {stationId:s.id,context:packageContext(d),answer,ready,correct:ready&&t.choice===answer&&!missing.length&&!extra.length,feedback,explanation,expectedFunctionIds:expected,selectedFunctionIds:selected};}
 const wrong={small:'份量設計不自動證實每個人的便利、品質或保存期；需對應使用情境與端點。',barrier:'膜片阻隔只及於特定條件及層級，不能代替容裝、開啟、理解或完整包裝證據。',universal:'相同食品也可能有不同使用需求；沒有本題資料可選通用贏家。',film:'不同功能的端點不同；膜片測量不能回答開啟或資訊理解，也不等於整包表現。',claim:'印字、拉片、圖示或聲稱的存在是設計線索，不是使用成功或理解證據。','test-all':'一個端點與一組條件不能代替其他功能或新使用情境。','all-users':'研究的社區便利樣本不是住院者或所有使用者的代表性樣本。','package-ranking':'研究沒有比較本題原創整包與份量方案，也未分離一個特徵的因果效果。',life:'開啟端點不是品質、保存期或食品安全端點。','same-name':'食品相同不表示使用者、任務與環境相同；需重查四功能的需求與證據。',reseal:'重新收攏不等於恢復原封；再封後性能需要相符測量。',list:'列出名稱未說清作用、取捨與取證；需要把四面向串成同一情境的論證。','only-protection':'阻隔是保護面向的一部分，不能代替其餘三功能或全部保護端點。',guarantee:'此原創概念台沒有可支持安全、保存期或普遍最佳方案的數據。',retained:'目前使用情境已改，舊判讀須留為歷史，不能直接當新證據。',reassess:'目前仍是原本家中多次取用情境；已有內容仍只是假說與未知，沒有新證據。'};
 explanation=s.id==='needs'?'先用同一食品與使用情境列出四功能的需要，再連到方案與端點；僅描述包裝不能判定達成。':s.id==='evidence'?find('function',d.functionId).evidence+' 不同證據層級須保留各自範圍，不生成通用效能。':s.id==='study'?'研究對指定社區高齡者與所測醫院食品包裝提供開啟觀察；原創設計、其他使用者及保存品質仍未知。':s.id==='transfer'?(d.contextId==='family'?'原情境未變，但仍沒有性能驗證；保留原有設計假說與未知。':'使用情境改變後，需求、端點與取捨可能改變；需對應新使用者及任務證據。'):'完整申論要把四功能、特徵作用假說、可能代價與端點接起來，並明說未驗證範圍。自由文字未自動評分。';
 feedback=t.choice===answer?'此判讀保留了本題的前提與證據範圍。':wrong[t.choice]??'請核對目前情境與所給端點。';return {stationId:s.id,context:packageContext(d),answer,ready,correct:t.choice===answer,feedback,explanation};}
export function canCheckPackage(d){const t=getPackageTrial(d);return Boolean(t.revealed&&!t.checked&&getPackageStation(d.stationId).options.some(o=>o.id===t.choice)&&evaluatePackage(d).ready);}
export function checkPackageAnswer(d){const t=getPackageTrial(d);if(!canCheckPackage(d))return false;const r=evaluatePackage(d),snapshot=freeze({...r,choice:t.choice,reason:text(t.reason),functionIds:validatePackageSet('function',d.functionIds)});lock(t,'checked',snapshot);lock(t,'reason',snapshot.reason);return true;}
export function packageRevealDiffers(d){const t=getPackageTrial(d);return Boolean(t.revealed&&JSON.stringify(t.revealed.context)!==JSON.stringify(packageContext(d)));}
export function currentPackageDiffers(d){const t=getPackageTrial(d);return Boolean(t.checked&&(t.choice!==t.checked.choice||JSON.stringify(t.checked.context)!==JSON.stringify(packageContext(d))||d.stationId==='feature'&&JSON.stringify(validatePackageSet('function',d.functionIds))!==JSON.stringify(t.checked.functionIds)));}
const functionLabels=ids=>ids.map(id=>find('function',id).label).join('、')||'未選';
function evidenceLines(e){return [e.title,...e.paragraphs,...e.rows.map(r=>`${r.label}：${r.purpose}；提出特徵=${r.features.join('、')||'未選'}；需要=${r.evidence}；${r.status}；性能=未知`),'保存期、食品安全、環境效益：未知，未建立量化模型。'];}
export function buildPackageSummary(d){
 valid(d);const lines=['包裝四功能：需求、設計用途、取捨與證據','原創乾脆食品案例；功能連結是給定設計意圖，不是性能或食品安全模型。','目前任務：'+getPackageStation(d.stationId).title,'目前盤面：'+packageContextLabel(packageContext(d)),'目前多選判讀：'+functionLabels(validatePackageSet('function',d.functionIds))];
 for(const s of PACKAGE_STATIONS){
  const t=d.trials[s.id];if(!t||!(t.prediction||t.predictionReason||t.choice||t.reason||t.checked||t.revision))continue;
  const label=id=>s.options.find(o=>o.id===id)?.label||'未選';
  const predictionLabel=getPackagePrediction({...d,stationId:s.id}).options.find(o=>o.id===t.prediction)?.label||'未選';
  lines.push('',s.title,'預測：'+predictionLabel,'預測理由：',text(t.predictionReason));
  if(t.revealed)lines.push('首次揭示條件：'+packageContextLabel(t.revealed.context),'首次揭示時的功能判讀：'+functionLabels(t.revealed.functionIds),...evidenceLines(t.revealed.evidence));
  lines.push('目前選項：'+label(t.choice),'核對前理由：',text(t.reason));
  if(t.checked)lines.push('初答（首次核對）：'+label(t.checked.choice),'首次核對條件：'+packageContextLabel(t.checked.context),'首次核對功能判讀：'+functionLabels(t.checked.functionIds),'首次核對：'+(t.checked.correct?'符合本題線索與範圍':'需要修訂'),'首次核對理由：',t.checked.reason,'選項回饋：',t.checked.feedback,'核對說明：',t.checked.explanation);
  else lines.push('尚未核對，不計為答對。');
  if(s.id===d.stationId){if(packageRevealDiffers(d))lines.push('目前條件與首次揭示不同；首次預測保留原條件，核對另保留自己的條件。','目前固定材料：',...evidenceLines(getPackageEvidence(d)));if(currentPackageDiffers(d))lines.push('目前條件或判讀已改，舊核對不能當作目前已答對。');}
  lines.push('修訂：',text(t.revision));
 }
 lines.push('','我的整合短答：',text(d.synthesis),'','六個有限題目槽；首次揭示與核對各自固定條件，修訂另存。自由文字及額外功能論證未自動評分。',...PACKAGE_SOURCES.map(s=>s.label+' '+s.url+'；'+s.scope));return lines.join('\n');
}
