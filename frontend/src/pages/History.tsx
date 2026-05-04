import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { currencyTicker } from '../components/CurrencyIcon';
import { Icon } from '../components/Icon';
import { hapticImpact } from '../lib/telegram';

const FILTERS = [
  { v: 'ALL', l: 'Все' },
  { v: 'DEPOSIT', l: 'Депозиты' },
  { v: 'WITHDRAWAL', l: 'Выводы' },
  { v: 'INTERNAL_OUT', l: 'Переводы' },
  { v: 'SWAP_OUT', l: 'Обмены' },
];

export function History() {
  const [txs, setTxs] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  async function load(f: string) {
    setLoading(true);
    const r = await api.transactions(f === 'ALL' ? {} : { type: f });
    setTxs(r.transactions);
    setLoading(false);
  }
  useEffect(() => { load(filter); }, [filter]);

  const groups: Record<string, any[]> = {};
  for (const t of txs) {
    const d = new Date(t.createdAt);
    const today = new Date();
    let day: string;
    if (d.toDateString() === today.toDateString()) day = 'Сегодня';
    else if (d.toDateString() === new Date(today.getTime() - 86400000).toDateString()) day = 'Вчера';
    else day = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    (groups[day] ??= []).push(t);
  }

  return (
    <div>
      <div className="page-title">История</div>
      <div className="chips">
        {FILTERS.map((f) => (
          <div key={f.v} className={`chip ${filter === f.v ? 'active' : ''}`} onClick={() => { setFilter(f.v); hapticImpact('light'); }}>
            {f.l}
          </div>
        ))}
      </div>

      {loading && <div className="empty"><div className="text">Загрузка…</div></div>}
      {!loading && txs.length === 0 && (
        <div className="empty">
          <div className="ico">📭</div>
          <div className="text">Транзакций нет</div>
          <div className="sub">Начните с пополнения кошелька</div>
        </div>
      )}

      {Object.entries(groups).map(([day, items]) => (
        <div key={day}>
          <div className="section-title">{day}</div>
          <div className="section">
            {items.map((t) => <TxRow key={t.id} tx={t} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function TxRow({ tx }: { tx: any }) {
  const isIn = ['DEPOSIT', 'INTERNAL_IN', 'SWAP_IN', 'BONUS'].includes(tx.type);
  const isSwap = tx.type.startsWith('SWAP');
  const titleMap: Record<string, string> = {
    DEPOSIT: 'Пополнение',
    WITHDRAWAL: 'Вывод',
    INTERNAL_IN: tx.counterparty?.username ? `От @${tx.counterparty.username}` : 'Получено',
    INTERNAL_OUT: tx.counterparty?.username ? `→ @${tx.counterparty.username}` : 'Отправлено',
    SWAP_IN: 'Обмен',
    SWAP_OUT: 'Обмен',
    BONUS: 'Бонус',
    FEE: 'Комиссия',
  };
  return (
    <Link to={`/tx/${tx.id}`} style={{textDecoration:'none', color:'inherit'}}>
      <div className="tx-item">
        <div className={`ico ${isSwap ? 'swap' : isIn ? 'in' : 'out'}`}>
          {isSwap ? <Icon name="swap" size={18} /> : isIn ? <Icon name="arrow-down" size={18} /> : <Icon name="arrow-up" size={18} />}
        </div>
        <div className="body">
          <div className="title">{titleMap[tx.type] ?? tx.type}</div>
          <div className="sub">{new Date(tx.createdAt).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'})} · {tx.status}</div>
        </div>
        <div className="right">
          <div className={`amount ${isIn ? 'in' : ''}`}>{isIn ? '+' : '−'}{Number(tx.amount).toFixed(4)} {currencyTicker(tx.currency)}</div>
        </div>
      </div>
    </Link>
  );
}
