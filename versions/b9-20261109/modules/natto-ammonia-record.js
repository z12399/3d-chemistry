import {getVerifiedNattoAmmoniaData} from './natto-ammonia-source.js';
import {NATTO_AMMONIA_ACTIVITY_ID,NATTO_COMPARISON_IDS,normalizeNattoAmmoniaInput,getNattoComparison,getNattoEvidence} from './natto-ammonia-model.js';

export const NATTO_SESSION_SCHEMA='natto-ammonia-session/v1';
export const NATTO_SESSION_LIMITS=Object.freeze({bytes:2097152,rounds:100,text:10000,provenance:100000});
const FIRST=['hypothesis','ammoniaPrediction','ureaPrediction','discriminatorReason'];
const WRITING=['discriminatorReason','observation','revision','nextEvidence'];
const WORKING=[...FIRST,'observation','revision','nextEvidence'];
const KINDS=['result-displayed','source-activation','source-contextmenu','fulltext-displayed','history-result-displayed'];
const ENDPOINTS=['headspace-ammonia-release','food-urea-stock'];
const copy=value=>JSON.parse(JSON.stringify(value));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const bytes=value=>new TextEncoder().encode(value).byteLength;
const json=value=>JSON.stringify(value,null,2)+'\n';
const fail=message=>{throw new Error(message);};
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
function exact(value,keys,label){if(!plain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key))||Object.keys(value).some(key=>!keys.includes(key)))fail(`${label} 欄位不完整或含未知欄位。`);}
function text(value,label,max=NATTO_SESSION_LIMITS.text){if(typeof value!=='string'||value.length>max)fail(`${label} 必須是最多 ${max} 字元的文字；沒有截短內容。`);}
function id(value,label){if(typeof value!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value))fail(`${label} ID 無效。`);}
function array(value,label){if(!Array.isArray(value))fail(`${label} 必須是陣列。`);}
function unique(values,label){if(new Set(values).size!==values.length)fail(`${label} 有重複引用。`);}
function sourceContext(handle){
 const catalogue=getVerifiedNattoAmmoniaData(handle);if(!catalogue)fail('來源尚未通過核對。');
 const comparisons=new Map(),evidence=new Map();
 for(const comparisonId of NATTO_COMPARISON_IDS){
  const item=getNattoComparison(handle,comparisonId);if(!item.ok)fail('來源比較無法解析。');comparisons.set(comparisonId,item.comparison);
  for(const endpoint of ENDPOINTS){const result=getNattoEvidence(handle,comparisonId,endpoint);if(!result.ok)fail('來源證據無法解析。');for(const record of result.evidence.records)evidence.set(record.id,{...record,comparisonId,endpointKind:endpoint});}
 }
 return {catalogue,comparisons,evidence,sources:new Map(catalogue.sources.map(item=>[item.id,item]))};
}
function normalize(working,comparisonId,handle){
 const result=normalizeNattoAmmoniaInput({comparisonId,hypothesis:working.hypothesis,ammoniaPrediction:working.ammoniaPrediction,ureaPrediction:working.ureaPrediction},handle);
 if(!result.ok)fail(result.issues.map(issue=>issue.message).join(' '));
}
function working(value,comparisonId,handle,label){exact(value,WORKING,label);normalize(value,comparisonId,handle);for(const key of WRITING)text(value[key],`${label}/${key}`);}
const firstOf=value=>Object.fromEntries(FIRST.map(key=>[key,value[key]]));
const answered=value=>FIRST.some(key=>key==='discriminatorReason'?value[key].trim()!=='':value[key]!=='unselected');
const emptyExposure=()=>({displayedHere:[],sourceActivations:[],sourceContextMenus:[],importedClaims:[]});
function refValid(ref,context,type=null){
 if(typeof ref!=='string')return false;
 if(ref.startsWith('evidence:'))return type!=='source'&&context.evidence.has(ref.slice(9));
 if(ref.startsWith('source:'))return type!=='evidence'&&context.sources.has(ref.slice(7));
 return false;
}
function refs(value,context,label,type=null){array(value,label);unique(value,label);if(value.some(ref=>!refValid(ref,context,type)))fail(`${label} 有未知或不適用引用。`);}
function exposure(value,context,label){exact(value,Object.keys(emptyExposure()),label);for(const key of Object.keys(value))refs(value[key],context,label,key==='displayedHere'?'evidence':key==='importedClaims'?null:'source');}
function selection(session){const set=session.recordSets.find(item=>item.setId===session.activeSelection.setId),round=set?.rounds.find(item=>item.roundId===session.activeSelection.roundId);if(!round)fail('目前輪次不存在。');return {set,round,revision:session.activeSelection.revisionId===null?null:round.revisions.find(item=>item.revisionId===session.activeSelection.revisionId)};}
const rounds=session=>session.recordSets.flatMap(set=>set.rounds);
function budget(session){if(rounds(session).length>NATTO_SESSION_LIMITS.rounds)fail('工作階段超過 100 輪；原工作保留。');if(bytes(json(session))>NATTO_SESSION_LIMITS.bytes)fail('工作階段超過 2 MiB；原工作保留。');return session;}
function blankWorking(){return {hypothesis:'unselected',ammoniaPrediction:'unselected',ureaPrediction:'unselected',discriminatorReason:'',observation:'',revision:'',nextEvidence:''};}
function newRound(roundId,comparisonId){return {roundId,comparisonId,working:blankWorking(),initial:null,revisions:[],events:[],revealedEvidenceRefs:[]};}
const provenance=(setId)=>({kind:'local',fileName:'',originalSetId:setId,priorProvenanceRaw:'',importedEventHorizon:{},importedSnapshotHorizon:{}});
const nextId=(values,prefix)=>{let n=1;while(values.includes(`${prefix}${n}`))n++;return `${prefix}${n}`;};

