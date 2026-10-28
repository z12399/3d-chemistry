/** Source-bound discrete teaching states; no infection probability or experimental schedule. */
export const PHAGE_LAB_ID='phage-evidence';
export const PHAGE_EXAMPLE_IDS=Object.freeze(['t4','lambda']);
export const GENOME_LABELS=Object.freeze({'parent-capsid':'入侵粒子的衣殼內','host-interior':'宿主內、未整合且未包裝',prophage:'與宿主染色體整合','new-capsids':'新粒子的衣殼內'});
export const PROGENY_LABELS=Object.freeze({absent:'圖中尚無成熟子代',inside:'成熟子代仍在宿主內',released:'成熟子代已釋放'});
export const OBSERVATION_SCOPE_IDS=Object.freeze(['nucleic-acid','cell-surface','host-interior','host-chromosome','inheritance','particle','infectivity','input-control']);
const STRUCTURES=Object.freeze({
  t4:Object.freeze(['capsid','genome','tail-tube','tail-sheath','baseplate','long-tail-fibers','short-tail-fibers']),
  lambda:Object.freeze(['capsid','genome','tail-tube','tail-tip']),
});
const STAGE_IDS=Object.freeze(['attachment','entry','biosynthesis','assembly','release','integration','inheritance','induction']);
const PATHS=Object.freeze({
  't4-lytic':Object.freeze({exampleId:'t4',stageIds:Object.freeze(['attachment','entry','biosynthesis','assembly','release'])}),
  'lambda-lytic':Object.freeze({exampleId:'lambda',stageIds:Object.freeze(['attachment','entry','biosynthesis','assembly','release'])}),
  'lambda-lysogenic':Object.freeze({exampleId:'lambda',stageIds:Object.freeze(['attachment','entry','integration','inheritance'])}),
  'lambda-induced':Object.freeze({exampleId:'lambda',stageIds:Object.freeze(['induction','biosynthesis','assembly','release'])}),
});
const EXPECTED=Object.freeze({
  attachment:Object.freeze({genome:'parent-capsid',progeny:'absent',host:'intact'}),
  entry:Object.freeze({genome:'host-interior',progeny:'absent',host:'intact'}),
  biosynthesis:Object.freeze({genome:'host-interior',progeny:'absent',host:'intact'}),
  assembly:Object.freeze({genome:'new-capsids',progeny:'inside',host:'intact'}),
  release:Object.freeze({genome:'new-capsids',progeny:'released',host:'lysed'}),
  integration:Object.freeze({genome:'prophage',progeny:'absent',host:'intact'}),
  inheritance:Object.freeze({genome:'prophage',progeny:'absent',host:'dividing'}),
  induction:Object.freeze({genome:'host-interior',progeny:'absent',host:'intact'}),
});
const CASE_IDS=Object.freeze(['dna-versus-infectivity','adsorption-versus-production','lysogen-evidence','progeny-origin']);
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const text=value=>typeof value==='string'&&value.trim().length>0;
const same=(left,right)=>Array.isArray(left)&&left.length===right.length&&left.every((value,index)=>value===right[index]);
const requireValue=(condition,message)=>{if(!condition)throw new TypeError('Invalid phage evidence dataset: '+message);};
const clone=value=>structuredClone(value);
const validatedSnapshots=new WeakSet();
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function exactKeys(value,keys,name){requireValue(record(value)&&Object.keys(value).length===keys.length&&keys.every(key=>own(value,key)),name+' exact fields');}
function strings(value,name,{empty=false}={}){requireValue(Array.isArray(value)&&(empty||value.length>0)&&value.every(text)&&new Set(value).size===value.length,name);}
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
  const array=Array.isArray(value),prototype=Object.getPrototypeOf(value);
  requireValue(array?prototype===Array.prototype:prototype===Object.prototype||prototype===null,'plain JSON objects only');
  const keys=Reflect.ownKeys(value),descriptors=Object.getOwnPropertyDescriptors(value);
  requireValue(keys.every(key=>typeof key==='string'),'symbol property');
  if(array)requireValue(keys.length===value.length+1&&keys.includes('length')&&Array.from({length:value.length},(_,i)=>String(i)).every(key=>own(value,key)),'dense JSON arrays only');
  seen.add(value);
  for(const key of keys){
    if(array&&key==='length')continue;
    const property=descriptors[key];
    requireValue(!['__proto__','prototype','constructor'].includes(key)&&property.enumerable&&own(property,'value'),'unsafe or accessor property');
    jsonOnly(property.value,seen);
  }
  seen.delete(value);
}
function sourceUrl(value){
  if(!text(value))return false;
  try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}
}
function relativePath(value){return text(value)&&!/[\\:<>"|?*\u0000-\u001f\u007f]/.test(value)&&!value.startsWith('/')&&value.split('/').every(part=>part!==''&&part!=='.'&&part!=='..');}
function hash(value){return typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);}
function references(item,name,sources,claims){
  strings(item.claimIds,name+' claim IDs');strings(item.sourceIds,name+' source IDs');
  for(const id of item.claimIds)requireValue(claims.has(id),name+' unknown claim '+id);
  for(const id of item.sourceIds)requireValue(sources.has(id),name+' unknown source '+id);
  const expected=new Set(item.claimIds.flatMap(id=>claims.get(id).sourceIds));
  requireValue(expected.size===item.sourceIds.length&&item.sourceIds.every(id=>expected.has(id)),name+' source IDs must match referenced claims');
}

/** Validate the closed teaching topology and evidence projections, then return a frozen clone. */
export function validatePhageDataset(raw){
  if(record(raw)&&validatedSnapshots.has(raw))return raw;
  jsonOnly(raw);
  exactKeys(raw,['schemaVersion','version','examples','paths','cycleStages','evidenceCases','sources','claims','limits'],'dataset');
  requireValue(raw.schemaVersion===1&&raw.version===1,'schema/version');
  const data=clone(raw),sources=index(data.sources,'sources'),claims=index(data.claims,'claims');
  for(const source of sources.values()){
    for(const field of ['title','publisher','locator'])requireValue(text(source[field]),'source '+field);
    requireValue(sourceUrl(source.url),'source HTTPS URL');
    requireValue(relativePath(source.localPath)&&hash(source.sha256),'source local evidence path/hash');
    for(const field of ['files','additionalEvidence','supportingFiles'])if(own(source,field)){
      requireValue(Array.isArray(source[field])&&source[field].length>0,'source supporting file array');
      const paths=new Set();
      for(const file of source[field]){
        requireValue(record(file)&&relativePath(file.path)&&hash(file.sha256)&&!paths.has(file.path),'source supporting evidence path/hash');paths.add(file.path);
      }
    }
  }
  for(const claim of claims.values()){
    requireValue(text(claim.claim),'claim text');strings(claim.sourceIds,'claim source IDs');
    for(const id of claim.sourceIds)requireValue(sources.has(id),'claim unknown source '+id);
    requireValue(Array.isArray(claim.evidence)&&claim.evidence.length>0,'claim evidence');
    for(const evidence of claim.evidence){
      requireValue(record(evidence)&&claim.sourceIds.includes(evidence.sourceId)&&text(evidence.locator),'claim evidence source/locator');
      const source=sources.get(evidence.sourceId);
      for(const field of ['url','localPath','sha256'])if(own(evidence,field))requireValue(evidence[field]===source[field],'claim evidence '+field+' must match source');
    }
    requireValue(claim.sourceIds.every(id=>claim.evidence.some(item=>item.sourceId===id)),'each claim source needs a locator');
  }
  requireValue(Array.isArray(data.examples)&&same(data.examples.map(item=>item?.id),PHAGE_EXAMPLE_IDS),'fixed example identities/order');
  for(const example of data.examples){
    exactKeys(example,['id','label','shortLabel','scope','summary','diagramKind','structures'],'example');
    for(const field of ['label','shortLabel','scope','summary'])requireValue(text(example[field]),'example '+field);
    requireValue(example.diagramKind===example.id,'example diagram kind');
    requireValue(Array.isArray(example.structures)&&same(example.structures.map(item=>item?.id),STRUCTURES[example.id]),'example-specific structure identities/order');
    for(const structure of example.structures){
      exactKeys(structure,['id','label','shortLabel','description','claimIds','sourceIds'],'structure');
      for(const field of ['label','shortLabel','description'])requireValue(text(structure[field]),'structure '+field);
      references(structure,example.id+'/'+structure.id,sources,claims);
    }
  }
  requireValue(Array.isArray(data.paths)&&same(data.paths.map(item=>item?.id),Object.keys(PATHS)),'fixed path identities/order');
  for(const path of data.paths){
    exactKeys(path,['id','exampleId','label','scope','stageIds'],'path');
    requireValue(text(path.label)&&text(path.scope),'path label/scope');
    requireValue(path.exampleId===PATHS[path.id].exampleId&&same(path.stageIds,PATHS[path.id].stageIds),'fixed example/path stage sequence');
  }
  requireValue(Array.isArray(data.cycleStages)&&same(data.cycleStages.map(item=>item?.id),STAGE_IDS),'fixed cycle stage identities/order');
  for(const stage of data.cycleStages){
    exactKeys(stage,['id','label','prompt','explanation','limits','diagramState','answers','claimIds','sourceIds'],'cycle stage');
    for(const field of ['label','prompt','explanation','limits'])requireValue(text(stage[field]),'cycle stage '+field);
    exactKeys(stage.diagramState,['host'],'diagram state');exactKeys(stage.answers,['genome','progeny'],'cycle answer');
    requireValue(stage.diagramState.host===EXPECTED[stage.id].host&&stage.answers.genome===EXPECTED[stage.id].genome&&stage.answers.progeny===EXPECTED[stage.id].progeny,'source-bound conceptual stage state');
    references(stage,'stage '+stage.id,sources,claims);
  }
  requireValue(Array.isArray(data.evidenceCases)&&same(data.evidenceCases.map(item=>item?.id),CASE_IDS),'fixed evidence case identities/order');
  for(const item of data.evidenceCases){
    exactKeys(item,['id','title','prompt','kind','cards','levels'],'evidence case');
    requireValue(text(item.title)&&text(item.prompt)&&item.kind==='authored-hypothetical','authored hypothetical case');
    const cards=index(item.cards,'evidence cards'),levels=index(item.levels,'evidence levels');
    requireValue(cards.size===3&&levels.size===3,'three evidence cards and three levels');
    for(const card of cards.values()){
      exactKeys(card,['id','label','text','observationScope','observationLabel','claimIds','sourceIds'],'evidence card');
      requireValue(text(card.label)&&text(card.text)&&text(card.observationLabel),'evidence card label/text');
      requireValue(OBSERVATION_SCOPE_IDS.includes(card.observationScope),'evidence card observation scope');
      references(card,'card '+card.id,sources,claims);
    }
    for(const [number,level]of item.levels.entries()){
      exactKeys(level,['id','label','cardIds','prompt','choices','answerId','explanation','limits','claimIds','sourceIds'],'evidence level');
      for(const field of ['label','prompt','explanation','limits'])requireValue(text(level[field]),'evidence level '+field);
      requireValue(same(level.cardIds,item.cards.slice(0,number+1).map(card=>card.id)),'evidence levels must accumulate the ordered card prefix');
      const choices=index(level.choices,'evidence choices');requireValue(choices.size===3,'three evidence choices');
      for(const choice of choices.values()){exactKeys(choice,['id','label'],'evidence choice');requireValue(text(choice.label),'choice label');}
      requireValue(choices.has(level.answerId),'evidence answer ID');references(level,'level '+level.id,sources,claims);
    }
  }
  strings(data.limits,'dataset limits');freeze(data);validatedSnapshots.add(data);return data;
}
function find(items,id,name){if(typeof id!=='string')throw new TypeError(name+' ID must be a string');const item=items.find(value=>value.id===id);if(!item)throw new RangeError('Unknown '+name+': '+id);return item;}
function result(value){return freeze(clone(value));}
export function getPhageExample(data,id){return result(find(validatePhageDataset(data).examples,id,'phage example'));}
export function getPhageStructure(data,example,id){return result(find(getPhageExample(data,example).structures,id,'phage structure'));}
export function getPhagePath(data,id){return result(find(validatePhageDataset(data).paths,id,'phage path'));}
export function getCycleStage(data,pathId,stageId){
  const checked=validatePhageDataset(data),path=find(checked.paths,pathId,'phage path');
  const stage=find(checked.cycleStages,stageId,'cycle stage');
  if(!path.stageIds.includes(stageId))throw new RangeError('Cycle stage '+stageId+' is not in path '+pathId);
  return result(stage);
}
export function getEvidenceCase(data,id){return result(find(validatePhageDataset(data).evidenceCases,id,'evidence case'));}
export function getEvidenceLevel(data,caseId,levelId){return result(find(getEvidenceCase(data,caseId).levels,levelId,'evidence level'));}

/** Score exactly two labels for the selected diagram stage, never an infection outcome. */
export function assessCyclePrediction(data,pathId,stageId,answers){
  const path=getPhagePath(data,pathId),stage=getCycleStage(data,pathId,stageId);
  jsonOnly(answers);exactKeys(answers,['genome','progeny'],'exactly two cycle predictions');
  if(typeof answers.genome!=='string'||!own(GENOME_LABELS,answers.genome))throw new RangeError('Unknown genome prediction: '+String(answers.genome));
  if(typeof answers.progeny!=='string'||!own(PROGENY_LABELS,answers.progeny))throw new RangeError('Unknown progeny prediction: '+String(answers.progeny));
  const results={};let correctCount=0;
  for(const axis of ['genome','progeny']){
    const correct=answers[axis]===stage.answers[axis];if(correct)correctCount++;
    results[axis]={answerId:answers[axis],expectedId:stage.answers[axis],correct,label:(axis==='genome'?GENOME_LABELS:PROGENY_LABELS)[stage.answers[axis]]};
  }
  return result({pathId,exampleId:path.exampleId,stageId,total:2,correctCount,allCorrect:correctCount===2,results,explanation:stage.explanation,limits:stage.limits,claimIds:stage.claimIds,sourceIds:stage.sourceIds});
}
export function assessHostEvidence(data,caseId,levelId,choice){
  const level=getEvidenceLevel(data,caseId,levelId);find(level.choices,choice,'evidence choice');
  return result({caseId,levelId,choiceId:choice,answerId:level.answerId,correct:choice===level.answerId,cardIds:level.cardIds,explanation:level.explanation,limits:level.limits,claimIds:level.claimIds,sourceIds:level.sourceIds});
}
