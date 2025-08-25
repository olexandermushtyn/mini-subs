const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { RedisContainer } = require('@testcontainers/redis');
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  const pg = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('auth_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  const redis = await new RedisContainer('redis:7-alpine').start();

  process.env.DATABASE_URL = pg.getConnectionUri();
  process.env.REDIS_URL = `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`;
  process.env.PRISMA_SKIP_ENV_LOAD = '1';
  process.env.NODE_ENV = 'test';

  global.__PG__ = pg;
  global.__REDIS__ = redis;

  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
  });
};
