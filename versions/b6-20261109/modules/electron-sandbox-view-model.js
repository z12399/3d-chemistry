// Pure presentation helpers for complete, explicit-atom graphs. A formula is
// only an atom/charge summary: it does not identify a structure or a reaction.
function indexGraph(graph) {
  if (graph == null) return {atoms:[], byId:new Map(), neighbors:new Map()};
  if (!Array.isArray(graph.atoms) || !Array.isArray(graph.bonds)) {
    throw new TypeError('A graph must provide atoms and bonds arrays.');
  }
  const byId = new Map(), neighbors = new Map();
  for (const atom of graph.atoms) {
    if (!atom || typeof atom.id !== 'string' || !atom.id || byId.has(atom.id)) {
      throw new TypeError('Each atom needs a unique, nonempty string ID.');
    }
    byId.set(atom.id, atom);
    neighbors.set(atom.id, new Set());
  }
  for (const bond of graph.bonds) {
    if (!bond || !byId.has(bond.a) || !byId.has(bond.b) || bond.a === bond.b) {
      throw new TypeError('A bond must join two distinct atoms in the graph.');
    }
    neighbors.get(bond.a).add(bond.b);
    neighbors.get(bond.b).add(bond.a);
  }
  return {atoms:graph.atoms, byId, neighbors};
}

function componentsOf({atoms, neighbors}) {
  const visited = new Set(), components = [];
  for (const atom of atoms) {
    if (visited.has(atom.id)) continue;
    const component = new Set([atom.id]), queue = [atom.id];
    visited.add(atom.id);
    for (let i = 0; i < queue.length; i++) {
      for (const next of neighbors.get(queue[i])) {
        if (visited.has(next)) continue;
        visited.add(next); component.add(next); queue.push(next);
      }
    }
    // Both the component list and its IDs follow original atom order, not
    // traversal order or the order in which bonds were supplied.
    components.push(atoms.filter(a => component.has(a.id)).map(a => a.id));
  }
  return components;
}

export function graphComponents(graph) {
  return componentsOf(indexGraph(graph));
}

export function mainMoleculeIds(graph) {
  const indexed = indexGraph(graph);
  let best = [], mostHeavy = -1;
  for (const ids of componentsOf(indexed)) {
    const heavy = ids.filter(id => indexed.byId.get(id).element !== 'H').length;
    // A heavy-atom tie prefers more explicit atoms; a full tie keeps the first
    // component. This is a layout rule, not a prediction of chemical relevance.
    if (heavy > mostHeavy || (heavy === mostHeavy && ids.length > best.length)) {
      best = ids; mostHeavy = heavy;
    }
  }
  return best;
}

export function focusNeighborhood(graph, seeds, hops = 2) {
  if (!Array.isArray(seeds)) throw new TypeError('Focus seeds must be an array of atom IDs.');
  if (!Number.isSafeInteger(hops) || hops < 0) throw new RangeError('Focus hops must be a nonnegative integer.');
  const {atoms, byId, neighbors} = indexGraph(graph);
  const included = new Set(seeds.filter(id => byId.has(id)));
  let frontier = [...included];
  for (let depth = 0; depth < hops && frontier.length; depth++) {
    const next = [];
    for (const id of frontier) for (const adjacent of neighbors.get(id)) {
      if (!included.has(adjacent)) { included.add(adjacent); next.push(adjacent); }
    }
    frontier = next;
  }
  // Retain explicit H and all selected components. Visibility, camera fitting,
  // and the caller's selected/highlighted IDs remain separate concerns.
  return atoms.filter(atom => included.has(atom.id)).map(atom => atom.id);
}

const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function chargeSuffix(charge) {
  if (!charge) return '';
  const magnitude = Math.abs(charge);
  return (magnitude === 1 ? '' : String(magnitude).split('').map(n => superscripts[Number(n)]).join('')) + (charge > 0 ? '⁺' : '⁻');
}

function componentFormula(ids, byId) {
  const counts = new Map();
  let totalCharge = 0;
  for (const id of ids) {
    const atom = byId.get(id), charge = atom.formalCharge ?? atom.charge ?? 0;
    if (typeof atom.element !== 'string' || !/^[A-Z][a-z]?$/.test(atom.element)) {
      throw new TypeError('Formula atoms need element symbols.');
    }
    if (!Number.isSafeInteger(charge) || !Number.isSafeInteger(totalCharge + charge)) {
      throw new TypeError('Formula charges must sum to a safe integer.');
    }
    counts.set(atom.element, (counts.get(atom.element) || 0) + 1);
    totalCharge += charge;
  }
  const alphabetical = [...counts.keys()].sort();
  const order = counts.has('C')
    ? ['C', ...(counts.has('H') ? ['H'] : []), ...alphabetical.filter(e => e !== 'C' && e !== 'H')]
    : alphabetical;
  return order.map(element => element + (counts.get(element) === 1 ? '' : counts.get(element))).join('') + chargeSuffix(totalCharge);
}

function equationSide(graph) {
  const indexed = indexGraph(graph);
  return componentsOf(indexed).map(ids => componentFormula(ids, indexed.byId)).join(' + ');
}

export function componentEquation(before, after) {
  const left = equationSide(before), right = equationSide(after);
  if (!right) return left;
  if (!left) return right;
  return `${left} → ${right}`;
}