export function createNattoSession(handle){
 const {catalogue}=sourceContext(handle),setId='set1',roundId='round1';
 return validateNattoSession({schema:NATTO_SESSION_SCHEMA,activityId:NATTO_AMMONIA_ACTIVITY_ID,sourceIdentity:copy(catalogue.sourceIdentity),recordSets:[{setId,provenance:provenance(setId),rounds:[newRound(roundId,NATTO_COMPARISON_IDS[0])]}],activeSelection:{setId,roundId,revisionId:null}},handle);
}

/** Validation is all-or-nothing and includes every historical round. */
export function validateNattoSession(raw,handle){
 const context=sourceContext(handle),rawText=typeof raw==='string'?raw:json(raw);if(bytes(rawText)>NATTO_SESSION_LIMITS.bytes)fail('工作階段超過 2 MiB。');
 let value;try{value=typeof raw==='string'?JSON.parse(raw):raw;}catch{fail('工作階段不是有效 JSON。');}
 exact(value,['schema','activityId','sourceIdentity','recordSets','activeSelection'],'工作階段');
 if(value.schema!==NATTO_SESSION_SCHEMA||value.activityId!==NATTO_AMMONIA_ACTIVITY_ID)fail('不支援工作階段版本或活動。');
 exact(value.sourceIdentity,['datasetId','version','sha256'],'來源識別');
 if(['datasetId','version','sha256'].some(key=>value.sourceIdentity[key]!==context.catalogue.sourceIdentity[key]))fail('來源識別與目前已核對的資料不同。');
 array(value.recordSets,'紀錄組');if(!value.recordSets.length||value.recordSets.length>NATTO_SESSION_LIMITS.rounds)fail('紀錄組數量無效。');
 unique(value.recordSets.map(set=>set?.setId),'紀錄組');let roundCount=0;
 for(const set of value.recordSets){
  exact(set,['setId','provenance','rounds'],'紀錄組');id(set.setId,'紀錄組');
  const origin=set.provenance;exact(origin,['kind','fileName','originalSetId','priorProvenanceRaw','importedEventHorizon','importedSnapshotHorizon'],'紀錄來源');
  if(!['local','imported'].includes(origin.kind))fail('未知紀錄來源。');text(origin.fileName,'原檔名',500);id(origin.originalSetId,'原紀錄組');text(origin.priorProvenanceRaw,'先前來源',NATTO_SESSION_LIMITS.provenance);
  if(!plain(origin.importedEventHorizon)||!plain(origin.importedSnapshotHorizon))fail('匯入事件或版本邊界無效。');
  if(origin.kind==='local'&&(origin.fileName!==''||origin.priorProvenanceRaw!==''||origin.originalSetId!==set.setId||Object.keys(origin.importedEventHorizon).length||Object.keys(origin.importedSnapshotHorizon).length))fail('本頁紀錄來源不一致。');
  if(origin.kind==='imported'){let prior;try{prior=JSON.parse(origin.priorProvenanceRaw);}catch{fail('先前來源不是有效 JSON。');}if(!plain(prior))fail('先前來源不是物件。');}
  array(set.rounds,'輪次');if(!set.rounds.length)fail('紀錄組沒有輪次。');roundCount+=set.rounds.length;if(roundCount>NATTO_SESSION_LIMITS.rounds)fail('工作階段超過 100 輪。');unique(set.rounds.map(round=>round?.roundId),'輪次');
  for(const round of set.rounds){
   exact(round,['roundId','comparisonId','working','initial','revisions','events','revealedEvidenceRefs'],'輪次');id(round.roundId,'輪次');if(!context.comparisons.has(round.comparisonId))fail('未知比較。');working(round.working,round.comparisonId,handle,'目前工作稿');
   if(round.initial!==null){
    exact(round.initial,['choicesAndReason','trigger','answered','exposureBefore'],'初判');exact(round.initial.choicesAndReason,FIRST,'初判內容');
    normalize(round.initial.choicesAndReason,round.comparisonId,handle);text(round.initial.choicesAndReason.discriminatorReason,'初判理由');text(round.initial.trigger,'初判觸發',500);
    if(!round.initial.trigger||typeof round.initial.answered!=='boolean'||round.initial.answered!==answered(round.initial.choicesAndReason))fail('初判作答狀態不一致。');
    if(!same(firstOf(round.working),round.initial.choicesAndReason))fail('目前初判與固定版本不同。');exposure(round.initial.exposureBefore,context,'初判先見');
   }
   array(round.revisions,'修訂');unique(round.revisions.map(revision=>revision?.revisionId),'修訂');
   if(round.revisions.length&&!round.initial)fail('修訂缺少固定初判。');
   for(const revision of round.revisions){
    exact(revision,['revisionId','workingSnapshot','evidenceRefs','exposureAtCapture'],'修訂');id(revision.revisionId,'修訂');working(revision.workingSnapshot,round.comparisonId,handle,'修訂文字');
    if(!same(firstOf(revision.workingSnapshot),round.initial.choicesAndReason))fail('修訂改寫了原初判。');
    refs(revision.evidenceRefs,context,'修訂證據','evidence');if(revision.evidenceRefs.some(ref=>context.evidence.get(ref.slice(9)).comparisonId!==round.comparisonId))fail('修訂證據屬於另一比較。');exposure(revision.exposureAtCapture,context,'修訂先見');
   }
   array(round.events,'事件');const resultRefs=new Set();
   for(const [index,event] of round.events.entries()){
    exact(event,['sequence','kind','refs','detail'],'事件');if(event.sequence!==index+1||!KINDS.includes(event.kind))fail('事件序列或類型無效。');text(event.detail,'事件說明',5000);
    const sourceEvent=event.kind==='source-activation'||event.kind==='source-contextmenu';refs(event.refs,context,'事件引用',sourceEvent?'source':'evidence');
    if(!event.refs.length||sourceEvent&&event.refs.length!==1)fail('事件缺少必要引用。');
    if(event.kind==='result-displayed')for(const ref of event.refs){if(context.evidence.get(ref.slice(9)).comparisonId!==round.comparisonId)fail('結果事件屬於另一比較。');resultRefs.add(ref.slice(9));}
   }
   if(round.events.length&&!round.initial)fail('取證事件缺少固定初判。');
   array(round.revealedEvidenceRefs,'已揭示證據');unique(round.revealedEvidenceRefs,'已揭示證據');
   if(round.revealedEvidenceRefs.some(ref=>typeof ref!=='string'||!context.evidence.has(ref)||context.evidence.get(ref).comparisonId!==round.comparisonId)||!same([...resultRefs].sort(),[...round.revealedEvidenceRefs].sort()))fail('已揭示證據與事件不一致。');
  }
  const horizons=Object.keys(origin.importedEventHorizon);if(origin.kind==='imported'&&(horizons.length!==set.rounds.length||set.rounds.some(round=>!horizons.includes(round.roundId))))fail('匯入事件邊界缺少輪次。');
  for(const [roundId,count] of Object.entries(origin.importedEventHorizon)){const round=set.rounds.find(item=>item.roundId===roundId);if(!round||!Number.isInteger(count)||count<0||count>round.events.length)fail('匯入事件邊界超出輪次。');}
  const snapshotKeys=Object.keys(origin.importedSnapshotHorizon);if(origin.kind==='imported'&&(snapshotKeys.length!==set.rounds.length||set.rounds.some(round=>!snapshotKeys.includes(round.roundId))))fail('匯入版本邊界缺少輪次。');
  for(const [roundId,horizon] of Object.entries(origin.importedSnapshotHorizon)){const round=set.rounds.find(item=>item.roundId===roundId);exact(horizon,['initial','revisions'],'匯入版本邊界');if(!round||typeof horizon.initial!=='boolean'||horizon.initial&&!round.initial||!Number.isInteger(horizon.revisions)||horizon.revisions<0||horizon.revisions>round.revisions.length)fail('匯入版本邊界超出輪次。');}
 }
 exact(value.activeSelection,['setId','roundId','revisionId'],'目前選取');const chosen=selection(value);if(value.activeSelection.revisionId!==null&&!chosen.revision)fail('選取的修訂不存在。');
 return copy(budget(value));
}

