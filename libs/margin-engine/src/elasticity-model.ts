export interface DiscountDataPoint {
  discountPct: number;
  conversionRate: number;
}

export interface ElasticityResult {
  elasticity: number;
  rSquared: number;
  optimalDiscountPct: number;
  expectedConversionRate: number;
}

/**
 * Estimates price elasticity using log-linear regression on historical
 * discount-to-conversion-rate data points.
 *
 * Model: ln(conversionRate) = a + b * discountPct
 * Elasticity = b (the slope in the log-linear model)
 */
export function estimateElasticity(
  history: DiscountDataPoint[],
): ElasticityResult | null {
  if (history.length < 3) {
    return null;
  }

  // Filter out zero conversion rates for log transform
  const valid = history.filter((h) => h.conversionRate > 0);
  if (valid.length < 3) {
    return null;
  }

  const n = valid.length;
  const x = valid.map((h) => h.discountPct);
  const y = valid.map((h) => Math.log(h.conversionRate));

  // Simple linear regression: y = a + b*x
  const sumX = x.reduce((s, v) => s + v, 0);
  const sumY = y.reduce((s, v) => s + v, 0);
  const sumXY = x.reduce((s, v, i) => s + v * y[i], 0);
  const sumX2 = x.reduce((s, v) => s + v * v, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (Math.abs(denominator) < 1e-10) {
    return null;
  }

  const b = (n * sumXY - sumX * sumY) / denominator;
  const a = (sumY - b * sumX) / n;

  // R-squared
  const meanY = sumY / n;
  const ssTotal = y.reduce((s, v) => s + (v - meanY) ** 2, 0);
  const ssResidual = y.reduce((s, v, i) => s + (v - (a + b * x[i])) ** 2, 0);
  const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

  return {
    elasticity: b,
    rSquared,
    optimalDiscountPct: 0, // Will be set by findRevenueMaximizingDiscount
    expectedConversionRate: 0,
  };
}

/**
 * Find the discount percentage that maximizes expected revenue while
 * maintaining a minimum margin threshold.
 *
 * Revenue = price * (1 - discount/100) * conversionRate(discount)
 * where conversionRate(discount) = exp(a + b * discount)
 *
 * We search 0-50% in 0.5% increments for the revenue maximum.
 */
export function findRevenueMaximizingDiscount(
  history: DiscountDataPoint[],
  basePrice: number,
  totalCosts: number,
  minMarginPct: number,
): { discountPct: number; expectedRevenue: number; expectedMarginPct: number } | null {
  const valid = history.filter((h) => h.conversionRate > 0);
  if (valid.length < 3) {
    return null;
  }

  const n = valid.length;
  const x = valid.map((h) => h.discountPct);
  const y = valid.map((h) => Math.log(h.conversionRate));

  const sumX = x.reduce((s, v) => s + v, 0);
  const sumY = y.reduce((s, v) => s + v, 0);
  const sumXY = x.reduce((s, v, i) => s + v * y[i], 0);
  const sumX2 = x.reduce((s, v) => s + v * v, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (Math.abs(denominator) < 1e-10) return null;

  const b = (n * sumXY - sumX * sumY) / denominator;
  const a = (sumY - b * sumX) / n;

  let bestDiscount = 0;
  let bestRevenue = 0;
  let bestMarginPct = 0;

  for (let d = 0; d <= 50; d += 0.5) {
    const effectivePrice = basePrice * (1 - d / 100);
    const expectedConversion = Math.exp(a + b * d);
    const expectedRevenue = effectivePrice * expectedConversion;
    const marginPct =
      effectivePrice > 0
        ? ((effectivePrice - totalCosts) / effectivePrice) * 100
        : 0;

    if (marginPct >= minMarginPct && expectedRevenue > bestRevenue) {
      bestDiscount = d;
      bestRevenue = expectedRevenue;
      bestMarginPct = marginPct;
    }
  }

  return {
    discountPct: bestDiscount,
    expectedRevenue: bestRevenue,
    expectedMarginPct: bestMarginPct,
  };
}
