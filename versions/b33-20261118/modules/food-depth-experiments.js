import {escapeHTML as esc} from './storage.js';

export const DEPTH_EXPERIMENT_IDS=Object.freeze(['oxidation-sequence','starch-de']);
export const DEPTH_EXPERIMENT_SOURCES=Object.freeze({
  'oxidation-sequence':Object.freeze([
    {title:'大學物理化學教材 · 連續一級反應',url:'https://chem.libretexts.org/Courses/Lebanon_Valley_College/CHM_312%3A_Physical_Chemistry_II_%28Lebanon_Valley_College%29/09%3A_Chemical_Kinetics/9.07%3A_Complex_Rate_Laws'},
    {title:'FAO · 氧化指標的判讀限制',url:'https://www.fao.org/4/v7180e/v7180e09.htm'},
  ]),
  'starch-de':Object.freeze([
    {title:'FAO · DE 的乾物質定義',url:'https://www.fao.org/4/x5032e/x5032e06.htm'},
    {title:'Rong 等，2009 · 理論 DE、分子量與分析限制',url:'https://ift.onlinelibrary.wiley.com/doi/10.1111/j.1750-3841.2008.00993.x'},
  ]),
});

function finite(value,name){
  if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(`${name} must be a finite number`);
}
function nonnegative(value,name){finite(value,name);if(value<0)throw new RangeError(`${name} must be nonnegative`);}
function fraction(value,name){finite(value,name);if(value<0||value>1)throw new RangeError(`${name} must be between 0 and 1`);}

// Positive leading term for S at very early progress. Subtracting 1 − A − P
// here would erase the O(progress²) secondary pool through cancellation.
function earlySecondary(a,b){
  let polynomial=1,bPower=1,factorial=2,series=.5;
  for(let order=1;order<=10;order++){
    bPower*=b;polynomial=a*polynomial+bPower;factorial*=order+2;
    series+=(order%2?-1:1)*polynomial/factorial;
  }
  return a*b*series;
}

/**
 * A → P → S, initially A=1 and P=S=0. progress = k1*t, rateRatio = k2/k1.
 * Fractions are conserved abstract model units, not measured lipid mass or PV.
 * k1 > 0 is implicit in the dimensionless scale; rateRatio = 0 is permitted.
 */
export function consecutivePools(progress,rateRatio){
  nonnegative(progress,'progress');nonnegative(rateRatio,'rateRatio');
  if(progress===0)return {a:1,p:0,s:0};
  const a=Math.exp(-progress),consumed=-Math.expm1(-progress);
  if(rateRatio===0)return {a,p:consumed,s:0};
  const second=rateRatio*progress,difference=Math.abs(rateRatio-1),x=difference*progress;
  const slowExponential=Math.exp(-Math.min(progress,second));
  let p;
  if(difference===0)p=progress*a;
  else if(x<1e-3)p=progress*slowExponential*(x===0?1:-Math.expm1(-x)/x);
  else p=slowExponential*(-Math.expm1(-x))/difference;
  let s;
  if(Math.max(progress,second)<.05)s=earlySecondary(progress,second);
  else if(rateRatio<.5)s=(-Math.expm1(-second)-rateRatio*consumed)/(1-rateRatio);
  else if(rateRatio>2)s=(consumed-(-Math.expm1(-second))/rateRatio)/(1-1/rateRatio);
  else s=consumed-p;
  // Roundoff only: the analytic solution is nonnegative and sums to one.
  p=Math.max(0,Math.min(1,p));s=Math.max(0,Math.min(1,s));
  const total=a+p+s;
  return {a:a/total,p:p/total,s:s/total};
}

/** Location of the primary-pool maximum; no finite peak when k2 = 0. */
export function primaryPeakProgress(rateRatio){
  nonnegative(rateRatio,'rateRatio');
  if(rateRatio===0)return Infinity;
  if(rateRatio===1)return 1;
  const difference=rateRatio-1;
  return (Math.abs(difference)<.1?Math.log1p(difference):Math.log(rateRatio))/difference;
}

