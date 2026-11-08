// Original reading data and exact bookkeeping; no heat-treatment or efficacy prediction.
export const PROTEIN_QUALITY_AXES_ID = 'protein-quality-axes';
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const QUALITY_AXES_DATA = freeze([
  {level: 0, tia: 100, per: 1.2}, {level: 1, tia: 55, per: 1.8},
  {level: 2, tia: 20, per: 2.1}, {level: 3, tia: 8, per: 2.1}
]);
export const QUALITY_AXES_SOURCES = freeze([
  {id: 'depth-per-method', label: 'Hegsted／FAO 1971：PER 的歷史定義與限制', url: 'https://www.fao.org/4/ae906e/ae906e24.htm', scope: '增重除以攝入蛋白質量的動物試驗指標；不等於人體吸收率，也不按比例換算整體營養價值。只借定義，不借本課數字。'},
  {id: 'depth-soy-rf', label: 'Takács 等 2022：抑制活性與標準化體外消化研究', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9525500/', scope: '研究測量 TIA、KTI／BBI 及標準化體外消化後殘餘抑制活性；不是本課的 PER 資料，也沒有提供人體消化率。不能拼成同批實測曲線。'}
]);
export const QUALITY_AXES_CASES = freeze([
  {id: 'reading', title: '1．先找符號、軸與單位', answerType: 'numeric', prompt: '依目前選定的處理等級與符號，從規格化高度及對應軸讀回原值，並選單位。', options: [{id: 'percent', label: '相對抑制活性 %'}, {id: 'per', label: 'PER：g 增重／g 蛋白'}]},
  {id: 'scale', title: '2．改刻度，資料變了嗎？', answerType: 'choice', prompt: '把右軸上限從 3 改成 6：如何解讀同一資料的高度及原值？', options: [{id: 'half-data', label: 'PER 原值減半，表示營養品質下降'}, {id: 'same-data', label: '原值不變；只改右軸系列的投影高度'}, {id: 'both-halved', label: '左、右兩系列的原值與高度都減半'}]},
  {id: 'percalc', title: '3．從分子分母算 PER', answerType: 'numeric', prompt: '另一個原創算例：試驗動物增重 45 g，攝入蛋白質 25 g。PER 是多少 g／g？這不是上方四點的真實動物試驗。', options: []},
  {id: 'intersection', title: '4．相交不等於相等', answerType: 'choice', prompt: '在雙軸圖上兩系列若有相同高度，能否直接說兩個量的數值相等？', options: [{id: 'equal-values', label: '可以；只要相交就是相同數值'}, {id: 'different-units', label: '不能；兩軸尺度與單位不同，先各自讀值'}, {id: 'equal-effects', label: '可以；表示兩種生物效果相同'}]},
  {id: 'causality', title: '5．一起變化，還缺哪種證據？', answerType: 'choice', prompt: '本課指定表中抑制活性降低、PER 上升後趨平。它能否單獨證明 PER 只由抑制活性決定？', options: [{id: 'sole-cause', label: '可以；只要兩者反向變化就證明唯一原因'}, {id: 'needs-evidence', label: '不能；仍需分開量測及能辨別原因的對照'}, {id: 'digestibility-is-per', label: '可以；體外消化讀值就是 PER'}]},
  {id: 'extrapolate', title: '6．表外的處理，先留未知', answerType: 'choice', prompt: '只提供處理等級 0–3，能否把「過熱後 PER 必下降」當作此表已觀察到的結果？', options: [{id: 'must-drop', label: '可以；直接把第 4 點後的線往下畫'}, {id: 'must-rise', label: '可以；抑制活性降低就保證一直上升'}, {id: 'unknown', label: '不能；表外未知，機制假說需要另外測試'}]}
]);
const cases = new Map(QUALITY_AXES_CASES.map(item => [item.id, item]));
const expectedChoice = {scale: 'same-data', intersection: 'different-units', causality: 'needs-evidence', extrapolate: 'unknown'};
const requireDraft = draft => { if (!draft || typeof draft !== 'object' || !draft.trials || typeof draft.trials !== 'object' || Array.isArray(draft.trials)) throw new TypeError('A quality-axes draft is required'); return draft; };
const text = value => typeof value === 'string' ? value : '';
const lock = (value, key, item) => Object.defineProperty(value, key, {value: item, writable: false, configurable: false, enumerable: true});

export function readQualityAxesPoint(level, series, rightMax = 3) {
  if (!Number.isInteger(level) || level < 0 || level > 3 || !['tia', 'per'].includes(series) || ![3, 6].includes(rightMax)) throw new RangeError('Unknown point, series or axis range');
  const value = QUALITY_AXES_DATA[level][series], axisMax = series === 'tia' ? 100 : rightMax;
  return {level, series, symbol: series === 'tia' ? '○' : '□', value, unit: series === 'tia' ? 'percent' : 'per', axisMax, height: value / axisMax};
}

export function calculatePER(gain, intake) {
  if (!Number.isFinite(gain) || !Number.isFinite(intake) || gain < 0 || intake <= 0) throw new RangeError('PER needs non-negative gain and positive protein intake');
  const result = gain / intake;
  if (!Number.isFinite(result)) throw new RangeError('PER is outside the finite numeric range');
  return result;
}

export function parseQualityAxesAnswer(raw) {
  if (typeof raw !== 'string' || !raw.trim() || !/^\+?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim())) return null;
  const value = Number(raw); return Number.isFinite(value) && value >= 0 ? value : null;
}

