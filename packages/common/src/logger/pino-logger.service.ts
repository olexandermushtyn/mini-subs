import type { LoggerService } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class PinoLogger implements LoggerService {
  private readonly logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  });

  log(message: any, ...optional: any[]) {
    this.logger.info(message, ...optional);
  }

  error(message: any, ...optional: any[]) {
    this.logger.error(message, ...optional);
  }

  warn(message: any, ...optional: any[]) {
    this.logger.warn(message, ...optional);
  }

  debug(message: any, ...optional: any[]) {
    this.logger.debug(message, ...optional);
  }

  verbose(message: any, ...optional: any[]) {
    this.logger.trace(message, ...optional);
  }
}
