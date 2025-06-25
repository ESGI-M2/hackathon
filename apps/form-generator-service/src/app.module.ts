import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { FormGeneratorService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [FormGeneratorService],
})
export class AppModule {}
