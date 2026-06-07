import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OilAmountDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateProductionDto {
  @IsString()
  orderId: string;

  @IsString()
  recipeId: string;

  @IsString()
  recipeName: string;

  @IsString()
  @IsOptional()
  recipeVersionId?: string;

  @IsString()
  @IsOptional()
  recipeVersion?: string;

  @IsNumber()
  @Min(0)
  waxAmount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OilAmountDto)
  @ArrayMinSize(1)
  essentialOilAmounts: OilAmountDto[];

  @IsNumber()
  @Min(0)
  pourTemperature: number;

  @IsNumber()
  @Min(0)
  coolTime: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
