import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Redefinir senha — Age of AI',
  description: 'Define uma nova senha para a tua conta Age of AI.'
};

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Age of AI" tagline="Nova senha">
      <Suspense fallback={<p className="auth-copy">A carregar…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
