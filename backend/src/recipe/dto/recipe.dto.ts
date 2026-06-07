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

export class EssentialOilDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  percentage: number;
}

export class ScentLayerDto {
  @IsString()
  layer: string;

  @IsString()
  note: string;

  @IsString()
  description: string;
}

export class CreateRecipeDto {
  @IsString()
  name: string;

  @IsString()
  waxBase: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EssentialOilDto)
  @ArrayMinSize(1)
  essentialOils: EssentialOilDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScentLayerDto)
  @ArrayMinSize(1)
  scentLayers: ScentLayerDto[];

  @IsNumber()
  @Min(1)
  burnTimeEstimate: number;

  @IsArray()
  @IsString({ each: true })
  scenarios: string[];

  @IsArray()
  @IsString({ each: true })
  seasons: string[];

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateRecipeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  waxBase?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EssentialOilDto)
  @IsOptional()
  essentialOils?: EssentialOilDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScentLayerDto)
  @IsOptional()
  scentLayers?: ScentLayerDto[];

  @IsNumber()
  @Min(1)
  @IsOptional()
  burnTimeEstimate?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scenarios?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  seasons?: string[];

  @IsString()
  @IsOptional()
  description?: string;
}

export class RecommendRecipeDto {
  @IsString()
  @IsOptional()
  mood?: string;

  @IsString()
  @IsOptional()
  occasion?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scentPreferences?: string[];

  @IsString()
  @IsOptional()
  season?: string;
}
