import { describe, expect, it } from 'vitest';
import {
  buildCapitalCurve,
  computeMaxDrawdown,
  summarizeTrades,
  type TradeLike,
} from '../src/index.js';

function trade(
  result: TradeLike['result'],
  stakeMinor: bigint,
  netPnlMinor: bigint,
  hour: number,
): TradeLike {
  return {
    result,
    stakeMinor,
    netPnlMinor,
    expiresAt: new Date(Date.UTC(2026, 0, 1, hour)),
  };
}

const mixed: TradeLike[] = [
  trade('WIN', 1_000n, 800n, 10),
  trade('LOSS', 1_000n, -1_000n, 11),
  trade('DRAW', 500n, 0n, 12),
  trade('WIN', 2_000n, 1_600n, 13),
  trade('LOSS', 1_500n, -1_500n, 14),
  trade('LOSS', 1_000n, -1_000n, 15),
  trade('CANCELLED', 700n, 0n, 16),
  trade('OPEN', 900n, 0n, 17),
];

describe('summarizeTrades', () => {
  const summary = summarizeTrades(mixed, { openingBalanceMinor: 100_000n });

  it('cuenta resultados y excluye canceladas y abiertas de las decididas', () => {
    expect(summary.totalTrades).toBe(8);
    expect(summary.wins).toBe(2);
    expect(summary.losses).toBe(3);
    expect(summary.draws).toBe(1);
    expect(summary.decidedCount).toBe(5);
    expect(summary.settledCount).toBe(6);
    expect(summary.cancelledCount).toBe(1);
    expect(summary.openCount).toBe(1);
  });

  it('suma ganancias, pérdidas y neto sin coma flotante', () => {
    expect(summary.grossProfitMinor).toBe(2_400n);
    expect(summary.grossLossMinor).toBe(3_500n);
    expect(summary.netPnlMinor).toBe(-1_100n);
  });

  it('calcula ratios con null cuando no aplican', () => {
    expect(summary.winRate).toBeCloseTo(0.4, 10);
    expect(summary.lossRate).toBeCloseTo(0.6, 10);
    expect(summary.drawRate).toBeCloseTo(1 / 6, 10);
    expect(summary.profitFactor).toBeCloseTo(2_400 / 3_500, 10);
    expect(summary.roi).toBeCloseTo(-1_100 / 7_000, 10);
  });

  it('redondea medias y expectativa a unidades menores', () => {
    expect(summary.expectancyMinor).toBe(-183n);
    expect(summary.avgWinMinor).toBe(1_200n);
    expect(summary.avgLossMinor).toBe(-1_167n);
    expect(summary.avgStakeMinor).toBe(1_129n);
  });

  it('identifica los extremos', () => {
    expect(summary.largestWinMinor).toBe(1_600n);
    expect(summary.largestLossMinor).toBe(-1_500n);
  });

  it('calcula rachas por orden de vencimiento', () => {
    expect(summary.maxWinStreak).toBe(1);
    expect(summary.maxLossStreak).toBe(2);
  });

  it('F-16: el drawdown parte del pico correcto', () => {
    // Capital: 100 000 → 100 800 → 99 800 → 99 800 → 101 400 → 99 900 → 98 900
    expect(summary.maxDrawdownMinor).toBe(2_500n);
    expect(summary.maxDrawdownPct).toBeCloseTo(2_500 / 101_400, 10);
  });

  it('F-11: win rate es null sin operaciones decididas', () => {
    const onlyDraws = summarizeTrades([trade('DRAW', 1_000n, 0n, 10)]);
    expect(onlyDraws.winRate).toBeNull();
    expect(onlyDraws.lossRate).toBeNull();
    expect(onlyDraws.drawRate).toBe(1);
  });

  it('F-12: profit factor es null si no hay pérdidas', () => {
    const noLosses = summarizeTrades([trade('WIN', 1_000n, 800n, 10)]);
    expect(noLosses.profitFactor).toBeNull();
    expect(noLosses.winRate).toBe(1);
  });

  it('F-13: profit factor exacto', () => {
    const summaryPf = summarizeTrades([
      trade('WIN', 1_000n, 1_600n, 10),
      trade('LOSS', 1_000n, -1_000n, 11),
    ]);
    expect(summaryPf.profitFactor).toBeCloseTo(1.6, 10);
  });

  it('F-14: la expectativa incluye los empates en el denominador', () => {
    const withDraw = summarizeTrades([
      trade('WIN', 1_000n, 800n, 10),
      trade('LOSS', 1_000n, -1_000n, 11),
      trade('DRAW', 1_000n, 0n, 12),
    ]);
    expect(withDraw.settledCount).toBe(3);
    expect(withDraw.expectancyMinor).toBe(-67n); // -200 / 3 = -66,67
  });

  it('F-15: los empates no cortan las rachas', () => {
    const withDraws = summarizeTrades([
      trade('WIN', 1_000n, 800n, 0),
      trade('DRAW', 1_000n, 0n, 1),
      trade('WIN', 1_000n, 800n, 2),
      trade('LOSS', 1_000n, -1_000n, 3),
      trade('LOSS', 1_000n, -1_000n, 4),
      trade('DRAW', 1_000n, 0n, 5),
      trade('LOSS', 1_000n, -1_000n, 6),
    ]);
    expect(withDraws.maxWinStreak).toBe(2);
    expect(withDraws.maxLossStreak).toBe(3);
  });

  it('ordena por vencimiento, no por orden de entrada', () => {
    const unordered = [
      trade('LOSS', 1_000n, -1_000n, 12),
      trade('WIN', 1_000n, 800n, 10),
      trade('WIN', 1_000n, 800n, 11),
    ];
    expect(summarizeTrades(unordered).maxWinStreak).toBe(2);
  });

  it('no cuenta stakes cancelados en el ROI ni en el stake medio', () => {
    const summaryC = summarizeTrades([
      trade('WIN', 1_000n, 800n, 10),
      trade('CANCELLED', 5_000n, 0n, 11),
    ]);
    expect(summaryC.roi).toBeCloseTo(0.8, 10);
    expect(summaryC.avgStakeMinor).toBe(1_000n);
  });

  it('roi y expectativa son null sin liquidadas', () => {
    const empty = summarizeTrades([]);
    expect(empty.roi).toBeNull();
    expect(empty.expectancyMinor).toBeNull();
    expect(empty.avgStakeMinor).toBeNull();
    expect(empty.maxDrawdownMinor).toBe(0n);
    expect(empty.maxDrawdownPct).toBe(0);
  });

  it('rechaza operaciones con PnL incoherente con su resultado', () => {
    expect(() => summarizeTrades([trade('WIN', 1_000n, -1n, 10)])).toThrow(RangeError);
    expect(() => summarizeTrades([trade('LOSS', 1_000n, 1n, 10)])).toThrow(RangeError);
    expect(() => summarizeTrades([trade('DRAW', 1_000n, 5n, 10)])).toThrow(RangeError);
    expect(() => summarizeTrades([trade('WIN', 0n, 0n, 10)])).toThrow(RangeError);
    expect(() =>
      summarizeTrades([{ ...trade('WIN', 1_000n, 800n, 10), expiresAt: 'no-es-fecha' }]),
    ).toThrow(RangeError);
  });
});

