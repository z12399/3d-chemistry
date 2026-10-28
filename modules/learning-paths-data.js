// Lesson titles, topics and sources resolve from the live subject curricula.
export const LEARNING_PATHS = [
  {
    "id": "powder-moisture",
    "title": "受潮粉末為什麼變黏？",
    "description": "從水的狀態走到粉末物性，再檢查包裝與微生物判讀。",
    "outcome": "粉末受潮變黏時，哪些量測能分辨物性變化、包裝進水與微生物條件？",
    "boundary": "各站案例與參數獨立，未串成同一粉末的吸濕、玻璃轉移或微生物預測。",
    "stations": [
      {
        "subject": "chemistry",
        "lessonId": "water-activity",
        "prompt": "含水量一樣，就代表水活性一樣嗎？",
        "label": "分清水分"
      },
      {
        "subject": "chemistry",
        "lessonId": "water-sorption-comparison",
        "prompt": "相同水活性下，不同材料會含一樣多的水嗎？",
        "label": "比較吸濕"
      },
      {
        "subject": "chemistry",
        "lessonId": "processing-glass-plasticization",
        "prompt": "非晶粉末吸水後，為何可能在相同溫度變黏？",
        "label": "理解塑化"
      },
      {
        "subject": "processing",
        "lessonId": "proc-package-barriers",
        "prompt": "比較阻濕包材時，除了膜片數值還要看什麼？",
        "label": "檢查阻隔"
      },
      {
        "subject": "microbiology",
        "lessonId": "micro-hurdles",
        "prompt": "水活性降低，就表示微生物已被消除嗎？",
        "label": "判讀生長"
      }
    ]
  },
  {
    "id": "heat-quality",
    "title": "同樣加熱，效果為什麼不同？",
    "description": "分開蛋白品質、食品熱歷程與微生物控制的證據。",
    "outcome": "兩種加熱方式看似相近，如何分別比較品質變化、累積熱作用與實際驗證？",
    "boundary": "大豆案例與假想熱作用、品質參數互不套用，未計算同一產品的製程效果。",
    "stations": [
      {
        "subject": "chemistry",
        "lessonId": "protein-heat-quality",
        "prompt": "抑制因子更低，蛋白品質就一定更好嗎？",
        "label": "品質取捨"
      },
      {
        "subject": "processing",
        "lessonId": "proc-temperature-history",
        "prompt": "相同設備溫度，食品內部會有相同熱歷程嗎？",
        "label": "食品熱史"
      },
      {
        "subject": "processing",
        "lessonId": "proc-equivalent-time",
        "prompt": "溫度隨時間改變時，如何累積參考溫度下的等效作用？",
        "label": "累積作用"
      },
      {
        "subject": "processing",
        "lessonId": "proc-thermal-quality",
        "prompt": "在指定模型下，相同 Fref 就代表相同品質保留嗎？",
        "label": "反應差異"
      },
      {
        "subject": "microbiology",
        "lessonId": "micro-process-validation",
        "prompt": "計算結果之外，還需要哪些產品與現場證據？",
        "label": "驗證依據"
      }
    ]
  },
  {
    "id": "juice-concentration",
    "title": "果汁濃縮，留下了什麼？",
    "description": "把濃度、營養總量、化學褐變與微生物證據分開。",
    "outcome": "果汁濃縮後每 100 g 維生素 C 較高又變褐，哪些結論成立，哪些仍要補量測？",
    "boundary": "各站分別採果汁、蔬菜收支與一般食品案例，未串成同批果汁的實測或預測。",
    "stations": [
      {
        "subject": "processing",
        "lessonId": "proc-concentration-balance",
        "prompt": "若只有水離開且固形物保留，產品質量與濃度如何一起改變？",
        "label": "濃縮收支"
      },
      {
        "subject": "chemistry",
        "lessonId": "vitamin-true-retention",
        "prompt": "算回同批前後的總量後，濃度升高仍代表維生素增加嗎？",
        "label": "總量保留"
      },
      {
        "subject": "chemistry",
        "lessonId": "browning-ascorbic-pathways",
        "prompt": "AA、DHA 與褐色能由同一個讀值代表嗎？",
        "label": "褐變路徑"
      },
      {
        "subject": "microbiology",
        "lessonId": "micro-spoilage-indicators",
        "prompt": "變褐或外觀正常，各能支持什麼，又缺哪些微生物證據？",
        "label": "證據分界"
      }
    ]
  },
  {
    "id": "yogurt-sugar-to-gel",
    "title": "乳糖少了，為什麼會變酸又成膠？",
    "description": "從糖的去向讀到乳蛋白品質，再核對菌種與研究結論。",
    "outcome": "如何用分子收支、原表品質與菌種資料，解釋發酵乳變化並指出仍缺的證據？",
    "boundary": "反應淨式、原表品質與既有加工例分屬不同證據；未串成同批發酵乳的代謝、成膠或製程預測。",
    "stations": [
      {
        "subject": "chemistry",
        "lessonId": "carb-yogurt-lactose-fate",
        "prompt": "乳糖降低後，哪些碳去向仍需要量測？",
        "label": "追蹤糖去向"
      },
      {
        "subject": "chemistry",
        "lessonId": "protein-yogurt-acid-gel",
        "prompt": "pH 相同時，離水與持水性提供什麼不同證據？",
        "label": "比較乳品品質"
      },
      {
        "subject": "microbiology",
        "lessonId": "micro-fermented-milk-evidence",
        "prompt": "實際菌種與量測，支持哪些微生物結論？",
        "label": "限定菌株結論"
      },
      {
        "subject": "processing",
        "lessonId": "proc-process-tradeoffs",
        "prompt": "比較加工品質之前，哪些條件與終點必須對齊？",
        "label": "對齊比較邊界"
      }
    ]
  },
{
  "id": "protein-evidence-chain",
  "title": "蛋白質的「好」，是哪一種？",
  "description": "先分含量、營養與加工功能，再把結構、量測、需求與消化證據串起來；最後撤除提示，處理混配的新題。",
  "outcome": "面對未見過的蛋白混配題，能先確定評價目的與分母，再算各胺基酸組的供給／題設參考比，指出消化資料與功能測試還缺什麼嗎？",
  "boundary": "這是既有蛋白課的備考編排，沒有改變原研究或考試目標。混配練習採原創兩組胺基酸及題設參考，不是完整AAS、DIAAS、飲食建議或真實食品效力預測。",
  "stations": [
    {
      "subject": "chemistry",
      "lessonId": "protein-peptide-backbone",
      "label": "結構起點",
      "prompt": "先能指出肽鍵，才分得開斷鍵與摺疊。",
      "why": "若連接與層級混在一起，後面的水解、變性與功能判斷會用錯機制。",
      "ready": "能沿N端找到C(=O)–N，並說明變性不等於水解，可直接跳至第3站。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "protein-amino-forms",
          "why": "帶電形態不熟時，回看胺基酸基團與電荷。"
        }
      ]
    },
    {
      "subject": "chemistry",
      "lessonId": "protein-structure-hierarchy",
      "label": "從連接到功能",
      "prompt": "序列、摺疊與多鏈組裝，哪一層改變？",
      "why": "結構改變提供功能假說；是否成膠、溶解或可被消化仍各需相應觀察。",
      "ready": "能分開序列、單鏈摺疊與組裝，並為功能主張提出量測。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "protein-denaturation",
          "why": "把變性與肽鍵切斷分開。"
        }
      ]
    },
    {
      "subject": "chemistry",
      "lessonId": "processing-analysis",
      "label": "先問測到什麼",
      "prompt": "含量數字與功能測試，能回答同一問題嗎？",
      "why": "總氮換算、胺基酸分析與食品功能的測量對象不同；先定義端點，才談哪一種「好」。",
      "ready": "看到數字會先問量測對象、分母與方法，而不直接排名。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "analysis-sampling-blank",
          "why": "補量測對象、代表性與空白的區分。"
        }
      ]
    },
    {
      "subject": "chemistry",
      "lessonId": "protein-hydrolysis-conditions",
      "label": "組成有方法前提",
      "prompt": "水解後的Asx、缺值與回收，能還原哪些胺基酸？",
      "why": "需求比使用的組成必須可信；合報與未測項不能拆成任意比例，也不能補零。",
      "ready": "能指出方法能辨認什麼、不能辨認什麼，並保留缺值。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "protein-hydrolysis-balance",
          "why": "先把斷肽鍵與水的物料帳寫清楚。"
        }
      ]
    },
    {
      "subject": "chemistry",
      "lessonId": "protein-alternative-quality",
      "label": "需求與消化的證據",
      "prompt": "對齊蛋白分母與參考對象後，誰才是限制組？",
      "why": "先逐組比對組成與參考需求，再問消化證據的方法及範圍；體外訊號不能默認成各組迴腸消化率。",
      "ready": "能重算各組比值、保留未測胺基酸，且不把組成分數寫成DIAAS。",
      "remedies": [
        {
          "subject": "processing",
          "lessonId": "proc-mass-basis",
          "why": "若分母換算仍會混淆，先補同一批物料的濕基／乾基。"
        }
      ]
    },
    {
      "subject": "chemistry",
      "lessonId": "protein-heat-quality",
      "label": "比較與作答遷移",
      "prompt": "抑制因子、化學損傷與功能端點，能合成一個排名嗎？",
      "why": "加工可同時影響不同端點；作答須保留題設條件、觀察及推論界線，不能只寫越多越好。",
      "ready": "能在下方無提示題寫出答案、理由、適用條件與資訊不足之處；對照後只修訂，不覆寫初答。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "protein-alternative-quality",
          "why": "若把含量、營養與功能混為一談，回到需求與證據。"
        }
      ]
    }
  ]
},
{
  "id": "drying-evidence-chain",
  "title": "乾了多少，能推到哪裡？",
  "description": "先分基準、同溫平衡與過程速率，再用品質和保存證據檢查推論。可診斷跳過熟悉基礎，最後換物料邊界作答。",
  "outcome": "面對曾開放交換、溫度或平衡條件不同的新樣品，能分開可算的質量、合格的aw觀察、未知時間／品質與尚缺的保存證據嗎？",
  "boundary": "這是既有課程的推理編排。各課來源案例與模型彼此獨立；新活動數字為原創題設，不是同批食品的乾燥曲線、吸濕等溫線或保存／安全預測。",
  "stations": [
    {
      "subject": "processing",
      "lessonId": "proc-mass-basis",
      "label": "先固定分母與邊界",
      "prompt": "同一份水，濕基與乾基怎麼寫；何時才能假定乾物質守恆？",
      "why": "先把量與不變量寫明，後面才不會把減重、乾基含水量或水活性混成同一個比例。",
      "ready": "能由80 kg、75%濕基拆出60 kg水與20 kg乾物質，並說出非水流失會改變何項假設，可跳到第2站。",
      "remedies": []
    },
    {
      "subject": "chemistry",
      "lessonId": "water-activity",
      "label": "把水量與水狀態分開",
      "prompt": "知道含水量，還缺什麼才能知道aw？",
      "why": "aw的定義是同溫平衡蒸氣壓比；它不是水的質量分率，也不是正在乾燥的出口空氣RH。",
      "ready": "能寫出同溫平衡條件，並反駁含水20%所以aw=0.20，可直接進入材料與溫度關係。",
      "remedies": [
        {
          "subject": "processing",
          "lessonId": "proc-mass-basis",
          "why": "若百分比仍混淆，回看分母與質量分率。",
          "kind": "remedy",
          "requiredGate": false,
          "href": "#process/proc-balances/proc-mass-basis/understand"
        }
      ]
    },
    {
      "subject": "chemistry",
      "lessonId": "water-sorption-comparison",
      "label": "材料與溫度限定的終點",
      "prompt": "同一aw為什麼能對應不同含水量；換溫度能直接沿用曲線嗎？",
      "why": "速率模型中的Xe是指定材料與環境的平衡含水量；先知道平衡關係需要哪些條件，才能把Xe與轉折Xc分開。",
      "ready": "能說明材料、溫度、吸脫濕歷史與平衡條件，且知道等溫線不提供速度者，可跳到第4站；不要求先擬合GAB。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "water-activity",
          "why": "補aw的同溫平衡定義，而非背通用水分換算表。",
          "kind": "remedy",
          "requiredGate": false,
          "href": "#learn/water/water-activity/understand"
        }
      ]
    },
    {
      "subject": "processing",
      "lessonId": "proc-drying-characteristic",
      "label": "過程速率與終點不是同一題",
      "prompt": "Xc、Xe與目標Xf各是什麼；移除同樣水量為何耗時可能不同？",
      "why": "時間由速率與路徑決定。指定兩段模型的積分不能推成所有食品的實測曲線；終點水分也不能回推出熱歷程。",
      "ready": "能指出t與1/N的關係、Xc是轉折而Xe是平衡、固定面積及參數的前提；已會者可直接用第5站的品質證據檢查。",
      "remedies": [
        {
          "subject": "processing",
          "lessonId": "proc-drying-rate",
          "why": "若供水與內部遷移的因果不清，先讀為何越乾可能越慢。",
          "kind": "remedy",
          "requiredGate": false,
          "href": "#process/proc-drying/proc-drying-rate/understand"
        },
        {
          "subject": "processing",
          "lessonId": "proc-air-humidity",
          "why": "若把環境RH與每公斤乾空氣含濕比混淆，補濕空氣的兩種量。",
          "kind": "remedy",
          "requiredGate": false,
          "href": "#process/proc-drying/proc-air-humidity/understand"
        },
        {
          "subject": "processing",
          "lessonId": "proc-mass-basis",
          "why": "積分中X用乾基，先把分母寫清楚。",
          "kind": "remedy",
          "requiredGate": false,
          "href": "#process/proc-balances/proc-mass-basis/understand"
        }
      ]
    },
    {
      "subject": "processing",
      "lessonId": "proc-drying-quality",
      "label": "以相符量測檢查機制",
      "prompt": "熱風、表面與中心的溫度可互換嗎；顏色與復水性各支持什麼？",
      "why": "把條件→蒸發冷卻與傳質假說→可量測溫度／水分／色澤／復水端點→仍未證明的機制分清，才能寫完整品質論述。",
      "ready": "能在指定條件下算出示意表面溫度、指出中心溫度未知，並為兩種品質主張各列觀察與限制；這不等於已完成食品製程驗證。",
      "remedies": [
        {
          "subject": "processing",
          "lessonId": "proc-heat-transfer",
          "why": "若只由供入熱量推溫度／時間，補熱量與傳熱速率。",
          "kind": "remedy",
          "requiredGate": false,
          "href": "#process/proc-energy/proc-heat-transfer/understand"
        },
        {
          "subject": "chemistry",
          "lessonId": "water-sorption-comparison",
          "why": "若由平均含水量推相同aw，回看材料與溫度限定的平衡關係。",
          "kind": "remedy",
          "requiredGate": false,
          "href": "#learn/water/water-sorption-comparison/understand"
        }
      ]
    },
    {
      "subject": "microbiology",
      "lessonId": "micro-spoilage-indicators",
      "label": "保存主張需要自己的證據",
      "prompt": "含水、aw與外觀的資料，能否排除特定病原或毒素？",
      "why": "乾燥的保存目的與實際安全／保存期是不同層級；一般菌數、感官與特定危害各有取樣、方法和端點，不由單一低aw或平均水分作保證。",
      "ready": "面對未見情境，能說明現有觀察支持什麼、尚缺哪個危害與方法／取樣證據；不把未檢出寫成整批絕對不存在。",
      "remedies": [
        {
          "subject": "microbiology",
          "lessonId": "micro-plate-count",
          "why": "若把CFU當全部活細胞，補量測對象與未檢出界線。",
          "kind": "remedy",
          "requiredGate": false,
          "href": "#micro/micro-measurement/micro-plate-count/understand"
        },
        {
          "subject": "microbiology",
          "lessonId": "micro-hurdles",
          "why": "若把一個aw當完整食品環境，補多條件與不增長／被消除的差別。",
          "kind": "remedy",
          "requiredGate": false,
          "href": "#micro/micro-environment/micro-hurdles/understand"
        }
      ]
    }
  ]
},
{
  "id": "fermentation-evidence-chain",
  "title": "叫作發酵，能推到哪裡？",
  "description": "先分製程用語與選定生化路徑，再讀同研究時間序列及另一研究端點；依題目選旁支，不必把全部食品例排成必經課。",
  "outcome": "在未見食品情境中，能指出用語與量測對象，分開碳／還原當量的可行性、時間序列的描述和食品機制的證據缺環，並寫出條件與下一份需要的證據嗎？",
  "boundary": "四站是推理能力的編排，並非同一批食品或連續實驗：選定EMP模型、LP95豆奶預試與Ichimura優格預水解表保持獨立；分支GC、味噌、Btk27等來源亦不互補缺值。不提供培養／工程程序、產率、安全、功效或保存期限。",
  "stations": [
    {
      "subject": "microbiology",
      "lessonId": "micro-starter-cultures",
      "label": "先分用語與要回答的問題",
      "prompt": "食品製程稱為發酵，與本課選定生化路徑是同一層定義嗎；同終點pH能評價全部功能嗎？",
      "why": "先分製程分類、微生物／酵素角色與評價端點，才不會從食品名稱、變酸或菌種名直接代入一條淨反應。",
      "ready": "能分清製程分類與選定生化模型，並各舉pH、產物、菌數需要的證據者，可直接跳到資料或無提示遷移；不要求重讀全部基礎。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "water-buffer",
          "title": "pH 與緩衝能力",
          "why": "若把pH當總酸量，先補同pH與不同緩衝容量／酸量的差別。",
          "href": "#learn/water/water-buffer/understand",
          "requiredGate": false
        },
        {
          "subject": "microbiology",
          "lessonId": "micro-fermentation-redox",
          "title": "糖還在，回收段為何停住？",
          "why": "若NAD循環不熟，直接進入下一站的局部計量模型。",
          "href": "#micro/micro-fermentation/micro-fermentation-redox/understand",
          "requiredGate": false
        }
      ]
    },
    {
      "subject": "microbiology",
      "lessonId": "micro-fermentation-redox",
      "label": "碳、NAD與ATP分帳",
      "prompt": "碳去了哪裡，還原當量如何回收；淨量相同能比較快慢嗎？",
      "why": "選定EMP、L-LDH與酵母型乙醇支路可檢查碳和NAD池周轉；計量可行性不是實際食品中已辨認出的路徑，也不是速率模型。",
      "ready": "能說明再生NAD與ATP形成不是同一步、PDC產CO2未再生NAD、模型沒有時間或真實菌株通量者，可跳到第3站。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "flavor-fermentation",
          "title": "糖的發酵去向",
          "why": "若淨碳式不熟，先認乳酸／乙醇的簡化碳去向；它仍省略NAD和ATP。",
          "href": "#learn/flavor/flavor-fermentation/understand",
          "requiredGate": false
        },
        {
          "subject": "microbiology",
          "lessonId": "micro-starter-cultures",
          "title": "發酵種要完成什麼工作？",
          "why": "若把所選支路推成所有食品發酵規則，回到用語與目標。",
          "href": "#micro/micro-fermentation/micro-starter-cultures/understand",
          "requiredGate": false
        }
      ]
    },
    {
      "subject": "microbiology",
      "lessonId": "micro-growth-estimation",
      "label": "先讀時間序列的觀測量",
      "prompt": "同一預試的菌數與pH怎麼分讀；早段直線能外推後段或辨認產酸機制嗎？",
      "why": "把LP95的S1菌數和S2pH各按自己的量測及時間讀取，練觀測、選窗和同研究未用點的差別；S3或另一食品的端點不能補成同一條曲線。",
      "ready": "能先標CFU/log底數解讀、窗口與n層級，再說殘差／外推能支持什麼，且不由pH與菌數共變指定因果者，可直接到第4站或整合遷移。",
      "remedies": [
        {
          "subject": "microbiology",
          "lessonId": "micro-plate-count",
          "title": "一個菌落，不保證只有一個細胞",
          "why": "CFU不等於全部活細胞；先確定觀測量與方法回收界線。",
          "href": "#micro/micro-measurement/micro-plate-count/understand",
          "requiredGate": false
        },
        {
          "subject": "microbiology",
          "lessonId": "micro-generation-time",
          "title": "倍增時間不是一段直線加法",
          "why": "若倍率、log與倍增時間換算混淆，補限定指數區間的定義。",
          "href": "#micro/micro-growth/micro-generation-time/understand",
          "requiredGate": false
        },
        {
          "subject": "microbiology",
          "lessonId": "micro-growth-cycle",
          "title": "生長曲線描述的是哪一個量？",
          "why": "若把平台當全部停止代謝，補族群淨變化與各種縱軸。",
          "href": "#micro/micro-growth/micro-growth-cycle/understand",
          "requiredGate": false
        }
      ]
    },
    {
      "subject": "microbiology",
      "lessonId": "micro-enzyme-evidence",
      "label": "機理已知與食品因果分開",
      "prompt": "乳糖水解的化學作用已知，是否就能保證兩菌都增加或發酵變快？",
      "why": "明確換到Ichimura優格預水解研究，用糖端點與菌株別CFU檢查機理候選的缺環。它不是LP95豆奶的下一段，不能借前站的時間、n或log規則替本表補值。",
      "ready": "能分產酵素宿主與starter、名義處理組與速率、糖及兩菌CFU端點，並提出能縮小機理缺口的相符時間／代謝證據；保留<0.03、未知±類型與採樣時點。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "carb-yogurt-lactose-fate",
          "title": "乳糖少了，碳去了哪裡？",
          "why": "若把乳糖水解當乳酸發酵，先分糖苷鍵切斷與碳的後續去向。",
          "href": "#learn/carbohydrates/carb-yogurt-lactose-fate/understand",
          "requiredGate": false
        },
        {
          "subject": "microbiology",
          "lessonId": "micro-plate-count",
          "title": "一個菌落，不保證只有一個細胞",
          "why": "若由CFU端點推生長速率，回到測量對象與方法。",
          "href": "#micro/micro-measurement/micro-plate-count/understand",
          "requiredGate": false
        },
        {
          "subject": "microbiology",
          "lessonId": "micro-starter-cultures",
          "title": "發酵種要完成什麼工作？",
          "why": "若只用終點pH或速度排名，回到菌種角色與評價目標。",
          "href": "#micro/micro-fermentation/micro-starter-cultures/understand",
          "requiredGate": false
        }
      ]
    }
  ],
  "branches": [
    {
      "id": "production-role",
      "title": "把微生物當工廠，還是食品成分？",
      "question": "題目談precision fermentation時，宿主、目標成分與最終食品各是什麼？",
      "why": "這是生產目的與產品身分的分支，不能由碳／NAD帳直接回答。",
      "lessonRefs": [
        {
          "subject": "microbiology",
          "lessonId": "micro-precision-fermentation",
          "title": "微生物是工廠，還是食品本身？",
          "why": "辨生產宿主、目標成分、回收與功能證據。",
          "href": "#micro/micro-fermentation/micro-precision-fermentation/understand",
          "requiredGate": false
        }
      ],
      "boundary": "用語仍有來源範圍；細胞外產物不代表純度、效力或安全已驗證，不提供工程／生產操作。"
    },
    {
      "id": "regulation",
      "title": "為什麼變慢：回饋、原料還是輔因子？",
      "question": "產物回頭調節，與缺底物、缺NAD或酵素受損有何不同？",
      "why": "把主線的NAD可行性接到多限制辨識，防止把所有停止都命名為feedback inhibition。",
      "lessonRefs": [
        {
          "subject": "microbiology",
          "lessonId": "micro-feedback-inhibition",
          "title": "產物回頭調節，與原料不足有何不同？",
          "why": "以明示概念門區分終產物調節與其他限制。",
          "href": "#micro/micro-fermentation/micro-feedback-inhibition/understand",
          "requiredGate": false
        }
      ],
      "boundary": "布林門是原創概念示例，未提供實測通量、速率或基因調控預測；回饋不自動等於競爭結合。"
    },
    {
      "id": "cheese",
      "title": "乾酪如何形成結構？",
      "question": "天然乾酪與加工乾酪，同樣成塊是否代表同一機制？",
      "why": "由微生物／酵素／酸化的角色轉向蛋白與水分、乳化和產品端點，回答食品機制比較。",
      "lessonRefs": [
        {
          "subject": "processing",
          "lessonId": "proc-cheese-process",
          "title": "天然與加工乾酪，同樣成為一塊的原因相同嗎？",
          "why": "按代表性乾酪類型分角色、結構與可比量測。",
          "href": "#process/proc-fermentation/proc-cheese-process/understand",
          "requiredGate": false
        }
      ],
      "boundary": "代表性食品類型與來源研究不拼成一批乾酪；不把pH或凝膠強度直接當風味、營養或安全。"
    },
    {
      "id": "beer",
      "title": "先供糖，再利用：每段改變什麼？",
      "question": "大麥、麥芽、麥汁與啤酒之間，糖化與酵母代謝能混稱同一反應嗎？",
      "why": "練酵素作用、可利用糖與微生物利用的角色鏈，避免從最終酒精或名稱倒推全部步驟。",
      "lessonRefs": [
        {
          "subject": "processing",
          "lessonId": "proc-malting-beer",
          "title": "大麥、麥芽、麥汁與啤酒，哪一段改變了什麼？",
          "why": "按階段追供糖與利用，有限澱粉連接示意只作概念。",
          "href": "#process/proc-fermentation/proc-malting-beer/understand",
          "requiredGate": false
        }
      ],
      "boundary": "局部切鍵例不是糖化產率、時間或生產曲線；不提供製麥／釀酒程序，也不移植主線LP95數據。"
    },
    {
      "id": "miso",
      "title": "減鹽改變了什麼，證據又量了什麼？",
      "question": "相同鹽標籤能替代配方、糖端點、菌量與風味證據嗎？",
      "why": "把主線的端點／機制辨識遷移到配方混雜與未測項，避免由單因素名稱指定整個群落。",
      "lessonRefs": [
        {
          "subject": "microbiology",
          "lessonId": "micro-miso-salt-evidence",
          "title": "減鹽味噌：同一個鹽標籤，能代替哪些證據？",
          "why": "讀固定味噌研究的配方、端點及未測／未檢出差別。",
          "href": "#micro/micro-fermentation/micro-miso-salt-evidence/understand",
          "requiredGate": false
        }
      ],
      "boundary": "味噌研究、醬油GC資料與LP95預試不是同一食品或批次；濃度差不是通量、風味優劣或減鹽安全保證。"
    },
    {
      "id": "physical-state",
      "title": "固態／液態模式回答的是哪個問題？",
      "question": "支撐與自由液相，如何改變傳遞、取樣與回收的假說？",
      "why": "這是食品製程物理分類分支，與生化路徑及有氧／無氧分類分開，依題目才選讀。",
      "lessonRefs": [
        {
          "subject": "processing",
          "lessonId": "proc-fermentation-physical-state",
          "title": "發酵物理狀態：支撐、傳遞與條件性取捨",
          "why": "由支撐與連續液相辨識模式、限定食品階段。",
          "href": "#process/proc-fermentation/proc-fermentation-physical-state/understand",
          "requiredGate": false
        },
        {
          "subject": "processing",
          "lessonId": "proc-fermentation-comparison",
          "title": "怎樣設計一組可比較的發酵試驗？",
          "why": "需要比較實驗時再定對照、共同端點與分母。",
          "href": "#process/proc-fermentation/proc-fermentation-comparison/understand",
          "requiredGate": false
        }
      ],
      "boundary": "Smits的LSF／SmF詞彙與Btk27研究各有範圍；兩組各自正規化的100%不表示相同絕對活性，模式名稱不給產率或安全。"
    },
    {
      "id": "soy-gc-endpoint",
      "title": "揮發物端點怎樣支持風味主張？",
      "question": "醬油混合接種，某化合物相對峰面積較高就代表更好喝或通量較大嗎？",
      "why": "這是另一種量測對象的選讀；固定化合物與方法，練習訊號、感官及機理主張的界線。",
      "lessonRefs": [
        {
          "subject": "microbiology",
          "lessonId": "micro-soy-fermentation-evidence",
          "title": "醬油混合接種，香氣會更多嗎？",
          "why": "把GC端點留在原研究、化合物、方法與作者比較內。",
          "href": "#micro/micro-fermentation/micro-soy-fermentation-evidence/understand",
          "requiredGate": false
        }
      ],
      "boundary": "Lee研究的三個月GC端點不是LP95豆奶時間序列，也不是Ichimura糖／菌數表；另一條日本式含小麥製程不補進此大豆研究。"
    }
  ]
},
{
  "id": "thermal-evidence-chain",
  "title": "有了熱歷程，還缺哪種證據？",
  "description": "先分局部溫度與有限測點，再做條件式累積，最後按主張辨認確效、監測與查核；熟悉基礎可直接診斷遷移。",
  "outcome": "面對未見產品或文件組合，能分清傳熱模型、已測範圍、作用參數與證據用途，保留可支持的結論並指出還缺的產品、量測或系統依據嗎？",
  "boundary": "沿用既有平板、肉湯／肉塊冷區及熱歷程活動，彼此不是同一食品、同一空間場或一條實測曲線。原創指標不是溫度或Fref；D/z與品質參數不是加工或安全排程。證據角色依用途判讀，不由儀器名稱固定分類。",
  "stations": [
    {
      "subject": "processing",
      "lessonId": "proc-heat-penetration-profile",
      "label": "先分介質、表面與中心",
      "prompt": "設備顯示相同溫度，食品各位置就有同一條歷程嗎？",
      "why": "先由有限對流與內部導熱理解位置差異，才知道設備設定不能代替食品測點；本課解析平板是機制模型，不是實測熱穿透。",
      "ready": "能區分Ti、T∞、Ts與中心T，並說明幾何、物性與邊界限制者，可直接進入第2站；Fo、Bi不熟時只補相應定義，不必先完成全部尺度算題。",
      "remedies": [
        {
          "subject": "processing",
          "lessonId": "proc-heat-transfer",
          "title": "熱需求相同，升溫速度仍可不同",
          "why": "若把總熱需求或穩態熱流當中心升溫時間，先分熱量、熱流與非穩態。",
          "href": "#process/proc-energy/proc-heat-transfer/understand",
          "requiredGate": false
        },
        {
          "subject": "processing",
          "lessonId": "proc-heat-penetration-scale",
          "title": "厚度加倍，先說固定什麼",
          "why": "Fo是αt/L²的無因次傳熱時間尺度，不是累積致死等效時間。",
          "href": "#process/proc-thermal-processing/proc-heat-penetration-scale/understand",
          "requiredGate": false
        }
      ]
    },
    {
      "subject": "processing",
      "lessonId": "proc-temperature-history",
      "label": "從候選冷區到有限取證",
      "prompt": "某時較冷、已測指標最小與全產品最低作用位置，是同一個結論嗎？",
      "why": "沿用既有肉湯／肉塊冷區工作台，先提機制假說與有限測點，再限定觀察範圍；不能把原創指標當溫度或Fref，也不能把中心預設成所有產品的冷點。",
      "ready": "能區分瞬間排序、同一位置完整歷程、樣本最小與全域未知，並說明加測哪些位置能縮小何種缺口者，可跳到第3站。",
      "remedies": [
        {
          "subject": "processing",
          "lessonId": "proc-heat-penetration-profile",
          "title": "介質、表面與中心，不是同一溫度",
          "why": "若仍用介質取代食品位置溫度，回到對流／導熱與位置歷程。",
          "href": "#process/proc-thermal-processing/proc-heat-penetration-profile/understand",
          "requiredGate": false
        },
        {
          "subject": "processing",
          "lessonId": "proc-equivalent-time",
          "title": "把熱歷程換成等效時間",
          "why": "若Fref、Tref或z尚不熟，先讀條件式加權時間；不把冷區指標代入這個式子。",
          "href": "#process/proc-thermal-processing/proc-equivalent-time/understand",
          "requiredGate": false
        }
      ]
    },
    {
      "subject": "processing",
      "lessonId": "proc-equivalent-time",
      "label": "計算先寫清參考與模型",
      "prompt": "給定一個位置的T(t)，Fref、Dref與log下降各回答什麼？",
      "why": "Fref依指定Tref與z把局部歷程加權成時間；只有適用的D/z與同一目標前提下，才可再算模型下降。正確加總不能代替參數適用性或全場量測。",
      "ready": "能分Fo無因次與Fref時間、Tref參考溫度與實際T(t)、D的時間與z的溫差，並在固定參數條件下解釋積分者，可直接進入證據判讀。",
      "remedies": [
        {
          "subject": "microbiology",
          "lessonId": "micro-decimal-reduction",
          "title": "每一個 D，都剩原來的十分之一",
          "why": "D是指定條件下一個十進位下降的時間；不把3D當30%。",
          "href": "#micro/micro-control/micro-decimal-reduction/understand",
          "requiredGate": false
        },
        {
          "subject": "microbiology",
          "lessonId": "micro-z-temperature",
          "title": "z 描述 D 對溫度的敏感度",
          "why": "z描述D對溫差的敏感度，不能單看z排名所有溫度耐受。",
          "href": "#micro/micro-control/micro-z-temperature/understand",
          "requiredGate": false
        },
        {
          "subject": "processing",
          "lessonId": "proc-heat-penetration-scale",
          "title": "厚度加倍，先說固定什麼",
          "why": "若把Fourier Fo當Fref，核對αt/L²的量綱與用途。",
          "href": "#process/proc-thermal-processing/proc-heat-penetration-scale/understand",
          "requiredGate": false
        }
      ]
    },
    {
      "subject": "processing",
      "lessonId": "proc-thermal-validation",
      "label": "每份證據覆蓋哪個範圍？",
      "prompt": "設備熱分布、食品熱穿透、感測器紀錄與公式測試，各支持什麼？",
      "why": "把供熱分布、局部食品歷程、量測可靠性與程式按式運作分開，才不會用一份報告填滿整條證據鏈；產品或配置改變也可能讓舊資料不再適用。",
      "ready": "能為每份資料說出對象、條件、支持的主張與未覆蓋處，並區分固定偏差敏感度示例與真實誤差資格者，可進入第5站的用途判讀。",
      "remedies": [
        {
          "subject": "processing",
          "lessonId": "proc-temperature-history",
          "title": "加熱介質與食品冷點",
          "why": "若把有限測點結果擴成全產品證明，補空間覆蓋與歷程。",
          "href": "#process/proc-thermal-processing/proc-temperature-history/understand",
          "requiredGate": false
        },
        {
          "subject": "processing",
          "lessonId": "proc-equivalent-time",
          "title": "把熱歷程換成等效時間",
          "why": "若把溫度誤差直接當同百分比F誤差，先核對指數權重與指定z。",
          "href": "#process/proc-thermal-processing/proc-equivalent-time/understand",
          "requiredGate": false
        }
      ]
    },
    {
      "subject": "microbiology",
      "lessonId": "micro-process-validation",
      "label": "按用途分確效、監測與查核",
      "prompt": "這份證據是在建立程序依據、追蹤本次受控，還是檢視系統依設計運作？",
      "why": "證據角色取決於欲支持的主張、對象與時點，不由器材或文件名稱唯一決定。純抽樣機率題保留自己的用途，不能當三種角色已學會。",
      "ready": "能在新情境中逐項說用途、理由、適用範圍及缺口，保留同份材料可有不同用途的條件；先獨立作答再修訂，不以點擊或算對抽樣式當掌握。",
      "remedies": [
        {
          "subject": "processing",
          "lessonId": "proc-thermal-validation",
          "title": "從計算結果走到製程證據",
          "why": "若把軟體測試、設備分布與產品歷程互相替代，補每種資料支持範圍。",
          "href": "#process/proc-thermal-processing/proc-thermal-validation/understand",
          "requiredGate": false
        },
        {
          "subject": "microbiology",
          "lessonId": "micro-sampling-probability",
          "title": "全陰性結果與抽樣機率",
          "why": "若把全陰性改寫成整批零污染，補給定p的正向機率與方法限制；這是選讀支線。",
          "href": "#micro/micro-measurement/micro-sampling-probability/understand",
          "requiredGate": false
        }
      ]
    }
  ],
  "branches": [
    {
      "id": "dz-remedy",
      "title": "D／z還不熟時，只補這兩個定義",
      "question": "時間、溫差、參考點與下降比例混在一起了嗎？",
      "why": "核心Fref判讀需要知道參數的量與適用前提；不要求先做完所有菌種或溫域比較。",
      "lessonRefs": [
        {
          "subject": "microbiology",
          "lessonId": "micro-decimal-reduction",
          "title": "每一個 D，都剩原來的十分之一",
          "why": "核對等溫、對數線性與D的時間意義。",
          "href": "#micro/micro-control/micro-decimal-reduction/understand",
          "requiredGate": false
        },
        {
          "subject": "microbiology",
          "lessonId": "micro-z-temperature",
          "title": "z 描述 D 對溫度的敏感度",
          "why": "核對固定參考D、z的溫差及外推範圍。",
          "href": "#micro/micro-control/micro-z-temperature/understand",
          "requiredGate": false
        }
      ],
      "boundary": "參數是題設示例，沒有真實食品或病原的核准條件；D/z計算不提供毒素失活或安全排程。"
    },
    {
      "id": "dimensionless-scale",
      "title": "尺寸與邊界：Fo、Bi各管什麼？",
      "question": "厚度加倍或Bi較小，究竟改變了哪一個模型條件？",
      "why": "遇尺度題再補無因次傳熱時間、熱阻比及近均溫資格，不把它們混成Fref或實測食品均溫證明。",
      "lessonRefs": [
        {
          "subject": "processing",
          "lessonId": "proc-heat-penetration-scale",
          "title": "厚度加倍，先說固定什麼",
          "why": "分同h與同Bi，使用Fo=αt/L²。",
          "href": "#process/proc-thermal-processing/proc-heat-penetration-scale/understand",
          "requiredGate": false
        },
        {
          "subject": "processing",
          "lessonId": "proc-thermal-size",
          "title": "大物體升降溫慢，慢在哪裡？",
          "why": "比較球的V/A、平均初始收支與近均溫篩選。",
          "href": "#process/proc-energy/proc-thermal-size/understand",
          "requiredGate": false
        }
      ],
      "boundary": "球與平板的長度定義、幾何與模型不同，不互傳參數；Bi篩選不是任意產品的固定誤差保證。"
    },
    {
      "id": "distribution-and-local-history",
      "title": "設備熱分布與產品內歷程分開看",
      "question": "看到了設備供熱與某個食品位置，還有哪些位置／條件未被代表？",
      "why": "若題目著重空間與量測設計，可從證據範圍回到局部歷程；不必把所有位置模型都列為主線必修。",
      "lessonRefs": [
        {
          "subject": "processing",
          "lessonId": "proc-thermal-validation",
          "title": "從計算結果走到製程證據",
          "why": "分設備供熱研究、產品熱穿透與量測可靠性。",
          "href": "#process/proc-thermal-processing/proc-thermal-validation/understand",
          "requiredGate": false
        },
        {
          "subject": "processing",
          "lessonId": "proc-heat-penetration-effects",
          "title": "同一塊食品，各處累積多少作用？",
          "why": "在明示平板模型中看兩個位置各自積分，防止局部值冒充全板平均。",
          "href": "#process/proc-thermal-processing/proc-heat-penetration-effects/understand",
          "requiredGate": false
        }
      ],
      "boundary": "解析平板或冷區示例指標都不是實際設備熱分布研究；兩個端點不代表連續空間全域。"
    },
    {
      "id": "measurement-and-sampling",
      "title": "樣本與方法：沒檢出能說到哪裡？",
      "question": "有限抽樣、檢測回收與全陰性結果，各還缺什麼？",
      "why": "這條支線回答量測與抽樣限制，補主張所需證據；它不取代確效／監測／查核用途判讀。",
      "lessonRefs": [
        {
          "subject": "microbiology",
          "lessonId": "micro-sampling-probability",
          "title": "全陰性結果與抽樣機率",
          "why": "分清給定p的條件機率與由結果推論未知p。",
          "href": "#micro/micro-measurement/micro-sampling-probability/understand",
          "requiredGate": false
        },
        {
          "subject": "microbiology",
          "lessonId": "micro-injured-cells",
          "title": "受傷細胞與檢測恢復偏差",
          "why": "比較方法各自基線及回收偏差，不把方法差直接當失活差。",
          "href": "#micro/micro-measurement/micro-injured-cells/understand",
          "requiredGate": false
        }
      ],
      "boundary": "僅教育性計算與既有來源資料，不提供培養、檢測或抽樣執行程序；未檢出不保證整批不存在。"
    },
    {
      "id": "temperature-sensitivity",
      "title": "溫度偏差與品質反應：別共用一個權重",
      "question": "同一熱歷程或同一Fref，為何不能推出相同品質保留？",
      "why": "遇測溫或品質題再區分作用目標、z與固定偏差假設，避免一條累積曲線替代全部反應。",
      "lessonRefs": [
        {
          "subject": "processing",
          "lessonId": "proc-thermal-validation",
          "title": "從計算結果走到製程證據",
          "why": "固定全程δT的敏感度示例，不能代替未知方向的±誤差校正。",
          "href": "#process/proc-thermal-processing/proc-thermal-validation/understand",
          "requiredGate": false
        },
        {
          "subject": "processing",
          "lessonId": "proc-thermal-quality",
          "title": "相同等效時間，品質會相同嗎？",
          "why": "同一指定歷程另用品質參數，保留模型及產品量測缺口。",
          "href": "#process/proc-thermal-processing/proc-thermal-quality/understand",
          "requiredGate": false
        }
      ],
      "boundary": "所有敏感度／品質參數限定教學模型；不輸出真實營養保留、微生物下降、安全或允收誤差。"
    }
  ]
},
{
  "id": "enzyme-evidence-chain",
  "title": "訊號變慢，是酵素哪裡變了？",
  "description": "先取可信初速，定義準穩態與飽和參數，再讀擬合、抑制與能區分解釋的證據；熟悉者可跳診斷，不必走完11課。",
  "outcome": "面對未見量測條件，能先限定訊號、窗口與校正，再說明適用模型、參數基準及仍無法辨認的機理，選出有用途的補證據而不只給抑制名稱嗎？",
  "boundary": "既有AU校正算例、指定MM耗損、原創μM參數題、Puromycin訊號資料與LPH／糖鏈3D各有範圍，沒有合成同一實驗。反應快慢不等於平衡改變；擬合或3D觀看不證明實際結合位置、食品效力或學會。",
  "stations": [
    {
      "subject": "chemistry",
      "lessonId": "enzyme-initial-rate",
      "label": "先問量到了什麼速率",
      "prompt": "訊號隨時間增加，哪個區段與哪條校正支持產物初速？",
      "why": "先區分樣品／配對空白斜率、校正靈敏度、產物濃度速率與整段平均，才有可放進動力學模型的量。新量測取證活動先處理這一層；原MM耗損曲線等模型基礎建立後再選讀。",
      "ready": "能說明空白漂移、校正與窗口各影響什麼，並把AU/時間換成對應產物濃度/時間者，可跳到模型或證據遷移；看過結果與點過窗口不當掌握。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "analysis-sampling-blank",
          "title": "先問測到誰，再看數字",
          "why": "若把背景扣除當成所有干擾已排除，先限定分析物、取樣與空白涵蓋範圍。",
          "href": "#learn/processing/analysis-sampling-blank/understand",
          "requiredGate": false
        },
        {
          "subject": "chemistry",
          "lessonId": "analysis-calibration-chain",
          "title": "從吸光值算回每 100 g",
          "why": "若訊號斜率直接當莫耳速率，補校正的單位、基質與適用範圍。",
          "href": "#learn/processing/analysis-calibration-chain/understand",
          "requiredGate": false
        },
        {
          "subject": "chemistry",
          "lessonId": "enzyme-catalysis",
          "title": "能障與反應方向",
          "why": "若把變快當平衡改變，先分能障、反應方向與同條件下的平衡常數。",
          "href": "#learn/enzymes/enzyme-catalysis/understand",
          "requiredGate": false
        }
      ]
    },
    {
      "subject": "chemistry",
      "lessonId": "enzyme-steady-state",
      "label": "模型先說清ES為何近穩定",
      "prompt": "ES庫存近似不變，是否表示結合平衡、通量為零或Km就是Kd？",
      "why": "先定E+S⇌ES→E+P、酵素守恆及流入／兩條流出的假設，才知道後續MM參數代表什麼；準穩態與熱力學平衡不能互換。",
      "ready": "能以ES生成和解離／催化流出說明準穩態，並分Km與Kd的適用前提者，可直接進第3站；不熟符號時先對照機構再算數。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "enzyme-catalysis",
          "title": "能障與反應方向",
          "why": "若把持續產物流與熱力學平衡混淆，回到方向與能障。",
          "href": "#learn/enzymes/enzyme-catalysis/understand",
          "requiredGate": false
        },
        {
          "subject": "chemistry",
          "lessonId": "enzyme-initial-rate",
          "title": "從產物曲線找初速",
          "why": "若把後段耗損或混合暫態當模型初速，回到量測窗口。",
          "href": "#learn/enzymes/enzyme-initial-rate/understand",
          "requiredGate": false
        }
      ]
    },
    {
      "subject": "chemistry",
      "lessonId": "enzyme-saturation",
      "label": "定義曲線與參數的基準",
      "prompt": "Vmax、Km與有效催化位濃度各扮演什麼角色？",
      "why": "先在指定單受質初速模型中定義Vmax和半高濃度Km，並說明Vmax=kcat×有效催化位濃度；才可進入參數估計。酵素毫克數、分子數與可用位點不自動相同，Km也不是普遍的結合Kd。",
      "ready": "能辨參數的量綱、模型條件及有效位點分母，且不把Vmax加倍直接說成每位點變快者，才有理由直接進擬合。若active-E診斷不通，先回補turnover；不以已作答表示已學會。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "enzyme-turnover",
          "title": "把 Vmax 換成每個活性位的周轉",
          "why": "具體補有效位點、寡聚分子、mg到mol與Vmax/kcat的分母。",
          "href": "#learn/enzymes/enzyme-turnover/understand",
          "requiredGate": false
        },
        {
          "subject": "chemistry",
          "lessonId": "enzyme-steady-state",
          "title": "ES 穩定，不等於結合平衡",
          "why": "若把半高濃度當微觀結合常數，補Km包含催化流出的模型前提。",
          "href": "#learn/enzymes/enzyme-steady-state/understand",
          "requiredGate": false
        }
      ]
    },
    {
      "subject": "chemistry",
      "lessonId": "enzyme-kinetic-fitting",
      "label": "模型與單位之後才取參數",
      "prompt": "哪些濃度與誤差尺度能分辨Vmax和Km，哪些資料只約束比值？",
      "why": "已定義模型後，再看原尺度殘差、受質範圍、重複點和參數辨識。原課μM無雜訊算例與Puromycin的ppm／counts資料是兩套材料，不能合併成食品酵素或kcat。",
      "ready": "能說出低濃度時主要限制Vmax/Km、倒數變換如何改變誤差、以及新基質／活性位或校正缺項者，可跳到第5站；擬合好不當機構已證明。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "enzyme-saturation",
          "title": "為什麼速率會飽和",
          "why": "先看模型式、Vmax／Km定義和適用條件，不先背軟體回傳值。",
          "href": "#learn/enzymes/enzyme-saturation/understand",
          "requiredGate": false
        },
        {
          "subject": "chemistry",
          "lessonId": "enzyme-initial-rate",
          "title": "從產物曲線找初速",
          "why": "若初速輸入來源不清，回查窗口與校正是否相符。",
          "href": "#learn/enzymes/enzyme-initial-rate/understand",
          "requiredGate": false
        },
        {
          "subject": "chemistry",
          "lessonId": "analysis-validation-prediction",
          "title": "先推算，再對照標稱",
          "why": "若把同資料的低殘差當外部驗證，補校準與未見樣本判讀。",
          "href": "#learn/processing/analysis-validation-prediction/understand",
          "requiredGate": false
        }
      ]
    },
    {
      "subject": "chemistry",
      "lessonId": "enzyme-inhibition",
      "label": "曲線相容，不是唯一機制",
      "prompt": "表觀Km與Vmax改變，能支持哪個指定模型，還排除不了什麼？",
      "why": "把已定義的初速曲線比較放在相同條件內，先提出模型相容性，再區分有效酵素量、訊號和其他機理；結合位置不能直接替代動力學分類。",
      "ready": "能在指定可逆模型下分競爭與純非競爭，且知道後者是混合特例、不是所有其他情況者，可直接做第6站的新條件取證。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "enzyme-saturation",
          "title": "為什麼速率會飽和",
          "why": "若曲線平台與半高濃度仍混淆，先補參數的讀法。",
          "href": "#learn/enzymes/enzyme-saturation/understand",
          "requiredGate": false
        },
        {
          "subject": "chemistry",
          "lessonId": "enzyme-mixed-inhibition",
          "title": "用兩個因子讀懂混合抑制",
          "why": "若需要α／α′、反競爭或一般混合情況，再走這條明示機構分支。",
          "href": "#learn/enzymes/enzyme-mixed-inhibition/understand",
          "requiredGate": false
        },
        {
          "subject": "chemistry",
          "lessonId": "enzyme-turnover",
          "title": "把 Vmax 換成每個活性位的周轉",
          "why": "若把Vmax下降直接指定抑制，補有效酵素量造成同曲線的替代解釋。",
          "href": "#learn/enzymes/enzyme-turnover/understand",
          "requiredGate": false
        }
      ]
    },
    {
      "subject": "chemistry",
      "lessonId": "enzyme-evidence-limits",
      "label": "把判斷連回需要的證據",
      "prompt": "已知哪些觀察，怎樣的對照能區分量測、有效位點與抑制解釋？",
      "why": "原課已有正確的校正反例、同曲線替代機制及有用途的對照練習；新伴讀補未見量測條件的取證，不把原有可用內容誤報成缺失，也不覆寫舊作答。",
      "ready": "能在未見條件下分支持的速率比較、尚未排除的解釋、需要的對照及適用範圍者，才有自己的掌握證據；需要時回第一站的新量測活動，初答與修訂分開。",
      "remedies": [
        {
          "subject": "chemistry",
          "lessonId": "enzyme-initial-rate",
          "title": "從產物曲線找初速",
          "why": "若對照只列名詞，回到配對空白、校正與窗口各自排除什麼。",
          "href": "#learn/enzymes/enzyme-initial-rate/understand",
          "requiredGate": false
        },
        {
          "subject": "chemistry",
          "lessonId": "enzyme-turnover",
          "title": "把 Vmax 換成每個活性位的周轉",
          "why": "若同Vmax或同曲線被當成同每位點催化，補有效位點與分母。",
          "href": "#learn/enzymes/enzyme-turnover/understand",
          "requiredGate": false
        },
        {
          "subject": "chemistry",
          "lessonId": "enzyme-kinetic-fitting",
          "title": "先在原尺度擬合，再檢查殘差",
          "why": "若只憑漂亮曲線或一個濃度命名機理，回查可辨識性與殘差。",
          "href": "#learn/enzymes/enzyme-kinetic-fitting/understand",
          "requiredGate": false
        }
      ]
    }
  ],
  "branches": [
    {
      "id": "active-sites",
      "title": "要比較每位點效率時，再走kcat分母",
      "question": "相同mg、相同寡聚體分子數，就有相同有效位點嗎？",
      "why": "這支回應酵素量與每位點周轉的題目；第3站不熟active-E時也是具體補救。",
      "lessonRefs": [
        {
          "subject": "chemistry",
          "lessonId": "enzyme-turnover",
          "title": "把 Vmax 換成每個活性位的周轉",
          "why": "按有效催化位莫耳濃度推kcat，再分總產物速率與濃度速率。",
          "href": "#learn/enzymes/enzyme-turnover/understand",
          "requiredGate": false
        }
      ],
      "boundary": "活性比例、分子量或位點等效性未知就保留缺項；不能由Puromycin counts或蛋白mg直接填kcat。"
    },
    {
      "id": "extended-reversible-models",
      "title": "題目需要時再分一般混合與反競爭",
      "question": "Km,app降低，是否代表結合更強或反應更快？",
      "why": "用α、α′追表觀參數，將純非競爭放回它的特殊條件，避免只背曲線名稱。",
      "lessonRefs": [
        {
          "subject": "chemistry",
          "lessonId": "enzyme-mixed-inhibition",
          "title": "用兩個因子讀懂混合抑制",
          "why": "先寫指定E／ES結合及ESI無活性模型，再看游離I與兩個因子。",
          "href": "#learn/enzymes/enzyme-mixed-inhibition/understand",
          "requiredGate": false
        }
      ],
      "boundary": "限指定線性可逆／快速結合模型，不能由形狀證明實際口袋、緊密結合或不可逆機制。"
    },
    {
      "id": "cleavage-and-3d",
      "title": "要解釋切哪個鍵，才用糖鏈空間分支",
      "question": "內切、非還原端外切與新還原端，各由哪個結構條件決定？",
      "why": "3D有助於辨認連接、端點與一次切點，補符號式不易看出的空間／機制問題；它不代替初速或參數證據。",
      "lessonRefs": [
        {
          "subject": "chemistry",
          "lessonId": "enzyme-specificity",
          "title": "酵素切哪一條鍵",
          "why": "比較α／β-amylase，從此課進入原有G5單次外切卡。",
          "href": "#learn/enzymes/enzyme-specificity/understand",
          "requiredGate": false
        },
        {
          "subject": "chemistry",
          "lessonId": "carb-starch-architecture",
          "title": "分支在哪裡，切後多出哪個端點？",
          "why": "若還原／非還原端與分支不熟，先用有限糖鏈追連接。",
          "href": "#learn/carbohydrates/carb-starch-architecture/understand",
          "requiredGate": false
        }
      ],
      "boundary": "G5卡只有指定一次水解與獨立3D端點，非完整催化軌跡、長時間產物分布或分支全降解。看過3D不作掌握標章。"
    },
    {
      "id": "human-lph",
      "title": "人體LPH：問題跨層級時才選讀",
      "question": "單鏈同源區、二聚組裝、局部催化與LCT調控，是同一種證據嗎？",
      "why": "用具體人類酵素分清結構、成熟、基因表現和切鍵；適合已具基礎者的專題，不是所有Km題的先備。",
      "lessonRefs": [
        {
          "subject": "chemistry",
          "lessonId": "enzyme-human-lactase",
          "title": "人體乳糖酶：組裝、催化與基因調控",
          "why": "追LCT→前驅物→成熟二聚體及LPH局部水解，按來源層級解釋。",
          "href": "#learn/enzymes/enzyme-human-lactase/understand",
          "requiredGate": false
        }
      ],
      "boundary": "AlphaFold單鏈預測及獨立局部化學分鏡不是實驗二聚體、結合姿勢、時間軌跡或個人症狀證據；不與微生物製劑混為同一蛋白。"
    },
    {
      "id": "measurement-controls",
      "title": "若訊號／基質仍有疑問，回分析鏈",
      "question": "空白扣除、校正與回收各能涵蓋哪一段偏差？",
      "why": "直接補第一站量測所需的概念，不把整個分析章都列為必修。",
      "lessonRefs": [
        {
          "subject": "chemistry",
          "lessonId": "analysis-sampling-blank",
          "title": "先問測到誰，再看數字",
          "why": "界定分析物、試料代表性與空白涵蓋的背景。",
          "href": "#learn/processing/analysis-sampling-blank/understand",
          "requiredGate": false
        },
        {
          "subject": "chemistry",
          "lessonId": "analysis-calibration-chain",
          "title": "從吸光值算回每 100 g",
          "why": "界定標準、訊號靈敏度、單位與轉換範圍。",
          "href": "#learn/processing/analysis-calibration-chain/understand",
          "requiredGate": false
        }
      ],
      "boundary": "分析課GOPOD等例與酵素初速資料不是同一樣品或產物；可轉移判讀問題，不能直接借用校正斜率或方法性能。"
    }
  ]
}
];
