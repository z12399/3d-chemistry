import {escapeHTML as esc} from './storage.js';
import {dryingAirPath, humidityRatioFromRH, stateFromHY, PSYCHROMETRIC_DEFAULTS} from './psychrometric-model.js';

export const PSYCHROMETRIC_EXPERIMENT_IDS=Object.freeze(['processing-psychrometric-chart']);
export const PSYCHROMETRIC_EXPERIMENT_SOURCES=Object.freeze({
  'processing-psychrometric-chart':Object.freeze([
    {title:'ASHRAE · 濕空氣性質、濕球與露點',url:'https://handbook.ashrae.org/Handbooks/F21/SI/F21_Ch01/F21_Ch01_si.aspx'},
    {title:'PsychroLib · 開放的濕空氣計算',url:'https://github.com/psychrometrics/psychrolib'},
    {title:'CoolProp · 濕空氣模型（獨立數值對照）',url:'https://coolprop.org/fluid_properties/HumidAir.html'},
  ]),
});
const num=(v,d=1)=>v.toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});
const specs={
  heatingDeltaC:{label:'先把空氣加熱',min:0,max:35,step:1,format:v=>`＋${num(v,0)}°C`},
  progress:{label:'再沿路徑增加水分',min:0,max:1,step:.01,format:v=>`${num(v*100,0)}%`},
  inletTC:{label:'入口乾球溫度',min:20,max:35,step:1,format:v=>`${num(v,0)}°C`},
  inletRH:{label:'入口相對濕度',min:.4,max:.8,step:.01,format:v=>`${num(v*100,0)}%`},
  dryAirFlowKgH:{label:'乾空氣質量流率',min:100,max:500,step:25,format:v=>`${num(v,0)} kg/h`},
};
const stateNames={A:'入口空氣',B:'加熱之後',C:'增濕之後'};
const x=t=>48+t/70*516,y=Y=>364-Y/.06*322;
const point=s=>`${x(s.tDbC).toFixed(3)},${y(s.humidityRatio).toFixed(3)}`;

export function psychrometricDiagram(path,selected='C',prefix='psych-chart'){
  if(!Object.hasOwn(stateNames,selected))throw new RangeError('Unknown air state');
  if(!/^[a-zA-Z][\w-]*$/.test(prefix))throw new TypeError('Invalid SVG id');
  const rhCurves=[.2,.4,.6,.8,1].map(rh=>{
    const points=Array.from({length:141},(_,i)=>({tDbC:i/2,humidityRatio:humidityRatioFromRH(i/2,rh)}));
    const labelCeiling=.055-Math.max(0,rh-.6)*.03;
    const last=points.findLast(p=>p.humidityRatio<=labelCeiling);
    return `<path d="${points.map((p,i)=>(i?'L':'M')+point(p)).join(' ')}" class="psy-rh ${rh===1?'psy-saturated':''}"/><text x="${x(last.tDbC)-3}" y="${y(last.humidityRatio)-7}" text-anchor="end" class="psy-rh-label">${rh*100}%</text>`;
  }).join('');
  const wetPath=end=>Array.from({length:41},(_,i)=>i===0?path.B:i===40?end:stateFromHY(path.B.hKJkgDa,path.B.humidityRatio+(end.humidityRatio-path.B.humidityRatio)*i/40)).map((p,i)=>(i?'L':'M')+point(p)).join(' ');
  const overlapAB=path.heatingKJkgDa===0,overlapBC=path.waterPickupKgKgDa===0;
  return `<svg viewBox="0 0 600 418" role="img" aria-label="濕空氣教學圖：橫軸乾球溫度 0 至 70°C，縱軸含濕量 0 至 60 g/kg 乾空氣。A 到 B 等含濕量加熱；B 到 C 沿指定等焓路徑增濕。選中 ${selected} ${stateNames[selected]}。"><defs><clipPath id="${prefix}-clip"><rect x="48" y="42" width="516" height="322"/></clipPath></defs><text x="48" y="21" class="psy-axis-title">Y · g 水 / kg 乾空氣</text>${[0,10,20,30,40,50,60].map(v=>`<path d="M48 ${y(v/1000)}H564" class="dry-grid"/><text x="39" y="${y(v/1000)+4}" text-anchor="end">${v}</text>`).join('')}${[0,10,20,30,40,50,60,70].map(t=>`<path d="M${x(t)} 42V364" class="dry-grid"/><text x="${x(t)}" y="388" text-anchor="middle">${t}</text>`).join('')}<text x="564" y="414" text-anchor="end">乾球溫度 · °C</text><g clip-path="url(#${prefix}-clip)">${rhCurves}<path d="${wetPath(path.saturationEnd)}" class="psy-guide"/><path d="M${point(path.A)}L${point(path.B)}" class="psy-heating"/><path d="${wetPath(path.C)}" class="psy-wetting"/></g>${['A','B','C'].map(key=>{const s=path[key],dx=key==='A'?-13:key==='B'?13:0,dy=key==='C'?23:-13;return `<circle cx="${x(s.tDbC)}" cy="${y(s.humidityRatio)}" r="${key===selected?7:4}" class="psy-point psy-point-${key} ${key===selected?'is-selected':''}"/><text x="${x(s.tDbC)+dx}" y="${y(s.humidityRatio)+dy}" text-anchor="middle" class="psy-point-label">${key}</text>`;}).join('')}</svg><p class="dry-plot-note">${overlapAB?'A、B 重合：沒有加熱。':overlapBC?'B、C 重合：尚未增加水分。':'暖色線加熱，綠色線增濕。'} 灰色實線為 RH；虛線延伸至同焓飽和端點，並非等濕球線。圖窗外曲線未顯示。</p>`;
}

