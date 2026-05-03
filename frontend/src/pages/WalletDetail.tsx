import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { CurrencyIcon, currencyLabel, currencyNetwork, currencyTicker } from '../components/CurrencyIcon';
import { hapticImpact, hapticNotification } from '../lib/telegram';

export function WalletDetail() {
  const { currency } = useParams();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<any>(null);
  const [txs, setTxs] = useState<any[]>([]);

  useEffect(() => {
    api.wallets().then((r) => {
      setWallet(r.wallets.find((w) => w.currency === currency));
    });
    api.transactions().then((r) => {
      setTxs(r.transactions.filter((t) => t.currency === currency).slice(0, 5));
    });
  }, [currency]);

  if (!wallet) return <div className="empty"><div className="text">Загрузка…</div></div>;

  function copy() {
    navigator.clipboard.writeText(wallet.address);
    hapticNotification('success');
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/wallets" onClick={() => hapticImpact('light')} className="back">‹</Link>
        <div className="title">{currencyLabel(wallet.currency)}</div>
      </div>

      <div style={{textAlign:'center', padding:'8px 20px 24px'}}>
        <div style={{display:'inline-block', marginBottom:12}}>
          <CurrencyIcon currency={wallet.currency} size={64} />
        </div>
        <div style={{fontSize:36, fontWeight:700, letterSpacing:'-0.5px'}}>
          {Number(wallet.balance).toFixed(6)} <span style={{color:'var(--hint)', fontSize:24}}>{currencyTicker(wallet.currency)}</span>
        </div>
        <div className="muted" style={{marginTop:4}}>≈ ${(wallet.usdValue || 0).toFixed(2)}</div>
        {Number(wallet.lockedBalance) > 0 && (
          <div className="muted mt-8">🔒 В обработке: {wallet.lockedBalance}</div>
        )}
      </div>

      <div className="actions">
        <button className="action" onClick={() => { hapticImpact('medium'); copy(); }}>
          <span className="ico">↓</span>
          <span className="lbl">Получить</span>
        </button>
        <button className="action" onClick={() => { hapticImpact('medium'); navigate('/withdraw'); }}>
          <span className="ico">↑</span>
          <span className="lbl">Отправить</span>
        </button>
      </div>

      <div className="section-title">Адрес для пополнения</div>
      <div className="address-block">
        <div className="address">{wallet.address}</div>
        <button className="btn secondary mt-12" onClick={copy}>
          📋 Скопировать
        </button>
        <div className="muted mt-8" style={{fontSize:12, textAlign:'center'}}>
          Только {currencyLabel(wallet.currency)} • сеть {currencyNetwork(wallet.currency)}
        </div>
      </div>

      {txs.length > 0 && (
        <>
          <div className="section-title">Последние транзакции</div>
          <div className="section">
            {txs.map((t) => (
              <div key={t.id} className="tx-item">
                <div className={`ico ${t.type === 'DEPOSIT' ? 'in' : 'out'}`}>
                  {t.type === 'DEPOSIT' ? '↓' : '↑'}
                </div>
                <div className="body">
                  <div className="title">{t.type === 'DEPOSIT' ? 'Получено' : 'Отправлено'}</div>
                  <div className="sub">{new Date(t.createdAt).toLocaleDateString('ru-RU', {day:'numeric', month:'short'})}</div>
                </div>
                <div className="right">
                  <div className={`amount ${t.type === 'DEPOSIT' ? 'in' : ''}`}>
                    {t.type === 'DEPOSIT' ? '+' : '−'}{Number(t.amount).toFixed(4)}
                  </div>
                  <div className="status">{t.status}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
