// Small, self-contained teaching models. Inputs describe a model, not a food sample.
export const EXPERIMENT_SOURCES = Object.freeze({
  'water-activity': Object.freeze([
    {title:'FDA · Water Activity (aw) in Foods',url:'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/inspection-technical-guides/water-activity-aw-foods'},
  ]),
  'acid-base': Object.freeze([
    {title:'OpenStax · Biological Acids and the Henderson–Hasselbalch Equation',url:'https://openstax.org/books/organic-chemistry/pages/20-3-biological-acids-and-the-henderson-hasselbalch-equation'},
  ]),
  'enzyme-rate': Object.freeze([
    {title:'Cal Poly · Enzyme kinetics',url:'https://chem.libretexts.org/Courses/California_Polytechnic_State_University_San_Luis_Obispo/Survey_of_Biochemistry_and_Biotechnology/10%3A_Supplemental_Modules_%28Biochemistry%29/10.05%3A_6._Lab_Notes_Part_2/10.5.02%3A_Enzyme_kinetics'},
    {title:'NIH Assay Guidance Manual · Inhibition models',url:'https://www.ncbi.nlm.nih.gov/books/NBK92001/table/enzymemoa.T.summary_of_competitive_nonco/'},
  ]),
  'temperature-rate': Object.freeze([
    {title:'OpenStax · Collision Theory and the Arrhenius equation',url:'https://openstax.org/books/chemistry-2e/pages/12-5-collision-theory'},
  ]),
});

function finite(value,name){
  if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(`${name} must be a finite number`);
  return value;
}
function nonnegative(value,name){
  finite(value,name);
  if(value<0)throw new RangeError(`${name} must be nonnegative`);
  return value;
}
function positive(value,name){
  finite(value,name);
  if(value<=0)throw new RangeError(`${name} must be positive`);
  return value;
}

/** Both pressures must be equilibrium water-vapor pressures at the same temperature. */
export function waterActivity(vaporPressure,pureWaterPressure){
  nonnegative(vaporPressure,'vaporPressure');
  positive(pureWaterPressure,'pureWaterPressure');
  if(vaporPressure>pureWaterPressure)throw new RangeError('This food-water model requires p ≤ p₀');
  const aw=vaporPressure/pureWaterPressure;
  return {aw,erh:100*aw};
}

/** Ideal, monoprotic HA ⇌ H+ + A− speciation at a specified equilibrium pH. */
export function undissociatedFraction(pH,pKa){
  finite(pH,'pH');finite(pKa,'pKa');
  const difference=pH-pKa;
  // Both branches avoid overflow for finite but widely separated pH/pKa values.
  if(difference>=0){const ratio=10**(-difference);return ratio/(1+ratio);}
  return 1/(1+10**difference);
}

/** Initial-rate model; all concentrations use the same units. */
export function michaelisMenten({substrate,km=1,vmax=1,inhibitor=0,ki=1,mode='none'}){
  nonnegative(substrate,'substrate');positive(km,'km');nonnegative(vmax,'vmax');
  nonnegative(inhibitor,'inhibitor');positive(ki,'ki');
  if(!['none','competitive','noncompetitive'].includes(mode))throw new RangeError('Unknown inhibition model');
  const alpha=mode==='none'?1:1+inhibitor/ki;
  if(!Number.isFinite(alpha))throw new RangeError('Inhibitor ratio exceeds the model numeric range');
  const apparentKm=mode==='competitive'?km*alpha:km;
  const apparentVmax=mode==='noncompetitive'?vmax/alpha:vmax;
  if(!Number.isFinite(apparentKm))throw new RangeError('Apparent Km exceeds the model numeric range');
  const velocity=substrate===0?0:apparentVmax/(1+apparentKm/substrate);
  return {velocity,apparentKm,apparentVmax,alpha};
}

export const GAS_CONSTANT=8.31446261815324; // J mol−1 K−1

/** Ea in kJ/mol; inputs in °C are converted to K before applying Arrhenius. */
export function arrheniusRelativeRate({temperatureC,referenceC=25,activationEnergyKJ=50}){
  finite(temperatureC,'temperatureC');finite(referenceC,'referenceC');
  nonnegative(activationEnergyKJ,'activationEnergyKJ');
  const temperatureK=temperatureC+273.15,referenceK=referenceC+273.15;
  positive(temperatureK,'absolute temperature');positive(referenceK,'absolute reference temperature');
  const exponent=activationEnergyKJ*1000/GAS_CONSTANT*(1/referenceK-1/temperatureK);
  const ratio=Math.exp(exponent);
  if(!Number.isFinite(ratio)||ratio===0)throw new RangeError('Rate ratio exceeds the model numeric range');
  return ratio;
}

