/** Given-concentration/threshold arithmetic, not a psychophysical prediction.
 * All numerical scenarios are original hypothetical examples. No empirical threshold constants.
 * Units normalize within a mass/volume or mass/mass basis, never across those bases.
 */
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
export const SENSORY_EXPERIMENT_IDS = Object.freeze(['sensory-channels', 'sensory-activity-value', 'sensory-taste-evidence']);

const CONTEXT = {
  id: 'hypothetical-common-assessment',
  label: '原創假想 · 共用測試條件',
  conditions: '假設相同 20 °C、呈現容器、評定群體及操作程序；閾值類型依各筆明列。不是實測或標準規定值。',
};
const quantity = (value, unit = 'µg/L', matrix = '示例水基質') => ({value, unit, matrix, phase: 'liquid'});
function exampleRecord(id, concentration, threshold) {
  return {id, label: `示例分子 ${id.toUpperCase()}`, context: {...CONTEXT},
    concentration, threshold: {...threshold, thresholdType: 'detection', route: 'orthonasal'}};
}
function exampleScenario(id, label, description, left, right) {
  return {id, label, provenance: 'original-hypothetical', context: {...CONTEXT},
    description: `原創假想數字，非真實分子閾值。${description}`, left, right};
}
const rankingLeft = () => exampleRecord('a', quantity(100), quantity(50));
const rankingRight = () => exampleRecord('b', quantity(20), quantity(2));
const matrixRight = rankingRight();
matrixRight.concentration.matrix = matrixRight.threshold.matrix = '示例 12% 乙醇水基質';
const definitionRight = rankingRight();
definitionRight.threshold.thresholdType = 'recognition';
const mismatchedRight = rankingRight();
mismatchedRight.threshold.matrix = '示例 12% 乙醇水基質';
export const SENSORY_SCENARIOS = deepFreeze([
  exampleScenario('ranking', '濃度高，OAV 也較高？', '兩筆共用基質與偵測閾值定義；先比較濃度，再比較 c/T。', rankingLeft(), rankingRight()),
  exampleScenario('units', '先讓單位一致', '與第一組代表相同濃度及閾值，只改用不同質量單位。',
    exampleRecord('a', quantity(0.1, 'mg/L'), quantity(50)),
    exampleRecord('b', quantity(20000, 'ng/L'), quantity(0.002, 'mg/L'))),
  exampleScenario('matrix-mismatch', '分別可算，能互相比嗎？', '每筆內部基質配對，但 A 與 B 的基質不同；不是乙醇影響的實測量。', rankingLeft(), matrixRight),
  exampleScenario('threshold-definition-mismatch', '偵測與辨識不能混排', '基質相同，B 改用辨識閾值；數字相同不表示定義相同。', rankingLeft(), definitionRight),
  exampleScenario('concentration-threshold-mismatch', '濃度和閾值來自同一基質嗎？', 'B 的濃度在水基質，閾值卻來自另一示例基質，該筆不能計算。', rankingLeft(), mismatchedRight),
]);

/** Returns an editable scenario copy. Frozen presets remain the original teaching values. */
export function createSensoryScenario(id = 'ranking') {
  const source = SENSORY_SCENARIOS.find(item => item.id === id);
  if (!source) throw new RangeError('未知的感官閾值教學情境。');
  return JSON.parse(JSON.stringify(source));
}

const UNITS = Object.freeze({
  'mg/L': {factor: 1000, basis: 'mass-volume', unit: 'µg/L'},
  'µg/L': {factor: 1, basis: 'mass-volume', unit: 'µg/L'},
  'ng/L': {factor: 0.001, basis: 'mass-volume', unit: 'µg/L'},
  'mg/kg': {factor: 1000, basis: 'mass-mass', unit: 'µg/kg'},
  'µg/kg': {factor: 1, basis: 'mass-mass', unit: 'µg/kg'},
  'ng/kg': {factor: 0.001, basis: 'mass-mass', unit: 'µg/kg'},
});
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = value => typeof value === 'string' && value.trim().length > 0;
const canonicalUnit = unit => typeof unit === 'string' ? unit.replaceAll('μ', 'µ') : unit;
const makeIssue = (code, message) => ({code, message});
const validMagnitude = (value, original) => Number.isFinite(value) && !(original > 0 && value === 0);

