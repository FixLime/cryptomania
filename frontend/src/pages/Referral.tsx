import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';
import { hapticNotification, showAlert } from '../lib/telegram';

export function Referral() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => { api.me().then((r) => setUser(r.user)); }, []);

  const link = user ? `https://t.me/your_bot?start=ref_${user.referralCode}` : '';

  function copy() {
    navigator.clipboard.writeText(link);
    hapticNotification('success');
    showAlert('Ссылка скопирована');
  }

  function share() {
    if (navigator.share) {
      navigator.share({ title: 'CryptoMania Wallet', text: 'Присоединяйся!', url: link });
    } else copy();
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/settings" className="back"><Icon name="chevron-left" /></Link>
        <div className="title">Пригласить друзей</div>
      </div>

      <div className="hero" style={{textAlign:'center'}}>
        <div className="label" style={{justifyContent:'center'}}>
          <Icon name="gift" size={14} /> Бонусная программа
        </div>
        <div style={{fontSize:28, fontWeight:700, marginTop:8}}>+$5 за друга</div>
        <div className="change" style={{justifyContent:'center'}}>
          Друг получает $1 при регистрации
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">Ваша реферальная ссылка</div>
        <div className="address">{link}</div>
      </div>

      <div className="btn-row">
        <button className="btn secondary" onClick={copy}>
          <Icon name="copy" size={18} /> Копировать
        </button>
        <button className="btn" onClick={share}>
          <Icon name="send" size={18} /> Поделиться
        </button>
      </div>

      <div className="muted center mt-16 px-16" style={{fontSize:12, lineHeight:1.5}}>
        💰 Бонус начисляется после прохождения KYC приглашённым пользователем и первой транзакции от $10
      </div>
    </div>
  );
}
