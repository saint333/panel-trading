import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthUser {
  userId: string;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/** El `userId` sale siempre del token, nunca del cuerpo ni de la URL. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user as AuthUser;
  },
);
