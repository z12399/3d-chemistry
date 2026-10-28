/**
 * A deterministic chemical storyboard, not a trajectory or a binding pose.
 * The state-0 sugar rings and all unchanged fragments are rigid templates.
 * Only reaction participants move; AH C1 turns at a fixed C–H distance.
 */
export const LACTASE_REACTION_SEGMENTS=Object.freeze([
  {id:'approach',start:0,end:.12,stageId:'binding',label:'乳糖與催化端基聚近',selected:['AC1','BO4','E1749Oreact','E1538Oreact']},
  {id:'activation',start:.12,end:.23,stageId:'binding',label:'對照要切的 Gal C1–橋氧鍵',selected:['AC1','BO4','E1749Oreact','E1538Hacid']},
  {id:'first-substitution',start:.23,end:.38,stageId:'glycosylation',label:'第一次取代：橋氧離去，E1749 接到 Gal C1',selected:['AC1','BO4','E1749Oreact','E1538Hacid']},
  {id:'glucose-release',start:.38,end:.50,stageId:'glycosylation',label:'α 共價中間體保留，葡萄糖離開',selected:['AC1','E1749Oreact','BO4','BC4']},
  {id:'water-approach',start:.50,end:.64,stageId:'deglycosylation',label:'水向 Gal C1 聚近，E1538 準備接受質子',selected:['AC1','E1749Oreact','Ow','Hwa','E1538Oreact']},
  {id:'second-substitution',start:.64,end:.78,stageId:'deglycosylation',label:'第二次取代：水氧接到 Gal C1，E1749 解除連接',selected:['AC1','E1749Oreact','Ow','Hwa','E1538Oreact']},
  {id:'product-release',start:.78,end:1,stageId:'products',label:'β 半乳糖與葡萄糖釋出，催化端基再生',selected:['AC1','Ow','BO4','BC4','E1749Oreact','E1538Oreact']}
].map(segment=>Object.freeze({...segment,selected:Object.freeze(segment.selected)})));

export const LACTASE_REACTION_BOOKMARKS=Object.freeze({binding:0,glycosylation:.46,deglycosylation:.61,products:1});
export const LACTASE_REACTION_SCOPE='固定糖環與片段的連續化學教學分鏡；分鏡進度不是時間或反應速率，補間座標不是反應軌跡、過渡態、人體結合姿勢或實測構象。';

const cache=new WeakMap();
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const scale=(a,s)=>a.map(v=>v*s);
const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const length=a=>Math.hypot(...a);
const unit=a=>{const n=length(a);if(n<1e-8)throw new TypeError('無法建立乳糖反應片段的參考方向。');return scale(a,1/n);};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const x=clamp(value);return x*x*(3-2*x);};
const phase=(p,start,end)=>smooth((p-start)/(end-start));
const key=bond=>[bond.a,bond.b].sort().join('|');
const byId=state=>new Map(state.atoms.map(atom=>[atom.id,atom]));

function basis(origin,p1,p2){
  const x=unit(sub(p1,origin)),z=unit(cross(x,sub(p2,origin))),y=cross(z,x);
  return {origin,x,y,z};
}
function toLocal(position,frame){const v=sub(position,frame.origin);return [dot(v,frame.x),dot(v,frame.y),dot(v,frame.z)];}
function fromLocal(position,frame){return add(frame.origin,add(scale(frame.x,position[0]),add(scale(frame.y,position[1]),scale(frame.z,position[2]))));}
function moveBetween(position,source,target){return fromLocal(toLocal(position,source),target);}
function sugarFrame(atoms,prefix){return basis(atoms.get(`${prefix}C2`).position,atoms.get(`${prefix}C3`).position,atoms.get(`${prefix}C5`).position);}
function slerpDirection(a,b,t){
  if(t<=0)return [...a];if(t>=1)return [...b];
  const cosine=Math.max(-1,Math.min(1,dot(a,b)));
  if(cosine>.9995)return unit(mix(a,b,t));
  if(cosine<-.9995){const perpendicular=unit(cross(a,Math.abs(a[0])<.8?[1,0,0]:[0,1,0]));return add(scale(a,Math.cos(Math.PI*t)),scale(perpendicular,Math.sin(Math.PI*t)));}
  const angle=Math.acos(cosine),sine=Math.sin(angle);
  return add(scale(a,Math.sin((1-t)*angle)/sine),scale(b,Math.sin(t*angle)/sine));
}

function unwrap(input){
  const model=input?.mechanisms?.[0]||input;
  if(!model||!Array.isArray(model.states)||model.states.length!==3||model.isTrajectory!==false||model.proteinGeometry!==false)throw new TypeError('連續分鏡需要已核對的人類乳糖酶有限化學三態模型。');
  return model;
}

