import {escapeHTML as esc} from './storage.js';

export const THERMAL_HISTORY_EXPERIMENT_IDS=Object.freeze(['processing-thermal-history']);
export const THERMAL_HISTORY_EXPERIMENT_SOURCES=Object.freeze({
  'processing-thermal-history':Object.freeze([
    {title:'USDA ARS · D、z 與升降溫累積作用',url:'https://pmp.ars.usda.gov/overview.aspx'},
    {title:'Etzel 等（2015）· 熱穿透、測溫位置與熱歷程積分',url:'https://onlinelibrary.wiley.com/doi/10.1002/fsn3.185'},
    {title:'GMA 指引 · 熱穿透與冷點（UC Davis 收錄）',url:'https://ucfoodsafety.ucdavis.edu/sites/g/files/dgvnsk7366/files/inline-files/224455.pdf'},
    {title:'Zhang 等（2024）· 品質變化的一級模型與 D、z',url:'https://onlinelibrary.wiley.com/doi/full/10.1002/fsn3.3908'},
  ]),
});
export const THERMAL_HISTORY_PARAMETERS=Object.freeze({initialTemperatureC:40,holdTemperatureC:90,finalTemperatureC:40,heatingMinutes:4,holdingMinutes:2,coolingMinutes:4,referenceTemperatureC:90,zC:10,dReferenceMinutes:2,qualityZC:30,qualityDReferenceMinutes:20});

function finite(value,name){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(`${name} must be finite`);}
function nonnegative(value,name){finite(value,name);if(value<0)throw new RangeError(`${name} must be nonnegative`);}
function positive(value,name){finite(value,name);if(value<=0)throw new RangeError(`${name} must be positive`);}
function temperature(value,name){finite(value,name);if(value<=-273.15)throw new RangeError(`${name} must exceed absolute zero`);}
function representable(value,name){if(!Number.isFinite(value))throw new RangeError(`${name} exceeds the numeric range`);return value;}
function positiveRatio(a,b,name){const value=representable(a/b,name);if(a>0&&value===0)throw new RangeError(`${name} is below the numeric range`);return value;}
function interpolate(a,b,fraction){return fraction===0?a:fraction===1?b:a*(1-fraction)+b*fraction;}

/** Exact integral for a LINEAR temperature segment (the rate is exponential).
 * All times are minutes; z is a temperature difference in °C (numerically K).
 * A zero-duration segment is an ideal instantaneous jump with zero contribution.
 * partialMinutes must lie within the segment; no silent input correction.
 * Anchoring at the hotter endpoint avoids exp(a) overflow on a steep cooling ramp.
 */
export function integrateLinearTemperature({startTemperatureC,endTemperatureC,durationMinutes,referenceTemperatureC=90,zC=10,partialMinutes=durationMinutes}={}){
  temperature(startTemperatureC,'start temperature');temperature(endTemperatureC,'end temperature');temperature(referenceTemperatureC,'reference temperature');
  nonnegative(durationMinutes,'duration');positive(zC,'z');nonnegative(partialMinutes,'partial time');
  if(partialMinutes>durationMinutes)throw new RangeError('partial time must not exceed duration');
  if(partialMinutes===0)return 0;
  const end=interpolate(startTemperatureC,endTemperatureC,partialMinutes/durationMinutes);
  const startLog=representable((startTemperatureC-referenceTemperatureC)/zC*Math.LN10,'relative-rate logarithm');
  const endLog=representable((end-referenceTemperatureC)/zC*Math.LN10,'relative-rate logarithm');
  const span=representable(Math.abs(end-startTemperatureC)/zC*Math.LN10,'rate-log span');
  const factor=span===0?1:-Math.expm1(-span)/span;
  const logIntegral=Math.log(partialMinutes)+Math.max(startLog,endLog)+Math.log(factor);
  const result=representable(Math.exp(logIntegral),'integrated effect');
  if(result===0)throw new RangeError('Positive integrated effect is below the numeric range');
  return result;
}

/** One prescribed LOCAL temperature history, not a heat-transfer model.
 * Right-continuous cursor temperature: zero-time jumps at the cursor are complete.
 * Both response models follow this same location/history. Neither is a whole-food
 * average. Quality is an invented scalar with first-order loss, not general quality.
 */
