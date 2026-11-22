import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AccessTokenGuard } from '../src/auth/access-token.guard.js';
import type { TokensService } from '../src/auth/tokens.service.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';

const activeSession = { id: 's1', userId: 'u1' };

function makeContext(request: { headers: Record<string, string> }): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function setup() {
  const tokens = { verifyAccessToken: jest.fn() } as unknown as TokensService;
  const prisma = { session: { findFirst: jest.fn() } } as unknown as PrismaService;

  return { guard: new AccessTokenGuard(tokens, prisma), tokens, prisma };
}

describe('AccessTokenGuard', () => {
  it('rechaza una petición sin cabecera Bearer', async () => {
    const { guard } = setup();

    await expect(guard.canActivate(makeContext({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza un token con firma o formato inválido', async () => {
    const { guard, tokens } = setup();
    (tokens.verifyAccessToken as jest.Mock).mockRejectedValue(new Error('invalid signature'));

    await expect(
      guard.canActivate(makeContext({ headers: { authorization: 'Bearer roto' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un token que no sea de acceso', async () => {
    const { guard, tokens, prisma } = setup();
    (tokens.verifyAccessToken as jest.Mock).mockResolvedValue({ sub: 'u1', sid: 's1', typ: 'x' });

    await expect(
      guard.canActivate(makeContext({ headers: { authorization: 'Bearer token' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.session.findFirst).not.toHaveBeenCalled();
  });

  it('rechaza un token válido cuya sesión fue revocada o caducó', async () => {
    const { guard, tokens, prisma } = setup();
    (tokens.verifyAccessToken as jest.Mock).mockResolvedValue({
      sub: 'u1',
      sid: 's1',
      typ: 'access',
    });
    (prisma.session.findFirst as jest.Mock).mockResolvedValue(null);

    const request = { headers: { authorization: 'Bearer token' } };

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    // El usuario nunca llega al controlador.
    expect(request).not.toHaveProperty('user');
  });

  it('busca la sesión por id y usuario exigiendo que siga activa', async () => {
    const { guard, tokens, prisma } = setup();
    (tokens.verifyAccessToken as jest.Mock).mockResolvedValue({
      sub: 'u1',
      sid: 's1',
      typ: 'access',
    });
    (prisma.session.findFirst as jest.Mock).mockResolvedValue(activeSession);

    await guard.canActivate(makeContext({ headers: { authorization: 'Bearer token' } }));

    expect(prisma.session.findFirst).toHaveBeenCalledWith({
      where: {
        id: 's1',
        userId: 'u1',
        revokedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      select: { id: true, userId: true },
    });
  });

  it('acepta la petición y toma el usuario de la sesión, no del token', async () => {
    const { guard, tokens, prisma } = setup();
    (tokens.verifyAccessToken as jest.Mock).mockResolvedValue({
      sub: 'u1',
      sid: 's1',
      typ: 'access',
    });
    (prisma.session.findFirst as jest.Mock).mockResolvedValue(activeSession);

    const request: Record<string, unknown> = { headers: { authorization: 'Bearer token' } };

    await expect(guard.canActivate(makeContext(request as never))).resolves.toBe(true);
    expect(request.user).toEqual({ userId: 'u1', sessionId: 's1' });
  });

  it('no convierte un fallo de base de datos en un 401', async () => {
    const { guard, tokens, prisma } = setup();
    const failure = new Error('conexión perdida');
    (tokens.verifyAccessToken as jest.Mock).mockResolvedValue({
      sub: 'u1',
      sid: 's1',
      typ: 'access',
    });
    (prisma.session.findFirst as jest.Mock).mockRejectedValue(failure);

    await expect(
      guard.canActivate(makeContext({ headers: { authorization: 'Bearer token' } })),
    ).rejects.toBe(failure);
  });
});
