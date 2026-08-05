const {
  tryRedis,
  registerNode,
  unregisterNode,
  REGISTRY
} = require('@age-of-ai/shared');

/**
 * Mantém este game-server registado no Redis com heartbeat.
 */
function startNodeRegistry({
  redisUrl,
  getSnapshot,
  onStatus
}) {
  let redis = null;
  let timer = null;
  let stopped = false;

  async function beat() {
    if (stopped) return;
    try {
      if (!redis) {
        redis = await tryRedis(redisUrl);
        if (!redis) {
          onStatus?.('offline');
          return;
        }
        onStatus?.('online');
      }

      const snapshot = getSnapshot();
      await registerNode(redis, snapshot);
    } catch (error) {
      console.warn('[registry] heartbeat falhou:', error.message);
      redis = null;
      onStatus?.('error');
    }
  }

  beat();
  timer = setInterval(beat, REGISTRY.HEARTBEAT_INTERVAL_MS);

  async function stop() {
    stopped = true;
    if (timer) clearInterval(timer);
    if (!redis) return;
    try {
      const snapshot = getSnapshot();
      await unregisterNode(redis, snapshot.nodeId);
    } catch (_) {
      // ignore
    }
  }

  return { stop, beat };
}

module.exports = { startNodeRegistry };