export function thermalHistory(options={}){
  const p={...THERMAL_HISTORY_PARAMETERS,...options};
  for(const key of ['initialTemperatureC','holdTemperatureC','finalTemperatureC','referenceTemperatureC'])temperature(p[key],key);
  for(const key of ['heatingMinutes','holdingMinutes','coolingMinutes'])nonnegative(p[key],key);
  for(const key of ['zC','dReferenceMinutes','qualityZC','qualityDReferenceMinutes'])positive(p[key],key);
  const totalMinutes=representable(p.heatingMinutes+p.holdingMinutes+p.coolingMinutes,'total duration');
  const elapsedMinutes=options.partialMinutes===undefined?totalMinutes:options.partialMinutes;
  nonnegative(elapsedMinutes,'partial time');if(elapsedMinutes>totalMinutes)throw new RangeError('partial time must not exceed total duration');
  let offset=0;
  const stages=[['heating',p.initialTemperatureC,p.holdTemperatureC,p.heatingMinutes],['holding',p.holdTemperatureC,p.holdTemperatureC,p.holdingMinutes],['cooling',p.holdTemperatureC,p.finalTemperatureC,p.coolingMinutes]].map(([id,startTemperatureC,endTemperatureC,durationMinutes])=>{
    const startMinutes=offset,endMinutes=offset+durationMinutes;
    if(durationMinutes>0&&endMinutes===startMinutes)throw new RangeError('Positive stage duration is below time-axis precision');
    offset=endMinutes;
    const partialMinutes=Math.max(0,Math.min(durationMinutes,elapsedMinutes-startMinutes));
    const segment={startTemperatureC,endTemperatureC,durationMinutes,referenceTemperatureC:p.referenceTemperatureC};
    return {id,startMinutes,endMinutes,durationMinutes,startTemperatureC,endTemperatureC,elapsedMinutes:partialMinutes,
      fMinutes:integrateLinearTemperature({...segment,zC:p.zC,partialMinutes}),totalFMinutes:integrateLinearTemperature({...segment,zC:p.zC}),
      qualityFMinutes:integrateLinearTemperature({...segment,zC:p.qualityZC,partialMinutes}),totalQualityFMinutes:integrateLinearTemperature({...segment,zC:p.qualityZC})};
  });
  const sum=key=>representable(stages.reduce((total,stage)=>total+stage[key],0),key);
  const fMinutes=sum('fMinutes'),totalFMinutes=sum('totalFMinutes'),qualityFMinutes=sum('qualityFMinutes'),totalQualityFMinutes=sum('totalQualityFMinutes');
  const current=stages.find(stage=>elapsedMinutes<stage.endMinutes),temperatureC=current?interpolate(current.startTemperatureC,current.endTemperatureC,(elapsedMinutes-current.startMinutes)/current.durationMinutes):p.finalTemperatureC;
  const logReduction=positiveRatio(fMinutes,p.dReferenceMinutes,'log reduction'),qualityLogLoss=positiveRatio(qualityFMinutes,p.qualityDReferenceMinutes,'quality log loss');
  // Preserve the logarithm outside a conservative, normal-number display window;
  // never present numerical underflow as a zero retained amount.
  const retentionLogOnly=qualityLogLoss>300,retainedFraction=retentionLogOnly?null:10**(-qualityLogLoss);
  return {totalMinutes,elapsedMinutes,temperatureC,stage:current?.id??'complete',stages,fMinutes,totalFMinutes,logReduction,
    quality:{fMinutes:qualityFMinutes,totalFMinutes:totalQualityFMinutes,logLoss:qualityLogLoss,log10Retention:qualityLogLoss===0?0:-qualityLogLoss,retainedFraction,retentionLogOnly}};
}

