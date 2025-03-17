const Resource = require('./entities/resource');
const { v4: uuidv4 } = require('uuid');
const { createNoise2D } = require('simplex-noise');
import * as THREE from 'three';

class World {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.entities = new Map();
    this.resources = new Map();
    this.terrainGrid = [];
    this.biomes = new Map();
    
    // Inicializar o gerador de ruído
    this.noise2D = createNoise2D(() => 42); // Seed fixa para consistência
    
    // Configurações do ciclo dia/noite
    this.timeOfDay = {
      hour: new Date().getHours(),
      minute: new Date().getMinutes(),
      isDayTime: this.isDayTime(),
      sunPosition: 0, // 0 a 1, onde 0 é meia-noite e 0.5 é meio-dia
      lightLevel: 0, // 0 a 1, onde 0 é escuro e 1 é claro
      timeScale: 1 // 1 = tempo real, 2 = 2x mais rápido, etc.
    };
    
    // Add new systems
    this.weather = {
      type: 'clear',
      intensity: 0,
      duration: 0,
      effects: {}
    };
    
    this.temperature = {
      base: 20, // Base temperature in Celsius
      current: 20,
      variation: 0
    };
    
    this.events = new Map();
    this.resourceRegenerationTimers = new Map();
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    this.initializeSystems();
    
