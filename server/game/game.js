const World = require('./world');
const Player = require('./player');
const Kingdom = require('./kingdom');
const TradeSystem = require('./trade');
const TechnologyTree = require('./technology-tree');
const EventSystem = require('./event-system');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

class Game {
  constructor(options = {}) {
    this.players = new Map();
    this.kingdoms = new Map();
    
    // Usar configurações passadas ou valores padrão do config
    const worldWidth = options.worldWidth || config.game.worldWidth;
    const worldHeight = options.worldHeight || config.game.worldHeight;
    
    this.world = new World(worldWidth, worldHeight);
    this.lastUpdateTime = Date.now();
    this.tradeSystem = new TradeSystem(this);
    this.technologyTree = new TechnologyTree();
    this.eventSystem = new EventSystem(this);
    this.websocketServer = null;
    this.maxPlayersPerKingdom = options.maxPlayersPerKingdom || config.game.maxPlayersPerKingdom;
    
    // Definir eras do jogo
    this.ages = {
      INITIAL: 'initial',
      FEUDAL: 'feudal',
      CASTLE: 'castle',
      IMPERIAL: 'imperial'
    };
    
    console.log(`Jogo inicializado com mundo de ${worldWidth}x${worldHeight}`);
  }
  
  setWebSocketServer(wss) {
    this.websocketServer = wss;
  }
  
  notifyPlayer(playerId, message) {
    if (!this.websocketServer) return;
    
    this.websocketServer.sendToPlayer(playerId, message);
  }
  
  // Métodos para o sistema de comércio
  createTradeOffer(fromPlayerId, toPlayerId, offer, request) {
    return this.tradeSystem.createTradeOffer(fromPlayerId, toPlayerId, offer, request);
  }
  
  acceptTradeOffer(tradeId, playerId) {
    return this.tradeSystem.acceptTradeOffer(tradeId, playerId);
  }
  
  rejectTradeOffer(tradeId, playerId) {
    return this.tradeSystem.rejectTradeOffer(tradeId, playerId);
  }
  
  cancelTradeOffer(tradeId, playerId) {
    return this.tradeSystem.cancelTradeOffer(tradeId, playerId);
  }
  
  getPlayerPendingOffers(playerId) {
    return this.tradeSystem.getPlayerPendingOffers(playerId);
  }
  
  getPlayerTradeHistory(playerId) {
    return this.tradeSystem.getPlayerTradeHistory(playerId);
  }
  
  addPlayer(id, name, kingdomName = null) {
    const startPosition = this.world.getRandomStartPosition();
    const player = new Player(id, name, startPosition);
    this.players.set(id, player);
    
    // Adicionar recursos iniciais para o jogador
    player.resources = {
      food: 200,
      wood: 200,
      stone: 100,
      gold: 100
    };
    
    // Verificar se o jogador quer criar ou entrar em um reino
    if (kingdomName) {
      // Verificar se o reino já existe
      let kingdom = this.getKingdomByName(kingdomName);
      
      if (!kingdom) {
        // Criar novo reino se não existir
        kingdom = new Kingdom(kingdomName, id);
        this.kingdoms.set(kingdom.id, kingdom);
        player.isKingdomLeader = true;
      }
      
      // Adicionar jogador ao reino
      kingdom.addMember(id, name);
      player.kingdomId = kingdom.id;
    }
    
    // Adicionar unidades iniciais
    this.world.addEntity(player.createTownCenter());
    this.world.addEntity(player.createVillager());
    this.world.addEntity(player.createVillager());
    this.world.addEntity(player.createVillager());
    
    return player;
  }
  
