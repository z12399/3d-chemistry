import {escapeHTML as esc} from './storage.js';
import {FERMENTATION_REDOX_LAB_ID,FERMENTATION_REDOX_VERSION,FERMENTATION_REDOX_DEFAULTS,FERMENTATION_REDOX_ROUTES as ROUTES,FERMENTATION_REDOX_SPECIES as SPECIES,FERMENTATION_REDOX_STEPS as STEPS,FERMENTATION_REDOX_SOURCES as SOURCES,FERMENTATION_REDOX_LIMITS as LIMITS,createRedoxState,applyRedoxStep,redoxStepAvailability,redoxReadings} from './fermentation-redox-model.js';
export {FERMENTATION_REDOX_LAB_ID} from './fermentation-redox-model.js';
const drafts=new WeakMap();let sequence=0;
const clone=value=>structuredClone(value),signature=value=>JSON.stringify(value);
const emptyWriting=()=>({choice:'',prediction:'',revision:'',limits:'',transfer:''});
const choices={continue:'糖還在，回收段就能繼續',regenerate:'還要讓 NAD⁺ 再生',unsure:'先保留判斷'};
const configKey=c=>`${c.route}/${c.glucoseUnits}/${c.nadPool}`;
const fresh=()=>({config:{route:FERMENTATION_REDOX_DEFAULTS.route,glucoseUnits:3,nadPool:2},runs:[],active:{},records:[],sources:[],seen:{actions:[],routes:[]},savedWritings:[],cursor:{started:false,firsts:[],records:0,runs:{},sources:[]}});
const configText=c=>`${ROUTES[c.route].label}；起始葡萄糖 ${c.glucoseUnits}、NAD⁺ ${c.nadPool}、NADH 0、ATP 啟動餘額 2（教學單位）`;
const stateText=s=>{const r=redoxReadings(s);return `${ROUTES[s.route].nodes.map(k=>`${SPECIES[k].name} ${s[k]}`).join('；')}；CO₂ ${s.co2}；NAD⁺ ${s.nadOx}、NADH ${s.nadRed}；ATP 餘額 ${s.atp}、淨變化 ${r.netAtp}（累計投入 ${s.investedAtp}、形成 ${s.formedAtp}）；底物／產物核心碳 ${r.carbonTotal}/${r.carbonInitial}`;};
const writingText=w=>`判斷：${choices[w.choice]||'未選'}\n理由：${w.prediction||'未填'}\n修訂：${w.revision||'未填'}\n證據限制：${w.limits||'未填'}\n有提示遷移練習：${w.transfer||'未填'}`;
const sourceText=()=>SOURCES.map(s=>`${s.title}\n${s.url}`).join('\n');
const preamble=()=>`【發酵的碳、NAD 與 ATP 帳本】${FERMENTATION_REDOX_VERSION}\n離散計量練習；單位是反應當量，沒有時間、速率或實測細胞。核心碳只含底物／產物，NAD/ATP 碳骨架不計；ADP/Pi 假定充分供應。啟動 ATP 2 是教學初值。反應段為合併步驟，沒有完整 H/O/P／電荷配平；不預測菌量、pH、食品品質或安全。兩種路徑是分開的方案。\n來源：\n${sourceText()}`;
function firstText(f){return `第 ${f.runId} 輪首次操作前（${f.trigger}）\n${configText(f.config)}\n${stateText(f.state)}\n${writingText(f.writing)}\n此前已操作步驟：${f.seen.actions.map(k=>STEPS[k].name).join('、')||'無'}；此前已操作路徑：${f.seen.routes.map(k=>ROUTES[k].short).join('、')||'無'}\n此前開啟來源：${f.sources.join('、')||'無'}（開啟不表示已讀）\n當時可見路徑方向、碳數、步驟按鈕與起始數量；不主張盲測。`;}
const eventText=e=>`步驟 ${e.seq}｜${STEPS[e.action].name}｜${e.status==='applied'?'已執行':'未執行'}：${e.message}\n之前：${stateText(e.before)}\n之後：${stateText(e.after)}`;
const recordText=(r,i)=>`觀察 ${i+1}｜第 ${r.runId} 輪，操作紀錄至 ${r.actionIndex}\n${stateText(r.state)}\n${writingText(r.writing)}`;

