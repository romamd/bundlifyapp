export interface MarginInput {
  price: number;
  cogs: number;
  shippingCost: number;
  additionalCosts: number;
  paymentProcessingPct: number;
  paymentProcessingFlat: number;
  discountPct?: number;
}

export interface MarginResult {
  effectivePrice: number;
  totalCost: number;
  processingFee: number;
  contributionMargin: number;
  contributionMarginPct: number;
  isProfitable: boolean;
}

export function calculateProductMargin(input: MarginInput): MarginResult {
  const effectivePrice =
    input.price * (1 - (input.discountPct || 0) / 100);
  const processingFee =
    effectivePrice * (input.paymentProcessingPct / 100) +
    input.paymentProcessingFlat;
  const totalCost =
    input.cogs + input.shippingCost + input.additionalCosts + processingFee;
  const contributionMargin = effectivePrice - totalCost;
  const contributionMarginPct =
    effectivePrice > 0 ? (contributionMargin / effectivePrice) * 100 : 0;

  return {
    effectivePrice,
    totalCost,
    processingFee,
    contributionMargin,
    contributionMarginPct,
    isProfitable: contributionMargin > 0,
  };
}

export interface BundleMarginInput {
  items: Array<{
    price: number;
    cogs: number;
    shippingCost: number;
    additionalCosts: number;
    quantity: number;
  }>;
  bundleDiscountPct: number;
  paymentProcessingPct: number;
  paymentProcessingFlat: number;
}

/**
 * For bundles, payment processing flat fee is charged once per order,
 * not per item.
 */
export function calculateBundleMargin(
  input: BundleMarginInput,
): MarginResult {
  const individualTotal = input.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );
  const bundlePrice =
    individualTotal * (1 - input.bundleDiscountPct / 100);

  const totalCogs = input.items.reduce(
    (sum, i) => sum + i.cogs * i.quantity,
    0,
  );
  const totalShipping = input.items.reduce(
    (sum, i) => sum + i.shippingCost * i.quantity,
    0,
  );
  const totalAdditional = input.items.reduce(
    (sum, i) => sum + i.additionalCosts * i.quantity,
    0,
  );
  const processingFee =
    bundlePrice * (input.paymentProcessingPct / 100) +
    input.paymentProcessingFlat;

  const totalCost =
    totalCogs + totalShipping + totalAdditional + processingFee;
  const contributionMargin = bundlePrice - totalCost;
  const contributionMarginPct =
    bundlePrice > 0 ? (contributionMargin / bundlePrice) * 100 : 0;

  return {
    effectivePrice: bundlePrice,
    totalCost,
    processingFee,
    contributionMargin,
    contributionMarginPct,
    isProfitable: contributionMargin > 0,
  };
}
