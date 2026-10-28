import * as THREE from 'three';
import {TrackballControls} from '../vendor/TrackballControls.js';
import {validateLactaseMolecular} from './lactase-molecular-model.js';

export const LACTASE_DOMAIN_COLORS=Object.freeze({signal:'#8c9290',I:'#a899c4',II:'#be9479',III:'#638f99',IV:'#c67555',linker:'#a8a392',membrane:'#677a63',tail:'#8a8d89'});
export const LACTASE_ATOM_COLORS=Object.freeze({C:'#6e7b83',N:'#447dd1',O:'#dd6559',S:'#d8b63e',P:'#aa77bd',H:'#eeeeee'});
export const LACTASE_CONFIDENCE_COLORS=Object.freeze({veryHigh:'#0053d6',confident:'#65cbf3',low:'#ffdb13',veryLow:'#ff7d45'});
const vector=point=>new THREE.Vector3(...point);
const finitePoint=point=>Array.isArray(point)&&point.length===3&&point.every(Number.isFinite);
const validModes={range:['mature','full','IV'],representation:['trace','atoms','site','residue'],color:['domain','confidence']};
const canonicalDomain=value=>String(value||'').replace(/^(?:domain[\s_-]*)/i,'');
const confidenceColor=value=>value>=90?LACTASE_CONFIDENCE_COLORS.veryHigh:value>=70?LACTASE_CONFIDENCE_COLORS.confident:value>=50?LACTASE_CONFIDENCE_COLORS.low:LACTASE_CONFIDENCE_COLORS.veryLow;
const domainColor=value=>LACTASE_DOMAIN_COLORS[canonicalDomain(value)]||'#87968c';
const asRange=value=>Array.isArray(value)&&value.length===2?value:value&&Number.isInteger(value.start)&&Number.isInteger(value.end)?[value.start,value.end]:null;

