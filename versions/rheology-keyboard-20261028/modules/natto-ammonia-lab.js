import {loadNattoAmmoniaSource,getVerifiedNattoAmmoniaData} from './natto-ammonia-source.js';
import {NATTO_AMMONIA_ACTIVITY_ID,getNattoComparison,getNattoEvidence} from './natto-ammonia-model.js';
import {createNattoSession,validateNattoSession,serializeNattoSession,mergeNattoSession,updateNattoSession,buildNattoSummary,nattoFullText,NATTO_SESSION_LIMITS} from './natto-ammonia-record.js';
import {renderNattoMap,renderNattoEvidence,renderNattoMethods,renderNattoSources} from './natto-ammonia-diagrams.js';
import {escapeHTML as esc,downloadText} from './storage.js';

export {NATTO_AMMONIA_ACTIVITY_ID};
const owners=new WeakMap();let mountSequence=0;
const ENDPOINTS=['headspace-ammonia-release','food-urea-stock'];
const FIRST=['hypothesis','ammoniaPrediction','ureaPrediction','discriminatorReason'];
const WRITING={discriminatorReason:'哪個觀察會讓你改判？',observation:'我看見的證據',revision:'我如何修訂解釋',nextEvidence:'下一步還需要什麼證據？'};
const copy=value=>JSON.parse(JSON.stringify(value));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fail=message=>{throw new Error(message);};
const ownObject=value=>value!==null&&(typeof value==='object'||typeof value==='function');
const fieldOptions=(choices,value)=>choices.map(item=>`<option value="${esc(item.id)}"${item.id===value?' selected':''}>${esc(item.label)}</option>`).join('');

