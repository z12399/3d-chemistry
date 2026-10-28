import {escapeHTML as esc} from './storage.js';

export const REFRIGERATION_EXPERIMENT_IDS=Object.freeze(['processing-refrigeration-cycle']);
export const REFRIGERATION_EXPERIMENT_SOURCES=Object.freeze({
  'processing-refrigeration-cycle':Object.freeze([
    {title:'CoolProp · R134a 狀態方程與文獻',url:'https://coolprop.org/fluid_properties/fluids/R134a.html'},
    {title:'CoolProp · 簡單蒸氣壓縮循環',url:'https://coolprop.org/coolprop/python-cycles.html'},
    {title:'FAO · 製冷的四個設備（歷史工程教材）',url:'https://www.fao.org/4/r1076e/R1076E04.HTM'},
  ]),
});
export const REFRIGERATION_DEFAULTS=Object.freeze({teC:-10,tcC:40,eta:.8,massFlowKgS:.05});
export const REFRIGERATION_GRID=Object.freeze({teC:Object.freeze([-30,-20,-10,0,10]),tcC:Object.freeze([25,30,35,40,45,50]),eta:Object.freeze([.6,.7,.8,.9,1])});
const close=(a,b)=>Math.abs(a-b)<=1e-6*Math.max(1,Math.abs(a),Math.abs(b));
function finite(n,name){if(typeof n!=='number'||!Number.isFinite(n))throw new TypeError(`${name} must be finite`);}
function requireCondition(ok,message){if(!ok)throw new RangeError(message);}

/** Published states use kJ/kg, kPa, °C and kJ/(kg K). No table interpolation. */
export function refrigerationBalance(row,massFlowKgS=.05){
  finite(massFlowKgS,'mass flow');requireCondition(massFlowKgS>0,'Mass flow must be positive');
  const s=row?.states;
  for(const key of ['1','2','2s','3','4']){
    if(!s?.[key])throw new TypeError(`Missing state ${key}`);
    for(const field of ['tC','pKPa','hKJkg','sKJkgK'])finite(s[key][field],`${key}.${field}`);
    requireCondition(s[key].pKPa>0&&s[key].tC>-273.15,'Invalid state pressure or temperature');
  }
  const qL=s['1'].hKJkg-s['4'].hKJkg,w=s['2'].hKJkg-s['1'].hKJkg,qH=s['2'].hKJkg-s['3'].hKJkg;
  requireCondition(qL>0&&w>0&&qH>0,'Cycle must absorb heat and consume work');
  requireCondition(close(s['3'].hKJkg,s['4'].hKJkg),'Expansion must be isenthalpic');
  const result={qLKJkg:qL,wKJkg:w,qHKJkg:qH,cop:qL/w,coolingKW:massFlowKgS*qL,shaftKW:massFlowKgS*w,rejectionKW:massFlowKgS*qH};
  for(const [key,value] of Object.entries(result))finite(value,key);
  requireCondition(result.coolingKW>0&&result.shaftKW>0,'Rate is below numeric range');
  return result;
}

