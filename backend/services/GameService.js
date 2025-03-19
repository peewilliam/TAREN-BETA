const Player = require('../models/Player');
const config = require('../config');

class GameService {
  constructor() {
    this.players = new Map();
    this.lastUpdate = new Date();
  }

  // Adicionar um novo jogador
  addPlayer(socketId, name = null) {
    const player = new Player(socketId, name);
    this.players.set(socketId, player);
    return player;
  }

  // Remover um jogador
  removePlayer(socketId) {
    if (!this.players.has(socketId)) return false;
    return this.players.delete(socketId);
  }

  // Atualizar a posição de um jogador
  updatePlayerPosition(socketId, position) {
    const player = this.players.get(socketId);
    if (!player) return false;
    
    return player.updatePosition(position);
  }

  // Obter um jogador pelo ID
  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  // Obter todos os jogadores
  getAllPlayers() {
    return Array.from(this.players.values()).map(player => player.serialize());
  }

  // Criar uma mensagem de chat
  createChatMessage(socketId, content) {
    const player = this.players.get(socketId);
    if (!player) return null;
    
    return Player.createChatMessage(player, content);
  }

  // Obter estatísticas do jogo
  getGameStats() {
    return {
      playersCount: this.players.size,
      worldSize: config.game.worldSize,
      uptime: Math.floor((new Date() - this.lastUpdate) / 1000)
    };
  }

  // Verificar jogadores inativos (para futura implementação de timeout)
  checkInactivePlayers(maxInactivityTime = 300000) { // 5 minutos em ms
    const now = new Date();
    const inactivePlayers = [];
    
    this.players.forEach((player, socketId) => {
      const inactiveTime = now - player.lastActivity;
      if (inactiveTime > maxInactivityTime) {
        inactivePlayers.push(socketId);
      }
    });
    
    return inactivePlayers;
  }
}

// Singleton para garantir uma única instância do serviço
const gameService = new GameService();
module.exports = gameService; 