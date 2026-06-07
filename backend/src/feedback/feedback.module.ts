import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { DataStore } from '../common/data.store';

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackService, DataStore],
  exports: [FeedbackService],
})
export class FeedbackModule {}
