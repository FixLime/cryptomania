import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { CurrencyIcon, currencyLabel, currencyTicker } from '../components/CurrencyIcon';
import { Icon } from '../components/Icon';
import { hapticImpact, hapticNotification, showAlert, showConfirm } from '../lib/telegram';

export function Swap() {
  const navigate = useNavigate();
  const loc = useLocation() as any;
  const [wallets, setWallets] = useState<any[]>([]);
  const [from, setFrom] = useState<string>(loc.state?.from ?? 'TON');
  const [to, setTo] = useState<string>('USDT_TON');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.wallets().then((r) => setWallets(r.wallets)); }, []);

  useEffect(() => {
    if (!amount || from === to || Number(amount) <= 0) {
      setQuote(null);
      return;
    }
    const t = setTimeout(() => {
      api.swapQuote(from, to, amount).then(setQuote).catch(() => setQuote(null));
    }, 250);
    return () => clearTimeout(t);
  }, [from, to, amount]);

  const fromWallet = wallets.find((w) => w.currency === from);

  function flip() {
    hapticImpact('medium');
    setFrom(to);
    setTo(from);
    setAmount('');
    setQuote(null);
  }

  async function submit() {
    if (!quote) return;
    hapticImpact('medium');
    if (!(await showConfirm(`Обменять ${amount} ${currencyTicker(from)} на ${Number(quote.toAmount).toFixed(6)} ${currencyTicker(to)}?`))) return;
    hapticImpact('heavy');
    setBusy(true);
    try {
      await api.swap({ from, to, amount });
      hapticNotification('success');
      showAlert('✅ Обмен выполнен');
      navigate('/wallets');
    } catch (e: any) {
      hapticNotification('error');
      showAlert(`❌ ${e.message}`);
    } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="page-title">Обмен</div>

      <div className="form-group">
        <div className="form-label">Отдаёте</div>
        <div className="section" style={{margin:0, padding:14}}>
          <div className="row-flex">
            <CurrencyIcon currency={from} size={36} />
            <select value={from} onChange={(e) => { setFrom(e.target.value); hapticImpact('light'); }} style={{flex:1, background:'transparent', border:'none', fontWeight:600, padding:0}}>
              {wallets.map((w) => <option key={w.currency} value={w.currency}>{currencyLabel(w.currency)}</option>)}
            </select>
          </div>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            style={{marginTop:10, fontSize:24, fontWeight:700, border:'none', background:'transparent', padding:0}}
          />
          {fromWallet && (
            <div className="muted" style={{marginTop:8, display:'flex', justifyContent:'space-between'}}>
              <span>Доступно: {Number(fromWallet.balance).toFixed(4)} {currencyTicker(from)}</span>
              <button className="badge blue" onClick={() => { setAmount(fromWallet.balance); hapticImpact('light'); }} style={{cursor:'pointer'}}>МАКС</button>
            </div>
          )}
        </div>
      </div>

      <div style={{textAlign:'center', margin:'-2px 0'}}>
        <button className="icon-btn" onClick={flip} style={{margin:'0 auto', background:'var(--surface-elev)'}}>
          <Icon name="swap" size={20} />
        </button>
      </div>

      <div className="form-group">
        <div className="form-label">Получаете</div>
        <div className="section" style={{margin:0, padding:14}}>
          <div className="row-flex">
            <CurrencyIcon currency={to} size={36} />
            <select value={to} onChange={(e) => { setTo(e.target.value); hapticImpact('light'); }} style={{flex:1, background:'transparent', border:'none', fontWeight:600, padding:0}}>
              {wallets.map((w) => <option key={w.currency} value={w.currency}>{currencyLabel(w.currency)}</option>)}
            </select>
          </div>
          <div style={{marginTop:10, fontSize:24, fontWeight:700, color: quote ? 'var(--text)' : 'var(--hint)'}}>
            {quote ? Number(quote.toAmount).toFixed(6) : '0.00'}
          </div>
        </div>
      </div>

      {quote && (
        <div className="section" style={{padding:14}}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:13}}>
            <span className="muted">Курс</span>
            <span>1 {currencyTicker(from)} ≈ {quote.rate.toFixed(6)} {currencyTicker(to)}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:13, marginTop:6}}>
            <span className="muted">Комиссия ({quote.feePercent}%)</span>
            <span>{Number(quote.feeAmount).toFixed(6)} {currencyTicker(to)}</span>
          </div>
        </div>
      )}

      <div className="btn-fixed">
        <button className="btn" disabled={busy || !quote} onClick={submit}>
          {busy ? 'Обработка…' : 'Обменять'}
        </button>
      </div>
    </div>
  );
}
