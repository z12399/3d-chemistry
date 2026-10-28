import {escapeHTML as esc} from './storage.js';
import {EMULSION_LAB_ID,EMULSION_DEFAULTS,EMULSION_LIMITS,EMULSION_SOURCES,evaluateEmulsion} from './emulsion-model.js';

export {EMULSION_LAB_ID} from './emulsion-model.js';
const STEPS=['area','budget','distribution'];
const LABELS={area:'分小滴',budget:'界面預算',distribution:'兩種粒徑'};
const HEADINGS={area:'滴變小了，要照顧的界面有多少？',budget:'這份乳化劑，夠分到新增的界面嗎？',distribution:'回算界面積，該用哪個平均粒徑？'};
const CHOICES={area:{double:'變為 2 倍',eight:'變為 8 倍',half:'變為 1/2'},budget:{meets:'理想可供量達到需求',shortfall:'理想可供量仍不足'},distribution:{d32:'用 d₃₂ 回算',d43:'用 d₄₃ 回算',both:'目前兩者都可回算'}};
const FIELDS={volumeMl:{label:'分散相體積 V',unit:'mL',step:'any',group:'area'},diameterUm:{label:'單分散液滴直徑 d',unit:'µm',step:'any',group:'area'},emulsifierMg:{label:'乳化劑總質量 m',unit:'mg',step:'any',group:'budget'},eligibleFraction:{label:'題設可供界面比例 f',unit:'',step:.05,group:'budget'},surfaceLoadMgM2:{label:'題設單位面積需求 Γ',unit:'mg/m²',step:'any',group:'budget'},smallDiameterUm:{label:'小粒級直徑 dₛ',unit:'µm',step:'any',group:'distribution'},largeDiameterUm:{label:'大粒級直徑 dₗ',unit:'µm',step:'any',group:'distribution'},smallVolumeFraction:{label:'小粒級占分散相的體積比例',unit:'',step:.05,group:'distribution'}};
const fresh=()=>({choice:'',checked:false,reference:false,seen:false});
const fmt=value=>{if(!Number.isFinite(value))return '—';if(value===0)return '0';return Math.abs(value)<.001||Math.abs(value)>=1e6?value.toExponential(3).replace('e-',' × 10^−').replace('e+',' × 10^'):String(Number(value.toPrecision(5)));};
const percent=value=>`${fmt(value*100)}%`;
const href=value=>typeof value==='string'&&/^#[a-z][a-z0-9/-]*$/i.test(value)?value:'#learn/review';
const secureUrl=value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}};
const parse=value=>typeof value==='string'&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())?Number(value):NaN;
const choiceName=(step,value)=>CHOICES[step][value]||'未作答';
const owners=new WeakMap(),mounted=new WeakMap();
const DETAIL_LABELS={areaMath:'體積、滴數與漂移',budgetMath:'界面預算條件',distributionMath:'粒徑與平均定義',areaCheck:'分小滴判讀',budgetCheck:'預算判讀',distributionCheck:'平均徑判讀',sources:'模型條件與來源',writing:'解釋與修訂',original:'固定原文',records:'保留觀察',notes:'筆記預覽'};
const SCIENCE_DETAILS=['areaMath','budgetMath','distributionMath','areaCheck','budgetCheck','distributionCheck','sources'];
const clone=value=>structuredClone(value);
function newDraft(startStep){return {state:{...EMULSION_DEFAULTS},answers:Object.fromEntries(STEPS.map(key=>[key,fresh()])),visited:new Set([startStep]),step:startStep,details:{},seenDetails:[],seenSources:[],writing:{draft:'',touched:false,original:null,revision:'',revisionTouched:false,firstContext:null,lastContext:null,retainedContext:null,revisionContext:null,retainedCondition:null},records:[],selectedRecord:'',saved:{},savedVersions:[],selectedSaved:'',pending:null,status:'',error:'',active:null};}
function draftFor(owner,key,startStep){if(owner===null||!['object','function'].includes(typeof owner))return newDraft(startStep);let drafts=owners.get(owner);if(!drafts)owners.set(owner,drafts=new Map());if(!drafts.has(key))drafts.set(key,newDraft(startStep));return drafts.get(key);}
let instance=0;

