import type { RedisOptions } from 'ioredis';

export type RedisModuleOptions = {
  url?: string;
  options?: RedisOptions;
};
