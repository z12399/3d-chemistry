import {escapeHTML as esc,downloadText} from './storage.js';
import {MoleculeViewer} from './viewer.js';
import {resolveElectronEntry,prepareElectronMechanism} from './electron-catalog.js';
import {evaluateElectronArrows,inspectElectronState,ELECTRON_WORKBENCH_SOURCES,ELECTRON_WORKBENCH_LIMITS} from './electron-workbench-model.js';
import {validateElectronRecord,emptyElectronRecord,ELECTRON_RECORD_MAX_ATTEMPTS,ELECTRON_RECORD_MAX_BYTES} from './electron-workbench-record.js';

export const ELECTRON_WORKBENCH_IDS=Object.freeze(['electron-cyclization','electron-condensation','electron-hydrolysis']);
const CONFIG={
 'electron-cyclization':{file:'molecules.json',route:'glucose-hemiacetal',title:'讓葡萄糖自己成環。',net:'開鏈 D-葡萄糖 ⇌ 環狀半縮醛',tasks:['用酸活化羰基。','讓分子內的羥基完成羰基加成。','移走環氧上的多餘質子，讓酸再生。']},
 'electron-condensation':{file:'maillard-mechanism-models.json',route:'maillard-schiff-base',title:'從羰基與胺，推到 C=N。',net:'糖的醛基 + 一級胺 ⇌ Schiff 鹼 + H₂O',tasks:['讓胺加成到羰基，同時照顧碳的八隅體。','用酸中和帶負電的氧。','讓水移走氮上的一個質子。','把羥基變成較好的離去基。','讓水離去，同時建立碳氮雙鍵。','移走氮上質子，得到中性的 Schiff 鹼。']},
 'electron-hydrolysis':{file:'disaccharide-mechanism-models.json',route:'maltose-hydrolysis',title:'水解糖苷鍵，電子去哪裡？',net:'麥芽糖 + H₂O ⇌ 2 葡萄糖',tasks:['用酸活化兩個糖之間的橋氧。','在異頭碳端斷鍵，由環氧提供穩定。','讓水加成到異頭碳。','移走新羥基的多餘質子，再生酸。']}
};
const pairKey=s=>s.split('-').sort().join('-');
const charge=n=>n>0?'+'+n:String(n);
const cloneArrows=arrows=>arrows.map(a=>[...a]);
const atomCharge=a=>a.formalCharge??a.charge??0;
const MAX_ATTEMPTS=ELECTRON_RECORD_MAX_ATTEMPTS;
const draftsByOwner=new WeakMap(),mountedContainers=new WeakMap();
const validOwner=owner=>owner!==null&&(typeof owner==='object'||typeof owner==='function');

export function hasUnsavedElectronDrafts(owner){
 if(!validOwner(owner))return false;
 return [...(draftsByOwner.get(owner)?.values()||[])].some(slot=>slot.active?slot.active.hasUnsavedDraft():Boolean(slot.snapshot?.persistError));
}

