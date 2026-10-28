/** Original hypothetical records. No assay schedules or measured-food claims. */
export const MICRO_EVIDENCE_ID = 'microbiology-evidence';
const deepFreeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
};
export const MICRO_EVIDENCE_SOURCES = deepFreeze([
  {title:'FDA BAM Chapter 3 · January 2026',url:'https://www.fda.gov/food/laboratory-methods-food/bam-chapter-3-aerobic-plate-count'},
  {title:'NIST · Poisson distribution',url:'https://www.itl.nist.gov/div898/handbook/eda/section3/eda366j.htm'},
  {title:'MIQE 2.0 · qPCR evidence and controls',url:'https://academic.oup.com/clinchem/article/71/6/634/8119148'},
]);
const plate = (id,count,dilution,extra={}) => ({id,label:id,count,
  homogenateEquivalentGmL:0.1,furtherDilution:dilution,volumeML:1,
  group:'original-M',eligible:true,reason:'題設：同一均質液、同一方法與族群，獨立等分、計數有效。',...extra});
export const COUNT_CASES = deepFreeze([
  {id:'paired',label:'紀錄 A · 有菌落',description:'從同一均質液取得四份有效計數。另有一份增菌後紀錄；先決定哪些可以合併。',
    scope:'假想方法 M；所有 exact counts 的可用性由題設給定，不套通用可數區間。均質液每 mL 代表 0.1 g 原樣，後續稀釋以它為起點。',
    plates:[plate('A1',120,.1),plate('A2',132,.1),plate('B1',12,.01),plate('B2',16,.01),
      plate('E1',400,.1,{group:'enriched',eligible:false,reason:'已經增菌，族群數量被改變，不能回算為同一原樣的起始 CFU/g。'})]},
  {id:'zero',label:'紀錄 B · 未見菌落',description:'三份互不重複的等分都未見菌落。增選平板，觀察總原樣等效量如何改變。',
    scope:'假想完整回收的 Poisson 計數；無聚集、空間差異或方法失敗。不是實際食品方法的檢出限或安全判定。',
    plates:[plate('Z1',0,.1),plate('Z2',0,.1),plate('Z3',0,.1)]},
]);
const get = (list,id,label) => { const item=list.find(x=>x.id===id); if(!item)throw new RangeError(`Unknown ${label}`);return item; };
const validateIds = (ids,allowed) => {
  if(!Array.isArray(ids)||ids.length!==new Set(ids).size||ids.some(id=>typeof id!=='string'||!allowed.includes(id)))throw new RangeError('Invalid or duplicate evidence IDs');
  return new Set(ids);
};

export function representedMass(plateRecord) {
  if(!plateRecord||typeof plateRecord!=='object')throw new TypeError('A plate record is required');
  const {homogenateEquivalentGmL:c,furtherDilution:d,volumeML:v}=plateRecord;
  if(![c,d,v].every(x=>typeof x==='number'&&Number.isFinite(x)&&x>0)||d>1)throw new RangeError('Positive finite mass/volume and dilution no greater than one required');
  const mass=c*d*v;
  if(!Number.isFinite(mass)||mass<=0)throw new RangeError('Represented mass is not finite and positive');
  return mass;
}

/** Numeric estimator only for explicitly eligible independent counts of one population. */
export function estimatePlateRecords(records) {
  if(!Array.isArray(records)||!records.length||records.length>1000)throw new RangeError('One to 1000 plate records required');
  validateIds(records.map(x=>x?.id),records.map(x=>x?.id));
  const groups=new Set(records.map(x=>x.group));
  if(groups.size!==1||!records[0].group||records.some(x=>x.eligible!==true))throw new RangeError('Counts do not describe one eligible population');
  let totalCount=0,totalMassG=0;
  for(const item of records) {
    if(!Number.isSafeInteger(item.count)||item.count<0)throw new RangeError('Nonnegative exact integer counts required');
    totalCount+=item.count;totalMassG+=representedMass(item);
  }
  if(!Number.isSafeInteger(totalCount)||!Number.isFinite(totalMassG)||totalMassG<=0)throw new RangeError('Count or mass sum outside finite range');
  const estimate=totalCount/totalMassG,oneColonyEquivalent=1/totalMassG;
  const zeroUpper95=totalCount===0?-Math.log(.05)/totalMassG:null;
  if(![estimate,oneColonyEquivalent,zeroUpper95??0].every(Number.isFinite))throw new RangeError('Rate exceeds numeric range');
  return {totalCount,totalMassG,estimateCFUg:estimate,oneColonyEquivalentCFUg:oneColonyEquivalent,zeroUpper95CFUg:zeroUpper95};
}

