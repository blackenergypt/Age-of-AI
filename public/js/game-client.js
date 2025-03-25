class GameClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.playerId = null;
        this.playerName = 'Jogador';
        this.gameMode = 'online';
        this.gameName = '';
        
        this.world = {
            tiles: [],
            units: [],
            buildings: [],
            resources: [],
            npcs: [],
            animals: [],
            width: 100,
            height: 100,
            fog: []
        };
        
        this.tileSize = 50;
        this.visionRange = 5;
        
        this.resources = {
            food: 0,
            wood: 0,
            stone: 0,
            gold: 0
        };
        
        this.selectedEntities = [];
        this.viewport = { x: 0, y: 0, width: 0, height: 0 };
        
        this.uiManager = null;
        this.renderer = null;
        this.inputHandler = null;
        
        this.lastUpdateTime = 0;
        this.frameCount = 0;
        this.fpsTime = 0;
        this.fps = 0;
        
        this.gameState = {
            fps: 0,
            playerCount: 1,
            entities: [],
            worldSize: this.world.width * this.tileSize
        };
        
        this.gameLoop = this.gameLoop.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.connectToServer = this.connectToServer.bind(this);
        this.initialize = this.initialize.bind(this);
        this.simulateInitialData = this.simulateInitialData.bind(this);
        this.render = this.render.bind(this);
        this.sendChatMessage = this.sendChatMessage.bind(this);
        this.performAction = this.performAction.bind(this);
        this.handleLeftClick = this.handleLeftClick.bind(this);
        this.handleRightClick = this.handleRightClick.bind(this);
        this.handleZoom = this.handleZoom.bind(this);
    }
    
    generateBiomes() {
        const biomes = [
            { type: 'forest', color: '#2E7D32', weight: 0.3, resourceWeights: { wood: 0.8, food: 0.2 }, movementSpeed: 0.8 },
            { type: 'plain', color: '#81C784', weight: 0.3, resourceWeights: { food: 0.9, wood: 0.1 }, movementSpeed: 1.0 },
            { type: 'desert', color: '#FFD54F', weight: 0.15, resourceWeights: { stone: 0.7, gold: 0.3 }, movementSpeed: 0.9 },
            { type: 'mountain', color: '#757575', weight: 0.15, resourceWeights: { stone: 0.6, gold: 0.4 }, movementSpeed: 0.6 },
            { type: 'water', color: '#42A5F5', weight: 0.1, resourceWeights: {}, movementSpeed: 0.0 }
        ];

        for (let y = 0; y < this.world.height; y++) {
            for (let x = 0; x < this.world.width; x++) {
                const totalWeight = biomes.reduce((sum, b) => sum + b.weight, 0);
                let random = Math.random() * totalWeight;
                let selectedBiome = biomes[0];

                for (const biome of biomes) {
                    if (random < biome.weight) {
                        selectedBiome = biome;
                        break;
                    }
                    random -= biome.weight;
                }

                this.world.tiles.push({
                    position: { x: x * this.tileSize, y: y * this.tileSize },
                    biome: selectedBiome.type,
                    color: selectedBiome.color,
                    movementSpeed: selectedBiome.movementSpeed,
                    resourceWeights: selectedBiome.resourceWeights
                });
            }
        }
        
        this.world.fog = new Array(this.world.width * this.world.height).fill(true);
    }
    
    connectToServer() {
        try {
            const serverUrl = CONFIG?.server?.url || 'ws://localhost:8080';
            console.log('Tentando conectar ao servidor:', serverUrl);
            
            setTimeout(() => {
                console.log('Conectado ao servidor (simulação)');
                this.connected = true;
                this.reconnectAttempts = 0;
                this.initialize();
                this.simulateInitialData();
            }, 1000);
            
            return true;
        } catch (error) {
            console.error('Erro ao conectar ao servidor:', error);
            return false;
        }
    }
    
    initialize() {
        console.log('Inicializando o jogo...');
        
        this.uiManager = new UIManager(this);
        this.renderer = window.gameRenderer || new Renderer(document.getElementById('game-canvas'));
        this.inputHandler = window.inputHandler || new InputHandler(document.getElementById('game-canvas'));
        
        // Tentar inicializar o Three.js
        if (typeof THREE !== 'undefined') {
            console.log('Tentando inicializar Three.js...');
            if (this.renderer.init3D()) {
                console.log('Three.js inicializado com sucesso.');
                
                // Criar o terreno 3D
                const flatTiles = [];
                for (let y = 0; y < this.world.height; y++) {
                    for (let x = 0; x < this.world.width; x++) {
                        const index = y * this.world.width + x;
                        if (index < this.world.tiles.length) {
                            flatTiles.push(this.world.tiles[index]);
                        }
                    }
                }
                
                // Criar o terreno
                this.terrain3D = this.renderer.createTerrain(
                    flatTiles,
                    this.world.width,
                    this.world.height,
                    this.tileSize
                );
                
                // Adicionar interface para alternar entre 2D e 3D
                this.addToggle3DButton();
            }
        }
        
        this.setupInputEvents();
        this.generateBiomes();
        
        this.lastUpdateTime = performance.now();
        requestAnimationFrame(this.gameLoop);
        
        setTimeout(() => {
            if (this.uiManager) {
                this.uiManager.showNotification('Bem-vindo ao Age of AI!', 'success', 5000);
                this.uiManager.addChatMessage('Sistema', 'Bem-vindo ao Age of AI!', 'system');
            }
        }, 1000);
    }
    
    setupInputEvents() {
        this.inputHandler.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.handleLeftClick();
            else if (e.button === 2) this.handleRightClick();
        });
        
        this.inputHandler.addEventListener('wheel', (e) => {
            this.handleZoom(e.deltaY);
        });
        
        this.inputHandler.addEventListener('keydown', (e) => {
            this.handleKeyDown(e.key);
        });
    }
    
    gameLoop(timestamp) {
        const deltaTime = (timestamp - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = timestamp;
        
        this.frameCount++;
        this.fpsTime += deltaTime * 1000;
        if (this.fpsTime >= 1000) {
            this.fps = this.frameCount;
            this.gameState.fps = this.fps;
            this.frameCount = 0;
            this.fpsTime = 0;
        }
        
        this.inputHandler.updateWorldCoordinates(this.renderer.camera);
        this.handleCameraMovement(deltaTime);
        this.updateEntities(deltaTime);
        this.updateFog();
        this.render();
        
        if (this.uiManager) {
            this.uiManager.update(deltaTime * 1000);
        }
        
        requestAnimationFrame(this.gameLoop);
    }
    
    updateEntities(deltaTime) {
        const allEntities = [...this.world.units, ...this.world.npcs];
        const staticEntities = [...this.world.buildings];
        const gatherableEntities = [...this.world.resources, ...this.world.animals.filter(a => a.resource)];
        
        allEntities.forEach(entity => {
            if (!entity.velocity || !entity.speed) return;

            entity.carrying = entity.carrying || { type: null, amount: 0 };
            entity.capacity = entity.capacity || 20;
            entity.gatherRate = entity.gatherRate || 10;
            entity.gatherState = entity.gatherState || 'idle';
            entity.gatherTimer = entity.gatherTimer || 0;

            const tileX = Math.floor(entity.position.x / this.tileSize);
            const tileY = Math.floor(entity.position.y / this.tileSize);
            const tileIndex = tileY * this.world.width + tileX;
            const tile = this.world.tiles[tileIndex] || { movementSpeed: 1.0, biome: 'plain' };

            if (entity.target) {
                const dx = entity.target.x - entity.position.x;
                const dy = entity.target.y - entity.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 5) {
                    const speed = entity.speed * tile.movementSpeed;
                    entity.velocity.x = (dx / distance) * speed;
                    entity.velocity.y = (dy / distance) * speed;

                    let newX = entity.position.x + entity.velocity.x * deltaTime;
                    let newY = entity.position.y + entity.velocity.y * deltaTime;

                    const newTileX = Math.floor(newX / this.tileSize);
                    const newTileY = Math.floor(newY / this.tileSize);
                    const newTileIndex = newTileY * this.world.width + newTileX;
                    const newTile = this.world.tiles[newTileIndex];
                    if (newTile && newTile.movementSpeed === 0) {
                        entity.velocity.x = 0;
                        entity.velocity.y = 0;
                        return;
                    }

                    allEntities.forEach(other => {
                        if (other !== entity && other.position) {
                            const distX = other.position.x - newX;
                            const distY = other.position.y - newY;
                            const dist = Math.sqrt(distX * distX + distY * distY);
                            const minDist = (entity.size || 20) + (other.size || 20);

                            if (dist < minDist) {
                                const overlap = minDist - dist;
                                const nx = distX / dist || 0;
                                const ny = distY / dist || 0;
                                newX -= nx * overlap * 0.5;
                                newY -= ny * overlap * 0.5;
                            }
                        }
                    });

                    staticEntities.forEach(building => {
                        const buildingLeft = building.position.x;
                        const buildingRight = building.position.x + building.width;
                        const buildingTop = building.position.y;
                        const buildingBottom = building.position.y + building.height;
                        const entitySize = entity.size || 20;

                        if (newX + entitySize > buildingLeft && newX - entitySize < buildingRight &&
                            newY + entitySize > buildingTop && newY - entitySize < buildingBottom) {
                            const dxLeft = newX + entitySize - buildingLeft;
                            const dxRight = buildingRight - (newX - entitySize);
                            const dyTop = newY + entitySize - buildingTop;
                            const dyBottom = buildingBottom - (newY - entitySize);

                            const minOverlap = Math.min(dxLeft, dxRight, dyTop, dyBottom);
                            if (minOverlap === dxLeft) newX = buildingLeft - entitySize;
                            else if (minOverlap === dxRight) newX = buildingRight + entitySize;
                            else if (minOverlap === dyTop) newY = buildingTop - entitySize;
                            else newY = buildingBottom + entitySize;
                        }
                    });

                    entity.position.x = newX;
                    entity.position.y = newY;
                } else {
                    entity.target = null;
                    entity.velocity.x = 0;
                    entity.velocity.y = 0;

                    const targetEntity = gatherableEntities.find(e => {
                        const dist = Math.sqrt(
                            Math.pow(e.position.x - entity.position.x, 2) +
                            Math.pow(e.position.y - entity.position.y, 2)
                        );
                        return dist < 20;
                    });

                    if (targetEntity && entity.carrying.amount < entity.capacity) {
                        entity.gatherState = 'gathering';
                        this.gatherResource(entity, targetEntity, deltaTime);
                    } else if (entity.carrying.amount > 0) {
                        const market = this.world.buildings.find(b => b.type === 'market' && b.owner === entity.owner);
                        if (market && entity.carrying.amount >= entity.capacity) {
                            entity.gatherState = 'returning';
                            entity.target = { x: market.position.x, y: market.position.y };
                        } else {
                            const deposit = this.world.buildings.find(b => b.type === 'townCenter' && b.owner === entity.owner);
                            if (deposit) {
                                entity.gatherState = 'returning';
                                entity.target = { x: deposit.position.x, y: deposit.position.y };
                            }
                        }
                    }
                }
            }

            const market = this.world.buildings.find(b => 
                b.type === 'market' && 
                b.owner === entity.owner && 
                Math.sqrt(
                    Math.pow(b.position.x - entity.position.x, 2) +
                    Math.pow(b.position.y - entity.position.y, 2)
                ) < 20
            );
            if (market && entity.carrying.amount > 0) {
                this.tradeResource(entity, market);
            }

            const deposit = this.world.buildings.find(b => 
                b.type === 'townCenter' && 
                b.owner === entity.owner && 
                Math.sqrt(
                    Math.pow(b.position.x - entity.position.x, 2) +
                    Math.pow(b.position.y - entity.position.y, 2)
                ) < 20
            );
            if (deposit && entity.carrying.amount > 0) {
                this.depositResource(entity);
            }

            if (!entity.owner && !entity.target) {
                if (entity.behavior === 'gather' && gatherableEntities.length > 0) {
                    const closestResource = gatherableEntities.reduce((closest, res) => {
                        const dist = Math.sqrt(
                            Math.pow(res.position.x - entity.position.x, 2) +
                            Math.pow(res.position.y - entity.position.y, 2)
                        );
                        return dist < closest.dist ? { res, dist } : closest;
                    }, { res: null, dist: Infinity }).res;
                    entity.target = closestResource ? { ...closestResource.position } : null;
                }
            }

            if (entity.gatherState === 'gathering') {
                entity.gatherTimer += deltaTime;
                if (entity.gatherTimer > 0.5) entity.gatherTimer = 0; // Reset para animação
            } else {
                entity.gatherTimer = 0;
            }
        });

        this.world.animals.forEach(animal => {
            if (!animal.velocity || !animal.speed || animal.resource) return;

            const tileX = Math.floor(animal.position.x / this.tileSize);
            const tileY = Math.floor(animal.position.y / this.tileSize);
            const tileIndex = tileY * this.world.width + tileX;
            const tile = this.world.tiles[tileIndex] || { movementSpeed: 1.0, biome: 'plain' };

            if (animal.target) {
                const dx = animal.target.x - animal.position.x;
                const dy = animal.target.y - animal.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 5) {
                    const speed = animal.speed * tile.movementSpeed;
                    animal.velocity.x = (dx / distance) * speed;
                    animal.velocity.y = (dy / distance) * speed;

                    animal.position.x += animal.velocity.x * deltaTime;
                    animal.position.y += animal.velocity.y * deltaTime;
                } else {
                    animal.target = null;
                    animal.velocity.x = 0;
                    animal.velocity.y = 0;
                }
            }

            if (animal.behavior === 'hunt') {
                const closestUnit = this.world.units.reduce((closest, unit) => {
                    const dist = Math.sqrt(
                        Math.pow(unit.position.x - animal.position.x, 2) +
                        Math.pow(unit.position.y - animal.position.y, 2)
                    );
                    return dist < closest.dist ? { unit, dist } : closest;
                }, { unit: null, dist: 200 }).unit;
                animal.target = closestUnit ? { ...closestUnit.position } : null;
            } else if (animal.behavior === 'wander') {
                if (Math.random() < 0.01) {
                    animal.target = {
                        x: animal.position.x + (Math.random() * 200 - 100),
                        y: animal.position.y + (Math.random() * 200 - 100)
                    };
                }
            }
        });
    }

    gatherResource(unit, target, deltaTime) {
        const amountToGather = Math.min(
            unit.gatherRate * deltaTime,
            unit.capacity - unit.carrying.amount,
            target.amount || target.resource.amount
        );

        if (target.resource) { // Animal
            unit.carrying.type = target.resource.type;
            unit.carrying.amount += amountToGather;
            target.resource.amount -= amountToGather;

            if (target.resource.amount <= 0) {
                this.world.animals = this.world.animals.filter(a => a !== target);
                this.entities = this.entities.filter(e => e !== target);
                if (this.uiManager) {
                    this.uiManager.showNotification(`${unit.type} coletou ${target.type}`, 'success', 2000);
                }
            }
        } else { // Recurso estático
            unit.carrying.type = target.type;
            unit.carrying.amount += amountToGather;
            target.amount -= amountToGather;

            if (target.amount <= 0) {
                this.world.resources = this.world.resources.filter(r => r !== target);
                this.entities = this.entities.filter(e => e !== target);
                if (this.uiManager) {
                    this.uiManager.showNotification(`${unit.type} esgotou ${target.type}`, 'info', 2000);
                }
            }
        }

        if (unit.carrying.amount >= unit.capacity) {
            const market = this.world.buildings.find(b => b.type === 'market' && b.owner === unit.owner);
            if (market) {
                unit.target = { x: market.position.x, y: market.position.y };
            } else {
                const deposit = this.world.buildings.find(b => b.type === 'townCenter' && b.owner === unit.owner);
                if (deposit) {
                    unit.target = { x: deposit.position.x, y: deposit.position.y };
                }
            }
        }
    }

    tradeResource(unit, market) {
        if (unit.carrying.amount > 0 && market.tradeRates[unit.carrying.type]) {
            const goldGained = unit.carrying.amount * market.tradeRates[unit.carrying.type];
            if (unit.owner === this.playerId) {
                this.resources.gold += goldGained;
                if (this.uiManager) {
                    this.uiManager.showNotification(`Trocou ${unit.carrying.amount} ${unit.carrying.type} por ${goldGained} ouro`, 'success', 2000);
                    this.uiManager.updateResources(this.resources);
                }
            }
            unit.carrying = { type: null, amount: 0 };
            unit.gatherState = 'idle';

            const deposit = this.world.buildings.find(b => b.type === 'townCenter' && b.owner === unit.owner);
            if (deposit) {
                unit.target = { x: deposit.position.x, y: deposit.position.y };
            }
        }
    }

    depositResource(unit) {
        if (unit.owner === this.playerId) {
            this.resources[unit.carrying.type] += unit.carrying.amount;
            if (this.uiManager) {
                this.uiManager.updateResources(this.resources);
                this.uiManager.showNotification(`Depositou ${unit.carrying.amount} ${unit.carrying.type}`, 'success', 2000);
            }
        }
        unit.carrying = { type: null, amount: 0 };
        unit.gatherState = 'idle';
    }
    
    updateFog() {
        this.world.fog.fill(true);

        this.world.units.forEach(unit => {
            if (unit.owner === this.playerId) {
                const tileX = Math.floor(unit.position.x / this.tileSize);
                const tileY = Math.floor(unit.position.y / this.tileSize);
                const range = this.visionRange;

                for (let y = Math.max(0, tileY - range); y <= Math.min(this.world.height - 1, tileY + range); y++) {
                    for (let x = Math.max(0, tileX - range); x <= Math.min(this.world.width - 1, tileX + range); x++) {
                        const dx = x - tileX;
                        const dy = y - tileY;
                        if (Math.sqrt(dx * dx + dy * dy) <= range) {
                            this.world.fog[y * this.world.width + x] = false;
                        }
                    }
                }
            }
        });
    }
    
    render() {
        // Renderização 2D padrão
        if (!this.renderer.use3D) {
            this.renderer.clear();
            
            const viewport = this.getViewport();
            const visibleTiles = this.world.tiles.filter(tile => 
                tile.position.x + this.tileSize >= viewport.x &&
                tile.position.x <= viewport.x + viewport.width &&
                tile.position.y + this.tileSize >= viewport.y &&
                tile.position.y <= viewport.y + viewport.height
            );
            
            visibleTiles.forEach((tile, index) => {
                const tileIndex = Math.floor(tile.position.y / this.tileSize) * this.world.width + Math.floor(tile.position.x / this.tileSize);
                const isFogged = this.world.fog[tileIndex];
                
                this.renderer.drawRect(
                    tile.position.x,
                    tile.position.y,
                    this.tileSize,
                    this.tileSize,
                    tile.color,
                    { fill: true, alpha: isFogged ? 0.2 : 1.0 }
                );
            });

            if (typeof this.renderer.drawGrid === 'function') {
                this.renderer.drawGrid();
            }
            
            const visibleEntities = [
                ...this.world.units,
                ...this.world.npcs,
                ...this.world.animals,
                ...this.world.buildings,
                ...this.world.resources
            ].filter(entity => 
                entity.position.x + (entity.width || 20) >= viewport.x &&
                entity.position.x <= viewport.x + viewport.width &&
                entity.position.y + (entity.height || 20) >= viewport.y &&
                entity.position.y <= viewport.y + viewport.height
            );

            visibleEntities.forEach(entity => {
                const tileX = Math.floor(entity.position.x / this.tileSize);
                const tileY = Math.floor(entity.position.y / this.tileSize);
                const tileIndex = tileY * this.world.width + tileX;
                if (entity && entity.position && !this.world.fog[tileIndex]) {
                    this.renderer.drawEntity(entity);
                }
            });
            
            this.gameState.entities = visibleEntities.filter(entity => {
                const tileX = Math.floor(entity.position.x / this.tileSize);
                const tileY = Math.floor(entity.position.y / this.tileSize);
                const tileIndex = tileY * this.world.width + tileX;
                return !this.world.fog[tileIndex];
            });
            this.renderer.drawUI(this.gameState);
        } 
        // Renderização 3D
        else {
            // Render 3D scene
            this.renderer.render3D(this);
            
            // Update UI with 2D canvas (overlay)
            this.renderer.drawUI(this.gameState);
        }
    }
    
    simulateInitialData() {
        this.playerId = 'player1';
        
        this.resources = {
            food: 200,
            wood: 200,
            stone: 100,
            gold: 50
        };
        
        if (this.uiManager) {
            this.uiManager.updateResources(this.resources);
        }
        
        for (let i = 0; i < 20; i++) {
            const tileIndex = Math.floor(Math.random() * this.world.tiles.length);
            const tile = this.world.tiles[tileIndex];
            const resourceTypes = Object.keys(tile.resourceWeights);
            if (resourceTypes.length > 0) {
                const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
                this.world.resources.push({
                    id: 'resource_' + i,
                    type: type,
                    position: {
                        x: tile.position.x + this.tileSize / 2,
                        y: tile.position.y + this.tileSize / 2
                    },
                    amount: Math.floor(Math.random() * 500) + 500
                });
            }
        }
        
        const centerTile = this.world.tiles[Math.floor(this.world.tiles.length / 2)];
        for (let i = 0; i < 5; i++) {
            this.world.units.push({
                id: 'unit_' + i,
                type: 'villager',
                owner: this.playerId,
                position: {
                    x: centerTile.position.x + Math.random() * this.tileSize - this.tileSize / 2,
                    y: centerTile.position.y + Math.random() * this.tileSize - this.tileSize / 2
                },
                velocity: { x: 0, y: 0 },
                speed: 100,
                health: 100,
                maxHealth: 100,
                target: null,
                carrying: { type: null, amount: 0 },
                capacity: 20,
                gatherRate: 10,
                gatherState: 'idle'
            });
        }
        
        for (let i = 0; i < 3; i++) {
            const tileIndex = Math.floor(Math.random() * this.world.tiles.length);
            const tile = this.world.tiles[tileIndex];
            this.world.npcs.push({
                id: 'npc_' + i,
                type: 'villager',
                owner: null,
                position: {
                    x: tile.position.x + this.tileSize / 2,
                    y: tile.position.y + this.tileSize / 2
                },
                velocity: { x: 0, y: 0 },
                speed: 80,
                health: 50,
                maxHealth: 50,
                target: null,
                behavior: 'gather',
                carrying: { type: null, amount: 0 },
                capacity: 20,
                gatherRate: 10,
                gatherState: 'idle'
            });
        }
        
        for (let i = 0; i < 5; i++) {
            const tileIndex = Math.floor(Math.random() * this.world.tiles.length);
            const tile = this.world.tiles[tileIndex];
            this.world.animals.push({
                id: 'wild_' + i,
                type: 'wolf',
                owner: null,
                position: {
                    x: tile.position.x + this.tileSize / 2,
                    y: tile.position.y + this.tileSize / 2
                },
                velocity: { x: 0, y: 0 },
                speed: 120,
                health: 80,
                maxHealth: 80,
                target: null,
                behavior: 'hunt',
                size: 15,
                color: '#424242'
            });
        }
        
        for (let i = 0; i < 8; i++) {
            const tileIndex = Math.floor(Math.random() * this.world.tiles.length);
            const tile = this.world.tiles[tileIndex];
            this.world.animals.push({
                id: 'domestic_' + i,
                type: 'sheep',
                owner: null,
                position: {
                    x: tile.position.x + this.tileSize / 2,
                    y: tile.position.y + this.tileSize / 2
                },
                velocity: { x: 0, y: 0 },
                speed: 50,
                health: 30,
                maxHealth: 30,
                target: null,
                behavior: 'wander',
                resource: { type: 'food', amount: 100 },
                size: 10,
                color: '#FFFFFF'
            });
        }
        
        this.world.buildings.push({
            id: 'building_1',
            type: 'townCenter',
            owner: this.playerId,
            position: {
                x: centerTile.position.x,
                y: centerTile.position.y
            },
            width: 40,
            height: 40,
            health: 1000,
            maxHealth: 1000
        });

        this.world.buildings.push({
            id: 'building_2',
            type: 'market',
            owner: this.playerId,
            position: {
                x: centerTile.position.x + 100,
                y: centerTile.position.y + 100
            },
            width: 40,
            height: 40,
            health: 800,
            maxHealth: 800,
            tradeRates: { food: 0.5, wood: 0.7, stone: 0.6 }
        });
        
        if (this.uiManager) {
            this.uiManager.updateMinimap(this.world);
        }
        
        this.entities = [...this.world.units, ...this.world.npcs, ...this.world.animals, ...this.world.buildings, ...this.world.resources];
    }
    
    sendChatMessage(message) {
        if (!this.connected) return;
        console.log('Enviando mensagem:', message);
        if (this.uiManager) {
            this.uiManager.addChatMessage(this.playerName, message);
        }
    }
    
    performAction(actionId) {
        console.log('Executando ação:', actionId);
    }
    
    getViewport() {
        const halfWidth = this.renderer.canvas.width / (2 * this.renderer.camera.zoom);
        const halfHeight = this.renderer.canvas.height / (2 * this.renderer.camera.zoom);
        
        return {
            x: this.renderer.camera.x - halfWidth,
            y: this.renderer.camera.y - halfHeight,
            width: halfWidth * 2,
            height: halfHeight * 2
        };
    }
    
    handleLeftClick() {
        const worldX = this.inputHandler.mouse.worldX;
        const worldY = this.inputHandler.mouse.worldY;
        
        console.log('Clique esquerdo em:', worldX, worldY);
        this.selectEntitiesAt(worldX, worldY);
    }
    
    handleRightClick() {
        const worldX = this.inputHandler.mouse.worldX;
        const worldY = this.inputHandler.mouse.worldY;
        
        console.log('Clique direito em:', worldX, worldY);
        
        if (this.selectedEntities.length > 0) {
            this.sendCommand(worldX, worldY);
        }
    }
    
    handleZoom(deltaY) {
        const zoomSpeed = 0.001;
        const newZoom = this.renderer.camera.zoom * (1 - deltaY * zoomSpeed);
        this.renderer.camera.zoom = clamp(newZoom, 0.5, 2.0);
    }
    
    handleCameraMovement(deltaTime) {
        const moveSpeed = 0.5 * deltaTime * 1000;
        
        if (this.inputHandler.isKeyDown('w') || this.inputHandler.isKeyDown('ArrowUp')) {
            this.renderer.camera.y -= moveSpeed;
        }
        
        if (this.inputHandler.isKeyDown('s') || this.inputHandler.isKeyDown('ArrowDown')) {
            this.renderer.camera.y += moveSpeed;
        }
        
        if (this.inputHandler.isKeyDown('a') || this.inputHandler.isKeyDown('ArrowLeft')) {
            this.renderer.camera.x -= moveSpeed;
        }
        
        if (this.inputHandler.isKeyDown('d') || this.inputHandler.isKeyDown('ArrowRight')) {
            this.renderer.camera.x += moveSpeed;
        }
    }
    
    handleKeyDown(key) {
        switch (key) {
            case 'Escape':
                this.selectedEntities = [];
                break;
        }
    }
    
    selectEntitiesAt(x, y) {
        console.log(`Selecionando entidades em (${x.toFixed(2)}, ${y.toFixed(2)})`);
        
        const selectedUnits = this.world.units.filter(unit => {
            const distance = Math.sqrt(Math.pow(unit.position.x - x, 2) + Math.pow(unit.position.y - y, 2));
            return distance < 20 && unit.owner === this.playerId;
        });
        
        if (selectedUnits.length > 0) {
            this.selectedEntities = selectedUnits.map(unit => unit.id);
            console.log('Unidades selecionadas:', this.selectedEntities);
            if (this.uiManager) {
                this.uiManager.showNotification(`${selectedUnits.length} unidade(s) selecionada(s)`, 'info', 2000);
            }
        } else {
            this.selectedEntities = [];
        }
    }
    
    sendCommand(x, y) {
        console.log(`Enviando comando para (${x.toFixed(2)}, ${y.toFixed(2)})`);
        
        this.world.units.forEach(unit => {
            if (this.selectedEntities.includes(unit.id)) {
                unit.target = { x, y };
                unit.gatherState = 'idle';
            }
        });
        
        if (this.uiManager) {
            this.uiManager.showNotification('Comando enviado', 'info', 1000);
        }
    }
    
    handleMessage(message) {
        console.log('Mensagem recebida:', message);
    }

    buildHouseAt(x, y) {
        // Lógica para construir a casa na posição (x, y)
        console.log(`Construindo casa em (${x}, ${y})`);
        // Aqui você pode enviar uma requisição ao servidor para construir a casa
    }

    // Adicionar botão para alternar entre modos 2D e 3D
    addToggle3DButton() {
        const button = document.createElement('button');
        button.textContent = 'Alternar 3D';
        button.style.position = 'absolute';
        button.style.top = '10px';
        button.style.right = '10px';
        button.style.zIndex = '1000';
        button.style.padding = '8px 12px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        
        button.addEventListener('click', () => {
            this.renderer.use3D = !this.renderer.use3D;
            
            // Mostrar/ocultar o canvas de acordo com o modo
            if (this.renderer.use3D) {
                this.renderer.canvas.style.display = 'none';
                if (this.renderer.renderer3D) {
                    this.renderer.renderer3D.domElement.style.display = 'block';
                }
                button.textContent = 'Mudar para 2D';
            } else {
                this.renderer.canvas.style.display = 'block';
                if (this.renderer.renderer3D) {
                    this.renderer.renderer3D.domElement.style.display = 'none';
                }
                button.textContent = 'Mudar para 3D';
            }
        });
        
        document.body.appendChild(button);
    }
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}