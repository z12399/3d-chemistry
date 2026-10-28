import {escapeHTML as esc} from './storage.js';
import {FREEZE_COLLAPSE_DATA as DATA} from './freeze-collapse-data.js';
import {evaluateFreezeCollapse} from './freeze-collapse-model.js';

export const FREEZE_COLLAPSE_LAB_ID='freeze-drying-collapse';
export const FREEZE_COLLAPSE_SOURCES=DATA.sources;
const drafts=new WeakMap();let sequence=0;
const copy=value=>structuredClone(value);
const VIEWS={drying:'壓力與產品溫度',structure:'退火與結構'};
const HEADER='冷凍乾燥崩塌觀察｜兩篇研究分開判讀，只比較原研究條件，不插值。產品溫度、架板設定、Tc 與 Tg′ 有各自材料與方法；未見宏觀崩塌不代表沒有微觀變化。首次保留不是盲測。';
const fresh=()=>({view:'drying',seriesId:'pressure',dryingCaseId:DATA.drying.cases[0].id,structureCaseId:DATA.structure.cases[0].id,cases:{},observations:[],seenCases:[],sources:[],tableOpened:false,detailsOpened:false,cursor:{started:false,first:[],results:{},writing:{},observations:0,seenCases:[],sources:[],table:false,details:false}});
const parameters=d=>d.view==='drying'?{view:d.view,seriesId:d.seriesId,caseId:d.dryingCaseId}:{view:d.view,caseId:d.structureCaseId};
const key=p=>JSON.stringify(p);
const current=d=>d.cases[key(parameters(d))]??={parameters:parameters(d),prediction:'',revision:'',next:'',first:null,revealed:false};
const rowFor=p=>DATA[p.view].cases.find(row=>row.id===p.caseId);
const seriesFor=id=>DATA.drying.series.find(series=>series.id===id);
const rowsFor=p=>p.view==='drying'?seriesFor(p.seriesId).caseIds.map(id=>DATA.drying.cases.find(row=>row.id===id)):DATA.structure.cases;
const resultFor=p=>evaluateFreezeCollapse(DATA,p);
const writing=c=>({prediction:c.prediction,revision:c.revision,next:c.next});
const writingText=w=>`初判／理由：${w.prediction||'未填'}\n觀察後修訂：${w.revision||'未填'}\n下一項證據：${w.next||'未填'}`;
const meanSD=value=>`${value.meanText??Number(value.mean).toFixed(1)} ± ${value.sdText??Number(value.sd).toFixed(1)}`;
const thicknessText=row=>row.thickness.text.includes(row.thickness.method)?row.thickness.text:`${row.thickness.text}（${row.thickness.method}）`;
const conditionText=p=>`${VIEWS[p.view]}｜${p.view==='drying'?seriesFor(p.seriesId).label+'｜':''}${rowFor(p).label}`;
const sourceText=()=>DATA.sources.map(s=>`${s.title}\n${s.publisher}｜${s.locator}\n${s.url}`).join('\n');
function resultText(p){const row=rowFor(p);return p.view==='drying'?`${conditionText(p)}\nKodama 2014，Table 2 實測欄｜${DATA.drying.material}\n邊緣瓶最大產品溫度：${meanSD(row.temperature)} °C；中心瓶一次乾燥時間：${meanSD(row.hours)} h。均值 ± SD，n 未報；兩項來自不同位置。\n同配方 FDM 的 Tc onset = −31.5°C；Table 2 未逐列報告崩塌結局，不據此標記安全或算崩塌率。`:`${conditionText(p)}\nPalmkron 2024，Fig. 1／Table III｜${DATA.structure.material}\n巨觀外觀：${row.macro.text}\n表 III 厚度欄報值：${row.thickness.text}；${row.thickness.method}\n未見宏觀崩塌不等於沒有微觀變化；SEM／μCT 只選外觀完整顆粒。批次與預停留不同，不能單歸因退火。`;}
function dryingChart(p,prefix){
  const rows=rowsFor(p),pressure=p.seriesId==='pressure',x=i=>64+i*112;
  const plots=[{field:'temperature',title:'邊緣瓶最大產品溫度（°C）',min:-35,max:-31,ticks:[-35,-34,-33,-32,-31],color:'fc-point',error:'fc-errorbar'},
    {field:'hours',title:'中心瓶一次乾燥時間（h）',min:20,max:42,ticks:[20,25,30,35,40],color:'fc-time-point',error:'fc-time-errorbar'}];
  return `<div class="fc-plot-grid">${plots.map((plot,index)=>{const y=value=>195-(value-plot.min)/(plot.max-plot.min)*156;
    return `<figure class="fc-plot"><p>${plot.title}</p><svg viewBox="0 0 350 238" role="img" aria-labelledby="${prefix}-plot-${index}"><title id="${prefix}-plot-${index}">${plot.title}，離散均值正負一個 SD；圈選目前條件</title>${plot.ticks.map(t=>`<path class="fc-grid" d="M44,${y(t)}H323"/><text x="35" y="${y(t)+5}" text-anchor="end">${t}</text>`).join('')}${plot.field==='temperature'?`<path class="fc-reference" d="M44,${y(-31.5)}H323"/><text x="321" y="${y(-31.5)-6}" text-anchor="end" class="fc-reference-label">FDM Tc 參考 −31.5°C</text>`:''}${rows.map((row,i)=>{const v=row[plot.field],cx=x(i),cy=y(v.mean);return `<path class="${plot.error}" d="M${cx},${y(v.mean-v.sd)}V${y(v.mean+v.sd)}M${cx-4},${y(v.mean-v.sd)}h8M${cx-4},${y(v.mean+v.sd)}h8"/><circle class="${plot.color}" cx="${cx}" cy="${cy}" r="5"/>${row.id===p.caseId?`<circle class="fc-selected" cx="${cx}" cy="${cy}" r="10"/>`:''}<text x="${cx}" y="222" text-anchor="middle">${pressure?row.pressurePa:row.shelfC}</text>`;}).join('')}</svg><figcaption>${pressure?'腔壓 Pc（Pa）· 架板固定 −20°C':'架板 Ts（°C）· 腔壓固定 5 Pa'}</figcaption></figure>`;}).join('')}</div>`;
}
function structureBoard(p){return `<p class="fc-context">原文六組結果整理 · 每格是處理與批次，並非六顆獨立樣本</p><div class="fc-structure-board">${DATA.structure.cases.map(row=>`<div class="fc-structure-cell" data-selected="${row.id===p.caseId}"><strong>${esc(row.label)}</strong><span class="fc-outcome">${esc(row.macro.text)}</span><p>厚度：${esc(row.thickness.text)}<br><span class="fc-context">${esc(row.thickness.method)}</span></p></div>`).join('')}</div>`;}
function structureFigure(p){
  const figure=DATA.structure.figure;if(!figure)return structureBoard(p);
  // UI selection rectangles locate panels only; no scientific values come from pixels.
  const index=figure.caseIds.indexOf(p.caseId),column=index%2,row=Math.floor(index/2),left=[207,488][column]/749*100,top=[37,311,583][row]/847*100;
  return `<figure class="fc-photo"><div class="fc-photo-image"><img src="${esc(figure.src)}" width="749" height="847" alt="Palmkron 2024 原始圖 1：三種退火處理 × 兩個批次的完整六格凍乾顆粒；未退火 Batch 2 標有崩塌 C 和外觀完整 P。"><span class="fc-photo-frame" style="left:${left}%;top:${top}%;width:${263/749*100}%;height:${262/847*100}%" aria-hidden="true"></span></div><figcaption>綠框：${esc(rowFor(p).label)} · 原圖六格同時顯示<br>圖 1 · <a href="https://doi.org/10.1007/s11095-024-03751-w" target="_blank" rel="noopener noreferrer" data-fc-source="${esc(figure.sourceId)}">Palmkron et al.（2024）</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>；© 作者 2024。NLM 所提供的 JPEG 在本站未裁剪或重新編碼；綠框為介面標示。來源：NLM PMC Article Datasets，2026-10-12。<a href="${esc(figure.src)}" target="_blank" rel="noopener noreferrer" data-fc-source="${esc(figure.sourceId)}">另開完整原圖</a></figcaption></figure>`;
}

