class UIManager {
    constructor(gameClient) {
        this.gameClient = gameClient;
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapContext = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
        this.resourceCounts = {
            food: document.getElementById('food-count'),
            wood: document.getElementById('wood-count'),
            stone: document.getElementById('stone-count'),
            gold: document.getElementById('gold-count')
        };
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatSendButton = document.getElementById('chat-send');
        this.actionButtons = document.getElementById('action-buttons');
        this.notificationArea = document.getElementById('notification-area');
        this.notifications = [];
        
        this.initializeUI();
    }
    
    initializeUI() {
        // Configurar o minimap
        if (this.minimapCanvas) {
            this.minimapCanvas.width = 200;
            this.minimapCanvas.height = 200;
        }
        
        // Configurar o chat
        if (this.chatSendButton && this.chatInput) {
            this.chatSendButton.addEventListener('click', () => {
                this.sendChatMessage();
            });
            
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }
        
        // Esconder a tela de carregamento após um breve atraso
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 1500);
    }
    
    update(deltaTime) {
        // Atualizar notificações
        this.updateNotifications(deltaTime);
        
        // Atualizar minimap
        this.updateMinimap();
    }
    
    updateResources(resources) {
        if (!resources) return;
        
        // Atualizar contadores de recursos
        for (const [resource, value] of Object.entries(resources)) {
            const element = this.resourceCounts[resource];
            if (element) {
                element.textContent = value;
            }
        }
    }
    
    updateMinimap() {
        // Verificar se o minimap existe
        if (!this.minimapContext || !this.minimapCanvas) return;
        
        // Limpar o minimap
        this.minimapContext.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
        
        // Desenhar fundo
        this.minimapContext.fillStyle = '#1a1a2e';
        this.minimapContext.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
        
        // Obter dados do mundo
        const gameState = this.gameClient.gameState || {};
        const entities = gameState.entities || [];
        const worldSize = gameState.worldSize || 2000;
        
        // Calcular escala
        const scale = this.minimapCanvas.width / worldSize;
        
        // Desenhar entidades
        entities.forEach(entity => {
            if (!entity || !entity.position) return;
            
            this.minimapContext.fillStyle = entity.color || '#e94560';
            const x = entity.position.x * scale;
            const y = entity.position.y * scale;
            const size = Math.max(2, (entity.size || 5) * scale);
            
            this.minimapContext.beginPath();
            this.minimapContext.arc(x, y, size, 0, Math.PI * 2);
            this.minimapContext.fill();
        });
        
        // Desenhar área visível da câmera
        if (this.gameClient.renderer && this.gameClient.renderer.camera) {
            const camera = this.gameClient.renderer.camera;
            const viewportX = camera.x * scale;
            const viewportY = camera.y * scale;
            const viewportWidth = (this.gameClient.renderer.canvas.width / camera.zoom) * scale;
            const viewportHeight = (this.gameClient.renderer.canvas.height / camera.zoom) * scale;
            
            this.minimapContext.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.minimapContext.lineWidth = 1;
            this.minimapContext.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
        }
    }
    
    sendChatMessage() {
        const message = this.chatInput.value.trim();
        if (message) {
            this.gameClient.sendChatMessage(message);
            this.chatInput.value = '';
        }
    }
    
    addChatMessage(sender, message, type = 'normal') {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <span class="chat-time">[${timestamp}]</span>
            <span class="chat-sender">${sender}:</span>
            <span class="chat-text">${message}</span>
        `;
        
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.notificationArea.appendChild(notification);
        
        // Adicionar à lista de notificações
        this.notifications.push({
            element: notification,
            expires: Date.now() + duration
        });
        
        // Configurar remoção automática
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                // Remover da lista de notificações
                this.notifications = this.notifications.filter(n => n.element !== notification);
            }, 500);
        }, duration);
    }
    
    updateActionButtons(actions) {
        // Limpar botões existentes
        this.actionButtons.innerHTML = '';
        
        // Adicionar novos botões
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'action-button';
            button.dataset.action = action.id;
            
            if (action.icon) {
                button.innerHTML = `<img src="images/${action.icon}" alt="${action.name}">`;
            } else {
                button.textContent = action.name;
            }
            
            if (action.tooltip) {
                button.title = action.tooltip;
            }
            
            if (action.disabled) {
                button.disabled = true;
                button.classList.add('disabled');
            }
            
            button.addEventListener('click', () => {
                if (!action.disabled) {
                    this.gameClient.performAction(action.id);
                }
            });
            
            this.actionButtons.appendChild(button);
        });
    }
    
    updateNotifications(deltaTime) {
        // Atualizar notificações
        const now = Date.now();
        this.notifications = this.notifications.filter(notification => {
            if (notification.expires <= now) {
                notification.element.classList.add('fade-out');
                setTimeout(() => {
                    if (notification.element.parentNode) {
                        notification.element.parentNode.removeChild(notification.element);
                    }
                }, 500);
                return false;
            }
            return true;
        });
    }
} 