/** One ideal reducing, linear glucose chain. DP counts whole glucose units. */
export function idealChainDE(dp){
  finite(dp,'DP');
  if(!Number.isSafeInteger(dp)||dp<1)throw new RangeError('DP must be a positive safe integer');
  return 18000/(162*dp+18);
}

export const STARCH_COMPONENTS=Object.freeze([
  Object.freeze({id:'glucose',label:'葡萄糖',dp:1,de:idealChainDE(1),color:'#b9543a'}),
  Object.freeze({id:'maltose',label:'麥芽糖',dp:2,de:idealChainDE(2),color:'#b49a58'}),
  Object.freeze({id:'dp10',label:'DP10 鏈',dp:10,de:idealChainDE(10),color:'#386e79'}),
]);

/** Dry-mass fractions must account for the entire three-component mixture. */
export function starchMixtureDE(fractions){
  if(!fractions||typeof fractions!=='object'||Array.isArray(fractions))throw new TypeError('A three-component mixture is required');
  if(Object.keys(fractions).some(key=>!STARCH_COMPONENTS.some(component=>component.id===key)))throw new RangeError('Unsupported mixture component');
  for(const component of STARCH_COMPONENTS)fraction(fractions[component.id],component.id);
  const sum=STARCH_COMPONENTS.reduce((total,component)=>total+fractions[component.id],0);
  if(Math.abs(sum-1)>1e-12)throw new RangeError('Dry-mass fractions must sum to 1');
  return STARCH_COMPONENTS.reduce((de,component)=>de+fractions[component.id]*component.de,0)/sum;
}

/** First allocate glucose; then divide the remaining mass between maltose and DP10. */
export function splitStarchMixture(glucose,maltoseOfRemainder){
  fraction(glucose,'glucose');fraction(maltoseOfRemainder,'maltoseOfRemainder');
  const remaining=1-glucose;
  return {glucose,maltose:remaining*maltoseOfRemainder,dp10:remaining*(1-maltoseOfRemainder)};
}

export const SAME_DE_EXAMPLES=Object.freeze([
  Object.freeze({id:'maltose',label:'全是麥芽糖',glucose:0,maltoseOfRemainder:1}),
  Object.freeze({id:'glucose-dp10',label:'葡萄糖＋DP10',glucose:80/171,maltoseOfRemainder:0}),
]);

