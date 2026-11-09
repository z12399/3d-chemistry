// Lipid comparison content, source-checked 2026-10-11. See research/lipid-reference-notes-2026-10-11.md.
export const LIPID_ATLAS_SOURCES = [
  { id:'lipid-atlas-classes', title:'OpenStax：Waxes, Fats, and Oils', url:'https://openstax.org/books/organic-chemistry/pages/27-1-waxes-fats-and-oils' },
  { id:'lipid-atlas-glycerophospholipids', title:'OpenStax：Phospholipids', url:'https://openstax.org/books/organic-chemistry/pages/27-3-phospholipids' },
  { id:'lipid-atlas-soap', title:'OpenStax：Soap', url:'https://openstax.org/books/organic-chemistry/pages/27-2-soap' },
  { id:'lipid-atlas-sterols', title:'OpenStax：Steroids', url:'https://openstax.org/books/organic-chemistry/pages/27-6-steroids' },
  { id:'lipid-atlas-phytosterols', title:'AOCS：Gas Chromatographic Analysis of Plant Sterols', url:'https://www.aocs.org/resource/gas-chromatographic-analysis-of-plant-sterols/' },
  { id:'lipid-atlas-lecithin', title:'AOCS：Introduction to Degumming', url:'https://www.aocs.org/resource/introduction-to-degumming/' },
  { id:'lipid-atlas-omega3', title:'NIH ODS：Omega-3 Fatty Acids', url:'https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/' },
  { id:'lipid-atlas-butyric', title:'PubChem：Butyric Acid，物性與氣味資料', url:'https://pubchem.ncbi.nlm.nih.gov/compound/Butyric-acid' },
  { id:'lipid-atlas-fat-taste', title:'Running 等（2015）：Oleogustus: The Unique Taste of Fat', url:'https://pubmed.ncbi.nlm.nih.gov/26142421/' },
  { id:'lipid-atlas-fat-sensory', title:'Taste Responses to Linoleic Acid（2017，人群研究）', url:'https://academic.oup.com/chemse/article/42/9/769/4096860' },
  { id:'lipid-atlas-frying', title:'AOCS：Formation of New Compounds During Frying', url:'https://www.aocs.org/resource/formation-of-new-compounds-during-frying-general-observations/' },
  { id:'lipid-atlas-hydrogenation', title:'AOCS：Hydrogenation in Practice', url:'https://www.aocs.org/resource/hydrogenation-in-practice/' },
  { id:'lipid-atlas-interesterification', title:'FAO：Processing and refining edible oils', url:'https://www.fao.org/4/v4700e/v4700e0a.htm' },
  { id:'lipid-atlas-crystallization', title:'AOCS：Dry Fractionation', url:'https://www.aocs.org/resource/dry-fractionation/' },
  { id:'lipid-atlas-emulsions', title:'AOCS：Emulsions: making oil and water mix', url:'https://www.aocs.org/resource/emulsions-making-oil-and-water-mix/' }
];

