import { IsOptional, IsBoolean, IsNumber, IsString, Min, Max } from 'class-validator';

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
}
