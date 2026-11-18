import {escapeHTML as esc} from './storage.js';
import {THERMAL_PROCESS_COMPARISON_LAB_ID,THERMAL_COMPARISON_VERSION,THERMAL_CASES,THERMAL_COMPARISON_SOURCES,NUTRIENTS,NUTRITION_STUDY,thermalCase,evaluateThermalClaim,comparePackageState,nutritionEvidence} from './thermal-process-comparison-model.js';
export {THERMAL_PROCESS_COMPARISON_LAB_ID} from './thermal-process-comparison-model.js';
const drafts=new WeakMap();let sequence=0;
const clone=value=>structuredClone(value);
const emptyWriting=()=>({choice:'',prediction:'',revision:'',next:'',transfer:'',pin:''});
const fresh=()=>({mode:'process',a:'pasteurized-milk',b:'uht-aseptic-milk',package:'sealed',evidence:'documented',nutrient:'B2',writings:{},firsts:[],records:[],sources:[],cursor:{records:0,firsts:0,writings:{},sources:[],started:false}});
const choices={'conditions':'須看處理與後續條件','heat-only':'只看加熱就足夠','unsure':'先保留判斷'};
const pins={heat:'處理記錄',target:'微生物目標',storage:'包裝與儲存前提',nutrition:'研究指標與比較基準'};
const modeNames={process:'比較處理',opening:'只改開封',nutrition:'營養證據'};
const sourceText=()=>THERMAL_COMPARISON_SOURCES.map(s=>`${s.id}：${s.title}；${s.locator}\n${s.url}`).join('\n');
const options=()=>THERMAL_CASES.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
const statusName=value=>({'conditional-source-claim':'有條件的來源主張','sealed-claim-not-applicable':'原未開封主張不再適用','insufficient-evidence':'後段證據不足'}[value]||value);
function processCard(product,label){return `<article class="tc-process-card"><div class="tc-case-name"><span>${label}</span><strong>${esc(product.name)}</strong></div><ol class="tc-path" aria-label="${esc(product.name)}的流程">${product.path.map((node,i)=>`<li><span>${i+1}</span>${esc(node)}</li>`).join('')}</ol>${product.packageBranch?`<p class="tc-branch">↳ ${esc(product.packageBranch)}</p>`:''}<p class="tc-heat">${esc(product.heat.label)}</p></article>`;}
function packageCard(result,label){const open=result.packageState==='opened';return `<article class="tc-package-card"><div class="tc-case-name"><span>${label}</span><strong>${open?'已開封':'完整未開封'}</strong></div><div class="tc-package-picture" role="img" aria-label="${open?'包裝邊界打開，新增可能接觸路徑；未量測污染':'完整封口的包裝情境'}"><span class="tc-box ${open?'is-open':''}"><i></i><b>${open?'開口':'密封'}</b></span><span>${open?'↙ 可能接觸外界':'包裝邊界維持'}</span></div><p>原處理記錄保持</p><strong class="tc-status">${esc(statusName(result.storageStatus))}</strong></article>`;}
export function mountThermalProcessComparisonLab(root,id=THERMAL_PROCESS_COMPARISON_LAB_ID,{draftOwner,onSaveSummary}={}){
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  if(id!==THERMAL_PROCESS_COMPARISON_LAB_ID)throw new RangeError('Unknown thermal comparison activity');
  const owned=draftOwner&&typeof draftOwner==='object';if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,fresh());
  const d=owned?drafts.get(draftOwner):fresh(),prefix=`thermal-comparison-${++sequence}`;
  const field=name=>root.querySelector(`[data-tc-${name}]`),action=name=>root.querySelector(`[data-tc-action="${name}"]`);
  let disposed=false,status='',feedback='';
  root.innerHTML=`<section class="thermal-process-comparison-lab" aria-labelledby="${prefix}-title"><h2 id="${prefix}-title" class="tc-sr-only">熱處理、營養與儲存條件比較</h2>
    <div class="tc-top"><div class="tc-modes" role="group" aria-label="熱處理比較視圖">${Object.entries(modeNames).map(([v,n])=>`<button type="button" data-tc-mode="${v}">${n}</button>`).join('')}</div><span class="tc-small">來源案例 · 條件判讀</span></div>
    <div class="tc-controls"><label for="${prefix}-a" data-tc-a-control>案例 A<select id="${prefix}-a" data-tc-a>${options()}</select></label><label for="${prefix}-b" data-tc-b-control><span data-tc-b-label>案例 B</span><select id="${prefix}-b" data-tc-b>${options()}</select></label><label for="${prefix}-nutrient" data-tc-nutrient-control>研究指標<select id="${prefix}-nutrient" data-tc-nutrient>${NUTRIENTS.map(n=>`<option value="${n.id}">${n.name}</option>`).join('')}</select></label><div class="tc-package-controls" data-tc-package-control role="group" aria-label="B 的包裝狀態"><button type="button" data-tc-package="sealed">B 未開封</button><button type="button" data-tc-package="opened">B 已開封</button></div><button type="button" class="tc-primary" data-tc-action="reveal">核對四面向</button></div>
    <div class="tc-diagram" data-tc-diagram></div><div class="tc-results" data-tc-results></div><p class="tc-context" data-tc-context></p>
    <div class="tc-record-row"><button type="button" data-tc-action="record">記下這次比較</button><span data-tc-count></span><span role="status" data-tc-feedback></span></div>
    <details><summary>我的預測、依據與修訂</summary><p>只憑熱處理名稱，能判定儲存條件或所有營養素的保留嗎？可先寫，也可直接核對；不強制作答。</p><div class="tc-choices" role="group" aria-label="初步判斷">${Object.entries(choices).map(([v,n])=>`<button type="button" data-tc-choice="${v}">${n}</button>`).join('')}</div><label for="${prefix}-prediction">我的理由<textarea id="${prefix}-prediction" maxlength="800" rows="2" data-tc-prediction></textarea></label><p class="tc-small" data-tc-first></p><label for="${prefix}-pin">我用哪項依據<select id="${prefix}-pin" data-tc-pin><option value="">尚未選擇</option>${Object.entries(pins).map(([v,n])=>`<option value="${v}">${n}</option>`).join('')}</select></label><label for="${prefix}-revision">哪項判斷改變？為什麼？<textarea id="${prefix}-revision" maxlength="1200" rows="2" data-tc-revision></textarea></label><label for="${prefix}-next">仍缺哪一項證據？<textarea id="${prefix}-next" maxlength="800" rows="2" data-tc-next></textarea></label><button type="button" data-tc-action="record-writing">記錄這次修訂</button></details>
    <details data-tc-evidence-panel><summary>撤下一項證據，還能主張什麼？</summary><label for="${prefix}-evidence">A 與 B 共同的後段／包裝資訊<select id="${prefix}-evidence" data-tc-evidence><option value="documented">保留來源的條件敘述</option><option value="missing">撤下後段／包裝證據</option></select></label><p>這個控制改的是可取得的證據，不是宣稱設備突然失效。A 與 B 使用相同證據狀態；只改開封的對照仍固定處理記錄。資料不足不等於已污染，也不等於合格。</p></details>
    <details><summary>換成含顆粒植物飲品：下一份證據</summary><p>原創缺項題：一款含顆粒植物飲品只給出設備設定溫度與「經熱處理」字樣，未提供食品各位置熱歷程、最快部分停留、包材／充填或儲存標示。你會先查哪一份記錄，用來支持哪一個主張？乳品案例有哪些結論不能直接搬來？</p><label for="${prefix}-transfer">我的遷移作答<textarea id="${prefix}-transfer" maxlength="1200" rows="3" data-tc-transfer></textarea></label></details>
    <details><summary>已記錄的比較 <span data-tc-total></span></summary><div data-tc-records></div></details>
    <details><summary>檢查並保存摘要</summary><label for="${prefix}-summary">完整摘要<textarea id="${prefix}-summary" readonly rows="7" data-tc-summary></textarea></label><button type="button" data-tc-action="copy">選取完整摘要</button><label for="${prefix}-append">本次附加內容<textarea id="${prefix}-append" readonly rows="5" data-tc-append></textarea></label><button type="button" data-tc-action="save" ${typeof onSaveSummary!=='function'?'hidden':''}>附加到本課筆記</button><p role="status" data-tc-save-status></p><p class="tc-small">只追加新比較與文字修訂；未保存草稿可在本頁課內返回。重新整理前請保存或複製。</p></details>
    <details><summary>四面向、研究方法與來源</summary><p>巴氏殺菌需對食品與相關目標微生物指定適合的處理。此處 72 °C／15 s 與 63 °C／30 min 是乳品條件例；UHT 通常 135–150 °C 仍須適當持溫，不能只憑峰溫替產品確效。圖中節點只表示流程次序，沒有臆造完整升降溫曲線。</p><p>商業無菌的主張與通常儲存、流通條件及食品中能增殖的微生物相關，不等於無條件「所有生命完全消失」。UHT 配合無菌包裝是其中一條路徑；密封容器內處理也是不同路徑。前者須維持產品處理後至封口間的受控界面；後者同樣需要衛生、封口與處理後控制。</p><p>巴氏參照的食品：${esc(THERMAL_CASES[0].food)}；連續式 72 °C／15 s 或批次式 63 °C／30 min。${esc(THERMAL_CASES[0].targetDetail)} 配方、設備或後續條件改變須另評估。</p><p>營養資料獨立於上方三張規範案例。${esc(NUTRITION_STUDY.baseline)} ${esc(NUTRITION_STUDY.scope)} ${esc(NUTRITION_STUDY.unknowns)}</p><ul>${NUTRITION_STUDY.rows.map(row=>`<li>${esc(row.name)}：${esc(row.processLabel)}</li>`).join('')}</ul><p>以上為 Table 1 的研究處理組，並非完整升降溫曲線；不使用其中儲存天數作產品期限。</p><p>「顯著降低」依作者對原乳與生產日的統計敘述；「未報告顯著降低」不等於完全不变、零損失或 100% 保留。各處理顯著性不同，也不是處理間差異顯著的檢定。濃度比較不是同批總量 true retention，沒有所有營養素的綜合排名。</p><p>開封操作是指定情境的推理；原處理史不會倒退，未來菌數與營養變化未量測。儲存敘述以乳品和指定來源為範圍，依產品標示及包裝狀態判讀，不外推所有巴氏食品，也不提供真實產品安全排程或保存期限。</p><ul>${THERMAL_COMPARISON_SOURCES.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-tc-source="${s.id}">${esc(s.title)}</a> — ${esc(s.locator)}；${esc(s.scope)}</li>`).join('')}</ul></details>
  </section>`;
  function conditions(){return d.mode==='nutrition'?{mode:d.mode,nutrient:d.nutrient}:d.mode==='opening'?{mode:d.mode,a:d.b,b:d.b,package:d.package,evidence:d.evidence}:{mode:d.mode,a:d.a,b:d.b,package:'sealed',evidence:d.evidence};}
  function key(){return d.mode==='process'?`process:${d.a}:${d.b}:${d.evidence}`:d.mode==='opening'?`opening:${d.b}:${d.evidence}`:`nutrition:${d.nutrient}`;}
  function writing(){return clone(d.writings[key()]?.text||emptyWriting());}
  function editWriting(name,value){const text=writing();text[name]=value;d.writings[key()]={conditions:clone(conditions()),text};}
  function syncWriting(){const w=writing();for(const name of ['prediction','revision','next','transfer','pin'])field(name).value=w[name];}
  function writingText(w){return `判斷：${choices[w.choice]||'未作答'}\n理由：${w.prediction||'未填'}\n所用依據：${pins[w.pin]||'未選'}\n修訂：${w.revision||'未填'}\n待補證據：${w.next||'未填'}\n遷移作答：${w.transfer||'未填'}`;}
  function conditionText(c){if(c.mode==='nutrition')return `營養證據；研究=${NUTRITION_STUDY.id}；指標=${c.nutrient}`;return `${modeNames[c.mode]}；A=${thermalCase(c.a).name}；B=${thermalCase(c.b).name}；A 未開封／B ${c.package==='sealed'?'未開封':'已開封'}；後段證據=${c.evidence==='documented'?'保留條件敘述':'缺失'}`;}
  function currentFirst(){return d.firsts.find(v=>v.key===key());}
  function reveal(trigger){if(!currentFirst())d.firsts.push({key:key(),trigger,conditions:clone(conditions()),writing:clone(writing()),sourceOpened:[...d.sources]});}
  function firstText(first){return `首次核對前（${first.trigger}）：${conditionText(first.conditions)}\n${writingText(first.writing)}\n先前開啟來源：${first.sourceOpened.join('、')||'無紀錄'}。流程／溫度可在核對前看見，並非盲測。`;} 
  function evidence(){if(d.mode==='nutrition')return nutritionEvidence(d.nutrient);if(d.mode==='opening')return comparePackageState(d.b,d.package,d.evidence);return {a:evaluateThermalClaim({caseId:d.a,downstreamEvidence:d.evidence}),b:evaluateThermalClaim({caseId:d.b,downstreamEvidence:d.evidence})};}
  function evidenceText(value,mode){if(mode==='nutrition')return `${value.baseline}\n${value.rows.map(row=>`${row.processName}（${row.processLabel}）／${value.nutrient}：${row.label}；保留率=未核定`).join('\n')}\n${value.interpretation}`;if(mode==='opening')return `A 未開封 → B ${value.after.packageState==='opened'?'已開封':'未開封'}；輸入差異=${value.changedInputs.join(',')||'無'}\nA：${value.before.storage}\nB：${value.after.storage}\n${value.interpretation}`;return [value.a,value.b].map(v=>`${thermalCase(v.caseId).name}：${v.heat.label}\n目標：${v.target}\n儲存：${v.storage}\n營養：須另讀命名指標與研究基準；此卡無保留率。`).join('\n');}
  function recordText(record,i){return `${i+1}. ${conditionText(record.conditions)}\n${evidenceText(record.result,record.conditions.mode)}\n${writingText(record.writing)}`;}
  function summary(){return [`熱處理比較 · ${THERMAL_COMPARISON_VERSION}`,'來源條件／研究類別／開封推理；非食品量測、營養總排名或安全排程。',...d.firsts.map(firstText),...d.records.map(recordText),...Object.values(d.writings).map(w=>`文字草稿：${conditionText(w.conditions)}\n${writingText(w.text)}`),'目前文字：'+conditionText(conditions()),writingText(writing()),`已開啟來源：${d.sources.join('、')||'無紀錄'}（不證明閱讀範圍）`,sourceText()].join('\n\n');}
  function appendPlan(){const next=clone(d.cursor),blocks=[];
    for(let i=next.firsts;i<d.firsts.length;i++)blocks.push(firstText(d.firsts[i]));next.firsts=d.firsts.length;
    for(let i=next.records;i<d.records.length;i++)blocks.push(recordText(d.records[i],i));next.records=d.records.length;
    for(const [id,now] of Object.entries(d.writings)){if(JSON.stringify(now)!==JSON.stringify(next.writings[id])){blocks.push(`文字修訂：${conditionText(now.conditions)}\n${writingText(now.text)}`);next.writings[id]=clone(now);}}
    const newSources=d.sources.filter(v=>!next.sources.includes(v));if(newSources.length)blocks.push(`新增來源開啟：${newSources.join('、')}（不證明閱讀範圍）`);next.sources=[...d.sources];
    if(!blocks.length)return {text:'',next};if(!next.started){blocks.unshift(`熱處理比較 · ${THERMAL_COMPARISON_VERSION}；來源條件與類別證據，非食品安全排程。`);blocks.push(sourceText());next.started=true;}
    return {text:blocks.join('\n\n'),next};
  }
  function drawSummary(){field('summary').value=summary();const plan=appendPlan();field('append').value=plan.text;action('save').disabled=!plan.text;field('save-status').textContent=status;}
  function draw(){if(disposed)return;const shown=!!currentFirst(),a=thermalCase(d.a),b=thermalCase(d.b);
    root.querySelectorAll('[data-tc-mode]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.tcMode===d.mode)));
    root.querySelectorAll('[data-tc-choice]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.tcChoice===writing().choice)));
    root.querySelectorAll('[data-tc-package]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.tcPackage===d.package)));
    for(const name of ['a','b','nutrient','evidence'])field(name).value=d[name];field('pin').value=writing().pin;
    field('a-control').hidden=d.mode!=='process';field('b-control').hidden=d.mode==='nutrition';field('b-label').textContent=d.mode==='opening'?'固定處理案例':'案例 B';field('nutrient-control').hidden=d.mode!=='nutrition';field('package-control').hidden=d.mode!=='opening';field('evidence-panel').hidden=d.mode==='nutrition';
    action('reveal').textContent=shown?'已核對，可記錄':d.mode==='process'?'核對四面向':d.mode==='opening'?'核對目前情境':'揭示研究結果';action('reveal').disabled=shown;
    if(d.mode==='process'){
      field('diagram').innerHTML=`<div class="tc-two">${processCard(a,'A')}${processCard(b,'B')}</div>`;
      const value=evidence();field('results').innerHTML=shown?`<div class="tc-comparison" role="table" aria-label="四面向比較"><div role="row" class="tc-table-head"><span role="columnheader">面向</span><strong role="columnheader">A</strong><strong role="columnheader">B</strong></div>${[['溫度時間',a.heat.label,b.heat.label],['微生物目標',a.target,b.target],['营養', '需另看命名指標與比較基準','需另看命名指標與比較基準'],['未開封儲存',value.a.storage,value.b.storage]].map(row=>`<div role="row">${row.map((c,i)=>`<${i?'p':'strong'} role="${i?'cell':'rowheader'}">${esc(c)}</${i?'p':'strong'}>`).join('')}</div>`).join('')}</div>`:'<p class="tc-prompt">先讀流程與條件；核對後比較微生物目標、營養與儲存。</p>';
      field('context').textContent=d.a===d.b?'目前是同一案例，可另選案例 B。':'換製程同時換了多項條件，不能把差異全歸因於最高溫。';
    }else if(d.mode==='opening'){
      const value=evidence();field('diagram').innerHTML=`<div class="tc-fixed-heat"><strong>${esc(b.name)}</strong><span>${esc(b.heat.label)}</span></div><div class="tc-two">${packageCard(value.before,'A')}${shown?packageCard(value.after,'B'):'<article class="tc-package-card tc-prompt">選擇 B 的開封狀態，或核對目前情境。</article>'}</div>`;
      field('results').innerHTML=shown?`<p><strong>保持：</strong>原熱處理記錄。<strong>改變：</strong>${d.package==='opened'?'開封狀態與原主張的適用前提。':'尚未改變包裝狀態。'}</p><p>${esc(value.after.storage)}</p>`:'';
      field('context').textContent=d.evidence==='missing'?'A、B 均缺後段證據；只改開封仍不能補回資料。沒有量得污染或未來營養變化。':'只改開封情境；圖示表示可能接觸，沒有量得污染或未來營養變化。';
    }else{
      const value=evidence();field('diagram').innerHTML=`<div class="tc-study-head"><strong>${esc(NUTRIENTS.find(n=>n.id===d.nutrient).name)}</strong><span>各製程：原乳 → 生產日</span></div><div class="tc-study" role="table" aria-label="維生素的作者統計敘述">${value.rows.map(row=>`<div role="row"><strong role="rowheader">${row.processName}</strong><span role="cell" class="tc-study-status ${shown&&row.status==='significant-loss'?'has-loss':''}">${shown?`${row.status==='significant-loss'?'◆':'○'} ${row.label}`:'待揭示'}</span></div>`).join('')}</div>`;
      field('results').innerHTML=shown?`<p><strong>未顯著 ≠ 零損失／100% 保留。</strong>此處保留率、樣本數、誤差仍未核定。</p>`:'';
      field('context').textContent='原乳與成品濃度均換算至 3% 脂肪；這是研究的四项處理子集，獨立於上方規範案例。';
    }
    field('first').textContent=currentFirst()?firstText(currentFirst()):'這組條件尚未核對；第一次核對會保留當時文字與来源開啟紀錄。';
    field('count').textContent=field('total').textContent=`${d.records.length} / 24`;
    field('records').innerHTML=d.records.length?d.records.map((r,i)=>`<article><p>${esc(recordText(r,i)).replaceAll('\n','<br>')}</p></article>`).join(''):'<p>尚未記錄比較。</p>';
    field('feedback').textContent=feedback;drawSummary();
  }
  function record(){reveal('記錄比較');const value={version:THERMAL_COMPARISON_VERSION,conditions:clone(conditions()),result:clone(evidence()),writing:clone(writing()),first:clone(currentFirst())};
    if(d.records.some(v=>JSON.stringify(v)===JSON.stringify(value)))feedback='這份比較與文字已記錄。';
    else if(d.records.length>=24)feedback='已保留 24 份；請保存或複製。現有紀錄不會被覆寫。';
    else{d.records.push(value);feedback=`已保留第 ${d.records.length} 份比較。`;status='';}draw();
  }
  function click(event){if(disposed)return;const source=event.target.closest?.('[data-tc-source]');if(source&&root.contains(source)){if(!d.sources.includes(source.dataset.tcSource))d.sources.push(source.dataset.tcSource);drawSummary();return;}
    const button=event.target.closest?.('button');if(!button||!root.contains(button)||button.disabled)return;
    if(button.dataset.tcMode){d.mode=button.dataset.tcMode;feedback='';syncWriting();draw();return;}
    if(button.dataset.tcChoice){editWriting('choice',button.dataset.tcChoice);status='';draw();return;}
    if(button.dataset.tcPackage){reveal('改變 B 包裝前');d.package=button.dataset.tcPackage;draw();return;}
    const name=button.dataset.tcAction;if(name==='reveal'){reveal('按下核對');draw();}
    else if(name==='record'||name==='record-writing')record();
    else if(name==='copy'){field('summary').focus();field('summary').select();status='已選取完整摘要，按 Ctrl+C 複製。';drawSummary();}
    else if(name==='save'&&typeof onSaveSummary==='function'){
      const plan=appendPlan();if(!plan.text)return;let saved=false,reason='';
      if(plan.text.length>10000)reason='本次內容超過筆記 10,000 字上限。';else try{saved=onSaveSummary(plan.text)===true;}catch(error){reason=error?.message||String(error);}
      if(saved)d.cursor=plan.next;if(disposed)return;status=saved?'已附加本次內容；後續只保存新增比較與修訂。':`尚未保存。${reason||'儲存端未確認成功。'} 內容未截斷，保存位置未前移；請先複製保留。`;draw();
    }
  }
  function input(event){if(disposed)return;for(const [name,max] of [['prediction',800],['revision',1200],['next',800],['transfer',1200]])if(event.target===field(name)){editWriting(name,event.target.value.slice(0,max));status='';drawSummary();return;}}
  function change(event){if(disposed)return;for(const [name,allowed] of [['a',THERMAL_CASES.map(v=>v.id)],['b',THERMAL_CASES.map(v=>v.id)],['nutrient',NUTRIENTS.map(v=>v.id)],['evidence',['documented','missing']],['pin',['',...Object.keys(pins)]]])if(event.target===field(name)&&allowed.includes(event.target.value)){if(name==='pin')editWriting(name,event.target.value);else d[name]=event.target.value;status='';feedback='';syncWriting();draw();return;}}
  syncWriting();
  root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',change);draw();
  return()=>{if(disposed)return;disposed=true;root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',change);};
}
