/** Deterministic multiscale starch teaching scenes. Only atomic fragments have Å coordinates. */
export const STARCH_SPATIAL_KINDS = Object.freeze(['amylose', 'amylopectin']);
export const STARCH_SPATIAL_SCALES = Object.freeze([
  Object.freeze({id: 'atom', label: '糖環與接點', shortLabel: '微觀', description: '五個葡萄糖基，直接找 C1–O–C4 與 C1–O–C6。'}),
  Object.freeze({id: 'chain', label: '一條分子的走向', shortLabel: '鏈尺度', description: '把每個糖環縮成一顆小球，轉動整條鏈與分枝。'}),
  Object.freeze({id: 'assembly', label: '鏈段的局部組織', shortLabel: '聚集尺度', description: '比較多條直鏈與同一支鏈分子的外側鏈段配對。'}),
  Object.freeze({id: 'granule', label: '放回澱粉顆粒', shortLabel: '顆粒尺度', description: '同一個含兩種成分的顆粒剖面，分別突出直鏈與支鏈。'})
]);

const LABELS = {amylose: '直鏈澱粉', amylopectin: '支鏈澱粉'};
const copy = value => JSON.parse(JSON.stringify(value));
const p3 = (x, y, z) => [x, y, z];
const add = (a, b) => a.map((v, i) => v + b[i]);
const mul = (a, n) => a.map(v => v * n);
const unit = v => mul(v, 1 / Math.hypot(...v));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mix = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t);

function newScene(kind, scale, conformation) {
  return {kind, scale, conformation, title: LABELS[kind], subtitle: '', description: '',
    residues: [], links: [], curves: [], markers: [], surfaces: [],
    legend: [{id: 'amylose', label: '直鏈：無分枝主鏈'}, {id: 'amylopectin', label: '支鏈：主鏈與側鏈'},
      {id: 'branch', label: 'α(1→6) 分枝接點'}, {id: 'endpoint', label: '鏈端'}], notes: [],
    metadata: {coordinateUnit: scale === 'atom' ? 'angstrom' : 'arbitrary', notToScale: scale !== 'atom',
      isTrajectory: false, isMeasuredConformation: false, isNaturalWholeMolecule: false,
      representation: scale === 'atom' ? 'computed atomistic short fragment' : 'residue connectivity schematic',
      spatialScaleConversion: false, sourceIds: ['starch-spatial-pubchem-g5', 'starch-spatial-amylose-conformation', 'starch-spatial-double-helix', 'starch-spatial-granule']}};
}

function curve(scene, id, points, residueIds, kind, role = 'chain', moleculeId = id) {
  scene.curves.push({id, points: points.map(point => [...point]), residueIds: [...residueIds], kind,
    role: kind === scene.kind ? role : 'context', structuralRole: role, moleculeId});
}

/** points run from a reducing-side base toward a nonreducing terminal. */
function chain(scene, id, points, kind, {parent = null, moleculeId = id, role = 'chain', split = null} = {}) {
  const ids = points.map((_, i) => `${id}:g${i + 1}`);
  points.forEach((position, i) => scene.residues.push({id: ids[i], position: [...position], chainId: id,
    moleculeId, kind, role: kind === scene.kind ? role : 'context', structuralRole: role}));
  for (let i = 1; i < ids.length; i++) {
    scene.links.push({id: `${ids[i]}-${ids[i - 1]}`, donor: ids[i], acceptor: ids[i - 1],
      donorCarbon: 1, acceptorCarbon: 4, linkage: 'α(1→4)', kind, moleculeId});
  }
  if (parent) {
    scene.links.push({id: `${ids[0]}-${parent.id}`, donor: ids[0], acceptor: parent.id,
      donorCarbon: 1, acceptorCarbon: 6, linkage: 'α(1→6)', kind, moleculeId});
    curve(scene, `${id}:branch-link`, [parent.position, points[0]], [parent.id, ids[0]], kind, 'branch-link', moleculeId);
  }
  if (split != null) {
    curve(scene, `${id}:stem`, points.slice(0, split + 1), ids.slice(0, split + 1), kind, 'chain', moleculeId);
    curve(scene, `${id}:paired`, points.slice(split), ids.slice(split), kind, 'double-helix', moleculeId);
  } else {
    curve(scene, id, points, ids, kind, role, moleculeId);
  }
  return ids.map((identifier, i) => ({id: identifier, position: [...points[i]]}));
}

