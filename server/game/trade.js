const { v4: uuidv4 } = require('uuid');

class TradeSystem {
  constructor(game) {
    this.game = game;
    this.tradeOffers = new Map();
    this.tradeHistory = new Map();
  }
  
  createTradeOffer(fromPlayerId, toPlayerId, offer, request) {
    // Verificar se o jogador tem os recursos que está oferecendo
    const fromPlayer = this.game.players.get(fromPlayerId);
    if (!fromPlayer) return { success: false, message: "Jogador não encontrado" };
    
    // Verificar se o jogador tem recursos suficientes
    for (const [resource, amount] of Object.entries(offer)) {
      if (!fromPlayer.resources[resource] || fromPlayer.resources[resource] < amount) {
        return { 
          success: false, 
          message: `Recursos insuficientes: ${resource}`
        };
      }
    }
    
    // Criar a oferta de comércio
    const tradeId = uuidv4();
    const tradeOffer = {
      id: tradeId,
      fromPlayerId,
      toPlayerId,
      offer, // { wood: 100, stone: 50 }
      request, // { gold: 30, iron: 20 }
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // Expira em 24 horas
    };
    
    this.tradeOffers.set(tradeId, tradeOffer);
    
    // Notificar o jogador alvo sobre a nova oferta
    this.game.notifyPlayer(toPlayerId, {
      type: 'new_trade_offer',
      data: tradeOffer
    });
    
    return { 
      success: true, 
      message: "Oferta de comércio criada com sucesso",
      tradeId
    };
  }
  
  acceptTradeOffer(tradeId, playerId) {
    const tradeOffer = this.tradeOffers.get(tradeId);
    if (!tradeOffer) {
      return { success: false, message: "Oferta de comércio não encontrada" };
    }
    
    if (tradeOffer.toPlayerId !== playerId) {
      return { success: false, message: "Você não é o destinatário desta oferta" };
    }
    
    if (tradeOffer.status !== 'pending') {
      return { success: false, message: `A oferta já está ${tradeOffer.status}` };
    }
    
    if (tradeOffer.expiresAt < Date.now()) {
      tradeOffer.status = 'expired';
      return { success: false, message: "A oferta expirou" };
    }
    
    // Verificar se ambos os jogadores têm recursos suficientes
    const fromPlayer = this.game.players.get(tradeOffer.fromPlayerId);
    const toPlayer = this.game.players.get(playerId);
    
    if (!fromPlayer || !toPlayer) {
      return { success: false, message: "Um dos jogadores não foi encontrado" };
    }
    
    // Verificar recursos do jogador que fez a oferta
    for (const [resource, amount] of Object.entries(tradeOffer.offer)) {
      if (!fromPlayer.resources[resource] || fromPlayer.resources[resource] < amount) {
        tradeOffer.status = 'failed';
        return { 
          success: false, 
          message: `O jogador que fez a oferta não tem recursos suficientes: ${resource}`
        };
      }
    }
    
    // Verificar recursos do jogador que está aceitando
    for (const [resource, amount] of Object.entries(tradeOffer.request)) {
      if (!toPlayer.resources[resource] || toPlayer.resources[resource] < amount) {
        return { 
          success: false, 
          message: `Você não tem recursos suficientes: ${resource}`
        };
      }
    }
    
    // Executar a troca
    // Transferir recursos do jogador que fez a oferta
    for (const [resource, amount] of Object.entries(tradeOffer.offer)) {
      fromPlayer.resources[resource] -= amount;
      toPlayer.resources[resource] = (toPlayer.resources[resource] || 0) + amount;
    }
    
    // Transferir recursos do jogador que aceitou
    for (const [resource, amount] of Object.entries(tradeOffer.request)) {
      toPlayer.resources[resource] -= amount;
      fromPlayer.resources[resource] = (fromPlayer.resources[resource] || 0) + amount;
    }
    
    // Atualizar status da oferta
    tradeOffer.status = 'completed';
    tradeOffer.completedAt = Date.now();
    
    // Adicionar ao histórico de comércio
    if (!this.tradeHistory.has(fromPlayer.id)) {
      this.tradeHistory.set(fromPlayer.id, []);
    }
    if (!this.tradeHistory.has(toPlayer.id)) {
      this.tradeHistory.set(toPlayer.id, []);
    }
    
    this.tradeHistory.get(fromPlayer.id).push(tradeOffer);
    this.tradeHistory.get(toPlayer.id).push(tradeOffer);
    
    // Notificar ambos os jogadores
    this.game.notifyPlayer(fromPlayer.id, {
      type: 'trade_completed',
      data: tradeOffer
    });
    
    return { 
      success: true, 
      message: "Comércio concluído com sucesso"
    };
  }
  
  rejectTradeOffer(tradeId, playerId) {
    const tradeOffer = this.tradeOffers.get(tradeId);
    if (!tradeOffer) {
      return { success: false, message: "Oferta de comércio não encontrada" };
    }
    
    if (tradeOffer.toPlayerId !== playerId) {
      return { success: false, message: "Você não é o destinatário desta oferta" };
    }
    
    if (tradeOffer.status !== 'pending') {
      return { success: false, message: `A oferta já está ${tradeOffer.status}` };
    }
    
    // Atualizar status da oferta
    tradeOffer.status = 'rejected';
    tradeOffer.rejectedAt = Date.now();
    
    // Notificar o jogador que fez a oferta
    this.game.notifyPlayer(tradeOffer.fromPlayerId, {
      type: 'trade_rejected',
      data: tradeOffer
    });
    
    return { 
      success: true, 
      message: "Oferta de comércio rejeitada"
    };
  }
  
  cancelTradeOffer(tradeId, playerId) {
    const tradeOffer = this.tradeOffers.get(tradeId);
    if (!tradeOffer) {
      return { success: false, message: "Oferta de comércio não encontrada" };
    }
    
    if (tradeOffer.fromPlayerId !== playerId) {
      return { success: false, message: "Você não é o autor desta oferta" };
    }
    
    if (tradeOffer.status !== 'pending') {
      return { success: false, message: `A oferta já está ${tradeOffer.status}` };
    }
    
    // Atualizar status da oferta
    tradeOffer.status = 'cancelled';
    tradeOffer.cancelledAt = Date.now();
    
    // Notificar o jogador destinatário
    this.game.notifyPlayer(tradeOffer.toPlayerId, {
      type: 'trade_cancelled',
      data: tradeOffer
    });
    
    return { 
      success: true, 
      message: "Oferta de comércio cancelada"
    };
  }
  
  getPlayerPendingOffers(playerId) {
    const pendingOffers = [];
    
    for (const offer of this.tradeOffers.values()) {
      if (offer.status === 'pending' && 
          (offer.toPlayerId === playerId || offer.fromPlayerId === playerId)) {
        pendingOffers.push(offer);
      }
    }
    
    return pendingOffers;
  }
  
  getPlayerTradeHistory(playerId) {
    return this.tradeHistory.get(playerId) || [];
  }
}

module.exports = TradeSystem; 