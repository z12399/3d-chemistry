import {escapeHTML as esc} from './storage.js';
import {HEAT_PENETRATION_ID, DEFAULT_HEAT_PARAMETERS, HEAT_PENETRATION_SOURCES, createHeatExperiment} from './heat-penetration-model.js';
export {HEAT_PENETRATION_ID} from './heat-penetration-model.js';

let instance = 0;
const steps = {profile:'看熱進入',scale:'厚度對照',effect:'累積作用'};
const questions = {
  profile:'目前邊界下，表面會立刻等於介質溫度嗎？',
  scale:'厚度加倍後，中心達到同一升溫比例，需要多久？',
  effect:'中心與表面的作用量，可以代表整片食品嗎？',
};
const choices = {
  profile:{lag:'不會，表面也要逐漸升溫',instant:'會，表面立即等於設定值',uniform:'會，而且整片同時跳到設定值'},
  scale:{four:'這組對照的達標時間為 4 倍',depends:'變慢，但不必恰好是 4 倍',same:'厚度不影響達標時間'},
  effect:{local:'只代表指定位置與假想響應',average:'可當作整片平均品質',safe:'可以保證實際製程安全'},
};
const fields = [
  {key:'thicknessMm',label:'全厚度 2L',unit:'mm',min:10,max:40,step:1,type:'range'},
  {key:'hWm2K',label:'表面對流 h',unit:'W/(m²·K)',min:10,max:500,step:5,type:'range'},
  {key:'conductivityWmK',label:'導熱係數 k',unit:'W/(m·K)',min:.2,max:.8,type:'text'},
  {key:'volumetricHeatCapacity',label:'體積熱容量 ρcp',unit:'J/(m³·K)',min:2000000,max:4000000,type:'text'},
  {key:'initialC',label:'初始溫度 Ti',unit:'°C',min:0,max:40,type:'text'},
  {key:'mediumC',label:'加熱介質 T∞',unit:'°C',min:60,max:100,type:'text'},
];
const fmt = value => typeof value !== 'number' || !Number.isFinite(value) ? '—' : value !== 0 && (Math.abs(value)<.0001 || Math.abs(value)>=1e7) ? value.toExponential(3) : value.toLocaleString('en-US',{maximumSignificantDigits:5});
const numeric = value => typeof value==='string' && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()) && Number.isFinite(Number(value)) ? Number(value) : null;
const freshAnswer = () => ({choice:'',checked:false,reference:false,referenceSeen:false});
const drafts = new WeakMap();
const detailKeys = ['prediction','parameters','model','notes'];
const detailLabels = {prediction:'預測與推算式',parameters:'材料與邊界條件',model:'模型完整數值與來源',notes:'完整摘要（含厚度達標時間與倍率）'};
const immutable = value => {if(value&&typeof value==='object'){Object.values(value).forEach(immutable);Object.freeze(value);}return value;};
function draftFor(owner,key,startStep) {
  const create=()=>({inputs:Object.fromEntries(fields.map(field=>[field.key,String(DEFAULT_HEAT_PARAMETERS[field.key])])),answers:Object.fromEntries(Object.keys(steps).map(key=>[key,freshAnswer()])),
    boundary:DEFAULT_HEAT_PARAMETERS.boundary,step:startStep,view:'profile',comparison:'same-h',minutes:0,furthest:0,notice:'',writing:'',
    open:Object.fromEntries(detailKeys.map(key=>[key,false])),seenDetails:new Set(),displays:new Map(),feedbackSeen:new Set(),
    first:{},records:[],review:'',cursor:0,savedFirst:new Set(),savedSignature:null,savedVersions:[],saving:false,status:'',views:new Set()});
  if(!owner||(typeof owner!=='object'&&typeof owner!=='function'))return create();
  let entries=drafts.get(owner);if(!entries){entries=new Map();drafts.set(owner,entries);}
  if(!entries.has(key))entries.set(key,create());return entries.get(key);
}
const answerMark = (answer,labels) => `${answer.choice?`自己的選擇：${labels[answer.choice]}（${answer.checked?'已核對':'未核對'}）`:'尚未自行作答'}${answer.referenceSeen?'；曾看參考':''}`;
const positions = Array.from({length:41},(_,i)=>(i-20)/20);

