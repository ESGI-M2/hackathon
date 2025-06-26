import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3999,
      },
    },
  );
  await app.listen();
}

bootstrap().catch((error) => {
  console.error('Error starting test microservice:', error);
  process.exit(1);
});
