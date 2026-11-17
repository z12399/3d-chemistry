import {
  BROWNING_COMPARISON_ID, BROWNING_CASES, BROWNING_PREDICTIONS, BROWNING_SOURCES,
  getBrowningCase, getBrowningIntervention, evaluateBrowningComparison,
  createBrowningDraft, setBrowningCase, setBrowningIntervention, getBrowningTrial,
  chooseBrowningPrediction, checkBrowningPrediction, buildBrowningSummary
} from './browning-comparison-model.js';
import {
  createWorkbenchSessionStore, subscribeWorkbench, markWorkbenchChanged,
  refreshWorkbenchFeedback, saveWorkbenchSummary, escapeHtml as esc, textareaValue
} from './workbench-session.js';

export {BROWNING_COMPARISON_ID} from './browning-comparison-model.js';
const drafts = createWorkbenchSessionStore({createDraft: createBrowningDraft, buildSummary: buildBrowningSummary});
let instance = 0;
const predictionLabel = value => BROWNING_PREDICTIONS.find(row => row.id === value)?.label || '尚未選擇';
const sourceLink = source => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a>`;
const routeHTML = (steps, variant = '') => `<ol class="bc-route ${variant}">${steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>`;

export function mountBrowningComparisonLab(container, id = BROWNING_COMPARISON_ID, options = {}) {
  if (id !== BROWNING_COMPARISON_ID) throw new RangeError(`Unsupported browning lab: ${id}`);
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const {draftOwner, draftKey = id, onSaveSummary} = options;
  const owner = draftOwner && ['object', 'function'].includes(typeof draftOwner) ? draftOwner : container;
  const record = drafts.get(owner, draftKey), state = record.draft;
  refreshWorkbenchFeedback(record);
  const prefix = `bc-${++instance}`;
  let disposed = false;

  container.innerHTML = `<section class="browning-comparison-lab" data-bc-lab="${esc(id)}" aria-labelledby="${prefix}-title">
    <header><p class="bc-kicker">條件對照</p><h3 id="${prefix}-title">改一個條件，哪一步還能走？</h3><p>先看反應入口，再選控制方法；同樣變褐，不代表同一機制。</p></header>
    <div class="bc-controls">
      <label for="${prefix}-case">選食品情境<select id="${prefix}-case" data-bc-case>${BROWNING_CASES.map(item => `<option value="${item.id}">${esc(item.label)}</option>`).join('')}</select></label>
      <label for="${prefix}-intervention">只改這項<select id="${prefix}-intervention" data-bc-intervention></select></label>
    </div>
    <p class="bc-principle" data-bc-principle></p>
    <button type="button" class="bc-apply" data-bc-apply aria-pressed="false" aria-controls="${prefix}-stage">套用對照變更</button>
    <p class="bc-change" data-bc-change aria-live="polite"></p>
    <div id="${prefix}-stage" data-bc-stage></div>
    <details class="bc-detail" data-bc-detail="quality"><summary>食品品質與控制方法</summary><div data-bc-quality></div></details>
    <details class="bc-detail" data-bc-detail="conditions"><summary>這次固定了什麼？還要量什麼？</summary><div data-bc-conditions></div></details>
    <details class="bc-detail" data-bc-detail="notes"><summary>我的觀察與本課筆記</summary>
      <label for="${prefix}-observation">記下一個改變判斷的對照<textarea id="${prefix}-observation" data-bc-observation rows="3" maxlength="2000">${textareaValue(state.observation)}</textarea></label>
      <div class="bc-save"><button type="button" data-bc-save>附加比較與修訂到本課筆記</button><p data-bc-save-status role="status"></p></div>
      <p class="bc-small">包含首次選擇、核對時理由與後續修訂。草稿留在目前工作階段；附加失敗可重試。</p>
    </details>
    <details class="bc-detail" data-bc-detail="sources"><summary>來源與推論範圍</summary><p>這是依文獻原理建立的條件對照，不是本頁實測或食品反應速率模擬。沒有計算色差、產率或各機制的貢獻。</p>${BROWNING_SOURCES.map(source => `<p>${sourceLink(source)}<br><span class="bc-small">${esc(source.locator)}</span></p>`).join('')}</details>
  </section>`;
  const root = container.querySelector('.browning-comparison-lab'), $ = selector => root.querySelector(selector);

  function flushText() {
    const trial = getBrowningTrial(state), reason = $('[data-bc-reason]'), revision = $('[data-bc-revision]');
    if (reason && !trial.checked) trial.reason = reason.value;
    if (revision && trial.checked) trial.revision = revision.value;
    const note = $('[data-bc-observation]'); if (note) state.observation = note.value;
  }
  function restoreDetails() {
    root.querySelectorAll('[data-bc-detail]').forEach(detail => { detail.open = Boolean(state.details[detail.dataset.bcDetail]); });
  }
  function renderStage() {
    const item = getBrowningCase(state.caseId), action = getBrowningIntervention(state.caseId, state.interventionId);
    const trial = getBrowningTrial(state), view = evaluateBrowningComparison(state.caseId, state.interventionId, state.applied);
    const revealed = state.applied && trial.checked;
    $('[data-bc-principle]').textContent = item.principle;
    const apply = $('[data-bc-apply]'); apply.setAttribute('aria-pressed', String(state.applied));
    apply.textContent = state.applied ? '已套用；點此回到原條件' : `套用：${action.label}`;
    $('[data-bc-change]').textContent = view.change;
    $('[data-bc-stage]').innerHTML = `<div class="bc-comparison" aria-label="原條件與單一變更對照">
      <section class="bc-card"><h4>原條件</h4><ul class="bc-conditions-list">${view.conditions.map(line => `<li>${esc(line)}</li>`).join('')}</ul>${routeHTML(action.baselinePath || item.path)}</section>
      <section class="bc-card ${state.applied ? 'bc-changed' : ''}"><h4>${state.applied ? '只改一個條件' : '對照組尚未改變'}</h4><p class="bc-change-chip">${esc(view.change)}</p>${!state.applied ? routeHTML(action.baselinePath || item.path) : revealed ? routeHTML(view.path, action.verdict === 'blocked' ? 'bc-route-blocked' : action.verdict === 'uncertain' ? 'bc-route-unknown' : '') : '<p class="bc-unrevealed">先留下判斷，再核對這一步。</p>'}</section>
    </div>
    <fieldset class="bc-prediction"${state.applied ? '' : ' disabled'}><legend>${esc(action.question)}</legend>
      ${BROWNING_PREDICTIONS.map(option => `<label class="bc-choice"><input type="radio" name="${prefix}-prediction" value="${option.id}" data-bc-prediction${trial.current === option.id ? ' checked' : ''}><span>${esc(option.label)}</span></label>`).join('')}
      ${trial.checked ? '' : `<details class="bc-detail bc-reason-detail" data-bc-detail="reason"><summary>寫下核對前的理由（選填）</summary><label for="${prefix}-reason">我依據的條件<textarea id="${prefix}-reason" data-bc-reason rows="2" maxlength="1500">${textareaValue(trial.reason)}</textarea></label></details>`}
      <button type="button" data-bc-check${!state.applied || !trial.current || trial.checked ? ' disabled' : ''}>${trial.checked ? '已核對；可修訂目前判斷' : '保留預判並核對'}</button>
      <p class="bc-small">${state.applied ? '首次選擇會保留；核對後修訂不會覆寫它。' : '先套用上方的一項變更，再作預判。'}</p>
    </fieldset>
    <div class="bc-feedback" data-bc-feedback aria-live="polite">${revealed ? `<p class="bc-result-title">${esc(action.heading)}</p><p>${esc(action.explanation)}</p><p class="bc-answer-status">${trial.current === action.verdict ? '目前判斷符合這組條件。' : '目前判斷仍需修正；請對照上方被改變的條件。'}</p>
      <details class="bc-detail" data-bc-detail="revision"><summary>查看首次紀錄與留下修訂</summary><p class="bc-history">首次：${esc(predictionLabel(trial.first))}<br>核對時：${esc(predictionLabel(trial.checkedSelection))}<br>核對時理由：${esc(trial.checkedReason || '未填')}<br>核對後目前：${esc(predictionLabel(trial.current))}</p><label for="${prefix}-revision">保留、撤回或修正的理由<textarea id="${prefix}-revision" data-bc-revision rows="3" maxlength="2000">${textareaValue(trial.revision)}</textarea></label></details>` : ''}</div>`;
    $('[data-bc-quality]').innerHTML = `<p><strong>品質目標：</strong>${esc(item.quality)}</p><p><strong>控制位置：</strong>${esc(item.control)}</p>`;
    $('[data-bc-conditions]').innerHTML = `<p>${esc(item.scope)}</p><p><strong>此對照還要核對：</strong>${esc(action.evidence)}</p><p>真實處理常同時改變多個條件；若用加熱、酸化或配方替換，需另外檢查基質、pH、水分與起始產物。單一顏色、HMF 或糠醛不足以唯一指認機制。</p>`;
    restoreDetails();
  }
  function renderControls() {
    const item = getBrowningCase(state.caseId);
    $('[data-bc-case]').value = state.caseId;
    $('[data-bc-intervention]').innerHTML = item.interventions.map(action => `<option value="${action.id}">${esc(action.label)}</option>`).join('');
    $('[data-bc-intervention]').value = state.interventionId;
    renderStage();
  }
  function updateSaveStatus() {
    if (disposed) return;
    $('[data-bc-save-status]').textContent = record.message;
    $('[data-bc-save]').disabled = Boolean(record.pending);
  }
  const changed = () => markWorkbenchChanged(record);
  const onChange = event => {
    if (disposed) return;
    const target = event.target;
    if (target.matches('[data-bc-case]')) { flushText(); setBrowningCase(state, target.value); renderControls(); }
    else if (target.matches('[data-bc-intervention]')) { flushText(); setBrowningIntervention(state, target.value); renderStage(); }
    else if (target.matches('[data-bc-prediction]')) {
      flushText(); chooseBrowningPrediction(state, target.value);
      // Do not replace the focused radio while using keyboard arrows.
      const trial = getBrowningTrial(state), action = getBrowningIntervention(state.caseId, state.interventionId);
      $('[data-bc-check]').disabled = !state.applied || !trial.current || trial.checked;
      if (trial.checked) {
        const status = $('.bc-answer-status'); if (status) status.textContent = trial.current === action.verdict ? '目前判斷符合這組條件。' : '目前判斷仍需修正；請對照上方被改變的條件。';
        const history = $('.bc-history'); if (history) history.innerHTML = `首次：${esc(predictionLabel(trial.first))}<br>核對時：${esc(predictionLabel(trial.checkedSelection))}<br>核對時理由：${esc(trial.checkedReason || '未填')}<br>核對後目前：${esc(predictionLabel(trial.current))}`;
      }
    } else return;
    changed();
  };
  const onInput = event => {
    if (disposed) return;
    const target = event.target, trial = getBrowningTrial(state);
    if (target.matches('[data-bc-reason]') && !trial.checked) trial.reason = target.value;
    else if (target.matches('[data-bc-revision]') && trial.checked) trial.revision = target.value;
    else if (target.matches('[data-bc-observation]')) state.observation = target.value;
    else return;
    changed();
  };
  const onClick = event => {
    if (disposed) return;
    const button = event.target.closest('button'); if (!button || !root.contains(button)) return;
    if (button.matches('[data-bc-apply]')) { flushText(); state.applied = !state.applied; renderStage(); changed(); }
    else if (button.matches('[data-bc-check]')) {
      flushText(); if (checkBrowningPrediction(state)) { renderStage(); changed(); }
    } else if (button.matches('[data-bc-save]')) {
      flushText(); changed(); saveWorkbenchSummary(record, onSaveSummary);
    }
  };
  const onToggle = event => {
    if (!disposed && event.target.matches('[data-bc-detail]')) state.details[event.target.dataset.bcDetail] = event.target.open;
  };
  renderControls(); updateSaveStatus();
  const unsubscribe = subscribeWorkbench(record, updateSaveStatus);
  root.addEventListener('change', onChange); root.addEventListener('input', onInput);
  root.addEventListener('click', onClick); root.addEventListener('toggle', onToggle, true);
  return () => {
    if (disposed) return;
    flushText();
    root.querySelectorAll('[data-bc-detail]').forEach(detail => { state.details[detail.dataset.bcDetail] = detail.open; });
    changed(); disposed = true; unsubscribe();
    root.removeEventListener('change', onChange); root.removeEventListener('input', onInput);
    root.removeEventListener('click', onClick); root.removeEventListener('toggle', onToggle, true);
  };
}
