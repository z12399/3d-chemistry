// Generated from the frozen LP95 S1/S2 contract; no reconstructed replicates.
const freeze = value => { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const GROWTH_STUDY = freeze({
  "schemaVersion": 1,
  "id": "lp95-soymilk-growth-s1s2-2023",
  "status": "CANDIDATE_READY_WITH_EXPLICIT_LIMITS",
  "frozenAtUTC": "2026-10-12T05:41:10.147623+00:00",
  "title": "Antioxidative Properties of Fermented Soymilk Using Lactiplantibacillus plantarum LP95",
  "authors": [
    "Francesco Letizia",
    "Alessandra Fratianni",
    "Martina Cofelice",
    "Bruno Testa",
    "Gianluca Albanese",
    "Catello Di Martino",
    "Gianfranco Panfili",
    "Francesco Lopez",
    "Massimo Iorizzo"
  ],
  "year": 2023,
  "journal": "Antioxidants",
  "volume": 12,
  "issue": 7,
  "articleNumber": 1442,
  "doi": "10.3390/antiox12071442",
  "url": "https://doi.org/10.3390/antiox12071442",
  "articleUrl": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10376881/",
  "supplementUrl": "https://www.mdpi.com/article/10.3390/antiox12071442/s1",
  "retrievedSupplementUrl": "https://www.ebi.ac.uk/europepmc/webservices/rest/PMC10376881/supplementaryFiles",
  "locator": "Supplementary PDF antioxidants-2462353-SI.pdf, page 1, Table S1 and Table S2; main text sections 2.4, 2.9 and 3.1",
  "license": "CC BY 4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
  "metadata": {
    "organism": "Lactiplantibacillus plantarum LP95",
    "matrix": "soymilk",
    "studyStage": "preliminary fermentation trial",
    "timeUnit": "hours",
    "publishedCountUnit": "log CFU/mL",
    "publishedSummary": "mean ± standard deviation (n = 3)",
    "logBaseExplicit": false,
    "analysisLogBase": 10,
    "analysisAssumption": "原表 log 未明示底數；本課按 log10 解讀。mu_app 與 g 是在此解讀下由所選刊載均值計算的條件估計，非作者直接報值。",
    "pHUnit": "pH",
    "n": 3,
    "nMeaning": "three independent aliquots obtained from a single initial mass of soymilk after starter microbial inoculation (main text section 2.9)",
    "independentManufacturingBatches": false,
    "individualReplicateValuesAvailable": false,
    "unknown": [
      "individual aliquot values",
      "time-point aliquot pairing/repeated-measure structure",
      "covariance between time points",
      "between-batch variation",
      "order of averaging and log transformation"
    ],
    "letterMeaning": "Different lowercase letters in each row indicate significant differences (p < 0.05); row is one time, compared across the three conditions.",
    "initialCountDiscrepancy": {
      "methodSection": "2.4",
      "publishedNominalInoculumCFUmL": 1000000,
      "tableS1InitialPublishedLogMeans": [
        7.29,
        7.3,
        7.32
      ],
      "resolution": "unresolved; retain both published statements; use unchanged table values for descriptive calculations"
    }
  },
  "series": [
    {
      "id": "lp95-20c",
      "label": "LP95 豆奶原研究 20 °C",
      "temperatureC": 20,
      "points": [
        {
          "id": "lp95-20c-h0",
          "hours": 0,
          "log10Mean": 7.29,
          "log10Sd": 0.01,
          "letter": "a",
          "pHMean": 6.4,
          "pHSd": 0.02,
          "pHLetter": "a",
          "publishedCountCell": "7.29/0.01/a",
          "publishedPHCell": "6.40/0.02/a"
        },
        {
          "id": "lp95-20c-h3",
          "hours": 3,
          "log10Mean": 7.53,
          "log10Sd": 0.02,
          "letter": "c",
          "pHMean": 6.3,
          "pHSd": 0.02,
          "pHLetter": "a",
          "publishedCountCell": "7.53/0.02/c",
          "publishedPHCell": "6.30/0.02/a"
        },
        {
          "id": "lp95-20c-h6",
          "hours": 6,
          "log10Mean": 7.85,
          "log10Sd": 0.01,
          "letter": "c",
          "pHMean": 6.2,
          "pHSd": 0.03,
          "pHLetter": "a",
          "publishedCountCell": "7.85/0.01/c",
          "publishedPHCell": "6.20/0.03/a"
        },
        {
          "id": "lp95-20c-h9",
          "hours": 9,
          "log10Mean": 8.25,
          "log10Sd": 0.03,
          "letter": "c",
          "pHMean": 5.98,
          "pHSd": 0.02,
          "pHLetter": "a",
          "publishedCountCell": "8.25/0.03/c",
          "publishedPHCell": "5.98/0.02/a"
        },
        {
          "id": "lp95-20c-h24",
          "hours": 24,
          "log10Mean": 9.17,
          "log10Sd": 0.03,
          "letter": "a",
          "pHMean": 5.05,
          "pHSd": 0.03,
          "pHLetter": "a",
          "publishedCountCell": "9.17/0.03/a",
          "publishedPHCell": "5.05/0.03/a"
        },
        {
          "id": "lp95-20c-h32",
          "hours": 32,
          "log10Mean": 9.2,
          "log10Sd": 0.04,
          "letter": "a",
          "pHMean": 4.95,
          "pHSd": 0.03,
          "pHLetter": "a",
          "publishedCountCell": "9.20/0.04/a",
          "publishedPHCell": "4.95/0.03/a"
        },
        {
          "id": "lp95-20c-h48",
          "hours": 48,
          "log10Mean": 9.17,
          "log10Sd": 0.05,
          "letter": "a",
          "pHMean": 4.76,
          "pHSd": 0.02,
          "pHLetter": "a",
          "publishedCountCell": "9.17/0.05/a",
          "publishedPHCell": "4.76/0.02/a"
        },
        {
          "id": "lp95-20c-h72",
          "hours": 72,
          "log10Mean": 9.16,
          "log10Sd": 0.03,
          "letter": "a",
          "pHMean": 4.47,
          "pHSd": 0.03,
          "pHLetter": "a",
          "publishedCountCell": "9.16/0.03/a",
          "publishedPHCell": "4.47/0.03/a"
        }
      ]
    },
    {
      "id": "lp95-28c",
      "label": "LP95 豆奶原研究 28 °C",
      "temperatureC": 28,
      "points": [
        {
          "id": "lp95-28c-h0",
          "hours": 0,
          "log10Mean": 7.3,
          "log10Sd": 0.01,
          "letter": "a",
          "pHMean": 6.4,
          "pHSd": 0.03,
          "pHLetter": "a",
          "publishedCountCell": "7.30/0.01/a",
          "publishedPHCell": "6.40/0.03/a"
        },
        {
          "id": "lp95-28c-h3",
          "hours": 3,
          "log10Mean": 8.01,
          "log10Sd": 0.03,
          "letter": "b",
          "pHMean": 6.23,
          "pHSd": 0.02,
          "pHLetter": "b",
          "publishedCountCell": "8.01/0.03/b",
          "publishedPHCell": "6.23/0.02/b"
        },
        {
          "id": "lp95-28c-h6",
          "hours": 6,
          "log10Mean": 8.7,
          "log10Sd": 0.01,
          "letter": "b",
          "pHMean": 5.65,
          "pHSd": 0.01,
          "pHLetter": "b",
          "publishedCountCell": "8.70/0.01/b",
          "publishedPHCell": "5.65/0.01/b"
        },
        {
          "id": "lp95-28c-h9",
          "hours": 9,
          "log10Mean": 8.93,
          "log10Sd": 0.01,
          "letter": "b",
          "pHMean": 5.31,
          "pHSd": 0.02,
          "pHLetter": "b",
          "publishedCountCell": "8.93/0.01/b",
          "publishedPHCell": "5.31/0.02/b"
        },
        {
          "id": "lp95-28c-h24",
          "hours": 24,
          "log10Mean": 9.21,
          "log10Sd": 0.04,
          "letter": "a",
          "pHMean": 4.73,
          "pHSd": 0.03,
          "pHLetter": "b",
          "publishedCountCell": "9.21/0.04/a",
          "publishedPHCell": "4.73/0.03/b"
        },
        {
          "id": "lp95-28c-h32",
          "hours": 32,
          "log10Mean": 9.23,
          "log10Sd": 0.04,
          "letter": "a",
          "pHMean": 4.59,
          "pHSd": 0.01,
          "pHLetter": "b",
          "publishedCountCell": "9.23/0.04/a",
          "publishedPHCell": "4.59/0.01/b"
        },
        {
          "id": "lp95-28c-h48",
          "hours": 48,
          "log10Mean": 9.2,
          "log10Sd": 0.02,
          "letter": "a",
          "pHMean": 4.41,
          "pHSd": 0.02,
          "pHLetter": "b",
          "publishedCountCell": "9.20/0.02/a",
          "publishedPHCell": "4.41/0.02/b"
        },
        {
          "id": "lp95-28c-h72",
          "hours": 72,
          "log10Mean": 9.21,
          "log10Sd": 0.04,
          "letter": "a",
          "pHMean": 4.12,
          "pHSd": 0.02,
          "pHLetter": "b",
          "publishedCountCell": "9.21/0.04/a",
          "publishedPHCell": "4.12/0.02/b"
        }
      ]
    },
    {
      "id": "lp95-37c",
      "label": "LP95 豆奶原研究 37 °C",
      "temperatureC": 37,
      "points": [
        {
          "id": "lp95-37c-h0",
          "hours": 0,
          "log10Mean": 7.32,
          "log10Sd": 0.02,
          "letter": "a",
          "pHMean": 6.4,
          "pHSd": 0.02,
          "pHLetter": "a",
          "publishedCountCell": "7.32/0.02/a",
          "publishedPHCell": "6.40/0.02/a"
        },
        {
          "id": "lp95-37c-h3",
          "hours": 3,
          "log10Mean": 8.19,
          "log10Sd": 0.03,
          "letter": "a",
          "pHMean": 6.1,
          "pHSd": 0.02,
          "pHLetter": "c",
          "publishedCountCell": "8.19/0.03/a",
          "publishedPHCell": "6.10/0.02/c"
        },
        {
          "id": "lp95-37c-h6",
          "hours": 6,
          "log10Mean": 8.89,
          "log10Sd": 0.01,
          "letter": "a",
          "pHMean": 5.33,
          "pHSd": 0.01,
          "pHLetter": "c",
          "publishedCountCell": "8.89/0.01/a",
          "publishedPHCell": "5.33/0.01/c"
        },
        {
          "id": "lp95-37c-h9",
          "hours": 9,
          "log10Mean": 9.03,
          "log10Sd": 0.04,
          "letter": "a",
          "pHMean": 4.94,
          "pHSd": 0.04,
          "pHLetter": "c",
          "publishedCountCell": "9.03/0.04/a",
          "publishedPHCell": "4.94/0.04/c"
        },
        {
          "id": "lp95-37c-h24",
          "hours": 24,
          "log10Mean": 9.23,
          "log10Sd": 0.05,
          "letter": "a",
          "pHMean": 4.27,
          "pHSd": 0.03,
          "pHLetter": "c",
          "publishedCountCell": "9.23/0.05/a",
          "publishedPHCell": "4.27/0.03/c"
        },
        {
          "id": "lp95-37c-h32",
          "hours": 32,
          "log10Mean": 9.25,
          "log10Sd": 0.06,
          "letter": "a",
          "pHMean": 4.18,
          "pHSd": 0.03,
          "pHLetter": "c",
          "publishedCountCell": "9.25/0.06/a",
          "publishedPHCell": "4.18/0.03/c"
        },
        {
          "id": "lp95-37c-h48",
          "hours": 48,
          "log10Mean": 9.24,
          "log10Sd": 0.04,
          "letter": "a",
          "pHMean": 4.15,
          "pHSd": 0.02,
          "pHLetter": "c",
          "publishedCountCell": "9.24/0.04/a",
          "publishedPHCell": "4.15/0.02/c"
        },
        {
          "id": "lp95-37c-h72",
          "hours": 72,
          "log10Mean": 9.15,
          "log10Sd": 0.05,
          "letter": "a",
          "pHMean": 4.1,
          "pHSd": 0.03,
          "pHLetter": "b",
          "publishedCountCell": "9.15/0.05/a",
          "publishedPHCell": "4.10/0.03/b"
        }
      ]
    }
  ],
  "acceptedUses": [
    "Select a time window and fit an equal-weight straight line to the published log-scale means.",
    "Compare apparent slopes, conditional mu_app and doubling time under the explicit decimal-log assumption.",
    "Inspect residuals and errors on points from the same series that were not used for fitting.",
    "Show window dependence and failure of unconstrained exponential extrapolation.",
    "Compare pH and count as separate co-observed quantities without assigning causation."
  ],
  "limits": [
    "原表標示 log CFU/mL，正文及補充表未明示對數底；本課按 log10 解讀，mu_app 與倍增時間均為此分析約定下的條件估計。",
    "log10Mean/log10Sd 欄名是本課機讀分析約定；原始刊載均值與SD數字未被改寫、再次取對數或換底。",
    "數值是原研究刊載的均值與標準差，不是三份等分各自的原始量測；不可重建不存在的重複值。",
    "正文2.9說明三份獨立等分來自同一初始豆奶材料；n=3不是三個獨立製造批次。",
    "等分逐點值、各時間點等分配對、重複取樣結構、SD共變異及跨批次變異未知。",
    "原文未明示先取log再平均或先平均再取log；不將反轉10次方值宣稱為原始CFU的算術平均。",
    "等權OLS只擬合使用者選取的刊載log均值，不以SD倒數加權，不由這些摘要值給出推論型信賴區間。",
    "正斜率換算只稱選窗的表觀mu_app與條件倍增時間；不宣稱最大比生長速率mu_max、單細胞代時或菌種常數。",
    "觀測稀疏，0至3小時之間沒有觀測；不估精確遲滯時間，不把未見平坦區解釋為沒有lag。",
    "同研究同序列未用於擬合的點可檢查模型延伸誤差；不是獨立外部驗證、跨批次確效或盲測證據。",
    "pH與菌數是不同量；S2僅支持同條件時間趨勢共變，不能將相關變化當作pH的獨立因果效應或酸產量。",
    "S1及S2的字母比較範圍是同一時間列的不同條件；不可跨時間讀成顯著性比較。",
    "預試方法2.4所述接種10^6 CFU/mL與S1起始7.29至7.32 log CFU/mL不一致；保留矛盾，不修正任一刊載值。",
    "S3屬另一發酵及儲存試驗，初值與階段不同；不混入S1擬合或充當獨立驗證集。",
    "此資料不能給出食品保存期限、安全加工排程、病原生長預測、人體健康效果或任何新條件的經驗證預測。"
  ],
  "provenance": {
    "sourceKind": "published experimental summary table, not individual raw replicate records and not figure digitization",
    "supplementFile": "primary-lp95/antioxidants-2462353-SI.pdf",
    "supplementSha256": "540e8acd69f857ca12c6e1af780a80f5c5530c14c8151903af3f635bbddb95af",
    "sourceXmlFile": "primary-lp95/lp95-europepmc-fulltext.xml",
    "sourceXmlSha256": "efb81e5a0ade6b4977edc237f932a6d78442c2edc61e2c8c887612a3a385c271",
    "containerFile": "primary-lp95/lp95-europepmc-supplementaryFiles.zip",
    "containerSha256": "2318692eb9f2033695703748889ea0478a1e74316d7de59f62e8917df39e1d13",
    "nestedZipFile": "primary-lp95/antioxidants-12-01442-s001-actual.zip",
    "nestedZipSha256": "0dc659bbb99a2a93ec28edee9dd6954aaed02122cdbb8d2ba707dbf32d5ac0ff",
    "visualReadbackFile": "primary-lp95/antioxidants-2462353-SI-page1.png",
    "visualReadbackSha256": "0136f7d8aac5a1466924ba995e86787abe95e2d3f67d87711b9903b1749868b3",
    "visualReadback": "All 24 Table S1 and all 24 Table S2 cells, including mean, SD and significance letter, were manually checked against the rendered first PDF page.",
    "excludedTable": "S3 and all other tables are preserved in source PDF but excluded from the machine-readable teaching series.",
    "failedRetrievalsRetained": true
  }
});
export const GROWTH_SERIES = GROWTH_STUDY.series;
export const GROWTH_LIMITS = GROWTH_STUDY.limits;
export const GROWTH_ESTIMATION_SOURCES = freeze([
  {
    "id": "growth-source-lp95",
    "title": "Letizia et al. (2023)：Antioxidative Properties of Fermented Soymilk Using Lactiplantibacillus plantarum LP95",
    "url": "https://doi.org/10.3390/antiox12071442",
    "publisher": "Antioxidants 12(7), 1442；CC BY 4.0",
    "locator": "補充 PDF 第 1 頁 Tables S1/S2；正文 §2.4、§2.9、§3.1；Europe PMC 保存的作者補充原檔",
    "note": "僅採預試的三條件、八時間點刊載均值／SD／字母。原表 log 未明示底數，本課按 log10 解讀。n=3 來自同一初始豆乳的等分，不是三個製造批次；未取得逐等分值、時間配對與跨批次變異。保留接種量與表格初值矛盾；S3 不混入。"
  },
  {
    "id": "growth-source-nist-ols",
    "title": "NIST/SEMATECH e-Handbook 4.1.4.1：Linear Least Squares Regression",
    "url": "https://www.itl.nist.gov/div898/handbook/pmd/section1/pmd141.htm",
    "publisher": "NIST / SEMATECH",
    "locator": "Definition、Why Least Squares、Disadvantages 段落",
    "note": "支持最小平方的定義與模型形狀／外推限制；不是 LP95 原作者的生長模型，也不證明本課所選區間符合生理指數期。"
  },
  {
    "id": "growth-source-nist-estimation",
    "title": "NIST/SEMATECH e-Handbook 4.4.3.1：Least Squares",
    "url": "https://www.itl.nist.gov/div898/handbook/pmd/section4/pmd431.htm",
    "publisher": "NIST / SEMATECH",
    "locator": "Least Squares Estimation、Linear Least Squares 及直線係數估計式",
    "note": "支持未加權直線係數的計算。本課對所選刊載 log 均值等權擬合；沒有以 SD 推回重複樣本、加權或建立推論型信賴區間。"
  },
  {
    "id": "growth-source-nist-validation",
    "title": "NIST/SEMATECH e-Handbook 4.4.4：How can I tell if a model fits my data?",
    "url": "https://www.itl.nist.gov/div898/handbook/pmd/section4/pmd44.htm",
    "publisher": "NIST / SEMATECH",
    "locator": "Model Validation、Graphical Analysis 及殘差分析說明",
    "note": "支持檢查殘差與模型假設，不能單憑一個擬合指標確認模型。相同研究的未用點／另一條件比較不是跨批次外部確效；本課不作保存期限或食品安全判定。"
  },
  {
    "id": "growth-source-openstax",
    "title": "OpenStax Microbiology 9.1：How Microbes Grow",
    "url": "https://openstax.org/books/microbiology/pages/9-1-how-microbes-grow",
    "publisher": "OpenStax / Rice University",
    "locator": "Generation Time、Calculating Number of Cells、The Growth Curve、The Log Phase",
    "note": "倍增關係適用於限定條件的指數增長。由 CFU 摘要均值的局部斜率換算只稱表觀條件倍增時間，不當作單細胞代時、菌種常數或最大比生長速率；稀疏觀察也不能精確估 lag。"
  }
]);
