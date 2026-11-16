// Optional local remediation inside two existing specialties. No progress or note state.
// The first ten fixed descriptors project the accepted content proposal's remedyMap;
// hfcs-enzyme-sites is the separately approved enzyme-site supplement.
export const FOUNDATION_REMEDIES = Object.freeze([
  {
    "token": "hfcs-linkages",
    "diagnostic": "hfcs-linkages",
    "subject": "chemistry",
    "lessonId": "carb-starch-architecture",
    "route": "#learn/carbohydrates/carb-starch-architecture/understand",
    "canonicalRoute": "#learn/carbohydrates/carb-starch-architecture/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 0,
    "paragraphIndex": 0,
    "quote": "1→6 指供體的異頭碳 C1 經氧連到另一殘基的 C6",
    "expectedQuote": "1→6 指供體的異頭碳 C1 經氧連到另一殘基的 C6",
    "why": "先指出糖苷鍵兩側的碳位，再判斷題目指定切哪條連接。1→6不是第六個葡萄糖。",
    "reason": "Identify which atoms a glycosidic linkage names before predicting a cleavage.",
    "returnHref": "#learn/carbohydrates/carb-hfcs-process/observe"
  },
  {
    "token": "hfcs-water",
    "diagnostic": "hfcs-water",
    "subject": "chemistry",
    "lessonId": "carb-hydrolysis",
    "route": "#learn/carbohydrates/carb-hydrolysis/understand",
    "canonicalRoute": "#learn/carbohydrates/carb-hydrolysis/understand",
    "phase": "understand",
    "field": "equation",
    "target": "equation",
    "index": null,
    "paragraphIndex": null,
    "quote": "C₁₂H₂₂O₁₁ + H₂O",
    "expectedQuote": "C₁₂H₂₂O₁₁ + H₂O",
    "why": "核對一次指定糖苷水解的淨耗水；這個乳糖式示範收支，不代表HFCS也產生半乳糖。",
    "reason": "One hydrolysis net water versus altered sugar pool; equation is the requested named segment.",
    "returnHref": "#learn/carbohydrates/carb-hfcs-process/observe"
  },
  {
    "token": "hfcs-reducing-end",
    "diagnostic": "hfcs-reducing-end",
    "subject": "chemistry",
    "lessonId": "carb-reducing-end",
    "route": "#learn/carbohydrates/carb-reducing-end/understand",
    "canonicalRoute": "#learn/carbohydrates/carb-reducing-end/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 0,
    "paragraphIndex": 0,
    "quote": "乳糖保留一個半縮醛異頭中心",
    "expectedQuote": "乳糖保留一個半縮醛異頭中心",
    "why": "找可用的異頭中心；有還原端的寡糖仍不等於每個殘基都已成游離葡萄糖。",
    "reason": "Locate an available anomeric centre; read equation.note for alkaline ketose assay caveat.",
    "returnHref": "#learn/carbohydrates/carb-hfcs-process/observe"
  },
  {
    "token": "hfcs-de-basis",
    "diagnostic": "hfcs-de-basis",
    "subject": "chemistry",
    "lessonId": "carb-dextrose-equivalent",
    "route": "#learn/carbohydrates/carb-dextrose-equivalent/understand",
    "canonicalRoute": "#learn/carbohydrates/carb-dextrose-equivalent/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 0,
    "paragraphIndex": 0,
    "quote": "將還原能力除以樣品乾物量",
    "expectedQuote": "將還原能力除以樣品乾物量",
    "why": "先分清乾物分母與葡萄糖還原當量，再問糖譜；DE不能直接當葡萄糖或果糖百分比。",
    "reason": "Measured equivalent and dry basis, not glucose mass percentage or sweetness.",
    "returnHref": "#learn/carbohydrates/carb-hfcs-process/observe"
  },
  {
    "token": "hfcs-isomerase",
    "diagnostic": "hfcs-isomerase",
    "subject": "chemistry",
    "lessonId": "carb-hfcs-process",
    "route": "#learn/carbohydrates/carb-hfcs-process/understand",
    "canonicalRoute": "#learn/carbohydrates/carb-hfcs-process/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 1,
    "paragraphIndex": 1,
    "quote": "它不是澱粉水解酶",
    "expectedQuote": "它不是澱粉水解酶",
    "why": "先核對底物池與改變的結構。異構酶不是澱粉水解酶，給定轉換量也不是平衡常數。",
    "reason": "Isomerase acts on a different substrate/object; no reuse of aqueous equilibrium from an industrial ledger.",
    "returnHref": "#learn/carbohydrates/carb-hfcs-process/observe"
  },
  {
    "token": "unsapon-ester",
    "diagnostic": "unsapon-ester",
    "subject": "chemistry",
    "lessonId": "lipid-family-atlas",
    "route": "#learn/lipids/lipid-family-atlas/understand",
    "canonicalRoute": "#learn/lipids/lipid-family-atlas/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 2,
    "paragraphIndex": 2,
    "quote": "辨認酯鍵時找 R–C(=O)–O–R′",
    "expectedQuote": "辨認酯鍵時找 R–C(=O)–O–R′",
    "why": "找 R–C(=O)–O–R′並指出脂肪醯端與醇端，不能只按家族名或任意一個O猜反應。",
    "reason": "The new explicit ester foundation supplies the formerly skipped connection definition.",
    "returnHref": "#learn/lipids/lipid-unsaponifiable-fraction/observe"
  },
  {
    "token": "unsapon-neutral-vs-base",
    "diagnostic": "unsapon-neutral-vs-base",
    "subject": "chemistry",
    "lessonId": "lipid-hydrolysis",
    "route": "#learn/lipids/lipid-hydrolysis/understand",
    "canonicalRoute": "#learn/lipids/lipid-hydrolysis/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 1,
    "paragraphIndex": 1,
    "quote": "鹼性皂化須另寫羧酸根端點",
    "expectedQuote": "鹼性皂化須另寫羧酸根端點",
    "why": "原triolein台採中性羧酸記帳；未酸化鹼性端點須另寫羧酸根，不能原樣搬用。",
    "reason": "Original correct paragraph, supported by equation.note and transfer.answer, resolves neutral/base endpoint confusion.",
    "returnHref": "#learn/lipids/lipid-unsaponifiable-fraction/observe"
  },
  {
    "token": "unsapon-base-net",
    "diagnostic": "unsapon-base-net",
    "subject": "chemistry",
    "lessonId": "lipid-reaction-map",
    "route": "#learn/lipids/lipid-reaction-map/understand",
    "canonicalRoute": "#learn/lipids/lipid-reaction-map/understand",
    "phase": "understand",
    "field": "equation",
    "target": "equation",
    "index": null,
    "paragraphIndex": null,
    "quote": "TAG + 3 OH⁻ → 甘油 + 3 RCOO⁻",
    "expectedQuote": "TAG + 3 OH⁻ → 甘油 + 3 RCOO⁻",
    "why": "先讀第一條未酸化皂化淨式，分清OH⁻、羧酸根與醇；後面的氫化式是另一種反應。",
    "reason": "Read the first specified reaction, not the separate hydrogenation equation.",
    "returnHref": "#learn/lipids/lipid-unsaponifiable-fraction/observe"
  },
  {
    "token": "unsapon-operation",
    "diagnostic": "unsapon-operation",
    "subject": "chemistry",
    "lessonId": "lipid-unsaponifiable-fraction",
    "route": "#learn/lipids/lipid-unsaponifiable-fraction/understand",
    "canonicalRoute": "#learn/lipids/lipid-unsaponifiable-fraction/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 0,
    "paragraphIndex": 0,
    "quote": "得到在該條件下可回收的不皂化分段",
    "expectedQuote": "得到在該條件下可回收的不皂化分段",
    "why": "先追反應產物，再問指定分離條件下回收哪個分段。原分子反應過不排除醇端進入不皂化分段。",
    "reason": "Reaction products and an operationally recovered fraction are different objects.",
    "returnHref": "#learn/lipids/lipid-unsaponifiable-fraction/observe"
  },
  {
    "token": "unsapon-quality",
    "diagnostic": "unsapon-quality",
    "subject": "chemistry",
    "lessonId": "lipid-unsaponifiable-fraction",
    "route": "#learn/lipids/lipid-unsaponifiable-fraction/understand",
    "canonicalRoute": "#learn/lipids/lipid-unsaponifiable-fraction/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 1,
    "paragraphIndex": 1,
    "quote": "總殘渣無法辨認這些成分各有多少",
    "expectedQuote": "總殘渣無法辨認這些成分各有多少",
    "why": "把殘渣總量、個別成分、方法回收與品質作用分開，不能只憑總量宣稱維生素E或安定性。",
    "reason": "Composition, recovery and a named quality mechanism are separate evidence layers.",
    "returnHref": "#learn/lipids/lipid-unsaponifiable-fraction/observe"
  },
  {
    "token": "hfcs-enzyme-sites",
    "diagnostic": "hfcs-enzyme-sites",
    "subject": "chemistry",
    "lessonId": "carb-hfcs-process",
    "route": "#learn/carbohydrates/carb-hfcs-process/understand",
    "canonicalRoute": "#learn/carbohydrates/carb-hfcs-process/understand",
    "phase": "understand",
    "field": "explanation",
    "target": "explanation",
    "index": 0,
    "paragraphIndex": 0,
    "quote": "α-澱粉酶切內部 α(1→4) 鍵以液化",
    "expectedQuote": "α-澱粉酶切內部 α(1→4) 鍵以液化",
    "why": "先核對題設所選酵素可作用的鍵與位置；知道1→4或1→6碳位，仍不足以代替酵素作用部位。",
    "reason": "Root-approved supplemental descriptor: check the specified enzyme and its eligible reaction site, separately from carbon linkage notation.",
    "returnHref": "#learn/carbohydrates/carb-hfcs-process/observe"
  }
].map(item => Object.freeze(item)));

