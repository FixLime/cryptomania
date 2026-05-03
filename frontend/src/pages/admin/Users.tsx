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
      <div className="form-group">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="🔍 Поиск (id / username)"
        />
      </div>
      <div className="section">
        {users.map((u) => (
          <Link key={u.id} to={`/admin/users/${u.id}`} onClick={() => hapticImpact('light')} style={{textDecoration:'none', color:'inherit', display:'block'}}>
            <div className="row">
              <div className="icon" style={{background:'var(--accent)', fontSize:18}}>
                {u.firstName?.[0] ?? '?'}
              </div>
              <div className="body">
                <div className="title">@{u.username ?? u.telegramId}</div>
                <div className="sub">
                  <span className={`badge ${u.status === 'ACTIVE' ? 'green' : u.status === 'FROZEN' ? 'yellow' : 'red'}`}>{u.status}</span>
                  {' '}
                  <span className={`badge ${u.kycStatus === 'APPROVED' ? 'green' : 'gray'}`}>{u.kycStatus}</span>
                  {u.isAdmin && <> <span className="badge blue">ADMIN</span></>}
                </div>
              </div>
              <div className="chevron">›</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
