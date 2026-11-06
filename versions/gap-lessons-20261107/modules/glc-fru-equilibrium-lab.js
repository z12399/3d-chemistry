import {escapeHTML as esc} from './storage.js';
import {GLC_FRU_EQUILIBRIUM_MEASUREMENTS,GLC_FRU_EQUILIBRIUM_SCOPE,GLC_FRU_EQUILIBRIUM_SOURCES,evaluateGlcFruEquilibrium} from './glc-fru-equilibrium-model.js';

// Drafts belong to the existing progress owner. Reloading creates a new owner;
// this interaction never writes a separate store or a lesson result.
const drafts=new WeakMap();
const catalysts=Object.freeze({
  baseline:{label:'XI 量：基準（概念情境）',note:'同條件 K′ 不因 XI 量改變。沒有實測速率，不預測何時到達平衡。'},
  double:{label:'XI 量：加倍（概念情境）',note:'加倍 XI 不改變同條件 K′。速率是否加倍仍需實測，這裡不推算速度或到達時間。'},
  none:{label:'未加 XI（概念情境）',note:'未加 XI 仍有同一條件平衡位置；觀測期間可能未達平衡。圖中箭頭沒有宣稱反應已發生。'}
});
const presets=[['glucose','全 Glc 開始'],['fructose','全 Fru 開始'],['given','題設 40% Fru'],['equilibrium','套用平衡比例']];
const percent=value=>(value*100).toFixed(2)+'%';
const ratio=value=>Number.isFinite(value)?value.toFixed(3):'∞';
const displayedComparison=(value,direction)=>Number.isFinite(value)&&ratio(value)==='1.000'&&direction!=='at-equilibrium'?(value<1?'略小於 1':'略大於 1'):ratio(value);
const directionLabel=direction=>direction==='toward-fructose'?'朝 Fru 的淨轉換方向':direction==='toward-glucose'?'朝 Glc 的淨轉換方向':'與此條件平衡比例相符';
const measurementLabel=row=>`${Number(row.temperatureC.toFixed(2))} °C · ${row.temperatureK.toFixed(2)} K`;
function memory(owner){
  const fresh=()=>({temperatureK:GLC_FRU_EQUILIBRIUM_MEASUREMENTS[0].temperatureK,fructoseMoleFraction:.4,catalyst:'baseline',sourcesOpen:false,sourcesViewed:false,changed:false,active:null});
  if(owner&&typeof owner==='object'){if(!drafts.has(owner))drafts.set(owner,fresh());return drafts.get(owner);}return fresh();
}
function sourceCitation(source){
  return `${source.authors?.join(', ')||''}${source.authors?.length?' — ':''}${source.title} (${source.year})${source.section?`; §${source.section}`:''}${source.page?`; p. ${source.page}`:''}${source.table?`; ${source.table}`:''}`;
}
function evidenceHTML(){
  return GLC_FRU_EQUILIBRIUM_SOURCES.map(source=>{
    const citation=esc(sourceCitation(source));
    return `<li><p>${source.url&&/^https:\/\//.test(source.url)?`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${citation} ↗</a>`:citation}</p>${source.scope?`<p>${esc(source.scope)}</p>`:''}${source.record?`<p class="glc-fru-evidence-record">本機證據紀錄：${esc(source.record)}</p>`:''}</li>`;
  }).join('');
}
function chartHTML(result){
  const start=48,width=464,current=start+width*result.fructoseMoleFraction,target=start+width*result.equilibriumFructoseMoleFraction;
  const x=value=>Number(value.toFixed(3));
  const arrow=result.direction==='at-equilibrium'
    ?`<circle cx="${x(target)}" cy="13" r="6" class="glc-fru-equal"/>`
    :`<line x1="${x(current)}" y1="13" x2="${x(target)}" y2="13" class="glc-fru-direction-line"/><path d="M ${x(target+(target>current?-9:9))} 6 L ${x(target)} 13 L ${x(target+(target>current?-9:9))} 20" class="glc-fru-direction-line"/>`;
  const pool=(title,fraction,marker,markerClass)=>`<div class="glc-fru-chart-row"><div class="glc-fru-row-heading"><strong class="glc-fru-row-title">${title}</strong><span class="glc-fru-row-value">Fru ${percent(fraction)}</span></div><svg viewBox="0 0 560 52" aria-hidden="true" focusable="false"><rect x="48" y="8" width="464" height="34" rx="3" class="glc-fru-pool-glucose"/><rect x="48" y="8" width="${x(width*fraction)}" height="34" class="glc-fru-pool-fructose"/><line x1="${x(marker)}" y1="3" x2="${x(marker)}" y2="47" class="${markerClass}"/></svg></div>`;
  // Only the bars, markers, arrow and ticks use SVG coordinates. Text stays in
  // normal HTML flow so enlarging its font cannot collide at fixed SVG y values.
  return `<div class="glc-fru-chart">
    ${pool('目前總糖池',result.fructoseMoleFraction,current,'glc-fru-current-marker')}
    <div class="glc-fru-chart-direction"><svg viewBox="0 0 560 26" aria-hidden="true" focusable="false">${arrow}</svg><p>${result.direction==='at-equilibrium'?'Q′ = K′；沒有淨轉換方向':esc(directionLabel(result.direction))}</p></div>
    ${pool('同條件平衡 · 二池近似',result.equilibriumFructoseMoleFraction,target,'glc-fru-equilibrium-marker')}
    <svg class="glc-fru-chart-axis" viewBox="0 0 560 14" aria-hidden="true" focusable="false"><line x1="48" y1="6" x2="512" y2="6" class="glc-fru-axis"/>${[0,25,50,75,100].map(value=>`<line x1="${start+width*value/100}" y1="2" x2="${start+width*value/100}" y2="11" class="glc-fru-axis"/>`).join('')}</svg>
    <div class="glc-fru-axis-labels">${[0,25,50,75,100].map(value=>`<span style="left:${value}%">${value}%</span>`).join('')}</div>
    <p class="glc-fru-axis-title">Fru 莫耳分率 · xFru = Fru / (Glc + Fru)</p>
  </div>`;
}
export function mountGlcFruEquilibriumLab(host,{draftOwner,onChange=()=>{}}={}){
  const state=memory(draftOwner),token=Symbol('glc-fru-mount');state.active=token;let alive=true;
  const active=()=>alive&&state.active===token;
  host.innerHTML=`<section class="glc-fru-equilibrium-lab" aria-labelledby="glc-fru-title">
    <div class="glc-fru-heading"><h3 id="glc-fru-title">題設 40% Fru，就是同條件平衡嗎？</h3><p>比較組成與量測平衡；箭頭只示方向，不是時間進程。</p></div>
    <div class="glc-fru-workspace">
      <figure class="glc-fru-figure" aria-labelledby="glc-fru-title glc-fru-caption"><div class="glc-fru-legend"><span><i class="glc-fru-key-fructose"></i>總 Fru</span><span><i class="glc-fru-key-glucose"></i>總 Glc</span></div><div id="glc-fru-chart"></div><figcaption id="glc-fru-caption"></figcaption><p id="glc-fru-direction" class="glc-fru-direction" role="status" aria-live="polite" aria-atomic="true"></p><dl class="glc-fru-ratios"><div><dt>量測 K′</dt><dd id="glc-fru-k"></dd></div><div><dt>目前 Q′</dt><dd id="glc-fru-q"></dd></div><div><dt>Q′ / K′</dt><dd id="glc-fru-q-over-k"></dd></div></dl><p class="glc-fru-ratio-definition">K′ = 平衡 [Fru]tot / [Glc]tot；Q′ = 目前 [Fru]tot / [Glc]tot。</p></figure>
      <div class="glc-fru-controls"><label for="glc-fru-temperature">水溶液溫度 · pH 7.5<select id="glc-fru-temperature">${GLC_FRU_EQUILIBRIUM_MEASUREMENTS.map(row=>`<option value="${row.temperatureK}">${esc(measurementLabel(row))}</option>`).join('')}</select></label><p class="glc-fru-control-hint">僅列原始量測點；不插值。</p><label for="glc-fru-fraction" class="glc-fru-fraction-label">目前 Fru 莫耳分率<output id="glc-fru-fraction-output" for="glc-fru-fraction"></output></label><input id="glc-fru-fraction" type="range" min="0" max="100" step="any" aria-describedby="glc-fru-fraction-pools"><p id="glc-fru-fraction-pools" class="glc-fru-control-hint"></p><div class="glc-fru-presets" role="group" aria-label="套用起始組成">${presets.map(([id,label])=>`<button type="button" data-glc-fru-preset="${id}">${label}</button>`).join('')}</div><label for="glc-fru-catalyst">XI 催化情境 · 僅比較用量<select id="glc-fru-catalyst">${Object.entries(catalysts).map(([id,value])=>`<option value="${id}">${value.label}</option>`).join('')}</select></label><p id="glc-fru-catalyst-note" class="glc-fru-catalyst-note"></p><p id="glc-fru-input-status" class="glc-fru-input-status" role="status"></p></div>
    </div>
    <div class="glc-fru-scope"><p><strong>物種：</strong>指定 pH 下總 Glc／Fru，各含環式、開鏈與異頭體；pH 7.5 主要中性，未建各物種分率。GI 3D 開鏈構形不是溶液占比。</p><p><strong>條件：</strong>水、pH 7.5、表列緩衝與 MgSO4；HPLC 重列表未列糖濃度、離子強度、MgSO4 濃度及酵素種類／量的逐列資料。1985 同作者公開 References #13 更正：1984 文固定化 XI 製劑來源為 Bacillus coagulans；八列 HPLC 的製劑逐列分配與用量未核，1984 原全文未取得。 本圖為固定 Glc + Fru 的理想二池近似，不建模活度隨組成變化。</p><p><strong>邊界：</strong>XI 催化不設定新的 K′；鹼性異構化涉及其他糖與副反應；工業 HFCS 組成受製程與分離影響，不能直接替代此平衡。</p></div>
    <details id="glc-fru-sources" class="glc-fru-sources" ${state.sourcesOpen?'open':''}><summary>量測來源與適用範圍 · 原表可核對</summary><p>${esc(GLC_FRU_EQUILIBRIUM_SCOPE.poolDefinition)}</p><p>${esc(GLC_FRU_EQUILIBRIUM_SCOPE.approximation)}</p><p>原表列兩種緩衝：phosphate 0.039 mol dm−3 或 Tris 0.050 mol dm−3 + HCl，不能讀成混合配方；另列 ${esc(GLC_FRU_EQUILIBRIUM_SCOPE.cofactorRecord)}，用量未列；方法為 ${esc(GLC_FRU_EQUILIBRIUM_SCOPE.method)}。1985 同作者公開 References #13 更正：1984 文固定化 XI 製劑來源為 Bacillus coagulans；八列 HPLC 的製劑逐列分配與用量未核，1984 原全文未取得。 不能把控制列的 XI 概念用量當成原實驗配方。</p><ol>${evidenceHTML()}</ol><div class="glc-fru-source-table"><table><caption>採用的原表 K′：沒有由工業轉化率反推</caption><thead><tr><th scope="col">T / K</th><th scope="col">T / °C</th><th scope="col">K′</th><th scope="col">pH</th></tr></thead><tbody>${GLC_FRU_EQUILIBRIUM_MEASUREMENTS.map(row=>`<tr><td>${row.temperatureK.toFixed(2)}</td><td>${Number(row.temperatureC.toFixed(2))}</td><td>${row.kPrime.toFixed(3)}</td><td>${row.pH}</td></tr>`).join('')}</tbody></table></div></details>
  </section>`;
  const $=selector=>host.querySelector(selector);
  const temperature=$('#glc-fru-temperature'),fraction=$('#glc-fru-fraction'),catalyst=$('#glc-fru-catalyst'),sources=$('#glc-fru-sources'),buttons=[...host.querySelectorAll('[data-glc-fru-preset]')],inputStatus=$('#glc-fru-input-status');
  const chart=$('#glc-fru-chart'),caption=$('#glc-fru-caption'),direction=$('#glc-fru-direction'),k=$('#glc-fru-k'),q=$('#glc-fru-q'),qOverK=$('#glc-fru-q-over-k'),fractionOutput=$('#glc-fru-fraction-output'),fractionPools=$('#glc-fru-fraction-pools'),catalystNote=$('#glc-fru-catalyst-note');
  const result=()=>evaluateGlcFruEquilibrium({temperatureK:state.temperatureK,fructoseMoleFraction:state.fructoseMoleFraction});
  function summary(){
    const evaluated=result(),source=GLC_FRU_EQUILIBRIUM_SOURCES.find(source=>source.id===evaluated.measurement.sourceId),correctionSource=GLC_FRU_EQUILIBRIUM_SOURCES.find(source=>source.id==='tewari-goldberg-1985-correction');
    return ['Glc／Fru 同條件平衡比較（操作紀錄，不是答題評分）',
      `溫度：${measurementLabel(evaluated.measurement)}；水溶液，pH ${evaluated.measurement.pH}。`,
      `目前總糖池：Fru ${percent(evaluated.fructoseMoleFraction)}；Glc ${percent(evaluated.glucoseMoleFraction)}；xFru = ${evaluated.fructoseMoleFraction}。`,
      `量測 K′ = ${evaluated.kPrime}；目前 Q′ = ${Number.isFinite(evaluated.quotient)?evaluated.quotient:'∞'}；Q′ / K′ = ${Number.isFinite(evaluated.qOverK)?evaluated.qOverK:'∞'}（畫面：${displayedComparison(evaluated.qOverK,evaluated.direction)}）。`,
      `此條件平衡（二池近似）：Fru ${percent(evaluated.equilibriumFructoseMoleFraction)}；Glc ${percent(evaluated.equilibriumGlucoseMoleFraction)}；${directionLabel(evaluated.direction)}。`,
      `催化情境：${catalysts[state.catalyst].label}；${catalysts[state.catalyst].note}`,
      '指定 pH 下總 Glc／Fru 含環式、開鏈及異頭體；pH 7.5 主要中性，未建解離或金屬配位各物種分率；開鏈 3D 示意不代表溶液占比。',
      '原表列 phosphate 0.039 mol dm−3 或 Tris 0.050 mol dm−3 + HCl 兩種緩衝，非混合配方；另列 MgSO4。',
      'HPLC 重列表未列總糖濃度、離子強度、MgSO4 濃度與酵素製劑／用量的逐列資料；1985 同作者公開 References #13 更正：1984 文固定化 XI 製劑來源為 Bacillus coagulans；八列 HPLC 的製劑逐列分配與用量未核，1984 原全文未取得。 不建模活度隨組成變化，不外推 pH、鹼催化、副反應、工業 HFCS 或其他溶劑。',
      '尚未實測反應速度、到達時間或轉化率；箭頭僅為 Q′ 與 K′ 的組成比較。',
      `來源說明：${state.sourcesViewed?'已展開':'尚未展開'}；${state.changed?'已調整參數':'初始對照展示'}，不據此宣稱答對或理解。`,
      `量測引用：${source?sourceCitation(source):evaluated.measurement.sourceId}；${source?.url||''}`,
      `製劑來源更正引用：${correctionSource?sourceCitation(correctionSource):'1985 公開 References #13'}；${correctionSource?.url||''}`
    ].join('\n');
  }
  function refresh(notify=false){
    const evaluated=result();temperature.value=String(state.temperatureK);fraction.value=String(state.fructoseMoleFraction*100);catalyst.value=state.catalyst;
    fractionOutput.textContent=percent(evaluated.fructoseMoleFraction);fraction.setAttribute('aria-valuetext',`總 Fru ${percent(evaluated.fructoseMoleFraction)}；總 Glc ${percent(evaluated.glucoseMoleFraction)}`);
    fractionPools.textContent=`Glc ${percent(evaluated.glucoseMoleFraction)} · Fru + Glc 固定`;
    chart.innerHTML=chartHTML(evaluated);
    caption.textContent=`${measurementLabel(evaluated.measurement)}：目前 Glc ${percent(evaluated.glucoseMoleFraction)}／Fru ${percent(evaluated.fructoseMoleFraction)}；平衡 Glc ${percent(evaluated.equilibriumGlucoseMoleFraction)}／Fru ${percent(evaluated.equilibriumFructoseMoleFraction)}。`;
    direction.textContent=directionLabel(evaluated.direction)+(evaluated.direction==='at-equilibrium'?'。':'；箭頭不表示實際速率。');
    k.textContent=evaluated.kPrime.toFixed(3);q.textContent=ratio(evaluated.quotient);qOverK.textContent=displayedComparison(evaluated.qOverK,evaluated.direction);catalystNote.textContent=catalysts[state.catalyst].note;
    buttons.forEach(button=>{
      const value=button.dataset.glcFruPreset==='glucose'?0:button.dataset.glcFruPreset==='fructose'?1:button.dataset.glcFruPreset==='given'?.4:evaluated.equilibriumFructoseMoleFraction;
      button.setAttribute('aria-pressed',String(Math.abs(state.fructoseMoleFraction-value)<1e-12));
    });
    if(notify&&typeof onChange==='function')onChange(summary());
  }
  function setParameter(field,value){
    if(!active()||state[field]===value)return;
    try{
      if(field==='temperatureK')evaluateGlcFruEquilibrium({temperatureK:value,fructoseMoleFraction:state.fructoseMoleFraction});
      else if(field==='fructoseMoleFraction')evaluateGlcFruEquilibrium({temperatureK:state.temperatureK,fructoseMoleFraction:value});
      else if(!Object.hasOwn(catalysts,value))throw new RangeError('Unknown catalyst scenario');
    }catch{inputStatus.textContent='請使用列出的量測溫度與 0–100% 組成；原參數保留。';refresh();return;}
    state[field]=value;state.changed=true;inputStatus.textContent='';refresh(true);
  }
  temperature.onchange=()=>setParameter('temperatureK',Number(temperature.value));
  fraction.oninput=()=>setParameter('fructoseMoleFraction',Number(fraction.value)/100);
  catalyst.onchange=()=>setParameter('catalyst',catalyst.value);
  for(const button of buttons)button.onclick=()=>{
    if(!active())return;
    const preset=button.dataset.glcFruPreset,value=preset==='glucose'?0:preset==='fructose'?1:preset==='given'?.4:result().equilibriumFructoseMoleFraction;
    setParameter('fructoseMoleFraction',value);
  };
  sources.ontoggle=()=>{if(!active())return;if(state.sourcesOpen===sources.open&&(!sources.open||state.sourcesViewed))return;state.sourcesOpen=sources.open;if(sources.open)state.sourcesViewed=true;if(typeof onChange==='function')onChange(summary());};
  refresh();
  const dispose=()=>{if(!alive)return;alive=false;if(state.active===token)state.active=null;temperature.onchange=null;fraction.oninput=null;catalyst.onchange=null;sources.ontoggle=null;for(const button of buttons)button.onclick=null;};
  dispose.summary=summary;
  dispose.focus=()=>{if(active())temperature.focus();};
  return dispose;
}
