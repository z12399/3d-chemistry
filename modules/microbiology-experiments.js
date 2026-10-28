import {escapeHTML as esc} from './storage.js';

export const MICROBIOLOGY_EXPERIMENT_IDS=Object.freeze(['microbiology-growth','microbiology-thermal']);
export const MICROBIOLOGY_EXPERIMENT_SOURCES=Object.freeze({
  'microbiology-growth':Object.freeze([
    {title:'OpenStax · 倍增時間與生長階段',url:'https://openstax.org/books/microbiology/pages/9-1-how-microbes-grow'},
    {title:'USDA ARS · 生長率、遲滯期與模型適用條件',url:'https://pmp.ars.usda.gov/overview.aspx'},
  ]),
  'microbiology-thermal':Object.freeze([
    {title:'FDA · D、z 的定義與低於一個的平均濃度',url:'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/inspection-guides/sterilizing-symbols-d-z-f'},
    {title:'USDA ARS · 線性失活模型與肩部、拖尾',url:'https://pmp.ars.usda.gov/overview.aspx'},
  ]),
});
export const MICROBIOLOGY_EXPERIMENT_PARAMETERS=Object.freeze({
  log10Initial:2,referenceTemperatureC:70,
  growth:Object.freeze({hours:5,lagHours:1,doublingTimeHours:1}),
  thermal:Object.freeze({minutes:4,temperatureC:70,dReferenceMinutes:2,zC:10}),
});
// Short aliases keep the source/parameter contract convenient for consumers.
export {MICROBIOLOGY_EXPERIMENT_SOURCES as SOURCES,MICROBIOLOGY_EXPERIMENT_PARAMETERS as PARAMETERS};

function finite(value,name){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(`${name} must be finite`);}
function nonnegative(value,name){finite(value,name);if(value<0)throw new RangeError(`${name} must be nonnegative`);}
function positive(value,name){finite(value,name);if(value<=0)throw new RangeError(`${name} must be positive`);}
function temperature(value,name){finite(value,name);if(value<=-273.15)throw new RangeError(`${name} must be above absolute zero`);}
function representable(values){if(values.some(value=>!Number.isFinite(value)))throw new RangeError('Result exceeds the numeric range');}
// Keep extreme results in logarithmic form. No zero/Infinity is substituted for a
// positive concentration or fraction. This conservative ±300 window is numerical,
// not a microbiological threshold or a fitted model validity range.
function power10OrNull(exponent){return exponent < -300 || exponent > 300 ? null : 10**exponent;}

/** Hypothetical fixed-volume population mean: flat lag, then constant exponential
 * growth. No stationary/death phase, environmental predictors or organism data.
 * Time and lag are hours; doublingTimeHours > 0; log10Initial may be negative.
 */
export function growthModel({hours,lagHours,doublingTimeHours,log10Initial=2}={}){
  nonnegative(hours,'time');nonnegative(lagHours,'lag time');positive(doublingTimeHours,'doubling time');finite(log10Initial,'initial log concentration');
  const growthHours=Math.max(0,hours-lagHours),generations=growthHours/doublingTimeHours;
  const rateLog10PerHour=Math.log10(2)/doublingTimeHours,log10Increase=generations*Math.log10(2),log10Concentration=log10Initial+log10Increase;
  representable([growthHours,generations,rateLog10PerHour,log10Increase,log10Concentration]);
  if(growthHours>0&&(generations===0||log10Increase===0))throw new RangeError('Positive growth is below the numeric range');
  const concentrationPerMl=power10OrNull(log10Concentration);
  return {growthHours,generations,rateLog10PerHour,log10Increase,log10Concentration,concentrationPerMl,concentrationLogOnly:concentrationPerMl===null,phase:hours<lagHours?'lag':'exponential'};
}

/** Isothermal first-order teaching model. Times/D are minutes, T/Tref in °C,
 * z is a positive Celsius temperature interval. Parameters are hypothetical.
 * Fractions/concentrations outside 10^[-300,300] are null, with logs preserved.
 */
