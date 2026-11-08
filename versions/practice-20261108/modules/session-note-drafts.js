import {validateState} from './storage.js';

// This namespace contains drafts only. It is separate from the formal notebook
// and lives in sessionStorage for this origin and tab, when storage is available.
export const NAMESPACE='sugar-lab-note-draft/v1:';
// Include JSON escaping overhead for 500 bounded events and their states.
const SCHEMA='sugar-lab-note-draft/v1',MAX_RAW_LENGTH=2000000;
let fallbackRevision=0;
const clone=value=>structuredClone(value);
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function boundedText(value,max,name,{empty=true}={}){
 if(typeof value!=='string'||value.length>max||(!empty&&!value))throw new Error(`Invalid draft ${name}.`);
 return value;
}
export function sessionNoteDraftKey(kind,scope){
 if(!['snapshot','edit'].includes(kind))throw new Error('Invalid draft kind.');
 boundedText(scope,kind==='edit'?100:4096,'scope',{empty:false});
 // JSON quoting also gives lone UTF-16 surrogates a stable escaped spelling;
 // imported formal note IDs are arbitrary strings, including those code units.
 return NAMESPACE+kind+':'+encodeURIComponent(JSON.stringify(scope));
}
function validDraft(kind,value){
 if(!object(value))throw new Error('Invalid draft data.');
 const title=boundedText(value.title,160,'title'),text=boundedText(value.text,10000,'text');
 if(kind==='edit'){
  if(value.base!==undefined&&!object(value.base))throw new Error('Invalid draft baseline.');
  return {title,text,...(value.base!==undefined?{base:{title:boundedText(value.base.title,160,'baseline title'),text:boundedText(value.base.text,10000,'baseline text')}}:{})};
 }
 const id=boundedText(value.id,100,'id',{empty:false}),state=validateState(value.state);
 if(!Array.isArray(value.events)||value.events.length>500)throw new Error('Invalid draft events.');
 const events=value.events.map(event=>{
  if(!object(event)||!Number.isFinite(event.at))throw new Error('Invalid draft event.');
  const label=boundedText(event.label,200,'event label');
  return {at:event.at,label,...(event.state!==undefined?{state:validateState(event.state)}:{})};
 });
 if(value.giComparison!==undefined&&typeof value.giComparison!=='boolean')throw new Error('Invalid draft comparison.');
 return {id,title,text,state,events,giComparison:value.giComparison??false};
}
function revision(){
 try{const token=globalThis.crypto?.randomUUID?.();if(token)return token;}catch{}
 return Date.now().toString(36)+'-'+(++fallbackRevision).toString(36)+'-'+Math.random().toString(36).slice(2);
}
function decode(raw,kind,scope){
 if(raw===null)return null;
 if(typeof raw!=='string'||raw.length>MAX_RAW_LENGTH)throw new Error('Invalid draft record.');
 const value=JSON.parse(raw);
 if(!object(value)||value.schema!==SCHEMA||value.kind!==kind||value.scope!==scope||typeof value.revision!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(value.revision))throw new Error('Invalid draft record.');
 if(value.cleared===true){
  if(value.draft!==undefined)throw new Error('Invalid cleared draft.');
  return {revision:value.revision,cleared:true};
 }
 if(value.cleared!==undefined)throw new Error('Invalid draft record.');
 return {revision:value.revision,draft:validDraft(kind,value.draft)};
}
function encode(kind,scope,record){return JSON.stringify({schema:SCHEMA,kind,scope,...record});}
const result=entry=>({draft:entry?.draft?clone(entry.draft):null,revision:entry?.revision??null,persistence:entry?.persistence??'memory',error:entry?.error??null});

/**
 * Drafts never write to NotebookStore. Storage is resolved lazily, including its
 * throwing browser accessor. isSaved checks validated drafts against the formal
 * notebook if a failed storage operation left a saved revision behind on reload.
 */
