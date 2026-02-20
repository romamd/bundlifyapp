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

export class BundleItemInputDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsBoolean()
  isAnchor!: boolean;
}

export class DisplayRuleInputDto {
  @IsEnum(['PRODUCT', 'COLLECTION'] as const)
  targetType!: 'PRODUCT' | 'COLLECTION';

  @IsString()
  targetId!: string;
}

export class VolumeTierInputDto {
  @IsNumber()
  @Min(1)
  minQuantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxQuantity?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountPct!: number;

  @IsOptional()
  @IsString()
  label?: string;
}

export class CreateBundleDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(['FIXED', 'MIX_MATCH', 'VOLUME', 'CROSS_SELL', 'DEAD_STOCK'] as const)
  type!: string;

  @IsNumber()
  @Min(0)
  @Max(50)
  discountPct!: number;

  @IsEnum(['PERCENTAGE', 'FIXED_AMOUNT'] as const)
  discountType!: 'PERCENTAGE' | 'FIXED_AMOUNT';

  @IsString()
  triggerType!: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => BundleItemInputDto)
  items!: BundleItemInputDto[];

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
