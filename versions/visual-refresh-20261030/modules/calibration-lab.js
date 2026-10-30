import {escapeHTML as esc} from './storage.js';
import {CALIBRATION_LAB_ID, CALIBRATION_TEACHING_SCENARIOS, createTeachingScenario, fitCalibration, inverseCalibration, compareValidation, calibrationUncertainty} from './calibration-model.js';
import {CALIBRATION_RESEARCH} from './calibration-research-data.js';
export {CALIBRATION_LAB_ID} from './calibration-model.js';

let instance = 0;
const steps = {fit: '校正與殘差', validate: '先回算，再對照', uncertainty: '不確定度的範圍'};
const fitChoices = {conditional: '只在題設與方法條件下繼續', revise: '先檢查模型或變異假設', proven: 'R² 高就足以證明方法適用'};
const rangeChoices = {inside: '在標準範圍內', outside: '超出標準範圍', invalid: '資料不足，尚不能逆算'};
const uncertaintyChoices = {partial: '只涵蓋本模型中的校正與讀值', complete: '已涵蓋取樣、萃取和所有偏差', unavailable: '目前條件不能套用這條公式'};
const fmt = value => typeof value !== 'number' || !Number.isFinite(value) ? '—' : value !== 0 && (Math.abs(value) < .001 || Math.abs(value) >= 1e7) ? value.toExponential(4) : value.toLocaleString('en-US', {maximumSignificantDigits: 6});
const numeric = value => typeof value === 'string' && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()) && Number.isFinite(Number(value)) ? Number(value) : null;
const blankAnswer = () => ({choice: '', checked: false, reference: false, referenceSeen: false, checkedSeen: false});
const resetAnswer = answer => Object.assign(answer, {checked: false, reference: false});
const shown = answer => answer.checked || answer.reference;
const mark = (answer, labels) => `${answer.choice ? `自己的選擇：${labels[answer.choice]}（${answer.checked ? '已核對' : '未核對'}）` : '尚未自行作答'}${answer.referenceSeen ? '；曾看參考' : ''}${answer.checkedSeen && !answer.checked ? '；先前曾核對' : ''}`;
const letters = ['A', 'B', 'C', 'D'];
const sessions = new WeakMap();
const detailKeys = ['statistics', 'source', 'writing', 'original', 'revision', 'notes'];
const safeHref = value => typeof value === 'string' && /^#[a-z][a-z0-9/-]*$/i.test(value) ? value : '#learn/review';
function draftFor(owner, key, startStep) {
  const create = () => ({step: startStep, source: startStep === 'uncertainty' ? 'linear' : 'research', dayId: CALIBRATION_RESEARCH.days[0].id,
    datasets: new Map(), open: Object.fromEntries(detailKeys.map(key => [key, false])),
    writing: {draft: '', original: '', revision: '', retained: false, draftContext: null, originalContext: null, retainedContext: null, revisionContext: null, stale: false},
    savedParts: null, savedVersions: [], review: '', saving: false, saveStatus: '', views: new Set()});
  if (!owner || !['object', 'function'].includes(typeof owner)) return create();
  let byLesson = sessions.get(owner); if (!byLesson) { byLesson = new Map(); sessions.set(owner, byLesson); }
  const lesson = typeof key === 'string' && key ? key : CALIBRATION_LAB_ID;
  if (!byLesson.has(lesson)) byLesson.set(lesson, create());
  return byLesson.get(lesson);
}

const errors = result => result.issues?.join('；') ?? '';
const rangeLabel = value => ({inside: '標準範圍內的插值', below: '低於標準範圍：外推算術', above: '高於標準範圍：外推算術', negative: '逆算為負：不作零含量判定'}[value] ?? '尚不能逆算');
function axisTicks(min, max, symmetric = false) {
  const target = Math.max((max - min) / 4, .0000000001), power = 10 ** Math.floor(Math.log10(target));
  const step = [1, 2, 5, 10].find(value => value * power >= target) * power;
  const bound = Math.ceil(Math.max(Math.abs(min), Math.abs(max)) / step) * step;
  const low = symmetric ? -bound : Math.floor(min / step) * step, high = symmetric ? bound : Math.ceil(max / step) * step;
  const values = Array.from({length: Math.round((high - low) / step) + 1}, (_, i) => Number((low + i * step).toPrecision(12)));
  const label = value => value === 0 ? '0' : step < .001 || Math.abs(value) >= 1e6 ? value.toExponential(1) : String(Number(value.toFixed(Math.max(0, -Math.floor(Math.log10(step))))));
  return {low, high, values, label};
}

