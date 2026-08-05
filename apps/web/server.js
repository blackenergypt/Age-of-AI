const path = require('path');
const express = require('express');

const app = express();
const port = Number(process.env.WEB_PORT || 8080);

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Web (landing) em http://localhost:${port}`);
});
