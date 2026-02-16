import { scoreBundleCandidate } from '../bundle-scorer';

describe('scoreBundleCandidate', () => {
  it('scores a high-margin, popular anchor bundle', () => {
    const score = scoreBundleCandidate({
      anchorAvgDailySales: 10,
      companionDaysWithoutSale: [30],
      estimatedMarginPct: 40,
    });

    // margin: 40 * 0.5 = 20
    // dead stock: max(30/90) = 0.333 * 30 = 10
    // anchor: min(10/5, 1) = 1 * 20 = 20
    // total: 20 + 10 + 20 = 50
    expect(score).toBeCloseTo(50, 0);
  });

  it('scores a low-margin, high dead stock urgency bundle', () => {
    const score = scoreBundleCandidate({
      anchorAvgDailySales: 1,
      companionDaysWithoutSale: [180],
      estimatedMarginPct: 10,
    });

    // margin: 10 * 0.5 = 5
    // dead stock: max(180/90) = 2 * 30 = 60
    // anchor: min(1/5, 1) = 0.2 * 20 = 4
    // total: 5 + 60 + 4 = 69
    expect(score).toBeCloseTo(69, 0);
  });

  it('caps anchor popularity at 1', () => {
    const score1 = scoreBundleCandidate({
      anchorAvgDailySales: 5,
      companionDaysWithoutSale: [0],
      estimatedMarginPct: 20,
    });
    const score2 = scoreBundleCandidate({
      anchorAvgDailySales: 100,
      companionDaysWithoutSale: [0],
      estimatedMarginPct: 20,
    });

    // Both should have anchorPopularity capped at 1
    // margin: 20 * 0.5 = 10, dead stock: 0, anchor: 20
    expect(score1).toBeCloseTo(30, 0);
    expect(score2).toBeCloseTo(30, 0);
  });

  it('uses the max companion days for dead stock urgency', () => {
    const score = scoreBundleCandidate({
      anchorAvgDailySales: 0,
      companionDaysWithoutSale: [10, 90, 45],
      estimatedMarginPct: 0,
    });

    // margin: 0, dead stock: max(10/90, 90/90, 45/90) = 1 * 30 = 30, anchor: 0
    expect(score).toBeCloseTo(30, 0);
  });

  it('handles empty companions array', () => {
    const score = scoreBundleCandidate({
      anchorAvgDailySales: 5,
      companionDaysWithoutSale: [],
      estimatedMarginPct: 30,
    });

    // margin: 30 * 0.5 = 15, dead stock: 0, anchor: 1 * 20 = 20
    expect(score).toBeCloseTo(35, 0);
  });
});