export function mountFermentationRedoxLab(root,id=FERMENTATION_REDOX_LAB_ID,{draftOwner,onSaveSummary}={}){
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  if(id!==FERMENTATION_REDOX_LAB_ID)throw new RangeError('Unknown fermentation redox activity');
  const owned=draftOwner&&typeof draftOwner==='object';if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,fresh());
  const d=owned?drafts.get(draftOwner):fresh(),prefix=`redox-${++sequence}`;
  const field=name=>root.querySelector(`[data-fr-${name}]`),action=name=>root.querySelector(`[data-fr-action="${name}"]`);
  let disposed=false,feedback='',saveStatus='';
  function createRun(c){if(d.runs.length>=24)return null;const state=createRedoxState(c),r={id:d.runs.length+1,config:clone(c),initial:state,state,first:null,history:[],writing:emptyWriting(),closed:false};d.runs.push(r);d.active[configKey(c)]=r.id;return r;}
  function run(){return d.runs.find(r=>r.id===d.active[configKey(d.config)])||createRun(d.config);}
  function freezeFirst(trigger){const r=run();if(!r.first)r.first=clone({runId:r.id,trigger,config:r.config,state:r.state,writing:r.writing,seen:d.seen,sources:d.sources});return r.first;}
  function syncWriting(){for(const k of ['prediction','revision','limits','transfer'])field(k).value=run().writing[k];}
  function fullText(){const used=d.runs.filter(r=>r.first||r.history.length||Object.values(r.writing).some(Boolean)||d.savedWritings.some(v=>v.runId===r.id));if(!used.length&&!d.sources.length)return '';
    return [preamble(),...used.flatMap(r=>[`第 ${r.id} 輪｜${configText(r.config)}`,r.first?firstText(r.first):'尚未執行步驟；以下是目前草稿。',...r.history.map(eventText),...d.savedWritings.filter(v=>v.runId===r.id).map((v,i)=>`第 ${r.id} 輪已保存文字 ${i+1}（${v.actionIndex} 次操作之後）\n${writingText(v.writing)}`),`目前狀態：${stateText(r.state)}\n目前文字：\n${writingText(r.writing)}`]),...d.records.map(recordText),`實際開啟來源（不代表已讀）：${d.sources.join('、')||'無'}`].join('\n\n');
  }
  function appendPlan(){const next=clone(d.cursor),parts=[],writingSnapshots=[];
    for(const r of d.runs){const previous=next.runs[r.id]||{history:0,writing:''};const written=signature(r.writing),hasWriting=Object.values(r.writing).some(Boolean);
      if(!r.first&&!r.history.length&&!hasWriting&&!next.runs[r.id])continue;
      if(!next.runs[r.id])parts.push(`第 ${r.id} 輪｜${configText(r.config)}\n初始狀態：${stateText(r.initial)}`);
      if(r.first&&!next.firsts.includes(r.id)){parts.push(firstText(r.first));next.firsts.push(r.id);}
      const events=r.history.slice(previous.history);if(events.length)parts.push(...events.map(eventText));
      if(written!==previous.writing&&(hasWriting||previous.writing)){parts.push(`第 ${r.id} 輪目前文字（${r.history.length} 次操作之後）\n${writingText(r.writing)}`);writingSnapshots.push({runId:r.id,actionIndex:r.history.length,writing:clone(r.writing)});}
      next.runs[r.id]={history:r.history.length,writing:written};
    }
    if(d.records.length>next.records)parts.push(...d.records.slice(next.records).map((r,i)=>recordText(r,next.records+i)));
    next.records=d.records.length;const addedSources=d.sources.filter(k=>!next.sources.includes(k));if(addedSources.length)parts.push(`新開啟來源（不代表已讀）：${addedSources.join('、')}`);next.sources=[...d.sources];
    if(!parts.length)return {text:'',next,writingSnapshots:[]};if(!next.started){parts.unshift(preamble());next.started=true;}return {text:parts.join('\n\n'),next,writingSnapshots};
  }
  root.innerHTML=`<section class="fermentation-redox-lab" aria-labelledby="${prefix}-title"><h2 class="fr-sr-only" id="${prefix}-title">發酵的 NAD 循環與 ATP 收支</h2>
  <div class="fr-toolbar"><div class="fr-routes" role="group" aria-label="選定發酵路徑">${Object.values(ROUTES).map(r=>`<button type="button" data-fr-route="${r.id}">${r.short}</button>`).join('')}</div><label for="${prefix}-glucose">起始糖<select id="${prefix}-glucose" data-fr-glucose>${[1,2,3,4,5].map(v=>`<option value="${v}">${v}</option>`).join('')}</select></label><label for="${prefix}-nad">NAD 池<select id="${prefix}-nad" data-fr-nad>${[1,2,4].map(v=>`<option value="${v}">${v}</option>`).join('')}</select></label><button type="button" data-fr-action="new">新一輪（保留本輪）</button></div>
  <p class="fr-scope" data-fr-scope></p><div data-fr-diagram></div><div class="fr-steps" data-fr-steps></div>
  <div class="fr-ledgers"><div class="fr-nad"><span>NAD 循環</span><strong data-fr-nad-values></strong><span data-fr-nad-total></span></div><div class="fr-atp"><span>ATP 餘額 <strong data-fr-atp></strong></span><span>淨變化 <strong data-fr-net></strong></span><small data-fr-atp-detail></small></div></div>
  <div class="fr-result-row"><p data-fr-result></p><button type="button" data-fr-action="record">記下這次觀察</button><span data-fr-count></span></div><p class="fr-feedback" role="status" data-fr-feedback></p>
  <details><summary>我的預測、依據與修訂</summary><p>先選一種判斷，也可直接操作。第一次操作或記錄前的文字、已操作路徑及開啟來源會保留。</p><div class="fr-choices" role="group" aria-label="初步判斷">${Object.entries(choices).map(([k,v])=>`<button type="button" data-fr-choice="${k}">${v}</button>`).join('')}</div><label for="${prefix}-prediction">我的理由<textarea id="${prefix}-prediction" rows="2" maxlength="800" data-fr-prediction></textarea></label><label for="${prefix}-revision">操作後的修訂<textarea id="${prefix}-revision" rows="2" maxlength="1200" data-fr-revision></textarea></label><label for="${prefix}-limits">哪些結論仍缺證據？<textarea id="${prefix}-limits" rows="2" maxlength="800" data-fr-limits></textarea></label><button type="button" data-fr-action="record-writing">記錄目前文字與狀態</button><pre data-fr-first></pre></details>
  <details><summary>換條件，沿提示推理</summary><p>把 NAD 池設成 1，仍能把 3 份葡萄糖走完嗎？比較「何時必須再生」與「末端淨 ATP」。乙醇路徑只做到脫羧時，為什麼還不夠？請指出這個帳本不能回答的真實食品問題。</p><label for="${prefix}-transfer">我的推理<textarea id="${prefix}-transfer" rows="3" maxlength="1200" data-fr-transfer></textarea></label></details>
  <details><summary>步驟、數量單位與適用範圍</summary><p>圖上的 Cₙ 只表示每份底物／產物的碳數，沒有表示原子位置或個別原子的去向。每次按鈕完成一份指定反應當量；不代表一秒或一個細胞。G3P 是甘油醛 3-磷酸。</p><ul>${Object.values(STEPS).map(s=>`<li><strong>${esc(s.name)}</strong>：${esc(s.shorthand)}。${esc(s.note)}</li>`).join('')}</ul><ul>${LIMITS.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><p>Neves 等（2002）的乳酸乳球菌研究顯示替代再生途徑與調控的複雜性；LDH 缺失使特定條件的耗糖變慢，沒有完全歸零。這裡缺 NAD⁺ 只表示所選回收段無法執行，不能推成真實細胞停止代謝。</p></details>
  <details><summary>完整來源與核對位置（8 項）</summary><ol>${SOURCES.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-fr-source="${s.id}">${esc(s.title)}</a><p>${esc(s.locator)}</p><p>${esc(s.acceptedUses.join(' '))}</p><p>${esc(s.limits.join(' '))}</p></li>`).join('')}</ol></details>
  <details><summary>已記錄的觀察（<span data-fr-total>0 / 24</span>）</summary><p>最多保留 24 份觀察、24 輪，每輪 64 次操作。滿額時不覆寫舊紀錄；請保存或複製。切換條件保留各自的進度。</p><div data-fr-records></div><div data-fr-history></div></details>
  <details><summary>保存到筆記／複製摘要</summary><p>保存只附加新操作、觀察與文字變更。完整摘要也保留；超過筆記容量或保存失敗時不截斷。</p><label for="${prefix}-append">本次要附加的內容<textarea readonly id="${prefix}-append" rows="6" data-fr-append></textarea></label><button type="button" data-fr-action="save">附加到本課筆記</button><p role="status" data-fr-save-status></p><label for="${prefix}-summary">完整摘要<textarea readonly id="${prefix}-summary" rows="8" data-fr-summary></textarea></label><button type="button" data-fr-action="copy">選取完整摘要</button></details></section>`;
  action('save').hidden=typeof onSaveSummary!=='function';run();
  function drawSummary(){if(disposed)return;const plan=appendPlan();field('summary').value=fullText();field('append').value=plan.text;action('save').disabled=!plan.text;field('save-status').textContent=saveStatus;}
  function draw(){if(disposed)return;const r=run(),s=r.state,route=ROUTES[s.route],values=redoxReadings(s);
    root.querySelectorAll('[data-fr-route]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.frRoute===s.route)));root.querySelectorAll('[data-fr-choice]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.frChoice===r.writing.choice)));
    field('glucose').value=String(d.config.glucoseUnits);field('nad').value=String(d.config.nadPool);field('scope').textContent=`離散計量 · 非細胞動力學｜${s.route==='homolactic'?'L-LDH 示例':'酵母型乙醇'} · 第 ${r.id} 輪`;
    field('diagram').innerHTML=`<ol class="fr-flow fr-flow-${route.nodes.length}" aria-label="底物與產物的碳數及目前份數">${route.nodes.map(k=>`<li><span>${esc(SPECIES[k].name)} <small>C${({1:'₁',2:'₂',3:'₃',6:'₆'})[SPECIES[k].carbon]}</small></span><strong data-fr-species="${k}">${s[k]}</strong></li>`).join('')}</ol><div class="fr-carbon"><span>底物／產物核心碳 <strong>${values.carbonInitial} → ${values.carbonTotal}</strong></span><span>${s.route==='alcoholic'?`CO₂（C₁）已釋出 ${s.co2}，仍計入本帳`:'份數 × 碳數；不含 NAD／ATP 碳骨架'}</span></div>`;
    field('steps').innerHTML=route.steps.map(k=>{const a=redoxStepAvailability(s,k);return `<div><button type="button" data-fr-step="${k}" aria-describedby="${prefix}-need-${k}">${STEPS[k].label}</button><span id="${prefix}-need-${k}">${a.possible?'可執行一份':`缺 ${a.missing.map(m=>m.name).join('、')}`}</span></div>`;}).join('');
    field('nad-values').textContent=`NAD⁺ ${s.nadOx} ⇄ NADH ${s.nadRed}`;field('nad-total').textContent=`池總數 ${values.cofactorTotal}（初始 ${s.nadPool}）`;field('atp').textContent=String(s.atp);field('net').textContent=`${values.netAtp>0?'+':''}${values.netAtp}`;field('atp-detail').textContent=`啟動 2 ＋ 形成 ${s.formedAtp} − 投入 ${s.investedAtp}`;
    field('result').textContent=values.complete?'本輪所選底物已走到末端，NAD⁺ 已回到初值。':r.history.at(-1)?.message||'先投入 ATP，再逐份回收；留意 NAD⁺ 的變化。';
    field('first').textContent=r.first?firstText(r.first):'本輪尚未操作或記錄；目前文字仍可修改。';field('count').textContent=field('total').textContent=`${d.records.length} / 24`;field('feedback').textContent=feedback;
    field('records').innerHTML=d.records.length?d.records.map((v,i)=>`<article><pre>${esc(recordText(v,i))}</pre></article>`).join(''):'<p>尚未記錄觀察。</p>';
    field('history').innerHTML=d.runs.filter(v=>v.history.length).map(v=>`<details><summary>第 ${v.id} 輪操作（${v.history.length} 次）</summary><pre>${esc(v.history.map(eventText).join('\n\n'))}</pre></details>`).join('');drawSummary();
  }
  function switchConfig(c){if(!d.active[configKey(c)]&&d.runs.length>=24){feedback='已保留 24 輪，無法再開新條件。原紀錄保持不變，請保存或複製。';draw();return;}d.config=c;run();feedback='';saveStatus='';syncWriting();draw();}
  function step(k){const r=run();if(!ROUTES[r.state.route].steps.includes(k))return;if(r.history.length>=64){feedback='本輪已保留 64 次操作；請保存、複製或另開新一輪。現有紀錄不會被覆寫。';draw();return;}const result=applyRedoxStep(r.state,k),last=r.history.at(-1);if(result.status==='blocked'&&last?.status==='blocked'&&last.action===k&&signature(last.after)===signature(r.state)){feedback='這個未執行的嘗試已保留；數量仍不變。';draw();return;}
    freezeFirst('按下第一個反應步驟');r.history.push(clone({seq:r.history.length+1,action:k,status:result.status,before:r.state,after:result.state,delta:result.delta,message:result.message}));r.state=result.state;if(!d.seen.actions.includes(k))d.seen.actions.push(k);if(!d.seen.routes.includes(r.state.route))d.seen.routes.push(r.state.route);feedback=result.status==='blocked'?'這次僅記錄未執行的嘗試；不能據此推論整個細胞停止代謝。':'';saveStatus='';draw();
  }
  function record(){const r=run();if(d.records.length>=24){feedback='已保留 24 份觀察；請保存或複製。現有紀錄不會被覆寫。';draw();return;}freezeFirst(r.history.length?'記錄觀察':'記錄初始狀態');const value=clone({version:FERMENTATION_REDOX_VERSION,runId:r.id,actionIndex:r.history.length,state:r.state,writing:r.writing,first:r.first,history:r.history});if(d.records.some(v=>signature(v)===signature(value)))feedback='這份狀態與文字已記錄。';else{d.records.push(value);feedback=`已保留第 ${d.records.length} 份觀察。`;saveStatus='';}draw();}
  function click(event){if(disposed)return;const source=event.target.closest?.('[data-fr-source]');if(source&&root.contains(source)&&SOURCES.some(s=>s.id===source.dataset.frSource)){if(!d.sources.includes(source.dataset.frSource))d.sources.push(source.dataset.frSource);saveStatus='';drawSummary();return;}const button=event.target.closest?.('button');if(!button||!root.contains(button)||button.disabled)return;
    if(Object.hasOwn(ROUTES,button.dataset.frRoute)){switchConfig({...d.config,route:button.dataset.frRoute});return;}if(Object.hasOwn(choices,button.dataset.frChoice)){run().writing.choice=button.dataset.frChoice;saveStatus='';draw();return;}if(button.dataset.frStep){step(button.dataset.frStep);return;}
    const name=button.dataset.frAction;if(name==='record'||name==='record-writing')record();else if(name==='new'){if(d.runs.length>=24)feedback='已保留 24 輪；原紀錄不變，請保存或複製。';else{const old=run();old.closed=true;createRun(d.config);feedback='已開始新一輪；上一輪的操作與文字完整保留。';saveStatus='';syncWriting();}draw();}
    else if(name==='copy'){field('summary').focus();field('summary').select();saveStatus='已選取完整摘要，按 Ctrl+C 複製。';drawSummary();}
    else if(name==='save'&&typeof onSaveSummary==='function'){const plan=appendPlan();if(!plan.text)return;let saved=false,reason='';if(plan.text.length>10000)reason='本次內容超過筆記 10,000 字上限。';else try{saved=onSaveSummary(plan.text)===true;}catch(error){reason=error?.message||String(error);}if(saved){d.cursor=plan.next;d.savedWritings.push(...plan.writingSnapshots);}if(disposed)return;saveStatus=saved?'已附加本次內容；後續只保存新增操作、觀察與文字。':`尚未保存。${reason||'儲存端未確認成功。'} 內容未截斷，保存位置未前移；請先複製保留。`;draw();}
  }
  function input(event){if(disposed)return;for(const [name,max] of [['prediction',800],['revision',1200],['limits',800],['transfer',1200]])if(event.target===field(name)){run().writing[name]=event.target.value.slice(0,max);saveStatus='';drawSummary();return;}}
  function change(event){if(disposed)return;for(const [name,key,allowed] of [['glucose','glucoseUnits',[1,2,3,4,5]],['nad','nadPool',[1,2,4]]])if(event.target===field(name)){const value=Number(event.target.value);if(allowed.includes(value))switchConfig({...d.config,[key]:value});return;}}
  syncWriting();root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',change);draw();return()=>{if(disposed)return;disposed=true;root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',change);};
}
