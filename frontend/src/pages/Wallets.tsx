import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { CurrencyIcon, currencyLabel } from '../components/CurrencyIcon';
import { hapticImpact, hapticNotification } from '../lib/telegram';

export function Wallets() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const r = await api.wallets();
      setWallets(r.wallets);
      setErr(null);
    } catch (e: any) {
      setErr(e.message);
      hapticNotification('error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalUsd = wallets.reduce((s, w) => s + (w.usdValue || 0), 0);

  return (
    <div>
      <div className="title">Кошелёк</div>
      <div className="card">
        <div className="muted">Общий баланс</div>
        <div className="balance-big">${totalUsd.toFixed(2)}</div>
      </div>

      {loading && <div className="muted">Загрузка…</div>}
      {err && <div className="card" style={{color:'var(--destructive)'}}>{err}</div>}

      {wallets.map((w) => (
        <Link
          key={w.id}
          to={`/wallets/${w.currency}`}
          onClick={() => hapticImpact('light')}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="card row">
            <CurrencyIcon currency={w.currency} />
            <div style={{flex:1, marginLeft: 10}}>
              <div style={{fontWeight:600}}>{currencyLabel(w.currency)}</div>
              <div className="muted">${(w.usdValue || 0).toFixed(2)}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontWeight:600}}>{Number(w.balance).toFixed(6)}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
