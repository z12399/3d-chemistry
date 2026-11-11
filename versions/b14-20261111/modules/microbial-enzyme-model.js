/** Published treatment groups and endpoints, not an enzyme or growth simulator. */
import {MICRO_ENZYME_ROWS} from '../data/microbial-enzyme-evidence.js';

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const MICRO_ENZYME_LAB_ID = 'micro-enzyme-evidence';
export const MICRO_ENZYME_GROUPS = deepFreeze([0,50,75,100]);
export const MICRO_ENZYME_SUGAR_DEFAULT_INPUT = deepFreeze({sugar:'lactose',group:0});
export const MICRO_ENZYME_CELL_DEFAULT_INPUT = deepFreeze({organism:'L_bulgaricus_2038',a:0,b:100});
export const MICRO_ENZYME_SUGARS = deepFreeze([
  {id:'lactose',label:'乳糖',unit:'%（原表）',beforeKey:'lactoseBefore',afterKey:'lactoseAfter'},
  {id:'glucose',label:'葡萄糖',unit:'%（原表）',beforeKey:'glucoseBefore',afterKey:'glucoseAfter'},
]);
export const MICRO_ENZYME_ORGANISMS = deepFreeze([
  {id:'L_bulgaricus_2038',label:'Lactobacillus delbrueckii subsp. bulgaricus 2038',shortLabel:'L. bulgaricus 2038',unit:'×10⁸ CFU/g'},
  {id:'S_thermophilus_1131',label:'Streptococcus thermophilus 1131',shortLabel:'S. thermophilus 1131',unit:'×10⁸ CFU/g'},
]);

const treatmentBoundary = '0／50／75／100% 是接種前由兩種處理液混配的名義預水解組別，不是酵素添加百分比、發酵後水解程度或每小時反應速率。100% 組不表示分析測得乳糖為零。';
const studyBoundary = '僅限此重組脫脂乳、指定菌株與低溶氧製程；不內插、外推最佳配方，亦不代表通用菌種效應、營養優越、無乳糖法規達標或安全確效。';
const sugarBoundary = 'Table 1 的前／後指發酵前／後；主文水解公式中的前／後另指水解處理前／後，不能混用。原表糖濃度單位為 %；方法明示乳糖採 w/w，葡萄糖未另明示百分濃度基準。方法將糖分析列在製作後冷藏約 24 小時的評估；濃度差不是糖通量、酵素轉化率或完整物料平衡，未提供半乳糖實測量。';
const cellBoundary = '菌數是成品樣品的 CFU/g，採樣時間未另行明說，不指定為立即終點或 24 小時。原刊 ± 未定義 SD／SE；三重測定不等於三個獨立發酵批，不自製誤差棒、信賴區間或新檢定。平均菌數差不是生長速率、倍增時間、單調劑量反應或等效證明。';

function completeInput(input,keys) {
  if (!input || typeof input!=='object' || Array.isArray(input) || ![Object.prototype,null].includes(Object.getPrototypeOf(input)))
    throw new TypeError('請提供完整的參數物件。');
  for (const key of Reflect.ownKeys(input)) {
    if (!keys.includes(key)) throw new TypeError('含有未知參數欄位。');
    if (!Object.hasOwn(Object.getOwnPropertyDescriptor(input,key),'value')) throw new TypeError('參數必須是直接值。');
  }
  for (const key of keys) if (!Object.hasOwn(input,key)) throw new TypeError('缺少必要參數：'+key);
  return Object.fromEntries(keys.map(key=>[key,input[key]]));
}

function requireGroup(value) {
  if (typeof value!=='number' || !Number.isFinite(value)) throw new TypeError('處理組必須為有限數字，不能用文字或空白代替。');
  if (!MICRO_ENZYME_GROUPS.includes(value)) throw new RangeError('只可選擇原研究的 0、50、75 或 100% 處理組。');
}

// Use original decimal strings to retain reported precision and avoid binary
// subtraction artifacts. BigInt remains internal; outputs are JSON serializable.
function reportedDifference(before,after) {
  const parts=[before,after].map(value=>value.split('.'));
  const places=Math.max(...parts.map(part=>(part[1]||'').length));
  const scaled=parts.map(([integer,fraction=''])=>BigInt(integer+fraction.padEnd(places,'0')));
  const difference=scaled[1]-scaled[0],negative=difference<0n;
  const magnitude=(negative?-difference:difference).toString().padStart(places+1,'0');
  const decimal=places?magnitude.slice(0,-places)+'.'+magnitude.slice(-places):magnitude;
  const text=(negative?'-':difference>0n?'+':'')+decimal;
  return {delta:Number(text),deltaText:text};
}

