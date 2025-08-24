/// <reference types="jest" />
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

const prismaMock: DeepPartial<PrismaService> = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  outbox: {
    create: jest.fn(),
  },
};

describe('AuthService.signup', () => {
  let service: AuthService;
  let jwt: JwtService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('token-123') },
        },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    jwt = moduleRef.get(JwtService);
  });

  it('creates user, writes outbox, returns token', async () => {
    (prismaMock.user!.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaMock.user!.create as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash: 'x',
    });
    (prismaMock.outbox!.create as jest.Mock).mockResolvedValue({ id: 'evt1' });

    const res = await service.signup({
      email: 'a@b.com',
      password: 'Password123',
    });

    expect(prismaMock.user!.findUnique).toHaveBeenCalledWith({
      where: { email: 'a@b.com' },
    });
    expect(prismaMock.user!.create).toHaveBeenCalled();
    expect(prismaMock.outbox!.create).toHaveBeenCalled();
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'u1', email: 'a@b.com' });
    expect(res).toEqual({
      token: 'token-123',
      user: { id: 'u1', email: 'a@b.com' },
    });
  });
});
