// Original finite evidence packets. No pathogen growth, food-release or risk model.
export const SEAFOOD_HAZARD_ID='seafood-hazard-reasoning';
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
export const SEAFOOD_SOURCES=freeze([
 {id:'illness-fda-bbb-2012',label:'FDA Bad Bug Book（2012）：兩種Vibrio章節',url:'https://www.fda.gov/media/83271/download',scope:'只採V. parahaemolyticus／V. vulnificus的海洋與河口生態、食入及傷口暴露和致病性差異等概念。此為2012教材，不移用歷史病例估計、培養條件、劑量或安全時溫。'},
 {id:'seafood-source-cdc-vibrio2024',label:'CDC：About Vibrio Infection',url:'https://www.cdc.gov/vibrio/about/index.html',scope:'採海岸環境、海鮮食入與開放傷口接觸等不同暴露路徑。不以菌名直接判定某個人的感染來源，也不提供診療或食品放行判定。'},
 {id:'seafood-source-fda-harvest-pathogens',label:'FDA水產危害指南：收穫區病原',url:'https://www.fda.gov/files/food/published/Fish-and-Fishery-Products-Hazards-and-Controls-Guidance-Chapter-4-Download.pdf',scope:'採水產原料、收穫環境與後段控制需分開的框架；未採其製程設定、限值、操作條件或安全確效程序，不稱新核實的當前法規。'},
 {id:'seafood-source-fearnley2024',label:'Fearnley等（2024）：澳洲V. parahaemolyticus疫情研究',url:'https://wwwnc.cdc.gov/eid/article/30/11/24-0172_article',scope:'已核讀原文選定文字：臨床分離株有ST417與ST50，陽性食品分離株為ST417；暴露、回溯與定型一起支持限定連結，未確定單一個別養殖者。不以未分離ST50證明不存在，不複製原操作或病例率。'}
]);
export const SEAFOOD_SPECIES=freeze([
 {id:'vp',label:'V. parahaemolyticus（腸炎弧菌）',context:'海洋與河口環境可有此菌；與食源性腸胃疾病有關，也可能涉及傷口感染。環境分離株的致病性並非全部相同。'},
 {id:'vv',label:'V. vulnificus（創傷弧菌）',context:'海洋與河口環境可有此菌；可經食入受污染海鮮，或經傷口接觸相關水域／材料。不能由菌名直接指定某病例的暴露路徑。'}
]);
export const SEAFOOD_ROUTES=freeze([
 {id:'food',label:'本題給定：曾食入相關海鮮',chain:['海岸／河口或原料來源','食品及後段接觸','食入暴露','需相符的臨床與來源證據'],answer:'food-chain'},
 {id:'wound',label:'本題給定：傷口曾接觸相關水域／材料',chain:['相關水域／原料','傷口接觸','需相符的感染與來源證據'],answer:'contact-chain'},
 {id:'unknown',label:'僅有菌種或臨床名稱，暴露史未給',chain:['檢出／臨床名稱','暴露路徑仍未辨認','食品、傷口或其他相符資料待核'],answer:'route-unknown'}
]);
export const SEAFOOD_PACKETS=freeze([
 {id:'dna',label:'甲．食品中的目標DNA報告',given:'原創材料：食品樣本報告檢出目標DNA；未給可培養分離、增殖比較或病例連結。',answer:'dna-only',supports:'檢出所測目標DNA',missing:'活菌／可培養性、增殖、致病性與食源病例連結'},
 {id:'isolate',label:'乙．食品樣本的已鑑定可培養分離株',given:'原創材料：報告在該次檢測條件下取得已鑑定目標分離株；沒有前後增殖比較，也沒有病例或攝食資料。',answer:'culturable',supports:'該樣本在所述方法下有可培養目標',missing:'未抽樣部分、實際攝入量、增殖趨勢及疾病來源'},
 {id:'growth',label:'丙．用來核對增殖的前後量測',given:'原創材料：同一量測身分與可比基準的前後比較，報告目標可培養量增加；未另排除回收、可培養狀態或聚集等替代解釋，未提供疾病或攝食端點。',answer:'growth-context',supports:'此比較條件下所測可培養量增加，尚不單獨證明細胞增殖',missing:'區分增殖與回收／可培養狀態／聚集的證據，以及攝食與病例來源；本課未給速率或安全界線'},
 {id:'survival',label:'丁．未見增加，但仍取得分離株',given:'原創材料：可比前後量測未見目標量增加，且後端仍取得目標分離株。',answer:'survival-not-growth',supports:'仍可檢出可培養目標；未見增加不等於全部死亡',missing:'所有個體的狀態、完整增殖／死亡歷程及實際疾病結果'},
 {id:'negative',label:'戊．這次方法未檢出目標',given:'原創材料：指定採樣部分與方法報告「未檢出」；沒有全批次、其他位置或其他危害的完整資料。',answer:'bounded-negative',supports:'該採樣與方法範圍內的未檢出結果',missing:'全批次零目標、其他方法／位置及所有危害皆不存在的證據'},
 {id:'clinical',label:'己．臨床檢出，但未給暴露或食品資料',given:'原創材料：臨床報告辨認Vibrio；尚無相符攝食／傷口暴露、食品檢測或來源回溯資料。',answer:'illness-route-unknown',supports:'臨床對象的檢出資訊',missing:'暴露路徑、特定食品或來源歸屬；不是食品已證明致病'}
]);
export const SEAFOOD_CONTROLS=freeze([
 {id:'growth',label:'抑制目標增殖的主張',claim:'這項條件變更抑制目標在指定情境下增殖。',answer:'growth-comparison',needed:'對齊樣本基準、方法與條件、能檢查增殖的比較；若只有可培養量差，還要區分回收、可培養狀態與聚集等解釋，不把未增加改稱全部失活。'},
 {id:'inactivation',label:'降低既有目標存活的主張',claim:'本段處理降低指定目標的存活。',answer:'viability-comparison',needed:'與指定目標、食品基質及處理階段相符的存活量測與對照；不由處理名稱或另一目標代填。'},
 {id:'later-contact',label:'減少後段再接觸的主張',claim:'本段以接觸隔離避免原料再次把目標帶到已處理部分。',answer:'contact-evidence',needed:'後段接觸／交叉污染路徑及相符對照；隔離作用不等於把原有目標殺死。'},
 {id:'source',label:'原料／收穫來源管理的主張',claim:'這份原料的來源管理對應收穫環境中的指定危害。',answer:'source-evidence',needed:'收穫環境、原料／產品身分與指定危害相符的來源及管理證據；外觀、菌名或後段處理名稱不會代填來源資料。'}
]);
export const SEAFOOD_LINKAGE=freeze([
 {id:'names',label:'先只給菌種名稱',given:'取證範圍：臨床及食品提到同一菌種；沒有提供具解析力的分離株比較、暴露史或完整回溯。',answer:'not-enough'},
 {id:'typing',label:'再給研究的定型資訊',given:'取證範圍：研究臨床分離株有ST417及ST50；陽性食品分離株為ST417，ST417食品與臨床分離株的基因體群聚提供關聯證據。本範圍尚未把暴露與回溯一併納入。',answer:'genome-related'},
 {id:'combined',label:'連起暴露、回溯與分離株證據',given:'取證範圍：把研究的病例暴露史、牡蠣來源回溯及臨床／食品分離株定型一併判讀。作者仍有原料混合、回溯不完整與個別養殖者歸屬的限制。',answer:'combined-limited'}
]);
export const SEAFOOD_STATIONS=freeze([
 {id:'route',title:'1．先問從哪一條路徑暴露',prompt:'依目前菌種及題目明示的暴露資料，應先追哪條證據鏈？菌名不能代替暴露史。',options:[{id:'food-chain',label:'以食品及食入為待檢查路徑，仍需相符來源與臨床證據'},{id:'contact-chain',label:'以傷口接觸為待檢查路徑，不能自動說是吃海鮮造成'},{id:'route-unknown',label:'暴露史未給，暫不能指定食入或傷口路徑'},{id:'name-decides',label:'菌種名稱已能唯一決定每位病例的暴露路徑'}]},
 {id:'evidence',title:'2．同樣寫檢出，量測支持到哪裡？',prompt:'閱讀一份固定的原創報告材料。哪一句只承認它所量到的物件？切換材料不會產生新的樣本實驗。',options:[{id:'dna-only',label:'支持所測DNA檢出；未單獨證明活菌、增殖或疾病來源'},{id:'culturable',label:'支持該次方法下取得可培養目標；不單獨證明增殖或疾病'},{id:'growth-context',label:'支持所測可培養量增加；尚未單獨證明細胞增殖或疾病機率'},{id:'survival-not-growth',label:'未見增加仍可有存活／可培養目標，不等於全部死亡'},{id:'bounded-negative',label:'未檢出限於採樣與方法；不能改成全批次絕對零'},{id:'illness-route-unknown',label:'臨床資訊不單獨指定食品或暴露來源'},{id:'safe',label:'任何一份報告都足以把全部食品判為安全'}]},
 {id:'control',title:'3．控制哪個節點，就找哪項證據',prompt:'針對目前這句控制主張，哪項證據最直接？選的是所需證據，不是執行條件或安全判定。',options:[{id:'growth-comparison',label:'相符條件與量測、能核對目標增殖的比較'},{id:'viability-comparison',label:'指定目標／食品／階段的存活比較與對照'},{id:'contact-evidence',label:'後段接觸、再污染路徑及相符對照'},{id:'source-evidence',label:'收穫環境、原料／產品與指定危害相符的來源管理證據'},{id:'label',label:'只用冷藏、加熱或衛生等名稱，就能替所有節點與危害保證安全'}]},
 {id:'typing',title:'4．兩個ST，與共同來源矛盾嗎？',prompt:'把Fearnley等2024的已刊資訊分成不同取證範圍。目前範圍可支持哪項判讀？研究結果不因你的選擇改變。',options:[{id:'not-enough',label:'同菌名不足以單獨指定共同食品來源，尚須其他證據'},{id:'genome-related',label:'定型／基因體關聯是一條證據，還要與暴露及回溯合併'},{id:'combined-limited',label:'多條證據支持限定的牡蠣連結；不等於全病例或個別養殖者已唯一確定'},{id:'all-growers',label:'所有病例、兩個ST及每位養殖者都已由相同食品分離株完全證明'},{id:'exclude',label:'食品沒有分離到ST50，所以已證明ST50不存在且兩ST不可能涉及共同來源'}]},
 {id:'ecology',title:'5．海洋來源，還是必然糞便污染？',prompt:'只依目前具名Vibrio的生態與菌種檢出，哪項來源推論較有界線？',options:[{id:'natural',label:'海岸／河口生態可有此菌；檢出不自動證明糞便污染或所有分離株致病性相同'},{id:'fecal',label:'只要食品檢出此菌，就已證明唯一來源是糞便污染'},{id:'all-same',label:'同菌種所有環境分離株必定具有完全相同的致病性與後果'}]},
 {id:'transfer',title:'6．換產品與採樣位置，舊證據跟得上嗎？',prompt:'一份已處理魚品只有處理前原料的DNA報告，後段接觸及食用時樣本未提供。有人沿用牡蠣疫情資料，宣稱此魚品已證明沒有任何危害。你會如何修訂？',options:[{id:'match',label:'重新核對產品、目標、階段與量測；處理前DNA或另一研究不能代填後段與食用時證據'},{id:'all-safe',label:'處理名稱和另一產品的研究已可保證全部危害不存在'},{id:'certain-illness',label:'資料不足反而已證明每位食用者必然生病'}]}
]);
const maps=Object.fromEntries([['species',SEAFOOD_SPECIES],['route',SEAFOOD_ROUTES],['packet',SEAFOOD_PACKETS],['control',SEAFOOD_CONTROLS],['linkage',SEAFOOD_LINKAGE],['station',SEAFOOD_STATIONS]].map(([key,items])=>[key,new Map(items.map(x=>[x.id,x]))]));
const text=v=>typeof v==='string'?v:'';
const lock=(o,k,v)=>Object.defineProperty(o,k,{value:v,writable:false,configurable:false,enumerable:true});
export function seafoodItem(kind,id){const item=maps[kind]?.get(id);if(!item)throw new RangeError('Unknown seafood evidence selection');return item;}
function valid(d){if(!d||typeof d!=='object'||!d.trials||typeof d.trials!=='object'||Array.isArray(d.trials))throw new TypeError('A seafood draft is required');for(const[k,field]of [['station','stationId'],['species','speciesId'],['route','routeId'],['packet','packetId'],['control','controlId'],['linkage','linkageId']])seafoodItem(k,d[field]);return d;}
export function createSeafoodDraft(){return {stationId:'route',speciesId:'vp',routeId:'food',packetId:'dna',controlId:'growth',linkageId:'names',trials:{},synthesis:'',details:{}};}
export function setSeafoodControl(d,key,value){
 valid(d);const allowed={stationId:['station',null],speciesId:['species',['route','ecology']],routeId:['route',['route']],packetId:['packet',['evidence']],controlId:['control',['control']],linkageId:['linkage',['typing']]};
 const rule=allowed[key];if(!rule||(rule[1]&&!rule[1].includes(d.stationId)))throw new RangeError('Unavailable seafood control');seafoodItem(rule[0],value);d[key]=value;return d;
}
function context(d){valid(d);if(d.stationId==='route')return {speciesId:d.speciesId,routeId:d.routeId};if(d.stationId==='evidence')return {packetId:d.packetId};if(d.stationId==='control')return {controlId:d.controlId};if(d.stationId==='typing')return {linkageId:d.linkageId};if(d.stationId==='ecology')return {speciesId:d.speciesId};return {};}
export function getSeafoodKey(d){const c=context(d);return d.stationId+'/'+Object.values(c).join('/');}
export function getSeafoodTrial(d){const key=getSeafoodKey(d);if(!Object.hasOwn(d.trials,key))d.trials[key]={choice:'',reason:'',revision:'',checked:null};return d.trials[key];}
export function chooseSeafoodAnswer(d,choice){valid(d);if(!seafoodItem('station',d.stationId).options.some(o=>o.id===choice))throw new RangeError('Unknown seafood answer');getSeafoodTrial(d).choice=choice;return d;}
export function seafoodContextLabel(c){return Object.entries(c).map(([key,value])=>seafoodItem({speciesId:'species',routeId:'route',packetId:'packet',controlId:'control',linkageId:'linkage'}[key],value).label).join('；')||'固定遷移材料';}
export function evaluateSeafood(d){
 valid(d);let answer,explanation;
 if(d.stationId==='route'){answer=seafoodItem('route',d.routeId).answer;explanation=seafoodItem('species',d.speciesId).context+' '+(d.routeId==='food'?'食入資料支持以食品鏈取證，仍不是某份海鮮已造成疾病的單一證明。':d.routeId==='wound'?'這份給定直接涉及傷口接觸；不能偷換成已知吃進了該海鮮。':'僅有菌種或臨床名稱，仍需補相符暴露史及來源資料，不能自行指定唯一食源或傷口來源。');}
 else if(d.stationId==='evidence'){const p=seafoodItem('packet',d.packetId);answer=p.answer;explanation=p.supports+'。尚缺：'+p.missing+'。這些固定原創材料不是六份相同樣本的實驗結果，也沒有由方法名稱生成數值；未給資料留未知。';}
 else if(d.stationId==='control'){const c=seafoodItem('control',d.controlId);answer=c.answer;explanation=c.needed+' 來源管理、抑制增殖、降低既有目標存活及減少後段接觸處理不同環節，需分別核對。沒有一個控制名稱自動證明所有目標、食品及後段皆已受控，本課不設定執行參數或放行門檻。';}
 else if(d.stationId==='typing'){answer=seafoodItem('linkage',d.linkageId).answer;explanation=(d.linkageId==='names'?'同菌種名稱不是足以分辨分離株及完整來源的證據。':d.linkageId==='typing'?'研究的ST417食品與臨床分離株群聚提供關聯；基因體關聯仍須和相符暴露、時間及回溯資料合併。':'研究的流行病學與回溯將兩個ST和南澳牡蠣連結；這是有根據的綜合來源證據，不是所有線索都未知。但回溯與原料混合的限制仍在，未將每位病例或單一個別養殖者唯一確定。')+' 實際已刊資料：臨床分離株有ST417及ST50，陽性食品分離株為ST417；沒有從食品分離到ST50不是已證明其不存在。不同ST本身也不排除共同食物來源或區域，不能把兩個ST都寫成食品已檢出。';}
 else if(d.stationId==='ecology'){answer='natural';explanation=seafoodItem('species',d.speciesId).context+' 這類海岸／河口相關菌的檢出，不能直接替代糞便污染的來源證明；需要與問題相符的指標及來源資料。同菌種也不等於每個分離株、暴露及宿主的後果相同。';}
 else{answer='match';explanation='來源、產品、目標、階段與量測都要對齊。處理前的DNA資訊不會自動變成處理後存活、後段接觸或食用時狀態；牡蠣疫情也不替另一魚品補全這些缺項。未知不等於零或安全，也不能反過來斷言每位食用者必然生病。';}
 return {answer,explanation,context:context(d),observedFoodSafety:null,illnessProbability:null,processEfficacy:null};
}
export function canCheckSeafood(d){const t=getSeafoodTrial(d);return !t.checked&&seafoodItem('station',d.stationId).options.some(o=>o.id===t.choice);}
const misconceptions={
 'name-decides':'菌名沒有包含暴露史；食入與傷口接觸要分開取證。',safe:'單一報告不會包辦所有樣本、危害與階段，更不是食品安全認證。',label:'控制名稱沒有交代它處理的節點與效力證據，不能替所有情境保證安全。',
 'all-growers':'原文食品陽性分離株是ST417，不是兩ST皆有；個別養殖者歸屬亦有限制。',exclude:'未分離到某ST受採樣和取得分離株的範圍限制，不等於已證明不存在。',fecal:'海岸／河口相關Vibrio可來自自然生態；不能僅由檢出指定糞便污染。','all-same':'同菌種名稱不能抹去分離株、暴露路徑與宿主條件的差別。',
 'all-safe':'處理前與另一產品的資料，不能直接代填本產品後段或食用時證據。','certain-illness':'證據不足保留未知，不能反向把不確定性改成必然疾病。',
 'dna-only':'先看報告是否僅量DNA，別把另一份材料的結論套進來。',culturable:'取得分離株、DNA、前後增殖與病例來源是不同資訊。','growth-context':'沒有相符前後比較，不能從單次檢出推增殖。','survival-not-growth':'需同時保留增殖比較與後端分離資料，不能把所有檢出等同同一現象。','bounded-negative':'未檢出才有此方法界線；不能用它改寫已有正向量測。','illness-route-unknown':'臨床資訊和食品檢測不是同一採樣對象；先辨本份材料的物件。',
 'growth-comparison':'來源、增殖、失活與後段接觸需要不同取證；不能只挑熟悉的方法。','viability-comparison':'存活證據不會同時補足來源或後段接觸。','contact-evidence':'接觸隔離不是將既有目標失活，也不是增殖比較。','source-evidence':'來源管理的證據不能代替後段接觸、指定處理效力或增殖比較。',
 'not-enough':'隨新增證據承認其有限支持，不把所有範圍一律說成沒有資訊。','genome-related':'定型是其中一條證據；先看目前是否只有名稱或已結合其他來源線索。','combined-limited':'只有在暴露、回溯與分離株證據合併的範圍內，才有此限定結論。',
 'food-chain':'食入是題目明示的一種路徑，不可套到未給食入資料的病例。','contact-chain':'傷口接觸與食品食入分開，不能由菌名將兩者互換。','route-unknown':'若題目已給明確路徑，可先承認那項暴露資訊，再核對來源。',natural:'海洋生態資訊不等於每項未量測主張都成立。'
};
export function checkSeafoodAnswer(d){const t=getSeafoodTrial(d);if(!canCheckSeafood(d))return false;const r=evaluateSeafood(d),correct=t.choice===r.answer;const s=freeze({stationId:d.stationId,key:getSeafoodKey(d),choice:t.choice,reason:text(t.reason),correct,feedback:correct?'此判讀保留本份材料的物件與推論界線。':misconceptions[t.choice]??'重新核對這份材料所給的物件、階段與證據範圍。',...r});lock(t,'checked',s);lock(t,'reason',s.reason);return true;}
export function currentSeafoodDiffers(d){const t=getSeafoodTrial(d);return Boolean(t.checked&&(t.choice!==t.checked.choice||JSON.stringify(context(d))!==JSON.stringify(t.checked.context)));}
function contextForKey(key){const [station,a,b]=key.split('/');seafoodItem('station',station);if(station==='route')return {speciesId:a,routeId:b};if(station==='evidence')return {packetId:a};if(station==='control')return {controlId:a};if(station==='typing')return {linkageId:a};if(station==='ecology')return {speciesId:a};return {};}
export function buildSeafoodSummary(d){
 valid(d);const lines=['水產危害：暴露、量測、控制與來源證據','固定原創取證材料與已刊研究分開；不生成病原生長、疾病機率、製程效力或食品安全判定。',`目前任務：${seafoodItem('station',d.stationId).title}`];
 for(const[key,t]of Object.entries(d.trials).filter(([,t])=>t.choice||t.reason||t.revision||t.checked).sort(([a],[b])=>a<b?-1:a>b?1:0)){
  const stationId=key.split('/')[0],s=seafoodItem('station',stationId),label=id=>s.options.find(o=>o.id===id)?.label??'未選';
  lines.push('',s.title,'目前材料範圍：'+seafoodContextLabel(contextForKey(key)),`目前選項：${label(t.choice)}`,'核對前理由：',text(t.reason));
  if(t.checked){const c=t.checked;lines.push(`初答（首次核對）：${label(c.choice)}`,'首次核對範圍：'+seafoodContextLabel(c.context),`首次核對：${c.correct?'符合本題給定與界線':'需修訂'}`,'選項回饋：',c.feedback,'核對說明：',c.explanation);if(t.choice!==c.choice)lines.push('目前選項已改；首次核對不代表目前答案的評分。');}
  else lines.push('尚未核對，不計為答對。');lines.push('修訂：',text(t.revision));
 }
 lines.push('','我的整合短答：',text(d.synthesis),'','初答與條件首次核對固定，換給定材料使用有限獨立槽。自由文字未自動評分；成功附加的可讀摘要才隨原筆記匯出，重載不重建未保存盤面。沒有食用建議、培養／保存程序、製程參數或安全保證。');return lines.join('\n');
}
