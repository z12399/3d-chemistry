/** Exact reviewed source/method projections plus explicit UI field mapping. */
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export const HEADSPACE_SOURCE_CONTRACT_HASHES=freeze({
  "source-contract-v3.json": "06292f3349cc7bdbb018781330cbc126e0ca1a82e8e8791794b78e11edd6e120",
  "source-projection-v2.json": "49c6ddf4c878206776be1a389008922e08af2ebb0b46aea27d3edadca8357649",
  "method-contract.json": "301cf718ba393f1b5861805e4fbb75f42e4b0f8fa1782e8bef39550aa78e180f"
});
export const HEADSPACE_SOURCE_PROJECTION=freeze([
  {
    "id": "canning-source-ntu114-q11",
    "title": "114 學年度食品加工學試題：第 11 題",
    "publisher": "國立臺灣大學圖書館／碩士班招生試題（114 學年度）",
    "url": "https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-258.pdf",
    "locator": "唯一一頁，第 11 題（10%）；已直接檢視官方原頁",
    "note": "只核對密封及滅菌前脫氣之目的與可行方法的題目要求。試卷未提供標準答案或本工作台的數值條件；原創模型、練習及示範回答不冒稱官方解答。",
    "localPath": "output/canning-headspace-evidence-2026-10-13/source-review/sources/ntu-114-258-live.pdf",
    "sha256": "6398a78b996a3bc3026c56a4f1dec981379f080de593dd5f419f8c885afd1b36"
  },
  {
    "id": "canning-source-fao1995",
    "title": "Fruit and vegetable processing — 9.7 Vegetable canning",
    "publisher": "FAO Agricultural Services Bulletin 119（1995）；Mircea Enachescu Dauthy",
    "url": "https://www.fao.org/4/v5030e/V5030E0s.htm",
    "locator": "§9.7.4 General heat preservation operations — canning：Air removal；Cooling；General technical operations c) Pre-heating",
    "note": "排除內容物與罐頂空間的空氣，可減少氧相關品質變化與腐蝕風險，並影響後續罐內壓力及冷卻真空。加熱排氣、熱填與真空封口可分別理解。只採工序與機理，不採通用排氣溫時、越高真空越長保存或安全配方。",
    "localPath": "output/canning-headspace-evidence-2026-10-13/source-review/sources/fao-vegetable-canning-live.html",
    "sha256": "e837ba6f6c8cf68c8098dea2be83675204c64af6268c7ea5fbd8bf01b6c87d9f"
  },
  {
    "id": "canning-source-fda-exhausting",
    "title": "Guide to Inspections of Low Acid Canned Food 10",
    "publisher": "U.S. Food and Drug Administration；歷史檢查指南，頁面未列本節修訂日期",
    "url": "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/inspection-guides/guide-inspections-low-acid-canned-food-10-0",
    "locator": "Containers may be exhausted...：Hot filling、Exhaust box、Mechanically、Steam injection、Combination、Gas Flush",
    "note": "熱填／排氣箱、機械抽真空及封前注蒸氣有不同機理；蒸氣排開空氣後可凝結，氮氣沖洗則不以此形成真空。只採定性方法，不採通用真空讀值、設備配方或現行法規認證。",
    "localPath": "output/canning-headspace-evidence-2026-10-13/source-review/sources/fda-lacf-exhausting-live.html",
    "sha256": "94263dae4d67031b26b3a01b4ba9ca0e232f290a7a8982563d273ad3b516819e"
  },
  {
    "id": "canning-source-fda-retort-cooling",
    "title": "Guide to Inspections of Low Acid Canned Food 25",
    "publisher": "U.S. Food and Drug Administration；歷史檢查指南，頁面未列本節修訂日期",
    "url": "https://www.fda.gov/guide-inspections-low-acid-canned-food-25",
    "locator": "Air may be supplied...：水冷卻時外部反壓及過大反壓造成 panelling 的段落",
    "note": "罐內外壓差須分開判讀；冷卻的外部反壓可改變機械負荷，過大也可能損傷容器。此段不提供可套用於本模型的強度門檻；釜內排氣與封罐前排氣是不同系統邊界。",
    "localPath": "output/canning-headspace-evidence-2026-10-13/source-review/sources/fda-lacf-retort-cooling-live.html",
    "sha256": "9218d483cee6f8d10ac954ce5b42e39c4b9bbb4c3abfe1bc01803df1268fd7d4"
  },
  {
    "id": "canning-source-iapws1992",
    "title": "Revised Supplementary Release on Saturation Properties of Ordinary Water Substance",
    "publisher": "International Association for the Properties of Water and Steam（1992）",
    "url": "https://iapws.org/technical-guidance/release/Supp-sat",
    "locator": "p.3 Eq.(1)；p.6 Eq.(10)；p.7 Table 1；七頁均已實際檢視",
    "note": "採純水飽和蒸氣壓關係、原式有效範圍及三個驗算點。本介面 20–95°C 為自選教學範圍，不是排氣或殺菌條件；有溶質的真實食品、非理想混合物及實際罐內熱歷程不由此確定。",
    "localPath": "output/canning-headspace-evidence-2026-10-13/source-review/sources/iapws-saturation-release-1992.pdf",
    "sha256": "a10d38d73339b0713c86cfac88f9adcba137202167ccdfa1cd58238c438361d7"
  },
  {
    "id": "canning-source-nasa-ideal-gas",
    "title": "Equation of State (Ideal Gas)",
    "publisher": "NASA Glenn Research Center；Beginner’s Guide to Aeronautics，頁面日期未確認",
    "url": "https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/equation-of-state-ideal-gas-2/",
    "locator": "Equation of State：pV=nRT；末段 absolute temperature",
    "note": "理想氣體方程使用絕對溫度；在固定非凝結氣體莫耳數及固定體積時，其分壓與 K 溫度成正比。本課的兩氣相分壓相加是理想混合物假設下的推導。攝氏換算另依 BIPM；不採其他 NASA 舊頁的 273.16 換算誤植。",
    "localPath": "output/canning-headspace-evidence-2026-10-13/source-review/sources/nasa-ideal-gas-system-trust.html",
    "sha256": "ca84ffd7ff2cc7276a18d75b922206ed00e7bd068ccd63ae115263004a1bc006"
  },
  {
    "id": "canning-source-bipm-si2026",
    "title": "The International System of Units (SI), 9th edition, V4.01",
    "publisher": "Bureau International des Poids et Mesures（June 2026）",
    "url": "https://doi.org/10.59161/AUEZ1291",
    "locator": "§2.3.1 The kelvin；印刷 p.129／英文 PDF 第 19 頁",
    "note": "採 t/°C=T/K−273.15 的定義，氣體壓力比使用 K。273.16 K 是另一個水三相點背景數值，不能用作攝氏零點的換算偏移。",
    "localPath": "output/canning-headspace-evidence-2026-10-13/source-review/sources/bipm-si-brochure-2026.pdf",
    "sha256": "5442eea2c680caf77a9d96879205a97f57c7c270b98a0bd0126c18fefe47e02c"
  }
]);
export const HEADSPACE_METHOD_CONTRACT=freeze([
  {
    "id": "heat",
    "label": "加熱排氣／熱填",
    "mechanism": "封口前加熱裝填內容物，或使用熱填；非凝結氣體可隨排氣減少。排氣箱處理與直接熱填是不同流程。",
    "boundary": "加热、时间、食品组织与封口延迟都会影响结果；此模型不从方法名字预测排气率或终点。",
    "sourceIds": [
      "canning-source-fao1995",
      "canning-source-fda-exhausting"
    ]
  },
  {
    "id": "vacuum",
    "label": "機械抽真空",
    "mechanism": "在真空環境抽除氣體後密封，改變封口狀態的總壓與殘留非凝結氣體量。",
    "boundary": "实际抽气能力、泄漏、溶气释出与组织气体未知；不能把某一真空读数当成通用合格标准。",
    "sourceIds": [
      "canning-source-fda-exhausting"
    ]
  },
  {
    "id": "steam",
    "label": "蒸氣置換",
    "mechanism": "封口前以蒸氣排開罐頂空間的空氣；封後冷卻時水蒸氣凝結，使氣相水的量減少。",
    "boundary": "氮气冲洗同样可能降低氧比例，却不会像水蒸气这样在本温度范围凝结；低氧不等于低总压。",
    "sourceIds": [
      "canning-source-fda-exhausting"
    ]
  }
]);
export const HEADSPACE_SOURCES=freeze(HEADSPACE_SOURCE_PROJECTION.map(({id,title,url,locator,note})=>({id,title,url,locator,note})));
// Boundary is renamed to scope with Traditional Chinese character localization only.
const traditionalScope=freeze({
  "heat": "加熱、時間、食品組織與封口延遲都會影響結果；此模型不從方法名字預測排氣率或終點。",
  "vacuum": "實際抽氣能力、洩漏、溶氣釋出與組織氣體未知；不能把某一真空讀數當成通用合格標準。",
  "steam": "氮氣沖洗同樣可能降低氧比例，卻不會像水蒸氣這樣在本溫度範圍凝結；低氧不等於低總壓。"
});
export const HEADSPACE_METHODS=freeze(HEADSPACE_METHOD_CONTRACT.map(({id,label,mechanism,sourceIds})=>({id,label,mechanism,scope:traditionalScope[id],sourceIds:[...sourceIds]})));
