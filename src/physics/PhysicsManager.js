import * as RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

/**
 * Classe responsável pelo gerenciamento da física do jogo
 */
export default class PhysicsManager {
  /**
   * Inicializa o gerenciador de física
   */
  constructor() {
    this.initialized = false;
    this.world = null;
    this.playerBodies = new Map(); // Mapa de ID do jogador para rigidbody
    this.mapColliders = new Map(); // Mapa de colisores do ambiente
    this.gravity = { x: 0, y: -9.8, z: 0 };
    this.characterRadius = 0.5;
    this.characterHeight = 2.0;
    this.initialize();
  }
  
  /**
   * Inicializa o motor de física
   */
  async initialize() {
    try {
      await RAPIER.init();
      this.world = new RAPIER.World(this.gravity);
      console.log('Sistema de física Rapier inicializado com sucesso');
      this.initialized = true;
    } catch (error) {
      console.error('Erro ao inicializar o sistema de física:', error);
    }
  }

  /**
   * Cria um trimesh a partir da geometria do Three.js
   * @param {THREE.BufferGeometry} geometry - Geometria Three.js
   * @param {THREE.Matrix4} worldMatrix - Matriz de transformação do objeto
   * @returns {RAPIER.TriMesh} - TriMesh para colisão
   */
  createTrimeshFromGeometry(geometry, worldMatrix) {
    // Verificar se a geometria tem os atributos necessários
    const positionAttribute = geometry.getAttribute('position');
    if (!positionAttribute || positionAttribute.count === 0) {
      throw new Error('Geometria não possui atributos de posição válidos');
    }
    
    // Garantir que a geometria tenha índices
    if (!geometry.index) {
      geometry = geometry.toNonIndexed();
      console.log('Convertendo geometria para não-indexada');
    }
    
    // Obter posições dos vértices
    const vertices = new Float32Array(positionAttribute.count * 3);
    
    // Aplicar transformação do objeto
    const tempVector = new THREE.Vector3();
    for (let i = 0; i < positionAttribute.count; i++) {
      tempVector.fromBufferAttribute(positionAttribute, i);
      
      if (worldMatrix) {
        tempVector.applyMatrix4(worldMatrix);
      }
      
      vertices[i * 3] = tempVector.x;
      vertices[i * 3 + 1] = tempVector.y;
      vertices[i * 3 + 2] = tempVector.z;
    }
    
    // Obter ou criar índices
    let indices;
    if (geometry.index) {
      // Usar índices existentes
      if (geometry.index.count % 3 !== 0) {
        throw new Error('Índices da geometria não formam triângulos válidos');
      }
      
      if (geometry.index.itemSize === 1) {
        // Converter para Uint32Array se necessário
        if (geometry.index.array instanceof Uint16Array) {
          // Promover de Uint16Array para Uint32Array
          indices = new Uint32Array(geometry.index.count);
          for (let i = 0; i < geometry.index.count; i++) {
            indices[i] = geometry.index.array[i];
          }
        } else {
          indices = new Uint32Array(geometry.index.array);
        }
      } else {
        throw new Error('Formato de índice não suportado');
      }
    } else {
      // Criar índices para geometria não indexada (triângulos simples)
      if (positionAttribute.count % 3 !== 0) {
        throw new Error('Geometria não indexada com contagem de vértices inválida para triangulação');
      }
      
      indices = new Uint32Array(positionAttribute.count);
      for (let i = 0; i < positionAttribute.count; i++) {
        indices[i] = i;
      }
    }
    
    // Verificar limites dos índices
    for (let i = 0; i < indices.length; i++) {
      if (indices[i] >= positionAttribute.count) {
        throw new Error(`Índice ${indices[i]} está fora dos limites da geometria`);
      }
    }
    
    // Criar trimesh
    try {
      return new RAPIER.TriMesh(vertices, indices);
    } catch (error) {
      console.error('Erro ao criar TriMesh:', error);
      throw new Error(`Falha ao criar TriMesh: ${error.message}`);
    }
  }
  
