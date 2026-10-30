/** Original discrete stoichiometric exercise. Each action is a completed
 * reaction extent, not elapsed time, metabolic flux or a measured cell.
 * ADP/Pi are assumed available; only the selected carbon and NAD pools and
 * the ATP teaching ledger are represented. See the source contract below.
 */
export const FERMENTATION_REDOX_LAB_ID='fermentation-redox-lab';
export const FERMENTATION_REDOX_VERSION='fermentation-redox/v1';
const frozen=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(frozen);Object.freeze(value);}return value;};
export const FERMENTATION_REDOX_DEFAULTS=frozen({route:'homolactic',glucoseUnits:3,nadPool:2,initialAtp:2});
export const FERMENTATION_REDOX_ROUTES=frozen({
  homolactic:{id:'homolactic',label:'乳酸路徑（L-LDH 示例）',short:'乳酸路徑',steps:['invest','payoff','ldh'],nodes:['glucose','g3p','pyruvate','lactate']},
  alcoholic:{id:'alcoholic',label:'乙醇路徑（酵母型）',short:'乙醇路徑',steps:['invest','payoff','pdc','adh'],nodes:['glucose','g3p','pyruvate','acetaldehyde','ethanol']},
});
export const FERMENTATION_REDOX_SPECIES=frozen({
  glucose:{name:'葡萄糖',carbon:6},g3p:{name:'G3P',longName:'甘油醛 3-磷酸',carbon:3},pyruvate:{name:'丙酮酸',carbon:3},
  lactate:{name:'L-乳酸根',carbon:3},acetaldehyde:{name:'乙醛',carbon:2},ethanol:{name:'乙醇',carbon:2},co2:{name:'CO₂',carbon:1},
  nadOx:{name:'NAD⁺',carbon:null},nadRed:{name:'NADH',carbon:null},atp:{name:'ATP',carbon:null},
});
export const FERMENTATION_REDOX_STEPS=frozen({
  invest:{id:'invest',label:'投資 2 ATP',name:'投資段與三碳糖異構化',needs:{glucose:1,atp:2},delta:{glucose:-1,g3p:2,atp:-2},invested:2,formed:0,
    shorthand:'1 葡萄糖 → 2 G3P；投入 2 ATP',note:'合併糖解投資段與 DHAP → G3P 異構化，不是單一酵素反應。'},
  payoff:{id:'payoff',label:'回收 2 ATP',name:'一份 G3P 的回收段',needs:{g3p:1,nadOx:1},delta:{g3p:-1,pyruvate:1,nadOx:-1,nadRed:1,atp:2},invested:0,formed:2,
    shorthand:'1 G3P → 1 丙酮酸；1 NAD⁺ → 1 NADH；形成 2 ATP',note:'合併 GAPDH 與後續回收段；NAD⁺ 在 GAPDH 步驟受還原，兩個 ATP 由後續底物層級磷酸化形成。'},
  ldh:{id:'ldh',label:'還原成乳酸',name:'L-乳酸脫氫酶示例',needs:{pyruvate:1,nadRed:1},delta:{pyruvate:-1,lactate:1,nadRed:-1,nadOx:1},invested:0,formed:0,
    shorthand:'1 丙酮酸 → 1 L-乳酸根；1 NADH → 1 NAD⁺',note:'此處選 L-LDH 的還原方向；不表示所有乳酸菌只形成 L-乳酸，也不表示此酵素只能單向反應。'},
  pdc:{id:'pdc',label:'脫羧放出 CO₂',name:'丙酮酸脫羧',needs:{pyruvate:1},delta:{pyruvate:-1,acetaldehyde:1,co2:1},invested:0,formed:0,
    shorthand:'1 丙酮酸 → 1 乙醛 + 1 CO₂',note:'這一步不再生 NAD⁺，也不形成 ATP；酵素所需的輔因子等未另建數量池。'},
  adh:{id:'adh',label:'還原成乙醇',name:'乙醛還原',needs:{acetaldehyde:1,nadRed:1},delta:{acetaldehyde:-1,ethanol:1,nadRed:-1,nadOx:1},invested:0,formed:0,
    shorthand:'1 乙醛 → 1 乙醇；1 NADH → 1 NAD⁺',note:'酵母型乙醇端點的還原方向；NADH 提供一對電子的還原當量，不另外形成 ATP。'},
});
// Reviewed source records are copied verbatim from the frozen candidate contract.
export const FERMENTATION_REDOX_SOURCES=frozen([
  {
    "id": "fermentation-source-openstax82",
    "title": "OpenStax Microbiology 8.2：Catabolism of Carbohydrates",
    "url": "https://openstax.org/books/microbiology/pages/8-2-catabolism-of-carbohydrates",
    "locator": "Glycolysis 段落；Figure 8.10 的 energy investment 與 payoff phases",
    "acceptedUses": [
      "EMP：1 glucose 先投入 2 ATP，得到 2 個三碳 G3P；投資段已合併 DHAP 異構化。",
      "每個 G3P 的回收段形成 1 pyruvate、1 NADH，產生 2 ATP；整個 glucose 合計產生 4 ATP、投入 2 ATP、淨 2 ATP。"
    ],
    "limits": [
      "教材的反應步驟支持計量，並非食品菌株的產率、動力學或 NAD 池實測值。",
      "本候選僅採 EMP；不代表所有微生物的葡萄糖代謝都走 EMP。"
    ],
    "sourceType": "authoritative textbook",
    "publicationDate": null,
    "retrievedUtc": "2026-10-11T09:45:10.724831+00:00",
    "localFile": "sources/openstax-microbiology-8.2.html",
    "sha256": "7c96c49a291a6e20abfab475895218ceaa5382d67d5265d905720e704856b22b"
  },
  {
    "id": "fermentation-source-openstax84",
    "title": "OpenStax Microbiology 8.4：Fermentation",
    "url": "https://openstax.org/books/microbiology/pages/8-4-fermentation",
    "locator": "lactic acid fermentation 段落與未編號的 pyruvate/NADH 可逆式；alcohol fermentation 段落與 Figure 8.17",
    "acceptedUses": [
      "乳酸支路將 pyruvate 還原並將 NADH 氧化回 NAD+。",
      "Saccharomyces 型乙醇支路先將 pyruvate 脫羧成 acetaldehyde 與 CO2，再由 acetaldehyde 還原成 ethanol 並再生 NAD+。",
      "這兩個選定末端支路本身不另外產生 ATP；EMP 的 ATP 由底物階層磷酸化產生。"
    ],
    "limits": [
      "不把 selected-route 的 2 ATP 推廣成全部 fermentation 的通則。",
      "乙醇支路不能泛化為所有菌或所有含乙醇食品的唯一路徑。",
      "乳酸支路的 L 特異性由 EC 1.1.1.27 補足；不宣稱所有乳酸菌只產 L-lactate。"
    ],
    "sourceType": "authoritative textbook",
    "publicationDate": null,
    "retrievedUtc": "2026-10-11T09:45:10.940964+00:00",
    "localFile": "sources/openstax-microbiology-8.4.html",
    "sha256": "26fc8309daf05d46ad0aff522b0505cc68c3df4ffb8662979c5d4114dadf028e"
  },
  {
    "id": "fermentation-source-iubmb-map15",
    "title": "IUBMB–Nicholson：Glycolysis in liver and muscle, map 15",
    "url": "https://www.iubmb-nicholson.org/pdf/15.pdf",
    "locator": "單頁圖下方 Glycolysis summary；中段 glyceraldehyde-3-phosphate、NAD/NADH 與 ATP 轉換",
    "acceptedUses": [
      "獨立交叉核對 EMP 每 glucose 的 2 pyruvate、2 NADH 與淨 2 ATP。"
    ],
    "limits": [
      "圖以肝與肌為背景；本候選只採共有 EMP 計量，不借用人體調控、細胞器或其他分支。",
      "圖上未提供本教學的 NAD 池 1/2/4 或 ATPseed 2 初值。"
    ],
    "sourceType": "biochemical reference map",
    "publicationDate": "2002",
    "retrievedUtc": "2026-10-11T09:45:09.151492+00:00",
    "localFile": "sources/iubmb-nicholson-glycolysis-map15.pdf",
    "sha256": "6db74985c7a50de140b4042e28ea95fb803d9925da49c74d33535868f7212009"
  },
  {
    "id": "fermentation-source-expasy-gapdh",
    "title": "ExPASy ENZYME EC 1.2.1.12：glyceraldehyde-3-phosphate dehydrogenase (phosphorylating)",
    "url": "https://enzyme.expasy.org/EC/1.2.1.12",
    "locator": "Reaction catalysed 欄",
    "acceptedUses": [
      "每個 D-G3P 在這一步需要 1 NAD+ 並形成 1 NADH；將有限 NAD 池的需求定位在回收段。"
    ],
    "limits": [
      "該 EC 反應只到 1,3-bisphosphoglycerate，不是單一酵素直接把 G3P 變成 pyruvate 並產生 2 ATP。",
      "回收按鈕必須明示為合併多步；ATP 數量另由 EMP 全途徑來源支持。"
    ],
    "sourceType": "expert-curated enzyme database",
    "publicationDate": null,
    "retrievedUtc": "2026-10-11T09:45:09.151492+00:00",
    "localFile": "sources/expasy-ec1.2.1.12.html",
    "sha256": "1a911ad93d67a16bfa3e7f193935f5faff31d656aadbf954753fc92d70aada64"
  },
  {
    "id": "fermentation-source-expasy-ldh",
    "title": "ExPASy ENZYME EC 1.1.1.27：L-lactate dehydrogenase",
    "url": "https://enzyme.expasy.org/EC/1.1.1.27",
    "locator": "Reaction catalysed 欄；(S)-lactate / pyruvate 的 NAD 反應",
    "acceptedUses": [
      "本候選採發酵還原方向：1 pyruvate + 1 NADH 形成 1 L-lactate 並回收 1 NAD+；無 ATP 生成。"
    ],
    "limits": [
      "資料庫書寫方向為 lactate 氧化方向；本教學反向由 OpenStax 發酵敘述交叉支持。",
      "此為選定 L-LDH 支路；D-LDH、混合酸與菌株差異不在模型中。",
      "省略 H+ 時只能称碳與輔酶帳本，不能稱完整電荷或所有原子配平式。"
    ],
    "sourceType": "expert-curated enzyme database",
    "publicationDate": null,
    "retrievedUtc": "2026-10-11T09:45:09.152498+00:00",
    "localFile": "sources/expasy-ec1.1.1.27.html",
    "sha256": "0e835c532c8e31fcfa1a069a68028c6600eb091419330d0231cd199f7e052cee"
  },
  {
    "id": "fermentation-source-expasy-pdc",
    "title": "ExPASy ENZYME EC 4.1.1.1：pyruvate decarboxylase",
    "url": "https://enzyme.expasy.org/EC/4.1.1.1",
    "locator": "Reaction catalysed 欄；pyruvate 特例由 OpenStax Figure 8.17 指定",
    "acceptedUses": [
      "1 pyruvate 的三碳變成 1 acetaldehyde 的二碳與 1 CO2 的一碳。",
      "這個脫羧步驟不改變 NAD+/NADH 數量，也不產生 ATP。"
    ],
    "limits": [
      "資料庫式為較廣的 2-oxocarboxylate→aldehyde；本模型用 pyruvate 特例。",
      "看到 CO2 並不等於本模型已完成 NAD 再生；不能延伸為所有產氣發酵的判準。"
    ],
    "sourceType": "expert-curated enzyme database",
    "publicationDate": null,
    "retrievedUtc": "2026-10-11T09:45:09.273292+00:00",
    "localFile": "sources/expasy-ec4.1.1.1.html",
    "sha256": "2dc62c0c97a379e9f5caf5b6bda7c3a1bc2315efa403e5e1da8669466b03bbb4"
  },
  {
    "id": "fermentation-source-expasy-adh",
    "title": "ExPASy ENZYME EC 1.1.1.1：alcohol dehydrogenase",
    "url": "https://enzyme.expasy.org/EC/1.1.1.1",
    "locator": "Reaction catalysed 第一式及 Comment(s)；乙醇特例由 OpenStax Figure 8.17 指定",
    "acceptedUses": [
      "本候選採 acetaldehyde 還原方向：1 acetaldehyde + 1 NADH 形成 1 ethanol 並回收 1 NAD+；無 ATP 生成。"
    ],
    "limits": [
      "資料庫涵蓋多種醇且以氧化方向書寫；只把 ethanol/acetaldehyde 特例用於選定酵母支路。",
      "不預測平衡位置、實際反應速度或最終酒精濃度。"
    ],
    "sourceType": "expert-curated enzyme database",
    "publicationDate": null,
    "retrievedUtc": "2026-10-11T09:45:09.277293+00:00",
    "localFile": "sources/expasy-ec1.1.1.1.html",
    "sha256": "5d7c2812d0b7c220ef1eb165bb0c6bf18289fabf39a7163a649deffd3d0f4ba9"
  },
  {
    "id": "fermentation-source-neves2002",
    "title": "Neves et al. (2002)：Is the glycolytic flux in Lactococcus lactis primarily controlled by the redox charge?",
    "url": "https://doi.org/10.1074/jbc.M202573200",
    "locator": "J Biol Chem 277(31):28088–28098；Abstract p.28088；Discussion pp.28096–28097 與 Figure 6；PDF pp.1,9,10",
    "acceptedUses": [
      "原始研究顯示真實 L. lactis 的碳流調節與替代 NAD 再生路徑比單一有限池模型複雜。",
      "LDH 缺失在研究厭氧條件下顯著降低耗糖速率而非完全歸零；作者不支持將野生型糖解主要控制歸於 NADH 對 GAPDH 的影響。"
    ],
    "limits": [
      "只用來界定模型限制，不把該菌株、NMR 數值、氧條件或任何實驗倍率當作本教材參數。",
      "本候選的 pause/不執行末端反應不能命名成真實 LDH knockout 預測。",
      "文件為原始論文的 Semantic Scholar 公開鏡像；作者、題名、DOI 與頁碼已核對。"
    ],
    "sourceType": "primary research article",
    "publicationDate": "2002-08-02",
    "retrievedUtc": "2026-10-11T09:49:04.342268+00:00",
    "localFile": "sources/neves2002-jbc-redox-primary.pdf",
    "sha256": "7f549cf2381f62d5905d0f42ee3fdf3518ae9aa8e63aa3277caaca9a611c5db5"
  }
]);
export const FERMENTATION_REDOX_LIMITS=frozen([
  "這是所選反應網路內的局部計量帳本；不是完整 H/O/P/電荷配平、熱力學平衡、反應速率或菌株培養模擬。",
  "核心碳帳只核對葡萄糖及其所選含碳產物；不把 NAD/ATP 的分子碳骨架計入該帳。",
  "ATP 啟動餘額 2 是本次離散步驟的教學初值，不是細胞普遍最低 ATP、濃度或實測門檻。",
  "ADP/Pi 外部充分供應使 ATP 帳僅能核對產生與投入；不能宣稱完整 adenylate 或磷原子總池守恆。",
  "NAD 池只含 NAD+ 與 NADH 且封閉；真實细胞另有合成、分解、其他氧化還原反應與調控。",
  "單靠 glucose、NAD 帳與這五步不能預測 pH、菌量、時間、轉化率、酒精濃度、乳酸濃度、品質或食品安全。",
  "L-lactate 與 yeast ethanol 是分開的選定方案；切换方案不是同一菌株實際改變代謝路線的證据。",
  "未建模異型乳酸途徑、NADP(H)、acetate 產 ATP 支路、其他混合酸、細胞物質合成與運輸。",
  "不新增氧濃度旋鈕；不把未執行某步解釋成真實酵素抑制或基因缺失的定量預測。",
  "原圖僅作來源目視核對；新增 UI 以自撰示意與摘要呈現。"
]);
const stateKeys=['version','route','initialGlucoseUnits','nadPool','initialAtp','glucose','g3p','pyruvate','lactate','acetaldehyde','ethanol','co2','nadOx','nadRed','atp','investedAtp','formedAtp','counts'];
const actions=Object.keys(FERMENTATION_REDOX_STEPS),species=Object.keys(FERMENTATION_REDOX_SPECIES);
function plain(value,name){if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)throw new TypeError(`${name} must be a plain object`);}
function exactKeys(value,allowed,name){plain(value,name);if(Object.keys(value).some(k=>!allowed.includes(k))||allowed.some(k=>!Object.hasOwn(value,k)))throw new TypeError(`${name} has missing or unknown fields`);}
function integer(value,min,max,name){if(!Number.isSafeInteger(value)||value<min||value>max)throw new RangeError(`${name} outside supported integer range`);}
function route(id){if(typeof id!=='string'||!Object.hasOwn(FERMENTATION_REDOX_ROUTES,id))throw new RangeError('Unknown fermentation route');return FERMENTATION_REDOX_ROUTES[id];}