describe('computeMaxDrawdown', () => {
  it('F-17: sin caída devuelve cero', () => {
    expect(computeMaxDrawdown([100n, 120n, 130n])).toEqual({ minor: 0n, pct: 0 });
  });

  it('F-16: reinicia el pico tras un nuevo máximo', () => {
    const result = computeMaxDrawdown([100_000n, 110_000n, 90_000n, 105_000n, 75_000n]);
    expect(result.minor).toBe(35_000n);
    expect(result.pct).toBeCloseTo(35_000 / 110_000, 10);
  });

  it('devuelve null si nunca hubo un pico positivo', () => {
    expect(computeMaxDrawdown([0n, -100n, -50n])).toEqual({ minor: 100n, pct: null });
  });

  it('serie vacía no rompe', () => {
    expect(computeMaxDrawdown([])).toEqual({ minor: 0n, pct: 0 });
  });
});

describe('buildCapitalCurve', () => {
  it('acumula solo operaciones liquidadas por vencimiento', () => {
    const curve = buildCapitalCurve({
      openingBalanceMinor: 10_000n,
      trades: [
        trade('WIN', 1_000n, 800n, 12),
        trade('OPEN', 1_000n, 0n, 11),
        trade('LOSS', 1_000n, -1_000n, 10),
      ],
    });

    expect(curve.map((point) => point.balanceMinor)).toEqual([9_000n, 9_800n]);
    expect(curve[0]?.at.toISOString()).toBe('2026-01-01T10:00:00.000Z');
  });
});
