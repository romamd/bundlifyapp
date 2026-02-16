import type { ProductDto } from './product.dto';

export interface BundleDto {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  source: string;
  bundlePrice: number;
  individualTotal: number;
  discountPct: number;
  contributionMargin: number | null;
  contributionMarginPct: number | null;
  triggerType: string;
  items: BundleItemDto[];
  displayRules: BundleDisplayRuleDto[];
  currentRedemptions: number;
  startsAt: string | null;
  endsAt: string | null;
}

export interface BundleItemDto {
  id: string;
  productId: string;
  product: ProductDto;
  quantity: number;
  isAnchor: boolean;
  isDeadStock: boolean;
  sortOrder: number;
}

export interface BundleDisplayRuleDto {
  targetType: 'PRODUCT' | 'COLLECTION';
  targetId: string;
}

export interface CreateBundleDto {
  name: string;
  type: string;
  discountPct: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  triggerType: string;
  items: { productId: string; quantity: number; isAnchor: boolean }[];
  displayRules?: { targetType: 'PRODUCT' | 'COLLECTION'; targetId: string }[];
  minCartValue?: number;
  maxCartValue?: number;
  startsAt?: string;
  endsAt?: string;
}
