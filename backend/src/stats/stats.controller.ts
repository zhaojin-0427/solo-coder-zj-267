import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('api/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  getAll() {
    return this.statsService.getAllStats();
  }

  @Get('overview')
  getOverview() {
    return this.statsService.getOverview();
  }

  @Get('scent-popularity')
  getScentPopularity() {
    return this.statsService.getScentPopularity();
  }

  @Get('recipe-optimization')
  getRecipeOptimization() {
    return this.statsService.getRecipeOptimization();
  }

  @Get('burn-time-compliance')
  getBurnTimeCompliance() {
    return this.statsService.getBurnTimeCompliance();
  }

  @Get('repurchase-distribution')
  getRepurchaseDistribution() {
    return this.statsService.getRepurchaseDistribution();
  }
}
