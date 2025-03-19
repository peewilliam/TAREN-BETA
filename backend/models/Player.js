const { v4: uuidv4 } = require('uuid');
const config = require('../config');

class Player {
  constructor(socketId, name = null) {
    this.id = socketId;
    this.name = name || `Jogador ${Math.floor(Math.random() * 1000)}`;
    this.position = this.getRandomSpawnPosition();
    this.color = this.getRandomColor();
    this.createdAt = new Date();
    this.lastActivity = new Date();
  }

  getRandomSpawnPosition() {
    const { spawnArea } = config.game;
    return {
      x: Math.random() * (spawnArea.maxX - spawnArea.minX) + spawnArea.minX,
      y: Math.random() * (spawnArea.maxY - spawnArea.minY) + spawnArea.minY
    };
  }

  getRandomColor() {
    const { playerColors } = config.game;
    return playerColors[Math.floor(Math.random() * playerColors.length)];
  }

  updatePosition(position) {
    // Atualiza a posição com validação
    if (this.isValidPosition(position)) {
      this.position = position;
      this.lastActivity = new Date();
      return true;
    }
    return false;
  }

  isValidPosition(position) {
    const halfWorldSize = config.game.worldSize / 2;
    return (
      position.x >= -halfWorldSize && 
      position.x <= halfWorldSize && 
      position.y >= -halfWorldSize && 
      position.y <= halfWorldSize
    );
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      color: this.color
    };
  }

  static createChatMessage(player, content) {
    if (!content || content.trim() === '') return null;
    
    return {
      id: uuidv4(),
      playerId: player.id,
      playerName: player.name,
      message: content.substring(0, config.game.settings.chatMessageMaxLength),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = Player; 