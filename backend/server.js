require('dotenv').config();
const http = require('http');
const socketIO = require('socket.io');
const app = require('./app');
const config = require('./config');
const SocketManager = require('./sockets/socketManager');
const logger = require('./utils/logger');

// Criar servidor HTTP
const server = http.createServer(app);

// Configurar Socket.IO
const io = socketIO(server, {
  cors: config.cors
});

// Inicializar gerenciador de sockets
const socketManager = new SocketManager(io);

// Iniciar servidor
const PORT = config.server.port;
server.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT} em modo ${config.server.env}`);
  logger.info(`Acesse http://localhost:${PORT}/api/health para verificar o status`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Erro não capturado:', error);
  // Em produção, seria recomendado notificar administradores e possivelmente reiniciar
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Rejeição não tratada:', reason);
});

// Tratamento de desligamento gracioso
process.on('SIGTERM', () => {
  logger.info('Recebido SIGTERM. Desligando servidor...');
  server.close(() => {
    logger.info('Servidor desligado com sucesso');
    process.exit(0);
  });
}); 