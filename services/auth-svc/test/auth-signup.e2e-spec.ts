/// <reference types="jest" />
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { prisma, resetDb } from './utils/db';

describe('AuthSvc (e2e) - POST /v1/auth/signup', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it('creates user, returns token and user payload, adds outbox event', async () => {
    const payload = { email: 'user1@example.com', password: 'Password123' };

    const res = await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send(payload)
      .expect(201);

    // Check response
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({
      email: payload.email,
      id: expect.any(String),
    });

    // Check user in DB
    const dbUser = await prisma.user.findUnique({
      where: { email: payload.email },
    });
    expect(dbUser).not.toBeNull();

    // Check outbox - verify it was created
    const outboxEvents = await prisma.outbox.findMany();
    expect(outboxEvents.length).toBeGreaterThan(0);
    expect(outboxEvents[0].type).toBe('user.created.v1');
    expect(outboxEvents[0].version).toBe(1);
    expect(outboxEvents[0].status).toBe('pending');

    // Verify payload structure
    expect(outboxEvents[0].payload).toMatchObject({
      id: expect.any(String),
      email: payload.email,
    });
  });

  it('rejects duplicate email with 401', async () => {
    const email = 'dupe@example.com';
    await prisma.user.create({ data: { email, passwordHash: 'x' } });

    const res = await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send({ email, password: 'Password123' })
      .expect(401);

    expect((res.body.message || '').toLowerCase()).toContain('email');
  });
});
