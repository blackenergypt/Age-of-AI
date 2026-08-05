'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AuthMessage } from '@/components/auth/AuthMessage';
import { PasswordField } from '@/components/auth/PasswordField';
import { resetPasswordRequest } from '@/lib/auth-api';
import { ROUTES } from '@/lib/app-paths';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'error' | 'success' | 'info'>('info');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setTone('error');
      setMessage('As senhas não coincidem');
      return;
    }
    if (!token) {
      setTone('error');
      setMessage('Token inválido ou em falta.');
      return;
    }

    setLoading(true);
    setTone('info');
    setMessage('A guardar…');

    const result = await resetPasswordRequest(token, password);
    if (!result.ok) {
      setTone('error');
      setMessage(result.message);
      setLoading(false);
      return;
    }

    setTone('success');
    setMessage(result.data.message || 'Senha redefinida.');
    setTimeout(() => {
      window.location.href = `${ROUTES.login}?reset=true`;
    }, 2000);
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <AuthMessage text={message} tone={tone} />

      <PasswordField
        id="password"
        name="password"
        label="Nova senha"
        autoComplete="new-password"
        required
        value={password}
        onChange={setPassword}
      />
      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmar senha"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={setConfirmPassword}
      />

      <div className="auth-field">
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'A guardar…' : 'Guardar senha'}
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
