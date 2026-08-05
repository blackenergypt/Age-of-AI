import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      // App antigo sob /app/*
      { source: '/app', destination: '/menu', permanent: true },
      { source: '/app/menu', destination: '/menu', permanent: true },
      { source: '/app/game', destination: '/jogo', permanent: true },
      { source: '/app/store', destination: '/loja', permanent: true },
      // Auth EN → PT
      { source: '/login', destination: '/entrar', permanent: true },
      { source: '/register', destination: '/registar', permanent: true },
      { source: '/forgot-password', destination: '/recuperar-senha', permanent: true },
      { source: '/reset-password', destination: '/redefinir-senha', permanent: true },
      // Aliases extras
      { source: '/auth/sucesso', destination: '/auth/success', permanent: true },
      { source: '/auth/falha', destination: '/auth/failure', permanent: true },
      { source: '/auth-success', destination: '/auth/success', permanent: true },
      { source: '/game', destination: '/jogo', permanent: true },
      { source: '/store', destination: '/loja', permanent: true },
      { source: '/play', destination: '/jogo', permanent: true },
      { source: '/lobby', destination: '/menu', permanent: true }
    ];
  }
};

export default nextConfig;
