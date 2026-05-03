import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { hapticImpact, hapticNotification, showAlert } from '../../lib/telegram';

export function AdminKyc() {
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    const r = await api.adminKycPending();
    setItems(r.submissions);
  }
  useEffect(() => { load(); }, []);

  async function approve(id: string) {
    hapticImpact('medium');
    await api.adminKycApprove(id);
    hapticNotification('success');
    await load();
  }

  async function reject(id: string) {
    hapticImpact('medium');
    const reason = prompt('Причина отклонения:');
    if (!reason) return;
    await api.adminKycReject(id, reason);
    hapticNotification('warning');
    await load();
  }

  return (
    <div>
      <div className="subtitle" style={{marginTop:0}}>Заявки на KYC</div>
      {items.length === 0 && <div className="muted">Нет заявок на проверке.</div>}
      {items.map((s) => (
        <div className="card" key={s.id}>
          <div style={{fontWeight:600}}>{s.fullName}</div>
          <div className="muted">@{s.user.username ?? s.user.telegramId}</div>
          <div className="muted" style={{marginTop:6}}>
            {s.documentType}: {s.documentNumber}
          </div>
          <div className="muted" style={{marginTop:6}}>
            Подано: {new Date(s.createdAt).toLocaleString('ru-RU')}
          </div>
          <div className="row" style={{marginTop:12, gap:8}}>
            <button className="btn success" onClick={() => approve(s.id)}>✅ Одобрить</button>
            <button className="btn danger" onClick={() => reject(s.id)}>❌ Отклонить</button>
          </div>
        </div>
      ))}
    </div>
  );
}
