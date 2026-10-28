import {escapeHTML as esc} from './storage.js';
import {RESIDENCE_TIME_ID,RESIDENCE_TIME_SOURCES,evaluateResidenceTime,residenceDistribution} from './residence-time-model.js';
export {RESIDENCE_TIME_ID} from './residence-time-model.js';
export const RESIDENCE_TIME_LAB_ID=RESIDENCE_TIME_ID;

const drafts=new WeakMap();
let sequence=0;
const clone=value=>structuredClone(value);
const fmt=value=>value===null||!Number.isFinite(value)?'—':Number(value).toLocaleString('en-US',{maximumFractionDigits:4,useGrouping:false});
const pct=value=>`${fmt(value*100)}%`;
const flowName=value=>value==='laminar'?'充分發展牛頓層流':'理想塞流參照';
const choiceName=value=>({earlier:'可能早於平均時間',same:'應與平均時間相同',unknown:'先保留判斷'}[value]||'未選');
const fresh=()=>({mode:'pipe',flow:'laminar',tau:2,radius:.5,time:0,cutoff:1,width:0,sampling:.05,choice:'',prediction:'',revision:'',next:'',first:null,observations:[],sourceOpened:[],cursor:{count:0,writing:null,first:false,sources:[],started:false}});
const conditions=d=>({flow:d.flow,tau:d.tau,time:d.time*d.tau,cutoff:d.cutoff*d.tau,pulseWidth:d.width*d.tau,radiusFraction:d.radius});
const conditionText=p=>`${flowName(p.flow)}；τ=${fmt(p.tau)} min；r/R=${fmt(p.radiusFraction)}；t=${fmt(p.time)} min；觀測截止=${fmt(p.cutoff)} min；入口寬度 δ=${fmt(p.pulseWidth)} min`;
const sourceText=()=>RESIDENCE_TIME_SOURCES.map(s=>`${s.id}：${s.title}\n${s.url}`).join('\n');