export function analyzeCount(caseId,selectedPlateIds=[]) {
  const scenario=get(COUNT_CASES,caseId,'count case'),selected=validateIds(selectedPlateIds,scenario.plates.map(x=>x.id));
  const records=scenario.plates.filter(x=>selected.has(x.id));
  if(!records.length)return {status:'choose',selectedIds:[],result:null,problems:[]};
  const problems=records.filter(x=>!x.eligible).map(x=>`${x.label}：${x.reason}`);
  if(problems.length)return {status:'incompatible',selectedIds:[...selected],result:null,problems};
  const result=estimatePlateRecords(records);
  return {status:result.totalCount===0?'zero':'counted',selectedIds:[...selected],result,problems:[]};
}

export const PCR_CONTROLS = deepFreeze([
  {id:'ntc',label:'無模板對照 NTC',purpose:'只經反應配製，檢查這一層的背景或污染；不涵蓋取樣與萃取。'},
  {id:'blank',label:'萃取空白',purpose:'不含原樣、經相同萃取流程，檢查流程背景；空白無訊號不證明樣品已成功萃取。'},
  {id:'positive',label:'陽性反應對照',purpose:'已知目標模板在反應階段應有訊號；不是本份食品的取樣／萃取回收率。'},
  {id:'internal',label:'樣品內擴增控制 IAC',purpose:'題設於萃取後加入各樣品管，檢查擴增環節；不驗證前段取樣或萃取回收。'},
]);
const pcrCase=(id,label,target,changes={})=>({id,label,target,
  observations:{ntc:'absent',blank:'absent',positive:'present',internal:'present',...changes}});
export const PCR_CASES = deepFreeze([
  pcrCase('A','案例 A · 樣品未見目標訊號','absent'),
  pcrCase('B','案例 B · 樣品有目標訊號','present',{ntc:'present'}),
  pcrCase('C','案例 C · 樣品未見目標訊號','absent',{internal:'absent'}),
  pcrCase('D','案例 D · 樣品有目標訊號','present'),
  pcrCase('E','案例 E · 樣品未見目標訊號','absent',{positive:'absent'}),
  pcrCase('F','案例 F · 樣品有目標訊號','present',{blank:'present'}),
  pcrCase('G','案例 G · 樣品有目標訊號','present',{internal:'absent'}),
]);
export const PCR_DECISIONS = deepFreeze([
  {id:'not-interpretable',label:'對照顯示問題，不能直接報此樣品結果'},
  {id:'not-detected',label:'這份萃取物未檢出目標；不代表整批不存在'},
  {id:'detected',label:'這份萃取物檢出目標核酸；存活仍未知'},
  {id:'method-dependent',label:'目標有訊號、IAC 失敗；需查已驗證判讀規則'},
]);

export function assessPcr(caseId,revealedControlIds=[]) {
  const scenario=get(PCR_CASES,caseId,'PCR case'),revealed=validateIds(revealedControlIds,PCR_CONTROLS.map(x=>x.id));
  const missing=PCR_CONTROLS.filter(x=>!revealed.has(x.id)).map(x=>x.id);
  const visible=PCR_CONTROLS.filter(x=>revealed.has(x.id)).map(x=>({...x,result:scenario.observations[x.id]}));
  // A revealed failure is already sufficient to withhold a sample conclusion.
  // Acceptance still needs the full set; hidden findings must never diagnose it.
  const o=scenario.observations,problems=[];
  if(revealed.has('ntc')&&o.ntc==='present')problems.push('NTC 有目標訊號，反應背景或污染待釐清。');
  if(revealed.has('blank')&&o.blank==='present')problems.push('萃取空白有目標訊號，流程背景待釐清；不能只憑這一點定位污染來源。');
  if(revealed.has('positive')&&o.positive==='absent')problems.push('陽性反應對照未出現預期訊號，不能把樣品無訊號報成可靠陰性。');
  if(revealed.has('internal')&&o.internal==='absent'&&scenario.target==='absent')problems.push('樣品目標與 IAC 都無訊號，擴增抑制或管內反應失敗尚未排除；這不是可靠的陰性證據。');
  if(problems.length)return {status:'ready',missing,visible,decision:'not-interpretable',reason:problems.join(' ')+(missing.length?' 已見問題已足以暫停判讀；仍有對照未查看。':'')};
  if(missing.length)return {status:'incomplete',missing,visible,decision:null,reason:'尚有對照未查看；未查看不等於陰性。'};
  let decision,reason;
  if(o.internal==='absent'){decision='method-dependent';reason='目標訊號存在而 IAC 失敗；可能涉及競爭等原因，須依方法已驗證的規則決定可否報告。不能一律改判陰性，也不能自行忽略 IAC。';}
  else if(scenario.target==='present'){decision='detected';reason='題設已滿足此核酸檢測的特異性判準，已查對照符合預期。支持本份萃取物有目標核酸；不直接證明活菌數、原樣回收或整批安全。';}
  else {decision='not-detected';reason='已查反應對照符合預期，支持這份萃取物在方法範圍內未檢出。萃取前回收、代表性與未取樣部分仍未知。';}
  return {status:'ready',missing,visible,decision,reason};
}