const byToken = new Map(FOUNDATION_REMEDIES.map(item => [item.token, item]));
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const hrefFor = token => {
  const remedy = byToken.get(token);
  return remedy ? remedy.route + '?prep=' + remedy.token : '';
};
const link = (token, label) => '<a href="' + escapeHtml(hrefFor(token)) + '">' + escapeHtml(label) + '</a>';
const task = family => family === 'hfcs' ? '#learn/carbohydrates/carb-hfcs-process/observe' : '#learn/lipids/lipid-unsaponifiable-fraction/observe';
const taskLink = (family, label) => '<a href="' + task(family) + '">' + escapeHtml(label) + '</a>';
const optional = items => '<details><summary>卡在哪裡，只補對應的一段</summary><ul>' + items.map(item => '<li>' + item + '</li>').join('') + '</ul></details>';

export function foundationRemedyContext(hash, subject, lessonId, step) {
  if (typeof hash !== 'string' || hash.length > 2048 || subject !== 'chemistry' || step !== 'understand') return null;
  const delimiter = hash.indexOf('?');
  if (delimiter < 0 || hash.indexOf('?', delimiter + 1) !== -1) return null;
  const canonical = hash.slice(0, delimiter), query = hash.slice(delimiter + 1);
  if (/%(?![0-9a-f]{2})/i.test(query)) return null;
  const params = new URLSearchParams(query), keys = [...params.keys()];
  if (keys.length !== 1 || keys[0] !== 'prep') return null;
  const remedy = byToken.get(params.get('prep'));
  return remedy && remedy.route === canonical && remedy.lessonId === lessonId ? remedy : null;
}

