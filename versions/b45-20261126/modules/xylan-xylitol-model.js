/** Finite, explicit-atom net endpoint contract. No reaction dynamics. */
export const XYLAN_XYLITOL_LAB_ID='xylan-xylitol-evidence';
export const XYLAN_SCHEMA='xylan-xylitol-models/v1';
export const XYLAN_STATE_IDS=Object.freeze(['xylan-water','xylose-rings','xylose-open','xylose-hydrogen','xylitol-product']);
export const XYLAN_TRANSFORMATIONS=Object.freeze([
  Object.freeze({id:'hydrolysis',before:'xylan-water',after:'xylose-rings',defaultBeforeComponent:'xylotriose',defaultAfterComponent:'unit-B'}),
  Object.freeze({id:'ring-opening',before:'xylose-rings',after:'xylose-open',defaultBeforeComponent:'unit-B',defaultAfterComponent:'unit-B'}),
  Object.freeze({id:'reduction',before:'xylose-hydrogen',after:'xylitol-product',defaultBeforeComponent:'unit-B',defaultAfterComponent:'unit-B'}),
]);
const LOCAL_IDS=Object.freeze(['C1','C2','C3','C4','C5','O1','O2','O3','O4','O5','HC1','HC2','HC3','HC4','HC5a','HC5b','HO2','HO3','HO4','HO5']);
const BASE_IDS=Object.freeze(['A','B','C'].flatMap(unit=>LOCAL_IDS.map(id=>unit+'_'+id)));
const EXTRA_IDS=Object.freeze(['B_HredC','B_HredO']);
export const XYLAN_ATOM_IDS=Object.freeze([...BASE_IDS,...EXTRA_IDS]);
const STATE_COMPONENTS={
  'xylan-water':['xylotriose','water-AB','water-BC'],
  'xylose-rings':['unit-A','unit-B','unit-C'],
  'xylose-open':['unit-A','unit-B','unit-C'],
  'xylose-hydrogen':['unit-A','unit-B','unit-C','hydrogen'],
  'xylitol-product':['unit-A','unit-B','unit-C'],
};
const SOURCE_URLS={
  'xylitol-source-ntu115-q2':'https://exam.lib.ntu.edu.tw/sites/default/files/exam//graduate/115/115-239.pdf',
  'xylitol-source-xylan2016':'https://doi.org/10.1038/ncomms13902',
  'xylitol-source-hydrogenation2019':'https://doi.org/10.34133/2019/5178573',
  'xylitol-source-chebi':'https://www.ebi.ac.uk/chebi/CHEBI:17151',
  'xylitol-source-sweetness2018':'https://doi.org/10.3390/nu10111632',
  'xylitol-source-properties':'https://doi.org/10.1107/S2056989022007617',
};
const REFERENCE={
  ring:{formula:'C5H10O5',kind:'source-identified-small-molecule',chebiId:'CHEBI:28161',
    inchi:'InChI=1S/C5H10O5/c6-2-1-10-5(9)4(8)3(2)7/h2-9H,1H2/t2-,3+,4-,5-/m1/s1',inchiKey:'SRBFZHDQGSBBOR-KKQCNMDGSA-N',
    smiles:'O[C@@H]1[C@@H](O)[C@H](O)OC[C@H]1O'},
  open:{formula:'C5H10O5',kind:'source-identified-small-molecule',chebiId:'CHEBI:15936',
    inchi:'InChI=1S/C5H10O5/c6-1-3(8)5(10)4(9)2-7/h1,3-5,7-10H,2H2/t3-,4+,5+/m0/s1',inchiKey:'PYMYPHUHKUWMLA-VPENINKCSA-N',
    smiles:'O=C[C@H](O)[C@@H](O)[C@H](O)CO'},
  xylitol:{formula:'C5H12O5',kind:'source-identified-small-molecule',chebiId:'CHEBI:17151',
    inchi:'InChI=1S/C5H12O5/c6-1-3(8)5(10)4(9)2-7/h3-10H,1-2H2/t3-,4+,5+',inchiKey:'HEBKCHPVOIAQTA-SCDXWVJYSA-N',
    smiles:'OC[C@@H](O)[C@H](O)[C@@H](O)CO'},
  water:{formula:'H2O',kind:'stoichiometric-small-molecule',inchi:'InChI=1S/H2O/h1H2',inchiKey:'XLYOFNOQVPJJNP-UHFFFAOYSA-N'},
  hydrogen:{formula:'H2',kind:'stoichiometric-small-molecule',inchi:'InChI=1S/H2/h1H',inchiKey:'UFHFLCQGNIYNRP-UHFFFAOYSA-N'},
  trimer:{formula:'C15H26O13',kind:'constructed-finite-oligomer',
    inchi:'InChI=1S/C15H26O13/c16-4-1-25-14(11(21)7(4)17)28-6-3-26-15(12(22)9(6)19)27-5-2-24-13(23)10(20)8(5)18/h4-23H,1-3H2/t4-,5-,6-,7+,8+,9+,10-,11-,12-,13-,14+,15+/m1/s1'},
};
const WATER_AB=['A_O1','A_HO5','B_HO4'],WATER_BC=['B_O1','B_HO5','C_HO4'];
const TRIMER_IDS=BASE_IDS.filter(id=>![...WATER_AB,...WATER_BC].includes(id));
const clone=value=>structuredClone(value);
const obj=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const fail=message=>{throw new TypeError('Invalid xylan dataset: '+message);};
const pair=(a,b)=>[a,b].sort().join('|');
const element=id=>id.split('_')[1][0];
const countsFor=atoms=>atoms.reduce((n,a)=>{n[a.element]=(n[a.element]||0)+1;return n;},{C:0,H:0,O:0});
const formula=counts=>['C','H','O'].filter(e=>counts[e]).map(e=>e+(counts[e]===1?'':counts[e])).join('');
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const sameSet=(a,b)=>Array.isArray(a)&&a.length===b.length&&new Set(a).size===a.length&&b.every(id=>a.includes(id));
const stateSpec=id=>{if(!XYLAN_STATE_IDS.includes(id))throw new RangeError('Unknown xylan state');return id;};
const transformationSpec=id=>{const result=XYLAN_TRANSFORMATIONS.find(t=>t.id===id);if(!result)throw new RangeError('Unknown xylan transformation');return result;};
const vec=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const determinant=(p,n)=>{const [a,b,c,d]=n.map(id=>p.get(id));return dot(vec(a,d),cross(vec(b,d),vec(c,d)));};

