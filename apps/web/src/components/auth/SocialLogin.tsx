'use client';

import { useMemo } from 'react';
import { socialAuthUrl } from '@/lib/auth-api';

const providers = [
  {
    id: 'google' as const,
    label: 'Google',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 01-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" />
        <path d="M12 22c2.7 0 5-0.9 6.7-2.4l-3.2-2.5c-.9.6-2 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.9v2.6A10 10 0 0012 22z" />
        <path d="M6.2 13.8A6 6 0 015.9 12c0-.6.1-1.2.3-1.8V7.6H2.9A10 10 0 002 12c0 1.6.4 3.1 1 4.4l3.2-2.6z" />
        <path d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9C17 2.9 14.7 2 12 2A10 10 0 002.9 7.6l3.3 2.6C7 7.7 9.3 5.9 12 5.9z" />
      </svg>
    )
  },
  {
    id: 'facebook' as const,
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.5l.5-3H13v-2c0-.6.4-1 1-1z" />
      </svg>
    )
  },
  {
    id: 'twitter' as const,
    label: 'X',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.2 3H21l-6.6 7.5L22 21h-6.2l-4.3-5.6L6 21H3.2l7-8L2 3h6.3l3.9 5.2L18.2 3zm-1.1 16.2h1.7L7 4.7H5.2l11.9 14.5z" />
      </svg>
    )
  },
  {
    id: 'discord' as const,
    label: 'Discord',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.3 5.2A16.5 16.5 0 0015.3 4l-.3.6a14.6 14.6 0 015.6 0l-.3-.4zM4.7 5.2l-.3.4a14.6 14.6 0 015.6 0L9.7 4A16.5 16.5 0 004.7 5.2zM18.8 15.7c-1.1 1.6-2.5 2.8-4.2 3.6l-.9-1.4c1.1-.4 2.1-1 3-1.8l-.9-1.1c-.8.6-1.7 1.1-2.7 1.4V13h-1.8v2.4c-1-.3-1.9-.8-2.7-1.4l-.9 1.1c.9.8 1.9 1.4 3 1.8l-.9 1.4c-1.7-.8-3.1-2-4.2-3.6C4.3 12.6 4 9.4 4.3 6.5c1.6-.7 3.2-1.2 4.9-1.5l1.1 1.6c-.7.1-1.4.3-2 .6 2.2-.5 4.5-.5 6.7 0-.6-.3-1.3-.5-2-.6l1.1-1.6c1.7.3 3.3.8 4.9 1.5.3 2.9 0 6.1-1.2 9.2z" />
      </svg>
    )
  }
];

type SocialLoginProps = {
  mode?: 'login' | 'register';
};

export function SocialLogin({ mode = 'login' }: SocialLoginProps) {
  const hrefs = useMemo(
    () =>
      Object.fromEntries(providers.map((p) => [p.id, socialAuthUrl(p.id)])) as Record<
        (typeof providers)[number]['id'],
        string
      >,
    []
  );

  return (
    <div className="auth-social">
      <p>{mode === 'register' ? 'Ou regista-te com' : 'Ou continua com'}</p>
      <div className="auth-social-grid">
        {providers.map((p) => (
          <a key={p.id} href={hrefs[p.id]} className="auth-social-btn" aria-label={`${p.label}`}>
            {p.icon}
            <span>{p.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
