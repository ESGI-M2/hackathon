import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ApiController],
  providers: [PrismaService],
})
export class ApiModule {}
