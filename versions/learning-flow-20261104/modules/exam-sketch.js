/** Normalized, browser-local sketch control. Persistence belongs to the caller. */
export const SKETCH_MAX_STROKE_POINTS=1000;
export const SKETCH_MAX_POINTS=20000;
export const SKETCH_COLOR='#17232d';
const widths=[2,4],idPattern=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/;
const cloneStroke=stroke=>({...stroke,points:stroke.points.map(point=>[...point])});
const copy=strokes=>strokes.map(cloneStroke);
const pointCount=strokes=>strokes.reduce((sum,stroke)=>sum+stroke.points.length,0);
let counter=0;
const newId=()=>globalThis.crypto?.randomUUID?.()||`sketch-${Date.now().toString(36)}-${(++counter).toString(36)}-${Math.random().toString(36).slice(2,8)}`;

export function validateSketchStrokes(value){
  if(!Array.isArray(value))throw new TypeError('草圖筆畫格式無效。');
  const ids=new Set();let total=0;
  for(const stroke of value){
    if(!stroke||typeof stroke!=='object'||Array.isArray(stroke)||typeof stroke.id!=='string'||!idPattern.test(stroke.id)||ids.has(stroke.id)||stroke.color!==SKETCH_COLOR||!widths.includes(stroke.width))throw new TypeError('草圖筆畫的識別、顏色或筆寬無效。');
    if(Object.keys(stroke).some(key=>!['id','points','width','color'].includes(key)))throw new TypeError('草圖含有不支援的筆畫欄位。');
    if(!Array.isArray(stroke.points)||stroke.points.length<1||stroke.points.length>SKETCH_MAX_STROKE_POINTS)throw new RangeError(`每段筆畫須有 1–${SKETCH_MAX_STROKE_POINTS.toLocaleString('en-US')} 個點。`);
    for(const point of stroke.points)if(!Array.isArray(point)||point.length!==2||point.some(number=>typeof number!=='number'||!Number.isFinite(number)||number<0||number>1))throw new RangeError('草圖座標必須位於畫布內。');
    total+=stroke.points.length;if(total>SKETCH_MAX_POINTS)throw new RangeError('草圖已超過 20,000 點；原筆畫未替換。');
    ids.add(stroke.id);
  }
  return copy(value);
}

export function normalizeSketchPoint(clientX,clientY,rect){
  if(!Number.isFinite(clientX)||!Number.isFinite(clientY)||!rect||![rect.left,rect.top,rect.width,rect.height].every(Number.isFinite)||rect.width<=0||rect.height<=0)throw new RangeError('目前無法讀取畫布位置，請展開草圖後再試。');
  return [Math.max(0,Math.min(1,(clientX-rect.left)/rect.width)),Math.max(0,Math.min(1,(clientY-rect.top)/rect.height))].map(value=>Number(value.toFixed(6)));
}

export function sketchCanvasSize(cssWidth,dpr=1){
  const width=Number.isFinite(cssWidth)&&cssWidth>0?cssWidth:800;
  const ratio=Number.isFinite(dpr)&&dpr>0?dpr:1;
  return {cssWidth:width,cssHeight:width*5/8,pixelWidth:Math.max(1,Math.round(width*ratio)),pixelHeight:Math.max(1,Math.round(width*5/8*ratio)),dpr:ratio};
}

export function paintSketch(context,strokes,size){
  if(!context)return;
  context.setTransform(size.dpr,0,0,size.dpr,0,0);context.clearRect(0,0,size.cssWidth,size.cssHeight);
  context.fillStyle='#ffffff';context.fillRect(0,0,size.cssWidth,size.cssHeight);
  context.lineCap='round';context.lineJoin='round';
  for(const stroke of strokes){
    const lineWidth=stroke.width/800*size.cssWidth;
    context.strokeStyle=stroke.color;context.fillStyle=stroke.color;context.lineWidth=lineWidth;
    context.beginPath();
    if(stroke.points.length===1){const [x,y]=stroke.points[0];context.arc(x*size.cssWidth,y*size.cssHeight,lineWidth/2,0,Math.PI*2);context.fill();continue;}
    stroke.points.forEach(([x,y],index)=>index?context.lineTo(x*size.cssWidth,y*size.cssHeight):context.moveTo(x*size.cssWidth,y*size.cssHeight));
    context.stroke();
  }
}

/** Callbacks are synchronous. false / {ok:false} retains the pending stroke.
 * Optional result.strokes / result.canUndo replace local fallback history. */
