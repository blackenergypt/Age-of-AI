'use client';

import { useEffect, useState } from 'react';

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
        <a href="/app/menu" className="btn btn-primary">
          {label}
        </a>
      ) : (
        <a href="/login" className="btn btn-primary">
          Entrar
        </a>
      )}
      {!user && (
        <a href="/register" className="btn btn-ghost">
          Registrar
        </a>
      )}
    </div>
  );
}
