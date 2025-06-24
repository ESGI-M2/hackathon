import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TestController } from './test.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'TEST_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'microservice-test',
          port: 4001,
        },
      },
    ]),
  ],
  controllers: [TestController],
  providers: [],
})
export class TestModule {}
