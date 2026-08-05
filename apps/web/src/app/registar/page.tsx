import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Criar conta — Age of AI',
  description: 'Cria a tua conta Age of AI.'
};

export default function RegisterPage() {
  return (
    <AuthShell title="Age of AI" tagline="Cria a tua conta" wide>
      <RegisterForm />
    </AuthShell>
  );
}
