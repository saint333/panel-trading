/**
 * Todo el dinero del proyecto vive en unidades menores enteras (céntimos).
 * Nunca se usa `number` para importes: `0.1 + 0.2` no es `0.3`.
 */
export const BPS_DENOMINATOR = 10_000n;

/**
 * División entera con redondeo half-up (el 0,5 se aleja de cero).
 * Solo se usa con divisores positivos; el PnL de una operación nunca es una
 * división por cero.
 */
export function roundHalfUpDiv(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    throw new RangeError('El denominador debe ser un entero positivo');
  }

  const isNegative = numerator < 0n;
  const absolute = isNegative ? -numerator : numerator;
  const rounded = (absolute + denominator / 2n) / denominator;

  return isNegative ? -rounded : rounded;
}

/** Valida un payout en puntos básicos: 8000 = 80,00 %. */
export function assertPayoutBps(payoutBps: number): void {
  if (!Number.isInteger(payoutBps) || payoutBps < 0 || payoutBps > 100_000) {
    throw new RangeError(
      `payoutBps debe ser un entero entre 0 y 100000 (recibido: ${String(payoutBps)})`,
    );
  }
}

/** Valida una cantidad de dinero en unidades menores. */
export function assertMinorUnits(value: bigint, field: string, allowZero = true): void {
  if (typeof value !== 'bigint') {
    throw new TypeError(`${field} debe ser bigint en unidades menores`);
  }
  if (value < 0n || (!allowZero && value === 0n)) {
    throw new RangeError(`${field} debe ser ${allowZero ? 'mayor o igual' : 'mayor'} que cero`);
  }
}
