const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const config = require('./config');
const User = require('./models/user');

let DiscordStrategy;

try {
    DiscordStrategy = require('passport-discord').Strategy;
    console.log('Passport Discord carregado com sucesso');
} catch (error) {
    console.error('Erro ao carregar passport-discord:', error);
}

/** Normaliza callbacks antigos (:3000/:3001) para o gateway nginx. */
function oauthCallback(url, provider) {
    const origin = (process.env.PUBLIC_GATEWAY_ORIGIN || process.env.FRONTEND_URL || 'http://localhost').replace(/\/$/, '');
    const fallback = `${origin}/api/auth/${provider}/callback`;
    if (!url) return fallback;
    return String(url)
        .replace(/https?:\/\/localhost:3000\/auth\//i, `${origin}/api/auth/`)
        .replace(/https?:\/\/localhost:3000\/api\/auth\//i, `${origin}/api/auth/`)
        .replace(/https?:\/\/localhost:3001\/api\/auth\//i, `${origin}/api/auth/`);
}

// In-memory user storage (for demonstration purposes)
const users = [];

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user.id || user._id);
});

// Deserialize user
passport.deserializeUser((id, done) => {
    // Simplificado para depuração
    done(null, { id });
});

// Discord strategy
if (DiscordStrategy && process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    try {
        const discordCallback = oauthCallback(process.env.DISCORD_CALLBACK_URL, 'discord');
        passport.use('discord', new DiscordStrategy({
            clientID: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            callbackURL: discordCallback,
            scope: ['identify', 'email']
        }, (accessToken, refreshToken, profile, done) => {
            console.log('Perfil do Discord:', profile);
            return done(null, profile);
        }));
        console.log('Discord authentication strategy configured with callback URL:', discordCallback);
    } catch (error) {
        console.error('Erro ao configurar estratégia Discord:', error);
    }
} else {
    console.log('Discord authentication strategy not configured - missing credentials or module');
}

if (config.twitter.consumerKey && config.twitter.consumerSecret) {
    passport.use(new TwitterStrategy({
        consumerKey: config.twitter.consumerKey,
        consumerSecret: config.twitter.consumerSecret,
        callbackURL: oauthCallback(config.twitter.callbackUrl, 'twitter')
    }, (token, tokenSecret, profile, done) => {
        const existingUser = users.find(user => user.id === profile.id);
        if (existingUser) {
            return done(null, existingUser);
        }
        const newUser = { id: profile.id, name: profile.displayName };
        users.push(newUser);
        return done(null, newUser);
    }));
    console.log('Twitter authentication strategy configured');
} else {
    console.log('Twitter authentication strategy not configured - missing credentials');
}

if (config.google.clientId && config.google.clientSecret) {
    passport.use(new GoogleStrategy({
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: oauthCallback(config.google.callbackUrl, 'google')
    }, (accessToken, refreshToken, profile, done) => {
        const email = profile.emails?.[0]?.value;
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return done(null, existingUser);
        }
        const newUser = { id: profile.id, email, name: profile.displayName };
        users.push(newUser);
        return done(null, newUser);
    }));
    console.log('Google authentication strategy configured');
} else {
    console.log('Google authentication strategy not configured - missing credentials');
}

if (config.facebook.appId && config.facebook.appSecret) {
    passport.use(new FacebookStrategy({
        clientID: config.facebook.appId,
        clientSecret: config.facebook.appSecret,
        callbackURL: oauthCallback(config.facebook.callbackUrl, 'facebook'),
        profileFields: ['id', 'displayName', 'email']
    }, (accessToken, refreshToken, profile, done) => {
        const email = profile.emails?.[0]?.value;
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return done(null, existingUser);
        }
        const newUser = { id: profile.id, email, name: profile.displayName };
        users.push(newUser);
        return done(null, newUser);
    }));
    console.log('Facebook authentication strategy configured');
} else {
    console.log('Facebook authentication strategy not configured - missing credentials');
}

module.exports = passport;
