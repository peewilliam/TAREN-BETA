import * as THREE from 'three';
import MainScene from './MainScene';
import DungeonFireScene from './DungeonFireScene';
import DungeonIceScene from './DungeonIceScene';
import ArenaScene from './ArenaScene';

/**
 * Classe responsável por gerenciar as cenas do jogo
 */
class SceneManager {
  /**
   * Inicializa o gerenciador de cenas
   * @param {Function} onLoadCallback - Callback chamado durante carregamento
   * @param {Object} socketManager - Gerenciador de sockets
   */
  constructor(onLoadCallback, socketManager) {
    this.currentScene = null;
    this.scenes = new Map();
    this.onLoadCallback = onLoadCallback;
    this.socketManager = socketManager;
    this.camera = window.camera;
    
    // Inicializar cenas
    this.initializeScenes();
  }
  
  /**
   * Inicializa todas as cenas disponíveis
   */
  initializeScenes() {
    // Adicionar todas as cenas ao mapa
    this.scenes.set('main', new MainScene(this.onLoadCallback));
    this.scenes.set('dungeon-fire', new DungeonFireScene(this.onLoadCallback));
    this.scenes.set('dungeon-ice', new DungeonIceScene(this.onLoadCallback));
    this.scenes.set('arena', new ArenaScene(this.onLoadCallback));
    
    // Definir cena principal como atual
    this.currentScene = this.scenes.get('main');
  }
  
  /**
   * Troca para uma cena específica
   * @param {string} sceneName - Nome da cena para troca
   * @returns {boolean} - Se a troca foi bem-sucedida
   */
  changeScene(sceneName) {
    // Verificar se a cena existe
    if (!this.scenes.has(sceneName)) {
      console.error(`Cena "${sceneName}" não encontrada`);
      return false;
    }
    
    // Obter o nome da cena atual
    const currentSceneName = this.getCurrentSceneName();
    
    // Verificar se já estamos na cena solicitada
    if (currentSceneName === sceneName) {
      console.log(`Já estamos na cena ${sceneName}, ignorando mudança`);
      return false;
    }
    
    console.log(`Iniciando mudança de cena: ${currentSceneName} -> ${sceneName}`);
    
    const newScene = this.scenes.get(sceneName);
    
    // Desativar a cena atual
    if (this.currentScene && typeof this.currentScene.onDeactivate === 'function') {
      this.currentScene.onDeactivate();
    }
    
    // Informa ao servidor sobre a troca de cena (importante!)
    if (this.socketManager && this.socketManager.socket) {
      this.socketManager.socket.emit('changeScene', { sceneName });
    }
    
    // Salvar objetos da cena atual que precisam ser transferidos
    const objectsToTransfer = new Map();
    if (window.game && window.game.gameService) {
      const currentPlayer = window.game.gameService.getCurrentPlayer();
      if (currentPlayer && currentPlayer.mesh) {
        objectsToTransfer.set('currentPlayer', currentPlayer.mesh);
      }
    }
    
    // Realizar a troca de cena
    this.currentScene = newScene;
    
    // Ativar a nova cena
    if (this.currentScene && typeof this.currentScene.onActivate === 'function') {
      this.currentScene.onActivate();
    }
    
    // Transferir objetos importantes para a nova cena
    objectsToTransfer.forEach((object, key) => {
      if (key === 'currentPlayer') {
        // Adicionar novamente o jogador à nova cena
        this.add(object);
      }
    });
    
    // Notifica callback de carregamento
    if (this.onLoadCallback) {
      this.onLoadCallback(`Carregando cena: ${sceneName}`);
    }
    
    console.log(`Mudança de cena concluída: ${currentSceneName} -> ${sceneName}`);
    return true;
  }
  
  /**
   * Retorna a cena atual para renderização
   * @returns {THREE.Scene} - Cena Three.js atual
   */
  getCurrentScene() {
    return this.currentScene ? this.currentScene.scene : null;
  }
  
  /**
   * Retorna o nome da cena atual
   * @returns {string} - Nome da cena atual
   */
  getCurrentSceneName() {
    const currentSceneEntry = Array.from(this.scenes.entries())
      .find(([_, scene]) => scene === this.currentScene);
      
    return currentSceneEntry ? currentSceneEntry[0] : null;
  }
  
  /**
   * Adiciona um objeto à cena atual
   * @param {THREE.Object3D} object - Objeto para adicionar
   */
  add(object) {
    if (this.currentScene) {
      this.currentScene.add(object);
    }
  }
  
  /**
   * Remove um objeto da cena atual
   * @param {THREE.Object3D} object - Objeto para remover
   */
  remove(object) {
    if (this.currentScene) {
      this.currentScene.remove(object);
    }
  }
  
  /**
   * Manuseia o redimensionamento da janela
   * @param {THREE.PerspectiveCamera} camera - Câmera da cena
   * @param {THREE.WebGLRenderer} renderer - Renderizador
   */
  handleResize(camera, renderer) {
    if (this.currentScene) {
      this.currentScene.handleResize(camera, renderer);
    }
  }
}

export default SceneManager; 