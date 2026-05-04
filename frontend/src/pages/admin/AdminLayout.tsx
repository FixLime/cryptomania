import { NavLink, Outlet, Link } from 'react-router-dom';
import { hapticSelection, hapticImpact } from '../../lib/telegram';
import { Icon } from '../../components/Icon';

const TABS = [
  { to: '/admin', icon: 'wallet' as const, label: 'Обзор', end: true },
  { to: '/admin/kyc', icon: 'user' as const, label: 'KYC' },
  { to: '/admin/withdrawals', icon: 'send' as const, label: 'Выводы' },
  { to: '/admin/users', icon: 'search' as const, label: 'Юзеры' },
  { to: '/admin/audit', icon: 'history' as const, label: 'Аудит' },
];

export function AdminLayout() {
  return (
    <div>
      <div className="app">
        <div className="page-header">
          <Link to="/" onClick={() => hapticImpact('light')} className="back"><Icon name="chevron-left" /></Link>
          <div className="title">🛡 Админ</div>
        </div>
        <Outlet />
      </div>
      <nav className="tabbar">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} onClick={() => hapticSelection()}>
            {({ isActive }) => (
              <>
                <span className="ico"><Icon name={t.icon} size={20} color={isActive ? 'var(--accent)' : 'var(--hint)'} /></span>
                <span>{t.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
