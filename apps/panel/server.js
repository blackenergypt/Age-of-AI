/**
 * Panel legado desativado — UI está no Next.js (apps/web).
 * Mantém-se só redirects para o gateway.
 */
const express = require('express');

const app = express();
const port = Number(process.env.PANEL_PORT || 8081);
const gatewayOrigin = (process.env.PUBLIC_GATEWAY_ORIGIN || process.env.FRONTEND_URL || 'http://localhost').replace(/\/$/, '');

function toGateway(path, req) {
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  return `${gatewayOrigin}${path}${qs}`;
}

const redirects = {
  '/': '/',
  '/menu': '/menu',
  '/game': '/jogo',
  '/jogo': '/jogo',
  '/store': '/loja',
  '/loja': '/loja',
  '/login': '/entrar',
  '/entrar': '/entrar',
  '/register': '/registar',
  '/registar': '/registar',
  '/forgot-password': '/recuperar-senha',
  '/reset-password': '/redefinir-senha',
  '/auth/success': '/auth/success',
  '/auth/failure': '/auth/failure',
  '/auth-success': '/auth/success',
  '/failure': '/auth/failure',
  '/terms': '/terms',
  '/app/menu': '/menu',
  '/app/game': '/jogo',
  '/app/store': '/loja'
};

Object.entries(redirects).forEach(([from, to]) => {
  app.get(from, (req, res) => res.redirect(302, toGateway(to, req)));
});

app.use((req, res) => {
  res.redirect(302, toGateway('/menu', req));
});

app.listen(port, () => {
  console.log(`Panel (redirect-only) em http://localhost:${port} → ${gatewayOrigin}`);
});
