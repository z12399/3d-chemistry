/** Ten source-identified structures for comparison. This is not a SMILES classifier. */
export const FLAVONOID_SCHEMA='flavonoid-structures/v1';
export const FLAVONOID_LAB_ID='flavonoid-structure';
export const FLAVONOID_CASE_IDS=Object.freeze(['naringenin-chalcone','apigenin','s-naringenin','quercetin','taxifolin','genistein','catechin','cyanidin','isoquercetin','isorhamnetin']);
export const FLAVONOID_FEATURE_IDS=Object.freeze(['ringClosure','c2c3','c4Carbonyl','c3Substitution','bAttachment','charge','glycoside','methoxy']);
const SOURCE_SHA='c4f72fc8f523349c414bcb8dfc0a1fe704857e6d078165294c45b3bcfddc5049';
// Independently reviewed identity/class expectations; hashes bind the exact generated graph and depiction.
const REFERENCE={
 'naringenin-chalcone':{name:'柚皮素查耳酮',englishName:'Naringenin chalcone',classId:'chalcone',className:'查耳酮類',formula:'C15H12O5',cid:5280960,charge:0,atoms:20,bonds:21,graph:'db5bc8c85dd2e967c2dd081cea0ff7113cf8a5f23d74bc5d04dc86a8a8617ad1',svg:'526891c605d65ffbd243bf764f97d6f6a32219d2e083d3c1a53333efbe0fa8d5',values:[false,'not-applicable','not-applicable','not-applicable','beta carbon',0,false,null]},
 apigenin:{name:'芹菜素',englishName:'Apigenin',classId:'flavone',className:'黃酮類',formula:'C15H10O5',cid:5280443,charge:0,atoms:20,bonds:22,graph:'938ca8e344c85e79111e6f91a0e7daeec9092c862283e1d5c85bb39b092b64d8',svg:'5b5806516c79067958a1a0ecf4ea828c32da356e926332d6589aa3b8ae79b627',values:[true,2,true,'H','C2',0,false,null]},
 's-naringenin':{name:'(2S)-柚皮素',englishName:'(2S)-Naringenin',classId:'flavanone',className:'黃烷酮類',formula:'C15H12O5',cid:439246,charge:0,atoms:20,bonds:22,graph:'6fe53f9e21595812f1fb1f0efcc7e409cb3b45044a3625281bd36faeb7106563',svg:'deed7af9e56c483524f6e7c2c6547de6469436c9f552f00aa8d70e13bb99e5ef',values:[true,1,true,'H','C2',0,false,null]},
 quercetin:{name:'槲皮素',englishName:'Quercetin',classId:'flavonol',className:'黃酮醇類',formula:'C15H10O7',cid:5280343,charge:0,atoms:22,bonds:24,graph:'1678c3547ffabaf1ed0a34016e238eb80aedb8b5e4054c76e95c71390cefd856',svg:'8cf8ee11561ccac571d83c10fc92298f50ead5d667c6490bee34a9899bb2ef98',values:[true,2,true,'OH','C2',0,false,null]},
 taxifolin:{name:'(+)-二氫槲皮素',englishName:'(+)-Taxifolin',classId:'flavanonol',className:'二氫黃酮醇類',formula:'C15H12O7',cid:439533,charge:0,atoms:22,bonds:24,graph:'9e70accdddcc2513aee7bb34705db3f7b9bc56bfafc0e97e3a04c63aed466803',svg:'22cd48689c13ae79e0d2948600cdd29c6e075e074923b1a7c429003d1c9f52c2',values:[true,1,true,'OH','C2',0,false,null]},
 genistein:{name:'染料木素',englishName:'Genistein',classId:'isoflavone',className:'異黃酮類',formula:'C15H10O5',cid:5280961,charge:0,atoms:20,bonds:22,graph:'22eddcb2cbd9db28f320e95656695d7ba034cb4717f5ea30bd4b83040d29285c',svg:'33d2b6e3b44e2759d742f7b302c4365dd3c3242e9c786769d0a4bcb72bdcfbc6',values:[true,2,true,'B-ring','C3',0,false,null]},
 catechin:{name:'(+)-兒茶素',englishName:'(+)-Catechin',classId:'flavanol',className:'黃烷醇類',formula:'C15H14O6',cid:9064,charge:0,atoms:21,bonds:23,graph:'20b51a77a45a2dc48cdb411d254a62ee223ab830b8b30aa807aad7045653fe58',svg:'4f9784e34cc8f8e93e605bbd97476114f71591b305dc40d96cf0bef46d3cfa74',values:[true,1,false,'OH','C2',0,false,null]},
 cyanidin:{name:'矢車菊素（黃烊陽離子）',englishName:'Cyanidin (flavylium cation)',classId:'anthocyanidin',className:'花青素苷元類',formula:'C15H11O6+',cid:128861,charge:1,atoms:21,bonds:23,graph:'dd662238ff1d756435403f910b1e14c679235b063360589449e035e954d59b87',svg:'ad17746eda33fc896e7f4398e51d4af84a47754532a01d3c6ec981360a88458a',values:[true,'conjugated-resonance',false,'OH','C2',1,false,null]},
 isoquercetin:{name:'槲皮素 3-O-β-D-吡喃葡萄糖苷',englishName:'Isoquercetin (quercetin 3-O-beta-D-glucopyranoside)',classId:'flavonol',className:'黃酮醇類',formula:'C21H20O12',cid:5280804,charge:0,atoms:33,bonds:36,graph:'6c69780020b3f1f6c9f7a403781e8625d5a4d4ad21b9ba18de31731953d5aba4',svg:'38ded6fbc3924c7500ca5917b53cbb3f16b11228b3041262ca498ef1e784d611',values:[true,2,true,'O-glycoside','C2',0,true,null]},
 isorhamnetin:{name:'異鼠李素（槲皮素 3′-O-甲基衍生物）',englishName:'Isorhamnetin (3-prime-O-methylquercetin)',classId:'flavonol',className:'黃酮醇類',formula:'C16H12O7',cid:5281654,charge:0,atoms:23,bonds:25,graph:'28bca44667883b0d3509a07b516750779b93563483406958bee6924e1540c546',svg:'c14bf6563bc60c97cdeafd1c50c39ac551b236d2fa7607e4aace67c279797d5b',values:[true,2,true,'OH','C2',0,false,'3′']},
};
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const own=(x,key)=>Object.prototype.hasOwnProperty.call(x,key);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const clone=x=>structuredClone(x);
const pair=(a,b)=>[a,b].sort().join('|');
const fail=m=>{throw new TypeError('Invalid flavonoid dataset: '+m);};
const requireValue=(test,message)=>{if(!test)fail(message);};
const sameSet=(a,b)=>Array.isArray(a)&&a.length===b.length&&new Set(a).size===a.length&&b.every(x=>a.includes(x));
const canon=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canon).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canon(x[k])).join(',')+'}';

