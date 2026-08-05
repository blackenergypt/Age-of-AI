const WebSocket = require('ws');
const { signAccessToken } = require('./server/utils/jwt');

function makeToken(id, name) {
  return signAccessToken({
    id,
    email: `${id}@ageofai.local`,
    role: 'user',
    username: name
  });
}

function connectPlayer({ id, name, action }) {
  return new Promise((resolve, reject) => {
    const token = makeToken(id, name);
    const ws = new WebSocket('ws://localhost:3000');
    const result = { name, events: [] };

    const timer = setTimeout(() => {
      ws.close();
      reject(new Error(`Timeout para ${name}`));
    }, 8000);

    ws.on('open', () => {
      console.log(`🔗 ${name} conectado`);
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      result.events.push(msg.type);
      console.log(`📨 ${name}:`, msg.type);

      if (msg.type === 'connection') {
        action(ws, token, msg);
      }

      if (msg.type === 'match_joined') {
        result.match = msg.data.match;
        console.log(`🎮 ${name} na partida ${msg.data.match.id} (${msg.data.match.name})`);
      }

      if (msg.type === 'game_state') {
        result.gameState = {
          matchId: msg.data.matchId,
          players: msg.data.players?.length || 0,
          playerNames: msg.data.players?.map((p) => p.name)
        };
        console.log(`📦 ${name} estado:`, result.gameState);
        clearTimeout(timer);
        resolve({ ws, result });
      }

      if (msg.type === 'match_error' || msg.type === 'auth_error') {
        clearTimeout(timer);
        reject(new Error(`${name}: ${msg.data?.message || msg.type}`));
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

(async () => {
  try {
    // Jogador A cria partida privada
    const a = await connectPlayer({
      id: 'user-a',
      name: 'Alice',
      action: (ws, token) => {
        ws.send(JSON.stringify({
          type: 'create_match',
          data: {
            token,
            name: 'Sala Teste',
            maxPlayers: 4,
            playerName: 'Alice',
            kingdomName: 'Norte'
          }
        }));
      }
    });

    const matchId = a.result.match.id;

    // Jogador B entra na mesma partida
    const b = await connectPlayer({
      id: 'user-b',
      name: 'Bob',
      action: (ws, token) => {
        ws.send(JSON.stringify({
          type: 'join_match',
          data: {
            token,
            matchId,
            playerName: 'Bob',
            kingdomName: 'Sul'
          }
        }));
      }
    });

    // Jogador C vai ao lobby público (mundo isolado)
    const c = await connectPlayer({
      id: 'user-c',
      name: 'Carol',
      action: (ws, token) => {
        ws.send(JSON.stringify({
          type: 'join_game',
          data: {
            token,
            playerName: 'Carol'
          }
        }));
      }
    });

    console.log('\n✅ Resultado:');
    console.log('- Partida privada:', matchId);
    console.log('- Alice players:', a.result.gameState.players, a.result.gameState.playerNames);
    console.log('- Bob players:', b.result.gameState.players, b.result.gameState.playerNames);
    console.log('- Carol lobby:', c.result.gameState.matchId, c.result.gameState.playerNames);

    const isolated =
      a.result.gameState.matchId === matchId &&
      b.result.gameState.matchId === matchId &&
      c.result.gameState.matchId === 'PUBLIC' &&
      !c.result.gameState.playerNames.includes('Alice');

    console.log(isolated ? '✅ Rooms isoladas OK' : '❌ Isolamento falhou');

    a.ws.close();
    b.ws.close();
    c.ws.close();
    process.exit(isolated ? 0 : 1);
  } catch (error) {
    console.error('❌', error.message);
    process.exit(1);
  }
})();
