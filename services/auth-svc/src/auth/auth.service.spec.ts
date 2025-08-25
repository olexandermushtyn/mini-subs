/// <reference types="jest" />
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { makeAuthTestbed } from 'test/utils/make-auth-testbed';

describe('AuthService.signup (plain unit)', () => {
  let prismaMock: Pick<PrismaService, 'user' | 'outbox'>;
  let jwtMock: jest.Mocked<JwtService>;
  let service: AuthService;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      outbox: {
        create: jest.fn(),
      },
    } as any;

    jwtMock = {
      signAsync: jest.fn().mockResolvedValue('token-123'),
    } as any;

    service = new AuthService(prismaMock as any, jwtMock as any);
  });

  it('creates user, writes outbox, returns token', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaMock.user.create as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash: 'x',
    });
    (prismaMock.outbox.create as jest.Mock).mockResolvedValue({ id: 'evt1' });

    const res = await service.signup({
      email: 'a@b.com',
      password: 'Password123',
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'a@b.com' },
    });
    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(prismaMock.outbox.create).toHaveBeenCalled();
    expect(jwtMock.signAsync).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'a@b.com',
    });
    expect(res).toEqual({
      token: 'token-123',
      user: { id: 'u1', email: 'a@b.com' },
    });
  });

  it('signup works', async () => {
    const { service, prismaMock, jwtMock } = await makeAuthTestbed();
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash: 'x',
    });
    prismaMock.outbox.create.mockResolvedValue({ id: 'evt1' });

    const res = await service.signup({
      email: 'a@b.com',
      password: 'Password123',
    });

    expect(jwtMock.signAsync).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'a@b.com',
    });
    expect(res.user.email).toBe('a@b.com');
  });
});
