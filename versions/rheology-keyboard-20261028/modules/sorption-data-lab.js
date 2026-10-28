import {escapeHTML as esc} from './storage.js';
import {gabMoisture} from './water-phase-experiments.js';
import {SORPTION_DATA} from './sorption-measurements.js';

export {SORPTION_DATA};
export const SORPTION_LAB_ID='sorption-data';
export const SORPTION_LIMITS=Object.freeze({xm:[.005,.30],c:[.2,20],k:[.5,.99]});

function checkPoints(points){
  if(!Array.isArray(points)||!points.length)throw new TypeError('Measurements are required');
  for(const p of points)if(!p||!Number.isFinite(p.aw)||p.aw<0||p.aw>=1||!Number.isFinite(p.x)||p.x<0)throw new RangeError('Invalid measured point');
}

/** Unweighted comparison to reported means. All moisture values use g/g dry solids. */
export function sorptionMetrics(points,params){
  checkPoints(points);
  const rows=points.map(p=>{const predicted=gabMoisture(p.aw,params);return {...p,predicted,residual:predicted-p.x};});
  const rmse=Math.hypot(...rows.map(p=>p.residual))/Math.sqrt(rows.length);
  const meanError=rows.reduce((sum,p)=>sum+p.residual,0)/rows.length;
  return {rows,rmse,meanError};
}

/** With C and K fixed, GAB is linear in Xm. Minimize unweighted SSE within stated bounds. */
export function fitSorptionXm(points,{c,k},bounds=SORPTION_LIMITS.xm){
  checkPoints(points);
  if(!Array.isArray(bounds)||bounds.length!==2||!bounds.every(Number.isFinite)||bounds[0]<=0||bounds[1]<bounds[0])throw new RangeError('Invalid Xm limits');
  const factors=points.map(p=>gabMoisture(p.aw,{xm:1,c,k}));
  const denominator=factors.reduce((sum,f)=>sum+f*f,0);
  if(!(denominator>0))throw new RangeError('No information about Xm at aw = 0');
  const rawXm=points.reduce((sum,p,i)=>sum+p.x*factors[i],0)/denominator;
  const xm=Math.max(bounds[0],Math.min(bounds[1],rawXm));
  return {xm,rawXm,atBoundary:xm!==rawXm};
}

const fmt=(v,digits=2)=>Number(v.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits});
const signed=v=>(v>0?'+':'')+fmt(v);
const initial=Object.freeze({xm:.06,c:8,k:.8});
let instance=0;
const sorptionDrafts=new WeakMap();
const detailSelectors=['.sorption-panel > .food-exp-details','.sorption-table-wrap','.sorption-source'];
function draftSlot(owner,key){
  if(!owner||!['object','function'].includes(typeof owner))return null;
  let slots=sorptionDrafts.get(owner);if(!slots){slots=new Map();sorptionDrafts.set(owner,slots);}
  const name=typeof key==='string'&&key.trim()?key:SORPTION_LAB_ID;
  if(!slots.has(name))slots.set(name,{snapshot:null,dispose:null});return slots.get(name);
}
function validSnapshot(snapshot){
  const s=snapshot?.state;
  return s&&Object.entries(SORPTION_LIMITS).every(([name,[lo,hi]])=>Number.isFinite(s[name])&&s[name]>=lo&&s[name]<=hi)
    &&['moisture','residual'].includes(s.mode)&&Number.isInteger(s.index)&&s.index>=0&&s.index<SORPTION_DATA.points.length
    &&['initial','manual','published','fit','boundary'].includes(s.action)&&Array.isArray(snapshot.details)&&snapshot.details.length===detailSelectors.length&&snapshot.details.every(v=>typeof v==='boolean');
}

