export interface ShopSettingsDto {
  bundleWidgetEnabled: boolean;
  checkoutUpsellEnabled: boolean;
  exitIntentEnabled: boolean;
  autoGenerateBundles: boolean;
  minBundleMarginPct: number;
  maxBundleProducts: number;
  includeDeadStock: boolean;
  deadStockDaysThreshold: number;
  showOnProductPage: boolean;
  showOnCartPage: boolean;
  showAtCheckout: boolean;
  showOnExitIntent: boolean;
  defaultShippingCost: number;
  paymentProcessingPct: number;
  paymentProcessingFlat: number;
}