export function validateRefrigerationData(data){
  if(data?.schema!=='refrigeration-properties/v1'||data.fluid!=='R134a'||data.backend!=='HEOS'||data.referenceState?.name!=='IIR')throw new TypeError('Unsupported refrigerant property table');
  requireCondition(typeof data.provenance?.coolpropVersion==='string'&&data.provenance.coolpropVersion.length>0,'Missing calculation provenance');
  for(const [key,value] of Object.entries({tC:'degC',pKPa:'kPa (absolute)',hKJkg:'kJ/kg',sKJkgK:'kJ/(kg K)'}))requireCondition(data.units?.[key]===value,`Incorrect unit ${key}`);
  for(const key of Object.keys(REFRIGERATION_GRID))requireCondition(JSON.stringify(data.grid?.[key])===JSON.stringify(REFRIGERATION_GRID[key]),`Unexpected ${key} grid`);
  requireCondition(Array.isArray(data.rows)&&data.rows.length===150,'Incomplete property grid');
  const seen=new Set(),ids=new Set();
  for(const row of data.rows){
    for(const key of Object.keys(REFRIGERATION_GRID))requireCondition(REFRIGERATION_GRID[key].includes(row[key]),`Off-grid ${key}`);
    const tuple=`${row.teC}/${row.tcC}/${row.eta}`;
    requireCondition(!seen.has(tuple)&&typeof row.id==='string'&&row.id&&!ids.has(row.id),'Duplicate property state');seen.add(tuple);ids.add(row.id);
    const b=refrigerationBalance(row),s=row.states;
    requireCondition(s['2'].pKPa>s['1'].pKPa,'Compression must increase pressure');
    requireCondition(close(s['1'].pKPa,s['4'].pKPa)&&close(s['2'].pKPa,s['3'].pKPa)&&close(s['2s'].pKPa,s['2'].pKPa),'Inconsistent pressure levels');
    requireCondition(close(s['1'].tC,row.teC)&&close(s['4'].tC,row.teC)&&close(s['3'].tC,row.tcC)&&s['2'].tC>row.tcC,'Inconsistent temperature levels');
    requireCondition(close(s['2s'].sKJkgK,s['1'].sKJkgK)&&s['2'].sKJkgK+1e-8>=s['1'].sKJkgK,'Invalid compressor entropy');
    requireCondition(close((s['2s'].hKJkg-s['1'].hKJkg)/b.wKJkg,row.eta),'Inconsistent isentropic efficiency');
    finite(row.x4,'x4');requireCondition(row.x4>0&&row.x4<1,'Expansion outlet must be a mixture');
    for(const key of ['qLKJkg','wKJkg','qHKJkg','cop']){finite(row[key],key);requireCondition(close(row[key],b[key]),`Incorrect ${key}`);}
    const carnot=(row.teC+273.15)/(row.tcC-row.teC);finite(row.carnotCop,'Carnot COP');
    requireCondition(close(row.carnotCop,carnot)&&row.cop<carnot,'Invalid reference COP');
  }
  requireCondition(Array.isArray(data.saturationDome)&&data.saturationDome.length===136,'Incomplete saturation lines');
  data.saturationDome.forEach((p,i)=>{
    requireCondition(p.tC===i-40,'Invalid saturation temperature grid');finite(p.pKPa,'saturation pressure');requireCondition(p.pKPa>0,'Invalid saturation pressure');
    for(const side of ['liquid','vapor'])for(const key of ['hKJkg','sKJkgK'])finite(p[side]?.[key],`${side}.${key}`);
    requireCondition(p.vapor.hKJkg>p.liquid.hKJkg&&p.vapor.sKJkgK>p.liquid.sKJkgK,'Invalid saturation branches');
    if(i)requireCondition(p.pKPa>data.saturationDome[i-1].pKPa,'Saturation pressure must increase');
  });
  return data;
}

export function selectRefrigerationRow(data,{teC,tcC,eta}={}){
  for(const [key,value] of Object.entries({teC,tcC,eta})){finite(value,key);requireCondition(REFRIGERATION_GRID[key].includes(value),`Choose a published ${key} value`);}
  const matches=data.rows.filter(row=>row.teC===teC&&row.tcC===tcC&&row.eta===eta);
  requireCondition(matches.length===1,'A unique property row is required');return matches[0];
}

const num=(n,d=2)=>n.toLocaleString('en-US',{maximumFractionDigits:d});
const stages=Object.freeze([
  {name:'蒸發器',path:'4 → 1',equation:'qL = h₁ − h₄',description:'低壓的液汽混合物吸熱，成為飽和蒸汽。此處移走食品端的熱。',color:'cold'},
  {name:'壓縮機',path:'1 → 2',equation:'w = h₂ − h₁',description:'輸入功，將蒸汽推到高壓。出口是過熱蒸汽；冷凝器接著把熱排走。',color:'work'},
  {name:'冷凝器',path:'2 → 3',equation:'qH = h₂ − h₃',description:'高壓蒸汽先降溫，再凝結成飽和液體。排出的熱包含吸收的熱與壓縮功。',color:'hot'},
  {name:'膨脹閥',path:'3 → 4',equation:'h₃ = h₄',description:'節流降低壓力，部分液體汽化。出口是低壓液汽混合物，不是全液態。',color:'cold'},
]);

