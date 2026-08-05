'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AuthMessage } from '@/components/auth/AuthMessage';
import { PasswordField } from '@/components/auth/PasswordField';
import { SocialLogin } from '@/components/auth/SocialLogin';
import { registerRequest } from '@/lib/auth-api';
import { ROUTES } from '@/lib/app-paths';

export function RegisterForm() {
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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
    if (!acceptedTerms) {
      setTone('error');
      setMessage('Tens de aceitar os termos e políticas');
      return;
    }

    setLoading(true);
    setTone('info');
    setMessage('A registar…');

    const result = await registerRequest({
      nickname,
      name,
      email,
      phone,
      password,
      confirmPassword,
      acceptedTerms
    });

    if (!result.ok) {
      setTone('error');
      setMessage(result.message);
      setLoading(false);
      return;
    }

    setTone('success');
    setMessage(result.data.message || 'Conta criada.');
    setNickname('');
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setAcceptedTerms(false);
    setLoading(false);

    if ((result.data.message || '').includes('não é necessária')) {
      setTimeout(() => {
        window.location.href = ROUTES.login;
      }, 2000);
    }
  }

  return (
    <>
      <form className="auth-form" onSubmit={onSubmit}>
        <AuthMessage text={message} tone={tone} />

        <div className="auth-row">
          <div className="auth-field">
            <label htmlFor="nickname">Nickname</label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              autoComplete="username"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="no jogo"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="name">Nome</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="nome completo"
            />
          </div>
        </div>

        <div className="auth-row">
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
          <div className="auth-field">
            <label htmlFor="phone">
              Telefone <span className="optional">(opcional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+351…"
            />
          </div>
        </div>

        <div className="auth-row">
          <PasswordField
            id="password"
            name="password"
            label="Senha"
            autoComplete="new-password"
            required
            value={password}
            onChange={setPassword}
          />
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirmar"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
        </div>

        <div className="auth-field auth-check">
          <input
            id="acceptedTerms"
            name="acceptedTerms"
            type="checkbox"
            required
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          <label htmlFor="acceptedTerms">
            Aceito os{' '}
            <Link href={ROUTES.terms} target="_blank" rel="noopener noreferrer">
              Termos de Uso e Privacidade
            </Link>
          </label>
        </div>

        <div className="auth-field">
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'A criar…' : 'Criar conta'}
          </button>
        </div>

        <div className="auth-links">
          <p>
            Já tens conta? <Link href={ROUTES.login}>Entrar</Link>
          </p>
        </div>
      </form>
      <SocialLogin mode="register" />
    </>
  );
}
