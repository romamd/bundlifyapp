export interface ProductDto {
  id: string;
  shopifyProductId: string;
  shopifyVariantId: string | null;
  title: string;
  variantTitle: string | null;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  cogs: number | null;
  shippingCost: number | null;
  additionalCosts: number | null;
  contributionMargin: number | null;
  contributionMarginPct: number | null;
  inventoryQuantity: number;
  avgDailySales: number;
  daysWithoutSale: number;
  isDeadStock: boolean;
  imageUrl: string | null;
  status: string;
}

export interface UpdateCogsDto {
  cogs?: number;
  shippingCost?: number;
  additionalCosts?: number;
}

export interface BulkCogsRow {
  sku: string;
  cogs: number;
  shippingCost?: number;
  additionalCosts?: number;
}
