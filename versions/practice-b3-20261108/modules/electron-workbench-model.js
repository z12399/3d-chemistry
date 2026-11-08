/** Original, restricted Lewis electron-pair bookkeeping; not a reaction engine.
 * Inputs are complete explicit-H CHON graphs with integer formal charges.
 * A passed ledger does not establish stability, mechanism, geometry or rate.
 */
const freeze=Object.freeze;
export const ELECTRON_WORKBENCH_LIMITS=freeze({
  maxArrows:8,maxAtoms:500,maxBonds:2000,
  valenceElectrons:freeze({H:1,C:4,N:5,O:6}),
  supportedArrowTypes:freeze(['atom-to-atom','atom-to-incident-bond','bond-to-endpoint','bond-to-adjacent-bond']),
});
export const ELECTRON_WORKBENCH_SOURCES=freeze([
  freeze({id:'electron-polar',title:'OpenStax Organic Chemistry §6.3 · Polar Reactions',url:'https://openstax.org/books/organic-chemistry/pages/6-3-polar-reactions',scope:'成鍵使用電子對、異裂時電子對留在一端；完整箭頭代表兩電子。'}),
  freeze({id:'electron-charge',title:'OpenStax Chemistry 2e §7.4 · Formal Charges and Resonance',url:'https://openstax.org/books/chemistry-2e/pages/7-4-formal-charges-and-resonance',scope:'形式電荷 = 價電子 − 非鍵電子 − 鍵電子數的一半；形式電荷不是實際電荷分布。'}),
  freeze({id:'electron-lewis',title:'OpenStax Chemistry 2e §7.3 · Lewis Symbols and Structures',url:'https://openstax.org/books/chemistry-2e/pages/7-3-lewis-symbols-and-structures',scope:'CHON 價電子、H 雙電子及第二週期八隅體；本模型排除自由基、芳香鍵與超價元素。'}),
  freeze({id:'electron-deficient',title:'OpenStax Organic Chemistry §6.4 · Carbocation bookkeeping',url:'https://openstax.org/books/organic-chemistry/pages/6-4-an-example-of-a-polar-reaction-addition-of-hbr-to-ethylene',scope:'碳正離子可有六個價層電子；不能要求每個候選原子一定填滿八隅體。只採缺電子觀念，不納入該頁完整反應。'}),
]);

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const idPattern=/^[A-Za-z][A-Za-z0-9_.]{0,79}$/;
const pair=(a,b)=>[a,b].sort().join('-');
const issue=(code,message,extra={})=>({code,...extra,message});
const chargeOf=atom=>atom.formalCharge??atom.charge;
const valence=ELECTRON_WORKBENCH_LIMITS.valenceElectrons;
const unsupportedCounts=['implicitH','implicitHs','implicitHydrogens','numImplicitHs','hydrogenCount','explicitHs','numExplicitHs'];
const radicalCounts=['radicalElectrons','numRadicalElectrons','unpairedElectrons'];

function declarationIssues(value,extra={}){
  const issues=[];
  for(const key of ['aromatic','isAromatic'])if(own(value,key)&&value[key]!==false&&value[key]!==0)issues.push(issue('unsupported-aromatic','不支援芳香或未明確標示的芳香電子表示。',extra));
  for(const key of unsupportedCounts)if(own(value,key)&&value[key]!==0)issues.push(issue('unsupported-implicit-hydrogens','所有氫必須是圖中獨立原子，不支援省略或壓縮氫數。',extra));
  for(const key of radicalCounts)if(own(value,key)&&value[key]!==0)issues.push(issue('unsupported-radical','此工作台只處理成對電子，不支援自由基。',extra));
  if(own(value,'explicitHydrogens')&&value.explicitHydrogens!==true)issues.push(issue('unsupported-implicit-hydrogens','輸入必須明確包含全部氫原子。',extra));
  return issues;
}