function pipeDiagram(d,result,prefix){
  const width=820,height=200,cx=76,cy=105,r=51,start=212,end=710,top=47,bottom=163;
  const radii=[-.9,-.5,0,.5,.9],speed=rho=>d.flow==='plug'?1:2*(1-rho*rho);
  const pos=rho=>Math.min(1,speed(rho)*d.time);
  const selectedY=cy-d.radius*(bottom-top)/2;
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${prefix}-pipe-title ${prefix}-pipe-desc"><title id="${prefix}-pipe-title">圓管內同時進入的空間標記</title><desc id="${prefix}-pipe-desc">${esc(flowName(d.flow))}。選定 r/R=${fmt(d.radius)}，目前 t=${fmt(d.time*d.tau)} 分鐘。圓點只比較空間位置，不代表相同示蹤質量。</desc>
  <defs><marker id="${prefix}-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#8aa8a3"/></marker></defs>
  <circle class="rt-cross" cx="${cx}" cy="${cy}" r="${r}"/><line class="rt-grid" x1="${cx}" y1="${cy}" x2="${cx+r}" y2="${cy}"/>
  ${[0,.5,.9].map(v=>`<circle class="rt-radius-target${Math.abs(d.radius-v)<.001?' is-selected':''}" cx="${cx+r*v}" cy="${cy}" r="${v===d.radius?7:5}" data-rt-radius="${v}" role="button" tabindex="0" aria-label="選擇半徑 r/R = ${v}"/>`).join('')}
  <text class="rt-tick" x="${cx}" y="${cy+r+28}" text-anchor="middle">截面：中心 → 壁</text>
  <rect class="rt-pipe" x="${start}" y="${top}" width="${end-start}" height="${bottom-top}" rx="2"/>
  <path class="rt-speed-profile" d="${Array.from({length:41},(_,i)=>{const rho=(i-20)/20;return `${i?'L':'M'}${start+4+speed(rho)*42},${cy-rho*(bottom-top)/2}`;}).join(' ')}"/>
  ${radii.map(rho=>{const y=cy-rho*(bottom-top)/2;return `<line class="rt-track" x1="${start}" x2="${end}" y1="${y}" y2="${y}"/><line x1="${start+4}" x2="${start+4+speed(rho)*42}" y1="${y}" y2="${y}" stroke="#8aa8a3" stroke-width="2" marker-end="url(#${prefix}-arrow)"/><circle class="rt-marker" cx="${start+pos(rho)*(end-start)}" cy="${y}" r="4"/>`;}).join('')}
  <line class="rt-selected-line" x1="${start}" x2="${end}" y1="${selectedY}" y2="${selectedY}"/><circle class="rt-selected-marker" cx="${start+result.selectedTrack.positionFraction*(end-start)}" cy="${selectedY}" r="7"/>
  <text class="rt-tick" x="${start+36}" y="${top-14}" text-anchor="middle">入口 · 速度輪廓</text><text class="rt-tick" x="${end}" y="${top-14}" text-anchor="middle">出口</text>
  <text class="rt-tick" x="${(start+end)/2}" y="${bottom+28}" text-anchor="middle">管長 L；圓點抵達出口後停在邊界作標記</text>
  <text class="rt-tick" x="${end+18}" y="${cy+5}">${result.selectedTrack.exited?'已離管':'尚在管內'}</text></svg>`;
}

function tracerDiagram(d,result,prefix){
  const w=820,h=200,left=72,right=34,top=35,bottom=48,pw=w-left-right,ph=h-top-bottom;
  const p=conditions(d),end=4*d.tau,observed=result.observation.end,atom=d.flow==='plug'&&d.width===0;
  const x=t=>left+t/end*pw;
  const points=Array.from({length:201},(_,i)=>{const t=end*i/200;return {t,...residenceDistribution(p,t)};});
  const max=atom?1:Math.max(.1,...points.map(v=>v.density||0))*1.12;
  const y=v=>top+ph-v/max*ph;
  const clipped=points.filter(v=>v.t<=observed);
  if(!atom&&clipped.at(-1)?.t!==observed)clipped.push({t:observed,...residenceDistribution(p,observed)});
  let path=clipped.map((v,i)=>`${i?'L':'M'}${x(v.t).toFixed(2)},${y(v.density||0).toFixed(2)}`).join(' ');
  if(d.width===0&&d.flow==='laminar'&&observed>=d.tau/2){
    const first=d.tau/2;
    path=`M${x(0)},${y(0)} L${x(first)},${y(0)} L${x(first)},${y(4/d.tau)} `+clipped.filter(v=>v.t>first).map(v=>`L${x(v.t).toFixed(2)},${y(v.density||0).toFixed(2)}`).join(' ');
  }else if(d.width>0&&d.flow==='plug'){
    path=`M${x(0)},${y(0)} L${x(Math.min(observed,d.tau))},${y(0)}`;
    if(observed>=d.tau){path+=` L${x(d.tau)},${y(1/p.pulseWidth)} L${x(Math.min(observed,d.tau+p.pulseWidth))},${y(1/p.pulseWidth)}`;if(observed>=d.tau+p.pulseWidth)path+=` L${x(d.tau+p.pulseWidth)},${y(0)} L${x(observed)},${y(0)}`;}
  }
  const samples=[];for(let i=0;i<=Math.floor((observed+1e-10)/(d.sampling*d.tau));i++){const t=i*d.sampling*d.tau;samples.push({t,...residenceDistribution(p,t)});}
  const atomSeen=atom&&observed>=d.tau;
  const title=atom?'理想單位脈衝；線高不代表密度':d.width===0?'理想脈衝的出口 RTD E(t) / min⁻¹':'有限入口脈衝的出口訊號 / min⁻¹';
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${prefix}-curve-title ${prefix}-curve-desc"><title id="${prefix}-curve-title">${title}</title><desc id="${prefix}-curve-desc">目前已觀測 ${fmt(observed)} 分鐘，模型已回收 ${pct(result.observation.recoveredFraction)}。灰區是觀測窗外。曲線面積是歸一化示蹤質量分率，不是曲線高度。</desc>
  <rect class="rt-outside" x="${x(p.cutoff)}" y="${top}" width="${Math.max(0,x(end)-x(p.cutoff))}" height="${ph}"/>
  ${[0,.5,1].map(v=>`<line class="rt-grid" x1="${left}" x2="${w-right}" y1="${top+ph*(1-v)}" y2="${top+ph*(1-v)}"/><text class="rt-tick" x="${left-10}" y="${top+ph*(1-v)+5}" text-anchor="end">${atom?(v===0?'0':''):fmt(v*max)}</text>`).join('')}
  ${[0,.5,1,2,3,4].map(v=>`<text class="rt-tick" x="${x(v*d.tau)}" y="${top+ph+23}" text-anchor="middle">${fmt(v*d.tau)}</text>`).join('')}
  ${atomSeen?`<line class="rt-impulse" x1="${x(d.tau)}" x2="${x(d.tau)}" y1="${top+ph}" y2="${top+18}"/><text class="rt-tick" x="${x(d.tau)+12}" y="${top+24}">質量 = 1</text>`:atom?'':`<path class="rt-curve" d="${path}"/>${samples.map(v=>`<circle class="rt-sample" cx="${x(v.t)}" cy="${y(v.density||0)}" r="2.8"/>`).join('')}`}
  <line class="rt-window-line" x1="${x(p.cutoff)}" x2="${x(p.cutoff)}" y1="${top}" y2="${top+ph}"/><line class="rt-cursor" x1="${x(observed)}" x2="${x(observed)}" y1="${top}" y2="${top+ph}"/>
  <text class="rt-axis" x="${left}" y="18">${title}</text><text class="rt-axis" x="${left+pw/2}" y="${h-4}" text-anchor="middle">從入口脈衝開始的時間 t / min</text>
  ${d.cutoff<4?`<text class="rt-tick" x="${x(p.cutoff)+12}" y="${top+18}">觀測窗外</text>`:''}</svg>`;
}

