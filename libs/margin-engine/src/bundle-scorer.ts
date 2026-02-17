export interface BundleCandidate {
  anchorAvgDailySales: number;
  companionDaysWithoutSale: number[];
  estimatedMarginPct: number;
  affinityScore?: number;
}

/**
 * Higher score = better bundle candidate.
 * Without affinity: margin (50%), dead stock urgency (30%), anchor popularity (20%).
 * With affinity: margin (40%), dead stock urgency (25%), anchor popularity (20%), affinity (15%).
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

  if (candidate.affinityScore !== undefined) {
    // When affinity data is available, redistribute weights:
    // margin 40%, dead stock 25%, anchor 20%, affinity 15%
    const affinityBonus = Math.min(candidate.affinityScore, 1);
    return (
      marginScore * 0.4 +
      deadStockUrgency * 25 +
      anchorPopularity * 20 +
      affinityBonus * 15
    );
  }

  return marginScore * 0.5 + deadStockUrgency * 30 + anchorPopularity * 20;
}
