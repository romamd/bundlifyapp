export interface BundleCandidate {
  anchorAvgDailySales: number;
  companionDaysWithoutSale: number[];
  estimatedMarginPct: number;
}

/**
 * Higher score = better bundle candidate.
 * Weights: margin (50%), dead stock urgency (30%), anchor popularity (20%).
 */
export function scoreBundleCandidate(candidate: BundleCandidate): number {
  const marginScore = candidate.estimatedMarginPct;
  const deadStockUrgency = candidate.companionDaysWithoutSale.reduce(
    (max, d) => Math.max(max, d / 90),
    0,
  );
  const anchorPopularity = Math.min(
    candidate.anchorAvgDailySales / 5,
    1,
  );

  return marginScore * 0.5 + deadStockUrgency * 30 + anchorPopularity * 20;
}
