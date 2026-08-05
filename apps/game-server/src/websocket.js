const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const { Sentry } = require('./utils/sentry');
const { verifyAccessToken } = require('./utils/jwt');
const MatchManager = require('./game/match-manager');
const { PUBLIC_LOBBY_ID } = require('./game/match-manager');

class WebSocketServer {
  constructor(server, matchManager, options = {}) {
    this.wss = new WebSocket.Server({ server });
    this.matchManager = matchManager || new MatchManager();
    this.clients = new Map();
    this.pingInterval = options.pingInterval || config.websocket.pingInterval;

    this.matchManager.setWebSocketServer(this);
    this.setupWebSocket();
    this.startGameLoop();
    this.startPingInterval();

    console.log(`WebSocket Server inicializado com ping a cada ${this.pingInterval}ms`);
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      const clientId = uuidv4();

      this.clients.set(ws, {
        id: clientId,
        player: null,
        user: null,
        authenticated: false,
        matchId: null
      });

      console.log(`Novo cliente conectado: ${clientId}`);

      ws.send(JSON.stringify({
        type: 'connection',
        data: {
          clientId,
          authRequired: true,
          stats: this.getStats(),
          matches: this.matchManager.listMatches()
        }
      }));

      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
        console.log(`Cliente desconectado: ${clientId}`);
      });
    });
  }

  getStats() {
    return {
      onlinePlayers: this.matchManager.getOnlinePlayersCount(),
      kingdoms: this.matchManager.getKingdomsCount(),
      matches: this.matchManager.getMatchCount()
    };
  }

  send(ws, type, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data }));
    }
  }

  sendError(ws, code, message, type = 'error') {
    this.send(ws, type, { code, message });
  }

  findClientByUserId(userId) {
    const userIdStr = String(userId);
    for (const [ws, client] of this.clients.entries()) {
      if (client.user && String(client.user.id) === userIdStr) {
        return { ws, client };
      }
    }
    return null;
  }

  authenticateClient(ws, token) {
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.id) {
      this.sendError(ws, 'INVALID_TOKEN', 'Token JWT inválido ou em falta. Faça login novamente.', 'auth_error');
      ws.close(4401, 'Unauthorized');
      return null;
    }

    const client = this.clients.get(ws);
    if (!client) return null;

    // Uma sessão ativa por utilizador
    const existing = this.findClientByUserId(decoded.id);
    if (existing && existing.ws !== ws) {
      this.handleDisconnect(existing.ws);
      existing.ws.close(4000, 'Replaced by new session');
      this.clients.delete(existing.ws);
    }

    client.user = {
      id: String(decoded.id),
      email: decoded.email || null,
      role: decoded.role || 'user',
      username: decoded.username || null
    };
    client.authenticated = true;
    return { client, decoded };
  }

  requireAuth(ws, message) {
    const client = this.clients.get(ws);
    if (!client) return null;

    if (client.authenticated && client.user) {
      return { client, decoded: client.user };
    }

    return this.authenticateClient(ws, message.data?.token);
  }

  leaveCurrentMatch(client) {
    if (!client?.player) return;

    const match = this.matchManager.leaveMatch(client.player.id);
    if (match) {
      this.broadcastToMatch(match.id, {
        type: 'player_left',
        data: {
          playerId: client.player.id,
          onlinePlayers: match.playerCount,
          match: match.getInfo()
        }
      });
    }

    client.player = null;
    client.matchId = null;
  }

  handleDisconnect(ws) {
    const client = this.clients.get(ws);
    if (!client) return;

    this.leaveCurrentMatch(client);
    this.clients.delete(ws);
  }

  enterMatch(ws, client, match, player) {
    client.player = player;
    client.matchId = match.id;
    match.game.setWebSocketServer(this);

    this.send(ws, 'match_joined', {
      match: match.getInfo(),
      player: player.getInfo()
    });

    this.send(ws, 'game_state', {
      ...match.game.getState(),
      matchId: match.id,
      match: match.getInfo()
    });

    this.broadcastToMatch(match.id, {
      type: 'player_joined',
      data: {
        player: player.getInfo(),
        onlinePlayers: match.playerCount,
        kingdoms: match.game.getKingdomsCount(),
        match: match.getInfo()
      }
    }, ws);
  }

  handleMessage(ws, rawMessage) {
    const client = this.clients.get(ws);
    if (!client) return;

    try {
      const message = JSON.parse(rawMessage.toString());

      switch (message.type) {
        case 'list_matches': {
          const auth = this.requireAuth(ws, message);
          if (!auth) return;
          this.send(ws, 'matches_list', {
            matches: this.matchManager.listMatches({ includePrivate: false }),
            stats: this.getStats()
          });
          break;
        }

        case 'create_match': {
          const auth = this.requireAuth(ws, message);
          if (!auth) return;

          this.leaveCurrentMatch(auth.client);

          const match = this.matchManager.createMatch({
            name: message.data?.name,
            hostUserId: auth.client.user.id,
            maxPlayers: message.data?.maxPlayers,
            password: message.data?.password || null,
            isPrivate: message.data?.isPrivate !== false
          });

          const playerName =
            message.data?.playerName ||
            auth.client.user.username ||
            auth.client.user.email ||
            'Jogador';

          const result = this.matchManager.joinMatch(match.id, {
            playerId: auth.client.id,
            playerName,
            kingdomName: message.data?.kingdomName || null,
            userId: auth.client.user.id,
            password: message.data?.password || null
          });

          if (!result.ok) {
            this.sendError(ws, result.code, result.message, 'match_error');
            return;
          }

          this.enterMatch(ws, auth.client, result.match, result.player);
          break;
        }

        case 'join_match': {
          const auth = this.requireAuth(ws, message);
          if (!auth) return;

          this.leaveCurrentMatch(auth.client);

          const playerName =
            message.data?.playerName ||
            auth.client.user.username ||
            auth.client.user.email ||
            'Jogador';

          const result = this.matchManager.joinMatch(message.data?.matchId, {
            playerId: auth.client.id,
            playerName,
            kingdomName: message.data?.kingdomName || null,
            userId: auth.client.user.id,
            password: message.data?.password || null
          });

          if (!result.ok) {
            this.sendError(ws, result.code, result.message, 'match_error');
            return;
          }

          this.enterMatch(ws, auth.client, result.match, result.player);
          break;
        }

        case 'join_game': {
          // Compatível com o fluxo antigo: entra no lobby público ou numa partida pedida
          const auth = this.requireAuth(ws, message);
          if (!auth) return;

          this.leaveCurrentMatch(auth.client);

          const playerName =
            message.data?.playerName ||
            auth.client.user.username ||
            auth.client.user.email ||
            'Jogador';

          let matchId = message.data?.matchId || null;
          const password = message.data?.password || null;

          if (!matchId && message.data?.mode === 'private' && message.data?.name) {
            const match = this.matchManager.createMatch({
              name: message.data.name,
              hostUserId: auth.client.user.id,
              maxPlayers: message.data.maxPlayers,
              password,
              isPrivate: true
            });
            matchId = match.id;
          }

          if (!matchId) {
            matchId = PUBLIC_LOBBY_ID;
            this.matchManager.ensurePublicLobby();
          }

          const result = this.matchManager.joinMatch(matchId, {
            playerId: auth.client.id,
            playerName,
            kingdomName: message.data?.kingdomName || null,
            userId: auth.client.user.id,
            password
          });

          if (!result.ok) {
            this.sendError(ws, result.code, result.message, 'match_error');
            return;
          }

          this.enterMatch(ws, auth.client, result.match, result.player);
          break;
        }

        case 'leave_match': {
          if (!client.authenticated) {
            this.sendError(ws, 'UNAUTHORIZED', 'Não autenticado.', 'auth_error');
            return;
          }
          this.leaveCurrentMatch(client);
          this.send(ws, 'match_left', { stats: this.getStats() });
          break;
        }

        case 'command': {
          if (!client.authenticated || !client.player || !client.matchId) {
            this.sendError(ws, 'UNAUTHORIZED', 'Entra numa partida autenticada antes de enviar comandos.');
            return;
          }

          const match = this.matchManager.getMatch(client.matchId);
          if (!match) {
            this.sendError(ws, 'MATCH_NOT_FOUND', 'Partida não encontrada.', 'match_error');
            return;
          }

          match.game.handleCommand(client.player.id, message.data);
          break;
        }

        default:
          console.log(`Tipo de mensagem desconhecido: ${message.type}`);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      if (config.sentry.dsn) {
        Sentry.captureException(error);
      }
    }
  }

  broadcastToMatch(matchId, message, excludeWs = null) {
    const messageStr = JSON.stringify(message);
    for (const [ws, client] of this.clients.entries()) {
      if (
        client.matchId === matchId &&
        ws !== excludeWs &&
        ws.readyState === WebSocket.OPEN
      ) {
        ws.send(messageStr);
      }
    }
  }

  broadcastToAll(message) {
    const messageStr = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  startGameLoop() {
    const TICK_RATE = Number(config.game.tickRate) || 20;

    setInterval(() => {
      try {
        this.matchManager.updateAll((match) => {
          const messageStr = JSON.stringify({
            type: 'game_update',
            data: {
              ...match.game.getState(),
              matchId: match.id,
              match: match.getInfo()
            }
          });

          for (const [ws, client] of this.clients.entries()) {
            if (
              client.authenticated &&
              client.matchId === match.id &&
              ws.readyState === WebSocket.OPEN
            ) {
              ws.send(messageStr);
            }
          }
        });
      } catch (error) {
        console.error('Erro no game loop:', error);
        if (config.sentry.dsn) {
          Sentry.captureException(error);
        }
      }
    }, 1000 / TICK_RATE);
  }

  sendToPlayer(playerId, message) {
    for (const [ws, client] of this.clients.entries()) {
      if (client.player && client.player.id === playerId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        return true;
      }
    }
    return false;
  }

  startPingInterval() {
    setInterval(() => {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.ping();
        }
      });
    }, this.pingInterval);
  }
}

module.exports = WebSocketServer;
