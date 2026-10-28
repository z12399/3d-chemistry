// Editorial entry order and optional remediation; no compulsory gates or mastery inference.
export const STUDY_ROADMAP = [
  {
    "subject": "processing",
    "topicId": "proc-balances",
    "startLessonId": "proc-mass-basis",
    "why": "先固定水分與固形物的分母、系統邊界；否則濃縮、乾燥及營養總量會混用百分比。",
    "prerequisites": [],
    "suggestedSequenceIndex": 0
  },
  {
    "subject": "chemistry",
    "topicId": "water",
    "startLessonId": "water-activity",
    "why": "把「水有多少」與「同溫平衡蒸氣壓比」拆開；再讀遷移、吸濕與溫度資料。",
    "prerequisites": [
      {
        "subject": "processing",
        "lessonId": "proc-mass-basis",
        "why": "若不熟乾基／濕基，先用同一份樣品重算兩個分母。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 6
  },
  {
    "subject": "chemistry",
    "topicId": "carbohydrates",
    "startLessonId": "carb-chair-foundations",
    "why": "先分清配置、環的兩面與構象，再讀環鏈交換、還原端與水解；熟悉者可直接進入還原端作答。",
    "prerequisites": [],
    "suggestedSequenceIndex": 1
  },
  {
    "subject": "chemistry",
    "topicId": "proteins",
    "startLessonId": "protein-peptide-backbone",
    "why": "先認骨架與肽鍵，再分變性、水解及網路；營養品質另走本批整合路徑，不由功能性反推。",
    "prerequisites": [],
    "suggestedSequenceIndex": 2
  },
  {
    "subject": "chemistry",
    "topicId": "lipids",
    "startLessonId": "lipid-family-atlas",
    "why": "先辨家族、官能基與酯鍵，再談水解、雙鍵、氧化及品質指標。",
    "prerequisites": [],
    "suggestedSequenceIndex": 3
  },
  {
    "subject": "chemistry",
    "topicId": "enzymes",
    "startLessonId": "enzyme-catalysis",
    "why": "先分平衡方向與能障／速率，再讀初速、飽和、抑制與擬合。",
    "prerequisites": [
      {
        "subject": "chemistry",
        "lessonId": "protein-denaturation",
        "why": "先能說明改變摺疊與切斷肽鍵是不同事件，避免把活性下降直接等同水解。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 7
  },
  {
    "subject": "chemistry",
    "topicId": "browning",
    "startLessonId": "browning-maillard",
    "why": "由反應物與早期官能基反應走向多條後續路徑；可見褐色不能代替特定產物。",
    "prerequisites": [
      {
        "subject": "chemistry",
        "lessonId": "carb-reducing-end",
        "why": "先找可進入環鏈交換的還原端／羰基來源。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "chemistry",
        "lessonId": "protein-peptide-backbone",
        "why": "分清骨架肽鍵與可反應胺基，避免把所有氮當相同反應物。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 8
  },
  {
    "subject": "chemistry",
    "topicId": "pigments",
    "startLessonId": "pigment-anthocyanin",
    "why": "先分色素形式與條件，再依問題補外觀色度、方法當量及產品比較；已能分清者可由課內捷徑直進產品證據。葉綠素、類胡蘿蔔素與肌紅蛋白仍是不同機制分支。",
    "prerequisites": [
      {
        "subject": "chemistry",
        "lessonId": "water-buffer",
        "why": "若把pH當總酸量，先補pH與可滴定酸度／緩衝量的差別。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 19
  },
  {
    "subject": "chemistry",
    "topicId": "flavor",
    "startLessonId": "flavor-sensory-channels",
    "why": "先確定要解釋的是味覺、嗅覺或刺激感，再分形成量、分配及感官閾值。",
    "prerequisites": [],
    "suggestedSequenceIndex": 4
  },
  {
    "subject": "chemistry",
    "topicId": "vitamins",
    "startLessonId": "vitamin-solubility",
    "why": "先追成分在哪個相，再分溶出、化學轉化與同批總量留存。",
    "prerequisites": [
      {
        "subject": "processing",
        "lessonId": "proc-concentration-balance",
        "why": "先會用同批質量與濃度算回總量，才不把濃度升高當營養增加。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 9
  },
  {
    "subject": "chemistry",
    "topicId": "minerals",
    "startLessonId": "minerals-ash",
    "why": "先區分分析殘留、個別元素與吸收，再讀配位、結合及加工證據。",
    "prerequisites": [
      {
        "subject": "processing",
        "lessonId": "proc-mass-basis",
        "why": "先對齊原樣品／乾物質分母，避免灰分百分比錯比。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 10
  },
  {
    "subject": "chemistry",
    "topicId": "colloids",
    "startLessonId": "colloid-emulsion",
    "why": "先辨分散相／連續相及界面，再學失穩、成膠、流變與量測模型。",
    "prerequisites": [
      {
        "subject": "chemistry",
        "lessonId": "lipid-family-atlas",
        "why": "認出TAG與具有極性頭部的脂質，不把乳化當兩相分子互溶。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 11
  },
  {
    "subject": "chemistry",
    "topicId": "processing",
    "startLessonId": "analysis-sampling-blank",
    "why": "這個混合章節先走分析鏈：對象與取樣→空白→校準→回收／基質→未見資料；玻璃轉移則由水分路徑進入。",
    "prerequisites": [
      {
        "subject": "processing",
        "lessonId": "proc-mass-basis",
        "why": "先明確試料質量與報告基準，才能把訊號換成食品含量。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 12
  },
  {
    "subject": "processing",
    "topicId": "proc-energy",
    "startLessonId": "proc-sensible-latent",
    "why": "先把質量、溫差與相變能量拆開，再比較傳熱速率、尺寸與設備條件。",
    "prerequisites": [
      {
        "subject": "processing",
        "lessonId": "proc-mass-basis",
        "why": "先辨食品總質量與實際相變質量，避免把全部水都視為同一相。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 13
  },
  {
    "subject": "processing",
    "topicId": "proc-evaporation",
    "startLessonId": "proc-vacuum-evaporation",
    "why": "先理解壓力改變沸騰條件，再把固形物、蒸發水與熱量帳接起來。",
    "prerequisites": [
      {
        "subject": "processing",
        "lessonId": "proc-concentration-balance",
        "why": "先能在保留固形物條件下算產品與離開的水。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "processing",
        "lessonId": "proc-sensible-latent",
        "why": "低溫沸騰仍有潛熱需求，能量不直接等於時間或電耗。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 20
  },
  {
    "subject": "processing",
    "topicId": "proc-drying",
    "startLessonId": "proc-air-humidity",
    "why": "先區分濕空氣RH與含濕比，再連乾燥速率、材料平衡狀態及品質證據。",
    "prerequisites": [
      {
        "subject": "processing",
        "lessonId": "proc-mass-basis",
        "why": "先固定濕基／乾基與乾物質保留假設。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "chemistry",
        "lessonId": "water-activity",
        "why": "先會說明材料同溫平衡aw，不能直接拿出口空氣RH當食品aw。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "processing",
        "lessonId": "proc-sensible-latent",
        "why": "先分升溫與相變能量，避免只由熱風設定推食品溫度。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 21
  },
  {
    "subject": "processing",
    "topicId": "proc-freezing",
    "startLessonId": "proc-freezing-load",
    "why": "由分段熱負荷走向實際結冰量，再比較冷媒循環、凍結前緣及儲藏品質。",
    "prerequisites": [
      {
        "subject": "processing",
        "lessonId": "proc-sensible-latent",
        "why": "先拆顯熱與潛熱，避免重複計算。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "chemistry",
        "lessonId": "water-freezing",
        "why": "先理解未凍結相與凍結濃縮，不假定食品水在0°C一次全凍。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 22
  },
  {
    "subject": "processing",
    "topicId": "proc-separation",
    "startLessonId": "proc-membrane-driving",
    "why": "先寫要分離的物質與驅動力，再讀膜面傳質、萃取、相分配及回收。",
    "prerequisites": [
      {
        "subject": "processing",
        "lessonId": "proc-concentration-balance",
        "why": "先追每股物料的質量與成分，濃度升高不等於成分生成。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "chemistry",
        "lessonId": "flavor-partition",
        "why": "對萃取分支，先分總量與兩相分配，再比較濃度和回收率。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 14
  },
  {
    "subject": "processing",
    "topicId": "proc-packaging",
    "startLessonId": "proc-package-functions-evidence",
    "why": "先明確容裝、保護、取用及資訊的需求，再讀膜傳輸、封口與包內變化。",
    "prerequisites": [
      {
        "subject": "chemistry",
        "lessonId": "water-activity",
        "why": "阻濕分支先分食品水分狀態與水的量。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "microbiology",
        "lessonId": "micro-contamination-chain",
        "why": "包裝完整性與處理後污染是不同證據，膜片數字不能代替全包判定。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 23
  },
  {
    "subject": "processing",
    "topicId": "proc-thermal-processing",
    "startLessonId": "proc-temperature-history",
    "why": "先定位食品測點與完整熱歷程，再累積指定模型作用，最後討論品質與現場驗證。",
    "prerequisites": [
      {
        "subject": "processing",
        "lessonId": "proc-heat-transfer",
        "why": "先分熱量收支與傳熱所需時間。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "microbiology",
        "lessonId": "micro-z-temperature",
        "why": "遇到Fref式中的z不熟時，先讀D對溫度敏感度，不把指定模型當真實製程驗證。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 30
  },
  {
    "subject": "processing",
    "topicId": "proc-oil-refining",
    "startLessonId": "proc-oil-refining-route",
    "why": "先按原料與產品需求選功能路線，再把脫膠、脫酸、吸附、結晶與汽提接回收支。",
    "prerequisites": [
      {
        "subject": "chemistry",
        "lessonId": "lipid-family-atlas",
        "why": "先分TAG、磷脂與游離脂肪酸等目標物。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "chemistry",
        "lessonId": "lipid-hydrolysis",
        "why": "先分FFA生成與FFA分離，避免把脫酸當所有氧化問題都消失。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "processing",
        "lessonId": "proc-concentration-balance",
        "why": "先把成分移除與油損失記在相同邊界。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 15
  },
  {
    "subject": "processing",
    "topicId": "proc-grain-processing",
    "startLessonId": "proc-rice-milling-damage",
    "why": "先分去殼、碾白與磨粉的層次，再以粒徑、損傷與指定條件判讀量測。",
    "prerequisites": [
      {
        "subject": "chemistry",
        "lessonId": "carb-starch-architecture",
        "why": "先分澱粉連接與分支，不把粒子損傷率當分子斷鍵比例。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "processing",
        "lessonId": "proc-mass-basis",
        "why": "先對齊原料、產物和水分基準，才比較百分比。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 16
  },
  {
    "subject": "processing",
    "topicId": "proc-fermentation",
    "startLessonId": "proc-fermentation-physical-state",
    "why": "先分生化反應與食品製程用語、物理相態，再讀對照、供糖／利用及產品取捨。",
    "prerequisites": [
      {
        "subject": "microbiology",
        "lessonId": "micro-fermentation-redox",
        "why": "先能把碳與還原當量分帳，不以食品名稱推代謝路徑。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "processing",
        "lessonId": "proc-concentration-balance",
        "why": "先分濃度、總量、回收與產量。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 31
  },
  {
    "subject": "processing",
    "topicId": "proc-process-design",
    "startLessonId": "proc-process-tradeoffs",
    "why": "先定共同比較終點與系統邊界，再看無菌鏈、後段污染、品質和資源代價。",
    "prerequisites": [
      {
        "subject": "processing",
        "lessonId": "proc-concentration-balance",
        "why": "先算同樣產品量／成分終點，避免用不同終點比較效率。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "microbiology",
        "lessonId": "micro-contamination-chain",
        "why": "先追處理後重新污染路徑，不只看是否曾加熱。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 24
  },
  {
    "subject": "microbiology",
    "topicId": "micro-identity",
    "startLessonId": "micro-cells-viruses",
    "why": "先辨細胞、真菌、病毒與孢子的對象，避免把檢出與複製或耐受性混成同一件事。",
    "prerequisites": [],
    "suggestedSequenceIndex": 5
  },
  {
    "subject": "microbiology",
    "topicId": "micro-measurement",
    "startLessonId": "micro-plate-count",
    "why": "先定義CFU、細胞數與核酸訊號的對象，再學稀釋、抽樣、對照與同株確認。",
    "prerequisites": [
      {
        "subject": "microbiology",
        "lessonId": "micro-cells-viruses",
        "why": "先知道要觀察的對象，不能把病毒核酸訊號套入細菌倍增。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 17
  },
  {
    "subject": "microbiology",
    "topicId": "micro-growth",
    "startLessonId": "micro-growth-cycle",
    "why": "先標清縱軸和族群淨變化，再讀倍增、選窗擬合與未見資料的外推限制。",
    "prerequisites": [
      {
        "subject": "microbiology",
        "lessonId": "micro-plate-count",
        "why": "先知道CFU的形成條件與聚集／回收限制，不把CFU變化當所有細胞數變化。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 25
  },
  {
    "subject": "microbiology",
    "topicId": "micro-environment",
    "startLessonId": "micro-hurdles",
    "why": "把菌株、食品條件與歷史一起看，再讀壓力、防禦與修復的證據歸因。",
    "prerequisites": [
      {
        "subject": "chemistry",
        "lessonId": "water-activity",
        "why": "先分含水量與同溫平衡aw。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "chemistry",
        "lessonId": "water-buffer",
        "why": "先分pH與總酸量，避免單指標代替食品環境。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "microbiology",
        "lessonId": "micro-growth-cycle",
        "why": "先分不增長、淨數量穩定與全部失活。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 27
  },
  {
    "subject": "microbiology",
    "topicId": "micro-hazards",
    "startLessonId": "micro-infection-intoxication",
    "why": "先追感染性生物、食品預成毒素與腸內產毒的作用位置，再讀污染與水產／禽肉證據。",
    "prerequisites": [
      {
        "subject": "microbiology",
        "lessonId": "micro-cells-viruses",
        "why": "先辨對象與複製方式，名稱／形狀本身不能決定危害。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 18
  },
  {
    "subject": "microbiology",
    "topicId": "micro-control",
    "startLessonId": "micro-decimal-reduction",
    "why": "先讀連續十倍下降與指定條件，再讀z和變溫歷程；計算比例不能保證整批安全。",
    "prerequisites": [
      {
        "subject": "microbiology",
        "lessonId": "micro-plate-count",
        "why": "先標清存活端點及量測方法，不把所有活性都等同CFU。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "microbiology",
        "lessonId": "micro-growth-cycle",
        "why": "先分生長與失活的量，避免把生長模型直接換號當通用失活。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 28
  },
  {
    "subject": "microbiology",
    "topicId": "micro-fermentation",
    "startLessonId": "micro-fermentation-redox",
    "why": "先分碳流、NAD回收與ATP的功能，再讀發酵種、群落、產品及來源時間序列。",
    "prerequisites": [
      {
        "subject": "chemistry",
        "lessonId": "flavor-fermentation",
        "why": "先用淨反應認碳的去向，知道它省略了NAD與ATP循環。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "microbiology",
        "lessonId": "micro-growth-cycle",
        "why": "先分族群、產物與時間，不由同一pH推同一菌量或路徑。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 29
  },
  {
    "subject": "microbiology",
    "topicId": "micro-cases",
    "startLessonId": "micro-spoilage-indicators",
    "why": "由品質指標和特定危害的差別出發，再練產品專屬的製程證據鏈。",
    "prerequisites": [
      {
        "subject": "microbiology",
        "lessonId": "micro-infection-intoxication",
        "why": "先明確控制對象是感染性生物還是毒素。",
        "kind": "remedy",
        "requiredGate": false
      },
      {
        "subject": "microbiology",
        "lessonId": "micro-plate-count",
        "why": "先會限定未檢出所代表的份量、方法及檢出能力。",
        "kind": "remedy",
        "requiredGate": false
      }
    ],
    "suggestedSequenceIndex": 26
  }
];
export const CORE_STARTS = [
  {
    "id": "protein",
    "title": "蛋白質：先分三種「好」",
    "diagnostic": "含量較高、能形成凝膠、符合胺基酸需求，能互相代替嗎？請各說一種需要的量測。",
    "href": "#paths/protein-evidence-chain",
    "label": "診斷、補基礎與撤提示遷移",
    "status": "新增蛋白伴讀路徑與混配活動；原課未改",
    "why": "含量／營養／功能 → 結構與分析 → 需求與消化 → 混配新題。"
  },
  {
    "id": "drying",
    "title": "乾燥：先分水分量、狀態與速率",
    "diagnostic": "減重、乾基含水量與同溫aw分別描述什麼？只知道末重，能知道失水量或乾燥時間嗎？",
    "subject": "processing",
    "lessonId": "proc-drying-quality",
    "label": "診斷、補基礎與新邊界遷移",
    "href": "#paths/drying-evidence-chain",
    "status": "新增乾燥伴讀；兩課說明與示範標示修訂",
    "why": "基準不熟先補「乾基／濕基」；aw不熟先補「水活性」。品質需按具名研究的條件與端點解讀。",
    "remedies": [
      {
        "subject": "processing",
        "lessonId": "proc-mass-basis",
        "why": "含水量的兩種分母"
      },
      {
        "subject": "chemistry",
        "lessonId": "water-activity",
        "why": "同溫平衡與水活性"
      },
      {
        "subject": "processing",
        "lessonId": "proc-drying-characteristic",
        "why": "速率曲線與終點狀態"
      }
    ]
  },
  {
    "id": "fermentation",
    "title": "發酵：先分碳流、還原與觀察",
    "diagnostic": "食品製程叫發酵，就必然是同一種代謝嗎？只有pH下降，足以辨認菌種、碳去向或路徑嗎？",
    "subject": "microbiology",
    "lessonId": "micro-fermentation-redox",
    "label": "用語、還原當量與資料遷移",
    "href": "#paths/fermentation-evidence-chain",
    "status": "新增發酵伴讀與原課／活動文字修訂",
    "why": "選定生化模型的計量 → 食品中的角色 → 同研究時間序列 → 觀察與機制的分界。",
    "remedies": [
      {
        "subject": "microbiology",
        "lessonId": "micro-growth-cycle",
        "why": "先定義時間序列的縱軸"
      },
      {
        "subject": "microbiology",
        "lessonId": "micro-plate-count",
        "why": "CFU與細胞數"
      },
      {
        "subject": "microbiology",
        "lessonId": "micro-growth-estimation",
        "why": "選窗、擬合及外推界線"
      },
      {
        "subject": "processing",
        "lessonId": "proc-fermentation-physical-state",
        "why": "食品製程的物理分類"
      }
    ]
  },
{
  "id": "thermal-evidence",
  "title": "熱處理：先分模型、測點與證據用途",
  "diagnostic": "D、z、Tref與Fourier Fo各是什麼量？有了Fref或幾個陰性結果，就能判定確效、監測與查核都完成嗎？",
  "href": "#paths/thermal-evidence-chain",
  "label": "診斷、熱歷程與證據角色遷移",
  "status": "新增熱證據路徑；確效課角色活動與舊抽樣題分開",
  "why": "局部熱歷程 → 有限測點 → 條件式累積 → 量測範圍 → 按用途辨認證據。已有基礎可直接檢查新情境。",
  "remedies": [
    {
      "subject": "microbiology",
      "lessonId": "micro-decimal-reduction",
      "why": "D的時間與十進位下降"
    },
    {
      "subject": "microbiology",
      "lessonId": "micro-z-temperature",
      "why": "z的溫差與參考點"
    },
    {
      "subject": "processing",
      "lessonId": "proc-heat-penetration-scale",
      "why": "Fourier Fo是αt/L²，無因次"
    },
    {
      "subject": "processing",
      "lessonId": "proc-equivalent-time",
      "why": "Fref是指定Tref與z的加權時間"
    }
  ]
},
{
  "id": "enzyme-evidence",
  "title": "酵素：先量初速，再用模型取證",
  "diagnostic": "同樣AU/時間就代表同樣產物速率嗎？ES近穩定、Km、Vmax與有效位點各有什麼前提？一條較慢曲線能排除哪些解釋？",
  "href": "#paths/enzyme-evidence-chain",
  "label": "量測、模型與證據遷移",
  "status": "新增量測取證活動；原MM耗損模型保留為條件式延伸",
  "why": "配對訊號與初速窗口 → 準穩態機構 → 飽和參數與有效位點 → 擬合與抑制 → 有用途的對照。已掌握者可跳診斷，不必讀完11課。",
  "remedies": [
    {
      "subject": "chemistry",
      "lessonId": "enzyme-initial-rate",
      "why": "配對空白、校正與初速窗口"
    },
    {
      "subject": "chemistry",
      "lessonId": "enzyme-steady-state",
      "why": "ES庫存、流量與準穩態條件"
    },
    {
      "subject": "chemistry",
      "lessonId": "enzyme-turnover",
      "why": "Vmax、有效催化位與kcat分母"
    },
    {
      "subject": "chemistry",
      "lessonId": "enzyme-catalysis",
      "why": "反應速率與平衡方向"
    }
  ]
}
];
