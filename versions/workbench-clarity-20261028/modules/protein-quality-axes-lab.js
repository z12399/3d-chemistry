import {
  PROTEIN_QUALITY_AXES_ID, QUALITY_AXES_DATA, QUALITY_AXES_CASES, QUALITY_AXES_SOURCES,
  readQualityAxesPoint, createQualityAxesDraft, getQualityAxesCase, setQualityAxesControl,
  getQualityAxesTrial, canCheckQualityAxes, checkQualityAxes, parseQualityAxesAnswer, buildQualityAxesSummary
} from './protein-quality-axes-model.js';
import {createWorkbenchSessionStore, subscribeWorkbench, refreshWorkbenchFeedback, markWorkbenchChanged, saveWorkbenchSummary, escapeHtml as esc, textareaValue} from './workbench-session.js';
export {PROTEIN_QUALITY_AXES_ID} from './protein-quality-axes-model.js';
const sessions = createWorkbenchSessionStore({createDraft: createQualityAxesDraft, buildSummary: buildQualityAxesSummary});
let instance = 0;

export function mountProteinQualityAxesLab(container, id = PROTEIN_QUALITY_AXES_ID, options = {}) {
  if (id !== PROTEIN_QUALITY_AXES_ID) throw new RangeError('Unsupported quality-axes activity');
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const {draftOwner, draftKey = id, onSaveSummary} = options, owner = draftOwner && ['object', 'function'].includes(typeof draftOwner) ? draftOwner : container;
  const record = sessions.get(owner, draftKey), draft = record.draft, prefix = `pqa-${++instance}`;
  refreshWorkbenchFeedback(record); let disposed = false;
  container.innerHTML = `<section class="protein-quality-axes-lab" data-pqa-lab aria-labelledby="${prefix}-title">
    <header><h3 id="${prefix}-title">同一資料，換一把刻度尺</h3><p>先找符號與單位，再分開讀值、營養指標和原因。</p></header>
    <p class="pqa-origin"><strong>本課原創讀圖資料：</strong>四個等級不代表真實溫度或時間；○／□僅為本課圖例，不是官方原圖或文獻數據。</p>
    <label class="pqa-case" for="${prefix}-case">選一個判讀任務<select id="${prefix}-case" data-pqa-case>${QUALITY_AXES_CASES.map(item => `<option value="${item.id}">${esc(item.title)}</option>`).join('')}</select></label>
    <div class="pqa-controls" data-pqa-controls>
      <label for="${prefix}-level">處理等級<select id="${prefix}-level" data-pqa-level>${QUALITY_AXES_DATA.map(row => `<option value="${row.level}">${row.level}</option>`).join('')}</select></label>
      <label for="${prefix}-series">要讀哪一個系列<select id="${prefix}-series" data-pqa-series><option value="tia">○ 相對抑制活性</option><option value="per">□ PER</option></select></label>
      <label for="${prefix}-max">右軸上限（PER，g／g）<select id="${prefix}-max" data-pqa-right-max><option value="3">3</option><option value="6">6</option></select></label>
    </div>
    <div data-pqa-table></div><section class="pqa-stage" data-pqa-stage></section>
    <details data-pqa-detail="synthesis"><summary>整合成自己的短答</summary><label for="${prefix}-synthesis">先讀對什麼，才有資格推論什麼？<textarea id="${prefix}-synthesis" data-pqa-synthesis rows="4" maxlength="1600">${textareaValue(draft.synthesis)}</textarea></label></details>
    <details data-pqa-scope data-pqa-detail="scope"><summary>假設、原始指定值與來源界線</summary><p>只做數值投影：規格化高度＝數值／該系列軸上限，底部0、頂部1。左軸固定0–100%；右軸選0–3或0–6 g／g。兩個高度各有不同分母，不能當相同物理量。</p><p>指定表：等級0／1／2／3，○＝100／55／20／8%，□＝1.2／1.8／2.1／2.1 g／g。讀表練習可查原始值，不作盲測或考試分數。</p>${QUALITY_AXES_SOURCES.map(source => `<p><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a><br>${esc(source.scope)}</p>`).join('')}</details>
    <div class="pqa-save-row"><button type="button" data-pqa-save>附加作答與修訂到本課筆記</button><p data-pqa-save-status role="status"></p></div>
    <p class="pqa-small">切換條件各留有限題目槽；初答在首次核對時固定。草稿限本頁工作階段，成功附加的摘要才隨本課筆記匯出；不重建未保存盤面。</p>
  </section>`;
  const root = container.querySelector('[data-pqa-lab]'), $ = selector => root.querySelector(selector);
  const detailState = () => root.querySelectorAll('[data-pqa-detail]').forEach(node => { draft.details[node.dataset.pqaDetail] = node.open; });
  const restoreDetails = () => root.querySelectorAll('[data-pqa-detail]').forEach(node => { node.open = Boolean(draft.details[node.dataset.pqaDetail]); });
  function flushText() {
    const trial = getQualityAxesTrial(draft), response = $('[data-pqa-answer]'), reason = $('[data-pqa-reason]'), revision = $('[data-pqa-revision]');
    if (response) trial.response = response.value;
    if (reason && !trial.checked) trial.reason = reason.value;
    if (revision && trial.checked) trial.revision = revision.value;
    draft.synthesis = $('[data-pqa-synthesis]').value;
  }
  function updateSave() { if (disposed) return; $('[data-pqa-save]').disabled = Boolean(record.pending); $('[data-pqa-save-status]').textContent = record.message; }
  function tableHTML() {
    return `<div class="pqa-table-scroll"><table><caption>○ 左軸：相對抑制活性%；□ 右軸：PER，g增重／g蛋白。下列是規格化高度，不是兩種原值。</caption><thead><tr><th scope="col">等級</th><th scope="col">○ 高度（左軸上限100）</th><th scope="col">□ 高度（右軸上限${draft.rightMax}）</th></tr></thead><tbody>${QUALITY_AXES_DATA.map(row => `<tr${row.level === draft.level ? ' class="pqa-selected-row"' : ''}><th scope="row">${row.level}</th><td>${readQualityAxesPoint(row.level, 'tia', draft.rightMax).height.toFixed(4)}</td><td>${readQualityAxesPoint(row.level, 'per', draft.rightMax).height.toFixed(4)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function feedbackHTML(trial) {
    if (!trial.checkedSnapshot) return '';
    const s = trial.checkedSnapshot;
    return `<h4 data-pqa-feedback-heading tabindex="-1">${s.correct ? '核對時的判讀符合這組資料。' : '核對時的判讀需要修訂。'}</h4><p>${esc(s.explanation)}</p><p data-pqa-current-status></p><label for="${prefix}-revision">對照後，我會保留或撤回什麼？<textarea id="${prefix}-revision" data-pqa-revision rows="3" maxlength="900">${textareaValue(trial.revision)}</textarea></label><details data-pqa-detail="history"><summary>看初答與核對條件</summary><div class="pqa-history" data-pqa-history><p>首次核對：${esc(s.caseId)}；等級${s.level}；${esc(s.series)}；右軸上限${s.rightMax}</p><p>初答文字：${esc(s.response || '未填數值')}；選項：${esc(s.choice || '未選單位')}</p><p>核對時理由：${esc(s.reason || '未填')}</p></div></details>`;
  }
  function updateCurrent() {
    const trial = getQualityAxesTrial(draft), node = $('[data-pqa-current-status]'); if (!node || !trial.checkedSnapshot) return;
    const s = trial.checkedSnapshot;
    node.textContent = trial.response === s.response && trial.choice === s.choice ? '目前答案與首次核對相同；文字修訂不自動評分。' : '目前答案已改動；上方仍是首次核對結果，改選不會倒改原答。';
  }
  function updateCheck() {
    const trial = getQualityAxesTrial(draft), item = getQualityAxesCase(draft.caseId);
    $('[data-pqa-check]').disabled = trial.checked || !canCheckQualityAxes(draft);
    const error = $('[data-pqa-error]'), input = $('[data-pqa-answer]');
    if (item.answerType === 'numeric' && input) { const bad = Boolean(trial.response.trim()) && parseQualityAxesAnswer(trial.response) === null; error.textContent = bad ? '請輸入非負的有限十進位數字；原輸入仍保留，沒有當成0。' : ''; input.setAttribute('aria-invalid', String(bad)); }
    updateCurrent();
  }
  function renderStage({focus = false} = {}) {
    const item = getQualityAxesCase(draft.caseId), trial = getQualityAxesTrial(draft);
    $('[data-pqa-case]').value = draft.caseId; $('[data-pqa-level]').value = String(draft.level); $('[data-pqa-series]').value = draft.series; $('[data-pqa-right-max]').value = String(draft.rightMax);
    $('[data-pqa-controls]').hidden = !['reading', 'scale'].includes(draft.caseId);
    $('[data-pqa-table]').hidden = draft.caseId === 'percalc'; $('[data-pqa-table]').innerHTML = tableHTML();
    const scale = draft.caseId === 'scale' ? `<p class="pqa-comparison">同一${draft.series === 'tia' ? '○' : '□'}、等級${draft.level}：上限3時高度 ${readQualityAxesPoint(draft.level, draft.series, 3).height.toFixed(4)}；上限6時高度 ${readQualityAxesPoint(draft.level, draft.series, 6).height.toFixed(4)}。</p>` : '';
    $('[data-pqa-stage]').innerHTML = `<h4 id="${prefix}-question" data-pqa-question tabindex="-1">${esc(item.prompt)}</h4>${scale}${item.answerType === 'numeric' ? `<label for="${prefix}-answer">我的讀值${item.id === 'percalc' ? '（g／g）' : ''}<input type="text" inputmode="decimal" id="${prefix}-answer" data-pqa-answer value="${esc(trial.response)}" autocomplete="off"></label><p class="pqa-error" data-pqa-error role="status"></p>` : '<p data-pqa-error role="status"></p>'}${item.options.length ? `<fieldset aria-labelledby="${prefix}-question"><legend>${item.answerType === 'numeric' ? '讀值的單位' : '選一個判讀'}</legend>${item.options.map(option => `<label class="pqa-choice"><input type="radio" name="${prefix}-${item.id}" data-pqa-choice value="${option.id}"${trial.choice === option.id ? ' checked' : ''}><span>${esc(option.label)}</span></label>`).join('')}</fieldset>` : ''}<label for="${prefix}-reason">核對前理由（選填）<textarea id="${prefix}-reason" data-pqa-reason rows="3" maxlength="900"${trial.checked ? ' readonly' : ''}>${textareaValue(trial.reason)}</textarea></label><button type="button" data-pqa-check${trial.checked ? ' disabled' : ''}>${trial.checked ? '已保留首次核對' : '保留初答並核對'}</button><section class="pqa-feedback" data-pqa-feedback aria-live="polite"${trial.checked ? '' : ' hidden'}>${feedbackHTML(trial)}</section>`;
    restoreDetails(); updateCheck(); if (focus) $('[data-pqa-question]')?.focus?.({preventScroll: true});
  }
  const changed = () => markWorkbenchChanged(record);
  const onInput = event => {
    if (disposed) return; const target = event.target, trial = getQualityAxesTrial(draft);
    if (target.matches('[data-pqa-answer]')) trial.response = target.value;
    else if (target.matches('[data-pqa-reason]') && !trial.checked) trial.reason = target.value;
    else if (target.matches('[data-pqa-revision]') && trial.checked) trial.revision = target.value;
    else if (target.matches('[data-pqa-synthesis]')) draft.synthesis = target.value; else return;
    updateCheck(); changed();
  };
  const onChange = event => {
    if (disposed) return; const target = event.target;
    if (target.matches('[data-pqa-choice]')) { flushText(); getQualityAxesTrial(draft).choice = target.value; updateCheck(); changed(); return; }
    const controls = [['[data-pqa-case]', 'caseId'], ['[data-pqa-level]', 'level'], ['[data-pqa-series]', 'series'], ['[data-pqa-right-max]', 'rightMax']];
    const selected = controls.find(([selector]) => target.matches(selector)); if (!selected) return;
    flushText(); detailState(); const key = selected[1]; setQualityAxesControl(draft, key, ['level', 'rightMax'].includes(key) ? Number(target.value) : target.value); renderStage(); changed();
  };
  const onClick = event => {
    if (disposed) return; const button = event.target.closest('button'); if (!button || !root.contains(button) || button.disabled) return;
    if (button.matches('[data-pqa-check]')) { flushText(); detailState(); if (checkQualityAxes(draft)) { renderStage(); changed(); $('[data-pqa-feedback-heading]')?.focus?.({preventScroll: true}); } }
    else if (button.matches('[data-pqa-save]')) { flushText(); changed(); saveWorkbenchSummary(record, onSaveSummary); }
  };
  const onToggle = event => { if (!disposed && event.target.matches('[data-pqa-detail]')) draft.details[event.target.dataset.pqaDetail] = event.target.open; };
  renderStage(); updateSave(); const unsubscribe = subscribeWorkbench(record, updateSave);
  root.addEventListener('input', onInput); root.addEventListener('change', onChange); root.addEventListener('click', onClick); root.addEventListener('toggle', onToggle, true);
  return () => { if (disposed) return; flushText(); detailState(); disposed = true; unsubscribe(); changed(); root.removeEventListener('input', onInput); root.removeEventListener('change', onChange); root.removeEventListener('click', onClick); root.removeEventListener('toggle', onToggle, true); };
}
