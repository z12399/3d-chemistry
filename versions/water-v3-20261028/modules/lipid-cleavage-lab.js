import {loadLipidCleavageCases,getVerifiedLipidCleavageData} from './lipid-cleavage-source.js';
import {createLipidCleavageDraft,getLipidCleavageStart,getLipidCleavageReference,inspectLipidCleavageInput,previewLipidCleavageDraft,previewLipidCleavageNumbering,compileLipidCleavageDraft,evaluateLipidCleavageAttempt,evaluateLipidCleavageGraph} from './lipid-cleavage-model.js';
import {createLipidSession,replaceLipidWorking,newLipidSeries,captureLipidRaw,appendLipidCapture,appendLipidEvent,selectLipidHistory,reviseLipidSnapshot,validateLipidSession,serializeLipidSession,mergeLipidSession,lipidCurrent,lipidSummary,lipidFullText,lipidEventOrigin,stableLipidJson,LIPID_LIMITS} from './lipid-cleavage-record.js';
import {escapeLipidHtml as esc,renderLipidBoard,renderLipidLedger,renderLipidIssues,renderLipidAssessment} from './lipid-cleavage-diagrams.js';

export const LIPID_CLEAVAGE_ACTIVITY_ID='lipid-cleavage-ledger';
const owners=new WeakMap(),copy=value=>JSON.parse(JSON.stringify(value));
let sequence=0;
const choices={cutBond:[['UNSELECTED','尚未選擇'],['C8-C9','C8–C9'],['C9-C10','C9–C10']],C9O9BondOrder:[['UNSELECTED','尚未選擇'],[1,'單鍵'],[2,'雙鍵'],[3,'三鍵']],radicalAtomId:[['UNSELECTED','尚未選擇'],['O9','O9'],['C8','C8'],['C9','C9'],['C10','C10']],keepFragments:[['UNSELECTED','尚未選擇'],['both','兩個片段'],['head-only','只有連 PC 側'],['tail-only','只有另一側']]};
const geometries=[['UNSELECTED','尚未選擇'],['E','E'],['Z','Z'],['UNSPECIFIED','題設未指定'],['NOT_ASSESSED','自由基中心：未評定']];
const originOptions=[['UNSELECTED','尚未選擇'],...Array.from({length:18},(_,i)=>[`C${i+1}`,`原 C${i+1}`])];
const options=(values,selected)=>values.map(([value,label])=>`<option value="${esc(value)}"${String(value)===String(selected)?' selected':''}>${esc(label)}</option>`).join('');
const parse=raw=>{try{return JSON.parse(raw);}catch{return null;}};
const json=value=>JSON.stringify(value,null,2);
const differentInitial=(value,initial)=>!!(value?.initialStateRef&&stableLipidJson(value.initialStateRef)!==stableLipidJson(initial)||value?.geometryVariant&&value.geometryVariant!==initial.geometryVariant);
function downloadText(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);}
function contextOf(source){
 if(!getVerifiedLipidCleavageData(source))throw new Error('來源未通過核對。');
 const starts={};for(const variant of ['unknown','EE','EZ']){const result=createLipidCleavageDraft(source,variant);if(!result.ok||!result.draft)throw new Error('無法建立已核對起態。');starts[variant]=copy(result.draft.initialStateRef);}
 return {sourceIdentityRaw:stableLipidJson(source.sourceIdentity),starts};
}
const safeUrl=value=>{try{const url=new URL(value);return url.protocol==='https:'?url.href:null;}catch{return null;}};

