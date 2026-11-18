import {inspectElectronState} from './electron-workbench-model.js';

/** Four neutral, all-explicit-H endpoint graphs. Operations are net bookkeeping,
 * never elementary arrows, trajectories, rates, yields, or food-matrix species. */
export const NITROSATION_SCHEMA = 'nitrosation-reaction/v1';
export const NITROSATION_STATE_IDS = Object.freeze(['proline','npro','pyrrolidine','npyr']);
export const NITROSATION_OPERATIONS = Object.freeze(['nitrosate','decarboxylate']);
export const NITROSATION_TRANSITIONS = Object.freeze([
  Object.freeze({from:'proline',operation:'nitrosate',to:'npro'}),
  Object.freeze({from:'proline',operation:'decarboxylate',to:'pyrrolidine'}),
  Object.freeze({from:'npro',operation:'decarboxylate',to:'npyr'}),
  Object.freeze({from:'pyrrolidine',operation:'nitrosate',to:'npyr'}),
]);
export const NITROSATION_TOTAL_FORMULA = 'C5H10N2O4';
export const NITROSATION_FORMULA_TOTALS = Object.freeze({C:5,H:10,N:2,O:4});
export const NITROSATION_ATOM_IDS = Object.freeze([
  'C1','C2','C3','C4','C5','N1','N2','O1','O2','O3','O4',
  'H1','H2','H3','H4','H5','H6','H7','H8','H9','H10',
]);
const REQUIRED_SOURCES = [
  'nitrosation-source-ntu-115-q8','nitrosation-source-nakamura-1976',
  'nitrosation-source-gray-dugan-1975','nitrosation-source-healthcanada-nitrite',
];
const EXPECTED = Object.freeze({
  proline:{nitrosated:false,decarboxylated:false,components:['organic','hno2'],formula:'C5H9NO2',cid:145742,
    inchi:'InChI=1S/C5H9NO2/c7-5(8)4-2-1-3-6-4/h4,6H,1-3H2,(H,7,8)/t4-/m0/s1'},
  npro:{nitrosated:true,decarboxylated:false,components:['organic','water'],formula:'C5H8N2O3',cid:10419304,
    inchi:'InChI=1S/C5H8N2O3/c8-5(9)4-2-1-3-7(4)6-10/h4H,1-3H2,(H,8,9)/t4-/m0/s1'},
  pyrrolidine:{nitrosated:false,decarboxylated:true,components:['organic','co2','hno2'],formula:'C4H9N',cid:31268,
    inchi:'InChI=1S/C4H9N/c1-2-4-5-3-1/h5H,1-4H2'},
  npyr:{nitrosated:true,decarboxylated:true,components:['organic','co2','water'],formula:'C4H8N2O',cid:13591,
    inchi:'InChI=1S/C4H8N2O/c7-5-6-3-1-2-4-6/h1-4H2'},
});
const SMALL = Object.freeze({
  hno2:{formula:'HNO2',cid:24529,inchi:'InChI=1S/HNO2/c2-1-3/h(H,2,3)',ids:['N2','O3','O4','H10']},
  water:{formula:'H2O',cid:962,inchi:'InChI=1S/H2O/h1H2',ids:['O4','H1','H10']},
  co2:{formula:'CO2',cid:280,inchi:'InChI=1S/CO2/c2-1-3',ids:['C1','O1','O2']},
});
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const rank=id=>NITROSATION_ATOM_IDS.indexOf(id);
const sortedPair=(a,b)=>rank(a)<rank(b)?[a,b]:[b,a];
const key=(a,b)=>sortedPair(a,b).join('|');
const formula=counts=>['C','H','N','O'].filter(e=>counts[e]).map(e=>e+(counts[e]===1?'':counts[e])).join('');
const fail=message=>{throw new TypeError('Nitrosation dataset: '+message);};
function stateSpec(id){
  if(typeof id!=='string'||!own(EXPECTED,id))throw new RangeError('Unknown nitrosation state');
  return EXPECTED[id];
}

