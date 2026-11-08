import {PROTEIN_CCD_SOURCE,PROTEIN_CCD_TEMPLATES} from './protein-structure-ccd.js';

const fail=message=>{throw new TypeError(`蛋白共價拓撲無法核對：${message}`);};
const point=value=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite);
const distance=(a,b)=>Math.hypot(...a.position.map((value,index)=>value-b.position[index]));
const copy=value=>JSON.parse(JSON.stringify(value));
const has=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);

/**
 * Reconstruct heavy-atom covalent connectivity without changing coordinates.
 * CCD supplies named intra-residue bonds; sequence supplies peptide candidates;
 * the frozen structure's SSBOND records supply disulfides. Distance is only a
 * sanity guard, never an all-atom bond search. Missing atoms are not generated.
 */
export function buildProteinTopology(dataset){
  if(dataset?.id!=='protein-structure-6fxb'||dataset.source?.entry!=='6FXB'||dataset.source?.assemblyId!=='1')fail('來源身分');
  if(!Array.isArray(dataset.chains)||!dataset.chains.length||!Array.isArray(dataset.disulfides))fail('鏈／二硫鍵資料');
  const atoms=[],bonds=[],missingAtoms=[],chainBreaks=[];
  const atomById=new Map(),residueById=new Map(),chainIds=new Set(),bondKeys=new Set();
  const addBond=(a,b,order,kind,aromatic=false)=>{
    const atomA=atomById.get(a),atomB=atomById.get(b);
    if(!atomA||!atomB||a===b||![1,2].includes(order))fail(`無效鍵端點 ${a}/${b}`);
    const key=[a,b].sort().join('|');
    if(bondKeys.has(key))fail(`重複鍵 ${a}/${b}`);
    const length=distance(atomA,atomB);
    const [min,max]=kind==='disulfide'?[1.8,2.3]:kind==='peptide'?[1.1,1.8]:[.9,2.25];
    if(length<min||length>max)fail(`來源鍵長超出檢核範圍 ${a}/${b}`);
    bondKeys.add(key);bonds.push({a,b,order,kind,aromatic});
  };

  for(const chain of dataset.chains){
    if(typeof chain.id!=='string'||!chain.id||chainIds.has(chain.id)||typeof chain.sequence!=='string'||!chain.sequence.length||!Array.isArray(chain.residues))fail('鏈身分／序列');
    chainIds.add(chain.id);
    let previousNumber=0;
    for(const residue of chain.residues){
      if(!Number.isInteger(residue.number)||residue.number<=previousNumber||residue.number>chain.sequence.length||residue.chain!==chain.id||residue.id!==`${chain.id}:${residue.number}`||residueById.has(residue.id))fail('重複或無效殘基身分');
      previousNumber=residue.number;
      if(!has(PROTEIN_CCD_TEMPLATES,residue.name))fail(`未知殘基 ${residue.name}`);
      const template=PROTEIN_CCD_TEMPLATES[residue.name];
      if(residue.code!==template.code||chain.sequence[residue.number-1]!==template.code||!['alpha','310','sheet','other'].includes(residue.secondary)||!Array.isArray(residue.atoms))fail(`殘基欄位 ${residue.id}`);
      residueById.set(residue.id,residue);
      const names=new Set();
      for(const atom of residue.atoms){
        if(!has(template.atoms,atom.name))fail(`未知原子名稱 ${residue.id}:${atom.name}`);
        if(atom.id!==`${residue.id}:${atom.name}`||atomById.has(atom.id)||names.has(atom.name))fail(`重複或無效原子身分 ${atom.id}`);
        if(atom.element!==template.atoms[atom.name].element||!point(atom.position)||!Number.isFinite(atom.occupancy)||atom.occupancy<=0||atom.occupancy>1||!Number.isFinite(atom.bFactor)||atom.bFactor<0)fail(`原子欄位 ${atom.id}`);
        if(template.atoms[atom.name].leaving&&residue.number!==chain.sequence.length)fail(`鏈內出現離去原子 ${atom.id}`);
        names.add(atom.name);
        const flat={...atom,position:[...atom.position],residueId:residue.id,residueName:residue.name,residueNumber:residue.number,chain:chain.id,secondary:residue.secondary};
        atoms.push(flat);atomById.set(atom.id,flat);
      }
      for(const [name,expected] of Object.entries(template.atoms)){
        // OXT is absent by polymer linkage in internal residues; at the real
        // sequence terminus an absent OXT is explicitly reported as unmodelled.
        if(!names.has(name)&&(!expected.leaving||residue.number===chain.sequence.length))missingAtoms.push({residueId:residue.id,residueName:residue.name,atomName:name,element:expected.element,reason:'not-in-coordinate-model'});
      }
    }
  }

  for(const chain of dataset.chains){
    for(const [index,residue] of chain.residues.entries()){
      for(const bond of PROTEIN_CCD_TEMPLATES[residue.name].bonds){
        const a=`${residue.id}:${bond.a}`,b=`${residue.id}:${bond.b}`;
        if(atomById.has(a)&&atomById.has(b))addBond(a,b,bond.order,'residue',bond.aromatic);
      }
      const next=chain.residues[index+1];
      if(!next)continue;
      const a=`${residue.id}:C`,b=`${next.id}:N`;
      const atomA=atomById.get(a),atomB=atomById.get(b);
      let reason=null;
      if(next.number!==residue.number+1)reason='sequence-gap';
      else if(!atomA||!atomB)reason='missing-peptide-endpoint';
      else if(distance(atomA,atomB)<1.1||distance(atomA,atomB)>1.8)reason='peptide-distance-out-of-range';
      if(reason)chainBreaks.push({chain:chain.id,a,b,reason});
      else addBond(a,b,1,'peptide');
    }
  }

  for(const record of dataset.disulfides){
    const a=residueById.get(record.a),b=residueById.get(record.b);
    if(a?.name!=='CYS'||b?.name!=='CYS'||record.atomA!==`${record.a}:SG`||record.atomB!==`${record.b}:SG`||a.chain!==record.chain||b.chain!==record.chain)fail('來源二硫鍵殘基／端點');
    // An explicit SSBOND whose endpoint is absent cannot silently disappear.
    addBond(record.atomA,record.atomB,1,'disulfide');
  }

  const elements={},bondKinds={residue:0,peptide:0,disulfide:0};
  for(const atom of atoms)elements[atom.element]=(elements[atom.element]||0)+1;
  for(const bond of bonds)bondKinds[bond.kind]++;
  return {
    atoms,bonds,missingAtoms,chainBreaks,
    stats:{atomCount:atoms.length,residueCount:residueById.size,bondCount:bonds.length,elements,bondKinds,missingAtomCount:missingAtoms.length,chainBreakCount:chainBreaks.length},
    source:{coordinates:copy(dataset.source),ccd:copy(PROTEIN_CCD_SOURCE),peptideRule:'Consecutive residue numbers within one source chain, named C–N endpoints, distance 1.1–1.8 Å.',disulfideRule:'Only the frozen coordinate dataset SSBOND records.',limits:['Only source heavy atoms are present; no H, formal charges, protonation states, waters or new coordinates are generated.','CCD bond orders and aromatic flags describe a chemical drawing convention, not a measured localized electronic or protonation state.','Hydrogen-bond and interface-contact annotations never become covalent bonds.','Geometry guards detect implausible source links; they are not structure refinement or an energy calculation.']}
  };
}
