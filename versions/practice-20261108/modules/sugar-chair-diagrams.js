import { chairGeometry, projectChairPoint } from './sugar-chair-model.js';

const number = value => Number(value.toFixed(2));
const escape = value => String(value).replace(/[&<>\"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
const faceName = face => face === 'up' ? '上' : '下';
const positionName = position => position === 'axial' ? '軸向 a' : '赤道向 e';
const line = (a, b, className = 'sc-bond', attrs = '') => `<line class="${className}" x1="${number(a.x)}" y1="${number(a.y)}" x2="${number(b.x)}" y2="${number(b.y)}" ${attrs}/>`;
const text = (point, label, className = 'sc-label', attrs = '') => `<text class="${className}" x="${number(point.x)}" y="${number(point.y)}" text-anchor="middle" dominant-baseline="central" ${attrs}>${escape(label)}</text>`;
const start = (kind, state, title, attrs = '') => `<svg class="sc-diagram sc-${kind}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 300" role="group" aria-label="${escape(title)}" data-sugar-diagram="${kind}" data-series="${state.series}" data-anomer="${state.anomer}" data-chair="${state.chair}" ${attrs}><title>${escape(title)}</title>`;

function carbonNode(point, row, selected, description = null) {
  const label = description || `C${row.carbon}，${row.group} ${faceName(row.face)}，${positionName(row.position)}`;
  return `<g class="sc-carbon${row.carbon === selected ? ' sc-active' : ''}" data-chair-carbon="${row.carbon}" data-face="${row.face}" data-position="${row.position}" role="button" tabindex="0" aria-label="${escape(label)}" aria-pressed="${row.carbon === selected}"><title>${escape(label)}</title><circle class="sc-carbon-hit" cx="${number(point.x)}" cy="${number(point.y)}" r="20"/><circle class="sc-carbon-node" cx="${number(point.x)}" cy="${number(point.y)}" r="12"/>${text(point, row.carbon, 'sc-number')}</g>`;
}

function oxygen(point) {
  return `<g class="sc-oxygen" data-ring-oxygen="O5"><title>O5：原 C5 羥基的氧</title><circle class="sc-oxygen-node" cx="${number(point.x)}" cy="${number(point.y)}" r="12"/>${text(point, 'O', 'sc-label sc-oxygen-label')}</g>`;
}

export function renderFischer(state) {
  const center = 190, ys = [32, 81, 128, 175, 222];
  let result = start('fischer', state, `${state.series}-${state.name} Fischer 投影；醛基朝上`);
  result += line({ x: center, y: 47 }, { x: center, y: 258 });
  result += text({ x: center, y: 32 }, 'CHO', 'sc-label sc-terminal');
  result += text({ x: center, y: 275 }, 'CH₂OH', 'sc-label sc-terminal');
  result += carbonNode({ x: 246, y: 32 }, state.rows[0], state.selected, 'C1，醛基碳；開鏈時不定 α/β');
  for (const row of state.rows.slice(1)) {
    const point = { x: center, y: ys[row.carbon - 1] };
    result += line({ x: 126, y: point.y }, { x: 254, y: point.y }, 'sc-bond sc-fischer-cross');
    result += text({ x: 106, y: point.y }, row.fischer === 'left' ? 'OH' : 'H', `sc-label ${row.fischer === 'left' ? 'sc-oh' : 'sc-hydrogen'}`, `data-fischer-carbon="${row.carbon}" data-fischer-side="left"`);
    result += text({ x: 274, y: point.y }, row.fischer === 'right' ? 'OH' : 'H', `sc-label ${row.fischer === 'right' ? 'sc-oh' : 'sc-hydrogen'}`, `data-fischer-carbon="${row.carbon}" data-fischer-side="right"`);
    result += carbonNode(point, row, state.selected, `C${row.carbon}，Fischer OH 在${row.fischer === 'right' ? '右' : '左'}；橫鍵朝前，縱鍵朝後`);
  }
  return `${result}</svg>`;
}

export function renderHaworth(state) {
  const ring = [
    { x: 278, y: 148 }, { x: 234, y: 190 }, { x: 146, y: 190 },
    { x: 102, y: 148 }, { x: 146, y: 106 }, { x: 234, y: 106 },
  ];
  let result = start('haworth', state, `${state.anomer === 'alpha' ? 'α' : 'β'}-${state.series}-${state.name} Haworth 投影；O5 在右上`);
  for (let index = 0; index < 6; index++) result += line(ring[index], ring[(index + 1) % 6], `sc-bond sc-ring${index === 1 ? ' sc-front-bond' : ''}`);
  for (const row of state.rows) {
    const anchor = ring[row.carbon - 1], sign = row.face === 'up' ? -1 : 1;
    const endpoint = { x: anchor.x, y: anchor.y + sign * 48 };
    result += line(anchor, endpoint, `sc-bond sc-substituent${row.carbon === state.selected ? ' sc-active' : ''}`, `data-substituent-carbon="${row.carbon}" data-face="${row.face}"`);
    result += text({ x: endpoint.x, y: endpoint.y + sign * 12 }, row.group, `sc-label sc-oh${row.carbon === state.selected ? ' sc-active' : ''}`);
  }
  for (const row of state.rows) result += carbonNode(ring[row.carbon - 1], row, state.selected);
  result += oxygen(ring[5]);
  return `${result}</svg>`;
}

/** Place group labels around their projected endpoints, avoiding carbon badges. */
function placeLabels(groups, atomPoints, reserved = []) {
  const placed = [];
  const padding = 5;
  const overlaps = (box, other) => box.x - box.w / 2 - padding < other.x + other.w / 2 && box.x + box.w / 2 + padding > other.x - other.w / 2 && box.y - box.h / 2 - padding < other.y + other.h / 2 && box.y + box.h / 2 + padding > other.y - other.h / 2;
  const obstacles = [...atomPoints.map(point => ({ ...point, w: 29, h: 29 })), ...reserved];
  for (const group of groups) {
    const dx = group.endpoint.x - group.anchor.x, dy = group.endpoint.y - group.anchor.y;
    const length = Math.hypot(dx, dy) || 1;
    const base = { x: group.endpoint.x + dx / length * 15, y: group.endpoint.y + dy / length * 15 };
    const width = group.label === 'CH₂OH' ? 61 : group.label === 'OH' ? 27 : 16;
    const offsets = [[0, 0], [0, -18], [0, 18], [-20, 0], [20, 0], [-20, -18], [20, -18], [-20, 18], [20, 18], [0, -36], [0, 36], [-38, 0], [38, 0], [0, -54], [0, 54], [-38, -36], [38, -36], [-38, 36], [38, 36]];
    let chosen = null;
    for (const [ox, oy] of offsets) {
      const box = { x: Math.max(width / 2 + 7, Math.min(373 - width / 2, base.x + ox)), y: Math.max(15, Math.min(285, base.y + oy)), w: width, h: 20 };
      if (![...obstacles, ...placed].some(other => overlaps(box, other))) { chosen = box; break; }
    }
    // Rare axial crowds (and underside views) need a wider search. A leader
    // retains the bond endpoint instead of hiding a carbon under a label.
    if (!chosen) {
      const candidates = [];
      for (let x = width / 2 + 7; x <= 373 - width / 2; x += 14) for (let y = 15; y <= 285; y += 14) candidates.push({ x, y, w: width, h: 20 });
      candidates.sort((a, b) => (a.x - base.x) ** 2 + (a.y - base.y) ** 2 - (b.x - base.x) ** 2 - (b.y - base.y) ** 2);
      chosen = candidates.find(box => ![...obstacles, ...placed].some(other => overlaps(box, other)));
    }
    chosen ||= { x: width / 2 + 7, y: 15, w: width, h: 20 };
    placed.push(chosen);
    group.labelPoint = chosen;
  }
  return groups;
}

export function renderChair(state, { yaw = 0, pitch = 25, showHydrogens = false, highlight = state.selected } = {}) {
  const geometry = chairGeometry(state);
  const screen = point => {
    const rotated = projectChairPoint(point, { yaw, pitch });
    return { x: 190 + rotated.x * 58, y: 151 + rotated.y * 58, depth: rotated.depth };
  };
  const atoms = geometry.ring.map(screen), bonds = [], groups = [];
  for (let index = 0; index < 6; index++) {
    const a = atoms[index], b = atoms[(index + 1) % 6];
    bonds.push({ a, b, depth: (a.depth + b.depth) / 2, className: 'sc-bond sc-ring',
      attrs: `data-ring-bond="${geometry.ring[index].atom}-${geometry.ring[(index + 1) % 6].atom}"` });
  }
  for (const row of geometry.substituents) {
    const anchor = screen(row.anchor), endpoint = screen(row.endpoint);
    bonds.push({ a: anchor, b: endpoint, depth: (anchor.depth + endpoint.depth) / 2,
      className: `sc-bond sc-substituent sc-${row.position}${row.carbon === highlight ? ' sc-active' : ''}`,
      attrs: `data-substituent-carbon="${row.carbon}" data-face="${row.face}" data-position="${row.position}"` });
    groups.push({ anchor, endpoint, label: row.group, carbon: row.carbon, face: row.face, position: row.position, hydrogen: false });
    if (showHydrogens) {
      const hydrogenEndpoint = screen(row.hydrogenEndpoint);
      bonds.push({ a: anchor, b: hydrogenEndpoint, depth: (anchor.depth + hydrogenEndpoint.depth) / 2,
        className: 'sc-bond sc-hydrogen', attrs: `data-hydrogen-carbon="${row.carbon}" data-face="${row.hydrogenFace}"` });
      groups.push({ anchor, endpoint: hydrogenEndpoint, label: 'H', carbon: row.carbon, face: row.hydrogenFace,
        position: row.position === 'axial' ? 'equatorial' : 'axial', hydrogen: true });
    }
  }
  // Translate the projected molecular +z normal into a small orientation key.
  // Projection controls its direction and foreshortening, rather than CSS.
  const normal = projectChairPoint({ x: 0, y: 0, z: 1 }, { yaw, pitch });
  const normalTail = { x: 344, y: 94 };
  const normalTip = { x: normalTail.x + normal.x * 52, y: normalTail.y + normal.y * 52 };
  const normalLength = Math.hypot(normal.x, normal.y);
  const normalLabel = { x: 334, y: 114 };
  const normalObstacle = { x: 334, y: 72, w: 84, h: 110 };
  let result = start('chair', state, `${state.anomer === 'alpha' ? 'α' : 'β'}-${state.series}-${state.name} ${state.chair} 椅式；數字為碳編號`, `data-yaw="${number(yaw)}" data-pitch="${number(pitch)}"`);
  // Camera looks from −y,+z at positive pitch: negative depth is nearer.
  // Paint far bonds first so the nearer bonds are drawn over them.
  for (const bond of bonds.sort((a, b) => b.depth - a.depth)) result += line(bond.a, bond.b, bond.className, `${bond.attrs || ''} data-camera-depth="${number(bond.depth)}"`);
  for (const group of placeLabels(groups, atoms, [normalObstacle])) {
    const distance = Math.hypot(group.labelPoint.x - group.endpoint.x, group.labelPoint.y - group.endpoint.y);
    if (distance > 23) result += line(group.endpoint, group.labelPoint, 'sc-label-leader');
    result += text(group.labelPoint, group.label, `sc-label ${group.hydrogen ? 'sc-hydrogen' : 'sc-oh'}${!group.hydrogen && group.carbon === highlight ? ' sc-active' : ''}`, `data-label-carbon="${group.carbon}" data-face="${group.face}" data-position="${group.position}"`);
  }
  for (const row of state.rows) result += carbonNode(atoms[row.carbon - 1], row, highlight);
  result += oxygen(atoms[5]);
  result += `<g class="sc-plane-normal" data-plane-normal="+z" data-normal-screen-x="${number(normal.x)}" data-normal-screen-y="${number(normal.y)}" data-normal-depth="${number(normal.depth)}" role="img" aria-label="環上面方向，分子的正 z 環面法向量"><title>環上面：up 沿分子 +z；相機轉動不改變 up/down。</title>`;
  if (normalLength > 0.05) {
    const ux = normal.x / normalLength, uy = normal.y / normalLength;
    result += line(normalTail, normalTip, 'sc-plane-arrow');
    result += line({ x: normalTip.x - ux * 8 - uy * 5, y: normalTip.y - uy * 8 + ux * 5 }, normalTip, 'sc-plane-arrow');
    result += line({ x: normalTip.x - ux * 8 + uy * 5, y: normalTip.y - uy * 8 - ux * 5 }, normalTip, 'sc-plane-arrow');
  } else result += text(normalTail, normal.depth < 0 ? '⊙' : '⊗', 'sc-label sc-plane-normal-label');
  result += text(normalLabel, '環上面', 'sc-label sc-plane-normal-label');
  result += '</g>';
  return `${result}</svg>`;
}
