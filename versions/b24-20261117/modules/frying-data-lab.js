import {escapeHTML as esc} from './storage.js';
import {validateFryingData,fryingSeries,fryingComparison} from './frying-data-model.js';

export const FRYING_LAB_ID='frying-data-lab';
const cycles=[0,5,10,15,20];
const fmt=(n,d=3)=>Number(n.toFixed(d)).toLocaleString('en-US',{maximumFractionDigits:d});
const signed=n=>(n>0?'+':'')+fmt(n);
let instance=0;
const drafts=new WeakMap();
const panelKeys=['comparison','table','source','journal'];
function draftFor(owner,key){
  const create=()=>({metric:'tpc',mode:'absolute',cycle:20,from:0,writing:'',open:Object.fromEntries(panelKeys.map(key=>[key,false])),seen:{comparison:false,table:false,source:false},records:[],review:'',cursor:0,savedSignature:null,savedVersions:[],saving:false,status:'',views:new Set()});
  if(!owner||(typeof owner!=='object'&&typeof owner!=='function'))return create();
  let entries=drafts.get(owner);if(!entries){entries=new Map();drafts.set(owner,entries);}
  if(!entries.has(key))entries.set(key,create());return entries.get(key);
}
const immutable=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(immutable);Object.freeze(value);}return value;};
function snapshotText(item){
  const lines=[`${item.metricLabel}｜${item.metric}｜${item.mode==='absolute'?'原值':'各油自己的 0 次基準比'}｜取樣 ${item.cycle} 次｜比較起點 ${item.from} 次`,
    ...item.readings.map(p=>`${p.label}：${item.mode==='absolute'?`${p.meanText} ${item.unit} ± ${p.sdText} SD`:`${fmt(p.value)} 倍（${p.meanText} / ${p.baselineMeanText}）`}`),
    `目前文字：${item.writing||'未填寫'}`,
    '資料暴露：圖自載入起顯示兩油全部五個取樣點；這是看圖後的觀察，不是盲測。',
    `此前／當下曾展開：${[['comparison','兩點比較'],['table','原表與量測方法'],['source','研究條件與來源']].filter(([key])=>item.seen[key]).map(([,label])=>label).join('、')||'尚無展開紀錄'}`];
  if(item.comparisons)for(const c of item.comparisons){const result=c.significance==='same-point'?'同一個取樣點':c.significance==='different'?'沒有共享字母；表中標為顯著不同':'共享字母；表中未標為顯著不同';lines.push(`已展開的比較｜${c.label}｜${item.from} 次 → ${item.cycle} 次：均值差 ${signed(c.difference)} ${item.metric==='tpc'?'百分點':item.unit}；終點 / 起點 ${fmt(c.ratio)} 倍；相對改變 ${signed(c.percentChange)}%；原表 ${c.from.letters} → ${c.to.letters}；${result}`);}
  else lines.push('兩點比較目前收起；此筆未記為已展開的比較結果。');
  return lines.join('\n');
}

function chart(data,state){
  const series=fryingSeries(data,state.metric,state.mode),metric=data.metrics.find(m=>m.id===state.metric);
  const L=51,R=473,T=39,B=254,x=c=>L+c/20*(R-L);
  const highest=Math.max(...series.flatMap(s=>s.points.map(p=>p.upper??p.value)));
  const magnitude=10**Math.floor(Math.log10(highest)),top=Math.ceil(highest/magnitude*1.12*2)*magnitude/2;
  const y=v=>B-v/top*(B-T);
  const grid=[0,top/2,top].map(v=>`<path class="frying-grid" d="M${L},${y(v)}H${R}"/><text x="${L-9}" y="${y(v)+4}" text-anchor="end">${fmt(v,2)}</text>`).join('');
  const guides=cycles.map(c=>`<text x="${x(c)}" y="${B+24}" text-anchor="middle">${c}</text>`).join('');
  const shapes=series.map((s,i)=>`<g class="frying-oil-${s.oilId}"><path class="frying-line" d="${s.points.map((p,j)=>`${j?'L':'M'}${x(p.cycle)},${y(p.value)}`).join(' ')}"/>${s.points.map(p=>{
    const px=x(p.cycle),py=y(p.value),r=p.cycle===state.cycle?6:4;
    const error=state.mode==='absolute'?`<path class="frying-error" d="M${px},${y(p.lower)}V${y(p.upper)} M${px-4},${y(p.lower)}h8 M${px-4},${y(p.upper)}h8"/>`:'';
    return error+(i===0?`<circle class="frying-dot" cx="${px}" cy="${py}" r="${r}"/>`:`<path class="frying-dot" d="M${px},${py-r-1}l${r+1},${r+1}l-${r+1},${r+1}l-${r+1},-${r+1}Z"/>`);
  }).join('')}</g>`).join('');
  const targets=cycles.map(c=>`<rect data-frying-cycle="${c}" class="frying-hit" x="${Math.max(L-12,x(c)-34)}" y="${T}" width="${c===0||c===20?46:68}" height="${B-T+33}"><title>查看第 ${c} 次</title></rect>`).join('');
  return `<svg viewBox="0 0 512 315" role="img" aria-label="${esc(metric.label)}：大豆油與芥花油在五個取樣點的${state.mode==='absolute'?'平均值與標準差':'起始均值比'}；可用下方選單選點"><text x="${L}" y="19">${esc(state.mode==='absolute'?metric.unit:'各油自己的起始均值 = 1 倍')}</text>${grid}<path class="frying-selected" d="M${x(state.cycle)},${T}V${B}"/>${shapes}${guides}<text x="${R}" y="306" text-anchor="end">油炸次數</text>${targets}</svg>`;
}