function endpoint(source,stage) {
  return {...source,displayValue:source.raw,censored:source.operator!=='=',stage,
    stageLabel:stage==='before-fermentation'?'發酵前':'發酵後'};
}

/** Four observed treatment groups; exact arithmetic only for two exact values. */
export function getSugarComparison(input=MICRO_ENZYME_SUGAR_DEFAULT_INPUT) {
  const checked=completeInput(input,['sugar','group']);
  const sugar=MICRO_ENZYME_SUGARS.find(entry=>entry.id===checked.sugar);
  if (!sugar) throw new RangeError('只採用原表的乳糖與葡萄糖。');
  requireGroup(checked.group);
  const points=MICRO_ENZYME_ROWS.map(row=>({id:row.id,group:row.nominalHydrolysisPercent,
    label:`${row.nominalHydrolysisPercent}% 預水解組`,
    before:endpoint(row.sugars[sugar.beforeKey],'before-fermentation'),
    after:endpoint(row.sugars[sugar.afterKey],'after-fermentation'),row}));
  const selected=points.find(point=>point.group===checked.group);
  const exact=!selected.before.censored&&!selected.after.censored;
  const arithmetic=exact?reportedDifference(selected.before.raw,selected.after.raw):{delta:null,deltaText:'無法計算精確差值'};
  const difference={available:exact,...arithmetic,unit:'百分點',
    reason:exact?'發酵後減發酵前的原表百分濃度差；不是相對百分比變化，也不是乳糖水解程度。'
      :'至少一值只報為低於門檻，未知其實際濃度。即使前後同報 <0.03，也不能將差值設為零或宣稱沒有變化。'};
  return deepFreeze({input:checked,sugar,unit:sugar.unit,points,selected,difference,
    boundary:treatmentBoundary+' '+sugarBoundary+' '+studyBoundary});
}

function cellPoint(row,organism) {
  const source=row.cells[organism.id];
  const [meanText,plusMinusText]=source.raw.split(' ± ');
  return {id:row.id,group:row.nominalHydrolysisPercent,label:`${row.nominalHydrolysisPercent}% 預水解組`,
    value:source.meanReported,displayValue:meanText,sourceText:source.raw,plusMinusText,
    plusMinusType:row.cellPlusMinusType,letter:source.letter,row};
}

function authorComparison(organism,left,right) {
  if (left.id===right.id) return {code:'same-record',text:'A、B 是同一組的同一刊載平均值，算術差為零；沒有新增的組間比較。'};
  if (organism.id==='S_thermophilus_1131') return {code:'author-reported-no-change',
    text:'S. thermophilus 原表未列分組字母，正文稱未觀察到菌數變化；刊載均值差不能改寫成已證實抑制、顯著下降或等效。'};
  if (left.letter===right.letter) return {code:'published-shared-letter',
    text:'這兩組在原表 L. bulgaricus 欄共用 b 字母；原作者未將它們區分為顯著不同組，這不證明等效。平均值也不是隨預水解組別單調增加。'};
  return {code:'published-different-letters',
    text:'原表 L. bulgaricus 的 100% 組標 a，其餘三組標 b；依原作者分組，100% 組較高（不同字母，P<0.05）。此處只轉述原刊結果，不由本次差值重算檢定。'};
}

/** B minus A of published mean CFU; author grouping is kept separate. */
export function getCellComparison(input=MICRO_ENZYME_CELL_DEFAULT_INPUT) {
  const checked=completeInput(input,['organism','a','b']);
  const organism=MICRO_ENZYME_ORGANISMS.find(entry=>entry.id===checked.organism);
  if (!organism) throw new RangeError('只採用此研究的兩種指定 starter 菌株。');
  requireGroup(checked.a);requireGroup(checked.b);
  const points=MICRO_ENZYME_ROWS.map(row=>cellPoint(row,organism));
  const left=points.find(point=>point.group===checked.a),right=points.find(point=>point.group===checked.b);
  const arithmetic=reportedDifference(left.displayValue,right.displayValue);
  return deepFreeze({input:checked,organism,unit:organism.unit,points,left,right,...arithmetic,
    sameGroup:checked.a===checked.b,authorComparison:authorComparison(organism,left,right),observationTime:null,
    boundary:treatmentBoundary+' '+cellBoundary+' '+studyBoundary});
}
