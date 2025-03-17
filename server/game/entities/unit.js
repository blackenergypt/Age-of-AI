class Unit {
  constructor(id, type, x, y, ownerId, props) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.ownerId = ownerId;
    
    // Propriedades
    this.maxHealth = props.maxHealth || 100;
    this.health = this.maxHealth;
    this.speed = props.speed || 50; // Pixels por segundo
    this.attackDamage = props.attackDamage || 10;
    this.attackRange = props.attackRange || 10;
    this.attackSpeed = props.attackSpeed || 1; // Ataques por segundo
    this.attackCooldown = 0;
    
    // Capacidades
    this.canMove = true;
    this.canAttack = props.canAttack || false;
    this.canGather = props.canGather || false;
    this.canBuild = props.canBuild || false;
    
    // Estado atual
    this.currentAction = 'idle'; // idle, moving, attacking, gathering, building
    this.targetX = null;
    this.targetY = null;
    this.targetEntity = null;
    this.carryingResource = null;
    this.carryingAmount = 0;
    this.maxCarryAmount = 10;
    this.gatheringCooldown = 0;
    this.gatheringRate = 1; // Recursos por segundo
  }
  
  update(deltaTime, world, game) {
    // Atualizar cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    
    if (this.gatheringCooldown > 0) {
      this.gatheringCooldown -= deltaTime;
    }
    
    // Processar ação atual
    switch (this.currentAction) {
      case 'moving':
        this.updateMovement(deltaTime);
        break;
        
      case 'attacking':
        this.updateAttack(deltaTime, world, game);
        break;
        
      case 'gathering':
        this.updateGathering(deltaTime, world, game);
        break;
        
      case 'building':
        this.updateBuilding(deltaTime, world);
        break;
        
      case 'returning':
        this.updateReturning(deltaTime, world, game);
        break;
    }
  }
  
  updateMovement(deltaTime) {
    if (this.targetX === null || this.targetY === null) {
      this.currentAction = 'idle';
      return;
    }
    
    // Calcular direção e distância
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Se chegou ao destino
    if (distance < 5) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.targetX = null;
      this.targetY = null;
      this.currentAction = 'idle';
      return;
    }
    
    // Mover em direção ao alvo
    const moveDistance = this.speed * deltaTime;
    const ratio = moveDistance / distance;
    
    this.x += dx * ratio;
    this.y += dy * ratio;
  }
  
  updateAttack(deltaTime, world, game) {
    if (!this.targetEntity || !this.canAttack) {
      this.currentAction = 'idle';
      return;
    }
    
    // Verificar se o alvo ainda existe
    const target = world.getEntity(this.targetEntity.id);
    if (!target) {
      this.targetEntity = null;
      this.currentAction = 'idle';
      return;
    }
    
    // Calcular distância até o alvo
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Se estiver fora do alcance, mover-se em direção ao alvo
    if (distance > this.attackRange) {
      this.setTarget(target.x, target.y);
      this.currentAction = 'moving';
      return;
    }
    
    // Atacar se o cooldown permitir
    if (this.attackCooldown <= 0) {
      // Aplicar dano
      const destroyed = target.takeDamage(this.attackDamage);
      
      // Resetar cooldown
      this.attackCooldown = 1 / this.attackSpeed;
      
      // Se o alvo foi destruído
      if (destroyed) {
        world.removeEntity(target.id);
        this.targetEntity = null;
        this.currentAction = 'idle';
      }
    }
  }
  
  updateGathering(deltaTime, world, game) {
    if (!this.targetEntity || !this.canGather) {
      this.currentAction = 'idle';
      return;
    }
    
    // Verificar se o recurso ainda existe
    const resource = world.getEntity(this.targetEntity.id);
    if (!resource || resource.type !== 'resource') {
      this.targetEntity = null;
      this.currentAction = 'idle';
      return;
    }
    
    // Calcular distância até o recurso
    const dx = resource.x - this.x;
    const dy = resource.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Se estiver fora do alcance, mover-se em direção ao recurso
    if (distance > 20) {
      this.setTarget(resource.x, resource.y);
      this.currentAction = 'moving';
      return;
    }
    
    // Coletar recurso se o cooldown permitir
    if (this.gatheringCooldown <= 0) {
      // Se já estiver carregando recursos no máximo
      if (this.carryingAmount >= this.maxCarryAmount) {
        this.carryingResource = resource.resourceType;
        this.currentAction = 'returning';
        
        // Encontrar o edifício mais próximo para depositar recursos
        const townCenter = this.findNearestTownCenter(world);
        if (townCenter) {
          this.setTarget(townCenter.x, townCenter.y);
        }
        return;
      }
      
      // Coletar recurso
      const gathered = resource.gather(this.gatheringRate);
      this.carryingAmount += gathered;
      this.carryingResource = resource.resourceType;
      
      // Resetar cooldown
      this.gatheringCooldown = 1;
      
      // Se o recurso foi esgotado
      if (resource.isDepleted()) {
        world.removeEntity(resource.id);
        this.targetEntity = null;
        
        // Se estiver carregando recursos, retornar para depositar
        if (this.carryingAmount > 0) {
          this.currentAction = 'returning';
          
          // Encontrar o edifício mais próximo para depositar recursos
          const townCenter = this.findNearestTownCenter(world);
          if (townCenter) {
            this.setTarget(townCenter.x, townCenter.y);
          }
        } else {
          this.currentAction = 'idle';
        }
      }
    }
  }
  
  updateBuilding(deltaTime, world) {
    if (!this.targetEntity || !this.canBuild) {
      this.currentAction = 'idle';
      return;
    }
    
    // Verificar se o edifício ainda existe
    const building = world.getEntity(this.targetEntity.id);
    if (!building || building.isBuilt) {
      this.targetEntity = null;
      this.currentAction = 'idle';
      return;
    }
    
    // Calcular distância até o edifício
    const dx = building.x - this.x;
    const dy = building.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Se estiver fora do alcance, mover-se em direção ao edifício
    if (distance > 30) {
      this.setTarget(building.x, building.y);
      this.currentAction = 'moving';
      return;
    }
    
    // Construir o edifício
    building.buildProgress += deltaTime;
    
    // Se a construção foi concluída
    if (building.buildProgress >= building.buildTime) {
      building.isBuilt = true;
      this.targetEntity = null;
      this.currentAction = 'idle';
    }
  }
  
  updateReturning(deltaTime, world, game) {
    if (!this.carryingResource || this.carryingAmount <= 0) {
      this.currentAction = 'idle';
      return;
    }
    
    // Se chegou ao destino
    if (this.targetX === null || this.targetY === null) {
      // Depositar recursos
      const player = game.players.get(this.ownerId);
      if (player) {
        player.resources[this.carryingResource] += this.carryingAmount;
      }
      
      this.carryingAmount = 0;
      this.carryingResource = null;
      
      // Voltar para o recurso anterior se ainda existir
      if (this.targetEntity && world.getEntity(this.targetEntity.id)) {
        this.currentAction = 'gathering';
        this.setTarget(this.targetEntity.x, this.targetEntity.y);
      } else {
        this.currentAction = 'idle';
      }
      
      return;
    }
    
    // Continuar movendo-se em direção ao destino
    this.updateMovement(deltaTime);
  }
  
  findNearestTownCenter(world) {
    let nearestTownCenter = null;
    let minDistance = Infinity;
    
    for (const entity of world.entities.values()) {
      if (entity.type === 'town_center' && entity.ownerId === this.ownerId && entity.isBuilt) {
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestTownCenter = entity;
        }
      }
    }
    
    return nearestTownCenter;
  }
  
  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      return true; // Unidade destruída
    }
    return false;
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
      currentAction: this.currentAction,
      carryingResource: this.carryingResource,
      carryingAmount: this.carryingAmount
    };
  }
}

module.exports = Unit; 