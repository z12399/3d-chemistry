import {escapeHTML as esc} from './storage.js';

export const COLLOID_EXPERIMENT_IDS=Object.freeze(['emulsion-creaming']);
export const COLLOID_SOURCES=Object.freeze({
  'emulsion-creaming':Object.freeze([
    {title:'OpenStax · Stokes 阻力與粒子雷諾數',url:'https://openstax.org/books/college-physics-2e/pages/12-6-motion-of-an-object-in-a-viscous-fluid'},
    {title:'University of Guelph · 乳析、絮凝與聚結',url:'https://books.lib.uoguelph.ca/dairyscienceandtechnologyebook/chapter/milk-lipids-chemical-properties-physical-properties-structure-and-fat-globules-functional-properties/'},
    {title:'Ervik & Bjørklund，2017 · 液滴界面與剛性球的差別',url:'https://arxiv.org/abs/1712.01567'},
  ]),
});
export const STOKES_GRAVITY=9.81;
export const STOKES_REFERENCE=Object.freeze({radiusM:2e-6,viscosityPaS:.002,densityDifferenceKgM3:100,fluidDensityKgM3:1000});
const finite=(value,name)=>{if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(`${name} must be finite`);};
const positive=(value,name)=>{finite(value,name);if(value<=0)throw new RangeError(`${name} must be positive`);};

/** Isolated rigid sphere, no-slip boundary, Newtonian continuous phase, terminal drift.
 * SI units. Density difference is rho_continuous - rho_particle; positive v is UP.
 * This algebra does not itself establish validity for a real droplet or concentrated emulsion.
 */
export function stokesVelocity({radiusM,viscosityPaS,densityDifferenceKgM3,gravityMps2=STOKES_GRAVITY}={}){
  positive(radiusM,'radius');positive(viscosityPaS,'dynamic viscosity');finite(densityDifferenceKgM3,'density difference');positive(gravityMps2,'gravity');
  if(densityDifferenceKgM3===0)return 0;
  const velocity=(2/9)*densityDifferenceKgM3*gravityMps2*radiusM*radiusM/viscosityPaS;
  if(!Number.isFinite(velocity)||velocity===0)throw new RangeError('Velocity is outside the numeric range');
  return velocity;
}

/** Reynolds number based on particle DIAMETER 2r and continuous-phase density. */
export function particleReynolds({radiusM,velocityMps,viscosityPaS,fluidDensityKgM3}={}){
  positive(radiusM,'radius');finite(velocityMps,'velocity');positive(viscosityPaS,'dynamic viscosity');positive(fluidDensityKgM3,'continuous-phase density');
  const re=2*radiusM*Math.abs(velocityMps)*fluidDensityKgM3/viscosityPaS;
  if(!Number.isFinite(re)||(velocityMps!==0&&re===0))throw new RangeError('Reynolds number is outside the numeric range');
  return re;
}

export function stokesDrift(parameters={}){
  const {fluidDensityKgM3=1000,densityDifferenceKgM3}=parameters;
  positive(fluidDensityKgM3,'continuous-phase density');finite(densityDifferenceKgM3,'density difference');
  const particleDensityKgM3=fluidDensityKgM3-densityDifferenceKgM3;
  positive(particleDensityKgM3,'particle density');
  const velocityMps=stokesVelocity(parameters),reynolds=particleReynolds({...parameters,velocityMps,fluidDensityKgM3});
  const speedMmPerHour=Math.abs(velocityMps)*3.6e6;
  if(!Number.isFinite(speedMmPerHour))throw new RangeError('Display speed is outside the numeric range');
  return {velocityMps,speedMmPerHour,reynolds,particleDensityKgM3,direction:velocityMps>0?'up':velocityMps<0?'down':'neutral',lowRe:reynolds<.1};
}

const number=(value,digits=2)=>Number(value.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits});
const scientific=value=>value===0?'0':value.toExponential(2).replace('e-',' × 10^−').replace('e+',' × 10^');
const sign=value=>`${value>0?'+':''}${number(value,0)}`;
const parameters=state=>({radiusM:state.radius*1e-6,viscosityPaS:state.viscosity*.001,densityDifferenceKgM3:state.difference,fluidDensityKgM3:1000});
const directionLabel={up:'向上 · 乳析方向',down:'向下 · 沉降方向',neutral:'無重力淨漂移'};
const controls=[
  {name:'radius',label:'半徑 r',min:1,max:20,step:'any',format:v=>`${number(v,2)} µm`},
  {name:'viscosity',label:'連續相動力黏度 μ',min:1,max:100,step:1,format:v=>`${number(v,0)} mPa·s`},
  {name:'difference',label:'密度差 Δρ = ρc − ρp',min:-300,max:300,step:10,format:v=>`${sign(v)} kg/m³`},
];

