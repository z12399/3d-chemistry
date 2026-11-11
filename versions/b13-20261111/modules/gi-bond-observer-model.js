export const GI_REACTION_ID='glucose-isomerase-metal-hydride-transfer';

const sites=[['C1','O1'],['C2','O2']];
const bondKey=(a,b)=>[a,b].sort().join('\0');
const baseCaveat='只核對目前代表結構的局部連接；不表示反應軌跡、跨模型氫映射或精確氫轉移路徑。';
const conceptCaveat='第 3 步仍顯示未反應開鏈 Glc 的位置參照，不是氫移位中間體；金屬位與氫轉移未建模。';
const endpointCaveat='第 3 步比較已核對的 Glc／Fru 自由糖端點；兩者是獨立代表構象，不是氫移位中間體。金屬位與氫轉移未建模。';
const fail=()=>{throw new Error('Unverified GI bond graph');};

function graph(model){
  if(!Array.isArray(model?.atoms)||!model.atoms.length||!Array.isArray(model.bonds))fail();
  const atoms=new Map(),bonds=new Map(),neighbors=new Map();
  for(const atom of model.atoms){
    if(!atom||typeof atom.id!=='string'||!atom.id.trim()||atoms.has(atom.id)||!['C','O','H'].includes(atom.element))fail();
    if((atom.formalCharge??0)!==0||(atom.charge??0)!==0)fail();
    atoms.set(atom.id,atom);neighbors.set(atom.id,[]);
  }
  for(const bond of model.bonds){
    if(!bond||!atoms.has(bond.a)||!atoms.has(bond.b)||bond.a===bond.b||![1,2].includes(bond.order))fail();
    const key=bondKey(bond.a,bond.b);if(bonds.has(key))fail();
    bonds.set(key,bond.order);
    neighbors.get(bond.a).push({id:bond.b,order:bond.order,element:atoms.get(bond.b).element});
    neighbors.get(bond.b).push({id:bond.a,order:bond.order,element:atoms.get(bond.a).element});
  }
  for(const [id,atom]of atoms){
    const adjacent=neighbors.get(id);
    if(adjacent.reduce((sum,bond)=>sum+bond.order,0)!=={C:4,O:2,H:1}[atom.element])fail();
    if(atom.element==='H'&&(adjacent.length!==1||(atom.attachedTo!==undefined&&atom.attachedTo!==adjacent[0].id)))fail();
  }
  const seen=new Set(),pending=[model.atoms[0].id];
  while(pending.length){const id=pending.pop();if(seen.has(id))continue;seen.add(id);for(const bond of neighbors.get(id))pending.push(bond.id);}
  if(seen.size!==atoms.size)fail();
  return {atoms,bonds,neighbors};
}

function requireAtom(g,id,element){if(g.atoms.get(id)?.element!==element)fail();}
function requireBond(g,a,b,order){if(g.bonds.get(bondKey(a,b))!==order)fail();}
function exactNeighbors(actual,expected){
  if(actual.length!==expected.length||expected.some(([id,order])=>!actual.some(bond=>bond.id===id&&bond.order===order)))fail();
}

function observeSite(g,carbon,oxygen){
  requireAtom(g,carbon,'C');requireAtom(g,oxygen,'O');
  const order=g.bonds.get(bondKey(carbon,oxygen));if(![1,2].includes(order))fail();
  const adjacent=g.neighbors.get(carbon),oxygenAdjacent=g.neighbors.get(oxygen);
  const carbons=adjacent.filter(bond=>bond.element==='C'),hydrogens=adjacent.filter(bond=>bond.element==='H'),oxygens=adjacent.filter(bond=>bond.element==='O');
  exactNeighbors(carbons,carbon==='C1'?[['C2',1]]:[['C1',1],['C3',1]]);
  let description;
  if(order===2){
    exactNeighbors(oxygenAdjacent,[[carbon,2]]);exactNeighbors(oxygens,[[oxygen,2]]);
    if(hydrogens.length!==(carbon==='C1'?1:0)||hydrogens.some(bond=>bond.order!==1))fail();
    description=carbon==='C1'?'C1 醛羰基':'C2 酮羰基';
  }else{
    const oxygenHydrogens=oxygenAdjacent.filter(bond=>bond.element==='H');
    if(oxygenHydrogens.length!==1)fail();
    exactNeighbors(oxygenAdjacent,[[carbon,1],[oxygenHydrogens[0].id,1]]);
    const ringOxygen=carbon==='C1'&&g.bonds.has(bondKey('C1','O5'));
    if(ringOxygen){
      requireAtom(g,'O5','O');
      for(const id of ['C3','C4','C5'])requireAtom(g,id,'C');
      exactNeighbors(g.neighbors.get('O5'),[['C1',1],['C5',1]]);
      for(const [a,b]of [['C1','C2'],['C2','C3'],['C3','C4'],['C4','C5']])requireBond(g,a,b,1);
      exactNeighbors(oxygens,[[oxygen,1],['O5',1]]);
      if(hydrogens.length!==1||hydrogens[0].order!==1)fail();
      description='C1 環狀半縮醛';
    }else{
      exactNeighbors(oxygens,[[oxygen,1]]);
      if(hydrogens.length!==(carbon==='C1'?2:1)||hydrogens.some(bond=>bond.order!==1))fail();
      description=`${carbon} 醇`;
    }
  }
  return {id:`${carbon}-${oxygen}`,atomIds:[carbon,oxygen],order,symbol:`${carbon}${order===2?'=':'–'}${oxygen}`,description,available:true};
}

export function giBondObservation(model,{reactionId,stepIndex=0,endpointComparison=null}={}){
  if(reactionId!==GI_REACTION_ID)return null;
  const compared=stepIndex===2&&endpointComparison?.verified===true&&['glucose-open','fructose-open'].includes(model?.id)&&endpointComparison[model.id==='glucose-open'?'glucoseId':'fructoseId']===model.id;
  const caveat=stepIndex===2?`${compared?endpointCaveat:conceptCaveat} ${baseCaveat}`:baseCaveat;
  try{
    if(!Number.isInteger(stepIndex)||stepIndex<0||stepIndex>3)fail();
    const g=graph(model),pairs=sites.map(([carbon,oxygen])=>observeSite(g,carbon,oxygen));
    // The concept frame must not accidentally describe a product as the
    // unreacted glucose reference. Neither its stage nor model ID supplies bonds.
    if(stepIndex===2){
      const expected=compared&&model.id==='fructose-open'?[1,2]:[2,1];
      if(pairs.some((pair,i)=>pair.order!==expected[i]))fail();
    }
    return {
      pairs,
      carbonylAtomIds:pairs.filter(pair=>pair.order===2).flatMap(pair=>pair.atomIds),
      summary:`目前結構：${pairs.map(pair=>`${pair.description}（${pair.symbol}）`).join('；')}。`,
      caveat,
    };
  }catch{
    return {
      pairs:sites.map(([carbon,oxygen])=>({id:`${carbon}-${oxygen}`,atomIds:[carbon,oxygen],order:null,symbol:`${carbon} ? ${oxygen}`,description:'未能核對',available:false})),
      carbonylAtomIds:[],summary:'目前鍵圖未能核對，無法判斷 C1／C2 的局部官能基。',
      caveat:`目前鍵圖未通過核對。${caveat}`,
    };
  }
}
