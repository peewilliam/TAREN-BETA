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
    
    // Atributos controlados pelo servidor
    this.speed = config.game.defaultSpeed || 3; // Velocidade de movimento
    this.health = 100; // Vida
    this.maxHealth = 100;
    this.level = 1;
    this.experience = 0;
    
    // Estatísticas controladas pelo servidor
    this.stats = {
      strength: 10,
      agility: 10,
      intelligence: 10
    };
    
    // Status de movimento
    this.isMoving = false;
    this.lastDirection = { x: 0, y: 0 };
    this.lastMoveTime = Date.now();
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
      this.lastMoveTime = Date.now();
      return true;
    }
    return false;
  }

  isValidPosition(position) {
    // Obtém tamanho do mundo específico da cena atual
    const sceneConfig = config.game.scenes[this.sceneName] || {};
    const worldSize = sceneConfig.worldSize || config.game.worldSize;
    const halfWorldSize = worldSize / 2;
    
    return (
      position.x >= -halfWorldSize && 
      position.x <= halfWorldSize && 
      position.y >= -halfWorldSize && 
      position.y <= halfWorldSize
    );
  }
  
  /**
   * Atualiza os atributos do jogador
   * @param {Object} attributes - Atributos a serem atualizados
   */
  updateAttributes(attributes) {
    if (attributes.speed !== undefined && 
        attributes.speed >= 1 && 
        attributes.speed <= config.game.maxSpeed) {
      this.speed = attributes.speed;
    }
    
    if (attributes.health !== undefined) {
      this.health = Math.max(0, Math.min(this.maxHealth, attributes.health));
    }
    
    if (attributes.level !== undefined && attributes.level > this.level) {
      this.level = attributes.level;
    }
    
    if (attributes.experience !== undefined && attributes.experience > this.experience) {
      this.experience = attributes.experience;
    }
    
    if (attributes.stats) {
      // Validar estatísticas antes de atualizar
      const maxStat = config.game.maxStatValue || 100;
      
      if (attributes.stats.strength !== undefined) {
        this.stats.strength = Math.max(1, Math.min(maxStat, attributes.stats.strength));
      }
      
      if (attributes.stats.agility !== undefined) {
        this.stats.agility = Math.max(1, Math.min(maxStat, attributes.stats.agility));
      }
      
      if (attributes.stats.intelligence !== undefined) {
        this.stats.intelligence = Math.max(1, Math.min(maxStat, attributes.stats.intelligence));
      }
    }
    
    this.lastActivity = new Date();
    return true;
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
      sceneName: this.sceneName,
      // Incluir atributos controlados pelo servidor
      speed: this.speed,
      health: this.health,
      maxHealth: this.maxHealth,
      level: this.level, 
      experience: this.experience,
      stats: this.stats
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

  /**
   * Calcula o novo movimento baseado na direção e delta de tempo
   * @param {Object} direction - Direção do movimento {x, y}
   * @param {number} deltaTime - Tempo decorrido desde o último cálculo em ms
   * @returns {Object} - Nova posição calculada
   */
  calculateMovement(direction, deltaTime) {
    // Normalizar a direção para evitar movimento mais rápido na diagonal
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    let normalizedX = 0;
    let normalizedY = 0;
    
    if (length > 0) {
      normalizedX = direction.x / length;
      normalizedY = direction.y / length;
    }
    
    // Calcular distância a ser percorrida com base na velocidade e tempo
    const delta = this.speed * (deltaTime / 1000);
    
    // Calcular nova posição
    const newPosition = {
      x: this.position.x + normalizedX * delta,
      y: this.position.y + normalizedY * delta
    };
    
    // Atualizar status de movimento
    this.isMoving = length > 0;
    if (this.isMoving) {
      this.lastDirection = { x: normalizedX, y: normalizedY };
    }
    
    // Validar e retornar nova posição
    if (this.isValidPosition(newPosition)) {
      return newPosition;
    }
    
    // Se a nova posição for inválida, tentar mover apenas no eixo X ou Y
    const positionX = {
      x: this.position.x + normalizedX * delta,
      y: this.position.y
    };
    
    const positionY = {
      x: this.position.x,
      y: this.position.y + normalizedY * delta
    };
    
    // Verificar se pelo menos um dos movimentos parciais é válido
    if (this.isValidPosition(positionX)) {
      return positionX;
    } else if (this.isValidPosition(positionY)) {
      return positionY;
    }
    
    // Se nenhuma posição for válida, retorna a posição atual
    return this.position;
  }

  /**
   * Processa um comando de movimento do cliente
   * @param {Object} data - Dados do comando {direction, timestamp}
   * @returns {Object} - Resultado do processamento com nova posição
   */
  processMoveCommand(data) {
    if (!data || !data.direction) {
      return { success: false, reason: 'Dados inválidos' };
    }
    
    // Verificar timestamp para evitar ataques de replay
    const currentTime = Date.now();
    if (data.timestamp && currentTime - data.timestamp > 5000) {
      return { success: false, reason: 'Comando expirado' };
    }
    
    // Calcular tempo desde o último movimento
    const deltaTime = currentTime - this.lastMoveTime;
    
    // Limitar taxa de movimentos
    if (deltaTime < (config.game.settings.playerMoveInterval || 50)) {
      return { success: false, reason: 'Movendo rápido demais' };
    }
    
    // Calcular nova posição com base na direção
    const newPosition = this.calculateMovement(data.direction, deltaTime);
    
    // Atualizar posição e timestamp
    this.position = newPosition;
    this.lastMoveTime = currentTime;
    
    return {
      success: true,
      position: this.position,
      timestamp: currentTime
    };
  }
}

module.exports = Player; 