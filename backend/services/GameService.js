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

  /**
   * Calcula a nova posição do jogador com base na direção e aplica as regras do servidor
   * @param {string} socketId - ID do socket do jogador
   * @param {object} moveData - Dados do movimento {direction, timestamp}
   * @returns {object|null} - Resultado do processamento com a nova posição ou null se falhar
   */
  calculatePlayerMovement(socketId, moveData) {
    const player = this.players.get(socketId);
    if (!player) return null;
    
    // Normalizar a entrada para o formato esperado pelo processMoveCommand
    const commandData = {
      direction: {
        x: moveData.x || 0,
        y: moveData.z || 0
      },
      timestamp: moveData.timestamp || Date.now()
    };
    
    // Processar o comando de movimento usando o método do jogador
    const result = player.processMoveCommand(commandData);
    
    if (result.success) {
      return result;
    } else {
      console.warn(`Falha ao processar movimento para jogador ${socketId}: ${result.reason}`);
      return null;
    }
  }
  
  /**
   * Verifica colisões do jogador com o ambiente
   * @param {object} player - Objeto do jogador
   * @param {object} newPosition - Nova posição tentativa {x, y}
   * @returns {object} - Resultado da colisão { blocked, allowedPosition }
   */
  checkCollisions(player, newPosition) {
    // Implementação básica (sem colisões)
    // Futuramente, aqui seria implementada a verificação de colisões do servidor
    return {
      blocked: false,
      allowedPosition: newPosition
    };
    
    // EXEMPLO de implementação futura com colisões:
    /*
    const colliders = mapData[player.sceneName].colliders;
    for (const collider of colliders) {
      if (this.intersects(newPosition, collider)) {
        return {
          blocked: true,
          allowedPosition: this.calculateSlidePosition(player.position, newPosition, collider)
        };
      }
    }
    return { blocked: false, allowedPosition: newPosition };
    */
  }
}

// Singleton para garantir uma única instância do serviço
const gameService = new GameService();
module.exports = gameService; 