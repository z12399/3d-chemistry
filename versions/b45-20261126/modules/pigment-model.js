/** Independent hypothetical colour and pH-differential exercises.
 * No conversion between CIELAB colour and chemical concentration is modelled.
 * Method gates are teaching checks, not laboratory validation or pigment identification.
 */
export const PIGMENT_LAB_ID='pigment-measurement';
export const PIGMENT_SOURCES=Object.freeze([
  {id:'pigment-cie-lab',title:'CIE · CIELAB colour space',url:'https://cie.co.at/eilvterm/17-23-076'},
  {id:'pigment-cie-delta',title:'CIE · CIELAB colour difference',url:'https://cie.co.at/eilvterm/17-23-077'},
  {id:'pigment-aoac-ph-differential',title:'Lee, Durst & Wrolstad (2005) · AOAC 2005.02',url:'https://www.ars.usda.gov/ARSUserFiles/37108/pdf/leejaoac.pdf'},
].map(Object.freeze));
export const PIGMENT_COLOR_DEFAULTS=Object.freeze({L:43,a:34,b:10,basis:'matched'});
export const PIGMENT_COLOR_LIMITS=Object.freeze(Object.fromEntries(Object.entries({L:[0,100],a:[-80,80],b:[-80,80]}).map(([k,[min,max]])=>[k,Object.freeze({min,max})])));
export const PIGMENT_COLOR_PRESETS=Object.freeze([
  {id:'mixed-shift',label:'亮度與 a* 一起變',state:{L:43,a:34,b:10,basis:'matched'}},
  {id:'lightness-only',label:'只有亮度變',state:{L:45,a:30,b:10,basis:'matched'}},
  {id:'opposite-shift',label:'沿相反方向變',state:{L:37,a:26,b:10,basis:'matched'}},
  {id:'neutral',label:'走到中性色軸',state:{L:40,a:0,b:0,basis:'matched'}},
].map(p=>Object.freeze({...p,state:Object.freeze(p.state)})));
export const PIGMENT_ASSAY_DEFAULTS=Object.freeze({a1_520:0.8,a1_700:0.05,a45_520:0.22,a45_700:0.02,dilutionFactor:10,mode:'paired'});
export const PIGMENT_ASSAY_LIMITS=Object.freeze({absorbance:Object.freeze({min:0,max:2}),dilutionFactor:Object.freeze({min:5,max:1000})});
export const PIGMENT_ASSAY_CONSTANTS=Object.freeze({molecularWeight:449.2,extinctionCoefficient:26900,pathLengthCm:1,minSignal:0.2,maxSignal:1.4,minConcentrationMgL:20,maxConcentrationMgL:3000});

function parameters(input,defaults){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('Parameters must be an object');
  for(const key of Object.keys(input))if(!Object.hasOwn(defaults,key))throw new TypeError('Unknown parameter: '+key);
  return {...defaults,...input};
}
function bounded(value,{min,max},name){
  if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(name+' must be finite');
  if(value<min||value>max)throw new RangeError(name+' is outside the teaching range');
}
function colour(L,a,b){
  const chroma=Math.hypot(a,b);
  return {L,a,b,chroma,hueDegrees:chroma===0?null:(Math.atan2(b,a)*180/Math.PI+360)%360};
}
export function evaluatePigmentColor(input={}){
  const state=parameters(input,PIGMENT_COLOR_DEFAULTS);
  for(const [key,limits] of Object.entries(PIGMENT_COLOR_LIMITS))bounded(state[key],limits,key);
  if(!['matched','different-illuminant'].includes(state.basis))throw new RangeError('Unknown measurement basis');
  const reference=colour(40,30,10),sample=colour(state.L,state.a,state.b);
  const delta={L:sample.L-reference.L,a:sample.a-reference.a,b:sample.b-reference.b};
  return {reference,sample,delta,deltaEab:Math.hypot(delta.L,delta.a,delta.b),comparable:state.basis==='matched',basis:state.basis};
}

export function evaluatePigmentAssay(input={}){
  const state=parameters(input,PIGMENT_ASSAY_DEFAULTS),c=PIGMENT_ASSAY_CONSTANTS;
  for(const key of ['a1_520','a1_700','a45_520','a45_700'])bounded(state[key],PIGMENT_ASSAY_LIMITS.absorbance,key);
  bounded(state.dilutionFactor,PIGMENT_ASSAY_LIMITS.dilutionFactor,'dilutionFactor');
  if(!Number.isInteger(state.dilutionFactor))throw new RangeError('The teaching dilution record must be an integer');
  if(!['paired','difference-only','single-reading'].includes(state.mode))throw new RangeError('Unknown correction method');
  const pH1=state.a1_520-state.a1_700,pH45=state.a45_520-state.a45_700,delta=pH1-pH45;
  const factor=c.molecularWeight*state.dilutionFactor*1000/(c.extinctionCoefficient*c.pathLengthCm);
  const absorbance=state.mode==='paired'?delta:state.mode==='difference-only'?state.a1_520-state.a45_520:state.a1_520;
  const concentrationMgL=absorbance*factor;
  // Scope refers to the proper paired method, even when the learner chooses a diagnostic shortcut.
  const correctedConcentration=delta*factor;
  const signalInRange=state.a1_520>=c.minSignal&&state.a1_520<=c.maxSignal;
  // Rounded binary arithmetic at an exact method endpoint is not an out-of-range sample.
  const withinEndpoint=(value,bound)=>Math.abs(value-bound)<=1e-12*Math.max(1,Math.abs(bound));
  const concentrationInRange=(correctedConcentration>=c.minConcentrationMgL||withinEndpoint(correctedConcentration,c.minConcentrationMgL))&&
    (correctedConcentration<=c.maxConcentrationMgL||withinEndpoint(correctedConcentration,c.maxConcentrationMgL));
  const issues=[];
  if(state.mode!=='paired')issues.push('missing-correction');
  if(delta<=0||absorbance<=0)issues.push('nonpositive-difference');
  if(pH1<0||pH45<0)issues.push('negative-corrected-reading');
  if(!signalInRange)issues.push('signal-outside-range');
  if(!concentrationInRange)issues.push('concentration-outside-study');
  return {corrected:{pH1,pH45,delta},candidate:{absorbance,concentrationMgL,mode:state.mode},method:{signalInRange,concentrationInRange,reportable:issues.length===0,issues}};
}
