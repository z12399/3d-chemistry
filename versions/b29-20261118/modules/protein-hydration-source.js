/**
 * Exact data reviewed in the frozen protein-hydration feasibility packet.
 * This is an integrity gate for reported values and their limits, not an
 * empirical validation or a general protein-hydration model.
 */
export const PROTEIN_HYDRATION_SOURCE_VERSION = '2026-10-13.1';
export const PROTEIN_HYDRATION_SOURCE_DATA_SHA256 = '3d121434eef5f07708604281d50b7d6919bd3e0944d316755ca65b846b340252';
const PINNED = JSON.parse("{\"schema\":\"protein-hydration/v1\",\"version\":\"2026-10-13.1\",\"activityId\":\"protein-hydration-evidence\",\"title\":\"水合量的分母是什麼？\",\"sourcePacket\":{\"path\":\"output/capability-review-2026-10-13c/protein-hydration-feasibility/MANIFEST-v1.json\",\"sha256\":\"7f114a3bec42897c0b776eb1c499dc0d5e076edbe76721d223083ae22c17cdbe\",\"contractSha256\":\"2d9a79994c2bbee8b85d8305ff9b1e13952d7def2a0cb4f62b765327330f3a62\"},\"sources\":[{\"id\":\"hydration-tompa2009\",\"title\":\"Interfacial Water at Protein Surfaces: Wide-Line NMR and DSC Characterization of Hydration in Ubiquitin Solutions\",\"publisher\":\"Tompa et al. (2009), Biophysical Journal 96:2789–2798；REAL 作者機構典藏\",\"url\":\"https://real.mtak.hu/13256/1/1245819.pdf\",\"doi\":\"10.1016/j.bpj.2008.11.038\",\"locator\":\"PDF第2–3頁／印刷頁2790–2791：方法；PDF第5頁／2793：圖3；PDF第6頁／2794：Table 1；PDF第8頁／2796：圖6及所選h/x。\",\"evidencePath\":\"output/capability-review-2026-10-13c/protein-hydration-feasibility/sources/tompa-2009-author-repository.pdf\",\"sha256\":\"663954ee49f112b0e2c55d42c5686d57202c64461c7afaed8cc183cf36fc29a8\",\"role\":\"reported hydration values and method boundaries\",\"note\":\"採用粉末h與純水低溫分析段的h/x；保留Table 1不同數字。沒有從圖形擬合或數位化連續曲線。\"},{\"id\":\"hydration-ntu114-q11\",\"title\":\"114學年度碩士班招生試題：食品化學，第11題\",\"publisher\":\"國立臺灣大學圖書館／招生試題\",\"url\":\"https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-257.pdf\",\"doi\":null,\"locator\":\"第2頁，第11(2)–(4)題：題設加權式、溫度與pH。\",\"evidencePath\":\"output/capability-review-2026-10-13c/protein-hydration-feasibility/sources/ntu-114-257.pdf\",\"sha256\":\"87f8031d7c661548e24950014cb9bfaff493aa2a86f40389b312fb2fc0de2726\",\"role\":\"curriculum anchor only\",\"note\":\"原題沒有明列f分母、係數單位或標準答案。本活動是量測定義與分母的教學延伸，未完成題設係數或一般pH模型。\"}],\"claims\":[{\"id\":\"reported-h\",\"text\":\"h的分母是蛋白質量；本活動只採兩個具來源位置的報告值。\",\"sourceIds\":[\"hydration-tompa2009\"],\"locator\":\"PDF第2頁／2790 Samples；第8頁／2796 Specific heat of hydration water。\",\"kind\":\"source-reported central values\",\"limit\":\"不把h視為跨樣品、跨介質、跨溫度的通用常數；作者±的統計類型未確認。\"},{\"id\":\"mass-accounting\",\"text\":\"m水=h×m蛋白；這筆水占「蛋白＋這筆水」的比例為h/(1+h)。\",\"sourceIds\":[\"hydration-tompa2009\"],\"locator\":\"由h的g水/g蛋白定義獨立推導；粉末12.7wt%可作四捨五入核對。\",\"kind\":\"derived mass bookkeeping\",\"limit\":\"選擇蛋白基準質量只是縮放記帳，不是改變濃度或新量測；合計不含其餘冰、自由水或溶質。\"},{\"id\":\"nmr-normalization\",\"text\":\"x是作者以同一样品全液態時的零時間外推NMR回應歸一化得到的可移動水分率。\",\"sourceIds\":[\"hydration-tompa2009\"],\"locator\":\"PDF第3頁／2791 NMR spectrometry；第5頁／2793圖3。\",\"kind\":\"operational measurement definition\",\"limit\":\"作者符號為n(mobile H)/n(total H)，但未完整列蛋白與buffer質子扣除帳。x不等於本活動水質量分率，不從x、濃度或密度推h。\"},{\"id\":\"medium-method\",\"text\":\"相同蛋白在純水與緩衝液的溫度行為不同，NMR與簡化DSC模型的結果也不能直接互換。\",\"sourceIds\":[\"hydration-tompa2009\"],\"locator\":\"PDF第5頁／2793圖3；第7–8頁／2795–2796 Eq.3與圖6。\",\"kind\":\"bounded source comparison\",\"limit\":\"介質同時含Tris、NaCl、EDTA；不能把比較當成只改NaCl。DSC兩相近似忽略蛋白並假設水的性質，不能當直接NMR數值。\"},{\"id\":\"liquid-boundary\",\"text\":\"全液態參考條件使x到1；圖3的h軸24.4此時對應全水／蛋白，不能當成已隔離的水合殼層量。\",\"sourceIds\":[\"hydration-tompa2009\"],\"locator\":\"PDF第5頁／2793 NMR intensities與圖3。\",\"kind\":\"interpretation boundary\",\"limit\":\"20°C情境只是要求外推的教學問題，本資料集沒有提供該點水合h。\"},{\"id\":\"exam-gap\",\"text\":\"原題a=fX1+0.4fX2+0.2fX3仍缺一次來源核實的f基準與係數單位。\",\"sourceIds\":[\"hydration-ntu114-q11\"],\"locator\":\"官方114-257第2頁第11(2)題；Kuntz 1971原文未完成取得。\",\"kind\":\"unresolved source gap\",\"limit\":\"不代填未知、不把分組寫成官方答案，不宣稱已完整解決第11題。\"}],\"cases\":[{\"id\":\"water-subzero\",\"label\":\"純水／低溫\",\"condition\":\"41 mg/cm³ human ubiquitin／純水；−40 至 −10°C 分析區間。\",\"summary\":\"採頁2796報告的h與x；此處換算h的質量分母。\",\"numericalStatus\":\"CENTRAL_VALUES\",\"hGWaterPerGProtein\":0.395,\"hPlusMinus\":0.004,\"nmrX\":0.0162,\"nmrXPlusMinus\":0.0002,\"powderWaterWtPercent\":null,\"locator\":\"Tompa 2009 PDF第8頁／印刷頁2796，Specific heat of hydration water末段；圖6。\",\"sourceIds\":[\"hydration-tompa2009\"],\"limitations\":[\"Table 1印h=.355±.003，與本段.395±.004不同；此處明確採本段報告值，不平均或校正。\",\"所選水是該量測與條件下判讀的可移動／界面水，不是整份溶液的全部水。\",\"±保留為原文未定類型的不確定度；計算只用中央值。\",\"溫度是離散證據條件，不是可生成連續曲線的模型。\"]},{\"id\":\"lyophilized\",\"label\":\"凍乾粉末\",\"condition\":\"作者收到的human ubiquitin凍乾粉末；以NMR判讀水分。\",\"summary\":\"h=.145可換算成約12.7%的粉末水質量分率。\",\"numericalStatus\":\"CENTRAL_VALUES\",\"hGWaterPerGProtein\":0.145,\"hPlusMinus\":null,\"nmrX\":null,\"nmrXPlusMinus\":null,\"powderWaterWtPercent\":12.7,\"locator\":\"Tompa 2009 PDF第2頁／印刷頁2790，Materials and Methods／Samples；第3頁／2791重述。\",\"sourceIds\":[\"hydration-tompa2009\"],\"limitations\":[\"這是另一個實體樣品狀態，不是把純水溶液沿溫度軸變成粉末。\",\"未為粉末h提供本資料可確認的±；不補造不確定度。\",\"12.7 wt%是作者四捨五入的報告值，h/(1+h)的計算值約12.6638%。\"]},{\"id\":\"buffered\",\"label\":\"緩衝液\",\"condition\":\"41 mg/cm³ human ubiquitin／50 mM Tris、150 mM NaCl、1 mM EDTA；Methods未列buffer pH。\",\"summary\":\"圖3可比较介質差異；本活動未選出可計算的單點h或x。\",\"numericalStatus\":\"NO_REVIEWED_POINT\",\"hGWaterPerGProtein\":null,\"hPlusMinus\":null,\"nmrX\":null,\"nmrXPlusMinus\":null,\"powderWaterWtPercent\":null,\"locator\":\"Tompa 2009 PDF第2頁／2790 Samples；第5頁／2793圖3B；第6頁／2794 Table 1。\",\"sourceIds\":[\"hydration-tompa2009\"],\"limitations\":[\"數值未知不是零；也不是宣稱論文沒有buffer量測。\",\"介質含多種成分，不能把差異歸結為只改一項鹽濃度。\",\"Table 1擬合的安全分段範圍不足以在此生成連續曲線；圖3本身有斜率改變。\"]},{\"id\":\"water-ambient\",\"label\":\"外推到20°C\",\"condition\":\"教學要求：將純水低溫的水合結果外推到20°C；不是本資料集的實測點。\",\"summary\":\"全液態NMR訊號不能單獨辨出水合水，沒有可沿用的h。\",\"numericalStatus\":\"NO_REVIEWED_POINT\",\"hGWaterPerGProtein\":null,\"hPlusMinus\":null,\"nmrX\":null,\"nmrXPlusMinus\":null,\"powderWaterWtPercent\":null,\"locator\":\"Tompa 2009 PDF第5頁／2793圖3與全液態歸一化說明；20°C是教學外推要求。\",\"sourceIds\":[\"hydration-tompa2009\"],\"limitations\":[\"不把−40至−10°C的h=.395搬到20°C。\",\"不把全液態x=1等同於所有水都屬於水合殼層。\",\"保留沒有可用數字的狀態，不能用零或上一情境的值代填。\"]}],\"limits\":[\"只處理指定來源報告值與質量分母；不是通用蛋白水合、pH、鹽濃度或溫度模型。\",\"蛋白基準質量為教學記帳量；變更它不改變作者樣品濃度、介質或量測條件。\",\"合計分母是乾蛋白＋這筆h所指的水；不是整份溶液、整份食品或全部濕物料。\",\"NMR x與h各自保留；不從總氫、濃度、密度或全水量自行推導另一個值。\",\"不計衍生不確定度、SD、CI；原文±只留作未定類型的來源描述。\",\"沒有保水率、溶解度、蛋白構形、水合殼層幾何、分子數、食品功能或安全預測。\",\"圖3與圖6是原始證據；本資料集沒有逐點數位化、連續擬合或溫度滑桿。\",\"原題f的基準／係數與一般pH效應仍未解；不聲稱完整考題答案或已證明學習效果。\"],\"conflicts\":[{\"id\":\"table-text-h\",\"label\":\"Table 1與內文不同\",\"text\":\"Table 1列UBQ/water h=.355±.003；頁2796內文列h=.395±.004。本活動選後者，保留前者為原文衝突，不平均、不改字、不當成另一獨立樣品。\",\"locator\":\"PDF第6頁／印刷頁2794 Table 1；第8頁／2796內文。\",\"sourceIds\":[\"hydration-tompa2009\"]},{\"id\":\"temperature-print\",\"label\":\"溫區印刷不一致\",\"text\":\"頁2794實際印45°C<T<5°C；頁2797印T<5°C。此處不自行補负號，而採頁2796明確的−40至−10°C分析區間。\",\"locator\":\"PDF第6、8、9頁／印刷頁2794、2796、2797。\",\"sourceIds\":[\"hydration-tompa2009\"]},{\"id\":\"buffer-fit\",\"label\":\"未採表格擬合\",\"text\":\"Table 1另列buffer斜率及截距；本活動沒有足夠分段定義域，故不由它補造單點h或連續曲線。\",\"locator\":\"PDF第6頁／印刷頁2794 Table 1；第5頁／2793圖3。\",\"sourceIds\":[\"hydration-tompa2009\"]}]}");

