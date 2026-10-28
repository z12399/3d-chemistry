/** Three separate teaching representations: formal oxidation bookkeeping,
 * hypothetical matched assays, and published fresh-weight concentrations.
 * The equations do not describe the predominant hydrated DHA structure in water,
 * a kinetic trajectory, a bag's total nutrient retention, or food safety.
 */
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export const VITAMIN_C_LAB_ID = 'vitamin-c-evidence';
export const VITAMIN_C_SOURCES = deepFreeze([
  {id:'vitamin-c-source-zhan2022',title:'Zhan 等（2022）· Foods 11, 3515，Table 3 與 §2.5',url:'https://www.mdpi.com/2304-8158/11/21/3515'},
  {id:'vitamin-c-source-dewhirst2018',title:'Dewhirst & Fry（2018）· DHA 的水合形態與後續反應分支',url:'https://www.pure.ed.ac.uk/ws/portalfiles/portal/77109745/3451.full.pdf'},
  {id:'vitamin-c-source-mazurek2021',title:'Mazurek & Włodarczyk-Stasiak（2021）· 還原前後差減的維生素 C 分析',url:'https://www.mdpi.com/1420-3049/26/20/6263'},
]);
export const BALANCE_FORMS = deepFreeze([
  {id:'neutral',label:'形式中性 AA',leftFormula:'C6H8O6',rightFormula:'C6H6O6',leftCharge:0,
    expectedH:2,expectedProtons:2,expectedElectrons:2,formula:'C₆H₈O₆ → C₆H₆O₆ + 2 H⁺ + 2 e⁻'},
  {id:'monoanion',label:'AA 單陰離子',leftFormula:'C6H7O6−',rightFormula:'C6H6O6',leftCharge:-1,
    expectedH:1,expectedProtons:1,expectedElectrons:2,formula:'C₆H₇O₆⁻ → C₆H₆O₆ + H⁺ + 2 e⁻'},
]);
export const VITAMIN_C_ASSAY_DEFAULTS = deepFreeze({mode:'direct',direct:30,total:42});
export const VITAMIN_C_LIMITS = deepFreeze({coefficient:{min:0,max:4,integer:true},assay:{min:0,max:1000}});
export const VITAMIN_C_FOOD_DEFAULTS = deepFreeze({id:'lb50-f125',comparisonId:'lb100-f250'});
export const VITAMIN_C_ASSAY_BASIS = '同一假想樣品、相同分析基準的 mg L-AA 當量/100 g；兩份讀值均已校正稀釋與空白，還原法假定定量回收。';
export const VITAMIN_C_FOOD_BASIS = '原研究以新配 L-AA 標準曲線校正，單位 mg/g 鮮重；和是刊載均值另算，不是原表獨立 total 欄。';

// Table 3, Mix × Filling amount rows. Three blocks; these cells have no
// individual SD/SE or letters. Whole-column SE is not an error bar per record.
// Numeric strings retain source precision. The matching JSON preserves methods,
// publication metadata, the column-level SE, and source access limitations.
const measuredRows = [
  ['lb100-f250','100 LB × F250',100,250,'0.227','0.111','0.035','0.072'],
  ['lb100-f125','100 LB × F125',100,125,'0.211','0.120','0.025','0.065'],
  ['lb75-f250','75 LB × F250',75,250,'0.324','0.146','0.035','0.062'],
  ['lb75-f125','75 LB × F125',75,125,'0.290','0.183','0.035','0.066'],
  ['lb50-f250','50 LB × F250',50,250,'0.337','0.254','0.037','0.079'],
  ['lb50-f125','50 LB × F125',50,125,'0.323','0.288','0.043','0.087'],
];
export const FOOD_RECORDS = deepFreeze(measuredRows.map(([id,label,lettucePercent,fillGrams,a1,a9,d1,d9]) => ({
  id,label,lettucePercent,rocketPercent:100-lettucePercent,fillGrams,
  day1:{aa:Number(a1),dhaa:Number(d1),aaText:a1,dhaaText:d1},
  day9:{aa:Number(a9),dhaa:Number(d9),aaText:a9,dhaaText:d9},
  unit:'mg/g FW',basis:VITAMIN_C_FOOD_BASIS,sourceId:'vitamin-c-source-zhan2022',
  sourceUrl:'https://www.mdpi.com/2304-8158/11/21/3515',
})));

function objectWithKeys(input, keys, required = keys) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('請提供完整的參數物件。');
  for (const key of Object.keys(input)) if (!keys.includes(key)) throw new TypeError('未知欄位：' + key);
  for (const key of required) if (!Object.hasOwn(input,key)) throw new TypeError('缺少欄位：' + key);
}
function finiteRange(value, name, maximum, integer=false) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(name + '須是有限數值；空白不等於零。');
  if (value < 0 || value > maximum || (integer && !Number.isInteger(value)))
    throw new RangeError(name + '須為 0–' + maximum + (integer ? ' 的整數。' : ' 之間的數值。'));
}

