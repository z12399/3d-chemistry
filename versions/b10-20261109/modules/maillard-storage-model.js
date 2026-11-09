/** Published storage observations and parameter substitution; no aw or physical-state simulation. */
export const MAILLARD_STORAGE_LAB_ID='maillard-storage-evidence';

const PRIMARY='maillard-storage-aalaei2018';
const THESIS='maillard-storage-aalaei2017-thesis';
const EXAM='ntu-food-chemistry-115-239';
const TEMPERATURES=Object.freeze([30,32.5,35]);
const RHS=Object.freeze([43,52]);
const UNITS=Object.freeze(['h^-1','day^-1']);
const MODES=Object.freeze(['endpoint','kinetics']);
const DAYS=30;
const HOURS=DAYS*24;
const SOURCE_ROOT='output/maillard-aw-candidate-2026-10-11/';
const SOURCE_CONTRACT=Object.freeze({
  [PRIMARY]:Object.freeze({year:2018,url:'https://academic.oup.com/ijfst/article/53/9/2159/7804989',file:'sources/aalaei2018-oup-indexed-text.txt',sha256:'a99bc62389a1f18b698c22436f22ff6fcf8e5f8c7d25bb2db3bcae6eab5ef864',kind:'publisher-indexed-text'}),
  [THESIS]:Object.freeze({year:2017,url:'https://lup.lub.lu.se/search/files/31006882/Kataneh_Thesis_2017.pdf',file:'sources/aalaei-thesis-2017.pdf',sha256:'60c68043b0490ae941453f749696ab619a4ba5b10a2b896f74354f13af7fe084',kind:'original-pdf'}),
  [EXAM]:Object.freeze({year:2026,url:'https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-239.pdf',file:'sources/ntu115-239.pdf',sha256:'c8c9a9260a9bd8aeb07630872d041f81a68c7bbd44b8d2c34827c7245e7a6f5f',kind:'original-pdf'}),
});
// Source-specific identity checks. Tests independently read the frozen publisher table.
// Each tuple is [temperature C, RH %, 30-day loss %, printed k*1000, printed CI half-width*1000].
const REPORTED=Object.freeze([
  [30,43,5.93,.113,.021],[32.5,43,11.86,.181,.024],[35,43,15.82,.251,.029],
  [30,52,13.74,.206,.033],[32.5,52,22.22,.386,.027],[35,52,28.95,.486,.0171],
].map(Object.freeze));
const WATER_COLUMNS=Object.freeze([[30,43],[30,52],[32.5,43],[32.5,52],[35,43],[35,52]].map(Object.freeze));
// Table 1 values are wet-basis water mass %, not aw. A null remains a missing observation.
const WATER_TABLE=Object.freeze([
  [0,[4,.02],[2.96,.10],[4,.02],[2.96,.10],[4,.02],[2.96,.10]],
  [2,null,[6.68,.04],null,null,null,[6.24,.02]],
  [3,null,[6.27,.14],null,null,null,null],
  [4,[6.70,.04],[6.91,.14],[6.95,.01],null,[7.55,.01],null],
  [5,null,null,null,[6.88,.04],null,[6.01,.02]],
  [10,null,[5.84,.05],null,[6.49,.05],[5.42,.02],[5.66,.02]],
  [15,[7.01,.10],[4.89,.04],[5.14,.04],[6.28,.08],[5.36,.01],[6.03,.03]],
  [20,[5.66,.04],[4.55,.10],[5.36,.03],[6.49,.03],[5.34,.04],[5.47,.01]],
  [30,[5.47,.02],[4.21,.03],[5.65,.05],[6.71,.11],[5.06,.03],[6.04,.05]],
].map(row=>Object.freeze(row.map(value=>Array.isArray(value)?Object.freeze(value):value))));
const LIMIT_IDS=Object.freeze([
  'storage-rh-not-aw','initial-water-differs','endpoint-not-rate','uncertainty-types',
  'missing-time-series','physical-state-unmeasured','early-indicator-only',
  'two-rh-conditions','source-access-and-version','normalized-model-substitution',
]);

function fail(message){throw new TypeError('Maillard storage evidence: '+message);}
function record(value,name){
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail(name+' must be a plain object');
  return value;
}
function text(value,name){if(typeof value!=='string'||!value.trim())fail(name+' must be nonempty text');}
function finite(value,name){if(typeof value!=='number'||!Number.isFinite(value))fail(name+' must be finite');return value;}
function exact(actual,expected,name){if(actual!==expected)fail(name+' does not match the frozen source');}
function list(value,expected,name){
  if(!Array.isArray(value)||value.length!==expected.length||value.some((v,i)=>v!==expected[i]))fail(name+' does not match the stated values');
}
function refs(value,name){list(value,[PRIMARY],name+' source references');}
function snapshot(value,expected,name){
  record(value,name);exact(value.path,SOURCE_ROOT+expected.file,name+' path');
  exact(value.sha256,expected.sha256,name+' SHA-256');exact(value.kind,expected.kind,name+' kind');
}
function temperature(value){
  finite(value,'temperature');if(!TEMPERATURES.includes(value))throw new RangeError('Only reported storage temperatures 30, 32.5, 35 C are available');
  return value;
}

