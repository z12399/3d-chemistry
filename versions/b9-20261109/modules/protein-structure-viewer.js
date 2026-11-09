import * as THREE from 'three';
import {TrackballControls} from '../vendor/TrackballControls.js';
import {proteinFeature,proteinResidue,validateProteinDataset} from './protein-structure-model.js';
import {buildProteinTopology} from './protein-structure-topology.js';

export const PROTEIN_VIEW_COLORS=Object.freeze({alpha:'#cb785c','310':'#9b7caa',sheet:'#b59945',other:'#77978b',A:'#397d9c',B:'#ad7145'});
export const PROTEIN_ATOM_COLORS=Object.freeze({C:'#687b87',N:'#356ed1',O:'#e04c43',S:'#e2b72d'});
const atomRadii={C:.37,N:.35,O:.34,S:.46};
const vector=point=>new THREE.Vector3(...point);

/** Deposited heavy atoms and template/source covalent connectivity; no Cα trace. */
export class ProteinStructureViewer{
  constructor(container,{onResidue=()=>{},onError=()=>{}}={}){
    this.container=container;this.onResidue=onResidue;this.onError=onError;
    this.disposed=false;this.dataset=null;this.view={chainMode:'A',colorMode:'element',viewScope:'all',featureId:null,residueId:'A:54'};
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(38,1,.1,2000);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0x000000,0);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.canvas=this.renderer.domElement;this.canvas.tabIndex=0;
    this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','6FXB 蛋白重原子球棍模型。拖曳或方向鍵旋轉，加減鍵縮放；點選原子或使用殘基選單閱讀來源資料。');
    this.canvas.style.touchAction='none';container.append(this.canvas);
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x6e7773,2.2));
    for(const [power,position] of [[2,[50,90,70]],[1,[-40,5,-70]]]){const light=new THREE.DirectionalLight(0xffffff,power);light.position.set(...position);this.scene.add(light);}
    this.group=new THREE.Group();this.scene.add(this.group);this.pickables=[];
    this.controls=new TrackballControls(this.camera,this.canvas);
    this.controls.rotateSpeed=2;this.controls.dynamicDampingFactor=.12;this.controls.minDistance=3;this.controls.maxDistance=500;
    this.needsRender=true;this.controls.addEventListener('change',()=>{this.needsRender=true;});
    this.camera.position.set(70,50,90);
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.listeners=new AbortController();const eventOptions={signal:this.listeners.signal};
    this.canvas.addEventListener('pointerdown',event=>{this.controls.handleResize();this.down=[event.clientX,event.clientY];},eventOptions);
    this.canvas.addEventListener('pointercancel',()=>{this.down=null;},eventOptions);
    this.canvas.addEventListener('pointerup',event=>{
      const down=this.down;this.down=null;
      if(!down||Math.hypot(event.clientX-down[0],event.clientY-down[1])>5||this.disposed)return;
      const rect=this.canvas.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      this.pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
      this.camera.updateMatrixWorld();this.scene.updateMatrixWorld(true);this.raycaster.setFromCamera(this.pointer,this.camera);
      const hit=this.raycaster.intersectObjects(this.pickables,false)[0];
      const selected=hit?.object.userData.instanceRecords?.[hit.instanceId];
      if(selected)this.onResidue(selected.residueId,{atomId:selected.atomId,atomName:selected.atomName});
    },eventOptions);
    this.canvas.addEventListener('keydown',event=>{
      const direction={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[event.key];
      if(direction){event.preventDefault();this.rotate(direction);}else if(event.key==='+'||event.key==='='){event.preventDefault();this.zoom('in');}else if(event.key==='-'){event.preventDefault();this.zoom('out');}
    },eventOptions);
    this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();if(!this.disposed)this.onError(new Error('3D 顯示暫時中斷，資料與文字仍可閱讀。'));},eventOptions);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
    this.animate();
  }
  clear(){
    const geometries=new Set(),materials=new Set();
    this.group.traverse(object=>{if(object.isInstancedMesh)object.dispose();if(object.geometry)geometries.add(object.geometry);if(object.material)for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);});
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());
    this.group.clear();this.pickables=[];this.atomMesh=null;this.bondMesh=null;
  }
  resize(){
    if(this.disposed)return;
    const width=this.container.clientWidth,height=this.container.clientHeight;
    if(!width||!height)return;
    this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height);this.controls.handleResize();
    this.needsRender=true;
    if(this.pendingFit){this.pendingFit=false;this.fit();}
  }
  setDataset(dataset){
    if(this.disposed)return;
    const checked=validateProteinDataset(dataset),topology=buildProteinTopology(checked);
    if(topology.missingAtoms.length||topology.chainBreaks.length)throw new TypeError('6FXB 球棍所需的來源重原子或肽骨架連接不完整。');
    this.dataset=checked;this.topology=topology;
    this.atoms=new Map(this.topology.atoms.map(atom=>[atom.id,atom]));
    this.neighbors=new Map(this.topology.atoms.map(atom=>[atom.id,[]]));
    for(const bond of this.topology.bonds){this.neighbors.get(bond.a).push(bond.b);this.neighbors.get(bond.b).push(bond.a);}
    this.setView(this.view);this.fit();
  }
  setView(view){
    if(this.disposed)return;
    const next={...this.view,...view};
    if(!['A','B','AB'].includes(next.chainMode)||!['element','secondary','chain'].includes(next.colorMode)||!['all','selection'].includes(next.viewScope))throw new RangeError('Unknown protein display mode');
    if(this.dataset&&(!proteinResidue(this.dataset,next.residueId)||(next.featureId!==null&&!proteinFeature(this.dataset,next.featureId))))throw new RangeError('Unknown protein selection');
    if(!this.dataset){this.view=next;this.needsRender=true;return;}
    const feature=proteinFeature(this.dataset,next.featureId),visible=chain=>next.chainMode==='AB'||next.chainMode===chain;
    const focusIds=new Set(feature?.residueIds||[next.residueId]);
    const records=this.topology.atoms.filter(atom=>visible(atom.chain)&&(next.viewScope==='all'||focusIds.has(atom.residueId))),included=new Set(records.map(atom=>atom.id));
    if(!records.length)throw new RangeError('Selected protein region is not visible in the chosen chain');
    this.view=next;this.needsRender=true;
    const bonds=this.topology.bonds.filter(bond=>included.has(bond.a)&&included.has(bond.b));
    this.clear();this.visiblePoints=records.map(atom=>vector(atom.position));this.renderedBonds=bonds;
    const sphere=new THREE.SphereGeometry(1,14,10),cylinder=new THREE.CylinderGeometry(1,1,1,9,1);
    const ballMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.38,metalness:0});
    const bondMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.55,metalness:0});
    const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),axis=new THREE.Vector3(0,1,0);
    const color=atom=>next.colorMode==='element'?PROTEIN_ATOM_COLORS[atom.element]:PROTEIN_VIEW_COLORS[next.colorMode==='chain'?atom.chain:atom.secondary];
    const radius=atom=>(atomRadii[atom.element]||.37)*(atom.residueId===next.residueId?1.08:1);
    const balls=new THREE.InstancedMesh(sphere,ballMaterial,records.length);
    balls.name='source-atom-balls';balls.userData.instanceRecords=[];
    records.forEach((atom,index)=>{
      matrix.compose(vector(atom.position),rotation.identity(),scale.setScalar(radius(atom)));balls.setMatrixAt(index,matrix);
      balls.setColorAt(index,new THREE.Color(color(atom)));
      balls.userData.instanceRecords.push({atomId:atom.id,atomName:atom.name,residueId:atom.residueId,chain:atom.chain});
    });
    balls.instanceMatrix.needsUpdate=true;balls.instanceColor.needsUpdate=true;balls.computeBoundingSphere();
    this.group.add(balls);this.pickables.push(balls);this.atomMesh=balls;

    // Each cylinder is an actual covalent edge. Double rods use a local atom plane,
    // while source atom centers remain unchanged. Aromatic orders are CCD Kekule form.
    const segments=[];
    for(const bond of bonds){
      const a=this.atoms.get(bond.a),b=this.atoms.get(bond.b),start=vector(a.position),end=vector(b.position),direction=end.clone().sub(start);
      let offset=new THREE.Vector3();
      if(bond.order===2){
        const neighbor=(this.neighbors.get(a.id)||[]).map(id=>this.atoms.get(id)).find(atom=>atom.id!==b.id&&atom.residueId===a.residueId&&new THREE.Vector3().crossVectors(direction,vector(atom.position).sub(start)).lengthSq()>1e-6);
        if(neighbor){const normal=new THREE.Vector3().crossVectors(direction,vector(neighbor.position).sub(start));offset.crossVectors(normal,direction);}
        else{offset.crossVectors(direction,new THREE.Vector3(0,1,0));if(offset.lengthSq()<1e-6)offset.crossVectors(direction,new THREE.Vector3(1,0,0));}
        offset.normalize().multiplyScalar(.135);
      }
      for(const sign of bond.order===2?[-1,1]:[0]){
        const from=start.clone().addScaledVector(offset,sign),to=end.clone().addScaledVector(offset,sign),middle=from.clone().add(to).multiplyScalar(.5);
        const width=bond.order===2?.066:bond.kind==='disulfide'?.135:.105;
        segments.push({from,to:middle,atom:a,width,bond},{from:middle,to,atom:b,width,bond});
      }
    }
    if(segments.length){
      const sticks=new THREE.InstancedMesh(cylinder,bondMaterial,segments.length);sticks.name='covalent-bond-sticks';
      sticks.userData.instanceRecords=[];
      segments.forEach(({from,to,atom,width,bond},index)=>{
        const direction=to.clone().sub(from),length=direction.length();
        matrix.compose(from.clone().add(to).multiplyScalar(.5),rotation.setFromUnitVectors(axis,direction.normalize()),scale.set(width,length,width));sticks.setMatrixAt(index,matrix);
        sticks.setColorAt(index,new THREE.Color(color(atom)));
        sticks.userData.instanceRecords.push({a:bond.a,b:bond.b,order:bond.order,kind:bond.kind,from:from.toArray(),to:to.toArray()});
      });
      sticks.instanceMatrix.needsUpdate=true;sticks.instanceColor.needsUpdate=true;sticks.computeBoundingSphere();this.group.add(sticks);this.bondMesh=sticks;
    }else{cylinder.dispose();bondMaterial.dispose();}

    // A thin outline marks the selected residue without inventing a Cα bead or path.
    const selected=records.filter(atom=>atom.residueId===next.residueId);
    if(selected.length){
      const outline=new THREE.InstancedMesh(sphere,new THREE.MeshBasicMaterial({color:'#263c45',side:THREE.BackSide}),selected.length);
      outline.name='selected-residue-outline';
      selected.forEach((atom,index)=>{matrix.compose(vector(atom.position),rotation.identity(),scale.setScalar(radius(atom)+.055));outline.setMatrixAt(index,matrix);});
      outline.instanceMatrix.needsUpdate=true;outline.computeBoundingSphere();this.group.add(outline);
    }
    let noncovalentPairs=0;
    if(feature?.atomPair&&!['peptide','disulfide'].includes(feature.kind)&&feature.atomPair.every(id=>included.has(id))){
      const geometry=new THREE.BufferGeometry().setFromPoints(feature.atomPair.map(id=>vector(this.atoms.get(id).position)));
      const link=new THREE.Line(geometry,new THREE.LineDashedMaterial({color:'#813d64',dashSize:.22,gapSize:.17,depthTest:false}));
      link.name='noncovalent-source-pair';link.userData.atomPair=[...feature.atomPair];link.computeLineDistances();link.renderOrder=3;this.group.add(link);noncovalentPairs=1;
    }
    this.focusPoints=records.filter(atom=>focusIds.has(atom.residueId)).map(atom=>vector(atom.position));
    this.renderStats={atoms:records.length,bonds:bonds.length,residues:new Set(records.map(atom=>atom.residueId)).size,
      peptideBonds:bonds.filter(bond=>bond.kind==='peptide').length,disulfides:bonds.filter(bond=>bond.kind==='disulfide').length,noncovalentPairs};
    if(view.focus)this.fit(true);
  }
  settle(){
    this.controls._lastAngle=0;this.controls._lastRollAngle=0;
    this.controls._movePrev.copy(this.controls._moveCurr);this.controls._zoomStart.copy(this.controls._zoomEnd);this.controls._panStart.copy(this.controls._panEnd);
    this.controls._touchZoomDistanceStart=this.controls._touchZoomDistanceEnd=Math.max(1e-6,this.controls._touchZoomDistanceEnd||0);this.controls._touchRollPointerIds='';
  }
  fit(focus=false){
    if(this.disposed||!this.dataset)return false;
    if(!this.container.clientWidth||!this.container.clientHeight){this.pendingFit=true;return false;}
    const points=focus&&this.focusPoints?.length?this.focusPoints:this.visiblePoints;if(!points?.length)return false;
    const center=new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3()),direction=new THREE.Vector3(.7,.5,1).normalize();
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
    const tanY=Math.tan(this.camera.fov*Math.PI/360),tanX=tanY*this.camera.aspect;
    let distance=focus?13:20;
    for(const point of points){const offset=point.clone().sub(center);distance=Math.max(distance,offset.dot(direction)+(Math.abs(offset.dot(right))+3)/(tanX*.82),offset.dot(direction)+(Math.abs(offset.dot(up))+3)/(tanY*.82));}
    this.settle();this.controls.target.copy(center);this.camera.position.copy(center).add(direction.multiplyScalar(distance));this.camera.up.set(0,1,0);this.controls.update();this.needsRender=true;return true;
  }
  rotate(direction){
    if(this.disposed)return false;
    const angles={left:[-.18,0],right:[.18,0],up:[0,.18],down:[0,-.18]}[direction];if(!angles)return false;
    this.settle();const offset=this.camera.position.clone().sub(this.controls.target),up=this.camera.up.clone().normalize(),right=new THREE.Vector3().crossVectors(up,offset).normalize();
    const yaw=new THREE.Quaternion().setFromAxisAngle(up,angles[0]),pitch=new THREE.Quaternion().setFromAxisAngle(right,angles[1]);
    offset.applyQuaternion(yaw).applyQuaternion(pitch);this.camera.up.applyQuaternion(pitch).normalize();this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.needsRender=true;return true;
  }
  zoom(direction){
    if(this.disposed||!['in','out'].includes(direction))return false;
    this.settle();const offset=this.camera.position.clone().sub(this.controls.target);
    offset.setLength(Math.max(this.controls.minDistance,Math.min(this.controls.maxDistance,offset.length()*(direction==='in' ? .8 : 1.25))));
    this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.needsRender=true;return true;
  }
  cameraState(){return {position:this.camera.position.toArray(),target:this.controls.target.toArray(),up:this.camera.up.toArray(),aspect:this.camera.aspect};}
  restoreCamera(state){
    if(this.disposed||!state||![state.position,state.target,state.up].every(point=>Array.isArray(point)&&point.length===3&&point.every(Number.isFinite)))return false;
    if(!Number.isFinite(state.aspect)||Math.abs(state.aspect-this.camera.aspect)>1e-6)return false;
    const eye=vector(state.position).sub(vector(state.target)),up=vector(state.up);
    if(eye.length()<this.controls.minDistance||eye.length()>this.controls.maxDistance||up.length()<1e-6||new THREE.Vector3().crossVectors(eye.clone().normalize(),up.clone().normalize()).lengthSq()<1e-12)return false;
    this.settle();this.camera.position.fromArray(state.position);this.controls.target.fromArray(state.target);this.camera.up.copy(up.normalize());this.controls.update();this.needsRender=true;return true;
  }
  animate(){
    if(this.disposed)return;
    this.frame=requestAnimationFrame(()=>this.animate());
    if(document.hidden||!this.container.clientWidth||!this.container.clientHeight)return;
    this.controls.update();
    if(this.needsRender){this.renderer.render(this.scene,this.camera);this.needsRender=false;}
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.frame);this.listeners.abort();this.resizeObserver.disconnect();this.controls.dispose();this.clear();this.renderer.dispose();this.renderer.forceContextLoss();this.canvas.remove();
  }
}
