const pair=(a,b)=>[a,b].sort().join('|');
const centers=['AC1','AC2','AC3','AC4','AC5','BC2','BC3','BC4','BC5'];
const difference=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
const length=v=>Math.hypot(...v);
function fail(){throw new Error('乳糖中性端點的原子、連接或幾何未通過核對。');}
function graph(model){
  if(!model||model.formula!=='C12H22O11'||model.atoms?.length!==45||!Array.isArray(model.bonds)||model.metadata?.isTrajectory!==false)fail();
  const atoms=new Map(),counts={C:0,O:0,H:0},adjacency=new Map(),bonds=new Map();
  for(const atom of model.atoms){
    if(!/^[AB][A-Za-z0-9]+$/.test(atom.id)||atoms.has(atom.id)||!Object.hasOwn(counts,atom.element)||atom.formalCharge!==0||!Array.isArray(atom.position)||atom.position.length!==3||!atom.position.every(v=>Number.isFinite(v)&&Math.abs(v)<100))fail();
    atoms.set(atom.id,atom);counts[atom.element]++;adjacency.set(atom.id,[]);
  }
  if(counts.C!==12||counts.O!==11||counts.H!==22)fail();
  for(const bond of model.bonds){
    if(!atoms.has(bond.a)||!atoms.has(bond.b)||bond.a===bond.b||![1,2].includes(bond.order)||bonds.has(pair(bond.a,bond.b)))fail();
    const distance=length(difference(atoms.get(bond.a).position,atoms.get(bond.b).position));
    if(distance<.75||distance>2.1)fail();
    bonds.set(pair(bond.a,bond.b),bond.order);adjacency.get(bond.a).push([bond.b,bond.order]);adjacency.get(bond.b).push([bond.a,bond.order]);
  }
  for(const [id,atom]of atoms){
    const neighbors=adjacency.get(id);
    if(neighbors.reduce((sum,entry)=>sum+entry[1],0)!=={C:4,O:2,H:1}[atom.element])fail();
    if(atom.element==='H'&&(neighbors.length!==1||atom.attachedTo!==neighbors[0][0]))fail();
  }
  const seen=new Set(),pending=[model.atoms[0].id];
  while(pending.length){const id=pending.pop();if(seen.has(id))continue;seen.add(id);for(const [next]of adjacency.get(id))pending.push(next);}
  if(seen.size!==45)fail();
  if(bonds.get(pair('AC1','BO4'))!==1||bonds.get(pair('BO4','BC4'))!==1||adjacency.get('BO4')?.length!==2)fail();
  return {model,atoms,bonds,adjacency};
}
function volume(g,center){
  const ids=g.adjacency.get(center)?.map(([id])=>id).sort();if(ids?.length!==4)fail();
  const vectors=ids.map(id=>difference(g.atoms.get(id).position,g.atoms.get(center).position));
  const value=dot(difference(vectors[0],vectors[3]),cross(difference(vectors[1],vectors[3]),difference(vectors[2],vectors[3])));
  if(Math.abs(value)<.25)fail();return {ids,value};
}
export function validateLactoseEndpoints(data){
  if(data?.schemaVersion!==1||data.kind!=='neutral intact lactose endpoint comparison'||data.molecules?.length!==2)fail();
  const [closed,open]=data.molecules.map(graph);
  if(closed.model.id!=='lactose-reducing-closed'||open.model.id!=='lactose-reducing-open')fail();
  if([...closed.atoms].some(([id,atom])=>open.atoms.get(id)?.element!==atom.element))fail();
  const expected=new Map(closed.bonds);
  if(expected.get(pair('BC1','BO5'))!==1||expected.get(pair('BC1','BO1'))!==1||expected.get(pair('BO1','BHO1'))!==1)fail();
  expected.delete(pair('BC1','BO5'));expected.delete(pair('BO1','BHO1'));expected.set(pair('BC1','BO1'),2);expected.set(pair('BO5','BHO1'),1);
  if(expected.size!==open.bonds.size||[...expected].some(([key,order])=>open.bonds.get(key)!==order))fail();
  for(const center of centers){
    const before=volume(closed,center),after=volume(open,center);
    if(before.ids.join('|')!==after.ids.join('|')||before.value*after.value<=0)fail();
  }
  if(open.atoms.get('BC1').cip||open.adjacency.get('BC1')?.length!==3)fail();
  const v=['BO1','BC2','BHC1'].map(id=>difference(open.atoms.get(id).position,open.atoms.get('BC1').position)),normal=cross(v[1],v[2]);
  if(length(normal)<1e-6||Math.abs(dot(v[0],normal)/length(normal))>.02)fail();
  return {closed:closed.model,open:open.model};
}
export const LACTOSE_ENDPOINT_FOCUS=Object.freeze({
  reducing:Object.freeze(['BC1','BC2','BO1','BO5','BC5','BHC1','BHO1']),
  bridge:Object.freeze(['AC1','BO4','BC4']),
});
export const LACTOSE_ENDPOINT_DESCRIPTION=Object.freeze({
  closed:'所選 β-乳糖：Glc 的 BC1 是 β 還原端，仍有 BC1–BO5 環內鍵與 BC1–BO1 的 OH。Gal 的 β 糖苷中心另在 AC1，經 BO4 接 Glc 的 BC4；這兩處 β 是不同的中心。',
  open:'只開 Glc 還原端：BC1–BO5 不再相連，BC1=BO1 成為平面的羰基；BC1 此時沒有 α／β。AC1–BO4–BC4 的 β 糖苷橋仍完整，仍是一個 C₁₂H₂₂O₁₁ 分子。',
});
