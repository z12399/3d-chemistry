// Verify the supplied free-sugar endpoints. This gate does not construct a
// mechanism, a coordinate path, or an identity map for regenerated hydrogens.
const ids={glucose:'glucose-open',fructose:'fructose-open'};
const heavyIds=['C1','C2','C3','C4','C5','C6','O1','O2','O3','O4','O5','O6'];
const key=(a,b)=>[a,b].sort().join('\0');
const subtract=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>Math.hypot(...a);
const determinant=(a,b,c)=>dot(a,cross(b,c));
const fail=reason=>{throw new Error(reason);};

function endpoint(model,role){
  if(model?.id!==ids[role])fail('需要已指定的開鏈 Glc 與 Fru 端點。');
  if(model.formula!=='C6H12O6'||!Array.isArray(model.atoms)||model.atoms.length!==24||!Array.isArray(model.bonds)||model.bonds.length!==23)fail('端點的原子數、分子式或完整鍵圖不符。');
  const atoms=new Map(),bonds=new Map(),neighbors=new Map(),counts={C:0,H:0,O:0};
  for(const atom of model.atoms){
    if(!atom||typeof atom.id!=='string'||!atom.id.trim()||atom.id.includes('\0')||atoms.has(atom.id)||!Object.hasOwn(counts,atom.element))fail('原子編號或元素未能核對。');
    if(atom.formalCharge!==0||(atom.charge!==undefined&&atom.charge!==0))fail('端點必須逐原子核對為中性。');
    if(!Array.isArray(atom.position)||atom.position.length!==3||!atom.position.every(Number.isFinite))fail('端點座標缺失或不是有限數值。');
    atoms.set(atom.id,atom);neighbors.set(atom.id,[]);counts[atom.element]++;
  }
  if(counts.C!==6||counts.H!==12||counts.O!==6)fail('實際原子元素數不符 C6H12O6。');
  for(const id of heavyIds)if(atoms.get(id)?.element!==id[0])fail('糖鏈 C1–C6／O1–O6 的身分未能核對。');
  for(const bond of model.bonds){
    if(!bond||!atoms.has(bond.a)||!atoms.has(bond.b)||bond.a===bond.b||![1,2].includes(bond.order))fail('鍵端點或鍵級未能核對。');
    const bondKey=key(bond.a,bond.b);if(bonds.has(bondKey))fail('鍵圖含重複連接。');
    bonds.set(bondKey,bond.order);neighbors.get(bond.a).push(bond.b);neighbors.get(bond.b).push(bond.a);
  }
  for(const [id,atom]of atoms){
    const adjacent=neighbors.get(id),valence=adjacent.reduce((sum,other)=>sum+bonds.get(key(id,other)),0);
    if(valence!=={C:4,O:2,H:1}[atom.element])fail('完整鍵圖的价態未能核對。');
    if(atom.element==='H'&&(adjacent.length!==1||bonds.get(key(id,adjacent[0]))!==1||(atom.attachedTo!==undefined&&atom.attachedTo!==adjacent[0])))fail('氫的實際局部連接未能核對。');
  }
  const seen=new Set(),pending=['C1'];
  while(pending.length){const id=pending.pop();if(seen.has(id))continue;seen.add(id);pending.push(...neighbors.get(id));}
  if(seen.size!==24)fail('端點鍵圖不是單一連通自由糖。');
  const expected=new Map();
  for(let n=1;n<6;n++)expected.set(key(`C${n}`,`C${n+1}`),1);
  for(let n=1;n<=6;n++)expected.set(key(`C${n}`,`O${n}`),n===(role==='glucose'?1:2)?2:1);
  let heavyBondCount=0;
  for(const bond of model.bonds){
    if(atoms.get(bond.a).element==='H'||atoms.get(bond.b).element==='H')continue;
    heavyBondCount++;if(expected.get(key(bond.a,bond.b))!==bond.order)fail('糖鏈或 C1–O1／C2–O2 端點鍵級不符。');
  }
  if(heavyBondCount!==expected.size)fail('重原子連接不符開鏈端點。');
  const hydrogens=id=>neighbors.get(id).filter(other=>atoms.get(other).element==='H');
  for(let n=1;n<=6;n++){
    const carbon=`C${n}`,oxygen=`O${n}`,carbonyl=n===(role==='glucose'?1:2),oh=hydrogens(oxygen);
    if(carbonyl){if(neighbors.get(oxygen).length!==1||oh.length)fail('羰基氧的實際連接不符。');}
    else if(neighbors.get(oxygen).length!==2||oh.length!==1||bonds.get(key(oxygen,oh[0]))!==1)fail('醇氧缺少實際 O–H 單鍵。');
    const requiredH=n===1?(role==='glucose'?1:2):n===2?(role==='glucose'?1:0):n===6?2:1;
    if(hydrogens(carbon).length!==requiredH)fail('碳的實際氫鄰接不符端點官能基。');
  }
  return {atoms,bonds,neighbors,hydrogens,model};
}

