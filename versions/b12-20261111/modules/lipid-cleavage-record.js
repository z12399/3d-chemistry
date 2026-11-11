// Runtime records preserve learner text. Chemistry is checked by the separate model.
export const LIPID_SESSION_SCHEMA='lipid-cleavage-session/v1';
export const LIPID_LIMITS=Object.freeze({sessionBytes:8*1024*1024,payloadBytes:300000,recordSets:20,series:100,snapshots:300,events:2000,textChars:10000});
const encoder=new TextEncoder(), HEX=/^[a-f0-9]{64}$/, VARIANTS=['unknown','EE','EZ'];
const copy=value=>JSON.parse(JSON.stringify(value));
export const lipidUtf8Bytes=value=>encoder.encode(value).byteLength;
const fail=message=>{throw new Error(message);};
const obj=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const exact=(value,keys,label)=>{if(!obj(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))fail(`${label} 欄位不完整或含未支援欄位。`);};
const text=(value,max,label,{empty=true}={})=>{if(typeof value!=='string'||value.length>max||!empty&&!value.length)fail(`${label} 文字長度無效。`);};
const id=(value,label)=>{text(value,80,label,{empty:false});if(!/^[a-zA-Z0-9_.:-]+$/.test(value))fail(`${label} 識別碼無效。`);};
const arr=(value,max,label)=>{if(!Array.isArray(value)||value.length>max)fail(`${label} 數量超過上限。`);};
const jsonStatus=raw=>{try{JSON.parse(raw);return 'valid-json';}catch{return 'invalid-json';}};
const unique=(items,prefix)=>{let n=1;const used=new Set(items.map(item=>item.id));while(used.has(`${prefix}${n}`))n++;return `${prefix}${n}`;};
export function stableLipidJson(value){if(Array.isArray(value))return `[${value.map(stableLipidJson).join(',')}]`;if(obj(value))return `{${Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stableLipidJson(value[key])).join(',')}}`;return JSON.stringify(value);}
export async function lipidRawHash(raw){if(typeof raw!=='string')throw new TypeError('原稿必須是文字。');return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',encoder.encode(raw)))].map(v=>v.toString(16).padStart(2,'0')).join('');}
function rawCheck(raw,label='原稿'){text(raw,LIPID_LIMITS.payloadBytes,label);if(lipidUtf8Bytes(raw)>LIPID_LIMITS.payloadBytes)fail(`${label} 超過 300,000 UTF-8 bytes；內容未裁切。`);}
function checkInitial(ref,context){
 exact(ref,['geometryVariant','stateId','graphSha256','sourceManifestSha256'],'起態');
 if(!VARIANTS.includes(ref.geometryVariant)||ref.stateId!==`start-${ref.geometryVariant}`||!HEX.test(ref.graphSha256)||!HEX.test(ref.sourceManifestSha256))fail('起態識別無效。');
 if(!context?.starts?.[ref.geometryVariant]||stableLipidJson(ref)!==stableLipidJson(context.starts[ref.geometryVariant]))fail('起態與已核對來源不符。');
}
function checkSource(value,context){text(value,65536,'來源識別',{empty:false});if(typeof context?.sourceIdentityRaw!=='string'||value!==context.sourceIdentityRaw)fail('來源版本不符；原工作保留。');}
export function lipidCurrent(session){const set=session.recordSets.find(item=>item.key===session.selection.setKey);const series=set?.series.find(item=>item.id===session.selection.seriesId);if(!set||!series)fail('找不到目前系列。');return {set,series,snapshot:session.selection.snapshotId===null?null:series.snapshots.find(item=>item.id===session.selection.snapshotId)};}
function budget(session){
 if(session.recordSets.length>LIPID_LIMITS.recordSets)fail('方案組超過 20 組；原工作保留。');
 const all=session.recordSets.flatMap(set=>set.series);
 if(all.length>LIPID_LIMITS.series)fail('系列超過 100 組；原工作保留。');
 if(all.reduce((n,s)=>n+s.snapshots.length,0)>LIPID_LIMITS.snapshots)fail('原稿快照超過 300 份；請另下載目前工作。');
 if(all.reduce((n,s)=>n+s.events.length,0)>LIPID_LIMITS.events)fail('事件超過 2,000 筆；原工作保留。');
 if(lipidUtf8Bytes(JSON.stringify(session))>LIPID_LIMITS.sessionBytes)fail('合併後方案超過 8 MiB；原工作保留，沒有裁切。');
 return session;
}
const working=raw=>({raw,observation:'',parentId:'NONE'});
const makeSeries=(id,initialStateRef,raw)=>({id,initialStateRef:copy(initialStateRef),working:working(raw),snapshots:[],events:[]});
export function createLipidSession(context,initialStateRef,raw){
 checkInitial(initialStateRef,context);rawCheck(raw);
 return budget({schemaVersion:LIPID_SESSION_SCHEMA,sourceIdentityRaw:context.sourceIdentityRaw,recordSets:[{key:'set1',provenance:{kind:'local',fileName:'',originalSetKey:'set1',priorProvenanceRaw:'',importedEventHorizon:{}},series:[makeSeries('series1',initialStateRef,raw)]}],selection:{setKey:'set1',seriesId:'series1',snapshotId:null}});
}
export function replaceLipidWorking(session,raw,observation){rawCheck(raw);const next=copy(session),{series}=lipidCurrent(next);if(next.selection.snapshotId!==null)fail('歷史原稿唯讀；請建立修訂。');series.working.raw=raw;if(observation!==undefined){text(observation,LIPID_LIMITS.textChars,'觀察');series.working.observation=observation;}return budget(next);}
export function newLipidSeries(session,context,initialStateRef,raw){
 checkInitial(initialStateRef,context);rawCheck(raw);const next=copy(session),{set}=lipidCurrent(next);
 const seriesId=unique(set.series,'series');
 set.series.push(makeSeries(seriesId,initialStateRef,raw));next.selection={setKey:set.key,seriesId,snapshotId:null};return budget(next);
}
export async function captureLipidRaw(raw,kind='draft'){
 rawCheck(raw);if(!['draft','submission','raw'].includes(kind))fail('不支援原稿類型。');
 return {kind,raw,sha256:await lipidRawHash(raw),parseStatus:jsonStatus(raw)};
}
function eventAdd(series,kind,snapshotId,payload){
 if(!['saved','compile','assessment','source-display','source-request','observation','course-exposure'].includes(kind))fail('不支援事件。');
 rawCheck(payload,'事件原文');const n=series.events.length+1;
 series.events.push({id:unique(series.events,'e'),sequence:n,kind,snapshotId,payload});
}
export function appendLipidCapture(session,captured,{setKey=session.selection.setKey,seriesId=session.selection.seriesId,parentId}={}){
 const next=copy(session),set=next.recordSets.find(item=>item.key===setKey),series=set?.series.find(item=>item.id===seriesId);
 if(!series)fail('原稿所屬系列已不存在。');
 exact(captured,['kind','raw','sha256','parseStatus'],'捕獲原稿');rawCheck(captured.raw);if(!HEX.test(captured.sha256)||captured.parseStatus!==jsonStatus(captured.raw))fail('捕獲原稿狀態無效。');
 const parent=parentId??series.working.parentId,previous=series.snapshots.find(item=>item.id===parent);
 if(parent==='NONE'?series.snapshots.length!==0:!previous)fail('原稿父版不存在；沒有改寫既有譜系。');
 const id=unique(series.snapshots,'a'),snapshot={id,parentId:parent,revision:previous?previous.revision+1:1,...copy(captured)};
 series.snapshots.push(snapshot);eventAdd(series,'saved',id,JSON.stringify({kind:captured.kind}));
 if(series.working.parentId===parent)series.working.parentId=id;
 return {session:budget(next),snapshotId:id};
}
export function appendLipidEvent(session,kind,snapshotId,payload,selection=session.selection){
 const next=copy(session),series=next.recordSets.find(set=>set.key===selection.setKey)?.series.find(s=>s.id===selection.seriesId);
 if(!series||!series.snapshots.some(s=>s.id===snapshotId))fail('事件必須連到已保留原稿。');
 eventAdd(series,kind,snapshotId,payload);return budget(next);
}
export function selectLipidHistory(session,setKey,seriesId,snapshotId=null){
 const next=copy(session),series=next.recordSets.find(set=>set.key===setKey)?.series.find(s=>s.id===seriesId);
 if(!series||snapshotId!==null&&!series.snapshots.some(s=>s.id===snapshotId))fail('歷史選取不存在。');
 next.selection={setKey,seriesId,snapshotId};return next;
}
export function reviseLipidSnapshot(session){
 const {snapshot,series}=lipidCurrent(session);if(!snapshot)fail('請先選歷史原稿。');if(!series.snapshots.some(item=>item.raw===series.working.raw))fail('請先保留目前尚未提交的草稿，再建立歷史修訂。');const next=copy(session);next.selection.snapshotId=null;
 lipidCurrent(next).series.working.raw=snapshot.raw;lipidCurrent(next).series.working.parentId=snapshot.id;return budget(next);
}
export async function validateLipidSession(raw,context){
 if(typeof raw!=='string')throw new TypeError('方案檔必須是 JSON 文字。');
 if(lipidUtf8Bytes(raw)>LIPID_LIMITS.sessionBytes)fail('方案檔超過 8 MiB。');
 let value;try{value=JSON.parse(raw);}catch{fail('方案外層 JSON 損壞；原工作保留。');}
 exact(value,['schemaVersion','sourceIdentityRaw','recordSets','selection'],'方案');if(value.schemaVersion!==LIPID_SESSION_SCHEMA)fail('不支援方案版本。');checkSource(value.sourceIdentityRaw,context);
 arr(value.recordSets,LIPID_LIMITS.recordSets,'方案組');if(!value.recordSets.length)fail('方案不可沒有系列。');
 const setKeys=new Set(),hashes=[];
 for(const set of value.recordSets){
  exact(set,['key','provenance','series'],'方案組');id(set.key,'方案組');if(setKeys.has(set.key))fail('方案組識別重複。');setKeys.add(set.key);
  exact(set.provenance,['kind','fileName','originalSetKey','priorProvenanceRaw','importedEventHorizon'],'匯入來源');if(!['local','imported'].includes(set.provenance.kind))fail('匯入來源類型無效。');text(set.provenance.fileName,500,'檔名');id(set.provenance.originalSetKey,'原方案組');rawCheck(set.provenance.priorProvenanceRaw,'原 provenance');if(!obj(set.provenance.importedEventHorizon))fail('匯入事件邊界無效。');
  arr(set.series,LIPID_LIMITS.series,'系列');if(!set.series.length)fail('方案組沒有系列。');const seriesIds=new Set();
  for(const series of set.series){
   exact(series,['id','initialStateRef','working','snapshots','events'],'系列');id(series.id,'系列');if(seriesIds.has(series.id))fail('系列識別重複。');seriesIds.add(series.id);checkInitial(series.initialStateRef,context);
   exact(series.working,['raw','observation','parentId'],'目前草稿');rawCheck(series.working.raw);text(series.working.observation,LIPID_LIMITS.textChars,'觀察');id(series.working.parentId,'草稿父版');
   arr(series.snapshots,LIPID_LIMITS.snapshots,'快照');arr(series.events,LIPID_LIMITS.events,'事件');const snapshotIds=new Set();
   for(const [index,snapshot] of series.snapshots.entries()){
    exact(snapshot,['id','parentId','revision','kind','raw','sha256','parseStatus'],'快照');id(snapshot.id,'快照');if(snapshotIds.has(snapshot.id))fail('快照識別重複。');
    const parent=index?series.snapshots.slice(0,index).find(item=>item.id===snapshot.parentId):null;
    if(index===0?snapshot.parentId!=='NONE'||snapshot.revision!==1:!parent||snapshot.revision!==parent.revision+1)fail('原稿父子關係或修訂順序無效。');snapshotIds.add(snapshot.id);
    if(!['draft','submission','raw'].includes(snapshot.kind))fail('原稿類型無效。');rawCheck(snapshot.raw);if(!HEX.test(snapshot.sha256)||snapshot.parseStatus!==jsonStatus(snapshot.raw))fail('原稿解析狀態或 hash 格式無效。');
    // Invalid child text remains archival data. Valid chemistry payloads cannot silently change the declared initial state.
    if(snapshot.kind!=='raw'&&snapshot.parseStatus==='valid-json'){const inner=JSON.parse(snapshot.raw);if(obj(inner)&&Object.hasOwn(inner,'initialStateRef')&&stableLipidJson(inner.initialStateRef)!==stableLipidJson(series.initialStateRef))fail('原稿的起態與所屬系列不符。');}
    hashes.push({raw:snapshot.raw,sha256:snapshot.sha256});
   }
   if(series.snapshots.length?!snapshotIds.has(series.working.parentId):series.working.parentId!=='NONE')fail('目前草稿的父版不存在。');
   const eventIds=new Set(),saved=new Set();
   for(const [index,event] of series.events.entries()){
    exact(event,['id','sequence','kind','snapshotId','payload'],'事件');id(event.id,'事件');if(eventIds.has(event.id)||event.sequence!==index+1)fail('事件識別或順序無效。');eventIds.add(event.id);
    if(!['saved','compile','assessment','source-display','source-request','observation','course-exposure'].includes(event.kind)||!snapshotIds.has(event.snapshotId))fail('事件連結無效。');rawCheck(event.payload,'事件原文');
    if(event.kind==='saved'){if(saved.has(event.snapshotId))fail('原稿保存事件重複。');saved.add(event.snapshotId);}else if(!saved.has(event.snapshotId))fail('評估或來源事件出現在原稿保存之前。');
   }
   if(saved.size!==snapshotIds.size)fail('原稿缺少保存事件。');
  }
  for(const [seriesId,horizon] of Object.entries(set.provenance.importedEventHorizon)){const series=set.series.find(item=>item.id===seriesId);if(set.provenance.kind!=='imported'||!series||!Number.isInteger(horizon)||horizon<0||horizon>series.events.length)fail('匯入事件邊界與系列不符。');}
  if(set.provenance.kind==='imported'&&!Object.keys(set.provenance.importedEventHorizon).length)fail('匯入紀錄缺少原事件邊界。');
 }
 exact(value.selection,['setKey','seriesId','snapshotId'],'選取');id(value.selection.setKey,'選取方案組');id(value.selection.seriesId,'選取系列');if(value.selection.snapshotId!==null)id(value.selection.snapshotId,'選取原稿');
 const selected=lipidCurrent(value);if(value.selection.snapshotId!==null&&!selected.snapshot)fail('選取的原稿不存在。');budget(value);
 // Do not start rejection-producing async work until all synchronous envelope checks pass.
 await Promise.all(hashes.map(async snapshot=>{if(await lipidRawHash(snapshot.raw)!==snapshot.sha256)fail('原稿 hash 不符；不重建或覆寫。');}));return value;
}
export async function serializeLipidSession(session,context){const raw=JSON.stringify(session,null,2);await validateLipidSession(raw,context);return raw;}
export async function mergeLipidSession(session,incomingRaw,context,fileName=''){
 text(fileName,500,'檔名');const incoming=await validateLipidSession(incomingRaw,context),next=copy(session);await validateLipidSession(JSON.stringify(next),context);
 let n=1;const used=new Set(next.recordSets.map(set=>set.key));
 for(const original of incoming.recordSets){while(used.has(`set${n}`))n++;const set=copy(original);set.key=`set${n++}`;used.add(set.key);set.provenance={kind:'imported',fileName,originalSetKey:original.key,priorProvenanceRaw:JSON.stringify(original.provenance),importedEventHorizon:Object.fromEntries(original.series.map(s=>[s.id,s.events.length]))};next.recordSets.push(set);}
 // Current local selection and all imported inner IDs/raw payloads are untouched.
 budget(next);await validateLipidSession(JSON.stringify(next),context);return next;
}
export function lipidEventOrigin(set,series,event){return set.provenance.kind==='imported'&&event.sequence<=(set.provenance.importedEventHorizon[series.id]??0)?'imported-claim':'observed-here';}
function concisePayload(raw){
 let item;try{item=JSON.parse(raw);}catch{return '原文不是有效 JSON；完整內容保留於方案檔與完整文字。';}
 if(!obj(item))return '原文不是圖式物件；完整內容保留於方案檔。';
 const selected={};for(const key of ['choices','numbering','geometry','virtualMarkers','explanation','evidenceClaims','formal','evidence','status','issues','text','sourceId','display','submissionStatus'])if(Object.hasOwn(item,key))selected[key]=item[key];
 if(Array.isArray(item.candidateGraph?.components))selected.fragments=item.candidateGraph.components.filter(obj).map(c=>({id:c.id,role:c.role,localAtomCounts:c.localAtomCounts,radicalKind:c.radicalKind}));
 return Object.keys(selected).length?JSON.stringify(selected):'完整原文保留於方案檔與完整文字。';
}
export function lipidFullText(session){
 const parts=['脂肪斷鏈完整紀錄；已保存原稿、目前草稿及事件依序列出。'];
 for(const set of session.recordSets)for(const series of set.series){parts.push(`${set.key}/${series.id}｜${series.initialStateRef.geometryVariant}｜${set.provenance.kind==='imported'?'含匯入檔自述':'本頁紀錄'}`,`起態：${JSON.stringify(series.initialStateRef)}`,`目前草稿（父版 ${series.working.parentId}）\n${series.working.raw}`,`目前觀察\n${series.working.observation}`);for(const snapshot of series.snapshots)parts.push(`原稿 ${snapshot.id} ${snapshot.kind} ${snapshot.sha256}\n${snapshot.raw}`);for(const event of series.events)parts.push(`事件 ${event.sequence} ${event.kind} → ${event.snapshotId}｜${lipidEventOrigin(set,series,event)==='imported-claim'?'檔案自述':'本頁紀錄'}\n${event.payload}`);}
 return parts.join('\n\n');
}
export function lipidSummary(session,cursor={}){
 const nextCursor={...cursor},parts=[];
 for(const set of session.recordSets)for(const series of set.series){
  const key=`${set.key}/${series.id}`,start=cursor[key]??0;if(start>series.events.length)fail('筆記游標超出事件。');
  const fresh=series.events.slice(start);if(!fresh.length)continue;
  parts.push(`脂肪斷鏈｜${series.initialStateRef.geometryVariant} 題設｜${key}${set.provenance.kind==='imported'?'｜匯入檔自述':''}`);
  for(const event of fresh){parts.push(`事件 ${event.sequence} ${event.kind} → ${event.snapshotId}｜${lipidEventOrigin(set,series,event)==='imported-claim'?'檔案自述':'本頁紀錄'}`);if(event.kind==='saved'){const snap=series.snapshots.find(s=>s.id===event.snapshotId);parts.push(`原稿 ${snap.kind} SHA-256 ${snap.sha256}\n${concisePayload(snap.raw)}`);}else parts.push(concisePayload(event.payload));}
  nextCursor[key]=series.events.length;
 }
 return {text:parts.join('\n\n'),cursor:nextCursor};
}
