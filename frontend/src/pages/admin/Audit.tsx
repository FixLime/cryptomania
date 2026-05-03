import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.adminAudit().then((r) => setLogs(r.logs));
  }, []);

  return (
    <div>
      <div className="subtitle" style={{marginTop:0}}>Журнал аудита</div>
      {logs.map((l) => (
        <div className="card" key={l.id}>
          <div style={{fontWeight:600}}>{l.action}</div>
          <div className="muted" style={{marginTop:4}}>
            {new Date(l.createdAt).toLocaleString('ru-RU')}
          </div>
          {l.actor && <div className="muted">Actor: @{l.actor.username ?? l.actor.telegramId}</div>}
          {l.targetUser && <div className="muted">Target: @{l.targetUser.username ?? l.targetUser.telegramId}</div>}
          {l.metadata && (
            <pre style={{fontSize:11, overflow:'auto', margin:'8px 0 0', color:'var(--hint)'}}>
              {JSON.stringify(l.metadata, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
