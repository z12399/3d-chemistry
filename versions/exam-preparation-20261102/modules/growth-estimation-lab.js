import {escapeHTML as esc} from './storage.js';
import {GROWTH_ESTIMATION_LAB_ID,GROWTH_ESTIMATION_VERSION,fitGrowthWindow,compareGrowthSeries} from './growth-estimation-model.js';
import {GROWTH_SERIES,GROWTH_LIMITS,GROWTH_ESTIMATION_SOURCES as SOURCES} from './growth-estimation-data.js';
export {GROWTH_ESTIMATION_LAB_ID} from './growth-estimation-model.js';

const drafts = new WeakMap();
const clone = value => structuredClone(value), signature = value => JSON.stringify(value);
const fmt = (value, digits=3) => value === null ? '不適用' : Number(value.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits});
const choices = {continue:'未用點也會大致沿直線',depart:'後期會偏離這條直線',unsure:'先保留判斷'};
const emptyWriting = () => ({choice:'',prediction:'',revision:'',limits:'',transfer:''});
const seriesById = id => GROWTH_SERIES.find(s => s.id === id);
const configKey = c => `${c.seriesId}/${c.startIndex}/${c.endIndex}`;
const fresh = () => ({config:{seriesId:'lp95-37c',startIndex:0,endIndex:2},runs:[],active:{},records:[],sources:[],seenPoints:[],savedWritings:[],cursor:{started:false,runs:{},records:0,sources:[]}});
const configText = c => {const s=seriesById(c.seriesId);return `${s.temperatureC} °C；擬合 ${s.points[c.startIndex].hours}–${s.points[c.endIndex].hours} h 的 ${c.endIndex-c.startIndex+1} 個刊載均值`;};
const writingText = w => `判斷：${choices[w.choice]||'未選'}\n理由：${w.prediction||'未填'}\n修訂：${w.revision||'未填'}\n證據限制：${w.limits||'未填'}\n有提示遷移練習：${w.transfer||'未填'}`;
const fitText = f => `等權 OLS：y = ${fmt(f.interceptLog10,6)} + ${fmt(f.slopeLog10PerHour,6)} t（y 按 log₁₀ 解讀，t 為 h）\nb=${fmt(f.slopeLog10PerHour,6)} log₁₀/h；μ_app=${fmt(f.apparentRatePerHour,6)} h⁻¹；條件倍增時間=${f.doublingHours===null?'無正倍增時間':fmt(f.doublingHours,6)+' h'}\n擬合 n=${f.n}；R²=${fmt(f.rSquared,6)}；RMSE=${fmt(f.rmseLog10,6)} log₁₀；殘差自由度=${f.residualDf}`;
const pointText = p => `${p.hours} h：刊載 log=${p.log10Mean.toFixed(2)} ± ${p.log10Sd.toFixed(2)}（${p.letter}）；直線值=${fmt(p.predictedLog10,6)}；e=觀測−直線=${fmt(p.residualLog10,6)} log₁₀`;
const preamble = () => `【豆乳生長資料的選窗估參數】${GROWTH_ESTIMATION_VERSION}\nLetizia et al. 2023，LP95 豆乳預試，Tables S1/S2。原表 log 未明示底數；本課按 log₁₀ 解讀。數字是刊載均值±SD，n=3 為同一初始材料的等分，非三個製造批次；逐等分值及先 log 或先平均的順序未知。\n僅做所選均值的描述性等權直線擬合，μ_app/g 為此解讀下的條件估計；不是 μ_max、生理 lag、單細胞代時或食品安全／保存期模型。同研究未用點與另一條件不構成獨立外部確效。\n來源：\n${SOURCES.map(s=>`${s.title}\n${s.url}`).join('\n')}`;
const settingsText = s => `視圖=${s.view==='count'?'菌量':'殘差'}；顯示=${s.basis==='log10'?'log₁₀':'換算 ln'}；圖段=0–${s.horizon} h；觀察時點索引=${s.pointIndex}`;
let sequence = 0;

