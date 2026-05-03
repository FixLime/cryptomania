import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { hapticSelection } from './lib/telegram';

const TABS = [
  { to: '/wallets', icon: '💼', label: 'Кошелёк' },
  { to: '/history', icon: '🕐', label: 'История' },
  { to: '/kyc', icon: '🪪', label: 'KYC' },
  { to: '/settings', icon: '⚙️', label: 'Ещё' },
];

export function App() {
  const location = useLocation();
  const showTabbar = !location.pathname.startsWith('/wallets/');

  return (
    <div>
      <div className="app">
        <Outlet />
      </div>
      {showTabbar && (
        <nav className="tabbar">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} onClick={() => hapticSelection()}>
              <span className="icon">{t.icon}</span>
              <span className="label">{t.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
