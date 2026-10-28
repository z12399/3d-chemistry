import {SEAFOOD_HAZARD_ID,SEAFOOD_SOURCES,SEAFOOD_SPECIES,SEAFOOD_ROUTES,SEAFOOD_PACKETS,SEAFOOD_CONTROLS,SEAFOOD_LINKAGE,SEAFOOD_STATIONS,createSeafoodDraft,seafoodItem,setSeafoodControl,getSeafoodTrial,chooseSeafoodAnswer,canCheckSeafood,checkSeafoodAnswer,currentSeafoodDiffers,seafoodContextLabel,buildSeafoodSummary} from './seafood-hazard-model.js';
import {createWorkbenchSessionStore,subscribeWorkbench,refreshWorkbenchFeedback,markWorkbenchChanged,saveWorkbenchSummary,escapeHtml as esc,textareaValue} from './workbench-session.js';
export {SEAFOOD_HAZARD_ID} from './seafood-hazard-model.js';
const sessions=createWorkbenchSessionStore({createDraft:createSeafoodDraft,buildSummary:buildSeafoodSummary});let instance=0;
export function mountSeafoodHazardLab(container,id=SEAFOOD_HAZARD_ID,options={}){
 if(id!==SEAFOOD_HAZARD_ID)throw new RangeError('Unsupported seafood activity');
 if(!container||typeof container.querySelector!=='function')throw new TypeError('A DOM container is required');
 const {draftOwner,draftKey=id,onSaveSummary}=options,owner=draftOwner&&['object','function'].includes(typeof draftOwner)?draftOwner:container;
 const record=sessions.get(owner,draftKey),d=record.draft,prefix=`sfh-${++instance}`;let disposed=false;refreshWorkbenchFeedback(record);
 const optionsHTML=items=>items.map(x=>`<option value="${x.id}">${esc(x.label||x.title)}</option>`).join('');
 container.innerHTML=`<section class="seafood-hazard-lab" data-sfh-lab aria-labelledby="${prefix}-title">
 <header><h3 id="${prefix}-title">兩份Vibrio報告，能支持同一件事嗎？</h3><p>先辨暴露與取樣對象，再選能接起來源、控制和量測的證據。</p></header>
 <p class="sfh-origin">兩種具名細菌只是水產危害的代表。原創報告材料與已刊疫情研究分開；選材料不會生成新實驗，也不計算疾病機率或判食品安全。</p>
 <label for="${prefix}-station">推理任務<select id="${prefix}-station" data-sfh-station>${optionsHTML(SEAFOOD_STATIONS)}</select></label>
 <div class="sfh-layout"><section class="sfh-material" aria-label="本題給定與取證範圍">
  <label data-sfh-wrap="species" for="${prefix}-species">選定菌種<select id="${prefix}-species" data-sfh-species>${optionsHTML(SEAFOOD_SPECIES)}</select></label>
  <label data-sfh-wrap="route" for="${prefix}-route">題目給的暴露資訊<select id="${prefix}-route" data-sfh-route>${optionsHTML(SEAFOOD_ROUTES)}</select></label>
  <label data-sfh-wrap="packet" for="${prefix}-packet">選一份固定原創報告<select id="${prefix}-packet" data-sfh-packet>${optionsHTML(SEAFOOD_PACKETS)}</select></label>
  <label data-sfh-wrap="control" for="${prefix}-control">要檢查的控制主張<select id="${prefix}-control" data-sfh-control>${optionsHTML(SEAFOOD_CONTROLS)}</select></label>
  <label data-sfh-wrap="linkage" for="${prefix}-linkage">這一題採哪個取證範圍<select id="${prefix}-linkage" data-sfh-linkage>${optionsHTML(SEAFOOD_LINKAGE)}</select></label>
  <div data-sfh-given></div>
 </section><section class="sfh-stage" data-sfh-stage></section></div>
 <p class="sfh-error" data-sfh-error role="status"></p>
 <div class="sfh-actions"><button type="button" data-sfh-previous>上一項</button><button type="button" data-sfh-next>下一項</button></div>
 <details data-sfh-detail="synthesis"><summary>整合成自己的短答</summary><label for="${prefix}-synthesis">我能承認哪個觀察，還欠哪條證據？<textarea id="${prefix}-synthesis" data-sfh-synthesis rows="4" maxlength="1600">${textareaValue(d.synthesis)}</textarea></label></details>
 <details data-sfh-detail="scope"><summary>來源與模型界線</summary><p>材料中的方法／條件是題目給定，不提供檢測、培養、保存或製造的執行程序。來源管理、限制增殖、降低目標存活及避免後段再引入處理不同環節；食入和傷口接觸也要分開。沒有任何名稱自動設定實際效力。</p><p>未見可培養量增加不等於全部死亡；可培養量增加也需區分回收、可培養狀態及聚集等解釋。採樣、所測DNA、分離株、人的病例與來源歸屬要分開。資料未給或未檢出均不會被代成全系統零。</p>${SEAFOOD_SOURCES.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a><br>${esc(s.scope)}</p>`).join('')}</details>
 <details data-sfh-detail="summary" data-sfh-summary-detail><summary>複製完整作答摘要</summary><label for="${prefix}-summary">完整可讀摘要<textarea id="${prefix}-summary" data-sfh-summary readonly rows="8"></textarea></label><p>原筆記有10,000字上限。過長先手動複製，再整理筆記或作答；重試不會突破上限，這裡不截斷你的文字。</p></details>
 <div class="sfh-actions"><button type="button" data-sfh-save>附加初答、核對與修訂到本課筆記</button><p data-sfh-save-status role="status"></p></div>
 <p class="sfh-small">二十二個有限題目槽，初答在首次核對時固定；換材料或路徑各自保留，改選不倒改原核對。自由文字未自動評分。草稿限本頁，成功附加的可讀摘要才隨原筆記匯出，重載不重建未保存盤面。</p>
 </section>`;
 const root=container.querySelector('[data-sfh-lab]'),$=s=>root.querySelector(s);
 const saveDetails=()=>root.querySelectorAll('[data-sfh-detail]').forEach(n=>{d.details[n.dataset.sfhDetail]=n.open;});
 const restoreDetails=()=>root.querySelectorAll('[data-sfh-detail]').forEach(n=>{n.open=Boolean(d.details[n.dataset.sfhDetail]);});
 function flush(){const t=getSeafoodTrial(d),reason=$('[data-sfh-reason]'),revision=$('[data-sfh-revision]');if(reason&&!t.checked)t.reason=reason.value;if(revision&&t.checked)t.revision=revision.value;d.synthesis=$('[data-sfh-synthesis]').value;}
 function summary(){$('[data-sfh-summary]').value=buildSeafoodSummary(d);}
 function saveStatus(){if(disposed)return;$('[data-sfh-save]').disabled=Boolean(record.pending);$('[data-sfh-save-status]').textContent=record.message;if(record.status==='failed'){$('[data-sfh-summary-detail]').open=true;d.details.summary=true;}}
 const changed=()=>{summary();markWorkbenchChanged(record);};
 function updateCurrent(){const t=getSeafoodTrial(d),n=$('[data-sfh-current-status]');$('[data-sfh-check]').disabled=!canCheckSeafood(d);if(n)n.textContent=currentSeafoodDiffers(d)?'目前選項已改；上方仍是首次核對，不能當成目前答案已正確。':'目前選項及材料與首次核對相同；自由文字修訂不自動評分。';}
 function material(){
  const station=d.stationId;
  for(const [key,allowed]of Object.entries({species:['route','ecology'],route:['route'],packet:['evidence'],control:['control'],linkage:['typing']}))$(`[data-sfh-wrap="${key}"]`).hidden=!allowed.includes(station);
  for(const [key,field]of [['species','speciesId'],['route','routeId'],['packet','packetId'],['control','controlId'],['linkage','linkageId']])$(`[data-sfh-${key}]`).value=d[field];
  const node=$('[data-sfh-given]');
  if(station==='route'){const species=seafoodItem('species',d.speciesId),route=seafoodItem('route',d.routeId);node.innerHTML=`<p class="sfh-given">${esc(species.context)}</p><ol class="sfh-chain">${route.chain.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p>這是目前要追的關係，不是疾病機率或已證明的個人感染來源。</p>`;}
  else if(station==='evidence')node.innerHTML=`<p class="sfh-given">${esc(seafoodItem('packet',d.packetId).given)}</p><p>比較的是不同的題目材料；沒有在相同樣本上切換方法並產生新結果。</p>`;
  else if(station==='control')node.innerHTML=`<p class="sfh-given">要檢查：${esc(seafoodItem('control',d.controlId).claim)}</p><p>來源／原料 → 增殖或存活 → 後段再接觸 → 暴露與量測</p><p>不同主張位於不同環節；請選最能針對它的取證，不挑一個安全總標籤。</p>`;
  else if(station==='typing')node.innerHTML=`<p class="sfh-given">${esc(seafoodItem('linkage',d.linkageId).given)}</p><details data-sfh-detail="study"><summary>研究實際已刊的分型身分</summary><table><caption>Fearnley等2024；只列已刊類別，不列數量或風險。</caption><thead><tr><th scope="col">對象</th><th scope="col">已取得的型別</th></tr></thead><tbody><tr><th scope="row">臨床分離株</th><td>ST417、ST50</td></tr><tr><th scope="row">陽性食品分離株</th><td>ST417</td></tr></tbody></table><p>流行病學與回溯支持兩個ST與南澳牡蠣的連結；直接食品分離株資訊並非每一病例都有配對。切換取證範圍，不會把已刊結果刪除或生成另一個實驗。</p></details>`;
  else if(station==='ecology')node.innerHTML=`<p class="sfh-given">${esc(seafoodItem('species',d.speciesId).context)}</p><p>來源判讀要核對生態、產品及相符指標；不把一個菌名直接換成污染來源或疾病結果。</p>`;
  else node.innerHTML='<p class="sfh-given">原創遷移材料：已處理魚品，只有處理前原料的DNA報告；後段接觸與食用時樣本未給。</p><p>可引用既有研究作思考背景，不能讓另一產品的資料代填本題未測部分。</p>';
 }
 function feedback(t){if(!t.checked)return '';const s=t.checked,item=seafoodItem('station',s.stationId),label=item.options.find(o=>o.id===s.choice)?.label??'未選';return `<h4 data-sfh-feedback-heading tabindex="-1">${s.correct?'首次核對：判讀符合本題。':'首次核對：需要修訂。'}</h4><p>${esc(s.feedback)}</p><p>${esc(s.explanation)}</p><p data-sfh-current-status></p><label for="${prefix}-revision">對照後的修訂<textarea id="${prefix}-revision" data-sfh-revision rows="3" maxlength="900">${textareaValue(t.revision)}</textarea></label><details data-sfh-detail="history"><summary>原答與核對範圍</summary><p>初答：${esc(label)}</p><p>核對範圍：${esc(seafoodContextLabel(s.context))}</p><p>核對前理由：${esc(s.reason||'未填')}</p></details>`;}
 function render(){
  const item=seafoodItem('station',d.stationId),t=getSeafoodTrial(d),index=SEAFOOD_STATIONS.findIndex(x=>x.id===d.stationId);
  $('[data-sfh-station]').value=d.stationId;$('[data-sfh-previous]').disabled=index===0;$('[data-sfh-next]').disabled=index===SEAFOOD_STATIONS.length-1;
  $('[data-sfh-stage]').innerHTML=`<h4 id="${prefix}-question" data-sfh-question tabindex="-1">${esc(item.prompt)}</h4><fieldset aria-labelledby="${prefix}-question"><legend>先選一個判讀</legend>${item.options.map(o=>`<label class="sfh-choice"><input type="radio" name="${prefix}-${item.id}" data-sfh-choice value="${o.id}"${t.choice===o.id?' checked':''}><span>${esc(o.label)}</span></label>`).join('')}</fieldset><label for="${prefix}-reason">核對前理由（選填）<textarea id="${prefix}-reason" data-sfh-reason rows="3" maxlength="900"${t.checked?' readonly':''}>${textareaValue(t.reason)}</textarea></label><button type="button" data-sfh-check${t.checked?' disabled':''}>${t.checked?'已保留首次核對':'保留初答並核對'}</button><section class="sfh-feedback" data-sfh-feedback aria-live="polite"${t.checked?'':' hidden'}>${feedback(t)}</section>`;
  $('[data-sfh-error]').textContent='';material();restoreDetails();updateCurrent();summary();
 }
 function navigate(key,value){flush();saveDetails();setSeafoodControl(d,key,value);render();changed();$('[data-sfh-question]')?.focus?.({preventScroll:true});}
 const onInput=e=>{if(disposed)return;const n=e.target,t=getSeafoodTrial(d);if(n.matches('[data-sfh-reason]')&&!t.checked)t.reason=n.value;else if(n.matches('[data-sfh-revision]')&&t.checked)t.revision=n.value;else if(n.matches('[data-sfh-synthesis]'))d.synthesis=n.value;else return;changed();};
 const onChange=e=>{
  if(disposed)return;const n=e.target;
  if(n.matches('[data-sfh-choice]')){chooseSeafoodAnswer(d,n.value);updateCurrent();changed();return;}
  const selector=[['station','stationId'],['species','speciesId'],['route','routeId'],['packet','packetId'],['control','controlId'],['linkage','linkageId']].find(([key])=>n.matches(`[data-sfh-${key}]`));if(!selector)return;
  try{navigate(selector[1],n.value);}catch{for(const[key,field]of [['station','stationId'],['species','speciesId'],['route','routeId'],['packet','packetId'],['control','controlId'],['linkage','linkageId']])$(`[data-sfh-${key}]`).value=d[field];$('[data-sfh-error]').textContent='未支援的取證選擇；沒有把無效值當成未檢出或改寫原材料。';}
 };
 const onClick=e=>{if(disposed)return;const b=e.target.closest('button');if(!b||!root.contains(b)||b.disabled)return;
  if(b.matches('[data-sfh-check]')){flush();saveDetails();if(checkSeafoodAnswer(d)){render();changed();$('[data-sfh-feedback-heading]')?.focus?.({preventScroll:true});}}
  else if(b.matches('[data-sfh-previous]')||b.matches('[data-sfh-next]')){const index=SEAFOOD_STATIONS.findIndex(x=>x.id===d.stationId)+(b.matches('[data-sfh-next]')?1:-1);if(index>=0&&index<SEAFOOD_STATIONS.length)navigate('stationId',SEAFOOD_STATIONS[index].id);}
  else if(b.matches('[data-sfh-save]')){flush();changed();saveWorkbenchSummary(record,onSaveSummary);}
 };
 const onToggle=e=>{if(!disposed&&e.target.matches('[data-sfh-detail]'))d.details[e.target.dataset.sfhDetail]=e.target.open;};
 render();saveStatus();const unsubscribe=subscribeWorkbench(record,saveStatus);
 root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('click',onClick);root.addEventListener('toggle',onToggle,true);
 return()=>{if(disposed)return;flush();saveDetails();disposed=true;unsubscribe();changed();root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('click',onClick);root.removeEventListener('toggle',onToggle,true);};
}
