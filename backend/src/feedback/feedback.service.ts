import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DataStore, BurnFeedback } from '../common/data.store';
import { CreateFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly dataStore: DataStore) {}

  findAll(): BurnFeedback[] {
    return this.dataStore.feedbacks.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  findOne(id: string): BurnFeedback {
    const feedback = this.dataStore.feedbacks.find((f) => f.id === id);
    if (!feedback) {
      throw new NotFoundException(`反馈记录 ${id} 不存在`);
    }
    return feedback;
  }

  findByRecipe(recipeId: string): BurnFeedback[] {
    return this.dataStore.feedbacks.filter((f) => f.recipeId === recipeId);
  }

  create(dto: CreateFeedbackDto): BurnFeedback {
    const feedback: BurnFeedback = {
      id: uuidv4(),
      ...dto,
      recipeVersionId: dto.recipeVersionId,
      comments: dto.comments || '',
      optimizationSuggestion: dto.optimizationSuggestion || '',
      optimizationGenerated: false,
      createdAt: new Date().toISOString(),
    };
    this.dataStore.feedbacks.push(feedback);
    return feedback;
  }
}
