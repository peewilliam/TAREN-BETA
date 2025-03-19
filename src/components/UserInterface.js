import { CONTROL_KEYS, UI_CONFIG } from '../config/gameConfig';

/**
 * Classe que gerencia toda a interface de usuário do jogo
 */
class UserInterface {
  /**
   * Cria uma nova interface de usuário
   * @param {GameService} gameService - Serviço do jogo para interação
   */
  constructor(gameService) {
    this.gameService = gameService;
    this.camera = null;
    
    // Referências DOM
    this.loadingScreen = document.getElementById('loading-screen');
    this.playerCountElement = document.getElementById('player-count');
    this.playerPositionElement = document.getElementById('player-position');
    this.connectionStatusElement = document.getElementById('connection-status');
    this.chatContainer = document.getElementById('chat-container');
    this.chatMessages = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.chatSendButton = document.getElementById('chat-send');
    
    this.setupEventListeners();
  }
  
  /**
   * Configura a câmera para a UI
   * @param {THREE.Camera} camera - Câmera da cena
   */
  setCamera(camera) {
    this.camera = camera;
  }
  
  /**
   * Configura os listeners de eventos da UI
   */
  setupEventListeners() {
    // Evento de envio de mensagem de chat
    if (this.chatSendButton) {
      this.chatSendButton.addEventListener('click', () => this.sendChatMessage());
    }
    
    // Enviar mensagem com Enter
    if (this.chatInput) {
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.sendChatMessage();
        }
      });
    }
    
    // Abrir chat com Enter
    document.addEventListener('keydown', (e) => {
      if (e.key === CONTROL_KEYS.chat && !this.isInputFocused()) {
        e.preventDefault();
        this.showChat();
        if (this.chatInput) {
          this.chatInput.focus();
        }
      } else if (e.key === CONTROL_KEYS.closeChat && this.isInputFocused()) {
        this.hideChat();
      }
    });
    
    // Redimensionamento da janela
    window.addEventListener('resize', () => {
      if (this.onResizeCallback) {
        this.onResizeCallback();
      }
    });
  }
  
  /**
   * Verifica se algum campo de input está em foco
   * @returns {boolean} - Verdadeiro se um input estiver em foco
   */
  isInputFocused() {
    return document.activeElement && (
      document.activeElement.tagName === 'INPUT' || 
      document.activeElement.tagName === 'TEXTAREA'
    );
  }
  
  /**
   * Envia uma mensagem de chat
   */
  sendChatMessage() {
    if (!this.chatInput || !this.gameService) return;
    
    const message = this.chatInput.value.trim();
    if (message) {
      this.gameService.sendChatMessage(message);
      this.chatInput.value = '';
    }
  }
  
  /**
   * Adiciona uma mensagem ao chat
   * @param {Object} chatData - Dados da mensagem
   */
  addChatMessage(chatData) {
    if (!this.chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    if (chatData.system) {
      // Mensagem do sistema
      messageElement.innerHTML = `<span style="color: #aaa;">${chatData.message}</span>`;
    } else {
      // Mensagem normal
      const playerColor = this.getPlayerColor(chatData.playerId) || '#3366ff';
      messageElement.innerHTML = `<span class="chat-name" style="color: ${playerColor}">${chatData.playerName}:</span> ${chatData.message}`;
    }
    
    this.chatMessages.appendChild(messageElement);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    
    // Mostrar container de chat se estiver oculto
    this.showChat();
    
    // Ocultar chat após um tempo se não estiver em foco
    setTimeout(() => {
      if (!this.isInputFocused()) {
        this.hideChat();
      }
    }, UI_CONFIG.chat.displayTime);
  }
  
  /**
   * Obtém a cor de um jogador em formato hexadecimal
   * @param {string} playerId - ID do jogador
   * @returns {string|null} - Cor em formato hexadecimal ou null
   */
  getPlayerColor(playerId) {
    if (!this.gameService || !playerId) return null;
    
    const players = this.gameService.players;
    const player = players.get(playerId);
    
    if (player && player.color) {
      return '#' + player.color.toString(16).padStart(6, '0');
    }
    
    return null;
  }
  
  /**
   * Atualiza o status de conexão na UI
   * @param {boolean} connected - Estado da conexão
   * @param {string} socketId - ID do socket
   */
  updateConnectionStatus(connected, socketId = '') {
    if (!this.connectionStatusElement) return;
    
    if (connected) {
      this.connectionStatusElement.textContent = `Conectado ao servidor (ID: ${socketId})`;
      this.connectionStatusElement.style.backgroundColor = 'rgba(0, 128, 0, 0.5)';
    } else {
      this.connectionStatusElement.textContent = 'Desconectado do servidor';
      this.connectionStatusElement.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    }
  }
  
  /**
   * Atualiza a contagem de jogadores na UI
   * @param {number} count - Número de jogadores
   */
  updatePlayerCount(count) {
    if (this.playerCountElement) {
      this.playerCountElement.textContent = count;
    }
  }
  
  /**
   * Atualiza as informações do jogador na UI
   * @param {Object} player - Dados do jogador
   */
  updatePlayerInfo(player) {
    if (!player || !this.playerPositionElement) return;
    
    this.playerPositionElement.textContent = `X: ${player.position.x.toFixed(1)}, Y: ${player.position.y.toFixed(1)}`;
  }
  
  /**
   * Atualiza a posição da câmera para seguir o jogador
   * @param {Player} player - Jogador a ser seguido
   */
  updateCamera(player) {
    if (!this.camera || !player) return;
    
    this.camera.position.x = player.position.x;
    this.camera.position.z = player.position.z + 15;
    this.camera.lookAt(player.position);
    
    // Atualizar as informações do jogador na UI
    this.updatePlayerInfo({
      position: {
        x: player.position.x,
        y: player.position.z
      }
    });
  }
  
  /**
   * Define um callback para eventos de redimensionamento
   * @param {Function} callback - Função a ser chamada no redimensionamento
   */
  setResizeCallback(callback) {
    this.onResizeCallback = callback;
  }
  
  /**
   * Atualiza a mensagem de carregamento
   * @param {string} message - Mensagem de carregamento
   */
  updateLoadingStatus(message) {
    if (this.loadingScreen && this.loadingScreen.querySelector('p')) {
      this.loadingScreen.querySelector('p').textContent = message;
    }
  }
  
  /**
   * Oculta a tela de carregamento
   */
  hideLoadingScreen() {
    if (this.loadingScreen) {
      this.loadingScreen.style.display = 'none';
    }
  }
  
  /**
   * Mostra o chat
   */
  showChat() {
    if (this.chatContainer) {
      this.chatContainer.style.display = 'flex';
    }
  }
  
  /**
   * Oculta o chat
   */
  hideChat() {
    if (this.chatContainer && !this.isInputFocused()) {
      this.chatContainer.style.display = 'none';
      if (this.chatInput) {
        this.chatInput.blur();
      }
    }
  }
}

export default UserInterface; 