function observedOrigin(set,round,event){return set.provenance.kind==='imported'&&event.sequence<=(set.provenance.importedEventHorizon[round.roundId]??0)?'importedClaims':null;}
function importedSnapshot(set,round,revision=null){const horizon=set.provenance.importedSnapshotHorizon[round.roundId];return set.provenance.kind==='imported'&&!!horizon&&(revision?round.revisions.indexOf(revision)<horizon.revisions:horizon.initial);}
function collectedExposure(session){
 const result=emptyExposure(),add=(kind,values)=>{for(const ref of values)if(!result[kind].includes(ref))result[kind].push(ref);};
 for(const set of session.recordSets)for(const round of set.rounds){
  // Earlier imported exposure statements remain claims even if the original events were elsewhere.
  if(importedSnapshot(set,round)&&round.initial)for(const values of Object.values(round.initial.exposureBefore))add('importedClaims',values);
  for(const revision of round.revisions)if(importedSnapshot(set,round,revision))for(const values of Object.values(revision.exposureAtCapture))add('importedClaims',values);
  for(const event of round.events){const kind=observedOrigin(set,round,event)||(event.kind==='source-activation'?'sourceActivations':event.kind==='source-contextmenu'?'sourceContextMenus':'displayedHere');add(kind,event.refs);}
 }
 return result;
}
function freeze(session,round,trigger){if(!round.initial)round.initial={choicesAndReason:firstOf(round.working),trigger,answered:answered(round.working),exposureBefore:collectedExposure(session)};}
function historyGuard(session){if(session.activeSelection.revisionId!==null)fail('歷史版本唯讀；請先回到目前工作稿。');}

