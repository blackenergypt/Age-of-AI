const Resource = require('./entities/resource');
const { v4: uuidv4 } = require('uuid');
const { createNoise2D } = require('simplex-noise');
// const THREE = require('three'); // Comentado para evitar erro no servidor
const BiomeSystem = require('./world/biomes');
const TerrainSystem = require('./world/terrain');
const WeatherSystem = require('./world/weather');
const ResourceSystem = require('./world/resources');

class World {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.entities = new Map();
    this.resources = new Map();
    this.terrainGrid = [];
    this.biomes = new Map();
    
    // Inicializar subsistemas
    this.biomeSystem = new BiomeSystem();
    this.terrainSystem = new TerrainSystem();
    this.weatherSystem = new WeatherSystem();
    this.resourceSystem = new ResourceSystem();
    
    // Gerar mundo
    this.terrainGrid = this.terrainSystem.generateTerrain(width, height);
    this.terrainGrid = this.biomeSystem.generateBiomes(this.terrainGrid, width, height);
    this.resourceSystem.distributeResources(this.biomeSystem.biomes, this.terrainGrid);
    
    // Configurar Three.js apenas no cliente
    // this.initializeThreeJS(); // Comentado para evitar erro no servidor
    
    // Inicializar sistema de tempo do jogo
    this.initTimeSystem();
  }
  
  // Inicialização do sistema de tempo do jogo
  initTimeSystem() {
    // Configuração do ciclo dia/noite
    this.dayDuration = 20 * 60 * 1000; // 20 minutos por dia de jogo
    this.dayStartTime = Date.now();
    this.currentTime = 0; // Tempo atual dentro do ciclo (0-1)
  }
  
  // Métodos relacionados ao Three.js comentados para evitar erros no servidor
  /*
  initializeThreeJS() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    this.initMap();
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
  */

  update(deltaTime) {
    // Atualizar o tempo do jogo
    this.updateTimeOfDay(deltaTime);
    
    // Atualizar o clima
    this.weatherSystem.update(deltaTime, this.terrainGrid, this.entities);
    
    // Outras atualizações necessárias
  }
  
  // Atualização do ciclo dia/noite
  updateTimeOfDay(deltaTime) {
    const now = Date.now();
    const elapsed = now - this.dayStartTime;
    
    // Calcular o tempo atual dentro do ciclo (0-1)
    this.currentTime = (elapsed % this.dayDuration) / this.dayDuration;
  }
  
  // Obter informações sobre o tempo do dia
  getTimeOfDayInfo() {
    // Determinar se é dia ou noite
    const isDay = this.currentTime >= 0.25 && this.currentTime <= 0.75;
    
    // Calcular a hora do dia (0-23)
    const hour = Math.floor(this.currentTime * 24);
    
    // Calcular a luminosidade (0-1)
    let luminosity = 0;
    if (this.currentTime < 0.25) {
      // Noite para amanhecer (0 - 0.25)
      luminosity = this.currentTime * 4;
    } else if (this.currentTime < 0.75) {
      // Dia (0.25 - 0.75)
      luminosity = 1;
    } else {
      // Anoitecer para noite (0.75 - 1)
      luminosity = 1 - ((this.currentTime - 0.75) * 4);
    }
    
    return {
      time: this.currentTime,
      hour,
      isDay,
      luminosity,
      phase: this.getTimePhase()
    };
  }
  
  // Obter a fase atual do dia
  getTimePhase() {
    if (this.currentTime < 0.2) return 'night';
    if (this.currentTime < 0.25) return 'dawn';
    if (this.currentTime < 0.7) return 'day';
    if (this.currentTime < 0.75) return 'dusk';
    return 'night';
  }
  
  // Método para obter entidades visíveis
  getVisibleEntities() {
    // Implementação básica - retorna todas as entidades
    return Array.from(this.entities.values()).map(entity => entity.getInfo());
  }
  
  // Método para obter recursos
  getResources() {
    // Implementação básica - retorna todos os recursos
    return Array.from(this.resources.values()).map(resource => resource.getInfo());
  }
  
  // Método para obter dados do terreno
  getTerrainData() {
    return this.terrainSystem.getTerrainData(this.terrainGrid, this.width, this.height);
  }

  // ... outros métodos necessários
}

module.exports = World;