import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Session, User } from '@prisma/client';
import type {
  AuthResponse,
  AuthTokens,
  ChangePasswordInput,
  LoginInput,
  PublicUser,
  RegisterInput,
  SessionView,
} from '@binomo/contracts';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from './password.service.js';
import { TokensService } from './tokens.service.js';

export interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

type TxClient = Prisma.TransactionClient;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    timezone: user.timezone,
    locale: user.locale as PublicUser['locale'],
    createdAt: user.createdAt.toISOString(),
  };
}

function toSessionView(session: Session, currentSessionId: string): SessionView {
  return {
    id: session.id,
    userAgent: session.userAgent,
    current: session.id === currentSessionId,
    createdAt: session.createdAt.toISOString(),
    lastUsedAt: session.lastUsedAt?.toISOString() ?? null,
    expiresAt: session.expiresAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown, field: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }

  const target = error.meta?.target;
  const fields = Array.isArray(target) ? target.map(String) : [String(target)];
  return fields.includes(field);
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PasswordService) private readonly passwords: PasswordService,
    @Inject(TokensService) private readonly tokens: TokensService,
  ) {}

  async register(input: RegisterInput, meta: SessionMeta): Promise<AuthResponse> {
    const passwordHash = await this.passwords.hash(input.password);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: input.email,
            passwordHash,
            timezone: input.timezone,
            locale: input.locale,
            settings: { create: {} },
          },
        });

        return this.issueSession(tx, user, meta);
      });
    } catch (error) {
      // Carrera entre dos registros simultáneos: la restricción única decide.
      if (isUniqueViolation(error, 'email')) {
        throw new ConflictException('Ya existe una cuenta con ese correo');
      }

      throw error;
    }
  }

  async login(input: LoginInput, meta: SessionMeta): Promise<AuthResponse> {
    const user = await this.prisma.user.findFirst({
      where: { email: input.email, deletedAt: null },
    });

    if (!user) {
      await this.passwords.verifyAgainstDummy(input.password);
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const valid = await this.passwords.verify(user.passwordHash, input.password);

    if (!valid) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    return this.issueSession(this.prisma, user, meta);
  }

  /**
   * Rotación de refresh: el token usado se revoca y se emite uno nuevo.
   * Si llega un token ya revocado se asume robo y se cierran todas las sesiones del usuario.
   */
  async refresh(refreshToken: string, meta: SessionMeta): Promise<AuthTokens> {
    const hash = this.tokens.hashRefreshToken(refreshToken);
    const session = await this.prisma.session.findUnique({ where: { refreshTokenHash: hash } });

    if (!session) {
      throw new UnauthorizedException('Sesión no válida');
    }

    if (session.revokedAt) {
      await this.revokeAllSessions(session.userId);
      throw new UnauthorizedException('Sesión revocada: inicia sesión de nuevo');
    }

    const now = new Date();

    if (session.expiresAt <= now) {
      await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: now } });
      throw new UnauthorizedException('Sesión caducada: inicia sesión de nuevo');
    }

    // Solo una petición puede rotar el token; el resto se trata como reuso.
    const rotated = await this.prisma.session.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: now, lastUsedAt: now },
    });

    if (rotated.count !== 1) {
      await this.revokeAllSessions(session.userId);
      throw new UnauthorizedException('Sesión revocada: inicia sesión de nuevo');
    }

    const next = this.tokens.createRefreshToken();
    const created = await this.prisma.session.create({
      data: {
        userId: session.userId,
        refreshTokenHash: next.hash,
        userAgent: session.userAgent,
        ipHash: this.tokens.hashIp(meta.ip) ?? session.ipHash,
        expiresAt: next.expiresAt,
        lastUsedAt: now,
      },
    });

    // Limpieza oportunista: las sesiones caducadas ya no pueden usarse y, sin
    // esto, cada rotación deja una fila viva durante todo el TTL del refresh.
    await this.prisma.session.deleteMany({
      where: { userId: session.userId, expiresAt: { lt: now } },
    });

    const accessToken = await this.tokens.signAccessToken(session.userId, created.id);

    return {
      accessToken,
      refreshToken: next.token,
      accessTokenExpiresIn: this.tokens.accessTtlSeconds,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(
    userId: string,
    currentSessionId: string,
    input: ChangePasswordInput,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Sesión no válida');
    }

    const valid = await this.passwords.verify(user.passwordHash, input.currentPassword);

    if (!valid) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    const passwordHash = await this.passwords.hash(input.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      // Se cierran las demás sesiones; la actual sigue viva para no expulsar al usuario.
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null, id: { not: currentSessionId } },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async listSessions(userId: string, currentSessionId: string): Promise<SessionView[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => toSessionView(session, currentSessionId));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    // El filtro por `userId` evita que un usuario revoque sesiones ajenas (IDOR).
    const { count } = await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (count === 0) {
      throw new UnauthorizedException('Sesión no encontrada');
    }
  }

  async getPublicUser(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });

    if (!user) {
      throw new UnauthorizedException('Sesión no válida');
    }

    return toPublicUser(user);
  }

  private async issueSession(
    client: TxClient | PrismaService,
    user: User,
    meta: SessionMeta,
  ): Promise<AuthResponse> {
    const { session, refreshToken } = await this.createSession(client, user.id, meta);
    const accessToken = await this.tokens.signAccessToken(user.id, session.id);

    return {
      user: toPublicUser(user),
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.tokens.accessTtlSeconds,
    };
  }

  private async createSession(
    client: TxClient | PrismaService,
    userId: string,
    meta: SessionMeta,
  ): Promise<{ session: Session; refreshToken: string }> {
    const token = this.tokens.createRefreshToken();

    const session = await client.session.create({
      data: {
        userId,
        refreshTokenHash: token.hash,
        userAgent: meta.userAgent?.slice(0, 255) ?? null,
        ipHash: this.tokens.hashIp(meta.ip),
        expiresAt: token.expiresAt,
        lastUsedAt: new Date(),
      },
    });

    return { session, refreshToken: token.token };
  }

  private async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
