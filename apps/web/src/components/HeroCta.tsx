'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ROUTES } from '@/lib/app-paths';

type AuthUser = {
  nickname?: string;
  name?: string;
  email?: string;
};

export function HeroCta() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!token || !userStr) return;
    try {
      setUser(JSON.parse(userStr));
    } catch {
      setUser(null);
    }
  }, []);

  const label = user?.nickname || user?.name || 'Minha Conta';

  return (
    <div className="hero-cta animate-in delay-3">
      {user ? (
        <Link href={ROUTES.menu} className="btn btn-primary">
          {label}
        </Link>
      ) : (
        <Link href={ROUTES.login} className="btn btn-primary">
          Entrar
        </Link>
      )}
      {!user && (
        <Link href={ROUTES.register} className="btn btn-ghost">
          Registar
        </Link>
      )}
    </div>
  );
}
