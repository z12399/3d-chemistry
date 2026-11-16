import {FERMENTATION_COMPARISON_ACTIVITY_ID, normalizeDesignInputs, createBlankProposedGroup, cloneReportedAsProposed, resolveGroups, buildDesignMatrix, evaluatePair} from './fermentation-comparison-model.js';
import {loadFermentationComparisonSource, isVerifiedFermentationComparisonSource} from './fermentation-comparison-source.js';
import {downloadText} from './storage.js';
import {PLAN_FIELDS, PLAN_GROUP_LABELS, QUESTION_LABELS, METRIC_LABELS, CLAIM_LABELS, WRITING_LABELS, escapeHtml as esc, valueLabel, fieldLabel, referenceLabel, sourceLabel, groupLabel, locatorLabel, denominatorLabel, publishedReading, renderEvidence, renderAssessment, renderFullTable} from './fermentation-comparison-diagrams.js';

export {FERMENTATION_COMPARISON_ACTIVITY_ID};
export const FERMENTATION_SESSION_SCHEMA = 'fermentation-comparison-session/v1';
export const FERMENTATION_SESSION_MAX_BYTES = 2097152;
export const FERMENTATION_SESSION_MAX_ROUNDS = 100;
const owners = new WeakMap();
let mountSequence = 0;
const copy = value => JSON.parse(JSON.stringify(value));
const bytes = value => new TextEncoder().encode(value).byteLength;
const json = value => JSON.stringify(value, null, 2) + '\n';
const stable = value => JSON.stringify(value);
const identityEqual = (a,b) => a?.datasetId === b?.datasetId && a?.version === b?.version && a?.sha256 === b?.sha256;
const FIELD_PATHS = new Set(PLAN_FIELDS.map(field => field.path));
const WRITING_KEYS = Object.keys(WRITING_LABELS);
const INITIAL_KEYS = ['question','hypothesis','support','weaken'];
const emptyWriting = () => Object.fromEntries(WRITING_KEYS.map(key => [key,'']));
const emptyClaimDraft = () => ({field:PLAN_FIELDS[0].path,classification:'planned-control',reason:''});
const emptyExposure = () => ({displayedHere:[],importedClaims:[]});
const own = (value,key) => Object.prototype.hasOwnProperty.call(value,key);
const ownValue = (value,key) => own(value,key)?value[key]:undefined;
const put = (value,key,item) => Object.defineProperty(value,key,{value:item,enumerable:true,configurable:true,writable:true});
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype,null].includes(Object.getPrototypeOf(value));
const bad = message => {throw new Error(message);};
function keys(value, expected, label) {
 if (!plain(value) || Object.keys(value).length !== expected.length || expected.some(key => !own(value,key)) || Object.keys(value).some(key => !expected.includes(key))) bad(`${label} 的欄位不完整或含不支援欄位。`);
}
function text(value,label) {if (typeof value !== 'string') bad(`${label} 必須是文字。`);}
function id(value,label) {if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9:_-]{0,79}$/.test(value)) bad(`${label} ID 無效。`);}
function array(value,label) {if (!Array.isArray(value)) bad(`${label} 必須是陣列。`);}
function unique(values,label) {if (new Set(values).size !== values.length) bad(`${label} 含重複引用。`);}
function validSource(source) {if (!isVerifiedFermentationComparisonSource(source)) bad('尚未載入通過核對的來源。');}
function normalize(raw,source) {
 const result = normalizeDesignInputs(raw,source);
 if (!result.ok) bad(result.errors.map(error => `${error.path}：${error.message}`).join('\n'));
 return copy(result.design);
}
function currentRound(session) {return session.recordSets.find(set => set.setId === session.activeSelection.setId)?.rounds.find(round => round.roundId === session.activeSelection.roundId);}
function allRounds(session) {return session.recordSets.flatMap(set => set.rounds);}
function allExposure(session) {
 const result = emptyExposure();
 for (const round of allRounds(session)) for (const kind of Object.keys(result)) result[kind].push(...round.exposureClaims[kind]);
 for (const kind of Object.keys(result)) result[kind] = [...new Set(result[kind])];
 return result;
}
function allowedExposure(source) {
 return new Set(['table:tab3','table:tab4',...source.catalogue.sources.map(item=>`source:${item.id}`),...source.catalogue.cases.flatMap(item=>[`conditions:${item.referenceId}`,`result:${item.referenceId}`,`method:${item.referenceId}`])]);
}
function checkExposure(value,allowed,label) {
 keys(value,['displayedHere','importedClaims'],label);
 for (const kind of ['displayedHere','importedClaims']) {array(value[kind],label);unique(value[kind],label);for(const ref of value[kind]) if(!allowed.has(ref)) bad(`${label} 有未知來源引用。`);}
}
function checkWriting(value,label) {keys(value,WRITING_KEYS,label);for(const key of WRITING_KEYS) text(value[key],label);}
function checkClaimDraft(value) {keys(value,['field','classification','reason'],'未送出的控制自述');if(!FIELD_PATHS.has(value.field)||!Object.hasOwn(CLAIM_LABELS,value.classification))bad('未送出的控制自述選項無效。');text(value.reason,'未送出的控制理由');}
function checkDrafts(value,design,label) {
 if (!plain(value)) bad(`${label} 不是有效草稿。`);
 for (const [groupId,fields] of Object.entries(value)) {
  if (!design.groups.some(group=>group.groupId===groupId && group.origin==='proposed') || !plain(fields)) bad(`${label} 指向不存在的自建組。`);
  for (const [path,raw] of Object.entries(fields)) {if(!FIELD_PATHS.has(path))bad(`${label} 有未知欄位。`);text(raw,label);}
 }
}
function checkLabels(value,design,label) {
 if(!plain(value))bad(`${label} 格式無效。`);
 for(const [groupId,labelText] of Object.entries(value)) {if(!design.groups.some(group=>group.groupId===groupId))bad(`${label} 指向不存在的處理組。`);text(labelText,label);}
}
function checkCurrent(value,source,label) {
 keys(value,['design','writing','draftInputs','claimDraft','selectedGroupId'],label);
 const design=normalize(value.design,source);checkWriting(value.writing,label);checkDrafts(value.draftInputs,design,label);checkClaimDraft(value.claimDraft);
 if(value.selectedGroupId!==null && !design.groups.some(group=>group.groupId===value.selectedGroupId))bad(`${label} 選取的處理不存在。`);
 return design;
}

