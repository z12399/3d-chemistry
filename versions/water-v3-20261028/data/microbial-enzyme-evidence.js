// Source-pinned discrete observations. No interpolation, kinetics or inferred uncertainty.
const deepFreeze = value => { if (value && typeof value === "object") { Object.values(value).forEach(deepFreeze); Object.freeze(value); } return value; };

export const MICRO_ENZYME_SOURCES = deepFreeze([
  {
    "id": "micro-enzyme-source-ichimura2025",
    "title": "The effects of lactose hydrolysis on a sensory evaluation and the physical properties of a nonfat set yogurt",
    "publisher": "Ichimura and Ichiba；Journal of Dairy Research 91, 471–476；卷期 2024，線上發表 2025-03-05",
    "url": "https://www.cambridge.org/core/journals/journal-of-dairy-research/article/effects-of-lactose-hydrolysis-on-a-sensory-evaluation-and-the-physical-properties-of-a-nonfat-set-yogurt/F0F7E6AD59C31EFC78AB43CBC4BC28C7",
    "locator": "PDF p.2–3 Methods and Figure 1; p.4 Tables 1–2 and Results; p.5 discussion; DOI 10.1017/S0022029925000135",
    "note": "採四個名義預水解組的 16 個糖端點與 8 個菌數均值、刊載 ± 及字母。糖前後指發酵前後；菌數採樣時間、± 類型與獨立生產批次數未明。只轉述原作者分組，不新增檢定、誤差棒或動力學。",
    "localPath": "output/extrusion-evidence-2026-10-13/future-microbial-enzyme-sources/sources/ichimura2025-paper.pdf",
    "sha256": "1e550796c56beb0f1183d033eaef402c2a071231f1f6d8d2acc1aecf6e6a4db4"
  },
  {
    "id": "micro-enzyme-source-ichimura-supplement",
    "title": "Supplementary material: lactose hydrolysis and blended milk treatments",
    "publisher": "Ichimura and Ichiba；Cambridge University Press",
    "url": "https://static.cambridge.org/content/id/urn%3Acambridge.org%3Aid%3Aarticle%3AS0022029925000135/resource/name/S0022029925000135sup001.docx",
    "locator": "Tables S1 and S2, original DOCX word/document.xml",
    "note": "S2 支持未水解液與近完全水解液的四組混配；S1 屬另組酵素量／時間實驗。S1 的 4°C 與主文 5°C 未解，不將兩者合為確定配方或把名義 100% 寫成乳糖為零。",
    "localPath": "output/extrusion-evidence-2026-10-13/future-microbial-enzyme-sources/sources/ichimura2025-supplement.docx",
    "sha256": "52cea8b667aa1a472720fba3f2b86e066820844cf08505c538f9a5b62de7b8f7"
  },
  {
    "id": "micro-enzyme-source-godo",
    "title": "食品産業用酵素：GODO-YNL lactase",
    "publisher": "Oenon Group / Godo Shusei（製造者）",
    "url": "https://www.oenon.jp/enzymes/",
    "locator": "食品産業用 product table, GODO-YNL / lactase / Kluyveromyces lactis",
    "note": "製造者產品列支持 GODO-YNL 的乳糖酶及 K. lactis 來源身分。生產酵素的酵母不是優格 starter；未取得本研究製劑批號或生產菌株，亦不把 GODO-YNL 與 GODO-YNL 2 默認相同。",
    "localPath": "output/extrusion-evidence-2026-10-13/future-microbial-enzyme-sources/sources/godo-ynl-manufacturer.html",
    "sha256": "51c5b76eb3bb2cd764e4ce0ce8218eb21eb3fe9c979a97fc3272ead7a3e16299"
  },
  {
    "id": "micro-enzyme-source-efsa2023",
    "title": "Safety evaluation of the food enzyme β-galactosidase from the non-genetically modified Kluyveromyces lactis strain GD-YNL",
    "publisher": "EFSA CEP Panel；EFSA Journal（2023）",
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9854175/",
    "locator": "Assessment §3 and §3.1; intended uses §3.5.1; DOI 10.2903/j.efsa.2023.7750",
    "note": "只採 β-galactosidase EC 3.2.1.23 水解乳糖 β(1→4) 鍵生成 D-glucose 與 D-galactose 的機理及評估製劑身分。不是實驗製劑批號證明，也不把文件的安全結論轉移成任意產品或本課製程安全確效。",
    "localPath": "output/extrusion-evidence-2026-10-13/future-microbial-enzyme-sources/sources/efsa-2023-gd-ynl-xml.xml",
    "sha256": "7f481affc05a2bb6a434b327779daad6266be3d276ebeb0a64114697e0d9117d"
  },
  {
    "id": "micro-enzyme-source-ntu115-q4",
    "title": "115 食品微生物學原卷第 4 題",
    "publisher": "National Taiwan University",
    "url": "https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-241.pdf",
    "locator": "PDF page 1 question 4, three subquestions",
    "note": "題目情境為無乳糖牛乳發酵食品，要求微生物酵素的實務目的、機制與主要基質／產物、對 starter 生長或代謝的可能影響；可選作用於醣類或蛋白質的酵素。本課採乳糖酶作一條教學路徑，並非官方標準答案。",
    "localPath": "output/sensory-continuity-evidence-2026-10-13/official-gap-refresh/sources/ntu-115-microbiology-live.pdf",
    "sha256": "d3ad12a25c0115a817ec742bb648635337db8657cb0d98fc66e7d9190f969d8c"
  }
]);

