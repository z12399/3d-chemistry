import {escapeHTML as esc} from './storage.js';
import {MICRO_CELL_LAB_ID,CELL_STATE_IDS,GRAM_STAGE_IDS,CELL_SIGNAL_LABELS,validateCellEvidenceDataset,getCellState,getCellLayer,getGramStage,getEvidenceTask,assessGramPrediction,assessEvidenceChoice} from './micro-cell-model.js';
import {cellStructureSvg,gramSignalSvg} from './micro-cell-diagrams.js';
export {MICRO_CELL_LAB_ID} from './micro-cell-model.js';

const drafts=new WeakMap(),mounts=new WeakMap(),clone=value=>structuredClone(value),sig=value=>JSON.stringify(value);
const MODES=['structure','gram','evidence'],PAIR=['bacillus-vegetative','salmonella-vegetative'];
const MODE_LABELS={structure:'結構與狀態',gram:'逐步看染色',evidence:'機制與證據'};
const DETAIL_LABELS={writing:'自己的判讀',state:'目前型態的完整界線',layerSource:'目前構造的來源',gram:'染色機制與界線',spore:'內生孢子與染色',evidence:'本題解釋與證據',sources:'完整來源',limits:'模型界線',records:'已保留紀錄',summary:'待存與完整摘要'};
const freshWriting=()=>({prediction:'',observation:'',revision:''});
const fresh=()=>({mode:'structure',state:'bacillus-endospore',layer:'core',stage:'unstained',task:null,attempts:[],selectedAttempts:{},annotations:{},records:[],journal:[],seen:{states:[],stages:[],tasks:[],sources:[],details:[]},details:[],cursor:{started:false,attempts:{},annotations:{},journal:0},savedVersions:[]});
const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
const textValue=value=>Array.isArray(value)?value.map(textValue).join('；'):value&&typeof value==='object'?Object.values(value).map(textValue).join('；'):String(value??'');
const bodyText=w=>`原判讀與理由：${w.prediction||'未填'}\n觀察：${w.observation||'未填'}\n修訂：${w.revision||'未填'}`;
const preamble=()=>`【細胞狀態與染色證據】micro-cell-evidence-v1\n依來源整理的概念示意；不是顯微影像、處理存活模擬、物種鑑定或食品安全判定。題述原食品狀態與後來分離株的染色時間點分開。`;
const remember=(list,value)=>{if(!list.includes(value))list.push(value);};
let serial=0;
async function defaultLoad(signal){const response=await fetch(new URL('../data/micro-cell-evidence.json',import.meta.url),{signal});if(!response.ok)throw new Error('Cell evidence data unavailable');return response.json();}

