const gameService = require('../services/GameService');
const config = require('../config');

class SocketManager {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
    console.log('Socket Manager inicializado');
    
    // Criar salas para cada cena
    this.setupSceneRooms();
  }
  
  /**
   * Configurar salas para cada cena
   */
  setupSceneRooms() {
    // Definir as cenas disponíveis
    this.scenes = ['main', 'dungeon-fire', 'dungeon-ice', 'arena'];
    
    // Informações das salas (para estatísticas)
    this.sceneRooms = {
      'main': { players: new Set() },
      'dungeon-fire': { players: new Set() },
      'dungeon-ice': { players: new Set() },
      'arena': { players: new Set() }
    };
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Novo jogador conectado:', socket.id);
      
      // Criar novo jogador
      const player = gameService.addPlayer(socket.id);
      console.log(`Jogador ${player.name} (${socket.id}) criado na posição:`, player.position);
      
      // Adicionar à sala padrão (main)
      socket.join('main');
      this.sceneRooms['main'].players.add(socket.id);
      
      // Enviar estado inicial para o novo jogador
      this.sendInitialState(socket, player);
      
      // Notificar outros jogadores sobre o novo jogador
      this.broadcastPlayerJoined(socket, player);
      
      // Configurar eventos do socket
      this.setupPlayerEvents(socket);
    });
  }

  sendInitialState(socket, player) {
    socket.emit('gameState', {
      players: gameService.getPlayersInScene(player.sceneName),
      currentPlayer: player.serialize(),
      worldSize: config.game.worldSize
    });
  }

  broadcastPlayerJoined(socket, player) {
    // Apenas enviar para jogadores na mesma cena
    socket.to(player.sceneName).emit('playerJoined', player.serialize());
  }

  setupPlayerEvents(socket) {
    // Atualizar posição do jogador usando movimentação baseada em servidor
    socket.on('moveCommand', (data) => {
      const player = gameService.getPlayer(socket.id);
      if (!player) return;
      
      // Validar dados recebidos
      if (!data || !data.direction || typeof data.direction.x !== 'number' || typeof data.direction.z !== 'number') {
        console.warn(`Dados de movimento inválidos recebidos de ${socket.id}:`, data);
        return;
      }
      
      // Processar o movimento com o Game Service
      const result = gameService.calculatePlayerMovement(socket.id, {
        x: data.direction.x,
        z: data.direction.z,
        timestamp: data.timestamp || Date.now()
      });
      
      if (result && result.success) {
        // Enviar posição atualizada para todos os jogadores na mesma cena
        socket.to(player.sceneName).emit('playerMoved', {
          id: socket.id,
          position: player.position,
          direction: data.direction,
          timestamp: result.timestamp
        });
        
        // Enviar confirmação para o próprio jogador
        socket.emit('positionUpdated', {
          position: player.position,
          timestamp: result.timestamp
        });
      } else if (result) {
        // Enviar mensagem de erro para o cliente
        socket.emit('movementError', {
          reason: result.reason || 'Erro ao processar movimento',
          timestamp: Date.now()
        });
      }
    });

    // Manter o evento updatePosition para compatibilidade, mas adicionar validação servidora
    socket.on('updatePosition', (position) => {
      const player = gameService.getPlayer(socket.id);
      if (!player) return;
      
      // Validar a posição recebida (anti-cheat básico)
      const currentPos = player.position;
      const maxDistance = 5; // Distância máxima permitida por atualização (anti-teleporte)
      
      const dx = position.x - currentPos.x;
      const dy = position.y - currentPos.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      // Se a distância for muito grande, rejeitar o movimento e enviar a posição correta
      if (distance > maxDistance) {
        console.warn(`Movimento suspeito detectado para jogador ${socket.id}. Distância: ${distance}`);
        
        // Enviar a posição correta de volta para o cliente
        socket.emit('positionUpdated', {
          position: currentPos,
          timestamp: Date.now()
        });
        return;
      }
      
      // Atualizar a posição (já que foi validada)
      if (gameService.updatePlayerPosition(socket.id, position)) {
        // Enviar atualização apenas para jogadores na mesma cena
        socket.to(player.sceneName).emit('playerMoved', {
          id: socket.id,
          position: player.position
        });
      }
    });

    // Chat
    socket.on('chatMessage', (message) => {
      const player = gameService.getPlayer(socket.id);
      if (!player) return;
      
      const chatMessage = gameService.createChatMessage(socket.id, message);
      
      if (chatMessage) {
        // Enviar mensagem para todos na cena do jogador
        this.io.to(player.sceneName).emit('chatMessage', chatMessage);
        console.log(`Chat: ${chatMessage.playerName}: ${chatMessage.message}`);
      }
    });
    
    // Mudança de cena
    socket.on('changeScene', (data) => {
      if (!data.sceneName) return;
      
      const player = gameService.getPlayer(socket.id);
      if (!player) return;
      
      // Verificar se o jogador já está na cena solicitada
      if (player.sceneName === data.sceneName) {
        console.log(`Jogador ${player.name} já está na cena ${data.sceneName}, ignorando solicitação`);
        return;
      }
      
      const oldScene = player.sceneName;
      
      // Atualizar a cena do jogador
      if (gameService.changePlayerScene(socket.id, data.sceneName)) {
        // Remover da sala antiga
        socket.leave(oldScene);
        this.sceneRooms[oldScene].players.delete(socket.id);
        
        // Entrar na nova sala
        socket.join(player.sceneName);
        this.sceneRooms[player.sceneName].players.add(socket.id);
        
        // Enviar estado da nova cena para o jogador
        this.sendSceneState(socket, player);
        
        // Notificar jogadores na nova cena sobre a entrada do jogador
        socket.to(player.sceneName).emit('playerJoined', player.serialize());
        
        // Notificar jogadores na cena anterior que o jogador saiu
        socket.to(oldScene).emit('playerLeft', socket.id);
        
        // Notificar todos os jogadores sobre a mudança de cena
        this.io.emit('playerChangedScene', {
          playerId: player.id,
          playerName: player.name,
          sceneName: player.sceneName
        });
        
        console.log(`Jogador ${player.name} mudou da cena ${oldScene} para ${player.sceneName}`);
      }
    });
    
    // Solicitação de estado da cena atual
    socket.on('requestSceneState', (data) => {
      const player = gameService.getPlayer(socket.id);
      if (!player) return;
      
      console.log(`Jogador ${player.name} solicitou estado da cena ${data.sceneName || player.sceneName}`);
      
      // Usar a cena atual do jogador se não for especificada
      const sceneName = data.sceneName || player.sceneName;
      
      // Enviar a lista atual de jogadores na cena
      socket.emit('sceneState', {
        sceneName: sceneName,
        players: gameService.getPlayersInScene(sceneName)
      });
    });

    // Desconexão
    socket.on('disconnect', () => {
      const player = gameService.getPlayer(socket.id);
      
      if (player) {
        console.log(`Jogador ${player.name} (${socket.id}) desconectado`);
        
        // Remover da sala
        if (this.sceneRooms[player.sceneName]) {
          this.sceneRooms[player.sceneName].players.delete(socket.id);
        }
        
        // Notificar outros jogadores na cena que este jogador saiu
        socket.to(player.sceneName).emit('playerLeft', socket.id);
        
        // Remover o jogador
        gameService.removePlayer(socket.id);
      }
    });
  }
  
  /**
   * Envia o estado completo da cena para um jogador
   * @param {Object} socket - Socket do jogador
   * @param {Object} player - Dados do jogador
   */
  sendSceneState(socket, player) {
    // Obter o tamanho do mundo específico da cena, se disponível
    const sceneConfig = config.game.scenes[player.sceneName] || {};
    const worldSize = sceneConfig.worldSize || config.game.worldSize;
    
    socket.emit('gameState', {
      players: gameService.getPlayersInScene(player.sceneName),
      currentPlayer: player.serialize(),
      worldSize: worldSize
    });
    
    // Enviar mensagem de confirmação
    this.notifyPlayer(socket.id, 'sceneLoaded', {
      sceneName: player.sceneName,
      message: `Bem-vindo a ${sceneConfig.name || player.sceneName}`
    });
  }

  // Métodos adicionais para implementação futura
  broadcastGameUpdate() {
    // Enviar atualizações por cena
    this.scenes.forEach(sceneName => {
      this.io.to(sceneName).emit('gameUpdate', {
        players: gameService.getPlayersInScene(sceneName)
      });
    });
  }

  notifyPlayer(socketId, event, data) {
    this.io.to(socketId).emit(event, data);
  }
  
  /**
   * Obtém estatísticas das salas
   * @returns {Object} - Estatísticas das salas
   */
  getRoomStats() {
    const stats = {};
    
    Object.keys(this.sceneRooms).forEach(sceneName => {
      stats[sceneName] = {
        players: this.sceneRooms[sceneName].players.size
      };
    });
    
    return stats;
  }
}

module.exports = SocketManager; 