function chart(points,params,mode,index){
  const rows=sorptionMetrics(points,params).rows;
  const start=points[0].aw,end=points.at(-1).aw;
  const L=54,R=390,T=34,B=240,x=aw=>L+aw/.9*(R-L);
  const samples=Array.from({length:101},(_,i)=>{const aw=start+(end-start)*i/100;return {aw,x:gabMoisture(aw,params)*100};});
  const residual=mode==='residual';
  const extent=residual?Math.max(.5,...rows.map(p=>Math.abs(p.residual)*100)):Math.max(...points.map(p=>(p.x+p.plusMinus)*100),...samples.map(p=>p.x));
  const top=Math.ceil(extent/(residual?1:10))*(residual?1:10),bottom=residual?-top:0;
  const y=v=>B-(v-bottom)/(top-bottom)*(B-T);
  const ticks=residual?[-top,0,top]:[0,top/2,top];
  const grid=ticks.map(v=>`<path class="food-exp-grid" d="M${L},${y(v)}H${R}"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end">${fmt(v,1)}</text>`).join('');
  const curve=residual?'':`<path class="food-exp-curve" d="${samples.map((p,i)=>`${i?'L':'M'}${x(p.aw).toFixed(2)},${y(p.x).toFixed(2)}`).join(' ')}"/>`;
  const dots=rows.map((p,i)=>{
    const value=(residual?p.residual:p.x)*100,px=x(p.aw),py=y(value);
    const interval=residual?`<path class="sorption-stem" d="M${px},${y(0)}V${py}"/>`:`<path class="sorption-errorbar" d="M${px},${y((p.x-p.plusMinus)*100)}V${y((p.x+p.plusMinus)*100)} M${px-3},${y((p.x-p.plusMinus)*100)}h6 M${px-3},${y((p.x+p.plusMinus)*100)}h6"/>`;
    return `${interval}<circle class="sorption-point ${index===i?'is-selected':''}" cx="${px}" cy="${py}" r="${index===i?6:4}"/>`;
  }).join('');
  return `<svg viewBox="0 0 420 302" role="img" aria-label="${residual?'模型減量測的殘差':'優格粉文獻量測點與目前GAB曲線'}；25°C；aw ${start} 至 ${end}"><text x="${L}" y="17">${residual?'模型 − 量測':'含水量'} · g 水 / 100 g 乾物質</text>${grid}${curve}${dots}${[0,.3,.6,.9].map(v=>`<text x="${x(v)}" y="${B+23}" text-anchor="middle">${v}</text>`).join('')}<text x="${R}" y="294" text-anchor="end">水活性 aw</text></svg>`;
}

