// Two independent, source-audited finite experiments. No interpolation or process prediction.
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const FREEZE_COLLAPSE_DATA = deepFreeze({
  "schemaVersion": "1.0.0",
  "id": "freeze-drying-collapse",
  "sources": [
    {
      "id": "freeze-collapse-source-kodama-2014",
      "title": "Optimization of Primary Drying Condition for Pharmaceutical Lyophilization Using a Novel Simulation Program with a Predictive Model for Dry Layer Resistance",
      "publisher": "Chemical and Pharmaceutical Bulletin；2014，62(2):153–159",
      "url": "https://www.jstage.jst.go.jp/article/cpb/62/2/62_c13-00674/_html/-char/en",
      "locator": "PDF pp.3–5（印刷 pp.155–157）；方法、Table 2、FDM onset",
      "note": "10% w/v 蔗糖瓶裝實驗；Table 2 的邊瓶最高產品溫度與中央瓶乾燥時間屬不同位置，SD 的 n 未列；不是食品通用排程。",
      "doi": "10.1248/cpb.c13-00674",
      "localPath": "methods/kodama-2014.pdf",
      "sha256": "01d66a614c0d9866fd1748e4ab71e85efe488e640b0c6e6f4571df5e132acf27"
    },
    {
      "id": "freeze-collapse-source-palmkron-2024",
      "title": "The Impact of Annealing Methods on the Encapsulating Structure and Storage-Stability of Freeze-Dried Pellets of Probiotic Bacteria",
      "publisher": "Pharmaceutical Research；2024，Palmkron 等",
      "url": "https://link.springer.com/article/10.1007/s11095-024-03751-w",
      "locator": "PDF pp.2–7、10–11；材料與方法、DSC、Fig.1、Table III、批次差異",
      "note": "三種處理×兩批的離散資料；完整顆粒才進入顯微分析。Tc 未量測，Tg′與示意相圖不能代替 Tc 或實測產品溫度。",
      "doi": "10.1007/s11095-024-03751-w",
      "localPath": "sources/annealing-probiotic-pellets-2024.pdf",
      "sha256": "bdf64699ef4ef7922a9afc628f42759583c87d131b91eda26c5f33ff3c6ea0b9",
      "license": "CC BY 4.0; PDF p11 and publisher rights section"
    },
    {
      "id": "freeze-collapse-source-ntu114-q8",
      "title": "國立臺灣大學 114 學年度碩士班招生考試：食品加工學第 8 題",
      "publisher": "國立臺灣大學圖書館／招生試題",
      "url": "https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-258.pdf",
      "locator": "PDF p.1，第 8 題（10%）",
      "note": "官方試題定位；本課提供有範圍的原因與改善判讀，不是官方答案、整題覆蓋或得分保證。",
      "localPath": "sources/ntu-114-processing.pdf",
      "sha256": "6398a78b996a3bc3026c56a4f1dec981379f080de593dd5f419f8c885afd1b36"
    }
  ],
  "drying": {
    "id": "kodama-2014",
    "label": "壓力與產品溫度",
    "material": "10% w/v 蔗糖水溶液；每瓶 5 mL，20 mL 玻璃瓶",
    "publicationDate": "2014-02-01",
    "tc": {
      "value": -31.5,
      "unit": "°C",
      "text": "Tc = −31.5°C（此配方的 FDM 顯微 onset）",
      "method": "Lyostat 2 FDM；1–2 μL、8 Pa、1°C/min；乾層白點 onset 的台面設定溫度",
      "n": null,
      "sd": null,
      "sourceRefs": [
        {
          "sourceId": "freeze-collapse-source-kodama-2014",
          "locator": "PDF p.3／印刷 p.155：材料與方法"
        },
        {
          "sourceId": "freeze-collapse-source-kodama-2014",
          "locator": "PDF p.5／印刷 p.157：FDM onset 與優化驗證"
        }
      ]
    },
    "tgPrime": {
      "value": null,
      "text": "此文未提供該配方的 Tg′"
    },
    "cases": [
      {
        "id": "k14-tsm20-p5",
        "label": "Ts -20°C · Pc 5 Pa",
        "shelfC": -20,
        "pressurePa": 5,
        "temperature": {
          "mean": -34.1,
          "sd": 0.3,
          "meanText": "-34.1",
          "sdText": "0.3",
          "unit": "°C",
          "label": "邊緣瓶最高產品溫度",
          "n": null,
          "statistic": "原表所報實測值與 SD；溫度是一次乾燥初／中期最高值，不是時間平均溫度。"
        },
        "hours": {
          "mean": 38.5,
          "sd": 0.8,
          "meanText": "38.5",
          "sdText": "0.8",
          "unit": "h",
          "label": "中央瓶一次乾燥時間",
          "n": null,
          "statistic": "原表所報中央瓶一次乾燥時間與 SD；n 未列。"
        },
        "sourceRefs": [
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.3／印刷 p.155：材料與方法"
          },
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.4／印刷 p.156：Table 2"
          },
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.5／印刷 p.157：FDM onset 與優化驗證"
          }
        ],
        "limits": [
          "最高產品溫度來自邊緣瓶；一次乾燥時間來自中央瓶，不能合成同一瓶的時間歷程。",
          "± 是原文 SD，重複 n 未列；320 是裝載瓶數，不能當作 n，也不能用 SD 算安全機率。",
          "Table 2 未逐列報告微觀或巨觀塌陷結果；低於參考 Tc 不能改寫成已證實不塌陷。"
        ],
        "reportedCollapseOutcome": null,
        "provenance": {
          "sourceId": "freeze-collapse-source-kodama-2014",
          "table": "Table 2",
          "temperatureColumn": "Measured (S.D.) / Maximum product temperature of the edge vial",
          "timeColumn": "Measured (S.D.) / Primary drying time of the center vial"
        }
      },
      {
        "id": "k14-tsm20-p10",
        "label": "Ts -20°C · Pc 10 Pa",
        "shelfC": -20,
        "pressurePa": 10,
        "temperature": {
          "mean": -33.3,
          "sd": 0.2,
          "meanText": "-33.3",
          "sdText": "0.2",
          "unit": "°C",
          "label": "邊緣瓶最高產品溫度",
          "n": null,
          "statistic": "原表所報實測值與 SD；溫度是一次乾燥初／中期最高值，不是時間平均溫度。"
        },
        "hours": {
          "mean": 29.9,
          "sd": 1.1,
          "meanText": "29.9",
          "sdText": "1.1",
          "unit": "h",
          "label": "中央瓶一次乾燥時間",
          "n": null,
          "statistic": "原表所報中央瓶一次乾燥時間與 SD；n 未列。"
        },
        "sourceRefs": [
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.3／印刷 p.155：材料與方法"
          },
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.4／印刷 p.156：Table 2"
          },
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.5／印刷 p.157：FDM onset 與優化驗證"
          }
        ],
        "limits": [
          "最高產品溫度來自邊緣瓶；一次乾燥時間來自中央瓶，不能合成同一瓶的時間歷程。",
          "± 是原文 SD，重複 n 未列；320 是裝載瓶數，不能當作 n，也不能用 SD 算安全機率。",
          "Table 2 未逐列報告微觀或巨觀塌陷結果；低於參考 Tc 不能改寫成已證實不塌陷。"
        ],
        "reportedCollapseOutcome": null,
        "provenance": {
          "sourceId": "freeze-collapse-source-kodama-2014",
          "table": "Table 2",
          "temperatureColumn": "Measured (S.D.) / Maximum product temperature of the edge vial",
          "timeColumn": "Measured (S.D.) / Primary drying time of the center vial"
        }
      },
      {
        "id": "k14-tsm20-p15",
        "label": "Ts -20°C · Pc 15 Pa",
        "shelfC": -20,
        "pressurePa": 15,
        "temperature": {
          "mean": -32.5,
          "sd": 0.3,
          "meanText": "-32.5",
          "sdText": "0.3",
          "unit": "°C",
          "label": "邊緣瓶最高產品溫度",
          "n": null,
          "statistic": "原表所報實測值與 SD；溫度是一次乾燥初／中期最高值，不是時間平均溫度。"
        },
        "hours": {
          "mean": 27.3,
          "sd": 2.4,
          "meanText": "27.3",
          "sdText": "2.4",
          "unit": "h",
          "label": "中央瓶一次乾燥時間",
          "n": null,
          "statistic": "原表所報中央瓶一次乾燥時間與 SD；n 未列。"
        },
        "sourceRefs": [
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.3／印刷 p.155：材料與方法"
          },
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.4／印刷 p.156：Table 2"
          },
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.5／印刷 p.157：FDM onset 與優化驗證"
          }
        ],
        "limits": [
          "最高產品溫度來自邊緣瓶；一次乾燥時間來自中央瓶，不能合成同一瓶的時間歷程。",
          "± 是原文 SD，重複 n 未列；320 是裝載瓶數，不能當作 n，也不能用 SD 算安全機率。",
          "Table 2 未逐列報告微觀或巨觀塌陷結果；低於參考 Tc 不能改寫成已證實不塌陷。"
        ],
        "reportedCollapseOutcome": null,
        "provenance": {
          "sourceId": "freeze-collapse-source-kodama-2014",
          "table": "Table 2",
          "temperatureColumn": "Measured (S.D.) / Maximum product temperature of the edge vial",
          "timeColumn": "Measured (S.D.) / Primary drying time of the center vial"
        }
      },
      {
        "id": "k14-tsm10-p5",
        "label": "Ts -10°C · Pc 5 Pa",
        "shelfC": -10,
        "pressurePa": 5,
        "temperature": {
          "mean": -33.4,
          "sd": 0.2,
          "meanText": "-33.4",
          "sdText": "0.2",
          "unit": "°C",
          "label": "邊緣瓶最高產品溫度",
          "n": null,
          "statistic": "原表所報實測值與 SD；溫度是一次乾燥初／中期最高值，不是時間平均溫度。"
        },
        "hours": {
          "mean": 30.6,
          "sd": 0.2,
          "meanText": "30.6",
          "sdText": "0.2",
          "unit": "h",
          "label": "中央瓶一次乾燥時間",
          "n": null,
          "statistic": "原表所報中央瓶一次乾燥時間與 SD；n 未列。"
        },
        "sourceRefs": [
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.3／印刷 p.155：材料與方法"
          },
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.4／印刷 p.156：Table 2"
          },
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.5／印刷 p.157：FDM onset 與優化驗證"
          }
        ],
        "limits": [
          "最高產品溫度來自邊緣瓶；一次乾燥時間來自中央瓶，不能合成同一瓶的時間歷程。",
          "± 是原文 SD，重複 n 未列；320 是裝載瓶數，不能當作 n，也不能用 SD 算安全機率。",
          "Table 2 未逐列報告微觀或巨觀塌陷結果；低於參考 Tc 不能改寫成已證實不塌陷。"
        ],
        "reportedCollapseOutcome": null,
        "provenance": {
          "sourceId": "freeze-collapse-source-kodama-2014",
          "table": "Table 2",
          "temperatureColumn": "Measured (S.D.) / Maximum product temperature of the edge vial",
          "timeColumn": "Measured (S.D.) / Primary drying time of the center vial"
        }
      },
      {
        "id": "k14-ts0-p5",
        "label": "Ts 0°C · Pc 5 Pa",
        "shelfC": 0,
        "pressurePa": 5,
        "temperature": {
          "mean": -32.4,
          "sd": 0.3,
          "meanText": "-32.4",
          "sdText": "0.3",
          "unit": "°C",
          "label": "邊緣瓶最高產品溫度",
          "n": null,
          "statistic": "原表所報實測值與 SD；溫度是一次乾燥初／中期最高值，不是時間平均溫度。"
        },
        "hours": {
          "mean": 26,
          "sd": 0.3,
          "meanText": "26.0",
          "sdText": "0.3",
          "unit": "h",
          "label": "中央瓶一次乾燥時間",
          "n": null,
          "statistic": "原表所報中央瓶一次乾燥時間與 SD；n 未列。"
        },
        "sourceRefs": [
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.3／印刷 p.155：材料與方法"
          },
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.4／印刷 p.156：Table 2"
          },
          {
            "sourceId": "freeze-collapse-source-kodama-2014",
            "locator": "PDF p.5／印刷 p.157：FDM onset 與優化驗證"
          }
        ],
        "limits": [
          "最高產品溫度來自邊緣瓶；一次乾燥時間來自中央瓶，不能合成同一瓶的時間歷程。",
          "± 是原文 SD，重複 n 未列；320 是裝載瓶數，不能當作 n，也不能用 SD 算安全機率。",
          "Table 2 未逐列報告微觀或巨觀塌陷結果；低於參考 Tc 不能改寫成已證實不塌陷。"
        ],
        "reportedCollapseOutcome": null,
        "provenance": {
          "sourceId": "freeze-collapse-source-kodama-2014",
          "table": "Table 2",
          "temperatureColumn": "Measured (S.D.) / Maximum product temperature of the edge vial",
          "timeColumn": "Measured (S.D.) / Primary drying time of the center vial"
        }
      }
    ],
    "series": [
      {
        "id": "pressure",
        "label": "固定擱板，比較壓力",
        "axis": "pressurePa",
        "axisLabel": "腔室壓力 Pc（Pa）",
        "caseIds": [
          "k14-tsm20-p5",
          "k14-tsm20-p10",
          "k14-tsm20-p15"
        ],
        "heldConstant": "擱板 Ts = −20°C",
        "summary": "這三組實測中，5 Pa 的中央瓶乾燥時間比 10、15 Pa 更長；不能把更強真空當成必然更快。"
      },
      {
        "id": "shelf",
        "label": "固定壓力，比較擱板",
        "axis": "shelfC",
        "axisLabel": "擱板溫度 Ts（°C）",
        "caseIds": [
          "k14-tsm20-p5",
          "k14-tsm10-p5",
          "k14-ts0-p5"
        ],
        "heldConstant": "腔室 Pc = 5 Pa",
        "summary": "這三組實測中，提高擱板設定伴隨較高的邊瓶最高產品溫度、較短的中央瓶一次乾燥時間；仍受材料、設備與臨界性質限制。"
      }
    ],
    "limits": [
      "最高產品溫度來自邊緣瓶；一次乾燥時間來自中央瓶，不能合成同一瓶的時間歷程。",
      "± 是原文 SD，重複 n 未列；320 是裝載瓶數，不能當作 n，也不能用 SD 算安全機率。",
      "−31.5°C 只代表這個 10% w/v 蔗糖配方在指定 FDM 方法的顯微 onset，不是通用巨觀塌陷開關。",
      "Table 2 未逐列報告微觀或巨觀塌陷結果；低於參考 Tc 不能改寫成已證實不塌陷。",
      "本研究未提供該配方的 Tg′；不借用其他濃度、配方或研究補值。",
      "Ts 是擱板設定，所報 Tp 是邊緣瓶最高產品溫度；冰界面 Ti 又是不同位置，不能互換。",
      "只比較原表五組條件；不內插、外推或由壓力單獨預測產品溫度與乾燥時間。"
    ],
    "sourceRefs": [
      {
        "sourceId": "freeze-collapse-source-kodama-2014",
        "locator": "PDF p.3／印刷 p.155：材料與方法"
      },
      {
        "sourceId": "freeze-collapse-source-kodama-2014",
        "locator": "PDF p.4／印刷 p.156：Table 2"
      },
      {
        "sourceId": "freeze-collapse-source-kodama-2014",
        "locator": "PDF p.5／印刷 p.157：FDM onset 與優化驗證"
      }
    ],
    "details": {
      "method": "ULVAC DFM-09A-S；−45°C 凍結、−10°C 退火、回到 −45°C。保持時間未列；本課不產生設備排程。",
      "batch": {
        "lyophilizer": "DFM-09A-S, ULVAC",
        "shelfAreaM2": 0.3,
        "fillVolumeMl": 5,
        "vialNominalMl": 20,
        "vial": "Transparent Type 1 glass vial, Japan Glass Industry",
        "loadedVials": 320,
        "stopper": "Two leg 20 mm gray butyl rubber; Daikyo Seiko; partially stoppered",
        "freezingSequenceC": [
          -45,
          -10,
          -45
        ],
        "sequenceMeaning": [
          "freeze",
          "anneal",
          "re-freeze"
        ],
        "freezingAndAnnealingHoldTimes": null,
        "holdTimeStatus": "not reported in this article",
        "reportedExperimentalScope": "six experiments; Ts -20 to 0°C and Pc 5 to 15Pa; Table2 itself has five conditions",
        "tcSensor": "thermocouples at edge and center vials",
        "temperatureLocation": "model predicts bottom-center of glass vial; abstracted measured edge-vial thermocouple position is stated by vial location; exact per-sensor placement detail not independently specified in measurement paragraph",
        "temperatureMetric": "edge vial maximum during early/middle primary drying",
        "timeMetric": "center vial primary drying endpoint",
        "endpointCriteria": "same criterion as section2.1; center-vial product temperature unchanged within0.5°C at late primary drying; this is source-defined, not a universal dryness criterion",
        "replicateN": null,
        "nStatus": "not stated for Table1/2 SD; 320 loaded vials must not be substituted for n",
        "sourceLocator": "PDF pp.2–3 / printed pp.154–155, Materials and Methods"
      },
      "table1": {
        "title": "Dry Layer Resistance of Each Edge and Center Vial with Dry Layer Thickness",
        "locator": "PDF p.4 / printed p.156, Table1 and footnote",
        "referenceShelfC": -20,
        "referenceChamberPa": 10,
        "thicknessUnit": "mm (converted exactly from ×10^-3 m)",
        "resistanceUnit": "kPa·m²·s/kg",
        "measurementStatus": "mathematically converted from measured product-temperature profiles; not independently directly measured Rp",
        "replicateN": null,
        "rows": [
          {
            "thicknessMm": 0.5,
            "edgeRp": 76,
            "edgeSd": 13,
            "centerRp": 46,
            "centerSd": 4
          },
          {
            "thicknessMm": 1,
            "edgeRp": 107,
            "edgeSd": 7,
            "centerRp": 68,
            "centerSd": 8
          },
          {
            "thicknessMm": 2,
            "edgeRp": 121,
            "edgeSd": 5,
            "centerRp": 100,
            "centerSd": 10
          },
          {
            "thicknessMm": 3,
            "edgeRp": 117,
            "edgeSd": 7,
            "centerRp": 125,
            "centerSd": 11
          },
          {
            "thicknessMm": 4,
            "edgeRp": 105,
            "edgeSd": 6,
            "centerRp": 136,
            "centerSd": 10
          },
          {
            "thicknessMm": 5,
            "edgeRp": 98,
            "edgeSd": 4,
            "centerRp": 144,
            "centerSd": 12
          }
        ],
        "boundary": "center rises with thickness; edge peaks around2mm, then lower/roughly level. Do not generalize all Rp to linear monotonic thickness."
      },
      "modelComparison": {
        "title": "Comparison of Predicted and Measured Maximum Product Temperature and Primary Drying Time",
        "locator": "PDF p.4 / printed p.156, Table2",
        "temperatureMetric": "maximum product temperature of edge vial",
        "timeMetric": "primary drying time of center vial",
        "uncertaintyLabel": "S.D. (standard deviation); n not given",
        "rows": [
          {
            "id": "k14-tsm20-p5",
            "shelfC": -20,
            "chamberPa": 5,
            "tMaxPredictedWithoutRpC": -36.8,
            "tMaxPredictedWithRpC": -34.2,
            "tMaxMeasuredC": -34.1,
            "tMaxMeasuredSdC": 0.3,
            "timePredictedWithoutRpH": 40,
            "timePredictedWithRpH": 39.4,
            "timeMeasuredH": 38.5,
            "timeMeasuredSdH": 0.8,
            "replicateN": null,
            "collapseOutcome": null,
            "collapseOutcomeStatus": "Table2 reports temperature/time/model comparisons; not a per-row macro/microcollapse endpoint"
          },
          {
            "id": "k14-tsm20-p10",
            "shelfC": -20,
            "chamberPa": 10,
            "tMaxPredictedWithoutRpC": -33,
            "tMaxPredictedWithRpC": -33.4,
            "tMaxMeasuredC": -33.3,
            "tMaxMeasuredSdC": 0.2,
            "timePredictedWithoutRpH": 31.5,
            "timePredictedWithRpH": 30.6,
            "timeMeasuredH": 29.9,
            "timeMeasuredSdH": 1.1,
            "replicateN": null,
            "collapseOutcome": null,
            "collapseOutcomeStatus": "Table2 reports temperature/time/model comparisons; not a per-row macro/microcollapse endpoint"
          },
          {
            "id": "k14-tsm20-p15",
            "shelfC": -20,
            "chamberPa": 15,
            "tMaxPredictedWithoutRpC": -31,
            "tMaxPredictedWithRpC": -32.9,
            "tMaxMeasuredC": -32.5,
            "tMaxMeasuredSdC": 0.3,
            "timePredictedWithoutRpH": 30.4,
            "timePredictedWithRpH": 26.4,
            "timeMeasuredH": 27.3,
            "timeMeasuredSdH": 2.4,
            "replicateN": null,
            "collapseOutcome": null,
            "collapseOutcomeStatus": "Table2 reports temperature/time/model comparisons; not a per-row macro/microcollapse endpoint"
          },
          {
            "id": "k14-tsm10-p5",
            "shelfC": -10,
            "chamberPa": 5,
            "tMaxPredictedWithoutRpC": -34.6,
            "tMaxPredictedWithRpC": -33.1,
            "tMaxMeasuredC": -33.4,
            "tMaxMeasuredSdC": 0.2,
            "timePredictedWithoutRpH": 30.4,
            "timePredictedWithRpH": 31.4,
            "timeMeasuredH": 30.6,
            "timeMeasuredSdH": 0.2,
            "replicateN": null,
            "collapseOutcome": null,
            "collapseOutcomeStatus": "Table2 reports temperature/time/model comparisons; not a per-row macro/microcollapse endpoint"
          },
          {
            "id": "k14-ts0-p5",
            "shelfC": 0,
            "chamberPa": 5,
            "tMaxPredictedWithoutRpC": -32.6,
            "tMaxPredictedWithRpC": -32.3,
            "tMaxMeasuredC": -32.4,
            "tMaxMeasuredSdC": 0.3,
            "timePredictedWithoutRpH": 26.9,
            "timePredictedWithRpH": 26.2,
            "timeMeasuredH": 26,
            "timeMeasuredSdH": 0.3,
            "replicateN": null,
            "collapseOutcome": null,
            "collapseOutcomeStatus": "Table2 reports temperature/time/model comparisons; not a per-row macro/microcollapse endpoint"
          }
        ]
      },
      "optimizedValidation": {
        "id": "k14-validation-tsm8-p10",
        "separateFromTable2": true,
        "shelfC": -8,
        "shelfStatus": "approximately -8°C predicted optimized shelf; experimental comparison at same condition",
        "chamberPa": 10,
        "tMaxPredictedWithRpC": -31.6,
        "tMaxMeasuredC": -31.5,
        "tMaxMeasuredSdC": 0.4,
        "timePredictedWithRpH": 20.3,
        "timeMeasuredH": 19.3,
        "timeMeasuredSdH": 0.3,
        "replicateN": null,
        "locator": "PDF p.5 / printed p.157, final paragraph",
        "interpretation": "reported point value equals FDM onset; SD overlaps onset. Does not establish a universal safe margin or exact collapse probability."
      }
    },
    "interpretation": "供熱與水蒸氣通過乾層的阻力共同作用；腔室壓力不能單獨決定產品溫度或乾燥速率。"
  },
  "structure": {
    "id": "palmkron-2024",
    "label": "退火與結構",
    "material": "20% w/w 糖／麥芽糊精基礎配方（乾物蔗糖:麥芽糊精 = 2:1），含 L. reuteri DSM 17938 的 4–5 mm 顆粒",
    "publicationDate": "2024-07-29",
    "annealing": [
      {
        "id": "non",
        "label": "未退火",
        "summary": "急凍後留在 -80°C，未施加指定退火；凍乾前仍經裝料與預冷機停留。",
        "temperatureC": null,
        "durationHours": null,
        "durationWeeks": null,
        "temperatureToleranceC": null,
        "limits": [
          "未指定退火不代表從未發生鬆弛。"
        ]
      },
      {
        "id": "short",
        "label": "−9°C，2 小時",
        "summary": "快速退火後回存 -80°C，等待凍乾。",
        "temperatureC": -9,
        "durationHours": 2,
        "durationWeeks": null,
        "temperatureToleranceC": null,
        "limits": [
          "時間與溫度同時改變，不能分離各自的因果效果。"
        ]
      },
      {
        "id": "long",
        "label": "−20±0.5°C，1 週",
        "summary": "冷凍櫃退火一週後回存 -80°C，等待凍乾。",
        "temperatureC": -20,
        "durationHours": null,
        "durationWeeks": 1,
        "temperatureToleranceC": 0.5,
        "limits": [
          "只代表本配方、顆粒與裝置條件；不是所有食品的最佳條件。"
        ]
      }
    ],
    "cases": [
      {
        "id": "p24-non-b1",
        "annealingId": "non",
        "batch": "Batch 1",
        "batchId": "batch-1",
        "label": "未退火 · Batch 1",
        "macro": {
          "status": "not-observed",
          "text": "作者在這組未報告可見的巨觀塌陷。",
          "exactFraction": null,
          "pelletCount": null,
          "scope": "原文巨觀外觀報告"
        },
        "micro": {
          "text": "未退火組結構細密，作者描述隨機分散的微塌陷區；不是逐批微塌陷發生率。",
          "scope": "protocol-level narrative; no per-batch prevalence or quantified micro-collapse fraction",
          "sampling": "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。",
          "rate": null
        },
        "thickness": {
          "value": 0.5,
          "sd": null,
          "text": "約 0.5（SEM 估計） μm",
          "method": "SEM 估計",
          "methodId": "SEM-estimate",
          "statistic": "表 III 厚度欄報值；表題 average／欄名 mode 未統一",
          "unit": "μm",
          "sampleScope": "所選顆粒的影像材料；不是每組全部顆粒的平均。",
          "n": null
        },
        "sourceRefs": [
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.4／印刷 p.1674：Results: Appearance after Freeze-Drying"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.5／印刷 p.1675：Fig. 1"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.6／印刷 p.1676：Table III；thickness column; footnote a=SEM estimate, b=heterogeneous"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.7／印刷 p.1677：SEM and X-ray Microtomography"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.10／印刷 p.1680：Fig. 7 caption"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.3／印刷 p.1673：Scanning Electron Microscopy"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.7／印刷 p.1677：Structure: SEM"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.8／印刷 p.1678：Fig. 3"
          }
        ],
        "limits": [
          "沒有巨觀塌陷不代表沒有微塌陷。",
          "不能由這一格推算產品溫度歷程、Tc 或最大安全升溫。",
          "不能把六格當成已清楚定義的獨立生物重複，或計算普遍成功率。",
          "表 III 標題稱 average、欄頭稱 mode；不自動統一成平均值。",
          "SEM 估計與 μCT 數值不完全可比；N/A 不是 0。",
          "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。"
        ],
        "provenance": {
          "sourceId": "freeze-collapse-source-palmkron-2024",
          "sourceCaseId": "p24-non-b1",
          "macro": {
            "status": "no-visible-macroscopic-collapse-reported",
            "claimType": "reported-observation",
            "description": "作者在這組未報告可見的巨觀塌陷。",
            "approximateFractionText": null,
            "exactFraction": null,
            "pelletCount": null,
            "locators": [
              {
                "pdfPage": 4,
                "printedPage": 1674,
                "section": "Results: Appearance after Freeze-Drying",
                "detail": ""
              },
              {
                "pdfPage": 5,
                "printedPage": 1675,
                "section": "Fig. 1",
                "detail": ""
              }
            ]
          },
          "thickness": {
            "value": 0.5,
            "unit": "μm",
            "display": "約 0.5（SEM 估計）",
            "claimType": "author-SEM-estimate",
            "method": "SEM-estimate",
            "reportedColumn": "Material thickness, Mode value (Fig. 5) [μm]",
            "safeLabel": "表 III 厚度欄報值",
            "denominator": "所選顆粒的影像材料；不是每組全部顆粒的平均。",
            "locators": [
              {
                "pdfPage": 6,
                "printedPage": 1676,
                "section": "Table III",
                "detail": "thickness column; footnote a=SEM estimate, b=heterogeneous"
              },
              {
                "pdfPage": 7,
                "printedPage": 1677,
                "section": "SEM and X-ray Microtomography",
                "detail": ""
              },
              {
                "pdfPage": 10,
                "printedPage": 1680,
                "section": "Fig. 7 caption",
                "detail": ""
              }
            ],
            "limits": [
              "表 III 標題稱 average、欄頭稱 mode；不自動統一成平均值。",
              "SEM 估計與 μCT 數值不完全可比；N/A 不是 0。"
            ]
          },
          "micro": {
            "status": "localized-microscopic-collapse-reported-at-protocol-level",
            "claimType": "reported-qualitative-SEM-observation",
            "reportScope": "protocol-level narrative; no per-batch prevalence or quantified micro-collapse fraction",
            "description": "未退火組結構細密，作者描述隨機分散的微塌陷區；不是逐批微塌陷發生率。",
            "sampleSelection": "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。",
            "locators": [
              {
                "pdfPage": 3,
                "printedPage": 1673,
                "section": "Scanning Electron Microscopy",
                "detail": ""
              },
              {
                "pdfPage": 7,
                "printedPage": 1677,
                "section": "Structure: SEM",
                "detail": ""
              },
              {
                "pdfPage": 8,
                "printedPage": 1678,
                "section": "Fig. 3",
                "detail": ""
              }
            ]
          }
        }
      },
      {
        "id": "p24-non-b2",
        "annealingId": "non",
        "batch": "Batch 2",
        "batchId": "batch-2",
        "label": "未退火 · Batch 2",
        "macro": {
          "status": "partial-observed",
          "text": "約三分之一顆粒出現肉眼塌陷；可見氣泡、空洞及較不平整、光亮表面。",
          "exactFraction": null,
          "pelletCount": null,
          "scope": "原文巨觀外觀報告"
        },
        "micro": {
          "text": "未退火組結構細密，作者描述隨機分散的微塌陷區；不是逐批微塌陷發生率。",
          "scope": "protocol-level narrative; no per-batch prevalence or quantified micro-collapse fraction",
          "sampling": "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。",
          "rate": null
        },
        "thickness": {
          "value": null,
          "sd": null,
          "text": "N/A（異質，無有意義量化）",
          "method": "異質，無有意義量化",
          "methodId": "not-quantifiable",
          "statistic": "表 III 厚度欄報值；表題 average／欄名 mode 未統一",
          "unit": "μm",
          "sampleScope": "所選顆粒的影像材料；不是每組全部顆粒的平均。",
          "n": null
        },
        "sourceRefs": [
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.4／印刷 p.1674：Results: Appearance after Freeze-Drying"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.5／印刷 p.1675：Fig. 1"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.6／印刷 p.1676：Table III；thickness column; footnote a=SEM estimate, b=heterogeneous"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.7／印刷 p.1677：SEM and X-ray Microtomography"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.10／印刷 p.1680：Fig. 7 caption"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.3／印刷 p.1673：Scanning Electron Microscopy"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.7／印刷 p.1677：Structure: SEM"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.8／印刷 p.1678：Fig. 3"
          }
        ],
        "limits": [
          "沒有巨觀塌陷不代表沒有微塌陷。",
          "不能由這一格推算產品溫度歷程、Tc 或最大安全升溫。",
          "不能把六格當成已清楚定義的獨立生物重複，或計算普遍成功率。",
          "表 III 標題稱 average、欄頭稱 mode；不自動統一成平均值。",
          "SEM 估計與 μCT 數值不完全可比；N/A 不是 0。",
          "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。"
        ],
        "provenance": {
          "sourceId": "freeze-collapse-source-palmkron-2024",
          "sourceCaseId": "p24-non-b2",
          "macro": {
            "status": "some-visible-collapse-reported",
            "claimType": "reported-observation",
            "description": "約三分之一顆粒出現肉眼塌陷；可見氣泡、空洞及較不平整、光亮表面。",
            "approximateFractionText": "around 1/3",
            "exactFraction": null,
            "pelletCount": null,
            "locators": [
              {
                "pdfPage": 4,
                "printedPage": 1674,
                "section": "Results: Appearance after Freeze-Drying",
                "detail": ""
              },
              {
                "pdfPage": 5,
                "printedPage": 1675,
                "section": "Fig. 1",
                "detail": ""
              }
            ]
          },
          "thickness": {
            "value": null,
            "unit": "μm",
            "display": "N/A（異質，無有意義量化）",
            "claimType": "reported-unavailable",
            "method": "not-quantifiable",
            "reportedColumn": "Material thickness, Mode value (Fig. 5) [μm]",
            "safeLabel": "表 III 厚度欄報值",
            "denominator": "所選顆粒的影像材料；不是每組全部顆粒的平均。",
            "locators": [
              {
                "pdfPage": 6,
                "printedPage": 1676,
                "section": "Table III",
                "detail": "thickness column; footnote a=SEM estimate, b=heterogeneous"
              },
              {
                "pdfPage": 7,
                "printedPage": 1677,
                "section": "SEM and X-ray Microtomography",
                "detail": ""
              },
              {
                "pdfPage": 10,
                "printedPage": 1680,
                "section": "Fig. 7 caption",
                "detail": ""
              }
            ],
            "limits": [
              "表 III 標題稱 average、欄頭稱 mode；不自動統一成平均值。",
              "SEM 估計與 μCT 數值不完全可比；N/A 不是 0。"
            ]
          },
          "micro": {
            "status": "localized-microscopic-collapse-reported-at-protocol-level",
            "claimType": "reported-qualitative-SEM-observation",
            "reportScope": "protocol-level narrative; no per-batch prevalence or quantified micro-collapse fraction",
            "description": "未退火組結構細密，作者描述隨機分散的微塌陷區；不是逐批微塌陷發生率。",
            "sampleSelection": "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。",
            "locators": [
              {
                "pdfPage": 3,
                "printedPage": 1673,
                "section": "Scanning Electron Microscopy",
                "detail": ""
              },
              {
                "pdfPage": 7,
                "printedPage": 1677,
                "section": "Structure: SEM",
                "detail": ""
              },
              {
                "pdfPage": 8,
                "printedPage": 1678,
                "section": "Fig. 3",
                "detail": ""
              }
            ]
          }
        }
      },
      {
        "id": "p24-short-b1",
        "annealingId": "short",
        "batch": "Batch 1",
        "batchId": "batch-1",
        "label": "-9°C，2 小時 · Batch 1",
        "macro": {
          "status": "not-observed",
          "text": "作者在這組未報告可見的巨觀塌陷。",
          "exactFraction": null,
          "pelletCount": null,
          "scope": "原文巨觀外觀報告"
        },
        "micro": {
          "text": "退火組整體較粗、呈片狀；作者仍描述小區域微塌陷，不能填成零微塌陷。",
          "scope": "protocol-level narrative; no per-batch prevalence or quantified micro-collapse fraction",
          "sampling": "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。",
          "rate": null
        },
        "thickness": {
          "value": 2.3,
          "sd": null,
          "text": "2.3 μm",
          "method": "μCT 表值",
          "methodId": "microCT-table-value",
          "statistic": "表 III 厚度欄報值；表題 average／欄名 mode 未統一",
          "unit": "μm",
          "sampleScope": "所選顆粒的影像材料；不是每組全部顆粒的平均。",
          "n": null
        },
        "sourceRefs": [
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.4／印刷 p.1674：Results: Appearance after Freeze-Drying"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.5／印刷 p.1675：Fig. 1"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.6／印刷 p.1676：Table III；thickness column; footnote a=SEM estimate, b=heterogeneous"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.7／印刷 p.1677：SEM and X-ray Microtomography"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.10／印刷 p.1680：Fig. 7 caption"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.3／印刷 p.1673：Scanning Electron Microscopy"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.7／印刷 p.1677：Structure: SEM"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.8／印刷 p.1678：Fig. 3"
          }
        ],
        "limits": [
          "沒有巨觀塌陷不代表沒有微塌陷。",
          "不能由這一格推算產品溫度歷程、Tc 或最大安全升溫。",
          "不能把六格當成已清楚定義的獨立生物重複，或計算普遍成功率。",
          "表 III 標題稱 average、欄頭稱 mode；不自動統一成平均值。",
          "SEM 估計與 μCT 數值不完全可比；N/A 不是 0。",
          "正文概述短退火 mode 為 1.5–2 μm，而表 III Batch 1 列 2.3 μm；保留差異，不從圖像修正。",
          "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。"
        ],
        "provenance": {
          "sourceId": "freeze-collapse-source-palmkron-2024",
          "sourceCaseId": "p24-short-b1",
          "macro": {
            "status": "no-visible-macroscopic-collapse-reported",
            "claimType": "reported-observation",
            "description": "作者在這組未報告可見的巨觀塌陷。",
            "approximateFractionText": null,
            "exactFraction": null,
            "pelletCount": null,
            "locators": [
              {
                "pdfPage": 4,
                "printedPage": 1674,
                "section": "Results: Appearance after Freeze-Drying",
                "detail": ""
              },
              {
                "pdfPage": 5,
                "printedPage": 1675,
                "section": "Fig. 1",
                "detail": ""
              }
            ]
          },
          "thickness": {
            "value": 2.3,
            "unit": "μm",
            "display": "2.3",
            "claimType": "reported-table-value-from-microCT",
            "method": "microCT-table-value",
            "reportedColumn": "Material thickness, Mode value (Fig. 5) [μm]",
            "safeLabel": "表 III 厚度欄報值",
            "denominator": "所選顆粒的影像材料；不是每組全部顆粒的平均。",
            "locators": [
              {
                "pdfPage": 6,
                "printedPage": 1676,
                "section": "Table III",
                "detail": "thickness column; footnote a=SEM estimate, b=heterogeneous"
              },
              {
                "pdfPage": 7,
                "printedPage": 1677,
                "section": "SEM and X-ray Microtomography",
                "detail": ""
              },
              {
                "pdfPage": 10,
                "printedPage": 1680,
                "section": "Fig. 7 caption",
                "detail": ""
              }
            ],
            "limits": [
              "表 III 標題稱 average、欄頭稱 mode；不自動統一成平均值。",
              "SEM 估計與 μCT 數值不完全可比；N/A 不是 0。",
              "正文概述短退火 mode 為 1.5–2 μm，而表 III Batch 1 列 2.3 μm；保留差異，不從圖像修正。"
            ]
          },
          "micro": {
            "status": "localized-microscopic-collapse-reported-at-protocol-level",
            "claimType": "reported-qualitative-SEM-observation",
            "reportScope": "protocol-level narrative; no per-batch prevalence or quantified micro-collapse fraction",
            "description": "退火組整體較粗、呈片狀；作者仍描述小區域微塌陷，不能填成零微塌陷。",
            "sampleSelection": "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。",
            "locators": [
              {
                "pdfPage": 3,
                "printedPage": 1673,
                "section": "Scanning Electron Microscopy",
                "detail": ""
              },
              {
                "pdfPage": 7,
                "printedPage": 1677,
                "section": "Structure: SEM",
                "detail": ""
              },
              {
                "pdfPage": 8,
                "printedPage": 1678,
                "section": "Fig. 3",
                "detail": ""
              }
            ]
          }
        }
      },
      {
        "id": "p24-short-b2",
        "annealingId": "short",
        "batch": "Batch 2",
        "batchId": "batch-2",
        "label": "-9°C，2 小時 · Batch 2",
        "macro": {
          "status": "not-observed",
          "text": "作者在這組未報告可見的巨觀塌陷。",
          "exactFraction": null,
          "pelletCount": null,
          "scope": "原文巨觀外觀報告"
        },
        "micro": {
          "text": "退火組整體較粗、呈片狀；作者仍描述小區域微塌陷，不能填成零微塌陷。",
          "scope": "protocol-level narrative; no per-batch prevalence or quantified micro-collapse fraction",
          "sampling": "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。",
          "rate": null
        },
        "thickness": {
          "value": 2,
          "sd": null,
          "text": "2.0 μm",
          "method": "μCT 表值",
          "methodId": "microCT-table-value",
          "statistic": "表 III 厚度欄報值；表題 average／欄名 mode 未統一",
          "unit": "μm",
          "sampleScope": "所選顆粒的影像材料；不是每組全部顆粒的平均。",
          "n": null
        },
        "sourceRefs": [
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.4／印刷 p.1674：Results: Appearance after Freeze-Drying"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.5／印刷 p.1675：Fig. 1"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.6／印刷 p.1676：Table III；thickness column; footnote a=SEM estimate, b=heterogeneous"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.7／印刷 p.1677：SEM and X-ray Microtomography"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.10／印刷 p.1680：Fig. 7 caption"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.3／印刷 p.1673：Scanning Electron Microscopy"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.7／印刷 p.1677：Structure: SEM"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.8／印刷 p.1678：Fig. 3"
          }
        ],
        "limits": [
          "沒有巨觀塌陷不代表沒有微塌陷。",
          "不能由這一格推算產品溫度歷程、Tc 或最大安全升溫。",
          "不能把六格當成已清楚定義的獨立生物重複，或計算普遍成功率。",
          "表 III 標題稱 average、欄頭稱 mode；不自動統一成平均值。",
          "SEM 估計與 μCT 數值不完全可比；N/A 不是 0。",
          "正文概述短退火 mode 為 1.5–2 μm，而表 III Batch 1 列 2.3 μm；保留差異，不從圖像修正。",
          "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。"
        ],
        "provenance": {
          "sourceId": "freeze-collapse-source-palmkron-2024",
          "sourceCaseId": "p24-short-b2",
          "macro": {
            "status": "no-visible-macroscopic-collapse-reported",
            "claimType": "reported-observation",
            "description": "作者在這組未報告可見的巨觀塌陷。",
            "approximateFractionText": null,
            "exactFraction": null,
            "pelletCount": null,
            "locators": [
              {
                "pdfPage": 4,
                "printedPage": 1674,
                "section": "Results: Appearance after Freeze-Drying",
                "detail": ""
              },
              {
                "pdfPage": 5,
                "printedPage": 1675,
                "section": "Fig. 1",
                "detail": ""
              }
            ]
          },
          "thickness": {
            "value": 2,
            "unit": "μm",
            "display": "2.0",
            "claimType": "reported-table-value-from-microCT",
            "method": "microCT-table-value",
            "reportedColumn": "Material thickness, Mode value (Fig. 5) [μm]",
            "safeLabel": "表 III 厚度欄報值",
            "denominator": "所選顆粒的影像材料；不是每組全部顆粒的平均。",
            "locators": [
              {
                "pdfPage": 6,
                "printedPage": 1676,
                "section": "Table III",
                "detail": "thickness column; footnote a=SEM estimate, b=heterogeneous"
              },
              {
                "pdfPage": 7,
                "printedPage": 1677,
                "section": "SEM and X-ray Microtomography",
                "detail": ""
              },
              {
                "pdfPage": 10,
                "printedPage": 1680,
                "section": "Fig. 7 caption",
                "detail": ""
              }
            ],
            "limits": [
              "表 III 標題稱 average、欄頭稱 mode；不自動統一成平均值。",
              "SEM 估計與 μCT 數值不完全可比；N/A 不是 0。",
              "正文概述短退火 mode 為 1.5–2 μm，而表 III Batch 1 列 2.3 μm；保留差異，不從圖像修正。"
            ]
          },
          "micro": {
            "status": "localized-microscopic-collapse-reported-at-protocol-level",
            "claimType": "reported-qualitative-SEM-observation",
            "reportScope": "protocol-level narrative; no per-batch prevalence or quantified micro-collapse fraction",
            "description": "退火組整體較粗、呈片狀；作者仍描述小區域微塌陷，不能填成零微塌陷。",
            "sampleSelection": "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。",
            "locators": [
              {
                "pdfPage": 3,
                "printedPage": 1673,
                "section": "Scanning Electron Microscopy",
                "detail": ""
              },
              {
                "pdfPage": 7,
                "printedPage": 1677,
                "section": "Structure: SEM",
                "detail": ""
              },
              {
                "pdfPage": 8,
                "printedPage": 1678,
                "section": "Fig. 3",
                "detail": ""
              }
            ]
          }
        }
      },
      {
        "id": "p24-long-b1",
        "annealingId": "long",
        "batch": "Batch 1",
        "batchId": "batch-1",
        "label": "-20±0.5°C，1 週 · Batch 1",
        "macro": {
          "status": "not-observed",
          "text": "作者在這組未報告可見的巨觀塌陷。",
          "exactFraction": null,
          "pelletCount": null,
          "scope": "原文巨觀外觀報告"
        },
        "micro": {
          "text": "退火組整體較粗、呈片狀；作者仍描述小區域微塌陷，不能填成零微塌陷。",
          "scope": "protocol-level narrative; no per-batch prevalence or quantified micro-collapse fraction",
          "sampling": "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。",
          "rate": null
        },
        "thickness": {
          "value": 3,
          "sd": null,
          "text": "3.0 μm",
          "method": "μCT 表值",
          "methodId": "microCT-table-value",
          "statistic": "表 III 厚度欄報值；表題 average／欄名 mode 未統一",
          "unit": "μm",
          "sampleScope": "所選顆粒的影像材料；不是每組全部顆粒的平均。",
          "n": null
        },
        "sourceRefs": [
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.4／印刷 p.1674：Results: Appearance after Freeze-Drying"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.5／印刷 p.1675：Fig. 1"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.6／印刷 p.1676：Table III；thickness column; footnote a=SEM estimate, b=heterogeneous"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.7／印刷 p.1677：SEM and X-ray Microtomography"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.10／印刷 p.1680：Fig. 7 caption"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.3／印刷 p.1673：Scanning Electron Microscopy"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.7／印刷 p.1677：Structure: SEM"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.8／印刷 p.1678：Fig. 3"
          }
        ],
        "limits": [
          "沒有巨觀塌陷不代表沒有微塌陷。",
          "不能由這一格推算產品溫度歷程、Tc 或最大安全升溫。",
          "不能把六格當成已清楚定義的獨立生物重複，或計算普遍成功率。",
          "表 III 標題稱 average、欄頭稱 mode；不自動統一成平均值。",
          "SEM 估計與 μCT 數值不完全可比；N/A 不是 0。",
          "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。"
        ],
        "provenance": {
          "sourceId": "freeze-collapse-source-palmkron-2024",
          "sourceCaseId": "p24-long-b1",
          "macro": {
            "status": "no-visible-macroscopic-collapse-reported",
            "claimType": "reported-observation",
            "description": "作者在這組未報告可見的巨觀塌陷。",
            "approximateFractionText": null,
            "exactFraction": null,
            "pelletCount": null,
            "locators": [
              {
                "pdfPage": 4,
                "printedPage": 1674,
                "section": "Results: Appearance after Freeze-Drying",
                "detail": ""
              },
              {
                "pdfPage": 5,
                "printedPage": 1675,
                "section": "Fig. 1",
                "detail": ""
              }
            ]
          },
          "thickness": {
            "value": 3,
            "unit": "μm",
            "display": "3.0",
            "claimType": "reported-table-value-from-microCT",
            "method": "microCT-table-value",
            "reportedColumn": "Material thickness, Mode value (Fig. 5) [μm]",
            "safeLabel": "表 III 厚度欄報值",
            "denominator": "所選顆粒的影像材料；不是每組全部顆粒的平均。",
            "locators": [
              {
                "pdfPage": 6,
                "printedPage": 1676,
                "section": "Table III",
                "detail": "thickness column; footnote a=SEM estimate, b=heterogeneous"
              },
              {
                "pdfPage": 7,
                "printedPage": 1677,
                "section": "SEM and X-ray Microtomography",
                "detail": ""
              },
              {
                "pdfPage": 10,
                "printedPage": 1680,
                "section": "Fig. 7 caption",
                "detail": ""
              }
            ],
            "limits": [
              "表 III 標題稱 average、欄頭稱 mode；不自動統一成平均值。",
              "SEM 估計與 μCT 數值不完全可比；N/A 不是 0。"
            ]
          },
          "micro": {
            "status": "localized-microscopic-collapse-reported-at-protocol-level",
            "claimType": "reported-qualitative-SEM-observation",
            "reportScope": "protocol-level narrative; no per-batch prevalence or quantified micro-collapse fraction",
            "description": "退火組整體較粗、呈片狀；作者仍描述小區域微塌陷，不能填成零微塌陷。",
            "sampleSelection": "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。",
            "locators": [
              {
                "pdfPage": 3,
                "printedPage": 1673,
                "section": "Scanning Electron Microscopy",
                "detail": ""
              },
              {
                "pdfPage": 7,
                "printedPage": 1677,
                "section": "Structure: SEM",
                "detail": ""
              },
              {
                "pdfPage": 8,
                "printedPage": 1678,
                "section": "Fig. 3",
                "detail": ""
              }
            ]
          }
        }
      },
      {
        "id": "p24-long-b2",
        "annealingId": "long",
        "batch": "Batch 2",
        "batchId": "batch-2",
        "label": "-20±0.5°C，1 週 · Batch 2",
        "macro": {
          "status": "not-observed",
          "text": "作者在這組未報告可見的巨觀塌陷。",
          "exactFraction": null,
          "pelletCount": null,
          "scope": "原文巨觀外觀報告"
        },
        "micro": {
          "text": "退火組整體較粗、呈片狀；作者仍描述小區域微塌陷，不能填成零微塌陷。",
          "scope": "protocol-level narrative; no per-batch prevalence or quantified micro-collapse fraction",
          "sampling": "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。",
          "rate": null
        },
        "thickness": {
          "value": 3,
          "sd": null,
          "text": "3.0 μm",
          "method": "μCT 表值",
          "methodId": "microCT-table-value",
          "statistic": "表 III 厚度欄報值；表題 average／欄名 mode 未統一",
          "unit": "μm",
          "sampleScope": "所選顆粒的影像材料；不是每組全部顆粒的平均。",
          "n": null
        },
        "sourceRefs": [
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.4／印刷 p.1674：Results: Appearance after Freeze-Drying"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.5／印刷 p.1675：Fig. 1"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.6／印刷 p.1676：Table III；thickness column; footnote a=SEM estimate, b=heterogeneous"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.7／印刷 p.1677：SEM and X-ray Microtomography"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.10／印刷 p.1680：Fig. 7 caption"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.3／印刷 p.1673：Scanning Electron Microscopy"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.7／印刷 p.1677：Structure: SEM"
          },
          {
            "sourceId": "freeze-collapse-source-palmkron-2024",
            "locator": "PDF p.8／印刷 p.1678：Fig. 3"
          }
        ],
        "limits": [
          "沒有巨觀塌陷不代表沒有微塌陷。",
          "不能由這一格推算產品溫度歷程、Tc 或最大安全升溫。",
          "不能把六格當成已清楚定義的獨立生物重複，或計算普遍成功率。",
          "表 III 標題稱 average、欄頭稱 mode；不自動統一成平均值。",
          "SEM 估計與 μCT 數值不完全可比；N/A 不是 0。",
          "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。"
        ],
        "provenance": {
          "sourceId": "freeze-collapse-source-palmkron-2024",
          "sourceCaseId": "p24-long-b2",
          "macro": {
            "status": "no-visible-macroscopic-collapse-reported",
            "claimType": "reported-observation",
            "description": "作者在這組未報告可見的巨觀塌陷。",
            "approximateFractionText": null,
            "exactFraction": null,
            "pelletCount": null,
            "locators": [
              {
                "pdfPage": 4,
                "printedPage": 1674,
                "section": "Results: Appearance after Freeze-Drying",
                "detail": ""
              },
              {
                "pdfPage": 5,
                "printedPage": 1675,
                "section": "Fig. 1",
                "detail": ""
              }
            ]
          },
          "thickness": {
            "value": 3,
            "unit": "μm",
            "display": "3.0",
            "claimType": "reported-table-value-from-microCT",
            "method": "microCT-table-value",
            "reportedColumn": "Material thickness, Mode value (Fig. 5) [μm]",
            "safeLabel": "表 III 厚度欄報值",
            "denominator": "所選顆粒的影像材料；不是每組全部顆粒的平均。",
            "locators": [
              {
                "pdfPage": 6,
                "printedPage": 1676,
                "section": "Table III",
                "detail": "thickness column; footnote a=SEM estimate, b=heterogeneous"
              },
              {
                "pdfPage": 7,
                "printedPage": 1677,
                "section": "SEM and X-ray Microtomography",
                "detail": ""
              },
              {
                "pdfPage": 10,
                "printedPage": 1680,
                "section": "Fig. 7 caption",
                "detail": ""
              }
            ],
            "limits": [
              "表 III 標題稱 average、欄頭稱 mode；不自動統一成平均值。",
              "SEM 估計與 μCT 數值不完全可比；N/A 不是 0。"
            ]
          },
          "micro": {
            "status": "localized-microscopic-collapse-reported-at-protocol-level",
            "claimType": "reported-qualitative-SEM-observation",
            "reportScope": "protocol-level narrative; no per-batch prevalence or quantified micro-collapse fraction",
            "description": "退火組整體較粗、呈片狀；作者仍描述小區域微塌陷，不能填成零微塌陷。",
            "sampleSelection": "每種處理、每個 batch 僅選一顆外觀完整且無可見塌陷或裂縫的 pellet 作 SEM。",
            "locators": [
              {
                "pdfPage": 3,
                "printedPage": 1673,
                "section": "Scanning Electron Microscopy",
                "detail": ""
              },
              {
                "pdfPage": 7,
                "printedPage": 1677,
                "section": "Structure: SEM",
                "detail": ""
              },
              {
                "pdfPage": 8,
                "printedPage": 1678,
                "section": "Fig. 3",
                "detail": ""
              }
            ]
          }
        }
      }
    ],
    "figure": {
      "id": "p24-figure1",
      "sourceId": "freeze-collapse-source-palmkron-2024",
      "src": "./assets/freeze-collapse/palmkron-2024-fig1.jpg",
      "publicPath": "./assets/freeze-collapse/palmkron-2024-fig1.jpg",
      "assetPath": "app/dist/assets/freeze-collapse/palmkron-2024-fig1.jpg",
      "width": 749,
      "height": 847,
      "format": "JPEG",
      "bytes": 166800,
      "sha256": "10be3483153f37fa9c44b2221baf6a15641f45a5ebb033203bd71a549b5cf625",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
      "articleUrl": "https://doi.org/10.1007/s11095-024-03751-w",
      "figurePageUrl": "https://link.springer.com/article/10.1007/s11095-024-03751-w/figures/1",
      "credit": "圖 1｜Palmkron et al. (2024), Pharmaceutical Research 41:1671–1682. DOI:10.1007/s11095-024-03751-w. CC BY 4.0. 由 NLM PMC Article Datasets 於 2026-10-12 取得；原圖未修改。",
      "unchangedBytes": true,
      "caseIds": ["p24-non-b1", "p24-non-b2", "p24-short-b1", "p24-short-b2", "p24-long-b1", "p24-long-b2"],
      "exposureRule": "Whenever full Figure1 is visible, all six cases are exposed; selected HTML outline is an interface overlay, not new experimental content.",
      "alt": "Palmkron 2024 原始圖 1：三種指定退火處理與兩個原文批次，共六格凍乾顆粒照片。未退火 Batch 2 標有可見塌陷 C 與外觀完整 P。"
    },
    "limits": [
      "未報可見巨觀塌陷，不等於沒有微塌陷；顯微描述是處理組層次，不是逐批發生率。",
      "SEM／μCT 使用挑選的完整顆粒，不能代表全部顆粒或把影像點數當獨立樣本數。",
      "退火溫度與時間一起改變，批次還有預冷停留差異；不能拆成已證實的單一因果效果。",
      "表 III 標題稱 average，欄頭稱 mode；這裡只稱厚度欄報值，SEM 估計與 μCT 也不完全可比。",
      "N/A 保留為未知，不能填 0；約三分之一的原始顆粒分母未報，不換成精確百分比。",
      "Tg′ onset −25°C 與熔融 onset −9°C 都不能當作 Tc；Tc、乾品 Tg 與產品測溫時間序列未提供。",
      "圖 6 的 −32°C 是作者假設示意路徑，不是實測 Tp；+20°C 擱板與 30 Pa 腔室設定也不是前緣實測值。",
      "此懸空鋁杯、含菌蔗糖／麥芽糊精顆粒的結果不能套用到 Kodama 瓶裝純蔗糖或所有食品。",
      "外觀／厚度不等於殺菌、菌株存活、乾燥終點、保存期限或食品安全結果。"
    ],
    "sourceRefs": [
      {
        "sourceId": "freeze-collapse-source-palmkron-2024",
        "locator": "PDF p.2／印刷 p.1672：Formulation and Production of Pellets"
      },
      {
        "sourceId": "freeze-collapse-source-palmkron-2024",
        "locator": "PDF p.3／印刷 p.1673：Annealing and Freeze-Drying"
      },
      {
        "sourceId": "freeze-collapse-source-palmkron-2024",
        "locator": "PDF p.3／印刷 p.1673：Determination of Glass Transition Temperature"
      },
      {
        "sourceId": "freeze-collapse-source-palmkron-2024",
        "locator": "PDF p.4／印刷 p.1674：Results: DSC"
      },
      {
        "sourceId": "freeze-collapse-source-palmkron-2024",
        "locator": "PDF p.10／印刷 p.1680：Fig. 6 caption"
      },
      {
        "sourceId": "freeze-collapse-source-palmkron-2024",
        "locator": "PDF p.3／印刷 p.1673：Freeze-Drying of Pellets"
      },
      {
        "sourceId": "freeze-collapse-source-palmkron-2024",
        "locator": "PDF p.2／印刷 p.1672：Introduction: heat transfer"
      },
      {
        "sourceId": "freeze-collapse-source-palmkron-2024",
        "locator": "PDF p.11／印刷 p.1681：Discussion: batch residence"
      }
    ],
    "thermal": {
      "tgPrime": {
        "value": -25,
        "unit": "°C",
        "text": "DSC Tg′ onset = −25°C",
        "method": "DSC；最大凍結濃縮配方 onset；n=3，SD 未列，盤內是否含菌未明述",
        "sd": null,
        "n": 3
      },
      "meltingOnset": {
        "value": -9,
        "unit": "°C",
        "text": "熔融 onset = −9°C（正文 Tm／圖 6 Tm′）",
        "sd": null
      },
      "tc": {
        "value": null,
        "text": "Tc 未量測／報告"
      },
      "dryPelletTg": {
        "value": null,
        "text": "乾品 Tg 因細胞干擾未測得"
      },
      "productTemperature": {
        "value": null,
        "text": "產品實測溫度時間序列未提供"
      },
      "schematicTemperature": {
        "value": -32,
        "unit": "°C",
        "text": "圖 6 的 −32°C 為假設示意，不是產品測溫"
      }
    },
    "apparatus": {
      "sourceId": "freeze-collapse-source-palmkron-2024",
      "locators": [
        {
          "pdfPage": 3,
          "printedPage": 1673,
          "section": "Freeze-Drying of Pellets",
          "detail": ""
        },
        {
          "pdfPage": 2,
          "printedPage": 1672,
          "section": "Introduction: heat transfer",
          "detail": ""
        },
        {
          "pdfPage": 11,
          "printedPage": 1681,
          "section": "Discussion: batch residence",
          "detail": ""
        }
      ],
      "dryer": "Epsilon 2-6D LSC plus, Martin Christ",
      "container": "aluminium cups suspended inside chamber",
      "preCooledChamberC": -30,
      "chamberPressurePa": 30,
      "shelfTemperatureTargetC": 20,
      "shelfRampCPerMin": 4.5,
      "loadingMinutesPerBatch": [
        10,
        15
      ],
      "batch1AdditionalPreCooledResidenceMinutes": [
        10,
        15
      ],
      "dryingEndDefinition": "Pirani and capacitance readings become equal, then 18h; total cycle duration not supplied.",
      "primarySecondaryStepHandling": "Same drying conditions throughout; no separately set primary/secondary steps.",
      "cannotInfer": [
        "20°C 是層板設定，不是顆粒或昇華前緣的實測溫度。",
        "30 Pa 是腔體設定，不是每個位置的前緣壓力。",
        "懸空杯傳熱邊界不能直接套用所有瓶裝、托盤或食品凍乾。",
        "批次裝料停留差異不是獨立隨機化控制的鬆弛實驗。"
      ]
    },
    "batchNotes": [
      "Batch 1 比 Batch 2 多在預冷機中停留約 10–15 分鐘。",
      "批次製備／隨機化／獨立生物重複結構未完整交代。"
    ],
    "sourceIssues": [
      {
        "id": "p24-thickness-statistic",
        "locators": [
          {
            "pdfPage": 6,
            "printedPage": 1676,
            "section": "Table III title and column",
            "detail": ""
          },
          {
            "pdfPage": 7,
            "printedPage": 1677,
            "section": "X-ray Microtomography",
            "detail": ""
          },
          {
            "pdfPage": 9,
            "printedPage": 1679,
            "section": "Fig. 5",
            "detail": ""
          }
        ],
        "fact": "表題稱 average，欄頭稱 mode；短退火正文 mode 1.5–2 μm，表 III B1=2.3、B2=2.0 μm。",
        "handling": "標表 III 厚度欄報值；附方法與差異，不重建分布或改表。"
      },
      {
        "id": "p24-melting-symbol",
        "locators": [
          {
            "pdfPage": 4,
            "printedPage": 1674,
            "section": "Results: DSC",
            "detail": ""
          },
          {
            "pdfPage": 10,
            "printedPage": 1680,
            "section": "Fig. 6",
            "detail": ""
          }
        ],
        "fact": "正文熔融 onset -9°C 符號為 Tm，圖 6 標 Tm′。",
        "handling": "保留符號差異，均不能改稱 Tc。"
      }
    ],
    "interpretation": "外觀、所選顆粒的顯微結構與熱轉變是不同證據層次；兩個批次及三種處理不能合成通用改善百分比。"
  },
  "principles": [
    {
      "id": "transition",
      "label": "Tg′、Tc 與熔融",
      "text": "Tg′是最大凍結濃縮非晶相的玻璃轉移；Tc 是指定方法與尺度的塌陷觀察；結晶系統共晶熔化另屬相轉變。不能用固定差值互換。",
      "sourceRefs": [
        {
          "sourceId": "freeze-collapse-source-palmkron-2024",
          "locator": "PDF pp.3–4：DSC 方法與結果；p.10 Fig.6"
        },
        {
          "sourceId": "freeze-collapse-source-kodama-2014",
          "locator": "PDF pp.3、5：FDM 方法與 onset"
        }
      ]
    },
    {
      "id": "heat-mass",
      "label": "供熱、壓力與乾層",
      "text": "昇華需要潛熱；產品溫度同時受供熱、蒸氣排出及材料／乾層阻力影響。降低腔室壓力不保證更快，擱板設定也不是產品實測溫度。",
      "sourceRefs": [
        {
          "sourceId": "freeze-collapse-source-kodama-2014",
          "locator": "PDF pp.2–4：Eqs.1–8、Table 1、Table 2"
        }
      ]
    },
    {
      "id": "improvement",
      "label": "改善也有代價",
      "text": "調整供熱、壓力、厚度或凍結／退火歷史都需核對材料與量測。更快乾燥、沒有肉眼塌陷與微結構完整不是同一結果。",
      "sourceRefs": [
        {
          "sourceId": "freeze-collapse-source-kodama-2014",
          "locator": "PDF pp.3–5：Table 1、Table 2 與 FDM"
        },
        {
          "sourceId": "freeze-collapse-source-palmkron-2024",
          "locator": "PDF pp.3–7、11：處理、批次、外觀與微觀結果"
        }
      ]
    }
  ]
});