function options(selected){return cycles.map(c=>`<option value="${c}" ${c===selected?'selected':''}>${c===0?'0 次 · 尚未油炸':`${c} 次`}</option>`).join('');}

/** Published means only; controls never interpolate a new measurement or fit a rate. */
export function mountFryingDataLab(container,id=FRYING_LAB_ID,{fetcher=globalThis.fetch,draftOwner,draftKey=FRYING_LAB_ID,onSaveSummary}={}){
  if(!container||typeof container.querySelector!=='function'||typeof container.addEventListener!=='function')throw new TypeError('A DOM container is required');
  if(id!==FRYING_LAB_ID)throw new RangeError('Unknown frying activity');
  const prefix='frying-'+(++instance),state=draftFor(draftOwner,draftKey);
  const $=s=>container.querySelector(s),abort=new AbortController();
  let disposed=false,data=null,historyVersion='';
  container.innerHTML='<p class="frying-loading" role="status">正在讀取已發表的炸油量測值…</p>';

  function render(){
    container.innerHTML=`<section class="food-experiment frying-lab" aria-labelledby="${prefix}-title"><header class="food-exp-heading"><p class="food-exp-kicker">實測資料 · Lee et al., 2021</p><h3 id="${prefix}-title">同一段油炸歷程，換個指標看。</h3><p class="food-exp-hint">180°C · 每次 10 分鐘 · 每次平均補入 100 mL 新油</p></header>
    <div class="frying-toolbar"><label for="${prefix}-metric">觀察指標<select id="${prefix}-metric" data-frying-input="metric">${data.metrics.map(m=>`<option value="${esc(m.id)}">${esc(m.label)}</option>`).join('')}</select></label><div class="frying-views" role="group" aria-label="比較基準"><button type="button" data-frying-mode="absolute">原值</button><button type="button" data-frying-mode="ratio">起始比</button></div></div>
    <p class="frying-definition"></p><div class="frying-layout"><div class="frying-stage"><div class="frying-plot"></div><p class="frying-legend"><span class="frying-soy">● 大豆油</span><span class="frying-canola">◆ 芥花油</span></p><p class="frying-caption"></p></div><div class="frying-panel"><label for="${prefix}-cycle">查看取樣點<select id="${prefix}-cycle" data-frying-input="cycle">${options(state.cycle)}</select></label><div class="frying-readings" aria-live="polite"></div><p class="frying-equation"></p><p class="frying-boundary"></p></div></div>
    <div class="frying-record-actions"><button type="button" class="button-secondary" data-frying-action="record">記下觀察</button><span data-frying-record-count></span></div>
    <details class="frying-details frying-comparison" data-frying-panel="comparison"><summary>比較兩個取樣點</summary><div class="frying-detail-body"><label class="frying-from" for="${prefix}-from">比較起點<select id="${prefix}-from" data-frying-input="from">${options(state.from)}</select></label><p class="frying-comparison-heading"></p><div class="frying-comparison-results"></div><p class="frying-stat-scope">字母只比較同一油種、同一指標的取樣點。Tukey，p &lt; 0.05；共享字母表示原表未標為顯著不同，不表示數值相等。</p></div></details>
    <details class="frying-details frying-journal" data-frying-panel="journal"><summary>我的文字、觀察與保存</summary><div class="frying-detail-body"><label for="${prefix}-writing">目前觀察／修訂<textarea id="${prefix}-writing" data-frying-writing rows="3" placeholder="寫下指標、比較基準與判讀界線。"></textarea></label><label for="${prefix}-history">回看紀錄<select id="${prefix}-history" data-frying-history></select></label><pre data-frying-review></pre><label for="${prefix}-summary">本次將附加的摘要<textarea id="${prefix}-summary" data-frying-summary rows="7" readonly></textarea></label>${typeof onSaveSummary==='function'?'<button type="button" class="button-secondary" data-frying-action="save">附加到本課筆記</button>':''}<p data-frying-save-status role="status"></p><p class="frying-journal-scope">回看紀錄不會改寫目前文字。同一頁內離開再回來可接續；重新載入前請附加到筆記並匯出。圖從載入起即顯示所有取樣點，紀錄不代表盲測或學習成效。</p></div></details>
    <details class="frying-details" data-frying-panel="table"><summary>查看原表與量測方法</summary><div class="frying-detail-body"><p class="frying-method"></p><div class="frying-table-scroll" tabindex="0" role="region" aria-label="目前指標原表，可橫向捲動"><table><caption class="frying-table-caption"></caption><thead><tr><th scope="col">油炸次數</th><th scope="col">大豆油</th><th scope="col">芥花油</th></tr></thead><tbody class="frying-table-body"></tbody></table></div><p class="frying-stat-scope">均值 ± SD；括號為原表統計字母。作者報告三次分析，未明示三批獨立油炸。SD 不是信賴區間，字母也不能跨油種比較。</p></div></details>
    <details class="frying-details" data-frying-panel="source"><summary>研究條件與資料來源</summary><div class="frying-detail-body"><p>1 L 油，每次炸 100 g 冷凍薯條；180°C、10 分鐘、開蓋。第 5、10、15、20 次取樣，且每次油炸後平均補 100 mL 新油。這是有取樣、補油與食物交換的歷程。</p><p>只比較本研究的兩個油樣與五個取樣點。沒有原始重複值或過氧化價，不能重算跨油顯著性、TOTOX、純反應速率或可安全使用次數。</p><p><a href="${esc(data.source.url)}" target="_blank" rel="noopener noreferrer">${esc(data.source.title)} ↗</a><br>${esc(data.source.authors.join('; '))} · ${data.source.year} · ${esc(data.source.table)}<br>數值轉錄與圖形重繪，<a href="${esc(data.source.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(data.source.license)}</a>。保留表格精度，沒有以正文額外小數覆寫。</p></div></details></section>`;
    for(const key of panelKeys)$(`[data-frying-panel="${key}"]`).open=state.open[key];
    if(state.savedSignature===null)state.savedSignature=JSON.stringify(snapshot());
    container.addEventListener('input',input);container.addEventListener('toggle',toggle,true);
    draw();
  }
  function syncPanels(){
    for(const key of panelKeys){const panel=$(`[data-frying-panel="${key}"]`);if(!panel)continue;state.open[key]=panel.open;if(key!=='journal'&&panel.open)state.seen[key]=true;}
  }
  function snapshot(){
    syncPanels();const metric=data.metrics.find(m=>m.id===state.metric);
    return {metric:state.metric,metricLabel:metric.label,unit:metric.unit,mode:state.mode,cycle:state.cycle,from:state.from,writing:state.writing,seen:{...state.seen},
      readings:fryingSeries(data,state.metric,state.mode).map(s=>{const p=s.points.find(p=>p.cycle===state.cycle);return {oilId:s.oilId,label:s.label,meanText:p.meanText,sdText:p.sdText,letters:p.letters,value:p.value,baselineMeanText:s.points[0].meanText};}),
      comparisons:state.open.comparison?data.oils.map(oil=>({label:oil.label,...fryingComparison(data,state.metric,oil.id,state.from,state.cycle)})):null};
  }
  function pending(){
    const current=snapshot(),signature=JSON.stringify(current),unappended=state.records.slice(state.cursor),parts=unappended.map(item=>`觀察 ${item.sequence}\n${snapshotText(item.snapshot)}`);
    if(signature!==state.savedSignature&&unappended.at(-1)?.signature!==signature)parts.push(`目前草稿\n${snapshotText(current)}`);
    const text=parts.length?['【炸油量測工作台｜新增紀錄】',...parts,...(!state.savedVersions.length?[`來源：${data.source.url}｜${data.source.table}｜${data.source.license}`,'判讀界線：刊載均值與 SD；起始比沒有配對重複值誤差。字母限同油同指標，不能重算跨油顯著性、TOTOX、純反應速率或安全使用次數。']:[])].join('\n\n'):'';
    return {text,cursor:state.records.length,signature};
  }
  function drawJournal(){
    if(disposed||!data||!$('[data-frying-writing]'))return;
    const writing=$('[data-frying-writing]');if(writing.value!==state.writing)writing.value=state.writing;
    $('[data-frying-record-count]').textContent=state.records.length?`已記下 ${state.records.length} 筆觀察`:'';
    const history=$('[data-frying-history]'),version=`${state.records.length}|${state.savedVersions.length}`;
    if(historyVersion!==version){const focused=container.ownerDocument?.activeElement===history;history.innerHTML='<option value="">選擇一筆紀錄</option>'+state.records.map(item=>`<option value="record-${item.sequence}">觀察 ${item.sequence} · ${esc(item.snapshot.metricLabel)} · ${item.snapshot.cycle} 次</option>`).join('')+state.savedVersions.map((item,i)=>`<option value="saved-${i+1}">已附加摘要 ${i+1}</option>`).join('');historyVersion=version;if(focused)history.focus();}history.value=state.review;
    const record=state.records.find(item=>`record-${item.sequence}`===state.review),saved=state.savedVersions.find((item,i)=>`saved-${i+1}`===state.review);
    $('[data-frying-review]').textContent=record?snapshotText(record.snapshot):saved?saved.text:'尚未選取紀錄；目前文字持續保留。';
    const next=pending();$('[data-frying-summary]').value=next.text;
    $('[data-frying-save-status]').textContent=state.status||(!next.text?'沒有尚未附加的新紀錄。':next.text.length>10000?'摘要超過 10,000 字，尚未保存；完整文字保留，可自行複製。':'附加時只新增尚未保存的觀察與變更。');
    const button=$('[data-frying-action="save"]');if(button)button.disabled=state.saving||!next.text;
  }
  async function save(){
    if(state.saving||typeof onSaveSummary!=='function')return;const next=pending();
    if(!next.text)return;
    if(next.text.length>10000){state.status='摘要超過 10,000 字，未送出、未截斷；完整文字保留，可自行複製。';drawJournal();return;}
    state.saving=true;state.status='正在附加…';drawJournal();let success=false;
    try{success=await onSaveSummary(next.text)===true;}catch{}
    state.saving=false;
    if(success){state.cursor=next.cursor;state.savedSignature=next.signature;state.savedVersions.push(immutable({text:next.text}));state.status='已附加這批新增紀錄；其他新修改仍保留。';}
    else state.status='附加未成功；全部觀察與文字仍保留，可重試。';
    for(const update of state.views)update();
  }
  function draw(){
    const metric=data.metrics.find(m=>m.id===state.metric),series=fryingSeries(data,state.metric,state.mode);
    $('[data-frying-input="metric"]').value=state.metric;
    $('[data-frying-input="cycle"]').value=String(state.cycle);
    $('[data-frying-input="from"]').value=String(state.from);
    for(const mode of ['absolute','ratio'])$(`[data-frying-mode="${mode}"]`).setAttribute('aria-pressed',String(state.mode===mode));
    $('.frying-definition').textContent=metric.definition;
    $('.frying-plot').innerHTML=chart(data,state);
    $('.frying-caption').textContent=state.mode==='absolute'?'點：刊載均值；柱線：± SD。虛線只幫助讀圖，不代表中間次數的量測。':'點：各油的刊載均值比。缺少配對重複值，不畫比值誤差；虛線只幫助讀圖。';
    $('.frying-readings').innerHTML=series.map(s=>{
      const p=s.points.find(p=>p.cycle===state.cycle);
      return `<div class="frying-reading frying-oil-${s.oilId}"><span>${s.oilId==='soybean'?'●':'◆'} ${esc(s.label)}</span><strong>${esc(state.mode==='absolute'?p.meanText:fmt(p.value))}<small>${esc(state.mode==='absolute'?metric.unit:'倍')}</small></strong><span>${state.mode==='absolute'?`± ${esc(p.sdText)} SD`:`${esc(p.meanText)} / ${esc(s.points[0].meanText)}`}</span></div>`;
    }).join('');
    $('.frying-equation').textContent=state.mode==='absolute'?'刊載結果 = 均值 ± 標準差':'起始比 = 本次均值 / 同油 0 次均值';
    $('.frying-boundary').textContent=metric.boundary;
    $('.frying-method').textContent=metric.method;
    $('.frying-table-caption').textContent=`Table 1 · ${metric.label} · ${metric.unit}`;
    $('.frying-table-body').innerHTML=cycles.map((c,i)=>`<tr ${c===state.cycle?'class="is-selected"':''}><th scope="row">${c}</th>${series.map(s=>{const p=s.points[i];return `<td>${esc(p.meanText)} ± ${esc(p.sdText)} <span>(${esc(p.letters)})</span></td>`;}).join('')}</tr>`).join('');
    $('.frying-comparison-heading').textContent=`同一油種：${state.from} 次 → ${state.cycle} 次`;
    const differenceUnit=state.metric==='tpc'?'百分點':metric.unit;
    $('.frying-comparison-results').innerHTML=series.map(s=>{
      const c=fryingComparison(data,state.metric,s.oilId,state.from,state.cycle);
      const status=c.significance==='same-point'?'同一個取樣點':c.significance==='different'?'沒有共享字母；表中標為顯著不同':'共享字母；表中未標為顯著不同';
      return `<article><h4>${esc(s.label)}</h4><dl><div><dt>均值差</dt><dd>${signed(c.difference)} ${esc(differenceUnit)}</dd></div><div><dt>終點 / 起點</dt><dd>${fmt(c.ratio)} 倍</dd></div><div><dt>相對改變</dt><dd>${signed(c.percentChange)}%</dd></div></dl><p>原表 ${esc(c.from.letters)} → ${esc(c.to.letters)}<br>${status}</p></article>`;
    }).join('');
    drawJournal();
  }
  function change(event){
    if(disposed||!data)return;
    if(event.target?.matches?.('[data-frying-history]')){const value=event.target.value;if(!value||state.records.some(item=>`record-${item.sequence}`===value)||state.savedVersions.some((item,i)=>`saved-${i+1}`===value)){state.review=value;drawJournal();}return;}
    const target=event.target,name=target?.dataset?.fryingInput;
    if(name==='metric'&&data.metrics.some(m=>m.id===target.value))state.metric=target.value;
    else if(['cycle','from'].includes(name)&&cycles.map(String).includes(target.value))state[name]=Number(target.value);
    else return;
    state.status='';draw();
  }
  function click(event){
    if(disposed||!data)return;
    const target=event.target?.closest?.('[data-frying-mode],[data-frying-cycle],[data-frying-action]');
    if(!target)return;
    if(target.dataset.fryingAction==='record'){const current=immutable(snapshot());state.records.push(immutable({sequence:state.records.length+1,snapshot:current,signature:JSON.stringify(current)}));state.review=`record-${state.records.length}`;state.status='已記下這筆觀察；附加到筆記後才納入匯出。';drawJournal();return;}
    if(target.dataset.fryingAction==='save'){void save();return;}
    if(['absolute','ratio'].includes(target.dataset.fryingMode))state.mode=target.dataset.fryingMode;
    else if(cycles.map(String).includes(target.dataset.fryingCycle))state.cycle=Number(target.dataset.fryingCycle);
    else return;
    state.status='';draw();
  }
  function input(event){if(disposed||!data||!event.target?.matches?.('[data-frying-writing]'))return;state.writing=event.target.value;state.status='';drawJournal();}
  function toggle(event){if(disposed||!data||!panelKeys.includes(event.target?.dataset?.fryingPanel)||!container.contains(event.target))return;syncPanels();state.status='';drawJournal();}
  state.views.add(drawJournal);
  container.addEventListener('change',change);container.addEventListener('click',click);
  const ready=(async()=>{
    try {
      const response=await fetcher('./data/frying-measurements.json',{signal:abort.signal});
      if(disposed)return;
      if(!response.ok)throw new Error('無法讀取資料檔');
      const loaded=await response.json();
      if(disposed)return;
      data=validateFryingData(loaded);render();
    } catch {
      if(!disposed)container.innerHTML='<p class="frying-load-error" role="alert">炸油量測資料無法載入或格式不完整。請重新整理頁面；目前沒有以示意數字代替。</p>';
    }
  })();
  const dispose=()=>{if(!disposed&&data)syncPanels();disposed=true;state.views.delete(drawJournal);abort.abort();container.removeEventListener('change',change);container.removeEventListener('click',click);container.removeEventListener('input',input);container.removeEventListener('toggle',toggle,true);};
  dispose.ready=ready;
  return dispose;
}
