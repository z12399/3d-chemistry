// Screen coordinates and tolerance use CSS pixels, independent of devicePixelRatio.
// Exact surface hits win; the fallback only selects a visible part of a real bond.
export function pickScreenBond(point, segments, {directHit=null, tolerance=7, isVisible=()=>false}={}) {
  if(directHit)return directHit;
  const candidates=[];
  for(const segment of segments){
    const {start,end}=segment;
    if(![start.x,start.y,end.x,end.y].every(Number.isFinite))continue;
    const dx=end.x-start.x,dy=end.y-start.y,lengthSquared=dx*dx+dy*dy;
    if(lengthSquared<1e-6)continue;
    const t=((point.x-start.x)*dx+(point.y-start.y)*dy)/lengthSquared;
    // Do not extend a bond beyond its endpoints or make a front-on bond pickable.
    if(t<=0||t>=1)continue;
    const closest={x:start.x+t*dx,y:start.y+t*dy};
    const distanceSquared=(point.x-closest.x)**2+(point.y-closest.y)**2;
    if(distanceSquared<=tolerance*tolerance)candidates.push({object:segment.object,point:closest,distanceSquared});
  }
  candidates.sort((a,b)=>a.distanceSquared-b.distanceSquared);
  return candidates.find(candidate=>isVisible(candidate.object,candidate.point))||null;
}
