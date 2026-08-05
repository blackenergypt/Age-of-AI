const express = require('express');
const http = require('http');
const session = require('express-session');
const passport = require('passport');
const config = require('./config');
const { connectToDatabase } = require('./database');
const { initSentry, sentryErrorHandler, setupGlobalErrorHandling } = require('./utils/sentry');
const { getRegisteredUsersCount, getDiscordMembersCount } = require('./utils/stats');
const { tryRedis, listNodes, pickLeastLoaded } = require('@age-of-ai/shared');
const matchesRoutes = require('./routes/matches');

initSentry();
setupGlobalErrorHandling();
require('./passport-setup');

const authRoutes = require('./auth');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(session({
  secret: config.auth.jwtSecret,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/health', async (_req, res) => {
  const redis = await tryRedis(config.redis.url);
  res.json({
    ok: true,
    service: 'api',
    redis: Boolean(redis)
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', matchesRoutes);

app.get('/api/stats', async (_req, res) => {
  try {
    const [registeredUsers, discordMembers] = await Promise.all([
      getRegisteredUsersCount(),
      getDiscordMembersCount()
    ]);

    const redis = await tryRedis(config.redis.url);
    const nodes = redis ? await listNodes(redis) : [];
    const onlinePlayers = nodes.reduce((sum, n) => sum + n.onlinePlayers, 0);
    const matches = nodes.reduce((sum, n) => sum + n.matches, 0);
    const best = pickLeastLoaded(nodes);
    let gameServerWs = best?.wsUrl || config.gameServer.publicWsUrl;

    if (config.gateway?.publicOrigin && best?.nodeId) {
      try {
        const u = new URL(config.gateway.publicOrigin);
        const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
        gameServerWs = `${wsProto}//${u.host}/gs/${best.nodeId}`;
      } catch (_) {
        // keep original
      }
    }

    res.json({
      onlinePlayers,
      kingdoms: 0,
      matches,
      gameNodes: nodes.length,
      registeredUsers,
      discordMembers,
      gameServerWs
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas' });
  }
});

app.use(sentryErrorHandler());

app.use((err, _req, res, _next) => {
  console.error('Erro na API:', err);
  res.status(500).json({
    message: 'Ocorreu um erro no servidor',
    error: config.server.debug ? err.message : undefined
  });
});

(async () => {
  await connectToDatabase();
  const redis = await tryRedis(config.redis.url);
  server.listen(config.server.port, () => {
    console.log(`API a correr na porta ${config.server.port} (${config.server.nodeEnv})`);
    console.log(`Redis: ${redis ? 'ligado' : 'offline (fallback single-node)'}`);
  });
})();
