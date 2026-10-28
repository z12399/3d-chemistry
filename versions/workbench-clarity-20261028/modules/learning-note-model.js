// Same-page drafts belong to their subject's existing progress object and lesson.
// They never enter durable progress, its export, or navigation/quiz save intents.
const drafts=new WeakMap();
const noteOf=(data,id)=>data?.records?.[id]?.note||'';
const mapFor=progress=>{let map=drafts.get(progress);if(!map){map=new Map();drafts.set(progress,map);}return map;};
function conflict(draft,remoteNote){
  draft.conflict=true;draft.remoteNote=remoteNote;
  draft.error='另一個視窗已修改本課筆記；已停止本頁重試。';
}
function checkLatest(progress,id,draft){
  if(draft.conflict)return false;
  const latest=progress.readLatest();
  if(latest===null){draft.error=progress.error||'無法核對已保存的筆記，已停止寫入。';return false;}
  const remoteNote=noteOf(latest,id);
  // An explicit clear is also an edit. A later refresh/visit/import must not
  // replace the baseline of the text that the learner actually saw and edited.
  if(remoteNote!==draft.baseNote&&remoteNote!==draft.note){conflict(draft,remoteNote);return false;}
  return true;
}
export function learningNoteDraft(progress,id,{check=false}={}){
  const draft=drafts.get(progress)?.get(id);
  if(draft&&check)checkLatest(progress,id,draft);
  return draft;
}
export function learningNoteDraftEntries(progress){return [...(drafts.get(progress)||[])];}
export function learningNoteMessage(draft,progress){
  const error=(draft?.error||'此瀏覽器目前無法寫入。').replace('請匯出學習紀錄。','請先複製這份筆記草稿。').replace('請先匯出草稿與原始資料，再重新載入。','請先複製這份筆記草稿，並匯出原始資料，再重新載入。');
  if(draft?.conflict)return '尚未保存。'+error+' 未保存筆記不包含在匯出；請分別複製本地草稿與另一頁筆記，再重新載入比較。';
  if(draft)return '尚未保存。'+error+' 未保存筆記不包含在匯出。草稿只在本頁暫留；可重試，重新整理或關頁前請先複製。';
  return progress.error?'目前無法確認保存狀態；請保留文字並查看下方狀態。':null;
}
export function learningNoteStatus(progress,id,note){
  const draft=learningNoteDraft(progress,id,{check:true});
  if(draft)return learningNoteMessage(draft,progress);
  const latest=progress.readLatest();
  if(latest===null||noteOf(latest,id)!==note)return '目前無法確認這份筆記已保存；請先複製文字，並核對另一頁筆記或下方狀態。';
  return learningNoteMessage(null,progress)||(note?'已保存在此瀏覽器':'輸入後嘗試自動保存在此瀏覽器。');
}
export function saveLearningNote(progress,id,note,{baseNote}={}){
  if(typeof note!=='string')throw new TypeError('筆記必須是文字。');
  const map=mapFor(progress),previous=map.get(id);
  const draft=previous?{...previous,note}:{note,baseNote:baseNote??noteOf(progress.data,id),error:''};
  if(!draft.conflict)draft.error='';
  map.set(id,draft);
  let saved=null;
  try {
    if(checkLatest(progress,id,draft))saved=progress.record(id,{note},{retainOnFailure:false});
  } catch(error) {
    draft.error=error?.message||'保存失敗。';
    if(/另一個視窗/.test(draft.error)){
      const latest=progress.readLatest();if(latest!==null)conflict(draft,noteOf(latest,id));
    }
  }
  if(saved===true)map.delete(id);
  else draft.error=draft.error||progress.error||'此瀏覽器目前無法寫入。';
  return saved;
}
export function appendLearningNoteSummary(progress,id,summary,{baseNote}={}){
  if(typeof summary!=='string'||!summary.trim())throw new Error('摘要無效，尚未保存。');
  const previous=learningNoteDraft(progress,id);
  // Mounted activities supply their rendered baseline. Standalone callers have
  // no visible old snapshot and first reconcile the original progress pipeline.
  const refreshFailed=!previous&&baseNote===undefined&&progress.refresh()===false;
  const existing=previous?previous.note:baseNote??noteOf(progress.data,id);
  const note=existing.endsWith(summary)?existing:(existing?existing+'\n\n':'')+summary;
  if(note.length>10000)throw new Error('本課筆記加上摘要超過 10,000 字，請先複製摘要並整理筆記。');
  if(refreshFailed){
    // Preserve the old two-argument lactose API: a read/reconciliation failure
    // throws, but the exact appended text remains copyable outside progress.
    const draft={note,baseNote:existing,error:progress.error||'無法核對最新筆記，請先複製摘要。'};
    mapFor(progress).set(id,draft);checkLatest(progress,id,draft);
    throw new Error(draft.error);
  }
  return saveLearningNote(progress,id,note,{baseNote:previous?.baseNote??existing});
}
