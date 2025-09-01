import { Module } from '@nestjs/common';
import { LoggerModule, RedisModule } from '@minisubs/common';
import { PrismaService } from './prisma/prisma.service';
import { EventsWorker } from './events/events.worker';
import { HealthController } from './health.controller';

@Module({
  imports: [
    LoggerModule,
    RedisModule.forRoot(),
  ],
  controllers: [HealthController],
  providers: [PrismaService, EventsWorker],
})
export class AppModule {}
