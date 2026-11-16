import {escapeHTML as esc} from './storage.js';
import {MAILLARD_STORAGE_LAB_ID,validateMaillardStorageData,compareMaillardStorage,normalizedMaillardEndpoint} from './maillard-storage-model.js';

export {MAILLARD_STORAGE_LAB_ID} from './maillard-storage-model.js';
const drafts=new WeakMap();
let sequence=0;
const fresh=()=>({temperatureC:30,mode:'endpoint',rateUnit:'h^-1',judgement:'',revision:'',observations:[],writings:[],sourceSnapshot:[],saved:new Set()});
const fmt=(value,digits=9)=>Number(value).toLocaleString('en-US',{maximumFractionDigits:digits,useGrouping:false});
const unitLabel=unit=>unit==='h^-1'?'h⁻¹':unit==='day^-1'?'day⁻¹':unit==='percentage-points'?'百分點':'%';
const modeLabel=mode=>mode==='endpoint'?'30 天報告損失':mode==='kinetics'?'作者擬合 k':'正規化模型代入';
const scientificBoundary='儲存 RH 不是樣品 aw；兩組起始含水量不同。本例只支持指定奶粉與儲存條件的比較。';
function safeLink(url,label){
  try{const value=new URL(url);if(value.protocol==='https:'&&!value.username&&!value.password)return `<a href="${esc(value.href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;}catch{}
  return esc(label);
}
function rowText(row,unit){
  const interval=row.uncertainty?`；95% CI ${fmt(row.uncertainty.low)}–${fmt(row.uncertainty.high)} ${unitLabel(unit)}`:'；端點不確定度未提供';
  return `${row.rhPercent}% RH：${fmt(row.value)} ${unitLabel(unit)}${interval}`;
}
function chart(comparison,prefix){
  const {mode,unit,rows}=comparison;
  const maximum=mode==='endpoint'?35:unit==='h^-1'?.0006:.0144;
  const ticks=mode==='endpoint'?[0,10,20,30,35]:[0,maximum/3,maximum*2/3,maximum];
  const pct=value=>100*value/maximum;
  const description=rows.map(row=>rowText(row,unit)).join('；');
  return `<figure class="ms-chart" aria-labelledby="${prefix}-chart-title"><figcaption id="${prefix}-chart-title">${mode==='endpoint'?'30 天可利用離胺酸損失 / %':`作者一階 k / ${unitLabel(unit)}`}</figcaption><p class="ms-chart-note">${mode==='endpoint'?'報告端點 · 柱長由零開始；沒有端點誤差棒':'刊載擬合參數 · 點為 k，線段為 95% CI'}</p><div class="ms-plot" role="img" aria-label="${esc(`${comparison.temperatureC}°C；${description}`)}">${rows.map((row,i)=>`<div class="ms-chart-row ms-series-${i}"><span class="ms-rh-label">${row.rhPercent}% RH</span><div class="ms-track" aria-hidden="true">${mode==='endpoint'?`<span class="ms-bar" style="width:${pct(row.value)}%"></span>`:`<span class="ms-interval" style="left:${pct(row.uncertainty.low)}%;width:${pct(row.uncertainty.high-row.uncertainty.low)}%"></span><span class="ms-point" style="left:${pct(row.value)}%"></span>`}</div><div class="ms-value"><strong>${fmt(row.value)}</strong><span>${unitLabel(unit)}</span>${row.uncertainty?`<small>95% CI<br>${fmt(row.uncertainty.low)}–${fmt(row.uncertainty.high)}</small>`:''}</div></div>`).join('')}<div class="ms-axis-row" aria-hidden="true"><div class="ms-axis">${ticks.map(value=>`<span style="left:${pct(value)}%">${fmt(value)}</span>`).join('')}</div></div></div></figure>`;
}

/** Published endpoint/parameter comparison. No sample-aw or reaction trajectory simulation. */
export function mountMaillardStorageLab(root,id=MAILLARD_STORAGE_LAB_ID,{draftOwner,onSaveSummary,fetcher=globalThis.fetch}={}){
  if(id!==MAILLARD_STORAGE_LAB_ID)throw new RangeError('Unknown Maillard storage activity');
  if(!root||typeof root.querySelector!=='function'||typeof root.addEventListener!=='function')throw new TypeError('A DOM container is required');
  const owned=draftOwner&&typeof draftOwner==='object';
  if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,fresh());
  const draft=owned?drafts.get(draftOwner):fresh(),prefix=`maillard-storage-${++sequence}`;
  const $=selector=>root.querySelector(selector),field=name=>$(`[data-ms-${name}]`),action=name=>$(`[data-ms-action="${name}"]`);
  let data=null,disposed=false,epoch=0,aborter=null,feedback='',saveStatus='';

  root.innerHTML=`<section class="maillard-storage-lab" aria-labelledby="${prefix}-title"><h2 class="ms-sr-only" id="${prefix}-title">梅納反應：奶粉儲存條件比較</h2>
    <p class="ms-identity">商業脫脂奶粉 · 可利用離胺酸 · Aalaei 等，2018</p>
    <div class="ms-toolbar"><label for="${prefix}-temperature">儲存溫度<select id="${prefix}-temperature" data-ms-temperature disabled><option value="30">30°C</option><option value="32.5">32.5°C</option><option value="35">35°C</option></select></label><div class="ms-modes" role="group" aria-label="讀取哪一種數值"><button type="button" data-ms-mode="endpoint" aria-pressed="true" disabled>30 天損失</button><button type="button" data-ms-mode="kinetics" aria-pressed="false" disabled>作者速率 k</button></div><label for="${prefix}-unit" data-ms-unit-field hidden>k 的時間單位<select id="${prefix}-unit" data-ms-unit disabled><option value="h^-1">每小時 h⁻¹</option><option value="day^-1">每天 day⁻¹</option></select></label></div>
    <p class="ms-load-status" role="status" data-ms-load-status>正在讀取研究數值…</p><button type="button" data-ms-action="retry" hidden>重試讀取研究資料</button>
    <div data-ms-ready hidden><div data-ms-chart></div><div class="ms-result"><p data-ms-result></p><button type="button" data-ms-action="record" class="ms-primary">記下這組比較</button></div><p class="ms-boundary">${scientificBoundary}</p><p class="ms-feedback" role="status" data-ms-feedback></p>
      <details class="ms-details" data-ms-calculator><summary>用 k 算一次：30 天模型估計會等於報告端點嗎？</summary><p>明設 r(0) = 1，把作者 k 代入 r(30 天) = exp(−k × 720 小時)。這是正規化模型計算，沒有原始／擬合 C₀ 數值，也沒有重新擬合。</p><div class="ms-model-results" data-ms-model-results></div><p class="ms-small">模型損失與報告損失之差只稱「百分點差」，不當成殘差或擬合驗證。沒有原始時間資料，不畫逐日實測曲線，也不給預測區間。</p><button type="button" data-ms-action="record-model">記下模型與端點的比較</button></details>
    </div>
      <details class="ms-details" data-ms-writing><summary>留下自己的判斷與修訂</summary><p class="ms-small" data-ms-writing-note></p><div class="ms-writing-grid"><label for="${prefix}-judgement"><span data-ms-judgement-label>我的判斷</span><textarea id="${prefix}-judgement" rows="3" maxlength="900" data-ms-judgement placeholder="哪些數值支持我的判斷？"></textarea></label><label for="${prefix}-revision">後續修訂與推論限制<textarea id="${prefix}-revision" rows="3" maxlength="1200" data-ms-revision placeholder="哪些結論還不能由這些數值推出？"></textarea></label></div><button type="button" data-ms-action="record-writing" disabled>把目前文字與這組比較一起記下</button></details>
      <details class="ms-details" data-ms-records-details><summary>已記錄的比較 <span data-ms-count>0 / 12</span></summary><div data-ms-records></div><p class="ms-small">每次記錄保留溫度、模式、單位、來源與當時文字；它不會隨控制改變。紀錄仍需附加到本課筆記，才會持久保存。</p></details>
      <details class="ms-details" data-ms-summary-details><summary>檢查並保存探究摘要</summary><label for="${prefix}-summary">條件、來源與自己的文字<textarea id="${prefix}-summary" rows="9" readonly data-ms-summary></textarea></label><div class="ms-summary-actions"><button type="button" data-ms-action="copy">選取摘要文字</button>${typeof onSaveSummary==='function'?'<button type="button" class="ms-primary" data-ms-action="save" disabled>附加到本課筆記</button>':''}</div><p class="ms-save-status" role="status" data-ms-save-status></p><p class="ms-small">操作與未存文字只在本頁暫留；返回同課可以延續，重新整理前請保存或複製。附加失敗時會保留這份摘要。</p></details>
      <details class="ms-details" data-ms-source-panel hidden><summary>研究條件、原表與資料來源</summary><p>同一商業低熱處理、噴霧乾燥脫脂奶粉產品，開放培養皿置於控濕容器，儲存 30 天。染料結合法的可利用離胺酸是早期梅納變化指標，不是顏色或總梅納產物。</p><p>第 0 天濕基含水量：43% RH 組 4.00 ± 0.02%；52% RH 組 2.96 ± 0.10%（均值 ± SD，n = 2）。來源未解釋這個起始差異。aw 儀器量測在 20°C，儲存溫度為 30–35°C；未取得完整樣品 aw 歷程及平衡證據。</p><div class="ms-table-scroll"><table><caption>2018 年報告數值；± 為 k 的 95% CI 半寬</caption><thead><tr><th scope="col">溫度</th><th scope="col">儲存 RH</th><th scope="col">30 天損失 / %</th><th scope="col">k / h⁻¹</th></tr></thead><tbody data-ms-table></tbody></table></div><p>原 Table 2 欄名 k × 10³ (h⁻¹)：表內 0.113 換成 0.000113 h⁻¹。每天 k = 每小時 k × 24；CI 同樣換算。k 的 CI 是參數區間，不是端點 SD，不用它直接判定組間顯著差異。</p><p>博士論文方法與正式版採 43% RH，但博士論文部分圖表標 44%；此處採 2018 正式版的 43%，保留版本差異。原始 S1 時間表尚未取得，本頁不回放實測時間點、不重算擬合，也不推定相態因果。</p><ul class="ms-sources" data-ms-sources></ul><p class="ms-small">來源轉錄與推論界線的完整查核保留在本專案；資料封存不代表實驗已重現。</p></details>
    </section>`;

  field('temperature').value=String(draft.temperatureC);field('unit').value=draft.rateUnit;
  field('judgement').value=draft.judgement;field('revision').value=draft.revision;
  const comparison=()=>compareMaillardStorage(data,{temperatureC:draft.temperatureC,mode:draft.mode,rateUnit:draft.rateUnit});
  function describeObservation(item,index){
    const head=`${index+1}. ${item.temperatureC}°C · ${modeLabel(item.mode)} · 文字 ${item.writingIndex+1}`;
    if(item.mode==='normalized-model')return [head,'r(0)=1；t=30 天；使用作者每小時 k；非原作者完整曲線重現',...item.rows.map(row=>`${row.rhPercent}% RH [${row.id}]：模型損失約 ${fmt(row.lossPercent,6)}%；報告 ${fmt(row.reportedLossPercent)}%；模型−報告 ${fmt(row.differencePercentagePoints,6)} 百分點；無預測區間`),`來源：${item.sourceRefs.join('、')}`].join('\n');
    return [head,...item.rows.map(row=>`${rowText(row,item.unit)} [${row.id}]`),`52% RH − 43% RH：${fmt(item.difference.value)} ${unitLabel(item.difference.unit)}`,`來源：${item.sourceRefs.join('、')}`].join('\n');
  }
  function summary(){
    const sources=data?.sources||draft.sourceSnapshot;
    return ['梅納反應：商業脫脂奶粉儲存條件比較','Aalaei et al. (2018) · DOI 10.1111/ijfs.13803',scientificBoundary,sources.length?'研究數值已曾顯示；此處文字不自動認定為操作前預測。':'研究數值尚未載入；以下為尚未讀值的草稿。',`已記錄 ${draft.observations.length} 組比較`,...draft.observations.map(describeObservation),'',...draft.writings.map((writing,index)=>`文字 ${index+1}（記錄時快照）\n讀值後判斷：${writing.judgement||'未填'}\n修訂與限制：${writing.revision||'未填'}`),'','目前可編輯文字（不改寫上述快照）',`${sources.length?'讀值後判斷':'目前判斷（尚未讀值）'}：${draft.judgement||'未填'}`,`修訂與限制：${draft.revision||'未填'}`,'','端點：報告的 30 日損失，未提供可用端點不確定度。k：作者擬合參數及 95% CI，非端點誤差或獨立顯著性檢定。','S1 原始時間表、完整樣品 aw 與同批相態資料未取得。只有兩個儲存 RH，不能推成通用 aw–速率曲線。',...sources.map(source=>`${source.id}：${source.url}`)].join('\n');
  }
  function drawSummary(){
    if(disposed)return;
    const seen=draft.sourceSnapshot.length>0;
    field('judgement-label').textContent=seen?'讀值後的判斷':'我的判斷（尚未讀值）';
    field('writing-note').textContent=(seen?'研究數值已曾顯示；此處標為讀值後判斷。若另有事前預測，可在文字中註明。':'研究數值尚未載入；可以先留下目前的想法。')+'按「記下這組比較」會保留當時文字，後續修改不改寫舊紀錄。';
    const text=summary();field('summary').value=text;field('save-status').textContent=saveStatus;
    const button=action('save');if(button)button.disabled=!draft.observations.length||draft.saved.has(text);
  }
  function drawRecords(){
    field('count').textContent=`${draft.observations.length} / 12`;
    field('records').innerHTML=draft.observations.length?draft.observations.map((item,index)=>`<article class="ms-record"><h3>${index+1}. ${item.temperatureC}°C · ${modeLabel(item.mode)}</h3><p>${esc(describeObservation(item,index))}</p><p>當時判斷：${esc(draft.writings[item.writingIndex].judgement||'未填')}<br>當時修訂：${esc(draft.writings[item.writingIndex].revision||'未填')}</p></article>`).join(''):'<p>還沒有獨立記錄。先選條件，再按「記下這組比較」。</p>';
  }
  function draw(){
    if(disposed||!data)return;
    const current=comparison(),normalized=normalizedMaillardEndpoint(data,draft.temperatureC);
    field('temperature').value=String(draft.temperatureC);field('unit').value=draft.rateUnit;
    field('unit-field').hidden=draft.mode!=='kinetics';
    root.querySelectorAll('[data-ms-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.msMode===draft.mode)));
    field('chart').innerHTML=chart(current,prefix);
    field('result').textContent=draft.mode==='endpoint'?`${draft.temperatureC}°C，52% RH 組比 43% RH 組多損失 ${fmt(current.difference.value)} 個百分點。`:`${draft.temperatureC}°C，52% RH 組的作者 k 約為 43% RH 組的 ${fmt(current.rows[1].value/current.rows[0].value,2)} 倍。`;
    field('model-results').innerHTML=normalized.rows.map(row=>`<article><h3>${row.rhPercent}% RH · ${draft.temperatureC}°C</h3><dl><div><dt>代入模型的損失</dt><dd>約 ${fmt(row.lossPercent,2)}%</dd></div><div><dt>報告端點損失</dt><dd>${fmt(row.reportedLossPercent)}%</dd></div><div><dt>模型 − 報告</dt><dd>${fmt(row.differencePercentagePoints,2)} 百分點</dd></div></dl></article>`).join('');
    field('feedback').textContent=feedback;drawRecords();drawSummary();
  }
  function record(model=false){
    if(!data||disposed)return;
    const writing={judgement:draft.judgement,revision:draft.revision};
    let writingIndex=draft.writings.findIndex(item=>item.judgement===writing.judgement&&item.revision===writing.revision);
    if(writingIndex<0)writingIndex=draft.writings.length;
    const value=model?normalizedMaillardEndpoint(data,draft.temperatureC):comparison();
    const candidate={temperatureC:draft.temperatureC,mode:model?'normalized-model':draft.mode,unit:model?'%':value.unit,rows:value.rows,difference:model?null:value.difference,sourceRefs:[...new Set(value.rows.flatMap(row=>row.sourceRefs))],writingIndex,judgementTiming:'after-display'};
    if(draft.observations.some(item=>JSON.stringify(item)===JSON.stringify(candidate)))feedback='這組數值與文字已記錄，沒有重複增加。';
    else if(draft.observations.length>=12)feedback='已記錄 12 組。請先保存或複製本批摘要；重新整理後可以開始另一批。';
    else{
      if(writingIndex===draft.writings.length)draft.writings.push(Object.freeze({...writing}));
      draft.observations.push(structuredClone(candidate));feedback=`已記錄第 ${draft.observations.length} 組；修改控制或文字不改寫這份快照。`;saveStatus='';
    }
    draw();
  }
  function click(event){
    if(disposed)return;const button=event.target.closest?.('button');if(!button||!root.contains(button)||button.disabled)return;
    if(button.dataset.msMode&&data){draft.mode=button.dataset.msMode;feedback='';draw();return;}
    const name=button.dataset.msAction;
    if(name==='retry'){load();return;}
    if(name==='record'||name==='record-writing'){record();return;}
    if(name==='record-model'){record(true);return;}
    if(name==='copy'){field('summary').focus();field('summary').select();saveStatus='已選取摘要；按 Ctrl+C 複製。';drawSummary();return;}
    if(name==='save'&&draft.observations.length&&typeof onSaveSummary==='function'){
      const value=summary();if(draft.saved.has(value))return;
      let saved=false;try{saved=onSaveSummary(value)===true;}catch{}
      if(disposed)return;
      if(saved){draft.saved.add(value);saveStatus='已附加到本課筆記；可在「筆記與複習」匯出。';}
      else saveStatus='尚未保存；這份摘要與文字仍保留。請複製備份、查看本課筆記狀態，整理後再試。';
      drawSummary();
    }
  }
  function change(event){
    if(disposed||!data)return;const target=event.target;
    if(target===field('temperature')){const value=Number(target.value);if(![30,32.5,35].includes(value))return;draft.temperatureC=value;}
    else if(target===field('unit')){if(!['h^-1','day^-1'].includes(target.value))return;draft.rateUnit=target.value;}
    else return;
    feedback='';draw();
  }
  function input(event){
    if(disposed)return;const target=event.target;
    if(target===field('judgement'))draft.judgement=target.value.slice(0,900);
    else if(target===field('revision'))draft.revision=target.value.slice(0,1200);
    else return;
    saveStatus='';drawSummary();
  }
  async function load(){
    if(disposed)return;const token=++epoch;aborter?.abort();aborter=new AbortController();data=null;
    field('ready').hidden=true;field('source-panel').hidden=true;action('record-writing').disabled=true;drawRecords();drawSummary();field('load-status').textContent='正在讀取研究數值…';action('retry').hidden=true;
    for(const node of [field('temperature'),field('unit'),...root.querySelectorAll('[data-ms-mode]')])node.disabled=true;
    try{
      const response=await fetcher(new URL('../data/maillard-storage-evidence.json',import.meta.url),{signal:aborter.signal});
      if(!response.ok)throw new Error('Source response unavailable');
      const incoming=await response.json();if(disposed||token!==epoch)return;
      data=validateMaillardStorageData(incoming);draft.sourceSnapshot=structuredClone(data.sources);
      const rows=[30,32.5,35].flatMap(temperatureC=>{
        const endpoint=compareMaillardStorage(data,{temperatureC,mode:'endpoint',rateUnit:'h^-1'}),fit=compareMaillardStorage(data,{temperatureC,mode:'kinetics',rateUnit:'h^-1'});
        return endpoint.rows.map((row,index)=>`<tr><th scope="row">${temperatureC}°C</th><td>${row.rhPercent}%</td><td>${fmt(row.value)}</td><td>${fmt(fit.rows[index].value)} ± ${fmt(fit.rows[index].uncertainty.halfWidth)}</td></tr>`);
      });
      field('table').innerHTML=rows.join('');field('sources').innerHTML=data.sources.map(source=>`<li>${safeLink(source.url,source.title)}${source.locator?`<span> · ${esc(source.locator)}</span>`:''}</li>`).join('');
      field('ready').hidden=false;field('source-panel').hidden=false;action('record-writing').disabled=false;field('load-status').textContent='';for(const node of [field('temperature'),field('unit'),...root.querySelectorAll('[data-ms-mode]')])node.disabled=false;
      draw();
    }catch(error){
      if(disposed||token!==epoch||error?.name==='AbortError')return;
      data=null;field('load-status').textContent='研究資料未能載入或核對，暫不顯示數值。可以重試；下方仍可書寫，先前記錄可查看、複製與保存。';action('retry').hidden=false;
    }
  }
  root.addEventListener('click',click);root.addEventListener('change',change);root.addEventListener('input',input);load();
  return()=>{if(disposed)return;disposed=true;epoch++;aborter?.abort();root.removeEventListener('click',click);root.removeEventListener('change',change);root.removeEventListener('input',input);};
}
