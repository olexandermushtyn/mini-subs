import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Queue } from 'bullmq';
import { PinoLogger } from '@minisubs/common';

@Injectable()
export class PublisherService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    @Inject('EVENTS_QUEUE') private readonly queue: Queue,
    private readonly logger: PinoLogger,
  ) {}

  onModuleInit() {
    const intervalMs = Number(process.env.OUTBOX_FLUSH_INTERVAL_MS ?? 1000);
    this.timer = setInterval(
      () => this.flush().catch((err) => this.logger.error(err)),
      intervalMs,
    );
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async flush() {
    const events = await this.prisma.outbox.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    if (!events.length) return;

    this.logger.debug({ count: events.length }, 'publisher:found-pending');

    for (const evt of events) {
      try {
        await this.queue.add(
          evt.type,
          { ...evt, payload: evt.payload },
          { removeOnComplete: 100, removeOnFail: 100 },
        );

        // Use updateMany to avoid race conditions
        const result = await this.prisma.outbox.updateMany({
          where: {
            id: evt.id,
            status: 'pending',
          },
          data: { status: 'sent', sentAt: new Date() },
        });

        if (result.count > 0) {
          this.logger.log(
            { id: evt.id, type: evt.type, version: evt.version },
            'publisher:sent',
          );
        }
      } catch (error) {
        this.logger.error(
          { id: evt.id, type: evt.type, error },
          'publisher:failed-to-send',
        );
      }
    }
  }
}
