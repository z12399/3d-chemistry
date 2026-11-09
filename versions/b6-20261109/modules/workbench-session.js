import {learningNoteDraft,saveLearningNote,appendLearningNoteSummary} from './learning-note-model.js';

export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// HTML removes one immediate LF after <textarea>; the draft's own whitespace remains intact.
export const textareaValue=value=>'\n'+escapeHtml(value);
const notify=record=>{for(const listener of record.listeners)listener();};
const summaryOf=record=>{const text=record.buildSummary(record.draft);if(typeof text!=='string'||!text.trim())throw new TypeError('摘要尚未完整。');return text;};

export function createWorkbenchSessionStore({createDraft,buildSummary}){
  const owners=new WeakMap();
  return {get(owner,key){
    if(!owner||!['object','function'].includes(typeof owner))throw new TypeError('A draft owner is required');
    let slots=owners.get(owner);if(!slots){slots=new Map();owners.set(owner,slots);}
    if(!slots.has(key)){
      const draft=createDraft();
      slots.set(key,{draft,buildSummary,pending:null,listeners:new Set(),message:'',status:'idle',observedSummary:buildSummary(draft)});
    }
    return slots.get(key);
  }};
}

export function subscribeWorkbench(record,listener){record.listeners.add(listener);return()=>record.listeners.delete(listener);}
export function markWorkbenchChanged(record){
  const current=record.buildSummary(record.draft);
  if(current===record.observedSummary)return false;
  record.observedSummary=current;
  record.status=record.pending?'saving':'dirty';
  record.message=record.pending?'正在附加保存當時的內容；目前的新變更尚未附加。':'目前變更尚未附加到本課筆記。';
  notify(record);return true;
}
export function refreshWorkbenchFeedback(record){
  const changed=markWorkbenchChanged(record);
  if(!changed&&!record.pending&&record.status==='saved'){record.status='idle';record.message='';}
}

export function saveWorkbenchSummary(record,onSaveSummary){
  // One request per session at a time, including edits/remounts during an earlier save.
  if(record.pending)return record.pending;
  let summary;
  try{summary=summaryOf(record);}catch(error){record.status='failed';record.message=error.message;notify(record);return Promise.resolve({status:'failed',summary:null});}
  record.observedSummary=summary;record.status='saving';record.message='正在附加到本課筆記…';
  const pending=Promise.resolve().then(async()=>{
    let saved=false;
    try{saved=typeof onSaveSummary==='function'&&await onSaveSummary(summary)===true;}catch{saved=false;}
    record.pending=null;
    const same=record.buildSummary(record.draft)===summary;
    record.status=saved?(same?'saved':'dirty'):'failed';
    record.message=saved?(same?'已附加到本課筆記。':'已附加保存當時的內容；目前的新變更尚未附加。'):'未附加成功；選擇和觀察仍保留，可再試一次。';
    notify(record);return {status:saved?'saved':'failed',summary};
  });
  record.pending=pending;notify(record);return pending;
}

// The host calls this only while its original lesson is still mounted.
// Duplicate checks use the current note and still verify persistence/concurrency.
export function appendWorkbenchSummary(progress,id,summary,{baseNote,onStatus}={}){
  if(typeof summary!=='string'||!summary.trim())throw new TypeError('摘要無效，尚未保存。');
  try{
    const existing=learningNoteDraft(progress,id)?.note??baseNote??progress.data?.records?.[id]?.note??'';
    const saved=existing.includes(summary)?saveLearningNote(progress,id,existing,{baseNote}):appendLearningNoteSummary(progress,id,summary,{baseNote});
    onStatus?.(saved);return saved;
  }catch(error){onStatus?.(null);throw error;}
}
