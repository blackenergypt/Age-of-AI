const path = require('path');

const rootDir = path.resolve(__dirname, '../../..');
const envFile = process.env.NODE_ENV === 'production'
  ? path.join(rootDir, '.env.production')
  : path.join(rootDir, '.env.development');

require('dotenv').config({ path: envFile });

const config = {
  server: {
    port: Number(process.env.GAME_SERVER_PORT || 3002),
    nodeEnv: process.env.NODE_ENV || 'development',
    debug: process.env.DEBUG === 'true',
    nodeId: process.env.GAME_NODE_ID || `gs-${process.pid}`,
    maxPlayers: Number(process.env.GAME_NODE_MAX_PLAYERS || 200),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  },
  websocket: {
    pingInterval: Number(process.env.WS_PING_INTERVAL || 30000),
  },
  game: {
    tickRate: Number(process.env.GAME_TICK_RATE || 20),
    worldWidth: Number(process.env.WORLD_WIDTH || 800),
    worldHeight: Number(process.env.WORLD_HEIGHT || 800),
    maxPlayersPerKingdom: Number(process.env.MAX_PLAYERS_PER_KINGDOM || 50),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 1.0,
  },
};

module.exports = config;
