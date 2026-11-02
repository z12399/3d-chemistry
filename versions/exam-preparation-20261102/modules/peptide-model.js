/** Original atom-balance teaching model for linear, unmodified alpha peptides.
 * Structures use formally neutral NH2/COOH groups, not equilibrium pH species.
 * Selected cuts specify products; they do not predict kinetics or specificity.
 */
function aminoAcid(code,label,threeLetter,formula,C,H,N,O){
  return Object.freeze({code,label,threeLetter,formula,atoms:Object.freeze({C,H,N,O})});
}
export const PEPTIDE_AMINO_ACIDS = Object.freeze({
  G:aminoAcid('G','甘胺酸','Gly','C2H5NO2',2,5,1,2),
  A:aminoAcid('A','丙胺酸','Ala','C3H7NO2',3,7,1,2),
  S:aminoAcid('S','絲胺酸','Ser','C3H7NO3',3,7,1,3),
  K:aminoAcid('K','離胺酸','Lys','C6H14N2O2',6,14,2,2),
  D:aminoAcid('D','天門冬胺酸','Asp','C4H7NO4',4,7,1,4),
});
function preset(id,sequence){
  return Object.freeze({id,sequence,label:[...sequence].map(code=>PEPTIDE_AMINO_ACIDS[code].threeLetter).join('–')});
}
export const PEPTIDE_PRESETS = Object.freeze({
  gas:preset('gas','GAS'),akd:preset('akd','AKD'),gasg:preset('gasg','GASG'),
});
export const PEPTIDE_DEFAULTS = Object.freeze({peptideId:'gas',cuts:Object.freeze([])});
export const PEPTIDE_SOURCES = Object.freeze([
  Object.freeze({id:'openstax-peptide-backbone',title:'OpenStax · 肽鍵、骨架與序列方向',url:'https://openstax.org/books/organic-chemistry/pages/26-4-peptides-and-proteins',scope:'§26.4 的醯胺鍵、α 肽骨架及 N→C 序列；模型另以形式中性端基進行原子收支，不把此形式當溶液主要形態。'}),
  Object.freeze({id:'openstax-peptide-hydrolysis',title:'OpenStax · 肽水解與胺基酸組成',url:'https://openstax.org/books/organic-chemistry/pages/26-5-amino-acid-analysis-of-peptides',scope:'§26.5 中水解肽的醯胺鍵得到胺基酸的概念；不採用其分析操作條件或推算反應速率。'}),
  Object.freeze({id:'nist-glycine',title:'NIST · 甘胺酸分子式',url:'https://webbook.nist.gov/cgi/cbook.cgi?ID=C56406&Mask=2',scope:'CAS 56-40-6；分子式 C2H5NO2。'}),
  Object.freeze({id:'nist-alanine',title:'NIST · L-丙胺酸分子式',url:'https://webbook.nist.gov/cgi/cbook.cgi?ID=C56417&Mask=260',scope:'CAS 56-41-7；分子式 C3H7NO2。'}),
  Object.freeze({id:'nist-serine',title:'NIST · L-絲胺酸分子式',url:'https://webbook.nist.gov/cgi/cbook.cgi?ID=C56451&Mask=8',scope:'CAS 56-45-1；分子式 C3H7NO3。'}),
  Object.freeze({id:'nist-lysine',title:'NIST · L-離胺酸分子式',url:'https://webbook.nist.gov/cgi/cbook.cgi?ID=C56871&Mask=200',scope:'CAS 56-87-1；游離胺基酸 C6H14N2O2，不是鹽酸鹽或水合物。'}),
  Object.freeze({id:'nist-aspartic',title:'NIST · L-天門冬胺酸分子式',url:'https://webbook.nist.gov/cgi/cbook.cgi?ID=C56848&Mask=200',scope:'CAS 56-84-8；分子式 C4H7NO4。'}),
]);
export const PEPTIDE_ASSUMPTIONS = Object.freeze([
  '僅計算未修飾、線性、正常 α 肽的骨架肽鍵；序列由 N 端讀向 C 端，不含環肽、異肽鍵或交聯。',
  '所有胺基與羧基採形式中性 NH₂／COOH 記帳，不是指定 pH 的主要形態、兩性離子分率或反應機構。',
  '每切斷一條肽鍵，形式淨收支消耗一個 H₂O，並新增一個 α 胺基端與一個 α 羧基端。',
  '離胺酸側鏈胺基及天門冬胺酸側鏈羧基不列入肽鏈 N／C 端點，也不在此模型中反應。',
  '切口是使用者指定的產物選擇，不代表酵素辨識、反應進度的時間尺度、酸鹼催化速率或平衡轉化率。',
  '原子收支不追蹤真實溶劑的質子交換、氧交換或同位素去向；沒有食品加工條件、消化或功能性預測。',
]);

