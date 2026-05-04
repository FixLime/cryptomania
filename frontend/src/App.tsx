import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { hapticSelection } from './lib/telegram';
import { Icon } from './components/Icon';

const TABS = [
  { to: '/wallets', icon: 'wallet' as const, label: 'Кошелёк' },
  { to: '/swap', icon: 'swap' as const, label: 'Обмен' },
  { to: '/history', icon: 'history' as const, label: 'История' },
  { to: '/settings', icon: 'settings' as const, label: 'Профиль' },
];

const HIDE_TABBAR_PREFIXES = ['/wallets/', '/send', '/receive/', '/tx/', '/security', '/address-book', '/referral', '/kyc'];

export function App() {
  const location = useLocation();
  const showTabbar = !HIDE_TABBAR_PREFIXES.some((p) => location.pathname.startsWith(p));

  return (
    <>
      <div className="app">
        <Outlet />
      </div>
      {showTabbar && (
        <nav className="tabbar">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} onClick={() => hapticSelection()}>
              {({ isActive }) => (
                <>
                  <span className="ico"><Icon name={t.icon} size={22} color={isActive ? 'var(--accent)' : 'var(--hint)'} /></span>
                  <span>{t.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
