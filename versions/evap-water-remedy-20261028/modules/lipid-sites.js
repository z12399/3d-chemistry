import {escapeHTML as esc} from './storage.js';

export const LIPID_SOURCES = Object.freeze([
  Object.freeze({title:'Ito et al. (2017) · HPODE 位置與幾何異構物分析',url:'https://www.nature.com/articles/s41598-017-10536-2',pdf:'https://www.nature.com/articles/s41598-017-10536-2.pdf',note:'第 1 頁、Figure 1 與 Results：9/13 和 9/10/12/13 的位置組合，以及混合氧化途徑。'}),
  Object.freeze({title:'Boscá et al. (2000) · 亞油酸的 Type I / Type II 光敏氧化',url:'https://doi.org/10.1016/S1011-1344(00)00102-0',note:'原始研究區分奪氫／電子轉移與單重態氧途徑，也指出兩者可以並存。'})
]);
export const LINOLEIC_REFERENCE = Object.freeze({name:'亞油酸',notation:'18:2 (9Z,12Z)',carbonCount:18,carboxylCarbon:1,bisAllylicCarbon:11,doubleBonds:Object.freeze([Object.freeze([9,10]),Object.freeze([12,13])])});
export const LIPID_PATHWAYS = Object.freeze({
  autoxidation:Object.freeze({label:'自氧化',subtitle:'自由基鏈式',sites:Object.freeze([9,13]),question:'典型自氧化後，主要的 —OOH 會在哪些碳位？',scheme:'LH → L• → LOO• → LOOH',reason:'C11 的雙烯丙位可被奪氫；自由基的離域讓後續加氧不只看原先失去氫的位置。此處比較典型的 9、13 位氫過氧化物。'}),
  type2:Object.freeze({label:'Type II 光氧化',subtitle:'單重態氧',sites:Object.freeze([9,10,12,13]),question:'換成 Type II 單重態氧途徑，—OOH 可以在哪些碳位？',scheme:'Sens* + ³O₂ → Sens + ¹O₂',reason:'光敏劑先將能量轉移給氧，形成單重態氧；它與亞油酸反應時，除了 9、13 位，也可得到 10、12 位氫過氧化物。'})
});
export const LIPID_SITE_COMPARISON = Object.freeze({shared:Object.freeze([9,13]),type2Additional:Object.freeze([10,12])});

export function evaluateLipidSites(pathway,selected) {
  const route=LIPID_PATHWAYS[pathway];
  if(!route)throw new RangeError('Unknown lipid oxidation pathway');
  if(!Array.isArray(selected) && !(selected instanceof Set))throw new TypeError('Carbon selections must be an array or Set');
  const chosen=[...new Set(selected)].sort((a,b)=>a-b);
  if(chosen.some(n=>!Number.isInteger(n)||n<1||n>LINOLEIC_REFERENCE.carbonCount))throw new RangeError('Choose carbon numbers from 1 to 18');
  const correct=chosen.filter(n=>route.sites.includes(n));
  const extra=chosen.filter(n=>!route.sites.includes(n));
  const missing=route.sites.filter(n=>!chosen.includes(n));
  return {chosen,correct,extra,missing,complete:extra.length===0&&missing.length===0};
}
const carbonList=values=>values.map(n=>'C'+n).join('、');
export function lipidSiteFeedback(pathway,selected) {
  const result=evaluateLipidSites(pathway,selected);
  if(!result.chosen.length)return '先選至少一個碳位，再檢查你的想法。';
  if(result.complete)return `這組位置符合本題的典型結果：${carbonList(result.correct)}。可切換途徑，或打開兩途徑對照。`;
  const messages=[];
  if(result.extra.length)messages.push(`多選了 ${carbonList(result.extra)}。`);
  if(result.missing.length)messages.push(`還少了 ${carbonList(result.missing)}。`);
  if(result.extra.includes(11))messages.push('C11 是原料的雙烯丙位；奪氫位置不等於這裡比較的主要 —OOH 位置。');
  return messages.join('');
}

