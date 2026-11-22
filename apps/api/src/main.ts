import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { parseCorsOrigins } from './config/env.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);

  configureApp(app, {
    version: config.get<string>('API_VERSION') ?? '0.1.0',
    corsOrigins: parseCorsOrigins(config.get<string>('CORS_ORIGINS') ?? ''),
  });

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
}

void bootstrap();
