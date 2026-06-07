import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { DataStore } from '../common/data.store';

@Module({
  controllers: [OrderController],
  providers: [OrderService, DataStore],
  exports: [OrderService],
})
export class OrderModule {}
