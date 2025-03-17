class GameClient {
  constructor() {
    this.socket = null;
    this.clientId = null;
    this.gameState = null;
    this.playerName = '';
    this.playerId = null;
    this.kingdomName = null;
  }
  
  connectToServer() {
    // Usar o protocolo wss para HTTPS e ws para HTTP
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log('Conectado ao servidor');
    };
    
    this.socket.onmessage = (event) => {
      this.handleServerMessage(JSON.parse(event.data));
    };
    
    this.socket.onclose = () => {
      console.log('Desconectado do servidor');
      alert('Conexão com o servidor perdida. Recarregue a página para reconectar.');
    };
    
    this.socket.onerror = (error) => {
      console.error('Erro na conexão WebSocket:', error);
    };
  }
  
  handleServerMessage(message) {
    switch (message.type) {
      case 'connection':
        this.clientId = message.data.clientId;
        
        // Atualizar contadores de jogadores e reinos em todas as telas
        if (message.data.stats) {
          const onlinePlayersElements = document.querySelectorAll('[id^="online-players"]');
          const kingdomsCountElements = document.querySelectorAll('[id^="kingdoms-count"]');
          
          onlinePlayersElements.forEach(el => {
            el.textContent = message.data.stats.onlinePlayers;
          });
          
          kingdomsCountElements.forEach(el => {
            el.textContent = message.data.stats.kingdoms;
          });
        }
        
        this.joinGame();
        break;
        
      case 'game_state':
        this.gameState = message.data;
        this.showGameScreen();
        gameRenderer.initialize();
        break;
        
      case 'game_update':
        this.gameState = message.data;
        gameRenderer.render();
        this.updateUI();
        break;
        
      case 'player_joined':
        console.log(`Jogador entrou: ${message.data.player.name}`);
        
        // Atualizar contadores
        document.getElementById('online-players').textContent = message.data.onlinePlayers;
        document.getElementById('kingdoms-count').textContent = message.data.kingdoms;
        break;
    }
  }
  
  joinGame() {
    this.socket.send(JSON.stringify({
      type: 'join_game',
      data: {
        playerName: this.playerName,
        kingdomName: this.kingdomName || null
      }
    }));
  }
  
  showGameScreen() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    // Encontrar o ID do jogador
    for (const player of this.gameState.players) {
      if (player.name === this.playerName) {
        this.playerId = player.id;
        break;
      }
    }
  }
  
  showKingdomInfo() {
    if (!this.gameState || !this.playerId) return;
    
    const player = this.gameState.players.find(p => p.id === this.playerId);
    if (!player || !player.kingdomId) return;
    
    const kingdom = this.gameState.kingdoms.find(k => k.id === player.kingdomId);
    if (!kingdom) return;
    
    // Criar ou atualizar o elemento de informações do reino
    let kingdomInfo = document.getElementById('kingdom-info');
    
    if (!kingdomInfo) {
      kingdomInfo = document.createElement('div');
      kingdomInfo.id = 'kingdom-info';
      document.getElementById('game-screen').appendChild(kingdomInfo);
    }
    
    kingdomInfo.innerHTML = `
      <div class="kingdom-header">
        <div class="kingdom-color" style="background-color: ${kingdom.color}"></div>
        <div class="kingdom-name">${kingdom.name}</div>
      </div>
      <div class="kingdom-members">
        ${kingdom.memberCount} membros
      </div>
      ${player.isKingdomLeader ? '<div class="kingdom-leader-badge">👑 Líder</div>' : ''}
    `;
  }
  
  updateUI() {
    if (!this.gameState) return;
    
    // Encontrar o jogador atual
    const player = this.gameState.players.find(p => p.id === this.playerId);
    if (!player) return;
    
    // Atualizar recursos
    document.getElementById('food-amount').textContent = player.resources.food;
    document.getElementById('wood-amount').textContent = player.resources.wood;
    document.getElementById('stone-amount').textContent = player.resources.stone;
    document.getElementById('gold-amount').textContent = player.resources.gold;
    document.getElementById('population').textContent = `${player.population}/${player.populationCap}`;
    
    // Mostrar informações do reino
    this.showKingdomInfo();
  }
  
  sendCommand(command) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    
    this.socket.send(JSON.stringify({
      type: 'command',
      data: command
    }));
  }
  
  // Adicionar método para carregar estatísticas do servidor
  loadGameStats() {
    // Fazer requisição para obter estatísticas do jogo
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            // Atualizar estatísticas na tela de boas-vindas
            document.getElementById('online-players-welcome').textContent = data.onlinePlayers || 0;
            document.getElementById('kingdoms-count-welcome').textContent = data.kingdoms || 0;
            document.getElementById('registered-users-count').textContent = data.registeredUsers || 0;
            document.getElementById('discord-members-count').textContent = data.discordMembers || 0;
        })
        .catch(error => {
            console.error('Erro ao carregar estatísticas:', error);
            // Definir valores padrão em caso de erro
            document.getElementById('online-players-welcome').textContent = '0';
            document.getElementById('kingdoms-count-welcome').textContent = '0';
            document.getElementById('registered-users-count').textContent = '0';
            document.getElementById('discord-members-count').textContent = '0';
        });
  }
}

// Inicializar o cliente
const gameClient = new GameClient(); 