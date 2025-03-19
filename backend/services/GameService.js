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
  
  // Mudar a cena de um jogador
  changePlayerScene(socketId, sceneName) {
    const player = this.players.get(socketId);
    if (!player) return false;
    
    const success = player.changeScene(sceneName);
    
    if (success) {
      // Atualizar timestamp de atividade
      player.lastActivity = new Date();
      
      // Fazer log da mudança de cena
      console.log(`Jogador ${player.name} (${socketId}) mudou para a cena: ${sceneName}`);
      console.log(`Nova posição: (${player.position.x}, ${player.position.y})`);
    }
    
    return success;
  }

  // Obter um jogador pelo ID
  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  // Obter todos os jogadores
  getAllPlayers() {
    return Array.from(this.players.values()).map(player => player.serialize());
  }
  
  // Obter jogadores em uma cena específica
  getPlayersInScene(sceneName) {
    return Array.from(this.players.values())
      .filter(player => player.sceneName === sceneName)
      .map(player => player.serialize());
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
  
  // Obter estatísticas de cenas
  getSceneStats() {
    const stats = {};
    const scenes = ['main', 'dungeon-fire', 'dungeon-ice', 'arena'];
    
    scenes.forEach(sceneName => {
      const playersInScene = this.getPlayersInScene(sceneName).length;
      stats[sceneName] = {
        players: playersInScene
      };
    });
    
    return stats;
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