/** Validates the one frozen study, its quantities, source identities, and missingness. Never mutates data. */
export function validateMaillardStorageData(data){
  record(data,'dataset');exact(data.schema,'maillard-storage-evidence/v1','schema');
  exact(data.id,MAILLARD_STORAGE_LAB_ID,'dataset ID');text(data.title,'title');
  if(!Array.isArray(data.sources)||data.sources.length!==3)fail('three source identities are required');
  const sourceIds=new Set();
  for(const source of data.sources){
    record(source,'source');const expected=Object.hasOwn(SOURCE_CONTRACT,source.id)?SOURCE_CONTRACT[source.id]:null;
    if(!expected||sourceIds.has(source.id))fail('unknown or repeated source ID');sourceIds.add(source.id);
    for(const key of ['title','authors','publisher','locator','note'])text(source[key],'source '+key);
    exact(source.url,expected.url,'source URL');exact(source.year,expected.year,'source year');
    exact(source.access,expected.kind,'source access');snapshot(source.snapshot,expected,'source snapshot');
    if(source.id===PRIMARY)exact(source.doi,'10.1111/ijfs.13803','primary DOI');
  }
  const c=record(data.conditions,'conditions');
  list(c.temperatureC,TEMPERATURES,'temperatures');list(c.rhPercent,RHS,'storage RH');
  exact(c.storageDays,DAYS,'storage duration');exact(c.matrixId,'norrmejerrier-commercial-low-heat-smp','matrix ID');text(c.matrix,'matrix');
  exact(c.proteinPercent?.mean,37,'protein %');exact(c.proteinPercent?.reportedPlusMinus,2,'protein variability');
  exact(c.lactosePercent?.mean,50,'lactose %');exact(c.lactosePercent?.reportedPlusMinus,2,'lactose variability');
  exact(c.fatPercentUpperExclusive,1.25,'fat bound');
  exact(c.pretreatment?.pasteurizationTemperatureC,73,'pasteurization temperature');exact(c.pretreatment?.seconds,15,'pasteurization time');
  exact(c.temperatureToleranceC,.5,'temperature tolerance');exact(c.rhTolerancePercentagePoints,3,'RH tolerance');
  exact(c.container,'open-petri-dish-in-controlled-rh-desiccator','container');
  exact(c.powderMassG,8,'sample mass');exact(c.layerThicknessCm,1,'sample thickness');
  exact(c.lysineAssay?.quantity,'available-lysine','assay quantity');exact(c.lysineAssay?.method,'dye-binding','assay');
  exact(c.lysineAssay?.independentReplicates,5,'assay replicates');
  const aw=record(c.sampleAwMeasurement,'aw measurement');
  exact(aw.temperatureC,20,'aw measurement temperature');exact(aw.sampleMassG,1,'aw sample mass');
  exact(aw.replicates,2,'aw replicates');exact(aw.instrument,'Aqua-lab Series 3TE','aw instrument');
  exact(aw.timeSeries,null,'unavailable aw time series');exact(aw.status,'not-obtained','aw status');
  exact(c.identicalInitialWaterStateEstablished,false,'initial water-state comparability');refs(c.sourceRefs,'conditions');text(c.sourceLocation,'conditions location');

  if(!Array.isArray(data.rows)||data.rows.length!==6)fail('six reported conditions are required');
  const seen=new Set();
  for(const row of data.rows){
    record(row,'condition');temperature(row.temperatureC);finite(row.rhPercent,'storage RH');
    const expected=REPORTED.find(item=>item[0]===row.temperatureC&&item[1]===row.rhPercent);
    if(!expected)fail('unknown temperature/RH condition');
    const id=`smp-${row.temperatureC}C-${row.rhPercent}rh`;
    exact(row.id,id,'condition ID');if(seen.has(id))fail('repeated condition');seen.add(id);
    const endpoint=record(row.endpoint,'endpoint'),fit=record(row.fit,'fit');
    exact(endpoint.timeDays,DAYS,'endpoint day');finite(endpoint.lossPercent,'endpoint loss');
    exact(endpoint.lossPercent,expected[2],'reported endpoint loss');exact(endpoint.uncertainty,null,'unavailable endpoint uncertainty');
    exact(endpoint.origin,'reported-endpoint','endpoint origin');refs(endpoint.sourceRefs,'endpoint');
    exact(endpoint.sourceLocation,'Results / Blockage of lysine as a function of storage temperature and RH','endpoint location');
    exact(fit.order,1,'model order');finite(fit.printedKTimes1000PerHour,'printed k');finite(fit.printedCi95HalfWidthTimes1000PerHour,'printed k CI');
    exact(fit.printedKTimes1000PerHour,expected[3],'Table 2 k');exact(fit.printedCi95HalfWidthTimes1000PerHour,expected[4],'Table 2 CI');
    exact(fit.confidenceLevel,.95,'k confidence level');exact(fit.origin,'published-fit','parameter origin');
    refs(fit.sourceRefs,'fit');exact(fit.sourceLocation,'Table 2','fit location');
  }

  const water=record(data.waterContent,'water-content table');
  exact(water.quantity,'Water mass percent, wet basis, NOT water activity','water quantity');
  exact(water.replicates,2,'water replicates');exact(water.uncertainty,'SD','water uncertainty');
  refs(water.sourceRefs,'water table');exact(water.sourceLocation,'Table 1','water source');
  if(!Array.isArray(water.rows)||water.rows.length!==WATER_TABLE.length)fail('water-content sampling days');
  water.rows.forEach((row,i)=>{
    record(row,'water row');exact(row.timeDays,WATER_TABLE[i][0],'water sampling time');
    if(!Array.isArray(row.measurements)||row.measurements.length!==6)fail('water-content conditions');
    row.measurements.forEach((observation,j)=>{
      record(observation,'water observation');const expected=WATER_TABLE[i][j+1];
      exact(observation.storageTemperatureC,WATER_COLUMNS[j][0],'water temperature');
      exact(observation.storageRhPercent,WATER_COLUMNS[j][1],'water RH');
      exact(observation.replicates,2,'water replicate count');exact(observation.reportedMissing,expected===null,'water missingness');
      exact(observation.meanWaterPercentWetBasis,expected===null?null:expected[0],'water content');
      exact(observation.sdWaterPercentWetBasis,expected===null?null:expected[1],'water SD');
    });
  });
  const missing=record(data.missingEvidence,'missing evidence');
  const missingStatus={lysineTimeSeries:'not-obtained',sampleAwTimeSeries:'not-obtained',measuredC0:'not-obtained',fitC0:'not-stated',physicalStateTimeSeries:'not-established'};
  for(const [key,status] of Object.entries(missingStatus)){
    const entry=record(missing[key],key);exact(entry.values,null,key+' unknown values');exact(entry.status,status,key+' status');
    refs(entry.sourceRefs,key);text(entry.sourceLocation,key+' location');
  }
  const calculator=record(data.modelCalculator,'calculator identity');
  exact(calculator.timeDays,DAYS,'calculator day');exact(calculator.timeHours,HOURS,'calculator hours');
  exact(calculator.formula,'r(t) = exp(-k * t)','calculator formula');exact(calculator.modelInitialFraction,1,'model normalization');
  exact(calculator.parameterOrigin,'published-fit','calculator parameter origin');exact(calculator.resultKind,'model-substitution','calculator result kind');
  exact(calculator.newMeasurement,false,'calculator measurement flag');exact(calculator.independentlyRefit,false,'calculator refit flag');
  exact(calculator.fitC0Treatment,'not-stated','C0 fitting treatment');refs(calculator.sourceRefs,'calculator');
  exact(calculator.sourceLocation,'Methodology / Determination of kinetics of available lysine；Fig. 2','calculator location');
  if(!Array.isArray(data.versionDifferences)||data.versionDifferences.length!==2)fail('source version differences');
  const rhDifference=data.versionDifferences.find(difference=>difference?.id==='lower-rh-label');
  exact(rhDifference?.selectedSourceId,PRIMARY,'selected RH source');exact(rhDifference?.selectedRhPercent,43,'selected lower RH');
  exact(rhDifference?.otherSourceId,THESIS,'other RH source');list(rhDifference?.otherReportedRhPercent,[43,44],'thesis RH labels');
  const publicationDifference=data.versionDifferences.find(difference=>difference?.id==='publication-identity');
  exact(publicationDifference?.selectedSourceId,PRIMARY,'publication identity');exact(publicationDifference?.otherSourceId,THESIS,'thesis identity');
  data.versionDifferences.forEach(difference=>text(difference.note,'version note'));
  if(!Array.isArray(data.limits)||data.limits.length!==LIMIT_IDS.length)fail('required evidence limits');
  const limits=new Set();
  for(const limit of data.limits){
    if(!LIMIT_IDS.includes(limit?.id)||limits.has(limit.id))fail('unknown or repeated evidence limit');
    limits.add(limit.id);text(limit.detail,'limit detail');
  }
  record(data.provenance,'provenance');text(data.provenance.transcription,'transcription');
  snapshot(data.provenance.sourceAudit,{file:'source-audit.json',sha256:'2ad457c847a95d0161138996453889edfe1695b400e6ce8c0c7f460c5ae734df',kind:'source-audit'},'source audit');
  snapshot(data.provenance.sourceFreeze,{file:'source-audit-freeze.json',sha256:'2f12d24eaf5966bf504b2b4448461fc593101c98d2f09ad68b806ea540fd3029',kind:'source-freeze'},'source freeze');
  return data;
}

