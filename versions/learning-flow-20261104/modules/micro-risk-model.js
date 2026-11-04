/** Bounded, original teaching example. Scientific sources support the framework
 * and model form, not these parameter values or any real population. */
export const MICRO_RISK_LAB_ID='micro-risk-integration-lab';
export const MICRO_RISK_VERSION='micro-risk-toy-v1';
export const MICRO_RISK_CONFIG=Object.freeze({
  version:MICRO_RISK_VERSION,initialConcentrationPerGram:.1,
  scenarioGenerationHours:Object.freeze({A:4,B:2}),
  timeHours:Object.freeze({min:0,max:8,default:4}),
  servingGrams:Object.freeze([25,50,75,100]),
  responseCandidates:Object.freeze([.001,.002,.004]),
  sourceIds:Object.freeze(['codex-cxg30-2014','fao-who-mra36-2021']),
});

const priority=['INVALID','OUT_OF_DOMAIN','UNSUPPORTED','UNKNOWN'];
const units={C:'toy-cells/g',d:'toy-cells/serving',P:'probability'};
const responseFields=['model','r','endpoint','hazard','food','host','doseDistribution','independent'];
const accessor=Symbol('accessor field');
const missing=value=>value===undefined||value===null;
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
const own=(object,key)=>{const descriptor=Object.getOwnPropertyDescriptor(object,key);return descriptor?Object.hasOwn(descriptor,'value')?descriptor.value:accessor:undefined;};
const unique=values=>[...new Set(values)];
const issue=(status,code)=>({status,code});
function node(value,unit,issues=[],assumptions=[]){
  const problems=[...issues];
  if(!problems.length&&(typeof value!=='number'||!Number.isFinite(value)))problems.push(issue('INVALID','NONFINITE_ARITHMETIC'));
  const status=priority.find(candidate=>problems.some(problem=>problem.status===candidate))||'KNOWN';
  return {status,value:status==='KNOWN'?(Object.is(value,-0)?0:value):null,unit,reasonCodes:unique(problems.map(problem=>problem.code)),assumptions:unique(assumptions)};
}
function numeric(value,name,{values,max}={}){
  if(missing(value))return [issue('UNKNOWN',`MISSING_${name}`)];
  if(typeof value!=='number'||!Number.isFinite(value)||value<0)return [issue('INVALID',`INVALID_${name}`)];
  if(values&&!values.includes(value)||max!==undefined&&value>max)return [issue('OUT_OF_DOMAIN',`${name}_OUT_OF_DOMAIN`)];
  return [];
}
function expectedString(value,name,expected,status='UNSUPPORTED'){
  if(missing(value))return [issue('UNKNOWN',`MISSING_${name}`)];
  if(typeof value!=='string'||!value.trim())return [issue('INVALID',`INVALID_${name}`)];
  return expected.includes(value)?[]:[issue(status,`${name}_${status}`)];
}
function unavailable(value,dependency){
  return value.status==='KNOWN'?[]:[issue(value.status,`${dependency}_UNAVAILABLE`),...value.reasonCodes.map(code=>issue(value.status,code))];
}
function responseIssues(response){
  if(missing(response))return [issue('UNKNOWN','MISSING_RESPONSE_MODEL')];
  if(!record(response))return [issue('INVALID','INVALID_RESPONSE')];
  const problems=[
    ...expectedString(own(response,'model'),'RESPONSE_MODEL',['poisson-single-hit']),
    ...numeric(own(response,'r'),'R',{values:MICRO_RISK_CONFIG.responseCandidates}),
    ...expectedString(own(response,'endpoint'),'ENDPOINT',['infection']),
    ...expectedString(own(response,'hazard'),'HAZARD',['H*']),
    ...expectedString(own(response,'food'),'FOOD',['F*']),
    ...expectedString(own(response,'host'),'HOST',['G*']),
    ...expectedString(own(response,'doseDistribution'),'DOSE_DISTRIBUTION',['poisson']),
  ];
  const independent=own(response,'independent');
  if(missing(independent))problems.push(issue('UNKNOWN','MISSING_INDEPENDENCE'));
  else if(typeof independent!=='boolean')problems.push(issue('INVALID','INVALID_INDEPENDENCE'));
  else if(!independent)problems.push(issue('UNSUPPORTED','INDEPENDENCE_UNSUPPORTED'));
  return problems;
}
const growthAssumptions=['HYPOTHETICAL_PARAMETERS','FIXED_SCENARIO_CONDITIONS','NO_LAG_PLATEAU_DEATH_OR_RECONTAMINATION'];
const doseAssumptions=['HOMOGENEOUS_SCENARIO','MEAN_DOSE_NOT_EXACT_COUNT'];
const probabilityAssumptions=['POISSON_INCLUDES_ZERO','INDEPENDENT_SINGLE_HIT','FIXED_R','INFECTION_ENDPOINT_ONLY','NO_PREVALENCE_MULTIPLIER'];
function otherEndpoints(){
  return Object.fromEntries([
    ['illnessProbability','probability','MISSING_ILLNESS_MODEL'],
    ['severity','not-defined','MISSING_SEVERITY_MODEL'],
    ['deathProbability','probability','MISSING_MORTALITY_MODEL'],
    ['populationBurden','not-defined','MISSING_POPULATION_AND_SEVERITY_MODEL'],
    ['marketRisk','probability','MISSING_MARKET_EXPOSURE_DISTRIBUTION_AND_WEIGHTS'],
  ].map(([key,unit,code])=>[key,node(null,unit,[issue('UNKNOWN',code)],['NOT_COMPLETE_MRA'])]));
}

