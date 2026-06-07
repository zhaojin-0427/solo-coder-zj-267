import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  IsEnum,
} from 'class-validator';

export type OrderStatus = 'pending' | 'producing' | 'completed';

export class CreateOrderDto {
  @IsString()
  customerName: string;

  @IsString()
  mood: string;

  @IsString()
  occasion: string;

  @IsArray()
  @IsString({ each: true })
  scentPreferences: string[];

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

  @IsString()
  @IsOptional()
  engraving?: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'producing', 'completed'])
  status: OrderStatus;
}
