export const MAX_SKETCH_POINTS=20000;
export function validateExamStroke(stroke){
 if(!stroke||typeof stroke!=='object'||Array.isArray(stroke)||Object.keys(stroke).sort().join(',')!=='color,id,points,width')throw Error('草圖筆畫格式無效。');
 if(typeof stroke.id!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/.test(stroke.id)||![2,4].includes(stroke.width)||stroke.color!=='#17232d')throw Error('草圖筆畫識別或筆觸格式無效。');
 if(!Array.isArray(stroke.points)||stroke.points.length<1||stroke.points.length>1000)throw Error('每一筆畫需有 1–1,000 個座標點；請分段繪製。');
 for(const point of stroke.points)if(!Array.isArray(point)||point.length!==2||!point.every(value=>Number.isFinite(value)&&value>=0&&value<=1))throw Error('草圖座標必須位於畫布內。');
 return {id:stroke.id,points:stroke.points.map(point=>[...point]),width:stroke.width,color:stroke.color};
}
export function validateSketchOperation(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||!['stroke','clear','undo'].includes(value.operation))throw Error('草圖操作格式無效。');
 const keys=value.operation==='stroke'?['operation','stroke']:['operation'];
 if(Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))throw Error('草圖操作包含不支援的欄位。');
 return value.operation==='stroke'?{operation:'stroke',stroke:validateExamStroke(value.stroke)}:{operation:value.operation};
}
export function replayExamSketch(operations){
 // Keep inverse operations rather than a full copy after every stroke. Many
 // short taps must not produce quadratic memory use in an ordinary drawing.
 const history=[];let strokes=[],ids=new Set(),points=0;
 for(const raw of operations){
  const event=validateSketchOperation(raw);
  if(event.operation==='undo'){
   const previous=history.pop();
   if(previous?.type==='stroke'){const removed=strokes.pop();ids.delete(removed.id);points-=removed.points.length;}
   else if(previous?.type==='clear'){strokes=previous.strokes;ids=previous.ids;points=previous.points;}
   continue;
  }
  if(event.operation==='clear'){
   if(strokes.length){history.push({type:'clear',strokes,ids,points});strokes=[];ids=new Set();points=0;}
   continue;
  }
  if(ids.has(event.stroke.id))throw Error('同一張草圖的筆畫識別重複。');
  if(points+event.stroke.points.length>MAX_SKETCH_POINTS)throw Error('草圖已達 20,000 點容量；請先保存備份，再復原或清除部分內容。');
  history.push({type:'stroke'});strokes.push(event.stroke);ids.add(event.stroke.id);points+=event.stroke.points.length;
 }
 return {strokes,canUndo:history.length>0};
}
