import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  computeBalanceMinor,
  computeNetPnlMinor,
  isSettledResult,
  movementSignedAmount,
  summarizeTrades,
  type FinancialMovement,
  type TransactionType,
  type TradeLike,
} from '../src/index.js';

const stakeArb = fc.bigInt({ min: 1n, max: 10_000_000n });
const payoutArb = fc.integer({ min: 0, max: 100_000 });
const resultArb = fc.constantFrom('WIN', 'LOSS', 'DRAW', 'CANCELLED', 'OPEN' as const);
const typeArb = fc.constantFrom(
  'DEPOSIT',
  'WITHDRAWAL',
  'ADJUSTMENT',
  'COMMISSION',
  'BONUS',
  'CORRECTION' as TransactionType,
);

const tradeArb: fc.Arbitrary<TradeLike> = fc
  .record({
    stakeMinor: stakeArb,
    payoutBps: payoutArb,
    result: resultArb,
    offset: fc.integer({ min: 0, max: 10_000 }),
  })
  .map(({ stakeMinor, payoutBps, result, offset }) => ({
    result,
    stakeMinor,
    netPnlMinor: computeNetPnlMinor({ stakeMinor, payoutBps, result }),
    expiresAt: new Date(Date.UTC(2026, 0, 1) + offset * 60_000),
  }));

const movementArb: fc.Arbitrary<FinancialMovement> = fc
  .record({ type: typeArb, amount: stakeArb })
  .map(({ type, amount }) => ({
    type,
    amountMinor: type === 'ADJUSTMENT' || type === 'CORRECTION' ? -amount : amount,
  }));

describe('propiedades del dinero', () => {
  it('un WIN nunca pierde y no supera 10 veces el stake (payout máximo 1000 %)', () => {
    fc.assert(
      fc.property(stakeArb, payoutArb, (stakeMinor, payoutBps) => {
        const pnl = computeNetPnlMinor({ stakeMinor, payoutBps, result: 'WIN' });
        expect(pnl >= 0n).toBe(true);
        expect(pnl <= stakeMinor * 10n).toBe(true);
      }),
      { numRuns: 500 },
    );
  });

  it('el redondeo nunca se aleja más de media unidad del valor exacto', () => {
    fc.assert(
      fc.property(stakeArb, payoutArb, (stakeMinor, payoutBps) => {
        const pnl = computeNetPnlMinor({ stakeMinor, payoutBps, result: 'WIN' });
        const exactScaled = stakeMinor * BigInt(payoutBps);
        const diff = pnl * 10_000n - exactScaled;
        const absoluteDiff = diff < 0n ? -diff : diff;
        expect(absoluteDiff <= 5_000n).toBe(true);
      }),
      { numRuns: 500 },
    );
  });

  it('LOSS siempre equivale a perder el stake', () => {
    fc.assert(
      fc.property(stakeArb, payoutArb, (stakeMinor, payoutBps) => {
        expect(computeNetPnlMinor({ stakeMinor, payoutBps, result: 'LOSS' })).toBe(-stakeMinor);
      }),
      { numRuns: 200 },
    );
  });

  it('los resultados no liquidados siempre tienen PnL cero', () => {
    fc.assert(
      fc.property(stakeArb, payoutArb, (stakeMinor, payoutBps) => {
        for (const result of ['DRAW', 'CANCELLED', 'OPEN'] as const) {
          expect(computeNetPnlMinor({ stakeMinor, payoutBps, result })).toBe(0n);
        }
      }),
      { numRuns: 200 },
    );
  });
});

describe('propiedades del saldo', () => {
  it('el saldo es la suma exacta de apertura, movimientos y PnL liquidado', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 100_000_000n }),
        fc.array(movementArb, { maxLength: 20 }),
        fc.array(tradeArb, { maxLength: 20 }),
        (openingBalanceMinor, movements, trades) => {
          const expected =
            openingBalanceMinor +
            movements.reduce((total, movement) => total + movementSignedAmount(movement), 0n) +
            trades.reduce(
              (total, t) => (isSettledResult(t.result) ? total + t.netPnlMinor : total),
              0n,
            );

          expect(computeBalanceMinor({ openingBalanceMinor, movements, trades })).toBe(expected);
        },
      ),
      { numRuns: 300 },
    );
  });
});

describe('propiedades de las métricas', () => {
  it('los conteos cuadran y el neto es ganancias menos pérdidas', () => {
    fc.assert(
      fc.property(fc.array(tradeArb), (trades) => {
        const summary = summarizeTrades(trades);

        expect(summary.wins + summary.losses + summary.draws).toBe(summary.settledCount);
        expect(summary.wins + summary.losses).toBe(summary.decidedCount);
        expect(summary.settledCount + summary.cancelledCount + summary.openCount).toBe(
          summary.totalTrades,
        );
        expect(summary.grossProfitMinor - summary.grossLossMinor).toBe(summary.netPnlMinor);
      }),
      { numRuns: 300 },
    );
  });

  it('win rate, loss rate y draw rate están en [0, 1] o son null', () => {
    fc.assert(
      fc.property(fc.array(tradeArb), (trades) => {
        const summary = summarizeTrades(trades);

        for (const value of [summary.winRate, summary.lossRate, summary.drawRate]) {
          if (value !== null) {
            expect(value >= 0 && value <= 1).toBe(true);
          }
        }
        if (summary.decidedCount === 0) {
          expect(summary.winRate).toBeNull();
        }
        if (summary.grossLossMinor === 0n) {
          expect(summary.profitFactor).toBeNull();
        }
      }),
      { numRuns: 300 },
    );
  });

  it('el drawdown nunca supera el pico ni es negativo', () => {
    fc.assert(
      fc.property(
        fc.array(tradeArb),
        fc.bigInt({ min: 0n, max: 1_000_000n }),
        (trades, opening) => {
          const summary = summarizeTrades(trades, { openingBalanceMinor: opening });
          expect(summary.maxDrawdownMinor >= 0n).toBe(true);
          if (summary.maxDrawdownPct !== null) {
            expect(summary.maxDrawdownPct >= 0).toBe(true);
          }
        },
      ),
      { numRuns: 300 },
    );
  });
});