function pair(data,temperatureC){
  validateMaillardStorageData(data);temperature(temperatureC);
  return RHS.map(rh=>data.rows.find(row=>row.temperatureC===temperatureC&&row.rhPercent===rh));
}
function options(value){
  record(value,'comparison options');
  if(Object.keys(value).some(key=>!['temperatureC','mode','rateUnit'].includes(key)))fail('unknown comparison option');
  const temperatureC=Object.hasOwn(value,'temperatureC')?value.temperatureC:30;
  const mode=Object.hasOwn(value,'mode')?value.mode:'endpoint';
  const rateUnit=Object.hasOwn(value,'rateUnit')?value.rateUnit:'h^-1';
  temperature(temperatureC);
  if(!MODES.includes(mode))throw new RangeError('Mode must be endpoint or kinetics');
  if(!UNITS.includes(rateUnit))throw new RangeError('Rate unit must be h^-1 or day^-1');
  return {temperatureC,mode,rateUnit};
}

/** Compares reported point estimates at one storage temperature. No significance test or combined CI. */
export function compareMaillardStorage(data,selection={}){
  const {temperatureC,mode,rateUnit}=options(selection);
  const selected=pair(data,temperatureC),endpoint=mode==='endpoint',scale=rateUnit==='h^-1'?1:24;
  const unit=endpoint?'%':rateUnit;
  const rows=selected.map(row=>{
    const evidence=endpoint?row.endpoint:row.fit;
    const value=endpoint?evidence.lossPercent:evidence.printedKTimes1000PerHour/1000*scale;
    const halfWidth=endpoint?null:evidence.printedCi95HalfWidthTimes1000PerHour/1000*scale;
    return {id:row.id,temperatureC,rhPercent:row.rhPercent,value,unit,timeDays:DAYS,
      uncertainty:endpoint?null:{type:'ci95',halfWidth,low:value-halfWidth,high:value+halfWidth},
      kind:evidence.origin,sourceRefs:[...evidence.sourceRefs],sourceLocation:evidence.sourceLocation};
  });
  return {datasetId:data.id,temperatureC,mode,unit,
    quantity:endpoint?'第 30 天可利用離胺酸損失':'作者擬合一階 k',rows,
    difference:{value:rows[1].value-rows[0].value,unit:endpoint?'percentage-points':rateUnit,label:'52% RH − 43% RH'},
    limitIds:LIMIT_IDS.filter(id=>id!=='normalized-model-substitution')};
}

