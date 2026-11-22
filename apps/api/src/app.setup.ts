import type { INestApplication } from '@nestjs/common';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { requestIdMiddleware } from './common/request-id.middleware.js';
import { setupSwagger } from './swagger.js';

export interface SetupOptions {
  version?: string;
  swagger?: boolean;
  corsOrigins?: string[];
}

export function configureApp(app: INestApplication, options: SetupOptions = {}): void {
  app.setGlobalPrefix('v1', { exclude: ['health', 'health/ready'] });
  app.use(requestIdMiddleware);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  if (options.corsOrigins && options.corsOrigins.length > 0) {
    app.enableCors({ origin: options.corsOrigins, credentials: true });
  }

  if (options.swagger !== false) {
    setupSwagger(app, options.version ?? '0.1.0');
  }
}
