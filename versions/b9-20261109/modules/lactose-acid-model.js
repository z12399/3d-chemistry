import {inspectElectronState,evaluateElectronArrows} from './electron-workbench-model.js';
const pair=(a,b)=>[a,b].sort().join('|');
const centers=['AC1','AC2','AC3','AC4','AC5','BC2','BC3','BC4','BC5'];
const charges=['Osol','BO5','BO1','Osol'];
const prescribed=[[['BO5','Hcat'],['Osol-Hcat','Osol']],[['BO1','BC1'],['BC1-BO5','BO5']],[['Osol','BHO1'],['BO1-BHO1','BO1']]];
const minus=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function fail(){throw new Error('乳糖酸示意的原子、電子對或代表幾何未通過核對。');}
function neighbors(state,id){return state.bonds.filter(b=>b.a===id||b.b===id).map(b=>b.a===id?b.b:b.a).sort();}
function volume(state,id){const byId=new Map(state.atoms.map(a=>[a.id,a])),ids=neighbors(state,id);if(ids.length!==4)fail();const v=ids.map(next=>minus(byId.get(next).position,byId.get(id).position));return {ids,value:dot(minus(v[0],v[3]),cross(minus(v[1],v[3]),minus(v[2],v[3])))};}
export function validateLactoseAcidOpening(data,neutral){
  if(data?.schemaVersion!==1||data.kind!=='lactose acid hemiacetal opening teaching ledger'||data.isTrajectory!==false||data.states?.length!==4||data.steps?.length!==3||!neutral?.closed)fail();
  const expectedIds=new Map(neutral.closed.atoms.map(a=>[a.id,a.element]));for(const [id,element]of [['Osol','O'],['Hcat','H'],['Hsa','H'],['Hsb','H']])expectedIds.set(id,element);
  const inspections=[],evaluations=[];
  for(let index=0;index<4;index++){
    const state=data.states[index];
    if(state.atoms?.length!==49||state.formula!=='C12H25O12+'||state.metadata?.isTrajectory!==false||new Set(state.atoms.map(a=>a.id)).size!==49)fail();
    for(const atom of state.atoms){if(expectedIds.get(atom.id)!==atom.element||atom.formalCharge!==(atom.id===charges[index]?1:0)||!Array.isArray(atom.position)||atom.position.length!==3||!atom.position.every(v=>Number.isFinite(v)&&Math.abs(v)<100))fail();}
    const checked=inspectElectronState(state);
    if(!checked.ok||checked.totalCharge!==1||checked.totalValenceElectrons!==144||checked.electrons.some(row=>row.shellElectrons!==(row.element==='H'?2:8)))fail();inspections.push(checked);
    const adjacency=new Map(state.atoms.map(a=>[a.id,[]])),bondMap=new Map();
    for(const b of state.bonds){bondMap.set(pair(b.a,b.b),b.order);adjacency.get(b.a).push(b.b);adjacency.get(b.b).push(b.a);const atoms=state.atoms.filter(a=>a.id===b.a||a.id===b.b);const distance=Math.hypot(...minus(atoms[0].position,atoms[1].position));if(distance<.75||distance>2.1)fail();}
    if(bondMap.get(pair('AC1','BO4'))!==1||bondMap.get(pair('BO4','BC4'))!==1)fail();
    for(const atom of state.atoms)if(atom.element==='H'&&(adjacency.get(atom.id).length!==1||atom.attachedTo!==adjacency.get(atom.id)[0]))fail();
    const pending=['Osol'],solvent=new Set();while(pending.length){const id=pending.pop();if(solvent.has(id))continue;solvent.add(id);pending.push(...adjacency.get(id));}
    const expectedSolvent=index===0?['Osol','Hsa','Hsb','Hcat']:index===3?['Osol','Hsa','Hsb','BHO1']:['Osol','Hsa','Hsb'];if(solvent.size!==expectedSolvent.length||expectedSolvent.some(id=>!solvent.has(id)))fail();
    const sugarPending=['AC1'],sugar=new Set();while(sugarPending.length){const id=sugarPending.pop();if(sugar.has(id))continue;sugar.add(id);sugarPending.push(...adjacency.get(id));}if(sugar.size+solvent.size!==49)fail();
    for(const center of centers.concat(index<2?['BC1']:[])){const before=volume(neutral.closed,center),after=volume(state,center);if(before.ids.join('|')!==after.ids.join('|')||Math.abs(after.value)<.25||before.value*after.value<=0)fail();}
    if(index>=2){const map=new Map(state.atoms.map(a=>[a.id,a])),v=['BO1','BC2','BHC1'].map(id=>minus(map.get(id).position,map.get('BC1').position)),normal=cross(v[1],v[2]);if(map.get('BC1').cip||Math.hypot(...normal)<1e-6||Math.abs(dot(v[0],normal)/Math.hypot(...normal))>.02)fail();}
    if(index===0){const expected=new Map(neutral.closed.bonds.map(b=>[pair(b.a,b.b),b.order]));for(const id of ['Hcat','Hsa','Hsb'])expected.set(pair('Osol',id),1);if(expected.size!==bondMap.size||[...expected].some(([id,order])=>bondMap.get(id)!==order))fail();}
  }
  for(let index=0;index<3;index++){
    if(JSON.stringify(data.steps[index].arrows)!==JSON.stringify(prescribed[index]))fail();
    const result=evaluateElectronArrows(data.states[index],data.steps[index].arrows,{referenceAfter:data.states[index+1]});if(!result.ok||!result.matchesReference)fail();evaluations.push(result);
  }
  return {states:data.states,steps:data.steps,inspections,evaluations};
}
export const LACTOSE_ACID_NAMES=Object.freeze(['起態 · β-乳糖 + H₃O⁺','BO5 質子化','羰基形成／B 環打開','去質子化／酸物種再生']);
export function lactoseAcidLedger(model,stage){
  if(!Number.isInteger(stage)||stage<0||stage>3)throw new Error('酸示意狀態無效。');
  const step=Math.min(stage,2),inspection=model.inspections[stage],rows=['BO5','BO1','Osol'].map(id=>inspection.electrons.find(row=>row.atomId===id));
  return {title:(stage===3?'上一組電子帳（2 → 3）已完成：':'本組電子帳（'+stage+' → '+(stage+1)+'）：')+model.steps[step].title,arrows:model.steps[step].arrows,explanation:model.steps[step].explanation,rows,formula:'C12H25O12+',totalCharge:inspection.totalCharge,totalValenceElectrons:inspection.totalValenceElectrons};
}