/** Analytic teaching activity; storage remains owned by the common lesson helper. */
export function mountResidenceTimeLab(root,id=RESIDENCE_TIME_ID,{draftOwner,onSaveSummary,schedule=globalThis.setTimeout,cancel=globalThis.clearTimeout}={}){
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  if(id!==RESIDENCE_TIME_ID)throw new RangeError('Unknown residence-time activity');
  const owned=draftOwner&&typeof draftOwner==='object';if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,fresh());
  const d=owned?drafts.get(draftOwner):fresh(),prefix=`residence-time-${++sequence}`;
  const field=name=>root.querySelector(`[data-rt-${name}]`),action=name=>root.querySelector(`[data-rt-action="${name}"]`);
  let disposed=false,playing=false,timer=null,feedback='',saveStatus='',error='',invalidField='';
  root.innerHTML=`<section class="residence-time-lab" aria-labelledby="${prefix}-title"><h2 id="${prefix}-title" class="rt-sr-only">由圓管標記到出口示蹤</h2>
  <div class="rt-top"><div class="rt-modes" role="group" aria-label="停留時間工作台模式"><button type="button" data-rt-mode="pipe">管內位置</button><button type="button" data-rt-mode="tracer">出口示蹤</button></div><span class="rt-identity">指定理想模型 · 非食品量測</span></div>
  <div class="rt-controls"><label for="${prefix}-flow">流動<select id="${prefix}-flow" data-rt-flow><option value="laminar">牛頓層流</option><option value="plug">理想塞流參照</option></select></label><label for="${prefix}-tau">名義時間 τ / min<input type="number" id="${prefix}-tau" min="0.5" max="4" step="0.5" data-rt-tau></label><label class="rt-radius-control" for="${prefix}-radius" data-rt-radius-control>半徑 r/R <output data-rt-radius-value></output><input type="range" id="${prefix}-radius" min="0" max="1" step="0.01" data-rt-radius-input></label><label for="${prefix}-width" data-rt-width-control>入口脈衝<select id="${prefix}-width" data-rt-width><option value="0">瞬間注入（理想）</option><option value="0.2">矩形寬度 0.2τ</option><option value="0.5">矩形寬度 0.5τ</option></select></label><label for="${prefix}-cutoff" data-rt-cutoff-control>觀測到<select id="${prefix}-cutoff" data-rt-cutoff><option value="1">1τ</option><option value="2">2τ</option><option value="4">4τ</option></select></label></div>
  <p class="rt-error" role="status" data-rt-error></p>
  <div class="rt-timeline"><button type="button" data-rt-action="play">回放</button><button type="button" data-rt-action="rewind">回到入口</button><label class="rt-time-label" for="${prefix}-time">時間 <output data-rt-time-label></output><input type="range" id="${prefix}-time" min="0" max="4" step="0.01" data-rt-time></label><button type="button" data-rt-action="endpoint">到觀測截止</button><button type="button" class="rt-primary" data-rt-action="record">記下這次觀察</button></div><div class="rt-diagram" data-rt-diagram></div>
  <div class="rt-current" data-rt-current aria-live="off"></div><p class="rt-context" data-rt-context></p>
  <div class="rt-record-row"><span data-rt-count></span></div><p class="rt-feedback" role="status" data-rt-feedback></p>
  <details><summary>我的預測、修訂與下一項證據</summary><p>先判斷：第一份示蹤物到達時間，會等於 τ 嗎？可先寫，也可直接操作。</p><div class="rt-choices" role="group" aria-label="最快到達的預測">${[['earlier','可能更早'],['same','應該相同'],['unknown','先保留']].map(([v,l])=>`<button type="button" data-rt-choice="${v}">${l}</button>`).join('')}</div><label for="${prefix}-prediction">目前的理由<textarea id="${prefix}-prediction" maxlength="800" rows="2" data-rt-prediction></textarea></label><p class="rt-context" data-rt-first></p><label for="${prefix}-revision">觀察後的修訂<textarea id="${prefix}-revision" maxlength="1200" rows="2" data-rt-revision></textarea></label><label for="${prefix}-next">若換成有顆粒或剪切稀化食品，要補什麼證據？<textarea id="${prefix}-next" maxlength="800" rows="2" data-rt-next></textarea></label><button type="button" data-rt-action="record-writing">記錄這次修訂</button></details>
  <details data-rt-sampling-panel><summary>採樣間隔與面積怎麼讀</summary><label for="${prefix}-sampling">出口取樣間隔 Δt<select id="${prefix}-sampling" data-rt-sampling><option value="0.05">0.05τ</option><option value="0.2">0.2τ</option></select></label><p>線是解析模型；點是在選定時刻取其值。點的疏密不改變解析積分。下方回收量與平均由解析式計算，沒有把稀疏點連線當成實測積分。</p><p>入口寬度 δ 是注入持續多久；Δt 是出口多久取一次樣，兩者不同。有限矩形脈衝的總注入質量定為 1，入口密度為 1/δ；出口是入口脈衝與 RTD 的卷積。其平均到達時間從注入開始算為 τ＋δ/2。</p><p>瞬間塞流是 τ 處的單位質量脈衝，沒有有限峰高；一般點採樣可能漏掉它。塞流不等於所有紊流。</p></details>
  <details><summary>已記錄的觀察 <span data-rt-total></span></summary><div data-rt-records></div></details>
  <details><summary>檢查並保存摘要</summary><label for="${prefix}-summary">完整摘要<textarea readonly id="${prefix}-summary" rows="7" data-rt-summary></textarea></label><button type="button" data-rt-action="copy">選取完整摘要</button><label for="${prefix}-append">本次附加內容<textarea readonly id="${prefix}-append" rows="5" data-rt-append></textarea></label><button type="button" data-rt-action="save" ${typeof onSaveSummary!=='function'?'hidden':''}>附加到本課筆記</button><p role="status" data-rt-save-status></p><p class="rt-context">只在確認保存成功後推進。未保存草稿可在本頁課內返回；重新整理前請保存或複製。</p></details>
  <details><summary>公式、適用範圍與來源</summary><p>牛頓、單相、等溫、不可壓縮、直圓管、充分發展穩態層流、無滑移；忽略徑向與軸向擴散。示蹤物不反應、不吸附、不改變流動。τ 只設定時間尺度，沒有代入真實食品幾何、流量或黏度，也沒有驗證其 Reynolds 數。</p><p>ū=Q/(πR²)，τ=V/Q=L/ū；u(r)/ū=2[1−(r/R)²]。r=R 是理想零速邊界，不代表有限比例的物料永遠停住。畫面圓點是空間取樣，不是等量示蹤粒子；出口質量按局部流量加權。</p><p>瞬間入口：t&lt;τ/2 時 E=G=0；其後 E(t)=τ²/(2t³)，G(t)=1−τ²/(4t²)。G 表累積分率，避免與熱致死 F 混淆。完整平均為 τ；二階矩在這個無擴散模型發散，不能報有限完整標準差。</p><p>截止 T 的第一矩為 τ−τ²/(2T)，僅已回收部分的平均＝第一矩/G(T)。有限矩形脈衝則用解析卷積計算，不能直接套瞬間入口的截止公式。ETH 原文約 80% 的敘述與其公式不符；G(τ) 精確為 75%。</p><p>本課不計微生物存活、罐頭冷點、壓降、顆粒滑移或非牛頓流場，也不輸出安全排程。最快流體、實際溫度、下游設備、包材與封口須依具體製程另取得證據。</p><ul>${RESIDENCE_TIME_SOURCES.map(s=>`<li><a href="${esc(s.url)}" data-rt-source="${esc(s.id)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>${s.note?` — ${esc(s.note)}`:''}</li>`).join('')}</ul></details></section>`;

  function captureFirst(trigger){if(!d.first)d.first={trigger,choice:d.choice,prediction:d.prediction,conditions:clone(conditions(d)),sourceOpened:[...d.sourceOpened]};}
  function firstText(){return d.first?`首次時間／出口操作前（${d.first.trigger}）：${choiceName(d.first.choice)}；理由：${d.first.prediction||'未填'}；${conditionText(d.first.conditions)}；已開啟来源 ${d.first.sourceOpened.join('、')||'無紀錄'}。後續改字不改寫這份快照。`:'尚未播放、移動時間或開啟出口圖。速度輪廓可先看到，這不是盲測。';}
  function writing(){return {choice:d.choice,prediction:d.prediction,revision:d.revision,next:d.next};}
  function writingText(v){return `目前判斷：${choiceName(v.choice)}\n目前理由：${v.prediction||'未填'}\n修訂：${v.revision||'未填'}\n下一項證據：${v.next||'未填'}`;}
  function observationText(o,i){return `${i+1}. ${o.mode==='pipe'?'管內位置':'出口示蹤'}；${conditionText(o.parameters)}\n選定速度 u/ū=${fmt(o.speedRatio)}；離管時間=${o.travelTime===null?'理想零速邊界，無有限離管時間':fmt(o.travelTime)+' min'}；x/L=${fmt(o.position)}\n至 ${fmt(o.observedEnd)} min：回收 ${pct(o.recovered)}，模型未回收 ${pct(o.unrecovered)}；已回收部分平均=${fmt(o.conditionalMean)} min；完整出口平均=${fmt(o.wholeMean)} min。取樣間隔=${fmt(o.sampling)} min\n${writingText(o.writing)}`;}
  function summary(){return ['圓管停留與示蹤觀測','指定理想模型，非食品量測／製程確效。圓點不是等質量粒子；有限入口訊號不直接等於 RTD。',firstText(),...d.observations.map(observationText),'目前文字',writingText(writing()),`已開啟來源：${d.sourceOpened.join('、')||'無紀錄'}（只記連結開啟，不能證明閱讀範圍）`,sourceText()].join('\n\n');}
  function appendPlan(){
    const next=clone(d.cursor),blocks=[],now=writing();
    if(d.observations.length>next.count){for(let i=next.count;i<d.observations.length;i++)blocks.push(observationText(d.observations[i],i));next.count=d.observations.length;}
    if(JSON.stringify(now)!==JSON.stringify(next.writing)){if(Object.values(now).some(Boolean)||next.writing)blocks.push(writingText(now));next.writing=clone(now);}
    if(d.first&&!next.first){blocks.push(firstText());next.first=true;}
    const opened=d.sourceOpened.filter(s=>!next.sources.includes(s));if(opened.length)blocks.push(`新增來源開啟：${opened.join('、')}（不證明閱讀範圍）`);next.sources=[...d.sourceOpened];
    if(!blocks.length)return {text:'',next};
    if(!next.started){blocks.unshift('圓管停留與示蹤觀測：指定理想模型，非食品量測／安全排程。圓點不是等質量；有限入口出口訊號不是未校正 RTD。');blocks.push(sourceText());next.started=true;}
    return {text:blocks.join('\n\n'),next};
  }
  function drawSummary(){field('summary').value=summary();const plan=appendPlan();field('append').value=plan.text;action('save').disabled=!plan.text;field('save-status').textContent=saveStatus;}
  function drawRecords(){field('count').textContent=`${d.observations.length} / 24`;field('total').textContent=`${d.observations.length} / 24`;field('records').innerHTML=d.observations.length?d.observations.map((o,i)=>`<article><p>${esc(observationText(o,i)).replaceAll('\n','<br>')}</p></article>`).join(''):'<p>尚未記錄。</p>';}
  function result(){return evaluateResidenceTime(conditions(d));}
  function draw(){
    if(disposed)return;const r=result();
    root.querySelectorAll('[data-rt-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rtMode===d.mode)));
    root.querySelectorAll('[data-rt-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rtChoice===d.choice)));
    for(const [name,value] of [['flow',d.flow],['tau',d.tau],['radius-input',d.radius],['width',d.width],['cutoff',d.cutoff],['time',d.time],['sampling',d.sampling]])if(name!==invalidField)field(name).value=String(value);
    field('radius-value').textContent=fmt(d.radius);field('time-label').textContent=`${fmt(d.time*d.tau)} min（${fmt(d.time)}τ）`;
    field('radius-control').hidden=d.mode!=='pipe';field('width-control').hidden=field('cutoff-control').hidden=field('sampling-panel').hidden=d.mode!=='tracer';action('endpoint').hidden=d.mode!=='tracer';
    action('play').textContent=playing?'暫停':'回放';field('diagram').innerHTML=d.mode==='pipe'?pipeDiagram(d,r,prefix):tracerDiagram(d,r,prefix);
    field('current').innerHTML=d.mode==='pipe'?`<span>選定速度 <strong>${fmt(r.selectedTrack.speedRatio)} ū</strong></span><span>離管時間 <strong>${r.selectedTrack.travelTime===null?'無有限值':fmt(r.selectedTrack.travelTime)+' min'}</strong></span><span>目前位置 <strong>${fmt(r.selectedTrack.positionFraction)} L</strong></span>`:`<span>至 ${fmt(r.observation.end)} min 回收 <strong>${pct(r.observation.recoveredFraction)}</strong></span><span>已回收部分平均 <strong>${fmt(r.observation.conditionalMean)} min</strong></span><span>模型未回收 <strong>${pct(r.observation.unrecoveredFraction)}</strong></span>`;
    field('context').textContent=d.mode==='pipe'?((d.flow==='plug'?'塞流參照把每個流體元素指定為相同速度；它不是圓管無滑移速度場。':'點只比較位置，不代表等量示蹤物；r/R = 1 是零速邊界。')+(d.width?' 這些點是 t=0 進入的前緣；後續注入者未逐點畫出。':'')):d.width?`δ=${fmt(d.width*d.tau)} min；完整出口平均=${fmt(r.whole.meanOutletTime)} min，流體平均停留仍為 τ=${fmt(d.tau)} min。`:`完整平均仍是 τ=${fmt(d.tau)} min。只收集部分時的平均，不能代替完整平均。`;
    field('first').textContent=firstText();field('feedback').textContent=feedback;field('error').textContent=error;action('record').disabled=action('record-writing').disabled=action('play').disabled=action('endpoint').disabled=!!error;
    drawRecords();drawSummary();
  }
  function pause(){playing=false;if(timer!==null)cancel(timer);timer=null;}
  function tick(){if(disposed||!playing)return;const end=d.mode==='tracer'?d.cutoff:4;d.time=Math.min(end,d.time+.04);if(d.time>=end)pause();draw();if(playing)timer=schedule(tick,80);}
  function record(){
    pause();if(error)return;const r=result(),o={mode:d.mode,parameters:clone(conditions(d)),speedRatio:r.selectedTrack.speedRatio,travelTime:r.selectedTrack.travelTime,position:r.selectedTrack.positionFraction,observedEnd:r.observation.end,recovered:r.observation.recoveredFraction,unrecovered:r.observation.unrecoveredFraction,conditionalMean:r.observation.conditionalMean,wholeMean:r.whole.meanOutletTime,sampling:d.sampling*d.tau,writing:clone(writing()),first:clone(d.first)};
    if(d.observations.some(v=>JSON.stringify(v)===JSON.stringify(o)))feedback='這份條件與文字已記錄。';
    else if(d.observations.length>=24)feedback='已保留 24 份快照；請先保存或複製。現有紀錄不會被覆寫。';
    else{d.observations.push(o);feedback=`已保留第 ${d.observations.length} 份快照。`;saveStatus='';}draw();
  }
  function click(event){
    if(disposed)return;
    const source=event.target.closest?.('[data-rt-source]');if(source&&root.contains(source)){if(!d.sourceOpened.includes(source.dataset.rtSource))d.sourceOpened.push(source.dataset.rtSource);drawSummary();return;}
    const radial=event.target.closest?.('[data-rt-radius]');if(radial&&root.contains(radial)){pause();d.radius=Number(radial.dataset.rtRadius);draw();return;}
    const b=event.target.closest?.('button');if(!b||!root.contains(b)||b.disabled)return;
    if(b.dataset.rtMode){pause();if(b.dataset.rtMode==='tracer')captureFirst('出口圖');d.mode=b.dataset.rtMode;draw();return;}
    if(b.dataset.rtChoice){d.choice=b.dataset.rtChoice;saveStatus='';draw();return;}
    const name=b.dataset.rtAction;
    if(name==='play'){if(playing)pause();else{captureFirst('回放');if(d.time>=(d.mode==='tracer'?d.cutoff:4))d.time=0;playing=true;timer=schedule(tick,80);}draw();}
    else if(name==='rewind'){pause();d.time=0;draw();}
    else if(name==='endpoint'){pause();captureFirst('到觀測截止');d.time=d.cutoff;draw();}
    else if(name==='record'||name==='record-writing')record();
    else if(name==='copy'){field('summary').focus();field('summary').select();saveStatus='已選取完整摘要，按 Ctrl+C 複製。';drawSummary();}
    else if(name==='save'&&typeof onSaveSummary==='function'){
      pause();const plan=appendPlan();if(!plan.text)return;let saved=false,reason='';
      if(plan.text.length>10000)reason='本次內容超過筆記 10,000 字上限。';else try{saved=onSaveSummary(plan.text)===true;}catch(e){reason=e?.message||String(e);}
      if(saved)d.cursor=plan.next;if(disposed)return;
      saveStatus=saved?'已將本次預覽附加到筆記；後續只附加新觀察與文字修訂。':`尚未保存。${reason||'儲存端未確認成功。'} 內容未截斷、保存位置未前移；請先複製並保留。`;draw();
    }
  }
  function input(event){
    if(disposed)return;const t=event.target;
    for(const [name,max] of [['prediction',800],['revision',1200],['next',800]])if(t===field(name)){d[name]=t.value.slice(0,max);saveStatus='';drawSummary();return;}
    const specs=[['tau','tau',.5,4],['radius-input','radius',0,1],['time','time',0,4]];
    for(const [name,key,min,max] of specs)if(t===field(name)){
      pause();const v=t.value.trim()===''?NaN:Number(t.value);if(!Number.isFinite(v)||v<min||v>max){error=`請輸入 ${min}–${max} 的有效數值；目前保留上次有效條件。`;invalidField=name;action('play').textContent='回放';field('error').textContent=error;action('record').disabled=action('record-writing').disabled=action('play').disabled=action('endpoint').disabled=true;return;}
      if(key==='time'&&v>0)captureFirst('移動時間');d[key]=v;if(invalidField===name){error='';invalidField='';}saveStatus='';draw();return;
    }
  }
  function change(event){if(disposed)return;const t=event.target;for(const [name,key,allowed] of [['flow','flow',['laminar','plug']],['width','width',['0','0.2','0.5']],['cutoff','cutoff',['1','2','4']],['sampling','sampling',['0.05','0.2']]])if(t===field(name)&&allowed.includes(t.value)){pause();d[key]=key==='flow'?t.value:Number(t.value);feedback='';draw();return;}}
  function keydown(event){if(['Enter',' '].includes(event.key)&&event.target.closest?.('[data-rt-radius]')){event.preventDefault?.();click(event);}}
  for(const name of ['prediction','revision','next'])field(name).value=d[name];
  root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',change);root.addEventListener('keydown',keydown);draw();
  return()=>{if(disposed)return;disposed=true;pause();root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('keydown',keydown);};
}
