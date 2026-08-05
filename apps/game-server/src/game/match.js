const { v4: uuidv4 } = require('uuid');
const Game = require('./game');
const config = require('../config');

class Match {
  constructor(options = {}) {
    this.id = options.id || uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
    this.name = options.name || `Partida ${this.id}`;
    this.hostUserId = options.hostUserId ? String(options.hostUserId) : null;
    this.maxPlayers = Math.min(Math.max(Number(options.maxPlayers) || 4, 2), 8);
    this.isPrivate = Boolean(options.isPrivate);
    this.password = options.password || null;
    this.status = 'waiting'; // waiting | playing | finished
    this.createdAt = Date.now();
    this.emptySince = null;

    this.game = new Game({
      worldWidth: options.worldWidth || config.game.worldWidth,
      worldHeight: options.worldHeight || config.game.worldHeight,
      maxPlayersPerKingdom: options.maxPlayersPerKingdom || config.game.maxPlayersPerKingdom
    });
    this.game.matchId = this.id;
  }

  get playerCount() {
    return this.game.getOnlinePlayersCount();
  }

  isFull() {
    return this.playerCount >= this.maxPlayers;
  }

  canJoin(password = null) {
    if (this.status === 'finished') {
      return { ok: false, code: 'MATCH_FINISHED', message: 'Esta partida já terminou.' };
    }
    if (this.isFull()) {
      return { ok: false, code: 'MATCH_FULL', message: 'A partida está cheia.' };
    }
    if (this.password && this.password !== password) {
      return { ok: false, code: 'BAD_PASSWORD', message: 'Senha da partida incorreta.' };
    }
    return { ok: true };
  }

  markPlaying() {
    if (this.status === 'waiting' && this.playerCount > 0) {
      this.status = 'playing';
    }
    this.emptySince = null;
  }

  markEmptyIfNeeded() {
    if (this.playerCount === 0) {
      this.emptySince = this.emptySince || Date.now();
      if (this.status === 'playing') {
        this.status = 'waiting';
      }
    } else {
      this.emptySince = null;
    }
  }

  getInfo() {
    return {
      id: this.id,
      name: this.name,
      hostUserId: this.hostUserId,
      maxPlayers: this.maxPlayers,
      playerCount: this.playerCount,
      isPrivate: this.isPrivate,
      hasPassword: Boolean(this.password),
      status: this.status,
      createdAt: this.createdAt,
      kingdoms: this.game.getKingdomsCount()
    };
  }
}

module.exports = Match;
