import type { ProductDto } from './product.dto';

export interface BundleUpsellDto {
  id: string;
  productId: string;
  product: ProductDto;
  discountType: string;
  discountValue: number;
  title: string;
  subtitle: string | null;
  selectedByDefault: boolean;
  matchQuantity: boolean;
  sortOrder: number;
}

export interface GiftTierDto {
  id: string;
  productId: string | null;
  giftType: string;
  unlockQuantity: number;
  label: string | null;
  lockedTitle: string;
  imageUrl: string | null;
  sortOrder: number;
}

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
  upsells?: BundleUpsellDto[];
  volumeTiers?: VolumeTierDto[];
  displayRules: BundleDisplayRuleDto[];
  giftsEnabled: boolean;
  giftsTitle: string;
  giftsSubtitle: string | null;
  giftTiers?: GiftTierDto[];
  countdownEnabled: boolean;
  countdownType: string;
  countdownDuration: number | null;
  countdownEndDate: string | null;
  countdownTitle: string | null;
  countdownBgColor: string;
  countdownTextColor: string;
  countdownTitleFontSize: number | null;
  countdownTitleFontWeight: string | null;
  countdownTitleAlignment: string;
  giftsLayout: string;
  giftsHideUntilUnlocked: boolean;
  giftsShowLockedLabels: boolean;
  lowStockAlertEnabled: boolean;
  skipToCheckout: boolean;
  customCss: string | null;
  translations: Record<string, Record<string, string>> | null;
  themeOverrides: Record<string, any> | null;
  currentRedemptions: number;
  bogoGetQuantity: number | null;
  bogoGetDiscountPct: number | null;
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
  upsells?: { productId: string; discountType: string; discountValue: number; title: string; subtitle?: string; selectedByDefault: boolean; matchQuantity: boolean }[];
  bogoGetQuantity?: number;
  bogoGetDiscountPct?: number;
  minCartValue?: number;
  maxCartValue?: number;
  startsAt?: string;
  endsAt?: string;
  giftsEnabled?: boolean;
  giftsTitle?: string;
  giftsSubtitle?: string;
  giftTiers?: { productId?: string; giftType: string; unlockQuantity: number; label?: string; lockedTitle?: string; imageUrl?: string }[];
  countdownEnabled?: boolean;
  countdownType?: string;
  countdownDuration?: number;
  countdownEndDate?: string;
  countdownTitle?: string;
  countdownBgColor?: string;
  countdownTextColor?: string;
  countdownTitleFontSize?: number;
  countdownTitleFontWeight?: string;
  countdownTitleAlignment?: string;
  giftsLayout?: string;
  giftsHideUntilUnlocked?: boolean;
  giftsShowLockedLabels?: boolean;
  lowStockAlertEnabled?: boolean;
  skipToCheckout?: boolean;
  customCss?: string;
  translations?: Record<string, Record<string, string>>;
  themeOverrides?: Record<string, any>;
}
