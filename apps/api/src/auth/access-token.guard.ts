import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { AccessTokenPayload } from './tokens.service.js';
import type { AuthenticatedRequest } from '../common/current-user.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TokensService } from './tokens.service.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(TokensService) private readonly tokens: TokensService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta el token de acceso');
    }

    let payload: AccessTokenPayload;

    try {
      payload = await this.tokens.verifyAccessToken(header.slice('Bearer '.length).trim());
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    if (payload.typ !== 'access') {
      throw new UnauthorizedException('Token no válido');
    }

    // La firma no basta: si la sesión se revocó (logout, cambio de contraseña,
    // reuso de refresh), el acceso debe dejar de valer al instante y no al
    // caducar el JWT.
    const session = await this.prisma.session.findFirst({
      where: {
        id: payload.sid,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true },
    });

    if (!session) {
      throw new UnauthorizedException('Sesión revocada o caducada');
    }

    request.user = { userId: session.userId, sessionId: session.id };
    return true;
  }
}
