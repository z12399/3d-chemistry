import { getVerifiedLipidCleavageData } from './lipid-cleavage-source.js';
import { inspectLipidCleavageInput, issue } from './lipid-cleavage-input.js';
export { inspectLipidCleavageInput } from './lipid-cleavage-input.js';

const clone = value => JSON.parse(JSON.stringify(value));
const variants = ['EE', 'EZ', 'unknown'];
const key = (a, b) => [a, b].sort().join('|');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
const equal = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const sameSet = (a, b) => a.length === b.length && new Set(a).size === a.length && equal([...a].sort(), [...b].sort());
const carbonH = n => n === 1 ? 0 : n <= 8 ? 2 : n <= 13 ? 1 : n <= 17 ? 2 : 3;
const valence = { C: 4, H: 1, O: 6 };
const inventory = [];
for (let c = 1; c <= 18; c++) { inventory.push({ id: `C${c}`, element: 'C', parentCarbonId: 'NOT_APPLICABLE' }); for (let h = 1; h <= carbonH(c); h++) inventory.push({ id: `H${c}_${h}`, element: 'H', parentCarbonId: `C${c}` }); }
inventory.push({ id: 'O1', element: 'O', parentCarbonId: 'NOT_APPLICABLE' }, { id: 'O9', element: 'O', parentCarbonId: 'NOT_APPLICABLE' });
const boundary = { id: 'sn2-ester-anchor', localAtomId: 'C1', externalAnchorId: 'O_PC_fixed', order: 1, fixedBlockId: 'PC_REMAINDER_FIXED' };
const rejectSource = stage => ({ ok: false, stage, status: 'rejected', issues: [issue('source-not-verified', '$', 'A verified source handle is required.')] });
function source(handle) { return getVerifiedLipidCleavageData(handle); }
function getGraph(handle, variant, state) {
  const s = source(handle); if (!s) return { ...rejectSource('source'), graph: null, sourceIdentity: null };
  if (!variants.includes(variant) || !['start', 'A', 'B'].includes(state)) return { ok: false, stage: 'source', status: 'rejected', issues: [issue('state-choice', '$', 'Unknown preset or branch.')], graph: null, sourceIdentity: clone(s.sourceIdentity) };
  return { ok: true, stage: 'source', status: 'ready', issues: [], graph: clone(s.catalogue.graphs.find(g => g.state === state && g.geometryVariant === variant)), sourceIdentity: clone(s.sourceIdentity) };
}
export const getLipidCleavageStart = (handle, variant) => getGraph(handle, variant, 'start');
export const getLipidCleavageReference = (handle, variant, branch) => getGraph(handle, variant, branch);
export function createLipidCleavageDraft(handle, variant = 'unknown') {
  const s = source(handle); if (!s) return { ...rejectSource('draft'), draft: null };
  if (!variants.includes(variant)) return { ok: false, stage: 'draft', status: 'rejected', issues: [issue('variant', '$', 'Unknown preset.')], draft: null };
  return { ok: true, stage: 'draft', status: 'ready', issues: [], draft: { schemaVersion: 'lipid-cleavage-draft/v1', initialStateRef: clone(s.catalogue.initialStates[variant]), choices: { cutBond: 'UNSELECTED', C9O9BondOrder: 'UNSELECTED', radicalAtomId: 'UNSELECTED', keepFragments: 'UNSELECTED' }, numbering: { headOriginAt1: 'UNSELECTED', tailOriginAt1: 'UNSELECTED', applied: false }, geometry: { C10_C11: 'UNSELECTED', C12_C13: 'UNSELECTED' }, virtualMarkers: [], explanation: '', evidenceClaims: [] } };
}
function identityIssues(handle, ref, graphVariant) {
  const expected = source(handle).catalogue.initialStates[ref.geometryVariant];
  const issues = [];
  if (!expected || Object.keys(expected).some(k => expected[k] !== ref[k]) || (graphVariant && graphVariant !== ref.geometryVariant)) issues.push(issue('initial-state-identity', '$.initialStateRef', 'Starting preset, digest and source pin must remain together.'));
  return issues;
}
function readDraft(handle, raw) {
  if (!source(handle)) return { ...rejectSource('source'), value: null };
  const read = inspectLipidCleavageInput(raw, 'draft'); if (!read.ok) return read;
  const issues = identityIssues(handle, read.value.initialStateRef);
  return { ...read, ok: !issues.length, issues, status: issues.length ? 'rejected' : 'valid' };
}
function counts(atoms) { const out = { C: 0, H: 0, O: 0 }; for (const atom of atoms) out[atom.element]++; return out; }
function components(graph) {
  const adjacency = new Map(graph.atoms.map(a => [a.id, []]));
  for (const b of graph.bonds) if (adjacency.has(b.a) && adjacency.has(b.b)) { adjacency.get(b.a).push(b.b); adjacency.get(b.b).push(b.a); }
  const seen = new Set(), result = [];
  for (const atom of graph.atoms) if (!seen.has(atom.id)) {
    const stack = [atom.id], ids = []; seen.add(atom.id);
    while (stack.length) { const id = stack.pop(); ids.push(id); for (const next of adjacency.get(id)) if (!seen.has(next)) { seen.add(next); stack.push(next); } }
    const atoms = graph.atoms.filter(a => ids.includes(a.id));
    const role = graph.state === 'start' ? 'chain' : ids.includes('C1') ? 'head' : 'tail';
    const radicals = atoms.filter(a => a.radicalElectrons);
    let radicalKind = 'none';
    if (radicals.length === 1) radicalKind = radicals[0].id === 'O9' ? 'alkoxyl' : radicals[0].id === 'C8' ? 'alkyl-not-acyl' : radicals[0].id === 'C10' ? 'vinylic' : 'unclassified';
    else if (radicals.length > 1) radicalKind = 'unclassified';
    result.push({ id: `${graph.state}-${role}`, role, atomIds: atoms.map(a => a.id), localAtomCounts: counts(atoms), boundaryAttachmentIds: graph.boundaryBonds.filter(b => ids.includes(b.localAtomId)).map(b => b.id), radicalKind });
  }
  return result;
}
function graphFromChoices(handle, draft) {
  // Only the given start is read here. References are never used to initialize a submission.
  const graph = getLipidCleavageStart(handle, draft.initialStateRef.geometryVariant).graph;
  const c = draft.choices;
  graph.state = c.cutBond === 'C8-C9' ? 'A' : c.cutBond === 'C9-C10' ? 'B' : 'start';
  if (c.cutBond !== 'UNSELECTED') { const cut = key(...c.cutBond.split('-')); graph.bonds = graph.bonds.filter(b => key(b.a, b.b) !== cut); }
  if (c.C9O9BondOrder !== 'UNSELECTED') graph.bonds.find(b => key(b.a, b.b) === key('C9', 'O9')).order = c.C9O9BondOrder;
  if (c.radicalAtomId !== 'UNSELECTED') for (const atom of graph.atoms) { atom.radicalElectrons = atom.id === c.radicalAtomId ? 1 : 0; atom.nonbondingElectrons = (atom.element === 'O' ? 4 : 0) + atom.radicalElectrons; }
  graph.components = components(graph);
  return graph;
}
function numberingFor(graph, draft) {
  const issues = [], mapping = { head: [], tail: [] };
  if (graph.state === 'start') return { ok: false, status: 'incomplete', issues: [issue('numbering-cut-pending', '$.choices.cutBond', 'Select a cut before choosing product numbering.')], mapping: null };
  for (const role of ['head', 'tail']) {
    const start = draft.numbering[`${role}OriginAt1`];
    if (start === 'UNSELECTED') { issues.push(issue('numbering-pending', `$.numbering.${role}OriginAt1`, 'Choose the origin carbon displayed as carbon 1.')); continue; }
    const comp = graph.components.find(c => c.role === role);
    const carbonIds = comp.atomIds.filter(id => /^C\d+$/.test(id));
    const adjacency = new Map(carbonIds.map(id => [id, []]));
    for (const b of graph.bonds) if (adjacency.has(b.a) && adjacency.has(b.b)) { adjacency.get(b.a).push(b.b); adjacency.get(b.b).push(b.a); }
    if (!adjacency.has(start) || adjacency.get(start).length !== 1) { issues.push(issue('numbering-endpoint', `$.numbering.${role}OriginAt1`, 'The selected carbon must be an endpoint in this fragment.')); continue; }
    let current = start, previous = null;
    while (current) { mapping[role].push({ originAtomId: current, componentId: comp.id, displayCarbonNumber: mapping[role].length + 1 }); const next = adjacency.get(current).find(id => id !== previous); previous = current; current = next; }
  }
  return { ok: !issues.length, status: issues.some(i => i.code === 'numbering-endpoint') ? 'rejected' : issues.length ? 'incomplete' : 'ready', issues, mapping: issues.length ? null : mapping };
}
export function previewLipidCleavageNumbering(handle, raw) {
  const read = readDraft(handle, raw); if (!read.ok) return { ...read, stage: 'numbering', status: 'rejected', mapping: null };
  return { stage: 'numbering', ...numberingFor(graphFromChoices(handle, read.value), read.value) };
}
function pending(d) {
  const fields = Object.entries(d.choices).filter(([, v]) => v === 'UNSELECTED').map(([k]) => `choices.${k}`);
  for (const [k, v] of Object.entries(d.geometry)) if (v === 'UNSELECTED') fields.push(`geometry.${k}`);
  for (const k of ['headOriginAt1', 'tailOriginAt1']) if (d.numbering[k] === 'UNSELECTED') fields.push(`numbering.${k}`);
  if (!d.numbering.applied) fields.push('numbering.applied');
  return fields;
}
export function previewLipidCleavageDraft(handle, raw) {
  const read = readDraft(handle, raw); if (!read.ok) return { ok: false, stage: 'preview', status: 'rejected', issues: read.issues, preview: null };
  const d = read.value, g = graphFromChoices(handle, d), n = numberingFor(g, d);
  // Preview keeps both contextual fragments visible; choices.keepFragments marks inclusion.
  // Only compile constructs the actually omitted, incorrect submission.
  return { ok: true, stage: 'preview', status: 'ready', issues: d.numbering.applied && !n.ok ? n.issues : [], preview: { schemaVersion: 'lipid-cleavage-partial-preview/v1', initialStateRef: clone(d.initialStateRef), choices: clone(d.choices), atoms: g.atoms, bonds: g.bonds, boundaryBonds: g.boundaryBonds, components: g.components, originToProductCarbon: d.numbering.applied && n.ok ? [...n.mapping.head, ...n.mapping.tail] : [], geometry: clone(d.geometry), virtualMarkers: clone(d.virtualMarkers), pendingFields: pending(d), isAssessment: false } };
}
export function compileLipidCleavageDraft(handle, raw) {
  const read = readDraft(handle, raw);
  if (!read.ok) return { ok: false, stage: 'compile', status: 'rejected', issues: read.issues, draft: read.value || null, graph: null, attempt: null };
  const d = read.value, missing = pending(d);
  if (missing.length) return { ok: false, stage: 'compile', status: 'incomplete', issues: missing.map(p => issue('choice-pending', `$.${p}`, 'This choice has not been made.')), draft: d, graph: null, attempt: null };
  const graph = graphFromChoices(handle, d), numbering = numberingFor(graph, d);
  if (!numbering.ok) return { ok: false, stage: 'compile', status: numbering.status, issues: numbering.issues, draft: d, graph: null, attempt: null };
  graph.numberingFrame = 'product-display-not-full-IUPAC-name'; graph.originToProductCarbon = [...numbering.mapping.head, ...numbering.mapping.tail];
  graph.stereochemistry.alkenes.forEach((alkene, i) => {
    const value = d.geometry[i === 0 ? 'C10_C11' : 'C12_C13']; alkene.value = value;
    alkene.status = value === 'NOT_ASSESSED' ? 'radical-center-not-assessed' : value === 'UNSPECIFIED' ? 'unspecified-by-exercise' : 'specified-by-exercise';
    alkene.displayLocants = alkene.originBond.map(id => graph.originToProductCarbon.find(n => n.originAtomId === id).displayCarbonNumber);
  });
  if (d.choices.C9O9BondOrder === 2) graph.stereochemistry.C9 = { value: 'NOT_APPLICABLE', status: 'center-absent-after-carbonyl' };
  if (d.choices.keepFragments !== 'both') {
    const role = d.choices.keepFragments === 'head-only' ? 'head' : 'tail';
    const ids = new Set(graph.components.find(c => c.role === role).atomIds);
    graph.atoms = graph.atoms.filter(a => ids.has(a.id)); graph.bonds = graph.bonds.filter(b => ids.has(b.a) && ids.has(b.b)); graph.boundaryBonds = graph.boundaryBonds.filter(b => ids.has(b.localAtomId));
    graph.components = components(graph); graph.originToProductCarbon = graph.originToProductCarbon.filter(n => ids.has(n.originAtomId));
  }
  graph.localAtomCounts = counts(graph.atoms); graph.localFormalCharge = graph.atoms.reduce((a, b) => a + b.formalCharge, 0); graph.unpairedElectronCount = graph.atoms.reduce((a, b) => a + b.radicalElectrons, 0);
  const attempt = { schemaVersion: 'lipid-cleavage-submission/v1', initialStateRef: clone(d.initialStateRef), choices: clone(d.choices), candidateGraph: clone(graph), explanation: d.explanation, evidenceClaims: clone(d.evidenceClaims), virtualMarkers: clone(d.virtualMarkers) };
  return { ok: true, stage: 'compile', status: 'ready', issues: [], draft: d, graph, attempt };
}

