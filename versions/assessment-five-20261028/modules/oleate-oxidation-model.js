import {inspectElectronState,evaluateElectronArrows} from './electron-workbench-model.js';

/** A finite oleic-acid net ledger plus four allyl Lewis contributors.
 * Closed-shell checks are NOT oxygen-spin or reaction-mechanism validation. */
export const OLEATE_SCHEMA='oleate-oxidation/v1';
export const OLEATE_STATE_IDS=Object.freeze(['reactants','ene9','ene10']);
export const OLEATE_FAMILY_IDS=Object.freeze(['c8','c11']);
export const OLEATE_TOTALS=Object.freeze({C:18,H:34,O:4});
const owns=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const pair=(a,b)=>[a,b].sort().join('|');
const fail=message=>{throw new TypeError('Oleate dataset: '+message);};
const clone=v=>JSON.parse(JSON.stringify(v));
const hydrogenRows=[];
for(let c=2;c<=18;c++){
  const count=c===18?3:c===9||c===10?1:2;
  for(let i=0;i<count;i++)hydrogenRows.push({id:`H${c}${count===1?'':String.fromCharCode(97+i)}`,carbon:`C${c}`});
}
hydrogenRows.push({id:'Hoh',carbon:'O2'});
const ACID_IDS=Object.freeze([...Array.from({length:18},(_,i)=>`C${i+1}`),'O1','O2',...hydrogenRows.map(h=>h.id)]);
export const OLEATE_ATOM_IDS=Object.freeze([...ACID_IDS,'O3','O4']);
const SPECS=Object.freeze({
  reactants:{name:'油酸＋已提供的單態氧',organicFormula:'C18H34O2',doubleBondStart:9,geometry:'Z',oohCarbon:null,donorCarbon:null,transferredHydrogenId:null,
    inchi:'InChI=1S/C18H34O2/c1-2-3-4-5-6-7-8-9-10-11-12-13-14-15-16-17-18(19)20/h9-10H,2-8,11-17H2,1H3,(H,19,20)/b10-9-'},
  ene9:{name:'9-OOH · Δ10E',organicFormula:'C18H34O4',doubleBondStart:10,geometry:'E',oohCarbon:9,donorCarbon:11,transferredHydrogenId:'H11a',
    inchi:'InChI=1S/C18H34O4/c1-2-3-4-5-6-8-11-14-17(22-21)15-12-9-7-10-13-16-18(19)20/h11,14,17,21H,2-10,12-13,15-16H2,1H3,(H,19,20)/b14-11+'},
  ene10:{name:'10-OOH · Δ8E',organicFormula:'C18H34O4',doubleBondStart:8,geometry:'E',oohCarbon:10,donorCarbon:8,transferredHydrogenId:'H8a',
    inchi:'InChI=1S/C18H34O4/c1-2-3-4-5-8-11-14-17(22-21)15-12-9-6-7-10-13-16-18(19)20/h12,15,17,21H,2-11,13-14,16H2,1H3,(H,19,20)/b15-12+'},
});
const ARROWS=Object.freeze({
  ene9:[['C9-C10','C9-O3'],['O3-O4','O4-H11a'],['C11-H11a','C10-C11']],
  ene10:[['C9-C10','C10-O3'],['O3-O4','O4-H8a'],['C8-H8a','C8-C9']],
});
const SOURCES=['oleate-source-ntu-115-q3','oleate-identity-pubchem-445639','oleate-source-kato-2022','oleate-source-frankel-1979','oleate-source-lercker-1998'];
const spec=id=>{if(!owns(SPECS,id))throw new RangeError('Unknown oleate state');return SPECS[id];};
const element=id=>id[0];
const formula=counts=>['C','H','O'].filter(e=>counts[e]).map(e=>e+(counts[e]===1?'':counts[e])).join('');