export function renderFoundationRemedyPrompt(context) {
  if (!FOUNDATION_REMEDIES.includes(context)) return '';
  const segment = context.target === 'explanation' ? '原理說明第' + (context.index + 1) + '段' : '關鍵公式';
  return '<aside class="study-remedy foundation-remedy-prompt" aria-label="本次具體補救" data-foundation-remedy="' + escapeHtml(context.token) + '"><p><strong>這次只補' + escapeHtml(segment) + '：</strong>' + escapeHtml(context.why) + '</p><p>對照「' + escapeHtml(context.expectedQuote) + '」。讀完能自行說出理由與條件，再<a href="' + escapeHtml(context.returnHref) + '">回原專題的局部診斷與活動</a>；開過此段不等於已答對。</p></aside>';
}

const hfcsRemedies = () => optional([
  link('hfcs-linkages', 'α1→4／α1→6指哪些碳位') + '；若要追切後n1／b1兩端，另看<a href="#learn/carbohydrates/carb-starch-architecture/observe">原澱粉切分活動</a>，再回這題。',
  link('hfcs-reducing-end', '可用還原端') + '：有還原端的片段不等於游離葡萄糖。' + link('hfcs-de-basis', 'DE的乾基與還原當量') + '另補量測基準。',
  link('hfcs-enzyme-sites', '酵素可作用的鍵與位置') + '與' + link('hfcs-isomerase', '異構酶的底物及改變') + '：不能只憑鍵名決定全部酵素作用。',
  link('hfcs-water', '一次水解的配平淨式') + '：只在水／產物帳不清時補；乳糖例的產物身分不套用到澱粉。'
]);
const unsaponRemedies = () => optional([
  link('unsapon-ester', '酯連接的脂肪醯端與醇端') + '：先分游離形式與酯化形式。',
  link('unsapon-base-net', '未酸化的鹼性皂化淨式') + '；若混用原中性triolein台，補' + link('unsapon-neutral-vs-base', '中性記帳與羧酸根端點的界線') + '。',
  link('unsapon-operation', '反應產物與可回收分段') + '，以及' + link('unsapon-quality', '殘渣總量不能代替成分與品質證據') + '。'
]);

