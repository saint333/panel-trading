import { describe, expect, it } from 'vitest';
import {
  computeBalanceMinor,
  computeReconciliationMinor,
  movementSignedAmount,
  type FinancialMovement,
} from '../src/index.js';

describe('movementSignedAmount', () => {
  it('suma depósitos y bonos', () => {
    expect(movementSignedAmount({ type: 'DEPOSIT', amountMinor: 50_000n })).toBe(50_000n);
    expect(movementSignedAmount({ type: 'BONUS', amountMinor: 2_000n })).toBe(2_000n);
  });

  it('resta retiros y comisiones', () => {
    expect(movementSignedAmount({ type: 'WITHDRAWAL', amountMinor: 20_000n })).toBe(-20_000n);
    expect(movementSignedAmount({ type: 'COMMISSION', amountMinor: 500n })).toBe(-500n);
  });

  it('los ajustes conservan su signo', () => {
    expect(movementSignedAmount({ type: 'ADJUSTMENT', amountMinor: -300n })).toBe(-300n);
    expect(movementSignedAmount({ type: 'CORRECTION', amountMinor: 300n })).toBe(300n);
  });

  it('rechaza importes inválidos', () => {
    expect(() => movementSignedAmount({ type: 'DEPOSIT', amountMinor: -1n })).toThrow(RangeError);
    expect(() => movementSignedAmount({ type: 'WITHDRAWAL', amountMinor: 0n })).toThrow(RangeError);
    expect(() => movementSignedAmount({ type: 'ADJUSTMENT', amountMinor: 0n })).toThrow(RangeError);
    expect(() => movementSignedAmount({ type: 'TRANSFER' as never, amountMinor: 1n })).toThrow(
      RangeError,
    );
  });
});

describe('computeBalanceMinor', () => {
  const movements: FinancialMovement[] = [
    { type: 'DEPOSIT', amountMinor: 50_000n },
    { type: 'WITHDRAWAL', amountMinor: 20_000n },
    { type: 'COMMISSION', amountMinor: 500n },
  ];

  it('F-18: reproduce el ejemplo de la documentación', () => {
    // 1 000,00 iniciales + 500,00 depósito + 80,00 ganancia − 100,00 pérdida
    // − 200,00 retiro − 5,00 comisión + 0,00 empate = 1 275,00
    const balance = computeBalanceMinor({
      openingBalanceMinor: 100_000n,
      movements,
      trades: [
        { result: 'WIN', netPnlMinor: 8_000n },
        { result: 'LOSS', netPnlMinor: -10_000n },
        { result: 'DRAW', netPnlMinor: 0n },
      ],
    });

    expect(balance).toBe(127_500n);
  });

  it('ignora operaciones canceladas y abiertas', () => {
    const balance = computeBalanceMinor({
      openingBalanceMinor: 10_000n,
      trades: [
        { result: 'CANCELLED', netPnlMinor: 0n },
        { result: 'OPEN', netPnlMinor: 0n },
      ],
    });

    expect(balance).toBe(10_000n);
  });

  it('F-19: el PnL no se contabiliza dos veces', () => {
    // Registrar el resultado como movimiento además de la operación duplicaría.
    const withTradeOnly = computeBalanceMinor({
      openingBalanceMinor: 100_000n,
      trades: [{ result: 'WIN', netPnlMinor: 8_000n }],
    });
    const withDuplicatedMovement = computeBalanceMinor({
      openingBalanceMinor: 100_000n,
      movements: [{ type: 'ADJUSTMENT', amountMinor: 8_000n }],
      trades: [{ result: 'WIN', netPnlMinor: 8_000n }],
    });

    expect(withTradeOnly).toBe(108_000n);
    expect(withDuplicatedMovement).toBe(116_000n);
  });

  it('admite un saldo inicial de cero', () => {
    expect(computeBalanceMinor({ openingBalanceMinor: 0n })).toBe(0n);
  });

  it('rechaza saldos iniciales negativos', () => {
    expect(() => computeBalanceMinor({ openingBalanceMinor: -1n })).toThrow(RangeError);
  });
});

describe('computeReconciliationMinor', () => {
  it('devuelve cero cuando coinciden', () => {
    expect(computeReconciliationMinor(127_500n, 127_500n)).toBe(0n);
  });

  it('devuelve la diferencia con signo', () => {
    expect(computeReconciliationMinor(127_000n, 127_500n)).toBe(-500n);
    expect(computeReconciliationMinor(128_000n, 127_500n)).toBe(500n);
  });
});