/** Independent graph construction: fixed chemistry, not dataset-provided edges. */
function expectedEdges(stateId){
  const edges=new Map(),put=(a,b,n=1)=>edges.set(pair(a,b),{a,b,order:n}),drop=(a,b)=>{if(!edges.delete(pair(a,b)))fail('internal edge contract');};
  for(const u of ['A','B','C']){
    const id=n=>u+'_'+n,opened=u==='B'&&['xylose-open','xylose-hydrogen','xylitol-product'].includes(stateId),reduced=u==='B'&&stateId==='xylitol-product';
    for(let n=1;n<5;n++)put(id('C'+n),id('C'+(n+1)));
    for(let n=1;n<=5;n++)put(id('C'+n),id('O'+n),n===1&&opened&&!reduced?2:1);
    for(let n=1;n<=4;n++)put(id('C'+n),id('HC'+n));
    for(const h of ['HC5a','HC5b'])put(id('C5'),id(h));
    for(let n=2;n<=4;n++)put(id('O'+n),id('HO'+n));
    put(id(opened?'O5':'O1'),id('HO5'));
    if(!opened)put(id('C1'),id('O5'));
    if(reduced){put('B_C1','B_HredC');put('B_O1','B_HredO');}
  }
  if(stateId==='xylan-water')for(const [donor,receiver] of [['A','B'],['B','C']]){
    drop(donor+'_C1',donor+'_O1');drop(receiver+'_O4',receiver+'_HO4');
    put(donor+'_C1',receiver+'_O4');put(donor+'_O1',receiver+'_HO4');
  }
  if(stateId==='xylose-hydrogen')put('B_HredC','B_HredO');
  return edges;
}
function componentSpec(stateId,componentId){
  if(!STATE_COMPONENTS[stateId]?.includes(componentId))throw new RangeError('Unknown xylan component for state');
  if(componentId==='xylotriose')return {ids:TRIMER_IDS,kind:'trimer',diagram:'xylotriose'};
  if(componentId==='water-AB')return {ids:WATER_AB,kind:'water'};
  if(componentId==='water-BC')return {ids:WATER_BC,kind:'water'};
  if(componentId==='hydrogen')return {ids:EXTRA_IDS,kind:'hydrogen'};
  const unit=componentId.slice(-1),opened=unit==='B'&&['xylose-open','xylose-hydrogen','xylitol-product'].includes(stateId),reduced=unit==='B'&&stateId==='xylitol-product';
  return {ids:[...LOCAL_IDS.map(id=>unit+'_'+id),...(reduced?EXTRA_IDS:[])],kind:reduced?'xylitol':opened?'open':'ring',diagram:unit+(reduced?'-xylitol':opened?'-open':'-ring')};
}
function expectedCip(stateId,id){
  const [u,local]=id.split('_');
  if(stateId==='xylan-water'){
    if(local==='C1')return u==='C'?'R':'S';
    if(local==='C2'||local==='C4')return 'R';
    if(local==='C3')return u==='A'?'S':'R';
    return undefined;
  }
  if(u==='B'&&stateId==='xylitol-product')return {C2:'S',C3:'r',C4:'R'}[local];
  if(local==='C1')return u==='B'&&['xylose-open','xylose-hydrogen'].includes(stateId)?undefined:'R';
  return {C2:'R',C3:'S',C4:'R'}[local];
}
function connected(ids,adjacency){
  const pending=[ids[0]],seen=new Set();
  while(pending.length){const id=pending.pop();if(seen.has(id))continue;seen.add(id);pending.push(...adjacency.get(id));}
  return seen.size===ids.length;
}
function checkGeometry(component,stateId,spec,edges){
  const p=new Map(component.atoms.map(a=>[a.id,a.position])),adjacency=new Map(spec.ids.map(id=>[id,new Set()]));
  for(const b of edges.values()){
    const distance=Math.hypot(...vec(p.get(b.a),p.get(b.b))),hydrogen=element(b.a)==='H'||element(b.b)==='H';
    const [min,max]=spec.kind==='hydrogen'?[.6,.9]:hydrogen?[.65,1.35]:[.9,1.95];
    if(!(distance>min&&distance<max))fail('bond length outside representative geometry limits');
    adjacency.get(b.a).add(b.b);adjacency.get(b.b).add(b.a);
  }
  if(!connected(spec.ids,adjacency))fail('disconnected molecular component');
  for(let i=0;i<spec.ids.length;i++)for(let j=i+1;j<spec.ids.length;j++){
    const a=spec.ids[i],b=spec.ids[j];
    if(adjacency.get(a).has(b)||[...adjacency.get(a)].some(n=>adjacency.get(n).has(b)))continue;
    const floor=element(a)==='H'&&element(b)==='H'?.7:element(a)==='H'||element(b)==='H'?.85:1.05;
    if(Math.hypot(...vec(p.get(a),p.get(b)))<floor)fail('severe nonlocal geometry clash');
  }
  for(const u of ['A','B','C']){
    for(const n of [2,3,4]){
      const neighbors=[`${u}_O${n}`,`${u}_C${n-1}`,`${u}_C${n+1}`,`${u}_HC${n}`];
      if(!neighbors.every(id=>p.has(id)))continue;
      if(determinant(p,neighbors)*({2:-1,3:1,4:-1}[n])<=.5)fail('mapped C2/C3/C4 orientation changed or degenerate');
    }
    if(!p.has(u+'_C1')||!edges.has(pair(u+'_C1',u+'_O5')))continue;
    const exocyclic=stateId==='xylan-water'&&u!=='C'?(u==='A'?'B':'C')+'_O4':u+'_O1';
    if(determinant(p,[u+'_O5',u+'_C2',exocyclic,u+'_HC1'])<=.5)fail('selected beta C1 orientation changed or degenerate');
  }
  if(spec.kind==='open'){
    const c=p.get('B_C1'),normal=cross(vec(p.get('B_O1'),c),vec(p.get('B_C2'),c)),size=Math.hypot(...normal);
    if(size<.1||Math.abs(dot(vec(p.get('B_HC1'),c),normal))/size>.08)fail('aldehyde carbonyl geometry is not near planar');
  }
}
function checkComponent(component,stateId,spec,allExpected){
  if(!obj(component)||typeof component.name!=='string'||!component.name||!Array.isArray(component.atoms)||!Array.isArray(component.bonds))fail('component graph required');
  if(!sameSet(component.atoms.map(a=>a?.id),spec.ids))fail('complete component atom inventory required');
  const edges=new Map(),sums=new Map(spec.ids.map(id=>[id,0])),expected=new Map([...allExpected].filter(([,b])=>spec.ids.includes(b.a)&&spec.ids.includes(b.b)));
  for(const a of component.atoms){
    if(!obj(a)||a.element!==element(a.id)||a.formalCharge!==0||a.charge!==0)fail('mapped atom element or neutral charge changed');
    if(!Array.isArray(a.position)||a.position.length!==3||!a.position.every(v=>typeof v==='number'&&Number.isFinite(v)))fail('finite numeric 3D coordinates required');
    for(const key of ['implicitH','implicitHs','implicitHydrogens','numImplicitHs','hydrogenCount','explicitHs','numExplicitHs','radicalElectrons'])if(own(a,key)&&a[key]!==0)fail('hidden hydrogen or radical declaration');
    const cip=expectedCip(stateId,a.id);
    if(cip===undefined?own(a,'cip'):a.cip!==cip)fail('accurate CIP label inconsistent with the mapped named endpoint');
  }
  for(const b of component.bonds){
    if(!obj(b)||!spec.ids.includes(b.a)||!spec.ids.includes(b.b)||b.a===b.b||![1,2].includes(b.order))fail('invalid explicit bond');
    const key=pair(b.a,b.b);
    if(edges.has(key)||expected.get(key)?.order!==b.order)fail('bond graph differs from independent chemical contract');
    edges.set(key,b);sums.set(b.a,sums.get(b.a)+b.order);sums.set(b.b,sums.get(b.b)+b.order);
  }
  if(edges.size!==expected.size||[...expected].some(([key,b])=>edges.get(key)?.order!==b.order))fail('missing required explicit bond');
  for(const a of component.atoms)if(sums.get(a.id)!=={C:4,H:1,O:2}[a.element])fail('wrong explicit neutral valence');
  const reference=REFERENCE[spec.kind],identity=component.identity;
  if(component.formula!==reference.formula||formula(countsFor(component.atoms))!==reference.formula)fail('molecular formula mismatch');
  if(!obj(identity)||Object.entries(reference).some(([key,value])=>identity[key]!==value))fail('chemical reference identity drift');
  if(!Array.isArray(identity.sourceIds)||!identity.sourceIds.length||new Set(identity.sourceIds).size!==identity.sourceIds.length||identity.sourceIds.some(id=>!own(SOURCE_URLS,id)))fail('identity source IDs required');
  if(spec.kind==='trimer'){
    if(identity.linkage!=='beta-D-Xylp-(1→4)-beta-D-Xylp-(1→4)-beta-D-Xylp'||typeof identity.scope!=='string'||!identity.scope.includes('finite')||!identity.reducingEndAnomer?.includes('beta'))fail('finite trimer and reducing-end scope required');
    if(own(identity,'chebiId')||own(identity,'pubchemCid'))fail('derived oligomer cannot claim a source-identified experimental structure');
  }else if(['ring','open','xylitol'].includes(spec.kind)){
    if(identity.url!=='https://www.ebi.ac.uk/chebi/'+reference.chebiId||!sameSet(identity.sourceIds,['xylitol-source-chebi']))fail('named small-molecule reference source required');
  }
  const metadata=component.metadata;
  if(!obj(metadata)||metadata.explicitHydrogens!==true||metadata.isTrajectory!==false||metadata.isExperimentalGeometry!==false||metadata.coordinateUnit!=='angstrom'||metadata.cipMethod!=='rdCIPLabeler.AssignCIPLabels'||typeof metadata.geometryMethod!=='string'||metadata.geometryMethod.length<20)fail('computed/schematic geometry disclosure required');
  if(spec.kind!=='hydrogen'&&(metadata.embedding!=='ETKDGv3'||metadata.forceField!=='MMFF94'||!Number.isInteger(metadata.candidateCount)||metadata.candidateCount<1||!Number.isInteger(metadata.convergedConformerCount)||metadata.convergedConformerCount<1||metadata.convergedConformerCount>metadata.candidateCount))fail('finite converged geometry protocol required');
  if(!Array.isArray(component.rotatableBonds)||component.rotatableBonds.length)fail('no independent torsion-energy model is supplied');
  checkGeometry(component,stateId,spec,edges);
  if(spec.diagram){
    const d=component.diagram;
    if(!obj(d)||d.file!==`xylan-xylitol-diagrams/${spec.diagram}.svg`||!Number.isInteger(d.width)||d.width<640||!Number.isInteger(d.height)||d.height<350||!/^[a-f0-9]{64}$/.test(d.sha256)||!/^[a-f0-9]{64}$/.test(d.graphSha256))fail('same-graph diagram provenance required');
    if(!sameSet(d.atomIds,spec.ids)||d.explicitHydrogenCount!==component.atoms.filter(a=>a.element==='H').length||d.inchi!==identity.inchi||!equal(d.sourceIds,identity.sourceIds)||d.kind!=='RDKit same-graph 2D structural formula with stereo')fail('diagram atom graph or reference mismatch');
  }else if(own(component,'diagram'))fail('unsupported small-molecule diagram');
  return edges;
}
function actualEdges(state){
  return new Map(state.components.flatMap(c=>c.bonds).map(b=>[pair(b.a,b.b),b]));
}
function diffEdges(before,after){
  return [...new Set([...before.keys(),...after.keys()])].sort().flatMap(key=>{
    const left=before.get(key)?.order??0,right=after.get(key)?.order??0;
    if(left===right)return [];
    const [a,b]=key.split('|');return [{a,b,before:left,after:right,pair:[a,b].join('–'),kind:left===0?'formed':right===0?'broken':'order'}];
  });
}

