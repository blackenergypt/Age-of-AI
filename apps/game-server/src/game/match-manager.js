const Match = require('./match');

const PUBLIC_LOBBY_ID = 'PUBLIC';
const EMPTY_MATCH_TTL_MS = 60 * 1000;

class MatchManager {
  constructor() {
    this.matches = new Map();
    this.ensurePublicLobby();
  }

  ensurePublicLobby() {
    if (!this.matches.has(PUBLIC_LOBBY_ID)) {
      const lobby = new Match({
        id: PUBLIC_LOBBY_ID,
        name: 'Lobby Público',
        maxPlayers: 8,
        isPrivate: false,
        hostUserId: null
      });
      this.matches.set(lobby.id, lobby);
      console.log('Lobby público criado');
    }
    return this.matches.get(PUBLIC_LOBBY_ID);
  }

  createMatch({ name, hostUserId, maxPlayers, password, isPrivate = true }) {
    const match = new Match({
      name: name || `Partida de ${hostUserId}`,
      hostUserId,
      maxPlayers,
      password: password || null,
      isPrivate: Boolean(isPrivate)
    });

    this.matches.set(match.id, match);
    console.log(`Partida criada: ${match.id} (${match.name})`);
    return match;
  }

  getMatch(matchId) {
    if (!matchId) return null;
    return this.matches.get(String(matchId).toUpperCase()) || null;
  }

  listMatches({ includePrivate = false } = {}) {
    return Array.from(this.matches.values())
      .filter((match) => includePrivate || !match.isPrivate)
      .filter((match) => match.status !== 'finished')
      .map((match) => match.getInfo());
  }

  findMatchByPlayerId(playerId) {
    for (const match of this.matches.values()) {
      if (match.game.players.has(playerId)) {
        return match;
      }
    }
    return null;
  }

  findMatchByUserId(userId) {
    const userIdStr = String(userId);
    for (const match of this.matches.values()) {
      for (const player of match.game.players.values()) {
        if (player.userId && String(player.userId) === userIdStr) {
          return { match, player };
        }
      }
    }
    return null;
  }

  joinMatch(matchId, { playerId, playerName, kingdomName, userId, password }) {
    const match = this.getMatch(matchId);
    if (!match) {
      return { ok: false, code: 'MATCH_NOT_FOUND', message: 'Partida não encontrada.' };
    }

    const canJoin = match.canJoin(password);
    if (!canJoin.ok) return canJoin;

    // Evitar o mesmo userId duas vezes na mesma partida
    for (const player of match.game.players.values()) {
      if (player.userId && String(player.userId) === String(userId)) {
        return {
          ok: false,
          code: 'ALREADY_IN_MATCH',
          message: 'Já estás nesta partida.',
          match,
          player
        };
      }
    }

    const player = match.game.addPlayer(playerId, playerName, kingdomName, String(userId));
    match.markPlaying();

    return { ok: true, match, player };
  }

  leaveMatch(playerId) {
    const match = this.findMatchByPlayerId(playerId);
    if (!match) return null;

    match.game.removePlayer(playerId);
    match.markEmptyIfNeeded();
    return match;
  }

  getOnlinePlayersCount() {
    let total = 0;
    for (const match of this.matches.values()) {
      total += match.playerCount;
    }
    return total;
  }

  getKingdomsCount() {
    let total = 0;
    for (const match of this.matches.values()) {
      total += match.game.getKingdomsCount();
    }
    return total;
  }

  getMatchCount() {
    return this.matches.size;
  }

  updateAll(onMatchUpdate) {
    for (const match of this.matches.values()) {
      if (match.playerCount === 0) continue;
      try {
        match.game.update();
        if (typeof onMatchUpdate === 'function') {
          onMatchUpdate(match);
        }
      } catch (error) {
        console.error(`Erro ao atualizar partida ${match.id}:`, error);
      }
    }

    this.cleanupEmptyMatches();
  }

  cleanupEmptyMatches() {
    const now = Date.now();
    for (const [id, match] of this.matches.entries()) {
      if (id === PUBLIC_LOBBY_ID) {
        match.markEmptyIfNeeded();
        continue;
      }

      if (match.playerCount === 0) {
        if (!match.emptySince) {
          match.emptySince = now;
        } else if (now - match.emptySince > EMPTY_MATCH_TTL_MS) {
          this.matches.delete(id);
          console.log(`Partida removida por inatividade: ${id}`);
        }
      }
    }

    this.ensurePublicLobby();
  }

  setWebSocketServer(wss) {
    this.websocketServer = wss;
    for (const match of this.matches.values()) {
      match.game.setWebSocketServer(wss);
    }
  }
}

module.exports = MatchManager;
module.exports.PUBLIC_LOBBY_ID = PUBLIC_LOBBY_ID;
