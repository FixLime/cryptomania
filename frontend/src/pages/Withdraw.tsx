import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { currencyLabel, currencyTicker } from '../components/CurrencyIcon';
import {
  hapticImpact, hapticNotification, showAlert, showConfirm,
} from '../lib/telegram';

export function Withdraw() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [currency, setCurrency] = useState('TON');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.wallets().then((r) => setWallets(r.wallets));
  }, []);

  const wallet = wallets.find((w) => w.currency === currency);

  async function submit() {
    hapticImpact('medium');
    if (!toAddress || !amount) return showAlert('Заполните все поля');
    const ok = await showConfirm(
      `Подтвердить отправку?\n\n${amount} ${currencyTicker(currency)}\n→ ${toAddress.slice(0, 24)}…`,
    );
    if (!ok) return;
    hapticImpact('heavy');
    setBusy(true);
    try {
      const r = await api.withdraw({ currency, toAddress, amount });
      hapticNotification('success');
      showAlert(
        r.requiresApproval
          ? '✅ Заявка отправлена. Сумма выше лимита — требуется одобрение администратора.'
          : '✅ Транзакция поставлена в очередь.',
      );
      setAmount('');
      setToAddress('');
    } catch (e: any) {
      hapticNotification('error');
      showAlert(`❌ ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/wallets" onClick={() => hapticImpact('light')} className="back">‹</Link>
        <div className="title">Отправить</div>
      </div>

      <div className="form-group">
        <div className="form-label">Валюта</div>
        <select
          value={currency}
          onChange={(e) => { setCurrency(e.target.value); hapticImpact('light'); }}
        >
          {wallets.map((w) => (
            <option key={w.currency} value={w.currency}>
              {currencyLabel(w.currency)} — {Number(w.balance).toFixed(4)} {currencyTicker(w.currency)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <div className="form-label">Адрес получателя</div>
        <input
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          placeholder="Вставьте адрес"
        />
      </div>

      <div className="form-group">
        <div className="form-label">Сумма</div>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0.00"
        />
        {wallet && (
          <button
            className="btn ghost mt-8"
            style={{justifyContent:'flex-start', padding:'8px 4px'}}
            onClick={() => { setAmount(wallet.balance); hapticImpact('light'); }}
          >
            Доступно: {Number(wallet.balance).toFixed(6)} {currencyTicker(currency)} → Макс
          </button>
        )}
      </div>

      <div className="px-16 mt-16">
        <button className="btn" disabled={busy} onClick={submit}>
          {busy ? 'Отправка…' : 'Отправить'}
        </button>
      </div>

      <div className="muted center mt-16 px-16" style={{fontSize:12}}>
        ⚠️ Требуется пройденная KYC-верификация
      </div>
    </div>
  );
}
