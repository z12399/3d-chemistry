import {bondChanges} from './mechanisms.js';

const ACETYL_SITES=[1,2,3,4,6];
const SCHEMATIC_NOTE='反應位點示意：片段靠近與畫面間距不是實測碰撞、過渡態或反應軌跡。';
const pointIds=point=>String(point||'').split('-').filter(Boolean);
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const scale=(a,s)=>a.map(v=>v*s);
const unit=a=>{const n=Math.hypot(...a);return n>1e-9?scale(a,1/n):[1,0,0];};
// Atom IDs track identity, not a permanent functional group. Derive the small
// amount of chemistry named here from the current graph; keep uncertain roles
// generic instead of borrowing acetylation labels for every mechanism.
function pointLabel(point,state,{acetyl=false}={}){
  const id=String(point||'');
  if(id.includes('-'))return id.replaceAll('-', '–');
  const atom=state.atoms.find(a=>a.id===id);
  if(!atom)return id;
  const byId=new Map(state.atoms.map(a=>[a.id,a]));
  const neighborsOf=atomId=>state.bonds.filter(b=>b.a===atomId||b.b===atomId).map(b=>({atom:byId.get(b.a===atomId?b.b:b.a),order:b.order}));
  const neighbors=neighborsOf(id);
  const charge=atom.formalCharge??atom.charge??0;
  const hydrogens=neighbors.filter(n=>n.atom?.element==='H');
  const carbons=neighbors.filter(n=>n.atom?.element==='C');
  if(atom.element==='O'){
    const carbonyl=carbons.some(n=>n.order===2);
    if(carbonyl&&charge===0)return `羰基氧 ${id}`;
    if(carbonyl&&charge===1&&hydrogens.length===1)return `質子化羰基氧 ${id}`;
    if(charge!==0)return `帶${charge>0?'正':'負'}電氧 ${id}`;
    if(neighbors.length===2&&hydrogens.length===2)return `水氧 ${id}`;
    if(neighbors.length===2&&hydrogens.length===1&&carbons.length===1&&neighbors.every(n=>n.order===1))return `羥基氧 ${id}`;
    if(neighbors.length===2&&carbons.length===2&&neighbors.every(n=>n.order===1))return `橋接氧 ${id}`;
    return `氧 ${id}`;
  }
  if(atom.element==='C'){
    const hasCarbonyl=neighbors.some(n=>{
      if(n.atom?.element!=='O'||n.order!==2)return false;
      const oxygenNeighbors=neighborsOf(n.atom.id),oxygenCharge=n.atom.formalCharge??n.atom.charge??0;
      // An oxocarbenium resonance form may draw C=O+ with O also bound to a
      // second carbon. That oxygen is not a normal/protonated carbonyl group.
      return oxygenCharge===0&&oxygenNeighbors.length===1||oxygenCharge===1&&oxygenNeighbors.length===2&&oxygenNeighbors.some(other=>other.atom?.element==='H');
    });
    if(hasCarbonyl)return `羰基碳 ${id}`;
    if(acetyl&&/^Ca[12346]$/.test(id))return `乙醯中心碳 ${id}`;
    return `碳 ${id}`;
  }
  if(atom.element==='N'){
    if(acetyl&&id==='Np'&&charge===0)return `吡啶氮 ${id}`;
    return `${charge?'帶'+(charge>0?'正':'負')+'電':''}氮 ${id}`;
  }
  if(atom.element==='H')return `氫 ${id}`;
  return `${atom.element} ${id}`;
}

function components(state){
  const neighbors=new Map(state.atoms.map(a=>[a.id,[]]));
  for(const b of state.bonds){if(neighbors.has(b.a)&&neighbors.has(b.b)){neighbors.get(b.a).push(b.b);neighbors.get(b.b).push(b.a);}}
  const groups=[],byId=new Map();
  for(const atom of state.atoms){
    if(byId.has(atom.id))continue;
    const group=[],stack=[atom.id],index=groups.length;byId.set(atom.id,index);
    while(stack.length){const id=stack.pop();group.push(id);for(const n of neighbors.get(id))if(!byId.has(n)){byId.set(n,index);stack.push(n);}}
    groups.push(group);
  }
  return {groups,byId};
}

function changeText(before,after){
  const changes=bondChanges(before,after);
  return changes.map(c=>c.kind==='formed'?`形成 ${c.pair}`:c.kind==='broken'?`斷開 ${c.pair}`:`${c.pair} ${c.from===2?'雙鍵':'單鍵'}→${c.to===2?'雙鍵':'單鍵'}`).join('；');
}

