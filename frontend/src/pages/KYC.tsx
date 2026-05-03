import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { hapticImpact, hapticNotification, showAlert } from '../lib/telegram';

const STATUS: Record<string, { text: string; cls: string; ico: string }> = {
  NONE: { text: 'Не пройдена', cls: 'gray', ico: '○' },
  PENDING: { text: 'На проверке', cls: 'yellow', ico: '⏳' },
  APPROVED: { text: 'Подтверждена', cls: 'green', ico: '✓' },
  REJECTED: { text: 'Отклонена', cls: 'red', ico: '✕' },
};

export function KYC() {
  const [status, setStatus] = useState<string>('NONE');
  const [latest, setLatest] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [docType, setDocType] = useState('passport');
  const [docNumber, setDocNumber] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await api.kycStatus();
    setStatus(r.status);
    setLatest(r.latest);
  }
  useEffect(() => { load(); }, []);

  async function submit() {
    hapticImpact('medium');
    if (!fullName || !docNumber || !docFile || !selfieFile) {
      return showAlert('Заполните все поля и загрузите оба фото');
    }
    const fd = new FormData();
    fd.append('fullName', fullName);
    fd.append('documentType', docType);
    fd.append('documentNumber', docNumber);
    fd.append('document', docFile);
    fd.append('selfie', selfieFile);
    setBusy(true);
    try {
      await api.kycSubmit(fd);
      hapticNotification('success');
      showAlert('Заявка отправлена на проверку');
      await load();
    } catch (e: any) {
      hapticNotification('error');
      showAlert(`Ошибка: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  const s = STATUS[status] ?? STATUS.NONE;
  const canSubmit = status === 'NONE' || status === 'REJECTED';

  return (
    <div>
      <div className="page-title">Верификация</div>

      <div className="section" style={{padding:20, textAlign:'center'}}>
        <div style={{fontSize:48, marginBottom:8}}>{s.ico}</div>
        <span className={`badge ${s.cls}`}>{s.text}</span>
        {latest?.rejectReason && (
          <div className="muted mt-12" style={{color:'var(--destructive)'}}>
            Причина: {latest.rejectReason}
          </div>
        )}
        {status === 'APPROVED' && (
          <div className="muted mt-12">Вам доступны все функции кошелька</div>
        )}
        {status === 'PENDING' && (
          <div className="muted mt-12">Обычно проверка занимает до 24 часов</div>
        )}
      </div>

      {canSubmit && (
        <>
          <div className="form-group">
            <div className="form-label">ФИО как в документе</div>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" />
          </div>

          <div className="form-group">
            <div className="form-label">Тип документа</div>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="passport">Паспорт</option>
              <option value="id_card">ID-карта</option>
              <option value="driver_license">Водительское удостоверение</option>
            </select>
          </div>

          <div className="form-group">
            <div className="form-label">Номер документа</div>
            <input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="0000 000000" />
          </div>

          <div className="form-group">
            <div className="form-label">Фото документа</div>
            <input type="file" accept="image/*" onChange={(e) => { setDocFile(e.target.files?.[0] ?? null); hapticImpact('light'); }} />
            {docFile && <div className="muted mt-8">✓ {docFile.name}</div>}
          </div>

          <div className="form-group">
            <div className="form-label">Селфи с документом</div>
            <input type="file" accept="image/*" capture="user" onChange={(e) => { setSelfieFile(e.target.files?.[0] ?? null); hapticImpact('light'); }} />
            {selfieFile && <div className="muted mt-8">✓ {selfieFile.name}</div>}
          </div>

          <div className="px-16 mt-16">
            <button className="btn" disabled={busy} onClick={submit}>
              {busy ? 'Отправка…' : 'Отправить на проверку'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
