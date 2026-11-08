// Evidence explorer: published observations, not a pharmacokinetic simulator.
export const GLYCOSIDE_ABSORPTION_ID = 'glycoside-absorption';

const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export const GLYCOSIDE_CASES = freeze([
  {id: 'q3glc', label: '槲皮素 3-O-葡萄糖苷', name: 'quercetin-3-O-glucoside', position: '糖接於槲皮素的 3-O 位', sugars: ['Glc'], hydrolysed: true},
  {id: 'q4glc', label: '槲皮素 4′-O-葡萄糖苷', name: 'quercetin-4′-O-glucoside', position: '糖接於槲皮素的 4′-O 位', sugars: ['Glc'], hydrolysed: true},
  {id: 'rutin', label: 'Rutin：槲皮素 3-O-芸香糖苷', name: 'quercetin-3-O-rutinoside', position: '3-O 位接芸香糖：α-L-Rha(1→6)Glc；Rha 接在 Glc 上', sugars: ['Glc', 'Rha'], hydrolysed: false}
]);

export const SOURCES = freeze({
  hollman1997: {label: 'Hollman 等（1997）：9 人飲食交叉比較', url: 'https://pubmed.ncbi.nlm.nih.gov/9414116/', locator: 'Table 1：Tmax、AUC；Table 2：劑量；§3.1：採血限制；§4.1：分析範圍'},
  day2000: {label: 'Day 等（2000）：純化羊小腸 LPH 的體外研究', url: 'https://doi.org/10.1016/S0014-5793(00)01211-4', locator: 'Methods §2；Results、Table 1、Discussion、Fig. 4'},
  amaretti2015: {label: 'Amaretti 等（2015）：離體糞便菌體的 rutin 轉化', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4425173/', locator: '§2.2、§3.1–3.2、§4；不是人體吸收率'}
});

// Dose means and SD: Table 2; Tmax and AUC means and SD: Table 1.
// Rutin's 331 ± 7 is Table 2, rather than treating Methods' 331 as an exact dose.
export const HUMAN_STUDY = freeze({
  n: 9,
  referenceId: 'onion',
  measurement: '酸水解可回收的槲皮素當量',
  rows: [
    {id: 'onion', label: '洋蔥', food: '煎洋蔥', dose: {mean: 225, sd: 43}, tmax: {mean: 0.70, sd: 1.08}, auc: {mean: 2330, sd: 849}},
    {id: 'apple', label: '蘋果', food: '蘋果泥加蘋果皮', dose: {mean: 325, sd: 7}, tmax: {mean: 2.51, sd: 0.72}, auc: {mean: 1061, sd: 375}},
    {id: 'rutin', label: '純 rutin', food: '純 rutin 膠囊', dose: {mean: 331, sd: 7}, tmax: {mean: 9.30, sd: 1.80}, auc: {mean: 983, sd: 978}}
  ]
});

export const METRICS = freeze({
  tmax: {label: '達峰時間 Tmax', unit: 'h', decimals: 2, kind: 'published', note: '洋蔥組 4/9 人在第一個餐後採血點 0.5 h 已達觀察最大值；刊載 Tmax 可能高估真正峰值時間。'},
  auc: {label: '原始 AUC₀–₃₆h', unit: 'h·ng/mL', decimals: 0, kind: 'published', note: '原始 AUC 是指定 0–36 h 觀察窗的血漿暴露指標；三組劑量與食品基質並不相同。'},
  relative: {label: '劑量校正、相對洋蔥', unit: '%', decimals: 1, kind: 'derived', note: '均值比估算：洋蔥設為 100%。沒有個別配對資料，不計算此比值的 SD、信賴區間或 p 值。'}
});

function findRow(id) {
  const row = HUMAN_STUDY.rows.find(item => item.id === id);
  if (!row) throw new RangeError(`Unknown human comparison: ${id}`);
  return row;
}

export function getGlycosideCase(id) {
  const selected = GLYCOSIDE_CASES.find(item => item.id === id);
  if (!selected) throw new RangeError(`Unknown glycoside: ${id}`);
  return selected;
}

export function doseNormalizedRelative(id, referenceId = HUMAN_STUDY.referenceId) {
  const row = findRow(id), reference = findRow(referenceId);
  return (row.auc.mean / row.dose.mean) / (reference.auc.mean / reference.dose.mean) * 100;
}

export function humanMetricRows(metric = 'tmax') {
  if (!Object.hasOwn(METRICS, metric)) throw new RangeError(`Unknown metric: ${metric}`);
  return HUMAN_STUDY.rows.map(row => ({
    id: row.id, label: row.label, food: row.food,
    doseMean: row.dose.mean, doseSD: row.dose.sd,
    mean: metric === 'relative' ? doseNormalizedRelative(row.id) : row[metric].mean,
    sd: metric === 'relative' ? null : row[metric].sd,
    kind: METRICS[metric].kind, unit: METRICS[metric].unit
  }));
}

export const QUESTIONS = freeze([
  {
    id: 'reference', prompt: '相對洋蔥的估算顯示 100%，代表什麼？',
    options: [
      {id: 'reference', label: '洋蔥是劑量校正 AUC 的比較基準'},
      {id: 'absorbed', label: '服用量有 100% 被人體吸收'},
      {id: 'same-dose', label: '三組吃下相同的槲皮素劑量'}
    ], correct: 'reference',
    explanation: '100% 是把洋蔥自身的 AUC／劑量比設為參考值。這不是絕對吸收率，也不表示三組劑量相同。'
  },
  {
    id: 'site', prompt: 'Rutin 的刊載 Tmax 較晚，能直接判定在哪裡吸收嗎？',
    options: [
      {id: 'colon', label: '可以，較慢峰值就證明完全在大腸吸收'},
      {id: 'not-enough', label: '不能，時間差還需要相符的部位與機制證據'},
      {id: 'none', label: '可以，較慢就等於沒有被吸收'}
    ], correct: 'not-enough',
    explanation: 'Tmax 描述觀察到的峰值時間，並不單獨指定吸收部位。腸菌的離體轉化證據也不能直接換算人體吸收貢獻。'
  },
  {
    id: 'enzyme', prompt: '純化 LPH 能水解某個糖苷，直接支持哪個結論？',
    options: [
      {id: 'bioavailability', label: '它在人體一定有較高生物利用率'},
      {id: 'transport', label: '它已證實由 SGLT1 完整運入細胞'},
      {id: 'in-vitro', label: '該底物在所測體外條件下可被水解'}
    ], correct: 'in-vitro',
    explanation: 'Day 研究使用純化羊小腸 LPH。這可回答指定底物的體外水解，不能直接定量人體生物利用率或證明跨膜入口。'
  }
]);

export function createGlycosideDraft() {
  return {
    version: 1, panel: 'mechanism', caseId: 'q3glc', phase: 'before', metric: 'tmax', observation: '',
    details: {},
    answers: Object.fromEntries(QUESTIONS.map(q => [q.id, {first: null, current: null, checked: false, checkedSelection: null}]))
  };
}

function questionFor(id) {
  const question = QUESTIONS.find(q => q.id === id);
  if (!question) throw new RangeError(`Unknown question: ${id}`);
  return question;
}

export function chooseGlycosideAnswer(draft, questionId, optionId) {
  const question = questionFor(questionId);
  if (!question.options.some(option => option.id === optionId)) throw new RangeError(`Unknown answer: ${optionId}`);
  const answer = draft.answers[questionId];
  if (answer.first === null) answer.first = optionId;
  answer.current = optionId;
  return answer;
}

export function checkGlycosideAnswer(draft, questionId) {
  questionFor(questionId);
  const answer = draft.answers[questionId];
  if (answer.current === null) return false;
  if (!answer.checked) answer.checkedSelection = answer.current;
  answer.checked = true;
  return true;
}

const optionLabel = (question, id) => question.options.find(option => option.id === id)?.label || '尚未選擇';
const decimal = (value, places) => value.toFixed(places);

export function buildGlycosideSummary(draft) {
  const selected = getGlycosideCase(draft.caseId), metric = METRICS[draft.metric];
  if (!metric) throw new RangeError('Unknown summary metric');
  const observed = draft.phase === 'before' ? '尚未揭示反應結果' : selected.hydrolysed ? '所測體外條件下觀察到水解' : '所測體外條件下未觀察到水解；不等於零吸收';
  const lines = [
    '【配醣體吸收：機制與人體證據】',
    `機制個案：${selected.label}；${observed}。Day 2000：純化羊小腸 LPH，不是人體吸收率。`,
    `人體比較：Hollman 1997，同一批 n=9；${metric.label}${draft.metric === 'relative' ? '（均值比估算）' : '（刊載 mean ± SD）'}。`
  ];
  for (const row of humanMetricRows(draft.metric)) {
    const value = draft.metric === 'relative' ? `${decimal(row.mean, 1)}%（未估 SD／CI）` : `${decimal(row.mean, metric.decimals)} ± ${decimal(row.sd, metric.decimals)} ${metric.unit}`;
    lines.push(`${row.food}：劑量 ${row.doseMean} ± ${row.doseSD} μmol；${value}`);
  }
  if (draft.metric === 'relative') lines.push('估算式：(組別 AUC 均值／劑量均值) ÷ (洋蔥 AUC 均值／劑量均值) ×100；100% 是參考基準，不是完全吸收。');
  lines.push(metric.note);
  lines.push('分析量為酸水解可回收的槲皮素當量，不含不能水解的甲基化代謝物；食品、糖種、劑量未單獨控制，不推健康效益。');
  for (const question of QUESTIONS) {
    const answer = draft.answers[question.id];
    lines.push(`判讀「${question.prompt}」首次：${optionLabel(question, answer.first)}；${answer.checked ? `核對時：${optionLabel(question, answer.checkedSelection)}；核對後目前：${optionLabel(question, answer.current)}` : `尚未核對；目前：${optionLabel(question, answer.current)}`}。`);
  }
  if (draft.observation.trim()) lines.push(`我的觀察：${draft.observation}`);
  lines.push(`來源：${SOURCES.hollman1997.url}；${SOURCES.day2000.url}；${SOURCES.amaretti2015.url}`);
  return lines.join('\n');
}

// Session-only drafts are scoped by their owner AND lesson key. No formal note storage is touched.
export function createGlycosideSessionStore() {
  const owners = new WeakMap();
  return {
    get(owner, key = GLYCOSIDE_ABSORPTION_ID) {
      if (!owner || !['object', 'function'].includes(typeof owner)) throw new TypeError('A draft owner is required');
      let keys = owners.get(owner);
      if (!keys) { keys = new Map(); owners.set(owner, keys); }
      if (!keys.has(key)) {
        const draft = createGlycosideDraft();
        keys.set(key, {draft, pending: new Map(), listeners: new Set(), message: '', observedSummary: buildGlycosideSummary(draft)});
      }
      return keys.get(key);
    }
  };
}

export function subscribeGlycosideSession(record, listener) {
  record.listeners.add(listener);
  return () => record.listeners.delete(listener);
}

function notify(record) {
  for (const listener of record.listeners) listener();
}

export function markGlycosideDraftChanged(record) {
  const summary = buildGlycosideSummary(record.draft);
  if (summary === record.observedSummary) return false;
  record.observedSummary = summary;
  record.message = record.pending.size ? '正在附加保存當時的內容；目前的新變更尚未附加。' : '目前變更尚未附加到本課筆記。';
  notify(record);
  return true;
}

export function refreshGlycosideSaveFeedback(record) {
  const changed = markGlycosideDraftChanged(record);
  // A remount has no fresh evidence that a previously saved summary is still in the host note.
  if (!changed && record.pending.size === 0 && record.message === '已附加到本課筆記。') record.message = '';
}

export function saveGlycosideSummary(record, onSaveSummary) {
  const summary = buildGlycosideSummary(record.draft);
  if (record.pending.has(summary)) return record.pending.get(summary);
  record.observedSummary = summary;
  record.message = '正在附加到本課筆記…';
  // Defer the callback so pending is registered before a callback can synchronously remount the lab.
  const request = Promise.resolve().then(async () => {
    let success = false;
    try { success = typeof onSaveSummary === 'function' && await onSaveSummary(summary) === true; } catch { success = false; }
    if (success) {
      record.message = buildGlycosideSummary(record.draft) === summary ? '已附加到本課筆記。' : '已附加保存當時的內容；目前的新變更尚未附加。';
    } else {
      record.message = '未附加成功；選擇和觀察仍保留，可再試一次。';
    }
    record.pending.delete(summary);
    notify(record);
    return {status: success ? 'saved' : 'failed', summary};
  });
  record.pending.set(summary, request);
  notify(record);
  return request;
}
