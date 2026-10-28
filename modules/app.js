import {MoleculeViewer} from './viewer.js';
import {rotateBond,wrap,interpolateEnergy,deltaGFromRatio,R,sub,norm} from './math.js';
import {reactionState,REACTION_STEPS,validateReactionMove,reactionEquation} from './reactions.js';
import {escapeHTML as esc,readNotes,NotebookStore,validateNotebook,validateRestoreState,mechanismLabel,SESSION_KEY,downloadText,exportMarkdown} from './storage.js';
import {energyChart,newmanSVG} from './charts.js';
import {sourcesHTML,foodCards} from './content.js';
import {ReactionAtlas} from './atlas.js';
import {builtinMechanisms} from './builtin-mechanisms.js';
import {PathPositions,pathContext} from './learning-paths-model.js';
import {LearningStudio} from './learning.js';
import {LearningProgress,resolveLearningRoute,allLessons,lessonPath} from './learning-model.js';
import {subjectForPath,subjectNavigation,LEARNING_SUBJECTS} from './learning-subjects.js';
import {createSessionNoteDraftStore} from './session-note-drafts.js';

const $=id=>document.getElementById(id);
const names={'glucose-alpha':'α-D-葡萄糖','glucose-beta':'β-D-葡萄糖','glucose-open':'開鏈 D-葡萄糖',ethane:'乙烷',butane:'丁烷'};
const labels={explore:['CONFORMATION LAB','構象與能量','單鍵旋轉與構象位能'],reaction:['REACTION STUDIO','葡萄糖變旋','開環、閉環與電子流'],compare:['STRUCTURE ATLAS','結構比較','α 異頭物、開鏈與 β 異頭物'],notebook:['YOUR FIELD NOTES','實驗筆記','觀察紀錄與操作狀態']};
labels.library=['REACTION ATLAS','糖類反應地圖','官能基、鍵結與反應機構'];
let curriculum=[],reactionMolecules=[],mechanisms=[],coverage=null,atlas=null;
let foodCourse=null,processingCourse=null,microbiologyCourse=null,learning=null,surface='learn',learningContext=null,libraryCatalog=false,reactionEpoch=0,atlasBrowserState=null;
// Transient tool drafts belong to one validated lesson route, never to notebooks.
const reactionDrafts=new Map(),learningActivityAnchors=new Map();
// Free-text notebook drafts are isolated from formal notes, by tab and validated context.
const noteDraftStore=createSessionNoteDraftStore({isSaved:savedNoteDraft});
const snapshotNoteDraftKey=(s,origin=learningContext)=>JSON.stringify([origin||null,Object.entries(s).filter(([,value])=>value!==undefined).sort(([a],[b])=>a<b?-1:a>b?1:0)]);
function savedNoteDraft(kind,key,draft){const note=notes.find(n=>n.id===(kind==='snapshot'?draft.id:key));return !!note&&note.title===(kind==='snapshot'?(draft.title.trim()||'未命名觀察'):draft.title)&&note.text===draft.text&&(kind!=='snapshot'||(JSON.stringify(note.state)===JSON.stringify(draft.state)&&JSON.stringify(note.events)===JSON.stringify(draft.events)));}
function noteDraftFeedback(form,message){const output=form.querySelector('.note-save-feedback');output.textContent=message;output.hidden=false;}
function noteDraftStatus(form,result,prefix=''){const message=result?.persistence==='session'?'草稿暫存在本分頁，可在同一課程／狀態重新載入後找回；關閉分頁不保證恢復。':'草稿暫存不可用；文字只保留在目前頁面，重新整理前請先複製。';noteDraftFeedback(form,prefix+message);}
function noteDraftCleanupMessage(result){return result?.error?'正式筆記已保存；草稿清理未確認，請保留目前文字並在重開後核對。':'';}
function focusNotebookNote(id,editing=false){const key=editing?'editNote':'restoreNote';[...document.querySelectorAll(editing?'[data-edit-note]':'[data-restore-note]')].find(button=>button.dataset[key]===id)?.focus({preventScroll:true});}
let activeReactionOrigin=null,reactionManualOpen=false,learningReturnEpoch=0;
const pathPositions=new PathPositions();
const learningProgress=new LearningProgress();
const processingProgress=new LearningProgress(undefined,'processing');
const microbiologyProgress=new LearningProgress(undefined,'microbiology');
let catalog=[],profiles=[],mechanismLoadErrors=[],moleculeLoadErrors=[],state={mode:'explore',moleculeId:'glucose-beta',bondId:'C5-C6',angle:300,temperature:298,stage:0,product:'glucose-beta'};
const notebookRead=readNotes(),notebook=new NotebookStore(notebookRead.notes,undefined,{locked:!!notebookRead.error});
let viewer,currentModel,comparisonViewers=[],selected=[],notes=notebook.notes,events=[],undo=[],redo=[];
let thermalTimer=null,demoTimer=null,replayTimer=null,samples=0,histogram=Array(36).fill(0),transitioning=false,showArrows=true,electronSource='',electronTarget='',feedback='',toastTimer;
const mol=()=>catalog.find(m=>m.id===state.moleculeId),rotor=()=>mol()?.rotatableBonds.find(b=>b.id===state.bondId),profile=()=>profiles.find(p=>p.moleculeId===state.moleculeId&&p.bondId===state.bondId);
const points=()=>profile()?.samples.map(p=>({angle:p.angleDeg,energy:p.relativeEnergyKJMol}))||[];
const snapshot=()=>({...state,mode:state.mode==='notebook'?'explore':state.mode});
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4000);}
function saveStatusText(normal){return notebook.locked?'筆記讀取失敗 · 已停止寫入':mechanismLoadErrors.length||moleculeLoadErrors.length?'部分化學資料載入失敗 · 筆記仍可匯出':normal;}
function persist(){try{localStorage.setItem(SESSION_KEY,JSON.stringify(snapshot()));$('save-status').textContent=saveStatusText('目前狀態已保存');}catch{$('save-status').textContent=saveStatusText('瀏覽器儲存不可用，請匯出筆記');}}
function log(label){events.push({at:Date.now(),label,state:snapshot()});events=events.slice(-200);persist();}
function checkpoint(){undo.push(snapshot());undo=undo.slice(-100);redo=[];}
function stopThermal(){clearInterval(thermalTimer);thermalTimer=null;const b=$('thermal-button');if(b){b.textContent='開始';b.setAttribute('aria-pressed','false');}}
function stopDemo(){clearInterval(demoTimer);demoTimer=null;const button=$('reaction-demo');if(button){button.textContent=transitioning?'停止這次推進':'播放示範';button.setAttribute('aria-pressed','false');}}
function stopReplay(){clearInterval(replayTimer);replayTimer=null;const b=$('stop-replay');if(b)b.hidden=true;}
function resetSampling(){samples=0;histogram=Array(36).fill(0);}
function dialog(title,html){$('dialog-title').textContent=title;$('dialog-body').innerHTML=html;if(!$('info-dialog').open)$('info-dialog').showModal();}
function libraryStateLabel(s){const route=curriculum.find(r=>r.id===s.reactionId);return `${route?.title||s.reactionId||'知識地圖'} · ${s.libraryView==='mechanism'?mechanismLabel(mechanisms,s)+' · ':''}${s.libraryView==='mechanism'?`機構狀態 ${s.mechanismStep}`:`第 ${(s.libraryStep||0)+1} ${route?.routeKind==='comparison'?'項':'步'}`}`;}
function updateStateCaption(){if(surface==='learn'){$('state-caption').textContent=(learning?.progress??learningProgress).error||'紀錄儲存於此瀏覽器';return;}const s=state.mode==='reaction'?`機構狀態 ${state.stage}/6 · 糖 + 酸 / 水 · 總電荷 +1`:state.mode==='library'?libraryStateLabel(state):state.mode==='notebook'?notebook.locked?'筆記讀取失敗；原有資料已保留，寫入已停止。':`${notes.length} 篇筆記儲存在此瀏覽器；重要觀察請匯出備份。`:state.mode==='compare'?'α ⇌ 開鏈 ⇌ β · 同一環境的平衡比較':`${names[state.moleculeId]} · ${state.bondId} · ${state.angle.toFixed(1)}°`;$('state-caption').textContent=s;}
function validRestore(s){return validateRestoreState(s,{catalog,curriculum,mechanisms});}
function restore(s,{record=true}={}){const restored=validRestore(s);rememberReactionDraft();cancelReactionTransition();stopThermal();stopDemo();state=restored;selected=[];showArrows=restored.mode==='reaction';electronSource='';electronTarget='';feedback='';resetSampling();libraryCatalog=false;learningContext=null;activeReactionOrigin=null;reactionManualOpen=false;renderMode();syncLabHash(!record);viewer.fit();if(record)log('還原保存的狀態');}
function changeMode(mode,{catalogView=false,updateURL=true}={}){
 learningReturnEpoch++;
 const key=mode==='reaction'?reactionDraftKey(learningContext):null,sameReaction=surface==='lab'&&state.mode==='reaction'&&activeReactionOrigin===key;
 rememberReactionDraft();cancelReactionTransition();libraryCatalog=catalogView;stopReplay();stopThermal();stopDemo();state.mode=mode;selected=[];
 const draft=key&&!sameReaction?reactionDrafts.get(key):null;
 if(draft){state.stage=draft.stage;state.product=draft.product;electronSource=draft.electronSource;electronTarget=draft.electronTarget;showArrows=draft.showArrows;feedback=draft.feedback;reactionManualOpen=draft.manualOpen;viewer.showH=draft.showH;viewer.showLabels=draft.showLabels;viewer.renderMode=draft.renderMode;syncViewerDisplay();}
 else if(!sameReaction){showArrows=mode==='reaction';feedback='';reactionManualOpen=false;if(key){state.stage=0;state.product='glucose-beta';electronSource='';electronTarget='';}}
 activeReactionOrigin=mode==='reaction'?key:null;renderMode();if(updateURL)syncLabHash();globalThis.window?.scrollTo?.({top:0,left:0,behavior:'auto'});
 if(mode==='reaction'&&!sameReaction){viewer.resize?.();if(!viewer.restoreCameraState?.(draft?.camera))viewer.fit();}log(`切換至${labels[mode][1]}`);
}
function hasAcetylationMechanism(){return curriculum.some(r=>r.id==='glucose-acetylation')&&mechanisms.some(m=>m.reactionId==='glucose-acetylation'&&m.variantId==='pyridine-acyl-transfer');}
function openAcetylationMechanism(){if(!hasAcetylationMechanism()){toast('乙醯化機構資料尚未載入。');return;}state.reactionId='glucose-acetylation';state.libraryStep=0;state.libraryView='mechanism';state.mechanismStep=0;state.mechanismVariant='pyridine-acyl-transfer';changeMode('library');}
function selectMolecule(id){stopThermal();stopDemo();checkpoint();state.mode='explore';state.moleculeId=id;state.bondId=mol().rotatableBonds[0].id;state.angle=wrap(rotor().initialDihedralDeg);selected=[];resetSampling();renderMode();viewer.fit();log(`選擇${names[id]}`);}
function selectBond(id){stopThermal();checkpoint();state.bondId=id;state.angle=wrap(rotor().initialDihedralDeg);selected=[];if(rotor().requiresHydrogens){viewer.showH=true;$('show-hydrogen').checked=true;}resetSampling();renderExplore();drawExplore();log(`選擇旋轉軸 ${id}，其他幾何回到參考構象`);toast('已重設參考構象，讓能量曲線與這條旋轉軸一致。');}
function setAngle(value,{record=false}={}){state.angle=Math.max(0,Math.min(360,Number(value)));drawExplore();if(record)log(`轉動 ${state.bondId} 至 ${state.angle.toFixed(1)}°`);}
function drawExplore(){currentModel=rotateBond(mol(),rotor(),state.angle);viewer.setMolecule(currentModel,{bond:rotor(),selected});$('molecule-name').textContent=names[state.moleculeId];$('formula').textContent=mol().formula;$('angle-slider').value=state.angle;$('angle-value').innerHTML=`${state.angle.toFixed(0)}<span>°</span>`;const p=points(),e=interpolateEnergy(p,state.angle);$('energy-value').innerHTML=p.length?`${e.toFixed(2)} <small>kJ/mol</small>`:'尚無曲線';$('energy-method').textContent='MMFF94';$('energy-note').textContent=`固定其他幾何的相對位能 ΔE，並非自由能；零點僅適用此曲線。${p.length?'點圖可指定角度；柱狀表示取樣停留次數。':'此軸僅示範幾何，未做能量掃描。'}`;$('energy-chart').innerHTML=energyChart(p,state.angle,state.temperature,histogram);$('newman').innerHTML=newmanSVG(currentModel,rotor());$('sampling-note').textContent=`已取樣 ${samples.toLocaleString()} 次（包含拒絕後的停留）。有限取樣可能暫困局部低谷；動畫沒有物理時間意義。`;updateAtomInfo();updateStateCaption();}
function renderExplore(){
 const b=rotor(),hasEnergy=points().length>0;
 $('inspector').innerHTML=`<h2>旋轉單鍵</h2>
 <label for="bond-select">旋轉軸</label>
 <select id="bond-select">${mol().rotatableBonds.map(r=>`<option value="${r.id}" ${r.id===state.bondId?'selected':''}>${r.label}${r.kind==='hydroxyl'?' · 羥基':''}</option>`).join('')}</select>
 <details class="control-note"><summary>角度定義</summary><p>${b.reference.join(' → ')}</p></details>
 <div class="angle-display"><span>二面角 φ</span><strong id="angle-value"></strong></div>
 <input id="angle-slider" type="range" min="0" max="360" step="1" aria-label="單鍵二面角">
 <div class="range-labels"><span>0°</span><span>180°</span><span>360°</span></div>
 <div class="preset-angles">${[0,60,180,300].map(a=>`<button data-angle="${a}">${a}°</button>`).join('')}<button id="along-bond">沿鍵看</button></div>
 <div class="energy-number"><span>位能 ΔE</span><strong id="energy-value"></strong></div>
 <button class="button-primary wide" id="relax-button" ${hasEnergy?'':'disabled'}>找最低點</button>
 <div class="history-controls"><button id="undo-button" aria-label="復原" title="復原" ${undo.length?'':'disabled'}>↶</button><button id="redo-button" aria-label="重做" title="重做" ${redo.length?'':'disabled'}>↷</button><button id="reset-structure" title="回到參考構象">重設</button></div>
 <details class="newman-details"><summary>Newman 投影 · ${b.a}–${b.b}</summary><div id="newman"></div><p class="tiny">沿鍵方向的實際座標投影。</p></details>
 <div class="divider"></div>
 <div class="section-heading"><h3>熱擾動</h3><button id="thermal-button" class="toggle-button" aria-pressed="false" ${hasEnergy?'':'disabled'}>開始</button></div>
 <label class="inline-label" for="temperature-slider"><span>模型溫度</span><strong id="temperature-value">${state.temperature} K</strong></label>
 <input id="temperature-slider" type="range" min="100" max="800" value="${state.temperature}" step="1" ${hasEnergy?'':'disabled'}>
 <details class="sampling-details"><summary>取樣說明</summary><p>依位能曲線取樣；低能量較常停留，高能量仍有機會。</p><p class="tiny" id="sampling-note"></p></details>
 <div class="info-card" id="atom-info"></div>
 <details class="atom-access-details"><summary>用編號選原子</summary><label class="sr-only" for="atom-select">以編號選取原子</label><select id="atom-select"><option value="">選取原子…</option>${mol().atoms.filter(a=>a.element!=='H').map(a=>`<option>${a.id}</option>`).join('')}</select></details>`;
 $('bond-select').onchange=e=>selectBond(e.target.value);$('angle-slider').onpointerdown=()=>{stopThermal();checkpoint();};$('angle-slider').onkeydown=e=>{if(e.key.startsWith('Arrow')||['Home','End','PageUp','PageDown'].includes(e.key)){stopThermal();checkpoint();}};$('angle-slider').oninput=e=>setAngle(e.target.value);$('angle-slider').onchange=()=>{log(`轉動 ${state.bondId} 至 ${state.angle.toFixed(1)}°`);refreshHistory();};
 document.querySelectorAll('[data-angle]').forEach(b=>b.onclick=()=>{stopThermal();checkpoint();setAngle(b.dataset.angle,{record:true});refreshHistory();});$('relax-button').onclick=()=>{stopThermal();checkpoint();const p=points().reduce((a,b)=>a.energy<b.energy?a:b);setAngle(p.angle,{record:true});refreshHistory();toast('已到這條固定幾何掃描的最低點；不是全分子全域最低能量。');};
 $('undo-button').onclick=()=>historyMove(false);$('redo-button').onclick=()=>historyMove(true);$('reset-structure').onclick=()=>{stopThermal();checkpoint();setAngle(wrap(rotor().initialDihedralDeg),{record:true});resetSampling();drawExplore();refreshHistory();};$('thermal-button').onclick=toggleThermal;
 $('temperature-slider').oninput=e=>{state.temperature=Number(e.target.value);resetSampling();$('temperature-value').textContent=state.temperature+' K';drawExplore();};$('temperature-slider').onchange=()=>log(`模型溫度改為 ${state.temperature} K`);$('atom-select').onchange=e=>{if(e.target.value)selectAtom(currentModel.atoms.find(a=>a.id===e.target.value));};
 $('along-bond').onclick=()=>{const a=currentModel.atoms.find(a=>a.id===rotor().a).position,b=currentModel.atoms.find(a=>a.id===rotor().b).position,d=sub(a,b),l=norm(d);viewer.controls.target.set(...b);viewer.camera.position.set(...a.map((x,i)=>x+d[i]/l*9));viewer.controls.update();};
}
function refreshHistory(){if($('undo-button'))$('undo-button').disabled=!undo.length;if($('redo-button'))$('redo-button').disabled=!redo.length;}
function historyMove(forward){stopThermal();const from=forward?redo:undo,to=forward?undo:redo;if(!from.length)return;to.push(snapshot());restore(from.pop(),{record:false});log(forward?'重做操作':'復原操作');}
function selectAtom(a){if(state.mode==='reaction'){if(state.stage===6||transitioning)return;if(!electronSource||electronTarget){electronSource=a.id;electronTarget='';}else electronTarget=a.id;feedback='';renderReaction();return;}if(state.mode!=='explore')return;selected=selected.includes(a.id)?selected.filter(id=>id!==a.id):[...selected.slice(-1),a.id];drawExplore();}
function updateAtomInfo(){const atoms=selected.map(id=>currentModel.atoms.find(a=>a.id===id)).filter(Boolean);$('atom-info').innerHTML=atoms.length?`<strong>${atoms.map(a=>`${a.id} · ${a.element}${a.cip?' / CIP '+a.cip:''}`).join(' ＋ ')}</strong><p>${atoms.length===2?`原子間距：${norm(sub(atoms[0].position,atoms[1].position)).toFixed(2)} Å`:'再選一顆原子，可量目前幾何的距離。'}</p>`:'<strong>點原子查看</strong><p>選兩顆量距離；點單鍵換軸。</p>';}
function toggleThermal(){if(thermalTimer){stopThermal();log('暫停熱擾動');return;}if(!points().length)return;checkpoint();log('開始 Metropolis 熱擾動');$('thermal-button').textContent='暫停';$('thermal-button').setAttribute('aria-pressed','true');const p=points();thermalTimer=setInterval(()=>{for(let i=0;i<8;i++){const proposed=wrap(state.angle+(Math.random()-.5)*34),delta=interpolateEnergy(p,proposed)-interpolateEnergy(p,state.angle);if(delta<=0||Math.random()<Math.exp(-delta/(R*state.temperature)))state.angle=proposed;histogram[Math.min(35,Math.floor(wrap(state.angle)/10))]++;samples++;}drawExplore();},140);refreshHistory();}

