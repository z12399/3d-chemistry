import {escapeHTML as esc} from './storage.js';

export const PROCESSING_EXPERIMENT_IDS=Object.freeze(['processing-concentration','processing-energy']);
export const PROCESSING_EXPERIMENT_SOURCES=Object.freeze({
  'processing-concentration':Object.freeze([
    {title:'LearnChemE · 單效蒸發器的總量與溶質衡算',url:'https://learncheme.com/quiz-yourself/interactive-self-study-modules/single-effect-evaporators/single-effect-evaporators-screencast/'},
    {title:'Penn State Extension · Brix 刻度與材料校正',url:'https://extension.psu.edu/colostrum-management-tools-hydrometers-and-refractometers'},
  ]),
  'processing-energy':Object.freeze([
    {title:'OpenStax · 比熱與顯熱',url:'https://openstax.org/books/physics/pages/11-2-heat-specific-heat-and-heat-transfer'},
    {title:'OpenStax · 相變與潛熱',url:'https://openstax.org/books/physics/pages/11-3-phase-change-and-latent-heat'},
    {title:'LearnChemE · 蒸發器的能量衡算與傳熱率',url:'https://learncheme.com/quiz-yourself/interactive-self-study-modules/single-effect-evaporators/single-effect-evaporators-screencast/'},
  ]),
});
export const PROCESSING_ENERGY_PARAMETERS=Object.freeze({heatCapacityKJPerKgK:4,latentHeatKJPerKg:2250});
function finite(value,name){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(`${name} must be finite`);}
function positive(value,name){finite(value,name);if(value<=0)throw new RangeError(`${name} must be positive`);}
function nonnegative(value,name){finite(value,name);if(value<0)throw new RangeError(`${name} must be nonnegative`);}
function fraction(value,name,{zero=true}={}){finite(value,name);if(value>1||(zero?value<0:value<=0))throw new RangeError(`${name} must be ${zero?'in [0,1]':'in (0,1]'}`);}
function representable(values){if(values.some(value=>!Number.isFinite(value)))throw new RangeError('Result exceeds the numeric range');}

/** Steady state; all nonvolatile solids remain in product; vapor is pure water.
 * x values are mass fractions, not Brix. xP=1 is a mathematical dry-product limit.
 * Positive xF excludes an undefined concentration specification for solids-free feed.
 */
export function concentrationBalance({feedKgPerHour,feedSolidsFraction,productSolidsFraction}={}){
  positive(feedKgPerHour,'feed mass flow');fraction(feedSolidsFraction,'feed solids fraction',{zero:false});fraction(productSolidsFraction,'product solids fraction',{zero:false});
  if(productSolidsFraction<feedSolidsFraction)throw new RangeError('Concentration requires product solids fraction ≥ feed solids fraction');
  const productKgPerHour=feedKgPerHour*(feedSolidsFraction/productSolidsFraction);
  const vaporKgPerHour=feedKgPerHour*((productSolidsFraction-feedSolidsFraction)/productSolidsFraction);
  const solidsKgPerHour=feedKgPerHour*feedSolidsFraction,feedWaterKgPerHour=feedKgPerHour*(1-feedSolidsFraction),productWaterKgPerHour=productKgPerHour*(1-productSolidsFraction);
  representable([productKgPerHour,vaporKgPerHour,solidsKgPerHour,feedWaterKgPerHour,productWaterKgPerHour]);
  if(productKgPerHour===0||solidsKgPerHour===0)throw new RangeError('Positive mass flow is below the numeric range');
  return {feedKgPerHour,productKgPerHour,vaporKgPerHour,solidsKgPerHour,feedWaterKgPerHour,productWaterKgPerHour,productFraction:feedSolidsFraction/productSolidsFraction,vaporFraction:(productSolidsFraction-feedSolidsFraction)/productSolidsFraction};
}

/** One batch of hypothetical single-component liquid at constant pressure.
 * First heat ALL original mass to its vaporization temperature, then vaporize mf there.
 * cp and latent heat are assigned constants (kJ units), not measured food/water properties.
 * No superheating, heat loss, vessel heating, heat recovery, shaft work or rate prediction.
 */