// Synchronous SHA-256 keeps this pure model equally usable in browsers and Node.
function sha256(text){
 const bytes=new TextEncoder().encode(text),size=Math.ceil((bytes.length+9)/64)*64,block=new Uint8Array(size);block.set(bytes);block[bytes.length]=128;
 const view=new DataView(block.buffer);view.setUint32(size-8,Math.floor(bytes.length/0x20000000));view.setUint32(size-4,(bytes.length*8)>>>0);
 const k=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],w=new Uint32Array(64),rot=(x,n)=>(x>>>n)|(x<<(32-n));
 for(let offset=0;offset<size;offset+=64){
  for(let i=0;i<16;i++)w[i]=view.getUint32(offset+i*4);
  for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=(w[i-16]+(rot(x,7)^rot(x,18)^(x>>>3))+w[i-7]+(rot(y,17)^rot(y,19)^(y>>>10)))>>>0;}
  let [a,b,c,d,e,f,g,z]=h;
  for(let i=0;i<64;i++){const t1=(z+(rot(e,6)^rot(e,11)^rot(e,25))+((e&f)^(~e&g))+k[i]+w[i])>>>0,t2=((rot(a,2)^rot(a,13)^rot(a,22))+((a&b)^(a&c)^(b&c)))>>>0;z=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
  [a,b,c,d,e,f,g,z].forEach((v,i)=>{h[i]=(h[i]+v)>>>0;});
 }
 return h.map(v=>v.toString(16).padStart(8,'0')).join('');
}

