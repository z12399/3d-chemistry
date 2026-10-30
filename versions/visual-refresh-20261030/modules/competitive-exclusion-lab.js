import {
  COMPETITIVE_EXCLUSION_ID, EXCLUSION_CASES, EXCLUSION_ENDPOINTS, EXCLUSION_EVIDENCE, EXCLUSION_SOURCES,
  createExclusionDraft, getExclusionCase, getExclusionEndpoint, getExclusionEvidence, setExclusionControl,
  getExclusionTrial, canCheckExclusion, checkExclusion, buildExclusionSummary, compareExclusionEndpoints
} from './competitive-exclusion-model.js';
import {createWorkbenchSessionStore, subscribeWorkbench, refreshWorkbenchFeedback, markWorkbenchChanged, saveWorkbenchSummary, escapeHtml as esc, textareaValue} from './workbench-session.js';
export {COMPETITIVE_EXCLUSION_ID} from './competitive-exclusion-model.js';
const sessions=createWorkbenchSessionStore({createDraft:createExclusionDraft,buildSummary:buildExclusionSummary});
let instance=0;

export function mountCompetitiveExclusionLab(container,id=COMPETITIVE_EXCLUSION_ID,options={}) {
  if(id!==COMPETITIVE_EXCLUSION_ID)throw new RangeError('Unsupported competitive-exclusion activity');
  if(!container||typeof container.querySelector!=='function')throw new TypeError('A DOM container is required');
  const {draftOwner,draftKey=id,onSaveSummary}=options,owner=draftOwner&&['object','function'].includes(typeof draftOwner)?draftOwner:container;
  const record=sessions.get(owner,draftKey),draft=record.draft,prefix=`ce-${++instance}`;
  refreshWorkbenchFeedback(record);let disposed=false;
  container.innerHTML=`<section class="competitive-exclusion-lab" data-ce-lab aria-labelledby="${prefix}-title">
    <header><h3 id="${prefix}-title">先找量測，再辨認競爭的證據</h3><p>常駐群可能改變新來者的建立機會。先比較目標量，再沿資源／棲位／環境的候選解釋取證。</p></header>
    <p class="ce-origin"><strong>原創概念練習：</strong>數字與證據包均為假想指定資料，不是文獻實驗、菌數軌跡或產品效力預測。</p>
    <label for="${prefix}-case">選一個推理任務<select id="${prefix}-case" data-ce-case>${EXCLUSION_CASES.map(item=>`<option value="${item.id}">${esc(item.title)}</option>`).join('')}</select></label>
    <div class="ce-controls" data-ce-fraction-controls><label for="${prefix}-endpoint">假想端點<select id="${prefix}-endpoint" data-ce-endpoint>${EXCLUSION_ENDPOINTS.map(item=>`<option value="${item.id}">${esc(item.label)}</option>`).join('')}</select></label></div>
    <div class="ce-controls" data-ce-resource-controls>
      <label for="${prefix}-resident">常駐群<select id="${prefix}-resident" data-ce-resident><option value="present">存在</option><option value="absent">未提供存在</option></select></label>
      <label for="${prefix}-overlap">選定資源的使用<select id="${prefix}-overlap" data-ce-overlap><option value="shared">重疊</option><option value="disjoint">不重疊</option></select></label>
      <label for="${prefix}-limited">選定資源的供應<select id="${prefix}-limited" data-ce-limited><option value="limited">受限</option><option value="plentiful">充裕</option></select></label>
    </div>
    <div class="ce-controls" data-ce-evidence-controls><label for="${prefix}-evidence">原創證據包<select id="${prefix}-evidence" data-ce-evidence>${EXCLUSION_EVIDENCE.map(item=>`<option value="${item.id}">${esc(item.label)}</option>`).join('')}</select></label></div>
    <div data-ce-context></div><section data-ce-stage></section>
    <details data-ce-detail="synthesis"><summary>整合成自己的短答</summary><label for="${prefix}-synthesis">從目標量到機制，我還缺什麼？<textarea id="${prefix}-synthesis" data-ce-synthesis rows="4" maxlength="1600">${textareaValue(draft.synthesis)}</textarea></label></details>
    <details data-ce-detail="scope"><summary>假設、來源與模型界線</summary><p>記帳以相同假想基準比較兩端，不指定時間、樣本或培養方法。相對占比＝目標／（目標＋其他）；分母為0時未定義。抽象量不能直接稱活菌、定殖或效力。</p><p>資源頁只檢查一條共享受限資源假說，不模擬競爭排除的全部機制。定殖抵抗也可能涉及棲位與環境、拮抗作用；這裡沒有生長曲線、菌株設計、操作步驟或安全保證。</p>${EXCLUSION_SOURCES.map(source=>`<p><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a><br>${esc(source.scope)}</p>`).join('')}</details>
    <div class="ce-save-row"><button type="button" data-ce-save>附加作答與修訂到本課筆記</button><p data-ce-save-status role="status"></p></div>
    <details data-ce-detail="copy" data-ce-copy><summary>展開可複製的目前摘要</summary><p>可選取下方全文自行複製。若原筆記加摘要超過既有長度限制，請先複製保留並自行整理筆記，再重試；本台不截斷初答或繞過限制。</p><label for="${prefix}-copy">完整摘要（唯讀）<textarea id="${prefix}-copy" data-ce-copy-text rows="8" readonly></textarea></label></details>
    <p class="ce-small">初答在首次核對時固定；換條件另留有限題目槽。草稿限本頁工作階段，成功附加的摘要才隨本課筆記匯出；不重建未保存盤面。</p>
  </section>`;
  const root=container.querySelector('[data-ce-lab]'),$=selector=>root.querySelector(selector);
  const detailState=()=>root.querySelectorAll('[data-ce-detail]').forEach(node=>{draft.details[node.dataset.ceDetail]=node.open;});
  const restoreDetails=()=>root.querySelectorAll('[data-ce-detail]').forEach(node=>{node.open=Boolean(draft.details[node.dataset.ceDetail]);});
  function flushText(){const t=getExclusionTrial(draft),reason=$('[data-ce-reason]'),revision=$('[data-ce-revision]');if(reason&&!t.checked)t.reason=reason.value;if(revision&&t.checked)t.revision=revision.value;draft.synthesis=$('[data-ce-synthesis]').value;}
  function updateSave(){if(disposed)return;$('[data-ce-save]').disabled=Boolean(record.pending);$('[data-ce-save-status]').textContent=record.message;const copy=$('[data-ce-copy-text]'),summary=buildExclusionSummary(draft);if(copy.value!==summary)copy.value=summary;if(record.status==='failed'){$('[data-ce-copy]').open=true;draft.details.copy=true;}}
  function contextHTML(){
    if(draft.caseId==='fraction'){
      const selected=getExclusionEndpoint(draft.endpointId),v=compareExclusionEndpoints(selected.targetBefore,selected.otherBefore,selected.targetAfter,selected.otherAfter);
      const percent=value=>value===null?'未定義':`${(100*value).toFixed(4)}%`;
      return `<div class="ce-table-scroll"><table><caption>同一假想基準的抽象記帳量；非 CFU、實測時間歷程或定殖端點</caption><thead><tr><th scope="col">比較端</th><th scope="col">目標量</th><th scope="col">其他量</th><th scope="col">目標占比</th></tr></thead><tbody><tr><th scope="row">共同參照</th><td>${v.before.target}</td><td>${v.before.other}</td><td>${percent(v.before.fraction)}</td></tr><tr><th scope="row">所選情境</th><td>${v.after.target}</td><td>${v.after.other}</td><td>${percent(v.after.fraction)}</td></tr></tbody></table></div>`;
    }
    if(draft.caseId==='resource')return '<p class="ce-given">只看這條候選鏈：常駐群與新來者使用重疊資源 → 該資源受限 → 可能有競爭。這些條件不直接產生目標量，也不代替定殖證據；未支持此路徑不代表所有作用均不存在。</p>';
    if(draft.caseId==='mechanism')return `<p class="ce-given" data-ce-evidence-given>${esc(getExclusionEvidence(draft.evidenceId).given)}</p>`;
    return '';
  }
  function feedbackHTML(t){if(!t.checkedSnapshot)return '';const s=t.checkedSnapshot;return `<h4 data-ce-feedback-heading tabindex="-1">${s.correct?'核對時的推論符合這份材料。':'核對時的推論需要修訂。'}</h4><p>${esc(s.explanation)}</p><p data-ce-current-status></p><label for="${prefix}-revision">對照後，我保留或撤回哪個判斷？<textarea id="${prefix}-revision" data-ce-revision rows="3" maxlength="900">${textareaValue(t.revision)}</textarea></label><details data-ce-detail="history"><summary>看首次核對與理由</summary><p>首次條件：${esc(s.caseId)}；${esc(s.endpointId)}；${esc(s.evidenceId)}；${esc(s.resident)}/${esc(s.overlap)}/${esc(s.limited)}</p><p>首次選項：${esc(s.choice)}</p><p>核對時理由：${esc(s.reason||'未填')}</p></details>`;}
  function updateCheck(){const t=getExclusionTrial(draft);$('[data-ce-check]').disabled=!canCheckExclusion(draft);const node=$('[data-ce-current-status]');if(node&&t.checkedSnapshot)node.textContent=t.choice===t.checkedSnapshot.choice?'目前選項與首次核對相同；修訂文字不自動評分。':'目前選項已改動；上方仍是首次核對結果，尚未重新核對目前答案。';}
  function renderStage(){
    const item=getExclusionCase(draft.caseId),t=getExclusionTrial(draft);
    for(const[selector,key]of [['[data-ce-case]','caseId'],['[data-ce-endpoint]','endpointId'],['[data-ce-evidence]','evidenceId'],['[data-ce-resident]','resident'],['[data-ce-overlap]','overlap'],['[data-ce-limited]','limited']])$(selector).value=draft[key];
    $('[data-ce-fraction-controls]').hidden=draft.caseId!=='fraction';$('[data-ce-resource-controls]').hidden=draft.caseId!=='resource';$('[data-ce-evidence-controls]').hidden=draft.caseId!=='mechanism';$('[data-ce-context]').innerHTML=contextHTML();
    $('[data-ce-stage]').innerHTML=`<h4 id="${prefix}-question" data-ce-question tabindex="-1">${esc(item.prompt)}</h4><fieldset aria-labelledby="${prefix}-question"><legend>我的判讀</legend>${item.options.map(option=>`<label class="ce-choice"><input type="radio" name="${prefix}-${item.id}" data-ce-choice value="${option.id}"${t.choice===option.id?' checked':''}><span>${esc(option.label)}</span></label>`).join('')}</fieldset><label for="${prefix}-reason">核對前理由（選填）<textarea id="${prefix}-reason" data-ce-reason rows="3" maxlength="900"${t.checked?' readonly':''}>${textareaValue(t.reason)}</textarea></label><button type="button" data-ce-check${t.checked?' disabled':''}>${t.checked?'已保留首次核對':'保留初答並核對'}</button><section class="ce-feedback" data-ce-feedback aria-live="polite"${t.checked?'':' hidden'}>${feedbackHTML(t)}</section>`;
    restoreDetails();updateCheck();
  }
  const changed=()=>markWorkbenchChanged(record);
  const onInput=event=>{if(disposed)return;const t=getExclusionTrial(draft),target=event.target;if(target.matches('[data-ce-reason]')&&!t.checked)t.reason=target.value;else if(target.matches('[data-ce-revision]')&&t.checked)t.revision=target.value;else if(target.matches('[data-ce-synthesis]'))draft.synthesis=target.value;else return;changed();};
  const onChange=event=>{if(disposed)return;const target=event.target;if(target.matches('[data-ce-choice]')){flushText();getExclusionTrial(draft).choice=target.value;updateCheck();changed();return;}const selected=[['[data-ce-case]','caseId'],['[data-ce-endpoint]','endpointId'],['[data-ce-evidence]','evidenceId'],['[data-ce-resident]','resident'],['[data-ce-overlap]','overlap'],['[data-ce-limited]','limited']].find(([selector])=>target.matches(selector));if(!selected)return;flushText();detailState();setExclusionControl(draft,selected[1],target.value);renderStage();changed();};
  const onClick=event=>{if(disposed)return;const button=event.target.closest('button');if(!button||!root.contains(button)||button.disabled)return;if(button.matches('[data-ce-check]')){flushText();detailState();if(checkExclusion(draft)){renderStage();changed();$('[data-ce-feedback-heading]')?.focus?.({preventScroll:true});}}else if(button.matches('[data-ce-save]')){flushText();changed();saveWorkbenchSummary(record,onSaveSummary);}};
  const onToggle=event=>{if(!disposed&&event.target.matches('[data-ce-detail]'))draft.details[event.target.dataset.ceDetail]=event.target.open;};
  renderStage();updateSave();const unsubscribe=subscribeWorkbench(record,updateSave);
  root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('click',onClick);root.addEventListener('toggle',onToggle,true);
  return()=>{if(disposed)return;flushText();detailState();disposed=true;unsubscribe();changed();root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('click',onClick);root.removeEventListener('toggle',onToggle,true);};
}
