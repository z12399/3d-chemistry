/** Original stoichiometric teaching model; no third-party code is embedded.
 * All compounds use the same CIAAW 2024 abridged atomic-weight basis.
 * This is not an industrial caustic-dosing, phase-separation or kinetic model.
 */
export const OIL_NEUTRALIZATION_ATOMIC_WEIGHTS = Object.freeze({C:12.011,H:1.008,O:15.999,Na:22.990,K:39.098});
// Integer arithmetic preserves the chosen three-decimal atom ledger before
// conversion to g/mol; these abridged values are not exact physical constants.
const atomicMassMgPerMol = Object.freeze({C:12011,H:1008,O:15999,Na:22990,K:39098});
const molarMass = atoms => Object.entries(atoms).reduce((sum,[element,count])=>sum+atomicMassMgPerMol[element]*count,0)/1000;
export const OIL_NEUTRALIZATION_MOLAR_MASSES = Object.freeze({KOH:molarMass({K:1,O:1,H:1}),NaOH:molarMass({Na:1,O:1,H:1}),water:molarMass({H:2,O:1})});

function acid(id,label,formula,atoms,soapLabel,soapFormula){
  const soapAtoms = Object.freeze({...atoms,H:atoms.H-1,Na:1});
  const molarMassGPerMol = molarMass(atoms);
  return Object.freeze({id,label,formula,atoms:Object.freeze(atoms),molarMassGPerMol,soapLabel,soapFormula,soapAtoms,soapMolarMassGPerMol:molarMass(soapAtoms),maxAcidValueMgKOHPerG:1000*OIL_NEUTRALIZATION_MOLAR_MASSES.KOH/molarMassGPerMol});
}
export const OIL_NEUTRALIZATION_ACIDS = Object.freeze({
  oleic:acid('oleic','油酸','C18H34O2',{C:18,H:34,O:2},'油酸鈉','C18H33NaO2'),
  palmitic:acid('palmitic','棕櫚酸','C16H32O2',{C:16,H:32,O:2},'棕櫚酸鈉','C16H31NaO2'),
  linoleic:acid('linoleic','亞油酸','C18H32O2',{C:18,H:32,O:2},'亞油酸鈉','C18H31NaO2'),
});
export const OIL_NEUTRALIZATION_DEFAULTS = Object.freeze({acidId:'oleic',acidValue:4,feedMassKg:100,extent:0.5});
// Suggested UI domain; the core also accepts other physically valid finite scales.
export const OIL_NEUTRALIZATION_LIMITS = Object.freeze({
  acidValue:Object.freeze({min:0,max:20,step:0.1}),
  feedMassKg:Object.freeze({min:50,max:500,step:10}),
  extent:Object.freeze({min:0,max:1,step:0.01}),
});
export const OIL_NEUTRALIZATION_SOURCES = Object.freeze([
  {id:'jecfa-acid-value',title:'FAO/JECFA · Acid value 定義',url:'https://www.fao.org/4/a0691e/A0691E07.htm',scope:'Fats, oils and hydrocarbons — Acid Value；只使用 mg KOH/g 油脂的定義。'},
  {id:'iso660-scope',title:'ISO 660:2020 · 酸價方法的非專一性',url:'https://www.iso.org/standard/75594.html',scope:'公開摘要：酸價不能自行辨別游離脂肪酸、其他有機酸與無機酸。'},
  {id:'ciaaw-2024',title:'CIAAW · 2024 略式標準原子量',url:'https://ciaaw.org/abridged-atomic-weights.htm',scope:'H、C、O、Na、K 的同表略式值，用於全部摩爾質量。'},
  {id:'nist-oleic',title:'NIST Chemistry WebBook · 油酸',url:'https://webbook.nist.gov/cgi/cbook.cgi?ID=C112801&Units=SI',scope:'CAS 112-80-1 與分子式 C18H34O2；計算摩爾質量另由 CIAAW 同表加總。'},
  {id:'nist-palmitic',title:'NIST Chemistry WebBook · 棕櫚酸',url:'https://webbook.nist.gov/cgi/cbook.cgi?ID=C57103&Units=SI',scope:'CAS 57-10-3 與分子式 C16H32O2；計算摩爾質量另由 CIAAW 同表加總。'},
  {id:'nist-linoleic',title:'NIST Chemistry WebBook · 亞油酸',url:'https://webbook.nist.gov/cgi/cbook.cgi?ID=C60333&Units=SI',scope:'CAS 60-33-3 與分子式 C18H32O2；計算摩爾質量另由 CIAAW 同表加總。'},
  {id:'fao-refining',title:'FAO · 油脂中和與精製的界線',url:'https://www.fao.org/4/V4700E/V4700E0a.htm',scope:'Oil Refining：NaOH 中和游離脂肪酸形成皂；實際精製另有乳化與中性油皂化損失。'},
].map(Object.freeze));
export const OIL_NEUTRALIZATION_ASSUMPTIONS = Object.freeze([
  '所有可滴定酸都假設為所選的單羧游離脂肪酸，其餘原料全為不反應的中性油；酸價本身不能證明此組成。',
  '反應為 RCOOH + NaOH → RCOONa + H2O，各物種係數均為 1；雙鍵數不因這個酸鹼中和而改變。',
  'extent 是指定已反應比例，不是時間、加藥量、速率、平衡轉化率或工業精製效率。',
  '投入衡算只加入已反應所需的理論純 NaOH；不包含過量鹼、NaOH 溶液帶入水、洗滌水或原有水分。',
  '所有產物仍在同一總物料衡算中；不模擬皂水分離、乳化夾帶、中性油皂化、分析測法校正或實際工廠操作。',
  '剩餘酸當量固定除以原料質量，不是分離後油相或整體反應混合物的實測酸價。',
]);

