import { Inject, Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Worker, Job, QueueBaseOptions } from 'bullmq';
import { BULLMQ_CONNECTION, PinoLogger } from '@minisubs/common';
import { PrismaService } from '../prisma/prisma.service';
import { USER_CREATED_V1, UserCreatedV1Schema } from '@minisubs/contracts';

const EVENTS_QUEUE_NAME = 'events';

@Injectable()
export class EventsWorker implements OnModuleInit, OnApplicationShutdown {
  private worker?: Worker;

  constructor(
    @Inject(BULLMQ_CONNECTION) private readonly conn: QueueBaseOptions['connection'],
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {}

  onModuleInit() {
    // Start worker with auto-retries and backoff
    this.worker = new Worker(
      EVENTS_QUEUE_NAME,
      (job) => this.handle(job),
      {
        connection: this.conn,
        // Global retry options (can also be set on queue.add)
        // attempts/backoff are applied to each job
        // (BullMQ v5: backoff as delay ms or strategy)
        // here simple linear backoff
        // @ts-expect-error types are permissive
        settings: { backoffStrategies: {} },
      },
    );
    // Don't block process in tests
    (this.worker as any).unref?.();

    this.worker.on('failed', (job, err) => {
      this.logger.error({ jobId: job?.id, err }, 'worker:failed');
    });
    this.worker.on('completed', (job) => {
      this.logger.debug({ jobId: job.id, name: job.name }, 'worker:completed');
    });

    this.logger.debug({ queue: EVENTS_QUEUE_NAME }, 'worker:started');
  }

  async onApplicationShutdown() {
    await this.worker?.close();
    this.logger.debug('worker:closed');
  }

  private async handle(job: Job<any, any, string>) {
    const { name: type, data } = job;

    // Determine event identifier:
    // - if producer (auth) puts the entire Outbox row in the job, there will be id
    // - fallback: job.id
    const evtId: string = data?.id ?? data?.eventId ?? String(job.id);

    switch (type) {
      case USER_CREATED_V1: {
        // Idempotency: if there is already an eventId for this service, skip
        try {
          await this.prisma.processedEvent.create({
            data: { eventId: evtId, service: 'subscriptions-svc' },
          });
        } catch {
          this.logger.warn({ evtId }, 'duplicate-event');
          return;
        }

          // Validate payload contract
        const payload = UserCreatedV1Schema.parse(data.payload);

        // Domain action: create subscriber
        await this.prisma.subscriber.create({
          data: {
            userId: payload.id,
            email: payload.email,
          },
        });

        this.logger.log({ evtId, type, email: payload.email }, 'subscriber:created');
        return;
      }

      default: {
        this.logger.debug({ evtId, type }, 'worker:unknown-event');
        return;
      }
    }
  }
}
