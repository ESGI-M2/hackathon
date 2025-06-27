import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class FormGeneratorController {
  constructor(
    @Inject('FORM_GENERATOR_SERVICE')
    private readonly formGeneratorClient: ClientProxy,
  ) {}

  @Post('generate-form')
  testAI(
    @Body()
    body: {
      prompt: string;
    },
  ) {
    return this.formGeneratorClient.send(
      { cmd: 'form.generate' },
      { data: body.prompt || '' },
    );
  }
}