function snapshot(record) {
  if (!isObject(record)) return null;
  const pick = (object, keys) => {
    if (!isObject(object)) return null;
    return Object.fromEntries(keys.map(key => [key, typeof object[key] === 'number' && !Number.isFinite(object[key]) ? null : object[key]]));
  };
  return {id: record.id, label: record.label,
    context: pick(record.context, ['id', 'label', 'conditions']),
    concentration: pick(record.concentration, ['value', 'unit', 'matrix', 'phase']),
    threshold: pick(record.threshold, ['value', 'unit', 'matrix', 'phase', 'thresholdType', 'route'])};
}

/**
 * context describes the conditions asserted to apply to BOTH values in this record.
 * A usable recognition-threshold ratio is labeled as such, not as detection OAV.
 * No probability, intensity, total-mixture value or perceptual certainty is inferred.
 */
export function evaluateActivityValue(record) {
  const out = {usable: false, value: null, comparisonIssues: [], interpretation: '',
    convertedUnits: null, thresholdRelation: null, input: snapshot(record)};
  const fail = (code, message) => out.comparisonIssues.push(makeIssue(code, message));
  if (!isObject(record)) {
    fail('invalid-record', '需要一筆濃度與閾值紀錄。');
    out.interpretation = '資料不完整，不能計算。';
    return out;
  }
  if (!isObject(record.context) || !isText(record.context.id) || !isText(record.context.conditions))
    fail('missing-context', '需明列濃度與閾值共用的測試條件與評定基準。');
  const c = record.concentration, t = record.threshold;
  for (const [key, item, title] of [['concentration', c, '濃度'], ['threshold', t, '閾值']]) {
    if (!isObject(item)) { fail(`invalid-${key}`, `${title}紀錄不完整。`); continue; }
    if (typeof item.value !== 'number' || !Number.isFinite(item.value) || item.value < 0 || (key === 'threshold' && item.value === 0))
      fail(`invalid-${key}-value`, `${title}必須是${key === 'threshold' ? '大於零' : '大於或等於零'}的有限數字。`);
    if (!Object.hasOwn(UNITS, canonicalUnit(item.unit))) fail(`invalid-${key}-unit`, `${title}單位僅接受 mg/L、µg/L、ng/L、mg/kg、µg/kg、ng/kg；μ 與 µ 視為同符號。`);
    if (!isText(item.matrix)) fail(`invalid-${key}-matrix`, `${title}需明列基質。`);
    if (!['liquid', 'gas'].includes(item.phase)) fail(`invalid-${key}-phase`, `${title}需明列液相或氣相。`);
  }
  if (isObject(t)) {
    if (!['detection', 'recognition'].includes(t.thresholdType)) fail('invalid-threshold-definition', '閾值定義只能是偵測或辨識。');
    if (!['orthonasal', 'retronasal'].includes(t.route)) fail('invalid-route', '需指定鼻前或鼻後嗅覺評定途徑。');
  }
  if (isObject(c) && isObject(t)) {
    if (c.matrix !== t.matrix) fail('matrix-mismatch', '濃度與閾值的基質不同，不能相除。');
    if (c.phase !== t.phase) fail('phase-mismatch', '濃度與閾值的相別不同，不能用本模型跨相換算。');
    const cu = UNITS[canonicalUnit(c.unit)], tu = UNITS[canonicalUnit(t.unit)];
    if (cu && tu && cu.basis !== tu.basis) fail('basis-mismatch', '質量／體積與質量／質量基準不同；沒有密度資料，不可互轉。');
  }
  if (out.comparisonIssues.length) { out.interpretation = '基準或資料不符合，不能計算此比值。'; return out; }
  const cu = UNITS[canonicalUnit(c.unit)], tu = UNITS[canonicalUnit(t.unit)];
  const normalizedC = c.value * cu.factor, normalizedT = t.value * tu.factor;
  if (!validMagnitude(normalizedC, c.value) || !validMagnitude(normalizedT, t.value)) {
    fail('numeric-range', '單位換算超出可表示的數值範圍，不能計算。');
    out.interpretation = '數值換算失敗。'; return out;
  }
  const value = normalizedC / normalizedT;
  if (!validMagnitude(value, normalizedC)) {
    fail('numeric-range', '比值超出可表示的數值範圍，不能以無限大或零代替。');
    out.interpretation = '比值計算失敗。'; return out;
  }
  out.usable = true;
  out.value = value;
  out.convertedUnits = {concentration: normalizedC, threshold: normalizedT, unit: cu.unit, basis: cu.basis};
  out.thresholdRelation = value < 1 ? 'below' : value > 1 ? 'above' : 'equal';
  out.interpretation = t.thresholdType === 'detection'
    ? '這是相對指定偵測閾值的 OAV，可用作篩選線索；不是感知強度或偵測機率。'
    : '這是相對指定辨識閾值的 c/T；不可直接當作偵測閾值 OAV，或與它混排。';
  return out;
}