const number=(value,digits=2)=>Number(value.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits});
const measure=value=>value!==0&&Math.abs(value)<.001?value.toExponential(2):number(value,3);
const minutes=value=>`${number(value,2)} min`;
const controls=[
  {name:'holdTemperatureC',label:'保溫溫度',min:70,max:110,step:1,format:v=>`${number(v,0)}°C`},
  {name:'holdingMinutes',label:'保溫時間',min:0,max:12,step:.1,format:minutes},
  {name:'heatingMinutes',label:'40°C → 保溫溫度',min:0,max:12,step:.25,format:minutes},
  {name:'coolingMinutes',label:'保溫溫度 → 40°C',min:0,max:12,step:.25,format:minutes},
  {name:'qualityZC',label:'品質響應 zq',min:5,max:50,step:1,format:v=>`${number(v,0)}°C`},
  {name:'qualityDReferenceMinutes',label:'品質響應 Dq,ref',min:5,max:60,step:1,format:minutes},
];
function controlHTML(control,state,prefix){const id=`${prefix}-${control.name}`;return `<div class="food-exp-control"><div class="food-exp-control-label"><label for="${id}">${control.label}</label><output for="${id}" data-history-reading="${control.name}">${esc(control.format(state[control.name]))}</output></div><input id="${id}" type="range" data-history-input="${control.name}" min="${control.min}" max="${control.max}" step="${control.step}" value="${state[control.name]}" aria-valuetext="${esc(control.format(state[control.name]))}"><div class="food-exp-endpoints" aria-hidden="true"><span>${esc(control.format(control.min))}</span><span>${esc(control.format(control.max))}</span></div></div>`;}

function diagram(state,result){
  const width=420,left=58,right=399,x=time=>left+(right-left)*time/(result.totalMinutes||1),ty=temp=>163-(temp-35)/80*120,maxF=result.totalFMinutes||1,fy=f=>339-f/maxF*110;
  const profile=[[0,state.initialTemperatureC],[state.heatingMinutes,state.holdTemperatureC],[state.heatingMinutes+state.holdingMinutes,state.holdTemperatureC],[result.totalMinutes,state.finalTemperatureC]];
  const tempPath=profile.map(([t,temp],i)=>`${i?'L':'M'}${x(t)},${ty(temp)}`).join(' ');
  const times=[0,result.totalMinutes,...result.stages.map(s=>s.endMinutes),...Array.from({length:81},(_,i)=>result.totalMinutes*i/80)].sort((a,b)=>a-b);
  const points=times.map(t=>{const value=thermalHistory({...state,partialMinutes:t});return [t,value.fMinutes];});
  const path=points.map(([t,f],i)=>`${i?'L':'M'}${x(t)},${fy(f)}`).join(' ');
  const past=points.filter(([t])=>t<result.elapsedMinutes).concat([[result.elapsedMinutes,result.fMinutes]]),area=`M${left},339 ${past.map(([t,f])=>`L${x(t)},${fy(f)}`).join(' ')} L${x(result.elapsedMinutes)},339 Z`;
  const stages=result.stages.map((stage,i)=>`<rect x="${x(stage.startMinutes)}" y="183" width="${x(stage.endMinutes)-x(stage.startMinutes)}" height="5" fill="${['#d79b77','#b9543a','#8caaa2'][i]}"/>`).join('');
  const boundaries=result.stages.slice(0,2).filter(s=>s.endMinutes>0&&s.endMinutes<result.totalMinutes).map(s=>`<path d="M${x(s.endMinutes)},43V163M${x(s.endMinutes)},229V339" class="history-grid history-stage-guide"/>`).join('');
  const tickTimes=result.totalMinutes===0?[0]:[0,result.totalMinutes/2,result.totalMinutes];
  return `<svg viewBox="0 0 ${width} 380" role="img" aria-label="${esc(`同一位置的假想熱歷程。游標 ${minutes(result.elapsedMinutes)}，溫度 ${number(result.temperatureC)}°C，累積 Fref ${measure(result.fMinutes)} min。完整歷程 ${minutes(result.totalMinutes)}，Fref ${measure(result.totalFMinutes)} min。`)}" xmlns="http://www.w3.org/2000/svg"><text x="${left}" y="24" class="history-plot-title">溫度 · °C</text><text x="${right}" y="24" text-anchor="end" class="history-plot-reading">${number(result.temperatureC,1)}°C</text>${[40,70,100].map(t=>`<path d="M${left},${ty(t)}H${right}" class="history-grid"/><text x="${left-9}" y="${ty(t)+4}" text-anchor="end">${t}</text>`).join('')}<path d="M${left},${ty(90)}H${right}" class="history-reference"/><text x="${right}" y="${ty(90)-5}" text-anchor="end" class="history-small">Tref 90°C</text>${boundaries}<path d="${tempPath}" class="history-temperature" data-history-curve="temperature"/>${stages}<text x="${left}" y="213" class="history-plot-title">累積 Fref · min</text><text x="${right}" y="213" text-anchor="end" class="history-plot-reading">${measure(result.fMinutes)}</text>${[0,.5,1].map(f=>`<path d="M${left},${fy(maxF*f)}H${right}" class="history-grid"/><text x="${left-9}" y="${fy(maxF*f)+4}" text-anchor="end" class="history-small">${measure(maxF*f)}</text>`).join('')}<path d="${area}" class="history-area"/><path d="${path}" class="history-cumulative" data-history-curve="effect"/><path d="M${x(result.elapsedMinutes)},43V163M${x(result.elapsedMinutes)},229V339" class="history-cursor"/><circle cx="${x(result.elapsedMinutes)}" cy="${ty(result.temperatureC)}" r="4.5" class="history-dot" data-history-marker="temperature"/><circle cx="${x(result.elapsedMinutes)}" cy="${fy(result.fMinutes)}" r="4.5" class="history-dot"/>${tickTimes.map(t=>`<text x="${x(t)}" y="360" text-anchor="middle">${number(t,1)}</text>`).join('')}<text x="${right}" y="379" text-anchor="end" class="history-small">時間 · min</text></svg>`;
}

