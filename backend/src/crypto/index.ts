import type { Currency } from '@prisma/client';
import { tonAdapter } from './ton.js';
import { usdtTonAdapter } from './usdtTon.js';
import { tronUsdtAdapter } from './tron.js';
import { ethAdapter } from './eth.js';
import { btcAdapter } from './btc.js';
import type { CryptoAdapter } from './types.js';

export const adapters: Record<Currency, CryptoAdapter> = {
  TON: tonAdapter,
  USDT_TON: usdtTonAdapter,
  USDT_TRC20: tronUsdtAdapter,
  ETH: ethAdapter,
  BTC: btcAdapter,
};

export function getAdapter(currency: Currency): CryptoAdapter {
  const a = adapters[currency];
  if (!a) throw new Error(`No adapter for ${currency}`);
  return a;
}

export const SUPPORTED_CURRENCIES: Currency[] = ['TON', 'USDT_TON', 'USDT_TRC20', 'ETH', 'BTC'];
