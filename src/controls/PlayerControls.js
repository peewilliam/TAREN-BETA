import { CONTROL_KEYS, PLAYER_CONFIG } from '../config/gameConfig';

/**
 * Classe responsável pelo controle do jogador
 */
export default class PlayerControls {
  constructor(socket, updatePositionCallback) {
    this.socket = socket;
    this.updatePositionCallback = updatePositionCallback;
    this.keys = {
      [CONTROL_KEYS.forward]: false,
      [CONTROL_KEYS.left]: false,
      [CONTROL_KEYS.backward]: false,
      [CONTROL_KEYS.right]: false
    };
    
    this.moveSpeed = PLAYER_CONFIG.moveSpeed;
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
   * @returns {boolean} - True se o jogador se moveu
   */
  update(player, worldSize) {
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
    
    const position = { 
      x: player.position.x, 
      y: player.position.z 
    };
    
    let moved = false;
    
    // Verificar teclas e atualizar posição
    if (this.keys[CONTROL_KEYS.forward]) {
      position.y -= this.moveSpeed;
      moved = true;
    }
    if (this.keys[CONTROL_KEYS.backward]) {
      position.y += this.moveSpeed;
      moved = true;
    }
    if (this.keys[CONTROL_KEYS.left]) {
      position.x -= this.moveSpeed;
      moved = true;
    }
    if (this.keys[CONTROL_KEYS.right]) {
      position.x += this.moveSpeed;
      moved = true;
    }
    
    if (moved) {
      // Validar limites do mundo
      const limit = worldSize / 2 - 3;
      position.x = Math.max(-limit, Math.min(limit, position.x));
      position.y = Math.max(-limit, Math.min(limit, position.y));
      
      // Atualizar a posição no modelo usando o método do jogador
      player.updatePosition(position);
      
      // Log para depuração (remove em produção)
      console.log(`Movimento: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`);
      
      // Enviar atualização para o servidor
      this.socket.emit('updatePosition', position);
      
      // Chamar o callback para atualizar a câmera ou outros elementos
      if (this.updatePositionCallback) {
        this.updatePositionCallback(player);
      }
      
      return true;
    }
    
    return false;
  }
} 