/** Keeps source data immutable. Generated coordinates are expressly storyboard coordinates. */
export function createLactaseReactionTimeline(input){
  if(input?.schema==='lactase-reaction-timeline/v1')return input;
  const model=unwrap(input);if(cache.has(model))return cache.get(model);
  const states=model.states,maps=states.map(byId),identity=states[0].atoms.map(atom=>`${atom.id}:${atom.element}`).sort().join('|');
  if(states.some(state=>state.atoms.length!==69||state.atoms.map(atom=>`${atom.id}:${atom.element}`).sort().join('|')!==identity||state.atoms.some(atom=>!Array.isArray(atom.position)||atom.position.length!==3||!atom.position.every(Number.isFinite))))throw new TypeError('連續分鏡的 69 原子身份或座標不完整。');
  const galFrames=maps.map(atoms=>sugarFrame(atoms,'A'));
  const galLocal=(index,id)=>toLocal(maps[index].get(id).position,galFrames[index]);
  const gal=new Map(states[0].atoms.filter(atom=>atom.id.startsWith('A')).map(atom=>[atom.id,galLocal(0,atom.id)]));
  const c1=gal.get('AC1'),hBeta=unit(sub(gal.get('AHC1'),c1)),hLength=length(sub(gal.get('AHC1'),c1));
  const glc=new Map(states[0].atoms.filter(atom=>atom.id.startsWith('B')).map(atom=>[atom.id,galLocal(0,atom.id)]));
  const bridge=glc.get('BO4'),leavingDirection=unit(sub(bridge,c1));
  // Swap the two reactive substituent directions at the fixed tetrahedral C1.
  // This creates alpha parity while keeping every sugar-ring coordinate fixed.
  const hAlpha=[...leavingDirection],nucleophileDirection=[...hBeta];
  const nucO=add(c1,scale(nucleophileDirection,1.43));
  const nucPerpendicular=unit(sub([1,0,0],scale(nucleophileDirection,nucleophileDirection[0])));
  const nucDeltaDirection=add(scale(nucleophileDirection,.5),scale(nucPerpendicular,Math.sqrt(.75)));
  const nucSourceFrame=basis(maps[1].get('E1749Oreact').position,maps[1].get('E1749Cdelta').position,maps[1].get('E1749Cgamma').position);
  const nucTargetFrame=basis(nucO,add(nucO,nucDeltaDirection),add(nucO,[0,1,0]));
  const nucleophile=new Map(states[1].atoms.filter(atom=>atom.id.startsWith('E1749')).map(atom=>[atom.id,moveBetween(atom.position,nucSourceFrame,nucTargetFrame)]));
  const acidO=add(bridge,[0,-2.6,1.2]),acidSource=maps[0];
  const sourceAcidFrame=basis(acidSource.get('E1538Oreact').position,acidSource.get('E1538Hacid').position,acidSource.get('E1538Cdelta').position);
  const acidTargetFrame=basis(acidO,bridge,add(acidO,[0,0,1]));
  const acid=new Map(states[0].atoms.filter(atom=>atom.id.startsWith('E1538')).map(atom=>[atom.id,moveBetween(atom.position,sourceAcidFrame,acidTargetFrame)]));
  const acidH=acid.get('E1538Hacid');
  // The product C1–Ow points toward the original beta substituent. Water keeps
  // its neutral state-0 internal geometry until the explicitly broken O–H bond.
  const waterO=add(c1,scale(leavingDirection,1.43));
  const waterSourceFrame=basis(maps[0].get('Ow').position,maps[0].get('Hwa').position,maps[0].get('Hwb').position);
  const waterTargetFrame=basis(waterO,acidO,add(waterO,[0,1,0]));
  const water=new Map(['Ow','Hwa','Hwb'].map(id=>[id,moveBetween(maps[0].get(id).position,waterSourceFrame,waterTargetFrame)]));
  const glcHydrogenDirection=unit(sub(acidO,bridge)),glcH=add(bridge,scale(glcHydrogenDirection,1.02));
  const bondsByState=states.map(state=>new Map(state.bonds.map(bond=>[key(bond),bond])));
  const union=new Map();for(const state of states)for(const bond of state.bonds)if(!union.has(key(bond)))union.set(key(bond),{a:bond.a,b:bond.b,order:bond.order});
  const timeline={schema:'lactase-reaction-timeline/v1',modelName:model.title,atomTemplates:states[0].atoms.map(atom=>({...atom,position:[...atom.position]})),charges:maps.map(atoms=>new Map([...atoms].map(([id,atom])=>[id,atom.formalCharge??0]))),gal,glc,acid,nucleophile,water,c1,hBeta,hAlpha,hLength,leavingDirection,nucleophileDirection,acidH,glcH,bonds:[...union.values()],bondsByState,segments:LACTASE_REACTION_SEGMENTS,bookmarks:LACTASE_REACTION_BOOKMARKS,isTrajectory:false,proteinGeometry:false,geometryKind:'fixed-ring chemical teaching storyboard',scope:LACTASE_REACTION_SCOPE};
  const points=[];for(let step=0;step<=100;step++)points.push(...samplePrepared(timeline,step/100).atoms.map(atom=>atom.position));
  const min=[0,1,2].map(axis=>Math.min(...points.map(point=>point[axis]))-.45),max=[0,1,2].map(axis=>Math.max(...points.map(point=>point[axis]))+.45);
  const center=mix(min,max,.5),radius=Math.max(...points.map(point=>length(sub(point,center))))+.45;
  timeline.bounds={min,max,center,radius};
  timeline.keyframes=[0,.12,.23,.38,.50,.64,.78,1].map(progress=>samplePrepared(timeline,progress));
  cache.set(model,timeline);return timeline;
}

