// Reviewed curriculum text and source locators; no operational food-safety parameters.
const deepFreeze = value => { if (value && typeof value === "object") { Object.values(value).forEach(deepFreeze); Object.freeze(value); } return value; };

export const MICRO_RISK_SOURCES = deepFreeze([
  {
    "id": "micro-risk-source-codex",
    "title": "微生物風險評估原則與指引（2014 增修）",
    "publisher": "Codex Alimentarius／FAO、WHO",
    "url": "https://www.fao.org/input/download/standards/357/CXG_030e_2014.pdf",
    "locator": "實體 PDF p3-p7／印刷 p1-p5：第 3 節定義；5.3 危害辨識；5.4 暴露評估；5.5 危害特性描述；5.6 風險特性描述；5.7-5.8 文件與重新評估",
    "note": "支持四階段、預測微生物學在暴露評估中的位置及不確定性／結果終點邊界；不替本課虛構參數、保存時間或食品放行背書。",
    "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/codex-cxg30-2014.pdf",
    "sha256": "b18be98c4843e25a65ee0a3e601ff39a756ca2a21e97d3a953a84bde4a541637"
  },
  {
    "id": "micro-risk-source-mra36",
    "title": "微生物風險評估食品指引：暴露、劑量反應與不確定性",
    "publisher": "FAO／WHO；Microbiological Risk Assessment Series 36，2021",
    "url": "https://www.fao.org/4/cb5006en/cb5006en.pdf",
    "locator": "實體 PDF p86／印刷 p67：6.3；p108-p110／印刷 p89-p91：7.4.3；p206／印刷 p187：12.2；p216／印刷 p197：13.3.1；p222-p228／印刷 p203-p209：第 14 章",
    "note": "支持平均劑量與反應模型相容性、single-hit 形式、適用域以及變異／不確定性區分。N~Poisson(d) 為本課明示的額外題設；所有數值均原創，沒有真實菌種或食品預測效力。",
    "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/fao-who-mra36-2021.pdf",
    "sha256": "62f48f8a3f9cc83e746e922a46c90d191128da567047056c12a963787b9ac86e"
  }
]);

export const MICRO_RISK_FRAMEWORK = deepFreeze([
  {
    "id": "hazard-identification",
    "title": "危害辨識",
    "question": "什麼危害、哪種食品？",
    "role": "固定 H* 與 F*",
    "detail": "先界定有關的微生物或毒素及食品。菌量曲線本身不會證明某菌是此食品的致病危害。",
    "sourceIds": [
      "micro-risk-source-codex"
    ],
    "claimIds": [
      "R01",
      "R02"
    ]
  },
  {
    "id": "hazard-characterization",
    "title": "危害特性描述",
    "question": "對誰、造成什麼結果？",
    "role": "指定 G*、感染終點與 r",
    "detail": "本課只指定感染模型；發病、嚴重度與其他健康結果仍未知。劑量反應需要危害、宿主與情境適用資料。",
    "sourceIds": [
      "micro-risk-source-codex",
      "micro-risk-source-mra36"
    ],
    "claimIds": [
      "R04",
      "R06",
      "R08"
    ]
  },
  {
    "id": "exposure-assessment",
    "title": "暴露評估",
    "question": "吃進多少？",
    "role": "條件→C→d",
    "detail": "預測微生物學可描述條件下的菌量變化，再接份量。本課省略更完整的污染路徑與分布，不因圖可計算就視為實證模型。",
    "sourceIds": [
      "micro-risk-source-codex",
      "micro-risk-source-mra36"
    ],
    "claimIds": [
      "R03",
      "R07",
      "R09"
    ]
  },
  {
    "id": "risk-characterization",
    "title": "風險特性描述",
    "question": "能推到哪個健康結果？",
    "role": "暴露＋反應＋限制",
    "detail": "整合前述資料及不確定性。本課只報指定虛構情境每份感染機率；嚴重度、發病及整體市場風險保留 UNKNOWN。",
    "sourceIds": [
      "micro-risk-source-codex",
      "micro-risk-source-mra36"
    ],
    "claimIds": [
      "R05",
      "R11",
      "R12"
    ]
  }
]);

