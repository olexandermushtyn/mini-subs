/// <reference types="jest" />
import { INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';

@Module({
  controllers: [AuthController],
  // give a fake service to avoid DI breaking
  providers: [{ provide: AuthService, useValue: {} }],
})
class TestHealthModule {}

describe('GET /v1/auth/health (e2e)', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestHealthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close(); // закриваємо тільки якщо створили
  });

  it('returns { ok: true }', async () => {
    expect(app).toBeDefined();
    await request(app!.getHttpServer())
      .get('/v1/auth/health')
      .expect(200)
      .expect({ ok: true });
  });
});