function samplePrepared(timeline,progress){
  const p=clamp(progress),first=phase(p,.23,.38),second=phase(p,.64,.78),release=phase(p,.78,1);
  const segment=LACTASE_REACTION_SEGMENTS.find(item=>p<item.end)||LACTASE_REACTION_SEGMENTS.at(-1);
  const nucOffset=p<.23?3.5-(3.5-.65)*phase(p,0,.23):p<.38?.65*(1-first):p<.64?0:p<.78?.65*second:.65+1.55*release;
  const glcOffset=p<.23?0:p<.38?.7*first:p<.50?.7+2.6*phase(p,.38,.50):3.3+1.7*release;
  const waterOffset=p<.50?[0,0,-4.5]:p<.64?mix([0,0,-4.5],scale(timeline.leavingDirection,.65),phase(p,.50,.64)):scale(timeline.leavingDirection,.65*(1-second));
  const galShift=scale([-.3,-1,-.25],3*release),nucShift=scale(timeline.nucleophileDirection,nucOffset),glcShift=scale(timeline.leavingDirection,glcOffset),waterShift=add(waterOffset,scale(galShift,second));
  const betaToAlpha=slerpDirection(timeline.hBeta,timeline.hAlpha,first),hDirection=slerpDirection(betaToAlpha,timeline.hBeta,second);
  const referenceStateIndex=second>=.5?2:first>=.5?1:0;
  const atoms=timeline.atomTemplates.map(atom=>{
    const id=atom.id;let position;
    if(id==='AHC1')position=add(add(timeline.c1,scale(hDirection,timeline.hLength)),galShift);
    else if(timeline.gal.has(id))position=add(timeline.gal.get(id),galShift);
    else if(timeline.glc.has(id))position=add(timeline.glc.get(id),glcShift);
    else if(id==='E1538Hacid')position=mix(timeline.acidH,add(timeline.glcH,glcShift),first);
    else if(timeline.acid.has(id))position=[...timeline.acid.get(id)];
    else if(timeline.nucleophile.has(id))position=add(timeline.nucleophile.get(id),nucShift);
    else if(id==='Hwa')position=mix(add(timeline.water.get(id),waterShift),timeline.acidH,second);
    else if(timeline.water.has(id))position=add(timeline.water.get(id),waterShift);
    else throw new TypeError(`未知的連續反應原子 ${id}`);
    return {...atom,position,formalCharge:timeline.charges[referenceStateIndex].get(id),highlight:segment.selected.includes(id)};
  });
  const bonds=timeline.bonds.map(bond=>{
    const k=key(bond),orders=timeline.bondsByState.map(map=>map.has(k)?1:0);
    const strength=p<.38?orders[0]+(orders[1]-orders[0])*first:orders[1]+(orders[2]-orders[1])*second;
    const activeChange=p>=.23&&p<.38?[orders[0],orders[1]]:p>=.64&&p<.78?[orders[1],orders[2]]:null;
    const kind=activeChange&&activeChange[0]!==activeChange[1]?(activeChange[1]>activeChange[0]?'forming':'breaking'):'stable';
    return {...bond,strength,opacity:strength,kind};
  });
  const transitions=p>.23&&p<.38||p>.64&&p<.78;
  const atomMap=new Map(atoms.map(atom=>[atom.id,atom.position]));
  const bondLedger=[['AC1','BO4'],['AC1','E1749Oreact'],['AC1','Ow']].map(([a,b])=>{const bond=bonds.find(item=>key(item)===key({a,b}));return {a,b,strength:bond.strength,kind:bond.kind,distance:length(sub(atomMap.get(a),atomMap.get(b)))};});
  return {id:'human-lph-continuous-storyboard',name:segment.label,atoms,bonds,progress:p,stageId:segment.stageId,segmentId:segment.id,label:segment.label,stageProgress:clamp((p-segment.start)/(segment.end-segment.start)),selected:[...segment.selected],referenceStateIndex,chemicalStateIndex:transitions?null:referenceStateIndex,bondLedger,events:{firstSubstitution:first,secondSubstitution:second,glucoseRelease:phase(p,.38,.50),waterApproach:phase(p,.50,.64),productRelease:release,galC1Configuration:first===0?'β':second===1?'β':first===1&&second===0?'α':'配置變化的教學補間'},isTrajectory:false,proteinGeometry:false,isValidatedStateGeometry:false,geometryKind:timeline.geometryKind,scope:LACTASE_REACTION_SCOPE};
}

/** Arbitrary seeking is pure: no history, wall clock, velocity, or accumulated transforms. */
export function sampleLactaseReaction(input,progress){
  if(!Number.isFinite(progress))throw new TypeError('反應分鏡進度必須是有限數值。');
  return samplePrepared(createLactaseReactionTimeline(input),progress);
}