function renderReaction(){const focus=document.activeElement,inspectorFocus=$('inspector').contains(focus)?focus?.id:null,timelineFocus=focus?.dataset?.stage;const step=REACTION_STEPS[state.stage],manualOpen=$('reaction-advanced')?.open??reactionManualOpen;currentModel=reactionState(catalog,state.stage,state.product);selected=showArrows?step.highlight:[electronSource,electronTarget].filter(Boolean);viewer.setMolecule(currentModel,{selected,arrows:showArrows?step.arrows:[],ghostBond:state.stage===4?['O5','C1']:null});$('molecule-name').textContent=state.stage===6?`${names[state.product]} · 路徑完成`:step.title;$('formula').textContent='糖 + 酸 / 水';$('viewer-hint').textContent='H★ / H1：追蹤質子 · Ocat：水氧';
 $('reaction-guide-progress').textContent=`狀態 ${state.stage} / 6 · ${step.short}${state.stage===6?' · 完成':''}`;
 $('reaction-guide-pair').textContent=state.stage===6?`得到${names[state.product]}`:showArrows?`${step.sourceLabel} → ${step.targetLabel}`:'找出電子來源與目的地';
 $('reaction-guide-arrows').textContent=state.stage===6?reactionEquation(state.stage,state.product):showArrows?step.equation:'在模型點選，或展開「自己試電子流」。';
 $('reaction-current-equation').textContent=reactionEquation(state.stage,state.product);
 $('reaction-guide-next').disabled=false;$('reaction-guide-next').setAttribute('aria-disabled',String(state.stage===6||transitioning));
 $('reaction-guide-next').textContent=transitioning?'推進中…':state.stage===6?'路徑已完成':'推進下一步 →';
 $('reaction-guide-next').onclick=()=>{if(surface!=='lab'||state.mode!=='reaction'||transitioning||state.stage===6)return;stopDemo();pushReaction({guided:true});};
 const options=(value,kind)=>`<option value="">選${kind}…</option>${['O1','O5','Ocat','C1','Hcat','HO1','C5','O2'].map(id=>`<option value="${id}" ${value===id?'selected':''}>${id}${id==='Hcat'?' · H★':id==='HO1'?' · H1':id==='Ocat'?' · 水氧':''}</option>`).join('')}`;
 const branch=state.stage===4?`<label class="mt" for="product-select">這次從哪一面成環？</label><select id="product-select" ${transitioning?'disabled':''}><option value="glucose-beta" ${state.product==='glucose-beta'?'selected':''}>走向 β-D-葡萄糖</option><option value="glucose-alpha" ${state.product==='glucose-alpha'?'selected':''}>回到 α-D-葡萄糖</option></select>`:'';
 const practice=state.stage<6?`<details class="reaction-advanced" id="reaction-advanced" ${manualOpen?'open':''}><summary>自己試電子流</summary><p class="reaction-advanced-intro">隱藏線索後，在模型點原子，或用選單指定電子的來源與目的地。</p><button class="wide" id="reaction-hint" type="button" ${transitioning?'disabled':''}>${showArrows?'隱藏線索，自己試':'顯示電子流提示'}</button><label class="mt" for="electron-source">電子來源（箭尾）</label><select id="electron-source" ${transitioning?'disabled':''}>${options(electronSource,'來源')}</select><label class="mt" for="electron-target">電子目的地（箭頭）</label><select id="electron-target" ${transitioning?'disabled':''}>${options(electronTarget,'目的地')}</select><button class="button-primary wide mt" id="push-reaction" aria-disabled="${transitioning}">${transitioning?'電子移動中…':'驗證並推進 →'}</button></details>`:`<div class="completion">${state.product==='glucose-alpha'?'這次回到 α，沒有淨異頭物轉換。':'你已走完 α → 開鏈 → β 的路徑。'}</div><button class="button-primary wide mt" id="save-reaction">保存這次觀察</button>`;
 $('inspector').innerHTML=`<h2>${step.short}</h2><p class="reaction-task">${step.instruction}</p><div class="reaction-formula"><span>反應式</span><p>${reactionEquation(state.stage,state.product)}</p><details class="reaction-detail"><summary>化學式</summary><small>名稱式；質子化糖 C₆H₁₃O₆⁺，中性糖 C₆H₁₂O₆。</small></details></div>${branch}${practice}<p id="reaction-feedback" class="feedback" role="status">${esc(feedback)}</p><details class="reaction-detail"><summary>這一步的說明</summary><p class="muted">${showArrows||state.stage===6?step.explanation:step.note}</p></details><details class="reaction-detail"><summary>模型限制</summary><p class="tiny">酸催化機構示意。質子接力與成套電子流保留；中間體與座標補間是教學示意，不是計算反應軌跡。</p></details>`;
 if(state.stage<6){$('electron-source').onchange=e=>{if(surface!=='lab'||state.mode!=='reaction'||transitioning)return;electronSource=e.target.value;syncElectronSelection();};$('electron-target').onchange=e=>{if(surface!=='lab'||state.mode!=='reaction'||transitioning)return;electronTarget=e.target.value;syncElectronSelection();};$('push-reaction').onclick=()=>pushReaction();$('reaction-hint').onclick=()=>{if(surface!=='lab'||state.mode!=='reaction'||transitioning)return;showArrows=!showArrows;renderReaction();};if($('product-select'))$('product-select').onchange=e=>{if(surface!=='lab'||state.mode!=='reaction'||transitioning)return;state.product=e.target.value;renderReaction();log(`選擇${names[state.product]}成環路徑`);};}else $('save-reaction').onclick=saveSnapshot;
 $('reaction-back').disabled=false;$('reaction-back').setAttribute('aria-disabled',String(state.stage===0||transitioning));
 $('reaction-back').onclick=()=>{if(surface!=='lab'||state.mode!=='reaction'||transitioning||state.stage===0)return;stopDemo();state.stage--;electronSource='';electronTarget='';feedback='';showArrows=true;renderReaction();log('機構退回一步');};
 $('reaction-reset').disabled=false;$('reaction-reset').onclick=restartReaction;
 $('reaction-demo').disabled=false;$('reaction-demo').textContent=demoTimer?'暫停示範':transitioning?'停止這次推進':'播放示範';$('reaction-demo').setAttribute('aria-pressed',String(!!demoTimer));$('reaction-demo').onclick=toggleReactionDemo;
 if($('reaction-advanced'))$('reaction-advanced').ontoggle=e=>{reactionManualOpen=e.target.open;};
 $('reaction-timeline').innerHTML=`<div class="section-heading"><div><h2>α ⇌ 開鏈 ⇌ ${state.product==='glucose-beta'?'β':'α'}</h2></div><span class="method-badge">7 個狀態 · 6 次推進</span></div><div class="timeline-steps">${REACTION_STEPS.map((s,i)=>`<button data-stage="${i}" class="${i===state.stage?'active':''}" ${i===state.stage?'aria-current="step"':''} ${i>state.stage||transitioning?'disabled':''}><span>${i}</span>${s.short}</button>`).join('')}</div><details class="timeline-note"><summary>原子追蹤</summary><p class="tiny">狀態編號 0–6；相鄰狀態間共 6 次推進。點已走過的狀態可返回。環氧始終是 O5；O1 在開鏈時成為羰基氧。沒有淨脫水。</p></details>`;document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{if(surface!=='lab'||state.mode!=='reaction'||transitioning)return;stopDemo();state.stage=Number(b.dataset.stage);electronSource='';electronTarget='';feedback='';showArrows=true;renderReaction();log(`回看機構狀態 ${state.stage}`);});if(inspectorFocus){const next=$(inspectorFocus);if(next&&!next.disabled)next.focus({preventScroll:true});}else if(timelineFocus!==undefined){const next=document.querySelector(`[data-stage="${timelineFocus}"]`);if(next&&!next.disabled)next.focus({preventScroll:true});}updateStateCaption();}