export const LIPID_CARDS = [
  {
    id:'triacylglycerol', group:'classes', name:'三酸甘油酯', en:'Triacylglycerol', notation:'TAG：甘油＋3 個脂醯基',
    structure:'甘油的三個 OH 都形成酯鍵；三條脂肪酸鏈可以相同，也可以不同。',
    property:'高度疏水，是多數食用油脂的主體；固態或液態要看組成、晶型與溫度。',
    flavor:'本體揮發性低，常見感受是潤滑、稠厚與融化口感。食用油的香氣還來自其中的揮發物及反應產物。',
    foods:'植物油、乳脂、豬油及可可脂都含許多種 TAG；不是一瓶油對應一個純分子。',
    reactionIds:['hydrolysis','saponification','autoxidation','hydrogenation','interesterification','thermal-polymerization','physical-crystallization'],
    sourceIds:['lipid-atlas-classes','lipid-atlas-fat-sensory']
  },
  {
    id:'phosphatidylcholine', group:'classes', name:'磷脂醯膽鹼', en:'Phosphatidylcholine', notation:'PC：一類甘油磷脂',
    structure:'甘油骨架接兩條脂醯鏈與磷酸膽鹼頭部；PC 也包含許多不同鏈組合。',
    property:'親水頭與疏水尾共存，可位於油水界面或形成雙層；乳化是分散與界面穩定，不是油完全溶於水。',
    flavor:'先理解它改變界面與口感的作用；商業卵磷脂的豆味或其他氣味不能直接當成純 PC 的固定味道。',
    foods:'蛋黃與大豆等原料的磷脂成分；商業卵磷脂是混合物，不等同單一 PC。',
    reactionIds:['hydrolysis','autoxidation'],
    sourceIds:['lipid-atlas-glycerophospholipids','lipid-atlas-lecithin','lipid-atlas-emulsions']
  },
  {
    id:'partial-glycerides', group:'classes', name:'單酸／雙酸甘油酯', en:'Mono- and diacylglycerols', notation:'MAG／DAG：1 或 2 個脂醯基',
    structure:'甘油只酯化一處或兩處，仍保留 OH；可由 TAG 部分水解形成。',
    property:'比 TAG 多了可與水作用的 OH，尤其 MAG 常用來調整界面、乳化與脂肪結晶。',
    flavor:'主要先看口感與界面功能；是否帶異味仍取決於原料、游離酸及氧化程度。',
    foods:'天然油脂的少量成分，也用於乳化配方；切斷一個 TAG 酯位得到 DAG，不會立刻得到游離甘油。',
    reactionIds:['hydrolysis','saponification','interesterification','physical-crystallization'],
    sourceIds:['lipid-atlas-classes','lipid-atlas-emulsions','lipid-atlas-frying']
  },
  {
    id:'cholesterol', group:'classes', name:'膽固醇', en:'Cholesterol', notation:'固醇：四個相連環＋OH',
    structure:'有類固醇四環骨架與一個 OH；游離膽固醇不是甘油三酯。',
    property:'大部分結構疏水，是動物細胞膜成分。游離膽固醇沒有可皂化的脂肪酸酯鍵。',
    flavor:'不能從食物的蛋香、奶香推斷膽固醇含量，也不能把食物香氣直接指定給膽固醇。',
    foods:'存在於動物組織及相關食物；須區分游離膽固醇與膽固醇酯。',
    reactionIds:[],
    sourceIds:['lipid-atlas-sterols','lipid-atlas-soap']
  },
  {
    id:'phytosterols', group:'classes', name:'植物固醇', en:'Phytosterols', notation:'例如 β-sitosterol、campesterol',
    structure:'與膽固醇有相近的四環骨架，側鏈等結構不同；植物固醇也是一群分子。',
    property:'可呈游離、酯化或配糖形式；游離固醇與固醇酯的可水解鍵不同。',
    flavor:'植物油的果香、堅果香或苦味不能僅由植物固醇名稱預測。',
    foods:'植物及植物油中的成分；比較時要看實際種類、含量與形式。',
    reactionIds:[],
    sourceIds:['lipid-atlas-phytosterols']
  },
  {
    id:'waxes', group:'classes', name:'蠟酯', en:'Wax esters', notation:'長鏈脂肪酸＋長鏈醇',
    structure:'長鏈羧酸與長鏈醇形成酯；不是甘油接三條鏈的 TAG。',
    property:'疏水，常形成保護性表層；天然蠟本身通常也是多種成分的混合物。',
    flavor:'蠟感偏向表面與口感描述；蜂蠟或果皮的整體氣味不能全歸給蠟酯本體。',
    foods:'果實表面蠟及蜂蠟中的蠟酯；不是所有天然蠟成分都屬於酯。',
    reactionIds:['hydrolysis','saponification','physical-crystallization'],
    sourceIds:['lipid-atlas-classes','lipid-atlas-soap']
  },
  {
    id:'stearic-acid', group:'fatty-acids', name:'硬脂酸', en:'Stearic acid', notation:'18:0｜飽和',
    structure:'18 個碳，沒有 C=C；游離形式帶 COOH，酯化後稱硬脂醯基。',
    property:'與同為 18 碳的 cis 油酸相比，較直的鏈一般較容易緊密排列。',
    flavor:'長鏈脂肪酸揮發性較低；硬、蠟或油潤等口感不能當成固定香氣。',
    foods:'動物脂肪等混合油脂中的常見脂醯鏈；真實食物通常不是游離硬脂酸。',
    reactionIds:['physical-crystallization'],
    sourceIds:['lipid-atlas-classes','lipid-atlas-fat-sensory']
  },
  {
    id:'oleic-acid', group:'fatty-acids', name:'油酸', en:'Oleic acid', notation:'18:1 cis-Δ9｜n−9',
    structure:'18 個碳、1 個 cis 雙鍵；Δ 從羧基端編號，n 從甲基端描述第一個雙鍵。',
    property:'cis 彎折使堆積不同於同鏈長飽和鏈；仍能氧化，也能在適當催化條件下氫化。',
    flavor:'游離油酸的味覺研究不等於橄欖油香氣。食物中多為酯化油醯基，感官還取決於微量成分與狀態。',
    foods:'橄欖油等油脂常含較多油醯鏈，但整瓶油是混合物。',
    reactionIds:['autoxidation','hydrogenation','physical-crystallization'],
    sourceIds:['lipid-atlas-classes','lipid-atlas-fat-taste']
  },
  {
    id:'butyric-acid', group:'fatty-acids', name:'丁酸', en:'Butyric acid', notation:'4:0｜短鏈飽和',
    structure:'4 個碳、沒有 C=C；游離丁酸與被酯化的丁醯基須分開。',
    property:'短鏈游離酸比長鏈脂肪酸更容易進入氣相；解離狀態也會影響揮發。',
    flavor:'游離丁酸可有強烈酸敗、奶油樣氣味；實際感受隨濃度與食品基質改變。',
    foods:'乳脂含酯化的短鏈脂醯基；水解釋出游離短鏈酸可造成水解酸敗。',
    reactionIds:['hydrolysis'],
    sourceIds:['lipid-atlas-butyric','lipid-atlas-classes']
  },
  {
    id:'lauric-acid', group:'fatty-acids', name:'月桂酸', en:'Lauric acid', notation:'12:0｜飽和',
    structure:'12 個碳，沒有 C=C；油脂中通常是月桂醯基。',
    property:'比 C16、C18 飽和鏈短；鏈長、是否酯化及混合組成共同影響物性。',
    flavor:'不能把椰子香直接歸給月桂酸；香氣與主要脂肪酸組成是不同資訊。',
    foods:'椰子油常含較多月桂醯鏈；精製程度與伴隨成分會改變氣味。',
    reactionIds:['physical-crystallization'],
    sourceIds:['lipid-atlas-classes']
  },
  {
    id:'palmitic-acid', group:'fatty-acids', name:'棕櫚酸', en:'Palmitic acid', notation:'16:0｜飽和',
    structure:'16 個碳，沒有 C=C；酯化時是棕櫚醯基。',
    property:'常見長鏈飽和脂肪酸；純脂肪酸的相態不能直接當成含它的食用油相態。',
    flavor:'主要脂醯鏈的名稱不能預測整份食物的香味；固態比例與融化也會改變口感。',
    foods:'棕櫚油、乳脂及多種動植物油脂中可見。',
    reactionIds:['physical-crystallization'],
    sourceIds:['lipid-atlas-classes']
  },
  {
    id:'linoleic-acid', group:'fatty-acids', name:'亞油酸', en:'Linoleic acid', notation:'18:2 cis-Δ9,12｜n−6',
    structure:'18 個碳、2 個 cis 雙鍵，中間有雙烯丙位 CH₂。',
    property:'典型多元不飽和鏈；雙烯丙位有利自由基氧化，但實際穩定性還受氧、光、金屬與界面影響。',
    flavor:'游離酸可能帶可辨識且常不愉快的味覺；氧化後揮發物則可帶來青草、油耗等氣味，不能混為同一作用。',
    foods:'玉米、大豆等植物油常含亞油醯鏈；現有氧化位點課以亞油酸作比較。',
    reactionIds:['autoxidation','hydrogenation'],
    sourceIds:['lipid-atlas-classes','lipid-atlas-fat-taste','lipid-atlas-frying']
  },
  {
    id:'alpha-linolenic-acid', group:'fatty-acids', name:'α-次亞麻油酸', en:'Alpha-linolenic acid', notation:'ALA｜18:3 n−3',
    structure:'18 個碳、3 個雙鍵；n−3 指由甲基端數的第一個雙鍵位置，不是只有 3 個碳。',
    property:'多元不飽和；儲存與加工中須留意氧化。不能只靠雙鍵數推算一瓶油的保存期限。',
    flavor:'不是「亞麻仁香」的單一香氣分子；游離酸、原料揮發物與氧化味應分開。',
    foods:'亞麻仁、大豆、芥花等植物油含 ALA；在油脂中常以酯化脂醯鏈存在。',
    reactionIds:['autoxidation','hydrogenation'],
    sourceIds:['lipid-atlas-omega3','lipid-atlas-frying']
  },
  {
    id:'eicosapentaenoic-acid', group:'fatty-acids', name:'二十碳五烯酸', en:'Eicosapentaenoic acid', notation:'EPA｜20:5 n−3',
    structure:'20 個碳、5 個雙鍵；EPA 與 DHA 是不同分子，不是同一個「魚油分子」。',
    property:'高度不飽和；脂質形式、氧暴露與抗氧化系統都影響其氧化行為。',
    flavor:'不能說 EPA 本身就是魚腥味；魚或魚油的氣味來自多種揮發物，也可能包含氧化產物。',
    foods:'魚及海鮮中的脂質可含 EPA；魚油還含許多其他脂肪酸鏈。',
    reactionIds:['autoxidation','hydrogenation'],
    sourceIds:['lipid-atlas-omega3','lipid-atlas-frying']
  },
  {
    id:'docosahexaenoic-acid', group:'fatty-acids', name:'二十二碳六烯酸', en:'Docosahexaenoic acid', notation:'DHA｜22:6 n−3',
    structure:'22 個碳、6 個雙鍵；脂醯鏈可接在不同類型的脂質上。',
    property:'高度不飽和；雙鍵多並不代表可以忽略基質、光照及加工條件直接排出實際油品穩定性。',
    flavor:'含 DHA 不是固定魚味的充分條件；濃度、精製與氧化狀態會改變產品感官。',
    foods:'魚及海鮮脂質中可見 DHA；比較產品要分清游離酸、甘油酯或其他脂質形式。',
    reactionIds:['autoxidation','hydrogenation'],
    sourceIds:['lipid-atlas-omega3','lipid-atlas-frying']
  }
];