const number=(value,digits=2)=>Number(value.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits});
const percent=(value,digits=1)=>`${number(value*100,digits)}%`;
const poolColors={a:'#77867d',p:'#b9543a',s:'#286e64'};
let instance=0;
const chart={L:49,R:377,T:26,B:183,x:t=>49+t/8*328,y:f=>183-f*157};
const svg=(label,content,height=237)=>`<svg viewBox="0 0 400 ${height}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;

function oxidationChart(progress,ratio,current){
  const g=chart,curves=['a','p','s'].map(key=>{
    const d=Array.from({length:161},(_,i)=>{const t=i/20;return `${i?'L':'M'}${g.x(t).toFixed(2)},${g.y(consecutivePools(t,ratio)[key]).toFixed(2)}`;}).join(' ');
    return `<path d="${d}" data-depth-curve="${key}" class="depth-curve depth-curve-${key}"/>`;
  }).join('');
  const grid=[0,.5,1].map(f=>`<path d="M${g.L},${g.y(f)}H${g.R}" class="food-exp-grid"/><text x="${g.L-9}" y="${g.y(f)+5}" text-anchor="end">${f*100}</text>`).join('');
  const markers=['a','p','s'].map(key=>`<circle data-depth-marker="${key}" cx="${g.x(progress)}" cy="${g.y(current[key])}" r="4.5" fill="${poolColors[key]}" stroke="#fffdf9" stroke-width="2"/>`).join('');
  return svg(`無因次進程 ${number(progress)}；A ${percent(current.a)}、P ${percent(current.p)}、S ${percent(current.s)}；速率比 ${number(ratio)}`,`<text x="${g.L}" y="16">模型量 (%)</text>${grid}${curves}<path d="M${g.x(progress)},${g.T}V${g.B}" class="food-exp-marker-guide"/>${markers}${[0,2,4,6,8].map(t=>`<text x="${g.x(t)}" y="${g.B+23}" text-anchor="middle">${t}</text>`).join('')}<text x="${g.R}" y="233" text-anchor="end">進程 τ = k₁t（無因次）</text>`);
}

function mixtureChart(fractions){
  let cursor=21;
  const bars=STARCH_COMPONENTS.map(component=>{
    const width=358*fractions[component.id];
    const bar=`<rect data-depth-component="${component.id}" x="${cursor}" y="42" width="${width}" height="48" fill="${component.color}"/>`;
    cursor+=width;return bar;
  }).join('');
  return svg(`乾物質質量分率：${STARCH_COMPONENTS.map(c=>`${c.label} ${percent(fractions[c.id],2)}`).join('、')}`,`<text x="21" y="24">乾物質組成</text><rect x="21" y="42" width="358" height="48" rx="3" fill="#e4e3d9"/>${bars}<text x="21" y="117">0%</text><text x="379" y="117" text-anchor="end">100% 乾物質</text>`,130);
}

const definitions={
  'oxidation-sequence':{
    question:'初級產物變少，代表氧化停止了嗎？',
    hint:'拖動進程，看 P 的高峰前後，S 如何變化。',
    boundary:'抽象連續反應，非真實食品動力學。百分比不是 PV 或 pAV 量值。',
    summaryFormula:'A → P → S · dP/dτ = A − rP',
    initial:{progress:2,ratio:1},
    main:{name:'progress',label:'反應進程 τ',min:0,max:8,step:'any',format:v=>number(v,2)},
    secondary:{name:'ratio',label:'第二步相對速率 k₂ / k₁',min:.1,max:4,step:.1,format:v=>`${number(v,1)} 倍`},
    actions:[['peak','看 P 的峰值'],['after-peak','再往後一步']],
    detailsTitle:'改變速率比與查看模型',
    formula:'A → P → S<br>τ = k₁t，r = k₂ / k₁<br>A = e<sup>−τ</sup><br>P = (e<sup>−τ</sup> − e<sup>−rτ</sup>) / (r − 1)<br>r = 1 時，P = τe<sup>−τ</sup><br>S = 1 − A − P',
    assumptions:'初始 A = 1、P = S = 0；兩步均為不可逆一級反應，固定速率常數，模型按 1:1:1 轉移。P 是初級產物池，S 是所選次級產物池，並假設 S 不再反應。A + P + S 守恆的是模型總量；真實脂質氧化另有氧氣加入、鏈反應、支路、揮發與後續消耗，不能把這三池當作完整質量分析。此圖沒有食品實測速率，也不推估安全或保存期限。',
    render(state){
      const pools=consecutivePools(state.progress,state.ratio),slope=pools.a-state.ratio*pools.p;
      let observation;
      if(state.progress===0)observation='起點只有 A。向右移動進程，P 先生成，再轉到 S。';
      else if(Math.abs(slope)<1e-9)observation='P 到達峰值：生成與消耗此刻一樣快，但 S 仍在增加。';
      else if(slope<0)observation='P 正在下降，S 仍在增加。初級產物減少，不能單獨判定氧化改善。';
      else observation='此刻 P 的生成快於消耗；P、S 都在增加。';
      return {value:percent(pools.p),label:'P · 初級產物池',chart:oxidationChart(state.progress,state.ratio,pools),observation,
        readings:[['a','A · 起始池',percent(pools.a)],['p','P · 初級池',percent(pools.p)],['s','S · 次級池',percent(pools.s)]],
        caption:`A + P + S = ${percent(pools.a+pools.p+pools.s,0)} · 模型總量守恆`,
      };
    },
    act(action,state){
      if(action==='peak')state.progress=primaryPeakProgress(state.ratio);
      if(action==='after-peak')state.progress=Math.min(8,primaryPeakProgress(state.ratio)+1.5);
    },
  },
  'starch-de':{
    question:'同一個 DE，能猜出糖的組成嗎？',
    hint:'切換兩個例子：DE 一樣，乾物質組成卻不同。',
    boundary:'理想還原端當量模型。DE 不是甜度、果糖含量或完整糖組成。',
    summaryFormula:'DE混合 = Σ(wᵢ × DEᵢ) · wᵢ 為乾物質質量分率',
    initial:{glucose:0,maltoseOfRemainder:1},
    main:{name:'glucose',label:'葡萄糖占全部乾物質',min:0,max:1,step:'any',format:v=>percent(v,2)},
    secondary:{name:'maltoseOfRemainder',label:'其餘乾物質中，麥芽糖占比',min:0,max:1,step:'any',format:v=>percent(v,2)},
    actions:SAME_DE_EXAMPLES.map(example=>[example.id,example.label]),
    detailsTitle:'調整其餘組成與查看模型',
    formula:'每條線性葡萄糖鏈：M = 162 × DP + 18<br>DE = 100 × 180 / M<br>混合物 DE = Σ(wᵢ × DEᵢ)，Σwᵢ = 1',
    assumptions:'DP 是一條鏈的葡萄糖單元數；每條鏈保留一個還原端，無支鏈、環化或端基改質。180、162、18 為教學用近似摩爾質量；以無水乾物質計算。理想葡萄糖、麥芽糖、DP10 鏈的 DE 分別為 100、52.63、10.99。混合依乾物質質量分率加權，不按莫耳分率。這是理論端基當量；實際分析會受方法與樣品影響，未包含實測校正。相同 DE 不能唯一反推出糖鏈分布，也不能換算甜度或果糖含量。',
    render(state){
      const fractions=splitStarchMixture(state.glucose,state.maltoseOfRemainder),de=starchMixtureDE(fractions);
      const sameAsExamples=Math.abs(de-idealChainDE(2))<1e-9;
      return {value:de.toFixed(2),label:'理論 DE',chart:mixtureChart(fractions),
        observation:sameAsExamples?'這個配方與另一個預設例子，理論 DE 都是 52.63；一個總量指標無法決定完整組成。':'改變糖鏈的質量分配，就改變每克乾物質的還原端當量。',
        readings:STARCH_COMPONENTS.map(c=>[c.id,`${c.label} · DP${c.dp}`,percent(fractions[c.id],2)]),
        caption:'各比例依乾物質計；顯示值四捨五入。',
      };
    },
    act(action,state){
      const example=SAME_DE_EXAMPLES.find(item=>item.id===action);
      if(example){state.glucose=example.glucose;state.maltoseOfRemainder=example.maltoseOfRemainder;}
    },
  },
};

function controlHTML(control,state,prefix){
  const id=`${prefix}-${control.name}`;
  return `<div class="food-exp-control"><div class="food-exp-control-label"><label for="${id}">${control.label}</label><output for="${id}" data-depth-reading="${control.name}">${esc(control.format(state[control.name]))}</output></div><input id="${id}" type="range" data-depth-input="${control.name}" min="${control.min}" max="${control.max}" step="${control.step}" value="${state[control.name]}" aria-valuetext="${esc(control.format(state[control.name]))}"><div class="food-exp-endpoints" aria-hidden="true"><span>${esc(control.format(control.min))}</span><span>${esc(control.format(control.max))}</span></div></div>`;
}

/** Load food-experiments.css plus food-depth-experiments.css in the host page. */
export function mountDepthExperiment(container,id){
  const definition=definitions[id];
  if(!definition)throw new RangeError(`Unknown depth experiment: ${id}`);
  if(!container||typeof container.querySelector!=='function'||typeof container.addEventListener!=='function')throw new TypeError('A DOM container is required');
  const state={...definition.initial},prefix=`food-depth-${++instance}`,controls=[definition.main,definition.secondary];
  container.innerHTML=`<section class="food-experiment food-depth-experiment" data-depth-experiment="${id}" aria-labelledby="${prefix}-title"><header class="food-exp-heading"><p class="food-exp-kicker">動手比較</p><h3 id="${prefix}-title">${definition.question}</h3><p class="food-exp-hint">${definition.hint}</p></header><p class="depth-model-boundary">${definition.boundary}</p><p class="depth-equation-line">${esc(definition.summaryFormula)}</p><div class="depth-workbench"><div class="food-exp-stage"><div class="food-exp-result" aria-live="polite" aria-atomic="true"><output class="food-exp-value depth-value"></output><span class="food-exp-result-label depth-value-label"></span></div><div class="food-exp-figure depth-figure"></div><dl class="depth-readings"></dl><p class="food-exp-caption depth-caption"></p></div><div class="depth-controls"><div class="depth-actions">${definition.actions.map(([action,label])=>`<button type="button" data-depth-action="${action}">${label}</button>`).join('')}</div>${controlHTML(definition.main,state,prefix)}<p class="food-exp-observation depth-observation"></p><details class="food-exp-details"><summary>${definition.detailsTitle}</summary><div class="food-exp-details-body">${controlHTML(definition.secondary,state,prefix)}${id==='starch-de'?'<p class="depth-remainder-note">剩餘部分由麥芽糖與 DP10 鏈分配；調一個，另一個自動補足。</p>':''}<p class="food-exp-equation">${definition.formula}</p><p class="food-exp-assumptions">${definition.assumptions}</p><ul class="food-exp-sources">${DEPTH_EXPERIMENT_SOURCES[id].map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></li>`).join('')}</ul></div></details></div></div></section>`;
  let disposed=false;
  const find=selector=>container.querySelector(selector);
  function draw(){
    const view=definition.render(state);
    find('.depth-value').textContent=view.value;find('.depth-value-label').textContent=view.label;
    find('.depth-figure').innerHTML=view.chart;find('.depth-caption').textContent=view.caption;
    find('.depth-observation').textContent=view.observation;
    find('.depth-readings').innerHTML=view.readings.map(([key,label,value])=>`<div class="depth-reading depth-reading-${key}"><dt>${label}</dt><dd>${value}</dd></div>`).join('');
    for(const control of controls){
      const input=find(`[data-depth-input="${control.name}"]`),reading=control.format(state[control.name]);
      input.value=state[control.name];input.setAttribute('aria-valuetext',reading);
      find(`[data-depth-reading="${control.name}"]`).textContent=reading;
    }
    if(id==='starch-de'){
      find('[data-depth-input="maltoseOfRemainder"]').disabled=state.glucose===1;
      for(const example of SAME_DE_EXAMPLES){
        const active=Math.abs(state.glucose-example.glucose)<1e-12&&Math.abs(state.maltoseOfRemainder-example.maltoseOfRemainder)<1e-12;
        find(`[data-depth-action="${example.id}"]`).setAttribute('aria-pressed',String(active));
      }
    }
  }
  const onInput=event=>{
    if(disposed)return;
    const control=controls.find(item=>item.name===event.target?.dataset?.depthInput);
    if(!control)return;
    const value=Number(event.target.value);if(!Number.isFinite(value))return;
    state[control.name]=Math.max(control.min,Math.min(control.max,value));draw();
  };
  const onClick=event=>{
    if(disposed)return;
    const action=event.target?.closest?.('[data-depth-action]')?.dataset?.depthAction;
    if(!definition.actions.some(([id])=>id===action))return;
    definition.act(action,state);draw();
  };
  container.addEventListener('input',onInput);container.addEventListener('click',onClick);draw();
  return ()=>{disposed=true;container.removeEventListener('input',onInput);container.removeEventListener('click',onClick);};
}
