import {evaluateElectronArrows,inspectElectronState} from './electron-workbench-model.js';

/** A replayable tree of restricted electron-pair bookkeeping proposals.
 * This module has no persistence, DOM, timers, chemical search or next-answer
 * lookup. A valid proposal is not evidence of a possible reaction or pathway.
 */
export const ELECTRON_SANDBOX_FORMAT='electron-sandbox/v1';
export const ELECTRON_SANDBOX_LIMITS=Object.freeze({maxNodes:80,maxAttempts:100,maxBytes:256*1024,maxArrows:8,maxNoteLength:2000});
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const pair=(a,b)=>[a,b].sort().join('-');
function fail(message,code='invalid-sandbox-record'){const error=new Error(message);error.code=code;throw error;}
function catalogId(value){
  if(typeof value!=='string'||!/^[a-z][a-z0-9-]{0,99}$/.test(value))fail('反應路徑識別碼無效。');
  return value;
}
function startIndex(value){
  if(!Number.isSafeInteger(value)||value<0)fail('起始結構索引必須是非負整數。');
  return value;
}
function checkBytes(value){
  let raw;try{raw=JSON.stringify(value);}catch{fail('紀錄必須能序列化成 JSON，不接受循環或不支援的值。');}
  if(typeof raw!=='string')fail('紀錄不是有效的 JSON 物件。');
  if(new TextEncoder().encode(raw).length>ELECTRON_SANDBOX_LIMITS.maxBytes)fail('自主推導紀錄超過 256 KiB，未截斷或還原。','sandbox-byte-limit');
}
function time(value){
  if(typeof value!=='string')fail('時間必須是含明確時區的有效 ISO 日期時間。');
  const m=value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/);
  if(!m)fail('時間必須是含明確時區的有效 ISO 日期時間。');
  const [year,month,day,hour,minute,second]=m.slice(1,7).map(Number),leap=year%4===0&&(year%100!==0||year%400===0);
  const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  if(month<1||month>12||day<1||day>days[month-1]||hour>23||minute>59||second>59||
    m[8]!=='Z'&&(Number(m[8].slice(1,3))>23||Number(m[8].slice(4))>59)||!Number.isFinite(Date.parse(value)))fail('時間必須是有效的 ISO 日期時間，不能使用不存在的日期或時間。');
  return value;
}
function note(value){
  if(typeof value!=='string'||value.length>ELECTRON_SANDBOX_LIMITS.maxNoteLength)fail(`節點註記必須是最多 ${ELECTRON_SANDBOX_LIMITS.maxNoteLength} 個 UTF-16 單位的文字。`,'sandbox-note-limit');
  return value;
}
function authoritativeRoot(state){
  const inspected=inspectElectronState(state);
  if(!inspected.ok)fail('所選起始結構不能用目前的 CHON 成對電子模型驗證。','invalid-sandbox-root');
  if(state.atoms.some(atom=>!Array.isArray(atom.position)||atom.position.length!==3||!atom.position.every(v=>typeof v==='number'&&Number.isFinite(v))))fail('所選起始結構缺少完整的有限三維座標。','invalid-sandbox-root');
  // Preserve only the current, supplied teaching geometry. Chemical identity,
  // CIP, optimization and trajectory claims are not propagated to proposals.
  return {schema:'electron-workbench-state/v1',id:'electron-sandbox-root',name:'自主推導起始電子圖',
    atoms:state.atoms.map(atom=>({id:atom.id,element:atom.element,position:[...atom.position],formalCharge:atom.formalCharge??atom.charge,charge:atom.formalCharge??atom.charge})),
    bonds:state.bonds.map(bond=>({a:bond.a,b:bond.b,order:bond.order})),rotatableBonds:[],metadata:{
      explicitHydrogens:true,isTrajectory:false,displaySchematic:true,
      geometry:'current prepared catalog start-state coordinates; no geometry optimization or saved coordinates restored',
      stereochemistry:'not evaluated by sandbox',
    }};
}
function rootSignature(state){
  const atoms=state.atoms.map(atom=>[atom.id,atom.element,atom.formalCharge??atom.charge]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
  const bonds=state.bonds.map(bond=>[pair(bond.a,bond.b),bond.order]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
  // Exact canonical graph text, deliberately not a lossy/noncryptographic hash.
  return JSON.stringify({atoms,bonds});
}
function arrows(value,graph){
  if(!Array.isArray(value)||value.length>ELECTRON_SANDBOX_LIMITS.maxArrows)fail(`每組作答只能包含 0 至 ${ELECTRON_SANDBOX_LIMITS.maxArrows} 支箭頭。`,'sandbox-arrow-limit');
  const atoms=new Set(graph.atoms.map(atom=>atom.id)),bonds=new Set(graph.bonds.map(bond=>pair(bond.a,bond.b)));
  return Array.from(value,arrow=>{
    if(!Array.isArray(arrow)||arrow.length!==2||typeof arrow[0]!=='string'||typeof arrow[1]!=='string')fail('每支箭頭必須恰有兩個位點字串。');
    const [source,target]=arrow,sourceParts=source.split('-'),targetParts=target.split('-');
    const validSource=atoms.has(source)||sourceParts.length===2&&sourceParts[0]!==sourceParts[1]&&bonds.has(pair(...sourceParts));
    const validTarget=atoms.has(target)||targetParts.length===2&&targetParts[0]!==targetParts[1]&&targetParts.every(id=>atoms.has(id));
    if(!validSource||!validTarget)fail('箭頭必須使用該節點中存在的來源原子／鍵，以及存在的目的原子或兩端明示的目的鍵。');
    // Duplicates, ambiguous destinations and electron-budget mistakes remain
    // valid drafts/attempts. Only a successful core evaluation can make a node.
    return [source,target];
  });
}
function selectedNode(record,id){
  const node=record.nodes.find(node=>node.id===id);
  if(!node)fail('找不到指定的推導節點。');
  return node;
}

/** Create a serializable root record. The caller supplies an ISO timestamp;
 * nothing reads the clock. startIndex is zero-based and can name the terminal
 * catalog state when the learner wants to reason backward. On every replay,
 * that identity and graph signature are verified against the current prepared
 * mechanism. A caller-provided rootGraph is never stored as an authority.
 */
export function createElectronSandboxRecord(id,index,rootGraph,options={}){
  catalogId(id);startIndex(index);
  if(!isObject(options))fail('建立紀錄時需要時間選項物件。');
  const root=authoritativeRoot(rootGraph);
  const record={format:ELECTRON_SANDBOX_FORMAT,catalogId:id,startIndex:index,rootSignature:rootSignature(root),currentNodeId:'n0',
    nodes:[{id:'n0',parentId:null,arrows:[],at:time(options.at),note:'',draft:[],attempts:[]}]};
  checkBytes(record);return record;
}

/** Strictly whitelist and replay ALL nodes and attempts from the catalog root.
 * `preparedMechanism` is the mechanism object returned by catalog preparation,
 * not {mechanism,tasks}. No reference step or after-state is consulted.
 * Graphs and attemptResults are ephemeral plain objects keyed by n0/n1/...
 * and must not be substituted for the serializable, whitelisted `record`.
 */
export function replayElectronSandboxRecord(value,expectedCatalogId,preparedMechanism){
  catalogId(expectedCatalogId);checkBytes(value);
  if(!isObject(value)||value.format!==ELECTRON_SANDBOX_FORMAT)fail('這不是 electron-sandbox/v1 自主推導紀錄，不能套用引導工作台紀錄。');
  if(value.catalogId!==expectedCatalogId)fail('紀錄屬於另一條反應路徑，不能套用到目前活動。');
  const index=startIndex(value.startIndex);
  if(!isObject(preparedMechanism)||!Array.isArray(preparedMechanism.states)||index>=preparedMechanism.states.length)fail('目前路徑沒有紀錄指定的起始結構。');
  const root=authoritativeRoot(preparedMechanism.states[index]),signature=rootSignature(root);
  if(typeof value.rootSignature!=='string'||value.rootSignature!==signature)fail('起始電子圖已改變，無法把舊推導套用到目前結構。','sandbox-root-drift');
  if(!Array.isArray(value.nodes)||value.nodes.length<1||value.nodes.length>ELECTRON_SANDBOX_LIMITS.maxNodes)fail(`推導樹須有 1 至 ${ELECTRON_SANDBOX_LIMITS.maxNodes} 個節點，不能截斷還原。`,'sandbox-node-limit');
  const graphs={},attemptResults={},nodes=[];let totalAttempts=0;
  for(let i=0;i<value.nodes.length;i++){
    const incoming=value.nodes[i];
    if(!isObject(incoming)||incoming.id!=='n'+i)fail('節點須依建立順序連續命名 n0、n1…，不得重複、跳號或重排。');
    const id=incoming.id;let graph,transition;
    if(i===0){
      if(incoming.parentId!==null||!Array.isArray(incoming.arrows)||incoming.arrows.length!==0)fail('根節點 n0 必須沒有父節點，也沒有傳入箭頭。');
      graph=root;transition=[];
    }else{
      if(typeof incoming.parentId!=='string'||!own(graphs,incoming.parentId))fail('父節點必須已在目前節點之前出現，不能循環或連到未知節點。');
      transition=arrows(incoming.arrows,graphs[incoming.parentId]);
      const result=evaluateElectronArrows(graphs[incoming.parentId],transition);
      if(!result.ok)fail(`節點 ${id} 的傳入箭頭無法重建有效候選：${result.issues.map(issue=>issue.message).join(' ')}`,'sandbox-invalid-transition');
      graph=result.candidate;
    }
    if(!Array.isArray(incoming.attempts)||incoming.attempts.length>ELECTRON_SANDBOX_LIMITS.maxAttempts||totalAttempts+incoming.attempts.length>ELECTRON_SANDBOX_LIMITS.maxAttempts)fail(`全樹最多保留 ${ELECTRON_SANDBOX_LIMITS.maxAttempts} 次檢查，不能截斷還原。`,'sandbox-attempt-limit');
    totalAttempts+=incoming.attempts.length;
    const evaluated=[];
    const attempts=Array.from(incoming.attempts,attempt=>{
      if(!isObject(attempt))fail('每筆檢查紀錄必須是物件。');
      const selected=arrows(attempt.arrows,graph),at=time(attempt.at);
      evaluated.push(evaluateElectronArrows(graph,selected));return {arrows:selected,at};
    });
    nodes.push({id,parentId:incoming.parentId,arrows:transition,at:time(incoming.at),note:note(incoming.note),draft:arrows(incoming.draft,graph),attempts});
    graphs[id]=graph;attemptResults[id]=evaluated;
  }
  if(typeof value.currentNodeId!=='string'||!own(graphs,value.currentNodeId))fail('目前節點不在推導樹中。');
  const record={format:ELECTRON_SANDBOX_FORMAT,catalogId:expectedCatalogId,startIndex:index,rootSignature:signature,currentNodeId:value.currentNodeId,nodes};
  checkBytes(record);
  return {record,graphs,currentGraph:graphs[record.currentNodeId],attemptResults};
}

/** Pure edit actions. check records an attempt and never advances; commit
 * independently re-evaluates the current draft and only then appends a child.
 * Neither action trusts a caller's candidate/result/correct fields. Commit
 * stores its arrows/time in the child, without creating an additional check.
 * Any thrown limit/schema error leaves the supplied record entirely untouched.
 */
export function applyElectronSandboxAction(value,id,preparedMechanism,action){
  const replayed=replayElectronSandboxRecord(value,id,preparedMechanism),record=replayed.record;
  if(!isObject(action)||typeof action.type!=='string')fail('需要有效的自主推導操作。');
  const node=selectedNode(record,action.nodeId);let result;
  if(action.type==='select')record.currentNodeId=node.id;
  else if(action.type==='draft')node.draft=arrows(action.arrows,replayed.graphs[node.id]);
  else if(action.type==='note')node.note=note(action.text);
  else if(action.type==='check'||action.type==='commit'){
    const at=time(action.at);
    result=evaluateElectronArrows(replayed.graphs[node.id],node.draft);
    if(action.type==='check'){
      if(record.nodes.reduce((sum,n)=>sum+n.attempts.length,0)>=ELECTRON_SANDBOX_LIMITS.maxAttempts)fail(`已達全樹 ${ELECTRON_SANDBOX_LIMITS.maxAttempts} 次檢查上限；請先匯出保存，不能覆蓋既有紀錄。`,'sandbox-attempt-limit');
      node.attempts.push({arrows:node.draft.map(arrow=>[...arrow]),at});
    }else if(result.ok){
      if(record.nodes.length>=ELECTRON_SANDBOX_LIMITS.maxNodes)fail(`已達 ${ELECTRON_SANDBOX_LIMITS.maxNodes} 個節點上限；請先匯出保存，不能移除既有分支。`,'sandbox-node-limit');
      const nextId='n'+record.nodes.length;
      record.nodes.push({id:nextId,parentId:node.id,arrows:node.draft.map(arrow=>[...arrow]),at,note:'',draft:[],attempts:[]});
      record.currentNodeId=nextId;
    }
  }else fail('不支援這個自主推導操作。');
  // Also verifies generated records and enforces byte limits after edits.
  const updated=replayElectronSandboxRecord(record,id,preparedMechanism);
  return result?{...updated,result}:updated;
}