const colors={ink:'#203038',muted:'#64716f',line:'#d8ddd4',copper:'#b9543a',mint:'#286e64',soft:'#f3e1d6',paper:'#fffdf9'};
const number=(value,digits=1)=>Number(value.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits});
const percent=value=>number(value*100,1)+'%';
const ratioText=value=>value>=10000||value<0.01?value.toExponential(2):number(value,value<1?3:2);
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let instance=0;

const definitions={
  'water-activity':{
    question:'空氣達到平衡後，水活性是多少？',
    initial:{erh:75},
    main:{name:'erh',label:'平衡相對濕度 ERH',min:0,max:100,step:1,format:v=>`${number(v,0)}%`},
    advanced:[],
    formula:'a<sub>w</sub> = p / p₀ = ERH / 100',
    assumptions:'p 是食品上方的平衡水蒸氣壓，p₀ 是同溫純水的飽和蒸氣壓。這裡換算已知的 ERH；含水量與水活性的關係，需要該食品在指定溫度的吸濕等溫線。',
    hint:'拖動 ERH，比較食品上方與純水上方的蒸氣壓。',
    render(state){
      const result=waterActivity(state.erh,100),L=104,R=371,width=R-L;
      const grid=[0,.5,1].map(value=>`<path d="M${L+width*value},38V171" class="food-exp-grid"/><text x="${L+width*value}" y="193" text-anchor="middle">${value}</text>`).join('');
      return {
        value:result.aw.toFixed(2),label:'水活性 aw',
        observation:`食品上方的平衡蒸氣壓，是同溫純水的 ${number(result.erh,0)}%。`,
        chart:svg(`ERH ${state.erh}%，水活性 ${result.aw.toFixed(2)}。比較的是蒸氣壓，不是水量。`,`${grid}<text x="88" y="74" text-anchor="end">純水 p₀</text><text x="88" y="139" text-anchor="end">食品 p</text><rect x="${L}" y="54" width="${width}" height="29" rx="4" fill="${colors.line}"/><rect x="${L}" y="119" width="${width}" height="29" rx="4" fill="${colors.soft}"/><rect data-current-bar x="${L}" y="119" width="${width*result.aw}" height="29" rx="4" fill="${colors.copper}"/><text x="${R}" y="222" text-anchor="end">相對蒸氣壓 p / p₀</text>`),
      };
    },
  },
  'acid-base':{
    question:'改變 pH，多少弱酸還保留著 H？',
    initial:{ph:4.76,pka:4.76},
    main:{name:'ph',label:'溶液 pH',min:0,max:14,step:0.01,format:v=>number(v,2)},
    advanced:[{name:'pka',label:'弱酸 pKa',min:1,max:10,step:0.01,format:v=>number(v,2)}],
    formula:'HA ⇌ H⁺ + A⁻<br>pH = pKa + log₁₀([A⁻] / [HA])<br>HA 比例 = 1 / (1 + 10<sup>pH − pKa</sup>)',
    assumptions:'單質子弱酸、稀溶液，以濃度近似活度。pH 是已知的平衡值；本模型不從加酸量計算 pH，也不計緩衝容量。預設 pKa 4.76 取醋酸的教材值，溫度與介質改變時應使用相應的 pKa。',
    hint:'先把 pH 移到 pKa 兩側，觀察未解離比例。',
    render(state){
      const fraction=undissociatedFraction(state.ph,state.pka),g=graph(0,14,0,100);
      const curve=points(140,i=>[i/10,undissociatedFraction(i/10,state.pka)*100]);
      return {
        value:percent(fraction),label:'未解離的 HA',
        observation:`A⁻ 占 ${percent(1-fraction)}。${Math.abs(state.ph-state.pka)<.005?'此刻 pH = pKa，兩種形式各占一半。':state.ph<state.pka?'pH 低於 pKa，HA 比例較高。':'pH 高於 pKa，A⁻ 比例較高。'}`,
        chart:svg(`pH ${number(state.ph,2)}，pKa ${number(state.pka,2)}，未解離 HA ${percent(fraction)}`,`${axes(g,{xticks:[0,7,14],yticks:[0,50,100],xLabel:'pH',yLabel:'HA (%)'})}<path d="M${g.x(state.pka)},${g.T}V${g.B}" class="food-exp-reference"/><text x="${Math.min(g.R-5,Math.max(g.L+29,g.x(state.pka)))}" y="${g.T+18}" text-anchor="middle" fill="${colors.muted}">pKa</text>${curvePath(curve,g)}${marker(state.ph,fraction*100,g)}`),
      };
    },
  },
  'enzyme-rate':{
    question:'多加受質，能把速率補回來嗎？',
    initial:{substrate:1,mode:'none',inhibitor:2},
    main:{name:'substrate',label:'受質濃度 [S] / Km',min:0,max:12,step:.1,format:v=>`${number(v,1)} 倍`},
    advanced:[{name:'inhibitor',label:'抑制劑濃度 [I] / Ki',min:0,max:10,step:.1,format:v=>`${number(v,1)} 倍`}],
    choice:{name:'mode',label:'抑制方式',options:[['none','無抑制'],['competitive','競爭抑制'],['noncompetitive','純非競爭抑制']]},
    assumptions:'固定同一酵素的基準活性位濃度與溫度、pH，採單受質、準穩態初速模型：ES 的生成與流出近似相等、庫存變化小，產物仍可形成，並非平衡。忽略產物逆反應與受質消耗。抑制為可逆且游離 [I] 近似設定值；純非競爭假設抑制劑對 E 與 ES 的親和力相同。橫、縱軸皆以無抑制時的 Km、Vmax 正規化；Km 不直接等同結合常數 Kd。',
    hint:'先指定可逆抑制模型，再提高受質濃度，檢查模型預測；這是指定參數推演，沒有實測點。',
    render(state){
      const evaluate=s=>michaelisMenten({substrate:s,inhibitor:state.inhibitor,mode:state.mode});
      const result=evaluate(state.substrate),g=graph(0,12,0,100),inhibited=state.mode!=='none'&&state.inhibitor>0;
      const baseline=curvePath(points(120,i=>[i/10,michaelisMenten({substrate:i/10}).velocity*100]),g,'food-exp-baseline');
      const curve=curvePath(points(120,i=>[i/10,evaluate(i/10).velocity*100]),g);
      const observation=!inhibited?'[S] = Km 時，初速為無抑制 Vmax 的一半。':state.mode==='competitive'?`表觀 Km 增為 ${number(result.apparentKm,1)} 倍；持續增加受質，可逐漸接近原來的 Vmax。`:`表觀 Km 不變；增加受質後，最高仍只能接近原 Vmax 的 ${percent(result.apparentVmax)}。`;
      const formula=state.mode==='competitive'?'v = Vmax [S] / (α Km + [S])':state.mode==='noncompetitive'?'v = (Vmax / α) [S] / (Km + [S])':'v = Vmax [S] / (Km + [S])';
      return {
        value:percent(result.velocity),label:'初速 / 無抑制 Vmax',observation,
        formula:formula+(state.mode==='none'?'':'<br>α = 1 + [I] / Ki'),
        chart:svg(`受質為 Km 的 ${number(state.substrate,1)} 倍，${definitions['enzyme-rate'].choice.options.find(o=>o[0]===state.mode)[1]}，初速為無抑制 Vmax 的 ${percent(result.velocity)}`,`${axes(g,{xticks:[0,6,12],yticks:[0,50,100],xLabel:'[S] / Km',yLabel:'v / Vmax (%)'})}${inhibited?baseline:''}${curve}${marker(state.substrate,result.velocity*100,g)}`),
        caption:inhibited?'指定模型推演，非實測。灰色虛線：無抑制；座標基準固定。':'指定模型推演，非實測；Km、Vmax 以無抑制時為基準。',
      };
    },
  },
  'temperature-rate':{
    question:'升高溫度，速率常數會增加幾倍？',
    initial:{temperature:35,reference:25,activation:50},
    main:{name:'temperature',label:'反應溫度',min:0,max:100,step:1,format:v=>`${number(v,0)} °C`},
    advanced:[
      {name:'activation',label:'活化能 Ea',min:0,max:120,step:1,format:v=>`${number(v,0)} kJ/mol`},
      {name:'reference',label:'比較基準溫度',min:0,max:60,step:1,format:v=>`${number(v,0)} °C`},
    ],
    formula:'k / kref = exp[(Ea / R)(1 / Tref − 1 / T)]',
    assumptions:'同一反應機制，假設此溫區內 Ea 與頻率因子 A 不變；所有溫度先換成 K，Ea 先換成 J/mol，R = 8.314 J/(mol·K)。參數是可調的教學例子。這是速率常數比，不是反應完成度、保存期限或殺菌效果；相變、酵素失活與多重反應均未納入。',
    hint:'拖動溫度，再展開參數比較不同活化能。',
    render(state){
      const evaluate=t=>arrheniusRelativeRate({temperatureC:t,referenceC:state.reference,activationEnergyKJ:state.activation});
      const ratio=evaluate(state.temperature),low=Math.min(-.1,Math.log10(evaluate(0))),high=Math.max(.1,Math.log10(evaluate(100)));
      const step=Math.max(1,Math.ceil((Math.ceil(high)-Math.floor(low))/4));
      const yMin=Math.floor(low/step)*step,yMax=Math.ceil(high/step)*step,g=graph(0,100,yMin,yMax);
      const ticks=[];for(let v=yMin;v<=yMax;v+=step)ticks.push(v);
      const label=v=>v===0?'1×':v===1?'10×':v===-1?'0.1×':`10${superscript(v)}×`;
      return {
        value:ratioText(ratio)+'×',label:`相對於 ${number(state.reference,0)} °C 的 k`,
        observation:`Ea = ${number(state.activation,0)} kJ/mol。${state.activation===0?'此模型設定 Ea = 0，溫度不改變 k。':state.temperature===state.reference?'目前與基準溫度相同。':state.temperature>state.reference?'溫度提高，k 隨之增加。':'溫度降低，k 隨之減少。'}`,
        chart:svg(`${state.temperature} °C 的速率常數，是 ${state.reference} °C 的 ${ratioText(ratio)} 倍；活化能 ${state.activation} kJ/mol`,`${axes(g,{xticks:[0,50,100],yticks:ticks,xLabel:'溫度 (°C)',yLabel:'k / kref',yFormat:label})}<path d="M${g.L},${g.y(0)}H${g.R}" class="food-exp-reference"/>${curvePath(points(100,i=>[i,Math.log10(evaluate(i))]),g)}${marker(state.temperature,Math.log10(ratio),g)}`),
        caption:'縱軸為對數刻度；1× 代表與基準溫度相同。',
      };
    },
  },
};