/** Validates every current and historical design, then returns an independent copy. */
export function validateFermentationSession(raw,source) {
 validSource(source);
 const rawText=typeof raw==='string'?raw:json(raw);
 if(bytes(rawText)>FERMENTATION_SESSION_MAX_BYTES)bad('設計檔超過 2 MiB；沒有載入任何內容。');
 let value;try{value=typeof raw==='string'?JSON.parse(raw):raw;}catch{bad('設計檔不是有效 JSON。');}
 keys(value,['schema','activityId','sourceIdentity','recordSets','activeSelection','exportInfo'],'設計檔');
 if(value.schema!==FERMENTATION_SESSION_SCHEMA || value.activityId!==FERMENTATION_COMPARISON_ACTIVITY_ID)bad('不支援這個設計檔版本或活動。');
 keys(value.sourceIdentity,['datasetId','version','sha256'],'來源身分');
 if(!identityEqual(value.sourceIdentity,source.sourceIdentity))bad('設計檔的來源身分與目前核對的資料不同。');
 keys(value.exportInfo,['appVersion','exportedAt','status'],'匯出自述');
 text(value.exportInfo.appVersion,'匯出版本');text(value.exportInfo.exportedAt,'匯出時間');
 if(value.exportInfo.status!=='exporter-self-report')bad('匯出紀錄必須標為自述。');
 array(value.recordSets,'紀錄組');if(!value.recordSets.length)bad('設計檔沒有紀錄組。');
 if(value.recordSets.reduce((sum,set)=>sum+(Array.isArray(set?.rounds)?set.rounds.length:0),0)>FERMENTATION_SESSION_MAX_ROUNDS)bad('全部紀錄組合計超過 100 輪。');
 const ids=new Set(),allowed=allowedExposure(source),takeId=(rawId,label)=>{id(rawId,label);if(ids.has(rawId))bad('設計檔有重複的紀錄 ID。');ids.add(rawId);};
 for(const set of value.recordSets) {
  keys(set,['setId','label','importReceipt','rounds'],'紀錄組');takeId(set.setId,'紀錄組');text(set.label,'紀錄組名稱');
  if(set.importReceipt!==null) {keys(set.importReceipt,['fileName','appVersion','exportedAt'],'載入自述');for(const field of Object.keys(set.importReceipt))text(set.importReceipt[field],'載入自述');}
  array(set.rounds,'輪次');if(!set.rounds.length)bad('紀錄組沒有輪次。');
  for(const round of set.rounds) {
   keys(round,['roundId','current','initial','snapshots','events','exposureClaims','displayLabels'],'輪次');takeId(round.roundId,'輪次');
   const design=checkCurrent(round.current,source,'目前設計');checkLabels(round.displayLabels,design,'顯示名稱');checkExposure(round.exposureClaims,allowed,'曝光自述');
   array(round.snapshots,'保存版本');array(round.events,'事件');
   for(const snapshot of round.snapshots) {
    keys(snapshot,['snapshotId','kind','label','design','writing','draftInputs','claimDraft','displayLabels','exposureClaims','eventId'],'保存版本');takeId(snapshot.snapshotId,'保存版本');
    if(!['initial','version','import-current','new-round'].includes(snapshot.kind))bad('保存版本類型不受支援。');text(snapshot.label,'版本名稱');
    const snapshotDesign=normalize(snapshot.design,source);checkWriting(snapshot.writing,'版本文字');checkDrafts(snapshot.draftInputs,snapshotDesign,'版本草稿');checkClaimDraft(snapshot.claimDraft);checkLabels(snapshot.displayLabels,snapshotDesign,'版本名稱');checkExposure(snapshot.exposureClaims,allowed,'版本曝光');id(snapshot.eventId,'版本事件');
   }
   for(const event of round.events) {
    keys(event,['eventId','kind','snapshotId','detail','exposureRefs'],'事件');takeId(event.eventId,'事件');
    if(!['initial','conditions','method','reveal','source','full-table','retain','design','claim','new-round','import','history'].includes(event.kind))bad('事件類型不受支援。');text(event.detail,'事件說明');array(event.exposureRefs,'事件來源');unique(event.exposureRefs,'事件來源');for(const ref of event.exposureRefs)if(!allowed.has(ref))bad('事件來源引用不明。');
    if(event.snapshotId!==null && !round.snapshots.some(snapshot=>snapshot.snapshotId===event.snapshotId && snapshot.eventId===event.eventId))bad('事件的版本引用斷裂。');
   }
   for(const snapshot of round.snapshots)if(!round.events.some(event=>event.eventId===snapshot.eventId && event.snapshotId===snapshot.snapshotId))bad('版本的事件引用斷裂。');
   if(round.initial!==null) {
    const initial=round.snapshots.find(snapshot=>snapshot.snapshotId===round.initial && snapshot.kind==='initial');
    if(!initial || round.snapshots.filter(snapshot=>snapshot.kind==='initial').length!==1)bad('初判引用不完整。');
    if(INITIAL_KEYS.some(key=>initial.writing[key]!==round.current.writing[key]))bad('目前初判文字與原始凍結版本不同。');
   } else if(round.snapshots.some(snapshot=>snapshot.kind==='initial'))bad('初判版本缺少輪次引用。');
  }
 }
 keys(value.activeSelection,['setId','roundId','snapshotId'],'選取紀錄');
 const selectedSet=value.recordSets.find(set=>set.setId===value.activeSelection.setId),selectedRound=selectedSet?.rounds.find(round=>round.roundId===value.activeSelection.roundId);
 if(!selectedRound || value.activeSelection.snapshotId!==null && !selectedRound.snapshots.some(snapshot=>snapshot.snapshotId===value.activeSelection.snapshotId))bad('選取的紀錄不存在。');
 if(bytes(json(value))>FERMENTATION_SESSION_MAX_BYTES)bad('標準格式的設計檔超過 2 MiB。');
 return copy(value);
}
export function serializeFermentationSession(session,source) {return json(validateFermentationSession(session,source));}
function initialDesign(source) {return normalize({schema:'fermentation-comparison-design-input/v1',sourceIdentity:copy(source.sourceIdentity),questionKind:'within-mode-condition',comparisonMetric:'reported-assay-activity',groups:[{groupId:'g1',origin:'reported',referenceId:'oa2018-t4-smf-0rpm'},{groupId:'g2',origin:'reported',referenceId:'oa2018-t4-smf-120rpm'}],pair:['g1','g2'],learnerClaims:[]},source);}
function makeRound(roundId,design,writing=emptyWriting()) {return {roundId,current:{design:copy(design),writing:copy(writing),draftInputs:{},claimDraft:emptyClaimDraft(),selectedGroupId:null},initial:null,snapshots:[],events:[],exposureClaims:emptyExposure(),displayLabels:{}};}
export function createFermentationSession(source,prefix='fc') {
 validSource(source);id(prefix,'記錄前綴');
 const setId=`${prefix}:set`,roundId=`${prefix}:round`;
 return validateFermentationSession({schema:FERMENTATION_SESSION_SCHEMA,activityId:FERMENTATION_COMPARISON_ACTIVITY_ID,sourceIdentity:copy(source.sourceIdentity),recordSets:[{setId,label:'本頁設計',importReceipt:null,rounds:[makeRound(roundId,initialDesign(source))]}],activeSelection:{setId,roundId,snapshotId:null},exportInfo:{appVersion:'fermentation-comparison/1',exportedAt:'',status:'exporter-self-report'}},source);
}
function addEvent(round,uid,kind,detail,refs=[],snapshotId=null) {const event={eventId:uid('e'),kind,snapshotId,detail,exposureRefs:[...new Set(refs)]};round.events.push(event);return event;}
function addSnapshot(round,uid,kind,label,exposure) {
 const snapshot={snapshotId:uid('v'),kind,label,design:copy(round.current.design),writing:copy(round.current.writing),draftInputs:copy(round.current.draftInputs),claimDraft:copy(round.current.claimDraft),displayLabels:copy(round.displayLabels),exposureClaims:copy(exposure),eventId:''};
 const event=addEvent(round,uid,kind==='initial'?'initial':kind==='import-current'?'import':kind==='new-round'?'new-round':'retain',label,[],snapshot.snapshotId);snapshot.eventId=event.eventId;round.snapshots.push(snapshot);return snapshot;
}
function freezeInitial(session,uid,trigger) {const round=currentRound(session);if(round.initial!==null)return;round.initial=addSnapshot(round,uid,'initial',`初判：${trigger}`,allExposure(session)).snapshotId;}
function expose(round,kind,refs) {round.exposureClaims[kind]=[...new Set([...round.exposureClaims[kind],...refs])];}
function makeUid(session,prefix) {
 const taken=new Set();for(const set of session.recordSets){taken.add(set.setId);for(const round of set.rounds){taken.add(round.roundId);for(const snapshot of round.snapshots)taken.add(snapshot.snapshotId);for(const event of round.events)taken.add(event.eventId);}}
 let counter=0;return kind=>{let result;do{result=`${prefix}:${kind}${++counter}`;}while(taken.has(result));taken.add(result);return result;};
}
function downgradeExposure(exposure) {return {displayedHere:[],importedClaims:[...new Set([...exposure.displayedHere,...exposure.importedClaims])]};}

/** Stages an additive import. No caller object is changed, including on any error. */
export function mergeFermentationSession(base,incoming,source,{fileName='',idPrefix='import'}={}) {
 const merged=validateFermentationSession(base,source),loaded=validateFermentationSession(incoming,source);text(fileName,'檔名');id(idPrefix,'載入前綴');
 const uid=makeUid(merged,idPrefix);freezeInitial(merged,uid,'載入其他設計前');
 const mapping=new Map(),mapId=old=>{if(!mapping.has(old))mapping.set(old,uid('i'));return mapping.get(old);};
 for(const set of loaded.recordSets) {
  const oldSetId=set.setId;set.setId=mapId(oldSetId);set.label=`載入：${set.label}`;set.importReceipt={fileName,appVersion:loaded.exportInfo.appVersion,exportedAt:loaded.exportInfo.exportedAt};
  for(const round of set.rounds) {
   round.roundId=mapId(round.roundId);round.initial=round.initial===null?null:mapId(round.initial);round.exposureClaims=downgradeExposure(round.exposureClaims);
   for(const snapshot of round.snapshots){snapshot.snapshotId=mapId(snapshot.snapshotId);snapshot.eventId=mapId(snapshot.eventId);snapshot.exposureClaims=downgradeExposure(snapshot.exposureClaims);}
   for(const event of round.events){event.eventId=mapId(event.eventId);event.snapshotId=event.snapshotId===null?null:mapId(event.snapshotId);}
   addSnapshot(round,uid,'import-current','載入時的當前設計（檔案自述）',round.exposureClaims);
  }
  merged.recordSets.push(set);
 }
 merged.activeSelection={setId:mapId(loaded.activeSelection.setId),roundId:mapId(loaded.activeSelection.roundId),snapshotId:null};
 const importedRound=currentRound(merged);if(importedRound.initial===null)freezeInitial(merged,uid,'載入時保存原始初判');
 addEvent(importedRound,uid,'import',`追加 ${allRounds(loaded).length} 輪；檔案歷史與曝光均為匯入自述。`);
 return validateFermentationSession(merged,source);
}

