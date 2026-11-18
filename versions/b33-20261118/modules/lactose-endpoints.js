import {MoleculeViewer} from './viewer.js';
import {escapeHTML as esc} from './storage.js';
import {validateLactoseEndpoints,LACTOSE_ENDPOINT_FOCUS,LACTOSE_ENDPOINT_DESCRIPTION} from './lactose-endpoint-model.js';
import {validateLactoseAcidOpening,lactoseAcidLedger,LACTOSE_ACID_NAMES} from './lactose-acid-model.js';

const drafts=new WeakMap();
export function mountLactoseEndpoints(host,{draftOwner}={}){
  const fresh=()=>({mode:'endpoint',stage:0,current:'closed',focus:'reducing',acidFocus:'carrier',accountOpen:false,cameraOpen:false,labelsOpen:false,views:new Map()});
  if(draftOwner&&typeof draftOwner==='object'&&!drafts.has(draftOwner))drafts.set(draftOwner,fresh());
  const state=draftOwner&&typeof draftOwner==='object'?drafts.get(draftOwner):fresh();
  let disposed=false,epoch=0,viewer=null,neutral=null,acid=null,busy=true;
  host.innerHTML=`<section class="lactose-endpoint-studio" aria-label="完整乳糖的中性端點與酸催化教材示意">
    <div class="lactose-view-modes" role="group" aria-label="選擇乳糖觀察內容"><button type="button" data-lactose-view="endpoint" aria-pressed="true" disabled>中性端點比較</button><button type="button" data-lactose-view="acid" aria-pressed="false" disabled>三微步 · 教材酸示意</button></div><p class="lactose-endpoint-scope" id="lactose-view-boundary"></p>
    <div class="lactose-endpoint-controls"><div id="lactose-endpoint-choice-group" role="group" aria-label="選擇乳糖端點"><button type="button" data-lactose-endpoint="closed" aria-pressed="true" disabled>環狀 · 所選 β 還原端</button><button type="button" data-lactose-endpoint="open" aria-pressed="false" disabled>開鏈 · 橋完整</button></div><div role="group" aria-label="標出要看的部位"><button type="button" data-lactose-endpoint-focus="reducing" aria-pressed="true" disabled>看 Glc 還原端</button><button type="button" data-lactose-endpoint-focus="bridge" aria-pressed="false" disabled>看保留的糖苷橋</button><button type="button" data-lactose-endpoint-focus="carrier" aria-pressed="false" disabled hidden>看質子與載體水</button></div></div>
    <div id="lactose-acid-panel" hidden><label for="lactose-acid-stage">看一個代表狀態（四狀態、三次電子帳）</label><div class="lactose-acid-navigation"><button type="button" id="lactose-acid-prev" disabled>← 前一態</button><select id="lactose-acid-stage" data-lactose-acid-stage disabled>${LACTOSE_ACID_NAMES.map((name,i)=>`<option value="${i}">${i} · ${esc(name)}</option>`).join('')}</select><button type="button" id="lactose-acid-next" disabled>下一態 →</button></div><p id="lactose-acid-step" role="status"></p></div>
    <details id="lactose-camera-details" class="lactose-camera-details" ${state.cameraOpen?'open':''}><summary>旋轉與縮放</summary><div class="lactose-endpoint-camera" role="group" aria-label="乳糖代表構象視角"><button type="button" data-lactose-endpoint-camera="left" aria-label="向左旋轉乳糖代表構象" disabled>← 旋轉</button><button type="button" data-lactose-endpoint-camera="right" aria-label="向右旋轉乳糖代表構象" disabled>旋轉 →</button><button type="button" data-lactose-endpoint-camera="up" aria-label="向上旋轉乳糖代表構象" disabled>↑ 旋轉</button><button type="button" data-lactose-endpoint-camera="down" aria-label="向下旋轉乳糖代表構象" disabled>↓ 旋轉</button><button type="button" data-lactose-endpoint-camera="in" aria-label="放大乳糖代表構象" disabled>＋ 放大</button><button type="button" data-lactose-endpoint-camera="out" aria-label="縮小乳糖代表構象" disabled>－ 縮小</button><button type="button" id="lactose-endpoint-reset" disabled>完整放入畫面</button></div></details>
    <section id="lactose-observation-cue" class="lactose-observation-cue" aria-labelledby="lactose-observation-title" hidden><h3 id="lactose-observation-title"></h3><p id="lactose-observation-question"></p><p id="lactose-observation-contrast"></p></section>
    <div id="lactose-acid-comparison" role="group" aria-label="乳糖代表構象、當態電荷與電子帳對照"><div class="lactose-scene-column"><div id="lactose-endpoint-canvas" role="img" aria-label="目前所選乳糖代表構象" aria-describedby="lactose-view-boundary lactose-label-warning"></div><p id="lactose-label-warning" role="status" hidden></p><details id="lactose-label-details" class="lactose-label-details" ${state.labelsOpen?'open':''} hidden><summary>查看本組原子標籤</summary><p>這份文字列出目前選中部位的標籤，不是全模型的原子清單；引線只挪標籤，原子座標不變。</p><dl id="lactose-label-reference"></dl></details></div><article id="lactose-acid-ledger" hidden><p id="lactose-acid-current-title"></p><dl id="lactose-acid-current-charge"></dl><h3 id="lactose-acid-ledger-title"></h3><ol id="lactose-acid-arrows"></ol><p id="lactose-acid-conservation"></p><p id="lactose-acid-transition"></p><p class="lactose-endpoint-proton" id="lactose-acid-proton-endpoint">終態的氫帳：Hcat 留在 BO5，BHO1 回到 Osol；與中性端點的形式映射不同。再生的是酸物種，不是同一組質子。</p></article></div>
    <p id="lactose-endpoint-status" role="status">正在載入並核對中性端點…</p><button type="button" id="lactose-endpoint-retry" hidden>重試載入目前內容</button>
    <details id="lactose-acid-account-details" class="lactose-account-details" ${state.accountOpen?'open':''}><summary id="lactose-acid-account-summary">完整記帳與模型邊界</summary><p id="lactose-endpoint-description"></p><div id="lactose-acid-account" hidden><h3 id="lactose-acid-account-title"></h3><p id="lactose-acid-explanation"></p><p id="lactose-acid-charge"></p><div class="lactose-acid-table-wrap"><table><caption>目前狀態的三個氧 · 形式記帳</caption><thead><tr><th scope="col">氧原子</th><th scope="col">鍵級和</th><th scope="col">孤對數</th><th scope="col">形式電荷</th></tr></thead><tbody id="lactose-acid-oxygen"></tbody></table></div><p class="lactose-acid-inference">這是一般半縮醛教材機構套用到乳糖的有限三步與計算示意，不是乳糖實測路徑或完整自由箭推評分。酸也可能水解糖苷橋；選擇此路徑不表示某酸條件保證只開 B 環。載體水位置只是分開顯示，沒有建立反應碰撞構象。</p></div><p class="lactose-endpoint-scope" id="lactose-view-scope"></p><p class="lactose-endpoint-proton" id="lactose-view-proton"></p></details></section>`;
  const $=s=>host.querySelector(s),canvas=$('#lactose-endpoint-canvas'),status=$('#lactose-endpoint-status'),retry=$('#lactose-endpoint-retry');
  const endpoints=[...host.querySelectorAll('[data-lactose-endpoint]')],focuses=[...host.querySelectorAll('[data-lactose-endpoint-focus]')],camera=[...host.querySelectorAll('[data-lactose-endpoint-camera]')],modes=[...host.querySelectorAll('[data-lactose-view]')];
  const reset=$('#lactose-endpoint-reset'),stage=$('#lactose-acid-stage'),prev=$('#lactose-acid-prev'),next=$('#lactose-acid-next');
  const accountDetails=$('#lactose-acid-account-details');
  accountDetails.ontoggle=()=>{if(!disposed)state.accountOpen=accountDetails.open;};
  const cameraDetails=$('#lactose-camera-details'),labelDetails=$('#lactose-label-details');
  cameraDetails.ontoggle=()=>{if(!disposed)state.cameraOpen=cameraDetails.open;};
  labelDetails.ontoggle=()=>{if(!disposed)state.labelsOpen=labelDetails.open;};
  const controls=[...endpoints,...focuses,...camera,reset,stage,prev,next];
  const viewKey=()=>state.mode==='acid'?'acid-'+state.stage:state.current;
  function rememberView(){if(viewer&&!canvas.hidden)state.views.set(viewKey(),viewer.cameraState());}
  function sync(){
    const isAcid=state.mode==='acid',activeFocus=isAcid?state.acidFocus:state.focus;
    const loaded=!busy&&!!neutral&&(!isAcid||!!acid);
    $('#lactose-observation-cue').hidden=!loaded;labelDetails.hidden=!loaded;
    if(!loaded){$('#lactose-label-reference').innerHTML='';$('#lactose-label-warning').hidden=true;$('#lactose-label-warning').textContent='';canvas.setAttribute('data-label-crowded','');canvas.setAttribute('data-label-hidden','');}
    $('#lactose-acid-comparison').setAttribute('data-mode',state.mode);
    modes.forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.lactoseView===state.mode));b.disabled=!neutral;});
    endpoints.forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.lactoseEndpoint===state.current));b.disabled=busy||isAcid;});
    focuses.forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.lactoseEndpointFocus===activeFocus));b.disabled=busy||(!isAcid&&b.dataset.lactoseEndpointFocus==='carrier');if(b.dataset.lactoseEndpointFocus==='carrier')b.hidden=!isAcid;});
    [...camera,reset,stage,prev,next].forEach(b=>b.disabled=busy);
    $('#lactose-endpoint-choice-group').hidden=isAcid;$('#lactose-acid-panel').hidden=!isAcid;$('#lactose-acid-ledger').hidden=!isAcid||!acid||busy;$('#lactose-acid-account').hidden=!isAcid||!acid||busy;
    $('#lactose-acid-account-summary').textContent=isAcid?'展開完整電子帳與模型邊界':'展開端點說明與模型邊界';
    $('#lactose-view-boundary').textContent=isAcid?'教材推論與計算示意，非實驗軌跡；酸也可能水解糖苷橋。氫全數入帳，圖只顯示選中的氫。':'中性端點的計算示意，非實驗軌跡；Gal β 糖苷橋保留，所選環狀 Glc 還原端為 β。氫全數入帳，圖只顯示選中的氫。';
    if(!isAcid||!acid||busy){$('#lactose-acid-current-charge').innerHTML='';$('#lactose-acid-current-title').textContent='';}
    stage.value=String(state.stage);prev.setAttribute('aria-disabled',String(state.stage===0));next.setAttribute('aria-disabled',String(state.stage===3));
    $('#lactose-view-scope').textContent=isAcid?'四個獨立代表狀態、三組電子對帳；每態 49 原子、總電荷 +1。兩個片段各自計算並分開展示，切換沒有座標插值，也不是實驗反應軌跡。原子帳包含全部氫；畫面只顯示目前標出的氫。':'兩個中性端點都保留全部 45 個原子、糖苷橋與九個非反應部位的空間配置。這是獨立代表構象；切換不插值，也不是酸反應的實驗軌跡。原子帳包含全部氫；畫面只顯示目前標出的氫。';
    $('#lactose-view-proton').textContent=isAcid?'本示意讓 Hcat 留在 BO5，而 BHO1 回到 Osol 再生 H₃O⁺；再生的是酸物種，不是原來同一組質子。中性端點的 BO5–BHO1 是另一種形式原子帳：重原子端點相同，不能把兩種氫 ID 當成同一條實測接力。':'BHO1 由 BO1 改掛 BO5 只表示中性端點的原子收支；水中質子可經溶劑接力或交換，這不表示同一顆質子直接跳過去。淨耗水 0，不等於水沒有參與。';
    if(!isAcid){$('#lactose-endpoint-description').textContent=LACTOSE_ENDPOINT_DESCRIPTION[state.current];canvas.setAttribute('aria-label',(state.current==='closed'?'所選 β 環狀乳糖':'保留糖苷橋的開鏈乳糖')+'，標示'+(state.focus==='reducing'?'Glc 還原端':'糖苷橋'));return;}
    $('#lactose-acid-step').textContent='狀態 '+state.stage+' / 3 · '+LACTOSE_ACID_NAMES[state.stage];
    if(!acid||busy){$('#lactose-endpoint-description').textContent='酸示意尚未載入；中性端點仍可切回查看。';return;}
    $('#lactose-endpoint-description').textContent=acid.states[state.stage].name+'。糖苷橋 AC1–BO4–BC4 保留；只有指定 B 還原端與載體質子帳改變。';
    const ledger=lactoseAcidLedger(acid,state.stage);$('#lactose-acid-account-title').textContent=ledger.title;
    $('#lactose-acid-ledger-title').textContent=state.stage===3?'上一組 2 → 3 · 已完成':'本組電子帳 '+state.stage+' → '+(state.stage+1);
    $('#lactose-acid-current-title').textContent='當態 '+state.stage+' · 氧的形式電荷';
    $('#lactose-acid-current-charge').innerHTML=ledger.rows.map(row=>`<div data-lactose-current-charge="${esc(row.atomId)}"><dt>${esc(row.atomId)}</dt><dd>${row.formalCharge?'+'+row.formalCharge:'0'}</dd></div>`).join('');
    $('#lactose-acid-conservation').textContent='全系統 49 原子 · 總電荷 +'+ledger.totalCharge+' · '+ledger.totalValenceElectrons+' 價電子';
    $('#lactose-acid-transition').textContent=state.stage===3?'此處回顧上一組 2 → 3；畫面與電荷行顯示終態 3。':'兩支箭同時作用於當態 '+state.stage+'，指定下一態 '+(state.stage+1)+'；電荷行顯示當態 '+state.stage+'。';
    $('#lactose-acid-arrows').innerHTML=ledger.arrows.map(([source,target])=>`<li data-lactose-acid-arrow="${esc(source+':'+target)}">${esc(source.includes('-')?source.replaceAll('-','–')+' 的鍵電子':source+' 的孤對電子')} → ${esc(target)}</li>`).join('');
    $('#lactose-acid-explanation').textContent=ledger.explanation;
    $('#lactose-acid-charge').textContent='目前整個記帳系統：C₁₂H₂₅O₁₂⁺，總形式電荷 +'+ledger.totalCharge+'，'+ledger.totalValenceElectrons+' 個價電子。'+(state.stage===3?'上一組兩支箭頭以同一初始電子池核對，與目前終態相符。':'兩支箭頭以同一初始電子池核對，與指定下一態相符。');
    $('#lactose-acid-oxygen').innerHTML=ledger.rows.map(row=>`<tr data-lactose-acid-oxygen="${esc(row.atomId)}"><th scope="row">${esc(row.atomId)}</th><td>${row.bondOrderSum}</td><td>${row.nonbondingElectrons/2}</td><td>${row.formalCharge?'+'+row.formalCharge:'0'}</td></tr>`).join('');
    canvas.setAttribute('aria-label','教材酸示意狀態 '+state.stage+'，'+acid.states[state.stage].name);
  }
  function currentSelection(){
    return state.mode==='acid'?(state.acidFocus==='bridge'?['AC1','BO4','BC4']:state.acidFocus==='carrier'?['BO5','BO1','BC1','Osol','Hcat','Hsa','Hsb','BHO1']:['BC1','BC2','BC5','BO1','BO5','BHC1','Hcat','BHO1','Osol']):[...LACTOSE_ENDPOINT_FOCUS[state.focus]];
  }
  function updateReading(model,selected){
    const isAcid=state.mode==='acid',open=isAcid?state.stage>=2:state.current==='open';
    const cue=isAcid?[
      ['先看 BO5 如何接收 Hcat','目前 Hcat 還接 Osol；本組兩支箭如何讓 BO5 接到它？','當態 0 的正電在 Osol。0 → 1：BO5 的孤對取 Hcat，Osol–Hcat 的鍵電子回到 Osol。'],
      ['看還原端如何開環','BC1–BO5 斷開時，哪個氧用孤對形成 BC1=BO1？','當態 1 的正電在 BO5。1 → 2：BO1 成 C=O 與環鍵裂解同步，AC1–BO4–BC4 橋保留。'],
      ['看質子如何回到載體','目前 BO1 還帶 BHO1；哪個氧接受它後再生酸？','當態 2 的正電在 BO1。2 → 3：Osol 接受 BHO1，BO1–BHO1 的鍵電子回 BO1，留下中性 C=O。'],
      ['核對終態，不再前推','重原子是否與中性開鏈端點相同？BO5 與 Osol 上的追蹤氫又是誰？','當態 3 的正電在 Osol；上一組 2 → 3 已完成。BO5 留 Hcat、BHO1 回 Osol：酸物種再生，質子組不同。']
    ][state.stage]:open?['先找開鏈的 BC1','BC1 是否已成羰基？糖苷橋哪兩條鍵仍在？','此中性端點有 BC1=BO1，BC1 沒有 α／β；AC1–BO4 與 BO4–BC4 仍連著同一個乳糖。']:['先找環狀的 BC1','BC1 還接 BO5，還是已形成 BC1=BO1？','此所選 β 還原端的 BC1–BO5 仍閉環。切到開鏈時核對這條環鍵，同時保留 AC1–BO4–BC4 橋。'];
    $('#lactose-observation-title').textContent=cue[0];$('#lactose-observation-question').textContent=cue[1];$('#lactose-observation-contrast').textContent=cue[2];
    const identity={BC1:open?'Glc 還原端的羰基碳':'Glc 還原端的環狀 C1',BC2:'Glc 的 C2',BC5:'Glc 原環側的 C5',BO1:open?(isAcid&&state.stage===2?'還原端的質子化羰基氧':'還原端的羰基氧'):'還原端的羥基氧',BO5:open?'原環氧形成的羥基氧':'Glc 的環氧',AC1:'Gal 參與糖苷橋的 C1',BO4:'糖苷橋氧',BC4:'Glc 連接糖苷橋的 C4',Osol:'最小酸／水載體的氧',BHC1:'還原端 C1 上的氫',BHO1:'原先 BO1 上的追蹤氫',Hcat:'初始酸上的追蹤氫',Hsa:'載體氧上的另一個追蹤氫',Hsb:'載體氧上的另一個追蹤氫'};
    const atoms=new Map(model.atoms.map(atom=>[atom.id,atom]));
    $('#lactose-label-reference').innerHTML=selected.map(id=>{
      const atom=atoms.get(id),charge=atom.formalCharge??atom.charge??0;
      const attached=atom.element==='H'?model.bonds.filter(b=>b.a===id||b.b===id).map(b=>b.a===id?b.b:b.a).join('、'):'';
      return `<div data-lactose-label-id="${esc(id)}"><dt>${esc(id)}</dt><dd>${esc(identity[id]||'此部位的原子')} · ${esc({C:'碳',O:'氧',H:'氫'}[atom.element]||atom.element)} (${esc(atom.element)}) · 形式電荷 ${charge>0?'+'+charge:charge}${attached?'；本態接 '+esc(attached):''}</dd></div>`;
    }).join('');
  }
  function onLabelLayout(layout){
    if(disposed||busy||!viewer||canvas.hidden)return;
    const model=state.mode==='acid'?acid?.states[state.stage]:neutral?.[state.current];
    if(layout.moleculeId!==model?.id)return;
    const selected=new Set(currentSelection()),crowded=layout.crowdedIds.filter(id=>selected.has(id)),hidden=layout.hiddenIds.filter(id=>selected.has(id));
    canvas.setAttribute('data-label-crowded',crowded.join(' '));canvas.setAttribute('data-label-hidden',hidden.join(' '));
    const warning=$('#lactose-label-warning');warning.hidden=!crowded.length&&!hidden.length;
    const message=warning.hidden?'':'此視角有標籤'+(crowded.length?'擁擠（'+crowded.join('、')+'）':'')+(crowded.length&&hidden.length?'，':'')+(hidden.length?'超出畫面或未顯示（'+hidden.join('、')+'）':'')+'。可展開「旋轉與縮放」調整，或查看下方本組原子標籤文字對照。';
    if(warning.textContent!==message)warning.textContent=message;
  }
  function draw({fit=false}={}){
    canvas.hidden=false;sync();viewer.resize();viewer.showH=false;viewer.showLabels=true;viewer.labelsOnlySelected=true;
    const model=state.mode==='acid'?acid.states[state.stage]:neutral[state.current],selected=currentSelection();
    $('#lactose-label-warning').hidden=true;$('#lactose-label-warning').textContent='';canvas.setAttribute('data-label-crowded','');canvas.setAttribute('data-label-hidden','');
    viewer.setMolecule(model,{fit,selected,arrows:[],changes:[]});updateReading(model,selected);
  }
  function restoreView(){const view=state.views.get(viewKey());if(view&&!viewer.restoreCameraState(view))viewer.fit();}
  function ready(){busy=false;retry.hidden=true;draw({fit:true});restoreView();status.textContent=state.mode==='acid'?'四個代表狀態與三組電子帳已通過核對。':'中性端點已載入並通過核對；可切換與旋轉。';}
  function loadAcid(){
    if(disposed||!neutral||!viewer)return;
    const run=++epoch;busy=true;canvas.hidden=true;retry.hidden=true;status.textContent='正在載入並核對酸示意的電子與代表狀態…';sync();
    fetch(new URL('../data/lactose-acid-opening-models.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('資料未載入');return r.json();}).then(data=>{if(disposed||run!==epoch||state.mode!=='acid')return;acid=validateLactoseAcidOpening(data,neutral);ready();}).catch(()=>{if(disposed||run!==epoch)return;busy=true;retry.hidden=false;status.textContent='酸示意尚未載入或核對完成。可重試，或切回已載入的中性端點。';sync();});
  }
  function loadNeutral(){
    if(disposed)return;
    const run=++epoch;busy=true;retry.hidden=true;status.textContent='正在載入並核對中性端點…';sync();viewer?.dispose();viewer=null;neutral=null;canvas.replaceChildren();
    fetch(new URL('../data/lactose-reducing-end-molecules.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('資料未載入');return r.json();}).then(data=>{
      if(disposed||run!==epoch)return;neutral=validateLactoseEndpoints(data);viewer=new MoleculeViewer(canvas,{onLabelLayout});viewer.resize();if(state.mode==='acid')loadAcid();else ready();
    }).catch(()=>{if(disposed||run!==epoch)return;viewer?.dispose();viewer=null;neutral=null;canvas.replaceChildren();retry.hidden=false;status.textContent='端點資料或 3D 顯示尚未完成。仍可用上方連接圖作答；可重試載入。';sync();});
  }
  for(const button of modes)button.onclick=()=>{if(disposed||button.disabled||button.dataset.lactoseView===state.mode)return;rememberView();state.mode=button.dataset.lactoseView;epoch++;retry.hidden=true;if(state.mode==='acid'&&!acid)loadAcid();else ready();};
  for(const button of endpoints)button.onclick=()=>{if(disposed||busy||state.mode!=='endpoint'||button.disabled||button.dataset.lactoseEndpoint===state.current)return;rememberView();state.current=button.dataset.lactoseEndpoint;draw({fit:true});restoreView();};
  for(const button of focuses)button.onclick=()=>{if(disposed||busy||button.disabled||button.hidden)return;rememberView();if(state.mode==='acid')state.acidFocus=button.dataset.lactoseEndpointFocus;else state.focus=button.dataset.lactoseEndpointFocus;draw();};
  function setStage(value){if(disposed||busy||state.mode!=='acid'||!Number.isInteger(value)||value<0||value>3||value===state.stage)return;rememberView();state.stage=value;draw({fit:true});restoreView();}
  stage.onchange=()=>setStage(Number(stage.value));prev.onclick=()=>setStage(state.stage-1);next.onclick=()=>setStage(state.stage+1);
  for(const button of camera)button.onclick=()=>{if(disposed||busy||!viewer||button.disabled)return;const a=button.dataset.lactoseEndpointCamera;if(a==='in'||a==='out')viewer.zoomView(a==='in'?.8:1.25);else viewer.orbitView(a==='left'?.22:a==='right'?-.22:0,a==='up'?.22:a==='down'?-.22:0);};
  reset.onclick=()=>{if(disposed||busy||!viewer||reset.disabled)return;viewer.resize();viewer.fit();rememberView();};
  retry.onclick=()=>{if(disposed)return;if(!neutral||!viewer)loadNeutral();else if(state.mode==='acid')loadAcid();else ready();};sync();loadNeutral();
  return ()=>{if(disposed)return;rememberView();disposed=true;epoch++;viewer?.dispose();viewer=null;for(const button of controls.concat(modes))button.onclick=null;stage.onchange=null;retry.onclick=null;accountDetails.ontoggle=null;cameraDetails.ontoggle=null;labelDetails.ontoggle=null;};
}
