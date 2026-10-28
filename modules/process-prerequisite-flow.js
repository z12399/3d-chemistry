// Two optional processing branches. No formal paths, storage or progress flags.
export const PROCESS_PREREQUISITE_REMEDIES=Object.freeze([
  {
    "token": "evap-surface-pressure",
    "diagnostic": "evap-surface-pressure",
    "subject": "processing",
    "branch": "evaporation",
    "lessonId": "proc-vacuum-evaporation",
    "topicId": "proc-evaporation",
    "route": "#process/proc-evaporation/proc-vacuum-evaporation/understand",
    "canonicalRoute": "#process/proc-evaporation/proc-vacuum-evaporation/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 2,
    "paragraphIndex": 2,
    "quote": "表面蒸發不必等到沸騰",
    "expectedQuote": "表面蒸發不必等到沸騰",
    "why": "先分外界總絕對壓力與水分壓，再以題設材料、界面溫度和平衡水蒸氣壓判讀表面蒸發；不要把純水表值直接當所有食品的界面資料。",
    "reason": "Total absolute pressure versus water partial pressure; at a specified interface temperature, compare surroundings with the actual material equilibrium vapor pressure.",
    "returnHref": "#process/proc-evaporation/proc-vacuum-evaporation/observe"
  },
  {
    "token": "evap-boiling-pressure",
    "diagnostic": "evap-boiling-pressure",
    "subject": "processing",
    "branch": "evaporation",
    "lessonId": "proc-vacuum-evaporation",
    "topicId": "proc-evaporation",
    "route": "#process/proc-evaporation/proc-vacuum-evaporation/understand",
    "canonicalRoute": "#process/proc-evaporation/proc-vacuum-evaporation/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 3,
    "paragraphIndex": 3,
    "quote": "沸騰溫度可由純水飽和蒸氣壓約等於外加總絕對壓力判斷",
    "expectedQuote": "沸騰溫度可由純水飽和蒸氣壓約等於外加總絕對壓力判斷",
    "why": "這段限定近似平坦的純水液體與整體沸騰；外加總絕對壓力不是周圍水分壓，低水分壓本身不證明液體內已沸騰。",
    "reason": "Near-equilibrium pure-water boiling with hydrostatic/curvature corrections omitted; low water partial pressure alone does not prove bulk boiling.",
    "returnHref": "#process/proc-evaporation/proc-vacuum-evaporation/observe"
  },
  {
    "token": "process-phase-heat",
    "diagnostic": "process-phase-heat",
    "subject": "processing",
    "branch": "evaporation",
    "lessonId": "proc-sensible-latent",
    "topicId": "proc-energy",
    "route": "#process/proc-energy/proc-sensible-latent/understand",
    "canonicalRoute": "#process/proc-energy/proc-sensible-latent/understand",
    "phase": "understand",
    "field": "equation",
    "target": "equation",
    "index": null,
    "paragraphIndex": null,
    "quote": "Q顯 = m cp ΔT；Q潛 = m相變 λ；Q供入 = Q有效/η",
    "expectedQuote": "Q顯 = m cp ΔT；Q潛 = m相變 λ；Q供入 = Q有效/η",
    "why": "先分顯熱與相變熱，按題設相態、相變質量及給定λ核單位。這是指定能量段的估算；產品、加熱側蒸汽及全系統負荷要另分邊界。",
    "reason": "Existing equation distinguishes sensible heat, actual phase-changing mass and the specified efficiency; not a time/power/electricity model.",
    "returnHref": "#process/proc-evaporation/proc-vacuum-evaporation/observe"
  },
  {
    "token": "freeze-water-phases",
    "diagnostic": "freeze-water-phases",
    "subject": "processing",
    "branch": "freeze-drying",
    "lessonId": "proc-freeze-drying",
    "topicId": "proc-freezing",
    "route": "#process/proc-freezing/proc-freeze-drying/understand",
    "canonicalRoute": "#process/proc-freezing/proc-freeze-drying/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 2,
    "paragraphIndex": 2,
    "quote": "食品凍結後不一定全部水都成為冰",
    "expectedQuote": "食品凍結後不一定全部水都成為冰",
    "why": "先分冰與未凍結相，再把冰昇華與殘留水脫附對應到題設期間；不能把食品原始總水量都計成冰。",
    "reason": "Ice and non-ice water; primary sublimation versus secondary desorption, not all lost water as sublimed ice.",
    "returnHref": "#process/proc-freezing/proc-freeze-drying/observe"
  },
  {
    "token": "freeze-shelf-product",
    "diagnostic": "freeze-shelf-product",
    "subject": "processing",
    "branch": "freeze-drying",
    "lessonId": "proc-freeze-drying-collapse",
    "topicId": "proc-freezing",
    "route": "#process/proc-freezing/proc-freeze-drying-collapse/understand",
    "canonicalRoute": "#process/proc-freezing/proc-freeze-drying-collapse/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 1,
    "paragraphIndex": 1,
    "quote": "架板溫度 Ts 不等於產品溫度 Tp",
    "expectedQuote": "架板溫度 Ts 不等於產品溫度 Tp",
    "why": "架板設定不是產品測溫；原研究的材料、位置和方法各有邊界，不能互借另一配方的臨界溫度或把設定值當產品全程溫度。",
    "reason": "Existing correctly qualified material/method-specific distinction; not a universal Tc/Tg-prime or shelf-to-product conversion.",
    "returnHref": "#process/proc-freezing/proc-freeze-drying/observe"
  },
  {
    "token": "freeze-vapor-drive",
    "diagnostic": "freeze-vapor-drive",
    "subject": "processing",
    "branch": "freeze-drying",
    "lessonId": "proc-freeze-drying",
    "topicId": "proc-freezing",
    "route": "#process/proc-freezing/proc-freeze-drying/understand",
    "canonicalRoute": "#process/proc-freezing/proc-freeze-drying/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 3,
    "paragraphIndex": 3,
    "quote": "供熱與移汽要一起看",
    "expectedQuote": "供熱與移汽要一起看",
    "why": "供熱與移汽需配合；冰面平衡值、氣路水分壓、乾燥層及移除阻力各有角色。有壓差或相變熱帳，仍不能單獨給完成時間或殘水終點。",
    "reason": "Same-temperature qualified ice-interface equilibrium comparison, actual sublimed-ice phase heat, heat/dry-layer/vapor-removal constraints; total chamber pressure is not water partial pressure.",
    "returnHref": "#process/proc-freezing/proc-freeze-drying/observe"
  },
  {
    "token": "freeze-mass-water",
    "diagnostic": "freeze-mass-water",
    "subject": "processing",
    "branch": "freeze-drying",
    "lessonId": "proc-mass-basis",
    "topicId": "proc-balances",
    "route": "#process/proc-balances/proc-mass-basis/understand",
    "canonicalRoute": "#process/proc-balances/proc-mass-basis/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 1,
    "paragraphIndex": 1,
    "quote": "若乾燥只移除水，乾物質可作前後不變的追蹤量",
    "expectedQuote": "若乾燥只移除水，乾物質可作前後不變的追蹤量",
    "why": "總質量包含乾物與水；依題設固定乾物，才能以總質量減乾物求水量。",
    "reason": "The total contains dry solids and water; subtract the specified fixed dry solids to obtain remaining water.",
    "returnHref": "#process/proc-freezing/proc-freeze-drying/observe"
  }
].map(item=>Object.freeze(item)));
const byToken=new Map(PROCESS_PREREQUISITE_REMEDIES.map(item=>[item.token,item]));
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const link=(token,label)=>{const r=byToken.get(token);return r?'<a href="'+escapeHtml(r.route+'?prep='+r.token)+'">'+escapeHtml(label)+'</a>':'';};
const optional=items=>'<details><summary>先試判斷，需要時只補對應段落</summary><ul>'+items.map(item=>'<li>'+item+'</li>').join('')+'</ul></details>';
export function processPrerequisiteRemedyContext(hash,subject,lessonId,step){
 if(typeof hash!=='string'||hash.length>2048||subject!=='processing'||step!=='understand')return null;
 const delimiter=hash.indexOf('?');if(delimiter<0||hash.indexOf('?',delimiter+1)!==-1)return null;
 const canonical=hash.slice(0,delimiter),query=hash.slice(delimiter+1);if(/%(?![0-9a-f]{2})/i.test(query))return null;
 const params=new URLSearchParams(query),keys=[...params.keys()];if(keys.length!==1||keys[0]!=='prep')return null;
 const descriptor=byToken.get(params.get('prep'));return descriptor&&descriptor.route===canonical&&descriptor.lessonId===lessonId?descriptor:null;
}
export function renderProcessPrerequisiteRemedyPrompt(context){
 if(!PROCESS_PREREQUISITE_REMEDIES.includes(context))return '';
 const part=context.target==='equation'?'關鍵公式':'原理說明第'+(context.index+1)+'段',branch=context.branch==='evaporation'?'真空蒸發':'凍乾';
 return '<aside class="study-remedy process-prerequisite-remedy" aria-label="加工前置概念的具體補救" data-process-prerequisite-remedy="'+escapeHtml(context.token)+'"><p><strong>這次只補'+escapeHtml(part)+'：</strong>'+escapeHtml(context.why)+'</p><p>對照「'+escapeHtml(context.expectedQuote)+'」。讀完自行說明條件，再<a href="'+escapeHtml(context.returnHref)+'">回'+branch+'原題判斷</a>；讀過段落不等於已完成遷移。</p></aside>';
}
const evaporationRemedies=()=>optional([
 link('evap-surface-pressure','表面蒸發：水分壓與材料界面資料')+'，以及'+link('evap-boiling-pressure','整體沸騰：外加總絕對壓力')+'，須先分清比較的是哪個壓力。',
 link('process-phase-heat','顯熱、相變質量與給定λ的能量帳')+'：公式不是時間、加熱側蒸汽量或全廠電耗的直接答案。'
]);
const freezeRemedies=()=>optional([
 link('freeze-water-phases','冰、非冰水與兩段去水路徑')+'：先看題設是哪段期間與哪個水池。',
 link('freeze-shelf-product','架板設定與產品溫度的差別')+'：每個量都要帶材料、位置與量測方法。',
 link('freeze-vapor-drive','供熱、氣路水分壓與移汽阻力')+'：不能單靠一個腔壓值排乾燥快慢。'
]);
const flows={
 'proc-vacuum-evaporation':{
  understand:()=>'<p>先定壓力是哪個物件、表面蒸發或整體沸騰，再核相變能量與系統邊界。已會這些前提，可直接<a href="#process/proc-evaporation/proc-vacuum-evaporation/observe">進本題的條件判讀</a>；不必重讀整個加工章。</p>'+evaporationRemedies(),
  observe:()=>'<p>可選任務先保留你的判斷，再看給定記錄與支援；原果汁短案例仍在下方。進一步要算單雙效的物流與外供蒸汽，可另進<a href="#process/proc-evaporation/proc-evaporation-balance/observe">原蒸發衡算台</a>，先重新核它的物性、狀態與模型邊界。</p>'+evaporationRemedies(),
  check:()=>'<p>原單選只確認汽化仍需相變能量；它不等於已算出外供蒸汽、產能或全系統電耗。要判讀不同條件，可<a href="#process/proc-evaporation/proc-vacuum-evaporation/observe">回本題局部任務</a>，分開初答、支援後修訂與尚缺的資料。</p><p>卡在壓力物件時補'+link('evap-surface-pressure','表面水分壓')+'與'+link('evap-boiling-pressure','沸騰的總絕壓條件')+'；卡在熱帳時補'+link('process-phase-heat','相變段的能量與單位')+'。</p>'
 },
 'proc-freeze-drying':{
  understand:()=>'<p>先分冰與非冰水、一次昇華與殘留水脫附，再連產品溫度、供熱及蒸氣移除。已能交代條件與資訊缺口者，可直接<a href="#process/proc-freezing/proc-freeze-drying/observe">進本題的條件判讀</a>，不用把所有冷凍章節都讀過才開始。</p>'+freezeRemedies(),
  observe:()=>'<p>先說明資料對應哪個水池、期間與溫度位置，再作判斷；不要用一個終點外觀代替全段狀態。原果片短例保留在下方。想比較材料的崩塌證據，可另進<a href="#process/proc-freezing/proc-freeze-drying-collapse/observe">原崩塌研究活動</a>，兩組研究的材料與方法界線仍各自保留。</p>'+freezeRemedies(),
  check:()=>'<p>原單選只確認一次乾燥以冰昇華為主，還不足以推斷速率、完成時間或殘水終點。要在新條件說明可知與未知，可<a href="#process/proc-freezing/proc-freeze-drying/observe">回本題局部任務</a>，先保留理由再核對與修訂。</p><p>若把初水全當冰，補'+link('freeze-water-phases','水的相態與去水路徑')+'；若只憑設定溫度或腔壓排名，分別補'+link('freeze-shelf-product','Ts與Tp')+'或'+link('freeze-vapor-drive','供熱與移汽的角色')+'。</p>'
 }
};
export function renderProcessPrerequisiteFlow(lessonId,step){
 if(!Object.hasOwn(flows,lessonId)||!Object.hasOwn(flows[lessonId],step))return '';
 return '<aside class="study-remedy process-prerequisite-flow" aria-label="加工問題的可跳補救與返回" data-process-prerequisite-flow="'+escapeHtml(lessonId+':'+step)+'">'+flows[lessonId][step]()+'</aside>';
}
