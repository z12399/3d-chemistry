export const MEAT_MAP_ID = 'meat-map-evidence';

const ATMOSPHERE_IDS = ['low', 'medium', 'high'];
const METRIC_IDS = ['aStar', 'DMb', 'OMb', 'MMb'];
const MEASURED_DAYS = [0, 1, 2, 6, 8, 10, 13, 14];
const METRIC_TABLES = {aStar: 'A2', DMb: 'A5', OMb: 'A6', MMb: 'A7'};
const LETTER_KEYS = ['withinAtmosphereAcrossDays', 'withinDayAcrossAtmospheres'];
const COMPOSITIONS = {
  low: {O2: 1, N2: 99, CO2: 0},
  medium: {O2: 20, N2: 80, CO2: 0},
  high: {O2: 70, N2: 0, CO2: 30},
};
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function plainObject(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError(`${name} must be a plain object.`);
  }
}

function exactObject(value, keys, name) {
  plainObject(value, name);
  if (Reflect.ownKeys(value).length !== keys.length || keys.some(key => !own(value, key))) {
    throw new TypeError(`${name} must contain exactly ${keys.join(', ')}.`);
  }
}

function nonemptyString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} must be a nonempty string.`);
}

function finiteNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${name} must be a finite number.`);
  return value;
}

function distinctArray(value, name) {
  if (!Array.isArray(value) || !value.length || new Set(value).size !== value.length) {
    throw new TypeError(`${name} must be a nonempty array of distinct values.`);
  }
}

function choice(value, allowed, name) {
  if (typeof value !== 'string') throw new TypeError(`${name} must be a string.`);
  if (!allowed.includes(value)) throw new RangeError(`Unsupported ${name}: ${value}`);
}

function copy(value) {
  if (Array.isArray(value)) return value.map(copy);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)]));
  }
  return value;
}

function rowId(metricId, atmosphereId, day) {
  return `${metricId}:${atmosphereId}:${day}`;
}

