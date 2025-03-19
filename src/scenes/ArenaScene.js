import * as THREE from 'three';
import BaseScene from './BaseScene';
import { TEXTURE_PATHS } from '../config/gameConfig';

/**
 * Cena da arena de batalha
 */
class ArenaScene extends BaseScene {
  /**
   * Cria uma nova arena
   * @param {Function} onLoadCallback - Callback chamado quando a cena terminar de carregar
   */
  constructor(onLoadCallback) {
    // Configuração específica para a arena
    const options = {
      skyColor: 0x333333, // Cinza escuro
      worldSize: 100 // Grande o suficiente para batalhas
    };
    
    super(onLoadCallback, options);
    
    // Configurar elementos da cena
    this.setupScene();
  }
  
  /**
   * Configura os elementos da cena
   */
  setupScene() {
    // Configurar o chão da arena
    const arenaGroundTexture = TEXTURE_PATHS.arena || TEXTURE_PATHS.ground;
    this.setupGround(arenaGroundTexture, { 
      textureRepeat: 20,
      groundColor: 0xCD853F // Marrom areia (fallback)
    });
    
    // Criar estrutura da arena
    this.createArenaStructure();
    
    // Criar decorações
    this.createDecorations();
    
    // Criar portal de volta para o hub
    this.createPortals();
  }
  
  /**
   * Cria a estrutura principal da arena
   */
  createArenaStructure() {
    // Criar um coliseu circular
    this.createColosseum();
    
    // Adicionar luzes especiais para a arena
    this.addArenaLights();
  }
  
  /**
   * Cria um coliseu para a arena
   */
  createColosseum() {
    const radius = 40; // Raio do coliseu
    const wallHeight = 12; // Altura das paredes
    const wallThickness = 5; // Espessura das paredes
    
    // Material para as paredes
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xD2B48C, // Tan
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Criar a parede circular externa
    const wallGeometry = new THREE.CylinderGeometry(
      radius + wallThickness,
      radius + wallThickness,
      wallHeight,
      32, // Número de segmentos
      1,
      true // Aberto no centro
    );
    
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = wallHeight / 2;
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);
    
    // Criar arquibancadas
    this.createStands(radius, wallHeight, wallMaterial);
    
    // Criar área de batalha central
    const arenaFloorRadius = radius - 5;
    const arenaFloorGeo = new THREE.CircleGeometry(arenaFloorRadius, 32);
    const arenaFloorMat = new THREE.MeshStandardMaterial({
      color: 0xBDB76B, // Khaki
      roughness: 1.0
    });
    
    const arenaFloor = new THREE.Mesh(arenaFloorGeo, arenaFloorMat);
    arenaFloor.rotation.x = -Math.PI / 2;
    arenaFloor.receiveShadow = true;
    this.scene.add(arenaFloor);
    
    // Adicionar marcações na arena
    const markerGeometry = new THREE.RingGeometry(arenaFloorRadius - 1, arenaFloorRadius, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0x8B4513, // SaddleBrown
      side: THREE.DoubleSide
    });
    
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.rotation.x = -Math.PI / 2;
    marker.position.y = 0.01; // Ligeiramente acima do chão
    this.scene.add(marker);
    
    // Criar uma entrada na arena
    this.createArenaEntrance(radius, wallHeight, wallThickness, wallMaterial);
  }
  
  /**
   * Cria arquibancadas ao redor da arena
   */
  createStands(radius, wallHeight, wallMaterial) {
    const rowCount = 5; // Número de fileiras
    const rowHeight = 1.5; // Altura de cada fileira
    const rowDepth = 2; // Profundidade de cada fileira
    
    for (let i = 0; i < rowCount; i++) {
      const standRadius = radius - (i * rowDepth);
      const standHeight = i * rowHeight;
      
      const standGeometry = new THREE.CylinderGeometry(
        standRadius,
        standRadius - rowDepth,
        rowHeight,
        32,
        1,
        true // Aberto no centro
      );
      
      const stand = new THREE.Mesh(standGeometry, wallMaterial);
      stand.position.y = standHeight + (rowHeight / 2);
      stand.receiveShadow = true;
      this.scene.add(stand);
    }
  }
  
  /**
   * Cria uma entrada para a arena
   */
  createArenaEntrance(radius, wallHeight, wallThickness, wallMaterial) {
    // Criar uma abertura na parede
    const entranceWidth = 10;
    const entranceHeight = 8;
    
    // Criar um corredor para a entrada
    const corridorLength = 15;
    const corridorGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, corridorLength);
    const corridorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // SaddleBrown
      roughness: 0.9
    });
    
    const corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor.position.set(0, entranceHeight / 2, radius + (corridorLength / 2));
    corridor.castShadow = true;
    corridor.receiveShadow = true;
    this.scene.add(corridor);
    
    // Adicionar teto ao corredor
    const roofGeometry = new THREE.BoxGeometry(entranceWidth + 2, 1, corridorLength);
    const roof = new THREE.Mesh(roofGeometry, wallMaterial);
    roof.position.set(0, entranceHeight + 0.5, radius + (corridorLength / 2));
    roof.castShadow = true;
    this.scene.add(roof);
  }
  
  /**
   * Adiciona luzes especiais para a arena
   */
  addArenaLights() {
    // Adicionar focos de luz nas bordas da arena
    const spotLightCount = 8;
    const radius = 38;
    
    for (let i = 0; i < spotLightCount; i++) {
      const angle = (Math.PI * 2 / spotLightCount) * i;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      
      // Criar suporte para o holofote
      const poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
      const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(x, 7.5, z);
      pole.castShadow = true;
      this.scene.add(pole);
      
      // Criar holofote
      const spotLight = new THREE.SpotLight(0xffffbb, 1.5);
      spotLight.position.set(x, 15, z);
      spotLight.target.position.set(0, 0, 0); // Apontar para o centro
      spotLight.angle = Math.PI / 8;
      spotLight.penumbra = 0.2;
      spotLight.decay = 1;
      spotLight.distance = 80;
      spotLight.castShadow = true;
      
      this.scene.add(spotLight);
      this.scene.add(spotLight.target);
    }
  }
  
  /**
   * Cria elementos decorativos
   */
  createDecorations() {
    // Adicionar bandeiras ou estandartes
    const bannerCount = 16;
    const radius = 42;
    
    for (let i = 0; i < bannerCount; i++) {
      const angle = (Math.PI * 2 / bannerCount) * i;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      
      // Criar mastro
      const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 10, 8);
      const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(x, 5, z);
      pole.castShadow = true;
      this.scene.add(pole);
      
      // Criar bandeira
      const bannerGeometry = new THREE.PlaneGeometry(3, 2);
      
      // Cores alternadas para as bandeiras
      const colors = [0xff0000, 0x0000ff, 0xffff00, 0x00ff00];
      const bannerMaterial = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        side: THREE.DoubleSide
      });
      
      const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
      banner.position.set(x + 1.5, 8, z);
      banner.rotation.y = angle + Math.PI / 2;
      banner.castShadow = true;
      
      this.scene.add(banner);
    }
  }
  
  /**
   * Cria portais
   */
  createPortals() {
    // Portal de volta para o hub no final do corredor
    this.createPortal({
      position: { x: 0, y: 1.5, z: 55 },
      color: 0x00ff00, // Verde (fácil de identificar)
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
    console.log('Arena ativada');
    
    // Efeitos específicos da arena
    // Como sons de multidão, etc.
  }
}

export default ArenaScene; 