const flows = {
  'carb-hfcs-process': {
    understand: () => '<p>這題依序問：切哪個連接、留下哪個糖池、用哪種量測確認。先分物理可及性與水解，再分還原當量、糖組成與異構化。已能說清理由及條件者，可直接' + taskLink('hfcs', '進原G5流程或局部診斷') + '，不用重讀整章。</p>' + hfcsRemedies(),
    observe: () => '<p>先用自己的話指出指定酵素／鍵／切後端點，再判斷DE與糖譜能各說什麼；熟悉者可直接操作原流程。原G5帳的轉換量是題設，並非實測產品規格或平衡常數；原有同條件平衡視角仍需自己的條件與物種定義。</p>' + hfcsRemedies(),
    check: () => '<p>原題要求流程、條件與證據；提示和示範可見時，這是有支援的推理練習。若要檢查不同條件能否遷移，可' + taskLink('hfcs', '回局部診斷與遷移') + '；保留初答、檢核與修訂，不把開過補救當成學會。</p><p>若把DE當葡萄糖百分比，補' + link('hfcs-de-basis', '乾基還原當量') + '；若把所有酵素視為同一作用，補' + link('hfcs-enzyme-sites', '底物鍵與作用位置') + '再回原題。</p>'
  },
  'lipid-unsaponifiable-fraction': {
    understand: () => '<p>先在結構上指出酯鍵兩端，再指定未酸化鹼性產物；之後才談分相、殘渣與品質。能說清這四層及限制者，可直接' + taskLink('unsapon', '進原分相台或局部診斷') + '，不必按課程索引重讀脂質章。</p>' + unsaponRemedies(),
    observe: () => '<p>先辨游離甾醇與甾醇酯，再沿脂肪醯／醇兩端追產物。原酯有反應，而釋出的疏水醇仍可進不皂化分段；請用題設分離條件判斷，不能由分段名稱推全程不變或定量回收。原逐酯位與回收誤差台繼續用來查這些理由。</p>' + unsaponRemedies(),
    check: () => '<p>作答依序寫結構、未酸化產物、分析回收分段，以及尚缺的成分／方法／品質證據。原題和示範保持可用；不同分子與條件的自我檢查可' + taskLink('unsapon', '回局部診斷與遷移') + '，不是硬性重讀循環。</p><p>若只按家族名分類，補' + link('unsapon-ester', '具體酯連接') + '；若由同殘渣推同維生素E或安定性，補' + link('unsapon-quality', '總量與成分／品質的界線') + '再返回。</p>'
  }
};

export function renderFoundationLearningFlow(lessonId, step) {
  if (!Object.hasOwn(flows, lessonId) || !Object.hasOwn(flows[lessonId], step)) return '';
  return '<aside class="study-remedy foundation-learning-flow" aria-label="本題可跳過的補救與返回" data-foundation-learning-flow="' + escapeHtml(lessonId + ':' + step) + '">' + flows[lessonId][step]() + '</aside>';
}