function diagram(run, fit, prefix) {
  const {basis,view,horizon,pointIndex}=run.settings, factor=basis==='ln'?Math.LN10:1;
  const shown=fit.observations.filter(p=>(p.usedForFit||run.revealed)&&p.hours<=horizon);
  const left=58,right=586,top=38,bottom=196;
  let low=6.8*factor,high=9.8*factor;
  if(view==='residual'){
    const extent=Math.max(.1,...shown.map(p=>Math.abs(p.residualLog10)*factor));
    high=extent*1.18;low=-high;
  }
  const x=t=>left+(right-left)*t/horizon,y=v=>bottom-(bottom-top)*(v-low)/(high-low);
  const ticks=Array.from({length:5},(_,i)=>low+(high-low)*i/4);
  const times=horizon===9?[0,3,6,9]:[0,24,48,72];
  const bounds=`<clipPath id="${prefix}-plot"><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}"/></clipPath>`;
  const grid=ticks.map(t=>`<path d="M${left},${y(t)}H${right}" class="ge-grid"/><text x="${left-8}" y="${y(t)+5}" text-anchor="end">${fmt(t,view==='count'?1:2)}</text>`).join('');
  const timeTicks=times.map(t=>`<text x="${x(t)}" y="${bottom+25}" text-anchor="middle">${t}</text>`).join('');
  let line='';
  if(view==='count'){
    const yAt=t=>(fit.meanLog10+fit.slopeLog10PerHour*(t-fit.meanTime))*factor;
    line=`<path d="M${x(0)},${y(yAt(0))}L${x(horizon)},${y(yAt(horizon))}" class="ge-extension"/>`;
    const a=Math.max(0,fit.startHours),b=Math.min(horizon,fit.endHours);
    if(a<=b)line+=`<path d="M${x(a)},${y(yAt(a))}L${x(b)},${y(yAt(b))}" class="ge-line"/>`;
  }else line=`<path d="M${left},${y(0)}H${right}" class="ge-zero"/>`;
  const dots=shown.map(p=>{
    const i=fit.observations.findIndex(v=>v.id===p.id),v=(view==='count'?p.log10Mean:p.residualLog10)*factor;
    const error=view==='count'?`<path d="M${x(p.hours)},${y(v-p.log10Sd*factor)}V${y(v+p.log10Sd*factor)}" class="ge-error"/>`:'';
    const residualLine=view==='residual'?`<path d="M${x(p.hours)},${y(0)}V${y(v)}" class="ge-stem"/>`:'';
    return `<g class="${p.usedForFit?'ge-fitting':'ge-unused'}">${error}${residualLine}<circle cx="${x(p.hours)}" cy="${y(v)}" r="${i===pointIndex?7:5}" class="ge-dot"/><circle cx="${x(p.hours)}" cy="${y(v)}" r="13" class="ge-hit" role="button" tabindex="0" aria-label="查看 ${p.hours} 小時${p.usedForFit?'擬合':'未用'}點" data-ge-point="${i}"/></g>`;
  }).join('');
  const label=view==='count'?(basis==='ln'?'換算 ln（CFU/mL）':'刊載 log（按 log₁₀ 解讀）'):(basis==='ln'?'殘差：觀測 − 直線（ln）':'殘差：觀測 − 直線（log₁₀）');
  return `<svg viewBox="0 0 610 256" role="img" aria-label="${esc(label)}；時間 0 至 ${horizon} 小時；${shown.length} 個可見刊載均值點">${bounds}<text x="${left}" y="22">${label}</text>${grid}<path d="M${left},${top}V${bottom}H${right}" class="ge-axis"/>${timeTicks}<text x="${right}" y="247" text-anchor="end">時間（h）</text><g clip-path="url(#${prefix}-plot)">${line}${dots}</g></svg>`;
}