export function sensibleLatentEnergy({massKg,temperatureRiseK,evaporatedFraction,heatCapacityKJPerKgK=4,latentHeatKJPerKg=2250}={}){
  nonnegative(massKg,'mass');nonnegative(temperatureRiseK,'temperature rise');fraction(evaporatedFraction,'evaporated mass fraction');positive(heatCapacityKJPerKgK,'heat capacity');positive(latentHeatKJPerKg,'latent heat');
  const sensibleKJ=massKg*heatCapacityKJPerKgK*temperatureRiseK,evaporatedKg=massKg*evaporatedFraction,latentKJ=evaporatedKg*latentHeatKJPerKg;
  const remainingKg=massKg*(1-evaporatedFraction),totalKJ=sensibleKJ+latentKJ,totalKWh=totalKJ/3600;
  representable([sensibleKJ,evaporatedKg,latentKJ,remainingKg,totalKJ,totalKWh]);
  if((massKg>0&&temperatureRiseK>0&&sensibleKJ===0)||(massKg>0&&evaporatedFraction>0&&(evaporatedKg===0||latentKJ===0)))throw new RangeError('Positive energy is below the numeric range');
  return {sensibleKJ,latentKJ,totalKJ,totalKWh,evaporatedKg,remainingKg,latentShare:totalKJ===0?null:latentKJ/totalKJ,sensibleShare:totalKJ===0?null:sensibleKJ/totalKJ};
}