function header(data){
 requireValue(obj(data)&&data.schema===FLAVONOID_SCHEMA,'schema');
 requireValue(eq(data.caseOrder,FLAVONOID_CASE_IDS)&&Array.isArray(data.cases)&&eq(data.cases.map(c=>c?.id),FLAVONOID_CASE_IDS),'fixed ten cases and order');
 const m=data.metadata;requireValue(obj(m)&&m.sourceInputSha256===SOURCE_SHA&&m.rdkitVersion==='2026.03.6'&&m.isExperimentalGeometry===false&&m.isTrajectory===false,'source/method boundary');
}
function sourceCheck(data){
 const ids=['iupac-flavonoid-nomenclature',...FLAVONOID_CASE_IDS.map(id=>'pubchem-'+id)];
 requireValue(Array.isArray(data.sources)&&sameSet(data.sources.map(s=>s?.id),ids),'source inventory');
 for(const source of data.sources){
  const expected=source.id==='iupac-flavonoid-nomenclature'?'https://iupac.qmul.ac.uk/flavonoid/':'https://pubchem.ncbi.nlm.nih.gov/compound/'+REFERENCE[source.id.slice(8)].cid;
  requireValue(source.url===expected&&typeof source.title==='string'&&source.title.length>0,'source URL and title');
 }
}
function graphRecord(c){return {atoms:c.atoms.map(a=>Object.fromEntries(['id','index','element','formalCharge','hydrogenCount','aromatic','cip'].map(k=>[k,a[k]]))),bonds:c.bonds,roles:c.roles,identity:c.identity};}

