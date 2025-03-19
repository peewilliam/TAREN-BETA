# MMORPG Top-Down

Um MMORPG simples desenvolvido com Node.js, Vite e Three.js, oferecendo uma experiência multiplayer em tempo real com gráficos 3D.

## 🎮 Características

- **Mundo 3D**: Ambiente virtual com iluminação dinâmica e sombras
- **Multiplayer em Tempo Real**: Conexão via Socket.IO para interação entre jogadores
- **Sistema de Chat**: Comunicação entre jogadores
- **Sistema de Cenas**: Múltiplos mapas com portais interativos para transição
- **Controles Intuitivos**: Movimento WASD e interface responsiva
- **Interface Moderna**: Design limpo e minimalista
- **Performance Otimizada**: Renderização eficiente com Three.js

## 🛠️ Tecnologias Utilizadas

- **Frontend**:
  - Vite (Bundler e Dev Server)
  - Three.js (Renderização 3D)
  - Socket.IO Client (Comunicação em Tempo Real)
  - CSS3 (Estilização)

- **Backend**:
  - Node.js
  - Express
  - Socket.IO
  - MongoDB (Armazenamento de dados)

## 📁 Estrutura do Projeto

```
src/
├── config/
│   └── gameConfig.js     # Configurações centralizadas do jogo
├── components/
│   ├── Player.js         # Classe do jogador
│   └── UserInterface.js  # Interface de usuário
├── controls/
│   └── PlayerControls.js # Controles do jogador
├── lib/
│   └── CSS2DRenderer.js  # Renderização de elementos 2D
├── scenes/
│   ├── BaseScene.js      # Classe base para todas as cenas
│   ├── SceneManager.js   # Gerenciador de cenas
│   ├── MainScene.js      # Cena principal (hub)
│   ├── DungeonFireScene.js # Dungeon com tema de fogo
│   ├── DungeonIceScene.js  # Dungeon com tema de gelo
│   └── ArenaScene.js     # Arena para batalhas
├── services/
│   └── GameService.js    # Serviço de comunicação
├── sockets/
│   └── SocketManager.js  # Gerenciamento de conexões
├── Game.js               # Classe principal do jogo
├── main-new.js           # Ponto de entrada
└── style.css             # Estilos CSS
```

## 🎯 Funcionalidades

### Sistema de Jogadores
- Representação visual 3D dos jogadores
- Nomes flutuantes sobre os personagens
- Movimento suave e responsivo
- Sincronização de posição em tempo real
- Persistência de jogadores entre cenas

### Sistema de Cenas/Mapas
- Múltiplos mapas com temas diferentes
- Portais interativos para transição entre cenas
- Sincronização de jogadores específica para cada cena
- Sistema de prompt visual para interação com portais
- Sistema de salas no servidor para separar jogadores por cena

### Interface do Usuário
- Tela de carregamento com feedback visual
- Contador de jogadores online
- Exibição de posição do jogador
- Status de conexão
- Sistema de chat integrado
- Prompts visuais para interação com portais

### Mundo do Jogo
- Terreno com textura
- Grade de orientação
- Bordas do mundo
- Iluminação dinâmica
- Sombras
- Portais com efeitos visuais

### Sistema de Chat
- Mensagens do sistema
- Mensagens de jogadores com cores personalizadas
- Histórico de mensagens
- Interface intuitiva
- Chat específico por cena

## 🎮 Controles

- **W**: Mover para frente
- **A**: Mover para esquerda
- **S**: Mover para trás
- **D**: Mover para direita
- **E**: Interagir com portal (quando próximo)
- **Enter**: Abrir chat
- **Escape**: Fechar chat

## 🚀 Como Executar

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/TAREN-BETA.git
   cd TAREN-BETA
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   - Copie o arquivo `.env.example` para `.env`
   - Ajuste as variáveis conforme necessário

4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

5. **Acesse o jogo**:
   - Abra seu navegador
   - Acesse `http://localhost:5173`

## 🔧 Configuração

O arquivo `src/config/gameConfig.js` contém todas as configurações do jogo, incluindo:

- Configurações da câmera
- Configurações do mundo
- Configurações do jogador
- Configurações de iluminação
- Configurações de UI
- Teclas de controle
- Mensagens do sistema
- Configurações específicas de cada cena

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Seu Nome** - *Desenvolvimento inicial* - [seu-usuario](https://github.com/seu-usuario)

## 🙏 Agradecimentos

- Three.js por fornecer uma biblioteca 3D incrível
- Socket.IO por permitir comunicação em tempo real
- Vite por oferecer uma experiência de desenvolvimento moderna 