// Reviewed candidate-data-v2 rows are preserved exactly. Do not update the
// literal or its identity without a new source review. This file performs no I/O.
export const LYOPROTECTANT_STORAGE_SOURCE_DATA_SHA256 = '3ccb26d8ae0534acebfc8a112515437dc7fdfab1093ffc88d1da01d1c7c4901d';
export const LYOPROTECTANT_STORAGE_RESEARCH_SHA256 = '53d361ea8499ba2df4ca3e1c459a125e77884629b43a30f3b49282522a927dd2';

const PINNED = {
  "schema": "lyoprotectant-storage-evidence",
  "version": 1,
  "id": "lyoprotectant-storage-evidence",
  "researchProvenance": {
    "path": "output/processing-next-capability-2026-10-16/candidate-data-v2.json",
    "sha256": "53d361ea8499ba2df4ca3e1c459a125e77884629b43a30f3b49282522a927dd2",
    "originalStatus": "research candidate only; not installed curriculum or runtime data",
    "rowPolicy": "All 20 research rows retained exactly, including values, SD, letters, units, sample size and locators."
  },
  "source": {
    "id": "bodzen2021",
    "doi": "10.1186/s12896-021-00726-2",
    "publisherUrl": "https://link.springer.com/article/10.1186/s12896-021-00726-2",
    "pdf": {
      "path": "output/processing-next-capability-2026-10-16/sources/lyoprotectant2021-publisher.pdf",
      "bytes": 1231882,
      "sha256": "12bf0130653b55e65dfb2aa8b89da0b49f934d5ae51ff9e297982757f485bdee"
    },
    "xml": {
      "path": "output/processing-next-capability-2026-10-16/sources/lyoprotectant2021-europepmc.xml",
      "bytes": 101618,
      "sha256": "fa0afed7566a68853eb80e968532e32fa8252291f4689b13b0bf39057079d8a3"
    },
    "dataLocator": "PDF p5 Table 1; XML Tab1",
    "methodsLocators": [
      "PDF pp7-8",
      "XML Par35-Par39"
    ],
    "license": "CC BY 4.0 as declared in source"
  },
  "fixedConditions": {
    "strain": "Lactiplantibacillus plantarum CNCM I-4459",
    "storageCelsius": 25,
    "illumination": "dark",
    "container": "5 mL amber glass vial, 1 mL suspension before drying",
    "closure": "butyl rubber stopper and aluminum cap; sealed under 10 Pa vacuum; vacuum checked before enumeration",
    "rehydration": "1 mL MRS broth at 37 C",
    "zeroTime": "after freeze-drying",
    "basis": "culturable concentration in rehydrated sample; not CFU/g dry powder or serving",
    "freezeDrying": "source-specific 24 h protocol after -80 C freezing at -2 C/min; not an executable production recommendation"
  },
  "formulas": [
    {
      "id": "sucrose",
      "label": "5% sucrose",
      "composition": "5% m/v sucrose in PBS"
    },
    {
      "id": "sucrose-micellar-casein",
      "label": "5% sucrose + 5% micellar casein",
      "composition": "5% m/v sucrose plus 5% micellar casein (87B Fluid) in PBS"
    },
    {
      "id": "sucrose-whey",
      "label": "5% sucrose + 5% whey protein isolate",
      "composition": "5% m/v sucrose plus 5% whey protein isolate, hydrolysis degree 25%, in PBS"
    },
    {
      "id": "sucrose-inulin",
      "label": "5% sucrose + 5% inulin DP10",
      "composition": "5% m/v sucrose plus 5% inulin DP10 in PBS"
    }
  ],
  "rows": [
    {
      "id": "bodzen2021-t0-sucrose",
      "formulaId": "sucrose",
      "storageMonths": 0,
      "sourceTimeLabel": "0 month",
      "methodTimeLabel": "0 month",
      "mean": 19000000000,
      "sd": 2500000000,
      "tukeyLetters": "a",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[1,2], data columns 1",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t0-sucrose-micellar-casein",
      "formulaId": "sucrose-micellar-casein",
      "storageMonths": 0,
      "sourceTimeLabel": "0 month",
      "methodTimeLabel": "0 month",
      "mean": 14000000000,
      "sd": 1900000000,
      "tukeyLetters": "a",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[1,2], data columns 2",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t0-sucrose-whey",
      "formulaId": "sucrose-whey",
      "storageMonths": 0,
      "sourceTimeLabel": "0 month",
      "methodTimeLabel": "0 month",
      "mean": 18000000000,
      "sd": 1200000000,
      "tukeyLetters": "a",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[1,2], data columns 3",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t0-sucrose-inulin",
      "formulaId": "sucrose-inulin",
      "storageMonths": 0,
      "sourceTimeLabel": "0 month",
      "methodTimeLabel": "0 month",
      "mean": 18000000000,
      "sd": 1800000000,
      "tukeyLetters": "a",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[1,2], data columns 4",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t0_5-sucrose",
      "formulaId": "sucrose",
      "storageMonths": 0.5,
      "sourceTimeLabel": "0.5 month",
      "methodTimeLabel": "15 days",
      "mean": 16000000000,
      "sd": 2000000000,
      "tukeyLetters": "a",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[3,4], data columns 1",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t0_5-sucrose-micellar-casein",
      "formulaId": "sucrose-micellar-casein",
      "storageMonths": 0.5,
      "sourceTimeLabel": "0.5 month",
      "methodTimeLabel": "15 days",
      "mean": 9400000000,
      "sd": 2100000000,
      "tukeyLetters": "ab",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[3,4], data columns 2",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t0_5-sucrose-whey",
      "formulaId": "sucrose-whey",
      "storageMonths": 0.5,
      "sourceTimeLabel": "0.5 month",
      "methodTimeLabel": "15 days",
      "mean": 4800000000,
      "sd": 970000000,
      "tukeyLetters": "b",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[3,4], data columns 3",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t0_5-sucrose-inulin",
      "formulaId": "sucrose-inulin",
      "storageMonths": 0.5,
      "sourceTimeLabel": "0.5 month",
      "methodTimeLabel": "15 days",
      "mean": 11000000000,
      "sd": 6600000000,
      "tukeyLetters": "ab",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[3,4], data columns 4",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t1-sucrose",
      "formulaId": "sucrose",
      "storageMonths": 1,
      "sourceTimeLabel": "1 month",
      "methodTimeLabel": "1 month",
      "mean": 11000000000,
      "sd": 4600000000,
      "tukeyLetters": "a",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[5,6], data columns 1",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t1-sucrose-micellar-casein",
      "formulaId": "sucrose-micellar-casein",
      "storageMonths": 1,
      "sourceTimeLabel": "1 month",
      "methodTimeLabel": "1 month",
      "mean": 10000000000,
      "sd": 2000000000,
      "tukeyLetters": "a",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[5,6], data columns 2",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t1-sucrose-whey",
      "formulaId": "sucrose-whey",
      "storageMonths": 1,
      "sourceTimeLabel": "1 month",
      "methodTimeLabel": "1 month",
      "mean": 790000000,
      "sd": 770000000,
      "tukeyLetters": "b",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[5,6], data columns 3",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t1-sucrose-inulin",
      "formulaId": "sucrose-inulin",
      "storageMonths": 1,
      "sourceTimeLabel": "1 month",
      "methodTimeLabel": "1 month",
      "mean": 1600000000,
      "sd": 640000000,
      "tukeyLetters": "b",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[5,6], data columns 4",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t3-sucrose",
      "formulaId": "sucrose",
      "storageMonths": 3,
      "sourceTimeLabel": "3 months",
      "methodTimeLabel": "3 months",
      "mean": 1500000000,
      "sd": 100000000,
      "tukeyLetters": "ab",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[7,8], data columns 1",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t3-sucrose-micellar-casein",
      "formulaId": "sucrose-micellar-casein",
      "storageMonths": 3,
      "sourceTimeLabel": "3 months",
      "methodTimeLabel": "3 months",
      "mean": 3400000000,
      "sd": 3000000000,
      "tukeyLetters": "a",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[7,8], data columns 2",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t3-sucrose-whey",
      "formulaId": "sucrose-whey",
      "storageMonths": 3,
      "sourceTimeLabel": "3 months",
      "methodTimeLabel": "3 months",
      "mean": 2600000000,
      "sd": 3600000000,
      "tukeyLetters": "a",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[7,8], data columns 3",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": true
    },
    {
      "id": "bodzen2021-t3-sucrose-inulin",
      "formulaId": "sucrose-inulin",
      "storageMonths": 3,
      "sourceTimeLabel": "3 months",
      "methodTimeLabel": "3 months",
      "mean": 100000000,
      "sd": 140000000,
      "tukeyLetters": "b",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[7,8], data columns 4",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": true
    },
    {
      "id": "bodzen2021-t9-sucrose",
      "formulaId": "sucrose",
      "storageMonths": 9,
      "sourceTimeLabel": "9 months",
      "methodTimeLabel": "9 months",
      "mean": 19000000,
      "sd": 3200000,
      "tukeyLetters": "b",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[9,10], data columns 1",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t9-sucrose-micellar-casein",
      "formulaId": "sucrose-micellar-casein",
      "storageMonths": 9,
      "sourceTimeLabel": "9 months",
      "methodTimeLabel": "9 months",
      "mean": 5800000000,
      "sd": 990000000,
      "tukeyLetters": "a",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[9,10], data columns 2",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t9-sucrose-whey",
      "formulaId": "sucrose-whey",
      "storageMonths": 9,
      "sourceTimeLabel": "9 months",
      "methodTimeLabel": "9 months",
      "mean": 4700000,
      "sd": 1000000,
      "tukeyLetters": "b",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[9,10], data columns 3",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    },
    {
      "id": "bodzen2021-t9-sucrose-inulin",
      "formulaId": "sucrose-inulin",
      "storageMonths": 9,
      "sourceTimeLabel": "9 months",
      "methodTimeLabel": "9 months",
      "mean": 1900000,
      "sd": 1000000,
      "tukeyLetters": "b",
      "unit": "CFU/mL",
      "n": 3,
      "replicateType": "completely independent triplicates as reported; individual values unavailable",
      "sourceId": "bodzen2021",
      "locator": "PDF p5 Table 1; XML Tab1 tbody tr[9,10], data columns 4",
      "individualReplicates": null,
      "confidenceInterval": null,
      "meanMinusSdNonpositive": false
    }
  ],
  "interpretation": {
    "error": "SD, not SEM or CI; preserve source values including SD greater than mean",
    "letters": "within a storage-time row, nonoverlapping letters indicate source-reported Tukey HSD p<0.05; do not compare letters across times",
    "outOfDomain": "unknown, no interpolation or extrapolation",
    "totalSolids": "nominal added materials differ: control 5% vs mixtures 5%+5%; measured total dry solids including PBS and cells not given here",
    "doNotDerive": [
      "freeze-drying survival percentage without pre-drying CFU",
      "Fig2 paired log-change or its SD from Table1 ratios of means",
      "CFU/g or CFU/serving",
      "continuous decay rate, half-life or shelf life",
      "health benefit, universal strain ranking, process safety",
      "aw causality or aw response surface"
    ],
    "unknowns": [
      "individual replicate observations and pairing",
      "raw dry-mass denominators for Fig2",
      "out-of-domain strain, temperature, package and time",
      "equal-solids control comparison",
      "water-activity replicate uncertainty: independent-triplicate claim excludes aw"
    ]
  },
  "derivationRevision": {
    "version": 2,
    "reason": "Decimal parsing avoids binary mantissa multiplication error; no source observation changed",
    "supersedes": "candidate-data-v1.json",
    "priorSha256": "3d54771fc23cfeed6491c090e2bf5d193c6902c687066dffedd0310fa6c4684d",
    "changes": [
      {
        "id": "bodzen2021-t0_5-sucrose-whey",
        "field": "sd",
        "oldFloat": 969999999.9999999,
        "exactSourceInteger": 970000000
      }
    ]
  },
  "displayMetadata": {
    "sourceLabel": "Bodzen 等（2021），Table 1／PDF 第5頁",
    "curriculumSourceId": "lyoprotectant-source-bodzen2021",
    "formulas": [
      {
        "id": "sucrose",
        "label": "蔗糖",
        "fullLabel": "5%蔗糖",
        "compositionZh": "PBS中的5%（m/v）蔗糖。"
      },
      {
        "id": "sucrose-micellar-casein",
        "label": "蔗糖＋膠束酪蛋白",
        "fullLabel": "5%蔗糖＋5%膠束酪蛋白",
        "compositionZh": "PBS中的5%（m/v）蔗糖，另加5%膠束酪蛋白（87B Fluid）。"
      },
      {
        "id": "sucrose-whey",
        "label": "蔗糖＋水解乳清蛋白",
        "fullLabel": "5%蔗糖＋5%乳清蛋白分離物（水解度25%）",
        "compositionZh": "PBS中的5%（m/v）蔗糖，另加5%乳清蛋白分離物，水解度25%。"
      },
      {
        "id": "sucrose-inulin",
        "label": "蔗糖＋菊糖",
        "fullLabel": "5%蔗糖＋5%菊糖DP10",
        "compositionZh": "PBS中的5%（m/v）蔗糖，另加5%菊糖（聚合度DP10）。"
      }
    ],
    "months": [
      {
        "value": 0,
        "label": "0月（凍乾後）",
        "methodLabel": "凍乾後"
      },
      {
        "value": 0.5,
        "label": "0.5月",
        "methodLabel": "方法記為15天"
      },
      {
        "value": 1,
        "label": "1月",
        "methodLabel": "1月"
      },
      {
        "value": 3,
        "label": "3月",
        "methodLabel": "3月"
      },
      {
        "value": 9,
        "label": "9月",
        "methodLabel": "9月"
      }
    ],
    "conditionsZh": [
      {
        "label": "菌株",
        "value": "Lactiplantibacillus plantarum CNCM I-4459"
      },
      {
        "label": "儲藏",
        "value": "25°C、避光；10 Pa真空封瓶，計數前檢查真空。"
      },
      {
        "label": "復水",
        "value": "添加1 mL、37°C的MRS培養液復水；未報實測終體積。"
      },
      {
        "label": "報值",
        "value": "復水樣品CFU/mL，均值±SD；作者報告獨立三重複，n=3。"
      },
      {
        "label": "0月",
        "value": "凍乾後；Table 1沒有乾燥前菌數。"
      }
    ],
    "statisticalMessages": {
      "source-significant": "同時間字母無交集：作者Tukey HSD檢定為p<0.05；此處未重新估計檢定。",
      "source-not-significant": "同時間字母有交集：作者未檢出差異；不等於證明兩配方等效。",
      "not-tested": "僅能描述兩個已測時間的刊載均值；原字母只用於同時間配方比較，未提供這組跨時間檢定。"
    },
    "transferPrompt": "若改成4°C或非真空包裝，本資料還缺哪些對照？",
    "transferReferencePoints": [
      "本表只有25°C、真空封瓶、避光的固定研究條件，未測4°C或非真空包裝。",
      "需要對應溫度或包裝條件的對照，保持菌株、配方、其他製程、採樣時間與計數方法可比。",
      "需報告獨立重複、實際儲藏條件與不確定性；本資料不能給出新條件的菌數或儲藏期限。"
    ]
  },
  "limits": [
    "只呈現兩筆刊載均值；同用CFU/mL對數軸，不連線、不插值、不擬合、不畫誤差棒。",
    "均值±SD、n=3；SD不是信賴區間或觀測範圍。3月乳清與菊糖的SD大於均值，照錄原值。",
    "字母只表示同時間配方比較；有交集是作者未檢出差異，不等於證明等效，也不以SD重疊重新檢定。",
    "跨時間只有刊載均值對照，未提供這組跨時間檢定；3至9月酪蛋白組均值上升不能證明乾粉內細菌增殖。",
    "5%與5%＋5%並非等總固形物對照；PBS與菌體也含固形物。",
    "Table 1缺乾燥前菌數；Fig. 2另用CFU/g分母及平均log ratio，不能由表中均值恢復。",
    "不計算均值比、百分率、log loss、半衰期、CFU/g或每份菌數，不推定儲藏期限、安全或功效門檻。",
    "不預測其他菌株、濃度、溫度、濕度、aw、真空度或未測時間；作者aw機制討論不等於因果模型。",
    "1 mL MRS是復水時的添加體積；未報實測終體積。獨立n=3不代表已知三個具名生產批次。"
  ]
};

/** Compare all own data fields to the reviewed literal before reading caller data.
 * Accessors, inherited data, non-enumerable fields, symbols and array extensions
 * are rejected. Null-prototype records are allowed; custom prototypes are not.
 */
function assertReviewed(value, expected, path = 'lyoprotectant storage dataset') {
  if (expected === null || typeof expected !== 'object') {
    if (typeof value !== typeof expected || !Object.is(value, expected)) {
      throw new TypeError(`Unreviewed value at ${path}`);
    }
    return;
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
      throw new TypeError(`Expected a plain array at ${path}`);
    }
    const length = Object.getOwnPropertyDescriptor(value, 'length');
    if (!length || !Object.hasOwn(length, 'value') || length.value !== expected.length
        || Reflect.ownKeys(value).length !== expected.length + 1) {
      throw new TypeError(`Unreviewed array shape at ${path}`);
    }
    for (let index = 0; index < expected.length; index++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
        throw new TypeError(`Expected an own data field at ${path}[${index}]`);
      }
      assertReviewed(descriptor.value, expected[index], `${path}[${index}]`);
    }
    return;
  }

  if (value === null || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError(`Expected a plain record at ${path}`);
  }
  const expectedKeys = Object.keys(expected);
  const keys = Reflect.ownKeys(value);
  if (keys.length !== expectedKeys.length
      || keys.some(key => typeof key !== 'string' || !Object.hasOwn(expected, key))) {
    throw new TypeError(`Unreviewed fields at ${path}`);
  }
  for (const key of expectedKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError(`Expected an own data field at ${path}.${key}`);
    }
    assertReviewed(descriptor.value, expected[key], `${path}.${key}`);
  }
}

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** Returns a new detached, recursively frozen reviewed dataset, or throws.
 * A change to any value, label, method or locator needs a newly reviewed source.
 * This validates exact content, not merely a schema or a claimed hash field.
 */
export function validateLyoprotectantStorageDataset(value) {
  assertReviewed(value, PINNED);
  return deepFreeze(structuredClone(PINNED));
}
