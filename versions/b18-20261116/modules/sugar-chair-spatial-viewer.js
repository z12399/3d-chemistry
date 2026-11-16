import * as THREE from 'three';
import {TrackballControls} from '../vendor/TrackballControls.js';
import {sugarChairMolecule} from './sugar-chair-spatial-model.js';

const COLORS={C:'#507995',O:'#cf5b49',H:'#e7e5db',bond:'#8b9698',selected:'#a65435'};
const RADII={C:.25,O:.235,H:.125};
const radians=degrees=>degrees*Math.PI/180;
const degrees=radians=>radians*180/Math.PI;
const vector=point=>new THREE.Vector3(...point);
const finiteTriple=value=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite);
const normalizeAngle=value=>((value+180)%360+360)%360-180;
const cameraSignature=view=>JSON.stringify([view.position,view.target,view.up,view.zoom,view.frustumHeight].flat().map(number=>Number(number.toFixed(10))));
const selectorCarbon=atom=>{
  const carbon=Number(atom.selectorCarbon??atom.carbon??atom.id?.match(/^(?:C|O|H(?:-O)?)(\d+)/)?.[1]);
  return Number.isInteger(carbon)&&carbon>=1&&carbon<=6?Math.min(5,carbon):null;
};
const moleculeForm=molecule=>{
  const metadata=molecule.metadata||{},form=String(metadata.molecularForm||metadata.form||molecule.molecularForm||'');
  if(form)return /open[- ]?chain|acyclic/i.test(form)?'open-chain':form;
  return /open[- ]?chain|acyclic/i.test(metadata.representation||'')?'open-chain':'chair';
};

/**
 * Fixed teaching coordinates, true ball-and-stick geometry, and a free camera.
 * Coordinates stay [x,y,z] with molecular +z = ring up. For an unrolled view,
 * the camera is the negative depth axis of projectChairPoint in the SVG model.
 * onViewChange is trailing-throttled to 80 ms and includes an exact replayable
 * camera snapshot; mounting, resizing, and setState never notify it.
 */