export function mountMicroCellLab(root,id=MICRO_CELL_LAB_ID,{draftOwner,draftKey=id,onSaveSummary,loadData=defaultLoad}={}){
  if(!root?.querySelector||!root?.addEventListener)throw new TypeError('A DOM container is required');
  if(id!==MICRO_CELL_LAB_ID)throw new RangeError('Unknown cell evidence activity');
  mounts.get(root)?.();let slot;
  if(draftOwner&&typeof draftOwner==='object'){
    if(!drafts.has(draftOwner))drafts.set(draftOwner,new Map());const byLesson=drafts.get(draftOwner),key=String(draftKey);
    if(!byLesson.has(key))byLesson.set(key,{data:fresh()});slot=byLesson.get(key);slot.dispose?.();
  }else slot={data:fresh()};
  const d=slot.data,prefix=`micro-cell-${++serial}`,$=name=>root.querySelector(`[data-mc-${name}]`),action=name=>root.querySelector(`[data-mc-action="${name}"]`);
  let disposed=false,dataset=null,epoch=0,abort=null,feedback='',structureKey='';slot.saveStatus??='';
  const attemptKey=(kind,contextId)=>`${kind}:${contextId}`;
  const activeAttempt=()=>d.mode==='structure'?null:d.attempts.find(a=>a.id===d.selectedAttempts[attemptKey(d.mode,d.mode==='gram'?d.stage:d.task)])||null;
  function ensureAttempt(kind,contextId,force=false){
    const key=attemptKey(kind,contextId),existing=d.attempts.find(a=>a.id===d.selectedAttempts[key]);if(existing&&!force)return existing;
    if(d.attempts.length>=24){feedback='已保留 24 輪，不覆寫原判讀。請先保存或複製完整摘要。';return null;}
    const a={id:d.attempts.length+1,kind,contextId,answers:Object.fromEntries(PAIR.map(id=>[id,''])),choice:'',writing:freshWriting(),first:null};d.attempts.push(a);d.selectedAttempts[key]=a.id;return a;
  }
  const sourceText=ids=>(ids||[]).map(id=>dataset?.sources.find(s=>s.id===id)).filter(Boolean).map(s=>`${s.title}\n${s.url}`).join('\n');
  const sourceLink=s=>safeUrl(s?.url)?`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-mc-source="${esc(s.id)}">${esc(s.title)} ↗</a>`:esc(s?.title||'來源未提供');
  const sourceList=ids=>`<ul class="mc-source-list">${(ids||[]).map(id=>dataset?.sources.find(s=>s.id===id)).filter(Boolean).map(s=>`<li>${sourceLink(s)}<p>${esc(textValue(s.locator||s.note||''))}</p></li>`).join('')}</ul>`;
  const scopeText=seen=>`此前看過的型態：${seen.states.join('、')||'無'}；此前核對染色階段：${seen.stages.join('、')||'無'}；此前核對證據題：${seen.tasks.join('、')||'無'}；曾展開：${seen.details.map(id=>DETAIL_LABELS[id]||id).join('、')||'無'}；開啟來源：${seen.sources.join('、')||'無'}。開啟不等於已讀；本課不宣稱盲測。`;
  const firstText=first=>`第 ${first.attemptId} 輪｜${first.title}\n動作：${first.trigger}\n首次選擇：${first.choiceText}\n${bodyText(first.writing)}\n${scopeText(first.exposure)}\n核對參考：\n${first.reference}\n資料版本：${first.version}`;
  const annotationKey=()=>`structure:${d.state}:${d.layer}`;
  function titleFor(a){if(!dataset)return a.first?.title||`${a.kind} ${a.contextId}`;return a.kind==='gram'?`染色階段：${getGramStage(dataset,a.contextId).label}`:getEvidenceTask(dataset,a.contextId).title;}
  function choicesText(a){
    if(a.kind==='gram')return PAIR.map(id=>`${dataset?getCellState(dataset,id).shortLabel:id}：${CELL_SIGNAL_LABELS[a.answers[id]]||'未選'}`).join('；');
    return dataset?getEvidenceTask(dataset,a.contextId).choices.find(c=>c.id===a.choice)?.label||'未選':a.choice||'未選';
  }
  function gramMechanism(stageId){
    const id=stageId==='decolorization'?'cell-claim-gram-retention-mechanism':stageId==='counterstain'?'cell-claim-gram-counterstain':null;
    const claim=dataset?.claims.find(c=>c.id===id);if(!claim)return null;
    const text=stageId==='decolorization'?'教科書模型把脫色差異連到膜脂質與包膜通透性的改變，以及多層肽聚醣的脫水效應。典型革蘭氏陰性細胞的外膜受影響後，較薄的肽聚醣不足以留住細胞內的結晶紫—碘複合物；典型革蘭氏陽性細胞的多層肽聚醣及其脫水則有利於保留，因而仍呈紫色。這是合宜方法下的概念解釋，不是所有菌種都已直接觀察到的精確孔徑開關。':claim.claim;
    return{text,limits:textValue(claim.limits),sourceIds:claim.sourceIds};
  }
  function referenceText(a){
    if(a.kind==='gram'){const stage=getGramStage(dataset,a.contextId),mechanism=gramMechanism(a.contextId);return`${stage.concept}\n${PAIR.map(id=>{const r=stage.results[id];return`${getCellState(dataset,id).label}：${r.label}\n${r.reason}\n界線：${textValue(r.limits)}\n${sourceText(r.sourceIds)}`;}).join('\n\n')}${mechanism?`\n\n機制與適用範圍：${mechanism.text}\n${mechanism.limits}\n${sourceText(mechanism.sourceIds)}`:''}`;}
    const t=getEvidenceTask(dataset,a.contextId);return`${t.choices.find(c=>c.id===t.answerId).label}\n${t.explanation}\n界線：${textValue(t.limits)}\n${sourceText(t.sourceIds)}`;
  }
  function room(){if(d.journal.length<128)return true;feedback='已保留 128 項紀錄，不覆寫。請先保存或複製摘要。';return false;}
  const log=(label,text)=>d.journal.push({number:d.journal.length+1,label,text});
  function freezeFirst(trigger){
    const a=activeAttempt();if(!a||a.first)return;
    const complete=a.kind==='gram'?PAIR.every(id=>Object.hasOwn(CELL_SIGNAL_LABELS,a.answers[id])):!!a.choice;
    const assessment=complete?(a.kind==='gram'?assessGramPrediction(dataset,a.contextId,a.answers):assessEvidenceChoice(dataset,a.contextId,a.choice)):null;
    a.first=clone({attemptId:a.id,title:titleFor(a),trigger,choiceText:choicesText(a),answers:a.answers,choice:a.choice,writing:a.writing,exposure:d.seen,reference:referenceText(a),assessment,version:dataset.version});
    remember(a.kind==='gram'?d.seen.stages:d.seen.tasks,a.contextId);
  }
  function appendPlan(){
    const next=clone(d.cursor),parts=[],versions=[];
    for(const a of d.attempts){const prior=next.attempts[a.id]||{first:false,version:''},version=sig({answers:a.answers,choice:a.choice,writing:a.writing}),has=Object.values(a.writing).some(Boolean)||a.choice||Object.values(a.answers).some(Boolean);
      if(a.first&&!prior.first)parts.push(firstText(a.first));
      if(version!==prior.version&&(has||prior.version)){const text=`第 ${a.id} 輪目前文字版本｜${titleFor(a)}\n${a.first?'首次選擇已固定':'尚未核對的預測草稿'}：${choicesText(a)}\n${bodyText(a.writing)}`;parts.push(text);versions.push({attemptId:a.id,text});}
      if(a.first||has||prior.version)next.attempts[a.id]={first:!!a.first,version};
    }
    for(const[key,value]of Object.entries(d.annotations)){const old=next.annotations[key];if(value.text!==old&&(value.text||old)){const text=`結構註記｜${value.context}\n${value.text||'目前已清空文字'}\n${value.sources}`;parts.push(text);versions.push({annotationKey:key,text});next.annotations[key]=value.text;}}
    parts.push(...d.journal.slice(next.journal).map(e=>`紀錄 ${e.number}｜${e.label}\n${e.text}`));next.journal=d.journal.length;
    if(parts.length&&!next.started){parts.unshift(preamble());next.started=true;}return{text:parts.join('\n\n'),next,versions};
  }
  function fullText(){
    if(!d.savedVersions.length&&!d.journal.length&&!Object.values(d.annotations).some(a=>a.text)&&!d.attempts.some(a=>a.first||a.choice||Object.values(a.answers).some(Boolean)||Object.values(a.writing).some(Boolean)))return '';
    return[preamble(),...d.attempts.flatMap(a=>[a.first?firstText(a.first):`第 ${a.id} 輪｜${titleFor(a)}｜尚未核對`,...d.savedVersions.filter(v=>v.attemptId===a.id).map(v=>v.text),`目前選擇：${choicesText(a)}\n${bodyText(a.writing)}`]),...d.savedVersions.filter(v=>v.annotationKey).map(v=>v.text),...Object.values(d.annotations).map(a=>`目前結構註記｜${a.context}\n${a.text||'目前已清空文字'}\n${a.sources}`),...d.journal.map(e=>`紀錄 ${e.number}｜${e.label}\n${e.text}`)].join('\n\n');
  }
  root.innerHTML=`<section class="micro-cell-lab" aria-labelledby="${prefix}-title"><h2 id="${prefix}-title">同一細菌，為何表現不同？</h2><p class="mc-lead">先分開型態，再看結構、染色與耐受的證據。</p>
    <nav class="mc-modes" aria-label="細胞狀態學習畫面">${MODES.map(id=>`<button type="button" data-mc-mode="${id}">${MODE_LABELS[id]}</button>`).join('')}</nav>
    <p class="mc-load" role="status" data-mc-load-status>正在載入來源化教材…</p><button type="button" data-mc-action="retry" hidden>重試載入</button>
    <section data-mc-panel="structure"><label class="mc-state-controls" for="${prefix}-state">觀察哪個型態<select id="${prefix}-state" data-mc-state disabled></select></label><div class="mc-structure-grid"><figure><figcaption data-mc-state-name></figcaption><div class="mc-diagram" tabindex="0" role="region" aria-label="細胞選定構造示意，可選圖層，窄螢幕可橫向捲動" data-mc-structure></div><p class="mc-caption">選定構造的概念剖面；非比例、非顯微影像。</p></figure><aside class="mc-reading"><h3 data-mc-layer-title></h3><p data-mc-layer-reading></p><p class="mc-caption" data-mc-division></p><div data-mc-layer-sources></div></aside></div><p class="mc-layer-order">選擇構造（由外到內）</p><div class="mc-layer-buttons" role="group" aria-label="構造選擇" data-mc-layers></div></section>
    <section data-mc-panel="gram" hidden><p class="mc-caption">典型營養細胞的概念參考。先預測兩邊的訊號，再核對。</p><nav class="mc-stage-nav" aria-label="染色概念階段" data-mc-stages></nav><h3 data-mc-stage-title></h3><div class="mc-gram-pair">${PAIR.map((id,i)=>`<figure><figcaption data-mc-gram-name="${id}"></figcaption><div class="mc-gram-diagram" tabindex="0" role="region" aria-label="${i===0?'芽孢桿菌':'沙門氏桿菌'}的概念染色訊號，可橫向捲動" data-mc-gram-diagram="${id}"></div><label for="${prefix}-${id}">我的訊號預測<select id="${prefix}-${id}" data-mc-prediction-choice="${id}"><option value="">先選一個訊號</option>${Object.entries(CELL_SIGNAL_LABELS).map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></label></figure>`).join('')}</div><div class="mc-reading mc-gram-explanation" data-mc-gram-result hidden></div></section>
    <section data-mc-panel="evidence" hidden><label class="mc-task-select" for="${prefix}-task">選一個問題<select id="${prefix}-task" data-mc-task disabled></select></label><p class="mc-task-prompt" data-mc-task-prompt></p><div class="mc-choice-list" role="group" aria-label="我的證據判讀" data-mc-choices></div><div class="mc-reading" data-mc-evidence-result hidden></div></section>
    <div class="mc-check-actions" data-mc-check-actions hidden><button type="button" data-mc-action="check">核對我的判讀</button><button type="button" data-mc-action="reveal">先看參考解釋</button><button type="button" data-mc-action="new">新一輪判讀</button><p role="status" data-mc-answer></p></div>
    <div class="mc-record-actions"><button type="button" data-mc-action="record">保留這次觀察</button><span data-mc-count></span><button type="button" class="mc-primary" data-mc-action="save">保存到本課筆記</button></div><p role="status" data-mc-feedback></p><p role="status" data-mc-save-status></p>
    <details data-mc-details="writing"><summary>寫下判讀、觀察與修訂</summary><p class="mc-caption" data-mc-writing-context></p>${[['prediction','原判讀與理由'],['observation','我看到的構造或訊號'],['revision','核對後修訂']].map(([id,label])=>`<label for="${prefix}-${id}" data-mc-writing-field="${id}">${label}<textarea id="${prefix}-${id}" rows="3" maxlength="1200" data-mc-${id}></textarea></label>`).join('')}<p class="mc-preserved" data-mc-first></p></details>
    <details data-mc-details="state"><summary>目前型態與示意圖的完整界線</summary><div data-mc-state-detail></div></details>
    <details data-mc-details="gram"><summary>這一步的染色機制與界線</summary><div data-mc-gram-detail></div></details>
    <details data-mc-details="spore"><summary>內生孢子與分離株：為何不能混成同一次觀察？</summary><div data-mc-spore-detail></div></details>
    <details data-mc-details="evidence"><summary>目前問題的完整解釋與來源</summary><div data-mc-evidence-detail></div></details>
    <details data-mc-details="sources"><summary>完整來源與逐項依據</summary><div data-mc-sources></div></details>
    <details data-mc-details="limits"><summary>這個模型能回答到哪裡？</summary><div data-mc-limits></div></details>
    <details data-mc-details="records"><summary>回看已保留的觀察與原判讀</summary><div data-mc-records></div></details>
    <details class="mc-summary" data-mc-details="summary"><summary>待存內容與完整摘要</summary><label for="${prefix}-append">這次會附加的內容<textarea id="${prefix}-append" data-mc-append readonly rows="5"></textarea></label><label for="${prefix}-summary">完整摘要（包含已保存文字版本）<textarea id="${prefix}-summary" data-mc-summary readonly rows="6"></textarea></label><button type="button" data-mc-action="copy">選取完整摘要</button><p class="mc-caption">同頁離開再回來可接續；重新整理前請保存筆記。內容過長會拒絕保存，不會截斷原文。</p></details>
  </section>`;
  function drawSummary(){if(disposed)return;const p=appendPlan();$('append').value=p.text;$('summary').value=fullText();action('save').disabled=!!slot.pending||!p.text||typeof onSaveSummary!=='function';$('save-status').textContent=slot.saveStatus;}
  function drawWriting(){
    const a=activeAttempt(),structure=d.mode==='structure';$('writing-context').textContent=structure?'這份觀察只屬於目前的型態與構造。':a?`第 ${a.id} 輪｜${titleFor(a)}；核對或先看參考後，原判讀固定，後續文字寫在修訂。`:'等待題目資料。';
    for(const key of ['prediction','observation','revision']){const group=root.querySelector(`[data-mc-writing-field="${key}"]`);group.hidden=structure&&key!=='observation';$(key).value=structure?(key==='observation'?d.annotations[annotationKey()]?.text||'':''):a?.writing[key]||'';$(key).readOnly=!structure&&key==='prediction'&&!!a?.first;$(key).disabled=!structure&&!a;}
    $('first').textContent=a?.first?`已固定首次選擇：${a.first.choiceText}\n原判讀：${a.first.writing.prediction||'未填'}\n${scopeText(a.first.exposure)}`:'';
  }
  function drawStructure(){
    const state=getCellState(dataset,d.state);if(!state.layers.some(layer=>layer.id===d.layer))d.layer=state.layers.at(-1).id;
    const layer=getCellLayer(dataset,d.state,d.layer),key=`${d.state}:${d.layer}`;
    $('state-name').textContent=state.label;if(key!==structureKey){$('structure').innerHTML=cellStructureSvg(state,d.layer,prefix);structureKey=key;}
    $('layer-title').textContent=layer.label;$('layer-reading').textContent=layer.description;$('division').textContent=state.divisionStatus;
    $('layer-sources').innerHTML=`<details data-mc-details="layerSource"${d.details.includes('layerSource')?' open':''}><summary>這個構造的來源</summary>${sourceList(layer.sourceIds)}</details>`;$('layers').innerHTML=state.layers.map(layer=>`<button type="button" data-mc-layer="${esc(layer.id)}" aria-pressed="${layer.id===d.layer}">${esc(layer.shortLabel||layer.label)}</button>`).join('');
    $('state-detail').innerHTML=`<h3>${esc(state.label)}</h3><p>${esc(state.summary)}</p><p>${esc(textValue(state.scope))}</p><p>圖中只畫本課選定構造；未畫出的構造不代表不存在。識別色不是革蘭氏染色結果，圖層厚度不是實測比例。</p>${sourceList([...new Set(state.layers.flatMap(layer=>layer.sourceIds))])}`;
    if(d.mode==='structure')remember(d.seen.states,d.state);
  }
  function drawGram(){
    const stage=getGramStage(dataset,d.stage),a=d.attempts.find(a=>a.id===d.selectedAttempts[attemptKey('gram',d.stage)]),revealed=!!a?.first;
    $('stage-title').textContent=stage.label;
    for(const button of root.querySelectorAll('[data-mc-stage]'))button.setAttribute('aria-pressed',String(button.dataset.mcStage===d.stage));
    for(const id of PAIR){const state=getCellState(dataset,id),choice=root.querySelector(`[data-mc-prediction-choice="${id}"]`);root.querySelector(`[data-mc-gram-name="${id}"]`).textContent=state.label;root.querySelector(`[data-mc-gram-diagram="${id}"]`).innerHTML=gramSignalSvg(state,revealed?stage.results[id]:null,`${prefix}-${id}`);choice.value=a?.answers[id]||'';choice.disabled=!dataset||revealed;}
    $('gram-result').hidden=!revealed;$('gram-result').innerHTML=revealed?`<h3>這一步看到的差別</h3><p>${esc(stage.concept)}</p><p class="mc-caption">參考適用於典型營養細胞與合宜方法；顏色不等於存活或物種確認。</p>`:'';
    $('gram-detail').innerHTML=revealed?`${PAIR.map(id=>{const r=stage.results[id];return`<article><h3>${esc(getCellState(dataset,id).shortLabel)}：${esc(r.label)}</h3><p>${esc(r.reason)}</p><p>${esc(textValue(r.limits))}</p>${sourceList(r.sourceIds)}</article>`;}).join('')}`:'<p>這一步尚未核對。可先填兩邊的預測，或按「先看參考解釋」；首次選擇與曝光狀態會保留。</p>';
    const mechanism=revealed?gramMechanism(d.stage):null;if(mechanism)$('gram-detail').innerHTML+=`<article><h3>為何出現這個訊號？</h3><p>${esc(mechanism.text)}</p><p>${esc(mechanism.limits)}</p>${sourceList(mechanism.sourceIds)}</article>`;
    const spore=stage.results['bacillus-endospore'];$('spore-detail').innerHTML=`<p>題目先談產品加熱時的可能細胞狀態，後談從產品分離出的細菌。後者的染色不能倒推出原食品中每個細胞的狀態或唯一污染來源。</p><h3>內生孢子在本模型的處理</h3><p>${esc(spore.reason)}</p><p>${esc(textValue(spore.limits))}</p>${sourceList(spore.sourceIds)}`;
  }
  function drawEvidence(){
    const task=getEvidenceTask(dataset,d.task),a=d.attempts.find(a=>a.id===d.selectedAttempts[attemptKey('evidence',d.task)]),revealed=!!a?.first;
    $('task-prompt').textContent=task.prompt;$('choices').innerHTML=task.choices.map(choice=>`<button type="button" data-mc-choice="${esc(choice.id)}" aria-pressed="${a?.choice===choice.id}"${revealed?' disabled':''}>${esc(choice.label)}</button>`).join('');
    $('evidence-result').hidden=!revealed;$('evidence-result').innerHTML=revealed?`<h3>本題參考判讀</h3><p>${esc(task.choices.find(c=>c.id===task.answerId).label)}</p>`:'';
    $('evidence-detail').innerHTML=revealed?`<h3>${esc(task.title)}</h3><p>${esc(task.explanation)}</p><p>${esc(textValue(task.limits))}</p>${sourceList(task.sourceIds)}`:'<p>目前問題尚未核對；填完判讀或選「先看參考解釋」後，這裡會顯示來源化解釋。</p>';
  }
  function draw(){
    if(disposed)return;
    for(const button of root.querySelectorAll('[data-mc-mode]'))button.setAttribute('aria-pressed',String(button.dataset.mcMode===d.mode));
    for(const panel of root.querySelectorAll('[data-mc-panel]'))panel.hidden=panel.dataset.mcPanel!==d.mode;
    $('check-actions').hidden=d.mode==='structure';$('state').value=d.state;$('state').disabled=!dataset;$('task').disabled=!dataset;if(d.task)$('task').value=d.task;
    $('count').textContent=`${d.records.length} / 24 組`;$('feedback').textContent=feedback;action('record').disabled=!dataset;
    const a=activeAttempt(),complete=a&&(a.kind==='gram'?PAIR.every(id=>Object.hasOwn(CELL_SIGNAL_LABELS,a.answers[id])):!!a.choice);
    action('check').disabled=!dataset||!a||!!a.first||!complete;action('reveal').disabled=!dataset||!a||!!a.first;action('new').disabled=!dataset||!a;
    if(dataset){drawStructure();drawGram();drawEvidence();}
    else{structureKey='';for(const name of ['structure','layers','layer-sources','state-detail','gram-detail','spore-detail','evidence-detail','choices'])$(name).innerHTML='';for(const name of ['state-name','layer-title','layer-reading','division','stage-title','task-prompt'])$(name).textContent='';$('gram-result').hidden=true;$('evidence-result').hidden=true;for(const id of PAIR){root.querySelector(`[data-mc-gram-diagram="${id}"]`).innerHTML='';root.querySelector(`[data-mc-prediction-choice="${id}"]`).disabled=true;}}
    $('answer').textContent=a?.first?(a.first.trigger==='先看參考解釋'?'已查看參考，首次選擇與原文仍保留。':a.kind==='gram'?`兩個預測中 ${a.first.assessment.correctCount} 個與參考一致。原判讀已固定，可補寫修訂。`:`${a.first.assessment.correct?'與本題參考一致。':'與本題參考不同。'}原判讀已固定，可補寫修訂。`):'';
    drawWriting();$('records').innerHTML=d.records.map((r,i)=>`<article><h3>觀察 ${i+1}</h3><p class="mc-record-text">${esc(r.text)}</p></article>`).join('')+d.attempts.filter(a=>a.first).map(a=>`<details><summary>第 ${a.id} 輪 · ${esc(a.first.title)}</summary><p class="mc-record-text">${esc(firstText(a.first))}</p></details>`).join('');drawSummary();
  }
  function setContext(kind,id){
    if(!ensureAttempt(kind,id))return false;if(kind==='gram')d.stage=id;else d.task=id;d.mode=kind;feedback='';return true;
  }
  function onInput(event){
    if(disposed||!root.contains(event.target))return;const key=['prediction','observation','revision'].find(key=>event.target===$(key));if(!key)return;
    if(d.mode==='structure'){if(key!=='observation')return;const s=dataset?getCellState(dataset,d.state):null,l=s?getCellLayer(dataset,d.state,d.layer):null,previous=d.annotations[annotationKey()];d.annotations[annotationKey()]={context:s?`${s.label}｜${l.label}`:previous?.context||`${d.state}｜${d.layer}`,text:String(event.target.value),sources:l?sourceText(l.sourceIds):previous?.sources||''};}
    else{const a=activeAttempt();if(!a)return;if(key==='prediction'&&a.first){event.target.value=a.writing[key];return;}a.writing[key]=String(event.target.value);}
    if(!slot.pending)slot.saveStatus='';drawSummary();
  }
  function onChange(event){
    if(disposed||!root.contains(event.target)||!dataset)return;
    if(event.target===$('state')){if(!CELL_STATE_IDS.includes(event.target.value))return;d.state=event.target.value;d.layer=getCellState(dataset,d.state).layers.at(-1).id;feedback='';return draw();}
    if(event.target===$('task')){if(!dataset.evidenceTasks.some(t=>t.id===event.target.value))return;setContext('evidence',event.target.value);return draw();}
    const id=event.target.dataset.mcPredictionChoice;if(PAIR.includes(id)){const a=activeAttempt();if(!a||a.kind!=='gram'||a.first)return draw();if(event.target.value===''||Object.hasOwn(CELL_SIGNAL_LABELS,event.target.value))a.answers[id]=event.target.value;draw();}
  }
  function observationText(){
    if(d.mode==='structure'){const s=getCellState(dataset,d.state),l=getCellLayer(dataset,d.state,d.layer);return`${s.label}｜${l.label}\n${l.description}\n狀態：${s.divisionStatus}\n示意界線：${textValue(s.scope)}\n${sourceText(l.sourceIds)}`;}
    const a=activeAttempt();if(!a)return '';
    if(a.first)return`${firstText(a.first)}\n目前修訂：${a.writing.revision||'未填'}\n目前觀察：${a.writing.observation||'未填'}`;
    return`${titleFor(a)}\n尚未核對；目前預測：${choicesText(a)}\n${bodyText(a.writing)}`;
  }
  function onClick(event){
    if(disposed||!root.contains(event.target))return;
    const source=event.target.closest('[data-mc-source]');if(source){const id=source.dataset.mcSource;if(!d.seen.sources.includes(id)){if(!room()){event.preventDefault?.();return draw();}remember(d.seen.sources,id);log('開啟來源（不代表已讀）',`${id}\n${dataset?sourceText([id]):''}`);}drawSummary();return;}
    const mode=event.target.closest('[data-mc-mode]');if(mode){const value=mode.dataset.mcMode;if(!MODES.includes(value))return;feedback='';if(value==='structure')d.mode=value;else if(dataset)setContext(value,value==='gram'?d.stage:d.task);return draw();}
    if(dataset){const layer=event.target.closest('[data-mc-layer],[data-cell-layer]');if(layer){const id=layer.dataset.mcLayer||layer.dataset.cellLayer,selector=layer.dataset.mcLayer?'data-mc-layer':'data-cell-layer';if(getCellState(dataset,d.state).layers.some(l=>l.id===id)){d.layer=id;feedback='';draw();root.querySelector(`[${selector}="${id}"]`)?.focus();}return;}
      const stage=event.target.closest('[data-mc-stage]');if(stage){if(GRAM_STAGE_IDS.includes(stage.dataset.mcStage))setContext('gram',stage.dataset.mcStage);return draw();}
      const choice=event.target.closest('[data-mc-choice]');if(choice){const a=activeAttempt(),id=choice.dataset.mcChoice;if(a?.kind==='evidence'&&!a.first&&getEvidenceTask(dataset,a.contextId).choices.some(c=>c.id===id))a.choice=id;draw();root.querySelector(`[data-mc-choice="${id}"]`)?.focus();return;}}
    const button=event.target.closest('[data-mc-action]');if(!button||button.disabled)return;const name=button.dataset.mcAction;
    if(name==='retry'){load();return;}if(name==='copy'){$('summary').focus();$('summary').select();return;}
    if(name==='save'){
      const plan=appendPlan();if(!plan.text||slot.pending||typeof onSaveSummary!=='function')return;
      if(plan.text.length>10000){slot.saveStatus='尚未保存：本次超過 10,000 字元。完整內容保留，可選取摘要複製。';return drawSummary();}
      const token={};slot.pending=token;slot.saveStatus='正在保存；本次內容已固定，仍可繼續修訂。';drawSummary();
      const finish=(ok,error)=>{if(slot.pending!==token)return;slot.pending=null;if(ok===true){d.cursor=plan.next;d.savedVersions.push(...plan.versions);slot.saveStatus='已附加本次內容；重複按下不會重複加入。';}else slot.saveStatus=error?`尚未保存：${error?.message||'儲存失敗'}。待存內容完整保留。`:'尚未保存：請檢查筆記容量與儲存狀態。待存內容完整保留。';slot.refresh?.();};
      try{const value=onSaveSummary(plan.text);if(value&&typeof value.then==='function')Promise.resolve(value).then(finish,error=>finish(false,error));else finish(value);}catch(error){finish(false,error);}return;
    }
    if(!dataset)return;
    if(name==='record'){
      if(d.records.length>=24){feedback='已保留 24 組，不覆寫舊觀察。請先保存或複製。';return draw();}if(!room())return draw();const text=observationText();
      if(text&&!d.records.some(r=>r.text===text)){d.records.push({text});log('保留觀察',text);}feedback='已保留；改選型態或階段不會改寫這組觀察。';
    }else if(name==='check'||name==='reveal'){const a=activeAttempt();if(!a||a.first)return;const complete=a.kind==='gram'?PAIR.every(id=>Object.hasOwn(CELL_SIGNAL_LABELS,a.answers[id])):!!a.choice;if(name==='check'&&!complete)return;freezeFirst(name==='check'?'核對我的判讀':'先看參考解釋');feedback='首次選擇與原文已固定，修訂欄可繼續書寫。';
    }else if(name==='new'){const a=activeAttempt();if(a&&ensureAttempt(a.kind,a.contextId,true))feedback='已開始新一輪；原判讀與文字仍保留。';}
    draw();
  }
  function onKey(event){if(disposed||!['Enter',' '].includes(event.key)||!event.target.closest('[data-cell-layer]'))return;event.preventDefault();onClick(event);}
  function onToggle(event){if(disposed||!root.contains(event.target)||!event.target.dataset.mcDetails)return;const id=event.target.dataset.mcDetails;d.details=d.details.filter(v=>v!==id);if(event.target.open){d.details.push(id);if(['state','layerSource','gram','spore','evidence','sources','limits'].includes(id))remember(d.seen.details,id);}drawSummary();}
  async function load(){
    const token=++epoch;abort?.abort();abort=new AbortController();dataset=null;structureKey='';$('load-status').textContent='正在載入並核對教材…';action('retry').hidden=true;draw();
    try{const raw=await loadData(abort.signal);if(disposed||token!==epoch)return;dataset=validateCellEvidenceDataset(raw);
      if(!dataset.evidenceTasks.some(t=>t.id===d.task))d.task=dataset.evidenceTasks[0].id;
      $('state').innerHTML=dataset.states.map(s=>`<option value="${esc(s.id)}">${esc(s.label)}</option>`).join('');$('task').innerHTML=dataset.evidenceTasks.map(t=>`<option value="${esc(t.id)}">${esc(t.title)}</option>`).join('');
      $('stages').innerHTML=dataset.gramStages.map((s,i)=>`<button type="button" data-mc-stage="${esc(s.id)}"><span>${i+1}</span>${esc(s.label)}</button>`).join('');
      $('sources').innerHTML=sourceList(dataset.sources.map(s=>s.id));$('limits').innerHTML=`<ul>${dataset.limits.map(value=>`<li>${esc(textValue(value))}</li>`).join('')}</ul>`;
      if(d.mode!=='structure')ensureAttempt(d.mode,d.mode==='gram'?d.stage:d.task);$('load-status').textContent='來源化概念示意；圖層顏色與染色訊號分開。';draw();
    }catch(error){if(disposed||token!==epoch)return;dataset=null;$('load-status').textContent='教材未能讀取或通過核對。文字與已保留觀察仍在，請重試。';action('retry').hidden=false;draw();}
  }
  for(const n of root.querySelectorAll('[data-mc-details]'))n.open=d.details.includes(n.dataset.mcDetails);
  action('save').hidden=typeof onSaveSummary!=='function';root.addEventListener('click',onClick);root.addEventListener('change',onChange);root.addEventListener('input',onInput);root.addEventListener('keydown',onKey);root.addEventListener('toggle',onToggle,true);
  const dispose=()=>{if(disposed)return;disposed=true;epoch++;abort?.abort();for(const[event,fn]of[['click',onClick],['change',onChange],['input',onInput],['keydown',onKey]])root.removeEventListener(event,fn);root.removeEventListener('toggle',onToggle,true);if(slot.dispose===dispose){slot.dispose=null;slot.refresh=null;}if(mounts.get(root)===dispose)mounts.delete(root);};
  slot.dispose=dispose;slot.refresh=drawSummary;mounts.set(root,dispose);draw();load();return dispose;
}
