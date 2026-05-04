import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { currencyLabel, currencyTicker, CurrencyIcon } from '../components/CurrencyIcon';
import { Icon } from '../components/Icon';
import { hapticImpact, hapticNotification, showAlert, showConfirm } from '../lib/telegram';

type Mode = 'internal' | 'external';

export function Send() {
  const { currency: paramCurrency } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('internal');
  const [wallets, setWallets] = useState<any[]>([]);
  const [currency, setCurrency] = useState(paramCurrency ?? 'TON');
  const [target, setTarget] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [book, setBook] = useState<any[]>([]);

  useEffect(() => {
    api.wallets().then((r) => setWallets(r.wallets));
    api.addressBookList().then((r) => setBook(r.items));
  }, []);

  useEffect(() => {
    if (mode === 'internal' && target.length >= 2 && !selectedUser) {
      const t = setTimeout(() => {
        api.lookupUser(target).then((r) => setFoundUsers(r.users)).catch(() => setFoundUsers([]));
      }, 200);
      return () => clearTimeout(t);
    }
    setFoundUsers([]);
  }, [target, mode, selectedUser]);

  const wallet = wallets.find((w) => w.currency === currency);

  async function submit() {
    hapticImpact('medium');
    if (!amount) return showAlert('Укажите сумму');
    if (mode === 'internal') {
      const recipient = selectedUser?.username ? `@${selectedUser.username}` : selectedUser?.telegramId ?? target;
      if (!recipient) return showAlert('Выберите получателя');
      if (!(await showConfirm(`Перевести ${amount} ${currencyTicker(currency)} получателю ${recipient}?`))) return;
      hapticImpact('heavy');
      setBusy(true);
      try {
        await api.transfer({ to: recipient, currency, amount, note });
        hapticNotification('success');
        showAlert('✅ Перевод выполнен');
        navigate('/wallets');
      } catch (e: any) {
        hapticNotification('error');
        showAlert(`❌ ${e.message}`);
      } finally { setBusy(false); }
    } else {
      if (!toAddress) return showAlert('Укажите адрес');
      if (!(await showConfirm(`Отправить ${amount} ${currencyTicker(currency)} на адрес ${toAddress.slice(0,20)}…?`))) return;
      hapticImpact('heavy');
      setBusy(true);
      try {
        const r = await api.withdraw({ currency, toAddress, amount });
        hapticNotification('success');
        showAlert(r.requiresApproval ? '⏳ Заявка отправлена, требуется одобрение администратора' : '✅ Транзакция в очереди');
        navigate('/history');
      } catch (e: any) {
        hapticNotification('error');
        showAlert(`❌ ${e.message}`);
      } finally { setBusy(false); }
    }
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/wallets" className="back"><Icon name="chevron-left" /></Link>
        <div className="title">Отправить</div>
      </div>

      <div className="chips">
        <div className={`chip ${mode === 'internal' ? 'active' : ''}`} onClick={() => { setMode('internal'); hapticImpact('light'); }}>
          👤 По @username
        </div>
        <div className={`chip ${mode === 'external' ? 'active' : ''}`} onClick={() => { setMode('external'); hapticImpact('light'); }}>
          🌐 На адрес
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">Валюта</div>
        <select value={currency} onChange={(e) => { setCurrency(e.target.value); hapticImpact('light'); }}>
          {wallets.map((w) => (
            <option key={w.currency} value={w.currency}>
              {currencyLabel(w.currency)} — {Number(w.balance).toFixed(4)} {currencyTicker(w.currency)}
            </option>
          ))}
        </select>
      </div>

      {mode === 'internal' ? (
        <>
          <div className="form-group">
            <div className="form-label">Получатель</div>
            {selectedUser ? (
              <div className="row" style={{background:'var(--surface)', borderRadius:'var(--radius)', cursor:'default'}}>
                <div className="icon-circle" style={{background:'var(--accent-grad)', width:36, height:36, fontSize:14}}>
                  {selectedUser.firstName?.[0] ?? '?'}
                </div>
                <div className="body">
                  <div className="title">{selectedUser.firstName ?? selectedUser.username}</div>
                  <div className="sub">@{selectedUser.username ?? selectedUser.telegramId}</div>
                </div>
                <button className="icon-btn" onClick={() => { setSelectedUser(null); setTarget(''); }}>
                  <Icon name="x" size={16} />
                </button>
              </div>
            ) : (
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="@username или Telegram ID"
              />
            )}
          </div>
          {foundUsers.length > 0 && !selectedUser && (
            <div className="section" style={{marginTop:0}}>
              {foundUsers.map((u) => (
                <div key={u.id} className="row" onClick={() => { setSelectedUser(u); setFoundUsers([]); hapticImpact('light'); }}>
                  <div className="icon-circle" style={{background:'var(--accent-grad)', width:36, height:36, fontSize:14}}>
                    {u.firstName?.[0] ?? '?'}
                  </div>
                  <div className="body">
                    <div className="title">{u.firstName} {u.lastName}</div>
                    <div className="sub">@{u.username ?? u.telegramId}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="form-group">
            <div className="form-label">Адрес получателя</div>
            <input value={toAddress} onChange={(e) => setToAddress(e.target.value)} placeholder="Вставьте адрес" />
          </div>
          {book.filter((b) => b.currency === currency).length > 0 && (
            <>
              <div className="section-title">Из адресной книги</div>
              <div className="section">
                {book.filter((b) => b.currency === currency).map((b) => (
                  <div key={b.id} className="row" onClick={() => { setToAddress(b.address); hapticImpact('light'); }}>
                    <div className="icon-circle" style={{background:'var(--accent-grad-soft)', color:'var(--accent)'}}>
                      <Icon name="book" size={18} />
                    </div>
                    <div className="body">
                      <div className="title">{b.label}</div>
                      <div className="sub" style={{fontFamily:'ui-monospace, monospace', fontSize:11}}>{b.address.slice(0,28)}…</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="form-group">
        <div className="form-label">Сумма</div>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" />
        {wallet && (
          <button className="btn ghost mt-8" style={{justifyContent:'space-between', padding:'8px 4px'}} onClick={() => { setAmount(wallet.balance); hapticImpact('light'); }}>
            <span>Доступно: {Number(wallet.balance).toFixed(6)} {currencyTicker(currency)}</span>
            <span style={{fontWeight:700}}>МАКС</span>
          </button>
        )}
      </div>

      {mode === 'internal' && (
        <div className="form-group">
          <div className="form-label">Сообщение (необязательно)</div>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="За кофе ☕" />
        </div>
      )}

      <div className="btn-fixed">
        <button className="btn" disabled={busy} onClick={submit}>
          {busy ? 'Отправка…' : mode === 'internal' ? 'Отправить мгновенно' : 'Отправить'}
        </button>
        {mode === 'internal' && (
          <div className="muted center mt-12" style={{fontSize:12}}>
            ⚡ Без комиссии · Мгновенно
          </div>
        )}
      </div>
    </div>
  );
}
