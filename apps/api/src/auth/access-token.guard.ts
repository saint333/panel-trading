import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../common/current-user.decorator.js';
import { TokensService } from './tokens.service.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(@Inject(TokensService) private readonly tokens: TokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta el token de acceso');
    }

    try {
      const payload = await this.tokens.verifyAccessToken(header.slice('Bearer '.length).trim());

      if (payload.typ !== 'access') {
        throw new UnauthorizedException('Token no válido');
      }

      request.user = { userId: payload.sub, sessionId: payload.sid };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
