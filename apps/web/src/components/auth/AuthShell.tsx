import Link from 'next/link';
import type { ReactNode } from 'react';
import '@/components/auth/auth.css';

type AuthShellProps = {
  title: string;
  wide?: boolean;
  children: ReactNode;
};

export function AuthShell({ title, wide, children }: AuthShellProps) {
  return (
    <div className={`auth-page${wide ? ' auth-page-wide' : ''}`}>
      <section className="auth-panel" aria-label="Autenticação">
        <div className="auth-panel-inner">
          <div className="auth-brand-bar">
            <Link href="/" className="auth-brand">
              Age of AI
            </Link>
            <Link href="/" className="auth-back-link">
              ← Página inicial
            </Link>
          </div>

          <div className="auth-container">
            <header className="auth-header">
              <h1 className="auth-title">{title}</h1>
            </header>
            {children}
          </div>
        </div>
      </section>

      <aside className="auth-visual" aria-hidden="true">
        <div className="auth-visual-media" />
        <div className="auth-visual-veil" />
        <p className="auth-visual-mark">Age of AI</p>
      </aside>
    </div>
  );
}
