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
    
    // Posição armazenada como vetor Three.js
    this.position = new THREE.Vector3(playerData.position.x, 0, playerData.position.y);
    
    // Armazenar posição autorizada pelo servidor separadamente
    this.serverPosition = {
      x: playerData.position.x || 0,
      y: playerData.position.y || 0
    };
    
    // Marca de tempo da última atualização do servidor
    this.lastServerUpdate = Date.now();
    
    // Status de previsão local
    this.hasPrediction = false;
    
    // Cena em que o jogador está
    this.sceneName = playerData.sceneName || 'main';
    
    // Atributos controlados pelo servidor
    this.speed = playerData.speed || PLAYER_CONFIG.moveSpeed;
    this.health = playerData.health || 100;
    this.maxHealth = playerData.maxHealth || 100;
    this.level = playerData.level || 1;
    this.experience = playerData.experience || 0;
    this.stats = playerData.stats || {
      strength: 10,
      agility: 10,
      intelligence: 10
    };
    
    // Criar a representação visual do jogador
    this.mesh = this.createPlayerMesh();
    this.updatePosition(playerData.position);
    
    console.log(`Jogador criado: ${this.name}, velocidade: ${this.speed}`);
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
   * @param {boolean} isPrediction - Se é apenas uma previsão local (não autorizada pelo servidor)
   */
  updatePosition(position, isPrediction = false) {
    if (!position) {
      console.error('Tentativa de atualizar posição com valor nulo');
      return;
    }
    
    // Se for uma posição autorizada do servidor
    if (!isPrediction) {
      this.serverPosition = {
        x: position.x || 0,
        y: position.y || 0
      };
      
      this.lastServerUpdate = Date.now();
      this.hasPrediction = false;
      
      console.log(`Posição autorizada do servidor para jogador ${this.id}: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`);
    } else {
      // Se for previsão local, marcar como tendo previsão
      this.hasPrediction = true;
      console.log(`Previsão local para jogador ${this.id}: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`);
    }
    
    // Sempre atualizar a posição visual
    this.position.x = position.x || 0;
    this.position.z = position.y || 0;
    
    // Atualizar a posição do mesh
    if (this.mesh) {
      this.mesh.position.set(position.x || 0, 0, position.y || 0);
    } else {
      console.warn('Mesh não encontrado ao atualizar posição');
    }
  }
  
  /**
   * Sincroniza posição preditiva com posição autorizada pelo servidor
   * @param {number} deltaTime - Tempo decorrido desde o último frame
   */
  syncWithServerPosition(deltaTime) {
    if (!this.hasPrediction) return;
    
    // Verificar se a previsão está muito desalinhada com a posição do servidor
    const dx = this.position.x - this.serverPosition.x;
    const dz = this.position.z - this.serverPosition.y;
    
    // Se a distância for pequena ou não houver atualização recente do servidor, não fazer nada
    const distSquared = dx * dx + dz * dz;
    if (distSquared < 0.01 || Date.now() - this.lastServerUpdate > PLAYER_CONFIG.prediction.maxDelay) {
      return;
    }
    
    // Usar interpolação linear (LERP) para sincronizar suavemente
    const lerpFactor = PLAYER_CONFIG.prediction.lerp * (deltaTime / 16.67); // Normalizar para ~60 FPS
    
    // Calcular nova posição interpolada
    const newX = this.position.x - dx * lerpFactor;
    const newZ = this.position.z - dz * lerpFactor;
    
    // Atualizar posição mantendo a previsão (apenas visual, não envia ao servidor)
    this.position.x = newX;
    this.position.z = newZ;
    
    // Atualizar mesh
    if (this.mesh) {
      this.mesh.position.set(newX, 0, newZ);
    }
  }
  
  /**
   * Atualiza a cena do jogador
   * @param {string} sceneName - Nome da cena
   */
  changeScene(sceneName) {
    this.sceneName = sceneName;
  }
  
  /**
   * Recria o modelo visual do jogador (útil após mudança de cena)
   */
  recreatePlayerMesh() {
    // Se já existe um mesh, limpar as labels antes de substituir
    if (this.mesh) {
      this.mesh.traverse(object => {
        if (object instanceof CSS2DObject && object.div && object.div.parentNode) {
          object.div.parentNode.removeChild(object.div);
        }
      });
    }
    
    // Criar um novo mesh
    this.mesh = this.createPlayerMesh();
    
    // Certificar-se de que a posição está correta
    this.updatePosition({
      x: this.position.x,
      y: this.position.z
    });
    
    return this.mesh;
  }
  
  /**
   * Verifica se o jogador está na cena especificada
   * @param {string} sceneName - Nome da cena para verificar
   * @returns {boolean} - Se o jogador está na cena
   */
  isInScene(sceneName) {
    return this.sceneName === sceneName;
  }
  
  /**
   * Atualiza as rótulos 2D na cena
   */
  updateLabels() {
    this.mesh.traverse(object => {
      if (object instanceof CSS2DObject) {
        object.updateMatrixWorld();
      }
    });
  }
  
  /**
   * Serializa o jogador para envio ao servidor
   * @returns {Object} - Dados serializados do jogador
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      position: {
        x: this.position.x,
        y: this.position.z
      },
      color: this.color,
      sceneName: this.sceneName
    };
  }
  
  /**
   * Remove o jogador da cena
   * @param {THREE.Scene} scene - Cena Three.js
   */
  remove(scene) {
    if (scene) {
      scene.remove(this.mesh);
    }
    
    // Limpar os elementos DOM criados
    this.mesh.traverse(object => {
      if (object instanceof CSS2DObject && object.div && object.div.parentNode) {
        object.div.parentNode.removeChild(object.div);
      }
    });
  }
  
  /**
   * Atualiza os atributos do jogador com dados do servidor
   * @param {Object} data - Dados do servidor
   */
  updateFromServer(data) {
    // Atualizar atributos que só o servidor deve controlar
    if (data.position) {
      this.updatePosition(data.position);
    }
    
    if (data.speed !== undefined) {
      this.speed = data.speed;
      console.log(`Velocidade do jogador ${this.id} atualizada para: ${this.speed}`);
    }
    
    if (data.health !== undefined) {
      this.health = data.health;
      this.maxHealth = data.maxHealth || this.maxHealth;
    }
    
    if (data.level !== undefined) {
      this.level = data.level;
    }
    
    if (data.experience !== undefined) {
      this.experience = data.experience;
    }
    
    if (data.stats) {
      this.stats = { ...this.stats, ...data.stats };
    }
    
    // Atualizar outros atributos controlados pelo servidor
    if (data.sceneName) {
      this.changeScene(data.sceneName);
    }
    
    console.log(`Atualização do servidor para jogador ${this.id}:`, data);
  }
  
  /**
   * Atualiza lógica do jogador a cada frame
   * @param {number} deltaTime - Tempo decorrido desde o último frame em ms
   */
  update(deltaTime) {
    // Sincronizar posição com o servidor se houver diferença
    if (PLAYER_CONFIG.prediction.enabled) {
      this.syncWithServerPosition(deltaTime);
    }
  }
}

export default Player; 