const path = require('path');

const rootDir = path.resolve(__dirname, '../../..');
const envFile = process.env.NODE_ENV === 'production'
  ? path.join(rootDir, '.env.production')
  : path.join(rootDir, '.env.development');

require('dotenv').config({ path: envFile });

const config = {
  server: {
    port: Number(process.env.API_PORT || process.env.PORT || 3001),
    nodeEnv: process.env.NODE_ENV || 'development',
    debug: process.env.DEBUG === 'true',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 27017,
    name: process.env.DB_NAME || 'age_of_ai',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASS || 'securepassword123',
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
  discord: {
    guildId: process.env.DISCORD_GUILD_ID,
    botToken: process.env.DISCORD_BOT_TOKEN,
    inviteLink: process.env.DISCORD_INVITE_LINK,
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: process.env.DISCORD_CALLBACK_URL,
  },
  twitter: {
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackUrl: process.env.TWITTER_CALLBACK_URL,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    callbackUrl: process.env.FACEBOOK_CALLBACK_URL,
  },
  gameServer: {
    publicWsUrl: process.env.GAME_SERVER_WS_URL || 'ws://localhost:3002',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  },
};

module.exports = config;
