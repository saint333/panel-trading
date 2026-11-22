import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
  requestId: string;
  details?: { path: string; message: string }[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const headerRequestId = request.headers['x-request-id'];
    const requestId =
      typeof headerRequestId === 'string' && headerRequestId.length > 0
        ? headerRequestId
        : randomUUID();

    const body = this.buildBody(exception, requestId);
    const path = request.originalUrl ?? request.url;

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        { requestId, method: request.method, path, code: body.code, statusCode: body.statusCode },
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn({ requestId, method: request.method, path, code: body.code }, body.message);
    }

    response.setHeader('x-request-id', requestId);
    response.status(body.statusCode).json(body);
  }

  private buildBody(exception: unknown, requestId: string): ErrorBody {
    if (exception instanceof ZodError) {
      return {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        code: 'VALIDATION_ERROR',
        message: 'La petición no cumple el contrato',
        requestId,
        details: exception.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();
      const message =
        typeof payload === 'string'
          ? payload
          : typeof payload === 'object' && payload !== null && 'message' in payload
            ? String((payload as { message: unknown }).message)
            : exception.message;

      return {
        statusCode,
        code: HttpStatus[statusCode] ?? 'HTTP_ERROR',
        message,
        requestId,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
      requestId,
    };
  }
}
