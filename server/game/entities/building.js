class Building {
  constructor(id, type, x, y, ownerId, props) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.ownerId = ownerId;
    
    // Propriedades
    this.maxHealth = props.maxHealth || 1000;
    this.health = this.maxHealth;
    this.size = props.size || 2;
    this.buildProgress = 0;
    this.buildTime = props.buildTime || 60; // Tempo em segundos
    this.isBuilt = props.buildTime === 0;
    this.canTrainUnits = props.canTrainUnits || false;
    this.populationIncrease = props.populationIncrease || 0;
    
    // Fila de treinamento
    this.trainingQueue = [];
    this.currentTrainingProgress = 0;
  }
  
  update(deltaTime, world, game) {
    // Se o edifício ainda está em construção
    if (!this.isBuilt) {
      return;
    }
    
    // Processar fila de treinamento
    if (this.trainingQueue.length > 0 && this.isBuilt) {
      const unitType = this.trainingQueue[0];
      
      // Tempos de treinamento em segundos
      const trainingTimes = {
        villager: 20,
        swordsman: 15,
        spearman: 12,
        archer: 18,
        crossbowman: 25,
        scout: 30,
        knight: 35
      };
      
      const trainingTime = trainingTimes[unitType] || 20;
      
      this.currentTrainingProgress += deltaTime;
      
      if (this.currentTrainingProgress >= trainingTime) {
        this.currentTrainingProgress = 0;
        this.trainingQueue.shift();
        
        // Criar a unidade
        const player = game.players.get(this.ownerId);
        if (player) {
          const spawnOffset = this.size * 10;
          
          // Encontrar uma posição válida para a unidade
          const unit = player.createUnit(
            unitType,
            this.x + spawnOffset,
            this.y + spawnOffset
          );
          
          world.addEntity(unit);
        }
      }
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      return true; // Edifício destruído
    }
    return false;
  }
  
  queueUnit(unitType) {
    if (this.canTrainUnits && this.isBuilt) {
      this.trainingQueue.push(unitType);
    }
  }
  
  getInfo() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      ownerId: this.ownerId,
      health: this.health,
      maxHealth: this.maxHealth,
      size: this.size,
      isBuilt: this.isBuilt,
      buildProgress: this.buildProgress,
      trainingQueue: this.trainingQueue,
      trainingProgress: this.currentTrainingProgress
    };
  }
}

module.exports = Building; 