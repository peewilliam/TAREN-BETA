import * as THREE from 'three';
import BaseScene from './BaseScene';
import { TEXTURE_PATHS } from '../config/gameConfig';

/**
 * Cena da dungeon de fogo
 */
class DungeonFireScene extends BaseScene {
  /**
   * Cria uma nova dungeon de fogo
   * @param {Function} onLoadCallback - Callback chamado quando a cena terminar de carregar
   */
  constructor(onLoadCallback) {
    // Configuração específica para a dungeon de fogo
    const options = {
      skyColor: 0x331111, // Vermelho escuro
      worldSize: 80 // Menor que o hub principal
    };
    
    super(onLoadCallback, options);
    
    // Configurar elementos da cena
    this.setupScene();
  }
  
  /**
   * Configura os elementos da cena
   */
  setupScene() {
    // Configurar o chão com textura de lava/fogo
    const fireGroundTexture = TEXTURE_PATHS.lava || TEXTURE_PATHS.ground;
    this.setupGround(fireGroundTexture, { 
      textureRepeat: 12,
      groundColor: 0x8b0000 // Vermelho escuro (fallback)
    });
    
    // Criar elementos do cenário
    this.createEnvironment();
    
    // Criar portal de volta para o hub
    this.createPortals();
  }
  
  /**
   * Cria os elementos do ambiente da dungeon
   */
  createEnvironment() {
    // Criar pilares de fogo/rochas vulcânicas
    this.createPillars();
    
    // Criar poços de lava
    this.createLavaPools();
    
    // Criar paredes da caverna
    this.createCaveWalls();
  }
  
  /**
   * Cria pilares de rocha vulcânica
   */
  createPillars() {
    const pillarCount = 15;
    
    for (let i = 0; i < pillarCount; i++) {
      // Posição aleatória (evitando o centro)
      let x, z;
      do {
        x = (Math.random() - 0.5) * this.worldSize * 0.8;
        z = (Math.random() - 0.5) * this.worldSize * 0.8;
      } while (Math.sqrt(x*x + z*z) < 10); // Evitar centro
      
      // Altura aleatória
      const height = 5 + Math.random() * 10;
      
      // Criar pilar
      const pillarGeometry = new THREE.CylinderGeometry(
        1 + Math.random(), // Raio superior
        2 + Math.random(), // Raio inferior
        height,
        8
      );
      
      const pillarMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3d0c02, // Marrom avermelhado
        roughness: 0.8
      });
      
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(x, height/2, z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      
      this.scene.add(pillar);
    }
  }
  
  /**
   * Cria poços de lava
   */
  createLavaPools() {
    const poolCount = 8;
    
    for (let i = 0; i < poolCount; i++) {
      // Posição aleatória (evitando o centro e a entrada)
      let x, z;
      do {
        x = (Math.random() - 0.5) * this.worldSize * 0.7;
        z = (Math.random() - 0.5) * this.worldSize * 0.7;
      } while (Math.sqrt(x*x + z*z) < 15 || (Math.abs(x) < 10 && z > 25)); // Evitar centro e entrada
      
      // Tamanho aleatório
      const size = 3 + Math.random() * 5;
      
      // Criar poço de lava
      const poolGeometry = new THREE.CylinderGeometry(size, size, 0.5, 16);
      const poolMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff4500, // Laranja avermelhado
        emissive: 0xff4500,
        emissiveIntensity: 0.5
      });
      
      const pool = new THREE.Mesh(poolGeometry, poolMaterial);
      pool.position.set(x, 0.1, z); // Ligeiramente acima do solo
      pool.rotation.x = Math.PI / 2;
      
      // Adicionar luz nos poços de lava
      const lavaLight = new THREE.PointLight(0xff4500, 1, 10);
      lavaLight.position.set(x, 1, z);
      
      this.scene.add(pool);
      this.scene.add(lavaLight);
    }
  }
  
  /**
   * Cria paredes da caverna
   */
  createCaveWalls() {
    // Criar as paredes em formato de caverna
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2e1a0f, // Marrom escuro
      roughness: 1.0,
      metalness: 0.2
    });
    
    // Simplificando com uma caixa ao redor
    const halfSize = this.worldSize / 2;
    const wallHeight = 15;
    const wallThickness = 5;
    
    // Parede norte
    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(this.worldSize, wallHeight, wallThickness),
      wallMaterial
    );
    northWall.position.set(0, wallHeight/2, -halfSize);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    this.scene.add(northWall);
    
    // Parede sul (com abertura para o portal)
    const southWallLeft = new THREE.Mesh(
      new THREE.BoxGeometry((this.worldSize - 10) / 2, wallHeight, wallThickness),
      wallMaterial
    );
    southWallLeft.position.set(-(this.worldSize + 10) / 4, wallHeight/2, halfSize);
    southWallLeft.castShadow = true;
    southWallLeft.receiveShadow = true;
    this.scene.add(southWallLeft);
    
    const southWallRight = new THREE.Mesh(
      new THREE.BoxGeometry((this.worldSize - 10) / 2, wallHeight, wallThickness),
      wallMaterial
    );
    southWallRight.position.set((this.worldSize + 10) / 4, wallHeight/2, halfSize);
    southWallRight.castShadow = true;
    southWallRight.receiveShadow = true;
    this.scene.add(southWallRight);
    
    // Parede oeste
    const westWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, this.worldSize),
      wallMaterial
    );
    westWall.position.set(-halfSize, wallHeight/2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    this.scene.add(westWall);
    
    // Parede leste
    const eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, this.worldSize),
      wallMaterial
    );
    eastWall.position.set(halfSize, wallHeight/2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    this.scene.add(eastWall);
  }
  
  /**
   * Cria portais
   */
  createPortals() {
    // Portal de volta para o hub
    this.createPortal({
      position: { x: 0, y: 1.5, z: 35 },
      color: 0x87ceeb, // Azul (contraste com o ambiente de fogo)
      destination: 'main',
      size: 2.5,
      height: 5,
      name: 'Portal para Hub Central'
    });
  }
  
  /**
   * Ações quando a cena é ativada
   */
  onActivate() {
    super.onActivate();
    console.log('Dungeon de Fogo ativada');
    
    // Aqui podemos adicionar efeitos específicos quando a cena é ativada
    // Como sons, partículas, etc.
  }
}

export default DungeonFireScene; 