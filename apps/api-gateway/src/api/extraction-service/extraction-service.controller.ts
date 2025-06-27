import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { extractionServiceSchema } from '../schemas';

@Controller()
export class ExtractionServiceController {
  constructor(private prisma: PrismaService) {}

  @Get('extraction-service')
  listExtractionServices() {
    return this.prisma.extractionService.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('extraction-service/:id')
  getExtractionService(@Param('id') id: string) {
    return this.prisma.extractionService.findUnique({
      where: { id: Number(id) },
    });
  }

  @Post('extraction-service')
  createExtractionService(@Body() body: unknown) {
    const {
      title,
      schema,
      chatSteps = [],
      chatGlobalPrompt = '',
    } = extractionServiceSchema.parse(body);
    return this.prisma.extractionService.create({
      data: { title, schema, chatSteps, chatGlobalPrompt },
    });
  }

  @Put('extraction-service/:id')
  updateExtractionService(@Param('id') id: string, @Body() body: unknown) {
    const {
      title,
      schema,
      chatSteps = [],
      chatGlobalPrompt = '',
    } = extractionServiceSchema.parse(body);
    return this.prisma.extractionService.update({
      where: { id: Number(id) },
      data: { title, schema, chatSteps, chatGlobalPrompt },
    });
  }
}
