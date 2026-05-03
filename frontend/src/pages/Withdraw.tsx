import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { currencyLabel } from '../components/CurrencyIcon';
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
      `Подтвердить вывод?\n\n${amount} ${currencyLabel(currency)}\n→ ${toAddress.slice(0, 20)}…`,
    );
    if (!ok) return;

    hapticImpact('heavy');
    setBusy(true);
    try {
      const r = await api.withdraw({ currency, toAddress, amount });
      hapticNotification('success');
      showAlert(
        r.requiresApproval
          ? 'Заявка отправлена. Сумма выше лимита — требуется одобрение администратора.'
          : 'Вывод поставлен в очередь обработки.',
      );
      setAmount('');
      setToAddress('');
    } catch (e: any) {
      hapticNotification('error');
      showAlert(`Ошибка: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="title">Вывод средств</div>

      <div className="card">
        <div className="muted" style={{marginBottom:6}}>Валюта</div>
        <select
          value={currency}
          onChange={(e) => { setCurrency(e.target.value); hapticImpact('light'); }}
        >
          {wallets.map((w) => (
            <option key={w.currency} value={w.currency}>
              {currencyLabel(w.currency)} (баланс: {Number(w.balance).toFixed(6)})
            </option>
          ))}
        </select>

        <div className="muted" style={{marginTop:12, marginBottom:6}}>Адрес получателя</div>
        <input
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          placeholder="0x... / EQ... / T..."
        />

        <div className="muted" style={{marginTop:12, marginBottom:6}}>Сумма</div>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0.00"
        />
        {wallet && (
          <button
            className="btn secondary"
            style={{marginTop:8}}
            onClick={() => { setAmount(wallet.balance); hapticImpact('light'); }}
          >
            Использовать макс: {Number(wallet.balance).toFixed(6)}
          </button>
        )}
      </div>

      <button className="btn" disabled={busy} onClick={submit}>
        {busy ? 'Обработка…' : '📤 Отправить'}
      </button>

      <div className="muted" style={{marginTop:12, textAlign:'center'}}>
        ⚠️ Выводы возможны только после прохождения KYC.
      </div>
    </div>
  );
}