/** Evaluates a unit-normalized first-order model at 30 d using printed k; does not infer measured/fitted C0. */
export function normalizedMaillardEndpoint(data,temperatureC){
  const selected=pair(data,temperatureC);
  const rows=selected.map(row=>{
    const kPerHour=row.fit.printedKTimes1000PerHour/1000,exponent=-kPerHour*HOURS;
    const remainingFraction=Math.exp(exponent),lossPercent=-Math.expm1(exponent)*100;
    return {id:row.id,rhPercent:row.rhPercent,temperatureC,normalizedInitial:1,timeDays:DAYS,kPerHour,
      remainingFraction,lossPercent,reportedLossPercent:row.endpoint.lossPercent,
      differencePercentagePoints:lossPercent-row.endpoint.lossPercent,uncertainty:null,kind:'model-substitution',
      sourceRefs:[...row.fit.sourceRefs],sourceLocation:data.modelCalculator.sourceLocation};
  });
  return {datasetId:data.id,temperatureC,timeDays:DAYS,kind:'model-substitution',unit:'%',
    quantity:'第 30 天正規化模型損失',rows,
    normalization:{modelInitialFraction:1,measuredC0:null,fittedC0:null,fitC0Treatment:'not-stated',newMeasurement:false,independentlyRefit:false},
    sourceRefs:[PRIMARY],sourceLocation:data.modelCalculator.sourceLocation,limitIds:[...LIMIT_IDS]};
}
