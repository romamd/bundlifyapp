import {
  calculateProductMargin,
  calculateBundleMargin,
} from '../margin-calculator';

describe('calculateProductMargin', () => {
  const baseInput = {
    price: 50,
    cogs: 20,
    shippingCost: 5,
    additionalCosts: 0,
    paymentProcessingPct: 2.9,
    paymentProcessingFlat: 0.3,
  };

  it('calculates margin for a typical product', () => {
    const result = calculateProductMargin(baseInput);

    expect(result.effectivePrice).toBe(50);
    expect(result.processingFee).toBeCloseTo(1.75, 2);
    expect(result.totalCost).toBeCloseTo(26.75, 2);
    expect(result.contributionMargin).toBeCloseTo(23.25, 2);
    expect(result.contributionMarginPct).toBeCloseTo(46.5, 1);
    expect(result.isProfitable).toBe(true);
  });

  it('applies discount correctly', () => {
    const result = calculateProductMargin({ ...baseInput, discountPct: 20 });

    expect(result.effectivePrice).toBe(40);
    expect(result.processingFee).toBeCloseTo(1.46, 2);
    expect(result.contributionMargin).toBeCloseTo(13.54, 2);
    expect(result.isProfitable).toBe(true);
  });

  it('handles zero price', () => {
    const result = calculateProductMargin({ ...baseInput, price: 0 });

    expect(result.effectivePrice).toBe(0);
    expect(result.contributionMarginPct).toBe(0);
    expect(result.isProfitable).toBe(false);
  });

  it('detects unprofitable product', () => {
    const result = calculateProductMargin({
      ...baseInput,
      price: 10,
      cogs: 20,
    });

    expect(result.isProfitable).toBe(false);
    expect(result.contributionMargin).toBeLessThan(0);
  });

  it('handles no discount (undefined)', () => {
    const result = calculateProductMargin({
      ...baseInput,
      discountPct: undefined,
    });

    expect(result.effectivePrice).toBe(50);
  });
});

describe('calculateBundleMargin', () => {
  const bundleInput = {
    items: [
      { price: 50, cogs: 20, shippingCost: 5, additionalCosts: 0, quantity: 1 },
      { price: 30, cogs: 10, shippingCost: 3, additionalCosts: 0, quantity: 1 },
    ],
    bundleDiscountPct: 10,
    paymentProcessingPct: 2.9,
    paymentProcessingFlat: 0.3,
  };

  it('calculates bundle margin with discount', () => {
    const result = calculateBundleMargin(bundleInput);

    // Individual total: 50 + 30 = 80
    // Bundle price: 80 * 0.9 = 72
    expect(result.effectivePrice).toBe(72);

    // Total COGS: 20 + 10 = 30
    // Total shipping: 5 + 3 = 8
    // Processing fee: 72 * 0.029 + 0.30 = 2.388
    expect(result.processingFee).toBeCloseTo(2.388, 2);

    // Total cost: 30 + 8 + 0 + 2.388 = 40.388
    expect(result.totalCost).toBeCloseTo(40.388, 2);

    // Margin: 72 - 40.388 = 31.612
    expect(result.contributionMargin).toBeCloseTo(31.612, 2);
    expect(result.isProfitable).toBe(true);
  });

  it('charges flat processing fee only once per bundle', () => {
    const result = calculateBundleMargin(bundleInput);

    // Fee should be: bundlePrice * pct + flat (once)
    // NOT: sum of per-item fees
    const expectedFee = 72 * 0.029 + 0.3;
    expect(result.processingFee).toBeCloseTo(expectedFee, 2);
  });

  it('handles multi-quantity items', () => {
    const result = calculateBundleMargin({
      ...bundleInput,
      items: [
        { price: 50, cogs: 20, shippingCost: 5, additionalCosts: 0, quantity: 3 },
      ],
      bundleDiscountPct: 15,
    });

    // Individual total: 50 * 3 = 150
    // Bundle price: 150 * 0.85 = 127.50
    expect(result.effectivePrice).toBe(127.5);
  });

  it('handles zero discount', () => {
    const result = calculateBundleMargin({
      ...bundleInput,
      bundleDiscountPct: 0,
    });

    expect(result.effectivePrice).toBe(80);
  });
});