export function mountNattoAmmoniaLab(root,id=NATTO_AMMONIA_ACTIVITY_ID,{draftOwner,draftKey=id,onSaveSummary,loadData=loadNattoAmmoniaSource,onDownload=downloadText}={}){
 if(id!==NATTO_AMMONIA_ACTIVITY_ID)throw new RangeError('不支援這個納豆活動。');
 if(!root||typeof root.addEventListener!=='function'||typeof root.querySelector!=='function')throw new TypeError('活動需要可用的掛載節點。');
 if(typeof loadData!=='function'||typeof onDownload!=='function')throw new TypeError('來源與下載接點必須是函式。');
 const owner=ownObject(draftOwner)?draftOwner:root;let slots=owners.get(owner);if(!slots){slots=new Map();owners.set(owner,slots);}
 let slot=slots.get(draftKey);if(!slot){slot={session:null,lastSource:null,cursor:{},pending:null,saveStatus:'',status:'',details:{},importEpoch:0,dispose:null,refresh:null};slots.set(draftKey,slot);}
 slot.dispose?.();const prefix=`natto${++mountSequence}`;
 let source=null,sourceError='',disposed=false,loadEpoch=0,abort=null,composing=false,deferredRender=false;
 const rejectedCompositionInputs=new Map();
 const q=hook=>root.querySelector(`[data-na-${hook}]`),field=key=>root.querySelector(`[data-na-field="${key}"]`),button=name=>root.querySelector(`[data-na-action="${name}"]`);
 const handle=()=>source||slot.lastSource;
 const selected=(session=slot.session)=>{if(!session)return null;const set=session.recordSets.find(item=>item.setId===session.activeSelection.setId),round=set?.rounds.find(item=>item.roundId===session.activeSelection.roundId);return {set,round,revision:session.activeSelection.revisionId===null?null:round?.revisions.find(item=>item.revisionId===session.activeSelection.revisionId)};};
 const view=()=>{const chosen=selected();return chosen?{...chosen,working:chosen.revision?.workingSnapshot??chosen.round.working,evidenceRefs:chosen.revision?chosen.revision.evidenceRefs.map(ref=>ref.slice(9)):chosen.round.revealedEvidenceRefs,historical:!!chosen.revision}:null;};
 const setStatus=message=>{slot.status=message;if(!disposed&&q('status'))q('status').textContent=message;};
 const showError=error=>{if(!disposed)setStatus(error?.message||String(error));};
 const commit=action=>{if(!handle()||!slot.session)fail('來源尚未通過核對；原稿保留。');slot.session=updateNattoSession(slot.session,action,handle());};
 const allEvidenceRefs=()=>[...new Set(slot.session?.recordSets.flatMap(set=>set.rounds.flatMap(round=>round.events.filter(event=>!event.kind.startsWith('source-')).flatMap(event=>event.refs)))||[])];
 const detail=(name,label,body)=>`<details data-na-detail="${name}"${slot.details[name]?' open':''}><summary>${label}</summary><div class="na-detail-body">${body}</div></details>`;
 const action=(name,label,{disabled=false,extra=''}={})=>`<button type="button" data-na-action="${name}"${disabled?' disabled':''}${extra?` ${extra}`:''}>${label}</button>`;
 const initialStatus=()=>{const state=view();return state?.round.initial?`初判已固定${state.round.initial.answered?'':'；未作答先看，不算首次作答結果'}。後續想法寫在修訂。`:'可先留預測與理由，也可直接看證據；首次取證前保留當時初判。';};
 function captureFocus(){const active=root.ownerDocument?.activeElement;if(!active||!root.contains(active))return null;const name=active.tagName?.toLowerCase()==='summary'?active.closest('[data-na-detail]')?.dataset.naDetail:null;const keys=['naField','naAction','naComparison','naHistory','naSummary','naEndpoint'];return {detail:name,hooks:Object.fromEntries(keys.filter(key=>active.dataset?.[key]!==undefined).map(key=>[key,active.dataset[key]])),start:active.selectionStart,end:active.selectionEnd,direction:active.selectionDirection,top:active.scrollTop,left:active.scrollLeft};}
 function restoreFocus(saved){if(!saved)return;const target=saved.detail?[...root.querySelectorAll('[data-na-detail]')].find(node=>node.dataset.naDetail===saved.detail)?.querySelector('summary'):[...root.querySelectorAll('button,select,textarea,input')].find(node=>Object.keys(saved.hooks).length&&Object.entries(saved.hooks).every(([key,value])=>node.dataset?.[key]===value));if(!target||target.disabled)return;target.focus?.({preventScroll:true});if(Number.isInteger(saved.start)&&typeof target.setSelectionRange==='function')try{target.setSelectionRange(saved.start,saved.end,saved.direction);}catch{}if(Number.isFinite(saved.top))target.scrollTop=saved.top;if(Number.isFinite(saved.left))target.scrollLeft=saved.left;}
 function historyOptions(){if(!slot.session)return '';const catalogue=getVerifiedNattoAmmoniaData(handle()),active=slot.session.activeSelection;return slot.session.recordSets.flatMap(set=>set.rounds.flatMap(round=>{const name=catalogue.comparisons.find(item=>item.id===round.comparisonId).label,label=`${set.setId}/${round.roundId} · ${name}${set.provenance.kind==='imported'?'（含匯入紀錄）':''}`,horizon=set.provenance.importedSnapshotHorizon[round.roundId];return [{id:'current',label:'目前稿'},...round.revisions.map((revision,index)=>({id:revision.revisionId,label:`${revision.revisionId}（${horizon&&index<horizon.revisions?'匯入檔自述':'本頁保留'}）`}))].map(item=>{const value=`${set.setId}/${round.roundId}/${item.id}`,isSelected=set.setId===active.setId&&round.roundId===active.roundId&&(active.revisionId??'current')===item.id;return `<option value="${esc(value)}"${isSelected?' selected':''}>${esc(label+' · '+item.label)}</option>`;});})).join('');}
 function firstDescription(){const state=view();if(!state?.round.initial)return '初判尚未固定。';const initial=state.round.initial,catalogue=getVerifiedNattoAmmoniaData(handle()),imported=state.set.provenance.importedSnapshotHorizon[state.round.roundId]?.initial;return `${imported?'匯入檔自述的初判':'本頁固定初判'}\n${initial.answered?'已留下初判／理由':'未作答先看'}\n${FIRST.map(key=>key==='discriminatorReason'?`理由：${initial.choicesAndReason[key]||'未填'}`:`${catalogue.studyContext.predictionTargets[key]}：${catalogue.choices[key].find(item=>item.id===initial.choicesAndReason[key])?.label??initial.choicesAndReason[key]}`).join('\n')}`;}
 function fullText(){return slot.session&&handle()?nattoFullText(slot.session,handle()):'';}
 function setTextPreservingSelection(node,text){if(!node||node.value===text)return;const active=root.ownerDocument?.activeElement===node,start=node.selectionStart,end=node.selectionEnd,direction=node.selectionDirection,top=node.scrollTop,left=node.scrollLeft;node.value=text;if(active&&Number.isInteger(start)&&typeof node.setSelectionRange==='function')try{node.setSelectionRange(start,end,direction);}catch{}if(Number.isFinite(top))node.scrollTop=top;if(Number.isFinite(left))node.scrollLeft=left;}
 // All asynchronous save completions and source activations use this small patch.
 function refreshAux(){
  if(disposed||!slot.session||!handle())return;
  const state=view(),locked=!!state.round.initial||state.historical;
  for(const key of FIRST){const node=field(key);if(!node)continue;if(key==='discriminatorReason')node.readOnly=locked;else node.disabled=locked||!source;}
  if(q('initial-status'))q('initial-status').textContent=initialStatus();
  if(button('freeze'))button('freeze').disabled=locked||!source;
  if(button('save-note')){button('save-note').disabled=!!slot.pending||typeof onSaveSummary!=='function';button('save-note').textContent=slot.pending?'正在附加…':'附加本課筆記';}
  if(q('save-status'))q('save-status').textContent=slot.saveStatus;
  if(q('first'))q('first').textContent=firstDescription();
  const history=q('history'),nextOptions=historyOptions();if(history&&history.innerHTML!==nextOptions){history.innerHTML=nextOptions;const selection=slot.session.activeSelection;history.value=`${selection.setId}/${selection.roundId}/${selection.revisionId??'current'}`;}
  if(q('summary'))setTextPreservingSelection(q('summary'),fullText());
 }
 function exposeText(){const refs=allEvidenceRefs();if(refs.length)commit({type:'expose',kind:'fulltext-displayed',refs,detail:'在本頁展開含既有已刊證據的完整文字；不表示已讀。'});}
 function saveBlock(){
  return detail('save','保存與下載',`<div class="na-actions">${action('save-note',slot.pending?'正在附加…':'附加本課筆記',{disabled:!!slot.pending||typeof onSaveSummary!=='function'})}${action('export-json','下載可重開 JSON')}${action('export-text','下載完整 TXT')}${action('import-json','追加匯入 JSON',{disabled:!source})}<input type="file" accept="application/json,.json" data-na-file hidden></div><p data-na-save-status>${esc(slot.saveStatus)}</p><p>工作台只在本頁暫留，重新整理前請下載 JSON。成功附加的文字筆記才進入既有微生物學習備份；TXT 是完整可讀紀錄。</p>${detail('full-text','完整文字與容量',`<p>工作階段最多 2 MiB、100 輪；整課筆記連同原有文字最多 10,000 字元。超量會拒絕，不截短原稿。</p><label for="${prefix}-summary">完整紀錄<textarea id="${prefix}-summary" data-na-summary readonly rows="9">${esc(fullText())}</textarea></label>${action('copy-text','選取完整文字')}`)}`);
 }
 function render(){
  if(disposed)return;if(composing){deferredRender=true;return;}
  const focus=captureFocus(),catalogue=getVerifiedNattoAmmoniaData(handle());
  if(!slot.session||!catalogue){root.innerHTML=`<section class="natto-ammonia-evidence" data-na-ready="false"><h2>比較納豆產氨證據</h2><p data-na-status role="status" aria-live="polite">${esc(sourceError||slot.status)}</p>${sourceError?action('retry','重新核對來源'):''}</section>`;restoreFocus(focus);return;}
  if(slot.details['full-text'])exposeText();
  const state=view(),result=getNattoComparison(handle(),state.round.comparisonId);if(!result.ok)fail('目前比較無法核對。');const comparison=result.comparison,locked=!!state.round.initial||state.historical;
  const selectField=(name,label)=>`<label for="${prefix}-${name}">${label}<select id="${prefix}-${name}" data-na-field="${name}"${locked||!source?' disabled':''}>${fieldOptions(catalogue.choices[name],state.working[name])}</select></label>`;
  const writingField=(name,rows=3)=>`<label for="${prefix}-${name}">${WRITING[name]}<textarea id="${prefix}-${name}" data-na-field="${name}" rows="${rows}"${state.historical||name==='discriminatorReason'&&locked?' readonly':''}>${esc(state.working[name])}</textarea></label>`;
  const ready=!!source,ureaAvailable=comparison.availability['food-urea-stock']==='reported';
  root.innerHTML=`<section class="natto-ammonia-evidence" data-na-ready="${ready}" data-na-history-view="${state.historical}"><div class="na-top"><label for="${prefix}-comparison">選一組比較<select id="${prefix}-comparison" data-na-comparison${!ready?' disabled':''}>${catalogue.comparisons.map(item=>`<option value="${esc(item.id)}"${item.id===comparison.id?' selected':''}>${esc(item.label)}</option>`).join('')}</select></label><p class="na-question">${esc(comparison.question)}</p></div>${!ready?`<div class="na-load-error"><p>${esc(sourceError||'正在重新核對來源；原稿與歷史保留。')}</p>${sourceError?action('retry','重新核對來源'):''}<p>新的證據暫停顯示；原稿仍可保留及下載。</p></div>`:''}<div class="na-workarea"><div class="na-figure-area">${ready?renderNattoMap(comparison):'<p class="na-unrevealed">來源目前尚未通過核對，暫停介入圖及結果顯示。</p>'}</div><section class="na-predictions"><h2>先留下你的想法</h2><p>GlutDH＝麩胺酸去氫酶。</p>${selectField('hypothesis','目前假說')}${selectField('ammoniaPrediction','氨會歸零嗎？')}${selectField('ureaPrediction','尿素：9 h 相對 Fig. 4 r22')}${!ureaAvailable?'<p class="na-unavailable">本比較未刊載尿素資料；可保留待驗想法，但沒有對應結果。</p>':''}${writingField('discriminatorReason',2)}<p data-na-initial-status>${esc(initialStatus())}</p>${action('freeze','保留初判',{disabled:locked||!ready})}</section></div><div class="na-evidence-grid">${ENDPOINTS.map(endpoint=>{const found=getNattoEvidence(handle(),comparison.id,endpoint);if(!found.ok)fail('證據無法解析。');const revealed=ready&&found.evidence.records.length>0&&found.evidence.records.every(record=>state.evidenceRefs.includes(record.id));return renderNattoEvidence(found.evidence,{revealed,disabled:!ready,historical:state.historical});}).join('')}</div><section class="na-writing"><h2>觀察與修訂</h2><p>分開描述看見的訊號和你的解釋，不自動評分或判定新途徑。</p>${writingField('observation')}${writingField('revision')}${writingField('nextEvidence',2)}</section><div class="na-actions">${action('retain','保留修訂',{disabled:state.historical})}${action('new-round','再比較一輪',{disabled:!ready})}${state.historical?action('current','回目前工作稿'):''}</div><p>換一組比較會另開一輪，原稿完整保留。</p>${detail('methods','方法與判讀界線',renderNattoMethods(catalogue,comparison))}${detail('sources','來源',renderNattoSources(catalogue))}${detail('history','輪次與保留版本',`<label for="${prefix}-history">查看紀錄<select id="${prefix}-history" data-na-history>${historyOptions()}</select></label><p>${state.historical?'這份保留版本唯讀；回到目前工作稿後可續寫。':'目前工作稿可續寫；固定初判不改寫。'}</p><pre data-na-first>${esc(firstDescription())}</pre><p>匯入的歷史與曝光是檔案自述；不代表本頁已經閱讀。</p>`)}${saveBlock()}<p data-na-status role="status" aria-live="polite">${esc(slot.status)}</p></section>`;
  restoreFocus(focus);
 }
 async function load(){
  const epoch=++loadEpoch;abort?.abort();abort=new AbortController();source=null;sourceError='';slot.importEpoch++;slot.status='正在核對已刊來源…';render();
  try{const loaded=await loadData({signal:abort.signal});if(disposed||epoch!==loadEpoch)return;const catalogue=getVerifiedNattoAmmoniaData(loaded);if(!catalogue)fail('來源沒有通過核對。');
   const checked=slot.session?validateNattoSession(slot.session,loaded):createNattoSession(loaded);if(disposed||epoch!==loadEpoch)return;
   slot.session=checked;source=loaded;slot.lastSource=loaded;slot.status='選假說和比較，再分別查看需要的證據。';render();
  }catch(error){if(disposed||epoch!==loadEpoch)return;source=null;sourceError=`來源核對失敗：${error?.message||error}`;slot.status='原稿與歷史保留，可重試或下載。';render();}
 }
 function captureNoteVersions(){
  let next=slot.session;const original=copy(next.activeSelection),targets=next.recordSets.flatMap(set=>set.rounds.map(round=>({setId:set.setId,roundId:round.roundId,revisionId:null})));
  for(const target of targets){next=updateNattoSession(next,{type:'select',...target},handle());next=updateNattoSession(next,{type:'retain-revision'},handle());}
  next=updateNattoSession(next,{type:'select',...original},handle());slot.session=next;
 }
 async function saveNote(){
  if(slot.pending)return;if(typeof onSaveSummary!=='function')fail('本頁沒有筆記保存接點。');if(!slot.session||!handle())fail('尚無可保存內容。');
  captureNoteVersions();const plan=buildNattoSummary(slot.session,handle(),slot.cursor);refreshAux();
  if(!plan.text){slot.saveStatus='沒有新的保留版本或取證紀錄。';refreshAux();return;}
  if(plan.text.length>10000){slot.saveStatus='本次摘要超過 10,000 字元，尚未附加；完整原稿可下載 JSON 或 TXT。';refreshAux();return;}
  const token={text:plan.text,cursor:plan.cursor};slot.pending=token;slot.saveStatus='正在附加捕獲的版本；仍可繼續寫作。';refreshAux();
  try{const answer=await onSaveSummary(token.text);if(slot.pending!==token)return;if(answer===true){slot.cursor=token.cursor;slot.saveStatus='捕獲版本已附加；等待期間的新修改仍保留。';}else slot.saveStatus='筆記尚未附加；原稿與保存位置保留，可重試或下載。';}
  catch(error){if(slot.pending===token)slot.saveStatus=`筆記尚未附加：${error?.message||error}。原稿仍保留。`;}
  finally{if(slot.pending===token){slot.pending=null;slot.refresh?.();}}
 }
 async function exportFile(kind){
  if(!slot.session||!handle())fail('尚無可下載內容。');
  if(kind==='text'&&allEvidenceRefs().length){commit({type:'freeze-initial',trigger:'下載含既有證據的全文前（不表示已讀）'});refreshAux();}
  const captured=copy(slot.session),payload=kind==='json'?serializeNattoSession(captured,handle()):nattoFullText(captured,handle());
  await onDownload(kind==='json'?'natto-ammonia-session.json':'natto-ammonia-record.txt',payload,kind==='json'?'application/json;charset=utf-8':'text/plain;charset=utf-8');
  if(!disposed)setStatus('已送出下載；檔案是否落盤請以瀏覽器下載為準。');
 }
 async function importFile(file){
  if(!source||!file)return;const epoch=++slot.importEpoch,sourceAtStart=source;
  if(!Number.isFinite(file.size)||file.size<0||file.size>NATTO_SESSION_LIMITS.bytes)fail('工作階段超過 2 MiB 或大小無效；原工作保留。');setStatus('正在核對整份工作階段；原工作保留。');
  const buffer=await file.arrayBuffer();if(disposed||epoch!==slot.importEpoch||source!==sourceAtStart)return;if(buffer.byteLength>NATTO_SESSION_LIMITS.bytes)fail('實際工作階段超過 2 MiB。');
  const raw=new TextDecoder('utf-8',{fatal:true}).decode(buffer);validateNattoSession(raw,sourceAtStart);
  if(disposed||epoch!==slot.importEpoch||source!==sourceAtStart)return;
  slot.session=mergeNattoSession(slot.session,raw,sourceAtStart,{fileName:String(file.name??'')});slot.status='已追加獨立紀錄組；原稿與目前選取保留。匯入歷史是檔案自述。';render();
 }
 function sourceEvent(event){
  if(disposed||!root.contains(event.target))return false;const anchor=event.target.closest?.('[data-na-source]');if(!anchor)return false;
  if(event.type==='click'&&event.button>0||event.type==='auxclick'&&event.button!==1)return true;
  try{
   if(!slot.session||!handle())fail('尚無可核對來源。');const catalogue=getVerifiedNattoAmmoniaData(handle()),item=catalogue.sources.find(value=>value.id===anchor.dataset.naSource),href=anchor.getAttribute?.('href')??anchor.attrs?.get('href');
   if(!item||!['article','pdf'].includes(anchor.dataset.naLink)||href!==(anchor.dataset.naLink==='pdf'?item.pdfUrl:item.url))fail('來源連結不符。');
   const context=event.type==='contextmenu';commit({type:'expose',kind:context?'source-contextmenu':'source-activation',refs:[`source:${item.id}`],detail:`${context?'開啟來源連結選單，尚未確認導航':event.type==='auxclick'?'中鍵啟動來源連結':'啟動來源連結'}：${anchor.dataset.naLink==='pdf'?'刊載版 PDF':'論文頁面'}\n${href}\n不表示已閱讀或理解。`});
   refreshAux();setStatus(context?'已記錄來源選單；不表示已開啟或閱讀。':'已保留初判並記錄來源啟動；不表示已閱讀。');
  }catch(error){event.preventDefault?.();showError(error);}
  return true;
 }
 function click(event){
  if(disposed||!root.contains(event.target)||sourceEvent(event))return;if(event.button>0)return;const target=event.target.closest?.('[data-na-action]');if(!target||target.disabled)return;
  try{const name=target.dataset.naAction;
   if(name==='retry'){void load();return;}if(name==='save-note'){void saveNote().catch(showError);return;}
   if(name==='export-json'||name==='export-text'){void exportFile(name==='export-json'?'json':'text').catch(showError);return;}
   if(name==='import-json'){if(source)q('file')?.click?.();return;}
   if(name==='copy-text'){if(allEvidenceRefs().length)exposeText();refreshAux();q('summary')?.focus?.();q('summary')?.select?.();setStatus('已選取完整文字，可按 Ctrl+C 複製。');return;}
   if(!slot.session||!handle())return;const state=view();
   if(name==='freeze'){commit({type:'freeze-initial',trigger:'主動保留初判'});refreshAux();setStatus('初判已固定；後續想法寫入修訂。');return;}
   if(name==='reveal'){
    if(!source||state.historical)return;const result=getNattoEvidence(source,state.round.comparisonId,target.dataset.naEndpoint);if(!result.ok)fail('未知證據類型。');if(result.evidence.availability!=='reported'){setStatus('本比較未刊載此項證據。');return;}
    commit({type:'expose',kind:'result-displayed',refs:result.evidence.records.map(record=>`evidence:${record.id}`),detail:target.dataset.naEndpoint==='food-urea-stock'?'在本頁顯示尿素庫存與起始差證據；不是生成或消耗量。':'在本頁顯示取樣後氣相釋氨證據；不指定殘餘來源。'});slot.status='已保留初判並顯示這項證據；另一項不會自動揭示。';render();return;
   }
   if(name==='retain'){commit({type:'retain-revision'});slot.status='這版修訂已保留在本頁；下載 JSON 可重新開啟。';refreshAux();return;}
   if(name==='new-round'){if(!source)return;commit({type:'new-round',comparisonId:state.round.comparisonId});slot.status='已另開一輪；原稿與先前顯示紀錄仍保留。';render();return;}
   if(name==='current'){const selection=slot.session.activeSelection;commit({type:'select',setId:selection.setId,roundId:selection.roundId,revisionId:null});render();return;}
  }catch(error){showError(error);}
 }
 function input(event){
  if(disposed||!root.contains(event.target)||!slot.session||!handle())return;const key=event.target.dataset?.naField;if(!Object.hasOwn(WRITING,key))return;
  const previous=view().working[key];
  try{const state=view();if(state.historical||key==='discriminatorReason'&&state.round.initial){event.target.value=state.working[key];return;}commit({type:'working',patch:{[key]:String(event.target.value)}});rejectedCompositionInputs.delete(event.target);if(slot.details['full-text'])setTextPreservingSelection(q('summary'),fullText());}
  catch(error){if(composing)rejectedCompositionInputs.set(event.target,previous);else setTextPreservingSelection(event.target,previous);showError(new Error('本次輸入未加入；原稿保留。'+(error?.message||String(error))));}
 }
 function change(event){
  if(disposed||!root.contains(event.target))return;const target=event.target;
  if(target.dataset?.naFile!==undefined){const file=target.files?.[0];void importFile(file).catch(showError).finally(()=>{if(!disposed&&root.contains(target))target.value='';});return;}
  if(!slot.session||!handle())return;
  try{
   if(target.dataset?.naComparison!==undefined){if(!source)return;if(target.value===selected().round.comparisonId)return;commit({type:'new-round',comparisonId:target.value});slot.status='已另開這組比較，原本的完整工作稿保留。';render();return;}
   if(target.dataset?.naHistory!==undefined){
    const [setId,roundId,revisionToken]=target.value.split('/'),revisionId=revisionToken==='current'?null:revisionToken;
    const candidate=updateNattoSession(slot.session,{type:'select',setId,roundId,revisionId},handle()),targetView=selected(candidate),refs=(targetView.revision?targetView.revision.evidenceRefs:targetView.round.revealedEvidenceRefs.map(ref=>`evidence:${ref}`));
    if(refs.length)commit({type:'expose',kind:'history-result-displayed',refs,detail:'切換紀錄並顯示其中已刊證據；不表示已讀。'});
    commit({type:'select',setId,roundId,revisionId});slot.status=revisionId?'目前為唯讀保留版本。':'已回到所選輪次的目前工作稿。';render();return;
   }
   const key=target.dataset?.naField;if(['hypothesis','ammoniaPrediction','ureaPrediction'].includes(key)){const state=view();if(!source||state.historical||state.round.initial){target.value=state.working[key];return;}commit({type:'working',patch:{[key]:target.value}});if(slot.details['full-text'])setTextPreservingSelection(q('summary'),fullText());}
  }catch(error){showError(error);}
 }
 function toggle(event){if(disposed||!root.contains(event.target)||event.target.dataset?.naDetail===undefined)return;const name=event.target.dataset.naDetail,next=!!event.target.open;if(slot.details[name]===next)return;slot.details[name]=next;try{if(name==='full-text'&&next&&slot.session){exposeText();refreshAux();}}catch(error){showError(error);}}
 const compositionStart=()=>{composing=true;},compositionEnd=()=>{composing=false;for(const [node,previous] of rejectedCompositionInputs)if(root.contains(node))setTextPreservingSelection(node,previous);rejectedCompositionInputs.clear();if(deferredRender){deferredRender=false;void Promise.resolve().then(()=>{if(!disposed)render();});}};
 const handlers=[['click',click,false],['auxclick',sourceEvent,false],['contextmenu',sourceEvent,false],['input',input,false],['change',change,false],['toggle',toggle,true],['compositionstart',compositionStart,false],['compositionend',compositionEnd,false]];
 for(const [name,handler,options] of handlers)root.addEventListener(name,handler,options);
 function dispose(){if(disposed)return;disposed=true;loadEpoch++;slot.importEpoch++;abort?.abort();for(const [name,handler,options] of handlers)root.removeEventListener(name,handler,options);if(slot.dispose===dispose)slot.dispose=null;if(slot.refresh===refreshAux)slot.refresh=null;}
 slot.dispose=dispose;slot.refresh=refreshAux;void load();return dispose;
}
