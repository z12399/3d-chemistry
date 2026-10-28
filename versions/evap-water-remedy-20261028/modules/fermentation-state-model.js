// Qualitative physical-state and evidence reasoning; no cultivation or performance simulator.
export const FERMENTATION_STATE_ID='fermentation-physical-state-reasoning';
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const text=v=>typeof v==='string'?v:'';
const lock=(o,k,v)=>Object.defineProperty(o,k,{value:v,writable:false,configurable:false,enumerable:true});
export const FERMENTATION_STATES=freeze([
 {id:'matrix',label:'給定A：濕潤支撐基質，沒有自由流動液相',kind:'solid',description:'原創概念情境：有水的顆粒／支撐基質，題設明示沒有自由流動的連續液相；不給培養、孔隙率、產物或效能資料。'},
 {id:'liquid',label:'給定B：連續可流動液相',kind:'liquid',description:'原創概念情境：題設有連續可流動液相，物料浸於其中；是否均勻、是否供氧充分、何種產物皆未量測。'},
 {id:'suspension',label:'給定C：含顆粒但液相連續的懸浮系統',kind:'liquid',description:'原創概念情境：看得到固體顆粒，但題設明示液相連續而可流動；不能只由顆粒存在就改判為固態模式。'},
 {id:'unknown',label:'給定D：只知原料名稱與總含水，水相資料缺失',kind:'unknown',description:'原創概念情境：未說明支撐方式或自由流動液相。食品名稱、總含水量或aw不能補出物理模式。'}
]);
export const FERMENTATION_FOCUSES=freeze([
 {id:'gas',label:'氣體到達與局部可用性'},
 {id:'heat',label:'熱產生、傳遞與移除'},
 {id:'mixing',label:'混合、分布與取樣代表性'}
]);
export const FERMENTATION_PROBES=freeze([{id:'outer',label:'邊界附近候選位置'},{id:'middle',label:'中間候選位置'},{id:'interior',label:'內部候選位置'}]);
export const FERMENTATION_OBJECTIVES=freeze([
 {id:'uniformity',label:'目標：判斷空間條件是否一致',need:'同一端點的對應位置與歷程證據；提出位置不等於已完成量測。'},
 {id:'local-product',label:'目標：辨認產物在哪個區域或相',need:'先確認目標在液相、附著基質或細胞相關部分，再決定相符取樣及量測基準。'},
 {id:'recovery',label:'目標：比較回收後可測的量',need:'確認物料邊界、分離／萃取的回收與共同分析方法；不能由模式名稱推出回收效率。'}
]);
export const FERMENTATION_FOODS=freeze([
 {id:'koji',label:'食品階段例：穀物上的製麴階段',kind:'solid',description:'Smits來源列舉的koji製麴例，限定有水的穀物／支撐基質且缺少自由流動液相的階段；不是由食品名稱推所有後續階段。',sourceIds:['fermentation-state-source-smits1998']},
 {id:'wine',label:'食品階段例：白葡萄酒的澄清汁液發酵',kind:'liquid',description:'FAO所述白葡萄酒的澄清葡萄汁發酵階段，可作連續液相例；不概括帶皮的紅酒醪或所有酒類階段，也不提供製造步驟。',sourceIds:['fermentation-state-source-fao-wine']}
]);
export const FERMENTATION_SOURCES=freeze([
 {id:'fermentation-state-source-smits1998',label:'Smits（1998）：Solid-State Fermentation，Wageningen原始博士論文',url:'https://edepot.wur.nl/200086',scope:'第一章的支撐／自由水定義、傳遞與回收問題，以及koji食品例。該作者的LSF／SmF詞彙有其分類範圍，不當所有文獻的唯一用法；不採操作或生產參數。'},
 {id:'fermentation-state-source-fao-wine',label:'FAO（1998）：Fermented Fruits and Vegetables，第4章',url:'https://www.fao.org/4/x0560e/x0560e09.htm',scope:'只取白葡萄酒澄清汁液發酵的階段身分，並與含皮階段區分；沒有移植配方、時間、溫度或生產指引。'}
]);
const opts=(...rows)=>rows.map(([id,label])=>({id,label}));
export const FERMENTATION_STATIONS=freeze([
 {id:'state',title:'1．由支撐與自由液相辨認模式',prompt:'依題目明示的物理狀態，哪個分類有足夠前提？',options:opts(['solid','與本課固態／支撐基質框架相符：濕潤但缺少自由流動液相'],['liquid','與本課連續液相框架相符；仍須交代浸沒、懸浮等具體系統'],['unknown','自由液相與支撐資料不足，保留未知'],['dry','固態就表示完全無水'],['oxygen','液態名稱已決定一定好氧或厭氧'])},
 {id:'transport',title:'2．把狀態連到傳遞機制與取證',prompt:'目前物理條件與所選傳遞面向，支持怎樣的推理？',options:opts(['conditional','提出有條件的路徑／分布假說，再量相符位置與端點；沒有通用效能結論'],['solid-air','所有固態系統都天然供氧充分且散熱良好'],['liquid-mixed','只要液相連續，每處就充分混合與供氧'],['winner','由模式名稱就能選產率與成本的通用贏家'])},
 {id:'sampling',title:'3．候選位置不等於已量到全場',prompt:'目前的候選取樣位置，已經提供甚麼證據？',options:opts(['plan','這是有限位置計畫；沒有數值或觀察結果，不等於代表性已驗證'],['none','尚未提出位置，連候選取樣範圍也未指定'],['measured','勾選位置就表示該處氧、熱與生長已量測'],['field','三處全選便已證實連續空間全域均勻'])},
 {id:'recovery',title:'4．回收要先問產物位置與量測邊界',prompt:'依目前目的，如何避免把模式直接當成回收效能？',options:opts(['location','先定位目標所在相／區域，核對取樣、回收與分析基準；模式本身不給效率'],['solid-free','固態產物一律不需分離或萃取'],['liquid-total','量到液相濃度就等於全批產物總量'],['same-recovery','更換物理模式不會改變取樣或回收問題'])},
 {id:'foods',title:'5．食品例必須限定階段',prompt:'如何把來源中的食品例用在比較答案？',options:opts(['stage','按給定階段的支撐與液相定義舉例；同一食品可經過不同階段'],['name','只寫食品名稱即可永遠決定物理模式'],['all-water','只要原料含水就一定是液態模式'],['protocol','這些概念資料已給實際培養或放大操作方式'])},
 {id:'tradeoff',title:'6．優缺點要連到目的與前提',prompt:'要比較目前目標下的取捨，哪種論證合適？',options:opts(['matched','連結狀態→傳遞／分布→所需端點與回收，保留目的相關的取捨與未知'],['rank','固態對所有目的都比液態好'],['yield','混合或供氣改變必定提高產量'],['safety','概念比較已證明真實食品安全'])},
 {id:'synthesis',title:'7．寫成有機制與食品例的完整比較',prompt:'哪種申論保留必要的物理前提、優缺點與取證？',options:opts(['chain','限定支撐／自由液相，連到混合、氣熱、取樣／回收，並各舉來源相符階段例'],['list','只列固態與液態兩個名稱，不說條件或原因'],['always','把兩類各指定成一定好氧／一定厭氧便可完成比較'],['guarantee','用模式名稱給產量、成本或安全保證'])}
]);
const maps={station:new Map(FERMENTATION_STATIONS.map(x=>[x.id,x])),state:new Map(FERMENTATION_STATES.map(x=>[x.id,x])),focus:new Map(FERMENTATION_FOCUSES.map(x=>[x.id,x])),probe:new Map(FERMENTATION_PROBES.map(x=>[x.id,x])),objective:new Map(FERMENTATION_OBJECTIVES.map(x=>[x.id,x])),food:new Map(FERMENTATION_FOODS.map(x=>[x.id,x]))};
const find=(kind,id)=>{const value=maps[kind].get(id);if(!value)throw new RangeError('Unknown fermentation '+kind);return value;};
export const getFermentationStation=id=>find('station',id);
export function validateFermentationProbes(ids){if(!Array.isArray(ids))throw new TypeError('Candidate positions must be an array');const seen=new Set();for(const id of ids){find('probe',id);if(seen.has(id))throw new RangeError('Duplicate candidate position');seen.add(id);}return FERMENTATION_PROBES.filter(p=>seen.has(p.id)).map(p=>p.id);}
function valid(d){if(!d||typeof d!=='object'||!d.trials||typeof d.trials!=='object'||Array.isArray(d.trials))throw new TypeError('A fermentation draft is required');getFermentationStation(d.stationId);find('state',d.stateId);find('focus',d.focusId);find('objective',d.objectiveId);find('food',d.foodId);validateFermentationProbes(d.probeIds);return d;}
export function createFermentationDraft(){return {stationId:'state',stateId:'matrix',focusId:'gas',probeIds:['outer'],objectiveId:'uniformity',foodId:'koji',trials:{},synthesis:'',details:{}};}
export function setFermentationControl(d,key,value){valid(d);if(key==='stationId')getFermentationStation(value);else if(key==='stateId')find('state',value);else if(key==='focusId')find('focus',value);else if(key==='objectiveId')find('objective',value);else if(key==='foodId')find('food',value);else if(key==='probeIds')value=validateFermentationProbes(value);else throw new RangeError('Unavailable fermentation control');d[key]=value;return d;}
export function getFermentationTrial(d){valid(d);if(!Object.hasOwn(d.trials,d.stationId))d.trials[d.stationId]={prediction:'',predictionReason:'',revealed:null,choice:'',reason:'',checked:null,revision:''};return d.trials[d.stationId];}
export function fermentationContext(d){valid(d);return {stationId:d.stationId,stateId:d.stateId,focusId:d.focusId,probeIds:validateFermentationProbes(d.probeIds),objectiveId:d.objectiveId,foodId:d.foodId};}
export function fermentationContextLabel(c){return [find('state',c.stateId).label,find('focus',c.focusId).label,'候選位置：'+(validateFermentationProbes(c.probeIds).map(id=>find('probe',id).label).join('、')||'未選'),find('objective',c.objectiveId).label,find('food',c.foodId).label].join('；');}
export function fermentationSampling(probeIds){const ids=validateFermentationProbes(probeIds);return {plannedSites:ids,plannedCount:ids.length,allNamedSites:ids.length===FERMENTATION_PROBES.length,measuredSites:[],observations:null,globalUniformity:null,oxygen:null,temperature:null,growth:null,yield:null,cost:null,safety:null};}
export function fermentationTransport(stateId,focusId){const s=find('state',stateId),f=find('focus',focusId);let mechanism,evidence;
 if(s.kind==='unknown'){mechanism='支撐與連續液相未定，不能先選定傳遞路徑。';evidence='先補物理相態、支撐及自由液相的描述，再選相符端點。';}
 else if(f.id==='gas'){mechanism=s.kind==='solid'?'氣體可經可用孔隙接近濕潤基質，液膜與局部消耗仍可能造成限制；孔隙、含水分布及材料狀態都須交代。':'氣體到液相及液相內的輸送與消耗要分開；液相連續不等於每處溶解氣體相同，懸浮顆粒也可能增加局部傳遞問題。';evidence='需要對應位置與歷程的氣體／液相指標及分布證據；不能只用模式名稱或平均讀值。';}
 else if(f.id==='heat'){mechanism=s.kind==='solid'?'局部產熱與傳導、界面換熱及水分移動可能不一致；有支撐基質不表示熱已均勻移除。':'混合可重新分配熱，但熱產生、移動與外部移除仍是不同問題；有液體或攪動構想不證明全場等溫。';evidence='需要位置與歷程、物性及熱移除邊界；不從一處溫度或平均值推全域均勻。';}
 else {mechanism=s.kind==='solid'?'材料支撐、顆粒排列與局部水分可能使位置不同；移動物料也可能改變結構及接觸條件。':'液相流動可能促進分布，但黏度、顆粒與局部流動影響混合；不能忽略剪切或未混合區域的可能性。';evidence='先定義要均勻的是哪個端點，再用對應位置與取樣設計檢查；沒有通用混合效果或最佳方式。';}
 return {label:f.label,given:s.description,mechanism,evidence,unknown:'局部值、全域分布、產量與效率均未提供。'};
}
export function getFermentationEvidence(d){const c=fermentationContext(d),state=find('state',d.stateId),objective=find('objective',d.objectiveId),sampling=fermentationSampling(d.probeIds),base={context:c,rows:[],sourceIds:['fermentation-state-source-smits1998'],yield:null,cost:null,efficiency:null,safety:null,oxygen:null,temperature:null,growth:null};
 if(d.stationId==='foods'){const food=find('food',d.foodId);return {...base,title:'食品例按階段判讀',originLabel:'來源支持的階段例，非本課培養程序',sourceIds:food.sourceIds,paragraphs:[food.description,'例子用來說明物理定義，不提供培養時間、溫度、配方、供氣或放大步驟。食品名稱不能取代階段與相態資料。','同一食品流程可以先後包含支撐基質與液相階段；liquid-state是題目用語，是否採某來源的submerged定義仍須交代。']};}
 if(d.stationId==='sampling')return {...base,title:'有限候選位置與尚缺的觀察',originLabel:'原創取樣規劃例，沒有空間實測數據',sampling,rows:[{label:'提出的位置',given:d.probeIds.length?d.probeIds.map(id=>find('probe',id).label).join('、'):'沒有位置',mechanism:'只界定待檢查位置，不創造觀察。',evidence:'仍需指定端點、相符時點／位置與代表性檢查。',unknown:'所有氧、熱、生長、產物與全場分布仍未知。'}],paragraphs:['勾選是提出候選位置，不表示已量測。即使三個名稱都選，也不是連續空間的全面覆蓋。','代表性需對照系統的相態、位置、歷程與欲回答的問題；沒有測得結果時，不可把未測值當零、平均值或均勻場。']};
 if(d.stationId==='state')return {...base,title:'給定相態與支撐前提',originLabel:'原創物理狀態情境，按來源框架判讀',paragraphs:[state.description,'本課把濕潤支撐基質且缺少自由流動液相作固態框架，把連續可流動液相作液相框架；固態不等於無水，懸浮固形物也不自動決定模式。','本課以連續液相作比較框架；Smits另將過量水中可溶物的LSF與漿狀SmF分述，這是該來源用法，不宣稱各文獻同義或唯一分類。分類本身沒有指定微生物氧需求、aw、局部供氧或成效。資料不足時，模式也保留未知。']};
 if(d.stationId==='recovery')return {...base,title:'目標所在位置與回收邊界',originLabel:'原創目標與取證鏈，非效率模型',paragraphs:[objective.need,'目標可能在液相、附著基質或細胞相關部分；相態會影響怎樣取得代表樣本與界定量測，但不由模式名稱保證回收容易或完整。','可測濃度、分析訊號及回收後總量不同。若要比較，需相符的物料邊界、回收與分析基準；本課不改既有對照設計檔，也不重用其固定16點當新物理場資料。']};
 if(d.stationId==='transport')return {...base,title:'物理條件→傳遞候選→可觀察證據',originLabel:'來源支持的機理與原創條件式推理',rows:[fermentationTransport(d.stateId,d.focusId)],paragraphs:['下列是有條件的機理假說，不是量得的氧、熱、混合或產量結果。','固態與液態都可能有空間限制；是否有氧及氧是否可用，不能只由物理模式判斷，更不能把兩類固定成一定好氧／一定厭氧。']};
 return {...base,title:d.stationId==='tradeoff'?'目的限定的優缺點與未知':'把定義、機理、取捨與食品階段串成答案',originLabel:'原創比較與申論任務，無性能數據',rows:[fermentationTransport(d.stateId,d.focusId)],paragraphs:[objective.need,'可討論支撐／液相對混合、氣熱分布、取樣及回收的條件性影響，但成本、產量、效率與安全都未量測；改變一項條件不保證其他端點同方向。','完整比較需各有物理前提與來源相符食品階段例，說出目標相關的可能代價與需補的觀察；不是選一個所有場合都較好的模式。自由文字不自動評分。']};
}
export function getFermentationPrediction(d){valid(d);return {prompt:d.stationId==='state'?'目前的支撐與液相描述，足以限定物理框架嗎？':d.stationId==='sampling'?'提出這些候選位置，就已取得代表全場的觀察了嗎？':'目前的模式或構想，已足以決定傳遞與成效嗎？',options:[{id:'yes',label:'我暫時認為足夠'},{id:'no',label:'我暫時認為仍需前提或觀察'},{id:'unknown',label:'目前不確定，先留下問題'}]};}
export function chooseFermentationPrediction(d,id){const t=getFermentationTrial(d);if(t.revealed)throw Error('First fermentation prediction retained');if(!getFermentationPrediction(d).options.some(x=>x.id===id))throw new RangeError('Unknown prediction');t.prediction=id;return d;}
export function canRevealFermentation(d){const t=getFermentationTrial(d);return !t.revealed&&getFermentationPrediction(d).options.some(x=>x.id===t.prediction);}
export function revealFermentationEvidence(d){const t=getFermentationTrial(d);if(!canRevealFermentation(d))return false;const snap=freeze({prediction:t.prediction,predictionReason:text(t.predictionReason),context:fermentationContext(d),evidence:getFermentationEvidence(d)});lock(t,'revealed',snap);lock(t,'prediction',snap.prediction);lock(t,'predictionReason',snap.predictionReason);return true;}
export function chooseFermentationAnswer(d,id){if(!getFermentationStation(d.stationId).options.some(x=>x.id===id))throw new RangeError('Unknown answer');getFermentationTrial(d).choice=id;return d;}
export function evaluateFermentation(d){valid(d);const station=getFermentationStation(d.stationId),t=getFermentationTrial(d),answer=station.id==='state'?find('state',d.stateId).kind:station.id==='sampling'?(d.probeIds.length?'plan':'none'):{transport:'conditional',recovery:'location',foods:'stage',tradeoff:'matched',synthesis:'chain'}[station.id];
 const explanations={state:'依題目明示的支撐與自由液相判讀；未知不以含水量、aw或食品名稱補值。分類不決定氧需求或成效。',transport:fermentationTransport(d.stateId,d.focusId).mechanism+' '+fermentationTransport(d.stateId,d.focusId).evidence,sampling:d.probeIds.length?'目前只提出'+d.probeIds.length+'個有限候選位置，沒有實測結果；不是代表性或全域均勻的證明。':'沒有候選位置與觀察結果，不能補成零值或全域結論。',recovery:find('objective',d.objectiveId).need+' 產物位置、回收與量測基準要另行交代。',foods:find('food',d.foodId).description+' 食品階段例不變成製造或培養程序。',tradeoff:'目的與物理條件決定要比較甚麼。傳遞、取樣和回收有不同端點，未知的產量、成本、效率與安全不能補值。',synthesis:'比較答案要由支撐／自由液相出發，連到混合、氣熱、取樣／回收的機理，寫有條件的取捨與各一來源相符階段例。'};
 const wrong={solid:'僅有顆粒、名稱或含水量不足以推出固態框架；需看題目是否明示缺少自由流動液相。',liquid:'液相框架需要連續可流動液相的證據，不能只看含水量。',unknown:'本題已明示相態時，可限定相應框架；仍不保證供氧或效能。',dry:'固態發酵框架中的基質仍可含水；無水不是這個定義。',oxygen:'物理模式與微生物氧需求、局部氣體供應不同，不能一對一指定。','solid-air':'孔隙、含水分布、消耗及熱移除都可能造成限制；固態不是天然均勻。','liquid-mixed':'連續液相不表示每處充分混合、供氧或等溫。',winner:'沒有目的、比較及端點資料，不能選出普遍產率／成本贏家。',measured:'提出或勾選位置不是量測結果；所有局部值仍未知。',field:'有限候選位置不等於連續空間已覆蓋，更不證明均勻。',none:'目前已有候選位置，可描述計畫；仍需明說尚未取得觀察。',plan:'目前尚未選位置，候選範圍也未知。','solid-free':'產物位置及回收方法需另交代，固態名稱不能免除回收或萃取問題。','liquid-total':'濃度缺少對應總量與回收資訊，不能當整批產量。','same-recovery':'支撐、液相與目標位置可能改變取樣和回收問題。',name:'同一食品可有多個階段，名稱不是相態證據。','all-water':'濕潤基質也有水；總含水量不決定自由流動液相。',protocol:'本課只有物理機理與證據比較，沒有培養或放大操作。',rank:'優缺點需對應目標與條件，不能給所有目的的固定排序。',yield:'混合或氣體條件變動有多重影響，不能直接保證產量提高。',safety:'沒有危害或實際產品驗證，不能判食品安全。',list:'只有名詞沒有機理、取捨與例子的範圍，尚不足構成完整比較。',always:'兩種物理模式不等於兩種固定氧需求。',guarantee:'模式名稱不提供產量、成本或安全保證。'};
 return {stationId:station.id,context:fermentationContext(d),answer,ready:true,correct:t.choice===answer,feedback:t.choice===answer?'此判讀符合題設與來源的範圍。':wrong[t.choice]??'請核對題目明示條件與證據範圍。',explanation:explanations[station.id]};
}
export function canCheckFermentation(d){const t=getFermentationTrial(d);return Boolean(t.revealed&&!t.checked&&getFermentationStation(d.stationId).options.some(x=>x.id===t.choice));}
export function checkFermentationAnswer(d){const t=getFermentationTrial(d);if(!canCheckFermentation(d))return false;const snap=freeze({...evaluateFermentation(d),choice:t.choice,reason:text(t.reason)});lock(t,'checked',snap);lock(t,'reason',snap.reason);return true;}
export function fermentationRevealDiffers(d){const t=getFermentationTrial(d);return Boolean(t.revealed&&JSON.stringify(t.revealed.context)!==JSON.stringify(fermentationContext(d)));}
export function currentFermentationDiffers(d){const t=getFermentationTrial(d);return Boolean(t.checked&&(t.choice!==t.checked.choice||JSON.stringify(t.checked.context)!==JSON.stringify(fermentationContext(d))));}
function evidenceLines(e){return [e.title,e.originLabel,...e.paragraphs,...e.rows.flatMap(r=>[r.label,'給定：'+r.given,'機理候選：'+r.mechanism,'需要：'+r.evidence,'未知：'+r.unknown])];}
export function buildFermentationSummary(d){valid(d);const lines=['發酵物理狀態：支撐、傳遞與條件性取捨','原創定性情境與來源食品階段例分開；沒有培養、成長、產量或安全模型。','目前任務：'+getFermentationStation(d.stationId).title,'目前盤面：'+fermentationContextLabel(fermentationContext(d))];for(const s of FERMENTATION_STATIONS){const t=d.trials[s.id];if(!t||!(t.prediction||t.predictionReason||t.choice||t.reason||t.checked||t.revision))continue;const label=id=>s.options.find(o=>o.id===id)?.label||'未選';lines.push('',s.title,'預測：'+(getFermentationPrediction({...d,stationId:s.id}).options.find(o=>o.id===t.prediction)?.label||'未選'),'預測理由：',text(t.predictionReason));if(t.revealed)lines.push('首次揭示條件：'+fermentationContextLabel(t.revealed.context),...evidenceLines(t.revealed.evidence));lines.push('目前選項：'+label(t.choice),'核對前理由：',text(t.reason));if(t.checked)lines.push('初答（首次核對）：'+label(t.checked.choice),'首次核對條件：'+fermentationContextLabel(t.checked.context),'首次核對：'+(t.checked.correct?'符合題設與證據範圍':'需要修訂'),'核對時理由：',t.checked.reason,'選項回饋：',t.checked.feedback,'核對說明：',t.checked.explanation);else lines.push('尚未核對，不計為答對。');if(s.id===d.stationId){if(fermentationRevealDiffers(d))lines.push('目前條件與首次揭示不同；首次預測仍保留原條件，核對另保留自己的條件。','目前固定材料：',...evidenceLines(getFermentationEvidence(d)));if(currentFermentationDiffers(d))lines.push('目前條件或選項已改，舊核對不能當作目前已答對。');}lines.push('修訂：',text(t.revision));}lines.push('','我的整合短答：',text(d.synthesis),'','七個有限任務槽，首次揭示與核對各自固定，修訂另存。自由文字未自動評分。所有產量、成本、效率、局部場與食品安全均未提供。',...FERMENTATION_SOURCES.map(s=>s.label+' '+s.url+'；'+s.scope));return lines.join('\n');}
