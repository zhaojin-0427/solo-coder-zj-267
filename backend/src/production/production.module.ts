import { Module } from '@nestjs/common';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { DataStore } from '../common/data.store';

@Module({
  controllers: [ProductionController],
  providers: [ProductionService, DataStore],
  exports: [ProductionService],
})
export class ProductionModule {}
