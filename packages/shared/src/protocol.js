/** Mensagens WebSocket e constantes partilhadas */

const WS_MESSAGE = {
  CONNECTION: 'connection',
  AUTH_ERROR: 'auth_error',
  MATCH_ERROR: 'match_error',
  JOIN_GAME: 'join_game',
  JOIN_MATCH: 'join_match',
  CREATE_MATCH: 'create_match',
  LEAVE_MATCH: 'leave_match',
  LIST_MATCHES: 'list_matches',
  MATCHES_LIST: 'matches_list',
  MATCH_JOINED: 'match_joined',
  MATCH_LEFT: 'match_left',
  GAME_STATE: 'game_state',
  GAME_UPDATE: 'game_update',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  COMMAND: 'command',
  EVENT: 'event'
};

const PUBLIC_LOBBY_ID = 'PUBLIC';

module.exports = {
  WS_MESSAGE,
  PUBLIC_LOBBY_ID
};
