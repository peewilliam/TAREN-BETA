import * as THREE from 'three';
import { WORLD_CONFIG, LIGHT_CONFIG, TEXTURE_PATHS } from '../config/gameConfig';

/**
 * Classe que gerencia a cena do jogo
 */
class GameScene {
  /**
   * Cria uma nova cena de jogo
   * @param {Function} onLoadCallback - Callback chamado quando a cena terminar de carregar
   */
  constructor(onLoadCallback) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(WORLD_CONFIG.skyColor);
    this.onLoadCallback = onLoadCallback;
    this.worldSize = WORLD_CONFIG.size;
    
    this.setupLights();
    this.setupGround();
    this.setupBorders();
  }
  
  /**
   * Configura as luzes da cena
   */
  setupLights() {
    // Luz ambiente
    const ambientLight = new THREE.AmbientLight(
      LIGHT_CONFIG.ambient.color, 
      LIGHT_CONFIG.ambient.intensity
    );
    this.scene.add(ambientLight);
    
    // Luz direcional
    const directionalLight = new THREE.DirectionalLight(
      LIGHT_CONFIG.directional.color, 
      LIGHT_CONFIG.directional.intensity
    );
    directionalLight.position.set(
      LIGHT_CONFIG.directional.position.x,
      LIGHT_CONFIG.directional.position.y,
      LIGHT_CONFIG.directional.position.z
    );
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);
  }
  
  /**
   * Configura o chão da cena
   */
  setupGround() {
    // Geometria do chão
    const groundGeometry = new THREE.PlaneGeometry(
      this.worldSize, 
      this.worldSize
    );
    
    // Carrega a textura do chão
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      TEXTURE_PATHS.ground,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8);
        
        const groundMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Adicionar grade para orientação
        const gridHelper = new THREE.GridHelper(this.worldSize, WORLD_CONFIG.gridSize);
        this.scene.add(gridHelper);
        
        if (this.onLoadCallback) {
          this.onLoadCallback('Texturas carregadas');
        }
      },
      undefined,
      (error) => {
        console.error('Erro ao carregar textura:', error);
        // Fallback para material simples
        const groundMaterial = new THREE.MeshStandardMaterial({
          color: WORLD_CONFIG.groundColor,
          side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Adicionar grade para orientação
        const gridHelper = new THREE.GridHelper(this.worldSize, WORLD_CONFIG.gridSize);
        this.scene.add(gridHelper);
        
        if (this.onLoadCallback) {
          this.onLoadCallback('Fallback para textura padrão');
        }
      }
    );
  }
  
  /**
   * Configura as bordas do mundo
   */
  setupBorders() {
    const borderMaterial = new THREE.MeshStandardMaterial({ 
      color: WORLD_CONFIG.borderColor 
    });
    
    const createBorder = (posX, posZ, width, depth, height) => {
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const border = new THREE.Mesh(geometry, borderMaterial);
      border.position.set(posX, height/2, posZ);
      border.castShadow = true;
      border.receiveShadow = true;
      this.scene.add(border);
    };
    
    const halfSize = this.worldSize / 2;
    const borderHeight = WORLD_CONFIG.borderHeight;
    
    // Criar as 4 bordas
    createBorder(0, -halfSize - 2.5, this.worldSize + 10, 5, borderHeight); // Norte
    createBorder(0, halfSize + 2.5, this.worldSize + 10, 5, borderHeight);  // Sul
    createBorder(-halfSize - 2.5, 0, 5, this.worldSize, borderHeight);      // Oeste
    createBorder(halfSize + 2.5, 0, 5, this.worldSize, borderHeight);       // Leste
  }
  
  /**
   * Adiciona um objeto à cena
   * @param {THREE.Object3D} object - Objeto a ser adicionado
   */
  add(object) {
    this.scene.add(object);
  }
  
  /**
   * Remove um objeto da cena
   * @param {THREE.Object3D} object - Objeto a ser removido
   */
  remove(object) {
    this.scene.remove(object);
  }
  
  /**
   * Redimensiona a cena quando a janela é redimensionada
   * @param {THREE.PerspectiveCamera} camera - Câmera da cena
   * @param {THREE.WebGLRenderer} renderer - Renderizador
   */
  handleResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

export default GameScene; 