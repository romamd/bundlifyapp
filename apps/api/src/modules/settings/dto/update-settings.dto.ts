import { IsOptional, IsBoolean, IsNumber, IsString, IsIn, Matches, Min, Max, MinLength, MaxLength } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  bundleWidgetEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  checkoutUpsellEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  exitIntentEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  autoGenerateBundles?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minBundleMarginPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxBundleProducts?: number;

  @IsOptional()
  @IsBoolean()
  includeDeadStock?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  deadStockDaysThreshold?: number;

  @IsOptional()
  @IsBoolean()
  showOnProductPage?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnCartPage?: boolean;

  @IsOptional()
  @IsBoolean()
  showAtCheckout?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnExitIntent?: boolean;

  @IsOptional()
  @IsBoolean()
  cartDrawerEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeShippingThreshold?: number;

  @IsOptional()
  @IsBoolean()
  multiCurrencyEnabled?: boolean;

  @IsOptional()
  @IsString()
  displayCurrency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultShippingCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  paymentProcessingPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentProcessingFlat?: number;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetPrimaryColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetPrimaryColorHover?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetTextColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetCardBackground?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetBadgeBackground?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetBadgeTextColor?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  widgetBorderRadius?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  widgetButtonText?: string;

  @IsOptional()
  @IsString()
  @IsIn(['vertical', 'horizontal'])
  widgetLayout?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  widgetCustomCss?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(24)
  widgetFontSize?: number;

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'bold'])
  widgetFontWeight?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetBorderColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetSecondaryTextColor?: string;

  @IsOptional()
  @IsBoolean()
  widgetShowSavings?: boolean;

  @IsOptional()
  @IsBoolean()
  widgetShowCompareAtPrice?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['none', 'subtle', 'medium', 'strong'])
  widgetCardShadow?: string;

  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(32)
  widgetBlockTitleFontSize?: number;

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'bold'])
  widgetBlockTitleFontWeight?: string;

  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(32)
  widgetItemTitleFontSize?: number;

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'bold'])
  widgetItemTitleFontWeight?: string;

  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(32)
  widgetSubtitleFontSize?: number;

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'bold'])
  widgetSubtitleFontWeight?: string;

  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(32)
  widgetPriceFontSize?: number;

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'bold'])
  widgetPriceFontWeight?: string;

  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(32)
  widgetBadgeFontSize?: number;

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'bold'])
  widgetBadgeFontWeight?: string;

  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(32)
  widgetButtonFontSize?: number;

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'bold'])
  widgetButtonFontWeight?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetSelectedBgColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetBlockTitleColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetTitleColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetSubtitleColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetPriceColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetOriginalPriceColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetLabelBgColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetLabelTextColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetButtonTextColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetSavingsBadgeBgColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetSavingsBadgeTextColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  widgetCardHoverBgColor?: string;
}
