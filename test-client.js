const WebSocket = require('ws');

// Conectar ao servidor WebSocket
const ws = new WebSocket('ws://localhost:3000');

ws.on('open', function open() {
  console.log('🔗 Conectado ao servidor WebSocket');
  
  // Enviar mensagem para entrar no jogo
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'join_game',
      data: {
        playerName: 'TestPlayer',
        kingdomName: 'TestKingdom'
      }
    }));
  }, 1000);
});

ws.on('message', function message(data) {
  const msg = JSON.parse(data);
  console.log('📨 Mensagem recebida:', msg.type);
  
  if (msg.type === 'connection') {
    console.log('🆔 Client ID:', msg.data.clientId);
    console.log('📊 Stats:', msg.data.stats);
  }
  
  if (msg.type === 'game_state') {
    console.log('🎮 Estado do jogo recebido');
    console.log('- Jogadores:', msg.data.players?.length || 0);
    console.log('- Reinos:', msg.data.kingdoms?.length || 0);
    console.log('- Entidades:', msg.data.entities?.length || 0);
    console.log('- Recursos:', msg.data.resources?.length || 0);
  }
  
  if (msg.type === 'game_update') {
    console.log('🔄 Atualização do jogo recebida');
  }
});

ws.on('close', function close() {
  console.log('❌ Desconectado do servidor WebSocket');
});

ws.on('error', function error(err) {
  console.error('❌ Erro no WebSocket:', err.message);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Fechando conexão...');
  ws.close();
  process.exit(0);
});