export function createDefaultRiskInput(){
  return {initialConcentrationPerGram:.1,scenario:'A',timeHours:4,servingGrams:50,response:null};
}
export function createToyResponse(r=.002){
  return {model:'poisson-single-hit',r,endpoint:'infection',hazard:'H*',food:'F*',host:'G*',doseDistribution:'poisson',independent:true};
}

export function evaluateMicroRisk(input){
  if(!record(input)){
    const problems=[issue(missing(input)?'UNKNOWN':'INVALID',missing(input)?'MISSING_INPUT':'INVALID_INPUT')];
    return {modelVersion:MICRO_RISK_VERSION,...Object.fromEntries(Object.entries(units).map(([key,unit])=>[key,node(null,unit,problems)])),otherEndpoints:otherEndpoints()};
  }
  const initial=own(input,'initialConcentrationPerGram'),scenario=own(input,'scenario'),time=own(input,'timeHours'),serving=own(input,'servingGrams'),response=own(input,'response');
  const cIssues=[...numeric(initial,'INITIAL_CONCENTRATION',{values:[.1]}),...expectedString(scenario,'SCENARIO',['A','B'],'OUT_OF_DOMAIN'),...numeric(time,'TIME',{max:8})];
  const C=node(cIssues.length?null:initial*2**(time/MICRO_RISK_CONFIG.scenarioGenerationHours[scenario]),units.C,cIssues,growthAssumptions);
  const dIssues=[...unavailable(C,'CONCENTRATION'),...numeric(serving,'SERVING',{values:MICRO_RISK_CONFIG.servingGrams})];
  const d=node(dIssues.length?null:C.value*serving,units.d,dIssues,[...C.assumptions,...doseAssumptions]);
  const pIssues=[...unavailable(d,'MEAN_DOSE'),...responseIssues(response)];
  const P=node(pIssues.length?null:-Math.expm1(-own(response,'r')*d.value),units.P,pIssues,pIssues.length?d.assumptions:[...d.assumptions,...probabilityAssumptions]);
  return {modelVersion:MICRO_RISK_VERSION,C,d,P,otherEndpoints:otherEndpoints()};
}

function compareNodes(left,right){
  const problems=[...unavailable(left,'LEFT'),...unavailable(right,'RIGHT')],assumptions=[...left.assumptions,...right.assumptions,'RIGHT_RELATIVE_TO_LEFT'];
  const delta=node(problems.length?null:right.value-left.value,left.unit,problems,assumptions);
  const ratioIssues=[...problems];if(!ratioIssues.length&&left.value===0)ratioIssues.push(issue('UNKNOWN','ZERO_BASELINE_RATIO'));
  return {delta,ratio:node(ratioIssues.length?null:right.value/left.value,'ratio',ratioIssues,assumptions)};
}
export function compareMicroRisk(leftInput,rightInput){
  const left=evaluateMicroRisk(leftInput),right=evaluateMicroRisk(rightInput);
  return {left,right,...Object.fromEntries(['C','d','P'].map(key=>[key,compareNodes(left[key],right[key])]))};
}