const historyDrafts=new WeakMap(),mountedHistory=new WeakMap();
function historyDraft(owner,key,id){
  if(!owner||typeof owner!=='object'&&typeof owner!=='function')return {state:null,cursorMinutes:null,details:[],active:null};
  let lessons=historyDrafts.get(owner);if(!lessons){lessons=new Map();historyDrafts.set(owner,lessons);}
  let activities=lessons.get(key);if(!activities){activities=new Map();lessons.set(key,activities);}
  let draft=activities.get(id);if(!draft){draft={state:null,cursorMinutes:null,details:[],active:null};activities.set(id,draft);}
  return draft;
}
function historyState(saved){
  const state={...THERMAL_HISTORY_PARAMETERS};
  for(const control of controls){const value=saved?.[control.name];if(typeof value==='number'&&Number.isFinite(value)&&value>=control.min&&value<=control.max)state[control.name]=value;}
  return state;
}
let instance=0;
/** Host loads food-experiments.css and thermal-history-experiment.css. */
export function mountThermalHistoryExperiment(container,id,{draftOwner,draftKey=id}={}){
  if(!THERMAL_HISTORY_EXPERIMENT_IDS.includes(id))throw new RangeError(`Unknown thermal-history experiment: ${id}`);
  if(!container||typeof container.querySelector!=='function'||typeof container.addEventListener!=='function'||typeof container.removeEventListener!=='function')throw new TypeError('A DOM container is required');
  const draft=historyDraft(draftOwner,draftKey,id);mountedHistory.get(container)?.();draft.active?.();
  const state=historyState(draft.state),prefix=`thermal-history-${++instance}`,totalMinutes=state.heatingMinutes+state.holdingMinutes+state.coolingMinutes;
  let cursorMinutes=typeof draft.cursorMinutes==='number'&&Number.isFinite(draft.cursorMinutes)&&draft.cursorMinutes>=0?Math.min(draft.cursorMinutes,totalMinutes):totalMinutes,disposed=false;
  const cursor={name:'cursorPercent',label:'查看熱歷程',min:0,max:100,step:.5,format:v=>`${number(v)}%`};
  container.innerHTML=`<section class="food-experiment history-experiment" data-history-experiment="${id}" aria-labelledby="${prefix}-title">
    <header class="food-exp-heading"><p class="food-exp-kicker">沿時間看累積</p><h3 id="${prefix}-title">升溫與降溫，也會累積作用嗎？</h3><p class="food-exp-hint">改變保溫條件，再拖動圖下游標，查看三段歷程的貢獻。</p></header>
    <p class="history-identity">單一位置假想模型 · 非實際殺菌排程</p>
    <div class="history-layout">
    <div class="food-exp-stage history-stage">
    <div class="food-exp-figure history-figure"></div>
    <p class="food-exp-caption">上下圖共用時間軸；累積作用的縱軸隨歷程縮放。</p>
    <details class="food-exp-details history-explanation"><summary>提問、操作與積分式</summary><div class="food-exp-details-body">
    <p class="history-boundary">單一位置的假想溫度歷程與響應參數；用來理解積分，不是實際殺菌排程。</p>
    <p class="history-formula">Fref(t) = ∫₀ᵗ 10<sup>(T(τ) − Tref) / z</sup> dτ<small>Tref = 90°C · z = 10°C · Fref 單位 min</small></p>
    </div></details></div>
    <div class="history-panel">
    <div class="food-exp-result" aria-live="polite" aria-atomic="true"><output class="food-exp-value history-value"></output><span class="food-exp-result-label history-label"></span></div>
    <div class="history-main-controls">${controls.slice(0,2).map(c=>controlHTML(c,state,prefix)).join('')}</div>
    <div class="history-cursor-control">${controlHTML(cursor,{cursorPercent:100},prefix)}</div>
    <div class="history-contributions"><p>目前累積 · 分段貢獻</p><dl class="history-readings"></dl></div>
    <button type="button" class="history-reset" data-history-action="reset">重設示例</button>
    </div></div>
    <p class="food-exp-observation history-observation"></p>
    <div class="history-extensions">
    <details class="food-exp-details history-profile"><summary>調整升溫與降溫</summary><div class="food-exp-details-body">${controls.slice(2,4).map(c=>controlHTML(c,state,prefix)).join('')}<p class="history-note">起點、終點固定 40°C。時間設為 0 代表理想瞬間跳變，該段不累積作用。中途調整時保留原分鐘，超出新終點時移到終點；原本在終點時持續跟隨新終點。</p><div class="history-presets"><p>同 Fref 的理想等溫對照 · 升降溫皆為 0</p><div><button type="button" data-history-action="preset-low">90°C × 2 min</button><button type="button" data-history-action="preset-high">100°C × 0.2 min</button></div><p>兩者 Fref 都是 2 min；展開品質響應觀察差異。這是數學對照，不是加工建議。</p></div></div></details>
    <details class="food-exp-details history-quality"><summary>同一歷程，另一個品質響應</summary><div class="food-exp-details-body"><p class="history-note">指定一個假想品質量 A，在同一位置按一級反應損失；它不是整罐平均，也不代表所有品質。</p><div class="history-quality-result" aria-live="polite" aria-atomic="true"><output class="history-quality-value"></output><span class="history-quality-label"></span></div>${controls.slice(4).map(c=>controlHTML(c,state,prefix)).join('')}<p class="history-quality-formula">Fq = ∫₀ᵗ 10<sup>(T(τ) − 90) / zq</sup> dτ<br>A/A₀ = 10<sup>−Fq / Dq,ref</sup></p><p class="history-note">zq 決定溫度敏感度；Dq,ref 是 90°C 時損失 1 log 所需分鐘。保留率是指定模型的量比，不是品質分數或安全指標。</p></div></details>
    <details class="food-exp-details"><summary>模型假設與來源</summary><div class="food-exp-details-body"><p class="food-exp-assumptions">Fref 表示在 90°C、指定 z 下的等效作用時間，不是實際經過時間。升降溫假設 T 隨時間線性，作用率則呈指數變化；逐段使用解析積分。若額外假設一級失活、Dref = 2 min，則降低量 = Fref / Dref；這些數字沒有對應菌種或安全門檻。</p><p class="food-exp-assumptions">T 是指定位置的物料溫度，不是加熱設備設定值。本活動未解熱傳、熱穿透或空間溫差。實際應用須量測適當位置與冷點、驗證動力學和條件；不能由單一曲線推論整批安全、保存期限或全體平均品質。</p><p class="food-exp-assumptions">品質模型另假設固定 zq、Dq,ref 與一級不可逆損失 dA/dt = −kq(T) A；Fq、Fref 對應不同響應，不能當作同一量直接比較。真實品質可能形成、降解或遵循其他反應級數。無初始菌數、無肩部或拖尾，也不保證零存活。</p><ul class="food-exp-sources">${THERMAL_HISTORY_EXPERIMENT_SOURCES[id].map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></li>`).join('')}</ul></div></details>
    </div></section>`;
  const find=selector=>container.querySelector(selector);
  const details=[...container.querySelectorAll?.('details')??[]];
  const remember=()=>{if(!disposed){draft.state={...state};draft.cursorMinutes=cursorMinutes;draft.details=details.map(detail=>Boolean(detail.open));}};
  details.forEach((detail,index)=>{detail.open=draft.details[index]===true;detail.ontoggle=()=>{if(!disposed)remember();};});
  const figure=find('.history-figure');figure.setAttribute('tabindex','0');figure.setAttribute('role','region');figure.setAttribute('aria-label','熱歷程圖表');
  function draw(){
    const total=state.heatingMinutes+state.holdingMinutes+state.coolingMinutes,result=thermalHistory({...state,partialMinutes:cursorMinutes});
    find('.history-figure').innerHTML=diagram(state,result);find('.history-value').textContent=`${measure(result.fMinutes)} min`;find('.history-label').textContent=`游標處的累積 Fref · t = ${minutes(result.elapsedMinutes)}`;
    find('.history-readings').innerHTML=result.stages.map((stage,i)=>`<div><dt><span class="history-stage-dot history-stage-${stage.id}"></span>${['升溫','保溫','降溫'][i]}</dt><dd>${measure(stage.fMinutes)} min</dd></div>`).join('');
    find('.history-observation').textContent=total===0?'三段時間皆為 0：只有理想瞬間跳變，Fref = 0；游標顯示跳變後的 40°C。':result.elapsedMinutes===0?'游標在起點，累積作用為 0。曲線顯示完整歷程，拖動游標可查看累積。':result.stage==='cooling'?`正在降溫至 ${number(result.temperatureC,1)}°C，Fref 仍持續增加；變小的是累積速率。`:`完整歷程的 Fref 為 ${measure(result.totalFMinutes)} min；其中升溫、降溫合計 ${measure(result.stages[0].totalFMinutes+result.stages[2].totalFMinutes)} min。`;
    const q=result.quality;
    find('.history-quality-value').textContent=q.retentionLogOnly?`10^−${measure(q.logLoss)}`:q.retainedFraction*100<.01?`${(q.retainedFraction*100).toExponential(2)}%`:`${number(q.retainedFraction*100,1)}%`;
    find('.history-quality-label').textContent=`假想品質量保留率 A/A₀ · 游標處 Fq = ${measure(q.fMinutes)} min${q.retentionLogOnly?'（保留率以量比的對數形式呈現）':''}`;
    for(const control of controls){const input=find(`[data-history-input="${control.name}"]`),formatted=control.format(state[control.name]);input.value=state[control.name];input.setAttribute('aria-valuetext',formatted);find(`[data-history-reading="${control.name}"]`).textContent=formatted;}
    const input=find('[data-history-input="cursorPercent"]'),cursorText=`${minutes(result.elapsedMinutes)} / ${minutes(total)} · ${number(result.temperatureC,1)}°C`;input.value=total===0?0:cursorMinutes/total*100;input.disabled=total===0;input.setAttribute('aria-valuetext',cursorText);find('[data-history-reading="cursorPercent"]').textContent=cursorText;
  }
  const onInput=event=>{
    if(disposed||typeof container.contains==='function'&&!container.contains(event.target))return;
    const name=event.target?.dataset?.historyInput,control=name==='cursorPercent'?cursor:controls.find(item=>item.name===name);
    if(!control||String(event.target.value).trim()==='')return;const raw=Number(event.target.value);if(!Number.isFinite(raw))return;
    const value=Math.max(control.min,Math.min(control.max,raw)),oldTotal=state.heatingMinutes+state.holdingMinutes+state.coolingMinutes;
    if(name==='cursorPercent')cursorMinutes=oldTotal*value/100;else{const atEnd=cursorMinutes===oldTotal;state[name]=value;const newTotal=state.heatingMinutes+state.holdingMinutes+state.coolingMinutes;cursorMinutes=atEnd?newTotal:Math.min(cursorMinutes,newTotal);}
    draw();remember();
  };
  const onClick=event=>{
    if(disposed||typeof container.contains==='function'&&!container.contains(event.target))return;
    const action=event.target?.closest?.('[data-history-action]')?.dataset?.historyAction;
    if(action==='reset')Object.assign(state,THERMAL_HISTORY_PARAMETERS);
    else if(action==='preset-low'||action==='preset-high')Object.assign(state,{heatingMinutes:0,coolingMinutes:0,holdTemperatureC:action==='preset-low'?90:100,holdingMinutes:action==='preset-low'?2:.2});
    else return;
    cursorMinutes=state.heatingMinutes+state.holdingMinutes+state.coolingMinutes;draw();remember();
  };
  container.addEventListener('input',onInput);container.addEventListener('click',onClick);draw();
  const dispose=()=>{if(disposed)return;remember();disposed=true;details.forEach(detail=>{detail.ontoggle=null;});container.removeEventListener('input',onInput);container.removeEventListener('click',onClick);if(draft.active===dispose)draft.active=null;if(mountedHistory.get(container)===dispose)mountedHistory.delete(container);};
  draft.active=dispose;mountedHistory.set(container,dispose);remember();return dispose;
}
