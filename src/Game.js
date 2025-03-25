import * as THREE from 'three';
import { CAMERA_CONFIG } from './config/gameConfig';
import SceneManager from './scenes/SceneManager';
import PlayerControls from './controls/PlayerControls';
import UserInterface from './components/UserInterface';
import SocketManager from './sockets/SocketManager';
import GameService from './services/GameService';
import PhysicsManager from './physics/PhysicsManager';

/**
 * Classe principal que coordena todos os componentes do jogo
 */
class Game {
  /**
   * Inicializa o jogo
   */
  constructor() {
    this.initializeProperties();
    this.setupThreeJS();
    this.setupUI();
    this.setupSockets();
    this.setupEventListeners();
    this.startGameLoop();
  }
  
  /**
   * Inicializa as propriedades do jogo
   */
  initializeProperties() {
    this.sceneManager = null;
    this.camera = null;
    this.renderer = null;
    this.socketManager = null;
    this.gameService = null;
    this.ui = null;
    this.controls = null;
    this.isRunning = false;
    this.physicsManager = new PhysicsManager();
    this.lastUpdateTime = performance.now();
  }
  
  /**
   * Configura o ThreeJS (renderizador, câmera)
   */
  setupThreeJS() {
    // Configurar câmera
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fov,
      window.innerWidth / window.innerHeight,
      CAMERA_CONFIG.nearPlane,
      CAMERA_CONFIG.farPlane
    );
    this.camera.position.set(
      CAMERA_CONFIG.initialPosition.x,
      CAMERA_CONFIG.initialPosition.y,
      CAMERA_CONFIG.initialPosition.z
    );
    this.camera.lookAt(
      CAMERA_CONFIG.lookAt.x,
      CAMERA_CONFIG.lookAt.y,
      CAMERA_CONFIG.lookAt.z
    );
    
    // Definir câmera global para acessá-la de outros componentes
    window.camera = this.camera;
    