/** Hypothetical model results; page-session drafts stay here, persistent notes stay with the host. */
export function mountHeatPenetrationLab(container,id=HEAT_PENETRATION_ID,{startStep='profile',draftOwner,draftKey=HEAT_PENETRATION_ID,onSaveSummary,reviewHref='#process/review'}={}) {
  if (!container || typeof container.querySelector!=='function' || typeof container.addEventListener!=='function') throw new TypeError('A DOM container is required');
  if (id!==HEAT_PENETRATION_ID) throw new RangeError('Unknown heat-penetration activity');
  if (!Object.hasOwn(steps,startStep)) throw new RangeError('Unknown heat-penetration starting step');
  if (typeof reviewHref!=='string' || !/^#[a-z][a-z0-9/-]*$/i.test(reviewHref)) throw new TypeError('A local review route is required');
  const prefix=`heat-penetration-${++instance}`, $=selector=>container.querySelector(selector);
  const state=draftFor(draftOwner,draftKey,startStep),inputs=state.inputs,answers=state.answers;
  let {boundary,step,view,comparison,minutes,furthest,notice}=state;
  let disposed=false,historyVersion='';
  let experiment=null,second=null,baseHistory=[],secondHistory=[],parameterError='',invalidFields=new Set();
  const fieldHTML = field => `<label for="${prefix}-${field.key}" class="hp-field"><span>${field.label}<output data-hp-reading="${field.key}"></output></span><input id="${prefix}-${field.key}" data-hp-control="${field.key}" type="${field.type}" ${field.type==='range'?`min="${field.min}" max="${field.max}" step="${field.step}"`:'inputmode="decimal" autocomplete="off"'} aria-describedby="${prefix}-input-error"><small>${field.type==='text'?`${fmt(field.min)}–${fmt(field.max)} `:''}${field.unit}</small></label>`;
  const choiceHTML = key => `<div class="hp-choices" role="group" aria-label="${esc(questions[key])}">${Object.entries(choices[key]).map(([value,label])=>`<button type="button" data-hp-choice="${value}" data-hp-group="${key}" aria-pressed="false">${esc(label)}</button>`).join('')}</div>`;
  container.innerHTML=`<section class="heat-penetration-lab" aria-labelledby="${prefix}-title"><header><p class="hp-kicker">常物性教學模型 · 非食品實測</p><h2 class="hp-visually-hidden" id="${prefix}-title">熱穿透工作台</h2></header>
    <nav class="hp-steps" aria-label="熱穿透工作台步驟">${Object.entries(steps).map(([key,label],i)=>`<button type="button" data-hp-step="${key}" aria-pressed="false">${i+1} · ${label}</button>`).join('')}</nav>
    <h3 data-hp-heading tabindex="-1"></h3><p class="hp-note" data-hp-reading-guide></p>
    <p class="hp-error" id="${prefix}-input-error" data-hp-error role="status"></p><p class="hp-note" data-hp-notice role="status"></p>
    <div class="hp-workspace"><div class="hp-plot-column">
    <div class="hp-chart-tools"><div class="hp-view-switch" data-hp-view-switch role="group" aria-label="圖面"><button type="button" data-hp-view="profile" aria-pressed="true">目前剖面</button><button type="button" data-hp-view="history" aria-pressed="false">三點歷程</button></div><span class="hp-time" data-hp-time></span></div>
    <div class="hp-chart" data-hp-chart></div><p class="hp-chart-caption" data-hp-caption></p>
    <section data-hp-panel="scale"><div class="hp-scale-result" data-hp-scale-result></div><p class="hp-note">比較目標：中心完成 80% 升溫，(Tc − Ti)/(T∞ − Ti) = 0.8；不是安全門檻。</p></section>
    <section data-hp-panel="effect"><div class="hp-table-wrap"><table class="hp-effect-table"><caption>目前時刻 · 同一局部溫度的兩種假想響應</caption><thead><tr><th scope="col">位置</th><th scope="col">Fref · min</th><th scope="col">品質量 A/A₀</th></tr></thead><tbody><tr><th scope="row">中心</th><td data-hp-effect="center-f"></td><td data-hp-effect="center-quality"></td></tr><tr><th scope="row">表面</th><td data-hp-effect="surface-f"></td><td data-hp-effect="surface-quality"></td></tr></tbody></table></div><p class="hp-note">保留比例屬於指定位置的一級損失模型，不能當作整片平均或感官分數。</p></section>
    </div><div class="hp-control-column">
    <dl class="hp-readings"><div><dt data-hp-label="one">介質</dt><dd data-hp-value="one"></dd></div><div><dt data-hp-label="two">表面</dt><dd data-hp-value="two"></dd></div><div><dt data-hp-label="three">中心</dt><dd data-hp-value="three"></dd></div></dl>
    <div class="hp-main-fields">${fields.slice(0,2).map(fieldHTML).join('')}</div>
    <div class="hp-time-control"><label for="${prefix}-time">查看時刻<input id="${prefix}-time" data-hp-control="time" type="range" min="0" max="60" step="0.1" value="0"></label><div class="hp-time-actions"><button type="button" class="hp-primary" data-hp-action="advance">前進 1 min</button><button type="button" data-hp-action="restart">回到起點</button></div></div>
<p class="hp-note" data-hp-conditions></p>
    <section data-hp-panel="scale"><label class="hp-select-label" for="${prefix}-comparison">加倍厚度時，保留什麼？<select id="${prefix}-comparison" data-hp-control="comparison"><option value="same-h">同 h：相同外側對流</option><option value="same-bi">同 Bi：B 的 h 減半</option></select></label><p class="hp-note" data-hp-comparison-note></p></section>
    </div></div>
    <p class="hp-observation" data-hp-observation></p><div class="hp-record-actions"><button type="button" data-hp-action="record">記下觀察</button><span data-hp-record-count></span></div>
    <details class="hp-details hp-prediction-details" data-hp-details="prediction"><summary>預測、核對與推算式</summary><div class="hp-detail-body">
    <section data-hp-panel="profile">${choiceHTML('profile')}</section>
    <section data-hp-panel="scale">${choiceHTML('scale')}</section>
    <section data-hp-panel="effect">${choiceHTML('effect')}</section>
    <div class="hp-actions"><button type="button" class="hp-primary" data-hp-action="check" disabled>核對我的預測</button><button type="button" class="hp-text" data-hp-action="reference">看參考</button></div><p class="hp-feedback" data-hp-feedback role="status"></p>
    <div class="hp-equation"><p data-hp-equation></p><small data-hp-equation-note></small></div>
    </div></details>
    <nav class="hp-navigation" aria-label="前後步驟"><button type="button" data-hp-action="previous">上一步</button><button type="button" class="hp-primary" data-hp-action="next">下一步</button></nav>
    <details class="hp-details" data-hp-details="parameters"><summary>改變材料與邊界條件</summary><div class="hp-detail-body"><p class="hp-note">這些都是可改的假想常物性；改條件會從 t = 0 重新推算。</p><label class="hp-select-label" for="${prefix}-boundary">表面邊界<select id="${prefix}-boundary" data-hp-control="boundary"><option value="convective">有限對流：表面溫度由模型求出</option><option value="fixed-surface">固定表面：直接指定 Ts = T∞</option></select></label><div class="hp-advanced-fields">${fields.slice(2).map(fieldHTML).join('')}</div><p class="hp-note" data-hp-derived></p><button type="button" data-hp-action="reset">還原教學參數</button></div></details>
    <details class="hp-details" data-hp-details="model"><summary>模型假設、完整數值與來源</summary><div class="hp-detail-body"><p class="hp-scope">一維對稱平板；不是實際製程或安全保證。</p><p>兩側對稱受熱，初始溫度均一，物性與加熱介質保持固定；不含相變、內部流動、容器熱阻或溫度依賴物性。圖是厚度方向的溫度分布，不是 3D 食品影像。</p><p>全厚度為 2L；計算座標由中心 x = 0 到表面 x = L，完整剖面由對稱鏡射。中心的較低溫只屬於本次理想導熱模型，不推廣為所有食品的冷點。</p><p data-hp-method></p><div data-hp-details-values></div><ul class="hp-sources">${HEAT_PENETRATION_SOURCES.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></li>`).join('')}</ul></div></details>
    <details class="hp-details" data-hp-details="notes"><summary>保留本次推算</summary><div class="hp-detail-body"><p class="hp-note">同一頁內離開再回來可接續。重載前請附加到筆記並匯出；目前模型結果進入即顯示，首次保留不代表盲測或已掌握。</p><label class="hp-select-label">目前文字／修訂（可留空）<textarea data-hp-writing rows="3" placeholder="記下條件、比較與判斷界線。"></textarea></label><label class="hp-select-label">回看保留內容<select data-hp-review></select></label><pre data-hp-review-text></pre><label class="hp-select-label" for="${prefix}-summary">完整目前摘要（含所有步驟計算）<textarea id="${prefix}-summary" data-hp-summary readonly></textarea></label><label class="hp-select-label">本次將附加的新增內容<textarea data-hp-append readonly rows="6"></textarea></label><div class="hp-actions"><button type="button" data-hp-action="select-summary">選取摘要文字</button>${typeof onSaveSummary==='function'?'<button type="button" class="hp-primary" data-hp-action="save-summary">附加到本課筆記</button>':''}</div><p class="hp-feedback" data-hp-save-status role="status"></p><a href="${esc(reviewHref)}">到我的複習查看筆記 →</a></div></details>
  </section>`;

  function syncDraft() {Object.assign(state,{boundary,step,view,comparison,minutes,furthest,notice});}
  function syncPanels() {
    for(const key of detailKeys){const panel=$('[data-hp-details="'+key+'"]');if(!panel)continue;state.open[key]=panel.open;if(panel.open)state.seenDetails.add(key);}
  }
  function markExposure(calc) {
    if(calc){
      const graph=step==='profile'?view:'history',key=JSON.stringify([inputs,boundary,comparison,step,graph]);
      let item=state.displays.get(key);
      if(!item){item={step,view:graph,inputs:{...inputs},boundary,comparison,min:minutes,max:minutes};state.displays.set(key,item);}
      item.min=Math.min(item.min,minutes);item.max=Math.max(item.max,minutes);
      if(answers[step].checked)state.feedbackSeen.add(step);
    }
  }
  function exposureText(displays,details,feedback) {
    const labels=displays.map(item=>steps[item.step]+'/'+(item.view==='profile'?'剖面':'歷程')+'：t='+fmt(item.min)+(item.max!==item.min?'–'+fmt(item.max):'')+' min，2L='+item.inputs.thicknessMm+' mm，h='+item.inputs.hWm2K+'，k='+item.inputs.conductivityWmK+'，ρcp='+item.inputs.volumetricHeatCapacity+'，Ti='+item.inputs.initialC+'，T∞='+item.inputs.mediumC+'，'+item.boundary+'/'+item.comparison);
    return ['資料暴露：進入即顯示目前模型圖與讀值；首次保留不代表未見數值或盲測。厚度對照進入即顯示達標時間與倍率。',
      '曾查看條件與游標範圍：'+(labels.join('；')||'尚無有效模型結果')+'。範圍僅記最小／最大已查看游標；歷程圖每次顯示 0 到當下的曲線，不代表逐刻操作或獨立預測。',
      '曾展開：'+(details.map(key=>detailLabels[key]).join('、')||'尚無')+'；曾核對並顯示解釋：'+(feedback.map(key=>steps[key]).join('、')||'尚無')+'。主動查看參考另由各步驟標記；未按參考不代表未見答案。'].join('\n');
  }
  function snapshot(calc=calculate()) {
    syncPanels();syncDraft();
    const displays=[...state.displays.values()].map(item=>({...item,inputs:{...item.inputs}})),details=[...state.seenDetails],feedback=[...state.feedbackSeen];
    const writing=state.writing;
    return {inputs:{...inputs},boundary,step,view,comparison,minutes,furthest,answers:Object.fromEntries(Object.entries(answers).map(([key,value])=>[key,{...value}])),writing,displays,details,feedback,
      text:summary(calc).split('\n').filter(line=>!line.startsWith('來源：')).concat(['目前文字／修訂：'+(writing||'未填寫'),exposureText(displays,details,feedback)]).join('\n')};
  }
  function captureFirst(reason,force=false) {
    if(state.first[step]||(!force&&!answers[step].choice&&!state.writing))return;
    const current=snapshot();state.first[step]=immutable({reason,snapshot:current,signature:JSON.stringify(current)});
  }
  function pending(current=snapshot()) {
    const signature=JSON.stringify(current),firstKeys=Object.keys(state.first).filter(key=>!state.savedFirst.has(key));
    const items=state.records.slice(state.cursor),parts=firstKeys.map(key=>'首次保留 · '+steps[key]+'（'+state.first[key].reason+'）\n'+state.first[key].snapshot.text);
    parts.push(...items.map(item=>'觀察 '+item.sequence+'\n'+item.snapshot.text));
    if(signature!==state.savedSignature&&items.at(-1)?.signature!==signature&&!firstKeys.some(key=>state.first[key].signature===signature))parts.push('保存時的目前狀態\n'+current.text);
    const text=parts.length?['【熱穿透工作台｜新增保留內容】',...parts,...(!state.savedVersions.length?HEAT_PENETRATION_SOURCES.map(source=>'來源：'+source.url):[])].join('\n\n'):'';
    return {text,cursor:state.records.length,firstKeys,signature};
  }
  function drawJournal(calc=calculate()) {
    if(disposed)return;
    const current=snapshot(calc),next=pending(current),writing=$('[data-hp-writing]');
    if(writing.value!==state.writing)writing.value=state.writing;
    $('[data-hp-summary]').value=current.text+'\n'+HEAT_PENETRATION_SOURCES.map(source=>'來源：'+source.url).join('\n');
    $('[data-hp-append]').value=next.text;
    $('[data-hp-record-count]').textContent=state.records.length?'已保留 '+state.records.length+' 筆觀察':'';
    const select=$('[data-hp-review]'),version=Object.keys(state.first).join(',')+'|'+state.records.length+'|'+state.savedVersions.length;
    if(version!==historyVersion){
      const focused=container.ownerDocument?.activeElement===select;
      select.innerHTML='<option value="">選擇保留內容</option>'+Object.keys(state.first).map(key=>'<option value="first-'+key+'">首次保留 · '+steps[key]+'</option>').join('')+state.records.map(item=>'<option value="record-'+item.sequence+'">觀察 '+item.sequence+' · '+steps[item.snapshot.step]+'</option>').join('')+state.savedVersions.map((item,i)=>'<option value="saved-'+(i+1)+'">已附加摘要 '+(i+1)+'</option>').join('');
      historyVersion=version;if(focused)select.focus();
    }
    select.value=state.review;
    const first=state.first[state.review.replace(/^first-/, '')],record=state.records.find(item=>'record-'+item.sequence===state.review),saved=state.savedVersions.find((item,i)=>'saved-'+(i+1)===state.review);
    $('[data-hp-review-text]').textContent=state.review.startsWith('first-')&&first?'首次保留（'+first.reason+'）\n'+first.snapshot.text:record?record.snapshot.text:saved?saved.text:'回看不改寫目前控制與文字；首次保留及觀察內容不隨後續修改變動。';
    $('[data-hp-save-status]').textContent=state.status||(!next.text?'沒有尚未附加的新內容。':next.text.length>10000?'新增內容超過 10,000 字，尚未保存；完整文字保留，可選取複製。':'只附加尚未保存的首次判斷、觀察與變更。');
    const save=$('[data-hp-action="save-summary"]');if(save)save.disabled=state.saving||!next.text;
  }
  function save() {
    if(state.saving||typeof onSaveSummary!=='function')return;
    const next=pending();if(!next.text)return;
    if(next.text.length>10000){state.status='新增內容超過 10,000 字，尚未保存、未送出、未截斷；完整文字可複製。';drawJournal();return;}
    state.saving=true;state.status='正在附加…';drawJournal();
    const settle=success=>{
      state.saving=false;
      if(success){state.cursor=next.cursor;next.firstKeys.forEach(key=>state.savedFirst.add(key));state.savedSignature=next.signature;state.savedVersions.push(immutable({text:next.text}));state.status='已追加這批新增內容到本課筆記；後續修改仍保留。';}
      else state.status='尚未保存；全部文字與觀察仍保留，可重試或複製。';
      for(const update of state.views)update();
    };
    try{const result=onSaveSummary(next.text);if(result&&typeof result.then==='function')Promise.resolve(result).then(value=>settle(value===true),()=>settle(false));else settle(result===true);}catch{settle(false);}
  }
  function onToggle(event) {
    if(disposed||!event?.target?.dataset?.hpDetails)return;
    syncPanels();state.status='';drawJournal();
  }
  function invalidate() {
    for (const answer of Object.values(answers)) Object.assign(answer,{checked:false,reference:false});
  }
  function rebuild() {
    experiment=null;second=null;baseHistory=[];secondHistory=[];invalidFields=new Set();parameterError='';
    const p={boundary,durationMinutes:60};
    for (const field of fields) {
      const value=numeric(inputs[field.key]);
      if (value===null || value<field.min || value>field.max) invalidFields.add(field.key);
      p[field.key]=value;
    }
    if (invalidFields.size) { parameterError='請把標示欄位填為所列範圍內的有限數字；目前不提供新的溫度結果。';return; }
    try {
      experiment=createHeatExperiment(p);baseHistory=experiment.history(81);
      second=createHeatExperiment({...p,thicknessMm:p.thicknessMm*2,hWm2K:comparison==='same-bi'?p.hWm2K/2:p.hWm2K});
      secondHistory=second.history(81);
    } catch(error) { experiment=null;second=null;baseHistory=[];secondHistory=[];parameterError=`目前條件無法計算：${error?.message||'請檢查參數。'}`; }
  }
  function calculate() {
    if (!experiment) return null;
    try {
      return {a:experiment.at(minutes,positions),b:second.at(minutes,positions),ta:experiment.timeToCenterFraction(.8),tb:second.timeToCenterFraction(.8)};
    } catch(error) { parameterError=`目前時刻無法計算：${error?.message||'請檢查參數。'}`;return null; }
  }
  function profileGraph(calc) {
    const p=experiment.parameters,L=p.thicknessMm/2,X=ratio=>70+(ratio+1)*270,Y=temp=>246-(temp-p.initialC)/(p.mediumC-p.initialC)*188;
    const line=minutes===0&&boundary==='fixed-surface'?`M${X(-1)} ${Y(p.mediumC)}L${X(-1)} ${Y(p.initialC)}L${X(1)} ${Y(p.initialC)}L${X(1)} ${Y(p.mediumC)}`:calc.a.profile.map((point,i)=>`${i?'L':'M'}${X(point.positionRatio)} ${Y(point.temperatureC)}`).join('');
    const yticks=[p.initialC,(p.initialC+p.mediumC)/2,p.mediumC];
    return `<svg viewBox="0 0 680 318" role="img" aria-label="${esc(`厚度方向溫度分布，t=${fmt(minutes)} min；全厚度 ${fmt(p.thicknessMm)} mm，中心 ${fmt(calc.a.centerC)}°C，表面 ${fmt(calc.a.surfaceC)}°C`)}"><path class="hp-axis" d="M70 47V246H610"/>${yticks.map(t=>`<path class="hp-grid" d="M70 ${Y(t)}H610"/><text x="60" y="${Y(t)+5}" text-anchor="end">${fmt(t)}</text>`).join('')}<path class="hp-medium-line" d="M70 ${Y(p.mediumC)}H610"/><path class="hp-profile-line" data-hp-profile-path d="${line}"/><path class="hp-center-guide" d="M340 50V246"/><circle class="hp-center-dot" cx="340" cy="${Y(calc.a.centerC)}" r="5"/><circle class="hp-surface-dot" cx="610" cy="${Y(calc.a.surfaceC)}" r="5"/><text x="70" y="25">溫度 · °C</text><text x="70" y="273" text-anchor="middle">−${fmt(L)}</text><text x="340" y="273" text-anchor="middle">0</text><text x="610" y="273" text-anchor="middle">${fmt(L)}</text><text x="70" y="300" text-anchor="start">表面</text><text x="340" y="300" text-anchor="middle">中心 · 位置 mm</text><text x="610" y="300" text-anchor="end">表面</text></svg>`;
  }
  function historyGraph(calc,scaled) {
    const p=experiment.parameters,X=t=>70+t/60*540,Y=temp=>246-(temp-p.initialC)/(p.mediumC-p.initialC)*188;
    const upto=(history,current)=>history.filter(point=>point.minutes<minutes).concat([current]);
    const points=upto(baseHistory,calc.a),other=upto(secondHistory,calc.b);
    const path=(items,key)=>items.map((point,i)=>`${i?'L':'M'}${X(point.minutes)} ${Y(point[key])}`).join('');
    return `<svg viewBox="0 0 680 318" role="img" aria-label="${esc(`${scaled?'A 與加倍厚度 B 的中心':'介質、表面與中心'}溫度歷程；僅顯示到 ${fmt(minutes)} min`)}"><path class="hp-axis" d="M70 47V246H610"/>${[p.initialC,(p.initialC+p.mediumC)/2,p.mediumC].map(t=>`<path class="hp-grid" d="M70 ${Y(t)}H610"/><text x="60" y="${Y(t)+5}" text-anchor="end">${fmt(t)}</text>`).join('')}<path class="hp-medium-line" d="M70 ${Y(p.mediumC)}H610"/><path class="hp-profile-line" data-hp-history="center" d="${path(points,'centerC')}"/><path class="hp-surface-line${scaled?' hp-comparison-line':''}" data-hp-history="${scaled?'b-center':'surface'}" d="${path(scaled?other:points,scaled?'centerC':'surfaceC')}"/><path class="hp-center-guide" d="M${X(minutes)} 47V246"/><circle class="hp-center-dot" cx="${X(minutes)}" cy="${Y(calc.a.centerC)}" r="5"/><circle class="hp-surface-dot" cx="${X(minutes)}" cy="${Y(scaled?calc.b.centerC:calc.a.surfaceC)}" r="5"/><text x="70" y="25">溫度 · °C</text>${[0,15,30,45,60].map(t=>`<text x="${X(t)}" y="276" text-anchor="middle">${t}</text>`).join('')}<text x="610" y="305" text-anchor="end">時間 · min</text></svg>`;
  }
  function interpretation() {
    if (step==='profile') return boundary==='fixed-surface'?{expected:'instant',text:'這次直接指定表面等於介質；t = 0 的表面值是瞬間切換後的右極限，內部仍從初溫開始。它是理想邊界，不是有限 h 的表面。'}:{expected:'lag',text:'有限對流需要介質與表面的溫差來傳熱；表面與中心都由導熱模型求出，不能把介質設定值代替中心溫度。'};
    if (step==='scale') return boundary==='fixed-surface'||comparison==='same-bi'?{expected:'four',text:boundary==='fixed-surface'?'兩組採相同固定表面邊界；同物性、相同無因次中心目標下，L 加倍而所需 Fo 相同，因此時間為 4 倍。':'B 的 h 減半，使 L 加倍後 Bi 仍相同；同物性與同無因次目標下，所需 Fo 相同，時間為 4 倍。這組外側 h 已改變。'}:{expected:'depends',text:'同 h 與 k，而 L 加倍時 Bi 也加倍；不能只用 L² 的尺度宣稱精確 4 倍。對照讀值來自各自的理想模型。'};
    return {expected:'local',text:'這些數字只積算指定位置的溫度。品質參數是假想的一級損失響應；中心或表面都不能直接代替整片平均，也沒有實際產品的安全判定。'};
  }
  function summary(calc) {
    const lines=['熱穿透工作台','假想常物性的一維對稱平板模型；非食品實測、非實際製程或安全保證。',`目前步驟：${steps[step]}；圖面：${step==='profile'?(view==='profile'?'目前剖面':'三點歷程'):step==='scale'?'厚度對照歷程':'局部熱歷程與累積作用'}`,`全厚度 2L=${inputs.thicknessMm} mm；L=${fmt(numeric(inputs.thicknessMm)===null?null:numeric(inputs.thicknessMm)/2)} mm。`,`k=${inputs.conductivityWmK} W/(m·K)；ρcp=${inputs.volumetricHeatCapacity} J/(m³·K)；h=${inputs.hWm2K} W/(m²·K)。`,`Ti=${inputs.initialC}°C；T∞=${inputs.mediumC}°C；邊界：${boundary==='fixed-surface'?'固定表面，h 不參與計算':'有限對流'}。`,`查看時間 ${fmt(minutes)} min；最遠已推進 ${fmt(furthest)} min。`];
    if (calc) {
      lines.push(`α=${fmt(experiment.derived.alphaM2s)} m²/s；Bi=${experiment.derived.biot===null?'不適用（固定表面）':fmt(experiment.derived.biot)}；Fo=${fmt(calc.a.fourier)}。`,`目前介質 ${fmt(calc.a.mediumC)}°C；表面 ${fmt(calc.a.surfaceC)}°C；中心 ${fmt(calc.a.centerC)}°C。`,`厚度對照：B 全厚度 ${fmt(second.parameters.thicknessMm)} mm；${comparison==='same-bi'?'同 Bi，B 的 h 減半':'同 h'}，B h=${fmt(second.parameters.hWm2K)} W/(m²·K)${boundary==='fixed-surface'?'（固定表面，h 不參與）':''}。`,`中心完成80%升溫的理想模型時間：A ${fmt(calc.ta.minutes)} min${calc.ta.withinWindow?'':'（超過60min圖窗）'}；B ${fmt(calc.tb.minutes)} min${calc.tb.withinWindow?'':'（超過60min圖窗）'}；B/A=${fmt(calc.tb.minutes/calc.ta.minutes)}。此目標不是安全門檻。`);
      if (step==='effect') lines.push(`局部積分：Tref=90°C，z=10°C；品質 zq=30°C、Dq,ref=20 min。中心 Fref=${fmt(calc.a.effects.center.fMinutes)} min，Fq=${fmt(calc.a.effects.center.qualityFMinutes)} min，A/A₀=${fmt(calc.a.effects.center.qualityRetention*100)}%；表面 Fref=${fmt(calc.a.effects.surface.fMinutes)} min，Fq=${fmt(calc.a.effects.surface.qualityFMinutes)} min，A/A₀=${fmt(calc.a.effects.surface.qualityRetention*100)}%。不是整片平均。`);
    } else lines.push(`目前無有效結果：${parameterError}`);
    for (const key of Object.keys(steps)) lines.push(`${steps[key]}：${answerMark(answers[key],choices[key])}`);
    lines.push('操作、核對與查看參考不代表已掌握。',...HEAT_PENETRATION_SOURCES.map(source=>`來源：${source.url}`));return lines.join('\n');
  }
  function render() {
    if (disposed) return;
    const calc=calculate(),valid=Boolean(calc),answer=answers[step];
    for (const field of fields) {
      const control=$(`[data-hp-control="${field.key}"]`);control.value=inputs[field.key];control.setAttribute('aria-invalid',String(invalidFields.has(field.key)));control.disabled=field.key==='hWm2K'&&boundary==='fixed-surface';
      $(`[data-hp-reading="${field.key}"]`).textContent=field.type==='range'?`${fmt(numeric(inputs[field.key]))} ${field.unit}`:'';
      if (field.type==='range') control.setAttribute('aria-valuetext',`${fmt(numeric(inputs[field.key]))} ${field.unit}`);
    }
    $('[data-hp-control="boundary"]').value=boundary;$('[data-hp-control="comparison"]').value=comparison;
    for (const panel of container.querySelectorAll('[data-hp-panel]')) panel.hidden=panel.dataset.hpPanel!==step;
    for (const button of container.querySelectorAll('[data-hp-step]')) button.setAttribute('aria-pressed',String(button.dataset.hpStep===step));
    for (const button of container.querySelectorAll('[data-hp-view]')) button.setAttribute('aria-pressed',String(button.dataset.hpView===view));
    for (const button of container.querySelectorAll('[data-hp-choice]')) button.setAttribute('aria-pressed',String(button.dataset.hpChoice===answers[button.dataset.hpGroup].choice));
    $('[data-hp-heading]').textContent=questions[step];$('[data-hp-reading-guide]').textContent=step==='profile'?'L 是本平板的半厚度；α=k/(ρcp) 是熱擴散率。Fo=αt/L²=t/(L²/α) 為無因次時間，代式 t 用秒，操作分鐘先乘60。Fo=1只表示經過此擴散時間尺度，不表示升溫完成，也不是 Fref 等效分鐘。':step==='scale'?'同幾何與相對位置／溫度下，有限對流還需同 Bi 才有相同目標 Fo；固定表面則比較相同理想邊界。時間依 L²/α 換算，只在 α 也相同時才單按 L² 縮放。同 h 而厚度加倍會改 Bi；此處 L 是半厚度。':'Fref 是指定位置在 Tref=90°C、z=10°C 下的等效分鐘，與無因次 Fo 不同。z 設定溫度權重，不是時間；要由 Fref 推 log 減少還需相符 Dref，本台未給微生物 Dref 或初始菌數。';$('[data-hp-view-switch]').hidden=step!=='profile';
    $('[data-hp-error]').textContent=parameterError;$('[data-hp-notice]').textContent=notice;
    $('[data-hp-conditions]').textContent=`半厚度 L = ${fmt(numeric(inputs.thicknessMm)===null?null:numeric(inputs.thicknessMm)/2)} mm · 初溫 ${inputs.initialC}°C → 介質 ${inputs.mediumC}°C · ${boundary==='fixed-surface'?'固定表面，h 不參與':'有限對流'}。`;
    $('[data-hp-time]').textContent=`t = ${fmt(minutes)} min`;
    const time=$('[data-hp-control="time"]');time.value=String(minutes);time.disabled=!valid;time.setAttribute('aria-valuetext',`${fmt(minutes)} min，最遠已推進 ${fmt(furthest)} min`);
    $('[data-hp-action="advance"]').disabled=!valid||minutes>=60;$('[data-hp-action="restart"]').disabled=!valid||minutes===0;
    $('[data-hp-action="check"]').disabled=!valid||!answer.choice;$('[data-hp-action="reference"]').disabled=!valid;
    $('[data-hp-action="previous"]').disabled=step==='profile';$('[data-hp-action="next"]').disabled=step==='effect';
    $('[data-hp-label="two"]').textContent=step==='scale'?'A 中心 · 原厚度':'表面';$('[data-hp-label="three"]').textContent=step==='scale'?'B 中心 · 雙厚度':'中心';
    $('[data-hp-value="one"]').textContent=valid?`${fmt(calc.a.mediumC)}°C`:'—';
    $('[data-hp-value="two"]').textContent=valid?`${fmt(step==='scale'?calc.a.centerC:calc.a.surfaceC)}°C`:'—';
    $('[data-hp-value="three"]').textContent=valid?`${fmt(step==='scale'?calc.b.centerC:calc.a.centerC)}°C`:'—';
    $('[data-hp-chart]').innerHTML=valid?(step==='profile'&&view==='profile'?profileGraph(calc):historyGraph(calc,step==='scale')):'<p class="hp-empty">修正參數後，這裡會顯示新的模型結果。</p>';
    $('[data-hp-caption]').textContent=step==='profile'&&view==='profile'?'完整剖面由對稱半域鏡射；細虛線為中心，頂端虛線為介質。':step==='scale'?'銅色實線 A、綠色虛線 B：兩組中心溫度，共用時間與溫度尺度。':'銅色實線為中心、綠色虛線為表面、灰色疏虛線為介質；只顯示到目前時刻。';
    $('[data-hp-observation]').textContent=!valid?'':minutes===0?(boundary==='fixed-surface'?'t = 0：表面顯示瞬間切換後的右極限，內部仍為初溫。':'t = 0：介質已設定，物料表面與中心仍從相同初溫開始。'):step==='scale'?`同一時刻，A 中心 ${fmt(calc.a.centerC)}°C，B 中心 ${fmt(calc.b.centerC)}°C；較厚的內部需要更多時間升溫。`:`介質 ${fmt(calc.a.mediumC)}°C → 表面 ${fmt(calc.a.surfaceC)}°C → 中心 ${fmt(calc.a.centerC)}°C。${boundary==='fixed-surface'?'表面是指定值，中心是計算結果。':'表面與中心是模型結果；介質設定不能代替它們。'}`;
    $('[data-hp-comparison-note]').textContent=boundary==='fixed-surface'?'兩組都直接指定表面溫度；h 與 Bi 不參與此邊界。':comparison==='same-bi'?'B 的全厚度加倍，h 減半；兩組 Bi 相同，外側對流已改變。':'B 的全厚度加倍，h 不變；兩組 Bi 不同。';
    $('[data-hp-scale-result]').innerHTML=valid?`<p>中心達到相同升溫比例</p><dl><div><dt>A · ${fmt(experiment.parameters.thicknessMm)} mm</dt><dd>${fmt(calc.ta.minutes)} min${calc.ta.withinWindow?'':'<small>超過目前 60 min 圖窗</small>'}</dd></div><div><dt>B · ${fmt(second.parameters.thicknessMm)} mm</dt><dd>${fmt(calc.tb.minutes)} min${calc.tb.withinWindow?'':'<small>超過目前 60 min 圖窗</small>'}</dd></div></dl><p class="hp-ratio">B / A = ${fmt(calc.tb.minutes/calc.ta.minutes)} 倍</p><p class="hp-note">模型延續相同固定條件估算達標時間；不是實測時間或加工建議。</p>`:'';
    for (const position of ['center','surface']) {
      $(`[data-hp-effect="${position}-f"]`).textContent=valid?fmt(calc.a.effects[position].fMinutes):'—';
      $(`[data-hp-effect="${position}-quality"]`).textContent=valid?`${fmt(calc.a.effects[position].qualityRetention*100)}%`:'—';
    }
    const decision=interpretation();$('[data-hp-feedback]').textContent=!valid?'':answer.checked?`${answer.choice===decision.expected?'這次預測與模型條件相符。':'這次預測需要調整。'} ${decision.text}`:answer.reference?`參考已展開；${answer.choice?'自己的選擇保留，尚未核對。':'尚未自行作答。'} ${decision.text}`:answer.choice?'已選擇；可推進時間，再核對這個預測。':'';
    $('[data-hp-equation]').textContent=step==='profile'?'∂T/∂t = α ∂²T/∂x²；Fo = αt/L²':step==='scale'?(boundary==='fixed-surface'?'Fo = αt/L²；Ts = T∞':'Fo = αt/L²；Bi = hL/k'):'Fref = ∫₀ᵗ 10^((Tlocal − 90)/10) dτ';
    $('[data-hp-equation-note]').textContent=step==='profile'?`α = k/(ρcp)，單位 m²/s；L 是全厚度的一半，用 m。Fo 代式 t 用 s（操作分鐘乘60），Fo 無單位。${boundary==='fixed-surface'?'表面 Ts = T∞。':'右表面 x=L：−k∂T/∂x = h(Ts − T∞)；中心 ∂T/∂x = 0。'}`:step==='scale'?(boundary==='fixed-surface'?'固定表面不使用 Bi；同物性與相同目標時，時間按 L² 縮放。Fo 的 t 使用秒，L 使用公尺。':'Fo 的 t 使用秒，L 使用公尺；同 Bi 與相同目標時，L² 才直接給出時間尺度。'):'積分時間以 min 計；Tref=90°C、z=10°C。品質另用 Fq（zq=30°C），A/A₀ = 10^(−Fq/20 min)。';
    $('[data-hp-derived]').textContent=valid?`L=${fmt(experiment.derived.halfThicknessM)} m；α=${fmt(experiment.derived.alphaM2s)} m²/s；Bi=${experiment.derived.biot===null?'不適用（固定表面）':fmt(experiment.derived.biot)}；此時 Fo=${fmt(calc.a.fourier)}。`:'';
    $('[data-hp-method]').textContent='溫度由平板導熱模型求出；局部 F 與品質作用量採數值求積，不是既有三段線性熱歷程的精確積分。本輪不模擬降溫。固定表面在 t=0 採表面右極限；單一時刻的跳變沒有有限時間的作用量。';
    $('[data-hp-details-values]').innerHTML=valid?`<p>對照 Bi：A ${experiment.derived.biot===null?'不適用':fmt(experiment.derived.biot)}；B ${second.derived.biot===null?'不適用':fmt(second.derived.biot)}。B 的 h=${fmt(second.parameters.hWm2K)} W/(m²·K)。</p><p>目前中心 Fq=${fmt(calc.a.effects.center.qualityFMinutes)} min；表面 Fq=${fmt(calc.a.effects.surface.qualityFMinutes)} min。無指定菌種、初始菌數或安全門檻；沒有由 F 計算失活 log。</p>`:'';
    markExposure(calc);drawJournal(calc);syncDraft();
  }
  function changeParameters(key,value) {
    if (inputs[key]===value) return;captureFirst('改變參數前');state.status='';inputs[key]=value;minutes=0;furthest=0;invalidate();notice='條件已改，時間回到 0；先前預測保留，需重新核對。';rebuild();render();
  }
  function moveTo(next) {
    if (!Object.hasOwn(steps,next)||next===step) return;captureFirst('切換步驟前');state.status='';step=next;notice='';render();const heading=$('[data-hp-heading]');heading.focus?.({preventScroll:true});heading.scrollIntoView?.({block:'start',behavior:'instant'});
  }
  function onInput(event) {
    if (disposed) return;
    const writing=event.target?.closest?.('[data-hp-writing]');if(writing&&container.contains(writing)){state.writing=writing.value;state.status='';drawJournal();return;}
    const target=event.target?.closest?.('[data-hp-control]');if (!target||!container.contains(target)||target.disabled) return;
    const key=target.dataset.hpControl;
    if (fields.some(field=>field.key===key)) {changeParameters(key,target.value);return;}
    if (key==='time') {const value=numeric(target.value);if (value!==null&&value>=0&&value<=60) {captureFirst('查看另一時刻前');state.status='';minutes=Math.round(value*10)/10;furthest=Math.max(furthest,minutes);notice='';}render();}
  }
  function onChange(event) {
    if (disposed) return;
    const review=event.target?.closest?.('[data-hp-review]');if(review&&container.contains(review)){const value=review.value;if(value===''||(value.startsWith('first-')&&Object.hasOwn(state.first,value.slice(6)))||state.records.some(item=>'record-'+item.sequence===value)||state.savedVersions.some((item,i)=>'saved-'+(i+1)===value))state.review=value;drawJournal();return;}
    const target=event.target?.closest?.('[data-hp-control]');if (!target||!container.contains(target)||target.disabled) return;
    const key=target.dataset.hpControl,value=target.value;
    if (key==='boundary'&&['convective','fixed-surface'].includes(value)&&value!==boundary) {captureFirst('改變邊界前');state.status='';boundary=value;minutes=0;furthest=0;invalidate();notice='邊界已改，時間回到 0；先前預測需重新核對。';rebuild();render();}
    else if (key==='comparison'&&['same-h','same-bi'].includes(value)&&value!==comparison) {captureFirst('改變厚度對照前');state.status='';comparison=value;Object.assign(answers.scale,{checked:false,reference:false});notice='對照條件已改，厚度預測需重新核對。';rebuild();render();}
    else if (key==='time'||fields.some(field=>field.key===key)) onInput(event);
    else render();
  }
  function onClick(event) {
    if (disposed) return;const target=event.target?.closest?.('button');if (!target||!container.contains(target)||target.disabled) return;
    if (target.dataset.hpStep) {moveTo(target.dataset.hpStep);return;}
    if (['profile','history'].includes(target.dataset.hpView)) {captureFirst('切換圖面前');state.status='';view=target.dataset.hpView;render();return;}
    if (target.dataset.hpGroup===step&&Object.hasOwn(choices[step],target.dataset.hpChoice??'')) {state.status='';Object.assign(answers[step],{choice:target.dataset.hpChoice,checked:false,reference:false});render();return;}
    const action=target.dataset.hpAction;
    if(action==='record'){captureFirst('記下觀察時',true);const current=snapshot();state.records.push(immutable({sequence:state.records.length+1,snapshot:current,signature:JSON.stringify(current)}));state.review='record-'+state.records.length;state.status='已保留這筆觀察；後續修改不覆寫。';drawJournal();return;}
    if (action==='previous'||action==='next') {const keys=Object.keys(steps);moveTo(keys[keys.indexOf(step)+(action==='next'?1:-1)]);return;}
    if (action==='advance'&&experiment) {captureFirst('前進時間前');state.status='';minutes=Math.min(60,Math.round((minutes+1)*10)/10);furthest=Math.max(furthest,minutes);notice='';}
    else if (action==='restart') {captureFirst('回到起點前');state.status='';minutes=0;notice='查看起點；最遠已推進時間仍保留。';}
    else if (action==='reset') {captureFirst('還原教學參數前');state.status='';for (const field of fields) inputs[field.key]=String(DEFAULT_HEAT_PARAMETERS[field.key]);boundary=DEFAULT_HEAT_PARAMETERS.boundary;comparison='same-h';minutes=0;furthest=0;invalidate();notice='已還原教學參數；先前預測保留，需重新核對。';rebuild();}
    else if (action==='check'&&answers[step].choice&&experiment) {captureFirst('首次核對前',true);state.status='';answers[step].checked=true;}
    else if (action==='reference'&&experiment) {captureFirst('主動看參考前',true);state.status='';Object.assign(answers[step],{reference:true,referenceSeen:true});}
    else if (action==='select-summary') {const field=$('[data-hp-summary]');field.focus();field.select?.();return;}
    else if (action==='save-summary'&&typeof onSaveSummary==='function') {save();return;} else return;
    render();
  }
  for(const key of detailKeys){const panel=$('[data-hp-details="'+key+'"]');panel.open=state.open[key];panel.ontoggle=onToggle;}
  state.views.add(drawJournal);
  container.addEventListener('input',onInput);container.addEventListener('change',onChange);container.addEventListener('click',onClick);rebuild();render();
  return ()=>{if(disposed)return;syncPanels();syncDraft();disposed=true;state.views.delete(drawJournal);for(const key of detailKeys)$('[data-hp-details="'+key+'"]').ontoggle=null;container.removeEventListener('input',onInput);container.removeEventListener('change',onChange);container.removeEventListener('click',onClick);};
}