/** Built from the fixed chemical contract, never from supplied bonds/formula. */
function expectedEdges(id){
  const s=spec(id),edges=new Map(),add=(a,b,order=1)=>edges.set(pair(a,b),{a,b,order});
  for(let i=1;i<18;i++)add(`C${i}`,`C${i+1}`,i===s.doubleBondStart?2:1);
  add('C1','O1',2);add('C1','O2');
  for(const h of hydrogenRows)add(h.id===s.transferredHydrogenId?'O4':h.carbon,h.id);
  add('O3','O4',id==='reactants'?2:1);
  if(s.oohCarbon)add(`C${s.oohCarbon}`,'O3');
  return edges;
}
function expectedRadicalEdges(donor,site){
  const edges=expectedEdges('reactants'),removed=`H${donor}a`;
  edges.delete(pair(`C${donor}`,removed));edges.delete(pair('O3','O4'));
  if(donor!==site){
    edges.set(pair('C9','C10'),{a:'C9',b:'C10',order:1});
    const start=donor===8?8:10;
    edges.set(pair(`C${start}`,`C${start+1}`),{a:`C${start}`,b:`C${start+1}`,order:2});
  }
  return edges;
}
const flatten=s=>({atoms:s.components.flatMap(c=>c.atoms),bonds:s.components.flatMap(c=>c.bonds)});
const actualEdges=graph=>new Map(graph.bonds.map(b=>[pair(b.a,b.b),{a:b.a,b:b.b,order:b.order}]));
function connected(ids,edges){
  const adjacency=new Map(ids.map(id=>[id,[]]));
  for(const {a,b}of edges.values()){adjacency.get(a).push(b);adjacency.get(b).push(a);}
  const seen=new Set(),stack=[ids[0]];
  while(stack.length){const id=stack.pop();if(seen.has(id))continue;seen.add(id);stack.push(...adjacency.get(id));}
  return seen.size===ids.length;
}
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const norm=a=>Math.hypot(...a);
function alkeneCosine(positions,start){
  const left=positions[`C${start}`],right=positions[`C${start+1}`],v=sub(right,left),length=norm(v);
  if(length<.05)return NaN;
  const axis=v.map(x=>x/length),u=sub(positions[`C${start-1}`],left),w=sub(positions[`C${start+2}`],right);
  const p=u.map((x,i)=>x-dot(u,axis)*axis[i]),q=w.map((x,i)=>x-dot(w,axis)*axis[i]);
  return dot(p,q)/(norm(p)*norm(q));
}
function stereoVolume(positions,site){
  const [unsaturated,saturated]=site===9?[10,8]:[9,11],origin=positions[`H${site}`];
  const [u,v,w]=['O3',`C${unsaturated}`,`C${saturated}`].map(id=>sub(positions[id],origin));
  return u[0]*(v[1]*w[2]-v[2]*w[1])-u[1]*(v[0]*w[2]-v[2]*w[0])+u[2]*(v[0]*w[1]-v[1]*w[0]);
}
function finitePositions(positions,ids){
  if(!obj(positions)||Object.keys(positions).length!==ids.length||ids.some(id=>!Array.isArray(positions[id])||positions[id].length!==3||positions[id].some(v=>typeof v!=='number'||!Number.isFinite(v))))fail('complete finite coordinate map required');
}
function checkGeometry(positions,ids,edges,s){
  finitePositions(positions,ids);
  const adjacency=new Map(ids.map(id=>[id,new Set()]));
  for(const b of edges.values()){
    const length=norm(sub(positions[b.a],positions[b.b])),h=element(b.a)==='H'||element(b.b)==='H';
    if(length<(h?.65:.9)||length>(h?1.35:1.9))fail('bond length outside representative-geometry limits');
    adjacency.get(b.a).add(b.b);adjacency.get(b.b).add(b.a);
  }
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
    const a=ids[i],b=ids[j];
    if(adjacency.get(a).has(b)||[...adjacency.get(a)].some(n=>adjacency.get(n).has(b)))continue;
    const ah=element(a)==='H',bh=element(b)==='H',floor=ah&&bh?.85:ah||bh?1:1.3;
    if(norm(sub(positions[a],positions[b]))<floor)fail('severe nonlocal geometry clash');
  }
  if(s){const cosine=alkeneCosine(positions,s.doubleBondStart);if(!(s.geometry==='Z'?cosine>.95:cosine<-.95))fail('actual coordinates do not preserve alkene E/Z');}
  const volume=s?.oohCarbon?stereoVolume(positions,s.oohCarbon):null;
  if(s?.oohCarbon&&!(Math.abs(volume)>.2))fail('degenerate new hydroperoxide stereocentre');
  return volume;
}

