import { Module } from '@nestjs/common';
import { FormGeneratorModule } from './form-generator/form-generator.module';

@Module({
  imports: [FormGeneratorModule],
})
export class AppModule {}
