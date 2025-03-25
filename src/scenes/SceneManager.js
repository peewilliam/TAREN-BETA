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
   * @param {Object} physicsManager - Gerenciador de física (opcional)
   */
  constructor(onLoadCallback, socketManager, physicsManager = null) {
    this.currentScene = null;
    this.scenes = new Map();
    this.onLoadCallback = onLoadCallback;
    this.socketManager = socketManager;
    this.camera = window.camera;
    this.physicsManager = physicsManager;
    
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
    
    // Configurar gerenciador de física para todas as cenas
    if (this.physicsManager) {
      this.scenes.forEach(scene => {
        scene.setPhysicsManager(this.physicsManager);
      });
    }
    
    // Definir cena principal como atual
    this.currentScene = this.scenes.get('main');
  }
  
  /**
   * Define o gerenciador de física para este SceneManager
   * @param {Object} physicsManager - Gerenciador de física
   */
  setPhysicsManager(physicsManager) {
    this.physicsManager = physicsManager;
    
    // Configurar gerenciador de física para todas as cenas
    if (this.physicsManager) {
      this.scenes.forEach(scene => {
        scene.setPhysicsManager(this.physicsManager);
      });
    }
  }
  
  /**
   * Troca para uma cena específica
   * @param {string} sceneName - Nome da cena para troca
   * @returns {boolean} - Se a troca foi bem-sucedida
   */
  changeScene(sceneName) {
    if (!this.scenes.has(sceneName)) {
      console.error(`Cena "${sceneName}" não encontrada`);
      return false;
    }
    
    const currentSceneName = this.currentScene ? [...this.scenes.entries()].find(([key, scene]) => scene === this.currentScene)?.[0] || 'unknown' : 'none';
    console.log(`Mudando de cena: ${currentSceneName} -> ${sceneName}`);
    
    // Remover objetos da cena atual
    if (this.currentScene) {
      // Se houver um sistema de física, remover colisores associados a esta cena
      if (this.physicsManager && this.physicsManager.initialized) {
        // Limpar colisores da cena atual (isso poderia ser melhorado para remover 
        // apenas os colisores específicos desta cena, se necessário)
        this.physicsManager.mapColliders.clear();
      }
    }
    
    // Definir nova cena
    this.currentScene = this.scenes.get(sceneName);
    
    // Notificar o servidor sobre a mudança de cena
    if (this.socketManager) {
      this.socketManager.socket.emit('changeScene', { sceneName });
    }
    
    // Se houver um sistema de física, configurar colisores para a nova cena
    if (this.physicsManager && this.physicsManager.initialized) {
      this.currentScene.setPhysicsManager(this.physicsManager);
    }
    
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