const siteDrafts=new WeakMap();
function siteDraft(owner,key){
  const create=()=>({pathway:'autoxidation',comparison:false,selections:{autoxidation:new Set(),type2:new Set()},checked:{autoxidation:false,type2:false},writing:{autoxidation:'',type2:''},seen:{autoxidation:{feedback:false,comparison:false,mechanism:false},type2:{feedback:false,comparison:false,mechanism:false}},records:[],review:0,cursor:0,saved:new Map(),savedVersions:[],views:new Set(),savedView:'autoxidation|false',saving:false,status:''});
  if(!owner||(typeof owner!=='object'&&typeof owner!=='function'))return create();
  let entries=siteDrafts.get(owner);if(!entries){entries=new Map();siteDrafts.set(owner,entries);}
  if(!entries.has(key))entries.set(key,create());return entries.get(key);
}
const siteSeenText=seen=>Object.entries(seen).filter(([,value])=>value).map(([key])=>({feedback:'檢查回饋',comparison:'兩途徑對照',mechanism:'機構說明'})[key]).join('、')||'尚未開啟本工作台回饋／對照／機構說明';
const siteSnapshotText=snapshot=>`${LIPID_PATHWAYS[snapshot.pathway].label}｜選擇：${carbonList(snapshot.chosen)||'未選'}\n我的判斷：${snapshot.writing||'未填寫'}\n操作前已看過：${siteSeenText(snapshot.seen)}`;

