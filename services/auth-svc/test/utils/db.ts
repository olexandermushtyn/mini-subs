import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

/** Hard reset of tables between tests */
export async function resetDb() {
  // conditional truncate for each table
  const result = await prisma.$queryRawUnsafe('select current_database()');
  const [{ current_database }] = result as { current_database: string }[];
  console.log('TEST DB:', current_database, process.env.DATABASE_URL);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ProcessedEvent') THEN
        EXECUTE 'TRUNCATE TABLE "ProcessedEvent" RESTART IDENTITY CASCADE';
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Outbox') THEN
        EXECUTE 'TRUNCATE TABLE "Outbox" RESTART IDENTITY CASCADE';
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
        EXECUTE 'TRUNCATE TABLE "User" RESTART IDENTITY CASCADE';
      END IF;
    END$$;
  `);
}
/** Small sleep for waiting for background timers (e.g. outbox publisher) */
export async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}
