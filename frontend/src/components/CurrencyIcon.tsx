const COLORS: Record<string, string> = {
  TON: '#0098EA',
  USDT_TON: '#26A17B',
  USDT_TRC20: '#26A17B',
  ETH: '#627EEA',
  BTC: '#F7931A',
};

const LABELS: Record<string, string> = {
  TON: 'TON',
  USDT_TON: '₮',
  USDT_TRC20: '₮',
  ETH: 'Ξ',
  BTC: '₿',
};

export function CurrencyIcon({ currency }: { currency: string }) {
  return (
    <span
      className="currency-icon"
      style={{ background: COLORS[currency] ?? '#666' }}
    >
      {LABELS[currency] ?? currency.slice(0, 2)}
    </span>
  );
}

export function currencyLabel(currency: string): string {
  switch (currency) {
    case 'USDT_TON': return 'USDT (TON)';
    case 'USDT_TRC20': return 'USDT (TRC-20)';
    default: return currency;
  }
}
