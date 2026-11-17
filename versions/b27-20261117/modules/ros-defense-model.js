/** Stoichiometric teaching ledger, not a kinetic or viability model.
 * Amounts are µmol. Oxygen and water are cumulative generated products;
 * their zero origin does not describe the initial solvent or dissolved gas.
 */
export const ROS_DEFENSE_ID = 'micro-ros-defense';
export const ROS_DEFENSE_VERSION = 'ros-defense/v1';

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export const ROS_DEFENSE_DEFAULTS = freeze({ superoxideUmol: 6, peroxideUmol: 0, nadhUmol: 1 });
export const ROS_DEFENSE_SPECIES = freeze({
  superoxideUmol: { id: 'superoxideUmol', label: 'O₂•⁻', name: '超氧自由基', oxygenAtoms: 2 },
  peroxideUmol: { id: 'peroxideUmol', label: 'H₂O₂', name: '過氧化氫（非自由基ROS）', oxygenAtoms: 2 },
  oxygenUmol: { id: 'oxygenUmol', label: 'O₂', name: '累計生成的氧氣', oxygenAtoms: 2 },
  waterUmol: { id: 'waterUmol', label: 'H₂O', name: '累計生成的水', oxygenAtoms: 1 },
  nadhUmol: { id: 'nadhUmol', label: 'NADH', name: '還原態NADH', oxygenAtoms: null },
  nadOxUmol: { id: 'nadOxUmol', label: 'NAD⁺', name: '氧化態NAD⁺', oxygenAtoms: null },
});
export const ROS_DEFENSE_REACTIONS = freeze({
  sod: {
    id: 'sod', label: '超氧歧化酶 SOD', equation: '2 O₂•⁻ + 2 H⁺ → O₂ + H₂O₂',
    sourceId: 'ros-iubmb-sod', needs: { superoxideUmol: 2 },
    delta: { superoxideUmol: -2, peroxideUmol: 1, oxygenUmol: 1, waterUmol: 0, nadhUmol: 0, nadOxUmol: 0 },
    protonsConsumedUmol: 2,
  },
  catalase: {
    id: 'catalase', label: '過氧化氫酶 Catalase', equation: '2 H₂O₂ → O₂ + 2 H₂O',
    sourceId: 'ros-iubmb-catalase', needs: { peroxideUmol: 2 },
    delta: { superoxideUmol: 0, peroxideUmol: -2, oxygenUmol: 1, waterUmol: 2, nadhUmol: 0, nadOxUmol: 0 },
    protonsConsumedUmol: 0,
  },
  'nadh-peroxidase': {
    id: 'nadh-peroxidase', label: 'NADH過氧化酶', equation: 'NADH + H⁺ + H₂O₂ → NAD⁺ + 2 H₂O',
    sourceId: 'ros-iubmb-nadh-peroxidase', needs: { peroxideUmol: 1, nadhUmol: 1 },
    delta: { superoxideUmol: 0, peroxideUmol: -1, oxygenUmol: 0, waterUmol: 2, nadhUmol: -1, nadOxUmol: 1 },
    protonsConsumedUmol: 1,
  },
});
export const ROS_DEFENSE_LIMITS = freeze([
  '原創教學反應帳本：起始量0–24 µmol是指定量，不是濃度、菌體實測值、酵素活性或食品操作條件。',
  '每步依化學計量改變指定反應程度；沒有時間、速率、反應競爭、傳輸或自發反應。未操作SOD不表示水溶液中的超氧不會自發歧化。',
  '只追蹤O₂•⁻與H₂O₂兩種ROS。H₂O₂是非自由基ROS；O₂只標作產物，不展開其電子結構，不計總毒性分數。',
  'H₂O與O₂欄位是累計生成量，初值0不表示沒有溶劑水或溶氧。產物留在帳內，沒有氣液交換或流失。',
  '氧原子帳只計指定初始ROS及其所記產物，不含整份溶液與NAD輔酶固定骨架；不是全體系氧總量。',
  'H⁺由外部緩衝庫供應，只記累計使用量，不預測pH或緩衝容量。NAD⁺的名稱不是指定pH下整分子的絕對電荷。',
  'NADH是有限初始資源，NADH與NAD⁺總量守恆，沒有自動再生；酵素是催化劑，不作消耗的底物。',
  'Catalase不消耗外加NADH，但H₂O₂同時作電子供體與受體而歧化；不能說成沒有氧化還原或電子轉移。',
  '三條反應是組合教學網路。Watanabe研究的Be1證據限Mn-catalase與NADH peroxidase，不證明該菌株具有此處SOD路徑。',
  '原研究的清除活性與可培養菌數是不同測量，不由反應帳推算存活、死亡、食品安全或健康效益。',
  '本課只補114-259第5題的酵素型抗氧化機制；非酵素型抗氧化與DNA修復仍需另學，沒有整題完成或自訂分項配分。',
]);

