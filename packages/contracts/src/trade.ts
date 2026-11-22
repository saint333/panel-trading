import { z } from 'zod';
import {
  isoDateTimeSchema,
  paginationSchema,
  payoutBpsSchema,
  positiveMinorUnitsSchema,
  tradeDirectionSchema,
  tradeResultSchema,
} from './common.js';

export const createTradeSchema = z
  .object({
    accountId: z.uuid(),
    assetSymbol: z
      .string()
      .trim()
      .min(1)
      .max(20)
      .transform((value) => value.toUpperCase()),
    direction: tradeDirectionSchema,
    stakeMinor: positiveMinorUnitsSchema,
    payoutBps: payoutBpsSchema,
    result: tradeResultSchema,
    openedAt: isoDateTimeSchema,
    durationSeconds: z.number().int().min(5).max(86_400),
    strategyId: z.uuid().optional(),
    notes: z.string().trim().max(2_000).optional(),
    externalId: z.string().trim().max(128).optional(),
  })
  .superRefine((value, ctx) => {
    const openedAt = Date.parse(value.openedAt);
    if (openedAt > Date.now() + 5 * 60_000) {
      ctx.addIssue({
        code: 'custom',
        path: ['openedAt'],
        message: 'La apertura no puede ser futura',
      });
    }
  });

export const tradeFilterSchema = paginationSchema
  .extend({
    accountId: z.uuid().optional(),
    assetSymbol: z.string().trim().max(20).optional(),
    result: tradeResultSchema.optional(),
    direction: tradeDirectionSchema.optional(),
    from: isoDateTimeSchema.optional(),
    to: isoDateTimeSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.from && value.to && Date.parse(value.from) > Date.parse(value.to)) {
      ctx.addIssue({
        code: 'custom',
        path: ['from'],
        message: 'El rango de fechas está invertido',
      });
    }
  });

export const tradeFinancialsSchema = z.object({
  stakeMinor: z.string(),
  payoutBps: z.number().int(),
  result: tradeResultSchema,
  netPnlMinor: z.string(),
});

export type CreateTradeInput = z.infer<typeof createTradeSchema>;
export type TradeFilterInput = z.infer<typeof tradeFilterSchema>;
