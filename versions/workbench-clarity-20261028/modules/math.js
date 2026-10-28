export const TAU = Math.PI * 2;
export const R = 0.008314462618;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const wrap=v=>((v%360)+360)%360;
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const scale=(a,s)=>a.map(v=>v*s);
export const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm=a=>Math.hypot(...a);
export const unit=a=>scale(a,1/(norm(a)||1));
export function dihedral(a,b,c,d){const axis=unit(sub(c,b));const v=sub(sub(a,b),scale(axis,dot(sub(a,b),axis)));const w=sub(sub(d,c),scale(axis,dot(sub(d,c),axis)));return wrap(Math.atan2(dot(cross(axis,v),w),dot(v,w))*180/Math.PI);}
export function rotatePoint(p,origin,axis,angle){const k=unit(axis),v=sub(p,origin),r=angle*Math.PI/180;return add(origin,add(add(scale(v,Math.cos(r)),scale(cross(k,v),Math.sin(r))),scale(k,dot(k,v)*(1-Math.cos(r)))));}
export function rotateBond(molecule,bond,angle){const atoms=molecule.atoms.map(a=>({...a,position:[...a.position]}));const byId=Object.fromEntries(atoms.map(a=>[a.id,a]));const current=dihedral(...bond.reference.map(id=>byId[id].position));const origin=byId[bond.a].position,axis=sub(byId[bond.b].position,origin);const moving=new Set(bond.movingAtomIds);for(const a of atoms)if(moving.has(a.id))a.position=rotatePoint(a.position,origin,axis,angle-current);return {...molecule,atoms};}
export function interpolateEnergy(points,angle){const a=wrap(angle);if(!points?.length)return 0;for(let i=0;i<points.length-1;i++){const p=points[i],q=points[i+1];if(a>=p.angle&&a<=q.angle)return p.energy+(q.energy-p.energy)*(a-p.angle)/(q.angle-p.angle);}const p=points.at(-1),q=points[0];return p.energy+(q.energy-p.energy)*(a-p.angle)/(360-p.angle+q.angle);}
export function boltzmann(points,temperature){if(!(temperature>0))throw new Error('Temperature must be positive');const min=Math.min(...points.map(p=>p.energy));const weights=points.map(p=>Math.exp(-(p.energy-min)/(R*temperature)));const total=weights.reduce((a,b)=>a+b,0);return weights.map(w=>w/total);}
export const deltaGFromRatio=(ratio,temperature=298.15)=>-R*temperature*Math.log(ratio);
export function movingFragment(molecule,a,b){const adjacent=new Map(molecule.atoms.map(x=>[x.id,[]]));for(const x of molecule.bonds){if((x.a===a&&x.b===b)||(x.a===b&&x.b===a))continue;adjacent.get(x.a)?.push(x.b);adjacent.get(x.b)?.push(x.a);}const seen=new Set([b]),queue=[b];while(queue.length){const n=queue.pop();for(const x of adjacent.get(n)||[])if(!seen.has(x)){seen.add(x);queue.push(x);}}return seen.has(a)?null:[...seen];}
export function makeEthane(){const atoms=[{id:'C1',element:'C',position:[-.77,0,0]},{id:'C2',element:'C',position:[.77,0,0]}],bonds=[{a:'C1',b:'C2',order:1}];for(let c=1;c<=2;c++)for(let i=0;i<3;i++){const angle=(i*120+(c===2?60:0))*Math.PI/180;atoms.push({id:`HC${c}${i}`,element:'H',position:[(c===1?-1:1)*1.133,1.026*Math.cos(angle),1.026*Math.sin(angle)]});bonds.push({a:`C${c}`,b:`HC${c}${i}`,order:1});}return {id:'ethane',name:'乙烷',formula:'C₂H₆',atoms,bonds,rotatableBonds:[{a:'C1',b:'C2',label:'C1—C2',reference:['HC10','C1','C2','HC20'],movingAtomIds:['C2','HC20','HC21','HC22']}],metadata:{method:'教學用四面體幾何'}};}