function reviewedValue(value, expected, path = 'protein hydration dataset') {
  if (expected === null || typeof expected !== 'object') {
    if (typeof value !== typeof expected || !Object.is(value, expected)) throw new TypeError(`Unreviewed ${path}`);
    return;
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
        || value.length !== expected.length || Reflect.ownKeys(value).length !== expected.length + 1) {
      throw new TypeError(`Unreviewed ${path}`);
    }
    for (let index = 0; index < expected.length; index++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) throw new TypeError(`Non-JSON fields in ${path}`);
      reviewedValue(descriptor.value, expected[index], `${path}[${index}]`);
    }
    return;
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError(`Unreviewed ${path}`);
  }
  const keys = Object.keys(expected).sort();
  const actual = Reflect.ownKeys(value);
  if (actual.some(key => typeof key !== 'string')) throw new TypeError(`Non-JSON fields in ${path}`);
  actual.sort();
  if (actual.length !== keys.length || keys.some((key, index) => key !== actual[index])) {
    throw new TypeError(`Unreviewed fields in ${path}`);
  }
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) throw new TypeError(`Non-JSON fields in ${path}`);
    reviewedValue(descriptor.value, expected[key], `${path}.${key}`);
  }
}

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

/** Object key order may vary, but every field and ordered array stays pinned.
 * Reject accessors without invoking them; never return the caller's object.
 */
export function validateProteinHydrationDataset(value) {
  reviewedValue(value, PINNED);
  return freeze(structuredClone(PINNED));
}