export function updateNattoSession(session,action,handle){
 const next=validateNattoSession(session,handle);if(!plain(action)||typeof action.type!=='string')fail('操作無效。');const {set,round}=selection(next);
 switch(action.type){
  case 'working':{
   exact(action,['type','patch'],'文字操作');historyGuard(next);if(!plain(action.patch)||Object.keys(action.patch).some(key=>!WORKING.includes(key)))fail('未知工作稿欄位。');
   if(round.initial&&FIRST.some(key=>Object.hasOwn(action.patch,key)&&action.patch[key]!==round.initial.choicesAndReason[key]))fail('初判已固定；後續想法請寫入修訂。');
   Object.assign(round.working,action.patch);break;
  }
  case 'freeze-initial':exact(action,['type','trigger'],'固定初判操作');text(action.trigger,'觸發',500);if(!action.trigger)fail('缺少觸發說明。');freeze(next,round,action.trigger);break;
  case 'expose':{
   exact(action,['type','kind','refs','detail'],'取證操作');if(!KINDS.includes(action.kind))fail('未知取證操作。');
   freeze(next,round,action.kind==='source-contextmenu'?'開啟來源連結選單前':'顯示或啟動來源前');
   if(!round.events.some(event=>!observedOrigin(set,round,event)&&event.kind===action.kind&&same(event.refs,action.refs)&&event.detail===action.detail)){round.events.push({sequence:round.events.length+1,kind:action.kind,refs:copy(action.refs),detail:action.detail});}
   if(action.kind==='result-displayed')round.revealedEvidenceRefs=[...new Set([...round.revealedEvidenceRefs,...action.refs.map(ref=>ref.slice(9))])];break;
  }
  case 'retain-revision':{
   exact(action,['type'],'保留操作');historyGuard(next);freeze(next,round,'保留目前版本前');
   const content={workingSnapshot:copy(round.working),evidenceRefs:round.revealedEvidenceRefs.map(ref=>`evidence:${ref}`),exposureAtCapture:collectedExposure(next)};
   const last=round.revisions.at(-1);if(!last||!same(Object.fromEntries(Object.keys(content).map(key=>[key,last[key]])),content))round.revisions.push({revisionId:nextId(round.revisions.map(item=>item.revisionId),'revision'),...content});break;
  }
  case 'new-round':{
   exact(action,['type','comparisonId'],'新輪操作');if(!NATTO_COMPARISON_IDS.includes(action.comparisonId))fail('未知比較。');
   let target=next.recordSets.find(item=>item.provenance.kind==='local');if(!target){const setId=nextId(next.recordSets.map(item=>item.setId),'set');target={setId,provenance:provenance(setId),rounds:[]};next.recordSets.push(target);}
   const roundId=nextId(target.rounds.map(item=>item.roundId),'round');target.rounds.push(newRound(roundId,action.comparisonId));next.activeSelection={setId:target.setId,roundId,revisionId:null};break;
  }
  case 'select':exact(action,['type','setId','roundId','revisionId'],'選取操作');next.activeSelection={setId:action.setId,roundId:action.roundId,revisionId:action.revisionId};break;
  default:fail('不支援這個操作。');
 }
 return validateNattoSession(next,handle);
}

