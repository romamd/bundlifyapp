import {
  IsArray,
  ValidateNested,
  IsString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class BulkCogsRowDto {
  @IsString()
  sku!: string;

  @IsNumber()
  @Min(0)
  cogs!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  additionalCosts?: number;
}

export class BulkImportCogsRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkCogsRowDto)
  rows!: BulkCogsRowDto[];
}
