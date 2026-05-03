import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { CurrencyIcon, currencyLabel, currencyNetwork, currencyTicker } from '../components/CurrencyIcon';
import { hapticImpact, hapticNotification } from '../lib/telegram';

export function Wallets() {
  const navigate = useNavigate();
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
  const [intPart, decPart] = totalUsd.toFixed(2).split('.');

  return (
    <div>
      <div className="hero">
        <div className="label">Общий баланс</div>
        <div className="balance">
          <span className="currency">$</span>{intPart}
          <span style={{opacity:0.7}}>.{decPart}</span>
        </div>
      </div>

      <div className="actions">
        <button className="action" onClick={() => { hapticImpact('medium'); navigate('/wallets/TON'); }}>
          <span className="ico">↓</span>
          <span className="lbl">Получить</span>
        </button>
        <button className="action" onClick={() => { hapticImpact('medium'); navigate('/withdraw'); }}>
          <span className="ico">↑</span>
          <span className="lbl">Отправить</span>
        </button>
        <button className="action" onClick={() => { hapticImpact('light'); navigate('/history'); }}>
          <span className="ico">⇆</span>
          <span className="lbl">История</span>
        </button>
      </div>

      <div className="section-title">Активы</div>

      {loading && <div className="empty"><div className="text">Загрузка…</div></div>}
      {err && <div className="empty" style={{color:'var(--destructive)'}}>{err}</div>}

      {!loading && wallets.length > 0 && (
        <div className="section">
          {wallets.map((w) => (
            <Link
              key={w.id}
              to={`/wallets/${w.currency}`}
              onClick={() => hapticImpact('light')}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div className="row">
                <CurrencyIcon currency={w.currency} />
                <div className="body">
                  <div className="title">{currencyLabel(w.currency)}</div>
                  <div className="sub">{currencyNetwork(w.currency)}</div>
                </div>
                <div className="right">
                  <div className="amount">{Number(w.balance).toFixed(4)} {currencyTicker(w.currency)}</div>
                  <div className="fiat">${(w.usdValue || 0).toFixed(2)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
