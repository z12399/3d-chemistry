import {MISO_SALT_ID,MISO_SOURCES,MISO_ROLES,MISO_PAIRS,MISO_ENDPOINTS,MISO_STATIONS,createMisoDraft,getMisoStation,getMisoRole,getMisoPair,getMisoEndpoint,setMisoControl,getMisoTrial,misoRequiresReveal,getMisoPrediction,chooseMisoPrediction,canRevealMiso,revealMisoEvidence,chooseMisoAnswer,canCheckMiso,checkMisoAnswer,currentMisoDiffers,buildMisoSummary,misoContextLabel} from './miso-salt-model.js';
import {createWorkbenchSessionStore,subscribeWorkbench,refreshWorkbenchFeedback,markWorkbenchChanged,saveWorkbenchSummary,escapeHtml as esc,textareaValue} from './workbench-session.js';
export {MISO_SALT_ID} from './miso-salt-model.js';
const sessions=createWorkbenchSessionStore({createDraft:createMisoDraft,buildSummary:buildMisoSummary});
let instance=0;
export function mountMisoSaltLab(container,id=MISO_SALT_ID,options={}){
 if(id!==MISO_SALT_ID)throw new RangeError('Unsupported miso activity');
 if(!container||typeof container.querySelector!=='function')throw new TypeError('A DOM container is required');
 const {draftOwner,draftKey=id,onSaveSummary}=options,owner=draftOwner&&['object','function'].includes(typeof draftOwner)?draftOwner:container;
 const record=sessions.get(owner,draftKey),d=record.draft,prefix=`msalt-${++instance}`;let disposed=false;refreshWorkbenchFeedback(record);
 container.innerHTML=`<section class="miso-salt-lab" data-msalt-lab aria-labelledby="${prefix}-title">
  <header><h3 id="${prefix}-title">鹽降低了，哪個結果真的被量到？</h3><p>沿角色鏈、配方與端點逐段取證；先保留預測，再用已刊資料修訂。</p></header>
  <p class="msalt-origin">角色與遷移題為<strong>原創概念材料</strong>；研究頁只揭示已刊固定觀察。沒有鹽量／製程滑桿、虛構軌跡、培養操作或安全預測。</p>
  <label for="${prefix}-station">推理任務<select id="${prefix}-station" data-msalt-station>${MISO_STATIONS.map(s=>`<option value="${s.id}">${esc(s.title)}</option>`).join('')}</select></label>
  <div class="msalt-layout"><section class="msalt-material" aria-label="本題材料與比較條件">
   <label data-msalt-role-wrap for="${prefix}-role">追哪個角色<select id="${prefix}-role" data-msalt-role>${MISO_ROLES.map(x=>`<option value="${x.id}">${esc(x.label)}</option>`).join('')}</select></label>
   <label data-msalt-pair-wrap for="${prefix}-pair">要比較的材料<select id="${prefix}-pair" data-msalt-pair>${MISO_PAIRS.map(x=>`<option value="${x.id}">${esc(x.label)}</option>`).join('')}</select></label>
   <label data-msalt-endpoint-wrap for="${prefix}-endpoint">揭示哪個端點<select id="${prefix}-endpoint" data-msalt-endpoint>${MISO_ENDPOINTS.map(x=>`<option value="${x.id}">${esc(x.label)}</option>`).join('')}</select></label>
   <label data-msalt-basis-wrap for="${prefix}-basis">濃度相減的基準<select id="${prefix}-basis" data-msalt-basis><option value="endpoint">只比末端濃度</option><option value="net">先減各自起點，再比淨變化</option></select></label>
   <div data-msalt-material></div>
  </section><section class="msalt-stage" data-msalt-stage></section></div>
  <p class="msalt-error" data-msalt-error role="status"></p>
  <div class="msalt-actions"><button type="button" data-msalt-previous>上一項</button><button type="button" data-msalt-next>下一項</button></div>
  <details data-msalt-detail="synthesis"><summary>整合成自己的短答</summary><label for="${prefix}-synthesis">從減鹽名稱走到結論，中間還缺哪一份證據？<textarea id="${prefix}-synthesis" data-msalt-synthesis rows="4" maxlength="1600">${textareaValue(d.synthesis)}</textarea></label></details>
  <details data-msalt-detail="scope"><summary>研究身分、數字與來源界線</summary><p>本課角色背景選定米麴與黃豆，並非全部味噌的同一配方。Santos研究另包含替代豆類；本台數字只取原文黃豆參照配方SM3／SM12。兩配方除NaCl外也有豆類比例與非巴氏味噌背景等差異，不能當單一鹽的因果實驗。</p><p>T0／T18保留原文採樣標籤，不作生產時程建議。葡萄糖是g／100g（原表單位），TSS是所報方法的°Brix，不能當同一個量。只對報告平均值作濃度相減；不傳播SD、不由n=3宣稱三獨立製造批次，不由兩點補速率或完整收支。</p><p>所報培養未檢出限定酵母／乳酸菌原檢查範圍，不填零菌／全部死亡／VBNC已證或病原毒素陰性。本台未提供食物安全、保存期限、人體中毒機率或通用閾值。</p>${MISO_SOURCES.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a><br>${esc(s.scope)}</p>`).join('')}</details>
  <details data-msalt-detail="summary" data-msalt-summary-detail><summary>複製完整作答摘要</summary><label for="${prefix}-summary">完整可讀摘要<textarea id="${prefix}-summary" data-msalt-summary readonly rows="8"></textarea></label><p>原筆記上限10,000字。過長時先手動複製，整理筆記或作答後再附加；重試不會突破上限，也不截斷文字。</p></details>
  <div class="msalt-actions"><button type="button" data-msalt-save>附加預測、原答、核對與修訂到本課筆記</button><p data-msalt-save-status role="status"></p></div>
  <p class="msalt-small">14個有限題目槽。預測在首次揭示固定；判讀初答在首次核對固定。這不是盲測或得分預測，自由文字未自動評分。草稿限本頁工作階段，成功附加的可讀摘要才隨筆記匯出；重載不重建未保存盤面。</p>
 </section>`;
 const root=container.querySelector('[data-msalt-lab]'),$=selector=>root.querySelector(selector);
 const detailState=()=>root.querySelectorAll('[data-msalt-detail]').forEach(n=>{d.details[n.dataset.msaltDetail]=n.open;});
 const restoreDetails=()=>root.querySelectorAll('[data-msalt-detail]').forEach(n=>{n.open=Boolean(d.details[n.dataset.msaltDetail]);});
 function flush(){const t=getMisoTrial(d),predictionReason=$('[data-msalt-prediction-reason]'),reason=$('[data-msalt-reason]'),revision=$('[data-msalt-revision]');if(predictionReason&&!t.revealed)t.predictionReason=predictionReason.value;if(reason&&!t.checked)t.reason=reason.value;if(revision&&t.checked)t.revision=revision.value;d.synthesis=$('[data-msalt-synthesis]').value;}
 function summary(){$('[data-msalt-summary]').value=buildMisoSummary(d);}
 function saveStatus(){if(disposed)return;$('[data-msalt-save]').disabled=Boolean(record.pending);$('[data-msalt-save-status]').textContent=record.message;if(record.status==='failed'){$('[data-msalt-summary-detail]').open=true;d.details.summary=true;}}
 const changed=()=>{summary();markWorkbenchChanged(record);};
 function current(){const t=getMisoTrial(d),node=$('[data-msalt-current-status]');const check=$('[data-msalt-check]');if(check)check.disabled=!canCheckMiso(d);const reveal=$('[data-msalt-reveal]');if(reveal)reveal.disabled=!canRevealMiso(d);if(node)node.textContent=currentMisoDiffers(d)?'目前選項已改；上方仍是首次核對，不能當作目前已答對。':'目前選項與首次核對相同；自由文字修訂不自動評分。';}
 function evidenceHTML(t){if(!t.revealed)return '<p class="msalt-unrevealed">本槽研究資料尚未揭示。請先留下預測；可選目前無法預言。</p>';const e=t.revealed.evidence;return `<section class="msalt-evidence" data-msalt-evidence><h4 data-msalt-evidence-heading tabindex="-1">${esc(e.title)}</h4>${e.rows?`<div class="msalt-table-scroll"><table><caption>固定已刊觀察；非原創模擬資料</caption><thead><tr>${e.rows[0].map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${e.rows.slice(1).map(row=>`<tr>${row.map((x,i)=>i?`<td>${esc(x)}</td>`:`<th scope="row">${esc(x)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}${e.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}<p class="msalt-small">來源：${esc(MISO_SOURCES.find(s=>s.id===e.sourceId)?.label??e.sourceId)}；固定觀察不因你的預測而改變。</p></section>`;}
 function material(){
  const t=getMisoTrial(d),role=d.stationId==='roles',comparison=d.stationId==='comparison',observation=d.stationId==='observations',change=d.stationId==='change';
  $('[data-msalt-role-wrap]').hidden=!role;$('[data-msalt-pair-wrap]').hidden=!comparison;$('[data-msalt-endpoint-wrap]').hidden=!observation;$('[data-msalt-basis-wrap]').hidden=!change;
  $('[data-msalt-role]').value=d.roleId;$('[data-msalt-pair]').value=d.pairId;$('[data-msalt-endpoint]').value=d.endpointId;$('[data-msalt-basis]').value=d.basisId;
  const node=$('[data-msalt-material]');
  if(role)node.innerHTML=`<p class="msalt-given">${esc(getMisoRole(d.roleId).given)}</p><ol class="msalt-chain"><li>麴供應酵素</li><li>蛋白／澱粉的水解產物</li><li>相符微生物的代謝</li><li>依產品而變的量測端點</li></ol><p>鹽、水與原料是作用環境的一部分；箭頭不是完整反應、速率或品質保證。</p>`;
  else if(comparison)node.innerHTML=`<p class="msalt-given">${esc(getMisoPair(d.pairId).given)}</p><p>先辨認比較單位與同時改變的因素，才決定可回答的問題。</p>`;
  else if(misoRequiresReveal(d))node.innerHTML=evidenceHTML(t);
  else node.innerHTML='<p class="msalt-given">遷移情境：另一個產品、配方與減鹽介入。</p><p>同樣使用麴，不能讓味噌、醬油與不同研究的資料自動成為同一套證據。</p>';
 }
 function predictionHTML(t){if(!misoRequiresReveal(d))return '';const p=getMisoPrediction(d);return `<section class="msalt-prediction"><h4 id="${prefix}-prediction">先保留自己的預測</h4><p>${esc(p.prompt)}</p><fieldset aria-labelledby="${prefix}-prediction"><legend>揭示前的判斷</legend>${p.options.map(o=>`<label class="msalt-choice"><input type="radio" name="${prefix}-prediction-${d.stationId}" data-msalt-prediction value="${o.id}"${t.prediction===o.id?' checked':''}${t.revealed?' disabled':''}><span>${esc(o.label)}</span></label>`).join('')}</fieldset><label for="${prefix}-prediction-reason">預測理由（選填）<textarea id="${prefix}-prediction-reason" data-msalt-prediction-reason rows="2" maxlength="900"${t.revealed?' readonly':''}>${textareaValue(t.predictionReason)}</textarea></label><button type="button" data-msalt-reveal${t.revealed?' disabled':''}>${t.revealed?'已保留首次預測並揭示':'保留預測並揭示固定觀察'}</button><p class="msalt-small">預測不自動算分；實際資料不因選項改變。核對在下一段，請解釋觀察能支持到哪裡。</p></section>`;}
 function feedback(t){if(!t.checked)return '';const s=t.checked,item=getMisoStation(s.stationId),label=item.options.find(x=>x.id===s.choice)?.label??'未選';return `<h4 data-msalt-feedback-heading tabindex="-1">${s.correct?'首次核對：符合本題資料與界線。':'首次核對：需要修訂。'}</h4><p>${esc(s.feedback)}</p><p>${esc(s.explanation)}</p><p data-msalt-current-status></p><label for="${prefix}-revision">對照後的修訂<textarea id="${prefix}-revision" data-msalt-revision rows="3" maxlength="900">${textareaValue(t.revision)}</textarea></label><details data-msalt-detail="history"><summary>初答與首次核對條件</summary><p>初答：${esc(label)}</p><p>條件：${esc(misoContextLabel(s.context))}</p><p>核對前理由：${esc(s.reason||'未填')}</p></details>`;}
 function render(){const s=getMisoStation(d.stationId),t=getMisoTrial(d),i=MISO_STATIONS.findIndex(x=>x.id===s.id);$('[data-msalt-station]').value=s.id;$('[data-msalt-previous]').disabled=i===0;$('[data-msalt-next]').disabled=i===MISO_STATIONS.length-1;const ready=!misoRequiresReveal(d)||Boolean(t.revealed);
  $('[data-msalt-stage]').innerHTML=`${predictionHTML(t)}<section data-msalt-interpretation${ready?'':' hidden'}><h4 id="${prefix}-question" data-msalt-question tabindex="-1">${esc(s.prompt)}</h4><fieldset aria-labelledby="${prefix}-question"><legend>依資料選一個判讀</legend>${s.options.map(o=>`<label class="msalt-choice"><input type="radio" name="${prefix}-answer-${s.id}" data-msalt-choice value="${o.id}"${t.choice===o.id?' checked':''}><span>${esc(o.label)}</span></label>`).join('')}</fieldset><label for="${prefix}-reason">核對前理由（選填）<textarea id="${prefix}-reason" data-msalt-reason rows="3" maxlength="900"${t.checked?' readonly':''}>${textareaValue(t.reason)}</textarea></label><button type="button" data-msalt-check${t.checked?' disabled':''}>${t.checked?'已保留首次核對':'保留判讀初答並核對'}</button><section class="msalt-feedback" aria-live="polite"${t.checked?'':' hidden'}>${feedback(t)}</section></section>`;
  $('[data-msalt-error]').textContent='';material();restoreDetails();current();summary();
 }
 function navigate(key,value){flush();detailState();setMisoControl(d,key,value);render();changed();$('[data-msalt-question]')?.focus?.({preventScroll:true});}
 const onInput=e=>{if(disposed)return;const n=e.target,t=getMisoTrial(d);if(n.matches('[data-msalt-prediction-reason]')&&!t.revealed)t.predictionReason=n.value;else if(n.matches('[data-msalt-reason]')&&!t.checked)t.reason=n.value;else if(n.matches('[data-msalt-revision]')&&t.checked)t.revision=n.value;else if(n.matches('[data-msalt-synthesis]'))d.synthesis=n.value;else return;changed();};
 const onChange=e=>{if(disposed)return;const n=e.target,t=getMisoTrial(d);
  if(n.matches('[data-msalt-prediction]')){if(!t.revealed){chooseMisoPrediction(d,n.value);current();changed();}return;}
  if(n.matches('[data-msalt-choice]')){chooseMisoAnswer(d,n.value);current();changed();return;}
  const selectors=[['[data-msalt-station]','stationId'],['[data-msalt-role]','roleId'],['[data-msalt-pair]','pairId'],['[data-msalt-endpoint]','endpointId'],['[data-msalt-basis]','basisId']],selected=selectors.find(([s])=>n.matches(s));
  if(selected)try{navigate(selected[1],n.value);}catch{$('[data-msalt-station]').value=d.stationId;$('[data-msalt-role]').value=d.roleId;$('[data-msalt-pair]').value=d.pairId;$('[data-msalt-endpoint]').value=d.endpointId;$('[data-msalt-basis]').value=d.basisId;$('[data-msalt-error]').textContent='未支援的條件，沒有改寫原稿或把無效值當成零。';}
 };
 const onClick=e=>{if(disposed)return;const b=e.target.closest('button');if(!b||!root.contains(b)||b.disabled)return;
  if(b.matches('[data-msalt-reveal]')){flush();detailState();if(revealMisoEvidence(d)){render();changed();$('[data-msalt-evidence-heading]')?.focus?.({preventScroll:true});}}
  else if(b.matches('[data-msalt-check]')){flush();detailState();if(checkMisoAnswer(d)){render();changed();$('[data-msalt-feedback-heading]')?.focus?.({preventScroll:true});}}
  else if(b.matches('[data-msalt-previous]')||b.matches('[data-msalt-next]')){const i=MISO_STATIONS.findIndex(x=>x.id===d.stationId)+(b.matches('[data-msalt-next]')?1:-1);if(i>=0&&i<MISO_STATIONS.length)navigate('stationId',MISO_STATIONS[i].id);}
  else if(b.matches('[data-msalt-save]')){flush();changed();saveWorkbenchSummary(record,onSaveSummary);}
 };
 const onToggle=e=>{if(!disposed&&e.target.matches('[data-msalt-detail]'))d.details[e.target.dataset.msaltDetail]=e.target.open;};
 render();saveStatus();const unsubscribe=subscribeWorkbench(record,saveStatus);root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('click',onClick);root.addEventListener('toggle',onToggle,true);
 return()=>{if(disposed)return;flush();detailState();disposed=true;unsubscribe();changed();root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('click',onClick);root.removeEventListener('toggle',onToggle,true);};
}