/** Narrow scientific admission. Metadata claims never substitute for graph/3D checks. */
export function validateXylanDataset(data){
  if(!obj(data)||data.schema!==XYLAN_SCHEMA||data.version!==1||data.id!==XYLAN_XYLITOL_LAB_ID)fail('unsupported schema');
  if(!Array.isArray(data.states)||!sameSet(data.states.map(s=>s?.id),XYLAN_STATE_IDS))fail('five exact endpoint states required');
  const metadata=data.metadata;
  if(!obj(metadata)||metadata.explicitHydrogens!==true||metadata.isTrajectory!==false||metadata.isExperimentalGeometry!==false||metadata.coordinateUnit!=='angstrom'||metadata.atomMapping!=='formal net bookkeeping; not isotope tracing'||metadata.cipMethod!=='rdCIPLabeler.AssignCIPLabels'||metadata.betaMappedNeighborSign!==1)fail('explicit modeling boundary required');
  if(metadata.identityPacketSha256!=='dc6aa097880ff5b1f1c6c1d9c5065e9bcb32eaea238c5b36a15aa0afefdb4af7'||metadata.sourceProjectionSha256!=='1ebd1bdac0b5d8e0ba57416abce45bae042c016dcb3487569d1d4825c0fa6e33'||metadata.existingXyloseLibrarySha256!=='41421b5c9c08b2cb4dff1ca710fb14b288eec207d4cb0cf82efc1ce1dbd5c874')fail('reviewed provenance pins changed');
  if(!Array.isArray(data.sources)||!sameSet(data.sources.map(s=>s?.id),Object.keys(SOURCE_URLS))||data.sources.some(s=>s.url!==SOURCE_URLS[s.id]||typeof s.title!=='string'||!s.title))fail('frozen scientific source IDs and URLs required');
  if(!obj(data.atomRoles)||!sameSet(Object.keys(data.atomRoles),XYLAN_ATOM_IDS)||Object.values(data.atomRoles).some(v=>typeof v!=='string'||!v))fail('all stable atom roles required');
  if(!Array.isArray(data.limits)||data.limits.length<6||data.limits.some(v=>typeof v!=='string'||!v))fail('scientific scope limits required');
  for(const state of data.states){
    const stateId=state.id,withHydrogen=['xylose-hydrogen','xylitol-product'].includes(stateId),wantedIds=withHydrogen?XYLAN_ATOM_IDS:BASE_IDS;
    if(!obj(state)||typeof state.name!=='string'||!state.name||!Array.isArray(state.components)||!sameSet(state.components.map(c=>c?.id),STATE_COMPONENTS[stateId]))fail('exact complete component set required');
    const atoms=state.components.flatMap(c=>c.atoms||[]);
    if(!sameSet(atoms.map(a=>a?.id),wantedIds))fail('state atom inventory is not conserved');
    const totals={C:15,H:withHydrogen?32:30,O:15};
    if(state.atomCount!==wantedIds.length||state.totalCharge!==0||state.totalFormula!==formula(totals)||!obj(state.formulaTotals)||Object.keys(state.formulaTotals).length!==3||Object.entries(totals).some(([e,n])=>state.formulaTotals[e]!==n))fail('state element totals or neutral charge mismatch');
    const expected=expectedEdges(stateId);
    for(const component of state.components)checkComponent(component,stateId,componentSpec(stateId,component.id),expected);
    const edges=actualEdges(state);
    if(edges.size!==expected.size||[...expected].some(([key,b])=>edges.get(key)?.order!==b.order))fail('full state graph mismatch');
  }
  const baseline=data.states.find(s=>s.id==='xylose-rings');
  for(const id of ['xylose-open','xylose-hydrogen','xylitol-product'])for(const componentId of ['unit-A','unit-C']){
    if(!equal(data.states.find(s=>s.id===id).components.find(c=>c.id===componentId),baseline.components.find(c=>c.id===componentId)))fail('spectator A/C components must remain exactly unchanged');
  }
  if(!Array.isArray(data.transformations)||!sameSet(data.transformations.map(t=>t?.id),XYLAN_TRANSFORMATIONS.map(t=>t.id)))fail('three exact net transformations required');
  for(const transform of data.transformations){
    const spec=transformationSpec(transform.id);
    if(Object.entries(spec).some(([key,value])=>transform[key]!==value))fail('transformation endpoint or component contract changed');
    for(const key of ['title','equation','description','scope'])if(typeof transform[key]!=='string'||!transform[key])fail('transformation explanation required');
    if(!Array.isArray(transform.sourceIds)||!transform.sourceIds.length||transform.sourceIds.some(id=>!own(SOURCE_URLS,id)))fail('transformation sources required');
    if(!Array.isArray(transform.focusAtomIds)||!transform.focusAtomIds.length||transform.focusAtomIds.some(id=>!XYLAN_ATOM_IDS.includes(id)))fail('reaction center identity required');
    if(transform.id==='ring-opening'&&(!transform.description.includes('只展開中間 B')||!transform.description.includes('A、C')))fail('single B ring-opening scope required');
    if(transform.id==='reduction'&&(transform.equation!=='B：C5H10O5 + H2 → C5H12O5'||!transform.description.includes('只還原中間 B')||!transform.description.includes('A、C')))fail('single B reduction scope required');
    const before=data.states.find(s=>s.id===spec.before),after=data.states.find(s=>s.id===spec.after);
    const signature=s=>s.components.flatMap(c=>c.atoms).map(a=>[a.id,a.element,a.formalCharge]).sort();
    if(!equal(signature(before),signature(after)))fail('transformation atom identity changed');
    if(!equal(diffEdges(actualEdges(before),actualEdges(after)),diffEdges(expectedEdges(spec.before),expectedEdges(spec.after))))fail('net bond change contract differs');
  }
  return data;
}