export const MICRO_RISK_LESSON_SCOPE = deepFreeze({
  "title": "虛構情境；結果只在題設內成立。",
  "hazard": "H*（虛構危害）",
  "food": "F*（虛構食品）",
  "host": "G*（虛構宿主群）",
  "endpoint": "感染",
  "estimand": "指定虛構暴露情境內，一次食用一份的感染機率",
  "unresolved": [
    "發病機率",
    "嚴重度",
    "真實食品安全",
    "跨情境或全市場風險"
  ],
  "modelAssumptions": [
    "所有參數為教材原創，並非實測或擬合。",
    "A/B 只對應題設 g，沒有真實溫度／pH／aw 對照。",
    "d 是 Poisson 平均劑量；N 為非負整數，容許 N=0。",
    "每顆細胞獨立，r 固定；未模擬群聚或宿主差異。",
    "未模擬 lag、平台、死亡、競爭、毒素與再污染。"
  ],
  "denominatorNote": "本情境包含零數份量，不能稱為已知污染份的條件風險；不再乘上 P(N≥1)，也沒有把市場污染率默認為 1。",
  "unknownNote": "缺資料顯示未知與缺少哪一段，數值存 null；未知不是 0。",
  "variabilityNote": "比較題設份量的差異；它們不是實測人群分布。",
  "uncertaintyNote": "固定份量比較 r 候選值，只是情境敏感度；未指定機率或信賴區間，也未量化全部不確定性。",
  "sourceAuthorityNote": "來源支持概念與模型形式，不替原創數值或真實食品安全背書。",
  "claimIds": [
    "R06",
    "R07",
    "R08",
    "R09",
    "R10",
    "R11",
    "R12",
    "R13"
  ]
});

