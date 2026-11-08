/** Generated from the reviewed osmotic-driving source packet.
 * Pins exact definitions, assumptions, qualitative context and hypothetical
 * constants. Integrity validation is not experimental model validation.
 */
export const OSMOTIC_DRIVING_SOURCE_VERSION = "2026-10-13.1";
export const OSMOTIC_DRIVING_SOURCE_DATA_SHA256 = '0d7b50978f8a7f19e45c424f3b2fa1d00c7600b181dc0e120d8255b94f0236d6';
const PINNED = JSON.parse("{\"schema\":\"osmotic-driving/v1\",\"version\":\"2026-10-13.1\",\"activityId\":\"processing-osmotic-driving\",\"title\":\"壓差夠大，水就會過膜嗎？\",\"sourcePacket\":{\"path\":\"output/capability-review-2026-10-13d/RO-CONTRACT-v1.md\",\"sha256\":\"10a9cf4480b92bd61ab74b2c05a26f28a4ca5c671a2e1974d74089d30a1f32f0\",\"amendments\":[{\"path\":\"output/capability-review-2026-10-13d/RO-CONTRACT-AMENDMENT-v2.md\",\"sha256\":\"16d83d3dacd277d10cee1ff6e11450e3e52ce5fbd6d1fd7918d2c73e2f817c54\"}]},\"constants\":{\"temperatureK\":298.15,\"permeabilityLmhBar\":2,\"gasConstantLBarMolK\":0.0831446261815324},\"sources\":[{\"id\":\"ro-ntu114-q2\",\"title\":\"114學年度碩士班招生試題：食品加工學，第2題\",\"publisher\":\"國立臺灣大學圖書館／招生試題\",\"url\":\"https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-258.pdf\",\"locator\":\"PDF第1頁，第2題。\",\"evidencePath\":\"output/canning-headspace-evidence-2026-10-13/source-review/sources/ntu-114-258-live.pdf\",\"sha256\":\"6398a78b996a3bc3026c56a4f1dec981379f080de593dd5f419f8c885afd1b36\",\"role\":\"official-exam-anchor\",\"note\":\"連結滲透壓定義、乳清RO流程與設備、操作問題和改善。題目未給本活動數值，也不是本課的標準答案。\"},{\"id\":\"ro-iupac-greenbook\",\"title\":\"Quantities, Units and Symbols in Physical Chemistry, 3rd edition, 2nd printing\",\"publisher\":\"IUPAC (2008), Green Book\",\"url\":\"https://iupac.qmul.ac.uk/bibliog/GreenBook3rd2pt2008.pdf\",\"locator\":\"PDF第73頁／印刷頁59：osmotic pressure，註23與25。\",\"evidencePath\":\"output/capability-review-2026-10-13d/ro-source-definitions/sources/iupac-greenbook-3rd-2008.pdf\",\"sha256\":\"6076dbf045427d68c6cdda3d5632223a69b5d14fd7304f5cb50ce4519d3aefde\",\"role\":\"thermodynamic-definition\",\"note\":\"原式Π=−RT ln(aA)/VA，註25限定不可壓縮流體。該頁沒有直接印Π=RTC；本活動另採理想稀溶液近似。\"},{\"id\":\"ro-learncheme\",\"title\":\"Osmosis and Reverse Osmosis: Screencasts\",\"publisher\":\"LearnChemE, University of Colorado Boulder\",\"url\":\"https://learncheme.com/quiz-yourself/interactive-self-study-modules/osmosis-and-reverse-osmosis/osmosis-and-reverse-osmosis-screencasts/\",\"locator\":\"Important Equations：溶劑逸度平衡、滲透壓與Reverse osmosis。\",\"evidencePath\":\"output/capability-review-2026-10-13d/processing-next-gap/sources/learncheme-osmosis-equations.html\",\"sha256\":\"4a42bbcb5f8a11f3b72089bcab40370d6c5760e4cd3c992bb25c4461d624674b\",\"role\":\"teaching-equations\",\"note\":\"列Π V溶劑=x溶質 RT及壓差扣滲透壓的通量關係。稀溶液下x溶質/V溶劑約為C；本例非離子溶質，不把配方濃度直接當所有食品的有效粒子濃度。\"},{\"id\":\"ro-shahgodari2023\",\"title\":\"Experimental and Modeling Study of the Nanofiltration of Alcohol-Based Molecules and Amino Acids by Commercial Membranes\",\"publisher\":\"Shahgodari, Labanda and Llorens (2023), Membranes 13, 631\",\"url\":\"https://doi.org/10.3390/membranes13070631\",\"locator\":\"PDF第2–3頁，Theory Eq.1、2與4；第3頁Eq.5不作本例的k校正。\",\"evidencePath\":\"output/membrane-balance-2026-10-12/sources/shahgodari-2023.pdf\",\"sha256\":\"ecbecc9349ee1ad13033ec8df3a2dcc715aef2c079d310dfeae858e98364ccd4\",\"role\":\"membrane-transport-relations\",\"note\":\"採膜界面滲透壓與film關係，再限定單一完全截留溶質、cp=0與σ=1。未採論文的NF實測參數、孔徑、反射係數或膜性能。\"},{\"id\":\"ro-biesheuvel2024\",\"title\":\"Analysis of concentration polarization in reverse osmosis and nanofiltration: zero-, one-, and two-dimensional models\",\"publisher\":\"Biesheuvel et al. (2024), arXiv:2401.11527v1，理論預印本\",\"url\":\"https://arxiv.org/abs/2401.11527v1\",\"locator\":\"PDF第2頁：固定film與攪拌槽界線；第3頁Eq.2及k的速度單位；第4頁零溶質通量邊界。\",\"evidencePath\":\"output/capability-review-2026-10-13d/processing-next-gap/sources/biesheuvel-2024-arxiv.pdf\",\"sha256\":\"ffc4ee5936026c94aa1c0e18a414fd8161ad68e77865c445b6955fbe4799114d\",\"role\":\"film-relation-and-scope\",\"note\":\"Cm=Cb exp(J/k)；局部固定film不等於完整沿程膜組。本文較完整的1D／2D及Sherwood關係未在本活動實作；反向通量是此處局部方程的數學延伸。\"},{\"id\":\"ro-tetrapak\",\"title\":\"Dairy Processing Handbook: Membrane technology\",\"publisher\":\"Tetra Pak, Chapter 7.4\",\"url\":\"https://dairyprocessinghandbook.tetrapak.com/chapter/membrane-technology\",\"locator\":\"Definitions、Pressure conditions、Processing temperature；Fig.7.4.15及其Batch production段。\",\"evidencePath\":\"output/capability-review-2026-10-13d/processing-next-gap/sources/tetrapak-membrane-technology.html\",\"sha256\":\"d7f3015e5b9c8f7f023d4bb35f1793c9bc7232ceda47c02ab16344d591524b16\",\"role\":\"qualitative-dairy-equipment-context\",\"note\":\"採一般膜過濾批次構件與用途作乳清RO的質性思考。書中沿程壓降ΔP與TMP有別；本例ΔP專指局部TMP。沒有採其操作壓力、溫度或產量。\"},{\"id\":\"ro-bipm-si2026\",\"title\":\"The International System of Units (SI), 9th edition, V4.01\",\"publisher\":\"BIPM, June 2026\",\"url\":\"https://www.bipm.org/documents/20126/41483022/SI-Brochure-9.pdf\",\"locator\":\"English PDF第13–14頁／印刷頁123–124：kB與NA；第28與30頁：前綴及L。\",\"evidencePath\":\"output/capability-review-2026-10-13d/ro-source-definitions/sources/bipm-si-brochure-2026.pdf\",\"sha256\":\"5442eea2c680caf77a9d96879205a97f57c7c270b98a0bd0126c18fefe47e02c\",\"role\":\"exact-constants-and-units\",\"note\":\"R=NA kB=8.31446261815324 J mol⁻¹ K⁻¹。以1 bar=100000 Pa與1 L=0.001 m³換算為0.0831446261815324 L bar mol⁻¹ K⁻¹；本例25°C是教學設定。\"}],\"claims\":[{\"id\":\"osmotic-definition\",\"text\":\"滲透壓是隔著可透溶劑膜，抵消溶劑化學勢差所需的壓力差；平衡不要求兩側溶質濃度相等。\",\"sourceIds\":[\"ro-iupac-greenbook\",\"ro-learncheme\"],\"locator\":\"Green Book p59；LearnChemE Important Equations。\",\"kind\":\"thermodynamic-definition\",\"limit\":\"一般以活度描述；π=RTC只用於本例理想稀溶液非離子溶質。\"},{\"id\":\"local-driving\",\"text\":\"局部壓差ΔP=PB−PP；有效壓差=ΔP−πm，J=Lp(ΔP−πm)。J>0水由B溶液到P純水，J<0方向相反。\",\"sourceIds\":[\"ro-shahgodari2023\",\"ro-learncheme\"],\"locator\":\"NF Eq.1–2經cp=0、σ=1特化；正負方向為本活動約定。\",\"kind\":\"specialized-model\",\"limit\":\"Lp=2與25°C皆為假設教學值；沒有建立實際膜或乳清的校正。\"},{\"id\":\"film-relation\",\"text\":\"固定film中零溶質淨通量，使Cm=Cb exp(J/k)。正通量時膜表面濃集；反向通量時表面變稀。\",\"sourceIds\":[\"ro-shahgodari2023\",\"ro-biesheuvel2024\"],\"locator\":\"NF Eq.4；arXiv p2–4／Eq.2。\",\"kind\":\"specialized-model-and-signed-extension\",\"limit\":\"k=D/δ以LMH表示；不等於沿膜流速。負J為此局部模型延伸，非來源乳清實驗。\"},{\"id\":\"model-comparison\",\"text\":\"同一主體濃度下，ΔP=πb時J=0。固定film、Cb>0且J≠0時，提高k使膜面與主體濃度更接近，並增加|J|；純水或停止點不受k影響。\",\"sourceIds\":[\"ro-shahgodari2023\",\"ro-biesheuvel2024\"],\"locator\":\"由本活動隱式方程獨立推導，processing-model-review高精度核對。\",\"kind\":\"derived-comparison\",\"limit\":\"J<0時會更負，不能一律說J增加。完全混合模式也不受k影響。壓力曲線是獨立穩態，不是濃縮時間軌跡。\"},{\"id\":\"whey-process\",\"text\":\"乳清RO可用膜移除水；供料、循環、膜分離與溫度控制各有不同用途。\",\"sourceIds\":[\"ro-tetrapak\",\"ro-ntu114-q2\"],\"locator\":\"RO用途；Fig.7.4.15一般批次系統與Processing temperature。\",\"kind\":\"qualitative-application\",\"limit\":\"實際乳清含多種溶質、蛋白與鹽；此處不計非理想性、濃縮回收率、沉積或安全操作條件。\"}],\"limits\":[\"理想局部教學模型：單一假設非離子溶質、完全截留、純水側濃度0；不是乳清或商用膜的實測模型。\",\"兩側由外部維持指定條件。25°C、Lp=2 L m⁻² h⁻¹ bar⁻¹固定；不模擬有限槽液量或隨時間濃縮。\",\"本例ΔP是局部跨膜壓差PB−PP。沿膜入口至出口的壓降是另一個量。\",\"k是固定film的D/δ，與J都用LMH。未由流速、泵速、Re、Sc或膜組幾何計算k。\",\"膜面濃度使用理想稀溶液π=RTC；此假設不保證對真實食品或整個數值範圍實驗成立。\",\"負通量表示純水流入B，膜表面相對變稀；純水Cb=0時Cm/Cb沒有定義。\",\"曲線比較分開維持的穩態條件，不是操作歷史；模型沒有有限壓力下的硬性通量平台。\",\"沒有溶質漏出、濃縮回收率、膜污染動力學、變動Lp、泵功、能耗或安全預測。\",\"設備圖只作質性說明，不接受上方數值作實廠設定；本課也不是114年第2題的完整標準答案。\"],\"plantComponents\":[{\"id\":\"tank\",\"label\":\"原料槽\",\"purpose\":\"暫存待處理乳清。批次系統回流後組成會變化；本活動的固定主體濃度不模擬這個累積過程。\",\"sourceIds\":[\"ro-tetrapak\"]},{\"id\":\"feed-pump\",\"label\":\"供料泵\",\"purpose\":\"把液體送入膜系統並提供所需壓力。跨膜壓差與沿管路壓降需要分開考慮。\",\"sourceIds\":[\"ro-tetrapak\"]},{\"id\":\"circulation-pump\",\"label\":\"循環泵\",\"purpose\":\"維持沿膜流動；改變近膜傳質條件。此處沒有從泵設定換算k或能耗。\",\"sourceIds\":[\"ro-tetrapak\"]},{\"id\":\"membrane\",\"label\":\"膜組\",\"purpose\":\"RO用於移除水，使滯留液濃縮。真實膜的選擇性、污染與完整性須另有資料。\",\"sourceIds\":[\"ro-tetrapak\"]},{\"id\":\"cooler\",\"label\":\"冷卻器\",\"purpose\":\"移除操作時泵輸入造成的熱，協助維持製程溫度。本圖沒有給乳清的安全溫度或保存期限。\",\"sourceIds\":[\"ro-tetrapak\"]}],\"exam\":{\"year\":114,\"paper\":\"食品加工學\",\"question\":\"第2題\",\"text\":\"題意摘要：說明滲透壓，提出以逆滲透濃縮乳清的流程與主要設備，討論可能面臨的問題及改善方式。此工作台只補局部驅動力與膜表面傳質；完整流程設計、真實污染控制與操作條件仍需其他證據。\",\"sourceIds\":[\"ro-ntu114-q2\"]}}");

function reviewedValue(value, expected, path = 'osmotic driving source dataset') {
  if (expected === null || typeof expected !== 'object') {
    if (typeof value !== typeof expected || !Object.is(value, expected)) {
      throw new TypeError(`Unreviewed ${path}`);
    }
    return;
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
        || Reflect.ownKeys(value).length !== expected.length + 1) {
      throw new TypeError(`Unreviewed ${path}`);
    }
    // Check the descriptor before accessing array data, including length.
    const length = Object.getOwnPropertyDescriptor(value, 'length');
    if (!length || !Object.hasOwn(length, 'value') || length.enumerable
        || length.value !== expected.length) throw new TypeError(`Non-JSON array in ${path}`);
    for (let index = 0; index < expected.length; index++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
        throw new TypeError(`Non-JSON fields in ${path}`);
      }
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
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError(`Non-JSON fields in ${path}`);
    }
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

/** Object key ordering may vary. Every ordered array and primitive is pinned.
 * Getters are rejected without invocation; mutable callers are never frozen.
 */
export function validateOsmoticDrivingDataset(value) {
  reviewedValue(value, PINNED);
  return freeze(structuredClone(PINNED));
}
