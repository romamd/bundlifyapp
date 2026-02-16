import { findOptimalDiscount } from '../discount-optimizer';

describe('findOptimalDiscount', () => {
  const items = [
    { price: 50, cogs: 15, shippingCost: 3, additionalCosts: 0, quantity: 1 },
    { price: 30, cogs: 8, shippingCost: 2, additionalCosts: 0, quantity: 1 },
  ];

  it('returns 0 when even 0% discount barely meets threshold', () => {
    // With very high COGS, any discount breaks profitability
    const expensiveItems = [
      { price: 20, cogs: 18, shippingCost: 1, additionalCosts: 0, quantity: 1 },
    ];

    const discount = findOptimalDiscount(expensiveItems, 2.9, 0.3, 15);
    expect(discount).toBe(0);
  });

  it('finds a reasonable discount for high-margin items', () => {
    const discount = findOptimalDiscount(items, 2.9, 0.3, 15);

    // Should find a discount > 0 since items have good margins
    expect(discount).toBeGreaterThan(0);
    expect(discount).toBeLessThanOrEqual(50);
  });

  it('returns higher discount when min margin is lower', () => {
    const strictDiscount = findOptimalDiscount(items, 2.9, 0.3, 30);
    const looseDiscount = findOptimalDiscount(items, 2.9, 0.3, 10);

    expect(looseDiscount).toBeGreaterThanOrEqual(strictDiscount);
  });

  it('never exceeds 50% discount', () => {
    // Even with ridiculously high-margin items
    const cheapItems = [
      { price: 100, cogs: 1, shippingCost: 0, additionalCosts: 0, quantity: 1 },
    ];

    const discount = findOptimalDiscount(cheapItems, 0, 0, 0);
    expect(discount).toBeLessThanOrEqual(50);
  });

  it('returns integer discount values', () => {
    const discount = findOptimalDiscount(items, 2.9, 0.3, 20);
    expect(discount).toBe(Math.floor(discount));
  });
});
