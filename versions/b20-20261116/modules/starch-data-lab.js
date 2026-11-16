import {escapeHTML as esc} from './storage.js';
import {validateStarchData,starchThermalReading,starchThermalScale,starchSampleComparison,STARCH_THERMAL_IDS,STARCH_SAMPLE_IDS} from './starch-data-model.js';
export const STARCH_DATA_LAB_ID='starch-data-lab';
const labels={onset:'起始溫度 To',peak:'峰值溫度 Tp',end:'終止溫度 Te',enthalpy:'轉變焓 ΔH'};
const fmt=n=>Number(n.toFixed(2)).toLocaleString('en-US',{maximumFractionDigits:2});
const detailNames=['comparison','source'],drafts=new WeakMap();
let instance=0;

function draftSlot(owner,key){
  if(!owner||(typeof owner!=='object'&&typeof owner!=='function'))return null;
  let entries=drafts.get(owner);if(!entries){entries=new Map();drafts.set(owner,entries);}
  let slot=entries.get(key);if(!slot){slot={snapshot:null,dispose:null};entries.set(key,slot);}return slot;
}

export function mountStarchDataLab(container,id=STARCH_DATA_LAB_ID,{fetcher=globalThis.fetch,draftOwner,draftKey=id}={}){
  if(!container||typeof container.querySelector!=='function'||typeof container.addEventListener!=='function')throw new TypeError('A DOM container is required');
  if(id!==STARCH_DATA_LAB_ID)throw new RangeError('Unknown starch data activity');
  const slot=draftSlot(draftOwner,typeof draftKey==='string'&&draftKey.trim()?draftKey:id);
  // This disposer is private to this module; never call methods on the owner.
  if(slot?.dispose)slot.dispose();
  const prefix='starch-data-'+(++instance),state={sample:'wheat',metric:'enthalpy',details:{comparison:false,source:false}},abort=new AbortController(),$=s=>container.querySelector(s);
  let disposed=false,data=null,detailNodes={};
  container.innerHTML='<p role="status">正在讀取已發表的澱粉熱分析結果…</p>';
  function restore(){
    const saved=slot?.snapshot;
    state.sample=STARCH_SAMPLE_IDS.includes(saved?.sample)?saved.sample:'wheat';
    state.metric=STARCH_THERMAL_IDS.includes(saved?.metric)?saved.metric:'enthalpy';
    for(const name of detailNames)state.details[name]=saved?.details?.[name]===true;
  }
  function remember(){
    if(disposed||!data||!slot)return;
    for(const name of detailNames)if(detailNodes[name])state.details[name]=detailNodes[name].open===true;
    slot.snapshot={sample:state.sample,metric:state.metric,details:{...state.details}};
  }
  function render(){
    container.innerHTML=`<section class="food-experiment starch-data-lab" aria-labelledby="${prefix}-title"><header class="food-exp-heading"><p class="food-exp-kicker">實測資料 · Mauro et al., 2023</p><h2 id="${prefix}-title">第一次加熱，與貯藏後再加熱。</h2><p class="food-exp-hint">比較三種原生澱粉的 DSC 摘要量。</p></header>
    <div class="starch-data-controls"><label for="${prefix}-sample">選擇澱粉<select id="${prefix}-sample" data-starch-data="sample">${data.samples.map(s=>`<option value="${esc(s.id)}">${esc(s.label)}</option>`).join('')}</select></label><label for="${prefix}-metric">觀察指標<select id="${prefix}-metric" data-starch-data="metric">${STARCH_THERMAL_IDS.map(m=>`<option value="${m}">${labels[m]}</option>`).join('')}</select></label></div>
    <div class="starch-data-plot" aria-live="polite"></div><p class="starch-data-caption">均值 ± SD，n = 2；這是摘要量比較，沒有重建吸熱曲線。</p>
    <div class="starch-data-interpretation"><p class="starch-data-question"></p><p class="starch-data-answer"></p></div>
    <p class="starch-data-condition">貯藏 7 天。論文的方法段記 4°C，結果段另記 2 ± 2°C；溫度敘述不一致。</p>
    <details class="starch-data-details" data-starch-detail="comparison"${state.details.comparison?' open':''}><summary>比較三種澱粉與統計字母</summary><div class="starch-data-detail-body"><div class="starch-data-table-wrap" tabindex="0" role="region" aria-label="三種澱粉 DSC 摘要表，可橫向捲動"><table><caption class="starch-data-table-caption"></caption><thead><tr><th scope="col">樣品</th><th scope="col">初次加熱</th><th scope="col">貯藏後回熱</th></tr></thead><tbody class="starch-data-table-body"></tbody></table></div><p>括號是原表統計字母。只在同一欄、同一指標內比較；不能用初次加熱與回熱的字母做配對檢定。共享字母表示未標為顯著不同，不是證明相等。</p><p class="starch-data-comparison"></p><p class="starch-data-amylose"></p></div></details>
    <details class="starch-data-details" data-starch-detail="source"${state.details.source?' open':''}><summary>量測方法與資料來源</summary><div class="starch-data-detail-body"><ul>${data.methods.map(m=>`<li>${esc(m)}</li>`).join('')}</ul><p>SD 不是信賴區間。只有刊載摘要量，不能重算配對差或焓比的 SD，也不能由熱分析直接推算食品硬度或所有鏈段的回凝比例。</p><p><a href="${esc(data.source.url)}" target="_blank" rel="noopener noreferrer">${esc(data.source.title)} ↗</a><br>${esc(data.source.authors.join('; '))} · ${esc(data.source.table)}<br>轉錄所選三樣品、以原創圖表重繪；<a href="${esc(data.source.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(data.source.license)}</a>。</p></div></details></section>`;
    detailNodes=Object.fromEntries(detailNames.map(name=>[name,$(`[data-starch-detail="${name}"]`)]));
    draw();
  }
  function draw(){
    $('[data-starch-data="sample"]').value=state.sample;$('[data-starch-data="metric"]').value=state.metric;
    const r=starchThermalReading(data,state.sample,state.metric),top=starchThermalScale(data,state.metric),unit=state.metric==='enthalpy'?'J/g 乾物質':'°C';
    const readings=[['first','初次加熱 · 糊化吸熱',r.first],['reheat','貯藏後回熱 · 回凝相關吸熱',r.reheat]];
    $('.starch-data-plot').innerHTML=readings.map(([phase,label,v])=>`<div class="starch-data-row is-${phase}"><div class="starch-data-row-heading"><span>${label}</span><strong>${esc(v.meanText)} <small>± ${esc(v.sdText)} SD</small></strong></div><div class="starch-data-track" aria-hidden="true"><i class="starch-data-bar" style="width:${v.mean/top*100}%"></i><i class="starch-data-error" style="left:${(v.mean-v.sd)/top*100}%;width:${2*v.sd/top*100}%"></i></div></div>`).join('')+`<div class="starch-data-axis"><span>0</span><span>${fmt(top/2)}</span><span>${fmt(top)} ${unit}</span></div>`;
    $('.starch-data-question').textContent=state.metric==='enthalpy'?'回熱焓相當於初次加熱的多少？':'同一樣品的兩次熱轉變，溫度有什麼不同？';
    $('.starch-data-answer').textContent=state.metric==='enthalpy'?`${r.reheat.meanText} / ${r.first.meanText} × 100 = ${fmt(r.enthalpyRatio)}%。由刊載均值另算的焓比，並非原表 DR 的統計量，也不是所有澱粉已回凝的百分率。`:`回熱 − 初次加熱 = ${fmt(r.difference)}°C。這是摘要均值之差；DSC 終點不能單獨證明所有分子有序結構都已消失。`;
    $('.starch-data-table-caption').textContent=`Table 3 · ${labels[state.metric]} · ${unit}`;
    $('.starch-data-table-body').innerHTML=data.samples.map(s=>`<tr${s.id===state.sample?' class="is-selected"':''}><th scope="row">${esc(s.label)}</th>${['gelatinization','retrogradation'].map(p=>{const v=s[p][state.metric];return `<td>${esc(v.meanText)} ± ${esc(v.sdText)} (${esc(v.letters)})</td>`;}).join('')}</tr>`).join('');
    const c=starchSampleComparison(data,'gelatinization',state.metric,'wheat','normal-maize');
    $('.starch-data-comparison').textContent=`例：初次加熱的小麥與一般玉米，在此指標${c.sharedLetters.length?`共享字母 ${c.sharedLetters.join(',')}，原表未標為顯著不同。`:'沒有共享字母，原表標為顯著不同。'}（ANOVA / Tukey，p < 0.05）`;
    const a=data.samples.find(s=>s.id===state.sample).amylose;
    $('.starch-data-amylose').textContent=`${r.label}的直鏈澱粉：${a.meanText} ± ${a.sdText}% 乾基（Table 2）。來源與結構同時不同，不能把三個樣品的熱性質差異全部歸因於這個比例。`;
  }
  function change(event){
    if(disposed||!data)return;
    const target=event.target,key=target?.dataset?.starchData,value=target?.value;
    if((key!=='sample'&&key!=='metric')||target!==$(`[data-starch-data="${key}"]`))return;
    if(key==='sample'&&STARCH_SAMPLE_IDS.includes(value))state.sample=value;
    else if(key==='metric'&&STARCH_THERMAL_IDS.includes(value))state.metric=value;
    else return;
    draw();remember();
  }
  function toggle(event){
    if(disposed||!data)return;
    const target=event.target,name=target?.dataset?.starchDetail;
    if(!detailNames.includes(name)||target!==detailNodes[name])return;
    remember();
  }
  const dispose=()=>{if(disposed)return;remember();disposed=true;abort.abort();container.removeEventListener('change',change);container.removeEventListener('toggle',toggle,true);if(slot?.dispose===dispose)slot.dispose=null;};
  if(slot)slot.dispose=dispose;
  container.addEventListener('change',change);
  container.addEventListener('toggle',toggle,true);
  const ready=(async()=>{try{
    const response=await fetcher('./data/starch-thermal-measurements.json',{signal:abort.signal});if(disposed)return;
    if(!response.ok)throw new Error('No data');const loaded=await response.json();if(disposed)return;
    data=validateStarchData(loaded);restore();render();
  }catch{if(!disposed)container.innerHTML='<p role="alert">澱粉量測資料無法載入或格式不完整。請重新整理頁面；目前沒有以示意數字代替。</p>';}})();
  dispose.ready=ready;return dispose;
}
