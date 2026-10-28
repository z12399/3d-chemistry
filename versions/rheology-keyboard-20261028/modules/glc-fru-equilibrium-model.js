/**
 * Discrete, observed apparent equilibrium ratios for aqueous D-Glc ⇌ D-Fru.
 * The ideal two-pool fraction calculation is a teaching approximation, not
 * a measured syrup composition, a rate law or a standard-state free energy.
 * Source: Goldberg & Tewari (1995), section 4.24, printed page 1777.
 */
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const GLC_FRU_EQUILIBRIUM_SOURCES = deepFreeze([
  {
    id: 'nist-1995-4.24',
    title: 'Thermodynamics of Enzyme-Catalyzed Reactions. Part 5. Isomerases and Ligases',
    authors: ['Robert N. Goldberg', 'Yadu B. Tewari'],
    year: 1995,
    doi: '10.1063/1.555970',
    url: 'https://srd.nist.gov/jpcrdreprint/1.555970.pdf',
    section: '4.24',
    page: 1777,
    table: 'D-glucose(aq) = D-fructose(aq), apparent equilibrium constant K′',
    referenceCode: '84TEW/GOL',
    scope: '直接使用 NIST 評估表的 8 個 pH 7.5 測量點；K′ 為總 Fru／總 Glc 的表觀濃度比。',
    record: 'content-work/glc-fru-equilibrium-evidence-2026-10-02.json',
  },
  {
    id: 'tewari-goldberg-1985-correction',
    title: 'Thermodynamics of the conversion of aqueous glucose to fructose',
    authors: ['Y. B. Tewari', 'R. N. Goldberg'],
    year: 1985,
    doi: '10.1007/BF02824308',
    url: 'https://link.springer.com/article/10.1007/BF02824308',
    table: '公開 References #13；Applied Biochemistry and Biotechnology 11, 17–24',
    scope: '1985 同作者公開 References #13 更正：1984 文固定化 XI 製劑來源為 Bacillus coagulans；八列 HPLC 的製劑逐列分配與用量未核，1984 原全文未取得。 1985 也只核讀官方公開頁。',
    record: 'output/p12-source-label-2026-10-02/sources/springer-public-preview-evidence.json',
  },
]);

export const GLC_FRU_EQUILIBRIUM_SCOPE = deepFreeze({
  poolDefinition: '指定 pH 下的總 Glc 與總 Fru 各包含該糖的環形、開鏈及各異頭體；pH 7.5 時主要為中性糖，這裡未分配各物種分率。開鏈 3D 圖僅代表其中一種結構。',
  ratioDefinition: 'K′ = [總 Fru]eq／[總 Glc]eq；Q′ = fFru／(1 − fFru)。',
  approximation: '理想封閉二池近似：只保留 Glc ⇌ Fru，把已測 K′ 視為所選條件的固定濃度比；未建模活度係數隨組成的變化、其他產物與額外物種。fFru,eq = K′／(1 + K′)。',
  pH: 7.5,
  solvent: 'water',
  solventLabel: '水溶液',
  bufferRecord: 'phosphate (0.039 mol dm−3) and {Tris (0.050 mol dm−3) + HCl}',
  cofactorRecord: 'MgSO4',
  cofactorConcentrationMolDm3: null,
  sugarConcentrationMolDm3: null,
  ionicStrengthMolDm3: null,
  enzymeIdentity: null,
  enzymeAmount: null,
  method: 'HPLC',
  nistEvaluation: 'A',
  temperatureMode: 'measured-only',
  interpolation: false,
  extrapolation: false,
  ratePrediction: false,
  standardFreeEnergyPrediction: false,
  boundaries: [
    '僅選原表實測溫度；不插值、不外推，也不推估其他 pH。',
    'HPLC 重列表未列糖濃度、離子強度、MgSO4 濃度及酵素製劑／用量的逐列資料；1985 同作者公開 References #13 更正：1984 文固定化 XI 製劑來源為 Bacillus coagulans；八列 HPLC 的製劑逐列分配與用量未核，1984 原全文未取得。 不能補成稀溶液配方或濃縮食品條件。',
    '總糖池的濃度比包含環／開鏈及異頭體；不能拿兩個開鏈 3D 結構的單態比取代。',
    'fFru,eq 是所選 K′ 下的理想二池推算；規一化示意量不是原實驗糖濃度、實測產率或工業 HFCS 組成。',
    '平衡方向說明熱力學傾向；它不提供轉化時間、速率、產率或酵素製程預測。',
    '催化劑只提供達到平衡的途徑；本模型沒有以催化劑設定改寫 K′。',
    '不套用於鹼性糖反應、其他溶劑或食品濃縮系統；其物種、活度及副反應需要另外核實。',
    '此處使用表觀 K′；不把 Q′/K′ 換算成標準反應自由能。',
  ],
});