function cycleSVG(active,prefix){
  const devices=[{x:100,y:204},{x:316,y:204},{x:316,y:65},{x:100,y:65}];
  const lines=['M166 204 H246','M316 177 V98','M250 65 H170','M100 92 V172'];
  return `<svg viewBox="0 0 420 282" role="img" aria-label="冷媒依序經蒸發器、壓縮機、冷凝器、膨脹閥再回蒸發器。目前查看${stages[active].name}。"><defs><marker id="${prefix}-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="currentColor"/></marker></defs>${lines.map((line,i)=>`<path d="${line}" class="ref-pipe ${i===0||i===3?'ref-cold':'ref-hot'}" marker-end="url(#${prefix}-arrow)"/>`).join('')}<text x="208" y="133" text-anchor="middle" class="ref-center">R134a</text><text x="208" y="155" text-anchor="middle" class="ref-sub">簡單壓縮循環</text>${devices.map((p,i)=>`<g data-ref-device="${i}" class="ref-device ${i===active?'is-selected':''} ${stages[i].color}"><rect x="${p.x-65}" y="${p.y-27}" width="130" height="54" rx="10"/><text x="${p.x}" y="${p.y+5}" text-anchor="middle">${stages[i].name}</text></g>`).join('')}${[[208,204,'1'],[316,137,'2'],[208,65,'3'],[100,137,'4']].map(([x,y,label])=>`<g class="ref-state"><circle cx="${x}" cy="${y}" r="12"/><text x="${x}" y="${y+5}" text-anchor="middle">${label}</text></g>`).join('')}<path d="M316 37V14" class="ref-energy ref-hot" marker-end="url(#${prefix}-arrow)"/><text x="287" y="19" text-anchor="end" class="ref-hot">排熱 qH</text><path d="M100 261V235" class="ref-energy ref-cold" marker-end="url(#${prefix}-arrow)"/><text x="100" y="280" text-anchor="middle" class="ref-cold">吸熱 qL</text><path d="M316 261V235" class="ref-energy ref-work" marker-end="url(#${prefix}-arrow)"/><text x="316" y="280" text-anchor="middle" class="ref-work">輸入功 w</text></svg>`;
}

export function refrigerationPHDiagram(data,row,active=0){
  requireCondition(Number.isInteger(active)&&active>=0&&active<4,'Invalid cycle stage');
  const x=h=>54+(h-100)/440*348,y=p=>262-Math.log10(p/50)/Math.log10(4000/50)*220;
  const point=key=>`${x(row.states[key].hKJkg)},${y(row.states[key].pKPa)}`;
  const pairs=[['4','1'],['1','2'],['2','3'],['3','4']];
  return `<svg viewBox="0 0 420 310" role="img" aria-label="R134a 壓力焓圖，壓力使用對數軸。${stages[active].path} ${stages[active].name}醒目顯示。線段連接計算端點，非實測路徑。"><text x="54" y="22" class="ref-plot-title">p · kPa（對數）</text>${[100,500,1000,3000].map(p=>`<path d="M54 ${y(p)}H402" class="ref-grid"/><text x="47" y="${y(p)+4}" text-anchor="end">${p}</text>`).join('')}${[100,200,300,400,500].map(h=>`<text x="${x(h)}" y="284" text-anchor="middle">${h}</text>`).join('')}<text x="402" y="306" text-anchor="end">h · kJ/kg</text>${['liquid','vapor'].map(side=>`<path d="${data.saturationDome.map((p,i)=>`${i?'L':'M'}${x(p[side].hKJkg)},${y(p.pKPa)}`).join(' ')}" class="ref-saturation"/>`).join('')}${pairs.map(([a,b],i)=>`<path d="M${point(a)}L${point(b)}" class="ref-cycle-line ${i===1?'ref-compression':''} ${i===active?'is-selected':''}"/>`).join('')}${['1','2','3','4'].map(key=>`<circle cx="${x(row.states[key].hKJkg)}" cy="${y(row.states[key].pKPa)}" r="5" class="ref-point"/><text x="${x(row.states[key].hKJkg)+(key==='3'||key==='4'?-12:10)}" y="${y(row.states[key].pKPa)+(key==='1'||key==='4'?19:-10)}" text-anchor="${key==='3'||key==='4'?'end':'start'}" class="ref-point-label">${key}</text>`).join('')}</svg>`;
}

