import { Module } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import { FormGeneratorModule } from './form-generator/form-generator.module';

@Module({
  imports: [FormGeneratorModule, ApiModule],
})
export class AppModule {}
