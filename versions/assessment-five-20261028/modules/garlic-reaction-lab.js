import {escapeHTML as esc} from './storage.js';
import {GARLIC_REACTION_ID,GARLIC_OPERATION_IDS,GARLIC_MAX_ACTIONS,validateGarlicDataset,evaluateGarlicSequence} from './garlic-reaction-model.js';
import {GARLIC_LABELS,garlicBoard,garlicInventory,garlicLedger,garlicSources,garlicSourceLinks,garlicStateText,garlicSourceText,garlicConditions} from './garlic-reaction-diagrams.js';
export {GARLIC_REACTION_ID} from './garlic-reaction-model.js';

const owners=new WeakMap(),mounts=new WeakMap();
const copy=value=>structuredClone(value),sig=value=>JSON.stringify(value);
const WRITING={prediction:'初判與理由（選填）',observation:'我觀察到什麼？',revision:'我如何修訂原判斷？'};
const PANELS={writing:'初判、觀察與修訂',history:'保留的快照與操作回看',ledger:'完整反應帳與界線',sources:'來源定位',summary:'待存內容與完整摘要'};
const REVEAL=['ledger','sources','history'];
const MAX_SAMPLES=100,MAX_RUNS=50;
const PREAMBLE='【大蒜反應順序與原子去向】\n固定中性物種與示意份數；不是秒數、食品濃度或產率。失活只改後續催化條件，不模擬完整加熱。C/N/S是骨架對應，非同位素證據；H/O只總帳。短命中間體停留僅為教學查看。保留此刻是非破壞快照；JSON只還原已附加文字，不重建盤面，不自動評分。';
const fresh=()=>({runs:[],liveRunId:null,viewCursor:null,historyRunId:null,focusElement:'C',openPanels:[],seen:{operations:[],disclosures:[],sources:[],histories:[]},exposures:[],cursor:{header:false,runs:{},exposures:0},savedWritings:[]});
const remember=(list,value)=>{if(!list.includes(value))list.push(value);};
const writingText=w=>Object.entries(WRITING).map(([k,label])=>`${label}：${w[k]||'未填'}`).join('\n');
const seenText=s=>`此前已見：操作 ${s.operations.join('、')||'無'}；展開 ${s.disclosures.join('、')||'無'}；來源 ${s.sources.join('、')||'無'}；回看 ${s.histories.join('、')||'無'}。已呈現不表示讀懂；不宣稱盲測。`;
let serial=0;
async function defaultLoad(signal){const r=await fetch(new URL('../data/garlic-reaction-ledger.json',import.meta.url),{signal});if(!r.ok)throw new Error('Garlic source unavailable');return r.json();}

