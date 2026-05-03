import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.adminStats().then(setStats).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="card" style={{color:'var(--destructive)'}}>{err}</div>;
  if (!stats) return <div className="muted">Загрузка…</div>;

  const tiles = [
    { label: 'Пользователей', value: stats.users, icon: '👥' },
    { label: 'KYC на проверке', value: stats.pendingKyc, icon: '🪪' },
    { label: 'Выводов на одобрение', value: stats.pendingWithdrawals, icon: '⏳' },
    { label: 'Всего транзакций', value: stats.totalTxs, icon: '📊' },
  ];

  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
      {tiles.map((t) => (
        <div className="card" key={t.label} style={{margin:0}}>
          <div style={{fontSize:24}}>{t.icon}</div>
          <div className="muted" style={{marginTop:6}}>{t.label}</div>
          <div className="balance-big" style={{fontSize:24}}>{t.value}</div>
        </div>
      ))}
    </div>
  );
}
