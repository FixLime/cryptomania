import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initTelegram } from './lib/telegram';
import { App } from './App';
import { Wallets } from './pages/Wallets';
import { WalletDetail } from './pages/WalletDetail';
import { Send } from './pages/Send';
import { Receive } from './pages/Receive';
import { Swap } from './pages/Swap';
import { History } from './pages/History';
import { TxDetail } from './pages/TxDetail';
import { KYC } from './pages/KYC';
import { Settings } from './pages/Settings';
import { Security } from './pages/Security';
import { AddressBook } from './pages/AddressBook';
import { Referral } from './pages/Referral';
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
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/wallets" replace />} />
          <Route path="wallets" element={<Wallets />} />
          <Route path="wallets/:currency" element={<WalletDetail />} />
          <Route path="send" element={<Send />} />
          <Route path="send/:currency" element={<Send />} />
          <Route path="receive/:currency" element={<Receive />} />
          <Route path="swap" element={<Swap />} />
          <Route path="history" element={<History />} />
          <Route path="tx/:id" element={<TxDetail />} />
          <Route path="kyc" element={<KYC />} />
          <Route path="settings" element={<Settings />} />
          <Route path="security" element={<Security />} />
          <Route path="address-book" element={<AddressBook />} />
          <Route path="referral" element={<Referral />} />
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
  </React.StrictMode>,
);