/** Coefficients are answers; a balanced equation is not a reaction prediction. */
export function evaluateBalance(formId, input) {
  const form = BALANCE_FORMS.find(entry => entry.id === formId);
  if (!form) throw new RangeError('未知的 AA 形式。');
  objectWithKeys(input,['protons','electrons']);
  finiteRange(input.protons,'H⁺ 係數',4,true);
  finiteRange(input.electrons,'電子係數',4,true);
  const left = {C:6,H:form.id === 'neutral' ? 8 : 7,O:6,charge:form.leftCharge};
  const right = {C:6,H:6+input.protons,O:6,charge:input.protons-input.electrons};
  const atomBalance = ['C','H','O'].every(element => left[element] === right[element]);
  const chargeBalance = left.charge === right.charge;
  const leftText = form.id === 'neutral' ? 'C₆H₈O₆' : 'C₆H₇O₆⁻';
  return {formId,protons:input.protons,electrons:input.electrons,left,right,atomBalance,chargeBalance,
    correct:atomBalance && chargeBalance,
    formula:`${leftText} → C₆H₆O₆ + ${input.protons} H⁺ + ${input.electrons} e⁻`,
    boundary:'形式未水合 DHA 的氧化半反應；需要另有電子受體。不代表食品中的唯一物種、完整機構或自發逆轉。'};
}

/** Formal DHA to neutral DKG net bookkeeping; not hydration or a mechanism. */
export function evaluateHydrolysis(input) {
  objectWithKeys(input,['water','protons','electrons']);
  finiteRange(input.water,'H₂O 係數',4,true);
  finiteRange(input.protons,'H⁺ 係數',4,true);
  finiteRange(input.electrons,'電子係數',4,true);
  const left = {C:6,H:6+2*input.water,O:6+input.water,charge:0};
  const right = {C:6,H:8+input.protons,O:7,charge:input.protons-input.electrons};
  const atomBalance = ['C','H','O'].every(element => left[element] === right[element]);
  const chargeBalance = left.charge === right.charge;
  return {water:input.water,protons:input.protons,electrons:input.electrons,left,right,
    atomBalance,chargeBalance,correct:atomBalance && chargeBalance,
    formula:`C₆H₆O₆ + ${input.water} H₂O → C₆H₈O₇ + ${input.protons} H⁺ + ${input.electrons} e⁻`,
    boundary:'形式未水合 DHA（C₆H₆O₆）至中性 DKG（C₆H₈O₇）的形式配平淨帳；若已是水合雙環 DHA，不再加一次水。不是水溶液中的水合平衡、逐步反應機構或速率描述。'};
}

/** Hypothetical direct AA assay and a paired, quantitative-reduction total assay.
 * In direct mode the unselected total/DHA result is deliberately not exposed.
 * Negative differences remain diagnostic numbers, never reported as negative DHA.
 */
export function evaluateAssay(input) {
  objectWithKeys(input,['mode','direct','total'],['mode','direct']);
  if (!['direct','reduced'].includes(input.mode)) throw new RangeError('請選直接法或還原後總量法。');
  finiteRange(input.direct,'直接法讀值',1000);
  const reduced = input.mode === 'reduced';
  if (reduced) {
    objectWithKeys(input,['mode','direct','total']);
    finiteRange(input.total,'還原後讀值',1000);
  }
  const difference = reduced ? input.total-input.direct : null;
  const reportable = !reduced || difference >= 0;
  return {mode:input.mode,measurementValue:reduced ? input.total : input.direct,
    measurementIdentity:reduced ? '還原後總量法的假想讀值' : '直接法的假想 AA 讀值',
    aa:input.direct,total:reduced && reportable ? input.total : null,
    dhaa:reduced && reportable ? difference : null,difference,reportable,
    issues:reportable ? [] : ['reduced-below-direct'],
    unit:'mg L-AA equivalents/100 g',basis:VITAMIN_C_ASSAY_BASIS,
    boundary:reduced
      ? '只有相同樣品與報告基準、定量還原及回收等假設成立時，總量減 AA 才作 DHAA 當量差。負差是紀錄／方法問題，不能報為負的 DHAA。'
      : '直接法只提供 AA，不能由這一讀值判定 DHAA 或總維生素 C。'};
}

/** Published means only; no time-significance test, uncertainty or fitted rate. */
export function compareFood(id) {
  const record = FOOD_RECORDS.find(entry => entry.id === id);
  if (!record) throw new RangeError('未知的食品資料組合。');
  const day1 = {aa:record.day1.aa,dhaa:record.day1.dhaa,total:record.day1.aa+record.day1.dhaa};
  const day9 = {aa:record.day9.aa,dhaa:record.day9.dhaa,total:record.day9.aa+record.day9.dhaa};
  const change = {}, percentChange = {};
  for (const metric of ['aa','dhaa','total']) {
    change[metric] = day9[metric]-day1[metric];
    percentChange[metric] = day1[metric] === 0 ? null : change[metric]/day1[metric]*100;
  }
  return {id,label:record.label,day1,day9,change,percentChange,
    unit:record.unit,basis:record.basis,totalDerived:true,uncertainty:null,significance:'not-inferred',kinetics:null,
    boundary:'第 1 與第 9 日的鮮重濃度均值；AA + DHAA 為兩均值另算。無逐點誤差或時間顯著性，不等於每袋總量留存，不推測未測產物或中間反應曲線。'};
}
