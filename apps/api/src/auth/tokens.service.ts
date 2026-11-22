import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  typ: 'access';
}

export interface RefreshToken {
  /** Token en claro: solo se entrega al cliente, nunca se persiste. */
  token: string;
  /** SHA-256 en hexadecimal, lo único que guarda la base de datos. */
  hash: string;
  expiresAt: Date;
}

@Injectable()
export class TokensService {
  constructor(
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  get accessTtlSeconds(): number {
    return this.config.get<number>('JWT_ACCESS_TTL_SECONDS') ?? 900;
  }

  private get refreshTtlDays(): number {
    return this.config.get<number>('REFRESH_TOKEN_TTL_DAYS') ?? 30;
  }

  signAccessToken(userId: string, sessionId: string): Promise<string> {
    const payload: AccessTokenPayload = { sub: userId, sid: sessionId, typ: 'access' };
    return this.jwt.signAsync(payload, { expiresIn: this.accessTtlSeconds });
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwt.verifyAsync<AccessTokenPayload>(token);
  }

  createRefreshToken(): RefreshToken {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000);

    return { token, hash: this.hashRefreshToken(token), expiresAt };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Se guarda un hash con sal para no almacenar IPs en claro. */
  hashIp(ip: string | undefined): string | null {
    if (!ip) return null;

    const secret = this.config.get<string>('IP_HASH_SECRET') ?? '';
    return createHash('sha256').update(`${secret}:${ip}`).digest('hex');
  }

  /** Comparación en tiempo constante, por si en algún punto se comparan tokens en claro. */
  safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);

    return left.length === right.length && timingSafeEqual(left, right);
  }
}
