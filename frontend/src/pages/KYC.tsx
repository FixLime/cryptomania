import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { hapticImpact, hapticNotification, showAlert } from '../lib/telegram';

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  NONE: { text: 'Не пройдена', cls: 'gray' },
  PENDING: { text: 'На проверке', cls: 'yellow' },
  APPROVED: { text: 'Одобрена ✅', cls: 'green' },
  REJECTED: { text: 'Отклонена', cls: 'red' },
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
      return showAlert('Заполните все поля и загрузите оба файла.');
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
      showAlert('Заявка отправлена на проверку.');
      await load();
    } catch (e: any) {
      hapticNotification('error');
      showAlert(`Ошибка: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  const s = STATUS_LABEL[status] ?? STATUS_LABEL.NONE;
  const canSubmit = status === 'NONE' || status === 'REJECTED';

  return (
    <div>
      <div className="title">Верификация (KYC)</div>
      <div className="card">
        <div>Статус: <span className={`badge ${s.cls}`}>{s.text}</span></div>
        {latest?.rejectReason && (
          <div className="muted" style={{marginTop:8, color:'var(--destructive)'}}>
            Причина: {latest.rejectReason}
          </div>
        )}
      </div>

      {!canSubmit && (
        <div className="muted" style={{textAlign:'center', marginTop:16}}>
          {status === 'PENDING' ? '⏳ Заявка на рассмотрении.' : '✅ Вы прошли верификацию.'}
        </div>
      )}

      {canSubmit && (
        <div className="card">
          <div className="muted" style={{marginBottom:6}}>ФИО (как в документе)</div>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" />

          <div className="muted" style={{marginTop:12, marginBottom:6}}>Тип документа</div>
          <select value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="passport">Паспорт</option>
            <option value="id_card">ID-карта</option>
            <option value="driver_license">Водительское удостоверение</option>
          </select>

          <div className="muted" style={{marginTop:12, marginBottom:6}}>Номер документа</div>
          <input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="1234 567890" />

          <div className="muted" style={{marginTop:12, marginBottom:6}}>Фото документа</div>
          <input type="file" accept="image/*" onChange={(e) => { setDocFile(e.target.files?.[0] ?? null); hapticImpact('light'); }} />

          <div className="muted" style={{marginTop:12, marginBottom:6}}>Селфи с документом</div>
          <input type="file" accept="image/*" capture="user" onChange={(e) => { setSelfieFile(e.target.files?.[0] ?? null); hapticImpact('light'); }} />

          <button className="btn" style={{marginTop:16}} disabled={busy} onClick={submit}>
            {busy ? 'Отправка…' : 'Отправить на проверку'}
          </button>
        </div>
      )}
    </div>
  );
}