export class SugarChairSpatialViewer {
  constructor(container,{onSelect=()=>{},onViewChange=()=>{},view={yaw:0,pitch:25}}={}) {
    this.container=container;this.onSelect=onSelect;this.onViewChange=onViewChange;
    this.disposed=false;this.silent=false;this.dirty=true;this.interacting=false;
    this.pendingView=false;this.lastNotify=0;this.lastYaw=0;this.halfHeight=4.2;
    this.initialView={yaw:0,pitch:25,...view};this.labels=[];this.pickables=[];
    this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-4.2,4.2,4.2,-4.2,.1,100);
    this.camera.position.set(0,-10,5);this.camera.up.set(0,0,1);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.canvas=this.renderer.domElement;this.canvas.className='sc3-canvas';this.canvas.tabIndex=0;
    this.canvas.setAttribute('role','img');
    this.canvas.setAttribute('aria-label','糖的 3D 球棍結構。拖曳可自由旋轉，滾輪或加減鍵縮放；方向鍵旋轉，Home 回到全景。點碳或 OH 可追蹤同一個碳。');
    this.canvas.style.cssText='display:block;width:100%;height:100%;touch-action:none;outline-offset:-3px';
    this.originalPosition=container.style.position;
    if(getComputedStyle(container).position==='static')container.style.position='relative';
    container.append(this.canvas);
    this.labelLayer=document.createElement('div');this.labelLayer.className='sc3-label-layer';
    this.labelLayer.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden';
    this.leaderLayer=document.createElementNS('http://www.w3.org/2000/svg','svg');
    this.leaderLayer.setAttribute('aria-hidden','true');
    this.leaderLayer.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    this.labelLayer.append(this.leaderLayer);container.append(this.labelLayer);
    this.normalLayer=document.createElementNS('http://www.w3.org/2000/svg','svg');
    this.normalLayer.classList.add('sc3-normal');this.normalLayer.setAttribute('viewBox','0 0 88 84');
    this.normalLayer.setAttribute('role','img');this.normalLayer.setAttribute('aria-label','環上面方向：分子的正 z 法向量；拖曳鏡頭不改變環的上／下。');
    this.normalLayer.style.cssText='position:absolute;right:4px;top:4px;width:88px;height:84px;pointer-events:none';
    this.normalLayer.innerHTML='<title>環上面沿分子 +z，箭頭隨觀看方向投影。</title><g class="sc3-normal-arrow"><line/><line/><line/></g><text class="sc3-normal-depth" x="48" y="41" text-anchor="middle" dominant-baseline="middle"></text><text x="48" y="72" text-anchor="middle" style="font-size:11px">環上面</text>';
    this.labelLayer.append(this.normalLayer);
    this.group=new THREE.Group();this.scene.add(this.group);
    this.normalArrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,1),new THREE.Vector3(),1,0x286e64,.2,.1);
    // Own the geometries: ArrowHelper's defaults are shared across instances.
    this.normalArrow.line.geometry=this.normalArrow.line.geometry.clone();this.normalArrow.cone.geometry=this.normalArrow.cone.geometry.clone();
    for(const item of [this.normalArrow.line,this.normalArrow.cone]){item.material.depthTest=false;item.material.depthWrite=false;item.renderOrder=10;}
    this.scene.add(this.normalArrow);
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x7c8282,2.4));
    for(const [power,position] of [[2.2,[7,-9,12]],[1.1,[-7,5,3]]]){
      const light=new THREE.DirectionalLight(0xffffff,power);light.position.set(...position);this.scene.add(light);
    }
    this.controls=new TrackballControls(this.camera,this.canvas);
    this.controls.rotateSpeed=1.65;this.controls.zoomSpeed=1.1;this.controls.panSpeed=.45;
    this.controls.staticMoving=true;this.controls.multiTouchRoll=true;
    this.controls.minZoom=.35;this.controls.maxZoom=5;this.controls.keys=[];
    this.onControlChange=()=>{if(this.disposed)return;this.dirty=true;if(!this.silent)this.pendingView=true;this.requestFrame();};
    this.onControlStart=()=>{if(this.disposed)return;this.interacting=true;this.requestFrame();};
    this.onControlEnd=()=>{if(this.disposed)return;this.interacting=false;this.requestFrame();};
    this.controls.addEventListener('change',this.onControlChange);
    this.controls.addEventListener('start',this.onControlStart);
    this.controls.addEventListener('end',this.onControlEnd);
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.listeners=new AbortController();const options={signal:this.listeners.signal};
    this.canvas.addEventListener('pointerdown',event=>{
      this.controls.handleResize();this.down={id:event.pointerId,x:event.clientX,y:event.clientY,moved:this.controls._pointers.length>1};
      this.canvas.focus({preventScroll:true});this.requestFrame();
    },options);
    document.addEventListener('pointermove',event=>{
      if(this.down?.id===event.pointerId&&Math.hypot(event.clientX-this.down.x,event.clientY-this.down.y)>5)this.down.moved=true;
      if(this.interacting)this.requestFrame();
    },options);
    this.canvas.addEventListener('pointerup',event=>{
      const down=this.down;this.down=null;
      if(!down||down.id!==event.pointerId||down.moved||Math.hypot(event.clientX-down.x,event.clientY-down.y)>5)return;
      const carbon=this.pick(event.clientX,event.clientY);if(carbon)this.onSelect(carbon);
    },options);
    this.canvas.addEventListener('pointercancel',()=>{this.down=null;this.interacting=false;this.requestFrame();},options);
    this.canvas.addEventListener('wheel',()=>this.requestFrame(),{...options,passive:true});
    this.canvas.addEventListener('keydown',event=>{
      const direction={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[event.key];
      if(direction){event.preventDefault();this.rotate(direction);}
      else if(['+','='].includes(event.key)){event.preventDefault();this.zoomBy(1.2);}
      else if(['-','_'].includes(event.key)){event.preventDefault();this.zoomBy(1/1.2);}
      else if(event.key==='Home'){event.preventDefault();this.fit({resetView:true});}
    },options);
    const pickLabel=event=>{
      const label=event.target.closest?.('[data-selector-carbon]');
      if(!label||!this.labelLayer.contains(label))return;
      if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
      event.preventDefault();const carbon=Number(label.dataset.selectorCarbon),atomId=label.dataset.atomId;
      if(carbon)this.onSelect(carbon);
      if(event.type==='keydown'&&!this.disposed)this.labels.find(item=>item.id===atomId)?.el.focus({preventScroll:true});
    };
    this.labelLayer.addEventListener('click',pickLabel,options);
    this.labelLayer.addEventListener('keydown',pickLabel,options);
    this.canvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();this.contextLost=true;this.canvas.dataset.rendererStatus='context-lost';
      if(this.frame){cancelAnimationFrame(this.frame);this.frame=null;}
    },options);
    this.canvas.addEventListener('webglcontextrestored',()=>{this.contextLost=false;this.canvas.dataset.rendererStatus='ready';this.dirty=true;this.requestFrame();},options);
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){if(this.frame)cancelAnimationFrame(this.frame);this.frame=null;}
      else{this.dirty=true;this.requestFrame();}
    },options);
    this.themeObserver=new MutationObserver(()=>{if(!this.disposed){this.refreshTheme();this.dirty=true;this.requestFrame();}});
    this.themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class','style','data-theme']});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);
    this.refreshTheme();this.setView(this.initialView,{notify:false});this.resize();
    this.canvas.dataset.rendererStatus='ready';this.lastSignature=cameraSignature(this.getView());this.requestFrame();
  }

  refreshTheme() {
    const style=getComputedStyle(this.container);
    const value=(name,fallback)=>style.getPropertyValue(name).trim()||fallback;
    this.renderer.setClearColor(value('--panel2','#efeee7'),1);
    this.accent=value('--copper',COLORS.selected);this.ink=value('--ink','#203038');this.paper=value('--panel','#fffdf9');
    this.bondColor=value('--muted',COLORS.bond);
    this.normalLayer.style.color=value('--mint','#286e64');
    this.normalArrow.setColor(value('--mint','#286e64'));
    for(const line of this.normalLayer.querySelectorAll('line')){line.setAttribute('stroke','currentColor');line.setAttribute('stroke-width','1.7');line.setAttribute('stroke-linecap','round');}
    for(const text of this.normalLayer.querySelectorAll('text'))text.setAttribute('fill','currentColor');
    for(const material of this.materials||[]){
      if(material.userData.selected)material.color.set(this.accent);
      else if(material.userData.bond)material.color.set(this.bondColor);
    }
    for(const label of this.labels){label.el.style.background=this.paper;label.el.style.color=label.selected?this.accent:label.element==='O'?COLORS.O:this.ink;}
  }

  clear() {
    const geometries=new Set(),materials=new Set();
    this.group.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)for(const item of Array.isArray(object.material)?object.material:[object.material])materials.add(item);});
    geometries.forEach(item=>item.dispose());materials.forEach(item=>item.dispose());this.group.clear();
    for(const label of this.labels)label.el.remove();this.leaderLayer.replaceChildren();this.labels=[];this.pickables=[];this.materials=[];
  }

  setState(sugarState,{showHydrogens=false,selected=sugarState.selected}={}) {
    if(this.disposed)return false;
    this.state=sugarState;
    return this.setMolecule(sugarChairMolecule(sugarState),{showHydrogens,selected});
  }

  /** Full external molecules share the same fixed-coordinate camera contract.
   * focusAtoms highlights explicit atom IDs in addition to the selected carbon
   * group. A ring oxygen is highlighted only by an explicit focusAtoms entry.
   */
  setMolecule(molecule,{showHydrogens=false,selected=5,focusAtoms=[],showNormal}={}) {
    if(this.disposed)return false;
    if(!molecule||!Array.isArray(molecule.atoms)||!Array.isArray(molecule.bonds))throw new TypeError('A molecule needs atoms and bonds arrays');
    if(!molecule.atoms.every(atom=>typeof atom.id==='string'&&finiteTriple(atom.position)))throw new TypeError('Each atom needs an ID and finite xyz coordinates');
    if(new Set(molecule.atoms.map(atom=>atom.id)).size!==molecule.atoms.length)throw new TypeError('Atom IDs must be unique');
    if(!Array.isArray(focusAtoms)||!focusAtoms.every(id=>typeof id==='string'))throw new TypeError('focusAtoms must contain atom IDs');
    const atomIds=new Set(molecule.atoms.map(atom=>atom.id));
    if(!molecule.bonds.every(bond=>atomIds.has(bond.a)&&atomIds.has(bond.b)&&[1,2,3].includes(bond.order??1)))throw new TypeError('Bonds need existing atom IDs and integer order 1, 2, or 3');
    this.clear();this.molecule=molecule;this.selected=Number(selected);this.showHydrogens=!!showHydrogens;
    this.focusAtoms=new Set(focusAtoms.filter(id=>atomIds.has(id)));this.molecularForm=moleculeForm(molecule);
    this.showNormal=this.molecularForm!=='open-chain'&&Boolean(showNormal??(molecule.metadata?.ringNormal!==null));
    this.normalLayer.hidden=!this.showNormal;this.normalLayer.style.display=this.showNormal?'':'none';
    if(!this.showNormal)this.normalArrow.visible=false;
    const atoms=new Map(molecule.atoms.map(atom=>[atom.id,atom]));
    const visible=molecule.atoms.filter(atom=>this.showHydrogens||atom.element!=='H');
    const visibleIds=new Set(visible.map(atom=>atom.id));
    const sphere=new THREE.SphereGeometry(1,24,16),cylinder=new THREE.CylinderGeometry(1,1,1,12);
    const cache=new Map();
    const material=(color,isSelected=false,bond=false)=>{
      const key=[color,isSelected,bond].join('/');
      if(!cache.has(key)){
        const item=new THREE.MeshStandardMaterial({color,roughness:.48,metalness:0});item.userData={selected:isSelected,bond};cache.set(key,item);this.materials.push(item);
      }
      return cache.get(key);
    };
    const belongsToSelected=atom=>this.molecularForm==='open-chain'
      ?Number(atom.carbon??atom.id?.match(/^(?:C|O|H(?:-O)?)(\d+)/)?.[1])===this.selected
      :selectorCarbon(atom)===this.selected;
    for(const atom of visible){
      const active=this.focusAtoms.has(atom.id)||(belongsToSelected(atom)&&atom.role!=='ring-oxygen');
      const mesh=new THREE.Mesh(sphere,material(active?this.accent:COLORS[atom.element]||COLORS.C,active));
      mesh.position.fromArray(atom.position);mesh.scale.setScalar(RADII[atom.element]||.25);mesh.userData.atom=atom;
      this.group.add(mesh);this.pickables.push(mesh);
      const directSelectedHydrogen=atom.element==='H'&&molecule.bonds.some(bond=>(bond.a===atom.id&&bond.b===`C${this.selected}`)||(bond.b===atom.id&&bond.a===`C${this.selected}`));
      if(atom.element!=='H'||directSelectedHydrogen)this.addLabel(atom,mesh,active);
    }
    let visibleBondSegments=0;
    for(const bond of molecule.bonds){
      if(!visibleIds.has(bond.a)||!visibleIds.has(bond.b))continue;
      const a=atoms.get(bond.a),b=atoms.get(bond.b),start=vector(a.position),end=vector(b.position),axis=end.clone().sub(start);
      const length=axis.length();if(length<1e-8)continue;
      const explicitFocus=this.focusAtoms.has(a.id)&&this.focusAtoms.has(b.id);
      const active=explicitFocus||(belongsToSelected(a)&&belongsToSelected(b)&&a.role!=='ring-oxygen'&&b.role!=='ring-oxygen');
      const order=bond.order??1,direction=axis.clone().normalize();
      let side=new THREE.Vector3();
      // Put parallel rods into a local bond plane using a neighbouring atom.
      // This fixed geometric offset never changes bond order or atom positions.
      if(order>1){
        for(const neighbour of molecule.bonds){
          const other=neighbour.a===bond.a?neighbour.b:neighbour.b===bond.a?neighbour.a:null;
          if(!other||other===bond.b)continue;
          side.copy(vector(atoms.get(other).position).sub(start));side.addScaledVector(direction,-side.dot(direction));
          if(side.lengthSq()>1e-8)break;
        }
        if(side.lengthSq()<1e-8){side.crossVectors(direction,new THREE.Vector3(0,0,1));if(side.lengthSq()<1e-8)side.crossVectors(direction,new THREE.Vector3(0,1,0));}
        side.normalize().multiplyScalar(.105);
      }
      const midpoint=start.clone().add(end).multiplyScalar(.5);
      for(let strand=0;strand<order;strand++){
        const mesh=new THREE.Mesh(cylinder,material(active?this.accent:this.bondColor,active,!active));
        const radius=order>1?(active?.059:.049):(active?.077:.062);
        mesh.position.copy(midpoint).addScaledVector(side,(strand-(order-1)/2)*2);mesh.scale.set(radius,length,radius);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);mesh.userData.bond=bond;mesh.userData.bondStrand=strand;
        this.group.add(mesh);visibleBondSegments++;
      }
    }
    this.canvas.dataset.atomCount=String(molecule.atoms.length);this.canvas.dataset.visibleAtoms=String(visible.length);
    this.canvas.dataset.bondCount=String(molecule.bonds.length);this.canvas.dataset.bondOrderSum=String(molecule.bonds.reduce((sum,bond)=>sum+(bond.order??1),0));
    this.canvas.dataset.visibleBondSegments=String(visibleBondSegments);this.canvas.dataset.selectedCarbon=String(this.selected);
    this.canvas.dataset.moleculeId=molecule.id||'';this.canvas.dataset.molecularForm=this.molecularForm;
    this.canvas.dataset.chair=molecule.metadata?.chair||'';this.canvas.dataset.series=molecule.metadata?.series||'';
    this.canvas.dataset.anomer=molecule.metadata?.anomer||'';this.canvas.dataset.showHydrogens=String(this.showHydrogens);
    this.canvas.dataset.focusAtoms=[...this.focusAtoms].join(' ');this.canvas.dataset.showNormal=String(this.showNormal);
    // First fit leaves a replayed full snapshot untouched. Later chemical or
    // selection changes keep the user's exact camera and zoom.
    if(!this.hasModel){this.hasModel=true;if(!finiteTriple(this.initialView.position)){if(!this.container.clientWidth||!this.container.clientHeight)this.pendingFit=true;else this.fit({notify:false});}}
    this.dirty=true;this.requestFrame();return molecule;
  }

  addLabel(atom,mesh,active) {
    const el=document.createElement('span');el.className='sc3-label'+(active?' sc3-label-selected':'');
    const carbon=selectorCarbon(atom);
    const group=active&&atom.element==='O'?(atom.role==='hydroxyl-oxygen'?'OH':atom.role==='hydroxymethyl-oxygen'?'CH₂OH':atom.role==='carbonyl-oxygen'?'C=O':null):null;
    el.textContent=group?`${group} · ${atom.id}`:atom.id;
    el.dataset.atomId=atom.id;el.dataset.selectorCarbon=String(carbon||'');
    el.style.cssText='position:absolute;display:block;white-space:nowrap;line-height:1.2;font-size:12px;padding:2px 4px;border-radius:3px;pointer-events:auto;cursor:pointer;user-select:none;transform:translate(-50%,-50%)';
    el.style.background=this.paper;el.style.color=active?this.accent:atom.element==='O'?COLORS.O:this.ink;
    if(active)el.style.fontWeight='650';
    el.tabIndex=carbon?0:-1;el.setAttribute('role',carbon?'button':'img');el.setAttribute('aria-label',`${atom.id}${group?'，'+group:''}${carbon?'；追蹤 C'+carbon:''}`);
    el.setAttribute('aria-pressed',String(active));this.labelLayer.append(el);
    const leader=document.createElementNS('http://www.w3.org/2000/svg','line');leader.setAttribute('stroke',this.bondColor);leader.setAttribute('stroke-width','1');leader.setAttribute('opacity','.55');this.leaderLayer.append(leader);
    this.labels.push({el,leader,mesh,id:atom.id,element:atom.element,selected:active});
  }

  pick(clientX,clientY) {
    if(this.disposed)return null;
    const rect=this.canvas.getBoundingClientRect();if(!rect.width||!rect.height)return null;
    this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);
    this.pointer.set((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const atom=this.raycaster.intersectObjects(this.pickables,false)[0]?.object.userData.atom;
    return atom?selectorCarbon(atom):null;
  }

  resize() {
    if(this.disposed)return;
    const width=this.container.clientWidth,height=this.container.clientHeight;if(!width||!height)return;
    if(this.pendingFit){this.pendingFit=false;this.fit({notify:false});return;}
    this.width=width;this.height=height;const aspect=width/height;
    this.camera.left=-this.halfHeight*aspect;this.camera.right=this.halfHeight*aspect;
    this.camera.top=this.halfHeight;this.camera.bottom=-this.halfHeight;this.camera.updateProjectionMatrix();
    this.renderer.setSize(width,height,false);this.controls.handleResize();this.dirty=true;this.requestFrame();
  }

  settle() {
    this.controls._lastAngle=0;this.controls._lastRollAngle=0;
    this.controls._movePrev.copy(this.controls._moveCurr);this.controls._zoomStart.copy(this.controls._zoomEnd);this.controls._panStart.copy(this.controls._panEnd);
    this.controls._touchZoomDistanceStart=this.controls._touchZoomDistanceEnd=Math.max(1e-6,this.controls._touchZoomDistanceEnd||0);this.controls._touchRollPointerIds='';
  }

  /** Accepts yaw/pitch/roll or the exact position/target/up snapshot from getView. */
  setView(view,{notify=true}={}) {
    if(this.disposed||!view||typeof view!=='object')return false;
    const exact=[view.position,view.target,view.up].every(finiteTriple);
    if(view.target!==undefined&&!finiteTriple(view.target))return false;
    if((view.position!==undefined||view.up!==undefined)&&!exact)return false;
    if(exact){
      const eye=vector(view.position).sub(vector(view.target)),up=vector(view.up);
      if(eye.lengthSq()<1e-8||up.lengthSq()<1e-8||new THREE.Vector3().crossVectors(eye,up).lengthSq()<1e-10)return false;
    }else if(!Number.isFinite(view.yaw??0)||!Number.isFinite(view.pitch??25)||!Number.isFinite(view.roll??0))return false;
    if(view.zoom!==undefined&&(!Number.isFinite(view.zoom)||view.zoom<=0))return false;
    if(view.frustumHeight!==undefined&&(!Number.isFinite(view.frustumHeight)||view.frustumHeight<=0))return false;
    this.settle();this.silent=true;
    try{
      if(exact){this.camera.position.fromArray(view.position);this.controls.target.fromArray(view.target);this.camera.up.fromArray(view.up).normalize();if(this.hasModel)this.pendingFit=false;}
      else{
        const yaw=radians(view.yaw??0),pitch=radians(view.pitch??25),roll=radians(view.roll??0);
        const eye=new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),-Math.cos(yaw)*Math.cos(pitch),Math.sin(pitch));
        const up=new THREE.Vector3(Math.sin(yaw)*Math.sin(pitch),Math.cos(yaw)*Math.sin(pitch),Math.cos(pitch));
        const distance=Math.max(1,this.camera.position.distanceTo(this.controls.target)||12);
        up.applyAxisAngle(eye,roll);if(finiteTriple(view.target))this.controls.target.fromArray(view.target);
        this.camera.position.copy(this.controls.target).add(eye.multiplyScalar(distance));this.camera.up.copy(up);this.lastYaw=view.yaw??0;
      }
      if(view.zoom!==undefined)this.camera.zoom=Math.max(this.controls.minZoom,Math.min(this.controls.maxZoom,view.zoom));
      if(view.frustumHeight!==undefined)this.halfHeight=view.frustumHeight/2;
      this.camera.updateProjectionMatrix();this.controls.update();this.camera.updateMatrixWorld(true);
    }finally{this.silent=false;}
    this.pendingView=notify;this.dirty=true;this.resize();this.requestFrame();
    if(!notify)this.lastSignature=cameraSignature(this.getView());return true;
  }

  /** Local Fischer cameras use original coordinates and an explicit target. */
  focusLocalView(view,options={}) {
    const applied=this.setView(view,{notify:false,...options});
    if(applied)this.canvas.dataset.localFocusCarbon=Number.isInteger(view.carbon)?String(view.carbon):'';
    return applied;
  }

  getView() {
    const eye=this.camera.position.clone().sub(this.controls.target).normalize();
    const pitch=degrees(Math.asin(Math.max(-1,Math.min(1,eye.z))));
    const yaw=Math.hypot(eye.x,eye.y)>1e-8?degrees(Math.atan2(-eye.x,-eye.y)):this.lastYaw;
    this.lastYaw=yaw;
    const azimuth=radians(yaw),elevation=radians(pitch);
    const nominalUp=new THREE.Vector3(Math.sin(azimuth)*Math.sin(elevation),Math.cos(azimuth)*Math.sin(elevation),Math.cos(elevation));
    const actualUp=this.camera.up.clone().addScaledVector(eye,-this.camera.up.dot(eye)).normalize();
    const roll=degrees(Math.atan2(eye.dot(new THREE.Vector3().crossVectors(nominalUp,actualUp)),nominalUp.dot(actualUp)));
    return {yaw:normalizeAngle(yaw),pitch,roll:normalizeAngle(roll),position:this.camera.position.toArray(),target:this.controls.target.toArray(),up:this.camera.up.toArray(),zoom:this.camera.zoom,frustumHeight:this.halfHeight*2};
  }

  rotate(direction) {
    if(this.disposed)return false;
    const action={left:[-.18,0,0],right:[.18,0,0],up:[0,.18,0],down:[0,-.18,0],'roll-left':[0,0,.18],'roll-right':[0,0,-.18]}[direction];
    if(!action)return false;
    this.settle();const eye=this.camera.position.clone().sub(this.controls.target),up=this.camera.up.clone().normalize();
    const right=new THREE.Vector3().crossVectors(up,eye).normalize();
    const horizontal=new THREE.Quaternion().setFromAxisAngle(up,action[0]),vertical=new THREE.Quaternion().setFromAxisAngle(right,action[1]);
    eye.applyQuaternion(horizontal).applyQuaternion(vertical);this.camera.up.applyQuaternion(vertical);
    if(action[2])this.camera.up.applyAxisAngle(eye.clone().normalize(),action[2]);
    this.camera.position.copy(this.controls.target).add(eye);this.controls.update();this.dirty=true;this.pendingView=true;this.requestFrame();return true;
  }

  /** factor > 1 magnifies the orthographic scene; coordinates remain fixed. */
  zoomBy(factor) {
    if(this.disposed||!Number.isFinite(factor)||factor<=0)return false;
    this.settle();this.camera.zoom=Math.max(this.controls.minZoom,Math.min(this.controls.maxZoom,this.camera.zoom*factor));
    this.camera.updateProjectionMatrix();this.controls.update();this.dirty=true;this.pendingView=true;this.requestFrame();return true;
  }

  fit({resetView=false,notify=true}={}) {
    if(this.disposed)return false;
    const previousSignature=this.lastSignature;
    if(resetView){this.setView({yaw:0,pitch:25,roll:0},{notify:false});if(notify)this.lastSignature=previousSignature;}
    this.settle();const eye=this.camera.position.clone().sub(this.controls.target).normalize();
    const points=(this.molecule?.atoms||[]).map(atom=>vector(atom.position));
    const center=this.molecularForm==='open-chain'&&points.length?new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3()):new THREE.Vector3();
    this.controls.target.copy(center);this.camera.position.copy(center).add(eye.multiplyScalar(12));
    const radius=Math.max(2.3,...points.map(point=>point.distanceTo(center)+.3));
    const aspect=(this.container.clientWidth||1)/(this.container.clientHeight||1);
    this.halfHeight=(radius+.35)/Math.min(1,aspect);this.camera.zoom=1;
    this.silent=true;try{this.controls.update();}finally{this.silent=false;}
    this.pendingView=notify;this.resize();this.dirty=true;this.requestFrame();if(!notify)this.lastSignature=cameraSignature(this.getView());return true;
  }

  updateLabels() {
    const width=this.width,height=this.height;if(!width||!height)return;
    const placed=this.showNormal?[{x:width-48,y:45,w:88,h:84}]:[];
    const labels=[...this.labels].sort((a,b)=>Number(b.selected)-Number(a.selected));
    for(const label of labels){
      const point=label.mesh.position.clone().project(this.camera);
      if(point.x<-1||point.x>1||point.y<-1||point.y>1||point.z<-1||point.z>1){label.el.hidden=true;label.el.style.display='none';label.leader.style.display='none';continue;}
      label.el.hidden=false;label.el.style.display='block';
      const x=(point.x+1)*width/2,y=(1-point.y)*height/2;
      const w=Math.max(25,label.el.offsetWidth),h=Math.max(18,label.el.offsetHeight),gap=3;
      const offsets=[[0,-22],[0,22],[22,0],[-22,0],[20,-22],[-20,-22],[20,22],[-20,22],[0,-42],[0,42],[42,0],[-42,0]];
      const overlap=box=>placed.some(other=>Math.abs(box.x-other.x)<(box.w+other.w)/2+gap&&Math.abs(box.y-other.y)<(box.h+other.h)/2+gap);
      const candidates=offsets.map(([dx,dy])=>({x:Math.max(w/2+2,Math.min(width-w/2-2,x+dx)),y:Math.max(h/2+2,Math.min(height-h/2-2,y+dy)),w,h}));
      const box=candidates.find(candidate=>!overlap(candidate))||candidates[0];placed.push(box);
      label.el.hidden=false;label.el.style.left=`${box.x}px`;label.el.style.top=`${box.y}px`;
      label.leader.setAttribute('x1',String(x));label.leader.setAttribute('y1',String(y));label.leader.setAttribute('x2',String(box.x));label.leader.setAttribute('y2',String(box.y));
      label.leader.style.display=Math.hypot(box.x-x,box.y-y)>30?'':'none';
    }
  }

  updateSignature() {
    const view=this.getView();this.canvas.dataset.viewYaw=view.yaw.toFixed(3);this.canvas.dataset.viewPitch=view.pitch.toFixed(3);
    this.canvas.dataset.viewRoll=view.roll.toFixed(3);this.canvas.dataset.viewZoom=view.zoom.toFixed(4);
    this.canvas.dataset.viewSignature=cameraSignature(view);this.canvas.dataset.viewSnapshot=JSON.stringify(view);
  }

  updateNormal() {
    this.normalLayer.hidden=!this.showNormal;this.normalLayer.style.display=this.showNormal?'':'none';
    if(!this.showNormal){this.normalArrow.visible=false;for(const key of ['normalScreenX','normalScreenY','normalDepth'])delete this.normalLayer.dataset[key];return;}
    const normal=vector(this.molecule?.metadata?.ringNormal||[0,0,1]);
    const matrix=this.camera.matrixWorld.elements;
    const right=new THREE.Vector3(matrix[0],matrix[1],matrix[2]),up=new THREE.Vector3(matrix[4],matrix[5],matrix[6]),eye=new THREE.Vector3(matrix[8],matrix[9],matrix[10]);
    const x=normal.dot(right),y=-normal.dot(up),depth=-normal.dot(eye),length=Math.hypot(x,y);
    this.normalLayer.dataset.normalScreenX=x.toFixed(6);this.normalLayer.dataset.normalScreenY=y.toFixed(6);this.normalLayer.dataset.normalDepth=depth.toFixed(6);
    const arrow=this.normalLayer.querySelector('.sc3-normal-arrow'),symbol=this.normalLayer.querySelector('.sc3-normal-depth');
    arrow.style.display='none';symbol.textContent=length>.06?'':depth<0?'⊙':'⊗';symbol.style.fontSize='24px';
    this.normalArrow.visible=length>.06;
    const pixelsPerUnit=(this.height*this.camera.zoom)/(2*this.halfHeight);
    this.normalArrow.position.copy(new THREE.Vector3(2*(this.width-44)/this.width-1,1-104/this.height,0).unproject(this.camera));
    this.normalArrow.setDirection(normal);this.normalArrow.setLength(35/pixelsPerUnit,8/pixelsPerUnit,4/pixelsPerUnit);
    if(length<=.06)return;
    const tail={x:48,y:48},tip={x:48+x*35,y:48+y*35},ux=x/length,uy=y/length;
    const segments=[[tail,tip],[{x:tip.x-ux*7-uy*4,y:tip.y-uy*7+ux*4},tip],[{x:tip.x-ux*7+uy*4,y:tip.y-uy*7-ux*4},tip]];
    [...arrow.children].forEach((line,index)=>{const [a,b]=segments[index];line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);});
  }

  notifyView() {
    if(this.disposed||!this.pendingView)return;
    const wait=Math.max(0,80-(performance.now()-this.lastNotify));
    if(wait>0){if(!this.notifyTimer)this.notifyTimer=setTimeout(()=>{this.notifyTimer=null;this.notifyView();},wait);return;}
    const view=this.getView(),signature=cameraSignature(view);this.pendingView=false;
    if(signature===this.lastSignature)return;
    this.lastSignature=signature;this.lastNotify=performance.now();this.onViewChange(view);
  }

  requestFrame() {
    if(this.disposed||this.contextLost||document.hidden||this.frame)return;
    this.frame=requestAnimationFrame(()=>{
      this.frame=null;if(this.disposed||this.contextLost||document.hidden)return;
      if(!this.container.clientWidth||!this.container.clientHeight)return;
      this.controls.update();
      if(this.dirty||this.interacting){this.camera.updateMatrixWorld(true);this.updateNormal();this.renderer.render(this.scene,this.camera);this.updateLabels();this.updateSignature();this.dirty=false;}
      this.notifyView();if(this.interacting)this.requestFrame();
    });
  }

  dispose() {
    if(this.disposed)return;this.disposed=true;
    if(this.frame)cancelAnimationFrame(this.frame);if(this.notifyTimer)clearTimeout(this.notifyTimer);
    this.frame=null;this.notifyTimer=null;this.pendingView=false;this.interacting=false;this.dirty=false;
    this.listeners.abort();this.resizeObserver.disconnect();this.themeObserver.disconnect();
    this.controls.removeEventListener('change',this.onControlChange);this.controls.removeEventListener('start',this.onControlStart);this.controls.removeEventListener('end',this.onControlEnd);
    this.controls.dispose();this.clear();this.normalArrow.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.canvas.remove();this.labelLayer.remove();
    if(this.container.style.position==='relative'&&this.originalPosition!==this.container.style.position)this.container.style.position=this.originalPosition;
  }
}
