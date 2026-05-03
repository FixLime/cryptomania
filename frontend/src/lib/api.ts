import { getInitData } from './telegram';

const BASE = (import.meta.env.VITE_API_URL as string) || '';

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'X-Telegram-Init-Data': getInitData(),
    ...(opts.body && !(opts.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...((opts.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(`${BASE}/api${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  me: () => request<{ user: any }>('/me'),
  wallets: () => request<{ wallets: any[] }>('/me/wallets'),
  transactions: () => request<{ transactions: any[] }>('/me/transactions'),
  withdraw: (data: { currency: string; toAddress: string; amount: string }) =>
    request<{ ok: boolean; status: string; requiresApproval: boolean }>('/withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  kycStatus: () => request<{ status: string; latest: any }>('/kyc/status'),
  kycSubmit: (form: FormData) =>
    request<{ ok: boolean }>('/kyc/submit', { method: 'POST', body: form }),

  // Admin
  adminStats: () => request<any>('/admin/stats'),
  adminUsers: (q?: string) => request<any>(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  adminUser: (id: string) => request<any>(`/admin/users/${id}`),
  adminFreeze: (id: string) => request<any>(`/admin/users/${id}/freeze`, { method: 'POST' }),
  adminUnfreeze: (id: string) => request<any>(`/admin/users/${id}/unfreeze`, { method: 'POST' }),
  adminBan: (id: string) => request<any>(`/admin/users/${id}/ban`, { method: 'POST' }),
  adminKycPending: () => request<any>('/admin/kyc/pending'),
  adminKycApprove: (id: string) => request<any>(`/admin/kyc/${id}/approve`, { method: 'POST' }),
  adminKycReject: (id: string, reason: string) =>
    request<any>(`/admin/kyc/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  adminWithdrawals: () => request<any>('/admin/withdrawals/pending'),
  adminWithdrawApprove: (id: string) =>
    request<any>(`/admin/withdrawals/${id}/approve`, { method: 'POST' }),
  adminWithdrawReject: (id: string, reason: string) =>
    request<any>(`/admin/withdrawals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  adminAudit: () => request<any>('/admin/audit'),
};