export function createRedoxState(options={}){
  plain(options,'options');if(Object.keys(options).some(k=>!['route','glucoseUnits','nadPool'].includes(k)))throw new TypeError('Unknown initial condition');
  const p={...FERMENTATION_REDOX_DEFAULTS,...options};route(p.route);integer(p.glucoseUnits,1,5,'glucoseUnits');
  if(![1,2,4].includes(p.nadPool))throw new RangeError('NAD pool must be 1, 2 or 4 teaching units');
  return frozen({version:FERMENTATION_REDOX_VERSION,route:p.route,initialGlucoseUnits:p.glucoseUnits,nadPool:p.nadPool,initialAtp:2,
    glucose:p.glucoseUnits,g3p:0,pyruvate:0,lactate:0,acetaldehyde:0,ethanol:0,co2:0,nadOx:p.nadPool,nadRed:0,atp:2,investedAtp:0,formedAtp:0,
    counts:{invest:0,payoff:0,ldh:0,pdc:0,adh:0}});
}

export function validateRedoxState(s){
  exactKeys(s,stateKeys,'state');if(s.version!==FERMENTATION_REDOX_VERSION)throw new RangeError('Unknown model version');const r=route(s.route);
  integer(s.initialGlucoseUnits,1,5,'initialGlucoseUnits');if(![1,2,4].includes(s.nadPool)||s.initialAtp!==2)throw new RangeError('Unsupported initial pools');
  for(const k of [...species,'investedAtp','formedAtp'])integer(s[k],0,30,k);
  exactKeys(s.counts,actions,'reaction counts');for(const k of actions)integer(s.counts[k],0,10,k);
  if(actions.some(k=>!r.steps.includes(k)&&s.counts[k]!==0))throw new RangeError('Reaction outside selected route');
  const c=s.counts,expected={glucose:s.initialGlucoseUnits-c.invest,g3p:2*c.invest-c.payoff,pyruvate:c.payoff-c.ldh-c.pdc,
    lactate:c.ldh,acetaldehyde:c.pdc-c.adh,ethanol:c.adh,co2:c.pdc,nadRed:c.payoff-c.ldh-c.adh,nadOx:s.nadPool-c.payoff+c.ldh+c.adh,
    atp:2+2*c.payoff-2*c.invest,investedAtp:2*c.invest,formedAtp:2*c.payoff};
  if(Object.entries(expected).some(([k,v])=>s[k]!==v))throw new RangeError('State does not match the represented reaction extents');
  return true;
}