function syncElectronSelection(){feedback='';$('reaction-feedback').textContent='';selected=[electronSource,electronTarget].filter(Boolean);viewer.setMolecule(currentModel,{selected,arrows:showArrows?REACTION_STEPS[state.stage].arrows:[],ghostBond:state.stage===4?['O5','C1']:null});}
function cancelReactionTransition(){if(!transitioning)return;reactionEpoch++;transitioning=false;viewer?.cancelTransition();}
async function pushReaction({guided=false}={}){
 if(transitioning||state.stage>=6||state.mode!=='reaction'||surface!=='lab')return;
 const step=REACTION_STEPS[state.stage];if(guided){electronSource=step.source;electronTarget=step.target;}
 const result=validateReactionMove(state.stage,electronSource,electronTarget);if(!result.ok){feedback=result.message;renderReaction();return;}
 const epoch=++reactionEpoch;transitioning=true;showArrows=true;feedback='兩組電子同步移動，保持原子價數。';renderReaction();
 await new Promise(r=>setTimeout(r,700));if(epoch!==reactionEpoch)return;
 const complete=await viewer.transitionTo(reactionState(catalog,state.stage+1,state.product),{selected:REACTION_STEPS[state.stage].highlight});
 if(epoch!==reactionEpoch||!complete)return;
 state.stage++;transitioning=false;if(state.stage===6)stopDemo();electronSource='';electronTarget='';feedback='';showArrows=true;renderReaction();log(`完成反應步驟 ${state.stage}：${REACTION_STEPS[state.stage].short}`);
}