  /**
   * Adiciona colisão ao mapa baseada na geometria
   * @param {THREE.Mesh} mesh - Mesh do mapa
   * @param {string} id - Identificador único para o colisor
   * @param {string} colliderType - Tipo de colisor (opcional): 'trimesh', 'cuboid', 'ball', 'auto'
   */
  addMapCollider(mesh, id, colliderType = 'auto') {
    if (!this.initialized) {
      console.warn('Sistema de física não inicializado');
      return;
    }
    
    if (!mesh) {
      console.warn(`Mesh inválida para colisor ${id}`);
      return;
    }
    
    try {
      // Verificar se o mesh tem uma geometria válida
      if (!mesh.geometry) {
        console.warn(`Mesh ${id} não possui geometria. Tentando usar boundingBox.`);
        
        // Usar uma caixa delimitadora como alternativa
        colliderType = 'cuboid';
      }
      
      let collider;
      
      // Criar colisor baseado no tipo solicitado
      if (colliderType === 'trimesh' && mesh.geometry) {
        // Tentar criar um trimesh
        try {
          // Clonar a geometria para evitar modificações ao original
          const geometry = mesh.geometry.clone();
          
          // Verificar se a geometria tem atributos válidos
          if (!geometry.getAttribute('position') || geometry.getAttribute('position').count === 0) {
            throw new Error('Geometria sem posições válidas');
          }
          
          // Criar trimesh para colisão
          const trimesh = this.createTrimeshFromGeometry(geometry, mesh.matrixWorld);
          
          // Criar descrição do colisor
          const colliderDesc = RAPIER.ColliderDesc.trimesh(trimesh)
            .setTranslation(0, 0, 0)
            .setFriction(0.7);
          
          // Criar colisor no mundo
          collider = this.world.createCollider(colliderDesc);
          
          console.log(`Colisor trimesh adicionado para ${id}`);
        } catch (trimeshError) {
          console.warn(`Falha ao criar trimesh para ${id}, usando alternativa: ${trimeshError.message}`);
          colliderType = 'cuboid'; // Falhar para cuboid como fallback
        }
      }
      
      // Se não conseguiu criar trimesh ou foi solicitado outro tipo
      if (!collider) {
        // Calcular a caixa delimitadora se não existir
        if (!mesh.geometry || !mesh.geometry.boundingBox) {
          if (mesh.geometry) {
            mesh.geometry.computeBoundingBox();
          } else {
            // Criar uma caixa padrão para meshes sem geometria
            console.log(`Criando colisor padrão para ${id}`);
            
            const size = { x: 2, y: 2, z: 2 };
            const halfExtents = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
            
            const position = mesh.position || { x: 0, y: 0, z: 0 };
            
            const colliderDesc = RAPIER.ColliderDesc.cuboid(
              halfExtents.x, 
              halfExtents.y, 
              halfExtents.z
            )
            .setTranslation(position.x, position.y, position.z)
            .setFriction(0.7);
            
            collider = this.world.createCollider(colliderDesc);
            console.log(`Colisor cuboid padrão adicionado para ${id}`);
          }
        }
        
        if (mesh.geometry && mesh.geometry.boundingBox) {
          // Obter tamanho da caixa delimitadora
          const boundingBox = mesh.geometry.boundingBox;
          const size = {
            x: Math.abs(boundingBox.max.x - boundingBox.min.x),
            y: Math.abs(boundingBox.max.y - boundingBox.min.y),
            z: Math.abs(boundingBox.max.z - boundingBox.min.z)
          };
          
          // Obter centro da caixa delimitadora
          const center = new THREE.Vector3();
          boundingBox.getCenter(center);
          
          // Aplicar transformação do mundo
          const worldPosition = new THREE.Vector3();
          mesh.getWorldPosition(worldPosition);
          
          // Ajustar centro com posição mundial
          const position = {
            x: worldPosition.x + center.x,
            y: worldPosition.y + center.y,
            z: worldPosition.z + center.z
          };
          
          // Criar descrição do colisor baseado no tipo
          let colliderDesc;
          
          if (colliderType === 'ball' || 
              (colliderType === 'auto' && size.x < 5 && size.y < 5 && size.z < 5)) {
            // Usar uma esfera para objetos pequenos
            const radius = Math.max(size.x, size.y, size.z) / 2;
            colliderDesc = RAPIER.ColliderDesc.ball(radius)
              .setTranslation(position.x, position.y, position.z)
              .setFriction(0.7);
            console.log(`Colisor ball adicionado para ${id} com raio ${radius}`);
          } else {
            // Usar um cuboide (caixa)
            const halfExtents = {
              x: size.x / 2,
              y: size.y / 2,
              z: size.z / 2
            };
            
            colliderDesc = RAPIER.ColliderDesc.cuboid(
              halfExtents.x, 
              halfExtents.y, 
              halfExtents.z
            )
            .setTranslation(position.x, position.y, position.z)
            .setFriction(0.7);
            console.log(`Colisor cuboid adicionado para ${id} com tamanho ${size.x.toFixed(2)}x${size.y.toFixed(2)}x${size.z.toFixed(2)}`);
          }
          
          // Criar colisor
          collider = this.world.createCollider(colliderDesc);
        }
      }
      
      // Armazenar para referência futura se conseguiu criar
      if (collider) {
        this.mapColliders.set(id, collider);
        return true;
      } else {
        console.error(`Não foi possível criar colisor para ${id}`);
        return false;
      }
    } catch (error) {
      console.error(`Erro ao adicionar colisor ao mapa ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Cria ou atualiza o corpo físico de um jogador
   * @param {Object} player - Objeto do jogador
   * @returns {RAPIER.RigidBody} - Corpo físico do jogador
   */
  updatePlayerBody(player) {
    if (!this.initialized || !player) {
      console.warn('Sistema de física não inicializado ou jogador inválido');
      return null;
    }
    
    try {
      // Verificar se o jogador já possui um corpo físico
      let rigidBody = this.playerBodies.get(player.id);
      
      if (!rigidBody) {
        console.log(`Criando novo corpo físico para jogador ${player.id} na posição:`, player.position);
        
        // Definir a altura correta do jogador no mundo físico (y = 1.0 para base da capsula)
        const physicsY = (player.position.y || 0) + this.characterHeight / 2;
        
        // Criar descrição do corpo rígido - IMPORTANTE: deve ser DYNAMIC
        const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(
            player.position.x,
            physicsY, // Colocar o corpo físico na altura correta
            player.position.z
          )
          // Definir parâmetros para movimento adequado
          .setLinearDamping(0.5)   // Amortecimento para parar gradualmente
          .setAngularDamping(0.9); // Evitar rotações excessivas
        
        // Criar o corpo rígido
        rigidBody = this.world.createRigidBody(bodyDesc);
        
        // Criar colisor em forma de cápsula
        const colliderDesc = RAPIER.ColliderDesc.capsule(
          this.characterHeight / 2 - this.characterRadius, 
          this.characterRadius
        )
        .setFriction(0.2)       // Atrito com outras superfícies
        .setRestitution(0.0)    // Sem "quicar"
        .setDensity(1.0);       // Densidade para massa realista
        
        // Adicionar colisor ao corpo
        this.world.createCollider(colliderDesc, rigidBody);
        
        // Ativar CCD (Continuous Collision Detection) para evitar atravessar objetos em alta velocidade
        rigidBody.enableCcd(true);
        
        // Armazenar para referência futura
        this.playerBodies.set(player.id, rigidBody);
        
        console.log(`Corpo físico criado para jogador: ${player.id} na altura ${physicsY}`);
      } else {
        // Definir a altura correta do jogador no mundo físico
        const physicsY = (player.position.y || 0) + this.characterHeight / 2;
        
        // Atualizar posição do corpo físico existente
        const translation = {
          x: player.position.x,
          y: physicsY, // Garantir que a altura seja correta
          z: player.position.z
        };
        
        rigidBody.setTranslation(translation, true);
        
        // Certificar-se que o tipo de corpo está correto (DYNAMIC)
        if (rigidBody.bodyType() !== RAPIER.RigidBodyType.Dynamic) {
          rigidBody.setBodyType(RAPIER.RigidBodyType.Dynamic);
        }
      }
      
      return rigidBody;
    } catch (error) {
      console.error(`Erro ao atualizar corpo físico do jogador ${player.id}:`, error);
      return null;
    }
  }
  
  /**
   * Remove o corpo físico de um jogador
   * @param {string} playerId - ID do jogador
   */
  removePlayerBody(playerId) {
    const rigidBody = this.playerBodies.get(playerId);
    if (rigidBody) {
      this.world.removeRigidBody(rigidBody);
      this.playerBodies.delete(playerId);
      console.log(`Corpo físico removido para jogador: ${playerId}`);
    }
  }
  
  /**
   * Atualiza o sistema de física
   * @param {number} deltaTime - Tempo decorrido desde o último frame
   */
  update(deltaTime) {
    if (!this.initialized) return;
    
    // Normalizar o deltaTime para evitar problemas com baixo FPS
    const dt = Math.min(deltaTime, 1/30); // Limitar para evitar cálculos excessivos em baixo FPS
    
    // Definir parâmetros da simulação
    const numSubsteps = 1;  // Quanto maior, mais preciso (e mais lento)
    
    // Avançar a simulação física
    this.world.step();
    
    // Verificar corpos dos jogadores
    this.playerBodies.forEach((rigidBody, playerId) => {
      // Atualizar velocidade dos corpos para assegurar continuidade do movimento
      const vel = rigidBody.linvel();
      
      // Aplicar pequeno passo de gravidade manualmente se necessário
      if (Math.abs(vel.y) < 0.1) {
        // Ajudar jogadores a manterem contato com o chão
        const pos = rigidBody.translation();
        
        // Verificar se está muito acima do chão
        if (pos.y > 2.0) {
          rigidBody.setLinvel({x: vel.x, y: -1.0, z: vel.z}, true);
        }
      }
      
      // Garantir que não haja rotação indesejada
      rigidBody.setAngvel({x: 0, y: 0, z: 0}, true);
    });
  }
  
  /**
   * Aplica movimento a um jogador com física
   * @param {Object} player - Objeto do jogador
   * @param {Object} direction - Direção do movimento { x, z }
   * @param {number} speed - Velocidade do movimento
   * @returns {Object} - Nova posição calculada
   */
  movePlayer(player, direction, speed) {
    if (!this.initialized || !player) {
      return null;
    }
    
    const rigidBody = this.playerBodies.get(player.id);
    if (!rigidBody) {
      return null;
    }
    
    // Certificar-se de que o corpo não está travado
    rigidBody.setBodyType(RAPIER.RigidBodyType.Dynamic);
    
    // Aplicar velocidade diretamente (em vez de força)
    // Multiplicar a direção pela velocidade
    const moveSpeed = Math.max(5, speed);
    
    // Obter velocidade atual para preservar movimento vertical (gravidade)
    const vel = rigidBody.linvel();
    
    // Aplicar apenas movimento horizontal, mantendo velocidade vertical para gravidade
    rigidBody.setLinvel(
      { 
        x: direction.x * moveSpeed, 
        y: vel.y,      // Preservar velocidade vertical para gravidade
        z: direction.z * moveSpeed 
      }, 
      true
    );
    
    // Travar rotação do corpo para evitar que o jogador "caia"
    const lockRotation = true;
    if (lockRotation) {
      rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
    
    // Obter a nova posição após o movimento
    const position = rigidBody.translation();
    
    // Log para depuração (remover em produção)
    console.log(`Movimento física: dir=${direction.x.toFixed(2)},${direction.z.toFixed(2)} vel=${moveSpeed} pos=${position.x.toFixed(2)},${position.z.toFixed(2)}`);
    
    // Retornar apenas as coordenadas necessárias para o sistema 2D
    return {
      x: position.x,
      y: position.z
    };
  }
  
  /**
   * Limpa todos os recursos de física
   */
  dispose() {
    if (this.world) {
      // Limpar recursos do mundo físico
      this.playerBodies.clear();
      this.mapColliders.clear();
      this.world = null;
      console.log('Sistema de física desativado');
    }
  }

  /**
   * Cria elementos de visualização para colisores (útil para depuração)
   * @param {THREE.Scene} scene - Cena Three.js onde os elementos serão adicionados
   */
  createDebugVisualization(scene) {
    if (!this.initialized || !scene) return;
    
    // Material para visualização de colisores
    const debugMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      wireframe: true,
      opacity: 0.5,
      transparent: true
    });
    
    // Visualizar colisores do mapa
    this.mapColliders.forEach((collider, id) => {
      // Obter o tipo do colisor
      const shape = collider.shape;
      let debugMesh;
      
      // Criar malha de acordo com o tipo
      if (shape.type === RAPIER.ShapeType.Cuboid) {
        const halfExtents = shape.halfExtents;
        const geometry = new THREE.BoxGeometry(
          halfExtents.x * 2,
          halfExtents.y * 2,
          halfExtents.z * 2
        );
        debugMesh = new THREE.Mesh(geometry, debugMaterial);
      } else if (shape.type === RAPIER.ShapeType.Ball) {
        const geometry = new THREE.SphereGeometry(shape.radius, 16, 16);
        debugMesh = new THREE.Mesh(geometry, debugMaterial);
      } else if (shape.type === RAPIER.ShapeType.Capsule) {
        // Criar uma cápsula usando um cilindro e duas esferas
        const radius = shape.radius;
        const halfHeight = shape.halfHeight;
        
        const capsule = new THREE.Group();
        
        // Cilindro central
        const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, halfHeight * 2, 16);
        const cylinder = new THREE.Mesh(cylinderGeometry, debugMaterial);
        capsule.add(cylinder);
        
        // Esferas nas pontas
        const sphereGeometry = new THREE.SphereGeometry(radius, 16, 16);
        
        const topSphere = new THREE.Mesh(sphereGeometry, debugMaterial);
        topSphere.position.y = halfHeight;
        capsule.add(topSphere);
        
        const bottomSphere = new THREE.Mesh(sphereGeometry, debugMaterial);
        bottomSphere.position.y = -halfHeight;
        capsule.add(bottomSphere);
        
        debugMesh = capsule;
      } else if (shape.type === RAPIER.ShapeType.TriMesh) {
        // Para trimeshes, apenas exibir uma representação de bbox simples
        const aabb = new RAPIER.AABB();
        shape.computeAabb({ rotation: { w: 1, x: 0, y: 0, z: 0 }, translation: { x: 0, y: 0, z: 0 } }, aabb);
        
        const size = {
          x: aabb.maxX - aabb.minX,
          y: aabb.maxY - aabb.minY,
          z: aabb.maxZ - aabb.minZ
        };
        
        const center = {
          x: (aabb.maxX + aabb.minX) / 2,
          y: (aabb.maxY + aabb.minY) / 2,
          z: (aabb.maxZ + aabb.minZ) / 2
        };
        
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        debugMesh = new THREE.Mesh(geometry, debugMaterial);
        debugMesh.position.set(center.x, center.y, center.z);
      }
      
      // Adicionar à cena se criado
      if (debugMesh) {
        // Obter a posição do colisor
        const position = collider.translation();
        debugMesh.position.set(position.x, position.y, position.z);
        
        // Adicionar à cena
        scene.add(debugMesh);
        
        // Guardar referência para remoção posterior
        debugMesh.userData.debugCollider = id;
      }
    });
    
    // Visualizar colisores dos jogadores
    this.playerBodies.forEach((rigidBody, id) => {
      // Obter o colisor do jogador
      const collider = rigidBody.collider(0);
      if (!collider) return;
      
      const shape = collider.shape;
      
      // Criar uma cápsula para visualização
      if (shape.type === RAPIER.ShapeType.Capsule) {
        const radius = shape.radius;
        const halfHeight = shape.halfHeight;
        
        const capsule = new THREE.Group();
        
        // Cilindro central
        const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, halfHeight * 2, 16);
        const cylinder = new THREE.Mesh(cylinderGeometry, new THREE.MeshBasicMaterial({
          color: 0x3333ff,
          wireframe: true,
          opacity: 0.5,
          transparent: true
        }));
        capsule.add(cylinder);
        
        // Esferas nas pontas
        const sphereGeometry = new THREE.SphereGeometry(radius, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({
          color: 0x3333ff,
          wireframe: true,
          opacity: 0.5,
          transparent: true
        });
        
        const topSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        topSphere.position.y = halfHeight;
        capsule.add(topSphere);
        
        const bottomSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        bottomSphere.position.y = -halfHeight;
        capsule.add(bottomSphere);
        
        // Obter a posição do corpo
        const position = rigidBody.translation();
        capsule.position.set(position.x, position.y, position.z);
        
        // Adicionar à cena
        scene.add(capsule);
        
        // Guardar referência para remoção posterior
        capsule.userData.debugPlayer = id;
      }
    });
  }
  
  /**
   * Remove todos os elementos de visualização de colisores da cena
   * @param {THREE.Scene} scene - Cena Three.js de onde os elementos serão removidos
   */
  removeDebugVisualization(scene) {
    if (!scene) return;
    
    // Encontrar e remover todos os objetos de depuração
    const objectsToRemove = [];
    
    scene.traverse(object => {
      if (object.userData.debugCollider || object.userData.debugPlayer) {
        objectsToRemove.push(object);
      }
    });
    
    // Remover objetos encontrados
    objectsToRemove.forEach(object => {
      scene.remove(object);
    });
  }
} 