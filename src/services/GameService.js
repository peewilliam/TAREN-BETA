import Player from '../components/Player';
import { SYSTEM_MESSAGES } from '../config/gameConfig';

/**
 * Serviço que gerencia as operações relacionadas ao jogo
 */
class GameService {
  /**
   * Cria uma nova instância do serviço
   * @param {SocketIO.Socket} socket - Conexão Socket.IO
   * @param {GameScene} gameScene - Cena do jogo
   * @param {Object} ui - Interface do usuário 
   */
  constructor(socket, gameScene, ui) {
    this.socket = socket;
    this.gameScene = gameScene;
    this.ui = ui;
    this.players = new Map();
    this.currentPlayerId = null;
    this.worldSize = gameScene.worldSize;
    
    this.setupSocketListeners();
  }
  
  /**
   * Configura os listeners de eventos do socket
   */
  setupSocketListeners() {
    // Recebendo estado inicial do jogo
    this.socket.on('gameState', this.handleGameState.bind(this));
    
    // Jogador entrou
    this.socket.on('playerJoined', this.handlePlayerJoined.bind(this));
    
    // Jogador movimentou
    this.socket.on('playerMoved', this.handlePlayerMoved.bind(this));
    
    // Jogador saiu
    this.socket.on('playerLeft', this.handlePlayerLeft.bind(this));
    
    // Recebimento de mensagem de chat
    this.socket.on('chatMessage', this.handleChatMessage.bind(this));
  }
  
  /**
   * Manipula o evento de estado do jogo
   * @param {Object} data - Dados do estado do jogo
   */
  handleGameState(data) {
    console.log('Estado do jogo recebido:', data);
    
    // Atualizar tamanho do mundo se for diferente
    if (data.worldSize && data.worldSize !== this.worldSize) {
      this.worldSize = data.worldSize;
    }
    
    // Processar jogadores
    data.players.forEach(playerData => {
      this.updatePlayer(playerData);
    });
    
    // Atualizar contador de jogadores após processar todos
    this.updatePlayerCount();
    
    // Armazenar ID do jogador atual
    if (data.currentPlayer) {
      this.currentPlayerId = data.currentPlayer.id;
      
      // Notificar a UI
      if (this.ui && this.ui.updatePlayerInfo) {
        this.ui.updatePlayerInfo(data.currentPlayer);
      }
      
      // Ajustar a câmera para o jogador atual
      this.focusCameraOnCurrentPlayer();
    }
    
    // Remover tela de carregamento
    if (this.ui && this.ui.hideLoadingScreen) {
      setTimeout(() => {
        this.ui.hideLoadingScreen();
      }, 1000);
    }
  }
  
  /**
   * Manipula o evento de novo jogador
   * @param {Object} playerData - Dados do novo jogador
   */
  handlePlayerJoined(playerData) {
    console.log('Novo jogador entrou:', playerData);
    
    this.updatePlayer(playerData);
    
    // Adicionar mensagem de sistema no chat
    if (this.ui && this.ui.addChatMessage) {
      this.ui.addChatMessage({
        system: true,
        message: SYSTEM_MESSAGES.playerJoined(playerData.name)
      });
    }
    
    // Atualizar contador de jogadores
    this.updatePlayerCount();
  }
  
  /**
   * Manipula o evento de movimento de jogador
   * @param {Object} data - Dados do movimento
   */
  handlePlayerMoved(data) {
    const player = this.players.get(data.id);
    if (player) {
      player.updatePosition(data.position);
      
      // Verificar se é o jogador atual para mover a câmera
      if (data.id === this.currentPlayerId && this.ui && this.ui.updateCamera) {
        this.ui.updateCamera(player);
      }
    }
  }
  
  /**
   * Manipula o evento de saída de jogador
   * @param {string} playerId - ID do jogador que saiu
   */
  handlePlayerLeft(playerId) {
    console.log('Jogador saiu:', playerId);
    
    const player = this.players.get(playerId);
    if (player) {
      // Remover jogador da cena
      player.remove(this.gameScene.scene);
      
      // Remover da lista
      this.players.delete(playerId);
      
      // Atualizar contador de jogadores
      this.updatePlayerCount();
      
      // Adicionar mensagem de sistema no chat
      if (this.ui && this.ui.addChatMessage) {
        this.ui.addChatMessage({
          system: true,
          message: SYSTEM_MESSAGES.playerLeft(player.name)
        });
      }
    }
  }
  
  /**
   * Manipula o recebimento de mensagem de chat
   * @param {Object} chatData - Dados da mensagem
   */
  handleChatMessage(chatData) {
    if (this.ui && this.ui.addChatMessage) {
      this.ui.addChatMessage(chatData);
    }
  }
  
  /**
   * Atualiza ou cria um jogador
   * @param {Object} playerData - Dados do jogador
   */
  updatePlayer(playerData) {
    let player = this.players.get(playerData.id);
    
    if (!player) {
      // Criar novo jogador
      player = new Player(playerData);
      this.players.set(playerData.id, player);
      this.gameScene.add(player.mesh);
    } else {
      // Atualizar jogador existente
      player.updatePosition(playerData.position);
    }
    
    return player;
  }
  
  /**
   * Atualiza o contador de jogadores na UI
   */
  updatePlayerCount() {
    if (this.ui && this.ui.updatePlayerCount) {
      this.ui.updatePlayerCount(this.players.size);
    }
  }
  
  /**
   * Foca a câmera no jogador atual
   */
  focusCameraOnCurrentPlayer() {
    if (!this.currentPlayerId) return;
    
    const currentPlayer = this.players.get(this.currentPlayerId);
    if (currentPlayer && this.ui && this.ui.updateCamera) {
      this.ui.updateCamera(currentPlayer);
    }
  }
  
  /**
   * Envia uma mensagem de chat
   * @param {string} message - Mensagem a ser enviada
   */
  sendChatMessage(message) {
    if (message && message.trim() !== '' && this.socket.connected) {
      this.socket.emit('chatMessage', message);
    }
  }
  
  /**
   * Atualiza as etiquetas 2D de todos os jogadores
   */
  updatePlayerLabels() {
    this.players.forEach(player => {
      player.updateLabels();
    });
  }
  
  /**
   * Obtém o jogador atual
   * @returns {Player|undefined} - Jogador atual
   */
  getCurrentPlayer() {
    return this.players.get(this.currentPlayerId);
  }
}

export default GameService; 