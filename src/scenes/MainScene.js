import * as THREE from 'three';
import BaseScene from './BaseScene';
import { TEXTURE_PATHS } from '../config/gameConfig';

/**
 * Cena principal (hub central) do jogo
 */
class MainScene extends BaseScene {
  /**
   * Cria uma nova cena principal
   * @param {Function} onLoadCallback - Callback chamado quando a cena terminar de carregar
   */
  constructor(onLoadCallback) {
    // Configuração específica para o hub central
    const options = {
      skyColor: 0x87ceeb, // Azul celeste
      worldSize: 100 // Área maior para o hub
    };
    
    super(onLoadCallback, options);
    
    // Configurar elementos da cena
    this.setupScene();
  }
  
  /**
   * Configura os elementos da cena principal
   */
  setupScene() {
    // Configurar o chão
    this.setupGround(TEXTURE_PATHS.ground, { textureRepeat: 16 });
    
    // Criar estrutura central (um edifício ou monumento)
    this.createCentralStructure();
    
    // Criar portais para outras cenas
    this.createPortals();
    
    // Criar elementos decorativos
    this.createDecorations();
  }
  
  /**
   * Cria a estrutura central do hub
   */
  createCentralStructure() {
    // Criar um edifício/torre central
    const buildingGeometry = new THREE.CylinderGeometry(5, 8, 20, 16);
    const buildingMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf5f5dc // Bege
    });
    
    const centralBuilding = new THREE.Mesh(buildingGeometry, buildingMaterial);
    centralBuilding.position.set(0, 10, 0);
    centralBuilding.castShadow = true;
    centralBuilding.receiveShadow = true;
    
    this.scene.add(centralBuilding);
    this.objects.set('centralBuilding', centralBuilding);
    
    // Adicionar telhado
    const roofGeometry = new THREE.ConeGeometry(6, 8, 16);
    const roofMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513 // Marrom
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 24, 0);
    roof.castShadow = true;
    
    this.scene.add(roof);
    this.objects.set('roof', roof);
  }
  
  /**
   * Cria os portais para outras cenas
   */
  createPortals() {
    // Portal para a dungeon de fogo
    this.createPortal({
      position: { x: 25, y: 1.5, z: 25 },
      color: 0xff4500, // Laranja avermelhado
      destination: 'dungeon-fire',
      size: 2.5,
      height: 5,
      name: 'Portal para Dungeon de Fogo'
    });
    
    // Portal para a dungeon de gelo
    this.createPortal({
      position: { x: -25, y: 1.5, z: 25 },
      color: 0x87cefa, // Azul claro
      destination: 'dungeon-ice',
      size: 2.5,
      height: 5,
      name: 'Portal para Dungeon de Gelo'
    });
    
    // Portal para a arena
    this.createPortal({
      position: { x: 0, y: 1.5, z: -30 },
      color: 0xffd700, // Dourado
      destination: 'arena',
      size: 3,
      height: 6,
      name: 'Portal para Arena'
    });
  }
  
  /**
   * Cria elementos decorativos
   */
  createDecorations() {
    // Criar alguns "marcos" ou placas perto dos portais
    const createSign = (position, text) => {
      const signGroup = new THREE.Group();
      
      // Placa
      const signGeometry = new THREE.BoxGeometry(4, 2, 0.2);
      const signMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      const sign = new THREE.Mesh(signGeometry, signMaterial);
      sign.position.y = 3;
      
      // Suporte
      const poleGeometry = new THREE.BoxGeometry(0.5, 4, 0.5);
      const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.y = 1;
      
      signGroup.add(sign);
      signGroup.add(pole);
      signGroup.position.set(position.x, position.y, position.z);
      
      this.scene.add(signGroup);
      return signGroup;
    };
    
    // Criar placas próximas aos portais
    createSign({ x: 25, y: 0, z: 20 }, 'Dungeon de Fogo');
    createSign({ x: -25, y: 0, z: 20 }, 'Dungeon de Gelo');
    createSign({ x: 0, y: 0, z: -25 }, 'Arena');
    
    // Adicionar algumas árvores ou outros elementos decorativos
    const treeCount = 20;
    for (let i = 0; i < treeCount; i++) {
      // Posição aleatória (evitando o centro e os portais)
      let x, z;
      do {
        x = (Math.random() - 0.5) * this.worldSize * 0.8;
        z = (Math.random() - 0.5) * this.worldSize * 0.8;
      } while (
        (Math.abs(x) < 15 && Math.abs(z) < 15) || // Evitar centro
        (Math.abs(x - 25) < 8 && Math.abs(z - 25) < 8) || // Evitar portal fogo
        (Math.abs(x + 25) < 8 && Math.abs(z - 25) < 8) || // Evitar portal gelo
        (Math.abs(x) < 8 && Math.abs(z + 30) < 8) // Evitar portal arena
      );
      
      // Criar árvore simples
      const treeGroup = new THREE.Group();
      
      // Tronco
      const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 2.5;
      trunk.castShadow = true;
      
      // Copa
      const leavesGeometry = new THREE.ConeGeometry(3, 7, 8);
      const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.position.y = 7;
      leaves.castShadow = true;
      
      treeGroup.add(trunk);
      treeGroup.add(leaves);
      treeGroup.position.set(x, 0, z);
      
      this.scene.add(treeGroup);
    }
  }
  
  /**
   * Ações quando a cena é ativada
   */
  onActivate() {
    super.onActivate();
    console.log('Hub central ativado');
    
    // Animação dos portais (pode ser aprimorada)
    this.portals.forEach(portal => {
      portal.mesh.rotation.y = 0; // Resetar rotação
    });
  }
}

export default MainScene; 