/** Original research values remain read-only; hypothetical settings never become measurements. */
export function mountCalibrationLab(container, id = CALIBRATION_LAB_ID, {startStep = 'fit', draftOwner, draftKey = CALIBRATION_LAB_ID, onSaveSummary, reviewHref = '#learn/review'} = {}) {
  if (!container || typeof container.querySelector !== 'function' || typeof container.addEventListener !== 'function') throw new TypeError('A DOM container is required');
  if (id !== CALIBRATION_LAB_ID) throw new RangeError('Unknown calibration activity');
  if (!Object.hasOwn(steps, startStep)) throw new RangeError('Unknown calibration starting step');
  const prefix = `calibration-${++instance}`, $ = selector => container.querySelector(selector);
  const memory = draftFor(draftOwner, draftKey, startStep), drafts = memory.datasets, writing = memory.writing;
  let disposed = false, {step, source, dayId} = memory, historyVersion = -1;
  const syncDraft = () => Object.assign(memory, {step, source, dayId});
  const changed = () => { if (!memory.saving) memory.saveStatus = ''; };
  const markStale = () => { if (writing.draft || writing.revision) writing.stale = true; changed(); };
  const isResearch = () => source === 'research';
  const data = () => isResearch() ? {...CALIBRATION_RESEARCH, ...CALIBRATION_RESEARCH.days.find(day => day.id === dayId)} : createTeachingScenario(source);
  function state() {
    const key = isResearch() ? `research/${dayId}` : source;
    if (!drafts.has(key)) drafts.set(key, {mode: 'free', graph: 'fit', point: 0, sample: isResearch() ? 1 : 0, response: '32', replicates: 1, fit: blankAnswer(), uncertainty: blankAnswer(), validations: Array.from({length: isResearch() ? 4 : 1}, () => ({...blankAnswer(), targetShown: false, targetSeen: false}))});
    return drafts.get(key);
  }
  const currentAnswer = () => step === 'fit' ? state().fit : step === 'uncertainty' ? state().uncertainty : state().validations[state().sample];
  function calculation() {
    const dataset = data(), draft = state(), fit = fitCalibration(dataset.standards, {throughOrigin: draft.mode === 'origin'});
    const responses = isResearch() ? dataset.validation[draft.sample].responses.map(item => item.value) : [numeric(draft.response)];
    const inverse = inverseCalibration(fit, responses);
    let uncertainty;
    if (isResearch()) uncertainty = {ok: false, issues: ['本研究頁只重算校正與驗證，不以這些資料估計不確定度。']};
    else if (source !== 'linear') uncertainty = {ok: false, issues: ['這份彎曲或非等變異題設不套用本活動的直線等變異公式。']};
    else if (!inverse.ok) uncertainty = {ok: false, issues: inverse.issues};
    else uncertainty = calibrationUncertainty(fit, {estimate: inverse.estimate, replicates: draft.replicates});
    return {dataset, draft, fit, inverse, uncertainty, responses};
  }
  const choices = (values, group) => `<div class="cl-choices" role="group" aria-label="${group === 'fit' ? '校正判讀' : group === 'validate' ? '逆算範圍判斷' : '不確定度判讀'}">${Object.entries(values).map(([value, label]) => `<button type="button" data-cl-choice="${value}" data-cl-group="${group}" aria-pressed="false">${esc(label)}</button>`).join('')}</div>`;
  container.innerHTML = `<section class="calibration-lab" aria-labelledby="${prefix}-title"><nav class="cl-steps" aria-label="校正工作台步驟">${Object.entries(steps).map(([value, label], index) => `<button type="button" data-cl-step="${value}" aria-pressed="false">${index + 1} · ${label}</button>`).join('')}</nav><header class="cl-header"><h2 id="${prefix}-title">多點校正工作台</h2><p class="cl-evidence" data-cl-evidence></p></header>
    <div class="cl-selection-bar"><div class="cl-source-row"><label for="${prefix}-source">資料<select id="${prefix}-source" data-cl-control="source"><option value="research">已發表：抗壞血酸訊號</option>${CALIBRATION_TEACHING_SCENARIOS.map(item => `<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('')}</select></label><label for="${prefix}-day" data-cl-day-field>同日資料<select id="${prefix}-day" data-cl-control="day">${CALIBRATION_RESEARCH.days.map(day => `<option value="${esc(day.id)}">${esc(day.label)}</option>`).join('')}</select></label></div>
    
    
    <div class="cl-model-row"><label for="${prefix}-model">截距假設<select id="${prefix}-model" data-cl-control="model"><option value="free">自由截距：y = a + bx</option><option value="origin">強制過零：y = bx</option></select></label></div></div><h3 data-cl-heading tabindex="-1"></h3>
    <div class="cl-workspace"><div class="cl-experiment"><section data-cl-panel="fit"><div class="cl-chart-tools"><div class="cl-view-switch" role="group" aria-label="圖面"><button type="button" data-cl-view="fit" aria-pressed="false">校正散點</button><button type="button" data-cl-view="residual" aria-pressed="false">看殘差</button></div><label for="${prefix}-point">查看標準點<select id="${prefix}-point" data-cl-control="point"></select></label></div><div class="cl-chart" data-cl-chart></div><p class="cl-point" data-cl-point></p>${choices(fitChoices, 'fit')}</section>
    <section data-cl-panel="validate"><div data-cl-research-sample><label for="${prefix}-sample">先隱藏標稱的驗證組<select id="${prefix}-sample" data-cl-control="sample">${letters.map((letter, index) => `<option value="${index}">驗證組 ${letter}</option>`).join('')}</select></label><p class="cl-note">用同一天的校正線回算；這是已知目標的驗證資料，暫時遮住標稱供練習。</p><p class="cl-signals" data-cl-signals></p></div>
      <div data-cl-hypothetical-input><label for="${prefix}-response">假想未知響應 y₀<input id="${prefix}-response" data-cl-control="response" type="text" inputmode="decimal" autocomplete="off" aria-describedby="${prefix}-response-note"></label><input class="cl-range" data-cl-control="response-range" type="range" min="12" max="60" step="1" value="32" aria-label="調整假想未知響應"><p class="cl-note" id="${prefix}-response-note" data-cl-response-note></p></div>
      <p class="cl-note" data-cl-span></p>${choices(rangeChoices, 'validate')}
      <div class="cl-result" data-cl-inverse hidden><span>依所選校正式逆算</span><strong data-cl-estimate></strong><p data-cl-inverse-status></p></div>
      <div data-cl-target-section><button type="button" data-cl-action="reveal-target">揭示本組標稱與偏差</button><p class="cl-note">先核對或查看回算參考，再對照標稱。</p><div class="cl-target" data-cl-target hidden></div></div>
    </section>
    <section data-cl-panel="uncertainty"><p class="cl-note">只用假想直線、自由截距、範圍內估值。m 是未來獨立重讀的計畫次數，不是已做的新測量。</p><label for="${prefix}-replicates">未來樣品重讀計畫<select id="${prefix}-replicates" data-cl-control="replicates"><option value="1">m = 1</option><option value="3">m = 3</option><option value="9">m = 9</option></select></label><p class="cl-note" data-cl-uncertainty-context></p><p class="cl-error" data-cl-uncertainty-error></p><button type="button" data-cl-action="use-linear">切到假想直線，練習這個公式</button>${choices(uncertaintyChoices, 'uncertainty')}<div class="cl-result" data-cl-uncertainty-result hidden><span>一階近似標準不確定度 uₓ</span><strong data-cl-u></strong><p>這是標準不確定度，不是 95% 區間，也不是完整方法不確定度。</p><div class="cl-variance-bar" data-cl-variance-bar aria-hidden="true"></div><p class="cl-variance-legend" data-cl-variance-legend></p><p class="cl-note">色帶相加的是變異數；標準差不能直接相加。</p></div></section>
    </div><aside class="cl-current" aria-label="目前模型與判讀"><div class="cl-actions"><button type="button" class="cl-primary" data-cl-action="check" disabled>核對我的判斷</button><button type="button" class="cl-text" data-cl-action="reference">看參考</button></div><p class="cl-feedback" role="status" data-cl-feedback></p>
    <div class="cl-equation"><p data-cl-equation></p><small data-cl-r-squared></small><small data-cl-equation-note></small><small>兩種截距假設使用相同標準點；不按 R² 自動推薦。</small></div>
    </aside></div><nav class="cl-navigation" aria-label="前後步驟"><button type="button" data-cl-action="previous">上一步</button><button type="button" class="cl-primary" data-cl-action="next">下一步</button></nav>
    <details class="cl-details" data-cl-details="statistics"><summary>計算細節與模型假設</summary><div class="cl-detail-body" data-cl-statistics></div></details>
    <details class="cl-details" data-cl-details="source"><summary>原始標準點、條件與來源</summary><div class="cl-detail-body" data-cl-source-details></div></details>
    <details class="cl-details" data-cl-details="writing"><summary>原始想法與修訂（選填）</summary><div class="cl-detail-body"><div data-cl-writing-editor><label for="${prefix}-draft">現在怎麼解讀這份校正？<textarea id="${prefix}-draft" data-cl-writing="draft" rows="3"></textarea></label><p class="cl-note" data-cl-draft-context></p><button type="button" data-cl-action="retain-original">保留這份原始想法</button></div><details data-cl-details="original" data-cl-original-archive hidden><summary>回看已保留的原始想法</summary><pre class="cl-own-text" data-cl-original></pre><p class="cl-note" data-cl-original-context></p></details><details data-cl-details="revision"><summary>修訂與下一項證據</summary><label for="${prefix}-revision">我的修訂（自由文字不自動評分）<textarea id="${prefix}-revision" data-cl-writing="revision" rows="3"></textarea></label><p class="cl-note" data-cl-revision-context></p></details></div></details>
    <details class="cl-details" data-cl-details="notes"><summary>保留本次推算</summary><div class="cl-detail-body"><p class="cl-note">同一頁內離開再回來可接續；重載前請保存並匯出。自己的選擇、核對與參考分開記錄；只附加本次新增或修改的內容，不自動標記掌握。</p><label>回看已附加內容<select data-cl-review></select></label><pre class="cl-own-text" data-cl-review-text></pre><label for="${prefix}-summary">完整目前摘要<textarea id="${prefix}-summary" data-cl-summary readonly></textarea></label><label>本次將附加的內容<textarea data-cl-append readonly></textarea></label><div class="cl-actions"><button type="button" data-cl-action="select-summary">選取摘要文字</button>${typeof onSaveSummary === 'function' ? '<button type="button" class="cl-primary" data-cl-action="save-summary">附加到本課筆記</button>' : ''}</div><p class="cl-feedback" role="status" data-cl-save-status></p><a href="${esc(safeHref(reviewHref))}">到我的複習查看筆記 →</a></div></details>
  </section>`;

  function graph({dataset, draft, fit}) {
    if (!fit.ok) return `<p class="cl-error">${esc(errors(fit))}</p>`;
    const points = fit.residuals, alternate = fitCalibration(dataset.standards, {throughOrigin: draft.mode !== 'origin'}), residual = draft.graph === 'residual';
    const allResiduals = [...points, ...(alternate.ok ? alternate.residuals : [])];
    const xmin = fit.range.min, xmax = fit.range.max, xp = (xmax - xmin) * .04;
    const ys = residual ? allResiduals.map(point => Math.abs(point.residual)) : [...dataset.standards.map(point => point.y), ...[fit, alternate].filter(item => item.ok).flatMap(item => [item.intercept + item.slope * xmin, item.intercept + item.slope * xmax])];
    const magnitude = Math.max(...ys, .001), yTicks = axisTicks(residual ? -magnitude : Math.min(...ys), residual ? magnitude : Math.max(...ys), residual);
    const X = value => 76 + (value - xmin + xp) / (xmax - xmin + 2 * xp) * 540, Y = value => 270 - (value - yTicks.low) / (yTicks.high - yTicks.low) * 230;
    const xTicks = [...new Set(points.map(point => point.x))].sort((a, b) => a - b);
    return `<svg viewBox="0 0 670 360" role="img" aria-label="${residual ? '殘差圖：測值減擬合值' : '原始標準點與當前校正直線'}；${dataset.standards.length} 個標準讀值"><path class="cl-axis" d="M76 36V270H620"/>${yTicks.values.map(value => `<line class="cl-grid" x1="76" x2="620" y1="${Y(value)}" y2="${Y(value)}"/><text data-cl-y-tick x="67" y="${Y(value) + 5}" text-anchor="end">${yTicks.label(value)}</text>`).join('')}${xTicks.map(value => `<text data-cl-x-tick x="${X(value)}" y="294" text-anchor="middle">${fmt(value)}</text>`).join('')}${residual ? `<line class="cl-zero" x1="76" x2="620" y1="${Y(0)}" y2="${Y(0)}"/>` : `<path class="cl-fit-line" d="M${X(xmin)} ${Y(fit.intercept + fit.slope * xmin)}L${X(xmax)} ${Y(fit.intercept + fit.slope * xmax)}"/>`}${points.map((point, index) => `<circle data-cl-plot-point="${index}" class="cl-dot${index === draft.point ? ' is-selected' : ''}" cx="${X(point.x)}" cy="${Y(residual ? point.residual : point.y)}" r="${index === draft.point ? 6 : 3.5}"/>`).join('')}<text x="78" y="28">${esc(residual ? `測值 − 擬合值 · ${dataset.yUnit}` : `響應 · ${dataset.yUnit}`)}</text><text x="348" y="350" text-anchor="middle">${esc(dataset.xUnit)}</text></svg>`;
  }
  function fitJudgement() {
    if (isResearch()) return {expected: ['conditional', 'revise'], explanation: state().fit.choice === 'revise' ? '先檢查模型與變異假設是合理的；這個頁面沒有證明線性或等變異，還需方法條件與獨立驗證。' : '這裡只重算同一天的直線與殘差；仍需方法條件及獨立驗證，不能由 R² 宣稱適用任意食品。'};
    const item = data();
    return state().mode === 'origin' ? {expected: 'revise', explanation: '這份假想訊號帶有非零截距。過零是新增的限制，需查看它造成的殘差，不能由 R² 替這項假設背書。'} : {expected: item.expected, explanation: item.explanation};
  }
  function feedback(calc) {
    const answer = currentAnswer(); if (!shown(answer)) return answer.choice ? '已選擇，按「核對我的判斷」查看。' : '';
    const decision = step === 'fit' ? fitJudgement() : step === 'validate' ? {expected: !calc.inverse.ok ? 'invalid' : calc.inverse.withinRange ? 'inside' : 'outside', explanation: calc.inverse.ok ? calc.inverse.interpretation : errors(calc.inverse)} : {expected: calc.uncertainty.ok ? 'partial' : 'unavailable', explanation: calc.uncertainty.ok ? calc.uncertainty.interpretation : errors(calc.uncertainty)};
    const correct = Array.isArray(decision.expected) ? decision.expected.includes(answer.choice) : answer.choice === decision.expected;
    return `${answer.checked ? correct ? '這次判斷與資料範圍相符。' : '這次判斷需要調整。' : `參考已展開；${answer.choice ? '自己的選擇仍保留，尚未核對。' : '尚未自行作答。'}`} ${decision.explanation}`;
  }
  function exposureContext() {
    const answers = [...drafts.values()].flatMap(draft => [draft.fit, draft.uncertainty, ...draft.validations]);
    return Object.freeze({step, source, dayId, referenceSeen: answers.some(answer => answer.referenceSeen), checkedSeen: answers.some(answer => answer.checkedSeen), targetSeen: answers.some(answer => answer.targetSeen)});
  }
  const contextText = value => value ? `${value.source === 'research' ? '研究資料／' + (CALIBRATION_RESEARCH.days.find(day => day.id === value.dayId)?.label ?? value.dayId) : '假想資料／' + value.source}；${steps[value.step]}；${value.referenceSeen ? '曾看參考' : '尚未看參考'}；${value.checkedSeen ? '曾核對' : '尚未核對'}；${value.targetSeen ? '曾看標稱' : '尚未揭示標稱'}` : '尚未留下文字';
  function summaryParts(calc) {
    const {dataset, draft, fit, inverse, uncertainty} = calc, answer = draft.validations[draft.sample];
    const parts = {
      title: '多點校正工作台',
      dataset: isResearch() ? `刊載原始訊號：${CALIBRATION_RESEARCH.label}／${dataset.label}；發泡藥劑基質，非食品實測。` : `原創假想資料：${dataset.label}`,
      step: `當前步驟：${steps[step]}`,
      standards: `標準點 ${dataset.standards.length} 筆；x：${dataset.xUnit}；y：${dataset.yUnit}。`,
      model: `模型：${draft.mode === 'free' ? '自由截距' : '強制過零'}；圖面：${draft.graph === 'fit' ? '校正散點' : '殘差'}；選取標準點 ${draft.point + 1}。`,
      fit: fit.ok ? `y = ${fmt(fit.intercept)} + ${fmt(fit.slope)}x；s = ${fmt(fit.residualSd)} ${dataset.yUnit}；df = ${fit.df}；殘差 = 測值 − 擬合值。` : errors(fit),
      fitAnswer: `校正判讀：${mark(draft.fit, fitChoices)}`,
      signal: isResearch() ? `驗證組 ${letters[draft.sample]}：原表響應 ${dataset.validation[draft.sample].responses.map(item => item.display).join('、')} ${dataset.yUnit}；未併入標準點。` : `假想未知響應：原題設 ${dataset.response}；目前輸入 ${draft.response || '空值'} ${dataset.yUnit}。`,
      validation: `逆算判斷：${mark(answer, rangeChoices)}`,
      inverse: shown(answer) ? inverse.ok ? `回算 ${fmt(inverse.estimate)} ${dataset.xUnit}；${rangeLabel(inverse.rangeStatus)}。` : `未能回算：${errors(inverse)}` : '回算參考尚未展開。'
    };
    if (isResearch()) {
      if (answer.targetShown) { const check = compareValidation(fit, dataset.validation[draft.sample]); parts.target = check.ok ? `已揭示標稱 ${dataset.validation[draft.sample].displayTarget}%；回算−標稱 = ${fmt(check.difference)} 百分點；相對偏差 ${fmt(check.relativeBias)}%。` : errors(check); }
      else parts.target = `本組標稱尚未揭示${answer.targetSeen ? '（先前曾查看標稱）' : ''}。`;
    } else parts.target = '本次為假想未知訊號，沒有刊載驗證組的標稱對照。';
    parts.source = isResearch() ? `來源：${CALIBRATION_RESEARCH.sourceUrl}；${CALIBRATION_RESEARCH.license}。不推食品 mg/100 g。` : '本次使用固定原創假想標準點，未生成新量測。';
    parts.uncertaintyAnswer = `不確定度判讀：${mark(draft.uncertainty, uncertaintyChoices)}`;
    parts.replicates = !isResearch() ? `未來重讀計畫 m = ${draft.replicates}（假設，未生成新量測）。` : '研究資料不在本頁提供未來重讀計畫的不確定度估計。';
    parts.uncertainty = shown(draft.uncertainty) ? uncertainty.ok ? `uₓ = ${fmt(uncertainty.standardUncertainty)} mg/L。一階近似標準不確定度，非95%區間，未包含取樣、萃取與所有偏差。` : `不提供此估計：${errors(uncertainty)}` : '不確定度參考尚未展開。';
    parts.original = `自己的原始想法（${writing.retained ? '已保留' : '未按保留'}）：${writing.retained ? writing.original : writing.draft || '未寫'}\n最後修改時：${contextText(writing.retained ? writing.originalContext : writing.draftContext)}${writing.retained ? '\n保留時：' + contextText(writing.retainedContext) : ''}`;
    parts.revision = `自己的修訂：${writing.revision || '未寫'}（未自動評分）\n最後修改時：${contextText(writing.revisionContext)}${writing.stale ? '\n資料或模型之後曾改變，文字保留供重新檢查。' : ''}`;
    parts.scope = '自己的判斷、核對或查看參考不代表已掌握。初始題設與校正結果並非盲測；曾看參考或標稱不會因換頁或重新遮住而取消。';
    return parts;
  }
  function pending() {
    const parts = Object.freeze(summaryParts(calculation())), full = Object.values(parts).join('\n');
    const updates = Object.entries(parts).filter(([key, value]) => !memory.savedParts || memory.savedParts[key] !== value).map(([, value]) => value);
    return Object.freeze({parts, full, text: !memory.savedParts ? full : updates.length ? ['多點校正工作台｜本次變更（接續已附加摘要）', ...updates].join('\n') : ''});
  }
  function drawJournal() {
    if (disposed) return;
    const next = pending(); $('[data-cl-summary]').value = next.full; $('[data-cl-append]').value = next.text;
    const select = $('[data-cl-review]');
    if (historyVersion !== memory.savedVersions.length) { select.innerHTML = '<option value="">選擇已附加內容</option>' + memory.savedVersions.map((_, index) => `<option value="saved-${index + 1}">已附加摘要 ${index + 1}</option>`).join(''); historyVersion = memory.savedVersions.length; }
    select.value = memory.review;
    const saved = memory.savedVersions.find((_, index) => memory.review === `saved-${index + 1}`);
    $('[data-cl-review-text]').textContent = saved ? saved.text : '回看固定保留的已附加文字，不改寫目前條件或自己的原稿。';
    $('[data-cl-save-status]').textContent = memory.saveStatus || (!next.text ? '沒有尚未附加的新內容。' : next.text.length > 10000 ? '新增內容超過 10,000 字，尚未保存；全文保留，可選取複製。' : '只附加尚未保存或後來修改的內容。');
    const button = $('[data-cl-action="save-summary"]'); if (button) button.disabled = memory.saving || !next.text;
  }
  function notify() { for (const draw of memory.views) draw(); }
  function save() {
    if (memory.saving || typeof onSaveSummary !== 'function') return;
    const proposal = pending();
    if (!proposal.text) { memory.saveStatus = '沒有尚未附加的新內容。'; notify(); return; }
    if (proposal.text.length > 10000) { memory.saveStatus = '新增內容超過 10,000 字，尚未保存；全文保留，可選取複製。'; notify(); return; }
    memory.saving = true; memory.saveStatus = '正在追加到本課筆記…'; notify();
    const finish = accepted => {
      memory.saving = false;
      if (accepted === true) { memory.savedParts = proposal.parts; memory.savedVersions.push(Object.freeze({text: proposal.text, full: proposal.full, parts: proposal.parts})); memory.saveStatus = '已追加到本課筆記，可到我的複習查看。'; }
      else memory.saveStatus = '尚未保存；全文仍保留，可重試或選取複製。';
      notify();
    };
    try { const result = onSaveSummary(proposal.text); if (result && typeof result.then === 'function') Promise.resolve(result).then(finish, () => finish(false)); else finish(result); }
    catch { finish(false); }
  }
  function syncPanels() { for (const key of detailKeys) { const panel = $(`[data-cl-details="${key}"]`); if (panel) memory.open[key] = panel.open; } }
  function onToggle(event) { if (!disposed && event?.target?.dataset?.clDetails) syncPanels(); }

  function render() {
    if (disposed) return; syncDraft();
    const calc = calculation(), {dataset, draft, fit, inverse, uncertainty} = calc, research = isResearch(), answer = draft.validations[draft.sample];
    $('[data-cl-control="source"]').value = source; $('[data-cl-control="day"]').value = dayId; $('[data-cl-day-field]').hidden = !research;
    $('[data-cl-control="model"]').value = draft.mode;
    $('[data-cl-control="sample"]').value = String(draft.sample);
    $('[data-cl-control="response"]').value = draft.response;
    $('[data-cl-control="response"]').setAttribute('aria-invalid', String(numeric(draft.response) === null));
    const y0 = numeric(draft.response), slider = $('[data-cl-control="response-range"]');
    slider.value = String(y0 === null ? 32 : Math.max(12, Math.min(60, y0))); slider.setAttribute('aria-valuetext', y0 === null || y0 < 12 || y0 > 60 ? '輸入值在此滑桿範圍外；請讀取數值欄位' : `${fmt(y0)} ${dataset.yUnit}`);
    $('[data-cl-response-note]').textContent = `${y0 === null ? '請輸入有限的十進位數值。' : y0 < 12 || y0 > 60 ? '目前文字欄位超出滑桿 12–60，計算仍依文字欄位。' : ''}調整的是原創假想訊號，不生成新實測或重複讀值。`;
    $('[data-cl-control="replicates"]').value = String(draft.replicates);
    $('[data-cl-evidence]').textContent = research ? `已發表研究 · ${dataset.label} · 發泡藥劑基質，非食品實測` : '原創假想資料 · 非食品實測';
    for (const key of Object.keys(steps)) { $(`[data-cl-panel="${key}"]`).hidden = step !== key; $(`[data-cl-step="${key}"]`).setAttribute('aria-pressed', String(step === key)); }
    $('[data-cl-heading]').textContent = step === 'fit' ? '這條線，支持你走到哪裡？' : step === 'validate' ? research ? '先回算這一組，再對照標稱' : '這個假想訊號在標準範圍內嗎？' : '增加重讀次數，涵蓋了哪些誤差？';
    for (const key of ['fit', 'residual']) $(`[data-cl-view="${key}"]`).setAttribute('aria-pressed', String(draft.graph === key));
    const pointSelect = $('[data-cl-control="point"]'), pointOptions = dataset.standards.map((point, index) => `<option value="${index}">點 ${index + 1} · x = ${esc(point.displayX ?? String(point.x))}</option>`).join('');
    if (pointSelect.innerHTML !== pointOptions) pointSelect.innerHTML = pointOptions; pointSelect.value = String(draft.point);
    $('[data-cl-chart]').innerHTML = graph(calc);
    const point = fit.ok ? fit.residuals[draft.point] : null;
    $('[data-cl-point]').textContent = point ? `點 ${draft.point + 1}：x = ${fmt(point.x)} ${dataset.xUnit}；測值 ${dataset.standards[draft.point].displayY}；擬合 ${fmt(point.fitted)}；殘差 ${fmt(point.residual)} ${dataset.yUnit}。` : errors(fit);
    $('[data-cl-research-sample]').hidden = !research; $('[data-cl-hypothetical-input]').hidden = research;
    $('[data-cl-signals]').textContent = research ? `${dataset.validation[draft.sample].responses.map(item => item.display).join('、')} ${dataset.yUnit}（原表 5 筆響應）` : '';
    $('[data-cl-span]').textContent = fit.ok ? `本次標準濃度跨度：${fmt(fit.range.min)}–${fmt(fit.range.max)} ${dataset.xUnit}。這個跨度本身不等於已確效的工作區間。` : errors(fit);
    $('[data-cl-inverse]').hidden = !shown(answer);
    $('[data-cl-estimate]').textContent = inverse.ok ? `${fmt(inverse.estimate)} ${dataset.xUnit}` : '—';
    $('[data-cl-inverse-status]').textContent = inverse.ok ? rangeLabel(inverse.rangeStatus) : errors(inverse);
    $('[data-cl-target-section]').hidden = !research;
    $('[data-cl-action="reveal-target"]').disabled = !research || !shown(answer) || !inverse.ok;
    $('[data-cl-target]').hidden = !research || !answer.targetShown;
    $('[data-cl-target]').textContent = '';
    if (research && answer.targetShown) {
      const check = compareValidation(fit, dataset.validation[draft.sample]);
      $('[data-cl-target]').textContent = check.ok ? `標稱 ${dataset.validation[draft.sample].displayTarget}%；回算 − 標稱 = ${fmt(check.difference)} 百分點；相對偏差 = ${fmt(check.relativeBias)}%。${check.interpretation}` : errors(check);
    }
    $('[data-cl-uncertainty-context]').textContent = !research && inverse.ok ? `假想響應 y₀ = ${draft.response}；逆算 x̂ = ${fmt(inverse.estimate)} mg/L。可返回「先回算，再對照」調整訊號。` : research ? '本步不對刊載研究資料計算 u。' : errors(inverse);
    $('[data-cl-uncertainty-error]').textContent = uncertainty.ok ? '' : errors(uncertainty);
    $('[data-cl-action="use-linear"]').hidden = !research && source === 'linear' && draft.mode === 'free';
    $('[data-cl-control="replicates"]').disabled = !uncertainty.ok;
    $('[data-cl-uncertainty-result]').hidden = !shown(draft.uncertainty) || !uncertainty.ok;
    $('[data-cl-u]').textContent = uncertainty.ok ? `${fmt(uncertainty.standardUncertainty)} mg/L` : '—';
    $('[data-cl-variance-bar]').innerHTML = uncertainty.ok ? uncertainty.components.map((item, index) => `<span class="cl-component-${index}" style="width:${Math.max(0, Math.min(100, item.fraction * 100))}%"></span>`).join('') : '';
    $('[data-cl-variance-legend]').innerHTML = uncertainty.ok ? uncertainty.components.map((item, index) => `<span><i class="cl-component-${index}" aria-hidden="true"></i>${['未來樣品均值', '校正中心', '離中心位置'][index]} ${fmt(item.fraction * 100)}%</span>`).join('') : '';
    for (const button of container.querySelectorAll('[data-cl-choice]')) button.setAttribute('aria-pressed', String(button.dataset.clGroup === step && button.dataset.clChoice === currentAnswer().choice));
    $('[data-cl-action="check"]').disabled = !currentAnswer().choice;
    $('[data-cl-feedback]').textContent = feedback(calc);
    $('[data-cl-equation]').textContent = !fit.ok ? errors(fit) : step === 'fit' ? `y = ${fmt(fit.intercept)} + ${fmt(fit.slope)}x` : step === 'validate' ? shown(answer) && inverse.ok ? `x̂ = (${fmt(inverse.meanResponse)} − ${fmt(fit.intercept)}) ÷ ${fmt(fit.slope)} = ${fmt(inverse.estimate)} ${dataset.xUnit}` : 'x̂ = (平均響應 − 截距 a) ÷ 斜率 b' : 'uₓ² = (s / b)² × [1/m + 1/n + (x̂ − x̄)² / Sₓₓ]';
    $('[data-cl-equation-note]').textContent = step === 'fit' ? `y：${dataset.yUnit}；x：${dataset.xUnit}。圖線只畫在標準範圍內。` : step === 'validate' ? '回算使用當前校正線；研究資料不換算成食品 mg/100 g。' : '三項變異數加總，再取平方根得到 uₓ；m 是未來樣品均值的計畫重讀數。';
    $('[data-cl-r-squared]').hidden = step !== 'fit';
    $('[data-cl-r-squared]').textContent = fit.ok ? `R² ≈ ${fmt(fit.rSquared)} · 仍需看殘差與方法條件。` : '';
    $('[data-cl-action="previous"]').disabled = step === 'fit'; $('[data-cl-action="next"]').disabled = step === 'uncertainty';
    $('[data-cl-statistics]').innerHTML = fit.ok ? `<p>n = ${fit.n}；濃度層級 ${fit.levels}；df = ${fit.df}；殘差標準差 s = ${fmt(fit.residualSd)} ${esc(dataset.yUnit)}。</p><p>R² = ${fmt(fit.rSquared)}。兩種截距模式都用中心化分母：1 − SSE / Σ(y − 平均 y)²。R² 不替代殘差與方法條件檢查。</p><p>${esc(fit.interpretation)}</p>${uncertainty.ok && shown(draft.uncertainty) ? `<p>${esc(uncertainty.interpretation)}</p><table><caption>變異數分量 · (mg/L)²</caption><thead><tr><th>來源</th><th>變異數</th></tr></thead><tbody>${uncertainty.components.map((item, index) => `<tr><th>${['未來樣品均值', '校正中心', '離中心的距離'][index]}</th><td>${fmt(item.variance)}</td></tr>`).join('')}</tbody></table><p>合計變異數 ${fmt(uncertainty.variance)} (mg/L)²；uₓ = √變異數。</p>` : ''}` : `<p>${esc(errors(fit))}</p>`;
    const conditions = research ? CALIBRATION_RESEARCH.conditions.filter(text => !text.includes('每天驗證組')) : [dataset.description];
    $('[data-cl-source-details]').innerHTML = `<p>${research ? '這裡列出同日 18 筆校正讀值；驗證組未加入擬合。' : '固定的原創教學標準值；調整未知訊號不修改這些點。'}</p><div class="cl-table-wrap"><table><caption>原始標準點 · x ${esc(dataset.xUnit)}；y ${esc(dataset.yUnit)}</caption><thead><tr><th scope="col">點</th><th scope="col">x</th><th scope="col">y</th></tr></thead><tbody>${dataset.standards.map((point, index) => `<tr><th scope="row">${index + 1}</th><td>${esc(point.displayX ?? String(point.x))}</td><td>${esc(point.displayY ?? String(point.y))}</td></tr>`).join('')}</tbody></table></div><ul>${conditions.map(text => `<li>${esc(text)}</li>`).join('')}</ul>${research ? `<ul>${CALIBRATION_RESEARCH.limits.map(text => `<li>${esc(text)}</li>`).join('')}</ul><p>${esc(CALIBRATION_RESEARCH.citation)}</p><p><a href="${esc(CALIBRATION_RESEARCH.sourceUrl)}" target="_blank" rel="noopener noreferrer">閱讀原研究表 1、2 ↗</a> · <a href="${esc(CALIBRATION_RESEARCH.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(CALIBRATION_RESEARCH.license)} ↗</a></p><p>${esc(CALIBRATION_RESEARCH.adaptation)}</p>` : '<p>假想直線的點估計與 u 只用作公式練習；不輸出食品分析的完整不確定度或確效結論。</p>'}`;
    for (const key of ['draft', 'revision']) { const field = $(`[data-cl-writing="${key}"]`); if (field.value !== writing[key]) field.value = writing[key]; }
    $('[data-cl-writing="draft"]').readOnly = writing.retained; $('[data-cl-writing-editor]').hidden = writing.retained; $('[data-cl-original-archive]').hidden = !writing.retained;
    $('[data-cl-action="retain-original"]').disabled = !writing.draft.trim();
    $('[data-cl-draft-context]').textContent = writing.draft ? `最後修改時：${contextText(writing.draftContext)}` : `目前：${contextText(exposureContext())}`;
    $('[data-cl-original]').textContent = writing.original;
    $('[data-cl-original-context]').textContent = `最後修改時：${contextText(writing.originalContext)}；保留時：${contextText(writing.retainedContext)}`;
    $('[data-cl-revision-context]').textContent = writing.revision ? `最後修改時：${contextText(writing.revisionContext)}${writing.stale ? '；資料或模型已改，請重新檢查自己的文字。' : ''}` : '尚未留下修訂。';
    drawJournal();
  }
  function invalidateModel() {
    const draft = state(); resetAnswer(draft.fit); resetAnswer(draft.uncertainty); markStale();
    for (const answer of draft.validations) { resetAnswer(answer); answer.targetShown = false; }
  }
  function moveTo(value) {
    if (!Object.hasOwn(steps, value) || value === step) return;
    step = value; changed(); render(); const heading = $('[data-cl-heading]'); heading.focus?.({preventScroll: true}); heading.scrollIntoView?.({block: 'start', behavior: 'instant'});
  }
  function changeResponse(value) {
    const draft = state(); if (draft.response === value) return;
    draft.response = value; markStale(); resetAnswer(draft.validations[0]); resetAnswer(draft.uncertainty); render();
  }
  function onInput(event) {
    if (disposed || !container.contains(event.target)) return;
    const writingKey = event.target?.dataset?.clWriting;
    if (writingKey === 'revision' || writingKey === 'draft' && !writing.retained) {
      writing[writingKey] = String(event.target.value); writing[writingKey + 'Context'] = exposureContext();
      if (writingKey === 'revision') writing.stale = false;
      changed(); render(); return;
    }
    if (isResearch()) return;
    const target = event.target?.closest?.('[data-cl-control]'); if (!target || !container.contains(target)) return;
    if (target.dataset.clControl === 'response') changeResponse(target.value);
    if (target.dataset.clControl === 'response-range') {
      const value = numeric(target.value);
      if (value !== null && value >= 12 && value <= 60 && Number.isInteger(value)) changeResponse(String(value)); else render();
    }
  }
  function onChange(event) {
    if (disposed) return;
    if (event.target === $('[data-cl-review]')) { const value = event.target.value; memory.review = typeof value === 'string' && /^saved-[1-9]\d*$/.test(value) && Number(value.slice(6)) <= memory.savedVersions.length ? value : ''; drawJournal(); return; }
    const target = event.target?.closest?.('[data-cl-control]'); if (!target || !container.contains(target)) return;
    const key = target.dataset.clControl, value = target.value, draft = state();
    if (key === 'source' && ['research', ...CALIBRATION_TEACHING_SCENARIOS.map(item => item.id)].includes(value)) { if (source !== value) markStale(); source = value; }
    else if (key === 'day' && CALIBRATION_RESEARCH.days.some(day => day.id === value)) { if (dayId !== value) markStale(); dayId = value; }
    else if (key === 'model' && ['free', 'origin'].includes(value)) { if (draft.mode !== value) { draft.mode = value; invalidateModel(); } }
    else if (key === 'point' && /^\d+$/.test(value) && Number(value) < data().standards.length) draft.point = Number(value);
    else if (key === 'sample' && isResearch() && /^[0-3]$/.test(value)) { const sample = Number(value); if (draft.sample !== sample) markStale(); draft.sample = sample; }
    else if (key === 'replicates' && ['1', '3', '9'].includes(value)) { const replicates = Number(value); if (draft.replicates !== replicates) markStale(); draft.replicates = replicates; resetAnswer(draft.uncertainty); }
    else if (key === 'response' || key === 'response-range') { onInput(event); return; }
    changed(); render();
  }
  function onClick(event) {
    if (disposed) return;
    const target = event.target?.closest?.('button'); if (!target || !container.contains(target) || target.disabled) return;
    if (target.dataset.clStep) { moveTo(target.dataset.clStep); return; }
    if (['fit', 'residual'].includes(target.dataset.clView)) { state().graph = target.dataset.clView; changed(); render(); return; }
    const choice = target.dataset.clChoice, labels = step === 'fit' ? fitChoices : step === 'validate' ? rangeChoices : uncertaintyChoices;
    if (target.dataset.clGroup === step && Object.hasOwn(labels, choice ?? '')) { Object.assign(currentAnswer(), {choice, checked: false, reference: false}); changed(); render(); return; }
    const action = target.dataset.clAction;
    if (action === 'previous' || action === 'next') { const keys = Object.keys(steps); moveTo(keys[keys.indexOf(step) + (action === 'next' ? 1 : -1)]); return; }
    if (action === 'check' && currentAnswer().choice) Object.assign(currentAnswer(), {checked: true, checkedSeen: true});
    else if (action === 'reference') Object.assign(currentAnswer(), {reference: true, referenceSeen: true});
    else if (action === 'reveal-target' && isResearch() && shown(state().validations[state().sample])) Object.assign(state().validations[state().sample], {targetShown: true, targetSeen: true});
    else if (action === 'use-linear') { source = 'linear'; state().mode = 'free'; state().response = '32'; invalidateModel(); }
    else if (action === 'select-summary') { const field = $('[data-cl-summary]'); field.focus(); field.select?.(); return; }
    else if (action === 'retain-original' && !writing.retained && writing.draft.trim()) {
      const original = Object.freeze({text: writing.draft, originalContext: writing.draftContext, retainedContext: exposureContext()});
      writing.original = original.text; writing.originalContext = original.originalContext; writing.retainedContext = original.retainedContext; writing.retained = true;
    } else if (action === 'save-summary') { save(); return; }
    else return;
    changed();
    render();
  }
  for (const key of detailKeys) { const panel = $(`[data-cl-details="${key}"]`); panel.open = memory.open[key]; panel.ontoggle = onToggle; }
  memory.views.add(drawJournal); container.addEventListener('click', onClick); container.addEventListener('change', onChange); container.addEventListener('input', onInput); render();
  return () => { if (disposed) return; syncDraft(); syncPanels(); disposed = true; memory.views.delete(drawJournal); for (const key of detailKeys) { const panel = $(`[data-cl-details="${key}"]`); if (panel?.ontoggle === onToggle) panel.ontoggle = null; } container.removeEventListener('click', onClick); container.removeEventListener('change', onChange); container.removeEventListener('input', onInput); };
}