function renderCompare(){const root=$('alternate-content');root.innerHTML=`<div class="comparison-grid">${['glucose-alpha','glucose-open','glucose-beta'].map(id=>`<article class="comparison-card"><span class="eyebrow">${id==='glucose-open'?'OPEN CHAIN':id==='glucose-alpha'?'ALPHA ANOMER':'BETA ANOMER'}</span><h2>${names[id]}</h2><div class="mini-viewer" id="compare-${id}" role="img" aria-label="${names[id]}可旋轉模型"></div><details class="comparison-note"><summary>結構特徵</summary><p>${id==='glucose-alpha'?'在常見 ⁴C₁ 椅式中，C1 的 OH 主要為軸向。與 C5 的 CH₂OH 位於環的相反側。':id==='glucose-beta'?'在常見 ⁴C₁ 椅式中，C1 的 OH 為赤道向。與 C5 的 CH₂OH 位於環的同側。':'C1 是平面的醛基碳。O5 羥基可以再次接近 C1，形成環狀半縮醛。'}</p></details><button class="wide" data-open-molecule="${id}">開啟構象 ↗</button></article>`).join('')}</div><div class="equilibrium-card"><div><h2>溶液中的 α / β 平衡</h2><p>水溶液、室溫：約 α 36%、β 64%（教學近似）。</p><div class="ratio-bar"><span>α 36%</span><span>β 64%</span></div><details class="equilibrium-note"><summary>比例與限制</summary><p class="tiny">省略少量其他形式；比例受溫度、溶劑等條件影響。此處以 298.15 K 的 36:64 作近似計算，不隨探索區的模型溫度滑桿改變，也不是畫面中兩個孤立構象的 MMFF 能量比例。</p></details></div><div class="free-energy"><span>α → β 的標準自由能差</span><strong>${deltaGFromRatio(64/36).toFixed(2)} <small>kJ/mol</small></strong><code>ΔG° ≈ −RT ln(64 / 36)</code><details class="equilibrium-note"><summary>理解 ΔG°</summary><p>β 稍有利，但 α 仍存在。達到平衡時，實際反應自由能 ΔᵣG = 0；分子仍持續雙向互換。</p></details></div></div><div class="section-heading food-heading"><div><h2>與食品化學的關係</h2></div></div><div class="food-grid">${foodCards.map(c=>`<article class="food-card"><span class="eyebrow">${c.tag}</span><h3>${c.title}</h3><p>${c.text}</p><details><summary>${c.question}</summary><p>${c.answer}</p></details></article>`).join('')}</div><p class="muted comparison-warning">α、β 差在 C1 配置；翻面或轉單鍵不會互換。可到「變旋」操作開環與成環。</p>`;
 for(const id of ['glucose-alpha','glucose-open','glucose-beta']){const v=new MoleculeViewer($(`compare-${id}`));v.showH=false;v.setMolecule(catalog.find(m=>m.id===id),{selected:['C1','O1','O5'],fit:true});comparisonViewers.push(v);}document.querySelectorAll('[data-open-molecule]').forEach(b=>b.onclick=()=>selectMolecule(b.dataset.openMolecule));}

