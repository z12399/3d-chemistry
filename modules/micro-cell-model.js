/** Source-bound conceptual evidence model. No microscopy, growth or resistance prediction. */
export const MICRO_CELL_LAB_ID='micro-cell-evidence';
export const CELL_STATE_IDS=Object.freeze(['bacillus-vegetative','bacillus-endospore','salmonella-vegetative']);
export const GRAM_STAGE_IDS=Object.freeze(['unstained','crystal-violet','iodine','decolorization','counterstain']);
export const CELL_SIGNAL_LABELS=Object.freeze({uninterpreted:'尚未染色',purple:'紫色主訊號','no-visible-color':'紫訊號已移除','pink-red':'粉紅至紅色','not-inferred':'本模型不推定'});
const VEGETATIVE_IDS=Object.freeze(['bacillus-vegetative','salmonella-vegetative']);
const SIGNAL_IDS=Object.freeze(Object.keys(CELL_SIGNAL_LABELS));
const LAYERS=Object.freeze({
  'bacillus-vegetative':Object.freeze(['peptidoglycan','cytoplasmic-membrane','cytoplasm']),
  'bacillus-endospore':Object.freeze(['coat','outer-spore-membrane','cortex','germ-cell-wall','inner-membrane','core']),
  'salmonella-vegetative':Object.freeze(['outer-membrane-lps','periplasm-peptidoglycan','inner-membrane','cytoplasm']),
});
const KINDS=Object.freeze({'bacillus-vegetative':'gram-positive','bacillus-endospore':'spore','salmonella-vegetative':'gram-negative'});
const EXPECTED_SIGNALS=Object.freeze({
  unstained:Object.freeze(['uninterpreted','uninterpreted']),
  'crystal-violet':Object.freeze(['purple','purple']),
  iodine:Object.freeze(['purple','purple']),
  decolorization:Object.freeze(['purple','no-visible-color']),
  counterstain:Object.freeze(['purple','pink-red']),
});
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const fail=message=>{throw new TypeError('Invalid cell evidence dataset: '+message);};
const requireValue=(condition,message)=>{if(!condition)fail(message);};
const text=value=>typeof value==='string'&&value.trim().length>0;
const same=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((value,index)=>value===b[index]);
const clone=value=>structuredClone(value);
// Only this module can brand a fully checked, recursively frozen snapshot.
// Mutable callers and externally frozen objects never enter this cache.
const validatedSnapshots=new WeakSet();
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function strings(value,name,{empty=false}={}){
  requireValue(Array.isArray(value)&&(empty||value.length>0)&&value.every(text)&&new Set(value).size===value.length,name);
}
function index(items,name){
  requireValue(Array.isArray(items)&&items.length>0,name);
  const map=new Map();
  for(const item of items){requireValue(record(item)&&text(item.id)&&/^[a-z][a-z0-9-]*$/.test(item.id)&&!map.has(item.id),name+' unique IDs');map.set(item.id,item);}
  return map;
}
function jsonOnly(value,seen=new Set()){
  if(value===null||typeof value==='string'||typeof value==='boolean')return;
  if(typeof value==='number'){requireValue(Number.isFinite(value),'non-finite number');return;}
  requireValue(typeof value==='object'&&!seen.has(value),'non-JSON or cyclic value');
  requireValue(Array.isArray(value)||Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null,'plain JSON objects only');
  seen.add(value);
  for(const [key,item]of Object.entries(value)){requireValue(!['__proto__','prototype','constructor'].includes(key),'unsafe property');jsonOnly(item,seen);}
  seen.delete(value);
}
function sourceUrl(value){
  if(!text(value))return false;
  try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}
}
function relativePath(value){return text(value)&&!value.includes('\\')&&!value.startsWith('/')&&!value.includes(':')&&value.split('/').every(part=>part!==''&&part!=='.'&&part!=='..');}
function hash(value){return typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);}
function references(item,name,sources,claims){
  strings(item.claimIds,name+' claim IDs');strings(item.sourceIds,name+' source IDs');
  for(const id of item.claimIds)requireValue(claims.has(id),name+' unknown claim '+id);
  for(const id of item.sourceIds)requireValue(sources.has(id),name+' unknown source '+id);
  const required=new Set(item.claimIds.flatMap(id=>claims.get(id).sourceIds));
  requireValue(required.size===item.sourceIds.length&&item.sourceIds.every(id=>required.has(id)),name+' source IDs must match the referenced claims');
}

