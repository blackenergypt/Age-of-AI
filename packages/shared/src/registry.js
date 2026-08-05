const { createClient } = require('redis');

const REGISTRY = {
  NODES_SET: 'aoai:gs:nodes',
  nodeKey: (nodeId) => `aoai:gs:node:${nodeId}`,
  HEARTBEAT_TTL_SEC: 15,
  HEARTBEAT_INTERVAL_MS: 5000
};

let client = null;
let connectPromise = null;

async function getRedis(redisUrl) {
  if (client?.isOpen) return client;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    const url = redisUrl || process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const c = createClient({ url });
    c.on('error', (err) => {
      console.warn('[redis]', err.message);
    });
    await c.connect();
    client = c;
    return client;
  })().catch((err) => {
    connectPromise = null;
    throw err;
  });

  return connectPromise;
}

async function tryRedis(redisUrl) {
  try {
    return await getRedis(redisUrl);
  } catch (error) {
    console.warn(`[redis] indisponível: ${error.message}`);
    return null;
  }
}

function parseNode(hash) {
  if (!hash || !hash.nodeId) return null;
  return {
    nodeId: hash.nodeId,
    wsUrl: hash.wsUrl,
    httpUrl: hash.httpUrl || null,
    onlinePlayers: Number(hash.onlinePlayers || 0),
    matches: Number(hash.matches || 0),
    maxPlayers: Number(hash.maxPlayers || 200),
    updatedAt: Number(hash.updatedAt || 0)
  };
}

async function registerNode(redis, node) {
  const key = REGISTRY.nodeKey(node.nodeId);
  const payload = {
    nodeId: node.nodeId,
    wsUrl: node.wsUrl,
    httpUrl: node.httpUrl || '',
    onlinePlayers: String(node.onlinePlayers ?? 0),
    matches: String(node.matches ?? 0),
    maxPlayers: String(node.maxPlayers ?? 200),
    updatedAt: String(Date.now())
  };

  await redis.hSet(key, payload);
  await redis.expire(key, REGISTRY.HEARTBEAT_TTL_SEC);
  await redis.sAdd(REGISTRY.NODES_SET, node.nodeId);
}

async function unregisterNode(redis, nodeId) {
  await redis.del(REGISTRY.nodeKey(nodeId));
  await redis.sRem(REGISTRY.NODES_SET, nodeId);
}

async function listNodes(redis) {
  const ids = await redis.sMembers(REGISTRY.NODES_SET);
  const nodes = [];

  for (const id of ids) {
    const hash = await redis.hGetAll(REGISTRY.nodeKey(id));
    const node = parseNode(hash);
    if (!node) {
      await redis.sRem(REGISTRY.NODES_SET, id);
      continue;
    }
    if (Date.now() - node.updatedAt > REGISTRY.HEARTBEAT_TTL_SEC * 1000) {
      await unregisterNode(redis, id);
      continue;
    }
    nodes.push(node);
  }

  return nodes;
}

/** Escolhe o nó com mais capacidade livre (menos load). */
function pickLeastLoaded(nodes) {
  if (!nodes?.length) return null;

  const scored = nodes
    .map((n) => {
      const capacity = Math.max(n.maxPlayers, 1);
      const load = n.onlinePlayers / capacity;
      return { node: n, load, free: capacity - n.onlinePlayers };
    })
    .filter((x) => x.free > 0)
    .sort((a, b) => a.load - b.load || a.node.onlinePlayers - b.node.onlinePlayers);

  return scored[0]?.node || null;
}

module.exports = {
  REGISTRY,
  getRedis,
  tryRedis,
  registerNode,
  unregisterNode,
  listNodes,
  pickLeastLoaded
};