function shellIssues(row){
  const issues=[],extra={atomId:row.atomId};
  if(row.nonbondingElectrons<0)issues.push(issue('negative-nonbonding-electrons',`${row.atomId} 的非鍵電子數不能為負。`,extra));
  else if(row.nonbondingElectrons%2!==0)issues.push(issue('unsupported-odd-electrons',`${row.atomId} 有未成對電子，超出本模型範圍。`,extra));
  if(row.shellElectrons>(row.element==='H'?2:8))issues.push(issue(row.element==='H'?'duet-exceeded':'octet-exceeded',`${row.atomId} 超過${row.element==='H'?'雙電子':'八隅體'}上限（目前 ${row.shellElectrons} 電子）。`,extra));
  return issues;
}

function inspect(state){
  const issues=[],atoms=new Map(),bonds=new Map();
  if(!isObject(state)||!Array.isArray(state.atoms)||!Array.isArray(state.bonds))return {issues:[issue('invalid-state-schema','需要包含 atoms 與 bonds 陣列的完整電子圖。')]};
  if(state.atoms.length<1||state.atoms.length>ELECTRON_WORKBENCH_LIMITS.maxAtoms||state.bonds.length>ELECTRON_WORKBENCH_LIMITS.maxBonds)return {issues:[issue('state-size-limit','電子圖大小超出支援範圍。')]};
  if(own(state,'schema')&&state.schema!=='electron-workbench-state/v1'||own(state,'schemaVersion')&&state.schemaVersion!==1)issues.push(issue('unsupported-state-schema','不支援這個電子圖版本。'));
  issues.push(...declarationIssues(state));
  if(isObject(state.metadata))issues.push(...declarationIssues(state.metadata));
  for(const atom of state.atoms){
    if(!isObject(atom)||typeof atom.id!=='string'||!idPattern.test(atom.id)){issues.push(issue('invalid-atom-schema','原子需要不含連字號的有效 id。'));continue;}
    const extra={atomId:atom.id};
    if(atoms.has(atom.id)){issues.push(issue('duplicate-atom-id','原子 id 不可重複。',extra));continue;}
    if(typeof atom.element!=='string'||!own(valence,atom.element))issues.push(issue('unsupported-element','本工作台僅支援 C、H、O、N。',extra));
    const fc=chargeOf(atom);
    if(!Number.isSafeInteger(fc))issues.push(issue('invalid-formal-charge','每個原子必須提供整數 formalCharge 或 charge。',extra));
    if(own(atom,'formalCharge')&&own(atom,'charge')&&atom.formalCharge!==atom.charge)issues.push(issue('conflicting-charge-fields','formalCharge 與 charge 不一致，不能猜測採用哪個值。',extra));
    if(own(atom,'formalCharge')&&!Number.isSafeInteger(atom.formalCharge)||own(atom,'charge')&&!Number.isSafeInteger(atom.charge))issues.push(issue('invalid-formal-charge','電荷欄位必須是有限整數。',extra));
    if(own(atom,'position')&&(!Array.isArray(atom.position)||atom.position.length!==3||atom.position.some(v=>typeof v!=='number'||!Number.isFinite(v))))issues.push(issue('invalid-position','提供的座標必須是三個有限數值。',extra));
    issues.push(...declarationIssues(atom,extra));atoms.set(atom.id,atom);
  }
  for(const bond of state.bonds){
    if(!isObject(bond)||!atoms.has(bond.a)||!atoms.has(bond.b)||bond.a===bond.b){issues.push(issue('invalid-bond-endpoints','鍵必須連接圖中兩個不同原子。'));continue;}
    const key=pair(bond.a,bond.b);
    if(bonds.has(key)){issues.push(issue('duplicate-bond','同一對原子只能有一筆鍵與明確鍵級。',{bond:key}));continue;}
    if(!Number.isInteger(bond.order)||bond.order<1||bond.order>3)issues.push(issue('unsupported-bond-order','初圖只支援整數單、雙、三鍵。',{bond:key}));
    if(own(bond,'type')&&bond.type!==({1:'single',2:'double',3:'triple'})[bond.order])issues.push(issue('unsupported-bond-type','不支援這種鍵型或與鍵級矛盾的鍵型。',{bond:key}));
    issues.push(...declarationIssues(bond,{bond:key}));bonds.set(key,{a:bond.a,b:bond.b,order:bond.order});
  }
  if(issues.length)return {issues};
  const orderSums=new Map([...atoms.keys()].map(id=>[id,0]));
  for(const b of bonds.values()){orderSums.set(b.a,orderSums.get(b.a)+b.order);orderSums.set(b.b,orderSums.get(b.b)+b.order);}
  const electrons=[...atoms.values()].map(a=>{
    const bondOrderSum=orderSums.get(a.id),formalCharge=chargeOf(a),nonbondingElectrons=valence[a.element]-formalCharge-bondOrderSum;
    return {atomId:a.id,element:a.element,valenceElectrons:valence[a.element],bondOrderSum,nonbondingElectrons,formalCharge,shellElectrons:nonbondingElectrons+2*bondOrderSum};
  });
  for(const row of electrons){
    issues.push(...shellIssues(row));
    const atom=atoms.get(row.atomId);
    if(own(atom,'nonbondingElectrons')&&atom.nonbondingElectrons!==row.nonbondingElectrons)issues.push(issue('conflicting-electron-count','明示的非鍵電子數與形式電荷、鍵級不一致。',{atomId:row.atomId}));
  }
  const totalCharge=electrons.reduce((n,a)=>n+a.formalCharge,0);
  const totalValenceElectrons=electrons.reduce((n,a)=>n+a.nonbondingElectrons,0)+2*[...bonds.values()].reduce((n,b)=>n+b.order,0);
  return {issues,atoms,bonds,electrons,totalCharge,totalValenceElectrons};
}

