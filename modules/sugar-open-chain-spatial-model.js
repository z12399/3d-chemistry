import { sugarState } from './sugar-chair-model.js';

/** Fixed illustrative open-chain conformer with explicit atoms.
 * The planar zigzag backbone is NOT a full-molecule Fischer projection.
 * Each C2–C5 has its own proper camera orientation: two backbone bonds recede,
 * the two horizontal substituents approach, C(n−1) is above, C(n+1) below.
 */
export const SUGAR_OPEN_CHAIN_SPATIAL_GEOMETRY = Object.freeze({
  carbonCarbon: 1.54, carbonOxygen: 1.43, carbonylCarbonOxygen: 1.23,
  carbonHydrogen: 1.09, oxygenHydrogen: 0.97, hydroxylAngleDegrees: 108.5,
});

const add = (a, b) => a.map((value, index) => value + b[index]);
const sub = (a, b) => a.map((value, index) => value - b[index]);
const mul = (vector, scalar) => vector.map(value => value * scalar);
const dot = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = vector => {
  const length = Math.hypot(...vector);
  if (length < 1e-12) throw new RangeError('Degenerate open-chain geometry vector');
  return mul(vector, 1 / length);
};
const freezeVector = vector => Object.freeze([...vector]);
const rotateXY = (vector, angle) => [vector[0] * Math.cos(angle) - vector[1] * Math.sin(angle), vector[0] * Math.sin(angle) + vector[1] * Math.cos(angle), vector[2]];
const hydroxylDirection = (carbonToOxygen, tangent) => {
  const angle = SUGAR_OPEN_CHAIN_SPATIAL_GEOMETRY.hydroxylAngleDegrees * Math.PI / 180;
  return add(mul(carbonToOxygen, -Math.cos(angle)), mul(tangent, Math.sin(angle)));
};

function localFischerView(atoms, carbon, fischerSide) {
  const target = atoms.get(`C${carbon}`).position;
  const previous = unit(sub(atoms.get(`C${carbon - 1}`).position, target));
  const next = unit(sub(atoms.get(`C${carbon + 1}`).position, target));
  const towardObserver = unit(mul(add(previous, next), -1));
  const up = unit(sub(previous, next));
  const right = unit(cross(up, towardObserver));
  return Object.freeze({ kind: 'local-fischer', carbon, position: freezeVector(add(target, mul(towardObserver, 12))),
    target: freezeVector(target), up: freezeVector(up), right: freezeVector(right), towardObserver: freezeVector(towardObserver),
    frustumHeight: 4, distance: 12,
    focusAtoms: Object.freeze([`C${carbon}`, `C${carbon - 1}`, `C${carbon + 1}`, `O${carbon}`, `H${carbon}`]),
    labels: Object.freeze({ upperAtom: `C${carbon - 1}`, lowerAtom: `C${carbon + 1}`,
      leftAtom: fischerSide === 'left' ? `O${carbon}` : `H${carbon}`,
      rightAtom: fischerSide === 'right' ? `O${carbon}` : `H${carbon}` }),
    scope: 'one stereocentre; horizontal bonds approach and vertical bonds recede',
  });
}

