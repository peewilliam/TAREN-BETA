import Player from '../components/Player';
import { SYSTEM_MESSAGES } from '../config/gameConfig';

/**
 * Serviço que gerencia as operações relacionadas ao jogo
 */
class GameService {
  /**
   * Cria uma nova instância do serviço
   * @param {SocketIO.Socket} socket - Conexão Socket.IO
   * @param {SceneManager} sceneManager - Gerenciador de cenas do jogo
   * @param {Object} ui - Interface do usuário 
   */
  constructor(socket, sceneManager, ui) {
    this.socket = socket;
    this.sceneManager = sceneManager;
    this.ui = ui;
    this.players = new Map();
    this.currentPlayerId = null;
    this.worldSize = sceneManager.currentScene.worldSize;
    this.currentSceneName = 'main';
    this.physicsManager = null; // Será definido por Game.js
    
    this.setupSocketListeners();
  }
  
  /**
   * Configura os listeners de socket para o jogo
   */
  setupSocketListeners() {
    // Evento de conexão
    this.socket.on('connect', () => {
      console.log('Conectado ao servidor com ID:', this.socket.id);
      this.connected = true;
    });
    
    // Evento de desconexão
    this.socket.on('disconnect', () => {
      console.log('Desconectado do servidor');
      this.connected = false;
    });
    
    // Receber estado inicial do jogo
    this.socket.on('gameState', (data) => {
      console.log('Estado do jogo recebido:', data);
      this.processGameState(data);
    });
    
    // Quando um jogador entra no jogo
    this.socket.on('playerJoined', (playerData) => {
      console.log('Novo jogador entrou:', playerData);
      const player = this.updatePlayer(playerData);
      this.updatePlayerCount();
    });
    
    // Quando um jogador sai do jogo
    this.socket.on('playerLeft', (playerId) => {
      console.log('Jogador saiu:', playerId);
      this.removePlayer(playerId);
      this.updatePlayerCount();
    });
    
    // Quando um jogador muda de posição
    this.socket.on('playerMoved', (data) => {
      if (data.id && this.players.has(data.id)) {
        const player = this.players.get(data.id);
        
        // Receber posição autorizada do servidor
        if (data.position) {
          // Atualizar posição sem marcar como previsão (posição autoritativa)
          player.updatePosition(data.position);
          
          // Se for o jogador atual, atualizar a câmera
          if (data.id === this.currentPlayerId && this.ui) {
            this.ui.updateCamera(player);
          }
        }
      }
    });
    
    // Quando o servidor responde a um movimento com a posição autorizada
    this.socket.on('positionUpdated', (data) => {
      // Obter o jogador atual
      const currentPlayer = this.getCurrentPlayer();
      if (!currentPlayer) return;
      
      console.log('Posição autorizada recebida do servidor:', data);
      
      // Aplicar a posição autorizada ao jogador
      if (data.position) {
        currentPlayer.updatePosition(data.position);
        
        // Atualizar a câmera
        if (this.ui) {
          this.ui.updateCamera(currentPlayer);
        }
      }
    });
    
    // Quando o servidor envia um erro de movimento
    this.socket.on('movementError', (data) => {
      // Obter o jogador atual
      const currentPlayer = this.getCurrentPlayer();
      if (!currentPlayer) return;
      
      console.warn('Erro de movimento recebido do servidor:', data);
      
      // Exibir mensagem de erro no chat se disponível
      if (this.ui && this.ui.addChatMessage && data.reason) {
        this.ui.addChatMessage({
          system: true,
          message: SYSTEM_MESSAGES.movementError(data.reason)
        });
      }
      
      // Se houver uma posição correta enviada junto, aplicá-la imediatamente
      if (data.position) {
        currentPlayer.updatePosition(data.position);
        
        // Atualizar a câmera
        if (this.ui) {
          this.ui.updateCamera(currentPlayer);
        }
      }
    });
    
    // Quando o servidor envia atualizações de jogadores
    this.socket.on('playerUpdates', (updates) => {
      for (const update of updates) {
        if (update.id && this.players.has(update.id)) {
          const player = this.players.get(update.id);
          // Aplicar atributos controlados pelo servidor
          player.updateFromServer(update);
        }
      }
    });
    
    // Quando um jogador muda de cena
    this.socket.on('sceneChange', (data) => {
      console.log('Jogador mudou de cena:', data);
      const player = this.players.get(data.id);
      if (player) {
        player.changeScene(data.sceneName);
        
        // Se for o jogador atual, mudar a cena
        if (data.id === this.currentPlayerId) {
          this.changeScene(data.sceneName);
        }
      }
    });
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
      // Apenas adicionar jogadores que estão na mesma cena
      if (!playerData.sceneName || playerData.sceneName === this.currentSceneName) {
        this.updatePlayer(playerData);
      }
    });
    
    // Atualizar contador de jogadores após processar todos
    this.updatePlayerCount();
    
    // Armazenar ID do jogador atual
    if (data.currentPlayer) {
      this.currentPlayerId = data.currentPlayer.id;
      
      // Registrar a cena atual do jogador
      this.currentSceneName = data.currentPlayer.sceneName || 'main';
      
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
    
    // Apenas adicionar jogador se estiver na mesma cena
    if (!playerData.sceneName || playerData.sceneName === this.currentSceneName) {
      // Garantir que o modelo do jogador seja criado e adicionado à cena
      const player = this.updatePlayer(playerData);
      
      if (player) {
        // Se o modelo não foi adicionado, tente novamente
        if (!player.mesh && this.sceneManager) {
          player.recreatePlayerMesh();
          this.sceneManager.add(player.mesh);
          console.log(`Recriado modelo do jogador ${player.name} após entrada`);
        }
      
        // Adicionar mensagem de sistema no chat
        if (this.ui && this.ui.addChatMessage) {
          this.ui.addChatMessage({
            system: true,
            message: SYSTEM_MESSAGES.playerJoined(playerData.name)
          });
        }
        
        // Atualizar contador de jogadores
        this.updatePlayerCount();
        
        console.log(`Jogador ${playerData.name} adicionado com sucesso à cena ${this.currentSceneName}`);
      }
    } else {
      console.log(`Ignorando jogador ${playerData.name} da cena ${playerData.sceneName} (cena atual: ${this.currentSceneName})`);
    }
  }
  
  /**
   * Manipula o evento de desconexão de jogador
   * @param {Object} data - Dados do jogador desconectado
   */
  handlePlayerDisconnected(data) {
    const player = this.players.get(data.id);
    if (player) {
      // Remover jogador da cena física
      if (this.physicsManager && this.physicsManager.initialized) {
        this.physicsManager.removePlayerBody(data.id);
      }
      
      // Remover jogador da cena visual
      this.removePlayerFromScene(data.id);
      this.players.delete(data.id);
      
      // Atualizar contador de jogadores
      this.updatePlayerCount();
      
      console.log(`Jogador ${data.id} desconectado`);
    }
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
      this.removePlayerFromScene(playerId);
      
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
   * Manipula o evento de mudança de cena de jogador
   * @param {Object} data - Dados do jogador e da cena
   */
  handlePlayerChangedScene(data) {
    const { playerId, sceneName, playerName } = data;
    
    console.log(`Recebido evento de mudança de cena:`, data);
    
    if (playerId === this.currentPlayerId) {
      console.log(`Mudando jogador atual para cena: ${sceneName}`);
      
      // Armazenar o jogador atual para referência
      const currentPlayer = this.players.get(this.currentPlayerId);
      if (!currentPlayer) {
        console.error("Jogador atual não encontrado durante mudança de cena");
        return;
      }
      
      // Salvar a posição atual antes da mudança
      const previousPosition = {
        x: currentPlayer.position.x,
        y: currentPlayer.position.z
      };
      
      // Atualizar a cena atual
      this.currentSceneName = sceneName;
      currentPlayer.changeScene(sceneName);
      
      // Mudar para a nova cena
      if (this.sceneManager) {
        const success = this.sceneManager.changeScene(sceneName);
        console.log(`Mudança de cena: ${success ? 'sucesso' : 'falha'}`);
      }
      
      // Limpar outros jogadores da cena anterior
      this.clearPlayersFromOtherScenes();
      
      // Solicitar explicitamente estado da cena para obter a lista atualizada de jogadores
      if (this.socket.connected) {
        console.log("Solicitando estado atualizado da cena:", sceneName);
        this.socket.emit('requestSceneState', { sceneName });
      }
      
      // Recriar o modelo do jogador na nova cena
      setTimeout(() => {
        this.recreateCurrentPlayerModel();
        
        // Adicionar um log para confirmar que o jogador está presente e com controles
        console.log(`Jogador recriado em ${sceneName}:`, currentPlayer);
        console.log(`Controles ativos para jogador: ${this.currentPlayerId}`);
      }, 100); // Pequeno delay para garantir que a cena esteja pronta
    } else {
      const player = this.players.get(playerId);
      
      if (player) {
        // Atualizar a cena do jogador
        player.sceneName = sceneName;
        
        // Se o jogador foi para outra cena, removê-lo desta cena
        if (sceneName !== this.currentSceneName) {
          this.removePlayerFromScene(playerId);
          this.players.delete(playerId);
          
          // Mensagem informando que o jogador foi para outra cena
          if (this.ui && this.ui.addChatMessage) {
            this.ui.addChatMessage({
              system: true,
              message: `${playerName} foi para ${this.getSceneDisplayName(sceneName)}`
            });
          }
        } else {
          // Se o jogador entrou nesta cena, garantir que o modelo seja recriado
          this.updatePlayer(player);
          
          // Adicionar mensagem informando que o jogador entrou nesta cena
          if (this.ui && this.ui.addChatMessage) {
            this.ui.addChatMessage({
              system: true,
              message: `${playerName} entrou em ${this.getSceneDisplayName(sceneName)}`
            });
          }
        }
        
        // Atualizar contador de jogadores
        this.updatePlayerCount();
      }
    }
  }
  
  /**
   * Recria o modelo do jogador atual para garantir que seja visível na nova cena
   */
  recreateCurrentPlayerModel() {
    const currentPlayer = this.players.get(this.currentPlayerId);
    if (!currentPlayer) {
      console.error("Jogador atual não encontrado para recriar modelo");
      return;
    }
    
    console.log("Recriando modelo do jogador:", currentPlayer.id);
    console.log("Posição atual:", currentPlayer.position);
    
    // Remover o modelo existente se houver
    if (currentPlayer.mesh) {
      this.sceneManager.remove(currentPlayer.mesh);
    }
    
    // Recriar o modelo visual
    currentPlayer.recreatePlayerMesh();
    
    // Adicionar o novo modelo à cena atual
    this.sceneManager.add(currentPlayer.mesh);
    
    // Atualizar a posição com formato correto (importante!)
    currentPlayer.updatePosition({
      x: currentPlayer.position.x,
      y: currentPlayer.position.z  // Importante: z no THREE.Vector3 corresponde a y nas coordenadas 2D
    });
    
    // Forçar uma atualização da câmera para seguir o jogador
    if (this.ui && this.ui.updateCamera) {
      this.ui.updateCamera(currentPlayer);
    }
    
    console.log('Modelo do jogador recriado na nova cena');
    console.log('Nova posição:', currentPlayer.position);
  }
  
  /**
   * Obtém o nome de exibição de uma cena
   * @param {string} sceneName - Nome da cena
   * @returns {string} - Nome de exibição formatado
   */
  getSceneDisplayName(sceneName) {
    const sceneNames = {
      'main': 'Hub Central',
      'dungeon-fire': 'Dungeon de Fogo',
      'dungeon-ice': 'Dungeon de Gelo',
      'arena': 'Arena'
    };
    
    return sceneNames[sceneName] || sceneName;
  }
  
  /**
   * Remove todos os jogadores que não estão na cena atual
   */
  clearPlayersFromOtherScenes() {
    // Remover todos os jogadores que não estão na cena atual
    const playersToRemove = [];
    
    this.players.forEach((player, playerId) => {
      if (player.sceneName !== this.currentSceneName) {
        playersToRemove.push(playerId);
      }
    });
    
    playersToRemove.forEach(playerId => {
      this.removePlayerFromScene(playerId);
      this.players.delete(playerId);
    });
    
    // Atualizar o contador
    this.updatePlayerCount();
  }
  
  /**
   * Remove um jogador da cena atual
   * @param {string} playerId - ID do jogador a remover
   */
  removePlayerFromScene(playerId) {
    const player = this.players.get(playerId);
    if (player && player.mesh && this.sceneManager && this.sceneManager.currentScene) {
      this.sceneManager.currentScene.scene.remove(player.mesh);
      player.remove();
      console.log(`Jogador ${playerId} removido da cena`);
      
      // Remover jogador do sistema de física
      if (this.physicsManager && this.physicsManager.initialized) {
        this.physicsManager.removePlayerBody(playerId);
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
    // Verificar se os dados do jogador são válidos
    if (!playerData || !playerData.id) {
      console.error('Dados de jogador inválidos:', playerData);
      return null;
    }
    
    // Verificar se o jogador pertence à cena atual
    if (playerData.sceneName && playerData.sceneName !== this.currentSceneName) {
      console.log(`Jogador ${playerData.name || playerData.id} pertence à cena ${playerData.sceneName}, não ${this.currentSceneName}`);
      
      // Se o jogador já existir no mapa mas está em outra cena, remova-o da cena visual
      const existingPlayer = this.players.get(playerData.id);
      if (existingPlayer && existingPlayer.mesh) {
        this.removePlayerFromScene(playerData.id);
        
        // Remover jogador do sistema de física
        if (this.physicsManager && this.physicsManager.initialized) {
          this.physicsManager.removePlayerBody(playerData.id);
        }
        
        this.players.delete(playerData.id);
      }
      
      return null;
    }
    
    let player = this.players.get(playerData.id);
    
    if (!player) {
      // Criar novo jogador
      console.log(`Criando novo jogador: ${playerData.name || playerData.id} na cena ${this.currentSceneName}`);
      player = new Player(playerData);
      player.sceneName = this.currentSceneName; // Garantir que a cena esteja definida
      this.players.set(playerData.id, player);
      
      // Adicionar o modelo à cena
      if (this.sceneManager && player.mesh) {
        this.sceneManager.add(player.mesh);
      } else {
        console.error('Não foi possível adicionar jogador à cena: SceneManager indisponível ou mesh não criado');
      }
      
      // Adicionar jogador ao sistema de física
      if (this.physicsManager && this.physicsManager.initialized) {
        this.physicsManager.updatePlayerBody(player);
      }
    } else {
      // Atualizar jogador existente
      player.updatePosition(playerData.position);
      
      // Se o jogador está na mesma cena mas não tem mesh visível, recriar
      if (!player.mesh && this.sceneManager) {
        player.recreatePlayerMesh();
        this.sceneManager.add(player.mesh);
      }
      
      // Atualizar corpo físico do jogador
      if (this.physicsManager && this.physicsManager.initialized) {
        this.physicsManager.updatePlayerBody(player);
      }
    }
    
    // Atualizar a cena do jogador, se fornecida
    if (playerData.sceneName) {
      player.sceneName = playerData.sceneName;
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
   * Solicita ao servidor para mudar para uma nova cena
   * @param {string} sceneName - Nome da cena para mudar
   */
  requestSceneChange(sceneName) {
    if (this.socket.connected) {
      this.socket.emit('changeScene', { sceneName });
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
  
  /**
   * Manipula o evento de confirmação de carregamento de cena
   * @param {Object} data - Dados da cena carregada
   */
  handleSceneLoaded(data) {
    console.log(`Cena carregada: ${data.sceneName}`);
    
    // Verificar se o jogador existe
    const currentPlayer = this.players.get(this.currentPlayerId);
    if (!currentPlayer) {
      console.error('Jogador não encontrado na nova cena');
      return;
    }
    
    // Recriar o modelo do jogador para garantir visibilidade e controle
    this.recreateCurrentPlayerModel();
    
    // Restaurar referência ao jogador atual nos controles
    // Isso é importante para garantir que o jogador seja controlável
    if (window.game && window.game.controls) {
      window.game.controls.player = currentPlayer;
      console.log('Referência ao jogador atualizada nos controles');
    }
    
    // Mensagem de boas-vindas para o jogador
    if (this.ui && this.ui.addChatMessage) {
      this.ui.addChatMessage({
        system: true,
        message: data.message || `Você entrou em: ${data.sceneName}`
      });
    }
    
    // Forçar atualização da câmera
    this.focusCameraOnCurrentPlayer();
    
    // Solicitar novamente estado atualizado da cena para garantir a sincronização
    if (this.socket.connected) {
      console.log("Solicitando estado atualizado da cena após carregamento:", data.sceneName);
      this.socket.emit('requestSceneState', { sceneName: data.sceneName });
    }
    
    console.log('Cena totalmente carregada e jogador controlável');
  }
  
  /**
   * Adiciona método para processar a resposta de estado da cena
   * @param {Object} data - Estado da cena recebido do servidor
   */
  handleSceneState(data) {
    console.log('Estado da cena recebido:', data);
    
    // Processar jogadores da cena
    if (data.players && Array.isArray(data.players)) {
      data.players.forEach(playerData => {
        // Pular o jogador atual, que já deve estar presente
        if (playerData.id === this.currentPlayerId) return;
        
        // Atualizar ou criar o jogador
        this.updatePlayer(playerData);
      });
    }
    
    // Atualizar contador de jogadores
    this.updatePlayerCount();
    
    console.log(`Jogadores na cena "${this.currentSceneName}":`, this.players.size);
  }
  
  /**
   * Manipula o evento de mudança de cena
   * @param {Object} data - Dados da mudança de cena
   */
  handleSceneChange(data) {
    if (data.sceneName && this.sceneManager) {
      this.sceneManager.changeScene(data.sceneName);
      this.currentSceneName = data.sceneName;
    }
  }
  
  /**
   * Processa uma atualização do servidor para um jogador
   * @param {Object} playerData - Dados do jogador recebidos do servidor
   */
  processPlayerUpdate(playerData) {
    if (!playerData || !playerData.id) return null;
    
    // Obter jogador existente ou criar um novo
    let player = this.players.get(playerData.id);
    
    if (player) {
      // Para jogadores existentes, usar updateFromServer para aplicar todas as atualizações
      player.updateFromServer(playerData);
      
      // Atualizar física se necessário
      if (this.physicsManager && this.physicsManager.initialized) {
        this.physicsManager.updatePlayerBody(player);
      }
      
      return player;
    } else {
      // Para novos jogadores, criar uma nova instância
      return this.updatePlayer(playerData);
    }
  }
  
  /**
   * Processa uma mensagem de atualização de posição do servidor
   * @param {Object} data - Dados de posição recebidos
   */
  processPositionUpdate(data) {
    if (!data || !data.id) return;
    
    const player = this.players.get(data.id);
    if (!player) return;
    
    // Verificar se a mensagem é recente (anti-replay attack)
    if (data.timestamp && (Date.now() - data.timestamp > 5000)) {
      console.warn('Ignorando atualização de posição desatualizada');
      return;
    }
    
    // Aplicar posição autorizada do servidor
    if (data.position) {
      player.updatePosition(data.position);
      
      // Se for o jogador atual, atualizar a câmera
      if (data.id === this.currentPlayerId && this.ui) {
        this.ui.updateCamera(player);
      }
    }
  }
  
  /**
   * Processa uma atualização de atributos de jogador do servidor
   * @param {Object} data - Dados de atributos recebidos
   */
  processAttributesUpdate(data) {
    if (!data || !data.id) return;
    
    const player = this.players.get(data.id);
    if (!player) return;
    
    // Atualizar atributos controlados pelo servidor
    player.updateFromServer(data);
    
    // Se for o jogador atual, atualizar a interface
    if (data.id === this.currentPlayerId && this.ui) {
      this.ui.updatePlayerInfo(player);
    }
  }
  
  /**
   * Processa o estado inicial do jogo recebido do servidor
   * @param {Object} data - Dados do estado do jogo
   */
  processGameState(data) {
    console.log('Processando estado do jogo:', data);
    
    // Atualizar tamanho do mundo se for diferente
    if (data.worldSize && data.worldSize !== this.worldSize) {
      this.worldSize = data.worldSize;
    }
    
    // Processar jogadores
    if (data.players && Array.isArray(data.players)) {
      data.players.forEach(playerData => {
        // Apenas adicionar jogadores que estão na mesma cena
        if (!playerData.sceneName || playerData.sceneName === this.currentSceneName) {
          this.processPlayerUpdate(playerData);
        }
      });
    }
    
    // Atualizar contador de jogadores após processar todos
    this.updatePlayerCount();
    
    // Armazenar ID do jogador atual
    if (data.currentPlayer) {
      this.currentPlayerId = data.currentPlayer.id;
      
      // Registrar a cena atual do jogador
      this.currentSceneName = data.currentPlayer.sceneName || 'main';
      
      // Processar dados do jogador atual (inclui atributos do servidor)
      const currentPlayer = this.processPlayerUpdate(data.currentPlayer);
      
      // Notificar a UI
      if (currentPlayer && this.ui && this.ui.updatePlayerInfo) {
        this.ui.updatePlayerInfo(currentPlayer);
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
}

export default GameService; 