function finite(value,name){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(`${name} must be a finite number`);}
function representablePositive(value,required,name){
  if(!Number.isFinite(value)||(required&&value<=0))throw new RangeError(`${name} is outside the representable numeric range`);
}

/**
 * Acid value: mg KOH per g feed. Since 1 mg/g = 1 g/kg,
 * n(acid) [mol] = AV [mg/g] * feed [kg] / M(KOH) [g/mol].
 * Every acid is monocarboxylic. This equality is conditional on the assumptions.
 * The positive feed may be outside the suggested UI range. AV may extend to the
 * selected pure-acid limit; higher values would imply more FFA than total feed.
 * Throws for invalid/overflow/underflow inputs rather than silently clamping.
 */
export function acidNeutralization(input={}){
  if(input===null||typeof input!=='object'||Array.isArray(input))throw new TypeError('Model inputs must be an object');
  const {acidId=OIL_NEUTRALIZATION_DEFAULTS.acidId,acidValue=OIL_NEUTRALIZATION_DEFAULTS.acidValue,feedMassKg=OIL_NEUTRALIZATION_DEFAULTS.feedMassKg,extent=OIL_NEUTRALIZATION_DEFAULTS.extent}=input;
  if(typeof acidId!=='string'||!Object.hasOwn(OIL_NEUTRALIZATION_ACIDS,acidId))throw new RangeError('Unknown monocarboxylic acid');
  finite(acidValue,'acidValue');finite(feedMassKg,'feedMassKg');finite(extent,'extent');
  const selected = OIL_NEUTRALIZATION_ACIDS[acidId];
  if(acidValue<0||acidValue>selected.maxAcidValueMgKOHPerG)throw new RangeError('Acid value would imply an FFA mass outside [0, feed mass]');
  if(feedMassKg<=0)throw new RangeError('feedMassKg must be positive');
  if(extent<0||extent>1)throw new RangeError('extent must be in [0,1]');
  const initialFFAMassFraction = acidValue/selected.maxAcidValueMgKOHPerG;
  // The pure-acid endpoint is represented exactly by fraction = 1, without a clamp.
  const initialAcidKg = feedMassKg*initialFFAMassFraction;
  const initialAcidMol = initialAcidKg/(selected.molarMassGPerMol/1000);
  const reactedAcidMol = initialAcidMol*extent,remainingAcidMol = initialAcidMol*(1-extent);
  const reactedAcidKg = initialAcidKg*extent,remainingAcidKg = initialAcidKg*(1-extent);
  const fullNeutralizationNaOHKg = initialAcidMol*(OIL_NEUTRALIZATION_MOLAR_MASSES.NaOH/1000);
  const consumedNaOHKg = reactedAcidMol*(OIL_NEUTRALIZATION_MOLAR_MASSES.NaOH/1000);
  const formedWaterKg = reactedAcidMol*(OIL_NEUTRALIZATION_MOLAR_MASSES.water/1000);
  const formedSoapKg = reactedAcidMol*(selected.soapMolarMassGPerMol/1000);
  const neutralOilKg = feedMassKg-initialAcidKg;
  const totalInputKg = feedMassKg+consumedNaOHKg;
  const totalOutputKg = neutralOilKg+remainingAcidKg+formedSoapKg+formedWaterKg;
  const initialFFAMassPercent = 100*initialFFAMassFraction;
  const residualAcidValueOnOriginalFeedMgKOHPerG = acidValue*(1-extent);
  const hasAcid = acidValue>0,hasReaction = hasAcid&&extent>0,hasRemaining = hasAcid&&extent<1;
  for(const [name,value,required] of [
    ['initial FFA fraction',initialFFAMassFraction,hasAcid],['initial FFA percent',initialFFAMassPercent,hasAcid],
    ['initial acid mass',initialAcidKg,hasAcid],['initial acid amount',initialAcidMol,hasAcid],
    ['reacted acid amount',reactedAcidMol,hasReaction],['remaining acid amount',remainingAcidMol,hasRemaining],
    ['reacted acid mass',reactedAcidKg,hasReaction],['remaining acid mass',remainingAcidKg,hasRemaining],
    ['full neutralization NaOH',fullNeutralizationNaOHKg,hasAcid],['consumed NaOH',consumedNaOHKg,hasReaction],
    ['formed water',formedWaterKg,hasReaction],['formed soap',formedSoapKg,hasReaction],
    ['neutral oil',neutralOilKg,initialFFAMassFraction<1],['total input',totalInputKg,true],['total output',totalOutputKg,true],
    ['residual acid equivalent',residualAcidValueOnOriginalFeedMgKOHPerG,hasRemaining],
  ])representablePositive(value,required,name);
  return {
    acidId,acidValueMgKOHPerG:acidValue,feedMassKg,extent,
    acidMolarMassGPerMol:selected.molarMassGPerMol,soapMolarMassGPerMol:selected.soapMolarMassGPerMol,
    initialFFAMassFraction,initialFFAMassPercent,initialAcidMol,initialAcidKg,
    reactedAcidMol,reactedAcidKg,remainingAcidMol,remainingAcidKg,
    fullNeutralizationNaOHKg,consumedNaOHKg,formedWaterKg,formedSoapKg,neutralOilKg,
    totalInputKg,totalOutputKg,massResidualKg:totalOutputKg-totalInputKg,
    residualAcidValueOnOriginalFeedMgKOHPerG,
  };
}
