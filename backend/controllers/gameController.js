const gameService = require('../services/GameService');

// Obter informações de saúde do servidor
exports.getHealth = (req, res) => {
  res.json({
    status: 'ok',
    players: gameService.players.size,
    uptime: process.uptime()
  });
};

// Obter lista de jogadores
exports.getPlayers = (req, res) => {
  res.json({
    count: gameService.players.size,
    players: gameService.getAllPlayers()
  });
};

// Obter informações do mundo do jogo
exports.getGameInfo = (req, res) => {
  res.json({
    worldSize: require('../config').game.worldSize,
    playerCount: gameService.players.size,
    stats: gameService.getGameStats()
  });
};

// Obter informações de um jogador específico
exports.getPlayerById = (req, res) => {
  const player = gameService.getPlayer(req.params.id);
  
  if (!player) {
    return res.status(404).json({ error: 'Jogador não encontrado' });
  }
  
  res.json(player.serialize());
}; 