function superscript(value){return String(value).split('').map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]||(c==='-'?'⁻':'')).join('');}
function graph(xMin,xMax,yMin,yMax){
  const L=61,R=375,T=36,B=183;
  return {L,R,T,B,x:v=>L+(v-xMin)/(xMax-xMin)*(R-L),y:v=>B-(v-yMin)/(yMax-yMin)*(B-T)};
}
function svg(label,content){return `<svg viewBox="0 0 400 234" role="img" aria-label="${escape(label)}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;}
function points(count,point){return Array.from({length:count+1},(_,i)=>point(i));}
function curvePath(values,g,kind='food-exp-curve'){
  return `<path class="${kind}" d="${values.map(([x,y],i)=>`${i?'L':'M'}${g.x(x).toFixed(2)},${g.y(y).toFixed(2)}`).join(' ')}"/>`;
}
function marker(x,y,g){
  return `<path class="food-exp-marker-guide" d="M${g.x(x)},${g.B}V${g.y(y)}"/><circle data-current-marker cx="${g.x(x)}" cy="${g.y(y)}" r="5.5" fill="${colors.copper}" stroke="${colors.paper}" stroke-width="2.5"/>`;
}
function axes(g,{xticks,yticks,xLabel,yLabel,yFormat=number}){
  return `<text x="${g.L}" y="19" fill="${colors.muted}">${escape(yLabel)}</text>${yticks.map(value=>`<path d="M${g.L},${g.y(value)}H${g.R}" class="food-exp-grid"/><text x="${g.L-10}" y="${g.y(value)+5}" text-anchor="end">${escape(yFormat(value))}</text>`).join('')}${xticks.map(value=>`<text x="${g.x(value)}" y="${g.B+23}" text-anchor="middle">${escape(value)}</text>`).join('')}<text x="${g.R}" y="230" text-anchor="end">${escape(xLabel)}</text>`;
}

function controlHTML(control,state,prefix){
  const id=`${prefix}-${control.name}`,value=state[control.name];
  return `<div class="food-exp-control" data-control-group="${control.name}"><div class="food-exp-control-label"><label for="${id}">${control.label}</label><output for="${id}" data-reading="${control.name}">${escape(control.format(value))}</output></div><input id="${id}" type="range" data-control="${control.name}" min="${control.min}" max="${control.max}" step="${control.step}" value="${value}" aria-valuetext="${escape(control.format(value))}"/><div class="food-exp-endpoints" aria-hidden="true"><span>${escape(control.format(control.min))}</span><span>${escape(control.format(control.max))}</span></div></div>`;
}

/**
 * Mount one experiment into an empty lesson container.
 * IDs: water-activity | acid-base | enzyme-rate | temperature-rate.
 * Load food-experiments.css once in the host. Call the returned function on unmount.
 */
export function mountExperiment(container,id){
  const definition=definitions[id];
  if(!definition)throw new RangeError(`Unknown experiment: ${id}`);
  if(!container||typeof container.querySelector!=='function'||typeof container.addEventListener!=='function')throw new TypeError('A DOM container is required');
  const state={...definition.initial},prefix=`food-exp-${++instance}`,controls=[definition.main,...definition.advanced];
  const choice=definition.choice;
  const choiceHTML=choice?`<div class="food-exp-choice"><label for="${prefix}-${choice.name}">${choice.label}</label><select id="${prefix}-${choice.name}" data-control="${choice.name}">${choice.options.map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></div>`:'';
  container.innerHTML=`<section class="food-experiment" data-experiment="${id}" aria-labelledby="${prefix}-title"><header class="food-exp-heading"><p class="food-exp-kicker">動手比較</p><h3 id="${prefix}-title">${definition.question}</h3><p class="food-exp-hint">${definition.hint}</p></header><div class="food-exp-stage"><div class="food-exp-result" aria-live="polite" aria-atomic="true"><output class="food-exp-value"></output><span class="food-exp-result-label"></span></div><div class="food-exp-figure"></div><p class="food-exp-caption"></p></div>${choiceHTML}${controlHTML(definition.main,state,prefix)}<p class="food-exp-observation"></p><details class="food-exp-details"><summary>${definition.advanced.length?'調整參數與查看公式':'公式、假設與來源'}</summary><div class="food-exp-details-body">${definition.advanced.map(c=>controlHTML(c,state,prefix)).join('')}<p class="food-exp-equation">${definition.formula||''}</p><p class="food-exp-assumptions">${definition.assumptions}</p><ul class="food-exp-sources">${EXPERIMENT_SOURCES[id].map(source=>`<li><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)} ↗</a></li>`).join('')}</ul></div></details></section>`;
  const find=selector=>container.querySelector(selector);
  const figure=find('.food-exp-figure'),value=find('.food-exp-value'),resultLabel=find('.food-exp-result-label');
  const observation=find('.food-exp-observation'),caption=find('.food-exp-caption'),equation=find('.food-exp-equation');
  function draw(){
    const view=definition.render(state);
    figure.innerHTML=view.chart;value.textContent=view.value;resultLabel.textContent=view.label;
    observation.textContent=view.observation;caption.textContent=view.caption||'';caption.hidden=!view.caption;
    if(view.formula)equation.innerHTML=view.formula;
    for(const control of controls){
      const text=control.format(state[control.name]);
      find(`[data-reading="${control.name}"]`).textContent=text;
      find(`[data-control="${control.name}"]`).setAttribute('aria-valuetext',text);
    }
    if(id==='enzyme-rate')find('[data-control-group="inhibitor"]').hidden=state.mode==='none';
  }
  const onInput=event=>{
    const control=controls.find(item=>item.name===event.target?.dataset?.control);
    if(!control)return;
    const value=Number(event.target.value);
    if(!Number.isFinite(value))return;
    state[control.name]=Math.max(control.min,Math.min(control.max,value));
    draw();
  };
  const onChange=event=>{
    if(choice&&event.target?.dataset?.control===choice.name&&choice.options.some(([value])=>value===event.target.value)){
      state[choice.name]=event.target.value;draw();
    }
  };
  container.addEventListener('input',onInput);container.addEventListener('change',onChange);draw();
  return ()=>{container.removeEventListener('input',onInput);container.removeEventListener('change',onChange);};
}