/** Describes the electron bookkeeping in one teaching step, not a measured elementary event. */
export function stepStory(mechanism,stepIndex){
  const step=mechanism.steps[stepIndex],before=mechanism.states[stepIndex],after=mechanism.states[stepIndex+1];
  if(!step||!before||!after)throw new RangeError('Invalid mechanism step');
  const source=step.source||step.arrows?.[0]?.[0],target=step.target||step.arrows?.[0]?.[1];
  const graph=components(before).byId;
  const sourceGroup=graph.get(pointIds(source)[0]),targetGroup=graph.get(pointIds(target)[0]);
  const kind=sourceGroup!==undefined&&targetGroup!==undefined&&sourceGroup!==targetGroup?'encounter':'internal';
  const acetyl=mechanism.reactionId==='glucose-acetylation'&&mechanism.variantId==='pyridine-acyl-transfer';
  const label=point=>pointLabel(point,before,{acetyl});
  const arrowLabel=([from,to])=>`${label(from)} → ${label(to)}`;
  const site=acetyl?ACETYL_SITES[Math.floor(stepIndex/5)]:null,phase=acetyl?stepIndex%5:null;
  const primary=acetyl?[
    `吡啶 N 對準乙酸酐的 ${`Ca${site}`}，準備轉移乙醯基。`,
    '羰基重新成鍵，橋氧帶走乙酸根；留下活化的乙醯吡啶鎓。',
    `葡萄糖 ${`O${site}`} 對準活化的乙醯羰基碳。`,
    `乙酸根接走糖羥基的 ${`HO${site}`}，形成乙酸。`,
    '羰基重新成鍵、吡啶離去，糖氧與乙醯基連成酯。'
  ][phase]:(step.instruction&&step.instruction.length<=44?step.instruction:`${label(source)} 的電子移向 ${label(target)}。`);
  const arrows=step.arrows||[];
  const paired=arrows.slice(1).map(arrowLabel).join('；');
  return {
    kind,siteLabel:site?(phase<2?`O${site} 乙醯化週期 · 前置活化`:`O${site} 位點`):'目前反應位點',phase:phase===null?null:phase+1,
    source,target,sourceLabel:label(source),targetLabel:label(target),
    primaryText:primary,
    secondaryText:arrows.length?`同組電子流（${arrows.length} 支箭頭，形式記帳）：${arrows.map(arrowLabel).join('；')}。`:`電子來源與目的地：${arrowLabel([source,target])}。`,
    pairedText:paired?`同組其餘電子流：${paired}`:'',
    changeText:changeText(before,after),
    arrows,schematicNote:SCHEMATIC_NOTE
  };
}

const DIRECTIONS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],[1,1,0],[1,-1,0],[1,0,1],[1,0,-1],[0,1,1],[0,1,-1]];

/**
 * Crops spectator fragments and translates entire connected fragments for a
 * legible teaching tableau. The returned positions are display-only.
 */
export function focusTeachingModel(mechanism,stepIndex,{distance:requestedDistance=3.4,after=false}={}){
  const step=mechanism.steps[stepIndex],state=mechanism.states[stepIndex+(after?1:0)];
  if(!step||!state)throw new RangeError('Invalid mechanism step');
  if(!Number.isFinite(requestedDistance)||requestedDistance<=0)throw new RangeError('distance must be positive');
  const reactive=[...new Set([step.source,step.target,...(step.arrows||[]).flat()].flatMap(pointIds))];
  const {groups,byId}=components(state);
  const chosen=[...new Set(reactive.map(id=>byId.get(id)).filter(x=>x!==undefined))];
  const targetId=pointIds(step.target)[0],baseIndex=byId.get(targetId)??chosen[0];
  if(baseIndex===undefined)throw new Error('Mechanism arrows refer to no atoms in state');
  const ordered=[baseIndex,...chosen.filter(i=>i!==baseIndex)];
  const position=new Map(state.atoms.map(a=>[a.id,[...a.position]]));
  const referencePosition=new Map(state.atoms.map(a=>[a.id,[...a.position]]));
  const origin=position.get(targetId)||position.get(groups[baseIndex][0]);
  const referenceDistance=3.4;
  const placed=[baseIndex];
  for(const [rank,index] of ordered.slice(1).entries()){
    const own=groups[index];
    const anchor=reactive.find(id=>byId.get(id)===index)||own[0];
    const anchorPosition=referencePosition.get(anchor);
    const original=unit(sub(anchorPosition,origin));
    const directions=[original,...DIRECTIONS.map(unit)];
    let best=null;
    // Pick the clearance-safe direction at one fixed distance, so changing the
    // requested distance only slides the whole fragment along that direction.
    for(const radius of [referenceDistance+rank*1.2,referenceDistance+rank*1.2+1,referenceDistance+rank*1.2+2]){
      for(const direction of directions){
        const desired=add(origin,scale(direction,radius)),delta=sub(desired,anchorPosition);
        let clearance=Infinity;
        for(const id of own)for(const placedIndex of placed)for(const other of groups[placedIndex]){
          clearance=Math.min(clearance,distance(add(referencePosition.get(id),delta),referencePosition.get(other)));
        }
        const candidate={delta,direction,clearance};
        if(!best||candidate.clearance>best.clearance)best=candidate;
        if(clearance>=1.8){best=candidate;break;}
      }
      if(best?.clearance>=1.8)break;
    }
    const actualDelta=add(best.delta,scale(best.direction,requestedDistance-referenceDistance));
    for(const id of own){
      referencePosition.set(id,add(referencePosition.get(id),best.delta));
      position.set(id,add(position.get(id),actualDelta));
    }
    placed.push(index);
  }
  const visible=new Set(ordered.flatMap(index=>groups[index]));
  const model={...state,
    atoms:state.atoms.filter(a=>visible.has(a.id)).map(a=>({...a,position:position.get(a.id)})),
    bonds:state.bonds.filter(b=>visible.has(b.a)&&visible.has(b.b)).map(b=>({...b})),
    metadata:{...state.metadata,displaySchematic:true,displaySourceState:stepIndex+(after?1:0)}
  };
  return {model,activeIds:reactive.filter(id=>visible.has(id)),visibleIds:[...visible],staged:true,schematicNote:SCHEMATIC_NOTE};
}
