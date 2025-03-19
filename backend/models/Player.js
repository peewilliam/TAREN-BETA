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
    this.sceneName = 'main'; // Cena inicial (hub central)
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

  /**
   * Atualiza a cena do jogador
   * @param {string} sceneName - Nome da nova cena
   * @returns {boolean} - Se a atualização foi bem-sucedida
   */
  changeScene(sceneName) {
    // Validar se a cena é permitida
    const allowedScenes = ['main', 'dungeon-fire', 'dungeon-ice', 'arena'];
    
    if (allowedScenes.includes(sceneName)) {
      this.sceneName = sceneName;
      this.lastActivity = new Date();
      
      // Redefinir posição dependendo da cena
      if (sceneName === 'main') {
        // Spawn central no hub principal
        this.position = { x: 0, y: 0 };
      } else {
        // Spawn próximo à entrada da cena
        this.position = this.getSceneSpawnPosition(sceneName);
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Obtém a posição de spawn para uma cena específica
   * @param {string} sceneName - Nome da cena
   * @returns {Object} - Posição de spawn {x, y}
   */
  getSceneSpawnPosition(sceneName) {
    // Posições específicas para cada cena
    const spawnPositions = {
      'main': { x: 0, y: 0 },
      'dungeon-fire': { x: 0, y: 30 },
      'dungeon-ice': { x: 0, y: 30 },
      'arena': { x: 0, y: 45 }
    };
    
    return spawnPositions[sceneName] || { x: 0, y: 0 };
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      color: this.color,
      sceneName: this.sceneName
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