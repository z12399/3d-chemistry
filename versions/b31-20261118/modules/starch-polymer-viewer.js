import * as THREE from 'three';
import {StarchSpatialViewer,STARCH_SPATIAL_COLORS as colors} from './starch-spatial-viewer.js';

/** All displayed balls are atoms, even when many glucose units are shown. */
export class StarchPolymerViewer extends StarchSpatialViewer {
  constructor(container,options={}){
    super(container,options);this.camera.far=50000;this.camera.updateProjectionMatrix();this.controls.maxDistance=10000;
  }
  clear(){this.group?.traverse(object=>{if(object.isInstancedMesh)object.dispose();});super.clear();}
  pickData(hit){return hit.object.userData.instances?.[hit.instanceId]||hit.object.userData;}
  frameState(){return this.group.position.toArray();}
  setModel(model,{showHydrogens=false,showEnds=false,preserveFrame=false,framePosition=null}={}){
    if(this.disposed)return;const oldPosition=this.group.position.clone();this.clear();this.model=model;
    const atomic=model.atomic,atomsById=new Map(atomic.atoms.map(atom=>[atom.id,atom])),highlight=new Set(atomic.highlightAtomIds||[]),bondHighlight=new Set(atomic.highlightBondIds||[]),hasBranch=model.markers?.some(marker=>marker.role==='branch');
    const atoms=atomic.atoms.filter(atom=>showHydrogens||atom.element!=='H'),bonds=atomic.bonds.filter(bond=>{const a=atomsById.get(bond.a),b=atomsById.get(bond.b);return a&&b&&(showHydrogens||(a.element!=='H'&&b.element!=='H'));});
    const sphere=new THREE.SphereGeometry(1,12,9),atomMaterial=new THREE.MeshStandardMaterial({roughness:.55}),balls=new THREE.InstancedMesh(sphere,atomMaterial,atoms.length),matrix=new THREE.Matrix4(),quaternion=new THREE.Quaternion();
    const scale=new THREE.Vector3(),position=new THREE.Vector3(),color=new THREE.Color();balls.userData.instances=[];
    for(let i=0;i<atoms.length;i++){
      const atom=atoms[i],radius=atom.element==='H'?.18:atom.element==='O'?.35:.3;
      position.fromArray(atom.position);scale.setScalar(highlight.has(atom.id)?radius*1.15:radius);matrix.compose(position,quaternion,scale);balls.setMatrixAt(i,matrix);
      color.set(highlight.has(atom.id)?hasBranch?colors.branch:colors.amylose:colors[atom.element]||colors.C);balls.setColorAt(i,color);
      balls.userData.instances.push({atomId:atom.id,residueId:atom.residueId,role:highlight.has(atom.id)?hasBranch?'branch-atom':'glycosidic-atom':'atom',label:`${atom.residueId||''} · ${atom.label||atom.id} · ${atom.element}`});
    }
    balls.instanceMatrix.needsUpdate=true;if(balls.instanceColor)balls.instanceColor.needsUpdate=true;balls.computeBoundingSphere();this.group.add(balls);this.pickables.push(balls);
    const rods=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,7),new THREE.MeshStandardMaterial({roughness:.7}),bonds.length);rods.userData.instances=[];
    for(let i=0;i<bonds.length;i++){
      const bond=bonds[i],a=new THREE.Vector3(...atomsById.get(bond.a).position),b=new THREE.Vector3(...atomsById.get(bond.b).position),offset=b.clone().sub(a),radius=bondHighlight.has(bond.id)?.15:.095;
      position.copy(a).add(b).multiplyScalar(.5);quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),offset.clone().normalize());scale.set(radius,offset.length(),radius);matrix.compose(position,quaternion,scale);rods.setMatrixAt(i,matrix);
      color.set(bondHighlight.has(bond.id)?hasBranch?colors.branch:colors.amylose:'#99a8a5');rods.setColorAt(i,color);rods.userData.instances.push({bondId:bond.id,role:'bond',label:`${bond.a}—${bond.b}${bond.linkage?' · '+bond.linkage:''}`});
    }
    rods.instanceMatrix.needsUpdate=true;if(rods.instanceColor)rods.instanceColor.needsUpdate=true;rods.computeBoundingSphere();this.group.add(rods);this.pickables.push(rods);
    const points=atoms.map(atom=>new THREE.Vector3(...atom.position)),center=new THREE.Box3().setFromPoints(atomic.atoms.map(atom=>new THREE.Vector3(...atom.position))).getCenter(new THREE.Vector3());
    if(preserveFrame&&Array.isArray(framePosition)&&framePosition.length===3&&framePosition.every(Number.isFinite))this.group.position.fromArray(framePosition);
    else this.group.position.copy(preserveFrame?oldPosition:center.multiplyScalar(-1));
    this.fitPoints=points.map(point=>point.clone().add(this.group.position));
    if(showEnds)for(const marker of model.markers||[]){if(!marker.role?.endsWith('-end')||(model.count===1&&marker.role==='nonreducing-end'))continue;const halo=new THREE.Mesh(new THREE.SphereGeometry(.75,10,8),new THREE.MeshBasicMaterial({color:'#355b53',wireframe:true}));halo.position.fromArray(marker.position);this.group.add(halo);}
    this.canvas.dataset.kind=model.kind;this.canvas.dataset.scale='polymer';this.canvas.dataset.count=String(model.count);this.canvas.dataset.atoms=String(atoms.length);this.canvas.dataset.bonds=String(bonds.length);this.needsRender=true;
  }
  fit(){
    if(this.disposed||!this.fitPoints?.length)return;const direction=new THREE.Vector3(.4,.25,1).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize(),center=new THREE.Box3().setFromPoints(this.fitPoints).getCenter(new THREE.Vector3());
    const tanY=Math.tan(this.camera.fov*Math.PI/360),tanX=tanY*this.camera.aspect;let distance=9;
    for(const point of this.fitPoints){const offset=point.clone().sub(center);distance=Math.max(distance,offset.dot(direction)+(Math.abs(offset.dot(right))+.8)/(tanX*.82),offset.dot(direction)+(Math.abs(offset.dot(up))+.8)/(tanY*.82));}
    this.controls.target.copy(center);this.camera.position.copy(center).add(direction.multiplyScalar(Math.min(10000,distance)));this.camera.up.set(0,1,0);this.controls.update();this.needsRender=true;
  }
  focusBranch(){const marker=this.model?.markers?.find(item=>item.role==='branch');if(!marker)return false;this.group.updateMatrixWorld(true);const point=this.group.localToWorld(new THREE.Vector3(...marker.position)),direction=this.camera.position.clone().sub(this.controls.target).normalize();this.controls.target.copy(point);this.camera.position.copy(point).add(direction.multiplyScalar(17));this.controls.update();this.needsRender=true;this.onPick(marker);return true;}
  focusSugar(){const atom=this.model?.atomic?.atoms?.find(item=>item.element==='C');if(!atom)return false;this.group.updateMatrixWorld(true);const point=this.group.localToWorld(new THREE.Vector3(...atom.position)),direction=this.camera.position.clone().sub(this.controls.target).normalize();this.controls.target.copy(point);this.camera.position.copy(point).add(direction.multiplyScalar(17));this.controls.update();this.needsRender=true;return true;}
  zoom(direction){if(this.disposed)return;const offset=this.camera.position.clone().sub(this.controls.target);offset.setLength(Math.max(2,Math.min(10000,offset.length()*(direction==='in'?.8:1.25))));this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.needsRender=true;}
}
