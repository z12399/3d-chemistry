// Finite conceptual evidence states, not a culture, engineering or recovery simulator.
export const PRECISION_FERMENTATION_ID = 'precision-fermentation-reasoning';
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const PRECISION_FERMENTATION_SOURCES = freeze([
  {id:'micro-batch-source-fao2025',label:'FAO 2025：Precision fermentation – With a focus on food safety',url:'https://doi.org/10.4060/cd4448en',scope:'報告印刷頁3說明定義界線、頁5 §3.1說明方法及基因工具範圍、頁21 §4.3案例辨seed culture與目標BLG。尚無國際一致定義；名稱本身不證明個別方法、純度或安全性。本台只辨角色，不提供案例操作條件。'},
  {id:'micro-batch-source-emtage1983',label:'Emtage 等 1983：E. coli 產製牛前凝乳酶的原始研究',url:'https://pubmed.ncbi.nlm.nih.gov/6304731/',scope:'公開摘要支持生產宿主、前凝乳酶及後續取得具凝乳功能的活性酵素之區分；不把前酵素當成已活化酵素，也不稱原文已使用現代精準發酵術語。不是食品安全證明或操作指引。'}
]);
export const PRECISION_FERMENTATION_CASES = freeze([
  {id:'role',title:'1．先辨認要交付的東西',prompt:'依目前用途，哪個敘述最能分清生產宿主、目標成分與發酵食品？',options:[
    {id:'ingredient',label:'本情境要取得指定成分；生產細胞不等於目標成分'},
    {id:'food',label:'本情境在食品中利用 starter 的作用；成品不能只等同一種分離成分'},
    {id:'same',label:'只要使用微生物，宿主、酵素與整份食品就是同一個物件'}]},
  {id:'boundary',title:'2．目標在那裡，證據到哪裡？',prompt:'看目前的目標位置及分開證據。哪個敘述可由已給資訊支持？',options:[
    {id:'pending',label:'目前仍不能把含目標的材料，直接稱為已與宿主分開的成分'},
    {id:'limited',label:'已給與宿主分開的證據；純度、功能與安全仍需各自證據'},
    {id:'automatic',label:'只要目標位於細胞外，就已經是純、安全且可直接使用的食品成分'}]},
  {id:'seed',title:'3．seed culture 的角色',prompt:'只知道某批具有 seed culture。它在概念流程中的直接角色是什麼？',options:[
    {id:'starting',label:'提供後續生產所用的起始培養物；不是終產品身分或品質的保證'},
    {id:'final',label:'seed culture 就是已分離、可食用的目標蛋白'},
    {id:'guarantee',label:'只要有 seed culture，就保證產量、純度及安全均合格'}]},
  {id:'definition',title:'4．名稱能否代替方法資料？',prompt:'只看到「精準發酵」四個字，沒有個別宿主或生產方法資料，可以下哪個結論？',options:[
    {id:'all-gm',label:'所有情境必然採用同一種基因改造方法'},
    {id:'all-non-gm',label:'所有情境必然不涉及基因改造'},
    {id:'specific',label:'先核對所採定義、個別宿主與方法；不能從名稱斷言全部必然基改或非基改'}]},
  {id:'case',title:'5．宿主、前酵素與活性酵素',prompt:'Emtage 等（1983）以 E. coli 產製牛前凝乳酶（prochymosin），研究另報後續取得具凝乳作用的活性酵素。哪個判讀保留這些身分差別？',options:[
    {id:'separate',label:'宿主不等於目標蛋白，前凝乳酶也不等於已活化的凝乳酶；各階段主張須有相應證據'},
    {id:'bacteria',label:'牛前凝乳酶就是一種 E. coli 細胞'},
    {id:'already-active',label:'只要檢出前凝乳酶，就已經直接證明同量活性酵素及凝乳功能'},
    {id:'all-safe',label:'研究成功產製一種蛋白，就證明所有同名食品成分都安全'}]},
  {id:'transfer',title:'6．把一句廣告拆成幾個主張',prompt:'另一種原創情境：標示「微生物製成的成分Y」，並提供與生產細胞分開的證據。能直接推論「無活菌、無過敏性、功能等同、產率更高」全部成立嗎？',options:[
    {id:'all',label:'可以；分開證據會自動證明所有這些主張'},
    {id:'claims',label:'不能；逐項辨認量測物件、方法與比較條件，再找相符證據'},
    {id:'none',label:'不能；所以可以反過來認定所有主張都必定錯誤'}]}
]);
const caseMap = new Map(PRECISION_FERMENTATION_CASES.map(item=>[item.id,item]));
const choices = {seed:'starting',definition:'specific',case:'separate',transfer:'claims'};
const text = value => typeof value === 'string' ? value : '';
const lock = (target,key,value) => Object.defineProperty(target,key,{value,enumerable:true,writable:false,configurable:false});
function valid(draft) {
  if(!draft || typeof draft !== 'object' || !caseMap.has(draft.caseId) || !['ingredient','food'].includes(draft.purpose) || !['inside','outside'].includes(draft.location) || !['pending','documented'].includes(draft.separation) || !draft.trials || typeof draft.trials !== 'object' || Array.isArray(draft.trials)) throw new TypeError('A valid precision fermentation draft is required');
  return draft;
}
export function createPrecisionFermentationDraft() { return {caseId:'role',purpose:'ingredient',location:'outside',separation:'pending',trials:{},synthesis:'',details:{}}; }
export function setPrecisionFermentationControl(draft,key,value) {
  valid(draft);
  const allowed={caseId:[...caseMap.keys()],purpose:['ingredient','food'],location:['inside','outside'],separation:['pending','documented']};
  if(!Object.hasOwn(allowed,key) || !allowed[key].includes(value)) throw new RangeError('Unknown precision fermentation control');
  draft[key]=value; return draft;
}
export function precisionFermentationState(draft) {
  valid(draft);
  const ingredient=draft.purpose==='ingredient',separated=draft.separation==='documented';
  return {
    purpose:ingredient?'取得指定成分 X':'在食品中利用 starter 的發酵作用',
    host:ingredient?'原創生產細胞 A':'原創 starter B',
    target:ingredient?'指定成分 X；不是整個生產細胞':'整份發酵食品；不只一種分離成分',
    boundaryTarget:'邊界任務獨立固定為指定成分 X，不沿用整份食品的用途',
    location:draft.location==='inside'?'成分 X 在生產階段位於生產細胞內':'成分 X 在生產階段位於細胞外的培養材料中',
    separation:separated?'後續情境已給：有成分 X 與生產細胞分開的證據':'後續情境未給：成分 X 與生產細胞分開的證據',
    conclusion:separated?'可保留「與宿主分開」這一項資訊；其他品質主張仍待核實。':'仍是含目標的材料，未證明取得已與宿主分開的目標成分。'
  };
}
export function precisionFermentationCase(draft) {
  valid(draft); const item=caseMap.get(draft.caseId);
  const key=draft.caseId==='role'?`role/${draft.purpose}`:draft.caseId==='boundary'?`boundary/${draft.location}/${draft.separation}`:draft.caseId;
  const answer=draft.caseId==='role'?draft.purpose:draft.caseId==='boundary'?(draft.separation==='documented'?'limited':'pending'):choices[draft.caseId];
  let explanation;
  if(draft.caseId==='role') explanation=draft.purpose==='ingredient'?'本原創情境交付的是指定成分 X。生產細胞是其來源，不等於成分本身；能否得到與宿主分開的成分仍看下一項證據。這是功能與物件的辨認，不把所有微生物產物強塞進一個統一定義。':'本原創情境在食品中利用 starter 的作用。成品包括食品基質及發酵變化，不會因某一酵素或代謝物存在就等同純化成分；也不由此推斷成品必定含有多少活菌。';
  else if(draft.caseId==='boundary') explanation='本任務獨立固定目標為指定成分 X；不沿用上一任務的整份食品用途。'+(draft.location==='outside'?'生產階段目標在細胞外，仍可能與其他物質同在培養材料中；細胞外不等於已分離。':'生產階段目標在細胞內，位置資訊也不會自行證明後續已與宿主分開。')+(draft.separation==='documented'?' 本情境另給後續分開證據，因此可以記下這一項；它不自動證明純度、功能、無活菌、無過敏性或安全性。':' 本情境尚未提供後續分開證據，因此保留「待回收／待確認」；不把未給資料當成已完成，也不反向認定永遠不可能取得。');
  else if(draft.caseId==='seed') explanation='seed culture 是接續生產所用的起始培養物。它的角色與最終要取得的成分不同；培養物的存在不會替代成分身分、回收、品質及安全的各項證據。本課只辨角色，不提供培養或放大操作條件。';
  else if(draft.caseId==='definition') explanation='FAO 2025 指出精準發酵尚無國際一致定義。先交代採用的定義，再核對個別宿主與生產方法；不能僅從名稱判定所有情境必然基改，或反過來判定必然非基改。';
  else if(draft.caseId==='case') explanation='E. coli 是生產宿主，牛前凝乳酶（prochymosin）是前酵素，後續取得的活性凝乳酶（chymosin）與其凝乳功能又是另一層證據。檢出前酵素不能單獨證明已有多少活性酵素。這是歷史案例，不聲稱原文已採現代精準發酵術語，也不把蛋白產製或功能證據當食品安全證明。';
  else explanation='「與宿主分開」只是一項證據身分。活菌、成分及過敏性、功能與產率的主張各需相符的檢驗或比較；未給資料應留未知，不能自動判為全真或全假。本課沒有產率、健康效果或食品安全的預測模型。';
  const misconception={same:'不要把來源、產物與整份食品合成同一個物件。',ingredient:'指定成分的情境和食品原位發酵的情境，要先看交付物。',food:'starter 的作用與取得分離成分不是同一個目標。',automatic:'細胞外只說位置，沒有附帶純度或安全結論。',pending:'未提供分開證據時保留未知；已提供時也只承認這一項。',limited:'分開證據的有無要照情境讀；它不包辦其他品質。',final:'起始培養物不是分離終產品。',guarantee:'起始材料的存在不能保證產量、純度或安全。','all-gm':'一個名稱不足以指定所有案例的基因方法。','all-non-gm':'定義未統一，也不等於已證明所有案例非基改。',bacteria:'蛋白質目標與細菌細胞不是同一身分。','already-active':'前酵素身分與活化後的功能不同；不要省略活性證據。','all-safe':'產製成功與安全評估是不同主張。',all:'把單一證據擴成多項未量測結論，超過資料範圍。',none:'證據不足不是反面主張已被證明。'};
  return {...item,key,answer,explanation,misconception};
}
export function precisionFermentationTrial(draft) {
  const item=precisionFermentationCase(draft);
  if(!Object.hasOwn(draft.trials,item.key)) draft.trials[item.key]={choice:'',reason:'',checked:false,checkedSnapshot:null,revision:''};
  return draft.trials[item.key];
}
export function choosePrecisionFermentation(draft,value) {
  const item=precisionFermentationCase(draft); if(!item.options.some(option=>option.id===value)) throw new RangeError('Unknown precision fermentation answer');
  const trial=precisionFermentationTrial(draft);trial.choice=value;return trial;
}
export function checkPrecisionFermentation(draft) {
  const item=precisionFermentationCase(draft),trial=precisionFermentationTrial(draft);
  if(trial.checked)return true;
  if(!item.options.some(option=>option.id===trial.choice))return false;
  const snapshot=freeze({caseId:draft.caseId,key:item.key,purpose:draft.caseId==='role'?draft.purpose:draft.caseId==='boundary'?'ingredient':null,location:draft.caseId==='boundary'?draft.location:null,separation:draft.caseId==='boundary'?draft.separation:null,choice:trial.choice,reason:text(trial.reason),answer:item.answer,correct:trial.choice===item.answer,explanation:item.explanation,feedback:trial.choice===item.answer?'此判讀符合目前給定的物件與證據。':item.misconception[trial.choice]??'重新對照目前用途與證據範圍。'});
  lock(trial,'checkedSnapshot',snapshot);lock(trial,'reason',snapshot.reason);lock(trial,'checked',true);return true;
}
export function buildPrecisionFermentationSummary(draft) {
  valid(draft);const lines=['精準發酵：生產角色、成分去向與證據','關係情境為本課原創；非實測資料、培養／基因工程／回收程序。',`目前任務：${draft.caseId}；用途${draft.purpose}；位置${draft.location}；分開證據${draft.separation}`];
  for(const [key,trial] of Object.entries(draft.trials).filter(([,t])=>t.choice||t.reason||t.checked||t.revision).sort(([a],[b])=>a<b?-1:a>b?1:0)){
    lines.push('',`題目槽：${key}`,`目前選項：${text(trial.choice)}`,'核對前理由：',text(trial.reason));
    if(trial.checkedSnapshot){const s=trial.checkedSnapshot;lines.push(`初答（首次核對時）：${s.choice}`,`首次核對條件：${s.caseId}；用途${s.purpose}；位置${s.location}；分開證據${s.separation}`,`首次核對：${s.correct?'符合目前情境':'需修訂'}`,'核對時理由：',s.reason,'核對回饋：',s.feedback,'核對說明：',s.explanation);}
    else lines.push('尚未核對；不計為正確。');
    lines.push('修訂：',text(trial.revision));
  }
  lines.push('','我的整合短答：',text(draft.synthesis),'','初答在首次核對時固定；目前改選不改寫原核對。自由文字未自動評分。名稱、物件身分、分開證據及安全／功能／產率主張須分開；未驗證學習成效。');
  return lines.join('\n');
}
