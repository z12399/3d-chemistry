import {CHEESE_PROCESS_ID,CHEESE_SOURCES,CHEESE_ROUTES,CHEESE_PATH_FIELDS,CHEESE_ROLE_FOCI,CHEESE_STATIONS,createCheeseDraft,getCheeseRoute,getCheeseStation,getCheeseFocus,setCheeseControl,getCheeseTrial,chooseCheeseAnswer,canCheckCheese,checkCheeseAnswer,currentCheeseDiffers,buildCheeseSummary,cheeseFieldLabel,cheeseContextLabel} from './cheese-process-model.js';
import {createWorkbenchSessionStore,subscribeWorkbench,refreshWorkbenchFeedback,markWorkbenchChanged,saveWorkbenchSummary,escapeHtml as esc,textareaValue} from './workbench-session.js';
export {CHEESE_PROCESS_ID} from './cheese-process-model.js';
const sessions=createWorkbenchSessionStore({createDraft:createCheeseDraft,buildSummary:buildCheeseSummary});
let instance=0;

export function mountCheeseProcessLab(container,id=CHEESE_PROCESS_ID,options={}){
  if(id!==CHEESE_PROCESS_ID)throw new RangeError('Unsupported cheese activity');
  if(!container||typeof container.querySelector!=='function')throw new TypeError('A DOM container is required');
  const {draftOwner,draftKey=id,onSaveSummary}=options,owner=draftOwner&&['object','function'].includes(typeof draftOwner)?draftOwner:container;
  const record=sessions.get(owner,draftKey),d=record.draft,prefix=`chp-${++instance}`;let disposed=false;refreshWorkbenchFeedback(record);
  container.innerHTML=`<section class="cheese-process-lab" data-chp-lab aria-labelledby="${prefix}-title">
    <header><h3 id="${prefix}-title">同樣成為一塊，乾酪的角色鏈差在哪裡？</h3><p>先辨起點與本段作用，再追Ca、蛋白、水與脂肪；改一個環節，說出哪個推論失去依據。</p></header>
    <p class="chp-origin">三條<strong>選定的概念情境</strong>，不是全部乾酪的分類或製造配方。角色一致只核對描述，不預測成品質地、產率或安全。</p>
    <label for="${prefix}-station">推理任務<select id="${prefix}-station" data-chp-station>${CHEESE_STATIONS.map(s=>`<option value="${s.id}">${esc(s.title)}</option>`).join('')}</select></label>
    <div class="chp-layout"><section class="chp-model" aria-label="本題概念條件">
      <label data-chp-route-wrap for="${prefix}-route">選定產品<select id="${prefix}-route" data-chp-route>${CHEESE_ROUTES.map(r=>`<option value="${r.id}">${esc(r.label)}</option>`).join('')}</select></label>
      <div class="chp-path-controls" data-chp-path-controls>${CHEESE_PATH_FIELDS.map(f=>`<label for="${prefix}-${f.id}">${esc(f.label)}<select id="${prefix}-${f.id}" data-chp-path="${f.id}">${(f.boolean?[{id:'yes',label:'有'},{id:'no',label:'無'}]:f.options).map(o=>`<option value="${o.id}">${esc(o.label)}</option>`).join('')}</select></label>`).join('')}</div>
      <label data-chp-focus-wrap for="${prefix}-focus">追哪一段關係<select id="${prefix}-focus" data-chp-focus>${CHEESE_ROLE_FOCI.map(f=>`<option value="${f.id}">${esc(f.label)}</option>`).join('')}</select></label>
      <div class="chp-relationship" data-chp-relation></div>
    </section><section class="chp-stage" data-chp-stage></section></div>
    <p class="chp-error" data-chp-error role="status"></p>
    <div class="chp-actions"><button type="button" data-chp-previous>上一項</button><button type="button" data-chp-next>下一項</button></div>
    <details data-chp-detail="synthesis"><summary>整合成自己的短答</summary><label for="${prefix}-synthesis">本段作用如何改變結構？哪項品質仍沒量到？<textarea id="${prefix}-synthesis" data-chp-synthesis rows="4" maxlength="1600">${textareaValue(d.synthesis)}</textarea></label></details>
    <details data-chp-detail="scope"><summary>選定情境、來源與模型界線</summary><p>鮮食酸凝、酵素凝乳熟成、含乳化鹽加工乾酪只代表本課三例。加工段從既有天然乾酪起算，沒有重新由乳分出乳清或另設熟成，不表示原料沒有那些歷史。其他產品可有不同作用；本課沒有配方、培養條件、時間溫度表、分配係數或品質方程。</p><p>乳化鹽、Ca—casein關係、水合與蛋白乳化之間的連結仍受鹽種、pH、組成與處理影響。水可萃取是方法定義的部分，不當作全是游離Ca或單一品質的替代量。</p>${CHEESE_SOURCES.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a><br>${esc(s.scope)}</p>`).join('')}</details>
    <details data-chp-detail="summary" data-chp-summary-detail><summary>複製完整作答摘要</summary><label for="${prefix}-summary">完整可讀摘要<textarea id="${prefix}-summary" data-chp-summary readonly rows="8"></textarea></label><p>原筆記有10,000字上限；過長時先手動複製，整理筆記或作答後再附加。重試不會突破上限，這裡不截斷你的文字。</p></details>
    <div class="chp-actions"><button type="button" data-chp-save>附加初答、核對與修訂到本課筆記</button><p data-chp-save-status role="status"></p></div>
    <p class="chp-small">十二個有限題目槽；初答在首次核對時固定，後改條件不倒改舊結果。自由文字未自動評分。草稿限本頁工作階段，成功附加的可讀摘要才隨原筆記匯出；重載不重建未保存盤面。</p>
  </section>`;
  const root=container.querySelector('[data-chp-lab]'),$=s=>root.querySelector(s);
  const details=()=>root.querySelectorAll('[data-chp-detail]').forEach(n=>{d.details[n.dataset.chpDetail]=n.open;});
  const restoreDetails=()=>root.querySelectorAll('[data-chp-detail]').forEach(n=>{n.open=Boolean(d.details[n.dataset.chpDetail]);});
  function flush(){const t=getCheeseTrial(d),reason=$('[data-chp-reason]'),revision=$('[data-chp-revision]');if(reason&&!t.checked)t.reason=reason.value;if(revision&&t.checked)t.revision=revision.value;d.synthesis=$('[data-chp-synthesis]').value;}
  function summary(){$('[data-chp-summary]').value=buildCheeseSummary(d);}
  function saveStatus(){if(disposed)return;$('[data-chp-save]').disabled=Boolean(record.pending);$('[data-chp-save-status]').textContent=record.message;if(record.status==='failed'){$('[data-chp-summary-detail]').open=true;d.details.summary=true;}}
  const changed=()=>{summary();markWorkbenchChanged(record);};
  function updateCurrent(){const t=getCheeseTrial(d),n=$('[data-chp-current-status]');$('[data-chp-check]').disabled=!canCheckCheese(d);if(n)n.textContent=currentCheeseDiffers(d)?'目前條件或選項已改；上方仍是首次核對，不能當成目前答案已正確。':'目前條件與選項同首次核對；文字修訂不自動評分。';}
  function relation(){
    const path=d.stationId==='path',ripening=d.stationId==='ripening',role=d.stationId==='role';
    $('[data-chp-route-wrap]').hidden=!(path||ripening);$('[data-chp-path-controls]').hidden=!path;$('[data-chp-focus-wrap]').hidden=!role;
    $('[data-chp-route]').value=d.routeId;$('[data-chp-focus]').value=d.focusId;
    for(const f of CHEESE_PATH_FIELDS)$(`[data-chp-path="${f.id}"]`).value=f.boolean?(d.paths[d.routeId][f.id]?'yes':'no'):d.paths[d.routeId][f.id];
    const node=$('[data-chp-relation]');
    if(path||ripening){const r=getCheeseRoute(d.routeId);node.innerHTML=`<p class="chp-given"><strong>本例給定：</strong>${esc(r.note)}</p>${path?`<ol class="chp-chain">${CHEESE_PATH_FIELDS.map(f=>`<li><strong>${esc(f.label)}</strong><span>${esc(cheeseFieldLabel(f.id,d.paths[d.routeId][f.id]))}</span></li>`).join('')}</ol>`:'<p>把原料的早先歷史與本段新增作用分開。</p>'}`;}
    else if(role)node.innerHTML=`<p class="chp-given">本題追蹤：${esc(getCheeseFocus(d.focusId).label)}</p><p>乳化鹽 ↔ Ca—casein關係 → 蛋白與水 → 蛋白與脂肪</p><p>這是定性的關係鏈，不是每條箭頭都有固定大小或單調品質結果。</p>`;
    else if(d.stationId==='whey')node.innerHTML='<p class="chp-given">凝乳與乳清是分開的物料部分。</p><p>問題是成分去向，不是物質憑空消失或一項通用回收率。</p>';
    else if(d.stationId==='evidence')node.innerHTML='<p class="chp-given">方法：水可萃取部分</p><p>待辨：量測部分、化學物種、產品特性，是三項不同資訊。</p>';
    else node.innerHTML='<p class="chp-given">原創假想比較：甲的油析出較少。</p><p>同條件觀察；其他特性未給，沒有實驗數字或品質總分。</p>';
  }
  function feedback(t){if(!t.checked)return '';const s=t.checked,item=getCheeseStation(s.stationId),choice=item.options.find(o=>o.id===s.choice)?.label??'未選';return `<h4 data-chp-feedback-heading tabindex="-1">${s.correct?'首次核對：判讀符合本題。':'首次核對：需要修訂。'}</h4><p>${esc(s.feedback)}</p><p>${esc(s.explanation)}</p><p data-chp-current-status></p><label for="${prefix}-revision">對照後的修訂<textarea id="${prefix}-revision" data-chp-revision rows="3" maxlength="900">${textareaValue(t.revision)}</textarea></label><details data-chp-detail="history"><summary>原答與核對條件</summary><p>初答：${esc(choice)}</p><p>核對條件：${esc(cheeseContextLabel(s.context))}</p><p>核對前理由：${esc(s.reason||'未填')}</p></details>`;}
  function render(){
    const s=getCheeseStation(d.stationId),t=getCheeseTrial(d),index=CHEESE_STATIONS.findIndex(x=>x.id===s.id);
    $('[data-chp-station]').value=s.id;$('[data-chp-previous]').disabled=index===0;$('[data-chp-next]').disabled=index===CHEESE_STATIONS.length-1;
    $('[data-chp-stage]').innerHTML=`<h4 id="${prefix}-question" data-chp-question tabindex="-1">${esc(s.prompt)}</h4><fieldset aria-labelledby="${prefix}-question"><legend>先選一個判讀</legend>${s.options.map(o=>`<label class="chp-choice"><input type="radio" name="${prefix}-${s.id}" data-chp-choice value="${o.id}"${t.choice===o.id?' checked':''}><span>${esc(o.label)}</span></label>`).join('')}</fieldset><label for="${prefix}-reason">核對前理由（選填）<textarea id="${prefix}-reason" data-chp-reason rows="3" maxlength="900"${t.checked?' readonly':''}>${textareaValue(t.reason)}</textarea></label><button type="button" data-chp-check${t.checked?' disabled':''}>${t.checked?'已保留首次核對':'保留初答並核對'}</button><section class="chp-feedback" data-chp-feedback aria-live="polite"${t.checked?'':' hidden'}>${feedback(t)}</section>`;
    $('[data-chp-error]').textContent='';relation();restoreDetails();updateCurrent();summary();
  }
  function navigate(key,value){flush();details();setCheeseControl(d,key,value);render();changed();$('[data-chp-question]')?.focus?.({preventScroll:true});}
  const onInput=e=>{if(disposed)return;const n=e.target,t=getCheeseTrial(d);if(n.matches('[data-chp-reason]')&&!t.checked)t.reason=n.value;else if(n.matches('[data-chp-revision]')&&t.checked)t.revision=n.value;else if(n.matches('[data-chp-synthesis]'))d.synthesis=n.value;else return;changed();};
  const onChange=e=>{
    if(disposed)return;const n=e.target;
    if(n.matches('[data-chp-choice]')){chooseCheeseAnswer(d,n.value);updateCurrent();changed();return;}
    const selectors=[['[data-chp-station]','stationId'],['[data-chp-route]','routeId'],['[data-chp-focus]','focusId']],selected=selectors.find(([s])=>n.matches(s));
    if(selected){try{navigate(selected[1],n.value);}catch{$('[data-chp-station]').value=d.stationId;$('[data-chp-route]').value=d.routeId;$('[data-chp-focus]').value=d.focusId;$('[data-chp-error]').textContent='未支援的選擇，原草稿仍保留。';}return;}
    if(!n.matches('[data-chp-path]'))return;flush();
    try{const f=CHEESE_PATH_FIELDS.find(f=>f.id===n.dataset.chpPath);if(!f||(f.boolean&&!['yes','no'].includes(n.value)))throw new RangeError('Unknown role');setCheeseControl(d,f.id,f.boolean?n.value==='yes':n.value);$('[data-chp-error]').textContent='';}
    catch{$('[data-chp-error]').textContent='未支援的角色值；沒有把無效輸入當成「無」或改寫原條件。';}
    relation();updateCurrent();changed();
  };
  const onClick=e=>{if(disposed)return;const b=e.target.closest('button');if(!b||!root.contains(b)||b.disabled)return;
    if(b.matches('[data-chp-check]')){flush();details();if(checkCheeseAnswer(d)){render();changed();$('[data-chp-feedback-heading]')?.focus?.({preventScroll:true});}}
    else if(b.matches('[data-chp-previous]')||b.matches('[data-chp-next]')){const i=CHEESE_STATIONS.findIndex(x=>x.id===d.stationId)+(b.matches('[data-chp-next]')?1:-1);if(i>=0&&i<CHEESE_STATIONS.length)navigate('stationId',CHEESE_STATIONS[i].id);}
    else if(b.matches('[data-chp-save]')){flush();changed();saveWorkbenchSummary(record,onSaveSummary);}
  };
  const onToggle=e=>{if(!disposed&&e.target.matches('[data-chp-detail]'))d.details[e.target.dataset.chpDetail]=e.target.open;};
  render();saveStatus();const unsubscribe=subscribeWorkbench(record,saveStatus);
  root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('click',onClick);root.addEventListener('toggle',onToggle,true);
  return()=>{if(disposed)return;flush();details();disposed=true;unsubscribe();changed();root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('click',onClick);root.removeEventListener('toggle',onToggle,true);};
}
