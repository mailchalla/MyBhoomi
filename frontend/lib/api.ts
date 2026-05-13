const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  body?: any;
}

export async function apiFetch<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, ...rest } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<{ user: any }>('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    apiFetch<{ user: any }>('/api/auth/register', { method: 'POST', body: data }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  me: () => apiFetch<{ user: any }>('/api/auth/me'),

  plots: {
    list: (status?: string) => apiFetch<{ plots: any[] }>(`/api/plots${status ? `?status=${status}` : ''}`),
    get: (id: string) => apiFetch<{ plot: any; currentPrice: any; priceHistory: any[] }>(`/api/plots/${id}`),
    create: (data: any) => apiFetch<{ plot: any }>('/api/plots', { method: 'POST', body: data }),
    update: (id: string, data: any) => apiFetch<{ plot: any }>(`/api/plots/${id}`, { method: 'PUT', body: data }),
    addPrice: (plotId: string, data: any) => apiFetch<{ price: any }>(`/api/plots/${plotId}/prices`, { method: 'POST', body: data }),
    updateCurrentPrice: (plotId: string, ratePerSqFt: number) =>
      apiFetch<{ price: any }>(`/api/plots/${plotId}/prices/current`, { method: 'PUT', body: { ratePerSqFt } }),
  },

  customers: {
    list: () => apiFetch<{ customers: any[] }>('/api/customers'),
    get: (id: string) => apiFetch<{ customer: any; user: any; purchases: any[] }>(`/api/customers/${id}`),
    create: (data: any) => apiFetch<{ customer: any; user: any }>('/api/customers', { method: 'POST', body: data }),
    update: (id: string, data: any) => apiFetch<{ customer: any }>(`/api/customers/${id}`, { method: 'PUT', body: data }),
  },

  purchases: {
    list: () => apiFetch<{ purchases: any[] }>('/api/purchases'),
    get: (id: string) => apiFetch<{ purchase: any; plot: any; instalments: any[] }>(`/api/purchases/${id}`),
    create: (data: any) =>
      apiFetch<{ purchase: any; instalments: any[]; totalPrice: number }>('/api/purchases', { method: 'POST', body: data }),
    markPaid: (purchaseId: string, instalmentId: string) =>
      apiFetch<{ instalment: any }>(`/api/purchases/${purchaseId}/instalments/${instalmentId}/pay`, { method: 'PUT' }),
  },

  alerts: {
    list: () => apiFetch<{ alerts: any[] }>('/api/alerts'),
    unread: () => apiFetch<{ alerts: any[] }>('/api/alerts/unread'),
  },

  reports: {
    upcoming: (days = 7) => apiFetch<{ instalments: any[]; count: number }>(`/api/reports/upcoming?days=${days}`),
    overdue: () => apiFetch<{ instalments: any[]; count: number }>('/api/reports/due'),
  },
};