function stateSummary(state){
  return {id:state.id,name:state.name,components:state.components.map(c=>({id:c.id,name:c.name,formula:c.formula,atomCount:c.atoms.length,identity:clone(c.identity)})),
    componentIds:state.components.map(c=>c.id),totalFormula:state.totalFormula,formulaTotals:{...state.formulaTotals},atomCount:state.atomCount,totalCharge:state.totalCharge,
    interpretation:'complete finite neutral net endpoint; computed/schematic geometry and formal atom accounting, not an elementary mechanism'};
}
export function describeXylanState(data,stateId){
  stateSpec(stateId);validateXylanDataset(data);return stateSummary(data.states.find(s=>s.id===stateId));
}
export function describeXylanTransformation(data,id){
  const spec=transformationSpec(id);validateXylanDataset(data);
  return {...clone(data.transformations.find(t=>t.id===id)),beforeState:stateSummary(data.states.find(s=>s.id===spec.before)),afterState:stateSummary(data.states.find(s=>s.id===spec.after))};
}
export function xylanComponent(data,stateId,componentId){
  stateSpec(stateId);componentSpec(stateId,componentId);validateXylanDataset(data);
  return clone(data.states.find(s=>s.id===stateId).components.find(c=>c.id===componentId));
}
export function xylanBondChanges(data,id){
  const spec=transformationSpec(id);validateXylanDataset(data);
  return diffEdges(actualEdges(data.states.find(s=>s.id===spec.before)),actualEdges(data.states.find(s=>s.id===spec.after)));
}
export function xylanAtomRole(atomId){
  if(!XYLAN_ATOM_IDS.includes(atomId))throw new RangeError('Unknown xylan atom ID');
  const [unit,id]=atomId.split('_'),roles={C1:'異頭碳；本模型只有 B 開鏈時為醛基碳，還原後為末端 CH2OH 碳；A、C 保持環形',C2:'保留固定鄰居相對配置的 C2',C3:'保留固定鄰居相對配置的 C3；本模型只有 B 還原為木糖醇後以偽不對稱小寫 r 命名；A、C 保持環形',C4:'保留固定鄰居相對配置的 C4',C5:'五碳骨架末端 C5；吡喃環內為 CH2',O1:'C1 所連的羥基氧',O2:'C2 羥基氧',O3:'C3 羥基氧',O4:'C4 所連的氧；糖苷鍵內為橋氧，水解後為羥基氧',O5:'C5 的氧；環形時為環內氧；本模型只有 B 開鏈時為 C5 羥基氧',HO5:'原開鏈 O5 的形式追蹤氫；環形時配在 O1，非同位素去向',HO4:'O4 的形式配平氫；在水解前可能屬形式水分子，非同位素去向',HredC:'H2 的一個形式配對氫；還原後接 B_C1，非實驗原子追蹤',HredO:'H2 的一個形式配對氫；還原後接 B_O1，非實驗原子追蹤'};
  let text=roles[id]??'明示氫 '+id+'；固定 ID 用於形式原子帳';
  if(id==='O1'&&['A','B'].includes(unit))text='形式水的氧；水解後接 C1'+(unit==='B'?'，B 開鏈時為羰基氧':'；A 保持環形');
  if(id==='O4'&&unit==='A')text='C4 所連的羥基氧；A 不在糖苷橋氧位置';
  return unit+' 單元｜'+text;
}
