import { describe, expect, it } from 'vitest';
import {
  buildTradeFinancials,
  computeNetPnlMinor,
  isSettledResult,
  roundHalfUpDiv,
} from '../src/index.js';

describe('computeNetPnlMinor', () => {
  it('F-01: WIN con stake 1 000 y payout 80 % devuelve 800', () => {
    expect(computeNetPnlMinor({ stakeMinor: 1_000n, payoutBps: 8_000, result: 'WIN' })).toBe(800n);
  });

  it('F-02: WIN con payout 0 no gana nada', () => {
    expect(computeNetPnlMinor({ stakeMinor: 1_000n, payoutBps: 0, result: 'WIN' })).toBe(0n);
  });

  it('F-03: WIN con stake 6 y payout 75 % redondea 4,5 hacia arriba', () => {
    expect(computeNetPnlMinor({ stakeMinor: 6n, payoutBps: 7_500, result: 'WIN' })).toBe(5n);
  });

  it('F-04: WIN con stake 1 y payout 1 pb redondea a cero', () => {
    expect(computeNetPnlMinor({ stakeMinor: 1n, payoutBps: 1, result: 'WIN' })).toBe(0n);
  });

  it('F-05: LOSS pierde el stake completo e ignora el payout', () => {
    expect(computeNetPnlMinor({ stakeMinor: 1_000n, payoutBps: 8_000, result: 'LOSS' })).toBe(
      -1_000n,
    );
  });

  it('F-06: DRAW no altera el saldo', () => {
    expect(computeNetPnlMinor({ stakeMinor: 1_000n, payoutBps: 8_000, result: 'DRAW' })).toBe(0n);
  });

  it('CANCELLED y OPEN tampoco alteran el saldo', () => {
    expect(computeNetPnlMinor({ stakeMinor: 1_000n, payoutBps: 8_000, result: 'CANCELLED' })).toBe(
      0n,
    );
    expect(computeNetPnlMinor({ stakeMinor: 1_000n, payoutBps: 8_000, result: 'OPEN' })).toBe(0n);
  });

  it('rechaza stakes no positivos', () => {
    expect(() => computeNetPnlMinor({ stakeMinor: 0n, payoutBps: 8_000, result: 'WIN' })).toThrow(
      RangeError,
    );
    expect(() => computeNetPnlMinor({ stakeMinor: -10n, payoutBps: 8_000, result: 'WIN' })).toThrow(
      RangeError,
    );
  });

  it('rechaza payouts fuera de rango o no enteros', () => {
    for (const payoutBps of [-1, 100_001, 80.5, Number.NaN]) {
      expect(() => computeNetPnlMinor({ stakeMinor: 1_000n, payoutBps, result: 'WIN' })).toThrow(
        RangeError,
      );
    }
  });

  it('rechaza resultados desconocidos', () => {
    expect(() =>
      computeNetPnlMinor({
        stakeMinor: 1_000n,
        payoutBps: 8_000,
        result: 'PENDING' as never,
      }),
    ).toThrow(RangeError);
  });

  it('buildTradeFinancials deriva el PnL y conserva los datos originales', () => {
    expect(buildTradeFinancials({ stakeMinor: 2_500n, payoutBps: 8_700, result: 'WIN' })).toEqual({
      stakeMinor: 2_500n,
      payoutBps: 8_700,
      result: 'WIN',
      netPnlMinor: 2_175n,
    });
  });

  it('isSettledResult distingue liquidadas de abiertas y canceladas', () => {
    expect(isSettledResult('WIN')).toBe(true);
    expect(isSettledResult('DRAW')).toBe(true);
    expect(isSettledResult('OPEN')).toBe(false);
    expect(isSettledResult('CANCELLED')).toBe(false);
  });
});

describe('roundHalfUpDiv', () => {
  it('redondea el medio hacia arriba en positivos', () => {
    expect(roundHalfUpDiv(45_000n, 10_000n)).toBe(5n);
    expect(roundHalfUpDiv(44_999n, 10_000n)).toBe(4n);
  });

  it('redondea el medio alejándose de cero en negativos', () => {
    expect(roundHalfUpDiv(-45_000n, 10_000n)).toBe(-5n);
    expect(roundHalfUpDiv(-44_999n, 10_000n)).toBe(-4n);
  });

  it('rechaza denominadores no positivos', () => {
    expect(() => roundHalfUpDiv(1n, 0n)).toThrow(RangeError);
    expect(() => roundHalfUpDiv(1n, -10n)).toThrow(RangeError);
  });
});
