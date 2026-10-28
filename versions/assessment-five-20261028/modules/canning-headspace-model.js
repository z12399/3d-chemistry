/** Original ideal-mixture equilibrium states in a rigid, sealed headspace.
 * This does not simulate an exhausting method, process time or container strength.
 */
import {HEADSPACE_PHYSICAL_CONTRACT} from '../data/canning-headspace-physical-contract.js';
export {HEADSPACE_SOURCES,HEADSPACE_METHODS} from '../data/canning-headspace-evidence.js';

export const CANNING_HEADSPACE_LAB_ID='proc-canning-headspace';
export const CANNING_HEADSPACE_VERSION='2026-10-13.v1';
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const HEADSPACE_TEACHING_RANGE=freeze({minTemperatureC:20,maxTemperatureC:95,minSealPressureKPaAbs:20,maxSealPressureKPaAbs:160,minOutsidePressureKPaAbs:60,maxOutsidePressureKPaAbs:250});
export const HEADSPACE_DEFAULT_INPUT=freeze({sealTemperatureC:80,sealPressureKPaAbs:101.325,viewTemperatureC:25,outsidePressureKPaAbs:101.325});
export const HEADSPACE_ASSUMPTIONS=freeze([
  '剛性密封容器；頭空體積固定。',
  '密封後非凝結氣體量不變；沒有漏氣、溶解、釋放或化學反應。',
  '各觀察狀態均溫且達氣液平衡；溫度軸不是製程時間。',
  '全程有足量純液態水；水蒸氣分壓等於該溫度的飽和蒸氣壓。',
  '採理想氣體混合近似；省略非理想性與液相壓力修正。',
  '省略食品膨脹收縮與罐體變形；外壓只改變內外壓差。',
]);
const inputKeys=Object.keys(HEADSPACE_DEFAULT_INPUT);
function plain(value,name){
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new TypeError(name+' must be a plain object');
}
function finite(value,name){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(name+' must be a finite number');return value;}
function range(value,min,max,name){finite(value,name);if(value<min||value>max)throw new RangeError(name+' outside ['+min+', '+max+']');return value;}
function permittedKeys(value,keys,name){for(const key of Reflect.ownKeys(value))if(!keys.includes(key))throw new TypeError('Unknown '+name+': '+String(key));}

/** IAPWS SR1-86(1992), p.3 Eq.(1); source validity is 273.16–647.096 K.
 * This wider helper domain is for formula verification, not the teaching controls.
 */
export function waterSaturationPressureKPa(temperatureC){
  finite(temperatureC,'temperatureC');
  const s=HEADSPACE_PHYSICAL_CONTRACT.saturation;
  let T=temperatureC+273.15;
  // Decimal Celsius/Kelvin conversion can miss the triple point by one ULP.
  for(const boundary of s.temperatureSourceRangeK)if(Math.abs(T-boundary)<=Number.EPSILON*boundary*2)T=boundary;
  range(T,s.temperatureSourceRangeK[0],s.temperatureSourceRangeK[1],'water temperature K');
  const tau=1-T/s.criticalTemperatureK;
  const polynomial=s.coefficients.reduce((sum,coefficient,i)=>sum+coefficient*tau**s.powers[i],0);
  return s.criticalPressureKPa*Math.exp(s.criticalTemperatureK/T*polynomial);
}

function normalizeInput(input){
  plain(input,'Headspace input');permittedKeys(input,inputKeys,'headspace input');
  const p={...HEADSPACE_DEFAULT_INPUT,...input},r=HEADSPACE_TEACHING_RANGE;
  range(p.sealTemperatureC,r.minTemperatureC,r.maxTemperatureC,'sealTemperatureC');
  range(p.viewTemperatureC,r.minTemperatureC,r.maxTemperatureC,'viewTemperatureC');
  range(p.sealPressureKPaAbs,r.minSealPressureKPaAbs,r.maxSealPressureKPaAbs,'sealPressureKPaAbs');
  range(p.outsidePressureKPaAbs,r.minOutsidePressureKPaAbs,r.maxOutsidePressureKPaAbs,'outsidePressureKPaAbs');
  const vapor=waterSaturationPressureKPa(p.sealTemperatureC);
  if(p.sealPressureKPaAbs<vapor)throw new RangeError('sealPressureKPaAbs is below saturated water vapor pressure at sealing temperature');
  return p;
}

