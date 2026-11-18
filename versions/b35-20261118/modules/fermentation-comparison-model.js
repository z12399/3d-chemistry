import { isVerifiedFermentationComparisonSource } from './fermentation-comparison-source.js';

export const FERMENTATION_COMPARISON_ACTIVITY_ID = 'fermentation-comparison-design';
const INPUT_SCHEMA = 'fermentation-comparison-design-input/v1';
const ID = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,79}$/;
const QUESTIONS = ['within-mode-condition', 'specified-process-packages', 'mechanism-investigation'];
const METRICS = ['reported-assay-activity', 'within-series-relative-activity', 'recovered-activity-per-input-dry-mass', 'biomass', 'local-oxygen'];
const CLAIMS = ['planned-control', 'learner-assumption', 'planned-difference', 'needs-measurement'];
const text = (max = 1000) => ({ type: 'string', max });
const number = (min = 0, max = 1e9) => ({ type: 'number', min, max });
const count = { type: 'integer', min: 1, max: 100000 };
const choice = (...values) => ({ values });
const flag = { type: 'boolean' };
// All leaves are nullable plans. These limits match the sealed input schema.
const PLAN = {
  conditions: {
    mode: choice('SmF', 'SSF'), organism: text(200), strain: text(200),
    substrateOrMedium: text(200), mediumRecipe: text(), cultureTemperatureC: number(-273.15),
    agitationRpm: number(), initialPH: number(0, 14), initialMoisturePercent: number(),
    moistureBasis: choice('wet-basis', 'dry-basis', 'water-mass-per-substrate-mass'),
    inputSubstrateMassG: number(), inputMassBasis: choice('dry-matter', 'as-received'),
    liquidVolumeMl: number(), inoculumAmount: number(), inoculumUnit: text(200),
    inoculumBasis: text(), vesselVolumeMl: number(),
  },
  assay: {
    protocolLabel: text(), principle: choice('DNS-reducing-sugar-assay', 'other'), substrate: text(),
    substrateConcentration: text(), temperatureC: number(-273.15), pH: number(0, 14),
    reactionTimeMin: number(), calibrationDescription: text(),
  },
  measurement: {
    quantity: choice('assay-activity-per-volume', 'relative-assay-activity', 'recovered-activity-per-input-dry-mass', 'biomass', 'local-oxygen'),
    unit: text(40), denominator: choice('per-mL-recovered-liquid', 'per-g-input-dry-matter', 'per-g-input-as-received', 'within-series-maximum', 'specified-sample-or-location'),
    denominatorDefinition: text(), normalizationReference: text(),
  },
  replication: {
    independentCultureUnits: count, extractionsPerCultureUnit: count, assaysPerExtraction: count,
    randomizationPlan: text(), blockingPlan: text(),
  },
  sampling: { harvestTimeH: number(), destructive: flag, independentUnitsPerTimePoint: count, samplePosition: text() },
  recovery: {
    protocolLabel: text(), addedExtractantVolumeMl: number(), measureRecoveredVolume: flag,
    measureInputDryMass: flag, blank: choice('none-planned', 'method-blank', 'matrix-blank'),
    spikePlan: choice('none-planned', 'before-extraction', 'after-extraction', 'both'),
  },
};
const FIELDS = Object.entries(PLAN).flatMap(([section, fields]) => Object.keys(fields).map(key => `${section}.${key}`));
const at = (object, path) => path.split('.').reduce((value, key) => value?.[key], object) ?? null;
const filled = value => value !== null && (typeof value !== 'string' || value.trim().length > 0);
const copy = value => structuredClone(value);
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function response(key, value, errors = []) {
  return freeze({ ok: errors.length === 0, [key]: errors.length ? null : value, errors });
}
function error(errors, path, code, message) { errors.push({ path, code, message }); }
function record(value, keys, path, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    error(errors, path, 'INVALID_TYPE', 'Expected a plain object.');
    return false;
  }
  let valid = true;
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !keys.includes(key) || ['__proto__', 'prototype', 'constructor'].includes(key)) {
      error(errors, `${path}.${String(key)}`, 'EXTRA_FIELD', 'Unexpected field.'); valid = false;
    } else if (!descriptor.enumerable || !('value' in descriptor)) {
      error(errors, `${path}.${key}`, 'INVALID_TYPE', 'Expected an enumerable data field.'); valid = false;
    }
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) { error(errors, `${path}.${key}`, 'INVALID_TYPE', 'Required field is absent.'); valid = false; }
  }
  return valid;
}
function list(value, min, max, path, errors, code = 'OUT_OF_RANGE') {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    error(errors, path, 'INVALID_TYPE', 'Expected an array.'); return false;
  }
  if (value.length < min || value.length > max) {
    error(errors, path, code, `Expected ${min}–${max} items.`); return false;
  }
  if (Reflect.ownKeys(value).length !== value.length + 1
      || Object.keys(value).some((key, i) => key !== String(i))
      || Object.keys(value).some(key => !('value' in Object.getOwnPropertyDescriptor(value, key)))) {
    error(errors, path, 'INVALID_TYPE', 'Expected a dense data array without extra keys.'); return false;
  }
  return true;
}
function identifier(value, path, errors) {
  if (typeof value !== 'string' || !ID.test(value)) error(errors, path, 'INVALID_TYPE', 'Invalid group identifier.');
}
function scalar(value, spec, path, errors) {
  if (value === null) return;
  if (spec.values) {
    if (!spec.values.includes(value)) error(errors, path, 'INVALID_TYPE', 'Unknown enum value.');
    return;
  }
  if (spec.type === 'number' || spec.type === 'integer') {
    if (typeof value !== 'number') error(errors, path, 'INVALID_TYPE', 'Expected a number or null.');
    else if (!Number.isFinite(value)) error(errors, path, 'NONFINITE_NUMBER', 'Number must be finite.');
    else if (spec.type === 'integer' && !Number.isInteger(value)) error(errors, path, 'INVALID_TYPE', 'Expected an integer or null.');
    else if (value < spec.min || value > spec.max) error(errors, path, 'OUT_OF_RANGE', 'Number is outside the accepted bounds.');
  } else if (typeof value !== spec.type) error(errors, path, 'INVALID_TYPE', `Expected ${spec.type} or null.`);
  else if (spec.type === 'string' && [...value].length > spec.max) error(errors, path, 'OUT_OF_RANGE', 'Text exceeds the accepted length.');
}
function validatePlan(plan, path, errors) {
  if (!record(plan, Object.keys(PLAN), path, errors)) return;
  let validConditions = false;
  for (const [section, fields] of Object.entries(PLAN)) {
    if (!record(plan[section], Object.keys(fields), `${path}.${section}`, errors)) continue;
    if (section === 'conditions') validConditions = true;
    for (const [key, spec] of Object.entries(fields)) scalar(plan[section][key], spec, `${path}.${section}.${key}`, errors);
  }
  if (validConditions && plan.conditions.moistureBasis === 'wet-basis' && plan.conditions.initialMoisturePercent > 100) {
    error(errors, `${path}.conditions.initialMoisturePercent`, 'OUT_OF_RANGE', 'Wet-basis moisture cannot exceed 100%.');
  }
}

