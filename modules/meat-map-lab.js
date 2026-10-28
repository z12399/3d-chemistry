import {escapeHTML as esc} from './storage.js';
import {MEAT_MAP_DATA as DATA} from './meat-map-data.js';
import {MEAT_MAP_ID,compareMeatMap} from './meat-map-model.js';

export const MEAT_MAP_LAB_ID=MEAT_MAP_ID;
export const MEAT_MAP_SOURCES=DATA.sources;
const drafts=new WeakMap();let sequence=0;
const clone=value=>structuredClone(value);
const fmt=(n,d=3)=>Number(n).toLocaleString('en-US',{maximumFractionDigits:d,useGrouping:false});
const signed=n=>`${n>0?'+':''}${fmt(n)}`;
const meanSD=row=>`${row.meanText} ± ${row.sdText}`;
const atmosphere=id=>DATA.atmospheres.find(a=>a.id===id);
const metric=id=>DATA.metrics.find(m=>m.id===id);
const COLORS=['#476f83','#a66734','#705e9c'];
const PATHWAYS={
  oxygenation:{label:'氧合／解離',formula:'Mb–Fe²⁺ + O₂ ⇌ Mb–Fe²⁺·O₂',from:'DMb',to:'OMb',result:'O₂ 結合；形式鐵價不變',note:'去氧與氧合肌紅蛋白以 Fe²⁺ 作常用形式記帳。氧的結合與解離，和鐵失去電子是兩件事；這是關係示意，沒有模擬反應速率。'},
  oxidation:{label:'鐵被氧化',formula:'Mb–Fe²⁺ → Mb–Fe³⁺ + e⁻',from:'DMb',to:'MMb',result:'Fe²⁺ → Fe³⁺',note:'這裡畫氧化半反應，省略電子受體，不是完整氧化淨式。高鐵肌紅蛋白通常呈褐色；氧合肌紅蛋白也會發生氧化，圖不表示唯一途徑。'},
  reduction:{label:'鐵被還原',formula:'Mb–Fe³⁺ + e⁻ → Mb–Fe²⁺',from:'MMb',to:'DMb',result:'Fe³⁺ → Fe²⁺',note:'這是省略電子供體的還原半反應。還原後是否結合 O₂，還受局部氧氣供應等條件影響；不能從包內 O₂ 比例直接算各形態含量。'},
};
const PACKAGE_GOALS={
  retain:{label:'維持充填氣氛',heading:'先查氣體阻隔與整包密封',need:['O₂／CO₂ 透過性與測試溫度、相對濕度、壓差','厚度、面積、封口及漏氣；實測包內氣體隨時間的變化'],limit:'同一材料的研究沒有材料對照，不能推出最佳包材或整包透氧軌跡。'},
  display:{label:'評估陳列肉色',heading:'把肉色、氧化與陳列條件一起比較',need:['同一肉品、光照、溫度、氣體體積與量測方式','肉色以外的脂質／蛋白質氧化及感官結果'],limit:'本組實驗大部分時間在暗處冷藏；不能直接當作有照明貨架的結果。'},
  life:{label:'驗證保存期限',heading:'另做微生物與品質驗證',need:['目標微生物、初始污染、溫度歷程與氣氛控制','整包密封、感官與化學劣變；相應方法與對照'],limit:'a*、肌紅蛋白相對指標和 CO₂ 的使用，都不能單獨給出安全天數。'},
};
const CHOICES={higher:'B 較高',lower:'B 較低',same:'表列均值相同',unknown:'先保留'};
const fresh=()=>({view:'experiment',mode:'atmospheres',metricId:'aStar',day:14,aAtmosphere:'medium',bAtmosphere:'high',timeAtmosphere:'medium',aDay:0,bDay:14,pathway:'oxygenation',packageGoal:'retain',showSD:true,cases:{},observations:[],sources:[],detailsOpened:false,tableOpened:false,revealedMetrics:[],cursor:{started:false,first:[],results:[],writing:{},observations:0,sources:[],details:false,table:false}});
function settings(d){
  if(d.view==='mechanism')return {view:d.view,pathway:d.pathway};
  if(d.view==='package')return {view:d.view,packageGoal:d.packageGoal};
  return {view:d.view,mode:d.mode,metricId:d.metricId,a:{atmosphereId:d.mode==='atmospheres'?d.aAtmosphere:d.timeAtmosphere,day:d.mode==='atmospheres'?d.day:d.aDay},b:{atmosphereId:d.mode==='atmospheres'?d.bAtmosphere:d.timeAtmosphere,day:d.mode==='atmospheres'?d.day:d.bDay}};
}
const key=p=>JSON.stringify(p);
function current(d){const p=settings(d);return d.cases[key(p)]??={parameters:p,choice:'',prediction:'',revision:'',next:'',first:null,revealed:p.view!=='experiment'};}
function conditionText(p){
  if(p.view==='mechanism')return `氧合與氧化｜${PATHWAYS[p.pathway].label}`;
  if(p.view==='package')return `包材判讀｜${PACKAGE_GOALS[p.packageGoal].label}`;
  return `${metric(p.metricId).label}｜A：${atmosphere(p.a.atmosphereId).label}，第 ${p.a.day} 日｜B：${atmosphere(p.b.atmosphereId).label}，第 ${p.b.day} 日`;
}
function resultFor(p){
  if(p.view==='mechanism')return clone(PATHWAYS[p.pathway]);
  if(p.view==='package')return clone(PACKAGE_GOALS[p.packageGoal]);
  return compareMeatMap(DATA,{a:p.a,b:p.b,metricId:p.metricId});
}
const writing=c=>({choice:c.choice,prediction:c.prediction,revision:c.revision,next:c.next});
const writingText=w=>`判斷：${CHOICES[w.choice]||'未選'}\n理由／解釋：${w.prediction||'未填'}\n觀察後修訂：${w.revision||'未填'}\n下一項證據：${w.next||'未填'}`;
const sourceText=()=>DATA.sources.map(s=>`${s.title}\n${s.url}`).join('\n');
function resultText(p,r){
  if(p.view==='mechanism')return `${r.formula}\n${r.result}。${r.note}`;
  if(p.view==='package')return `${r.heading}\n${r.need.join('；')}。\n${r.limit}`;
  return `A：${meanSD(r.a)}；B：${meanSD(r.b)}（表列平均值 ± SD）。\nB − A = ${signed(r.meanDifference)}（${p.metricId==='aStar'?'a* 座標差':'相對指標差，無量綱'}）。差值是描述計算；不由誤差棒判定顯著，不推算差值的 SD／SE。${p.metricId==='aStar'?'':'來源方法解讀疑義尚未釐清，不能由此升降推定各形態含量。'}`;
}
function symbol(i,x,y,size=4){
  const color=COLORS[i];
  if(i===1)return `<path d="M${x},${y-size-1}l${size+1},${2*size+2}h${-2*size-2}Z" fill="${color}"/>`;
  if(i===2)return `<rect x="${x-size}" y="${y-size}" width="${size*2}" height="${size*2}" fill="${color}"/>`;
  return `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}"/>`;
}
function chart(p,revealed,showSD,prefix){
  const m=metric(p.metricId),rows=DATA.observations.filter(o=>o.metricId===p.metricId);
  const max=Math.ceil(Math.max(...rows.map(o=>o.mean+o.sd))),min=Math.min(0,Math.floor(Math.min(...rows.map(o=>o.mean-o.sd)))),span=Math.max(1,max-min);
  const left=51,right=576,top=24,bottom=200,x=day=>left+day/14*(right-left),y=value=>bottom-(value-min)/span*(bottom-top);
  const coordinate=(row)=>({x:x(row.day),y:y(row.mean)});
  return `<svg viewBox="0 0 625 247" role="img" aria-labelledby="${prefix}-chart-title"><title id="${prefix}-chart-title">${esc(m.label)}：三個完整氣氛配方的離散量測；${revealed?(showSD?'平均值與正負一個 SD':'平均值；SD 已隱藏'):'尚未顯示資料'}</title>${Array.from({length:5},(_,i)=>{const v=min+span*i/4;return `<path d="M${left},${y(v)}H${right}" class="meatmap-grid"/><text x="${left-10}" y="${y(v)+5}" text-anchor="end">${fmt(v,2)}</text>`;}).join('')}${DATA.days.map(day=>`<text x="${x(day)}" y="225" text-anchor="middle">${day}</text>`).join('')}<text x="${left}" y="14">${p.metricId==='aStar'?'a*':'相對指標（無量綱）'}</text><text x="${right}" y="245" text-anchor="end">儲存日</text>${revealed?DATA.atmospheres.map((a,i)=>rows.filter(o=>o.atmosphereId===a.id).map(row=>{const pt=coordinate(row);return `${showSD?`<path d="M${pt.x},${y(row.mean-row.sd)}V${y(row.mean+row.sd)}M${pt.x-3},${y(row.mean-row.sd)}h6M${pt.x-3},${y(row.mean+row.sd)}h6" stroke="${COLORS[i]}" class="meatmap-errorbar"/>`:''}${symbol(i,pt.x,pt.y)}`;}).join('')).join('')+['a','b'].map((label,index)=>{const row=rows.find(o=>o.atmosphereId===p[label].atmosphereId&&o.day===p[label].day),pt=coordinate(row);return `<circle cx="${pt.x}" cy="${pt.y}" r="9" class="meatmap-selected"/><text x="${pt.x+(index?13:-13)}" y="${pt.y-12}" text-anchor="${index?'start':'end'}" class="meatmap-point-label">${label.toUpperCase()}</text>`;}).join(''):`<text x="312" y="114" text-anchor="middle" class="meatmap-unseen">選好比較條件，再顯示資料</text>`}</svg>`;
}
function mechanism(p){
  const r=PATHWAYS[p.pathway],forms=[['DMb','去氧肌紅蛋白','Fe²⁺','紫紅'],['OMb','氧合肌紅蛋白','Fe²⁺·O₂','鮮紅'],['MMb','高鐵肌紅蛋白','Fe³⁺','褐']];
  return `<div class="meatmap-forms" role="group" aria-label="肌紅蛋白形式關係示意">${forms.map(([id,label,iron,color])=>`<div class="meatmap-form${[r.from,r.to].includes(id)?' meatmap-form-active':''}"><span>${id}</span><strong>${iron}</strong><span>${label}</span><small>常見外觀：${color}</small></div>`).join('')}</div><div class="meatmap-reaction"><strong>${esc(r.formula)}</strong><p>${esc(r.result)}</p></div><p class="meatmap-context">${esc(r.note)}</p><p class="meatmap-caption">顏色名稱是一般化學說明；此圖沒有計算形態比例、螢幕肉色或微生物安全。</p>`;
}