export function createQualityAxesDraft() { return {caseId: 'reading', level: 1, series: 'per', rightMax: 3, trials: {}, synthesis: '', details: {}}; }
export function getQualityAxesCase(id) { const item = cases.get(id); if (!item) throw new RangeError('Unknown quality-axes case'); return item; }
export function setQualityAxesControl(draft, key, value) {
  requireDraft(draft);
  if (key === 'caseId') getQualityAxesCase(value);
  else if (key === 'level') { if (!Number.isInteger(value) || value < 0 || value > 3) throw new RangeError('Unknown processing level'); }
  else if (key === 'series') { if (!['tia', 'per'].includes(value)) throw new RangeError('Unknown series'); }
  else if (key === 'rightMax') { if (![3, 6].includes(value)) throw new RangeError('Unknown right-axis maximum'); }
  else throw new RangeError('Unknown quality-axes control');
  draft[key] = value; return draft;
}
function trialKey(draft) {
  getQualityAxesCase(draft.caseId); readQualityAxesPoint(draft.level, draft.series, draft.rightMax);
  return draft.caseId === 'reading' ? `reading/${draft.level}/${draft.series}/${draft.rightMax}` : draft.caseId === 'scale' ? `scale/${draft.level}/${draft.series}` : draft.caseId;
}
export function getQualityAxesTrial(draft) {
  requireDraft(draft); const key = trialKey(draft);
  if (!Object.hasOwn(draft.trials, key)) draft.trials[key] = {response: '', choice: '', reason: '', checked: false, first: null, checkedSnapshot: null, revision: ''};
  return draft.trials[key];
}
export function canCheckQualityAxes(draft) {
  const item = getQualityAxesCase(draft.caseId), trial = getQualityAxesTrial(draft);
  if (trial.checked) return false;
  if (item.answerType === 'numeric') return parseQualityAxesAnswer(trial.response) !== null && (item.id !== 'reading' || ['percent', 'per'].includes(trial.choice));
  return item.options.some(option => option.id === trial.choice);
}
function explanation(draft, point) {
  switch (draft.caseId) {
    case 'reading': return `${point.symbol} 在等級 ${point.level} 的原值為 ${point.value} ${point.unit === 'percent' ? '% 相對抑制活性' : 'g 增重／g 蛋白'}；高度 ${point.height.toFixed(4)} × 對應軸上限 ${point.axisMax} 才讀回原值。另一軸不適用。`;
    case 'scale': return draft.series === 'per' ? `同一個 PER ${point.value} g／g，右軸上限從 3 變成 6，高度由 ${(point.value / 3).toFixed(4)} 變為 ${(point.value / 6).toFixed(4)}；數字沒有減半。` : `○ 使用固定左軸 0–100%，高度仍為 ${point.height.toFixed(4)}；改右軸只影響 □ 的投影，兩系列原值都不變。`;
    case 'percalc': return 'PER＝45 g 增重／25 g 攝入蛋白＝1.8 g／g。分子不是吸收蛋白量，所以不能乘100改稱180%人體吸收率；PER也不是按比例換算的整體營養價值。';
    case 'intersection': return '兩個位置可相同，卻各自除以不同軸上限；例如0.6這個高度可對應左軸60%，或右軸上限3時的PER1.8 g／g。相同畫面位置既不是數值相等，也不是效果相等。';
    case 'causality': return '表只給兩個觀察量的共同變化，沒有排除其他抗營養因子、底物可及性或化學損傷等原因。需要適合的對照及各項量測，不能由此決定唯一機制。原研究的體外消化後殘餘抑制活性，也不能替代PER。';
    case 'extrapolate': return '等級2和3的PER都指定為2.1，表沒有觀測更高處理等級。可提出更強處理可能造成損傷的假說，但此表未顯示下降，更不能由這四點推薦真實加熱或安全條件。';
    default: throw new RangeError('Unknown case');
  }
}
export function checkQualityAxes(draft) {
  const trial = getQualityAxesTrial(draft); if (trial.checked) return true;
  if (!canCheckQualityAxes(draft)) return false;
  const point = readQualityAxesPoint(draft.level, draft.series, draft.rightMax);
  const numeric = parseQualityAxesAnswer(trial.response), expectedValue = draft.caseId === 'reading' ? point.value : draft.caseId === 'percalc' ? calculatePER(45, 25) : null;
  const correct = expectedValue === null ? trial.choice === expectedChoice[draft.caseId] : Math.abs(numeric - expectedValue) <= 1e-9 * Math.max(1, expectedValue) && (draft.caseId !== 'reading' || trial.choice === point.unit);
  const snapshot = freeze({caseId: draft.caseId, level: draft.level, series: draft.series, rightMax: draft.rightMax, response: text(trial.response), choice: text(trial.choice), reason: text(trial.reason), expectedValue, correct, explanation: explanation(draft, point), point: {...point}});
  lock(trial, 'first', snapshot); lock(trial, 'checkedSnapshot', snapshot); lock(trial, 'reason', snapshot.reason); lock(trial, 'checked', true); return true;
}
export function buildQualityAxesSummary(draft) {
  requireDraft(draft); trialKey(draft);
  const lines = ['蛋白品質雙軸：原創讀圖與證據練習', '所有等級、符號、數字均為本課原創指定值，非官方圖或實測研究；無實際溫時。', `目前控制：${draft.caseId}；等級${draft.level}；${draft.series}；右軸上限${draft.rightMax}`];
  const entries = Object.entries(draft.trials).filter(([, trial]) => trial.checked || trial.response || trial.choice || trial.reason || trial.revision).sort(([a], [b]) => a.localeCompare(b));
  for (const [key, trial] of entries) {
    lines.push('', `題目槽：${key}`, `目前答案文字：${text(trial.response)}`, `目前選項：${text(trial.choice)}`, '核對前理由：', text(trial.reason));
    if (trial.checkedSnapshot) { const s = trial.checkedSnapshot; lines.push(`首次核對條件：${s.caseId}；等級${s.level}；${s.series}；右軸上限${s.rightMax}`, `初答（首次核對時）：${s.response}；${s.choice}`, `首次核對：${s.correct ? '符合本題定義與資料' : '需修訂'}`, '核對時理由：', s.reason, '核對說明：', s.explanation); }
    else lines.push('尚未核對；不計為答對。');
    lines.push('修訂：', text(trial.revision));
  }
  if (!entries.length) lines.push('尚無作答；未核對不計為答對。');
  lines.push('', '我的整合短答：', text(draft.synthesis), '', 'PER是指定動物試驗指標；數據投影與來源端點須分開。自由文字未自動評分，未驗證學習成果。');
  return lines.join('\n');
}
