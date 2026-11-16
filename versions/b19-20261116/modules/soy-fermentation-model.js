/** Frozen source observations and process classification; no fermentation simulation. */
export const SOY_FERMENTATION_LAB_ID='soy-fermentation-evidence';

const PRIMARY='soy-source-lee2013';
const MAKER='soy-source-kikkoman';
const TREATMENTS=Object.freeze(['NT','LA','YE','LY']);
const ROWS=Object.freeze({spme:Object.freeze(['ac01','ac04','al01','al19','ac13','es02']),solvent:Object.freeze(['ac01','ac04','al01','al19','ac13'])});
const SOURCE_ROOT='output/microbiology-gap-audit-2026-10-11/';
const SOURCE_CONTRACT=Object.freeze({
  [PRIMARY]:['https://www.jstage.jst.go.jp/article/bbb/77/11/77_130362/_article',SOURCE_ROOT+'sources/lee2013-final.pdf','7b4448b49dd041aa1fc32aff8ac25e0f2d21b7d8c924209153fb8110f9d6bcf3','original-pdf'],
  [MAKER]:['https://www.kikkoman.co.uk/about-kikkoman/kikkoman-quality/brewing-process','output/soy-fermentation-evidence-2026-10-11/sources/kikkoman-brewing.html','7162c2df3900e0ee859b01acd5746727153b65baed985b98b8ad9e2d2fab7cc7','manufacturer-original-html'],
  'ntu-food-microbiology-114-259':['https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/114/114-259.pdf',SOURCE_ROOT+'sources/ntu114-259.pdf','dc3d4f002917a37f63d9a344e1227e945fbfdca0ed8cc962e5df8e6950397eb7','official-exam-pdf'],
  'ntu-food-processing-115-240':['https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-240.pdf',SOURCE_ROOT+'sources/ntu115-240.pdf','c9dd01e2cb0a24fc930c92ae7de4351439ca66bc15bf146b39166b344af0d8df','official-exam-pdf'],
});
const SOURCE_TITLES=Object.freeze([
  'Comparative Volatile Profiles in Soy Sauce According to Inoculated Microorganisms',
  'How soy sauce is brewed','臺大114學年度食品微生物學試題','臺大115學年度食品加工學試題',
]);
export const SOY_FERMENTATION_SOURCES=Object.freeze(Object.entries(SOURCE_CONTRACT).map(([id,source],index)=>Object.freeze({id,title:SOURCE_TITLES[index],url:source[0]})));
const ACTION_TYPES=Object.freeze(['physical-treatment','enzyme-production','hydrolysis','metabolism','separation','handling']);
const PROCESS_CONTRACT=Object.freeze({
  lee2013:{source:PRIMARY,kind:'research-method',stages:{
    'lee-prepare':{'lee-steam':'physical-treatment'},
    'lee-koji':{'lee-enzymes':'enzyme-production','lee-protein':'hydrolysis'},
    'lee-brine':{'lee-mix':'handling'},
    'lee-ferment':{'lee-continued-hydrolysis':'hydrolysis','lee-products':'metabolism'},
    'lee-sample':{'lee-sampling':'handling'},
  }},
  kikkoman:{source:MAKER,kind:'manufacturer-example',stages:{
    'maker-prepare':{'maker-roast':'physical-treatment'},
    'maker-koji':{'maker-mould':'enzyme-production'},
    'maker-moromi':{'maker-ferment':'metabolism'},
    'maker-press':{'maker-separate':'separation'},
    'maker-refine':{'maker-clarify':'separation','maker-heat':'physical-treatment'},
    'maker-pack':{'maker-bottle':'handling'},
  }},
});
const LIMITS=Object.freeze(['nt-background','method-scale','nd','repeats','letters','mechanism','causality','no-dynamics','no-sensory','no-salt-prediction','no-mass-balance','study-specific-process']);
const MISSING=Object.freeze(['independentFermentationBatches','strainAbsoluteCounts','sameBatchTimeSeries','substrateAndProductMassBalance','sensoryPreference','reducedSaltTreatment']);

