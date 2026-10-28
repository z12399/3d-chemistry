import {escapeHTML as esc} from './storage.js';

export const WATER_PHASE_IDS=Object.freeze(['water-gab','glass-transition']);
const modelSource={title:'Kashiwakura 等，2024 · GAB 與 Gordon–Taylor 方程',url:'https://www.jstage.jst.go.jp/article/jag/71/1/71_jag.JAG-2023_0015/_html/-char/en'};
export const WATER_PHASE_SOURCES=Object.freeze({
  'water-gab':Object.freeze([
    modelSource,
    {title:'Lewicki，1997 · GAB 參數與曲線適用範圍',url:'https://doi.org/10.1111/j.1365-2621.1997.tb02131.x'},
    {title:'Aguirre-Álvarez 等，2013 · 實測吸濕與脫濕遲滯',url:'https://doi.org/10.1080/19476337.2012.692122'},
  ]),
  'glass-transition':Object.freeze([
    modelSource,
    {title:'García-Coronado 等，2020 · DSC 與食品狀態圖',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7570093/'},
    {title:'Gordon 與 Taylor，1952 · 原始二元模型',url:'https://doi.org/10.1002/jctb.5010020901'},
  ]),
});

function finite(value,name){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(`${name} must be finite`);}
function positive(value,name){finite(value,name);if(value<=0)throw new RangeError(`${name} must be positive`);}
function nonnegative(value,name){finite(value,name);if(value<0)throw new RangeError(`${name} must be nonnegative`);}

/** Restricted teaching domain: 0 ≤ aw < 1, xm > 0, C > 0, 0 < K ≤ 1.
 * Returns g water / g dry matter. xm uses the same dry basis.
 * Rejects the immediate vicinity of the model pole; these are not fitted data.
 */
export function gabMoisture(aw,{xm,c,k}={}){
  nonnegative(aw,'aw');positive(xm,'xm');positive(c,'C');positive(k,'K');
  if(aw>=1||k>1)throw new RangeError('Teaching GAB domain requires aw < 1 and K ≤ 1');
  const z=k*aw,remaining=1-z;
  if(remaining<1e-6)throw new RangeError('Too close to the GAB pole');
  if(aw===0)return 0;
  const cz=c*z;
  const result=xm*(cz/(remaining+cz))/remaining;
  if(!Number.isFinite(result))throw new RangeError('GAB result exceeds numeric range');
  return result;
}

/** X = mass water / mass dry solids; w = mass water / total mass. */
export function dryBasisToWet(x){nonnegative(x,'dry-basis ratio');return x/(1+x);}
export function wetBasisToDry(w){
  nonnegative(w,'wet-basis fraction');
  if(w>=1)throw new RangeError('A finite dry basis requires a wet fraction below 1');
  return w/(1-w);
}

export const WATER_TG_K=136; // A literature approximation adopted for this illustration.
export const GAB_REFERENCE=Object.freeze({xm:.06,c:8,k:.8});
export function celsiusToKelvin(value){finite(value,'temperature in °C');const k=value+273.15;positive(k,'temperature in K');return k;}
export function kelvinToCelsius(value){positive(value,'temperature in K');return value-273.15;}

/** Binary homogeneous amorphous solid/water model. All Tg inputs and output are K.
 * waterFraction is wet-basis mass fraction; k multiplies the WATER term.
 * Endpoints are algebraic limits, not assertions about phase stability.
 */
export function gordonTaylorTg({waterFraction,dryTgK,waterTgK=WATER_TG_K,k}={}){
  nonnegative(waterFraction,'water mass fraction');positive(dryTgK,'dry Tg in K');positive(waterTgK,'water Tg in K');positive(k,'k');
  if(waterFraction>1)throw new RangeError('Water mass fraction must not exceed 1');
  if(waterFraction===0)return dryTgK;
  if(waterFraction===1)return waterTgK;
  const dryWeight=1-waterFraction,waterWeight=k*waterFraction,denominator=dryWeight+waterWeight;
  // Normalize weights before multiplying by temperatures, avoiding k*T overflow.
  const value=(dryWeight/denominator)*dryTgK+(waterWeight/denominator)*waterTgK;
  if(!Number.isFinite(value)||value<=0)throw new RangeError('Tg exceeds numeric range');
  return value;
}

const number=(value,digits=2)=>Number(value.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits});
const signed=(value,digits=1)=>`${value>0?'+':''}${number(value,digits)}`;
const gabParameters=state=>({xm:state.monolayer/100,c:state.c,k:state.k});
const tgAt=(waterPercent,state)=>gordonTaylorTg({waterFraction:waterPercent/100,dryTgK:celsiusToKelvin(state.dryTg),k:state.k});
const svg=(label,body)=>`<svg viewBox="0 0 400 264" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

function plotFrame({xMin=0,xMax,yMin=0,yMax,yLabel,xLabel,xTicks,yTicks}){
  const L=54,R=376,T=33,B=209,x=value=>L+(value-xMin)/(xMax-xMin)*(R-L),y=value=>B-(value-yMin)/(yMax-yMin)*(B-T);
  const grid=yTicks.map(value=>`<path class="food-exp-grid" d="M${L},${y(value)}H${R}"/><text x="${L-9}" y="${y(value)+5}" text-anchor="end">${number(value,1)}</text>`).join('');
  const axes=`<text x="${L}" y="18">${esc(yLabel)}</text>${grid}${xTicks.map(value=>`<text x="${x(value)}" y="${B+23}" text-anchor="middle">${number(value)}</text>`).join('')}<text x="${R}" y="260" text-anchor="end">${esc(xLabel)}</text>`;
  return {L,R,T,B,x,y,axes};
}

function gabChart(state,a,b){
  const params=gabParameters(state),top=Math.max(gabMoisture(.9,GAB_REFERENCE),gabMoisture(.9,params))*100;
  const maximum=Math.ceil(top/10)*10;
  const f=plotFrame({xMax:.9,yMax:maximum,yLabel:'g 水 / 100 g 乾物質',xLabel:'水活性 aw（無因次）',xTicks:[0,.3,.6,.9],yTicks:[0,maximum/2,maximum]});
  const curve=(parameters,role)=>`<path data-phase-curve="${role}" class="${role==='a'?'food-exp-baseline':'food-exp-curve'}" d="${Array.from({length:91},(_,i)=>`${i?'L':'M'}${f.x(i/100).toFixed(2)},${f.y(gabMoisture(i/100,parameters)*100).toFixed(2)}`).join(' ')}"/>`;
  const marks=`<path class="food-exp-marker-guide" d="M${f.x(state.aw)},${f.T}V${f.B}"/><circle data-phase-marker="a" cx="${f.x(state.aw)}" cy="${f.y(a*100)}" r="5" fill="#647b74" stroke="#fffdf9" stroke-width="2"/><circle data-phase-marker="b" cx="${f.x(state.aw)}" cy="${f.y(b*100)}" r="5" fill="#b9543a" stroke="#fffdf9" stroke-width="2"/>`;
  return svg(`未擬合 GAB 示意；aw ${number(state.aw)}，A ${number(a*100)}、B ${number(b*100)} g 水每 100 g 乾物質`,f.axes+curve(GAB_REFERENCE,'a')+curve(params,'b')+marks);
}

function glassChart(state,tgC){
  const low=kelvinToCelsius(tgAt(20,state));
  const bottom=Math.floor(Math.min(low,state.temperature)/20)*20-10,top=Math.ceil(Math.max(state.dryTg,state.temperature)/20)*20+10;
  const middle=(bottom+top)/2;
  const f=plotFrame({xMax:20,yMin:bottom,yMax:top,yLabel:'溫度 (°C)',xLabel:'水分 (g / 100 g 混合物，濕基)',xTicks:[0,5,10,15,20],yTicks:[bottom,middle,top]});
  const curve=`<path class="food-exp-curve" data-phase-curve="tg" d="${Array.from({length:101},(_,i)=>`${i?'L':'M'}${f.x(i/5).toFixed(2)},${f.y(kelvinToCelsius(tgAt(i/5,state))).toFixed(2)}`).join(' ')}"/>`;
  const reference=`<path class="food-exp-baseline" data-phase-reference="temperature" d="M${f.L},${f.y(state.temperature)}H${f.R}"/>`;
  const marks=`<path class="food-exp-marker-guide" d="M${f.x(state.waterPercent)},${f.y(tgC)}V${f.B}"/><circle data-phase-marker="tg" cx="${f.x(state.waterPercent)}" cy="${f.y(tgC)}" r="5" fill="#b9543a" stroke="#fffdf9" stroke-width="2"/>`;
  return svg(`Gordon–Taylor 示意；水分 ${number(state.waterPercent,1)}% 濕基，Tg ${number(tgC,1)}°C，觀察溫度 ${number(state.temperature,1)}°C`,f.axes+reference+curve+marks);
}

const definitions={
  'water-gab':{
    question:'水活性一樣，含水量也一樣嗎？',
    hint:'移動 aw，再比較兩個模型吸入多少水。',
    boundary:'固定同一溫度的未擬合示例；A、B 不是吸濕／脫濕遲滯曲線。',
    initial:{aw:.5,monolayer:10,c:8,k:.8},
    main:{name:'aw',label:'水活性 aw',min:0,max:.9,step:.01,format:v=>v.toFixed(2)},
    advanced:[
      {name:'monolayer',label:'B 的 Xm · g 水 / 100 g 乾物質',min:3,max:12,step:.1,format:v=>number(v,1)},
      {name:'c',label:'B 的 C · 無因次',min:6,max:20,step:.5,format:v=>number(v,1)},
      {name:'k',label:'B 的 K · 無因次',min:.65,max:.9,step:.01,format:v=>v.toFixed(2)},
    ],
    actions:[['compare','比較示例'],['match','讓參數相同']],
    detailsTitle:'調整 B 與查看假設',
    legend:'<span class="phase-legend-reference">A · 固定參數</span><span class="phase-legend-main">B · 可調參數</span>',
    caption:'兩組參數各自描述一條路徑；縱軸依參數範圍調整。',
    formula:'X = Xm C K aw / [(1 − K aw)(1 − K aw + C K aw)]',
    formulaNote:'X：g 水 / g 乾物質；圖中乘 100 顯示',
    conversions:'X = 水質量 / 乾物質量；w = X / (1 + X)',
    assumptions:'X、Xm 以 g 水/g 乾物質計，圖中乘 100 顯示。A 固定 Xm = 0.06、C = 8、K = 0.80；B 的初始 Xm = 0.10、C = 8、K = 0.80，皆未擬合任何食品。Xm 是模型的單分子層容量參數，C、K 描述模型中的水合作用差異，不能當作通用食品常數或安全門檻。本圖假設同一固定溫度、沿各自單一吸濕路徑達到平衡；溫度改變、脫濕歷史、結晶或結構改變可能需要另一組實測資料。沒有實測循環資料，所以不畫遲滯環；也不估計達平衡所需時間。aw 控制在 0–0.90，K ≤ 0.90，使 1 − K aw ≥ 0.19。不能用一個含水量、在未知材料與條件時唯一反推出 aw。',
    render(state){
      const a=gabMoisture(state.aw,GAB_REFERENCE),b=gabMoisture(state.aw,gabParameters(state));
      const same=Math.abs(a-b)<1e-10;
      return {value:number(b*100,2),label:'B · g 水 / 100 g 乾物質',chart:gabChart(state,a,b),
        readings:[['A · 同一 aw 的乾基含水量',`${number(a*100,2)} g / 100 g 乾物質`],['B · 換成濕基',`${number(dryBasisToWet(b)*100,2)}%`]],
        observation:state.aw===0?'兩條曲線都回到模型的零含水端點；這不代表實物可以瞬間完全乾燥。':same?'此刻含水量相同。單一交點或一組相同參數，不能證明所有食品都共用這條曲線。':`同一 aw 下，A 與 B 的乾基含水量不同；需要材料、溫度與吸脫濕歷史，才能解讀實際樣品。`,
      };
    },
    act(action,state){
      if(action==='match'){state.monolayer=6;state.c=8;state.k=.8;}
      if(action==='compare'){state.monolayer=10;state.c=8;state.k=.8;}
    },
    active(action,state){return state.c===8&&state.k===.8&&state.monolayer===(action==='match'?6:10);},
  },
  'glass-transition':{
    question:'加一點水，玻璃轉移溫度怎麼變？',
    hint:'比較較乾與較濕的狀態，觀察同一溫度相對於 Tg 的位置。',
    boundary:'均一非晶固體／水的二元示例，參數未擬合；Tg 不保證穩定性、安全或保存期限。',
    initial:{waterPercent:4,dryTg:80,k:5,temperature:25},
    main:{name:'waterPercent',label:'水分 · g / 100 g 混合物（濕基）',min:0,max:20,step:.1,format:v=>`${number(v,1)}%`},
    advanced:[
      {name:'temperature',label:'觀察溫度 T',min:-10,max:60,step:1,format:v=>`${number(v,0)}°C`},
      {name:'dryTg',label:'乾燥固體 Tg,s · 示意',min:40,max:160,step:1,format:v=>`${number(v,0)}°C`},
      {name:'k',label:'Gordon–Taylor k · 無因次',min:2,max:8,step:.1,format:v=>number(v,1)},
    ],
    actions:[['drier','較乾：2%'],['wetter','較濕：10%']],
    detailsTitle:'改變溫度與模型參數',
    legend:'<span class="phase-legend-main">模型 Tg</span><span class="phase-legend-reference">觀察溫度 T</span>',
    caption:'玻璃轉移是量測與時間尺度相關的區間，不是熔點。',
    formula:'Tg = [(1 − w) Tg,s + k w Tg,w] / [(1 − w) + k w]',
    formulaNote:'以 K 計算，轉 °C 顯示；w 為濕基水質量分率',
    conversions:'w = 水質量 / 混合物總質量<br>X = w / (1 − w)；T(K) = T(°C) + 273.15',
    assumptions:'假設乾燥固體與水形成均一、可混溶的非晶相；k 乘在水項。初始 Tg,s = 80°C、k = 5 為未擬合示例，水端點 Tg,w 採文獻常用近似 136 K（−137.15°C），不是水的冰點。所有 Tg 先用 K 計算，再轉 °C 顯示。w 為濕基質量分率，X 才是乾基比值，不能互換代入。本圖未計入結晶、冰形成、相分離、化學反應或吸濕速率。實際 Tg 應由指定含水量、熱歷史與掃描條件的量測確認；高於 Tg 可能使分子運動加快，但不必然立刻結塊或塌陷，低於 Tg 也不保證所有變化停止。不可由此圖估計通用保存期或食品安全；也不能由水分直接取得 aw。',
    render(state){
      const tgK=tgAt(state.waterPercent,state),tgC=kelvinToCelsius(tgK),difference=state.temperature-tgC;
      const relation=Math.abs(difference)<.05?'接近':difference>0?'高於':'低於';
      return {value:`${number(tgC,1)}°C`,label:'模型玻璃轉移溫度 Tg',chart:glassChart(state,tgC),
        readings:[['水分 · 乾基',`${number(wetBasisToDry(state.waterPercent/100)*100,2)} g / 100 g 乾物質`],['觀察溫度 T − Tg',`${signed(difference)}°C`]],
        observation:`觀察溫度 ${number(state.temperature)}°C ${relation}模型 Tg。增加水分會降低這組參數下的 Tg；實際是否變黏，仍取決於材料與時間。`,
      };
    },
    act(action,state){if(action==='drier')state.waterPercent=2;if(action==='wetter')state.waterPercent=10;},
    active(action,state){return state.waterPercent===(action==='drier'?2:10);},
  },
};

let instance=0;
function controlHTML(control,state,prefix){
  const id=`${prefix}-${control.name}`,formatted=control.format(state[control.name]);
  return `<div class="food-exp-control"><div class="food-exp-control-label"><label for="${id}">${control.label}</label><output for="${id}" data-phase-reading="${control.name}">${esc(formatted)}</output></div><input id="${id}" type="range" data-phase-input="${control.name}" min="${control.min}" max="${control.max}" step="${control.step}" value="${state[control.name]}" aria-valuetext="${esc(formatted)}"><div class="food-exp-endpoints" aria-hidden="true"><span>${esc(control.format(control.min))}</span><span>${esc(control.format(control.max))}</span></div></div>`;
}

/** Host loads food-experiments.css and water-phase-experiments.css. */
export function mountWaterPhaseExperiment(container,id){
  if(!WATER_PHASE_IDS.includes(id))throw new RangeError(`Unknown water-phase experiment: ${id}`);
  if(!container||typeof container.querySelector!=='function'||typeof container.addEventListener!=='function')throw new TypeError('A DOM container is required');
  const definition=definitions[id],state={...definition.initial},prefix=`water-phase-${++instance}`,controls=[definition.main,...definition.advanced];
  container.innerHTML=`<section class="food-experiment water-phase-experiment" data-water-phase="${id}" aria-labelledby="${prefix}-title"><header class="food-exp-heading"><p class="food-exp-kicker">動手比較</p><h3 id="${prefix}-title">${definition.question}</h3><p class="food-exp-hint">${definition.hint}</p></header><p class="phase-boundary">${definition.boundary}</p><div class="phase-layout"><div class="food-exp-stage phase-stage"><div class="food-exp-figure phase-figure"></div><p class="phase-legend">${definition.legend}</p><p class="phase-model-equation"><span>${esc(definition.formula)}</span><small>${esc(definition.formulaNote)}</small></p><p class="food-exp-caption">${definition.caption}</p></div><div class="phase-panel"><div class="food-exp-result" aria-live="polite" aria-atomic="true"><output class="food-exp-value phase-value"></output><span class="food-exp-result-label phase-value-label"></span></div>${controlHTML(definition.main,state,prefix)}<div class="phase-actions">${definition.actions.map(([action,label])=>`<button type="button" data-phase-action="${action}">${label}</button>`).join('')}</div><dl class="phase-readings"></dl><p class="food-exp-observation phase-observation"></p><details class="food-exp-details"><summary>${definition.detailsTitle}</summary><div class="food-exp-details-body">${definition.advanced.map(control=>controlHTML(control,state,prefix)).join('')}<p class="food-exp-equation">${definition.conversions}</p><p class="food-exp-assumptions">${definition.assumptions}</p><ul class="food-exp-sources">${WATER_PHASE_SOURCES[id].map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></li>`).join('')}</ul></div></details></div></div></section>`;
  const find=selector=>container.querySelector(selector);
  function draw(){
    const view=definition.render(state);
    find('.phase-value').textContent=view.value;find('.phase-value-label').textContent=view.label;
    find('.phase-figure').innerHTML=view.chart;find('.phase-observation').textContent=view.observation;
    find('.phase-readings').innerHTML=view.readings.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('');
    for(const control of controls){
      const input=find(`[data-phase-input="${control.name}"]`),formatted=control.format(state[control.name]);
      input.value=state[control.name];input.setAttribute('aria-valuetext',formatted);
      find(`[data-phase-reading="${control.name}"]`).textContent=formatted;
    }
    for(const [action] of definition.actions)find(`[data-phase-action="${action}"]`).setAttribute('aria-pressed',String(definition.active(action,state)));
  }
  const onInput=event=>{
    const control=controls.find(item=>item.name===event.target?.dataset?.phaseInput);if(!control)return;
    const value=Number(event.target.value);if(!Number.isFinite(value))return;
    state[control.name]=Math.max(control.min,Math.min(control.max,value));draw();
  };
  const onClick=event=>{
    const action=event.target?.closest?.('[data-phase-action]')?.dataset?.phaseAction;
    if(!definition.actions.some(([candidate])=>candidate===action))return;
    definition.act(action,state);draw();
  };
  container.addEventListener('input',onInput);container.addEventListener('click',onClick);draw();
  return ()=>{container.removeEventListener('input',onInput);container.removeEventListener('click',onClick);};
}
