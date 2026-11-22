import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import type { Session, User } from '@prisma/client';
import { AuthService } from '../src/auth/auth.service.js';
import { PasswordService } from '../src/auth/password.service.js';
import { TokensService } from '../src/auth/tokens.service.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';

const config = {
  get: (key: string) =>
    ({
      JWT_ACCESS_TTL_SECONDS: 900,
      REFRESH_TOKEN_TTL_DAYS: 30,
      IP_HASH_SECRET: 'sal-de-pruebas-para-ip',
    })[key],
} as unknown as ConfigService;

const tokens = new TokensService(
  new JwtService({
    secret: 'secreto-de-pruebas-con-longitud-suficiente',
    signOptions: { expiresIn: 900 },
  }),
  config,
);
const passwords = new PasswordService();

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    userId: 'u1',
    refreshTokenHash: 'hash-antiguo',
    userAgent: 'jest',
    ipHash: null,
    expiresAt: new Date(Date.now() + 3_600_000),
    revokedAt: null,
    lastUsedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'usuario@ejemplo.com',
    passwordHash: 'hash',
    emailVerifiedAt: null,
    timezone: 'Europe/Madrid',
    locale: 'es',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

describe('AuthService.refresh', () => {
  const plainToken = 'token-de-refresco-de-prueba-1234567890';

  it('rota el token: revoca el usado y crea uno nuevo con hash distinto', async () => {
    const session = makeSession({ refreshTokenHash: tokens.hashRefreshToken(plainToken) });
    const prisma = {
      session: {
        findUnique: jest.fn().mockResolvedValue(session),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue(makeSession({ id: 's2' })),
        update: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    } as unknown as PrismaService;

    const result = await new AuthService(prisma, passwords, tokens).refresh(plainToken, {});

    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: { id: 's1', revokedAt: null },
      data: { revokedAt: expect.any(Date), lastUsedAt: expect.any(Date) },
    });

    const created = (prisma.session.create as jest.Mock).mock.calls[0][0].data;
    expect(created.refreshTokenHash).not.toBe(session.refreshTokenHash);
    expect(created.userId).toBe('u1');
    expect(result.refreshToken).not.toBe(plainToken);
    expect(result.accessTokenExpiresIn).toBe(900);
    expect(result.accessToken.split('.')).toHaveLength(3);

    // La tabla de sesiones no crece sin límite: se descartan las ya caducadas.
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', expiresAt: { lt: expect.any(Date) } },
    });
  });

  it('revoca todas las sesiones si llega un token ya revocado (reuso)', async () => {
    const session = makeSession({
      refreshTokenHash: tokens.hashRefreshToken(plainToken),
      revokedAt: new Date(),
    });
    const prisma = {
      session: {
        findUnique: jest.fn().mockResolvedValue(session),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(),
      },
    } as unknown as PrismaService;

    await expect(
      new AuthService(prisma, passwords, tokens).refresh(plainToken, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it('rechaza y revoca una sesión caducada', async () => {
    const session = makeSession({
      refreshTokenHash: tokens.hashRefreshToken(plainToken),
      expiresAt: new Date(Date.now() - 1_000),
    });
    const prisma = {
      session: {
        findUnique: jest.fn().mockResolvedValue(session),
        update: jest.fn().mockResolvedValue(session),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
    } as unknown as PrismaService;

    await expect(
      new AuthService(prisma, passwords, tokens).refresh(plainToken, {}),
    ).rejects.toThrow('caducada');

    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it('trata dos rotaciones simultáneas como reuso y cierra la cuenta', async () => {
    const session = makeSession({ refreshTokenHash: tokens.hashRefreshToken(plainToken) });
    const prisma = {
      session: {
        findUnique: jest.fn().mockResolvedValue(session),
        // Otra petición rotó primero: esta ya no encuentra la sesión activa.
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn(),
      },
    } as unknown as PrismaService;

    await expect(
      new AuthService(prisma, passwords, tokens).refresh(plainToken, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.session.updateMany).toHaveBeenLastCalledWith({
      where: { userId: 'u1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it('rechaza un token desconocido sin tocar sesiones', async () => {
    const prisma = {
      session: {
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn(),
      },
    } as unknown as PrismaService;

    await expect(
      new AuthService(prisma, passwords, tokens).refresh('token-inventado-de-1234567890', {}),
    ).rejects.toThrow('Sesión no válida');

    expect(prisma.session.updateMany).not.toHaveBeenCalled();
  });
});

describe('AuthService.revokeSession', () => {
  it('filtra por userId para que nadie revoque sesiones ajenas (IDOR)', async () => {
    const prisma = {
      session: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    } as unknown as PrismaService;

    await new AuthService(prisma, passwords, tokens).revokeSession('u1', 's1');

    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: { id: 's1', userId: 'u1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('responde no encontrada si la sesión no es del usuario', async () => {
    const prisma = {
      session: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    } as unknown as PrismaService;

    await expect(
      new AuthService(prisma, passwords, tokens).revokeSession('u1', 'ajena'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('AuthService.changePassword', () => {
  it('revoca las demás sesiones y mantiene la actual', async () => {
    const user = makeUser({ passwordHash: await passwords.hash('contraseña-actual-larga') });
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue(user),
      },
      session: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
      $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    } as unknown as PrismaService;

    await new AuthService(prisma, passwords, tokens).changePassword('u1', 's1', {
      currentPassword: 'contraseña-actual-larga',
      newPassword: 'contraseña-nueva-larga',
    });

    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', revokedAt: null, id: { not: 's1' } },
      data: { revokedAt: expect.any(Date) },
    });

    const updated = (prisma.user.update as jest.Mock).mock.calls[0][0].data.passwordHash as string;
    expect(updated).toMatch(/^\$argon2id\$/);
    expect(await passwords.verify(updated, 'contraseña-nueva-larga')).toBe(true);
  });

  it('rechaza el cambio si la contraseña actual no coincide', async () => {
    const user = makeUser({ passwordHash: await passwords.hash('contraseña-actual-larga') });
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(user), update: jest.fn() },
      session: { updateMany: jest.fn() },
      $transaction: jest.fn(),
    } as unknown as PrismaService;

    await expect(
      new AuthService(prisma, passwords, tokens).changePassword('u1', 's1', {
        currentPassword: 'otra-contraseña-larga',
        newPassword: 'contraseña-nueva-larga',
      }),
    ).rejects.toThrow('actual no es correcta');

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('AuthService.login', () => {
  it('no revela si el correo existe y responde igual en ambos casos', async () => {
    const prisma = {
      user: { findFirst: jest.fn().mockResolvedValue(null) },
      session: { create: jest.fn() },
    } as unknown as PrismaService;
    const auth = new AuthService(prisma, passwords, tokens);

    await expect(
      auth.login({ email: 'nadie@ejemplo.com', password: 'contraseña-larga' }, {}),
    ).rejects.toThrow('Correo o contraseña incorrectos');

    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it('rechaza credenciales válidas en formato pero incorrectas', async () => {
    const user = makeUser({ passwordHash: await passwords.hash('contraseña-correcta') });
    const prisma = {
      user: { findFirst: jest.fn().mockResolvedValue(user) },
      session: { create: jest.fn() },
    } as unknown as PrismaService;

    await expect(
      new AuthService(prisma, passwords, tokens).login(
        { email: 'usuario@ejemplo.com', password: 'contraseña-incorrecta' },
        {},
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.session.create).not.toHaveBeenCalled();
  });
});

describe('AuthService.register', () => {
  it('traduce el correo duplicado a 409 sin filtrar detalles internos', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('duplicado', {
      code: 'P2002',
      clientVersion: '6.19.3',
      meta: { target: ['email'] },
    });
    const prisma = {
      $transaction: jest.fn().mockRejectedValue(error),
    } as unknown as PrismaService;

    await expect(
      new AuthService(prisma, passwords, tokens).register(
        {
          email: 'usuario@ejemplo.com',
          password: 'contraseña-larga',
          timezone: 'UTC',
          locale: 'es',
        },
        {},
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
