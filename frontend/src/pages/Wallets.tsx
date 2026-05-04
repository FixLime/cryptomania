import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { CurrencyIcon, currencyLabel, currencyNetwork, currencyTicker } from '../components/CurrencyIcon';
import { Icon } from '../components/Icon';
import { hapticImpact, hapticNotification, hapticSelection } from '../lib/telegram';

export function Wallets() {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  async function load() {
    try {
      const [w, m] = await Promise.all([api.wallets(), api.me()]);
      setWallets(w.wallets);
      setUser(m.user);
      setHidden(m.user.hideBalances);
    } catch (e: any) {
      hapticNotification('error');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function toggleHidden() {
    hapticSelection();
    const next = !hidden;
    setHidden(next);
    await api.updateSettings({ hideBalances: next });
  }

  const totalUsd = wallets.reduce((s, w) => s + (w.usdValue || 0), 0);
  const fmt = (n: number) => hidden ? '••••' : n.toFixed(2);
  const [intPart, decPart] = totalUsd.toFixed(2).split('.');

  return (
    <div>
      <div className="topbar">
        <div className="avatar">{user?.firstName?.[0] ?? '?'}</div>
        <div style={{flex:1, marginLeft:6}}>
          <div className="name">{user?.firstName ?? 'User'}</div>
          <div className="sub">{user?.username ? `@${user.username}` : 'Tap to open profile'}</div>
        </div>
        <button className="icon-btn" onClick={() => { hapticImpact('light'); navigate('/security'); }}>
          <Icon name="shield" size={18} />
        </button>
      </div>

      <div className="hero">
        <div className="label">
          <Icon name="wallet" size={14} /> Общий баланс
        </div>
        <div className="balance">
          <span className="currency">$</span>
          {hidden ? '••••••' : (<>{intPart}<span className="dec">.{decPart}</span></>)}
        </div>
        <div className="change">≈ {wallets.length} активов</div>
        <button className="eye" onClick={toggleHidden}>
          <Icon name={hidden ? 'eye-off' : 'eye'} size={16} />
        </button>
      </div>

      <div className="action-grid">
        <button className="action" onClick={() => { hapticImpact('medium'); navigate('/receive/TON'); }}>
          <span className="ico"><Icon name="arrow-down" /></span>
          <span className="lbl">Получить</span>
        </button>
        <button className="action" onClick={() => { hapticImpact('medium'); navigate('/send'); }}>
          <span className="ico"><Icon name="send" /></span>
          <span className="lbl">Отправить</span>
        </button>
        <button className="action" onClick={() => { hapticImpact('medium'); navigate('/swap'); }}>
          <span className="ico"><Icon name="swap" /></span>
          <span className="lbl">Обмен</span>
        </button>
        <button className="action" onClick={() => { hapticImpact('light'); navigate('/history'); }}>
          <span className="ico"><Icon name="history" /></span>
          <span className="lbl">История</span>
        </button>
      </div>

      <div className="section-title">
        <span>Активы</span>
        <Link to="/swap">Обменять</Link>
      </div>

      {loading && (
        <div className="section">
          {[1,2,3].map((i) => (
            <div key={i} className="row">
              <div className="skel" style={{width:42,height:42,borderRadius:'50%'}} />
              <div className="body">
                <div className="skel" style={{width:80, height:14}} />
                <div className="skel" style={{width:50, height:11, marginTop:6}} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="section">
          {wallets.map((w) => (
            <Link
              key={w.id}
              to={`/wallets/${w.currency}`}
              onClick={() => hapticImpact('light')}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="row">
                <CurrencyIcon currency={w.currency} />
                <div className="body">
                  <div className="title">{currencyLabel(w.currency)}</div>
                  <div className="sub">{currencyNetwork(w.currency)} · ${w.usdRate?.toFixed(2) ?? '—'}</div>
                </div>
                <div className="right">
                  <div className="amount">{hidden ? '••••' : `${Number(w.balance).toFixed(4)} ${currencyTicker(w.currency)}`}</div>
                  <div className="fiat">{hidden ? '••••' : `$${fmt(w.usdValue || 0)}`}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
