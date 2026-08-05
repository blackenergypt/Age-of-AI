import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Entrar — Age of AI',
  description: 'Entra no teu reino Age of AI.'
};

export default function LoginPage() {
  return (
    <AuthShell title="Entra no teu reino">
      <Suspense fallback={<p className="auth-copy">A carregar…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
