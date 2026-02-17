import { IsString, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateABTestDto {
  @IsString()
  @IsNotEmpty()
  bundleId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  @Max(50)
  variantDiscountPct!: number;
}