export function thermalSurvival({minutes,dReferenceMinutes,temperatureC,referenceTemperatureC=70,zC,log10Initial=2}={}){
  nonnegative(minutes,'time');positive(dReferenceMinutes,'reference D');temperature(temperatureC,'temperature');temperature(referenceTemperatureC,'reference temperature');positive(zC,'z interval');finite(log10Initial,'initial log concentration');
  const log10D=Math.log10(dReferenceMinutes)+(referenceTemperatureC-temperatureC)/zC;
  if(!Number.isFinite(log10D)||log10D < -300||log10D > 300)throw new RangeError('D exceeds the supported numeric range');
  const dMinutes=10**log10D,logReduction=minutes/dMinutes;
  const log10SurvivalFraction=logReduction===0?0:-logReduction,log10Concentration=log10Initial-logReduction;
  representable([dMinutes,logReduction,log10Concentration]);
  if(minutes>0&&logReduction===0)throw new RangeError('Positive reduction is below the numeric range');
  const survivalFraction=power10OrNull(log10SurvivalFraction),concentrationPerMl=power10OrNull(log10Concentration);
  return {dMinutes,log10D,logReduction,log10SurvivalFraction,survivalFraction,survivalLogOnly:survivalFraction===null,log10Concentration,concentrationPerMl,concentrationLogOnly:concentrationPerMl===null};
}

