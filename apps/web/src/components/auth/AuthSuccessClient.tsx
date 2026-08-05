'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthMessage } from '@/components/auth/AuthMessage';
import { getApiBase } from '@/lib/api';
import { APP_MENU_PATH, saveSession, type AuthUser } from '@/lib/auth-session';
import { ROUTES } from '@/lib/app-paths';

export function AuthSuccessClient() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('A concluir autenticação…');
  const [tone, setTone] = useState<'error' | 'success' | 'info'>('info');

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const code = searchParams.get('code');
      const legacyToken = searchParams.get('token');
      const legacyUser = searchParams.get('user');

      try {
        let token = '';
        let user: AuthUser | null = null;

        if (code) {
          const res = await fetch(`${getApiBase()}/api/auth/handoff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.token) {
            throw new Error(data.message || 'Código inválido ou expirado');
          }
          token = data.token;
          user = data.user as AuthUser;
        } else if (legacyToken && legacyUser) {
          // Compat temporária com redirects antigos
          token = legacyToken;
          user = JSON.parse(legacyUser) as AuthUser;
        } else {
          throw new Error('Dados de autenticação inválidos.');
        }

        if (cancelled) return;
        saveSession(token, user || {}, true);
        window.history.replaceState({}, '', '/auth/success');
        setTone('success');
        setMessage('Autenticação concluída. A redirecionar…');
        setTimeout(() => {
          window.location.href = APP_MENU_PATH;
        }, 900);
      } catch (err) {
        if (cancelled) return;
        setTone('error');
        setMessage(err instanceof Error ? err.message : 'Erro ao guardar a sessão.');
        setTimeout(() => {
          window.location.href = ROUTES.login;
        }, 2500);
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="auth-center">
      <AuthMessage text={message} tone={tone} />
      {tone === 'info' || tone === 'success' ? <div className="auth-loader" aria-hidden="true" /> : null}
    </div>
  );
}
