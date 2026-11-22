import { z } from 'zod';
import { TRADE_RESULTS } from '@binomo/domain';

export const MINOR_UNITS_PATTERN = /^-?\d{1,18}$/;

/** Importe en unidades menores. La API nunca acepta decimales en JSON. */
export const minorUnitsSchema = z
  .string()
  .regex(MINOR_UNITS_PATTERN, 'Importe inválido: usa enteros en unidades menores')
  .transform((value) => BigInt(value));

export const nonNegativeMinorUnitsSchema = minorUnitsSchema.refine(
  (value) => value >= 0n,
  'El importe no puede ser negativo',
);

export const positiveMinorUnitsSchema = minorUnitsSchema.refine(
  (value) => value > 0n,
  'El importe debe ser mayor que cero',
);

export const isoDateTimeSchema = z
  .string()
  .refine((value) => Number.isFinite(Date.parse(value)), 'Fecha ISO 8601 inválida');

export const tradeResultSchema = z.enum(TRADE_RESULTS);
export const tradeDirectionSchema = z.enum(['CALL', 'PUT']);

export const payoutBpsSchema = z.number().int().min(0).max(100_000);

export const paginationSchema = z.object({
  cursor: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const apiErrorSchema = z.object({
  statusCode: z.number().int(),
  code: z.string(),
  message: z.string(),
  requestId: z.string(),
  details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
