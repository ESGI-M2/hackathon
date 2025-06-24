import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class TestController {
  constructor(@Inject('TEST_SERVICE') private readonly aiClient: ClientProxy) {}

  @Get()
  getHello(): string {
    return 'Hello from TestController!';
  }

  @Get('test')
  testAI(@Query('q') q: string) {
    return this.aiClient.send({ cmd: 'test.hello' }, { data: q });
  }
}
