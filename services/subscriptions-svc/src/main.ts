import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PinoLogger } from '@minisubs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(PinoLogger));

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}
bootstrap();