  getKingdomByName(name) {
    for (const kingdom of this.kingdoms.values()) {
      if (kingdom.name.toLowerCase() === name.toLowerCase()) {
        return kingdom;
      }
    }
    return null;
  }
  
  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      // Remover todas as entidades do jogador
      this.world.removeEntitiesByOwner(playerId);
      this.players.delete(playerId);
    }
  }
  
  update() {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;
    
    // Atualizar o mundo (incluindo ciclo dia/noite)
    this.world.update(deltaTime);
    
    // Obter informações do tempo atual
    const timeOfDay = this.world.getTimeOfDayInfo();
    
    // Processar eventos baseados no tempo
    this.eventSystem.processEvents(deltaTime);
    
    // Atualizar todos os jogadores
    for (const player of this.players.values()) {
      // Atualizar visibilidade e taxas de coleta com base no ciclo dia/noite
      player.updateVisibility(timeOfDay);
      player.updateGatheringRates(timeOfDay);
      
      // Atualizar o jogador
      player.update(deltaTime, this);
    }
    
    // Atualizar todos os reinos
    for (const kingdom of this.kingdoms.values()) {
      kingdom.update(deltaTime, this);
    }
    
    // Verificar condições de vitória
    this.checkVictoryConditions();
  }
  
  handleCommand(playerId, command) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    switch (command.type) {
      case 'move_units':
        this.world.moveUnits(
          command.unitIds, 
          command.targetX, 
          command.targetY, 
          playerId
        );
        break;
        
      case 'gather_resource':
        this.world.gatherResource(
          command.unitIds,
          command.resourceId,
          playerId
        );
        break;
        
      case 'build':
        this.world.buildStructure(
          command.unitIds,
          command.buildingType,
          command.x,
          command.y,
          playerId,
          player
        );
        break;
        
      case 'train_unit':
        this.world.trainUnit(
          command.buildingId,
          command.unitType,
          playerId,
          player
        );
        break;
        
      case 'attack':
        this.world.attackEntity(
          command.unitIds,
          command.targetId,
          playerId
        );
        break;
        
      case 'create_trade_offer':
        return this.createTradeOffer(
          playerId,
          command.toPlayerId,
          command.offer,
          command.request
        );
        
      case 'accept_trade_offer':
        return this.acceptTradeOffer(
          command.tradeId,
          playerId
        );
        
      case 'reject_trade_offer':
        return this.rejectTradeOffer(
          command.tradeId,
          playerId
        );
        
      case 'cancel_trade_offer':
        return this.cancelTradeOffer(
          command.tradeId,
          playerId
        );
    }
  }
  
  getState() {
    // Retornar o estado atual do jogo para enviar aos clientes
    return {
      players: Array.from(this.players.values()).map(player => player.getInfo()),
      kingdoms: Array.from(this.kingdoms.values()).map(kingdom => kingdom.getInfo()),
      entities: this.world.getVisibleEntities(),
      resources: this.world.getResources(),
      terrain: this.world.getTerrainData(),
      timeOfDay: this.world.getTimeOfDayInfo()
    };
  }
  
  getOnlinePlayersCount() {
    return this.players.size;
  }
  
  getKingdomsCount() {
    return this.kingdoms.size;
  }
  
  // Método para jogador avançar de era
  advanceAge(playerId) {
    const player = this.players.get(playerId);
    if (!player) return { success: false, message: "Jogador não encontrado" };
    
    const currentAge = player.age;
    let nextAge;
    let requirements = {};
    
    switch (currentAge) {
      case this.ages.INITIAL:
        nextAge = this.ages.FEUDAL;
        requirements = {
          food: 500,
          wood: 200
        };
        break;
      case this.ages.FEUDAL:
        nextAge = this.ages.CASTLE;
        requirements = {
          food: 800,
          wood: 200,
          stone: 200
        };
        break;
      case this.ages.CASTLE:
        nextAge = this.ages.IMPERIAL;
        requirements = {
          food: 1000,
          wood: 300,
          stone: 300,
          gold: 200
        };
        break;
      case this.ages.IMPERIAL:
        return { success: false, message: "Já está na era mais avançada" };
    }
    
    // Verificar se o jogador tem recursos suficientes
    for (const [resource, amount] of Object.entries(requirements)) {
      if (player.resources[resource] < amount) {
        return { 
          success: false, 
          message: `Recursos insuficientes: necessário ${amount} de ${resource}`
        };
      }
    }
    
    // Deduzir recursos
    for (const [resource, amount] of Object.entries(requirements)) {
      player.resources[resource] -= amount;
    }
    
    // Avançar para a próxima era
    player.age = nextAge;
    
    // Desbloquear novas tecnologias e unidades
    this.technologyTree.unlockAgeTechnologies(player, nextAge);
    
    // Notificar o jogador
    this.notifyPlayer(playerId, {
      type: 'age_advanced',
      data: {
        newAge: nextAge,
        unlockedTechnologies: player.availableTechnologies,
        unlockedUnits: player.availableUnits,
        unlockedBuildings: player.availableBuildings
      }
    });
    
    return { success: true, message: `Avançou para a ${nextAge} era` };
  }
  
  // Método para verificar condições de vitória
  checkVictoryConditions() {
    // Verificar vitória por dominação
    if (this.kingdoms.size === 1) {
      const lastKingdom = Array.from(this.kingdoms.values())[0];
      this.declareWinner(lastKingdom.id, 'domination');
      return;
    }
    
    // Verificar vitória por maravilha
    for (const kingdom of this.kingdoms.values()) {
      // Lógica para verificar se o reino tem uma maravilha completa
      // e se ela foi defendida pelo tempo necessário
      
      // Se condição atendida:
      // this.declareWinner(kingdom.id, 'wonder');
    }
    
    // Verificar vitória por pontos (após um tempo limite)
    // Implementar lógica de pontuação e tempo limite
  }
  
  // Método para declarar um vencedor
  declareWinner(kingdomId, victoryType) {
    const kingdom = this.kingdoms.get(kingdomId);
    if (!kingdom) return;
    
    // Notificar todos os jogadores sobre o vencedor
    for (const player of this.players.values()) {
      this.notifyPlayer(player.id, {
        type: 'game_over',
        data: {
          winnerKingdomId: kingdomId,
          winnerKingdomName: kingdom.name,
          victoryType: victoryType,
          isWinner: player.kingdomId === kingdomId
        }
      });
    }
    
    // Registrar resultado do jogo (para estatísticas futuras)
    console.log(`Jogo terminado. Reino "${kingdom.name}" venceu por ${victoryType}`);
  }

  // Método para criar um novo reino
  createKingdom(name, leaderId) {
    const kingdomId = uuidv4(); // Gerar um ID único para o reino
    const newKingdom = new Kingdom(name, leaderId);
    this.kingdoms.set(kingdomId, newKingdom);
    return newKingdom;
  }

  // Método para se juntar a um reino existente
  joinKingdom(playerId, kingdomId) {
    const kingdom = this.kingdoms.get(kingdomId);
    if (kingdom) {
      kingdom.members.set(playerId, true); // Adiciona o jogador ao reino
      return true;
    }
    return false;
  }
}

module.exports = Game; 