// Retain the printed decimal precision. 353.15 K is 1.157, verified visually;
// the adjacent prose's standard K = 0.869 is a DIFFERENT source quantity.
export const GLC_FRU_EQUILIBRIUM_MEASUREMENTS = deepFreeze([
  [298.15, 0.866],
  [306.15, 0.892],
  [313.15, 0.936],
  [322.15, 0.964],
  [331.85, 1.004],
  [344.15, 1.094],
  [353.15, 1.157],
  [358.15, 1.199],
].map(([temperatureK, kPrime]) => ({
  temperatureK,
  temperatureC: Number((temperatureK - 273.15).toFixed(2)),
  kPrime,
  temperatureText: temperatureK.toFixed(2),
  kPrimeText: kPrime.toFixed(3),
  pH: 7.5,
  uncertainty: null,
  sourceId: 'nist-1995-4.24',
})));

function finiteNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return value;
}

/** Exact table lookup. The caller must explicitly select a measured Kelvin T. */
export function getGlcFruMeasurement(temperatureK) {
  finiteNumber(temperatureK, 'temperatureK');
  const row = GLC_FRU_EQUILIBRIUM_MEASUREMENTS.find(row => row.temperatureK === temperatureK);
  if (!row) throw new RangeError('temperatureK must equal a measured table temperature; interpolation and extrapolation are unsupported');
  return {...row};
}

/**
 * A composition comparison at the selected measured conditions. Fractions
 * refer only to Glc + Fru, not to all sugars/solids in an industrial sample.
 * Endpoint Q′ is 0 / +Infinity by its mathematical limit. +Infinity is an
 * intentional output, not a valid input; JSON.stringify would convert it to
 * null, so callers should format it directly rather than round-trip JSON.
 * Equilibrium has a floating-point relative tolerance of 8 * Number.EPSILON
 * solely for arithmetic roundoff; this is not experimental uncertainty.
 */
export function evaluateGlcFruEquilibrium(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Inputs must be an object with temperatureK and fructoseMoleFraction');
  }
  const keys = Reflect.ownKeys(input);
  if (keys.length !== 2 || !keys.includes('temperatureK') || !keys.includes('fructoseMoleFraction')) {
    throw new TypeError('Only temperatureK and fructoseMoleFraction are supported; catalyst, pH, concentration and time are not model inputs');
  }
  const {temperatureK, fructoseMoleFraction} = input;
  const measurement = getGlcFruMeasurement(temperatureK);
  finiteNumber(fructoseMoleFraction, 'fructoseMoleFraction');
  if (fructoseMoleFraction < 0 || fructoseMoleFraction > 1) {
    throw new RangeError('fructoseMoleFraction must be in [0,1]');
  }

  const {kPrime, temperatureC} = measurement;
  const glucoseMoleFraction = 1 - fructoseMoleFraction;
  const quotient = fructoseMoleFraction === 1 ? Infinity : fructoseMoleFraction / glucoseMoleFraction;
  const qOverK = quotient / kPrime;
  const equilibriumFructoseMoleFraction = kPrime / (1 + kPrime);
  const equilibriumGlucoseMoleFraction = 1 - equilibriumFructoseMoleFraction;
  const withinRoundoff = Number.isFinite(qOverK) && Math.abs(qOverK - 1) <= 8 * Number.EPSILON;
  const direction = withinRoundoff ? 'at-equilibrium' : quotient < kPrime ? 'toward-fructose' : 'toward-glucose';

  return {
    measurement,
    temperatureK,
    temperatureC,
    kPrime,
    quotient,
    qOverK,
    fructoseMoleFraction,
    glucoseMoleFraction,
    equilibriumFructoseMoleFraction,
    equilibriumGlucoseMoleFraction,
    direction,
    scope: GLC_FRU_EQUILIBRIUM_SCOPE,
  };
}