/** A second, independent chemical contract. It does not read the generator
 * recipe, supplied formula flags, SMILES, or alleged expected bond changes. */
function expectedEdges(stateId){
  const spec=stateSpec(stateId),edges=new Map();
  const add=(a,b,order=1)=>edges.set(key(a,b),{a:sortedPair(a,b)[0],b:sortedPair(a,b)[1],order});
  for(const [a,b] of [['N1','C2'],['C2','C3'],['C3','C4'],['C4','C5'],['C5','N1'],
    ['C2','H3'],['C3','H4'],['C3','H5'],['C4','H6'],['C4','H7'],['C5','H8'],['C5','H9']])add(a,b);
  add('C1','O1',2);
  add('C1','O2',spec.decarboxylated?2:1);
  if(spec.decarboxylated)add('C2','H2');
  else{add('C1','C2');add('O2','H2');}
  add('N2','O3',2);
  add('O4','H10');
  if(spec.nitrosated){add('N1','N2');add('O4','H1');}
  else{add('N1','H1');add('N2','O4');}
  return edges;
}
function expectedComponentIds(stateId,componentId){
  if(componentId!=='organic')return SMALL[componentId].ids;
  const exclude=new Set(stateSpec(stateId).components.filter(id=>id!=='organic').flatMap(id=>SMALL[id].ids));
  return NITROSATION_ATOM_IDS.filter(id=>!exclude.has(id));
}
function connected(atoms,bonds){
  if(atoms.length===0)return false;
  const edges=new Map(atoms.map(a=>[a.id,[]]));
  for(const b of bonds){edges.get(b.a).push(b.b);edges.get(b.b).push(b.a);}
  const seen=new Set(),stack=[atoms[0].id];
  while(stack.length){const id=stack.pop();if(seen.has(id))continue;seen.add(id);stack.push(...edges.get(id).filter(n=>!seen.has(n)));}
  return seen.size===atoms.length;
}
function stereoVolume(atoms){
  // C2 priorities: N1 > carboxyl C1 > ring C3 > H3. Positive determinant = S.
  const map=new Map(atoms.map(a=>[a.id,a.position]));
  const sub=(a,b)=>a.map((x,i)=>x-b[i]);
  const [u,v,w]=['N1','C1','C3'].map(id=>sub(map.get(id),map.get('H3')));
  return u[0]*(v[1]*w[2]-v[2]*w[1])-u[1]*(v[0]*w[2]-v[2]*w[0])+u[2]*(v[0]*w[1]-v[1]*w[0]);
}
function nitrosamineGeometry(atoms){
  const map=new Map(atoms.map(a=>[a.id,a.position]));
  const vector=id=>map.get(id).map((x,i)=>x-map.get('N1')[i]);
  const dot=(u,v)=>u.reduce((n,x,i)=>n+x*v[i],0),norm=v=>Math.hypot(...v);
  const [u,v]=['C2','C5'].map(vector),cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const size=norm(cross);
  if(size<0.05)return {maxPlaneDistance:Infinity,angles:[],angleSum:0};
  const normal=cross.map(x=>x/size);
  const angles=[['C2','C5'],['C5','N2'],['N2','C2']].map(([a,b])=>{
    const x=vector(a),y=vector(b);return Math.acos(Math.max(-1,Math.min(1,dot(x,y)/(norm(x)*norm(y)))))*180/Math.PI;
  });
  return {maxPlaneDistance:Math.max(...['N2','O3'].map(id=>Math.abs(dot(vector(id),normal)))),angles,angleSum:angles.reduce((a,b)=>a+b,0)};
}
function actualEdges(state){
  return new Map(state.components.flatMap(c=>c.bonds).map(b=>[key(b.a,b.b),{a:sortedPair(b.a,b.b)[0],b:sortedPair(b.a,b.b)[1],order:b.order}]));
}
function diffEdges(before,after){
  const keys=[...new Set([...before.keys(),...after.keys()])];
  return keys.map(k=>{
    const b=before.get(k),a=after.get(k),left=b?.order??0,right=a?.order??0;
    if(left===right)return null;
    const edge=a??b;
    return {pair:[edge.a,edge.b].sort().join('–'),a:edge.a,b:edge.b,before:left,after:right,kind:left===0?'formed':right===0?'broken':'order'};
  }).filter(Boolean).sort((a,b)=>rank(a.a)-rank(b.a)||rank(a.b)-rank(b.b));
}

