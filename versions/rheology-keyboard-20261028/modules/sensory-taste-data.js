// Webb et al. (2015), Tables 3 and 4. Numeric transcription and original
// Chinese teaching labels, CC BY 4.0. No participant-level data are inferred.
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const threshold = (mean, se) => ({mean: Number(mean), se: Number(se), displayMean: mean, displaySe: se});
const intensity = (concentration, gm, se) => ({concentration: Number(concentration), gm: Number(gm), se: Number(se), displayConcentration: concentration, displayGM: gm, displaySe: se});

export const SENSORY_TASTE_STUDY = freeze({
  id: 'webb-2015-taste',
  title: '同一研究的五種味覺：閾值與超閾值強度',
  citation: 'Webb, Bolhuis, Cicerale, Hayes & Keast (2015). The Relationships Between Common Measurements of Taste Function. Chemosensory Perception 8:11–18.',
  sourceId: 'sensory-source-taste-measures-2015',
  sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4475569/',
  doi: '10.1007/s12078-015-9183-x',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  adaptation: '取原表數值與精度，重新排版並加入繁體中文判讀；未重製原圖，未重建個人數據。',
  evidence: 'published-study-summary',
  conditions: [
    '65 位女性大學生，18–42 歲；研究報告平均年齡 21.5 ± 4 歲。',
    '以過濾去離子水配製，各次提供 15 mL、室溫；不同日完成兩次研究時段。',
    '閾值採上升濃度序列：偵測 DT 為有味但味質未知；辨認 RT 為連續兩次正確認出味質。',
    '超閾值的三個濃度隨機呈現，以 gLMS 評分；原表 4 報幾何平均 GM 與標準誤 SE。',
  ],
  thresholdUnit: 'mM',
  thresholdStatistic: '原表 3：mean ± SE',
  intensityUnit: 'gLMS',
  intensityStatistic: '原表 4：GM ± SE',
  interpretation: '偵測到、認出味質與感受多強，是不同問題。群體摘要不能預測某個人的閾值，也不能據此將濃度倍數等同感覺倍數。',
  limits: [
    '只代表這個研究的參與者與程序，不是所有人的通用閾值。SE 是原表標準誤，不是個人分散程度 SD，也不是 95% 信賴區間。',
    '每次只比較同一代表物。五味的數值尺度、濃度序列不同，不能以柱高把整種味覺排成敏感度名次。',
    '閾值依賴測試濃度範圍；例如檸檬酸序列由 0.7 mM 起，這張表不能證明低於起點時完全無法偵測。',
    '強度只有三個離散觀測點，不做插值、擬合、個人預測或混合物加總。這些味覺量測不代入嗅覺 OAV。',
  ],
  samples: [
    {id: 'sucrose', label: '甜 · 蔗糖', compound: 'Sucrose', dt: threshold('10.9', '1.48'), rt: threshold('29.3', '3.08'), intensity: [intensity('100', '6.95', '0.90'), intensity('200', '12.6', '1.25'), intensity('400', '19.1', '1.69')]},
    {id: 'sodium-chloride', label: '鹹 · 氯化鈉', compound: 'Sodium chloride', dt: threshold('4.97', '0.37'), rt: threshold('37.0', '4.52'), intensity: [intensity('100', '7.9', '1.24'), intensity('200', '18.0', '1.45'), intensity('400', '24.0', '1.73')]},
    {id: 'citric-acid', label: '酸 · 檸檬酸', compound: 'Citric acid', dt: threshold('0.70', '0.002'), rt: threshold('0.90', '0.09'), intensity: [intensity('1.0', '5.40', '0.80'), intensity('3.0', '13.2', '1.30'), intensity('7.0', '18.7', '1.47')]},
    {id: 'caffeine', label: '苦 · 咖啡因', compound: 'Caffeine', dt: threshold('0.78', '0.14'), rt: threshold('1.10', '0.15'), intensity: [intensity('1.0', '10.6', '1.57'), intensity('2.0', '18.7', '2.16'), intensity('4.0', '26.6', '2.48')]},
    {id: 'msg', label: '鮮 · 麩胺酸鈉', compound: 'MSG', dt: threshold('1.38', '0.12'), rt: threshold('4.11', '0.55'), intensity: [intensity('3.0', '2.61', '0.66'), intensity('6.0', '4.34', '0.89'), intensity('12.0', '7.24', '1.14')]},
  ],
});
