import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.adminAudit().then((r) => setLogs(r.logs));
  }, []);

  return (
    <div>
      <div className="section">
        {logs.map((l) => (
          <div className="tx-item" key={l.id}>
            <div className="ico" style={{background:'rgba(64,167,227,0.18)', color:'var(--accent)'}}>📜</div>
            <div className="body">
              <div className="title">{l.action}</div>
              <div className="sub">
                {new Date(l.createdAt).toLocaleString('ru-RU')}
                {l.actor && ` • @${l.actor.username ?? l.actor.telegramId}`}
                {l.targetUser && ` → @${l.targetUser.username ?? l.targetUser.telegramId}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
