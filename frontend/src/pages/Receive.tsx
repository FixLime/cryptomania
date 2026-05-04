import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../lib/api';
import { CurrencyIcon, currencyLabel, currencyNetwork } from '../components/CurrencyIcon';
import { Icon } from '../components/Icon';
import { hapticImpact, hapticNotification, showAlert } from '../lib/telegram';

export function Receive() {
  const { currency = 'TON' } = useParams();
  const [wallet, setWallet] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    api.wallets().then((r) => {
      const w = r.wallets.find((x) => x.currency === currency);
      setWallet(w);
    });
  }, [currency]);

  useEffect(() => {
    if (wallet?.address && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, wallet.address, {
        width: 200,
        margin: 0,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      }).catch(() => {});
    }
  }, [wallet]);

  if (!wallet) return <div className="empty"><div className="text">Загрузка…</div></div>;

  function copy() {
    navigator.clipboard.writeText(wallet.address);
    hapticNotification('success');
    showAlert('Адрес скопирован');
  }

  function share() {
    hapticImpact('medium');
    if (navigator.share) {
      navigator.share({ title: 'Мой адрес', text: wallet.address });
    } else copy();
  }

  return (
    <div>
      <div className="page-header">
        <Link to={`/wallets/${currency}`} className="back"><Icon name="chevron-left" /></Link>
        <div className="title">Получить {currencyLabel(currency)}</div>
      </div>

      <div className="qr-card">
        <canvas ref={canvasRef} />
        <div style={{display:'flex', alignItems:'center', gap:6, color:'#000', fontWeight:600, fontSize:13}}>
          <CurrencyIcon currency={currency} size={20} />
          <span>{currencyNetwork(currency)}</span>
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">Адрес</div>
        <div className="address">{wallet.address}</div>
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
        ⚠️ Отправляйте только {currencyLabel(currency)} в сети {currencyNetwork(currency)}.
        Активы из других сетей будут потеряны.
      </div>
    </div>
  );
}
