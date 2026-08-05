import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthSuccessClient } from '@/components/auth/AuthSuccessClient';

export const metadata: Metadata = {
  title: 'Autenticação — Age of AI',
  description: 'A concluir autenticação social.'
};

export default function AuthSuccessPage() {
  return (
    <AuthShell title="A concluir autenticação…">
      <Suspense fallback={<div className="auth-loader" aria-hidden="true" />}>
        <AuthSuccessClient />
      </Suspense>
    </AuthShell>
  );
}
