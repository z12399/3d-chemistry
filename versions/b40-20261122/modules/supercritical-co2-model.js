export const SUPERCRITICAL_CO2_ID = 'supercritical-co2-evidence';

const TEMPERATURES = [20, 30, 32, 40, 50, 60, 80];
const PRESSURES = [2, 4, 6, 8, 10, 15, 20, 30];
const SATURATION_RELATIVE_GUARD = 1e-6;
const CRITICAL_RELATIVE_GUARD = 1e-9;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const close = (a, b, relative) => Math.abs(a - b) <= relative * Math.max(1, Math.abs(b));
const key = (temperatureC, pressureMPa) => `${temperatureC}:${pressureMPa}`;
const sameNumbers = (actual, expected) => Array.isArray(actual)
  && actual.length === expected.length && actual.every((value, i) => value === expected[i]);
const fail = message => { throw new TypeError(`Invalid CO2 evidence data: ${message}`); };
const phaseLabel = phase => ({gas: '氣體', 'compressed-liquid': '壓縮液體', supercritical: '超臨界流體'})[phase];

function classify(data, temperatureC, pressureMPa) {
  const critical = data.critical;
  if (temperatureC > critical.temperatureC) return pressureMPa > critical.pressureMPa ? 'supercritical' : 'gas';
  const saturation = data.saturation.find(row => row.temperatureC === temperatureC && !row.isCriticalReference);
  if (!saturation) return null;
  return pressureMPa > saturation.pressureMPa ? 'compressed-liquid' : 'gas';
}

