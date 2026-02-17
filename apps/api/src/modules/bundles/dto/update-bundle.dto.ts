import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  IsOptional,
  MinLength,
  Min,
  Max,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BundleItemInputDto, DisplayRuleInputDto } from './create-bundle.dto';

export class UpdateBundleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(['FIXED', 'MIX_MATCH', 'VOLUME', 'CROSS_SELL', 'DEAD_STOCK'] as const)
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
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => BundleItemInputDto)
  items?: BundleItemInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisplayRuleInputDto)
  displayRules?: DisplayRuleInputDto[];

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
}
