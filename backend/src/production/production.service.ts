import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DataStore, ProductionRecord } from '../common/data.store';
import { CreateProductionDto } from './dto/production.dto';

@Injectable()
export class ProductionService {
  constructor(private readonly dataStore: DataStore) {}

  findAll(): ProductionRecord[] {
    return this.dataStore.productions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  findOne(id: string): ProductionRecord {
    const record = this.dataStore.productions.find((p) => p.id === id);
    if (!record) {
      throw new NotFoundException(`制作记录 ${id} 不存在`);
    }
    return record;
  }

  findByOrder(orderId: string): ProductionRecord[] {
    return this.dataStore.productions.filter((p) => p.orderId === orderId);
  }

  create(dto: CreateProductionDto): ProductionRecord {
    const record: ProductionRecord = {
      id: uuidv4(),
      ...dto,
      recipeVersionId: dto.recipeVersionId,
      recipeVersion: dto.recipeVersion,
      notes: dto.notes || '',
      createdAt: new Date().toISOString(),
    };
    this.dataStore.productions.push(record);

    const orderIdx = this.dataStore.orders.findIndex((o) => o.id === dto.orderId);
    if (orderIdx !== -1) {
      this.dataStore.orders[orderIdx].status = 'completed';
    }

    return record;
  }
}