const ELEMENTS=Object.freeze(['C','H','N','O']);
function getPreset(peptideId){
  if(typeof peptideId!=='string'||!Object.hasOwn(PEPTIDE_PRESETS,peptideId))throw new RangeError('Unknown peptide preset');
  return PEPTIDE_PRESETS[peptideId];
}
function checkedInput(input){
  if(input===null||typeof input!=='object'||Array.isArray(input))throw new TypeError('Model inputs must be an object');
}
function emptyAtoms(){return {C:0,H:0,N:0,O:0};}
function addAtoms(target,atoms){for(const element of ELEMENTS)target[element]+=atoms[element];return target;}
function formula(atoms){return ELEMENTS.filter(element=>atoms[element]>0).map(element=>element+(atoms[element]===1?'':atoms[element])).join('');}
function peptideAtoms(sequence){
  const atoms=emptyAtoms();
  for(const code of sequence)addAtoms(atoms,PEPTIDE_AMINO_ACIDS[code].atoms);
  // A linear chain has one condensation equivalent per original linkage.
  atoms.H-=2*(sequence.length-1);atoms.O-=sequence.length-1;
  return atoms;
}

/** Return a sorted copy of distinct 1-based positions AFTER a residue.
 * No coercion, duplicate removal, rounding or range clamping is performed.
 */
export function validatePeptideCuts(peptideId,cuts){
  const selected=getPreset(peptideId);
  if(!Array.isArray(cuts))throw new TypeError('cuts must be an array');
  const result=[],seen=new Set();
  for(const cut of cuts){
    if(typeof cut!=='number'||!Number.isFinite(cut)||!Number.isInteger(cut))throw new TypeError('Each cut must be a finite integer');
    if(cut<1||cut>=selected.sequence.length)throw new RangeError('Cut must follow an internal residue');
    if(seen.has(cut))throw new RangeError('Duplicate cuts are not allowed');
    seen.add(cut);result.push(cut);
  }
  return result.sort((a,b)=>a-b);
}

/** Classify a candidate original alpha-peptide bond; endpoint order is free.
 * Metadata roles must come from the actual molecular topology, not elements.
 * Returns cutAfter (1-based) or null for invalid/non-peptide atom metadata,
 * including residueIndex 0. Unknown peptideId/non-object input throws.
 * This does not check whether the UI has already cut this original bond.
 */
export function classifyPeptideBond(input){
  checkedInput(input);
  const {peptideId,a,b}=input,selected=getPreset(peptideId);
  const valid=atom=>atom!==null&&typeof atom==='object'&&!Array.isArray(atom)
    &&Number.isInteger(atom.residueIndex)&&atom.residueIndex>=1&&atom.residueIndex<=selected.sequence.length;
  if(!valid(a)||!valid(b))return null;
  const carbon=a.role==='backbone-carbonyl-C'?a:b.role==='backbone-carbonyl-C'?b:null;
  const nitrogen=a.role==='backbone-N'?a:b.role==='backbone-N'?b:null;
  return carbon&&nitrogen&&nitrogen.residueIndex===carbon.residueIndex+1?carbon.residueIndex:null;
}

/** Formal reaction per one initial peptide molecule (or stoichiometric mole).
 * Atom totals are integer counts, not concentrations or pH-dependent charges.
 * from/to/termini refer to positions in the ORIGINAL N-to-C sequence.
 */
export function peptideHydrolysis(input={}){
  checkedInput(input);
  const {peptideId=PEPTIDE_DEFAULTS.peptideId,cuts=PEPTIDE_DEFAULTS.cuts}=input;
  const selected=getPreset(peptideId),sortedCuts=validatePeptideCuts(peptideId,cuts);
  const {sequence}=selected,residueCount=sequence.length,fragments=[];
  let from=1;
  for(const to of [...sortedCuts,residueCount]){
    const fragmentSequence=sequence.slice(from-1,to),atoms=peptideAtoms(fragmentSequence);
    fragments.push({id:`${peptideId}:${from}-${to}`,from,to,sequence:fragmentSequence,
      label:[...fragmentSequence].map(code=>PEPTIDE_AMINO_ACIDS[code].threeLetter).join('–'),
      formula:formula(atoms),atoms,nTerminusResidue:from,cTerminusResidue:to,peptideBondCount:to-from});
    from=to+1;
  }
  const initialAtoms=peptideAtoms(sequence),count=sortedCuts.length;
  const waterAtoms={C:0,H:2*count,N:0,O:count};
  const reactantAtoms=addAtoms({...initialAtoms},waterAtoms),productAtoms=emptyAtoms();
  for(const fragment of fragments)addAtoms(productAtoms,fragment.atoms);
  return {peptideId,sequence,residueCount,cuts:sortedCuts,
    initialFormula:formula(initialAtoms),initialAtoms,initialPeptideBonds:residueCount-1,
    remainingPeptideBonds:residueCount-1-count,
    consumedWater:{count,formula:'H2O',totalAtoms:waterAtoms},fragments,
    newNTermini:sortedCuts.map(cut=>cut+1),newCTermini:[...sortedCuts],
    nTerminusCount:count+1,cTerminusCount:count+1,newNTerminusCount:count,newCTerminusCount:count,
    balance:{reactantAtoms,productAtoms,reactantFormula:formula(reactantAtoms),productFormula:formula(productAtoms),
      balanced:ELEMENTS.every(element=>reactantAtoms[element]===productAtoms[element])}};
}
