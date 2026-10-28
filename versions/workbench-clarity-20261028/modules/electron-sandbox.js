import {escapeHTML as esc,downloadText} from './storage.js';
import {MoleculeViewer} from './viewer.js';
import {resolveElectronEntry,prepareElectronMechanism} from './electron-catalog.js';
import {evaluateElectronArrows,inspectElectronState,ELECTRON_WORKBENCH_SOURCES} from './electron-workbench-model.js';
import {createElectronSandboxRecord,replayElectronSandboxRecord,applyElectronSandboxAction,ELECTRON_SANDBOX_LIMITS} from './electron-sandbox-model.js';
import {mainMoleculeIds,focusNeighborhood,componentEquation} from './electron-sandbox-view-model.js';

const charge=n=>n>0?'+'+n:String(n);
const canonical=p=>p.split('-').sort().join('-');
const timestamp=()=>new Date().toISOString();
const draftsByOwner=new WeakMap(),mountedContainers=new WeakMap();
const validOwner=owner=>owner!==null&&(typeof owner==='object'||typeof owner==='function');

export function hasUnsavedElectronSandboxDrafts(owner){
 if(!validOwner(owner))return false;
 return [...(draftsByOwner.get(owner)?.values()||[])].some(slot=>slot.active?slot.active.hasUnsavedDraft():Boolean(slot.snapshot?.persistError));
}

/** A free branch starts from a known graph, then uses only the user's arrows.
 * Reference endpoints never participate in checking or adopting a child. */
