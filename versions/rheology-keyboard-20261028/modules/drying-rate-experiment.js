import {escapeHTML as esc} from './storage.js';

export const DRYING_RATE_EXPERIMENT_IDS=Object.freeze(['processing-drying-rate-curve']);
export const DRYING_RATE_EXPERIMENT_SOURCES=Object.freeze({
  'processing-drying-rate-curve':Object.freeze([
    {title:'NPTEL · 乾燥的熱質傳、平衡與臨界含水量',url:'https://archive.nptel.ac.in/content/storage2/courses/103103027/pdf/mod4.pdf'},
  ]),
});
export const DRYING_RATE_DEFAULTS=Object.freeze({initialX:3,criticalX:1,equilibriumX:.1,constantRate:.6,dryMassKg:1,areaM2:1,targetX:.3});
function finite(n,key){if(typeof n!=='number'||!Number.isFinite(n))throw new TypeError(`${key} must be finite`);}
function requireRange(ok,message){if(!ok)throw new RangeError(message);}
function parameters(options={}){
  const p={...DRYING_RATE_DEFAULTS,...options};
  for(const key of ['initialX','criticalX','equilibriumX','constantRate','dryMassKg','areaM2'])finite(p[key],key);
  requireRange(p.initialX>=p.criticalX&&p.criticalX>p.equilibriumX&&p.equilibriumX>=0&&p.initialX<=100,'Require 0 <= Xe < Xc <= X0 <= 100');
  for(const key of ['constantRate','dryMassKg','areaM2'])requireRange(p[key]>=1e-9&&p[key]<=1e6,`${key} outside numerical range`);
  requireRange(p.criticalX-p.equilibriumX>=1e-9,'Critical and equilibrium moisture are numerically too close');
  return p;
}
/** Original teaching law. N is kg water/(m² h); X is kg water/kg dry solid. */
export function dryingRateAtMoisture(X,options={}){
  const p=parameters(options);finite(X,'X');requireRange(X>=p.equilibriumX&&X<=p.initialX,'X outside model range');
  return X>=p.criticalX?p.constantRate:p.constantRate*(X-p.equilibriumX)/(p.criticalX-p.equilibriumX);
}
export function dryingTimeToTarget(targetX,options={}){
  const p=parameters(options);finite(targetX,'targetX');requireRange(targetX>p.equilibriumX&&targetX<=p.initialX,'Require Xe < targetX <= X0; equilibrium is approached asymptotically');
  const scale=p.dryMassKg/p.areaM2/p.constantRate;
  const constantHours=scale*(p.initialX-Math.max(targetX,p.criticalX));
  const fallingHours=targetX<p.criticalX?scale*(p.criticalX-p.equilibriumX)*Math.log((p.criticalX-p.equilibriumX)/(targetX-p.equilibriumX)):0;
  const totalHours=constantHours+fallingHours;
  for(const [key,n] of Object.entries({constantHours,fallingHours,totalHours}))finite(n,key);
  return {constantHours,fallingHours,totalHours,waterRemovedKg:p.dryMassKg*(p.initialX-targetX)};
}
export function dryingStateAtTime(timeHours,options={}){
  const p=parameters(options);finite(timeHours,'timeHours');requireRange(timeHours>=0,'Negative drying time');
  const slope=p.areaM2/p.dryMassKg*p.constantRate,criticalHours=(p.initialX-p.criticalX)/slope;
  const constant=timeHours<=criticalHours;
  const X=constant?p.initialX-slope*timeHours:p.equilibriumX+(p.criticalX-p.equilibriumX)*Math.exp(-slope*(timeHours-criticalHours)/(p.criticalX-p.equilibriumX));
  requireRange(X>p.equilibriumX,'Time exceeds floating-point resolution near equilibrium');
  return {X,rate:dryingRateAtMoisture(X,p),timeHours,phase:constant?'constant':'falling',waterRemovedKg:p.dryMassKg*(p.initialX-X)};
}
const num=(v,d=2)=>v.toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});
const controls={
  targetX:{label:'希望降到的乾基含水量 X',min:.15,max:2.9,step:.05,format:v=>`${num(v)} kg/kg`},
  constantRate:{label:'設定恆速段速率 Nc',min:.2,max:1.2,step:.1,format:v=>`${num(v,1)} kg/(m²·h)`},
  cursor:{label:'沿模型時間觀察',min:0,max:1,step:.01,format:v=>`${num(v*100,0)}%`},
  dryMassKg:{label:'乾固形物質量 Ms',min:.5,max:2,step:.1,format:v=>`${num(v,1)} kg`},
  areaM2:{label:'乾燥面積 A',min:.5,max:2,step:.1,format:v=>`${num(v,1)} m²`},
};
export function dryingRateDiagram(options={},cursor=1){
  const p=parameters(options);finite(cursor,'cursor');requireRange(cursor>=0&&cursor<=1,'Cursor must be a fraction');
  const times=dryingTimeToTarget(p.targetX,p),s=dryingStateAtTime(times.totalHours*cursor,p);
  const x=X=>50+X/p.initialX*492,y=N=>255-N/1.3*198;
  const tx=t=>50+t/times.totalHours*492,ty=X=>514-X/p.initialX*176;
  requireRange(times.totalHours>0,'Chart needs a nonzero time interval');
  const knee=Math.min(times.totalHours,(p.initialX-p.criticalX)*p.dryMassKg/(p.areaM2*p.constantRate));
  const timePath=(start,end)=>Array.from({length:81},(_,i)=>dryingStateAtTime(start+(end-start)*i/80,p)).map((q,i)=>`${i?'L':'M'}${tx(q.timeHours)},${ty(q.X)}`).join(' ');
  return `<svg viewBox="0 0 590 567" role="img" aria-label="上下兩圖共用同一模型狀態。上圖乾燥速率對乾基含水量；下圖乾基含水量對模型時間。點目前在 ${num(s.timeHours)} 小時、X ${num(s.X)}，${s.phase==='constant'?'恆速段':'降速段'}。"><text x="50" y="25">N · kg 水 / (m²·h)</text>${[0,.4,.8,1.2].map(v=>`<path d="M50 ${y(v)}H542" class="dry-grid"/><text x="40" y="${y(v)+4}" text-anchor="end">${num(v,1)}</text>`).join('')}${[0,1,2,3].map(v=>`<text x="${x(v)}" y="279" text-anchor="middle">${v}</text>`).join('')}<text x="542" y="301" text-anchor="end">X · kg 水 / kg 乾固形物</text><path d="M${x(p.criticalX)} 45V255" class="dry-critical"/><text x="${x(p.criticalX)+8}" y="50">Xc</text><path d="M${x(p.equilibriumX)} ${y(0)}L${x(p.criticalX)} ${y(p.constantRate)}" class="dry-rate-curve dry-rate-falling"/><path d="M${x(p.criticalX)} ${y(p.constantRate)}H${x(p.initialX)}" class="dry-rate-curve"/><path d="M${x(s.X)} ${y(s.rate)}V255" class="dry-cursor"/><circle cx="${x(s.X)}" cy="${y(s.rate)}" r="6" class="dry-rate-current"/><text x="50" y="328">X · kg/kg</text>${[0,1,2,3].map(v=>`<path d="M50 ${ty(v)}H542" class="dry-grid"/><text x="40" y="${ty(v)+4}" text-anchor="end">${v}</text>`).join('')}<path d="M50 ${ty(p.equilibriumX)}H542" class="dry-critical"/><text x="76" y="${ty(p.equilibriumX)-6}" text-anchor="start">Xe</text><path d="${timePath(0,knee)}" class="dry-rate-curve"/>${times.totalHours>knee?`<path d="${timePath(knee,times.totalHours)}" class="dry-rate-curve dry-rate-falling"/>`:""}<path d="M${tx(s.timeHours)} 338V514" class="dry-cursor"/><circle cx="${tx(s.timeHours)}" cy="${ty(s.X)}" r="6" class="dry-rate-current"/>${[0,.5,1].map(f=>`<text x="${tx(times.totalHours*f)}" y="539" text-anchor="middle">${num(times.totalHours*f,1)}</text>`).join('')}<text x="542" y="564" text-anchor="end">模型時間 · h</text></svg>`;
}
let serial=0;
const drafts=new WeakMap(),mounted=new WeakMap();
function draftSlot(owner,key){
  if(!owner||(typeof owner!=='object'&&typeof owner!=='function'))return null;
  let entries=drafts.get(owner);if(!entries){entries=new Map();drafts.set(owner,entries);}
  let slot=entries.get(key);if(!slot){slot={snapshot:null,dispose:null};entries.set(key,slot);}return slot;
}
export function mountDryingRateExperiment(container,id,{draftOwner,draftKey=id}={}){
  if(!DRYING_RATE_EXPERIMENT_IDS.includes(id))throw new RangeError('Unknown drying rate experiment');
  if(!container||typeof container.querySelector!=='function'||typeof container.querySelectorAll!=='function'||typeof container.addEventListener!=='function'||typeof container.removeEventListener!=='function')throw new TypeError('A DOM container is required');
  mounted.get(container)?.();
  const slot=draftSlot(draftOwner,typeof draftKey==='string'&&draftKey.trim()?draftKey:id);slot?.dispose?.();
  const prefix=`dryrate-${++serial}`,state={...DRYING_RATE_DEFAULTS,cursor:1};
  for(const [key,c]of Object.entries(controls)){const value=slot?.snapshot?.values?.[key];if(Number.isFinite(value)&&value>=c.min&&value<=c.max)state[key]=value;}
  let disposed=false;
  const $=s=>container.querySelector(s);
  const control=key=>{const c=controls[key];return `<div class="food-exp-control"><div class="food-exp-control-label"><label for="${prefix}-${key}">${c.label}</label><output data-dry-reading="${key}"></output></div><input id="${prefix}-${key}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${state[key]}" data-dry-input="${key}"></div>`;};
  container.innerHTML=`<section class="food-experiment drying-experiment drying-rate-workbench" aria-labelledby="${prefix}-title">
<header class="food-exp-heading"><p class="food-exp-kicker">越接近終點，越慢下來</p><h3 id="${prefix}-title">最後一點水，為什麼更費時間？</h3><p class="food-exp-hint">把目標含水量往下調，再沿兩張圖追蹤同一個點。</p></header>
<div class="dry-rate-top"><p class="dry-rate-identity">原創分段教學模型 · 非食品實測</p><button type="button" class="dry-reset" data-dry-reset>重設示例</button></div>
<div class="dry-layout">
<div class="dry-visual"><div class="dry-rate-chart" tabindex="0" role="region" aria-label="兩張乾燥速率圖，可橫向捲動"></div><div class="dry-rate-legend"><span>恆速段</span><span>線性降速假設</span></div></div>
<div class="dry-panel"><div class="dry-result" aria-live="polite"><span>達到目標的模型時間</span><output class="dry-rate-total"></output><small>h · 指定參數算例</small></div>
<div class="dry-rate-main-controls">${control('targetX')}${control('constantRate')}</div>
<div class="dry-rate-time-control">${control('cursor')}</div>
<p class="dry-rate-current-values" aria-live="polite" aria-atomic="true"></p><dl class="dry-rate-times"><div><dt>恆速段</dt><dd class="dry-rate-constant"></dd></div><div><dt>降速段</dt><dd class="dry-rate-fall"></dd></div></dl><p class="dry-rate-water dry-reading"></p></div></div>
<div class="dry-rate-extras"><details class="food-exp-details"><summary>提問、操作與模型式</summary><div class="food-exp-details-body"><p class="dry-formula">dX / dt = − A N / Ms</p><p class="dry-scope">原創分段教學函數，未用食品數據擬合。固定 X₀ = 3、Xc = 1、Xe = 0.1；不代表某種食品的實際乾燥時間。</p></div></details>
<details class="food-exp-details"><summary>改變乾固形物質量與面積</summary><div class="food-exp-details-body">${control('dryMassKg')}${control('areaM2')}<p class="dry-note">在 N 不隨幾何與操作改變的本例中，時間與 Ms/A 成正比。實際增加厚度或面積，也可能改變傳熱、傳質與速率。</p></div></details><details class="food-exp-details dry-details"><summary>從速率曲線算時間</summary><div class="food-exp-details-body"><p class="dry-note">乾基 X = 水質量 / 乾固形物質量。N 是單位面積、單位時間的除水量，乾固形物 Ms 與面積 A 固定。</p><p class="dry-formula">N = Nc，X ≥ Xc<br>N = Nc (X − Xe) / (Xc − Xe)，Xe &lt; X &lt; Xc</p><p class="dry-note">跨過 Xc 時，把 t = (Ms/A) ∫dX/N 分成兩段。恆速段 t₁ = Ms(X₀ − Xc)/(A Nc)；降速段 t₂ = Ms(Xc − Xe)/(A Nc) × ln[(Xc − Xe)/(X目標 − Xe)]。若目標還在恆速段，僅計 Ms(X₀ − X目標)/(A Nc)。</p><p class="dry-note">目標逼近 Xe，這個線性降速模型的時間趨近無限；Xe 是給定條件下的平衡量，不是「完全無水」。圖上的時間軸會依目標重算，游標保留相同比例位置。</p></div></details><details class="food-exp-details"><summary>模型邊界與來源</summary><div class="food-exp-details-body"><p class="dry-note">NPTEL 教材用於平衡含水量、臨界含水量與兩段速率的概念。此處直線降速函數與參數是原創算例，並非從教材轉錄的食品量測曲線；Xc 不等於 Xe，也不等於水活性。</p><p class="dry-note">忽略預熱、收縮、內部水分梯度及變動的空氣條件。不是每種食品都有可辨認的恆速段；真實降速曲線也不一定為直線。此處沒有連算前一課的空氣路徑，兩個模型的參數互相獨立。</p><ul class="food-exp-sources">${DRYING_RATE_EXPERIMENT_SOURCES[id].map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></li>`).join('')}</ul></div></details></div></section>`;
  const panels=Array.from(container.querySelectorAll('.dry-rate-extras > .food-exp-details'));
  panels.forEach((panel,i)=>panel.open=slot?.snapshot?.details?.[i]===true);
  function draw(){
    const result=dryingTimeToTarget(state.targetX,state),s=dryingStateAtTime(result.totalHours*state.cursor,state);
    $('.dry-rate-chart').innerHTML=dryingRateDiagram(state,state.cursor);
    $('.dry-rate-total').textContent=num(result.totalHours);$('.dry-rate-constant').textContent=`${num(result.constantHours)} h`;$('.dry-rate-fall').textContent=`${num(result.fallingHours)} h`;
    $('.dry-rate-water').textContent=`達標除水量 Ms(X₀ − X目標) = ${num(result.waterRemovedKg)} kg`;
    $('.dry-rate-current-values').textContent=`${s.phase==='constant'?'恆速段':'降速段'} · t = ${num(s.timeHours)} h · X = ${num(s.X)} kg/kg · N = ${num(s.rate,3)} kg/(m²·h)`;
    for(const [key,c] of Object.entries(controls)){const input=$(`[data-dry-input="${key}"]`);input.value=String(state[key]);input.setAttribute('aria-valuetext',key==='cursor'?`${num(result.totalHours*state.cursor)} 小時，${c.format(state[key])}`:c.format(state[key]));$(`[data-dry-reading="${key}"]`).textContent=key==='cursor'?`${num(result.totalHours*state.cursor)} h`:c.format(state[key]);}
  }
  const input=e=>{if(disposed)return;const key=e.target?.dataset?.dryInput,c=controls[key];if(!c||e.target!==$(`[data-dry-input="${key}"]`)||String(e.target.value).trim()==='')return;const v=Number(e.target.value);if(!Number.isFinite(v)||v<c.min||v>c.max)return;state[key]=v;draw();};
  const click=e=>{if(disposed)return;const b=e.target?.closest?.('button');if(b?.hasAttribute('data-dry-reset')&&container.contains(b)){Object.assign(state,DRYING_RATE_DEFAULTS,{cursor:1});draw();}};
  function dispose(){
    if(disposed)return;
    if(slot)slot.snapshot={values:Object.fromEntries(Object.keys(controls).map(key=>[key,state[key]])),details:panels.map(panel=>panel.open===true)};
    disposed=true;container.removeEventListener('input',input);container.removeEventListener('click',click);
    if(slot?.dispose===dispose)slot.dispose=null;if(mounted.get(container)===dispose)mounted.delete(container);
  }
  if(slot)slot.dispose=dispose;mounted.set(container,dispose);
  container.addEventListener('input',input);container.addEventListener('click',click);draw();
  return dispose;
}
