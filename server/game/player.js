const Building = require('./entities/building');
const Unit = require('./entities/unit');
const { v4: uuidv4 } = require('uuid');

class Player {
  constructor(id, name, startPosition) {
    this.id = id;
    this.name = name;
    this.startPosition = startPosition;
    this.resources = {
      food: 200,
      wood: 0,
      stone: 0,
      gold: 0
    };
    this.color = this.generateRandomColor();
    this.population = 0;
    this.populationCap = 5; // Começa com limite de 5 unidades
    this.kingdomId = null;
    this.isKingdomLeader = false;
    
    // Novas propriedades para mecânicas avançadas
    this.age = 'initial'; // Era inicial
    this.researched = []; // Tecnologias pesquisadas
    this.availableTechnologies = ['woodcutting', 'farming']; // Tecnologias disponíveis
    this.availableUnits = ['villager']; // Unidades disponíveis
    this.availableBuildings = ['town_center', 'house']; // Edifícios disponíveis
    
    // Taxas de coleta (modificadas por tecnologias)
    this.gatheringRates = {
      food: 1.0,
      wood: 1.0,
      stone: 1.0,
      gold: 1.0
    };
    
    // Bônus de combate (modificados por tecnologias)
    this.combatBonuses = {
      attack: 0,
      defense: 0,
      range: 0,
      speed: 0
    };
    
    // Visibilidade (afetada pelo ciclo dia/noite)
    this.visibilityRange = 10; // Unidades de distância
    this.nightVisionBonus = 0; // Bônus de visão noturna
  }
  
