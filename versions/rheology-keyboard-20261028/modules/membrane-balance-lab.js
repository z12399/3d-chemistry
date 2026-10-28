import {escapeHTML as esc} from './storage.js';
import {MEMBRANE_BALANCE_ID,evaluateMembraneBalance} from './membrane-balance-model.js';
export const MEMBRANE_BALANCE_LAB_ID=MEMBRANE_BALANCE_ID;

// Teaching assumptions are explicit; no pressure-to-flux or membrane-material model.
export const MEMBRANE_BALANCE_SOURCES=[
  {id:'membrane-nf-observed-intrinsic-2023',title:'Experimental and Modeling Study of the Nanofiltration of Alcohol-Based Molecules and Amino Acids by Commercial Membranes',publisher:'Membranes (MDPI), 2023, 13(7):631; Shirin Shahgodari, Jordi Labanda, Joan Llorens',url:'https://diposit.ub.edu/bitstreams/677ea981-719e-409e-9970-df74a7071a62/download',locator:'PDF 第 3 頁 bulk 濃度定義；第 4 頁式 (9)–(10)',note:'區分以 bulk 濃度為參照的表觀截留與以膜面濃度為參照的 intrinsic rejection；本活動只採定義，不採該論文實驗數值，也不將指定 Robs 當真實膜常數。'},
  {id:'membrane-dupont-filmtec-manual',title:'FilmTec Reverse Osmosis Membranes Technical Manual',publisher:'DuPont Water Solutions, Version 20, August 2026',url:'https://www.dupont.com/content/dam/water/amer/us/en/water/public/documents/en/RO-NF-FilmTec-Manual-45-D01504-en.pdf',locator:'印刷第 15 頁 recovery／flux 定義；第 152 頁式 (79)',note:'支撐系統流量回收、通量定義及兩出口體積流量衡算；成分質量衡算由本活動無反應、無累積等假設推得。本活動的 Robs 依槽內 bulk 配對濃度定義，不沿用手冊以進料為參照的 rejection，也不採膜商性能或實測數值。'},
];
const drafts=new WeakMap();let sequence=0;
const clone=value=>structuredClone(value);
const fmt=value=>Number(value).toLocaleString('en-US',{maximumFractionDigits:2,useGrouping:false});
const percent=value=>`${fmt(value*100)}%`;
const key=d=>`${d.theta}|${d.rejection}`;
const parameters=d=>({theta:d.theta,rejection:d.rejection,feedFlow:100,feedConcentration:12,area:2,collectionHours:.5});
const conditionText=p=>`θ=${percent(p.theta)}；Robs=${percent(p.rejection)}；QF=100 L/h；CF=12 g/L；A=2 m²；收集時間=0.5 h`;
const label=value=>({higher:'回收率提高',lower:'回收率降低',same:'回收率相同',unknown:'先保留'}[value]||'未選');
const fresh=()=>({theta:.75,rejection:.8,cases:{},observations:[],sources:[],formulaOpened:false,revealedKeys:[],cursor:{firstKeys:[],revealedKeys:[],count:0,writing:{},sources:[],formula:false,started:false}});
function current(d){const k=key(d);return d.cases[k]??=( {parameters:parameters(d),choice:'',prediction:'',revision:'',next:'',first:null,revealed:false} );}
const writing=c=>({choice:c.choice,prediction:c.prediction,revision:c.revision,next:c.next});
const writingText=w=>`回收率預測：${label(w.choice)}\n理由：${w.prediction||'未填'}\n觀察後修訂：${w.revision||'未填'}\n下一項證據：${w.next||'未填'}`;
const sourceText=()=>MEMBRANE_BALANCE_SOURCES.map(s=>`${s.title}\n${s.url}`).join('\n');
const resultText=r=>`槽內／濃縮液 ${fmt(r.bulkConcentration)} g/L；透過液 ${fmt(r.permeateConcentration)} g/L\n目標成分：進料 ${fmt(r.feedSoluteFlow)} = 濃縮液 ${fmt(r.retentateSoluteFlow)} + 透過液 ${fmt(r.permeateSoluteFlow)} g/h\n濃縮液成分回收率 ${percent(r.retentateRecovery)}；透過通量 ${fmt(r.flux)} L/(m²·h)；0.5 h 收集 ${fmt(r.permeateVolume)} L`;

