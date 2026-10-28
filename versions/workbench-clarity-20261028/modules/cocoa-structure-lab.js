import {escapeHTML as esc} from './storage.js';
import {COCOA_STRUCTURE_DATA as DATA} from './cocoa-structure-data.js';
import {COCOA_LAB_ID,evaluateCocoaStructure,compareCocoaEvidence} from './cocoa-structure-model.js';

export const COCOA_STRUCTURE_LAB_ID=COCOA_LAB_ID;
export const COCOA_STRUCTURE_SOURCES=DATA.sources;
const drafts=new WeakMap();let sequence=0;
const clone=value=>structuredClone(value);
const fmt=(value,digits=1)=>Number(value).toLocaleString('en-US',{maximumFractionDigits:digits,useGrouping:false});
const signed=value=>`${value>0?'+':''}${fmt(value)}`;
const slots=['g1','g2','g3'],codes=['P','O','S'],metrics=['meltingC','bendingModulusNmm2'];
const groups=['commercial','dmpc','dppe','recrystallized'];
const groupNames={commercial:'原商售品',dmpc:'DMPC 重結晶',dppe:'DPPE 重結晶',recrystallized:'無添加重結晶'};
const chainNames={P:'P · 棕櫚醯',O:'O · 油醯',S:'S · 硬脂醯'};
const metricNames={meltingC:'熔融溫度',bendingModulusNmm2:'彈性彎曲模數 Eᵦ'};
const fresh=startView=>({view:startView,g1:'P',g2:'S',g3:'O',baselineId:'commercial',comparisonId:'recrystallized',metric:'meltingC',
  cases:{},observations:[],sources:[],detailsOpened:false,seen:[],
  cursor:{started:false,first:[],results:[],writing:{},observations:0,sources:[],details:false}});
const settings=d=>d.view==='structure'?{view:'structure',g1:d.g1,g2:d.g2,g3:d.g3}:
  {view:'evidence',baselineId:d.baselineId,comparisonId:d.comparisonId,metric:d.metric};
const key=p=>p.view==='structure'?`structure:${p.g1}:${p.g2}:${p.g3}`:`evidence:${p.baselineId}:${p.comparisonId}`;
const conditionText=p=>p.view==='structure'?`構造：上／中／下＝${p.g1}／${p.g2}／${p.g3}（非 sn 編號）`:
  `材料比較：基準 ${groupNames[p.baselineId]} → ${groupNames[p.comparisonId]}`;
const question=p=>p.view==='structure'?'目前的三條鏈與位置，符合本課 β-POS 的連接構造嗎？':
  '兩組都判為 V 型；只看晶型與熔點，能判定彎曲表現相同嗎？';
function current(d){const p=settings(d),k=key(p);return d.cases[k]??={parameters:p,choice:'',prediction:'',revision:'',next:'',first:null,checked:false,revealed:false,seenMetrics:[]};}
const writing=c=>({choice:c.choice,prediction:c.prediction,revision:c.revision,next:c.next});
const choiceText=(view,value)=>(view==='structure'?{yes:'符合 β-POS',no:'還不符合',unknown:'先保留'}:
  {yes:'足以判為相同',no:'仍需彎曲量測',unknown:'先保留'})[value]||'未選';
const writingText=(p,w)=>`判斷：${choiceText(p.view,w.choice)}\n理由：${w.prediction||'未填'}\n修訂：${w.revision||'未填'}\n下一項證據：${w.next||'未填'}`;
const sourceText=()=>DATA.sources.map(s=>`${s.title}\n${s.url}`).join('\n');
const structureResult=p=>evaluateCocoaStructure({g1:p.g1,g2:p.g2,g3:p.g3});
const evidenceResult=p=>compareCocoaEvidence({metric:p.metric,baselineId:p.baselineId,comparisonId:p.comparisonId});
function groupingText(result){
  if(result.authorGrouping.status==='same-group')return '同一處理組，沒有跨組檢定。';
  if(result.sharedLetters.length)return `共有字母 ${result.sharedLetters.join('、')}；作者未判顯著差異，不等於等效。`;
  return '字母不重疊；作者的該列比較判為顯著不同。';
}
function structureText(p,checked){const r=structureResult(p);return `構造式計數：${r.formula}；酯基 ${r.esterGroups}；脂肪鏈 C=C ${r.doubleBonds}。`+
  (checked?`\n連接核對：${r.target.matches?'符合':'尚不符合'} β-POS；判定限中位 O 與外位 P/S，不指定 sn 或晶型。`:'\nβ-POS 連接尚未核對。');}
