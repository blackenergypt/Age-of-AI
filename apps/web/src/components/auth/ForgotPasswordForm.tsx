'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AuthMessage } from '@/components/auth/AuthMessage';
import { forgotPasswordRequest } from '@/lib/auth-api';
import { ROUTES } from '@/lib/app-paths';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'error' | 'success' | 'info'>('info');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTone('info');
    setMessage('A enviar…');

    const result = await forgotPasswordRequest(email);
    if (!result.ok) {
      setTone('error');
      setMessage(result.message);
      setLoading(false);
      return;
    }

    setTone('success');
    setMessage(result.data.message || 'Link enviado. Verifica o teu email.');
    setEmail('');
    setLoading(false);
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <AuthMessage text={message} tone={tone} />

      <div className="auth-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email da conta"
        />
      </div>

      <div className="auth-field">
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'A enviar…' : 'Enviar link'}
        </button>
      </div>

      <div className="auth-links">
        <p>
          <Link href={ROUTES.login}>Voltar ao login</Link>
        </p>
      </div>
    </form>
  );
}