function planText(plan) {return PLAN_FIELDS.filter(field=>plan[field.group][field.path.split('.')[1]]!==null).map(field=>`${field.label}=${valueLabel(plan[field.group][field.path.split('.')[1]])}`).join('；') || '全部欄位未填';}
function designText(design,source) {
 const resolved=resolveGroups(design,source);if(!resolved.ok)bad('不能重建這份設計。');
 return [`問題：${QUESTION_LABELS[design.questionKind]}；量：${METRIC_LABELS[design.comparisonMetric]}；A/B=${design.pair.join(' → ')}。`,...resolved.groups.map(group=>group.origin==='reported'?`${group.groupId} 文獻：${referenceLabel(group.case)}；${group.referenceId}；${locatorLabel(group.case)}。`:`${group.groupId} 我的設計（未測；沿革 ${group.derivedFromReferenceId??'空白'}）：${planText(group.plan)}。未列欄位皆未填。`),...design.learnerClaims.map(claim=>`控制自述[${claim.groupIds.join('/')}] ${fieldLabel(claim.field)}：${CLAIM_LABELS[claim.classification]}；理由：${claim.reason}`)].join('\n');
}
function exposureText(exposure) {return `本頁顯示：${exposure.displayedHere.join('、')||'無此紀錄'}；匯入自述：${exposure.importedClaims.join('、')||'無'}。顯示／開啟不等於已閱讀，空白紀錄不代表盲測。`;}
const emptyCursor=()=>({header:false,library:[],snapshots:[],events:[],currents:{},evidence:[]});
/** Incremental references resolve in the same appended note; student text is never sliced. */
export function buildFermentationSummary(session,source,prior=emptyCursor()) {
 const cursor=copy(prior),lines=[],dictionary=[];
 const ref=(kind,value,render)=>{
  const canonical=stable(value);let entry=cursor.library.find(item=>item.kind===kind&&item.canonical===canonical);
  if(!entry){entry={kind,canonical,id:`${kind}${cursor.library.filter(item=>item.kind===kind).length+1}`};cursor.library.push(entry);dictionary.push(`${entry.id}\n${render(value)}`);}
  return entry.id;
 };
 const refs=snapshot=>[ref('設計',snapshot.design,value=>designText(value,source)),ref('文字',snapshot.writing,value=>WRITING_KEYS.map(key=>`${WRITING_LABELS[key]}：${value[key]}`).join('\n')),ref('草稿',{plans:snapshot.draftInputs,claim:snapshot.claimDraft},value=>[...Object.entries(value.plans).flatMap(([groupId,fields])=>Object.entries(fields).map(([path,raw])=>`${groupId}/${fieldLabel(path)}（未套用原文）：${raw}`)),...(value.claim.reason!==''?[`未加入的控制自述：${fieldLabel(value.claim.field)}／${CLAIM_LABELS[value.claim.classification]}；理由：${value.claim.reason}`]:[])].join('\n')||'沒有未套用草稿'),ref('名稱',snapshot.displayLabels,value=>Object.entries(value).map(([groupId,label])=>`${groupId}：${label}`).join('\n')||'沿用處理標籤')].join('／');
 if(!cursor.header){lines.push('發酵比較設計紀錄','這是計畫與文獻判讀；自建組沒有實測結果。設計檔可重開，三科筆記 JSON 只還原已附加筆記。',`資料身分：${source.sourceIdentity.datasetId} ${source.sourceIdentity.version} SHA256 ${source.sourceIdentity.sha256}`,...source.catalogue.sources.map(item=>`${sourceLabel(item)}：${item.url}；原始檔 SHA256 ${item.file.sha256}`));cursor.header=true;}
 for(const set of session.recordSets)for(const round of set.rounds) {
  const roundLines=[];
  for(const snapshot of round.snapshots)if(!cursor.snapshots.includes(snapshot.snapshotId)){roundLines.push(`${snapshot.snapshotId} ${snapshot.label}：${refs(snapshot)}\n${exposureText(snapshot.exposureClaims)}`);cursor.snapshots.push(snapshot.snapshotId);}
  for(const event of round.events)if(!cursor.events.includes(event.eventId)){roundLines.push(`${event.eventId} ${event.detail}${event.snapshotId?` → ${event.snapshotId}`:''}${event.exposureRefs.length?`；來源 ${event.exposureRefs.join('、')}`:''}`);cursor.events.push(event.eventId);}
  const current={...round.current,displayLabels:round.displayLabels},signature=stable(current);
  if(cursor.currents[round.roundId]!==signature){roundLines.push(`目前設計：${refs(current)}；初判=${round.initial??'尚未凍結'}。`);cursor.currents[round.roundId]=signature;}
  if(roundLines.length)lines.push(`【${set.label}／${round.roundId}】${set.importReceipt?'（歷史為匯入自述）':''}`,roundLines.join('\n'));
 }
 // Imported exposure claims alone do not silently reveal reconstructed numbers.
 // Opening the complete text explicitly records their display before rebuilding it.
 const exposure=allExposure(session),exposed=exposure.displayedHere;
 for(const record of source.catalogue.cases)if(exposed.includes(`result:${record.referenceId}`) && !cursor.evidence.includes(record.referenceId)){lines.push(`原報值 ${record.referenceId}：${publishedReading(record)}；${denominatorLabel(record)}；${locatorLabel(record)}。`);cursor.evidence.push(record.referenceId);}
 const full=[...lines,...dictionary.length?['【本文引用內容】',...dictionary]:[]].join('\n\n');
 return {text:full,cursor};
}

function getPlanValue(plan,path) {const [group,key]=path.split('.');return plan[group][key];}
function rawPlanValue(value) {return value===null?'':String(value);}
function planFromDraft(group,fields) {
 const plan=copy(group.plan);
 for(const [path,raw] of Object.entries(fields??{})) {
  const field=PLAN_FIELDS.find(item=>item.path===path),[section,key]=path.split('.');
  if(!field)bad('草稿有未知欄位。');
  if(raw===''){plan[section][key]=null;continue;}
  if(field.enum){if(!field.enum.includes(raw))bad(`${field.label} 的選項無效。`);plan[section][key]=raw;}
  else if(field.type.includes('boolean')){if(!['true','false'].includes(raw))bad(`${field.label} 的選項無效。`);plan[section][key]=raw==='true';}
  else if(field.type.includes('number')||field.type.includes('integer')){
   if(raw.trim()===''){plan[section][key]=null;continue;}
   if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw.trim())||!Number.isFinite(Number(raw)))bad(`${field.label} 需要有限數字；原輸入已保留。`);
   plan[section][key]=Number(raw);
  } else plan[section][key]=raw;
 }
 return plan;
}
function options(values,current,labels=valueLabel) {return values.map(value=>`<option value="${esc(value)}"${value===current?' selected':''}>${esc(typeof labels==='function'?labels(value):labels[value])}</option>`).join('');}
function button(action,label,attrs='',disabled=false) {return `<button type="button" data-fc-action="${action}"${disabled?' disabled':''}${attrs?` ${attrs}`:''}>${label}</button>`;}
function safeSourceUrl(value) {try{const parsed=new URL(value);return parsed.protocol==='https:'?parsed.href:null;}catch{return null;}}
function sameDraftOwner(owner) {return (typeof owner==='object' && owner!==null) || typeof owner==='function';}

