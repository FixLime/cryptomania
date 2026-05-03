import { useEffect, useState } from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { api } from '../lib/api';
import { hapticImpact } from '../lib/telegram';

export function Settings() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.me().then((r) => setUser(r.user));
  }, []);

  return (
    <div>
      <div className="page-title">Профиль</div>

      <div className="section">
        <div className="row" style={{cursor:'default'}}>
          <div className="icon" style={{background:'var(--accent)', fontSize:20}}>
            {user?.firstName?.[0] ?? '?'}
          </div>
          <div className="body">
            <div className="title">{user?.firstName} {user?.lastName}</div>
            <div className="sub">{user?.username ? `@${user.username}` : `ID: ${user?.telegramId}`}</div>
          </div>
        </div>
      </div>

      <div className="section-title">Аккаунт</div>
      <div className="section">
        <div className="row" style={{cursor:'default'}}>
          <div className="body">
            <div className="title">Статус</div>
          </div>
          <span className={`badge ${user?.status === 'ACTIVE' ? 'green' : 'yellow'}`}>{user?.status}</span>
        </div>
        <div className="row" style={{cursor:'default'}}>
          <div className="body">
            <div className="title">KYC</div>
          </div>
          <span className={`badge ${user?.kycStatus === 'APPROVED' ? 'green' : 'gray'}`}>{user?.kycStatus}</span>
        </div>
      </div>

      <div className="section-title">Внешний кошелёк</div>
      <div className="section" style={{padding:16}}>
        <div className="muted" style={{marginBottom:12, fontSize:13}}>
          Подключите Tonkeeper или MyTonWallet для подписи транзакций
        </div>
        <div onClick={() => hapticImpact('light')}>
          <TonConnectButton />
        </div>
      </div>

      {user?.isAdmin && (
        <>
          <div className="section-title">Администрирование</div>
          <a href="#/admin" onClick={() => hapticImpact('medium')} style={{display:'block'}}>
            <div className="section">
              <div className="row">
                <div className="icon" style={{background:'#ec3942'}}>🛡</div>
                <div className="body">
                  <div className="title">Админ-панель</div>
                  <div className="sub">KYC, выводы, пользователи</div>
                </div>
                <div className="chevron">›</div>
              </div>
            </div>
          </a>
        </>
      )}

      <div className="muted center mt-24" style={{fontSize:12, padding:'0 16px'}}>
        CryptoMania Wallet • v0.1
      </div>
    </div>
  );
}