export function serializeNattoSession(session,handle){return json(validateNattoSession(session,handle));}
export function mergeNattoSession(base,incomingRaw,handle,{fileName=''}={}){
 const next=validateNattoSession(base,handle),incoming=validateNattoSession(incomingRaw,handle);text(fileName,'檔名',500);
 for(const original of incoming.recordSets){
  const set=copy(original),setId=nextId(next.recordSets.map(item=>item.setId),'set');set.setId=setId;
  set.provenance={kind:'imported',fileName,originalSetId:original.setId,priorProvenanceRaw:JSON.stringify(original.provenance),importedEventHorizon:Object.fromEntries(set.rounds.map(round=>[round.roundId,round.events.length])),importedSnapshotHorizon:Object.fromEntries(set.rounds.map(round=>[round.roundId,{initial:!!round.initial,revisions:round.revisions.length}]))};next.recordSets.push(set);
 }
 return validateNattoSession(next,handle);
}

const LABELS={hypothesis:'初判假說',ammoniaPrediction:'氨是否歸零',ureaPrediction:'尿素預測（9 h，相對 Fig. 4 r22）',discriminatorReason:'鑑別理由',observation:'觀察',revision:'修訂',nextEvidence:'下一步需要的證據'};
function choiceLabel(context,key,value){const choices=context.catalogue.choices[key];return choices?.find(item=>item.id===value||item.value===value)?.label??value;}
function writingText(value,context){return WORKING.map(key=>`${LABELS[key]}：${FIRST.includes(key)&&key!=='discriminatorReason'?choiceLabel(context,key,value[key]):value[key]||'未填'}`).join('\n');}
function exposureText(value,imported=false){const lead=imported?'匯入檔自述（沿用原分類，不視為本機觀測）：原檔「本頁顯示」':'本頁顯示';return `${lead}：${value.displayedHere.join('、')||'無此紀錄'}；${imported?'原檔「來源啟動」':'來源啟動'}：${value.sourceActivations.join('、')||'無'}；${imported?'原檔「來源選單」':'來源選單'}：${value.sourceContextMenus.join('、')||'無'}；${imported?'原檔「匯入自述」':'匯入自述'}：${value.importedClaims.join('、')||'無'}。顯示或啟動不表示閱讀／理解；無紀錄不代表盲測。`;}
function firstText(round,context,imported=false){const initial=round.initial;return initial?`固定初判${imported?'（匯入檔自述）':''}（${initial.trigger}）\n${initial.answered?'已留下初判／理由':'未作答先看，不算首次作答結果'}\n${FIRST.map(key=>`${LABELS[key]}：${key==='discriminatorReason'?initial.choicesAndReason[key]||'未填':choiceLabel(context,key,initial.choicesAndReason[key])}`).join('\n')}\n${exposureText(initial.exposureBefore,imported)}`:'初判尚未固定；目前為草稿。';}
function referenceText(ref,context){if(ref.startsWith('source:')){const item=context.sources.get(ref.slice(7));return `${item.title}\n${item.url}`;}const item=context.evidence.get(ref.slice(9)),loc=item.locator;return `[${item.comparisonId}/${item.id}] ${item.statement}\n${item.measurementDomain}\n${loc.figure}；p${loc.printedPage}／PDF ${loc.pdfPage}；${loc.section}\n${loc.url}\n${(item.limitations||[]).join('；')}`;}
function eventText(set,round,event,context){return `事件 ${event.sequence} ${event.kind}｜${observedOrigin(set,round,event)?'匯入檔自述':'本頁紀錄'}\n${event.detail}\n${event.refs.map(ref=>referenceText(ref,context)).join('\n')}`;}
function roundHeading(set,round,context){return `${set.setId}/${round.roundId}｜${context.comparisons.get(round.comparisonId).label}${set.provenance.kind==='imported'?'｜含匯入檔自述':''}`;}
const boundary='這是已刊比較的假說與證據判讀；沒有新實驗、動態模擬或因果評分。氣相釋氨與食品尿素庫存分開，不能由殘餘氨證明第三途徑。';

