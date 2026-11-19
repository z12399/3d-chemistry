import * as THREE from 'three';
import {TrackballControls} from '../vendor/TrackballControls.js';
import {layoutAtomLabels} from './label-layout.js';
import {AtomLabelMetrics} from './label-metrics.js';

const COLORS={C:0x557d91,O:0xe86d54,H:0xe4ecef,N:0x577cec,S:0xd9b53d};
const CORE_LABELS={AC1:'Gal C1',BO4:'橋氧 O4',E1749Oreact:'E1749–O',E1538Oreact:'E1538–O',Ow:'水來源 O',E1538Hacid:'移動 H',Hwa:'水 H'};
const finitePoint=value=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite);
const key=bond=>[bond.a,bond.b].sort().join('–');
const clamp=value=>Math.max(0,Math.min(1,value));

/**
 * Persistent GPU primitives for a finite teaching model. Frames are illustrations,
 * not protein coordinates or a measured reaction trajectory. Strength changes
 * visual opacity only; it never claims a measured fractional chemical bond order.
 */
export class LactaseReactionViewer{
  constructor(container,{onAtom=()=>{},onBond=()=>{},onError=()=>{}}={}){
    this.container=container;this.onAtom=onAtom;this.onBond=onBond;this.onError=onError;
    this.disposed=false;this.contextLost=false;this.needsRender=true;
    this.atomMeshes=new Map();this.bondMeshes=new Map();this.labels=new Map();this.materials=new Set();this.pickables=[];
    this._showH=true;this._showLabels=true;this._renderMode='ball';this.selected=[];this.currentFrame=null;
    this.stats={atomMeshes:0,bondRecords:0,geometryAllocations:2,materialAllocations:0,frames:0,renders:0};
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(38,1,.1,500);this.camera.position.set(12,9,18);
    try{this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});}catch(error){this.onError(error);throw error;}
    this.renderer.setPixelRatio(Math.min(typeof devicePixelRatio==='number'?devicePixelRatio:1,2));this.renderer.setClearColor(0x000000,0);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
    this.canvas=this.renderer.domElement;this.canvas.tabIndex=0;this.canvas.style.touchAction='none';
    this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','乳糖酶水解乳糖的連續三維教學模型。拖曳或方向鍵旋轉，加減鍵縮放；點選原子閱讀原子資料。');container.append(this.canvas);
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x65766d,2.1));
    for(const [power,position] of [[2.3,[8,12,10]],[1,[-8,2,-5]]]){const light=new THREE.DirectionalLight(0xffffff,power);light.position.set(...position);this.scene.add(light);}
    this.group=new THREE.Group();this.scene.add(this.group);
    this.sphere=new THREE.SphereGeometry(1,18,12);this.cylinder=new THREE.CylinderGeometry(1,1,1,10,1);
    this.elementMaterials=new Map();this.accentMaterial=this.makeMaterial({color:0x41a991,emissive:0x083d31,roughness:.4});
    this.controls=new TrackballControls(this.camera,this.canvas);this.controls.rotateSpeed=2.1;this.controls.dynamicDampingFactor=.12;this.controls.minDistance=3;this.controls.maxDistance=150;
    this.controls.addEventListener('change',()=>{this.needsRender=true;});
    this.labelLayer=document.createElement('div');this.labelLayer.className='lph-reaction-labels lph-catalytic-labels';
    this.labelLayer.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden';this.labelLayer.setAttribute('aria-hidden','true');container.append(this.labelLayer);
    this.leaderLayer=document.createElementNS('http://www.w3.org/2000/svg','svg');this.leaderLayer.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden';this.labelLayer.append(this.leaderLayer);
    this.labelMetrics=new AtomLabelMetrics();this.labelSizes=new WeakMap();
    // A paused animation must also relayout labels after a user font-size change.
    this.labelResizeObserver=new ResizeObserver(entries=>{
      if(this.disposed)return;
      for(const entry of entries){const box=entry.borderBoxSize?.[0]??entry.borderBoxSize,width=box?.inlineSize??entry.target.offsetWidth,height=box?.blockSize??entry.target.offsetHeight;if(!(width>0&&height>0))continue;const previous=this.labelSizes.get(entry.target);this.labelSizes.set(entry.target,{width,height});this.labelMetrics.store(entry.target,width,height);if(!previous||previous.width!==width||previous.height!==height)this.needsRender=true;}
    });
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.listeners=new AbortController();const options={signal:this.listeners.signal};
    this.canvas.addEventListener('pointerdown',event=>{this.controls.handleResize();this.down=[event.clientX,event.clientY];},options);
    this.canvas.addEventListener('pointercancel',()=>{this.down=null;},options);
    this.canvas.addEventListener('pointerup',event=>{const down=this.down;this.down=null;if(!down||Math.hypot(event.clientX-down[0],event.clientY-down[1])>5||this.disposed)return;const hit=this.pick(event.clientX,event.clientY);if(hit?.object.userData.atomId)this.onAtom(this.atoms.get(hit.object.userData.atomId));else if(hit?.object.userData.bondKey)this.onBond(this.bonds.get(hit.object.userData.bondKey));},options);
    this.canvas.addEventListener('keydown',event=>{const angles={ArrowLeft:[-.18,0],ArrowRight:[.18,0],ArrowUp:[0,.18],ArrowDown:[0,-.18]}[event.key];if(angles){event.preventDefault();this.orbitView(...angles);}else if(event.key==='+'||event.key==='='){event.preventDefault();this.zoomView(.8);}else if(event.key==='-'){event.preventDefault();this.zoomView(1.25);}},options);
    this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.contextLost=true;if(!this.disposed)this.onError(new Error('3D 顯示暫時中斷，可重新載入模型後繼續。'));},options);
    this.canvas.addEventListener('webglcontextrestored',()=>{if(this.disposed)return;this.contextLost=false;this.needsRender=true;},options);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();this.animate();
  }
  makeMaterial(options){const material=new THREE.MeshStandardMaterial({roughness:.45,metalness:.03,...options});this.materials.add(material);this.stats.materialAllocations++;return material;}
  get showH(){return this._showH;}
  set showH(value){this._showH=!!value;if(this.currentFrame)this.applyFrame();}
  get showLabels(){return this._showLabels;}
  set showLabels(value){this._showLabels=!!value;this.needsRender=true;}
  get renderMode(){return this._renderMode;}
  set renderMode(value){if(!['ball','space'].includes(value))throw new RangeError('Unknown reaction representation');this._renderMode=value;if(this.currentFrame)this.applyFrame();}
  setFrame(frame,{fit=false}={}){
    if(this.disposed)return false;
    if(!frame||!Array.isArray(frame.atoms)||!frame.atoms.length||!Array.isArray(frame.bonds))throw new TypeError('反應分子資料不完整。');
    const atoms=new Map(),bonds=new Map();
    for(const atom of frame.atoms){if(typeof atom.id!=='string'||atoms.has(atom.id)||typeof atom.element!=='string'||!finitePoint(atom.position))throw new TypeError('反應原子資料不一致。');atoms.set(atom.id,atom);}
    if(this.atoms&&(atoms.size!==this.atoms.size||[...atoms].some(([id,atom])=>this.atoms.get(id)?.element!==atom.element)))throw new TypeError('連續模型必須保存相同原子身分。');
    for(const bond of frame.bonds){const bondKey=key(bond);if(!atoms.has(bond.a)||!atoms.has(bond.b)||bond.a===bond.b||bonds.has(bondKey)||![1,2,3].includes(bond.order)||!Number.isFinite(bond.strength??1)||(bond.strength??1)<0||(bond.strength??1)>1)throw new TypeError('反應化學鍵資料不一致。');bonds.set(bondKey,bond);}
    this.currentFrame=frame;this.atoms=atoms;this.bonds=bonds;this.selected=Array.isArray(frame.selected)?[...frame.selected]:[];
    for(const atom of atoms.values())if(!this.atomMeshes.has(atom.id)){
      if(!this.elementMaterials.has(atom.element))this.elementMaterials.set(atom.element,this.makeMaterial({color:COLORS[atom.element]??0x969b9c}));
      const mesh=new THREE.Mesh(this.sphere,this.elementMaterials.get(atom.element));mesh.userData.atomId=atom.id;this.atomMeshes.set(atom.id,mesh);this.group.add(mesh);this.pickables.push(mesh);
    }
    for(const [bondKey,bond] of bonds)if(!this.bondMeshes.has(bondKey)){
      const material=this.makeMaterial({color:0x91a5a4,transparent:true,opacity:1,depthWrite:false});
      const rods=Array.from({length:3},()=>{const mesh=new THREE.Mesh(this.cylinder,material);mesh.userData.bondKey=bondKey;this.group.add(mesh);this.pickables.push(mesh);return mesh;});this.bondMeshes.set(bondKey,{rods,material});
    }
    this.stats.atomMeshes=this.atomMeshes.size;this.stats.bondRecords=this.bondMeshes.size;this.stats.frames++;
    this.applyFrame();if(fit||!this.fitted)this.fit();return true;
  }
  applyFrame(){
    if(this.disposed||!this.currentFrame)return;
    const selected=new Set(this.selected),visible=new Set();
    for(const [id,atom] of this.atoms){const mesh=this.atomMeshes.get(id);mesh.position.fromArray(atom.position);mesh.visible=this.showH||atom.element!=='H'||selected.has(id);if(mesh.visible)visible.add(id);
      const base=this.renderMode==='space'?({C:1.35,O:1.23,H:.8,N:1.3}[atom.element]??1.3):({C:.34,O:.32,H:.18,N:.33}[atom.element]??.34);
      mesh.scale.setScalar(base*(selected.has(id)&&this.renderMode==='ball'?1.12:1));mesh.material=selected.has(id)?this.accentMaterial:this.elementMaterials.get(atom.element);
    }
    const up=new THREE.Vector3(0,1,0),reference=new THREE.Vector3(0,0,1);
    for(const [bondKey,record] of this.bondMeshes){const bond=this.bonds.get(bondKey),strength=clamp(bond?.strength??(bond?1:0));const shown=!!bond&&strength>.001&&visible.has(bond.a)&&visible.has(bond.b)&&this.renderMode!=='space';
      record.material.opacity=strength;record.material.depthWrite=strength>=.999;record.material.color.setHex(bond?.kind==='forming'?0x42a78c:bond?.kind==='breaking'?0xc76552:0x819895);
      if(!shown){record.rods.forEach(rod=>{rod.visible=false;});continue;}
      const start=new THREE.Vector3(...this.atoms.get(bond.a).position),end=new THREE.Vector3(...this.atoms.get(bond.b).position),axis=end.clone().sub(start),length=axis.length();
      if(length<1e-6){record.rods.forEach(rod=>{rod.visible=false;});continue;}
      const normal=axis.clone().normalize(),perpendicular=new THREE.Vector3().crossVectors(normal,reference);if(perpendicular.lengthSq()<.001)perpendicular.crossVectors(normal,new THREE.Vector3(1,0,0));perpendicular.normalize();
      const middle=start.clone().add(end).multiplyScalar(.5),radius=bond.order===1?.07:.052;
      record.rods.forEach((rod,index)=>{rod.visible=index<bond.order;if(!rod.visible)return;rod.position.copy(middle).addScaledVector(perpendicular,(index-(bond.order-1)/2)*.16);rod.quaternion.setFromUnitVectors(up,normal);rod.scale.set(radius,length,radius);});
    }
    const requested=new Map(Object.entries(CORE_LABELS));for(const extra of this.currentFrame.labels??[])if(extra&&typeof extra.id==='string'&&typeof extra.text==='string')requested.set(extra.id,extra.text);
    this.activeLabelIds=new Set(requested.keys());
    for(const [id,text] of requested){if(!this.atoms.has(id))continue;if(!this.labels.has(id)){const el=document.createElement('span');el.className='atom-label selected';el.setAttribute('data-atom-id',id);this.labelLayer.append(el);this.labels.set(id,{id,el,mesh:this.atomMeshes.get(id)});this.labelMetrics.track(el);this.labelResizeObserver.observe(el,{box:'border-box'});}const label=this.labels.get(id);if(label.el.textContent!==text){label.el.textContent=text;this.labelMetrics.sizes.delete(label.el);}}
    this.stats.visibleAtoms=visible.size;this.stats.visibleBonds=[...this.bondMeshes.values()].filter(record=>record.rods.some(rod=>rod.visible)).length;this.needsRender=true;
  }
  resize(){if(this.disposed)return false;const width=this.container.clientWidth,height=this.container.clientHeight;if(!width||!height)return false;this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height);this.controls.handleResize();this.needsRender=true;if(this.pendingFit){this.pendingFit=false;this.fit();}return true;}
  settle(){this.controls._lastAngle=0;this.controls._lastRollAngle=0;for(const [before,after] of [['_movePrev','_moveCurr'],['_zoomStart','_zoomEnd'],['_panStart','_panEnd']])this.controls[before]?.copy(this.controls[after]);this.controls._touchZoomDistanceStart=this.controls._touchZoomDistanceEnd=Math.max(1e-6,this.controls._touchZoomDistanceEnd||0);this.controls._touchRollPointerIds='';}
  setTimelineBounds(bounds){
    if(this.disposed)return false;
    let points;
    if(Array.isArray(bounds)&&bounds.length&&bounds.every(finitePoint))points=bounds;
    else if(bounds&&finitePoint(bounds.min)&&finitePoint(bounds.max)&&bounds.min.every((value,index)=>value<=bounds.max[index]))points=Array.from({length:8},(_,index)=>bounds.min.map((value,axis)=>(index&(1<<axis))?bounds.max[axis]:value));
    else throw new TypeError('連續模型的視窗邊界不完整。');
    this.timelinePoints=points.map(point=>new THREE.Vector3(...point));return true;
  }
  fitBounds(bounds){if(!this.setTimelineBounds(bounds))return false;return this.fit();}
  fit(atomIds=null){
    if(this.disposed||!this.atoms?.size)return false;if(!this.container.clientWidth||!this.container.clientHeight){this.pendingFit=true;return false;}
    const chosen=[...this.atoms.values()].filter(atom=>(!atomIds||atomIds.includes(atom.id))&&this.atomMeshes.get(atom.id).visible);if(!chosen.length)return false;
    const points=!atomIds&&this.timelinePoints?.length?this.timelinePoints:chosen.map(atom=>new THREE.Vector3(...atom.position)),center=new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3()),direction=new THREE.Vector3(.7,.5,1).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
    const tanY=Math.tan(this.camera.fov*Math.PI/360),tanX=tanY*this.camera.aspect,padding=this.renderMode==='space'?1.8:.75;let distance=6;
    for(const point of points){const offset=point.clone().sub(center);distance=Math.max(distance,offset.dot(direction)+(Math.abs(offset.dot(right))+padding)/(tanX*.78),offset.dot(direction)+(Math.abs(offset.dot(up))+padding)/(tanY*.78));}
    this.settle();this.controls.maxDistance=Math.max(150,distance*4);this.camera.far=Math.max(500,distance*6);this.camera.updateProjectionMatrix();this.controls.target.copy(center);this.camera.position.copy(center).add(direction.multiplyScalar(distance));this.camera.up.set(0,1,0);this.controls.update();this.needsRender=true;this.fitted=true;return true;
  }
  orbitView(horizontal=0,vertical=0){if(this.disposed||!Number.isFinite(horizontal)||!Number.isFinite(vertical))return false;this.settle();const offset=this.camera.position.clone().sub(this.controls.target);if(offset.lengthSq()<1e-10)return false;const up=this.camera.up.clone().normalize(),right=new THREE.Vector3().crossVectors(up,offset).normalize(),yaw=new THREE.Quaternion().setFromAxisAngle(up,horizontal),pitch=new THREE.Quaternion().setFromAxisAngle(right,vertical);offset.applyQuaternion(yaw).applyQuaternion(pitch);this.camera.up.applyQuaternion(pitch).normalize();this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.needsRender=true;return true;}
  zoomView(factor){if(this.disposed||!Number.isFinite(factor)||factor<=0)return false;this.settle();const offset=this.camera.position.clone().sub(this.controls.target);offset.setLength(Math.max(this.controls.minDistance,Math.min(this.controls.maxDistance,offset.length()*factor)));this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.needsRender=true;return true;}
  cameraState(){return {position:this.camera.position.toArray(),target:this.controls.target.toArray(),up:this.camera.up.toArray(),aspect:this.camera.aspect};}
  restoreCamera(state){if(this.disposed||!state||![state.position,state.target,state.up].every(finitePoint)||!Number.isFinite(state.aspect)||Math.abs(state.aspect-this.camera.aspect)>1e-6)return false;const eye=new THREE.Vector3(...state.position).sub(new THREE.Vector3(...state.target)),up=new THREE.Vector3(...state.up);if(eye.length()<this.controls.minDistance||eye.length()>this.controls.maxDistance||up.length()<1e-6||new THREE.Vector3().crossVectors(eye,up).lengthSq()<1e-12)return false;this.settle();this.camera.position.fromArray(state.position);this.camera.up.copy(up.normalize());this.controls.target.fromArray(state.target);this.controls.update();this.needsRender=true;this.fitted=true;return true;}
  pick(clientX,clientY){if(this.disposed||this.contextLost)return null;const rect=this.canvas.getBoundingClientRect();if(!rect.width||!rect.height)return null;this.camera.updateMatrixWorld();this.scene.updateMatrixWorld(true);this.pointer.set((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2);this.raycaster.setFromCamera(this.pointer,this.camera);return this.raycaster.intersectObjects(this.pickables.filter(mesh=>mesh.visible),false)[0]??null;}
  updateLabels(width,height){
    if(!this.showLabels){this.labelLayer.style.display='none';return;}this.labelLayer.style.display='block';
    const eligible=[...this.labels.values()].filter(label=>this.activeLabelIds?.has(label.id)&&label.mesh.visible);this.labelMetrics.measure(eligible.map(label=>label.el));
    const projected=eligible.map(label=>{const anchor=label.mesh.position.clone().project(this.camera),size=this.labelMetrics.get(label.el);return {id:label.id,x:(anchor.x+1)*width/2,y:(1-anchor.y)*height/2,depth:anchor.z,width:size?.width??0,height:size?.height??0,selected:true};});
    const placements=new Map(layoutAtomLabels(projected,{width,height,maxOffset:48,selectedMaxOffset:Math.max(64,Math.min(width,height)*.4)}).map(placement=>[placement.id,placement]));this.leaderLayer.setAttribute('viewBox',`0 0 ${width} ${height}`);
    for(const label of this.labels.values()){const placement=placements.get(label.id);label.el.setAttribute('data-label-crowded',String(!!placement?.crowded));if(!placement||placement.hidden){label.el.style.display='none';if(label.line)label.line.style.display='none';continue;}label.el.style.display='block';label.el.style.left=placement.x.toFixed(2)+'px';label.el.style.top=placement.y.toFixed(2)+'px';if(placement.leader){if(!label.line){label.line=document.createElementNS('http://www.w3.org/2000/svg','line');label.line.setAttribute('stroke','#749284');label.line.setAttribute('stroke-width','1');this.leaderLayer.append(label.line);}label.line.style.display='block';for(const [name,value] of Object.entries(placement.leader))label.line.setAttribute(name,value.toFixed(2));}else if(label.line)label.line.style.display='none';}
  }
  animate(){if(this.disposed)return;this.frame=requestAnimationFrame(()=>this.animate());const width=this.container.clientWidth,height=this.container.clientHeight;if(document.hidden||this.contextLost||!width||!height||this.container.closest?.('[hidden]'))return;this.controls.update();if(!this.needsRender)return;try{this.renderer.render(this.scene,this.camera);this.updateLabels(width,height);this.needsRender=false;this.stats.renders++;}catch(error){this.contextLost=true;this.onError(error);}}
  dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.frame);this.listeners.abort();this.resizeObserver.disconnect();this.labelResizeObserver.disconnect();this.labelMetrics.dispose();this.controls.dispose();this.sphere.dispose();this.cylinder.dispose();this.materials.forEach(material=>material.dispose());this.group.clear();this.pickables=[];this.atomMeshes.clear();this.bondMeshes.clear();this.labels.clear();this.renderer.dispose();this.renderer.forceContextLoss();this.canvas.remove();this.labelLayer.remove();}
}