/** Narrow explicit graph accounting; radical allowance applies ONLY when this
 * function is called with an independently fixed allyl contributor atom ID. */
function checkGraph(graph,ids,expected,expectedFormula,radicalAtom=null,coordinates=true){
  if(!obj(graph)||!Array.isArray(graph.atoms)||!Array.isArray(graph.bonds)||graph.atoms.length!==ids.length)fail('complete explicit atom graph required');
  const seen=new Set(),atoms=new Map(),counts={C:0,H:0,O:0},sums=new Map(),edges=new Map();
  for(const atom of graph.atoms){
    if(!obj(atom)||!ids.includes(atom.id)||seen.has(atom.id)||atom.element!==element(atom.id)||atom.formalCharge!==0||atom.charge!==0||owns(atom,'cip'))fail('atom identity, neutral charge or experimental stereo drift');
    if(atom.radicalElectrons!==(atom.id===radicalAtom?1:0))fail('incorrect explicit unpaired-electron assignment');
    if(coordinates&&(!Array.isArray(atom.position)||atom.position.length!==3||!atom.position.every(v=>typeof v==='number'&&Number.isFinite(v))))fail('finite atom coordinates required');
    if(!coordinates&&owns(atom,'position'))fail('allyl contributors must not pretend to be computed 3D states');
    for(const key of ['implicitH','implicitHs','implicitHydrogens','numImplicitHs','hydrogenCount','explicitHs','numExplicitHs'])if(owns(atom,key)&&atom[key]!==0)fail('hidden hydrogen declarations are unsupported');
    seen.add(atom.id);atoms.set(atom.id,atom);sums.set(atom.id,0);counts[atom.element]++;
  }
  if(ids.some(id=>!seen.has(id)))fail('atom inventory mismatch');
  for(const b of graph.bonds){
    if(!obj(b)||!seen.has(b.a)||!seen.has(b.b)||b.a===b.b||![1,2].includes(b.order))fail('invalid bond');
    const key=pair(b.a,b.b),wanted=expected.get(key);
    if(edges.has(key)||!wanted||wanted.order!==b.order)fail('graph differs from the independent chemical contract');
    edges.set(key,{a:b.a,b:b.b,order:b.order});sums.set(b.a,sums.get(b.a)+b.order);sums.set(b.b,sums.get(b.b)+b.order);
  }
  if(edges.size!==expected.size||[...expected].some(([key,b])=>edges.get(key)?.order!==b.order)||!connected(ids,edges))fail('missing bond or disconnected molecular component');
  if(formula(counts)!==expectedFormula||graph.formula!==expectedFormula)fail('component formula mismatch');
  let totalElectrons=2*[...edges.values()].reduce((n,b)=>n+b.order,0),unpaired=0;
  for(const atom of atoms.values()){
    const valence={C:4,H:1,O:6}[atom.element],nbe=valence-sums.get(atom.id),r=atom.radicalElectrons;
    if(atom.nonbondingElectrons!==nbe||nbe<0||(nbe-r)%2!==0||nbe<r||nbe+2*sums.get(atom.id)>(atom.element==='H'?2:8))fail('inconsistent narrow electron ledger');
    if(sums.get(atom.id)!==({C:4,H:1,O:2}[atom.element]-(atom.id===radicalAtom?1:0)))fail('wrong explicit valence');
    totalElectrons+=nbe;unpaired+=r;
  }
  if(unpaired!==(radicalAtom?1:0))fail('wrong total unpaired electrons');
  return {atoms,edges,totalElectrons,counts};
}
function checkDiagram(diagram,s,radicalSite=null,removed=null){
  if(!obj(diagram)||diagram.carbonCount!==18||diagram.carboxylCarbon!==1||!Array.isArray(diagram.doubleBonds)||diagram.doubleBonds.length!==1)fail('single-alkene diagram contract required');
  const b=diagram.doubleBonds[0];
  if(b.start!==s.doubleBondStart||b.end!==s.doubleBondStart+1||b.geometry!==(radicalSite?null:s.geometry))fail('diagram alkene differs from graph');
  if(radicalSite){if(diagram.radicalCarbon!==radicalSite||diagram.removedHydrogenId!==removed)fail('radical diagram differs from contributor');}
  else if(diagram.hydroperoxyCarbon!==s.oohCarbon||diagram.hydroperoxyHydrogenId!==s.transferredHydrogenId||JSON.stringify(diagram.hydroperoxyOxygenIds)!==JSON.stringify(s.oohCarbon?['O3','O4']:[]))fail('peroxide diagram differs from atom ledger');
}
function checkConformers(component,ids,edges,s){
  const product=Boolean(s?.oohCarbon),expectedIds=product?['a','b']:['a'],list=component.displayConformers;
  if(!Array.isArray(list)||list.length!==expectedIds.length||list.some((c,i)=>c?.id!==expectedIds[i]))fail('required representative/mirror coordinate sets missing');
  const volumes=[];
  for(const c of list){
    if(c.isExperimentalGeometry!==false||c.isTrajectory!==false||typeof c.construction!=='string'||!c.construction.trim())fail('display geometry provenance required');
    volumes.push(checkGeometry(c.positions,ids,edges,s));
  }
  if(component.atoms.some(a=>a.position.some((v,i)=>Math.abs(v-list[0].positions[a.id][i])>1e-8)))fail('default atom coordinates must equal representative A');
  if(product){
    if(!(volumes[0]*volumes[1]<0))fail('both mirror orientations are required');
    for(const id of ids)for(let axis=0;axis<3;axis++)if(Math.abs(list[1].positions[id][axis]-(axis===0?-1:1)*list[0].positions[id][axis])>1e-8)fail('mirror must reflect the whole molecular coordinate set');
  }
}