/** A hypothetical geometry/budget model, not an adsorption or stability simulation. */
export function mountEmulsionLab(container,id=EMULSION_LAB_ID,{startStep='area',draftOwner,draftKey=EMULSION_LAB_ID,onSaveSummary,reviewHref='#learn/review'}={}) {
  if(id!==EMULSION_LAB_ID)throw new RangeError('Unknown emulsion activity');
  if(!STEPS.includes(startStep))throw new RangeError('Unknown emulsion step');
  if(!container?.querySelector||!container?.addEventListener)throw new TypeError('A DOM container is required');
  const d=draftFor(draftOwner,draftKey,startStep);mounted.get(container)?.dispose();d.active?.dispose();
  const prefix=`emulsion-${++instance}`,$=selector=>container.querySelector(selector),$$=selector=>container.querySelectorAll(selector);
  const state=d.state,answers=d.answers,visited=d.visited;
  let step=d.step,disposed=false,view=evaluateEmulsion(state),recordCount=-1,savedCount=-1;
  const everSeen=()=>STEPS.some(key=>answers[key].seen);
  const control=key=>$(`[data-em-control="${key}"]`),action=key=>$(`[data-em-action="${key}"]`);
  const text=(selector,value)=>{$(selector).textContent=value;};
  const shownValue=(key,value)=>key==='eligibleFraction'||key==='smallVolumeFraction'?percent(value):`${fmt(value)} ${FIELDS[key].unit}`;
  const field=key=>{const spec=FIELDS[key],[min,max]=EMULSION_LIMITS[key],fieldId=`${prefix}-${key}`;return `<label class="em-control" for="${fieldId}"><span>${esc(spec.label)}<output for="${fieldId}" data-em-reading="${key}"></output></span><input id="${fieldId}" type="range" min="${min}" max="${max}" step="${spec.step}" data-em-control="${key}" value="${state[key]}"><span class="em-endpoints" aria-hidden="true"><small>${esc(shownValue(key,min))}</small><small>${esc(shownValue(key,max))}</small></span></label>`;};
  const question=(key,prompt)=>`<details class="em-question" data-em-detail="${key}Check"><summary>試著判讀，再核對</summary><p>${prompt}</p><div class="em-choices${key==='budget'?' em-choices-pair':''}">${Object.entries(CHOICES[key]).map(([value,label])=>`<button type="button" data-em-choice="${value}" data-em-for="${key}" aria-pressed="false">${label}</button>`).join('')}</div><div class="em-actions"><button type="button" class="em-primary" data-em-action="check" data-em-for="${key}">核對我的判讀</button><button type="button" data-em-action="reference" data-em-for="${key}">看參考解釋</button></div><p class="em-feedback" role="status" data-em-feedback="${key}"></p></details>`;
  container.innerHTML=`<section class="emulsion-lab" aria-labelledby="${prefix}-title">
    <p class="em-kicker" id="${prefix}-title">乳化界面工作台 · 假想指定條件</p>
    <nav class="em-steps" aria-label="乳化工作台步驟">${STEPS.map(key=>`<button type="button" data-em-step="${key}" aria-pressed="false">${LABELS[key]}</button>`).join('')}</nav>
    <h2 class="em-heading" tabindex="-1" data-em-heading></h2><p class="em-scope">球形液滴幾何與界面預算；不預測吸附、聚結或保存穩定性。</p><p class="em-error" role="status" data-em-error></p>
    <section data-em-panel="area">
      <div class="em-workspace"><div class="em-main-controls">${field('diameterUm')}<div class="em-actions"><button type="button" data-em-action="halve">直徑減半</button><button type="button" data-em-action="restore-diameter">還原 5 µm</button></div>
      <p class="em-basis" data-em-area-basis></p></div><div class="em-main-visual"><p class="em-current" data-em-area-current></p><div class="em-chart" data-em-chart="area" tabindex="0" role="region" aria-label="面積比較圖，窄螢幕可在圖內橫向捲動"></div><p class="em-caption">兩條面積共用零起點尺度；以 5 µm 為基準。</p></div></div>
      ${question('area','總油量固定，把目前直徑再減半，總界面積會變為幾倍？')}
      <div class="em-split" data-em-split hidden><svg viewBox="0 0 600 150" role="img" aria-label="幾何示意：一顆球拆成八顆直徑減半的小球，總體積相同"><circle cx="100" cy="68" r="42" class="em-sphere"/><path d="M200 67H272m-12-10 12 10-12 10" class="em-arrow"/>${Array.from({length:8},(_,i)=>`<circle cx="${325+i%4*58}" cy="${40+Math.floor(i/4)*54}" r="21" class="em-sphere"/>`).join('')}<text x="100" y="137" text-anchor="middle">1 顆，直徑 d</text><text x="412" y="137" text-anchor="middle">8 顆，直徑 d/2</text></svg><p class="em-caption">代表球體的體積守恆示意；不是實際滴數、排列或均質過程。</p></div>
      <details data-em-detail="areaMath"><summary>體積、計算步驟與理想漂移</summary><div class="em-formula"><span>A = 6V / d</span><p data-em-area-formula></p></div>${field('volumeMl')}<p data-em-particle-count></p><p>N = V / (πd³/6)。相同 V 下，直徑減半：N × 8、A × 2。</p><p data-em-drift></p><p>這只是孤立剛性球 Stokes 比例；密度差、牛頓黏度等其他條件固定。沒有依覆蓋預算改變阻力邊界，也沒有計算實際上浮距離、分離時間或保存期。</p></details>
    </section>
    <section data-em-panel="budget" hidden>
      <div class="em-workspace"><div class="em-main-controls">${field('emulsifierMg')}<p class="em-basis" data-em-budget-basis></p><button type="button" data-em-step="area">回去調整粒徑</button></div><div class="em-main-visual"><p class="em-current" data-em-budget-ratio></p><div class="em-chart" data-em-chart="budget" tabindex="0" role="region" aria-label="預算面積比較圖，窄螢幕可在圖內橫向捲動"></div><p class="em-caption">需求面積與理想可支應面積；不是實測覆蓋率。</p></div></div>
      ${question('budget','依目前指定的 f 與 Γ，這份界面預算足夠嗎？')}
      <details data-em-detail="budgetMath"><summary>可供比例、單位面積需求與計算</summary><div class="em-formula"><span>可供量 = mf；需求量 = ΓA</span><p data-em-budget-formula></p></div>${field('eligibleFraction')}${field('surfaceLoadMgM2')}<p>f 與 Γ 是本題指定條件，不是通用食品常數，也不是由配方量直接量出的吸附率。理想預算達標仍不能證明吸附已完成、界面均勻或乳液穩定。</p></details>
    </section>
    <section data-em-panel="distribution" hidden>
      <div class="em-workspace"><div class="em-main-controls">${field('smallVolumeFraction')}<p class="em-basis" data-em-distribution-basis></p><p class="em-caption">分散相的體積占比，不是顆粒數占比。</p></div><div class="em-main-visual"><div class="em-mean-readings"><p>d₃₂ <strong data-em-d32></strong><small>與總面積相容的平均徑</small></p><p>d₄₃ <strong data-em-d43></strong><small>體積加權平均徑</small></p></div>
      <div class="em-chart" data-em-chart="distribution" tabindex="0" role="region" aria-label="平均粒徑回算面積圖，窄螢幕可在圖內橫向捲動"></div><p class="em-current" data-em-underestimate></p></div></div>
      ${question('distribution','請選最完整的判讀：目前能用哪個平均徑回算總界面積？若兩者皆可，請選兩者。')}
      <details data-em-detail="distributionMath"><summary>兩粒級直徑、計算與平均定義</summary><div class="em-formula"><span>A = 6V / d₃₂</span><p data-em-distribution-formula></p></div><div class="em-advanced-grid">${field('smallDiameterUm')}${field('largeDiameterUm')}</div><div class="em-table-wrap" tabindex="0" role="region" aria-label="兩粒級幾何數值，可橫向捲動"><table><thead><tr><th scope="col">粒級</th><th scope="col">體積份額</th><th scope="col">滴數</th><th scope="col">面積</th></tr></thead><tbody data-em-classes></tbody></table></div><p>d₃₂ = Σnᵢdᵢ³ / Σnᵢdᵢ²；d₄₃ = Σnᵢdᵢ⁴ / Σnᵢdᵢ³。兩粒級時 d₃₂ = 1 / [φₛ/dₛ + (1−φₛ)/dₗ]，d₄₃ = φₛdₛ + (1−φₛ)dₗ。</p><p>φₛ 是分散相內小粒級的體積份額，不是乳液的油相體積分率。本步不替代上一步單分散預算，也不把 d₃₂ 或 d₄₃ 代進 Stokes 當整體分離速率。</p></details>
    </section>
    <nav class="em-bottom-nav" aria-label="切換工作台步驟"><button type="button" data-em-action="previous">上一步</button><button type="button" data-em-action="next">下一步</button></nav>
    <div class="em-record-bar"><button type="button" data-em-action="record">保留這次觀察</button><span data-em-record-count></span></div>
    <details data-em-detail="writing"><summary>寫下解釋與修訂（選填）</summary><p>原文保留後固定不變；後續另寫修訂。數值與圖已可查看，未看核對不等於盲答；自由文字不自動評分。</p><label class="em-field" for="${prefix}-conclusion">我的首次解釋<textarea id="${prefix}-conclusion" rows="4" data-em-control="conclusion" placeholder="滴變小，哪一項需求增加？這些數字還不能證明什麼？"></textarea></label><button type="button" data-em-action="retain">保留這份原文</button><p class="em-caption" data-em-writing-context></p><details data-em-detail="original"><summary>已保留的原文與當時條件</summary><pre class="em-raw" data-em-original></pre></details><label class="em-field" for="${prefix}-revision">後續修訂<textarea id="${prefix}-revision" rows="4" data-em-control="revision" disabled></textarea></label><p class="em-caption" data-em-writing-stale></p></details>
    <details data-em-detail="records"><summary>回看保留的觀察</summary><label class="em-field" for="${prefix}-record">觀察紀錄<select id="${prefix}-record" data-em-control="record"></select></label><pre class="em-raw" data-em-record-text></pre><p>回看不改寫目前參數、選項、原文或修訂。</p></details>
    <details data-em-detail="notes"><summary>新增內容、完整摘要與已存版本</summary><label class="em-field" for="${prefix}-pending">本次將附加的內容<textarea id="${prefix}-pending" rows="6" readonly data-em-pending></textarea></label><div class="em-actions"><button type="button" data-em-action="select-pending">選取待存內容</button><button type="button" data-em-action="select-summary">選取完整摘要</button></div><label class="em-field" for="${prefix}-summary">目前條件、判讀與自己的結論<textarea id="${prefix}-summary" rows="9" readonly data-em-summary></textarea></label><label class="em-field" for="${prefix}-saved">已成功附加的版本<select id="${prefix}-saved" data-em-control="saved"></select></label><pre class="em-raw" data-em-saved-text></pre></details>
    <div class="em-save">${typeof onSaveSummary==='function'?'<button type="button" class="em-primary" data-em-action="save">附加到本課筆記</button>':''}<p class="em-feedback" role="status" data-em-save-status></p><a href="${esc(href(reviewHref))}">到我的複習查看筆記 →</a></div><p class="em-caption">同頁跨課再回來可接續；重新整理前請附加到筆記。</p>
    <details data-em-detail="sources"><summary>模型條件與來源</summary><p>本頁數值皆為假想指定條件，並非特定乳化食品的實測資料。幾何假設為球形液滴；界面預算不含吸附等溫線、吸附速率、競爭吸附或聚結動力學。覆蓋預算不足不等於已觀測聚結，預算充足也不能保證穩定。</p><ul>${EMULSION_SOURCES.map(source=>{const url=secureUrl(source.url);return `<li>${url?`<a href="${esc(url)}" data-em-source="${esc(source.id)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>`:esc(source.title)}</li>`;}).join('')}</ul><button type="button" data-em-action="reset">重設全部參數</button><p>重設保留自己的選項、文字與曾看解釋的紀錄；須重新核對。</p></details>
  </section>`;

  function expected(key) {return key==='area'?'double':key==='budget'?view.budget.status:state.smallVolumeFraction===0||state.smallVolumeFraction===1||state.smallDiameterUm===state.largeDiameterUm?'both':'d32';}
  function explanation(key) {
    if(key==='area')return '總體積固定，A = 6V/d，因此直徑減半使總面積變為 2 倍，滴數變為 8 倍。面積需求增加，不代表實際乳化劑已吸附。';
    if(key==='budget')return `${view.budget.status==='shortfall'?`理想可供量尚差 ${fmt(view.budget.shortfallMg)} mg。`:`理想可供量達到指定需求，餘額 ${fmt(view.budget.surplusMg)} mg。`}這是 mf 與 ΓA 的帳目；不能由它確認實際覆蓋、聚結或食品保存穩定性。`;
    return expected(key)==='both'?'目前只剩一個有效粒級，或兩級直徑相同，因此 d₃₂ = d₄₃，兩者回算面積相同。不能把這個特例推到不同粒徑並存的情況。':`兩個不同粒級都存在時，d₃₂ 才保留球形液滴的體積／面積比。此時把 d₄₃ 直接代入 6V/d，總面積會低估 ${fmt(view.distribution.areaUnderestimatePercent)}%。`;
  }
  function bars(key,items,unit='m²') {
    const high=Math.max(...items.map(item=>item.value)),power=high>0?10**Math.floor(Math.log10(high)):1,scaled=high/power,max=([1,2,5,10].find(n=>n>=scaled)||10)*power,left=180,right=560,width=right-left,x=value=>left+value/max*width;
    $(`[data-em-chart="${key}"]`).innerHTML=`<svg viewBox="0 0 600 205" role="img" aria-label="${esc(items.map(item=>`${item.label} ${fmt(item.value)} ${unit}`).join('；'))}，共用零起點尺度"><title>${esc(items.map(item=>`${item.label}：${fmt(item.value)} ${unit}`).join('；'))}</title>${[0,.5,1].map(q=>`<path class="em-grid" d="M${x(max*q)} 35V156"/><text class="em-tick" x="${x(max*q)}" y="190" text-anchor="middle">${fmt(max*q)}</text>`).join('')}${items.map((item,i)=>`<g><text class="em-series" x="168" y="${66+i*73}" text-anchor="end"><tspan class="em-desktop-series">${esc(item.label)}</tspan><tspan class="em-mobile-series">${i===0?'A':'B'}</tspan></text><rect data-em-bar="${key}-${i}" x="${left}" y="${43+i*73}" width="${Math.max(0,x(item.value)-left)}" height="29" class="em-bar-${i}"/><text class="em-number" x="${Math.max(left+6,x(item.value))}" y="${36+i*73}" text-anchor="${item.value===0?'start':'end'}">${fmt(item.value)} ${unit}</text></g>`).join('')}</svg><div class="em-chart-readings">${items.map((item,i)=>`<p><span>${i===0?'A':'B'} · ${esc(item.label)}</span><strong data-em-chart-value="${key}-${i}">${fmt(item.value)} ${unit}</strong></p>`).join('')}</div>`;
  }
  const remember=(list,value)=>{if(!list.includes(value))list.push(value);};
  for(const detail of $$('[data-em-detail]'))detail.open=Boolean(d.details[detail.dataset.emDetail]);
  function captureDetails(){for(const detail of $$('[data-em-detail]')){const name=detail.dataset.emDetail;d.details[name]=detail.open;if(detail.open&&SCIENCE_DETAILS.includes(name))remember(d.seenDetails,name);}}
  function condition(){return `步驟 ${LABELS[step]}；V=${state.volumeMl} mL；d=${state.diameterUm} µm；m=${state.emulsifierMg} mg；f=${state.eligibleFraction}；Γ=${state.surfaceLoadMgM2} mg/m²；dₛ=${state.smallDiameterUm} µm；dₗ=${state.largeDiameterUm} µm；φₛ=${state.smallVolumeFraction}。`;}
  function context(){captureDetails();return {state:clone(state),step,answers:clone(answers),visited:[...visited],details:[...d.seenDetails],sources:[...d.seenSources],condition:condition(),seen:everSeen()};}
  function contextText(c){return `${c.condition} ${c.seen?'已看核對／參考':'未看核對／參考'}；分步紀錄：${STEPS.map(key=>`${LABELS[key]} ${choiceName(key,c.answers[key].choice)}／${c.answers[key].checked?'已核對':'未核對'}／${c.answers[key].reference?'參考正顯示':'參考未顯示'}／${c.answers[key].seen?'曾看核對或參考':'未看核對或參考'}`).join('；')}。曾展開：${c.details.map(key=>DETAIL_LABELS[key]).join('、')||'無'}；曾開啟來源 ${c.sources.length} 個：${c.sources.map(key=>EMULSION_SOURCES.find(source=>source.id===key)?.title||key).join('、')||'無'}（不表示已讀）。圖與數值已可查看，不是盲答。`;}
  function modelParts(){const g=view.geometry,b=view.budget,v=view.distribution;return {
    volume:`共同分散相體積 V = ${state.volumeMl} mL。`,
    area:`單分散：d = ${state.diameterUm} µm；A = ${fmt(g.totalAreaM2)} m²；N = ${fmt(g.particleCount)}。相對 5 µm：面積 ${fmt(view.comparison.areaRatio)} 倍、滴數 ${fmt(view.comparison.countRatio)} 倍；相同理想 Stokes 條件下漂移 ${fmt(view.comparison.idealDriftRatio)} 倍。`,
    budget:`預算：m = ${state.emulsifierMg} mg、f = ${state.eligibleFraction}、Γ = ${state.surfaceLoadMgM2} mg/m²；可供 ${fmt(b.eligibleMg)} mg、需求 ${fmt(b.requiredMg)} mg、容量比 ${fmt(b.capacityRatio)}；${b.status==='meets'?'理想預算達到需求':'理想預算不足'}，不等於實際覆蓋或穩定。`,
    distribution:`兩粒級：dₛ = ${state.smallDiameterUm} µm、dₗ = ${state.largeDiameterUm} µm，小粒級體積份額 ${percent(state.smallVolumeFraction)}（φₛ=${state.smallVolumeFraction}）；d₃₂ = ${fmt(v.d32Um)} µm、d₄₃ = ${fmt(v.d43Um)} µm；面積 ${fmt(v.totalAreaM2)} m²，誤用 d₄₃ 得 ${fmt(v.areaUsingD43M2)} m²，低估 ${fmt(v.areaUnderestimatePercent)}%。`};}
  function answerText(key){const answer=answers[key];return `${LABELS[key]}｜${visited.has(key)?'已開啟':'尚未開啟'}；自己的判讀：${choiceName(key,answer.choice)}；${answer.checked?'已核對':'未核對'}；${answer.seen?'曾看核對／參考':'未看核對／參考'}${answer.checked||answer.reference?'\n核對／參考：'+explanation(key):''}`;}
  function recordText(r){return [contextText(r.context),...Object.values(r.model),...r.answers,`當時原文（原樣）：\n${r.writing.original??r.writing.draft}`,`當時修訂（原樣）：\n${r.writing.revision}`,r.writing.firstContext?`首次編寫條件：${contextText(r.writing.firstContext)}`:'尚未編寫。',r.writing.retainedContext?`保留原文時：${contextText(r.writing.retainedContext)}`:'當時尚未保留原文。',r.writing.revisionContext?`修訂時：${contextText(r.writing.revisionContext)}`:'當時尚未修訂。'].join('\n');}
  function parts(){captureDetails();const w=d.writing,body={intro:'乳化界面工作台｜假想指定條件；不是實測吸附或穩定性預測。',...modelParts(),step:`目前步驟：${LABELS[step]}。`};
    for(const key of STEPS)body['answer:'+key]=answerText(key);
    for(const key of d.seenDetails)body['detail:'+key]=`曾展開：${DETAIL_LABELS[key]}。`;
    for(const key of d.seenSources){const source=EMULSION_SOURCES.find(item=>item.id===key);body['source:'+key]=`曾開啟來源：${source.title}（開啟不表示已讀）。`;}
    body.writingText=w.touched||w.original!==null?`自己的結論：${w.original??w.draft}（未自動評分；原樣文字）`:'自己的結論：未寫（未自動評分）';
    body.writingStatus=w.original===null?'原文狀態：尚未保留。':'原文狀態：已固定保留，後續另寫修訂。';
    if(w.firstContext)body.firstContext=`首次編寫條件：${contextText(w.firstContext)}`;
    if(w.lastContext)body.lastContext=`這份文字最後修改時：${w.lastContext.seen?'已看核對／參考':'未看核對／參考'}；${contextText(w.lastContext)}`;
    if(w.retainedContext)body.retainedContext=`保留原文時條件：${contextText(w.retainedContext)}`;
    body.revision=w.revisionTouched?`後續修訂（原樣）：\n${w.revision}`:'修訂：尚未填寫。';
    if(w.revisionContext)body.revisionContext=`修訂時條件：${contextText(w.revisionContext)}`;
    for(const [index,record]of d.records.entries())body['record:'+index]=`保留觀察 ${index+1}（固定快照）：\n${recordText(record)}`;
    body.boundary='查看、核對、保存都不代表已掌握；沒有計算均質歷程、吸附、聚結、分離時間或保存期。';body.sources=EMULSION_SOURCES.map(s=>`${s.title}：${s.url}`).join('\n');return body;
  }
  function pending(){const all=parts(),full=Object.values(all).join('\n\n'),changed=Object.entries(all).filter(([key,value])=>d.saved[key]!==value);return {parts:all,full,text:changed.length?Object.keys(d.saved).length?['乳化觀察 · 本次新增／修改',...changed.map(([,value])=>value)].join('\n\n'):full:''};}
  function renderJournal(){if(disposed)return;const w=d.writing,original=control('conclusion'),revision=control('revision');if(original.value!==w.draft)original.value=w.draft;if(revision.value!==w.revision)revision.value=w.revision;original.readOnly=w.original!==null;revision.disabled=w.original===null;action('retain').disabled=w.original!==null||!w.touched;
    text('[data-em-writing-context]',w.lastContext?`最後修改時：${w.lastContext.seen?'已看核對／參考':'尚未看核對／參考'}；自由文字未自動評分。`:'可先記下自己的理解，再回去改參數。');text('[data-em-original]',w.original===null?'尚未保留原文。':`${w.original}\n\n首次編寫：${contextText(w.firstContext)}\n保留時：${contextText(w.retainedContext)}`);text('[data-em-writing-stale]',w.original!==null&&w.retainedCondition!==condition()?'目前條件已改變；固定原文仍屬當時條件，可在修訂中補充。':'');
    text('[data-em-record-count]',d.records.length?`已保留 ${d.records.length} 次`:'尚未保留觀察');if(recordCount!==d.records.length){recordCount=d.records.length;control('record').innerHTML='<option value="">選擇觀察</option>'+d.records.map((r,i)=>`<option value="${i}">第 ${i+1} 次 · ${esc(LABELS[r.context.step])}</option>`).join('');}control('record').value=d.selectedRecord;const record=/^(?:0|[1-9]\d*)$/.test(d.selectedRecord)?d.records[Number(d.selectedRecord)]:null;text('[data-em-record-text]',record?recordText(record):'保留後可在這裡回看。');
    if(savedCount!==d.savedVersions.length){savedCount=d.savedVersions.length;control('saved').innerHTML='<option value="">選擇已存版本</option>'+d.savedVersions.map((v,i)=>`<option value="${i}">第 ${i+1} 次附加</option>`).join('');}control('saved').value=d.selectedSaved;const saved=/^(?:0|[1-9]\d*)$/.test(d.selectedSaved)?d.savedVersions[Number(d.selectedSaved)]:null;text('[data-em-saved-text]',saved?`當次新增：\n${saved.text}\n\n當時完整摘要：\n${saved.full}`:'');
    const next=pending(),over=next.text.length>10000;$('[data-em-summary]').value=next.full;$('[data-em-pending]').value=next.text;if(action('save'))action('save').disabled=Boolean(d.pending)||!next.text||over;text('[data-em-save-status]',d.pending?'正在附加；仍可繼續操作。':over?'待存內容超過 10,000 字元，尚未送出；全文保留，可選取複製。':!next.text?'已追加到本課筆記，可到我的複習查看。':d.status);
  }
  function save(){if(disposed||d.pending||typeof onSaveSummary!=='function')return;const captured=pending();if(!captured.text||captured.text.length>10000){renderJournal();return;}d.pending=captured;d.status='';renderJournal();const finish=ack=>{if(d.pending!==captured)return;d.pending=null;if(ack===true){Object.assign(d.saved,captured.parts);d.savedVersions.push({text:captured.text,full:captured.full});d.status='';}else d.status='尚未保存；新增內容仍可重試或選取複製。';d.active?.render();};try{const answer=onSaveSummary(captured.text);if(answer!==null&&['object','function'].includes(typeof answer)&&typeof answer.then==='function')Promise.resolve(answer).then(finish,()=>finish(false));else finish(answer);}catch{finish(false);}}
  function render() {
    if(disposed)return;captureDetails();text('[data-em-heading]',HEADINGS[step]);text('[data-em-error]',d.error);
    for(const node of $$('[data-em-step]'))node.setAttribute('aria-pressed',String(node.dataset.emStep===step));
    for(const node of $$('[data-em-panel]'))node.hidden=node.dataset.emPanel!==step;
    for(const key of Object.keys(FIELDS)){const node=control(key);if(node.value!==String(state[key]))node.value=String(state[key]);node.setAttribute('aria-valuetext',shownValue(key,state[key]));text(`[data-em-reading="${key}"]`,shownValue(key,state[key]));}
    const g=view.geometry,b=view.budget,distribution=view.distribution,referenceArea=g.totalAreaM2/view.comparison.areaRatio;
    text('[data-em-area-basis]',`固定分散相 V = ${fmt(state.volumeMl)} mL；本步所有液滴具有相同直徑。`);
    text('[data-em-area-current]',`界面積 ${fmt(g.totalAreaM2)} m² · 基準的 ${fmt(view.comparison.areaRatio)} 倍`);
    bars('area',[{label:'基準 5 µm',value:referenceArea},{label:`目前 ${fmt(state.diameterUm)} µm`,value:g.totalAreaM2}]);
    text('[data-em-area-formula]',`V = ${fmt(g.volumeM3)} m³，d = ${fmt(g.diameterM)} m → A = ${fmt(g.totalAreaM2)} m²`);
    text('[data-em-particle-count]',`目前幾何模型的液滴總數 N = ${fmt(g.particleCount)}；不是圖示圓的個數。`);
    text('[data-em-drift]',`相對 5 µm 的理想漂移速率比 = (d / 5 µm)² = ${fmt(view.comparison.idealDriftRatio)}。若把目前直徑減半，該速率變為目前的 1/4。`);
    action('halve').disabled=state.diameterUm/2<EMULSION_LIMITS.diameterUm[0];
    $('[data-em-split]').hidden=!(answers.area.checked||answers.area.reference);
    text('[data-em-budget-basis]',`沿用單分散 d = ${fmt(state.diameterUm)} µm，V = ${fmt(state.volumeMl)} mL，A = ${fmt(g.totalAreaM2)} m²。`);
    bars('budget',[{label:'需求面積 A',value:g.totalAreaM2},{label:'題設可支應',value:b.capacityAreaM2}]);
    text('[data-em-budget-formula]',`${fmt(state.emulsifierMg)} × ${fmt(state.eligibleFraction)} = ${fmt(b.eligibleMg)} mg；${fmt(state.surfaceLoadMgM2)} × ${fmt(g.totalAreaM2)} = ${fmt(b.requiredMg)} mg`);
    text('[data-em-budget-ratio]',`容量比 = 可供量 / 需求量 = ${fmt(b.capacityRatio)}；不是實際覆蓋率。`);
    text('[data-em-distribution-basis]',`同樣 V = ${fmt(state.volumeMl)} mL，這一步改比較 ${fmt(state.smallDiameterUm)} 與 ${fmt(state.largeDiameterUm)} µm 兩粒級。`);
    text('[data-em-d32]',`${fmt(distribution.d32Um)} µm`);text('[data-em-d43]',`${fmt(distribution.d43Um)} µm`);
    bars('distribution',[{label:'依 d₃₂ 回算',value:distribution.totalAreaM2},{label:'依 d₄₃ 回算',value:distribution.areaUsingD43M2}]);
    text('[data-em-distribution-formula]',`兩粒級面積相加 = ${fmt(distribution.totalAreaM2)} m²；代入 d₃₂ 可得相同面積。`);
    text('[data-em-underestimate]',`若改用 d₄₃，面積低估 ${fmt(distribution.areaUnderestimatePercent)}%。`);
    $('[data-em-classes]').innerHTML=distribution.classes.map((c,i)=>`<tr><th scope="row">${i===0?'小':'大'} · ${fmt(c.diameterUm)} µm</th><td>${percent(c.volumeFraction)}</td><td>${fmt(c.particleCount)}</td><td>${fmt(c.areaM2)} m²</td></tr>`).join('');
    for(const key of STEPS){const answer=answers[key];for(const node of $$('[data-em-choice]'))if(node.dataset.emFor===key)node.setAttribute('aria-pressed',String(answer.choice===node.dataset.emChoice));for(const node of $$('[data-em-action="check"]'))if(node.dataset.emFor===key)node.disabled=!answer.choice;text(`[data-em-feedback="${key}"]`,answer.checked?`${answer.choice===expected(key)?'這個判讀符合目前模型。':'再檢查這項比例或條件。'} ${explanation(key)}`:answer.reference?`參考：${explanation(key)}（未代填你的選項）`:'');}
    action('previous').disabled=step==='area';action('next').disabled=step==='distribution';renderJournal();
  }
  function invalidate() {for(const answer of Object.values(answers)){answer.checked=false;answer.reference=false;}d.status='';}
  function setParameter(key,value) {const next={...state,[key]:value};try{const calculated=evaluateEmulsion(next);Object.assign(state,next);view=calculated;d.error='';invalidate();}catch{d.error='參數超出允許範圍或粒級順序不合；已保留上一組有效數值。';}render();}
  function move(next) {if(!STEPS.includes(next)||next===step)return;step=next;d.step=next;visited.add(step);d.error='';d.status='';render();$('[data-em-heading]').focus({preventScroll:true});$('[data-em-heading]').scrollIntoView?.({block:'nearest',behavior:'instant'});}
  function onInput(event) {
    if(disposed||!container.contains(event.target))return;captureDetails();const key=event.target.dataset?.emControl;
    if(key==='record'||key==='saved'){const value=event.target.value,list=key==='record'?d.records:d.savedVersions;if(value!==''&&(!/^(?:0|[1-9]\d*)$/.test(value)||!list[Number(value)])){renderJournal();return;}d[key==='record'?'selectedRecord':'selectedSaved']=value;renderJournal();return;}
    if(key==='conclusion'||key==='revision'){const w=d.writing,isDraft=key==='conclusion',name=isDraft?'draft':'revision';if(isDraft?w.original!==null:w.original===null){renderJournal();return;}if(event.target.value===w[name]&&(isDraft?w.touched:w.revisionTouched))return;w[name]=event.target.value;const c=context();if(isDraft){w.touched=true;w.firstContext??=c;w.lastContext=c;}else{w.revisionTouched=true;w.revisionContext=c;}d.status='';renderJournal();return;}
    if(!Object.hasOwn(FIELDS,key)||FIELDS[key].group!==step)return;
    setParameter(key,parse(event.target.value));
  }
  function onClick(event) {
    if(disposed)return;captureDetails();const source=event.target?.closest?.('[data-em-source]');if(source&&container.contains(source)&&EMULSION_SOURCES.some(item=>item.id===source.dataset.emSource)){remember(d.seenSources,source.dataset.emSource);renderJournal();return;}const node=event.target?.closest?.('button');if(!node||!container.contains(node)||node.disabled)return;
    if(node.dataset.emStep){move(node.dataset.emStep);return;}
    if(node.dataset.emChoice){if(node.dataset.emFor!==step||!Object.hasOwn(CHOICES[step],node.dataset.emChoice))return;answers[step].choice=node.dataset.emChoice;answers[step].checked=false;answers[step].reference=false;d.status='';render();return;}
    const name=node.dataset.emAction;
    if(name==='previous'||name==='next'){move(STEPS[STEPS.indexOf(step)+(name==='next'?1:-1)]);return;}
    if(name==='halve'&&step==='area'){if(state.diameterUm/2<EMULSION_LIMITS.diameterUm[0])return;setParameter('diameterUm',state.diameterUm/2);return;}
    if(name==='restore-diameter'&&step==='area'){setParameter('diameterUm',EMULSION_DEFAULTS.diameterUm);return;}
    if((name==='check'||name==='reference')&&node.dataset.emFor===step){const answer=answers[step];if(name==='check'){if(!answer.choice)return;answer.checked=true;}else answer.reference=true;answer.seen=true;d.status='';render();return;}
    if(name==='reset'){Object.assign(state,EMULSION_DEFAULTS);view=evaluateEmulsion(state);d.error='';invalidate();render();return;}
    if(name==='record'){d.records.push(clone({context:context(),model:modelParts(),answers:STEPS.map(answerText),writing:d.writing}));d.selectedRecord=String(d.records.length-1);d.status='';renderJournal();return;}
    if(name==='retain'){const w=d.writing;if(w.original===null&&w.touched){w.original=w.draft;w.retainedContext=context();w.retainedCondition=condition();d.status='';renderJournal();}return;}
    if(name==='select-summary'||name==='select-pending'){const field=$(name==='select-summary'?'[data-em-summary]':'[data-em-pending]');field.focus();field.select?.();return;}
    if(name==='save')save();
  }
  function dispose(){if(disposed)return;captureDetails();disposed=true;container.removeEventListener('input',onInput);container.removeEventListener('click',onClick);for(const detail of $$('[data-em-detail]'))detail.ontoggle=null;if(d.active===active)d.active=null;if(mounted.get(container)===active)mounted.delete(container);}
  const active={dispose,render};d.active=active;mounted.set(container,active);
  for(const detail of $$('[data-em-detail]'))detail.ontoggle=()=>{if(disposed)return;captureDetails();renderJournal();};
  container.addEventListener('input',onInput);container.addEventListener('click',onClick);render();return dispose;
}
