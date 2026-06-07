import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VersionStatus } from '../../common/data.store';

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

  @IsString()
  @IsOptional()
  changeLog?: string;

  @IsEnum(['draft', 'pending_review', 'published', 'archived'])
  @IsOptional()
  status?: VersionStatus;
}

export class CreateRecipeVersionDto {
  @IsString()
  recipeId: string;

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

  @IsString()
  changeLog: string;

  @IsString()
  @IsOptional()
  baseVersionId?: string;

  @IsString()
  @IsOptional()
  sourceFeedbackId?: string;

  @IsEnum(['draft', 'pending_review', 'published', 'archived'])
  @IsOptional()
  status?: VersionStatus;
}

export class UpdateRecipeVersionDto {
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

  @IsString()
  @IsOptional()
  changeLog?: string;

  @IsEnum(['draft', 'pending_review', 'published', 'archived'])
  @IsOptional()
  status?: VersionStatus;
}

export class UpdateRecipeNameDto {
  @IsString()
  name: string;
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

export class GenerateOptimizationDto {
  @IsString()
  feedbackId: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class ReviewVersionDto {
  @IsString()
  action: 'publish' | 'reject';

  @IsString()
  @IsOptional()
  reviewNote?: string;
}
