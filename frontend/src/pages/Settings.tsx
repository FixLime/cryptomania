import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';
import { hapticImpact, hapticSelection } from '../lib/telegram';

export function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  async function load() { const r = await api.me(); setUser(r.user); }
  useEffect(() => { load(); }, []);

  async function toggle(field: string, value: boolean) {
    hapticSelection();
    setUser({ ...user, [field]: value });
    await api.updateSettings({ [field]: value });
  }

  return (
    <div>
      <div className="page-title">Профиль</div>

      <div className="section" style={{padding:18, textAlign:'center'}}>
        <div className="icon-circle" style={{background:'var(--accent-grad)', width:72, height:72, fontSize:30, margin:'0 auto'}}>
          {user?.firstName?.[0] ?? '?'}
        </div>
        <div style={{fontSize:18, fontWeight:700, marginTop:10}}>{user?.firstName} {user?.lastName}</div>
        <div className="muted">{user?.username ? `@${user.username}` : `ID: ${user?.telegramId}`}</div>
        <div className="mt-12">
          <span className={`badge ${user?.kycStatus === 'APPROVED' ? 'green' : 'gray'}`}>KYC {user?.kycStatus}</span>
          {' '}
          <span className={`badge ${user?.status === 'ACTIVE' ? 'green' : 'yellow'}`}>{user?.status}</span>
        </div>
      </div>

      <div className="section-title">Аккаунт</div>
      <div className="section">
        <Link to="/kyc" onClick={() => hapticImpact('light')} style={{textDecoration:'none', color:'inherit'}}>
          <Row icon="user" title="Верификация (KYC)" sub={user?.kycStatus} chevron />
        </Link>
        <Link to="/security" onClick={() => hapticImpact('light')} style={{textDecoration:'none', color:'inherit'}}>
          <Row icon="lock" title="Безопасность" sub={user?.hasPin ? 'PIN установлен' : 'PIN не установлен'} chevron />
        </Link>
        <Link to="/address-book" onClick={() => hapticImpact('light')} style={{textDecoration:'none', color:'inherit'}}>
          <Row icon="book" title="Адресная книга" chevron />
        </Link>
        <Link to="/referral" onClick={() => hapticImpact('light')} style={{textDecoration:'none', color:'inherit'}}>
          <Row icon="gift" title="Пригласить друзей" sub="Получите бонусы" chevron />
        </Link>
      </div>

      <div className="section-title">Уведомления</div>
      <div className="section">
        <Row
          icon="bell" title="Уведомлять о депозитах"
          right={<div className={`toggle ${user?.notifyDeposits ? 'on' : ''}`} onClick={() => toggle('notifyDeposits', !user?.notifyDeposits)} />}
        />
        <Row
          icon="send" title="Уведомлять о выводах"
          right={<div className={`toggle ${user?.notifyWithdrawals ? 'on' : ''}`} onClick={() => toggle('notifyWithdrawals', !user?.notifyWithdrawals)} />}
        />
        <Row
          icon="eye-off" title="Скрывать балансы"
          right={<div className={`toggle ${user?.hideBalances ? 'on' : ''}`} onClick={() => toggle('hideBalances', !user?.hideBalances)} />}
        />
      </div>

      {user?.isAdmin && (
        <>
          <div className="section-title">Администрирование</div>
          <div className="section" onClick={() => { hapticImpact('medium'); navigate('/admin'); }}>
            <Row icon="shield" title="Админ-панель" sub="KYC, выводы, юзеры, аудит" chevron color="var(--danger)" />
          </div>
        </>
      )}

      <div className="muted center mt-24" style={{fontSize:12}}>
        CryptoMania Wallet · v0.2
      </div>
    </div>
  );
}

function Row({ icon, title, sub, right, chevron, color }: any) {
  return (
    <div className="row">
      <div className="icon-circle" style={{background:'var(--accent-grad-soft)', color: color ?? 'var(--accent)'}}>
        <Icon name={icon} size={20} />
      </div>
      <div className="body">
        <div className="title">{title}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {right ?? (chevron && <Icon name="chevron-right" size={18} color="var(--hint)" />)}
    </div>
  );
}
