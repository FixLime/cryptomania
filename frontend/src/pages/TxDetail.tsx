import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { currencyTicker, currencyLabel } from '../components/CurrencyIcon';
import { Icon } from '../components/Icon';
import { hapticNotification, showAlert } from '../lib/telegram';

export function TxDetail() {
  const { id } = useParams();
  const [tx, setTx] = useState<any>(null);

  useEffect(() => {
    api.transactions().then((r) => setTx(r.transactions.find((t) => t.id === id)));
  }, [id]);

  if (!tx) return <div className="empty"><div className="text">Загрузка…</div></div>;

  const isIn = ['DEPOSIT', 'INTERNAL_IN', 'SWAP_IN', 'BONUS'].includes(tx.type);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    hapticNotification('success');
    showAlert('Скопировано');
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/history" className="back"><Icon name="chevron-left" /></Link>
        <div className="title">Транзакция</div>
      </div>

      <div style={{textAlign:'center', padding:'12px 20px 24px'}}>
        <div className={`tx-item ${isIn ? '' : ''}`} style={{display:'inline-flex', padding:0}}>
          <div className={`ico ${isIn ? 'in' : 'out'}`} style={{width:64, height:64, fontSize:28}}>
            {isIn ? <Icon name="arrow-down" size={28} /> : <Icon name="arrow-up" size={28} />}
          </div>
        </div>
        <div style={{fontSize:32, fontWeight:700, marginTop:14, color: isIn ? 'var(--success)' : 'var(--text)'}}>
          {isIn ? '+' : '−'}{tx.amount} {currencyTicker(tx.currency)}
        </div>
        <div className="muted mt-8">{tx.type.replace('_', ' ')}</div>
        <div className="mt-12">
          <span className={`badge ${tx.status === 'CONFIRMED' ? 'green' : tx.status === 'FAILED' || tx.status === 'REJECTED' ? 'red' : 'yellow'}`}>{tx.status}</span>
        </div>
      </div>

      <div className="section">
        <Detail label="Валюта" value={currencyLabel(tx.currency)} />
        <Detail label="Дата" value={new Date(tx.createdAt).toLocaleString('ru-RU')} />
        {tx.counterparty && <Detail label="Контрагент" value={`@${tx.counterparty.username ?? tx.counterparty.telegramId}`} />}
        {tx.toAddress && <Detail label="Адрес" value={tx.toAddress} mono onCopy={() => copy(tx.toAddress)} />}
        {tx.txHash && <Detail label="Хэш" value={tx.txHash} mono onCopy={() => copy(tx.txHash)} />}
        {Number(tx.fee) > 0 && <Detail label="Комиссия" value={`${tx.fee} ${currencyTicker(tx.currency)}`} />}
        {tx.note && <Detail label="Сообщение" value={tx.note} />}
        {tx.rejectedReason && <Detail label="Причина" value={tx.rejectedReason} />}
      </div>
    </div>
  );
}

function Detail({ label, value, mono, onCopy }: { label: string; value: string; mono?: boolean; onCopy?: () => void }) {
  return (
    <div className="row" style={{cursor: onCopy ? 'pointer' : 'default'}} onClick={onCopy}>
      <div className="body">
        <div className="sub" style={{fontSize:12, marginTop:0}}>{label}</div>
        <div className="title" style={{fontSize:14, fontFamily: mono ? 'ui-monospace, monospace' : undefined, wordBreak:'break-all', marginTop:2}}>{value}</div>
      </div>
      {onCopy && <Icon name="copy" size={16} color="var(--hint)" />}
    </div>
  );
}
