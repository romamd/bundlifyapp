import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  IsOptional,
  IsIn,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BundleItemInputDto, BundleUpsellInputDto, DisplayRuleInputDto, GiftTierInputDto, VolumeTierInputDto } from './create-bundle.dto';

export class UpdateBundleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(['FIXED', 'MIX_MATCH', 'VOLUME', 'CROSS_SELL', 'DEAD_STOCK', 'BOGO', 'COLLECTION'] as const)
  type?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'] as const)
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  discountPct?: number;

  @IsOptional()
  @IsEnum(['PERCENTAGE', 'FIXED_AMOUNT'] as const)
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';

  @IsOptional()
  @IsString()
  triggerType?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BundleItemInputDto)
  items?: BundleItemInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisplayRuleInputDto)
  displayRules?: DisplayRuleInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VolumeTierInputDto)
  volumeTiers?: VolumeTierInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleUpsellInputDto)
  upsells?: BundleUpsellInputDto[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  bogoGetQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bogoGetDiscountPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minCartValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCartValue?: number;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  giftsEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  giftsTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  giftsSubtitle?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GiftTierInputDto)
  giftTiers?: GiftTierInputDto[];

  @IsOptional()
  @IsBoolean()
  countdownEnabled?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['fixed', 'midnight', 'end_date'])
  countdownType?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440)
  countdownDuration?: number;

  @IsOptional()
  @IsString()
  countdownEndDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  countdownTitle?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  countdownBgColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/)
  countdownTextColor?: string;

  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(32)
  countdownTitleFontSize?: number;

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'bold'])
  countdownTitleFontWeight?: string;

  @IsOptional()
  @IsString()
  @IsIn(['left', 'center', 'right'])
  countdownTitleAlignment?: string;

  @IsOptional()
  @IsString()
  @IsIn(['vertical', 'horizontal'])
  giftsLayout?: string;

  @IsOptional()
  @IsBoolean()
  giftsHideUntilUnlocked?: boolean;

  @IsOptional()
  @IsBoolean()
  giftsShowLockedLabels?: boolean;

  @IsOptional()
  @IsBoolean()
  lowStockAlertEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  skipToCheckout?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  customCss?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  translations?: string;

  @IsOptional()
  themeOverrides?: Record<string, any>;
}
