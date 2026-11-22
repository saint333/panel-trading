import { z } from 'zod';
import { nonNegativeMinorUnitsSchema } from './common.js';

export const ACCOUNT_TYPES = ['REAL', 'DEMO'] as const;

export const accountTypeSchema = z.enum(ACCOUNT_TYPES);

/** ISO 4217, siempre en mayúsculas. */
export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, 'Divisa inválida: usa el código ISO de 3 letras (EUR, USD...)');

export const accountNameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre es obligatorio')
  .max(80, 'El nombre no puede superar 80 caracteres');

export const createAccountSchema = z.object({
  name: accountNameSchema,
  type: accountTypeSchema,
  currency: currencySchema,
  /** Saldo con el que se abre la cuenta. Se registra como movimiento de apertura. */
  openingBalanceMinor: nonNegativeMinorUnitsSchema.optional().transform((value) => value ?? 0n),
});

export const updateAccountSchema = z
  .object({
    name: accountNameSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Nada que actualizar');

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