function evidenceText(p,result){return `${metricNames[p.metric]}（${result.unit}），刊載平均值 ± SE：\n`+
  `${groupNames[p.baselineId]}：${fmt(result.baseline.mean)} ± ${fmt(result.baseline.se)}；字母 ${result.baseline.letters.join('')}\n`+
  `${groupNames[p.comparisonId]}：${fmt(result.comparison.mean)} ± ${fmt(result.comparison.se)}；字母 ${result.comparison.letters.join('')}\n`+
  `均值差（比較−基準）：${signed(result.meanDifference)} ${result.unit}`+(result.relativeDifferenceApplicable?`；相對基準 ${signed(result.relativeDifferencePercent)}%。\n`:'；攝氏溫度不算百分比。\n')+
  `${groupingText(result)} 四組均由原文 Fig.5 判為 Form V；模數不是一般硬度或口感分數。`;
}
function structureDiagram(p,prefix){
  const tails={P:'(CH₂)₁₄–CH₃',O:'(CH₂)₇–CH=CH–(CH₂)₇–CH₃',S:'(CH₂)₁₆–CH₃'};
  return `<svg viewBox="0 0 650 255" role="img" aria-labelledby="${prefix}-structure-title"><title id="${prefix}-structure-title">三條脂肪醯鏈連接甘油：上位 ${chainNames[p.g1]}，中位 ${chainNames[p.g2]}，下位 ${chainNames[p.g3]}。平面連接示意，沒有指定立體構型。</title>
    <path d="M60,72V112M60,151V191" class="cc-bond"/>
    ${slots.map((slot,index)=>{const y=55+index*79,code=p[slot];return `<g data-cc-structure-slot="${slot}"><text x="60" y="${y+7}" text-anchor="middle" class="cc-atom">${index===1?'CH':'CH₂'}</text><path d="M86,${y}H117M142,${y}H177M201,${y}H237M184,${y-12}V${y-29}M191,${y-12}V${y-29}" class="cc-bond"/><text x="129" y="${y+7}" text-anchor="middle" class="cc-oxygen">O</text><text x="189" y="${y+7}" text-anchor="middle" class="cc-atom">C</text><text x="188" y="${y-36}" text-anchor="middle" class="cc-oxygen">O</text><text x="248" y="${y+7}" class="cc-chain">${tails[code]}</text><text x="248" y="${y+30}" class="cc-chain-caption">${chainNames[code]} · ${code==='P'?'C16:0':code==='S'?'C18:0':'C18:1 · cis-9'}</text></g>`;}).join('')}
  </svg><p class="cc-caption">縮合構造式 · 非 Fischer 投影、立體構型或晶胞</p>`;
}
function evidenceDiagram(p,result,visible,prefix){
  const bending=p.metric==='bendingModulusNmm2',maximum=bending?100:40,ticks=bending?[0,25,50,75,100]:[0,10,20,30,40];
  const top=43,bottom=215,y=value=>bottom-value/maximum*(bottom-top),rows=[result.baseline,result.comparison];
  return `<svg viewBox="0 0 650 280" role="img" aria-labelledby="${prefix}-evidence-title"><title id="${prefix}-evidence-title">${esc(metricNames[p.metric])}，${groupNames[p.baselineId]}與${groupNames[p.comparisonId]}：${visible?'刊載平均值與標準誤':'尚未顯示彎曲量測'}</title>
    <text x="49" y="21">${esc(metricNames[p.metric])} · ${esc(result.unit)}</text>
    ${ticks.map(value=>`<path d="M49,${y(value)}H617" class="cc-grid"/><text x="37" y="${y(value)+5}" text-anchor="end">${value}</text>`).join('')}
    ${rows.map((row,index)=>{const center=194+index*274;return `<text x="${center}" y="244" text-anchor="middle">${esc(groupNames[row.id])}</text><text x="${center}" y="268" text-anchor="middle" class="cc-crystal">晶型 V</text>`+(visible?`<rect x="${center-42}" y="${y(row.mean)}" width="84" height="${bottom-y(row.mean)}" rx="3" class="cc-bar-${index}"/><path d="M${center},${y(row.mean-row.se)}V${y(row.mean+row.se)}M${center-10},${y(row.mean-row.se)}H${center+10}M${center-10},${y(row.mean+row.se)}H${center+10}" class="cc-error-bar"/><text x="${center}" y="${y(row.mean+row.se)-11}" text-anchor="middle">${fmt(row.mean)} ± ${fmt(row.se)} <tspan class="cc-letters">${row.letters.join('')}</tspan></text>`:`<text x="${center}" y="133" text-anchor="middle">待顯示</text>`);}).join('')}
  </svg><p class="cc-caption">Chen et al.（2021）Table 2 · 誤差棒為 SE；字母沿用作者分組</p>`;
}

