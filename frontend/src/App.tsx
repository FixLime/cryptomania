import { NavLink, Outlet } from 'react-router-dom';
import { hapticSelection } from './lib/telegram';

export function App() {
  return (
    <div>
      <div className="app">
        <Outlet />
      </div>
      <nav className="tabbar">
        <NavLink to="/wallets" onClick={() => hapticSelection()}>
          <span className="icon">💼</span>
          <span>Кошелёк</span>
        </NavLink>
        <NavLink to="/withdraw" onClick={() => hapticSelection()}>
          <span className="icon">📤</span>
          <span>Вывод</span>
        </NavLink>
        <NavLink to="/history" onClick={() => hapticSelection()}>
          <span className="icon">📜</span>
          <span>История</span>
        </NavLink>
        <NavLink to="/kyc" onClick={() => hapticSelection()}>
          <span className="icon">🪪</span>
          <span>KYC</span>
        </NavLink>
        <NavLink to="/settings" onClick={() => hapticSelection()}>
          <span className="icon">⚙️</span>
          <span>Настройки</span>
        </NavLink>
      </nav>
    </div>
  );
}
