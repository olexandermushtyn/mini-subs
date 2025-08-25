const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  const pg = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('auth_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  // pass URL for Prisma/Nest in this Jest process
  process.env.DATABASE_URL = pg.getConnectionUri();
  process.env.NODE_ENV = 'test';
  global.__PG__ = pg;

  // apply ALL migrations for the newly created DB
  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'), // <- services/auth-svc
  });
};
