import Link from 'next/link';
import type { ReactNode } from 'react';
import { SoundToggle } from '@/components/SoundToggle';
import '@/components/auth/auth.css';

type AuthShellProps = {
  title: string;
  tagline: string;
  wide?: boolean;
  children: ReactNode;
};

export function AuthShell({ title, tagline, wide, children }: AuthShellProps) {
  return (
    <div className="auth-page">
      <div className="auth-bg" aria-hidden="true" />
      <div className="auth-screen">
        <div className={`auth-shell${wide ? ' auth-shell-wide' : ''}`}>
          <div className="auth-brand-bar">
            <Link href="/">Age of AI</Link>
            <SoundToggle variant="nav" />
          </div>
          <div className="auth-container">
            <header className="auth-header">
              <h1 className="auth-title">{title}</h1>
              <p className="auth-tagline">{tagline}</p>
            </header>
            {children}
            <div className="auth-back">
              <Link href="/" className="auth-secondary">
                Voltar à página inicial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