function chart(state,view){
  const L=54,R=375,T=117,B=268,xMax=Math.max(4,Math.ceil(state.radius*1.5));
  const speedAt=(radius,base)=>Math.abs(stokesVelocity({...base,radiusM:Math.max(radius,1e-12)*1e-6}))*3.6e6;
  const reference=speedAt(xMax,STOKES_REFERENCE),current=speedAt(xMax,parameters(state)),yMax=Math.max(reference,current)*1.12;
  const x=v=>L+v/xMax*(R-L),y=v=>B-v/yMax*(B-T);
  const path=base=>Array.from({length:81},(_,i)=>{const radius=i*xMax/80;return `${i?'L':'M'}${x(radius).toFixed(2)},${y(i===0?0:speedAt(radius,base)).toFixed(2)}`;}).join(' ');
  const radiusDraw=10+state.radius;
  const arrow=view.direction==='neutral'?'<path d="M304,44h28"/>':view.direction==='up'?'<path d="M318,69V26m-7,8 7,-8 7,8"/>':'<path d="M318,26V69m-7,-8 7,8 7,-8"/>';
  return `<svg viewBox="0 0 400 317" role="img" aria-label="${esc(`剛性球示例，半徑 ${number(state.radius,2)} 微米，${directionLabel[view.direction]}，速率 ${number(view.speedMmPerHour,4)} 毫米每小時；曲線為速率大小，不含群聚或融合。`)}" xmlns="http://www.w3.org/2000/svg"><circle data-colloid-particle="true" cx="70" cy="48" r="${radiusDraw}" fill="#eac9ad" stroke="#b9543a" stroke-width="2"/><path d="M70,48h${radiusDraw}" stroke="#b9543a" stroke-width="1.5"/><text x="113" y="43">r = ${number(state.radius,2)} µm</text><text x="113" y="66" class="colloid-svg-small">孤立小球示意</text><g data-colloid-direction="${view.direction}" stroke="#647b74" fill="none" stroke-width="2.5">${arrow}</g><text x="318" y="90" text-anchor="middle" class="colloid-svg-small">${view.direction==='up'?'向上':view.direction==='down'?'向下':'無淨漂移'}</text><text x="${L}" y="108">速率大小 (mm/h)</text>${[0,.5,1].map(ratio=>`<path class="food-exp-grid" d="M${L},${y(ratio*yMax)}H${R}"/><text x="${L-8}" y="${y(ratio*yMax)+5}" text-anchor="end">${number(ratio*yMax,yMax<10?1:0)}</text>`).join('')}<path class="food-exp-baseline" data-colloid-curve="reference" d="${path(STOKES_REFERENCE)}"/><path class="food-exp-curve" data-colloid-curve="current" d="${path(parameters(state))}"/><path class="food-exp-marker-guide" d="M${x(state.radius)},${y(view.speedMmPerHour)}V${B}"/><circle data-colloid-marker="true" cx="${x(state.radius)}" cy="${y(view.speedMmPerHour)}" r="5" fill="#b9543a" stroke="#fffdf9" stroke-width="2"/>${[0,.5,1].map(ratio=>`<text x="${x(xMax*ratio)}" y="290" text-anchor="middle">${number(xMax*ratio,1)}</text>`).join('')}<text x="${R}" y="314" text-anchor="end">半徑 r (µm)</text></svg>`;
}

