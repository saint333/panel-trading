import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app, { swagger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health responde 200 sin depender de la base de datos', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'binomo-analytics-api',
      version: '0.1.0-test',
    });
    expect(typeof response.body.uptimeSeconds).toBe('number');
  });

  it('GET /health/ready responde 503 cuando Postgres no está disponible', async () => {
    const response = await request(app.getHttpServer()).get('/health/ready').expect(503);

    expect(response.body).toMatchObject({
      statusCode: 503,
      message: 'Base de datos no disponible',
    });
    expect(typeof response.body.requestId).toBe('string');
  });

  it('respeta el x-request-id entrante y lo devuelve', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .set('x-request-id', 'req-de-prueba')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('req-de-prueba');
  });

  it('devuelve un error consistente con requestId en rutas inexistentes', async () => {
    const response = await request(app.getHttpServer()).get('/v1/no-existe').expect(404);

    expect(response.body).toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    expect(typeof response.body.requestId).toBe('string');
  });
});
