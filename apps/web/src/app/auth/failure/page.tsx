import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { ROUTES } from '@/lib/app-paths';

export const metadata: Metadata = {
  title: 'Falha na autenticação — Age of AI',
  description: 'Não foi possível concluir a autenticação.'
};

export default function AuthFailurePage() {
  return (
    <AuthShell title="Age of AI" tagline="Não foi possível autenticar">
      <p className="auth-copy">
        Algo correu mal no login social. Tenta de novo ou usa email e senha.
      </p>
      <div className="auth-field" style={{ marginTop: '1.5rem' }}>
        <Link href={ROUTES.login} className="auth-submit">
          Voltar ao login
        </Link>
      </div>
    </AuthShell>
  );
}