export function evaluateHeadspaceState(input={}){
  const p=normalizeInput(input),sealWaterVaporKPa=waterSaturationPressureKPa(p.sealTemperatureC);
  const sealNoncondensableKPa=p.sealPressureKPaAbs-sealWaterVaporKPa;
  const noncondensableKPa=sealNoncondensableKPa*(p.viewTemperatureC+273.15)/(p.sealTemperatureC+273.15);
  const waterVaporKPa=waterSaturationPressureKPa(p.viewTemperatureC);
  const insidePressureKPaAbs=noncondensableKPa+waterVaporKPa;
  const insideMinusOutsideKPa=insidePressureKPaAbs-p.outsidePressureKPaAbs;
  return freeze({...p,input:{...p},identity:'original-hypothetical-equilibrium-state',
    sealWaterVaporKPa,sealNoncondensableKPa,waterVaporKPa,noncondensableKPa,insidePressureKPaAbs,
    insideMinusOutsideKPa,vacuumKPaSigned:-insideMinusOutsideKPa,
    temperatureRelation:p.viewTemperatureC<p.sealTemperatureC?'cooling':p.viewTemperatureC>p.sealTemperatureC?'heating':'same',
    assumptions:HEADSPACE_ASSUMPTIONS,
    commercialSterility:null,closureIntegrity:null,containerSafety:null,oxygenConcentration:null,exhaustingEfficiency:null,
  });
}

/** Return `steps` equilibrium states, including both temperature endpoints. */
export function traceHeadspaceTemperature(input={},options={}){
  const p=normalizeInput(input);plain(options,'Trace options');
  permittedKeys(options,['minTemperatureC','maxTemperatureC','steps'],'trace option');
  const o={minTemperatureC:20,maxTemperatureC:95,steps:76,...options},r=HEADSPACE_TEACHING_RANGE;
  range(o.minTemperatureC,r.minTemperatureC,r.maxTemperatureC,'minTemperatureC');
  range(o.maxTemperatureC,r.minTemperatureC,r.maxTemperatureC,'maxTemperatureC');
  range(o.steps,2,301,'steps');
  if(!Number.isInteger(o.steps))throw new TypeError('steps must be an integer point count');
  if(o.minTemperatureC>=o.maxTemperatureC)throw new RangeError('Trace minimum must be below maximum');
  return freeze(Array.from({length:o.steps},(_,i)=>evaluateHeadspaceState({...p,viewTemperatureC:i===o.steps-1?o.maxTemperatureC:o.minTemperatureC+(o.maxTemperatureC-o.minTemperatureC)*i/(o.steps-1)})));
}

const matchedPressure=waterSaturationPressureKPa(95)+(HEADSPACE_DEFAULT_INPUT.sealPressureKPaAbs-waterSaturationPressureKPa(80))*(95+273.15)/(80+273.15);
export const HEADSPACE_EXAMPLES=freeze([
  {id:'standard-seal',label:'例 A · 80 °C 密封',input:{...HEADSPACE_DEFAULT_INPUT},note:'原創指定初始狀態；不是排氣方法的效果測值或製程建議。',identity:'original-teaching-example'},
  {id:'matched-cold-seal',label:'例 B · 同冷端內壓',input:{...HEADSPACE_DEFAULT_INPUT,sealTemperatureC:95,sealPressureKPaAbs:matchedPressure},note:'刻意選擇另一組密封溫度與總壓，使 25 °C 的內壓等於例 A；單一真空讀值不能唯一反推密封狀態。',identity:'original-teaching-example'},
  {id:'higher-outside',label:'例 C · 只提高外壓',input:{...HEADSPACE_DEFAULT_INPUT,outsidePressureKPaAbs:160},note:'和例 A 相同的密封狀態與觀察溫度；剛性模型中內壓相同，內外壓差改變。',identity:'original-teaching-example'},
  {id:'lower-outside',label:'例 D · 只降低外壓',input:{...HEADSPACE_DEFAULT_INPUT,outsidePressureKPaAbs:60},note:'和例 A 相同的密封狀態與觀察溫度；外壓不能直接代替封閉頭空的內壓。',identity:'original-teaching-example'},
  {id:'pure-vapor-seal',label:'例 E · 無非凝結氣體極限',input:{...HEADSPACE_DEFAULT_INPUT,sealPressureKPaAbs:waterSaturationPressureKPa(80)},note:'密封總壓恰等於該溫度的飽和水蒸氣壓，是本理想模型中非凝結氣體量為零的極限例；不宣稱實際排氣可達。',identity:'original-teaching-example'},
]);
export function headspaceExample(exampleId){const value=HEADSPACE_EXAMPLES.find(e=>e.id===exampleId);if(!value)throw new RangeError('Unknown headspace example');return value;}
export function compareHeadspaceExamplePair(pairId){
  const pairs={'same-cold-pressure':['standard-seal','matched-cold-seal'],'same-inside-different-outside':['standard-seal','higher-outside']};
  if(typeof pairId!=='string'||!Object.hasOwn(pairs,pairId))throw new RangeError('Unknown headspace comparison');
  const [a,b]=pairs[pairId].map(headspaceExample);
  return freeze({pairId,before:evaluateHeadspaceState(a.input),after:evaluateHeadspaceState(b.input),beforeExampleId:a.id,afterExampleId:b.id,
    changedInputs:inputKeys.filter(key=>a.input[key]!==b.input[key]),identity:'original-teaching-counterexample',
    meaning:pairId==='same-cold-pressure'?'相同觀察溫度的內壓與真空可相同，但密封溫度與密封總壓不同。':'封閉剛性模型中，單改外壓只改內外壓差；內部各分壓保持相同。'});
}