/** Local drafts are lesson-scoped. The common host owns durable notes, import and export. */
export function mountCocoaStructureEvidence(root,id=COCOA_STRUCTURE_LAB_ID,{draftOwner,draftKey='lipid-pos-structure',startView='structure',onSaveSummary}={}){
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  if(id!==COCOA_STRUCTURE_LAB_ID)throw new RangeError('Unknown cocoa activity');
  if(!['structure','evidence'].includes(startView))throw new RangeError('Unknown cocoa start view');
  const owned=draftOwner&&typeof draftOwner==='object';if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,new Map());
  const board=owned?drafts.get(draftOwner):new Map();if(!board.has(draftKey))board.set(draftKey,fresh(startView));
  const d=board.get(draftKey),prefix=`cocoa-${++sequence}`,field=name=>root.querySelector(`[data-cc-${name}]`),action=name=>root.querySelector(`[data-cc-action="${name}"]`);
  let disposed=false,feedback='',saveStatus='',error='';current(d);
  const residueOptions=codes.map(code=>`<option value="${code}">${chainNames[code]}</option>`).join('');
  const groupOptions=groups.map(group=>`<option value="${group}">${groupNames[group]}</option>`).join('');
  root.innerHTML=`<section class="cocoa-structure-lab" aria-labelledby="${prefix}-title"><h2 class="cc-sr-only" id="${prefix}-title">可可脂構造與巧克力實測證據</h2>
    <div class="cc-toolbar"><div role="group" aria-label="觀察視圖"><button type="button" data-cc-view="structure">POS 構造</button><button type="button" data-cc-view="evidence">巧克力實測</button></div><span data-cc-kind></span></div>
    <div class="cc-controls" data-cc-structure-controls>${slots.map((slot,index)=>`<label for="${prefix}-${slot}">${['上位','中位','下位'][index]}<select id="${prefix}-${slot}" data-cc-${slot}>${residueOptions}</select></label>`).join('')}<button type="button" class="cc-primary" data-cc-action="check">核對 β-POS 連接</button><button type="button" data-cc-action="record">記下觀察</button></div>
    <div class="cc-evidence-controls" data-cc-evidence-controls hidden><div class="cc-pair"><label for="${prefix}-baseline">基準<select id="${prefix}-baseline" data-cc-baseline>${groupOptions}</select></label><label for="${prefix}-comparison">比較<select id="${prefix}-comparison" data-cc-comparison>${groupOptions}</select></label></div><div class="cc-evidence-actions"><div role="group" aria-label="比較的量測"><button type="button" data-cc-metric="meltingC">熔融溫度</button><button type="button" class="cc-primary" data-cc-metric="bendingModulusNmm2">顯示彎曲量測</button></div><button type="button" data-cc-action="record-evidence">記下觀察</button></div></div>
    <p role="status" class="cc-error" data-cc-error></p><div class="cc-display"><div class="cc-chart" data-cc-chart></div><div class="cc-results" aria-live="polite" data-cc-results></div></div><p class="cc-context-line" data-cc-context></p><p role="status" class="cc-feedback" data-cc-feedback></p>
    <details><summary>我的判斷、修訂與下一項證據</summary><p data-cc-question></p><div class="cc-choices" role="group" aria-label="目前判斷">${['yes','no','unknown'].map(value=>`<button type="button" data-cc-choice="${value}"></button>`).join('')}</div><label for="${prefix}-prediction">目前的理由<textarea id="${prefix}-prediction" rows="2" data-cc-prediction></textarea></label><p class="cc-context" data-cc-first></p><label for="${prefix}-revision">觀察後修訂<textarea id="${prefix}-revision" rows="2" data-cc-revision></textarea></label><label for="${prefix}-next">下一項需要的證據<textarea id="${prefix}-next" rows="2" data-cc-next></textarea></label><button type="button" data-cc-action="record-writing">記錄這次文字</button></details>
    <details><summary>已記錄的觀察 <span data-cc-count></span></summary><div data-cc-records></div></details>
    <details><summary>檢查並保存摘要</summary><label for="${prefix}-summary">所有條件的完整摘要<textarea id="${prefix}-summary" rows="7" readonly data-cc-summary></textarea></label><button type="button" data-cc-action="copy">選取完整摘要</button><label for="${prefix}-append">本次附加內容<textarea id="${prefix}-append" rows="5" readonly data-cc-append></textarea></label><button type="button" data-cc-action="save" ${typeof onSaveSummary!=='function'?'hidden':''}>附加到本課筆記</button><p role="status" data-cc-save-status></p><p class="cc-context">課內返回可接續草稿；重新整理前請保存或複製。成功保存後才推進，不截斷內容。</p></details>
    <details data-cc-details><summary>構造、量測定義與來源</summary>
      <p>Beppu 等（2013）以 β-POS 指 1-palmitoyl-2-oleoyl-3-stearoyl-rac-glycerol；此 β 區分甘油位置異構物，油醯 O 接在中位 2，P/S 在外位。這個 β 與可可脂晶型 β₂／Form V 是不同層次。圖中上、中、下位不是 sn 編號；没有楔線、Fischer 投影或 R/S 指定。交換外位 P/S 只在本圖的連接層次接受，不證明指定對映異構物相同，也不代表天然可可脂完全消旋。</p>
      <p>P 是 C16:0 棕櫚醯，O 是 cis-9 C18:1 油醯，S 是 C18:0 硬脂醯；這些碳數包含羰基碳。縮合構造式呈現三個酯基，元素帳由甘油與三條脂肪酸扣三份水求得。這是結構計數，不是實際合成排程、結晶過程或晶體堆積模型。相同分子式不能單獨辨認位置異構物。</p>
      <p>Chen 等（2021）的四組為同款 Lindt 90% 黑巧克力：原商售品、無添加重結晶，以及各添加 0.1%（w/w）DMPC 或 DPPE 後重結晶。重結晶組報告為 5°C 1 小時，再於 20°C 4 天；原商售品的工廠調溫史、批號是否相同、獨立製造批次數未知。添加組也改變組成，不能說所有比較都只改一個結晶變因。</p>
      <p>Fig.5 將四組判為 Form V；本頁引用其晶型判讀，没有產生 XRD 原始譜線。Table 2 的熔融溫度來自 DSC；彈性彎曲模數 Eᵦ 是作者的三點彎曲方法指標，以峰值力、峰值變形和樣品幾何求得，不等同一般硬度、破裂力、初始斜率楊氏模數或口感喜好。</p>
      <p>所有 ± 值為 SE。DSC 報告 n=3；Eᵦ 僅報 4–16 次重複，逐组 n 未提供，不能把重複當成獨立生產批次。字母只用於同一指標列的作者 ANOVA／Tukey 比較；共享字母表示作者未判顯著差異，不證明等效。DPPE（ac）與無添加重結晶（bc）共享 c，即使均值不同，也不能聲稱該對顯著不同。此處不由 SE 重疊重算顯著性、SD、CI 或 p 值。</p>
      <p>均值差與模數相對基準變化是表列均值的描述性計算；攝氏溫度因零點屬約定，只列溫差，不算百分比。缺少原始力—位移、逐次資料與儲存歷程，不能用本表重建曲線或單獨解答脂肪白霜機制。兩組同為 V 型不足以推出相同宏觀性質；白霜另需表面成分、晶體與溫度／水分歷史的證據。</p>
      <ul>${DATA.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-cc-source="${esc(s.id)}">${esc(s.title)}</a></li>`).join('')}</ul><p>官方 115 食品化學第 4 題：構造部分可用本活動練習；晶型資料是結晶／白霜論述的部分前提，不是官方完整解答或題目覆蓋率。</p>
    </details></section>`;

  function markDisplay(){const p=settings(d),c=current(d);const token=p.view==='structure'?'formula':p.metric;if(p.view==='evidence'&&p.metric==='bendingModulusNmm2'&&!c.revealed)return;
    if(p.view==='evidence'&&!c.seenMetrics.includes(p.metric))c.seenMetrics.push(p.metric);
    const k=key(p)+':'+token;if(!d.seen.includes(k))d.seen.push(k);}
  function captureFirst(trigger){const c=current(d);if(!c.first)c.first={trigger,writing:clone(writing(c)),exposure:{structureAndFormulaVisible:c.parameters.view==='structure',checked:c.checked,
    revealed:c.revealed,seenMetrics:[...c.seenMetrics],seenConditions:[...d.seen],detailsOpened:d.detailsOpened,sources:[...d.sources]}};}
  function firstText(c){if(!c.first)return '構造、分子式與熔融溫度可先看見；其他課頁或來源也可能透露答案，不作盲測。首次核對、記錄或開來源時保留當時文字。';
    const f=c.first,e=f.exposure;return `首次保留（${f.trigger}）：${writingText(c.parameters,f.writing)}\n當時構造核對=${e.checked?'已做':'未做'}；彎曲量測=${e.revealed?'已顯示':'未顯示'}；已見量測=${e.seenMetrics.map(m=>metricNames[m]).join('、')||'無'}；定義已開=${e.detailsOpened?'是':'否'}；來源=${e.sources.join('、')||'無'}。\n先前可見条件：${e.seenConditions.join('；')||'無'}。後續改寫不覆蓋首次快照；不是盲測。`;}
  function caseResults(c){if(c.parameters.view==='structure')return structureText(c.parameters,c.checked);
    return c.seenMetrics.map(metric=>{const p={...c.parameters,metric};return evidenceText(p,evidenceResult(p));}).join('\n')||'尚未顯示此組量測。';}
  function observationText(o,index){const p=o.parameters;return `觀察 ${index+1}｜${conditionText(p)}\n`+
    (p.view==='structure'?structureText(p,o.checked):o.result?evidenceText(p,o.result):`${metricNames[p.metric]}尚未顯示；兩組晶型 V 已提供。`)+`\n${writingText(p,o.writing)}`;}
  function archive(){return ['可可脂構造與巧克力實測｜構造/公式/熔點可即時看到；不是盲測。',
    ...Object.values(d.cases).map(c=>[conditionText(c.parameters),question(c.parameters),firstText(c),caseResults(c),writingText(c.parameters,writing(c))].join('\n')),
    ...d.observations.map(observationText),`定義已開：${d.detailsOpened?'是':'否'}；來源已開：${d.sources.join('、')||'無'}。開啟不代表讀完或理解。`,sourceText()].join('\n\n');}
  function appendPlan(){const next=clone(d.cursor),blocks=[];
    for(const [k,c] of Object.entries(d.cases)){
      if(c.first&&!next.first.includes(k)){blocks.push(conditionText(c.parameters)+'\n'+question(c.parameters)+'\n'+firstText(c));next.first.push(k);}
      if(c.first){const tokens=c.parameters.view==='structure'?[c.checked?'checked':'formula']:c.seenMetrics;
        for(const token of tokens){const rk=k+':'+token;if(next.results.includes(rk))continue;
          blocks.push(conditionText(c.parameters)+'\n'+(c.parameters.view==='structure'?structureText(c.parameters,c.checked):evidenceText({...c.parameters,metric:token},evidenceResult({...c.parameters,metric:token}))));next.results.push(rk);}}
      const w=writing(c),old=next.writing[k];if(JSON.stringify(w)!==JSON.stringify(old)){if(Object.values(w).some(Boolean)||old)blocks.push(conditionText(c.parameters)+'\n'+writingText(c.parameters,w));next.writing[k]=clone(w);}
    }
    for(let i=next.observations;i<d.observations.length;i++)blocks.push(observationText(d.observations[i],i));next.observations=d.observations.length;
    if(d.detailsOpened&&!next.details){blocks.push('已開構造與量測定義；不等於完成閱讀。');next.details=true;}
    const sources=d.sources.filter(s=>!next.sources.includes(s));if(sources.length)blocks.push('新增來源開啟：'+sources.join('、')+'（不證明閱讀範圍）');next.sources=[...d.sources];
    if(blocks.length&&!next.started){blocks.unshift('可可脂觀察｜β-POS 是連接位置；β₂/V 是晶體排列。分子式由結構計數；材料數值是刊載平均±SE及作者分組。不是盲測、晶體動態、口感或白霜預測。');blocks.push(sourceText());next.started=true;}
    return {text:blocks.join('\n\n'),next};}
  function drawSummary(){field('summary').value=archive();const plan=appendPlan();field('append').value=plan.text;action('save').disabled=!plan.text;field('save-status').textContent=saveStatus;}
  function draw(){if(disposed)return;markDisplay();const p=settings(d),c=current(d),structure=p.view==='structure';
    root.querySelectorAll('[data-cc-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ccView===d.view)));
    field('structure-controls').hidden=!structure;field('evidence-controls').hidden=structure;field('kind').textContent=structure?'連接構造 · 元素帳':'巧克力 · 原表量測';
    for(const slot of slots)field(slot).value=d[slot];field('baseline').value=d.baselineId;field('comparison').value=d.comparisonId;
    field('baseline').querySelectorAll?.('option').forEach(o=>o.disabled=o.value===d.comparisonId);field('comparison').querySelectorAll?.('option').forEach(o=>o.disabled=o.value===d.baselineId);
    root.querySelectorAll('[data-cc-metric]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ccMetric===d.metric)));
    if(structure){const r=structureResult(p);field('chart').innerHTML=structureDiagram(p,prefix);
      field('results').innerHTML=`<div><span>目前分子式</span><strong class="cc-formula">C<sub>${r.atoms.C}</sub>H<sub>${r.atoms.H}</sub>O<sub>${r.atoms.O}</sub></strong></div><div><span>酯基 / 脂肪鏈 C=C</span><strong>${r.esterGroups} <small>/</small> ${r.doubleBonds}</strong></div><p class="cc-verdict">${c.checked?(r.target.matches?'β-POS 連接核對符合':r.target.compositionMatches?'三種鏈齊了；中位還未符合 β-POS':'三種鏈或位置尚未符合 β-POS'):'選三條鏈，再核對連接。'}</p>`;
      field('context').textContent='上、中、下位不指定 sn；分子式相同，連接位置仍可能不同。';
    }else{const r=evidenceResult(p),visible=p.metric==='meltingC'||c.revealed;field('chart').innerHTML=evidenceDiagram(p,r,visible,prefix);
      field('results').innerHTML=visible?`<div><span>比較 − 基準 · 均值差</span><strong>${signed(r.meanDifference)} <small>${esc(r.unit)}</small></strong></div>`+(r.relativeDifferenceApplicable?`<div><span>相對基準均值</span><strong>${signed(r.relativeDifferencePercent)}<small>%</small></strong></div>`:'<div><span>誤差棒 · 重複次數</span><strong>SE <small>· n = 3</small></strong></div>')+`<p class="cc-grouping">${esc(groupingText(r))}</p>`:'<p>先選兩組，再顯示彎曲量測。</p>';
      field('context').textContent=p.metric==='meltingC'?'兩組均由原文判為 V 型；熔點與其作者字母不能代替彎曲量測。':'Eᵦ 為原文三點彎曲方法的模數；與一般硬度、口感或白霜分開解讀。';
    }
    field('question').textContent=question(p);root.querySelectorAll('[data-cc-choice]').forEach(b=>{b.textContent=choiceText(p.view,b.dataset.ccChoice);b.setAttribute('aria-pressed',String(b.dataset.ccChoice===c.choice));});
    for(const name of ['prediction','revision','next'])field(name).value=c[name];field('first').textContent=firstText(c);
    field('error').textContent=error;field('feedback').textContent=feedback;field('count').textContent=`${d.observations.length} / 24`;
    field('records').innerHTML=d.observations.length?d.observations.map((o,i)=>`<article><p>${esc(observationText(o,i))}</p><button type="button" data-cc-replay="${i}">回到觀察 ${i+1} 的條件</button></article>`).join(''):'<p>尚未記錄。</p>';drawSummary();}
  function record(){captureFirst('記錄條件與文字');const p=settings(d),c=current(d),o={parameters:clone(p),checked:c.checked,result:p.view==='evidence'&&(p.metric==='meltingC'||c.revealed)?clone(evidenceResult(p)):null,writing:clone(writing(c))};
    if(d.observations.some(v=>JSON.stringify(v)===JSON.stringify(o)))feedback='這份條件、結果與文字已記錄。';else if(d.observations.length>=24)feedback='已保留 24 份快照，不覆寫原紀錄；請先保存或複製。';else{d.observations.push(o);feedback=`已保留第 ${d.observations.length} 份觀察。`;saveStatus='';}draw();}
  function switchCondition(p){d.view=p.view;if(p.view==='structure'){for(const slot of slots)d[slot]=p[slot];}else{d.baselineId=p.baselineId;d.comparisonId=p.comparisonId;d.metric=p.metric;}current(d);feedback='';error='';saveStatus='';draw();}
  function click(event){if(disposed)return;const source=event.target.closest?.('[data-cc-source]');if(source&&root.contains(source)){captureFirst('開啟來源前');if(!d.sources.includes(source.dataset.ccSource))d.sources.push(source.dataset.ccSource);draw();return;}
    const b=event.target.closest?.('button');if(!b||!root.contains(b)||b.disabled)return;
    if(b.dataset.ccView){switchCondition(b.dataset.ccView==='structure'?{view:'structure',g1:d.g1,g2:d.g2,g3:d.g3}:{view:'evidence',baselineId:d.baselineId,comparisonId:d.comparisonId,metric:d.metric});return;}
    if(b.dataset.ccMetric){const metric=b.dataset.ccMetric;if(!metrics.includes(metric))return;if(metric==='bendingModulusNmm2'){captureFirst('顯示彎曲量測前');current(d).revealed=true;}d.metric=metric;feedback='';draw();return;}
    if(b.dataset.ccReplay!==undefined){const o=d.observations[Number(b.dataset.ccReplay)];if(o){switchCondition(o.parameters);feedback='已回到原條件；歷史快照與目前修訂分開保留。';draw();}return;}
    if(b.dataset.ccChoice){if(!['yes','no','unknown'].includes(b.dataset.ccChoice))return;current(d).choice=b.dataset.ccChoice;saveStatus='';draw();return;}
    const name=b.dataset.ccAction;if(name==='check'){captureFirst('核對連接前');current(d).checked=true;feedback='核對的是連接位置；晶型需要另一類證據。';draw();}
    else if(['record','record-evidence','record-writing'].includes(name))record();
    else if(name==='copy'){field('summary').focus();field('summary').select();saveStatus='已選取完整摘要，按 Ctrl+C 複製。';drawSummary();}
    else if(name==='save'&&typeof onSaveSummary==='function'){const plan=appendPlan(),cursorBefore=d.cursor;if(!plan.text)return;let saved=false,reason='';if(plan.text.length>10000)reason='本次內容超過筆記 10,000 字上限。';else try{saved=onSaveSummary(plan.text)===true;}catch(e){reason=e?.message||String(e);}if(saved&&d.cursor===cursorBefore)d.cursor=plan.next;if(disposed)return;saveStatus=saved?'已附加到本課筆記；下次只附加新觀察與修訂。':`尚未保存。${reason||'儲存端未確認成功。'} 全文與保存位置保留，請先複製備存。`;draw();}}
  function input(event){if(disposed)return;for(const name of ['prediction','revision','next'])if(event.target===field(name)){current(d)[name]=event.target.value;saveStatus='';drawSummary();return;}}
  function change(event){if(disposed)return;const t=event.target;if(slots.some(slot=>t===field(slot))){const p={view:'structure',...Object.fromEntries(slots.map(slot=>[slot,field(slot).value]))};if(!slots.every(slot=>codes.includes(p[slot]))){error='請選清單中的 P、O 或 S。';draw();return;}switchCondition(p);}
    else if(t===field('baseline')||t===field('comparison')){const a=field('baseline').value,b=field('comparison').value;if(!groups.includes(a)||!groups.includes(b)||a===b){error='請選兩個不同的原研究處理組。';draw();return;}switchCondition({view:'evidence',baselineId:a,comparisonId:b,metric:d.metric});}}
  function toggle(event){if(disposed||event.target!==field('details')||!event.target.open)return;captureFirst('開啟定義前');d.detailsOpened=true;draw();}
  root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',change);root.addEventListener('toggle',toggle,true);draw();
  return ()=>{if(disposed)return;disposed=true;root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('toggle',toggle,true);};
}
