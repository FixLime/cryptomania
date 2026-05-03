import { NavLink, Outlet, Link } from 'react-router-dom';
import { hapticSelection, hapticImpact } from '../../lib/telegram';

const TABS = [
  { to: '/admin', icon: '📊', label: 'Обзор', end: true },
  { to: '/admin/kyc', icon: '🪪', label: 'KYC' },
  { to: '/admin/withdrawals', icon: '↑', label: 'Выводы' },
  { to: '/admin/users', icon: '👥', label: 'Юзеры' },
  { to: '/admin/audit', icon: '📜', label: 'Аудит' },
];

export function AdminLayout() {
  return (
    <div>
      <div className="app">
        <div className="page-header">
          <Link to="/" onClick={() => hapticImpact('light')} className="back">‹</Link>
          <div className="title">🛡 Админ</div>
        </div>
        <Outlet />
      </div>
      <nav className="tabbar">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} onClick={() => hapticSelection()}>
            <span className="icon">{t.icon}</span>
            <span className="label">{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