/** Return the supplied data only after all four graphs pass independent checks.
 * inspectElectronState is an additional electron-accounting check, never the
 * authority for a chemically correct identity, branch, or 3D stereochemistry. */
export function validateNitrosationDataset(data){
  if(!isObject(data)||data.schema!==NITROSATION_SCHEMA||data.version!==1||data.id!=='nitrosation-pathways')fail('unsupported schema');
  if(!Array.isArray(data.states)||data.states.length!==4||new Set(data.states.map(s=>s?.id)).size!==4||data.states.some(s=>!own(EXPECTED,s?.id)))fail('four unique known states required');
  if(!isObject(data.metadata)||data.metadata.explicitHydrogens!==true||data.metadata.isTrajectory!==false||data.metadata.isElementaryMechanism!==false)fail('missing neutral endpoint scope declarations');
  if(!Array.isArray(data.limits)||data.limits.length<4||data.limits.some(v=>typeof v!=='string'||!v.trim()))fail('explicit model limits required');
  if(!Array.isArray(data.sources)||new Set(data.sources.map(s=>s?.id)).size!==data.sources.length||
    REQUIRED_SOURCES.some(id=>!data.sources.some(s=>s?.id===id))||
    data.sources.some(s=>!isObject(s)||typeof s.id!=='string'||typeof s.title!=='string'||!s.title.trim()||typeof s.url!=='string'||!/^https:\/\//.test(s.url)))fail('canonical sources required');
  if(!Array.isArray(data.geometrySources)||['nitrosation-geometry-jms-1998','nitrosation-geometry-h2nno-2017'].some(id=>!data.geometrySources.some(s=>s?.id===id&&typeof s.url==='string'&&/^https:\/\//.test(s.url)))||typeof data.metadata.nitrosamineGeometry!=='string')fail('disclosed geometry approximation and sources required');
  const actualById=new Map();
  for(const state of data.states){
    const spec=stateSpec(state.id);
    if(state.nitrosated!==spec.nitrosated||state.decarboxylated!==spec.decarboxylated||state.totalFormula!==NITROSATION_TOTAL_FORMULA||state.totalCharge!==0)fail('incorrect endpoint ledger');
    if(!isObject(state.metadata)||state.metadata.explicitHydrogens!==true||state.metadata.isTrajectory!==false||state.metadata.isElementaryMechanism!==false)fail('incorrect state scope');
    if(!Array.isArray(state.components)||state.components.length!==spec.components.length||
      new Set(state.components.map(c=>c?.id)).size!==spec.components.length||state.components.some(c=>!spec.components.includes(c?.id)))fail('incorrect connected-component ledger');
    const allAtoms=[],allBonds=[],globalIds=new Set(),globalEdges=new Map(),totals={C:0,H:0,N:0,O:0},expected=expectedEdges(state.id);
    for(const component of state.components){
      const reference=component.id==='organic'?spec:SMALL[component.id];
      if(component.formula!==reference.formula||!isObject(component.identity)||component.identity.pubchemCid!==reference.cid||
        component.identity.inchi!==reference.inchi||component.identity.url!=='https://pubchem.ncbi.nlm.nih.gov/compound/'+reference.cid)fail('component identity or formula drift');
      if(!isObject(component.metadata)||component.metadata.explicitHydrogens!==true||component.metadata.isTrajectory!==false)fail('component hydrogen or geometry scope');
      if(!Array.isArray(component.atoms)||!Array.isArray(component.bonds))fail('component graph required');
      const expectedIds=expectedComponentIds(state.id,component.id),ids=new Set(),local=new Map(),counts={C:0,H:0,N:0,O:0},sums=new Map();
      if(component.atoms.length!==expectedIds.length)fail('incorrect explicit atom count');
      for(const atom of component.atoms){
        if(!isObject(atom)||typeof atom.id!=='string'||!expectedIds.includes(atom.id)||globalIds.has(atom.id)||
          atom.element!==atom.id[0]||atom.formalCharge!==0||atom.charge!==0||
          !Array.isArray(atom.position)||atom.position.length!==3||!atom.position.every(v=>typeof v==='number'&&Number.isFinite(v)))fail('invalid explicit atom, element, charge or position');
        ids.add(atom.id);globalIds.add(atom.id);local.set(atom.id,atom);sums.set(atom.id,0);counts[atom.element]++;totals[atom.element]++;
      }
      if(expectedIds.some(id=>!ids.has(id)))fail('atom inventory mismatch');
      for(const bond of component.bonds){
        if(!isObject(bond)||!ids.has(bond.a)||!ids.has(bond.b)||bond.a===bond.b||![1,2].includes(bond.order))fail('invalid bond endpoints or order');
        const k=key(bond.a,bond.b),match=expected.get(k);
        if(globalEdges.has(k)||!match||match.order!==bond.order)fail('graph does not match the independent mapped identity');
        globalEdges.set(k,{a:match.a,b:match.b,order:bond.order});
        sums.set(bond.a,sums.get(bond.a)+bond.order);sums.set(bond.b,sums.get(bond.b)+bond.order);
        const a=local.get(bond.a),b=local.get(bond.b),length=Math.hypot(...a.position.map((x,i)=>x-b.position[i]));
        const h=a.element==='H'||b.element==='H';
        if(length<(h?0.65:0.9)||length>(h?1.35:1.9))fail('bond geometry is not a finite representative molecular geometry');
      }
      if(formula(counts)!==reference.formula||!connected(component.atoms,component.bonds))fail('component formula or connectivity mismatch');
      for(const atom of component.atoms){
        const valence={C:4,H:1,N:3,O:2}[atom.element];
        if(sums.get(atom.id)!==valence)fail('neutral explicit valence mismatch');
        const electrons={C:4,H:1,N:5,O:6}[atom.element]-valence;
        if(atom.nonbondingElectrons!==electrons)fail('electron declaration inconsistent with graph');
        if(atom.id==='C2'&&component.id==='organic'&&!spec.decarboxylated){
          if(atom.cip!=='S')fail('L-Proline / L-NPRO C2 must be S');
        }else if(own(atom,'cip'))fail('unexpected fixed stereocentre after endpoint change');
      }
      if(component.id==='organic'&&!spec.decarboxylated&&!(stereoVolume(component.atoms)>0.05))fail('3D C2 geometry is not S or is degenerate');
      if(component.id==='organic'&&spec.nitrosated){
        const approximation=component.metadata.nitrosaminePlanarity,g=nitrosamineGeometry(component.atoms);
        if(!isObject(approximation)||approximation.enforced!==true||approximation.isMeasuredGeometry!==false||
          !(g.angleSum>=359.5)||!(g.maxPlaneDistance<=0.035)||g.angles.some(angle=>angle<=95||angle>=145)||
          !Number.isFinite(approximation.N1AngleSumDegrees)||Math.abs(g.angleSum-approximation.N1AngleSumDegrees)>.01||
          !Number.isFinite(approximation.maxCorePlaneDistanceAngstrom)||Math.abs(g.maxPlaneDistance-approximation.maxCorePlaneDistanceAngstrom)>.001)fail('nitrosamine core must match the disclosed approximate planarity model');
      }
      allAtoms.push(...component.atoms);allBonds.push(...component.bonds);
    }
    if(globalIds.size!==21||NITROSATION_ATOM_IDS.some(id=>!globalIds.has(id))||globalEdges.size!==expected.size||
      [...expected].some(([k,b])=>globalEdges.get(k)?.order!==b.order))fail('complete 21-atom graph required');
    if(!isObject(state.formulaTotals)||Object.keys(state.formulaTotals).length!==4||
      Object.entries(NITROSATION_FORMULA_TOTALS).some(([e,n])=>totals[e]!==n||state.formulaTotals[e]!==n))fail('element inventory is not conserved');
    const electronCheck=inspectElectronState({atoms:allAtoms,bonds:allBonds});
    if(!electronCheck.ok||electronCheck.totalCharge!==0||electronCheck.totalValenceElectrons!==64)fail('secondary electron-accounting check failed');
    actualById.set(state.id,globalEdges);
  }
  if(!Array.isArray(data.transitions)||data.transitions.length!==4||new Set(data.transitions.map(t=>t?.from+'|'+t?.operation)).size!==4||
    NITROSATION_TRANSITIONS.some(t=>!data.transitions.some(v=>v?.from===t.from&&v?.operation===t.operation&&v?.to===t.to)))fail('both complete branches required');
  // Independently check the mapped net edits on each of the four branch edges.
  for(const t of NITROSATION_TRANSITIONS){
    const actual=diffEdges(actualById.get(t.from),actualById.get(t.to));
    const expected=t.operation==='nitrosate'?
      [{a:'N1',b:'N2',before:0,after:1},{a:'N1',b:'H1',before:1,after:0},{a:'N2',b:'O4',before:1,after:0},{a:'O4',b:'H1',before:0,after:1}]:
      [{a:'C1',b:'C2',before:1,after:0},{a:'C1',b:'O2',before:1,after:2},{a:'C2',b:'H2',before:0,after:1},{a:'O2',b:'H2',before:1,after:0}];
    if(actual.length!==expected.length||expected.some(e=>!actual.some(a=>a.a===e.a&&a.b===e.b&&a.before===e.before&&a.after===e.after)))fail('branch net bond changes do not match the accounting contract');
  }
  return data;
}

/** Valid states with unavailable/repeated operations throw rather than silently
 * advancing, resetting, or treating the final state as another reaction. */
export function stepNitrosationState(stateId,operation){
  stateSpec(stateId);
  if(!NITROSATION_OPERATIONS.includes(operation))throw new RangeError('Unknown nitrosation operation');
  const step=NITROSATION_TRANSITIONS.find(t=>t.from===stateId&&t.operation===operation);
  if(!step)throw new RangeError('Operation is unavailable or already completed for this state');
  return step.to;
}

export function describeNitrosationState(data,stateId){
  validateNitrosationDataset(data);
  const spec=stateSpec(stateId),state=data.states.find(s=>s.id===stateId),organic=state.components.find(c=>c.id==='organic');
  return {
    id:state.id,name:state.name,organicName:organic.name,organicFormula:organic.formula,
    components:state.components.map(c=>({id:c.id,name:c.name,formula:c.formula,pubchemCid:c.identity.pubchemCid})),
    componentIds:state.components.map(c=>c.id),
    availableOperations:NITROSATION_TRANSITIONS.filter(t=>t.from===stateId).map(t=>t.operation),
    completedOperations:[...(spec.nitrosated?['nitrosate']:[]),...(spec.decarboxylated?['decarboxylate']:[])],
    nitrosated:spec.nitrosated,decarboxylated:spec.decarboxylated,
    formulaTotals:{...NITROSATION_FORMULA_TOTALS},totalFormula:NITROSATION_TOTAL_FORMULA,totalCharge:0,
    equation:state.components.map(c=>c.formula).join(' + '),
    c2Stereochemistry:spec.decarboxylated?'C2 is CH2; no stereocentre':'S',
    interpretation:'neutral net endpoint; formal atom bookkeeping; not an elementary step or reaction trajectory',
  };
}

/** Compare any two admitted endpoints, including reverse or same-state views.
 * A listed change describes graph differences; it does not grant a new route. */
export function nitrosationBondChanges(data,before,after){
  validateNitrosationDataset(data);stateSpec(before);stateSpec(after);
  return diffEdges(actualEdges(data.states.find(s=>s.id===before)),actualEdges(data.states.find(s=>s.id===after)));
}
