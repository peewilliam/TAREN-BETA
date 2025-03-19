const config = require('../config');

// Níveis de log
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Nível de log atual
const currentLogLevel = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.INFO 
  : LOG_LEVELS.DEBUG;

// Função de formatação de data
const getTimestamp = () => {
  return new Date().toISOString();
};

// Funções de log
const error = (...args) => {
  if (currentLogLevel >= LOG_LEVELS.ERROR) {
    console.error(`[${getTimestamp()}] [ERROR]`, ...args);
  }
};

const warn = (...args) => {
  if (currentLogLevel >= LOG_LEVELS.WARN) {
    console.warn(`[${getTimestamp()}] [WARN]`, ...args);
  }
};

const info = (...args) => {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.info(`[${getTimestamp()}] [INFO]`, ...args);
  }
};

const debug = (...args) => {
  if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    console.debug(`[${getTimestamp()}] [DEBUG]`, ...args);
  }
};

// Logger para eventos do jogo
const game = {
  playerJoined: (player) => {
    info(`Jogador conectado: ${player.name} (${player.id}) na posição ${JSON.stringify(player.position)}`);
  },
  playerLeft: (player) => {
    info(`Jogador desconectado: ${player.name} (${player.id})`);
  },
  playerMoved: (player, oldPosition, newPosition) => {
    debug(`Jogador ${player.name} moveu-se de ${JSON.stringify(oldPosition)} para ${JSON.stringify(newPosition)}`);
  },
  chatMessage: (message) => {
    debug(`Chat: ${message.playerName}: ${message.message}`);
  }
};

module.exports = {
  error,
  warn,
  info,
  debug,
  game
}; 