export function normalizeDesignInputs(raw, source) {
  const errors = [];
  if (!isVerifiedFermentationComparisonSource(source)) {
    error(errors, '$.sourceIdentity', 'UNVERIFIED_SOURCE', 'A verified immutable source handle is required.');
    return response('design', null, errors);
  }
  if (!record(raw, ['schema', 'sourceIdentity', 'questionKind', 'comparisonMetric', 'groups', 'pair', 'learnerClaims'], '$', errors)) {
    return response('design', null, errors);
  }
  if (raw.schema !== INPUT_SCHEMA) error(errors, '$.schema', 'SCHEMA_MISMATCH', 'Unsupported design schema.');
  if (record(raw.sourceIdentity, ['datasetId', 'version', 'sha256'], '$.sourceIdentity', errors)
      && Object.keys(source.sourceIdentity).some(key => raw.sourceIdentity[key] !== source.sourceIdentity[key])) {
    error(errors, '$.sourceIdentity', 'SOURCE_IDENTITY_MISMATCH', 'The design references a different source catalogue.');
  }
  if (!QUESTIONS.includes(raw.questionKind)) error(errors, '$.questionKind', 'INVALID_TYPE', 'Unknown question kind.');
  if (!METRICS.includes(raw.comparisonMetric)) error(errors, '$.comparisonMetric', 'INVALID_TYPE', 'Unknown comparison metric.');
  const ids = new Set(); const references = new Set();
  const known = new Set(source.catalogue.cases.map(row => row.referenceId));
  if (list(raw.groups, 2, 4, '$.groups', errors, 'GROUP_COUNT')) {
    raw.groups.forEach((group, i) => {
      const path = `$.groups[${i}]`;
      // Inspect the discriminator without invoking an input accessor.
      const origin = group && Object.getOwnPropertyDescriptor(group, 'origin')?.value;
      if (!['reported', 'proposed'].includes(origin)) { error(errors, `${path}.origin`, 'INVALID_TYPE', 'Unknown group origin.'); return; }
      const keys = origin === 'reported' ? ['groupId', 'origin', 'referenceId'] : ['groupId', 'origin', 'derivedFromReferenceId', 'plan'];
      if (!record(group, keys, path, errors)) return;
      identifier(group.groupId, `${path}.groupId`, errors);
      if (ids.has(group.groupId)) error(errors, `${path}.groupId`, 'DUPLICATE_GROUP_ID', 'Group identifiers must be unique.');
      ids.add(group.groupId);
      const ref = origin === 'reported' ? group.referenceId : group.derivedFromReferenceId;
      if (!(origin === 'proposed' && ref === null) && !known.has(ref)) error(errors, path, 'UNKNOWN_REFERENCE', 'Unknown reported reference.');
      if (origin === 'reported') {
        if (references.has(ref)) error(errors, `${path}.referenceId`, 'DUPLICATE_REPORTED_REFERENCE', 'Clone a repeated reported treatment as a proposed group.');
        references.add(ref);
      } else validatePlan(group.plan, `${path}.plan`, errors);
    });
  }
  if (list(raw.pair, 2, 2, '$.pair', errors, 'PAIR_REFERENCE')) {
    raw.pair.forEach((id, i) => identifier(id, `$.pair[${i}]`, errors));
    if (new Set(raw.pair).size !== 2 || raw.pair.some(id => !ids.has(id))) error(errors, '$.pair', 'PAIR_REFERENCE', 'Select two distinct existing groups.');
  }
  if (list(raw.learnerClaims, 0, 64, '$.learnerClaims', errors)) {
    raw.learnerClaims.forEach((claim, i) => {
      const path = `$.learnerClaims[${i}]`;
      if (!record(claim, ['field', 'groupIds', 'classification', 'reason'], path, errors)) return;
      if (!FIELDS.includes(claim.field)) error(errors, `${path}.field`, 'INVALID_TYPE', 'Unknown plan field.');
      if (!CLAIMS.includes(claim.classification)) error(errors, `${path}.classification`, 'INVALID_TYPE', 'Unknown claim classification.');
      if (typeof claim.reason !== 'string' || [...claim.reason].length > 2000) error(errors, `${path}.reason`, 'INVALID_TYPE', 'Claim reason must be text of at most 2000 characters.');
      if (list(claim.groupIds, 2, 4, `${path}.groupIds`, errors, 'CLAIM_REFERENCE')) {
        claim.groupIds.forEach((id, j) => identifier(id, `${path}.groupIds[${j}]`, errors));
        if (new Set(claim.groupIds).size !== claim.groupIds.length || claim.groupIds.some(id => !ids.has(id))) {
          error(errors, `${path}.groupIds`, 'CLAIM_REFERENCE', 'Claims must reference distinct existing groups.');
        }
      }
    });
  }
  return response('design', errors.length ? null : copy(raw), errors);
}

