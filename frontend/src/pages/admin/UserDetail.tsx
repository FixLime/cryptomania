import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { hapticImpact, hapticNotification, showConfirm } from '../../lib/telegram';
import { currencyLabel } from '../../components/CurrencyIcon';

export function AdminUserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);

  async function load() {
    const r = await api.adminUser(id!);
    setUser(r.user);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function freeze() {
    hapticImpact('medium');
    if (!(await showConfirm('Заморозить аккаунт? Выводы будут недоступны.'))) return;
    await api.adminFreeze(id!);
    hapticNotification('warning');
    await load();
  }
  async function unfreeze() {
    hapticImpact('medium');
    await api.adminUnfreeze(id!);
    hapticNotification('success');
    await load();
  }
  async function ban() {
    hapticImpact('heavy');
    if (!(await showConfirm('Заблокировать аккаунт навсегда?'))) return;
    await api.adminBan(id!);
    hapticNotification('error');
    await load();
  }

  if (!user) return <div className="muted">Загрузка…</div>;

  return (
    <div>
      <Link to="/admin/users" onClick={() => hapticImpact('light')} style={{color:'var(--accent)'}}>← Назад</Link>
      <div className="card" style={{marginTop:12}}>
        <div style={{fontWeight:600, fontSize:18}}>@{user.username ?? user.telegramId}</div>
        <div className="muted">{user.firstName} {user.lastName}</div>
        <div className="muted">TG: {user.telegramId}</div>
        <div className="row" style={{marginTop:8, gap:6}}>
          <span className={`badge ${user.status === 'ACTIVE' ? 'green' : user.status === 'FROZEN' ? 'yellow' : 'red'}`}>{user.status}</span>
          <span className={`badge ${user.kycStatus === 'APPROVED' ? 'green' : 'gray'}`}>KYC: {user.kycStatus}</span>
        </div>
      </div>

      <div className="row" style={{gap:8}}>
        {user.status === 'ACTIVE' && <button className="btn danger" onClick={freeze}>🧊 Заморозить</button>}
        {user.status === 'FROZEN' && <button className="btn success" onClick={unfreeze}>♨️ Разморозить</button>}
        {user.status !== 'BANNED' && <button className="btn danger" onClick={ban}>🚫 Бан</button>}
      </div>

      <div className="subtitle">Кошельки</div>
      {user.wallets.map((w: any) => (
        <div className="card" key={w.id}>
          <div style={{fontWeight:600}}>{currencyLabel(w.currency)}</div>
          <div className="muted">Баланс: {w.balance}</div>
          <div className="address" style={{marginTop:6}}>{w.address}</div>
        </div>
      ))}

      <div className="subtitle">Последние транзакции</div>
      {user.transactions.map((t: any) => (
        <div className="card" key={t.id}>
          <div className="row">
            <div style={{flex:1}}>
              <div style={{fontWeight:600}}>{t.type} • {t.amount} {currencyLabel(t.currency)}</div>
              <div className="muted">{new Date(t.createdAt).toLocaleString('ru-RU')}</div>
            </div>
            <span className={`badge ${t.status === 'CONFIRMED' ? 'green' : 'gray'}`}>{t.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