function svgCheck(c,ref,atoms,bonds){
 const d=c.diagram;requireValue(obj(d)&&typeof d.svg==='string'&&d.svg.length>1000&&d.svg.length<300000,'SVG text');
 requireValue(d.file==='flavonoid-diagrams/'+c.id+'.svg'&&d.kind==='computed-2d-depiction'&&d.coordinateUnit==='svg-pixel'&&d.isExperimentalGeometry===false,'diagram method and path');
 const [width,height,font]=c.id==='isoquercetin'?[760,560,32]:[640,440,28];
 requireValue(d.width===width&&d.height===height&&d.fontSize===font,'diagram dimensions and readable font');
 const s=d.svg;
 requireValue(!/<!|<\?|<\s*(?:script|foreignObject|iframe|image|use|a|animate|set|style)\b|\bon\w+\s*=|\b(?:href|src)\s*=|url\s*\(|javascript\s*:|data\s*:/i.test(s),'active or externally referenced SVG');
 const allowedTags=new Set(['svg','g','path','rect','circle','ellipse','text','tspan','title','desc']);
 for(const match of s.matchAll(/<\/?\s*([\w:-]+)/g))requireValue(allowedTags.has(match[1]),'SVG element allowlist');
 const allowedAttrs=new Set(['xmlns','version','baseProfile','xml:space','width','height','viewBox','role','aria-label','aria-hidden','class','style','d','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-opacity','fill-opacity','opacity','cx','cy','r','x','y','font-size','font-family','text-anchor','data-atom-id','data-bond-id','data-highlight']);
 for(const match of s.matchAll(/\s([\w:-]+)\s*=/g))requireValue(allowedAttrs.has(match[1]),'SVG attribute allowlist');
 requireValue(d.sha256===ref.svg&&sha256(s)===ref.svg,'pinned SVG identity');
 requireValue(s.includes(`viewBox="0 0 ${width} ${height}"`),'SVG viewBox');
 requireValue(sameSet([...s.matchAll(/data-atom-id="([^"]+)"/g)].map(m=>m[1]),[...atoms.keys()]),'every atom has exactly one overlay');
 requireValue(sameSet([...s.matchAll(/data-bond-id="([^"]+)"/g)].map(m=>m[1]),[...bonds.keys()]),'every bond has exactly one overlay');
 for(const a of atoms.values()){
  const match=s.match(new RegExp(`<circle[^>]*data-atom-id="${a.id}"[^>]*>`));requireValue(!!match,'atom overlay circle');
  const attrs=Object.fromEntries([...match[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  requireValue(Number(attrs.cx)===a.x&&Number(attrs.cy)===a.y&&attrs.class==='flavonoid-atom-overlay','graph atom and rendered coordinate mapping');
 }
 for(const b of bonds.values()){
  const a=atoms.get(b.a),z=atoms.get(b.b),match=s.match(new RegExp(`<path[^>]*data-bond-id="${b.id}"[^>]*>`));requireValue(!!match,'bond overlay path');
  const attrs=Object.fromEntries([...match[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  requireValue(attrs.d===`M ${a.x},${a.y} L ${z.x},${z.y}`&&attrs.class==='flavonoid-bond-overlay','graph bond and rendered endpoint mapping');
 }
}

function caseCheck(c){
 const ref=REFERENCE[c?.id];requireValue(!!ref,'case identity');
 for(const k of ['name','englishName','classId','className'])requireValue(c[k]===ref[k],'named class '+k);
 const transfer=['isoquercetin','isorhamnetin'].includes(c.id);
 requireValue(c.isTransfer===transfer&&c.parentCaseId===(transfer?'quercetin':null),'transfer parent');
 requireValue(obj(c.identity)&&c.identity.cid===ref.cid&&c.identity.formula===ref.formula&&c.identity.formalCharge===ref.charge,'identity formula/CID/charge');
 requireValue(sameSet(c.sourceIds,['iupac-flavonoid-nomenclature','pubchem-'+c.id])&&sameSet(c.identity.sourceIds,c.sourceIds),'case sources');
 requireValue(Array.isArray(c.classificationEvidence)&&c.classificationEvidence.length>0&&c.classificationEvidence.every(x=>x.sourceId==='iupac-flavonoid-nomenclature'&&/^https:\/\/iupac\.qmul\.ac\.uk\/flavonoid\/#Flv\d+$/.test(x.url)&&typeof x.locator==='string'),'classification source');
 requireValue(Array.isArray(c.atoms)&&c.atoms.length===ref.atoms&&Array.isArray(c.bonds)&&c.bonds.length===ref.bonds,'atom/bond count');
 const atoms=new Map(),bonds=new Map(),edges=new Map(),adj=new Map(),valence=new Map();
 for(const [i,a] of c.atoms.entries()){
  requireValue(obj(a)&&a.id==='a'+i&&a.index===i&&['C','O'].includes(a.element)&&typeof a.aromatic==='boolean','indexed heavy atom');
  requireValue(Number.isInteger(a.formalCharge)&&[0,1].includes(a.formalCharge)&&Number.isInteger(a.hydrogenCount)&&a.hydrogenCount>=0&&a.hydrogenCount<=3,'atom charge/H count');
  requireValue(a.cip===null||['R','S','r','s'].includes(a.cip),'atom stereo descriptor');
  requireValue([a.x,a.y].every(x=>typeof x==='number'&&Number.isFinite(x)),'finite drawing coordinates');
  requireValue(a.x>10&&a.y>10&&a.x<c.diagram?.width-10&&a.y<c.diagram?.height-10,'drawing bounds');
  atoms.set(a.id,a);adj.set(a.id,[]);valence.set(a.id,a.hydrogenCount);
 }
 for(const [i,b] of c.bonds.entries()){
  requireValue(obj(b)&&b.id==='b'+i&&b.index===i&&atoms.has(b.a)&&atoms.has(b.b)&&b.a!==b.b&&!edges.has(pair(b.a,b.b)),'unique indexed graph bond');
  requireValue([1,2,3,1.5].includes(b.order)&&[1,2,3].includes(b.depictionOrder)&&typeof b.aromatic==='boolean','bond order');
  requireValue(b.aromatic?b.order===1.5:b.order===b.depictionOrder,'aromatic versus Kekule bond order');
  requireValue(['STEREONONE','STEREOE','STEREOZ'].includes(b.stereo)&&['NONE','BEGINWEDGE','BEGINDASH','ENDUPRIGHT','ENDDOWNRIGHT'].includes(b.direction),'bond stereo');
  bonds.set(b.id,b);edges.set(pair(b.a,b.b),b);adj.get(b.a).push(b.b);adj.get(b.b).push(b.a);
  for(const id of [b.a,b.b])valence.set(id,valence.get(id)+b.depictionOrder);
 }
 const edge=(a,b)=>edges.get(pair(a,b)),atom=id=>atoms.get(id),carbon=id=>atom(id)?.element==='C',oxygen=id=>atom(id)?.element==='O';
 const seen=new Set(),queue=[c.atoms[0].id];while(queue.length){const id=queue.pop();if(seen.has(id))continue;seen.add(id);queue.push(...adj.get(id));}
 requireValue(seen.size===atoms.size,'connected single molecule');
 for(const a of atoms.values())requireValue(valence.get(a.id)===(a.element==='C'?4:a.formalCharge===1?3:2),'depicted valence and implicit H');
 requireValue(c.atoms.reduce((s,a)=>s+a.formalCharge,0)===ref.charge,'total formal charge');
 const counts={C:c.atoms.filter(a=>a.element==='C').length,H:c.atoms.reduce((s,a)=>s+a.hydrogenCount,0),O:c.atoms.filter(a=>a.element==='O').length};
 requireValue(['C','H','O'].map(e=>e+(counts[e]===1?'':counts[e])).join('')+(ref.charge?'+':'')===ref.formula,'formula from graph');
 const r=c.roles;requireValue(obj(r),'semantic roles');
 for(const value of Object.values(r))requireValue(value===null||typeof value==='string'&&atoms.has(value)||Array.isArray(value)&&new Set(value).size===value.length&&value.every(id=>atoms.has(id)),'role references exact atoms');
 const ringCheck=ids=>Array.isArray(ids)&&ids.length===6&&new Set(ids).size===6&&ids.every((id,i)=>edge(id,ids[(i+1)%6]));
 requireValue(ringCheck(r.ringA)&&r.ringA.every(carbon)&&ringCheck(r.ringB)&&r.ringB.every(carbon),'two benzene rings');
 requireValue(r.bridge?.length===3&&r.bridge.every(carbon)&&new Set([...r.ringA,...r.ringB,...r.bridge]).size===15,'aglycone C6-C3-C6 skeleton');
 requireValue(r.ringB.includes(r.B1)&&edge(r.B1,r.bAttachmentAtom),'B-ring attachment edge');
 const closed=c.id!=='naringenin-chalcone';
 if(closed){
  requireValue(ringCheck(r.ringC)&&eq(r.ringC,[r.O1,r.C2,r.C3,r.C4,r.C4a,r.C8a])&&r.ringO===r.O1&&oxygen(r.O1),'ordered C ring');
  requireValue([r.C2,r.C3,r.C4,r.C4a,r.C8a].every(carbon)&&r.ringA.includes(r.C4a)&&r.ringA.includes(r.C8a),'C locants and fused edge');
  requireValue(r.ringA.filter(id=>r.ringC.includes(id)).length===2&&!r.ringB.some(id=>r.ringA.includes(id)||r.ringC.includes(id)),'distinct fused A/C and attached B ring');
  requireValue(r.bAttachmentAtom===(c.id==='genistein'?r.C3:r.C2),'C2/C3 source attachment');
  if(c.id==='cyanidin')requireValue(atom(r.O1).formalCharge===1&&edge(r.C2,r.C3).aromatic,'charged conjugated flavylium');
  else requireValue(edge(r.C2,r.C3).depictionOrder===ref.values[1],'C2-C3 source bond');
  if(ref.values[2]===true)requireValue(r.carbonylC===r.C4&&oxygen(r.carbonylO)&&edge(r.C4,r.carbonylO)?.order===2,'C4 carbonyl');
  else requireValue(r.carbonylO===null&&!adj.get(r.C4).some(id=>oxygen(id)&&edge(r.C4,id).order===2),'C4 carbonyl absence');
 }else{
  requireValue(eq(r.ringC,[])&&['O1','ringO','C2','C3','C4','C4a','C8a'].every(k=>r[k]===null),'chalcone has no cyclic locants');
  requireValue(eq(r.bridge,[r.carbonylC,r.alphaC,r.betaC])&&oxygen(r.carbonylO)&&edge(r.carbonylC,r.carbonylO)?.order===2&&edge(r.alphaC,r.betaC)?.order===2&&edge(r.alphaC,r.betaC)?.stereo==='STEREOE','open enone graph');
  requireValue(edge(r.carbonylC,r.alphaC)?.order===1&&edge(r.carbonylC,r.aAttachment)?.order===1&&edge(r.betaC,r.bAttachment)?.order===1,'open-chain attachments');
 }
 if(c.id==='isoquercetin'){
  requireValue(oxygen(r.glycosidicO)&&atom(r.glycosidicO).hydrogenCount===0&&edge(r.C3,r.glycosidicO)?.order===1&&edge(r.glycosidicO,r.sugarAnomericC)?.order===1,'O-glycoside is not free OH');
  requireValue(r.sugarAtoms.length===11&&r.sugarAtoms.includes(r.sugarAnomericC)&&r.sugarAtoms.filter(carbon).length===6&&r.sugarAtoms.filter(oxygen).length===5,'glucopyranosyl fragment');
 }else requireValue(eq(r.sugarAtoms,[])&&r.glycosidicO===null&&r.sugarAnomericC===null,'no invented glycoside');
 if(c.id==='isorhamnetin')requireValue(oxygen(r.methoxyO)&&carbon(r.methoxyC)&&atom(r.methoxyC).hydrogenCount===3&&atom(r.methoxyO).hydrogenCount===0&&edge(r.B3,r.methoxyO)?.order===1&&edge(r.methoxyO,r.methoxyC)?.order===1&&eq(r.methoxyAtoms,[r.methoxyO,r.methoxyC]),'B3 methoxy group');
 else requireValue(eq(r.methoxyAtoms,[])&&r.methoxyO===null&&r.methoxyC===null,'no invented methoxy');
 requireValue(c.diagram.graphSha256===ref.graph&&sha256(canon(graphRecord(c)))===ref.graph,'pinned source graph, roles and stereo');
 featureCheck(c,ref,atoms,bonds,adj);
 svgCheck(c,ref,atoms,bonds);
 return c;
}

function featureCheck(c,ref,atoms,bonds,adj){
 requireValue(obj(c.features)&&sameSet(Object.keys(c.features),FLAVONOID_FEATURE_IDS),'feature inventory');
 const r=c.roles,closed=!!r.ringC.length,put=(key,ids,bids=null,anchors=[],present=true)=>({ids:[...new Set(ids.filter(Boolean))],bids,anchors,present});
 const o3=closed?adj.get(r.C3).filter(id=>!r.ringC.includes(id)&&atoms.get(id).element==='O'):[];
 const sub=ref.values[3],sugar=c.id==='isoquercetin',methoxy=c.id==='isorhamnetin',hasCarbonyl=closed&&ref.values[2]===true;
 const expected={
  ringClosure:put('ringClosure',closed?r.ringC:r.bridge),
  c2c3:put('c2c3',closed?[r.C2,r.C3]:[r.alphaC,r.betaC]),
  c4Carbonyl:put('c4Carbonyl',!closed?[r.carbonylC,r.carbonylO]:hasCarbonyl?[r.C4,r.carbonylO]:[],closed&&!hasCarbonyl?[]:null,closed?[r.C4]:[],!closed||hasCarbonyl),
  c3Substitution:!closed?put('c3Substitution',[],[],r.bridge,false):put('c3Substitution',sub==='OH'?[r.C3,...o3]:sub==='O-glycoside'?[r.C3,...o3,r.sugarAnomericC]:sub==='B-ring'?[r.C3,r.B1]:[],sub==='H'?[]:null,[r.C3],sub!=='H'),
  bAttachment:put('bAttachment',[r.B1,r.bAttachmentAtom]),
  charge:put('charge',c.atoms.filter(a=>a.formalCharge).map(a=>a.id),[],[],!!ref.charge),
  glycoside:put('glycoside',sugar?[r.C3,r.glycosidicO,r.sugarAnomericC,...r.sugarAtoms]:[],sugar?null:[],[],sugar),
  methoxy:put('methoxy',methoxy?[r.B3,...r.methoxyAtoms]:[],methoxy?null:[],[],methoxy),
 };
 for(const [i,key] of FLAVONOID_FEATURE_IDS.entries()){
  const f=c.features[key],e=expected[key];requireValue(obj(f)&&f.featureId===key&&eq(f.value,ref.values[i]),'source-backed feature value '+key);
  requireValue(typeof f.label==='string'&&f.label.length>0&&typeof f.display==='string'&&f.display.length>0&&typeof f.note==='string','feature text');
  requireValue(f.present===e.present&&sameSet(f.atomIds,e.ids)&&sameSet(f.anchorAtomIds,e.anchors),'feature atom/anchor semantics '+key);
  const expectedBonds=e.bids??[...bonds.values()].filter(b=>e.ids.includes(b.a)&&e.ids.includes(b.b)).map(b=>b.id);
  requireValue(sameSet(f.bondIds,expectedBonds),'feature exact bond semantics '+key);
 }
 if(sub==='OH')requireValue(o3.length===1&&atoms.get(o3[0]).hydrogenCount===1,'free C3 OH graph');
 if(sub==='H')requireValue(o3.length===0&&atoms.get(r.C3).hydrogenCount>0,'unoxygenated C3 graph');
}

/** Validate without modifying the supplied object. Returns that object on success. */
export function validateFlavonoidDataset(data){header(data);sourceCheck(data);for(const c of data.cases)caseCheck(c);return data;}

/** Case lookup is deliberately finite; arbitrary structures are out of scope. */
export function getCase(data,caseId){
 if(!FLAVONOID_CASE_IDS.includes(caseId))throw new RangeError('Unknown flavonoid case');
 header(data);sourceCheck(data);return clone(caseCheck(data.cases.find(c=>c.id===caseId)));
}
export function featureHighlights(data,caseId,featureId){
 if(!FLAVONOID_FEATURE_IDS.includes(featureId))throw new RangeError('Unknown flavonoid feature');
 return getCase(data,caseId).features[featureId];
}
export function compareCases(data,leftCaseId,rightCaseId){
 const left=getCase(data,leftCaseId),right=getCase(data,rightCaseId);
 return {leftCaseId,rightCaseId,sameClass:left.classId===right.classId,
  rows:FLAVONOID_FEATURE_IDS.map(featureId=>({featureId,label:left.features[featureId].label,left:left.features[featureId],right:right.features[featureId],same:eq(left.features[featureId].value,right.features[featureId].value)})),
  kind:'structural-comparison',isReaction:false,featureScope:'selected-teaching-features',completeStructureComparison:false};
}