// Source-by-source claim map for expanded evidence views, not default-screen prose.
export const MICRO_RISK_CLAIMS = deepFreeze([
  {
    "id": "R01",
    "claim": "四階段：危害辨識、危害特性描述、暴露評估、風險特性描述。",
    "evidence": [
      {
        "title": "Principles and Guidelines for the Conduct of Microbiological Risk Assessment",
        "url": "https://www.fao.org/input/download/standards/357/CXG_030e_2014.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/codex-cxg30-2014.pdf",
        "sha256": "b18be98c4843e25a65ee0a3e601ff39a756ca2a21e97d3a953a84bde4a541637",
        "pdfPage": 3,
        "printedPage": 1,
        "section": "3 Definitions",
        "paragraphLocator": "Risk Assessment"
      }
    ],
    "use": "four labelled conceptual regions"
  },
  {
    "id": "R02",
    "claim": "危害辨識確認食品相關微生物／毒素；不是由菌量推得危害身分。",
    "evidence": [
      {
        "title": "Principles and Guidelines for the Conduct of Microbiological Risk Assessment",
        "url": "https://www.fao.org/input/download/standards/357/CXG_030e_2014.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/codex-cxg30-2014.pdf",
        "sha256": "b18be98c4843e25a65ee0a3e601ff39a756ca2a21e97d3a953a84bde4a541637",
        "pdfPage": 5,
        "printedPage": 3,
        "section": "5.3 Hazard Identification",
        "paragraphLocator": "first paragraph"
      }
    ],
    "use": "hazard-food-host scope must be stated"
  },
  {
    "id": "R03",
    "claim": "暴露需食用份量、污染頻率與程度，以及生產至食用路徑。預測微生物學可供其中使用。",
    "evidence": [
      {
        "title": "Principles and Guidelines for the Conduct of Microbiological Risk Assessment",
        "url": "https://www.fao.org/input/download/standards/357/CXG_030e_2014.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/codex-cxg30-2014.pdf",
        "sha256": "b18be98c4843e25a65ee0a3e601ff39a756ca2a21e97d3a953a84bde4a541637",
        "pdfPage": 5,
        "printedPage": 3,
        "section": "5.4 Exposure Assessment",
        "paragraphLocator": "first two paragraphs"
      },
      {
        "title": "Principles and Guidelines for the Conduct of Microbiological Risk Assessment",
        "url": "https://www.fao.org/input/download/standards/357/CXG_030e_2014.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/codex-cxg30-2014.pdf",
        "sha256": "b18be98c4843e25a65ee0a3e601ff39a756ca2a21e97d3a953a84bde4a541637",
        "pdfPage": 6,
        "printedPage": 4,
        "section": "5.4 continuation",
        "paragraphLocator": "first three paragraphs"
      }
    ],
    "use": "locate growth prediction inside exposure, not equivalent to entire MRA"
  },
  {
    "id": "R04",
    "claim": "危害特性描述含不良結果特性；有資料時作劑量反應，並區分感染與發病。",
    "evidence": [
      {
        "title": "Principles and Guidelines for the Conduct of Microbiological Risk Assessment",
        "url": "https://www.fao.org/input/download/standards/357/CXG_030e_2014.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/codex-cxg30-2014.pdf",
        "sha256": "b18be98c4843e25a65ee0a3e601ff39a756ca2a21e97d3a953a84bde4a541637",
        "pdfPage": 6,
        "printedPage": 4,
        "section": "5.5 Hazard Characterization",
        "paragraphLocator": "first and last paragraphs"
      }
    ],
    "use": "label endpoint; missing quantitative data does not prohibit documented qualitative assessment"
  },
  {
    "id": "R05",
    "claim": "風險特性描述整合前三部分，連同不確定性描述可能性與嚴重性。",
    "evidence": [
      {
        "title": "Principles and Guidelines for the Conduct of Microbiological Risk Assessment",
        "url": "https://www.fao.org/input/download/standards/357/CXG_030e_2014.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/codex-cxg30-2014.pdf",
        "sha256": "b18be98c4843e25a65ee0a3e601ff39a756ca2a21e97d3a953a84bde4a541637",
        "pdfPage": 6,
        "printedPage": 4,
        "section": "5.6 Risk Characterization",
        "paragraphLocator": "first two paragraphs"
      }
    ],
    "use": "infection probability alone is not full severity characterization"
  },
  {
    "id": "R06",
    "claim": "暴露與反應必須在危害、族群及劑量單位上相容。",
    "evidence": [
      {
        "title": "Microbiological risk assessment - Guidance for food",
        "url": "https://www.fao.org/4/cb5006en/cb5006en.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/fao-who-mra36-2021.pdf",
        "sha256": "62f48f8a3f9cc83e746e922a46c90d191128da567047056c12a963787b9ac86e",
        "pdfPage": 109,
        "printedPage": 90,
        "section": "7.4.3",
        "paragraphLocator": "Combining exposure and dose-response assessments"
      }
    ],
    "use": "do not swap pathogen, food matrix, host group, or endpoint without evidence"
  },
  {
    "id": "R07",
    "claim": "濃度乘食用量得到劑量；平均劑量要配適用於平均輸入的反應式。",
    "evidence": [
      {
        "title": "Microbiological risk assessment - Guidance for food",
        "url": "https://www.fao.org/4/cb5006en/cb5006en.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/fao-who-mra36-2021.pdf",
        "sha256": "62f48f8a3f9cc83e746e922a46c90d191128da567047056c12a963787b9ac86e",
        "pdfPage": 86,
        "printedPage": 67,
        "section": "6.3",
        "paragraphLocator": "first bullet after model requirement"
      },
      {
        "title": "Microbiological risk assessment - Guidance for food",
        "url": "https://www.fao.org/4/cb5006en/cb5006en.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/fao-who-mra36-2021.pdf",
        "sha256": "62f48f8a3f9cc83e746e922a46c90d191128da567047056c12a963787b9ac86e",
        "pdfPage": 109,
        "printedPage": 90,
        "section": "7.4.3",
        "paragraphLocator": "first paragraph"
      }
    ],
    "use": "C times m is a mean dose in proposed toy, not an exact organism count"
  },
  {
    "id": "R08",
    "claim": "獨立 single-hit：確切 n 顆時 P(Inf)=1−(1−r)^n。",
    "evidence": [
      {
        "title": "Microbiological risk assessment - Guidance for food",
        "url": "https://www.fao.org/4/cb5006en/cb5006en.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/fao-who-mra36-2021.pdf",
        "sha256": "62f48f8a3f9cc83e746e922a46c90d191128da567047056c12a963787b9ac86e",
        "pdfPage": 216,
        "printedPage": 197,
        "section": "13.3.1 Dose-infection models",
        "paragraphLocator": "paragraph and displayed equation"
      }
    ],
    "use": "Poisson-mean exponential expression is derived with an additional explicit toy assumption"
  },
  {
    "id": "R09",
    "claim": "生長模型需核對有效性與適用域；外推不能自動成為可靠預測。",
    "evidence": [
      {
        "title": "Microbiological risk assessment - Guidance for food",
        "url": "https://www.fao.org/4/cb5006en/cb5006en.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/fao-who-mra36-2021.pdf",
        "sha256": "62f48f8a3f9cc83e746e922a46c90d191128da567047056c12a963787b9ac86e",
        "pdfPage": 206,
        "printedPage": 187,
        "section": "12.2 and 12.2.1",
        "paragraphLocator": "opening paragraphs"
      }
    ],
    "use": "growth lesson remains distinct from real product model validation"
  },
  {
    "id": "R10",
    "claim": "變異是單位的真實差異；增加資料通常只是更準確描述它。不確定性源於知識不足，可藉適當資料減少。",
    "evidence": [
      {
        "title": "Microbiological risk assessment - Guidance for food",
        "url": "https://www.fao.org/4/cb5006en/cb5006en.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/fao-who-mra36-2021.pdf",
        "sha256": "62f48f8a3f9cc83e746e922a46c90d191128da567047056c12a963787b9ac86e",
        "pdfPage": 222,
        "printedPage": 203,
        "section": "14.1",
        "paragraphLocator": "first paragraph"
      },
      {
        "title": "Microbiological risk assessment - Guidance for food",
        "url": "https://www.fao.org/4/cb5006en/cb5006en.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/fao-who-mra36-2021.pdf",
        "sha256": "62f48f8a3f9cc83e746e922a46c90d191128da567047056c12a963787b9ac86e",
        "pdfPage": 223,
        "printedPage": 204,
        "section": "14.1 continuation",
        "paragraphLocator": "second paragraph"
      },
      {
        "title": "Microbiological risk assessment - Guidance for food",
        "url": "https://www.fao.org/4/cb5006en/cb5006en.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/fao-who-mra36-2021.pdf",
        "sha256": "62f48f8a3f9cc83e746e922a46c90d191128da567047056c12a963787b9ac86e",
        "pdfPage": 225,
        "printedPage": 206,
        "section": "14.2",
        "paragraphLocator": "first and last paragraphs"
      }
    ],
    "use": "separate serving variation from candidate-parameter comparisons"
  },
  {
    "id": "R11",
    "claim": "不能量化的不確定性仍須說明，未表徵部分需保留條件假設。",
    "evidence": [
      {
        "title": "Microbiological risk assessment - Guidance for food",
        "url": "https://www.fao.org/4/cb5006en/cb5006en.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/fao-who-mra36-2021.pdf",
        "sha256": "62f48f8a3f9cc83e746e922a46c90d191128da567047056c12a963787b9ac86e",
        "pdfPage": 228,
        "printedPage": 209,
        "section": "14.3 continuation",
        "paragraphLocator": "second paragraph"
      }
    ],
    "use": "UNKNOWN and explicit assumptions; never silently supply zero"
  },
  {
    "id": "R12",
    "claim": "評估與管理功能有別；定量資料不足時可用有依據的定性判斷。",
    "evidence": [
      {
        "title": "Principles and Guidelines for the Conduct of Microbiological Risk Assessment",
        "url": "https://www.fao.org/input/download/standards/357/CXG_030e_2014.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/codex-cxg30-2014.pdf",
        "sha256": "b18be98c4843e25a65ee0a3e601ff39a756ca2a21e97d3a953a84bde4a541637",
        "pdfPage": 4,
        "printedPage": 2,
        "section": "4; 5.1",
        "paragraphLocator": "functional separation and general considerations"
      },
      {
        "title": "Principles and Guidelines for the Conduct of Microbiological Risk Assessment",
        "url": "https://www.fao.org/input/download/standards/357/CXG_030e_2014.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/codex-cxg30-2014.pdf",
        "sha256": "b18be98c4843e25a65ee0a3e601ff39a756ca2a21e97d3a953a84bde4a541637",
        "pdfPage": 5,
        "printedPage": 3,
        "section": "5.1 continuation",
        "paragraphLocator": "scientific evidence paragraph"
      },
      {
        "title": "Principles and Guidelines for the Conduct of Microbiological Risk Assessment",
        "url": "https://www.fao.org/input/download/standards/357/CXG_030e_2014.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/codex-cxg30-2014.pdf",
        "sha256": "b18be98c4843e25a65ee0a3e601ff39a756ca2a21e97d3a953a84bde4a541637",
        "pdfPage": 6,
        "printedPage": 4,
        "section": "5.6",
        "paragraphLocator": "second paragraph"
      }
    ],
    "use": "lesson provides no release decision or storage recommendation"
  },
  {
    "id": "R13",
    "claim": "假設、限制與不確定性需可追溯；新資料可促成重新評估。",
    "evidence": [
      {
        "title": "Principles and Guidelines for the Conduct of Microbiological Risk Assessment",
        "url": "https://www.fao.org/input/download/standards/357/CXG_030e_2014.pdf",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/codex-cxg30-2014.pdf",
        "sha256": "b18be98c4843e25a65ee0a3e601ff39a756ca2a21e97d3a953a84bde4a541637",
        "pdfPage": 7,
        "printedPage": 5,
        "section": "5.7; 5.8",
        "paragraphLocator": "documentation and reassessment paragraphs"
      }
    ],
    "use": "retain original reasoning, sources and revisions"
  },
  {
    "id": "R14",
    "claim": "2026-10-13 取得的 WHO series 仍將 MRA36 列為通用指引；較新的條目有特定危害報告。",
    "evidence": [
      {
        "title": "Microbiological Risk Assessment series",
        "url": "https://www.who.int/groups/joint-fao-who-expert-meetings-on-microbiological-risk-assessment-(jemra)/microbiological-risk-assessment-series",
        "localPath": "output/refrigeration-micro-continuity-2026-10-13/risk-source-contract/sources/who-mra-series-current.html",
        "sha256": "5781a790548b75736c59483b31341634504fa73a063a491c9b32eb9213fe404e",
        "pdfPage": null,
        "printedPage": null,
        "section": "Overview",
        "paragraphLocator": "MRA36 overview link and chronological entries"
      }
    ],
    "use": "latest-public availability check; not proof no other guidance exists"
  }
]);
