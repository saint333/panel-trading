import { assertMinorUnits } from './money.js';
import { isSettledResult, type TradeResult } from './pnl.js';

export const TRANSACTION_TYPES = [
  'DEPOSIT',
  'WITHDRAWAL',
  'ADJUSTMENT',
  'COMMISSION',
  'BONUS',
  'CORRECTION',
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export interface FinancialMovement {
  type: TransactionType;
  /** Siempre en unidades menores. Depósitos, retiros, comisiones y bonos: positivo. */
  amountMinor: bigint;
}

export interface TradeForBalance {
  result: TradeResult;
  netPnlMinor: bigint;
}

/**
 * Signo de un movimiento según su tipo.
 * `ADJUSTMENT` y `CORRECTION` conservan el signo del importe (pueden ser negativos).
 */
export function movementSignedAmount(movement: FinancialMovement): bigint {
  const { type, amountMinor } = movement;

  if (!(TRANSACTION_TYPES as readonly string[]).includes(type)) {
    throw new RangeError(`Tipo de movimiento inválido: ${String(type)}`);
  }

  if (type === 'ADJUSTMENT' || type === 'CORRECTION') {
    if (amountMinor === 0n) {
      throw new RangeError(`${type} requiere un importe distinto de cero`);
    }
    return amountMinor;
  }

  assertMinorUnits(amountMinor, `${type}.amountMinor`, false);

  return type === 'DEPOSIT' || type === 'BONUS' ? amountMinor : -amountMinor;
}

/**
 * Saldo calculado, única fuente de verdad (BR-03).
 *
 * `opening + depósitos + bonos + ajustes − retiros − comisiones + Σ netPnl(WIN|LOSS|DRAW)`
 *
 * El PnL de una operación nunca se registra además como movimiento.
 */
export function computeBalanceMinor(input: {
  openingBalanceMinor: bigint;
  movements?: readonly FinancialMovement[];
  trades?: readonly TradeForBalance[];
}): bigint {
  const { openingBalanceMinor, movements = [], trades = [] } = input;

  assertMinorUnits(openingBalanceMinor, 'openingBalanceMinor');

  const fromMovements = movements.reduce(
    (total, movement) => total + movementSignedAmount(movement),
    0n,
  );

  const fromTrades = trades.reduce(
    (total, trade) => (isSettledResult(trade.result) ? total + trade.netPnlMinor : total),
    0n,
  );

  return openingBalanceMinor + fromMovements + fromTrades;
}

/** `saldoConfirmado − saldoCalculado`. Cero significa conciliado. */
export function computeReconciliationMinor(
  confirmedBalanceMinor: bigint,
  calculatedBalanceMinor: bigint,
): bigint {
  assertMinorUnits(confirmedBalanceMinor, 'confirmedBalanceMinor');
  assertMinorUnits(calculatedBalanceMinor, 'calculatedBalanceMinor');

  return confirmedBalanceMinor - calculatedBalanceMinor;
}