export function mountElectronWorkbench(container,id,options={}){
 const entry=resolveElectronEntry(id);
 mountedContainers.get(container)?.();
 const owner=options?.draftOwner;
 let slot=null;
 if(validOwner(owner)){
  if(!draftsByOwner.has(owner))draftsByOwner.set(owner,new Map());
  const ownerDrafts=draftsByOwner.get(owner),draftKey=JSON.stringify([id,typeof options.draftKey==='string'?options.draftKey:id]);
  slot=ownerDrafts.get(draftKey)||{snapshot:null,active:null};slot.active?.();ownerDrafts.set(draftKey,slot);
 }
 const resumed=slot?.snapshot;
 const advanced=entry.workbenchVersion===2,recordOptions={version:advanced?2:1},maxArrows=advanced?ELECTRON_WORKBENCH_LIMITS.maxArrows:6;
 const config=CONFIG[id]||{file:entry.file,title:entry.title},$=selector=>container.querySelector(selector),key='food-science/'+id+'/v'+recordOptions.version;
 let tasks=config.tasks;
 let mechanism=null,viewer=null,record=emptyElectronRecord(id,recordOptions),disposed=false,source='',target='',targetOther='',targetMode='atom',field='source',mode='before',result=null,revealed=false,storageBlocked=false,persistError=false,lastStored=null,fitNext=true,shown='';
 let resizeObserver=null,lastLayout=null,pendingCamera=null,pendingCameraScene='',pendingLayoutFit=false;
 const destination=()=>targetMode==='bond'?(target&&targetOther&&target!==targetOther?target+'-'+targetOther:''):target;
 const before=()=>mechanism.states[record.step];
 const after=()=>mechanism.states[record.step+1];
 const evaluate=()=>evaluateElectronArrows(before(),record.arrows,{referenceAfter:after()});
 container.innerHTML=`<section class="electron-workbench"><header class="electron-heading"><h3>${config.title}</h3></header><div class="electron-route"><span data-electron-progress>準備模型…</span><label>回看步驟<select aria-label="回看反應步驟" data-electron-step disabled></select></label></div><div class="electron-workspace"><div class="electron-visual"><div class="electron-scene-title"><span data-electron-scene>起始結構</span><span data-electron-charge></span></div><div class="electron-viewer" role="img" aria-label="可旋轉與選取原子或鍵的反應三維模型"><p class="electron-loading">正在載入反應結構…</p></div><div class="electron-camera"><span>拖曳旋轉 · 點原子或鍵選取</span><button type="button" data-electron-action="fit">重設視角</button></div><div class="electron-views" role="group" aria-label="比較結構"><button type="button" data-electron-view="before" aria-pressed="true">起始結構</button><button type="button" data-electron-view="candidate" disabled>我的鍵圖</button><button type="button" data-electron-view="reference" disabled>參考結果</button></div><details class="electron-display"><summary>顯示與 3D 界線</summary><p>先組箭頭，再檢查電子帳。每一支箭頭都代表一對電子。</p><label><input type="checkbox" data-electron-h>顯示全部氫</label><label><input type="checkbox" data-electron-labels checked>顯示原子標籤</label><p>3D 是教學端點。你的鍵圖沿用起始座標，沒有重新計算幾何、立體選擇、自由能或反應速度；參考結果是資料庫已指定的分支。</p></details></div><div class="electron-desk"><h4 data-electron-task></h4><div class="electron-equation"><span>反應式</span><p data-electron-equation></p><small data-electron-composite hidden>本步合併多個電子移動作收支對照，不表示單一基元反應或實測軌跡。</small></div><div class="electron-pick-mode" role="group" aria-label="3D 選取位置"><button type="button" data-electron-pick="source" aria-pressed="true">1 選箭尾</button><button type="button" data-electron-pick="target">2 選箭頭</button></div><label class="electron-select">電子從哪裡來？<select aria-label="電子來源" data-electron-source disabled><option value="">選原子孤對或鍵電子</option></select></label>${advanced?'<div class="electron-target-kind" role="group" aria-label="電子目的地種類"><button type="button" data-electron-target-kind="atom" aria-pressed="true">移到原子</button><button type="button" data-electron-target-kind="bond" aria-pressed="false">移到兩原子之間</button></div>':''}<label class="electron-select"><span data-electron-target-label>電子移到哪個原子？</span><select aria-label="電子目的地" data-electron-target disabled><option value="">選目的地原子</option></select></label>${advanced?'<label class="electron-select" data-electron-other-label hidden>目的鍵的另一端<select aria-label="電子目的鍵第二原子" data-electron-target-other disabled></select></label><p class="electron-target-help" data-electron-target-help hidden>新鍵也能指定：選兩個原子。選來源鍵後，目的鍵須明確保留哪一端。</p>':''}<button type="button" data-electron-action="add" class="electron-add" disabled>加入這支箭頭 ＋</button><ol class="electron-arrows" aria-label="我的電子箭頭"></ol><div class="electron-check-actions"><button type="button" data-electron-action="check" class="button-primary" disabled>檢查這組箭頭</button><button type="button" data-electron-action="clear">清空草稿</button></div><p class="electron-feedback" role="status"></p><div class="electron-audit"></div><button type="button" data-electron-action="next" class="button-primary electron-next" hidden>推進到下一步 →</button><details class="electron-reference"><summary>需要時，對照參考箭頭</summary><div data-electron-reference></div><button type="button" data-electron-action="reference">顯示參考箭頭</button></details></div></div><details class="electron-journal"><summary>這次推理與紀錄</summary><p data-electron-storage>目前草稿自動保存在此瀏覽器。</p><p>選取、顯示與視角不寫入 JSON；重新整理後以已保存的紀錄為準。</p><p data-electron-attempts></p><div class="electron-journal-actions"><button type="button" data-electron-action="export">查看／匯出 JSON</button><button type="button" data-electron-action="download" hidden>下載這份紀錄</button><button type="button" data-electron-action="import-toggle">還原紀錄</button><button type="button" data-electron-action="new-round">封存並開始新一輪</button></div><div class="electron-archives" hidden><label>已封存紀錄<select aria-label="已封存紀錄" data-electron-archive><option value="">選擇一輪</option></select></label><textarea aria-label="封存的電子工作台紀錄" readonly rows="6" hidden></textarea><p>封存保存在本機，請複製 JSON 留一份備份；也可貼到還原欄位。</p></div><label class="electron-export-label" hidden>完整紀錄<textarea aria-label="電子工作台完整紀錄" readonly rows="6"></textarea></label><div class="electron-import" hidden><label>貼上先前匯出的本活動紀錄<textarea aria-label="要還原的電子工作台紀錄" rows="5" maxlength="262144"></textarea></label><button type="button" data-electron-action="import">驗證並還原</button></div><p class="electron-record-feedback" role="status"></p></details><details class="electron-science"><summary>模型、來源與適用範圍</summary><p>本工作台限全顯式氫的 C、H、O、N 閉殼層電子對記帳。${advanced?'可由原子孤對成鍵、把鍵電子交回端點，或移到共享一個原子的明示目的鍵；目的鍵可尚未存在。來源原子在目的鍵上時，指向該鍵與指向另一端成鍵等價。':'可由原子孤對成鍵，或把鍵的一對電子移回其端點原子。'}每次先從同一起態計算所有箭頭，再檢查鍵級、非鍵電子、八隅體上限與總電荷；沒有生成任意可行機構，也沒有判斷反應在給定條件下會不會發生。</p><p>「符合參考」只表示此步的連接與形式電荷相同，不同箭頭甚至互相抵銷的電子移動也可能得到同圖；這不證明箭頭機構唯一或合理，也不評定立體化學、速率或學習掌握。參考箭頭曾展開時，紀錄會保留「看過參考」。</p><div data-electron-sources></div></details></section>`;
 const feedback=text=>{$('.electron-feedback').textContent=text;};
 const details=['display','reference','journal','science'];
 function captureControls(){
  return {hydrogen:$('[data-electron-h]').checked,labels:$('[data-electron-labels]').checked,
   details:details.map(name=>$('.electron-'+name).open),feedbackText:$('.electron-feedback').textContent,recordFeedback:$('.electron-record-feedback').textContent,
   exportOpen:!$('.electron-export-label').hidden,importOpen:!$('.electron-import').hidden,importText:$('[aria-label="要還原的電子工作台紀錄"]').value};
 }
 function capture(){
  if(!slot)return;
  if(!mechanism){if(slot.snapshot)slot.snapshot={...slot.snapshot,...captureControls()};return;}
  viewer?.settleCamera?.();
  slot.snapshot={record:validateElectronRecord(record,id,mechanism,recordOptions),lastStored,storageBlocked,persistError,
   source,target,targetOther,targetMode,field,mode,checked:Boolean(result),revealed,
   camera:pendingCamera||(pendingLayoutFit?null:viewer?.cameraState?.()),cameraScene:record.step+':'+mode,
   ...captureControls(),auditOpen:$('.electron-audit').querySelector('details')?.open,storageText:$('[data-electron-storage]').textContent,
   archive:$('[data-electron-archive]').value,archiveText:$('[aria-label="封存的電子工作台紀錄"]').value,archiveHidden:$('[aria-label="封存的電子工作台紀錄"]').hidden};
 }
 function conflict(){
  storageBlocked=true;persistError=true;$('[data-electron-storage]').textContent='另一個頁面已更新此活動，已停止覆寫。本頁作答仍可匯出；先保存，再重新整理讀取新紀錄，或明確還原要採用的紀錄。';
 }
 function renderReference(){
  $('[data-electron-reference]').innerHTML=`<ol>${mechanism.steps[record.step].arrows.map(([a,b])=>`<li>${esc(a.replaceAll('-','—'))} → ${esc(b.replaceAll('-','—'))}</li>`).join('')}</ol><p>${esc(mechanism.steps[record.step].explanation)}</p>`;
 }
 function restoreControls(){
  if(!resumed)return;
  $('[data-electron-h]').checked=resumed.hydrogen;$('[data-electron-labels]').checked=resumed.labels;
  details.forEach((name,i)=>{$('.electron-'+name).open=resumed.details[i];});
  feedback(resumed.feedbackText);$('.electron-record-feedback').textContent=resumed.recordFeedback;
  $('.electron-export-label').hidden=!resumed.exportOpen;$('[data-electron-action="download"]').hidden=!resumed.exportOpen;
  $('.electron-import').hidden=!resumed.importOpen;$('[aria-label="要還原的電子工作台紀錄"]').value=resumed.importText;
 }
 function restoreView(){
  if(!resumed)return;
  ({source,target,targetOther,targetMode,field,revealed}=resumed);
  result=resumed.checked?evaluate():null;
  mode=resumed.mode==='candidate'&&result?.ok?'candidate':resumed.mode==='reference'&&(revealed||result?.matchesReference)?'reference':'before';
  if(revealed)renderReference();
  if(result){reportEvaluation();const audit=$('.electron-audit').querySelector('details');if(audit)audit.open=resumed.auditOpen;}
  feedback(resumed.feedbackText);
  $('[data-electron-archive]').value=resumed.archive;$('[aria-label="封存的電子工作台紀錄"]').value=resumed.archiveText;$('[aria-label="封存的電子工作台紀錄"]').hidden=resumed.archiveHidden;
 }
 function save(nextRecord=record){
  if(storageBlocked)return false;
  try{
   if(localStorage.getItem(key)!==lastStored){conflict();return false;}
   const serialized=JSON.stringify(validateElectronRecord(nextRecord,id,mechanism,recordOptions));
   localStorage.setItem(key,serialized);record=nextRecord;lastStored=serialized;persistError=false;
   $('[data-electron-storage]').textContent='草稿與已檢查的作答已保存在此瀏覽器。';return true;
  }
  catch{persistError=true;$('[data-electron-storage]').textContent='瀏覽器未能保存；請先匯出這份紀錄。';return false;}
 }
 function showArchives(){
  try{
   const prefix=key+'/archive/',keys=[];
   for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(prefix))keys.push(k);}
   keys.sort().reverse();
   $('.electron-archives').hidden=!keys.length;
   $('[data-electron-archive]').innerHTML='<option value="">選擇一輪</option>'+keys.map(k=>`<option value="${esc(k)}">${esc(k.slice(prefix.length))}</option>`).join('');
  }catch{$('.electron-record-feedback').textContent='封存清單暫時無法讀取。';}
 }
 function updateExport(){
  if(!$('.electron-export-label').hidden)$('[aria-label="電子工作台完整紀錄"]').value=JSON.stringify(validateElectronRecord(record,id,mechanism,recordOptions),null,2);
 }
 function setOptions(){
  const m=before(),inspection=inspectElectronState(m),counts=new Map(inspection.electrons.map(a=>[a.atomId,a.nonbondingElectrons/2]));
  const atoms=[...m.atoms].sort((a,b)=>(a.element==='H')-(b.element==='H'));
  $('[data-electron-source]').innerHTML='<option value="">選原子孤對或鍵電子</option><optgroup label="原子上的非鍵電子">'+atoms.map(a=>`<option value="${esc(a.id)}">${esc(a.id)} · ${a.element} · ${counts.get(a.id)} 對${atomCharge(a)?' · 電荷'+charge(atomCharge(a)):''}</option>`).join('')+'</optgroup><optgroup label="現有鍵的電子">'+m.bonds.map(b=>`<option value="${esc(b.a+'-'+b.b)}">${esc(b.a)}${b.order===2?'＝':'—'}${esc(b.b)} · 一對鍵電子</option>`).join('')+'</optgroup>';
  $('[data-electron-target]').innerHTML='<option value="">選目的地原子</option>'+atoms.map(a=>`<option value="${esc(a.id)}">${esc(a.id)} · ${a.element}${atomCharge(a)?' · 電荷'+charge(atomCharge(a)):''}</option>`).join('');
  $('[data-electron-source]').disabled=false;$('[data-electron-target]').disabled=false;
  if(advanced){$('[data-electron-target-other]').innerHTML=$('[data-electron-target]').innerHTML;$('[data-electron-target-other]').disabled=false;}
  $('[data-electron-step]').innerHTML=mechanism.steps.map((s,i)=>`<option value="${i}"${i===record.step?' selected':''}>${i+1} / ${mechanism.steps.length}</option>`).join('');$('[data-electron-step]').disabled=false;
 }
 function layout(){
  if(disposed||!viewer)return;
  const host=$('.electron-viewer'),width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;
  const changed=!lastLayout||lastLayout[0]!==width||lastLayout[1]!==height;
  if(!changed&&!pendingCamera&&!pendingLayoutFit)return;
  lastLayout=[width,height];viewer.resize?.();
  if(pendingCamera){
   const camera=pendingCamera;pendingCamera=null;
   if(viewer.restoreCameraState?.(camera)){pendingLayoutFit=false;return;}
   pendingLayoutFit=true;
  }
  if(changed||pendingLayoutFit){viewer.fit();pendingLayoutFit=false;}
 }
 function fitView(){
  pendingCamera=null;pendingLayoutFit=true;if(!viewer)return;
  const host=$('.electron-viewer');if(host.clientWidth===0||host.clientHeight===0)return;
  viewer.resize?.();viewer.fit();pendingLayoutFit=false;
  if(host.clientWidth&&host.clientHeight)lastLayout=[host.clientWidth,host.clientHeight];
 }
 function drawScene(){
  if(!viewer||!mechanism)return;
  const m=mode==='reference'?after():mode==='candidate'&&result?.candidate?result.candidate:before();
  const arrows=mode==='before'?record.arrows:[];
  const selected=[...new Set([source,target,targetOther,...arrows.flat()].filter(Boolean).flatMap(p=>p.split('-')))];
  const sceneKey=JSON.stringify([record.step,mode,arrows,selected,$('[data-electron-h]').checked,$('[data-electron-labels]').checked]);
  if(sceneKey===shown&&!fitNext)return;shown=sceneKey;
  if(fitNext||pendingCameraScene!==record.step+':'+mode)pendingCamera=null;
  if(fitNext&&($('.electron-viewer').clientWidth===0||$('.electron-viewer').clientHeight===0))pendingLayoutFit=true;
  viewer.showH=$('[data-electron-h]').checked;viewer.showLabels=$('[data-electron-labels]').checked;
  viewer.setMolecule(m,{fit:fitNext,selected,arrows,changes:mode==='candidate'?result?.changes||[]:[]});fitNext=false;
  $('[data-electron-scene]').textContent=mode==='reference'?'參考端點 · 指定構象':mode==='candidate'?'我的鍵圖 · 起始座標未最佳化':'起始結構 · 黃箭為你的草稿';
  $('[data-electron-charge]').textContent=`${m.atoms.length} 原子 · 總電荷 ${charge(m.atoms.reduce((n,a)=>n+atomCharge(a),0))}`;
 }
 function draw(){
  if(!mechanism)return;
  $('[data-electron-progress]').textContent=`第 ${record.step+1} / ${mechanism.steps.length} 步 · ${record.assisted?'看過本步參考箭頭':'未開本步參考箭頭'}${persistError?' · 未保存，請匯出':''}`;
  $('[data-electron-task]').textContent=tasks[record.step];$('[data-electron-equation]').textContent=mechanism.steps[record.step].equation;
  $('[data-electron-composite]').hidden=!mechanism.steps[record.step].isComposite;
  $('[data-electron-source]').value=source;$('[data-electron-target]').value=target;
  if(advanced){
   $('[data-electron-target-other]').value=targetOther;$('[data-electron-other-label]').hidden=targetMode!=='bond';$('[data-electron-target-help]').hidden=targetMode!=='bond';
   $('[data-electron-target-label]').textContent=targetMode==='bond'?'目的鍵的第一端':'電子移到哪個原子？';
   container.querySelectorAll('[data-electron-target-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.electronTargetKind===targetMode)));
  }
  container.querySelectorAll('[data-electron-pick]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.electronPick===field)));
  container.querySelectorAll('[data-electron-view]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.electronView===mode));b.disabled=b.dataset.electronView==='candidate'?!result?.ok:b.dataset.electronView==='reference'?!(revealed||result?.matchesReference):false;});
  $('[data-electron-action="add"]').disabled=!source||!destination()||record.arrows.length>=maxArrows;
  $('[data-electron-action="check"]').disabled=!record.arrows.length;
  $('.electron-arrows').innerHTML=record.arrows.length?record.arrows.map(([a,b],i)=>`<li><span>${esc(a.replaceAll('-','—'))} <i>→</i> ${esc(b.replaceAll('-','—'))}</span><button type="button" data-electron-remove="${i}" aria-label="移除第${i+1}支箭頭">×</button></li>`).join(''):'<li class="electron-empty">先選箭尾與箭頭，加入第一支。</li>';
  $('.electron-next').hidden=!result?.matchesReference;
  $('.electron-next').textContent=record.step===mechanism.steps.length-1?'這條路徑已到末步':'推進到下一步 →';$('.electron-next').disabled=record.step===mechanism.steps.length-1;
  $('[data-electron-attempts]').textContent=`已記錄 ${record.attempts.length} 次檢查。錯誤草稿也會保留；參考標記僅記錄展開行為，不能證明獨立作答。每輪最多100次，可封存後開新一輪。`;
  updateExport();drawScene();
 }
 function clearResult(){result=null;mode='before';$('.electron-audit').replaceChildren();feedback('');}
 function setStep(step){
  const draft={step:record.step,arrows:cloneArrows(record.arrows),assisted:record.assisted};
  record.drafts=[...record.drafts.filter(d=>d.step!==record.step),draft];
  const previous=record.drafts.find(d=>d.step===step);
  record.step=step;record.arrows=previous?cloneArrows(previous.arrows):[];record.assisted=previous?.assisted||false;
  source='';target='';targetOther='';targetMode='atom';field='source';revealed=false;fitNext=true;shown='';clearResult();$('[data-electron-reference]').replaceChildren();$('.electron-reference').open=false;setOptions();save();draw();
 }
 function pick(point){
  if(disposed||!mechanism||mode!=='before')return;
  if(field==='source'){source=point;target='';targetOther='';field='target';}
  else if(point.includes('-')){
   if(!advanced){feedback('箭頭要指向一個原子；此活動的鍵只用作電子來源。');return;}
   targetMode='bond';[target,targetOther]=point.split('-');field='source';
  }else if(targetMode==='bond'){
   if(!target||targetOther){target=point;targetOther='';}
   else {targetOther=point;field='source';}
  }else {target=point;field='source';}
  draw();
 }
 function reportEvaluation(){
  if(!result.ok){feedback(result.issues.map(i=>i.message).join(' '));$('.electron-audit').replaceChildren();return;}
  feedback(result.matchesReference?'電子帳平衡，連接與形式電荷符合這一步參考。可以查看3D結果，再決定往下推。':'這組箭頭通過受限的電子記帳，但與本步參考結果不同。可查看你的鍵圖；這不代表反應會實際發生。');
  const c=result.changes||[],q=result.charges||[];
  $('.electron-audit').innerHTML=`<details open><summary>你的箭頭造成什麼變化？</summary><ul>${c.map(x=>`<li>${esc(x.pair)}：鍵級 ${x.from} → ${x.to}</li>`).join('')}${q.map(x=>`<li>${esc(x.atomId)}：電荷 ${charge(x.from)} → ${charge(x.to)}</li>`).join('')}</ul><p>電子與原子收支核對通過；未判斷立體化學或可行性。</p></details>`;
 }
 const change=e=>{
  if(disposed||!mechanism)return;
  if(e.target.matches('[data-electron-archive]')){
   const selected=e.target.value;
   if(!selected){$('[aria-label="封存的電子工作台紀錄"]').hidden=true;return;}
   try{
    if(!selected.startsWith(key+'/archive/'))throw new Error('不是目前活動的封存。');
    const archived=validateElectronRecord(JSON.parse(localStorage.getItem(selected)),id,mechanism,recordOptions);
    $('[aria-label="封存的電子工作台紀錄"]').value=JSON.stringify(archived,null,2);$('[aria-label="封存的電子工作台紀錄"]').hidden=false;
   }catch(err){$('[aria-label="封存的電子工作台紀錄"]').hidden=true;$('.electron-record-feedback').textContent='無法讀取封存：'+err.message;}
   return;
  }
  if(e.target.matches('[data-electron-source]')){source=e.target.value;target='';targetOther='';field='target';}
  else if(e.target.matches('[data-electron-target]')){target=e.target.value;field=targetMode==='bond'&&!targetOther?'target':'source';}
  else if(advanced&&e.target.matches('[data-electron-target-other]')){targetOther=e.target.value;field='source';}
  else if(e.target.matches('[data-electron-step]')){setStep(Number(e.target.value));return;}
  draw();
 };
 const click=e=>{
  const b=e.target.closest?.('button');if(disposed||!b||!container.contains(b)||!mechanism||b.disabled)return;
  if(advanced&&b.dataset.electronTargetKind){targetMode=b.dataset.electronTargetKind;target='';targetOther='';field='target';mode='before';draw();return;}
  if(b.dataset.electronPick){field=b.dataset.electronPick;mode='before';draw();return;}
  if(b.dataset.electronView){mode=b.dataset.electronView;fitNext=true;draw();return;}
  if(b.dataset.electronRemove!==undefined){record.arrows.splice(Number(b.dataset.electronRemove),1);clearResult();save();draw();return;}
  const action=b.dataset.electronAction;
  if(action==='fit'){fitView();return;}
  if(action==='add'){
   if(!source||!destination()||record.arrows.length>=maxArrows)return;
   if(record.arrows.some(([a,t])=>pairKey(a)===pairKey(source)&&pairKey(t)===pairKey(destination()))){feedback('這支箭頭已經在草稿裡；沒有重複加入。');return;}
   record.arrows.push([source,destination()]);source='';target='';targetOther='';targetMode='atom';field='source';clearResult();save();draw();return;
  }
  if(action==='clear'){record.arrows=[];source='';target='';targetOther='';targetMode='atom';field='source';clearResult();save();draw();return;}
  if(action==='check'){
   result=evaluate();mode='before';
   if(record.attempts.length<MAX_ATTEMPTS){record.attempts.push({step:record.step,arrows:cloneArrows(record.arrows),assisted:record.assisted,at:new Date().toISOString()});save();}
   else $('[data-electron-storage]').textContent='紀錄已滿100次，本次結果可檢查但未加入歷史；可在「這次推理與紀錄」封存後開新一輪。';
   reportEvaluation();draw();return;
  }
  if(action==='next'&&result?.matchesReference&&record.step<mechanism.steps.length-1){setStep(record.step+1);return;}
  if(action==='reference'){
   revealed=true;record.assisted=true;save();renderReference();draw();return;
  }
  if(action==='new-round'){
   try{
    if(storageBlocked||localStorage.getItem(key)!==lastStored){storageBlocked=true;persistError=true;throw new Error('紀錄尚未同步，請先匯出本頁並處理另一頁的變更。');}
    const snapshot=JSON.stringify(validateElectronRecord(record,id,mechanism,recordOptions));
    const base=key+'/archive/'+new Date().toISOString();let archiveKey=base,suffix=1;
    while(localStorage.getItem(archiveKey)!==null)archiveKey=base+'-'+suffix++;
    localStorage.setItem(archiveKey,snapshot);
    // Archival must succeed before clearing the current attempt history.
    showArchives();
    if(!save({...record,attempts:[]}))throw new Error('封存已保存，但新一輪未寫入；原檢查歷史仍保留。');
    clearResult();draw();
    $('.electron-record-feedback').textContent='上一輪完整紀錄已封存。保留目前步驟與草稿，開始新的檢查歷史。';
   }catch(err){$('.electron-record-feedback').textContent='未開始新一輪，現有紀錄保留。'+err.message;draw();}
   return;
  }
  if(action==='export'){
   $('.electron-export-label').hidden=false;$('[data-electron-action="download"]').hidden=false;
   $('[aria-label="電子工作台完整紀錄"]').value=JSON.stringify(validateElectronRecord(record,id,mechanism,recordOptions),null,2);return;
  }
  if(action==='download'){downloadText(id+'-record.json',JSON.stringify(validateElectronRecord(record,id,mechanism,recordOptions),null,2),'application/json;charset=utf-8');return;}
  if(action==='import-toggle'){$('.electron-import').hidden=!$('.electron-import').hidden;return;}
  if(action==='import'){
   try{
    const text=$('[aria-label="要還原的電子工作台紀錄"]').value;
    if(new TextEncoder().encode(text).length>ELECTRON_RECORD_MAX_BYTES)throw new Error('紀錄超過256KiB。');
    const restored=validateElectronRecord(JSON.parse(text),id,mechanism,recordOptions);lastStored=localStorage.getItem(key);record=restored;storageBlocked=false;persistError=false;source='';target='';targetOther='';targetMode='atom';field='source';revealed=false;fitNext=true;clearResult();setOptions();$('[data-electron-reference]').replaceChildren();$('.electron-reference').open=false;save();draw();
    $('.electron-record-feedback').textContent=persistError?'已載入步驟、草稿與檢查歷史，但瀏覽器尚未保存；請保留匯出檔。':'已還原步驟、草稿與檢查歷史；可再用目前模型檢查結果。';
   }catch(err){$('.electron-record-feedback').textContent='未還原，現有草稿保留。'+err.message;}
  }
 };
 restoreControls();container.addEventListener('change',change);container.addEventListener('click',click);
 fetch(new URL('../data/'+config.file,import.meta.url)).then(r=>{if(!r.ok)throw new Error('資料未載入');return r.json();}).then(data=>{
  if(disposed)return;
  const prepared=prepareElectronMechanism(entry,data);
  mechanism=prepared.mechanism;tasks=config.tasks||prepared.tasks;
  if(!mechanism||mechanism.steps.length!==tasks.length||mechanism.states.length!==mechanism.steps.length+1)throw new Error('反應資料不完整');
  for(let i=0;i<mechanism.steps.length;i++){
   const audit=evaluateElectronArrows(mechanism.states[i],mechanism.steps[i].arrows,{referenceAfter:mechanism.states[i+1]});
   if(!audit.ok||!audit.matchesReference)throw new Error('參考電子收支未通過核對');
  }
  if(resumed){record=validateElectronRecord(resumed.record,id,mechanism,recordOptions);lastStored=resumed.lastStored;storageBlocked=resumed.storageBlocked;persistError=resumed.persistError;$('[data-electron-storage]').textContent=resumed.storageText;}
  try{
   const stored=localStorage.getItem(key);
   if(resumed){if(stored!==lastStored)conflict();}
   else {lastStored=stored;if(stored)record=validateElectronRecord(JSON.parse(stored),id,mechanism,recordOptions);}
  }
  catch{storageBlocked=true;persistError=true;$('[data-electron-storage]').textContent='既有紀錄無法讀取或驗證，已停止自動覆寫。可匯出目前草稿，或還原有效紀錄。';}
  $('.electron-viewer').replaceChildren();
  try{viewer=new MoleculeViewer($('.electron-viewer'),{onAtom:a=>pick(a.id),onBond:b=>pick(b.a+'-'+b.b)});}
  catch{$('.electron-viewer').innerHTML='<p class="electron-loading">這個視窗無法開啟3D；仍可用選單組箭頭與核對電子帳。</p>';}
  $('[data-electron-sources]').innerHTML=`<p>${esc(mechanism.limits)}</p><ul>${[...mechanism.sources,...ELECTRON_WORKBENCH_SOURCES].map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></li>`).join('')}</ul>`;
  showArchives();setOptions();restoreView();draw();
  if(viewer){
   const host=$('.electron-viewer');
   if(host.clientWidth&&host.clientHeight){lastLayout=[host.clientWidth,host.clientHeight];viewer.resize?.();}
   if(resumed?.camera&&resumed.cameraScene===record.step+':'+mode){
    if(host.clientWidth===0||host.clientHeight===0){pendingCamera=resumed.camera;pendingCameraScene=resumed.cameraScene;}
    else viewer.restoreCameraState?.(resumed.camera);
   }
   if(typeof ResizeObserver!=='undefined'){resizeObserver=new ResizeObserver(layout);resizeObserver.observe(host);}
  }
 }).catch(err=>{if(!disposed){mechanism=null;$('.electron-viewer').innerHTML='<p class="electron-loading">無法載入或核對這條反應。請重新整理。</p>';feedback(err.message);}});
 const dispose=()=>{
  if(disposed)return;capture();disposed=true;container.removeEventListener('change',change);container.removeEventListener('click',click);resizeObserver?.disconnect();viewer?.dispose();
  if(mountedContainers.get(container)===dispose)mountedContainers.delete(container);
  if(slot?.active===dispose)slot.active=null;
 };
 dispose.hasUnsavedDraft=()=>persistError||Boolean(!mechanism&&slot?.snapshot?.persistError);
 dispose.canLeave=()=>!dispose.hasUnsavedDraft();
 dispose.canResume=()=>Boolean(slot&&(mechanism||slot.snapshot));
 dispose.currentStep=()=>record.step;
 if(slot)slot.active=dispose;mountedContainers.set(container,dispose);
 return dispose;
}