export function redoxStepAvailability(s,id){
  validateRedoxState(s);const r=route(s.route);if(!r.steps.includes(id))throw new RangeError('Reaction outside selected route');
  const step=FERMENTATION_REDOX_STEPS[id],missing=Object.entries(step.needs).filter(([key,n])=>s[key]<n).map(([key,n])=>({key,name:FERMENTATION_REDOX_SPECIES[key].name,required:n,available:s[key]}));
  return frozen({id,possible:missing.length===0,missing});
}

export function applyRedoxStep(s,id){
  const availability=redoxStepAvailability(s,id),step=FERMENTATION_REDOX_STEPS[id];
  if(!availability.possible)return frozen({status:'blocked',action:id,state:{...s,counts:{...s.counts}},missing:availability.missing,delta:null,
    message:`本次「${step.name}」無法執行：${availability.missing.map(m=>`${m.name} 需 ${m.required}，目前 ${m.available}`).join('；')}。數量保持不變。`});
  const next={...s,counts:{...s.counts,[id]:s.counts[id]+1},investedAtp:s.investedAtp+step.invested,formedAtp:s.formedAtp+step.formed};
  for(const [key,delta] of Object.entries(step.delta))next[key]+=delta;
  validateRedoxState(next);
  return frozen({status:'applied',action:id,state:frozen(next),missing:[],delta:step.delta,message:step.shorthand+'。'});
}