function numericOrder(left, right) {
  // Only absorb round-off from equivalent unit conversions, not sensory uncertainty.
  if (left === right || Math.abs(left - right) <= 8 * Number.EPSILON * Math.max(Math.abs(left), Math.abs(right))) return 'equal';
  return left > right ? 'left' : 'right';
}

/** Ratios mean left/right. A zero denominator has no finite ratio, though ordering remains defined. */
export function compareActivityValues(leftRecord, rightRecord) {
  const left = evaluateActivityValue(leftRecord), right = evaluateActivityValue(rightRecord);
  const out = {usable: false, left, right, comparisonIssues: [], concentrationOrder: null,
    activityOrder: null, concentrationRatio: null, activityRatio: null,
    ratioReasons: {concentration: null, activity: null}, interpretation: ''};
  const fail = (code, message) => out.comparisonIssues.push(makeIssue(code, message));
  if (!left.usable || !right.usable) {
    for (const [side, result] of [['left', left], ['right', right]]) for (const item of result.comparisonIssues)
      out.comparisonIssues.push({...item, side});
  } else {
    if (leftRecord.concentration.matrix !== rightRecord.concentration.matrix) fail('matrix-mismatch', '兩筆基質不同；各自可算不代表可直接排名。');
    if (leftRecord.concentration.phase !== rightRecord.concentration.phase) fail('phase-mismatch', '兩筆相別不同，不能直接比較。');
    if (leftRecord.threshold.thresholdType !== rightRecord.threshold.thresholdType) fail('threshold-definition-mismatch', '偵測與辨識閾值定義不同，不能混合排名。');
    if (leftRecord.threshold.route !== rightRecord.threshold.route) fail('route-mismatch', '鼻前與鼻後評定途徑不同，不能直接比較。');
    if (leftRecord.context.id !== rightRecord.context.id || leftRecord.context.conditions !== rightRecord.context.conditions)
      fail('context-mismatch', '兩筆的測試條件或評定基準不同，不能直接比較。');
    if (left.convertedUnits.basis !== right.convertedUnits.basis) fail('basis-mismatch', '兩筆分別按體積與質量表示濃度，不能直接比較。');
  }
  if (out.comparisonIssues.length) { out.interpretation = '比較基準未對齊，保留原值，不作高低結論。'; return out; }
  const lc = left.convertedUnits.concentration, rc = right.convertedUnits.concentration;
  for (const [name, numerator, denominator] of [['concentration', lc, rc], ['activity', left.value, right.value]]) {
    if (denominator === 0) { out.ratioReasons[name] = '右側為零，左／右比值未定義。'; continue; }
    const ratio = numerator / denominator;
    if (!validMagnitude(ratio, numerator)) fail('numeric-range', '兩筆比值超出可表示範圍；不產生無限大或零的比較結果。');
    else out[`${name}Ratio`] = ratio;
  }
  if (out.comparisonIssues.length) {
    out.concentrationRatio = out.activityRatio = null;
    out.interpretation = '數值範圍不支持這項比較。'; return out;
  }
  out.usable = true;
  out.concentrationOrder = numericOrder(lc, rc);
  out.activityOrder = numericOrder(left.value, right.value);
  out.interpretation = '濃度排名與 c/T 排名回答不同問題；比值較高不表示聞起來同比例更強，也不能把兩個值相加預測混合物。';
  return out;
}
export const SENSORY_SOURCES = deepFreeze([
  {
    "id": "sensory-source-nidcd-taste",
    "title": "Taste Disorders — How does your sense of taste work?",
    "url": "https://www.nidcd.nih.gov/health/taste-disorders",
    "publisher": "NIH / NIDCD (updated 2023)"
  },
  {
    "id": "sensory-source-nidcd-smell",
    "title": "Smell Disorders — How does your sense of smell work?",
    "url": "https://www.nidcd.nih.gov/health/smell-disorders",
    "publisher": "NIH / NIDCD (updated 2023)"
  },
  {
    "id": "sensory-source-taste-measures-2015",
    "title": "The Relationships Between Common Measurements of Taste Function",
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4475569/",
    "publisher": "Webb, Bolhuis, Cicerale, Hayes & Keast; Chemosensory Perception 8:11–18 (2015)"
  },
  {
    "id": "sensory-source-mixtures-2012",
    "title": "Perceptual Characterization and Analysis of Aroma Mixtures Using Gas Chromatography Recomposition-Olfactometry",
    "url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0042693",
    "publisher": "Johnson, Hirson & Ebeler; PLOS ONE 7(8):e42693 (2012)"
  },
  {
    "id": "sensory-source-vanillin",
    "title": "Vanillin: Molecule of the Week",
    "url": "https://www.acs.org/molecule-of-the-week/archive/v/vanillin.html",
    "publisher": "American Chemical Society (2016; updated 2023)"
  },
  {
    "id": "sensory-source-capsaicin",
    "title": "Capsaicin: Molecule of the Week",
    "url": "https://www.acs.org/molecule-of-the-week/archive/c/capsaicin.html",
    "publisher": "American Chemical Society (2008; updated 2018)"
  },
  {
    "id": "sensory-source-oav-niu-2020",
    "title": "Evaluation of Perceptual Interactions between Ester Aroma Components in Langjiu by GC-MS, GC-O, Sensory Analysis, and Vector Model",
    "url": "https://doi.org/10.3390/foods9020183",
    "publisher": "Niu, Liu & Xiao; Foods 9:183 (2020)"
  },
  {
    "id": "sensory-source-astm-e679",
    "title": "ASTM E679-26 — publicly available scope: detection, recognition, and presentation methods",
    "url": "https://store.astm.org/e0679-26.html",
    "publisher": "ASTM International (2026); public scope only"
  }
]);

