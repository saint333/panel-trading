import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  type AuthResponse,
  type AuthTokens,
  type ChangePasswordInput,
  type LoginInput,
  type RegisterInput,
} from '@binomo/contracts';
import type { Request } from 'express';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AuthService, type SessionMeta } from './auth.service.js';
import { AccessTokenGuard } from './access-token.guard.js';

function sessionMeta(request: Request): SessionMeta {
  const userAgent = request.headers['user-agent'];

  return {
    userAgent: typeof userAgent === 'string' ? userAgent : undefined,
    ip: request.ip,
  };
}

@ApiTags('auth')
@Controller('auth')
@ApiTooManyRequestsResponse({ description: 'Demasiados intentos: espera antes de reintentar' })
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Crear cuenta y abrir sesión' })
  register(
    @Body(new ZodValidationPipe(registerSchema)) input: RegisterInput,
    @Req() request: Request,
  ): Promise<AuthResponse> {
    return this.auth.register(input, sessionMeta(request));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Req() request: Request,
  ): Promise<AuthResponse> {
    return this.auth.login(input, sessionMeta(request));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Rotar el refresh token y obtener un acceso nuevo' })
  @ApiUnauthorizedResponse({ description: 'Token revocado, reutilizado o caducado' })
  refresh(
    @Body(new ZodValidationPipe(refreshSchema)) input: { refreshToken: string },
    @Req() request: Request,
  ): Promise<AuthTokens> {
    return this.auth.refresh(input.refreshToken, sessionMeta(request));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar la sesión actual' })
  @ApiNoContentResponse({ description: 'Sesión revocada' })
  async logout(@CurrentUser() user: AuthUser): Promise<void> {
    await this.auth.logout(user.sessionId);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Cambiar la contraseña y cerrar las demás sesiones' })
  @ApiNoContentResponse({ description: 'Contraseña actualizada' })
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(changePasswordSchema)) input: ChangePasswordInput,
  ): Promise<void> {
    await this.auth.changePassword(user.userId, user.sessionId, input);
  }
}
