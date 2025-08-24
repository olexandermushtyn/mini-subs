import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, LogLevel } from '@nestjs/common';

function resolveLogLevels(): LogLevel[] {
  const env = (process.env.LOG_LEVEL || 'log').toLowerCase();
  const allowed: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
  return allowed.includes(env as LogLevel)
    ? [env as LogLevel]
    : ['log', 'error', 'warn'];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: resolveLogLevels(),
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();
  await app.listen(
    process.env.PORT ? Number(process.env.PORT) : 3000,
    '0.0.0.0',
  );
}
bootstrap();