export function validateOleateDataset(data){
  if(!obj(data)||data.schema!==OLEATE_SCHEMA||data.version!==1||data.id!=='oleate-oxidation')fail('unsupported schema');
  if(!obj(data.metadata)||data.metadata.explicitHydrogens!==true||data.metadata.isTrajectory!==false||data.metadata.isElementaryMechanism!==false||data.metadata.electronicStateRepresentation!=='formal-bookkeeping-not-wavefunction')fail('scope declarations required');
  if(!Array.isArray(data.sources)||new Set(data.sources.map(s=>s?.id)).size!==data.sources.length||SOURCES.some(id=>!data.sources.some(s=>s?.id===id))||data.sources.some(s=>!obj(s)||typeof s.title!=='string'||typeof s.url!=='string'||!/^https:\/\//.test(s.url)))fail('source identities required');
  if(!Array.isArray(data.limits)||data.limits.length<6||data.limits.some(v=>typeof v!=='string'||!v.trim()))fail('explicit model limitations required');
  if(!Array.isArray(data.states)||data.states.length!==3||new Set(data.states.map(s=>s?.id)).size!==3||data.states.some(s=>!owns(SPECS,s?.id)))fail('three unique known endpoint states required');
  for(const state of data.states){
    const s=spec(state.id),ids=state.id==='reactants'?['organic','oxygen']:['organic'];
    if(state.totalFormula!=='C18H34O4'||state.atomCount!==56||state.totalCharge!==0||state.totalValenceElectrons!==130||!obj(state.formulaTotals)||Object.keys(state.formulaTotals).length!==3||Object.entries(OLEATE_TOTALS).some(([e,n])=>state.formulaTotals[e]!==n))fail('incorrect 56-atom state ledger');
    if(!obj(state.metadata)||state.metadata.explicitHydrogens!==true||state.metadata.isTrajectory!==false||state.metadata.isElementaryMechanism!==false)fail('state scope required');
    if(!Array.isArray(state.components)||state.components.length!==ids.length||new Set(state.components.map(c=>c?.id)).size!==ids.length||state.components.some(c=>!ids.includes(c?.id)))fail('incorrect component partition');
    const allExpected=expectedEdges(state.id),seen=new Set();
    for(const c of state.components){
      const isOxygen=c.id==='oxygen',atomIds=isOxygen?['O3','O4']:state.id==='reactants'?ACID_IDS:OLEATE_ATOM_IDS;
      const expected=new Map([...allExpected].filter(([,b])=>atomIds.includes(b.a)&&atomIds.includes(b.b)));
      const wantedFormula=isOxygen?'O2':s.organicFormula,checked=checkGraph(c,atomIds,expected,wantedFormula);
      for(const id of atomIds){if(seen.has(id))fail('atom present in multiple components');seen.add(id);}
      if(!obj(c.identity)||c.identity.formula!==wantedFormula||!Array.isArray(c.identity.sourceIds)||c.identity.sourceIds.some(id=>!data.sources.some(v=>v.id===id)))fail('component chemical identity source required');
      if(!obj(c.metadata)||c.metadata.explicitHydrogens!==true||c.metadata.isTrajectory!==false||c.metadata.isExperimentalGeometry!==false||typeof c.metadata.geometryMethod!=='string')fail('computed/schematic geometry disclosure required');
      if(isOxygen){
        if(c.identity.absoluteStereo!=='not-applicable'||!obj(c.electronicState)||c.electronicState.label!=='singlet oxygen'||c.electronicState.multiplicityLabel!==1||c.electronicState.validatedByPairedElectronLedger!==false||typeof c.electronicState.representation!=='string')fail('oxygen electronic-state limit required');
      }else{
        if(c.identity.inchi!==s.inchi||c.identity.absoluteStereo!==(s.oohCarbon?'unspecified':'not-applicable')||typeof c.metadata.displayStereo!=='string')fail('wrong substrate/product identity or unassigned absolute stereochemistry');
        if(s.oohCarbon&&owns(c.identity,'pubchemCid')||!s.oohCarbon&&(c.identity.pubchemCid!==445639||c.identity.url!=='https://pubchem.ncbi.nlm.nih.gov/compound/445639'))fail('unverified chemical registry identity');
        checkDiagram(c.diagram,s);
      }
      checkConformers(c,atomIds,checked.edges,isOxygen?null:s);
    }
    if(seen.size!==56||OLEATE_ATOM_IDS.some(id=>!seen.has(id)))fail('whole-system atom inventory mismatch');
    const electron=inspectElectronState(flatten(state));
    if(!electron.ok||electron.totalCharge!==0||electron.totalValenceElectrons!==130)fail('secondary paired-electron bookkeeping failed');
  }
  if(!Array.isArray(data.transitions)||data.transitions.length!==2||new Set(data.transitions.map(t=>t?.to)).size!==2)fail('two net transformations required');
  const before=data.states.find(s=>s.id==='reactants');
  for(const id of ['ene9','ene10']){
    const t=data.transitions.find(t=>t.to===id),s=spec(id),after=data.states.find(s=>s.id===id);
    if(!t||t.from!=='reactants'||t.transferredHydrogenId!==s.transferredHydrogenId||t.donorCarbon!==`C${s.donorCarbon}`||t.oohCarbon!==`C${s.oohCarbon}`||JSON.stringify(t.pairedArrows)!==JSON.stringify(ARROWS[id]))fail('incorrect net atom-transfer mapping');
    const result=evaluateElectronArrows(flatten(before),t.pairedArrows,{referenceAfter:flatten(after)});
    if(!result.ok||!result.matchesReference||result.changes.length!==6)fail('three-pair net bookkeeping does not match the independent endpoint');
  }
  if(!Array.isArray(data.radicalFamilies)||data.radicalFamilies.length!==2||new Set(data.radicalFamilies.map(f=>f?.id)).size!==2)fail('two unique allyl families required');
  for(const donor of [8,11]){
    const f=data.radicalFamilies.find(f=>f.id===`c${donor}`),sites=donor===8?[8,10]:[11,9],removed=`H${donor}a`,atomIds=ACID_IDS.filter(id=>id!==removed);
    if(!f||f.abstractionCarbon!==donor||f.removedHydrogenId!==removed||f.totalFormula!=='C18H33O2'||f.atomCount!==53||f.totalCharge!==0||f.totalValenceElectrons!==117||f.totalUnpairedElectrons!==1||JSON.stringify(f.productPositions)!==JSON.stringify([...sites].sort((a,b)=>a-b))||typeof f.scope!=='string'||typeof f.interpretation!=='string')fail('incorrect open-subsystem family ledger');
    if(!Array.isArray(f.contributors)||f.contributors.length!==2||new Set(f.contributors.map(c=>c?.id)).size!==2)fail('two contributor graphs required');
    for(const site of sites){
      const c=f.contributors.find(c=>c.id===`radical${site}`);
      if(!c||c.radicalAtomId!==`C${site}`||!obj(c.metadata)||c.metadata.explicitHydrogens!==true||c.metadata.isTrajectory!==false||c.metadata.is3D!==false||c.metadata.isDistinctTimeIntermediate!==false)fail('contributor scope or radical site mismatch');
      const result=checkGraph(c,atomIds,expectedRadicalEdges(donor,site),'C18H33O2',`C${site}`,false);
      if(result.totalElectrons!==117)fail('radical subsystem electron count mismatch');
      const start=site===donor?9:donor===8?8:10;
      checkDiagram(c.diagram,{doubleBondStart:start},site,removed);
    }
  }
  return data;
}

function diff(before,after){
  return [...new Set([...before.keys(),...after.keys()])].sort().flatMap(key=>{
    const a=before.get(key),b=after.get(key),left=a?.order??0,right=b?.order??0;if(left===right)return [];
    const edge=b??a;return [{pair:[edge.a,edge.b].sort().join('–'),a:edge.a,b:edge.b,before:left,after:right,kind:left===0?'formed':right===0?'broken':'order'}];
  });
}
export function oleateBondChanges(data,from,to){
  spec(from);spec(to);
  if(from!=='reactants'||!['ene9','ene10'].includes(to))throw new RangeError('Only the two forward ene net comparisons are defined');
  validateOleateDataset(data);
  return diff(actualEdges(flatten(data.states.find(s=>s.id===from))),actualEdges(flatten(data.states.find(s=>s.id===to))));
}
export function describeOleateState(id){
  const s=spec(id);return clone({id,...s,totalFormula:'C18H34O4',atomCount:56,totalCharge:0,totalValenceElectrons:130,
    components:id==='reactants'?['organic','oxygen']:['organic'],absoluteStereo:s.oohCarbon?'unspecified':'not-applicable'});
}
export function getOleateResonanceFamily(data,id){
  if(!OLEATE_FAMILY_IDS.includes(id))throw new RangeError('Unknown oleate radical family');
  validateOleateDataset(data);return clone(data.radicalFamilies.find(f=>f.id===id));
}
