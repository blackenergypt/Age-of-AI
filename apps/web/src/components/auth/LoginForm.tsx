'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { AuthMessage } from '@/components/auth/AuthMessage';
import { PasswordField } from '@/components/auth/PasswordField';
import { SocialLogin } from '@/components/auth/SocialLogin';
import { loginRequest } from '@/lib/auth-api';
import { APP_MENU_PATH, saveSession } from '@/lib/auth-session';
import { ROUTES } from '@/lib/app-paths';

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'error' | 'success' | 'info'>('info');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      setTone('success');
      setMessage('Senha redefinida com sucesso. Já podes entrar.');
    } else if (searchParams.get('confirmed') === 'true') {
      setTone('success');
      setMessage('Conta confirmada. Faz login para continuar.');
    }
  }, [searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTone('info');
    setMessage('A autenticar…');

    const result = await loginRequest(email, password);
    if (!result.ok) {
      setTone('error');
      setMessage(result.message);
      setLoading(false);
      return;
    }

    if (result.data.token) {
      saveSession(result.data.token, result.data.user, rememberMe);
    }

    setTone('success');
    setMessage(result.data.message || 'Login bem-sucedido!');
    setTimeout(() => {
      window.location.href = APP_MENU_PATH;
    }, 800);
  }

  return (
    <>
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
            placeholder="o teu email"
          />
        </div>

        <PasswordField
          id="password"
          name="password"
          label="Senha"
          autoComplete="current-password"
          required
          value={password}
          onChange={setPassword}
        />

        <div className="auth-meta">
          <div className="auth-check">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe">Lembrar-me</label>
          </div>
          <Link href={ROUTES.forgotPassword} className="auth-meta-link">
            Esqueceste a senha?
          </Link>
        </div>

        <div className="auth-field">
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'A entrar…' : 'Entrar'}
          </button>
        </div>

        <p className="auth-footer-line">
          Ainda sem conta? <Link href={ROUTES.register}>Criar conta</Link>
        </p>
      </form>
      <SocialLogin mode="login" />
    </>
  );
}
