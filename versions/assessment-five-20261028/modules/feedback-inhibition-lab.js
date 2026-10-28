import {
  FEEDBACK_INHIBITION_ID,FEEDBACK_CONDITIONS,FEEDBACK_SOURCES,FEEDBACK_STATIONS,
  createFeedbackDraft,getFeedbackStation,getFeedbackTrial,setFeedbackStation,
  setFeedbackControl,chooseFeedbackAnswer,canCheckFeedback,checkFeedbackAnswer,
  currentFeedbackDiffers,buildFeedbackSummary
} from './feedback-inhibition-model.js';
import {createWorkbenchSessionStore,subscribeWorkbench,refreshWorkbenchFeedback,markWorkbenchChanged,saveWorkbenchSummary,escapeHtml as esc,textareaValue} from './workbench-session.js';
export {FEEDBACK_INHIBITION_ID} from './feedback-inhibition-model.js';
const sessions=createWorkbenchSessionStore({createDraft:createFeedbackDraft,buildSummary:buildFeedbackSummary});
let instance=0;

export function mountFeedbackInhibitionLab(container,id=FEEDBACK_INHIBITION_ID,options={}) {
  if(id!==FEEDBACK_INHIBITION_ID)throw new RangeError('Unsupported feedback-inhibition activity');
  if(!container || typeof container.querySelector!=='function')throw new TypeError('A DOM container is required');
  const {draftOwner,draftKey=id,onSaveSummary}=options;
  const owner=draftOwner&&['object','function'].includes(typeof draftOwner)?draftOwner:container;
  const record=sessions.get(owner,draftKey),draft=record.draft,prefix=`fi-${++instance}`;let disposed=false;
  refreshWorkbenchFeedback(record);
  container.innerHTML=`<section class="feedback-inhibition-lab" data-fi-lab aria-labelledby="${prefix}-title">
    <header><h3 id="${prefix}-title">產物回頭調節，與原料不足有何不同？</h3><p>改一個前提、先預測，再檢查自己的因果解釋。</p></header>
    <p class="fi-path">概念路徑：S → I → P；假設 P 的抑制調節作用指向 S → I 的入口。</p>
    <p class="fi-scope">這是原創四布林門模型。調節開關是<strong>給定的作用假設</strong>，不是把任意高產物濃度當成抑制已證實。沒有濃度、時間、速率、培養或基因操作程序。</p>
    <label for="${prefix}-station">推理任務<select id="${prefix}-station" data-fi-station>${FEEDBACK_STATIONS.map(item=>`<option value="${item.id}">${esc(item.title)}</option>`).join('')}</select></label>
    <div class="fi-layout"><section class="fi-controls" data-fi-controls aria-label="目前的概念假設">${FEEDBACK_CONDITIONS.map(item=>`<label for="${prefix}-${item.id}">${esc(item.label)}<select id="${prefix}-${item.id}" data-fi-control="${item.id}"><option value="yes">是</option><option value="no">否</option></select></label>`).join('')}<p>調節旗標可解除是本課的簡化規則；不推定真實系統的可逆性或立即恢復。</p></section><section class="fi-stage" data-fi-stage></section></div>
    <p data-fi-error role="status"></p>
    <div class="fi-save-row"><button type="button" data-fi-previous>上一項</button><button type="button" data-fi-next>下一項</button></div>
    <details data-fi-detail="synthesis"><summary>整合成自己的短答</summary><label for="${prefix}-synthesis">哪個是觀察，哪個是機制，恢復還缺哪個前提？<textarea id="${prefix}-synthesis" data-fi-synthesis rows="4" maxlength="1600">${textareaValue(draft.synthesis)}</textarea></label></details>
    <details data-fi-detail="scope"><summary>模型規則、原始研究與推論界線</summary><p>模型入口允許＝底物可用且必要輔因子可用且入口酵素完整且假設的抑制調節作用未啟用。只有允許／不允許兩類，不計算通量、產量或生長；並未建立後續 I → P 的充分條件。訊號設定為解除時，只改該條件，其他門不會自動修復。</p><p>生物合成的真實路徑有特定的酵素、活化或抑制調節；本課不指定一般的 Km、Vmax、結合位點，也不把所有路徑調節都當成競爭性抑制或 NAD 再生不足。</p>${FEEDBACK_SOURCES.map(source=>`<p><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a><br>${esc(source.scope)}</p>`).join('')}</details>
    <details data-fi-detail="summary" data-fi-summary-detail><summary>複製目前摘要</summary><label for="${prefix}-summary">可讀作答摘要<textarea id="${prefix}-summary" data-fi-summary readonly rows="8"></textarea></label></details>
    <div class="fi-save-row"><button type="button" data-fi-save>附加初答、核對與修訂到本課筆記</button><p data-fi-save-status role="status"></p></div>
    <p class="fi-small">六個任務槽各留本頁草稿。初答在首次核對時固定；改條件不改寫舊核對。自由文字未自動評分。成功附加的摘要才隨原筆記匯出，重新載入不重建未保存盤面。</p>
  </section>`;
  const root=container.querySelector('[data-fi-lab]'),$=selector=>root.querySelector(selector);
  const detailState=()=>root.querySelectorAll('[data-fi-detail]').forEach(node=>{draft.details[node.dataset.fiDetail]=node.open;});
  const restoreDetails=()=>root.querySelectorAll('[data-fi-detail]').forEach(node=>{node.open=Boolean(draft.details[node.dataset.fiDetail]);});
  function flushText() {
    const trial=getFeedbackTrial(draft),reason=$('[data-fi-reason]'),revision=$('[data-fi-revision]');
    if(reason&&!trial.checked)trial.reason=reason.value;
    if(revision&&trial.checked)trial.revision=revision.value;
    draft.synthesis=$('[data-fi-synthesis]').value;
  }
  function summary() { $('[data-fi-summary]').value=buildFeedbackSummary(draft); }
  function updateSave() {
    if(disposed)return;
    $('[data-fi-save]').disabled=Boolean(record.pending);$('[data-fi-save-status]').textContent=record.message;
    if(record.status==='failed'){$('[data-fi-summary-detail]').open=true;draft.details.summary=true;}
  }
  function changed() { summary();markWorkbenchChanged(record); }
  function updateCheck() {
    const trial=getFeedbackTrial(draft);$('[data-fi-check]').disabled=!canCheckFeedback(draft);
    const node=$('[data-fi-current-status]');if(node)node.textContent=currentFeedbackDiffers(draft)?'目前選項或條件已改；上方仍是首次核對快照，不能當成目前條件已答對。':'目前選項及條件與首次核對相同；自由文字修訂不自動評分。';
  }
  function feedbackHTML(trial) {
    const s=trial.checked;if(!s)return '';
    const item=getFeedbackStation(draft.stationId);
    return `<h4 data-fi-feedback-heading tabindex="-1">${s.correct?'首次核對：選項符合本題前提。':'首次核對：選項需要修訂。'}</h4><p>${esc(s.explanation)}</p><p data-fi-current-status></p><label for="${prefix}-revision">看過回饋後的修訂<textarea id="${prefix}-revision" data-fi-revision rows="3" maxlength="900">${textareaValue(trial.revision)}</textarea></label><details data-fi-detail="history"><summary>保留的初答與條件</summary><div class="fi-history"><p>初答選項：${esc(s.choice)}</p>${item.editable?`<p>${FEEDBACK_CONDITIONS.map(c=>`${esc(c.label)}：${s.controls[c.id]?'是':'否'}`).join('；')}</p>`:''}<p>核對前理由：${esc(s.reason||'未填')}</p></div></details>`;
  }
  function renderStage() {
    const item=getFeedbackStation(draft.stationId),trial=getFeedbackTrial(draft),index=FEEDBACK_STATIONS.findIndex(s=>s.id===item.id);
    $('[data-fi-station]').value=item.id;$('[data-fi-controls]').hidden=!item.editable;
    for(const control of FEEDBACK_CONDITIONS)$(`[data-fi-control="${control.id}"]`).value=trial.controls[control.id]?'yes':'no';
    $('[data-fi-previous]').disabled=index===0;$('[data-fi-next]').disabled=index===FEEDBACK_STATIONS.length-1;
    $('[data-fi-stage]').innerHTML=`<h4 id="${prefix}-question" data-fi-question tabindex="-1">${esc(item.prompt)}</h4><fieldset aria-labelledby="${prefix}-question"><legend>先選一個判斷</legend>${item.options.map(option=>`<label class="fi-choice"><input type="radio" name="${prefix}-${item.id}" data-fi-choice value="${option.id}"${trial.choice===option.id?' checked':''}><span>${esc(option.label)}</span></label>`).join('')}</fieldset><label for="${prefix}-reason">核對前理由（選填）<textarea id="${prefix}-reason" data-fi-reason rows="3" maxlength="900"${trial.checked?' readonly':''}>${textareaValue(trial.reason)}</textarea></label><button type="button" data-fi-check${trial.checked?' disabled':''}>${trial.checked?'已保留首次核對':'保留初答並核對'}</button><section class="fi-feedback" data-fi-feedback aria-live="polite"${trial.checked?'':' hidden'}>${feedbackHTML(trial)}</section>`;
    $('[data-fi-error]').textContent='';restoreDetails();updateCheck();summary();
  }
  function navigate(id) { flushText();detailState();setFeedbackStation(draft,id);renderStage();changed();$('[data-fi-question]')?.focus?.({preventScroll:true}); }
  const onInput=event=> {
    if(disposed)return;const target=event.target,trial=getFeedbackTrial(draft);
    if(target.matches('[data-fi-reason]')&&!trial.checked)trial.reason=target.value;
    else if(target.matches('[data-fi-revision]')&&trial.checked)trial.revision=target.value;
    else if(target.matches('[data-fi-synthesis]'))draft.synthesis=target.value;
    else return;
    changed();
  };
  const onChange=event=> {
    if(disposed)return;const target=event.target;
    if(target.matches('[data-fi-choice]')) { chooseFeedbackAnswer(draft,target.value);updateCheck();changed();return; }
    if(target.matches('[data-fi-station]')) {
      try {getFeedbackStation(target.value);navigate(target.value);}catch{$('[data-fi-station]').value=draft.stationId;$('[data-fi-error]').textContent='未支援的任務，原草稿仍保留。';}
      return;
    }
    if(!target.matches('[data-fi-control]'))return;
    flushText();
    try {
      if(!['yes','no'].includes(target.value))throw new RangeError('Unknown boolean selection');
      setFeedbackControl(draft,target.dataset.fiControl,target.value==='yes');$('[data-fi-error]').textContent='';
    } catch {
      const trial=getFeedbackTrial(draft);if(FEEDBACK_CONDITIONS.some(c=>c.id===target.dataset.fiControl))target.value=trial.controls[target.dataset.fiControl]?'yes':'no';
      $('[data-fi-error]').textContent='未支援的條件，沒有把輸入當成「否」或改寫原條件。';
    }
    updateCheck();changed();
  };
  const onClick=event=> {
    if(disposed)return;const button=event.target.closest('button');if(!button||!root.contains(button)||button.disabled)return;
    if(button.matches('[data-fi-check]')) {flushText();detailState();if(checkFeedbackAnswer(draft)){renderStage();changed();$('[data-fi-feedback-heading]')?.focus?.({preventScroll:true});}}
    else if(button.matches('[data-fi-previous]')||button.matches('[data-fi-next]')) {const i=FEEDBACK_STATIONS.findIndex(item=>item.id===draft.stationId)+(button.matches('[data-fi-next]')?1:-1);if(i>=0&&i<FEEDBACK_STATIONS.length)navigate(FEEDBACK_STATIONS[i].id);}
    else if(button.matches('[data-fi-save]')) {flushText();changed();saveWorkbenchSummary(record,onSaveSummary);}
  };
  const onToggle=event=>{if(!disposed&&event.target.matches('[data-fi-detail]'))draft.details[event.target.dataset.fiDetail]=event.target.open;};
  renderStage();updateSave();const unsubscribe=subscribeWorkbench(record,updateSave);
  root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('click',onClick);root.addEventListener('toggle',onToggle,true);
  return ()=>{if(disposed)return;flushText();detailState();disposed=true;unsubscribe();changed();root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('click',onClick);root.removeEventListener('toggle',onToggle,true);};
}
