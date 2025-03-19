import './style.css';
import Game from './Game';

// Inicializar o jogo quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  console.log('Iniciando MMORPG Top-Down...');
  
  // Criar instância do jogo
  const game = new Game();
  
  // Expor a instância global para facilitar o debug no console
  window.game = game;
  
  console.log('Jogo MMORPG iniciado com sucesso!');
}); 