function formalGraph(graph) {
  const issues = [], add = (code, path, message) => issues.push(issue(code, path, message));
  const radical = graph.state === 'A' ? 'C8' : graph.state === 'B' ? 'C10' : 'O9';
  const atomMap = new Map(graph.atoms.map(a => [a.id, a]));
  if (!sameSet(graph.atoms.map(a => a.id), inventory.map(a => a.id))) add('atom-inventory', '$.atoms', 'Every original C, H and O must occur exactly once.');
  const sums = new Map(graph.atoms.map(a => [a.id, 0]));
  const bondMap = new Map();
  for (const b of graph.bonds) {
    const k = key(b.a, b.b); if (bondMap.has(k) || b.a === b.b || !atomMap.has(b.a) || !atomMap.has(b.b)) add('bond-endpoint', '$.bonds', 'Bonds require distinct existing endpoints and no duplicates.');
    bondMap.set(k, b.order); for (const id of [b.a, b.b]) if (sums.has(id)) sums.set(id, sums.get(id) + b.order);
  }
  for (const b of graph.boundaryBonds) if (sums.has(b.localAtomId)) sums.set(b.localAtomId, sums.get(b.localAtomId) + b.order);
  if (graph.boundaryBonds.length !== 1 || Object.entries(boundary).some(([k, v]) => graph.boundaryBonds[0]?.[k] !== v)) add('fixed-PC-boundary', '$.boundaryBonds', 'The external sn-2 ester anchor must stay fixed.');
  for (const expected of inventory) {
    const atom = atomMap.get(expected.id); if (!atom) continue;
    if (atom.originAtomId !== expected.id || atom.element !== expected.element || atom.parentCarbonId !== expected.parentCarbonId) add('origin-identity', `$.atoms.${expected.id}`, 'Origin identity, element and parent carbon are immutable.');
    const nbe = (expected.element === 'O' ? 4 : 0) + (expected.id === radical ? 1 : 0);
    if (atom.formalCharge !== 0 || atom.radicalElectrons !== +(expected.id === radical) || atom.nonbondingElectrons !== nbe || atom.implicitHydrogens !== 0) add('atom-electrons', `$.atoms.${expected.id}`, 'Charge, nonbonding electrons or radical placement differs from this finite branch.');
    const calculatedCharge = valence[atom.element] - atom.nonbondingElectrons - sums.get(atom.id);
    if (calculatedCharge !== atom.formalCharge || atom.nonbondingElectrons < atom.radicalElectrons || (atom.nonbondingElectrons - atom.radicalElectrons) % 2) add('electron-ledger', `$.atoms.${expected.id}`, 'Per-atom charge and electron bookkeeping do not balance.');
  }
  const expectedBonds = new Map();
  for (let c = 1; c < 18; c++) {
    if ((graph.state === 'A' && c === 8) || (graph.state === 'B' && c === 9)) continue;
    expectedBonds.set(key(`C${c}`, `C${c + 1}`), [10, 12].includes(c) ? 2 : 1);
  }
  expectedBonds.set(key('C1', 'O1'), 2); expectedBonds.set(key('C9', 'O9'), graph.state === 'start' ? 1 : 2);
  for (const atom of inventory.filter(a => a.element === 'H')) expectedBonds.set(key(atom.id, atom.parentCarbonId), 1);
  if (bondMap.size !== expectedBonds.size || [...expectedBonds].some(([k, v]) => bondMap.get(k) !== v)) add('finite-bond-delta', '$.bonds', 'Only the selected C-C deletion and C9-O9 carbonyl change are allowed; H bonds remain fixed.');
  if (!equal(counts(graph.atoms), graph.localAtomCounts) || !equal(graph.localAtomCounts, { C: 18, H: 30, O: 2 })) add('local-counts', '$.localAtomCounts', 'Displayed counts must equal the actual complete local inventory.');
  const charge = graph.atoms.reduce((n, a) => n + a.formalCharge, 0), radicals = graph.atoms.reduce((n, a) => n + a.radicalElectrons, 0);
  if (charge !== graph.localFormalCharge || charge !== 0 || radicals !== graph.unpairedElectronCount || radicals !== 1) add('total-ledger', '$', 'Total local charge and unpaired electron metadata must match the atoms.');
  const actual = components(graph), expectedCount = graph.state === 'start' ? 1 : 2;
  if (actual.length !== expectedCount || graph.components.length !== expectedCount) add('fragment-count', '$.components', 'Retain the required connected components.');
  for (const comp of actual) {
    const declared = graph.components.find(c => c.id === comp.id);
    if (!declared || !sameSet(declared.atomIds, comp.atomIds) || declared.role !== comp.role || !equal(declared.localAtomCounts, comp.localAtomCounts) || !sameSet(declared.boundaryAttachmentIds, comp.boundaryAttachmentIds) || declared.radicalKind !== comp.radicalKind) add('component-metadata', '$.components', 'Fragment metadata must agree with connectivity and the atom ledger.');
  }
  if (new Set(graph.components.map(c => c.id)).size !== graph.components.length) add('component-identity', '$.components', 'Fragment IDs must be unique.');
  const mapping = new Map(graph.originToProductCarbon.map(n => [n.originAtomId, n]));
  if (mapping.size !== 18 || graph.originToProductCarbon.length !== 18) add('numbering-inventory', '$.originToProductCarbon', 'Every original carbon needs one separate display number.');
  const split = graph.state === 'A' ? 8 : 9;
  for (let c = 1; c <= 18; c++) {
    const n = mapping.get(`C${c}`), role = graph.state === 'start' ? 'chain' : c <= split ? 'head' : 'tail';
    const expectedNumber = role === 'tail' ? c - split : c;
    if (!n || n.componentId !== `${graph.state}-${role}` || n.displayCarbonNumber !== expectedNumber) add('product-numbering', `$.originToProductCarbon.C${c}`, 'Product display numbers do not match the preserved original carbon path.');
  }
  if (graph.numberingFrame !== (graph.state === 'start' ? 'source-chain' : 'product-display-not-full-IUPAC-name')) add('numbering-frame', '$.numberingFrame', 'The numbering frame must distinguish origin and product display.');
  const teaching = graph.geometryVariant === 'unknown' ? ['UNSPECIFIED', 'UNSPECIFIED'] : ['E', graph.geometryVariant === 'EZ' ? 'Z' : 'E'];
  const stereoKeys = [];
  for (let i = 0; i < 2; i++) {
    const origin = i === 0 ? ['C10', 'C11'] : ['C12', 'C13'];
    const alkene = graph.stereochemistry.alkenes.find(a => sameSet(a.originBond, origin));
    const value = graph.state === 'B' && i === 0 ? 'NOT_ASSESSED' : teaching[i];
    const status = value === 'NOT_ASSESSED' ? 'radical-center-not-assessed' : value === 'UNSPECIFIED' ? 'unspecified-by-exercise' : 'specified-by-exercise';
    const locants = origin.map(id => +id.slice(1) - (graph.state === 'start' ? 0 : split));
    if (!alkene || alkene.originalTeachingGeometry !== teaching[i] || alkene.value !== value || alkene.status !== status || !equal(alkene.displayLocants, locants)) add('alkene-geometry', `$.stereochemistry.alkenes[${i}]`, 'Preserve the teaching geometry and mapped locants; the B radical alkene is not assessed as ordinary E/Z.');
    if (alkene) stereoKeys.push(key(...alkene.originBond));
  }
  if (new Set(stereoKeys).size !== 2) add('alkene-identity', '$.stereochemistry.alkenes', 'The two original alkene bonds must each occur once.');
  const center = graph.state === 'start' ? { value: 'UNSPECIFIED', status: 'unspecified-by-exercise' } : { value: 'NOT_APPLICABLE', status: 'center-absent-after-carbonyl' };
  if (!equal(graph.stereochemistry.C9, center)) add('C9-center', '$.stereochemistry.C9', 'The C9 tetrahedral center disappears after carbonyl formation.');
  return { issues, actual };
}
function rejectedAssessment(stage, issues) { return { ok: false, stage, status: 'rejected', issues, formal: { status: 'not-assessed', issues: [] }, evidence: { status: 'not-assessed-input', issues: [] }, graph: null }; }
function evidenceFor(graph, claims, formalPass) {
  if (!formalPass) return { status: 'not-assessed-until-formal-pass', issues: [] };
  const allowed = ['accounting-does-not-prove-feasibility', '1976-GC-does-not-uniquely-identify-9-OOH', ...(graph.state === 'A' ? ['A-source-proposed-small-branch'] : graph.state === 'B' ? ['B-source-disfavored'] : [])];
  const issues = claims.filter(c => !allowed.includes(c)).map(c => issue('unsupported-source-claim', '$.evidenceClaims', `The current evidence does not support: ${c}`));
  return { status: issues.length ? 'unsupported-claim' : 'limited-source-interpretation', issues, interpretation: graph.state === 'A' ? 'author-proposed-small-branch' : graph.state === 'B' ? 'author-describes-as-unfavorable' : 'given-starting-state', exactGeometryEvidence: { value: 'UNKNOWN', status: 'not-established-by-current-source-review' }, locators: graph.state === 'start' ? ['P2016-IDENTITY'] : ['P2016-SCHEME2', 'P2016-BRANCH-TEXT'], excluded: ['branch probabilities', 'food pathway dominance', 'combined PC/GC yields', 'whole molecule mass', 'time trajectory'], explanationAssessment: 'not-assessed-free-text' };
}
function assess(handle, graph, attempt) {
  const formal = formalGraph(graph), issues = formal.issues;
  let markers = { status: 'not-answered', checked: 0, unanswered: 0 };
  if (attempt) {
    if (graph.state === 'start') issues.push(issue('submission-requires-products', '$.candidateGraph.state', 'A cleavage submission must contain a product candidate; the given starting state is not a completed attempt.'));
    issues.push(...identityIssues(handle, attempt.initialStateRef, graph.geometryVariant));
    const c = attempt.choices, expectedCut = graph.state === 'A' ? 'C8-C9' : graph.state === 'B' ? 'C9-C10' : 'UNSELECTED';
    if (c.cutBond !== expectedCut || c.C9O9BondOrder !== (graph.state === 'start' ? 1 : 2) || c.radicalAtomId !== (graph.state === 'A' ? 'C8' : graph.state === 'B' ? 'C10' : 'O9') || ('keepFragments' in c && c.keepFragments !== 'both')) issues.push(issue('choices-disagree', '$.choices', 'Recorded choices must agree with the finite product graph.'));
    const seen = new Set(); let wrong = false;
    for (const m of attempt.virtualMarkers) {
      if (seen.has(m.atomId)) { issues.push(issue('marker-duplicate', '$.virtualMarkers', 'A virtual label atom may occur only once.')); wrong = true; }
      seen.add(m.atomId);
      if (m.predictedFragment === 'UNSELECTED') { markers.unanswered++; continue; }
      const actual = formal.actual.find(c => c.atomIds.includes(m.atomId)); markers.checked++;
      const matches = attempt.schemaVersion === 'lipid-cleavage-attempt/v1' ? actual?.id === m.predictedComponentId : actual?.role === m.predictedFragment;
      if (!matches) { issues.push(issue('marker-fragment', '$.virtualMarkers', 'The predicted virtual-label destination differs from connectivity.')); wrong = true; }
    }
    markers.status = wrong ? 'reject' : markers.unanswered || !markers.checked ? 'not-answered' : 'pass';
  }
  return { ok: true, stage: 'assessment', status: 'evaluated', issues: [], formal: { status: issues.length ? 'reject' : 'pass', issues }, evidence: evidenceFor(graph, attempt?.evidenceClaims || [], !issues.length), markers, graph: clone(graph), sourceIdentity: clone(source(handle).sourceIdentity) };
}
export function evaluateLipidCleavageGraph(handle, raw) {
  if (!source(handle)) return rejectedAssessment('source', rejectSource('source').issues);
  const read = inspectLipidCleavageInput(raw, 'graph'); if (!read.ok) return rejectedAssessment('shape', read.issues);
  return assess(handle, read.value);
}
export function evaluateLipidCleavageAttempt(handle, raw) {
  if (!source(handle)) return rejectedAssessment('source', rejectSource('source').issues);
  const read = inspectLipidCleavageInput(raw, 'attempt'); if (!read.ok) return rejectedAssessment('shape', read.issues);
  return assess(handle, read.value.candidateGraph, read.value);
}
