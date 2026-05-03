import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { currencyTicker } from '../components/CurrencyIcon';

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Подтверждено',
  PENDING: 'В обработке',
  AWAITING_APPROVAL: 'Ожидает одобрения',
  APPROVED: 'Одобрено',
  BROADCASTING: 'Отправляется',
  REJECTED: 'Отклонено',
  FAILED: 'Ошибка',
};

export function History() {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.transactions().then((r) => { setTxs(r.transactions); setLoading(false); });
  }, []);

  // Группируем по дням
  const groups: Record<string, any[]> = {};
  for (const t of txs) {
    const day = new Date(t.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    (groups[day] ??= []).push(t);
  }

  return (
    <div>
      <div className="page-title">История</div>

      {loading && <div className="empty"><div className="text">Загрузка…</div></div>}
      {!loading && txs.length === 0 && (
        <div className="empty">
          <div className="ico">📭</div>
          <div className="text">Транзакций пока нет</div>
        </div>
      )}

      {Object.entries(groups).map(([day, items]) => (
        <div key={day}>
          <div className="section-title">{day}</div>
          <div className="section">
            {items.map((t) => (
              <div className="tx-item" key={t.id}>
                <div className={`ico ${t.type === 'DEPOSIT' ? 'in' : 'out'}`}>
                  {t.type === 'DEPOSIT' ? '↓' : '↑'}
                </div>
                <div className="body">
                  <div className="title">{t.type === 'DEPOSIT' ? 'Получено' : 'Отправлено'}</div>
                  <div className="sub">
                    {STATUS_LABEL[t.status] ?? t.status}
                    {t.toAddress && t.type === 'WITHDRAWAL' && ` → ${t.toAddress.slice(0, 8)}…`}
                  </div>
                </div>
                <div className="right">
                  <div className={`amount ${t.type === 'DEPOSIT' ? 'in' : ''}`}>
                    {t.type === 'DEPOSIT' ? '+' : '−'}{Number(t.amount).toFixed(4)} {currencyTicker(t.currency)}
                  </div>
                  <div className="status">
                    {new Date(t.createdAt).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