const number=(value,digits=2)=>Number(value.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits});
const percent=value=>`${number(value,0)}%`;
const svg=(label,body)=>`<svg viewBox="0 0 400 326" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
function concentrationDiagram(state,result){
  const box=(x,y,width,label,value,note,role)=>`<g data-processing-stream="${role}"><rect x="${x}" y="${y}" width="${width}" height="76" rx="9" class="processing-stream-box"/><text x="${x+width/2}" y="${y+23}" text-anchor="middle">${label}</text><text x="${x+width/2}" y="${y+45}" text-anchor="middle" class="processing-svg-value">${value}</text><text x="${x+width/2}" y="${y+63}" text-anchor="middle" class="processing-svg-small">${note}</text></g>`;
  const productWidth=360*result.productFraction,vaporWidth=360*result.vaporFraction;
  return svg(`穩態濃縮：進料 ${number(state.feed)} kg/h，產品 ${number(result.productKgPerHour)} kg/h，純水蒸汽 ${number(result.vaporKgPerHour)} kg/h。固形物 ${number(result.solidsKgPerHour)} kg/h 全留在產品。`,
    `<path d="M117,133H144m-7,-5 7,5 -7,5M202,94V57H270m-7,-5 7,5 -7,5M202,172V211H270m-7,-5 7,5 -7,5" class="processing-flow"/>${box(9,95,108,'進料 F',`${number(state.feed,0)} kg/h`,`xF = ${percent(state.feedPercent)}`,'feed')}<rect x="148" y="95" width="107" height="76" rx="14" class="processing-vessel"/><text x="201.5" y="128" text-anchor="middle">蒸發器</text><text x="201.5" y="150" text-anchor="middle" class="processing-svg-small">只移除水</text>${box(273,19,118,'蒸汽 V',`${number(result.vaporKgPerHour,1)} kg/h`,'純水 · 固形物 0','vapor')}${box(273,173,118,'產品 P',`${number(result.productKgPerHour,1)} kg/h`,`xP = ${percent(state.productPercent)}`,'product')}<text x="20" y="267" class="processing-svg-small">進料總質量的去向</text><rect x="20" y="281" width="${productWidth}" height="16" fill="#b9543a" data-processing-share="product"/><rect x="${20+productWidth}" y="281" width="${vaporWidth}" height="16" fill="#899e97" data-processing-share="vapor"/><text x="20" y="320" class="processing-svg-small">產品 ${number(result.productFraction*100,1)}%</text><text x="380" y="320" text-anchor="end" class="processing-svg-small">蒸汽 ${number(result.vaporFraction*100,1)}%</text>`);
}
function energyDiagram(state,result){
  const sensibleWidth=(result.sensibleShare??0)*360,latentWidth=(result.latentShare??0)*360;
  const max=Math.max(result.sensibleKJ,result.latentKJ,1),width=value=>280*value/max;
  return svg(`能量分配：${number(state.mass)} kg 假想液體升溫 ${number(state.rise)} K，汽化 ${percent(state.evaporatedPercent)}。顯熱 ${number(result.sensibleKJ)} kJ、潛熱 ${number(result.latentKJ)} kJ，總計 ${number(result.totalKJ)} kJ。`,
    `<text x="20" y="24">先升溫，再汽化</text><text x="20" y="48" class="processing-svg-small">m = ${number(state.mass,0)} kg · ΔT = ${number(state.rise,0)} K</text><text x="20" y="81">顯熱</text><text x="380" y="81" text-anchor="end" class="processing-svg-value">${number(result.sensibleKJ,0)} kJ</text><rect x="20" y="94" width="${width(result.sensibleKJ)}" height="30" rx="4" fill="#b9543a" data-processing-energy="sensible"/><text x="20" y="157">汽化潛熱</text><text x="380" y="157" text-anchor="end" class="processing-svg-value">${number(result.latentKJ,0)} kJ</text><rect x="20" y="170" width="${width(result.latentKJ)}" height="30" rx="4" fill="#899e97" data-processing-energy="latent"/><text x="20" y="244" class="processing-svg-small">${result.totalKJ===0?'兩項皆為零；比例不定義':'占總需求的比例'}</text><rect x="20" y="258" width="360" height="16" fill="#e0e1d9"/><rect x="20" y="258" width="${sensibleWidth}" height="16" fill="#b9543a" data-processing-share="sensible"/><rect x="${20+sensibleWidth}" y="258" width="${latentWidth}" height="16" fill="#899e97" data-processing-share="latent"/><text x="20" y="300" class="processing-svg-small">顯熱 ${result.sensibleShare===null?'—':`${number(result.sensibleShare*100,1)}%`}</text><text x="380" y="300" text-anchor="end" class="processing-svg-small">潛熱 ${result.latentShare===null?'—':`${number(result.latentShare*100,1)}%`}</text>`);
}

const definitions={
  'processing-concentration':{
    question:'濃度提高後，產品還剩多少？',hint:'調整進料與固形物比例，看產品和蒸汽如何分流。',
    boundary:'穩態理想濃縮：固形物全留在產品，蒸汽為純水；不計損失與累積。',
    initial:{feed:1000,feedPercent:10,productPercent:40},
    controls:[
      {name:'feed',label:'進料 F',min:100,max:2000,step:50,format:v=>`${number(v,0)} kg/h`},
      {name:'feedPercent',label:'原料固形物 xF · 質量百分比',min:5,max:40,step:1,format:percent},
      {name:'productPercent',label:'產品固形物 xP · 質量百分比',min:5,max:80,step:1,format:percent},
    ],
    formula:'F = P + V；F xF = P xP',formulaNote:'P = F xF / xP；V = F − P',caption:'流量單位 kg/h；下方長條表示進料質量的分配。',
    details:'xF、xP 以 kg 固形物/kg 物料代入，畫面顯示其百分比。它們不是所有食品都可直接代入的 °Brix：Brix 以蔗糖溶液刻度為基礎，其他材料須確認成分與量測校正。此處假設不揮發固形物、沒有固形物夾帶或沉積損失，無反應、無累積，產品水分非負。xP 必須 ≥ xF；提高 xF 超過目前 xP 時，只把 xP 提高至合法下限並顯示說明。模型只做物料衡算，不判定溶解度、黏度、設備可操作性、所需熱量或加熱時間。',
    calculate:state=>concentrationBalance({feedKgPerHour:state.feed,feedSolidsFraction:state.feedPercent/100,productSolidsFraction:state.productPercent/100}),
    diagram:concentrationDiagram,
    render(state,result){return {value:`${number(result.productKgPerHour,1)} kg/h`,label:'產品 P',readings:[['純水蒸汽 V',`${number(result.vaporKgPerHour,1)} kg/h`],['保留的固形物',`${number(result.solidsKgPerHour,1)} kg/h`]],observation:state.productPercent===state.feedPercent?'產品與原料濃度相同：P = F，V = 0，沒有移除水。':`移走 ${number(result.vaporKgPerHour,1)} kg/h 水後，${number(result.solidsKgPerHour,1)} kg/h 固形物集中在產品中。`};},
  },
  'processing-energy':{
    question:'升溫和汽化，哪一項需要較多能量？',hint:'改變升溫幅度或汽化比例，比較兩項能量需求。',
    boundary:'假想單一成分液體的定壓教學模型；cp、λ 為指定值，不代表實際食品或精確水物性。',
    initial:{mass:10,rise:60,evaporatedPercent:20},
    controls:[
      {name:'mass',label:'原始液體質量 m',min:1,max:100,step:1,format:v=>`${number(v,0)} kg`},
      {name:'rise',label:'升至汽化溫度的 ΔT',min:0,max:80,step:1,format:v=>`${number(v,0)} K`},
      {name:'evaporatedPercent',label:'汽化比例 f · 占原始質量',min:0,max:80,step:1,format:percent},
    ],
    formula:'Qsens = m cp ΔT；Qlatent = m f λ',formulaNote:'cp = 4.0 kJ/(kg·K)；λ = 2250 kJ/kg（指定值）',caption:'長條按目前數值縮放；顯示能量，不表示時間或功率。',
    details:'先讓全部原始液體 m 升至汽化溫度 Tb，再在同一溫度汽化其中 mf。ΔT = Tb − Ti ≥ 0；溫差 1 K 等於 1°C，但這不是絕對溫度換算。假設固定壓力、定比熱與定汽化潛熱，汽化溫度不變，無溶質濃縮或沸點升高，也不計蒸汽過熱、容器升溫、散熱、熱回收及機械軸功。此模型與前一個物料衡算獨立，不自動把濃縮食品視為單一液體。cp、λ 是教學指定常數，並非測量值；真實物料須使用對應組成、壓力、溫度的性質或焓資料。Q = Qsens + Qlatent，1 kWh = 3600 kJ。這裡的 kWh 是同一熱量換單位，不是設備實際耗電；沒有傳熱面積、係數、熱源或功率，因此不能算加熱時間，更不能作殺菌或食品安全推估。',
    calculate:state=>sensibleLatentEnergy({massKg:state.mass,temperatureRiseK:state.rise,evaporatedFraction:state.evaporatedPercent/100,...PROCESSING_ENERGY_PARAMETERS}),
    diagram:energyDiagram,
    render(state,result){return {value:`${number(result.totalKJ,0)} kJ`,label:`總熱量需求 · ${number(result.totalKWh,3)} kWh（熱量）`,readings:[['顯熱 Qsens',`${number(result.sensibleKJ,0)} kJ`],['汽化潛熱 Qlatent',`${number(result.latentKJ,0)} kJ`],['汽化的質量 mf',`${number(result.evaporatedKg,2)} kg`]],observation:result.totalKJ===0?'已在汽化溫度且沒有汽化：兩項熱量需求都是零。':result.latentKJ===0?'此設定只升溫，沒有汽化，因此潛熱項為零。':result.sensibleKJ===0?'初始已在汽化溫度；仍需供應相變潛熱。':`這組參數下，汽化占總需求 ${number(result.latentShare*100,1)}%。汽化時溫度不再上升，仍需輸入能量。`};},
  },
};

function controlHTML(control,state,prefix){const id=`${prefix}-${control.name}`,minimum=control.name==='productPercent'?state.feedPercent:control.min;return `<div class="food-exp-control"><div class="food-exp-control-label"><label for="${id}">${control.label}</label><output for="${id}" data-processing-reading="${control.name}">${esc(control.format(state[control.name]))}</output></div><input id="${id}" type="range" data-processing-input="${control.name}" min="${minimum}" max="${control.max}" step="${control.step}" value="${state[control.name]}" aria-valuetext="${esc(control.format(state[control.name]))}"><div class="food-exp-endpoints" aria-hidden="true"><span data-processing-min="${control.name}">${esc(control.format(minimum))}</span><span>${esc(control.format(control.max))}</span></div></div>`;}
let instance=0;
/** Host loads food-experiments.css and processing-experiments.css. */
export function mountProcessingExperiment(container,id){
  if(!PROCESSING_EXPERIMENT_IDS.includes(id))throw new RangeError(`Unknown processing experiment: ${id}`);
  if(!container||typeof container.querySelector!=='function'||typeof container.addEventListener!=='function')throw new TypeError('A DOM container is required');
  const definition=definitions[id],state={...definition.initial},prefix=`processing-${++instance}`;
  container.innerHTML=`<section class="food-experiment processing-experiment" data-processing-experiment="${id}" aria-labelledby="${prefix}-title"><header class="food-exp-heading"><p class="food-exp-kicker">動手計算</p><h3 id="${prefix}-title">${definition.question}</h3><p class="food-exp-hint">${definition.hint}</p></header><p class="processing-boundary">${definition.boundary}</p><div class="processing-layout"><div class="food-exp-stage processing-stage"><div class="food-exp-figure processing-figure"></div><p class="processing-formula"><span>${esc(definition.formula)}</span><small>${esc(definition.formulaNote)}</small></p><p class="food-exp-caption">${definition.caption}</p></div><div class="processing-panel"><div class="food-exp-result" aria-live="polite" aria-atomic="true"><output class="food-exp-value processing-value"></output><span class="food-exp-result-label processing-label"></span></div>${definition.controls.map(control=>controlHTML(control,state,prefix)).join('')}${id==='processing-concentration'?'<p class="processing-range-note">產品 xP 的下限隨原料 xF 改變；不會降低原料設定。</p>':''}<p class="processing-notice" role="status" hidden></p><button type="button" class="processing-reset" data-processing-action="reset">重設示例</button><dl class="processing-readings"></dl><p class="food-exp-observation processing-observation"></p><details class="food-exp-details"><summary>假設、單位與來源</summary><div class="food-exp-details-body"><p class="food-exp-assumptions">${definition.details}</p><ul class="food-exp-sources">${PROCESSING_EXPERIMENT_SOURCES[id].map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></li>`).join('')}</ul></div></details></div></div></section>`;
  const find=selector=>container.querySelector(selector);
  function draw(notice=''){
    const result=definition.calculate(state),view=definition.render(state,result);
    find('.processing-value').textContent=view.value;find('.processing-label').textContent=view.label;find('.processing-figure').innerHTML=definition.diagram(state,result);find('.processing-observation').textContent=view.observation;
    find('.processing-readings').innerHTML=view.readings.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('');
    const message=find('.processing-notice');message.textContent=notice;message.hidden=!notice;
    for(const control of definition.controls){const input=find(`[data-processing-input="${control.name}"]`),minimum=control.name==='productPercent'?state.feedPercent:control.min,formatted=control.format(state[control.name]);input.min=minimum;input.value=state[control.name];input.setAttribute('aria-valuetext',formatted);find(`[data-processing-reading="${control.name}"]`).textContent=formatted;find(`[data-processing-min="${control.name}"]`).textContent=control.format(minimum);}
  }
  const onInput=event=>{
    const control=definition.controls.find(item=>item.name===event.target?.dataset?.processingInput);if(!control||String(event.target.value).trim()==='')return;const raw=Number(event.target.value);if(!Number.isFinite(raw))return;
    state[control.name]=Math.max(control.min,Math.min(control.max,raw));let notice='';
    if(id==='processing-concentration'&&state.productPercent<state.feedPercent){const previous=state.productPercent;state.productPercent=state.feedPercent;notice=`濃縮要求 xP ≥ xF；產品由 ${percent(previous)} 調至 ${percent(state.feedPercent)}，原料維持 ${percent(state.feedPercent)}。`;}
    draw(notice);
  };
  const onClick=event=>{if(event.target?.closest?.('[data-processing-action]')?.dataset?.processingAction!=='reset')return;Object.assign(state,definition.initial);draw();};
  container.addEventListener('input',onInput);container.addEventListener('click',onClick);draw();
  return ()=>{container.removeEventListener('input',onInput);container.removeEventListener('click',onClick);};
}
