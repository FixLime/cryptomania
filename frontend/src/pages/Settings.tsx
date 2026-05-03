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
      <div className="title">Настройки</div>

      <div className="card">
        <div className="muted">Telegram ID</div>
        <div style={{fontWeight:600}}>{user?.telegramId}</div>
        {user?.username && (
          <>
            <div className="muted" style={{marginTop:8}}>Username</div>
            <div style={{fontWeight:600}}>@{user.username}</div>
          </>
        )}
        <div className="muted" style={{marginTop:8}}>Статус аккаунта</div>
        <div style={{fontWeight:600}}>{user?.status}</div>
        <div className="muted" style={{marginTop:8}}>KYC</div>
        <div style={{fontWeight:600}}>{user?.kycStatus}</div>
      </div>

      <div className="card">
        <div className="subtitle" style={{margin:'0 0 12px'}}>Подключить внешний TON-кошелёк</div>
        <div className="muted" style={{marginBottom:12, fontSize:13}}>
          Опционально: можно подключить Tonkeeper / MyTonWallet для подписи транзакций со своего устройства.
        </div>
        <div onClick={() => hapticImpact('light')}>
          <TonConnectButton />
        </div>
      </div>

      {user?.isAdmin && (
        <div className="card" style={{borderColor:'var(--accent)'}}>
          <div className="subtitle" style={{margin:0}}>🛡 Вы администратор</div>
          <a href="#/admin" onClick={() => hapticImpact('medium')}>
            <button className="btn" style={{marginTop:12}}>Открыть админ-панель</button>
          </a>
        </div>
      )}
    </div>
  );
}
