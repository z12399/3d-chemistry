// Fixed published observations and original reasoning tasks, not a fermentation or safety simulator.
export const MISO_SALT_ID='miso-salt-reasoning';
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const text=value=>typeof value==='string'?value:'';
const lock=(target,key,value)=>Object.defineProperty(target,key,{value,writable:false,configurable:false,enumerable:true});
export const MISO_SOURCES=freeze([
 {id:'miso-source-kusumoto2021',label:'Kusumoto等2021：味噌、麴與酵素的專家綜述',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8307815/',scope:'採選定米麴／黃豆角色背景，區分酵素水解、微生物代謝與原料差異；不採製造或培養條件，也不把所有味噌都說成相同配方。'},
 {id:'miso-source-santos2025',label:'Santos等2025：不同豆類與鹽配方的原始研究',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12692464/',scope:'本台只取Table3黃豆參照配方SM3／SM12的起末 glucose、末端TSS，以及§3.5培養檢出敘述。配方除NaCl外亦有其他差異，不是只改鹽的單因子因果證明；未移植製造程序。'},
 {id:'miso-source-chin1986',label:'Chin與Koehler 1986：鹽條件與生物胺的原始研究',url:'https://pubmed.ncbi.nlm.nih.gov/30959661/',scope:'只核讀完整公開摘要：所研究較低鹽配方的生物胺較高。沒有在本課重建數值、方法細節、風味、安全門檻或人體中毒機率。'}
]);
export const MISO_ROLES=freeze([
 {id:'protein',label:'麴的蛋白水解作用',given:'本課選定米麴／黃豆背景：麴提供的蛋白水解酵素，參與蛋白質變為較小胜肽、胺基酸。',answer:'protein'},
 {id:'starch',label:'麴的澱粉分解作用',given:'麴提供澱粉分解酵素，參與原料澱粉轉成較小醣類；產生醣與後續微生物利用是不同作用。',answer:'starch'},
 {id:'microbes',label:'微生物的後續代謝',given:'相符微生物可利用原料或水解產物，參與酸、香氣等物質的形成；菌體、酵素及產物須分開。',answer:'microbes'},
 {id:'matrix',label:'鹽、水與原料形成的作用環境',given:'鹽、水分與原料共同影響作用環境；降低鹽這個標籤本身不指定所有微生物或品質的變化方向。',answer:'matrix'}
]);
export const MISO_PAIRS=freeze([
 {id:'soy-formulations',label:'黃豆參照配方SM3與SM12',given:'Santos研究兩個黃豆參照配方除NaCl外，豆類比例與非巴氏味噌背景加入量也不同。',answer:'formulations'},
 {id:'different-ingredients',label:'換豆類又換鹽配方',given:'Santos另有其他豆類配方。把不同豆類與不同配方放在一起，會同時更動多項條件。',answer:'multiple'},
 {id:'soy-times',label:'同一黃豆配方的起點與末端',given:'本課採用的黃豆參照配方只刊載起點T0與末端T18；兩點之間不補數值。T標籤保留原文，不作製造時程建議。',answer:'two-points'}
]);
// Integers are reported thousandths, not a fitted process model. SD is displayed, never propagated.
export const MISO_SOY_DATA=freeze({
 unit:'g／100 g（原表單位）',source:'Santos等2025 Table3',
 SM3:{label:'原文黃豆參照配方SM3',initialMilli:438,initialSdMilli:38,finalMilli:12992,finalSdMilli:288,tssFinal:35,tssSd:0},
 SM12:{label:'原文黃豆參照配方SM12',initialMilli:904,initialSdMilli:61,finalMilli:6922,finalSdMilli:373,tssFinal:35,tssSd:1}
});
export const MISO_ENDPOINTS=freeze([
 {id:'glucose',label:'葡萄糖濃度',predictionPrompt:'只憑較低鹽的標籤，你預測SM3末端葡萄糖相對SM12如何？',answer:'glucose'},
 {id:'tss',label:'總可溶性固形物TSS',predictionPrompt:'只憑配方的鹽標籤，你預測SM3末端TSS相對SM12如何？',answer:'tss'},
 {id:'culture',label:'原方法的培養檢出',predictionPrompt:'只憑配方鹽標籤，你能先斷言末端的培養檢出情況嗎？',answer:'culture'}
]);
const directionPredictions=freeze([{id:'higher',label:'SM3較高／較多'},{id:'lower',label:'SM3較低／較少'},{id:'same',label:'兩者相同'},{id:'unknown',label:'僅憑標籤無法預言此端點'}]);
export const MISO_STATIONS=freeze([
 {id:'roles',title:'1．先把味噌的角色鏈接起來',prompt:'依標出的角色，哪一句補上相符作用，而沒有把所有味噌都當相同配方？',options:[{id:'protein',label:'麴酵素可參與蛋白水解，形成較小胜肽與胺基酸'},{id:'starch',label:'麴酵素可參與澱粉分解；醣的形成不等於已全部被微生物利用'},{id:'microbes',label:'微生物代謝與酵素水解是不同作用，需各自辨認產物'},{id:'matrix',label:'鹽、水與原料共同構成作用環境，不能僅由降低鹽保證品質或安全'},{id:'all',label:'只要有麴或鹽，就已證明所有產物、菌數、風味與安全'}]},
 {id:'comparison',title:'2．先選你真正能比較的問題',prompt:'依這份比較材料，哪個結論有保留條件身分？',options:[{id:'formulations',label:'這是兩個配方的比較，不能把全部差異唯一歸因於NaCl'},{id:'multiple',label:'原料與配方同時變動；不能把跨產品差異當單一鹽效應'},{id:'two-points',label:'起末兩點可描述端點與淨濃度變化，不能補成完整軌跡或速率'},{id:'salt-only',label:'代碼中有鹽差異，所以這必定是只改NaCl的單因子實驗'}]},
 {id:'observations',title:'3．先預測，再看研究真的量了什麼',prompt:'先保留預測並揭示這個端點。下列哪句符合已給資料及量測身分？',options:[{id:'glucose',label:'此配方比較的末端葡萄糖平均值不同；不是單獨NaCl效應、糖生成總量或品質排名'},{id:'tss',label:'TSS報告平均值同為35，不等於所有糖組成、所有特性或統計上完全等效'},{id:'culture',label:'原文所報酵母／乳酸菌培養方法末端未檢出；不能改寫成零菌、全部死亡、已證VBNC或安全'},{id:'safe',label:'這個端點已經證明低鹽味噌及其他食品都安全'}]},
 {id:'change',title:'4．起點不同，末端差代表哪個量？',prompt:'保留預測後，切換末端差與兩端淨濃度變化差。怎樣描述目前算出的量？',options:[{id:'endpoint',label:'這是末端葡萄糖濃度差；起點本來不同，不能直接叫作發酵新增量'},{id:'net',label:'這是各配方起末淨濃度變化的差；不是生成／消耗總量、反應速率或完整碳收支'},{id:'yield',label:'數字可直接當產糖總量、生成速率或單一NaCl效果'}]},
 {id:'amines',title:'5．減鹽後，有哪些端點不能互相代替？',prompt:'先保留預測，再讀另一篇原始研究的公開摘要觀察。哪個判讀保留來源範圍？',options:[{id:'qualified',label:'該研究較低鹽配方的生物胺較高；這是需另辨身分的端點，不是通用安全或風味判定'},{id:'flavor-safe',label:'只要風味或pH合意，較高生物胺就不用另查'},{id:'all-unsafe',label:'這證明所有低鹽食品必然中毒，且已有通用安全閾值'}]},
 {id:'transfer',title:'6．移到減鹽醬油，哪些證據要重做？',prompt:'把這份味噌資料移到減鹽醬油，能直接沿用全部安全或品質結論嗎？',options:[{id:'matched',label:'不能；產品、配方、菌群、方法與端點需重新核對，未測危害仍留未知'},{id:'same-name',label:'兩者都用麴，所有結果就可直接移用'},{id:'soy-paper',label:'舊醬油額外接種的揮發訊號資料，已自動等於降低鹽的安全實驗'},{id:'none',label:'不能直接移用，因此已證明所有減鹽方法都無效'}]}
]);
const stations=new Map(MISO_STATIONS.map(x=>[x.id,x])),roles=new Map(MISO_ROLES.map(x=>[x.id,x])),pairs=new Map(MISO_PAIRS.map(x=>[x.id,x])),endpoints=new Map(MISO_ENDPOINTS.map(x=>[x.id,x]));
const find=(map,id,name)=>{const value=map.get(id);if(!value)throw new RangeError('Unknown miso '+name);return value;};
export const getMisoStation=id=>find(stations,id,'station');
export const getMisoRole=id=>find(roles,id,'role');
export const getMisoPair=id=>find(pairs,id,'comparison');
export const getMisoEndpoint=id=>find(endpoints,id,'endpoint');
function valid(d){if(!d||typeof d!=='object'||!d.trials||typeof d.trials!=='object'||Array.isArray(d.trials))throw new TypeError('A miso draft is required');getMisoStation(d.stationId);getMisoRole(d.roleId);getMisoPair(d.pairId);getMisoEndpoint(d.endpointId);if(!['endpoint','net'].includes(d.basisId))throw new RangeError('Unknown miso difference basis');return d;}
export function createMisoDraft(){return {stationId:'roles',roleId:'protein',pairId:'soy-formulations',endpointId:'glucose',basisId:'endpoint',trials:{},synthesis:'',details:{}};}
export function setMisoControl(d,key,value){valid(d);if(key==='stationId')getMisoStation(value);else if(key==='roleId'&&d.stationId==='roles')getMisoRole(value);else if(key==='pairId'&&d.stationId==='comparison')getMisoPair(value);else if(key==='endpointId'&&d.stationId==='observations')getMisoEndpoint(value);else if(key==='basisId'&&d.stationId==='change'){if(!['endpoint','net'].includes(value))throw new RangeError('Unknown difference basis');}else throw new RangeError('Unavailable miso control');d[key]=value;return d;}
export function getMisoKey(d){valid(d);return d.stationId==='roles'?`roles/${d.roleId}`:d.stationId==='comparison'?`comparison/${d.pairId}`:d.stationId==='observations'?`observations/${d.endpointId}`:d.stationId==='change'?`change/${d.basisId}`:d.stationId;}
export function getMisoTrial(d){const key=getMisoKey(d);if(!Object.hasOwn(d.trials,key))d.trials[key]={prediction:'',predictionReason:'',revealed:null,choice:'',reason:'',checked:null,revision:''};return d.trials[key];}
export function misoRequiresReveal(d){valid(d);return ['observations','change','amines'].includes(d.stationId);}
export function getMisoPrediction(d){valid(d);if(d.stationId==='change')return {prompt:'起點不同時，把末端差與兩端淨濃度變化差相比，你預測兩個數字是否相同？',options:[{id:'same',label:'應相同'},{id:'different',label:'可能不同，應分開計算'},{id:'unknown',label:'尚未判斷，先保留疑問'}]};if(d.stationId==='amines')return {prompt:'只憑較低鹽的配方名稱，你先預測這篇研究的生物胺相對參照如何？',options:[{id:'higher',label:'較高'},{id:'lower',label:'較低'},{id:'same',label:'相同'},{id:'unknown',label:'單憑名稱無法預言'}]};return {prompt:getMisoEndpoint(d.endpointId).predictionPrompt,options:directionPredictions};}
export function chooseMisoPrediction(d,value){if(!misoRequiresReveal(d))throw new RangeError('No prediction in this task');const t=getMisoTrial(d);if(t.revealed)throw new Error('First prediction is already retained');if(!getMisoPrediction(d).options.some(x=>x.id===value))throw new RangeError('Unknown miso prediction');t.prediction=value;return d;}
function context(d){valid(d);if(d.stationId==='roles')return {roleId:d.roleId};if(d.stationId==='comparison')return {pairId:d.pairId};if(d.stationId==='observations')return {endpointId:d.endpointId};if(d.stationId==='change')return {basisId:d.basisId};return {};}
export function misoContextLabel(c){return c.roleId?getMisoRole(c.roleId).label:c.pairId?getMisoPair(c.pairId).label:c.endpointId?getMisoEndpoint(c.endpointId).label:c.basisId?(c.basisId==='endpoint'?'末端濃度差':'起末淨濃度變化差'):'固定題目材料';}
export function getMisoDifference(basis){if(!['endpoint','net'].includes(basis))throw new RangeError('Unknown concentration difference basis');const value=g=>basis==='endpoint'?g.finalMilli:g.finalMilli-g.initialMilli;const leftMilli=value(MISO_SOY_DATA.SM3),rightMilli=value(MISO_SOY_DATA.SM12);return {basis,leftMilli,rightMilli,differenceMilli:leftMilli-rightMilli,unit:MISO_SOY_DATA.unit,predictsYield:false,predictsRate:false};}
export function getMisoEvidence(d){valid(d);if(d.stationId==='amines')return {title:'Chin與Koehler 1986：摘要中的限定觀察',paragraphs:['公開摘要報告：所研究較低鹽配方的生物胺較高。','本課未採其完整方法或數值；不給通用閾值、風味總分或人體中毒率。這篇研究不是Santos配方的另一端點，不可把兩篇拼成同一批樣品。'],sourceId:'miso-source-chin1986'};
 if(d.stationId==='change'){const v=getMisoDifference(d.basisId);return {title:d.basisId==='endpoint'?'末端濃度差':'起末淨濃度變化差',paragraphs:[`SM3：${(v.leftMilli/1000).toFixed(3)}；SM12：${(v.rightMilli/1000).toFixed(3)}；差：${(v.differenceMilli/1000).toFixed(3)} ${v.unit}。`,'只對已刊報告平均值作濃度相減，未傳播SD；起末兩點不補中間軌跡，不等於生成／消耗總量或速率。'],sourceId:'miso-source-santos2025',values:v};}
 if(d.stationId!=='observations')throw new RangeError('No evidence reveal in this task');
 if(d.endpointId==='glucose')return {title:'Table3：葡萄糖，g／100 g',rows:[['配方','T0：平均值±SD','T18：平均值±SD'],['SM3','0.438±0.038','12.992±0.288'],['SM12','0.904±0.061','6.922±0.373']],paragraphs:['兩配方起點本來不同；本課只保留這兩個採樣標籤，不生成時間歷程。','原文報n=3，但方法中的分析／注射重複及兩罐取樣，不能當三個獨立製造批次；本課不由SD算信賴區間或顯著性。'],sourceId:'miso-source-santos2025'};
 if(d.endpointId==='tss')return {title:'Table3：末端TSS，°Brix',rows:[['配方','T18：平均值±SD'],['SM3','35.000±0.000'],['SM12','35.000±1.000']],paragraphs:['兩列同為報告平均值35.000；同列字母均為(e)。未見差異不當完全等效。','TSS是量測端點，不等於只含葡萄糖，也不能包辦感官、危害或所有化學組成。'],sourceId:'miso-source-santos2025'};
 return {title:'§3.5：末端所報培養檢出',paragraphs:['研究黃豆參照配方末端的所報酵母／乳酸菌培養方法未檢出；結論僅限這些檢查範圍。','這是正文敘述，不把其他豆類表格的NCC代碼搬來。未採數值檢出限，不填0 CFU、不稱全部死亡或已證VBNC，也不將它補成病原／毒素陰性。'],sourceId:'miso-source-santos2025',numericCount:null};}
export function canRevealMiso(d){const t=getMisoTrial(d);return misoRequiresReveal(d)&&!t.revealed&&getMisoPrediction(d).options.some(x=>x.id===t.prediction);}
export function revealMisoEvidence(d){const t=getMisoTrial(d);if(!canRevealMiso(d))return false;const s=freeze({prediction:t.prediction,predictionReason:text(t.predictionReason),context:context(d),evidence:getMisoEvidence(d)});lock(t,'revealed',s);lock(t,'prediction',s.prediction);lock(t,'predictionReason',s.predictionReason);return true;}
export function chooseMisoAnswer(d,value){if(!getMisoStation(d.stationId).options.some(x=>x.id===value))throw new RangeError('Unknown miso answer');getMisoTrial(d).choice=value;return d;}
export function evaluateMiso(d){valid(d);let answer,explanation;
 if(d.stationId==='roles'){answer=d.roleId;explanation=getMisoRole(d.roleId).given+' 這是選定的角色背景，不是全體味噌的製法或產率。酵素、微生物、物質與作用環境各須分開，來源及本課均不能由一個角色保證成品安全。';}
 else if(d.stationId==='comparison'){answer=getMisoPair(d.pairId).answer;explanation=getMisoPair(d.pairId).given+' 有較低／較高鹽標籤，不代表其他因素已相同；比較問題應依資料設計縮小。配方差可描述，不會自動辨認單一NaCl因果效應。';}
 else if(d.stationId==='observations'){answer=d.endpointId;explanation=d.endpointId==='glucose'?'SM3末端報告葡萄糖平均值較高，且兩配方起點不同。這些是配方與方法限定的濃度資料；不是總生成量、單一NaCl效果、感官偏好或安全判定。':d.endpointId==='tss'?'同為35的報告TSS平均值並沒有把葡萄糖、其他組成及所有特性變成相同。相同字母或未見差異也不是統計等效證明；無法替代病原或毒素量測。':'所報酵母／乳酸菌培養方法末端未檢出是方法限定敘述，不等於零菌、全死或已證明存在VBNC。未測的病原、毒素及其他危害不能補成陰性，更不能判食品安全。';}
 else if(d.stationId==='change'){answer=d.basisId;explanation=d.basisId==='endpoint'?'末端差為6.070 g／100 g；它忽略兩配方原本不相同的起點，不能改稱發酵新增量。':'各配方起末淨濃度變化為12.554與6.018，變化差為6.536 g／100 g。這只作濃度記帳，不知道整體質量、產生與利用各自的量，也不提供速率或單一NaCl因果效應。';}
 else if(d.stationId==='amines'){answer='qualified';explanation='Chin與Koehler的摘要觀察要求把生物胺另作端點，而非由風味或pH代替。觀察限該研究配方與條件，本課未採安全閾值或臨床資料；較高也不直接判定所有低鹽味噌有毒。不能把它與Santos不同配方數據拼成同一批樣品。';}
 else{answer='matched';explanation='味噌與醬油的原料、產品、鹽／水分環境、微生物與方法不相同；須有與問題相符的減鹽比較及危害端點。舊醬油額外接種的揮發訊號研究，不自動成為減鹽安全研究。未測留未知，不等於已證全部無效。';}
 return {key:getMisoKey(d),stationId:d.stationId,context:context(d),answer,explanation};}
export function canCheckMiso(d){const t=getMisoTrial(d);return !t.checked&&(!misoRequiresReveal(d)||Boolean(t.revealed))&&getMisoStation(d.stationId).options.some(x=>x.id===t.choice);}
export function checkMisoAnswer(d){const t=getMisoTrial(d);if(!canCheckMiso(d))return false;const r=evaluateMiso(d),wrong={all:'一個角色不能包辦全部作用與品質。','salt-only':'配方同時有其他差異；不要把標籤當成已排除混雜。',safe:'這個端點沒有完成危害證據；不能用它判食品安全。',yield:'濃度相減不是生成總量、速率或單因子因果效果。','flavor-safe':'風味、酸度與生物胺／病原端點不能互相代替。','all-unsafe':'研究中的較高觀察不等於所有食品都會中毒，也沒有本課通用安全閾值。','same-name':'共用麴的名稱不使產品與證據條件相同。','soy-paper':'額外接種與降低鹽是不同介入，揮發訊號不是安全端點。',none:'不能直接移用是外推限制，不是全稱無效證明。'};const correct=t.choice===r.answer;const s=freeze({...r,choice:t.choice,reason:text(t.reason),correct,feedback:correct?'此判讀符合本題已給資料與界線。':wrong[t.choice]??'請依目前角色、配方、端點或相減基準重新對照。',prediction:t.revealed?{choice:t.revealed.prediction,reason:t.revealed.predictionReason}:null});lock(t,'checked',s);lock(t,'reason',s.reason);return true;}
export function currentMisoDiffers(d){const t=getMisoTrial(d);return Boolean(t.checked&&t.choice!==t.checked.choice);}
export function buildMisoSummary(d){valid(d);const lines=['減鹽味噌：角色、配方比較與量測端點','角色及遷移題為本課原創；研究固定觀察不生成軌跡、配方或安全判定。',`目前任務：${getMisoStation(d.stationId).title}`];for(const[key,t]of Object.entries(d.trials).filter(([,t])=>t.prediction||t.predictionReason||t.choice||t.reason||t.revision||t.checked).sort(([a],[b])=>a<b?-1:a>b?1:0)){const [station,part]=key.split('/'),item=getMisoStation(station),ctx=station==='roles'?{roleId:part}:station==='comparison'?{pairId:part}:station==='observations'?{endpointId:part}:station==='change'?{basisId:part}:{};const label=id=>item.options.find(x=>x.id===id)?.label??'未選';lines.push('',item.title,'條件：'+misoContextLabel(ctx));if(t.prediction||t.predictionReason)lines.push(t.revealed?'首次揭示時保留的預測：':'目前未揭示預測：',(getMisoPrediction({...d,stationId:station,...ctx}).options.find(o=>o.id===t.prediction)?.label??'未選'),'預測理由：',text(t.predictionReason));if(t.revealed){lines.push('已揭示：'+t.revealed.evidence.title,...t.revealed.evidence.paragraphs);if(t.revealed.evidence.rows)lines.push(...t.revealed.evidence.rows.map(row=>row.join('｜')));}lines.push('目前判讀：'+label(t.choice),'核對前理由：',text(t.reason));if(t.checked){const s=t.checked;lines.push('初答（首次核對）：'+label(s.choice),'首次核對條件：'+misoContextLabel(s.context),`首次核對：${s.correct?'符合本題資料與界線':'需修訂'}`,'核對時理由：',s.reason,'選項回饋：',s.feedback,'核對說明：',s.explanation,t.choice===s.choice?'目前選項與首次核對相同。':'目前選項已改，舊核對不代表目前已答對。');}else lines.push('尚未核對，不計為答對。');lines.push('修訂：',text(t.revision));}lines.push('','我的整合短答：',text(d.synthesis),'','預測在首次揭示時固定，判讀初答在首次核對時固定；自由文字未自動評分。改條件各用有限槽。已保存的是可讀摘要，不重建未保存盤面；未測危害不填成零或安全。');return lines.join('\n');}