  generateRandomColor() {
    const colors = [
      '#FF0000', // Vermelho
      '#0000FF', // Azul
      '#00FF00', // Verde
      '#FFFF00', // Amarelo
      '#FF00FF', // Magenta
      '#00FFFF', // Ciano
      '#FFA500', // Laranja
      '#800080'  // Roxo
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  update(deltaTime, game) {
    // Lógica de atualização específica do jogador
    // Por exemplo, verificar condições de vitória/derrota
  }
  
  createTownCenter() {
    return new Building(
      `building_${uuidv4()}`,
      'town_center',
      this.startPosition.x,
      this.startPosition.y,
      this.id,
      {
        maxHealth: 2000,
        size: 4,
        buildTime: 0, // Já construído inicialmente
        canTrainUnits: true
      }
    );
  }
  
  createVillager() {
    this.population += 1;
    
    return new Unit(
      `unit_${uuidv4()}`,
      'villager',
      this.startPosition.x + (Math.random() * 40 - 20),
      this.startPosition.y + (Math.random() * 40 - 20),
      this.id,
      {
        maxHealth: 25,
        speed: 60,
        attackDamage: 3,
        attackRange: 0,
        attackSpeed: 1.5,
        canGather: true,
        canBuild: true,
        canAttack: true
      }
    );
  }
  
  createBuilding(type, x, y) {
    const buildingProps = {
      house: {
        maxHealth: 500,
        size: 2,
        buildTime: 30,
        canTrainUnits: false,
        populationIncrease: 5
      },
      barracks: {
        maxHealth: 1000,
        size: 3,
        buildTime: 50,
        canTrainUnits: true
      },
      archery_range: {
        maxHealth: 900,
        size: 3,
        buildTime: 45,
        canTrainUnits: true
      },
      stable: {
        maxHealth: 1000,
        size: 3,
        buildTime: 50,
        canTrainUnits: true
      }
    };
    
    const props = buildingProps[type];
    
    if (type === 'house') {
      this.populationCap += props.populationIncrease;
    }
    
    return new Building(
      `building_${uuidv4()}`,
      type,
      x,
      y,
      this.id,
      props
    );
  }
  
  createUnit(type, x, y) {
    // Verificar se atingiu o limite de população
    if (this.population >= this.populationCap) {
      return null;
    }
    
    this.population += 1;
    
    const unitProps = {
      villager: {
        maxHealth: 25,
        speed: 60,
        attackDamage: 3,
        attackRange: 0,
        attackSpeed: 1.5,
        canGather: true,
        canBuild: true,
        canAttack: true
      },
      swordsman: {
        maxHealth: 60,
        speed: 50,
        attackDamage: 12,
        attackRange: 5,
        attackSpeed: 1.2,
        canGather: false,
        canBuild: false,
        canAttack: true
      },
      spearman: {
        maxHealth: 45,
        speed: 55,
        attackDamage: 8,
        attackRange: 10,
        attackSpeed: 1.5,
        canGather: false,
        canBuild: false,
        canAttack: true
      },
      archer: {
        maxHealth: 35,
        speed: 60,
        attackDamage: 7,
        attackRange: 60,
        attackSpeed: 1.0,
        canGather: false,
        canBuild: false,
        canAttack: true
      },
      crossbowman: {
        maxHealth: 40,
        speed: 50,
        attackDamage: 10,
        attackRange: 70,
        attackSpeed: 0.8,
        canGather: false,
        canBuild: false,
        canAttack: true
      },
      scout: {
        maxHealth: 55,
        speed: 90,
        attackDamage: 5,
        attackRange: 5,
        attackSpeed: 1.5,
        canGather: false,
        canBuild: false,
        canAttack: true
      },
      knight: {
        maxHealth: 120,
        speed: 70,
        attackDamage: 15,
        attackRange: 5,
        attackSpeed: 1.0,
        canGather: false,
        canBuild: false,
        canAttack: true
      }
    };
    
    const props = unitProps[type] || unitProps.villager;
    
    return new Unit(
      `unit_${uuidv4()}`,
      type,
      x,
      y,
      this.id,
      props
    );
  }
  
  // Método para ajustar a visibilidade com base no ciclo dia/noite
  updateVisibility(timeOfDay) {
    const baseVisibility = 10;
    
    if (timeOfDay.isDayTime) {
      this.visibilityRange = baseVisibility;
    } else {
      // Reduzir visibilidade à noite, mas aplicar bônus de visão noturna
      this.visibilityRange = Math.max(5, baseVisibility * 0.6 + this.nightVisionBonus);
    }
  }
  
  // Método para ajustar taxas de coleta com base no ciclo dia/noite
  updateGatheringRates(timeOfDay) {
    // Cópias das taxas base (já modificadas por tecnologias)
    const baseRates = { ...this.gatheringRates };
    
    if (!timeOfDay.isDayTime) {
      // Reduzir taxas de coleta à noite
      this.gatheringRates.food = baseRates.food * 0.8;
      this.gatheringRates.wood = baseRates.wood * 0.7;
      this.gatheringRates.stone = baseRates.stone * 0.7;
      // O ouro não é tão afetado pela escuridão
      this.gatheringRates.gold = baseRates.gold * 0.9;
    } else {
      // Restaurar taxas normais durante o dia
      this.gatheringRates = { ...baseRates };
    }
  }
  
  // Método para verificar se um edifício pode ser construído
  canBuildStructure(type) {
    return this.availableBuildings.includes(type);
  }
  
  // Método para verificar se uma unidade pode ser treinada
  canTrainUnit(type) {
    return this.availableUnits.includes(type);
  }
  
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      resources: this.resources,
      population: this.population,
      populationCap: this.populationCap,
      kingdomId: this.kingdomId,
      isKingdomLeader: this.isKingdomLeader,
      age: this.age,
      researched: this.researched,
      availableTechnologies: this.availableTechnologies,
      availableUnits: this.availableUnits,
      availableBuildings: this.availableBuildings
    };
  }

  collectResource(resource) {
    if (resource.amount > 0) {
      const collectedAmount = resource.harvest(10); // Coletar 10 unidades
      this.resources[resource.type] += collectedAmount;
      console.log(`${this.name} coletou ${collectedAmount} de ${resource.type}.`);
    }
  }

  buildHouse() {
    const cost = { wood: 50, stone: 20 }; // Custo para construir uma casa
    if (this.canAfford(cost)) {
      this.resources.wood -= cost.wood;
      this.resources.stone -= cost.stone;
      console.log(`${this.name} construiu uma casa!`);
      // Adicione lógica para adicionar a casa ao mundo
    } else {
      console.log(`${this.name} não tem recursos suficientes para construir uma casa.`);
    }
  }

  buildHouseAt(x, y) {
    const cost = { wood: 50, stone: 20 }; // Custo para construir uma casa
    if (this.canAfford(cost)) {
        this.resources.wood -= cost.wood;
        this.resources.stone -= cost.stone;
        console.log(`${this.name} construiu uma casa em (${x}, ${y})!`);
        // Adicione lógica para adicionar a casa ao mundo na posição (x, y)
    } else {
        console.log(`${this.name} não tem recursos suficientes para construir uma casa.`);
    }
  }

  canAfford(cost) {
    return this.resources.wood >= cost.wood && this.resources.stone >= cost.stone;
  }
}

module.exports = Player; 