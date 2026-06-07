import { Module } from '@nestjs/common';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';
import { DataStore } from '../common/data.store';

@Module({
  controllers: [RecipeController],
  providers: [RecipeService, DataStore],
  exports: [RecipeService],
})
export class RecipeModule {}