function fail(message){throw new TypeError('Soy fermentation evidence: '+message);}
function object(value,name){
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail(name+' must be a plain object');
  return value;
}
function text(value,name){if(typeof value!=='string'||!value.trim())fail(name+' must be nonempty text');}
function exact(value,expected,name){if(value!==expected)fail(name+' does not match the evidence contract');}
function array(value,length,name){if(!Array.isArray(value)||value.length!==length)fail(name+' has an invalid length');return value;}
function sameList(value,expected,name){array(value,expected.length,name);value.forEach((item,i)=>exact(item,expected[i],name));}
function sourceRefs(value,source,name){sameList(value,[source],name+' source references');}
function nonnegative(value,name){if(typeof value!=='number'||!Number.isFinite(value)||value<0)fail(name+' must be finite and nonnegative');}
function own(container,key){return typeof key==='string'&&Object.hasOwn(container,key);}
function copy(value){return JSON.parse(JSON.stringify(value));}
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}

/** Checks identities, units, unknowns, source separation, and valid reported cells without mutation. */
export function validateSoyFermentationData(data){
  object(data,'dataset');exact(data.schema,'soy-fermentation-evidence/v1','schema');exact(data.id,SOY_FERMENTATION_LAB_ID,'ID');text(data.title,'title');
  array(data.sources,4,'sources');const seenSources=new Set();
  for(const source of data.sources){
    object(source,'source');if(!own(SOURCE_CONTRACT,source.id)||seenSources.has(source.id))fail('unknown or repeated source');seenSources.add(source.id);
    const [url,path,hash,kind]=SOURCE_CONTRACT[source.id];
    exact(source.url,url,'source URL');for(const field of ['title','publisher','locator','note'])text(source[field],'source '+field);
    object(source.snapshot,'source snapshot');exact(source.snapshot.path,path,'snapshot path');exact(source.snapshot.sha256,hash,'snapshot hash');exact(source.snapshot.kind,kind,'snapshot kind');
    if(source.id===PRIMARY)exact(source.doi,'10.1271/bbb.130362','DOI');
  }
  object(data.study,'study');const study=data.study;
  exact(study.koji?.inoculated,'Aspergillus oryzae','koji species');exact(study.koji?.durationHours,44,'koji duration');text(study.koji?.backgroundMicroorganisms,'background microbiota');
  exact(study.brineAddition?.printedSaltPercent,22,'added brine percent');exact(study.brineAddition?.printedKojiToBrineRatio,'1:2','koji/brine ratio');
  exact(study.brineAddition?.percentBasis,'not specified in this methods sentence','brine basis');exact(study.brineAddition?.ratioBasis,'not specified','ratio basis');
  exact(study.finalSampleSalt?.value,16,'sample salt');exact(study.finalSampleSalt?.unit,'% w/v','sample salt unit');sameList(study.finalSampleSalt?.appliesTo,TREATMENTS,'sample salt groups');
  exact(study.fermentationDuration?.value,3,'fermentation duration');exact(study.fermentationDuration?.unit,'months','duration unit');
  for(const field of ['moromiTemperatureC','finalWheatContent','independentFermentationBatchN'])exact(study[field],null,'unreported '+field);
  exact(study.reportedRepeat?.value,3,'reported extraction repeats');exact(study.reportedRepeat?.independentFermentationBatches,null,'unreported fermentation batches');
  text(study.statistics?.footnoteInconsistency,'printed footnote inconsistency');text(study.quantity,'relative peak area definition');
  exact(study.statistics?.lettersStatus,'reported annotations only; no independent reanalysis','letter status');
  for(const key of ['sameLettersMeaning','methodPrinted'])text(study.statistics[key],'statistics '+key);
  array(data.treatments,4,'treatments');sameList(data.treatments.map(t=>t.id),TREATMENTS,'treatment IDs');
  for(const [i,treatment] of data.treatments.entries()){
    object(treatment,'treatment');const expected=i===0?[]:i===1?[['Tetragenococcus halophilus','SMB-23',1e7]]:i===2?[['Zygosaccharomyces rouxii','SMY-35',1e6]]:[['Tetragenococcus halophilus','SMB-23',1e7],['Zygosaccharomyces rouxii','SMY-35',1e6]];
    array(treatment.additionalInocula,expected.length,'additional inocula');treatment.additionalInocula.forEach((inoculum,j)=>{object(inoculum,'inoculum');for(const [k,f] of ['organism','strainCode','initialCfuPerMl'].entries())exact(inoculum[f],expected[j][k],'inoculum '+f);});
    if(i===0)text(treatment.meaning,'NT background');
  }
  exact(JSON.stringify(study.treatments),JSON.stringify(data.treatments),'study treatment identity');
  array(data.methods,2,'methods');sameList(data.methods.map(m=>m.id),['spme','solvent'],'method IDs');
  data.methods.forEach((method,i)=>{object(method,'method');text(method.label,'method label');exact(method.table,i+2,'method table');exact(method.internalStandard,i===0?'(Z)-3-hexenyl acetate':'2-tridecanone','internal standard');sourceRefs(method.sourceRefs,PRIMARY,'method');});
  array(data.rows,11,'source rows');const seenRows=new Set();let ndCount=0;
  for(const row of data.rows){
    object(row,'row');if(!own(ROWS,row.method)||!ROWS[row.method].includes(row.compoundCode))fail('unknown method/compound row');
    exact(row.id,row.method+'-'+row.compoundCode,'row ID');if(seenRows.has(row.id))fail('repeated row');seenRows.add(row.id);
    for(const field of ['name','label','class'])text(row[field],'row '+field);
    exact(row.origin,'reported-table','row origin');exact(row.quantity,'relative-peak-area-to-internal-standard','quantity');exact(row.unit,'dimensionless','unit');exact(row.uncertaintyType,'sd','uncertainty type');
    exact(row.reportedN,3,'reported n');exact(row.independentFermentationBatchN,null,'unreported independent n');
    exact(row.identificationCode,row.compoundCode==='ac13'?'C':'A','identification code');
    if(!Number.isInteger(row.retentionIndex)||row.retentionIndex<=0)fail('invalid retention index');
    const table=row.method==='spme'?2:3;exact(row.sourceLocation?.table,table,'row table');exact(row.sourceLocation?.pdfPage,table===2?3:5,'row PDF page');exact(row.sourceLocation?.printedPage,table===2?2194:2196,'row printed page');
    sourceRefs(row.sourceRefs,PRIMARY,'row');array(row.cells,4,'row cells');sameList(row.cells.map(c=>c.treatment),TREATMENTS,'row treatment IDs');
    for(const cell of row.cells){
      object(cell,'cell');if(typeof cell.publishedLetters!=='string'||!/^[a-d]+$/.test(cell.publishedLetters))fail('invalid published grouping letters');
      const nd=row.id==='spme-ac13'&&cell.treatment==='NT';exact(cell.status,nd?'not-detected':'reported','cell detection status');
      if(nd){ndCount++;for(const field of ['mean','sd','printedMean','printedSd'])exact(cell[field],null,'ND '+field);}
      else{
        for(const [number,printed] of [['mean','printedMean'],['sd','printedSd']]){
          nonnegative(cell[number],number);if(typeof cell[printed]!=='string'||!/^\d+\.\d{3}$/.test(cell[printed]))fail('reported numbers retain three printed decimal places');
          exact(cell[number],Number(cell[printed]),'numeric/printed '+number);
        }
      }
    }
  }
  exact(ndCount,1,'ND count');
  array(data.limits,LIMITS.length,'limits');sameList(data.limits.map(l=>l.id),LIMITS,'limit identities');data.limits.forEach(l=>text(l.rule,'limit rule'));
  object(data.missingEvidence,'missing evidence');sameList(Object.keys(data.missingEvidence).sort(),[...MISSING].sort(),'missing evidence identities');MISSING.forEach(k=>exact(data.missingEvidence[k],null,'missing '+k));
  array(data.actionTypes,ACTION_TYPES.length,'action types');sameList(data.actionTypes.map(a=>a.id),ACTION_TYPES,'action types');data.actionTypes.forEach(a=>text(a.label,'action type label'));
  array(data.processExamples,2,'process examples');sameList(data.processExamples.map(p=>p.id),['lee2013','kikkoman'],'process example IDs');
  for(const process of data.processExamples){
    object(process,'process');const expected=PROCESS_CONTRACT[process.id];exact(process.kind,expected.kind,'process kind');text(process.label,'process label');text(process.note,'process note');sourceRefs(process.sourceRefs,expected.source,'process');
    array(process.stages,Object.keys(expected.stages).length,'stages');sameList(process.stages.map(s=>s.id),Object.keys(expected.stages),'stage sequence');
    for(const stage of process.stages){
      object(stage,'stage');for(const field of ['label','summary','state','sourceLocation'])text(stage[field],'stage '+field);sourceRefs(stage.sourceRefs,expected.source,'stage');
      const actions=expected.stages[stage.id];array(stage.actions,Object.keys(actions).length,'stage actions');sameList(stage.actions.map(a=>a.id),Object.keys(actions),'action IDs');
      for(const action of stage.actions){object(action,'action');exact(action.type,actions[action.id],'action classification');text(action.label,'action label');text(action.explanation,'action explanation');sourceRefs(action.sourceRefs,expected.source,'action');}
    }
  }
  object(data.provenance,'provenance');exact(data.provenance.sourceAudit?.path,SOURCE_ROOT+'source-audit.json','audit path');exact(data.provenance.sourceAudit?.sha256,'4e6fb7a775f48965c73f3c18b3d8648901538c9ee574bd82ea901d84225c6f27','audit hash');
  exact(data.provenance.sourceFreeze?.path,SOURCE_ROOT+'source-audit-freeze.json','freeze path');exact(data.provenance.sourceFreeze?.sha256,'46a53830a86cf4d3759659d0979f40db7964de73ef7e73436ec722a09e915d3f','freeze hash');
  exact(data.provenance.allSourceFilesVerified,true,'offline source verification');
  return data;
}