function helixPoints(count, origin, axis, radius = 2.3, phase = 0, rise = 0.68) {
  const direction = unit(axis), tangent = unit(cross(direction, Math.abs(direction[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));
  const bitangent = cross(direction, tangent);
  return Array.from({length: count}, (_, i) => {
    const angle = phase + i * Math.PI / 3;
    return add(add(add(origin, mul(direction, i * rise)), mul(tangent, radius * Math.cos(angle))), mul(bitangent, radius * Math.sin(angle)));
  });
}

function coilPoints(count, offset = [0, 0, 0], phase = 0, breadth = 1) {
  return Array.from({length: count}, (_, i) => {
    const t = i / (count - 1), u = (t - .5) * 32;
    return add(offset, [u + breadth * 2.3 * Math.sin(t * 5.8 + phase),
      breadth * (4.8 * Math.sin(t * 6.9 + phase) + 1.5 * Math.sin(t * 14.5)),
      breadth * (4.9 * Math.cos(t * 5.6 + phase) + 1.1 * Math.sin(t * 11.1 + phase))]);
  });
}

function addSingleChain(scene) {
  const points = scene.conformation === 'helix' ? helixPoints(48, [-16, 0, 0], [1, .13, .08]) : coilPoints(48);
  chain(scene, 'amylose-one', points, 'amylose');
  scene.subtitle = '一條連續、無分枝的鏈';
  scene.description = '「直鏈」指沒有分枝；它可以彎曲。代表螺旋只是換一種觀察模型，同一條鏈的接續關係不變。';
}

function branchPoints(parent, count, direction, phase = 0) {
  const axis = unit(direction), tangent = unit(cross(axis, Math.abs(axis[1]) > .9 ? [1, 0, 0] : [0, 1, 0]));
  const bitangent = cross(axis, tangent);
  return Array.from({length: count}, (_, i) => {
    const t = i + 1;
    return add(add(add(parent.position, mul(axis, t * .94)), mul(tangent, 1.6 * Math.sin(t * .66 + phase))),
      mul(bitangent, 1.35 * Math.sin(t * .47 + phase)));
  });
}

function addBranchedChain(scene) {
  const moleculeId = 'amylopectin-one';
  const main = chain(scene, `${moleculeId}:main`, coilPoints(44, [0, -2, 0], .8, .8), 'amylopectin', {moleculeId});
  const branches = [[6, [.15, 1, .5], 13], [14, [-.3, .15, -1], 15], [22, [.2, 1, -.8], 14],
    [30, [.15, -.65, 1], 15], [37, [.25, .8, .65], 13]];
  const built = branches.map(([index, direction, count], i) => chain(scene, `${moleculeId}:b${i + 1}`,
    branchPoints(main[index], count, direction, i * .55), 'amylopectin', {parent: main[index], moleculeId}));
  for (const [branchIndex, residueIndex, direction] of [[0, 6, [-1, .2, .35]], [2, 7, [.9, .2, .6]]]) {
    const parent = built[branchIndex][residueIndex];
    chain(scene, `${moleculeId}:secondary${branchIndex}`, branchPoints(parent, 9, direction, .4), 'amylopectin', {parent, moleculeId});
  }
  scene.subtitle = '分枝向空間中不同方向延伸';
  scene.description = '沿著任一側鏈往回追，會經過 α(1→6) 接點回到同一分子；側鏈本身繼續用 α(1→4) 接續。';
}

function addAmyloseAssembly(scene) {
  for (let i = 0; i < 6; i++) {
    const offset = [1.9 * Math.sin(i * 1.4), (i - 2.5) * 3.6, 4.4 * Math.cos(i * 1.2)];
    const points = scene.conformation === 'helix'
      ? helixPoints(42, add([-14, 0, 0], offset), [1, .1 * Math.cos(i), .17 * Math.sin(i)], 1.55, i)
      : coilPoints(42, offset, i * .69, .7);
    chain(scene, `amylose-group:m${i + 1}`, points, 'amylose');
  }
  scene.subtitle = '幾條無分枝鏈的局部排列';
  scene.description = '這裡每條線各代表一條分子；視覺上的相鄰與交錯沒有增加糖苷共價鍵。彎曲與代表螺旋都是靜態示意。';
}

function addPairedCluster(scene, prefix, origin = [0, 0, 0], factor = 1, pairs = 5) {
  const moleculeId = prefix;
  const mainPoints = Array.from({length: pairs * 4 + 8}, (_, i) => {
    const a = i * .35;
    return add(origin, mul([6 * Math.sin(a), -8 + .13 * i, 5 * Math.cos(a)], factor));
  });
  const base = chain(scene, `${prefix}:base`, mainPoints, 'amylopectin', {moleculeId});
  for (let pair = 0; pair < pairs; pair++) {
    const angle = pair * (Math.PI * 2 / pairs) + .12;
    const direction = unit([Math.cos(angle) * .66, 1, Math.sin(angle) * .66]);
    const center = add(origin, mul([Math.cos(angle) * 6.5, -1.4, Math.sin(angle) * 6.5], factor));
    const pairedStarts = [];
    for (let strand = 0; strand < 2; strand++) {
      const parent = base[4 + pair * 4 + strand * 2];
      const winding = helixPoints(18, center, direction, 1.18 * factor, angle + strand * Math.PI, .62 * factor);
      const transition = Array.from({length: 5}, (_, i) => {
        const t = (i + 1) / 6;
        return add(mix(parent.position, winding[0], t), [factor * .5 * Math.sin(t * Math.PI), 0, factor * .4 * Math.sin(t * Math.PI)]);
      });
      const residues = chain(scene, `${prefix}:pair${pair + 1}:${strand}`, [...transition, ...winding], 'amylopectin',
        {parent, moleculeId, split: 5});
      pairedStarts.push(residues[12].position);
    }
    scene.markers.push({id: `${prefix}:paired-marker${pair + 1}`, position: mix(pairedStarts[0], pairedStarts[1], .5),
      kind: 'amylopectin', role: 'double-helix', label: '相鄰鏈段的雙螺旋示意', moleculeId});
  }
}

function addAmylopectinAssembly(scene) {
  addPairedCluster(scene, 'amylopectin-cluster');
  scene.subtitle = '同一支鏈分子的相鄰外側鏈段';
  scene.description = '從每一對外側螺旋向下追，兩段鏈都接回共同的分枝區；雙螺旋是局部配對，並沒有把兩段链融合成新的共價鏈。';
  scene.notes.push('較多分枝的區域以較彎曲的鏈段表示；這不是晶簇實測結構，也不代表所有鏈段都形成雙螺旋。');
}

function addGranule(scene) {
  // Both kind views are exactly the same mixed context; only emphasis differs.
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2 + .4;
    addPairedCluster(scene, `granule:ap${i + 1}`, [11 * Math.cos(angle), -8 + i * 4.5, 9 * Math.sin(angle)], .63, 3);
  }
  for (let i = 0; i < 8; i++) {
    const points = coilPoints(36, [0, (i - 3.5) * 3.8, 12.5 * Math.cos(i * 1.57)], i * .71, .64);
    chain(scene, `granule:am${i + 1}`, points, 'amylose');
  }
  scene.surfaces.push({id: 'mixed-granule-shell', type: 'ellipsoid', position: [0, 0, 0], scale: [31, 27, 28],
    opacity: .11, role: 'granule-shell', kind: 'context', cutaway: true, label: '混合澱粉顆粒的概念剖面'});
  scene.subtitle = `在同一個混合顆粒中突出${LABELS[scene.kind]}`;
  scene.description = '兩側顯示同一個同時含直鏈與支鏈的概念顆粒。淡色鏈保留另一成分的位置關係，外殼只是顆粒範圍提示。';
  scene.notes.push('半結晶顆粒的局部有序區與較無序區是組織層次；較無序區也含支鏈鏈段，不能把兩區直接等同兩種成分。',
    '鏈的數量、位置、外殼形狀與比例是為觀察而選定的示意，不是特定植物的顆粒實測值。');
  scene.metadata.mixedGranule = true;
  scene.metadata.emphasisOnly = true;
}

function addAtomic(scene, fragments) {
  if (!fragments || !Array.isArray(fragments.molecules)) throw new TypeError('Atomic starch fragments must be provided');
  const molecule = fragments.molecules.find(item => item.kind === scene.kind);
  if (!molecule || !Array.isArray(molecule.atoms) || !Array.isArray(molecule.bonds)) throw new RangeError('Missing atomic starch fragment');
  const atomById = new Map(molecule.atoms.map(atom => [atom.id, atom]));
  const atomIds = [...atomById.keys()];
  if (atomById.size !== molecule.atoms.length || molecule.atoms.some(a => !Array.isArray(a.position) || a.position.length !== 3 || a.position.some(v => !Number.isFinite(v)))
    || molecule.bonds.some(b => !atomById.has(b.a) || !atomById.has(b.b))) throw new TypeError('Invalid atomic fragment graph');
  const branch = molecule.links.filter(link => link.acceptorCarbon === 6);
  const selectedBridges = branch.length ? branch : molecule.links.slice(1, 2);
  const highlights = new Set(selectedBridges.flatMap(link => [link.donorC1, link.bridgeO, link.acceptorAtom]));
  scene.atomic = {...copy(molecule), highlightAtomIds: [...highlights],
    highlightBondIds: molecule.bonds.filter(b => highlights.has(b.a) && highlights.has(b.b)).map(b => b.id),
    highlightBonds: molecule.bonds.filter(b => highlights.has(b.a) && highlights.has(b.b)).map(b => ({a: b.a, b: b.b})),
    atomIds, validation: copy(fragments.validation || {})};
  scene.links = copy(molecule.links);
  for (const residue of molecule.residues) {
    const ring = ['C1', 'C2', 'C3', 'C4', 'C5', 'O5'].map(id => atomById.get(residue.positions[id]).position);
    const center = ring.reduce((sum, point) => add(sum, point), [0, 0, 0]).map(v => v / ring.length);
    scene.residues.push({id: residue.id, position: center, kind: scene.kind, chainId: molecule.id, moleculeId: molecule.id,
      role: 'sugar-ring', atomIds: ring.map((_, i) => residue.positions[['C1', 'C2', 'C3', 'C4', 'C5', 'O5'][i]])});
  }
  for (const link of selectedBridges) {
    scene.markers.push({id: `${link.id}:atom-bridge`, position: [...atomById.get(link.bridgeO).position],
      kind: scene.kind, role: link.acceptorCarbon === 6 ? 'branch' : 'glycosidic-bridge', label: link.linkage,
      atomIds: [link.donorC1, link.bridgeO, link.acceptorAtom], residueId: link.acceptor});
  }
  scene.metadata = {...scene.metadata, atomicGraphScope: molecule.metadata.graphScope, atomicMethod: molecule.metadata.method,
    fragmentFormula: molecule.formula, sourceCacheSha256: molecule.metadata.sourceCacheSha256,
    atomicValidationStatus: fragments.validation?.status || 'unknown'};
  scene.subtitle = scene.kind === 'amylose' ? '五個糖環，四個 α(1→4) 接點' : '五個糖環，含一個 α(1→6) 分枝接點';
  scene.description = scene.kind === 'amylose'
    ? '發亮的接點從上一個糖環的 C1 經氧，連到下一個糖環的 C4。每個環都是椅式立體，整條片段不必排成筆直。'
    : '发亮的分枝從側鏈糖環的 C1 經氧，接到另一糖環伸出環外的 C6；該接點的同一糖環仍保留 C4 主鏈接續。';
  scene.notes.push('兩者都只取五個葡萄糖基來看接點；不是完整天然分子。支鏈片段是依 α-D 葡萄糖立體化學建立的示範分子。',
    '原子座標為 RDKit 計算構象；α 描述異頭碳的立體配置，不能只用畫面中的朝上或朝下判斷。');
}

function annotate(scene) {
  const residueById = new Map(scene.residues.map(r => [r.id, r]));
  const donors = new Set(scene.links.map(link => link.donor));
  const acceptors = new Set(scene.links.map(link => link.acceptor));
  const branchLinks = scene.links.filter(link => link.acceptorCarbon === 6);
  const endpoints = {reducing: scene.residues.filter(r => !donors.has(r.id)), nonreducing: scene.residues.filter(r => !acceptors.has(r.id))};
  if (scene.scale !== 'atom') {
    for (const link of branchLinks) {
      const residue = residueById.get(link.acceptor);
      if (residue.kind !== scene.kind) continue;
      scene.markers.push({id: `${link.id}:branch`, position: [...residue.position], role: 'branch', kind: residue.kind,
        label: 'α(1→6)', residueId: residue.id, donor: link.donor, moleculeId: residue.moleculeId});
    }
    // Endpoints remain in the graph, but granule labels only illustrate selected
    // examples so a field of labels does not obscure the organization.
    for (const [role, nodes] of Object.entries(endpoints)) {
      const shown = nodes.filter(r => r.kind === scene.kind);
      for (const residue of scene.scale === 'granule' ? shown.slice(0, role === 'reducing' ? 1 : 3) : shown) {
        scene.markers.push({id: `${residue.id}:${role}`, position: [...residue.position], role: `${role}-end`, kind: residue.kind,
          label: role === 'reducing' ? '還原端' : '非還原端', residueId: residue.id, moleculeId: residue.moleculeId});
      }
    }
  }
  const selected = scene.residues.filter(r => r.kind === scene.kind);
  const selectedLinks = scene.links.filter(l => l.kind === scene.kind || scene.scale === 'atom');
  scene.statistics = {residueCount: selected.length, contextResidueCount: scene.residues.length - selected.length,
    totalResidueCount: scene.residues.length, alpha1To4Count: selectedLinks.filter(l => l.acceptorCarbon === 4).length,
    alpha1To6Count: selectedLinks.filter(l => l.acceptorCarbon === 6).length,
    reducingEndCount: endpoints.reducing.filter(r => r.kind === scene.kind).length,
    nonreducingEndCount: endpoints.nonreducing.filter(r => r.kind === scene.kind).length,
    moleculeCount: new Set(selected.map(r => r.moleculeId)).size,
    countScope: 'only displayed representative residues and links'};
  scene.metadata.componentCount = new Set(scene.residues.map(r => r.moleculeId)).size;
  scene.metadata.countScope = 'displayed model only; not natural molecular DP or component fraction';
  scene.notes.unshift(scene.scale === 'atom' ? '計算構象／短片段' : '非比例教學示意：每顆小球代表一個葡萄糖基；切換尺度會換代表模型，沒有連續量尺。');
  return scene;
}

export function buildStarchSpatial(kind, scale, options = {}) {
  if (!STARCH_SPATIAL_KINDS.includes(kind)) throw new RangeError('Unknown starch kind');
  if (!STARCH_SPATIAL_SCALES.some(item => item.id === scale)) throw new RangeError('Unknown starch spatial scale');
  if (options == null || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Starch options must be an object');
  const conformation = options.conformation || 'coil';
  if (!['coil', 'helix'].includes(conformation)) throw new RangeError('Unknown representative conformation');
  const scene = newScene(kind, scale, conformation);
  if (scale === 'atom') addAtomic(scene, options.fragments);
  else if (scale === 'granule') addGranule(scene);
  else if (kind === 'amylose' && scale === 'chain') addSingleChain(scene);
  else if (kind === 'amylopectin' && scale === 'chain') addBranchedChain(scene);
  else if (kind === 'amylose') addAmyloseAssembly(scene);
  else addAmylopectinAssembly(scene);
  return annotate(scene);
}
