/** Original equilibrium teaching model; no third-party code or artwork.
 * Sequential macroscopic dissociation constants describe charge-state pools.
 * A pool can contain multiple microscopic protonation patterns (protomers).
 * A representative molecular drawing does not make its pool a unique protomer.
 */
function preset(id,label,nameEn,pKas,fullyProtonatedCharge,macroStateLabels){
  return Object.freeze({id,label,nameEn,pKas:Object.freeze(pKas),fullyProtonatedCharge,macroStateLabels:Object.freeze(macroStateLabels)});
}
export const AMINO_ACID_PRESETS = Object.freeze({
  alanine:preset('alanine','丙胺酸','Alanine',[2.34,9.69],1,['H₂A⁺','HA⁰（含兩性離子）','A⁻']),
  aspartic:preset('aspartic','天門冬胺酸','Aspartic acid',[1.88,3.65,9.60],1,['H₃A⁺','H₂A⁰（含兩性離子）','HA⁻','A²⁻']),
  lysine:preset('lysine','離胺酸','Lysine',[2.18,8.95,10.53],2,['H₃A²⁺','H₂A⁺','HA⁰（含兩性離子）','A⁻']),
});
export const AMINO_ACID_DEFAULTS = Object.freeze({aminoAcidId:'alanine',pH:6.01});
export const AMINO_ACID_LIMITS = Object.freeze({pH:Object.freeze({min:0,max:14,step:0.01})});
export const AMINO_ACID_SOURCES = Object.freeze([
  Object.freeze({id:'openstax-amino-acid-pka',title:'OpenStax · 胺基酸結構與 pKa 表',url:'https://openstax.org/books/organic-chemistry/pages/26-1-structures-of-amino-acids',scope:'Table 26.1 中 alanine、aspartic acid、lysine 三列。採其 pKa 作固定教材參數，未宣稱精確實測溫度、離子強度或微觀位點常數。'}),
  Object.freeze({id:'openstax-amino-acid-pi',title:'OpenStax · 胺基酸酸鹼形態與等電點',url:'https://openstax.org/books/organic-chemistry/pages/26-2-amino-acids-and-the-henderson-hasselbalch-equation-isoelectric-points',scope:'酸鹼平衡、兩性離子、等電點與相鄰解離的概念。此處自行推導完整宏觀分率；不使用教材分段近似的「全部」措辭或把形態進程直接當實際 NaOH 劑量。'}),
]);
export const AMINO_ACID_ASSUMPTIONS = Object.freeze([
  '游離胺基酸、已知平衡 pH、理想濃度近似；以指定教材 pKa 建立順序宏觀解離模型，不是蛋白質或真實食品配方的量測預測。',
  '宏觀狀態依失去的質子數與總電荷分組；同組可能有多個 protomer。教材常見結構只作代表，不宣稱特定位點的唯一分率。',
  'pKa 以固定教材值使用，未隨溫度、介質、離子強度、構形或鄰近基團更新；每一段不是互不影響位點的獨立 H–H 分率乘積。',
  '平均電荷是群體加權平均，單個分子的總電荷仍是整數；平均為零不代表每個分子或每個官能基都不帶電。',
  '平均失去質子數以全質子化宏觀形態為基準，不等於實際加入 NaOH 的當量；此處沒有初始溶液、總濃度、水解離、滴定液或體積衡算。',
  '平均仍結合質子數只計此模型的兩個或三個可滴定質子，以全去質子化態為零；不是分子的總氫原子數或所有 N–H／O–H 數。',
  '每 pH 的平均去質子化變化只反映此分率模型的斜率，不是完整緩衝容量 β，也不能決定蛋白聚集、溶解度、酵素活性或移動速率。',
]);

function getPreset(aminoAcidId){
  if(typeof aminoAcidId!=='string'||!Object.hasOwn(AMINO_ACID_PRESETS,aminoAcidId))throw new RangeError('Unknown amino-acid preset');
  return AMINO_ACID_PRESETS[aminoAcidId];
}
function checkedPH(pH){
  if(typeof pH!=='number'||!Number.isFinite(pH))throw new TypeError('pH must be a finite number');
  if(pH<AMINO_ACID_LIMITS.pH.min||pH>AMINO_ACID_LIMITS.pH.max)throw new RangeError('pH must be in [0,14]');
  return pH;
}