/** Source coordinates are immutable. Tubes only join Cα coordinates, not covalent bonds. */
export class LactaseMolecularViewer{
  constructor(container,{onSelect=()=>{},onError=()=>{}}={}){
    this.container=container;this.onSelect=onSelect;this.onError=onError;
    this.disposed=false;this.dataset=null;this.contextLost=false;this.view={range:'mature',representation:'atoms',color:'domain',residueNumber:1749};
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(38,1,.1,4000);
    try{this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});}catch(error){this.onError(error);throw error;}
    this.renderer.setPixelRatio(Math.min(typeof devicePixelRatio==='number'?devicePixelRatio:1,2));this.renderer.setClearColor(0x000000,0);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.canvas=this.renderer.domElement;this.canvas.tabIndex=0;
    this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','人體乳糖酶的原子座標三維模型。拖曳或方向鍵旋轉，加減鍵縮放；點選原子或使用殘基選單閱讀其資料。');
    this.canvas.style.touchAction='none';container.append(this.canvas);
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x687976,2.25));
    for(const [power,position] of [[2,[70,95,85]],[1,[-50,10,-80]]]){const light=new THREE.DirectionalLight(0xffffff,power);light.position.set(...position);this.scene.add(light);}
    this.group=new THREE.Group();this.scene.add(this.group);this.pickables=[];
    this.controls=new TrackballControls(this.camera,this.canvas);
    this.controls.rotateSpeed=2;this.controls.dynamicDampingFactor=.12;this.controls.minDistance=3;this.controls.maxDistance=2000;
    this.needsRender=true;this.controls.addEventListener('change',()=>{this.needsRender=true;});this.camera.position.set(100,75,140);
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.listeners=new AbortController();const eventOptions={signal:this.listeners.signal};
    this.canvas.addEventListener('pointerdown',event=>{this.controls.handleResize();this.down=[event.clientX,event.clientY];},eventOptions);
    this.canvas.addEventListener('pointercancel',()=>{this.down=null;},eventOptions);
    this.canvas.addEventListener('pointerup',event=>{
      const down=this.down;this.down=null;if(!down||Math.hypot(event.clientX-down[0],event.clientY-down[1])>5||this.disposed)return;
      const rect=this.canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
      this.pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
      this.camera.updateMatrixWorld();this.scene.updateMatrixWorld(true);this.raycaster.setFromCamera(this.pointer,this.camera);
      const hit=this.raycaster.intersectObjects(this.pickables,false)[0];
      const selected=hit?.object.userData.instanceRecords?.[hit.instanceId];
      if(selected)this.onSelect({...selected});
    },eventOptions);
    this.canvas.addEventListener('keydown',event=>{
      const direction={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[event.key];
      if(direction){event.preventDefault();this.rotate(direction);}else if(event.key==='+'||event.key==='='){event.preventDefault();this.zoom('in');}else if(event.key==='-'){event.preventDefault();this.zoom('out');}
    },eventOptions);
    this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.contextLost=true;if(!this.disposed)this.onError(new Error('3D 顯示暫時中斷，原子座標與文字資料仍可閱讀。'));},eventOptions);
    this.canvas.addEventListener('webglcontextrestored',()=>{if(this.disposed)return;this.contextLost=false;this.needsRender=true;},eventOptions);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();this.animate();
  }
  clear(){
    const geometries=new Set(),materials=new Set();
    this.group.traverse(object=>{if(object.isInstancedMesh)object.dispose();if(object.geometry)geometries.add(object.geometry);if(object.material)for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);});
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());this.group.clear();this.pickables=[];
  }
  resize(){
    if(this.disposed)return false;const width=this.container.clientWidth,height=this.container.clientHeight;if(!width||!height)return false;
    this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height);this.controls.handleResize();this.needsRender=true;
    if(this.pendingFit){const focus=this.pendingFit;this.pendingFit=null;this.fitPoints(focus==='site'?this.sitePoints:focus==='residue'?this.focusPoints:this.visiblePoints,focus!=='all');}return true;
  }
  setDataset(dataset){
    if(this.disposed)return false;
    validateLactaseMolecular(dataset);
    if(!dataset||dataset.schema!=='lactase-molecular/v1'||!Array.isArray(dataset.residues)||!dataset.residues.length||!Array.isArray(dataset.atoms)||!dataset.atoms.length||!Array.isArray(dataset.bonds))throw new TypeError('乳糖酶原子座標資料格式不完整。');
    const residues=new Map(),atoms=new Map();
    for(const residue of dataset.residues){if(!Number.isInteger(residue.number)||residues.has(residue.number)||!finitePoint(residue.ca)||!Array.isArray(residue.atomIndices))throw new TypeError('乳糖酶殘基座標不一致。');residues.set(residue.number,residue);}
    for(const atom of dataset.atoms){if(!Number.isInteger(atom.index)||atoms.has(atom.index)||!finitePoint(atom.position)||!residues.has(atom.residueNumber)||typeof atom.name!=='string'||typeof atom.element!=='string')throw new TypeError('乳糖酶原子座標不一致。');atoms.set(atom.index,atom);}
    for(const residue of residues.values())for(const index of residue.atomIndices)if(!atoms.has(index)||atoms.get(index).residueNumber!==residue.number)throw new TypeError('乳糖酶殘基與原子索引不一致。');
    for(const bond of dataset.bonds)if(!atoms.has(bond.a)||!atoms.has(bond.b)||bond.a===bond.b||![1,2].includes(bond.order))throw new TypeError('乳糖酶化學鍵索引不一致。');
    if(!residues.has(dataset.activeSite?.acidBase)||!residues.has(dataset.activeSite?.nucleophile))throw new TypeError('乳糖酶催化殘基資料不完整。');
    this.dataset=dataset;this.residues=residues;this.atoms=atoms;
    this.neighbors=new Map(dataset.atoms.map(atom=>[atom.index,[]]));
    for(const bond of dataset.bonds){this.neighbors.get(bond.a).push(bond.b);this.neighbors.get(bond.b).push(bond.a);}
    this.siteNumbers=new Set([dataset.activeSite.acidBase,dataset.activeSite.nucleophile]);
    const anchors=[...this.siteNumbers].flatMap(number=>residues.get(number).atomIndices.map(index=>atoms.get(index)).filter(atom=>['CD','OE1','OE2'].includes(atom.name)));
    if(!anchors.length)throw new TypeError('乳糖酶催化側鏈座標不完整。');
    const thresholdSquared=8*8;this.siteResidues=new Set();
    for(const atom of dataset.atoms)if(anchors.some(anchor=>atom.position.reduce((sum,value,index)=>sum+(value-anchor.position[index])**2,0)<=thresholdSquared))this.siteResidues.add(atom.residueNumber);
    this.siteAnchors=anchors.map(atom=>vector(atom.position));this.setView(this.view);this.fit();return true;
  }
  inRange(residue,range=this.view.range){
    if(range==='full')return true;
    const explicit=asRange(this.dataset?.ranges?.[range]||this.dataset?.source?.ranges?.[range]);
    if(explicit)return residue.number>=explicit[0]&&residue.number<=explicit[1];
    if(range==='IV')return canonicalDomain(residue.domain)==='IV';
    // UniProt mature-chain start; the native source metadata can override this range.
    return residue.number>=869;
  }
  setView(view={}){
    if(this.disposed)return false;
    const next={...this.view,...view};for(const [key,modes] of Object.entries(validModes))if(!modes.includes(next[key]))throw new RangeError('Unknown lactase molecular display mode');
    if(!Number.isInteger(next.residueNumber))throw new RangeError('Unknown lactase residue number');
    if(this.dataset&&!this.residues.has(next.residueNumber))throw new RangeError('Unknown lactase residue number');
    if(this.dataset&&next.representation==='residue'&&!this.inRange(this.residues.get(next.residueNumber),next.range))throw new RangeError('Selected lactase residue is outside the displayed range');
    this.view=next;this.needsRender=true;if(!this.dataset)return true;this.clear();
    const visibleResidues=this.dataset.residues.filter(residue=>this.inRange(residue));
    const visibleNumbers=new Set(visibleResidues.map(residue=>residue.number));this.visibleResidues=visibleResidues;
    this.visiblePoints=visibleResidues.map(residue=>vector(residue.ca));
    this.focusPoints=[];this.sitePoints=[];
    const selected=this.residues.get(next.residueNumber);if(selected&&visibleNumbers.has(selected.number))this.focusPoints=selected.atomIndices.map(index=>vector(this.atoms.get(index).position));
    const sphere=new THREE.SphereGeometry(1,14,10),cylinder=new THREE.CylinderGeometry(1,1,1,9,1),ballMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.58,metalness:0}),bondMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.72,metalness:0});
    const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),axis=new THREE.Vector3(0,1,0);
    const makeBalls=(records,{radius=.5,trace=false,opacity=1}={})=>{
      if(!records.length)return null;
      const material=opacity<1?new THREE.MeshStandardMaterial({color:0xffffff,roughness:.7,transparent:true,opacity,depthWrite:false}):ballMaterial;
      const mesh=new THREE.InstancedMesh(sphere,material,records.length);mesh.userData.instanceRecords=[];
      records.forEach((record,index)=>{
        const point=trace?record.ca:record.position,residue=trace?record:this.residues.get(record.residueNumber),chosen=residue.number===next.residueNumber;
        const size=radius*(chosen&&next.representation!=='residue'?1.18:1)*(record.element==='S'?1.16:1);
        matrix.compose(vector(point),rotation.identity(),scale.setScalar(size));mesh.setMatrixAt(index,matrix);
        const color=next.color==='confidence'?confidenceColor(trace?residue.confidence:record.confidence):trace?domainColor(residue.domain):LACTASE_ATOM_COLORS[record.element]||'#9c86ab';
        mesh.setColorAt(index,new THREE.Color(color));
        const atom=trace?residue.atomIndices.map(atomIndex=>this.atoms.get(atomIndex)).find(atom=>atom.name==='CA'):record;
        mesh.userData.instanceRecords.push({residueNumber:residue.number,atomName:atom?.name||'CA',atomIndex:atom?.index??null});
      });
      mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();this.group.add(mesh);this.pickables.push(mesh);return mesh;
    };
    const makeBonds=(included,{radius=.13}={})=>{
      const bonds=this.dataset.bonds.filter(bond=>included.has(bond.a)&&included.has(bond.b));
      const halves=[];
      for(const bond of bonds){
        const a=this.atoms.get(bond.a),b=this.atoms.get(bond.b),start=vector(a.position),end=vector(b.position),direction=end.clone().sub(start);
        if(direction.lengthSq()<1e-10)continue;
        let offset=new THREE.Vector3();if(bond.order===2){
          const neighbor=this.neighbors.get(a.index).map(index=>this.atoms.get(index)).find(atom=>atom.index!==b.index&&atom.residueNumber===a.residueNumber&&new THREE.Vector3().crossVectors(direction,vector(atom.position).sub(start)).lengthSq()>1e-6);
          if(neighbor){const normal=new THREE.Vector3().crossVectors(direction,vector(neighbor.position).sub(start));offset.crossVectors(normal,direction);}
          else{offset.crossVectors(direction,new THREE.Vector3(0,1,0));if(offset.lengthSq()<1e-10)offset.crossVectors(direction,new THREE.Vector3(1,0,0));}
          offset.normalize().multiplyScalar(.15);
        }
        for(const sign of bond.order===2?[-1,1]:[0]){
          const from=start.clone().addScaledVector(offset,sign),to=end.clone().addScaledVector(offset,sign),middle=from.clone().add(to).multiplyScalar(.5),rodRadius=bond.order===2?radius*.67:radius;
          halves.push([from,middle,a,rodRadius,bond],[middle,to,b,rodRadius,bond]);
        }
      }
      if(!halves.length)return 0;
      const mesh=new THREE.InstancedMesh(cylinder,bondMaterial,halves.length);mesh.name='covalent-bond-sticks';mesh.userData.instanceRecords=[];
      halves.forEach(([start,end,atom,radius,bond],index)=>{
        const direction=end.clone().sub(start),midpoint=start.clone().add(end).multiplyScalar(.5),length=direction.length();
        matrix.compose(midpoint,rotation.setFromUnitVectors(axis,direction.normalize()),scale.set(radius,length,radius));mesh.setMatrixAt(index,matrix);
        mesh.setColorAt(index,new THREE.Color(next.color==='confidence'?confidenceColor(atom.confidence):LACTASE_ATOM_COLORS[atom.element]||'#a3a1a2'));
        mesh.userData.instanceRecords.push({...bond,from:start.toArray(),to:end.toArray()});
      });
      mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();this.group.add(mesh);return bonds.length;
    };
    const makeTrace=(residues,{faint=false}={})=>{
      if(!residues.length)return;
      const runs=[];let run=[];
      for(const residue of residues){const previous=run.at(-1);if(previous&&(residue.number!==previous.number+1||vector(residue.ca).distanceTo(vector(previous.ca))>5)){runs.push(run);run=[];}run.push(residue);}if(run.length)runs.push(run);
      for(const residues of runs){
        if(residues.length<2)continue;
        const curve=new THREE.CatmullRomCurve3(residues.map(residue=>vector(residue.ca)),false,'centripetal');curve.arcLengthDivisions=Math.max(200,residues.length*6);
        const segments=(residues.length-1)*4,radial=6,geometry=new THREE.TubeGeometry(curve,segments,faint?.22:.39,radial,false),colors=[];
        for(let i=0;i<=segments;i++){
          const residue=residues[Math.min(residues.length-1,Math.round(curve.getUtoTmapping(i/segments)*(residues.length-1)))],color=new THREE.Color(next.color==='confidence'?confidenceColor(residue.confidence):domainColor(residue.domain));
          for(let j=0;j<=radial;j++)colors.push(color.r,color.g,color.b);
        }
        geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
        this.group.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,transparent:faint,opacity:faint?.18:1,depthWrite:!faint})));
      }
      if(!faint)makeBalls(residues,{radius:.48,trace:true});
    };
    let renderedAtoms=[],bondCount=0;
    if(next.representation==='atoms'){
      renderedAtoms=this.dataset.atoms.filter(atom=>visibleNumbers.has(atom.residueNumber));makeBalls(renderedAtoms,{radius:.48});bondCount=makeBonds(new Set(renderedAtoms.map(atom=>atom.index)));
      this.visiblePoints=renderedAtoms.map(atom=>vector(atom.position));
    }else{
      if(next.representation==='trace')makeTrace(visibleResidues);
      const atomNumbers=next.representation==='residue'?new Set([next.residueNumber]):next.representation==='site'?new Set([...this.siteResidues].filter(number=>visibleNumbers.has(number))):new Set([...this.siteNumbers,next.residueNumber].filter(number=>visibleNumbers.has(number)));
      renderedAtoms=this.dataset.atoms.filter(atom=>atomNumbers.has(atom.residueNumber));makeBalls(renderedAtoms,{radius:next.representation==='residue'?.31:next.representation==='site'?.46:.53});bondCount=makeBonds(new Set(renderedAtoms.map(atom=>atom.index)),{radius:next.representation==='residue'?.10:.14});
      this.visiblePoints.push(...renderedAtoms.map(atom=>vector(atom.position)));
      if(next.representation==='site'||next.representation==='residue')this.visiblePoints=renderedAtoms.map(atom=>vector(atom.position));
    }
    this.sitePoints=this.dataset.atoms.filter(atom=>this.siteResidues.has(atom.residueNumber)&&visibleNumbers.has(atom.residueNumber)).map(atom=>vector(atom.position));
    // Wire halos identify functional residues without adding fabricated atom coordinates.
    const renderedNumbers=new Set(renderedAtoms.map(atom=>atom.residueNumber));
    const halos=next.representation==='residue'?[]:[...this.siteNumbers,next.residueNumber].filter((number,index,numbers)=>numbers.indexOf(number)===index&&renderedNumbers.has(number));
    if(halos.length){
      const geometry=new THREE.SphereGeometry(1,12,9),materials=new Map();
      for(const number of halos){const isSelected=number===next.residueNumber,color=isSelected?'#34463f':'#9c3e38';if(!materials.has(color))materials.set(color,new THREE.MeshBasicMaterial({color,wireframe:true,transparent:true,opacity:.7}));
        const mesh=new THREE.Mesh(geometry,materials.get(color));mesh.position.copy(vector(this.residues.get(number).ca));mesh.scale.setScalar(isSelected?1.08:.92);this.group.add(mesh);}
    }
    // Unused shared primitives/materials have no owner in the scene.
    if(!this.group.children.some(object=>object.geometry===sphere))sphere.dispose();
    if(!this.group.children.some(object=>object.geometry===cylinder))cylinder.dispose();
    if(!this.group.children.some(object=>object.material===ballMaterial))ballMaterial.dispose();
    if(!this.group.children.some(object=>object.material===bondMaterial))bondMaterial.dispose();
    this.renderStats={residues:visibleResidues.length,renderedResidues:renderedNumbers.size,atoms:renderedAtoms.length,bonds:bondCount,siteResidues:this.siteResidues.size};
    this.needsRender=true;return true;
  }
  settle(){
    this.controls._lastAngle=0;this.controls._lastRollAngle=0;
    for(const [before,after] of [['_movePrev','_moveCurr'],['_zoomStart','_zoomEnd'],['_panStart','_panEnd']])this.controls[before]?.copy(this.controls[after]);
    this.controls._touchZoomDistanceStart=this.controls._touchZoomDistanceEnd=Math.max(1e-6,this.controls._touchZoomDistanceEnd||0);this.controls._touchRollPointerIds='';
  }
  fitPoints(points,close=false){
    if(this.disposed||!this.dataset||!points?.length)return false;
    if(!this.container.clientWidth||!this.container.clientHeight)return false;
    const center=new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3()),direction=new THREE.Vector3(.7,.5,1).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
    const tanY=Math.tan(this.camera.fov*Math.PI/360),tanX=tanY*this.camera.aspect;let distance=close?15:20;
    for(const point of points){const offset=point.clone().sub(center);distance=Math.max(distance,offset.dot(direction)+(Math.abs(offset.dot(right))+2.5)/(tanX*.82),offset.dot(direction)+(Math.abs(offset.dot(up))+2.5)/(tanY*.82));}
    this.controls.maxDistance=Math.max(2000,distance*4);this.camera.far=Math.max(4000,distance*6);this.camera.updateProjectionMatrix();
    this.settle();this.controls.target.copy(center);this.camera.position.copy(center).add(direction.multiplyScalar(distance));this.camera.up.set(0,1,0);this.controls.update();this.needsRender=true;return true;
  }
  fit(){if(!this.container.clientWidth||!this.container.clientHeight){this.pendingFit='all';return false;}return this.fitPoints(this.visiblePoints);}
  focusSite(){if(!this.container.clientWidth||!this.container.clientHeight){this.pendingFit='site';return false;}return this.fitPoints(this.sitePoints,true);}
  focusResidue(number){
    if(this.disposed||!this.residues?.has(number))return false;
    const residue=this.residues.get(number),next={residueNumber:number,representation:'residue'};if(!this.inRange(residue))next.range='full';
    this.setView(next);
    if(!this.container.clientWidth||!this.container.clientHeight){this.pendingFit='residue';return false;}return this.fitPoints(this.focusPoints,true);
  }
  rotate(direction){
    if(this.disposed)return false;const angles={left:[-.18,0],right:[.18,0],up:[0,.18],down:[0,-.18]}[direction];if(!angles)return false;
    this.settle();const offset=this.camera.position.clone().sub(this.controls.target),up=this.camera.up.clone().normalize(),right=new THREE.Vector3().crossVectors(up,offset).normalize(),yaw=new THREE.Quaternion().setFromAxisAngle(up,angles[0]),pitch=new THREE.Quaternion().setFromAxisAngle(right,angles[1]);
    offset.applyQuaternion(yaw).applyQuaternion(pitch);this.camera.up.applyQuaternion(pitch).normalize();this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.needsRender=true;return true;
  }
  zoom(direction){
    if(this.disposed||!['in','out'].includes(direction))return false;this.settle();const offset=this.camera.position.clone().sub(this.controls.target);
    offset.setLength(Math.max(this.controls.minDistance,Math.min(this.controls.maxDistance,offset.length()*(direction==='in'?.8:1.25))));this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.needsRender=true;return true;
  }
  cameraState(){return {position:this.camera.position.toArray(),target:this.controls.target.toArray(),up:this.camera.up.toArray(),aspect:this.camera.aspect};}
  restoreCamera(state){
    if(this.disposed||!state||![state.position,state.target,state.up].every(finitePoint)||!Number.isFinite(state.aspect)||Math.abs(state.aspect-this.camera.aspect)>1e-6)return false;
    const eye=vector(state.position).sub(vector(state.target)),up=vector(state.up);if(eye.length()<this.controls.minDistance||eye.length()>this.controls.maxDistance||up.length()<1e-6||new THREE.Vector3().crossVectors(eye.clone().normalize(),up.clone().normalize()).lengthSq()<1e-12)return false;
    this.settle();this.camera.position.fromArray(state.position);this.controls.target.fromArray(state.target);this.camera.up.copy(up.normalize());this.controls.update();this.needsRender=true;return true;
  }
  animate(){
    if(this.disposed)return;this.frame=requestAnimationFrame(()=>this.animate());
    if(document.hidden||this.contextLost||!this.container.clientWidth||!this.container.clientHeight||this.container.closest?.('[hidden]'))return;
    this.controls.update();if(this.needsRender){try{this.renderer.render(this.scene,this.camera);this.needsRender=false;}catch(error){this.contextLost=true;this.onError(error);}}
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.frame);this.listeners.abort();this.resizeObserver.disconnect();this.controls.dispose();this.clear();this.renderer.dispose();this.renderer.forceContextLoss();this.canvas.remove();
  }
}
