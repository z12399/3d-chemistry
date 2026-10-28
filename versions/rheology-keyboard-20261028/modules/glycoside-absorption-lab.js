import {
  GLYCOSIDE_ABSORPTION_ID, GLYCOSIDE_CASES, HUMAN_STUDY, METRICS, QUESTIONS, SOURCES,
  getGlycosideCase, humanMetricRows, chooseGlycosideAnswer, checkGlycosideAnswer,
  createGlycosideSessionStore, subscribeGlycosideSession, saveGlycosideSummary,
  markGlycosideDraftChanged, refreshGlycosideSaveFeedback
} from './glycoside-absorption-model.js';

export {GLYCOSIDE_ABSORPTION_ID} from './glycoside-absorption-model.js';
const drafts = createGlycosideSessionStore();
let instance = 0;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = (value, decimals = 0) => value.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
const sourceLink = source => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a>`;
const token = (text, kind = '') => `<span class="ga-token ${kind}">${text}</span>`;

// The HTML parser consumes one immediate LF after <textarea>; protect the draft's own first LF.
export const encodeGlycosideTextareaDraft = value => `\n${esc(value)}`;

function substrateGlyph(selected) {
  return `<span class="ga-molecule" aria-label="${esc(selected.name)} 的連接示意">${token('Q', 'ga-q')}<span class="ga-link">— O —</span>${token('Glc', 'ga-sugar')}${selected.sugars.length > 1 ? `<span class="ga-link">—</span>${token('Rha', 'ga-sugar')}` : ''}</span>`;
}

function mechanismHTML(draft) {
  const selected = getGlycosideCase(draft.caseId), revealed = draft.phase === 'after';
  const result = !revealed ? '先看糖接在哪裡，再揭示 LPH 的體外反應觀察。' : selected.hydrolysed ? '所測體外條件下：觀察到水解' : '所測體外條件下：未觀察到水解';
  const product = revealed && selected.hydrolysed
    ? `<span class="ga-molecule" aria-label="水解後：槲皮素與葡萄糖">${token('Q', 'ga-q')}<span class="ga-link">＋</span>${token('Glc', 'ga-sugar')}</span>`
    : substrateGlyph(selected);
  return `<p class="ga-result-title">${esc(result)}</p>
    <div class="ga-reaction"><div class="ga-reaction-card"><h4>反應前</h4>${substrateGlyph(selected)}<p>${esc(selected.position)}</p></div>
    <div class="ga-reaction-card ga-after"><h4>${revealed ? '加入 LPH 後的觀察' : '結果尚未揭示'}</h4>${revealed ? product : '<p class="ga-unrevealed">選「揭示反應結果」查看。</p>'}<p>${!revealed ? '不由結構單獨填入人體吸收量。' : selected.hydrolysed ? '糖苷連接被水解，形成苷元 Q 與糖。' : '保留原糖苷；這不等於人體吸收為零。'}</p></div></div>
    <p class="ga-legend">Q＝槲皮素骨架；Glc＝葡萄糖；Rha＝鼠李糖。連接示意，非完整分子結構。${revealed && selected.hydrolysed ? '水解產物示意不表示 100% 轉化或人體速率。' : ''}</p>
    <p class="ga-mechanism">糖的連接影響酵素辨識。${revealed && selected.hydrolysed ? 'Day 等提出，去醣後較疏水的苷元可被動擴散入胞，是一條可能路徑。' : '比較三種連接與各自的 LPH 觀察，不能只由「都有糖」預測相同反應。'}</p>
    <p class="ga-boundary">${selected.hydrolysed ? '這是純化羊小腸 LPH 的體外證據，不能直接換成人體生物利用率。' : '腸菌轉化要另看離體或人體證據；底物消失也不能全部算成苷元吸收。'}</p>`;
}

function humanHTML(metricId) {
  const metric = METRICS[metricId], rows = humanMetricRows(metricId), max = Math.max(...rows.map(row => row.mean));
  const tableLabel = metricId === 'relative' ? '均值比估算（%）' : `${metric.label}（${metric.unit}）`;
  return `<p class="ga-result-title">${esc(metric.label)}${metricId === 'relative' ? '：均值比估算' : '：刊載均值'}</p>
    <ul class="ga-bars" aria-label="${esc(metric.label)}均值比較">${rows.map(row => `<li><div class="ga-bar-label"><strong>${esc(row.label)}</strong><span>${fmt(row.mean, metric.decimals)} ${esc(metric.unit)}</span></div><div class="ga-bar-track" aria-hidden="true"><span style="width:${row.mean / max * 100}%"></span></div></li>`).join('')}</ul>
    <p class="ga-chart-note">長條只表示${metricId === 'relative' ? '均值比估算' : '均值'}，不是濃度—時間曲線。${metricId === 'relative' ? '沒有配對個別值，不新增誤差棒。' : '原研究 SD 列於下表。'}</p>
    <table class="ga-table"><caption>同一批 9 人；劑量為 Table 2 的 mean ± SD${metricId === 'relative' ? '，右欄另以均值計算' : '，右欄為 Table 1 的 mean ± SD'}</caption><colgroup><col class="ga-col-food"><col class="ga-col-dose"><col class="ga-col-value"></colgroup><thead><tr><th scope="col">條件</th><th scope="col">劑量<br>μmol</th><th scope="col">${esc(tableLabel)}</th></tr></thead><tbody>${rows.map(row => `<tr><th scope="row">${esc(row.label)}<small>${esc(row.food)}</small></th><td>${fmt(row.doseMean)} ± ${fmt(row.doseSD)}</td><td>${fmt(row.mean, metric.decimals)}${row.sd === null ? '<small>未估 SD／CI</small>' : ` ± ${fmt(row.sd, metric.decimals)}`}</td></tr>`).join('')}</tbody></table>
    <p class="ga-boundary" data-ga-metric-note>${esc(metric.note)}</p>
    ${metricId === 'relative' ? '<p class="ga-formula">(該組 AUC 均值 ÷ 該組劑量均值) ÷ (洋蔥 AUC 均值 ÷ 洋蔥劑量均值) × 100</p><p>蘋果約 31.5%、rutin 約 28.7%；原文概述約 30%。這些是均值比估算，100% 表示比較基準，並非完全吸收。</p>' : ''}
    <p class="ga-measurement">量測：${esc(HUMAN_STUDY.measurement)}。不代表完整糖苷、游離槲皮素或所有代謝物總量。</p>`;
}

function exercisesHTML(prefix, draft) {
  return QUESTIONS.map((question, i) => {
    const answer = draft.answers[question.id];
    return `<fieldset class="ga-question" data-ga-question="${question.id}"><legend>${i + 1}. ${esc(question.prompt)}</legend>
      ${question.options.map(option => `<label class="ga-choice"><input type="radio" name="${prefix}-${question.id}" value="${option.id}" data-ga-answer="${question.id}"${answer.current === option.id ? ' checked' : ''}><span>${esc(option.label)}</span></label>`).join('')}
      <button type="button" data-ga-check="${question.id}">核對這題</button><div class="ga-feedback" data-ga-feedback="${question.id}" aria-live="polite"></div></fieldset>`;
  }).join('');
}

export function mountGlycosideAbsorptionLab(container, id = GLYCOSIDE_ABSORPTION_ID, options = {}) {
  if (id !== GLYCOSIDE_ABSORPTION_ID) throw new RangeError(`Unsupported glycoside lab: ${id}`);
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const {draftOwner, draftKey = id, onSaveSummary} = options;
  const owner = draftOwner && ['object', 'function'].includes(typeof draftOwner) ? draftOwner : container;
  const record = drafts.get(owner, draftKey), state = record.draft;
  refreshGlycosideSaveFeedback(record);
  const prefix = `ga-${++instance}`;
  let disposed = false;

  container.innerHTML = `<section class="glycoside-lab" data-ga-lab="${esc(id)}" aria-labelledby="${prefix}-title">
    <header class="ga-head"><p class="ga-kicker">動手比較</p><h3 id="${prefix}-title">糖接在哪裡，會改變吸收嗎？</h3><p>把酵素能否水解，與人吃下食物後的血漿量測分開比較。</p></header>
    <div class="ga-view-switch" role="group" aria-label="選擇證據層次"><button type="button" data-ga-view="mechanism" aria-controls="${prefix}-mechanism">1　酵素與糖苷</button><button type="button" data-ga-view="human" aria-controls="${prefix}-human">2　人體比較</button></div>
    <section class="ga-panel" id="${prefix}-mechanism" data-ga-panel="mechanism" aria-label="酵素與糖苷證據">
      <label class="ga-control" for="${prefix}-case"><span>糖苷個案</span><select id="${prefix}-case" data-ga-case>${GLYCOSIDE_CASES.map(item => `<option value="${item.id}">${esc(item.label)}</option>`).join('')}</select></label>
      <fieldset class="ga-phase"><legend>對照反應前後</legend><label><input type="radio" name="${prefix}-phase" value="before" data-ga-phase><span>先看起始物</span></label><label><input type="radio" name="${prefix}-phase" value="after" data-ga-phase><span>揭示反應結果</span></label></fieldset>
      <div class="ga-results" data-ga-mechanism-result aria-live="polite"></div>
      <details class="ga-detail" data-ga-detail="location"><summary>LPH 在哪裡？CBG 能解釋什麼？</summary><div class="ga-compartments"><div><strong>腸腔側</strong><p>LPH 位於小腸刷狀緣，作用端朝向腸腔；圖中水解觀察來自純化羊小腸酵素。</p></div><div class="ga-brush-border">刷狀緣／細胞膜</div><div><strong>腸細胞內</strong><p>CBG 是胞內酵素。若用它解釋完整糖苷水解，仍需先交代完整糖苷如何入胞。</p></div></div><p>CBG 的胞內位置不是跨膜入口證據；與 SGLT1 互動也不等於已證實被它運輸。途徑與貢獻依底物和研究模型而異。</p><p>${sourceLink(SOURCES.day2000)}</p></details>
      <details class="ga-detail" data-ga-detail="rutin"><summary>Rutin 在 LPH 試驗未水解，後面還有哪些問題？</summary><p>另項離體研究中，9 位供體的糞便菌體可由 rutin 釋出槲皮素，但底物與苷元的回收不完整。這不能直接定量供體在人體內的吸收，也不能推成所有菌株都能轉化。</p><p>腸菌處理與後續分解需要各自證據；本工作台沒有替未量測部分補值或指定人體貢獻。</p><p>${sourceLink(SOURCES.amaretti2015)}</p></details>
    </section>
    <section class="ga-panel" id="${prefix}-human" data-ga-panel="human" aria-label="人體研究比較" hidden>
      <label class="ga-control" for="${prefix}-metric"><span>想比較哪個量？</span><select id="${prefix}-metric" data-ga-metric>${Object.entries(METRICS).map(([key, value]) => `<option value="${key}">${esc(value.label)}</option>`).join('')}</select></label>
      <div class="ga-results" data-ga-human-result aria-live="polite"></div>
      <details class="ga-detail" data-ga-detail="study"><summary>食物、糖種和分析方法，哪些沒有被分開？</summary><p>Hollman 1997 讓同一批 9 人以隨機順序攝取煎洋蔥、蘋果泥加蘋果皮、純 rutin 膠囊。三組食品基質、糖種與劑量不同，並非一次只改一個因子的比較。</p><p>血漿先酸水解，再測可回收的槲皮素當量；不含不能水解的甲基化代謝物。此結果不能改標成完整糖苷、游離槲皮素或所有代謝物總量。</p><p>AUC 是指定時間窗的血漿暴露指標；Tmax 較晚不能單獨證明大腸吸收。這些差異也不是健康效益排名。</p><p>${sourceLink(SOURCES.hollman1997)}</p></details>
    </section>
    <details class="ga-detail" data-ga-detail="practice"><summary>檢查自己的判讀（3 題）</summary><p>首次選擇會保留。核對後可修改目前答案，原選擇不會被覆寫。</p><div data-ga-questions>${exercisesHTML(prefix, state)}</div></details>
    <details class="ga-detail" data-ga-detail="notes"><summary>我的觀察與本課筆記（選填）</summary><label class="ga-control" for="${prefix}-observation"><span>寫下一個改變想法的觀察，或還缺的證據</span><textarea id="${prefix}-observation" data-ga-observation rows="3" maxlength="2000">${encodeGlycosideTextareaDraft(state.observation)}</textarea></label><div class="ga-save"><button type="button" data-ga-save>附加目前比較到本課筆記</button><p data-ga-save-status role="status"></p></div><p class="ga-chart-note">包含個案、人體比較、首次與核對後答案。失敗可重試；同一份內容不會重複附加。</p></details>
    <details class="ga-detail" data-ga-detail="sources"><summary>量測界線與來源</summary><ul><li>機制圖只表示連接，不是完整分子結構或跨膜路徑。</li><li>Day 2000 使用純化羊小腸 LPH；所測條件下的未水解，不等於人體零吸收。</li><li>原數據為 mean ± SD；均值比估算沒有配對個別資料，不新增 SD、信賴區間或 p 值。</li><li>劑量校正的相對暴露不能當絕對吸收率，也不能當健康效益。</li></ul>${Object.values(SOURCES).map(source => `<p>${sourceLink(source)}<br><small>${esc(source.locator)}</small></p>`).join('')}</details>
  </section>`;

  const root = container.querySelector('.glycoside-lab'), $ = selector => root.querySelector(selector);
  function updatePanel() {
    root.querySelectorAll('[data-ga-panel]').forEach(panel => { panel.hidden = panel.dataset.gaPanel !== state.panel; });
    root.querySelectorAll('[data-ga-view]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.gaView === state.panel)); });
  }
  function updateMechanism() {
    $('[data-ga-case]').value = state.caseId;
    root.querySelectorAll('[data-ga-phase]').forEach(input => { input.checked = input.value === state.phase; });
    $('[data-ga-mechanism-result]').innerHTML = mechanismHTML(state);
  }
  function updateHuman() {
    $('[data-ga-metric]').value = state.metric;
    $('[data-ga-human-result]').innerHTML = humanHTML(state.metric);
  }
  function updateAnswer(questionId) {
    const question = QUESTIONS.find(q => q.id === questionId), answer = state.answers[questionId];
    const button = $(`[data-ga-check="${questionId}"]`), feedback = $(`[data-ga-feedback="${questionId}"]`);
    button.disabled = answer.current === null || answer.checked;
    button.textContent = answer.checked ? '已核對，可修改目前答案' : '核對這題';
    if (!answer.checked) { feedback.innerHTML = ''; return; }
    const label = optionId => question.options.find(option => option.id === optionId)?.label || '尚未選擇';
    feedback.innerHTML = `<p class="ga-answer-result">${answer.current === question.correct ? '目前答案符合這份證據。' : '目前答案仍超出這份證據。'}</p><p>${esc(question.explanation)}</p><p class="ga-answer-history">首次：${esc(label(answer.first))}<br>核對時：${esc(label(answer.checkedSelection))}<br>核對後目前：${esc(label(answer.current))}</p>`;
  }
  function updateSaveStatus() {
    if (disposed) return;
    $('[data-ga-save-status]').textContent = record.message;
    $('[data-ga-save]').disabled = record.pending.size > 0;
  }
  updatePanel(); updateMechanism(); updateHuman(); QUESTIONS.forEach(q => updateAnswer(q.id)); updateSaveStatus();
  root.querySelectorAll('[data-ga-detail]').forEach(detail => { detail.open = Boolean(state.details[detail.dataset.gaDetail]); });

  const onChange = event => {
    if (disposed) return;
    const target = event.target;
    if (target.matches('[data-ga-case]')) { state.caseId = target.value; updateMechanism(); }
    else if (target.matches('[data-ga-phase]')) { state.phase = target.value; updateMechanism(); }
    else if (target.matches('[data-ga-metric]')) { state.metric = target.value; updateHuman(); }
    else if (target.matches('[data-ga-answer]')) { chooseGlycosideAnswer(state, target.dataset.gaAnswer, target.value); updateAnswer(target.dataset.gaAnswer); }
    markGlycosideDraftChanged(record);
  };
  const onInput = event => {
    if (!disposed && event.target.matches('[data-ga-observation]')) { state.observation = event.target.value; markGlycosideDraftChanged(record); }
  };
  const onClick = event => {
    if (disposed) return;
    const view = event.target.closest?.('[data-ga-view]');
    if (view) { state.panel = view.dataset.gaView; updatePanel(); return; }
    const check = event.target.closest?.('[data-ga-check]');
    if (check) { checkGlycosideAnswer(state, check.dataset.gaCheck); updateAnswer(check.dataset.gaCheck); markGlycosideDraftChanged(record); return; }
    if (event.target.closest?.('[data-ga-save]')) void saveGlycosideSummary(record, onSaveSummary);
  };
  const onToggle = event => {
    if (!disposed && event.target.matches?.('[data-ga-detail]')) state.details[event.target.dataset.gaDetail] = event.target.open;
  };
  const unsubscribe = subscribeGlycosideSession(record, updateSaveStatus);
  root.addEventListener('change', onChange);
  root.addEventListener('input', onInput);
  root.addEventListener('click', onClick);
  root.addEventListener('toggle', onToggle, true);
  return () => {
    if (disposed) return;
    // Keep the latest visible values even if teardown precedes a queued toggle event.
    state.observation = $('[data-ga-observation]').value;
    markGlycosideDraftChanged(record);
    root.querySelectorAll('[data-ga-detail]').forEach(detail => { state.details[detail.dataset.gaDetail] = detail.open; });
    disposed = true; unsubscribe();
    root.removeEventListener('change', onChange);
    root.removeEventListener('input', onInput);
    root.removeEventListener('click', onClick);
    root.removeEventListener('toggle', onToggle, true);
  };
}
