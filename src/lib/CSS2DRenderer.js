import * as THREE from 'three';

/**
 * Implementação simplificada de um objeto que combina Three.js com elementos DOM
 * Inspirado no CSS2DRenderer do Three.js
 */
export class CSS2DObject extends THREE.Object3D {
  /**
   * Cria um objeto CSS2D
   * @param {HTMLElement} element - Elemento DOM a ser renderizado
   */
  constructor(element) {
    super();
    
    this.element = element;
    this.element.style.position = 'absolute';
    this.element.style.pointerEvents = 'none';
    
    const div = document.createElement('div');
    div.appendChild(element);
    
    this.div = div;
  }
  
  /**
   * Atualiza a posição do elemento DOM com base na matriz de mundo
   * @param {boolean} force - Força a atualização
   */
  updateMatrixWorld(force) {
    super.updateMatrixWorld(force);
    
    // Obter a posição do objeto no espaço 3D
    const vector = new THREE.Vector3();
    vector.setFromMatrixPosition(this.matrixWorld);
    
    // Converter para coordenadas de tela
    const camera = this._getCamera();
    if (!camera) return;
    
    vector.project(camera);
    
    // Converter para coordenadas CSS
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.div.style.position = 'absolute';
    this.div.style.left = ((vector.x + 1) * width / 2) + 'px';
    this.div.style.top = ((-vector.y + 1) * height / 2) + 'px';
    
    // Adicionar div ao body se ainda não estiver
    if (!this.div.parentNode) {
      document.body.appendChild(this.div);
    }
  }
  
  /**
   * Obtém a câmera da cena
   * @returns {THREE.Camera|null} - Câmera ou null se não encontrada
   * @private
   */
  _getCamera() {
    // Percorrer a árvore de pais até encontrar a cena
    let object = this;
    while (object.parent) {
      object = object.parent;
      
      if (object.isScene) {
        // Encontrar a câmera na cena
        const cameras = [];
        object.traverse(child => {
          if (child.isCamera) {
            cameras.push(child);
          }
        });
        
        // Usar a primeira câmera encontrada
        if (cameras.length > 0) {
          return cameras[0];
        }
      }
    }
    
    // Tentar obter a câmera global (fallback)
    return window.camera || null;
  }
  
  /**
   * Remove o elemento DOM
   */
  dispose() {
    if (this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
    }
  }
} 