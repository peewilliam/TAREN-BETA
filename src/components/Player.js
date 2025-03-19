import * as THREE from 'three';
import { PLAYER_CONFIG } from '../config/gameConfig';
import { CSS2DObject } from '../lib/CSS2DRenderer';

/**
 * Classe para representar e gerenciar um jogador no jogo
 */
class Player {
  /**
   * Cria um novo jogador
   * @param {Object} playerData - Dados do jogador do servidor
   */
  constructor(playerData) {
    this.id = playerData.id;
    this.name = playerData.name || `Jogador ${playerData.id.substring(0, 4)}`;
    this.color = playerData.color || PLAYER_CONFIG.bodyColor;
    this.position = new THREE.Vector3(playerData.position.x, 0, playerData.position.y);
    
    // Criar a representação visual do jogador
    this.mesh = this.createPlayerMesh();
    this.updatePosition(playerData.position);
  }
  
  /**
   * Cria a representação visual (mesh) do jogador
   * @returns {THREE.Group} - Grupo contendo os meshes do jogador
   */
  createPlayerMesh() {
    // Grupo para conter o jogador
    const playerGroup = new THREE.Group();
    
    // Corpo do jogador
    const bodyGeometry = new THREE.BoxGeometry(
      PLAYER_CONFIG.bodySize.x, 
      PLAYER_CONFIG.bodySize.y, 
      PLAYER_CONFIG.bodySize.z
    );
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: this.color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    playerGroup.add(body);
    
    // Cabeça do jogador
    const headGeometry = new THREE.SphereGeometry(PLAYER_CONFIG.headRadius, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: PLAYER_CONFIG.headColor });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.5;
    head.castShadow = true;
    playerGroup.add(head);
    
    // Nome do jogador
    const nameContainer = document.createElement('div');
    nameContainer.className = 'player-name';
    nameContainer.textContent = this.name;
    nameContainer.style.color = 'white';
    nameContainer.style.background = 'rgba(0, 0, 0, 0.5)';
    nameContainer.style.padding = '2px 5px';
    nameContainer.style.borderRadius = '3px';
    nameContainer.style.textAlign = 'center';
    
    const nameLabel = new CSS2DObject(nameContainer);
    nameLabel.position.set(0, PLAYER_CONFIG.nameHeight, 0);
    playerGroup.add(nameLabel);
    
    return playerGroup;
  }
  
  /**
   * Atualiza a posição do jogador
   * @param {Object} position - Nova posição {x, y}
   */
  updatePosition(position) {
    // Atualizar a posição interna
    this.position.x = position.x;
    this.position.z = position.y;
    
    // Atualizar a posição do mesh
    if (this.mesh) {
      this.mesh.position.set(position.x, 0, position.y);
    }
  }
  
  /**
   * Atualiza os rótulos 2D na cena
   */
  updateLabels() {
    this.mesh.traverse(object => {
      if (object instanceof CSS2DObject) {
        object.updateMatrixWorld();
      }
    });
  }
  
  /**
   * Remove o jogador da cena
   * @param {THREE.Scene} scene - Cena Three.js
   */
  remove(scene) {
    scene.remove(this.mesh);
    
    // Limpar os elementos DOM criados
    this.mesh.traverse(object => {
      if (object instanceof CSS2DObject && object.div && object.div.parentNode) {
        object.div.parentNode.removeChild(object.div);
      }
    });
  }
}

export default Player; 