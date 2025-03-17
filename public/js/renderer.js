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
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
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