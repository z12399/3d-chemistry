import {LEARNING_SUBJECTS} from './learning-subjects.js';
import {LEARNING_PATHS} from './learning-paths-data.js';
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
// Reviewed station explanations only; existing manifest, lessons, routes and drafts stay owned by their original modules.
export const REVIEWED_PATH_TRANSITIONS=freeze([
  {
    "pathId": "powder-moisture",
    "subject": "chemistry",
    "lessonId": "water-activity",
    "why": "先分開「有多少水」與「水的化學勢相關狀態」，下一站才知道為何不同材料在同一 aw 下可有不同含水量。這裡的 ERH 換算只適用同溫、已平衡的記錄。",
    "ready": "能把同溫平衡 ERH 75% 換成 aw 0.75，並說清這不是 75% 含水量；若能做到，可直接比較下一站的等溫線。",
    "remedies": [
      {
        "subject": "processing",
        "lessonId": "proc-mass-basis",
        "why": "只回看定義式與第一段：濕基以整份濕料、乾基以乾物質作分母，再回本題區分含水量與 aw。"
      }
    ]
  },
  {
    "pathId": "powder-moisture",
    "subject": "chemistry",
    "lessonId": "water-sorption-comparison",
    "why": "前站定義 aw，這站把指定材料在固定溫度、相應吸濕／脫濕路徑的平衡 aw 接到含水量；下一站才有水質量分率可用來討論非晶相塑化。各站材料與參數不同，不能把示例兩條線當成同一粉末實測。",
    "ready": "能指出 GAB 橫軸 aw、縱軸乾基 X 的身分，將 100 g 乾物質加 10 g 水分成 X=0.10 與濕基約 9.09%，並說明換溫度後需要相符的等溫線。",
    "remedies": [
      {
        "subject": "chemistry",
        "lessonId": "water-activity",
        "why": "回看定義式的同溫／平衡條件，避免把環境任一 RH 直接當作食品當下 aw。"
      },
      {
        "subject": "processing",
        "lessonId": "proc-mass-basis",
        "why": "回看 w=X/(1+X) 與乾物質守恆前提，補分母換算。"
      }
    ]
  },
  {
    "pathId": "powder-moisture",
    "subject": "chemistry",
    "lessonId": "processing-glass-plasticization",
    "why": "這站把含水量連到均一非晶相的 Tg 與觀察溫度相對位置，為「相同溫度下為何可能更容易變形」提出機制線索。下一站再問包材能否改變進水條件；GT 不是吸水速率或結塊時間模型。",
    "ready": "能由乾物質／水算濕基 w，用 K 代入本課指定 GT 式，再比較 T 與 Tg；能把塑化傾向和實際結塊速率、保存期限分開。",
    "remedies": [
      {
        "subject": "chemistry",
        "lessonId": "processing-glass",
        "why": "回看兩段正文與公式 note：玻璃轉移是組成與量測條件相依的區間，先分開 Tg、aw 與含水量。"
      },
      {
        "subject": "processing",
        "lessonId": "proc-mass-basis",
        "why": "回看水質量分率 w 的分母，避免把乾基 X 直接放進 GT。"
      }
    ]
  },
  {
    "pathId": "powder-moisture",
    "subject": "processing",
    "lessonId": "proc-package-barriers",
    "why": "粉末吸濕的可能後果已分清，現在檢查水如何穿過包材。指定相同穩態梯度時，WVTR×面積×時間可估膜片透水量。本課觀察工具另用氧氣展示分壓邊界；可借它理解「常材性不等於常通量」，不能把其中氧氣參數或數字換名成 WVTR。",
    "ready": "能在題設條件不變時算 0.5×0.06×10=0.30 g 透水，列明需對齊的溫濕度、厚度、梯度與單位，並區分膜片量、整包性能和食品含水變化。",
    "remedies": [
      {
        "subject": "processing",
        "lessonId": "proc-package-barriers",
        "why": "先回看原理第一段與公式 note，核對 OTR／WVTR 的物質及測試條件；若操作氧氣工具，再看其「模型假設與未計算的部分」。"
      }
    ]
  },
  {
    "pathId": "powder-moisture",
    "subject": "microbiology",
    "lessonId": "micro-hurdles",
    "why": "前幾站談物性與進水，這站另外定義微生物端點。aw 可成為生長條件的一部分；同時要看 pH、溫度、氣體、基質與歷史。原表格活動是限定條件分類，不是這份粉末的生長曲線或消除量。",
    "ready": "能為題設的 pH／aw／指標結果寫一句有條件的比較，說明抑制生長與消除、毒素或整批危害各需不同證據；低 aw 本身不作安全判定。",
    "remedies": [
      {
        "subject": "microbiology",
        "lessonId": "micro-plate-count",
        "why": "回看第一段的 CFU 身分與第二段的未檢出界線，先說清比較的指標及方法。"
      }
    ]
  },
  {
    "pathId": "heat-quality",
    "subject": "chemistry",
    "lessonId": "protein-heat-quality",
    "why": "比較加熱前，先說要改善的是抑制因子、胺基酸可利用性、營養評價還是食品功能；同一處理可能使不同端點朝不同方向變化。下一站才把這些反應放回食品實際收到的熱歷程。",
    "ready": "能畫或描述「適度處理可能降低抑制因子、過度處理可能損及可利用性」的條件式取捨，分清 PER 動物端點與體外消化指標；不由一條較低的抑制因子曲線直接判最佳處理。",
    "remedies": [
      {
        "subject": "chemistry",
        "lessonId": "protein-denaturation",
        "why": "回看結構歷程及 note：展開、聚集與肽鍵水解不同，先把候選機制分開。"
      },
      {
        "subject": "chemistry",
        "lessonId": "protein-alternative-quality",
        "why": "回看兩段正文與成分比值公式，先分量、參考需求與消化方法的證據身分。"
      }
    ]
  },
  {
    "pathId": "heat-quality",
    "subject": "processing",
    "lessonId": "proc-temperature-history",
    "why": "蛋白站的反應只在其條件下成立；設備設定並不是食品每一位置收到的熱。先比較 T(x,t)，再到下一站依相符模型累積作用。此站冷區活動用另一組合成觀察練空間抽樣，沒有把指數當作實際溫度或 Fref。",
    "ready": "能說明為何要用食品測點而非加熱介質溫度；能分開瞬間最冷點與全程累積最小作用位置，並保留未測空間範圍。",
    "remedies": [
      {
        "subject": "processing",
        "lessonId": "proc-heat-transfer",
        "why": "回看兩段正文：內部導熱與表面對流熱阻不同；公式是穩態平板熱流，不能直接當中心升溫時間。"
      }
    ]
  },
  {
    "pathId": "heat-quality",
    "subject": "processing",
    "lessonId": "proc-equivalent-time",
    "why": "前站提供局部完整歷程，這站才用無因次溫度權重把各時間段換成同一 Tref 的 Fref。只有目標、基質、參考與模型配對後，Fref/Dref 才能接到 log 減量；下一站另用品質反應參數比較另一端點。",
    "ready": "能逐段算 10^[(T−Tref)/z]Δt，核時間單位，並將 Fref（時間）、Llog（log 減量）與 Fo（無因次傳熱量）分開；Dref 未給或不相符時不硬算減量。",
    "remedies": [
      {
        "subject": "microbiology",
        "lessonId": "micro-decimal-reduction",
        "why": "回看原理第 1、3 段與公式，先把固定條件的 t/D、10^(−L) 及觀測單位接起來。"
      },
      {
        "subject": "processing",
        "lessonId": "proc-temperature-history",
        "why": "回看第二段對 Tref／Dref／z 的首次定義，核對本題參考及局部歷程。"
      }
    ]
  },
  {
    "pathId": "heat-quality",
    "subject": "processing",
    "lessonId": "proc-thermal-quality",
    "why": "相同微生物 Fref 是同一響應的比較，沒有自動約束另一項品質反應。用本課指定 zq、Dq 與單一一階模型另算品質作用量，便能正面比較；改變 zq 與 z 的關係時，排序也要重做。",
    "ready": "能解釋本課理想定溫算例為何在 zq>z 時高溫短時品質作用量較小，並用 zq=z 或 zq<z 的不同題設重新判斷；不將任一示例比例套到真實食品或所有品質指標。",
    "remedies": [
      {
        "subject": "processing",
        "lessonId": "proc-equivalent-time",
        "why": "回看 Fref 積分的參考／單位條件，接著在本課把微生物與品質各自的參數列成兩欄。"
      }
    ]
  },
  {
    "pathId": "heat-quality",
    "subject": "microbiology",
    "lessonId": "micro-process-validation",
    "why": "前站得到的是模型量，最後要問證據回答哪個任務：指定設計有能力達目標、本次操作符合要求，或制度／紀錄按計畫運作。相同文件可服務不同問題；須讀內容是否對應產品、目標與當次操作，不靠文件名稱或簽名猜角色。",
    "ready": "能就一份新資料包各寫支持的結論、引用欄位與適用條件，分開確效、監測、查核；知道本課原 (1−p)^n 練習只處理 IID 漏檢模型，不能替代三角色的遷移。",
    "remedies": [
      {
        "subject": "microbiology",
        "lessonId": "micro-process-validation",
        "why": "先回看正文第 1 段的三種角色定義與第 2 段的用途區分，再到本課「檢查理解」中的熱製程證據活動；缺的是證據對應時，不必重做整個抽樣算例。"
      },
      {
        "subject": "microbiology",
        "lessonId": "micro-plate-count",
        "why": "若把未檢出寫成零，回看第二段的受測份量、方法與檢出能力界線。"
      }
    ]
  },
  {
    "pathId": "juice-concentration",
    "subject": "processing",
    "lessonId": "proc-concentration-balance",
    "why": "先用同一系統的總量與不揮發固形物量定位濃縮效應。這能算出理想產品與移除水量，下一站再問每 100 g 含量提高時，營養總量是否也保留。水出口流量與加熱用蒸汽耗量是兩個問題。",
    "ready": "能從 500 kg/h、20% 到 50% 算出固形物 100、產品 200、蒸發水 300 kg/h，並閉合水收支；若出口有固形物，會擴充收支而非套純水假設。",
    "remedies": [
      {
        "subject": "processing",
        "lessonId": "proc-mass-basis",
        "why": "回看分母與系統邊界：先辨質量分率，再列進出及累積，避免把兩個百分比直接相減作移除量。"
      }
    ]
  },
  {
    "pathId": "juice-concentration",
    "subject": "chemistry",
    "lessonId": "vitamin-true-retention",
    "why": "濃縮可改變每單位食品的濃度，保留率則需要相容分析物與食用範圍的總量帳。原工具用另一份固體／湯汁示例，新取證任務再分配料加入與原料來源；兩者都不是上一站那批果汁的資料。",
    "ready": "能選同一分析物及報告基準，以各部分濃度×份量相加再除原料總量；能分食用餐的總量比與原料來源留存，知道加入量不等於食用部分中加入來源的剩餘量。",
    "remedies": [
      {
        "subject": "chemistry",
        "lessonId": "vitamin-solubility",
        "why": "回看第二段與物料去向：溶入湯汁和化學降解不同，先決定題目是否食用湯汁。"
      },
      {
        "subject": "chemistry",
        "lessonId": "vitamin-c-assay-identity",
        "why": "回看第一段：AA 專一結果與含 DHA 的總 C 定義不同，前後需相容。"
      }
    ]
  },
  {
    "pathId": "juice-concentration",
    "subject": "chemistry",
    "lessonId": "browning-ascorbic-pathways",
    "why": "營養總量和顏色是不同端點。這站把 AA 暫時還原醌、AA 氧化成 DHA 及後續／非氧化降解分開，據此選 AA、DHA、羰基與顏色的時間資料，判斷「AA 較多」是否真的伴隨「褐變較少」。",
    "ready": "能對低氧組 AA 較多但仍褐變提出具條件的機制假說與相符對照；也能指出單一糠醛訊號尚不能唯一追溯至 AA，並說出需要哪類來源證據。",
    "remedies": [
      {
        "subject": "chemistry",
        "lessonId": "vitamin-c-redox",
        "why": "回看兩段正文與半反應 note，先分 AA、DHA 的氧化還原與後續不可逆降解，再回本課兩條支路。"
      }
    ]
  },
  {
    "pathId": "juice-concentration",
    "subject": "microbiology",
    "lessonId": "micro-spoilage-indicators",
    "why": "變褐與營養改變不能代替微生物證據。最後將感官、指定方法的一般菌數與特定危害分欄：題設 A／B 指標可算 1000 倍，但這個指標比不是危害或可食用性的比。",
    "ready": "能各寫一句可支持的指標比較與尚未支持的危害結論，補出目標、方法、取樣量／分布及檢出能力；未檢出只回到樣本條件，不寫成整批為零。",
    "remedies": [
      {
        "subject": "microbiology",
        "lessonId": "micro-plate-count",
        "why": "回看 CFU 身分與等效原樣量，先確認數字同方法同基準；需要理解零結果時再看第二段。"
      }
    ]
  }
]);
export function withReviewedPathTransition(path,station,courses={}){
 if(!path||!station||station.available!==true||typeof station.why==='string'&&station.why.trim())return station;
 const matches=REVIEWED_PATH_TRANSITIONS.filter(n=>n.pathId===path.id&&n.subject===station.subject&&n.lessonId===station.lesson?.id);if(matches.length!==1)return station;
 const note=matches[0],known=LEARNING_PATHS.filter(p=>p.id===path.id);if(known.length!==1||!Array.isArray(path.stations)||path.stations.filter(s=>s.subject===note.subject&&s.lessonId===note.lessonId).length!==1||known[0].stations.filter(s=>s.subject===note.subject&&s.lessonId===note.lessonId).length!==1)return station;
 const meta=LEARNING_SUBJECTS[note.subject],course=courses?.[note.subject];if(!meta||!Array.isArray(course?.topics)||(course.routeRoot!==undefined&&course.routeRoot!==meta.root))return station;
 const entries=course.topics.flatMap(topic=>(topic.lessons??[]).filter(l=>l.id===note.lessonId).map(lesson=>({topic,lesson})));if(entries.length!==1||entries[0].lesson!==station.lesson||entries[0].topic!==station.topic)return station;
 return {...station,why:note.why,ready:note.ready,remedies:note.remedies.map(r=>({...r}))};
}
