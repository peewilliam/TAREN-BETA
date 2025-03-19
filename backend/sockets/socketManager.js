const gameService = require('../services/GameService');
const config = require('../config');

class SocketManager {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
    console.log('Socket Manager inicializado');
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Novo jogador conectado:', socket.id);
      
      // Criar novo jogador
      const player = gameService.addPlayer(socket.id);
      console.log(`Jogador ${player.name} (${socket.id}) criado na posição:`, player.position);
      
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
      players: gameService.getAllPlayers(),
      currentPlayer: player.serialize(),
      worldSize: config.game.worldSize
    });
  }

  broadcastPlayerJoined(socket, player) {
    socket.broadcast.emit('playerJoined', player.serialize());
  }

  setupPlayerEvents(socket) {
    // Atualizar posição do jogador
    socket.on('updatePosition', (position) => {
      if (gameService.updatePlayerPosition(socket.id, position)) {
        const player = gameService.getPlayer(socket.id);
        
        socket.broadcast.emit('playerMoved', {
          id: socket.id,
          position: player.position
        });
      }
    });

    // Chat
    socket.on('chatMessage', (message) => {
      const chatMessage = gameService.createChatMessage(socket.id, message);
      
      if (chatMessage) {
        this.io.emit('chatMessage', chatMessage);
        console.log(`Chat: ${chatMessage.playerName}: ${chatMessage.message}`);
      }
    });

    // Desconexão
    socket.on('disconnect', () => {
      const player = gameService.getPlayer(socket.id);
      
      if (player) {
        console.log(`Jogador ${player.name} (${socket.id}) desconectado`);
        gameService.removePlayer(socket.id);
        this.io.emit('playerLeft', socket.id);
      }
    });
  }

  // Métodos adicionais para implementação futura
  broadcastGameUpdate() {
    this.io.emit('gameUpdate', {
      players: gameService.getAllPlayers()
    });
  }

  notifyPlayer(socketId, event, data) {
    this.io.to(socketId).emit(event, data);
  }
}

module.exports = SocketManager; 