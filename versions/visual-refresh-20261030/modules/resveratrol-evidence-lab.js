import {
  RESVERATROL_ID, RESVERATROL_CASES, RESVERATROL_SOURCES,
  createResveratrolDraft, getResveratrolCase, getResveratrolTrial,
  setResveratrolCase, chooseResveratrol, checkResveratrol, buildResveratrolSummary
} from './resveratrol-evidence-model.js';
import {
  createWorkbenchSessionStore, subscribeWorkbench, markWorkbenchChanged,
  refreshWorkbenchFeedback, saveWorkbenchSummary, escapeHtml as esc, textareaValue
} from './workbench-session.js';

export {RESVERATROL_ID} from './resveratrol-evidence-model.js';
const sessions = createWorkbenchSessionStore({createDraft: createResveratrolDraft, buildSummary: buildResveratrolSummary});
let instance = 0;
const paragraphs = value => (Array.isArray(value) ? value : [value]).filter(line => typeof line === 'string' && line.trim()).map(line => `<p>${esc(line)}</p>`).join('');
const optionLabel = (item, id) => item.options.find(option => option.id === id)?.label || '尚未選擇';

export function mountResveratrolEvidenceLab(container, id = RESVERATROL_ID, options = {}) {
  if (id !== RESVERATROL_ID) throw new RangeError(`Unsupported resveratrol activity: ${id}`);
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const {draftOwner, draftKey = id, onSaveSummary} = options;
  const owner = draftOwner && ['object', 'function'].includes(typeof draftOwner) ? draftOwner : container;
  const record = sessions.get(owner, draftKey), draft = record.draft;
  draft.details ||= {};
  refreshWorkbenchFeedback(record);
  const prefix = `rv-study-${++instance}`;
  let disposed = false;

  container.innerHTML = `<section class="resveratrol-evidence-lab" data-rv-lab="${esc(id)}" aria-labelledby="${prefix}-title">
    <header class="rv-header"><p class="rv-kicker">結構 → 機制 → 證據</p><h3 id="${prefix}-title">白藜蘆醇：六站推理練習</h3><p>把結構分類、化學機制、細胞觀察與人體結果分開，再判斷一項證據能支持什麼。</p></header>
    <nav class="rv-navigation" aria-label="六站學習順序"><button type="button" data-rv-previous aria-controls="${prefix}-stage">← 上一站</button><p data-rv-position role="status"></p><button type="button" data-rv-next aria-controls="${prefix}-stage">下一站 →</button></nav>
    <section id="${prefix}-stage" class="rv-stage" data-rv-stage></section>
    <details class="rv-detail" data-rv-detail="synthesis"><summary>整理自己的完整解釋</summary><label for="${prefix}-synthesis">哪些結論能連起來？哪些還需要另一種證據？<textarea id="${prefix}-synthesis" data-rv-synthesis rows="4" maxlength="1200">${textareaValue(draft.synthesis || '')}</textarea></label></details>
    <div class="rv-save"><button type="button" data-rv-save>將作答與修訂附加到本課筆記</button><p data-rv-save-status role="status"></p></div>
    <p class="rv-small">草稿只留在目前頁面工作階段；切站或切課返回仍可接續。已附加的摘要才會隨本課筆記保存與匯出；作答紀錄不等於能力評分。</p>
  </section>`;
  const root = container.querySelector('[data-rv-lab]');
  const $ = selector => root.querySelector(selector);

  function rememberDetails() {
    root.querySelectorAll('[data-rv-detail]').forEach(detail => { draft.details[detail.dataset.rvDetail] = detail.open; });
  }
  function restoreDetails() {
    root.querySelectorAll('[data-rv-detail]').forEach(detail => { detail.open = Boolean(draft.details[detail.dataset.rvDetail]); });
  }
  function flushText() {
    const trial = getResveratrolTrial(draft), reason = $('[data-rv-reason]'), revision = $('[data-rv-revision]');
    if (reason && !trial.checked) trial.reason = reason.value;
    if (revision && trial.checked) trial.revision = revision.value;
    const synthesis = $('[data-rv-synthesis]');
    if (synthesis) draft.synthesis = synthesis.value;
  }
  function updateSaveStatus() {
    if (disposed) return;
    $('[data-rv-save]').disabled = Boolean(record.pending);
    $('[data-rv-save-status]').textContent = record.message;
  }
  function historyHTML(item, trial) {
    return `<p>首次選擇：${esc(optionLabel(item, trial.first))}</p><p>核對時選擇：${esc(optionLabel(item, trial.checkedSelection))}</p><p>核對時理由：${esc(trial.checkedReason || '未填寫')}</p><p>目前選擇：${esc(optionLabel(item, trial.current))}</p>`;
  }
  function updateFeedback() {
    const item = getResveratrolCase(draft.caseId), trial = getResveratrolTrial(draft);
    const feedback = $('[data-rv-feedback]');
    if (!trial.checked) { feedback.hidden = true; return; }
    const checkedOption = item.options.find(option => option.id === trial.checkedSelection);
    const currentOption = item.options.find(option => option.id === trial.current);
    $('[data-rv-checked-status]').textContent = trial.checkedSelection === item.answer ? '核對時的判斷符合這組證據。' : '核對時的判斷需要修正。';
    $('[data-rv-checked-feedback]').textContent = checkedOption?.feedback || '';
    $('[data-rv-current-status]').textContent = trial.current === trial.checkedSelection ? '目前選擇與核對時相同。' : `目前已改選「${optionLabel(item, trial.current)}」。${currentOption?.feedback || ''}首次與核對時紀錄仍保留。`;
    $('[data-rv-history]').innerHTML = historyHTML(item, trial);
    feedback.hidden = false;
  }
  function renderStage({focus = false} = {}) {
    const item = getResveratrolCase(draft.caseId), trial = getResveratrolTrial(draft);
    const index = RESVERATROL_CASES.findIndex(entry => entry.id === item.id);
    $('[data-rv-position]').textContent = `第 ${index + 1} / ${RESVERATROL_CASES.length} 站`;
    $('[data-rv-previous]').disabled = index <= 0;
    $('[data-rv-next]').disabled = index >= RESVERATROL_CASES.length - 1;
    const sources = RESVERATROL_SOURCES.filter(source => item.sourceIds.includes(source.id));
    $('[data-rv-stage]').innerHTML = `<p class="rv-station-label">${esc(item.title)}</p>
      <h4 id="${prefix}-question" class="rv-question" data-rv-question tabindex="-1">${esc(item.prompt)}</h4>
      <details class="rv-detail" data-rv-detail="conditions"><summary>本題條件與完整假設</summary>${paragraphs(item.context)}</details>
      <fieldset class="rv-options" aria-labelledby="${prefix}-question"><legend class="rv-sr-only">選一個判斷</legend>${item.options.map(option => `<label class="rv-option"><input type="radio" name="${prefix}-${esc(item.id)}" data-rv-choice value="${esc(option.id)}"${trial.current === option.id ? ' checked' : ''}><span>${esc(option.label)}</span></label>`).join('')}</fieldset>
      <label class="rv-reason" for="${prefix}-reason">核對前，我的理由（選填）<textarea id="${prefix}-reason" data-rv-reason rows="3" maxlength="800"${trial.checked ? ' readonly' : ''}>${textareaValue(trial.reason || '')}</textarea></label>
      <div class="rv-check-row"><button type="button" data-rv-check${!trial.current || trial.checked ? ' disabled' : ''}>${trial.checked ? '已保留核對時的判斷' : '保留判斷並核對'}</button><p class="rv-small">首次選擇與核對時理由會保留；核對後可改選並寫下修訂。</p></div>
      <section class="rv-feedback" data-rv-feedback aria-live="polite"${trial.checked ? '' : ' hidden'}>${trial.checked ? `<h5 data-rv-checked-status tabindex="-1"></h5><p data-rv-checked-feedback></p>${paragraphs(item.explanation)}<p class="rv-current-status" data-rv-current-status></p><label for="${prefix}-revision">對照後，我會保留、撤回或補上什麼？<textarea id="${prefix}-revision" data-rv-revision rows="3" maxlength="800">${textareaValue(trial.revision || '')}</textarea></label><details class="rv-detail" data-rv-detail="history"><summary>查看首次與核對時紀錄</summary><div class="rv-history" data-rv-history></div></details>` : ''}</section>
      <details class="rv-detail rv-sources" data-rv-detail="sources"><summary>本題來源與閱讀界線</summary>${sources.length ? sources.map(source => `<article>${/^https:\/\//.test(source.url) ? `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a>` : `<span>${esc(source.label)}</span>`}${paragraphs(source.scope)}</article>`).join('') : '<p>原創遷移情境，沒有新增研究來源；依前五站原理判讀。</p>'}</details>`;
    updateFeedback();
    restoreDetails();
    if (focus) $('[data-rv-question]')?.focus?.({preventScroll: true});
  }

  const changed = () => markWorkbenchChanged(record);
  const onInput = event => {
    if (disposed) return;
    const target = event.target, trial = getResveratrolTrial(draft);
    if (target.matches('[data-rv-reason]') && !trial.checked) trial.reason = target.value;
    else if (target.matches('[data-rv-revision]') && trial.checked) trial.revision = target.value;
    else if (target.matches('[data-rv-synthesis]')) draft.synthesis = target.value;
    else return;
    changed();
  };
  const onChange = event => {
    if (disposed || !event.target.matches('[data-rv-choice]')) return;
    flushText();
    chooseResveratrol(draft, event.target.value);
    const trial = getResveratrolTrial(draft);
    // Keep the native focused radio and its siblings while arrow keys change selection.
    $('[data-rv-check]').disabled = !trial.current || trial.checked;
    if (trial.checked) updateFeedback();
    changed();
  };
  const onClick = event => {
    if (disposed) return;
    const button = event.target.closest('button');
    if (!button || !root.contains(button) || button.disabled) return;
    if (button.matches('[data-rv-previous]') || button.matches('[data-rv-next]')) {
      const index = RESVERATROL_CASES.findIndex(item => item.id === draft.caseId);
      const next = RESVERATROL_CASES[index + (button.matches('[data-rv-next]') ? 1 : -1)];
      if (!next) return;
      flushText(); rememberDetails(); setResveratrolCase(draft, next.id); renderStage({focus: true}); changed();
    } else if (button.matches('[data-rv-check]')) {
      flushText(); rememberDetails();
      if (checkResveratrol(draft)) {
        renderStage(); changed();
        $('[data-rv-checked-status]')?.focus?.({preventScroll: true});
      }
    } else if (button.matches('[data-rv-save]')) {
      flushText(); changed(); saveWorkbenchSummary(record, onSaveSummary);
    }
  };
  const onToggle = event => {
    if (!disposed && event.target.matches('[data-rv-detail]')) draft.details[event.target.dataset.rvDetail] = event.target.open;
  };
  renderStage(); updateSaveStatus();
  const unsubscribe = subscribeWorkbench(record, updateSaveStatus);
  root.addEventListener('input', onInput); root.addEventListener('change', onChange);
  root.addEventListener('click', onClick); root.addEventListener('toggle', onToggle, true);
  return () => {
    if (disposed) return;
    flushText(); rememberDetails(); disposed = true; unsubscribe(); changed();
    root.removeEventListener('input', onInput); root.removeEventListener('change', onChange);
    root.removeEventListener('click', onClick); root.removeEventListener('toggle', onToggle, true);
  };
}
