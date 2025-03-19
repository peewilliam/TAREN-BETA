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
  nameHeight: 3.5
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
  // Adicione outras texturas aqui
};

// Teclas de controle
export const CONTROL_KEYS = {
  forward: 'w',
  left: 'a',
  backward: 's', 
  right: 'd',
  chat: 'Enter',
  closeChat: 'Escape'
};

// Mensagens do sistema
export const SYSTEM_MESSAGES = {
  connectionError: 'Erro ao conectar ao servidor. Tentando novamente...',
  playerJoined: (name) => `${name} entrou no jogo!`,
  playerLeft: (name) => `${name} saiu do jogo.`,
  loading: 'Carregando o mundo...',
  connected: 'Conectado ao servidor, aguardando dados do jogo...'
};

export default {
  CAMERA_CONFIG,
  WORLD_CONFIG,
  PLAYER_CONFIG,
  LIGHT_CONFIG,
  UI_CONFIG,
  TEXTURE_PATHS,
  CONTROL_KEYS,
  SYSTEM_MESSAGES
}; 