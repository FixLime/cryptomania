const COLORS: Record<string, string> = {
  TON: '#0098EA',
  USDT_TON: '#26A17B',
  USDT_TRC20: '#26A17B',
  ETH: '#627EEA',
  BTC: '#F7931A',
};

const SYMBOLS: Record<string, string> = {
  TON: '💎',
  USDT_TON: '₮',
  USDT_TRC20: '₮',
  ETH: 'Ξ',
  BTC: '₿',
};

export function CurrencyIcon({ currency, size = 40 }: { currency: string; size?: number }) {
  return (
    <span
      className="icon"
      style={{
        background: COLORS[currency] ?? '#666',
        width: size,
        height: size,
        fontSize: size * 0.5,
      }}
    >
      {SYMBOLS[currency] ?? currency.slice(0, 1)}
    </span>
  );
}

export function currencyLabel(currency: string): string {
  switch (currency) {
    case 'USDT_TON': return 'USDT';
    case 'USDT_TRC20': return 'USDT';
    case 'TON': return 'Toncoin';
    case 'ETH': return 'Ethereum';
    case 'BTC': return 'Bitcoin';
    default: return currency;
  }
}

export function currencyNetwork(currency: string): string {
  switch (currency) {
    case 'USDT_TON': return 'TON';
    case 'USDT_TRC20': return 'TRC-20';
    case 'TON': return 'TON';
    case 'ETH': return 'Ethereum';
    case 'BTC': return 'Bitcoin';
    default: return '';
  }
}

export function currencyTicker(currency: string): string {
  switch (currency) {
    case 'USDT_TON':
    case 'USDT_TRC20': return 'USDT';
    default: return currency;
  }
}
