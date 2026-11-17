import * as THREE from 'three';
import {TrackballControls} from '../vendor/TrackballControls.js';

export const STARCH_SPATIAL_COLORS = Object.freeze({amylose:'#35828b',amylopectin:'#bd6854',branch:'#dca72e',context:'#bdc3b4',C:'#60747d',O:'#cd584b',H:'#e9dfc7'});
const v = point => new THREE.Vector3(...point);

/** Each scene is fitted separately. Camera navigation changes observation, never molecular coordinates. */
export class StarchSpatialViewer {
  constructor(container,{onCamera=()=>{},onPick=()=>{},onError=()=>{},onFit=null}={}) {
    this.container=container;this.onCamera=onCamera;this.onPick=onPick;this.onError=onError;this.onFit=onFit;this.disposed=false;this.silent=false;
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(38,1,.1,800);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));this.renderer.setClearColor(0x000000,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.canvas=this.renderer.domElement;this.canvas.tabIndex=0;this.canvas.setAttribute('role','img');
    this.canvas.setAttribute('aria-label','澱粉空間結構。拖曳旋轉，滾輪縮放；方向鍵旋轉，加減鍵縮放，Home 回到全景。');
    this.canvas.style.touchAction='none';container.append(this.canvas);
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x818d82,2.3));
    for(const [power,position] of [[2,[30,45,60]],[1,[-40,5,-25]]]){const light=new THREE.DirectionalLight(0xffffff,power);light.position.set(...position);this.scene.add(light);}
    this.group=new THREE.Group();this.scene.add(this.group);this.pickables=[];
    this.controls=new TrackballControls(this.camera,this.canvas);this.controls.rotateSpeed=1.8;this.controls.zoomSpeed=1.1;this.controls.panSpeed=.5;this.controls.staticMoving=true;this.controls.minDistance=2;this.controls.maxDistance=160;
    this.camera.position.set(22,15,35);this.needsRender=true;
    this.controls.addEventListener('change',()=>{this.needsRender=true;if(!this.silent&&!this.disposed)this.onCamera(this.cameraState());});
    this.listeners=new AbortController();const options={signal:this.listeners.signal};
    this.canvas.addEventListener('pointerdown',event=>{this.controls.handleResize();this.down=[event.clientX,event.clientY];},options);
    this.canvas.addEventListener('pointerup',event=>{
      const down=this.down;this.down=null;if(!down||Math.hypot(event.clientX-down[0],event.clientY-down[1])>5)return;
      const rect=this.canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
      const ray=new THREE.Raycaster();this.camera.updateMatrixWorld();this.scene.updateMatrixWorld(true);
      ray.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2),this.camera);
      const hit=ray.intersectObjects(this.pickables)[0];if(hit)this.onPick(this.pickData?.(hit)||hit.object.userData);
    },options);
    this.canvas.addEventListener('keydown',event=>{
      const direction={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[event.key];
      if(direction){event.preventDefault();this.rotate(direction);}else if(['+','='].includes(event.key)){event.preventDefault();this.zoom('in');}else if(event.key==='-'){event.preventDefault();this.zoom('out');}else if(event.key==='Home'){event.preventDefault();if(this.onFit)this.onFit();else this.fit();}
    },options);
    this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();if(!this.disposed)this.onError();},options);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();this.animate();
  }
  clear() {
    const geometries=new Set(),materials=new Set();
    this.group.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)for(const item of Array.isArray(object.material)?object.material:[object.material])materials.add(item);});
    geometries.forEach(item=>item.dispose());materials.forEach(item=>item.dispose());this.group.clear();this.group.scale.setScalar(1);this.group.position.set(0,0,0);this.pickables=[];
  }
  setModel(model,{showResidues=true,showEnds=false}={}) {
    if(this.disposed)return;this.clear();this.model=model;
    const colors=STARCH_SPATIAL_COLORS,base=colors[model.kind],cache=new Map();let sphere;
    const material=(color,opacity=1)=>{const key=`${color}/${opacity}`;if(!cache.has(key))cache.set(key,new THREE.MeshStandardMaterial({color,roughness:.54,transparent:opacity<1,opacity,depthWrite:opacity===1}));return cache.get(key);};
    const ball=(point,radius,color,data,opacity=1)=>{sphere??=new THREE.SphereGeometry(1,14,10);const mesh=new THREE.Mesh(sphere,material(color,opacity));mesh.position.copy(v(point));mesh.scale.setScalar(radius);this.group.add(mesh);if(data){mesh.userData=data;this.pickables.push(mesh);}return mesh;};
    const rod=(a,b,radius,color,opacity=1)=>{const from=v(a),to=v(b),delta=to.clone().sub(from);if(delta.length()<1e-7)return;const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),8),material(color,opacity));mesh.position.copy(from.add(to).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());this.group.add(mesh);};
    const points=[];
    if(model.atomic){
      const atoms=new Map(model.atomic.atoms.map(atom=>[atom.id,atom]));const highlighted=new Set(model.atomic.highlightAtomIds||[]);
      const highlightedBonds=new Set(model.atomic.highlightBondIds||[]);
      for(const atom of model.atomic.atoms){
        points.push(v(atom.position));if(atom.element==='H'&&!showResidues)continue;
        ball(atom.position,atom.element==='H'?.24:atom.element==='O'?.43:.4,highlighted.has(atom.id)?colors.branch:colors[atom.element]||base,{label:`${atom.id} · ${atom.element}`,atomId:atom.id,role:'atom'});
      }
      for(const bond of model.atomic.bonds){const a=atoms.get(bond.a),b=atoms.get(bond.b);if(!a||!b||(!showResidues&&(a.element==='H'||b.element==='H')))continue;rod(a.position,b.position,highlightedBonds.has(bond.id)?.17:.11,highlightedBonds.has(bond.id)?colors.branch:'#9aaba8');}
    }else{
      for(const curve of model.curves||[]){
        if(curve.points.length<2)continue;const context=curve.role==='context';const color=curve.role==='double-helix'&&curve.id.includes(':1:')?'#dc947b':colors[curve.kind]||base;
        const path=new THREE.CatmullRomCurve3(curve.points.map(v),false,'centripetal');const radius=curve.radius??(context?.19:.28);
        this.group.add(new THREE.Mesh(new THREE.TubeGeometry(path,Math.max(24,curve.points.length*5),radius,8,false),material(color,context?.24:1)));
        if(!context)points.push(...curve.points.map(v));
      }
      const residues=new Map((model.residues||[]).map(residue=>[residue.id,residue]));
      for(const residue of model.residues||[]){if(residue.role==='context')continue;points.push(v(residue.position));if(showResidues)ball(residue.position,.38,colors[residue.kind]||base,{residueId:residue.id,label:`葡萄糖殘基 ${residue.id}`,role:'residue'});}
      for(const link of model.links||[]){if(link.acceptorCarbon!==6||link.kind!==model.kind)continue;const a=residues.get(link.donor),b=residues.get(link.acceptor);if(a&&b)rod(a.position,b.position,.28,colors.branch);}
    }
    for(const marker of model.markers||[]){
      if(marker.kind&&marker.kind!==model.kind)continue;
      if(marker.role?.endsWith('-end')&&!showEnds)continue;
      const branch=/branch|junction/.test(marker.role),radius=marker.radius??(model.scale==='atom'?.78:branch?.72:.46);
      if(model.scale==='atom'){
        ball(marker.position,radius,colors.branch,{...marker,label:marker.label||marker.id},0);continue;
      }
      const halo=new THREE.Mesh(new THREE.SphereGeometry(radius,16,12),new THREE.MeshBasicMaterial({color:branch?colors.branch:'#244e56',wireframe:true,transparent:true,opacity:.88}));
      halo.position.copy(v(marker.position));this.group.add(halo);
      const hit=ball(marker.position,radius,branch?colors.branch:base,{...marker,label:marker.label||marker.id},.08);hit.material.depthWrite=false;
    }
    for(const surface of model.surfaces||[]){
      const type=surface.type||surface.shape;
      if(type==='ellipsoid'||type==='sphere'||surface.role==='granule'){
        // An open sector reveals the interior; this is a teaching cutaway, not a measured granule.
        const geometry=new THREE.SphereGeometry(1,40,28,Math.PI*.18,Math.PI*1.52);
        const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#babdaa',transparent:true,opacity:surface.opacity??.15,roughness:.85,side:THREE.DoubleSide,depthWrite:false}));
        mesh.position.copy(v(surface.position||[0,0,0]));mesh.scale.set(...(surface.scale||[12,10,10]));this.group.add(mesh);
        const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,20),new THREE.LineBasicMaterial({color:'#9a9f8c',transparent:true,opacity:.28}));edges.position.copy(mesh.position);edges.scale.copy(mesh.scale);this.group.add(edges);
        // Include the envelope, so the cutaway does not crop when fitted.
        const scale=surface.scale||[12,10,10],center=surface.position||[0,0,0];for(const sign of [-1,1])points.push(v(center.map((n,i)=>n+sign*scale[i])));
      }
    }
    if(!points.length)points.push(new THREE.Vector3());
    const box=new THREE.Box3().setFromPoints(points),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    const factor=20/Math.max(size.x,size.y,size.z,1);this.group.scale.setScalar(factor);this.group.position.copy(center.multiplyScalar(-factor));
    this.fitPoints=points.map(point=>point.clone().multiplyScalar(factor).add(this.group.position));
    this.needsRender=true;this.canvas.dataset.kind=model.kind;this.canvas.dataset.scale=model.scale;this.canvas.dataset.residues=String(model.residues?.length||0);
  }
  resize(){if(this.disposed)return;const width=this.container.clientWidth,height=this.container.clientHeight;if(!width||!height)return;this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height);this.controls.handleResize();this.needsRender=true;}
  fit(){
    if(this.disposed)return;const direction=new THREE.Vector3(.58,.36,1).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
    const tanY=Math.tan(this.camera.fov*Math.PI/360),tanX=tanY*this.camera.aspect;let distance=28;
    for(const point of this.fitPoints||[])distance=Math.max(distance,point.dot(direction)+(Math.abs(point.dot(right))+1.2)/(tanX*.8),point.dot(direction)+(Math.abs(point.dot(up))+1.2)/(tanY*.8));
    this.controls.target.set(0,0,0);this.camera.position.copy(direction.multiplyScalar(Math.min(160,distance)));this.camera.up.set(0,1,0);this.controls.update();this.needsRender=true;
  }
  rotate(direction){if(this.disposed)return;const angles={left:[-.2,0],right:[.2,0],up:[0,.2],down:[0,-.2]}[direction];if(!angles)return;const offset=this.camera.position.clone().sub(this.controls.target),up=this.camera.up.clone().normalize(),right=new THREE.Vector3().crossVectors(up,offset).normalize();const yaw=new THREE.Quaternion().setFromAxisAngle(up,angles[0]),pitch=new THREE.Quaternion().setFromAxisAngle(right,angles[1]);offset.applyQuaternion(yaw).applyQuaternion(pitch);this.camera.up.applyQuaternion(pitch).normalize();this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.needsRender=true;}
  zoom(direction){if(this.disposed)return;const offset=this.camera.position.clone().sub(this.controls.target);offset.setLength(Math.max(2,Math.min(160,offset.length()*(direction==='in'?.8:1.25))));this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.needsRender=true;}
  focusBranch(){const marker=this.model?.markers?.find(item=>/branch|junction/.test(item.role));if(!marker)return false;this.group.updateMatrixWorld(true);const point=this.group.localToWorld(v(marker.position));const direction=this.camera.position.clone().sub(this.controls.target).normalize();this.controls.target.copy(point);this.camera.position.copy(point).add(direction.multiplyScalar(13));this.controls.update();this.needsRender=true;this.onPick(marker);return true;}
  cameraState(){return {position:this.camera.position.toArray(),target:this.controls.target.toArray(),up:this.camera.up.toArray()};}
  restoreCamera(state){if(this.disposed||!state||![state.position,state.target,state.up].every(point=>Array.isArray(point)&&point.length===3&&point.every(Number.isFinite)))return false;this.silent=true;try{this.camera.position.fromArray(state.position);this.controls.target.fromArray(state.target);this.camera.up.fromArray(state.up).normalize();this.controls.update();this.needsRender=true;}finally{this.silent=false;}return true;}
  animate(){if(this.disposed)return;this.frame=requestAnimationFrame(()=>this.animate());if(document.hidden||!this.container.clientWidth||!this.container.clientHeight)return;this.controls.update();if(this.needsRender){this.renderer.render(this.scene,this.camera);this.needsRender=false;}}
  dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.frame);this.listeners.abort();this.resizeObserver.disconnect();this.controls.dispose();this.clear();this.renderer.dispose();this.renderer.forceContextLoss();this.canvas.remove();}
}
