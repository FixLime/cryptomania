import type { Currency } from '@prisma/client';

const COINGECKO_IDS: Record<Currency, string> = {
  TON: 'the-open-network',
  USDT_TON: 'tether',
  USDT_TRC20: 'tether',
  ETH: 'ethereum',
  BTC: 'bitcoin',
};

const cache = new Map<string, { value: number; ts: number }>();
const TTL_MS = 60_000;

export async function getUsdRate(currency: Currency): Promise<number> {
  const id = COINGECKO_IDS[currency];
  const cached = cache.get(id);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.value;
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
    const data: any = await res.json();
    const value = Number(data[id]?.usd ?? 0);
    cache.set(id, { value, ts: Date.now() });
    return value;
  } catch {
    return cached?.value ?? 0;
  }
}

export async function getAllRates(): Promise<Record<Currency, number>> {
  const ids = Array.from(new Set(Object.values(COINGECKO_IDS))).join(',');
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    const data: any = await res.json();
    const result = {} as Record<Currency, number>;
    for (const [cur, id] of Object.entries(COINGECKO_IDS) as [Currency, string][]) {
      result[cur] = Number(data[id]?.usd ?? 0);
    }
    return result;
  } catch {
    return { TON: 0, USDT_TON: 1, USDT_TRC20: 1, ETH: 0, BTC: 0 };
  }
}
