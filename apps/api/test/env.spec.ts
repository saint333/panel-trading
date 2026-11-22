import { loadEnv, parseCorsOrigins } from '../src/config/env.js';

describe('loadEnv', () => {
  it('aplica valores por defecto', () => {
    expect(loadEnv({})).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'info',
      API_VERSION: '0.1.0',
    });
  });

  it('convierte el puerto y rechaza valores inválidos', () => {
    expect(loadEnv({ PORT: '4000' }).PORT).toBe(4000);
    expect(() => loadEnv({ PORT: '0' })).toThrow(/Configuración de entorno inválida/);
    expect(() => loadEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });
});

describe('parseCorsOrigins', () => {
  it('separa, recorta y descarta vacíos', () => {
    expect(parseCorsOrigins(' https://a.dev, https://b.dev , ')).toEqual([
      'https://a.dev',
      'https://b.dev',
    ]);
    expect(parseCorsOrigins('')).toEqual([]);
  });
});
