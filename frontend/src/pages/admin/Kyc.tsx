import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { hapticImpact, hapticNotification } from '../../lib/telegram';

export function AdminKyc() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await api.adminKycPending();
    setItems(r.submissions);
    setLoading(false);
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

  if (loading) return <div className="empty"><div className="text">Загрузка…</div></div>;
  if (items.length === 0) return (
    <div className="empty">
      <div className="ico">✓</div>
      <div className="text">Нет заявок на проверке</div>
    </div>
  );

  return (
    <div>
      {items.map((s) => (
        <div className="section" key={s.id} style={{padding:16}}>
          <div style={{fontWeight:600, fontSize:16}}>{s.fullName}</div>
          <div className="muted mt-8">@{s.user.username ?? s.user.telegramId}</div>
          <div className="muted">{s.documentType}: {s.documentNumber}</div>
          <div className="muted">{new Date(s.createdAt).toLocaleString('ru-RU')}</div>
          <div className="btn-row mt-12" style={{padding:0}}>
            <button className="btn success" onClick={() => approve(s.id)}>✓ Одобрить</button>
            <button className="btn danger" onClick={() => reject(s.id)}>✕ Отклонить</button>
          </div>
        </div>
      ))}
    </div>
  );
}
