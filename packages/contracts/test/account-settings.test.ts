import { describe, expect, it } from 'vitest';
import {
  createAccountSchema,
  registerSchema,
  updateAccountSchema,
  updateSettingsSchema,
} from '../src/index.js';

describe('createAccountSchema', () => {
  const base = { name: 'Cuenta real', type: 'REAL' as const, currency: 'eur' };

  it('normaliza la divisa y abre con saldo cero por defecto', () => {
    const parsed = createAccountSchema.parse(base);

    expect(parsed.currency).toBe('EUR');
    expect(parsed.openingBalanceMinor).toBe(0n);
  });

  it('acepta saldo inicial en unidades menores', () => {
    expect(
      createAccountSchema.parse({ ...base, openingBalanceMinor: '100000' }).openingBalanceMinor,
    ).toBe(100_000n);
  });

  it('rechaza divisas y saldos iniciales inválidos', () => {
    expect(createAccountSchema.safeParse({ ...base, currency: 'EURO' }).success).toBe(false);
    expect(createAccountSchema.safeParse({ ...base, openingBalanceMinor: '-1' }).success).toBe(
      false,
    );
    expect(createAccountSchema.safeParse({ ...base, openingBalanceMinor: '10.50' }).success).toBe(
      false,
    );
    expect(createAccountSchema.safeParse({ ...base, openingBalanceMinor: 100 }).success).toBe(
      false,
    );
  });

  it('exige al menos un campo al actualizar', () => {
    expect(updateAccountSchema.safeParse({}).success).toBe(false);
    expect(updateAccountSchema.parse({ name: ' Demo ' }).name).toBe('Demo');
  });
});

describe('updateSettingsSchema', () => {
  it('acepta zona horaria IANA, tema y cuenta predeterminada', () => {
    const parsed = updateSettingsSchema.parse({
      timezone: 'Europe/Madrid',
      theme: 'dark',
      defaultAccountId: null,
    });

    expect(parsed.timezone).toBe('Europe/Madrid');
    expect(parsed.theme).toBe('dark');
  });

  it('rechaza zonas horarias inventadas, temas desconocidos y objetos vacíos', () => {
    expect(updateSettingsSchema.safeParse({ timezone: 'Marte/Olympus' }).success).toBe(false);
    expect(updateSettingsSchema.safeParse({ theme: 'neon' }).success).toBe(false);
    expect(updateSettingsSchema.safeParse({}).success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('valida la zona horaria y normaliza el correo', () => {
    const parsed = registerSchema.parse({
      email: '  Usuario@Ejemplo.COM ',
      password: 'una-contraseña-larga',
      timezone: 'America/Bogota',
    });

    expect(parsed.email).toBe('usuario@ejemplo.com');
    expect(
      registerSchema.safeParse({ email: 'a@b.co', password: 'x'.repeat(12), timezone: 'UTC+2' })
        .success,
    ).toBe(false);
  });
});