function tetrahedron(g,center,first,second,oxygen,expectedSign){
  const hydrogen=g.hydrogens(center);
  if(hydrogen.length!==1)fail(`${center} 的四面體鄰居未能核對。`);
  const neighborIds=[first,second,oxygen,hydrogen[0]],p=neighborIds.map(id=>g.atoms.get(id).position);
  const volume=determinant(subtract(p[0],p[3]),subtract(p[1],p[3]),subtract(p[2],p[3]));
  // Reviewed D-sugar neighbor order supplies the handedness independently of
  // the optional CIP annotation. >1 Å³ excludes flattened/degenerate centers.
  if(!Number.isFinite(volume)||Math.abs(volume)<=1||Math.sign(volume)!==expectedSign)fail(`${center} 的 D-糖立體配置或非平面幾何未能核對。`);
  return {atomId:center,neighborIds,determinantAngstrom3:volume,sign:Math.sign(volume)};
}

function planarFructoseC2(g){
  const center=g.atoms.get('C2').position,neighborIds=['C1','C3','O2'],v=neighborIds.map(id=>subtract(g.atoms.get(id).position,center));
  const lengths=v.map(norm),normalized=determinant(...v)/lengths.reduce((product,x)=>product*x,1);
  const normal=cross(v[0],v[1]),height=Math.abs(dot(v[2],normal))/norm(normal);
  // Near-planarity uses tolerances for optimized/rounded coordinates. Three
  // collinear or overlapping neighbors must not masquerade as a carbonyl.
  for(const [a,b]of [[0,1],[0,2],[1,2]]){
    const cosine=dot(v[a],v[b])/(lengths[a]*lengths[b]);
    if(!Number.isFinite(cosine)||cosine<Math.cos(5*Math.PI/6)||cosine>0)fail('Fru C2 的三鄰居不是可核對的羰基幾何。');
  }
  if(!Number.isFinite(normalized)||!Number.isFinite(height)||Math.abs(normalized)>0.05||height>0.1)fail('Fru C2 尚未核對為近乎平面的羰基端點。');
  return {atomId:'C2',neighborIds,normalizedDeterminant:normalized,planeDistanceAngstrom:height};
}

function checkBondLengths(g){
  for(const bond of g.model.bonds){
    const length=norm(subtract(g.atoms.get(bond.a).position,g.atoms.get(bond.b).position));
    if(!Number.isFinite(length)||length<=0.75||length>=2.1)fail('端點的實際成鍵座標退化或超出代表結構範圍。');
  }
}

export function giEndpointComparison(glucose,fructose){
  try{
    const g=endpoint(glucose,'glucose'),f=endpoint(fructose,'fructose');
    const centers=[['C3','C2','C4','O3',1],['C4','C3','C5','O4',-1],['C5','C4','C6','O5',-1]];
    const retainedStereo=centers.map(args=>{
      const glc=tetrahedron(g,...args),fru=tetrahedron(f,...args);
      if(glc.sign!==fru.sign)fail(`${args[0]} 的端點立體配置不一致。`);
      return {atomId:args[0],glucose:glc,fructose:fru};
    });
    const glucoseC2=tetrahedron(g,'C2','C1','C3','O2',-1),fructoseC2=planarFructoseC2(f);
    checkBondLengths(g);checkBondLengths(f);
    return {
      available:true,
      models:{glucose,fructose},
      context:{verified:true,glucoseId:ids.glucose,fructoseId:ids.fructose},
      evidence:{
        atomCount:24,formula:'C6H12O6',charge:0,heavyAtomIds:[...heavyIds],
        bondChanges:[{atomIds:['C1','O1'],glucoseOrder:2,fructoseOrder:1},{atomIds:['C2','O2'],glucoseOrder:1,fructoseOrder:2}],
        retainedStereo,c2:{glucose:glucoseC2,fructose:fructoseC2},
        caveat:'只比較兩個自由糖代表端點的編號位置、鍵級與局部立體配置；不是氫移位中間體、過渡態、氫同位素映射或反應軌跡。',
      },
    };
  }catch(error){
    return {available:false,reason:`未能核對 Glc／Fru 端點：${error instanceof Error?error.message:'端點資料不完整。'}`};
  }
}
