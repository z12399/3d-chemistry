import { sugarState, chairGeometry } from './sugar-chair-model.js';

/** Explicit-atom teaching geometry. Coordinates use ångströms and molecular z-up.
 * The chair is idealized, all hydrogens are retained, and the OH/CH2OH
 * torsions are fixed illustrative rotamers. No energy minimization is done.
 */
export const SUGAR_CHAIR_SPATIAL_GEOMETRY = Object.freeze({
  ringRadius: 1.45, carbonCarbon: 1.54, exocyclicCarbonOxygen: 1.43,
  carbonHydrogen: 1.09, oxygenHydrogen: 0.97, hydroxylAngleDegrees: 108.5,
});

const add = (a, b) => a.map((value, index) => value + b[index]);
const subtract = (a, b) => a.map((value, index) => value - b[index]);
const multiply = (vector, scalar) => vector.map(value => value * scalar);
const dot = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = vector => {
  const length = Math.hypot(...vector);
  if (length < 1e-12) throw new RangeError('Cannot normalize a zero geometry vector');
  return multiply(vector, 1 / length);
};
const xyz = point => [point.x, point.y, point.z];
const opposite = face => face === 'up' ? 'down' : 'up';
const otherPosition = position => position === 'axial' ? 'equatorial' : 'axial';

/** Perpendicular outward radial tangent fixes an illustrative side-group torsion.
 * Its radial direction avoids arbitrary world-axis discontinuities and mirrors
 * with the complete D/L structure. The resulting rotamer is not an energy claim.
 */
function radialTangent(direction, ringAnchor) {
  const radial = unit([ringAnchor.x, ringAnchor.y, 0]);
  return unit(subtract(radial, multiply(direction, dot(radial, direction))));
}

function hydroxylHydrogenDirection(carbonToOxygen, tangent) {
  const angle = SUGAR_CHAIR_SPATIAL_GEOMETRY.hydroxylAngleDegrees * Math.PI / 180;
  // At O, the O→C vector is −carbonToOxygen; angle C–O–H = 108.5°.
  return add(multiply(carbonToOxygen, -Math.cos(angle)), multiply(tangent, Math.sin(angle)));
}

