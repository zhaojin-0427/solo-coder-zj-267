import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { RecipeModule } from './recipe/recipe.module';
import { OrderModule } from './order/order.module';
import { ProductionModule } from './production/production.module';
import { FeedbackModule } from './feedback/feedback.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    CommonModule,
    RecipeModule,
    OrderModule,
    ProductionModule,
    FeedbackModule,
    StatsModule,
  ],
})
export class AppModule {}