export const MICRO_ENZYME_ROWS = deepFreeze([
  {
    "id": "ichimura-2025-h0",
    "nominalHydrolysisPercent": 0,
    "treatment": "Blend non-hydrolyzed and almost-completely-hydrolyzed milk before inoculation; 100 is a nominal group label, not an exact zero-lactose claim.",
    "sugars": {
      "lactoseBefore": {
        "raw": "6.04",
        "value": 6.04,
        "operator": "=",
        "bound": null,
        "unit": "%（原表）"
      },
      "lactoseAfter": {
        "raw": "4.83",
        "value": 4.83,
        "operator": "=",
        "bound": null,
        "unit": "%（原表）"
      },
      "glucoseBefore": {
        "raw": "<0.03",
        "value": null,
        "operator": "<",
        "bound": 0.03,
        "unit": "%（原表）",
        "lodVsLoq": "not specified here"
      },
      "glucoseAfter": {
        "raw": "<0.03",
        "value": null,
        "operator": "<",
        "bound": 0.03,
        "unit": "%（原表）",
        "lodVsLoq": "not specified here"
      }
    },
    "cells": {
      "L_bulgaricus_2038": {
        "meanReported": 1.6,
        "plusMinusReported": 0.3,
        "raw": "1.6 ± 0.3",
        "letter": "b"
      },
      "S_thermophilus_1131": {
        "meanReported": 9.2,
        "plusMinusReported": 0.6,
        "raw": "9.2 ± 0.6",
        "letter": null
      }
    },
    "cellUnit": "10^8 CFU/g",
    "cellPlusMinusType": null,
    "cellIndependentBatchN": null,
    "cellObservationTime": "Finished yogurt samples; exact count time is not separately stated in Methods.",
    "sourceLocator": "Ichimura and Ichiba, J Dairy Res 91 pp.471–476; PDF p.4 / printed p.474, Tables 1 and 2",
    "status": "ADOPTED_DISCRETE_SUGAR_AND_CFU_ENDPOINTS"
  },
  {
    "id": "ichimura-2025-h50",
    "nominalHydrolysisPercent": 50,
    "treatment": "Blend non-hydrolyzed and almost-completely-hydrolyzed milk before inoculation; 100 is a nominal group label, not an exact zero-lactose claim.",
    "sugars": {
      "lactoseBefore": {
        "raw": "3.02",
        "value": 3.02,
        "operator": "=",
        "bound": null,
        "unit": "%（原表）"
      },
      "lactoseAfter": {
        "raw": "1.76",
        "value": 1.76,
        "operator": "=",
        "bound": null,
        "unit": "%（原表）"
      },
      "glucoseBefore": {
        "raw": "1.46",
        "value": 1.46,
        "operator": "=",
        "bound": null,
        "unit": "%（原表）"
      },
      "glucoseAfter": {
        "raw": "1.41",
        "value": 1.41,
        "operator": "=",
        "bound": null,
        "unit": "%（原表）"
      }
    },
    "cells": {
      "L_bulgaricus_2038": {
        "meanReported": 1.9,
        "plusMinusReported": 0.4,
        "raw": "1.9 ± 0.4",
        "letter": "b"
      },
      "S_thermophilus_1131": {
        "meanReported": 8.6,
        "plusMinusReported": 0.4,
        "raw": "8.6 ± 0.4",
        "letter": null
      }
    },
    "cellUnit": "10^8 CFU/g",
    "cellPlusMinusType": null,
    "cellIndependentBatchN": null,
    "cellObservationTime": "Finished yogurt samples; exact count time is not separately stated in Methods.",
    "sourceLocator": "Ichimura and Ichiba, J Dairy Res 91 pp.471–476; PDF p.4 / printed p.474, Tables 1 and 2",
    "status": "ADOPTED_DISCRETE_SUGAR_AND_CFU_ENDPOINTS"
  },
  {
    "id": "ichimura-2025-h75",
    "nominalHydrolysisPercent": 75,
    "treatment": "Blend non-hydrolyzed and almost-completely-hydrolyzed milk before inoculation; 100 is a nominal group label, not an exact zero-lactose claim.",
    "sugars": {
      "lactoseBefore": {
        "raw": "1.51",
        "value": 1.51,
        "operator": "=",
        "bound": null,
        "unit": "%（原表）"
      },
      "lactoseAfter": {
        "raw": "0.26",
        "value": 0.26,
        "operator": "=",
        "bound": null,
        "unit": "%（原表）"
      },
      "glucoseBefore": {
        "raw": "2.20",
        "value": 2.2,
        "operator": "=",
        "bound": null,
        "unit": "%（原表）"
      },
      "glucoseAfter": {
        "raw": "2.14",
        "value": 2.14,
        "operator": "=",
        "bound": null,
        "unit": "%（原表）"
      }
    },
    "cells": {
      "L_bulgaricus_2038": {
        "meanReported": 1.6,
        "plusMinusReported": 0.5,
        "raw": "1.6 ± 0.5",
        "letter": "b"
      },
      "S_thermophilus_1131": {
        "meanReported": 8.5,
        "plusMinusReported": 1.1,
        "raw": "8.5 ± 1.1",
        "letter": null
      }
    },
    "cellUnit": "10^8 CFU/g",
    "cellPlusMinusType": null,
    "cellIndependentBatchN": null,
    "cellObservationTime": "Finished yogurt samples; exact count time is not separately stated in Methods.",
    "sourceLocator": "Ichimura and Ichiba, J Dairy Res 91 pp.471–476; PDF p.4 / printed p.474, Tables 1 and 2",
    "status": "ADOPTED_DISCRETE_SUGAR_AND_CFU_ENDPOINTS"
  },
  {
    "id": "ichimura-2025-h100",
    "nominalHydrolysisPercent": 100,
    "treatment": "Blend non-hydrolyzed and almost-completely-hydrolyzed milk before inoculation; 100 is a nominal group label, not an exact zero-lactose claim.",
    "sugars": {
      "lactoseBefore": {
        "raw": "<0.03",
        "value": null,
        "operator": "<",
        "bound": 0.03,
        "unit": "%（原表）",
        "lodVsLoq": "not specified here"
      },
      "lactoseAfter": {
        "raw": "<0.03",
        "value": null,
        "operator": "<",
        "bound": 0.03,
        "unit": "%（原表）",
        "lodVsLoq": "not specified here"
      },
      "glucoseBefore": {
        "raw": "2.93",
        "value": 2.93,
        "operator": "=",
        "bound": null,
        "unit": "%（原表）"
      },
      "glucoseAfter": {
        "raw": "2.31",
        "value": 2.31,
        "operator": "=",
        "bound": null,
        "unit": "%（原表）"
      }
    },
    "cells": {
      "L_bulgaricus_2038": {
        "meanReported": 2.9,
        "plusMinusReported": 0.3,
        "raw": "2.9 ± 0.3",
        "letter": "a"
      },
      "S_thermophilus_1131": {
        "meanReported": 8.8,
        "plusMinusReported": 0.6,
        "raw": "8.8 ± 0.6",
        "letter": null
      }
    },
    "cellUnit": "10^8 CFU/g",
    "cellPlusMinusType": null,
    "cellIndependentBatchN": null,
    "cellObservationTime": "Finished yogurt samples; exact count time is not separately stated in Methods.",
    "sourceLocator": "Ichimura and Ichiba, J Dairy Res 91 pp.471–476; PDF p.4 / printed p.474, Tables 1 and 2",
    "status": "ADOPTED_DISCRETE_SUGAR_AND_CFU_ENDPOINTS"
  }
]);