export function createSessionNoteDraftStore({getStorage=()=>globalThis.sessionStorage,isSaved=()=>false}={}){
 const memory=new Map(),suppressed=new Map();
 const suppress=(key,token)=>{let tokens=suppressed.get(key);if(!tokens){tokens=new Set();suppressed.set(key,tokens);}tokens.add(token);};
 const storage=()=>{const target=getStorage();if(!target||typeof target.getItem!=='function')throw new Error('Session draft storage is unavailable.');return target;};
 const hidden=(key,kind,scope,record)=>{
  if(!record)return false;
  if(record.cleared||suppressed.get(key)?.has(record.revision))return true;
  if(isSaved(kind,scope,clone(record.draft))){suppress(key,record.revision);return true;}
  return false;
 };
 function read(kind,scope){
  const key=sessionNoteDraftKey(kind,scope),local=memory.get(key);
  // A failed write leaves the newest text in memory; an older storage value must
  // never replace it. A later explicit write can retry persistence.
  if(local?.persistence==='memory')return result(local);
  try{
   const record=decode(storage().getItem(key),kind,scope);
   if(!record||hidden(key,kind,scope,record)){memory.delete(key);return null;}
   const entry={...record,persistence:'session',error:null};memory.set(key,entry);return result(entry);
  }catch(error){
   if(local){const entry={...local,persistence:'memory',error};memory.set(key,entry);return result(entry);}
   return {draft:null,revision:null,persistence:'memory',error};
  }
 }
 function write(kind,scope,value){
  const key=sessionNoteDraftKey(kind,scope),draft=validDraft(kind,value),previous=memory.get(key);
  let entry={draft,revision:previous&&JSON.stringify(previous.draft)===JSON.stringify(draft)?previous.revision:revision(),predecessors:new Set(previous?.predecessors),persistence:'memory',error:null};
  memory.set(key,entry);
  try{
   const target=storage(),stored=decode(target.getItem(key),kind,scope);
   // Invalid or foreign records throw above and remain byte-for-byte untouched.
   if(!previous&&stored?.draft&&!hidden(key,kind,scope,stored)&&JSON.stringify(stored.draft)===JSON.stringify(draft))entry.revision=stored.revision;
   if(stored?.draft&&stored.revision!==entry.revision)entry.predecessors.add(stored.revision);
   target.setItem(key,encode(kind,scope,{revision:entry.revision,draft}));
   entry={...entry,persistence:'session'};
  }catch(error){entry={...entry,error};}
  memory.set(key,entry);return result(entry);
 }
 function clear(kind,scope,expectedRevision){
  const key=sessionNoteDraftKey(kind,scope),local=memory.get(key);
  if(typeof expectedRevision!=='string'||!expectedRevision)return {cleared:false,persistence:local?.persistence??'memory',error:null};
  if(local&&local.revision!==expectedRevision)return {cleared:false,persistence:local.persistence,error:null};
  // Suppression also applies when the browser refuses both cleanup operations.
  // On reload, isSaved supplies the formal notebook evidence for that case.
  suppress(key,expectedRevision);if(local)memory.delete(key);
  let target,stored;
  try{target=storage();stored=decode(target.getItem(key),kind,scope);}catch(error){return {cleared:false,persistence:'memory',error};}
  // A failed new write can leave its known predecessor behind. Only the current
  // in-memory revision can clean that ancestor; an unrelated newer writer wins.
  if(stored&&stored.revision!==expectedRevision&&!(local?.revision===expectedRevision&&local.predecessors?.has(stored.revision)))return {cleared:false,persistence:'session',error:null};
  if(stored)suppress(key,stored.revision);
  if(!stored)return {cleared:true,persistence:'session',error:null};
  // Write a tombstone first: a failed remove must not restore a committed draft.
  let tombstoneError=null,tombstone=false;
  try{target.setItem(key,encode(kind,scope,{revision:expectedRevision,cleared:true}));tombstone=true;}catch(error){tombstoneError=error;}
  try{target.removeItem(key);return {cleared:true,persistence:'session',error:null};}
  catch(error){return {cleared:false,persistence:tombstone?'session':'memory',error:tombstoneError??error};}
 }
 return {read,write,clear};
}
