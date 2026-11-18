// Source-audited teaching data. Dates, analysis sets and unknowns remain version-specific.
// Evidence graphs in this activity are claim-support diagrams, not reconstructed trees.
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const OUTBREAK_DATA = deepFreeze({
  "schemaVersion": "1.0.0",
  "id": "micro-outbreak-evidence",
  "provenanceInterpretation": "每張卡的 provenance 保留來源審查候選資料原文；其中 cannotInfer 列舉不受支持或不能推出的主張，部分片語省略否定詞，不能當成肯定事實。畫面與評估使用已寫明否定語的 limits；少數簡體字在顯示文字轉為繁體，原 provenance 不改寫。",
  "claim": {
    "id": "common-plant",
    "label": "這家工廠的相關產品與病例群聚有何關聯？",
    "boundary": "支持可累積，但不計算共同來源機率、AD 歸因門檻、傳播方向或最初污染入口。"
  },
  "sources": [
    {
      "id": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
      "title": "ECDC／EFSA：巧克力相關單相Salmonella Typhimurium ST34跨國疫情快速評估（2022-04-12 corrected PDF）",
      "publisher": "ECDC／EFSA",
      "type": "同時期官方原始調查報告",
      "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf",
      "localPath": "sources/ecdc-efsa-2022-04-12-corrected.pdf",
      "sha256": "7b6ba1ef32adef27b3c365675b127166fc1116b98b8e5f281e4b3d270a14b15c",
      "publicationDate": "2022-04-12",
      "publicationDateBasis": "PDF首頁印刷日期",
      "version": "URL所示corrected版；更正發布日未從此PDF確認",
      "evidenceCutoffs": [
        {
          "date": "2022-04-08",
          "scope": "病例與訪談資料",
          "status": "reported"
        },
        {
          "date": "2022-04-08T14:30:00",
          "scope": "RASFF食品／追溯段落，原文未標時區",
          "status": "reported"
        }
      ],
      "analysisCutoffCaution": "Fig.2確切分析完成日未報；不能把整份報告的4/8截止自動填成每一分析的日期。",
      "doi": "10.2903/sp.efsa.2022.EN-7318",
      "reuse": "原始PDF／第9頁未改動來源頁可作輔助；本資料不改造原圖或重建矩陣。"
    },
    {
      "id": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
      "title": "Laisnez等：Key role of whole genome sequencing in resolving an international outbreak of monophasic Salmonella Typhimurium linked to chocolate products",
      "publisher": "BMC Infectious Diseases",
      "type": "原始事件調查的回顧性研究",
      "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/",
      "doi": "10.1186/s12879-025-10629-8",
      "localPath": "sources/laisnez-2025-chocolate-wgs.xml",
      "sha256": "13d979e8de99badb7a91484fdf672c8089629593b5925e61a4b69a3c21d755dd",
      "publicationDate": "2025-02-20",
      "publicationDateBasis": "XML article-meta/pub-date[@pub-type=\"epub\"]",
      "version": "PMCID PMC11844163.1；版權欄寫corrected publication 2025，未自行推定其修正了病例數",
      "eventPeriod": "主要回顧2021年12月至2022年事件；發表日不是發現日",
      "evidenceCutoffs": [
        {
          "date": "2022-07-15",
          "scope": "Par34病例敘事總數",
          "status": "reported"
        },
        {
          "date": "2024-04-10",
          "scope": "Fig.2 EnteroBase可用分離株集合",
          "status": "reported"
        }
      ],
      "xmlUrl": "https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11844163/fullTextXML",
      "license": "CC BY-NC-ND 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
      "figurePolicy": "2025原圖僅提供來源連結，不改造、不逐點擷取重建、不另生成其樹圖。",
      "evidenceCutoffCaution": "訪談、英國病例對照及第二群確認的精確截止／確認日期未明；不能填成發表日或全篇病例統計截止。"
    },
    {
      "id": "micro-outbreak-source-ntu115-q2-2",
      "title": "國立臺灣大學115學年度碩士班招生考試：食品微生物學，第2題第2小題",
      "publisher": "國立臺灣大學圖書館／招生試題",
      "type": "官方試題定位，非官方答案",
      "url": "https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-241.pdf",
      "localPath": "sources/ntu-115-241.pdf",
      "sha256": "d3ad12a25c0115a817ec742bb648635337db8657cb0d98fc66e7d9190f969d8c",
      "publicationDate": null,
      "publicationDateBasis": "此次未核確切上線日；115為學年度",
      "locator": "PDF第1頁，第2題第2小題：菌株分子／基因體比對、跨國疫情溯源及培養法的角色限制。",
      "boundary": "新增專用sourceId；保留現有僅定位Q1／Q7.2的官方source物件，不覆寫。第2題第1小題PCR/qPCR方法內容由另一條線補。"
    },
    {
      "id": "outbreak-method-cdc-investigation",
      "title": "CDC：Multistate Foodborne Outbreaks — Investigation Steps",
      "url": "https://www.cdc.gov/foodborne-outbreaks/outbreak-basics/investigation-steps.html",
      "publisher": "CDC；2025-11-21；第 1、5 步：群聚、三類調查證據與陰性檢驗界線"
    },
    {
      "id": "outbreak-method-cdc-cidt",
      "title": "CDC FoodNet：Foodborne Illness and Culture-Independent Diagnostic Tests",
      "url": "https://www.cdc.gov/foodnet/reports/cidt.html",
      "publisher": "CDC；2024-09-10；CIDT 與分離株在常規監測的互補；原語境是病人樣本"
    },
    {
      "id": "outbreak-method-pulsenet-2017",
      "title": "Nadon 等：PulseNet International WGS 方法綱領",
      "url": "https://doi.org/10.2807/1560-7917.ES.2017.22.23.30544",
      "publisher": "Eurosurveillance 2017；pp.3–4；WGS、逐基因方法、core loci 與 allele 定義"
    },
    {
      "id": "outbreak-method-ecdc-eqa2024",
      "title": "ECDC：Fourteenth EQA for Salmonella typing, 2024",
      "url": "https://www.ecdc.europa.eu/sites/default/files/documents/salmonella-external-quality-assessment-2024.pdf",
      "publisher": "Annex 11，印刷 p.52／PDF p.57；參與實驗室方法與註記，不是通用 cut-off 政策"
    },
    {
      "id": "outbreak-method-miqe2025",
      "title": "MIQE 2.0：qPCR 量測與報告界線",
      "url": "https://doi.org/10.1093/clinchem/hvaf043",
      "publisher": "Bustin 等，Clinical Chemistry 2025；作者公開 PDF pp.7、10；效率、校準與中間 Cq 值"
    },
    {
      "id": "outbreak-method-nocker2006",
      "title": "Nocker 等：DNA 訊號與活／死來源的區別",
      "url": "https://pubmed.ncbi.nlm.nih.gov/16753236/",
      "publisher": "Journal of Microbiological Methods 2006，doi:10.1016/j.mimet.2006.04.015；本輪只取原研究摘要"
    }
  ],
  "methods": [
    {
      "id": "culture",
      "label": "培養與分離株確認",
      "can": "取得可供身分確認與後續定序的分離株；支持該樣份在指定方法下存在可培養目標。",
      "cannot": "菌落外觀或同種名稱不能給出高解析度菌株關係、共同來源或傳播方向；未檢出不等於整批為零。",
      "sourceRefs": [
        "outbreak-method-cdc-cidt",
        "outbreak-method-cdc-investigation"
      ]
    },
    {
      "id": "pcr",
      "label": "PCR｜目標核酸",
      "can": "在控制及方法條件成立時，較快檢查指定目標核酸是否檢出。",
      "cannot": "同一目標陽性不等於全基因體相同，也不直接表示活菌量、感染性或共同來源。",
      "sourceRefs": [
        "outbreak-method-cdc-cidt",
        "outbreak-method-nocker2006"
      ]
    },
    {
      "id": "qpcr",
      "label": "qPCR｜即時訊號與條件化定量",
      "can": "追蹤 PCR 螢光訊號；可作目標檢出，並在校準、效率及適用範圍成立時估計目標核酸量。",
      "cannot": "Cq 不能直接當作 CFU 或全部活菌量；本事件未提供 Cq、效率或標準曲線供計算。",
      "sourceRefs": [
        "outbreak-method-miqe2025",
        "outbreak-method-nocker2006"
      ]
    },
    {
      "id": "wgs",
      "label": "WGS｜廣泛基因體比較",
      "can": "取得廣泛基因體序列資訊，配合可追溯分離株與分析品質，作高解析度菌株比較。",
      "cannot": "定序不自行提供共同來源機率、最初污染入口或傳播方向；相似結果需整合流調及追溯。",
      "sourceRefs": [
        "outbreak-method-pulsenet-2017",
        "outbreak-method-cdc-investigation"
      ]
    },
    {
      "id": "cgmlst",
      "label": "cgMLST｜核心位點的 allele 差異",
      "can": "依指定 scheme 比較 core loci 的 allele profile，描述該分析範圍的差異。",
      "cannot": "AD 不是 SNP 數、突變次數或演化時間；0 AD 不等於全基因體完全相同，沒有通用共同來源門檻。",
      "sourceRefs": [
        "outbreak-method-pulsenet-2017",
        "outbreak-method-ecdc-eqa2024"
      ]
    }
  ],
  "bundles": [
    {
      "id": "ecdc-2022-apr-report",
      "label": "2022年4月官方報告",
      "publicationDate": "2022-04-12",
      "asOf": "病例／訪談截至2022-04-08；RASFF截至4/8 14:30；圖2精確分析日未報",
      "scope": "只使用 2022-04-12 更正版官方報告中的資訊；圖 2 為 33 株分離株的該次分析。",
      "evidence": [
        {
          "id": "e22-genomic",
          "bundleId": "ecdc-2022-apr-report",
          "label": "基因群關聯",
          "kind": "genomic",
          "summary": "官方Fig.2分析含24株人類與9株非人分離株；第一群含全部這24株人類株及4株Plant B非人株，另一群只含5株非人株，刊載群間差異為62 AD。",
          "sourceRefs": [
            {
              "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
              "locator": "PDF p.9｜European whole genome sequencing analysis of human and non-human isolates｜Figure 2及前四段",
              "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=9"
            },
            {
              "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
              "locator": "PDF p.5｜Belgium｜九株送驗及採樣／基質資訊缺口段",
              "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=5"
            }
          ],
          "supports": [
            "這個分析集合的人類株與部分Plant B非人株有基因群聚關聯。",
            "可將工廠樣本與病例調查連結，和其他證據共同檢查共同場所假說。"
          ],
          "limits": [
            "基因群聚關聯仍不能單獨確認共同來源或傳播方向。",
            "當時圖中第二群無人類株，不等於現實不存在相關病例。",
            "33 是分離株數，不是全部疫情病例數；62 AD 不是歸因門檻。",
            "不能單獨確認每位患者吃過哪批產品或最初污染入口。",
            "資料缺口：九株的精確採樣日期與逐株樣本基質在p.5未報至RASFF。",
            "資料缺口：未取得完整矩陣及病例—產品逐一映射。"
          ],
          "selectable": true,
          "publicationDate": "2022-04-12",
          "evidenceCutoff": {
            "date": null,
            "scope": "Fig.2分析集合的精確封存／運算日",
            "status": "not-reported",
            "availableBySourcePublication": "2022-04-12"
          },
          "eventTime": null,
          "analysisId": "a22-efsa-fig2-33",
          "unit": "分離株／AD",
          "numbers": {
            "humanIsolates": 24,
            "nonhumanIsolates": 9,
            "totalIsolates": 33,
            "cluster1Nonhuman": 4,
            "cluster2Nonhuman": 5,
            "reportedInterclusterAD": 62
          },
          "provenance": {
            "id": "e22-genomic",
            "bundleId": "ecdc-2022-apr-report",
            "lane": "genomic",
            "analysisId": "a22-efsa-fig2-33",
            "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
            "publicationDate": "2022-04-12",
            "evidenceCutoff": {
              "date": null,
              "scope": "Fig.2分析集合的精確封存／運算日",
              "status": "not-reported",
              "availableBySourcePublication": "2022-04-12"
            },
            "eventTime": null,
            "locators": [
              {
                "format": "pdf",
                "pageOneBased": 9,
                "section": "European whole genome sequencing analysis of human and non-human isolates",
                "detail": "Figure 2及前四段",
                "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=9"
              },
              {
                "format": "pdf",
                "pageOneBased": 5,
                "section": "Belgium",
                "detail": "九株送驗及採樣／基質資訊缺口段",
                "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=5"
              }
            ],
            "unit": "分離株／AD",
            "title": "人類株與工廠株出現在同一基因群",
            "fact": "官方Fig.2分析含24株人類與9株非人分離株；第一群含全部這24株人類株及4株Plant B非人株，另一群只含5株非人株，刊載群間差異為62 AD。",
            "supports": [
              "這個分析集合的人類株與部分Plant B非人株有基因群聚關聯。",
              "可將工廠樣本與病例調查連結，和其他證據共同檢查共同場所假說。"
            ],
            "cannotInfer": [
              "當時圖中第二群無人類株，不等於已證明現實不存在相關病例。",
              "不能單獨確認每位患者吃過哪批產品、傳播方向或污染入口。",
              "33是分離株數，不是全部疫情病例數。"
            ],
            "unknown": [
              "九株的精確採样日期與逐株樣本基質在p.5未報至RASFF。",
              "未取得完整矩陣及病例—產品逐一映射。"
            ],
            "numbers": {
              "humanIsolates": 24,
              "nonhumanIsolates": 9,
              "totalIsolates": 33,
              "cluster1Nonhuman": 4,
              "cluster2Nonhuman": 5,
              "reportedInterclusterAD": 62
            },
            "selectedEvidenceMeaning": "在此來源版本的練習中選入這張卡；未選不表示真實調查沒有此證據。"
          }
        },
        {
          "id": "e22-exposure",
          "bundleId": "ecdc-2022-apr-report",
          "label": "病例暴露",
          "kind": "epidemiology",
          "summary": "截至2022-04-08，10國101位已訪談病例中，88位報告食用Brand A的不同巧克力產品；原文報87.1%。",
          "sourceRefs": [
            {
              "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
              "locator": "PDF p.4｜Information from patient interviews｜第二段88/101",
              "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=4"
            }
          ],
          "supports": [
            "Brand A產品是值得追查的共同暴露線索。",
            "與基因資料及產品鏈一起判斷可能載體。"
          ],
          "limits": [
            "88/101 是已訪談病例的自述暴露比例，不是污染率或發病率。",
            "訪談摘要沒有未發病比較組，不能單獨計算風險比或勝算比。",
            "不能說全部已報病例都有此暴露。",
            "資料缺口：未訪談與未獲資訊者的暴露未知。",
            "資料缺口：自述暴露與具體批次／供應時間的逐人連結未公開。"
          ],
          "selectable": true,
          "publicationDate": "2022-04-12",
          "evidenceCutoff": {
            "date": "2022-04-08",
            "scope": "101位已訪談病例",
            "status": "reported"
          },
          "eventTime": null,
          "analysisId": "a22-interviews",
          "unit": "已訪談病例／自述產品暴露",
          "numbers": {
            "reportedExposedInterviewedCases": 88,
            "interviewedCases": 101,
            "reportedPercent": 87.1,
            "countriesInInterviewSummary": 10
          },
          "provenance": {
            "id": "e22-exposure",
            "bundleId": "ecdc-2022-apr-report",
            "lane": "epidemiology",
            "analysisId": "a22-interviews",
            "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
            "publicationDate": "2022-04-12",
            "evidenceCutoff": {
              "date": "2022-04-08",
              "scope": "101位已訪談病例",
              "status": "reported"
            },
            "eventTime": null,
            "locators": [
              {
                "format": "pdf",
                "pageOneBased": 4,
                "section": "Information from patient interviews",
                "detail": "第二段88/101",
                "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=4"
              }
            ],
            "unit": "已訪談病例／自述產品暴露",
            "title": "多數已訪談病例報告同品牌暴露",
            "fact": "截至2022-04-08，10國101位已訪談病例中，88位報告食用Brand A的不同巧克力產品；原文報87.1%。",
            "supports": [
              "Brand A產品是值得追查的共同暴露線索。",
              "與基因資料及產品鏈一起判斷可能載體。"
            ],
            "cannotInfer": [
              "88/101不是食用者發病率、產品污染率或可歸因比例。",
              "這份訪談摘要沒有未發病比較組，不能單獨計算風險比或勝算比。",
              "不能說全部已報病例都有此暴露。"
            ],
            "unknown": [
              "未訪談與未獲資訊者的暴露未知。",
              "自述暴露與具體批次／供應時間的逐人連結未公開。"
            ],
            "numbers": {
              "reportedExposedInterviewedCases": 88,
              "interviewedCases": 101,
              "reportedPercent": 87.1,
              "countriesInInterviewSummary": 10
            },
            "selectedEvidenceMeaning": "在此來源版本的練習中選入這張卡；未選不表示真實調查沒有此證據。"
          }
        },
        {
          "id": "e22-traceback",
          "bundleId": "ecdc-2022-apr-report",
          "label": "產品追溯",
          "kind": "traceback",
          "summary": "報告指出，英國市場的Product A由Plant B生產；病例提及的Product B也來自該廠。這是有市場與產品範圍的追溯關係。",
          "sourceRefs": [
            {
              "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
              "locator": "PDF p.4｜Microbiological and environmental investigations of food and control measures｜RASFF範圍",
              "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=4"
            },
            {
              "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
              "locator": "PDF p.10｜ECDC and EFSA risk assessment for the EU/EEA｜第二段Product A/B與Plant B",
              "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=10"
            }
          ],
          "supports": [
            "提供病例產品暴露與特定生產場所之間的供應鏈連結。",
            "與人類／工廠株基因關聯共同支持Plant B假說。"
          ],
          "limits": [
            "不能由此推定 Brand A 所有產品、所有國家都只來自這一家工廠。",
            "不能由此確認相關原料供應商是最初引入源。",
            "不能由此確定每一病例的產品批號、食用日或感染途徑。",
            "資料缺口：個別病例到特定批次的完整鏈未在這段提供。",
            "資料缺口：共用原料、其他工廠及最初引入途徑仍有待查部分。"
          ],
          "selectable": true,
          "publicationDate": "2022-04-12",
          "evidenceCutoff": {
            "date": "2022-04-08T14:30:00",
            "scope": "RASFF段落資料截止；原文未標時區",
            "status": "reported"
          },
          "eventTime": null,
          "analysisId": "a22-traceability",
          "unit": "產品—市場—製造場所關係",
          "numbers": {},
          "provenance": {
            "id": "e22-traceback",
            "bundleId": "ecdc-2022-apr-report",
            "lane": "traceback",
            "analysisId": "a22-traceability",
            "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
            "publicationDate": "2022-04-12",
            "evidenceCutoff": {
              "date": "2022-04-08T14:30:00",
              "scope": "RASFF段落資料截止；原文未標時區",
              "status": "reported"
            },
            "eventTime": null,
            "locators": [
              {
                "format": "pdf",
                "pageOneBased": 4,
                "section": "Microbiological and environmental investigations of food and control measures",
                "detail": "RASFF範圍",
                "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=4"
              },
              {
                "format": "pdf",
                "pageOneBased": 10,
                "section": "ECDC and EFSA risk assessment for the EU/EEA",
                "detail": "第二段Product A/B與Plant B",
                "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=10"
              }
            ],
            "unit": "產品—市場—製造場所關係",
            "title": "產品資訊把暴露線索連到Plant B",
            "fact": "報告指出，英國市場的Product A由Plant B生產；病例提及的Product B也來自該廠。這是有市場與產品範圍的追溯關係。",
            "supports": [
              "提供病例產品暴露與特定生產場所之間的供應鏈連結。",
              "與人類／工廠株基因關聯共同支持Plant B假說。"
            ],
            "cannotInfer": [
              "Brand A所有產品、所有國家都只來自這一家工廠。",
              "任何相關原料供應商已被確認為最初引入源。",
              "每一病例的產品批號、食用日或感染途徑已確定。"
            ],
            "unknown": [
              "個別病例到特定批次的完整鏈未在這段提供。",
              "共用原料、其他工廠及最初引入途徑仍有待查部分。"
            ],
            "numbers": {},
            "selectedEvidenceMeaning": "在此來源版本的練習中選入這張卡；未選不表示真實調查沒有此證據。"
          }
        },
        {
          "id": "e22-timing",
          "bundleId": "ecdc-2022-apr-report",
          "label": "時間是否相容",
          "kind": "timing",
          "summary": "報告最早已知英國病例採樣日為2021-12-21；工廠自檢於2021-12-15記錄陽性。作者以製造至零售約60日指出：若Plant B為唯一來源，污染可能更早，不能只以12月檢出事件解釋全部早期病例。",
          "sourceRefs": [
            {
              "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
              "locator": "PDF p.3｜Epidemiological and microbiological investigations of human cases｜第二段最早採樣／報告日",
              "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=3"
            },
            {
              "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
              "locator": "PDF p.10｜ECDC and EFSA risk assessment for the EU/EEA｜第三段約60日與較早污染的條件推論",
              "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=10"
            }
          ],
          "supports": [
            "用有種類的日期與供應時間檢查來源敘事是否相容。",
            "即使場所假說受到支持，仍應保留污染開始時間未知。"
          ],
          "limits": [
            "最早已知採樣日或工廠陽性檢出日，不是最初污染日。",
            "2021-12-21 是採樣日，不能改稱最早發病日。",
            "約 60 日不能倒推每個病例的精確生產日。",
            "時間相容性不能單獨證明 Plant B 為唯一來源。",
            "資料缺口：最初污染日、每批實際生產到食用歷程未知。",
            "資料缺口：約60日是平均／概略供應時間，不是全部產品固定時間。"
          ],
          "selectable": true,
          "publicationDate": "2022-04-12",
          "evidenceCutoff": {
            "date": "2022-04-08",
            "scope": "報告已知病例資料；污染開始日未知",
            "status": "reported"
          },
          "eventTime": null,
          "analysisId": "a22-temporal-assessment",
          "unit": "具事件種類的日期／約略供應時間",
          "numbers": {
            "earliestReportedSamplingDate": "2021-12-21",
            "plantPositiveRecordedDate": "2021-12-15",
            "approximateProductionToRetailDays": 60
          },
          "provenance": {
            "id": "e22-timing",
            "bundleId": "ecdc-2022-apr-report",
            "lane": "timing",
            "analysisId": "a22-temporal-assessment",
            "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
            "publicationDate": "2022-04-12",
            "evidenceCutoff": {
              "date": "2022-04-08",
              "scope": "報告已知病例資料；污染開始日未知",
              "status": "reported"
            },
            "eventTime": null,
            "locators": [
              {
                "format": "pdf",
                "pageOneBased": 3,
                "section": "Epidemiological and microbiological investigations of human cases",
                "detail": "第二段最早採樣／報告日",
                "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=3"
              },
              {
                "format": "pdf",
                "pageOneBased": 10,
                "section": "ECDC and EFSA risk assessment for the EU/EEA",
                "detail": "第三段約60日與較早污染的條件推論",
                "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=10"
              }
            ],
            "unit": "具事件種類的日期／約略供應時間",
            "title": "首次檢出日不能直接當污染開始日",
            "fact": "報告最早已知英國病例採樣日為2021-12-21；工廠自檢於2021-12-15記錄陽性。作者以製造至零售約60日指出：若Plant B為唯一來源，污染可能更早，不能只以12月檢出事件解釋全部早期病例。",
            "supports": [
              "用有種類的日期與供應時間檢查來源敘事是否相容。",
              "即使場所假說受到支持，仍應保留污染開始時間未知。"
            ],
            "cannotInfer": [
              "2021-12-21是最早發病日或最初污染日。",
              "60日可倒推每個病例的精確生產日。",
              "時間相容性單獨證明Plant B為唯一來源。"
            ],
            "unknown": [
              "最初污染日、每批實際生產到食用歷程未知。",
              "約60日是平均／概略供應時間，不是全部產品固定時間。"
            ],
            "numbers": {
              "earliestReportedSamplingDate": "2021-12-21",
              "plantPositiveRecordedDate": "2021-12-15",
              "approximateProductionToRetailDays": 60
            },
            "selectedEvidenceMeaning": "在此來源版本的練習中選入這張卡；未選不表示真實調查沒有此證據。"
          }
        }
      ],
      "contextCards": [],
      "analysisContext": [],
      "limitations": [
        "最初污染入口、精確污染開始時間及傳播方向仍不能確定。",
        "未納入只表示本次練習未選取，不是真實調查缺乏證據，也不是反證。",
        "基因相似、產品關聯與追溯須合併判讀；不由單一卡片判定共同來源。",
        "未取得完整病例線表、逐株 allele profile 或成對距離矩陣。",
        "2022 的 33 株／62 AD 與回顧文的 415 株／56 AD 屬不同分析；不能合併或解讀成距離隨時間縮小。",
        "2022 報告未將九株非人株的精確採樣日與逐株基質報至 RASFF；不以回顧文偷偷回填。"
      ],
      "inconsistencies": [],
      "issueSourceRefs": [],
      "maximumConclusion": "多路證據支持Plant B為可能共同生產場所；最初引入、時間及方向仍未知。"
    },
    {
      "id": "laisnez-2025-retrospective",
      "label": "2025回顧，分開看事件與分析日期",
      "publicationDate": "2025-02-20",
      "asOf": "回顧2022事件；圖2資料截至2024-04-10；英國分析與第二群確認精確截止未報",
      "scope": "回顧 2022 事件；分開保留發表日、事件日與 2024-04-10 圖 2 資料截止日。2025 文中來源背景固定顯示。",
      "evidence": [
        {
          "id": "e25-second-cluster",
          "bundleId": "laisnez-2025-retrospective",
          "label": "第二病例群",
          "kind": "genomic",
          "summary": "回顧文記述2022-04-01辨識初始病例群與4株企業自檢非人株的匹配；另一個病例群與另外5株非人株密切相關，兩組非人株來自同一比利時廠、同一時期。第二群的精確確認日未列。",
          "sourceRefs": [
            {
              "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
              "locator": "//p[@id='Par39']｜Results / Epidemiological and microbiological investigations",
              "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
            },
            {
              "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
              "locator": "//p[@id='Par50']｜Discussion",
              "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
            }
          ],
          "supports": [
            "兩個基因群可在此事件中都與同一生產場所相關。",
            "不同病例群與食品／環境株的比較，可補強同廠來源假說。"
          ],
          "limits": [
            "兩個基因群不必然對應兩間工廠；基因匹配仍不能單獨確定最初污染入口。",
            "2025 是此回顧文的發表年，不能改稱到 2025 才發現第二病例群。",
            "基因匹配不能單獨確定所有病例的產品批次或傳播方向。",
            "資料缺口：第二群辨識的精確日期及逐個體樣本對應未列。",
            "資料缺口：仍未取得完整病例線表或成對基因矩陣。"
          ],
          "selectable": true,
          "publicationDate": "2025-02-20",
          "evidenceCutoff": {
            "date": null,
            "scope": "第二群被確認的精確日／本敘事資料封存日",
            "status": "not-reported"
          },
          "eventTime": {
            "initialMatchDate": "2022-04-01",
            "secondClusterExactDate": null,
            "scope": "Par39的2022調查敘事，不是2025年才發現"
          },
          "analysisId": "a25-retrospective-cluster-link",
          "unit": "人類與非人分離株群的關聯",
          "numbers": {
            "firstMatchRecognizedDate": "2022-04-01",
            "firstClusterNonhumanIsolates": 4,
            "secondClusterNonhumanIsolates": 5
          },
          "provenance": {
            "id": "e25-second-cluster",
            "bundleId": "laisnez-2025-retrospective",
            "lane": "genomic",
            "analysisId": "a25-retrospective-cluster-link",
            "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
            "publicationDate": "2025-02-20",
            "evidenceCutoff": {
              "date": null,
              "scope": "第二群被確認的精確日／本敘事資料封存日",
              "status": "not-reported"
            },
            "eventTime": {
              "initialMatchDate": "2022-04-01",
              "secondClusterExactDate": null,
              "scope": "Par39的2022調查敘事，不是2025年才發現"
            },
            "locators": [
              {
                "format": "xml",
                "xpath": "//p[@id='Par39']",
                "section": "Results / Epidemiological and microbiological investigations",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
              },
              {
                "format": "xml",
                "xpath": "//p[@id='Par50']",
                "section": "Discussion",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
              }
            ],
            "unit": "人類與非人分離株群的關聯",
            "title": "後續回顧把第二病例群連回同廠",
            "fact": "回顧文記述2022-04-01辨識初始病例群與4株企業自檢非人株的匹配；另一个病例群與另外5株非人株密切相關，兩組非人株來自同一比利時廠、同一時期。第二群的精確確認日未列。",
            "supports": [
              "兩個基因群可在此事件中都與同一生產場所相關。",
              "不同病例群與食品／環境株的比較，可補強同廠來源假說。"
            ],
            "cannotInfer": [
              "因為有兩個群就必定是兩間工廠。",
              "此發現到2025才首次發生。",
              "基因匹配單獨確定所有病例的產品批次、方向或最初污染入口。"
            ],
            "unknown": [
              "第二群辨識的精確日期及逐個體樣本對應未列。",
              "仍未取得完整病例線表或成對基因矩陣。"
            ],
            "numbers": {
              "firstMatchRecognizedDate": "2022-04-01",
              "firstClusterNonhumanIsolates": 4,
              "secondClusterNonhumanIsolates": 5
            },
            "selectedEvidenceMeaning": "在此來源版本的練習中選入這張卡；未選不表示真實調查沒有此證據。"
          }
        },
        {
          "id": "e25-case-control",
          "bundleId": "laisnez-2025-retrospective",
          "label": "病例對照",
          "kind": "epidemiology",
          "summary": "英國病例對照研究報告，Brand A巧克力蛋攝取與疾病的調整勝算比為55.0，95%信賴區間9.9–306.4。文章說明對照招募、年齡／性別頻率匹配及多變項分析；未提供完整交叉表。",
          "sourceRefs": [
            {
              "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
              "locator": "//p[@id='Par31']｜Methods / Epidemiological and microbiological investigations",
              "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
            },
            {
              "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
              "locator": "//p[@id='Par37']｜Results / Epidemiological and microbiological investigations",
              "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
            },
            {
              "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
              "locator": "//ref[@id='CR22']｜Reference 22",
              "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
            }
          ],
          "supports": [
            "提供有比較組、作部分調整的特定產品關聯證據。",
            "與描述性、基因及追溯資訊共同支持調查中的產品／場所假說。"
          ],
          "limits": [
            "aOR 55.0 不是食用後發病機率增加 55 倍。",
            "aOR 不能當作絕對風險、污染率或感染劑量。",
            "此數值不能排除全部偏差，也不能確定工廠最初污染點。",
            "資料缺口：本篇未列病例／對照n、完整模型係數與交叉表。",
            "資料缺口：精確招募／截止日期與文中提及的敏感性分析數值未知。"
          ],
          "selectable": true,
          "publicationDate": "2025-02-20",
          "evidenceCutoff": {
            "date": null,
            "scope": "英國分析的精確招募／資料截止日",
            "status": "not-reported"
          },
          "eventTime": {
            "year": 2022,
            "basis": "CR22為ESCAIDE 2022事件研究摘要；精確分析完成日未知"
          },
          "analysisId": "a25-uk-case-control",
          "unit": "調整勝算比aOR及95%信賴區間，無因次",
          "numbers": {
            "adjustedOddsRatio": 55,
            "confidenceLevel": 0.95,
            "confidenceIntervalLower": 9.9,
            "confidenceIntervalUpper": 306.4
          },
          "provenance": {
            "id": "e25-case-control",
            "bundleId": "laisnez-2025-retrospective",
            "lane": "epidemiology",
            "analysisId": "a25-uk-case-control",
            "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
            "publicationDate": "2025-02-20",
            "evidenceCutoff": {
              "date": null,
              "scope": "英國分析的精確招募／資料截止日",
              "status": "not-reported"
            },
            "eventTime": {
              "year": 2022,
              "basis": "CR22為ESCAIDE 2022事件研究摘要；精確分析完成日未知"
            },
            "locators": [
              {
                "format": "xml",
                "xpath": "//p[@id='Par31']",
                "section": "Methods / Epidemiological and microbiological investigations",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
              },
              {
                "format": "xml",
                "xpath": "//p[@id='Par37']",
                "section": "Results / Epidemiological and microbiological investigations",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
              },
              {
                "format": "xml",
                "xpath": "//ref[@id='CR22']",
                "section": "Reference 22",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
              }
            ],
            "unit": "調整勝算比aOR及95%信賴區間，無因次",
            "title": "有比較組的分析提供另一層關聯證據",
            "fact": "英國病例對照研究報告，Brand A巧克力蛋攝取與疾病的調整勝算比為55.0，95%信賴區間9.9–306.4。文章說明對照招募、年齡／性別頻率匹配及多變項分析；未提供完整交叉表。",
            "supports": [
              "提供有比較組、作部分調整的特定產品關聯證據。",
              "與描述性、基因及追溯資訊共同支持調查中的產品／場所假說。"
            ],
            "cannotInfer": [
              "食用後發病機率必定增加55倍。",
              "aOR可當絕對風險、污染率或感染劑量。",
              "已排除全部偏差或單凭數值確定工廠最初污染點。"
            ],
            "unknown": [
              "本篇未列病例／對照n、完整模型係數與交叉表。",
              "精確招募／截止日期與文中提及的敏感性分析數值未知。"
            ],
            "numbers": {
              "adjustedOddsRatio": 55,
              "confidenceLevel": 0.95,
              "confidenceIntervalLower": 9.9,
              "confidenceIntervalUpper": 306.4
            },
            "selectedEvidenceMeaning": "在此來源版本的練習中選入這張卡；未選不表示真實調查沒有此證據。"
          }
        }
      ],
      "contextCards": [
        {
          "id": "ctx25-traceback",
          "bundleId": "laisnez-2025-retrospective",
          "label": "同一工廠的來源背景",
          "kind": "traceback",
          "summary": "此版本文中已明載：4株與另5株非人株來自同一比利時工廠、同一時期；作者把基因關聯與流調／追溯共同解讀。",
          "sourceRefs": [
            {
              "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
              "locator": "//p[@id='Par39']｜Results",
              "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
            },
            {
              "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
              "locator": "//p[@id='Par50']｜Discussion",
              "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
            }
          ],
          "supports": [
            "本版本確有同廠來源背景，不是從2022卡片搬入。"
          ],
          "limits": [
            "同廠來源背景不能單獨證明最初引入點。",
            "沒有選取可選卡，不代表這段既有調查歷史不存在。",
            "資料缺口：每位患者到哪個批次的完整鏈仍未知。"
          ],
          "selectable": false,
          "publicationDate": "2025-02-20",
          "evidenceCutoff": {
            "date": null,
            "scope": "第二群被確認的精確日／本敘事資料封存日",
            "status": "not-reported"
          },
          "eventTime": null,
          "analysisId": "a25-retrospective-cluster-link",
          "unit": "樣本來源與工廠關係",
          "numbers": {},
          "provenance": {
            "id": "ctx25-traceback",
            "bundleId": "laisnez-2025-retrospective",
            "lane": "traceback",
            "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
            "publicationDate": "2025-02-20",
            "analysisId": "a25-retrospective-cluster-link",
            "evidenceCutoff": {
              "date": null,
              "scope": "第二群被確認的精確日／本敘事資料封存日",
              "status": "not-reported"
            },
            "locators": [
              {
                "format": "xml",
                "xpath": "//p[@id='Par39']",
                "section": "Results",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
              },
              {
                "format": "xml",
                "xpath": "//p[@id='Par50']",
                "section": "Discussion",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
              }
            ],
            "unit": "樣本來源與工廠關係",
            "fact": "此版本文中已明載：4株與另5株非人株來自同一比利時工廠、同一時期；作者把基因關聯與流調／追溯共同解讀。",
            "supports": [
              "本版本確有同廠來源背景，不是從2022卡片搬入。"
            ],
            "cannotInfer": [
              "沒有選取可選卡不代表這段既有調查歷史不存在。",
              "不能把同廠來源資料單獨當作最初引入點證明。"
            ],
            "unknown": [
              "每位患者到哪個批次的完整鏈仍未知。"
            ],
            "presentation": "always-visible-source-context",
            "selectable": false,
            "countsAsSelectedCard": false
          }
        },
        {
          "id": "ctx25-timing",
          "bundleId": "laisnez-2025-retrospective",
          "label": "發病日與供應時間",
          "kind": "timing",
          "summary": "回顧文最早發病日為2021-12-12；Discussion用平均約60日的製造至零售間隔提出污染可能早於12月的推論。最初污染日仍未被直接觀測。",
          "sourceRefs": [
            {
              "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
              "locator": "//p[@id='Par35']｜Results",
              "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
            },
            {
              "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
              "locator": "//p[@id='Par51']｜Discussion",
              "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
            }
          ],
          "supports": [
            "可檢查日期種類與時間相容性，保留較早污染可能。"
          ],
          "limits": [
            "最早發病日不能改作最初污染日；約 60 日不能精確倒推。",
            "2021-12-12 發病日與 2022 報告的 12/21 採樣日不能互換。",
            "論文發表日不是調查發現日。",
            "資料缺口：精確污染開始、個別產品時間鏈未知。"
          ],
          "selectable": false,
          "publicationDate": "2025-02-20",
          "evidenceCutoff": {
            "date": null,
            "scope": "時間相容性推論的精確分析日",
            "status": "not-reported"
          },
          "eventTime": null,
          "analysisId": "a25-retrospective-timing",
          "unit": "發病日與約略供應時間",
          "numbers": {},
          "provenance": {
            "id": "ctx25-timing",
            "bundleId": "laisnez-2025-retrospective",
            "lane": "timing",
            "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
            "publicationDate": "2025-02-20",
            "analysisId": "a25-retrospective-timing",
            "evidenceCutoff": {
              "date": null,
              "scope": "時間相容性推論的精確分析日",
              "status": "not-reported"
            },
            "locators": [
              {
                "format": "xml",
                "xpath": "//p[@id='Par35']",
                "section": "Results",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
              },
              {
                "format": "xml",
                "xpath": "//p[@id='Par51']",
                "section": "Discussion",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
              }
            ],
            "unit": "發病日與約略供應時間",
            "fact": "回顧文最早發病日為2021-12-12；Discussion用平均約60日的製造至零售間隔提出污染可能早於12月的推論。最初污染日仍未被直接觀測。",
            "supports": [
              "可檢查日期種類與時間相容性，保留較早污染可能。"
            ],
            "cannotInfer": [
              "這個發病日與2022報告的12/21採樣日可互換。",
              "論文發表日就是調查發現日。"
            ],
            "unknown": [
              "精確污染開始、個別產品時間鏈未知。"
            ],
            "presentation": "always-visible-source-context",
            "selectable": false,
            "countsAsSelectedCard": false
          }
        }
      ],
      "analysisContext": [
        {
          "id": "a25-enterobase-fig2-415",
          "label": "圖 2 的獨立分析範圍",
          "summary": "2025 回顧文圖 2 納入截至 2024-04-10 在 EnteroBase 可用的 415 株分離株，刊載兩群間為 56 AD；這不是 415 位病例，也不是 2022 報告的 33 株／62 AD 分析。",
          "sourceRefs": [
            {
              "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
              "locator": "//p[@id='Par40']｜Results / Epidemiological and microbiological investigations",
              "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
            },
            {
              "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
              "locator": "//fig[@id='Fig2']/caption/p｜Figure 2 caption",
              "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
            }
          ],
          "limits": [
            "415不是病例數，也未證明全為人類分離株。",
            "56 AD不是通用歸因門檻；不能換成56 SNP。",
            "不能與2022的62 AD畫成距離改善曲線或合併矩陣。",
            "不能把2024集合稱為2022決策時已取得的全部資料。"
          ],
          "analysisId": "a25-enterobase-fig2-415",
          "selectable": false,
          "countsAsSelectedCard": false,
          "provenance": {
            "id": "a25-enterobase-fig2-415",
            "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
            "analysisVersionId": "laisnez-2025-retrospective",
            "label": "回顧論文Fig.2資料集合",
            "publicationDate": "2025-02-20",
            "evidenceCutoff": {
              "date": "2024-04-10",
              "scope": "Fig.2 EnteroBase可用分離株",
              "status": "reported"
            },
            "unit": "分離株／AD",
            "isolateCount": 415,
            "reportedClusterDistance": {
              "value": 56,
              "unit": "AD"
            },
            "locators": [
              {
                "format": "xml",
                "xpath": "//p[@id='Par40']",
                "section": "Results / Epidemiological and microbiological investigations",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
              },
              {
                "format": "xml",
                "xpath": "//fig[@id='Fig2']/caption/p",
                "section": "Figure 2 caption",
                "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
              }
            ],
            "contextOnly": true,
            "notSelectableEvidenceCard": true,
            "cannotInfer": [
              "415不是病例數，也未證明全為人類分離株。",
              "56 AD不是通用歸因門檻；不能換成56 SNP。",
              "不能與2022的62 AD畫成距離改善曲線或合併矩陣。",
              "不能把2024集合稱為2022決策時已取得的全部資料。"
            ],
            "unknown": [
              "完整基因距離矩陣未取得",
              "與2022差異的各種來源未被逐項拆解",
              "XML Tab1本體只有graphic，未視讀其數值條件，不從HC5名稱猜cutoff"
            ]
          }
        }
      ],
      "limitations": [
        "最初污染入口、精確污染開始時間及傳播方向仍不能確定。",
        "未納入只表示本次練習未選取，不是真實調查缺乏證據，也不是反證。",
        "基因相似、產品關聯與追溯須合併判讀；不由單一卡片判定共同來源。",
        "未取得完整病例線表、逐株 allele profile 或成對距離矩陣。",
        "2022 的 33 株／62 AD 與回顧文的 415 株／56 AD 屬不同分析；不能合併或解讀成距離隨時間縮小。",
        "回顧文病例定義表的圖像未在本輪視讀，不從 HC5 代號猜測 cutoff。"
      ],
      "inconsistencies": [
        "來源未解差異（不是自動反證）：Par34 正文截至 2022-07-15 報 456 例；Table 2 的 2021-12 至 2022-06 兩群合計 390 + 62 = 452。差 4 的原因未交代，不能自行補成未分群或筆誤。",
        "來源未解差異（不是自動反證）：Par47 說 17 國、2021-12 至 2022-04；Table 2 有 18 國列、2021-12 至 2022-06。期間與分母不可偷偷統一。"
      ],
      "issueSourceRefs": [
        {
          "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
          "locator": "//p[@id='Par34']｜Results",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        },
        {
          "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
          "locator": "//table-wrap[@id='Tab2']｜Table 2",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        },
        {
          "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
          "locator": "//p[@id='Par47']｜Discussion",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        },
        {
          "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
          "locator": "//table-wrap[@id='Tab2']｜Table 2",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        }
      ],
      "maximumConclusion": "本事件兩病例群與同廠的關聯受到基因、產品關聯及追溯支持；仍不是最初污染入口、方向或逐人批次的確證。"
    }
  ],
  "analyses": [
    {
      "id": "a22-efsa-fig2-33",
      "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
      "analysisVersionId": "ecdc-2022-apr-report",
      "label": "2022官方Fig.2分析",
      "publicationDate": "2022-04-12",
      "evidenceCutoff": {
        "date": null,
        "scope": "Fig.2分析集合的精確封存／運算日",
        "status": "not-reported",
        "availableBySourcePublication": "2022-04-12"
      },
      "unit": "分離株／AD",
      "isolateCounts": {
        "human": 24,
        "nonhuman": 9,
        "total": 33,
        "totalOrigin": "24+9的整數相加；與圖說相符"
      },
      "reportedClusterDistance": {
        "value": 62,
        "unit": "AD",
        "kind": "刊載兩群間差異，不是SNP或完整成對矩陣"
      },
      "methodIdentity": "PDF p.9：EFSA cgMLST，chewBBACA 2.8.5、Rossi 2018 schema（3225 loci）、GrapeTree 1.5.0 MSTree V2；此處僅保留分析身分，沒有病原操作程序。",
      "locators": [
        {
          "format": "pdf",
          "pageOneBased": 9,
          "section": "European whole genome sequencing analysis of human and non-human isolates",
          "detail": "分析段與Figure 2",
          "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=9"
        }
      ],
      "cannotInfer": [
        "不是2025 Fig.2的同一分析集合。",
        "樹圖邊與紙面長度不是全部成對距離。",
        "不能由群聚直接得知感染方向或最初污染點。"
      ],
      "unknown": [
        "完整allele profile／成對矩陣未取得",
        "此集合的個體採樣日與所有樣本對應未完整列出"
      ]
    },
    {
      "id": "a22-interviews",
      "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
      "analysisVersionId": "ecdc-2022-apr-report",
      "label": "2022訪談摘要",
      "publicationDate": "2022-04-12",
      "evidenceCutoff": {
        "date": "2022-04-08",
        "scope": "101位已訪談病例",
        "status": "reported"
      },
      "unit": "已訪談病例／自述產品暴露",
      "locators": [
        {
          "format": "pdf",
          "pageOneBased": 4,
          "section": "Information from patient interviews",
          "detail": "第二段88/101",
          "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=4"
        }
      ]
    },
    {
      "id": "a22-traceability",
      "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
      "analysisVersionId": "ecdc-2022-apr-report",
      "label": "2022產品鏈調查摘要",
      "publicationDate": "2022-04-12",
      "evidenceCutoff": {
        "date": "2022-04-08T14:30:00",
        "scope": "RASFF段落資料截止；原文未標時區",
        "status": "reported"
      },
      "unit": "產品—市場—製造場所關係",
      "locators": [
        {
          "format": "pdf",
          "pageOneBased": 4,
          "section": "Microbiological and environmental investigations of food and control measures",
          "detail": "RASFF範圍",
          "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=4"
        },
        {
          "format": "pdf",
          "pageOneBased": 10,
          "section": "ECDC and EFSA risk assessment for the EU/EEA",
          "detail": "第二段Product A/B與Plant B",
          "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=10"
        }
      ]
    },
    {
      "id": "a22-temporal-assessment",
      "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
      "analysisVersionId": "ecdc-2022-apr-report",
      "label": "2022已知採樣／檢出與供應時間相容性",
      "publicationDate": "2022-04-12",
      "evidenceCutoff": {
        "date": "2022-04-08",
        "scope": "報告已知病例資料；污染開始日未知",
        "status": "reported"
      },
      "unit": "具事件種類的日期／約略供應時間",
      "locators": [
        {
          "format": "pdf",
          "pageOneBased": 3,
          "section": "Epidemiological and microbiological investigations of human cases",
          "detail": "第二段最早採樣／報告日",
          "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=3"
        },
        {
          "format": "pdf",
          "pageOneBased": 10,
          "section": "ECDC and EFSA risk assessment for the EU/EEA",
          "detail": "第三段約60日與較早污染的條件推論",
          "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=10"
        }
      ]
    },
    {
      "id": "a25-retrospective-cluster-link",
      "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
      "analysisVersionId": "laisnez-2025-retrospective",
      "label": "2025文中回顧2022年兩群比對與同廠關聯",
      "publicationDate": "2025-02-20",
      "evidenceCutoff": {
        "date": null,
        "scope": "第二群被確認的精確日／本敘事資料封存日",
        "status": "not-reported"
      },
      "eventTime": {
        "initialMatchDate": "2022-04-01",
        "secondClusterExactDate": null,
        "scope": "Par39的2022調查敘事，不是2025年才發現"
      },
      "unit": "人類與非人分離株群的關聯",
      "locators": [
        {
          "format": "xml",
          "xpath": "//p[@id='Par39']",
          "section": "Results / Epidemiological and microbiological investigations",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        },
        {
          "format": "xml",
          "xpath": "//p[@id='Par50']",
          "section": "Discussion",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        }
      ]
    },
    {
      "id": "a25-enterobase-fig2-415",
      "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
      "analysisVersionId": "laisnez-2025-retrospective",
      "label": "回顧論文Fig.2資料集合",
      "publicationDate": "2025-02-20",
      "evidenceCutoff": {
        "date": "2024-04-10",
        "scope": "Fig.2 EnteroBase可用分離株",
        "status": "reported"
      },
      "unit": "分離株／AD",
      "isolateCount": 415,
      "reportedClusterDistance": {
        "value": 56,
        "unit": "AD"
      },
      "locators": [
        {
          "format": "xml",
          "xpath": "//p[@id='Par40']",
          "section": "Results / Epidemiological and microbiological investigations",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        },
        {
          "format": "xml",
          "xpath": "//fig[@id='Fig2']/caption/p",
          "section": "Figure 2 caption",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        }
      ],
      "contextOnly": true,
      "notSelectableEvidenceCard": true,
      "cannotInfer": [
        "415不是病例數，也未證明全為人類分離株。",
        "56 AD不是通用歸因門檻；不能換成56 SNP。",
        "不能與2022的62 AD畫成距離改善曲線或合併矩陣。",
        "不能把2024集合稱為2022決策時已取得的全部資料。"
      ],
      "unknown": [
        "完整基因距離矩陣未取得",
        "與2022差異的各種來源未被逐項拆解",
        "XML Tab1本體只有graphic，未視讀其數值條件，不從HC5名稱猜cutoff"
      ]
    },
    {
      "id": "a25-uk-case-control",
      "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
      "analysisVersionId": "laisnez-2025-retrospective",
      "label": "回顧文報告的英國病例對照分析",
      "publicationDate": "2025-02-20",
      "evidenceCutoff": {
        "date": null,
        "scope": "英國分析的精確招募／資料截止日",
        "status": "not-reported"
      },
      "eventTime": {
        "year": 2022,
        "basis": "CR22為ESCAIDE 2022事件研究摘要；精確分析完成日未知"
      },
      "unit": "調整勝算比aOR及95%信賴區間，無因次",
      "locators": [
        {
          "format": "xml",
          "xpath": "//p[@id='Par31']",
          "section": "Methods / Epidemiological and microbiological investigations",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        },
        {
          "format": "xml",
          "xpath": "//p[@id='Par37']",
          "section": "Results / Epidemiological and microbiological investigations",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        },
        {
          "format": "xml",
          "xpath": "//ref[@id='CR22']",
          "section": "Reference 22",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        }
      ],
      "unknown": [
        "病例／對照n及交叉表未在此文列出",
        "精確招募期間、完整模型係數、缺失處理與敏感性分析數值未知"
      ]
    },
    {
      "id": "a25-retrospective-timing",
      "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
      "analysisVersionId": "laisnez-2025-retrospective",
      "label": "回顧文的日期種類與時間限制",
      "publicationDate": "2025-02-20",
      "evidenceCutoff": {
        "date": null,
        "scope": "時間相容性推論的精確分析日",
        "status": "not-reported"
      },
      "unit": "發病日、檢出日及平均製造至零售時間",
      "locators": [
        {
          "format": "xml",
          "xpath": "//p[@id='Par35']",
          "section": "Results",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        },
        {
          "format": "xml",
          "xpath": "//p[@id='Par51']",
          "section": "Discussion",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        }
      ]
    }
  ],
  "sourceIssues": [
    {
      "id": "issue-case-total",
      "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
      "locators": [
        {
          "format": "xml",
          "xpath": "//p[@id='Par34']",
          "section": "Results",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        },
        {
          "format": "xml",
          "xpath": "//table-wrap[@id='Tab2']",
          "section": "Table 2",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        }
      ],
      "unit": "確認病例",
      "reportedValues": {
        "narrativeCases": 456,
        "narrativeAsOf": "2022-07-15",
        "tableCluster1": 390,
        "tableCluster2": 62,
        "tableTotal": 452,
        "tablePeriod": "2021-12至2022-06"
      },
      "verifiedDerivedCheck": "逐國列合計390／62／452，逐列加法成立；與正文差4。",
      "status": "UNRESOLVED",
      "unknown": "差4原因、表格獨立截止、是否存在其他排除條件均未說明。",
      "prohibitedRepair": "不能自行稱為未分群、漏列、不同截止或筆誤；不選一個當唯一正確總數。"
    },
    {
      "id": "issue-country-period",
      "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
      "locators": [
        {
          "format": "xml",
          "xpath": "//p[@id='Par47']",
          "section": "Discussion",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        },
        {
          "format": "xml",
          "xpath": "//table-wrap[@id='Tab2']",
          "section": "Table 2",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        }
      ],
      "unit": "國家列／病例期間",
      "reportedValues": {
        "discussionCountries": 17,
        "countedCountryRows": 18,
        "discussionPeriod": "2021-12至2022-04",
        "tablePeriod": "2021-12至2022-06"
      },
      "status": "UNRESOLVED",
      "unknown": "國家數及期間敘述差異原因未交代。",
      "prohibitedRepair": "不偷偷統一分母／期間。"
    },
    {
      "id": "issue-analysis-noncomparability",
      "sourceIds": [
        "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
        "micro-outbreak-source-laisnez-2025-chocolate-wgs"
      ],
      "analysisIds": [
        "a22-efsa-fig2-33",
        "a25-enterobase-fig2-415"
      ],
      "unit": "分離株與AD",
      "status": "SEPARATE_ANALYSES_NOT_A_SINGLE_TIME_SERIES",
      "fact": "33株／62AD與415株／56AD屬不同集合和分析脈絡。",
      "unknown": "未逐項拆解集合、schema及流程差別對數值的影響。",
      "prohibitedRepair": "不畫62→56改善線、不推進化速率、不合併矩陣、不用415補病例差額。"
    },
    {
      "id": "issue-2022-matrix-provenance",
      "sourceId": "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
      "locators": [
        {
          "format": "pdf",
          "pageOneBased": 5,
          "section": "Belgium",
          "detail": "九株及其採樣／matrix未知段",
          "url": "https://www.ecdc.europa.eu/sites/default/files/documents/ROA_monophasic-S-Typhimurium-ST34-linked-to-chocolate_2022-00014_UK-corrected.pdf#page=5"
        }
      ],
      "unit": "分離株與原樣本",
      "status": "KNOWN_INFORMATION_GAP_AT_THIS_SOURCE_VERSION",
      "fact": "當時精確採樣日與九株對應基質未報至RASFF。",
      "prohibitedRepair": "不以2025的來源類別偷偷回填2022畫面。"
    },
    {
      "id": "issue-source-dates",
      "sourceIds": [
        "micro-outbreak-source-ecdc-efsa-2022-apr12-corrected",
        "micro-outbreak-source-laisnez-2025-chocolate-wgs"
      ],
      "status": "DATE_TYPES_MUST_REMAIN_DISTINCT",
      "fact": "2022報告最早病例採樣12/21；2025文最早發病12/12。2025發表與2024圖集合截止均非所有資料的發現日期。",
      "prohibitedRepair": "不將採樣、發病、檢出、確認、發表日期合成單一事件日。"
    },
    {
      "id": "issue-case-definition-image",
      "sourceId": "micro-outbreak-source-laisnez-2025-chocolate-wgs",
      "locators": [
        {
          "format": "xml",
          "xpath": "//table-wrap[@id='Tab1']/graphic",
          "section": "Table 1",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11844163/"
        }
      ],
      "status": "NOT_READ_AS_TEXT",
      "fact": "病例定義表本體是外部graphic；本次沒有取得或視讀原圖。",
      "prohibitedRepair": "不由HC5代號或2022定義自填2025 cutoff。"
    }
  ]
});
