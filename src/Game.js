import * as THREE from 'three';
import { CAMERA_CONFIG } from './config/gameConfig';
import GameScene from './scenes/GameScene';
import PlayerControls from './controls/PlayerControls';
import UserInterface from './components/UserInterface';
import SocketManager from './sockets/SocketManager';
import GameService from './services/GameService';

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
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.socketManager = null;
    this.gameService = null;
    this.ui = null;
    this.controls = null;
    this.isRunning = false;
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
      // Inicializar a cena
      this.scene = new GameScene((message) => {
        this.ui.updateLoadingStatus(message);
      });
      
      // Inicializar o serviço de jogo
      this.gameService = new GameService(socket, this.scene, this.ui);
      
      // Atualizar referência ao gameService na UI
      this.ui.gameService = this.gameService;
      
      // Inicializar controles do jogador
      this.controls = new PlayerControls(socket, (player) => {
        this.ui.updateCamera(player);
      });
      
      // Iniciar o jogo
      this.isRunning = true;
    });
    
    // Lidar com desconexão
    this.socketManager.onDisconnect(() => {
      // Pausar o jogo em caso de desconexão
      this.isRunning = false;
    });
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
    
    if (this.scene) {
      this.scene.handleResize(this.camera, this.renderer);
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
    // Atualizar controles do jogador
    if (this.controls && this.gameService) {
      const currentPlayer = this.gameService.getCurrentPlayer();
      if (currentPlayer) {
        // Atualizar posição baseada nos controles
        this.controls.update(currentPlayer, this.scene.worldSize);
      }
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
    if (this.scene && this.camera) {
      this.renderer.render(this.scene.scene, this.camera);
    }
  }
}

export default Game; 