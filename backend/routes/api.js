const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Status do servidor
router.get('/health', gameController.getHealth);

// Informações do jogo
router.get('/game', gameController.getGameInfo);

// Listar todos os jogadores
router.get('/players', gameController.getPlayers);

// Obter um jogador por ID
router.get('/players/:id', gameController.getPlayerById);

module.exports = router; 