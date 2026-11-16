/** Five source observations; no interpolation, process prescription or safety model. */
export const BLANCHING_EVIDENCE_LAB_ID='processing-blanching-evidence';
export const BLANCHING_EVIDENCE_VERSION='2026-10-11.v1';
export const BLANCHING_CLAIMS=Object.freeze({pod:'這些處理的 POD 比值都接近 0.05',vc:'這對條件的 Vc 濃度有差別',packing:'殺菁可使葉菜萎軟，便於裝罐',retention:'這些濃度可直接當成總量保留率',sterility:'POD 低就能確認罐頭商業無菌',quality:'POD 相近就代表所有品質相同'});
export const BLANCHING_EVIDENCE=Object.freeze({pod:'Table 3 的 POD 比值',vc:'Table 3 的 Vc 濃度',manual:'FAO 與葉菜罐藏流程'});
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export const BLANCHING_SOURCES=freeze([
  {
    "id": "blanching-source-wu2023",
    "type": "primary-research",
    "title": "烫漂过程中荠菜过氧化物酶失活动力学模型研究",
    "authors": [
      "吴海燕",
      "施晓玲",
      "袁秋梅"
    ],
    "year": 2023,
    "journal": "食品工业科技 / Science and Technology of Food Industry",
    "volume": "44",
    "issue": "5",
    "pages": "67–73",
    "doi": "10.13386/j.issn1002-0306.2022060096",
    "url": "https://doi.org/10.13386/j.issn1002-0306.2022060096",
    "fullTextUrl": "https://files.sciengine.com/pdfs/1002-0306/52527913B52545299D31F82F52B3FD76.pdf",
    "localPath": "sources/wu2023-capsella-pod.pdf",
    "sha256": "b349e49104ea261348ac1503f828c9d0cdd1118eaa912f84573cdd5d3a85fbe9",
    "acceptedUses": [
      "Table 3五組配對溫時的報告實測POD相對活性",
      "Table 3五組Vc濃度mean±SD與作者顯著性字母",
      "試驗材料、處理及測定方法與未知限制"
    ],
    "excludedUses": [
      "罐藏排程",
      "商業滅菌或安全門檻",
      "插值或外推",
      "跨葉菜通用工藝",
      "直接宣稱total vitamin C或true retention"
    ]
  },
  {
    "id": "blanching-source-fao1995-canning",
    "type": "official-technical-manual",
    "title": "Fruit and vegetable processing — 9.7 Vegetable canning",
    "author": "Mircea Enachescu Dauthy",
    "publisher": "FAO Agricultural Services Bulletin 119",
    "year": 1995,
    "isbn": "92-5-103657-8",
    "url": "https://www.fao.org/4/v5030e/V5030E0s.htm",
    "localPath": "sources/fao-vegetable-canning.html",
    "sha256": "e837ba6f6c8cf68c8098dea2be83675204c64af6268c7ea5fbd8bf01b6c87d9f",
    "locator": "9.7.4 Preparation；9.7.1流程；Exhausting段落",
    "acceptedUses": [
      "排除組織氣體",
      "組織收縮便於裝罐",
      "抑制影響品質的酵素反應",
      "殺菁、裝罐、排氣/預熱、密封及最終熱處理各有工序邊界"
    ],
    "excludedUses": [
      "把杀菁當作最終滅菌",
      "排除氣體等於已形成合格罐頭真空",
      "泛稱所有营養素都因殺菁提高保留"
    ]
  },
  {
    "id": "blanching-source-fao1995-preparation",
    "type": "official-technical-manual",
    "title": "Fruit and vegetable processing — 9.2 Harvesting and pre-processing",
    "author": "Mircea Enachescu Dauthy",
    "publisher": "FAO Agricultural Services Bulletin 119",
    "year": 1995,
    "url": "https://www.fao.org/4/v5030e/V5030E0q.htm",
    "localPath": "sources/fao-vegetable-preparation.html",
    "sha256": "84c02d0b7902a807b6e2049e559e7b029a58ac4c34decd3cb153a1bff98497b9",
    "locator": "9.2.7 Blanching；9.2.8；9.2.9酵素檢查",
    "acceptedUses": [
      "殺菁是短時間熱水或蒸氣預處理",
      "POD可作為處理效果的酵素指標",
      "需區分指標方法、食品及目的"
    ],
    "excludedUses": [
      "將定性guaiacol陰性判定與Wu2023的0.05定量POD比值混為相同門檻",
      "直接把該手冊所有蔬菜的陰性要求普遍化到不同研究"
    ]
  },
  {
    "id": "blanching-source-nchfp-greens",
    "type": "official-extension",
    "title": "Spinach and Other Greens",
    "publisher": "National Center for Home Food Preservation, University of Georgia",
    "publicationDate": null,
    "adaptedFrom": "USDA Complete Guide to Home Canning, 2015",
    "url": "https://nchfp.uga.edu/how/can/canning-vegetables-and-vegetable-products/spinach-and-other-greens/",
    "localPath": "sources/nchfp-spinach-canning.html",
    "sha256": "53735b02df100c8dd838bbcb85c0b5a510dcfa93e9fb9910327e21696dd9f8de",
    "acceptedUses": [
      "葉菜先蒸至萎軟、鬆裝熱填後仍需後續壓力處理，佐證工序分離",
      "不能將冷凍用冰水冷卻步驟套成所有罐藏的必要工序"
    ],
    "excludedUses": [
      "將家庭罐藏步驟當作工業排程",
      "在學習模型展示壓力/時間配方或安全計算"
    ]
  }
]);
export const BLANCHING_STUDY=freeze({
  "id": "wu2023-table3-capsella",
  "sourceId": "blanching-source-wu2023",
  "locator": "Table 3, printed p.71 (PDF page 5); §2.4. Methods printed pp.68–69 (PDF pp.2–3).",
  "foodChinese": "散葉荠菜",
  "species": "Capsella bursa-pastoris",
  "purposeContext": "荠菜汆燙酵素失活研究；引言以速凍荠菜加工為背景，不是罐藏製程驗證。",
  "material": "2月採收全株，江蘇中寶食品有限公司供樣；採收後2小時內回實驗室，4°C存放12小時；選新鮮、無蟲、未開花材料，去除泥沙和黃葉，洗淨瀝乾。",
  "treatment": "恆溫水浴熱水殺菁，處理後立即冰水冷卻並瀝乾，按研究方法取樣測定。冰水冷卻屬此試驗條件。",
  "conditionDesign": "先由作者模型選約95% POD失活條件，再將時間取整並測量POD相對活性與Vc；各列溫度及時間一起改變。",
  "authorsReportedParallelRepeats": 3,
  "replicateQualification": "§1.3寫每個實驗平行重複3次，結果mean±SD。未交代是獨立加工批、植株生物複本或同樣本測定重複，表格未逐格列n。",
  "rawReference": {
    "locator": "§2.1, printed p.69 (PDF p.3)",
    "podMean": 3695.67,
    "podSD": 31.86,
    "podUnitAsPrinted": "U/g·min",
    "vcMeanMgPer100g": 54.88,
    "vcSDMgPer100g": 0.22,
    "treatedTotalRecoveredMassG": null,
    "trueRetentionPercent": null,
    "limit": "原料Vc濃度已知，但各處理後回收總重量/含水量未知；不得直接將濃度比稱為true retention。"
  },
  "podMeasurement": {
    "name": "過氧化物酶（POD）相對活性",
    "definition": "Pt/P0；處理後酵素活性除以初始酵素活性。",
    "unit": "dimensionless-ratio",
    "displayPercentIsArithmeticOnly": true,
    "assay": "磷酸緩衝液冰浴研磨萃取；guaiacol/H2O2反應，在470 nm量測吸光變化；§1.2.3。",
    "perConditionSD": null,
    "perConditionSE": null,
    "limit": "Table 3各POD比值未附SD/SE；摘要0.050±0.001描述接近目標的範圍，不是可套给每列的誤差棒。相近值不構成統計等效。"
  },
  "vcMeasurement": {
    "name": "作者所報維生素C（Vc）濃度",
    "unit": "mg/100g",
    "assay": "§1.2.4：反相HPLC，C18柱、UV檢測、0.1%草酸流動相，外標法；完整細節引用Wu等2020方法文獻。",
    "uncertaintyType": "SD",
    "totalVitaminCConfirmed": false,
    "AAPlusDHAAConfirmed": false,
    "explicitWetOrDryBasis": null,
    "basisDescription": "按本文m為樣品質量的mg/100g表示；未明確標示wet weight或dry weight，沒有水分/乾物校正。",
    "trueRetentionPercent": null,
    "statisticalTest": "§1.3单因素ANOVA；Table 3不同小寫字母表示Vc差異P<0.05；事後比較方法未明說。",
    "limit": "本研究本文未交代DHAA還原步驟；暫不改稱total vitamin C或AA+DHAA。誤差棒只用Vc的SD，不借用到POD。"
  },
  "conditions": [
    {
      "id": "capsella-100c-20s",
      "temperatureC": 100,
      "measuredTreatmentSeconds": 20,
      "authorsPredictedSeconds": 19.89192,
      "podRelativeActivity": 0.04979,
      "podSD": null,
      "vcMeanMgPer100g": 47.62,
      "vcSDMgPer100g": 0.11,
      "vcAuthorSignificanceLetter": "a",
      "declaredParallelRepeats": 3,
      "sourceId": "blanching-source-wu2023",
      "locator": "Table 3, p.71/PDF p.5, 100°C row"
    },
    {
      "id": "capsella-95c-57s",
      "temperatureC": 95,
      "measuredTreatmentSeconds": 57,
      "authorsPredictedSeconds": 56.58163,
      "podRelativeActivity": 0.04997,
      "podSD": null,
      "vcMeanMgPer100g": 44.59,
      "vcSDMgPer100g": 0.29,
      "vcAuthorSignificanceLetter": "b",
      "declaredParallelRepeats": 3,
      "sourceId": "blanching-source-wu2023",
      "locator": "Table 3, p.71/PDF p.5, 95°C row"
    },
    {
      "id": "capsella-90c-152s",
      "temperatureC": 90,
      "measuredTreatmentSeconds": 152,
      "authorsPredictedSeconds": 151.6178,
      "podRelativeActivity": 0.05014,
      "podSD": null,
      "vcMeanMgPer100g": 41.41,
      "vcSDMgPer100g": 0.33,
      "vcAuthorSignificanceLetter": "c",
      "declaredParallelRepeats": 3,
      "sourceId": "blanching-source-wu2023",
      "locator": "Table 3, p.71/PDF p.5, 90°C row"
    },
    {
      "id": "capsella-85c-190s",
      "temperatureC": 85,
      "measuredTreatmentSeconds": 190,
      "authorsPredictedSeconds": 189.6646,
      "podRelativeActivity": 0.0497,
      "podSD": null,
      "vcMeanMgPer100g": 34.2,
      "vcSDMgPer100g": 0.22,
      "vcAuthorSignificanceLetter": "d",
      "declaredParallelRepeats": 3,
      "sourceId": "blanching-source-wu2023",
      "locator": "Table 3, p.71/PDF p.5, 85°C row"
    },
    {
      "id": "capsella-80c-287s",
      "temperatureC": 80,
      "measuredTreatmentSeconds": 287,
      "authorsPredictedSeconds": 287.0923,
      "podRelativeActivity": 0.05018,
      "podSD": null,
      "vcMeanMgPer100g": 32.09,
      "vcSDMgPer100g": 0.26,
      "vcAuthorSignificanceLetter": "e",
      "declaredParallelRepeats": 3,
      "sourceId": "blanching-source-wu2023",
      "locator": "Table 3, p.71/PDF p.5, 80°C row"
    }
  ],
  "unknowns": [
    "每次樣品質量",
    "料液比及水浴負載",
    "食品內部溫度歷程",
    "冰水冷卻時間",
    "各條件處理後回收重量",
    "樣品水分與乾物含量",
    "是否定量包括DHAA",
    "獨立加工批數及複本層級",
    "各POD值SD/SE",
    "ANOVA事後比較方法",
    "微生物或芽孢殘存量",
    "酵素再活化及後續貯藏品質",
    "裝罐體積變化與熱穿透",
    "色澤與質地的獨立量測"
  ],
  "forbiddenDerivedClaims": [
    "任一條件已安全/已滅菌/可保存若干天",
    "POD等效",
    "只因提高溫度所以Vc升高",
    "所有葉菜或所有酵素共享結果",
    "未測得的任意溫時結果",
    "0.050±0.001是POD SD",
    "Vc濃度比就是true retention",
    "冰水冷卻是所有罐藏必要工序",
    "此荠菜條件可用於製罐"
  ]
});
export const BLANCHING_PURPOSES=freeze([
  {
    "id": "enzyme-control",
    "label": "降低品質相關酵素活性",
    "status": "supported",
    "sourceIds": [
      "blanching-source-fao1995-canning",
      "blanching-source-fao1995-preparation"
    ],
    "limit": "指標酵素與測定終點須具名；不等於微生物安全或全部品質皆佳。"
  },
  {
    "id": "tissue-gas",
    "label": "排除組織氣體",
    "status": "supported",
    "sourceIds": [
      "blanching-source-fao1995-canning"
    ],
    "limit": "未測得本荠菜試验的排氣量；不能說已完成最終罐頭真空或省略排氣工序。"
  },
  {
    "id": "wilting-packing",
    "label": "使組織萎軟/收縮，便於裝罐",
    "status": "supported",
    "sourceIds": [
      "blanching-source-fao1995-canning",
      "blanching-source-nchfp-greens"
    ],
    "limit": "便於裝罐不代表越緊密越好；本研究未量測裝填密度、質地或熱穿透。"
  },
  {
    "id": "preheating",
    "label": "預熱",
    "status": "process-dependent",
    "sourceIds": [
      "blanching-source-fao1995-canning",
      "blanching-source-nchfp-greens"
    ],
    "limit": "熱裝且保留熱量的流程才可討論接續预热效应；存在殺菁後冷卻流程，不可作為每種罐藏殺菁的必然持續作用。"
  },
  {
    "id": "surface-microbes",
    "label": "表面微生物可能隨加熱減少",
    "status": "not-quantified-in-selected-study",
    "sourceIds": [],
    "limit": "此研究沒有微生物計數、芽孢存活或殺滅驗證；模型不給log reduction或安全通過。"
  }
]);
export function blanchingCondition(id){const row=BLANCHING_STUDY.conditions.find(v=>v.id===id);if(!row)throw new RangeError('Unknown measured blanching condition');return row;}
export function blanchingPurpose(id){const row=BLANCHING_PURPOSES.find(v=>v.id===id);if(!row)throw new RangeError('Unknown blanching purpose');return row;}
export function compareBlanching(aId='capsella-100c-20s',bId='capsella-80c-287s'){
  const a=blanchingCondition(aId),b=blanchingCondition(bId),same=a.id===b.id;
  return freeze({studyId:BLANCHING_STUDY.id,sourceId:BLANCHING_STUDY.sourceId,a,b,sameCondition:same,
    deltaVcMgPer100g:Number((b.vcMeanMgPer100g-a.vcMeanMgPer100g).toFixed(2)),
    deltaPod:Number((b.podRelativeActivity-a.podRelativeActivity).toFixed(5)),
    authorVcDifference:same?'same-row-no-pairwise-test':'different-author-letters-p-below-0.05',
    podEquivalenceEstablished:false,trueRetentionPercent:null,microbialReduction:null,
    interpretation:same?'目前 A、B 是同一來源列，沒有新增對照。':'溫度與時間一起改變；POD 數值相近不代表統計等效，也不能單獨歸因於溫度。'});
}
export function evaluateBlanchingClaim(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||![Object.prototype,null].includes(Object.getPrototypeOf(input)))throw new TypeError('A plain evidence state is required');
  for(const key of Object.keys(input))if(!['claim','evidence','a','b'].includes(key))throw new TypeError('Unknown evidence input: '+key);
  const {claim='pod',evidence='pod',a='capsella-100c-20s',b='capsella-80c-287s'}=input;
  if(!Object.hasOwn(BLANCHING_CLAIMS,claim)||!Object.hasOwn(BLANCHING_EVIDENCE,evidence))throw new RangeError('Unknown blanching claim or evidence');
  const comparison=compareBlanching(a,b);let status='insufficient-for-claim',explanation='這份證據量測或描述的對象，還不足以支持所選主張。';
  if(claim==='pod'&&evidence==='pod'){status='supported-in-study';explanation='五列 POD 比值為 0.04970–0.05018，接近作者選定的 0.05 目標。它是活性比，不是酵素數量；沒有各列 SD，不能宣称統計等效。';}
  if(claim==='vc'&&evidence==='vc'){status=comparison.sameCondition?'same-condition':'supported-in-study';explanation=comparison.sameCondition?'A、B 是同一列；差為 0 不代表做過等效性檢定。':'兩列作者所報 Vc 濃度不同，Table 3 字母也不同（作者 P<0.05）。這是濃度比較；沒有處理後回收總重量，不能算真實總量保留率。';}
  if(claim==='packing'&&evidence==='manual'){status='supported-purpose';explanation='手冊支持萎軟／收縮便於裝罐的目的。這項薺菜試驗沒有量測裝填體積、密度或熱穿透，不能給它捏造縮容百分比。';}
  if(claim==='retention'){explanation='mg/100g 是濃度；處理前後總量還要配對樣品質量及分析基準。此處處理後回收質量、含水量與 AA+DHAA 均未核定。';}
  if(claim==='sterility'){explanation='POD 是品質相關酵素指標，沒有微生物／芽孢存活資料。殺菁、密封與後續熱處理各有工序邊界，不能據 POD 判定商業無菌。';}
  if(claim==='quality'){explanation='POD 接近仍可能有不同 Vc 濃度；色澤、質地、氣體與貯藏變化也要各自量測。單一酵素指標不能代表全部品質。';}
  return freeze({claim,evidence,status,explanation,sourceIds:evidence==='manual'?['blanching-source-fao1995-canning','blanching-source-nchfp-greens']:['blanching-source-wu2023']});
}
