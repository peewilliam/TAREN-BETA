import * as THREE from 'three';
import { WORLD_CONFIG, LIGHT_CONFIG } from '../config/gameConfig';

/**
 * Classe base para todas as cenas do jogo
 */
class BaseScene {
  /**
   * Cria uma nova cena base
   * @param {Function} onLoadCallback - Callback chamado quando a cena terminar de carregar
   * @param {Object} options - Opções de configuração da cena
   */
  constructor(onLoadCallback, options = {}) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(options.skyColor || WORLD_CONFIG.skyColor);
    this.onLoadCallback = onLoadCallback;
    this.worldSize = options.worldSize || WORLD_CONFIG.size;
    this.objects = new Map(); // Para manter referências a objetos importantes
    this.portals = []; // Lista de portais na cena
    this.physicsManager = null; // Será definido pelo SceneManager
    
    // Configurações específicas da cena
    this.setupLights();
  }
  
  /**
   * Configuração de luzes (método comum a todas as cenas)
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
   * Método para criar o chão da cena
   * @param {string} texturePath - Caminho para textura do chão
   * @param {Object} options - Opções adicionais
   */
  setupGround(texturePath, options = {}) {
    // Geometria do chão
    const groundGeometry = new THREE.PlaneGeometry(
      this.worldSize, 
      this.worldSize
    );
    
    // Parâmetros padrão
    const textureRepeat = options.textureRepeat || 8;
    const groundColor = options.groundColor || WORLD_CONFIG.groundColor;
    
    // Carrega a textura do chão
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      texturePath,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(textureRepeat, textureRepeat);
        
        const groundMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.objects.set('ground', ground);
        
        // Adicionar colisor para o chão se o sistema de física estiver disponível
        if (this.physicsManager && this.physicsManager.initialized) {
          this.physicsManager.addMapCollider(ground, 'ground');
        }
        
        // Adicionar grade para orientação se especificado
        if (options.showGrid !== false) {
          const gridHelper = new THREE.GridHelper(this.worldSize, WORLD_CONFIG.gridSize);
          this.scene.add(gridHelper);
          this.objects.set('grid', gridHelper);
        }
        
        if (this.onLoadCallback) {
          this.onLoadCallback('Texturas carregadas');
        }
      },
      undefined,
      (error) => {
        console.error('Erro ao carregar textura:', error);
        // Fallback para material simples
        const groundMaterial = new THREE.MeshStandardMaterial({
          color: groundColor,
          side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.objects.set('ground', ground);
        
        // Adicionar colisor para o chão se o sistema de física estiver disponível
        if (this.physicsManager && this.physicsManager.initialized) {
          this.physicsManager.addMapCollider(ground, 'ground');
        }
        
        // Adicionar grade para orientação
        if (options.showGrid !== false) {
          const gridHelper = new THREE.GridHelper(this.worldSize, WORLD_CONFIG.gridSize);
          this.scene.add(gridHelper);
          this.objects.set('grid', gridHelper);
        }
        
        if (this.onLoadCallback) {
          this.onLoadCallback('Fallback para textura padrão');
        }
      }
    );
  }
  
  /**
   * Criar um portal para outra cena
   * @param {Object} options - Opções do portal (posição, cor, destino)
   * @returns {Object} - O objeto portal criado
   */
  createPortal(options) {
    const {
      position = { x: 0, y: 0, z: 0 },
      color = 0x00ffff,
      destination = 'main',
      size = 2,
      height = 3,
      name = `Portal para ${destination}`
    } = options;
    
    // Criar grupo para o portal
    const portalGroup = new THREE.Group();
    portalGroup.position.set(position.x, position.y, position.z);
    
    // Material emissor de luz
    const portalMaterial = new THREE.MeshBasicMaterial({ 
      color: color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    // Geometria do portal
    const portalGeometry = new THREE.CylinderGeometry(size, size, height, 32);
    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.rotation.x = Math.PI / 2;
    
    // Criar brilho (partículas ou luz)
    const portalLight = new THREE.PointLight(color, 1, 10);
    portalLight.position.set(0, height/2, 0);
    
    // Adicionar ao grupo
    portalGroup.add(portal);
    portalGroup.add(portalLight);
    
    // Criar metadados do portal
    const portalData = {
      mesh: portalGroup,
      destination,
      position: new THREE.Vector3(position.x, position.y, position.z),
      radius: size,
      name
    };
    
    // Adicionar à lista de portais
    this.portals.push(portalData);
    
    // Adicionar à cena
    this.scene.add(portalGroup);
    
    return portalData;
  }
  
  /**
   * Verifica se um jogador está próximo a algum portal para interação
   * @param {Object} playerPosition - Posição do jogador
   * @returns {Object|null} - Portal com o qual o jogador pode interagir, ou null
   */
  checkPortalInteraction(playerPosition) {
    if (!playerPosition) return null;
    
    const position = new THREE.Vector3(
      playerPosition.x || 0, 
      playerPosition.y || 0, 
      playerPosition.z || 0
    );
    
    // Verificar portais
    for (const portal of this.portals) {
      if (!portal || !portal.position) continue;
      
      const distance = position.distanceTo(portal.position);
      
      // Distância para interação (ligeiramente maior que o raio do portal)
      const interactionDistance = portal.radius * 1.5;
      
      if (distance <= interactionDistance) {
        return portal;
      }
    }
    
    return null;
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
  
  /**
   * Executa ações quando a cena é ativada
   */
  onActivate() {
    // Método a ser sobrescrito pelas cenas filhas
    console.log('Cena ativada');
  }
  
  /**
   * Executa ações quando a cena é desativada
   */
  onDeactivate() {
    // Método a ser sobrescrito pelas cenas filhas
    console.log('Cena desativada');
  }
  
  /**
   * Adiciona colisor de física a um objeto da cena
   * @param {string} objectKey - Chave do objeto no mapa this.objects
   * @param {string} colliderID - ID único para o colisor
   * @param {string} colliderType - Tipo de colisor: 'trimesh', 'cuboid', 'ball', 'auto'
   */
  addColliderToObject(objectKey, colliderID, colliderType = 'auto') {
    if (!this.physicsManager || !this.physicsManager.initialized) {
      console.warn('Sistema de física não inicializado para adicionar colisor');
      return;
    }
    
    const object = this.objects.get(objectKey);
    if (!object) {
      console.warn(`Objeto com chave ${objectKey} não encontrado na cena`);
      return;
    }
    
    return this.physicsManager.addMapCollider(object, colliderID || objectKey, colliderType);
  }
  
  /**
   * Define o gerenciador de física a ser utilizado
   * @param {PhysicsManager} physicsManager - Gerenciador de física
   */
  setPhysicsManager(physicsManager) {
    this.physicsManager = physicsManager;
    
    // Adicionar colisores aos objetos existentes, se o sistema de física estiver disponível
    if (this.physicsManager && this.physicsManager.initialized) {
      // Adicionar colisor ao chão se existir
      const ground = this.objects.get('ground');
      if (ground) {
        // Usar cuboid para o chão (mais eficiente e estável que trimesh)
        this.physicsManager.addMapCollider(ground, 'ground', 'cuboid');
      }
      
      // Adicionar outros colisores específicos da cena (implementado por subclasses)
      this.setupSceneColliders();
    }
  }
  
  /**
   * Configura colisores específicos da cena
   * Este método deve ser sobrescrito por subclasses para adicionar colisores específicos
   */
  setupSceneColliders() {
    // Por padrão não faz nada, deve ser implementado pelas subclasses
  }
}

export default BaseScene; 