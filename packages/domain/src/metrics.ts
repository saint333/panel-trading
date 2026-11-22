import { roundHalfUpDiv } from './money.js';
import { isSettledResult, type TradeResult } from './pnl.js';

export interface TradeLike {
  result: TradeResult;
  stakeMinor: bigint;
  netPnlMinor: bigint;
  /** Vencimiento de la operación. Se ordena por este instante. */
  expiresAt: Date | string;
}

export interface CapitalPoint {
  at: Date;
  balanceMinor: bigint;
}

export interface DrawdownResult {
  minor: bigint;
  pct: number | null;
}

export interface MetricsSummary {
  totalTrades: number;
  settledCount: number;
  decidedCount: number;
  wins: number;
  losses: number;
  draws: number;
  cancelledCount: number;
  openCount: number;
  /** Stakes de todas las operaciones menos las canceladas. */
  totalStakeMinor: bigint;
  /** Stakes de las operaciones liquidadas (denominador del ROI). */
  settledStakeMinor: bigint;
  grossProfitMinor: bigint;
  /** Valor absoluto de la suma de pérdidas. */
  grossLossMinor: bigint;
  netPnlMinor: bigint;
  winRate: number | null;
  lossRate: number | null;
  drawRate: number | null;
  profitFactor: number | null;
  expectancyMinor: bigint | null;
  /** Ganancia media por operación ganadora (positiva). */
  avgWinMinor: bigint | null;
  /** Pérdida media por operación perdedora (negativa). */
  avgLossMinor: bigint | null;
  largestWinMinor: bigint | null;
  /** La mayor pérdida, como valor negativo. */
  largestLossMinor: bigint | null;
  maxWinStreak: number;
  maxLossStreak: number;
  maxDrawdownMinor: bigint;
  maxDrawdownPct: number | null;
  roi: number | null;
  avgStakeMinor: bigint | null;
}

function toTimestamp(value: Date | string): number {
  const time = value instanceof Date ? value.getTime() : Date.parse(value);

  if (!Number.isFinite(time)) {
    throw new RangeError(`Fecha de vencimiento inválida: ${String(value)}`);
  }

  return time;
}

function assertConsistentTrade(trade: TradeLike): void {
  if (typeof trade.stakeMinor !== 'bigint' || trade.stakeMinor <= 0n) {
    throw new RangeError('Toda operación debe tener un stake positivo en unidades menores');
  }

  const { result, netPnlMinor } = trade;

  if (result === 'WIN' && netPnlMinor < 0n) {
    throw new RangeError('Una operación WIN no puede tener PnL negativo');
  }
  if (result === 'LOSS' && netPnlMinor > 0n) {
    throw new RangeError('Una operación LOSS no puede tener PnL positivo');
  }
  if (result !== 'WIN' && result !== 'LOSS' && netPnlMinor !== 0n) {
    throw new RangeError(`Una operación ${result} debe tener PnL cero`);
  }
}

function sortByExpiry(trades: readonly TradeLike[]): TradeLike[] {
  return trades
    .map((trade, index) => ({ trade, index, time: toTimestamp(trade.expiresAt) }))
    .sort((a, b) => a.time - b.time || a.index - b.index)
    .map((entry) => entry.trade);
}

/** Curva de capital de las operaciones liquidadas, ordenada por vencimiento. */
export function buildCapitalCurve(input: {
  openingBalanceMinor: bigint;
  trades: readonly TradeLike[];
}): CapitalPoint[] {
  const settled = sortByExpiry(input.trades).filter((trade) => isSettledResult(trade.result));

  let balance = input.openingBalanceMinor;

  return settled.map((trade) => {
    balance += trade.netPnlMinor;
    return { at: new Date(toTimestamp(trade.expiresAt)), balanceMinor: balance };
  });
}

/**
 * Drawdown máximo sobre una serie de saldos (el primero debe ser el capital
 * inicial). Devuelve la caída absoluta y el porcentaje sobre el pico.
 * Si nunca hay pico positivo, el porcentaje no está definido (`null`).
 */
export function computeMaxDrawdown(series: readonly bigint[]): DrawdownResult {
  if (series.length === 0) {
    return { minor: 0n, pct: 0 };
  }

  let peak = series[0] as bigint;
  let maxDrop = 0n;
  let maxPct: number | null = null;

  for (const value of series) {
    if (value > peak) {
      peak = value;
    }

    const drop = peak - value;
    if (drop > maxDrop) {
      maxDrop = drop;
    }

    if (drop > 0n && peak > 0n) {
      const pct = Number(drop) / Number(peak);
      maxPct = maxPct === null ? pct : Math.max(maxPct, pct);
    }
  }

  if (maxPct === null && maxDrop === 0n) {
    return { minor: 0n, pct: 0 };
  }

  return { minor: maxDrop, pct: maxPct };
}