/** Return an independent frozen JSON dataset after validating identity, topology and source links. */
export function validateCellEvidenceDataset(raw){
  if(record(raw)&&validatedSnapshots.has(raw))return raw;
  requireValue(record(raw)&&raw.schemaVersion===1&&text(raw.version),'schema/version');jsonOnly(raw);
  const data=clone(raw),sources=index(data.sources,'sources'),claims=index(data.claims,'claims');
  for(const source of sources.values()){
    for(const field of ['title','publisher','locator'])requireValue(text(source[field]),'source '+field);
    requireValue(sourceUrl(source.url),'source HTTPS URL');
    requireValue(relativePath(source.localPath)&&hash(source.sha256),'source local evidence path/hash');
    for(const field of ['files','additionalEvidence','supportingFiles'])if(own(source,field)){
      requireValue(Array.isArray(source[field])&&source[field].length>0,'source supporting file array');
      for(const file of source[field])requireValue(record(file)&&relativePath(file.path)&&hash(file.sha256),'source supporting evidence path/hash');
    }
  }
  for(const claim of claims.values()){
    requireValue(text(claim.claim),'claim text');strings(claim.sourceIds,'claim source IDs');
    for(const id of claim.sourceIds)requireValue(sources.has(id),'claim unknown source '+id);
    requireValue(Array.isArray(claim.evidence)&&claim.evidence.length>0,'claim evidence');
    for(const evidence of claim.evidence){
      requireValue(record(evidence)&&claim.sourceIds.includes(evidence.sourceId)&&text(evidence.locator),'claim evidence source/locator');
      const source=sources.get(evidence.sourceId);
      for(const field of ['url','localPath','sha256'])if(own(evidence,field))requireValue(evidence[field]===source[field],'claim evidence '+field+' must match its source');
    }
    requireValue(claim.sourceIds.every(id=>claim.evidence.some(e=>e.sourceId===id)),'each claim source needs a locator');
  }
  requireValue(Array.isArray(data.states)&&same(data.states.map(state=>state?.id),CELL_STATE_IDS),'fixed state identities/order');
  for(const state of data.states){
    for(const field of ['label','shortLabel','scope','summary','divisionStatus'])requireValue(text(state[field]),'state '+field);
    requireValue(state.diagramKind===KINDS[state.id],'state diagram kind');
    if(own(state,'claimIds')||own(state,'sourceIds'))references(state,'state '+state.id,sources,claims);
    requireValue(Array.isArray(state.layers)&&same(state.layers.map(layer=>layer?.id),LAYERS[state.id]),'outside-to-inside layer identity/order');
    for(const layer of state.layers){
      for(const field of ['label','shortLabel','description'])requireValue(text(layer[field]),'layer '+field);
      references(layer,state.id+'/'+layer.id,sources,claims);
    }
  }
  requireValue(Array.isArray(data.gramStages)&&same(data.gramStages.map(stage=>stage?.id),GRAM_STAGE_IDS),'fixed Gram stage identities/order');
  for(const stage of data.gramStages){
    for(const field of ['label','concept'])requireValue(text(stage[field]),'Gram stage '+field);
    strings(stage.sourceIds,'Gram stage source IDs');for(const id of stage.sourceIds)requireValue(sources.has(id),'Gram stage unknown source');
    requireValue(record(stage.results)&&Object.keys(stage.results).length===3&&CELL_STATE_IDS.every(id=>own(stage.results,id)),'Gram results for all three states');
    const stageSourceIds=new Set();
    for(const id of CELL_STATE_IDS){
      const result=stage.results[id];requireValue(record(result),'Gram result');
      for(const field of ['label','reason','limits'])requireValue(text(result[field]),'Gram result '+field);
      const expected=id==='bacillus-endospore'?'not-inferred':EXPECTED_SIGNALS[stage.id][VEGETATIVE_IDS.indexOf(id)];
      requireValue(SIGNAL_IDS.includes(result.signalId)&&result.signalId===expected,'source-bound Gram result signal');
      references(result,stage.id+'/'+id,sources,claims);result.sourceIds.forEach(source=>stageSourceIds.add(source));
    }
    requireValue(stageSourceIds.size===stage.sourceIds.length&&stage.sourceIds.every(id=>stageSourceIds.has(id)),'Gram stage source union');
  }
  const tasks=index(data.evidenceTasks,'evidence tasks');
  for(const task of tasks.values()){
    for(const field of ['title','prompt','explanation','limits'])requireValue(text(task[field]),'task '+field);
    const choices=index(task.choices,'task choices');requireValue(choices.size>=2&&choices.size<=5,'two to five task choices');
    for(const choice of choices.values())requireValue(text(choice.label),'choice label');
    requireValue(choices.has(task.answerId),'task answer ID');references(task,'task '+task.id,sources,claims);
  }
  strings(data.limits,'dataset limits');
  freeze(data);validatedSnapshots.add(data);return data;
}
function find(items,id,name){if(typeof id!=='string')throw new TypeError(name+' ID must be a string');const value=items.find(item=>item.id===id);if(!value)throw new RangeError('Unknown '+name+': '+id);return value;}
function result(value){return freeze(clone(value));}
export function getCellState(data,id){return result(find(validateCellEvidenceDataset(data).states,id,'cell state'));}
export function getCellLayer(data,stateId,layerId){return result(find(getCellState(data,stateId).layers,layerId,'cell layer'));}
export function getGramStage(data,id){return result(find(validateCellEvidenceDataset(data).gramStages,id,'Gram stage'));}
export function getEvidenceTask(data,id){return result(find(validateCellEvidenceDataset(data).evidenceTasks,id,'evidence task'));}

/** Grade only the two specified vegetative-cell predictions; an endospore is not extrapolated. */
export function assessGramPrediction(data,stageId,answers){
  const stage=getGramStage(data,stageId);
  if(!record(answers)||Object.keys(answers).length!==2||!VEGETATIVE_IDS.every(id=>own(answers,id)))throw new TypeError('Exactly two vegetative-cell predictions are required');
  const results={};let correctCount=0;
  for(const id of VEGETATIVE_IDS){
    if(!SIGNAL_IDS.includes(answers[id]))throw new RangeError('Unknown cell signal: '+String(answers[id]));
    const expected=stage.results[id],correct=answers[id]===expected.signalId;if(correct)correctCount++;
    results[id]={answerSignalId:answers[id],expectedSignalId:expected.signalId,correct,label:expected.label,reason:expected.reason,limits:expected.limits,claimIds:expected.claimIds,sourceIds:expected.sourceIds};
  }
  return result({stageId,total:2,correctCount,allCorrect:correctCount===2,results});
}
export function assessEvidenceChoice(data,taskId,choice){
  const task=getEvidenceTask(data,taskId);find(task.choices,choice,'evidence choice');
  return result({taskId,choiceId:choice,answerId:task.answerId,correct:choice===task.answerId,explanation:task.explanation,limits:task.limits,claimIds:task.claimIds,sourceIds:task.sourceIds});
}
