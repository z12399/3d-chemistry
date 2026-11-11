/** Source-bound amino-acid composition arithmetic; no digestibility-adjusted score or winner. */
export const PROTEIN_QUALITY_LAB_ID='protein-quality-evidence';
export const PROTEIN_BASIS_IDS=Object.freeze(['crude-protein','amino-acid-sum']);
export const PROTEIN_GROUP_IDS=Object.freeze(['HIS','ILE','LEU','LYS','SAA','AAA','THR','TRP','VAL']);
export const PROTEIN_AMINO_ACID_IDS=Object.freeze(['HIS','ILE','LEU','LYS','MET','PHE','THR','TRP','VAL','ALA','ARG','ASP','CYS','GLU','GLY','PRO','SER','TYR']);
const SAMPLE_IDS=Object.freeze(['tm-blanched','ad-blanched','ad-oven-dried','chicken-cooked','ulva-dried']);
const PATTERN_IDS=Object.freeze(['infant','young-child','older']);
const GROUP_COMPONENTS=Object.freeze(Object.fromEntries(PROTEIN_GROUP_IDS.map(id=>[id,Object.freeze(id==='SAA'?['MET','CYS']:id==='AAA'?['PHE','TYR']:[id])])));
const BASIS_KEYS=Object.freeze({'crude-protein':'crude','amino-acid-sum':'anhydrous'});
// Compact source projections are checked once per new snapshot, never on each calculation.
const MEASUREMENT_PIN='93aa51638f315c1ce6a5e3cebc215e19aacd556ced2e47b0d66e1b0214b72394';
const SOURCE_PIN='1d7aa340ea3b50ed98032ee440b30be62a308780056e098a7182832b2ae94199'; // Filled from the reviewed final source packet before publication.
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const text=value=>typeof value==='string'&&value.trim().length>0;
const same=(left,right)=>Array.isArray(left)&&left.length===right.length&&left.every((value,index)=>value===right[index]);
const requireValue=(condition,message)=>{if(!condition)throw new TypeError('Invalid protein-quality dataset: '+message);};
const clone=value=>structuredClone(value);
const validatedSnapshots=new WeakSet();
const indexes=new WeakMap();
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function exactKeys(value,required,name,optional=[]){
  requireValue(record(value)&&required.every(key=>own(value,key))&&Object.keys(value).every(key=>required.includes(key)||optional.includes(key)),name+' fields');
}
function strings(value,name,{empty=false}={}){requireValue(Array.isArray(value)&&(empty||value.length>0)&&value.every(text)&&new Set(value).size===value.length,name);}
function index(items,name){
  requireValue(Array.isArray(items)&&items.length>0,name);
  const result=new Map();
  for(const item of items){requireValue(record(item)&&text(item.id)&&/^[a-z][a-z0-9-]*$/.test(item.id)&&!result.has(item.id),name+' unique IDs');result.set(item.id,item);}
  return result;
}
function jsonOnly(value,seen=new Set()){
  if(value===null||typeof value==='string'||typeof value==='boolean')return;
  if(typeof value==='number'){requireValue(Number.isFinite(value)&&!Object.is(value,-0),'non-finite or negative-zero number');return;}
  requireValue(typeof value==='object'&&!seen.has(value),'non-JSON or cyclic value');
  const array=Array.isArray(value),prototype=Object.getPrototypeOf(value);
  requireValue(array?prototype===Array.prototype:prototype===Object.prototype||prototype===null,'plain JSON objects only');
  const keys=Reflect.ownKeys(value),descriptors=Object.getOwnPropertyDescriptors(value);
  requireValue(keys.every(key=>typeof key==='string'),'symbol property');
  if(array)requireValue(keys.length===value.length+1&&keys.includes('length')&&Array.from({length:value.length},(_,i)=>String(i)).every(key=>own(value,key)),'dense JSON arrays only');
  seen.add(value);
  for(const key of keys){
    if(array&&key==='length')continue;
    const property=descriptors[key];
    requireValue(!['__proto__','prototype','constructor'].includes(key)&&property.enumerable&&own(property,'value'),'unsafe or accessor property');
    jsonOnly(property.value,seen);
  }
  seen.delete(value);
}
function sourceUrl(value){
  if(!text(value))return false;
  try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}
}
function relativePath(value){return text(value)&&!/[\\:<>"|?*\u0000-\u001f\u007f]/.test(value)&&!value.startsWith('/')&&value.split('/').every(part=>part!==''&&part!=='.'&&part!=='..');}
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
function measurement(value,name,{nullable=false,positive=false,max=null}={}){
  if(nullable&&value===null)return;
  exactKeys(value,['mean','sd','sourceCell'],name);
  requireValue(typeof value.mean==='number'&&Number.isFinite(value.mean)&&(positive?value.mean>0:value.mean>=0)&&(max===null||value.mean<=max),name+' mean');
  requireValue(value.sd===null||typeof value.sd==='number'&&Number.isFinite(value.sd)&&value.sd>=0,name+' SD');
  requireValue(text(value.sourceCell),name+' source cell');
}
function measurementProjection(data){
  const measure=value=>value===null?null:[value.mean,value.sd,value.sourceCell];
  return JSON.stringify({
    aminoAcidKeys:data.aminoAcidKeys,groups:data.groups,
    samples:data.samples.map(sample=>[sample.id,sample.sourceId,sample.table,sample.sourceColumn,sample.aminoAcidBasis,sample.molecularBasis,
      sample.proteinDenominatorUnit,measure(sample.dryMatterPercent),measure(sample.proteinDenominators.crude),measure(sample.proteinDenominators.anhydrous),
      PROTEIN_AMINO_ACID_IDS.map(id=>measure(sample.aminoAcids[id])),sample.missingAminoAcids,sample.digestibilityEvidenceId]),
    patterns:data.patterns.map(pattern=>[pattern.id,pattern.sourceId,pattern.table,pattern.printedPage,pattern.pdfPage,pattern.unit,PROTEIN_GROUP_IDS.map(id=>pattern.values[id])]),
  });
}
function sourceProjection(data){
  return JSON.stringify({
    sources:data.sources.map(source=>[source.id,source.title,source.publisher,source.locator,source.url,source.localPath,source.sha256,
      ...['files','additionalEvidence','supportingFiles'].map(key=>(source[key]||[]).map(file=>[file.path,file.sha256]))]),
    claims:data.claims.map(claim=>[claim.id,claim.text,claim.sourceIds,claim.locator]),
    evidence:data.digestibilityEvidence.map(item=>[item.id,item.label,item.sourceIds,item.method,item.observed,item.canConclude,item.cannotConclude,
      item.reportedResults.map(result=>[result.sampleId,result.label,result.value,result.sd,result.unit,result.locator])]),
    sampleContext:data.samples.map(sample=>[sample.id,sample.label,sample.taxon,sample.processing,sample.pdfPage??null,sample.missingDataReason]),
    patternLabels:data.patterns.map(pattern=>[pattern.id,pattern.label]),formulas:data.formulas,notes:data.notes,limits:data.limits,
  });
}
// Synchronous SHA-256 keeps the public validator synchronous in the browser.
// Pins are produced independently with Node's standard crypto implementation.
function sha256(value){
  const input=new TextEncoder().encode(value),size=Math.ceil((input.length+9)/64)*64;
  const bytes=new Uint8Array(size);bytes.set(input);bytes[input.length]=0x80;
  const view=new DataView(bytes.buffer),bits=input.length*8;
  view.setUint32(size-8,Math.floor(bits/4294967296));view.setUint32(size-4,bits>>>0);
  const k=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],w=new Uint32Array(64);
  const rotate=(word,count)=>(word>>>count)|(word<<(32-count));
  for(let offset=0;offset<size;offset+=64){
    for(let i=0;i<16;i++)w[i]=view.getUint32(offset+i*4);
    for(let i=16;i<64;i++){
      const a=w[i-15],b=w[i-2],s0=rotate(a,7)^rotate(a,18)^(a>>>3),s1=rotate(b,17)^rotate(b,19)^(b>>>10);
      w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;
    }
    let [a,b,c,d,e,f,g,q]=h;
    for(let i=0;i<64;i++){
      const s1=rotate(e,6)^rotate(e,11)^rotate(e,25),choice=(e&f)^(~e&g);
      const t1=(q+s1+choice+k[i]+w[i])>>>0,s0=rotate(a,2)^rotate(a,13)^rotate(a,22),majority=(a&b)^(a&c)^(b&c),t2=(s0+majority)>>>0;
      q=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
    }
    [a,b,c,d,e,f,g,q].forEach((value,i)=>{h[i]=(h[i]+value)>>>0;});
  }
  return h.map(value=>value.toString(16).padStart(8,'0')).join('');
}

/** Validate JSON, provenance, all denominators and missing values, then return a branded immutable copy. */
export function validateProteinQualityDataset(raw){
  if(record(raw)&&validatedSnapshots.has(raw))return raw;
  jsonOnly(raw);
  exactKeys(raw,['schemaVersion','status','aminoAcidKeys','groups','samples','patterns','formulas','notes','sources','claims','digestibilityEvidence','limits'],'dataset');
  requireValue(raw.schemaVersion===1&&text(raw.status),'schema/status');
  requireValue(same(raw.aminoAcidKeys,PROTEIN_AMINO_ACID_IDS)&&same(raw.groups,PROTEIN_GROUP_IDS),'fixed amino-acid and group identities/order');
  const data=clone(raw),sources=index(data.sources,'sources'),samples=index(data.samples,'samples'),patterns=index(data.patterns,'patterns'),claims=index(data.claims,'claims'),evidence=index(data.digestibilityEvidence,'digestibility evidence');
  requireValue(same([...samples.keys()],SAMPLE_IDS)&&same([...patterns.keys()],PATTERN_IDS),'fixed sample/pattern identities/order');
  for(const source of sources.values()){
    for(const field of ['title','publisher','locator'])requireValue(text(source[field]),'source '+field);
    requireValue(sourceUrl(source.url)&&relativePath(source.localPath)&&hash(source.sha256),'source HTTPS/path/hash');
    for(const field of ['files','additionalEvidence','supportingFiles'])if(own(source,field)){
      requireValue(Array.isArray(source[field])&&source[field].length>0,'supporting evidence collection');
      const paths=new Set();
      for(const file of source[field]){requireValue(record(file)&&relativePath(file.path)&&hash(file.sha256)&&!paths.has(file.path),'supporting evidence path/hash');paths.add(file.path);}
    }
  }
  for(const claim of claims.values()){
    exactKeys(claim,['id','text','sourceIds','locator'],'claim');
    requireValue(text(claim.text)&&text(claim.locator),'claim text/locator');strings(claim.sourceIds,'claim source IDs');
    requireValue(claim.sourceIds.every(id=>sources.has(id)),'unknown claim source');
  }
  for(const sample of samples.values()){
    exactKeys(sample,['id','label','taxon','processing','sourceId','table','sourceColumn','aminoAcidBasis','molecularBasis','aminoAcids','dryMatterPercent','proteinDenominators','proteinDenominatorUnit','digestibilityEvidenceId','missingAminoAcids','missingDataReason'],'sample',['pdfPage']);
    for(const field of ['label','taxon','processing','table','sourceColumn'])requireValue(text(sample[field]),'sample '+field);
    requireValue(sources.has(sample.sourceId)&&evidence.has(sample.digestibilityEvidenceId),'sample source/evidence');
    requireValue(sample.aminoAcidBasis==='g_per_100g_dry_substrate'||sample.aminoAcidBasis==='g_per_100g_crude_protein','sample AA basis');
    requireValue(sample.molecularBasis==='free_amino_acid_molar_mass'||sample.molecularBasis==='reported_AA_mass','sample molecular basis');
    requireValue(sample.proteinDenominatorUnit==='g_per_100g_dry_substrate','denominator unit');
    if(own(sample,'pdfPage'))requireValue(Number.isInteger(sample.pdfPage)&&sample.pdfPage>0,'sample PDF page');
    exactKeys(sample.aminoAcids,PROTEIN_AMINO_ACID_IDS,'all 18 amino acids');
    for(const id of PROTEIN_AMINO_ACID_IDS)measurement(sample.aminoAcids[id],'amino acid '+id,{nullable:true});
    const missing=PROTEIN_AMINO_ACID_IDS.filter(id=>sample.aminoAcids[id]===null);
    requireValue(Array.isArray(sample.missingAminoAcids)&&sample.missingAminoAcids.length===missing.length&&new Set(sample.missingAminoAcids).size===missing.length&&sample.missingAminoAcids.every(id=>missing.includes(id)),'missing amino acid identities');
    exactKeys(sample.proteinDenominators,['crude','anhydrous'],'denominators');
    measurement(sample.proteinDenominators.crude,'crude protein',{positive:true});
    measurement(sample.proteinDenominators.anhydrous,'anhydrous amino acid sum',{nullable:true,positive:true});
    measurement(sample.dryMatterPercent,'dry matter percent',{nullable:true,positive:true,max:100});
    const hasMissing=missing.length>0||sample.proteinDenominators.anhydrous===null||sample.dryMatterPercent===null;
    requireValue(hasMissing?text(sample.missingDataReason):sample.missingDataReason===null||text(sample.missingDataReason),'missing-data reason');
  }
  for(const pattern of patterns.values()){
    exactKeys(pattern,['id','label','sourceId','table','printedPage','pdfPage','unit','values'],'pattern');
    requireValue(text(pattern.label)&&text(pattern.table)&&sources.has(pattern.sourceId),'pattern source/label');
    requireValue(Number.isInteger(pattern.printedPage)&&pattern.printedPage>0&&Number.isInteger(pattern.pdfPage)&&pattern.pdfPage>0,'pattern pages');
    requireValue(pattern.unit==='mg_per_g_protein','pattern unit');exactKeys(pattern.values,PROTEIN_GROUP_IDS,'nine reference groups');
    requireValue(Object.values(pattern.values).every(value=>typeof value==='number'&&Number.isFinite(value)&&value>0),'positive reference values');
  }
  for(const item of evidence.values()){
    exactKeys(item,['id','label','sourceIds','method','observed','canConclude','cannotConclude','reportedResults'],'digestibility evidence');
    for(const field of ['label','method','observed','canConclude','cannotConclude'])requireValue(text(item[field]),'evidence '+field);
    strings(item.sourceIds,'evidence sources');requireValue(item.sourceIds.every(id=>sources.has(id)),'evidence source references');
    requireValue(Array.isArray(item.reportedResults)&&item.reportedResults.length>0,'reported results');
    const resultIds=new Set();
    for(const result of item.reportedResults){
      exactKeys(result,['sampleId','label','value','sd','unit','locator'],'reported result');
      requireValue(samples.has(result.sampleId)&&samples.get(result.sampleId).digestibilityEvidenceId===item.id,'reported result sample/evidence');
      requireValue(!resultIds.has(result.sampleId),'duplicate reported sample');resultIds.add(result.sampleId);
      requireValue(typeof result.value==='number'&&Number.isFinite(result.value)&&result.value>=0,'reported result value');
      requireValue(result.sd===null||typeof result.sd==='number'&&Number.isFinite(result.sd)&&result.sd>=0,'reported result SD');
      for(const field of ['label','unit','locator'])requireValue(text(result[field]),'reported result '+field);
    }
  }
  for(const sample of samples.values())requireValue(evidence.get(sample.digestibilityEvidenceId).sourceIds.includes(sample.sourceId),'sample evidence source identity');
  exactKeys(data.formulas,['dryBasis','crudeProteinBasis','score'],'formula descriptions');
  requireValue(Object.values(data.formulas).every(text),'formula descriptions');strings(data.notes,'notes');strings(data.limits,'limits');
  requireValue(sha256(measurementProjection(data))===MEASUREMENT_PIN,'reviewed numeric/source-cell projection changed');
  requireValue(typeof SOURCE_PIN==='string'&&sha256(sourceProjection(data))===SOURCE_PIN,'reviewed source projection changed or not sealed');
  freeze(data);validatedSnapshots.add(data);indexes.set(data,{samples,patterns,evidence,claims,sources});return data;
}

function select(data,kind,id){
  requireValue(typeof id==='string','selection must be a string');
  const item=indexes.get(data)[kind].get(id);requireValue(item!==undefined,'unknown '+kind+' ID '+id);return item;
}
export function getProteinSample(raw,id){const data=validateProteinQualityDataset(raw);return freeze(clone(select(data,'samples',id)));}
export function getProteinPattern(raw,id){const data=validateProteinQualityDataset(raw);return freeze(clone(select(data,'patterns',id)));}

/** Derive mean-only composition ratios; reported digestion endpoints never enter this arithmetic. */
export function evaluateProteinProfile(raw,selection){
  const data=validateProteinQualityDataset(raw);
  jsonOnly(selection);
  exactKeys(selection,['sampleId','patternId','basisId'],'profile selection');
  const {sampleId,patternId,basisId}=selection;
  requireValue(typeof basisId==='string'&&PROTEIN_BASIS_IDS.includes(basisId),'unknown protein basis');
  const sample=select(data,'samples',sampleId),pattern=select(data,'patterns',patternId),measure=sample.proteinDenominators[BASIS_KEYS[basisId]];
  const basisSupported=measure!==null&&(sample.aminoAcidBasis==='g_per_100g_dry_substrate'||basisId==='crude-protein');
  const denominator=basisSupported?{kind:basisId,mean:measure.mean,sd:measure.sd,unit:sample.proteinDenominatorUnit}:null;
  const rows=PROTEIN_GROUP_IDS.map(groupId=>{
    const aminoAcidIds=GROUP_COMPONENTS[groupId],missingAminoAcids=aminoAcidIds.filter(id=>sample.aminoAcids[id]===null);
    const sourceMean=missingAminoAcids.length?null:aminoAcidIds.reduce((sum,id)=>sum+sample.aminoAcids[id].mean,0);
    const mgPerGProtein=!basisSupported||sourceMean===null?null:sample.aminoAcidBasis==='g_per_100g_crude_protein'?sourceMean*10:sourceMean/measure.mean*1000;
    const referenceMgPerGProtein=pattern.values[groupId],ratio=mgPerGProtein===null?null:mgPerGProtein/referenceMgPerGProtein;
    return {groupId,aminoAcidIds:[...aminoAcidIds],sourceMean,sourceUnit:sample.aminoAcidBasis,mgPerGProtein,referenceMgPerGProtein,ratio,missingAminoAcids,
      status:!basisSupported?'unsupported-basis':missingAminoAcids.length?'missing-amino-acids':'known'};
  });
  const known=rows.filter(row=>row.ratio!==null),complete=known.length===PROTEIN_GROUP_IDS.length;
  const observedMinimumRatio=known.length?Math.min(...known.map(row=>row.ratio)):null;
  const observedMinimumGroupIds=observedMinimumRatio===null?[]:known.filter(row=>Math.abs(row.ratio-observedMinimumRatio)<=1e-12*Math.max(1,Math.abs(observedMinimumRatio))).map(row=>row.groupId);
  const minimumRatio=complete?observedMinimumRatio:null;
  const limits=[...data.limits,
    '由論文四捨五入平均值計算；沒有原始共變異資料，不推算合併 SD 或分數誤差。',
    '此為胺基酸組成比值，未乘消化率；不是 PDCAAS 或 DIAAS，也不是跨研究的整體營養優劣排名。'];
  if(!basisSupported)limits.push('此樣本未提供所選蛋白分母；保留原始組成值，標準化比值與完整最低值為 unknown。');
  else if(!complete)limits.push('九群未齊；已知列的最低值不是完整限制胺基酸，也不能代表完整組成分數。');
  return freeze({sampleId,patternId,basisId,basisSupported,denominator,rows,complete,minimumRatio,scorePercent:complete?minimumRatio*100:null,
    limitingGroupIds:complete?[...observedMinimumGroupIds]:[],observedMinimumRatio,observedMinimumGroupIds,limits});
}
