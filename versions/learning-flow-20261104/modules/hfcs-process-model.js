export const HFCS_PROCESS_ID='hfcs-process-ledger';
export const HFCS_PROCESS_LESSON_ID='carb-hfcs-process';
export const HFCS_ATOMIC_MASS=Object.freeze({C:12,H:1,O:16});
const species=Object.freeze({
  G5:Object.freeze({C:30,H:52,O:26}),G3:Object.freeze({C:18,H:32,O:16}),
  G2:Object.freeze({C:12,H:22,O:11}),Glc:Object.freeze({C:6,H:12,O:6}),
  Fru:Object.freeze({C:6,H:12,O:6}),water:Object.freeze({C:0,H:2,O:1})
});
const stage=(id,label,prompt,structure,pool,expected,before,after,water,cumulative,explanation)=>Object.freeze({id,label,prompt,structure:Object.freeze(structure.map(Object.freeze)),pool:Object.freeze(pool.map(Object.freeze)),expected:Object.freeze(expected),before:Object.freeze(before.map(Object.freeze)),after:Object.freeze(after.map(Object.freeze)),water,cumulative,explanation});
export const HFCS_PROCESS_STAGES=Object.freeze([
  stage('cut','1 · 所選一次內切','1 mol 線性 G5 有四個糖苷鍵。選一次內切：原鏈有哪些鍵，兩片段是同時形成還是先後轉換？',
    [['linear14','只有 α(1→4)，無 α(1→6)'],['branched16','本 G5 也有 α(1→6)'],['isomerize','此步把醛改成酮']],
    [['g3g2','1 mol G3＋1 mol G2'],['sequential','先 G2，再由 G2 變 G3'],['glc5','5 mol 游離 Glc'],['g5','仍只有 1 mol G5']],
    {structure:'linear14',pool:'g3g2',water:1,cumulative:1,mass:846},[['G5',1]],[['G3',1],['G2',1]],1,1,
    '一次 α(1→4) 水解形成 G3 與 G2 兩個共同產物；不是 G2 轉成 G3，也尚未變成果糖。本模型沒有 α(1→6)，沒有驗證去枝。'),
  stage('saccharify','2 · 理想完全糖化','接著讓 G3 與 G2 完全糖化。帳目中的 Glc 是什麼形式的總池？本段新增的水與累計水要分開。',
    [['free-neutral','游離、中性 D-Glc 總池'],['all-beta','五個全是新釋出 β-Glc'],['all-alpha','五個全是新釋出 α-Glc'],['bound','Glc 仍由糖苷鍵連成鏈']],
    [['glc5','5 mol Glc'],['glc3','3 mol Glc'],['g3g2','仍是 1 mol G3＋1 mol G2'],['fru5','5 mol Fru']],
    {structure:'free-neutral',pool:'glc5',water:3,cumulative:4,mass:900},[['G3',1],['G2',1]],[['Glc',5]],3,4,
    '兩片段剩下三條糖苷鍵，完全水解新增 3 mol 水；連同前段累計 4 mol。所選 glucoamylase 新釋出的葡萄糖為 β，原還原端可保留配置，且 α／β 可變旋；此帳是總中性 D-Glc 池，不把五個都指定為新生 α 或 β。'),
  stage('isomerize','3 · 給定淨異構化','題目給定：5 mol Glc 中，淨 2 mol 轉為 Fru。判斷醛／酮位置、分子式與終點 mol 池；這個數字從哪裡來？',
    [['c1-c2-same','醛 C1 → 酮 C2；式不變'],['c1-c2-water','醛 C1 → 酮 C2；多一水'],['hydrolysis','這是另一次糖苷鍵水解'],['same-carbonyl','Glc、Fru 羰基都在 C1']],
    [['glc3fru2','3 mol Glc＋2 mol Fru'],['glc2fru3','2 mol Glc＋3 mol Fru'],['fru5','5 mol Fru'],['hfcs55','由此題預測 HFCS-55']],
    {structure:'c1-c2-same',pool:'glc3fru2',water:0,cumulative:4,mass:900,meaning:'given'},[['Glc',5]],[['Glc',3],['Fru',2]],0,4,
    'Glc 的開鏈醛在 C1，Fru 的開鏈酮在 C2；兩者同為 C6H12O6。淨異構化不耗水，糖乾物仍 900 g。2/5＝40% 只由題目給定；不是 HFCS-42／55、產率、平衡轉化或 DE 預測。')
]);
export const HFCS_MEANING_OPTIONS=Object.freeze([Object.freeze(['given','題目給定的淨 2 mol']),Object.freeze(['equilibrium','本模型預測的平衡轉化']),Object.freeze(['hfcs','真 HFCS 產品組成'])]);
export const HFCS_PROCESS_PROVENANCE=Object.freeze([
  {id:'exam-114',claim:'原考題：114 食品化學第 1 題涉及澱粉轉製果糖糖漿與糖結構。',url:'https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-257.pdf',label:'原官方考卷',record:'research/ntu-food-science-exam-roadmap-2026-09-26.md:143',level:'沿用既有掃描目視紀錄；本階段沒有重看原 PDF。'},
  {id:'exam-113',claim:'原考題：113 食品加工學第 3 題涉及製程與 HFCS-55；該年保留丙組身分。',url:'https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/113/113-274.pdf',label:'原官方考卷',record:'research/ntu-food-science-exam-roadmap-2026-09-26.md:143',level:'能力連結，不是官方解答或未來配分預測。'},
  {id:'atoms',claim:'用既有中性分子的實際原子數核 C/H/O 收支；質量另用教學近似 C=12、H=1、O=16。',record:'hfcs-scope-atom-check-2026-10-01.json',level:'原創純糖計量題；不是量測值或來源產率。'},
  {id:'coproduct',claim:'既有 G5 原研究摘要支持 G2、G3；所選 C–D 切點是還原側 G2 的拓撲推論，兩圖是共同產物。',url:'https://pubmed.ncbi.nlm.nih.gov/9523717/',label:'Al Kazaz 等，1998 · 原研究摘要',record:'content-work/starch-amylase-g5-source-notes.md:30',level:'沒有重新核全文逐原子標記；不是所有酵素／長時間唯一產物。'},
  {id:'linear',claim:'本例是線性 G5：四個 α(1→4)，沒有 α(1→6)。不能由此例說去枝已驗證。',sourceId:'depth-alpha-amylase',record:'content-work/starch-amylase-g5-source-notes.md',level:'酵素條目與所選模型的鍵結範圍分開。'},
  {id:'beta-pool',claim:'所選 glucoamylase 新釋出 β-D-glucose；總中性 Glc 池不是五個全為新生 β。',sourceId:'depth-glucoamylase',record:'hfcs-next-stage-2026-10-01.md',level:'正式 EC 條目已核；亦列部分 α(1→6) 等活性，本例不排除該酵素有其他底物活性。'},
  {id:'gi-model',claim:'原 GI 卡依概覽位置展示 α 閉環 Glc、開鏈 Glc、Glc／Fru 自由開鏈端點比較與開鏈 Fru；第三位置不顯示氫移位中間體。',sourceId:'depth-glucose-isomerase',record:'content-work/xi-metal-scoping-notes.md',level:'正式 EC 條目已核；沿用原卡 primary 來源紀錄，未重讀全文。圖無蛋白／Mg／顯式水微態，不是實測連續軌跡。'},
  {id:'given',claim:'給定 2/5 的純 Glc/Fru 池可得 40%；不能預測真 HFCS-42／55、DE、產率、平衡或反應時間。',sourceId:'depth-hfcs-fda',record:'hfcs-next-stage-2026-10-01.md',level:'產品名與本題理想池分開；不使用 DE=100/n。'},
  {id:'net-water',claim:'淨水係數 0 是異構化反應計量，不表示催化過程沒有水或質子參與。',sourceId:'depth-glucose-isomerase',record:'hfcs-next-stage-2026-10-01.md',level:'不新增質子接力、反應條件或金屬微態。'},
  {id:'geometry',claim:'G5 由完整立體 SMILES 生成並回讀 InChI；每個分子的原子 ID 只在該模型內有效。',record:'assets-work/starch-fragment-validation.json',level:'代表構象，沒有跨分子 H/O 原子映射，不是實驗反應軌跡。'}
].map(Object.freeze));

