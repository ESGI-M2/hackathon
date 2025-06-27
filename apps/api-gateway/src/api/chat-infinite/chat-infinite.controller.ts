import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { chatSchema } from '../schemas';

@Controller()
export class ChatInfiniteController {
  constructor(private prisma: PrismaService) {}

  @Get('chat-infinite')
  listChats() {
    return this.prisma.chatInfinite.findMany({
      include: { steps: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('chat-infinite/:id')
  getChat(@Param('id') id: string) {
    return this.prisma.chatInfinite.findUnique({
      where: { id: Number(id) },
      include: { steps: true },
    });
  }

  @Post('chat-infinite')
  async createChat(@Body() body: unknown) {
    const { title, description, globalPrompt, steps } = chatSchema.parse(body);
    return this.prisma.chatInfinite.create({
      data: {
        title,
        description,
        globalPrompt,
        steps: {
          create: steps.map((s, idx) => ({
            prompt: s.prompt,
            dependencies: s.dependencies,
            idx,
          })),
        },
      },
      include: { steps: true },
    });
  }

  @Put('chat-infinite/:id')
  async updateChat(@Param('id') id: string, @Body() body: unknown) {
    const { title, description, globalPrompt, steps } = chatSchema.parse(body);
    await this.prisma.step.deleteMany({ where: { chatId: Number(id) } });
    return this.prisma.chatInfinite.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        globalPrompt,
        steps: {
          create: steps.map((s, idx) => ({
            prompt: s.prompt,
            dependencies: s.dependencies,
            idx,
          })),
        },
      },
      include: { steps: true },
    });
  }
}
