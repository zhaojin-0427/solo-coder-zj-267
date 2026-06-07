import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { DataStore } from '../common/data.store';

@Module({
  controllers: [StatsController],
  providers: [StatsService, DataStore],
  exports: [StatsService],
})
export class StatsModule {}
