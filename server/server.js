const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const WebSocketServer = require('./websocket');
const Game = require('./game/game');
const config = require('./config');
const { connectToDatabase } = require('./database');
const session = require('express-session');
const passport = require('passport');
const { initSentry, sentryErrorHandler, setupGlobalErrorHandling } = require('./utils/sentry');
const { getRegisteredUsersCount, getDiscordMembersCount } = require('./utils/stats');

// Inicializar o Sentry para monitoramento de erros
initSentry();

// Configurar tratamento global de erros
setupGlobalErrorHandling();

// Configurar o Passport antes de importar as rotas
require('./passport-setup');

// Importar rotas após configurar o Passport
const authRoutes = require('./auth');

// Configuração do servidor Express
const app = express();
const server = http.createServer(app);

// Configurar middleware de sessão
app.use(session({
    secret: config.auth.jwtSecret,
    resave: false,
    saveUninitialized: false
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes); // Use the auth routes

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '../public')));

// Adicionar estas rotas específicas antes do middleware de URLs amigáveis
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/menu.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/game.html'));
});

// Middleware para URLs amigáveis
app.use((req, res, next) => {
    // Ignorar requisições para arquivos estáticos (css, js, imagens, etc)
    if (req.path.match(/\.(css|js|jpg|png|gif|svg|ico|map|json|woff|woff2|ttf|eot)$/)) {
        return next();
    }
    
    // Ignorar requisições para a API
    if (req.path.startsWith('/api/')) {
        return next();
    }
    
    // Se a URL não tem extensão
    if (!req.path.includes('.')) {
        // Verificar se existe um arquivo HTML correspondente
        const filePath = path.join(__dirname, '../public', req.path + '.html');
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
        
        // Se a URL termina com barra ou é a raiz, procurar por index.html
        if (req.path === '/' || req.path.endsWith('/')) {
            const indexPath = path.join(__dirname, '../public', req.path, 'index.html');
            if (fs.existsSync(indexPath)) {
                return res.sendFile(indexPath);
            }
        }
    }
    
    next();
});

// Redirecionar URLs com .html para versões sem extensão
app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
        return res.redirect(301, req.path.slice(0, -5));
    }
    next();
});

// Redirecionar /index para /
app.get('/index', (req, res) => {
    res.redirect(301, '/');
});

// Rota para a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rota para lidar com 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

// Inicializar o jogo
const game = new Game();

// Inicializar o WebSocket Server
const wss = new WebSocketServer(server, game);
game.setWebSocketServer(wss);

// Middleware de tratamento de erros do Sentry
app.use(sentryErrorHandler());

// Adicionar middleware de tratamento de erros geral
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({ 
    message: 'Ocorreu um erro no servidor', 
    error: config.server.debug ? err.message : undefined 
  });
});

// Rota para obter estatísticas do jogo
app.get('/api/stats', async (req, res) => {
    try {
        const [registeredUsers, discordMembers] = await Promise.all([
            getRegisteredUsersCount(),
            getDiscordMembersCount()
        ]);
        
        const onlinePlayers = game.getOnlinePlayersCount(); // Método que retorna o número de jogadores online
        const kingdoms = game.getKingdomsCount(); // Método que retorna o número de reinos existentes

        res.json({
            onlinePlayers: onlinePlayers,
            kingdoms: kingdoms,
            registeredUsers: registeredUsers,
            discordMembers: discordMembers
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ message: 'Erro ao obter estatísticas' });
    }
});

// Middleware para lidar com erros 404
app.use((req, res, next) => {
    // Verificar se a requisição é para a API
    //if (req.path.startsWith('/api')) {
    //    return res.status(404).json({ message: 'Endpoint não encontrado' });
  //  }
    
    // Para requisições de páginas, enviar a página 404.html
   // res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

// Middleware para lidar com erros
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err);
    
    // Verificar se a requisição é para a API
    if (req.path.startsWith('/api')) {
        return res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
    
    // Para requisições de páginas, enviar uma página de erro
    res.status(500).send('Erro no servidor. Por favor, tente novamente mais tarde.');
});

// Adicionar rota para redirecionar o callback do Discord
app.get('/auth/discord/callback', (req, res) => {
    console.log('Redirecionando callback do Discord para /api/auth/discord/callback');
    const queryString = new URLSearchParams(req.query).toString();
    res.redirect(`/api/auth/discord/callback?${queryString}`);
});

// Conectar ao banco de dados antes de iniciar o servidor
(async () => {
  const connected = await connectToDatabase();
  
  if (connected) {
    server.listen(process.env.PORT || 3000, () => {
      console.log(`Servidor rodando na porta ${process.env.PORT || 3000} em modo ${config.server.nodeEnv}`);
      if (config.server.debug) {
        console.log('Modo de depuração ativado');
      }
    });
  } else {
    console.error('Não foi possível iniciar o servidor devido a falha na conexão com o banco de dados');
  }
})();