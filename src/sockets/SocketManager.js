import { io } from 'socket.io-client';
import { SYSTEM_MESSAGES } from '../config/gameConfig';

/**
 * Classe para gerenciar conexões via Socket.IO
 */
class SocketManager {
  /**
   * Cria uma nova instância do gerenciador de sockets
   * @param {Object} ui - Interface do usuário para atualização de status
   */
  constructor(ui) {
    this.socket = null;
    this.ui = ui;
    this.connectionListeners = [];
    this.disconnectionListeners = [];
    this.errorListeners = [];
  }
  
  /**
   * Inicializa a conexão com o servidor
   * @returns {SocketIO.Socket} - Objeto socket
   */
  connect() {
    // Criar nova conexão Socket.IO
    this.socket = io();
    
    // Configurar listeners de eventos
    this.socket.on('connect', () => {
      console.log('Conectado ao servidor com ID:', this.socket.id);
      
      if (this.ui) {
        this.ui.updateConnectionStatus(true, this.socket.id);
        this.ui.updateLoadingStatus(SYSTEM_MESSAGES.connected);
      }
      
      // Notificar listeners de conexão
      this.connectionListeners.forEach(listener => listener(this.socket));
    });
    
    this.socket.on('disconnect', () => {
      console.log('Desconectado do servidor');
      
      if (this.ui) {
        this.ui.updateConnectionStatus(false);
      }
      
      // Notificar listeners de desconexão
      this.disconnectionListeners.forEach(listener => listener());
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão:', error);
      
      if (this.ui) {
        this.ui.updateConnectionStatus(false);
        this.ui.updateLoadingStatus(SYSTEM_MESSAGES.connectionError);
      }
      
      // Notificar listeners de erro
      this.errorListeners.forEach(listener => listener(error));
    });
    
    return this.socket;
  }
  
  /**
   * Adiciona um listener para eventos de conexão
   * @param {Function} listener - Função a ser chamada quando conectado
   */
  onConnect(listener) {
    if (typeof listener === 'function') {
      this.connectionListeners.push(listener);
      
      // Se já estiver conectado, chame o listener imediatamente
      if (this.socket && this.socket.connected) {
        listener(this.socket);
      }
    }
  }
  
  /**
   * Adiciona um listener para eventos de desconexão
   * @param {Function} listener - Função a ser chamada quando desconectado
   */
  onDisconnect(listener) {
    if (typeof listener === 'function') {
      this.disconnectionListeners.push(listener);
    }
  }
  
  /**
   * Adiciona um listener para eventos de erro de conexão
   * @param {Function} listener - Função a ser chamada quando ocorrer erro
   */
  onError(listener) {
    if (typeof listener === 'function') {
      this.errorListeners.push(listener);
    }
  }
  
  /**
   * Desconecta do servidor
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
  
  /**
   * Verifica se está conectado ao servidor
   * @returns {boolean} - Verdadeiro se conectado
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }
  
  /**
   * Obtém o ID do socket atual
   * @returns {string|null} - ID do socket ou null se não conectado
   */
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}

export default SocketManager; 