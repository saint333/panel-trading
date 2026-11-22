import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  updateSettingsSchema,
  type SessionView,
  type UpdateSettingsInput,
  type UserSettingsView,
} from '@binomo/contracts';
import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { AuthService } from '../auth/auth.service.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { MeService, type MeOverview } from './me.service.js';

@ApiTags('me')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@UseGuards(AccessTokenGuard)
@Controller('me')
export class MeController {
  constructor(
    @Inject(MeService) private readonly me: MeService,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Perfil y ajustes del usuario autenticado' })
  overview(@CurrentUser() user: AuthUser): Promise<MeOverview> {
    return this.me.overview(user.userId);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Ajustes del usuario' })
  settings(@CurrentUser() user: AuthUser): Promise<UserSettingsView> {
    return this.me.settings(user.userId);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Actualizar tema, zona horaria, idioma o cuenta predeterminada' })
  updateSettings(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateSettingsSchema)) input: UpdateSettingsInput,
  ): Promise<UserSettingsView> {
    return this.me.updateSettings(user.userId, input);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Sesiones activas por dispositivo' })
  sessions(@CurrentUser() user: AuthUser): Promise<SessionView[]> {
    return this.auth.listSessions(user.userId, user.sessionId);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revocar una sesión concreta' })
  @ApiNoContentResponse({ description: 'Sesión revocada' })
  async revokeSession(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.auth.revokeSession(user.userId, id);
  }
}
