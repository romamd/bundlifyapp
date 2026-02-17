export interface DashboardDto {
  totalBundleRevenue: number;
  totalBundleMargin: number;
  bundleConversionRate: number;
  totalViews: number;
  totalClicks: number;
  totalAddToCarts: number;
  totalPurchases: number;
  topBundles: Array<{
    bundleId: string;
    name: string;
    revenue: number;
    margin: number;
    conversions: number;
  }>;
  deadStockValue: number;
  deadStockCount: number;
}

export interface StorefrontBundleDto {
  bundleId: string;
  name: string;
  bundlePrice: number;
  individualTotal: number;
  savingsAmount: number;
  savingsPct: number;
  items: Array<{
    shopifyProductId: string;
    shopifyVariantId: string | null;
    title: string;
    variantTitle: string | null;
    price: number;
    imageUrl: string | null;
    quantity: number;
    isAnchor: boolean;
  }>;
  abTestId?: string;
  abVariant?: 'control' | 'variant';
}

export interface TrackEventDto {
  bundleId: string;
  event: string;
  sessionId?: string;
  triggerType: string;
  pageUrl?: string;
  cartValue?: number;
  orderId?: string;
  revenue?: number;
  abTestId?: string;
  abVariant?: string;
}
