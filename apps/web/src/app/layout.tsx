import type { Metadata } from 'next';
import { Cinzel, Manrope } from 'next/font/google';
import { config as fontAwesomeConfig } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { SoundToggle } from '@/components/SoundToggle';
import './globals.css';

fontAwesomeConfig.autoAddCss = false;

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-cinzel',
  display: 'swap'
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Age of AI',
  description: 'Estratégia em tempo real. Reinos, alianças e guerras num mundo vivo.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${manrope.variable}`}>
      <body
        style={
          {
            '--font-display': 'var(--font-cinzel), Georgia, serif',
            '--font-body': 'var(--font-manrope), "Segoe UI", sans-serif'
          } as React.CSSProperties
        }
      >
        <SoundToggle />
        {children}
      </body>
    </html>
  );
}