export function mountFermentationComparisonLab(root,id=FERMENTATION_COMPARISON_ACTIVITY_ID,{draftOwner,draftKey=id,onSaveSummary,loadData=loadFermentationComparisonSource,onDownload=downloadText}={}) {
 if(!root || typeof root.addEventListener!=='function' || typeof root.querySelector!=='function')throw new TypeError('工作台需要可用的掛載節點。');
 if(id!==FERMENTATION_COMPARISON_ACTIVITY_ID)throw new RangeError('不支援這個發酵活動。');
 if(typeof loadData!=='function'||typeof onDownload!=='function')throw new TypeError('來源載入及下載接點必須是函式。');
 const owner=sameDraftOwner(draftOwner)?draftOwner:root;
 let ownerSlots=owners.get(owner);if(!ownerSlots){ownerSlots=new Map();owners.set(owner,ownerSlots);}
 let slot=ownerSlots.get(draftKey);
 if(!slot){slot={session:null,lastSource:null,cursor:emptyCursor(),pending:null,saveStatus:'',status:'',details:{},revealed:null,dispose:null,refresh:null,importEpoch:0};ownerSlots.set(draftKey,slot);}
 if(slot.dispose)slot.dispose();
 const prefix=`fc${++mountSequence}`,abort=new AbortController();
 let disposed=false,source=null,sourceError='',loadEpoch=0;
 slot.status='正在核對來源資料…';
 const uid=()=>makeUid(slot.session,prefix);
 const selection=()=>slot.session?.activeSelection;
 const round=()=>slot.session?currentRound(slot.session):null;
 const isHistory=()=>selection()?.snapshotId!==null;
 const view=()=>{
  const current=round();if(!current)return null;
  const historical=selection().snapshotId===null?null:current.snapshots.find(item=>item.snapshotId===selection().snapshotId);
  return historical?{...historical,selectedGroupId:null,historical:true}:{...current.current,displayLabels:current.displayLabels,historical:false};
 };
 const fingerprint=()=>slot.session?stable({selection:selection(),design:view().design}):null;
 const revealed=()=>slot.revealed!==null && slot.revealed===fingerprint();
 const setStatus=message=>{slot.status=message;const target=root.querySelector('[data-fc-status]');if(target)target.textContent=message;};
 const refresh=()=>{if(!disposed)render();};
 slot.refresh=refresh;
 const showError=error=>{if(!disposed)setStatus(error?.message||String(error));};
 const ensureEditable=()=>{if(!source)bad('來源尚未通過核對；文字仍保留。');if(isHistory())bad('這是唯讀版本；請先回到目前設計。');};
 function commit(mutator,message,{hide=true,focus=null,repaint=true}={}) {
  if(!source)bad('來源尚未通過核對。');
  const candidate=copy(slot.session),makeId=makeUid(candidate,prefix);mutator(candidate,makeId);
  slot.session=validateFermentationSession(candidate,source);
  if(hide){slot.revealed=null;slot.details['full-table']=false;}
  if(message)slot.status=message;
  if(repaint)render();else setStatus(slot.status);
  if(focus)root.querySelector(focus)?.focus();
 }
 function recordConditions(candidate,makeId) {
  const current=currentRound(candidate),selected=candidate.activeSelection.snapshotId===null?current.current:current.snapshots.find(item=>item.snapshotId===candidate.activeSelection.snapshotId);
  const refs=selected.design.groups.filter(group=>group.origin==='reported').map(group=>`conditions:${group.referenceId}`).filter(ref=>!current.exposureClaims.displayedHere.includes(ref));
  if(refs.length){expose(current,'displayedHere',refs);addEvent(current,makeId,'conditions','顯示處理條件（未揭示結果）',refs);}
 }
 function changeDesign(mutator,message,{focus=null}={}) {
  ensureEditable();
  commit((candidate,makeId)=>{
   const current=currentRound(candidate),next=copy(current.current.design);mutator(next,current);current.current.design=normalize(next,source);
   const snapshot=addSnapshot(current,makeId,'version',message,allExposure(candidate));current.events.find(event=>event.eventId===snapshot.eventId).kind='design';recordConditions(candidate,makeId);
  },message,{focus});
 }
 function details(name,title,body,{className=''}={}) {return `<details data-fc-detail="${esc(name)}"${slot.details[name]?' open':''}${className?` class="${className}"`:''}><summary>${title}</summary>${body}</details>`;}
 function captureFocus() {
  const active=root.ownerDocument?.activeElement;if(!active||!root.contains(active))return null;
  if(active.tagName?.toLowerCase()==='summary'||active.tag==='summary')return {detail:active.closest('[data-fc-detail]')?.dataset.fcDetail};
  const hookKeys=['fcAction','fcGroup','fcClaimIndex','fcWriting','fcPlan','fcLabel','fcQuestion','fcMetric','fcPair','fcReference','fcHistory','fcClaimField','fcClaimKind','fcClaimReason','fcSummary'];
  const hooks=Object.fromEntries(hookKeys.filter(key=>active.dataset?.[key]!==undefined).map(key=>[key,active.dataset[key]]));
  if(!Object.keys(hooks).length)return null;
  return {hooks,start:active.selectionStart,end:active.selectionEnd,direction:active.selectionDirection};
 }
 function restoreFocus(saved) {
  if(!saved)return;
  let target;
  if(saved.detail!==undefined)target=[...root.querySelectorAll('[data-fc-detail]')].find(item=>item.dataset.fcDetail===saved.detail)?.querySelector('summary');
  else target=[...root.querySelectorAll('button,select,input,textarea')].find(item=>Object.entries(saved.hooks).every(([key,value])=>item.dataset[key]===value));
  if(!target||target.disabled)return;target.focus();
  if(Number.isInteger(saved.start)&&typeof target.setSelectionRange==='function')try{target.setSelectionRange(saved.start,saved.end,saved.direction);}catch{}
 }
 function writingBlock(state) {
  const current=round(),locked=state.historical || current.initial!==null;
  const first=INITIAL_KEYS.map(key=>`<label for="${prefix}-writing-${key}">${WRITING_LABELS[key]}<textarea id="${prefix}-writing-${key}" rows="2" data-fc-writing="${key}"${locked?' readonly':''}>${esc(state.writing[key])}</textarea></label>`).join('');
  return details('question','寫自己的問題／預期',`<div class="fcd-writing">${first}</div><p data-fc-initial="${current.initial===null?'open':'frozen'}">${current.initial===null?'初判會在揭示、開原文或保留版本前固定。':'原始初判已固定；後續想法寫在觀察與修訂。'}</p>${button('freeze','保留初判','',locked)}`);
 }
 function cards(state,resolved) {
  return `<div class="fcd-cards">${resolved.groups.map(group=>{
   const condition=group.origin==='reported'?group.case.conditions:group.plan.conditions;
   const subtitle=[condition.mode??'模式未填',condition.cultureTemperatureC===null?'溫度未報／未填':`${condition.cultureTemperatureC} °C`,condition.agitationRpm===null?'轉速未報／未填':`${condition.agitationRpm} rpm`].join(' · ');
   const selected=state.selectedGroupId===group.groupId;
   return `<article class="fcd-card${selected?' is-selected':''}" data-fc-card="${esc(group.groupId)}"><span class="fcd-origin">${group.origin==='reported'?'文獻處理':'我的設計'}</span><h3>${esc(groupLabel(group,state.displayLabels))}</h3><p>${esc(subtitle)}</p><p class="fcd-card-result">${group.origin==='proposed'?'尚未量測':revealed()&&state.design.pair.includes(group.groupId)?esc(publishedReading(group.case)):'來源觀察尚未揭示'}</p><div class="fcd-actions">${button('edit',group.origin==='reported'?'查看條件':'編輯設計',`data-fc-group="${esc(group.groupId)}" aria-expanded="${selected}"`,state.historical)}${group.origin==='reported'?button('clone','以此建立新設計',`data-fc-group="${esc(group.groupId)}"`,state.historical||state.design.groups.length>=4):''}${button('delete','刪除',`data-fc-group="${esc(group.groupId)}"`,state.historical||state.design.groups.length<=2)}</div></article>`;
  }).join('')}</div>`;
 }
 function addControls(state) {
  const used=new Set(state.design.groups.filter(group=>group.origin==='reported').map(group=>group.referenceId));
  const available=source.catalogue.cases.filter(record=>!used.has(record.referenceId));
  return details('add','新增處理',`<div class="fcd-add"><label for="${prefix}-reference">加入文獻處理<select id="${prefix}-reference" data-fc-reference${state.historical||state.design.groups.length>=4?' disabled':''}>${['tab4','tab3'].map(table=>`<optgroup label="${table==='tab4'?'Table 4 · 轉速':'Table 3 · 溫度'}">${available.filter(record=>record.locator.tableId===table).map(record=>`<option value="${esc(record.referenceId)}">${esc(referenceLabel(record))}</option>`).join('')}</optgroup>`).join('')}</select></label>${button('add-reported','加入這個文獻處理','',state.historical||state.design.groups.length>=4||!available.length)}${button('add-blank','建立空白設計','',state.historical||state.design.groups.length>=4)}</div><p>共 ${state.design.groups.length} 組；至少保留兩組，最多四組。文獻卡的複本會成為尚未量測的新設計。</p>`);
 }
 function planControl(field,group,state) {
  const raw=ownValue(state.draftInputs,group.groupId)?.[field.path]??rawPlanValue(getPlanValue(group.plan,field.path)),inputId=`${prefix}-plan-${field.path.replace('.','-')}`;
  const attributes=`id="${inputId}" data-fc-plan="${field.path}" data-fc-group="${esc(group.groupId)}"`;
  let control;
  if(field.enum)control=`<select ${attributes}><option value=""${raw===''?' selected':''}>未填</option>${options(field.enum.filter(value=>value!==null),raw)}</select>`;
  else if(field.type.includes('boolean'))control=`<select ${attributes}><option value=""${raw===''?' selected':''}>未填</option><option value="true"${raw==='true'?' selected':''}>有安排</option><option value="false"${raw==='false'?' selected':''}>無安排</option></select>`;
  else if(field.type.includes('number')||field.type.includes('integer'))control=`<input ${attributes} type="text" inputmode="decimal" value="${esc(raw)}" autocomplete="off">`;
  else control=`<textarea ${attributes} rows="${field.maxLength>200?2:1}">${esc(raw)}</textarea>`;
  return `<label for="${inputId}">${field.label}${control}</label>`;
 }
 function editor(state,resolved) {
  if(state.historical||state.selectedGroupId===null)return '';
  const group=resolved.groups.find(item=>item.groupId===state.selectedGroupId);if(!group)return '';
  const labelInput=`<label for="${prefix}-card-label">自訂名稱<input id="${prefix}-card-label" data-fc-label="${esc(group.groupId)}" type="text" value="${esc(ownValue(state.displayLabels,group.groupId)??'')}" placeholder="只影響顯示名稱"></label>`;
  const sourceMatrix=group.origin==='reported'?buildDesignMatrix(state.design,source).matrix:null;
  const sourcePaths={'replication.independentCultureUnits':'replication.independentCultureReplicates','replication.extractionsPerCultureUnit':'replication.extractionReplicates','replication.assaysPerExtraction':'replication.assayReplicates','recovery.protocolLabel':'recovery.reportedProtocolId'};
  const content=group.origin==='reported'?`<p>文獻條件唯讀；空白處代表原文未報。</p>${Object.entries(PLAN_GROUP_LABELS).map(([section,label])=>details(`method-${group.groupId}-${section}`,label,`<dl class="fcd-facts">${PLAN_FIELDS.filter(field=>field.group===section).map(field=>{
   const value=sourceMatrix.rows.find(row=>row.field===field.path).cells.find(cell=>cell.groupId===group.groupId).value,evidencePath=sourcePaths[field.path]??field.path,scope=group.case.fieldEvidence.filter(evidence=>evidence.paths.some(path=>evidencePath===path||evidencePath.startsWith(`${path}.`))).flatMap(evidence=>evidence.locators).join('、');
   return `<div><dt>${field.label}</dt><dd>${value===null||value===undefined?'原文未報':esc(valueLabel(value))}${scope?`<small>來源：${esc(scope)}</small>`:''}</dd></div>`;
  }).join('')}</dl>`)).join('')}<p>${esc(locatorLabel(group.case))}。獨立培養、萃取和檢定三層的重複單位未被表格釐清。</p>`:
  `<p>這些都是計畫值；結果保持「尚未量測」。</p>${Object.entries(PLAN_GROUP_LABELS).map(([section,label])=>details(`plan-${group.groupId}-${section}`,label,`<fieldset class="fcd-fields"><legend>${label}</legend>${PLAN_FIELDS.filter(field=>field.group===section).map(field=>planControl(field,group,state)).join('')}</fieldset>`)).join('')}<div class="fcd-actions">${button('apply','套用變更',`data-fc-group="${esc(group.groupId)}"`)}</div><p>輸入先保留為草稿；套用後才成為有效設計版本。</p>`;
  return `<section class="fcd-editor" aria-label="選中處理的條件"><h3 tabindex="-1" data-fc-editor-heading>${esc(groupLabel(group,state.displayLabels))}</h3>${labelInput}${content}${button('close-editor','收起條件')}</section>`;
 }
 function matrixBlock(state,matrix,resolved) {
  const pair=state.design.pair,groups=pair.map(groupId=>resolved.groups.find(group=>group.groupId===groupId));
  const cells=row=>pair.map(groupId=>row.cells.find(cell=>cell.groupId===groupId));
  const visibleRows=matrix.rows.filter(row=>{const values=cells(row);return values.some(cell=>cell.value===null)||stable(values[0].value)!==stable(values[1].value);});
  const chosen=visibleRows.slice(0,3),rest=matrix.rows.filter(row=>!chosen.includes(row));
  const table=rows=>`<div class="fcd-table-wrap" tabindex="0" role="region" aria-label="處理條件差異表"><table><thead><tr><th scope="col">因素</th><th scope="col">A · ${esc(groupLabel(groups[0],state.displayLabels))}</th><th scope="col">B · ${esc(groupLabel(groups[1],state.displayLabels))}</th></tr></thead><tbody>${rows.map(row=>`<tr><th scope="row">${esc(fieldLabel(row.field))}</th>${cells(row).map(cell=>`<td><span class="fcd-basis">${cell.basis==='reported'?'來源記載':cell.basis==='planned'?'我的計畫':cell.basis==='unreported'?'原文未報':'計畫未填'}</span><span>${cell.value===null?'—':esc(valueLabel(cell.value))}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const claims=state.design.learnerClaims.map((claim,index)=>`<li><strong>${esc(fieldLabel(claim.field))}</strong>（${esc(claim.groupIds.join('／'))}）：${CLAIM_LABELS[claim.classification]}<p>${esc(claim.reason)}</p>${button('remove-claim','移除這個自述',`data-fc-claim-index="${index}"`,state.historical)}</li>`).join('');
  return `<section class="fcd-matrix"><h3>條件差異</h3>${table(chosen)}${details('matrix',`其餘 ${rest.length} 項條件`,table(rest))}${details('claims','我的控制判斷',`<p>自己的分類不會改寫文獻事實；此判斷套用到目前的 A／B。</p><div class="fcd-fields"><label for="${prefix}-claim-field">因素<select id="${prefix}-claim-field" data-fc-claim-field${state.historical?' disabled':''}>${PLAN_FIELDS.map(field=>`<option value="${field.path}"${field.path===state.claimDraft.field?' selected':''}>${field.label}</option>`).join('')}</select></label><label for="${prefix}-claim-kind">我的分類<select id="${prefix}-claim-kind" data-fc-claim-kind${state.historical?' disabled':''}>${options(Object.keys(CLAIM_LABELS),state.claimDraft.classification,CLAIM_LABELS)}</select></label><label for="${prefix}-claim-reason">理由<textarea id="${prefix}-claim-reason" data-fc-claim-reason rows="2"${state.historical?' readonly':''}>${esc(state.claimDraft.reason)}</textarea></label></div>${button('add-claim','加入這個自述','',state.historical)}<ul>${claims}</ul>`)}</section>`;
 }
 function sourceBlock() {
  return details('sources','原文與證據範圍',`<p>開啟全文或完整表之前會固定初判。這組練習只涵蓋比較與設計能力。</p><ul>${source.catalogue.sources.map(item=>{const url=safeSourceUrl(item.url);return `<li>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-fc-source="${esc(item.id)}">${esc(sourceLabel(item))}</a>`:esc(sourceLabel(item))}${item.locator?`<span> · ${esc(item.locator)}</span>`:''}</li>`;}).join('')}</ul>${details('full-table','查看完整 Table 3／4',slot.details['full-table']?renderFullTable(source.catalogue):'<p>展開後顯示文獻的全部 16 個處理。</p>')}<p>來源名稱或檔案不證明自己做過量測。比較尚不能回答所有製程優劣、食品案例或題目內容。</p>`);
 }
 function historyOptionsMarkup() {
  const active=`${selection().setId}|${selection().roundId}|${selection().snapshotId??'current'}`;
  const historyOptions=slot.session.recordSets.flatMap(set=>set.rounds.flatMap((item,index)=>[
   {value:`${set.setId}|${item.roundId}|current`,label:`${set.label}／第 ${index+1} 輪 · 目前設計`},
   ...item.snapshots.map((snapshot,snapshotIndex)=>({value:`${set.setId}|${item.roundId}|${snapshot.snapshotId}`,label:`${set.label}／第 ${index+1} 輪 · ${snapshotIndex+1} ${snapshot.label}`}))
  ]));
  return historyOptions.map(item=>`<option value="${esc(item.value)}"${item.value===active?' selected':''}>${esc(item.label)}</option>`).join('');
 }
 function historyBlock(state) {
  return details('history',`紀錄與輪次（${allRounds(slot.session).length} 輪）`,`<label for="${prefix}-history">選取紀錄<select id="${prefix}-history" data-fc-history>${historyOptionsMarkup()}</select></label><p>${state.historical?'目前是唯讀版本；它的設計與文字不會被回寫。':'目前設計可繼續編輯。保留版本只暫存在本頁。'}</p><div class="fcd-actions">${button('return-current','回到目前設計','',!state.historical)}${button('new-round',state.historical?'以這版開始新一輪':'開始新一輪','',allRounds(slot.session).length>=100)}</div><p data-fc-exposure>${esc(exposureText(allExposure(slot.session)))}</p>`);
 }
 function saveBlock(disabled=false) {
  const full=slot.session&&slot.lastSource?buildFermentationSummary(slot.session,slot.lastSource).text:'';
  return details('save','保存',`<div class="fcd-save-actions">${button('save-note',slot.pending?'正在附加…':'附加本課可讀筆記','',disabled||!!slot.pending||typeof onSaveSummary!=='function')}${button('export-design','下載可重開設計','',disabled)}${button('import-design','載入設計','',disabled)}<input type="file" accept="application/json,.json" data-fc-file hidden></div><p>可讀筆記隨加工 JSON 保存；設計檔用於重新開啟工作台。載入會新增紀錄組，保留原內容。</p><p data-fc-save-status>${esc(slot.saveStatus)}</p>${details('full-text','容量與完整文字',`<p>設計檔上限 2 MiB，全部記錄合計 100 輪；本課筆記連同既有文字最多 10,000 字元。文字不會自動截斷。</p><label for="${prefix}-summary">完整可讀紀錄<textarea id="${prefix}-summary" data-fc-summary readonly rows="8">${esc(full)}</textarea></label><div class="fcd-actions">${button('copy-summary','選取／複製完整文字')}${button('export-text','另存完整文字','',!slot.session)}</div>`)}`);
 }
 function render() {
  if(disposed)return;
  const focused=captureFocus();
  if(!source) {
   const saved=slot.session?`<p>本頁原有設計與文字仍保留；數值暫停顯示。</p>${saveBlock(true)}`:'';
   root.innerHTML=`<section class="fermentation-comparison-design" data-fc-ready="false"><h2 class="fcd-sr-only">發酵比較設計工作台</h2><p data-fc-status role="status" aria-live="polite">${esc(sourceError||slot.status)}</p>${sourceError?button('retry','重新核對來源'):''}${saved}</section>`;restoreFocus(focused);return;
  }
  const state=view(),resolved=resolveGroups(state.design,source),assessment=evaluatePair(state.design,source),matrix=buildDesignMatrix(state.design,source);
  if(!resolved.ok||!assessment.ok||!matrix.ok){sourceError='目前設計未通過模型核對；文字與歷史已保留。';source=null;render();return;}
  const pairGroups=state.design.pair.map(groupId=>resolved.groups.find(group=>group.groupId===groupId));
  root.innerHTML=`<section class="fermentation-comparison-design" data-fc-ready="true" data-fc-history-view="${state.historical}"><h2 class="fcd-sr-only">發酵比較設計工作台</h2><div class="fcd-question-row"><label for="${prefix}-question">我的問題<select id="${prefix}-question" data-fc-question${state.historical?' disabled':''}>${options(Object.keys(QUESTION_LABELS),state.design.questionKind,QUESTION_LABELS)}</select></label><label for="${prefix}-metric">想比較的量<select id="${prefix}-metric" data-fc-metric${state.historical?' disabled':''}>${options(Object.keys(METRIC_LABELS),state.design.comparisonMetric,METRIC_LABELS)}</select></label></div>${writingBlock(state)}<section class="fcd-treatment"><div class="fcd-section-title"><h3>處理組</h3><span>${state.design.groups.length}／4</span></div>${cards(state,resolved)}${addControls(state)}${editor(state,resolved)}</section><section class="fcd-pair"><h3>目前比較</h3><div class="fcd-pair-controls">${[0,1].map(index=>`<label for="${prefix}-pair-${index}">${index?'B':'A'}<select id="${prefix}-pair-${index}" data-fc-pair="${index}"${state.historical?' disabled':''}>${resolved.groups.map(group=>`<option value="${esc(group.groupId)}"${state.design.pair[index]===group.groupId?' selected':''}>${esc(groupLabel(group,state.displayLabels))}</option>`).join('')}</select></label>`).join('')}${button('reveal','查看可得證據')}</div>${renderEvidence(pairGroups,assessment.evaluation,{revealed:revealed(),labels:state.displayLabels})}${renderAssessment(assessment.evaluation,revealed())}</section>${matrixBlock(state,matrix.matrix,resolved)}${details('revision','觀察與修訂',`<div class="fcd-writing">${WRITING_KEYS.filter(key=>!INITIAL_KEYS.includes(key)).map(key=>`<label for="${prefix}-writing-${key}">${WRITING_LABELS[key]}<textarea id="${prefix}-writing-${key}" data-fc-writing="${key}" rows="3"${state.historical?' readonly':''}>${esc(state.writing[key])}</textarea></label>`).join('')}</div>`)}<div class="fcd-retain">${button('retain','保留這版','',state.historical)}<p>本頁暫存；重新整理前請下載設計檔。</p></div>${saveBlock()}${historyBlock(state)}${sourceBlock()}<p data-fc-status role="status" aria-live="polite">${esc(slot.status)}</p></section>`;
  restoreFocus(focused);
 }
 async function load() {
  const epoch=++loadEpoch;source=null;sourceError='';slot.status='正在核對來源資料…';render();
  try {
   const loaded=await loadData({signal:abort.signal});
   if(disposed||epoch!==loadEpoch)return;validSource(loaded);
   if(slot.session&&!identityEqual(slot.session.sourceIdentity,loaded.sourceIdentity))bad('新的來源身分不同；已停止混接，原設計仍保留。');
   source=loaded;slot.lastSource=loaded;
   if(!slot.session)slot.session=createFermentationSession(loaded,prefix);
   const candidate=copy(slot.session);recordConditions(candidate,makeUid(candidate,prefix));
   try{slot.session=validateFermentationSession(candidate,source);}catch(error){slot.status=`原草稿已保留。${error.message}`;render();return;}
   slot.status='先選要比較的問題與處理組；文獻結果尚未揭示。';render();
  }catch(error){if(disposed||epoch!==loadEpoch)return;source=null;sourceError=`來源核對失敗：${error?.message||error}`;slot.status=sourceError;render();}
 }
 function nextGroupId(design) {let index=1;while(design.groups.some(group=>group.groupId===`g${index}`))index++;return `g${index}`;}
 async function saveNote() {
  if(!source||!slot.session)bad('來源尚未通過核對。');
  if(slot.pending)return;
  if(typeof onSaveSummary!=='function')bad('本頁沒有筆記保存接點。');
  const plan=buildFermentationSummary(slot.session,source,slot.cursor);
  if(!plan.text){slot.saveStatus='這些版本已附加；沒有新的內容。';render();return;}
  const pending={text:plan.text,cursor:plan.cursor};slot.pending=pending;slot.saveStatus='正在附加捕獲的這一版；仍可繼續寫作。';render();
  try {
   const result=await onSaveSummary(pending.text);
   if(result===true){slot.cursor=pending.cursor;slot.saveStatus='捕獲的版本已附加。等待期間的新修改仍留在目前設計。';}
   else slot.saveStatus='筆記未附加；完整內容仍保留，可複製或下載。';
  }catch(error){slot.saveStatus=`筆記未附加：${error?.message||error}。完整內容仍保留。`;}
  finally{if(slot.pending===pending)slot.pending=null;slot.refresh?.();}
 }
 async function exportDesign() {
  if(!source)bad('來源尚未通過核對。');
  const captured=copy(slot.session);captured.exportInfo={appVersion:'fermentation-comparison/1',exportedAt:new Date().toISOString(),status:'exporter-self-report'};
  const payload=serializeFermentationSession(captured,source);
  await onDownload('fermentation-comparison-design.json',payload,'application/json;charset=utf-8');
  if(!disposed)setStatus(`已送出設計檔下載（${bytes(payload)} bytes）；是否落盤請以瀏覽器下載為準。`);
 }
 async function importFile(file) {
  if(!source)bad('來源尚未通過核對。');if(!file)return;
  const epoch=++slot.importEpoch,sourceAtStart=source;
  if(!Number.isFinite(file.size)||file.size<0||file.size>FERMENTATION_SESSION_MAX_BYTES)bad('設計檔超過 2 MiB 或大小無效；原內容保留。');
  setStatus('正在檢查整份設計檔；原內容保留。');
  const buffer=await file.arrayBuffer();
  if(disposed||epoch!==slot.importEpoch)return;
  if(buffer.byteLength>FERMENTATION_SESSION_MAX_BYTES)bad('設計檔超過 2 MiB。');
  const raw=new TextDecoder('utf-8',{fatal:true}).decode(buffer);
  const incoming=validateFermentationSession(raw,sourceAtStart);
  if(disposed||epoch!==slot.importEpoch||source!==sourceAtStart)return;
  const merged=mergeFermentationSession(slot.session,incoming,source,{fileName:String(file.name??''),idPrefix:`${prefix}-import`});
  const candidate=copy(merged);recordConditions(candidate,makeUid(candidate,prefix));
  // Include the newly displayed condition event in the same bounded transaction.
  const committed=validateFermentationSession(candidate,source);
  slot.session=committed;slot.revealed=null;slot.details['full-table']=false;slot.status=`已新增 ${allRounds(incoming).length} 輪；原有內容保留。載入的歷史與曝光是檔案自述。`;render();
 }
 function action(event) {
  const target=event.target?.closest?.('[data-fc-action]');if(!target||!root.contains(target)||target.disabled)return;
  const actionName=target.dataset.fcAction,groupId=target.dataset.fcGroup;
  try {
   if(actionName==='retry'){void load();return;}
   if(actionName==='save-note'){void saveNote().catch(showError);return;}
   if(actionName==='export-design'){void exportDesign().catch(showError);return;}
   if(actionName==='import-design'){if(!source)bad('來源尚未通過核對。');root.querySelector('[data-fc-file]')?.click?.();return;}
   if(actionName==='copy-summary'){
    const payload=slot.session&&slot.lastSource?buildFermentationSummary(slot.session,slot.lastSource).text:'';
    const textarea=root.querySelector('[data-fc-summary]');if(textarea)textarea.value=payload;textarea?.focus();textarea?.select();
    if(globalThis.navigator?.clipboard?.writeText)void navigator.clipboard.writeText(payload).then(()=>{if(!disposed)setStatus('已複製完整文字。');},()=>{if(!disposed)setStatus('已選取完整文字，可按 Ctrl+C 複製。');});
    else setStatus('已選取完整文字，可按 Ctrl+C 複製。');return;
   }
   if(actionName==='export-text'){
    if(!slot.session||!slot.lastSource)bad('目前沒有可匯出的文字。');const payload=buildFermentationSummary(slot.session,slot.lastSource).text;
    void Promise.resolve(onDownload('fermentation-comparison-record.txt',payload,'text/plain;charset=utf-8')).then(()=>{if(!disposed)setStatus('已送出完整文字下載。');},showError);return;
   }
   if(!source)bad('來源尚未通過核對。');
   if(actionName==='reveal'){
    commit((candidate,makeId)=>{freezeInitial(candidate,makeId,'查看可得證據');const current=currentRound(candidate),state=candidate.activeSelection.snapshotId===null?current.current:current.snapshots.find(item=>item.snapshotId===candidate.activeSelection.snapshotId),refs=state.design.groups.filter(group=>state.design.pair.includes(group.groupId)&&group.origin==='reported').map(group=>`result:${group.referenceId}`);expose(current,'displayedHere',refs);addEvent(current,makeId,'reveal','揭示所選 A／B 的來源觀察',refs);},'已揭示這一對的證據；自建組仍然未測。');
    slot.revealed=fingerprint();render();return;
   }
   if(actionName==='return-current'){commit(candidate=>{candidate.activeSelection.snapshotId=null;},'已回到目前設計。');return;}
   if(actionName==='new-round'){
    const selected=copy(view());commit((candidate,makeId)=>{freezeInitial(candidate,makeId,'開始新一輪');const set=candidate.recordSets.find(item=>item.setId===candidate.activeSelection.setId),next=makeRound(makeId('r'),selected.design,selected.writing);next.current.draftInputs=copy(selected.draftInputs);next.current.claimDraft=copy(selected.claimDraft);next.displayLabels=copy(selected.displayLabels);set.rounds.push(next);candidate.activeSelection={setId:set.setId,roundId:next.roundId,snapshotId:null};addSnapshot(next,makeId,'new-round','新一輪起點',allExposure(candidate));recordConditions(candidate,makeId);},'已開始新一輪；之前的版本與已見紀錄仍保留。');return;
   }
   ensureEditable();
   if(actionName==='freeze'){commit((candidate,makeId)=>freezeInitial(candidate,makeId,'主動保留初判'),'初判已固定；後續可寫觀察與修訂。',{hide:false});return;}
   if(actionName==='retain'){commit((candidate,makeId)=>{freezeInitial(candidate,makeId,'保留版本');addSnapshot(currentRound(candidate),makeId,'version','保留這版',allExposure(candidate));},'這一版已暫存在本頁；請下載設計檔保留。',{hide:false});return;}
   if(actionName==='edit'){
    if(!round().current.design.groups.some(group=>group.groupId===groupId))bad('找不到這個處理。');round().current.selectedGroupId=groupId;slot.status='條件與方法可以先看；尚未量測的新設計不會帶入來源結果。';render();root.querySelector('[data-fc-editor-heading]')?.focus();return;
   }
   if(actionName==='close-editor'){round().current.selectedGroupId=null;render();return;}
   if(actionName==='add-reported'){
    const referenceId=root.querySelector('[data-fc-reference]')?.value;if(!source.catalogue.cases.some(record=>record.referenceId===referenceId))bad('請選一個來源處理。');
    changeDesign((design,current)=>{const newId=nextGroupId(design);design.groups.push({groupId:newId,origin:'reported',referenceId});current.current.selectedGroupId=newId;},'已加入文獻處理；結果尚未揭示。');return;
   }
   if(actionName==='add-blank'||actionName==='clone'){
    changeDesign((design,current)=>{const newId=nextGroupId(design),original=design.groups.find(group=>group.groupId===groupId);if(actionName==='clone'&&original?.origin!=='reported')bad('只能從文獻處理建立新設計。');design.groups.push(copy(actionName==='clone'?cloneReportedAsProposed(original.referenceId,newId,source):createBlankProposedGroup(newId)));current.current.selectedGroupId=newId;},'已建立尚未量測的新設計。',{focus:'[data-fc-editor-heading]'});return;
   }
   if(actionName==='apply'){
    changeDesign((design,current)=>{const group=design.groups.find(item=>item.groupId===groupId);if(group?.origin!=='proposed')bad('文獻處理不能直接改寫。');group.plan=planFromDraft(group,ownValue(current.current.draftInputs,groupId));delete current.current.draftInputs[groupId];},'條件已套用並保留版本；結果仍是尚未量測。');return;
   }
   if(actionName==='delete'){
    changeDesign((design,current)=>{if(design.groups.length<=2)bad('至少保留兩組處理。');if(!design.groups.some(group=>group.groupId===groupId))bad('處理不存在。');design.groups=design.groups.filter(group=>group.groupId!==groupId);const remaining=design.groups.map(group=>group.groupId);design.pair=design.pair.filter(value=>value!==groupId);while(design.pair.length<2)design.pair.push(remaining.find(value=>!design.pair.includes(value)));design.learnerClaims=design.learnerClaims.filter(claim=>!claim.groupIds.includes(groupId));delete current.current.draftInputs[groupId];delete current.displayLabels[groupId];if(current.current.selectedGroupId===groupId)current.current.selectedGroupId=null;},'已刪除處理；A／B 已改為剩餘合法配對，相關控制自述移出目前設計，舊版本保留。',{focus:'[data-fc-pair="0"]'});return;
   }
   if(actionName==='add-claim'){
    const field=root.querySelector('[data-fc-claim-field]')?.value,classification=root.querySelector('[data-fc-claim-kind]')?.value,reason=root.querySelector('[data-fc-claim-reason]')?.value??'';
    changeDesign((design,current)=>{design.learnerClaims.push({field,groupIds:[...design.pair],classification,reason});current.current.claimDraft=emptyClaimDraft();},'已加入自己的控制自述；來源事實不變。');return;
   }
   if(actionName==='remove-claim'){
    const index=Number(target.dataset.fcClaimIndex);changeDesign(design=>{if(!Number.isInteger(index)||!design.learnerClaims[index])bad('找不到這個自述。');design.learnerClaims.splice(index,1);},'已移除目前設計的自述；舊版本保留。');return;
   }
  }catch(error){showError(error);}
 }
 function input(event) {
  const target=event.target;if(!target||!root.contains(target)||!slot.session||isHistory())return;
  const current=round();
  if(target.dataset.fcWriting!==undefined){const key=target.dataset.fcWriting;if(!WRITING_KEYS.includes(key)||current.initial!==null&&INITIAL_KEYS.includes(key))return;current.current.writing[key]=String(target.value);return;}
  if(target.dataset.fcPlan!==undefined){const path=target.dataset.fcPlan,groupId=target.dataset.fcGroup;if(!FIELD_PATHS.has(path)||!current.current.design.groups.some(group=>group.groupId===groupId&&group.origin==='proposed'))return;if(!own(current.current.draftInputs,groupId))put(current.current.draftInputs,groupId,{});current.current.draftInputs[groupId][path]=String(target.value);return;}
  if(target.dataset.fcClaimReason!==undefined){current.current.claimDraft.reason=String(target.value);return;}
  if(target.dataset.fcClaimField!==undefined){if(FIELD_PATHS.has(target.value))current.current.claimDraft.field=target.value;return;}
  if(target.dataset.fcClaimKind!==undefined){if(Object.hasOwn(CLAIM_LABELS,target.value))current.current.claimDraft.classification=target.value;return;}
  if(target.dataset.fcLabel!==undefined){const groupId=target.dataset.fcLabel;if(current.current.design.groups.some(group=>group.groupId===groupId))put(current.displayLabels,groupId,String(target.value));}
 }
 function change(event) {
  const target=event.target;if(!target||!root.contains(target))return;
  if(target.dataset.fcFile!==undefined){const file=target.files?.[0];if(file)void importFile(file).catch(error=>{if(!disposed)showError(error);});target.value='';return;}
  try {
   if(target.dataset.fcHistory!==undefined){
    const [setId,roundId,snapshot]=String(target.value).split('|');
    commit((candidate,makeId)=>{freezeInitial(candidate,makeId,'查看其他紀錄');candidate.activeSelection={setId,roundId,snapshotId:snapshot==='current'?null:snapshot};if(!currentRound(candidate))bad('所選紀錄不存在。');recordConditions(candidate,makeId);addEvent(currentRound(candidate),makeId,'history','切換查看紀錄');},'已切換紀錄；保存版本唯讀。');return;
   }
   if(target.dataset.fcQuestion!==undefined){changeDesign(design=>{design.questionKind=target.value;},'問題已改變；請重新查看這一對的證據。');return;}
   if(target.dataset.fcMetric!==undefined){changeDesign(design=>{design.comparisonMetric=target.value;},'量測指標已改變；原來源數值不會換成新量。');return;}
   if(target.dataset.fcPair!==undefined){const index=Number(target.dataset.fcPair),chosen=target.value;changeDesign(design=>{if(![0,1].includes(index)||!design.groups.some(group=>group.groupId===chosen))bad('比較對無效。');const old=design.pair[index];if(design.pair[1-index]===chosen)design.pair[1-index]=old;design.pair[index]=chosen;},'比較對已更新；若選到另一邊的處理，A／B 已交換。');return;}
   input(event);
   if(target.dataset.fcLabel!==undefined)render();
  }catch(error){showError(error);}
 }
 function toggle(event) {
  const target=event.target;if(!target||!root.contains(target)||target.dataset.fcDetail===undefined)return;
  const name=target.dataset.fcDetail,previous=!!slot.details[name];slot.details[name]=!!target.open;if(previous===!!target.open||!target.open||!source)return;
  try {
   if(name==='full-table'){
    commit((candidate,makeId)=>{freezeInitial(candidate,makeId,'展開完整來源表');const refs=['table:tab3','table:tab4',...source.catalogue.cases.map(record=>`result:${record.referenceId}`)],current=currentRound(candidate);expose(current,'displayedHere',refs);addEvent(current,makeId,'full-table','展開完整 Table 3／4',refs);},'完整原表已顯示；已見紀錄保留。',{hide:false});return;
   }
   if(name.startsWith('method-')){
    const group=round().current.design.groups.find(item=>Object.keys(PLAN_GROUP_LABELS).some(section=>name===`method-${item.groupId}-${section}`));if(group?.origin==='reported')commit((candidate,makeId)=>{const current=currentRound(candidate),refs=[`method:${group.referenceId}`];expose(current,'displayedHere',refs);addEvent(current,makeId,'method','展開不含結果的來源方法',refs);},'已顯示來源方法；初判仍可在揭示前修改。',{hide:false});
   }
   if(name==='full-text'){
    const exposed=allExposure(slot.session),refs=[...new Set([...exposed.displayedHere,...exposed.importedClaims])].filter(ref=>ref.startsWith('result:'));
    if(refs.length)commit((candidate,makeId)=>{freezeInitial(candidate,makeId,'展開完整文字中的文獻觀察');const current=currentRound(candidate);expose(current,'displayedHere',refs);addEvent(current,makeId,'reveal','展開完整文字中的文獻觀察',refs);},'完整文字已顯示；其中的來源觀察已列入本頁顯示紀錄。',{hide:false});
    else render();
   }
  }catch(error){if(name==='full-table'){slot.details[name]=false;target.open=false;}showError(error);}
 }
 function sourceEvent(event) {
  const target=event.target?.closest?.('[data-fc-source]');if(!target||!root.contains(target))return;
  if(event.type==='auxclick'&&event.button!==1)return;
  try {
   if(!source)bad('來源尚未通過核對。');const sourceId=target.dataset.fcSource;if(!source.catalogue.sources.some(item=>item.id===sourceId))bad('來源引用不明。');
   const previousOptions=historyOptionsMarkup();
   commit((candidate,makeId)=>{freezeInitial(candidate,makeId,'開啟外部來源');const current=currentRound(candidate),refs=[`source:${sourceId}`];expose(current,'displayedHere',refs);addEvent(current,makeId,'source',event.type==='contextmenu'?'開啟來源連結選單（不證明已開啟或閱讀）':'啟動外部來源連結（不證明已閱讀）',refs);},'原始初判已固定；來源開啟不等於已讀。',{hide:false,repaint:false});
   // Keep the activated anchor connected through its native default action.
   for(const key of INITIAL_KEYS){const field=root.querySelector(`[data-fc-writing="${key}"]`);if(field)field.readOnly=true;}
   const marker=root.querySelector('[data-fc-initial]');if(marker){marker.setAttribute('data-fc-initial','frozen');marker.textContent='原始初判已固定；後續想法寫在觀察與修訂。';}
   const freezeButton=root.querySelector('[data-fc-action="freeze"]');if(freezeButton)freezeButton.disabled=true;
   // Refresh receipts in place: no source ancestor, details, or input node is replaced.
   const history=root.querySelector('[data-fc-history]'),nextOptions=historyOptionsMarkup();
   if(history&&previousOptions!==nextOptions){history.innerHTML=nextOptions;history.value=`${selection().setId}|${selection().roundId}|${selection().snapshotId??'current'}`;}
   const exposure=root.querySelector('[data-fc-exposure]');if(exposure)exposure.textContent=exposureText(allExposure(slot.session));
   const summary=root.querySelector('[data-fc-summary]');
   if(summary){
    const selected=root.ownerDocument?.activeElement===summary&&Number.isInteger(summary.selectionStart),start=summary.selectionStart,end=summary.selectionEnd,direction=summary.selectionDirection,scrollTop=summary.scrollTop,scrollLeft=summary.scrollLeft;
    summary.value=buildFermentationSummary(slot.session,source).text;
    if(selected&&typeof summary.setSelectionRange==='function')try{summary.setSelectionRange(start,end,direction);}catch{}
    if(Number.isFinite(scrollTop))summary.scrollTop=scrollTop;if(Number.isFinite(scrollLeft))summary.scrollLeft=scrollLeft;
   }
  }catch(error){event.preventDefault?.();showError(error);}
 }
 function click(event) {if(event.target?.closest?.('[data-fc-source]'))sourceEvent(event);else action(event);}
 const handlers=[['click',click,false],['auxclick',sourceEvent,false],['contextmenu',sourceEvent,false],['input',input,false],['change',change,false],['toggle',toggle,true]];
 for(const [type,handler,options] of handlers)root.addEventListener(type,handler,options);
 function dispose() {if(disposed)return;disposed=true;loadEpoch++;slot.importEpoch++;abort.abort();for(const [type,handler,options] of handlers)root.removeEventListener(type,handler,options);if(slot.refresh===refresh)slot.refresh=null;if(slot.dispose===dispose)slot.dispose=null;}
 slot.dispose=dispose;void load();return dispose;
}