export function mountGarlicReactionLab(root,id=GARLIC_REACTION_ID,{draftOwner,draftKey=id,onSaveSummary,loadData=defaultLoad}={}){
  if(!root?.querySelector||!root?.addEventListener)throw new TypeError('A DOM container is required');
  if(id!==GARLIC_REACTION_ID)throw new RangeError('Unknown garlic activity');
  mounts.get(root)?.();let slot;
  if(draftOwner&&typeof draftOwner==='object'){
    if(!owners.has(draftOwner))owners.set(draftOwner,new Map());
    const map=owners.get(draftOwner),key=String(draftKey);
    if(!map.has(key))map.set(key,{data:fresh()});slot=map.get(key);slot.dispose?.();
  }else slot={data:fresh()};
  const d=slot.data,prefix=`garlic-reaction-${++serial}`;
  const $=name=>root.querySelector(`[data-gr-${name}]`),attr=(name,value)=>root.querySelector(`[data-gr-${name}="${value}"]`),action=name=>attr('action',name);
  let data=null,disposed=false,epoch=0,abort=null,loadStatus='loading',feedback='';
  slot.saveStatus??='';
  const live=()=>d.runs.find(r=>r.id===d.liveRunId)||null;
  const ready=()=>!!data&&loadStatus==='ready'&&!!live();
  const operable=()=>ready()&&!d.viewCursor;
  function makeRun(){
    if(d.runs.length>=MAX_RUNS)return false;
    const replay=evaluateGarlicSequence([],data);
    if(replay.status!=='SOURCE_BOUND_REPLAY')throw new Error('Unknown source');
    const run={id:`r${d.runs.length+1}`,number:d.runs.length+1,sourceIdentity:replay.sourceIdentity,actions:[],replay,first:null,writing:{prediction:'',observation:'',revision:''},entries:[],samples:[],touched:false};
    d.runs.push(run);d.liveRunId=run.id;d.historyRunId=run.id;d.viewCursor=null;return run;
  }
  function freezeFirst(trigger){const r=live();if(!r||r.first)return;r.first=copy({runId:r.id,trigger,prediction:r.writing.prediction,answered:!!r.writing.prediction.trim(),initial:r.replay.initial,sourceIdentity:r.sourceIdentity,seenBefore:d.seen});r.touched=true;}
  const firstText=f=>`第 ${Number(f.runId.slice(1))} 輪初判（${f.trigger}）：${f.prediction||'未填'}\n${f.answered?'已留下文字；不自動評分。':'未填初判，不計首次作答。'}\n${seenText(f.seenBefore)}`;
  function view(){
    const r=d.viewCursor?d.runs.find(v=>v.id===d.viewCursor.runId):live();if(!r)return null;
    if(!d.viewCursor)return {run:r,state:r.replay.final,step:r.replay.steps.at(-1)||null,writing:r.writing,focus:d.focusElement,label:`第 ${r.number} 輪 · 目前盤面`,entry:null};
    const entry=r.entries.find(v=>v.id===d.viewCursor.entryId);
    if(d.viewCursor.entryId===`${r.id}:initial`)return {run:r,state:r.replay.initial,step:null,writing:r.first?{prediction:r.first.prediction,observation:'',revision:''}:{...r.writing},focus:d.focusElement,label:`回看第 ${r.number} 輪 · 起始盤面`,entry:null};
    if(!entry)return null;
    const step=entry.type==='step'?entry.step:r.replay.steps.find(v=>`${r.id}:op${v.sequence}`===entry.stepId)||null;
    return {run:r,state:entry.type==='step'?entry.step.after:entry.state,step,writing:entry.writing,focus:d.focusElement,label:`回看第 ${r.number} 輪 · ${entry.type==='step'?`操作 ${entry.step.sequence}`:`保留 ${entry.number}`}`,entry};
  }
  function entryText(entry){
    if(entry.type==='step'){
      const s=entry.step,changes=Object.entries(s.inventoryDelta).filter(([,v])=>v).map(([k,v])=>`${GARLIC_LABELS[k]||k}${v>0?'+':''}${v}`).join('、')||'物質份數不變';
      const conditions=s.conditionChanges.map(v=>`${v.key}=${v.after}`).join('、');
      return `[${entry.id}] ${GARLIC_LABELS[s.operationId]}：${s.status==='applied'?'已執行':'未執行'}；${changes}${conditions?'；'+conditions:''}\n${s.message}\n依據：${s.evidenceRefs.map(v=>`${v.sourceId}／${v.locator}`).join('；')||'條件與庫存檢查'}`;
    }
    return `[${entry.id}] 保留此刻，引用 ${entry.stepId}；追蹤 ${entry.focusElement}\n${garlicStateText(entry.state)}\n${writingText(entry.writing)}`;
  }
  const used=r=>r.touched||!!r.first||!!r.entries.length||Object.values(r.writing).some(Boolean)||!!d.cursor.runs[r.id];
  function appendPlan(){
    const next=copy(d.cursor),parts=[],versions=[];
    for(const r of d.runs.filter(used)){
      const old=next.runs[r.id]||{first:false,entries:0,writing:''};
      if(!next.runs[r.id])parts.push(`第 ${r.number} 輪｜起始 ${garlicStateText(r.replay.initial)}`);
      if(r.first&&!old.first)parts.push(firstText(r.first));
      parts.push(...r.entries.slice(old.entries).map(entryText));
      const signature=sig(r.writing);
      if(signature!==old.writing){const text=`第 ${r.number} 輪文字版本（操作 ${r.actions.length} 後）\n${writingText(r.writing)}`;parts.push(text);versions.push({runId:r.id,signature,text});}
      next.runs[r.id]={first:!!r.first,entries:r.entries.length,writing:signature};
    }
    parts.push(...d.exposures.slice(next.exposures).map(e=>`[${e.runId}] ${e.text}`));next.exposures=d.exposures.length;
    if(parts.length&&!next.header){parts.unshift(PREAMBLE,garlicSourceText(live()?.replay||d.runs[0]?.replay));next.header=true;}
    return {text:parts.join('\n\n'),next,versions};
  }
  function fullText(){
    const runs=d.runs.filter(used);if(!runs.length&&!d.exposures.length)return '';
    return [PREAMBLE,garlicSourceText(runs[0]?.replay||live()?.replay),...runs.flatMap(r=>{
      const saved=d.savedWritings.filter(v=>v.runId===r.id),current=sig(r.writing);
      return [`第 ${r.number} 輪｜起始 ${garlicStateText(r.replay.initial)}`,r.first?firstText(r.first):'未操作草稿；初判尚未固定。',...r.entries.map(entryText),...saved.map(v=>v.text),...(saved.at(-1)?.signature===current?[]:[`目前文字\n${writingText(r.writing)}`])];
    }),...d.exposures.map(e=>`[${e.runId}] ${e.text}`)].join('\n\n');
  }

  root.innerHTML=`<section class="garlic-reaction-ledger" data-gr-ready="loading" aria-label="大蒜反應順序與原子去向">
    <p role="status" data-gr-load-status>正在核對反應資料…</p><button type="button" data-gr-action="retry" hidden>重試載入</button>
    <div class="gr-top"><strong data-gr-view-label></strong><button type="button" data-gr-action="current" hidden>回到目前輪次</button><button type="button" data-gr-action="new" disabled>新一輪</button></div>
    <p class="gr-conditions" data-gr-conditions></p><p class="gr-caption">示意份數；每次按鈕是教學步驟，不是秒數、速率或食品產率。</p>
    <div class="gr-operations" role="group" aria-label="有限操作">${GARLIC_OPERATION_IDS.map(k=>`<button type="button" data-gr-operation="${k}" disabled>${esc(GARLIC_LABELS[k])}</button>`).join('')}<button type="button" data-gr-action="sample" disabled>保留此刻</button></div>
    <p role="status" data-gr-step-result></p><p class="gr-caption" data-gr-near-boundary>失活只改後續催化條件；保留此刻是非破壞快照。</p>
    <div class="gr-focus" role="group" aria-label="追蹤原子元素"><span>追蹤</span>${[['C','碳'],['N','氮'],['S','硫']].map(([k,label])=>`<button type="button" data-gr-focus="${k}" aria-pressed="${k==='C'}" disabled>${k} ${label}</button>`).join('')}</div>
    <div data-gr-diagram></div><p data-gr-tracking></p><p class="gr-caption" data-gr-structure-note></p>
    <div data-gr-inventory-table></div><div class="gr-save-row"><button type="button" data-gr-action="save">附加到本課筆記</button><span data-gr-count></span></div><p role="status" data-gr-feedback></p><p role="status" data-gr-save-status></p>
    <details data-gr-details="writing"><summary>初判、觀察與修訂</summary><p data-gr-writing-context></p>${Object.entries(WRITING).map(([k,label])=>`<label for="${prefix}-${k}">${label}<textarea id="${prefix}-${k}" rows="3" data-gr-writing="${k}" disabled></textarea></label>`).join('')}<pre data-gr-first></pre></details>
    <details data-gr-details="history"><summary data-gr-disclosure="history">保留的快照與操作回看</summary><label for="${prefix}-run">輪次<select id="${prefix}-run" data-gr-run disabled></select></label><div data-gr-history></div></details>
    <details data-gr-details="ledger"><summary data-gr-disclosure="ledger">完整反應帳與界線</summary><div data-gr-ledger></div></details>
    <details data-gr-details="sources"><summary data-gr-disclosure="sources">來源定位</summary><div data-gr-sources></div></details>
    <details data-gr-details="summary"><summary>待存內容與完整摘要</summary><p>成功附加後才納入食品化學 JSON；未保存盤面不會隨 JSON 還原。容量不足時全文仍可複製。</p><label for="${prefix}-append">本次待附加<textarea id="${prefix}-append" rows="5" data-gr-append readonly></textarea></label><label for="${prefix}-summary">完整摘要<textarea id="${prefix}-summary" rows="9" data-gr-summary readonly></textarea></label><button type="button" data-gr-action="copy">選取完整摘要</button></details>
  </section>`;
  function drawSummary(){const plan=appendPlan();$('append').value=plan.text;$('summary').value=fullText();$('save-status').textContent=slot.saveStatus;action('save').disabled=!!slot.pending||!plan.text||typeof onSaveSummary!=='function';action('copy').disabled=!$('summary').value;}
  function drawHistory(){
    $('run').innerHTML=d.runs.map(r=>`<option value="${r.id}">第 ${r.number} 輪${r.id===d.liveRunId?'（目前）':''}</option>`).join('');$('run').value=d.historyRunId||d.liveRunId||'';$('run').disabled=!d.runs.length;
    if(!attr('details','history').open){$('history').innerHTML='';return;}
    const r=d.runs.find(v=>v.id===d.historyRunId)||live();
    $('history').innerHTML=r?`<p>${r.first?esc(firstText(r.first)):'未經操作的草稿；沒有偽造首次作答。'}</p><button type="button" data-gr-view="${r.id}:initial">回看起始盤面</button><ol>${r.entries.map(e=>`<li><button type="button" data-gr-view="${e.id}">${e.type==='step'?`操作 ${e.step.sequence} · ${esc(GARLIC_LABELS[e.step.operationId])} · ${e.step.status==='applied'?'已執行':'未執行'}`:`保留 ${e.number} · 操作 ${e.actionCount} 後`}</button><pre>${esc(entryText(e))}</pre></li>`).join('')}</ol>`:'';
  }
  function draw(){
    const v=view(),r=live();$('ready').setAttribute('data-gr-ready',loadStatus);
    $('view-label').textContent=v?.label||'來源尚未核對';action('current').hidden=!d.viewCursor;action('current').disabled=!d.viewCursor;action('new').disabled=!ready()||d.runs.length>=MAX_RUNS;
    $('conditions').textContent=ready()&&v?garlicConditions(v.state.conditions):'';
    for(const key of GARLIC_OPERATION_IDS){const b=attr('operation',key),a=r?.replay.availability?.[key];b.disabled=!operable()||r.actions.length>=GARLIC_MAX_ACTIONS;b.setAttribute('aria-label',`${GARLIC_LABELS[key]}${ready()&&a&&!a.enabled?'；'+a.message:''}`);b.setAttribute('title',ready()&&a?a.message:'來源核對後可操作');}
    action('sample').disabled=!operable()||r.samples.length>=MAX_SAMPLES;
    for(const key of ['C','N','S']){const b=attr('focus',key);b.disabled=!ready();b.setAttribute('aria-pressed',String(d.focusElement===key));}
    if(ready()&&v){
      const rendered=garlicBoard(v.run.replay,v.state,v.step,d.focusElement);
      $('diagram').innerHTML=rendered.html;$('tracking').textContent=rendered.tracking;$('structure-note').textContent=rendered.note;
      $('inventory-table').innerHTML=garlicInventory(v.run.replay,v.state,v.step);
      $('step-result').textContent=v.step?`操作 ${v.step.sequence} · ${v.step.status==='applied'?'已執行':'未執行'}：${v.step.message}`:'尚未操作；原本分隔的底物與酵素尚未接觸。';
      $('step-result').setAttribute('data-gr-step-status',v.step?.status||'initial');$('step-result').setAttribute('data-gr-operation-sequence',String(v.step?.sequence||0));
    }else{$('diagram').innerHTML='';$('tracking').textContent='';$('structure-note').textContent='';$('inventory-table').innerHTML='';$('step-result').textContent='';$('step-result').setAttribute('data-gr-step-status','unavailable');$('step-result').setAttribute('data-gr-operation-sequence','');}
    $('count').textContent=r?`本輪 ${r.actions.length}/${GARLIC_MAX_ACTIONS} 次操作 · ${r.samples.length}/${MAX_SAMPLES} 份快照 · ${d.runs.length}/${MAX_RUNS} 輪`:'';
    const capped=r&&(r.actions.length>=GARLIC_MAX_ACTIONS||r.samples.length>=MAX_SAMPLES||d.runs.length>=MAX_RUNS);
    $('feedback').textContent=feedback+(capped?' 已達部分容量上限；舊紀錄保留，可保存或複製。':'');
    for(const k of Object.keys(WRITING)){const field=attr('writing',k);field.value=v?.writing[k]||'';field.disabled=!r||!!d.viewCursor;field.readOnly=k==='prediction'&&!!r?.first;}
    $('writing-context').textContent=d.viewCursor?'回看中，文字是當時快照；回到目前輪次後可修訂。':r?.first?'本輪初判已固定；新理解請寫入觀察與修訂。':'改變操作順序，你預期哪些物質的去向會改變？可留白直接操作。';
    $('first').textContent=v?.run.first?firstText(v.run.first):'初判尚未固定；已見內容不作盲測。';
    $('ledger').innerHTML=data&&v&&attr('details','ledger').open?garlicLedger(v.run.replay,v.state):'';
    $('sources').innerHTML=data&&r&&attr('details','sources').open?garlicSources(r.replay):'';
    drawHistory();drawSummary();
  }
  function expose(name){
    if(!ready()||!REVEAL.includes(name))return;freezeFirst(`展開${PANELS[name]}前`);
    const key=`${live().id}:${name}`;
    if(!d.exposures.some(e=>e.key===key))d.exposures.push({key,runId:live().id,text:`展開${PANELS[name]}（不表示已讀）。`});
    remember(d.seen.disclosures,name);
  }
  function perform(operationId){
    if(!operable()||!GARLIC_OPERATION_IDS.includes(operationId))return;
    const r=live();if(r.actions.length>=GARLIC_MAX_ACTIONS)return;freezeFirst('第一次操作前');
    try{
      const actions=[...r.actions,operationId],next=evaluateGarlicSequence(actions,data);
      if(next.status!=='SOURCE_BOUND_REPLAY'||next.sourceIdentity!==r.sourceIdentity||sig(next.steps.slice(0,r.actions.length))!==sig(r.replay.steps))throw new Error('Replay identity or history changed');
      const step=next.steps.at(-1);r.actions=actions;r.replay=next;
      r.entries.push(copy({type:'step',id:`${r.id}:op${step.sequence}`,step,writing:r.writing,seenBefore:d.seen,focusElement:d.focusElement}));r.touched=true;
      remember(d.seen.operations,operationId);feedback=step.status==='applied'?'已保留這次操作；其餘步驟由你選擇。':'已保留這次未執行嘗試；物質與條件不變。';slot.saveStatus='';
    }catch{feedback='反應資料未通過重播核對；原盤面與紀錄保留。';data=null;loadStatus='error';$('load-status').textContent='反應未能通過核對，請重試載入。';action('retry').hidden=false;}
    draw();attr('operation',operationId)?.focus();
  }
  function sample(){
    if(!operable())return;const r=live();if(r.samples.length>=MAX_SAMPLES)return;freezeFirst('第一次保留盤面前');
    const snapshot=copy({state:r.replay.final,stepId:r.actions.length?`${r.id}:op${r.actions.length}`:`${r.id}:initial`,actionCount:r.actions.length,writing:r.writing,sourceIdentity:r.sourceIdentity,seen:d.seen,focusElement:d.focusElement});
    const last=r.entries.at(-1);
    if(last?.type==='sample'&&last.snapshotSignature===sig(snapshot)){feedback='這份相同盤面與文字已保留；沒有新增重複快照。';draw();return;}
    const entry={type:'sample',id:`${r.id}:sample${r.samples.length+1}`,number:r.samples.length+1,...snapshot,snapshotSignature:sig(snapshot)};
    r.entries.push(entry);r.samples.push(entry);r.touched=true;feedback='已保留此刻的示意快照；物質不減少，也未產生實測讀數。附加筆記後才納入 JSON。';slot.saveStatus='';draw();action('sample').focus();
  }
  function review(entryId){
    const r=d.runs.find(v=>entryId.startsWith(v.id+':'));
    if(!r||entryId!==`${r.id}:initial`&&!r.entries.some(e=>e.id===entryId))return;
    freezeFirst('回看舊證據前');remember(d.seen.histories,entryId);d.viewCursor={runId:r.id,entryId};d.historyRunId=r.id;
    const key=`view:${live().id}:${entryId}`;if(!d.exposures.some(e=>e.key===key))d.exposures.push({key,runId:live().id,text:`回看 ${entryId}；只改畫面，沒有倒退反應。`});
    const entry=r.entries.find(e=>e.id===entryId);if(entry?.focusElement)d.focusElement=entry.focusElement;
    feedback='目前為歷史快照，操作與文字暫停；回到目前輪次可繼續。';draw();
  }
  function save(){
    if(disposed||slot.pending||typeof onSaveSummary!=='function')return;const plan=appendPlan();if(!plan.text)return;
    if(plan.text.length>10000){slot.saveStatus='尚未保存：本次內容超過10,000字元；全文未截斷，可選取複製。';drawSummary();return;}
    const token={};slot.pending=token;slot.saveStatus='正在附加固定的這次內容；可繼續操作與修訂。';drawSummary();
    const finish=(ok,error)=>{if(slot.pending!==token)return;slot.pending=null;if(ok===true){d.cursor=plan.next;d.savedWritings.push(...plan.versions);slot.saveStatus='已附加這次內容；後續操作與修訂仍會另行附加。';}else slot.saveStatus=`尚未保存。${error?.message||'儲存端未明確確認成功。'} 全文與保存位置保留。`;slot.refresh?.();};
    try{const answer=onSaveSummary(plan.text);if(answer&&typeof answer.then==='function')Promise.resolve(answer).then(value=>finish(value),error=>finish(false,error));else finish(answer);}catch(error){finish(false,error);}
  }
  function sourceEvent(event,type){
    if(disposed||!root.contains(event.target)||!ready())return false;
    const a=event.target.closest('[data-gr-source]');if(!a)return false;
    if(type==='auxclick'&&event.button!==1||type==='click'&&event.button>0)return true;
    const link=garlicSourceLinks(live().replay).find(v=>v.id===a.dataset.grSource);if(!link)return true;
    freezeFirst('開啟來源前');const key=`source:${live().id}:${link.id}`;
    if(!d.exposures.some(e=>e.key===key))d.exposures.push({key,runId:live().id,text:`開啟來源 ${link.id}（不表示已讀）\n${link.url}`});
    remember(d.seen.sources,link.id);drawSummary();$('first').textContent=firstText(live().first);attr('writing','prediction').readOnly=true;return true;
  }
  function onClick(event){
    if(disposed||!root.contains(event.target)||sourceEvent(event,'click')||event.button>0)return;
    const disclosure=event.target.closest('[data-gr-disclosure]');if(disclosure&&!attr('details',disclosure.dataset.grDisclosure).open){expose(disclosure.dataset.grDisclosure);drawSummary();attr('writing','prediction').readOnly=!!live()?.first;return;}
    const b=event.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.grOperation)return perform(b.dataset.grOperation);
    if(b.dataset.grFocus&&ready()){d.focusElement=b.dataset.grFocus;draw();attr('focus',d.focusElement).focus();return;}
    if(b.dataset.grView)return review(b.dataset.grView);
    const name=b.dataset.grAction;
    if(name==='copy'){$('summary').focus();$('summary').select();$('feedback').textContent='已選取完整摘要，按 Ctrl+C 複製。';return;}
    if(name==='retry')return load();if(name==='save')return save();if(name==='sample')return sample();
    if(name==='current'){d.viewCursor=null;feedback='已回到最新盤面；沒有重播或改寫舊紀錄。';draw();return;}
    if(name==='new'&&ready()&&d.runs.length<MAX_RUNS){makeRun();for(const panel of REVEAL){attr('details',panel).open=false;d.openPanels=d.openPanels.filter(v=>v!==panel);}feedback='已開新一輪；舊輪、文字及本頁已見紀錄保留。';draw();}
  }
  function onInput(event){if(disposed||!root.contains(event.target)||!live()||d.viewCursor)return;const key=event.target.dataset.grWriting;if(!Object.hasOwn(WRITING,key))return;const r=live();if(key==='prediction'&&r.first){event.target.value=r.first.prediction;return;}r.writing[key]=String(event.target.value);r.touched=true;slot.saveStatus='';drawSummary();}
  function onChange(event){if(disposed||!root.contains(event.target)||event.target!==$('run'))return;const r=d.runs.find(v=>v.id===event.target.value);if(!r)return;review(r.actions.length?`${r.id}:op${r.actions.length}`:`${r.id}:initial`);}
  function onToggle(event){if(disposed||!root.contains(event.target))return;const name=event.target.dataset.grDetails;if(!Object.hasOwn(PANELS,name))return;d.openPanels=d.openPanels.filter(v=>v!==name);if(event.target.open){d.openPanels.push(name);expose(name);}draw();}
  async function load(){
    const token=++epoch;abort?.abort();abort=new AbortController();data=null;loadStatus='loading';action('retry').hidden=true;$('load-status').textContent='正在核對反應資料…';draw();
    try{
      const raw=await loadData(abort.signal);if(disposed||token!==epoch)return;
      const checked=validateGarlicDataset(raw);if(!checked.ok)throw new Error('Invalid garlic source');
      const initial=evaluateGarlicSequence([],raw);if(initial.status!=='SOURCE_BOUND_REPLAY'||slot.sourceIdentity&&slot.sourceIdentity!==initial.sourceIdentity)throw new Error('Source identity changed');
      slot.sourceIdentity=initial.sourceIdentity;data=copy(raw);if(!live())makeRun();loadStatus='ready';$('load-status').textContent='';for(const panel of REVEAL)if(attr('details',panel).open)expose(panel);draw();
    }catch{if(disposed||token!==epoch)return;data=null;loadStatus='error';$('load-status').textContent='來源未能載入或通過核對；目前盤面不顯示可信數值。舊文字及快照保留，可重試。';action('retry').hidden=false;draw();}
  }
  for(const node of root.querySelectorAll('[data-gr-details]'))node.open=d.openPanels.includes(node.dataset.grDetails);
  action('save').hidden=typeof onSaveSummary!=='function';const auxclick=e=>sourceEvent(e,'auxclick');
  const handlers=[['click',onClick],['input',onInput],['change',onChange],['auxclick',auxclick]];for(const [name,handler]of handlers)root.addEventListener(name,handler);root.addEventListener('toggle',onToggle,true);
  const dispose=()=>{if(disposed)return;disposed=true;epoch++;abort?.abort();for(const [name,handler]of handlers)root.removeEventListener(name,handler);root.removeEventListener('toggle',onToggle,true);if(slot.dispose===dispose){slot.dispose=null;slot.refresh=null;}if(mounts.get(root)===dispose)mounts.delete(root);};
  slot.dispose=dispose;slot.refresh=()=>{if(!disposed){drawHistory();drawSummary();}};mounts.set(root,dispose);draw();load();return dispose;
}