/** Validate the frozen evidence shape and phase contract; this does not recompute an EOS. */
export function validateSupercriticalCo2Data(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('object required');
  if (data.schema !== 'supercritical-co2-evidence/v1' || data.id !== SUPERCRITICAL_CO2_ID) fail('schema or activity ID');
  const critical = data.critical;
  if (!critical || !finite(critical.temperatureC) || !finite(critical.temperatureK)
    || !finite(critical.pressureMPa) || !finite(critical.densityKgM3)
    || !close(critical.temperatureK, 304.1282, 1e-8)
    || !close(critical.temperatureC + 273.15, critical.temperatureK, 1e-12)
    || !close(critical.pressureMPa, 7.3773, 1e-6)
    || !close(critical.densityKgM3, 467.6, 1e-6)) fail('pure CO2 critical reference');
  if (data.eos?.engine?.backend !== 'HEOS::CO2' || data.eos.engine.version !== '8.0.0'
    || data.eos.engine.gitRevision !== 'ae81610e7d23efc57f9d051c8e70a4d66e87537f'
    || data.eos.kind !== 'equation-of-state-calculation' || data.eos.fluid !== 'pure carbon dioxide'
    || data.eos.measuredData !== false
    || data.eos.interpolation !== false
    || !sameNumbers(data.eos.grid?.temperaturesC, TEMPERATURES)
    || !sameNumbers(data.eos.grid?.pressuresMPa, PRESSURES)) fail('pinned EOS/grid contract');
  if (!Array.isArray(data.sources) || data.sources.length < 3
    || new Set(data.sources.map(source => source.id)).size !== data.sources.length
    || data.sources.some(source => typeof source.id !== 'string' || typeof source.url !== 'string' || !source.url.startsWith('https://')))
    fail('source records');
  const sourceIds = new Set(data.sources.map(source => source.id));
  for (const id of ['scfe-source-span-wagner-1996', 'scfe-source-coolprop-co2', 'scfe-source-genena-2008'])
    if (!sourceIds.has(id)) fail(`missing source ${id}`);
  if (!Array.isArray(data.saturation) || data.saturation.length < 2) fail('saturation references');
  let previousTemperature = -Infinity;
  for (const row of data.saturation) {
    if (![row.temperatureC, row.pressureMPa, row.liquidDensityKgM3, row.vaporDensityKgM3].every(finite)
      || row.temperatureC <= previousTemperature || row.temperatureC > critical.temperatureC
      || row.pressureMPa <= 0 || row.liquidDensityKgM3 <= 0 || row.vaporDensityKgM3 <= 0)
      fail('invalid saturation reference');
    previousTemperature = row.temperatureC;
    if (row.isCriticalReference) {
      if (!close(row.temperatureC, critical.temperatureC, CRITICAL_RELATIVE_GUARD)
        || !close(row.pressureMPa, critical.pressureMPa, CRITICAL_RELATIVE_GUARD)
        || row.liquidDensityKgM3 !== critical.densityKgM3 || row.vaporDensityKgM3 !== critical.densityKgM3)
        fail('critical endpoint');
    } else if (row.temperatureC >= critical.temperatureC || row.pressureMPa >= critical.pressureMPa
      || row.liquidDensityKgM3 <= row.vaporDensityKgM3) fail('saturation branch ordering');
  }
  if (data.saturation[0].temperatureC !== 20 || data.saturation.at(-1).isCriticalReference !== true)
    fail('saturation reference extent');
  const samples = data.eos.samples;
  if (!Array.isArray(samples) || samples.length !== TEMPERATURES.length * PRESSURES.length) fail('sample count');
  const seen = new Set();
  for (const row of samples) {
    const sampleKey = key(row.temperatureC, row.pressureMPa);
    if (!TEMPERATURES.includes(row.temperatureC) || !PRESSURES.includes(row.pressureMPa)
      || row.sampleKey !== sampleKey || seen.has(sampleKey) || !finite(row.densityKgM3) || row.densityKgM3 <= 0)
      fail('invalid, duplicate or unsupported sample');
    seen.add(sampleKey);
    const saturation = data.saturation.find(s => s.temperatureC === row.temperatureC && !s.isCriticalReference);
    if (saturation && Math.abs(row.pressureMPa - saturation.pressureMPa) / saturation.pressureMPa <= SATURATION_RELATIVE_GUARD)
      fail('sample is phase-ambiguous at saturation');
    if (row.phase !== classify(data, row.temperatureC, row.pressureMPa)) fail('teaching phase');
  }
  const experiment = data.rosemary;
  if (!experiment || experiment.kind !== 'published-experiment' || experiment.sourceId !== 'scfe-source-genena-2008'
    || typeof experiment.definition !== 'string' || !experiment.definition.trim()
    || !Array.isArray(experiment.rows) || experiment.rows.length !== 6) fail('rosemary experiment');
  const experimentKeys = new Set();
  for (const row of experiment.rows) {
    const rowKey = key(row.temperatureC, row.pressureMPa);
    if (![40, 50].includes(row.temperatureC) || ![10, 20, 30].includes(row.pressureMPa)
      || experimentKeys.has(rowKey) || !finite(row.yieldPercentDryBasis)
      || row.yieldPercentDryBasis < 0 || row.yieldPercentDryBasis > 100
      || row.yieldStdDevPercentagePoints !== null || row.yieldStandardErrorPercentagePoints !== null
      || row.yieldReplicateCount !== null)
      fail('invalid or duplicate rosemary row');
    experimentKeys.add(rowKey);
  }
  return true;
}

const rejected = (status, temperatureC, pressureMPa, reason) => ({
  ok: false, status, reason,
  temperatureC: finite(temperatureC) ? temperatureC : null,
  pressureMPa: finite(pressureMPa) ? pressureMPa : null,
  densityKgM3: null, phase: null, phaseLabel: null, isSupercritical: null,
  aboveCriticalTemperature: null, nearCritical: false, sourceIds: [], sampleKey: null,
});

