require('dotenv').config({
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.development'
});

console.log('Ambiente:', process.env.NODE_ENV);
console.log('Variáveis de ambiente carregadas:');
console.log('DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID);
console.log('DISCORD_CLIENT_SECRET:', process.env.DISCORD_CLIENT_SECRET);
console.log('SENTRY_DSN:', process.env.SENTRY_DSN);
console.log('TWITTER_CONSUMER_KEY:', process.env.TWITTER_CONSUMER_KEY);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID);

const config = {
    server: {
        port: process.env.PORT || 3000,
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
    websocket: {
        pingInterval: process.env.WS_PING_INTERVAL || 30000,
    },
    game: {
        tickRate: process.env.GAME_TICK_RATE || 20,
        worldWidth: process.env.WORLD_WIDTH || 2000,
        worldHeight: process.env.WORLD_HEIGHT || 2000,
        maxPlayersPerKingdom: process.env.MAX_PLAYERS_PER_KINGDOM || 50,
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
};

module.exports = config;