'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SoundToggle } from '@/components/SoundToggle';
import { ROUTES } from '@/lib/app-paths';

type SiteNavProps = {
  /** Menu sobre o hero (página principal) */
  overlay?: boolean;
};

export function SiteNav({ overlay = false }: SiteNavProps) {
  const [open, setOpen] = useState(false);
  const [accountHref, setAccountHref] = useState<string>(ROUTES.login);
  const [accountLabel, setAccountLabel] = useState('Entrar');

  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!token || !userStr) return;
    try {
      const user = JSON.parse(userStr);
      setAccountHref(ROUTES.menu);
      setAccountLabel(user.nickname || user.name || 'Conta');
    } catch {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    document.body.classList.toggle('has-site-nav', true);
    return () => {
      document.body.classList.remove('nav-open');
      document.body.classList.remove('has-site-nav');
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <header className={`site-header${overlay ? ' site-header-overlay' : ''}`}>
      <nav className="site-nav" aria-label="Menu principal">
        <Link href={ROUTES.home} className="site-nav-brand" onClick={close}>
          Age of AI
        </Link>

        <button
          type="button"
          className={`site-nav-toggle${open ? ' is-open' : ''}`}
          aria-expanded={open}
          aria-controls="site-nav-panel"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <div id="site-nav-panel" className={`site-nav-panel${open ? ' is-open' : ''}`}>
          <div className="site-nav-links">
            <a href="/#mundo" onClick={close}>
              Mundo
            </a>
            <Link href={ROUTES.ranks} onClick={close}>
              Ranking
            </Link>
            <a href="/#cronicas" onClick={close}>
              Crónicas
            </a>
            <Link href={ROUTES.blog} onClick={close}>
              Blog
            </Link>
          </div>

          <div className="site-nav-actions">
            <SoundToggle variant="nav" />
            <Link href={accountHref} className="site-nav-cta" onClick={close}>
              {accountLabel}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
