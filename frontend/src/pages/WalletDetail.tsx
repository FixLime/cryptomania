import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { CurrencyIcon, currencyLabel, currencyTicker } from '../components/CurrencyIcon';
import { Icon } from '../components/Icon';
import { hapticImpact } from '../lib/telegram';

export function WalletDetail() {
  const { currency } = useParams();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<any>(null);
  const [txs, setTxs] = useState<any[]>([]);

  useEffect(() => {
    api.wallets().then((r) => setWallet(r.wallets.find((w) => w.currency === currency)));
    api.transactions({ currency }).then((r) => setTxs(r.transactions.slice(0, 8)));
  }, [currency]);

  if (!wallet) return <div className="empty"><div className="text">Загрузка…</div></div>;

  return (
    <div>
      <div className="page-header">
        <Link to="/wallets" onClick={() => hapticImpact('light')} className="back"><Icon name="chevron-left" /></Link>
        <div className="title">{currencyLabel(wallet.currency)}</div>
      </div>

      <div style={{textAlign:'center', padding:'12px 20px 24px'}}>
        <CurrencyIcon currency={wallet.currency} size={72} />
        <div style={{fontSize:36, fontWeight:700, letterSpacing:'-0.8px', marginTop:14}}>
          {Number(wallet.balance).toFixed(6)} <span style={{color:'var(--hint)', fontSize:22, fontWeight:500}}>{currencyTicker(wallet.currency)}</span>
        </div>
        <div className="muted" style={{marginTop:4}}>≈ ${(wallet.usdValue || 0).toFixed(2)}</div>
        {Number(wallet.lockedBalance) > 0 && (
          <div className="badge yellow mt-12">🔒 {wallet.lockedBalance} заблокировано</div>
        )}
      </div>

      <div className="action-grid" style={{gridTemplateColumns:'repeat(3, 1fr)'}}>
        <button className="action" onClick={() => { hapticImpact('medium'); navigate(`/receive/${wallet.currency}`); }}>
          <span className="ico"><Icon name="arrow-down" /></span>
          <span className="lbl">Получить</span>
        </button>
        <button className="action" onClick={() => { hapticImpact('medium'); navigate(`/send/${wallet.currency}`); }}>
          <span className="ico"><Icon name="send" /></span>
          <span className="lbl">Отправить</span>
        </button>
        <button className="action" onClick={() => { hapticImpact('medium'); navigate('/swap', { state: { from: wallet.currency } }); }}>
          <span className="ico"><Icon name="swap" /></span>
          <span className="lbl">Обмен</span>
        </button>
      </div>

      <div className="section-title"><span>Транзакции</span>{txs.length > 0 && <Link to="/history">Все</Link>}</div>
      {txs.length === 0 ? (
        <div className="empty"><div className="ico">📭</div><div className="text">Транзакций пока нет</div></div>
      ) : (
        <div className="section">
          {txs.map((t) => (
            <Link key={t.id} to={`/tx/${t.id}`} onClick={() => hapticImpact('light')} style={{textDecoration:'none', color:'inherit'}}>
              <TxRow tx={t} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function TxRow({ tx }: { tx: any }) {
  const isIn = ['DEPOSIT', 'INTERNAL_IN', 'SWAP_IN', 'BONUS'].includes(tx.type);
  const isSwap = tx.type.startsWith('SWAP');
  const titleMap: Record<string, string> = {
    DEPOSIT: 'Депозит',
    WITHDRAWAL: 'Вывод',
    INTERNAL_IN: 'Получено',
    INTERNAL_OUT: 'Отправлено',
    SWAP_IN: 'Обмен',
    SWAP_OUT: 'Обмен',
    BONUS: 'Бонус',
    FEE: 'Комиссия',
  };
  return (
    <div className="tx-item">
      <div className={`ico ${isSwap ? 'swap' : isIn ? 'in' : 'out'}`}>
        {isSwap ? <Icon name="swap" size={18} /> : isIn ? <Icon name="arrow-down" size={18} /> : <Icon name="arrow-up" size={18} />}
      </div>
      <div className="body">
        <div className="title">{titleMap[tx.type] ?? tx.type}</div>
        <div className="sub">{new Date(tx.createdAt).toLocaleString('ru-RU', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</div>
      </div>
      <div className="right">
        <div className={`amount ${isIn ? 'in' : ''}`}>{isIn ? '+' : '−'}{Number(tx.amount).toFixed(4)}</div>
        <div className="status">{tx.status}</div>
      </div>
    </div>
  );
}
