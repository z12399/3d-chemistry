import {escapeHTML as esc} from './storage.js';
import {enzymeProgress,inhibitionKinetics,fitMichaelisMenten,fitLineweaverBurk} from './enzyme-kinetics-model.js';

export const ENZYME_KINETICS_IDS=Object.freeze(['enzyme-initial-rate','enzyme-inhibition-map','enzyme-kinetic-fit']);
const fmt=(x,d=3)=>x===null||!Number.isFinite(x)?'—':Number(x.toFixed(d)).toLocaleString('en-US',{maximumFractionDigits:d});
const curve=(n,fn)=>Array.from({length:n},(_,i)=>fn(i/(n-1)));
const range=(key,label,min,max,step,value,unit='')=>`<label class="enzyme-range">${label}<output data-enzyme-output="${key}">${fmt(value)} ${unit}</output><input type="range" data-enzyme-control="${key}" aria-label="${label}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
const select=(key,label,options,value)=>`<label class="enzyme-select">${label}<select data-enzyme-control="${key}" aria-label="${label}">${options.map(([k,t])=>`<option value="${k}"${k===value?' selected':''}>${t}</option>`).join('')}</select></label>`;
const details=(title,body)=>`<details class="enzyme-details"><summary>${title}</summary><div>${body}</div></details>`;
const metrics=entries=>entries.map(([name,value,unit])=>`<div><span>${name}</span><strong>${value}</strong><small>${unit}</small></div>`).join('');
const scheme='<p class="enzyme-equation">E + S ⇌ ES → E + P</p>';
const diagnosticLabels={
  'km-lower-bound':'Km 碰到搜尋下界','km-upper-bound':'Km 碰到搜尋上界','bounded-optimum':'最佳值受搜尋界限限制',
  'substrate-range-below-km':'濃度皆遠低於估計 Km','substrate-range-above-km':'濃度皆遠高於估計 Km',
  'correlated-parameter-sensitivities':'兩參數變動的效果難以分開','numerically-collinear-sensitivities':'兩參數的數值效果無法分開',
  'no-residual-degrees-of-freedom':'沒有剩餘自由度估計誤差','no-positive-substrate':'沒有正受質濃度',
  'single-positive-substrate-level':'只有一種正受質濃度','zero-vmax':'最佳 Vmax 為零，Km 無法辨識',
  'zero-substrate-observations':'包含零受質觀測','negative-rate-observations':'包含負速率觀測'
};

function graph({xmax,ymin=0,ymax,xlabel,ylabel,title},content){
  const left=66,top=40,w=624,h=272;
  const g={x:v=>left+w*v/xmax,y:v=>top+h*(ymax-v)/(ymax-ymin)};
  const ticks=Array.from({length:6},(_,i)=>i/5);
  return `<svg class="enzyme-chart" viewBox="0 0 720 380" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><text x="18" y="20" class="enzyme-axis-title">${esc(ylabel)}</text>${ticks.map(t=>`<path d="M${left} ${g.y(ymin+t*(ymax-ymin))}H690" class="enzyme-grid"/><text x="54" y="${g.y(ymin+t*(ymax-ymin))+4}" text-anchor="end">${fmt(ymin+t*(ymax-ymin),2)}</text><text x="${g.x(t*xmax)}" y="337" text-anchor="middle">${fmt(t*xmax,2)}</text>`).join('')}<path d="M${left} ${top}V312H690" class="enzyme-axis"/>${content(g)}<text x="378" y="368" text-anchor="middle" class="enzyme-axis-title">${esc(xlabel)}</text></svg>`;
}
const path=(points,g,css='enzyme-line')=>`<path class="${css}" d="${points.map(([x,y],i)=>`${i?'L':'M'}${g.x(x).toFixed(3)},${g.y(y).toFixed(3)}`).join(' ')}"/>`;
const point=(x,y,g,css='enzyme-point')=>`<circle class="${css}" cx="${g.x(x)}" cy="${g.y(y)}" r="4.5"/>`;
const owners=new WeakMap(),mounted=new WeakMap();
const initial=Object.freeze({s0:4,vmax:1,start:0,end:1,mode:'competitive',inhibitor:1,kiPrime:2,plot:'rate',group:'treated',subset:'all',method:'manual',guessKm:.1,guessVmax:200});
const ranges=Object.freeze({s0:[1,10],vmax:[.2,2],start:[0,9.9],end:[.1,10],inhibitor:[0,4],kiPrime:[.25,4],guessKm:[.005,.3],guessVmax:[50,300]});
const choices=Object.freeze({mode:['none','competitive','pure-noncompetitive','uncompetitive','mixed'],plot:['rate','reciprocal'],group:['treated','untreated'],subset:['all','low','high'],method:['manual','nonlinear','reciprocal']});
const controlsByActivity=Object.freeze({'enzyme-initial-rate':['s0','vmax','start','end'],'enzyme-inhibition-map':['mode','inhibitor','kiPrime'],'enzyme-kinetic-fit':['group','subset','method','guessKm','guessVmax']});
const loadError='<p class="enzyme-loading" role="alert">資料未能載入，請重新整理。沒有以模型生成值替代實測。</p>';
function stateFrom(saved){
  const state={...initial};
  for(const [key,[low,high]] of Object.entries(ranges))if(Number.isFinite(saved?.[key])&&saved[key]>=low&&saved[key]<=high)state[key]=saved[key];
  for(const [key,values] of Object.entries(choices))if(values.includes(saved?.[key]))state[key]=saved[key];
  if(state.start>=state.end){state.start=initial.start;state.end=initial.end;}
  return state;
}
function draftFor(owner,key,id){
  const fresh=()=>({state:{...initial},details:{},loadError:false,active:null});
  if(owner===null||!['object','function'].includes(typeof owner))return fresh();
  let lessons=owners.get(owner);if(!lessons)owners.set(owner,lessons=new Map());
  let activities=lessons.get(key);if(!activities)lessons.set(key,activities=new Map());
  if(!activities.has(id))activities.set(id,fresh());return activities.get(id);
}
let serial=0;
export function mountEnzymeKinetics(container,id,{draftOwner,draftKey=id}={}){
  if(!ENZYME_KINETICS_IDS.includes(id))throw new RangeError('Unknown enzyme activity');
  const draft=draftFor(draftOwner,draftKey,id);mounted.get(container)?.();draft.active?.();
  const prefix=`enzyme-${++serial}`,$=s=>container.querySelector(s);
  const state=draft.state=stateFrom(draft.state);
  let measured=null,disposed=false;
  const title=id==='enzyme-initial-rate'?'同一條曲線，哪一段才接近初速？':id==='enzyme-inhibition-map'?'曲線變了，兩個參數怎麼變？':'讓曲線接受資料的檢查。';
  const hint=id==='enzyme-initial-rate'?'從準穩態已建立後的模型 t = 0 起算，移動時間窗，比較窗口斜率與模型初速；不呈現混合後的 ES 建立期。':id==='enzyme-inhibition-map'?'先指定簡單可逆抑制模型，再由假設的 E／ES 結合關係推演表觀 Km 與 Vmax；曲線本身不能證實結合位置。':'先自己調一條線，再比較兩種估計方法。每一個點都保留。';
  container.innerHTML=`<section class="food-experiment enzyme-experiment" aria-labelledby="${prefix}"><header class="food-exp-heading"><p class="food-exp-kicker">READ THE EVIDENCE · 酵素動力學</p><h3 id="${prefix}">${title}</h3><p class="food-exp-hint">${hint}</p></header><div class="enzyme-toolbar"></div><div class="enzyme-stage"><div class="enzyme-plot" tabindex="0" role="region" aria-label="酵素圖表，可橫向捲動"></div><p class="enzyme-chart-caption"></p></div><div class="enzyme-controls"></div><div class="enzyme-metrics" aria-live="polite"></div><p class="enzyme-observation" aria-live="polite"></p><div class="enzyme-formula"></div><div class="enzyme-more"></div></section>`;
  if(id==='enzyme-initial-rate'){
    $('.enzyme-toolbar').innerHTML='<span class="enzyme-tag">指定模型 · 準穩態後起算 · 無實測雜訊</span><span>Km = 1 mM · 時間 0–10 min</span>';
    $('.enzyme-controls').innerHTML=`<div class="enzyme-window-presets" role="group" aria-label="選擇觀察時間窗"><button type="button" data-enzyme-window="early">早期 0–1 min</button><button type="button" data-enzyme-window="whole">全程 0–10 min</button><button type="button" data-enzyme-window="late">後期 5–10 min</button></div><div class="enzyme-control-grid">${range('start','窗口起點',0,9.9,.1,0,'min')}${range('end','窗口終點',.1,10,.1,1,'min')}${range('s0','起始受質 S₀',1,10,.5,4,'mM')}${range('vmax','指定 Vmax',.2,2,.1,1,'mM/min')}</div>`;
    $('.enzyme-formula').innerHTML=scheme+'<p>本題的累積式：S₀ − S + Km ln(S₀ / S) = Vmax · t；P = S₀ − S</p>';
    $('.enzyme-more').innerHTML=details('為什麼窗口斜率不等於起始速率？','<p>帶色區內取21個等距的模型觀測點，用有自由截距的直線擬合 P 對 t。這是窗口平均趨勢；t = 0 的模型導數為 Vmax S₀ / (Km + S₀)。即使沒有量測雜訊，窗口拉長也會因受質耗損而偏離初速。</p><p>本題從準穩態之後的形式 t = 0 起算，假設酵素活性固定、不可逆、無產物抑制、無混合延遲或檢測器飽和。10%耗損是常見觀察提示，不能單獨證明真實實驗符合初速條件。</p><div data-enzyme-window-table></div>')+details('來源與適用範圍','<p>這是指定參數的單受質教學曲線，不能當成真實食品的轉化時間。</p><a href="https://www.ncbi.nlm.nih.gov/sites/books/NBK92007/" target="_blank" rel="noopener noreferrer">Assay Guidance Manual · 初速、進程曲線與估計 ↗</a>');
  }else if(id==='enzyme-inhibition-map'){
    $('.enzyme-toolbar').innerHTML=select('mode','指定抑制模型',[['none','無抑制'],['competitive','競爭抑制'],['pure-noncompetitive','純非競爭抑制'],['uncompetitive','反競爭抑制'],['mixed','混合抑制']],'competitive')+'<span>基準 Km = 1 mM · Vmax = 1 mM/min</span>';
    $('.enzyme-controls').innerHTML=`<div class="enzyme-window-presets" role="group" aria-label="曲線座標"><button type="button" data-enzyme-plot="rate">速率曲線</button><button type="button" data-enzyme-plot="reciprocal">雙倒數比較</button></div><div class="enzyme-control-grid"><div data-enzyme-inhibitor>${range('inhibitor','游離抑制劑 [I]',0,4,.1,1,'mM')}</div><div data-enzyme-prime>${range('kiPrime','ES 的 Ki′',.25,4,.25,2,'mM')}</div></div><p class="enzyme-binding" data-enzyme-binding></p>`;
    $('.enzyme-formula').innerHTML='<p class="enzyme-equation">v = Vmax [S] / (α Km + α′[S])</p><p>Km,app = α Km / α′；Vmax,app = Vmax / α′</p>';
    $('.enzyme-more').innerHTML=details('從結合關係讀懂 α 與 α′','<p>基準 Ki = 1 mM。抑制劑可與游離 E 結合時 α = 1 + [I]/Ki；可與 ES 結合時 α′ = 1 + [I]/Ki′；不結合的一側係數為1。純非競爭指定 Ki′ = Ki，不使用混合模型的滑桿值。</p><p>競爭：α′ = 1；反競爭：α = 1；純非競爭：α = α′；混合：兩側都可結合，親和力可不同。因此「結合活性位以外」不能單獨判定純非競爭。</p><p>雙倒數式：1/v = (α Km / Vmax)(1/[S]) + α′/Vmax。本圖是已知參數模型的直線比較；零受質不能取倒數，也不能因線看起來較直就認為實測參數更可靠。</p>')+details('來源與適用範圍','<p>此式限所指定的簡單、完全、快速可逆抑制模型，游離[I]近似設定值；沒有tight binding、時間相依、部分抑制或協同性。沒有由曲線位置反推實際結合口袋。</p><a href="https://www.ncbi.nlm.nih.gov/sites/books/NBK92001/" target="_blank" rel="noopener noreferrer">Assay Guidance Manual · 抑制機制與分析 ↗</a>');
  }else{
    $('.enzyme-toolbar').innerHTML=select('group','歷史資料組別',[['treated','treated 組 · 12 筆'],['untreated','untreated 組 · 11 筆']],'treated')+'<span class="enzyme-tag">R Puromycin · 公開量測資料</span>';
    $('.enzyme-controls').innerHTML=`<div class="enzyme-fit-options">${select('subset','用哪些濃度估計',[['all','全部濃度'],['low','只用低濃度 ≤ 0.11 ppm'],['high','只用高濃度 ≥ 0.22 ppm']],'all')}${select('method','曲線來源',[['manual','手動試線'],['nonlinear','原尺度非線性擬合'],['reciprocal','雙倒數線性擬合']],'manual')}</div><div class="enzyme-control-grid" data-enzyme-manual>${range('guessKm','手動 Km',.005,.3,.001,.1,'ppm')}${range('guessVmax','手動 Vmax',50,300,1,200,'counts/min/min')}</div>`;
    $('.enzyme-formula').innerHTML='<p class="enzyme-equation">v = Vmax [S] / (Km + [S])</p><p>原尺度 SSE = Σ(觀測速率 − 曲線速率)²；RMSE = √(SSE / n)</p>';
    $('.enzyme-more').innerHTML=details('看殘差與兩種估計方法','<p>殘差 = 觀測 − 預測。重複點逐筆保留、同權重；這個假設不保證適合所有誤差結構。雙倒數回歸最小化的是倒數尺度誤差，下表一律回到原速率尺度比較，不能混用兩種SSE。</p><div data-enzyme-fit-comparison></div><div data-enzyme-residual-chart></div><p data-enzyme-fit-diagnostic></p>')+details('完整資料與可重查的來源','<p>這組23點由 R datasets 發布，來源指向 Treloar（1974）與 Bates、Watts（1988）。原始研究是 Golgi 膜半乳糖轉移酶相關資料；本平台實讀 R 說明與完整數值，未獨立取得原學位論文。</p><p>受質是 ppm；速率是放射產物訊號推得的 counts/min/min。沒有莫耳校正或活性位濃度，不能算 kcat，也不能將兩組差異直接分類成某種抑制。它是資料判讀練習，不是食品酵素或安全製程的測定。</p><div data-enzyme-data-table></div><a href="https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/Puromycin.html" target="_blank" rel="noopener noreferrer">R 官方說明 ↗</a> · <a href="https://svn.r-project.org/R/trunk/src/library/datasets/data/Puromycin.R" target="_blank" rel="noopener noreferrer">逐筆原始數值 ↗</a>');
    $('.enzyme-plot').innerHTML='<p class="enzyme-loading" role="status">正在載入逐筆量測資料…</p>';
  }
  const panels=Array.from(container.querySelectorAll('.enzyme-details'));
  panels.forEach((node,index)=>{const key=String(index);node.open=!!draft.details[key];node.ontoggle=()=>{if(!disposed)draft.details[key]=node.open;};});
  if(id==='enzyme-kinetic-fit'&&draft.loadError)$('.enzyme-plot').innerHTML=loadError;
  function outputs(){
    container.querySelectorAll('[data-enzyme-control]').forEach(node=>node.value=state[node.dataset.enzymeControl]);
    const manual=$('[data-enzyme-manual]');if(manual)manual.hidden=state.method!=='manual';
    container.querySelectorAll('[data-enzyme-output]').forEach(o=>{const k=o.dataset.enzymeOutput;const unit=k==='start'||k==='end'?'min':k==='guessKm'?'ppm':k==='guessVmax'?'counts/min/min':k==='vmax'?'mM/min':'mM';o.textContent=`${fmt(state[k])} ${unit}`;});
  }
  function drawProgress(){
    const r=enzymeProgress({s0:state.s0,km:1,vmax:state.vmax,duration:10,points:121,windowStart:state.start,windowEnd:state.end,windowPoints:21}),win=r.window;
    $('.enzyme-plot').innerHTML=graph({xmax:10,ymax:state.s0,xlabel:'時間 t / min',ylabel:'產物 P / mM',title:`產物隨時間增加，選取${fmt(state.start)}至${fmt(state.end)}分鐘的斜率`},g=>`<rect x="${g.x(state.start)}" y="40" width="${g.x(state.end)-g.x(state.start)}" height="272" class="enzyme-window"/>${path(r.series.map(p=>[p.time,p.product]),g)}${path([[state.start,win.ols.intercept+win.ols.slope*state.start],[state.end,win.ols.intercept+win.ols.slope*state.end]],g,'enzyme-fit-line')}${path([[0,0],[Math.min(10,state.s0/r.initialVelocity),Math.min(state.s0,10*r.initialVelocity)]],g,'enzyme-baseline')}`);
    $('.enzyme-chart-caption').textContent='綠線：模型進程　銅線：窗口直線　虛線：起始切線';
    $('.enzyme-metrics').innerHTML=metrics([['窗口斜率',fmt(win.ols.slope),'mM/min'],['模型初速',fmt(r.initialVelocity),'mM/min'],['窗口終點耗損',win.endState.depletionFraction>=.9995?'>99.9%':`${fmt(win.endState.depletionFraction*100,1)}%`,'相對起始受質']]);
    const ratio=win.ols.slope/r.initialVelocity;
    $('.enzyme-observation').textContent=`這段窗口斜率為起始速率的 ${fmt(ratio*100,1)}%。${state.start>0?'窗口從反應開始之後才取樣；直線很平整也不代表量到初速。':win.endState.depletionFraction>.1?'窗口終點已超過10%受質耗損，初速近似需要更仔細檢查。':'早期窗口較接近起始切線；真實量測還要確認混合、空白和檢測器線性。'}`;
    $('[data-enzyme-window-table]').innerHTML=`<p>窗口起點 P = ${fmt(win.startState.product)} mM；終點 P = ${fmt(win.endState.product)} mM。OLS 截距 ${fmt(win.ols.intercept)} mM，不強制穿原點。</p>`;
  }
  function drawInhibition(){
    const evalAt=s=>inhibitionKinetics({substrate:s,km:1,vmax:1,inhibitor:state.inhibitor,ki:1,kiPrime:state.kiPrime,mode:state.mode}),r=evalAt(1);
    $('[data-enzyme-inhibitor]').hidden=state.mode==='none';$('[data-enzyme-prime]').hidden=!['mixed','uncompetitive'].includes(state.mode);
    container.querySelectorAll('[data-enzyme-plot]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.enzymePlot===state.plot)));
    if(state.plot==='rate')$('.enzyme-plot').innerHTML=graph({xmax:10,ymax:1,xlabel:'受質 [S] / mM',ylabel:'初速 v / (mM/min)',title:'指定抑制模型與無抑制模型的初速曲線'},g=>path(curve(121,t=>[t*10,t*10/(1+t*10)]),g,'enzyme-baseline')+path(curve(121,t=>[t*10,evalAt(t*10).velocity]),g));
    else $('.enzyme-plot').innerHTML=graph({xmax:4,ymax:r.lineweaverBurk.slope*4+r.lineweaverBurk.intercept,xlabel:'1/[S] / mM⁻¹',ylabel:'1/v / (min/mM)',title:'雙倒數直線的斜率與截距比較'},g=>path([[0,1],[4,5]],g,'enzyme-baseline')+path([[0,r.lineweaverBurk.intercept],[4,r.lineweaverBurk.slope*4+r.lineweaverBurk.intercept]],g));
    $('.enzyme-chart-caption').textContent=state.plot==='rate'?'綠線：目前設定　虛線：無抑制基準':'綠線：目前設定　虛線：無抑制；x = 0 是外推到無限受質的截距。';
    $('.enzyme-metrics').innerHTML=metrics([['表觀 Km',fmt(r.apparentKm),'mM'],['表觀 Vmax',fmt(r.apparentVmax),'mM/min'],['α ／ α′',`${fmt(r.alpha)} ／ ${fmt(r.alphaPrime)}`,'由所選結合模型決定']]);
    const texts={none:'E + S ⇌ ES → E + P',competitive:'E + I ⇌ EI；抑制劑與受質互斥結合。',uncompetitive:'ES + I ⇌ ESI；本模型不與游離 E 結合。','pure-noncompetitive':'E + I ⇌ EI；ES + I ⇌ ESI；Ki′ = Ki。',mixed:'E + I ⇌ EI；ES + I ⇌ ESI；Ki 與 Ki′ 可不同。'};
    $('[data-enzyme-binding]').textContent=texts[state.mode];
    $('.enzyme-observation').textContent=state.mode==='mixed'?`此設定 α/α′ = ${fmt(r.alpha/r.alphaPrime)}，所以表觀 Km ${r.alpha===r.alphaPrime?'不變':r.alpha>r.alphaPrime?'提高':'降低'}。混合模型能呈現兩個方向，不能只背「Km一定上升」。`:state.mode==='uncompetitive'?'表觀 Km 與 Vmax 按同一比例下降；雙倒數圖的斜率不變。':state.mode==='competitive'?'Vmax 保持不變；提高受質濃度可減少此理想模型的相對抑制。':state.mode==='pure-noncompetitive'?'兩側結合同樣強，表觀 Km 不變，Vmax 降低；這是混合模型的一個特例。':'目前沒有抑制，回到基準 Michaelis–Menten 曲線。';
  }
  function drawFit(){
    if(!measured)return;
    const all=measured.points.filter(p=>p.group===state.group),included=p=>state.subset==='all'||(state.subset==='low'?p.substrate<=.11:p.substrate>=.22),used=all.filter(included);
    const nls=fitMichaelisMenten(used,{kmBounds:[.0001,10]}),lb=fitLineweaverBurk(used);
    const estimate=state.method==='nonlinear'?nls:state.method==='reciprocal'?lb:{km:state.guessKm,vmax:state.guessVmax};
    const valid=Number.isFinite(estimate.km)&&Number.isFinite(estimate.vmax)&&estimate.km>0&&estimate.vmax>=0;
    const predict=s=>estimate.vmax*s/(estimate.km+s);
    const residuals=valid?used.map(p=>p.velocity-predict(p.substrate)):[];
    const sse=valid?residuals.reduce((sum,v)=>sum+v*v,0):null;
    $('[data-enzyme-manual]').hidden=state.method!=='manual';
    $('.enzyme-plot').innerHTML=graph({xmax:1.1,ymax:Math.max(240,valid?Math.ceil(predict(1.1)/20)*20:0),xlabel:'受質 [S] / ppm',ylabel:'初速 v / (counts/min/min)',title:`${state.group}組原始速率點；本次使用${used.length}筆資料`},g=>(valid?path(curve(121,t=>[t*1.1,predict(t*1.1)]),g):'')+all.map(p=>point(p.substrate,p.velocity,g,included(p)?'enzyme-point':'enzyme-point excluded')).join(''));
    $('.enzyme-chart-caption').textContent=`${state.group} 組 ${all.length} 筆；本次使用 ${used.length} 筆。灰點只從估計中排除，沒有刪除原始資料。`;
    $('.enzyme-metrics').innerHTML=metrics([['Km',fmt(estimate.km,4),'ppm'],['Vmax',fmt(estimate.vmax,2),'counts/min/min'],['原尺度 RMSE',valid?fmt(Math.sqrt(sse/used.length),2):'—','counts/min/min']]);
    $('.enzyme-observation').textContent=!valid?'目前估計沒有可唯一識別的正 Km、非負 Vmax；不強行畫出參數曲線。':state.method==='manual'?'先觀察同濃度的散布，調整曲線後，再選「原尺度非線性擬合」比較。':state.method==='reciprocal'?'倒數變換改變誤差權重。請展開殘差比較，回到原速度尺度判讀。':`未加權非線性估計使用 ${used.length} 筆原始點。${nls.identifiability.status==='informative'?'局部數值檢查未亮旗，仍不代表機制被證明或已有可信區間。':'此範圍對參數的約束偏弱或碰到邊界，應查看診斷並補充濃度範圍。'}`;
    const cells=r=>`<td>${fmt(r.km,4)}</td><td>${fmt(r.vmax,2)}</td><td>${fmt(r.sse,2)}</td>`;
    $('[data-enzyme-fit-comparison]').innerHTML=`<div class="enzyme-table-wrap"><table><caption>同一批 ${used.length} 點、同一原速度尺度</caption><thead><tr><th>方法</th><th>Km / ppm</th><th>Vmax</th><th>SSE</th></tr></thead><tbody><tr><th>非線性</th>${cells(nls)}</tr><tr><th>雙倒數</th>${cells(lb)}</tr></tbody></table></div><p>非線性 Km 搜尋界限 0.0001–10 ppm，Vmax ≥ 0。雙倒數排除非正受質／速率的觀測；本次排除 ${lb.excluded.length} 筆。此資料各點皆為正值。</p>`;
    const extent=Math.max(1,...residuals.map(Math.abs))*1.15;
    $('[data-enzyme-residual-chart]').innerHTML=valid?graph({xmax:1.1,ymin:-extent,ymax:extent,xlabel:'受質 [S] / ppm',ylabel:'觀測 − 預測',title:'目前曲線在本次使用資料上的殘差'},g=>`<path d="M66 ${g.y(0)}H690" class="enzyme-baseline"/>`+used.map((p,i)=>`<path d="M${g.x(p.substrate)} ${g.y(0)}V${g.y(residuals[i])}" class="enzyme-residual"/>${point(p.substrate,residuals[i],g)}`).join('')):'<p>沒有可用參數，故不畫殘差。</p>';
    $('[data-enzyme-fit-diagnostic]').textContent=`局部診斷：${{informative:'未見明顯局部數值退化',weak:'弱約束', 'not-identifiable':'不可唯一識別'}[nls.identifiability.status]}。${nls.flags.length?'旗標：'+nls.flags.map(flag=>diagnosticLabels[flag]||'需進一步檢查參數與資料').join('、')+'。':''}這些是數值與範圍診斷，不是信賴區間，也未檢定兩組差異。`;
    $('[data-enzyme-data-table]').innerHTML=`<div class="enzyme-table-wrap"><table><caption>${state.group} 組完整原始點；沒有平均重複值</caption><thead><tr><th>原列</th><th>[S] / ppm</th><th>v / counts/min/min</th><th>本次使用</th></tr></thead><tbody>${all.map(p=>`<tr><td>${p.id}</td><td>${p.substrate}</td><td>${p.velocity}</td><td>${included(p)?'是':'否'}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function draw(){outputs();if(id==='enzyme-initial-rate')drawProgress();else if(id==='enzyme-inhibition-map')drawInhibition();else drawFit();}
  const input=e=>{
    if(disposed)return;const target=e.target,k=target?.dataset?.enzymeControl;if(!controlsByActivity[id].includes(k)||!container.contains(target))return;
    if(Object.hasOwn(ranges,k)){const raw=String(target.value);if(!raw.trim())return;const value=Number(raw);if(!Number.isFinite(value))return;const [low,high]=ranges[k];state[k]=Math.max(low,Math.min(high,value));}
    else if(choices[k]?.includes(target.value))state[k]=target.value;else return;
    if(k==='start'&&state.start>=state.end){state.end=Math.min(10,Math.round((state.start+.1)*10)/10);$('[data-enzyme-control="end"]').value=state.end;}
    if(k==='end'&&state.end<=state.start){state.start=Math.max(0,Math.round((state.end-.1)*10)/10);$('[data-enzyme-control="start"]').value=state.start;}
    draw();};
  const click=e=>{if(disposed)return;const b=e.target?.closest?.('button');if(!b||!container.contains(b))return;
    if(id==='enzyme-initial-rate'&&['early','whole','late'].includes(b.dataset.enzymeWindow)){[state.start,state.end]=({early:[0,1],whole:[0,10],late:[5,10]})[b.dataset.enzymeWindow];for(const k of ['start','end'])$(`[data-enzyme-control="${k}"]`).value=state[k];draw();}
    else if(id==='enzyme-inhibition-map'&&choices.plot.includes(b.dataset.enzymePlot)){state.plot=b.dataset.enzymePlot;draw();}
  };
  function dispose(){
    if(disposed)return;
    panels.forEach((node,index)=>{draft.details[String(index)]=node.open;node.ontoggle=null;});
    disposed=true;container.removeEventListener('input',input);container.removeEventListener('click',click);
    if(draft.active===dispose)draft.active=null;if(mounted.get(container)===dispose)mounted.delete(container);
  }
  mounted.set(container,dispose);draft.active=dispose;
  container.addEventListener('input',input);container.addEventListener('click',click);draw();
  if(id==='enzyme-kinetic-fit')fetch(new URL('../data/enzyme-kinetics-measured.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Measurement unavailable');return r.json();}).then(data=>{
    if(disposed)return;
    if(data?.id!=='r-puromycin'||data.units?.substrate!=='ppm'||data.units?.velocity!=='counts/min/min'||!Array.isArray(data.points)||data.points.length!==23||data.points.some((p,i)=>p.id!==i+1||!Number.isFinite(p.substrate)||p.substrate<1e-12||p.substrate>1e12||!Number.isFinite(p.velocity)||p.velocity<1e-12||p.velocity>1e12||p.group!==(i<12?'treated':'untreated')))throw new Error('Invalid measurement dataset');
    measured=data;draft.loadError=false;draw();
  }).catch(()=>{if(!disposed){draft.loadError=true;$('.enzyme-plot').innerHTML=loadError;}});
  return dispose;
}