const owners=new WeakMap(),mounted=new WeakMap();
function draftFor(owner,key,id){
  const fresh=()=>({snapshot:null,active:null});
  if(owner===null||!['object','function'].includes(typeof owner))return fresh();
  let lessons=owners.get(owner);if(!lessons)owners.set(owner,lessons=new Map());
  let activities=lessons.get(key);if(!activities)lessons.set(key,activities=new Map());
  if(!activities.has(id))activities.set(id,fresh());return activities.get(id);
}
function restoredState(saved){
  const state={...PSYCHROMETRIC_DEFAULTS};
  for(const [key,c] of Object.entries(specs))if(Number.isFinite(saved?.[key])&&saved[key]>=c.min&&saved[key]<=c.max)state[key]=saved[key];
  return state;
}
let serial=0;
export function mountPsychrometricExperiment(container,id,{draftOwner,draftKey=id}={}){
  if(!PSYCHROMETRIC_EXPERIMENT_IDS.includes(id))throw new RangeError('Unknown psychrometric experiment');
  const draft=draftFor(draftOwner,draftKey,id);mounted.get(container)?.();draft.active?.();
  const saved=draft.snapshot,prefix=`psy-${++serial}`,state=restoredState(saved?.state);
  let selected=Object.hasOwn(stateNames,saved?.selected)?saved.selected:'C',disposed=false;
  const $=s=>container.querySelector(s);
  const control=key=>{const c=specs[key];return `<div class="food-exp-control"><div class="food-exp-control-label"><label for="${prefix}-${key}">${c.label}</label><output data-psy-reading="${key}" for="${prefix}-${key}"></output></div><input id="${prefix}-${key}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${state[key]}" data-psy-input="${key}"></div>`;};
  container.innerHTML=`<section class="food-experiment drying-experiment psychrometric-workbench" aria-labelledby="${prefix}-title"><header class="food-exp-heading"><p class="food-exp-kicker">讓空氣走過兩段路</p><h3 id="${prefix}-title">加熱之後，水去哪裡了？</h3><p class="food-exp-hint">先看 A → B，再把 C 推向飽和。</p></header><div class="psy-main-controls"><div>${control('heatingDeltaC')}<p class="dry-bridge">A → B：水量不變；有加熱時 RH 下降，未加熱則不變。</p></div><div>${control('progress')}<p class="dry-bridge">0% 是 B；100% 是此等焓路徑的飽和端點。百分比是路徑位置。</p></div></div><div class="dry-layout"><div class="dry-visual"><div class="psy-chart" tabindex="0" role="region" aria-label="濕空氣圖，可橫向捲動"></div></div><div class="psy-sidebar"><div class="psy-states" role="group" aria-label="選擇空氣狀態">${Object.entries(stateNames).map(([key,title])=>`<button type="button" data-psy-state="${key}" aria-pressed="${key===selected}"><b>${key}</b>${title}</button>`).join('')}</div><div class="psy-current" aria-live="polite" aria-atomic="true"></div><div class="dry-result" aria-live="polite"><span>每公斤乾空氣增加的水</span><output class="psy-pickup"></output><small>g 水 / kg 乾空氣</small></div><p class="psy-heat dry-reading"></p></div></div><div class="dry-panel"><p class="dry-formula">ΔY = Y<sub>C</sub> − Y<sub>B</sub><br><small>加熱量 q = h<sub>B</sub> − h<sub>A</sub></small></p><p class="dry-scope">101.325 kPa 理想濕空氣。B → C 指定等焓；未計食品與液態水的顯熱，未預測乾燥時間。</p><details class="food-exp-details"><summary>換一股入口空氣與流量</summary><div class="food-exp-details-body">${control('inletTC')}${control('inletRH')}${control('dryAirFlowKgH')}<p class="psy-rates dry-reading" aria-live="polite"></p><p class="dry-note">蒸發水量 ṁ水 = ṁ乾空氣 × ΔY；加熱功率 Q̇ = ṁ乾空氣 × Δh / 3600（kg/h、kJ/kg → kW）。本模型預先指定狀態，因此流量只換算總水量與功率；實際出口可能隨流量改變。</p></div></details><button type="button" class="dry-reset" data-psy-reset>重設示例</button></div><details class="food-exp-details dry-details"><summary>讀取 A、B、C 的完整性質</summary><div class="food-exp-details-body"><div class="dry-table-scroll" tabindex="0" role="region" aria-label="空氣性質表，可橫向捲動"><table><caption>計算值 · 乾空氣質量基準</caption><thead><tr><th scope="col">狀態</th><th scope="col">乾球<br>°C</th><th scope="col">RH<br>%</th><th scope="col">Y<br>g/kg</th><th scope="col">h<br>kJ/kg</th><th scope="col">露點<br>°C</th><th scope="col">濕球*<br>°C</th></tr></thead><tbody class="psy-state-rows"></tbody></table></div><p class="dry-note">露點是冷卻到開始凝結的溫度；*濕球是熱力學濕球計算值。它們不是食品溫度，也不互相等同。等焓線與等濕球線接近，但並非同一條線。</p><p class="dry-note">Y = 0.621945 pᵥ / (P − pᵥ)，pᵥ = RH × pₛ(T)。h = 1.006T + Y(2501 + 1.86T)，T 用 °C，Y 用 kg/kg 乾空氣。RH 代入 0–1 分率，各壓力同用 kPa。</p></div></details><details class="food-exp-details"><summary>假設、來源與水活性的差別</summary><div class="food-exp-details-body"><p class="dry-note">PsychroLib 2.5.0／ASHRAE 2017 理想氣體近似；飽和壓力式、焓式及求根用於這張直角座標教學圖。代表狀態已與 CoolProp 濕空氣模型對照；近似式仍有差異，並非實測資料或原版 ASHRAE 圖表。</p><p class="dry-note">嚴格絕熱增濕仍須計入加入水的焓。本例省略該項，以等焓路徑練習讀圖；進度不是時間、設備效率或真實出口預測。</p><p class="dry-note">RH 描述這股空氣；食品 aw 描述食品水的化學勢。只有同溫且達到平衡，才可用平衡 RH / 100 對應 aw。這裡未求食品與空氣的平衡。</p><ul class="food-exp-sources">${PSYCHROMETRIC_EXPERIMENT_SOURCES[id].map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></li>`).join('')}</ul></div></details></section>`;
  const view=$('.psychrometric-workbench'),ownsView=()=>$('.psychrometric-workbench')===view;
  const inputs=new Map(Object.keys(specs).map(key=>[key,$(`[data-psy-input="${key}"]`)]));
  const stateButtons=new Map(Object.keys(stateNames).map(key=>[key,$(`[data-psy-state="${key}"]`)])),resetButton=$('[data-psy-reset]');
  const panels=Array.from(container.querySelectorAll('details'));
  panels.forEach((node,index)=>{node.open=saved?.details?.[index]===true;});
  const remember=()=>{draft.snapshot={state:{...state},selected,details:panels.map(node=>node.open)};};
  function draw(){
    const path=dryingAirPath(state),s=path[selected];
    $('.psy-chart').innerHTML=psychrometricDiagram(path,selected,prefix);
    $('.psy-current').innerHTML=`<span>${selected} · ${stateNames[selected]}</span><dl><div><dt>乾球</dt><dd>${num(s.tDbC)}<small>°C</small></dd></div><div><dt>相對濕度</dt><dd>${num(s.rh*100)}<small>%</small></dd></div><div><dt>含濕量</dt><dd>${num(s.humidityRatio*1000)}<small>g/kg</small></dd></div></dl>`;
    container.querySelectorAll('[data-psy-state]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.psyState===selected)));
    $('.psy-pickup').textContent=num(path.waterPickupKgKgDa*1000,2);
    $('.psy-heat').textContent=`A → B 加熱量：${num(path.heatingKJkgDa,2)} kJ/kg 乾空氣`;
    $('.psy-rates').textContent=`水量增加 ${num(path.waterPickupKgH,2)} kg/h · 加熱功率 ${num(path.heatingKW,2)} kW`;
    $('.psy-state-rows').innerHTML=['A','B','C'].map(key=>{const q=path[key];return `<tr><th scope="row">${key}</th><td>${num(q.tDbC)}</td><td>${num(q.rh*100)}</td><td>${num(q.humidityRatio*1000,2)}</td><td>${num(q.hKJkgDa,2)}</td><td>${q.tDewC===null?'—':num(q.tDewC)}</td><td>${q.tWetC===null?'—':num(q.tWetC)}</td></tr>`;}).join('');
    for(const [key,c] of Object.entries(specs)){const input=$(`[data-psy-input="${key}"]`);input.value=String(state[key]);input.setAttribute('aria-valuetext',c.format(state[key]));$(`[data-psy-reading="${key}"]`).textContent=c.format(state[key]);}
  }
  const input=e=>{
    if(disposed||!ownsView())return;
    const target=e.target,key=target?.dataset?.psyInput;
    if(!Object.hasOwn(specs,key)||inputs.get(key)!==target||!view.contains(target)||String(target.value).trim()==='')return;
    const c=specs[key],value=Number(target.value);if(!Number.isFinite(value)||value<c.min||value>c.max)return;
    state[key]=value;draw();remember();
  };
  const click=e=>{
    if(disposed||!ownsView())return;
    const button=e.target?.closest?.('button');if(!button||!view.contains(button))return;
    if(button===resetButton){Object.assign(state,PSYCHROMETRIC_DEFAULTS);selected='C';}
    else{const key=button.dataset?.psyState;if(!Object.hasOwn(stateNames,key)||stateButtons.get(key)!==button)return;selected=key;}
    draw();remember();
  };
  const toggle=e=>{if(!disposed&&ownsView()&&panels.includes(e.target)&&view.contains(e.target))remember();};
  function dispose(){
    if(disposed)return;if(ownsView())remember();disposed=true;
    container.removeEventListener('input',input);container.removeEventListener('click',click);container.removeEventListener('toggle',toggle,true);
    if(draft.active===dispose)draft.active=null;if(mounted.get(container)===dispose)mounted.delete(container);
  }
  mounted.set(container,dispose);draft.active=dispose;
  container.addEventListener('input',input);container.addEventListener('click',click);container.addEventListener('toggle',toggle,true);draw();remember();
  return dispose;
}
