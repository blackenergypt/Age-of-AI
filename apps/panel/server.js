const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
const port = Number(process.env.PANEL_PORT || 8081);
const publicDir = path.join(__dirname, 'public');

app.use(express.static(publicDir));

app.get('/login', (_req, res) => res.sendFile(path.join(publicDir, 'login.html')));
app.get('/register', (_req, res) => res.sendFile(path.join(publicDir, 'register.html')));
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
