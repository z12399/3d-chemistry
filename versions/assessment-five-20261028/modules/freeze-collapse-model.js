// Finite source-data selector. This does not predict a new drying condition.
const clone = value => structuredClone(value);
const unique = values => [...new Set(values)];
function refs(items) {
  return items.filter((item, i, all) => all.findIndex(other => other.sourceId === item.sourceId && other.locator === item.locator) === i);
}

export function evaluateFreezeCollapse(data, parameters) {
  if (!data || !data.drying || !data.structure || !Array.isArray(data.sources)) throw new TypeError('Freeze-collapse data are required.');
  if (!parameters || !['drying', 'structure'].includes(parameters.view)) throw new RangeError('Unknown freeze-collapse view.');
  const {view, caseId, seriesId} = parameters;
  const allowed = view === 'drying' ? ['view','seriesId','caseId'] : ['view','caseId'];
  if (Object.keys(parameters).some(key => !allowed.includes(key))) throw new RangeError('Only named source conditions are accepted; numerical extrapolation is not supported.');
  if (typeof caseId !== 'string') throw new TypeError('caseId must be a source condition ID.');
  const study = data[view];
  const selected = study.cases.find(item => item.id === caseId);
  if (!selected) throw new RangeError('Unknown or foreign case ID: ' + caseId);
  let series = null;
  let comparisons;
  if (view === 'drying') {
    series = study.series.find(item => item.id === seriesId);
    if (!series) throw new RangeError('Unknown drying comparison series.');
    if (!series.caseIds.includes(caseId)) throw new RangeError('Case is not measured in this comparison series.');
    comparisons = series.caseIds.map(id => {
      const row = study.cases.find(item => item.id === id);
      if (!row) throw new RangeError('Series refers to an unknown source condition.');
      return row;
    });
  } else comparisons = study.cases.filter(item => item.batchId === selected.batchId);
  const margin = view === 'drying' ? Math.round((study.tc.value - selected.temperature.mean) * 10) / 10 : null;
  const headline = view === 'drying'
    ? '最高產品溫度的報告均值低於此 FDM onset ' + margin.toFixed(1) + '°C；不能單憑溫差判定塌陷'
    : selected.macro.text;
  const findings = view === 'drying' ? [
    '邊緣瓶最高產品溫度的報告均值 ± SD：' + selected.temperature.meanText + ' ± ' + selected.temperature.sdText + '°C；中央瓶一次乾燥時間的報告均值 ± SD：' + selected.hours.meanText + ' ± ' + selected.hours.sdText + ' h。',
    series.summary,
    '兩個位置的實測彙整值分開保存；沒有合成單瓶的溫度時間歷程。',
    study.interpretation
  ] : [
    selected.macro.text,
    '表 III 厚度欄報值：' + selected.thickness.text + '；' + selected.thickness.method + '。',
    selected.micro.text,
    selected.micro.sampling,
    ...study.batchNotes,
    study.interpretation
  ];
  const sourceRefs = refs([...study.sourceRefs, ...comparisons.flatMap(row => row.sourceRefs)]);
  for (const item of sourceRefs) if (!data.sources.some(source => source.id === item.sourceId)) throw new RangeError('Unknown source reference: ' + item.sourceId);
  return clone({
    view, key: view === 'drying' ? view + ':' + seriesId + ':' + caseId : view + ':' + caseId,
    studyId: study.id, title: study.label, material: study.material,
    selectedCase: selected, series, comparisonCases: comparisons,
    headline, findings, limits: unique([...study.limits, ...selected.limits]), sourceRefs,
    temperatureDistanceToFdmOnset: view === 'drying' ? {value:margin,unit:'°C',meaning:'FDM onset minus reported edge-vial maximum point value; not a safety margin or collapse probability'} : null
  });
}
