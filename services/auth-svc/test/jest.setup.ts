import 'reflect-metadata';

// Check if we're running in Docker environment (when DATABASE_URL is not set by testcontainers)
if (!process.env.DATABASE_URL) {
  // Use Docker Compose environment variables
  process.env.DATABASE_URL =
    'postgresql://postgres:postgres@localhost:5433/auth_test';
  process.env.REDIS_URL = 'redis://localhost:6379';
}

process.env.OUTBOX_FLUSH_INTERVAL_MS = '200';
