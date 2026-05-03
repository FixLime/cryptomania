import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { hapticImpact, hapticNotification, showConfirm } from '../../lib/telegram';
import { CurrencyIcon, currencyLabel, currencyTicker } from '../../components/CurrencyIcon';

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
    if (!(await showConfirm('Заморозить аккаунт?'))) return;
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
    if (!(await showConfirm('Забанить навсегда?'))) return;
    await api.adminBan(id!);
    hapticNotification('error');
    await load();
  }

  if (!user) return <div className="empty"><div className="text">Загрузка…</div></div>;

  return (
    <div>
      <Link to="/admin/users" onClick={() => hapticImpact('light')} style={{display:'inline-block', padding:'0 16px', color:'var(--accent)'}}>‹ Назад к списку</Link>

      <div className="section mt-12" style={{padding:16, textAlign:'center'}}>
        <div style={{display:'inline-flex', width:64, height:64, borderRadius:32, background:'var(--accent)', alignItems:'center', justifyContent:'center', fontSize:28, color:'#fff', fontWeight:600}}>
          {user.firstName?.[0] ?? '?'}
        </div>
        <div style={{fontSize:18, fontWeight:600, marginTop:8}}>{user.firstName} {user.lastName}</div>
        <div className="muted">@{user.username ?? user.telegramId}</div>
        <div className="mt-12">
          <span className={`badge ${user.status === 'ACTIVE' ? 'green' : user.status === 'FROZEN' ? 'yellow' : 'red'}`}>{user.status}</span>
          {' '}
          <span className={`badge ${user.kycStatus === 'APPROVED' ? 'green' : 'gray'}`}>KYC {user.kycStatus}</span>
        </div>
      </div>

      <div className="btn-row">
        {user.status === 'ACTIVE' && <button className="btn secondary" onClick={freeze}>🧊 Заморозить</button>}
        {user.status === 'FROZEN' && <button className="btn success" onClick={unfreeze}>♨️ Разморозить</button>}
        {user.status !== 'BANNED' && <button className="btn danger" onClick={ban}>🚫 Бан</button>}
      </div>

      <div className="section-title">Кошельки</div>
      <div className="section">
        {user.wallets.map((w: any) => (
          <div className="row" key={w.id} style={{cursor:'default'}}>
            <CurrencyIcon currency={w.currency} />
            <div className="body">
              <div className="title">{currencyLabel(w.currency)}</div>
              <div className="sub" style={{fontFamily:'ui-monospace, monospace', fontSize:11}}>{w.address.slice(0,20)}…</div>
            </div>
            <div className="right">
              <div className="amount">{Number(w.balance).toFixed(4)}</div>
              <div className="fiat">{currencyTicker(w.currency)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">Последние транзакции</div>
      <div className="section">
        {user.transactions.map((t: any) => (
          <div className="tx-item" key={t.id}>
            <div className={`ico ${t.type === 'DEPOSIT' ? 'in' : 'out'}`}>{t.type === 'DEPOSIT' ? '↓' : '↑'}</div>
            <div className="body">
              <div className="title">{t.type} {Number(t.amount).toFixed(4)} {currencyTicker(t.currency)}</div>
              <div className="sub">{new Date(t.createdAt).toLocaleString('ru-RU')}</div>
            </div>
            <span className={`badge ${t.status === 'CONFIRMED' ? 'green' : 'gray'}`}>{t.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