export const MICRO_ENZYME_STUDY = deepFreeze({
  "id": "ichimura-ichiba-2025-yogurt",
  "title": "The effects of lactose hydrolysis on a sensory evaluation and the physical properties of a nonfat set yogurt",
  "doi": "10.1017/S0022029925000135",
  "publication": {
    "issueYear": 2024,
    "firstOnlineDate": "2025-03-05",
    "license": "CC BY 4.0"
  },
  "treatmentAxis": {
    "key": "nominalHydrolysisPercent",
    "label": "名義預水解組別",
    "groups": [
      0,
      50,
      75,
      100
    ],
    "unit": "%",
    "meaning": "未水解液與近完全水解液先分別熱處理、冷卻，再混配及接種。",
    "notEnzymeDose": true,
    "actual100PercentBoundary": ">99.5% 水解的估計與乳糖 <0.03% 支持近完全水解；100% 仍是組名，不等於分析零。",
    "sourceIds": [
      "micro-enzyme-source-ichimura2025",
      "micro-enzyme-source-ichimura-supplement"
    ]
  },
  "substrate": {
    "label": "11.3% (w/w) 重組脫脂乳粉溶液",
    "lactosePercentReported": 6.04,
    "boundary": "限所選乳基；糖濃度改變不是完整碳收支。"
  },
  "enzyme": {
    "label": "GODO-YNL lactase",
    "producerSpecies": "Kluyveromyces lactis",
    "productionStrain": null,
    "batch": null,
    "boundary": "論文未提供實驗批號／生產菌株；EFSA 評估用 GD-YNL 及 GODO-YNL2 不默認等於這份實驗製劑。",
    "sourceIds": [
      "micro-enzyme-source-ichimura2025",
      "micro-enzyme-source-godo",
      "micro-enzyme-source-efsa2023"
    ]
  },
  "starters": [
    {
      "id": "L_bulgaricus_2038",
      "label": "L. bulgaricus 2038",
      "scientificName": "Lactobacillus delbrueckii subsp. bulgaricus",
      "strain": "2038"
    },
    {
      "id": "S_thermophilus_1131",
      "label": "S. thermophilus 1131",
      "scientificName": "Streptococcus thermophilus",
      "strain": "1131"
    }
  ],
  "preparation": {
    "hydrolysisTemperatureC": null,
    "hydrolysisTemperatureConflict": {
      "mainMethodsC": 5,
      "supplementS1C": 4
    },
    "order": [
      "prehydrolyze",
      "heat-cool",
      "blend",
      "ferment",
      "measure"
    ],
    "heatTreatment": {
      "temperatureC": 95,
      "durationMin": 5,
      "appliesTo": "Both non-hydrolyzed and nearly fully hydrolyzed stock solutions, before blending and inoculation."
    }
  },
  "fermentation": {
    "starter": "LB81",
    "inoculumPercentWw": 3,
    "temperatureC": 40,
    "endpointPH": 4.6,
    "dissolvedOxygen": "<2 ppm, reduced using nitrogen",
    "storageTemperatureC": 5,
    "sampleMassG": 80,
    "cupVolumeMl": 100,
    "boundary": "原研究條件，不是通用製程食譜或安全建議。"
  },
  "sugarMeasurement": {
    "method": "HPLC with refractive-index detection",
    "beforeLabel": "發酵前",
    "afterLabel": "發酵後",
    "unit": "%（原表）",
    "massBasis": {
      "lactose": "w/w explicitly stated in Methods and hydrolysis formula",
      "glucose": null
    },
    "analytes": [
      "lactose",
      "glucose"
    ],
    "galactoseValuesAvailable": false,
    "censoredReportBound": 0.03,
    "lodVsLoq": null,
    "boundary": "Table 1 只標 %；Methods 的乳糖濃度與水解公式明示 w/w，葡萄糖質量基準未另明。表中的前後指發酵；水解計算公式的前後另指水解。<0.03 不取代為零；沒有半乳糖表值，不能配完整物料平衡或代謝得率。"
  },
  "cellMeasurement": {
    "unit": "10^8 CFU/g",
    "observationTime": null,
    "observationTimeNote": "成品樣品；Methods 未另定菌數採樣時間。約 24 h 的評估清單沒有列菌數。",
    "plusMinusType": null,
    "independentBatchN": null,
    "method": "Pour plates, bromocresol-purple plate-count agar; anaerobic 37°C 48 h; rough/smooth colony morphology distinguishes the reported organisms.",
    "reportedReplication": "Assays/analyses in triplicate; independent fermentation-batch number not established.",
    "boundary": "指定菌株的可培養菌數端點；不是細胞總量、兩菌比例、增殖速率或倍增時間。"
  },
  "statistics": {
    "groupLetters": "Different letters within the same Table 2 column indicate P<0.05 as reported by the authors.",
    "L_bulgaricus_2038": "原刊 b/b/b/a；作者分析中 100% 組高於其餘三組，均值序列不是單調增加。",
    "S_thermophilus_1131": "原表無字母；正文報告未觀察到菌數改變。均值差不建立抑制、顯著下降或統計等效。",
    "plusMinusType": null,
    "newTestsAllowed": false,
    "boundary": "保留原作者分組；不自製誤差棒、信賴區間或新的顯著性檢定。"
  },
  "crossLessonLinks": [
    {
      "label": "切斷糖苷鍵",
      "href": "#learn/carbohydrates/carb-hydrolysis/observe",
      "boundary": "既有乳糖水解化學互動；不以反應分鏡代替本研究糖濃度與菌數觀察。"
    },
    {
      "label": "人體乳糖酶的水解分鏡",
      "href": "#learn/enzymes/enzyme-human-lactase/observe",
      "boundary": "人體 LPH 的化學教學分鏡，不是 K. lactis 酵素的結構、實測軌跡或本研究反應速率。"
    }
  ],
  "sourceIds": [
    "micro-enzyme-source-ichimura2025",
    "micro-enzyme-source-ichimura-supplement",
    "micro-enzyme-source-godo",
    "micro-enzyme-source-efsa2023"
  ],
  "authorInterpretations": [
    {
      "id": "sugar-use-and-acid",
      "label": "糖利用與產酸可能不同",
      "statement": "作者以糖組成改變及兩菌利用乳糖／葡萄糖的差異，解釋預水解後的代謝表現；並援引 L. bulgaricus 使用葡萄糖時產酸能力較低的先前研究，討論為何較多可培養菌仍可伴隨較慢的冷藏酸化。",
      "sourceIds": [
        "micro-enzyme-source-ichimura2025"
      ],
      "locator": "PDF p.4 Lactic acid bacteria and extracellular polysaccharides; p.5 Post-acidification",
      "boundary": "這是作者提出的解釋，部分援引先前文獻；本課未獨立審閱所有被引原文。Tables 1–2 沒有糖運輸、逐菌糖利用或產酸通量對照，不能說本表已證明路徑，也不能套用到所有乳酸菌。",
      "layer": "author-proposed-mechanism"
    },
    {
      "id": "oxygen-and-formate",
      "label": "溶氧與甲酸供應的候選作用",
      "statement": "作者援引先前共培研究，提出較快降溶氧與甲酸供應可能促進 L. bulgaricus；本研究事先降低溶氧後仍見 100% 組菌數較高，因此具體增多機理仍待釐清。",
      "sourceIds": [
        "micro-enzyme-source-ichimura2025"
      ],
      "locator": "PDF p.3–4 fermentation-time discussion and Lactic acid bacteria section; p.5 conclusion",
      "boundary": "這是作者對前人研究及本次結果的討論。本課沒有溶氧時間列、甲酸濃度或相應單培／共培控制；未獨立審閱被引 2021 論文全文，不能當成本研究直接量到的因果鏈。",
      "layer": "author-proposed-mechanism"
    }
  ]
});

