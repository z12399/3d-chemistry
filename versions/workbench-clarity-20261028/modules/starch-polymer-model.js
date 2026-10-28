/** All-atom growth views: stable coordinates, explicit chemically terminated prefixes. */
export const STARCH_POLYMER_MAX_COUNT = 192;
export const STARCH_POLYMER_KINDS = Object.freeze(['amylose', 'amylopectin']);
const clone = value => JSON.parse(JSON.stringify(value));
const labels = {amylose: '直鏈澱粉', amylopectin: '支鏈澱粉'};

function validateAtomicPrefix(atoms, bonds, count) {
  const byId = new Map(), degrees = new Map(), bondIds = new Set(), pairs = new Set();
  for (const atom of atoms) {
    if (typeof atom.id !== 'string' || !atom.id || byId.has(atom.id) || !['C', 'O', 'H'].includes(atom.element)
      || !Array.isArray(atom.position) || atom.position.length !== 3 || !atom.position.every(value => typeof value === 'number' && Number.isFinite(value))
      || atom.formalCharge !== 0 || !Number.isSafeInteger(atom.residueIndex) || atom.residueIndex < 1 || atom.residueIndex > count
      || atom.residueId !== `g${atom.residueIndex}`) throw new TypeError('Invalid polymer atom or coordinate');
    byId.set(atom.id, atom); degrees.set(atom.id, 0);
  }
  for (const bond of bonds) {
    const a = byId.get(bond.a), b = byId.get(bond.b);
    const pair = [bond.a, bond.b].sort().join('|');
    if (!a || !b || a.id === b.id || bond.order !== 1 || typeof bond.id !== 'string' || bondIds.has(bond.id) || pairs.has(pair)) throw new TypeError('Invalid polymer bond');
    const length = Math.hypot(...a.position.map((value, i) => value - b.position[i]));
    if (length <= .75 || length >= 2.1) throw new TypeError('Invalid polymer bond length');
    bondIds.add(bond.id); pairs.add(pair);
    degrees.set(a.id, degrees.get(a.id) + 1); degrees.set(b.id, degrees.get(b.id) + 1);
  }
  if (atoms.some(atom => degrees.get(atom.id) !== {C: 4, O: 2, H: 1}[atom.element])) throw new TypeError('Invalid terminated polymer valence');
}

