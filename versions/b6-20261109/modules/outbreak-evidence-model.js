/**
 * Deterministic evidence selection model. Selecting a card is a learning action,
 * not a quantitative causal estimator or an assertion that the investigation
 * lacked unselected evidence. Permanent source context is never a selected card.
 */
const LANES = [
  { id: 'genomic', label: '基因群聚', selectedStatus: 'limited' },
  { id: 'epidemiology', label: '流行病學', selectedStatus: 'support' },
  { id: 'traceback', label: '產品追溯', selectedStatus: 'support' },
  { id: 'timing', label: '時間相容性', selectedStatus: 'limited' }
];
const clone = value => structuredClone(value);
const unique = values => [...new Set(values)];

function validate(data, parameters) {
  if (!data || !Array.isArray(data.bundles) || !Array.isArray(data.sources)) {
    throw new TypeError('Outbreak data must contain bundles and sources.');
  }
  if (!parameters || typeof parameters.bundleId !== 'string') {
    throw new TypeError('bundleId must identify one source version.');
  }
  const bundle = data.bundles.find(item => item.id === parameters.bundleId);
  if (!bundle) throw new RangeError('Unknown outbreak bundle: ' + parameters.bundleId);
  const ids = parameters.includedEvidenceIds;
  if (!Array.isArray(ids)) throw new TypeError('includedEvidenceIds must be an array.');
  if (ids.some(id => typeof id !== 'string')) throw new TypeError('Evidence IDs must be strings.');
  if (new Set(ids).size !== ids.length) throw new RangeError('Duplicate evidence IDs are not allowed.');
  for (const id of ids) {
    if (!bundle.evidence.some(card => card.id === id)) {
      throw new RangeError('Evidence ' + id + ' is not selectable in bundle ' + bundle.id + '. Source versions cannot be mixed.');
    }
  }
  return bundle;
}

function resolveSources(data, refs) {
  const seen = new Set();
  return refs.flatMap(ref => {
    const key = ref.sourceId + '\u0000' + ref.locator;
    if (seen.has(key)) return [];
    seen.add(key);
    const source = data.sources.find(item => item.id === ref.sourceId);
    if (!source) throw new RangeError('Unknown source reference: ' + ref.sourceId);
    return [{ ...clone(source), sourceId: ref.sourceId, locator: ref.locator, locatorUrl: ref.url || source.url }];
  });
}

export function evaluateOutbreakEvidence(data, parameters) {
  const bundle = validate(data, parameters);
  const selectedIds = new Set(parameters.includedEvidenceIds);
  // Canonical order makes output independent of the order in which buttons were clicked.
  const selectedCards = clone(bundle.evidence.filter(card => selectedIds.has(card.id)));
  const contextCards = clone(bundle.contextCards || []);
  const analysisContext = clone(bundle.analysisContext || []);
  const lanes = LANES.map(lane => {
    const selected = selectedCards.filter(card => card.kind === lane.id);
    const context = contextCards.filter(card => card.kind === lane.id);
    const background = !selected.length && context.length > 0;
    return {
      id: lane.id, label: lane.label,
      status: selected.length ? lane.selectedStatus : background ? 'limited' : 'not-established',
      background,
      summary: selected.length ? selected.map(card => card.summary).join('；')
        : background ? '固定來源背景：' + context.map(card => card.summary).join('；')
        : '本次尚未納入這類支持；不能推定原調查沒有此證據。',
      evidenceIds: selected.map(card => card.id),
      contextIds: context.map(card => card.id)
    };
  });
  const has = id => lanes.some(lane => lane.id === id && lane.evidenceIds.length > 0);
  const hasTraceback = lanes.some(lane => lane.id === 'traceback' && (lane.evidenceIds.length || lane.contextIds.length));
  let headline;
  let firstLimit;
  if (!selectedCards.length) {
    headline = contextCards.length ? '尚未納入可選證據；既有來源背景仍保留' : '尚未納入證據，先保留判斷';
    firstLimit = '未納入不等於反證，也不能據此說原調查沒有支持。';
  } else if (has('genomic') && has('epidemiology') && hasTraceback) {
    headline = '多類證據共同支持工廠相關產品與病例群聚的關聯';
    firstLimit = '這些支持仍不能確定最初污染入口、精確開始時間或傳播方向。';
  } else if (has('genomic')) {
    headline = '已見基因群聚關聯，仍需整合其他證據';
    firstLimit = has('epidemiology')
      ? '本次仍未納入產品到工廠的追溯支持；基因與暴露關聯不能自行補出這段鏈。'
      : '基因群聚不能單獨證明共同來源；仍需病例暴露與產品鏈的交叉支持。';
  } else {
    headline = '已有部分調查線索，工廠關聯仍需交叉支持';
    firstLimit = '本次尚未納入基因群聚支持；已選線索不能單獨確定共同來源。';
  }
  const support = unique(selectedCards.flatMap(card => card.supports.map(text => card.label + '：' + text)));
  const missing = unique([
    firstLimit,
    ...lanes.filter(lane => lane.status === 'not-established').map(lane => lane.label + '：本次未納入支持，不表示原事件不存在這類證據。'),
    ...bundle.limitations,
    ...selectedCards.flatMap(card => card.limits.map(text => card.label + '：' + text)),
    ...contextCards.flatMap(card => card.limits.map(text => '固定來源背景／' + card.label + '：' + text)),
    ...analysisContext.flatMap(item => item.limits.map(text => item.label + '：' + text))
  ]);
  return {
    bundleId: bundle.id,
    headline, support, missing,
    // A missing or deselected card never generates contrary evidence.
    inconsistency: clone(bundle.inconsistencies || []),
    sourceCards: resolveSources(data, [
      ...selectedCards.flatMap(card => card.sourceRefs),
      ...contextCards.flatMap(card => card.sourceRefs),
      ...analysisContext.flatMap(item => item.sourceRefs),
      ...(bundle.issueSourceRefs || [])
    ]),
    selectedCards, contextCards, analysisContext, lanes
  };
}

