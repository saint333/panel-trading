process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.API_VERSION = '0.1.0-test';
// Puerto cerrado a propósito: readiness debe fallar rápido y sin tocar datos reales.
process.env.DATABASE_URL =
  'postgresql://binomo:binomo@127.0.0.1:59999/binomo_test?schema=public&connect_timeout=2';
