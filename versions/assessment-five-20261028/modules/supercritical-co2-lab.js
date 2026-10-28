import {escapeHTML as esc} from './storage.js';
import {SUPERCRITICAL_CO2_DATA as DATA} from './supercritical-co2-data.js';
import {SUPERCRITICAL_CO2_ID,selectCo2State,compareRosemary} from './supercritical-co2-model.js';
export const SUPERCRITICAL_CO2_LAB_ID=SUPERCRITICAL_CO2_ID;
export const SUPERCRITICAL_CO2_SOURCES=DATA.sources;

const drafts=new WeakMap();let sequence=0;
const clone=value=>structuredClone(value),fmt=(n,d=2)=>Number(n).toLocaleString('en-US',{maximumFractionDigits:d,useGrouping:false});
const temperatures=[20,30,32,40,50,60,80],pressures=[2,4,6,8,10,15,20,30];
const settings=d=>d.view==='phase'?{view:'phase',temperatureC:d.temperatureC,pressureMPa:d.pressureMPa}:{view:'experiment',pressureMPa:d.experimentPressure};
const key=p=>p.view==='phase'?`phase:${p.temperatureC}:${p.pressureMPa}`:`experiment:${p.pressureMPa}`;
const conditionText=p=>p.view==='phase'?`純 CO₂｜${p.temperatureC}°C、${p.pressureMPa} MPa`:`迷迭香｜${p.pressureMPa} MPa（${p.pressureMPa*10} bar）、40→50°C；CO₂ 0.2 kg/h、4 h`;
const fresh=()=>({view:'phase',temperatureC:20,pressureMPa:8,experimentPressure:10,cases:{},observations:[],sources:[],detailsOpened:false,revealedKeys:[],cursor:{started:false,first:[],results:[],writing:{},observations:0,sources:[],details:false}});
function current(d){const p=settings(d);return d.cases[key(p)]??={parameters:p,choice:'',prediction:'',revision:'',next:'',first:null,revealed:p.view==='phase'};}
const writing=c=>({choice:c.choice,prediction:c.prediction,revision:c.revision,next:c.next});
const choiceText=c=>({higher:'增加',lower:'減少',same:'大致不變',unknown:'先保留'}[c]||'未選');
const writingText=w=>`判斷：${choiceText(w.choice)}\n理由：${w.prediction||'未填'}\n觀察後修訂：${w.revision||'未填'}\n下一項證據：${w.next||'未填'}`;
const sourceText=()=>DATA.sources.map(s=>`${s.title}\n${s.url}`).join('\n');
const resultFor=p=>p.view==='phase'?selectCo2State(DATA,p.temperatureC,p.pressureMPa):compareRosemary(DATA,p.pressureMPa);
function resultText(p,r){
  if(!r.ok)return '此條件沒有可用結果。';
  if(p.view==='phase')return `${r.phaseLabel}；純 CO₂ 密度 ${fmt(r.densityKgM3)} kg/m³（EOS 計算，非實測萃取率）`;
  return r.rows.map(row=>`${row.temperatureC}°C：總萃取物乾基產率 ${fmt(row.yieldPercentDryBasis)}%；純 CO₂ 密度 ${fmt(row.densityKgM3)} kg/m³（EOS 計算）`).join('\n')+'\n產率是論文表列值；未提供各條件的重複 n 或 SD，不能判斷統計顯著。';
}
function phaseDiagram(p,r,prefix){
  const left=48,right=588,top=20,bottom=196,x=t=>left+(t-20)/60*(right-left),y=v=>bottom-(v-2)/28*(bottom-top);
  const tc=DATA.critical.temperatureC,pc=DATA.critical.pressureMPa;
  const saturation=DATA.saturation.map(v=>`${x(v.temperatureC)},${y(v.pressureMPa)}`).join(' ');
  const reference=selectCo2State(DATA,40,10);
  return `<svg viewBox="0 0 640 250" role="img" aria-labelledby="${prefix}-phase-title"><title id="${prefix}-phase-title">純 CO₂ 相圖的 20–80°C、2–30 MPa 區段；選取 ${p.temperatureC}°C、${p.pressureMPa} MPa，${esc(r.phaseLabel)}</title><defs><clipPath id="${prefix}-plot"><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}"/></clipPath></defs><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}" class="sc-gas"/><rect x="${x(tc)}" y="${top}" width="${right-x(tc)}" height="${y(pc)-top}" class="sc-super"/><path d="M${left},${top}H${x(tc)}V${y(pc)}L${[...DATA.saturation].reverse().map(v=>`${x(v.temperatureC)},${y(v.pressureMPa)}`).join('L')}Z" class="sc-liquid"/>
  ${[2,10,20,30].map(v=>`<path d="M${left},${y(v)}H${right}" class="sc-grid"/><text x="${left-9}" y="${y(v)+5}" text-anchor="end">${v}</text>`).join('')}${[20,40,60,80].map(v=>`<text x="${x(v)}" y="${bottom+24}" text-anchor="middle">${v}</text>`).join('')}
  <path d="M${x(tc)},${top}V${bottom}M${left},${y(pc)}H${right}" class="sc-critical"/><polyline points="${saturation}" class="sc-saturation"/><circle cx="${x(tc)}" cy="${y(pc)}" r="4" fill="#337c73"/><text x="${x(tc)+8}" y="${y(pc)+21}">臨界點</text>
  <text x="${left+10}" y="42">液體</text><text x="${x(60)}" y="50" text-anchor="middle">超臨界流體</text><text x="${x(68)}" y="189">氣體</text><text x="9" y="12">MPa</text><text x="${right}" y="246" text-anchor="end">溫度 °C</text>
  <circle cx="${x(40)}" cy="${y(10)}" r="7" class="sc-reference"/><circle cx="${x(p.temperatureC)}" cy="${y(p.pressureMPa)}" r="7" class="sc-point"/><text x="${x(40)+12}" y="${y(10)-8}">A</text></svg>
  <p class="sc-caption">● 目前　○ A：40°C、10 MPa，${fmt(reference.densityKgM3)} kg/m³ · 曲線為液氣共存線</p>`;
}
function experimentDiagram(r,revealed,prefix){
  const top=25,bottom=190,height=bottom-top,y=v=>bottom-v/4*height;
  return `<svg viewBox="0 0 640 250" role="img" aria-labelledby="${prefix}-yield-title"><title id="${prefix}-yield-title">迷迭香總萃取物乾基產率，40°C 與 50°C ${revealed?'表列值比較':'尚未顯示'}</title>${[0,1,2,3,4].map(v=>`<path d="M48,${y(v)}H598" class="sc-grid"/><text x="36" y="${y(v)+5}" text-anchor="end">${v}</text>`).join('')}<text x="48" y="15">總萃取物乾基產率 %</text>${[40,50].map((t,i)=>{const row=r.rows[i],x=150+i*245;return `<text x="${x+40}" y="221" text-anchor="middle">${t}°C</text>${revealed?`<rect x="${x}" y="${y(row.yieldPercentDryBasis)}" width="80" height="${bottom-y(row.yieldPercentDryBasis)}" rx="3" class="sc-bar${t}"/><text x="${x+40}" y="${y(row.yieldPercentDryBasis)-10}" text-anchor="middle">${fmt(row.yieldPercentDryBasis)}%</text>`:`<text x="${x+40}" y="120" text-anchor="middle">待顯示</text>`}`;}).join('')}</svg><p class="sc-caption">Genena et al.（2008），Table 1 · 沒有可用誤差棒資料</p>`;
}