export function sugarChairMolecule(input = sugarState()) {
  const state = sugarState(input), geometry = chairGeometry(state, { radius: SUGAR_CHAIR_SPATIAL_GEOMETRY.ringRadius });
  const atoms = [], bonds = [];
  const atom = (id, element, position, properties) => {
    atoms.push(Object.freeze({ id, element, position: Object.freeze([...position]), label: id, ...properties }));
  };
  const bond = (a, b) => bonds.push(Object.freeze({ a, b, order: 1 }));
  for (const ringAtom of geometry.ring) {
    const carbon = ringAtom.carbon || 5;
    atom(ringAtom.atom, ringAtom.carbon ? 'C' : 'O', xyz(ringAtom), {
      carbon, selectorCarbon: carbon, role: ringAtom.carbon ? 'ring-carbon' : 'ring-oxygen',
      ...(ringAtom.carbon ? {} : { originCarbon: 5 }),
    });
  }
  for (let index = 0; index < 6; index++) bond(geometry.ring[index].atom, geometry.ring[(index + 1) % 6].atom);

  for (const substituent of geometry.substituents) {
    const carbon = substituent.carbon, carbonId = `C${carbon}`, origin = xyz(substituent.anchor);
    const direction = xyz(substituent.direction), hydrogenDirection = xyz(substituent.hydrogenDirection);
    const shared = { carbon, selectorCarbon: carbon };
    const hId = `H${carbon}`;
    atom(hId, 'H', add(origin, multiply(hydrogenDirection, SUGAR_CHAIR_SPATIAL_GEOMETRY.carbonHydrogen)), {
      ...shared, role: 'ring-carbon-hydrogen', face: opposite(substituent.face), positionType: otherPosition(substituent.position),
    });
    bond(carbonId, hId);

    const tangent = radialTangent(direction, substituent.anchor);
    if (carbon < 5) {
      const oxygenId = `O${carbon}`, oxygen = add(origin, multiply(direction, SUGAR_CHAIR_SPATIAL_GEOMETRY.exocyclicCarbonOxygen));
      atom(oxygenId, 'O', oxygen, { ...shared, role: 'hydroxyl-oxygen', face: substituent.face, positionType: substituent.position });
      const hydrogenId = `H-O${carbon}`;
      atom(hydrogenId, 'H', add(oxygen, multiply(hydroxylHydrogenDirection(direction, tangent), SUGAR_CHAIR_SPATIAL_GEOMETRY.oxygenHydrogen)), {
        ...shared, role: 'hydroxyl-hydrogen', parentAtom: oxygenId,
      });
      bond(carbonId, oxygenId); bond(oxygenId, hydrogenId);
      continue;
    }

    // C5–C6 is the group whose face/a/e is taught at C5. O6 is a distinct
    // oxygen farther along that group; its spatial height is not C5 face.
    const c6 = add(origin, multiply(direction, SUGAR_CHAIR_SPATIAL_GEOMETRY.carbonCarbon));
    const sideGroup = { carbon: 6, selectorCarbon: 5 };
    atom('C6', 'C', c6, { ...sideGroup, role: 'hydroxymethyl-carbon', face: substituent.face, positionType: substituent.position });
    bond('C5', 'C6');
    // Three unit tetrahedral directions around the C6→C5 bond. The first
    // cone direction is O6; the other two are interchangeable CH2 hydrogens.
    const handedTangent = multiply(unit(cross(direction, tangent)), substituent.face === 'up' ? 1 : -1);
    const sideDirections = [0, 2 * Math.PI / 3, 4 * Math.PI / 3].map(angle => add(
      multiply(direction, 1 / 3), multiply(add(multiply(tangent, Math.cos(angle)), multiply(handedTangent, Math.sin(angle))), Math.sqrt(8) / 3),
    ));
    const o6 = add(c6, multiply(sideDirections[0], SUGAR_CHAIR_SPATIAL_GEOMETRY.exocyclicCarbonOxygen));
    atom('O6', 'O', o6, { ...sideGroup, role: 'hydroxymethyl-oxygen' });
    bond('C6', 'O6');
    for (const [index, id] of ['H6a', 'H6b'].entries()) {
      atom(id, 'H', add(c6, multiply(sideDirections[index + 1], SUGAR_CHAIR_SPATIAL_GEOMETRY.carbonHydrogen)), {
        ...sideGroup, role: 'hydroxymethyl-carbon-hydrogen', parentAtom: 'C6',
      });
      bond('C6', id);
    }
    const o6Tangent = unit(subtract(tangent, multiply(sideDirections[0], dot(tangent, sideDirections[0]))));
    atom('HO6', 'H', add(o6, multiply(hydroxylHydrogenDirection(sideDirections[0], o6Tangent), SUGAR_CHAIR_SPATIAL_GEOMETRY.oxygenHydrogen)), {
      ...sideGroup, role: 'hydroxymethyl-hydrogen', parentAtom: 'O6',
    });
    bond('O6', 'HO6');
  }

  return Object.freeze({
    id: `sugar-chair-${state.anomer}-${state.series}-${state.sugar}-${state.chair}`,
    name: `${state.anomer === 'alpha' ? 'α' : 'β'}-${state.series}-${state.name} · ${state.chair}`,
    formula: 'C6H12O6', atoms: Object.freeze(atoms), bonds: Object.freeze(bonds),
    metadata: Object.freeze({ coordinateUnit: 'angstrom', upAxis: 'z', ringNormal: Object.freeze([0, 0, 1]),
      sugar: state.sugar, series: state.series, anomer: state.anomer, chair: state.chair,
      stereocentres: Object.freeze([1, 2, 3, 4, 5]), hydrogenCount: 12,
      representation: 'ideal tetrahedral chair with explicit atoms and fixed illustrative hydroxyl rotamers',
      measuredGeometry: false, energyMinimized: false, isTrajectory: false,
      ringBondLength: geometry.radius * 3 / (2 * Math.sqrt(2)),
      limits: Object.freeze([
        '理想椅式保留構型與四面體鍵向；環內 C–O 鍵也採約 1.538 Å 的共用環長，並非精確實測鍵長。',
        'OH 與 CH₂OH 採固定示意旋轉構形；不代表唯一 rotamer、最低能量或溶液中的構形族群。',
        '拖曳相機是剛體觀察；切換椅式為兩端構形，並未模擬實際翻椅過渡路徑。',
      ]),
    }),
  });
}
