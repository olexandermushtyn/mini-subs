import type { DynamicModule, OnModuleDestroy} from '@nestjs/common';
import { Global, Inject,Module } from '@nestjs/common';
import type { Redis } from 'ioredis';
import IORedis from 'ioredis';

import { BULLMQ_CONNECTION, REDIS } from './redis.constants';
import type { RedisModuleOptions } from './redis.types';

@Global()
@Module({})
export class RedisModule implements OnModuleDestroy {
  @Inject(REDIS)
  private readonly redis!: Redis;

  static forRoot(opts: RedisModuleOptions = {}): DynamicModule {
    const url = opts.url ?? process.env.REDIS_URL ?? 'redis://localhost:6379';

    const redisProvider = {
      provide: REDIS,
      useFactory: () => (opts.options ? new IORedis(opts.options) : new IORedis(url)),
    };

    const bullmqConnProvider = {
      provide: BULLMQ_CONNECTION,
      useFactory: () => (opts.options ? opts.options : { url }),
    };

    return {
      module: RedisModule,
      providers: [redisProvider, bullmqConnProvider],
      exports: [redisProvider, bullmqConnProvider],
    };
  }

  async onModuleDestroy() {
    if (this.redis && (this.redis as any).status !== 'end') {
      try { await this.redis.quit(); } catch { /* ignore */ }
    }
  }
}
