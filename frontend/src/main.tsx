import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { initTelegram } from './lib/telegram';
import { App } from './App';
import { Wallets } from './pages/Wallets';
import { WalletDetail } from './pages/WalletDetail';
import { Withdraw } from './pages/Withdraw';
import { History } from './pages/History';
import { KYC } from './pages/KYC';
import { Settings } from './pages/Settings';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminUsers } from './pages/admin/Users';
import { AdminUserDetail } from './pages/admin/UserDetail';
import { AdminKyc } from './pages/admin/Kyc';
import { AdminWithdrawals } from './pages/admin/Withdrawals';
import { AdminAudit } from './pages/admin/Audit';
import './index.css';

initTelegram();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json">
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Navigate to="/wallets" replace />} />
            <Route path="wallets" element={<Wallets />} />
            <Route path="wallets/:currency" element={<WalletDetail />} />
            <Route path="withdraw" element={<Withdraw />} />
            <Route path="history" element={<History />} />
            <Route path="kyc" element={<KYC />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:id" element={<AdminUserDetail />} />
            <Route path="kyc" element={<AdminKyc />} />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="audit" element={<AdminAudit />} />
          </Route>
        </Routes>
      </HashRouter>
    </TonConnectUIProvider>
  </React.StrictMode>,
);
