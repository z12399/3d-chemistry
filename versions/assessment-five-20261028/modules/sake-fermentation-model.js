/** Discrete source views only. Selecting a role never switches off parallel chemistry. */
import {
  SAKE_SOURCES,SAKE_STAGES,SAKE_METHODS,SAKE_ROLES,SAKE_NODES,SAKE_EDGES,SAKE_CELLS,SAKE_STUDY,
} from '../data/sake-fermentation-evidence.js';

function deepFreeze(value) {
  if(value&&typeof value==='object') {
    Object.values(value).forEach(deepFreeze);Object.freeze(value);
  }
  return value;
}

export const SAKE_LAB_ID='sake-fermentation-evidence';
export const SAKE_DEFAULT_STATE=deepFreeze({stage:'moromi',method:'kimoto-family',role:'koji'});

/** Validate complete own data properties, without invoking accessors or coercing strings. */
export function createSakeState(input=SAKE_DEFAULT_STATE) {
  const keys=['stage','method','role'];
  if(!input||typeof input!=='object'||Array.isArray(input)||![Object.prototype,null].includes(Object.getPrototypeOf(input)))
    throw new TypeError('請提供完整的階段、酒母方法與角色。');
  for(const key of Reflect.ownKeys(input)) {
    if(!keys.includes(key))throw new TypeError('含有未知參數欄位。');
    if(!Object.hasOwn(Object.getOwnPropertyDescriptor(input,key),'value'))throw new TypeError('參數必須是直接值。');
  }
  for(const key of keys)if(!Object.hasOwn(input,key))throw new TypeError('缺少必要參數：'+key);
  const choices={stage:SAKE_STAGES,method:SAKE_METHODS,role:SAKE_ROLES};
  for(const key of keys)if(!choices[key].some(choice=>choice.id===input[key]))throw new RangeError('未知選項：'+key);
  return deepFreeze(Object.fromEntries(keys.map(key=>[key,input[key]])));
}

/** Stage and starter method control visibility; role controls emphasis only. */
export function getRoleView(input=SAKE_DEFAULT_STATE) {
  const state=createSakeState(input);
  const cell=SAKE_CELLS.find(entry=>entry.stage===state.stage&&entry.method===state.method&&entry.role===state.role);
  const visibleEdges=SAKE_EDGES.filter(edge=>edge.emphasizeStages.includes(state.stage)&&(!edge.methods||edge.methods.includes(state.method)))
    .map(edge=>({...edge,highlighted:cell.highlightEdges.includes(edge.id)}));
  const highlightEdges=visibleEdges.filter(edge=>edge.highlighted).map(edge=>edge.id);
  const highlightedNodeIds=new Set(visibleEdges.filter(edge=>edge.highlighted).flatMap(edge=>[edge.from,edge.to,...(edge.via?[edge.via]:[])]));
  const visibleNodeIds=new Set(visibleEdges.flatMap(edge=>[edge.from,edge.to,...(edge.via?[edge.via]:[])]));
  const sourceIds=new Set([...cell.sourceIds,...visibleEdges.flatMap(edge=>edge.sourceIds)]);
  return deepFreeze({input:state,cell,
    stage:SAKE_STAGES.find(entry=>entry.id===state.stage),
    method:SAKE_METHODS.find(entry=>entry.id===state.method),
    role:SAKE_ROLES.find(entry=>entry.id===state.role),
    visibleEdges,highlightEdges,highlightedEdgeObjects:visibleEdges.filter(edge=>edge.highlighted),
    visibleNodes:SAKE_NODES.filter(node=>visibleNodeIds.has(node.id)).map(node=>({...node,highlighted:highlightedNodeIds.has(node.id)})),
    sources:SAKE_SOURCES.filter(source=>sourceIds.has(source.id)),
    boundary:cell.boundary+' 選擇角色只突出分工；未突出不表示菌數、濃度或活性為零。',
  });
}

/** Author-defined brewery profiles, not interchangeable experimental treatments. */
export function getStudyCase(id='A') {
  const profile=SAKE_STUDY.patterns.find(entry=>entry.id===id);
  if(!profile)throw new RangeError('只可選擇研究中的 A、B 或 C–E 酒藏模式。');
  return deepFreeze({...profile,
    sources:SAKE_SOURCES.filter(source=>profile.sourceIds.includes(source.id)),
    measurement:SAKE_STUDY.measurement,
    sharedObservation:SAKE_STUDY.sharedObservation,
    studyBoundary:SAKE_STUDY.boundary,
    quantitativeSeries:null,
  });
}
