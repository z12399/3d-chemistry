// Original finite evidence exercises; no culture dynamics, intervention protocol or efficacy predictor.
export const COMPETITIVE_EXCLUSION_ID = 'competitive-exclusion-reasoning';
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const EXCLUSION_ENDPOINTS = freeze([
  {id:'same', label:'甲：目標不變，其他增加', targetBefore:10, otherBefore:90, targetAfter:10, otherAfter:190},
  {id:'increase', label:'乙：目標與其他都增加', targetBefore:10, otherBefore:90, targetAfter:20, otherAfter:380},
  {id:'decrease', label:'丙：目標較低', targetBefore:10, otherBefore:90, targetAfter:5, otherAfter:95},
  {id:'empty', label:'丁：後端總量為零的記帳邊界', targetBefore:10, otherBefore:90, targetAfter:0, otherAfter:0}
]);
export const EXCLUSION_EVIDENCE = freeze([
  {id:'endpoint',label:'只給可比的定殖端點',given:'原創假設：常駐群存在時，經相符方法評估的目標定殖端點較低；尚無能分開機制的比較。',expected:'not-unique'},
  {id:'resource-pattern',label:'再給資源可及性的條件比較',given:'原創概念證據包：可比情境的酸鹼環境與棲位可及性相符；共享資源較充裕時，原先目標定殖較低的差異縮小。只提供這項質性關係，沒有實驗數據或操作方法。',expected:'resource-supported'},
  {id:'environment-pattern',label:'只補酸鹼環境關係',given:'原創概念證據包：可比情境中，酸鹼環境與目標定殖端點有相符關係；共享資源與棲位資料未提供。這項關係沒有單獨辨認酸的來源或全部機制。',expected:'environment-supported'}
]);
export const EXCLUSION_SOURCES = freeze([
  {id:'micro-ce-lee2023', label:'Lee 等 2023：CE 培養物的組成與批次效力研究', url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9868637/', scope:'摘要比較群落組成與該產品的 Salmonella 降低端點；組成不是批次效力的良好預測。這不是本課記帳數字的來源，也不是人體或所有 CE 產品的通則。'}
]);
export const EXCLUSION_CASES = freeze([
  {id:'fraction', title:'1．占比下降，目標量呢？', prompt:'同一個假想記帳基準的前、後兩端。先預判目標絕對量與相對占比能支持哪一句？', options:[{id:'same',label:'目標絕對量不變，相對占比下降'},{id:'increase',label:'目標絕對量增加，相對占比仍下降'},{id:'decrease',label:'目標絕對量與相對占比都較低；尚未確定原因'},{id:'undefined',label:'後端總量為零，占比無定義；不能將它寫成 0%'}]},
  {id:'resource', title:'2．資源競爭：可能，還是已證實？', prompt:'只檢查「常駐群與新來目標爭同一受限資源」這條假說。依三個條件，能推到哪一步？', options:[{id:'possible',label:'具備這條競爭假說的必要條件，但尚未證明目標較少或被排除'},{id:'insufficient',label:'本表不足以支持這條共享受限資源假說；其他機制仍未知'},{id:'eliminated',label:'只要有常駐群，就已證明目標必定歸零'}]},
  {id:'mechanism', title:'3．補什麼證據，才能縮小原因？', prompt:'切換原創概念證據包，先預判哪一條機制得到較針對性的支持；支持候選機制也不等於證明唯一原因。', options:[{id:'not-unique',label:'只有定殖端點差異，還不能辨認資源、棲位或環境機制'},{id:'resource-supported',label:'較針對共享資源競爭的候選解釋；仍不證明唯一機制'},{id:'environment-supported',label:'較針對環境作用的候選解釋；資源與棲位仍未知'},{id:'attachment',label:'無論哪個證據包，都已證明所有黏附位置被占滿'}]},
  {id:'acid', title:'4．酸化和排除，分開取證', prompt:'另一份材料只報目標相對占比降低、pH 較低。它能單獨證明常駐群以資源競爭成功排除目標嗎？', options:[{id:'proved',label:'可以；酸化就是資源競爭，且占比降低就是目標量降低'},{id:'not-unique',label:'不能；需先確認絕對端點，再區分酸性環境作用與競爭等解釋'},{id:'no-effect',label:'不能，所以已證明常駐群沒有任何作用'}]},
  {id:'potency', title:'5．多樣性與名稱，能代替效力嗎？', prompt:'研究指出某 CE 產品的群落組成不是批次效力的良好預測。面對「益生菌」名稱或較高多樣性，哪個推論成立？', options:[{id:'guaranteed',label:'只要多樣性較高，所有 CE 產品效力就一定更好'},{id:'measure',label:'名稱或多樣性不能代替指定情境與相符端點的效力驗證'},{id:'never',label:'這已證明所有群落組成都不可能與任何作用有關'}]},
  {id:'transfer', title:'6．換宿主與量測，先保留未知', prompt:'把另一宿主、另一採樣位置的相對定序占比拿來，宣稱原產品在新情境已證實降低定殖，還缺什麼？', options:[{id:'matched',label:'新情境下可比的對照、相符位置與量測身分，以及可判讀的目標絕對端點；原結果不能直接移植'},{id:'fraction-only',label:'不缺；只要占比更低，就能外推全部宿主'},{id:'zero',label:'沒有相應資料，代表作用為零'}]}
]);
const cases = new Map(EXCLUSION_CASES.map(item=>[item.id,item]));
const endpoints = new Map(EXCLUSION_ENDPOINTS.map(item=>[item.id,item]));
const evidence = new Map(EXCLUSION_EVIDENCE.map(item=>[item.id,item]));
const text = value => typeof value === 'string' ? value : '';
const requireDraft = draft => { if (!draft || typeof draft!=='object' || !draft.trials || typeof draft.trials!=='object' || Array.isArray(draft.trials)) throw new TypeError('An exclusion draft is required'); return draft; };
const lock = (target,key,value) => Object.defineProperty(target,key,{value,writable:false,configurable:false,enumerable:true});

export function exclusionFraction(target,other) {
  for (const value of [target,other]) if (typeof value!=='number' || !Number.isFinite(value) || value<0 || value>1e12) throw new RangeError('Abstract amounts must be finite, non-negative and at most 1e12');
  const total=target+other;
  if (total===0) return {target,other,total,fraction:null};
  // The per-amount cap keeps this sum finite; unresolved positive shares are rejected below.
  const fraction=target/total;
  if ((target>0 && fraction===0) || (other>0 && fraction===1)) throw new RangeError('The share is outside the resolvable numeric range');
  return {target,other,total,fraction};
}
export function compareExclusionEndpoints(targetBefore,otherBefore,targetAfter,otherAfter) {
  const before=exclusionFraction(targetBefore,otherBefore),after=exclusionFraction(targetAfter,otherAfter);
  // Positive shares within four relative machine epsilons cannot establish a direction.
  // There is no absolute tolerance: a true zero stays distinct from every positive share.
  const a=before.fraction,b=after.fraction;
  const sameShare=a===b || (a>0 && b>0 && Math.abs(a-b)<=4*Number.EPSILON*Math.max(a,b));
  return {before,after,absoluteDirection:targetAfter===targetBefore?'same':targetAfter>targetBefore?'increase':'decrease',fractionDirection:a===null||b===null?'undefined':sameShare?'same':b>a?'increase':'decrease'};
}
export function resourceCompetitionPossibility({resident,overlap,limited}) {
  if (!['present','absent'].includes(resident)||!['shared','disjoint'].includes(overlap)||!['limited','plentiful'].includes(limited)) throw new RangeError('Unknown conceptual resource condition');
  return {possible:resident==='present'&&overlap==='shared'&&limited==='limited',measuredEffect:null,uniqueMechanism:false};
}
export function createExclusionDraft() { return {caseId:'fraction',endpointId:'same',evidenceId:'endpoint',resident:'present',overlap:'shared',limited:'limited',trials:{},synthesis:'',details:{}}; }
export function getExclusionCase(id) { const item=cases.get(id);if(!item)throw new RangeError('Unknown exclusion case');return item; }
export function getExclusionEndpoint(id) { const item=endpoints.get(id);if(!item)throw new RangeError('Unknown abstract endpoint');return item; }
export function getExclusionEvidence(id) { const item=evidence.get(id);if(!item)throw new RangeError('Unknown evidence package');return item; }
export function setExclusionControl(draft,key,value) {
  requireDraft(draft);
  if(key==='caseId')getExclusionCase(value);
  else if(key==='endpointId')getExclusionEndpoint(value);
  else if(key==='evidenceId')getExclusionEvidence(value);
  else if(key==='resident'){if(!['present','absent'].includes(value))throw new RangeError('Unknown resident condition');}
  else if(key==='overlap'){if(!['shared','disjoint'].includes(value))throw new RangeError('Unknown resource overlap');}
  else if(key==='limited'){if(!['limited','plentiful'].includes(value))throw new RangeError('Unknown resource limitation');}
  else throw new RangeError('Unknown exclusion control');
  draft[key]=value;return draft;
}
function trialKey(draft) {
  getExclusionCase(draft.caseId);getExclusionEndpoint(draft.endpointId);getExclusionEvidence(draft.evidenceId);resourceCompetitionPossibility(draft);
  return draft.caseId==='fraction'?`fraction/${draft.endpointId}`:draft.caseId==='resource'?`resource/${draft.resident}/${draft.overlap}/${draft.limited}`:draft.caseId==='mechanism'?`mechanism/${draft.evidenceId}`:draft.caseId;
}
export function getExclusionTrial(draft) {
  requireDraft(draft);const key=trialKey(draft);
  if(!Object.hasOwn(draft.trials,key))draft.trials[key]={choice:'',reason:'',checked:false,first:null,checkedSnapshot:null,revision:''};
  return draft.trials[key];
}
export function canCheckExclusion(draft) { const trial=getExclusionTrial(draft);return !trial.checked&&getExclusionCase(draft.caseId).options.some(option=>option.id===trial.choice); }
function result(draft) {
  const e=getExclusionEndpoint(draft.endpointId),values=compareExclusionEndpoints(e.targetBefore,e.otherBefore,e.targetAfter,e.otherAfter);
  if(draft.caseId==='fraction')return {expected:values.after.fraction===null?'undefined':values.absoluteDirection,explanation:values.after.fraction===null?'後端目標與其他均為0，分母為0，占比無定義。這只是原創記帳邊界，不能當成真實食品無菌或方法檢出限證據。':`同一假想基準下，目標由 ${e.targetBefore} 到 ${e.targetAfter}，相對占比由 ${100*values.before.fraction}% 到 ${(100*values.after.fraction).toFixed(4)}%。相對占比下降可與目標不變、上升或下降並存；只有丙的本課指定絕對量較低，但本表沒有辨認原因。`,values};
  if(draft.caseId==='resource') {const resource=resourceCompetitionPossibility(draft);return {expected:resource.possible?'possible':'insufficient',explanation:resource.possible?'常駐群存在、使用相同資源且該資源受限，讓這一條競爭假說具備概念前提；沒有輸入目標定殖端點，因此不能宣稱已降低或排除。':'至少一個選定前提缺少，所以本表不足以支持這一條共享受限資源競爭假說；它沒有評估位置競爭、環境作用或其他機制，更不是證明所有競爭排除都不可能。',resource};}
  if(draft.caseId==='mechanism') {const item=getExclusionEvidence(draft.evidenceId);return {expected:item.expected,evidenceGiven:item.given,explanation:item.id==='endpoint'?'原創假設已提供可比的定殖端點差異，卻沒有把資源與棲位、環境作用分開。單一端點不能辨認唯一機制。':item.id==='resource-pattern'?'在這份原創概念比較中，酸鹼與棲位可及性相符，而共享資源較充裕時，目標降低差異縮小，較針對共享資源競爭的候選解釋；不表示所有其他機制都已排除，更不給出培養或產品效力預測。':'這份原創概念資料較針對環境作用，並沒有提供能辨認共享資源或位置作用的資料。酸化可參與定殖抵抗，不能把它直接改名為已證實的營養競爭，也不表示它是唯一機制。'};}
  if(draft.caseId==='acid')return {expected:'not-unique',explanation:'相對占比不是目標絕對量。較低pH提示環境作用的可能性，並不等同共享資源競爭；即使補到絕對量較低，也不能僅由這兩項觀察辨認唯一機制。尚無證據不等於已證明沒作用。'};
  if(draft.caseId==='potency')return {expected:'measure',explanation:'Lee等2023摘要的結論限定該CE產品與該研究端點：群落組成不是批次效力的良好預測。不能由名稱或多樣性保證效力，也不能外推成所有組成都永遠無關。原創記帳表未使用該研究數字。'};
  return {expected:'matched',explanation:'宿主、位置與量測身分改變，原情境的端點不能直接移植。先要新情境可比對照與相符目標量測；相對定序比例不能直接充當絕對活菌定殖量。未知不是零，也不提供人體或食品安全保證。'};
}
export function checkExclusion(draft) {
  const trial=getExclusionTrial(draft);if(trial.checked)return true;if(!canCheckExclusion(draft))return false;
  const answer=result(draft),snapshot=freeze({caseId:draft.caseId,endpointId:draft.endpointId,evidenceId:draft.evidenceId,resident:draft.resident,overlap:draft.overlap,limited:draft.limited,choice:text(trial.choice),reason:text(trial.reason),correct:trial.choice===answer.expected,...answer});
  lock(trial,'first',snapshot);lock(trial,'checkedSnapshot',snapshot);lock(trial,'reason',snapshot.reason);lock(trial,'checked',true);return true;
}
export function buildExclusionSummary(draft) {
  requireDraft(draft);trialKey(draft);
  const lines=['競爭排除：量測、假說與證據','所有記帳數字與概念證據包為本課原創，非文獻CFU、實驗軌跡或培養／產品效力預測。',`目前任務：${draft.caseId}；端點${draft.endpointId}；證據包${draft.evidenceId}；常駐群${draft.resident}；資源${draft.overlap}/${draft.limited}`];
  const entries=Object.entries(draft.trials).filter(([,t])=>t.choice||t.reason||t.revision||t.checked).sort(([a],[b])=>a.localeCompare(b));
  for(const[key,t]of entries){lines.push('',`題目槽：${key}`,`目前選項：${text(t.choice)}`,'核對前理由：',text(t.reason));if(t.checkedSnapshot){const s=t.checkedSnapshot;lines.push(`初答（首次核對時）：${s.choice}`,`首次核對條件：${s.caseId}；${s.endpointId}；${s.evidenceId}；${s.resident}/${s.overlap}/${s.limited}`,`首次核對：${s.correct?'符合此題的資料與推論界線':'需修訂'}`,...(s.evidenceGiven?['核對時原創證據包：',s.evidenceGiven]:[]),'核對說明：',s.explanation);}else lines.push('尚未核對，不計為答對。');lines.push('修訂：',text(t.revision));}
  if(!entries.length)lines.push('尚無作答；未核對不計為答對。');
  lines.push('','我的整合短答：',text(draft.synthesis),'','常駐群使新來者較難建立是需限定情境的生態作用；資源模型只表概念前提，不計算定殖或功效。自由文字未自動評分。');return lines.join('\n');
}
