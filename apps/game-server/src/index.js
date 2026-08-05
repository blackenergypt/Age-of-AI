const http = require('http');
const express = require('express');
const WebSocketServer = require('./websocket');
const MatchManager = require('./game/match-manager');
const config = require('./config');
const { initSentry, sentryErrorHandler, setupGlobalErrorHandling } = require('./utils/sentry');
const { startNodeRegistry } = require('./registry-client');

initSentry();
setupGlobalErrorHandling();

const app = express();
const server = http.createServer(app);

const matchManager = new MatchManager();
const wss = new WebSocketServer(server, matchManager);

const publicWsUrl =
  process.env.GAME_SERVER_PUBLIC_WS_URL ||
  `ws://localhost:${config.server.port}`;

const publicHttpUrl =
  process.env.GAME_SERVER_PUBLIC_HTTP_URL ||
  `http://localhost:${config.server.port}`;

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'game-server',
    nodeId: config.server.nodeId,
    onlinePlayers: matchManager.getOnlinePlayersCount(),
    matches: matchManager.getMatchCount(),
    kingdoms: matchManager.getKingdomsCount(),
    wsUrl: publicWsUrl
  });
});

app.get('/matches', (_req, res) => {
  res.json({
    nodeId: config.server.nodeId,
    matches: matchManager.listMatches(),
    stats: {
      onlinePlayers: matchManager.getOnlinePlayersCount(),
      kingdoms: matchManager.getKingdomsCount(),
      matches: matchManager.getMatchCount()
    }
  });
});

app.use(sentryErrorHandler());

const registry = startNodeRegistry({
  redisUrl: config.redis.url,
  getSnapshot: () => ({
    nodeId: config.server.nodeId,
    wsUrl: publicWsUrl,
    httpUrl: publicHttpUrl,
    onlinePlayers: matchManager.getOnlinePlayersCount(),
    matches: matchManager.getMatchCount(),
    maxPlayers: config.server.maxPlayers
  }),
  onStatus: (status) => {
    if (status === 'online') {
      console.log(`[registry] nó ${config.server.nodeId} registado no Redis`);
    } else if (status === 'offline') {
      console.warn('[registry] Redis offline — nó a correr sem discovery');
    }
  }
});

server.listen(config.server.port, () => {
  console.log(
    `Game Server [${config.server.nodeId}] WS na porta ${config.server.port} (${config.server.nodeEnv})`
  );
  console.log(`  public WS: ${publicWsUrl}`);
});

async function shutdown() {
  console.log('A encerrar game-server...');
  await registry.stop();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { server, wss, matchManager };