export function mountLipidCleavageLab(root,id=LIPID_CLEAVAGE_ACTIVITY_ID,{draftOwner,draftKey=id,onSaveSummary,loadData=loadLipidCleavageCases,onDownload=downloadText}={}){
 if(id!==LIPID_CLEAVAGE_ACTIVITY_ID)throw new Error('不支援這個斷鏈活動。');
 if(!root||typeof root.addEventListener!=='function'||typeof root.querySelector!=='function')throw new TypeError('工作台需要可用的節點。');
 if(typeof loadData!=='function'||typeof onDownload!=='function')throw new TypeError('來源與下載接點必須是函式。');
 const owner=(typeof draftOwner==='object'&&draftOwner!==null)||typeof draftOwner==='function'?draftOwner:root;
 let slots=owners.get(owner);if(!slots){slots=new Map();owners.set(owner,slots);}
 let slot=slots.get(draftKey);if(!slot){slot={session:null,context:null,lastSource:null,cursor:{},pendingSave:null,details:{},status:'',saveStatus:'',dispose:null,refresh:null,importEpoch:0};slots.set(draftKey,slot);}
 slot.dispose?.();const prefix=`lc${++sequence}`,mountToken={};slot.mountToken=mountToken;
 let disposed=false,source=null,loadEpoch=0,sourceError='',abort=null,busy=false,assessment=null,reference=null,ledgerAtom=null;
 const popups=new Set(),q=hook=>root.querySelector(`[data-lc-${hook}]`);
 const active=()=>slot.session?lipidCurrent(slot.session):null;
 const historical=()=>slot.session?.selection.snapshotId!==null;
 const displayedRaw=()=>active()?.snapshot?.raw??active()?.series.working.raw??'';
 const draftValue=()=>{const result=inspectLipidCleavageInput(displayedRaw(),'draft');return result.ok?result.value:null;};
 const editable=()=>!!source&&!historical()&&!busy;
 const setStatus=message=>{slot.status=message;if(!disposed&&q('status'))q('status').textContent=message;};
 const error=err=>{if(!disposed)setStatus(err?.message||'操作未完成；原工作保留。');};
 function field(path,label,values,value,disabled=!editable()){return `<label for="${prefix}-${path.replaceAll('.','-')}">${label}<select id="${prefix}-${path.replaceAll('.','-')}" data-lc-field="${path}"${disabled?' disabled':''}>${options(values,value)}</select></label>`;}
 function button(action,label,{disabled=false,extra=''}={}){return `<button type="button" data-lc-action="${action}"${extra?` ${extra}`:''}${disabled?' disabled':''}>${label}</button>`;}
 function detail(name,title,body){return `<details data-lc-detail="${name}"${slot.details[name]?' open':''}><summary>${title}</summary>${body}</details>`;}
 function focusCapture(){
  const node=root.ownerDocument?.activeElement;if(!node||!root.contains(node))return null;
  const hooks=['lcAction','lcField','lcHistory','lcRaw','lcExplanation','lcObservation','lcVariant','lcMarker','lcMarkerField','lcSource','lcReferenceBranch','lcLedgerSelect'];
  const data=Object.fromEntries(hooks.filter(key=>node.dataset?.[key]!==undefined).map(key=>[key,node.dataset[key]]));
  const detailName=node.tagName?.toLowerCase()==='summary'?node.closest('[data-lc-detail]')?.dataset.lcDetail:null;
  return {data,detailName,start:node.selectionStart,end:node.selectionEnd,direction:node.selectionDirection};
 }
 function focusRestore(saved){
  if(!saved)return;const node=saved.detailName?[...root.querySelectorAll('[data-lc-detail]')].find(n=>n.dataset.lcDetail===saved.detailName)?.querySelector('summary'):[...root.querySelectorAll('input,select,button,textarea,a')].find(n=>Object.keys(saved.data).length&&Object.entries(saved.data).every(([key,value])=>n.dataset?.[key]===value));
  if(node&&!node.disabled){node.focus?.({preventScroll:true});if(Number.isInteger(saved.start))try{node.setSelectionRange(saved.start,saved.end,saved.direction);}catch{}}
 }
 function preview(){
  if(!slot.lastSource||!slot.session)return null;
  const raw=displayedRaw(),parsed=parse(raw),kind=parsed?.schemaVersion;
  if(differentInitial(parsed,active().series.initialStateRef))return null;
  if(kind==='lipid-cleavage-draft/v1'){const result=previewLipidCleavageDraft(slot.lastSource,raw);return result.ok?result.preview:null;}
  if(kind==='lipid-cleavage-submission/v1'||kind==='lipid-cleavage-attempt/v1'){
   const result=evaluateLipidCleavageAttempt(slot.lastSource,raw);if(!result.graph)return null;
   const virtualMarkers=(parsed.virtualMarkers??[]).map(marker=>{if(kind==='lipid-cleavage-submission/v1')return copy(marker);const role=result.graph.components.find(component=>component.id===marker.predictedComponentId)?.role;return {atomId:marker.atomId,color:marker.colorTag,predictedFragment:role??'UNSELECTED',displayPrediction:`${role==='head'?'連 PC 側':role==='tail'?'另一側':'指定片段'}（${marker.predictedComponentId}）`};});
   return {...result.graph,virtualMarkers};
  }
  const result=evaluateLipidCleavageGraph(slot.lastSource,raw);return result.graph??null;
 }
 function historyOptions(){
  if(!slot.session)return '';
  return slot.session.recordSets.flatMap(set=>set.series.flatMap(series=>{
   const values=[{id:null,label:'目前草稿'},...series.snapshots.map(s=>({id:s.id,label:`${s.id} · ${s.kind} · 父版 ${s.parentId}`}))];
   return values.map(item=>{const value=`${set.key}|${series.id}|${item.id??'current'}`,selected=slot.session.selection.setKey===set.key&&slot.session.selection.seriesId===series.id&&slot.session.selection.snapshotId===item.id;return `<option value="${value}"${selected?' selected':''}>${set.key}/${series.id} · ${series.initialStateRef.geometryVariant} · ${esc(item.label)}</option>`;});
  })).join('');
 }
 function historyBody(){
  if(!slot.session)return '';
  const {set,series,snapshot}=active(),events=snapshot?series.events.filter(e=>e.snapshotId===snapshot.id):series.events.slice(-8);
  return `<label for="${prefix}-history">選一版查看<select id="${prefix}-history" data-lc-history>${historyOptions()}</select></label><p data-lc-history-mode>${snapshot?'這份原稿唯讀；建立修訂後再改。':'目前草稿可編輯；舊原稿一直保留。'}</p>${snapshot?button('revise','由這版建立修訂',{disabled:busy})+button('current','回目前草稿',{disabled:busy}):''}<label for="${prefix}-raw">${snapshot?'原始內容':'原稿文字'}<textarea id="${prefix}-raw" data-lc-raw rows="5"${snapshot?' readonly':''}>${esc(displayedRaw())}</textarea></label>${snapshot?'':button('apply-raw','更新圖式預覽',{disabled:!source||busy})}<div class="lc-event-list">${events.map(event=>`<details><summary>${event.sequence} · ${esc(event.kind)} · ${lipidEventOrigin(set,series,event)==='imported-claim'?'檔案自述':'本頁紀錄'}</summary><pre>${esc(event.payload)}</pre></details>`).join('')}</div>`;
 }
 function updateHistory(){const region=q('history-region');if(region)region.innerHTML=historyBody();}
 function sourceLinks(){
  // The verified catalogue supplies actual link metadata; the sealed model API fixes this shape.
  const sources=slot.lastSource?.catalogue?.sourcePins?.locators??[];
  const labels={'P2016-IDENTITY':'2016 · 起始脂質身分','P2016-CONDITIONS':'2016 · 實驗條件','P2016-SCHEME2':'2016 · Scheme 2','P2016-BRANCH-TEXT':'2016 · 兩分支正文','P1976-GC-COUNTEREXAMPLE':'1976 · GC 產物反例'};
  return Array.isArray(sources)?sources.filter(item=>safeUrl(item.url)).map(item=>`<li><a href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer" data-lc-source="${esc(item.id)}">${esc(labels[item.id]||item.id)}</a><p>${esc(item.doi??'')} · ${esc(item.locator??'')}</p></li>`).join(''):'';
 }
 function markers(draft){
  return ['C8','C9','C10','O9'].map((atomId,index)=>{const item=draft?.virtualMarkers?.find(m=>m.atomId===atomId);return `<fieldset class="lc-marker"><legend>${atomId}</legend><label><input type="checkbox" data-lc-marker="${atomId}"${item?' checked':''}${!editable()?' disabled':''}>標這顆</label><label>顏色<select data-lc-marker="${atomId}" data-lc-marker-field="color"${!editable()||!item?' disabled':''}>${options([['red','紅'],['blue','藍'],['green','綠'],['yellow','黃']],item?.color??['red','blue','green','yellow'][index])}</select></label><label>我預測它在<select data-lc-marker="${atomId}" data-lc-marker-field="predictedFragment"${!editable()||!item?' disabled':''}>${options([['UNSELECTED','尚未選擇'],['head','連 PC 側'],['tail','另一側']],item?.predictedFragment??'UNSELECTED')}</select></label></fieldset>`;}).join('');
 }
 function render(){
  if(disposed)return;const focused=focusCapture(),scrolls=[...root.querySelectorAll('[data-lc-scroll]')].map(el=>[el.dataset.lcScroll,el.scrollLeft,el.scrollTop]);
  if(!slot.session){root.innerHTML=`<section class="lipid-cleavage-ledger" data-lc-ready="false"><p data-lc-status role="status">${esc(sourceError||'正在核對來源…')}</p>${sourceError?button('retry','重新載入來源'):''}</section>`;return;}
  const draft=draftValue(),graph=preview(),variant=active().series.initialStateRef.geometryVariant,locked=!editable()||!draft;
  const primary=`<div class="lc-primary-controls">${field('choices.cutBond','斷哪一鍵',choices.cutBond,draft?.choices.cutBond,locked)}${field('choices.C9O9BondOrder','C9–O9 改成',choices.C9O9BondOrder,draft?.choices.C9O9BondOrder,locked)}${field('choices.radicalAtomId','自由基放在',choices.radicalAtomId,draft?.choices.radicalAtomId,locked)}</div>`;
  const numbered=draft?.numbering.applied===true,numbering=source&&draft?previewLipidCleavageNumbering(source,json(draft)):null;
  const secondary=detail('products','補齊兩側產物與編號',`${field('choices.keepFragments','我的方案保留',choices.keepFragments,draft?.choices.keepFragments,locked)}<div class="lc-paired-controls">${field('numbering.headOriginAt1','連 PC 側：哪顆是產物 1 號？',originOptions,draft?.numbering.headOriginAt1,locked)}${field('numbering.tailOriginAt1','另一側：哪顆是產物 1 號？',originOptions,draft?.numbering.tailOriginAt1,locked)}</div><p data-lc-numbering-status>${numbered?'已套用自己選的編號。':'尚未套用；圖上的產物號保持未填。'}</p>${numbering?.ok?`<p class="lc-numbering-preview">連 PC 側：原 ${esc(draft.numbering.headOriginAt1)} → 產物 1；另一側：原 ${esc(draft.numbering.tailOriginAt1)} → 產物 1。其餘依各自碳鏈順序編排。</p>`:renderLipidIssues(numbering?.issues??[])}${button('apply-numbering','套用我的編號',{disabled:locked||!numbering?.ok})}`);
  const stereo=detail('geometry','雙鍵幾何',`<div class="lc-paired-controls">${field('geometry.C10_C11','原 C10=C11',geometries,draft?.geometry.C10_C11,locked)}${field('geometry.C12_C13','原 C12=C13',geometries,draft?.geometry.C12_C13,locked)}</div><p>題設未指定與自由基中心未評定是兩種不同情況。</p>`);
  const marking=detail('markers','預測一顆原子的去向',`<div class="lc-markers">${markers(draft)}</div><p>色標只追蹤原子身分；不表示同位素實驗。</p>`);
  const writing=detail('writing','寫下判斷與觀察',`<label for="${prefix}-explanation">我認為兩邊留下什麼，因為…<textarea id="${prefix}-explanation" data-lc-explanation rows="3" maxlength="10000"${locked?' readonly':''}>${esc(draft?.explanation??'')}</textarea></label><label for="${prefix}-observation">觀察與修訂<textarea id="${prefix}-observation" data-lc-observation rows="3" maxlength="10000"${historical()?' readonly':''}>${esc(active().series.working.observation)}</textarea></label>${button('record-observation','保留這段觀察',{disabled:historical()||busy})}`);
  const tools=detail('save','保存與還原',`<p>本頁暫存；離開或重新整理前，請下載方案檔。</p><div class="lc-actions">${button('export-json','下載方案 JSON')}${button('import-json','載入方案檔',{disabled:!source||busy})}${button('export-text','下載完整文字')}${button('copy-text','選取完整文字')}${button('save-note','附加到本課筆記',{disabled:typeof onSaveSummary!=='function'||!!slot.pendingSave||busy})}</div><input type="file" accept="application/json,.json" data-lc-file hidden><p data-lc-save-status role="status">${esc(slot.saveStatus)}</p><textarea data-lc-full-text rows="3" readonly aria-label="完整紀錄文字"></textarea><p>方案檔可還原圖和歷史；三科學習紀錄只含已保存筆記。</p>`);
  root.innerHTML=`<section class="lipid-cleavage-ledger" data-lc-ready="${!!source}" data-lc-history-view="${historical()}"><div class="lc-premise"><p>給定 C9 烷氧自由基 · PC 其餘部分固定</p><label for="${prefix}-variant">題設幾何<select id="${prefix}-variant" data-lc-variant${!source||busy?' disabled':''}>${options([['unknown','未指定'],['EE','EE'],['EZ','EZ']],variant)}</select></label></div><p class="lc-quiet">原 ID 一直不變；產物編號另填。題設不代表原研究已測得各異構物。</p>${sourceError?`<p class="lc-error">${esc(sourceError)} 既有原稿保留。</p>${button('retry','重新載入來源')}`:''}${primary}<div data-lc-board>${renderLipidBoard(graph,{editable:editable()&&!!draft,pending:!historical()})}</div><div class="lc-secondary">${secondary}${stereo}${marking}</div>${writing}<div class="lc-actions lc-submit">${button('assess','保留並核對',{disabled:!source||busy||historical()})}${button('retain','只保留原稿',{disabled:busy||historical()})}</div><div data-lc-result>${renderLipidAssessment(assessment)}</div>${detail('reference','比較參考圖與文獻',`<div class="lc-actions">${button('reference','看 C8–C9 分支',{disabled:!source||busy,extra:'data-lc-reference-branch="A"'})}${button('reference','看 C9–C10 分支',{disabled:!source||busy,extra:'data-lc-reference-branch="B"'})}</div><div data-lc-reference-region></div><p>查看前會保留目前原稿；參考內容不替換作答。課文可能已公開答案，這裡不是盲測。</p>`)}${detail('ledger','查看完整原子帳',renderLipidLedger(graph))}${detail('history','原稿與歷史',`<div data-lc-history-region>${historyBody()}</div>`)}${detail('sources','查看來源',`<ul data-lc-sources>${sourceLinks()}</ul><p>開啟只記錄請求，不表示已讀懂。2016 的 PC 實驗與 1976 的甲酯 GC 熱分解分別解讀。</p>`)}${tools}<p data-lc-status role="status" aria-live="polite">${esc(slot.status)}</p></section>`;
  if(reference)showReference();showLedgerAtom();focusRestore(focused);for(const [name,left,top] of scrolls){const element=[...root.querySelectorAll('[data-lc-scroll]')].find(el=>el.dataset.lcScroll===name);if(element){element.scrollLeft=left;element.scrollTop=top;}}
 }
 function showLedgerAtom(){const target=q('atom-inspection'),atom=preview()?.atoms?.find(item=>item.id===ledgerAtom);if(target&&atom)target.textContent=`原 ${atom.id} · ${atom.element==='H'?`母碳 ${atom.parentCarbonId}`:`元素 ${atom.element}`} · 形式電荷 ${atom.formalCharge} · 非鍵電子 ${atom.nonbondingElectrons} · 未成對電子 ${atom.radicalElectrons}`;}
 function showReference(){if(!reference||!q('reference-region'))return;const branch=reference.branch;const text=branch==='A'?'作者提出的小程度支路：尾側醛與連 PC 的 C8 烷基自由基都要保留。':'作者認為直接形成 C10 烯基自由基不利；形式帳能通過，仍不代表這條路徑同等可行。';q('reference-region').innerHTML=`<p data-lc-source-interpretation>${text}</p>${renderLipidBoard(reference.graph,{reference:true,pending:false})}<p>沒有分支機率、收率或速率。1976 的甲酯 GC 結果只說明，看到相同醛不能唯一反推起始過氧位置。</p>`;}
 function updateWorking(raw,observation){slot.session=replaceLipidWorking(slot.session,raw,observation);assessment=null;reference=null;}
 function mutateDraft(mutator){if(!source||historical()||busy)throw new Error('目前不能修改圖式；原稿仍保留。');const draft=draftValue();if(!draft)throw new Error('這份原稿格式不完整；請在原稿區修訂。');mutator(draft);updateWorking(json(draft));render();}
 async function preserve(raw=displayedRaw(),kind,selection=copy(slot.session.selection)){
  const selected=slot.session.recordSets.find(set=>set.key===selection.setKey)?.series.find(s=>s.id===selection.seriesId);if(!selected)throw new Error('找不到原稿所屬系列。');
  const parentId=selection.snapshotId??selected.working.parentId;
  if(!kind){const parsed=parse(raw),schema=parsed?.schemaVersion;kind=schema==='lipid-cleavage-draft/v1'?'draft':schema==='lipid-cleavage-submission/v1'||schema==='lipid-cleavage-attempt/v1'?'submission':'raw';if(parsed?.initialStateRef&&stableLipidJson(parsed.initialStateRef)!==stableLipidJson(selected.initialStateRef))kind='raw';}
  const same=selected.snapshots.find(item=>item.id===parentId&&item.kind===kind&&item.raw===raw);
  if(same)return {snapshotId:same.id,selection:{setKey:selection.setKey,seriesId:selection.seriesId,snapshotId:null},raw};
  const captured=await captureLipidRaw(raw,kind);if(disposed)return null;
  const retained=appendLipidCapture(slot.session,captured,{...selection,parentId});slot.session=retained.session;
  const anchor={setKey:selection.setKey,seriesId:selection.seriesId,snapshotId:null};
  const series=slot.session.recordSets.find(set=>set.key===anchor.setKey).series.find(s=>s.id===anchor.seriesId);
  if(!series.events.some(event=>event.kind==='course-exposure'))slot.session=appendLipidEvent(slot.session,'course-exposure',retained.snapshotId,json({text:'課文可能已公開答案；不聲稱這是盲測。'}),anchor);
  return {snapshotId:retained.snapshotId,selection:anchor,raw};
 }
 function addEvent(saved,kind,payload){slot.session=appendLipidEvent(slot.session,kind,saved.snapshotId,json(payload),saved.selection);}
 function matchesView(saved,raw){return slot.session.selection.setKey===saved.selection.setKey&&slot.session.selection.seriesId===saved.selection.seriesId&&displayedRaw()===raw;}
 function recordAssessment(saved,raw,result){addEvent(saved,'assessment',result);assessment=matchesView(saved,raw)?result:null;}
 async function perform(task,{repaint=true}={}){
  if(busy)return;busy=true;try{await task();}catch(err){error(err);}finally{busy=false;if(!disposed){if(repaint)render();else updateHistory();}}
 }
 async function assess(){
  if(!source||historical())return;const raw=displayedRaw(),saved=await preserve(raw);if(!saved||disposed)return;
  const parsedInput=parse(raw),series=slot.session.recordSets.find(set=>set.key===saved.selection.setKey)?.series.find(item=>item.id===saved.selection.seriesId);
  if(differentInitial(parsedInput,series.initialStateRef)){
   const issues=[{code:'INITIAL_STATE_SERIES_MISMATCH',path:'initialStateRef',message:'原文的起始題設與目前系列不同。請另開對應題設系列，再帶入此稿；原文已保存，沒有轉移系列。'}];
   recordAssessment(saved,raw,{ok:false,stage:'source',status:'rejected',issues,formal:{status:'not-assessed',issues},evidence:{status:'not-assessed-input',issues:[]},graph:null});setStatus('原文已保留；題設與目前系列不同，請另開對應題設後再核對。');return;
  }
  const inspected=inspectLipidCleavageInput(raw,'draft');
  if(inspected.ok){
   const compiled=compileLipidCleavageDraft(source,raw);addEvent(saved,'compile',{status:compiled.status,issues:compiled.issues});
   if(!compiled.ok||!compiled.attempt){assessment=matchesView(saved,raw)?{status:compiled.status,issues:compiled.issues,formal:{status:'not-assessed',issues:compiled.issues}}:null;setStatus('未完成的方案已保留，請補上自己的選擇。');return;}
   const submission=await captureLipidRaw(json(compiled.attempt),'submission');if(disposed)return;
   const retained=appendLipidCapture(slot.session,submission,{...saved.selection,parentId:saved.snapshotId});slot.session=retained.session;
   recordAssessment({...saved,snapshotId:retained.snapshotId},raw,evaluateLipidCleavageAttempt(source,submission.raw));
  }else{const parsed=parse(raw),schema=parsed?.schemaVersion;let result=schema==='lipid-cleavage-submission/v1'||schema==='lipid-cleavage-attempt/v1'?evaluateLipidCleavageAttempt(source,raw):evaluateLipidCleavageGraph(source,raw);if(parsed?.state==='start')result={...result,submissionStatus:'given-start-not-submitted'};recordAssessment(saved,raw,result);}
  setStatus('已保留原稿與獨立核對結果；可繼續修訂。');
 }
 async function reveal(branch){
  if(!source)return;const saved=await preserve();if(!saved||disposed)return;if(!matchesView(saved,saved.raw)){setStatus('原稿已保留；畫面已切換，請在目前方案重新開啟參考圖。');return;}const result=getLipidCleavageReference(source,active().series.initialStateRef.geometryVariant,branch);if(!result.ok)throw new Error(result.issues?.[0]?.message||'參考圖無法取得。');
  addEvent(saved,'source-display',{sourceId:'P2016',display:`reference-${branch}`,text:'已在本頁顯示參考圖；不表示已讀懂。'});reference={branch,graph:result.graph};showReference();setStatus('原稿已保留；參考圖另列，不替換自己的方案。');
 }
 async function exportJson(){if(!slot.session||!slot.context)throw new Error('尚無可下載的工作。');const captured=copy(slot.session),raw=await serializeLipidSession(captured,slot.context);await onDownload('lipid-cleavage-design.json',raw,'application/json;charset=utf-8');if(!disposed)setStatus('已送出方案下載；是否落盤以瀏覽器下載為準。');}
 async function saveNote(){
  if(slot.pendingSave||busy||typeof onSaveSummary!=='function')return;
  const pending={text:null,cursor:null,mountToken};slot.pendingSave=pending;busy=true;
  try{
   const saved=await preserve();busy=false;if(!saved||disposed)return;
   const plan=lipidSummary(slot.session,slot.cursor);if(!plan.text){slot.saveStatus='這些版本已附加，沒有新內容。';return;}
   if(plan.text.length>10000){slot.saveStatus='摘要超過本課筆記上限；原稿完整保留，請下載完整文字或方案。';return;}
   pending.text=plan.text;pending.cursor=plan.cursor;slot.saveStatus='正在附加捕獲的版本；仍可繼續寫作。';if(q('save-status'))q('save-status').textContent=slot.saveStatus;
   const result=await onSaveSummary(pending.text);if(disposed||slot.mountToken!==mountToken||slot.pendingSave!==pending)return;
   if(result===true){slot.cursor=pending.cursor;slot.saveStatus='捕獲版本已附加；等待期間的新修改仍保留。';}else slot.saveStatus='筆記尚未附加；原稿完整保留，可複製或下載。';
  }catch(err){if(!disposed&&slot.mountToken===mountToken&&slot.pendingSave===pending)slot.saveStatus=`筆記尚未附加：${err?.message||'保存失敗'}。原稿仍保留。`;}
  finally{busy=false;if(!disposed&&slot.mountToken===mountToken&&slot.pendingSave===pending){slot.pendingSave=null;render();}}
 }
 async function importFile(file){
  if(!source||!file)return;const epoch=++slot.importEpoch,sourceAtStart=source;
  if(!Number.isFinite(file.size)||file.size<0||file.size>LIPID_LIMITS.sessionBytes)throw new Error('方案檔超過 8 MiB 或大小無效。');
  setStatus('正在核對整份方案；目前工作保留。');const buffer=await file.arrayBuffer();if(disposed||epoch!==slot.importEpoch||source!==sourceAtStart)return;
  if(buffer.byteLength>LIPID_LIMITS.sessionBytes)throw new Error('方案檔超過 8 MiB。');const raw=new TextDecoder('utf-8',{fatal:true}).decode(buffer);
  await validateLipidSession(raw,slot.context);if(disposed||epoch!==slot.importEpoch||source!==sourceAtStart)return;
  // Every await is followed by owner/epoch and base-identity checks before commit.
  for(let attempt=0;attempt<3;attempt++){
   const base=slot.session,merged=await mergeLipidSession(base,raw,slot.context,String(file.name??''));if(disposed||epoch!==slot.importEpoch||source!==sourceAtStart)return;
   if(slot.session!==base)continue;
   slot.session=merged;assessment=null;reference=null;setStatus('已新增獨立方案組；原本工作與原 ID 保留。帶入的歷史結果是檔案自述。');render();return;
  }
  throw new Error('核對期間草稿持續變動；尚未加入檔案，請稍後重試。原工作保留。');
 }
 async function load(){
  const epoch=++loadEpoch;abort?.abort();abort=new AbortController();source=null;sourceError='';render();
  try{const handle=await loadData({signal:abort.signal});if(disposed||epoch!==loadEpoch)return;const context=contextOf(handle);
   if(slot.session){await validateLipidSession(JSON.stringify(slot.session),context);if(disposed||epoch!==loadEpoch)return;}
   else{const draft=createLipidCleavageDraft(handle,'unknown');if(!draft.ok)throw new Error('起始題設無法取得。');slot.session=createLipidSession(context,draft.draft.initialStateRef,json(draft.draft));}
   source=handle;slot.lastSource=handle;slot.context=context;slot.status='先選斷點，再分別完成兩側方案。';render();
  }catch(err){if(disposed||epoch!==loadEpoch)return;source=null;sourceError=err?.message||'來源無法核對。';slot.status='來源尚未核對；原工作保留。';render();}
 }
 function sourceRequest(event,target){
  event.preventDefault?.();if(!source||busy){setStatus('請等目前保存／來源核對完成，再開來源。');return;}const url=safeUrl(target.getAttribute?.('href')??target.attrs?.get('href'));if(!url)return;
  let popup=null;try{if(typeof globalThis.open==='function')popup=globalThis.open('about:blank','_blank');}catch{}if(popup){try{popup.opener=null;}catch{}popups.add(popup);}
  void perform(async()=>{try{const saved=await preserve();if(!saved||disposed){popup?.close?.();popups.delete(popup);return;}addEvent(saved,'source-request',{sourceId:target.dataset.lcSource,url,request:popup?'navigation-requested':'popup-unavailable',text:'開啟請求不表示已讀或已理解。'});if(popup){popup.location.href=url;popups.delete(popup);setStatus('已記錄來源開啟請求；原稿保持不變。');}else setStatus('已保留原稿；瀏覽器未提供新視窗，請檢查彈窗設定後重試。');}catch(err){popup?.close?.();popups.delete(popup);throw err;}},{repaint:false});
 }
 function action(event){
  if(disposed)return;
  const sourceLink=event.target?.closest?.('[data-lc-source]');if(sourceLink&&root.contains(sourceLink)&&(event.type==='click'||event.type==='auxclick'&&event.button===1)){sourceRequest(event,sourceLink);return;}
  if(event.type==='auxclick')return;
  const ledger=event.target?.closest?.('[data-lc-ledger-select]');if(ledger&&root.contains(ledger)){ledgerAtom=ledger.dataset.lcLedgerSelect;showLedgerAtom();return;}
  const atom=event.target?.closest?.('[data-lc-atom]');if(atom&&root.contains(atom)){try{mutateDraft(d=>d.choices.radicalAtomId=atom.dataset.lcAtom);}catch(err){error(err);}return;}
  const target=event.target?.closest?.('[data-lc-action]');if(!target||!root.contains(target)||target.disabled)return;
  const name=target.dataset.lcAction;
  if(name==='retry'){void load();return;}
  if(name==='export-json'){void exportJson().catch(error);return;}
  if(name==='export-text'){const raw=lipidFullText(slot.session);void Promise.resolve().then(()=>onDownload('lipid-cleavage-record.txt',raw,'text/plain;charset=utf-8')).then(()=>{if(!disposed)setStatus('已送出完整文字下載。');},error);return;}
  if(name==='copy-text'){const field=q('full-text');field.value=lipidFullText(slot.session);field.focus();field.select();setStatus('已選取完整文字，可複製保存。');return;}
  if(name==='import-json'){q('file')?.click();return;}
  if(name==='save-note'){void saveNote().catch(error);return;}
  if(name==='reference'){void perform(()=>reveal(target.dataset.lcReferenceBranch),{repaint:false});return;}
  if(name==='assess'){void perform(assess);return;}
  if(name==='retain'){void perform(async()=>{await preserve();setStatus('原稿已保留在本頁；請下載方案檔保留工作。');});return;}
  if(name==='record-observation'){const observation=active().series.working.observation;void perform(async()=>{const saved=await preserve();if(saved)addEvent(saved,'observation',{text:observation});setStatus('觀察已另存，舊原稿未改。');});return;}
  try{
   if(name==='apply-numbering'){mutateDraft(d=>{const result=previewLipidCleavageNumbering(source,json(d));if(!result.ok)throw new Error(result.issues?.[0]?.message||'編號仍未完成。');d.numbering.applied=true;});return;}
   if(name==='apply-raw'){assessment=null;reference=null;render();return;}
   if(name==='current'){const {set,series}=active();slot.session=selectLipidHistory(slot.session,set.key,series.id);assessment=null;reference=null;render();return;}
   if(name==='revise'){
    const selection=copy(slot.session.selection),workingRaw=active().series.working.raw;
    void perform(async()=>{await preserve(workingRaw,undefined,{...selection,snapshotId:null});if(disposed||stableLipidJson(slot.session.selection)!==stableLipidJson(selection))return;slot.session=reviseLipidSnapshot(slot.session);assessment=null;reference=null;setStatus('目前未提交稿已保留；已由所選原稿建立修訂，原版仍保留。');});
   }
  }catch(err){error(err);}
 }
 function input(event){
  if(disposed)return;
  const target=event.target;if(!target||!root.contains(target)||!slot.session)return;
  try{
   if(target.dataset.lcRaw!==undefined&&!historical()){updateWorking(String(target.value));return;}
   if(target.dataset.lcObservation!==undefined&&!historical()){slot.session=replaceLipidWorking(slot.session,active().series.working.raw,String(target.value));return;}
   if(target.dataset.lcExplanation!==undefined&&source&&!historical()){const draft=draftValue();if(!draft)return;draft.explanation=String(target.value);updateWorking(json(draft));if(q('raw'))q('raw').value=displayedRaw();}
  }catch(err){error(err);}
 }
 function change(event){
  if(disposed)return;
  const target=event.target;if(!target||!root.contains(target)||!slot.session)return;
  if(target.dataset.lcFile!==undefined){const file=target.files?.[0];void importFile(file).catch(error).finally(()=>{target.value='';});return;}
  try{
   if(target.dataset.lcHistory!==undefined){const [setKey,seriesId,snapshotId]=target.value.split('|');slot.session=selectLipidHistory(slot.session,setKey,seriesId,snapshotId==='current'?null:snapshotId);assessment=null;reference=null;render();return;}
   if(target.dataset.lcVariant!==undefined){const variant=target.value;if(!source||busy)return;void perform(async()=>{const saved=await preserve();if(!saved||disposed)return;const result=createLipidCleavageDraft(source,variant);if(!result.ok)throw new Error('題設無效。');slot.session=newLipidSeries(slot.session,slot.context,result.draft.initialStateRef,json(result.draft));assessment=null;reference=null;setStatus('已另開新題設系列；原有方案完整保留。');});return;}
   if(target.dataset.lcField!==undefined){const [group,key]=target.dataset.lcField.split('.'),value=target.value;mutateDraft(d=>{if(!['choices','numbering','geometry'].includes(group)||!Object.hasOwn(d[group],key))throw new Error('欄位無效。');d[group][key]=key==='C9O9BondOrder'&&value!=='UNSELECTED'?Number(value):value;if(group==='numbering'||key==='cutBond')d.numbering.applied=false;});return;}
   if(target.dataset.lcMarker!==undefined){const atomId=target.dataset.lcMarker,fieldName=target.dataset.lcMarkerField;mutateDraft(d=>{const item=d.virtualMarkers.find(v=>v.atomId===atomId);if(fieldName){if(item&&['color','predictedFragment'].includes(fieldName))item[fieldName]=target.value;}else if(target.checked){if(!item)d.virtualMarkers.push({atomId,color:['red','blue','green','yellow'][['C8','C9','C10','O9'].indexOf(atomId)],predictedFragment:'UNSELECTED'});}else d.virtualMarkers=d.virtualMarkers.filter(v=>v.atomId!==atomId);});}
  }catch(err){error(err);}
 }
 function toggle(event){const target=event.target;if(root.contains(target)&&target.dataset?.lcDetail!==undefined)slot.details[target.dataset.lcDetail]=!!target.open;}
 function keydown(event){const target=event.target?.closest?.('[data-lc-atom]');if(target&&root.contains(target)&&['Enter',' '].includes(event.key)){event.preventDefault?.();action({type:'click',target});}}
 root.addEventListener('click',action);root.addEventListener('auxclick',action);root.addEventListener('input',input);root.addEventListener('change',change);root.addEventListener('toggle',toggle,true);root.addEventListener('keydown',keydown);
 function dispose(){if(disposed)return;disposed=true;loadEpoch++;slot.importEpoch++;abort?.abort();for(const popup of popups)popup?.close?.();popups.clear();root.removeEventListener('click',action);root.removeEventListener('auxclick',action);root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('toggle',toggle,true);root.removeEventListener('keydown',keydown);if(slot.pendingSave?.mountToken===mountToken){slot.pendingSave=null;slot.saveStatus='離開後未確認這次附加結果；原稿保留。';}if(slot.dispose===dispose)slot.dispose=null;if(slot.refresh===refresh)slot.refresh=null;}
 function refresh(){if(!disposed)render();}slot.refresh=refresh;slot.dispose=dispose;void load();return dispose;
}