/** Carbon-number selection, not a molecular geometry or product-bond diagram. */
export function mountLipidSites(container,id='lipid-sites',{draftOwner,draftKey=id,onSaveSummary}={}) {
  if(!container || typeof container.querySelector!=='function')throw new TypeError('A DOM container is required');
  if(typeof id!=='string'||!/^[a-z][a-z0-9-]{0,63}$/i.test(id))throw new TypeError('A safe component id is required');
  const state=siteDraft(draftOwner,draftKey);
  let disposed=false;
  const $=selector=>container.querySelector(selector);
  const routes=Object.entries(LIPID_PATHWAYS);
  container.innerHTML=`<section class="lipid-sites" aria-labelledby="${id}-title"><header class="lipid-sites-heading"><p class="lipid-sites-kicker">選位置，辨認途徑</p><h3 id="${id}-title">同一條脂肪酸，氧化的位置相同嗎？</h3></header>
    <div class="lipid-pathway-tabs" role="tablist" aria-label="選擇氧化途徑">${routes.map(([key,route],i)=>`<button type="button" role="tab" id="${id}-tab-${key}" data-lipid-pathway="${key}" aria-controls="${id}-panel" aria-selected="${i===0}" tabindex="${i===0?0:-1}"><strong>${route.label}</strong><span>${route.subtitle}</span></button>`).join('')}</div>
    <section id="${id}-panel" role="tabpanel" aria-labelledby="${id}-tab-autoxidation"><p class="lipid-sites-question" data-lipid-question></p><div class="lipid-reference-title"><strong>亞油酸 <span>18:2 (9Z,12Z)</span></strong><span>原料碳位編號，不是產物結構圖</span></div>
      <div class="lipid-carbon-grid" role="group" aria-label="選擇可能帶有氫過氧基的碳位，可複選">${Array.from({length:18},(_,i)=>i+1).map(n=>`<button type="button" class="lipid-carbon" data-lipid-carbon="${n}" aria-pressed="false" aria-label="C${n}${n===1?'，羧基端':n===11?'，雙烯丙位':''}"><span class="lipid-carbon-number">C${n}</span><span class="lipid-carbon-mark" data-lipid-mark="${n}" aria-hidden="true"></span></button>`).join('')}</div>
      <p class="lipid-original-landmarks">C1：羧基端 <span>原雙鍵：C9=C10、C12=C13</span> <span>C11：雙烯丙位</span></p>
      <div class="lipid-selection-row"><p data-lipid-selection>尚未選擇</p><button type="button" data-lipid-action="reset" class="lipid-reset">清空這個途徑</button></div><div class="lipid-check-row"><button type="button" class="button-primary" data-lipid-action="check">檢查選擇 →</button><label class="lipid-compare-toggle"><input type="checkbox" data-lipid-compare>對照兩條途徑</label></div><p class="lipid-sites-feedback" data-lipid-feedback role="status" aria-live="polite"></p>
      <section class="lipid-comparison" data-lipid-comparison hidden aria-label="兩條途徑的位置對照"><div class="lipid-comparison-key"><span><i class="lipid-site-dot shared"></i>共有 C9、C13</span><span><i class="lipid-site-dot additional"></i>Type II 額外 C10、C12</span></div><p><strong>自氧化</strong><span>C9、C13</span></p><p><strong>Type II</strong><span>C9、C10、C12、C13</span></p><p class="lipid-comparison-note">只偵測到 9 位或 13 位，不能單獨判定氧化途徑；還要看異構物分布與實驗條件。</p></section>
    </section>
    <details class="lipid-sites-details"><summary>我的判斷、修訂與保存</summary><div class="lipid-mechanism-note"><label for="${id}-writing">目前途徑的判斷／修訂</label><textarea id="${id}-writing" data-lipid-writing rows="3" placeholder="記下理由，再檢查；看過回饋後可繼續修訂。"></textarea><button type="button" class="button-secondary" data-lipid-action="record">留下這次判斷</button><label for="${id}-history">回看已記錄的判斷</label><select id="${id}-history" data-lipid-history></select><pre data-lipid-review aria-live="polite"></pre><label for="${id}-summary">本次將附加的摘要</label><textarea id="${id}-summary" data-lipid-summary rows="7" readonly></textarea>${typeof onSaveSummary==='function'?'<button type="button" class="button-secondary" data-lipid-action="save">附加到本課筆記</button>':''}<p data-lipid-save-status role="status"></p><small>檢查／揭示前保留一份判斷。回看舊紀錄不會覆寫目前文字；同一頁內離開再回來可接續，重新載入前請附加到筆記並匯出。紀錄只表示本工作台內的答案暴露，不能證明未從別處看過答案。</small></div></details>
    <details class="lipid-sites-details" data-lipid-mechanism><summary>為什麼位置不同？</summary><div class="lipid-mechanism-note"><p data-lipid-reason></p><p class="lipid-scheme" data-lipid-scheme></p><small>機構短式：LH 代表脂質，Sens* 代表激發態光敏劑。省略引發劑與其他參與物，不是完整記帳反應式。</small><p>光敏氧化也可能經 Type I 的電子轉移／奪氫產生自由基；光照樣品可同時出現多條途徑。</p></div></details>
    <details class="lipid-sites-details"><summary>範圍與來源</summary><div class="lipid-mechanism-note"><p>色點只標示典型氫過氧基（—OOH）的碳位集合，沒有畫產物的雙鍵移位與 E/Z 異構物。此練習不是 3D 結構、完整產物鍵圖、反應速率或產率模擬，也不涵蓋所有條件下的產物。草稿在同一頁內接續；附加到筆記後才會納入原有筆記匯出。</p><ul>${LIPID_SOURCES.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><span>${esc(source.note)}</span></li>`).join('')}</ul></div></details>
  </section>`;
  const carbonButtons=[...container.querySelectorAll('[data-lipid-carbon]')];
  const tabButtons=[...container.querySelectorAll('[data-lipid-pathway]')];
  const snapshot=(pathway=state.pathway)=>({pathway,chosen:[...state.selections[pathway]].sort((a,b)=>a-b),writing:state.writing[pathway],seen:{...state.seen[pathway]},checked:state.checked[pathway]});
  function record(action,pathway=state.pathway){const revision=state.records.filter(r=>r.pathway===pathway).length+1;state.records.push({...snapshot(pathway),sequence:state.records.length+1,revision,action});state.review=state.records.length;state.status='';}
  function pending(){
    const cursor=state.records.length,signatures=new Map(),parts=[];
    for(const item of state.records.slice(state.cursor))parts.push(`紀錄 ${item.sequence}｜${item.revision===1?'首次記錄':'修訂 '+(item.revision-1)}｜${item.action}\n${siteSnapshotText(item)}`);
    for(const [key] of routes){const item=snapshot(key),signature=JSON.stringify(item);if((item.chosen.length||item.writing||Object.values(item.seen).some(Boolean)||state.saved.has(key))&&state.saved.get(key)!==signature){signatures.set(key,signature);parts.push(`目前草稿｜${siteSnapshotText(item)}\n目前已檢查：${item.checked?'是':'否'}`);}}
    const view=`${state.pathway}|${state.comparison}`;
    if(view!==state.savedView)parts.push(`目前畫面：${LIPID_PATHWAYS[state.pathway].label}；兩途徑對照${state.comparison?'開啟':'關閉'}`);
    const text=parts.length?['【亞油酸位點工作台｜新增紀錄】',...parts,...(!state.savedVersions.length?['來源：'+LIPID_SOURCES.map(s=>s.url).join('；'),'範圍：碳位集合；不是產率或完整產物結構。']:[])].join('\n\n'):'';
    return {text,cursor,signatures,view};
  }
  function drawJournal(){
    if($('[data-lipid-writing]').value!==state.writing[state.pathway])$('[data-lipid-writing]').value=state.writing[state.pathway];
    $('[data-lipid-history]').innerHTML='<option value="0">選擇一筆紀錄</option>'+state.records.map(r=>`<option value="${r.sequence}">${r.sequence} · ${esc(LIPID_PATHWAYS[r.pathway].label)} · ${r.revision===1?'首次記錄':'修訂 '+(r.revision-1)} · ${esc(r.action)}</option>`).join('')+state.savedVersions.map((r,i)=>`<option value="${r.id}">已附加摘要 ${i+1}</option>`).join('');
    $('[data-lipid-history]').value=String(state.review);
    const item=state.records.find(r=>r.sequence===state.review),saved=state.savedVersions.find(r=>r.id===state.review);$('[data-lipid-review]').textContent=item?siteSnapshotText(item):saved?saved.text:'尚未選取紀錄；目前草稿持續保留。';
    const next=pending();$('[data-lipid-summary]').value=next.text;
    $('[data-lipid-save-status]').textContent=state.status||(!next.text?'沒有尚未附加的新紀錄。':next.text.length>10000?'摘要超過 10,000 字，尚未保存；完整草稿保留，可自行複製。':'附加時只新增尚未保存的紀錄與變更。');
    const button=$('[data-lipid-action="save"]');if(button)button.disabled=state.saving||!next.text;
  }
  async function save(){
    if(state.saving||typeof onSaveSummary!=='function')return;
    const next=pending();if(!next.text){state.status='沒有尚未附加的新紀錄。';drawJournal();return;}
    if(next.text.length>10000){state.status='摘要超過 10,000 字，未送出、未截斷；完整草稿保留，可自行複製。';drawJournal();return;}
    state.saving=true;state.status='正在附加…';drawJournal();let success=false;
    try{success=await onSaveSummary(next.text)===true;}catch{}
    state.saving=false;
    if(success){state.cursor=next.cursor;for(const [key,value] of next.signatures)state.saved.set(key,value);state.savedView=next.view;state.savedVersions.push({id:`saved-${state.savedVersions.length+1}`,text:next.text});state.status='已附加這批新增紀錄；其他新修改仍保留。';}
    else state.status='附加未成功；全部紀錄與草稿仍保留，可重試。';
    for(const update of state.views)update();
  }
  function choosePathway(pathway){state.pathway=pathway;if($('[data-lipid-mechanism]').open){record('開啟中的機構說明',pathway);state.seen[pathway].mechanism=true;}}
  function draw() {
    const route=LIPID_PATHWAYS[state.pathway],selection=state.selections[state.pathway],checked=state.checked[state.pathway];
    $('[data-lipid-question]').textContent=route.question;
    $('[role="tabpanel"]').setAttribute('aria-labelledby',`${id}-tab-${state.pathway}`);
    tabButtons.forEach(tab=>{const active=tab.dataset.lipidPathway===state.pathway;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    carbonButtons.forEach(button=>{
      const carbon=Number(button.dataset.lipidCarbon),chosen=selection.has(carbon),expected=route.sites.includes(carbon);
      const comparisonKind=state.comparison?(LIPID_SITE_COMPARISON.shared.includes(carbon)?'shared':LIPID_SITE_COMPARISON.type2Additional.includes(carbon)?'additional':''):'';
      const result=checked?(chosen&&!expected?'extra':expected?(chosen?'correct':'missing'):''):'';
      button.setAttribute('aria-pressed',String(chosen));button.dataset.result=result;button.dataset.comparison=comparisonKind;
      let label=`C${carbon}${carbon===1?'，羧基端':carbon===11?'，雙烯丙位':''}`;
      if(comparisonKind)label+=comparisonKind==='shared'?'，兩途徑共有的 OOH 位置':'，Type II 額外的 OOH 位置';
      else if(result)label+=result==='extra'?'，多選':result==='missing'?'，漏選的 OOH 位置':'，選對的 OOH 位置';
      button.setAttribute('aria-label',label);
      $(`[data-lipid-mark="${carbon}"]`).textContent=comparisonKind?'●':result==='extra'?'×':result==='missing'?'○':chosen?'✓':'';
    });
    const chosen=[...selection].sort((a,b)=>a-b);
    $('[data-lipid-selection]').textContent=chosen.length?'已選 '+carbonList(chosen):'點碳位選擇，可再次點擊取消。';
    $('[data-lipid-action="check"]').disabled=chosen.length===0;
    $('[data-lipid-action="reset"]').disabled=chosen.length===0;
    $('[data-lipid-feedback]').textContent=checked?lipidSiteFeedback(state.pathway,selection):'';
    $('[data-lipid-feedback]').dataset.correct=String(checked&&evaluateLipidSites(state.pathway,selection).complete);
    $('[data-lipid-comparison]').hidden=!state.comparison;
    $('[data-lipid-compare]').checked=state.comparison;
    $('[data-lipid-reason]').textContent=route.reason;
    $('[data-lipid-scheme]').textContent=route.scheme;
    drawJournal();
  }
  function onClick(event) {
    if(disposed)return;
    const target=event.target.closest?.('button');if(!target||!container.contains(target))return;
    const {lipidPathway,lipidCarbon,lipidAction}=target.dataset;
    if(lipidPathway && LIPID_PATHWAYS[lipidPathway])choosePathway(lipidPathway);
    else if(lipidCarbon){const carbon=Number(lipidCarbon);if(!Number.isInteger(carbon)||carbon<1||carbon>18)return;const selection=state.selections[state.pathway];selection.has(carbon)?selection.delete(carbon):selection.add(carbon);state.checked[state.pathway]=false;}
    else if(lipidAction==='check'){if(!state.selections[state.pathway].size)return;record('檢查前');state.checked[state.pathway]=true;state.seen[state.pathway].feedback=true;}
    else if(lipidAction==='reset'){record('清空選擇前');state.selections[state.pathway].clear();state.checked[state.pathway]=false;}
    else if(lipidAction==='record')record('自行記錄');
    else if(lipidAction==='save'){void save();return;}
    else return;
    draw();
  }
  function onChange(event){if(disposed)return;const target=event.target;if(target.matches?.('[data-lipid-compare]')){if(target.checked&&!state.comparison)for(const [key] of routes){record('兩途徑對照前',key);state.seen[key].comparison=true;}state.comparison=target.checked;draw();}else if(target.matches?.('[data-lipid-history]')){const value=Number(target.value);if(value===0||state.records.some(r=>r.sequence===value)||state.savedVersions.some(r=>r.id===target.value)){state.review=state.savedVersions.some(r=>r.id===target.value)?target.value:value;drawJournal();}}}
  function onInput(event){if(disposed||!event.target.matches?.('[data-lipid-writing]'))return;state.writing[state.pathway]=event.target.value;state.status='';drawJournal();}
  function onToggle(event){if(disposed||!event.target.matches?.('[data-lipid-mechanism]')||!event.target.open)return;record('機構說明前');state.seen[state.pathway].mechanism=true;drawJournal();}
  function onKeydown(event){
    if(disposed)return;
    const target=event.target.closest?.('[data-lipid-pathway]');if(!target||!container.contains(target)||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const index=tabButtons.indexOf(target),next=event.key==='Home'?0:event.key==='End'?tabButtons.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabButtons.length)%tabButtons.length;
    choosePathway(tabButtons[next].dataset.lipidPathway);draw();tabButtons[next].focus();
  }
  state.views.add(drawJournal);container.addEventListener('click',onClick);container.addEventListener('change',onChange);container.addEventListener('input',onInput);container.addEventListener('toggle',onToggle,true);container.addEventListener('keydown',onKeydown);draw();
  return ()=>{if(disposed)return;disposed=true;state.views.delete(drawJournal);container.removeEventListener('click',onClick);container.removeEventListener('change',onChange);container.removeEventListener('input',onInput);container.removeEventListener('toggle',onToggle,true);container.removeEventListener('keydown',onKeydown);};
}
