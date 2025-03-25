// Configurações do jogo
const game = {
  // Tamanho do mundo
  worldSize: 100,
  
  // Velocidade padrão dos jogadores
  defaultSpeed: 3,
  
  // Velocidade máxima permitida (anti-cheat)
  maxSpeed: 6,
  
  // Valor máximo para estatísticas de jogador
  maxStatValue: 100,
  
  // Configurações para cenas específicas
  scenes: {
    'main': { 
      worldSize: 100,
      name: 'Hub Central'
    },
    'dungeon-fire': { 
      worldSize: 80,
      name: 'Dungeon de Fogo'
    },
    'dungeon-ice': { 
      worldSize: 80,
      name: 'Dungeon de Gelo'
    },
    'arena': { 
      worldSize: 60,
      name: 'Arena'
    }
  },
  
  // Área de spawn para novos jogadores
  spawnArea: {
    minX: -10,
    maxX: 10,
    minY: -10,
    maxY: 10
  },
  
  // Cores disponíveis para jogadores
  playerColors: [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#33FFF5',
    '#FFBD33', '#BD33FF', '#FF3333', '#33FFBD', '#A833FF'
  ],
  
  // Configurações gerais do jogo
  settings: {
    chatMessageMaxLength: 100,
    playerMoveInterval: 50, // ms entre atualizações de movimento
  }
};

module.exports = {
  game,
  server: {
    port: process.env.PORT || 3000,
    rateLimit: {
      windowMs: 60 * 1000,
      max: 100
    }
  }
}; 