import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Recuperar senha — Age of AI',
  description: 'Recupera o acesso à tua conta Age of AI.'
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Recuperar senha">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
