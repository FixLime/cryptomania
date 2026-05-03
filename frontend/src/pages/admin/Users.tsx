import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { hapticImpact } from '../../lib/telegram';

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState('');

  async function load() {
    const r = await api.adminUsers(q);
    setUsers(r.users);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <div className="row" style={{gap:8}}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск (telegram id / username)" />
        <button className="btn secondary" style={{width:'auto'}} onClick={() => { hapticImpact('light'); load(); }}>🔍</button>
      </div>
      <div style={{marginTop:12}}>
        {users.map((u) => (
          <Link key={u.id} to={`/admin/users/${u.id}`} onClick={() => hapticImpact('light')} style={{textDecoration:'none', color:'inherit'}}>
            <div className="card">
              <div style={{fontWeight:600}}>@{u.username ?? u.telegramId}</div>
              <div className="muted">TG: {u.telegramId}</div>
              <div className="row" style={{marginTop:6, gap:6}}>
                <span className={`badge ${u.status === 'ACTIVE' ? 'green' : u.status === 'FROZEN' ? 'yellow' : 'red'}`}>{u.status}</span>
                <span className={`badge ${u.kycStatus === 'APPROVED' ? 'green' : 'gray'}`}>KYC: {u.kycStatus}</span>
                {u.isAdmin && <span className="badge yellow">ADMIN</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
