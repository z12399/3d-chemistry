export const PROTEIN_LAB_ID='protein-structure-evidence';
export const PROTEIN_SOURCE_URL='https://www.rcsb.org/structure/6FXB';

const finite=value=>typeof value==='number'&&Number.isFinite(value);
const point=value=>Array.isArray(value)&&value.length===3&&value.every(finite);
const samePoint=(a,b)=>point(a)&&point(b)&&a.every((v,i)=>Math.abs(v-b[i])<1e-8);
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const fail=message=>{throw new TypeError(`蛋白結構資料未通過核對：${message}`);};
const atomMap=dataset=>new Map(dataset.chains.flatMap(chain=>chain.residues.flatMap(residue=>residue.atoms.map(atom=>[atom.id,atom]))));

/** Validate the finite, source-derived 6FXB assembly used by this lesson. */
export function validateProteinDataset(data){
  if(!data||data.version!==1||data.id!=='protein-structure-6fxb')fail('版本或資料身分不符');
  const source=data.source;
  if(source?.entry!=='6FXB'||source.assemblyId!=='1'||source.url!==PROTEIN_SOURCE_URL)fail('來源或組裝身分不符');
  if(JSON.stringify(source.assemblyChains)!=='["A","B"]'||JSON.stringify(source.asymmetricUnitChains)!=='["A","B","C","D"]')fail('鏈與組裝範圍不符');
  if(source.resolutionAngstrom!==2||!finite(source.rFree)||!finite(source.rWork)||source.rFree<=0||source.rFree>=1||source.rWork<=0||source.rWork>=1)fail('缺少實驗品質資料');
  for(const key of ['title','method','conditionNote','numberingNote','qualityNote'])if(typeof source[key]!=='string'||!source[key].trim())fail(`缺少 ${key}`);
  if(!Array.isArray(source.files)||source.files.length<4||source.files.some(file=>!file.name||!/^https:\/\//.test(file.url)||!/^[0-9a-f]{64}$/.test(file.sha256)))fail('缺少可追溯來源檔');
  if(!Array.isArray(data.chains)||data.chains.length!==2||data.chains.map(c=>c.id).join(',')!=='A,B')fail('需為 A/B 兩鏈');
  const residues=new Map(),atoms=new Map();
  for(const chain of data.chains){
    if(typeof chain.sequence!=='string'||chain.sequence.length!==162||chain.residues?.length!==162)fail('序列與已建模殘基數不符');
    for(const [index,residue] of chain.residues.entries()){
      if(residue.chain!==chain.id||residue.number!==index+1||residue.id!==`${chain.id}:${index+1}`||residues.has(residue.id))fail('殘基編號或身分不符');
      if(residue.code!==chain.sequence[index]||!/^[A-Z]{3}$/.test(residue.name)||!['alpha','310','sheet','other'].includes(residue.secondary))fail('序列或二級結構標記不符');
      if(!Array.isArray(residue.atoms)||residue.atoms.length<4||!point(residue.ca))fail('殘基座標不完整');
      for(const atom of residue.atoms){
        if(atom.id!==`${residue.id}:${atom.name}`||atoms.has(atom.id)||!point(atom.position)||!['C','N','O','S'].includes(atom.element))fail('原子身分或座標不符');
        if(!finite(atom.occupancy)||atom.occupancy<=0||atom.occupancy>1||!finite(atom.bFactor)||atom.bFactor<0)fail('occupancy/B 因子不符');
        atoms.set(atom.id,atom);
      }
      for(const name of ['N','CA','C','O'])if(!atoms.has(`${residue.id}:${name}`))fail(`缺少主鏈原子 ${residue.id}:${name}`);
      if(!samePoint(residue.ca,atoms.get(`${residue.id}:CA`).position))fail('Cα 與原子座標不符');
      residues.set(residue.id,residue);
    }
  }
  if(data.chains[0].sequence!==data.chains[1].sequence)fail('本例應為同源序列');
  if(!Array.isArray(data.helices)||!data.helices.length||!Array.isArray(data.sheets)||!data.sheets.length)fail('缺少二級結構註記');
  for(const row of [...data.helices,...data.sheets])if(!['A','B'].includes(row.chain)||!Number.isInteger(row.start)||!Number.isInteger(row.end)||row.start<1||row.end>162||row.start>row.end)fail('二級結構範圍不符');
  if(!Array.isArray(data.disulfides)||data.disulfides.length!==4)fail('本組裝需四個鏈內二硫鍵');
  const expectedSS=new Set(['A:66/A:160','A:106/A:119','B:66/B:160','B:106/B:119']);
  for(const bond of data.disulfides){
    const key=`${bond.a}/${bond.b}`;
    if(!expectedSS.delete(key)||residues.get(bond.a)?.name!=='CYS'||residues.get(bond.b)?.name!=='CYS'||!bond.a.startsWith(`${bond.chain}:`)||!bond.b.startsWith(`${bond.chain}:`))fail('二硫鍵配對不符');
    if(bond.atomA!==`${bond.a}:SG`||bond.atomB!==`${bond.b}:SG`||!atoms.has(bond.atomA)||!atoms.has(bond.atomB))fail('二硫鍵原子不符');
    const measured=distance(atoms.get(bond.atomA).position,atoms.get(bond.atomB).position);
    if(!finite(bond.distanceAngstrom)||Math.abs(measured-bond.distanceAngstrom)>0.002||measured<1.8||measured>2.3)fail('二硫鍵座標距離不符');
  }
  const expectedFeatures=new Set(['sequence-neighbors','alpha-helix','beta-sheet','disulfide-66-160','disulfide-106-119','unpaired-cys121','assembly-interface']);
  const expectedPairs={'sequence-neighbors':['A:54:C','A:55:N'],'alpha-helix':null,'beta-sheet':['A:54:N','A:73:O'],'disulfide-66-160':['A:66:SG','A:160:SG'],'disulfide-106-119':['A:106:SG','A:119:SG'],'unpaired-cys121':null,'assembly-interface':['B:148:O','A:148:N']};
  const kinds=new Set(['peptide','secondary','backbone-hbond','disulfide','unpaired-cysteine','interchain-contact']);
  if(!Array.isArray(data.features)||data.features.length!==expectedFeatures.size)fail('證據部位清單不完整');
  for(const feature of data.features){
    if(!expectedFeatures.delete(feature.id)||!feature.title||!feature.annotation||!feature.takeaway||!kinds.has(feature.kind))fail('證據部位身分不符');
    if(JSON.stringify(feature.atomPair)!==JSON.stringify(expectedPairs[feature.id]))fail('來源指定原子對不符');
    if(!Array.isArray(feature.residueIds)||!feature.residueIds.length||new Set(feature.residueIds).size!==feature.residueIds.length||feature.residueIds.some(id=>!residues.has(id)))fail('部位含未知殘基');
    if(feature.atomPair!==null&&(!Array.isArray(feature.atomPair)||feature.atomPair.length!==2||feature.atomPair[0]===feature.atomPair[1]||feature.atomPair.some(id=>!atoms.has(id)||!feature.residueIds.includes(id.split(':').slice(0,2).join(':')))))fail('部位距離原子不符');
  }
  if(!Array.isArray(data.limits)||data.limits.length<3||data.limits.some(note=>typeof note!=='string'||!note.trim()))fail('缺少資料界線');
  return data;
}

export function proteinFeature(dataset,id){return id==null?null:dataset.features.find(feature=>feature.id===id)||null;}
export function proteinResidue(dataset,id){return dataset.chains.flatMap(chain=>chain.residues).find(residue=>residue.id===id)||null;}

export function proteinReadout(dataset,{featureId=null,residueId='A:54',chainMode='A',viewScope='all'}={}){
  if(!['A','B','AB'].includes(chainMode))throw new RangeError('Unknown protein chain view');
  if(!['all','selection'].includes(viewScope))throw new RangeError('Unknown protein view scope');
  const feature=proteinFeature(dataset,featureId),selectedResidue=proteinResidue(dataset,residueId);
  if(featureId!==null&&!feature)throw new RangeError('Unknown protein feature');
  if(!selectedResidue)throw new RangeError('Unknown protein residue');
  let distanceAngstrom=null,sequenceSeparation=null,pairLabel='這個觀察沒有指定原子對。';
  if(feature?.atomPair){
    const atoms=atomMap(dataset),[idA,idB]=feature.atomPair;
    distanceAngstrom=distance(atoms.get(idA).position,atoms.get(idB).position);
    const [chainA,resA,nameA]=idA.split(':'),[chainB,resB,nameB]=idB.split(':');
    pairLabel=`${chainA} 鏈 ${resA} ${nameA} ↔ ${chainB} 鏈 ${resB} ${nameB}`;
    if(chainA===chainB)sequenceSeparation=Math.abs(Number(resA)-Number(resB));
  }
  const levelByKind={peptide:'一級：肽鏈的共價連接',secondary:'二級：局部主鏈構形','backbone-hbond':'二級：主鏈間的氫鍵註記',disulfide:'三級中的鏈內共價交聯','unpaired-cysteine':'殘基身分與二硫鍵配對','interchain-contact':'四級：不同肽鏈的組裝'};
  const selectedIds=new Set(feature?.residueIds??[selectedResidue.id]);
  const visibleResidues=dataset.chains.filter(chain=>chainMode==='AB'||chain.id===chainMode).flatMap(chain=>chain.residues).filter(residue=>viewScope==='all'||selectedIds.has(residue.id));
  return {feature,selectedResidue,viewScope,visibleResidueIds:visibleResidues.map(residue=>residue.id),chainCount:new Set(visibleResidues.map(residue=>residue.chain)).size,residueCount:visibleResidues.length,
    selectedResidueLabel:`${selectedResidue.chain} 鏈 ${selectedResidue.number} · ${selectedResidue.name} (${selectedResidue.code})`,
    pairLabel,distanceAngstrom,sequenceSeparation,levelLabel:feature?levelByKind[feature.kind]||'來源註記':'自由選取殘基',
    evidenceText:feature?`${feature.annotation} ${feature.takeaway}`:'點選的是來源結構的一個殘基。單一殘基或畫面顏色不能獨自證明蛋白的溶液構形與反應。'};
}

export const PROTEIN_TASKS=Object.freeze([
  {id:'ss',prompt:'A66–A160 的鏈內二硫鍵若被完全還原，且沒有肽鍵水解，會新增 N／C 端嗎？',options:[{value:'no-new-termini',label:'不新增肽鏈末端；S–S 轉為硫醇'},{value:'two-chains',label:'肽鏈必定切成兩條'}],answer:'no-new-termini',feedback:'此二硫鍵連接同一條鏈內兩個 Cys。只還原 S–S 不切肽骨架；3D 快照沒有模擬還原後的構形。'},
  {id:'secondary',prompt:'A54–61 與 A66–75 的 β 區段在空間相鄰，表示它們是兩條不同肽鏈嗎？',options:[{value:'one-chain',label:'不是；它們仍在同一條 A 鏈'},{value:'two-chains',label:'是；每個 β 區段都是一條鏈'}],answer:'one-chain',feedback:'一條肽鏈可以有多段二級結構。沿序列追蹤到同一條 A 鏈，不能把每個 β 區段各算一條蛋白鏈。'},
  {id:'assembly',prompt:'6FXB 不對稱單位列 A、B、C、D 四鏈，能直接宣稱食品中都是四聚體嗎？',options:[{value:'no',label:'不能；本課採有來源的 A/B 二聚體組裝'},{value:'tetramer',label:'能；座標有四鏈就證明四聚體'}],answer:'no',feedback:'不對稱單位是晶體學範圍。此 entry 的 assembly 1 是 A/B 二聚體；溶液證據也受研究條件限制，不涵蓋所有乳品配方。'},
  {id:'time',prompt:'旋轉鏡頭或隱藏 B 鏈，是否已經模擬蛋白變性／解離？',options:[{value:'display-only',label:'只是改變觀察方式，原座標未改'},{value:'reaction',label:'是；畫面變化就是分子反應歷程'}],answer:'display-only',feedback:'這是固定晶體座標的觀察操作。沒有時間、熱運動、質子化平衡、解離比例或處理後構形，不能當作變性或解離動畫。'},
]);

const number=value=>finite(value)?Number(value.toFixed(3)).toString():'未指定';
const written=value=>typeof value==='string'&&value.trim()?value:'（未填）';
export function proteinSummary(dataset,draft){
  const readout=proteinReadout(dataset,draft),source=dataset.source;
  const colorName=mode=>mode==='element'?'原子元素':mode==='secondary'?'二級結構註記':mode==='chain'?'不同肽鏈':'未記錄著色';
  const scopeName=scope=>scope==='selection'?'僅選定殘基':scope===undefined||scope==='all'?'完整分子（目前顯示鏈）':'未記錄範圍';
  const observations=Array.isArray(draft.observations)?draft.observations:[];
  const rows=observations.map((observation,index)=>{
    const selection=observation.selection||observation;
    const stored=observation.readout||observation;
    let current=null;
    try{current=proteinReadout(dataset,selection);}catch{/* Preserve supplied visible record if a field was intentionally absent. */}
    const name=observation.featureTitle||stored.featureTitle||current?.feature?.title||'自由選殘基';
    return `${index+1}. ${name}；${stored.selectedResidueLabel||current?.selectedResidueLabel||selection.residueId||'未指定殘基'}；顯示鏈 ${selection.chainMode||'未記錄'}；範圍：${scopeName(selection.viewScope??observation.viewScope??stored.viewScope)}；可見 ${stored.chainCount??current?.chainCount??'未記錄'} 條鏈／${stored.residueCount??current?.residueCount??'未記錄'} 個殘基；著色：${colorName(selection.colorMode??observation.colorMode??stored.colorMode)}\n   ${stored.pairLabel||current?.pairLabel||'沒有指定原子對'}；座標距離 ${number(stored.distanceAngstrom??current?.distanceAngstrom)} Å；同鏈序列編號差 ${number(stored.sequenceSeparation??current?.sequenceSeparation)}`;
  });
  const claims=PROTEIN_TASKS.map(task=>`${task.prompt}\n自己的判斷：${task.options.find(option=>option.value===draft.claims?.[task.id])?.label||'（未選）'}`);
  return [
    '食品蛋白結構與證據',
    `來源：${source.title}；PDB ${source.entry}／assembly ${source.assemblyId}；${source.url}`,
    `量測：${source.method}；解析度 ${source.resolutionAngstrom} Å；Rfree ${source.rFree}；${source.conditionNote}`,
    `編號：${source.numberingNote}`,
    '顯示身分：來源重原子球棍；球＝原子、棍＝化學鍵、虛線＝來源註記的非共價配對。原檔未提供氫原子，未另行添加。固定晶體座標，非食品全相、反應後構形或運動軌跡。',
    `目前顯示：${draft.chainMode}；${readout.selectedResidueLabel}；${readout.feature?.title||'自由選取'}；範圍：${scopeName(draft.viewScope)}；可見 ${readout.chainCount} 條鏈／${readout.residueCount} 個殘基；著色：${colorName(draft.colorMode)}。局部顯示或隱藏另一條鏈不代表斷鍵、解離。`,
    `\n選定觀察：\n${rows.length?rows.join('\n'):'（尚未記錄）'}`,
    `\n操作前預測：\n${written(draft.prediction)}`,
    `\n操作後解釋與修訂：\n${written(draft.revision)}`,
    `\n結構判斷：\n${claims.join('\n')}`,
    '\n界線：二硫鍵與主鏈氫鍵採来源註記；座標距離不是鍵能，也不能由一個近接距離判定反應或溶液分率。未保存的操作只在本頁生命週期暫留。',
  ].join('\n');
}