function diagram(d,r,prefix){
  const shown=current(d).revealed;
  return `<div class="mb-stream mb-feed"><span>新鮮進料</span><strong>100 <small>L/h</small></strong><span>12 g/L</span></div><span class="mb-arrow" aria-hidden="true">→</span><div class="mb-tank"><span>完全混合膜槽</span><div class="mb-liquid"><span>槽內 = 濃縮液</span><strong>${shown?fmt(r.bulkConcentration):'待計算'}${shown?'<small> g/L</small>':''}</strong></div><span class="mb-membrane">膜</span><span class="mb-area">面積 2 m² · 定液位</span></div><div class="mb-outlets"><div class="mb-stream mb-retentate"><span>→ 濃縮液</span><strong>${fmt(r.retentateFlow)} <small>L/h</small></strong><span>${shown?`${fmt(r.bulkConcentration)} g/L`:'濃度待計算'}</span></div><div class="mb-stream mb-permeate"><span>→ 透過液</span><strong>${fmt(r.permeateFlow)} <small>L/h</small></strong><span>${shown?`${fmt(r.permeateConcentration)} g/L`:'濃度待計算'}</span></div></div>`;
}

/** Drafts survive lesson routes in this document; durable storage belongs to the common host. */
export function mountMembraneBalanceLab(root,id=MEMBRANE_BALANCE_ID,{draftOwner,draftKey='proc-membrane-driving',onSaveSummary}={}){
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  if(id!==MEMBRANE_BALANCE_ID)throw new RangeError('Unknown membrane activity');
  const owned=draftOwner&&typeof draftOwner==='object';
  if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,new Map());
  const board=owned?drafts.get(draftOwner):new Map();
  if(!board.has(draftKey))board.set(draftKey,fresh());
  const d=board.get(draftKey),prefix=`membrane-${++sequence}`;current(d);
  const field=name=>root.querySelector(`[data-mb-${name}]`),action=name=>root.querySelector(`[data-mb-action="${name}"]`);
  let disposed=false,feedback='',saveStatus='',error='';
  root.innerHTML=`<section class="membrane-balance-lab" aria-labelledby="${prefix}-title"><h2 class="mb-sr-only" id="${prefix}-title">膜分離：濃度、回收率與通量</h2>
  <div class="mb-top"><strong>濃度上升，成分也留得更多嗎？</strong><span>指定理想穩態 · 非實測</span></div>
  <div class="mb-controls"><label for="${prefix}-theta">透過液占進料 θ <output data-mb-theta-label></output><input id="${prefix}-theta" type="range" min="5" max="95" step="5" data-mb-theta></label><label for="${prefix}-rejection">指定表觀截留率 Robs <output data-mb-rejection-label></output><input id="${prefix}-rejection" type="range" min="0" max="100" step="5" data-mb-rejection></label></div>
  <div class="mb-actions"><button type="button" data-mb-preset="a">參照 A · 50 / 80%</button><button type="button" data-mb-preset="b">比較 B · 75 / 80%</button><button type="button" data-mb-preset="c">比較 C · 75 / 50%</button><button class="mb-primary" type="button" data-mb-action="calculate">計算並比較</button><button type="button" data-mb-action="record">記下這次觀察</button></div>
  <p class="mb-error" role="status" data-mb-error></p><div class="mb-diagram" data-mb-diagram aria-label="連續穩態膜槽的三股物流"></div>
  <div class="mb-results" data-mb-results aria-live="polite"></div><div data-mb-balance class="mb-balance"></div>
  <p class="mb-reference">已知參照 A：θ 50%、Robs 80% → 濃縮液 20 g/L · 成分回收 83.33% · 通量 25 L/(m²·h)</p>
  <p class="mb-context" data-mb-context></p><p class="mb-feedback" role="status" data-mb-feedback></p>
  <details><summary>我的預測、修訂與下一項證據</summary><p>與參照 A 比，濃縮液中的目標成分回收率會怎麼變？可先寫，也可直接計算。</p><div class="mb-choices" role="group" aria-label="成分回收率預測">${[['higher','提高'],['lower','降低'],['same','相同'],['unknown','先保留']].map(([v,l])=>`<button type="button" data-mb-choice="${v}">${l}</button>`).join('')}</div><label for="${prefix}-prediction">目前的理由<textarea id="${prefix}-prediction" rows="2" data-mb-prediction></textarea></label><p class="mb-context" data-mb-first></p><label for="${prefix}-revision">觀察後的修訂<textarea id="${prefix}-revision" rows="2" data-mb-revision></textarea></label><label for="${prefix}-next">要判斷真實膜製程，還要補什麼證據？<textarea id="${prefix}-next" rows="2" data-mb-next></textarea></label><button type="button" data-mb-action="record-writing">記錄這次文字</button></details>
  <details><summary>已記錄的觀察 <span data-mb-count></span></summary><div data-mb-records></div></details>
  <details><summary>檢查並保存摘要</summary><label for="${prefix}-summary">所有條件的完整摘要<textarea id="${prefix}-summary" readonly rows="7" data-mb-summary></textarea></label><button type="button" data-mb-action="copy">選取完整摘要</button><label for="${prefix}-append">本次附加內容<textarea id="${prefix}-append" readonly rows="5" data-mb-append></textarea></label><button type="button" data-mb-action="save" ${typeof onSaveSummary!=='function'?'hidden':''}>附加到本課筆記</button><p role="status" data-mb-save-status></p><p class="mb-context">課內返回可保留本次草稿；重新整理前請保存或複製。保存成功後才推進，不截斷內容。</p></details>
  <details data-mb-formula><summary>公式、適用範圍與來源</summary><p>這是連續、定液位、完全混合的理想膜槽；每一组設定是一個獨立穩態，不是同一批液體的時間演變。單一目標成分不反應、不吸附；忽略取樣、洩漏與體積非加成，槽內與濃縮液濃度相同：CB=CR。</p><p>θ=QP/QF 是透過液體積流量分率；Robs=1−CP/CB 是以槽內 bulk 濃度為基準的表觀截留率。本工作台把 Robs 當指定輸入，不由孔徑、材質或壓力預測。intrinsic rejection 的分母是膜面濃度 CM，這裡沒有 CM，不能計算。</p><p>QF=QR+QP；QF·CF=QR·CB+QP·CP。代入 CP=(1−Robs)CB，得到 CB=CF/[1−θ·Robs]；濃縮液成分回收率 ηR=QR·CB/(QF·CF)=(1−θ)/(1−θ·Robs)。Robs、θ 與 ηR 的分母與意義不同。</p><p>J=QP/A=VP/(A·t)。面積 2 m²、收集 0.5 h；這是依指定透過液流量核算通量，沒有預測加壓後可達到多少通量。若實際通量隨時間改變，收集體積除以面積與時間只能得到期間平均。</p><p>真實乳清含多種成分，需各自量測濃度與平衡。濃差極化、膜汙堵、溫度、滲透壓、膜面濃度與阻力都未指定；不能由這組守恆關係斷言加壓比例、膜選擇性或清洗效果。原課的逆滲透 ΔP−Δπ 只說明理想淨驅動壓差，不能單独決定 J。</p><ul>${MEMBRANE_BALANCE_SOURCES.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-mb-source="${esc(s.id)}">${esc(s.title)}</a></li>`).join('')}</ul><p>這些數值是依定義與守恆構造的教學案例，不是論文或食品廠的量測資料。</p></details></section>`;

  function captureFirst(trigger){const c=current(d);if(!c.first)c.first={trigger,parameters:clone(parameters(d)),writing:clone(writing(c)),exposure:{referenceAKnown:true,formulaOpened:d.formulaOpened,sourceOpened:[...d.sources],previouslyRevealedKeys:[...d.revealedKeys]}};}
  function exposedText(keys){return keys.map(k=>{const p=d.cases[k].parameters;return `θ ${percent(p.theta)} / Robs ${percent(p.rejection)}`;}).join('、')||'無';}
  function firstText(c){return c.first?`這組條件首次保留（${c.first.trigger}）：${writingText(c.first.writing)}\n當時已知參照 A；已開公式=${c.first.exposure.formulaOpened?'是':'否'}；已開來源=${c.first.exposure.sourceOpened.join('、')||'無紀錄'}；之前已顯示條件=${exposedText(c.first.exposure.previouslyRevealedKeys)}。後續修改不覆寫快照。`:'這組條件尚未保留首次快照。參照 A 與流量已可見；不視為盲測。';}
  function observationText(o,i){return `觀察 ${i+1}｜${conditionText(o.parameters)}\n${o.result?resultText(o.result):'尚未計算本組結果'}\n${writingText(o.writing)}`;}
  function archive(){return ['膜分離：理想完全混合穩態膜槽','固定 QF=100 L/h、CF=12 g/L、A=2 m²；CB=CR。每組獨立穩態，Robs 是指定值。參照 A 的答案從一開始已顯示。',...Object.values(d.cases).map(c=>[conditionText(c.parameters),firstText(c),c.revealed?resultText(evaluateMembraneBalance(c.parameters)):'本組結果尚未顯示',writingText(writing(c))].join('\n')),...d.observations.map(observationText),`已開公式：${d.formulaOpened?'是':'否'}；已開來源：${d.sources.join('、')||'無紀錄'}。連結開啟不代表讀懂或讀完。`,sourceText()].join('\n\n');}
  function appendPlan(){
    const next=clone(d.cursor),blocks=[];
    for(const [k,c] of Object.entries(d.cases)){
      if(c.first&&!next.firstKeys.includes(k)){blocks.push(conditionText(c.parameters)+'\n'+firstText(c));next.firstKeys.push(k);}
      if(c.revealed&&!next.revealedKeys.includes(k)){blocks.push('首次顯示結果｜'+conditionText(c.parameters)+'\n'+resultText(evaluateMembraneBalance(c.parameters)));next.revealedKeys.push(k);}
      const w=writing(c),previous=next.writing[k];
      if(JSON.stringify(w)!==JSON.stringify(previous)){if(Object.values(w).some(Boolean)||previous)blocks.push(conditionText(c.parameters)+'\n'+writingText(w));next.writing[k]=clone(w);}
    }
    for(let i=next.count;i<d.observations.length;i++)blocks.push(observationText(d.observations[i],i));next.count=d.observations.length;
    if(d.formulaOpened&&!next.formula){blocks.push('已開啟公式與範圍；不等同完成閱讀。');next.formula=true;}
    const sources=d.sources.filter(s=>!next.sources.includes(s));if(sources.length)blocks.push('新增來源開啟：'+sources.join('、')+'（不證明閱讀範圍）');next.sources=[...d.sources];
    if(!blocks.length)return {text:'',next};
    if(!next.started){blocks.unshift('膜分離觀察｜理想完全混合、定液位、連續穩態；CB=CR。Robs 是給定值；不預測膜的壓力—通量或食品成分表現。參照 A 的結果已知。');blocks.push(sourceText());next.started=true;}
    return {text:blocks.join('\n\n'),next};
  }
  function drawSummary(){field('summary').value=archive();const plan=appendPlan();field('append').value=plan.text;action('save').disabled=!plan.text;field('save-status').textContent=saveStatus;}
  function draw(){
    if(disposed)return;const c=current(d),r=evaluateMembraneBalance(parameters(d));
    field('theta').value=String(d.theta*100);field('rejection').value=String(d.rejection*100);field('theta-label').textContent=percent(d.theta);field('rejection-label').textContent=percent(d.rejection);
    root.querySelectorAll('[data-mb-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mbChoice===c.choice)));
    for(const n of ['prediction','revision','next'])field(n).value=c[n];
    field('diagram').innerHTML=diagram(d,r,prefix);
    field('results').innerHTML=c.revealed?`<div><span>濃縮液濃度</span><strong>${fmt(r.bulkConcentration)} <small>g/L</small></strong><span>參照 A：20 g/L</span></div><div><span>濃縮液成分回收率</span><strong>${percent(r.retentateRecovery)}</strong><span>參照 A：83.33%</span></div><div><span>透過通量 J</span><strong>${fmt(r.flux)} <small>L/(m²·h)</small></strong><span>參照 A：25</span></div>`:'<p>調整條件，按「計算並比較」查看濃度、回收率與通量。</p>';
    field('balance').innerHTML=c.revealed?`<div class="mb-bar" role="img" aria-label="進料目標成分：濃縮液 ${percent(r.retentateRecovery)}、透過液 ${percent(r.permeateRecovery)}"><span style="width:${r.retentateRecovery*100}%"></span></div><p>成分守恆：1200 = <b>${fmt(r.retentateSoluteFlow)}</b> 濃縮液 + <b>${fmt(r.permeateSoluteFlow)}</b> 透過液 <span>g/h</span></p>`:'';
    field('context').textContent='每組是獨立穩態。截留率比較濃度；回收率追蹤成分去向；通量依指定流量核算。';
    field('first').textContent=firstText(c);field('feedback').textContent=feedback;field('error').textContent=error;
    action('calculate').disabled=action('record').disabled=action('record-writing').disabled=!!error;
    field('count').textContent=`${d.observations.length} / 24`;
    field('records').innerHTML=d.observations.length?d.observations.map((o,i)=>`<article><p>${esc(observationText(o,i)).replaceAll('\n','<br>')}</p></article>`).join(''):'<p>尚未記錄。</p>';
    drawSummary();
  }
  function record(){
    captureFirst('記下條件與文字');const c=current(d),o={parameters:clone(parameters(d)),result:c.revealed?clone(evaluateMembraneBalance(parameters(d))):null,writing:clone(writing(c))};
    if(d.observations.some(v=>JSON.stringify(v)===JSON.stringify(o)))feedback='這份條件、結果與文字已記錄。';
    else if(d.observations.length>=24)feedback='已保留 24 份快照，現有紀錄不會覆寫；請保存或複製。';
    else{d.observations.push(o);feedback=`已保留第 ${d.observations.length} 份觀察。`;saveStatus='';}draw();
  }
  function click(event){
    if(disposed)return;
    const source=event.target.closest?.('[data-mb-source]');
    if(source&&root.contains(source)){captureFirst('開啟來源前');if(!d.sources.includes(source.dataset.mbSource))d.sources.push(source.dataset.mbSource);draw();return;}
    const b=event.target.closest?.('button');if(!b||!root.contains(b)||b.disabled)return;
    if(b.dataset.mbPreset){const p={a:[.5,.8],b:[.75,.8],c:[.75,.5]}[b.dataset.mbPreset];if(p){[d.theta,d.rejection]=p;current(d);feedback='';error='';draw();}return;}
    if(b.dataset.mbChoice){current(d).choice=b.dataset.mbChoice;saveStatus='';draw();return;}
    const name=b.dataset.mbAction;
    if(name==='calculate'){captureFirst('顯示結果前');current(d).revealed=true;if(!d.revealedKeys.includes(key(d)))d.revealedKeys.push(key(d));feedback='結果已顯示；可記下這次觀察，或改變條件再比較。';draw();}
    else if(name==='record'||name==='record-writing')record();
    else if(name==='copy'){field('summary').focus();field('summary').select();saveStatus='已選取完整摘要，按 Ctrl+C 複製。';drawSummary();}
    else if(name==='save'&&typeof onSaveSummary==='function'){
      const plan=appendPlan();if(!plan.text)return;let saved=false,reason='';
      if(plan.text.length>10000)reason='本次附加內容超過筆記 10,000 字上限。';else try{saved=onSaveSummary(plan.text)===true;}catch(e){reason=e?.message||String(e);}
      if(saved)d.cursor=plan.next;if(disposed)return;
      saveStatus=saved?'已附加到本課筆記；下次只附加新增觀察與文字修訂。':`尚未保存。${reason||'儲存端未確認成功。'} 內容未截斷、保存位置未前移，請先複製保留。`;draw();
    }
  }
  function input(event){
    if(disposed)return;const t=event.target,c=current(d);
    for(const name of ['prediction','revision','next'])if(t===field(name)){c[name]=t.value;saveStatus='';drawSummary();return;}
    for(const name of ['theta','rejection'])if(t===field(name)){
      const value=t.value===''?NaN:Number(t.value)/100;
      if(!Number.isFinite(value)||(name==='theta'?(value<.05||value>.95):(value<0||value>1))){error='請使用有效範圍內的數值；上一組有效條件仍保留。';draw();return;}
      d[name]=value;current(d);error='';feedback='';saveStatus='';draw();return;
    }
  }
  function toggle(event){if(disposed||event.target!==field('formula')||!event.target.open)return;captureFirst('開啟公式前');d.formulaOpened=true;draw();}
  root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',input);root.addEventListener('toggle',toggle,true);draw();
  return ()=>{if(disposed)return;disposed=true;root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',input);root.removeEventListener('toggle',toggle,true);};
}
