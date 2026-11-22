import { buildTradeFinancials, type TradeLike, type TradeResult } from '@binomo/domain';

/** PRNG determinista (mulberry32): los fixtures son reproducibles. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export interface FixtureTrade extends TradeLike {
  id: string;
  accountId: string;
  assetSymbol: string;
  direction: 'CALL' | 'PUT';
  payoutBps: number;
  openedAt: Date;
}

const BASE_TIME = Date.UTC(2026, 0, 1, 9, 0, 0);
let sequence = 0;

export const DEFAULT_ACCOUNT_ID = '018f5f3e-1c1a-7c3b-9d1e-2f4a6b8c0d1e';

export function makeFixtureTrade(
  overrides: Partial<Omit<FixtureTrade, 'netPnlMinor'>> & {
    result?: TradeResult;
    payoutBps?: number;
    netPnlMinor?: bigint;
  } = {},
): FixtureTrade {
  sequence += 1;

  const stakeMinor = overrides.stakeMinor ?? 1_000n;
  const payoutBps = overrides.payoutBps ?? 8_000;
  const result = overrides.result ?? 'WIN';
  const openedAt = overrides.openedAt ?? new Date(BASE_TIME + sequence * 60_000);

  const financials = buildTradeFinancials({ stakeMinor, payoutBps, result });

  return {
    id: overrides.id ?? `trade-${String(sequence).padStart(4, '0')}`,
    accountId: overrides.accountId ?? DEFAULT_ACCOUNT_ID,
    assetSymbol: overrides.assetSymbol ?? 'EURUSD',
    direction: overrides.direction ?? 'CALL',
    stakeMinor,
    payoutBps,
    result,
    openedAt,
    expiresAt: overrides.expiresAt ?? new Date(openedAt.getTime() + 60_000),
    netPnlMinor: overrides.netPnlMinor ?? financials.netPnlMinor,
  };
}

export function makeFixtureTrades(count: number, seed = 42): FixtureTrade[] {
  const random = mulberry32(seed);
  const results: TradeResult[] = ['WIN', 'WIN', 'LOSS', 'DRAW'];

  return Array.from({ length: count }, (_, index) => {
    const result = results[Math.floor(random() * results.length)] as TradeResult;
    return makeFixtureTrade({
      result,
      stakeMinor: BigInt(500 + Math.floor(random() * 20) * 100),
      payoutBps: 7_000 + Math.floor(random() * 3) * 500,
      openedAt: new Date(BASE_TIME + index * 3_600_000),
      expiresAt: new Date(BASE_TIME + index * 3_600_000 + 300_000),
    });
  });
}
