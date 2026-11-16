import {escapeHTML as esc} from './storage.js';
import {ELECTRON_CATALOG_ENTRIES,resolveElectronEntry} from './electron-catalog.js';
import {mountElectronWorkbench,hasUnsavedElectronDrafts} from './electron-workbench.js';
import {mountElectronSandbox,hasUnsavedElectronSandboxDrafts} from './electron-sandbox.js';

export const ELECTRON_LIBRARY_IDS=Object.freeze(['electron-ring-opening-library','electron-fructose-library','electron-reducing-library','electron-imine-library','electron-enediol-library','electron-amadori-library','electron-heyns-library','electron-strecker-library']);
const SELECTION_FORMAT='electron-library-selection/v1';
const DEFAULTS={
 'electron-ring-opening-library':'electron-glucose-opening',
 'electron-fructose-library':'electron-practice-fructose-beta-pyranose',
 'electron-reducing-library':'electron-practice-lactose-acid-hydrolysis',
 'electron-imine-library':'electron-imine-hydrolysis',
 'electron-enediol-library':'electron-practice-aldose-ketose',
 'electron-amadori-library':'electron-practice-amadori',
 'electron-heyns-library':'electron-practice-heyns',
 'electron-strecker-library':'electron-practice-strecker'
};

// These three guided routes are also mounted directly by their original lessons.
const GUIDED_KEYS={
 'electron-cyclization':'carb-electron-cyclization',
 'electron-hydrolysis':'carb-electron-hydrolysis',
 'electron-condensation':'browning-electron-condensation'
};
const draftsByOwner=new WeakMap(),mountedContainers=new WeakMap();
const validOwner=owner=>owner!==null&&(typeof owner==='object'||typeof owner==='function');
const preferencesDirty=draft=>Object.values(draft.preferences).some(preference=>preference.dirty);

/** Outer preferences only; the host also checks the guided and free drafts. */
export function hasUnsavedElectronLibraryDrafts(owner){
 if(!validOwner(owner))return false;
 return [...(draftsByOwner.get(owner)?.values()||[])].some(preferencesDirty);
}

/** Same-document navigation retains local UI and child drafts without changing
 * the existing preference formats or any workbench record namespace. */
