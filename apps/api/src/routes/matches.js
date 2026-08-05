const express = require('express');
const { verifyAccessToken } = require('../utils/jwt');
const config = require('../config');
const {
  tryRedis,
  listNodes,
  pickLeastLoaded
} = require('@age-of-ai/shared');

const router = express.Router();

function authOptional(req, _res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded) req.user = decoded;
  }
  next();
}

function authRequired(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Token inválido ou em falta' });
  }
  req.user = decoded;
  next();
}

async function getLiveNodes() {
  const redis = await tryRedis(config.redis.url);
  if (!redis) return [];
  return listNodes(redis);
}

function fallbackNode() {
  return {
    nodeId: 'fallback',
    wsUrl: config.gameServer.publicWsUrl,
    onlinePlayers: 0,
    matches: 0,
    maxPlayers: 200,
    source: 'env'
  };
}

router.get('/game-servers', authOptional, async (_req, res) => {
  try {
    const nodes = await getLiveNodes();
    res.json({
      nodes,
      count: nodes.length,
      fallback: nodes.length ? null : fallbackNode()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar game-servers' });
  }
});

router.get('/game-server', authOptional, async (_req, res) => {
  try {
    const nodes = await getLiveNodes();
    const picked = pickLeastLoaded(nodes) || fallbackNode();
    res.json({
      ...picked,
      note: 'Liga o cliente WebSocket a wsUrl após autenticar'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao obter game-server' });
  }
});

/**
 * Matchmaking: escolhe um nó e diz ao cliente como entrar.
 * A partida em si é criada/joined no game-server via WS.
 */
router.post('/matches', authRequired, async (req, res) => {
  try {
    const {
      mode = 'public',
      name = null,
      maxPlayers = 4,
      password = null,
      matchId = null,
      kingdomName = null
    } = req.body || {};

    const nodes = await getLiveNodes();
    const node = pickLeastLoaded(nodes) || fallbackNode();

    if (!node?.wsUrl) {
      return res.status(503).json({ message: 'Nenhum game-server disponível' });
    }

    let action = 'join_game';
    const joinPayload = {
      kingdomName
    };

    if (matchId) {
      action = 'join_match';
      joinPayload.matchId = matchId;
      if (password) joinPayload.password = password;
    } else if (mode === 'private') {
      action = 'create_match';
      joinPayload.name = name || `Partida de ${req.user.username || req.user.email || 'Jogador'}`;
      joinPayload.maxPlayers = maxPlayers;
      joinPayload.password = password;
      joinPayload.isPrivate = true;
      if (kingdomName) joinPayload.kingdomName = kingdomName;
    }

    res.status(201).json({
      nodeId: node.nodeId,
      wsUrl: node.wsUrl,
      action,
      joinPayload,
      load: {
        onlinePlayers: node.onlinePlayers,
        matches: node.matches,
        maxPlayers: node.maxPlayers
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no matchmaking' });
  }
});

module.exports = router;
