import { Module } from '@nestjs/common';
import { TestModule } from './test/test.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [TestModule, ApiModule],
})
export class AppModule {}