function renderLibrary(){if(!curriculum.length){$('alternate-content').innerHTML='<p class="muted">反應地圖資料尚未載入。請重新整理，或先探索構象與葡萄糖變旋。</p>';return;}state.reactionId=curriculum.some(r=>r.id===state.reactionId)?state.reactionId:curriculum[0].id;state.libraryStep??=0;atlas=new ReactionAtlas($('alternate-content'),{reactions:curriculum,molecules:[...catalog,...reactionMolecules],selectedId:state.reactionId,step:state.libraryStep,mechanisms,coverage,view:state.libraryView||'overview',startInCatalog:libraryCatalog,catalogState:atlasBrowserState,onBrowse:()=>{libraryCatalog=true;$('snapshot-button').hidden=true;syncLabHash();},mechanismStep:state.mechanismStep||0,mechanismVariant:state.mechanismVariant,onState:(id,step,label,detail)=>{state.reactionId=id;state.libraryStep=step;Object.assign(state,detail);libraryCatalog=false;$('snapshot-button').hidden=false;syncLabHash();log(label);updateStateCaption();},onMechanism:()=>changeMode('reaction'),onSave:saveSnapshot});state.mechanismVariant=atlas.mechanismVariant;$('snapshot-button').hidden=atlas.inCatalog;}
function commitNotes(change,{quiet=false,onFailure=null}={}){try{notes=change();if(!quiet)$('save-status').textContent=`已保存 ${notes.length} 篇筆記`;return true;}catch(e){onFailure?.(e);if(!quiet)toast('筆記未保存：'+e.message+'。原有筆記未變，可重試。');return false;}}
function saveSnapshot({fresh=false}={}){
 if(transitioning||atlas?.isTransitioning)return;
 if(notebook.locked){toast('筆記讀取失敗，已停止寫入。請到實驗筆記檢視原始資料。');return;}
 const requested=snapshot(),key=snapshotNoteDraftKey(requested),recovered=fresh?null:noteDraftStore.read('snapshot',key),draft=recovered?.draft;
 const captured=draft?.state||requested,capturedEvents=draft?.events||structuredClone(events),giComparison=draft?draft.giComparison:!!atlas?.isGiEndpointComparison;
 const defaultTitle=state.mode==='library'?libraryStateLabel(state):state.mode==='reaction'?'葡萄糖變旋 · 第 '+state.stage+' 步':names[state.moleculeId]+' · '+state.bondId+' · '+state.angle.toFixed(0)+'°';
 const noteId=draft?.id||crypto.randomUUID(),savedVersion=draft&&notes.find(note=>note.id===draft.id),conflict=!!savedVersion&&!savedNoteDraft('snapshot',key,draft);stopThermal();atlas?.stop();
 dialog('留下這次觀察','<form id="note-form"><label for="note-title">標題</label><input id="note-title" maxlength="160" required value="'+esc(draft?.title??defaultTitle)+'"'+(conflict?' readonly':'')+'><label for="note-text">你的觀察或問題</label><textarea id="note-text" rows="5" maxlength="10000" placeholder="我改變了什麼？看到了什麼？為什麼？"'+(conflict?' readonly':'')+'>'+esc(draft?.text||'')+'</textarea><p class="tiny">'+(giComparison?'保存本概念步、筆記內容與 '+capturedEvents.length+' 筆操作；端點切換與選鍵不納入還原／回放，重開預設 Glc。':'一併保存目前狀態與 '+capturedEvents.length+' 筆操作，可還原與回放。')+'</p><p class="tiny note-save-feedback" role="status" aria-live="polite" hidden></p>'+(conflict?'<details class="tiny"><summary>目前已保存版本</summary><p>'+esc(savedVersion.title)+'</p><p>'+esc(savedVersion.text)+'</p></details><button id="note-start-fresh" type="button">複製草稿後，開始新的觀察</button>':'')+'<button class="button-primary wide mt" type="submit"'+(conflict?' disabled':'')+'>保存到實驗筆記</button></form>');
 const form=$('note-form');let latest=recovered;
 const keep=()=>{if($('note-form')!==form||!$('info-dialog').open||conflict)return null;latest=noteDraftStore.write('snapshot',key,{id:noteId,title:form.querySelector('#note-title').value,text:form.querySelector('#note-text').value,state:captured,events:capturedEvents,giComparison});noteDraftStatus(form,latest);return latest;};
 if(conflict){noteDraftFeedback(form,'這份草稿對應的觀察已有保存版本；已停止重複保存或覆寫。請先複製草稿並核對保存版本，再開始新的觀察。');form.querySelector('#note-start-fresh').onclick=()=>{if($('note-form')!==form||!$('info-dialog').open)return;noteDraftStore.clear('snapshot',key,recovered.revision);saveSnapshot({fresh:true});};}
 else if(draft||recovered?.error)noteDraftStatus(form,recovered,draft?'已找回未保存草稿。':'未讀取到可恢復草稿。');
 form.oninput=keep;
 form.onsubmit=e=>{
  e.preventDefault();if($('note-form')!==form||!$('info-dialog').open||conflict)return;
  const submitted=keep();
  if(notes.some(note=>note.id===noteId)){saveSnapshot();return;}
  if(notes.length>=300){noteDraftStatus(form,latest,'最多保存 300 篇筆記；請先匯出備份。');return;}
  const n={id:noteId,title:form.querySelector('#note-title').value.trim()||'未命名觀察',text:form.querySelector('#note-text').value,createdAt:new Date().toISOString(),state:captured,events:capturedEvents};
  if(commitNotes(()=>notebook.add(n),{onFailure:error=>{noteDraftStatus(form,latest,'未保存：'+error.message+'。原有筆記未變，可重試。');}})){
   const cleared=noteDraftStore.clear('snapshot',key,submitted?.revision);const message=noteDraftCleanupMessage(cleared);
   const current=$('note-form')===form&&$('info-dialog').open;
   if(current){$('info-dialog').close();if(surface==='lab'&&state.mode==='notebook'){renderNotebook();focusNotebookNote(n.id);}}
   toast(message||(current?'觀察已保存，可在「實驗筆記」還原或回放。':'筆記已保存，保留目前開啟的內容。'));
  }
 };
}
function renderNotebook(){const root=$('alternate-content');root.innerHTML=`<div class="notebook-toolbar"><p>${notes.length} 篇本機筆記 · JSON 可備份還原</p><div><button id="export-json">匯出 JSON</button><button id="export-md">匯出 Markdown</button><button id="import-notes">匯入筆記</button><input id="import-file" type="file" accept=".json,application/json" hidden></div></div>${notes.length?`<div class="notes-grid">${notes.map(n=>`<article class="note-card"><span class="eyebrow">${esc(new Date(n.createdAt).toLocaleString('zh-TW'))}</span><h2>${esc(n.title)}</h2><div class="note-text">${esc(n.text||'尚未填寫文字觀察。')}</div><p class="tiny">${n.state.mode==="library"?esc(libraryStateLabel(n.state)):n.state.mode==="reaction"?`葡萄糖變旋 · 目標 ${names[n.state.product]} · 第 ${n.state.stage}/6 步`:`${names[n.state.moleculeId]} · ${n.state.bondId} · ${n.state.angle.toFixed(1)}°`}</p><div class="history-controls"><button data-restore-note="${esc(n.id)}">還原狀態</button><button data-replay-note="${esc(n.id)}">回放操作</button><button data-edit-note="${esc(n.id)}">補寫</button></div><details><summary>${n.events?.length||0} 筆操作紀錄</summary><ol class="event-list">${(n.events||[]).map(e=>`<li>${esc(e.label)}${e.state?.mode==='library'&&e.state.libraryView==='mechanism'?' · '+esc(mechanismLabel(mechanisms,e.state)):''}</li>`).join('')}</ol></details></article>`).join('')}</div>`:'<div class="empty-notes"><span>✧</span><h2>第一個發現，從一次轉動開始。</h2><p>回到構象實驗室，選一條鍵，再按「留下觀察」。</p><button id="start-explore" class="button-primary">開始探索</button></div>'}`;
 if(notebook.locked){root.querySelector('.empty-notes')?.remove();root.querySelector('.notebook-toolbar p').textContent='筆記內容待復原';root.insertAdjacentHTML('afterbegin',`<section class="note-card" role="alert"><h2>筆記儲存讀取失敗，已停止寫入</h2><p>程式沒有改寫原始筆記；目前無法確認篇數，也不會以空筆記覆寫。${notebookRead.raw!==null?'請先檢視、複製或下載讀到的原始資料；資料修復後重新整理會再讀取。':'瀏覽器未能讀取原始資料，請保留此瀏覽器資料；儲存恢復可用後重新整理會再讀取。'}</p>${notebookRead.raw!==null?'<button id="inspect-raw-notes" class="mt">檢視原始資料</button>':''}</section>`);for(const id of ['export-json','export-md','import-notes'])$(id).disabled=true;if($('inspect-raw-notes'))$('inspect-raw-notes').onclick=showRawNotebook;}
 $('export-json').onclick=()=>showExport('sugar-lab-notes.json',JSON.stringify(validateNotebook({schema:'sugar-lab/v1',notes}),null,2),'application/json');$('export-md').onclick=()=>showExport('糖分子實驗筆記.md',exportMarkdown(notes,mechanisms));$('import-notes').onclick=()=>$('import-file').click();$('import-file').onchange=async e=>{
  const input=e.target,file=input.files[0];if(!file)return;
  const isCurrent=()=>surface==='lab'&&state.mode==='notebook'&&$('import-file')===input;
  try{
   if(file.size>5*1024*1024)throw new Error('檔案超過 5 MB。');
   const imported=validateNotebook(JSON.parse(await file.text())).notes;
   for(const n of imported){validRestore(n.state);for(const ev of n.events||[])if(ev.state)validRestore(ev.state);}
   if(commitNotes(()=>notebook.merge(imported),{quiet:!isCurrent()})&&isCurrent()){renderNotebook();toast('已合併有效筆記，相同 ID 保留原筆記。');}
  }catch(err){if(isCurrent())toast('無法匯入：'+err.message);}finally{input.value='';}
 };
 if($('start-explore'))$('start-explore').onclick=()=>changeMode('explore');document.querySelectorAll('[data-restore-note]').forEach(b=>b.onclick=()=>restoreNote(notes.find(n=>n.id===b.dataset.restoreNote)));document.querySelectorAll('[data-replay-note]').forEach(b=>b.onclick=()=>replayNote(notes.find(n=>n.id===b.dataset.replayNote)));document.querySelectorAll('[data-edit-note]').forEach(b=>b.onclick=()=>editNote(notes.find(n=>n.id===b.dataset.editNote)));updateStateCaption();}
