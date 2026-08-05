'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { readSession } from '@/lib/auth-session';
import { ROUTES } from '@/lib/app-paths';

type RequireAuthProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (!session) {
      window.location.href = ROUTES.login;
      return;
    }
    setOk(true);
    setReady(true);
  }, []);

  if (!ready) {
    return (
      fallback || (
        <div className="app-loading">
          <p>A verificar sessão…</p>
        </div>
      )
    );
  }

  if (!ok) return null;
  return <>{children}</>;
}