export const MICRO_ENZYME_REACTION = deepFreeze({
  "id": "lactose-hydrolysis",
  "label": "乳糖先水解，改變可利用的糖",
  "enzyme": "乳糖酶／β-galactosidase（EC 3.2.1.23）",
  "producer": "Kluyveromyces lactis（酵素製造來源）",
  "substrate": "乳糖與水",
  "products": [
    "D-葡萄糖",
    "D-半乳糖"
  ],
  "equation": "乳糖 + H₂O → D-葡萄糖 + D-半乳糖",
  "bond": "乳糖中的 β(1→4) 糖苷鍵",
  "purpose": "在發酵前降低乳基質乳糖，改變提供給發酵菌的糖組成。",
  "sourceIds": [
    "micro-enzyme-source-ichimura2025",
    "micro-enzyme-source-godo",
    "micro-enzyme-source-efsa2023"
  ],
  "boundary": "生產酵素的 K. lactis 不是本研究接種的兩種發酵菌。反應式說明水解，不預測各菌生長、酸化速度、甜度或乳糖法規達標；半乳糖沒有本研究數值表。"
});

export const MICRO_ENZYME_PROCESS_STEPS = deepFreeze([
  {
    "id": "prehydrolyze",
    "label": "部分乳基先水解",
    "mechanism": "將脫脂乳基分成未水解液與近完全水解液；後者先使用 GODO-YNL 乳糖酶降低乳糖。",
    "sourceIds": [
      "micro-enzyme-source-ichimura2025",
      "micro-enzyme-source-ichimura-supplement",
      "micro-enzyme-source-godo"
    ],
    "boundary": "主文寫 5°C，補充表 S1 寫 4°C，尚未釐清。本課不提供可直接照做的溫度／劑量／時間配方。",
    "layer": "study-protocol"
  },
  {
    "id": "heat-cool",
    "label": "兩份都加熱、冷卻",
    "mechanism": "未水解液與近完全水解液都經 95°C、5 min 加熱及冷卻，再進行混配與接種。",
    "sourceIds": [
      "micro-enzyme-source-ichimura2025"
    ],
    "boundary": "這是所選研究的製備時序，不等於其他產品的安全確效；不能畫成酵素與 starter 同時加入。",
    "layer": "study-protocol"
  },
  {
    "id": "blend",
    "label": "混配四個預水解組",
    "mechanism": "依未水解液與水解液混配，形成名義 0、50、75、100% 四組；再量糖並進入發酵。",
    "sourceIds": [
      "micro-enzyme-source-ichimura2025",
      "micro-enzyme-source-ichimura-supplement"
    ],
    "boundary": "百分比是名義預水解處理組，具分析估計依據；不是酵素添加百分比、每小時水解速率或發酵後端點。100% 組不代表乳糖精確為零。",
    "layer": "study-protocol"
  },
  {
    "id": "ferment",
    "label": "接種兩菌、發酵",
    "mechanism": "接入 LB81：L. delbrueckii subsp. bulgaricus 2038 與 S. thermophilus 1131；在 40°C 至 pH 4.6，使用氮氣使溶氧低於 2 ppm。",
    "sourceIds": [
      "micro-enzyme-source-ichimura2025"
    ],
    "boundary": "這是兩個指定菌株與低溶氧條件；pH 終點不等於糖全耗盡、健康效益或安全合格，也不能推定所有乳酸菌都同向增加。",
    "layer": "study-protocol"
  },
  {
    "id": "measure",
    "label": "糖與菌數分開量",
    "mechanism": "HPLC 比較發酵前後的乳糖與葡萄糖；成品樣品另以培養平板計數，區分兩菌的 CFU/g。",
    "sourceIds": [
      "micro-enzyme-source-ichimura2025"
    ],
    "boundary": "糖表與水解公式的「前後」意義不同；菌數確切採樣時點未明，不能指定為 24 h 或拿兩組 CFU 算增殖速率。刊載 ± 未定義 SD／SE。",
    "layer": "study-protocol"
  }
]);

