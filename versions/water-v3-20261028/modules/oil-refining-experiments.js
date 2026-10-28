import {escapeHTML as esc} from './storage.js';
import {acidNeutralization,OIL_NEUTRALIZATION_DEFAULTS,OIL_NEUTRALIZATION_ACIDS,OIL_NEUTRALIZATION_SOURCES,OIL_NEUTRALIZATION_MOLAR_MASSES} from './oil-neutralization-model.js';

export const OIL_REFINING_EXPERIMENT_IDS=Object.freeze(['processing-oil-refining-flow','processing-oil-neutralization']);
const flowSources=Object.freeze([
  {title:'AOCS · Oil Refining',url:'https://www.aocs.org/resource/oil-refining/'},
  {title:'AOCS · Alkali Refining',url:'https://www.aocs.org/resource/alkali-refining/'},
  {title:'AOCS · Optimization of Bleaching Process',url:'https://www.aocs.org/resource/optimization-of-bleaching-process/'},
  {title:'AOCS · Deodorization',url:'https://www.aocs.org/resource/deodorization/'},
]);
export const OIL_REFINING_EXPERIMENT_SOURCES=Object.freeze({
  'processing-oil-refining-flow':flowSources,
  'processing-oil-neutralization':OIL_NEUTRALIZATION_SOURCES,
});
const units=Object.freeze({
  degumming:{name:'脫膠',en:'DEGUMMING',principle:'先讓膠質容易分離',target:'磷脂等膠質',method:'水化／前處理，再分離',out:'含磷脂的膠相',equation:'油中磷脂 → 水化膠相 → 分離',detail:'可水化磷脂吸水後較易分離；非水化部分常涉及 Ca、Mg 鹽，需適合的前處理。實際處理取決於原油組成。',check:'觀察殘餘磷與金屬；水化不等於所有膠質都移除。',symbol:'P'},
  neutralization:{name:'中和脫酸',en:'NEUTRALIZATION',principle:'把游離脂肪酸轉成皂',target:'游離脂肪酸 FFA',method:'鹼中和，再分離皂相',out:'皂腳，可能夾帶中性油',equation:'R–COOH + NaOH → R–COONa + H₂O',detail:'FFA 的羧基與鹼反應。分離皂相才把這些物質帶離油相；生成皂與回收中性油是兩個問題。',check:'酸價反映可滴定酸當量；低酸價不代表低氧化。',symbol:'FFA'},
  bleaching:{name:'脫色',en:'BLEACHING',principle:'讓吸附劑帶走部分微量成分',target:'色素、殘皂及部分微量成分',method:'吸附接觸，再過濾',out:'用過的吸附劑與所帶物質',equation:'油中成分 + 吸附劑 → 吸附 → 過濾',detail:'吸附土等材料可降低色素、殘皂、金屬及部分氧化產物。效果依進料與材料改變；這裡不是加入家用漂白水。',check:'顏色與氧化指標分開看；氫過氧化物也可能分解。',symbol:'色素'},
  winterization:{name:'冬化／去蠟',en:'WINTERIZATION',principle:'讓容易析出的部分先結晶',target:'蠟或部分高熔點三酸甘油酯',method:'受控冷卻、結晶，再分離',out:'分出的晶體與夾帶油',equation:'溶於油中的成分 → 冷卻結晶 → 分離',detail:'依油種和產品需求選用。結晶與分離改變組成和低溫澄清性，不是把脂肪酸雙鍵氫化。',check:'看低溫澄清性與油收率；蠟並非所有油混濁的唯一原因。',symbol:'晶體'},
  deodorization:{name:'脫臭',en:'DEODORIZATION',principle:'以蒸汽帶走可揮發成分',target:'氣味相關揮發物與部分 FFA',method:'低壓下的蒸汽汽提',out:'蒸出物及冷凝餾出物',equation:'油中揮發物 → 氣相 → 餾出物',detail:'蒸汽汽提利用揮發性差異。條件也影響生育酚等成分的保留，以及熱引起的品質變化。',check:'氣味變淡不是全面品質驗證；還需看保留與副反應。',symbol:'揮發物'},
});
export function oilRefiningRoute({route='chemical',winterization=true}={}){
  if(!['chemical','physical'].includes(route)||typeof winterization!=='boolean')throw new RangeError('Unknown refining route');
  return ['degumming',...(route==='chemical'?['neutralization']:[]),'bleaching',...(winterization?['winterization']:[]),'deodorization'];
}
export function oilRefiningStage(id,route='chemical'){
  if(!Object.hasOwn(units,id)||!['chemical','physical'].includes(route))throw new RangeError('Unknown refining stage');
  const data={id,...units[id]};
  if(id==='deodorization'&&route==='physical')Object.assign(data,{name:'脫臭＋蒸餾脫酸',principle:'讓 FFA 隨蒸汽進入餾出物',target:'游離脂肪酸與其他揮發物',equation:'油中 FFA → 蒸汽汽提 → 餾出物',detail:'此路線以汽提承擔主要脫酸；前段脫膠與脫色的品質尤其重要。沒有鹼中和這一格，不代表全程沒有化學變化。',symbol:'FFA'});
  return data;
}
function vessel(stage){
  const id=stage.id;
  const contents=id==='bleaching'?'<path d="M216 151l13 -10 13 12 -11 10z M274 195l11 -12 12 10 -9 14z M251 232l13 -13 12 12 -13 10z" class="oil-adsorbent"/>':id==='winterization'?'<path d="M219 160l12 -17 12 17 -12 16z M266 204l13 -18 13 18 -13 16z M225 237l12 -17 12 17 -12 16z" class="oil-crystal"/>':id==='deodorization'?'<path d="M214 259q-15 -20 0 -38t0 -38 M245 259q-15 -20 0 -38t0 -38 M276 259q-15 -20 0 -38t0 -38" class="oil-steam"/>':'<circle cx="224" cy="161" r="8" class="oil-species"/><circle cx="269" cy="205" r="10" class="oil-species"/><circle cx="232" cy="245" r="7" class="oil-species"/>';
  return `<svg viewBox="0 0 500 335" role="img" aria-label="${esc(stage.name)}的分離示意：${esc(stage.target)}，經${esc(stage.method)}，進入${esc(stage.out)}。圖示不代表數量或移除效率。"><path d="M170 85v167q0 31 75 31t75 -31V85" class="oil-vessel"/><path d="M180 132v117q0 24 65 24t65 -24V132Z" class="oil-liquid"/><ellipse cx="245" cy="132" rx="65" ry="14" class="oil-meniscus"/><ellipse cx="245" cy="85" rx="75" ry="18" class="oil-vessel"/>${contents}<path d="M59 121H153m-7 -6 7 6 -7 6 M320 159H435m-6 -6 6 6 -6 6" class="oil-pipe"/><text x="62" y="103">油相進入</text><text x="352" y="141">油相續行</text>${id==='deodorization'?'<path d="M280 75l30 -36h105m-6 -6 6 6 -6 6" class="oil-outlet"/><text x="331" y="22">氣相移出</text>':'<path d="M278 276l42 33h63m-6 -6 6 6 -6 6" class="oil-outlet"/><text x="333" y="286">分出物流</text>'}<text x="245" y="${id==='deodorization'?320:53}" text-anchor="middle" class="oil-method">${esc(stage.method)}</text></svg>`;
}
const sourceList=sources=>`<ul class="food-exp-sources">${sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></li>`).join('')}</ul>`;
let serial=0;
function mountFlow(container,prefix){
  const state={route:'chemical',winterization:true,stage:'degumming'};
  const $=s=>container.querySelector(s);
  container.innerHTML=`<section class="food-experiment oil-experiment" aria-labelledby="${prefix}-title"><header class="food-exp-heading"><p class="food-exp-kicker">沿著物質的去向看製程</p><h3 id="${prefix}-title">同一份油，兩條脫酸路線。</h3><p class="food-exp-hint">切換路線，再點選一站，看看什麼被帶走。</p></header><div class="oil-toolbar"><div class="oil-route-choice" role="group" aria-label="精製路線"><button type="button" data-oil-route="chemical">化學精製</button><button type="button" data-oil-route="physical">物理精製</button></div><label class="oil-option"><input type="checkbox" data-oil-winter checked>加入冬化／去蠟</label></div><nav class="oil-stations" aria-label="選擇精製步驟"></nav><div class="oil-flow-focus"><div class="oil-scene"><div class="oil-stage-title"><span></span><h4></h4></div><div class="oil-vessel-diagram"></div><p class="oil-figure-note">流程示意 · 圖形僅示種類，不表示比例或移除率</p></div><div class="oil-stage-info" aria-live="polite" aria-atomic="true"></div></div><div class="oil-flow-footer"><p class="oil-route-note"></p><button type="button" class="oil-next" data-oil-next>下一站 →</button></div><details class="food-exp-details"><summary>這一步的原理與觀察指標</summary><div class="food-exp-details-body oil-step-detail"></div></details><details class="food-exp-details"><summary>流程的適用範圍與來源</summary><div class="food-exp-details-body"><p class="oil-note">這是一種教學排列；油種、前處理及產品需求會改變步驟與順序，冬化可省略或放在別處。此處沒有估算移除率、設備尺寸、操作條件或實際油收率。</p><p class="oil-note">精製同時涉及移除與保留。側流也可能帶走中性油或有益微量成分，完成流程不等於獲得「純油」或通過品質檢驗。</p>${sourceList(flowSources)}</div></details></section>`;
  function draw(){
    const route=oilRefiningRoute(state);if(!route.includes(state.stage))state.stage=route[0];
    const i=route.indexOf(state.stage),s=oilRefiningStage(state.stage,state.route);
    // Keep route buttons mounted so keyboard focus survives branch changes.
    container.querySelectorAll('[data-oil-route]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.oilRoute===state.route)));
    $('[data-oil-winter]').checked=state.winterization;
    const oldFocus=container.ownerDocument?.activeElement?.dataset?.oilStage;
    $('.oil-stations').innerHTML=route.map((id,j)=>`<button type="button" data-oil-stage="${id}" ${id===state.stage?'aria-current="step"':''}><span>${String(j+1).padStart(2,'0')}</span>${esc(oilRefiningStage(id,state.route).name)}</button>`).join('');
    if(oldFocus&&route.includes(oldFocus))$(`[data-oil-stage="${oldFocus}"]`).focus();
    $('.oil-stage-title span').textContent=`${String(i+1).padStart(2,'0')} / ${String(route.length).padStart(2,'0')} · ${s.en}`;
    $('.oil-stage-title h4').textContent=s.name;
    $('.oil-vessel-diagram').innerHTML=vessel(s);
    $('.oil-stage-info').innerHTML=`<p class="oil-focus-phrase">${esc(s.principle)}</p><dl><div><dt>主要處理對象</dt><dd>${esc(s.target)}</dd></div><div><dt>離開油相的物流</dt><dd>${esc(s.out)}</dd></div></dl><p class="oil-equation">${esc(s.equation)}</p>`;
    $('.oil-step-detail').innerHTML=`<p class="oil-note">${esc(s.detail)}</p><p class="oil-note">${esc(s.check)}</p>`;
    $('.oil-route-note').textContent=state.route==='chemical'?'此路線：FFA 主要在中和站轉成皂後分離。':'此路線：FFA 主要在末站汽提脫除。';
    $('[data-oil-next]').textContent=i===route.length-1?'回到第一站 ↺':'下一站 →';
  }
  const click=e=>{const b=e.target.closest?.('button');if(!b||!container.contains(b))return;if(b.dataset.oilRoute){state.route=b.dataset.oilRoute;draw();}else if(b.dataset.oilStage){state.stage=b.dataset.oilStage;draw();}else if(b.hasAttribute('data-oil-next')){const r=oilRefiningRoute(state);state.stage=r[(r.indexOf(state.stage)+1)%r.length];draw();}};
  const change=e=>{if(e.target.hasAttribute?.('data-oil-winter')){state.winterization=e.target.checked;draw();}};
  container.addEventListener('click',click);container.addEventListener('change',change);draw();
  return ()=>{container.removeEventListener('click',click);container.removeEventListener('change',change);};
}
const num=(v,d=3)=>v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
// A visible zero must not hide a small positive amount at the UI boundaries.
export function oilMassReading(kg){
  if(typeof kg!=='number'||!Number.isFinite(kg)||kg<0)throw new RangeError('Mass must be finite and nonnegative');
  if(kg>0&&kg<0.01)return {value:kg<0.0000005?'<0.001':num(kg*1000),unit:'g'};
  return {value:num(kg),unit:'kg'};
}
const controls={acidValue:{label:'原料酸價 AV',min:0,max:20,step:.1,unit:'mg KOH/g',digits:1},extent:{label:'指定已反應的 FFA 比例',min:0,max:1,step:.01,unit:'%',digits:0},feedMassKg:{label:'原料油質量',min:50,max:500,step:10,unit:'kg',digits:0}};
function mountNeutralization(container,prefix){
  const state={...OIL_NEUTRALIZATION_DEFAULTS},$=s=>container.querySelector(s);
  const control=key=>{const c=controls[key];return `<div class="food-exp-control"><div class="food-exp-control-label"><label for="${prefix}-${key}">${c.label}</label><output data-oil-value="${key}"></output></div><input id="${prefix}-${key}" data-oil-input="${key}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${state[key]}"></div>`;};
  container.innerHTML=`<section class="food-experiment oil-experiment" aria-labelledby="${prefix}-title"><header class="food-exp-heading"><p class="food-exp-kicker">從酸當量到質量</p><h3 id="${prefix}-title">酸價相同，脂肪酸也一樣多嗎？</h3><p class="food-exp-hint">先推動中和，再換一種脂肪酸比較。</p></header><div class="oil-neutral-layout"><div class="oil-neutral-visual"><p class="oil-reaction-label">羧基的酸鹼中和</p><div class="oil-reaction"><span>R–COOH</span><span class="oil-reactant-plus">+ NaOH</span><span class="oil-reaction-arrow">→</span><span>R–COO⁻ Na⁺</span><span class="oil-reactant-plus">+ H₂O</span></div><div class="oil-acid-track"><div class="oil-acid-remaining"></div><div class="oil-acid-reacted"></div></div><div class="oil-acid-legend"><span>尚未反應 <b data-oil-unreacted></b></span><span>已轉為皂 <b data-oil-reacted></b></span></div><p class="oil-figure-note">長條依初始酸的莫耳數分配；不是油的組成比例。</p><div class="oil-mass-results" aria-live="polite" aria-atomic="true"></div></div><div class="oil-neutral-controls">${control('acidValue')}${control('extent')}<div class="oil-primary-result" aria-live="polite"><span>原料中的 FFA 質量分率</span><output data-oil-ffa></output><small data-oil-assumed></small></div><p class="oil-note">把全部可滴定酸假定為所選單羧脂肪酸。反應比例由你指定，沒有從時間、加鹼量或平衡推算。</p><details class="food-exp-details"><summary>改變脂肪酸與原料質量</summary><div class="food-exp-details-body"><label class="oil-select-label" for="${prefix}-acid">假定的游離脂肪酸</label><select id="${prefix}-acid" data-oil-acid>${Object.values(OIL_NEUTRALIZATION_ACIDS).map(a=>`<option value="${esc(a.id)}">${esc(a.label)} · ${esc(a.formula)}</option>`).join('')}</select>${control('feedMassKg')}<p class="oil-note">同酸價、同原料質量給出相同酸當量；換一種分子量，FFA 質量分率會跟著變。</p></div></details><button type="button" class="oil-reset" data-oil-reset>重設示例</button></div></div><details class="food-exp-details oil-bottom-details"><summary>核對酸當量與完整質量收支</summary><div class="food-exp-details-body"><p class="oil-note">AV 單位為 mg KOH/g 油，數值等同 g KOH/kg 油。n₀ = AV × 原料 kg / M(KOH)。單羧酸、NaOH、皂與水的反應莫耳比皆為 1。</p><p class="oil-equation">FFA 質量 % = AV × M(FFA) / [10 × M(KOH)]</p><p class="oil-neutral-equivalents oil-note"></p><dl class="oil-balance" aria-live="polite"></dl><p class="oil-note">投入只計原料油與「指定已消耗的純 NaOH 當量」，不含鹼液的溶劑水或過量鹼；反應後各成分全部留在此衡算邊界，尚未模擬皂腳分離。</p></div></details><details class="food-exp-details"><summary>模型邊界與來源</summary><div class="food-exp-details-body"><p class="oil-note">二成分原料：指定 FFA ＋不參與反應的中性油。忽略其他可滴定酸、TAG 皂化、乳化夾帶與製程損失。圖中數值是化學計量，不是實際精製加藥建議，也不能推算分離油的酸價或氧化程度。</p><p class="oil-note">摩爾質量以同一組 CIAAW 略式原子量計算，保持反應前後一致；不同來源的捨入值可能略有差異。</p>${sourceList(OIL_NEUTRALIZATION_SOURCES)}</div></details></section>`;
  function draw(){
    const r=acidNeutralization(state),a=OIL_NEUTRALIZATION_ACIDS[state.acidId];
    $('.oil-acid-remaining').style.width=`${(1-state.extent)*100}%`;$('.oil-acid-reacted').style.width=`${state.extent*100}%`;
    $('.oil-acid-track').classList.toggle('is-empty',state.acidValue===0);
    $('[data-oil-unreacted]').textContent=state.acidValue===0?'無初始酸':`${num((1-state.extent)*100,0)}%`;
    $('[data-oil-reacted]').textContent=state.acidValue===0?'0 mol':`${num(state.extent*100,0)}%`;
    $('[data-oil-ffa]').textContent=`${num(r.initialFFAMassPercent,2)}%`;
    $('[data-oil-assumed]').textContent=`以 ${a.label} 計 · M = ${num(a.molarMassGPerMol)} g/mol`;
    $('.oil-mass-results').innerHTML=[['剩餘 FFA',r.remainingAcidKg],['理論消耗 NaOH',r.consumedNaOHKg],['生成脂肪酸鈉',r.formedSoapKg],['生成水',r.formedWaterKg]].map(([label,v])=>{const m=oilMassReading(v);return `<div><span>${label}</span><strong>${esc(m.value)} <small>${m.unit}</small></strong></div>`;}).join('');
    $('.oil-neutral-equivalents').textContent=`初始酸 ${num(r.initialAcidMol)} mol；指定已反應 ${num(r.reactedAcidMol)} mol。M(KOH) = ${OIL_NEUTRALIZATION_MOLAR_MASSES.KOH} g/mol。全部酸反應的理論 NaOH 當量為 ${num(r.fullNeutralizationNaOHKg)} kg。`;
    $('.oil-balance').innerHTML=[['原料油',r.feedMassKg],['＋消耗的純 NaOH',r.consumedNaOHKg],['＝總投入',r.totalInputKg],['未反應中性油',r.neutralOilKg],['＋剩餘 FFA',r.remainingAcidKg],['＋生成皂',r.formedSoapKg],['＋生成水',r.formedWaterKg],['＝總產出',r.totalOutputKg]].map(([l,v])=>`<div><dt>${l}</dt><dd>${num(v,6)} kg</dd></div>`).join('');
    for(const [key,c] of Object.entries(controls)){const value=`${num(key==='extent'?state[key]*100:state[key],c.digits)} ${c.unit}`;$(`[data-oil-value="${key}"]`).textContent=value;$(`[data-oil-input="${key}"]`).value=String(state[key]);$(`[data-oil-input="${key}"]`).setAttribute('aria-valuetext',value);}
    $('[data-oil-acid]').value=state.acidId;
  }
  const input=e=>{const k=e.target.dataset?.oilInput,c=controls[k];if(!c)return;const v=Number(e.target.value);if(!Number.isFinite(v)||v<c.min||v>c.max)return;state[k]=v;draw();};
  const change=e=>{if(e.target.hasAttribute?.('data-oil-acid')&&Object.hasOwn(OIL_NEUTRALIZATION_ACIDS,e.target.value)){state.acidId=e.target.value;draw();}};
  const click=e=>{const b=e.target.closest?.('button');if(b?.hasAttribute('data-oil-reset')&&container.contains(b)){Object.assign(state,OIL_NEUTRALIZATION_DEFAULTS);draw();}};
  container.addEventListener('input',input);container.addEventListener('change',change);container.addEventListener('click',click);draw();
  return ()=>{container.removeEventListener('input',input);container.removeEventListener('change',change);container.removeEventListener('click',click);};
}
export function mountOilRefiningExperiment(container,id){
  if(!OIL_REFINING_EXPERIMENT_IDS.includes(id))throw new RangeError('Unknown oil refining experiment');
  const prefix=`oil-${++serial}`;
  return id==='processing-oil-refining-flow'?mountFlow(container,prefix):mountNeutralization(container,prefix);
}