export function hfcsProcessDraft(input={}){
  const draft={};for(const field of ['structure','pool','water','cumulative','mass','meaning'])draft[field]=typeof input[field]==='string'?input[field]:'';
  draft.reason=typeof input.reason==='string'?input.reason.slice(0,2000):'';return draft;
}
function selectedStage(id){const value=HFCS_PROCESS_STAGES.find(stage=>stage.id===id);if(!value)throw new RangeError('Unknown HFCS process position');return value;}
function numeric(raw){
  const value=raw.trim();if(!value||value.length>64||! /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value))return null;
  const n=Number(value),mantissa=value.split(/[eE]/)[0];
  if(!Number.isFinite(n)||n<0||(n===0&&/[1-9]/.test(mantissa)))return null;
  return n;
}
// Fixed integer answers use the decimal input itself, not rounded IEEE values.
function matchesInteger(raw,expected){
  const [mantissa,exponent='0']=raw.trim().toLowerCase().split('e');
  let digits=mantissa.replace('.','').replace(/^0+/,''),power=Number(exponent)-(mantissa.split('.')[1]?.length||0);
  if(!digits)return expected===0;
  while(digits.endsWith('0')){digits=digits.slice(0,-1);power++;}
  const target=String(expected);return power>=0&&digits.length+power===target.length&&digits+'0'.repeat(power)===target;
}
const total=pool=>Object.fromEntries(['C','H','O'].map(element=>[element,pool.reduce((sum,[id,mol])=>sum+species[id][element]*mol,0)]));
const mass=atoms=>Object.entries(HFCS_ATOMIC_MASS).reduce((sum,[element,weight])=>sum+atoms[element]*weight,0);
export function hfcsProcessLedger(id){
  const stage=selectedStage(id),left=total([...stage.before,['water',stage.water]]),right=total(stage.after);
  return {id:stage.id,before:stage.before.map(([id,mol])=>({id,mol,elements:{...species[id]},massG:mass(species[id])*mol})),after:stage.after.map(([id,mol])=>({id,mol,elements:{...species[id]},massG:mass(species[id])*mol})),waterMol:stage.water,cumulativeWaterMol:stage.cumulative,left,right,balanced:['C','H','O'].every(element=>left[element]===right[element]),reactantMassG:mass(left),sugarMassG:mass(right),startSugarMassG:mass(species.G5),cumulativeWaterMassG:stage.cumulative*mass(species.water),molecularFormula:stage.id==='isomerize'?'C6H12O6':null};
}
export function evaluateHfcsProcess(id,input){
  const stage=selectedStage(id),draft=hfcsProcessDraft(input),values={water:numeric(draft.water),cumulative:numeric(draft.cumulative),mass:numeric(draft.mass)};
  const fields=['structure','pool','water','cumulative','mass',...(id==='isomerize'?['meaning']:[])];
  const valid=field=>field==='structure'?stage.structure.some(([key])=>key===draft[field]):field==='pool'?stage.pool.some(([key])=>key===draft[field]):field==='meaning'?HFCS_MEANING_OPTIONS.some(([key])=>key===draft[field]):values[field]!==null;
  const missing=fields.filter(field=>!valid(field)),mismatches=fields.filter(field=>valid(field)&&(field in values?!matchesInteger(draft[field],stage.expected[field]):draft[field]!==stage.expected[field]));
  const feedback=[];
  if(missing.length)feedback.push('請填完這段的結構、產物池與三個數值；空白不能當作 0，數值須為有限非負數。'+(id==='isomerize'?'還要判斷 2 mol 的來源。':''));
  if(mismatches.includes('structure')||mismatches.includes('pool'))feedback.push(stage.explanation);
  if(mismatches.includes('water')||mismatches.includes('cumulative'))feedback.push('本段新增 '+stage.water+' mol 水；累計 '+stage.cumulative+' mol。新增與累計是不同欄位。');
  if(mismatches.includes('mass'))feedback.push('糖乾物質量為 '+stage.expected.mass+' g；水解耗水的元素進入糖，不能把濃縮時「糖固形物不變」套到此水解帳。');
  if(mismatches.includes('meaning'))feedback.push('淨 2 mol 由題目給定，40% 只是這個理想池的結果；不是平衡、產率、HFCS 產品或 DE 預測。');
  if(!missing.length&&!mismatches.length)feedback.push(stage.explanation);
  return {id,draft,complete:missing.length===0,correct:missing.length===0&&mismatches.length===0,missing,mismatches,feedback,ledger:hfcsProcessLedger(id)};
}
const answerLabel=(options,value)=>options.find(([id])=>id===value)?.[1]||value||'尚未填寫';
export function hfcsProcessSummary(state){
  const lines=['HFCS 原課 · 1 mol 線性 G5 的理想教學帳','固定假設：一次所選內切 → 理想完全糖化 → 給定淨 2 mol Glc 異構化。C=12、H=1、O=16；不是 HFCS 規格、DE、平衡或產率預測。'];
  for(const stage of HFCS_PROCESS_STAGES){
    const entry=state.entries[stage.id];lines.push('\n'+stage.label);
    if(!entry.visited){lines.push('此製程位置尚未打開；沒有自己的答案或核對。');continue;}
    const draft=hfcsProcessDraft(entry.draft);
    lines.push('自己的結構判斷：'+answerLabel(stage.structure,draft.structure),'自己的產物池：'+answerLabel(stage.pool,draft.pool),'自己填的本段水／累計水／糖乾物：'+[draft.water||'未填',draft.cumulative||'未填',draft.mass||'未填'].join('／')+'（mol／mol／g）');
    if(stage.id==='isomerize')lines.push('自己判斷 2 mol 的來源：'+answerLabel(HFCS_MEANING_OPTIONS,draft.meaning));
    lines.push('目前輸入核對：'+(entry.result?(entry.result.correct?'與固定題目相符':entry.result.complete?'已核對，仍需修正':'已嘗試，欄位未完成'):'尚未核對'),'參考帳：'+(entry.revealed?'已展開（不代表自己已完成）':'尚未展開'));
    if(draft.reason!=='')lines.push('自己的理由：\n'+draft.reason);
  }
  lines.push('\n來源說明：'+(state.sourcesViewed?'已展開':'尚未展開'),'原 3D 卡：G5 '+(state.opened.g5?'已要求開啟':'尚未開啟')+'；GI '+(state.opened.gi?'已要求開啟':'尚未開啟')+'（不據此宣稱看完或理解）。','操作草稿只在本頁暫留；本摘要分開記自己的答案、核對與參考曝光。');
  return lines.join('\n');
}
