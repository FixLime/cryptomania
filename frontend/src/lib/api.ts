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
    let msg = text;
    try { msg = JSON.parse(text).error ?? text; } catch {}
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return res.json();
}

const j = (data: unknown) => ({ method: 'POST', body: JSON.stringify(data) });

export const api = {
  me: () => request<{ user: any }>('/me'),
  wallets: () => request<{ wallets: any[] }>('/me/wallets'),
  transactions: (params?: { currency?: string; type?: string }) => {
    const q = new URLSearchParams();
    if (params?.currency) q.set('currency', params.currency);
    if (params?.type) q.set('type', params.type);
    const qs = q.toString();
    return request<{ transactions: any[] }>(`/me/transactions${qs ? '?' + qs : ''}`);
  },

  // Send / receive
  withdraw: (data: { currency: string; toAddress: string; amount: string }) =>
    request<{ ok: boolean; status: string; requiresApproval: boolean; transactionId: string }>(
      '/withdraw', j(data),
    ),
  transfer: (data: { to: string; currency: string; amount: string; note?: string }) =>
    request<{ ok: boolean; transactionId: string }>('/transfer', j(data)),
  lookupUser: (q: string) =>
    request<{ users: any[] }>(`/users/lookup?q=${encodeURIComponent(q)}`),

  // Swap
  swapQuote: (from: string, to: string, amount: string) =>
    request<{ rate: number; fromAmount: string; toAmount: string; feePercent: number; feeAmount: string }>(
      `/swap/quote?from=${from}&to=${to}&amount=${amount}`,
    ),
  swap: (data: { from: string; to: string; amount: string }) =>
    request<{ ok: boolean; toAmount: string; fee: number }>('/swap', j(data)),

  // KYC
  kycStatus: () => request<{ status: string; latest: any }>('/kyc/status'),
  kycSubmit: (form: FormData) =>
    request<{ ok: boolean }>('/kyc/submit', { method: 'POST', body: form }),

  // Address book
  addressBookList: () => request<{ items: any[] }>('/address-book'),
  addressBookCreate: (data: { label: string; currency: string; address: string }) =>
    request<{ ok: boolean; item: any }>('/address-book', j(data)),
  addressBookDelete: (id: string) =>
    request<{ ok: boolean }>(`/address-book/${id}`, { method: 'DELETE' }),

  // Settings
  updateSettings: (data: any) => request<{ ok: boolean }>('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  setPin: (data: { pin: string; currentPin?: string }) => request<{ ok: boolean }>('/settings/pin', j(data)),
  removePin: (pin: string) =>
    request<{ ok: boolean }>('/settings/pin', { method: 'DELETE', body: JSON.stringify({ pin }) }),
  verifyPin: (pin: string) => request<{ ok: boolean }>('/settings/pin/verify', j({ pin })),

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
    request<any>(`/admin/kyc/${id}/reject`, j({ reason })),
  adminWithdrawals: () => request<any>('/admin/withdrawals/pending'),
  adminWithdrawApprove: (id: string) =>
    request<any>(`/admin/withdrawals/${id}/approve`, { method: 'POST' }),
  adminWithdrawReject: (id: string, reason: string) =>
    request<any>(`/admin/withdrawals/${id}/reject`, j({ reason })),
  adminAudit: () => request<any>('/admin/audit'),
};
