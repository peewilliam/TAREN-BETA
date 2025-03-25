import { CONTROL_KEYS, PLAYER_CONFIG } from '../config/gameConfig';

/**
 * Classe responsável pelo controle do jogador
 */
export default class PlayerControls {
  constructor(socket, updatePositionCallback) {
    this.socket = socket;
    this.updatePositionCallback = updatePositionCallback;
    this.physicsManager = null; // Será definido por Game.js
    this.keys = {
      [CONTROL_KEYS.forward]: false,
      [CONTROL_KEYS.left]: false,
      [CONTROL_KEYS.backward]: false,
      [CONTROL_KEYS.right]: false
    };
    
    this.moveSpeed = PLAYER_CONFIG.moveSpeed;
    this.lastMovementTime = Date.now(); // Timestamp do último movimento enviado
    this.setupEventListeners();
  }
  
  /**
   * Configura os event listeners para as teclas
   */
  setupEventListeners() {
    // Evento de tecla pressionada
    document.addEventListener('keydown', (e) => {
      if (this.keys.hasOwnProperty(e.key.toLowerCase()) && !this.isInputFocused()) {
        this.keys[e.key.toLowerCase()] = true;
      }
    });
    
    // Evento de tecla solta
    document.addEventListener('keyup', (e) => {
      if (this.keys.hasOwnProperty(e.key.toLowerCase())) {
        this.keys[e.key.toLowerCase()] = false;
      }
    });
  }
  
  /**
   * Verifica se o foco está em um elemento de input
   * @returns {boolean} True se o foco estiver em um elemento de input
   */
  isInputFocused() {
    return document.activeElement && (
      document.activeElement.tagName === 'INPUT' || 
      document.activeElement.tagName === 'TEXTAREA'
    );
  }
  
  /**
   * Atualiza a posição do jogador com base nas teclas pressionadas
   * @param {Object} player - Objeto do jogador
   * @param {number} worldSize - Tamanho do mundo do jogo
   * @param {number} deltaTime - Tempo decorrido desde o último frame (ms)
   * @returns {boolean} - True se o jogador se moveu
   */
  update(player, worldSize, deltaTime = 16.67) {
    if (!player) {
      console.warn('PlayerControls: jogador não definido em update()');
      return false;
    }
    
    if (!player.position) {
      console.warn('PlayerControls: posição do jogador não definida');
      return false;
    }
    
    // Armazenar referência ao jogador (útil para garantir controle após mudança de cena)
    this.player = player;
    
    // Verificar se há movimento baseado nas teclas
    const direction = { x: 0, z: 0 };
    let moved = false;
    
    // Verificar teclas e calcular direção
    if (this.keys[CONTROL_KEYS.forward]) {
      direction.z = -1;
      moved = true;
    }
    if (this.keys[CONTROL_KEYS.backward]) {
      direction.z = 1;
      moved = true;
    }
    if (this.keys[CONTROL_KEYS.left]) {
      direction.x = -1;
      moved = true;
    }
    if (this.keys[CONTROL_KEYS.right]) {
      direction.x = 1;
      moved = true;
    }
    
    // Normalizar o vetor de direção para movimento consistente em diagonais
    if (moved && (direction.x !== 0 || direction.z !== 0)) {
      const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
      
      if (length > 0) {
        direction.x /= length;
        direction.z /= length;
      }
    }
    
    // Se houve movimento, enviar comando para o servidor
    if (moved) {
      const currentTime = Date.now();
      
      // Limitar a frequência de envio para não sobrecarregar o servidor
      const movementInterval = 100; // ms entre envios
      if (currentTime - this.lastMovementTime >= movementInterval) {
        // Enviar apenas as intenções de direção para o servidor
        this.socket.emit('moveCommand', {
          direction: {
            x: direction.x,
            z: direction.z
          },
          timestamp: currentTime
        });
        
        this.lastMovementTime = currentTime;
      }
      
      // Movimento preditivo local para feedback imediato
      if (PLAYER_CONFIG.prediction.enabled) {
        // Usar velocidade do jogador definida pelo servidor
        const moveSpeed = player.speed || this.moveSpeed;
        
        // Calcular delta baseado na velocidade do jogador e no tempo decorrido
        const speedFactor = moveSpeed * (deltaTime / 1000);
        
        // Preditivamente mover o jogador na direção atual
        const predictedPosition = {
          x: player.position.x + direction.x * speedFactor,
          y: player.position.z + direction.z * speedFactor
        };
        
        // Validar limites do mundo
        const limit = worldSize / 2 - 3;
        predictedPosition.x = Math.max(-limit, Math.min(limit, predictedPosition.x));
        predictedPosition.y = Math.max(-limit, Math.min(limit, predictedPosition.y));
        
        // Atualizar localmente para feedback imediato
        player.updatePosition(predictedPosition, true); // true = é apenas previsão
      }
      
      return true;
    }
    
    return false;
  }
} 