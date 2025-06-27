import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FormGeneratorController } from './form-generator.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'FORM_GENERATOR_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'form-generator-service',
          port: process.env.FORM_GENERATOR_SERVICE_PORT
            ? parseInt(process.env.FORM_GENERATOR_SERVICE_PORT, 10)
            : 3999,
        },
      },
    ]),
  ],
  controllers: [FormGeneratorController],
  providers: [],
})
export class FormGeneratorModule {}
