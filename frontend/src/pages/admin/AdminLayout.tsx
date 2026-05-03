import { NavLink, Outlet, Link } from 'react-router-dom';
import { hapticSelection, hapticImpact } from '../../lib/telegram';

export function AdminLayout() {
  return (
    <div>
      <div className="app">
        <Link to="/" onClick={() => hapticImpact('light')} style={{color:'var(--accent)'}}>← В кошелёк</Link>
        <div className="title">🛡 Админ-панель</div>
        <Outlet />
      </div>
      <nav className="tabbar">
        <NavLink to="/admin" end onClick={() => hapticSelection()}>
          <span className="icon">📊</span><span>Обзор</span>
        </NavLink>
        <NavLink to="/admin/kyc" onClick={() => hapticSelection()}>
          <span className="icon">🪪</span><span>KYC</span>
        </NavLink>
        <NavLink to="/admin/withdrawals" onClick={() => hapticSelection()}>
          <span className="icon">📤</span><span>Выводы</span>
        </NavLink>
        <NavLink to="/admin/users" onClick={() => hapticSelection()}>
          <span className="icon">👥</span><span>Юзеры</span>
        </NavLink>
        <NavLink to="/admin/audit" onClick={() => hapticSelection()}>
          <span className="icon">📜</span><span>Аудит</span>
        </NavLink>
      </nav>
    </div>
  );
}