    this.generateTerrain();
    this.generateBiomes();
    this.distributeResources();
    this.updateTimeOfDay();
    this.initializeResources();
    this.initMap();
  }
  
  initializeSystems() {
    this.initializeWeather();
    this.initializeTemperature();
    this.setupResourceRegeneration();
  }

  initializeWeather() {
    const weatherTypes = {
      clear: {
        resourceMultiplier: 1,
        movementMultiplier: 1
      },
      rain: {
        resourceMultiplier: 0.8,
        movementMultiplier: 0.9,
        effects: {
          moisture: 0.2
        }
      },
      storm: {
        resourceMultiplier: 0.6,
        movementMultiplier: 0.7,
        effects: {
          moisture: 0.4,
          damage: 1
        }
      },
      drought: {
        resourceMultiplier: 0.5,
        movementMultiplier: 1,
        effects: {
          moisture: -0.3
        }
      }
    };

    this.weatherTypes = weatherTypes;
  }

  initializeTemperature() {
    // Calculate base temperature based on latitude (y position)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const latitude = (y / this.height) * 180 - 90;
        const baseTemp = 30 * Math.cos(latitude * Math.PI / 180);
        if (this.terrainGrid[y] && this.terrainGrid[y][x]) {
          this.terrainGrid[y][x].temperature = baseTemp;
        }
      }
    }
  }

  setupResourceRegeneration() {
    const regenerationRules = {
      wood: {
        rate: 10,
        interval: 300, // 5 minutes
        conditions: (tile) => tile.biomeType === 'forest' || tile.biomeType === 'highland_forest'
      },
      berries: {
        rate: 5,
        interval: 180,
        conditions: (tile) => tile.biomeType === 'forest' || tile.biomeType === 'plains'
      },
      game: {
        rate: 8,
        interval: 240,
        conditions: (tile) => tile.biomeType !== 'ocean' && tile.biomeType !== 'desert'
      }
    };

    this.regenerationRules = regenerationRules;
  }

  generateTerrain() {
    // Criar grid de terreno
    this.terrainGrid = new Array(this.height);
    for (let y = 0; y < this.height; y++) {
      this.terrainGrid[y] = new Array(this.width);
      for (let x = 0; x < this.width; x++) {
        // Valor base de elevação usando ruído Perlin
        const elevation = this.generatePerlinNoise(x, y, 0.005);
        this.terrainGrid[y][x] = {
          elevation,
          moisture: 0, // Será definido na geração de biomas
          biomeType: null, // Será definido na geração de biomas
          passable: elevation > 0.2, // Água é impassável
        };
      }
    }
  }
  
  generateBiomes() {
    // Gerar mapa de umidade usando ruído Perlin
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const moisture = this.generatePerlinNoise(x, y, 0.003, 42); // Seed diferente
        this.terrainGrid[y][x].moisture = moisture;
        
        // Determinar bioma com base na elevação e umidade
        const elevation = this.terrainGrid[y][x].elevation;
        const biomeType = this.determineBiomeType(elevation, moisture);
        this.terrainGrid[y][x].biomeType = biomeType;
        
        // Registrar área do bioma para referência
        if (!this.biomes.has(biomeType)) {
          this.biomes.set(biomeType, []);
        }
        this.biomes.get(biomeType).push({x, y});
      }
    }
  }
  
  determineBiomeType(elevation, moisture) {
    // Determinar o tipo de bioma com base na elevação e umidade
    if (elevation < 0.2) return 'ocean';
    if (elevation < 0.3) return 'beach';
    
    if (elevation > 0.8) {
      if (moisture > 0.6) return 'snow_mountain';
      return 'mountain';
    }
    
    if (elevation > 0.6) {
      if (moisture > 0.7) return 'highland_forest';
      if (moisture > 0.4) return 'hills';
      return 'rocky_hills';
    }
    
    if (moisture > 0.8) return 'swamp';
    if (moisture > 0.6) return 'forest';
    if (moisture > 0.4) return 'plains';
    if (moisture > 0.2) return 'savanna';
    return 'desert';
  }
  
  distributeResources() {
    // Distribuir recursos com base nos biomas
    const biomeResources = {
      ocean: ['fish', 'pearls', 'salt'],
      beach: ['salt', 'clay', 'coconut'],
      forest: ['wood', 'berries', 'game', 'herbs'],
      highland_forest: ['wood', 'game', 'rare_herbs'],
      plains: ['food', 'cattle', 'horses'],
      savanna: ['food', 'exotic_wood', 'game'],
      desert: ['gold', 'gems', 'stone'],
      mountain: ['stone', 'iron', 'coal'],
      snow_mountain: ['silver', 'gems', 'fur'],
      swamp: ['herbs', 'rare_herbs', 'clay'],
      hills: ['stone', 'iron', 'clay'],
      rocky_hills: ['stone', 'gold', 'gems']
    };
    
    // Para cada bioma, adicionar recursos apropriados
    for (const [biomeType, locations] of this.biomes.entries()) {
      if (!biomeResources[biomeType]) continue;
      
      const resourceTypes = biomeResources[biomeType];
      const resourceCount = Math.floor(locations.length * 0.05); // 5% das células têm recursos
      
      for (let i = 0; i < resourceCount; i++) {
        // Escolher uma localização aleatória dentro do bioma
        const locationIndex = Math.floor(Math.random() * locations.length);
        const location = locations[locationIndex];
        
        // Escolher um tipo de recurso aleatório para este bioma
        const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        
        // Criar o recurso
        this.addResourceAt(location.x, location.y, resourceType);
      }
    }
  }
  
  addResourceAt(x, y, type) {
    const resourceId = uuidv4();
    const resourceProps = this.getResourceProperties(type);
    
    const resource = new Resource(
      resourceId,
      x,
      y,
      type,
      resourceProps.amount,
      resourceProps.harvestRate
    );
    
    this.resources.set(resourceId, resource);
    return resource;
  }
  
  addResource(resource) {
    this.resources.set(resource.id, resource);
    return resource;
  }
  
  getResourceProperties(type) {
    // Definir propriedades para diferentes tipos de recursos
    const resourceProps = {
      wood: { amount: 500, harvestRate: 10 },
      food: { amount: 500, harvestRate: 12 },
      stone: { amount: 400, harvestRate: 8 },
      gold: { amount: 300, harvestRate: 5 },
      iron: { amount: 350, harvestRate: 7 },
      coal: { amount: 400, harvestRate: 8 },
      fish: { amount: 450, harvestRate: 10 },
      pearls: { amount: 200, harvestRate: 3 },
      salt: { amount: 350, harvestRate: 7 },
      clay: { amount: 400, harvestRate: 8 },
      berries: { amount: 300, harvestRate: 15 },
      game: { amount: 350, harvestRate: 8 },
      cattle: { amount: 300, harvestRate: 7 },
      horses: { amount: 250, harvestRate: 5 },
      coconut: { amount: 300, harvestRate: 8 },
      fruits: { amount: 400, harvestRate: 10 },
      herbs: { amount: 300, harvestRate: 6 },
      exotic_wood: { amount: 350, harvestRate: 5 },
      fur: { amount: 300, harvestRate: 6 },
      gems: { amount: 200, harvestRate: 3 },
      silver: { amount: 250, harvestRate: 4 },
      rare_herbs: { amount: 200, harvestRate: 3 }
    };
    
    return resourceProps[type] || { amount: 300, harvestRate: 5 };
  }
  
  // Método para gerar ruído Perlin
  generatePerlinNoise(x, y, scale, seed = 42) {
    // Usar o gerador de ruído já inicializado
    return (this.noise2D(x * scale, y * scale) + 1) / 2; // Normalizar para 0-1
  }
  
  // Método para obter dados de terreno para o cliente
  getTerrainData() {
    // Versão simplificada para enviar ao cliente
    const terrainData = [];
    
    // Reduzir a resolução para economizar largura de banda
    const sampleRate = 4; // Amostra a cada 4 células
    
    for (let y = 0; y < this.height; y += sampleRate) {
      const row = [];
      for (let x = 0; x < this.width; x += sampleRate) {
        if (this.terrainGrid[y] && this.terrainGrid[y][x]) {
          row.push({
            biomeType: this.terrainGrid[y][x].biomeType,
            passable: this.terrainGrid[y][x].passable,
            x,
            y
          });
        }
      }
      terrainData.push(row);
    }
    
    return terrainData;
  }
  
  // Método para verificar se um jogador tem acesso a um tipo de recurso
  playerHasAccessToResource(playerId, resourceType) {
    // Verificar se o jogador tem recursos desse tipo em seu território
    for (const resource of this.resources.values()) {
      if (resource.type === resourceType) {
        // Verificar se o recurso está no território do jogador
        // Isso requer implementação de territórios, que pode ser feita depois
        const nearbyBuildings = this.getNearbyBuildings(resource.x, resource.y, 300);
        for (const building of nearbyBuildings) {
          if (building.ownerId === playerId) {
            return true;
          }
        }
      }
    }
    return false;
  }
  
  getNearbyBuildings(x, y, radius) {
    // Implementação temporária - será expandida mais tarde
    const buildings = [];
    for (const entity of this.entities.values()) {
      if (entity.type === 'building') {
        const distance = Math.sqrt(Math.pow(entity.x - x, 2) + Math.pow(entity.y - y, 2));
        if (distance <= radius) {
          buildings.push(entity);
        }
      }
    }
    return buildings;
  }
  
  getRandomStartPosition() {
    // Encontrar uma posição inicial adequada (em terra, não em água)
    let x, y;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      x = Math.floor(Math.random() * this.width);
      y = Math.floor(Math.random() * this.height);
      attempts++;
      
      // Verificar se a posição é passável (não é água)
      if (this.terrainGrid[y] && this.terrainGrid[y][x] && this.terrainGrid[y][x].passable) {
        return { x, y };
      }
    } while (attempts < maxAttempts);
    
    // Fallback se não encontrar uma posição adequada
    return { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) };
  }
  
  getVisibleEntities() {
    // Simplificado: retorna todas as entidades
    // Em um jogo real, você implementaria fog of war aqui
    return Array.from(this.entities.values());
  }
  
  getResources() {
    // Retorna todos os recursos visíveis
    return Array.from(this.resources.values());
  }
  
  update(deltaTime, game) {
    // Atualizar o tempo do dia a cada segundo
    this.timeElapsed = (this.timeElapsed || 0) + deltaTime;
    if (this.timeElapsed >= 1) { // Atualizar a cada segundo
      this.timeElapsed = 0;
      this.updateTimeOfDay();
    }
    
    // Atualizar todas as entidades
    for (const entity of this.entities.values()) {
      if (entity.update) {
        entity.update(deltaTime, game, this);
      }
    }
    
    // Verificar recursos esgotados
    for (const [resourceId, resource] of this.resources.entries()) {
      if (resource.amount <= 0) {
        this.resources.delete(resourceId);
      }
    }
    
    // Eventos baseados no tempo do dia
    this.processTimeBasedEvents(deltaTime);
    
    this.updateWeather(deltaTime);
    this.regenerateResources(deltaTime);
    this.processEvents(deltaTime);
  }
  
  updateWeather(deltaTime) {
    this.weather.duration -= deltaTime;

    if (this.weather.duration <= 0) {
      this.generateNewWeather();
    }

    this.applyWeatherEffects(deltaTime);
  }

  generateNewWeather() {
    const weatherTypes = Object.keys(this.weatherTypes);
    const newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    
    this.weather = {
      type: newWeather,
      intensity: Math.random() * 0.5 + 0.5,
      duration: Math.random() * 600 + 300, // 5-15 minutes
      effects: this.weatherTypes[newWeather].effects || {}
    };
  }

  applyWeatherEffects(deltaTime) {
    // Apply weather effects to terrain and resources
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.terrainGrid[y][x];
        if (this.weather.effects.moisture) {
          tile.moisture = Math.max(0, Math.min(1, 
            tile.moisture + this.weather.effects.moisture * deltaTime * this.weather.intensity
          ));
        }
      }
    }

    // Apply weather damage if any
    if (this.weather.effects.damage) {
      this.applyWeatherDamage(deltaTime);
    }
  }

  applyWeatherDamage(deltaTime) {
    for (const entity of this.entities.values()) {
      if (entity.health && !entity.weatherProof) {
        entity.health -= this.weather.effects.damage * deltaTime * this.weather.intensity;
        if (entity.health <= 0) {
          this.removeEntity(entity.id);
        }
      }
    }
  }

  regenerateResources(deltaTime) {
    for (const [resourceId, timer] of this.resourceRegenerationTimers) {
      timer.time += deltaTime;
      
      const resource = this.resources.get(resourceId);
      if (!resource) {
        this.resourceRegenerationTimers.delete(resourceId);
        continue;
      }

      const rule = this.regenerationRules[resource.type];
      if (!rule) continue;

      if (timer.time >= rule.interval) {
        timer.time = 0;
        
        const tile = this.terrainGrid[resource.y][resource.x];
        if (rule.conditions(tile)) {
          resource.amount = Math.min(
            resource.amount + rule.rate,
            this.getResourceProperties(resource.type).amount
          );
        }
      }
    }
  }

  processEvents(deltaTime) {
    for (const [eventId, event] of this.events) {
      event.duration -= deltaTime;
      
      if (event.duration <= 0) {
        this.resolveEvent(event);
        this.events.delete(eventId);
      }
    }
  }

  resolveEvent(event) {
    switch (event.type) {
      case 'migration':
        this.spawnMigratingAnimals(event);
        break;
      case 'disaster':
        this.resolvePendingDisaster(event);
        break;
      case 'discovery':
        this.resolveDiscovery(event);
        break;
    }
  }

  // Métodos para manipulação de entidades
  addEntity(entity) {
    this.entities.set(entity.id, entity);
    return entity;
  }

  removeEntity(entityId) {
    this.entities.delete(entityId);
  }

  removeEntitiesByOwner(ownerId) {
    for (const [entityId, entity] of this.entities.entries()) {
      if (entity.ownerId === ownerId) {
        this.entities.delete(entityId);
      }
    }
  }

  getEntity(entityId) {
    return this.entities.get(entityId);
  }

  // Métodos para manipulação de recursos
  getResource(resourceId) {
    return this.resources.get(resourceId);
  }

  // Métodos para ações do jogo
  moveUnits(unitIds, targetX, targetY, playerId) {
    // Implementação básica de movimento
    for (const unitId of unitIds) {
      const unit = this.getEntity(unitId);
      if (unit && unit.ownerId === playerId) {
        unit.targetX = targetX;
        unit.targetY = targetY;
        unit.state = 'moving';
      }
    }
  }

  gatherResource(unitIds, resourceId, playerId) {
    const resource = this.getResource(resourceId);
    if (!resource) return;
    
    for (const unitId of unitIds) {
      const unit = this.getEntity(unitId);
      if (unit && unit.ownerId === playerId && unit.type === 'villager') {
        unit.targetX = resource.x;
        unit.targetY = resource.y;
        unit.state = 'gathering';
        unit.gatheringResourceId = resourceId;
      }
    }
  }

  buildStructure(unitIds, buildingType, x, y, playerId, player) {
    // Verificar se o jogador tem recursos suficientes
    const buildingCosts = {
      'house': { wood: 30 },
      'barracks': { wood: 150, stone: 50 },
      'farm': { wood: 60 },
      'mine': { wood: 100 },
      'tower': { stone: 150, wood: 50 }
    };
    
    const cost = buildingCosts[buildingType];
    if (!cost) return;
    
    // Verificar se o jogador tem recursos suficientes
    for (const [resource, amount] of Object.entries(cost)) {
      if (!player.resources[resource] || player.resources[resource] < amount) {
        return;
      }
    }
    
    // Deduzir os recursos
    for (const [resource, amount] of Object.entries(cost)) {
      player.resources[resource] -= amount;
    }
    
    // Enviar unidades para construir
    for (const unitId of unitIds) {
      const unit = this.getEntity(unitId);
      if (unit && unit.ownerId === playerId && unit.type === 'villager') {
        unit.targetX = x;
        unit.targetY = y;
        unit.state = 'building';
        unit.buildingType = buildingType;
      }
    }
  }

  trainUnit(buildingId, unitType, playerId, player) {
    const building = this.getEntity(buildingId);
    if (!building || building.ownerId !== playerId) return;
    
    // Verificar se o edifício pode treinar esse tipo de unidade
    const canTrain = {
      'town_center': ['villager'],
      'barracks': ['warrior', 'archer'],
      'stable': ['cavalry']
    };
    
    if (!canTrain[building.type] || !canTrain[building.type].includes(unitType)) {
      return;
    }
    
    // Verificar custos
    const unitCosts = {
      'villager': { food: 50 },
      'warrior': { food: 60, gold: 20 },
      'archer': { food: 40, wood: 30, gold: 10 },
      'cavalry': { food: 80, gold: 40 }
    };
    
    const cost = unitCosts[unitType];
    
    // Verificar se o jogador tem recursos suficientes
    for (const [resource, amount] of Object.entries(cost)) {
      if (!player.resources[resource] || player.resources[resource] < amount) {
        return;
      }
    }
    
    // Deduzir os recursos
    for (const [resource, amount] of Object.entries(cost)) {
      player.resources[resource] -= amount;
    }
    
    // Adicionar unidade à fila de treinamento do edifício
    if (!building.trainingQueue) {
      building.trainingQueue = [];
    }
    
    building.trainingQueue.push({
      unitType,
      progress: 0,
      timeRequired: 5 // 5 segundos para treinar
    });
  }

  attackEntity(unitIds, targetId, playerId) {
    const target = this.getEntity(targetId);
    if (!target) return;
    
    for (const unitId of unitIds) {
      const unit = this.getEntity(unitId);
      if (unit && unit.ownerId === playerId && unit.canAttack) {
        unit.targetX = target.x;
        unit.targetY = target.y;
        unit.state = 'attacking';
        unit.attackTargetId = targetId;
      }
    }
  }

  // Adicionar método para verificar se é dia
  isDayTime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18; // Dia entre 6h e 18h
  }

  // Adicionar método para atualizar o tempo do dia
  updateTimeOfDay() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Calcular posição do sol (0 = meia-noite, 0.5 = meio-dia, 1 = meia-noite)
    // Convertendo 24 horas para um valor entre 0 e 1
    const hourDecimal = hour + minute / 60;
    const sunPosition = (hourDecimal % 24) / 24;
    
    // Calcular nível de luz
    // Mais brilhante ao meio-dia (0.5), mais escuro à meia-noite (0 ou 1)
    let lightLevel;
    if (sunPosition <= 0.5) {
      // Manhã: aumenta de 0.1 (meia-noite) até 1.0 (meio-dia)
      lightLevel = 0.1 + (sunPosition * 1.8);
    } else {
      // Tarde/noite: diminui de 1.0 (meio-dia) até 0.1 (meia-noite)
      lightLevel = 0.1 + ((1 - sunPosition) * 1.8);
    }
    
    // Limitar entre 0.1 e 1
    lightLevel = Math.max(0.1, Math.min(1, lightLevel));
    
    this.timeOfDay = {
      hour,
      minute,
      isDayTime: this.isDayTime(),
      sunPosition,
      lightLevel,
      timeScale: 1
    };
    
    // Aplicar efeitos do tempo do dia
    this.applyTimeOfDayEffects();
  }

  // Adicionar método para aplicar efeitos baseados no tempo do dia
  applyTimeOfDayEffects() {
    // Modificar taxas de coleta baseadas no tempo do dia
    const harvestMultiplier = this.timeOfDay.isDayTime ? 1.0 : 0.7;
    
    // Modificar visibilidade baseada no tempo do dia
    const visibilityRange = Math.floor(300 * this.timeOfDay.lightLevel);
    
    // Atualizar propriedades de entidades baseadas no tempo
    for (const entity of this.entities.values()) {
      if (entity.type === 'unit') {
        // Unidades se movem mais devagar à noite
        entity.moveSpeed = entity.baseMoveSpeed * (this.timeOfDay.isDayTime ? 1.0 : 0.8);
        
        // Unidades têm menor alcance de visão à noite
        entity.visionRange = entity.baseVisionRange * this.timeOfDay.lightLevel;
      }
    }
  }

  // Adicionar método para processar eventos baseados no tempo
  processTimeBasedEvents(deltaTime) {
    // Hora do amanhecer (6h)
    if (this.timeOfDay.hour === 6 && this.timeOfDay.minute === 0) {
      this.onDayBreak();
    }
    
    // Hora do anoitecer (18h)
    if (this.timeOfDay.hour === 18 && this.timeOfDay.minute === 0) {
      this.onNightFall();
    }
    
    // Eventos aleatórios baseados no tempo
    // Por exemplo, mais chance de ataques de criaturas à noite
    if (!this.timeOfDay.isDayTime) {
      this.processNightEvents(deltaTime);
    }
  }

  // Eventos que ocorrem ao amanhecer
  onDayBreak() {
    // Notificar jogadores sobre o amanhecer
    // Restaurar taxas normais de coleta
    // Encerrar eventos noturnos
  }

  // Eventos que ocorrem ao anoitecer
  onNightFall() {
    // Notificar jogadores sobre o anoitecer
    // Reduzir taxas de coleta
    // Iniciar eventos noturnos
  }

  // Processar eventos noturnos
  processNightEvents(deltaTime) {
    // Chance de eventos aleatórios como ataques de criaturas selvagens
    // Bônus para certos tipos de recursos (ex: caça noturna)
  }

  // Adicionar método para obter informações do tempo
  getTimeOfDayInfo() {
    return {
      hour: this.timeOfDay.hour,
      minute: this.timeOfDay.minute,
      isDayTime: this.timeOfDay.isDayTime,
      sunPosition: this.timeOfDay.sunPosition,
      lightLevel: this.timeOfDay.lightLevel
    };
  }

  // Add getters for new systems
  getWeatherInfo() {
    return {
      type: this.weather.type,
      intensity: this.weather.intensity,
      duration: this.weather.duration
    };
  }

  getTemperatureAt(x, y) {
    return this.terrainGrid[y][x].temperature;
  }

  initializeResources() {
    // Adicionar recursos ao mundo
    for (let i = 0; i < 10; i++) {
      const resource = new Resource(uuidv4(), Math.random() * this.width, Math.random() * this.height, 'wood', 100, 1);
      this.resources.set(resource.id, resource);
    }
    // Adicione mais recursos conforme necessário
  }

  initMap() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    this.scene.add(plane);

    this.camera.position.z = 50;

    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}

module.exports = World;