export function mountGrowthEstimationLab(root,id=GROWTH_ESTIMATION_LAB_ID,{draftOwner,onSaveSummary}={}) {
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  if(id!==GROWTH_ESTIMATION_LAB_ID)throw new RangeError('Unknown growth estimation activity');
  const owned=draftOwner&&typeof draftOwner==='object';
  if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,fresh());
  const d=owned?drafts.get(draftOwner):fresh(),prefix=`growth-estimate-${++sequence}`;
  const field=name=>root.querySelector(`[data-ge-${name}]`),action=name=>root.querySelector(`[data-ge-action="${name}"]`);
  let disposed=false,feedback='',saveStatus='';
  const calculate=r=>fitGrowthWindow(seriesById(r.config.seriesId).points,r.config.startIndex,r.config.endIndex);
  function createRun(config){
    if(d.runs.length>=96)return null;
    const r={id:d.runs.length+1,config:clone(config),writing:emptyWriting(),first:null,revealed:false,comparisons:[],events:[],settings:{view:'count',basis:'log10',horizon:config.endIndex>3?72:9,pointIndex:Math.min(config.endIndex+1,7),compareId:config.seriesId==='lp95-20c'?'lp95-37c':'lp95-20c'}};
    d.runs.push(r);d.active[configKey(config)]=r.id;return r;
  }
  const run=()=>d.runs.find(r=>r.id===d.active[configKey(d.config)])||createRun(d.config);
  function remember(points){for(const p of points)if(!d.seenPoints.includes(p.id))d.seenPoints.push(p.id);}
  function freezeFirst(trigger){const r=run();if(!r.first)r.first=clone({runId:r.id,trigger,config:r.config,writing:r.writing,fit:calculate(r),settings:r.settings,seenPoints:d.seenPoints,sources:d.sources});return r.first;}
  function firstText(f){return `第 ${f.runId} 輪首次揭示／記錄前（${f.trigger}）\n${configText(f.config)}\n${fitText(f.fit)}\n${settingsText(f.settings)}\n${writingText(f.writing)}\n此前納入擬合／揭示的點：${f.seenPoints.join('、')||'無'}\n此前開啟來源：${f.sources.join('、')||'無'}（開啟不等於已讀）\n頁面已顯示選窗資料與擬合結果，不主張盲測；未用於擬合也不等於從未看過。`;}
  function eventText(e){return `操作 ${e.index}｜${e.label}\n${e.text}`;}
  function recordText(r,i){return `觀察 ${i+1}｜第 ${r.runId} 輪，${r.eventIndex} 次揭示／比較後\n${configText(r.config)}\n${fitText(r.fit)}\n${settingsText(r.settings)}\n${r.pointText}\n${r.revealed?`其餘 ${r.fit.excludedCount} 點已揭示；未用點 RMSE=${fmt(r.fit.excludedRmseLog10,6)} log₁₀（同研究內）`:'其餘點尚未在本輪揭示'}\n${writingText(r.writing)}`;}
  function fullText(){
    const used=d.runs.filter(r=>r.first||r.events.length||Object.values(r.writing).some(Boolean)||d.savedWritings.some(v=>v.runId===r.id));
    if(!used.length&&!d.sources.length)return '';
    return [preamble(),...used.flatMap(r=>[`第 ${r.id} 輪｜${configText(r.config)}`,r.first?firstText(r.first):'尚未揭示或記錄；以下文字仍為目前草稿。',...r.events.map(eventText),...d.savedWritings.filter(v=>v.runId===r.id).map((v,i)=>`已保存文字 ${i+1}（${v.eventIndex} 次揭示／比較後）\n${settingsText(v.settings)}\n${writingText(v.writing)}`),`目前文字：\n${writingText(r.writing)}`]),...d.records.map(recordText),`已開啟來源（不代表已讀）：${d.sources.join('、')||'無'}`].join('\n\n');
  }
  function appendPlan(){
    const next=clone(d.cursor),parts=[],writingSnapshots=[];
    for(const r of d.runs){
      const previous=next.runs[r.id]||{first:false,events:0,writing:''},written=signature(r.writing),hasWriting=Object.values(r.writing).some(Boolean);
      if(!r.first&&!r.events.length&&!hasWriting&&!next.runs[r.id])continue;
      if(!next.runs[r.id])parts.push(`第 ${r.id} 輪｜${configText(r.config)}\n${fitText(calculate(r))}`);
      if(r.first&&!previous.first)parts.push(firstText(r.first));
      if(r.events.length>previous.events)parts.push(...r.events.slice(previous.events).map(eventText));
      if(written!==previous.writing&&(hasWriting||previous.writing)){
        parts.push(`第 ${r.id} 輪目前文字（${r.events.length} 次揭示／比較後）\n${settingsText(r.settings)}\n${writingText(r.writing)}`);
        writingSnapshots.push({runId:r.id,eventIndex:r.events.length,settings:clone(r.settings),writing:clone(r.writing)});
      }
      next.runs[r.id]={first:!!r.first,events:r.events.length,writing:written};
    }
    if(d.records.length>next.records)parts.push(...d.records.slice(next.records).map((r,i)=>recordText(r,next.records+i)));
    next.records=d.records.length;
    const added=d.sources.filter(id=>!next.sources.includes(id));if(added.length)parts.push(`新開啟來源（不代表已讀）：${added.join('、')}`);next.sources=[...d.sources];
    if(!parts.length)return {text:'',next,writingSnapshots:[]};
    if(!next.started){parts.unshift(preamble());next.started=true;}
    return {text:parts.join('\n\n'),next,writingSnapshots};
  }
  const times=GROWTH_SERIES[0].points;
  root.innerHTML=`<section class="growth-estimation-lab" aria-labelledby="${prefix}-title"><h2 class="ge-sr-only" id="${prefix}-title">豆乳生長資料的選窗估參數</h2>
  <div class="ge-toolbar"><label for="${prefix}-series">研究條件<select id="${prefix}-series" data-ge-series>${GROWTH_SERIES.map(s=>`<option value="${s.id}">${s.temperatureC} °C</option>`).join('')}</select></label><label for="${prefix}-start">擬合起點<select id="${prefix}-start" data-ge-start>${times.slice(0,-1).map((p,i)=>`<option value="${i}">${p.hours} h</option>`).join('')}</select></label><label for="${prefix}-end">擬合終點<select id="${prefix}-end" data-ge-end>${times.slice(1).map((p,i)=>`<option value="${i+1}">${p.hours} h</option>`).join('')}</select></label><button type="button" data-ge-action="new">新一輪（保留本輪）</button></div>
  <p class="ge-scope">LP95 豆乳預試 · 刊載均值 ± SD，n=3 等分。原表 log 未明示底數；本課按 log₁₀ 解讀。</p>
  <div class="ge-workspace"><div class="ge-chart-area"><div class="ge-chart-tools"><div role="group" aria-label="圖表內容"><button type="button" data-ge-view="count">菌量</button><button type="button" data-ge-view="residual">殘差</button></div><label for="${prefix}-horizon">圖段<select id="${prefix}-horizon" data-ge-horizon><option value="9">0–9 h</option><option value="72">0–72 h</option></select></label><label for="${prefix}-basis">顯示<select id="${prefix}-basis" data-ge-basis><option value="log10">log₁₀</option><option value="ln">換算 ln</option></select></label></div><div class="ge-figure" data-ge-chart></div><p class="ge-legend"><span>● 擬合點</span><span>○ 未用點</span><span data-ge-chart-note></span></p></div>
  <div class="ge-results"><div class="ge-double"><span>條件倍增時間</span><strong data-ge-doubling></strong></div><dl data-ge-results></dl><label for="${prefix}-point">觀察時點<select id="${prefix}-point" data-ge-point-select>${times.map((p,i)=>`<option value="${i}">${p.hours} h</option>`).join('')}</select></label><p class="ge-selected" data-ge-selected></p><div class="ge-action-row"><button type="button" data-ge-action="reveal">揭示未用點</button><button type="button" data-ge-action="record">記錄觀察</button><span data-ge-record-count></span></div></div></div>
  <p class="ge-result-note" data-ge-result-note></p><p class="ge-feedback" role="status" data-ge-feedback></p>
  <details><summary>我的預測、依據與修訂</summary><p>主圖先顯示所選點與擬合結果。第一次揭示其餘點、開啟原表或記錄前，會保留原預測及此前看過的點；不主張盲測。</p><div class="ge-choices" role="group" aria-label="外推的初步判斷">${Object.entries(choices).map(([key,value])=>`<button type="button" data-ge-choice="${key}">${value}</button>`).join('')}</div><label for="${prefix}-prediction">我的理由<textarea id="${prefix}-prediction" rows="2" maxlength="800" data-ge-prediction></textarea></label><label for="${prefix}-revision">看過資料後的修訂<textarea id="${prefix}-revision" rows="2" maxlength="1200" data-ge-revision></textarea></label><label for="${prefix}-limits">還缺哪些驗證證據？<textarea id="${prefix}-limits" rows="2" maxlength="800" data-ge-limits></textarea></label><button type="button" data-ge-action="record-writing">記錄文字與目前結果</button><pre data-ge-first></pre></details>
  <details><summary>保留這條線，換另一研究條件比較</summary><p>固定目前係數，直接與另一溫度的刊載點比較。這不是溫度模型，也沒有因起始菌量不同而自動平移；誤差同時包含起點與形狀差異。資料仍來自同一篇研究，不能稱獨立外部確效。</p><label for="${prefix}-compare">比較條件<select id="${prefix}-compare" data-ge-compare>${GROWTH_SERIES.map(s=>`<option value="${s.id}">${s.temperatureC} °C</option>`).join('')}</select></label><button type="button" data-ge-action="compare">揭示這組比較</button><div data-ge-comparison></div></details>
  <details data-ge-table-disclosure><summary data-ge-disclosure="table">原表、選窗與同時段 pH</summary><p>開啟本區會揭示本條件所有 S1/S2 值並保留原預測。均值／SD／字母是原表值；字母只比較同一時間的不同溫度，不能跨時間解讀。pH 共變不是獨立因果或酸產量證據。</p><div class="ge-table-wrap" data-ge-table></div><p>n=3 是同一初始豆乳材料的三份等分，非三個製造批次。原文未明示 log／平均的先後；不反算原始 CFU 的算術平均。方法所述 10⁶ CFU/mL 接種量與 S1 起始 7.29–7.32 log CFU/mL 有未解矛盾，兩者保留，擬合只用原表值。</p></details>
  <details><summary>公式、資料身分與適用範圍</summary><p>令 y 為按十進位解讀的刊載 log 均值，t 為 h。等權 OLS：b=Σ[(t−t̄)(y−ȳ)]/Σ(t−t̄)²，a=ȳ−bt̄，ŷ=a+bt。μ_app=ln(10)b；b&gt;0 時 g=log₁₀(2)/b=ln(2)/μ_app。換成 ln 顯示時，y、SD、斜率、殘差與 RMSE 同乘 ln(10)，g 不變。</p><p>e=觀測−直線。顯示 RMSE=√[Σe²/n]，不是以 n−2 作分母的殘差標準差。R²=1−SSE/SST；所選值完全相同時 SST=0，R² 不適用。只有兩點時必能穿過兩點，不能靠 R²=1 或零殘差確認模型。非正斜率不報正倍增時間。</p><ul>${GROWTH_LIMITS.map(text=>`<li>${esc(text)}</li>`).join('')}</ul></details>
  <details><summary>換條件，沿提示推理</summary><p>若 0–6 h 的 R² 很高，把同一條線延伸到 72 h 是否可靠？再選 24–72 h：倍增時間若很大或不適用，能否解釋為細胞完全不分裂？說明 CFU 淨變化、未知重複結構與真正外部驗證之間的差別。</p><label for="${prefix}-transfer">我的推理<textarea id="${prefix}-transfer" rows="3" maxlength="1200" data-ge-transfer></textarea></label></details>
  <details><summary>完整來源與核對位置（${SOURCES.length} 項）</summary><ol>${SOURCES.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-ge-source="${s.id}">${esc(s.title)}</a><p>${esc(s.locator)}</p><p>${esc(s.note)}</p></li>`).join('')}</ol><p>本課改編 Letizia 等（2023）CC BY 4.0 刊載表格，新增選窗計算與教學判讀。原數字未改；完整來源副本與核對紀錄隨專案保留。</p></details>
  <details><summary>已記錄的觀察與揭示過程</summary><p>最多保留 24 份觀察與 96 輪；滿額不覆寫。切換條件／區間保留各自工作階段草稿，新一輪保留舊輪。</p><div data-ge-records></div><div data-ge-history></div></details>
  <details><summary>保存到筆記／複製摘要</summary><p>只附加新觀察、揭示與文字變更；失敗或容量不足時不截斷、不前移保存位置。</p><label for="${prefix}-append">本次要附加的內容<textarea readonly id="${prefix}-append" rows="6" data-ge-append></textarea></label><button type="button" data-ge-action="save">附加到本課筆記</button><p role="status" data-ge-save-status></p><label for="${prefix}-summary">完整摘要<textarea readonly id="${prefix}-summary" rows="8" data-ge-summary></textarea></label><button type="button" data-ge-action="copy">選取完整摘要</button></details></section>`;
  action('save').hidden=typeof onSaveSummary!=='function';run();

  function syncWriting(){for(const name of ['prediction','revision','limits','transfer'])field(name).value=run().writing[name];}
  function drawSummary(){if(disposed)return;const plan=appendPlan();field('summary').value=fullText();field('append').value=plan.text;field('save-status').textContent=saveStatus;action('save').disabled=!plan.text;}
  function currentPointText(r,fit){const p=fit.observations[r.settings.pointIndex];return p.usedForFit||r.revealed?pointText(p):`${p.hours} h：直線延伸 ${fmt(p.predictedLog10,6)}（log₁₀）；原表值本輪尚未揭示`;}
  function draw(){
    if(disposed)return;
    const r=run(),fit=calculate(r),s=seriesById(r.config.seriesId),factor=r.settings.basis==='ln'?Math.LN10:1,unit=r.settings.basis==='ln'?'ln':'log₁₀';
    remember(fit.observations.filter(p=>p.usedForFit||r.revealed));
    field('series').value=r.config.seriesId;field('start').value=String(r.config.startIndex);field('end').value=String(r.config.endIndex);field('basis').value=r.settings.basis;field('horizon').value=String(r.settings.horizon);field('point-select').value=String(r.settings.pointIndex);field('compare').value=r.settings.compareId;
    root.querySelectorAll('[data-ge-view]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.geView===r.settings.view)));
    root.querySelectorAll('[data-ge-choice]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.geChoice===r.writing.choice)));
    field('chart').innerHTML=diagram(r,fit,prefix);
    const visible=fit.observations.filter(p=>p.hours<=r.settings.horizon&&(p.usedForFit||r.revealed));
    const outside=r.settings.view==='count'&&[0,r.settings.horizon].some(t=>{const y=fit.meanLog10+fit.slopeLog10PerHour*(t-fit.meanTime);return y<6.8||y>9.8;});
    field('chart-note').textContent=`${r.settings.view==='count'?'線段：實線擬合範圍，虛線延伸；誤差棒為原表 SD':'直線為零殘差；未用點須揭示才出現'}${outside?'；線超出圖界，讀值仍完整':''}。顯示 ${visible.length} 點。`;
    field('doubling').textContent=fit.doublingHours===null?'無正倍增時間':`${fmt(fit.doublingHours,3)} h`;
    field('results').innerHTML=[['選窗斜率 b',`${fmt(fit.slopeLog10PerHour*factor,4)} ${unit}/h`],['μ_app（按十進位解讀）',`${fmt(fit.apparentRatePerHour,4)} h⁻¹`],['擬合 RMSE',`${fmt(fit.rmseLog10*factor,4)} ${unit}`],['R² / 擬合點數',`${fmt(fit.rSquared,4)} / ${fit.n}`]].map(([name,value])=>`<div><dt>${name}</dt><dd>${value}</dd></div>`).join('');
    const p=fit.observations[r.settings.pointIndex],known=p.usedForFit||r.revealed;
    field('selected').textContent=`${p.hours} h｜直線 ${fmt(p.predictedLog10*factor)} ${unit}${known?`；原表${r.settings.basis==='ln'?'換算':''} ${fmt(p.log10Mean*factor)}；e ${fmt(p.residualLog10*factor)}`:'；其餘值尚未揭示'}${p.hours>r.settings.horizon?'（此點在目前圖段之外）':''}`;
    action('reveal').disabled=r.revealed||fit.excludedCount===0;
    action('reveal').textContent=r.revealed?'未用點已揭示':fit.excludedCount?'揭示未用點':'全部已用';
    field('record-count').textContent=`${d.records.length} / 24`;
    field('result-note').textContent=(fit.n===2?'僅兩點，零殘差不能支持模型可靠。':fit.doublingHours===null?'本選窗斜率非正，不能給正倍增時間。':'局部表觀估計；不是最大生長率或單細胞代時。')+(r.revealed&&fit.excludedCount?` 未用 ${fit.excludedCount} 點 RMSE ${fmt(fit.excludedRmseLog10*factor,3)} ${unit}；同研究內比較。`:'');
    field('feedback').textContent=feedback;
    field('first').textContent=r.first?firstText(r.first):'本輪尚未揭示其餘點或記錄；原預測仍可修改。';
    field('table').innerHTML=`<table><caption>${s.temperatureC} °C；S1 菌量與 S2 pH 的刊載均值 ± SD（字母）</caption><thead><tr><th>h</th><th>log CFU/mL</th><th>pH</th><th>擬合</th></tr></thead><tbody>${fit.observations.map(p=>`<tr><th>${p.hours}</th><td>${p.usedForFit||r.revealed?`${p.log10Mean.toFixed(2)} ± ${p.log10Sd.toFixed(2)} (${p.letter})`:'尚未揭示'}</td><td>${r.revealed?`${p.pHMean.toFixed(2)} ± ${p.pHSd.toFixed(2)} (${p.pHLetter})`:'開啟原表揭示'}</td><td>${p.usedForFit?'已用':'未用'}</td></tr>`).join('')}</tbody></table>`;
    const compared=r.comparisons.includes(r.settings.compareId);
    action('compare').disabled=compared||r.settings.compareId===r.config.seriesId;
    if(r.settings.compareId===r.config.seriesId)field('comparison').textContent='請選不同研究條件；本條件的未用點請用主圖揭示。';
    else if(compared){const comparison=compareGrowthSeries(fit,seriesById(r.settings.compareId).points);field('comparison').innerHTML=`<p>保持 ${configText(r.config)} 的係數，對照 ${seriesById(r.settings.compareId).temperatureC} °C：RMSE ${fmt(comparison.rmseLog10,4)} log₁₀（全部 8 點）。不是溫度校正後或獨立批次的預測驗證。</p><pre>${esc(comparison.observations.map(pointText).join('\n'))}</pre>`;}
    else field('comparison').textContent='尚未在本輪揭示這組比較。';
    field('records').innerHTML=d.records.length?d.records.map((v,i)=>`<article><pre>${esc(recordText(v,i))}</pre></article>`).join(''):'<p>尚未記錄觀察。</p>';
    field('history').innerHTML=d.runs.filter(r=>r.events.length).map(r=>`<details><summary>第 ${r.id} 輪｜${configText(r.config)}</summary><pre>${esc(r.events.map(eventText).join('\n\n'))}</pre></details>`).join('');
    drawSummary();
  }
  function reveal(trigger='揭示未用點'){
    const r=run();if(r.revealed)return;
    freezeFirst(trigger);const fit=calculate(r);r.revealed=true;
    r.events.push({index:r.events.length+1,label:trigger,text:`${configText(r.config)}\n${fit.observations.filter(p=>!p.usedForFit).map(pointText).join('\n')||'所有點已參與擬合。'}\n未用點 RMSE=${fmt(fit.excludedRmseLog10,6)} log₁₀；同研究內描述比較。`});
    remember(fit.observations);feedback='已保留揭示前預測。未用於擬合不等於獨立外部驗證。';saveStatus='';draw();
  }
  function record(){
    if(d.records.length>=24){feedback='已保留 24 份觀察；請保存或複製，原紀錄不會覆寫。';draw();return;}
    const r=run();freezeFirst('記錄觀察');const fit=calculate(r);
    const value=clone({version:GROWTH_ESTIMATION_VERSION,runId:r.id,eventIndex:r.events.length,config:r.config,settings:r.settings,fit,pointText:currentPointText(r,fit),revealed:r.revealed,comparisons:r.comparisons,writing:r.writing,first:r.first});
    if(d.records.some(v=>signature(v)===signature(value)))feedback='這份條件、結果與文字已記錄。';
    else{d.records.push(value);feedback=`已保留第 ${d.records.length} 份觀察。`;saveStatus='';}
    draw();
  }
  function switchConfig(config){
    if(!d.active[configKey(config)]&&d.runs.length>=96){feedback='已保留 96 輪；原紀錄不變，請保存或複製。';draw();return;}
    d.config=config;run();feedback='';saveStatus='';syncWriting();draw();
    if(field('table-disclosure').open)reveal('切換至已開啟原表');
  }
  function click(event){
    if(disposed)return;
    const source=event.target.closest?.('[data-ge-source]');
    if(source&&root.contains(source)&&SOURCES.some(s=>s.id===source.dataset.geSource)){
      if(!d.sources.includes(source.dataset.geSource))d.sources.push(source.dataset.geSource);saveStatus='';drawSummary();return;
    }
    const point=event.target.closest?.('[data-ge-point]');
    if(point&&root.contains(point)){const i=Number(point.dataset.gePoint);if(Number.isInteger(i)&&i>=0&&i<8){run().settings.pointIndex=i;draw();}return;}
    const button=event.target.closest?.('button');if(!button||!root.contains(button)||button.disabled)return;
    const r=run();
    if(['count','residual'].includes(button.dataset.geView)){r.settings.view=button.dataset.geView;draw();return;}
    if(Object.hasOwn(choices,button.dataset.geChoice)){r.writing.choice=button.dataset.geChoice;saveStatus='';draw();return;}
    const name=button.dataset.geAction;
    if(name==='reveal')reveal();
    else if(name==='record'||name==='record-writing')record();
    else if(name==='new'){
      if(d.runs.length>=96){feedback='已保留 96 輪；原紀錄不變，請保存或複製。';draw();return;}
      createRun(d.config);feedback='已開始新一輪；上一輪與此前已看過的資料保留。';saveStatus='';syncWriting();draw();
      if(field('table-disclosure').open)reveal('新一輪時原表已開啟');
    }else if(name==='compare'){
      if(r.settings.compareId===r.config.seriesId||r.comparisons.includes(r.settings.compareId))return;
      freezeFirst('揭示另一研究條件');const s=seriesById(r.settings.compareId),comparison=compareGrowthSeries(calculate(r),s.points);
      r.comparisons.push(s.id);r.events.push({index:r.events.length+1,label:`固定係數比較 ${s.temperatureC} °C`,text:`${configText(r.config)}\n${comparison.observations.map(pointText).join('\n')}\nRMSE=${fmt(comparison.rmseLog10,6)} log₁₀；未校正起始差異，非外部批次驗證。`});
      remember(s.points);saveStatus='';feedback='已保留這組比較；固定係數不是溫度預測模型。';draw();
    }else if(name==='copy'){
      field('summary').focus();field('summary').select();saveStatus='已選取完整摘要，按 Ctrl+C 複製。';drawSummary();
    }else if(name==='save'&&typeof onSaveSummary==='function'){
      const plan=appendPlan();if(!plan.text)return;
      let saved=false,reason='';
      if(plan.text.length>10000)reason='本次內容超過筆記 10,000 字上限。';
      else try{saved=onSaveSummary(plan.text)===true;}catch(error){reason=error?.message||String(error);}
      if(saved){d.cursor=plan.next;d.savedWritings.push(...plan.writingSnapshots);}
      if(disposed)return;
      saveStatus=saved?'已附加本次內容；後續只保存新增觀察、揭示與文字。':`尚未保存。${reason||'儲存端未確認成功。'} 內容未截斷，保存位置未前移；請先複製保留。`;draw();
    }
  }
  function change(event){
    if(disposed)return;const r=run(),value=event.target.value;
    if(event.target===field('series')&&seriesById(value)){switchConfig({...r.config,seriesId:value});return;}
    if(event.target===field('start')||event.target===field('end')){
      if(!String(value).trim())return;
      const key=event.target===field('start')?'startIndex':'endIndex',index=Number(value),config={...r.config,[key]:index};
      if(!Number.isInteger(index)||index<0||index>7||config.startIndex>=config.endIndex){feedback='終點需晚於起點；至少選兩個刊載時點。原區間保留。';draw();return;}
      switchConfig(config);return;
    }
    if(event.target===field('basis')&&['log10','ln'].includes(value))r.settings.basis=value;
    else if(event.target===field('horizon')&&['9','72'].includes(value))r.settings.horizon=Number(value);
    else if(event.target===field('point-select')&&String(value).trim()&&Number.isInteger(Number(value))&&Number(value)>=0&&Number(value)<8)r.settings.pointIndex=Number(value);
    else if(event.target===field('compare')&&seriesById(value))r.settings.compareId=value;
    else return;
    feedback='';draw();
  }
  function input(event){if(disposed)return;for(const [name,max] of [['prediction',800],['revision',1200],['limits',800],['transfer',1200]])if(event.target===field(name)){run().writing[name]=event.target.value.slice(0,max);saveStatus='';drawSummary();return;}}
  function toggle(event){if(!disposed&&event.target===field('table-disclosure')&&event.target.open)reveal('開啟完整原表與 pH');}
  function keydown(event){const point=event.target.closest?.('[data-ge-point]');if(!disposed&&point&&root.contains(point)&&['Enter',' '].includes(event.key)){event.preventDefault();click(event);}}
  syncWriting();root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',change);root.addEventListener('toggle',toggle,true);root.addEventListener('keydown',keydown);draw();
  return()=>{if(disposed)return;disposed=true;root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('toggle',toggle,true);root.removeEventListener('keydown',keydown);};
}
