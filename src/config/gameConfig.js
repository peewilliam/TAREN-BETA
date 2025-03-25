/**
 * Configurações centralizadas do jogo
 */

// Configurações da câmera
export const CAMERA_CONFIG = {
  fov: 75,
  nearPlane: 0.1,
  farPlane: 1000,
  initialPosition: { x: 0, y: 20, z: 20 },
  lookAt: { x: 0, y: 0, z: 0 }
};

// Configurações do mundo
export const WORLD_CONFIG = {
  size: 100,
  groundColor: 0x44AA44,
  skyColor: 0x87CEEB,
  gridSize: 20,
  borderHeight: 5,
  borderColor: 0x333333
};

// Configurações do jogador
export const PLAYER_CONFIG = {
  moveSpeed: 0.2,
  bodyColor: 0x3366ff,
  headColor: 0xffcc99,
  bodySize: { x: 1, y: 2, z: 1 },
  headRadius: 0.5,
  nameHeight: 3.5,
  // Configurações de movimento preditivo
  prediction: {
    enabled: true,    // Habilitar movimento preditivo
    lerp: 0.3,        // Fator de interpolação para correções
    maxDelay: 300     // Tempo máximo para aceitar correções (ms)
  }
};

// Configurações da luz
export const LIGHT_CONFIG = {
  ambient: {
    color: 0xffffff,
    intensity: 0.7
  },
  directional: {
    color: 0xffffff,
    intensity: 0.8,
    position: { x: 50, y: 200, z: 100 }
  }
};

// Configurações de UI
export const UI_CONFIG = {
  chat: {
    width: 350,
    height: 200,
    displayTime: 5000 // tempo em ms para o chat ficar visível após nova mensagem
  },
  debug: {
    enabled: true,
    showFPS: true
  }
};

// Configurações de texturas
export const TEXTURE_PATHS = {
  ground: 'https://i.imgur.com/nSpyQ0M.jpg',
  lava: 'https://i.imgur.com/MDGwzBJ.jpg',
  ice: 'https://i.imgur.com/8uwgnLt.jpg',
  arena: 'https://i.imgur.com/T8bFRR5.jpg',
  // Outras texturas podem ser adicionadas aqui
};

// Configurações específicas para cada cena
export const SCENE_CONFIG = {
  main: {
    skyColor: 0x87CEEB, // Azul celeste
    groundTexture: TEXTURE_PATHS.ground,
    ambientLightIntensity: 0.7,
    fogColor: 0xDDEEFF,
    fogDensity: 0.01,
    worldSize: 100
  },
  'dungeon-fire': {
    skyColor: 0x331111, // Vermelho escuro
    groundTexture: TEXTURE_PATHS.lava,
    ambientLightIntensity: 0.5,
    fogColor: 0x990000,
    fogDensity: 0.03,
    worldSize: 80
  },
  'dungeon-ice': {
    skyColor: 0x111133, // Azul escuro
    groundTexture: TEXTURE_PATHS.ice,
    ambientLightIntensity: 0.6,
    fogColor: 0x88BBFF,
    fogDensity: 0.02,
    worldSize: 80
  },
  arena: {
    skyColor: 0x333333, // Cinza escuro
    groundTexture: TEXTURE_PATHS.arena,
    ambientLightIntensity: 0.8,
    fogColor: 0x555555,
    fogDensity: 0.005,
    worldSize: 100
  }
};

// Teclas de controle
export const CONTROL_KEYS = {
  forward: 'w',
  left: 'a',
  backward: 's', 
  right: 'd',
  chat: 'Enter',
  closeChat: 'Escape',
  interact: 'e' // Para interagir com portais
};

// Mensagens do sistema
export const SYSTEM_MESSAGES = {
  connectionError: 'Erro ao conectar ao servidor. Tentando novamente...',
  playerJoined: (name) => `${name} entrou no jogo!`,
  playerLeft: (name) => `${name} saiu do jogo.`,
  loading: 'Carregando o mundo...',
  connected: 'Conectado ao servidor, aguardando dados do jogo...',
  sceneChange: (sceneName) => `Teleportando para: ${sceneName}...`,
  nearPortal: (destination) => `Pressione E para entrar em: ${destination}`,
  movementError: (reason) => `Erro de movimento: ${reason}`
};

export default {
  CAMERA_CONFIG,
  WORLD_CONFIG,
  PLAYER_CONFIG,
  LIGHT_CONFIG,
  UI_CONFIG,
  TEXTURE_PATHS,
  SCENE_CONFIG,
  CONTROL_KEYS,
  SYSTEM_MESSAGES
}; 