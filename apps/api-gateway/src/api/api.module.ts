import { Module } from '@nestjs/common';
import { ChatInfiniteController } from './chat-infinite/chat-infinite.controller';
import { ExtractionServiceController } from './extraction-service/extraction-service.controller';
import { UniversalChatController } from './universal-chat/universal-chat.controller';
import { ExtractorController } from './extractor/extractor.controller';
import { GenerativeFormController } from './generative-form/generative-form.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [
    ChatInfiniteController,
    ExtractionServiceController,
    UniversalChatController,
    ExtractorController,
    GenerativeFormController,
  ],
  providers: [PrismaService],
})
export class ApiModule {}