    // Configurar renderizador
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);
  }
  
  /**
   * Configura a interface do usuário
   */
  setupUI() {
    this.ui = new UserInterface();
    this.ui.setCamera(this.camera);
    
    // Configurar callback de redimensionamento
    this.ui.setResizeCallback(() => {
      this.handleResize();
    });
  }
  
  /**
   * Configura a conexão por sockets
   */
  setupSockets() {
    this.socketManager = new SocketManager(this.ui);
    const socket = this.socketManager.connect();
    
    // Criar a cena quando a conexão for estabelecida
    this.socketManager.onConnect(() => {
      // Inicializar o gerenciador de cenas
      this.sceneManager = new SceneManager(
        (message) => {
          this.ui.updateLoadingStatus(message);
        }, 
        this.socketManager,
        this.physicsManager
      );
      
      // Inicializar o serviço de jogo
      this.gameService = new GameService(socket, this.sceneManager, this.ui);
      
      // Atualizar referência ao gameService na UI
      this.ui.gameService = this.gameService;
      
      // Configurar referências ao sistema de física
      this.gameService.physicsManager = this.physicsManager;
      
      // Inicializar controles do jogador
      this.controls = new PlayerControls(socket, (player) => {
        this.ui.updateCamera(player);
      });
      
      // Atualizar referência ao sistema de física nos controles
      this.controls.physicsManager = this.physicsManager;
      
      // Configurar manipulador de interação com portais
      this.setupPortalInteraction();
      
      // Iniciar o jogo
      this.isRunning = true;
    });
    
    // Lidar com desconexão
    this.socketManager.onDisconnect(() => {
      // Pausar o jogo em caso de desconexão
      this.isRunning = false;
    });
    
    // Configurar eventos para troca de cena
    socket.on('changeScene', (data) => {
      if (data.sceneName && this.sceneManager) {
        // Mudar para a cena solicitada pelo servidor
        this.sceneManager.changeScene(data.sceneName);
      }
    });
  }
  
  /**
   * Configura o manipulador de interação com portais
   */
  setupPortalInteraction() {
    if (!this.gameService || !this.sceneManager) return;
    
    // Variável para controlar um cooldown entre teleportes
    let portalCooldown = false;
    let lastPortalInteraction = null;
    let currentPortal = null;
    
    // Adicionar listener para tecla de interação
    document.addEventListener('keydown', (e) => {
      // Se pressionou a tecla E e há um portal próximo
      if (e.key.toLowerCase() === 'e' && currentPortal && !portalCooldown) {
        // Evitar teleportar para a mesma cena onde o jogador já está
        if (this.sceneManager.getCurrentSceneName() === currentPortal.destination) {
          return;
        }
        
        // Ativar cooldown para evitar teleportes repetidos
        portalCooldown = true;
        lastPortalInteraction = {
          destination: currentPortal.destination,
          timestamp: Date.now()
        };
        
        // Tentar mudar para a cena de destino
        const success = this.sceneManager.changeScene(currentPortal.destination);
        
        if (success) {
          // Notificar o servidor sobre a mudança de cena
          this.socketManager.socket.emit('changeScene', {
            sceneName: currentPortal.destination
          });
          
          // Mostrar mensagem para o jogador
          this.ui.addChatMessage({
            system: true,
            message: `Teleportando para: ${currentPortal.name}`
          });
          
          // Desativar o cooldown após um tempo
          setTimeout(() => {
            portalCooldown = false;
            currentPortal = null;
          }, 3000); // 3 segundos de cooldown entre teleportes
        } else {
          // Se falhou, resetar o cooldown mais rapidamente
          setTimeout(() => {
            portalCooldown = false;
          }, 1000);
        }
      }
    });
    
    // Verificar proximidade com portais a cada atualização
    this.portalCheckInterval = setInterval(() => {
      if (!this.isRunning) return;
      
      const currentPlayer = this.gameService.getCurrentPlayer();
      if (!currentPlayer) return;
      
      const currentScene = this.sceneManager.getCurrentScene();
      if (!currentScene) return;
      
      // Verificar se o jogador está perto de um portal
      const portal = this.sceneManager.currentScene.checkPortalInteraction(currentPlayer.position);
      
      // Atualizar o portal atual
      if (portal !== currentPortal) {
        // Se entrou em um novo portal
        if (portal && !currentPortal) {
          // Mostrar mensagem de interação
          this.ui.showPortalPrompt(portal.name);
        } 
        // Se saiu de um portal
        else if (!portal && currentPortal) {
          // Esconder mensagem de interação
          this.ui.hidePortalPrompt();
        }
        
        currentPortal = portal;
      }
    }, 100); // Verificar a cada 100ms para uma detecção mais responsiva
  }
  
  /**
   * Configura listeners de eventos
   */
  setupEventListeners() {
    // Redimensionamento da janela
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }
  
  /**
   * Manipula o redimensionamento da janela
   */
  handleResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    if (this.sceneManager) {
      this.sceneManager.handleResize(this.camera, this.renderer);
    }
  }
  
  /**
   * Inicia o loop principal do jogo
   */
  startGameLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (this.isRunning) {
        this.update();
        this.render();
      }
    };
    
    animate();
  }
  
  /**
   * Atualiza o estado do jogo a cada frame
   */
  update() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime; // Tempo decorrido em ms
    this.lastUpdateTime = currentTime;
    
    // Atualizar sistema de física
    if (this.physicsManager) {
      this.physicsManager.update(deltaTime / 1000); // Converter para segundos para o sistema de física
    }
    
    // Atualizar controles do jogador
    if (this.controls && this.gameService) {
      const currentPlayer = this.gameService.getCurrentPlayer();
      if (currentPlayer && this.sceneManager) {
        // Garantir que os controles conheçam o jogador atual
        this.controls.player = currentPlayer;
        
        // Obter tamanho do mundo da cena atual
        const worldSize = this.sceneManager.currentScene?.worldSize || 100;
        
        // Atualizar posição baseada nos controles, passando deltaTime
        this.controls.update(currentPlayer, worldSize, deltaTime);
      }
    }
    
    // Atualizar todos os jogadores (para aplicar interpolação)
    if (this.gameService && this.gameService.players) {
      this.gameService.players.forEach(player => {
        if (player.update) {
          player.update(deltaTime);
        }
      });
    }
    
    // Atualizar rótulos 2D dos jogadores
    if (this.gameService) {
      this.gameService.updatePlayerLabels();
    }
  }
  
  /**
   * Renderiza a cena
   */
  render() {
    if (this.sceneManager && this.camera) {
      const currentScene = this.sceneManager.getCurrentScene();
      if (currentScene) {
        this.renderer.render(currentScene, this.camera);
      }
    }
  }
  
  /**
   * Ativa ou desativa a visualização de depuração de colisões físicas
   * @param {boolean} enabled - Se a visualização deve ser ativada ou desativada
   */
  togglePhysicsDebug(enabled) {
    if (!this.physicsManager || !this.sceneManager || !this.sceneManager.currentScene) {
      console.warn('Sistema de física ou cena não inicializados');
      return;
    }
    
    if (enabled) {
      this.physicsManager.createDebugVisualization(this.sceneManager.currentScene.scene);
      console.log('Visualização de debug de física ativada');
    } else {
      this.physicsManager.removeDebugVisualization(this.sceneManager.currentScene.scene);
      console.log('Visualização de debug de física desativada');
    }
  }
}

export default Game; 