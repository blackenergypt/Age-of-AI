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
        passport.use('discord', new DiscordStrategy({
            clientID: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            callbackURL: process.env.DISCORD_CALLBACK_URL.replace('http://localhost:3000/auth/', 'http://localhost:3000/api/auth/'),
            scope: ['identify', 'email']
        }, (accessToken, refreshToken, profile, done) => {
            // Simplificado para depuração
            console.log('Perfil do Discord:', profile);
            return done(null, profile);
        }));
        console.log('Discord authentication strategy configured with callback URL:', 
            process.env.DISCORD_CALLBACK_URL.replace('http://localhost:3000/auth/', 'http://localhost:3000/api/auth/'));
    } catch (error) {
        console.error('Erro ao configurar estratégia Discord:', error);
    }
} else {
    console.log('Discord authentication strategy not configured - missing credentials or module');
    console.log('DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID);
    console.log('DISCORD_CLIENT_SECRET:', process.env.DISCORD_CLIENT_SECRET);
}

if (config.twitter.consumerKey && config.twitter.consumerSecret) {
    // Twitter strategy
    passport.use(new TwitterStrategy({
        consumerKey: config.twitter.consumerKey,
        consumerSecret: config.twitter.consumerSecret,
        callbackURL: config.twitter.callbackUrl
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
    // Google strategy
    passport.use(new GoogleStrategy({
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl
    }, (accessToken, refreshToken, profile, done) => {
        const existingUser = users.find(user => user.email === profile.emails[0].value);
        if (existingUser) {
            return done(null, existingUser);
        }
        const newUser = { id: profile.id, email: profile.emails[0].value, name: profile.displayName };
        users.push(newUser);
        return done(null, newUser);
    }));
    console.log('Google authentication strategy configured');
} else {
    console.log('Google authentication strategy not configured - missing credentials');
}

if (config.facebook.appId && config.facebook.appSecret) {
    // Facebook strategy
    passport.use(new FacebookStrategy({
        clientID: config.facebook.appId,
        clientSecret: config.facebook.appSecret,
        callbackURL: config.facebook.callbackUrl,
        profileFields: ['id', 'displayName', 'email']
    }, (accessToken, refreshToken, profile, done) => {
        const existingUser = users.find(user => user.email === profile.emails[0].value);
        if (existingUser) {
            return done(null, existingUser);
        }
        const newUser = { id: profile.id, email: profile.emails[0].value, name: profile.displayName };
        users.push(newUser);
        return done(null, newUser);
    }));
    console.log('Facebook authentication strategy configured');
} else {
    console.log('Facebook authentication strategy not configured - missing credentials');
} 