/** Look up a supported exact EOS point. Invalid inputs never snap, interpolate or retain an old value. */
export function selectCo2State(data, temperatureC, pressureMPa) {
  if (!finite(temperatureC) || !finite(pressureMPa))
    return rejected('invalid-input', temperatureC, pressureMPa, '溫度與壓力必須是有限數值。');
  try { validateSupercriticalCo2Data(data); }
  catch { return rejected('invalid-data', temperatureC, pressureMPa, '物性資料未通過驗證。'); }
  if (temperatureC < TEMPERATURES[0] || temperatureC > TEMPERATURES.at(-1)
    || pressureMPa < PRESSURES[0] || pressureMPa > PRESSURES.at(-1))
    return rejected('outside-activity-domain', temperatureC, pressureMPa, '超出本活動 20–80 °C、2–30 MPa 的資料範圍。');
  if (close(temperatureC, data.critical.temperatureC, CRITICAL_RELATIVE_GUARD)
    && close(pressureMPa, data.critical.pressureMPa, CRITICAL_RELATIVE_GUARD))
    return rejected('critical-reference-only', temperatureC, pressureMPa, '臨界點只作參考標記，本活動不以它作一般查表狀態。');
  const saturation = data.saturation.find(row => !row.isCriticalReference
    && close(row.temperatureC, temperatureC, CRITICAL_RELATIVE_GUARD));
  if (saturation && Math.abs(pressureMPa - saturation.pressureMPa) / saturation.pressureMPa <= SATURATION_RELATIVE_GUARD)
    return rejected('phase-ambiguous', temperatureC, pressureMPa, '氣液共存的 T、P 不能決定唯一整體密度；還需要兩相比例。');
  const sample = data.eos.samples.find(row => row.temperatureC === temperatureC && row.pressureMPa === pressureMPa);
  if (!sample) return rejected('unsupported-sample', temperatureC, pressureMPa, '本活動只提供列出的格點，不作插值。');
  return {
    ok: true, status: 'exact-sample', temperatureC, pressureMPa,
    densityKgM3: sample.densityKgM3, phase: sample.phase, phaseLabel: phaseLabel(sample.phase),
    isSupercritical: sample.phase === 'supercritical',
    aboveCriticalTemperature: temperatureC > data.critical.temperatureC,
    nearCritical: Math.abs(temperatureC - data.critical.temperatureC) <= 5 && Math.abs(pressureMPa - data.critical.pressureMPa) <= 1,
    sourceIds: ['scfe-source-span-wagner-1996', 'scfe-source-coolprop-co2'], sampleKey: sample.sampleKey,
  };
}

const direction = delta => delta > 0 ? 'increase' : delta < 0 ? 'decrease' : 'same';

/** Match published 40/50 °C rosemary yields to pure-CO2 EOS densities; no yield fitting or significance inference. */
export function compareRosemary(data, pressureMPa) {
  const invalid = (status, reason) => ({ok: false, status, reason, pressureMPa: finite(pressureMPa) ? pressureMPa : null,
    pressureBar: null, rows: [], deltaYieldPercentagePoints: null, deltaDensityKgM3: null,
    yieldDirection: null, densityDirection: null, sourceIds: [], definition: null, statisticalSignificance: 'not-inferred'});
  if (!finite(pressureMPa)) return invalid('invalid-input', '壓力必須是有限數值。');
  try { validateSupercriticalCo2Data(data); }
  catch { return invalid('invalid-data', '研究或物性資料未通過驗證。'); }
  if (![10, 20, 30].includes(pressureMPa)) return invalid('unsupported-experiment-pressure', '這組研究只比較 10、20、30 MPa。');
  const rows = [40, 50].map(temperatureC => {
    const measured = data.rosemary.rows.find(row => row.temperatureC === temperatureC && row.pressureMPa === pressureMPa);
    const eos = selectCo2State(data, temperatureC, pressureMPa);
    return {...measured, densityKgM3: eos.densityKgM3, densityKind: 'equation-of-state-calculation', yieldKind: 'published-experiment'};
  });
  const deltaYieldPercentagePoints = rows[1].yieldPercentDryBasis - rows[0].yieldPercentDryBasis;
  const deltaDensityKgM3 = rows[1].densityKgM3 - rows[0].densityKgM3;
  return {ok: true, status: 'published-pair', pressureMPa, pressureBar: pressureMPa * 10, rows,
    deltaYieldPercentagePoints, deltaDensityKgM3,
    yieldDirection: direction(deltaYieldPercentagePoints), densityDirection: direction(deltaDensityKgM3),
    sourceIds: ['scfe-source-genena-2008', 'scfe-source-span-wagner-1996', 'scfe-source-coolprop-co2'],
    definition: data.rosemary.definition, statisticalSignificance: 'not-inferred'};
}