export function mountExamSketch(container,{strokes=[],readOnly=false,canUndo,onStroke=()=>true,onUndo=()=>true,onClear=()=>true,onError=()=>{}}={}){
  if(!container||typeof container.querySelector!=='function')throw new TypeError('草圖需要有效的容器。');
  let accepted=validateSketchStrokes(strokes),locked=readOnly===true,externalUndo=typeof canUndo==='boolean'?canUndo:null;
  let history=accepted.map(stroke=>({type:'stroke',id:stroke.id})),pending=null,pointerId=null,currentWidth=2;
  let disposed=false,disposingResult=true,delivering=false,frame=null,observer=null,size=sketchCanvasSize(800),context=null;
  let statusText='',statusError=false,needsRetry=false,stateVersion=0;
  const prefix='exam-sketch-'+newId();
  container.innerHTML=`<section class="exam-sketch" aria-labelledby="${prefix}-title"><div class="exam-sketch-heading"><h3 id="${prefix}-title">草圖／反應式</h3><span data-sketch-count></span></div><div class="exam-sketch-toolbar"><fieldset data-sketch-tools><legend>筆畫粗細</legend><label><input type="radio" name="${prefix}-width" value="2" checked>細筆</label><label><input type="radio" name="${prefix}-width" value="4">粗筆</label></fieldset><div class="exam-sketch-actions"><button type="button" data-sketch-undo>復原上一步</button><button type="button" data-sketch-clear>清除草圖</button><button type="button" data-sketch-retry hidden>重試保存筆畫</button></div></div><div class="exam-sketch-frame"><canvas width="800" height="500" tabindex="0" role="img" aria-label="手寫草圖畫布" aria-describedby="${prefix}-hint ${prefix}-status" data-sketch-canvas></canvas></div><p class="exam-sketch-hint" id="${prefix}-hint" data-sketch-hint></p><p class="exam-sketch-status" id="${prefix}-status" data-sketch-status role="status" aria-live="polite"></p></section>`;
  const $=selector=>container.querySelector(selector),root=$('.exam-sketch'),canvas=$('[data-sketch-canvas]'),status=$('[data-sketch-status]');
  if(!canvas)throw new Error('草圖畫布無法建立。');
  context=canvas.getContext?.('2d')||null;
  const handlers=[];
  const listen=(element,type,handler,options)=>{element?.addEventListener(type,handler,options);handlers.push(()=>element?.removeEventListener(type,handler,options));};
  const say=(text,error=false)=>{statusText=text||'';statusError=error;if(status){status.textContent=statusText;status.dataset.error=String(error);}};
  const fail=text=>{say(text,true);try{onError(text);}catch{/* Keep the original visible failure even if a consumer notification fails. */}};
  const canUndoNow=()=>externalUndo??history.length>0;
  function controls(){
    root?.classList.toggle('is-read-only',locked);
    const count=$('[data-sketch-count]');if(count)count.textContent=`${accepted.length+(pending?1:0)} 筆畫 · ${pointCount(accepted)+(pending?.points.length||0)} / 20,000 點`;
    const tools=$('[data-sketch-tools]');if(tools)tools.disabled=locked||!context;
    const undo=$('[data-sketch-undo]');if(undo)undo.disabled=locked||(!pending&&!canUndoNow())||!context;
    const clear=$('[data-sketch-clear]');if(clear)clear.disabled=locked||(!accepted.length&&!pending)||!context;
    const retry=$('[data-sketch-retry]');if(retry){retry.hidden=!needsRetry;retry.disabled=delivering;}
    const hint=$('[data-sketch-hint]');if(hint)hint.textContent=locked?'這是封存的草圖，不能再修改。可用文字原稿補充判讀。':'用滑鼠、觸控筆或手指畫出結構與關係；文字推理仍寫在原稿中。畫布聚焦時可按 Ctrl／⌘+Z 復原。';
    canvas.setAttribute('aria-label',locked?'封存的手寫草圖，唯讀':'手寫草圖畫布，可用滑鼠或觸控筆作畫');
  }
  function paint(){frame=null;paintSketch(context,[...accepted,...(pending?[pending]:[])],size);controls();}
  function schedulePaint(){
    if(disposed)return;
    if(typeof globalThis.requestAnimationFrame==='function'){if(frame===null)frame=globalThis.requestAnimationFrame(()=>{if(!disposed)paint();});}
    else paint();
  }
  function resize(){
    if(disposed)return;
    const rect=canvas.getBoundingClientRect();size=sketchCanvasSize(rect.width,globalThis.devicePixelRatio||globalThis.window?.devicePixelRatio||1);
    if(canvas.width!==size.pixelWidth)canvas.width=size.pixelWidth;if(canvas.height!==size.pixelHeight)canvas.height=size.pixelHeight;
    paint();
  }
  function release(){
    const id=pointerId;pointerId=null;
    if(id!==null)try{if(canvas.hasPointerCapture?.(id))canvas.releasePointerCapture(id);}catch{/* A cancelled pointer can already have lost capture. */}
  }
  function resultState(result,version){
    if(result?.strokes!==undefined){accepted=validateSketchStrokes(result.strokes);history=accepted.map(stroke=>({type:'stroke',id:stroke.id}));stateVersion++;}
    if(typeof result?.canUndo==='boolean')externalUndo=result.canUndo;
    return stateVersion!==version;
  }
  function acceptedResult(result,label){
    if(result===false||result?.ok===false){fail(result?.error||`${label}尚未保存，草圖仍留在本頁。請重試或先保留作答。`);return false;}
    if(result&&typeof result.then==='function'){fail('草圖保存尚未同步確認；筆畫仍保留，請先不要離開。');return false;}
    return true;
  }
  function deliver(){
    if(!pending)return true;if(delivering)return false;
    const outgoing=cloneStroke(pending),version=stateVersion;delivering=true;
    try{
      validateSketchStrokes([...accepted,outgoing]);
      const result=onStroke(cloneStroke(outgoing));
      if(!acceptedResult(result,'這段筆畫')){needsRetry=true;return false;}
      const externallyUpdated=resultState(result,version);
      if(!externallyUpdated){accepted.push(outgoing);history.push({type:'stroke',id:outgoing.id});if(externalUndo!==null)externalUndo=true;}
      pending=null;needsRetry=false;
      if(result?.persisted===false){say(result.error||'筆畫暫存在此分頁，請下載備考備份。',true);try{onError(statusText);}catch{}}
      else say('筆畫已保存。');
      return true;
    }catch(error){needsRetry=true;fail(error.message||'這段筆畫尚未保存，原筆畫仍留在本頁。');return false;}
    finally{delivering=false;paint();}
  }
  function flush(){release();return deliver();}
  function limitReached(){flush();fail('草圖已達 20,000 點上限；目前筆畫已保留。請先備份或復原一個步驟，再繼續作畫。');controls();}
  function addPoint(point){
    if(!pending)return false;
    const last=pending.points.at(-1);if(last[0]===point[0]&&last[1]===point[1])return true;
    if(pending.points.length===SKETCH_MAX_STROKE_POINTS){
      const lastPoint=[...last],width=pending.width;
      if(!deliver()){release();return false;}
      if(pointCount(accepted)+2>SKETCH_MAX_POINTS){limitReached();return false;}
      pending={id:newId(),points:[lastPoint],width,color:SKETCH_COLOR};say('長筆畫已分段保留；復原會逐段回退。');
    }
    if(pointCount(accepted)+pending.points.length>=SKETCH_MAX_POINTS){limitReached();return false;}
    pending.points.push(point);
    if(pointCount(accepted)+pending.points.length===SKETCH_MAX_POINTS){limitReached();return false;}
    return true;
  }
  function pointerPoint(event){return normalizeSketchPoint(event.clientX,event.clientY,canvas.getBoundingClientRect());}
  function pointerDown(event){
    if(disposed||locked||!context||pointerId!==null||event.button!==undefined&&event.button!==0)return;
    if(pending&&!flush())return;
    if(pointCount(accepted)>=SKETCH_MAX_POINTS){limitReached();return;}
    try{
      const point=pointerPoint(event);pending={id:newId(),points:[point],width:currentWidth,color:SKETCH_COLOR};pointerId=event.pointerId;
      try{canvas.setPointerCapture?.(pointerId);}catch{}
      canvas.focus?.({preventScroll:true});event.preventDefault?.();say('正在作畫；放開後保存。');schedulePaint();
    }catch(error){fail(error.message);}
  }
  function pointerMove(event){
    if(disposed||locked||event.pointerId!==pointerId||!pending)return;
    event.preventDefault?.();
    try{
      const samples=event.getCoalescedEvents?.(),events=samples?.length?samples:[event];
      for(const sample of events){
        if(!pending||pointerId===null)break;
        const rect=canvas.getBoundingClientRect();
        if(!addPoint(normalizeSketchPoint(sample.clientX,sample.clientY,rect)))break;
        if(sample.clientX<rect.left||sample.clientX>rect.left+rect.width||sample.clientY<rect.top||sample.clientY>rect.top+rect.height){flush();break;}
      }
      schedulePaint();
    }catch(error){flush();fail(error.message);}
  }
  function pointerUp(event){
    if(event.pointerId!==pointerId)return;
    if(!disposed&&!locked&&pending&&Number.isFinite(event.clientX)&&Number.isFinite(event.clientY))try{addPoint(pointerPoint(event));}catch(error){fail(error.message);}
    event.preventDefault?.();flush();
  }
  function undo(){
    if(disposed||locked||!context)return false;if(!flush())return false;if(!canUndoNow())return false;
    const version=stateVersion,previous=history.at(-1);
    try{
      const result=onUndo();if(!acceptedResult(result,'復原'))return false;
      const externallyUpdated=resultState(result,version);
      if(!externallyUpdated){
        if(previous?.type==='clear')accepted=copy(previous.strokes);
        else if(previous?.type==='stroke')accepted=accepted.filter(stroke=>stroke.id!==previous.id);
        else {fail('目前沒有可在此頁復原的歷史，請重新載入保存紀錄。');return false;}
        history.pop();if(externalUndo!==null)externalUndo=history.length>0;
      }
      if(result?.persisted===false)fail(result.error||'復原暫存在此分頁，請下載備份。');else say('已復原上一步。');paint();return true;
    }catch(error){fail(error.message||'復原尚未完成，原草圖仍保留。');return false;}
  }
  function clear(){
    if(disposed||locked||!context)return false;if(!flush())return false;if(!accepted.length)return true;
    const before=copy(accepted),version=stateVersion;
    try{
      const result=onClear();if(!acceptedResult(result,'清除'))return false;
      const externallyUpdated=resultState(result,version);
      if(!externallyUpdated){history.push({type:'clear',strokes:before});accepted=[];if(externalUndo!==null)externalUndo=true;}
      if(result?.persisted===false)fail(result.error||'清除暫存在此分頁，請下載備份。');else say('草圖已清除；可按「復原上一步」取回。');paint();return true;
    }catch(error){fail(error.message||'清除尚未完成，原草圖仍保留。');return false;}
  }
  function setStrokes(value,options={}){
    let next;try{next=validateSketchStrokes(value);}catch(error){fail(error.message);return false;}
    if(pending&&!delivering){
      const justSaved=pending.id;
      if(!flush()){if(options.readOnly===true){locked=true;controls();}return false;}
      if(!next.some(stroke=>stroke.id===justSaved)){
        if(options.readOnly===true)locked=true;
        fail('這段筆畫剛完成保存，未用較舊畫面覆寫。請讀取最新草圖後再更新。');controls();return false;
      }
    }
    accepted=next;history=accepted.map(stroke=>({type:'stroke',id:stroke.id}));stateVersion++;
    if(typeof options.readOnly==='boolean')locked=options.readOnly;
    if(typeof options.canUndo==='boolean')externalUndo=options.canUndo;else externalUndo=null;
    if(locked)release();paint();return true;
  }
  listen(canvas,'pointerdown',pointerDown);
  listen(canvas,'pointermove',pointerMove);
  listen(canvas,'pointerup',pointerUp);
  listen(canvas,'pointercancel',event=>{if(event.pointerId===pointerId)flush();});
  listen(canvas,'lostpointercapture',event=>{if(event.pointerId===pointerId)flush();});
  listen(canvas,'keydown',event=>{if(!locked&&(event.ctrlKey||event.metaKey)&&event.key?.toLowerCase()==='z'&&!event.shiftKey){event.preventDefault();undo();}});
  for(const input of container.querySelectorAll('input[type="radio"]'))listen(input,'change',()=>{if(!locked&&widths.includes(Number(input.value)))currentWidth=Number(input.value);});
  listen($('[data-sketch-undo]'),'click',undo);listen($('[data-sketch-clear]'),'click',clear);listen($('[data-sketch-retry]'),'click',()=>{if(flush())controls();});
  if(typeof globalThis.ResizeObserver==='function'){observer=new globalThis.ResizeObserver(resize);observer.observe(canvas);}else if(typeof window!=='undefined')listen(window,'resize',resize);
  if(typeof window!=='undefined')listen(window,'beforeunload',event=>{if(!flush()){event.preventDefault();event.returnValue='';}});
  resize();if(!context)fail('這個瀏覽器暫時無法建立草圖畫布；既有筆畫資料仍保留，請先用文字原稿記錄。');else say(locked?'封存草圖已載入。':accepted.length?'已載入保存的草圖。':'可在空白畫布開始作畫。');controls();
  return {
    flush,
    setStrokes,
    dispose(){
      if(disposed)return disposingResult;
      disposingResult=flush();disposed=true;observer?.disconnect();handlers.splice(0).forEach(remove=>remove());
      if(frame!==null&&typeof globalThis.cancelAnimationFrame==='function')globalThis.cancelAnimationFrame(frame);frame=null;
      // DOM and pending data remain intact if a callback failed. The caller can
      // retry flush() on this controller; dispose never silently clears them.
      return disposingResult;
    }
  };
}
