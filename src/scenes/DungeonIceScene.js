import * as THREE from 'three';
import BaseScene from './BaseScene';
import { TEXTURE_PATHS } from '../config/gameConfig';

/**
 * Cena da dungeon de gelo
 */
class DungeonIceScene extends BaseScene {
  /**
   * Cria uma nova dungeon de gelo
   * @param {Function} onLoadCallback - Callback chamado quando a cena terminar de carregar
   */
  constructor(onLoadCallback) {
    // Configuração específica para a dungeon de gelo
    const options = {
      skyColor: 0x111133, // Azul escuro
      worldSize: 80 // Mesmo tamanho da de fogo
    };
    
    super(onLoadCallback, options);
    
    // Configurar elementos da cena
    this.setupScene();
  }
  
  /**
   * Configura os elementos da cena
   */
  setupScene() {
    // Configurar o chão com textura de gelo
    const iceGroundTexture = TEXTURE_PATHS.ice || TEXTURE_PATHS.ground;
    this.setupGround(iceGroundTexture, { 
      textureRepeat: 12,
      groundColor: 0xadd8e6 // Azul claro (fallback)
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
    // Criar formações de gelo/cristais
    this.createIceFormations();
    
    // Criar lagos congelados
    this.createFrozenLakes();
    
    // Criar paredes da caverna gelada
    this.createIceWalls();
  }
  
  /**
   * Cria formações de gelo
   */
  createIceFormations() {
    const formationCount = 15;
    
    for (let i = 0; i < formationCount; i++) {
      // Posição aleatória (evitando o centro)
      let x, z;
      do {
        x = (Math.random() - 0.5) * this.worldSize * 0.8;
        z = (Math.random() - 0.5) * this.worldSize * 0.8;
      } while (Math.sqrt(x*x + z*z) < 10); // Evitar centro
      
      // Altura aleatória
      const height = 4 + Math.random() * 8;
      
      // Criar formação de gelo (cristal)
      const crystalGeometry = new THREE.ConeGeometry(
        0.5 + Math.random() * 1.5, // Raio da base
        height,
        6 // Número de lados (hexágono)
      );
      
      const crystalMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xadd8e6, // Azul claro
        transparent: true,
        opacity: 0.8,
        metalness: 0.9,
        roughness: 0.1
      });
      
      const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
      crystal.position.set(x, height/2, z);
      crystal.castShadow = true;
      crystal.receiveShadow = true;
      
      this.scene.add(crystal);
      
      // Adicionar alguns cristais menores ao redor
      const smallCrystalsCount = Math.floor(Math.random() * 4) + 1;
      for (let j = 0; j < smallCrystalsCount; j++) {
        const smallHeight = 1 + Math.random() * 3;
        const smallGeometry = new THREE.ConeGeometry(0.3 + Math.random() * 0.8, smallHeight, 5);
        const smallCrystal = new THREE.Mesh(smallGeometry, crystalMaterial);
        
        // Posicionar próximo ao cristal principal
        const angle = Math.random() * Math.PI * 2;
        const distance = 1 + Math.random() * 2;
        smallCrystal.position.set(
          x + Math.cos(angle) * distance,
          smallHeight/2,
          z + Math.sin(angle) * distance
        );
        
        smallCrystal.castShadow = true;
        this.scene.add(smallCrystal);
      }
    }
  }
  
  /**
   * Cria lagos congelados
   */
  createFrozenLakes() {
    const lakeCount = 6;
    
    for (let i = 0; i < lakeCount; i++) {
      // Posição aleatória (evitando o centro e a entrada)
      let x, z;
      do {
        x = (Math.random() - 0.5) * this.worldSize * 0.7;
        z = (Math.random() - 0.5) * this.worldSize * 0.7;
      } while (Math.sqrt(x*x + z*z) < 15 || (Math.abs(x) < 10 && z > 25)); // Evitar centro e entrada
      
      // Tamanho aleatório
      const size = 4 + Math.random() * 6;
      
      // Criar lago congelado
      const lakeGeometry = new THREE.CylinderGeometry(size, size, 0.2, 24);
      const lakeMaterial = new THREE.MeshPhysicalMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        metalness: 0.9,
        roughness: 0.1,
        clearcoat: 1.0
      });
      
      const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
      lake.position.set(x, 0.05, z); // Ligeiramente acima do solo
      lake.rotation.x = Math.PI / 2;
      
      this.scene.add(lake);
      
      // Adicionar brilho sutil
      const iceLight = new THREE.PointLight(0x88ccff, 0.5, 8);
      iceLight.position.set(x, 0.5, z);
      this.scene.add(iceLight);
    }
  }
  
  /**
   * Cria paredes da caverna de gelo
   */
  createIceWalls() {
    // Criar as paredes em formato de caverna de gelo
    const wallMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0x88ccff, // Azul claro
      transparent: true,
      opacity: 0.7,
      metalness: 0.7,
      roughness: 0.3
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
      color: 0xff6347, // Vermelho (contraste com o ambiente de gelo)
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
    console.log('Dungeon de Gelo ativada');
    
    // Efeitos específicos quando a cena é ativada
    // Como sons, partículas, etc.
  }
}

export default DungeonIceScene; 