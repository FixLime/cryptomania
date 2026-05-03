import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { currencyLabel } from '../components/CurrencyIcon';

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: 'green',
  PENDING: 'yellow',
  AWAITING_APPROVAL: 'yellow',
  APPROVED: 'yellow',
  BROADCASTING: 'yellow',
  REJECTED: 'red',
  FAILED: 'red',
};

const TYPE_ICON: Record<string, string> = {
  DEPOSIT: '⬇️',
  WITHDRAWAL: '⬆️',
  INTERNAL: '↔️',
  FEE: '💸',
};

export function History() {
  const [txs, setTxs] = useState<any[]>([]);

  useEffect(() => {
    api.transactions().then((r) => setTxs(r.transactions));
  }, []);

  return (
    <div>
      <div className="title">История</div>
      {txs.length === 0 && <div className="muted">Пока пусто.</div>}
      {txs.map((t) => (
        <div key={t.id} className="card">
          <div className="row">
            <div style={{fontSize:22}}>{TYPE_ICON[t.type]}</div>
            <div style={{flex:1, marginLeft:10}}>
              <div style={{fontWeight:600}}>
                {t.type === 'DEPOSIT' ? '+' : '−'}{t.amount} {currencyLabel(t.currency)}
              </div>
              <div className="muted">{new Date(t.createdAt).toLocaleString('ru-RU')}</div>
            </div>
            <span className={`badge ${STATUS_BADGE[t.status] ?? 'gray'}`}>{t.status}</span>
          </div>
          {t.txHash && (
            <div className="address" style={{marginTop:8}}>{t.txHash}</div>
          )}
          {t.rejectedReason && (
            <div className="muted" style={{color:'var(--destructive)', marginTop:6}}>
              {t.rejectedReason}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
