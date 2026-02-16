import {
  calculateBundleMargin,
  type BundleMarginInput,
} from './margin-calculator';

/**
 * Binary-search the maximum discount % that keeps bundle margin >= threshold.
 */
export function findOptimalDiscount(
  items: BundleMarginInput['items'],
  paymentProcessingPct: number,
  paymentProcessingFlat: number,
  minMarginPct: number,
): number {
  let low = 0;
  let high = 50;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const result = calculateBundleMargin({
      items,
      bundleDiscountPct: mid,
      paymentProcessingPct,
      paymentProcessingFlat,
    });

    if (result.contributionMarginPct >= minMarginPct) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}
