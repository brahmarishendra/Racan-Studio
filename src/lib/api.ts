const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

async function req(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

export const api = {
  auth: {
    me: () => req('/auth/me'),
    login: (data: { email: string; password: string }) => req('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: { email: string; password: string; name: string; avatarUrl?: string }) => req('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => req('/auth/logout', { method: 'POST' }),
    updateProfile: (data: { name?: string; avatarUrl?: string }) => req('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  },
  templates: {
    list: () => req('/templates'),
    publicList: () => req('/templates/public'),
    create: (data: { name: string; elements: any; canvasSize: any; canvasBg: string; thumbnail: string }) => req('/templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => req(`/templates/${id}`, { method: 'DELETE' }),
  },
  projects: {
    get: (name: string) => req(`/projects?name=${encodeURIComponent(name)}`),
    upsert: (data: { name: string; data: any }) => req('/projects', { method: 'POST', body: JSON.stringify(data) }),
  }
};
