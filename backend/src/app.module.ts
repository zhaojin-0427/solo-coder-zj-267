import { Module } from '@nestjs/common';
import { RecipeModule } from './recipe/recipe.module';
import { OrderModule } from './order/order.module';
import { ProductionModule } from './production/production.module';
import { FeedbackModule } from './feedback/feedback.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    RecipeModule,
    OrderModule,
    ProductionModule,
    FeedbackModule,
    StatsModule,
  ],
})
export class AppModule {}
