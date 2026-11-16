// Optional links between existing lessons; no model, route or progress state.
const links={
 species:'<a href="#learn/pigments/pigment-anthocyanin/understand">花青素的形式與條件</a>',
 buffer:'<a href="#learn/water/water-buffer/understand">pH與緩衝能力</a>',
 color:'<a href="#learn/pigments/pigment-color-readouts/understand">先讀外觀座標</a>',
 assay:'<a href="#learn/pigments/pigment-anthocyanin-assay/understand">再讀方法定義的花青素當量</a>',
 productBasis:'<a href="#learn/pigments/pigment-betalain-choice/understand">產品目的與比較基準</a>',
 product:'<a href="#learn/pigments/pigment-betalain-choice/observe">回產品的外觀／化學聯合證據活動</a>'
};
const optional=items=>`<details><summary>需要時，只補卡住的概念</summary><ul>${items.map(item=>`<li>${item}</li>`).join('')}</ul></details>`;
const flows={
 'pigment-anthocyanin':{
  understand:`<p>這裡先問條件如何改變物種形式；顏色改變不必先假定總量增加，也不能一律當可逆變色。能區分形式、量與不可逆轉化後，${links.color}，再看量測能支持什麼。</p>${optional([`${links.buffer}：若不清楚食品pH與緩衝能力，先補這一段；其中單一弱酸例不是全部花青素形式的模型。`])}`,
  observe:`<p>先用自己的話解釋本課變色例：改變的是哪些條件，形式比例與分解各需要什麼證據？不必讀完其他色素家族，便可${links.color}；要描述外觀，先知道讀值身份。</p>`,
  check:`<p>選對一題後，再說明為何「變紅」不等於「生成更多」。能交代理由與限制者可${links.color}；若外觀、當量及產品條件都已熟悉，可直接${links.product}。</p>`
 },
 'pigment-color-readouts':{
  understand:`<p>先問自己：ΔE*ab、C3G當量與個別色素含量，能互換嗎？本課只處理外觀座標與比較條件；色差不是濃度百分比。分清之後，${links.assay}。</p>${optional([`${links.species}：只有把外觀變化直接當新色素生成或完全分解時，才回補條件／形式。`])}`,
  observe:`<p>先看明度、彩度與色相各怎樣變，再問光源、白點與呈樣是否相同。本課CIELAB數字與原四吸光度例是兩套獨立練習，不能因同在工作台就拼成同一食品的量測配對或相關。</p>`,
  check:`<p>能說出色差方向及為何不能推色素流失後，${links.assay}。這接續原本的下一題：換一種量測身份，而不是把色度座標換算成化學濃度。</p>`
 },
 'pigment-anthocyanin-assay':{
  understand:`<p>先核對四讀值、分析緩衝液pH、光徑與DF，最後寫完整量名及原樣分母。分析用pH1.0／4.5不是食品原本pH；C3G當量也不是已鑑定的C3G或全部色素。</p>${optional([`${links.species}：不清楚形式與方法訊號關係時回補。`,`${links.color}：若把當量與外觀座標當同一種量，返回另一條量測鏈。`])}`,
  observe:`<p>先用原四讀值台核對各pH的700 nm修正、光徑與DF。只改DF紀錄不是取得新稀釋實驗。若另讀明示配對的比較紀錄，須先對齊樣品、分母與條件；它不能回頭替兩套舊示例建立配對。</p><p>示範與參考解釋可見時，這是在練習判讀，不把看過答案後的作答稱為無提示證據。</p>`,
  check:`<p>能報完整當量名稱、原樣基準與方法限制後，${links.product}，把量測帶回比較問題。若只有外觀或單一當量，仍未得到個別分子穩定性、唯一機制或保存期限。</p>`
 },
 'pigment-betalain-choice':{
  understand:`<p>先診斷三件事：能否分外觀／方法當量／物種，能否核對光徑、DF與共同基準，能否分產品保色與分子保留？能說出理由與限制者，直接${links.product}；不需把慢線當必修。</p>${optional([`${links.species}：卡在條件改變與物種形式時補。`,`${links.color}，再${links.assay}：卡在兩種量測身份時選這條慢線。`])}`,
  observe:`<p>沿用下方現有的產品、研究端點、資料關係與方法判讀任務。能分兩個端點並限定產品條件者可直接作答；卡住才${links.color}或${links.assay}。原量測例是獨立資料，只有另給共同樣品／基準的紀錄才可連結。</p>`,
  check:`<p>下面原練習比較pH3.2果飲與pH4.8豆乳甜點；不是把豆乳甜點改稱中性烘焙。要把能力帶到酸性飲料／中性烘焙，可${links.product}，依實際基質、歷程與端點重判。</p><p>這是回原活動的遷移，不是固定循環必修。若只是比較目的或添加量基準不清楚，補${links.productBasis}；原始答案、核對與修訂繼續分開。</p>`
 }
};

export function renderPigmentLearningFlow(lessonId,step){
 if(!Object.hasOwn(flows,lessonId)||!Object.hasOwn(flows[lessonId],step))return '';
 return `<aside class="study-remedy pigment-learning-flow" aria-label="色素學習銜接" data-pigment-learning-flow="${lessonId}:${step}">${flows[lessonId][step]}</aside>`;
}