export function mountElectronLibrary(container,activityId,{draftOwner,draftKey=activityId}={}){
 if(!ELECTRON_LIBRARY_IDS.includes(activityId))throw new RangeError('Unknown electron library activity');
 const defaultId=DEFAULTS[activityId];
 resolveElectronEntry(defaultId);
 mountedContainers.get(container)?.();
 const owner=validOwner(draftOwner)?draftOwner:null;
 let draft=null;
 if(owner){
  if(!draftsByOwner.has(owner))draftsByOwner.set(owner,new Map());
  const ownerDrafts=draftsByOwner.get(owner),identity=JSON.stringify([activityId,typeof draftKey==='string'?draftKey:activityId]);
  draft=ownerDrafts.get(identity)||null;draft?.active?.();
  if(!draft){draft=createDraft();ownerDrafts.set(identity,draft);}else checkPreferenceBaselines(draft);
 }else draft=createDraft();
 const $=selector=>container.querySelector(selector);
 let disposeWorkbench=null,disposed=false;

 function createDraft(){
  const result={selected:defaultId,mode:'guided',pending:null,scopeOpen:false,active:null,preferences:{}};
  for(const field of ['selection','mode']){
   const preference={key:'food-science/'+activityId+'/'+field+'/v1',raw:null,known:false,dirty:false,error:''};
   result.preferences[field]=preference;
   try{
    preference.raw=localStorage.getItem(preference.key);preference.known=true;
    if(field==='selection'&&preference.raw){
     if(preference.raw.length>2048)throw new Error('Selection too large');
     const saved=JSON.parse(preference.raw);
     if(saved?.format!==SELECTION_FORMAT||typeof saved.entryId!=='string')throw new Error('Invalid selection');
     resolveElectronEntry(saved.entryId);result.selected=saved.entryId;
    }
    if(field==='mode'&&preference.raw==='free')result.mode='free';
   }catch{preference.error=field==='selection'?'上次的反應選擇無法讀取，先回到本課起點；各反應草稿仍由工作台分別讀取。':'上次的模式選擇無法讀取，先使用步驟練習。';}
  }
  return result;
 }
 function conflictMessage(field){return (field==='selection'?'反應選擇':'模式選擇')+'已在其他頁面變更；保留本頁選擇，尚未覆寫。';}
 function checkPreferenceBaselines(current){
  for(const [field,preference] of Object.entries(current.preferences)){
   try{
    const raw=localStorage.getItem(preference.key);
    if(!preference.known||raw!==preference.raw){preference.dirty=true;preference.error=conflictMessage(field);}
   }catch{preference.error=(field==='selection'?'反應選擇':'模式選擇')+'無法讀取；本頁選擇仍保留，尚未重新保存。';}
  }
 }
 function preferenceValue(field){return field==='selection'?JSON.stringify({format:SELECTION_FORMAT,entryId:draft.selected}):draft.mode;}
 function rememberPreference(field,explicit=false){
  const preference=draft.preferences[field];preference.dirty=true;
  try{
   const current=localStorage.getItem(preference.key);
   if(!explicit&&(!preference.known||current!==preference.raw)){preference.error=conflictMessage(field);return;}
   // Explicit retry accepts only this preference's freshly read baseline.
   if(explicit){preference.raw=current;preference.known=true;}
   const value=preferenceValue(field);localStorage.setItem(preference.key,value);
   preference.raw=value;preference.known=true;preference.dirty=false;preference.error='';
  }catch{preference.error=(field==='selection'?'這次選擇':'模式選擇')+'未能記住；作答是否保存，請看工作台的紀錄狀態。';}
 }
 const groups=[...new Set(ELECTRON_CATALOG_ENTRIES.map(e=>e.group))];
 container.innerHTML=`<section class="electron-library"><div class="electron-library-toolbar"><label>選一條路徑，自己推<select aria-label="選擇推導反應" data-electron-library-select>${groups.map(group=>`<optgroup label="${esc(group)}">${ELECTRON_CATALOG_ENTRIES.filter(e=>e.group===group).map(e=>`<option value="${esc(e.id)}">${esc(e.shortLabel||e.title)}</option>`).join('')}</optgroup>`).join('')}</select></label><button type="button" data-electron-library-home>回到本課起點</button></div><p class="electron-library-context" data-electron-library-context></p><p class="electron-library-status" role="status"></p><button type="button" class="electron-library-retry" data-electron-library-retry hidden>記住目前選擇</button><button type="button" class="electron-library-discard" data-electron-library-discard hidden>放棄本頁未保存變更並切換</button><div class="electron-library-modes" role="group" aria-label="推導模式"><button type="button" data-electron-library-mode="guided" aria-pressed="true">跟著步驟練習</button><button type="button" data-electron-library-mode="free" aria-pressed="false">自由推導</button></div><div data-electron-library-workbench></div><details class="electron-library-scope"><summary>這個反應庫包含什麼？</summary><p>收錄已核對電子收支的指定路徑；同一反應的不同環形或方向會各列一個分支。每次只操作目前這條，草稿分開保存。</p><p>本輪未納入含硼／碘、芳香吡啶及自由基的步驟；這些內容仍可在原3D實驗室查看。新重排活動可指定目的鍵兩端、最多八支箭頭；Strecker 的多水接力是主態間合併記帳。沒有將所有代數反轉都當成化學上可觀察的逆反應。</p><p>工作台比較連接與形式電荷，不判定立體選擇或速率；α／β 是參考端點的指定構型。可以回看任一步，因此查看標記不能用來證明獨立作答。</p></details></section>`;
 $('.electron-library-scope').open=draft.scopeOpen;
 function renderStatus(){
  const warnings=Object.values(draft.preferences).map(preference=>preference.error).filter(Boolean);
  if(draft.pending)warnings.unshift('目前這條路徑有未保存的作答。請先在下方紀錄區匯出；切換會離開這份未保存的草稿。');
  $('.electron-library-status').textContent=warnings.join(' ');
  $('[data-electron-library-discard]').hidden=!draft.pending;
  $('[data-electron-library-retry]').hidden=!Object.values(draft.preferences).some(preference=>preference.dirty||preference.error);
 }
 function mountCurrent(startIndex=0){
  const id=draft.selected,mode=draft.mode,entry=resolveElectronEntry(id);
  $('[data-electron-library-select]').value=id;
  $('[data-electron-library-context]').textContent=mode==='free'?'從已知結構出發，每次採用自己的鍵圖。自由推導另存，不改動步驟練習。':entry.reverse?'逆向練習 · 從目前起態重新判斷電子去向。':'每條路徑分別保存進度與草稿。';
  for(const b of container.querySelectorAll('[data-electron-library-mode]'))b.setAttribute('aria-pressed',String(b.getAttribute('data-electron-library-mode')===mode));
  const options={draftOwner:owner,draftKey:mode==='guided'?(GUIDED_KEYS[id]||id):id};
  disposeWorkbench=mode==='free'?mountElectronSandbox($('[data-electron-library-workbench]'),id,{...options,startIndex}):mountElectronWorkbench($('[data-electron-library-workbench]'),id,options);
  renderStatus();
 }
 function open(id,{force=false,remember=true,nextMode=draft.mode,startIndex=0,rememberMode=false}={}){
  if(disposed)return;
  resolveElectronEntry(id);
  if(disposeWorkbench?.canLeave?.()===false&&!force&&!(owner&&disposeWorkbench?.canResume?.()===true)){
   draft.pending={id,nextMode,startIndex,rememberMode,remember};$('[data-electron-library-select]').value=draft.selected;renderStatus();return;
  }
  disposeWorkbench?.();draft.pending=null;draft.selected=id;draft.mode=nextMode;
  mountCurrent(startIndex);
  if(remember)rememberPreference('selection');
  if(rememberMode)rememberPreference('mode');
  renderStatus();
 }
 const change=e=>{if(!disposed&&e.target.matches('[data-electron-library-select]'))open(e.target.value);};
 const click=e=>{
  if(disposed)return;
  const b=e.target.closest?.('button');if(!b||!container.contains(b))return;
  if(b.hasAttribute('data-electron-library-home'))open(defaultId);
  if(b.hasAttribute('data-electron-library-discard')&&draft.pending)open(draft.pending.id,{...draft.pending,force:true});
  if(b.hasAttribute('data-electron-library-retry')){
   for(const [field,preference] of Object.entries(draft.preferences))if(preference.dirty||preference.error)rememberPreference(field,true);
   renderStatus();
  }
  if(b.hasAttribute('data-electron-library-mode')){
   const nextMode=b.getAttribute('data-electron-library-mode');
   if(nextMode!==draft.mode)open(draft.selected,{nextMode,startIndex:draft.mode==='guided'?(disposeWorkbench?.currentStep?.()||0):0,remember:false,rememberMode:true});
  }
 };
 const toggle=e=>{if(!disposed&&e.target===$('.electron-library-scope'))draft.scopeOpen=e.target.open;};
 container.addEventListener('change',change);container.addEventListener('click',click);container.addEventListener('toggle',toggle,true);
 mountCurrent();
 const dispose=()=>{
  if(disposed)return;
  draft.scopeOpen=$('.electron-library-scope').open;disposed=true;disposeWorkbench?.();
  container.removeEventListener('change',change);container.removeEventListener('click',click);container.removeEventListener('toggle',toggle,true);
  if(draft.active===dispose)draft.active=null;
  if(mountedContainers.get(container)===dispose)mountedContainers.delete(container);
 };
 dispose.hasUnsavedDraft=()=>{
  if(owner)return Boolean((typeof hasUnsavedElectronDrafts==='function'&&hasUnsavedElectronDrafts(owner))||(typeof hasUnsavedElectronSandboxDrafts==='function'&&hasUnsavedElectronSandboxDrafts(owner))||hasUnsavedElectronLibraryDrafts(owner));
  return preferencesDirty(draft)||disposeWorkbench?.hasUnsavedDraft?.()===true||disposeWorkbench?.canLeave?.()===false;
 };
 dispose.canLeave=()=>!dispose.hasUnsavedDraft();
 dispose.canResume=()=>Boolean(owner);
 draft.active=dispose;mountedContainers.set(container,dispose);
 return dispose;
}
