import {GARLIC_DATASET_IDENTITY, getGarlicSourceSnapshot} from './garlic-reaction-source.js';
export {validateGarlicDataset} from './garlic-reaction-source.js';

export const GARLIC_REACTION_ID = 'garlic-reaction-ledger';
export const GARLIC_OPERATION_IDS = Object.freeze(['mix', 'disable-catalyst', 'cleave-alliin', 'hydrolyze-aminoacrylate', 'condense-sulfenic']);
export const GARLIC_SPECIES_IDS = Object.freeze(['alliin', 'allyl-sulfenic-acid', 'aminoacrylic-acid', 'pyruvic-acid', 'ammonia', 'allicin', 'water']);
export const GARLIC_MAX_ACTIONS = 200;
const CONDITION_KEYS = Object.freeze(['contact', 'enzymeActive', 'plpAvailable']);
const ELEMENTS = Object.freeze(['C', 'H', 'N', 'O', 'S']);

function deepFreeze(value) {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

// Read only own descriptors. Frozen ordinary arrays are allowed; custom
// prototypes, holes, accessors, symbols, extra keys and coercion are not.
function copyActions(actions) {
  if (!Array.isArray(actions) || Object.getPrototypeOf(actions) !== Array.prototype) {
    throw new TypeError('Garlic actions must be a dense ordinary array');
  }
  const length = Object.getOwnPropertyDescriptor(actions, 'length');
  if (!length || !Object.hasOwn(length, 'value') || length.enumerable || !Number.isSafeInteger(length.value) || length.value < 0) {
    throw new TypeError('Garlic actions require an ordinary array length');
  }
  if (length.value > GARLIC_MAX_ACTIONS) throw new RangeError('Garlic actions exceed the 200-step limit');
  const keys = Reflect.ownKeys(actions);
  const expected = new Set(['length', ...Array.from({length: length.value}, (_, i) => String(i))]);
  if (keys.length !== expected.size || keys.some(key => typeof key !== 'string' || !expected.has(key))) {
    throw new TypeError('Garlic actions contain holes or extra fields');
  }
  const result = [];
  for (let i = 0; i < length.value; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(actions, String(i));
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError('Garlic actions require own enumerable data items');
    }
    if (typeof descriptor.value !== 'string' || !GARLIC_OPERATION_IDS.includes(descriptor.value)) {
      throw new RangeError('Unknown garlic operation');
    }
    result.push(descriptor.value);
  }
  return result;
}

function unknownSource() {
  return deepFreeze({status: 'UNKNOWN_SOURCE', sourceIdentity: null, species: [], initial: null,
    steps: [], final: null, availability: null, sources: [], limits: []});
}

function sumElements(inventory, definitions) {
  const totals = Object.fromEntries(ELEMENTS.map(element => [element, 0]));
  for (const id of GARLIC_SPECIES_IDS) {
    for (const element of ELEMENTS) totals[element] += inventory[id] * definitions.get(id).elementCounts[element];
  }
  return totals;
}

function makeMolecule(speciesId, unitIds, definitions) {
  const structure = definitions.get(speciesId).structure;
  const ids = new Map(structure.trackedAtoms.map(atom => [atom.localId,
    unitIds.length === 2 ? atom.localId : unitIds[0] + '.' + atom.localId]));
  return {id: speciesId + '.' + unitIds.join(''), speciesId, unitIds: [...unitIds],
    trackedAtoms: structure.trackedAtoms.map(atom => ({id: ids.get(atom.localId), element: atom.element, localId: atom.localId})),
    bonds: structure.trackedBonds.map(bond => ({from: ids.get(bond.from), to: ids.get(bond.to), order: bond.order}))};
}

