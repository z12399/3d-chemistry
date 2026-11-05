# 交接說明

最後更新：2026-11-05（Claude 接續 11/04 的交接，補完 8 個無對應課程的評分要點）

## 這個專案

「食品科學學習室」：臺大食科所三專業科（食品化學、食品加工學、食品微生物學）的備考與 3D 分子學習網站。純靜態網站（GitHub Pages，根目錄有 `.nojekyll`），沒有建置步驟；作答與學習紀錄都存在瀏覽器 localStorage。

## 發布慣例（改之前一定要先看）

- **每次發布都是 `versions/<名稱>-<日期>/` 下的完整快照**（約 945 個檔案）。既有版本目錄不再修改；要改就複製最新版成新目錄。
- **根目錄 `index.html` 只負責轉址**到目前公開的版本。根目錄其他檔案（`*.css`、`modules/`、`data/` 等）是早期的工作副本（比 visual-refresh 舊，也不完全等於任何一個版本目錄），公開網站不會載入它們；改這些檔案不會上線。
- 慣例是兩個 commit：先「Add … site version」新增版本目錄，驗證後再「Open the … site version」把根 `index.html` 指過去。
- 所有版本同源，localStorage 共用：備考紀錄的 key 前綴是 `food-exam-evidence-v1:`，學習紀錄如 `food-chemistry-learning-v1`。**不要改儲存格式**，否則換版後讀不到使用者的舊紀錄。
- 版本歷程：
  - 10/28–29：`water-v3`、`assessment-five`、`workbench-clarity`、`rheology-keyboard`、`evap-water-remedy`
  - 10/30：`visual-refresh-20261030`（Claude，視覺更新）
  - 11/02：`exam-preparation-20261102`（GPT，備考工作區）
  - 11/04：`learning-flow-20261104`（Claude，補完學習流程）
  - 11/05：`gap-lessons-20261105`（Claude，本次，補 5 課，涵蓋原本沒有課程的 8 個評分要點；現行公開版本）

## 接手時的狀態

GPT 最後完成 `exam-preparation-20261102`：歷屆原題作答、封存原稿、逐項自評、缺口對應課程、限時整卷、草圖、匯出／匯入備考紀錄。repo、issue、PR 都沒有留交接文件。

實際走一遍「寫原題 → 自評 → 點缺口課程 → 讀課 → 回原題重寫」後，備考端都正常，斷點集中在**課程端**：

1. 從缺口連結進課程後，只要按「觀察變化」或「檢查理解」，網址裡的 `examReturn`／`examAttempt` 就消失，「回到這次作答」跟著不見。作答頁的說明卻寫著「讀完課程後，按課程頁的『回到這次作答』」。
2. 課程頁只寫「你正在補『某題』的內容」，沒說是哪一個要點缺口。
3. 讀完「檢查理解」之後沒有補課的下一步；主按鈕「下一題」照章節順序走，會把人帶離補課清單。
4. 「再練一次」會重新渲染頁面，備考區塊就消失了。
5. 從課程開 3D 反應台再回來，備考情境也會丟失（梅納反應這題的 3 課都會遇到）。

## 這次做了什麼（`versions/learning-flow-20261104`）

- **補課焦點（課程頁頂部，三個步驟都有）**：顯示這一課對應的自評缺口（要點、自評等級、課程範圍說明）、「回到這次作答」，以及「補課清單第 n／N 課」。
- **檢查理解之後的「接下來」**：依這份原稿的自評列出所有缺口課程並標示目前這一課；主按鈕是「下一課」，旁邊是「回到這次作答，準備重寫」；沒有對應課程的要點會另外列出。補課情境下，章節順序的「下一題」降為次要連結。
- **保留情境**：同一課的步驟連結、筆記返回、練習重新渲染、3D 活動往返（包含在 3D 台上重新整理）都保留 `examReturn`／`examAttempt`。
- **一般造訪**：原本放在課程頂部的「這一課，我真的會用了嗎？」移到檢查理解之後，因為它的標題就是「學完，試著用在考題上」。
- 基礎診斷（選擇題）進來的課程，結尾提供「換一道未看過的題檢查」。

和上一版相比改了 6 個檔案：

| 檔案 | 內容 |
| --- | --- |
| `modules/exam-return.js`（新增） | 讀寫網址裡的 `examReturn`／`examAttempt`，含格式驗證 |
| `modules/exam-learning-bridge.js` | 補課清單、頂部焦點、檢查後的下一步；`examRemedyHref` 輸出與舊版逐一比對一致（882 組） |
| `modules/learning.js` | `stepPath()`（同一課的連結帶上備考情境）、`onRender` 掛鉤、補課時降級章節「下一題」 |
| `modules/app.js` | 透過 `onRender` 掛上兩塊區塊（避開過期渲染）；`learningReturnPath()` 保留備考參數，3D 往返才一致 |
| `modules/exam-written.js` | 一句說明文字改成新流程 |
| `exam-learning-bridge.css` | 新區塊樣式（含手機版） |

### 設計決定

