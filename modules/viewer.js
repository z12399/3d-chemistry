import * as THREE from 'three';
import { TrackballControls } from '../vendor/TrackballControls.js';
import { pickScreenBond } from './bond-picking.js';
import { layoutAtomLabels } from './label-layout.js';
import {AtomLabelMetrics} from './label-metrics.js';
const colors={C:0x507995,O:0xe96850,H:0xe4ecef,N:0x577cec,P:0xefb151,B:0xd5a074,I:0xab72d8,Br:0xa04e38};
const accent=0x52cbb7, electronFlow=0xffd178;
const bondKey=b=>[b.a,b.b].sort().join('–');
const MAX_INTERPOLATED_ATOM_SHIFT=1.5;
const MAX_FORMING_BOND_PREVIEW_DISTANCE=2.6;
export class MoleculeViewer {
  constructor(container,{onAtom=()=>{},onBond=()=>{},onLabelLayout=()=>{}}={}){
    this.container=container;this.onAtom=onAtom;this.onBond=onBond;this.showH=true;this.showLabels=true;this.labelsOnlySelected=false;this.renderMode='ball';this.selected=[];this.labels=[];
    this.onLabelLayout=onLabelLayout;this.labelMetrics=new AtomLabelMetrics();
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(38,1,.1,120);this.camera.position.set(9,7,12);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0x000000,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;container.append(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight(0xe5f4ff,0x122331,1.6));for(const [color,power,pos] of [[0xffffff,3.2,[5,8,7]],[0x79bbec,2.3,[-6,1,-4]],[0xffd7ad,.65,[0,-3,4]]]){const l=new THREE.DirectionalLight(color,power);l.position.set(...pos);this.scene.add(l);}
    this.group=new THREE.Group();this.scene.add(this.group);
    // Trackball rotation has no polar cap, so the molecule can be viewed from every side.
    this.controls=new TrackballControls(this.camera,this.renderer.domElement);
    this.controls.rotateSpeed=2.2;this.controls.dynamicDampingFactor=.12;
    this.controls.minDistance=3;this.controls.maxDistance=36;
    this.refreshControlBounds=()=>this.controls.handleResize();
    this.renderer.domElement.addEventListener('pointerdown',this.refreshControlBounds,{capture:true});
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.pickables=[];this.labelLayer=container.querySelector('#atom-labels')||document.createElement('div');this.labelLayer.id='atom-labels';if(!this.labelLayer.parentNode)container.append(this.labelLayer);
    this.renderer.domElement.addEventListener('pointerdown',e=>{this.down=[e.clientX,e.clientY];});
    this.renderer.domElement.addEventListener('pointerup',e=>{if(!this.down||Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])>5)return;const hit=this.pick(e.clientX,e.clientY);if(hit){const d=hit.object.userData;if(d.atom)this.onAtom(d.atom);if(d.bond)this.onBond(d.bond);}});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();this.animate();
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);this.controls.handleResize();if(this.pendingFit&&this.molecule){this.pendingFit=false;this.fit();}}
  pick(clientX,clientY){
    const rect=this.renderer.domElement.getBoundingClientRect();if(!rect.width||!rect.height)return null;
    this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);
    const cast=point=>{this.pointer.set(point.x/rect.width*2-1,1-point.y/rect.height*2);this.raycaster.setFromCamera(this.pointer,this.camera);return this.raycaster.intersectObjects(this.pickables)[0]||null;};
    const point={x:clientX-rect.left,y:clientY-rect.top},directHit=cast(point);
    if(directHit||this.renderMode==='space')return directHit;
    const segments=[];
    for(const mesh of this.pickables){
      if(!mesh.userData.bond||!mesh.visible)continue;
      const halfLength=mesh.geometry.parameters.height/2;
      const start=mesh.localToWorld(new THREE.Vector3(0,-halfLength,0)).project(this.camera);
      const end=mesh.localToWorld(new THREE.Vector3(0,halfLength,0)).project(this.camera);
      if(start.z<-1||start.z>1||end.z<-1||end.z>1)continue;
      segments.push({object:mesh,start:{x:(start.x+1)*rect.width/2,y:(1-start.y)*rect.height/2},end:{x:(end.x+1)*rect.width/2,y:(1-end.y)*rect.height/2}});
    }
    // Check visibility at the actual bond, not at the nearby empty click position.
    // This prevents snapping to bond portions concealed by atoms or another bond.
    return pickScreenBond(point,segments,{isVisible:(mesh,closest)=>cast(closest)?.object===mesh});
  }
  setMolecule(molecule,{fit=false,selected=this.selected,bond=null,ghostBond=null,arrows=[],changes=[]}={}){
    this.molecule=molecule;this.selected=selected;this.currentBond=bond;this.ghostBond=ghostBond;
    this.labelMetrics?.clear();this.labelLayoutKey=null;this.labelLayoutStatus=null;
    this.group.traverse(x=>{x.geometry?.dispose();if(x.material)x.material.dispose();});this.group.clear();this.labelLayer.replaceChildren();this.leaderLayer=null;this.labels=[];this.pickables=[];this.electrons=[];
    const byId=Object.fromEntries(molecule.atoms.map(a=>[a.id,a]));const visible=molecule.atoms.filter(a=>this.showH||a.element!=='H'||selected.includes(a.id));
    const visibleIds=new Set(visible.map(a=>a.id));const sharedSphere=new THREE.SphereGeometry(1,26,18);
    for(const a of visible){const radius=this.renderMode==='space'?({C:1.4,O:1.24,H:.88,N:1.3,P:1.7,I:1.7,Br:1.7}[a.element]||1):({C:.34,O:.32,H:.19,N:.33,P:.42,I:.42,Br:.42}[a.element]||.3);const mesh=new THREE.Mesh(sharedSphere.clone(),new THREE.MeshStandardMaterial({color:selected.includes(a.id)?accent:(colors[a.element]||0xaaaaaa),metalness:.08,roughness:.3,emissive:selected.includes(a.id)?0x062e2a:0x000000}));mesh.scale.setScalar(radius);mesh.position.set(...a.position);mesh.userData.atom=a;this.group.add(mesh);this.pickables.push(mesh);const charge=a.charge??a.formalCharge??0;if(a.element!=='H'||charge||selected.includes(a.id)){const el=document.createElement('span');el.className='atom-label'+(selected.includes(a.id)?' selected':'');el.textContent=a.id+(charge?Math.abs(charge)===1?charge>0?' ⁺':' ⁻':` ${charge>0?'+':''}${charge}`:'');el.setAttribute?.('data-atom-id',a.id);this.labelLayer.append(el);this.labels.push({el,mesh,radius,id:a.id});}}
    sharedSphere.dispose();
    if(this.renderMode!=='space')for(const b of molecule.bonds){if(!byId[b.a]||!byId[b.b])continue;if(!visibleIds.has(b.a)||!visibleIds.has(b.b))continue;const a=new THREE.Vector3(...byId[b.a].position),z=new THREE.Vector3(...byId[b.b].position);const axis=z.clone().sub(a),len=axis.length();const isSelected=bond&&((b.a===bond.a&&b.b===bond.b)||(b.a===bond.b&&b.b===bond.a));const count=b.order===3?3:b.order===2?2:1;let perpendicular=new THREE.Vector3().crossVectors(axis,new THREE.Vector3(0,0,1));if(perpendicular.length()<.01)perpendicular=new THREE.Vector3(1,0,0);perpendicular.normalize().multiplyScalar(.095);for(let i=0;i<count;i++){const mid=a.clone().add(z).multiplyScalar(.5);if(count>1)mid.addScaledVector(perpendicular,(i-(count-1)/2)*2);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(isSelected?.095:.066,isSelected?.095:.066,len,12),new THREE.MeshStandardMaterial({color:isSelected?accent:changes.find(c=>c.pair===[b.a,b.b].sort().join('–'))?.kind==='broken'?0xb54c3c:changes.find(c=>c.pair===[b.a,b.b].sort().join('–'))?.kind==='formed'?accent:changes.some(c=>c.pair===[b.a,b.b].sort().join('–'))?0xb76b19:0x91a5b0,roughness:.45,metalness:.1}));mesh.position.copy(mid);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());mesh.userData.bond=b;this.group.add(mesh);this.pickables.push(mesh);}}
    if(ghostBond&&byId[ghostBond[0]]&&byId[ghostBond[1]]){const geometry=new THREE.BufferGeometry().setFromPoints(ghostBond.map(id=>new THREE.Vector3(...byId[id].position)));const line=new THREE.Line(geometry,new THREE.LineDashedMaterial({color:accent,dashSize:.16,gapSize:.1}));line.computeLineDistances();this.group.add(line);}
    for(const change of changes.filter(c=>c.kind==='formed')){const pair=change.pair.split('–');if(molecule.bonds.some(b=>[b.a,b.b].sort().join('–')===change.pair)||!pair.every(id=>byId[id]))continue;const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pair.map(id=>new THREE.Vector3(...byId[id].position))),new THREE.LineDashedMaterial({color:accent,dashSize:.16,gapSize:.12}));line.computeLineDistances();this.group.add(line);}
    const arrowPoint=id=>{if(byId[id])return new THREE.Vector3(...byId[id].position);const pair=id.split('-');return pair.length===2&&byId[pair[0]]&&byId[pair[1]]?new THREE.Vector3(...byId[pair[0]].position).add(new THREE.Vector3(...byId[pair[1]].position)).multiplyScalar(.5):null;};
    for(const [source,target]of arrows){const a=arrowPoint(source),b=arrowPoint(target);if(!a||!b)continue;const mid=a.clone().add(b).multiplyScalar(.5).add(new THREE.Vector3(0,1.3,.6));const curve=new THREE.QuadraticBezierCurve3(a,mid,b);const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,30,.03,6,false),new THREE.MeshBasicMaterial({color:electronFlow}));this.group.add(tube);const head=new THREE.Mesh(new THREE.ConeGeometry(.12,.3,12),new THREE.MeshBasicMaterial({color:electronFlow}));head.position.copy(curve.getPoint(.86));head.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),curve.getTangent(.86).normalize());this.group.add(head);const electron=new THREE.Mesh(new THREE.SphereGeometry(.075,12,8),new THREE.MeshBasicMaterial({color:0xffe5a8}));this.group.add(electron);this.electrons.push({electron,curve});}
    if(fit){if(this.container.clientWidth&&this.container.clientHeight){this.pendingFit=false;this.fit();}else this.pendingFit=true;}
  }
  fit(atomIds=null){
    const visible=(this.molecule?.atoms||[]).filter(a=>(!atomIds||atomIds.includes(a.id))&&(this.showH||a.element!=='H'||this.selected.includes(a.id)));
    if(!visible.length)return;
    const points=visible.map(a=>new THREE.Vector3(...a.position));
    const center=new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3());
    const direction=new THREE.Vector3(.75,.48,1).normalize();
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();
    const up=new THREE.Vector3().crossVectors(direction,right).normalize();
    const tanY=Math.tan(this.camera.fov*Math.PI/360),tanX=tanY*this.camera.aspect;
    // Leave room for the ball radius and labels, while using more of the canvas.
    const padding=this.renderMode==='space'?1.8:.5;
    let distance=this.renderMode==='space'?5:4.2;
    for(const point of points){
      const offset=point.clone().sub(center);
      distance=Math.max(distance,
        offset.dot(direction)+(Math.abs(offset.dot(right))+padding)/(tanX*.86),
        offset.dot(direction)+(Math.abs(offset.dot(up))+padding)/(tanY*.86));
    }
    this.controls.maxDistance=Math.max(36,distance*2);
    this.controls.target.copy(center);
    this.camera.up.set(0,1,0);
    this.camera.position.copy(center).add(direction.multiplyScalar(distance));
    this.controls._lastAngle=0;this.controls._lastRollAngle=0;
    this.controls._movePrev.copy(this.controls._moveCurr);
    this.controls._zoomStart.copy(this.controls._zoomEnd);
    this.controls._panStart.copy(this.controls._panEnd);
    this.controls._touchZoomDistanceStart=this.controls._touchZoomDistanceEnd=Math.max(1e-6,this.controls._touchZoomDistanceEnd||0);
    this.controls._touchRollPointerIds='';
    this.controls.update();
  }

  // Native buttons provide the same camera actions as dragging and wheel zoom.
  // Clear Trackball damping before applying a discrete view so it cannot drift.
  settleCamera(){
    this.controls._lastAngle=0;this.controls._lastRollAngle=0;
    this.controls._movePrev.copy(this.controls._moveCurr);
    this.controls._zoomStart.copy(this.controls._zoomEnd);
    this.controls._panStart.copy(this.controls._panEnd);
    this.controls._touchZoomDistanceStart=this.controls._touchZoomDistanceEnd=Math.max(1e-6,this.controls._touchZoomDistanceEnd||0);
    this.controls._touchRollPointerIds='';
  }
  orbitView(horizontal=0,vertical=0){
    if(this.disposed||!Number.isFinite(horizontal)||!Number.isFinite(vertical))return false;
    this.settleCamera();
    const offset=this.camera.position.clone().sub(this.controls.target);
    if(offset.lengthSq()===0)return false;
    const up=this.camera.up.clone().normalize();
    const right=new THREE.Vector3().crossVectors(up,offset).normalize();
    const yaw=new THREE.Quaternion().setFromAxisAngle(up,horizontal);
    const pitch=new THREE.Quaternion().setFromAxisAngle(right,vertical);
    offset.applyQuaternion(yaw).applyQuaternion(pitch);
    this.camera.up.applyQuaternion(pitch).normalize();
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();return true;
  }
  zoomView(factor){
    if(this.disposed||!Number.isFinite(factor)||factor<=0)return false;
    this.settleCamera();
    const offset=this.camera.position.clone().sub(this.controls.target),distance=offset.length();
    if(!distance)return false;
    const next=Math.max(this.controls.minDistance,Math.min(this.controls.maxDistance,distance*factor));
    this.camera.position.copy(this.controls.target).add(offset.setLength(next));
    this.controls.update();return true;
  }
  cameraState(){
    return {position:this.camera.position.toArray(),up:this.camera.up.toArray(),target:this.controls.target.toArray(),maxDistance:this.controls.maxDistance,aspect:this.camera.aspect};
  }
  restoreCameraState(view){
    if(this.disposed||!view||![view.position,view.up,view.target].every(v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite)))return false;
    if(view.aspect!==undefined&&(!Number.isFinite(view.aspect)||view.aspect<=0||Math.abs(view.aspect-this.camera.aspect)>1e-6))return false;
    const position=new THREE.Vector3(...view.position),target=new THREE.Vector3(...view.target),up=new THREE.Vector3(...view.up);
    const eye=position.clone().sub(target),distance=eye.length(),upLength=up.length(),maxDistance=view.maxDistance??this.controls.maxDistance;
    if(!Number.isFinite(distance)||!Number.isFinite(upLength)||upLength<1e-6||!Number.isFinite(maxDistance)||maxDistance<this.controls.minDistance)return false;
    // A clamped non-axis vector can round a few ulps past either distance bound.
    // Accept that snapshot without changing its view; reject larger excursions.
    const minTolerance=32*Number.EPSILON*Math.max(1,distance,this.controls.minDistance);
    const maxTolerance=32*Number.EPSILON*Math.max(1,distance,maxDistance);
    if(distance<this.controls.minDistance-minTolerance||distance>maxDistance+maxTolerance)return false;
    if(new THREE.Vector3().crossVectors(eye.clone().normalize(),up.clone().normalize()).lengthSq()<1e-12)return false;
    this.pendingFit=false;this.settleCamera();
    this.controls.maxDistance=maxDistance;
    this.controls.target.copy(target);this.camera.position.copy(position);this.camera.up.copy(up).normalize();
    this.controls.update();return true;
  }

  updatePositions(atoms){const byId=Object.fromEntries(atoms.map(a=>[a.id,a]));this.group.traverse(x=>{if(x.userData.atom)x.position.set(...byId[x.userData.atom.id].position);});}
  cancelTransition(){this.transitionGeneration=(this.transitionGeneration||0)+1;}
  async transitionTo(target,{duration=1100,selected=[],changes=[]}={}){
    const source=this.molecule;
    const from=new Map(source.atoms.map(a=>[a.id,a]));
    const to=new Map(target.atoms.map(a=>[a.id,a]));
    const sourceBonds=new Map(source.bonds.map(b=>[bondKey(b),b.order]));
    const targetBonds=new Map(target.bonds.map(b=>[bondKey(b),b.order]));
    const topologyChanged=from.size!==to.size||[...from.keys()].some(id=>!to.has(id))||sourceBonds.size!==targetBonds.size||[...sourceBonds].some(([pair,order])=>targetBonds.get(pair)!==order);
    const largeShift=[...to].some(([id,atom])=>from.has(id)&&Math.hypot(...atom.position.map((p,i)=>p-from.get(id).position[i]))>MAX_INTERPOLATED_ATOM_SHIFT);
    const generation=this.transitionGeneration=(this.transitionGeneration||0)+1;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||duration<=0){this.setMolecule(target,{selected,changes});return true;}
    if(topologyChanged||largeShift){
      // A chemical state change is a discrete teaching-model step, not an atom trajectory.
      // Preview only nearby forming bonds; a remote reagent must never draw a bond across the scene.
      const previewChanges=changes.filter(change=>change.kind!=='formed');
      for(const bond of target.bonds){
        const pair=bondKey(bond);
        if(sourceBonds.has(pair))continue;
        const a=from.get(bond.a),b=from.get(bond.b);
        if(!a||!b)continue;
        if(!this.showH&&[a,b].some(atom=>atom.element==='H'&&!selected.includes(atom.id)))continue;
        if(Math.hypot(...a.position.map((p,i)=>p-b.position[i]))<=MAX_FORMING_BOND_PREVIEW_DISTANCE)previewChanges.push({pair,kind:'formed'});
      }
      this.setMolecule(source,{selected,changes:previewChanges});
      await new Promise(resolve=>setTimeout(resolve,duration));
      if(this.disposed||generation!==this.transitionGeneration)return false;
      this.setMolecule(target,{selected,changes});
      return true;
    }
    const start=performance.now();
    return await new Promise(resolve=>{const frame=()=>{if(this.disposed||generation!==this.transitionGeneration){resolve(false);return;}const t=Math.min(1,(performance.now()-start)/duration),ease=t*t*(3-2*t);if(t===1){this.setMolecule(target,{selected,changes});resolve(true);return;}const atoms=source.atoms.map(a=>({...a,position:a.position.map((p,i)=>p+(to.get(a.id).position[i]-p)*ease)}));this.setMolecule({...source,atoms},{selected,changes});setTimeout(frame,40);};frame();});
  }
  updateLabels(width,height){
    if(this.disposed)return;
    if(!this.showLabels){
      for(const label of this.labels)label.el.style.display='none';
      if(this.leaderLayer)this.leaderLayer.style.display='none';
      return;
    }
    const selected=new Set(this.selected),metrics=this.labelMetrics??=new AtomLabelMetrics();
    const eligible=this.labels.filter(label=>!this.labelsOnlySelected||selected.has(label.id));
    metrics.measure(eligible.map(label=>label.el));
    const projected=eligible.map(label=>{
      const world=label.mesh.getWorldPosition(new THREE.Vector3());
      const anchor=world.clone().project(this.camera);
      world.y+=label.radius+.16;
      const preferred=world.project(this.camera);
      const size=metrics.get(label.el);
      return {id:label.id,x:(anchor.x*.5+.5)*width,y:(-anchor.y*.5+.5)*height,depth:anchor.z,
        preferredX:(preferred.x*.5+.5)*width,preferredY:(-preferred.y*.5+.5)*height,
        width:size?.width??0,height:size?.height??0,selected:selected.has(label.id)};
    });
    const maxHeight=Math.max(0,...projected.filter(label=>label.selected).map(label=>label.height));
    const selectedMaxOffset=Math.min(Math.hypot(width,height),Math.max(40,maxHeight*4,Math.min(width,height)*.48));
    const layout=layoutAtomLabels(projected,{width,height,selectedMaxOffset});
    const placements=new Map(layout.map(placement=>[placement.id,placement]));
    const snapshot={moleculeId:this.molecule?.id,selectedIds:[...selected],visibleIds:layout.filter(p=>!p.hidden).map(p=>p.id),hiddenIds:layout.filter(p=>p.hidden).map(p=>p.id),crowdedIds:layout.filter(p=>p.crowded).map(p=>p.id)};
    this.labelLayoutStatus=snapshot;
    this.labelLayer.setAttribute?.('data-label-crowded',snapshot.crowdedIds.join(' '));
    this.labelLayer.setAttribute?.('data-label-hidden',snapshot.hiddenIds.join(' '));
    const signature=JSON.stringify(snapshot);
    if(signature!==this.labelLayoutKey){this.labelLayoutKey=signature;this.onLabelLayout?.(snapshot);}

    if(!this.leaderLayer&&projected.length){
      this.leaderLayer=document.createElementNS('http://www.w3.org/2000/svg','svg');
      this.leaderLayer.setAttribute('aria-hidden','true');
      this.leaderLayer.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden';
      this.labelLayer.prepend(this.leaderLayer);
    }
    if(this.leaderLayer){
      this.leaderLayer.style.display='block';
      const viewBox=`0 0 ${width} ${height}`;
      if(this.labelViewBox!==viewBox||this.leaderLayer.getAttribute('viewBox')!==viewBox){
        this.leaderLayer.setAttribute('viewBox',viewBox);this.labelViewBox=viewBox;
      }
    }
    for(const label of this.labels){
      const placement=placements.get(label.id);
      label.el.setAttribute?.('data-label-crowded',String(!!placement?.crowded));
      label.el.setAttribute?.('data-label-hidden',String(!placement||placement.hidden));
      if(!placement||placement.hidden){label.el.style.display='none';if(label.line)label.line.style.display='none';continue;}
      label.el.style.display='block';
      label.el.style.left=placement.x.toFixed(2)+'px';label.el.style.top=placement.y.toFixed(2)+'px';
      if(placement.leader){
        if(!label.line){
          label.line=document.createElementNS('http://www.w3.org/2000/svg','line');
          label.line.setAttribute('stroke',selected.has(label.id)?'#e5c78e':'#b6cbd1');
          label.line.setAttribute('stroke-width','.8');label.line.setAttribute('opacity','.8');
          this.leaderLayer.append(label.line);
        }
        label.line.style.display='block';
        for(const [name,value] of Object.entries(placement.leader))label.line.setAttribute(name,value.toFixed(2));
      }else if(label.line)label.line.style.display='none';
    }
  }
  animate(){this.frame=requestAnimationFrame(()=>this.animate());const width=this.container.clientWidth,height=this.container.clientHeight;if(document.hidden||!width||!height)return;this.controls.update();for(const {electron,curve} of this.electrons||[])electron.position.copy(curve.getPoint((performance.now()%1800)/1800));this.renderer.render(this.scene,this.camera);this.updateLabels(width,height);}
  dispose(){this.disposed=true;this.transitionGeneration=(this.transitionGeneration||0)+1;cancelAnimationFrame(this.frame);this.labelMetrics?.dispose();this.resizeObserver.disconnect();this.renderer.domElement.removeEventListener('pointerdown',this.refreshControlBounds,{capture:true});this.controls.dispose();this.group.traverse(x=>{x.geometry?.dispose();x.material?.dispose();});this.renderer.dispose();this.renderer.forceContextLoss();}
  exportPNG(){this.renderer.render(this.scene,this.camera);return this.renderer.domElement.toDataURL('image/png');}
}
