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
}