/** No inference of hidden H or chemistry from names/SMILES. Invalid inputs are
 * returned as issues, not thrown as errors from user interaction. */
export function inspectElectronState(state){
  const r=inspect(state);
  return {ok:r.issues.length===0,issues:r.issues,electrons:r.electrons??[],totalCharge:r.totalCharge??null,totalValenceElectrons:r.totalValenceElectrons??null};
}

const emptyResult=issues=>({ok:false,issues,candidate:null,changes:[],charges:[],matchesReference:null,difference:null});
function endpoint(point,initial){
  if(typeof point!=='string')return null;
  if(initial.atoms.has(point))return {type:'atom',id:point,key:point};
  const ids=point.split('-');
  if(ids.length===2&&ids[0]!==ids[1]&&ids.every(id=>initial.atoms.has(id)))return {type:'bond',a:ids[0],b:ids[1],key:pair(...ids)};
  return null;
}

function compareGraphs(candidate,reference){
  const atoms=[],bonds=[],charges=[];
  for(const id of [...new Set([...candidate.atoms.keys(),...reference.atoms.keys()])].sort()){
    const a=candidate.atoms.get(id),b=reference.atoms.get(id);
    if(!a||!b||a.element!==b.element)atoms.push({atomId:id,candidateElement:a?.element??null,referenceElement:b?.element??null});
    if(a&&b&&chargeOf(a)!==chargeOf(b))charges.push({atomId:id,candidateCharge:chargeOf(a),referenceCharge:chargeOf(b)});
  }
  for(const key of [...new Set([...candidate.bonds.keys(),...reference.bonds.keys()])].sort()){
    const a=candidate.bonds.get(key)?.order??0,b=reference.bonds.get(key)?.order??0;
    if(a!==b){const [from,to]=key.split('-');bonds.push({a:from,b:to,candidateOrder:a,referenceOrder:b});}
  }
  return {atoms,bonds,charges};
}

