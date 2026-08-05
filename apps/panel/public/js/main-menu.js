class MainMenu {
    constructor(gameClient) {
        this.gameClient = gameClient;
        this.currentScreen = 'main-menu-screen';
        this.chatMessages = [];
        this.friends = [];
        this.pendingRequests = [];
        this.availableRooms = [];
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Navegação entre telas
        document.getElementById('play-game-option').addEventListener('click', () => {
            this.gameClient.connectToServer();
            this.showScreen('game-screen');
        });
        
        document.getElementById('private-room-option').addEventListener('click', () => {
            this.showScreen('private-room-screen');
            this.loadAvailableRooms();
        });
        
        document.getElementById('shop-option').addEventListener('click', () => {
            this.showScreen('shop-screen');
            this.loadShopItems('skins'); // Carregar categoria padrão
        });
        
        document.getElementById('friends-option').addEventListener('click', () => {
            this.showScreen('friends-screen');
            this.loadFriendsList();
        });
        
        // Botões de voltar
        document.getElementById('back-to-main-menu').addEventListener('click', () => {
            this.showScreen('main-menu-screen');
        });
        
        document.getElementById('back-from-shop').addEventListener('click', () => {
            this.showScreen('main-menu-screen');
        });
        
        document.getElementById('back-from-friends').addEventListener('click', () => {
            this.showScreen('main-menu-screen');
        });
        
        // Chat global
        document.getElementById('send-global-chat').addEventListener('click', () => {
            this.sendChatMessage();
        });
        
        document.getElementById('global-chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
    }
    
    showScreen(screenId) {
        // Esconder todas as telas
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.add('hidden'));
        
        // Mostrar a tela desejada
        document.getElementById(screenId).classList.remove('hidden');
        this.currentScreen = screenId;
    }
    
    sendChatMessage() {
        const input = document.getElementById('global-chat-input');
        const message = input.value.trim();
        
        if (message) {
            // Em um sistema real, isso seria enviado para o servidor
            this.addChatMessage({
                sender: this.gameClient.playerName || 'Você',
                message: message,
                timestamp: new Date()
            });
            
            input.value = '';
        }
    }
    
    addChatMessage(message) {
        this.chatMessages.push(message);
        this.updateChatMessages();
    }
    
    updateChatMessages() {
        const chatContainer = document.getElementById('global-chat-messages');
        
        // Adicionar apenas a nova mensagem
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        
        const latestMessage = this.chatMessages[this.chatMessages.length - 1];
        const time = new Date(latestMessage.timestamp).toLocaleTimeString();
        
        messageElement.innerHTML = `
            <span class="sender">${latestMessage.sender}:</span>
            ${latestMessage.message}
            <span class="timestamp">${time}</span>
        `;
        
        chatContainer.appendChild(messageElement);
        
        // Rolar para a mensagem mais recente
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    loadFriendsList() {
        // Em um sistema real, isso seria carregado do servidor
        // Por enquanto, usamos dados de exemplo
        this.friends = [
            { id: 'friend1', name: 'Jogador1', status: 'online', level: 5 },
            { id: 'friend2', name: 'Jogador2', status: 'offline', level: 3 },
            { id: 'friend3', name: 'Jogador3', status: 'in-game', level: 7 }
        ];
        
        this.updateFriendsList();
    }
    
    updateFriendsList() {
        const friendsContainer = document.getElementById('friends-list-container');
        friendsContainer.innerHTML = '';
        
        if (this.friends.length === 0) {
            friendsContainer.innerHTML = '<div class="no-friends-message">Você ainda não tem amigos adicionados</div>';
            return;
        }
        
        for (const friend of this.friends) {
            const friendElement = document.createElement('div');
            friendElement.className = `friend-item ${friend.status}`;
            
            friendElement.innerHTML = `
                <div class="friend-avatar">
                    <img src="images/avatars/default.png" alt="${friend.name}">
                    <div class="friend-status ${friend.status}"></div>
                </div>
                <div class="friend-info">
                    <h4>${friend.name}</h4>
                    <span class="friend-level">Nível ${friend.level}</span>
                </div>
                <div class="friend-actions">
                    <button class="friend-action message" data-friend-id="${friend.id}">Mensagem</button>
                    <button class="friend-action invite" data-friend-id="${friend.id}">Convidar</button>
                </div>
            `;
            
            friendsContainer.appendChild(friendElement);
        }
    }
}

// Inicializar o menu principal quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se o cliente do jogo já existe
    if (window.gameClient) {
        window.mainMenu = new MainMenu(window.gameClient);
    } else {
        // Se não existir, criar um listener para quando for criado
        document.addEventListener('gameClientReady', () => {
            window.mainMenu = new MainMenu(window.gameClient);
        });
    }
}); 