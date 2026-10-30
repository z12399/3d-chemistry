/** Exact reviewed ROS evidence, with qualitative research kept separate from
 * the original teaching ledger. Integrity is not kinetic validation. */
export const ROS_DEFENSE_SOURCE_VERSION = "2026-10-13.1";
export const ROS_DEFENSE_DATA_SHA256 = '05520d166a1bbcc44cce60be89afa5d573dd57a87b11c38291c51d072ceb1171';
const PINNED = JSON.parse("{\"schema\":\"ros-defense-evidence/v1\",\"version\":\"2026-10-13.1\",\"activityId\":\"micro-ros-defense\",\"title\":\"清掉超氧，活性氧就消失了嗎？\",\"sourcePacket\":{\"path\":\"output/capability-review-2026-10-13e/micro-next-gap/MANIFEST-v1.json\",\"sha256\":\"63f5656eb6ab87ede5108e9bd71f1902878e328c84e02c76569cbd2cdc6a1779\"},\"units\":{\"amount\":\"µmol（物質的量）\",\"extent\":\"µmol（反應程度，不是時間）\",\"initialCondition\":\"三種初始量皆為0–24 µmol整數的原創教學設定；省略欄位採預設。\",\"protons\":\"外部緩衝庫累計供應H⁺的µmol，不是pH\"},\"sources\":[{\"id\":\"ros-ntu114-q5\",\"title\":\"114學年度碩士班招生試題：食品微生物學，第5題\",\"publisher\":\"國立臺灣大學圖書館／招生試題\",\"url\":\"https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-259.pdf\",\"locator\":\"PDF第1頁，第5題，共18分；題目未提供分項配分。\",\"evidencePath\":\"output/sensory-continuity-evidence-2026-10-13/official-gap-refresh/sources/ntu-114-microbiology-live.pdf\",\"sha256\":\"dc3d4f002917a37f63d9a344e1227e945fbfdca0ed8cc962e5df8e6950397eb7\",\"role\":\"official-exam-anchor\",\"note\":\"題目要求酵素型抗氧化、非酵素型抗氧化及DNA修復各舉例並說明原理與功能。本課只處理第一類的選定機制。\"},{\"id\":\"ros-iubmb-sod\",\"title\":\"EC 1.15.1.1: superoxide dismutase\",\"publisher\":\"IUBMB Enzyme Nomenclature\",\"url\":\"https://iubmb.qmul.ac.uk/enzyme/EC1/15/1/1.html\",\"locator\":\"EC 1.15.1.1，Reaction與Comments。\",\"evidencePath\":\"output/capability-review-2026-10-13e/micro-next-gap/iubmb-sod-v1.html\",\"sha256\":\"d14bac6e19defcbf6a6a2f401cf426eccf50c522780fefa53e5bcb77c3cae53a\",\"role\":\"reviewed-reaction-stoichiometry\",\"note\":\"2 O₂•⁻與2 H⁺產生O₂及H₂O₂；消耗超氧不表示全部ROS已消失。\"},{\"id\":\"ros-iubmb-catalase\",\"title\":\"EC 1.11.1.6: catalase\",\"publisher\":\"IUBMB Enzyme Nomenclature\",\"url\":\"https://iubmb.qmul.ac.uk/enzyme/EC1/11/1/6.html\",\"locator\":\"EC 1.11.1.6，Reaction與Comments。\",\"evidencePath\":\"output/capability-review-2026-10-13e/micro-next-gap/iubmb-catalase-v1.html\",\"sha256\":\"9d00b51baf817e10121bf55c247f1eea64f00bd60d8e637774388666024a3cf1\",\"role\":\"reviewed-reaction-stoichiometry\",\"note\":\"2 H₂O₂歧化為O₂與2 H₂O；條目含heme與manganese catalase，不將所有catalase視作同一輔因子。\"},{\"id\":\"ros-iubmb-nadh-peroxidase\",\"title\":\"EC 1.11.1.1: NADH peroxidase\",\"publisher\":\"IUBMB Enzyme Nomenclature\",\"url\":\"https://iubmb.qmul.ac.uk/enzyme/EC1/11/1/1.html\",\"locator\":\"EC 1.11.1.1，Reaction與Comments。\",\"evidencePath\":\"output/capability-review-2026-10-13e/micro-next-gap/iubmb-nadh-peroxidase-v1.html\",\"sha256\":\"e59a69c7858a4b7406c9363377bdb8917f4b5e235f44466d76e4d5cbc6706f4c\",\"role\":\"reviewed-reaction-stoichiometry\",\"note\":\"NADH與H⁺還原H₂O₂，產生NAD⁺與2 H₂O；此反應有還原當量成本。\"},{\"id\":\"ros-watanabe2016\",\"title\":\"Isolation of lactic acid bacteria exhibiting high scavenging activity for environmental hydrogen peroxide from fermented foods and its two scavenging enzymes for hydrogen peroxide\",\"publisher\":\"Watanabe et al. (2016), Journal of General and Applied Microbiology 62, 75–82\",\"url\":\"https://www.jstage.jst.go.jp/article/jgam/62/2/62_75/_pdf/-char/en\",\"locator\":\"PDF第2頁／期刊76頁Methods；第4頁／78頁Figure 1與Table 2；第5頁／79頁Table 3；第7頁／81頁Characterization。\",\"evidencePath\":\"output/capability-review-2026-10-13e/micro-next-gap/watanabe2016-v1.pdf\",\"sha256\":\"a6671eac855bd96e3fcde16c953904b8306a6fbfabfa379c2b6b952e529e3d58\",\"role\":\"primary-qualitative-observation\",\"note\":\"採原文明確的菌株比較及純化酵素觀察；不數位化Figure 1、不以Table 2或3校正動力學。\"}],\"reactions\":[{\"id\":\"sod\",\"label\":\"超氧歧化酶 SOD\",\"equation\":\"2 O₂•⁻ + 2 H⁺ → O₂ + H₂O₂\",\"sourceIds\":[\"ros-iubmb-sod\"],\"locator\":\"EC 1.15.1.1 Reaction\",\"mechanism\":\"兩份超氧歧化，一份形成O₂，另一份形成H₂O₂；H₂O₂仍屬ROS。\",\"limit\":\"只指定化學計量，不由按鍵計算速率或細胞存活。\"},{\"id\":\"catalase\",\"label\":\"過氧化氫酶 Catalase\",\"equation\":\"2 H₂O₂ → O₂ + 2 H₂O\",\"sourceIds\":[\"ros-iubmb-catalase\"],\"locator\":\"EC 1.11.1.6 Reaction\",\"mechanism\":\"H₂O₂自身歧化，同時擔任電子供體與受體；不消耗外加NADH。\",\"limit\":\"不消耗外加NADH不等於没有氧化還原，也不代表不需酵素輔因子。\"},{\"id\":\"nadh-peroxidase\",\"label\":\"NADH過氧化酶\",\"equation\":\"NADH + H⁺ + H₂O₂ → NAD⁺ + 2 H₂O\",\"sourceIds\":[\"ros-iubmb-nadh-peroxidase\"],\"locator\":\"EC 1.11.1.1 Reaction\",\"mechanism\":\"NADH提供兩個電子當量，使一份H₂O₂還原成兩份水；每份反應消耗一份NADH。\",\"limit\":\"NADH耗盡會阻斷這條路徑；不由此推論其他清除路徑或細胞已停止。\"}],\"concepts\":[{\"id\":\"ros-not-all-radicals\",\"label\":\"ROS不全是自由基\",\"text\":\"O₂•⁻是超氧自由基；H₂O₂是非自由基ROS。只清掉前者，後者仍可能累積。\",\"sourceIds\":[\"ros-iubmb-sod\",\"ros-watanabe2016\"],\"limit\":\"不是全體ROS分類或毒性排名；不以O₂分子圖推論其電子結構。\"},{\"id\":\"reducing-equivalent\",\"label\":\"兩種H₂O₂去向\",\"text\":\"Catalase以H₂O₂自身歧化；NADH peroxidase另外消耗NADH。相同清除量可以有不同產物與還原當量成本。\",\"sourceIds\":[\"ros-iubmb-catalase\",\"ros-iubmb-nadh-peroxidase\"],\"limit\":\"只比較這兩式，沒有速率、效能或工業優劣排名。\"},{\"id\":\"clearance-versus-count\",\"label\":\"清除與菌數分開看\",\"text\":\"原研究有清除活性低但可培養菌數維持的菌株；清除活性與菌數不能當成同一指標。\",\"sourceIds\":[\"ros-watanabe2016\"],\"limit\":\"限選定菌株與原試驗條件，不把可培養菌數等同所有活細胞或健康效益。\"},{\"id\":\"generated-products\",\"label\":\"產物從累計零點開始\",\"text\":\"H₂O與O₂從0開始記累計生成量；不是把水溶液設定成無水或無氧。氧帳只含所選ROS及其所記產物。\",\"sourceIds\":[\"ros-iubmb-sod\",\"ros-iubmb-catalase\",\"ros-iubmb-nadh-peroxidase\"],\"limit\":\"本活動原創帳本約定，不模擬整份溶液、溶氧或氣液交換。\"}],\"empiricalEvidence\":{\"title\":\"研究中的清除活性與可培養菌數\",\"sourceIds\":[\"ros-watanabe2016\"],\"locator\":\"PDF第2頁Methods、第4頁Figure 1與原文結果、第7頁酵素特性。\",\"conditions\":{\"strains\":[\"Pediococcus pentosaceus Be1\",\"Lactobacillus plantarum NRIC 1067ᵀ\",\"Lactobacillus acidophilus NRIC 1547ᵀ\",\"Streptococcus thermophilus NRIC 0256ᵀ\",\"Pediococcus pentosaceus NRIC 0099ᵀ\"],\"peroxideConcentrationsMmolL\":[0,0.3,1,3],\"durationHours\":1.5,\"temperatureC\":37,\"glucoseMmolL\":50,\"replicateCount\":3,\"spread\":\"Figure 1圖注：平均值±SD。\",\"independence\":\"原文未清楚交代三次是否來自獨立培養批次；沒有逐次原始值。\"},\"measures\":[{\"id\":\"scavenging\",\"label\":\"H₂O₂清除活性（柱）\",\"unit\":\"µmol·mg⁻¹（乾菌重）·h⁻¹\",\"denominator\":\"以乾菌重與時間正規化；依Figure 1右軸原印單位，不混入Table 2。\"},{\"id\":\"viable-count\",\"label\":\"可培養菌數（線）\",\"unit\":\"CFU/mL\",\"denominator\":\"每毫升樣品形成菌落的數量；Figure 1左軸為對數刻度，不是死亡比例。\"}],\"observations\":[{\"id\":\"high-clearance-retained-count\",\"strains\":[\"Pediococcus pentosaceus Be1\"],\"scavenging\":\"在測試範圍有強H₂O₂清除活性。\",\"viableCount\":\"各試驗條件維持可培養菌數。\",\"interpretation\":\"這株同時具有清除活性与菌數維持；不能將這一組合推廣到所有菌株。\"},{\"id\":\"limited-clearance-count-decline\",\"strains\":[\"Lactobacillus plantarum NRIC 1067ᵀ\",\"Lactobacillus acidophilus NRIC 1547ᵀ\"],\"scavenging\":\"遇到自身不能充分清除的H₂O₂濃度。\",\"viableCount\":\"可培養菌數下降。\",\"interpretation\":\"原文的菌株與條件比較，不在此活動建立清除量到菌數的函數。\"},{\"id\":\"low-clearance-retained-count\",\"strains\":[\"Streptococcus thermophilus NRIC 0256ᵀ\",\"Pediococcus pentosaceus NRIC 0099ᵀ\"],\"scavenging\":\"前者清除活性很低，後者低。\",\"viableCount\":\"測試條件下未見可培養菌數下降。\",\"interpretation\":\"低清除活性仍可伴隨菌數維持，因此清除與存活觀察必須分開。\"}],\"enzymeObservations\":[{\"id\":\"be1-enzymes\",\"enzyme\":\"Be1 Mn-catalase與NADH peroxidase\",\"observation\":\"研究從Be1純化了這兩種H₂O₂清除酵素。\",\"limit\":\"不是這株SOD的實證，也未證明所有乳酸菌都具有兩者。\"},{\"id\":\"nadh-requirement\",\"enzyme\":\"純化NADH peroxidase\",\"observation\":\"原文記錄未加NADH時無此酵素活性；兩種純化酵素在所測底物中使用H₂O₂。\",\"limit\":\"測過的氧氣、t-butyl hydroperoxide與cumene hydroperoxide不作底物，不能延伸成所有未測底物皆不適用。\"}],\"cautions\":[\"Figure 1只作原文明確的定性比較；未數位化、未補原始資料點、未擬合存活或反應曲線。\",\"Table 2活菌單位印為mmol·mg⁻¹（乾菌重）·h⁻¹，Figure 1印µmol；保留差異，不猜測改正或混算。\",\"Table 2活菌為3 mM H₂O₂、n=3且±SD；萃取液酵素為1 mM H₂O₂、mU/mg protein、兩次測量平均，±的定義未明示。分母不同，不能直接相減或排酵素成本。\",\"Table 3 NADH peroxidase的hydroxyapatite列：7.2 U除以0.75 mg等於9.6 U/mg，與所印1.920 U/mg不一致；不替作者修值。\",\"本研究沒有為本活動提供Km、Vmax、胞內起始量或完整三酵素網路的動力學參數；教學設定和研究條件分開。\"],\"digitized\":false,\"rawFigurePointValues\":null},\"limits\":[\"原創教學反應帳本：起始量0–24 µmol是指定量，不是濃度、菌體實測值、酵素活性或食品操作條件。\",\"每步依化學計量改變指定反應程度；沒有時間、速率、反應競爭、傳輸或自發反應。未操作SOD不表示水溶液中的超氧不會自發歧化。\",\"只追蹤O₂•⁻與H₂O₂兩種ROS。H₂O₂是非自由基ROS；O₂只標作產物，不展開其電子結構，不計總毒性分數。\",\"H₂O與O₂欄位是累計生成量，初值0不表示沒有溶劑水或溶氧。產物留在帳內，沒有氣液交換或流失。\",\"氧原子帳只計指定初始ROS及其所記產物，不含整份溶液與NAD輔酶固定骨架；不是全體系氧總量。\",\"H⁺由外部緩衝庫供應，只記累計使用量，不預測pH或緩衝容量。NAD⁺的名稱不是指定pH下整分子的絕對電荷。\",\"NADH是有限初始資源，NADH與NAD⁺總量守恆，沒有自動再生；酵素是催化劑，不作消耗的底物。\",\"Catalase不消耗外加NADH，但H₂O₂同時作電子供體與受體而歧化；不能說成沒有氧化還原或電子轉移。\",\"三條反應是組合教學網路。Watanabe研究的Be1證據限Mn-catalase與NADH peroxidase，不證明該菌株具有此處SOD路徑。\",\"原研究的清除活性與可培養菌數是不同測量，不由反應帳推算存活、死亡、食品安全或健康效益。\",\"本課只補114-259第5題的酵素型抗氧化機制；非酵素型抗氧化與DNA修復仍需另學，沒有整題完成或自訂分項配分。\"],\"exam\":{\"year\":114,\"paper\":\"食品微生物學\",\"code\":259,\"page\":1,\"question\":\"第5題\",\"points\":18,\"text\":\"題意摘要：針對氧化物與DNA損傷相關的食品殺菌技術，分別舉酵素型抗氧化、非酵素型抗氧化與DNA修復的代表例，解釋原理及功能。\",\"scope\":\"僅選定酵素型抗氧化機制；18分為整題分數，沒有分項配分或整題完成宣稱。\",\"sourceIds\":[\"ros-ntu114-q5\"]}}");

function reviewedValue(value, expected, path = 'ROS defense source dataset') {
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
export function validateRosDefenseDataset(value) {
  reviewedValue(value, PINNED);
  return freeze(structuredClone(PINNED));
}
