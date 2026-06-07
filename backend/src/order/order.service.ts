import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DataStore, Order } from '../common/data.store';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly dataStore: DataStore) {}

  findAll(status?: string): Order[] {
    let result = this.dataStore.orders;
    if (status) {
      result = result.filter((o) => o.status === status);
    }
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  findOne(id: string): Order {
    const order = this.dataStore.orders.find((o) => o.id === id);
    if (!order) {
      throw new NotFoundException(`订单 ${id} 不存在`);
    }
    return order;
  }

  create(dto: CreateOrderDto): Order {
    const order: Order = {
      id: uuidv4(),
      ...dto,
      engraving: dto.engraving || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.dataStore.orders.push(order);
    return order;
  }

  updateStatus(id: string, dto: UpdateOrderStatusDto): Order {
    const idx = this.dataStore.orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      throw new NotFoundException(`订单 ${id} 不存在`);
    }
    this.dataStore.orders[idx].status = dto.status;
    return this.dataStore.orders[idx];
  }

  remove(id: string): void {
    const idx = this.dataStore.orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      throw new NotFoundException(`订单 ${id} 不存在`);
    }
    this.dataStore.orders.splice(idx, 1);
  }
}
