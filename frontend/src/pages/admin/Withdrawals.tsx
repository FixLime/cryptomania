import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { currencyTicker } from '../../components/CurrencyIcon';
import { hapticImpact, hapticNotification } from '../../lib/telegram';

export function AdminWithdrawals() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await api.adminWithdrawals();
    setItems(r.transactions);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function approve(id: string) {
    hapticImpact('heavy');
    await api.adminWithdrawApprove(id);
    hapticNotification('success');
    await load();
  }

  async function reject(id: string) {
    hapticImpact('medium');
    const reason = prompt('Причина отклонения:');
    if (!reason) return;
    await api.adminWithdrawReject(id, reason);
    hapticNotification('warning');
    await load();
  }

  if (loading) return <div className="empty"><div className="text">Загрузка…</div></div>;
  if (items.length === 0) return (
    <div className="empty">
      <div className="ico">✓</div>
      <div className="text">Очередь пуста</div>
    </div>
  );

  return (
    <div>
      {items.map((t) => (
        <div className="section" key={t.id} style={{padding:16}}>
          <div style={{fontWeight:700, fontSize:20}}>
            {t.amount} {currencyTicker(t.currency)}
          </div>
          <div className="muted mt-8">от @{t.user.username ?? t.user.telegramId}</div>
          <div className="muted mt-12" style={{fontSize:12}}>На адрес:</div>
          <div className="address">{t.toAddress}</div>
          <div className="muted mt-8">{new Date(t.createdAt).toLocaleString('ru-RU')}</div>
          <div className="btn-row mt-12" style={{padding:0}}>
            <button className="btn success" onClick={() => approve(t.id)}>✓ Одобрить</button>
            <button className="btn danger" onClick={() => reject(t.id)}>✕ Отклонить</button>
          </div>
        </div>
      ))}
    </div>
  );
}
