/// <reference types="jest" />
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { prisma, resetDb } from './utils/db';
import * as bcrypt from 'bcryptjs';

describe('AuthSvc (e2e) – POST /v1/auth/login', () => {
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

  it('logs in existing user and returns token', async () => {
    const email = 'loginuser@example.com';
    const password = 'Password123';
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { email, passwordHash },
    });

    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(201);

    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({ email });
  });

  it('rejects wrong password with 401', async () => {
    const email = 'badpass@example.com';
    const passwordHash = await bcrypt.hash('CorrectPass123', 10);

    await prisma.user.create({
      data: { email, passwordHash },
    });

    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password: 'WrongPass' })
      .expect(401);

    console.log(res.body);

    expect((res.body.message || '').toLowerCase()).toContain('invalid');
  });

  it('rejects non-existing user with 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'nouser@example.com', password: 'Password123' })
      .expect(401);

    expect((res.body.message || '').toLowerCase()).toContain('invalid');
  });
});
