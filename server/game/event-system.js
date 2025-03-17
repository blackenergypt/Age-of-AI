class EventSystem {
  constructor(game) {
    this.game = game;
    this.eventProbabilities = {
      // Eventos noturnos
      night: {
        wildAnimalAttack: 0.05, // 5% de chance por atualização
        treasureDiscovery: 0.02, // 2% de chance por atualização
        banditRaid: 0.03 // 3% de chance por atualização
      },
      // Eventos diurnos
      day: {
        merchantCaravan: 0.03, // 3% de chance por atualização
        resourceBonanza: 0.02, // 2% de chance por atualização
        wanderingHero: 0.01 // 1% de chance por atualização
      }
    };
  }
  
  // Processar eventos com base no tempo do dia
  processEvents(deltaTime) {
    const timeOfDay = this.game.world.getTimeOfDayInfo();
    const eventType = timeOfDay.isDayTime ? 'day' : 'night';
    const events = this.eventProbabilities[eventType];
    
    // Verificar cada tipo de evento
    for (const [eventName, probability] of Object.entries(events)) {
      // Calcular probabilidade ajustada com base no deltaTime
      const adjustedProbability = probability * (deltaTime / 1000);
      
      // Verificar se o evento ocorre
      if (Math.random() < adjustedProbability) {
        this.triggerEvent(eventName);
      }
    }
  }
  
  // Disparar um evento específico
  triggerEvent(eventName) {
    console.log(`Evento disparado: ${eventName}`);
    
    switch (eventName) {
      case 'wildAnimalAttack':
        this.handleWildAnimalAttack();
        break;
      case 'treasureDiscovery':
        this.triggerTreasureDiscovery();
        break;
      case 'banditRaid':
        this.triggerBanditRaid();
        break;
      case 'merchantCaravan':
        this.handleMerchantCaravan();
        break;
      case 'resourceBonanza':
        this.triggerResourceBonanza();
        break;
      case 'wanderingHero':
        this.triggerWanderingHero();
        break;
    }
  }
  
  // Implementações dos eventos específicos
  
  // Ataque de animais selvagens durante a noite
  handleWildAnimalAttack() {
    // Selecionar um jogador aleatório
    const players = Array.from(this.game.players.values());
    if (players.length === 0) return;
    
    const targetPlayer = players[Math.floor(Math.random() * players.length)];
    
    // Criar animais selvagens próximos a uma unidade aleatória do jogador
    // Implementação depende da lógica de spawn de entidades
    
    // Notificar o jogador
    this.game.notifyPlayer(targetPlayer.id, {
      type: 'event',
      data: {
        eventType: 'wildAnimalAttack',
        message: 'Animais selvagens estão atacando suas unidades!'
      }
    });
  }
  
  // Descoberta de tesouro durante a noite
  triggerTreasureDiscovery() {
    // Selecionar um jogador aleatório
    const players = Array.from(this.game.players.values());
    if (players.length === 0) return;
    
    const luckyPlayer = players[Math.floor(Math.random() * players.length)];
    
    // Determinar o tipo e quantidade de recurso
    const resourceTypes = ['food', 'wood', 'stone', 'gold'];
    const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    const amount = Math.floor(Math.random() * 100) + 50; // 50-150 recursos
    
    // Adicionar recursos ao jogador
    luckyPlayer.resources[resourceType] += amount;
    
    // Notificar o jogador
    this.game.notifyPlayer(luckyPlayer.id, {
      type: 'event',
      data: {
        eventType: 'treasureDiscovery',
        message: `Suas unidades descobriram um tesouro escondido! +${amount} ${resourceType}.`
      }
    });
  }
  
  // Ataque de bandidos durante a noite
  triggerBanditRaid() {
    // Selecionar um jogador aleatório
    const players = Array.from(this.game.players.values());
    if (players.length === 0) return;
    
    const targetPlayer = players[Math.floor(Math.random() * players.length)];
    
    // Determinar o recurso a ser roubado
    const resourceTypes = ['food', 'wood', 'stone', 'gold'];
    const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    
    // Calcular quantidade a ser roubada (10-20% dos recursos do jogador)
    const amount = Math.floor(targetPlayer.resources[resourceType] * (Math.random() * 0.1 + 0.1));
    
    if (amount > 0) {
      // Reduzir os recursos do jogador
      targetPlayer.resources[resourceType] -= amount;
      
      // Notificar o jogador
      this.game.notifyPlayer(targetPlayer.id, {
        type: 'event',
        data: {
          eventType: 'banditRaid',
          message: `Bandidos atacaram seu acampamento e roubaram ${amount} de ${resourceType}!`,
          resource: resourceType,
          amount: amount
        }
      });
    } else {
      // Se não houver recursos suficientes para roubar
      this.game.notifyPlayer(targetPlayer.id, {
        type: 'event',
        data: {
          eventType: 'banditRaid',
          message: `Bandidos tentaram atacar seu acampamento, mas foram repelidos!`
        }
      });
    }
  }
  
  // Bonança de recursos durante o dia
  triggerResourceBonanza() {
    // Selecionar um jogador aleatório
    const players = Array.from(this.game.players.values());
    if (players.length === 0) return;
    
    const luckyPlayer = players[Math.floor(Math.random() * players.length)];
    
    // Determinar o tipo de recurso
    const resourceTypes = ['food', 'wood', 'stone', 'gold'];
    const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    
    // Quantidade de bônus (100-300)
    const amount = Math.floor(Math.random() * 200) + 100;
    
    // Adicionar recursos ao jogador
    luckyPlayer.resources[resourceType] += amount;
    
    // Notificar o jogador
    this.game.notifyPlayer(luckyPlayer.id, {
      type: 'event',
      data: {
        eventType: 'resourceBonanza',
        message: `Uma grande quantidade de ${resourceType} foi descoberta em suas terras! +${amount} ${resourceType}.`,
        resource: resourceType,
        amount: amount
      }
    });
  }
  
  // Herói errante durante o dia
  triggerWanderingHero() {
    // Selecionar um jogador aleatório
    const players = Array.from(this.game.players.values());
    if (players.length === 0) return;
    
    const luckyPlayer = players[Math.floor(Math.random() * players.length)];
    
    // Tipos de bônus que o herói pode oferecer
    const bonusTypes = [
      { type: 'attack', amount: 0.05, description: 'ataque' },
      { type: 'defense', amount: 0.05, description: 'defesa' },
      { type: 'speed', amount: 0.05, description: 'velocidade' },
      { type: 'nightVision', amount: 1, description: 'visão noturna' }
    ];
    
    // Escolher um bônus aleatório
    const bonus = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
    
    // Aplicar o bônus
    if (bonus.type === 'nightVision') {
      luckyPlayer.nightVisionBonus += bonus.amount;
    } else {
      luckyPlayer.combatBonuses[bonus.type] += bonus.amount;
    }
    
    // Notificar o jogador
    this.game.notifyPlayer(luckyPlayer.id, {
      type: 'event',
      data: {
        eventType: 'wanderingHero',
        message: `Um herói errante se juntou ao seu reino! +${bonus.amount * 100}% de ${bonus.description}.`,
        bonusType: bonus.type,
        bonusAmount: bonus.amount
      }
    });
  }
  
  // Caravana de mercadores durante o dia
  handleMerchantCaravan() {
    // Selecionar um jogador aleatório
    const players = Array.from(this.game.players.values());
    if (players.length === 0) return;
    
    const targetPlayer = players[Math.floor(Math.random() * players.length)];
    
    // Oferecer negócios especiais temporários
    const specialDeals = [
      { give: { wood: 100 }, receive: { gold: 75 } },
      { give: { food: 100 }, receive: { gold: 50 } },
      { give: { stone: 50 }, receive: { gold: 100 } },
      { give: { gold: 50 }, receive: { food: 150 } }
    ];
    
    const deal = specialDeals[Math.floor(Math.random() * specialDeals.length)];
    
    // Notificar o jogador
    this.game.notifyPlayer(targetPlayer.id, {
      type: 'event',
      data: {
        eventType: 'merchantCaravan',
        message: 'Uma caravana de mercadores está oferecendo negócios especiais!',
        deal: deal
      }
    });
  }
}

module.exports = EventSystem; 