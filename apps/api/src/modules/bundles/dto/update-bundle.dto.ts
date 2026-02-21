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
import { BundleItemInputDto, DisplayRuleInputDto, VolumeTierInputDto } from './create-bundle.dto';

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
}