/** Batch from the ORIGINAL electron pools: a pair received in this batch cannot
 * be borrowed as a source in the same batch. The reference never determines
 * candidate bonds, electron counts, charges or validity.
 * Arrows: [source, target][]; each endpoint is an atom ID or explicit 'A-B'.
 * A bond source must exist initially. Bond -> bond requires exactly one shared
 * atom; the target bond can be new. It lowers the source order and raises the
 * target order, without changing any nonbonding electron pool. An atom source
 * pointing to an incident bond aliases its arrow to the OTHER endpoint atom.
 * A bare bond -> non-endpoint atom remains ambiguous and is never inferred
 * from a reference, valence, labels, coordinates or the order of the batch.
 */
export function evaluateElectronArrows(before,arrows,options={}){
  const initial=inspect(before);
  if(initial.issues.length)return emptyResult(initial.issues);
  if(!isObject(options))return emptyResult([issue('invalid-options','選項必須是物件。')]);
  let reference=null;
  if(own(options,'referenceAfter')){
    reference=inspect(options.referenceAfter);
    if(reference.issues.length)return emptyResult(reference.issues.map(i=>({...i,code:'reference-'+i.code,message:'參考結構無法比較：'+i.message})));
  }
  if(!Array.isArray(arrows))return emptyResult([issue('invalid-arrows-schema','箭頭必須是 [來源,目的地] 的陣列。')]);
  if(arrows.length<1||arrows.length>ELECTRON_WORKBENCH_LIMITS.maxArrows)return emptyResult([issue('arrow-count',`一次請提交 1 至 ${ELECTRON_WORKBENCH_LIMITS.maxArrows} 支電子對箭頭。`)]);
  const issues=[],seen=new Set(),transfers=[];
  for(let index=0;index<arrows.length;index++){
    const arrow=arrows[index],extra={arrowIndex:index};
    if(!Array.isArray(arrow)||arrow.length!==2){issues.push(issue('invalid-arrow-schema','每支箭頭必須恰有來源與目的地。',extra));continue;}
    const from=endpoint(arrow[0],initial);let to=endpoint(arrow[1],initial);
    if(!from||!to){issues.push(issue('unknown-electron-point','箭頭包含不存在的原子或不支援的位點格式。',extra));continue;}
    if(from.type==='bond'&&!initial.bonds.has(from.key)){issues.push(issue('missing-source-bond','來源鍵在初始結構不存在，不能借用本次才形成的鍵。',{...extra,bond:from.key}));continue;}
    if(from.type==='atom'&&to.type==='bond'){
      if(from.id!==to.a&&from.id!==to.b){issues.push(issue('unsupported-arrow-type','孤對指向的目標鍵必須包含來源原子，才能明確指定成鍵的另一端。',extra));continue;}
      to=endpoint(from.id===to.a?to.b:to.a,initial);
    }
    if(from.type==='bond'&&to.type==='atom'&&to.id!==from.a&&to.id!==from.b){issues.push(issue('unsupported-arrow-type','鍵指向非端點原子時無法確定哪一端成鍵；請明示包含來源鍵其中一端的目標鍵。',extra));continue;}
    if(from.type==='bond'&&to.type==='bond'){
      const shared=[from.a,from.b].filter(id=>id===to.a||id===to.b).length;
      if(shared!==1){issues.push(issue('unsupported-arrow-type',shared===2?'來源鍵與目標鍵不能相同。':'來源鍵與目標鍵必須且只能共享一個原子。',extra));continue;}
    }
    if(from.type==='atom'&&from.id===to.id){issues.push(issue('self-arrow','來源與目的地不能是同一原子。',extra));continue;}
    const key=JSON.stringify([from.type,from.key,to.type,to.key]);
    if(seen.has(key)){issues.push(issue('duplicate-arrow','同一支電子對箭頭重複了；請先移除重複項。',extra));continue;}
    seen.add(key);transfers.push({from,to,index});
  }
  if(issues.length)return emptyResult(issues);
  const byAtom=new Map(initial.electrons.map(a=>[a.atomId,a]));
  const spentAtoms=new Map(),spentBonds=new Map(),nonbondDelta=new Map(),bondDelta=new Map();
  const add=(map,key,amount)=>map.set(key,(map.get(key)??0)+amount);
  for(const {from,to} of transfers){
    if(from.type==='atom'){
      add(spentAtoms,from.id,2);add(nonbondDelta,from.id,-2);add(bondDelta,pair(from.id,to.id),1);
    }else{
      add(spentBonds,from.key,1);add(bondDelta,from.key,-1);
      if(to.type==='atom')add(nonbondDelta,to.id,2);
      else add(bondDelta,to.key,1);
    }
  }
  for(const [id,spent] of spentAtoms)if(spent>byAtom.get(id).nonbondingElectrons)issues.push(issue('insufficient-atom-electrons',`${id} 初始只有 ${byAtom.get(id).nonbondingElectrons} 個非鍵電子，不能提供 ${spent} 個。`,{atomId:id}));
  for(const [key,spent] of spentBonds)if(spent>initial.bonds.get(key).order)issues.push(issue('insufficient-bond-electrons',`${key} 初始只有 ${initial.bonds.get(key).order} 對鍵電子，不能提供 ${spent} 對。`,{bond:key}));
  if(issues.length)return emptyResult(issues);
  const newBonds=[],changes=[],sums=new Map([...initial.atoms.keys()].map(id=>[id,0]));
  for(const key of [...new Set([...initial.bonds.keys(),...bondDelta.keys()])].sort()){
    const from=initial.bonds.get(key)?.order??0,to=from+(bondDelta.get(key)??0),[a,b]=key.split('-');
    if(!Number.isInteger(to)||to<0||to>3){issues.push(issue('invalid-result-bond-order',`${key} 的結果鍵級 ${to} 不在 0–3 範圍。`,{bond:key}));continue;}
    if(to){newBonds.push({a,b,order:to});sums.set(a,sums.get(a)+to);sums.set(b,sums.get(b)+to);}
    if(to!==from)changes.push({a,b,pair:`${a}–${b}`,from,to,kind:from===0?'formed':to===0?'broken':'order'});
  }
  if(issues.length)return emptyResult(issues);
  const charges=[],newAtoms=[];
  let totalCharge=0,totalValenceElectrons=2*newBonds.reduce((n,b)=>n+b.order,0);
  for(const atom of before.atoms){
    const old=byAtom.get(atom.id),nonbondingElectrons=old.nonbondingElectrons+(nonbondDelta.get(atom.id)??0),bondOrderSum=sums.get(atom.id);
    const formalCharge=valence[atom.element]-nonbondingElectrons-bondOrderSum,shellElectrons=nonbondingElectrons+2*bondOrderSum;
    issues.push(...shellIssues({atomId:atom.id,element:atom.element,nonbondingElectrons,shellElectrons}));
    totalCharge+=formalCharge;totalValenceElectrons+=nonbondingElectrons;
    if(formalCharge!==old.formalCharge)charges.push({atomId:atom.id,from:old.formalCharge,to:formalCharge});
    newAtoms.push({id:atom.id,element:atom.element,...(atom.position?{position:[...atom.position]}:{}),formalCharge,charge:formalCharge});
  }
  if(totalCharge!==initial.totalCharge||totalValenceElectrons!==initial.totalValenceElectrons)issues.push(issue('electron-conservation-failed','電子與總電荷收支不守恆，不能顯示為有效候選。'));
  if(issues.length)return emptyResult(issues);
  const candidate={schema:'electron-workbench-state/v1',id:'electron-workbench-candidate',name:'電子對形式記帳候選',atoms:newAtoms,bonds:newBonds,rotatableBonds:[],
    metadata:{isTrajectory:false,displaySchematic:true,explicitHydrogens:true,method:'restricted CHON Lewis electron-pair bookkeeping',geometry:'unchanged input coordinates; no geometry optimization',stereochemistry:'not evaluated'}};
  const difference=reference?compareGraphs(inspect(candidate),reference):null;
  return {ok:true,issues:[],candidate,changes,charges,matchesReference:difference?!difference.atoms.length&&!difference.bonds.length&&!difference.charges.length:null,difference};
}
