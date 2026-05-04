import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';
import { hapticImpact, hapticNotification, showAlert } from '../lib/telegram';

type Step = 'menu' | 'set-current' | 'set-new' | 'confirm-new' | 'remove';

export function Security() {
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<Step>('menu');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [activePin, setActivePin] = useState<string>('');

  async function load() { const r = await api.me(); setUser(r.user); }
  useEffect(() => { load(); }, []);

  function press(d: string) {
    hapticImpact('light');
    if (d === 'back') {
      setActivePin((p) => p.slice(0, -1));
      return;
    }
    if (activePin.length >= 6) return;
    const next = activePin + d;
    setActivePin(next);
    if (next.length === 4) handleSubmit(next);
  }

  async function handleSubmit(pin: string) {
    if (step === 'set-current') {
      setCurrentPin(pin);
      setActivePin('');
      setStep('set-new');
    } else if (step === 'set-new') {
      setNewPin(pin);
      setActivePin('');
      setStep('confirm-new');
    } else if (step === 'confirm-new') {
      if (pin !== newPin) {
        hapticNotification('error');
        showAlert('PIN не совпадает');
        setNewPin('');
        setActivePin('');
        setStep('set-new');
        return;
      }
      try {
        await api.setPin({ pin: newPin, currentPin: currentPin || undefined });
        hapticNotification('success');
        showAlert('✅ PIN установлен');
        await load();
        reset();
      } catch (e: any) {
        hapticNotification('error');
        showAlert(`❌ ${e.message}`);
        reset();
      }
    } else if (step === 'remove') {
      try {
        await api.removePin(pin);
        hapticNotification('success');
        showAlert('✅ PIN удалён');
        await load();
        reset();
      } catch (e: any) {
        hapticNotification('error');
        showAlert(`❌ ${e.message}`);
        reset();
      }
    }
  }

  function reset() { setStep('menu'); setCurrentPin(''); setNewPin(''); setConfirmPin(''); setActivePin(''); }

  if (step !== 'menu') {
    const titles: Record<Step, string> = {
      'menu': '',
      'set-current': 'Введите текущий PIN',
      'set-new': 'Придумайте PIN',
      'confirm-new': 'Повторите PIN',
      'remove': 'Введите PIN для удаления',
    };
    return (
      <div>
        <div className="page-header">
          <button className="back" onClick={reset}><Icon name="chevron-left" /></button>
          <div className="title">PIN-код</div>
        </div>
        <div className="page-title center">{titles[step]}</div>
        <div className="pin-dots">
          {[0,1,2,3].map((i) => <div key={i} className={`pin-dot ${activePin.length > i ? 'filled' : ''}`} />)}
        </div>
        <div className="pin-keypad">
          {['1','2','3','4','5','6','7','8','9','','0','back'].map((d, i) => (
            d === '' ? <div key={i} className="pin-key empty" /> :
            <div key={i} className="pin-key" onClick={() => press(d)}>
              {d === 'back' ? '⌫' : d}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/settings" className="back"><Icon name="chevron-left" /></Link>
        <div className="title">Безопасность</div>
      </div>

      <div className="section">
        <div className="row" onClick={() => { hapticImpact('medium'); setStep(user?.hasPin ? 'set-current' : 'set-new'); }}>
          <div className="icon-circle" style={{background:'var(--accent-grad-soft)', color:'var(--accent)'}}>
            <Icon name="lock" size={20} />
          </div>
          <div className="body">
            <div className="title">{user?.hasPin ? 'Изменить PIN' : 'Установить PIN'}</div>
            <div className="sub">4 цифры для входа в кошелёк</div>
          </div>
          <Icon name="chevron-right" size={18} color="var(--hint)" />
        </div>
        {user?.hasPin && (
          <div className="row" onClick={() => { hapticImpact('medium'); setStep('remove'); }}>
            <div className="icon-circle" style={{background:'var(--danger-bg)', color:'var(--danger)'}}>
              <Icon name="x" size={20} />
            </div>
            <div className="body">
              <div className="title" style={{color:'var(--danger)'}}>Удалить PIN</div>
            </div>
          </div>
        )}
      </div>

      <div className="muted px-16" style={{fontSize:12, lineHeight:1.5}}>
        🔒 PIN-код защищает доступ к кошельку. Аутентификация через Telegram остаётся обязательной.
      </div>
    </div>
  );
}