// Only these two fixed units exist. Their lifecycle is internal; callers never
// supply a state or molecular assignment. Water is a count, not a tracked unit.
function snapshot(context, source, definitions, expectedTotals) {
  const molecules = [];
  for (const unit of context.units) {
    if (!unit.cleaved) molecules.push(makeMolecule('alliin', [unit.id], definitions));
    else {
      if (!context.condensed) molecules.push(makeMolecule('allyl-sulfenic-acid', [unit.id], definitions));
      if (!unit.hydrolyzed) molecules.push(makeMolecule('aminoacrylic-acid', [unit.id], definitions));
      else {
        molecules.push(makeMolecule('pyruvic-acid', [unit.id], definitions));
        molecules.push(makeMolecule('ammonia', [unit.id], definitions));
      }
    }
  }
  if (context.condensed) molecules.push(makeMolecule('allicin', ['A', 'B'], definitions));
  molecules.sort((a, b) => GARLIC_SPECIES_IDS.indexOf(a.speciesId) - GARLIC_SPECIES_IDS.indexOf(b.speciesId)
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const inventory = Object.fromEntries(GARLIC_SPECIES_IDS.map(id => [id, 0]));
  for (const molecule of molecules) inventory[molecule.speciesId]++;
  inventory.water = source.initial.inventory.water - context.units.filter(unit => unit.hydrolyzed).length + Number(context.condensed);
  const atomLocations = {};
  for (const molecule of molecules) {
    for (const atom of molecule.trackedAtoms) {
      if (Object.hasOwn(atomLocations, atom.id)) throw new Error('Internal duplicated CNS identity');
      atomLocations[atom.id] = {moleculeId: molecule.id, speciesId: molecule.speciesId};
    }
  }
  const elementTotals = sumElements(inventory, definitions);
  if (Object.keys(atomLocations).length !== 16 || Object.values(inventory).some(n => !Number.isSafeInteger(n) || n < 0)
      || ELEMENTS.some(element => elementTotals[element] !== expectedTotals[element])) {
    throw new Error('Internal garlic conservation invariant failed');
  }
  return deepFreeze({inventory, conditions: {...context.conditions}, molecules, atomLocations, elementTotals});
}

function reasonsFor(operationId, state) {
  const {inventory, conditions} = state;
  switch (operationId) {
    case 'mix': return conditions.contact ? ['ALREADY_MIXED'] : [];
    case 'disable-catalyst': return conditions.enzymeActive ? [] : ['CATALYST_ALREADY_INACTIVE'];
    case 'cleave-alliin': return [
      ...(!conditions.contact ? ['CONTACT_REQUIRED'] : []),
      ...(!conditions.enzymeActive ? ['CATALYST_INACTIVE'] : []),
      ...(!conditions.plpAvailable ? ['PLP_UNAVAILABLE'] : []),
      ...(inventory.alliin < 1 ? ['ALLIIN_DEPLETED'] : []),
    ];
    case 'hydrolyze-aminoacrylate': return [
      ...(inventory['aminoacrylic-acid'] < 1 ? ['AMINOACRYLIC_ACID_REQUIRED'] : []),
      ...(inventory.water < 1 ? ['WATER_REQUIRED'] : []),
    ];
    case 'condense-sulfenic': return inventory['allyl-sulfenic-acid'] < 2 ? ['TWO_SULFENIC_ACIDS_REQUIRED'] : [];
    default: throw new Error('Internal unsupported operation');
  }
}

function availabilityFor(state, source, operations) {
  return Object.fromEntries(GARLIC_OPERATION_IDS.map(id => {
    const reasonCodes = reasonsFor(id, state);
    return [id, {enabled: reasonCodes.length === 0, reasonCodes,
      message: reasonCodes.length ? reasonCodes.map(code => source.reasonMessages[code]).join(' ') : operations.get(id).enabledMessage}];
  }));
}

function applyEnabled(context, operationId) {
  switch (operationId) {
    case 'mix': context.conditions.contact = true; break;
    case 'disable-catalyst': context.conditions.enzymeActive = false; break;
    case 'cleave-alliin': context.units.find(unit => !unit.cleaved).cleaved = true; break;
    case 'hydrolyze-aminoacrylate': context.units.find(unit => unit.cleaved && !unit.hydrolyzed).hydrolyzed = true; break;
    case 'condense-sulfenic': context.condensed = true; break;
    default: throw new Error('Internal unsupported operation');
  }
}

function affectedMolecules(before, after, changedReaction) {
  const beforeIds = before.molecules.map(molecule => molecule.id);
  const afterIds = after.molecules.map(molecule => molecule.id);
  if (!changedReaction) return {before: beforeIds, after: afterIds};
  return {before: beforeIds.filter(id => !afterIds.includes(id)), after: afterIds.filter(id => !beforeIds.includes(id))};
}

/** Replay only the five reviewed action IDs from a fixed, source-bound start.
 * Invalid action arrays throw. Invalid sources return no trusted board.
 * Legitimate unavailable attempts remain immutable blocked steps.
 */
export function evaluateGarlicSequence(actions, dataset) {
  const requested = copyActions(actions);
  const source = getGarlicSourceSnapshot(dataset);
  if (source === null) return unknownSource();
  const definitions = new Map(source.species.map(species => [species.id, species]));
  const operations = new Map(source.operations.map(operation => [operation.id, operation]));
  const expectedTotals = sumElements(source.initial.inventory, definitions);
  const context = {conditions: {...source.initial.conditions}, units: [
    {id: 'A', cleaved: false, hydrolyzed: false}, {id: 'B', cleaved: false, hydrolyzed: false},
  ], condensed: false};
  const initial = snapshot(context, source, definitions, expectedTotals);
  let current = initial;
  const steps = [];
  for (const [index, operationId] of requested.entries()) {
    const before = current;
    const operation = operations.get(operationId);
    const reasonCodes = reasonsFor(operationId, before);
    const applied = reasonCodes.length === 0;
    if (applied) applyEnabled(context, operationId);
    const after = snapshot(context, source, definitions, expectedTotals);
    const inventoryDelta = Object.fromEntries(GARLIC_SPECIES_IDS.map(id => [id, after.inventory[id] - before.inventory[id]]));
    const conditionChanges = CONDITION_KEYS.filter(key => before.conditions[key] !== after.conditions[key])
      .map(key => ({key, before: before.conditions[key], after: after.conditions[key]}));
    const changedReaction = applied && !['mix', 'disable-catalyst'].includes(operationId);
    steps.push({sequence: index + 1, operationId, status: applied ? 'applied' : 'blocked', before, after,
      inventoryDelta, conditionChanges, message: applied ? operation.appliedMessage : reasonCodes.map(code => source.reasonMessages[code]).join(' '),
      reasonCodes, evidenceRefs: operation.evidenceRefs, affectedMoleculeIds: affectedMolecules(before, after, changedReaction)});
    current = after;
  }
  return deepFreeze({status: 'SOURCE_BOUND_REPLAY', sourceIdentity: GARLIC_DATASET_IDENTITY, species: source.species,
    initial, steps, final: current, availability: availabilityFor(current, source, operations), sources: source.sources, limits: source.limits});
}
