import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';

import { LoggerModule, RedisModule, BULLMQ_CONNECTION } from '@minisubs/common';
import { ConnectionOptions, Queue } from 'bullmq';
import { PublisherService } from './events/publisher.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    LoggerModule,
    RedisModule.forRoot(),
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: 'EVENTS_QUEUE',
      useFactory: (conn: ConnectionOptions) =>
        new Queue('events', { connection: conn }),
      inject: [BULLMQ_CONNECTION],
    },
    PublisherService,
  ],
})
export class AppModule {}
