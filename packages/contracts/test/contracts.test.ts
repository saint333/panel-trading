import { describe, expect, it } from 'vitest';
import { createTradeSchema, loginSchema, registerSchema, tradeFilterSchema } from '../src/index.js';

const validTrade = {
  accountId: '018f5f3e-1c1a-7c3b-9d1e-2f4a6b8c0d1e',
  assetSymbol: 'eurusd',
  direction: 'CALL' as const,
  stakeMinor: '1000',
  payoutBps: 8_000,
  result: 'WIN' as const,
  openedAt: '2026-01-01T10:00:00.000Z',
  durationSeconds: 60,
};

describe('createTradeSchema', () => {
  it('acepta una operación válida y normaliza el activo', () => {
    const parsed = createTradeSchema.parse(validTrade);
    expect(parsed.assetSymbol).toBe('EURUSD');
    expect(parsed.stakeMinor).toBe(1_000n);
  });

  it('rechaza importes decimales o no positivos', () => {
    for (const stakeMinor of ['10.50', '0', '-100', 'abc', '']) {
      expect(createTradeSchema.safeParse({ ...validTrade, stakeMinor }).success).toBe(false);
    }
  });

  it('rechaza payouts fuera de rango', () => {
    for (const payoutBps of [-1, 100_001, 80.5]) {
      expect(createTradeSchema.safeParse({ ...validTrade, payoutBps }).success).toBe(false);
    }
  });

  it('rechaza resultados y direcciones desconocidos', () => {
    expect(createTradeSchema.safeParse({ ...validTrade, result: 'PENDING' }).success).toBe(false);
    expect(createTradeSchema.safeParse({ ...validTrade, direction: 'HOLD' }).success).toBe(false);
  });

  it('rechaza aperturas futuras', () => {
    const future = new Date(Date.now() + 60 * 60_000).toISOString();
    expect(createTradeSchema.safeParse({ ...validTrade, openedAt: future }).success).toBe(false);
  });

  it('rechaza duraciones no válidas y notas largas', () => {
    expect(createTradeSchema.safeParse({ ...validTrade, durationSeconds: 0 }).success).toBe(false);
    expect(createTradeSchema.safeParse({ ...validTrade, notes: 'x'.repeat(2_001) }).success).toBe(
      false,
    );
  });
});

describe('tradeFilterSchema', () => {
  it('aplica límite por defecto y convierte el límite de query', () => {
    expect(tradeFilterSchema.parse({}).limit).toBe(50);
    expect(tradeFilterSchema.parse({ limit: '10' }).limit).toBe(10);
  });

  it('rechaza un rango invertido', () => {
    const result = tradeFilterSchema.safeParse({
      from: '2026-02-01T00:00:00.000Z',
      to: '2026-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza límites fuera de rango', () => {
    expect(tradeFilterSchema.safeParse({ limit: '0' }).success).toBe(false);
    expect(tradeFilterSchema.safeParse({ limit: '101' }).success).toBe(false);
  });
});

describe('auth schemas', () => {
  it('normaliza el correo y exige contraseña de 12 caracteres', () => {
    const parsed = registerSchema.parse({
      email: '  User@Example.COM ',
      password: 'una-contrasena-larga',
    });
    expect(parsed.email).toBe('user@example.com');
    expect(parsed.timezone).toBe('UTC');
    expect(parsed.locale).toBe('es');

    expect(registerSchema.safeParse({ email: 'user@example.com', password: 'corta' }).success).toBe(
      false,
    );
  });

  it('rechaza correos inválidos en login', () => {
    expect(loginSchema.safeParse({ email: 'no-es-correo', password: 'x' }).success).toBe(false);
  });
});
