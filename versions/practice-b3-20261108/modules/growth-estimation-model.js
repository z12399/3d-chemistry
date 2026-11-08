/** Descriptive, unweighted OLS of published log10 CFU/mL means against hours.
 * No kinetic phase detection, maximum-growth-rate fit, biological lag estimate,
 * replicate reconstruction, confidence interval, or food-safety prediction.
 */
export const GROWTH_ESTIMATION_LAB_ID = 'growth-estimation-lab';
export const GROWTH_ESTIMATION_VERSION = 'growth-estimation/v1';

const finite = (value, name) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
};
const checked = values => {
  if (values.some(value => !Number.isFinite(value))) throw new RangeError('Calculation exceeds the finite numeric range');
};

export function validateGrowthPoints(points) {
  if (!Array.isArray(points) || points.length < 2 || points.length > 1000) throw new RangeError('Two to 1000 observations required');
  const ids = new Set();
  for (const [index, point] of points.entries()) {
    if (!point || typeof point !== 'object' || typeof point.id !== 'string' || !point.id || ids.has(point.id)) throw new TypeError('Unique observation IDs required');
    finite(point.hours, 'Time'); finite(point.log10Mean, 'Published log10 mean');
    if (point.hours < 0 || (index && point.hours <= points[index - 1].hours)) throw new RangeError('Times must be nonnegative and strictly increasing');
    if (point.log10Sd !== null && point.log10Sd !== undefined) {
      finite(point.log10Sd, 'Published log10 SD');
      if (point.log10Sd < 0) throw new RangeError('SD must be nonnegative');
    }
    ids.add(point.id);
  }
  return true;
}

/** Inclusive source-index window. Returned points preserve all source values;
 * the selected means receive equal weight. SD is not used as inverse variance.
 */
export function fitGrowthWindow(points, startIndex, endIndex) {
  validateGrowthPoints(points);
  if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex) || startIndex < 0 || endIndex >= points.length || endIndex <= startIndex) throw new RangeError('Select at least two consecutive source observations');
  const selected = points.slice(startIndex, endIndex + 1), n = selected.length;
  const meanTime = selected.reduce((sum, p) => sum + p.hours, 0) / n;
  const meanLog10 = selected.reduce((sum, p) => sum + p.log10Mean, 0) / n;
  const sxx = selected.reduce((sum, p) => sum + (p.hours - meanTime) ** 2, 0);
  const sxy = selected.reduce((sum, p) => sum + (p.hours - meanTime) * (p.log10Mean - meanLog10), 0);
  const syy = selected.reduce((sum, p) => sum + (p.log10Mean - meanLog10) ** 2, 0);
  checked([meanTime, meanLog10, sxx, sxy, syy]);
  if (!(sxx > 0)) throw new RangeError('Time spread is below the numeric range');
  const slopeLog10PerHour = sxy / sxx, interceptLog10 = meanLog10 - slopeLog10PerHour * meanTime;
  const apparentRatePerHour = Math.LN10 * slopeLog10PerHour;
  const doublingHours = slopeLog10PerHour > 0 ? Math.LOG10E * Math.LN2 / slopeLog10PerHour : null;
  checked([slopeLog10PerHour, interceptLog10, apparentRatePerHour, doublingHours ?? 0]);
  const observations = points.map((p, index) => {
    const predictedLog10 = meanLog10 + slopeLog10PerHour * (p.hours - meanTime);
    const residualLog10 = p.log10Mean - predictedLog10;
    checked([predictedLog10, residualLog10]);
    return {...p, usedForFit: index >= startIndex && index <= endIndex, predictedLog10, residualLog10};
  });
  const fitting = observations.filter(p => p.usedForFit), excluded = observations.filter(p => !p.usedForFit);
  const sumSquared = ps => ps.reduce((sum, p) => sum + p.residualLog10 ** 2, 0);
  const sse = sumSquared(fitting), excludedSse = sumSquared(excluded);
  checked([sse, excludedSse]);
  const rSquared = syy > 0 ? Math.max(0, Math.min(1, 1 - sse / syy)) : null;
  return {
    startIndex, endIndex, startHours: selected[0].hours, endHours: selected.at(-1).hours,
    n, excludedCount: excluded.length, meanTime, meanLog10, slopeLog10PerHour,
    interceptLog10, apparentRatePerHour, doublingHours, rSquared,
    sseLog10Squared: sse, rmseLog10: Math.sqrt(sse / n), residualDf: n - 2,
    residualSdLog10: n > 2 ? Math.sqrt(sse / (n - 2)) : null,
    excludedRmseLog10: excluded.length ? Math.sqrt(excludedSse / excluded.length) : null,
    observations,
  };
}

/** Evaluate the fitted line at existing source times only. This intentionally
 * offers no arbitrary future-time or temperature predictor to the workbench.
 */
export function compareGrowthSeries(fit, points) {
  validateGrowthPoints(points);
  if (!fit || typeof fit !== 'object') throw new TypeError('A fitted line is required');
  for (const key of ['meanTime', 'meanLog10', 'slopeLog10PerHour']) finite(fit[key], key);
  const observations = points.map(p => {
    const predictedLog10 = fit.meanLog10 + fit.slopeLog10PerHour * (p.hours - fit.meanTime);
    const residualLog10 = p.log10Mean - predictedLog10;
    checked([predictedLog10, residualLog10]);
    return {...p, predictedLog10, residualLog10};
  });
  const sumSquared = observations.reduce((sum, p) => sum + p.residualLog10 ** 2, 0);
  checked([sumSquared]);
  return {n: observations.length, rmseLog10: Math.sqrt(sumSquared / observations.length), observations};
}

export function growthLogBasis(log10Value, basis = 'log10') {
  finite(log10Value, 'Log value');
  if (!['log10', 'ln'].includes(basis)) throw new RangeError('Supported log bases are log10 and ln');
  const value = basis === 'ln' ? log10Value * Math.LN10 : log10Value;
  checked([value]); return value;
}
