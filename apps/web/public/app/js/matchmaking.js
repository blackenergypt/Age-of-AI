/**
 * Resolve nó de jogo via API (Redis registry / fallback).
 */
function getAuthToken() {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

function getApiBase() {
  if (typeof window.getApiBase === 'function') {
    return window.getApiBase();
  }
  return (window.CONFIG && CONFIG.api && CONFIG.api.baseUrl) || window.AGE_API_URL || 'http://localhost:3001';
}

/**
 * @param {{ matchId?: string, mode?: string, name?: string, maxPlayers?: number, password?: string, kingdomName?: string }} intent
 * @returns {Promise<{ nodeId: string, wsUrl: string, action: string, joinPayload: object, load?: object }>}
 */
async function resolveMatchmaking(intent = {}) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Sem token JWT');
  }

  const body = intent.matchId
    ? {
        matchId: intent.matchId,
        password: intent.password || null,
        kingdomName: intent.kingdomName || null
      }
    : intent.mode === 'private'
      ? {
          mode: 'private',
          name: intent.name,
          maxPlayers: intent.maxPlayers || 4,
          password: intent.password || null,
          kingdomName: intent.kingdomName || null
        }
      : {
          mode: 'public',
          kingdomName: intent.kingdomName || null
        };

  const res = await fetch(`${getApiBase()}/api/matches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Matchmaking falhou (${res.status})`);
  }

  if (!data.wsUrl || !data.action) {
    throw new Error('Resposta de matchmaking inválida');
  }

  return data;
}

/**
 * Fallback: só pede o melhor nó; o cliente monta a action localmente.
 */
async function resolveGameServer() {
  const token = getAuthToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${getApiBase()}/api/game-server`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.wsUrl) {
    throw new Error(data.message || 'Nenhum game-server disponível');
  }
  return data;
}

window.AgeMatchmaking = {
  getAuthToken,
  getApiBase,
  resolveMatchmaking,
  resolveGameServer
};