function controlHTML(control,state,prefix){
  const id=`${prefix}-${control.name}`,formatted=control.format(state[control.name]);
  return `<div class="food-exp-control"><div class="food-exp-control-label"><label for="${id}">${control.label}</label><output for="${id}" data-colloid-reading="${control.name}">${esc(formatted)}</output></div><input id="${id}" type="range" data-colloid-input="${control.name}" min="${control.min}" max="${control.max}" step="${control.step}" value="${state[control.name]}" aria-valuetext="${esc(formatted)}"><div class="food-exp-endpoints" aria-hidden="true"><span>${esc(control.format(control.min))}</span><span>${esc(control.format(control.max))}</span></div></div>`;
}
let instance=0;
/** Host loads food-experiments.css and colloid-experiments.css. No timers or global listeners. */
export function mountColloidExperiment(container,id){
  if(!COLLOID_EXPERIMENT_IDS.includes(id))throw new RangeError(`Unknown colloid experiment: ${id}`);
  if(!container||typeof container.querySelector!=='function'||typeof container.addEventListener!=='function')throw new TypeError('A DOM container is required');
  const state={radius:2,viscosity:2,difference:100},prefix=`colloid-${++instance}`;
  container.innerHTML=`<section class="food-experiment colloid-experiment" data-colloid-experiment="${id}" aria-labelledby="${prefix}-title"><header class="food-exp-heading"><p class="food-exp-kicker">動手比較</p><h3 id="${prefix}-title">把粒徑減半，上浮會慢多少？</h3><p class="food-exp-hint">先改半徑，再試黏度與密度差；觀察速率和方向。</p></header><p class="colloid-boundary">孤立剛性球的重力漂移示例，參數未對應特定食品；沒有模擬絮凝或聚結。</p><div class="colloid-layout"><div class="food-exp-stage colloid-stage"><div class="food-exp-figure colloid-figure"></div><p class="colloid-legend"><span>目前參數</span><span class="colloid-reference">參考：μ = 2 mPa·s、Δρ = +100 kg/m³</span></p><p class="colloid-formula"><span>v↑ = 2 Δρ g r² / (9 μ)</span><small>Δρ = ρc − ρp；向上為正，圖中為 |v|</small></p><p class="food-exp-caption">圖軸隨參數調整；圓與箭頭為示意，不表示移動時間。</p></div><div class="colloid-panel"><div class="food-exp-result" aria-live="polite" aria-atomic="true"><output class="food-exp-value colloid-value"></output><span class="food-exp-result-label colloid-direction"></span></div>${controls.map(control=>controlHTML(control,state,prefix)).join('')}<div class="colloid-actions"><button type="button" data-colloid-action="halve">半徑減半</button><button type="button" data-colloid-action="reset">重設示例</button></div><dl class="colloid-readings"></dl><p class="food-exp-observation colloid-observation"></p><details class="food-exp-details"><summary>模型條件、單位與來源</summary><div class="food-exp-details-body"><p class="food-exp-equation">Re = ρc |v| (2r) / μ<br>1 µm = 10⁻⁶ m；1 mPa·s = 10⁻³ Pa·s<br>1 m/s = 3.6 × 10⁶ mm/h</p><p class="food-exp-assumptions">ρc 是連續相密度，固定示例值 1000 kg/m³；ρp = ρc − Δρ。g = 9.81 m/s²。這裡的黏度是固定溫度下的牛頓流體動力黏度。須為稀分散、孤立且球形的剛性粒子、無滑移界面，已達終端速度，Re 遠小於 1，且忽略容器壁、粒子相互作用、布朗擴散與界面流動。本活動以 Re &lt; 0.1 作教學檢查，並非所有假設均已獲驗證。真正液滴可有內部循環與界面效應；濃乳液、絮凝、非牛頓流體或凝膠不能直接套用。密度差為零只表示無重力淨漂移，不保證不會擴散、絮凝或聚結。以距離除以此速度也不能得到真實乳化食品的分離時間、保存期或安全判定。</p><ul class="food-exp-sources">${COLLOID_SOURCES[id].map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></li>`).join('')}</ul></div></details></div></div></section>`;
  const find=selector=>container.querySelector(selector);
  function draw(){
    const view=stokesDrift(parameters(state));
    find('.colloid-value').textContent=`${number(view.speedMmPerHour,3)} mm/h`;
    find('.colloid-direction').textContent=directionLabel[view.direction];
    find('.colloid-figure').innerHTML=chart(state,view);
    find('.colloid-readings').innerHTML=`<div><dt>粒子雷諾數 Re</dt><dd>${esc(scientific(view.reynolds))}</dd></div><div><dt>ρp · 小球密度</dt><dd>${number(view.particleDensityKgM3,0)} kg/m³</dd></div>`;
    find('.colloid-observation').textContent=view.direction==='neutral'?'密度匹配使模型淨漂移為零；這不代表其他失穩過程停止。':`Re < 0.1，符合此處的低慣性檢查。其餘條件相同時，半徑減半使速率降為 1/4；黏度加倍使速率降為 1/2。`;
    for(const control of controls){const input=find(`[data-colloid-input="${control.name}"]`),formatted=control.format(state[control.name]);input.value=state[control.name];input.setAttribute('aria-valuetext',formatted);find(`[data-colloid-reading="${control.name}"]`).textContent=formatted;}
    find('[data-colloid-action="halve"]').disabled=state.radius<2;
  }
  const onInput=event=>{const control=controls.find(item=>item.name===event.target?.dataset?.colloidInput);if(!control||String(event.target.value).trim()==='')return;const value=Number(event.target.value);if(!Number.isFinite(value))return;state[control.name]=Math.max(control.min,Math.min(control.max,value));draw();};
  const onClick=event=>{const action=event.target?.closest?.('[data-colloid-action]')?.dataset?.colloidAction;if(action==='halve'){if(state.radius<2)return;state.radius=state.radius/2;}else if(action==='reset'){Object.assign(state,{radius:2,viscosity:2,difference:100});}else{return;}draw();};
  container.addEventListener('input',onInput);container.addEventListener('click',onClick);draw();
  return ()=>{container.removeEventListener('input',onInput);container.removeEventListener('click',onClick);};
}
