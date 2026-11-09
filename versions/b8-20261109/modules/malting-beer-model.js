// Original finite role/dependency exercises, not brewing dynamics or an operating protocol.
export const MALTING_BEER_ID='malting-beer-reasoning';
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const MALTING_BEER_SOURCES=freeze([
 {id:'beer-source-montana-malting',label:'Montana State University：製麥的角色',url:'https://www.montana.edu/barleybreeding/learning-center/',scope:'權威文字說明發芽改質、澱粉可及性與製麥乾燥的角色。本課只採概念關係，不採時間、溫度、配方或生產操作。'},
 {id:'beer-source-montana-mashing',label:'Montana State University：mashing與麥汁組成',url:'https://www.montana.edu/barleybreeding/learning-center/brewer-resources/mashing.html',scope:'mashing藉酵素轉化；麥汁可同時有可發酵及不可發酵組分。總可溶物不直接等於所選酵母的可利用糖。'},
 {id:'beer-source-thesseling2019',label:'Thesseling等2019：釀造角色與詞彙',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9286407/',scope:'僅採Introduction與glossary中分離、煮沸／啤酒花及酵母的高層角色。原文為protocol類型，未採其操作程序、配方或溫時；乾燥不等於全部酵素永久消失。'},
 {id:'beer-source-deschepper2021',label:'De Schepper等2021：澱粉酶活性與麥汁的原始研究',url:'https://pubmed.ncbi.nlm.nih.gov/33436252/',scope:'已核完整公開摘要：六品種的活性差異未反映為該研究特定mash下的麥汁組成差異；該研究α失活參數可移用，β失活參數卻未能直接預測真mash中的β失活。未採原實驗數字或程序，不外推成酵素活性永遠無關。'},
 {id:'beer-source-iubmb-alpha',label:'IUBMB EC3.2.1.1：α-amylase',url:'https://iubmb.qmul.ac.uk/enzyme/EC3/2/1/1.html',scope:'內切α1→4糖苷鍵。第3鍵只是本課指定的一次示意，不是所有底物固定從正中間切或真實六糖的反應預測。'},
 {id:'beer-source-iubmb-beta',label:'IUBMB EC3.2.1.2：β-amylase',url:'https://iubmb.qmul.ac.uk/enzyme/EC3/2/1/2.html',scope:'從非還原端連續釋出麥芽糖，水解的仍是α1→4鍵；β名稱涉及釋糖初始異頭配置，不代表切β糖苷鍵。本課只指定一次拓撲示意，不計動力學或發酵性。'}
]);
export const MALTING_BEER_STAGES=freeze([
 {id:'modification',label:'製麥：發芽改質',answer:'modify',input:'穀粒的澱粉、細胞壁與蛋白基質',purpose:'改變基質、提高澱粉可及性，並發展或活化部分酵素作用；不是酵母直接產酒。'},
 {id:'kilning',label:'製麥：乾燥角色',answer:'dry',input:'已發芽改質的穀粒',purpose:'以乾燥停止發芽，影響麥芽色香等特性；殘存酵素潛力依材料與條件，不自動等於全保留或全消失。'},
 {id:'mashing',label:'mashing：酵素轉化',answer:'convert',input:'可及的澱粉與可作用的酵素',purpose:'在相符環境下以酵素轉化供應可溶性糖等組分；潛力、實際麥汁組成與酵母利用仍是不同資訊。'},
 {id:'separation',label:'麥汁與穀渣分離',answer:'separate',input:'含液體麥汁與不溶穀渣的材料',purpose:'區分液體麥汁與不溶穀渣；分離本身不會把所有可溶物變成所選酵母可利用的糖。'},
 {id:'boiling',label:'煮沸／啤酒花角色',answer:'boil',input:'麥汁及啤酒花相關成分',purpose:'涉及蛋白聚集、啤酒花α酸異構化等作用；不是酵母利用糖產生乙醇的角色，也不由苦味推發酵性。'},
 {id:'fermentation',label:'酵母利用',answer:'ferment',input:'所選酵母可利用的糖及其他必要前提',purpose:'酵母利用相容的糖，形成乙醇與CO₂等；不能把全部澱粉或全部可溶物當成必然全部發酵。'}
]);
const roleOptions=freeze([
 {id:'modify',label:'改變穀粒基質可及性，並發展／活化部分酵素作用'},
 {id:'dry',label:'乾燥停止發芽並影響麥芽特性；不能直接判所有酵素永久失活'},
 {id:'convert',label:'在相符前提下，由酵素轉化澱粉而供應可溶性糖等組分'},
 {id:'separate',label:'把液體麥汁與不溶穀渣分開；不自動創造可發酵糖'},
 {id:'boil',label:'涉及蛋白聚集與啤酒花α酸異構化等作用'},
 {id:'ferment',label:'由酵母利用相容糖形成乙醇、CO₂等'},
 {id:'everything',label:'一個角色就保證全部澱粉完全轉成酒精，並且品質一定更好'}
]);
export const MALTING_BEER_CONDITIONS=freeze([
 {id:'accessibleStarch',label:'本題給定：澱粉可供選定酵素接觸'},
 {id:'amylaseAvailable',label:'本題給定：選定澱粉酶仍可作用'},
 {id:'conversionContext',label:'本題給定：該酵素轉化所需環境相符'}
]);
export const MALTING_BEER_POOLS=freeze([
 {id:'unmeasured',label:'只知道有可溶物，未分辨酵母利用性',answer:'unknown',given:'已測到可溶物，沒有所選酵母可利用部分的資料。'},
 {id:'compatible',label:'已給：含所選酵母可利用的糖',answer:'potential',given:'題目另給成分與所選酵母利用性的相符資料；沒有真實發酵歷程。'},
 {id:'mixed',label:'已給：可利用糖與其他可溶物並存',answer:'potential',given:'其中一部分可由所選酵母利用，其他可溶物沒有被當成可利用糖。'},
 {id:'incompatible',label:'已給：這份材料只有所選酵母不可利用的可溶物',answer:'not-this-pool',given:'這個原創情境明示該可溶物池沒有所選酵母可利用的糖；不是從缺測資料推零。'}
]);
export const MALTING_BEER_ENZYMES=freeze([
 {id:'alpha',label:'α-amylase：本課指定一次內切第3鍵',answer:'three-three'},
 {id:'beta',label:'β-amylase：本課指定從非還原端釋一個二糖',answer:'two-four'}
]);
export const MALTING_BEER_CASES=freeze([
 {id:'role',title:'1．沿材料變化找角色',prompt:'選定鏈上的一個角色。哪一個目的最符合它？這是概念關係，不是完整操作清單。',options:roleOptions},
 {id:'conversion',title:'2．只改一個供糖前提',prompt:'依目前三個給定前提，本課定性模型能否支持「所選澱粉酶有轉化這份澱粉的可能條件」？',options:[{id:'supported',label:'三個指定前提均在；模型支持轉化的可能條件，未生成實測麥汁'},{id:'not-supported',label:'至少一個指定前提未給或不成立；不能用這組模型宣告轉化條件已備齊'},{id:'certain-yield',label:'只要有澱粉，全部糖量、酒精產率及品質都已確定'}]},
 {id:'enzyme',title:'3．同是α1→4鍵，從哪裡釋出什麼？',prompt:'這條原創直鏈有6個葡萄糖殘基，左端是非還原端。依所選「本課指定的一次作用」預測片段；不是實際六糖的酵素選位或反應速率預測。',options:[{id:'three-three',label:'指定內切第3鍵：形成3殘基＋3殘基片段，仍不能說全是可發酵糖'},{id:'two-four',label:'從非還原端釋出一個麥芽糖：2殘基＋剩餘4殘基，切的仍是α1→4鍵'},{id:'beta-bond',label:'β-amylase必須尋找β糖苷鍵，所以這條α1→4鏈不能是其概念對象'},{id:'six-glucose',label:'任一酵素作用一次都必然形成6個游離葡萄糖並保證完全發酵'}]},
 {id:'pool',title:'4．可溶物與酵母利用分開',prompt:'只依目前給定的麥汁／材料資料，可以對所選酵母的糖供應說到哪一步？',options:[{id:'unknown',label:'利用性尚未辨明；可溶物存在不足以辨認可利用糖供應'},{id:'potential',label:'可承認有相容糖的供應潛力；實際利用、殘留與產物仍需其他前提和量測'},{id:'not-this-pool',label:'本情境明示這個池沒有相容糖；不能由它推有這份糖供應'},{id:'all-used',label:'全部可溶物必然全部轉為酒精，而且沒有殘留'}]},
 {id:'separation',title:'5．拿掉穀渣，會自動變糖嗎？',prompt:'已知操作的目的是把液體麥汁與不溶穀渣分開，未給額外轉化或回收量資料。哪一個判讀合理？',options:[{id:'identity',label:'支持分離角色；不能由分離本身推全部可溶物變成可發酵糖，或算回收率'},{id:'new-sugar',label:'凡分離都會使所有澱粉變成酵母能利用的糖'},{id:'perfect',label:'已證明回收率100%、發酵完全且品質合格'}]},
 {id:'evidence',title:'6．活性排名能直接搬到麥汁嗎？',prompt:'De Schepper等研究中，六品種活性差異未反映為該特定mash的麥汁組成差異；稀釋體系的β-amylase失活參數也未能直接預測mash中的β失活。這份結果支持什麼？',options:[{id:'matched',label:'區分活性量測與相符條件下的麥汁組成；移用模型或排名要另外驗證'},{id:'rank',label:'任何條件下活性排名都必定等於發酵性和品質排名'},{id:'never',label:'已證明所有澱粉酶活性在任何食品與條件下都永遠不重要'}]},
 {id:'transfer',title:'7．把品質口號拆回可檢查的鏈',prompt:'某原創廣告只列較深麥色、較高總可溶物及較多啤酒花，便宣稱酵素全失活、發酵一定更完全且品質更好。你會如何判讀？',options:[{id:'separate-claims',label:'分開酵素、組成、利用與品質各項主張；要求相符量測及比較，未測留未知'},{id:'all-true',label:'三項標籤已自動證明全部結論'},{id:'all-false',label:'資料不足代表全部主張都已被證明無效'}]}
]);
const cases=new Map(MALTING_BEER_CASES.map(x=>[x.id,x])),stages=new Map(MALTING_BEER_STAGES.map(x=>[x.id,x])),pools=new Map(MALTING_BEER_POOLS.map(x=>[x.id,x]));
const text=value=>typeof value==='string'?value:'';
const lock=(target,key,value)=>Object.defineProperty(target,key,{value,writable:false,enumerable:true,configurable:false});
export function getMaltingBeerCase(id){const item=cases.get(id);if(!item)throw new RangeError('Unknown malting/beer case');return item;}
export function getMaltingBeerStage(id){const item=stages.get(id);if(!item)throw new RangeError('Unknown malting/beer stage');return item;}
export function getMaltingBeerPool(id){const item=pools.get(id);if(!item)throw new RangeError('Unknown wort evidence pool');return item;}
export function getMaltingBeerEnzyme(id){const item=MALTING_BEER_ENZYMES.find(x=>x.id===id);if(!item)throw new RangeError('Unknown illustrative amylase');return item;}
export function illustrateMaltingAmylase(id){
 getMaltingBeerEnzyme(id);const chain=Array.from({length:6},(_,i)=>'G'+(i+1)),cutAfter=id==='alpha'?3:2;
 return {enzymeId:id,input:chain,bondType:'α1→4',cutAfter,fragments:[chain.slice(0,cutAfter),chain.slice(cutAfter)],residueUnitsBefore:chain.length,residueUnitsAfter:chain.length,illustrationOnly:true,measuredFermentability:null};
}
export function evaluateMaltingConversion(conditions){
 const ids=MALTING_BEER_CONDITIONS.map(x=>x.id);
 if(!conditions||typeof conditions!=='object'||Object.keys(conditions).length!==ids.length||ids.some(id=>!Object.hasOwn(conditions,id)||typeof conditions[id]!=='boolean')||Object.keys(conditions).some(id=>!ids.includes(id)))throw new TypeError('Exactly three boolean conceptual givens are required');
 const missing=ids.filter(id=>!conditions[id]);return {supported:missing.length===0,missing,conditions:{...conditions},observedWort:null,fermentationOutcome:null};
}
function valid(draft){if(!draft||typeof draft!=='object'||!draft.trials||typeof draft.trials!=='object'||Array.isArray(draft.trials))throw new TypeError('A malting/beer draft is required');getMaltingBeerCase(draft.caseId);getMaltingBeerStage(draft.stageId);getMaltingBeerPool(draft.poolId);getMaltingBeerEnzyme(draft.enzymeId);evaluateMaltingConversion(draft.conditions);return draft;}
export function createMaltingBeerDraft(){return {caseId:'role',stageId:'modification',poolId:'unmeasured',enzymeId:'alpha',conditions:{accessibleStarch:true,amylaseAvailable:true,conversionContext:true},trials:{},synthesis:'',details:{}};}
export function setMaltingBeerControl(draft,key,value){
 valid(draft);
 if(key==='caseId')getMaltingBeerCase(value);
 else if(key==='stageId'&&draft.caseId==='role')getMaltingBeerStage(value);
 else if(key==='poolId'&&draft.caseId==='pool')getMaltingBeerPool(value);
 else if(key==='enzymeId'&&draft.caseId==='enzyme')getMaltingBeerEnzyme(value);
 else if(MALTING_BEER_CONDITIONS.some(x=>x.id===key)&&draft.caseId==='conversion'){if(typeof value!=='boolean')throw new RangeError('A boolean given is required');draft.conditions[key]=value;return draft;}
 else throw new RangeError('Unavailable malting/beer control');
 draft[key]=value;return draft;
}
function keyOf(draft){valid(draft);return draft.caseId==='role'?`role/${draft.stageId}`:draft.caseId==='conversion'?`conversion/${MALTING_BEER_CONDITIONS.map(x=>draft.conditions[x.id]?'1':'0').join('')}`:draft.caseId==='pool'?`pool/${draft.poolId}`:draft.caseId==='enzyme'?`enzyme/${draft.enzymeId}`:draft.caseId;}
export function getMaltingBeerTrial(draft){const key=keyOf(draft);if(!Object.hasOwn(draft.trials,key))draft.trials[key]={choice:'',reason:'',revision:'',checked:false,checkedSnapshot:null};return draft.trials[key];}
export function chooseMaltingBeerAnswer(draft,choice){valid(draft);if(!getMaltingBeerCase(draft.caseId).options.some(x=>x.id===choice))throw new RangeError('Unknown malting/beer answer');getMaltingBeerTrial(draft).choice=choice;return draft;}
export function evaluateMaltingBeer(draft){
 valid(draft);let answer,explanation,context;
 if(draft.caseId==='role'){const stage=getMaltingBeerStage(draft.stageId);answer=stage.answer;context={stageId:stage.id};explanation=stage.purpose+' 此處辨認的是角色，不由一個角色推定全部糖量、乙醇量或成品品質；製麥中的發芽與乾燥也不能當作相同作用。';}
 else if(draft.caseId==='conversion'){const gate=evaluateMaltingConversion(draft.conditions);answer=gate.supported?'supported':'not-supported';context={conditions:{...draft.conditions}};explanation=gate.supported?'本課原創規則所列的可及性、可作用酵素與相符環境三個前提都在，因此只支持轉化的可能條件；尚未給轉化程度、麥汁組成、酵母利用或品質。':'本課列出的前提尚未備齊：'+gate.missing.map(id=>MALTING_BEER_CONDITIONS.find(x=>x.id===id).label).join('、')+'。這不把未知當零，也不排除實際樣品可能另有糖來源。';explanation+=' 乾燥或顏色沒有自動替本題設定酵素活性旗標；本課不計速率或實際產率。';}
 else if(draft.caseId==='enzyme'){const enzyme=getMaltingBeerEnzyme(draft.enzymeId);answer=enzyme.answer;context={enzymeId:enzyme.id};explanation=(enzyme.id==='alpha'?'本課指定一次α內切第3鍵，六個殘基成為3＋3。第3鍵是選定示意，不是α-amylase永遠從中央切，也不指定真實六糖的作用位置或效率。':'β-amylase的概念角色是從非還原端釋出麥芽糖；本課指定只釋一次，因此為2＋4。β名稱不表示切β鍵，本例切的仍是α1→4；名稱涉及釋糖初始異頭配置。')+' 這裡只記殘基連接與數目，未畫完整原子／水收支；一次切割不會自動證明所有片段均可被所選酵母利用。';}
 else if(draft.caseId==='pool'){const pool=getMaltingBeerPool(draft.poolId);answer=pool.answer;context={poolId:pool.id};explanation=pool.given+(pool.answer==='unknown'?' 可溶物包含多種成分，未分辨利用性不能代填相容糖量。':pool.answer==='not-this-pool'?' 結論限本題這個明示的物質池，不代表整個真實系統的所有代謝或產物都為零。':' 這是糖供應的一項前提，不保證酵母狀態、其他必要條件、實際消耗程度或最終品質；混合池也不會因一部分可用而全部可用。');}
 else if(draft.caseId==='separation'){answer='identity';context={};explanation='分離改變液體麥汁與不溶穀渣的去向，不能僅由操作名稱推澱粉水解、全部可溶物可發酵或回收率100%。需把轉化、分離、利用與相應量測各自檢查；本題沒有完整物料衡算。';}
 else if(draft.caseId==='evidence'){answer='matched';context={};explanation='原始摘要的結論限六品種與所研究的mash條件；活性差異未對應該麥汁組成差異，並不證明活性永遠不重要。該研究的稀釋體系α-amylase失活參數可預測mash中的α失活，β-amylase參數卻未能直接預測相應β失活；不能把兩者概括成全部成功或全部失敗。活性、總浸出物、糖組成、酵母利用及品質是不同端點，不自動共享一個排名。';}
 else{answer='separate-claims';context={};explanation='麥色不是全部酵素活性的充分證據；總可溶物不是所選酵母可利用糖的同義詞；啤酒花角色也不直接保證糖利用程度或品質。先列出各主張所需的相符量測與比較，資料不足留未知，不反過來判定全部無效。';}
 return {key:keyOf(draft),caseId:draft.caseId,answer,explanation,context};
}
export function canCheckMaltingBeer(draft){const trial=getMaltingBeerTrial(draft);return !trial.checked&&getMaltingBeerCase(draft.caseId).options.some(x=>x.id===trial.choice);}
function choiceFeedback(draft,choice,correct){
 if(correct)return '此選項保留了本題物件、角色與證據的界線。';
 if(draft.caseId==='role')return choice==='everything'?'你把一個角色擴成全部轉化與品質保證，跳過後續物件與證據。':`你選的目的是另一個角色的作用；先對照「${getMaltingBeerStage(draft.stageId).label}」正在改變的物件，再修訂。`;
 if(draft.caseId==='conversion')return choice==='certain-yield'?'澱粉存在不等於酵素前提、轉化程度、酒精產率或品質都已確定。':'重新逐項讀目前三個給定旗標；「前提備齊」與「尚有前提未給／不成立」不能互換。';
 if(draft.caseId==='enzyme')return choice==='beta-bond'?'你把β酵素名稱錯當所切鍵型；本課兩種作用切的都是α1→4。':choice==='six-glucose'?'你把一次斷鍵擴成全部解聚及全部發酵；先保留六個殘基與這一次指定的連接變化。':draft.enzymeId==='alpha'?'你把從非還原端釋二糖的角色放進本題指定的α內切；本題指定切第3鍵。':'你把內切的3＋3放進本題β端部釋二糖；先找到左側非還原端。';
 if(draft.caseId==='pool')return choice==='all-used'?'你把全部可溶物直接當成全部可利用、且已完成利用；這是三個不同主張。':draft.poolId==='unmeasured'?'題目未分辨利用性，既不能代填有相容糖，也不能把缺測改稱明示沒有。':draft.poolId==='incompatible'?'這個情境明示該物質池沒有相容糖，和只缺資料不同；結論仍只限這個池。':'題目已另給相容糖的資訊，可以承認一項供應前提；不能把它退回完全未知，也不能跳成利用完成。';
 if(draft.caseId==='separation')return choice==='new-sugar'?'你把物理分離誤寫成產糖轉化；分離名稱沒有提供這個反應證據。':'你把分離完成擴成回收率、發酵與品質全部合格，超過本題所給資訊。';
 if(draft.caseId==='evidence')return choice==='never'?'你把一個限定條件下的結果擴成所有活性永遠無關；原摘要不支持這個全稱。':'你把不同量測端點及條件的排名直接共用；原研究恰好要求保留這個移用界線。';
 return choice==='all-false'?'資料不足不是反面主張已被證明；把未測項目保留未知，再列需要的證據。':'你把麥色、可溶物與酒花三個標籤擴成多個未測結論，請逐項拆開。';
}
export function checkMaltingBeer(draft){
 const trial=getMaltingBeerTrial(draft);if(!canCheckMaltingBeer(draft))return false;
 const result=evaluateMaltingBeer(draft),correct=trial.choice===result.answer,snapshot=freeze({...result,choice:trial.choice,reason:text(trial.reason),correct,feedback:choiceFeedback(draft,trial.choice,correct)});
 lock(trial,'checkedSnapshot',snapshot);lock(trial,'reason',snapshot.reason);lock(trial,'checked',true);return true;
}
export function currentMaltingBeerDiffers(draft){const trial=getMaltingBeerTrial(draft);return Boolean(trial.checkedSnapshot&&trial.choice!==trial.checkedSnapshot.choice);}
export function maltingBeerContextText(context){
 if(context.stageId)return getMaltingBeerStage(context.stageId).label;
 if(context.poolId)return getMaltingBeerPool(context.poolId).label;
 if(context.enzymeId)return getMaltingBeerEnzyme(context.enzymeId).label;
 if(context.conditions)return MALTING_BEER_CONDITIONS.map(x=>`${x.label}：${context.conditions[x.id]?'是':'否'}`).join('；');
 return '本題固定材料與資料範圍';
}
export function buildMaltingBeerSummary(draft){
 valid(draft);const lines=['製麥到啤酒：角色、供糖與證據','角色／前提與物質池是本課原創有限情境，非實驗軌跡或釀造／培養程序。',`目前任務：${draft.caseId}；題目槽：${keyOf(draft)}`];
 for(const [key,trial]of Object.entries(draft.trials).filter(([,t])=>t.choice||t.reason||t.revision||t.checked).sort(([a],[b])=>a<b?-1:a>b?1:0)){
  const caseId=key.split('/')[0],label=value=>getMaltingBeerCase(caseId).options.find(x=>x.id===value)?.label||'未選';
  lines.push('',getMaltingBeerCase(caseId).title,`題目槽：${key}`,`目前選項：${label(trial.choice)}`,'核對前理由：',text(trial.reason));const s=trial.checkedSnapshot;
  if(s){lines.push(`初答（首次核對時）：${label(s.choice)}`,`首次核對條件：${maltingBeerContextText(s.context)}`,`首次核對：${s.correct?'符合本題給定與界線':'需修訂'}`,'此選項的回饋：',s.feedback,'核對說明：',s.explanation,trial.choice===s.choice?'目前選項與首次核對相同。':'目前選項已改；舊核對不代表目前答案的評分。');}else lines.push('尚未核對，不計為答對。');
  lines.push('修訂：',text(trial.revision));
 }
 lines.push('','我的整合短答：',text(draft.synthesis),'','初答與條件在首次核對時固定，改條件使用獨立有限槽。自由文字未自動評分；成功附加的是可讀摘要，不重建未保存盤面。本課不輸出糖量、酒精、品質或安全預測。');return lines.join('\n');
}
