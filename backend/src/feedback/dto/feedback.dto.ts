import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  productionId: string;

  @IsString()
  recipeId: string;

  @IsString()
  @IsOptional()
  recipeVersionId?: string;

  @IsNumber()
  @Min(0)
  actualBurnTime: number;

  @IsNumber()
  @Min(0)
  expectedBurnTime: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  scentStrength: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  scentDuration: number;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsString()
  @IsOptional()
  optimizationSuggestion?: string;
}
