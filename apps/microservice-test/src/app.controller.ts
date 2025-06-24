import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  @MessagePattern({ cmd: 'test.hello' })
  handleHello(payload: { data: string }) {
    return `Response from microservice-test: ${payload.data}`;
  }
}