function showExport(name,content,type){const format=name.endsWith('.json')?'JSON':name.endsWith('.md')?'Markdown':'文字',hint=format==='JSON'?(name.startsWith('food-microbiology-')?'食品微生物學紀錄請先切到「食品微生物學」，再到「筆記與複習」匯入。':name.startsWith('food-processing-')?'食品加工學紀錄請先切到「食品加工學」，再到「筆記與複習」匯入。':name.startsWith('food-chemistry-')?'食品化學紀錄請先切到「食品化學」，再到「筆記與複習」匯入。':'3D 筆記請在「3D 實驗筆記」匯入。'):'此內容可複製或下載保存。';dialog('匯出紀錄',`<p>備份內容已準備好：${esc(name)}。</p><label for="export-preview">完整匯出內容</label><textarea id="export-preview" readonly rows="10"></textarea><button id="download-backup" class="button-primary wide mt">下載 ${format} 檔案</button><p class="tiny">${hint}</p>`);$('export-preview').value=content;$('download-backup').onclick=()=>downloadText(name,content,type);}
function restoreNote(n){stopReplay();try{restore(n.state);toast('已還原筆記狀態。');}catch(err){toast('無法還原：'+err.message+'。筆記仍可匯出 JSON。');}}
function showRawNotebook(){dialog('原始筆記資料',`<p>這是瀏覽器中讀到的原始文字，尚未通過 JSON 筆記驗證。請先複製或下載保存，勿當成有效備份匯入。</p><label for="raw-notebook-preview">原始內容</label><textarea id="raw-notebook-preview" readonly rows="12"></textarea><button id="download-raw-notebook" class="button-primary wide mt">下載原始文字</button>`);$('raw-notebook-preview').value=notebookRead.raw;$('download-raw-notebook').onclick=()=>downloadText('sugar-lab-notebook-recovery.txt',notebookRead.raw,'text/plain;charset=utf-8');}
function editNote(n,{fresh=false}={}){
 const recovered=fresh?null:noteDraftStore.read('edit',n.id),draft=recovered?.draft;
 const base=draft?.base||{title:n.title,text:n.text},conflict=!!draft&&(!draft.base||base.title!==n.title||base.text!==n.text);
 dialog('補寫觀察','<form id="edit-form"><label for="edit-title">標題</label><input id="edit-title" maxlength="160" required value="'+esc(draft?.title??n.title)+'"'+(conflict?' readonly':'')+'><label for="edit-text">觀察</label><textarea id="edit-text" rows="7" maxlength="10000"'+(conflict?' readonly':'')+'>'+esc(draft?.text??n.text)+'</textarea><p class="tiny note-save-feedback" role="status" aria-live="polite" hidden></p>'+(conflict?'<details class="tiny"><summary>目前已保存版本</summary><p>'+esc(n.title)+'</p><p>'+esc(n.text)+'</p></details><button id="edit-use-saved" type="button">複製草稿後，改用已保存版本</button>':'')+'<button class="button-primary wide mt" type="submit"'+(conflict?' disabled':'')+'>保存修改</button></form>');
 const form=$('edit-form');let latest=recovered;
 const keep=()=>{if($('edit-form')!==form||!$('info-dialog').open||conflict)return null;latest=noteDraftStore.write('edit',n.id,{title:form.querySelector('#edit-title').value,text:form.querySelector('#edit-text').value,base});noteDraftStatus(form,latest);return latest;};form.oninput=keep;
 if(conflict){noteDraftFeedback(form,'已保存筆記自草稿建立後已有變更；已停止覆寫。請先複製這份草稿並比較保存版本，再選擇重新編輯。');form.querySelector('#edit-use-saved').onclick=()=>{if($('edit-form')!==form||!$('info-dialog').open)return;noteDraftStore.clear('edit',n.id,recovered.revision);editNote(notes.find(note=>note.id===n.id)||n,{fresh:true});};}
 else if(draft||recovered?.error)noteDraftStatus(form,recovered,draft?'已找回未保存草稿。':'未讀取到可恢復草稿。');
 form.onsubmit=e=>{
  e.preventDefault();if($('edit-form')!==form||!$('info-dialog').open||conflict)return;
  const submitted=keep();
  const currentNote=notes.find(note=>note.id===n.id);
  if(!currentNote){noteDraftFeedback(form,'找不到目前已保存版本；已停止覆寫，請先複製草稿。');return;}
  if(currentNote.title!==base.title||currentNote.text!==base.text){editNote(currentNote);return;}
  if(commitNotes(()=>notebook.edit(n.id,{title:form.querySelector('#edit-title').value,text:form.querySelector('#edit-text').value}),{onFailure:error=>{noteDraftStatus(form,latest,'未保存：'+error.message+'。原有筆記未變，可重試。');}})){
   const cleared=noteDraftStore.clear('edit',n.id,submitted?.revision);const message=noteDraftCleanupMessage(cleared);
   const current=$('edit-form')===form&&$('info-dialog').open;
   if(current){$('info-dialog').close();if(surface==='lab'&&state.mode==='notebook'){renderNotebook();focusNotebookNote(n.id,true);}}
   toast(message||(current?'筆記已更新。':'筆記已保存，保留目前開啟的內容。'));
  }
 };
}
function replayNote(n){stopReplay();const frames=(n.events||[]).filter(e=>e.state);if(!frames.length){try{restore(n.state);toast('這篇筆記沒有可回放的操作，已還原最後狀態。');}catch(err){toast('無法回放：'+err.message+'。筆記仍可匯出 JSON。');}return;}let i=0;const tick=()=>{try{if(i>=frames.length){stopReplay();restore(n.state,{record:false});toast('回放完成，已停在保存的狀態。');return false;}const frame=frames[i++];restore(frame.state,{record:false});$('stop-replay').hidden=false;$('state-caption').textContent=`回放 ${i}/${frames.length} · ${frame.label}${state.mode==='library'?' · '+libraryStateLabel(state):''}`;return true;}catch(err){stopReplay();toast('無法回放：'+err.message+'。筆記仍可匯出 JSON。');return false;}};if(tick())replayTimer=setInterval(tick,1500);}

function renderMode(){
 learning?.dispose();learning=null;surface='lab';document.body.dataset.surface='lab';$('alternate-content').className='';document.querySelectorAll('[data-learning], [data-subject]').forEach(el=>{el.classList.remove('active');el.removeAttribute('aria-current');});const tools=document.querySelector('.nav-tools');if(tools)tools.open=true;document.body.toggleAttribute('data-reaction-studio',state.mode==='reaction');renderLearningContext();
 rememberAtlasCatalog();atlas?.dispose();atlas=null;for(const v of comparisonViewers)v.dispose();comparisonViewers=[];$('alternate-content').replaceChildren();
 const [eyebrow,title,description]=labels[state.mode];$('mode-eyebrow').textContent=eyebrow;$('page-title').textContent=title;$('page-description').textContent=description;
 document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
 const isLab=['explore','reaction'].includes(state.mode);$('lab-grid').hidden=!isLab;$('alternate-content').hidden=isLab;
 $('molecule-picker').hidden=state.mode!=='explore';$('energy-panel').hidden=state.mode!=='explore';$('reaction-timeline').hidden=state.mode!=='reaction';
 $('reaction-guide').hidden=state.mode!=='reaction';$('reaction-playback').hidden=state.mode!=='reaction';$('reaction-camera-controls').hidden=state.mode!=='reaction';$('acetylation-entry').hidden=state.mode!=='explore'||!state.moleculeId.startsWith('glucose-')||!hasAcetylationMechanism();
 $('snapshot-button').hidden=state.mode==='notebook';$('inspector').classList.toggle('reaction-inspector',state.mode==='reaction');
 if(state.mode==='explore'){$('molecule-picker').innerHTML=Object.keys(names).map(id=>`<button class="molecule-chip ${state.moleculeId===id?'active':''}" data-molecule="${id}">${names[id]}</button>`).join('');document.querySelectorAll('[data-molecule]').forEach(b=>b.onclick=()=>selectMolecule(b.dataset.molecule));$('viewer-hint').textContent='拖曳旋轉 · 點原子';renderExplore();drawExplore();}
 else if(state.mode==='reaction')renderReaction();else if(state.mode==='compare')renderCompare();else if(state.mode==='library')renderLibrary();else renderNotebook();updateStateCaption();
}

