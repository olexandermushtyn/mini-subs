// test/utils/make-auth-testbed.ts
import { Test } from '@nestjs/testing';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

export async function makeAuthTestbed() {
  const prismaMock = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    outbox: { create: jest.fn() },
  };
  const jwtMock = { signAsync: jest.fn().mockResolvedValue('token-123') };

  const mod = await Test.createTestingModule({
    providers: [
      AuthService,
      {
        provide: PrismaService,
        useValue: prismaMock,
      },
      {
        provide: JwtService,
        useValue: jwtMock,
      },
    ],
  }).compile();

  return {
    service: mod.get(AuthService),
    prismaMock,
    jwtMock: jwtMock as unknown as jest.Mocked<JwtService>,
  };
}
