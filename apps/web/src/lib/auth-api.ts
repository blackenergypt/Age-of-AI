import { getApiBase } from '@/lib/api';
import type { AuthUser } from '@/lib/auth-session';

type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string };

async function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = (await res.json().catch(() => ({}))) as T & { message?: string };
    if (!res.ok) {
      return { ok: false, message: data.message || 'Pedido falhou' };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, message: 'Erro ao ligar ao servidor.' };
  }
}

export type LoginResponse = {
  token: string;
  user: AuthUser;
  message?: string;
};

export type MessageResponse = {
  message: string;
};

export function loginRequest(email: string, password: string) {
  return postJson<LoginResponse>('/api/auth/login', { email, password });
}

export function registerRequest(payload: {
  nickname: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}) {
  return postJson<MessageResponse>('/api/auth/register', payload);
}

export function forgotPasswordRequest(email: string) {
  return postJson<MessageResponse>('/api/auth/forgot-password', { email });
}

export function resetPasswordRequest(token: string, password: string) {
  return postJson<MessageResponse>('/api/auth/reset-password', { token, password });
}

export function socialAuthUrl(provider: 'google' | 'facebook' | 'twitter' | 'discord') {
  return `${getApiBase()}/api/auth/${provider}`;
}
