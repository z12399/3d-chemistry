import {BIOTICS_EVIDENCE_DATA} from './biotics-evidence-data.js';

export const BIOTICS_LAB_ID = 'biotics-evidence';
export const BIOTICS_CASES = BIOTICS_EVIDENCE_DATA.cases;

const STATE_KEYS = ['caseId', 'variantId', 'scopeId', 'enabledCardIds'];
const COMPARATORS = ['microorganism-alone', 'substrate-alone', 'control'];
const SCOPE_LABELS = {
  materialId: '材料／配方不同',
  dosePlanId: '使用量不同',
  hostId: '目標宿主不同',
  endpointId: '效益終點不同',
};
const STAGES = ['material', 'microbialAction', 'hostOutcome'];
const HOST_BENEFIT_CLAIMS = new Set([
  'probioticSpecificBenefit', 'adequateDose', 'prebioticBenefit', 'combinationBenefit',
  'hostBenefitComparison', 'postbioticBenefit',
]);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const unique = values => [...new Set(values)];

function choice(value, entries, name) {
  if (typeof value !== 'string') throw new TypeError(`${name} must be a string.`);
  const found = entries.find(entry => entry.id === value);
  if (!found) throw new RangeError(`Unknown ${name}: ${value}`);
  return found;
}

function caseById(caseId) {
  return choice(caseId, BIOTICS_CASES, 'caseId');
}

function visibleCards(caseData, variantId) {
  return caseData.cards.filter(card => card.variantIds.includes(variantId));
}

function readState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(state))) {
    throw new TypeError('State must be a plain object.');
  }
  if (Reflect.ownKeys(state).length !== STATE_KEYS.length || STATE_KEYS.some(key => !own(state, key))) {
    throw new TypeError(`State must contain exactly ${STATE_KEYS.join(', ')}.`);
  }
  const caseData = caseById(state.caseId);
  const variant = choice(state.variantId, caseData.variants, 'variantId');
  const scopePreset = choice(state.scopeId, caseData.scopes, 'scopeId');
  if (!caseData.supportedScopes.includes(state.scopeId)) throw new RangeError('Scope is not supported by this case.');
  if (!Array.isArray(state.enabledCardIds)
      || state.enabledCardIds.some(id => typeof id !== 'string')
      || unique(state.enabledCardIds).length !== state.enabledCardIds.length) {
    throw new TypeError('enabledCardIds must be an array of distinct string IDs.');
  }
  const visible = visibleCards(caseData, state.variantId);
  for (const id of state.enabledCardIds) choice(id, visible, 'enabled card');
  return {
    caseData, variant, scopePreset, visible,
    scope: {...caseData.baseScope, ...variant.scopePatch, ...scopePreset.patch},
  };
}

export function createBioticsState(caseId = 'live-culture') {
  const caseData = caseById(caseId);
  return {
    caseId,
    variantId: caseData.defaultVariantId,
    scopeId: 'original',
    enabledCardIds: visibleCards(caseData, caseData.defaultVariantId)
      .filter(card => card.defaultEnabled).map(card => card.id),
  };
}

export function setBioticsCardEnabled(state, cardId, enabled) {
  const {visible} = readState(state);
  choice(cardId, visible, 'cardId');
  if (typeof enabled !== 'boolean') throw new TypeError('enabled must be a boolean.');
  const chosen = new Set(state.enabledCardIds);
  if (enabled) chosen.add(cardId);
  else chosen.delete(cardId);
  return {...state, enabledCardIds: visible.filter(card => chosen.has(card.id)).map(card => card.id)};
}

export function setBioticsVariant(state, variantId) {
  const {caseData} = readState(state);
  choice(variantId, caseData.variants, 'variantId');
  if (variantId === state.variantId) return {...state, enabledCardIds: [...state.enabledCardIds]};
  return {...state, variantId, enabledCardIds: visibleCards(caseData, variantId)
    .filter(card => card.defaultEnabled).map(card => card.id)};
}

export function setBioticsScope(state, scopePresetId) {
  const {caseData} = readState(state);
  choice(scopePresetId, caseData.scopes, 'scopePresetId');
  if (!caseData.supportedScopes.includes(scopePresetId)) throw new RangeError('Scope is not supported by this case.');
  return {...state, scopeId: scopePresetId, enabledCardIds: [...state.enabledCardIds]};
}