/** Drafts belong to one lesson owner; its existing host handles durable notes and native exports. */
export function mountMeatMapLab(root,id=MEAT_MAP_LAB_ID,{draftOwner,draftKey='proc-meat-map-evidence',onSaveSummary}={}){
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  if(id!==MEAT_MAP_LAB_ID)throw new RangeError('Unknown meat MAP activity');
  const owned=draftOwner&&typeof draftOwner==='object';if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,new Map());
  const board=owned?drafts.get(draftOwner):new Map();if(!board.has(draftKey))board.set(draftKey,fresh());
  const d=board.get(draftKey),prefix=`meatmap-${++sequence}`,field=name=>root.querySelector(`[data-mm-${name}]`),action=name=>root.querySelector(`[data-mm-action="${name}"]`);
  let disposed=false,feedback='',saveStatus='',error='';current(d);
  const atmosphereOptions=()=>DATA.atmospheres.map(a=>`<option value="${esc(a.id)}">${esc(a.label)}</option>`).join('');
  const dayOptions=()=>DATA.days.map(day=>`<option value="${day}">第 ${day} 日</option>`).join('');
  root.innerHTML=`<section class="meat-map-lab" aria-labelledby="${prefix}-title"><h2 class="meatmap-sr-only" id="${prefix}-title">肉品包裝、肌紅蛋白與肉色</h2>
    <div class="meatmap-toolbar"><div role="group" aria-label="肉品包裝觀察視圖">${[['experiment','實測比較'],['mechanism','氧合與氧化'],['package','包材判讀']].map(([v,l])=>`<button type="button" data-mm-view="${v}">${l}</button>`).join('')}</div><button type="button" data-mm-action="record">記下觀察</button></div>
    <div data-mm-experiment-panel><div class="meatmap-controls"><label for="${prefix}-mode">比較方式<select id="${prefix}-mode" data-mm-mode><option value="atmospheres">同日，比配方</option><option value="time">同配方，比日期</option></select></label><label for="${prefix}-metric">讀值<select id="${prefix}-metric" data-mm-metric>${DATA.metrics.map(m=>`<option value="${esc(m.id)}">${esc(m.label)}</option>`).join('')}</select></label><label class="meatmap-check" for="${prefix}-sd"><input type="checkbox" id="${prefix}-sd" data-mm-sd checked>± SD</label><button type="button" class="meatmap-primary" data-mm-action="reveal">顯示資料</button></div>
    <div class="meatmap-controls meatmap-pair" data-mm-atmosphere-controls><label for="${prefix}-day">日期<select id="${prefix}-day" data-mm-day>${dayOptions()}</select></label><label for="${prefix}-a-atmosphere">A<select id="${prefix}-a-atmosphere" data-mm-a-atmosphere>${atmosphereOptions()}</select></label><label for="${prefix}-b-atmosphere">B<select id="${prefix}-b-atmosphere" data-mm-b-atmosphere>${atmosphereOptions()}</select></label></div>
    <div class="meatmap-controls meatmap-pair" data-mm-time-controls hidden><label for="${prefix}-atmosphere">配方<select id="${prefix}-atmosphere" data-mm-atmosphere>${atmosphereOptions()}</select></label><label for="${prefix}-a-day">A<select id="${prefix}-a-day" data-mm-a-day>${dayOptions()}</select></label><label for="${prefix}-b-day">B<select id="${prefix}-b-day" data-mm-b-day>${dayOptions()}</select></label></div>
    <p class="meatmap-index-warning" data-mm-index-warning hidden>方法解讀疑義尚未釐清：以下只比較作者表列相對指標，不能由升降推定各形態含量。</p><div class="meatmap-display"><div class="meatmap-chart" data-mm-chart></div><div class="meatmap-results" aria-live="polite" data-mm-results></div></div><div class="meatmap-legend">${DATA.atmospheres.map((a,i)=>`<span><svg viewBox="0 0 14 14" aria-hidden="true">${symbol(i,7,7,4)}</svg>${esc(a.label)}</span>`).join('')}</div><p class="meatmap-caption" data-mm-caption></p><p class="meatmap-boundary">2°C、暗處冷藏的牛肉研究 · 70% O₂ 配方也加入 CO₂；肉色不能單獨判定安全。</p></div>
    <div data-mm-mechanism-panel hidden><div class="meatmap-paths" role="group" aria-label="選擇肌紅蛋白改變">${Object.entries(PATHWAYS).map(([id,r])=>`<button type="button" data-mm-pathway="${id}">${r.label}</button>`).join('')}</div><div data-mm-mechanism></div></div>
    <div data-mm-package-panel hidden><div class="meatmap-paths" role="group" aria-label="包材判讀目的">${Object.entries(PACKAGE_GOALS).map(([id,g])=>`<button type="button" data-mm-package-goal="${id}">${g.label}</button>`).join('')}</div><div class="meatmap-package-board"><div><span class="meatmap-kicker">這份研究使用</span><strong>同一 PA／PE 側封袋</strong><p>220 × 330 mm · 90 μm<br>氧透過性規格 ≤ 56 cm³/(m²·bar·24 h)</p><p class="meatmap-context">文中未列此規格的測試溫度與 RH。帶有壓差分母，不直接當作任意條件的整包 OTR。</p></div><div data-mm-package-result aria-live="polite"></div></div></div>
    <p role="status" class="meatmap-error" data-mm-error></p><p role="status" class="meatmap-feedback" data-mm-feedback></p>
    <details><summary>我的判斷、修訂與下一項證據</summary><p data-mm-question></p><div class="meatmap-choices" data-mm-choices role="group" aria-label="均值差判斷">${Object.entries(CHOICES).map(([v,l])=>`<button type="button" data-mm-choice="${v}">${l}</button>`).join('')}</div><label for="${prefix}-prediction">目前的理由／解釋<textarea id="${prefix}-prediction" rows="2" data-mm-prediction></textarea></label><p class="meatmap-context" data-mm-first></p><label for="${prefix}-revision">觀察後修訂<textarea id="${prefix}-revision" rows="2" data-mm-revision></textarea></label><label for="${prefix}-next">下一項需要的證據<textarea id="${prefix}-next" rows="2" data-mm-next></textarea></label><button type="button" data-mm-action="record-writing">記錄這次文字</button></details>
    <details><summary>已記錄的觀察 <span data-mm-count></span></summary><div data-mm-records></div></details>
    <details><summary>檢查並保存摘要</summary><label for="${prefix}-summary">所有條件的完整摘要<textarea id="${prefix}-summary" readonly rows="7" data-mm-summary></textarea></label><button type="button" data-mm-action="copy">選取完整摘要</button><label for="${prefix}-append">本次附加內容<textarea id="${prefix}-append" readonly rows="5" data-mm-append></textarea></label><button type="button" data-mm-action="save" ${typeof onSaveSummary!=='function'?'hidden':''}>附加到本課筆記</button><p role="status" data-mm-save-status></p><p class="meatmap-context">課內返回可接續草稿；重新整理前請保存或複製。保存成功後才推進，不截斷內容。</p></details>
    <details data-mm-table-details><summary>量測表與作者統計字母</summary><p class="meatmap-context">本表展開會顯示目前指標的全部資料。大寫字母比同配方跨日，小寫字母比同日配方；共享字母不等於證明相等。± 為 SD，不能只看誤差棒有無重疊判定顯著。</p><div class="meatmap-table-wrap" data-mm-table></div></details>
    <details data-mm-details><summary>數值定義、實驗條件與來源</summary><p>a* 是綠—紅軸色座標；不是紅色百分比。DMb、OMb、MMb 保留作者報告的反射相對指標，無量綱，不是濃度、組成百分比或可加總為 100% 的三個比例。</p><p>來源方法解讀疑義尚未釐清：出版頁索引擷取的比值公式與 AMSA 原始指南的方向說明存在疑義，尚未取得論文原始 PDF／XML 以進一步核對。因此不由相對指標升降判定形態含量，也不自行取倒數、重算或改寫附表。論文摘要／正文的少數數字和附表不同，本圖固定採附表 A2、A5、A6、A7。</p><p>研究以 3 頭 Simmental 牛的 silverside 製成 5 × 5 × 1 cm 肉片，每配方各牛 3 片，每片重複讀值。附表將每配方的 27 個讀值彙整為 3 個動物均值；不能當成 27 頭牛。圖中採附表 mean ± SD，不混用正文圖的 SE。</p><p>圖只標出原研究的八個量測日期，不連成預測曲線。所選 A、B 的差值只作描述；沒有原始配對讀值與共變異資料，不補造差值誤差、p 值或信賴區間。作者統計字母另外保留在表中。</p><p>配方是充填的標稱組成，並非每個日期的實測包內氣體。1% 與 20% 組用 N₂ 平衡，70% 組含 30% CO₂；跨配方差異不能全歸為 O₂ 的單因果效果。這裡不預測其他氣體配比、溫度、包材或肉品。</p><p>O₂ 可促進肌紅蛋白氧合，也涉及氧化劣變；CO₂ 可抑制某些微生物生長，效果依微生物及條件而異；本研究以 N₂ 作平衡氣體；它不是形成 OMb 的 O₂ 配位體。三者的用途不能替代冷鏈、密封及微生物驗證。此研究使用單一包材，不能推出材料排名或安全保存期限。</p><p>氧合／氧化圖是有來源的形式關係示意，不是實驗原子座標、分子動態或動力學模型。課文、來源及先前操作可能已透露結果，首次文字快照不作盲測。</p><ul>${DATA.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-mm-source="${esc(s.id)}">${esc(s.title)}</a></li>`).join('')}</ul></details></section>`;
  function captureFirst(trigger){const c=current(d);if(!c.first)c.first={trigger,parameters:clone(c.parameters),writing:clone(writing(c)),exposure:{currentRevealed:c.revealed,showSD:d.showSD,revealedMetrics:[...d.revealedMetrics],tableOpened:d.tableOpened,detailsOpened:d.detailsOpened,sources:[...d.sources]}};}
  function firstText(c){if(!c.first)return '首次顯示、記錄或開啟資料／來源時保留當時文字。一般原理即時可見，其他頁面也可能透露結果，不作盲測。';const f=c.first,e=f.exposure;return `首次保留（${f.trigger}）\n${writingText(f.writing)}\n當時目前結果已顯示=${e.currentRevealed?'是':'否'}；先前顯示過全圖的指標=${e.revealedMetrics.join('、')||'無'}；量測表已開=${e.tableOpened?'是':'否'}；定義已開=${e.detailsOpened?'是':'否'}；來源=${e.sources.join('、')||'無'}。後續改寫不覆蓋此快照。`;}
  function observationText(o,i){return `觀察 ${i+1}｜${conditionText(o.parameters)}\n${o.result?resultText(o.parameters,o.result):'這組實測比較尚未顯示。'}\n${o.parameters.view==='experiment'?`圖中 ± SD：${o.showSD?'顯示':'隱藏'}。\n`:''}${writingText(o.writing)}`;}
  function archive(){return ['鮮肉 MAP 觀察｜附表 mean ± SD；描述差值不是單因果效果或安全期限。肌紅蛋白指標的方法方向疑義未釐清，不能據其升降推含量。不是盲測。',...Object.values(d.cases).map(c=>[conditionText(c.parameters),firstText(c),c.revealed?resultText(c.parameters,resultFor(c.parameters)):'此比較尚未顯示',writingText(writing(c))].join('\n')),...d.observations.map(observationText),`已開量測表=${d.tableOpened?'是':'否'}；定義=${d.detailsOpened?'是':'否'}；來源=${d.sources.join('、')||'無'}。開啟不證明讀完或理解。`,sourceText()].join('\n\n');}
  function appendPlan(){const next=clone(d.cursor),blocks=[];for(const [k,c] of Object.entries(d.cases)){
    if(c.first&&!next.first.includes(k)){blocks.push(`${conditionText(c.parameters)}\n${firstText(c)}`);next.first.push(k);}
    if(c.first&&c.revealed&&!next.results.includes(k)){blocks.push(`${conditionText(c.parameters)}\n${resultText(c.parameters,resultFor(c.parameters))}`);next.results.push(k);}
    const w=writing(c),old=next.writing[k];if(JSON.stringify(w)!==JSON.stringify(old)){if(Object.values(w).some(Boolean)||old)blocks.push(`${conditionText(c.parameters)}\n${writingText(w)}`);next.writing[k]=clone(w);}
  }for(let i=next.observations;i<d.observations.length;i++)blocks.push(observationText(d.observations[i],i));next.observations=d.observations.length;
    for(const [flag,label] of [['details','定義與限制'],['table','量測表']])if(d[`${flag}Opened`]&&!next[flag]){blocks.push(`已開${label}；不等於完整閱讀或理解。`);next[flag]=true;}const sources=d.sources.filter(s=>!next.sources.includes(s));if(sources.length)blocks.push('新增來源開啟：'+sources.join('、')+'（不證明閱讀範圍）');next.sources=[...d.sources];
    if(blocks.length&&!next.started){blocks.unshift('鮮肉 MAP 觀察｜固定研究配方與離散日期；± 為 SD。a* 非百分比，肌紅蛋白為無量綱相對指標，方法方向疑義尚未釐清；不能由其升降判定含量。B−A 僅描述差，不推安全期限、單因果或材料排名。一般原理與先前結果可能可見，不作盲測。');blocks.push(sourceText());next.started=true;}return {text:blocks.join('\n\n'),next};}
  function drawSummary(){field('summary').value=archive();const plan=appendPlan();field('append').value=plan.text;action('save').disabled=!plan.text;field('save-status').textContent=saveStatus;}
  function table(){const rows=DATA.observations.filter(o=>o.metricId===d.metricId);return `${d.metricId==='aStar'?'':'<p class="meatmap-index-warning">保留作者報告值；論文方法與指南的比值方向有疑義。僅比較指標數值，不能由升降判定各形態含量。</p>'}<table><caption>${esc(metric(d.metricId).label)} · 表列平均值 ± SD</caption><thead><tr><th scope="col">日</th>${DATA.atmospheres.map(a=>`<th scope="col">${esc(a.label)}</th>`).join('')}</tr></thead><tbody>${DATA.days.map(day=>`<tr><th scope="row">${day}</th>${DATA.atmospheres.map(a=>{const r=rows.find(o=>o.atmosphereId===a.id&&o.day===day),l=r.letters;return `<td>${esc(meanSD(r))}<br><small>${esc([l?.withinAtmosphereAcrossDays,l?.withinDayAcrossAtmospheres].map(v=>Array.isArray(v)?v.join(''):v||'').join(' '))}</small></td>`;}).join('')}</tr>`).join('')}</tbody></table>`;}
  function draw(){if(disposed)return;const c=current(d),p=c.parameters,r=resultFor(p),experiment=d.view==='experiment';
    root.querySelectorAll('[data-mm-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mmView===d.view)));
    for(const view of ['experiment','mechanism','package'])field(`${view}-panel`).hidden=d.view!==view;
    field('mode').value=d.mode;field('metric').value=d.metricId;field('day').value=String(d.day);field('a-atmosphere').value=d.aAtmosphere;field('b-atmosphere').value=d.bAtmosphere;field('atmosphere').value=d.timeAtmosphere;field('a-day').value=String(d.aDay);field('b-day').value=String(d.bDay);field('sd').checked=d.showSD;
    field('atmosphere-controls').hidden=d.mode!=='atmospheres';field('time-controls').hidden=d.mode!=='time';field('index-warning').hidden=d.metricId==='aStar';
    if(experiment){field('chart').innerHTML=chart(p,c.revealed,d.showSD,prefix);field('results').innerHTML=c.revealed?`<span>B − A · ${p.metricId==='aStar'?'a* 座標差':'相對指標差'}</span><strong>${signed(r.meanDifference)}</strong><dl><div><dt>A</dt><dd>${esc(meanSD(r.a))}</dd></div><div><dt>B</dt><dd>${esc(meanSD(r.b))}</dd></div></dl><small>平均值 ± SD<br>不由差值大小推論顯著</small>`:'<strong class="meatmap-waiting">先想一想</strong><p>可以先記下判斷，再顯示量測點。</p>';field('caption').textContent=`Krell et al.（2025）· ${metric(p.metricId).tableId||'附表'} · ${d.showSD?'點為均值，誤差棒為 ± SD':'點為均值，SD 已隱藏'}；只畫量測日，不插值。`;}
    field('mechanism').innerHTML=mechanism({pathway:d.pathway});root.querySelectorAll('[data-mm-pathway]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mmPathway===d.pathway)));
    const g=PACKAGE_GOALS[d.packageGoal];field('package-result').innerHTML=`<span class="meatmap-kicker">還要核對</span><strong>${esc(g.heading)}</strong><ul>${g.need.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><p class="meatmap-boundary">${esc(g.limit)}</p>`;root.querySelectorAll('[data-mm-package-goal]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mmPackageGoal===d.packageGoal)));
    field('choices').hidden=!experiment;field('question').textContent=experiment?`比較 ${conditionText(p)}。B − A 的方向如何？這能支持哪些結論？`:`${conditionText(p)}：請用自己的話說明關鍵差異與還需要的證據。`;
    root.querySelectorAll('[data-mm-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mmChoice===c.choice)));for(const name of ['prediction','revision','next'])field(name).value=c[name];field('first').textContent=firstText(c);field('count').textContent=`${d.observations.length} / 24`;
    field('records').innerHTML=d.observations.length?d.observations.map((o,i)=>`<article><p>${esc(observationText(o,i))}</p><button type="button" data-mm-replay="${i}">回到觀察 ${i+1} 的條件</button></article>`).join(''):'<p>尚未記錄。</p>';field('table').innerHTML=table();field('error').textContent=error;field('feedback').textContent=feedback;drawSummary();}
  function switchCondition(p){
    if(!['experiment','mechanism','package'].includes(p.view))throw new RangeError('未知觀察視圖。');
    if(p.view==='experiment'){if(!['atmospheres','time'].includes(p.mode))throw new RangeError('請選擇同日或同配方比較。');resultFor(p);}else if(p.view==='mechanism'&&!PATHWAYS[p.pathway])throw new RangeError('未知化學途徑。');else if(p.view==='package'&&!PACKAGE_GOALS[p.packageGoal])throw new RangeError('未知包材目的。');
    d.view=p.view;if(p.view==='experiment'){d.mode=p.mode;d.metricId=p.metricId;if(p.mode==='atmospheres'){d.day=p.a.day;d.aAtmosphere=p.a.atmosphereId;d.bAtmosphere=p.b.atmosphereId;}else{d.timeAtmosphere=p.a.atmosphereId;d.aDay=p.a.day;d.bDay=p.b.day;}}else if(p.view==='mechanism')d.pathway=p.pathway;else d.packageGoal=p.packageGoal;
    current(d);if(field('table-details').open){captureFirst('開啟中的全表更新前');d.tableOpened=true;if(!d.revealedMetrics.includes(d.metricId))d.revealedMetrics.push(d.metricId);}feedback='';error='';saveStatus='';draw();
  }
  function record(){captureFirst('記下條件與文字');const c=current(d),o={parameters:clone(c.parameters),result:c.revealed?clone(resultFor(c.parameters)):null,showSD:d.showSD,writing:clone(writing(c))};if(d.observations.some(v=>JSON.stringify(v)===JSON.stringify(o)))feedback='這份條件、結果與文字已記錄。';else if(d.observations.length>=24)feedback='已保留 24 份快照，不覆寫原紀錄；請先保存或複製。';else{d.observations.push(o);feedback=`已保留第 ${d.observations.length} 份觀察。`;saveStatus='';}draw();}
  function click(event){if(disposed)return;const source=event.target.closest?.('[data-mm-source]');if(source&&root.contains(source)){captureFirst('開啟來源前');if(!d.sources.includes(source.dataset.mmSource))d.sources.push(source.dataset.mmSource);draw();return;}const b=event.target.closest?.('button');if(!b||!root.contains(b)||b.disabled)return;
    if(b.dataset.mmView){switchCondition(settings({...d,view:b.dataset.mmView}));return;}
    if(b.dataset.mmPathway){switchCondition({view:'mechanism',pathway:b.dataset.mmPathway});return;}
    if(b.dataset.mmPackageGoal){switchCondition({view:'package',packageGoal:b.dataset.mmPackageGoal});return;}
    if(b.dataset.mmReplay!==undefined){const o=d.observations[Number(b.dataset.mmReplay)];if(o){d.showSD=o.showSD;switchCondition(o.parameters);feedback='已回到原條件與誤差棒設定；目前修訂與歷史文字分別保留。';draw();}return;}
    if(b.dataset.mmChoice&&CHOICES[b.dataset.mmChoice]){current(d).choice=b.dataset.mmChoice;saveStatus='';draw();return;}
    const name=b.dataset.mmAction;if(name==='reveal'){captureFirst('顯示全圖前');current(d).revealed=true;if(!d.revealedMetrics.includes(d.metricId))d.revealedMetrics.push(d.metricId);feedback='圖已顯示此指標全部量測點；A、B 圈出目前比較。';draw();}else if(['record','record-writing'].includes(name))record();else if(name==='copy'){field('summary').focus();field('summary').select();saveStatus='已選取完整摘要，按 Ctrl+C 複製。';drawSummary();}else if(name==='save'&&typeof onSaveSummary==='function'){const plan=appendPlan();if(!plan.text)return;let saved=false,reason='';if(plan.text.length>10000)reason='本次附加內容超過筆記 10,000 字上限。';else try{saved=onSaveSummary(plan.text)===true;}catch(e){reason=e?.message||String(e);}if(saved)d.cursor=plan.next;if(disposed)return;saveStatus=saved?'已附加到本課筆記；下次只附加新觀察與修訂。':`尚未保存。${reason||'儲存端未確認成功。'} 全文和保存位置保留，請先複製備存。`;draw();}}
  function input(event){if(disposed)return;for(const name of ['prediction','revision','next'])if(event.target===field(name)){current(d)[name]=event.target.value;saveStatus='';drawSummary();return;}}
  function change(event){if(disposed)return;const t=event.target;try{
    if(t===field('sd')){d.showSD=Boolean(t.checked);draw();return;}
    let next={...d};if(t===field('mode'))next.mode=t.value;else if(t===field('metric'))next.metricId=t.value;else if(t===field('a-atmosphere'))next.aAtmosphere=t.value;else if(t===field('b-atmosphere'))next.bAtmosphere=t.value;else if(t===field('atmosphere'))next.timeAtmosphere=t.value;else {const name=['day','a-day','b-day'].find(n=>t===field(n));if(!name)return;if(!/^\d+$/.test(t.value)||!DATA.days.includes(Number(t.value)))throw new RangeError('請選擇原研究的量測日期；不插值或外插。');next[{day:'day','a-day':'aDay','b-day':'bDay'}[name]]=Number(t.value);}switchCondition(settings(next));
  }catch(e){error=e.message;draw();}}
  function toggle(event){if(disposed||!event.target.open)return;if(event.target===field('details')){captureFirst('開啟定義前');d.detailsOpened=true;}else if(event.target===field('table-details')){captureFirst('開啟全表前');d.tableOpened=true;if(!d.revealedMetrics.includes(d.metricId))d.revealedMetrics.push(d.metricId);}else return;draw();}
  root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',change);root.addEventListener('toggle',toggle,true);draw();
  return ()=>{if(disposed)return;disposed=true;root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('toggle',toggle,true);};
}
