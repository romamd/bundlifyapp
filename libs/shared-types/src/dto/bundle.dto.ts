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
  volumeTiers?: VolumeTierDto[];
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

export interface VolumeTierDto {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  discountPct: number;
  discountType: string;
  pricePerUnit: number | null;
  label: string | null;
}

export interface CreateBundleDto {
  name: string;
  type: string;
  discountPct: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  triggerType: string;
  items: { productId: string; quantity: number; isAnchor: boolean }[];
  displayRules?: { targetType: 'PRODUCT' | 'COLLECTION'; targetId: string }[];
  volumeTiers?: { minQuantity: number; maxQuantity?: number; discountPct: number; label?: string }[];
  minCartValue?: number;
  maxCartValue?: number;
  startsAt?: string;
  endsAt?: string;
}
