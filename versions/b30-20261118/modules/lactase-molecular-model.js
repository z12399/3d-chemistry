import {PROTEIN_CCD_SOURCE,PROTEIN_CCD_TEMPLATES} from './protein-structure-ccd.js';

export const LPH_RANGES=Object.freeze({full:[1,1927],mature:[869,1927],IV:[1373,1846]});
export const LPH_RESIDUE_NAMES={ALA:'丙胺酸',ARG:'精胺酸',ASN:'天門冬醯胺',ASP:'天門冬胺酸',CYS:'半胱胺酸',GLN:'麩醯胺',GLU:'麩胺酸',GLY:'甘胺酸',HIS:'組胺酸',ILE:'異白胺酸',LEU:'白胺酸',LYS:'離胺酸',MET:'甲硫胺酸',PHE:'苯丙胺酸',PRO:'脯胺酸',SER:'絲胺酸',THR:'蘇胺酸',TRP:'色胺酸',TYR:'酪胺酸',VAL:'纈胺酸'};
const finitePoint=value=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite);
export function validateLactaseMolecular(data){
  const fail=message=>{throw new Error('LPH 分子資料無法核對：'+message);};
  if(data?.schema!=='lactase-molecular/v1'||data.source?.name!=='AF-P09848-F1'||data.source.version!==6)fail('來源／版本');
  if(!Array.isArray(data.atoms)||data.atoms.length!==15481||!Array.isArray(data.residues)||data.residues.length!==1927)fail('原子／殘基數');
  if(data.source.atomCount!==data.atoms.length||data.source.residueCount!==data.residues.length)fail('來源計數');
  if(data.activeSite?.acidBase!==1538||data.activeSite?.nucleophile!==1749)fail('人類活性殘基');
  const topology=data.topologySource;
  if(topology?.schema!=='lactase-molecular-ccd/v1'||topology.coordinateFile?.sha256!==data.source.sha256||topology.ccd?.schema!==PROTEIN_CCD_SOURCE.schema||topology.ccd.descriptionUrl!==PROTEIN_CCD_SOURCE.descriptionUrl)fail('化學鍵來源');
  if(!Array.isArray(topology.ccd.files)||topology.ccd.files.length!==PROTEIN_CCD_SOURCE.files.length||topology.ccd.files.some(file=>!file||typeof file.name!=='string'))fail('CCD 來源檔');
  const sources=new Map(topology.ccd.files.map(file=>[file.name,file]));
  if(sources.size!==PROTEIN_CCD_SOURCE.files.length||PROTEIN_CCD_SOURCE.files.some(file=>{const actual=sources.get(file.name);return actual?.url!==file.url||actual?.sha256!==file.sha256;}))fail('CCD 來源指紋');
  const seen=new Set(),residueAtoms=new Map(),expected=new Map();
  const bondKey=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
  const expectBond=(a,b,order,aromatic,kind)=>expected.set(bondKey(a,b),{order,aromatic,kind});
  for(let i=0;i<data.residues.length;i++){
    const residue=data.residues[i];if(residue.number!==i+1||!LPH_RESIDUE_NAMES[residue.name]||!finitePoint(residue.ca)||!Number.isFinite(residue.confidence)||residue.confidence<0||residue.confidence>100)fail('殘基欄位');
    const template=PROTEIN_CCD_TEMPLATES[residue.name];if(residue.code!==template.code)fail('殘基序列身分');
    if(!Array.isArray(residue.atomIndices)||!residue.atomIndices.length)fail('殘基原子');
    let ca=false;const names=new Set(),named=new Map();
    for(const index of residue.atomIndices){
      const atom=data.atoms[index];if(!atom||atom.index!==index||atom.residueNumber!==residue.number||seen.has(index)||names.has(atom.name)||!['C','N','O','S'].includes(atom.element)||!finitePoint(atom.position)||!Number.isFinite(atom.confidence)||atom.confidence<0||atom.confidence>100)fail('原子欄位');
      if(template.atoms[atom.name]?.element!==atom.element||atom.name==='OXT'&&residue.number!==1927)fail('CCD 原子身分');
      named.set(atom.name,index);
      seen.add(index);names.add(atom.name);if(atom.name==='CA'){ca=true;if(atom.position.some((v,j)=>v!==residue.ca[j]))fail('Cα 座標');}
    }
    if(!ca)fail('缺 Cα');
    for(const [name,atom] of Object.entries(template.atoms))if((!atom.leaving||residue.number===1927)&&!named.has(name))fail('缺來源重原子');
    for(const bond of template.bonds)if(named.has(bond.a)&&named.has(bond.b))expectBond(named.get(bond.a),named.get(bond.b),bond.order,bond.aromatic,'residue');
    residueAtoms.set(residue.number,named);
  }
  if(seen.size!==data.atoms.length||data.residues[1537].name!=='GLU'||data.residues[1748].name!=='GLU')fail('殘基映射');
  if(!Array.isArray(data.bonds)||!data.bonds.length)fail('鍵拓樸');
  for(let n=1;n<1927;n++)expectBond(residueAtoms.get(n).get('C'),residueAtoms.get(n+1).get('N'),1,false,'peptide');
  const keys=new Set(),valence=new Uint8Array(data.atoms.length);
  for(const bond of data.bonds){
    if(!Number.isInteger(bond.a)||!Number.isInteger(bond.b)||bond.a===bond.b||!data.atoms[bond.a]||!data.atoms[bond.b]||![1,2].includes(bond.order))fail('鍵欄位');
    const key=bondKey(bond.a,bond.b);if(keys.has(key))fail('重複鍵');keys.add(key);
    const prescribed=expected.get(key);
    if(!prescribed||bond.order!==prescribed.order||bond.aromatic!==prescribed.aromatic||bond.kind!==prescribed.kind)fail('CCD／肽鍵拓樸與鍵級');
    valence[bond.a]+=bond.order;valence[bond.b]+=bond.order;
    const length=Math.hypot(...data.atoms[bond.a].position.map((v,j)=>v-data.atoms[bond.b].position[j]));
    if(length<.95||length>2.15)fail('來源鍵長');
  }
  if(keys.size!==expected.size)fail('缺共價鍵');
  for(let i=0;i<data.atoms.length;i++)if(valence[i]>{C:4,N:4,O:2,S:2}[data.atoms[i].element])fail('重原子鍵級總和');
  for(const [key,[start,end]] of Object.entries(LPH_RANGES))if(data.ranges?.[key]?.start!==start||data.ranges[key].end!==end)fail('顯示範圍');
  return data;
}
export function lphRangeResidues(data,range='mature'){
  if(!LPH_RANGES[range])throw new RangeError('Unknown LPH range');
  const [start,end]=LPH_RANGES[range];return data.residues.filter(r=>r.number>=start&&r.number<=end);
}
export function lphResidueReadout(data,number,atomName=null){
  const residue=data.residues[number-1];if(!residue||residue.number!==number)throw new RangeError('Unknown LPH residue');
  const atoms=residue.atomIndices.map(i=>data.atoms[i]);
  const atom=atomName?atoms.find(a=>a.name===atomName):null;
  const role=number===1538?'乳糖水解的酸／鹼催化殘基':number===1749?'乳糖水解的親核催化殘基':'來源序列中的殘基；本課未為此位置指定催化角色';
  return {number,name:residue.name,chineseName:LPH_RESIDUE_NAMES[residue.name],domain:residue.domain,pLDDT:residue.confidence,atomCount:atoms.length,atom:atom||null,role,atoms};
}