export function redoxReadings(s){
  validateRedoxState(s);
  const carbonBySpecies=Object.entries(FERMENTATION_REDOX_SPECIES).filter(([,v])=>v.carbon!==null).map(([id,v])=>({id,name:v.name,units:s[id],carbonPerUnit:v.carbon,carbonUnits:s[id]*v.carbon}));
  const carbonTotal=carbonBySpecies.reduce((total,v)=>total+v.carbonUnits,0),carbonInitial=6*s.initialGlucoseUnits;
  const cofactorTotal=s.nadOx+s.nadRed,netAtp=s.formedAtp-s.investedAtp;
  const complete=s.glucose===0&&s.g3p===0&&s.pyruvate===0&&s.acetaldehyde===0&&s.nadRed===0;
  return frozen({carbonBySpecies,carbonTotal,carbonInitial,carbonConserved:carbonTotal===carbonInitial,
    nadOx:s.nadOx,nadRed:s.nadRed,cofactorTotal,cofactorConserved:cofactorTotal===s.nadPool,
    initialAtp:s.initialAtp,investedAtp:s.investedAtp,formedAtp:s.formedAtp,remainingAtp:s.atp,netAtp,
    atpLedgerConsistent:s.atp===s.initialAtp+netAtp,complete,successfulSteps:Object.values(s.counts).reduce((a,b)=>a+b,0)});
}