export const CONCLUSION_CASES = deepFreeze([
  {id:'recovery',label:'事件 A · 核酸與培養不同步',
    initial:'同一原始均質液：核酸檢出目標、常規培養未見菌落。題設兩法已查對照符合預期；不給菌種、食品安全門檻或實際操作排程。',
    evidence:[
      {id:'recovery',label:'查看另一恢復條件的培養紀錄',requires:[],finding:'從保留原始均質液的另一等分，在不同恢復條件出現菌落，相關對照符合預期。分離株身分尚未確認。'},
      {id:'identity',label:'查看恢復菌落的身分確認',requires:['recovery'],finding:'對上一份恢復紀錄取得的分離株，獨立確認方法支持目標身分，相關對照符合預期。'},
      {id:'repeat-dna',label:'再查一次同份萃取物的核酸',requires:[],finding:'同份萃取物再次檢出目標核酸，對照符合預期；仍未新增培養或存活證據。'},
      {id:'appearance',label:'查看外觀與氣味紀錄',requires:[],finding:'觀察者未記錄明顯異味或外觀變化；此紀錄不能替代目標檢測或存活判定。'},
    ]},
  {id:'isolate',label:'事件 B · 可疑菌落是誰',
    initial:'平板有一個外觀符合初篩描述的菌落。它有形成菌落的能力，但形態本身不足以確認目標身分。',
    evidence:[
      {id:'identity',label:'查看這個分離株的身分確認',requires:[],finding:'獨立確認方法排除這個受檢分離株為題設目標，相關對照符合預期；其他菌落與未取樣部分未一併受檢。'},
      {id:'sample-dna',label:'查看原均質液的核酸篩檢',requires:[],finding:'原均質液的萃取物檢出目標核酸，對照符合預期。該訊號尚未連結到眼前這一個分離株。'},
      {id:'appearance',label:'查看食品外觀紀錄',requires:[],finding:'未記錄明顯外觀異常；不構成目標身分或食品安全證據。'},
    ]},
]);

export function inspectEvidence(caseId,revealedEvidenceIds=[]) {
  const scenario=get(CONCLUSION_CASES,caseId,'conclusion case');
  const revealed=validateIds(revealedEvidenceIds,scenario.evidence.map(x=>x.id));
  for(const e of scenario.evidence)if(revealed.has(e.id)&&e.requires.some(id=>!revealed.has(id)))throw new RangeError('Evidence prerequisite has not been obtained');
  const visible=scenario.evidence.filter(x=>revealed.has(x.id));
  const available=scenario.evidence.map(x=>({id:x.id,label:x.label,revealed:revealed.has(x.id),locked:x.requires.some(id=>!revealed.has(id)),requires:[...x.requires]}));
  let supported;
  if(caseId==='recovery')supported=revealed.has('identity')?
    '不同恢復條件下已得到並確認目標分離株，支持該受檢等分存在可恢復培養的目標；不能把原常規培養未檢出解釋成全部死亡。':
    revealed.has('recovery')?'另一恢復條件有可形成菌落的單位；身分尚未知，還不能把它連到原核酸目標。':
    '核酸與常規培養各自描述不同訊號；目前不能在全部死亡、受傷未恢復或其他方法差異之間下定論。';
  else supported=revealed.has('identity')?
    `受檢分離株已被排除為目標；這個結論只針對受檢分離株。${revealed.has('sample-dna')?'原樣核酸陽性可與這個分離株非目標同時成立，兩者不是同一證據單位。':''}`:
    `目前有可疑外觀的菌落，但身分未確認。${revealed.has('sample-dna')?'原樣核酸陽性沒有證明眼前分離株就是目標。':''}`;
  return {visible,available,supported,notEstablished:'未建立整批不存在、食品安全、原樣目標濃度，或所有細胞的存活狀態；本活動沒有估計這些量。'};
}
