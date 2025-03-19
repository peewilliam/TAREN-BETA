require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'sua_chave_secreta_aqui'
  },
  game: {
    worldSize: 100,
    spawnArea: {
      minX: -45,
      maxX: 45,
      minY: -45,
      maxY: 45
    },
    playerColors: [
      0x3366ff, 0xff6633, 0x33ff66, 0xff33cc, 
      0xffcc33, 0x33ccff, 0xcc33ff, 0x66ff33
    ],
    // Configurações de balanceamento do jogo
    settings: {
      moveSpeed: 0.2,
      chatMessageMaxLength: 100
    },
    // Configurações das cenas
    scenes: {
      main: {
        name: 'Hub Central',
        worldSize: 100,
        spawnPoint: { x: 0, y: 0 }
      },
      'dungeon-fire': {
        name: 'Dungeon de Fogo',
        worldSize: 80,
        spawnPoint: { x: 0, y: 30 }
      },
      'dungeon-ice': {
        name: 'Dungeon de Gelo',
        worldSize: 80,
        spawnPoint: { x: 0, y: 30 }
      },
      'arena': {
        name: 'Arena',
        worldSize: 100,
        spawnPoint: { x: 0, y: 45 }
      }
    }
  },
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://seu-dominio.com' 
      : 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
}; 