/** Source-bound comparison of process claims. This is not a process lethality model. */
export const THERMAL_PROCESS_COMPARISON_LAB_ID='processing-thermal-process-comparison';
export const THERMAL_COMPARISON_VERSION='2026-10-11.v1';
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export const THERMAL_COMPARISON_SOURCES=freeze([
  {id:'thermal-comparison-source-codex57',title:'Codex 乳及乳製品衛生規範（2009 版）',url:'https://www.fao.org/input/download/standards/10087/CXP_057e.pdf',locator:'PDF／印刷頁 44–47 巴氏；48–49 商業滅菌；4 儲存指示',scope:'乳品條件與流程定義；來源案例不是本工具的食品量測或通用排程。'},
  {id:'thermal-comparison-source-cfs-uht2026',title:'香港食安中心：UHT Milk: What It Is and How to Store It（2026）',url:'https://www.cfs.gov.hk/english/multimedia/multimedia_pub/multimedia_pub_fsf_236_04.html',locator:'Food Safety Focus 236，Article 4',scope:'此處只用乳品的未開封／開封後儲存條件，不外推所有巴氏食品。'},
  {id:'thermal-comparison-source-lalwani2024-thesis',title:'Lalwani 博士論文（2024）：乳品微量營養素研究',url:'https://lucris.lub.lu.se/ws/portalfiles/portal/180133694/Thesis_Shruti_Lalwani_without_papers_Lucris.pdf',locator:'印刷頁 50–52／PDF 53–55，Figure 11 與正文；Table 1 印刷頁 26／PDF 29',scope:'作者對生產尺度各處理的原乳與生產日測值之統計敘述；濃度換算至 3% 脂肪。不是跨製程兩兩檢定。'},
]);
export const THERMAL_CASES=freeze([
  {id:'pasteurized-milk',name:'巴氏處理乳',food:'Codex 全脂乳參照（效能標準以 4% 乳脂為脈絡）',identity:'official-process-example',heat:{label:'72 °C · 15 s；或 63 °C · 30 min',temperatureC:[72,63],holdingSeconds:[15,1800],identity:'paired-reference-conditions',processModes:['continuous','batch']},
    path:['乳品','巴氏處理','避免再污染的充填','封口'],packageBranch:null,
    target:'控制乳中相關病原營養細胞；不保證消除所有芽孢與腐敗微生物。',
    targetDetail:'Codex 牛乳效能標準以耐熱非產孢病原 Coxiella burnetii 至少 5 log 減少為依據；這不是本工具算出的減少量。',
    storage:'依產品標示冷藏；巴氏處理乳不因未開封就可套用常溫保存。',
    openStorage:'開封後仍需依標示冷藏與使用；原未開封保存期限不能直接沿用。',
    sources:['thermal-comparison-source-codex57','thermal-comparison-source-cfs-uht2026']},
  {id:'uht-aseptic-milk',name:'UHT ＋無菌包裝乳',food:'乳',identity:'official-process-example',heat:{label:'通常 135–150 °C · 須配合適當持溫',temperatureC:[135,150],holdingSeconds:null,identity:'range-not-complete-schedule'},
    path:['乳品','UHT 處理','受控無菌充填','封口'],packageBranch:'包材另行處理 → 無菌充填',
    target:'結合熱處理及無菌包裝，以達商業無菌為目標；不是聲稱一切生命形式為零。',
    storage:'達相應條件且包裝完整未開封時，依標示可於常溫保存至期限。',
    openStorage:'原未開封常溫保存主張不再適用；依來源，開封後 ≤4 °C 冷藏並依包裝期限使用。',
    sources:['thermal-comparison-source-codex57','thermal-comparison-source-cfs-uht2026']},
  {id:'in-container-milk',name:'密封容器內商業滅菌乳',food:'乳',identity:'official-process-example',heat:{label:'本來源未給通用溫度／時間',temperatureC:null,holdingSeconds:null,identity:'not-specified'},
    path:['乳品','充填','密封','容器內熱處理'],packageBranch:null,
    target:'在密封容器內對產品處理，以達商業無菌為目標；包裝與後續控制仍需成立。',
    storage:'須有相應商業無菌、包裝完整及標示儲存條件的證據；本卡不給保存期限。',
    openStorage:'開封使原密封包裝前提改變；須依具體產品標示另確認開封後儲存與使用。',
    sources:['thermal-comparison-source-codex57']},
]);
export const NUTRIENTS=freeze([{id:'B1',name:'B1 · 硫胺素'},{id:'B2',name:'B2 · 核黃素'},{id:'B12',name:'B12 · 鈷胺素'},{id:'E',name:'E · α-生育酚'}]);
// Values below encode the author's reported inferential categories, never percent retention.
export const NUTRITION_STUDY=freeze({
  id:'lalwani2024-figure11-subset',source:'thermal-comparison-source-lalwani2024-thesis',identity:'author-reported-statistical-categories',
  baseline:'每項處理的原乳與生產日（day 0）相比；原乳及成品濃度均換算至 3% 脂肪。',
  scope:'以下選列 Figure 11 的四項處理；省略 ESL。是否同批原乳隨機分組未核實，不能按單因子實驗解讀，不以顯著與否作跨製程的差異檢定。',
  unknowns:'此資料層未核定每格完整數值、樣本數與誤差；不提供濃度、損失率、保留率或誤差條。',
  rows:[
    {id:'htst',name:'HTST past.',process:[{temperatureC:77,seconds:15}],processLabel:'77 °C／15 s',results:{B1:'not-significant',B2:'not-significant',B12:'not-significant',E:'not-significant'}},
    {id:'high-pasteurisation',name:'High past.',process:[{temperatureC:77,seconds:15},{temperatureC:94,seconds:420}],processLabel:'77 °C／15 s → 94 °C／420 s（優格原料處理）',results:{B1:'significant-loss',B2:'significant-loss',B12:'significant-loss',E:'not-significant'}},
    {id:'uht-direct',name:'UHT direct',process:[{temperatureC:75,seconds:15},{temperatureC:140,seconds:4}],processLabel:'75 °C／15 s → 140 °C／4 s',results:{B1:'not-significant',B2:'significant-loss',B12:'not-significant',E:'not-significant'}},
    {id:'uht-indirect',name:'UHT indirect',process:[{temperatureC:75,seconds:15},{temperatureC:140,seconds:4}],processLabel:'75 °C／15 s → 140 °C／4 s',results:{B1:'not-significant',B2:'not-significant',B12:'not-significant',E:'not-significant'}},
  ],
});
function choice(value,allowed,name){if(!allowed.includes(value))throw new RangeError('Unknown '+name);return value;}
export function thermalCase(id){const value=THERMAL_CASES.find(item=>item.id===id);if(!value)throw new RangeError('Unknown thermal case');return value;}
export function nutritionEvidence(nutrient='B2'){
  choice(nutrient,NUTRIENTS.map(v=>v.id),'nutrient');
  return freeze({studyId:NUTRITION_STUDY.id,nutrient,source:NUTRITION_STUDY.source,baseline:NUTRITION_STUDY.baseline,
    rows:NUTRITION_STUDY.rows.map(row=>({processId:row.id,processName:row.name,process:row.process,processLabel:row.processLabel,status:row.results[nutrient],concentration:null,retentionPercent:null,sampleCount:null,error:null,
      label:row.results[nutrient]==='significant-loss'?'作者報告顯著降低':'作者未報告顯著降低'})),
    interpretation:'未顯著不等於零損失或 100% 保留；不同處理的顯著性不同，不等於處理間差異顯著。',
  });
}
export function evaluateThermalClaim(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||![Object.prototype,null].includes(Object.getPrototypeOf(input)))throw new TypeError('A plain state is required');
  for(const key of Object.keys(input))if(!['caseId','packageState','downstreamEvidence'].includes(key))throw new TypeError('Unknown thermal claim input: '+key);
  const product=thermalCase(input.caseId??'uht-aseptic-milk');
  const packageState=choice(input.packageState??'sealed',['sealed','opened'],'package state');
  const downstreamEvidence=choice(input.downstreamEvidence??'documented',['documented','missing'],'downstream evidence');
  const storageStatus=downstreamEvidence==='missing'?'insufficient-evidence':packageState==='opened'?'sealed-claim-not-applicable':'conditional-source-claim';
  return freeze({version:THERMAL_COMPARISON_VERSION,caseId:product.id,packageState,downstreamEvidence,heat:product.heat,
    heatRecordStatus:'unchanged',microbialCount:null,contaminationObserved:null,nutritionAfterOpening:null,
    target:product.target,storageStatus,
    storage:downstreamEvidence==='missing'?'後段／包裝證據缺失：僅憑熱處理名稱，不能確認完整產品的儲存主張。':packageState==='opened'?product.openStorage:product.storage,
    sources:product.sources,
  });
}
export function comparePackageState(caseId='uht-aseptic-milk',packageState='opened',downstreamEvidence='documented'){
  const before=evaluateThermalClaim({caseId,packageState:'sealed',downstreamEvidence});
  const after=evaluateThermalClaim({caseId,packageState,downstreamEvidence});
  return freeze({identity:'scenario-comparison-not-measurement',before,after,changedInputs:packageState==='sealed'?[]:['packageState'],
    invariantInputs:['caseId','heat','downstreamEvidence'],interpretation:'只改開封情境；原熱處理紀錄與研究測值不倒退。沒有測出新菌數或未來营養變化。'});
}