export const SENSORY_STIMULI = deepFreeze([
  {
    "id": "sucrose-taste",
    "label": "蔗糖：入口的甜",
    "percept": "甜味",
    "expectedChoice": "taste",
    "pathNodes": [
      "溶液中的蔗糖",
      "口腔味蕾受器細胞",
      "味覺神經訊號",
      "甜味感知"
    ],
    "explanation": "蔗糖是甜味的常用代表刺激。本題追蹤入口的甜味，不把整杯飲料的香氣一起算成味覺。",
    "boundary": "代表物不是唯一甜味分子；本卡不預測濃度到甜度，也不劃分只會感甜的舌頭區域。",
    "sourceIds": [
      "sensory-source-taste-measures-2015",
      "sensory-source-nidcd-taste"
    ]
  },
  {
    "id": "citric-acid-taste",
    "label": "檸檬酸：入口的酸",
    "percept": "酸味",
    "expectedChoice": "taste",
    "pathNodes": [
      "口腔中的酸性溶液",
      "口腔味蕾受器細胞",
      "味覺神經訊號",
      "酸味感知"
    ],
    "explanation": "檸檬酸溶液可作酸味的代表刺激；「檸檬香」則是另一個嗅覺問題。",
    "boundary": "本題不從 pH 單獨推算酸味強度，也不把所有酸的濃度與感受視為等效。",
    "sourceIds": [
      "sensory-source-taste-measures-2015",
      "sensory-source-nidcd-taste"
    ]
  },
  {
    "id": "sodium-chloride-taste",
    "label": "氯化鈉：入口的鹹",
    "percept": "鹹味",
    "expectedChoice": "taste",
    "pathNodes": [
      "溶液中的氯化鈉",
      "口腔味蕾受器細胞",
      "味覺神經訊號",
      "鹹味感知"
    ],
    "explanation": "氯化鈉是鹹味的常用代表刺激。這裡分類的是鹹味，不是鹽漬食品的全部風味。",
    "boundary": "不把所有鹽類一律判為相同鹹味，也不提供人體敏感度或攝取量判定。",
    "sourceIds": [
      "sensory-source-taste-measures-2015",
      "sensory-source-nidcd-taste"
    ]
  },
  {
    "id": "caffeine-taste",
    "label": "咖啡因：入口的苦",
    "percept": "苦味",
    "expectedChoice": "taste",
    "pathNodes": [
      "溶液中的咖啡因",
      "口腔味蕾受器細胞",
      "味覺神經訊號",
      "苦味感知"
    ],
    "explanation": "咖啡因可作苦味代表刺激。咖啡的烘烤香由多種揮發物參與，不能用咖啡因一個名字代替。",
    "boundary": "本題只分類指定苦感；苦味不等於毒性檢驗，也不表示所有苦味都來自咖啡因。",
    "sourceIds": [
      "sensory-source-taste-measures-2015",
      "sensory-source-nidcd-taste"
    ]
  },
  {
    "id": "glutamate-taste",
    "label": "麩胺酸鈉：入口的鮮",
    "percept": "鮮味（umami）",
    "expectedChoice": "taste",
    "pathNodes": [
      "溶液中的麩胺酸鈉",
      "口腔味蕾受器細胞",
      "味覺神經訊號",
      "鮮味感知"
    ],
    "explanation": "麩胺酸鈉是鮮味的常用代表刺激；此處的鮮指味質，不是食品新鮮度或香氣濃度。",
    "boundary": "本卡只問指定鮮味，不宣稱實際溶液只有一種感受，也不模擬其他成分的增強作用。",
    "sourceIds": [
      "sensory-source-taste-measures-2015",
      "sensory-source-nidcd-taste"
    ]
  },
  {
    "id": "vanillin-orthonasal",
    "label": "香草醛：杯口聞香",
    "percept": "鼻前嗅覺的香草香",
    "expectedChoice": "smell",
    "pathNodes": [
      "杯口的香草醛氣相",
      "鼻孔吸入（鼻前）",
      "鼻腔嗅覺受器",
      "香氣感知"
    ],
    "explanation": "香草醛是香草香的代表成分。從杯口聞到的分子經鼻孔進入，屬鼻前嗅覺（orthonasal olfaction）。",
    "boundary": "鼻前與鼻後是送達途徑的區分，不是兩套基本味覺；本卡不預測釋放量或聞香強度。",
    "sourceIds": [
      "sensory-source-vanillin",
      "sensory-source-nidcd-smell"
    ]
  },
  {
    "id": "vanillin-retronasal",
    "label": "香草醛：入口後的香",
    "percept": "鼻後嗅覺的香草香",
    "expectedChoice": "smell",
    "pathNodes": [
      "口腔釋出的香草醛",
      "咽部通往鼻腔（鼻後）",
      "鼻腔嗅覺受器",
      "香氣感知"
    ],
    "explanation": "進食時釋出的香氣可由口腔後方到達鼻腔，屬鼻後嗅覺（retronasal olfaction）；感覺從嘴裡來，仍不代表由味蕾辨認香草香。",
    "boundary": "此路徑示意不表示所有分子都能等量到達；實際食品還同時有味覺、質地與刺激感。",
    "sourceIds": [
      "sensory-source-vanillin",
      "sensory-source-nidcd-smell"
    ]
  },
  {
    "id": "capsaicin-chemesthesis",
    "label": "辣椒素：口腔灼熱感",
    "percept": "辣與灼熱感",
    "expectedChoice": "chemesthesis",
    "pathNodes": [
      "辣椒素接觸口腔",
      "化學刺激感覺神經末梢",
      "感覺訊號",
      "灼熱感"
    ],
    "explanation": "辣椒素是辣椒灼熱感的代表成分；這種化學刺激感（chemesthesis）不同於甜、酸、鹹、苦、鮮。",
    "boundary": "辣感不能用來反推食品實際溫度；辣椒食品也有氣味與味質，不能整份只歸為刺激感。",
    "sourceIds": [
      "sensory-source-capsaicin",
      "sensory-source-nidcd-taste"
    ]
  },
  {
    "id": "menthol-chemesthesis",
    "label": "薄荷醇：口腔涼感",
    "percept": "清涼感",
    "expectedChoice": "chemesthesis",
    "pathNodes": [
      "薄荷醇接觸口腔",
      "化學刺激感覺神經末梢",
      "感覺訊號",
      "清涼感"
    ],
    "explanation": "本題指定薄荷醇帶來的涼感，歸於化學刺激感；聞到的薄荷香則需另看嗅覺途徑。",
    "boundary": "涼感不能當作液體溫度量測；同一成分或食品可能同時參與多種感受。",
    "sourceIds": [
      "sensory-source-nidcd-smell",
      "sensory-source-nidcd-taste"
    ]
  }
]);
