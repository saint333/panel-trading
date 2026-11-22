import { assertMinorUnits, assertPayoutBps, BPS_DENOMINATOR, roundHalfUpDiv } from './money.js';

export const TRADE_RESULTS = ['WIN', 'LOSS', 'DRAW', 'CANCELLED', 'OPEN'] as const;
export type TradeResult = (typeof TRADE_RESULTS)[number];

/** Resultados que ya afectan al saldo (un empate suma cero, pero está liquidado). */
export const SETTLED_RESULTS = ['WIN', 'LOSS', 'DRAW'] as const;

export function isSettledResult(result: TradeResult): boolean {
  return (SETTLED_RESULTS as readonly TradeResult[]).includes(result);
}

export interface TradeFinancials {
  stakeMinor: bigint;
  payoutBps: number;
  result: TradeResult;
  netPnlMinor: bigint;
}

/**
 * PnL neto de una operación, en unidades menores y sin coma flotante.
 *
 * - WIN: `round(stake × payoutBps / 10000)` half-up (el payout ya incluye el stake).
 * - LOSS: `-stake`.
 * - DRAW / CANCELLED / OPEN: `0`.
 */
export function computeNetPnlMinor(input: {
  stakeMinor: bigint;
  payoutBps: number;
  result: TradeResult;
}): bigint {
  const { stakeMinor, payoutBps, result } = input;

  assertMinorUnits(stakeMinor, 'stakeMinor', false);

  if (!(TRADE_RESULTS as readonly string[]).includes(result)) {
    throw new RangeError(`Resultado de operación inválido: ${String(result)}`);
  }

  if (result !== 'WIN') {
    return result === 'LOSS' ? -stakeMinor : 0n;
  }

  assertPayoutBps(payoutBps);

  return roundHalfUpDiv(stakeMinor * BigInt(payoutBps), BPS_DENOMINATOR);
}

/**
 * Calcula y valida los importes de una operación.
 * El cliente nunca envía `netPnlMinor`: lo deriva el dominio.
 */
export function buildTradeFinancials(input: {
  stakeMinor: bigint;
  payoutBps: number;
  result: TradeResult;
}): TradeFinancials {
  return {
    stakeMinor: input.stakeMinor,
    payoutBps: input.payoutBps,
    result: input.result,
    netPnlMinor: computeNetPnlMinor(input),
  };
}
