import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { CurrencyIcon, currencyLabel } from '../components/CurrencyIcon';
import { Icon } from '../components/Icon';
import { hapticImpact, hapticNotification, showAlert, showConfirm } from '../lib/telegram';

const CURRENCIES = ['TON', 'USDT_TON', 'USDT_TRC20', 'ETH', 'BTC'];

export function AddressBook() {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [label, setLabel] = useState('');
  const [currency, setCurrency] = useState('TON');
  const [address, setAddress] = useState('');

  async function load() { const r = await api.addressBookList(); setItems(r.items); }
  useEffect(() => { load(); }, []);

  async function add() {
    hapticImpact('medium');
    if (!label || !address) return showAlert('Заполните все поля');
    try {
      await api.addressBookCreate({ label, currency, address });
      hapticNotification('success');
      setLabel(''); setAddress(''); setShow(false);
      await load();
    } catch (e: any) {
      hapticNotification('error');
      showAlert(e.message);
    }
  }

  async function del(id: string) {
    hapticImpact('medium');
    if (!(await showConfirm('Удалить адрес?'))) return;
    await api.addressBookDelete(id);
    hapticNotification('warning');
    await load();
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/settings" className="back"><Icon name="chevron-left" /></Link>
        <div className="title">Адресная книга</div>
        <button className="back" onClick={() => { setShow(!show); hapticImpact('light'); }}><Icon name="plus" /></button>
      </div>

      {show && (
        <>
          <div className="form-group">
            <div className="form-label">Название</div>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Например: Биржа Binance" />
          </div>
          <div className="form-group">
            <div className="form-label">Валюта</div>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{currencyLabel(c)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <div className="form-label">Адрес</div>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Адрес кошелька" />
          </div>
          <div className="btn-fixed">
            <button className="btn" onClick={add}>Сохранить</button>
          </div>
        </>
      )}

      {items.length === 0 && !show && (
        <div className="empty">
          <div className="ico">📒</div>
          <div className="text">Адресов пока нет</div>
          <div className="sub">Сохраните часто используемые адреса</div>
        </div>
      )}

      {items.length > 0 && (
        <div className="section">
          {items.map((b) => (
            <div key={b.id} className="row" onClick={() => del(b.id)}>
              <CurrencyIcon currency={b.currency} />
              <div className="body">
                <div className="title">{b.label}</div>
                <div className="sub" style={{fontFamily:'ui-monospace, monospace', fontSize:11}}>{b.address.slice(0, 28)}…</div>
              </div>
              <Icon name="x" size={18} color="var(--hint)" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