const number=(value,digits=2)=>Number(value.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits});
const signedPower=exponent=>`10^${exponent<0?'−':''}${number(Math.abs(exponent),3)}`;
const concentration=result=>result.concentrationPerMl!==null&&result.log10Concentration>=-3&&result.log10Concentration<=6?`${number(result.concentrationPerMl,3)} 個/mL`:`${signedPower(result.log10Concentration)} 個/mL`;
const survivor=result=>result.logReduction===0?'1（100%）':result.logReduction<=3?`${number(result.survivalFraction,6)}`:signedPower(result.log10SurvivalFraction);
const plot={left:54,right:404,top:40,bottom:245};
const svg=(label,body)=>`<svg viewBox="0 0 426 307" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
function axes({xMax,yMax,yMin,ticks,label,timeLabel}){
  const x=t=>plot.left+(plot.right-plot.left)*t/xMax,y=n=>plot.bottom-(plot.bottom-plot.top)*(n-yMin)/(yMax-yMin);
  const grid=ticks.map(n=>`<path d="M${plot.left},${y(n)}H${plot.right}" class="micro-grid"/><text x="${plot.left-9}" y="${y(n)+4}" text-anchor="end" class="micro-svg-small">${number(n,2)}</text>`).join('');
  const times=Array.from({length:5},(_,i)=>xMax*i/4).map(t=>`<text x="${x(t)}" y="${plot.bottom+21}" text-anchor="middle" class="micro-svg-small">${number(t,1)}</text>`).join('');
  return {x,y,body:`<text x="16" y="20" class="micro-axis-label">${label}</text>${grid}<path d="M${plot.left},${plot.top}V${plot.bottom}H${plot.right}" class="micro-axis"/>${times}<text x="${plot.right}" y="${plot.bottom+44}" text-anchor="end" class="micro-svg-small">${timeLabel}</text>`};
}
function growthDiagram(state,result){
  const end=growthModel({...state,hours:8}),chart=axes({xMax:8,yMin:0,yMax:8,ticks:[0,2,4,6,8],label:'log₁₀ N（N：個/mL）',timeLabel:'時間（h）'}),{x,y}=chart;
  const atLag=y(MICROBIOLOGY_EXPERIMENT_PARAMETERS.log10Initial),cursorX=x(state.hours),cursorY=y(result.log10Concentration);
  return svg(`${number(state.hours)} 小時，模型 log10 濃度 ${number(result.log10Concentration,3)}，${concentration(result)}。指定 lag ${number(state.lagHours)} 小時；之後每 ${number(state.doublingTimeHours)} 小時倍增。`,
    `<rect x="${plot.left}" y="${plot.top}" width="${x(state.lagHours)-plot.left}" height="${plot.bottom-plot.top}" class="micro-lag-shade"/>${chart.body}<path d="M${plot.left},${atLag}H${x(state.lagHours)}L${x(8)},${y(end.log10Concentration)}" class="micro-curve" data-micro-curve="growth"/><path d="M${cursorX},${plot.bottom}V${cursorY}" class="micro-guide"/><circle cx="${cursorX}" cy="${cursorY}" r="5" class="micro-marker"/><text x="${plot.left}" y="289" class="micro-svg-small">陰影：指定的 lag 區間</text>`);
}
function thermalDiagram(state,result){
  const referenceTemperatureC=MICROBIOLOGY_EXPERIMENT_PARAMETERS.referenceTemperatureC;
  const end=thermalSurvival({...state,minutes:10}),referenceEnd=thermalSurvival({...state,minutes:10,temperatureC:referenceTemperatureC});
  const largest=Math.max(1,end.logReduction,referenceEnd.logReduction),order=10**Math.floor(Math.log10(largest)),extent=Math.ceil(largest/order)*order;
  const chart=axes({xMax:10,yMin:-extent,yMax:0,ticks:[0,-extent/4,-extent/2,-extent*3/4,-extent],label:'log₁₀ (N / N₀)',timeLabel:'等溫時間（min）'}),{x,y}=chart;
  return svg(`等溫 ${number(state.temperatureC)} °C，D 為 ${number(result.dMinutes,3)} 分鐘。${number(state.minutes)} 分鐘降低 ${number(result.logReduction,3)} log，存活分率 ${survivor(result)}。虛線為相同 Dref 在 ${referenceTemperatureC} °C 的參考曲線。`,
    `${chart.body}<path d="M${x(0)},${y(0)}L${x(10)},${y(-referenceEnd.logReduction)}" class="micro-reference" data-micro-curve="reference"/><path d="M${x(0)},${y(0)}L${x(10)},${y(-end.logReduction)}" class="micro-curve" data-micro-curve="thermal"/><path d="M${x(state.minutes)},${plot.bottom}V${y(result.log10SurvivalFraction)}" class="micro-guide"/><circle cx="${x(state.minutes)}" cy="${y(result.log10SurvivalFraction)}" r="5" class="micro-marker"/><path d="M54,288H73" class="micro-reference"/><text x="81" y="292" class="micro-svg-small">參考溫度 ${referenceTemperatureC}°C · 縱軸隨參數縮放</text>`);
}

const definitions={
  'microbiology-growth':{
    question:'晚一點開始長，和長得慢，有什麼不同？',hint:'調整遲滯期與倍增時間，再沿時間軸觀察。',
    boundary:'假想族群：先維持相同濃度，再固定倍增；未模擬穩定期或死亡期。',
    initial:MICROBIOLOGY_EXPERIMENT_PARAMETERS.growth,
    controls:[
      {name:'hours',label:'觀察時間 t',min:0,max:8,step:.25,format:v=>`${number(v)} h`},
      {name:'lagHours',label:'指定遲滯期 lag',min:0,max:4,step:.25,format:v=>`${number(v)} h`},
      {name:'doublingTimeHours',label:'倍增時間 g',min:.5,max:2,step:.1,format:v=>`${number(v)} h / 倍增`},
    ],
    formula:'log₁₀ N = log₁₀ N₀ + [max(0, t − lag) / g] log₁₀ 2',formulaNote:'N₀ = 10² 個/mL；時間都用 h；N 為平均濃度。',
    caption:'縱軸每增加 1，濃度變成 10 倍；折點是指定的教學近似。',
    details:['固定體積、相同環境下，假設 lag 內淨數目不變，之後以固定倍增時間 g 生長。N = N₀ × 2ⁿ，n = max(0, t − lag)/g；曲線是連續的族群平均，不表示所有細胞同步分裂。實際 lag 有個體差異，過渡通常不是尖銳折點；此處不表示細胞完全沒有代謝。','所有參數是示意，未用菌種或食品資料擬合。沒有營養耗竭、穩定期、死亡期、pH、溫度或水活性的效應，不能向食品保存時間或安全性外推。N 的單位是模型個數/mL，不是實測 CFU/mL；若平均濃度低於 1/mL，也不是單顆細胞的分數。'],
    calculate:growthModel,diagram:growthDiagram,
    render(state,result){return {value:number(result.log10Concentration,3),label:'log₁₀ N · N 以個/mL 表示',readings:[['模型平均濃度',concentration(result)],['lag 後的倍增次數',number(result.generations,2)],['指數段斜率',`${number(result.rateLog10PerHour,3)} log₁₀/h`]],observation:state.hours<state.lagHours?'還在指定 lag 內：模型濃度維持起點；不代表細胞沒有代謝。':state.hours===state.lagHours?'剛到指定 lag 的終點；接著才開始累積倍增。':`已經過 ${number(result.growthHours)} h 的指數生長。改變 lag 會移動折點，改變 g 會改變斜率。`};},
  },
  'microbiology-thermal':{
    question:'同樣一段時間，為何降低量會不同？',hint:'先移動時間與溫度，再展開參數比較 D 與 z。',
    boundary:'假想參數的等溫、對數線性失活模型；計算結果不是無菌或食品安全保證。',
    initial:MICROBIOLOGY_EXPERIMENT_PARAMETERS.thermal,
    controls:[
      {name:'minutes',label:'等溫維持時間 t',min:0,max:10,step:.25,format:v=>`${number(v)} min`},
      {name:'temperatureC',label:'整個樣品的固定溫度 T',min:60,max:80,step:1,format:v=>`${number(v,0)} °C`},
      {name:'dReferenceMinutes',label:'Dref · 70°C 時降低 1 log 所需時間',min:.5,max:5,step:.25,format:v=>`${number(v)} min`,advanced:true},
      {name:'zC',label:'z · 使 D 變為 1/10 的升溫幅度',min:5,max:15,step:1,format:v=>`${number(v,0)} °C`,advanced:true},
    ],
    formula:'L = t / D(T)；N / N₀ = 10⁻ᴸ',formulaNote:'D(T) = Dref × 10^[(Tref − T) / z]；Tref = 70°C',
    caption:'實線是目前 T，虛線是 Tref；下降 1 log，存活分率再乘 0.1。',
    details:['D(T) 是指定溫度下降低 1 log（90%）所需的時間；t 和 D 都用 min。z 是溫差，這裡以 °C 表示。假設 log₁₀ D 對 T 呈直線、整個樣品從 t=0 起即維持指定溫度，不積分升溫、降溫或冷點溫度歷程。N₀ = 10² 個/mL 只用來示範平均濃度；分率 N/N₀ 與 N₀ 無關。','Dref、Tref、z 均為教學指定值，未擬合任何菌種或食品。沒有肩部、拖尾、抗性混合族群、復甦或再污染；實際 D 與 z 依菌株、食品基質及條件而變。有限時間的模型分率仍為正，不能宣稱零活菌。極小數值只保留 10 的冪次；這不代表量測可達該精度，也不是保存期或安全製程驗證。'],
    calculate:thermalSurvival,diagram:thermalDiagram,
    render(state,result){
      const belowOne=result.log10Concentration<0;
      return {value:`${number(result.logReduction,3)} log`,label:'模型降低量 L',readings:[['目前 D(T)',`${number(result.dMinutes,3)} min`],['存活分率 N/N₀',survivor(result)],['由 100 個/mL 起算的平均濃度',concentration(result)]],
        observation:belowOne?'平均濃度低於 1 個/mL，表示大量同條件樣品的平均；不是「部分細胞」，也不保證每份樣品都沒有活菌。':state.temperatureC===70?'T = Tref，所以 D(T) = Dref；此時改變 z 不影響結果。先改變 T，再比較 z。':state.minutes===0?'等溫時間為零：尚未累積降低量，存活分率為 1。':`目前每 ${number(result.dMinutes,3)} min 降低 1 log；時間加倍會使降低量加倍，存活分率則再相乘。`};
    },
  },
};

function controlHTML(control,state,prefix){const id=`${prefix}-${control.name}`;return `<div class="food-exp-control"><div class="food-exp-control-label"><label for="${id}">${control.label}</label><output for="${id}" data-micro-reading="${control.name}">${esc(control.format(state[control.name]))}</output></div><input id="${id}" type="range" data-micro-input="${control.name}" min="${control.min}" max="${control.max}" step="${control.step}" value="${state[control.name]}" aria-valuetext="${esc(control.format(state[control.name]))}"><div class="food-exp-endpoints" aria-hidden="true"><span>${esc(control.format(control.min))}</span><span>${esc(control.format(control.max))}</span></div></div>`;}
const microDrafts=new WeakMap(),mountedMicrobiology=new WeakMap();
function microDraft(owner,key,id){
  if(!owner||typeof owner!=='object'&&typeof owner!=='function')return {state:null,details:[],active:null};
  let lessons=microDrafts.get(owner);if(!lessons){lessons=new Map();microDrafts.set(owner,lessons);}
  let activities=lessons.get(key);if(!activities){activities=new Map();lessons.set(key,activities);}
  let draft=activities.get(id);if(!draft){draft={state:null,details:[],active:null};activities.set(id,draft);}
  return draft;
}
function microState(saved,definition){
  const state={...definition.initial};
  for(const control of definition.controls){const value=saved?.[control.name];if(typeof value==='number'&&Number.isFinite(value)&&value>=control.min&&value<=control.max)state[control.name]=value;}
  return state;
}
let instance=0;
/** Host loads food-experiments.css and microbiology-experiments.css. No timers. */
export function mountMicrobiologyExperiment(container,id,{draftOwner,draftKey=id}={}){
  if(!MICROBIOLOGY_EXPERIMENT_IDS.includes(id))throw new RangeError(`Unknown microbiology experiment: ${id}`);
  if(!container||typeof container.querySelector!=='function'||typeof container.addEventListener!=='function'||typeof container.removeEventListener!=='function')throw new TypeError('A DOM container is required');
  const draft=microDraft(draftOwner,draftKey,id);mountedMicrobiology.get(container)?.();draft.active?.();
  const definition=definitions[id],state=microState(draft.state,definition),prefix=`microbiology-${++instance}`,advanced=definition.controls.filter(control=>control.advanced);
  let disposed=false;
  if(id==='microbiology-thermal') {
    container.innerHTML=`<section class="food-experiment microbiology-experiment micro-thermal-workbench" data-microbiology-experiment="${id}" aria-labelledby="${prefix}-title">
      <header class="food-exp-heading"><h3 id="${prefix}-title">${definition.question}</h3></header>
      <div class="micro-thermal-topline"><p class="micro-boundary">${definition.boundary}</p><button type="button" class="micro-reset" data-micro-action="reset">重設示例</button></div>
      <div class="micro-layout">
        <div class="food-exp-stage micro-stage"><div class="food-exp-figure micro-figure"></div><p class="micro-formula"><span>${esc(definition.formula)}</span><small>${esc(definition.formulaNote)}</small></p><p class="food-exp-caption">${definition.caption}</p></div>
        <div class="micro-panel"><div class="food-exp-result" aria-live="polite" aria-atomic="true"><output class="food-exp-value micro-value"></output><span class="food-exp-result-label micro-label"></span></div><dl class="micro-readings"></dl><div class="micro-thermal-controls">${definition.controls.filter(control=>!control.advanced).map(control=>controlHTML(control,state,prefix)).join('')}</div>${advanced.length?`<details class="micro-parameters"><summary>改變假設參數 Dref 與 z</summary><div>${advanced.map(control=>controlHTML(control,state,prefix)).join('')}</div></details>`:''}</div>
      </div>
      <p class="food-exp-observation micro-observation"></p>
      <div class="micro-thermal-extensions"><details class="micro-thermal-question"><summary>提問與操作提示</summary><header class="food-exp-heading"><p class="food-exp-kicker">動手觀察</p><p class="food-exp-hint">${definition.hint}</p></header></details><details class="food-exp-details"><summary>假設、單位與來源</summary><div class="food-exp-details-body">${definition.details.map(text=>`<p class="food-exp-assumptions">${text}</p>`).join('')}<ul class="food-exp-sources">${MICROBIOLOGY_EXPERIMENT_SOURCES[id].map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></li>`).join('')}</ul></div></details></div>
    </section>`;
  } else {
  container.innerHTML=`<section class="food-experiment microbiology-experiment" data-microbiology-experiment="${id}" aria-labelledby="${prefix}-title"><header class="food-exp-heading"><p class="food-exp-kicker">動手觀察</p><h3 id="${prefix}-title">${definition.question}</h3><p class="food-exp-hint">${definition.hint}</p></header><p class="micro-boundary">${definition.boundary}</p><div class="micro-layout"><div class="food-exp-stage micro-stage"><div class="food-exp-figure micro-figure"></div><p class="micro-formula"><span>${esc(definition.formula)}</span><small>${esc(definition.formulaNote)}</small></p><p class="food-exp-caption">${definition.caption}</p></div><div class="micro-panel"><div class="food-exp-result" aria-live="polite" aria-atomic="true"><output class="food-exp-value micro-value"></output><span class="food-exp-result-label micro-label"></span></div>${definition.controls.filter(control=>!control.advanced).map(control=>controlHTML(control,state,prefix)).join('')}${advanced.length?`<details class="micro-parameters"><summary>改變假設參數 Dref 與 z</summary><div>${advanced.map(control=>controlHTML(control,state,prefix)).join('')}</div></details>`:''}<button type="button" class="micro-reset" data-micro-action="reset">重設示例</button><dl class="micro-readings"></dl><p class="food-exp-observation micro-observation"></p><details class="food-exp-details"><summary>假設、單位與來源</summary><div class="food-exp-details-body">${definition.details.map(text=>`<p class="food-exp-assumptions">${text}</p>`).join('')}<ul class="food-exp-sources">${MICROBIOLOGY_EXPERIMENT_SOURCES[id].map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></li>`).join('')}</ul></div></details></div></div></section>`;
  }
  const find=selector=>container.querySelector(selector);
  const details=[...container.querySelectorAll?.('details')??[]];
  const remember=()=>{if(!disposed){draft.state={...state};draft.details=details.map(detail=>Boolean(detail.open));}};
  details.forEach((detail,index)=>{detail.open=draft.details[index]===true;detail.ontoggle=()=>{if(!disposed)remember();};});
  const figure=find('.micro-figure');figure.setAttribute('tabindex','0');figure.setAttribute('role','region');figure.setAttribute('aria-label',`${definition.question} 圖表，可左右捲動`);
  function draw(){
    const result=definition.calculate(state),view=definition.render(state,result);
    find('.micro-value').textContent=view.value;find('.micro-label').textContent=view.label;find('.micro-figure').innerHTML=definition.diagram(state,result);find('.micro-observation').textContent=view.observation;
    find('.micro-readings').innerHTML=view.readings.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('');
    for(const control of definition.controls){const input=find(`[data-micro-input="${control.name}"]`),formatted=control.format(state[control.name]);input.value=state[control.name];input.setAttribute('aria-valuetext',formatted);find(`[data-micro-reading="${control.name}"]`).textContent=formatted;}
  }
  const onInput=event=>{if(disposed||typeof container.contains==='function'&&!container.contains(event.target))return;const control=definition.controls.find(item=>item.name===event.target?.dataset?.microInput);if(!control||String(event.target.value).trim()==='')return;const raw=Number(event.target.value);if(!Number.isFinite(raw))return;state[control.name]=Math.max(control.min,Math.min(control.max,raw));draw();remember();};
  const onClick=event=>{if(disposed||typeof container.contains==='function'&&!container.contains(event.target))return;if(event.target?.closest?.('[data-micro-action]')?.dataset?.microAction!=='reset')return;Object.assign(state,definition.initial);draw();remember();};
  container.addEventListener('input',onInput);container.addEventListener('click',onClick);draw();
  const dispose=()=>{if(disposed)return;remember();disposed=true;details.forEach(detail=>{detail.ontoggle=null;});container.removeEventListener('input',onInput);container.removeEventListener('click',onClick);if(draft.active===dispose)draft.active=null;if(mountedMicrobiology.get(container)===dispose)mountedMicrobiology.delete(container);};
  draft.active=dispose;mountedMicrobiology.set(container,dispose);remember();return dispose;
}