export function buildStarchPolymer(kind, count, options = {}) {
  if (!STARCH_POLYMER_KINDS.includes(kind)) throw new RangeError('Unknown starch polymer kind');
  if (options == null || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Polymer options must be an object');
  const data = options.fragments;
  if (!data || !Array.isArray(data.molecules)) throw new TypeError('All-atom starch polymer data is required');
  const master = data.molecules.find(molecule => molecule.kind === kind);
  if (!master || !Array.isArray(master.atoms) || !Array.isArray(master.bonds) || !Array.isArray(master.terminalHydrogens)) throw new TypeError('Missing starch polymer master');
  const maximum = Math.min(STARCH_POLYMER_MAX_COUNT, master.maxCount, data.maxCount);
  if (!Number.isSafeInteger(count) || count < 1 || count > maximum) throw new RangeError(`Residue count must be an integer from 1 to ${maximum}`);
  if (options.geometry && options.geometry !== 'coil') throw new RangeError('Only the verified geometric assembly is available');
  const atoms = master.atoms.filter(atom => atom.residueIndex <= count).map(clone);
  const ids = new Set(atoms.map(atom => atom.id));
  const bonds = master.bonds.filter(bond => ids.has(bond.a) && ids.has(bond.b)).map(clone);
  for (const terminal of master.terminalHydrogens) {
    if (terminal.atom.residueIndex <= count && count < terminal.removedWhenResidue) {
      atoms.push(clone(terminal.atom)); bonds.push(clone(terminal.bond));
      ids.add(terminal.atom.id);
    }
  }
  validateAtomicPrefix(atoms, bonds, count);
  const residues = master.residues.slice(0, count).map(clone);
  const links = master.links.filter(link => link.donorIndex <= count).map(clone);
  const branches = links.filter(link => link.acceptorCarbon === 6);
  const donorIds = new Set(links.map(link => link.donor));
  const acceptorIds = new Set(links.map(link => link.acceptor));
  const atomById = new Map(atoms.map(atom => [atom.id, atom]));
  const residueById = new Map(residues.map(residue => [residue.id, residue]));
  const highlight = branches.length ? branches.slice(0, 1) : links.slice(0, 1);
  const highlightAtoms = new Set(highlight.flatMap(link => [link.donorC1, link.bridgeO, link.acceptorAtom]));
  const highlightBonds = bonds.filter(bond => highlightAtoms.has(bond.a) && highlightAtoms.has(bond.b));
  const markers = branches.map(link => ({id: `${link.id}:branch`, kind, role: 'branch', position: [...atomById.get(link.bridgeO).position],
    label: 'α(1→6) 分枝接點', residueId: link.acceptor, atomIds: [link.donorC1, link.bridgeO, link.acceptorAtom]}));
  for (const residue of residues) {
    if (!donorIds.has(residue.id)) markers.push({id: `${residue.id}:reducing-end`, kind, role: 'reducing-end',
      position: [...atomById.get(residue.positions.C1).position], label: '還原端', residueId: residue.id, atomIds: [residue.positions.C1, residue.positions.O1]});
    if (count > 1 && !acceptorIds.has(residue.id)) markers.push({id: `${residue.id}:nonreducing-end`, kind, role: 'nonreducing-end',
      position: [...atomById.get(residue.positions.O4).position], label: '非還原端', residueId: residue.id, atomIds: [residue.positions.C4, residue.positions.O4]});
  }
  // Marker names describe topological ends; a one-sugar molecule has one
  // reducing end and no glycosidic chain yet, although it is also a tree leaf.
  const formula = `C${count * 6}H${count * 10 + 2}O${count * 5 + 1}`;
  const validation = data.validation?.checks?.[kind]?.find(check => check.count === count);
  const model = {kind, scale: 'polymer', count, geometry: 'coil', title: labels[kind],
    subtitle: `${count} 個葡萄糖基 · 全原子片段`,
    description: kind === 'amylose'
      ? '同一套原子與鍵持續保留；增加葡萄糖基後，拉遠看整段無分枝鏈如何在空間中延伸。'
      : count < 5 ? '前四個單元先呈現主鏈；增加到第五個葡萄糖基，α(1→6) 側鏈接點開始出現。'
        : '每一條側鏈都經 α(1→6) 接點連回同一分子；拉遠時仍保留每個糖環的原子與共價鍵。',
    atomic: {id: `${kind}-polymer-${count}`, atoms, bonds, residues, links, formula,
      highlightAtomIds: [...highlightAtoms], highlightBondIds: highlightBonds.map(bond => bond.id),
      highlightBonds: highlightBonds.map(({a, b}) => ({a, b})), validation: validation ? clone(validation) : {status: 'unknown'}},
    residues: residues.map(residue => ({...residue, kind, moleculeId: `${kind}-one`,
      position: [...atomById.get(residue.positions.C1).position]})), links, markers, curves: [], surfaces: [],
    statistics: {residueCount: count, totalResidueCount: count, contextResidueCount: 0, moleculeCount: 1,
      atomCount: atoms.length, heavyAtomCount: atoms.filter(atom => atom.element !== 'H').length,
      bondCount: bonds.length, formula, alpha1To4Count: links.length - branches.length, alpha1To6Count: branches.length,
      reducingEndCount: residues.filter(residue => !donorIds.has(residue.id)).length,
      nonreducingEndCount: count === 1 ? 0 : residues.filter(residue => !acceptorIds.has(residue.id)).length,
      countScope: 'displayed full-atom fragment only; not a measured natural DP'},
    metadata: {...clone(master.metadata), coordinateUnit: 'angstrom', notToScale: false,
      representation: 'complete atom-and-bond alpha-D-glucan fragment, geometric teaching assembly',
      maxCount: maximum, stablePrefixCoordinates: true, terminalValencesRestored: true,
      firstBranchVisibleAtCount: kind === 'amylopectin' ? 5 : null,
      atomicValidationStatus: data.validation?.status || 'unknown',
      geometricAssembly: true, fullPolymerEnergyMinimized: false, isMeasuredConformation: false, isTrajectory: false,
      isNaturalWholeMolecule: false, countChangeIsChemicalReaction: false, spatialScaleConversion: false},
    notes: ['每個球都代表原子，線段都代表化學鍵；拉遠與增加糖基不會改成顆粒或抽象鏈條。',
      '全原子幾何示意：糖環保留 α-D 立體配置，接點保留 α(1→4)／α(1→6)。各單元由剛體模板連接，沒有做全分子能量最小化。',
      '增加單元是在顯示更長的代表片段，沒有演示聚合反應、熱運動或真正的構象轉換。天然鏈長、分枝比例與溶液形狀可能不同。']};
  // Fail on incomplete data instead of drawing a disconnected pseudo-polymer.
  if (atoms.length !== count * 21 + 3 || bonds.length !== atoms.length + count - 1 || ids.size !== atoms.length
    || bonds.some(bond => !ids.has(bond.a) || !ids.has(bond.b)) || residues.length !== count
    || !residueById.has('g1')) throw new TypeError('Incomplete terminated polymer prefix');
  return model;
}
