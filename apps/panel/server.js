const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
const port = Number(process.env.PANEL_PORT || 8081);
const publicDir = path.join(__dirname, 'public');
const defaultBasePath = process.env.PANEL_BASE_PATH || '';
const defaultApiUrl = process.env.AGE_API_URL;

const AUTH_ROUTES = {
  '/login': 'login.html',
  '/register': 'register.html',
  '/forgot-password': 'forgot-password.html',
  '/reset-password': 'reset-password.html',
  '/auth/success': 'auth-success.html',
  '/auth/failure': 'failure.html',
  '/auth-success': 'auth-success.html',
  '/failure': 'failure.html'
};

app.get('/runtime-config.js', (req, res) => {
  const base = (process.env.PANEL_BASE_PATH
    || req.headers['x-forwarded-prefix']
    || defaultBasePath
    || '').replace(/\/$/, '');

  const apiUrl = defaultApiUrl !== undefined
    ? defaultApiUrl
    : (base || req.headers['x-asset-base'] ? '' : 'http://localhost:3001');

  res.type('application/javascript').send(
    `window.AGE_BASE_PATH=${JSON.stringify(base)};\n` +
    `window.AGE_API_URL=${JSON.stringify(apiUrl)};\n` +
    `window.AGE_ASSET_BASE=${JSON.stringify((req.headers['x-asset-base'] || '').replace(/\/$/, '') || base)};\n`
  );
});

function sendHtml(res, fileName, req) {
  const filePath = path.join(publicDir, fileName);
  let html = fs.readFileSync(filePath, 'utf8');
  const assetBase = (req.headers['x-asset-base'] || '').trim();

  if (assetBase && !html.includes('<base ')) {
    html = html.replace(
      /<head([^>]*)>/i,
      `<head$1>\n    <base href="${assetBase.endsWith('/') ? assetBase : `${assetBase}/`}">`
    );
  }

  res.type('html').send(html);
}

Object.entries(AUTH_ROUTES).forEach(([route, file]) => {
  app.get(route, (req, res) => sendHtml(res, file, req));
});

app.use(express.static(publicDir));

app.get('/menu', (_req, res) => res.sendFile(path.join(publicDir, 'menu.html')));
app.get('/game', (_req, res) => res.sendFile(path.join(publicDir, 'game.html')));
app.get('/store', (_req, res) => res.sendFile(path.join(publicDir, 'store.html')));

app.use((req, res, next) => {
  if (req.path.match(/\.(css|js|jpg|jpeg|png|gif|svg|ico|wav|map)$/)) return next();
  if (!req.path.includes('.')) {
    const filePath = path.join(publicDir, `${req.path}.html`);
    if (fs.existsSync(filePath)) return res.sendFile(filePath);
  }
  next();
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(publicDir, '404.html'));
});

app.listen(port, () => {
  console.log(`Panel em http://localhost:${port}`);
});