/** The host owns durable notes; temporary observations belong to this lesson and owner. */
export function mountFreezeCollapseLab(root,id=FREEZE_COLLAPSE_LAB_ID,{draftOwner,draftKey='proc-freeze-drying-collapse',onSaveSummary}={}){
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  if(id!==FREEZE_COLLAPSE_LAB_ID)throw new RangeError('Unknown freeze drying activity');
  const owned=draftOwner&&typeof draftOwner==='object';if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,new Map());
  const board=owned?drafts.get(draftOwner):new Map();if(!board.has(draftKey))board.set(draftKey,fresh());
  const d=board.get(draftKey),prefix=`freeze-collapse-${++sequence}`,field=name=>root.querySelector(`[data-fc-${name}]`),action=name=>root.querySelector(`[data-fc-action="${name}"]`);
  let disposed=false,feedback='',error='',saveStatus='';current(d);
  root.innerHTML=`<section class="freeze-collapse-lab" aria-labelledby="${prefix}-title"><h2 class="fc-sr-only" id="${prefix}-title">冷凍乾燥為什麼會崩塌？</h2>
    <div class="fc-toolbar"><div class="fc-views" role="group" aria-label="選擇實驗">${Object.entries(VIEWS).map(([id,label])=>`<button type="button" data-fc-view="${id}">${label}</button>`).join('')}</div></div>
    <div class="fc-controls"><label for="${prefix}-series" data-fc-series-label>比較方式<select id="${prefix}-series" data-fc-series>${DATA.drying.series.map(s=>`<option value="${esc(s.id)}">${esc(s.label)}</option>`).join('')}</select></label><label for="${prefix}-case">目前條件<select id="${prefix}-case" data-fc-case></select></label><div class="fc-actions"><button type="button" data-fc-action="reveal">顯示資料</button><button type="button" data-fc-action="record">記下觀察</button></div></div>
    <p class="fc-scope" data-fc-scope></p><div class="fc-display" data-fc-display><div class="fc-result" aria-live="polite" data-fc-result></div><div class="fc-chart" data-fc-chart></div></div><p class="fc-caption" data-fc-caption></p>
    <p class="fc-feedback" role="status" data-fc-feedback></p><p class="fc-error" role="status" data-fc-error></p>
    <details><summary>我的初判、修訂與下一項證據</summary><p data-fc-question></p><label for="${prefix}-prediction">初判與理由<textarea id="${prefix}-prediction" rows="2" data-fc-prediction></textarea></label><p class="fc-context" data-fc-first></p><label for="${prefix}-revision">觀察後的修訂<textarea id="${prefix}-revision" rows="2" data-fc-revision></textarea></label><label for="${prefix}-next">下一項需要的證據<textarea id="${prefix}-next" rows="2" data-fc-next></textarea></label><button type="button" data-fc-action="record-writing">記錄這次文字</button></details>
    <details data-fc-records-details><summary>已記錄的觀察 <span data-fc-count></span></summary><div data-fc-records></div></details>
    <details data-fc-summary-details><summary>檢查並保存摘要</summary><label for="${prefix}-summary">完整摘要<textarea id="${prefix}-summary" readonly rows="7" data-fc-summary></textarea></label><button type="button" data-fc-action="copy">選取完整摘要</button><label for="${prefix}-append">本次附加內容<textarea id="${prefix}-append" readonly rows="5" data-fc-append></textarea></label><button type="button" data-fc-action="save" ${typeof onSaveSummary!=='function'?'hidden':''}>附加到本課筆記</button><p role="status" data-fc-save-status></p><p class="fc-context">課內返回可接續草稿；重新整理前請保存或複製。只有保存成功才推進，內容不截斷。</p></details>
    <details data-fc-table-details><summary>原表數值與量測條件</summary><div data-fc-table></div></details>
    <details data-fc-details><summary>崩塌原理、改善取捨與來源</summary>
      <div class="fc-principles"><div><strong>先分清四個溫度</strong><p>Ts 是架板設定，Tp 是指定位置的產品溫度。Tg′ 是最大凍結濃縮非晶相的玻璃轉移；Tc 是指定方法觀察到的崩塌溫度。不能互換，也不能用固定差值換算。</p></div><div><strong>供熱與移除水蒸氣</strong><p>一次乾燥的昇華消耗熱量。供熱、乾層阻力與水蒸氣移除共同影響溫度和速率；改腔壓也可能改氣體傳熱，降壓不保證加速。</p></div><div><strong>控制產品溫度</strong><p>對指定配方量測臨界性質與不同位置的產品溫度，再調供熱和壓力。降低供熱可能保留結構，也可能延長乾燥；這裡的實驗值不是其他食品的設定建議。</p></div><div><strong>凍結與退火</strong><p>改變冰晶、凍結濃縮及孔道可能影響結構與阻力；仍要驗證材料和歷史條件。外觀完整、微觀結構、殘水與菌株存活是不同結果。</p></div></div>
      <p>非晶相在相應時間尺度下軟化、流動，可能讓乾燥骨架失去支撐；結晶相的熔化另涉及相平衡。白色固體不自動代表結晶，也不能將所有崩塌歸為同一個溫度門檻。</p>
      <p>本工作台只比較兩篇研究的離散結果，沒有模擬乾燥曲線、設備排程、崩塌率或安全期限。資料全圖會同時顯示三組／六組；首次保留包含先前已接觸資料，課文與其他頁面也可能透露結果，不作盲測。</p>
      <ul>${DATA.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-fc-source="${esc(s.id)}">${esc(s.title)}</a><p class="fc-context">${esc(s.publisher)}｜${esc(s.locator)}<br>${esc(s.note)}</p></li>`).join('')}</ul></details></section>`;
  function captureFirst(trigger){const c=current(d);if(!c.first)c.first={trigger,parameters:copy(c.parameters),writing:copy(writing(c)),exposure:{revealed:c.revealed,seenCases:[...d.seenCases],sources:[...d.sources],tableOpened:d.tableOpened,detailsOpened:d.detailsOpened}};}
  function firstText(c){if(!c.first)return '首次顯示、記錄或開啟資料／來源時保留當時文字；不作盲測。';const f=c.first,e=f.exposure;return `首次保留（${f.trigger}）\n${writingText(f.writing)}\n當時目前結果已顯示=${e.revealed?'是':'否'}；先前顯示過的案例=${e.seenCases.join('、')||'無'}；量測表已開=${e.tableOpened?'是':'否'}；原理已開=${e.detailsOpened?'是':'否'}；來源=${e.sources.join('、')||'無'}。後續改寫不覆蓋此快照。`;}
  function observationText(o,i){return `觀察 ${i+1}｜${conditionText(o.parameters)}\n${o.revealed?o.resultText:'此組結果尚未顯示'}\n${writingText(o.writing)}`;}
  function archive(){return [HEADER,...Object.values(d.cases).map(c=>`${conditionText(c.parameters)}\n${firstText(c)}\n${c.revealed?resultText(c.parameters):'此組結果尚未顯示'}\n${writingText(writing(c))}`),...d.observations.map(observationText),`曾顯示案例=${d.seenCases.join('、')||'無'}；量測表已開=${d.tableOpened?'是':'否'}；原理已開=${d.detailsOpened?'是':'否'}；來源=${d.sources.join('、')||'無'}。開啟不等於讀完或理解。`,sourceText()].join('\n\n');}
  function appendPlan(){const next=copy(d.cursor),blocks=[],currentBlocks=[],newObservations=d.observations.slice(next.observations);
    for(const [k,c] of Object.entries(d.cases)){
      if(c.first&&!next.first.includes(k)){blocks.push(`${conditionText(c.parameters)}\n${firstText(c)}`);next.first.push(k);}
      const signature=JSON.stringify({parameters:c.parameters,revealed:c.revealed}),w=writing(c),latest=newObservations.filter(o=>key(o.parameters)===k).at(-1);
      if(latest){if(latest.revealed!==c.revealed||JSON.stringify(latest.writing)!==JSON.stringify(w))currentBlocks.push(`保存時目前狀態（歷史觀察另列）\n${conditionText(c.parameters)}\n${c.revealed?resultText(c.parameters):'此組結果尚未顯示'}\n${writingText(w)}`);next.results[k]=signature;next.writing[k]=copy(w);}
      else{if(c.first&&next.results[k]!==signature){currentBlocks.push(`保存時目前結果\n${conditionText(c.parameters)}\n${c.revealed?resultText(c.parameters):'此組結果尚未顯示'}`);next.results[k]=signature;}const old=next.writing[k];if(JSON.stringify(w)!==JSON.stringify(old)){if(Object.values(w).some(Boolean)||old)currentBlocks.push(`${conditionText(c.parameters)}｜保存時目前文字\n${writingText(w)}`);next.writing[k]=copy(w);}}
    }
    for(let i=next.observations;i<d.observations.length;i++)blocks.push(observationText(d.observations[i],i));next.observations=d.observations.length;blocks.push(...currentBlocks);
    for(const [flag,label] of [['table','量測表'],['details','原理與來源']])if(d[`${flag}Opened`]&&!next[flag]){blocks.push(`已開${label}；不等於完整閱讀或理解。`);next[flag]=true;}
    for(const [name,label] of [['seenCases','新增顯示案例'],['sources','新增來源開啟']]){const added=d[name].filter(v=>!next[name].includes(v));if(added.length)blocks.push(`${label}：${added.join('、')}；不證明完整閱讀或理解。`);next[name]=[...d[name]];}
    if(blocks.length&&!next.started){blocks.unshift(HEADER);blocks.push(sourceText());next.started=true;}return {text:blocks.join('\n\n'),next};
  }
  function drawSummary(){field('summary').value=archive();const plan=appendPlan();field('append').value=plan.text;action('save').disabled=!plan.text;field('save-status').textContent=saveStatus;}
  function markCases(rows){for(const row of rows)if(!d.seenCases.includes(row.id))d.seenCases.push(row.id);}
  function table(p){return p.view==='drying'?`<p>10% w/v 蔗糖模型溶液；Kodama et al.（2014），Table 2 實測欄。均值 ± SD，重複 n 未報；320 瓶是裝載量。兩個指標分屬不同位置，不能當作一瓶的溫度與時間序列。</p><div class="fc-table-wrap"><table><thead><tr><th>架板 °C</th><th>腔壓 Pa</th><th>邊緣瓶最大 Tp °C</th><th>中心瓶一次乾燥 h</th></tr></thead><tbody>${DATA.drying.cases.map(row=>`<tr><td>${row.shelfC}</td><td>${row.pressurePa}</td><td>${meanSD(row.temperature)}</td><td>${meanSD(row.hours)}</td></tr>`).join('')}</tbody></table></div><p>Tc = −31.5°C：同配方 Lyostat 2 顯微乾燥，1–2 μL、8 Pa、1°C/min，依乾層白點出現界定 onset；其 SD 未報。這個配方的 Tg′ 未報。Table 2 未逐組提供崩塌結局。</p><p>中央瓶時間依來源末期溫度變動在 0.5°C 內的判準；不代表所有水分已除盡。裝置、容器、探針位置與終點方法須另核，不能移植成食品設備排程。</p>`:`<p>20% w/w 糖／麥芽糊精配方，乾物比例 2:1，含 L. reuteri DSM 17938；液氮急凍成 4–5 mm 顆粒。Palmkron et al.（2024），Fig. 1、Table III。</p><div class="fc-table-wrap"><table><thead><tr><th>處理／批次</th><th>巨觀外觀</th><th>表 III 厚度欄報值</th><th>方法</th></tr></thead><tbody>${DATA.structure.cases.map(row=>`<tr><td>${esc(row.label)}</td><td>${esc(row.macro.text)}</td><td>${esc(row.thickness.text)}</td><td>${esc(row.thickness.method)}</td></tr>`).join('')}</tbody></table></div><p>短退火 −9°C、2 小時；長退火 −20±0.5°C、1 週，處理後回存 −80°C。Batch 1 在預冷腔體多停留約 10–15 分鐘；這與批次伴隨改變，沒有隔離成單因子效果。</p><p>鋁杯懸吊，腔壓 30 Pa、架板升至 +20°C；不是逐顆粒溫度或冰界面壓力。Tg′ onset = −25°C，熔融 onset Tm = −9°C；Tc 未測。Fig. 6 的 −32°C 是假設示意路徑，不能當實測 Tp。</p><p>未退火 B2 的原顆粒分母未報，約三分之一不轉成精確率。SEM／μCT 只選外觀完整顆粒；SEM 估計和 μCT 不當作同方法均值。Table III 標題稱 average、欄名稱 mode，短退火正文另稱 1.5–2 μm；此處保留表值，不消除差異。N/A 不是 0。</p><p>兩種退火處理都可見局部微觀變化；沒有逐批微崩塌百分比。外觀、微結構、水分與存活不能互相代證。</p>`;}
  function draw(){if(disposed)return;const c=current(d),p=c.parameters,row=rowFor(p);
    root.querySelectorAll('[data-fc-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fcView===d.view)));field('series-label').hidden=d.view!=='drying';field('series').value=d.seriesId;
    const options=rowsFor(p).map(row=>`<option value="${esc(row.id)}">${esc(row.label)}</option>`).join('');if(field('case').innerHTML!==options)field('case').innerHTML=options;field('case').value=p.caseId;
    field('scope').textContent=p.view==='drying'?'Kodama 2014 · 10% w/v 蔗糖瓶裝實驗 · 五組實測條件':'Palmkron 2024 · 20% w/w 糖／麥芽糊精含菌顆粒 · 三處理 × 兩批次';
    field('display').setAttribute('data-view',p.view);field('chart').innerHTML=c.revealed?(p.view==='drying'?dryingChart(p,prefix):structureFigure(p)):'<div class="fc-placeholder"><div>先選條件，再顯示資料<br><span class="fc-context">也可以先展開下方書寫，記下初判。</span></div></div>';
    field('result').innerHTML=c.revealed?(p.view==='drying'?`<strong>${esc(row.label)}</strong><dl class="fc-values"><div><dt>邊緣瓶最大 Tp</dt><dd>${esc(meanSD(row.temperature))} °C</dd></div><div><dt>中心瓶一次乾燥時間</dt><dd>${esc(meanSD(row.hours))} h</dd></div></dl><p class="fc-context">均值 ± SD；兩個位置的指標。低於參考 Tc 的均值不能單獨證明無崩塌。</p>`:`<strong>${esc(row.label)} · ${esc(row.macro.text)}</strong><p>表 III 厚度欄：${esc(thicknessText(row))}</p><p class="fc-context">只選完整顆粒做微結構分析；肉眼完整不等於沒有微觀變化。</p>`):'<strong>目前結果尚未顯示</strong><p>兩個實驗的材料與量測條件分開判讀。</p>';
    field('caption').textContent=p.view==='drying'?'點為均值，誤差棒為 ± SD；只畫實測點，不連成預測曲線。參考線只屬此配方與 FDM 方法。':'六格為原文觀察與表值；沒有逐批微崩塌率。批次與預停留時間不同，不能只歸因退火。';
    action('reveal').disabled=c.revealed;field('question').textContent=p.view==='drying'?'在固定架板或固定腔壓下，你預期產品溫度與乾燥時間如何變化？觀察後說明取捨。':'相同配方與乾燥設定，凍結、退火及批次歷史不同，結構會一樣嗎？需要哪些證據才能判斷改善有效？';
    for(const name of ['prediction','revision','next'])field(name).value=c[name];field('first').textContent=firstText(c);field('count').textContent=`${d.observations.length} / 24`;
    field('records').innerHTML=d.observations.length?d.observations.map((o,i)=>`<article><p>${esc(observationText(o,i))}</p><button type="button" data-fc-replay="${i}">回到觀察 ${i+1} 的條件</button></article>`).join(''):'<p>尚未記錄。</p>';
    field('table').innerHTML=table(p);field('feedback').textContent=feedback;field('error').textContent=error;drawSummary();
  }
  function switchCondition(p){resultFor(p);d.view=p.view;if(p.view==='drying'){d.seriesId=p.seriesId;d.dryingCaseId=p.caseId;}else d.structureCaseId=p.caseId;current(d);if(field('table-details').open){captureFirst('開啟中的量測表更新前');d.tableOpened=true;markCases(DATA[p.view].cases);}feedback='';error='';saveStatus='';draw();}
  function record(){captureFirst('記下條件與文字');const c=current(d),o={parameters:copy(c.parameters),revealed:c.revealed,result:c.revealed?copy(resultFor(c.parameters)):null,resultText:c.revealed?resultText(c.parameters):null,writing:copy(writing(c))};if(d.observations.some(old=>JSON.stringify(old)===JSON.stringify(o)))feedback='這份條件、結果與文字已記錄。';else if(d.observations.length>=24)feedback='已保留 24 份快照，不覆寫原紀錄；請先保存或複製。';else{d.observations.push(o);feedback=`已保留第 ${d.observations.length} 份觀察。`;saveStatus='';}draw();}
  function click(event){if(disposed)return;const source=event.target.closest?.('[data-fc-source]');if(source&&root.contains(source)){captureFirst('開啟來源前');if(!d.sources.includes(source.dataset.fcSource))d.sources.push(source.dataset.fcSource);draw();return;}const b=event.target.closest?.('button');if(!b||!root.contains(b)||b.disabled)return;
    if(b.dataset.fcView){const view=b.dataset.fcView;switchCondition(view==='drying'?{view,seriesId:d.seriesId,caseId:d.dryingCaseId}:{view,caseId:d.structureCaseId});return;}
    if(b.dataset.fcReplay!==undefined){const o=d.observations[Number(b.dataset.fcReplay)];if(o){switchCondition(o.parameters);current(d).revealed=o.revealed;if(o.revealed)markCases(rowsFor(o.parameters));feedback='已回到原條件與當時顯示狀態；目前修訂保留，舊文字可在觀察中查看。';draw();}return;}
    const name=b.dataset.fcAction;if(name==='reveal'){captureFirst('顯示比較資料前');current(d).revealed=true;markCases(rowsFor(current(d).parameters));feedback=d.view==='drying'?'已顯示這組比較的三個條件。':'已顯示全部六組處理與批次。';saveStatus='';draw();}
    else if(['record','record-writing'].includes(name))record();else if(name==='copy'){field('summary').focus();field('summary').select();saveStatus='已選取完整摘要，按 Ctrl+C 複製。';drawSummary();}
    else if(name==='save'&&typeof onSaveSummary==='function'){const plan=appendPlan();if(!plan.text)return;let saved=false,reason='';if(plan.text.length>10000)reason='本次附加內容超過筆記 10,000 字上限。';else try{saved=onSaveSummary(plan.text)===true;}catch(e){reason=e?.message||String(e);}if(saved)d.cursor=plan.next;if(disposed)return;saveStatus=saved?'已附加到本課筆記；下次只附加新觀察與修訂。':`尚未保存。${reason||'儲存端未確認成功。'} 全文和保存位置保留，請先複製備存。`;draw();}
  }
  function input(event){if(disposed)return;for(const name of ['prediction','revision','next'])if(event.target===field(name)){current(d)[name]=event.target.value;saveStatus='';drawSummary();return;}}
  function change(event){if(disposed)return;try{if(event.target===field('series')){const series=seriesFor(event.target.value);if(!series)throw new RangeError('請選擇已核對的比較方式。');switchCondition({view:'drying',seriesId:series.id,caseId:series.caseIds.includes(d.dryingCaseId)?d.dryingCaseId:series.caseIds[0]});}else if(event.target===field('case'))switchCondition({...parameters(d),caseId:event.target.value});}catch(e){error=e.message;draw();}}
  function toggle(event){if(disposed||!event.target.open)return;if(event.target===field('table-details')){captureFirst('開啟完整量測表前');d.tableOpened=true;markCases(DATA[d.view].cases);}else if(event.target===field('details')){captureFirst('開啟原理與來源前');d.detailsOpened=true;}else if(event.target===field('summary-details'))captureFirst('開啟摘要前');else if(event.target===field('records-details'))captureFirst('開啟歷史觀察前');else return;draw();}
  root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',change);root.addEventListener('toggle',toggle,true);draw();
  return ()=>{if(disposed)return;disposed=true;root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('toggle',toggle,true);};
}
