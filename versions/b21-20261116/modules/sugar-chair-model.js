/**
 * Stereochemistry teaching model for three aldohexopyranoses.
 * The Fischer projection is fixed with CHO at the top and C6 at the bottom.
 * Haworth uses O5 at upper right and C1 at right. Only with that convention
 * does Fischer right -> Haworth down apply directly.
 * The ideal chair coordinates are a teaching geometry, not a force-field
 * minimum, conformational population, or molecular dynamics calculation.
 */
export const SUGAR_CHAIR_PRESETS = Object.freeze({
  glucose: Object.freeze({ name: '葡萄糖', nameEn: 'Glucose', dFischer: 'RLRR' }),
  mannose: Object.freeze({ name: '甘露糖', nameEn: 'Mannose', dFischer: 'LLRR' }),
  galactose: Object.freeze({ name: '半乳糖', nameEn: 'Galactose', dFischer: 'RLLR' }),
});

const opposite = face => face === 'up' ? 'down' : 'up';
const faceSign = face => face === 'up' ? 1 : -1;
const enumValue = (value, values, label) => {
  if (!values.includes(value)) throw new RangeError(`Unknown ${label}: ${value}`);
  return value;
};

export function sugarState({ sugar = 'glucose', series = 'D', anomer = 'beta', chair = '4C1', selected = 2 } = {}) {
  enumValue(sugar, Object.keys(SUGAR_CHAIR_PRESETS), 'sugar');
  enumValue(series, ['D', 'L'], 'series');
  enumValue(anomer, ['alpha', 'beta'], 'anomer');
  enumValue(chair, ['4C1', '1C4'], 'chair');
  if (!Number.isInteger(selected) || selected < 1 || selected > 5) throw new RangeError('selected carbon must be 1–5');
  const preset = SUGAR_CHAIR_PRESETS[sugar];
  const fischerPattern = series === 'D' ? preset.dFischer : [...preset.dFischer].map(letter => letter === 'R' ? 'L' : 'R').join('');
  const referenceFace = series === 'D' ? 'up' : 'down';
  const anomerFace = anomer === 'beta' ? referenceFace : opposite(referenceFace);
  const axialFaces = ['down', 'up', 'down', 'up', 'down'].map(face => chair === '4C1' ? face : opposite(face));
  const rows = Array.from({ length: 5 }, (_, index) => {
    const carbon = index + 1;
    const fischer = carbon === 1 ? null : fischerPattern[index - 1] === 'R' ? 'right' : 'left';
    const face = carbon === 1 ? anomerFace : carbon === 5 ? referenceFace : fischer === 'right' ? 'down' : 'up';
    return Object.freeze({ carbon, group: carbon === 5 ? 'CH₂OH' : 'OH', face,
      position: face === axialFaces[index] ? 'axial' : 'equatorial', fischer,
      axialFace: axialFaces[index] });
  });
  const axialCount = rows.filter(row => row.position === 'axial').length;
  return Object.freeze({ sugar, series, anomer, chair, selected, name: preset.name, nameEn: preset.nameEn,
    fischerPattern, referenceCarbon: 5, anomericCarbon: 1, referenceFace, anomerFace,
    anomerRelation: anomer === 'beta' ? 'cis' : 'trans', rows: Object.freeze(rows),
    axialFaces: Object.freeze(axialFaces), axialCount, equatorialCount: 5 - axialCount,
    allEquatorial: axialCount === 0, preferredChair: series === 'D' ? '4C1' : '1C4',
    ringO: Object.freeze({ atom: 'O5', originCarbon: 5, originGroup: 'OH', note: 'C5 的羥基氧成為環氧；C5 不另留 OH。' }),
    convention: 'Fischer CHO at top; Haworth O5 upper right, C1 at right',
  });
}

/** Flip only the conformation. Carbon identities and every up/down face stay fixed. */
export function flipSugarChair(state) {
  return sugarState({ ...state, chair: state.chair === '4C1' ? '1C4' : '4C1' });
}

/**
 * A regular xy hexagon with alternating z = ±R/(4√2) is an ideal D3d chair.
 * Ring and substituent bond directions at each carbon have cos θ = −1/3.
 * In 4C1, C4 is above, C1 below the plane through C2,C3,C5,O5.
 */
export function chairGeometry(state, { radius = 1.3, bondLength = 0.95 } = {}) {
  if (!Number.isFinite(radius) || radius <= 0 || !Number.isFinite(bondLength) || bondLength <= 0) throw new RangeError('geometry lengths must be positive and finite');
  const puckering = radius / (4 * Math.sqrt(2));
  const ring = Array.from({ length: 6 }, (_, index) => {
    const angle = -index * Math.PI / 3;
    const sign = (index % 2 === 0 ? -1 : 1) * (state.chair === '4C1' ? 1 : -1);
    return Object.freeze({ atom: index === 5 ? 'O5' : `C${index + 1}`, carbon: index === 5 ? null : index + 1,
      x: radius * Math.cos(angle), y: radius * Math.sin(angle), z: sign * puckering, sign, angle });
  });
  const substituents = state.rows.map(row => {
    const atom = ring[row.carbon - 1];
    const axial = { x: 0, y: 0, z: atom.sign };
    const equatorial = { x: Math.sqrt(8) / 3 * Math.cos(atom.angle), y: Math.sqrt(8) / 3 * Math.sin(atom.angle), z: -atom.sign / 3 };
    const direction = row.position === 'axial' ? axial : equatorial;
    const hydrogenDirection = row.position === 'axial' ? equatorial : axial;
    const endpoint = dir => Object.freeze({ x: atom.x + bondLength * dir.x, y: atom.y + bondLength * dir.y, z: atom.z + bondLength * dir.z });
    return Object.freeze({ ...row, anchor: atom, direction: Object.freeze(direction), endpoint: endpoint(direction),
      axial: Object.freeze(axial), equatorial: Object.freeze(equatorial),
      hydrogenDirection: Object.freeze(hydrogenDirection), hydrogenEndpoint: endpoint(hydrogenDirection),
      hydrogenFace: opposite(row.face) });
  });
  return Object.freeze({ ring: Object.freeze(ring), substituents: Object.freeze(substituents), radius, bondLength, puckering });
}

/** Orthographic rigid rotation into screen x/y and camera depth; no reflection. */
export function projectChairPoint(point, { yaw = 0, pitch = 25 } = {}) {
  if (!Number.isFinite(yaw) || !Number.isFinite(pitch)) throw new TypeError('view angles must be finite');
  const azimuth = yaw * Math.PI / 180, elevation = pitch * Math.PI / 180;
  const rotatedX = point.x * Math.cos(azimuth) - point.y * Math.sin(azimuth);
  const rotatedY = point.x * Math.sin(azimuth) + point.y * Math.cos(azimuth);
  return { x: rotatedX, y: -rotatedY * Math.sin(elevation) - point.z * Math.cos(elevation),
    depth: rotatedY * Math.cos(elevation) - point.z * Math.sin(elevation) };
}

export const SUGAR_CHAIR_LIMITS = Object.freeze([
  '適用本教材列出的三種醛己糖之吡喃糖；不可直接套用到果糖、呋喃糖或任意旋轉的 Fischer。',
  'a/e 描述椅式構形，up/down 描述相對環面的立體方向；相機轉動不改變兩者。',
  '椅翻轉只交換 a/e，並保留 up/down、D/L 與 α/β。理想座標不預測構形族群或能量。',
]);
