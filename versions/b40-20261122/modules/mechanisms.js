const key=b=>[b.a,b.b].sort().join('–');
const electronPoint=point=>typeof point==='string'?point.split('-').sort().join('-'):point;
export function bondElectronOptions(state,preferred,{source=true}={}){
 return state.bonds.map(b=>{const stored=b.a+'-'+b.b,id=electronPoint(preferred)===electronPoint(stored)?preferred:stored;return [id,id.split('-').join(b.order===2?'=':'–')+(source?' 的鍵電子':' 的鍵結位置')];});
}
export function oxidationStateComparison(before,after){
 const a=before.metadata?.oxidationStates||{},b=after.metadata?.oxidationStates||{};
 return Object.entries(a).filter(([id,n])=>Number.isInteger(n)&&Number.isInteger(b[id])).map(([id,from])=>({id,from,to:b[id]}));
}
export function bondChanges(before,after){
 const a=new Map(before.bonds.map(b=>[key(b),b.order])),b=new Map(after.bonds.map(b=>[key(b),b.order]));
 return [...new Set([...a.keys(),...b.keys()])].flatMap(pair=>{const from=a.get(pair)||0,to=b.get(pair)||0;return from===to?[]:[{pair,from,to,kind:from===0?'formed':to===0?'broken':'order'}];});
}
export function chargeChanges(before,after){const a=new Map(before.atoms.map(a=>[a.id,a.formalCharge||0]));return after.atoms.filter(b=>(a.get(b.id)||0)!==(b.formalCharge||0)).map(b=>({id:b.id,from:a.get(b.id)||0,to:b.formalCharge||0}));}
export function validateMechanismMove(mechanism,step,source,target){
 const s=mechanism.steps[step];if(!s)return {ok:false,message:'這條路徑已完成，可以回看或保存。'};
 if(!source||!target)return {ok:false,message:'先選電子來源與目的地，也可以直接點 3D 原子或鍵。'};
 if(electronPoint(source)===electronPoint(s.source)&&electronPoint(target)===electronPoint(s.target))return {ok:true,message:s.explanation};
 if(source===target)return {ok:false,message:'電子必須由一個來源移向另一個位置，請分別選擇。'};
 return {ok:false,message:`目前這一步需要由 ${s.source} 向 ${s.target} 提供電子。${s.instruction}`};
}
export function stateInventory(state){return {atoms:state.atoms.length,charge:state.atoms.reduce((n,a)=>n+(a.formalCharge||0),0),formula:state.formula};}