/** Returns immutable copies of one measured row. Ranking only orders detected means within that row. */
export function compareSoyFermentation(data,options={}){
  validateSoyFermentationData(data);object(options,'selection');
  for(const key of Object.keys(options))if(!['method','compoundCode'].includes(key))fail('unsupported control '+key);
  const method=Object.hasOwn(options,'method')?options.method:'spme';
  const compoundCode=Object.hasOwn(options,'compoundCode')?options.compoundCode:'al01';
  if(!own(ROWS,method)||!ROWS[method].includes(compoundCode))throw new RangeError('Only measured method/compound combinations are available');
  const row=copy(data.rows.find(r=>r.method===method&&r.compoundCode===compoundCode));
  const detected=row.cells.filter(c=>c.status==='reported').map(c=>({treatment:c.treatment,mean:c.mean}));
  detected.sort((a,b)=>b.mean-a.mean||TREATMENTS.indexOf(a.treatment)-TREATMENTS.indexOf(b.treatment));
  const notDetected=row.cells.filter(c=>c.status==='not-detected').map(c=>c.treatment);
  return freeze({method,compoundCode,row,cells:copy(row.cells),
    ranking:{complete:notDetected.length===0,detected,notDetected,kind:'descriptive-order-of-detected-means',
      note:notDetected.length?'含未檢出值；只排列已報均值，不能給四組完整排名。':'僅排列同一方法同一化合物的刊載均值，不是顯著性或品質排名。'},
    annotations:{kind:'published-letters',independentlyReanalyzed:false,footnoteIssue:data.study.statistics.footnoteInconsistency},
    sourceRefs:[...row.sourceRefs],limitIds:data.limits.map(l=>l.id)});
}