/** Validate one complete frozen transcription, without fitting or filling rows. */
export function validateMeatMapData(data) {
  exactObject(data, ['schema', 'id', 'evidenceDate', 'sources', 'study', 'atmospheres',
    'days', 'metrics', 'statistics', 'observations', 'provenance', 'limitations'], 'data');
  if (data.schema !== 'meat-map-evidence/v1' || data.id !== MEAT_MAP_ID) throw new RangeError('Unsupported meat MAP dataset.');
  nonemptyString(data.evidenceDate, 'evidenceDate');
  if (!Array.isArray(data.sources) || !data.sources.length) throw new TypeError('sources must be a nonempty array.');
  const sourceIds = data.sources.map(source => {
    plainObject(source, 'source');
    for (const key of ['id', 'title', 'url']) nonemptyString(source[key], `source.${key}`);
    if (!/^https:\/\//.test(source.url)) throw new RangeError('Source URLs must use HTTPS.');
    return source.id;
  });
  distinctArray(sourceIds, 'source IDs');
  plainObject(data.study, 'study');
  if (!sourceIds.includes(data.study.sourceId)) throw new RangeError('Study provenance must resolve to a source.');
  if (data.study.rawObservationsAvailable !== false || data.study.covariance !== null) {
    throw new RangeError('Raw observations and covariance are outside this summary model.');
  }
  if (data.study.interpretation?.relativeIndices?.status !== 'AS_REPORTED_NUMERIC_COMPARISON_ONLY_METHOD_DIRECTION_UNRESOLVED') {
    throw new RangeError('The unresolved source-method direction must remain explicit.');
  }
  if (!Array.isArray(data.atmospheres) || data.atmospheres.length !== ATMOSPHERE_IDS.length) {
    throw new RangeError('Exactly three complete reviewed atmospheres are required.');
  }
  for (const [index, atmosphere] of data.atmospheres.entries()) {
    exactObject(atmosphere, ['id', 'label', 'composition'], 'atmosphere');
    if (atmosphere.id !== ATMOSPHERE_IDS[index]) throw new RangeError('Atmospheres must use low/medium/high in reviewed order.');
    nonemptyString(atmosphere.label, 'atmosphere.label');
    exactObject(atmosphere.composition, ['O2', 'N2', 'CO2'], 'composition');
    for (const gas of ['O2', 'N2', 'CO2']) {
      if (atmosphere.composition[gas] !== COMPOSITIONS[atmosphere.id][gas]) {
        throw new RangeError('Only the three complete reviewed gas formulations are supported.');
      }
    }
    for (const [gas, display] of [['O2', 'O₂'], ['N2', 'N₂'], ['CO2', 'CO₂']]) {
      if (atmosphere.composition[gas] > 0 && !atmosphere.label.includes(`${atmosphere.composition[gas]}% ${display}`)) {
        throw new RangeError('Atmosphere labels must identify every nonzero gas.');
      }
    }
  }
  distinctArray(data.days, 'days');
  if (data.days.length !== MEASURED_DAYS.length || data.days.some((day, index) => day !== MEASURED_DAYS[index])) {
    throw new RangeError('Only the eight reviewed measured dates are supported.');
  }
  if (!Array.isArray(data.metrics) || !data.metrics.length) throw new TypeError('metrics must be a nonempty array.');
  const metricIds = data.metrics.map(metric => {
    exactObject(metric, ['id', 'label', 'unit', 'tableId', 'errorKind', 'measurementKind'], 'metric');
    choice(metric.id, METRIC_IDS, 'metric.id');
    for (const key of ['label', 'unit', 'tableId']) nonemptyString(metric[key], `metric.${key}`);
    if (metric.tableId !== METRIC_TABLES[metric.id]) throw new RangeError('Metric must retain its reviewed appendix table.');
    if (metric.errorKind !== 'SD') throw new RangeError('Only reported SD is supported.');
    if (metric.measurementKind !== (metric.id === 'aStar' ? 'color-coordinate' : 'relative-index')) {
      throw new RangeError('Myoglobin measurements are relative dimensionless indices.');
    }
    if (metric.unit !== (metric.id === 'aStar' ? 'CIELAB a*' : '[-]')) throw new RangeError('The original measurement scale must remain fixed.');
    return metric.id;
  });
  distinctArray(metricIds, 'metric IDs');
  if (metricIds.length !== METRIC_IDS.length || metricIds.some((id, index) => id !== METRIC_IDS[index])) {
    throw new RangeError('All four reviewed metrics must remain in their frozen order.');
  }
  plainObject(data.statistics, 'statistics');
  exactObject(data.statistics.letterRules, LETTER_KEYS, 'letterRules');
  if (data.statistics.errorKind !== 'SD'
      || data.statistics.letterRules.withinAtmosphereAcrossDays !== 'uppercase'
      || data.statistics.letterRules.withinDayAcrossAtmospheres !== 'lowercase') {
    throw new RangeError('The SD and author-letter directions must match the source footnote.');
  }
  nonemptyString(data.statistics.footnote, 'statistics.footnote');
  if (!Array.isArray(data.observations) || data.observations.length !== data.days.length * ATMOSPHERE_IDS.length * metricIds.length) {
    throw new RangeError('Every reviewed metric must have all 24 published rows.');
  }
  const seen = new Set();
  for (const row of data.observations) {
    exactObject(row, ['id', 'atmosphereId', 'day', 'metricId', 'mean', 'sd', 'meanText', 'sdText', 'letters', 'provenance'], 'observation');
    choice(row.atmosphereId, ATMOSPHERE_IDS, 'atmosphereId');
    choice(row.metricId, metricIds, 'metricId');
    if (typeof row.day !== 'number' || !data.days.includes(row.day)) throw new RangeError('Observation is outside the measured dates.');
    if (row.id !== rowId(row.metricId, row.atmosphereId, row.day) || seen.has(row.id)) throw new RangeError('Observation identities must be correct and unique.');
    seen.add(row.id);
    finiteNumber(row.mean, 'mean');
    if (finiteNumber(row.sd, 'sd') < 0) throw new RangeError('SD must be nonnegative.');
    for (const [numericKey, textKey] of [['mean', 'meanText'], ['sd', 'sdText']]) {
      nonemptyString(row[textKey], textKey);
      if (!/^-?\d+(?:\.\d+)?$/.test(row[textKey]) || Number(row[textKey]) !== row[numericKey]) {
        throw new RangeError('Printed decimal precision must agree with the reported numeric value.');
      }
    }
    exactObject(row.letters, LETTER_KEYS, 'letters');
    for (const key of LETTER_KEYS) {
      const letters = row.letters[key];
      if (!Array.isArray(letters) || new Set(letters).size !== letters.length) throw new TypeError('Letters must be a distinct array.');
      const pattern = key === 'withinAtmosphereAcrossDays' ? /^[A-Z]$/ : /^[a-z]$/;
      if (letters.some(letter => typeof letter !== 'string' || !pattern.test(letter))) throw new RangeError('Author letters cannot cross comparison namespaces.');
    }
    exactObject(row.provenance, ['sourceId', 'tableId', 'rowLabel', 'columnLabel', 'rawCell', 'sourceLine'], 'row provenance');
    if (row.provenance.sourceId !== data.study.sourceId
        || row.provenance.tableId !== data.metrics.find(metric => metric.id === row.metricId).tableId) {
      throw new RangeError('Observation provenance must identify its source and metric table.');
    }
    for (const key of ['rowLabel', 'columnLabel', 'rawCell']) nonemptyString(row.provenance[key], `provenance.${key}`);
    if (!Number.isSafeInteger(row.provenance.sourceLine) || row.provenance.sourceLine < 1) {
      throw new RangeError('Source line must identify the frozen extraction location.');
    }
  }
  plainObject(data.provenance, 'provenance');
  if (data.provenance.noInterpolation !== true || data.provenance.noRawDataReconstruction !== true) {
    throw new RangeError('This dataset must retain its no-interpolation and no-reconstruction boundaries.');
  }
  if (!Array.isArray(data.limitations) || !data.limitations.length) throw new TypeError('Limitations must be a nonempty array.');
  data.limitations.forEach(limit => nonemptyString(limit, 'limitation'));
  return true;
}

function readSelection(data, selection) {
  exactObject(selection, ['atmosphereId', 'day', 'metricId'], 'selection');
  choice(selection.atmosphereId, ATMOSPHERE_IDS, 'atmosphereId');
  choice(selection.metricId, data.metrics.map(metric => metric.id), 'metricId');
  finiteNumber(selection.day, 'day');
  if (!data.days.includes(selection.day)) throw new RangeError('Only the published measured dates can be selected.');
  const row = data.observations.find(item => item.id === rowId(selection.metricId, selection.atmosphereId, selection.day));
  const atmosphere = data.atmospheres.find(item => item.id === selection.atmosphereId);
  const metric = data.metrics.find(item => item.id === selection.metricId);
  return {...copy(row), atmosphereLabel: atmosphere.label, composition: {...atmosphere.composition},
    metricLabel: metric.label, unit: metric.unit, errorKind: 'SD'};
}

/** Select a published summary at an exact measured date; no interpolation. */
export function selectMeatMap(data, selection) {
  validateMeatMapData(data);
  return readSelection(data, selection);
}

/**
 * Describe B minus A on one supported comparison axis.
 * Letter interpretation is copied from the author footnote. SD is preserved;
 * no p-value, interval, difference uncertainty, percentage or causality is inferred.
 */
export function compareMeatMap(data, selection) {
  validateMeatMapData(data);
  exactObject(selection, ['a', 'b', 'metricId'], 'comparison');
  exactObject(selection.a, ['atmosphereId', 'day'], 'a');
  exactObject(selection.b, ['atmosphereId', 'day'], 'b');
  const a = readSelection(data, {...selection.a, metricId: selection.metricId});
  const b = readSelection(data, {...selection.b, metricId: selection.metricId});
  const sameDay = a.day === b.day;
  const sameAtmosphere = a.atmosphereId === b.atmosphereId;
  if (!sameDay && !sameAtmosphere) throw new RangeError('A comparison can change the day or the complete formulation, not both.');
  const sameRow = a.id === b.id;
  const comparisonScope = sameRow ? 'same-row' : sameDay ? 'same-day' : 'within-atmosphere';
  const lettersKey = sameRow ? null : sameDay ? 'withinDayAcrossAtmospheres' : 'withinAtmosphereAcrossDays';
  const aLetters = lettersKey ? a.letters[lettersKey] : [];
  const bLetters = lettersKey ? b.letters[lettersKey] : [];
  const sharedLetters = aLetters.filter(letter => bLetters.includes(letter));
  const status = sameRow ? 'same-row' : !aLetters.length || !bLetters.length ? 'unavailable'
    : sharedLetters.length ? 'shared-letter' : 'no-shared-letter';
  const notes = {
    'same-row': '同一筆觀測摘要與自己比較；差值為零，沒有新增比較證據。',
    unavailable: '原表未提供此比較方向可用的分組字母，不能由均值或 SD 推定顯著性。',
    'shared-letter': '兩筆摘要共享此方向的作者分組字母；原表未將其分開，不代表已證明等效。',
    'no-shared-letter': '兩筆摘要沒有共享此方向的作者分組字母；依原表註解屬顯著不同分組，本工具不重算 p 值。',
  };
  return {
    kind: 'published-summary-comparison', metricId: selection.metricId,
    metricLabel: a.metricLabel, unit: a.unit, errorKind: 'SD', a, b,
    meanDifference: finiteNumber(b.mean - a.mean, 'meanDifference'), comparisonScope,
    differenceDefinition: 'B − A：所選兩筆發表均值的描述性差值。',
    authorGrouping: {status, lettersKey, aLetters: [...aLetters], bLetters: [...bLetters],
      sharedLetters, note: notes[status], sourceId: a.provenance.sourceId, tableId: a.provenance.tableId},
    limitations: [...data.limitations],
  };
}
