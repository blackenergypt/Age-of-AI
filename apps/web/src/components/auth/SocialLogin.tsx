'use client';

import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDiscord,
  faFacebookF,
  faGoogle,
  faXTwitter
} from '@fortawesome/free-brands-svg-icons';
import { socialAuthUrl } from '@/lib/auth-api';

const providers = [
  { id: 'google' as const, label: 'Google', icon: faGoogle },
  { id: 'facebook' as const, label: 'Facebook', icon: faFacebookF },
  { id: 'twitter' as const, label: 'X', icon: faXTwitter },
  { id: 'discord' as const, label: 'Discord', icon: faDiscord }
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
          <a key={p.id} href={hrefs[p.id]} className="auth-social-btn" aria-label={p.label}>
            <FontAwesomeIcon icon={p.icon} aria-hidden />
            <span>{p.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