function control(name,label,min,max,step,value,prefix){
  return `<div class="food-exp-control"><div class="food-exp-control-label"><label for="${prefix}-${name}">${label}</label><output data-sorption-reading="${name}" for="${prefix}-${name}"></output></div><input id="${prefix}-${name}" type="range" data-sorption-input="${name}" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
}

export function mountSorptionDataLab(container,id=SORPTION_LAB_ID,{draftOwner,draftKey}={}){
  if(!container||typeof container.querySelector!=='function'||typeof container.addEventListener!=='function')throw new TypeError('A DOM container is required');
  if(id!==SORPTION_LAB_ID)throw new RangeError('Unknown sorption activity');
  const slot=draftSlot(draftOwner,draftKey);slot?.dispose?.();
  const resumed=validSnapshot(slot?.snapshot)?slot.snapshot:null;
  const prefix='sorption-data-'+(++instance),points=SORPTION_DATA.points,state={...initial,mode:'moisture',index:4,action:'initial'};
  if(resumed)Object.assign(state,resumed.state);
  let disposed=false;
  const $=s=>container.querySelector(s);
  const source=SORPTION_DATA.source;
  container.innerHTML=`<section class="food-experiment sorption-lab" aria-labelledby="${prefix}-title"><header class="food-exp-heading"><p class="food-exp-kicker">讀一組實測資料</p><h3 id="${prefix}-title">讓曲線靠近量測點，再看看誤差。</h3><p class="food-exp-hint">冷凍乾燥原味優格粉 · 25°C · 10 個文獻平均值</p></header>
  <div class="sorption-layout"><div class="sorption-stage"><div class="sorption-views" aria-label="圖形內容"><button type="button" data-sorption-view="moisture">含水量</button><button type="button" data-sorption-view="residual">逐點誤差</button></div><div class="food-exp-figure sorption-plot" tabindex="0" role="region" aria-label="量測與模型圖，窄畫面可橫向捲動"></div><p class="sorption-legend"></p><p class="sorption-equation">X = Xm C K aw / [(1 − K aw)(1 − K aw + C K aw)]</p><p class="food-exp-caption">只畫量測範圍 aw 0.113–0.843；X 與 Xm 採乾基。</p></div>
  <div class="sorption-panel"><div class="food-exp-result" aria-live="polite"><output class="food-exp-value sorption-rmse"></output><span class="food-exp-result-label">校準 RMSE · g 水 / 100 g 乾物質</span></div><p class="sorption-context">以這 10 個平均值比較；沒有獨立測試組。</p>
  ${control('xm','Xm · g 水 / 100 g 乾物質',.5,30,'any',6,prefix)}
  <div class="sorption-actions"><button type="button" data-sorption-action="fit">固定 C、K，校準 Xm</button><button type="button" data-sorption-action="published">對照文獻參數</button><button type="button" data-sorption-action="reset">重新試</button></div><p class="sorption-feedback" role="status"></p>
  <label class="sorption-point-select" for="${prefix}-point">查看一個量測點<select id="${prefix}-point" data-sorption-point>${points.map((p,i)=>`<option value="${i}">aw = ${p.aw.toFixed(3)}</option>`).join('')}</select></label><dl class="sorption-readings"></dl>
  <details class="food-exp-details"><summary>調整 C、K 與校準方法</summary><div class="food-exp-details-body">${control('c','C · 無因次',.2,20,.001,8,prefix)}${control('k','K · 無因次',.5,.99,.001,.8,prefix)}<p class="food-exp-equation">rᵢ = X模型,i − X量測,i<br>RMSE = √[Σ(rᵢ²) / n]</p><p class="food-exp-assumptions">此處 RMSE 用含水量單位，與論文的百分比指標不同。校準按平均值等權重計算，沒有拿未定義的 ± 當標準差或加權依據。固定 C、K 時，GAB 對 Xm 為線性；按此頁 Xm 範圍最小化平方誤差，只調一個參數，並非三參數回歸。</p><p class="food-exp-assumptions">較小誤差只說明更接近這批已見資料。還要檢查殘差方向、量測條件及新樣品，才能討論模型的預測能力。C 小於前一個示意模型的滑桿範圍仍可作數學比較；不把它自動解讀成可靠的單分子層物理量。</p></div></details></div></div>
  <details class="sorption-table-wrap"><summary>展開 10 點量測值與模型差異</summary><p>含水量及差異皆為 g 水 / 100 g 乾物質。± 沿用原表，原文未定義它是 SD 或 SE。</p><div class="sorption-table-scroll" tabindex="0" role="region" aria-label="量測數值表，可橫向捲動"><table><caption>Table 3 的 YP 欄及本頁重算</caption><thead><tr><th scope="col">aw</th><th scope="col">量測平均 ± 原表值</th><th scope="col">模型</th><th scope="col">模型 − 量測</th></tr></thead><tbody class="sorption-table-body"></tbody></table></div></details>
  <details class="food-exp-details sorption-source"><summary>這些數字從哪裡來？</summary><div class="food-exp-details-body"><p>${esc(SORPTION_DATA.method)}</p><p>點取自 Table 3 的 YP 欄，參數取自 Table 4，均保留原表精度。本文圖形由表格數值重繪；沒有個別重複實驗的原始值。只代表這項研究的樣品與吸濕條件，不能代替其他優格粉、脫濕曲線或安全判定。</p><p><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><br>${esc(source.authors)} · ${source.year}<br>數據轉錄與圖形改作；<a href="${esc(source.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(source.license)}</a>。</p></div></details></section>`;
  function draw(){
    const metrics=sorptionMetrics(points,state),point=metrics.rows[state.index];
    $('.sorption-rmse').textContent=fmt(metrics.rmse*100,3);
    $('.sorption-plot').innerHTML=chart(points,state,state.mode,state.index);
    $('.sorption-legend').textContent=state.mode==='residual'?'殘差為模型減量測；正值表示高估。':'● 文獻量測平均　— 目前模型　柱線：原表 ±（類型未定義）';
    for(const name of ['xm','c','k']){
      const value=name==='xm'?state[name]*100:state[name],digits=name==='xm'?2:3;
      $(`[data-sorption-input="${name}"]`).value=value;
      $(`[data-sorption-input="${name}"]`).setAttribute('aria-valuetext',fmt(value,digits));
      $(`[data-sorption-reading="${name}"]`).textContent=fmt(value,digits);
    }
    $('[data-sorption-point]').value=String(state.index);
    for(const mode of ['moisture','residual'])$(`[data-sorption-view="${mode}"]`).setAttribute('aria-pressed',String(state.mode===mode));
    $('.sorption-readings').innerHTML=[['量測平均',fmt(point.x*100)],['目前模型',fmt(point.predicted*100)],['模型 − 量測',signed(point.residual*100)]].map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')+'<div class="sorption-reading-unit">g 水 / 100 g 乾物質</div>';
    $('.sorption-table-body').innerHTML=metrics.rows.map((p,i)=>`<tr ${i===state.index?'class="is-selected"':''}><th scope="row">${p.aw.toFixed(3)}</th><td>${fmt(p.x*100)} ± ${fmt(p.plusMinus*100)}</td><td>${fmt(p.predicted*100)}</td><td>${signed(p.residual*100)}</td></tr>`).join('');
    $('.sorption-feedback').textContent=state.action==='published'?'已帶入原文表列 Xm = 11.4、C = 1.742、K = 0.908。此頁使用四捨五入表值重算。':state.action==='fit'?'已在目前 C、K 下校準 Xm。可切到「逐點誤差」看還有哪些系統性偏差。':state.action==='boundary'?'最佳 Xm 落在滑桿範圍外，目前停在邊界；請檢查 C、K 與模型適用性。':state.action==='initial'?'先調 Xm 看曲線改變，再對照文獻參數。':'目前為自選參數；量測點保持不變。';
  }
  const input=event=>{
    if(disposed||typeof container.contains==='function'&&!container.contains(event.target))return;
    const name=event.target?.dataset?.sorptionInput;if(!Object.hasOwn(SORPTION_LIMITS,name))return;
    let value=Number(event.target.value);if(!Number.isFinite(value))return;if(name==='xm')value/=100;
    const [low,high]=SORPTION_LIMITS[name];state[name]=Math.max(low,Math.min(high,value));state.action='manual';draw();
  };
  const change=event=>{
    if(disposed||typeof container.contains==='function'&&!container.contains(event.target))return;
    if(!event.target?.matches?.('[data-sorption-point]'))return;
    const index=Number(event.target.value);if(!Number.isInteger(index)||index<0||index>=points.length)return;
    state.index=index;draw();
  };
  const click=event=>{
    if(disposed||typeof container.contains==='function'&&!container.contains(event.target))return;
    const target=event.target?.closest?.('[data-sorption-action],[data-sorption-view]');if(!target)return;
    const view=target.dataset.sorptionView,action=target.dataset.sorptionAction;
    if(['moisture','residual'].includes(view))state.mode=view;
    else if(action==='published'){Object.assign(state,SORPTION_DATA.reference);state.action='published';}
    else if(action==='reset'){Object.assign(state,initial);state.action='initial';}
    else if(action==='fit'){const result=fitSorptionXm(points,state);state.xm=result.xm;state.action=result.atBoundary?'boundary':'fit';}
    else return;
    draw();
  };
  if(resumed)detailSelectors.forEach((selector,i)=>{$(selector).open=resumed.details[i];});
  container.addEventListener('input',input);container.addEventListener('change',change);container.addEventListener('click',click);draw();
  const dispose=()=>{
    if(disposed)return;
    if(slot)slot.snapshot={state:{...state},details:detailSelectors.map(selector=>Boolean($(selector)?.open))};
    disposed=true;container.removeEventListener('input',input);container.removeEventListener('change',change);container.removeEventListener('click',click);
    if(slot?.dispose===dispose)slot.dispose=null;
  };
  if(slot)slot.dispose=dispose;return dispose;
}
