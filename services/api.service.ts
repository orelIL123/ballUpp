import { getCurrentAuthToken } from '@/services/auth.service';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const token = await getCurrentAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'הבקשה נכשלה.');
  }

  return (await response.json()) as T;
}
