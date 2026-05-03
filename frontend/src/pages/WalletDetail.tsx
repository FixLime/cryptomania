import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { CurrencyIcon, currencyLabel } from '../components/CurrencyIcon';
import { hapticImpact, hapticNotification } from '../lib/telegram';

export function WalletDetail() {
  const { currency } = useParams();
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => {
    api.wallets().then((r) => {
      setWallet(r.wallets.find((w) => w.currency === currency));
    });
  }, [currency]);

  if (!wallet) return <div className="muted">Загрузка…</div>;

  function copy() {
    navigator.clipboard.writeText(wallet.address);
    hapticNotification('success');
  }

  return (
    <div>
      <Link to="/wallets" onClick={() => hapticImpact('light')} style={{color:'var(--accent)'}}>← Назад</Link>
      <div className="row" style={{marginTop:16, gap:12}}>
        <CurrencyIcon currency={wallet.currency} />
        <div className="title" style={{margin:0}}>{currencyLabel(wallet.currency)}</div>
      </div>

      <div className="card">
        <div className="muted">Баланс</div>
        <div className="balance-big">{Number(wallet.balance).toFixed(8)}</div>
        <div className="muted">≈ ${(wallet.usdValue || 0).toFixed(2)}</div>
        {Number(wallet.lockedBalance) > 0 && (
          <div className="muted" style={{marginTop:8}}>
            🔒 Заморожено в pending выводах: {wallet.lockedBalance}
          </div>
        )}
      </div>

      <div className="card">
        <div className="muted" style={{marginBottom:8}}>Адрес для пополнения</div>
        <div className="address">{wallet.address}</div>
        <button className="btn" style={{marginTop:12}} onClick={copy}>
          📋 Скопировать адрес
        </button>
        <div className="muted" style={{marginTop:8, fontSize:12}}>
          Отправляйте только {currencyLabel(wallet.currency)} на этот адрес.
        </div>
      </div>

      <Link to="/withdraw" onClick={() => hapticImpact('medium')}>
        <button className="btn">📤 Вывести</button>
      </Link>
    </div>
  );
}