- **備考情境只放在網址**，重新整理、分享都會保留；沒有新增任何 storage。
- **學習路徑（`?path=`）和備考情境互斥**：`pathContext()` 要求網址只有 `path` 一個參數，所以在路徑裡就不加備考參數。
- **補課清單不標「已讀」**：這個專案一貫的立場是「讀過不等於學會」，只有重寫並重新自評才會改變備考進度；備考總覽會拿最新自評和首次獨立原稿逐項比較。

## 11/05 補課內容（`versions/gap-lessons-20261105`）

以 `learning-flow-20261104` 為基礎複製。學習流程程式碼沒有改動；只新增資料與 5 個簡式課程（無互動活動，體例同 `protein-denaturation`：說明、等式、例子、迷思、一題測驗、來源）：

| 新課程 | 所在主題 | 補上的評分要點 |
| --- | --- | --- |
| `browning-maillard-water` 水活性越高，梅納反應就越快嗎？ | 食化／褐變，在 `browning-maillard-storage` 之前 | 食化 115 第1題「用競爭效應解釋速率及適用界線」 |
| `protein-solvent-mechanism` 乙醇加進水溶液，穩定度與溶解度為何不一定同向？ | 食化／蛋白質，在 `protein-solvent-evidence` 之前 | 食化 115 第10題「說明影響構形穩定度的相互作用」「說明溶解度可能改變的原因」 |
| `proc-probiotic-dry-damage` 凍乾為何會傷菌？保護配方又在保護什麼？ | 食加／冷凍，緊接 `proc-freeze-drying` | 食加 115 第7題「對菌存活的影響機制」 |
| `micro-probiotic-safety`「乳酸菌」三個字，能代替菌株安全評估嗎？ | 食微／發酵，緊接 `micro-biotics-evidence` | 食微 115 第1題「安全與不良特性的評估」 |
| `micro-natto-process` 納豆是發酵過的大豆，所有發酵豆都算納豆嗎？ | 食微／發酵，在 `micro-natto-ammonia` 之前 | 食微 115 第5題「原料與基本產品身分」「主要製程順序與作用」「參與微生物與角色」 |

連動修改：
- `data/*-curriculum.json`：新增課程與來源（`proc-source-crowe-1998`、`proc-source-isapp-probiotic-2014`、`micro-source-fao-who-probiotics-food`、`natto-source-bccdc`）。
- `data/exam-written-bank.json`：上述 8 個要點補上 `remediationLessonIds` 與 `remediationScopeNotes`，各題 `remediation` 加入新課。現在每個評分要點都有對應課程。
- `modules/lesson-principles.js`：5 條核心原理。
- `tools/`：兩支驗證腳本改為預設驗證新版本；`verify-learning-flow.js` 原本把「第1題 r5 沒有課程」寫死，已改為補課清單 6 課、且不得出現「沒有對應課程」；`smoke-lessons.js` 新增「評分要點沒有課程的數量必須為 0」。

### 這批內容的限制（請接手者知道）

- **來源核對程度不一**：Crowe 1998 以 DOI 書目與摘要層級核對，沒有逐頁核對全文。FAO／WHO *Probiotics in Food* 與 BCCDC *Natto* 沿用歷屆題參考來源清單，編寫時雲端環境無法連線，**沒有重新開啟核對頁次**；課文只用一般性的面向與順序，不引用其中的頁次、時間、溫度或數字，來源條目的 `note` 也已註明。有網路時建議補核對。
- 5 課都**沒有互動活動與插圖**（`lesson-figures.js` 未新增項目；目前仍有 13 課沒有圖，屬既有狀態）。
- 課文是教學整理，不是官方答案；每課 `examRefs` 的 note 已寫明只補哪一部分。
- 未做的內容：`micro-natto-process` 沒有涵蓋納豆的變體（其他豆類／地區）與組織胺的細節（屬 q5 的安全疑慮，仍由 `micro-spores`、`micro-contamination-chain` 負責）。

## 驗證方式

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

```bash
VER=gap-lessons-20261105 node tools/verify-learning-flow.js
```

```bash
VER=gap-lessons-20261105 node tools/smoke-lessons.js
```

需要 `playwright`。11/05 結果：端到端 53/53 項通過；248 課 × 3 步驟共 744 頁全部渲染；131 個補救連結都會出現補課焦點；0 個評分要點沒有課程；console 0 錯誤。（11/04 版本為 53/53、729 頁、126 連結。）主要頁面（備考總覽、診斷、歷屆題、整卷、首頁、課程目錄、路徑、複習、說明、3D 反應目錄）都正常載入。

## 已知限制與建議的下一步

1. ~~8 個評分要點沒有對應課程~~：11/05 已補（見上）。
2. 基礎診斷（選擇題）的補救連結沒有帶作答 id（`exam-room.js` 只傳題目 id），所以只能回到那一題，不是那一次作答。
3. 如果之後想讓補課清單顯示進度，建議用「重寫後該要點的自評有改善」當作完成依據，而不是「開過頁面」。
4. 根目錄的舊工作副本可以考慮清掉，只留 `index.html`；動手前先確認 GitHub Pages 的發布來源設定。