function copyData(value,seen=new WeakMap()){
  if(!value||typeof value!=='object')return value;
  if(seen.has(value))return seen.get(value);
  if(!record(value)&&!Array.isArray(value))return null;
  const copy=Array.isArray(value)?[]:{};seen.set(value,copy);
  for(const key of Object.keys(value)){const item=own(value,key);Object.defineProperty(copy,key,{value:item===accessor?null:copyData(item,seen),enumerable:true,writable:true,configurable:true});}
  return copy;
}
function weightIssues(weights,count){
  if(missing(weights))return [issue('UNKNOWN','MISSING_WEIGHTS')];
  if(!Array.isArray(weights)||weights.length!==count)return [issue('INVALID','INVALID_WEIGHTS_SHAPE')];
  if(Array.from(weights).some(value=>typeof value!=='number'||!Number.isFinite(value)||value<0))return [issue('INVALID','INVALID_WEIGHT')];
  const sum=weights.reduce((total,value)=>total+value,0);
  return Number.isFinite(sum)&&Math.abs(sum-1)<=1e-12?[]:[issue('INVALID','INVALID_WEIGHT_SUM')];
}
function scopeValues(input){
  if(!record(input))return null;
  const response=own(input,'response'),values=['initialConcentrationPerGram','scenario','timeHours'].map(key=>own(input,key));
  return [...values,...responseFields.map(key=>record(response)?own(response,key):undefined)].map(value=>missing(value)?null:value);
}
export function averageServingRisk(inputs,weights){
  const items=Array.isArray(inputs)?Array.from(inputs):[],rows=items.map(input=>({input:copyData(input),result:evaluateMicroRisk(input)}));
  const common=[];
  if(!Array.isArray(inputs)||![3,4].includes(items.length))common.push(issue('INVALID','INVALID_SERVING_AVERAGE_INPUTS'));
  common.push(...weightIssues(weights,items.length));
  const scopes=items.map(scopeValues).filter(Boolean);
  const mismatch=scopes.some(scope=>scope.some((value,index)=>!missing(value)&&scopes.some(other=>!missing(other[index])&&!Object.is(value,other[index]))));
  if(mismatch)common.push(issue('UNSUPPORTED','SERVING_AVERAGE_SCOPE_MISMATCH'));
  const assumptions=['EXPLICIT_SERVING_WEIGHTS','HYPOTHETICAL_SERVING_VARIATION','NOT_A_CONFIDENCE_INTERVAL'];
  const summaries=Object.fromEntries(['C','d','P'].map(key=>{
    const problems=[...common,...rows.flatMap(row=>unavailable(row.result[key],'ROW'))];
    const value=problems.length?null:rows.reduce((total,row,index)=>total+weights[index]*row.result[key].value,0);
    return [key,node(value,units[key],problems,[...assumptions,...rows.flatMap(row=>row.result[key].assumptions)])];
  }));
  const pAtIssues=[...unavailable(summaries.d,'MEAN_DOSE'),...unavailable(summaries.P,'MEAN_PROBABILITY')];
  const response=record(items[0])?own(items[0],'response'):null;
  const PAtMeanDose=node(pAtIssues.length?null:-Math.expm1(-own(response,'r')*summaries.d.value),units.P,pAtIssues,[...summaries.P.assumptions,'RESPONSE_AT_WEIGHTED_MEAN_DOSE']);
  const gapIssues=[...unavailable(PAtMeanDose,'PROBABILITY_AT_MEAN_DOSE'),...unavailable(summaries.P,'MEAN_PROBABILITY')];
  const probabilityGap=node(gapIssues.length?null:PAtMeanDose.value-summaries.P.value,units.P,gapIssues,[...summaries.P.assumptions,'RESPONSE_AT_MEAN_MINUS_MEAN_RESPONSE']);
  return {rows,weights:Array.isArray(weights)&&!weightIssues(weights,items.length).length?[...weights]:null,...summaries,PAtMeanDose,probabilityGap};
}