const INITIAL_FIELDS = Object.keys(ROS_DEFENSE_DEFAULTS);
const POOL_FIELDS = Object.keys(ROS_DEFENSE_SPECIES);
const REACTION_IDS = Object.keys(ROS_DEFENSE_REACTIONS);
const QUANTITIES = [...POOL_FIELDS, 'protonsConsumedUmol'];
const STATE_FIELDS = ['schema', 'version', 'initial', 'extentsUmol', ...QUANTITIES];

// Descriptors are checked before access so a rejected getter never runs.
function plainRecord(value, allowed, label, requireAll = true) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError(`${label} must be a plain object`);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some(key => typeof key !== 'string' || !allowed.includes(key))
      || (requireAll && keys.length !== allowed.length)) {
    throw new TypeError(`${label} has unexpected or missing fields`);
  }
  const copy = {};
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError(`${label}.${key} must be enumerable data`);
    }
    copy[key] = descriptor.value;
  }
  return copy;
}

function number(value, label, { integer = false, max = Infinity, canonical = false } = {}) {
  if (typeof value !== 'number') throw new TypeError(`${label} must be a number`);
  if (!Number.isFinite(value) || value < 0 || value > max || (integer && !Number.isInteger(value))
      || (canonical && Object.is(value, -0))) {
    throw new RangeError(`${label} is outside its numeric domain`);
  }
  return value === 0 ? 0 : value;
}

function initialValues(value, partial = false) {
  const fields = plainRecord(value, INITIAL_FIELDS, 'initial', !partial);
  return Object.fromEntries(INITIAL_FIELDS.map(key => [key,
    Object.hasOwn(fields, key)
      ? number(fields[key], `initial.${key}`, { integer: true, max: 24, canonical: !partial })
      : ROS_DEFENSE_DEFAULTS[key],
  ]));
}

function buildState(initial, extents) {
  const s = extents.sod, c = extents.catalase, p = extents['nadh-peroxidase'];
  return {
    schema: 'ros-defense-state/v1', version: ROS_DEFENSE_VERSION,
    initial: { ...initial }, extentsUmol: { ...extents },
    superoxideUmol: initial.superoxideUmol - 2 * s,
    peroxideUmol: initial.peroxideUmol + s - 2 * c - p,
    oxygenUmol: s + c, waterUmol: 2 * c + 2 * p,
    nadhUmol: initial.nadhUmol - p, nadOxUmol: p,
    protonsConsumedUmol: 2 * s + p,
  };
}

function canonicalState(value) {
  const record = plainRecord(value, STATE_FIELDS, 'state');
  if (record.schema !== 'ros-defense-state/v1' || record.version !== ROS_DEFENSE_VERSION) {
    throw new TypeError('Unknown ROS state schema or version');
  }
  const initial = initialValues(record.initial);
  const extents = plainRecord(record.extentsUmol, REACTION_IDS, 'extentsUmol');
  // Necessary grid closure for integer starting pools and the public step/batch
  // operations. This does not certify the user's separately recorded history.
  const denominators = { sod: 2, catalase: 4, 'nadh-peroxidase': 2 };
  const maxima = { sod: 12, catalase: 18, 'nadh-peroxidase': 24 };
  for (const id of REACTION_IDS) {
    number(extents[id], `extentsUmol.${id}`, { max: maxima[id], canonical: true });
    if (!Number.isInteger(extents[id] * denominators[id])) {
      throw new RangeError(`extentsUmol.${id} is not on the reachable reaction grid`);
    }
  }
  const expected = buildState(initial, extents);
  for (const key of QUANTITIES) {
    number(record[key], `state.${key}`, { canonical: true });
    number(expected[key], `derived.${key}`, { canonical: true });
    if (!Object.is(record[key], expected[key])) throw new RangeError(`state.${key} is inconsistent with initial amounts and extents`);
  }
  return expected;
}

