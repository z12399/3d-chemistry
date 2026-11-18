// Screen-space annotation layout only. Moving a label never moves its atom.
const TAU = Math.PI * 2;
const finite = Number.isFinite;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function intersectionArea(a, b, gap) {
  const w = Math.min(a.x + a.width / 2, b.x + b.width / 2) -
    Math.max(a.x - a.width / 2, b.x - b.width / 2) + gap;
  const h = Math.min(a.y + a.height / 2, b.y + b.height / 2) -
    Math.max(a.y - a.height / 2, b.y - b.height / 2) + gap;
  return w > 0 && h > 0 ? w * h : 0;
}

function leaderToEdge(anchor, box) {
  const dx = anchor.x - box.x, dy = anchor.y - box.y;
  if (Math.abs(dx) <= box.width / 2 && Math.abs(dy) <= box.height / 2) return null;
  const t = Math.min(box.width / (2 * Math.abs(dx)), box.height / (2 * Math.abs(dy)));
  return {x1: anchor.x, y1: anchor.y, x2: box.x + dx * t, y2: box.y + dy * t};
}

/**
 * All coordinates and sizes are CSS pixels. Selected labels get the available
 * space first. If a dense cluster cannot fit within maxOffset, ordinary labels
 * are suppressed; selected labels stay visible at the least-overlapping place.
 * `crowded` reports that geometric limit instead of pretending every label fits.
 */
export function layoutAtomLabels(labels, {width, height, maxOffset = 40, selectedMaxOffset = maxOffset, padding = 4, gap = 3} = {}) {
  const placed = [], result = new Map();
  const validViewport = finite(width) && finite(height) && width > 0 && height > 0;
  const ordered = labels.map((label, index) => ({...label, index})).sort((a, b) =>
    Number(!!b.selected) - Number(!!a.selected) || (a.depth ?? 0) - (b.depth ?? 0) || a.index - b.index);

  for (const label of ordered) {
    const {id, x, y} = label;
    if (!validViewport || !finite(x) || !finite(y) || !finite(label.width) || !finite(label.height) ||
        label.width <= 0 || label.height <= 0 || x < 0 || y < 0 || x > width || y > height ||
        (finite(label.depth) && (label.depth < -1 || label.depth > 1))) {
      result.set(id, {id, hidden: true, crowded: false, leader: null});
      continue;
    }
    const preferred = {x: finite(label.preferredX) ? label.preferredX : x,
      y: finite(label.preferredY) ? label.preferredY : y - label.height / 2 - 10};
    const w = label.width, h = label.height;
    const tooLarge = w + padding * 2 > width || h + padding * 2 > height;
    if (tooLarge && !label.selected) {
      result.set(id, {id, hidden: true, crowded: true, leader: null});
      continue;
    }
    const candidates = [], seen = new Set();let searchOffset=maxOffset;
    const add = (cx, cy) => {
      // A viewport too small for one full ID is an explicit crowded fallback.
      const px = tooLarge ? clamp(cx, 0, width) : clamp(cx, padding + w / 2, width - padding - w / 2);
      const py = tooLarge ? clamp(cy, 0, height) : clamp(cy, padding + h / 2, height - padding - h / 2);
      const displacement = Math.hypot(px - x, py - y);
      if (displacement > searchOffset + .001) return;
      const key = `${px.toFixed(2)},${py.toFixed(2)}`;
      if (seen.has(key)) return;
      seen.add(key);
      const coversAnchor = Math.abs(px - x) < w / 2 + 3 && Math.abs(py - y) < h / 2 + 3;
      candidates.push({id, x: px, y: py, width: w, height: h,
        score: (px - preferred.x) ** 2 + (py - preferred.y) ** 2 + displacement ** 2 * .12 + (coversAnchor ? 1000 : 0)});
    };
    const direction = Math.atan2(preferred.y - y, preferred.x - x);
    const preferredRadius = Math.min(maxOffset, Math.hypot(preferred.x - x, preferred.y - y));
    add(x + Math.cos(direction) * preferredRadius, y + Math.sin(direction) * preferredRadius);
    add(x, y);
    for (const radius of [12, 24, 32, maxOffset]) {
      if (radius > maxOffset) continue;
      for (let i = 0; i < 16; i++) add(x + Math.cos(direction + i * TAU / 16) * radius,
        y + Math.sin(direction + i * TAU / 16) * radius);
    }
    let best = null, leastOverlap = Infinity;
    const choose=()=>{
      candidates.sort((a,b)=>a.score-b.score);best=null;leastOverlap=Infinity;
      for(const candidate of candidates){
        const overlap=placed.reduce((sum,previous)=>sum+intersectionArea(candidate,previous,gap),0);
        if(overlap<leastOverlap){best=candidate;leastOverlap=overlap;}
        if(overlap===0)break;
      }
    };
    choose();
    // The default40px contract stays unchanged. A viewer can offer selected
    // IDs more screen space when their actual enlarged boxes cannot fit nearby.
    if(label.selected&&leastOverlap>0&&finite(selectedMaxOffset)&&selectedMaxOffset>maxOffset){
      searchOffset=selectedMaxOffset;
      const increment=Math.max(8,Math.min(20,h/2+gap));
      for(let radius=maxOffset+increment;radius<searchOffset;radius+=increment){
        for(let i=0;i<32;i++)add(x+Math.cos(direction+i*TAU/32)*radius,y+Math.sin(direction+i*TAU/32)*radius);
      }
      for(let i=0;i<32;i++)add(x+Math.cos(direction+i*TAU/32)*searchOffset,y+Math.sin(direction+i*TAU/32)*searchOffset);
      choose();
    }
    if (!best || (leastOverlap > 0 && !label.selected)) {
      if (!label.selected) {
        result.set(id, {id, hidden: true, crowded: true, leader: null});
        continue;
      }
      // Selected ID remains present even if its width makes all bounds infeasible.
      best = {id, x, y, width: w, height: h};
      leastOverlap = Infinity;
    }
    const moved = Math.hypot(best.x - preferred.x, best.y - preferred.y) > 2 || Math.hypot(best.x-x,best.y-y)>maxOffset;
    const output = {id, x: best.x, y: best.y, width: w, height: h, hidden: false,
      crowded: tooLarge || leastOverlap > 0, leader: moved ? leaderToEdge({x, y}, best) : null};
    placed.push(output);
    result.set(id, output);
  }
  return labels.map(label => result.get(label.id));
}
