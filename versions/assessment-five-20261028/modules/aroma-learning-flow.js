// Small, optional links inside existing lessons. No routes, progress or note state.
const links={
 generation:'<a href="#learn/browning/browning-maillard/understand">梅納反應的羰基／胺基入口</a>',
 strecker:'<a href="#learn/flavor/flavor-strecker/understand">Strecker醛的碳骨架</a>',
 partition:'<a href="#learn/flavor/flavor-partition/understand">食品相、氣相與平衡分配</a>',
 sampling:'<a href="#learn/processing/analysis-sampling-blank/understand">先限定取樣與分析對象</a>',
 recovery:'<a href="#learn/processing/analysis-recovery-matrix/understand">加標位置與方法證據的範圍</a>',
 channels:'<a href="#learn/flavor/flavor-sensory-channels/understand">鼻前、鼻後與其他感覺通道</a>',
 taste:'<a href="#learn/flavor/flavor-taste-evidence/understand">閾值、強度與群體摘要</a>',
 threshold:'<a href="#learn/flavor/flavor-threshold-basis/understand">先對齊閾值的比較基準</a>',
 odor:'<a href="#learn/flavor/flavor-odor-activity/observe">用既有活動篩選香氣候選</a>',
 task:'<a href="#learn/flavor/flavor-maillard-aroma/observe">回烘烤案例的分配與取證任務</a>',
 original:'<a href="#learn/flavor/flavor-maillard-aroma/check">回原題：如何檢驗B生成更多吡嗪？</a>'
};
const optional=items=>`<details><summary>卡住時，只補需要的概念</summary><ul>${items.map(item=>`<li>${item}</li>`).join('')}</ul></details>`;
const generationRemedies=[
 `${links.generation}：若不清楚前驅物如何進入反應，先回這一段。`,
 `${links.strecker}：問題是胺基酸衍生醛時才選這支；它不是所有食品香氣的唯一來源。`
];
const flows={
 'flavor-maillard-aroma':{
  understand:`<p>這題先分「形成的假說」與「末端還留多少」，再問基質如何分配、方法取到哪一相，最後才談感知。深褐色、食品內含量與頂空讀值各有範圍；沒有流失、轉化及系統邊界的證據，不能把末端留存量改名為累積生成量。</p><p>能說出這些區別者，可直接到${links.task}；不熟分配先看${links.partition}。</p>${optional(generationRemedies)}`,
  observe:`<p>先留下自己的判斷，再處理下方的食品留存量、相分配與量測證據。已有基礎可直接做任務，不必先讀完補救課；取得相容的濃度基準後，再${links.threshold}。</p>${optional([`${links.partition}：同溫平衡的濃度比，不是入口瞬間的釋放速率。`,`${links.sampling}：先分方法讀值與目標成分；原課GOPOD是方法學例子，不是揮發物分析程序。`,...generationRemedies])}`,
  check:`<p>原題要你提出證據方案。原參考的食品內定量＋頂空，先是端點留存與氣相比較；若要說「累積生成較多」，還需初始存量、逸散、後續轉化及取樣／系統邊界的證據，不能當作已排除所有替代機制。</p><p>新的取證任務補這段資料到結論的判讀；原題的提示與參考保持。需要時${links.task}。若已能說明支持什麼及尚缺什麼，下一步${links.threshold}，再用相符條件檢查香氣候選。</p>`
 },
 'flavor-partition':{
  understand:`<p>先認清K的方向、兩相濃度與溫度，並把相體積及總留存量另列。這是在指定前提下解釋分配，並未計算真實食品生成多少香氣。</p><p>能分平衡分配、動態釋放與方法讀值後，${links.task}，檢查同一個觀察還有哪些解釋。</p>`,
  observe:`<p>把本課的水／油基質問題接回${links.task}：先比較題設留存量與兩相分配，再判斷取樣及校正能支持哪個量；先不以OAV代替這一層。</p>${optional([`${links.sampling}：若不確定儀器讀值代表哪個分析對象，先回補。`,`${links.recovery}：若以加標或重讀推定整個方法都可靠，補不同證據涵蓋的環節。`])}`,
  check:`<p>能說出分配係數的條件與限制後，${links.task}，把機制用在原烘烤問題。已取得可比較的濃度，才${links.threshold}；氣相讀值不能直接借用不相符基質或相別的閾值。</p>`
 },
 'flavor-threshold-basis':{
  understand:`<p>這是濃度之後的一步：先有定義清楚的分析物與相別，才核對閾值。若手上只有峰面積，先${links.task}，不要靠換單位補出缺少的方法或基質證據。</p>${optional([`${links.channels}：只有不清楚香氣如何送達鼻腔時才回補。`,`${links.taste}：若混淆偵測、辨認與超閾值強度，讀原研究的判讀例；味覺資料不移作吡嗪嗅覺閾值。`])}`,
  observe:`<p>沿用本課的基準核對活動。每筆內部相容，仍不代表兩筆可互排名；能說明差別後，${links.odor}，檢查篩選結論能支持到哪裡。</p>`,
  check:`<p>已能核對單位、基質、相別、途徑與閾值定義者，可直接${links.odor}。接著要問混合物證據，不能把比值當成強度，也不能把不相容數據硬排高低。</p>`
 },
 'flavor-odor-activity':{
  understand:`<p>本課保留OAV的候選篩選與完整重組／省略推理。若C與T的條件不相容，先${links.threshold}；相容之後，較高比值仍不等於更強幾倍或可相加的感知。</p>`,
  observe:`<p>用原有活動分開濃度排名、OAV排名與尚需驗證的混合物感知。需要回看濃度從哪裡來時，${links.task}；不要把這台的假想A／B當作烘烤案例的實測吡嗪。</p>`,
  check:`<p>完成候選與感知證據的判讀後，${links.original}，試著同時交代生成假說、留存／分配、分析對象與感官比較。這是把不同能力帶回原題的遷移，不是要你依固定順序重讀；原始答案與修訂繼續分開。</p>`
 }
};

export function renderAromaLearningFlow(lessonId,step){
 if(!Object.hasOwn(flows,lessonId)||!Object.hasOwn(flows[lessonId],step))return '';
 return `<aside class="study-remedy aroma-learning-flow" aria-label="香氣學習銜接" data-aroma-learning-flow="${lessonId}:${step}">${flows[lessonId][step]}</aside>`;
}
