import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  createAccountSchema,
  updateAccountSchema,
  type CreateAccountInput,
  type UpdateAccountInput,
} from '@binomo/contracts';
import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AccountsService, type AccountView } from './accounts.service.js';

@ApiTags('accounts')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@UseGuards(AccessTokenGuard)
@Controller('accounts')
export class AccountsController {
  constructor(@Inject(AccountsService) private readonly accounts: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cuentas del usuario' })
  list(
    @CurrentUser() user: AuthUser,
    @Query('includeArchived', new ParseBoolPipe({ optional: true })) includeArchived?: boolean,
  ): Promise<AccountView[]> {
    return this.accounts.list(user.userId, includeArchived ?? false);
  }

  @Post()
  @ApiOperation({ summary: 'Crear cuenta con saldo de apertura' })
  @ApiCreatedResponse({ description: 'Cuenta creada' })
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createAccountSchema)) input: CreateAccountInput,
  ): Promise<AccountView> {
    return this.accounts.create(user.userId, input);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cuenta' })
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<AccountView> {
    return this.accounts.get(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Renombrar una cuenta' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateAccountSchema)) input: UpdateAccountInput,
  ): Promise<AccountView> {
    return this.accounts.update(user.userId, id, input);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archivar una cuenta (borrado lógico)' })
  archive(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccountView> {
    return this.accounts.archive(user.userId, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restaurar una cuenta archivada' })
  restore(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccountView> {
    return this.accounts.restore(user.userId, id);
  }
}