function hasClaim(card, requirement) {
  return card.evidence.claims.some(claim => claim.id === requirement.claim
    && claim.subjectRef === requirement.subjectRef);
}

function covers(items, required) {
  return Array.isArray(items) && required.every(item => items.includes(item));
}

function qualifyingCard(card, requirement) {
  const evidence = card.evidence;
  if (!hasClaim(card, requirement) || evidence.finding !== 'supports') return false;
  if (HOST_BENEFIT_CLAIMS.has(requirement.claim)
      && (evidence.setting !== 'targetHost' || evidence.qualifiedHostEvidence !== true)) return false;
  if (requirement.claim === 'postbioticBenefit' && evidence.controlledStudyQuality !== 'high-quality-controlled') return false;
  if (requirement.claim === 'qualifiedFourArmDesign') {
    return evidence.qualifiedDesign === true && evidence.setting === 'targetHost'
      && covers(evidence.comparisonArms, ['combination', ...COMPARATORS]);
  }
  if (['selectiveUtilizationComparison', 'hostBenefitComparison'].includes(requirement.claim)) {
    return evidence.setting === 'targetHost' && covers(evidence.superiorAgainst, COMPARATORS)
      && (requirement.claim !== 'selectiveUtilizationComparison'
        || evidence.utilizer === 'coadministered-microorganism');
  }
  return true;
}

function sameStudyWitnesses(applicable) {
  const candidates = claim => applicable.filter(card => qualifyingCard(card, {claim, subjectRef: 'whole'}));
  const designs = candidates('qualifiedFourArmDesign');
  const uses = candidates('selectiveUtilizationComparison');
  const benefits = candidates('hostBenefitComparison');
  const same = (a, b) => a.studyId && a.studyId === b.studyId && a.interventionRef === b.interventionRef
    && ['materialId', 'dosePlanId', 'hostId'].every(key => a.scope[key] === b.scope[key]);
  for (const design of designs) {
    for (const use of uses) {
      for (const benefit of benefits) {
        if (same(design.evidence, use.evidence) && same(design.evidence, benefit.evidence)) {
          return [design, use, benefit];
        }
      }
    }
  }
  return [];
}