/**
 * alpha_i / alpha_(i-1) = 10^(pH-pKa_i).
 * log10(w_i) = i*pH - sum(pKa_1 ... pKa_i), w_0 = 1.
 * Subtracting max(log w) before exponentiation avoids unstable normalization.
 * Fixed, validated presets and pH domain keep all returned values finite.
 */
function distribution(selected,pH){
  // Accumulate adjacent log ratios: algebraically i*pH - sum(pKa), but
  // adding an exact zero at pH=pKa preserves adjacent ties numerically.
  const logWeights=[0];
  for(const pKa of selected.pKas)logWeights.push(logWeights.at(-1)+(pH-pKa));
  const maxLog=Math.max(...logWeights),weights=logWeights.map(log=>10**(log-maxLog));
  const total=weights.reduce((sum,value)=>sum+value,0);
  const states=weights.map((weight,index)=>({index,protonsLost:index,charge:selected.fullyProtonatedCharge-index,fraction:weight/total}));
  const meanCharge=states.reduce((sum,s)=>sum+s.charge*s.fraction,0);
  const meanProtonsLost=states.reduce((sum,s)=>sum+s.protonsLost*s.fraction,0);
  const protonsLostVariance=states.reduce((sum,s)=>sum+s.fraction*(s.protonsLost-meanProtonsLost)**2,0);
  const slope=Math.LN10*protonsLostVariance;
  const largestFraction=Math.max(...states.map(s=>s.fraction));
  // Adjacent states tie at a preset pKa. Accept only floating-point-scale
  // differences, not rounded display percentages or a chemically broad cutoff.
  const tieTolerance=16*Number.EPSILON*largestFraction;
  const dominantStateIndices=states.filter(s=>largestFraction-s.fraction<=tieTolerance).map(s=>s.index);
  return {states,meanCharge,meanProtonsLost,meanBoundProtons:selected.pKas.length-meanProtonsLost,
    protonsLostVariance,dMeanChargeDpH:-slope,dMeanProtonsLostDpH:slope,dominantStateIndices};
}

function solveIsoelectricPoint(selected){
  let low=AMINO_ACID_LIMITS.pH.min,high=AMINO_ACID_LIMITS.pH.max;
  if(distribution(selected,low).meanCharge<=0||distribution(selected,high).meanCharge>=0)throw new RangeError('Preset has no bracketed isoelectric point');
  // The negative-variance derivative ensures a unique zero for these presets.
  for(let iteration=0;iteration<80;iteration++){
    const mid=(low+high)/2;
    if(mid===low||mid===high)break;
    const charge=distribution(selected,mid).meanCharge;
    if(charge===0)return mid;
    if(charge>0)low=mid;else high=mid;
  }
  return (low+high)/2;
}
// Compute once at module initialization: graph evaluation does not solve pI
// repeatedly. These are model roots, not independently measured pI values.
export const AMINO_ACID_ISOELECTRIC_POINTS = Object.freeze(Object.fromEntries(
  Object.entries(AMINO_ACID_PRESETS).map(([id,selected])=>[id,solveIsoelectricPoint(selected)]),
));

/** Return the cached zero of the preset's complete mean-charge equation. */
export function findIsoelectricPoint(aminoAcidId=AMINO_ACID_DEFAULTS.aminoAcidId){
  getPreset(aminoAcidId);
  return AMINO_ACID_ISOELECTRIC_POINTS[aminoAcidId];
}

/**
 * Return equilibrium macroscopic fractions at a specified pH, not a time step.
 * states[i].charge is an integer; meanCharge is in elementary-charge units per
 * molecule. meanBoundProtons counts only the model's n titratable protons,
 * relative to the fully deprotonated pool, not all molecular hydrogen atoms.
 * The slopes are per pH unit, not mol/L/pH or a full buffer capacity.
 */
export function aminoAcidSpeciation(input={}){
  if(input===null||typeof input!=='object'||Array.isArray(input))throw new TypeError('Model inputs must be an object');
  const {aminoAcidId=AMINO_ACID_DEFAULTS.aminoAcidId,pH=AMINO_ACID_DEFAULTS.pH}=input;
  const selected=getPreset(aminoAcidId);checkedPH(pH);
  return {aminoAcidId,pH,...distribution(selected,pH),pI:AMINO_ACID_ISOELECTRIC_POINTS[aminoAcidId]};
}