/**
 * Agrega un conjunto de operaciones. Todas las métricas que no pueden
 * calcularse devuelven `null`, nunca `0` (BR-09).
 *
 * Los empates (`DRAW`) no entran en el win rate ni en el profit factor, pero sí
 * en la expectativa y en el denominador de operaciones liquidadas.
 */
export function summarizeTrades(
  trades: readonly TradeLike[],
  options: { openingBalanceMinor?: bigint } = {},
): MetricsSummary {
  const openingBalanceMinor = options.openingBalanceMinor ?? 0n;
  const ordered = sortByExpiry(trades);

  ordered.forEach(assertConsistentTrade);

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let cancelledCount = 0;
  let openCount = 0;
  let grossProfitMinor = 0n;
  let grossLossMinor = 0n;
  let netPnlMinor = 0n;
  let totalStakeMinor = 0n;
  let settledStakeMinor = 0n;
  let largestWinMinor: bigint | null = null;
  let largestLossMinor: bigint | null = null;

  let winStreak = 0;
  let lossStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;

  for (const trade of ordered) {
    if (trade.result !== 'CANCELLED') {
      totalStakeMinor += trade.stakeMinor;
    }

    if (!isSettledResult(trade.result)) {
      if (trade.result === 'CANCELLED') {
        cancelledCount += 1;
      } else {
        openCount += 1;
      }
      // Ni las canceladas ni las abiertas cortan una racha: no están decididas.
      continue;
    }

    settledStakeMinor += trade.stakeMinor;
    netPnlMinor += trade.netPnlMinor;

    if (trade.result === 'WIN') {
      wins += 1;
      grossProfitMinor += trade.netPnlMinor;
      largestWinMinor =
        largestWinMinor === null || trade.netPnlMinor > largestWinMinor
          ? trade.netPnlMinor
          : largestWinMinor;
      lossStreak = 0;
      winStreak += 1;
      maxWinStreak = Math.max(maxWinStreak, winStreak);
    } else if (trade.result === 'LOSS') {
      losses += 1;
      grossLossMinor += -trade.netPnlMinor;
      largestLossMinor =
        largestLossMinor === null || trade.netPnlMinor < largestLossMinor
          ? trade.netPnlMinor
          : largestLossMinor;
      winStreak = 0;
      lossStreak += 1;
      maxLossStreak = Math.max(maxLossStreak, lossStreak);
    } else {
      draws += 1;
      // Un empate no corta la racha: simplemente no participa en ella.
    }
  }

  const settledCount = wins + losses + draws;
  const decidedCount = wins + losses;

  const curve = buildCapitalCurve({ openingBalanceMinor, trades: ordered });
  const drawdown = computeMaxDrawdown([openingBalanceMinor, ...curve.map((p) => p.balanceMinor)]);

  return {
    totalTrades: ordered.length,
    settledCount,
    decidedCount,
    wins,
    losses,
    draws,
    cancelledCount,
    openCount,
    totalStakeMinor,
    settledStakeMinor,
    grossProfitMinor,
    grossLossMinor,
    netPnlMinor,
    winRate: decidedCount > 0 ? wins / decidedCount : null,
    lossRate: decidedCount > 0 ? losses / decidedCount : null,
    drawRate: settledCount > 0 ? draws / settledCount : null,
    profitFactor: grossLossMinor > 0n ? Number(grossProfitMinor) / Number(grossLossMinor) : null,
    expectancyMinor: settledCount > 0 ? roundHalfUpDiv(netPnlMinor, BigInt(settledCount)) : null,
    avgWinMinor: wins > 0 ? roundHalfUpDiv(grossProfitMinor, BigInt(wins)) : null,
    avgLossMinor: losses > 0 ? -roundHalfUpDiv(grossLossMinor, BigInt(losses)) : null,
    largestWinMinor,
    largestLossMinor,
    maxWinStreak,
    maxLossStreak,
    maxDrawdownMinor: drawdown.minor,
    maxDrawdownPct: drawdown.pct,
    roi: settledStakeMinor > 0n ? Number(netPnlMinor) / Number(settledStakeMinor) : null,
    avgStakeMinor:
      ordered.length > cancelledCount
        ? roundHalfUpDiv(totalStakeMinor, BigInt(ordered.length - cancelledCount))
        : null,
  };
}