export const MICRO_ENZYME_LIMITS = deepFreeze([
  {
    "id": "hydrolysis-temperature",
    "label": "預水解溫度有衝突",
    "locator": "Main Methods / Figure 1; Supplement Table S1",
    "observed": "主文 5°C；S1 表頭 4°C。",
    "treatment": "保留兩值，水解溫度設為 unknown；不合成確定製程配方。"
  },
  {
    "id": "unspecified-plusminus",
    "label": "刊載 ± 沒有類型",
    "locator": "PDF p.4 Table 2",
    "observed": "菌數有 ±，主文未明示為 SD 或 SE。",
    "treatment": "原字串照列；不畫誤差棒、不建立 CI、不重做檢定。"
  },
  {
    "id": "replication",
    "label": "量測重複與生產批次不同",
    "locator": "Methods: assays / analyses in triplicate",
    "observed": "方法寫三重複，獨立發酵生產批次數未交代。",
    "treatment": "獨立批次數保留 null，不能把 n=3 當作已知三批生產。"
  },
  {
    "id": "cfu-timing",
    "label": "菌數採樣時間未另說明",
    "locator": "Methods evaluation paragraph; Table 2",
    "observed": "約 24 h 的清單列物性、感官、EPS、糖，沒有列菌數。",
    "treatment": "只稱成品樣品菌數；時間 unknown，不指定立即終點或 24 h，不計生長率。"
  },
  {
    "id": "censored-sugar",
    "label": "小於門檻不是零",
    "locator": "PDF p.4 Table 1",
    "observed": "部分乳糖／葡萄糖刊載 <0.03%；未分辨 LOD 與 LOQ。",
    "treatment": "保留原小於號、null 值及報告上界；不計這些端點的精確差、百分比變化或認定毫無消耗。"
  },
  {
    "id": "sugar-unit-basis",
    "label": "糖百分比的基準標示",
    "locator": "PDF p.2–3 Methods and lactose hydrolysis formula; p.4 Table 1",
    "observed": "Table 1 只標 %；Methods 只對乳糖明示 w/w，葡萄糖質量基準未另說明。",
    "treatment": "四欄顯示 %（原表）；同糖的前後差只稱原表百分濃度差，不能把所有糖都聲稱明示 w/w 或跨糖配物料衡算。"
  },
  {
    "id": "nominal-groups",
    "label": "組名不是添加量或動力學",
    "locator": "Methods / Figure 1; Supplement Tables S1–S2",
    "observed": "0/50/75/100% 為預水解混配組；100% 組分析顯示近完全水解。",
    "treatment": "不得當作酵素添加百分比、每小時速率、發酵後端點或乳糖分析零；S1 不併入主表比較。"
  },
  {
    "id": "missing-galactose",
    "label": "沒有半乳糖數值",
    "locator": "Table 1; HPLC Methods",
    "observed": "反應會產生半乳糖，但採用表格只有乳糖和葡萄糖。",
    "treatment": "分開化學反應與實測量，不虛構半乳糖表值、碳流或完整物料平衡。"
  },
  {
    "id": "enzyme-identity",
    "label": "製劑批次與菌株未知",
    "locator": "Paper GODO-YNL; manufacturer product table; EFSA assessment",
    "observed": "製造商支持 K. lactis 來源；本研究沒給製劑批號／生產菌株。",
    "treatment": "不默認 EFSA 的 GD-YNL／GODO-YNL2 就是實驗製劑；不把酵母列為 yogurt starter。"
  },
  {
    "id": "group-interpretation",
    "label": "作者分組不等於單調或等效",
    "locator": "PDF p.4 Table 2 and Results",
    "observed": "L. bulgaricus 字母 b/b/b/a；S. thermophilus 無字母且正文報告未觀察到改變。",
    "treatment": "L 的 100% 組較高不代表隨比例單調增加；S 的報告不等於已證明統計等效，均值下降也不證明抑制。"
  },
  {
    "id": "mechanism-and-time",
    "label": "端點未確立因果機制與速度",
    "locator": "Methods / Results / Discussion; Figure 2",
    "observed": "有菌數端點及定性酸化歷程，沒有本包可採用的原始時間序列。",
    "treatment": "不能從兩組 CFU 算速率，或由葡萄糖差證明特定運輸／代謝機制。作者低溶氧條件下的發酵時間觀察不外推全部製程。"
  },
  {
    "id": "excluded-endpoints",
    "label": "未採數值的部分",
    "locator": "Table 1 EPS; Methods and Figure 3 sensory scale; Figures 2–4",
    "observed": "EPS 單位印 mg/ml 未釐清；感官量尺文字與圖軸衝突；曲線無精確陣列。",
    "treatment": "不自行修單位、不採 EPS／感官／曲線數值，不從像素反推資料或擬合。"
  },
  {
    "id": "scope",
    "label": "菌株與製程限制",
    "locator": "Study Methods; selected source scope",
    "observed": "研究是指定乳基、LB81 兩菌株與低溶氧條件。",
    "treatment": "不能宣稱所有 starter 都增加、普遍加速、健康效益、安全確效、最佳劑量或符合某法規無乳糖門檻。"
  }
]);