export const LIPID_REACTIONS = [
  {
    id:'hydrolysis', name:'水解：拆開酯鍵', trigger:'水與適當的脂肪酶或酸鹼催化條件；不同基質、酵素的速度與位置選擇不同。',
    bond:'切開酯連接；TAG 部分水解可依次留下 DAG、MAG。脂肪酸鏈的 C=C 不因此必然消失。',
    equation:'TAG + 3 H₂O → 甘油 + 3 RCOOH',
    result:'完整淨式採中性羧酸記帳；若原料是蠟酯，產物是脂肪酸與長鏈醇，不是甘油。',
    flavor:'釋出游離短鏈酸可產生明顯氣味；長鏈油酸的釋出不等於丁酸氣味。',
    boundary:'水解不等於氧化。游離脂肪酸本身沒有甘油酯鍵可再照這條式子拆；PC 也須依酵素指定切哪個鍵。',
    lessonId:'lipid-hydrolysis', sourceIds:['lipid-atlas-classes','lipid-atlas-butyric','lipid-atlas-glycerophospholipids']
  },
  {
    id:'saponification', name:'皂化：鹼性水解形成皂', trigger:'具有可水解酯鍵的脂質，在適當強鹼與水的條件下反應。',
    bond:'酯水解後以羧酸根鹽作端點；與中性 RCOOH 的記帳不同。',
    equation:'TAG + 3 NaOH → 甘油 + 3 RCOO⁻ Na⁺',
    result:'生成脂肪酸鹽與醇。游離膽固醇沒有這種酯鍵；膽固醇酯的酯鍵則可以皂化。',
    flavor:'重點是產物與界面性質的改變；皂感不等於一般食用油應有的香氣。',
    boundary:'游離脂肪酸遇鹼形成鹽叫酸鹼中和，不能畫成原本存在的甘油酯鍵被切開。',
    lessonId:'lipid-reaction-map', sourceIds:['lipid-atlas-soap','lipid-atlas-sterols']
  },
  {
    id:'autoxidation', name:'自氧化：自由基鏈反應', trigger:'氧參與；熱、光、金屬與已有過氧化物等可影響引發及後續反應。',
    bond:'典型傳播包含奪氫、加氧與生成氫過氧化物；不是單純把每個 C=C 都變成 C–C。',
    equation:'L• + O₂ → LOO•；LOO• + LH → LOOH + L•',
    result:'初級 LOOH 可分解成多種醛、酮等，也可通往更大分子產物。',
    flavor:'部分次級揮發物產生油耗、青草或其他氣味；種類與濃度決定感受，不能單憑聞味判定完整機構。',
    boundary:'這是傳播步驟簡式，不是完整配平總反應。光敏氧化與脂氧合酶反應是另外的途徑；其位點與速率不能照搬。',
    lessonId:'lipid-oxidation-pathways', sourceIds:['lipid-atlas-frying','lipid-atlas-classes']
  },
  {
    id:'hydrogenation', name:'氫化：減少雙鍵', trigger:'氫氣、催化劑與適當加工條件；不是一般把油加熱就自動完全氫化。',
    bond:'H₂ 加到 C=C 上，形成較飽和的鏈；部分氫化還可能伴隨剩餘雙鍵的 cis/trans 與位置變化。',
    equation:'R–CH=CH–R′ + H₂ → R–CH₂–CH₂–R′',
    result:'可調整固體脂肪比例、熔融行為與氧化穩定性；完全氫化後的鏈不再有 cis/trans 雙鍵。',
    flavor:'主要直接改變組成與口感；不能保證加工後必定更香或沒有異味。',
    boundary:'飽和脂肪不是 trans 脂肪；反式描述仍存在的雙鍵兩側幾何。實際變化取決於反應程度與條件。',
    lessonId:'lipid-reaction-map', sourceIds:['lipid-atlas-hydrogenation']
  },
  {
    id:'interesterification', name:'酯交換：重新分配脂醯鏈', trigger:'適當化學催化劑或脂肪酶；酵素可能有位置選擇性。',
    bond:'重排脂醯基和甘油的酯連接，改變 TAG 分子組合與位置分布。',
    equation:'TAG 組合 A + TAG 組合 B ⇌ 重新分配脂醯基的 TAG 混合物',
    result:'在既定脂肪酸原料組成下，可改變結晶、熔融範圍與塑性。',
    flavor:'常見目的在調整塗抹性、酥性與融化口感；不代表新增某種特定香氣。',
    boundary:'示意式不是唯一分子反應式。理想酯交換不以加氫、增加飽和度或把 cis 轉 trans 為機構；結果也不保證一律變硬。',
    lessonId:'lipid-reaction-map', sourceIds:['lipid-atlas-interesterification']
  },
  {
    id:'thermal-polymerization', name:'高溫劣變與聚合', trigger:'長時間或反覆高溫加工；氧、含水量、油脂組成與使用歷史影響產物。',
    bond:'脂質及其反應中間物可形成分子間的新連接，產生二聚體與較高聚合物。',
    equation:'反應中的脂質分子 → 二聚體／寡聚體等較大產物',
    result:'炸油可同時出現水解、氧化、異構化與聚合；不只單一反應。',
    flavor:'異味常涉及同時形成的揮發性分解物；較大聚合產物與黏度等變化需另看。',
    boundary:'這是產物群示意，非單一配平反應；顏色或黏度都不能單獨量出總劣變或聚合程度。',
    lessonId:'lipid-frying-metrics', sourceIds:['lipid-atlas-frying']
  },
  {
    id:'physical-crystallization', name:'結晶／熔融：物理變化', trigger:'溫度與熱歷史改變；成核、晶體生長與混合脂肪組成都有影響。',
    bond:'分子堆積及晶型改變；不以切斷脂肪酸酯鍵或消耗 C=C 為必要條件。',
    equation:'液態脂質 ⇌ 脂質晶體／不同晶型',
    result:'固體比例與晶體網絡可改變硬度、塗抹性、脆斷與入口融化。',
    flavor:'明顯改變口感，並可影響香氣釋放；變硬本身不證明發生氫化。',
    boundary:'特別放在反應旁作對照：這是相態與堆積的變化。混合脂肪往往有熔融範圍，不是一個固定熔點。',
    lessonId:'lipid-cocoa-tempering', sourceIds:['lipid-atlas-crystallization','lipid-atlas-classes']
  }
];
