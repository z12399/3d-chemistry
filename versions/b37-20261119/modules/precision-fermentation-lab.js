import {
  PRECISION_FERMENTATION_ID, PRECISION_FERMENTATION_CASES, PRECISION_FERMENTATION_SOURCES,
  createPrecisionFermentationDraft, setPrecisionFermentationControl, precisionFermentationState,
  precisionFermentationCase, precisionFermentationTrial, choosePrecisionFermentation,
  checkPrecisionFermentation, buildPrecisionFermentationSummary
} from './precision-fermentation-model.js';
import {createWorkbenchSessionStore,subscribeWorkbench,refreshWorkbenchFeedback,markWorkbenchChanged,saveWorkbenchSummary,escapeHtml as esc,textareaValue} from './workbench-session.js';
export {PRECISION_FERMENTATION_ID} from './precision-fermentation-model.js';
const sessions=createWorkbenchSessionStore({createDraft:createPrecisionFermentationDraft,buildSummary:buildPrecisionFermentationSummary});
let instance=0;

export function mountPrecisionFermentationLab(container,id=PRECISION_FERMENTATION_ID,options={}) {
  if(id!==PRECISION_FERMENTATION_ID)throw new RangeError('Unsupported precision fermentation activity');
  if(!container||typeof container.querySelector!=='function')throw new TypeError('A DOM container is required');
  const {draftOwner,draftKey=id,onSaveSummary}=options,owner=draftOwner&&['object','function'].includes(typeof draftOwner)?draftOwner:container;
  const record=sessions.get(owner,draftKey),draft=record.draft,prefix=`pfr-${++instance}`;
  refreshWorkbenchFeedback(record);let disposed=false;
  container.innerHTML=`<section class="precision-fermentation-lab" data-pfr-lab aria-labelledby="${prefix}-title">
    <header><h3 id="${prefix}-title">從生產細胞到指定成分：哪一項已經知道？</h3><p>切換用途及證據狀態，先預判，再說明你還不能推出的結論。</p></header>
    <p class="pfr-origin"><strong>原創概念情境：</strong>A／B／X是角色代號；沒有生長、產率、純度或安全數據，也不是培養、基因工程或回收操作指引。</p>
    <label class="pfr-task" for="${prefix}-case">選一個推理任務<select id="${prefix}-case" data-pfr-case>${PRECISION_FERMENTATION_CASES.map(item=>`<option value="${item.id}">${esc(item.title)}</option>`).join('')}</select></label>
    <div class="pfr-controls" data-pfr-role-controls><label for="${prefix}-purpose">這一情境要交付什麼？<select id="${prefix}-purpose" data-pfr-purpose><option value="ingredient">指定成分 X</option><option value="food">整份發酵食品</option></select></label></div>
    <div class="pfr-controls" data-pfr-boundary-controls>
      <label for="${prefix}-location">生產階段，成分 X 所在的位置<select id="${prefix}-location" data-pfr-location><option value="outside">細胞外的培養材料中</option><option value="inside">生產細胞內</option></select></label>
      <label for="${prefix}-separation">後續是否已有與宿主分開的證據？<select id="${prefix}-separation" data-pfr-separation><option value="pending">尚未提供</option><option value="documented">已給目標與宿主分開的證據</option></select></label>
    </div>
    <div data-pfr-relation></div><section class="pfr-stage" data-pfr-stage></section>
    <details data-pfr-detail="synthesis"><summary>把關係整理成自己的短答</summary><label for="${prefix}-synthesis">我會先辨認哪些物件，再檢查哪些證據？<textarea id="${prefix}-synthesis" data-pfr-synthesis rows="4" maxlength="1600">${textareaValue(draft.synthesis)}</textarea></label></details>
    <details data-pfr-detail="scope"><summary>來源、假設與證據界線</summary><p>用途、位置及分開證據是題目給定的概念狀態，不是可執行的生物操作；切換選單不會預測任何菌量、產率、純度或功效。題目中的「已分開」只承認這一項證據，不自動增加其他品質結論。</p><p>FAO指出精準發酵尚無國際一致定義。本台用常見的「生產指定成分」用途幫助辨角色，沒有以單一條件替所有案例分類。1983研究是歷史案例，不把現代術語追寫成原文用語。</p>${PRECISION_FERMENTATION_SOURCES.map(source=>`<p><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a><br>${esc(source.scope)}</p>`).join('')}</details>
    <div class="pfr-save-row"><button type="button" data-pfr-save>附加作答與修訂到本課筆記</button><p data-pfr-save-status role="status"></p></div>
    <details data-pfr-copy data-pfr-detail="copy"><summary>複製目前完整摘要</summary><p>若原筆記加上摘要超過既有長度上限，附加會失敗；請先選取並複製下方全文，整理原筆記後再重試。這裡不截斷內容，也不繞過原儲存限制。</p><label for="${prefix}-copy">可選取的完整文字<textarea id="${prefix}-copy" data-pfr-copy-text rows="8" readonly></textarea></label></details>
    <p class="pfr-small">10個有限題目槽；初答在首次核對時固定。草稿限本頁工作階段，成功附加的摘要才隨本課筆記匯出；不重建未保存盤面。自由文字不自動評分。</p>
  </section>`;
  const root=container.querySelector('[data-pfr-lab]'),$=selector=>root.querySelector(selector);
  const captureDetails=()=>root.querySelectorAll('[data-pfr-detail]').forEach(node=>{draft.details[node.dataset.pfrDetail]=node.open;});
  const restoreDetails=()=>root.querySelectorAll('[data-pfr-detail]').forEach(node=>{node.open=Boolean(draft.details[node.dataset.pfrDetail]);});
  function flushText() {
    const trial=precisionFermentationTrial(draft),reason=$('[data-pfr-reason]'),revision=$('[data-pfr-revision]');
    if(reason&&!trial.checked)trial.reason=reason.value;
    if(revision&&trial.checked)trial.revision=revision.value;
    draft.synthesis=$('[data-pfr-synthesis]').value;
  }
  function updateSave(){
    if(disposed)return;$('[data-pfr-save]').disabled=Boolean(record.pending);$('[data-pfr-save-status]').textContent=record.message;
    $('[data-pfr-copy-text]').value=buildPrecisionFermentationSummary(draft);
    if(record.status==='failed'){$('[data-pfr-copy]').open=true;draft.details.copy=true;}
  }
  function relationHTML(){
    const state=precisionFermentationState(draft);
    if(draft.caseId==='role')return `<div class="pfr-table-scroll"><table><caption>先分開來源、目標與成品身分</caption><tbody><tr><th scope="row">用途</th><td>${esc(state.purpose)}</td></tr><tr><th scope="row">微生物角色</th><td>${esc(state.host)}</td></tr><tr><th scope="row">要交付的物件</th><td>${esc(state.target)}</td></tr></tbody></table></div>`;
    if(draft.caseId==='boundary')return `<div class="pfr-table-scroll"><table><caption>${esc(state.boundaryTarget)}</caption><tbody><tr><th scope="row">生產宿主</th><td>原創生產細胞 A</td></tr><tr><th scope="row">生產階段位置</th><td>${esc(state.location)}</td></tr><tr><th scope="row">後續分開證據</th><td>${esc(state.separation)}</td></tr></tbody></table></div>`;
    if(draft.caseId==='case')return '<p class="pfr-relation">E. coli 生產宿主 → 牛前凝乳酶（prochymosin） → 後續取得的活性凝乳酶（chymosin）及功能證據。箭頭只連結物件與證據層次，沒有操作步驟或產率。</p>';
    return '';
  }
  function feedbackHTML(trial){
    const s=trial.checkedSnapshot;if(!s)return '';
    return `<h4 data-pfr-feedback-heading tabindex="-1">${s.correct?'核對時的判讀符合目前情境。':'核對時的判讀需要修訂。'}</h4><p>${esc(s.feedback)}</p><p>${esc(s.explanation)}</p><p data-pfr-current-status></p><label for="${prefix}-revision">對照後，我會保留、撤回或補上什麼？<textarea id="${prefix}-revision" data-pfr-revision rows="3" maxlength="900">${textareaValue(trial.revision)}</textarea></label><details data-pfr-detail="history"><summary>看初答與核對條件</summary><p>首次核對題目槽：${esc(s.key)}</p><p>初答：${esc(s.choice)}；用途${esc(s.purpose)}；位置${esc(s.location)}；分開證據${esc(s.separation)}</p><p>核對時理由：${esc(s.reason||'未填')}</p></details>`;
  }
  function updateCheck(){
    const item=precisionFermentationCase(draft),trial=precisionFermentationTrial(draft);
    $('[data-pfr-check]').disabled=trial.checked||!item.options.some(option=>option.id===trial.choice);
    const status=$('[data-pfr-current-status]');
    if(status&&trial.checkedSnapshot)status.textContent=trial.choice===trial.checkedSnapshot.choice?'目前選項與首次核對相同；修訂文字未自動評分。':'目前選項已改動；上方仍是首次核對的結果，改選未重新評分，也不改寫初答。';
  }
  function renderStage({focus=false}={}){
    const item=precisionFermentationCase(draft),trial=precisionFermentationTrial(draft);
    $('[data-pfr-case]').value=draft.caseId;$('[data-pfr-purpose]').value=draft.purpose;$('[data-pfr-location]').value=draft.location;$('[data-pfr-separation]').value=draft.separation;
    $('[data-pfr-role-controls]').hidden=draft.caseId!=='role';$('[data-pfr-boundary-controls]').hidden=draft.caseId!=='boundary';
    $('[data-pfr-relation]').innerHTML=relationHTML();$('[data-pfr-relation]').hidden=!['role','boundary','case'].includes(draft.caseId);
    $('[data-pfr-stage]').innerHTML=`<h4 id="${prefix}-question" data-pfr-question tabindex="-1">${esc(item.prompt)}</h4><fieldset aria-labelledby="${prefix}-question"><legend>先作一個判讀</legend>${item.options.map(option=>`<label class="pfr-choice"><input type="radio" name="${prefix}-${item.id}" data-pfr-choice value="${esc(option.id)}"${trial.choice===option.id?' checked':''}><span>${esc(option.label)}</span></label>`).join('')}</fieldset><label for="${prefix}-reason">核對前理由（選填）<textarea id="${prefix}-reason" data-pfr-reason rows="3" maxlength="900"${trial.checked?' readonly':''}>${textareaValue(trial.reason)}</textarea></label><button type="button" data-pfr-check${trial.checked?' disabled':''}>${trial.checked?'已保留首次核對':'保留初答並核對'}</button><section class="pfr-feedback" data-pfr-feedback aria-live="polite"${trial.checked?'':' hidden'}>${feedbackHTML(trial)}</section>`;
    restoreDetails();updateCheck();if(focus)$('[data-pfr-question]')?.focus?.({preventScroll:true});
  }
  const changed=()=>markWorkbenchChanged(record);
  const onInput=event=>{
    if(disposed)return;const target=event.target,trial=precisionFermentationTrial(draft);
    if(target.matches('[data-pfr-reason]')&&!trial.checked)trial.reason=target.value;
    else if(target.matches('[data-pfr-revision]')&&trial.checked)trial.revision=target.value;
    else if(target.matches('[data-pfr-synthesis]'))draft.synthesis=target.value;else return;
    changed();
  };
  const onChange=event=>{
    if(disposed)return;const target=event.target;
    if(target.matches('[data-pfr-choice]')){flushText();choosePrecisionFermentation(draft,target.value);updateCheck();changed();return;}
    const selected=[['[data-pfr-case]','caseId'],['[data-pfr-purpose]','purpose'],['[data-pfr-location]','location'],['[data-pfr-separation]','separation']].find(([selector])=>target.matches(selector));
    if(!selected)return;flushText();captureDetails();setPrecisionFermentationControl(draft,selected[1],target.value);renderStage();changed();
  };
  const onClick=event=>{
    if(disposed)return;const button=event.target.closest('button');if(!button||!root.contains(button)||button.disabled)return;
    if(button.matches('[data-pfr-check]')){flushText();captureDetails();if(checkPrecisionFermentation(draft)){renderStage();changed();$('[data-pfr-feedback-heading]')?.focus?.({preventScroll:true});}}
    else if(button.matches('[data-pfr-save]')){flushText();changed();saveWorkbenchSummary(record,onSaveSummary);}
  };
  const onToggle=event=>{if(!disposed&&event.target.matches('[data-pfr-detail]'))draft.details[event.target.dataset.pfrDetail]=event.target.open;};
  renderStage();updateSave();const unsubscribe=subscribeWorkbench(record,updateSave);
  root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('click',onClick);root.addEventListener('toggle',onToggle,true);
  return ()=>{if(disposed)return;flushText();captureDetails();disposed=true;unsubscribe();changed();root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('click',onClick);root.removeEventListener('toggle',onToggle,true);};
}