export function buildNattoSummary(session,handle,cursor={}){
 const value=validateNattoSession(session,handle),context=sourceContext(handle),next=copy(cursor),parts=[];if(!plain(next))fail('筆記游標無效。');
 for(const set of value.recordSets)for(const round of set.rounds){
  const key=`${set.setId}/${round.roundId}`,prior=next[key]??{initial:false,revisions:0,events:0};exact(prior,['initial','revisions','events'],'筆記游標');
  if(typeof prior.initial!=='boolean'||prior.initial&&!round.initial||!Number.isInteger(prior.revisions)||prior.revisions<0||prior.revisions>round.revisions.length||!Number.isInteger(prior.events)||prior.events<0||prior.events>round.events.length)fail('筆記游標超出保留紀錄。');
  const lines=[];if(round.initial&&!prior.initial)lines.push(firstText(round,context,importedSnapshot(set,round)));
  for(const event of round.events.slice(prior.events))lines.push(eventText(set,round,event,context));
  for(const revision of round.revisions.slice(prior.revisions))lines.push(`保留版本 ${revision.revisionId}${importedSnapshot(set,round,revision)?'（匯入檔自述）':''}\n${writingText(revision.workingSnapshot,context)}\n證據：${revision.evidenceRefs.join('、')||'未揭示'}\n${exposureText(revision.exposureAtCapture,importedSnapshot(set,round,revision))}`);
  if(lines.length){parts.push(`${roundHeading(set,round,context)}\n來源 ${value.sourceIdentity.datasetId}/${value.sourceIdentity.version}/${value.sourceIdentity.sha256}\n${lines.join('\n\n')}`);next[key]={initial:!!round.initial,revisions:round.revisions.length,events:round.events.length};}
 }
 return {text:parts.length?`${boundary}\n\n${parts.join('\n\n')}`:'',cursor:next};
}

export function nattoFullText(session,handle){
 const value=validateNattoSession(session,handle),context=sourceContext(handle),parts=[boundary,`來源識別：${JSON.stringify(value.sourceIdentity)}`];
 for(const set of value.recordSets){parts.push(`紀錄來源 ${set.setId}\n${JSON.stringify(set.provenance)}`);for(const round of set.rounds){parts.push(roundHeading(set,round,context),firstText(round,context,importedSnapshot(set,round)),...round.events.map(event=>eventText(set,round,event,context)),...round.revisions.map(revision=>`版本 ${revision.revisionId}${importedSnapshot(set,round,revision)?'（匯入檔自述）':''}\n${writingText(revision.workingSnapshot,context)}\n${exposureText(revision.exposureAtCapture,importedSnapshot(set,round,revision))}`),`目前工作稿（含尚未保留文字）\n${writingText(round.working,context)}`);}}
 return parts.join('\n\n')+'\n';
}