export function mountElectronSandbox(container,id,{startIndex=0,draftOwner=null,draftKey=id}={}){
 const entry=resolveElectronEntry(id),$=s=>container.querySelector(s);
 mountedContainers.get(container)?.();
 let slot=null;
 if(validOwner(draftOwner)){
  if(!draftsByOwner.has(draftOwner))draftsByOwner.set(draftOwner,new Map());
  const ownerDrafts=draftsByOwner.get(draftOwner),slotKey=JSON.stringify([id,typeof draftKey==='string'?draftKey:id]);
  slot=ownerDrafts.get(slotKey)||{snapshot:null,active:null};slot.active?.();ownerDrafts.set(slotKey,slot);
 }
 const resumed=slot?.snapshot;
 const key='food-science/electron-sandbox/'+id+'/v1';
 let mechanism=null,state=null,viewer=null,disposed=false,lastStored=null,blocked=false,persistError=false;
 let source='',target='',other='',kind='atom',field='source',view='before',result=null,shown='',pendingFocus=null,lastFocus=null,resizeObserver=null;
 let pendingCamera=null,lastLayout=null;
 const node=()=>state.record.nodes.find(n=>n.id===state.record.currentNodeId);
 const graph=()=>state.currentGraph;
 const destination=()=>kind==='bond'?(target&&other&&target!==other?target+'-'+other:''):target;
 const seeds=()=>[...new Set([source,target,other,...(node()?.draft||[]).flat()].filter(Boolean).flatMap(p=>p.split('-')))];
 container.innerHTML=`<section class="electron-sandbox electron-workbench">
  <header class="sandbox-heading"><h3>自由推導</h3><p>組箭頭、檢查、採用結果；也能回到前一步另試一條路。</p></header>
  <div class="sandbox-history"><label>我的推導樹<select aria-label="我的推導位置" data-sandbox-node disabled></select></label><button type="button" data-sandbox-action="parent" disabled>← 回到上一步</button><span data-sandbox-count></span></div><p class="sandbox-save-error" role="status" data-sandbox-save-error></p>
  <div class="electron-workspace sandbox-workspace"><div class="electron-visual">
   <div class="electron-scene-title"><span data-sandbox-scene>準備起始結構…</span><span data-sandbox-charge></span></div>
   <div class="electron-viewer" role="img" aria-label="自由推導的可旋轉三維模型"><p class="electron-loading">正在載入結構…</p></div>
   <div class="sandbox-camera"><span>拖曳旋轉 · 點選原子或鍵</span><div><button type="button" data-sandbox-action="focus" disabled>聚焦選取處</button><button type="button" data-sandbox-action="main">主分子</button><button type="button" data-sandbox-action="all">看全部</button></div></div>
   <div class="electron-views" role="group" aria-label="自由推導結構"><button type="button" data-sandbox-view="before" aria-pressed="true">目前結構</button><button type="button" data-sandbox-view="candidate" disabled>檢查後的鍵圖</button></div>
   <details class="electron-display"><summary>標籤、氫原子與幾何界線</summary><label><input type="checkbox" data-sandbox-labels>顯示全部重原子標籤</label><label><input type="checkbox" data-sandbox-h>顯示全部氫</label><p>預設只標出你選取的原子。聚焦只調整鏡頭，完整系統仍保留。</p><p class="sandbox-geometry">候選沿用起始座標；成鍵後未重算幾何與立體構型。</p></details>
  </div><div class="electron-desk">
   <div class="electron-equation"><span>本次提案的組成式</span><p data-sandbox-equation></p><small>含明示水與酸鹼；依片段計帳，同分子式仍可能是不同結構。</small></div>
   <div class="electron-pick-mode" role="group" aria-label="自由推導選取位置"><button type="button" data-sandbox-pick="source" aria-pressed="true">1 選箭尾</button><button type="button" data-sandbox-pick="target">2 選箭頭</button></div>
   <label class="electron-select">電子從哪裡來？<select aria-label="自由推導電子來源" data-sandbox-source disabled></select></label>
   <div class="electron-target-kind" role="group" aria-label="自由推導目的地種類"><button type="button" data-sandbox-kind="atom" aria-pressed="true">移到原子</button><button type="button" data-sandbox-kind="bond" aria-pressed="false">移到兩原子之間</button></div>
   <label class="electron-select">電子移到哪裡？<select aria-label="自由推導電子目的地" data-sandbox-target disabled></select></label>
   <label class="electron-select" data-sandbox-other-label hidden>目的鍵的另一端<select aria-label="自由推導目的鍵第二原子" data-sandbox-other disabled></select></label>
   <button type="button" class="electron-add" data-sandbox-action="add" disabled>加入箭頭 ＋</button>
   <ol class="electron-arrows" aria-label="自由推導的電子箭頭"></ol>
   <div class="electron-check-actions"><button type="button" class="button-primary" data-sandbox-action="check" disabled>檢查電子帳</button><button type="button" data-sandbox-action="clear">清空草稿</button></div>
   <p class="electron-feedback" role="status"></p><div class="electron-audit"></div>
   <button type="button" class="button-primary sandbox-commit" data-sandbox-action="commit" hidden>採用這個鍵圖，繼續推 →</button>
  </div></div>
  <details class="sandbox-note"><summary>記下這一步的想法</summary><label>判斷依據、條件或還沒解決的問題<textarea aria-label="自由推導這一步的筆記" data-sandbox-note maxlength="2000" rows="3"></textarea></label><p>每個位置有自己的筆記與箭頭草稿；切換位置會保留。</p></details>
  <details class="electron-journal"><summary>推導紀錄、起點與備份</summary><p data-sandbox-storage>目前草稿自動保存在此瀏覽器。</p><p data-sandbox-limits></p>
   <p>選取、顯示與視角只保留在這次開啟的頁面；重新整理後以已保存的推導為準。</p>
   <div class="electron-journal-actions"><button type="button" data-sandbox-action="export">查看／匯出推導</button><button type="button" data-sandbox-action="download" hidden>下載推導 JSON</button><button type="button" data-sandbox-action="import-toggle">還原推導</button></div>
   <label class="sandbox-export" hidden>完整推導<textarea aria-label="自由推導完整紀錄" readonly rows="6"></textarea></label>
   <div class="electron-import" hidden><label>貼上本反應的自由推導紀錄<textarea aria-label="要還原的自由推導紀錄" rows="5" maxlength="262144"></textarea></label><button type="button" data-sandbox-action="import">驗證並還原推導</button></div>
   <div class="sandbox-restart"><label>另選資料庫起點<select aria-label="自由推導新起点" data-sandbox-start disabled></select></label><button type="button" data-sandbox-action="restart">封存目前推導，從此開始</button><p>先完整封存這棵推導樹，再建立新起點。切換分支請使用上方推導樹。</p></div>
   <div class="electron-archives" hidden><label>已封存推導<select aria-label="已封存自由推導" data-sandbox-archive></select></label><textarea aria-label="封存的自由推導紀錄" readonly rows="5" hidden></textarea></div>
   <p class="electron-record-feedback" role="status"></p>
  </details>
  <details class="electron-science"><summary>模型與來源：通過檢查代表什麼？</summary><p>這是 C、H、O、N、全顯式氫的閉殼層電子對記帳。每批最多八支箭頭，從同一起態扣除電子，再檢查鍵級、非鍵電子、八隅體上限及總電荷。</p><p>通過表示受限帳本成立，可以繼續試推；沒有與下一個參考答案比對，也沒有證明反應可行。自由推導不指定產物名稱、α／β、Glc／Man、平衡比例、自由能或速率。來源中的條件與指定構型屬於參考路徑，不能自動套用到你的分支。</p><div data-sandbox-sources></div></details>
 </section>`;
 const feedback=t=>{$('.electron-feedback').textContent=t;};
 const recordFeedback=t=>{$('.electron-record-feedback').textContent=t;};
 const details=['.electron-display','.sandbox-note','.electron-journal','.electron-science'];
 const captureControls=()=>({hydrogen:$('[data-sandbox-h]').checked,labels:$('[data-sandbox-labels]').checked,details:details.map(selector=>$(selector).open),
  feedbackText:$('.electron-feedback').textContent,recordFeedback:$('.electron-record-feedback').textContent,
  exportOpen:!$('.sandbox-export').hidden,importOpen:!$('.electron-import').hidden,importText:$('[aria-label="要還原的自由推導紀錄"]').value});
 function capture(){
  if(!slot)return;
  if(!state||!mechanism){if(slot.snapshot)slot.snapshot={...slot.snapshot,...captureControls()};return;}
  viewer?.settleCamera?.();
  slot.snapshot={record:replayElectronSandboxRecord(state.record,id,mechanism).record,lastStored,blocked,persistError,
   source,target,other,kind,field,view,checked:Boolean(result),lastFocus:lastFocus?[...lastFocus]:null,
   camera:pendingCamera||(pendingFocus?null:viewer?.cameraState?.()),cameraScene:state.record.currentNodeId+':'+view,
   ...captureControls(),auditOpen:$('.electron-audit').querySelector('details')?.open,
   storageText:$('[data-sandbox-storage]').textContent,saveError:$('[data-sandbox-save-error]').textContent,
   noteText:$('[data-sandbox-note]').value,start:$('[data-sandbox-start]').value,
   archive:$('[data-sandbox-archive]').value,archiveText:$('[aria-label="封存的自由推導紀錄"]').value,archiveHidden:$('[aria-label="封存的自由推導紀錄"]').hidden};
 }
 function restoreControls(){
  if(!resumed)return;
  $('[data-sandbox-h]').checked=resumed.hydrogen;$('[data-sandbox-labels]').checked=resumed.labels;
  details.forEach((selector,i)=>{$(selector).open=resumed.details[i];});
  feedback(resumed.feedbackText);recordFeedback(resumed.recordFeedback);
  $('.sandbox-export').hidden=!resumed.exportOpen;$('[data-sandbox-action="download"]').hidden=!resumed.exportOpen;
  $('.electron-import').hidden=!resumed.importOpen;$('[aria-label="要還原的自由推導紀錄"]').value=resumed.importText;
 }
 function restoreView(){
  if(!resumed)return;
  ({source,target,other,kind,field}=resumed);
  result=resumed.checked?evaluateElectronArrows(graph(),node().draft):null;
  view=resumed.view==='candidate'&&result?.ok?'candidate':'before';
  if(result){report();const audit=$('.electron-audit').querySelector('details');if(audit)audit.open=resumed.auditOpen;}
  feedback(resumed.feedbackText);$('[data-sandbox-note]').value=resumed.noteText;$('[data-sandbox-start]').value=resumed.start;
  $('[data-sandbox-archive]').value=resumed.archive;$('[aria-label="封存的自由推導紀錄"]').value=resumed.archiveText;$('[aria-label="封存的自由推導紀錄"]').hidden=resumed.archiveHidden;
 }
 function storageMessage(t){persistError=true;$('[data-sandbox-storage]').textContent=t;$('[data-sandbox-save-error]').textContent=t;}
 function conflict(){blocked=true;storageMessage('另一頁已更新這份推導，已停止覆寫。請先匯出本頁，再重新整理或明確還原要採用的版本。');}
 function save(next=state,{replace=false}={}){
  if(blocked&&!replace)return false;
  try{
   const raw=localStorage.getItem(key);
   if(!replace&&raw!==lastStored){conflict();return false;}
   const serialized=JSON.stringify(next.record);localStorage.setItem(key,serialized);lastStored=serialized;blocked=false;persistError=false;
   $('[data-sandbox-storage]').textContent='推導樹、草稿與筆記已保存在此瀏覽器。';$('[data-sandbox-save-error]').textContent='';return true;
  }catch{storageMessage('瀏覽器未能保存。本頁內容仍在，請先匯出推導備份。');return false;}
 }
 function dispatch(action){
  const next=applyElectronSandboxAction(state.record,id,mechanism,{nodeId:node().id,at:timestamp(),...action});
  state=next;save();return next.result;
 }
 function resetSelection(){source='';target='';other='';kind='atom';field='source';view='before';shown='';result=null;$('.electron-audit').replaceChildren();feedback('');}
 function options(){
  const m=graph(),inspection=inspectElectronState(m),counts=new Map(inspection.electrons.map(a=>[a.atomId,a.nonbondingElectrons/2]));
  const atoms=[...m.atoms].sort((a,b)=>(a.element==='H')-(b.element==='H'));
  $('[data-sandbox-source]').innerHTML='<option value="">選原子孤對或鍵電子</option><optgroup label="原子的非鍵電子">'+atoms.map(a=>`<option value="${esc(a.id)}">${esc(a.id)} · ${a.element} · ${counts.get(a.id)} 對</option>`).join('')+'</optgroup><optgroup label="鍵電子">'+m.bonds.map(b=>`<option value="${esc(b.a+'-'+b.b)}">${esc(b.a)}${b.order===2?'＝':'—'}${esc(b.b)} · 一對電子</option>`).join('')+'</optgroup>';
  const targets='<option value="">選原子</option>'+atoms.map(a=>`<option value="${esc(a.id)}">${esc(a.id)} · ${a.element}</option>`).join('');
  $('[data-sandbox-target]').innerHTML=targets;$('[data-sandbox-other]').innerHTML=targets;
  for(const name of ['source','target','other','node','start'])$('[data-sandbox-'+name+']').disabled=false;
  $('[data-sandbox-note]').value=node().note;
 }
 function fit(ids){
  pendingCamera=null;pendingFocus=[...ids];lastFocus=[...ids];if(!viewer)return;
  const host=$('.electron-viewer');if(host.clientWidth>0&&host.clientHeight>0){viewer.resize?.();viewer.fit(ids);pendingFocus=null;lastLayout=[host.clientWidth,host.clientHeight];}
 }
 function layout(){
  if(disposed||!viewer)return;
  const host=$('.electron-viewer'),width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;
  const changed=!lastLayout||lastLayout[0]!==width||lastLayout[1]!==height;lastLayout=[width,height];
  viewer.resize?.();
  if(pendingCamera){const camera=pendingCamera;pendingCamera=null;if(viewer.restoreCameraState?.(camera)){pendingFocus=null;return;}}
  if(pendingFocus||changed&&lastFocus)fit(pendingFocus||lastFocus);
 }
 function scene(){
  if(!viewer)return;
  const m=view==='candidate'&&result?.ok?result.candidate:graph(),selected=seeds();
  const signature=JSON.stringify([state.record.currentNodeId,node().draft,view,selected,$('[data-sandbox-h]').checked,$('[data-sandbox-labels]').checked]);
  if(signature!==shown){
   shown=signature;viewer.showH=$('[data-sandbox-h]').checked;viewer.showLabels=true;viewer.labelsOnlySelected=!$('[data-sandbox-labels]').checked;
   viewer.setMolecule(m,{fit:false,selected,arrows:view==='before'?node().draft:[],changes:view==='candidate'?result?.changes||[]:[]});
  }
  $('[data-sandbox-scene]').textContent=view==='candidate'?'候選鍵圖 · 座標未最佳化':'目前結構 · '+(node().id==='n0'?'起點':node().id);
  $('[data-sandbox-charge]').textContent='總電荷 '+charge(inspectElectronState(m).totalCharge);
 }
 function draw(){
  if(!state)return;
  const n=node(),count=state.record.nodes.length,attempts=state.record.nodes.reduce((sum,x)=>sum+x.attempts.length,0);
  $('[data-sandbox-node]').innerHTML=state.record.nodes.map(x=>`<option value="${x.id}"${x.id===n.id?' selected':''}>${x.id==='n0'?'起點':x.id+' ← '+(x.parentId==='n0'?'起點':x.parentId)}${x.note?' · '+esc(x.note.slice(0,22)):''}</option>`).join('');
  $('[data-sandbox-node]').value=n.id;$('[data-sandbox-action="parent"]').disabled=n.parentId===null;
  $('[data-sandbox-count]').textContent=count+' 個位置 · '+attempts+' 次檢查';
  $('[data-sandbox-limits]').textContent='每棵最多80個位置、100次檢查。錯誤草稿也保留；滿額後可封存再開始。';
  $('[data-sandbox-source]').value=source;$('[data-sandbox-target]').value=target;$('[data-sandbox-other]').value=other;
  $('[data-sandbox-other-label]').hidden=kind!=='bond';
  for(const b of container.querySelectorAll('[data-sandbox-kind]'))b.setAttribute('aria-pressed',String(b.dataset.sandboxKind===kind));
  for(const b of container.querySelectorAll('[data-sandbox-pick]'))b.setAttribute('aria-pressed',String(b.dataset.sandboxPick===field));
  for(const b of container.querySelectorAll('[data-sandbox-view]'))b.setAttribute('aria-pressed',String(b.dataset.sandboxView===view));
  $('[data-sandbox-action="add"]').disabled=!source||!destination()||n.draft.length>=ELECTRON_SANDBOX_LIMITS.maxArrows;
  $('[data-sandbox-action="check"]').disabled=!n.draft.length;
  $('[data-sandbox-action="focus"]').disabled=!seeds().length;
  $('[data-sandbox-view="candidate"]').disabled=!result?.ok;
  $('[data-sandbox-action="commit"]').hidden=!result?.ok;
  $('.electron-arrows').innerHTML=n.draft.length?n.draft.map(([a,b],i)=>`<li><span>${esc(a.replaceAll('-','—'))}<i>→</i>${esc(b.replaceAll('-','—'))}</span><button type="button" data-sandbox-remove="${i}" aria-label="移除第 ${i+1} 支箭頭">×</button></li>`).join(''):'<li class="electron-empty">先選電子來源與目的地。</li>';
  $('[data-sandbox-equation]').textContent=componentEquation(graph(),result?.ok?result.candidate:null).replace(/[0-9]/g,d=>'₀₁₂₃₄₅₆₇₈₉'[Number(d)]);
  if(!$('.sandbox-export').hidden)$('[aria-label="自由推導完整紀錄"]').value=JSON.stringify(state.record,null,2);
  scene();
 }
 function report(){
  if(!result?.ok){feedback(result?.issues.map(x=>x.message).join(' ')||'尚未檢查。');$('.electron-audit').replaceChildren();return;}
  feedback(result.changes.length||result.charges.length?'電子帳通過。可以先看鍵圖，再採用它繼續推導；尚未判定反應可行性。':'電子帳通過，這一批未改變連接與形式電荷；不代表發生了一次反應。');
  $('.electron-audit').innerHTML='<details open><summary>本次鍵與電荷變化</summary><ul>'+(result.changes||[]).map(c=>`<li>${esc(c.pair)}：鍵級 ${c.from} → ${c.to}</li>`).join('')+(result.charges||[]).map(c=>`<li>${esc(c.atomId)}：電荷 ${charge(c.from)} → ${charge(c.to)}</li>`).join('')+'</ul></details>';
 }
 function pick(point){
  if(disposed||!state||view!=='before')return;
  if(field==='source'){source=point;target='';other='';field='target';}
  else if(point.includes('-')){kind='bond';[target,other]=point.split('-');field='source';}
  else if(kind==='bond'){if(!target||other){target=point;other='';}else{other=point;field='source';}}
  else{target=point;field='source';}draw();
 }
 function showArchives(){
  try{
   const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(key+'/archive/'))keys.push(k);}
   keys.sort().reverse();$('.electron-archives').hidden=!keys.length;
   $('[data-sandbox-archive]').innerHTML='<option value="">選一份封存</option>'+keys.map(k=>`<option value="${esc(k)}">${esc(k.slice((key+'/archive/').length))}</option>`).join('');
  }catch{recordFeedback('封存清單無法讀取；目前推導仍保留。');}
 }
 function selectNode(nodeId){dispatch({type:'select',nodeId});resetSelection();options();draw();}
 function draft(arrows){dispatch({type:'draft',arrows});resetSelection();draw();}
 const input=e=>{
  if(disposed||!state||!e.target.matches('[data-sandbox-note]'))return;
  try{dispatch({type:'note',text:e.target.value});draw();}catch(err){recordFeedback(err.message);}
 };
 const change=e=>{
  if(disposed||!state)return;
  try{
   if(e.target.matches('[data-sandbox-node]')){selectNode(e.target.value);return;}
   if(e.target.matches('[data-sandbox-source]')){source=e.target.value;target='';other='';field='target';}
   if(e.target.matches('[data-sandbox-target]')){target=e.target.value;field=kind==='bond'&&!other?'target':'source';}
   if(e.target.matches('[data-sandbox-other]')){other=e.target.value;field='source';}
   if(e.target.matches('[data-sandbox-archive]')){
    const selected=e.target.value,area=$('[aria-label="封存的自由推導紀錄"]');area.hidden=true;
    if(selected){if(!selected.startsWith(key+'/archive/'))throw new Error('不是本活動封存。');area.value=JSON.stringify(replayElectronSandboxRecord(JSON.parse(localStorage.getItem(selected)),id,mechanism).record,null,2);area.hidden=false;}
   }
   draw();
  }catch(err){recordFeedback(err.message);}
 };
 const click=e=>{
  const b=e.target.closest?.('button');if(disposed||!state||!b||!container.contains(b)||b.disabled)return;
  try{
   if(b.dataset.sandboxKind){kind=b.dataset.sandboxKind;target='';other='';field='target';view='before';draw();return;}
   if(b.dataset.sandboxPick){field=b.dataset.sandboxPick;view='before';draw();return;}
   if(b.dataset.sandboxView){view=b.dataset.sandboxView;draw();return;}
   if(b.dataset.sandboxRemove!==undefined){draft(node().draft.filter((_,i)=>i!==Number(b.dataset.sandboxRemove)));return;}
   const action=b.dataset.sandboxAction;
   if(action==='focus'){fit(focusNeighborhood(graph(),seeds(),2));return;}
   if(action==='main'){fit(mainMoleculeIds(graph()));return;}
   if(action==='all'){fit(graph().atoms.map(a=>a.id));return;}
   if(action==='parent'&&node().parentId){selectNode(node().parentId);return;}
   if(action==='add'){
    if(!source||!destination()||node().draft.length>=8)return;
    if(node().draft.some(([a,t])=>canonical(a)===canonical(source)&&canonical(t)===canonical(destination()))){feedback('這支箭頭已加入，沒有重複加入。');return;}
    draft([...node().draft,[source,destination()]]);return;
   }
   if(action==='clear'){draft([]);return;}
   if(action==='check'){result=dispatch({type:'check'});view='before';report();draw();return;}
   if(action==='commit'){
    const old=node().id;result=dispatch({type:'commit'});
    if(node().id!==old){resetSelection();options();draw();feedback('已採用為 '+node().id+'。從這個鍵圖繼續；原位置與其他分支仍保留。');}
    else{report();draw();}return;
   }
   if(action==='export'){$('.sandbox-export').hidden=false;$('[data-sandbox-action="download"]').hidden=false;draw();return;}
   if(action==='download'){downloadText(id+'-free-path.json',JSON.stringify(state.record,null,2),'application/json;charset=utf-8');return;}
   if(action==='import-toggle'){$('.electron-import').hidden=!$('.electron-import').hidden;return;}
   if(action==='import'){
    const text=$('[aria-label="要還原的自由推導紀錄"]').value;
    if(new TextEncoder().encode(text).length>262144)throw new Error('紀錄超過256KiB。');
    const next=replayElectronSandboxRecord(JSON.parse(text),id,mechanism);state=next;save(next,{replace:true});resetSelection();options();draw();fit(mainMoleculeIds(graph()));
    recordFeedback(persistError?'已載入推導，但尚未保存；請先匯出。':'已還原完整推導樹、筆記、草稿與檢查歷史。');return;
   }
   if(action==='restart'){
    const index=Number($('[data-sandbox-start]').value);
    const next=replayElectronSandboxRecord(createElectronSandboxRecord(id,index,mechanism.states[index],{at:timestamp()}),id,mechanism);
    if(blocked||localStorage.getItem(key)!==lastStored)throw new Error('版本尚未同步，請先匯出本頁並處理另一頁的變更。');
    const base=key+'/archive/'+timestamp();let archive=base,suffix=1;
    while(localStorage.getItem(archive)!==null)archive=base+'-'+suffix++;
    localStorage.setItem(archive,JSON.stringify(state.record));showArchives();
    if(!save(next))throw new Error('封存已保存，新起點未能保存；目前推導保留。');
    state=next;resetSelection();options();draw();fit(mainMoleculeIds(graph()));recordFeedback('整棵推導樹已封存，現在從指定資料庫結構開始。');return;
   }
  }catch(err){recordFeedback('未完成這個操作，現有推導保留。'+err.message);}
 };
 restoreControls();container.addEventListener('click',click);container.addEventListener('change',change);container.addEventListener('input',input);
 fetch(new URL('../data/'+entry.file,import.meta.url)).then(r=>{if(!r.ok)throw new Error('資料未載入');return r.json();}).then(data=>{
  if(disposed)return;
  mechanism=prepareElectronMechanism(entry,data).mechanism;
  if(!Number.isInteger(startIndex)||startIndex<0||startIndex>=mechanism.states.length)startIndex=0;
  state=replayElectronSandboxRecord(resumed?.record||createElectronSandboxRecord(id,startIndex,mechanism.states[startIndex],{at:timestamp()}),id,mechanism);
  if(resumed){lastStored=resumed.lastStored;blocked=resumed.blocked;persistError=resumed.persistError;$('[data-sandbox-storage]').textContent=resumed.storageText;$('[data-sandbox-save-error]').textContent=resumed.saveError;}
  try{
   const stored=localStorage.getItem(key);
   if(resumed){if(stored!==lastStored)conflict();}
   else {lastStored=stored;if(stored)state=replayElectronSandboxRecord(JSON.parse(stored),id,mechanism);}
  }
  catch{blocked=true;storageMessage('既有推導無法讀取或驗證，已停止自動覆寫。可匯出本頁，或明確還原有效推導。');}
  $('[data-sandbox-start]').innerHTML=mechanism.states.map((_,i)=>`<option value="${i}"${i===state.record.startIndex?' selected':''}>資料庫狀態 ${i+1} / ${mechanism.states.length}</option>`).join('');
  $('.electron-viewer').replaceChildren();
  try{viewer=new MoleculeViewer($('.electron-viewer'),{onAtom:a=>pick(a.id),onBond:b=>pick(b.a+'-'+b.b)});}
  catch{$('.electron-viewer').innerHTML='<p class="electron-loading">這個視窗無法開啟3D；仍可用選單組箭頭並繼續推導。</p>';}
  if(viewer&&typeof ResizeObserver!=='undefined'){resizeObserver=new ResizeObserver(layout);resizeObserver.observe($('.electron-viewer'));}
  $('[data-sandbox-sources]').innerHTML='<p>起點來源：'+esc(entry.shortLabel||entry.title)+'</p><ul>'+[...(mechanism.sources||[]),...ELECTRON_WORKBENCH_SOURCES].map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></li>`).join('')+'</ul>';
  showArchives();options();restoreView();draw();
  lastFocus=resumed?.lastFocus?[...resumed.lastFocus]:mainMoleculeIds(graph());pendingFocus=lastFocus;
  if(resumed?.camera&&resumed.cameraScene===state.record.currentNodeId+':'+view)pendingCamera=resumed.camera;
  layout();
 }).catch(err=>{if(!disposed){state=null;$('.electron-viewer').innerHTML='<p class="electron-loading">無法載入或驗證起點。請重新整理。</p>';feedback(err.message);}});
 const dispose=()=>{
  if(disposed)return;capture();disposed=true;resizeObserver?.disconnect();viewer?.dispose();container.removeEventListener('click',click);container.removeEventListener('change',change);container.removeEventListener('input',input);
  if(mountedContainers.get(container)===dispose)mountedContainers.delete(container);
  if(slot?.active===dispose)slot.active=null;
 };
 dispose.hasUnsavedDraft=()=>persistError||Boolean(!state&&slot?.snapshot?.persistError);
 dispose.canLeave=()=>!dispose.hasUnsavedDraft();
 dispose.canResume=()=>Boolean(slot&&(state||slot.snapshot));
 if(slot)slot.active=dispose;mountedContainers.set(container,dispose);
 return dispose;
}
