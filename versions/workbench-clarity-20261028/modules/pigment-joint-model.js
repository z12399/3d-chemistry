// Fixed, qualified study reports and original evidence-alignment tasks; no color/degradation simulator.
export const PIGMENT_JOINT_ID='pigment-joint-evidence';
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const text=v=>typeof v==='string'?v:'';
const lock=(o,k,v)=>Object.defineProperty(o,k,{value:v,writable:false,configurable:false,enumerable:true});
export const PIGMENT_JOINT_SOURCES=freeze([
 {id:'cf-beet-storage',label:'Kayın等2019：甜菜汁濃縮液的外觀與成分',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6828920/',scope:'採同一研究條件群組的作者定性結果：包覆鋁箔的a*保色表現較佳，而所報甜菜色素變化未見顯著包覆效應。這不是個別樣品配對共變異或等效證明；方法的波長／類別標示疑點不在本台自行換標或重算。'},
 {id:'cf-soy-color',label:'Dias等2020：豆乳優格替代品的著色',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7353562/',scope:'所採儲存結果有外觀色度；萃取物原先的化學表徵不自動成為每個儲存組的配對化學終點。本台保留未建立的化學欄位，也不把摘要中疑似混用的色素家族名稱當分類依據。'},
 {id:'pigment-source-molina2026',label:'Molina-Montero等2026：甜菜副產物麵包的色度與所報色素',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12943004/',scope:'採同一麵包研究的作者定性外觀／類別當量報告及起始麵糰與成品的區別。成品pH精確值未採；UV類別標示有待釐清，不當HPLC個別betanin或保留率。不是花青素／甜菜色素的中性麵包頭對頭排名。'},
 {id:'pigment-cie-lab',label:'CIE：L*a*b*色空間的量測身分',url:'https://cie.co.at/eilvterm/17-23-076',scope:'色度座標描述指定呈樣／參考條件下的外觀，不是指定色素的化學量。這裡不以螢幕色票代替食品實測，也不重做既有色差算法。'},
 {id:'pigment-aoac-ph-differential',label:'Lee等2005：單體花青素pH差示法',url:'https://www.ars.usda.gov/ARSUserFiles/37108/pdf/leejaoac.pdf',scope:'採方法對單體花青素及pH形式的限定；化學當量不是全部花青素、個別HPLC成分或甜菜色素的共同單位。本台不重做既有吸光度計算，也不由方法名稱保證基質回收。'}
]);
export const PIGMENT_PRODUCTS=freeze([
 {id:'acid-drink',label:'原題情境：酸性飲料',given:'先核對飲料的實際酸度、基質、呈色目標與熱／儲藏歷程。酸性情境可提供候選理由，不能僅由pH指定所有花青素或甜菜色素的共同勝負。',answer:'acid'},
 {id:'neutral-bake',label:'原題情境：中性烘焙產品',given:'中性與烘焙是本題要驗證的產品條件。較低酸產品的候選理由不等於耐烤已證；起始麵糰接近中性，也不能自動替成品pH或指定熱歷程的成分證據補值。',answer:'bake'}
]);
export const PIGMENT_STUDIES=freeze([
 {id:'beet-foil',label:'甜菜汁濃縮液：包覆比較',sourceId:'cf-beet-storage',title:'同研究條件群組：外觀與所報色素的不同結論',rows:[['證據身分','作者所報結果／本台限制'],['外觀','包覆鋁箔的a*保色表現較佳。'],['化學端點','所報甜菜色素變化未見顯著包覆效應；不當作兩組完全相同。'],['連結範圍','同研究條件群組，未提供本台可用的個別配對資料／共變異。']],paragraphs:['這是濃縮液儲藏比較，不是中性烘焙，也不是兩個色素家族的頭對頭實驗。不同條件的觀察期不一，不能把各自末點拼成同時間比較。','外觀較佳不會自動證明指定分子保留更多；未見顯著差異不等於等效。文中分析波長／類別標示有待釐清，本台不重建絕對化學量或保留率。'],answer:'different-strength',chemicalValue:null,retention:null},
 {id:'soy-storage',label:'豆乳優格替代品：儲存著色',sourceId:'cf-soy-color',title:'有儲存色度，不把別層化學資訊補成配對終點',rows:[['證據身分','本輪採用範圍'],['外觀','研究量測儲存著色的色度表現。'],['化學端點','未建立可與所採儲存組逐組相配的化學含量；保留未知。'],['連結範圍','原始萃取物的分析／包埋資料，不是同一儲存樣品的化學保留率。']],paragraphs:['豆乳優格替代品不是中性烘焙。既有課中的pH4.8豆乳甜點是比較設計前置，不能改稱原題的中性烘焙。','同一篇文章中有化學表格，也不代表每個外觀觀察都有對應的化學終點。本台沒有把缺測補成零或用兩個獨立假想計算資料拼成相關。'],answer:'chemical-missing',chemicalValue:null,retention:null},
 {id:'bread-study',label:'甜菜副產物麵包：起始條件與分析身分',sourceId:'pigment-source-molina2026',title:'有烘焙產品資料，仍需限定pH與指定成分主張',rows:[['證據身分','作者所報結果／本台限制'],['產品條件','研究含接近中性的起始麵糰條件；成品麵包心／皮的pH精確值未採。'],['外觀','作者報告酵母組麵包心較高a*，另一膨鬆條件的黃色表現不同。'],['化學端點','作者所報類別當量有不同方向；不是HPLC個別色素，波長／類別標示疑點待釐清。']],paragraphs:['這提供同研究產品條件下的色度與作者所報類別指標，沒有建立所有個別分子的保留或熱降解機構。膨鬆系統、形狀與成品部位均需限定，不能把全部差異單獨歸因於pH。','研究不是花青素與甜菜色素在中性烘焙產品中的頭對頭比較；不能由起始麵糰、某類別當量或一種色度推出通用贏家。'],answer:'bread-qualified',chemicalValue:null,retention:null}
]);
export const PIGMENT_ALIGNMENTS=freeze([
 {id:'same-group',label:'原創材料：同研究同條件群組',given:'已給同研究、同產品與取樣條件的外觀及化學群組結果；未給個別樣品逐筆配對或共同誤差。',answer:'group-only'},
 {id:'independent',label:'原創材料：兩套獨立資料',given:'一套是某樣品的色差，另一套是不同樣品／不同基質的化學當量。沒有配對與共同基準。',answer:'unpaired'},
 {id:'zero-reference',label:'原創材料：起始分析量為零',given:'相同分析定義下，已給起始指定成分量為0。有人仍要用末端量÷起始量稱作相對保留率。',answer:'zero-undefined'}
]);
export const PIGMENT_MECHANISMS=freeze([
 {id:'fade-same-reading',label:'原創材料：變淡，分析讀值近似未變',given:'同產品外觀變淡，所報分析讀值近似未變。沒有已驗證的回收率或足以辨認單一機制的其他資料。',answer:'alternatives'},
 {id:'similar-color',label:'原創材料：外觀相近，分析組成不同',given:'呈樣條件已對齊，外觀讀值相近；指定分析法卻報告不同成分組成。沒有相符的個別分子穩定性比較。',answer:'not-same-chemistry'}
]);
export const PIGMENT_ASSAYS=freeze([
 {id:'class-equivalent',label:'類別當量與文中標示待釐清',given:'只有UV可見光的類別當量，且採用波長／色素名稱對應仍有疑點；未給本題可用的個別成分鑑定。',answer:'method-limited'},
 {id:'identified-analyte',label:'原創材料：指定分析物及回收基準已交代',given:'已給清楚指定分析物、取樣／質量基準與回收檢查的化學分析。尚未給外觀、機制或另一產品的對應結果。',answer:'analyte-only'}
]);
export const PIGMENT_JOINT_STATIONS=freeze([
 {id:'product',title:'1．先把產品情境說清楚',prompt:'依選定原題情境，哪個候選判斷有保留必要條件？',options:[{id:'acid',label:'酸性飲料先核對色素種類、基質與熱歷程；酸度提供候選理由而非通用勝負'},{id:'bake',label:'中性烘焙另需相符產品／熱歷程證據，不能把較低酸候選直接稱耐烤已證'},{id:'automatic',label:'只要pH已知，就能給所有天然紅色素唯一贏家'}]},
 {id:'study',title:'2．先預測，再讀兩個端點',prompt:'依已揭示的研究材料，哪句同時保留外觀、化學與產品範圍？',options:[{id:'different-strength',label:'同群組的外觀與化學結論力度不同；保色較佳不直接等於指定分子更多，未顯著也不等效'},{id:'chemical-missing',label:'所採儲存外觀沒有已建立的相配化學終點；缺項保留未知，不能借別層資料補值'},{id:'bread-qualified',label:'烘焙資料仍受起始／成品pH與類別分析身分限制，沒有建立兩家族通用排名'},{id:'winner',label:'這一份結果已證明某色素在所有中性烘焙、飲料與儲藏情境都最好'}]},
 {id:'alignment',title:'3．資料接在一起，需要什麼共同身分？',prompt:'依目前給定的資料關係，能建立哪種連結？',options:[{id:'group-only',label:'可對照同條件群組的端點；沒有個別配對資料就不算相關、共變異或配對顯著性'},{id:'unpaired',label:'不能把獨立樣品拼成外觀與化學量的實驗關聯；需重新對齊樣品及基準'},{id:'zero-undefined',label:'起始量0使此比值無定義；不填0%或100%，也不因此給出產品穩定性'},{id:'all-paired',label:'只要出現在同一頁或同一課，就可以當成配對數據'}]},
 {id:'mechanism',title:'4．外觀改變，哪條原因已被證明？',prompt:'保留預測後讀原創材料。哪個解釋沒有跳過替代原因？',options:[{id:'alternatives',label:'先分開pH形式、結合／聚集、散射、取樣／分析回收及不可逆轉化；現有資料未指定唯一原因'},{id:'not-same-chemistry',label:'外觀相近不等於化學組成或分子穩定性相同，兩種端點仍須分開'},{id:'destroyed',label:'只要變淡，就是所有色素分子被不可逆破壞'},{id:'perfect',label:'外觀或一個分析讀值近似，就等於所有化學量與機制完全相同'}]},
 {id:'assay',title:'5．方法名稱，決定你量到哪個物件',prompt:'依這份分析資訊，哪個主張有符合量測身分？',options:[{id:'method-limited',label:'先保留類別／方法限定及標示疑點；不擅改成個別betanin含量或重建化學保留率'},{id:'analyte-only',label:'可在所給基準下談指定分析物；不自動補外觀、唯一機制或跨產品排序'},{id:'all-analytes',label:'任何色素當量、色差與HPLC個別成分都能直接換成同一個量'}]},
 {id:'transfer',title:'6．把證據帶回酸性飲料與中性烘焙',prompt:'依目前目標產品，怎樣修訂「看過一份保色研究，就能直接選贏家」？',options:[{id:'matched',label:'重新核對產品酸度、基質、實際熱歷程、取樣與兩端點；缺相符比較時保留候選與未解問題'},{id:'borrow',label:'把豆乳甜點、濃縮汁或起始麵糰的結果直接當成所有中性烘焙成品的驗證'},{id:'none',label:'目前不能外推，就表示所有色素在所有產品都沒有作用'}]}
]);
const maps={product:new Map(PIGMENT_PRODUCTS.map(x=>[x.id,x])),study:new Map(PIGMENT_STUDIES.map(x=>[x.id,x])),alignment:new Map(PIGMENT_ALIGNMENTS.map(x=>[x.id,x])),mechanism:new Map(PIGMENT_MECHANISMS.map(x=>[x.id,x])),assay:new Map(PIGMENT_ASSAYS.map(x=>[x.id,x])),station:new Map(PIGMENT_JOINT_STATIONS.map(x=>[x.id,x]))};
const find=(kind,id)=>{const x=maps[kind].get(id);if(!x)throw new RangeError('Unknown pigment '+kind);return x;};
export const getPigmentJointStation=id=>find('station',id);
function valid(d){if(!d||typeof d!=='object'||!d.trials||typeof d.trials!=='object'||Array.isArray(d.trials))throw new TypeError('A pigment joint draft is required');find('station',d.stationId);find('product',d.productId);find('study',d.studyId);find('alignment',d.alignmentId);find('mechanism',d.mechanismId);find('assay',d.assayId);return d;}
export function createPigmentJointDraft(){return {stationId:'product',productId:'acid-drink',studyId:'beet-foil',alignmentId:'same-group',mechanismId:'fade-same-reading',assayId:'class-equivalent',trials:{},synthesis:'',details:{}};}
export function setPigmentJointControl(d,key,value){valid(d);const controls={stationId:['station',true],productId:['product',['product','transfer'].includes(d.stationId)],studyId:['study',d.stationId==='study'],alignmentId:['alignment',d.stationId==='alignment'],mechanismId:['mechanism',d.stationId==='mechanism'],assayId:['assay',d.stationId==='assay']};const c=controls[key];if(!c||!c[1])throw new RangeError('Unavailable pigment control');find(c[0],value);d[key]=value;return d;}
function context(d){valid(d);if(['product','transfer'].includes(d.stationId))return {productId:d.productId};return Object.fromEntries([['study','studyId'],['alignment','alignmentId'],['mechanism','mechanismId'],['assay','assayId']].filter(([s])=>s===d.stationId).map(([,k])=>[k,d[k]]));}
export function getPigmentJointKey(d){const c=context(d);return d.stationId+'/'+Object.values(c)[0];}
export function getPigmentJointTrial(d){const key=getPigmentJointKey(d);if(!Object.hasOwn(d.trials,key))d.trials[key]={prediction:'',predictionReason:'',revealed:null,choice:'',reason:'',checked:null,revision:''};return d.trials[key];}
export function pigmentJointContextLabel(c){for(const[k,v]of Object.entries(c)){const kind=k.replace('Id','');return find(kind,v).label;}return '固定給定材料';}
export function getPigmentJointMaterial(d){valid(d);const kind=d.stationId==='transfer'?'product':d.stationId;return find(kind,Object.values(context(d))[0]);}
export function pigmentJointRequiresReveal(d){valid(d);return ['study','mechanism'].includes(d.stationId);}
export function getPigmentJointPrediction(){return {prompt:'先只根據目前資料身分，保留你的預測：外觀會否足以決定化學量或唯一原因？',options:[{id:'automatic',label:'我原先預期外觀能直接決定化學量或原因'},{id:'need-endpoints',label:'我預期還要分開看化學端點、方法及條件'},{id:'unknown',label:'目前未判斷，保留疑問再對照'}]};}
export function choosePigmentJointPrediction(d,id){if(!pigmentJointRequiresReveal(d))throw new RangeError('No prediction for this task');const t=getPigmentJointTrial(d);if(t.revealed)throw new Error('First prediction is already retained');if(!getPigmentJointPrediction().options.some(x=>x.id===id))throw new RangeError('Unknown pigment prediction');t.prediction=id;return d;}
export function getPigmentJointEvidence(d){valid(d);const m=getPigmentJointMaterial(d);if(d.stationId==='study')return {title:m.title,rows:m.rows,paragraphs:m.paragraphs,sourceId:m.sourceId,chemicalValue:m.chemicalValue,retention:m.retention};if(d.stationId==='mechanism')return {title:m.label,paragraphs:[m.given,'這是本課原創的證據身分練習，不是任一文獻的實測觀察，也不生成色素量、平衡比例、化學反應或品質軌跡。'],sourceId:null,chemicalValue:null,retention:null};throw new RangeError('No evidence reveal for this task');}
export function canRevealPigmentJoint(d){const t=getPigmentJointTrial(d);return pigmentJointRequiresReveal(d)&&!t.revealed&&getPigmentJointPrediction().options.some(x=>x.id===t.prediction);}
export function revealPigmentJointEvidence(d){const t=getPigmentJointTrial(d);if(!canRevealPigmentJoint(d))return false;const s=freeze({prediction:t.prediction,predictionReason:text(t.predictionReason),context:context(d),evidence:getPigmentJointEvidence(d)});lock(t,'revealed',s);lock(t,'prediction',s.prediction);lock(t,'predictionReason',s.predictionReason);return true;}
export function choosePigmentJointAnswer(d,id){if(!getPigmentJointStation(d.stationId).options.some(x=>x.id===id))throw new RangeError('Unknown pigment answer');getPigmentJointTrial(d).choice=id;return d;}
export function evaluatePigmentJoint(d){valid(d);const m=getPigmentJointMaterial(d);let explanation;
 if(d.stationId==='product')explanation=m.given+' 本台不輸出一個由pH直接決定的色素排名；舊豆乳甜點練習仍是另一個前置情境。';
 else if(d.stationId==='study')explanation=m.paragraphs.join(' ');
 else if(d.stationId==='alignment')explanation=m.id==='same-group'?'同研究同條件群組可以並列端點，但沒有個別配對觀察及誤差結構，不能算實驗相關、共變異或配對顯著性。':m.id==='independent'?'樣品、基質或分析基準不同的資料，不會因同頁呈現而成為配對實驗。既有CIELAB與化學當量獨立示例也不能事後拼接。':'分母為0，該相對保留率無定義。它不是0%或100%，也不會替產品的顏色、分子穩定性或檢出限補結論。';
 else if(d.stationId==='mechanism')explanation=m.id==='fade-same-reading'?'外觀與分析讀值是不同端點。pH形式、結合／聚集、散射、取樣與分析回收及不可逆轉化都需相符證據；一個端點沒有辨認唯一原因，也不能由近似讀值直接證明所有分子完全不變。':'外觀相近不要求成分相同。色素種類、比例、共色、基質及呈樣都可能影響外觀；本題未建立跨方法換算或個別分子穩定性。';
 else if(d.stationId==='assay')explanation=m.id==='class-equivalent'?'類別當量與個別成分是不同物件。標示疑點應保留、查證，不自行改波長名稱或把類別指標轉成HPLC個別betanin及絕對保留率。':'清楚指定分析物與相同基準能支持該分析範圍的主張，不能自動取代外觀、唯一機制、另一產品或未測安全／保存期資料。';
 else explanation=m.id==='acid-drink'?'先讓資料與酸性飲料的基質、酸度及實際歷程對齊。濃縮汁儲藏不是所有飲料；外觀與分析物各需相符取證，沒有一份結果可決定全部情境。':'中性烘焙需要該產品與實際歷程的比較。豆乳甜點不是中性烘焙；近中性起始麵糰也不補成品pH，類別當量不補個別分子保留。沒有兩家族頭對頭證據時留待比較，不宣布通用贏家或全稱無效。';
 return {key:getPigmentJointKey(d),stationId:d.stationId,context:context(d),answer:d.stationId==='transfer'?'matched':m.answer,explanation,numericRetention:null,predictsProductQuality:false};}
export function canCheckPigmentJoint(d){const t=getPigmentJointTrial(d);return !t.checked&&(!pigmentJointRequiresReveal(d)||Boolean(t.revealed))&&getPigmentJointStation(d.stationId).options.some(x=>x.id===t.choice);}
export function checkPigmentJointAnswer(d){const t=getPigmentJointTrial(d);if(!canCheckPigmentJoint(d))return false;const r=evaluatePigmentJoint(d),wrong={automatic:'已知pH只完成一項條件，不會指定所有產品的唯一贏家。',winner:'跨產品與跨端點的勝負，沒有由這份研究建立。','all-paired':'同頁呈現不等於同樣品或個別配對。',destroyed:'外觀變淡不是所有色素不可逆分解的唯一證據。',perfect:'近似外觀或讀值不等於所有化學量、機制完全相同。','all-analytes':'色差、類別當量與個別化合物不同，不能任意換單位。',borrow:'產品、取樣與熱歷程不同，原資料不能直接搬成新產品驗證。',none:'外推限制不是證明所有色素都無作用。'};const s=freeze({...r,choice:t.choice,reason:text(t.reason),correct:t.choice===r.answer,feedback:t.choice===r.answer?'此判讀符合本題的證據身分與界線。':wrong[t.choice]??'請對照目前研究、端點及資料關係，別把另一個情境的答案搬來。'});lock(t,'checked',s);lock(t,'reason',s.reason);return true;}
export function currentPigmentJointDiffers(d){const t=getPigmentJointTrial(d);return Boolean(t.checked&&t.choice!==t.checked.choice);}
export function buildPigmentJointSummary(d){valid(d);const lines=['紅色素：產品條件、外觀與化學聯合證據','研究材料為限定的作者報告；對照／機制材料明示原創，不生成色票、降解曲線、保留率或產品保證。',`目前任務：${getPigmentJointStation(d.stationId).title}`];for(const[key,t]of Object.entries(d.trials).filter(([,t])=>t.prediction||t.predictionReason||t.choice||t.reason||t.revision||t.checked).sort(([a],[b])=>a<b?-1:a>b?1:0)){const [station,value]=key.split('/'),ctx={[station==='transfer'?'productId':station+'Id']:value},item=getPigmentJointStation(station),label=id=>item.options.find(x=>x.id===id)?.label??'未選',predictionLabel=id=>getPigmentJointPrediction().options.find(x=>x.id===id)?.label??'未選';lines.push('',item.title,'條件：'+pigmentJointContextLabel(ctx));if(t.prediction||t.predictionReason)lines.push(t.revealed?'首次揭示時保留的預測：':'目前未揭示預測：',predictionLabel(t.prediction),'預測理由：',text(t.predictionReason));if(t.revealed){lines.push('已揭示：'+t.revealed.evidence.title,...t.revealed.evidence.paragraphs);if(t.revealed.evidence.rows)lines.push(...t.revealed.evidence.rows.map(r=>r.join('｜')));}lines.push('目前判讀：'+label(t.choice),'核對前理由：',text(t.reason));if(t.checked){const s=t.checked;lines.push('初答（首次核對）：'+label(s.choice),'首次核對條件：'+pigmentJointContextLabel(s.context),`首次核對：${s.correct?'符合本題證據界線':'需修訂'}`,'核對時理由：',s.reason,'選項回饋：',s.feedback,'核對說明：',s.explanation,t.choice===s.choice?'目前選項與首次核對相同。':'目前選項已改，舊核對不代表目前已答對。');}else lines.push('尚未核對，不計為答對。');lines.push('修訂：',text(t.revision));}lines.push('','我的整合短答：',text(d.synthesis),'','預測首次揭示固定，判讀初答首次核對固定；自由文字未自動評分。切條件各用有限槽。成功附加的是可讀摘要，不重建未保存盤面。');return lines.join('\n');}
