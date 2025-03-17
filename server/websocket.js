const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const { Sentry } = require('./utils/sentry');

class WebSocketServer {
  constructor(server, game, options = {}) {
    this.wss = new WebSocket.Server({ server });
    this.game = game;
    this.clients = new Map();
    
    // Usar configurações passadas ou valores padrão do config
    this.pingInterval = options.pingInterval || config.websocket.pingInterval;
    
    this.setupWebSocket();
    this.startGameLoop();
    this.startPingInterval();
    
    console.log(`WebSocket Server inicializado com ping a cada ${this.pingInterval}ms`);
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      const clientId = uuidv4();
      
      // Adicionar novo cliente
      this.clients.set(ws, {
        id: clientId,
        player: null
      });
      
      console.log(`Novo cliente conectado: ${clientId}`);
      
      // Enviar ID para o cliente
      ws.send(JSON.stringify({
        type: 'connection',
        data: { 
          clientId,
          stats: {
            onlinePlayers: this.game.getOnlinePlayersCount(),
            kingdoms: this.game.getKingdomsCount()
          }
        }
      }));
      
      // Lidar com mensagens do cliente
      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });
      
      // Lidar com desconexão
      ws.on('close', () => {
        const client = this.clients.get(ws);
        if (client && client.player) {
          this.game.removePlayer(client.player.id);
        }
        this.clients.delete(ws);
        console.log(`Cliente desconectado: ${clientId}`);
      });
    });
  }
  
  handleMessage(ws, message) {
    const client = this.clients.get(ws);
    
    try {
      switch (message.type) {
        case 'join_game':
          const playerName = message.data.playerName;
          const kingdomName = message.data.kingdomName;
          
          const player = this.game.addPlayer(client.id, playerName, kingdomName);
          client.player = player;
          
          // Enviar estado inicial do jogo para o novo jogador
          ws.send(JSON.stringify({
            type: 'game_state',
            data: this.game.getState()
          }));
          
          // Notificar todos os clientes sobre o novo jogador
          this.broadcastToAll({
            type: 'player_joined',
            data: { 
              player: player.getInfo(),
              onlinePlayers: this.game.getOnlinePlayersCount(),
              kingdoms: this.game.getKingdomsCount()
            }
          });
          break;
          
        case 'command':
          if (client.player) {
            this.game.handleCommand(client.player.id, message.data);
          }
          break;
          
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
  
  broadcastToAll(message) {
    const messageStr = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
  
  startGameLoop() {
    const TICK_RATE = 20; // 20 ticks por segundo
    
    setInterval(() => {
      this.game.update();
      
      // Enviar atualizações para todos os clientes
      const gameState = this.game.getState();
      this.broadcastToAll({
        type: 'game_update',
        data: gameState
      });
    }, 1000 / TICK_RATE);
  }

  // Adicionar método para enviar mensagens a um jogador específico
  sendToPlayer(playerId, message) {
    for (const [ws, client] of this.clients.entries()) {
      if (client.player && client.player.id === playerId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        return true;
      }
    }
    return false;
  }

  // Método para manter as conexões ativas
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