export function createBlankProposedGroup(groupId) {
  if (typeof groupId !== 'string' || !ID.test(groupId)) throw new TypeError('Invalid group identifier.');
  return freeze({ groupId, origin: 'proposed', derivedFromReferenceId: null,
    plan: Object.fromEntries(Object.entries(PLAN).map(([section, fields]) => [section, Object.fromEntries(Object.keys(fields).map(key => [key, null]))])),
  });
}
const SOURCE_PATH = {
  'replication.independentCultureUnits': 'replication.independentCultureReplicates',
  'replication.extractionsPerCultureUnit': 'replication.extractionReplicates',
  'replication.assaysPerExtraction': 'replication.assayReplicates',
  'recovery.protocolLabel': 'recovery.reportedProtocolId',
};
function sourceField(row, field) { return at(row, SOURCE_PATH[field] ?? field); }
export function cloneReportedAsProposed(referenceId, groupId, source) {
  if (!isVerifiedFermentationComparisonSource(source)) throw new TypeError('A verified immutable source handle is required.');
  const row = source.catalogue.cases.find(item => item.referenceId === referenceId);
  if (!row) throw new TypeError('Unknown reported reference.');
  const group = copy(createBlankProposedGroup(groupId));
  group.derivedFromReferenceId = referenceId;
  for (const field of FIELDS) {
    const [section, key] = field.split('.');
    // Published n does not identify any of the three independent replication levels.
    if (section === 'replication' || field === 'measurement.normalizationReference') continue;
    const value = sourceField(row, field);
    if (value === null) continue;
    if (field === 'measurement.denominator') {
      // The source's mL denominator does not assert measured recovered volume.
      group.plan.measurement.denominator = row.locator.tableId === 'tab3' ? 'within-series-maximum' : null;
    } else group.plan[section][key] = copy(value);
  }
  return freeze(group);
}
function resolved(design, source) {
  return design.groups.map(group => {
    const reported = group.origin === 'reported';
    const row = reported ? source.catalogue.cases.find(item => item.referenceId === group.referenceId) : null;
    return { groupId: group.groupId, origin: group.origin, referenceId: reported ? group.referenceId : null,
      derivedFromReferenceId: reported ? null : group.derivedFromReferenceId,
      case: row, plan: reported ? null : group.plan, result: reported ? row.result : null };
  });
}
export function resolveGroups(raw, source) {
  const normalized = normalizeDesignInputs(raw, source);
  return response('groups', normalized.ok ? resolved(normalized.design, source) : null, normalized.errors);
}
function cell(group, field) {
  const reported = group.origin === 'reported';
  const value = reported ? sourceField(group.case, field) : at(group.plan, field);
  const evidencePath = SOURCE_PATH[field] ?? field;
  const evidence = reported ? group.case.fieldEvidence.find(item => item.paths.some(path => evidencePath === path || evidencePath.startsWith(`${path}.`))) : null;
  return { groupId: group.groupId, origin: group.origin, value,
    basis: reported ? (value === null ? 'unreported' : 'reported') : (filled(value) ? 'planned' : 'unfilled'),
    sourceScope: reported && value !== null ? (evidence?.scope ?? 'reported-measurement-definition') : null };
}
function comparisonStatus(left, right) {
  if ([left, right].some(item => item.basis === 'unreported')) return 'source-unreported';
  if ([left, right].some(item => item.basis === 'unfilled')) return 'planned-unfilled';
  if (left.origin !== right.origin) return 'reported-versus-planned';
  return `${left.origin === 'reported' ? 'reported' : 'planned'}-${left.value === right.value ? 'same' : 'different'}`;
}
function matrix(design, groups) {
  return { groupIds: groups.map(group => group.groupId), pair: [...design.pair], rows: FIELDS.map(field => {
    const cells = groups.map(group => cell(group, field));
    const [left, right] = design.pair.map(id => cells.find(item => item.groupId === id));
    return { field, cells, comparison: { scope: 'selected-pair', status: comparisonStatus(left, right) },
      learnerClaims: design.learnerClaims.filter(claim => claim.field === field) };
  }) };
}
export function buildDesignMatrix(raw, source) {
  const normalized = normalizeDesignInputs(raw, source);
  return response('matrix', normalized.ok ? matrix(normalized.design, resolved(normalized.design, source)) : null, normalized.errors);
}
const EXPECTED_QUANTITY = {
  'reported-assay-activity': 'assay-activity-per-volume',
  'within-series-relative-activity': 'relative-assay-activity',
  'recovered-activity-per-input-dry-mass': 'recovered-activity-per-input-dry-mass',
  biomass: 'biomass', 'local-oxygen': 'local-oxygen',
};
const EXPECTED_DENOMINATOR = {
  'reported-assay-activity': 'per-mL-recovered-liquid',
  'within-series-relative-activity': 'within-series-maximum',
  'recovered-activity-per-input-dry-mass': 'per-g-input-dry-matter',
  biomass: 'specified-sample-or-location', 'local-oxygen': 'specified-sample-or-location',
};
function definitionFields(metric) {
  const fields = ['measurement.quantity', 'measurement.unit', 'measurement.denominator', 'measurement.denominatorDefinition'];
  if (!['biomass', 'local-oxygen'].includes(metric)) fields.push(...Object.keys(PLAN.assay).map(key => `assay.${key}`));
  else fields.push('assay.protocolLabel', 'sampling.samplePosition');
  if (metric === 'within-series-relative-activity') fields.push('measurement.normalizationReference');
  return fields;
}
function pairValue(group, field) { return group.origin === 'reported' ? sourceField(group.case, field) : at(group.plan, field); }
function compatibility(design, pair) {
  const [left, right] = pair;
  const metric = design.comparisonMetric;
  const twoReported = pair.every(group => group.origin === 'reported');
  if (twoReported) {
    if (metric === 'reported-assay-activity' && pair.every(group => group.case.seriesId === 'oa2018-t4-smf')) {
      return { status: 'reported-comparable', allowedOperations: ['subtract-published-means'], reasons: ['可在 Table 4 內相減已刊載的 U/mL 均值；不代表已確認所有培養與檢定條件相同。'] };
    }
    if (metric === 'within-series-relative-activity' && pair.every(group => group.case.locator.tableId === 'tab3')) {
      if (left.case.seriesId === right.case.seriesId) return { status: 'relative-series-only', allowedOperations: ['subtract-relative-percentage-points'], reasons: ['僅比較同模式、同溫度系列的相對百分點；絕對活性分母未報。'] };
      return { status: 'different-normalization-reference', allowedOperations: [], reasons: ['兩模式各以自己的最大值為100%；不共享已知的絕對活性分母，不能相減或取比。'] };
    }
    return { status: 'different-quantity-or-basis', allowedOperations: [], reasons: ['選定量測量、表格系列或分母不同；不跨表換算、借用13.1 U/mL，或將附帶百分比當新比較資料。'] };
  }
  const fields = definitionFields(metric);
  const absent = fields.filter(field => pair.some(group => !filled(pairValue(group, field))));
  if (absent.length) return { status: 'planned-definition-incomplete', allowedOperations: [], reasons: [`共同量測定義仍缺：${absent.join('、')}。來源未報值不能由計畫補成已知。`] };
  const wrongQuantity = pair.some(group => pairValue(group, 'measurement.quantity') !== EXPECTED_QUANTITY[metric]);
  const wrongBasis = pair.some(group => pairValue(group, 'measurement.denominator') !== EXPECTED_DENOMINATOR[metric]);
  const differences = fields.filter(field => pairValue(left, field) !== pairValue(right, field));
  if (wrongQuantity || wrongBasis || differences.length) return { status: 'different-quantity-or-basis', allowedOperations: [], reasons: ['量測量、分母或操作性定義尚未填成共同計畫；不推導名稱或單位別名等價。', ...differences.map(field => `計畫定義不同：${field}`)] };
  if (metric === 'recovered-activity-per-input-dry-mass'
      && pair.some(group => pairValue(group, 'recovery.measureRecoveredVolume') !== true || pairValue(group, 'recovery.measureInputDryMass') !== true)) {
    return { status: 'planned-definition-incomplete', allowedOperations: [], reasons: ['需安排量測實際回收液量及投入乾物質量；加液體積不能代替回收液量。'] };
  }
  return { status: 'planned-definition-aligned', allowedOperations: [], reasons: ['填寫了相同的操作性量測定義；這是待執行的共同計畫，尚無可相減的觀察值，也不證明科學等價。'] };
}
function observation(group, source) {
  return { groupId: group.groupId, referenceId: group.referenceId, sourceId: group.case.sourceId,
    seriesId: group.case.seriesId, locator: group.case.locator, ...group.result.primary,
    measurement: group.case.measurement, replication: group.case.replication, statistics: source.catalogue.methodContext.statistics };
}
function describe(pair, compatible, source) {
  if (!compatible.allowedOperations.length || pair.some(group => group.origin !== 'reported')) return null;
  const relative = compatible.status === 'relative-series-only';
  return { kind: relative ? 'relative-percentage-point-difference' : 'published-mean-difference', direction: 'right-minus-left',
    // Every allowed source value is printed to one decimal place.
    value: Number((pair[1].result.primary.value - pair[0].result.primary.value).toFixed(1)),
    unit: relative ? 'percentage-points' : 'U/mL', left: observation(pair[0], source), right: observation(pair[1], source),
    differenceSd: null, pValue: null, confidenceInterval: null };
}
function question(design, pair) {
  const modes = pair.map(group => pairValue(group, 'conditions.mode'));
  if (design.questionKind === 'mechanism-investigation') return { kind: design.questionKind, status: 'unresolved', reason: '這些組別不能單獨識別氧傳、混合或剪切的作用；需直接量測及能區分機制的設計。' };
  if (modes.some(mode => mode === null)) return { kind: design.questionKind, status: 'unresolved', reason: '先定義兩組的培養模式與處理方案。' };
  if (design.questionKind === 'within-mode-condition' && modes[0] !== modes[1]) return { kind: design.questionKind, status: 'mismatch', reason: '所選組別跨模式，不能當作單一模式內的條件比較。' };
  return { kind: design.questionKind, status: 'aligned', reason: design.questionKind === 'within-mode-condition' ? '兩組模式名稱相同，可提出模式內條件問題；不等於其餘條件已受控制。' : '可比較明確列出的整體處理方案；差異不能直接歸因於模式本身。' };
}
function attribution(design, pair, designMatrix) {
  const rows = designMatrix.rows.map(row => ({ field: row.field, cells: design.pair.map(id => row.cells.find(item => item.groupId === id)), status: row.comparison.status }));
  const descriptor = row => ({ field: row.field, left: row.cells[0], right: row.cells[1], status: row.status });
  const proposed = pair.some(group => group.origin === 'proposed');
  const modes = pair.map(group => pairValue(group, 'conditions.mode'));
  const differentMode = modes.every(filled) && modes[0] !== modes[1];
  return {
    status: proposed ? 'planned-comparison-without-observations' : differentMode ? 'bundled-process-differences' : 'causal-effect-not-established',
    explicitDifferences: rows.filter(row => row.cells.every(item => filled(item.value)) && row.cells[0].value !== row.cells[1].value).map(descriptor),
    reportedSameValues: rows.filter(row => row.status === 'reported-same').map(descriptor),
    sourceUnknownFields: rows.filter(row => row.cells.some(item => item.basis === 'unreported')).map(row => ({ field: row.field, groupIds: row.cells.filter(item => item.basis === 'unreported').map(item => item.groupId) })),
    plannedAlignments: rows.filter(row => row.cells.some(item => item.origin === 'proposed') && row.cells.every(item => filled(item.value)) && row.cells[0].value === row.cells[1].value).map(descriptor),
    unmeasuredMechanisms: ['local-oxygen', 'mixing', 'shear'].map(mechanism => ({ mechanism, status: mechanism === 'local-oxygen' && design.comparisonMetric === 'local-oxygen' && proposed ? 'planned-without-observations' : 'unmeasured' })),
    limits: [
      '已報同值與計畫填寫同值都不是已證明的因果控制；learnerClaims只保存學習者主張。',
      '模式改變會伴隨自由水、支撐與基質等處理差異；不能宣稱全部控制或模式是唯一原因。',
      '培養溫度試驗不能改稱酵素耐熱性試驗；U的每分鐘是檢定反應單位，並非培養生產速率。',
      '來源字母照錄；共同字母不證明等效，沒有重新計算p值、信賴區間或差值SD。',
    ],
  };
}
function missingEvidence(design, pair, compatible) {
  const gaps = [];
  const add = (code, field, groups, sourceMissing, plannedByGroupIds, needsObservation, detail) => {
    gaps.push({ code, field, scope: groups.map(group => group.groupId).join(','), sourceMissing, plannedByGroupIds, needsObservation, detail });
  };
  const fields = new Set([
    ...Object.keys(PLAN.conditions).map(key => `conditions.${key}`), ...definitionFields(design.comparisonMetric),
    'replication.independentCultureUnits', 'replication.extractionsPerCultureUnit', 'replication.assaysPerExtraction',
    'replication.randomizationPlan', 'sampling.harvestTimeH', 'sampling.destructive',
  ]);
  if (pair.some(group => pairValue(group, 'sampling.destructive') === true)) fields.add('sampling.independentUnitsPerTimePoint');
  if (pair.some(group => pairValue(group, 'conditions.mode') === 'SSF') || design.comparisonMetric === 'recovered-activity-per-input-dry-mass') fields.add('recovery.protocolLabel');
  for (const field of fields) {
    const sourceUnknown = pair.filter(group => group.origin === 'reported' && !filled(pairValue(group, field)));
    const unplanned = pair.filter(group => group.origin === 'proposed' && !filled(pairValue(group, field)));
    const planned = pair.filter(group => group.origin === 'proposed' && filled(pairValue(group, field))).map(group => group.groupId);
    if (sourceUnknown.length) add('SOURCE_FIELD_UNREPORTED', field, sourceUnknown, true, planned, true, '來源未報；另一組的填寫或學習者主張不能回填此來源事實。');
    if (unplanned.length) add('PLAN_FIELD_UNDEFINED', field, unplanned, false, planned, false, '此項計畫尚未定義；填寫後仍需執行及記錄。');
  }
  const proposed = pair.filter(group => group.origin === 'proposed');
  if (proposed.length) add('PROPOSED_RESULTS_UNMEASURED', 'result', proposed, false, proposed.map(group => group.groupId), true, '自訂組沒有實測結果；相同條件、來源沿革及完整計畫都不會恢復刊載值。');
  if (compatible.status === 'planned-definition-aligned') add('MEASUREMENT_PLAN_NEEDS_OBSERVATION', 'measurement', pair, false, proposed.map(group => group.groupId), true, '共同量測定義已填；依計畫取得觀察後才有可比較數值。');
  if (compatible.status === 'different-normalization-reference') add('COMMON_ABSOLUTE_DENOMINATOR_UNREPORTED', 'measurement.normalizationReference', pair, true, [], true, '兩個100%各有自己的系列分母，絕對活性未報。');
  if (compatible.status === 'different-quantity-or-basis') add('MEASUREMENT_BASIS_NOT_ALIGNED', 'measurement', pair, pair.some(group => group.origin === 'reported'), [], false, '目前的量測量或操作性分母不符合選定比較；不能靠單位字串直接換算。');
  if (design.comparisonMetric === 'recovered-activity-per-input-dry-mass') {
    for (const [flagName, observedField, label] of [
      ['measureRecoveredVolume', 'actualRecoveredVolumeMl', '實際回收液量'],
      ['measureInputDryMass', 'inputDryMassG', '投入乾物質量'],
    ]) {
      const scheduled = proposed.filter(group => group.plan.recovery[flagName] === true);
      const unscheduled = proposed.filter(group => group.plan.recovery[flagName] !== true);
      const reported = pair.filter(group => group.origin === 'reported');
      if (unscheduled.length) add('RECOVERY_MEASUREMENT_NOT_PLANNED', `recovery.${flagName}`, unscheduled, false, scheduled.map(group => group.groupId), false, `尚未安排量測${label}。`);
      if (scheduled.length) add('RECOVERY_MEASUREMENT_NEEDS_OBSERVATION', `recovery.${observedField}`, scheduled, false, scheduled.map(group => group.groupId), true, `已安排量測${label}，尚無觀察值。`);
      if (reported.length) add('RECOVERY_OBSERVATION_UNREPORTED', `recovery.${observedField}`, reported, true, scheduled.map(group => group.groupId), true, `來源未報${label}；50mL加液計畫不能補成回收液量。`);
    }
    const plannedChecks = proposed.filter(group => (filled(group.plan.recovery.blank) && group.plan.recovery.blank !== 'none-planned') || (filled(group.plan.recovery.spikePlan) && group.plan.recovery.spikePlan !== 'none-planned'));
    add('RECOVERY_VALIDATION_NEEDS_OBSERVATION', 'recovery.extractionRecoveryFraction', pair, pair.some(group => group.origin === 'reported'), plannedChecks.map(group => group.groupId), true, '空白與前後加標只是待執行的回收／基質檢核；不保證代表所有內源酵素，也不產生回收率。');
  }
  if (design.questionKind === 'mechanism-investigation') {
    for (const mechanism of ['local-oxygen', 'mixing', 'shear']) add('MECHANISM_NOT_IDENTIFIED', mechanism, pair, pair.some(group => group.origin === 'reported'), mechanism === design.comparisonMetric ? proposed.map(group => group.groupId) : [], true, '需要直接觀察及能區分機制的處理設計；rpm差異本身不能指定唯一機制。');
  }
  return gaps;
}
export function evaluatePair(raw, source) {
  const normalized = normalizeDesignInputs(raw, source);
  if (!normalized.ok) return response('evaluation', null, normalized.errors);
  const design = normalized.design;
  const groups = resolved(design, source);
  const pair = design.pair.map(id => groups.find(group => group.groupId === id));
  const measurementCompatibility = compatibility(design, pair);
  const reportedGroupIds = pair.filter(group => group.origin === 'reported').map(group => group.groupId);
  const unmeasuredGroupIds = pair.filter(group => group.origin === 'proposed').map(group => group.groupId);
  return response('evaluation', {
    pair: [...design.pair], question: question(design, pair), measurementCompatibility,
    observationAvailability: { status: reportedGroupIds.length === 2 ? 'two-reported' : reportedGroupIds.length === 1 ? 'one-unmeasured' : 'both-unmeasured', reportedGroupIds, unmeasuredGroupIds },
    descriptiveComparison: describe(pair, measurementCompatibility, source),
    causalAttribution: attribution(design, pair, matrix(design, groups)),
    missingEvidence: missingEvidence(design, pair, measurementCompatibility),
  });
}
