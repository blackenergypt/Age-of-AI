export type AuthUser = {
  id?: string;
  email?: string;
  nickname?: string;
  name?: string;
  [key: string]: unknown;
};

export function saveSession(token: string, user: AuthUser, rememberMe: boolean) {
  const payload = JSON.stringify(user);
  if (rememberMe) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', payload);
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
  } else {
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('user', payload);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
}

export function clearSession() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('user');
}

export function readSession(): { token: string; user: AuthUser } | null {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!token || !raw) return null;
  try {
    return { token, user: JSON.parse(raw) as AuthUser };
  } catch {
    return null;
  }
}

export { APP_MENU_PATH, APP_GAME_PATH, APP_STORE_PATH } from '@/lib/app-paths';