/** In-document drafts are scoped to the common lesson owner. Durable storage is handled by its host. */
export function mountSupercriticalCo2Lab(root,id=SUPERCRITICAL_CO2_LAB_ID,{draftOwner,draftKey='proc-supercritical-co2',onSaveSummary}={}){
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  if(id!==SUPERCRITICAL_CO2_LAB_ID)throw new RangeError('Unknown supercritical CO2 activity');
  const owned=draftOwner&&typeof draftOwner==='object';if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,new Map());
  const board=owned?drafts.get(draftOwner):new Map();if(!board.has(draftKey))board.set(draftKey,fresh());
  const d=board.get(draftKey),prefix=`scfe-${++sequence}`,field=name=>root.querySelector(`[data-sc-${name}]`),action=name=>root.querySelector(`[data-sc-action="${name}"]`);
  let disposed=false,feedback='',saveStatus='',error='';current(d);
  root.innerHTML=`<section class="supercritical-co2-lab" aria-labelledby="${prefix}-title"><h2 class="sc-sr-only" id="${prefix}-title">超臨界 CO₂：相態、密度與萃取證據</h2>
  <div class="sc-toolbar"><div role="group" aria-label="觀察視圖"><button type="button" data-sc-view="phase">CO₂ 相態與密度</button><button type="button" data-sc-view="experiment">迷迭香實測</button></div><span data-sc-kind></span></div>
  <div class="sc-controls" data-sc-phase-controls><label for="${prefix}-temperature">溫度 <select id="${prefix}-temperature" data-sc-temperature>${temperatures.map(n=>`<option value="${n}">${n}°C</option>`).join('')}</select></label><label for="${prefix}-pressure">壓力 <select id="${prefix}-pressure" data-sc-pressure>${pressures.map(n=>`<option value="${n}">${n} MPa</option>`).join('')}</select></label><button type="button" data-sc-action="record">記下這次觀察</button></div>

  <div class="sc-controls" data-sc-experiment-controls hidden><label for="${prefix}-experiment-pressure">固定壓力 <select id="${prefix}-experiment-pressure" data-sc-experiment-pressure>${[10,20,30].map(n=>`<option value="${n}">${n} MPa / ${n*10} bar</option>`).join('')}</select></label><button type="button" class="sc-primary" data-sc-action="reveal">顯示 40 / 50°C 實測比較</button><button type="button" data-sc-action="record-experiment">記下這次觀察</button></div>
  <p class="sc-error" role="status" data-sc-error></p><div class="sc-display"><div class="sc-chart" data-sc-chart></div><div class="sc-side"><div class="sc-results" aria-live="polite" data-sc-results></div><div class="sc-presets" data-sc-presets><button type="button" data-sc-preset="liquid">20°C · 8 MPa</button><button type="button" data-sc-preset="a">參照 A · 40°C · 10 MPa</button><button type="button" data-sc-preset="hot">80°C · 10 MPa</button></div></div></div><p class="sc-current" data-sc-context></p><p class="sc-feedback" role="status" data-sc-feedback></p>
  <details><summary>我的判斷、修訂與下一項證據</summary><p data-sc-question></p><div class="sc-choices" role="group" aria-label="變化方向判斷">${[['higher','增加'],['lower','減少'],['same','大致不變'],['unknown','先保留']].map(([v,l])=>`<button type="button" data-sc-choice="${v}">${l}</button>`).join('')}</div><label for="${prefix}-prediction">目前的理由<textarea id="${prefix}-prediction" rows="2" data-sc-prediction></textarea></label><p class="sc-context" data-sc-first></p><label for="${prefix}-revision">觀察後的修訂<textarea id="${prefix}-revision" rows="2" data-sc-revision></textarea></label><label for="${prefix}-next">下一項需要的證據<textarea id="${prefix}-next" rows="2" data-sc-next></textarea></label><button type="button" data-sc-action="record-writing">記錄這次文字</button></details>
  <details><summary>已記錄的觀察 <span data-sc-count></span></summary><div data-sc-records></div></details>
  <details><summary>檢查並保存摘要</summary><label for="${prefix}-summary">所有條件的完整摘要<textarea id="${prefix}-summary" readonly rows="7" data-sc-summary></textarea></label><button type="button" data-sc-action="copy">選取完整摘要</button><label for="${prefix}-append">本次附加內容<textarea id="${prefix}-append" readonly rows="5" data-sc-append></textarea></label><button type="button" data-sc-action="save" ${typeof onSaveSummary!=='function'?'hidden':''}>附加到本課筆記</button><p role="status" data-sc-save-status></p><p class="sc-context">課內返回可保留草稿；重新整理前請保存或複製。保存成功後才推進，不截斷內容。</p></details>
  <details data-sc-details><summary>數值定義、適用範圍與來源</summary><p>純 CO₂ 同時超過臨界溫度約 31.0°C 與臨界壓力約 7.38 MPa，才進入本課標示的超臨界區。20°C、8 MPa 是壓縮液體。虛線是臨界值參照；超過臨界溫度後穿過 Pc，並不是液氣一階相變。</p><p>相圖只畫 20–80°C、2–30 MPa 的區段，沒有固態區。密度取自固定版本 CoolProp 的純 CO₂ 狀態方程，只支援列出的離散條件；非理想氣體公式，也不是食品、混合溶劑或溶質的密度。液氣共存線上只給 T、P 不能唯一決定兩相整體密度。圖線為計算取樣點連線。</p><p>迷迭香數值為 Genena et al.（2008）Table 1 的總萃取物產率，分母為乾基原料；4 h、CO₂ 0.2 kg/h。兩溫度的所有比較均高於臨界溫度；原表 30°C 列未放入此比較。表列產率不是目標成分回收率、純度或溶解度。此處純 CO₂ 密度由 EOS 另算，沒有用密度推算產率。</p><p>六個條件未提供逐次產率、條件別重複 n 或 SD；不補造誤差棒，也不聲稱統計顯著。比較能指出表列方向不同，不能單獨證明密度、蒸氣壓或傳質何者主導。改變粒徑、流量、時間、含水量或共溶劑，需另外量測。</p><p>一般機制：固定溫度加壓，通常提高 CO₂ 密度與溶劑能力；固定壓力升溫則降低密度，同時可能提高溶質蒸氣壓、有利於進入流體。兩種作用競爭，升溫效果會依壓力與溶質而變。Foods（2021）的芒果研究提供此機制討論；這裡沒有採用它的芒果數據或模型來預測迷迭香。六個迷迭香條件不能量化各作用占比或推得交叉壓力。</p><p>CO₂ 可在降壓後與萃取物分離，壓力與溫度可調整其溶劑能力；低臨界溫度提供處理熱敏物的可能性。優勢仍受實際溫度、原料、目標物極性、共溶劑與高壓設備成本限制，不能概括為完全無殘留、無降解或普遍較高產率。</p><ul>${DATA.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-sc-source="${esc(s.id)}">${esc(s.title)}</a></li>`).join('')}</ul></details></section>`;

  function captureFirst(trigger){d.detailsOpened=d.detailsOpened||Boolean(field('details')?.open);const c=current(d);if(!c.first)c.first={trigger,writing:clone(writing(c)),exposure:{phaseAlwaysVisible:c.parameters.view==='phase',detailsOpened:d.detailsOpened,sources:[...d.sources],revealedKeys:[...d.revealedKeys],currentRevealed:c.revealed}};}
  function firstText(c){if(!c.first)return '尚未保留首次快照。相態／密度即時顯示；其他課內頁面也可能已顯示實測資料，不作盲測。';const f=c.first,e=f.exposure;return `首次保留（${f.trigger}）：${writingText(f.writing)}\n當時本組結果已顯示=${e.currentRevealed?'是':'否'}；定義區已開=${e.detailsOpened?'是':'否'}；來源已開=${e.sources.join('、')||'無'}；先前實測已顯示=${e.revealedKeys.join('、')||'無'}。後續改寫不覆蓋快照；不是盲測。`;}
  function observationText(o,i){return `觀察 ${i+1}｜${conditionText(o.parameters)}\n${o.result?resultText(o.parameters,o.result):'本組實測比較尚未顯示'}\n${writingText(o.writing)}`;}
  function archive(){return ['CO₂ 相態與萃取證據｜相態／密度即時可見；論文表列產率分開呈現。不是盲測。',...Object.values(d.cases).map(c=>[conditionText(c.parameters),firstText(c),c.revealed?resultText(c.parameters,resultFor(c.parameters)):'實測結果尚未顯示',writingText(writing(c))].join('\n')),...d.observations.map(observationText),`已開定義：${d.detailsOpened?'是':'否'}；已開來源：${d.sources.join('、')||'無'}。連結開啟不代表讀懂或讀完。`,sourceText()].join('\n\n');}
  function appendPlan(){const next=clone(d.cursor),blocks=[];for(const [k,c] of Object.entries(d.cases)){
    if(c.first&&!next.first.includes(k)){blocks.push(conditionText(c.parameters)+'\n'+firstText(c));next.first.push(k);}
    if(c.first&&c.revealed&&!next.results.includes(k)){blocks.push(conditionText(c.parameters)+'\n'+resultText(c.parameters,resultFor(c.parameters)));next.results.push(k);}
    const w=writing(c),old=next.writing[k];if(JSON.stringify(w)!==JSON.stringify(old)){if(Object.values(w).some(Boolean)||old)blocks.push(conditionText(c.parameters)+'\n'+writingText(w));next.writing[k]=clone(w);}
  }for(let i=next.observations;i<d.observations.length;i++)blocks.push(observationText(d.observations[i],i));next.observations=d.observations.length;
    if(d.detailsOpened&&!next.details){blocks.push('已開定義與範圍；不等同完成閱讀。');next.details=true;}const sources=d.sources.filter(s=>!next.sources.includes(s));if(sources.length)blocks.push('新增來源開啟：'+sources.join('、')+'（不證明閱讀範圍）');next.sources=[...d.sources];
    if(blocks.length&&!next.started){blocks.unshift('超臨界 CO₂ 觀察｜EOS 純流體計算與迷迭香表列產率分開；密度不是產率模型。產率重複 n / SD 未報告，沒有統計顯著性結論。相態／密度即時可見，課內其他頁也可能已顯示實測值，不作盲測。');blocks.push(sourceText());next.started=true;}return {text:blocks.join('\n\n'),next};}
  function drawSummary(){field('summary').value=archive();const plan=appendPlan();field('append').value=plan.text;action('save').disabled=!plan.text;field('save-status').textContent=saveStatus;}
  function draw(){if(disposed)return;const c=current(d),p=c.parameters,r=resultFor(p),phase=p.view==='phase';
    root.querySelectorAll('[data-sc-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scView===d.view)));
    field('phase-controls').hidden=field('presets').hidden=!phase;field('experiment-controls').hidden=phase;
    field('temperature').value=String(d.temperatureC);field('pressure').value=String(d.pressureMPa);field('experiment-pressure').value=String(d.experimentPressure);
    field('kind').textContent=phase?'純 CO₂ · 狀態方程計算':'迷迭香 · 論文表列值';
    field('chart').innerHTML=phase?phaseDiagram(p,r,prefix):experimentDiagram(r,c.revealed,prefix);
    if(phase){field('results').innerHTML=`<div><span>目前相態</span><strong class="sc-phase-label">${esc(r.phaseLabel)}</strong></div><div><span>純 CO₂ 密度</span><strong>${fmt(r.densityKgM3)} <small>kg/m³</small></strong></div>`;field('context').textContent=`${p.temperatureC}°C、${p.pressureMPa} MPa · 密度由狀態方程計算，不能直接換算萃取產率。`;}
    else {const a=r.rows[0],b=r.rows[1],delta=b.yieldPercentDryBasis-a.yieldPercentDryBasis;field('results').innerHTML=c.revealed?`<div><span>40→50°C · 產率差</span><strong>${delta>0?'+':''}${fmt(delta)} <small>百分點</small></strong></div><div><span>純 CO₂ 密度 · EOS</span><strong>${fmt(a.densityKgM3,1)}<small> → </small>${fmt(b.densityKgM3,1)}</strong><span>kg/m³</span></div>`:'<p>選壓力，再顯示這組實測比較。</p>';field('context').textContent=`${p.pressureMPa} MPa · CO₂ 0.2 kg/h、4 h · 總萃取物／乾基原料；${c.revealed?'表列方向不代表統計顯著。':'可以先記下判斷。'}`;}
    field('question').textContent=phase?'與已知參照 A（40°C、10 MPa）相比，現在的純 CO₂ 密度如何變化？圖與結果已即時顯示，可記下你的解釋。':'同一壓力下從 40°C 升到 50°C，迷迭香總萃取物產率會如何變化？可先作答，也可直接查看表列值。';
    root.querySelectorAll('[data-sc-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scChoice===c.choice)));for(const name of ['prediction','revision','next'])field(name).value=c[name];
    field('first').textContent=firstText(c);field('error').textContent=error;field('feedback').textContent=feedback;field('count').textContent=`${d.observations.length} / 24`;
    field('records').innerHTML=d.observations.length?d.observations.map((o,i)=>`<article><p>${esc(observationText(o,i))}</p><button type="button" data-sc-replay="${i}">回到觀察 ${i+1} 的條件</button></article>`).join(''):'<p>尚未記錄。</p>';drawSummary();}
  function record(){captureFirst('記下條件與文字');const c=current(d),o={parameters:clone(c.parameters),result:c.revealed?clone(resultFor(c.parameters)):null,writing:clone(writing(c))};if(d.observations.some(v=>JSON.stringify(v)===JSON.stringify(o)))feedback='這份條件、結果與文字已記錄。';else if(d.observations.length>=24)feedback='已保留 24 份快照，現有紀錄不會覆寫；請保存或複製。';else{d.observations.push(o);feedback=`已保留第 ${d.observations.length} 份觀察。`;saveStatus='';}draw();}
  function switchCondition(p){d.view=p.view;if(p.view==='phase'){d.temperatureC=p.temperatureC;d.pressureMPa=p.pressureMPa;}else d.experimentPressure=p.pressureMPa;current(d);feedback='';error='';saveStatus='';draw();}
  function click(event){if(disposed)return;const source=event.target.closest?.('[data-sc-source]');if(source&&root.contains(source)){captureFirst('開啟來源前');if(!d.sources.includes(source.dataset.scSource))d.sources.push(source.dataset.scSource);draw();return;}const b=event.target.closest?.('button');if(!b||!root.contains(b)||b.disabled)return;
    if(b.dataset.scView){switchCondition(b.dataset.scView==='phase'?{view:'phase',temperatureC:d.temperatureC,pressureMPa:d.pressureMPa}:{view:'experiment',pressureMPa:d.experimentPressure});return;}
    if(b.dataset.scPreset){const p={liquid:[20,8],a:[40,10],hot:[80,10]}[b.dataset.scPreset];if(p)switchCondition({view:'phase',temperatureC:p[0],pressureMPa:p[1]});return;}
    if(b.dataset.scReplay!==undefined){const o=d.observations[Number(b.dataset.scReplay)];if(o){switchCondition(o.parameters);feedback='已回到相同條件；當前文字與歷史快照分別保留。';draw();}return;}
    if(b.dataset.scChoice){current(d).choice=b.dataset.scChoice;saveStatus='';draw();return;}
    const name=b.dataset.scAction;if(name==='reveal'){captureFirst('顯示實測前');current(d).revealed=true;const k=key(settings(d));if(!d.revealedKeys.includes(k))d.revealedKeys.push(k);feedback='表列值已顯示。換一個壓力，檢查升溫方向是否相同。';draw();}
    else if(['record','record-experiment','record-writing'].includes(name))record();else if(name==='copy'){field('summary').focus();field('summary').select();saveStatus='已選取完整摘要，按 Ctrl+C 複製。';drawSummary();}
    else if(name==='save'&&typeof onSaveSummary==='function'){const plan=appendPlan(),cursorBefore=d.cursor;if(!plan.text)return;let saved=false,reason='';if(plan.text.length>10000)reason='本次附加內容超過筆記 10,000 字上限。';else try{saved=onSaveSummary(plan.text)===true;}catch(e){reason=e?.message||String(e);}if(saved&&d.cursor===cursorBefore)d.cursor=plan.next;if(disposed)return;saveStatus=saved?'已附加到本課筆記；下次只附加新增觀察與文字修訂。':`尚未保存。${reason||'儲存端未確認成功。'} 內容未截斷、保存位置未前移，請先複製保留。`;draw();}}
  function input(event){if(disposed)return;for(const name of ['prediction','revision','next'])if(event.target===field(name)){current(d)[name]=event.target.value;saveStatus='';drawSummary();return;}}
  function change(event){if(disposed)return;const t=event.target;if(t===field('temperature')||t===field('pressure')){const temp=Number(field('temperature').value),pressure=Number(field('pressure').value);if(!temperatures.includes(temp)||!pressures.includes(pressure)){error='請選擇清單中的有效條件；不外插數值。';draw();return;}switchCondition({view:'phase',temperatureC:temp,pressureMPa:pressure});}
    else if(t===field('experiment-pressure')){const pressure=Number(t.value);if(![10,20,30].includes(pressure)){error='只有 10、20、30 MPa 有本組實測比較。';draw();return;}switchCondition({view:'experiment',pressureMPa:pressure});}}
  function toggle(event){if(disposed||event.target!==field('details')||!event.target.open)return;captureFirst('定義區展開時');d.detailsOpened=true;draw();}
  root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',change);root.addEventListener('toggle',toggle,true);draw();
  return ()=>{if(disposed)return;disposed=true;root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('toggle',toggle,true);};
}