function slider(prefix,key,label,values,initial,format){return `<div class="food-exp-control"><div class="food-exp-control-label"><label for="${prefix}-${key}">${label}</label><output data-ref-reading="${key}" for="${prefix}-${key}">${format(initial)}</output></div><input id="${prefix}-${key}" type="range" min="0" max="${values.length-1}" step="1" value="${values.indexOf(initial)}" data-ref-input="${key}" aria-valuetext="${format(initial)}"><div class="food-exp-endpoints" aria-hidden="true"><span>${format(values[0])}</span><span>${format(values.at(-1))}</span></div></div>`;}
const flows=Object.freeze([.01,.02,.03,.04,.05,.06,.07,.08,.09,.1]);
const controls={teC:{values:REFRIGERATION_GRID.teC,label:'蒸發溫度 Te',format:v=>`${v}°C`},tcC:{values:REFRIGERATION_GRID.tcC,label:'冷凝溫度 Tc',format:v=>`${v}°C`},eta:{values:REFRIGERATION_GRID.eta,label:'壓縮機等熵效率 η',format:v=>`${num(v*100,0)}%`},massFlowKgS:{values:flows,label:'冷媒質量流率',format:v=>`${num(v,2)} kg/s`}};
let serial=0;
const drafts=new WeakMap(),mounted=new WeakMap();
function draftSlot(owner,key){
  if(!owner||(typeof owner!=='object'&&typeof owner!=='function'))return null;
  let entries=drafts.get(owner);if(!entries){entries=new Map();drafts.set(owner,entries);}
  let slot=entries.get(key);if(!slot){slot={snapshot:null,dispose:null};entries.set(key,slot);}return slot;
}
export function mountRefrigerationExperiment(container,id,{draftOwner,draftKey=id}={}){
  if(!REFRIGERATION_EXPERIMENT_IDS.includes(id))throw new RangeError(`Unknown refrigeration experiment: ${id}`);
  if(!container?.querySelector||!container.addEventListener||!container.removeEventListener)throw new TypeError('A DOM container is required');
  mounted.get(container)?.();
  const slot=draftSlot(draftOwner,typeof draftKey==='string'&&draftKey.trim()?draftKey:id);slot?.dispose?.();
  const prefix=`refrigeration-${++serial}`,state={...REFRIGERATION_DEFAULTS},controller=new AbortController();
  for(const [key,c]of Object.entries(controls)){const value=slot?.snapshot?.values?.[key];if(c.values.includes(value))state[key]=value;}
  let disposed=false,data,active=0,loading=false,panels=null;
  if(Number.isInteger(slot?.snapshot?.active)&&slot.snapshot.active>=0&&slot.snapshot.active<4)active=slot.snapshot.active;
  const detailState=slot?.snapshot?.details?.slice()||[];
  const find=selector=>container.querySelector(selector);
  const control=key=>slider(prefix,key,controls[key].label,controls[key].values,state[key],controls[key].format);
  function draw(){
    const row=selectRefrigerationRow(data,state),b=refrigerationBalance(row,state.massFlowKgS),stage=stages[active];
    find('.ref-cycle').innerHTML=cycleSVG(active,prefix);find('.ref-ph').innerHTML=refrigerationPHDiagram(data,row,active);
    find('.ref-step-title').textContent=`${stage.path} · ${stage.name}`;find('.ref-step-equation').textContent=stage.equation;find('.ref-step-description').textContent=stage.description;
    container.querySelectorAll('[data-ref-stage]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.refStage)===active)));
    find('.ref-cop').textContent=num(b.cop,2);find('.ref-balance').innerHTML=`<span>移走熱量 <strong>${num(b.qLKJkg,1)}</strong></span><span>＋ 壓縮功 <strong>${num(b.wKJkg,1)}</strong></span><span>≈ 排出熱量 <strong>${num(b.qHKJkg,1)}</strong></span>`;
    find('.ref-work-share').style.width=`${b.wKJkg/b.qHKJkg*100}%`;find('.ref-cooling-share').style.width=`${b.qLKJkg/b.qHKJkg*100}%`;
    find('.ref-power').textContent=`冷卻能力 ${num(b.coolingKW,2)} kW · 壓縮軸功 ${num(b.shaftKW,2)} kW · 排熱 ${num(b.rejectionKW,2)} kW`;
    find('.ref-quality').textContent=`閥出口汽相質量分率 x₄ = ${num(row.x4,3)}。它描述冷媒，不是食品的結冰比例。`;
    find('.ref-pressures').textContent=`低壓 ${num(row.states['1'].pKPa,1)} kPa ／ 高壓 ${num(row.states['2'].pKPa,1)} kPa（絕對壓力）`;
    find('.ref-state-rows').innerHTML=['1','2','3','4'].map((key,i)=>{const s=row.states[key];return `<tr><th scope="row">${key}<small>${['飽和蒸汽','過熱蒸汽','飽和液體','液汽混合'][i]}</small></th><td>${num(s.tC,1)}</td><td>${num(s.pKPa,1)}</td><td>${num(s.hKJkg,2)}</td></tr>`;}).join('');
    find('.ref-isentropic').textContent=`同出口壓力的等熵對照 2s：h₂s = ${num(row.states['2s'].hKJkg,2)} kJ/kg。η = (h₂s − h₁)/(h₂ − h₁)；η = 1 時兩出口重合。`;
    for(const [key,c] of Object.entries(controls)){const input=find(`[data-ref-input="${key}"]`);input.value=String(c.values.indexOf(state[key]));input.setAttribute('aria-valuetext',c.format(state[key]));find(`[data-ref-reading="${key}"]`).textContent=c.format(state[key]);}
  }
  function render(){
    container.innerHTML=`<section class="food-experiment refrigeration-experiment" aria-labelledby="${prefix}-title"><header class="food-exp-heading"><p class="food-exp-kicker">跟著冷媒，走一圈</p><h3 id="${prefix}-title">食品的熱，最後去了哪裡？</h3><p class="food-exp-hint">點選設備看變化，再改變兩端溫度。</p></header><div class="ref-layout"><div class="ref-visual"><div class="ref-cycle" tabindex="0" role="region" aria-label="冷媒循環圖，可橫向捲動"></div><div class="ref-steps" role="group" aria-label="選擇循環設備">${stages.map((s,i)=>`<button type="button" data-ref-stage="${i}" aria-pressed="${i===0}"><span>${s.path}</span>${s.name}</button>`).join('')}</div><div class="ref-step" aria-live="polite" aria-atomic="true"><p class="ref-step-title"></p><p class="ref-step-equation"></p><p class="ref-step-description"></p></div><button type="button" class="ref-next" data-ref-action="next">下一個設備 →</button></div><div class="ref-panel"><div class="ref-result" aria-live="polite" aria-atomic="true"><span>冷凍性能係數 COPR</span><output class="ref-cop"></output><p>每輸入 1 份功，移走多少熱？</p></div>${control('teC')}${control('tcC')}<div class="ref-energy-balance"><p>每公斤冷媒 · kJ/kg（顯示值四捨五入）</p><div class="ref-energy-bar" aria-hidden="true"><span class="ref-cooling-share"></span><span class="ref-work-share"></span></div><div class="ref-balance"></div></div><p class="ref-formula">qH = qL + w<br><small>COPR = qL / w</small></p><p class="ref-scope">R134a 簡化穩態循環，使用離線物性計算。Te、Tc 是冷媒飽和溫度，不是食品或室溫。</p><details class="food-exp-details"><summary>效率、流率與功率</summary><div class="food-exp-details-body">${control('eta')}${control('massFlowKgS')}<p class="ref-power" aria-live="polite"></p><p class="ref-note">流率 × 比能量 = 功率。流率加倍，三個功率一起加倍，COP 不變。這裡的 w 是軸功；馬達、風扇與輔機耗電另計。</p></div></details><button type="button" class="ref-reset" data-ref-action="reset">重設示例</button></div></div><details class="food-exp-details ref-properties"><summary>查看壓力焓圖與四個狀態</summary><div class="food-exp-details-body ref-property-layout"><div><div class="ref-ph" tabindex="0" role="region" aria-label="壓力焓圖，可橫向捲動"></div><p class="ref-note">灰線為 −40～95°C 的飽和液／汽線；未畫至臨界點。彩線連接計算端點，壓縮虛線不表示設備內的真實路徑。</p></div><div><p class="ref-pressures"></p><div class="ref-table-scroll" tabindex="0" role="region" aria-label="冷媒計算狀態表，可橫向捲動"><table><caption>R134a 計算狀態 · IIR 基準</caption><thead><tr><th scope="col">狀態</th><th scope="col">T · °C</th><th scope="col">p · kPa</th><th scope="col">h · kJ/kg</th></tr></thead><tbody class="ref-state-rows"></tbody></table></div><p class="ref-quality"></p><p class="ref-note ref-isentropic"></p></div></div></details><details class="food-exp-details"><summary>模型假設與來源</summary><div class="food-exp-details-body"><p class="ref-note">CoolProp ${esc(data.provenance.coolpropVersion)} · HEOS R134a · IIR。150 組離散條件以狀態方程計算，不是量測值；滑桿逐格選值，沒有內插或設備性能校正。</p><p class="ref-note">蒸發器出口為飽和蒸汽，冷凝器出口為飽和液體；不另設吸氣過熱、出口液體過冷與管路壓損。壓縮機絕熱，以等熵效率求出口；閥門絕熱、無軸功，忽略動位能變化，故等焓節流。</p><p class="ref-note">未解食品熱傳、實際冷凍時間、蒸發器熱交換面積或控制系統，也不是冷媒選型建議。舊 FAO 資料僅用於設備原理，不採用其中冷媒選擇與歷史價格。</p><ul class="food-exp-sources">${REFRIGERATION_EXPERIMENT_SOURCES[id].map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></li>`).join('')}</ul></div></details></section>`;
    panels=Array.from(container.querySelectorAll('.food-exp-details'));
    panels.forEach((panel,i)=>panel.open=detailState[i]===true);
    draw();
  }
  async function load(){
    if(loading||disposed)return;loading=true;container.innerHTML='<p class="ref-loading" role="status">正在載入冷媒物性…</p>';
    try{const response=await fetch(new URL('../data/refrigeration-properties.json',import.meta.url),{signal:controller.signal});if(!response.ok)throw new Error('Property table unavailable');const parsed=await response.json();if(disposed)return;data=validateRefrigerationData(parsed);render();}
    catch(error){if(!disposed){container.innerHTML='<p class="ref-load-error" role="alert">冷媒物性暫時無法載入，計算尚未開始。</p><button type="button" data-ref-action="retry">重新載入資料</button>';}}
    finally{loading=false;}
  }
  const onInput=event=>{if(disposed||!data)return;const key=event.target?.dataset?.refInput;if(!Object.hasOwn(controls,key))return;const c=controls[key];if(event.target!==find(`[data-ref-input="${key}"]`)||String(event.target.value).trim()==='')return;const index=Number(event.target.value);if(!Number.isInteger(index)||index<0||index>=c.values.length)return;state[key]=c.values[index];draw();};
  const onClick=event=>{if(disposed)return;const button=event.target?.closest?.('button, [data-ref-device]');if(!button||!container.contains(button))return;if(button.dataset.refAction==='retry'){void load();return;}if(!data)return;if(button.dataset.refStage!==undefined||button.dataset.refDevice!==undefined){const n=Number(button.dataset.refStage??button.dataset.refDevice);if(Number.isInteger(n)&&n>=0&&n<4)active=n;}else if(button.dataset.refAction==='next')active=(active+1)%4;else if(button.dataset.refAction==='reset'){Object.assign(state,REFRIGERATION_DEFAULTS);active=0;}else return;draw();};
  function dispose(){
    if(disposed)return;
    if(slot)slot.snapshot={values:{...state},active,details:panels?panels.map(panel=>panel.open===true):detailState.slice()};
    disposed=true;controller.abort();container.removeEventListener('input',onInput);container.removeEventListener('click',onClick);
    if(slot?.dispose===dispose)slot.dispose=null;if(mounted.get(container)===dispose)mounted.delete(container);
  }
  if(slot)slot.dispose=dispose;mounted.set(container,dispose);
  container.addEventListener('input',onInput);container.addEventListener('click',onClick);void load();
  return dispose;
}