export function sugarOpenChainMolecule(input = sugarState()) {
  const state = sugarState(input), geometry = SUGAR_OPEN_CHAIN_SPATIAL_GEOMETRY;
  const atoms = [], bonds = [];
  const atom = (id, element, position, properties) => {
    atoms.push(Object.freeze({ id, element, position: freezeVector(position), label: id, ...properties }));
  };
  const bond = (a, b, order = 1) => bonds.push(Object.freeze({ a, b, order }));
  const chain = Array.from({ length: 6 }, (_, index) => [
    (index % 2 === 0 ? -1 : 1) * geometry.carbonCarbon / (2 * Math.sqrt(3)),
    (2.5 - index) * geometry.carbonCarbon * Math.sqrt(2 / 3), 0,
  ]);
  for (let carbon = 1; carbon <= 6; carbon++) {
    atom(`C${carbon}`, 'C', chain[carbon - 1], { carbon, selectorCarbon: Math.min(carbon, 5),
      role: carbon === 1 ? 'aldehyde-carbon' : carbon === 6 ? 'hydroxymethyl-carbon' : 'chain-carbon',
      ...(carbon >= 2 && carbon <= 5 ? { fischerSide: state.rows[carbon - 1].fischer } : {}),
    });
    if (carbon > 1) bond(`C${carbon - 1}`, `C${carbon}`);
  }

  // Trigonal planar C1: the C=O and C–H directions each make 120° with C1–C2.
  const c1Forward = unit(sub(chain[1], chain[0]));
  atom('O1', 'O', add(chain[0], mul(rotateXY(c1Forward, 2 * Math.PI / 3), geometry.carbonylCarbonOxygen)), {
    carbon: 1, selectorCarbon: 1, role: 'carbonyl-oxygen',
  });
  atom('H1', 'H', add(chain[0], mul(rotateXY(c1Forward, 4 * Math.PI / 3), geometry.carbonHydrogen)), {
    carbon: 1, selectorCarbon: 1, role: 'aldehyde-hydrogen',
  });
  bond('C1', 'O1', 2); bond('C1', 'H1');

  for (let carbon = 2; carbon <= 5; carbon++) {
    const origin = chain[carbon - 1], previous = unit(sub(chain[carbon - 2], origin)), next = unit(sub(chain[carbon], origin));
    const eye = unit(mul(add(previous, next), -1)), up = unit(sub(previous, next)), right = unit(cross(up, eye));
    const fischerSide = state.rows[carbon - 1].fischer, sideSign = fischerSide === 'right' ? 1 : -1;
    // Two remaining ideal tetrahedral directions. Both approach the local
    // camera; only their screen-horizontal component changes for D/L.
    const oxygenDirection = add(mul(eye, 1 / Math.sqrt(3)), mul(right, sideSign * Math.sqrt(2 / 3)));
    const hydrogenDirection = add(mul(eye, 1 / Math.sqrt(3)), mul(right, -sideSign * Math.sqrt(2 / 3)));
    const oxygen = add(origin, mul(oxygenDirection, geometry.carbonOxygen));
    const shared = { carbon, selectorCarbon: carbon };
    atom(`O${carbon}`, 'O', oxygen, { ...shared, role: 'hydroxyl-oxygen', fischerSide });
    atom(`H${carbon}`, 'H', add(origin, mul(hydrogenDirection, geometry.carbonHydrogen)), { ...shared, role: 'chain-carbon-hydrogen' });
    const tangent = unit(sub(eye, mul(oxygenDirection, dot(eye, oxygenDirection))));
    atom(`H-O${carbon}`, 'H', add(oxygen, mul(hydroxylDirection(oxygenDirection, tangent), geometry.oxygenHydrogen)), {
      ...shared, role: 'hydroxyl-hydrogen', parentAtom: `O${carbon}`,
    });
    bond(`C${carbon}`, `O${carbon}`); bond(`C${carbon}`, `H${carbon}`); bond(`O${carbon}`, `H-O${carbon}`);
  }

  // One fixed terminal CH2OH rotamer; C6 is not a stereocentre.
  const c6Forward = unit(sub(chain[5], chain[4]));
  const c6Tangent = [Math.sqrt(2 / 3), 1 / Math.sqrt(3), 0];
  const c6Bitangent = mul(unit(cross(c6Forward, c6Tangent)), state.series === 'D' ? 1 : -1);
  const c6Directions = [0, 2 * Math.PI / 3, 4 * Math.PI / 3].map(angle => add(mul(c6Forward, 1 / 3),
    mul(add(mul(c6Tangent, Math.cos(angle)), mul(c6Bitangent, Math.sin(angle))), Math.sqrt(8) / 3)));
  const terminal = { carbon: 6, selectorCarbon: 5 };
  const oxygen6 = add(chain[5], mul(c6Directions[0], geometry.carbonOxygen));
  atom('O6', 'O', oxygen6, { ...terminal, role: 'hydroxymethyl-oxygen' });
  bond('C6', 'O6');
  for (const [index, id] of ['H6a', 'H6b'].entries()) {
    atom(id, 'H', add(chain[5], mul(c6Directions[index + 1], geometry.carbonHydrogen)), { ...terminal, role: 'hydroxymethyl-carbon-hydrogen', parentAtom: 'C6' });
    bond('C6', id);
  }
  const o6Tangent = unit(sub([1, 0, 0], mul(c6Directions[0], c6Directions[0][0])));
  atom('HO6', 'H', add(oxygen6, mul(hydroxylDirection(c6Directions[0], o6Tangent), geometry.oxygenHydrogen)), {
    ...terminal, role: 'hydroxymethyl-hydrogen', parentAtom: 'O6',
  });
  bond('O6', 'HO6');

  const indexed = new Map(atoms.map(item => [item.id, item]));
  const localFischerViews = Object.freeze(Object.fromEntries([2, 3, 4, 5].map(carbon => [carbon, localFischerView(indexed, carbon, state.rows[carbon - 1].fischer)])));
  const lower = [0, 1, 2].map(axis => Math.min(...atoms.map(item => item.position[axis])));
  const upper = [0, 1, 2].map(axis => Math.max(...atoms.map(item => item.position[axis])));
  const defaultView = Object.freeze({ kind: 'overview', position: freezeVector([9, 3, 12]), target: freezeVector([0, 0, 0]),
    up: freezeVector([0, 1, 0]), frustumHeight: Math.max(...upper.map((value, axis) => value - lower[axis])) + 1.7 });
  const closureChanges = Object.freeze({ endpointOnly: true,
    bondRetained: Object.freeze({ a: 'C5', b: 'O5', order: 1 }),
    bondFormed: Object.freeze({ a: 'C1', b: 'O5', order: 1 }),
    bondOrderChanged: Object.freeze({ a: 'C1', b: 'O1', before: 2, after: 1 }),
    hydroxylMembership: Object.freeze({ openOnly: 'O5', ringOnly: 'O1' }),
    protonAtomMapping: null,
  });
  return Object.freeze({ id: `sugar-open-chain-${state.series}-${state.sugar}`,
    name: `${state.series}-${state.name} · 開鏈`, formula: 'C6H12O6', atoms: Object.freeze(atoms), bonds: Object.freeze(bonds),
    metadata: Object.freeze({ form: 'open-chain', molecularForm: 'open-chain', coordinateUnit: 'angstrom', upAxis: 'y', ringNormal: null,
      sugar: state.sugar, series: state.series, anomer: null, chair: null, fischerPattern: state.fischerPattern,
      stereocentres: Object.freeze([2, 3, 4, 5]), hydrogenCount: 12, defaultView, localFischerViews, closureChanges,
      representation: 'fixed illustrative zigzag open-chain conformer with explicit atoms and local Fischer camera views',
      measuredGeometry: false, energyMinimized: false, isTrajectory: false,
      limits: Object.freeze([
        '全分子是選定的開鏈示意構象；各 Fischer 中心須分別對準，不可把全鏈當成同時橫前直後。',
        'C1 為平面醛基，尚無 α/β；D/L 由最遠離醛基的手性中心 C5 決定。',
        'OH 與 CH₂OH 採固定 rotamer；座標並非實測、能量最小值或構形族群。',
        '成環只比較端點 C/O 身份與鍵結；不插值冒充機制、不追蹤同一質子的轉移。',
      ]),
    }),
  });
}

/** Complete camera snapshot for one C2–C5; never reflect or flatten the molecule. */
export function sugarOpenChainFischerView(molecule, carbon = 5) {
  if (!Number.isInteger(carbon) || carbon < 2 || carbon > 5) throw new RangeError('Local Fischer view requires C2–C5');
  if (molecule?.metadata?.molecularForm !== 'open-chain') throw new TypeError('Local Fischer view requires an open-chain molecule');
  return molecule.metadata.localFischerViews[carbon];
}
