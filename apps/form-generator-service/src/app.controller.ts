import { Controller, Header, StreamableFile } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { FormGeneratorService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly formGeneratorService: FormGeneratorService) {}

  @MessagePattern({ cmd: 'form.generate' })
  @Header('Content-Type', 'application/json; charset=utf-8')
  async generateFormObject(payload: { data: string }) {
    console.log('Received payload:', payload);

    const generatedFormAsJSON = this.formGeneratorService.generateFormStream(
      payload.data || '',
    );

    return generatedFormAsJSON
  }
}
