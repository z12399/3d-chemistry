// Original, idealized measurement operators; these are not laboratory yields.
export const HYDROLYSIS_IDENTIFIABILITY_ID = 'hydrolysis-identifiability';
const deepFreeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
};
export const HYDROLYSIS_SOURCES = deepFreeze([
  {id:'peptide-source-tamu-amino-analysis',label:'Texas A&M Protein Chemistry Lab：Notes／Amino Acid Codes',url:'https://pcl.tamu.edu/n-amino-acid-analysis/',scope:'權威方法說明：Asn／Gln 水解後合報為 Asx／Glx，Trp 需相容的另項分析；游離背景可能與水解訊號合併。本站沒有採用操作配方。'},
  {id:'peptide-source-fao-amino-analysis',label:'FAO Food Composition Data：Amino acids／Table 7.4',url:'https://www.fao.org/4/y4705e/y4705e12.htm',scope:'權威分析資料：釋出、降解、回收與基質皆會影響胺基酸分析。本文數字與獨立 Asn 量測是原創題設，不是 FAO 實測。'}
]);
const inverseOptions = [
  {id:'unique',label:'能唯一分出原 Asn 與 Asp'},
  {id:'sum-only',label:'能求原 Asn＋Asp 總量，但一般不能拆分'},
  {id:'not-total',label:'連原 Asn＋Asp 總量也不能唯一求出'}
];
export const HYDROLYSIS_STATIONS = deepFreeze([
  {id:'pooled',label:'1．HCl 水解的合報',prompt:'若分析者只得到 A 假設產生的 Asx 報告及已知 r，能回推到哪裡？',options:inverseOptions,kind:'numeric'},
  {id:'paired',label:'2．加入獨立資訊',prompt:'另有一份已驗證、對原 Asn 專一的獨立量測。和 Asx、已知 r 合用，能回推到哪裡？',options:inverseOptions,kind:'numeric'},
  {id:'unknown',label:'3．回收仍未知',prompt:'現在只有指定 Asx 報告，回收 r 未知且沒有正下限；原 Asn／Asp 能回推到哪裡？',options:inverseOptions,kind:'numeric'},
  {id:'trp',label:'4．Trp 的未檢出',prompt:'本題指定的常規 HCl 合報法中 Trp 未檢出；哪一個後續判讀保留了方法限制？',kind:'transfer',options:[
    {id:'zero',label:'原食品沒有 Trp，可以直接記成 0'},
    {id:'compatible-method',label:'另用相容方法與回收證據確認，不能直接把原含量記 0'},
    {id:'asx',label:'把 Asx 的一半改列為 Trp'}
  ],answer:'compatible-method',explanation:'本題的常規 HCl 合報法不保留 Trp；未檢出不能區分原先沒有、分析損失或檢出能力限制。須用與 Trp 相容且已驗證的獨立方法，並核對回收；不能把本題限制擴成所有酸法都相同。Asx 合報沒有提供 Trp 的來源資訊。'},
  {id:'enzyme',label:'5．換成蛋白酶',prompt:'同一蛋白改用單一蛋白酶後，仍有未切肽段。哪個解讀合理？',kind:'transfer',options:[
    {id:'complete',label:'只要用酵素就已全部、無損地變成游離胺基酸'},
    {id:'sequence',label:'游離胺基酸總量可以直接還原全部序列'},
    {id:'release',label:'須評估切割偏好、未切位點與回收，不能先假設完全釋出'}
  ],answer:'release',explanation:'酵素的切割偏好與底物可及性會影響釋出；未切肽段正是需要核對的資訊。方法名稱不保證全部變成游離胺基酸，組成量也不能單獨還原序列。'},
  {id:'background',label:'6．游離 Asp 背景',prompt:'新樣品另含未知游離 Asp，仍與蛋白一起用本題 HCl 法合報 Asx。原本的反推式該怎麼改？',kind:'transfer',options:[
    {id:'account',label:'先量測／處理游離背景與回收；合報量不能全算成原蛋白的 Asn＋Asp'},
    {id:'same',label:'照原式把全部 Asx 當成原蛋白殘基量'},
    {id:'half',label:'不必量背景，一律將 Asx 減半'}
  ],answer:'account',explanation:'原式明定無游離背景。未知游離 Asp 可併入同一訊號，新增未知量後不能沿用原來的唯一解；需要獨立背景與回收資訊，而非任意分半。'}
]);
const byId = new Map(HYDROLYSIS_STATIONS.map(station=>[station.id,station]));
const fields = {aAsn:'候選 A 的 Asn',aAsp:'候選 A 的 Asp',bAsn:'候選 B 的 Asn',bAsp:'候選 B 的 Asp',recovery:'回收 r',independentAsn:'獨立 Asn 報告',reportedAsx:'指定 Asx 報告'};
const defaults = id => {
  const base={aAsn:'0.2',aAsp:'1.0',bAsn:'0.9',bAsp:'0.3'};
  if(id==='pooled')return {...base,recovery:'1'};
  if(id==='paired')return {...base,recovery:'1',independentAsn:'0.2'};
  if(id==='unknown')return {...base,reportedAsx:'0.96'};
  return {};
};
const emptyTrial = id => ({inputs:defaults(id),first:null,current:null,reason:'',checked:null,revision:''});
const rawText = value => typeof value==='string'?value:'';
// Only arithmetic round-off at the values' own scale; zero is never positive.
const close = (a,b) => a===b||(a!==0&&b!==0&&Math.abs(a-b)<=4*Number.EPSILON*Math.max(Math.abs(a),Math.abs(b)));
export function getHydrolysisStation(id){const station=byId.get(id);if(!station)throw new RangeError('Unknown hydrolysis station: '+String(id));return station;}
export function createHydrolysisDraft(){return {stationId:'pooled',trials:Object.fromEntries(HYDROLYSIS_STATIONS.map(s=>[s.id,emptyTrial(s.id)])),synthesis:'',details:{}};}
export function getHydrolysisTrial(draft){getHydrolysisStation(draft?.stationId);const trial=draft?.trials?.[draft.stationId];if(!trial)throw new TypeError('A hydrolysis draft is required');return trial;}
export function setHydrolysisStation(draft,id){getHydrolysisStation(id);getHydrolysisTrial(draft);draft.stationId=id;return draft;}
export function setHydrolysisInput(draft,name,value){const trial=getHydrolysisTrial(draft);if(!Object.hasOwn(trial.inputs,name))throw new RangeError('Unknown input: '+name);trial.inputs[name]=String(value);return trial;}
export function parseHydrolysisNumber(raw,label='數值'){
  if(typeof raw!=='string'||!raw.trim())throw new TypeError(label+'尚未填寫。');
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim()))throw new TypeError(label+'請填有限十進位數值。');
  const value=Number(raw.trim());if(!Number.isFinite(value)||value<0)throw new RangeError(label+'須為有限非負數。');
  if(value===0&&/[1-9]/.test(raw.trim().split(/e/i)[0]))throw new RangeError(label+'非零數值太小，超出本計算的可表示範圍；沒有改填為 0。');
  return value;
}
function recoveryValue(value){if(!Number.isFinite(value)||value<=0||value>1)throw new RangeError('已知回收 r 須大於 0 且不超過 1；本題沒有校正任意分析偏差。');return value;}
export function forwardAsx(asn,asp,recovery=1){
  if(![asn,asp].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0))throw new RangeError('Asn／Asp 須為有限非負數。');
  recoveryValue(recovery);const total=asn+asp;if(!Number.isFinite(total))throw new RangeError('原量總和超出可計算範圍。');
  const asx=recovery*total;if(total>0&&asx===0)throw new RangeError('正量乘回收後發生數值下溢；沒有把非零報告改填為 0。');
  return {total,asx};
}
export function invertAsx(asx,independentAsn,recovery=1){
  if(![asx,independentAsn].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0))throw new RangeError('報告量須為有限非負數。');
  recoveryValue(recovery);let total=asx/recovery;if(!Number.isFinite(total))throw new RangeError('反推總量超出可計算範圍。');
  if(independentAsn>total){
    // Align the whole total at an arithmetic-round-off boundary, preserving mass.
    // close() never makes a true zero compatible with a positive original amount.
    if(close(independentAsn,total))total=independentAsn;
    else throw new RangeError('獨立 Asn 大於校正後 Asx 總量；題設不相容，不能給出負 Asp。');
  }
  return {asn:independentAsn,asp:total-independentAsn,total};
}
const assumptions='原創指定量，單位 μmol；Asn 全轉成 Asp、兩者以同一回收 r 記帳、無游離胺基酸背景。獨立 Asn 報告指另一份已驗證的原 Asn 專一資訊，不是同一次酸水解把合報再分開。';
export function evaluateHydrolysis(draft){
  const station=getHydrolysisStation(draft.stationId),trial=getHydrolysisTrial(draft);
  if(station.kind==='transfer')return {valid:true,errors:[],stationId:station.id,answer:station.answer,explanation:station.explanation,assumptions:'原創遷移情境；依本課的方法限制判讀，不是新實驗結果。'};
  const values={},errors=[];
  for(const [key,raw] of Object.entries(trial.inputs))try{values[key]=parseHydrolysisNumber(raw,fields[key]);}catch(error){errors.push(error.message);}
  if(errors.length)return {valid:false,errors,stationId:station.id,assumptions};
  try{
    const aTotal=values.aAsn+values.aAsp,bTotal=values.bAsn+values.bAsp;
    if(!Number.isFinite(aTotal)||!Number.isFinite(bTotal))throw new RangeError('候選總量超出可計算範圍。');
    if(station.id==='unknown'){
      return {valid:true,errors:[],stationId:station.id,answer:'not-total',assumptions,
        reportedAsx:values.reportedAsx,recoveryKnown:false,
        candidates:[{name:'A',asn:values.aAsn,asp:values.aAsp,total:aTotal,compatible:values.reportedAsx<=aTotal||close(values.reportedAsx,aTotal)},{name:'B',asn:values.bAsn,asp:values.bAsp,total:bTotal,compatible:values.reportedAsx<=bTotal||close(values.reportedAsx,bTotal)}],
        explanation:'r 未知且只限定 0≤r≤1、沒有正下限。Asx 只給原總量的下界，不能唯一求出總量或拆分；報告為 0 也可能是 r＝0。候選相容只是存在某個 r，不是已測得真實 r。這個模式的報告另由題設指定，沒有把隱藏回收冒充已知量。'};
    }
    const a=forwardAsx(values.aAsn,values.aAsp,values.recovery),b=forwardAsx(values.bAsn,values.bAsp,values.recovery);
    const result={valid:true,errors:[],stationId:station.id,assumptions,recoveryKnown:true,recovery:values.recovery,
      candidates:[{name:'A',asn:values.aAsn,asp:values.aAsp,...a},{name:'B',asn:values.bAsn,asp:values.bAsp,...b}],sameAsx:close(a.asx,b.asx)};
    if(station.id==='paired'){
      result.inverse=invertAsx(a.asx,values.independentAsn,values.recovery);result.independentAsn=values.independentAsn;result.answer='unique';
      result.matchesA=close(result.inverse.asn,values.aAsn)&&close(result.inverse.asp,values.aAsp);
      result.matchesB=close(result.inverse.asn,values.bAsn)&&close(result.inverse.asp,values.bAsp);
      result.explanation='在本題完全轉化、已知正回收與獨立原 Asn 資訊均成立時，總量＝Asx/r，Asp＝總量−Asn，兩個未知量才有足夠獨立限制。獨立資訊不是由同一合報峰憑空拆出；若與候選均不符，要保留差異，不能強配其中一組。';
    }else{
      result.answer=a.total===0?'unique':'sum-only';
      result.explanation=a.total===0?'這是非負量且 r>0 的邊界例外：Asx＝0 迫使 Asn＋Asp＝0，所以兩者皆為 0。不能把這個特例套到正的合報量。':'已知 r 可求 Asn＋Asp＝Asx/r，但對正總量只有一條獨立限制；多組非負 Asn／Asp 都可能成立。同 Asx 不能證明同組成；不同 Asx 也只先表示所測總量不同。';
    }
    return result;
  }catch(error){return {valid:false,errors:[error.message],stationId:station.id,assumptions};}
}
function snapshot(draft){const trial=getHydrolysisTrial(draft);return {stationId:draft.stationId,inputs:{...trial.inputs},selection:trial.current,reason:rawText(trial.reason)};}
export function chooseHydrolysisAnswer(draft,id){
  const station=getHydrolysisStation(draft.stationId);if(!station.options.some(o=>o.id===id))throw new RangeError('Unknown hydrolysis answer: '+String(id));
  const trial=getHydrolysisTrial(draft);trial.current=id;if(!trial.first)Object.defineProperty(trial,'first',{value:deepFreeze(snapshot(draft)),enumerable:true,writable:false,configurable:false});return trial;
}
export function checkHydrolysisAnswer(draft){
  const trial=getHydrolysisTrial(draft),result=evaluateHydrolysis(draft);
  if(trial.checked||!trial.current||!result.valid)return false;
  Object.defineProperty(trial,'checked',{value:deepFreeze({...snapshot(draft),answer:result.answer,explanation:result.explanation,assumptions:result.assumptions,result:structuredClone(result)}),enumerable:true,writable:false,configurable:false});
  return true;
}
export function currentHydrolysisDiffers(draft){const trial=getHydrolysisTrial(draft);return Boolean(trial.checked&&JSON.stringify(trial.checked.inputs)!==JSON.stringify(trial.inputs));}
export function buildHydrolysisSummary(draft){
  const lines=['水解分析：方法留下哪些資訊？','原創理想化比較；不是實測產率、實驗配方或自由文字自動評分。'];
  const label=(station,id)=>station.options.find(o=>o.id===id)?.label||'尚未選擇';
  const inputLines=inputs=>Object.entries(inputs).map(([key,value])=>`${fields[key]}：${value}`);
  for(const station of HYDROLYSIS_STATIONS){
    const trial=draft.trials[station.id];
    lines.push('',station.label,'目前控制／原始輸入：',...inputLines(trial.inputs),`首次選擇：${label(station,trial.first?.selection)}`);
    if(trial.first)lines.push('首次控制快照：',...inputLines(trial.first.inputs),'首次理由快照：',trial.first.reason);
    lines.push(`目前選擇（未重新核對）：${label(station,trial.current)}`,'目前核對前理由：',rawText(trial.reason));
    if(trial.checked){const checked=trial.checked;lines.push(`核對時：${checked.selection===checked.answer?'選項符合這組題設':'選項需要修訂'}`,`核對時選擇：${label(station,checked.selection)}`,'核對控制快照：',...inputLines(checked.inputs),'核對理由快照：',checked.reason,'核對說明：',checked.explanation);}
    else lines.push('尚未核對；不計為答對。');
    lines.push('後續修訂：',rawText(trial.revision));
  }
  lines.push('','整合短答：',rawText(draft.synthesis),'',assumptions,'方法界線：酸水解合報／Trp 相容方法依 Texas A&M 與 FAO；未知回收、游離背景及未切肽段需另核。');
  return lines.join('\n');
}
