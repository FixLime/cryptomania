import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.adminStats().then(setStats).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="empty" style={{color:'var(--destructive)'}}>{err}</div>;
  if (!stats) return <div className="empty"><div className="text">Загрузка…</div></div>;

  const tiles = [
    { label: 'Пользователей', value: stats.users, icon: '👥' },
    { label: 'KYC на проверке', value: stats.pendingKyc, icon: '🪪' },
    { label: 'Выводов в очереди', value: stats.pendingWithdrawals, icon: '⏳' },
    { label: 'Транзакций', value: stats.totalTxs, icon: '📊' },
  ];

  return (
    <div>
      <div className="stats-grid">
        {tiles.map((t) => (
          <div className="stat-tile" key={t.label}>
            <div className="ico">{t.icon}</div>
            <div className="val">{t.value}</div>
            <div className="lbl">{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