function rememberAtlasCatalog(){if(atlas)atlasBrowserState={query:atlas.query,filter:atlas.filter,interactiveOnly:atlas.interactiveOnly,visibleCount:atlas.visibleCount};}
function labHash(){return `#lab/${state.mode}${state.mode==='library'&&!libraryCatalog?'/'+state.reactionId:''}${learningContext?'?from='+encodeURIComponent(learningContext.slice(1)):''}`;}
function syncLabHash(replace=false){const hash=labHash();if(window.location.hash!==hash)window.history[replace?'replaceState':'pushState'](null,'',hash);}
function renderLearningContext(){
 const root=$('learning-context'),route=resolveLearningRoute(learningContext,learningContextFor(learningContext).course);
 root.hidden=route.view!=='lesson';
 root.innerHTML=route.view==='lesson'?`<a href="${esc(learningContext)}">← 回到這一題：${esc(route.lesson.title)}</a><span>操作後接續「檢查理解」</span>`:'';
}
function learningContextFor(hash){
 const subject=subjectForPath(hash);
 const courses={chemistry:foodCourse,processing:processingCourse,microbiology:microbiologyCourse},progresses={chemistry:learningProgress,processing:processingProgress,microbiology:microbiologyProgress};
 return {subject,course:courses[subject.id],progress:progresses[subject.id]};
}
function learningReturnPath(hash){
 const {subject,course}=learningContextFor(hash),route=resolveLearningRoute(hash,course);
 if(route.view!=='lesson')return null;
 const canonical=lessonPath(route.topic,route.lesson,route.step,subject.root);
 return pathContext(hash,{chemistry:foodCourse,processing:processingCourse,microbiology:microbiologyCourse})?.decorated||canonical;
}
function showLearning(hash){
 learningReturnEpoch++;
 const returnKey=learningReturnPath(hash),returnAnchor=learningActivityAnchors.get(returnKey);
 const returningFromReaction=surface==='lab'&&((state.mode==='reaction'&&activeReactionOrigin===reactionDraftKey(hash))||(state.mode==='library'&&learningContext===returnKey&&returnAnchor?.buttonId==='hfcs-open-3d'));rememberReactionDraft();cancelReactionTransition();stopReplay();stopThermal();stopDemo();rememberAtlasCatalog();atlas?.dispose();atlas=null;for(const v of comparisonViewers)v.dispose();comparisonViewers=[];learning?.dispose();learning=null;
 for(const [key,anchor] of learningActivityAnchors)if(anchor.buttonId==='hfcs-open-3d'&&(!returningFromReaction||key!==returnKey))learningActivityAnchors.delete(key);
 surface='learn';document.body.dataset.surface='learn';document.body.removeAttribute('data-reaction-studio');$('lab-grid').hidden=true;$('alternate-content').hidden=false;$('snapshot-button').hidden=true;$('learning-context').hidden=true;const tools=document.querySelector('.nav-tools');if(tools)tools.open=false;
 const isGuide=hash==='#guide',isPaths=/^#paths(?:[/?]|$)/.test(hash);
 const inPath=!!pathContext(hash,{chemistry:foodCourse,processing:processingCourse,microbiology:microbiologyCourse});
 const {subject,course,progress}=learningContextFor(hash),route=resolveLearningRoute(hash,course),active=isGuide?'guide':isPaths||inPath?'paths':route.view==='home'?'home':route.view==='review'?'review':'map';
 document.querySelectorAll('[data-mode]').forEach(el=>el.classList.remove('active'));document.querySelectorAll('[data-learning]').forEach(el=>{el.href=el.dataset.learning==='guide'?'#guide':el.dataset.learning==='paths'?'#paths':'#'+subject.root+(el.dataset.learning==='home'?'':'/'+el.dataset.learning);el.classList.toggle('active',el.dataset.learning===active);if(el.dataset.learning===active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 document.querySelectorAll('[data-subject]').forEach(el=>{const current=!isGuide&&!isPaths&&el.dataset.subject===subject.id;el.classList.toggle('active',current);if(current)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 const brand=document.querySelector('.brand');if(brand){brand.href=isPaths?'#paths':'#'+subject.root;brand.setAttribute('aria-label',isPaths?'食品問題路徑':subject.title+'學習首頁');}
 if(!course&&!isPaths&&!isGuide){$('alternate-content').className='learning-studio';$('alternate-content').innerHTML=subjectNavigation(subject)+`<div class="learning-empty"><h1>${esc(subject.title)}內容暫時無法載入</h1><p>請重新整理，或切換上方學科繼續。</p><a href="#lab/library">糖類反應目錄 →</a></div>`;}
 else {learning=new LearningStudio($('alternate-content'),{course,progress,courses:{chemistry:foodCourse,processing:processingCourse,microbiology:microbiologyCourse},progresses:{chemistry:learningProgress,processing:processingProgress,microbiology:microbiologyProgress},pathPositions,onSearch:path=>window.history.replaceState(null,'',path),molecules:catalog,onNavigate:path=>{window.location.hash=path;},onActivity:openLearningActivity,onToast:toast,onExport:showExport});learning.render(hash);}
 updateStateCaption();window.scrollTo({top:0,left:0,behavior:'auto'});if(returningFromReaction)restoreLearningPosition(hash);
}
function openLearningActivity(activity,returnPath){
 learningContext=returnPath;
 if(activity.type==='reaction'){
  if(!curriculum.some(r=>r.id===activity.id)){toast('這條反應資料尚未載入。');return;}
  if(activity.id==='glucose-mutarotation'){rememberLearningPosition(returnPath);changeMode('reaction');return;}
  if(['glucose-isomerase-metal-hydride-transfer','starch-alpha-amylase-g5-single-cut'].includes(activity.id))rememberLearningPosition(returnPath,'hfcs-open-3d');
  const mechanism=mechanisms.find(m=>m.reactionId===activity.id);state.reactionId=activity.id;state.libraryStep=0;state.mechanismStep=0;state.libraryView=mechanism?'mechanism':'overview';state.mechanismVariant=mechanism?.variantId;changeMode('library');
 }else if(activity.type==='tool'&&['explore','compare','reaction'].includes(activity.id)){if(activity.id==='reaction')state.stage=0;changeMode(activity.id);}
}
function applyLocation(){
 const hash=window.location.hash||'#learn';
 if(!hash.startsWith('#lab/')){showLearning(hash);return;}
 const [path,query='']=hash.slice(1).split('?'),[,mode,id]=path.split('/');
 if(!labels[mode]){showLearning('#learn');return;}
 rememberReactionDraft();const from=new URLSearchParams(query).get('from');learningContext=from?learningReturnPath('#'+from):null;
 if(mode==='library'&&id){
  if(!curriculum.some(r=>r.id===id)){toast('找不到這條反應，已打開目錄。');changeMode('library',{catalogView:true,updateURL:false});return;}
  if(state.reactionId!==id){const mechanism=mechanisms.find(m=>m.reactionId===id);state.reactionId=id;state.libraryStep=0;state.mechanismStep=0;state.libraryView=mechanism?'mechanism':'overview';state.mechanismVariant=mechanism?.variantId;}
 }
 changeMode(mode,{catalogView:mode==='library'&&!id,updateURL:false});
}

function reactionDraftKey(path){
 if(!path)return null;
 const canonical=learningReturnPath(path),{course}=learningContextFor(path),route=resolveLearningRoute(canonical||'',course);
 // The bounded redesign belongs to the original ring-chain lesson only.
 return canonical&&route.view==='lesson'&&route.lesson.id==='carb-ring-chain'?canonical:null;
}
function rememberReactionDraft(){
 if(surface!=='lab'||state.mode!=='reaction'||!activeReactionOrigin)return;
 reactionDrafts.set(activeReactionOrigin,{stage:state.stage,product:state.product,electronSource,electronTarget,showArrows,feedback:transitioning?'已暫停，保留最後完成的狀態。':feedback,manualOpen:$('reaction-advanced')?.open??reactionManualOpen,showH:viewer.showH,showLabels:viewer.showLabels,renderMode:viewer.renderMode,camera:viewer.cameraState?.()});
}
function syncViewerDisplay(){
 $('show-hydrogen').checked=viewer.showH;$('show-labels').checked=viewer.showLabels;
 document.querySelectorAll('[data-render]').forEach(button=>{const active=button.dataset.render===viewer.renderMode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
}
function rememberLearningPosition(path,buttonId='learning-open-activity'){
 const canonical=learningReturnPath(path),route=resolveLearningRoute(canonical||'',learningContextFor(path).course);
 const hfcs=buttonId==='hfcs-open-3d'&&route.view==='lesson'&&route.lesson.id==='carb-hfcs-process'&&route.step==='observe';
 const key=hfcs?canonical:buttonId==='learning-open-activity'?reactionDraftKey(path):null;if(!key)return;
 learningActivityAnchors.set(key,{x:window.scrollX||0,y:window.scrollY||0,buttonId});
}
function restoreLearningPosition(path){
 const key=learningReturnPath(path),anchor=learningActivityAnchors.get(key);if(!anchor)return;
 const epoch=learningReturnEpoch,hfcs=anchor.buttonId==='hfcs-open-3d';if(hfcs)learningActivityAnchors.delete(key);
 window.requestAnimationFrame?.(()=>{if(surface!=='learn'||window.location.hash!==path||learningReturnEpoch!==epoch||(!hfcs&&learningActivityAnchors.get(key)!==anchor))return;const button=$(anchor.buttonId||'learning-open-activity');if(!button)return;button.focus({preventScroll:true});window.scrollTo({top:anchor.y,left:anchor.x,behavior:'auto'});});
}
function restartReaction(){
 if(surface!=='lab'||state.mode!=='reaction')return;stopDemo();cancelReactionTransition();if(activeReactionOrigin)reactionDrafts.delete(activeReactionOrigin);
 state.stage=0;state.product='glucose-beta';electronSource='';electronTarget='';feedback='';showArrows=true;reactionManualOpen=false;
 const manual=$('reaction-advanced');if(manual)manual.open=false;renderReaction();viewer.resize?.();viewer.fit();log('重新開始變旋機構');
}
function toggleReactionDemo(){
 if(surface!=='lab'||state.mode!=='reaction')return;
 if(demoTimer||transitioning){stopDemo();cancelReactionTransition();feedback='已暫停，保留最後完成的狀態。';renderReaction();return;}
 if(state.stage===6){state.stage=0;electronSource='';electronTarget='';feedback='';}
 showArrows=true;demoTimer=setInterval(()=>{if(state.stage===6){stopDemo();renderReaction();return;}pushReaction({guided:true});},2400);
 pushReaction({guided:true});
}
function bindReactionCameraControls(){
 const angle=Math.PI/12,directions={left:[angle,0],right:[-angle,0],up:[0,angle],down:[0,-angle]};
 document.querySelectorAll('[data-camera-orbit]').forEach(button=>button.onclick=()=>{if(surface==='lab'&&state.mode==='reaction')viewer.orbitView(...directions[button.dataset.cameraOrbit]);});
 document.querySelectorAll('[data-camera-zoom]').forEach(button=>button.onclick=()=>{if(surface==='lab'&&state.mode==='reaction')viewer.zoomView(Number(button.dataset.cameraZoom));});
}

async function readRequiredDataFile(name,key){
 try{
  const response=await fetch(`./data/${name}`);
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const data=await response.json();
  if(!Array.isArray(data?.[key])||!data[key].length)throw new Error(`缺少有效的 ${key} 陣列`);
  return data[key];
 }catch(error){throw new Error(`${name}：${error.message}`);}
}
async function readRepresentativeFile(name){
 try{
  const models=await readRequiredDataFile(name,'molecules');
  for(const model of models){
   if(!model||typeof model.id!=='string'||!model.id||!Array.isArray(model.atoms)||!model.atoms.length||!Array.isArray(model.bonds))throw new Error('分子缺少 id、atoms 或 bonds');
   const ids=new Set(model.atoms.map(atom=>atom?.id));
   if(ids.size!==model.atoms.length||model.atoms.some(atom=>typeof atom?.id!=='string'||!atom.id||typeof atom.element!=='string'||!Array.isArray(atom.position)||atom.position.length!==3||!atom.position.every(Number.isFinite)))throw new Error(`${model.id} 的原子或座標格式無效`);
   if(model.bonds.some(bond=>!bond||!ids.has(bond.a)||!ids.has(bond.b)||!Number.isFinite(bond.order)||bond.order<=0))throw new Error(`${model.id} 的鍵結格式無效`);
  }
  return models;
 }catch(error){moleculeLoadErrors.push(error.message.startsWith(`${name}：`)?error.message:`${name}：${error.message}`);return [];}
}
async function readMechanismFile(name,{expectedCount,reactionId}={}){
 try{
  const response=await fetch(`./data/${name}`);
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const data=await response.json();
  if(!Array.isArray(data?.mechanisms))throw new Error('缺少 mechanisms 陣列');
  if(expectedCount!==undefined&&data.mechanisms.length!==expectedCount)throw new Error(`預期 ${expectedCount} 個分支，實際 ${data.mechanisms.length} 個`);
  if(reactionId&&data.mechanisms.some(m=>m?.reactionId!==reactionId))throw new Error(`分支不屬於 ${reactionId}`);
  return data.mechanisms;
 }catch(error){mechanismLoadErrors.push(`${name}：${error.message}`);return [];}
}
async function init(){try{
 const [m,p]=await Promise.all([
  readRequiredDataFile('molecules.json','molecules'),
  readRequiredDataFile('torsion-profiles.json','profiles')
 ]);
 catalog=m;profiles=p;
 const c=await fetch('./data/reaction-curriculum.json').then(r=>r.ok?r.json():({reactions:[]}));
 curriculum=c.reactions;
 const representativeFiles=['reaction-molecules.json','additional-molecules.json','kiliani-molecules.json','wohl-molecules.json','cellobiose-reducing-end-molecules.json','cellobiitol-molecules.json','cellobionic-oxidation-molecules.json','starch-fragment-molecules.json','koenigs-knorr-molecules.json','udp-uronic-molecules.json','udp-galactose-molecule.json','udp-product-molecule.json','maillard-deoxyosone-molecules.json','alkaline-lactate-molecules.json'];
 reactionMolecules=(await Promise.all(representativeFiles.map(readRepresentativeFile))).flat();
 const mechanismFiles=[
  ['mechanism-models.json',{}],
  ['fructose-form-mechanism-models.json',{expectedCount:3,reactionId:'fructose-hemiketal'}],
  ['fructose-ring-opening-mechanism-models.json',{expectedCount:4,reactionId:'fructose-hemiketal'}],
  ...['acetylation','periodate','strecker','ether','reduction','disaccharide','ester','maillard','heyns'].map(name=>[`${name}-mechanism-models.json`,{}]),
  ['lacz-retaining-mechanism-models.json',{expectedCount:1,reactionId:'lactose-hydrolysis'}],
  ['glucoamylase-inverting-mechanism-models.json',{expectedCount:1,reactionId:'maltose-hydrolysis'}]
 ];
 mechanisms=[];
 for(const [name,checks] of mechanismFiles)mechanisms.push(...await readMechanismFile(name,checks));
 mechanisms.push(...builtinMechanisms(catalog));
 coverage=await fetch('./data/coverage.json').then(r=>r.ok?r.json():null).catch(()=>null);
 const loadedCourses=Object.fromEntries(await Promise.all(Object.values(LEARNING_SUBJECTS).map(async subject=>[subject.id,await fetch('./data/'+subject.file).then(r=>{if(!r.ok)throw new Error('課程資料不可用');return r.json();}).then(c=>{if(!Array.isArray(c.topics)||!c.topics.length||!Array.isArray(c.sources)||c.topics.some(t=>!Array.isArray(t.lessons)||!t.lessons.length))throw new Error('課程格式無效');if(subject.root!==(c.routeRoot||'learn'))throw new Error('課程學科不符');return c;}).catch(()=>null)])));
 ({chemistry:foodCourse,processing:processingCourse,microbiology:microbiologyCourse}=loadedCourses);
 state.reactionId=curriculum[0]?.id||'';state.libraryStep=0;state.angle=wrap(rotor().initialDihedralDeg);
 try{const saved=JSON.parse(localStorage.getItem(SESSION_KEY));if(saved)state=validRestore(validateNotebook({schema:'sugar-lab/v1',notes:[{id:'session',title:'session',state:saved}]}).notes[0].state);}catch{/* A stale session never prevents opening the lab. */}
 viewer=new MoleculeViewer($('viewer'),{onAtom:selectAtom,onBond:b=>{if(state.mode!=='explore')return;const axis=mol().rotatableBonds.find(r=>(r.a===b.a&&r.b===b.b)||(r.a===b.b&&r.b===b.a));if(axis)selectBond(axis.id);else toast('這條鍵沒有獨立旋轉軸；環內鍵或雙鍵不能像一般單鍵自由扭轉。');}});$('viewer-loading').hidden=true;$('main').classList.remove('is-loading');$('app-loading').hidden=true;applyLocation();viewer.fit();window.addEventListener('hashchange',applyLocation);
 const loadErrors=[...moleculeLoadErrors,...mechanismLoadErrors];
 if(loadErrors.length){const warning=document.createElement('section');warning.className='note-card';warning.id='data-load-warning';warning.setAttribute('role','alert');warning.style.marginBottom='18px';warning.innerHTML=`<h2>部分化學資料載入失敗</h2><p>${esc(loadErrors.join('；'))}。可繼續使用已載入的內容，也可到「實驗筆記」匯出原有筆記；缺少的代表模型無法顯示，缺失機構分支暫時無法還原。請檢查列出的資料檔後重新整理。</p>`;document.querySelector('main').prepend(warning);}
 bindReactionCameraControls();syncViewerDisplay();$('reset-camera').onclick=()=>{viewer.resize();viewer.fit();};$('show-hydrogen').onchange=e=>{viewer.showH=e.target.checked;state.mode==='reaction'?renderReaction():drawExplore();};$('show-labels').onchange=e=>{viewer.showLabels=e.target.checked;};document.querySelectorAll('[data-render]').forEach(b=>b.onclick=()=>{viewer.renderMode=b.dataset.render;syncViewerDisplay();state.mode==='reaction'?renderReaction():drawExplore();});
 const navigationToggle=$('navigation-toggle'),siteNavigation=$('site-navigation');
 const setNavigationOpen=open=>{siteNavigation.classList.toggle('is-open',open);navigationToggle.setAttribute('aria-expanded',String(open));};
 navigationToggle.onclick=()=>setNavigationOpen(navigationToggle.getAttribute('aria-expanded')!=='true');
 siteNavigation.addEventListener('click',event=>{if(event.target.closest('a, button[data-mode]'))setNavigationOpen(false);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&navigationToggle.getAttribute('aria-expanded')==='true'){setNavigationOpen(false);navigationToggle.focus();}});
 window.addEventListener('hashchange',()=>setNavigationOpen(false));
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{learningContext=null;changeMode(b.dataset.mode,{catalogView:b.dataset.mode==='library'});});$('open-acetylation').onclick=openAcetylationMechanism;$('help-button').onclick=()=>{window.location.hash='#guide';};$('sources-button').onclick=()=>dialog('模型、限制與資料來源',sourcesHTML(coverage));$('close-dialog').onclick=()=>$('info-dialog').close();$('snapshot-button').onclick=saveSnapshot;
 $('energy-chart').onclick=e=>{if(!points().length)return;const svg=e.currentTarget.querySelector('svg');if(!svg)return;const rect=svg.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*Number(svg.dataset.viewWidth),left=Number(svg.dataset.plotLeft),right=Number(svg.dataset.plotRight);stopThermal();checkpoint();setAngle(Math.max(0,Math.min(360,(x-left)/(right-left)*360)),{record:true});refreshHistory();};$('capture-button').onclick=()=>{const a=document.createElement('a');a.href=viewer.exportPNG();a.download=`sugar-lab-${state.mode}-${Date.now()}.png`;a.click();toast('已匯出 3D 模型圖片（不含介面與文字標籤）。');};
 const stop=document.createElement('button');stop.id='stop-replay';stop.textContent='■ 停止回放';stop.hidden=true;stop.className='stop-replay';stop.onclick=()=>{stopReplay();persist();toast('已停止回放。');};document.body.append(stop);document.addEventListener('visibilitychange',()=>{if(document.hidden){stopThermal();stopDemo();stopReplay();atlas?.stop();persist();}});document.addEventListener('pointerdown',()=>{if(replayTimer){stopReplay();toast('已停止回放，可繼續自由操作。');}},true);document.addEventListener('keydown',()=>{if(replayTimer)stopReplay();},true);let chartResizeFrame=0;window.addEventListener('resize',()=>{if(state.mode!=='explore')return;cancelAnimationFrame(chartResizeFrame);chartResizeFrame=requestAnimationFrame(()=>{$('energy-chart').innerHTML=energyChart(points(),state.angle,state.temperature,histogram);});});window.addEventListener('beforeunload',persist);log('開啟食品化學實驗室');
 try{if(navigator.modelContext?.registerTool){navigator.modelContext.registerTool({name:'read_sugar_lab_state',description:'Read the current educational molecule, torsion and reaction state.',inputSchema:{type:'object',properties:{}},execute:async()=>({content:[{type:'text',text:JSON.stringify({...snapshot(),energy:profile()?interpolateEnergy(points(),state.angle):null,energyKind:'MMFF94 frozen-geometry potential energy, not free energy'})}]})});}}catch{/* Optional browser integration must not interrupt the lab. */}
 }catch(error){$('main').classList.add('is-loading');$('app-loading').hidden=false;$('app-loading').setAttribute('role','alert');$('app-loading-message').textContent='無法啟動：'+error.message+'。請確認本機服務與資料檔後重新整理。';$('viewer-loading').hidden=false;$('viewer-loading').textContent='無法啟動：'+error.message;toast('啟動未完成：'+error.message+'。請查看錯誤內容並確認本機服務與資料檔。');console.error(error);}}
document.querySelector('.skip-content')?.addEventListener('click',e=>{e.preventDefault();$('main').focus();$('main').scrollIntoView({block:'start'});});
init();
