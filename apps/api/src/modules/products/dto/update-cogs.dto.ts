import { IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateCogsRequestDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  cogs?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  additionalCosts?: number;
}
