/** Spherical-droplet geometry and an assigned mass budget, not an adsorption model.
 * Input volume fractions refer to oil volume within the dispersed phase.
 * No kinetics, free energy, breakup pressure, coalescence or shelf life is predicted.
 */
export const EMULSION_LAB_ID = 'emulsion-interface-budget';
export const EMULSION_DEFAULTS = Object.freeze({
  volumeMl:10, diameterUm:5, emulsifierMg:48, eligibleFraction:0.5,
  surfaceLoadMgM2:2, smallDiameterUm:1, largeDiameterUm:10, smallVolumeFraction:0.5,
});
export const EMULSION_LIMITS = Object.freeze(Object.fromEntries(Object.entries({
  volumeMl:[1,100], diameterUm:[0.5,20], emulsifierMg:[0,1000], eligibleFraction:[0,1],
  surfaceLoadMgM2:[0.1,10], smallDiameterUm:[0.5,10], largeDiameterUm:[0.5,20], smallVolumeFraction:[0,1],
}).map(([key,value])=>[key,Object.freeze(value)])));
export const EMULSION_SOURCES = Object.freeze([
  {id:'emulsion-guelph-homogenization',title:'University of Guelph · Homogenization of Milk and Milk Products',url:'https://books.lib.uoguelph.ca/dairyscienceandtechnologyebook/chapter/homogenization-of-milk-and-milk-products/'},
  {id:'emulsion-pea-interface',title:'Olsmats & Rennie (2024) · Pea protein at the interface and in the continuous phase',url:'https://doi.org/10.1021/acs.langmuir.4c00540'},
  {id:'emulsion-size-moments',title:'Langmuir · Definitions of D[3,2] and D[4,3]',url:'https://doi.org/10.1021/acs.langmuir.4c03812'},
].map(Object.freeze));

function checkedState(input){
  if(!input || typeof input!=='object' || Array.isArray(input))throw new TypeError('Parameters must be an object');
  const state={...EMULSION_DEFAULTS,...input};
  for(const key of Object.keys(input))if(!Object.hasOwn(EMULSION_DEFAULTS,key))throw new TypeError('Unknown parameter: '+key);
  for(const [key,[min,max]] of Object.entries(EMULSION_LIMITS)){
    const value=state[key];
    if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(key+' must be finite');
    if(value<min||value>max)throw new RangeError(key+' is outside the teaching range');
  }
  if(state.smallDiameterUm>state.largeDiameterUm)throw new RangeError('Small diameter must not exceed large diameter');
  return state;
}

/** Sphere area/volume are pi*d^2 and pi*d^3/6. SI geometry is explicit. */
function spherePopulation(volumeMl,diameterUm){
  const volumeM3=volumeMl*1e-6,diameterM=diameterUm*1e-6;
  return {volumeM3,diameterM,particleCount:6*volumeM3/(Math.PI*diameterM**3),totalAreaM2:6*volumeM3/diameterM};
}

export function evaluateEmulsion(input={}){
  const state=checkedState(input);
  const geometry=spherePopulation(state.volumeMl,state.diameterUm);
  const eligibleMg=state.emulsifierMg*state.eligibleFraction;
  const requiredMg=state.surfaceLoadMgM2*geometry.totalAreaM2;
  const capacityRatio=eligibleMg/requiredMg;
  const budget={eligibleMg,requiredMg,capacityAreaM2:eligibleMg/state.surfaceLoadMgM2,capacityRatio,
    shortfallMg:Math.max(0,requiredMg-eligibleMg),surplusMg:Math.max(0,eligibleMg-requiredMg),
    status:eligibleMg+1e-12*Math.max(1,requiredMg)>=requiredMg?'meets':'shortfall'};
  const diameterRatio=state.diameterUm/EMULSION_DEFAULTS.diameterUm;
  const comparison={referenceDiameterUm:EMULSION_DEFAULTS.diameterUm,areaRatio:1/diameterRatio,
    countRatio:1/diameterRatio**3,idealDriftRatio:diameterRatio**2};
  const classes=[
    {diameterUm:state.smallDiameterUm,volumeFraction:state.smallVolumeFraction},
    {diameterUm:state.largeDiameterUm,volumeFraction:1-state.smallVolumeFraction},
  ].map(bin=>{
    const volumeMl=state.volumeMl*bin.volumeFraction,population=spherePopulation(volumeMl,bin.diameterUm);
    return {...bin,volumeMl,particleCount:population.particleCount,areaM2:population.totalAreaM2};
  });
  const totalAreaM2=classes.reduce((sum,bin)=>sum+bin.areaM2,0);
  const d32Um=1/classes.reduce((sum,bin)=>sum+bin.volumeFraction/bin.diameterUm,0);
  const d43Um=classes.reduce((sum,bin)=>sum+bin.volumeFraction*bin.diameterUm,0);
  const areaUsingD43M2=spherePopulation(state.volumeMl,d43Um).totalAreaM2;
  const distribution={d32Um,d43Um,totalAreaM2,areaUsingD43M2,
    areaUnderestimatePercent:Math.max(0,(totalAreaM2-areaUsingD43M2)/totalAreaM2*100),
    particleCount:classes.reduce((sum,bin)=>sum+bin.particleCount,0),
    classes:classes.map(bin=>({...bin,areaFraction:bin.areaM2/totalAreaM2}))};
  return {geometry,budget,comparison,distribution};
}