function reactionFor(id) {
  if (typeof id !== 'string' || !Object.hasOwn(ROS_DEFENSE_REACTIONS, id)) {
    throw new TypeError('Unknown ROS reaction');
  }
  return ROS_DEFENSE_REACTIONS[id];
}

function availability(state, reaction) {
  const needs = Object.entries(reaction.needs);
  const maxExtentUmol = Math.min(...needs.map(([key, coefficient]) => state[key] / coefficient));
  return {
    maxExtentUmol, stepExtentUmol: Math.min(1, maxExtentUmol), available: maxExtentUmol > 0,
    missing: needs.filter(([key]) => state[key] === 0).map(([field, coefficient]) => ({
      field, label: ROS_DEFENSE_SPECIES[field].label, availableUmol: state[field], coefficient,
    })),
  };
}

export function createRosState(config = {}) {
  const initial = initialValues(config, true);
  return freeze(buildState(initial, { sod: 0, catalase: 0, 'nadh-peroxidase': 0 }));
}

export function rosAvailability(state, reactionId) {
  const reaction = reactionFor(reactionId);
  return freeze(availability(canonicalState(state), reaction));
}

export function applyRosReaction(state, reactionId, mode = 'step') {
  const reaction = reactionFor(reactionId);
  if (mode !== 'step' && mode !== 'batch') throw new TypeError('Unknown ROS reaction mode');
  const before = canonicalState(state);
  const available = availability(before, reaction);
  const extentUmol = mode === 'step' ? available.stepExtentUmol : available.maxExtentUmol;
  const extents = { ...before.extentsUmol, [reactionId]: before.extentsUmol[reactionId] + extentUmol };
  const after = buildState(before.initial, extents);
  const delta = Object.fromEntries(QUANTITIES.map(key => [key, after[key] - before[key]]));
  return freeze({
    status: available.available ? 'applied' : 'blocked', reactionId, mode, extentUmol,
    before, state: after, delta,
    message: available.available
      ? `${reaction.label}：本次反應程度 ${extentUmol} µmol。`
      : `${available.missing.map(item => item.label).join('、')}為0，這條反應無可用底物。`,
  });
}

export function rosReadings(state) {
  const s = canonicalState(state);
  const hasS = s.superoxideUmol > 0, hasP = s.peroxideUmol > 0;
  const status = hasS ? (hasP ? 'both-present' : 'superoxide-present') : (hasP ? 'peroxide-present' : 'none-tracked');
  const descriptions = {
    'both-present': '所追蹤的超氧與H₂O₂都還有剩餘。',
    'superoxide-present': '所追蹤的超氧還有剩餘；H₂O₂目前為0。',
    'peroxide-present': '超氧已為0，H₂O₂仍有剩餘；非自由基ROS仍在帳內。',
    'none-tracked': '所追蹤的兩種ROS皆為0；不代表全部ROS消失或食品安全。',
  };
  return freeze({
    oxygenAtomUmol: 2 * s.superoxideUmol + 2 * s.peroxideUmol + 2 * s.oxygenUmol + s.waterUmol,
    initialOxygenAtomUmol: 2 * s.initial.superoxideUmol + 2 * s.initial.peroxideUmol,
    nadPoolUmol: s.nadhUmol + s.nadOxUmol, initialNadPoolUmol: s.initial.nadhUmol,
    nadhSpentUmol: s.extentsUmol['nadh-peroxidase'], electronDonatedUmol: 2 * s.extentsUmol['nadh-peroxidase'],
    protonsConsumedUmol: s.protonsConsumedUmol,
    ros: { superoxideUmol: s.superoxideUmol, peroxideUmol: s.peroxideUmol, status, description: descriptions[status] },
  });
}
