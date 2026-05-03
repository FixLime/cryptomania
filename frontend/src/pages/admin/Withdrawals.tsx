import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { currencyLabel } from '../../components/CurrencyIcon';
import { hapticImpact, hapticNotification } from '../../lib/telegram';

export function AdminWithdrawals() {
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    const r = await api.adminWithdrawals();
    setItems(r.transactions);
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

  return (
    <div>
      <div className="subtitle" style={{marginTop:0}}>Выводы на одобрение</div>
      {items.length === 0 && <div className="muted">Очередь пуста.</div>}
      {items.map((t) => (
        <div className="card" key={t.id}>
          <div style={{fontWeight:600, fontSize:18}}>
            {t.amount} {currencyLabel(t.currency)}
          </div>
          <div className="muted" style={{marginTop:4}}>
            от @{t.user.username ?? t.user.telegramId}
          </div>
          <div className="muted" style={{marginTop:6}}>На адрес:</div>
          <div className="address">{t.toAddress}</div>
          <div className="muted" style={{marginTop:6}}>
            {new Date(t.createdAt).toLocaleString('ru-RU')}
          </div>
          <div className="row" style={{marginTop:12, gap:8}}>
            <button className="btn success" onClick={() => approve(t.id)}>✅ Одобрить</button>
            <button className="btn danger" onClick={() => reject(t.id)}>❌ Отклонить</button>
          </div>
        </div>
      ))}
    </div>
  );
}
