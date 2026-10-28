/** Finite, acyclic glucose-residue connectivity. Coordinates and enzyme rules are not part of this model. */
export const STARCH_STRUCTURE_ID = 'starch-structure-lab';

const bond = (donor, acceptor, acceptorCarbon = 4) => Object.freeze({
  id: `${donor}-${acceptor}`, donor, acceptor, donorCarbon: 1, acceptorCarbon,
  linkage: `α(1→${acceptorCarbon})`
});
const topology = (id, label, residues, bonds) => Object.freeze({
  id, label, residues: Object.freeze(residues), bonds: Object.freeze(bonds)
});
const main = Array.from({length: 6}, (_, i) => `n${i + 1}`);
export const STARCH_TOPOLOGIES = Object.freeze({
  linear9: topology('linear9', '直鏈片段', Array.from({length: 9}, (_, i) => `n${i + 1}`),
    Array.from({length: 8}, (_, i) => bond(`n${i + 2}`, `n${i + 1}`))),
  branched9: topology('branched9', '支鏈片段', [...main, 'b1', 'b2', 'b3'], [
    ...Array.from({length: 5}, (_, i) => bond(`n${i + 2}`, `n${i + 1}`)),
    bond('b1', 'n3', 6), bond('b2', 'b1'), bond('b3', 'b2')
  ])
});

function validate(topologyId, cutIds) {
  if (!Object.hasOwn(STARCH_TOPOLOGIES, topologyId)) throw new RangeError('Unknown starch topology');
  const graph = STARCH_TOPOLOGIES[topologyId];
  if (!Array.isArray(cutIds)) throw new TypeError('Cuts must be an array of bond IDs');
  const allowed = new Set(graph.bonds.map(item => item.id));
  if (cutIds.length > graph.bonds.length || cutIds.some(id => !allowed.has(id))) throw new RangeError('Unknown starch bond');
  if (new Set(cutIds).size !== cutIds.length) throw new RangeError('A bond can be hydrolyzed only once');
  return graph;
}

/** Formula of an unmodified, neutral acyclic glucan fragment with one reducing end. */
export function glucanFormula(dp) {
  if (!Number.isSafeInteger(dp) || dp < 1 || dp > 9) throw new RangeError('DP must be an integer from 1 to 9');
  return {C: 6 * dp, H: 10 * dp + 2, O: 5 * dp + 1};
}
export function starchFormulaText(atoms) {
  return ['C', 'H', 'O'].map(element => element + (atoms[element] === 1 ? '' : atoms[element])).join('');
}

/** Components follow original residue order; IDs are retained after every cut. */
export function starchFragments(topologyId, cutIds = []) {
  const graph = validate(topologyId, cutIds), removed = new Set(cutIds);
  const neighbors = new Map(graph.residues.map(id => [id, []]));
  for (const edge of graph.bonds) if (!removed.has(edge.id)) {
    neighbors.get(edge.donor).push(edge.acceptor);
    neighbors.get(edge.acceptor).push(edge.donor);
  }
  const seen = new Set(), fragments = [];
  for (const start of graph.residues) {
    if (seen.has(start)) continue;
    const stack = [start], component = new Set();
    while (stack.length) {
      const id = stack.pop();
      if (seen.has(id)) continue;
      seen.add(id); component.add(id);
      for (const neighbor of neighbors.get(id)) if (!seen.has(neighbor)) stack.push(neighbor);
    }
    const residueIds = graph.residues.filter(id => component.has(id));
    const outgoing = new Set(graph.bonds.filter(edge => !removed.has(edge.id) && component.has(edge.donor)).map(edge => edge.donor));
    fragments.push({residueIds, dp: residueIds.length, atoms: glucanFormula(residueIds.length),
      reducingEnd: residueIds.find(id => !outgoing.has(id))});
  }
  return fragments;
}

/** Cumulative bookkeeping from the intact nine-residue fragment, not a kinetic pathway. */
export function starchHydrolysis(topologyId, cutIds = []) {
  const graph = validate(topologyId, cutIds), fragments = starchFragments(topologyId, cutIds);
  const substrate = glucanFormula(graph.residues.length), waterCount = cutIds.length;
  const reactants = {...substrate, H: substrate.H + 2 * waterCount, O: substrate.O + waterCount};
  const products = fragments.reduce((sum, fragment) => ({C: sum.C + fragment.atoms.C, H: sum.H + fragment.atoms.H, O: sum.O + fragment.atoms.O}), {C: 0, H: 0, O: 0});
  const grouped = new Map();
  for (const fragment of fragments) {
    const formula = starchFormulaText(fragment.atoms);
    grouped.set(formula, (grouped.get(formula) || 0) + 1);
  }
  const productText = [...grouped].map(([formula, count]) => `${count > 1 ? count + ' ' : ''}${formula}`).join(' + ');
  const equation = waterCount ? `${starchFormulaText(substrate)} + ${waterCount > 1 ? waterCount + ' ' : ''}H2O → ${productText}` : starchFormulaText(substrate);
  return {topologyId, cutIds: [...cutIds], fragments, waterCount, substrate, reactants, products,
    balanced: ['C', 'H', 'O'].every(element => reactants[element] === products[element]), equation};
}

export function createStarchState(topologyId = 'branched9') {
  validate(topologyId, []);
  return {topologyId, cutIds: []};
}
export function cutStarchBond(state, bondId) {
  validate(state.topologyId, state.cutIds);
  const cutIds = [...state.cutIds, bondId];
  validate(state.topologyId, cutIds);
  return {topologyId: state.topologyId, cutIds};
}
export function undoStarchCut(state) {
  validate(state.topologyId, state.cutIds);
  return {topologyId: state.topologyId, cutIds: state.cutIds.slice(0, -1)};
}
export function resetStarchCuts(state) {
  return createStarchState(state.topologyId);
}
