import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // key: explicitly pass the URL from environment to PrismaClient
    super({ datasources: { db: { url: process.env.DATABASE_URL! } } });
  }

  async onModuleInit() {
    await this.$connect();
    const result = await this.$queryRawUnsafe('select current_database()');
    const [{ current_database }] = result as { current_database: string }[];
    console.log('APP DB:', current_database, process.env.DATABASE_URL);
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
