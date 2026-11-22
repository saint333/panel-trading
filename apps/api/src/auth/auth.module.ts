import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from './access-token.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PasswordService } from './password.service.js';
import { TokensService } from './tokens.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get<number>('JWT_ACCESS_TTL_SECONDS') ?? 900 },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokensService, AccessTokenGuard],
  exports: [AccessTokenGuard, AuthService, TokensService],
})
export class AuthModule {}
