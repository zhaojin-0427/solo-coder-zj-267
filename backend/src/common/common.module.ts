import { Module, Global } from '@nestjs/common';
import { DataStore } from './data.store';

@Global()
@Module({
  providers: [DataStore],
  exports: [DataStore],
})
export class CommonModule {}