export function evaluateBioticsEvidence(state) {
  const {caseData, variant, scopePreset, visible, scope} = readState(state);
  const enabled = new Set(state.enabledCardIds);
  const cardStates = caseData.cards.map(card => {
    const isVisible = card.variantIds.includes(state.variantId);
    const mismatchKeys = card.evidence.scopeKeys.filter(key => card.evidence.scope[key] !== scope[key]);
    return {
      id: card.id,
      visible: isVisible,
      enabled: enabled.has(card.id),
      applicable: isVisible && mismatchKeys.length === 0,
      mismatches: mismatchKeys.map(key => SCOPE_LABELS[key] || key),
    };
  });
  const stateByCard = new Map(cardStates.map(card => [card.id, card]));
  const applicable = visible.filter(card => {
    const current = stateByCard.get(card.id);
    return current.enabled && current.applicable;
  });
  const studyWitnesses = sameStudyWitnesses(applicable);
  const assertions = caseData.assertions.map(assertion => {
    const exclusionsApply = Object.entries(variant.exclusionScope)
      .every(([key, value]) => scope[key] === value);
    const exclusions = exclusionsApply ? [...(variant.excludedAssertions[assertion.id] || [])] : [];
    const missing = [], missingIds = [], satisfied = [], evidenceCardIds = [], mismatches = [], reasons = [];
    for (const requirement of assertion.requirements) {
      const witnesses = requirement.claim === 'sameSynergisticStudy'
        ? studyWitnesses : applicable.filter(card => {
          if (!qualifyingCard(card, requirement)) return false;
          if (requirement.claim !== 'prebioticBenefit') return true;
          if (card.evidence.microbialPathwayLinked !== true) return false;
          return applicable.some(use => use.id === card.evidence.utilizationEvidenceRef
            && qualifyingCard(use, {claim: 'selectiveUtilization', subjectRef: requirement.subjectRef})
            && ['materialId', 'dosePlanId', 'hostId'].every(key => use.evidence.scope[key] === card.evidence.scope[key]));
        });
      if (witnesses.length) {
        satisfied.push(requirement.label);
        evidenceCardIds.push(...witnesses.map(card => card.id));
      } else {
        missing.push(requirement.label);
        missingIds.push(requirement.id);
        for (const card of visible.filter(card => hasClaim(card, requirement))) {
          const current = stateByCard.get(card.id);
          if (current.enabled && !current.applicable) {
            mismatches.push(`${card.shortLabel}：${current.mismatches.join('、')}；保留原研究，不直接沿用。`);
          }
        }
      }
    }
    const isComponent = assertion.subjectRef !== 'whole';
    let status = exclusions.length ? 'notFit' : missing.length ? 'insufficient' : 'supported';
    let supportedScope = null;
    if (status === 'supported' && isComponent) {
      const supportingCards = applicable.filter(card => evidenceCardIds.includes(card.id)
        && card.evidence.subjectRef === assertion.subjectRef);
      const scopeKeys = Object.keys(SCOPE_LABELS);
      const complete = supportingCards.length > 0 && supportingCards.every(card => scopeKeys.every(key =>
        typeof card.evidence.scope[key] === 'string' && card.evidence.scope[key].length > 0));
      const originalScopes = complete ? unique(supportingCards.map(card => JSON.stringify(
        Object.fromEntries(scopeKeys.map(key => [key, card.evidence.scope[key]]))))) : [];
      if (originalScopes.length === 1) supportedScope = JSON.parse(originalScopes[0]);
      else {
        status = 'insufficient';
        missing.push('成分原有效益證據的明確支持範圍');
        missingIds.push('componentEvidenceScope');
      }
    } else if (status === 'supported') supportedScope = {...scope};
    if (exclusions.length) reasons.push(...exclusions);
    if (status === 'supported') reasons.push(isComponent
      ? '成分原有受支持功能仍成立；支持限於該成分的原研究範圍，不代表新組合或其新終點已有支持。'
      : '目前假想證據支持所採定義；只限這份材料、使用方案、宿主與終點。');
    if (status === 'insufficient') reasons.push('目前適用證據尚未接齊；不等於已證明無效。');
    if (missingIds.includes('componentEvidenceScope')) {
      reasons.push('成分支持範圍未能確定；不把目前要求的組合終點當作原成分已支持的終點。');
    }
    if (!exclusionsApply && variant.excludedAssertions[assertion.id]?.length) {
      mismatches.push('原材料的已知身分排除不直接套用到新材料；新材料性質仍待確認。');
    }
    if (assertion.id === 'synergisticSynbiotic') {
      reasons.push('兩個證據端均須在同一合格四條件研究，支持組合優於 control 及各單成分；不套算術超加成門檻。');
    }
    if (assertion.id === 'probiotic' && caseData.id === 'live-culture') {
      reasons.push('此案例針對特定效益宣稱；不否認有文件支持的 shared-function 路線。');
    }
    if (assertion.id === 'postbiotic') {
      reasons.push('確認失活不等於無菌；本模型不設 CFU=0 或殘存活菌的通用門檻。');
    }
    return {
      id: assertion.id, label: assertion.label, subjectLabel: assertion.subjectLabel,
      subjectRef: `${state.caseId}:${state.variantId}:${assertion.subjectRef}`,
      status, missing, satisfied, reasons, mismatches: unique(mismatches),
      missingIds, evidenceCardIds: unique(evidenceCardIds),
      scope: isComponent && supportedScope ? {...supportedScope} : {...scope},
      requestedScope: {...scope}, supportedScope,
      scopeRole: isComponent && supportedScope ? 'original-component-evidence' : 'requested',
    };
  });
  return {
    caseId: state.caseId, variantId: state.variantId, scopeId: state.scopeId,
    primaryAssertionId: caseData.primaryAssertionId,
    ruleSetId: BIOTICS_EVIDENCE_DATA.ruleSetId,
    origin: 'hypothetical', scope: {...scope}, scopeLabel: scopePreset.label,
    fixedUseConditions: caseData.fixedUseConditions,
    assertions, cardStates,
    graph: {columns: STAGES.map(id => ({id, cardIds: visible.filter(card => card.stage === id).map(card => card.id)}))},
    limits: [...BIOTICS_EVIDENCE_DATA.limits],
  };
}
