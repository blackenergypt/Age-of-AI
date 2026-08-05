class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.gridSize = 50;
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1
        };
        
        this.assets = {
            images: {},
            sprites: {},
            animations: {}
        };
        
        this.gameClient = null; // Referência ao GameClient, deve ser definida externamente
        
        // Configuração do Three.js
        this.scene = null;
        this.renderer3D = null;
        this.camera3D = null;
        this.raycaster = null;
        this.mouse = null;
        this.use3D = false; // Flag para alternar entre renderização 2D e 3D
        this.terrainMeshes = {};
        this.unitMeshes = {};
        this.buildingMeshes = {};
        this.tileTypeMaterials = {};
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.renderer3D) {
            this.renderer3D.setSize(window.innerWidth, window.innerHeight);
        }
        
        if (this.camera3D) {
            const aspect = window.innerWidth / window.innerHeight;
            const zoomFactor = this.camera ? this.camera.zoom * 500 : 500;
            
            if (this.camera3D.isOrthographicCamera) {
                this.camera3D.left = -zoomFactor * aspect;
                this.camera3D.right = zoomFactor * aspect;
                this.camera3D.top = zoomFactor;
                this.camera3D.bottom = -zoomFactor;
            } else if (this.camera3D.isPerspectiveCamera) {
                this.camera3D.aspect = aspect;
            }
            
            this.camera3D.updateProjectionMatrix();
        }
    }
    
    // Inicializar o Three.js
    init3D() {
        // Verificar se Three.js está disponível
        if (typeof THREE === 'undefined') {
            console.error('Three.js não está disponível. Adicione a biblioteca ao seu projeto.');
            return false;
        }
        
        try {
            // Criar cena
            this.scene = new THREE.Scene();
            
            // Criar câmera para visão isométrica
            const aspect = window.innerWidth / window.innerHeight;
            this.camera3D = new THREE.OrthographicCamera(
                -500 * aspect, 500 * aspect, 
                500, -500, 
                0.1, 2000
            );
            
            // Posicionar a câmera para criar o efeito isométrico
            this.camera3D.position.set(500, 500, 500);
            this.camera3D.lookAt(0, 0, 0);
            
            // Criar renderer
            this.renderer3D = new THREE.WebGLRenderer({ antialias: true });
            this.renderer3D.setSize(window.innerWidth, window.innerHeight);
            this.renderer3D.shadowMap.enabled = true;
            this.renderer3D.shadowMap.type = THREE.PCFSoftShadowMap;
            document.body.appendChild(this.renderer3D.domElement);
            
            // Configurar iluminação
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(500, 800, 500);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            this.scene.add(directionalLight);
            
            // Configurar raycaster para interação
            this.raycaster = new THREE.Raycaster();
            this.mouse = new THREE.Vector2();
            
            // Preparar materiais para diferentes tipos de tiles
            this.createTileMaterials();
            
            // Adicionar event listeners
            this.addEventListeners();
            
            this.use3D = true;
            return true;
        } catch (error) {
            console.error('Erro ao inicializar Three.js:', error);
            return false;
        }
    }
    
    createTileMaterials() {
        // Materiais para diferentes tipos de terreno usando cores em vez de texturas
        this.tileTypeMaterials = {
            forest: new THREE.MeshStandardMaterial({
                color: 0x2E7D32,
                roughness: 0.8,
                metalness: 0.1
            }),
            plain: new THREE.MeshStandardMaterial({
                color: 0x81C784,
                roughness: 0.7,
                metalness: 0.1
            }),
            desert: new THREE.MeshStandardMaterial({
                color: 0xFFD54F,
                roughness: 0.9,
                metalness: 0.0
            }),
            mountain: new THREE.MeshStandardMaterial({
                color: 0x757575,
                roughness: 0.9,
                metalness: 0.2
            }),
            water: new THREE.MeshStandardMaterial({
                color: 0x42A5F5,
                roughness: 0.3,
                metalness: 0.1,
                transparent: true,
                opacity: 0.8
            })
        };
        
        // Comentar a tentativa de carregamento de texturas para evitar erros 404
        /*
        // Tentar carregar texturas (se disponíveis)
        try {
            textureLoader.load('/images/tiles/grass.jpg', (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                this.tileTypeMaterials.plain.map = texture;
                this.tileTypeMaterials.plain.needsUpdate = true;
            });
            
            textureLoader.load('/images/tiles/forest.jpg', (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                this.tileTypeMaterials.forest.map = texture;
                this.tileTypeMaterials.forest.needsUpdate = true;
            });
            
            textureLoader.load('/images/tiles/sand.jpg', (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                this.tileTypeMaterials.desert.map = texture;
                this.tileTypeMaterials.desert.needsUpdate = true;
            });
            
            textureLoader.load('/images/tiles/mountain.jpg', (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                this.tileTypeMaterials.mountain.map = texture;
                this.tileTypeMaterials.mountain.needsUpdate = true;
            });
            
            textureLoader.load('/images/tiles/water.jpg', (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                this.tileTypeMaterials.water.map = texture;
                this.tileTypeMaterials.water.needsUpdate = true;
            });
        } catch (error) {
            console.warn('Não foi possível carregar as texturas:', error);
        }
        */
    }
    
    createTerrain(tiles, width, height, tileSize) {
        if (!this.use3D) return;
        
        // Limpar terreno existente
        Object.values(this.terrainMeshes).forEach(mesh => {
            this.scene.remove(mesh);
        });
        this.terrainMeshes = {};
        
        // Criar grupo para o terreno
        const terrainGroup = new THREE.Group();
        this.scene.add(terrainGroup);
        
        // Criar geometrias para os tiles - mais finos para parecer com Age of Empires
        const tileGeometry = new THREE.BoxGeometry(tileSize, 2, tileSize);
        
        // Ajustar offset para centralizar o mapa
        const offsetX = -width * tileSize / 2;
        const offsetZ = -height * tileSize / 2;
        
        // Criar mesh para cada tile
        tiles.forEach((tile, index) => {
            const x = Math.floor(index % width);
            const z = Math.floor(index / width);
            
            const biomeType = tile.biome || 'plain';
            const material = this.tileTypeMaterials[biomeType] || this.tileTypeMaterials.plain;
            
            const mesh = new THREE.Mesh(tileGeometry, material);
            
            // Posicionar o tile
            mesh.position.set(
                offsetX + x * tileSize + tileSize / 2,
                0,
                offsetZ + z * tileSize + tileSize / 2
            );
            
            // Ajustar a altura com base na elevação (se disponível)
            if (tile.elevation) {
                // Menos altura para tiles planos
                const baseHeight = biomeType === 'mountain' ? 30 : 3;
                mesh.position.y = tile.elevation * baseHeight;
                
                if (biomeType === 'mountain' && tile.elevation > 0.6) {
                    mesh.position.y += tile.elevation * 20;
                    mesh.scale.y = 2 + tile.elevation * 4;
                }
            }
            
            mesh.receiveShadow = true;
            mesh.castShadow = biomeType === 'mountain' || biomeType === 'forest';
            
            // Guardar referência ao mesh
            this.terrainMeshes[`${x}-${z}`] = mesh;
            terrainGroup.add(mesh);
            
            // Adicionar elementos decorativos com base no bioma
            if (biomeType === 'forest' && Math.random() > 0.5) {
                this.addTreeAt(x, z, offsetX, offsetZ, tileSize, terrainGroup);
            } 
            else if (biomeType === 'desert' && Math.random() > 0.8) {
                this.addCactusAt(x, z, offsetX, offsetZ, tileSize, terrainGroup);
            }
            else if (biomeType === 'mountain' && tile.elevation > 0.7 && Math.random() > 0.7) {
                this.addRockAt(x, z, offsetX, offsetZ, tileSize, terrainGroup);
            }
        });
        
        return terrainGroup;
    }
    
    addTreeAt(x, z, offsetX, offsetZ, tileSize, parent) {
        // Criar tronco
        const trunkGeometry = new THREE.CylinderGeometry(2, 3, 15, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        
        // Criar copa
        const leavesGeometry = new THREE.ConeGeometry(10, 20, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x2E7D32 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 18;
        
        // Grupo para a árvore
        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(leaves);
        
        // Posicionar a árvore
        tree.position.set(
            offsetX + x * tileSize + tileSize / 2 + (Math.random() * 20 - 10),
            7.5,
            offsetZ + z * tileSize + tileSize / 2 + (Math.random() * 20 - 10)
        );
        
        // Aplicar rotação aleatória e escala
        tree.rotation.y = Math.random() * Math.PI * 2;
        const scale = 0.7 + Math.random() * 0.6;
        tree.scale.set(scale, scale, scale);
        
        tree.castShadow = true;
        parent.add(tree);
        
        return tree;
    }
    
    addCactusAt(x, z, offsetX, offsetZ, tileSize, parent) {
        // Criar tronco
        const trunkGeometry = new THREE.CylinderGeometry(2, 2, 15, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x2E8B57 });
        const trunk = new THREE.Mesh(trunkGeometry, material);
        
        // Grupo para o cacto
        const cactus = new THREE.Group();
        cactus.add(trunk);
        
        // Adicionar braços do cacto
        const arm1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 8, 8),
            material
        );
        arm1.position.set(0, 2, 0);
        arm1.rotation.z = Math.PI / 4;
        arm1.position.x = 4;
        cactus.add(arm1);
        
        // Posicionar o cacto
        cactus.position.set(
            offsetX + x * tileSize + tileSize / 2 + (Math.random() * 20 - 10),
            7.5,
            offsetZ + z * tileSize + tileSize / 2 + (Math.random() * 20 - 10)
        );
        
        // Aplicar rotação aleatória e escala
        cactus.rotation.y = Math.random() * Math.PI * 2;
        const scale = 0.5 + Math.random() * 0.3;
        cactus.scale.set(scale, scale, scale);
        
        cactus.castShadow = true;
        parent.add(cactus);
        
        return cactus;
    }
    
    addRockAt(x, z, offsetX, offsetZ, tileSize, parent) {
        // Criar geometria irregular para a rocha
        const rockGeometry = new THREE.DodecahedronGeometry(5, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x7B7B7B,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        // Posicionar a rocha
        rock.position.set(
            offsetX + x * tileSize + tileSize / 2 + (Math.random() * 20 - 10),
            5,
            offsetZ + z * tileSize + tileSize / 2 + (Math.random() * 20 - 10)
        );
        
        // Aplicar rotação aleatória e escala
        rock.rotation.x = Math.random() * Math.PI;
        rock.rotation.y = Math.random() * Math.PI;
        rock.rotation.z = Math.random() * Math.PI;
        
        const scale = 1 + Math.random() * 1.5;
        rock.scale.set(scale, scale * 0.8, scale);
        
        rock.castShadow = true;
        parent.add(rock);
        
        return rock;
    }
    
    render3D(gameClient) {
        if (!this.use3D || !this.scene || !this.renderer3D) return;
        
        // Atualizar posição da câmera com base na câmera 2D
        this.updateCamera3D(gameClient);
        
        // Renderizar a cena
        this.renderer3D.render(this.scene, this.camera3D);
    }
    
    updateCamera3D(gameClient) {
        if (!this.camera3D) return;
        
        // Converter coordenadas 2D para 3D - invertendo X e Z para isométrico
        const targetX = -this.camera.x;
        const targetZ = -this.camera.y;
        
        // Suavizar a movimentação da câmera
        this.camera3D.position.x += (targetX + 500 - this.camera3D.position.x) * 0.1;
        this.camera3D.position.z += (targetZ + 500 - this.camera3D.position.z) * 0.1;
        
        // Ajustar o zoom da câmera ortográfica
        const zoomFactor = this.camera.zoom * 500;
        const aspect = window.innerWidth / window.innerHeight;
        
        this.camera3D.left = -zoomFactor * aspect;
        this.camera3D.right = zoomFactor * aspect;
        this.camera3D.top = zoomFactor;
        this.camera3D.bottom = -zoomFactor;
        this.camera3D.updateProjectionMatrix();
        
        // Manter a câmera olhando para o centro
        this.camera3D.lookAt(targetX, 0, targetZ);
    }
    
    addEventListeners() {
        // Mouse move para raycasting
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }
    
    loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.assets.images[key] = img;
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }
    
    clear() {
        this.context.fillStyle = '#1a1a2e';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    begin() {
        this.clear();
        this.context.save();
        this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.context.scale(this.camera.zoom, this.camera.zoom);
        this.context.translate(-this.camera.x, -this.camera.y);
    }
    
    end() {
        this.context.restore();
    }
    
    drawImage(key, x, y, width, height, options = {}) {
        const img = this.assets.images[key];
        if (!img) return;
        
        const { rotation = 0, alpha = 1, flipX = false, flipY = false } = options;
        
        this.context.save();
        this.context.translate(x + width / 2, y + height / 2);
        this.context.rotate(rotation);
        this.context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        this.context.globalAlpha = alpha;
        this.context.drawImage(img, -width / 2, -height / 2, width, height);
        this.context.restore();
    }
    
    drawSprite(key, frameX, frameY, x, y, width, height, options = {}) {
        const sprite = this.assets.sprites[key];
        if (!sprite) return;
        
        const { rotation = 0, alpha = 1, flipX = false, flipY = false } = options;
        const frameWidth = sprite.width / sprite.framesX;
        const frameHeight = sprite.height / sprite.framesY;
        
        this.context.save();
        this.context.translate(x + width / 2, y + height / 2);
        this.context.rotate(rotation);
        this.context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        this.context.globalAlpha = alpha;
        this.context.drawImage(
            sprite.image,
            frameX * frameWidth,
            frameY * frameHeight,
            frameWidth,
            frameHeight,
            -width / 2,
            -height / 2,
            width,
            height
        );
        this.context.restore();
    }
    
    drawRect(x, y, width, height, color, options = {}) {
        const { rotation = 0, alpha = 1, fill = true, lineWidth = 1 } = options;
        
        this.context.save();
        this.context.translate(x + width / 2, y + height / 2);
        this.context.rotate(rotation);
        this.context.globalAlpha = alpha;
        
        if (fill) {
            this.context.fillStyle = color;
            this.context.fillRect(-width / 2, -height / 2, width, height);
        } else {
            this.context.strokeStyle = color;
            this.context.lineWidth = lineWidth;
            this.context.strokeRect(-width / 2, -height / 2, width, height);
        }
        
        this.context.restore();
    }
    
    drawCircle(x, y, radius, color, options = {}) {
        const { alpha = 1, fill = true, lineWidth = 1 } = options;
        
        this.context.save();
        this.context.globalAlpha = alpha;
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, Math.PI * 2);
        
        if (fill) {
            this.context.fillStyle = color;
            this.context.fill();
        } else {
            this.context.strokeStyle = color;
            this.context.lineWidth = lineWidth;
            this.context.stroke();
        }
        
        this.context.restore();
    }
    
    drawLine(x1, y1, x2, y2, color, options = {}) {
        const { alpha = 1, lineWidth = 1 } = options;
        
        this.context.save();
        this.context.globalAlpha = alpha;
        this.context.strokeStyle = color;
        this.context.lineWidth = lineWidth;
        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.stroke();
        this.context.restore();
    }
    
    drawText(text, x, y, options = {}) {
        const {
            color = 'white',
            font = '16px Arial',
            align = 'left',
            baseline = 'top',
            alpha = 1,
            maxWidth,
            stroke = false,
            strokeColor = 'black',
            strokeWidth = 1
        } = options;
        
        this.context.save();
        this.context.globalAlpha = alpha;
        this.context.font = font;
        this.context.textAlign = align;
        this.context.textBaseline = baseline;
        
        if (stroke) {
            this.context.strokeStyle = strokeColor;
            this.context.lineWidth = strokeWidth;
            this.context.strokeText(text, x, y, maxWidth);
        }
        
        this.context.fillStyle = color;
        this.context.fillText(text, x, y, maxWidth);
        this.context.restore();
    }
    
    drawTile(tileId, x, y, tileSize, tilesetKey) {
        const tileset = this.assets.images[tilesetKey];
        if (!tileset) return;
        
        const tilesPerRow = Math.floor(tileset.width / tileSize);
        const tileX = (tileId % tilesPerRow) * tileSize;
        const tileY = Math.floor(tileId / tilesPerRow) * tileSize;
        
        this.context.drawImage(
            tileset,
            tileX,
            tileY,
            tileSize,
            tileSize,
            x,
            y,
            tileSize,
            tileSize
        );
    }
    
    drawMinimap(gameState = {}) {
        const ctx = this.context;
        const minimapSize = 150;
        const padding = 10;
        const x = this.canvas.width - minimapSize - padding;
        const y = this.canvas.height - minimapSize - padding;
        
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, minimapSize, minimapSize);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, minimapSize, minimapSize);
        
        if (gameState?.entities) {
            const worldSize = gameState.worldSize || 2000;
            const scale = minimapSize / worldSize;
            
            gameState.entities.forEach(entity => {
                if (entity && entity.position) {
                    ctx.fillStyle = entity.color || '#e94560';
                    const entityX = x + entity.position.x * scale;
                    const entityY = y + entity.position.y * scale;
                    const entitySize = Math.max(3, (entity.size || 5) * scale);
                    
                    ctx.beginPath();
                    ctx.arc(entityX, entityY, entitySize, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            
            const viewportX = x + this.camera.x * scale;
            const viewportY = y + this.camera.y * scale;
            const viewportWidth = (this.canvas.width / this.camera.zoom) * scale;
            const viewportHeight = (this.canvas.height / this.camera.zoom) * scale;
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
        }
        ctx.restore();
    }
    
    createAnimation(key, spriteKey, frames, frameRate) {
        this.assets.animations[key] = {
            spriteKey,
            frames,
            frameRate,
            frameTime: 1000 / frameRate,
            currentFrame: 0,
            elapsed: 0
        };
    }
    
    updateAnimation(key, deltaTime) {
        const animation = this.assets.animations[key];
        if (!animation) return;
        
        animation.elapsed += deltaTime;
        
        if (animation.elapsed >= animation.frameTime) {
            animation.currentFrame = (animation.currentFrame + 1) % animation.frames.length;
            animation.elapsed = 0;
        }
        
        return animation.frames[animation.currentFrame];
    }
    
    drawAnimation(key, x, y, width, height, options = {}) {
        const animation = this.assets.animations[key];
        if (!animation) return;
        
        const frame = animation.frames[animation.currentFrame];
        const sprite = this.assets.sprites[animation.spriteKey];
        
        if (!sprite) return;
        
        this.drawSprite(
            animation.spriteKey,
            frame.x,
            frame.y,
            x,
            y,
            width,
            height,
            options
        );
    }
    
    drawGrid() {
        const ctx = this.context;
        const { width, height } = this.canvas;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        const startX = Math.floor(this.camera.x / this.gridSize) * this.gridSize;
        const startY = Math.floor(this.camera.y / this.gridSize) * this.gridSize;
        const endX = startX + width / this.camera.zoom + this.gridSize;
        const endY = startY + height / this.camera.zoom + this.gridSize;
        
        for (let x = startX; x <= endX; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }
        
        for (let y = startY; y <= endY; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    drawEntity(entity) {
        if (!entity || !entity.position) return;
        
        const ctx = this.context;
        const { x, y } = entity.position;
        let size = entity.size || 20;
        const worldSize = this.gameClient?.worldSize || 5000;
        const perspectiveScale = 1 - (y / worldSize) * 0.5; // Pseudo-3D
        size *= perspectiveScale;

        // Desenhar sombra primeiro
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        if (entity.type === 'townCenter' || entity.type === 'market') {
            const width = (entity.width || size) * perspectiveScale;
            const height = (entity.height || size) * perspectiveScale;
            ctx.ellipse(x, y + height / 2, width / 2, height / 4, 0, 0, Math.PI * 2);
        } else {
            ctx.ellipse(x, y + size / 2, size / 4, size / 8, 0, 0, Math.PI * 2);
        }
        ctx.fill();

        // Desenhar entidade
        if (entity.type === 'villager') {
            ctx.fillStyle = entity.owner === this.gameClient?.playerId ? '#0066cc' : '#cc6600';
            if (entity.gatherState === 'gathering') {
                size *= (1 + Math.sin(entity.gatherTimer * 10) * 0.1); // Animação de coleta
            }
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();

            if (entity.carrying && entity.carrying.amount > 0) {
                ctx.fillStyle = this.getResourceColor(entity.carrying.type);
                ctx.beginPath();
                ctx.arc(x, y - size / 2 - 5, 3 * perspectiveScale, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (entity.type === 'wolf') {
            ctx.fillStyle = entity.color || '#424242';
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (entity.type === 'sheep') {
            ctx.fillStyle = entity.color || '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (entity.type === 'townCenter' || entity.type === 'market') {
            ctx.fillStyle = entity.owner === this.gameClient?.playerId ? '#0066cc' : '#cc0000';
            const width = (entity.width || size) * perspectiveScale;
            const height = (entity.height || size) * perspectiveScale;
            ctx.fillRect(x - width / 2, y - height / 2, width, height);
        } else { // Recursos
            ctx.fillStyle = this.getResourceColor(entity.type);
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2 / this.camera.zoom; // Ajuste da largura da linha com zoom
        ctx.stroke();
        
        if (entity.name) {
            ctx.fillStyle = 'white';
            ctx.font = `${14 / this.camera.zoom}px Arial`; // Ajuste do tamanho da fonte com zoom
            ctx.textAlign = 'center';
            ctx.fillText(entity.name, x, y - size - 5 / this.camera.zoom);
        }
    }

    getResourceColor(type) {
        switch (type) {
            case 'food': return '#8BC34A';
            case 'wood': return '#795548';
            case 'stone': return '#9E9E9E';
            case 'gold': return '#FFC107';
            default: return '#000000';
        }
    }
    
    drawUI(gameState = {}) {
        const ctx = this.context;
        
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${Math.round(gameState.fps || 0)}`, 10, 30);
        ctx.fillText(`Jogadores: ${gameState.playerCount || 0}`, 10, 60);
        this.drawMinimap(gameState);
        ctx.restore();
    }
    
    updateCamera(targetX, targetY) {
        const targetCameraX = targetX - this.canvas.width / (2 * this.camera.zoom);
        const targetCameraY = targetY - this.canvas.height / (2 * this.camera.zoom);
        
        this.camera.x += (targetCameraX - this.camera.x) * 0.1;
        this.camera.y += (targetCameraY - this.camera.y) * 0.1;
    }
    
    setZoom(zoom) {
        this.camera.zoom = Math.max(0.5, Math.min(2, zoom));
    }
}

const gameRenderer = new Renderer(document.getElementById('game-canvas'));

// Para integração com GameClient
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
} else {
    window.Renderer = Renderer;
    // Certifique-se de definir gameRenderer.gameClient após criar o GameClient
    // Exemplo: gameRenderer.gameClient = new GameClient();
}