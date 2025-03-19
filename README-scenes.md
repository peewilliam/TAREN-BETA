# Sistema de Cenas (Mapas) do Jogo

## Visão Geral
Este sistema foi desenvolvido para permitir múltiplas cenas/mapas no jogo, com teleportes entre elas e sincronização multiplayer. O sistema é modular, expansível e preparado para futura integração com modelos 3D (FBX).

## Arquitetura do Sistema

### Frontend (Cliente)

#### Estrutura de Cenas
- `BaseScene.js`: Classe base que implementa funcionalidades comuns a todas as cenas
- `SceneManager.js`: Gerencia todas as cenas e suas transições
- Cenas específicas:
  - `MainScene.js`: Hub central do jogo
  - `DungeonFireScene.js`: Dungeon com tema de fogo
  - `DungeonIceScene.js`: Dungeon com tema de gelo
  - `ArenaScene.js`: Arena para batalhas

#### Componentes Principais
- `Game.js`: Classe principal modificada para usar o SceneManager
- `GameService.js`: Adaptado para manipular jogadores em diferentes cenas
- `Player.js`: Agora inclui informação da cena atual do jogador
- `SocketManager.js`: Gerencia comunicação com o servidor considerando as diferentes cenas
- `UserInterface.js`: Implementa prompts visuais para interação com portais

### Backend (Servidor)

#### Componentes do Servidor
- `SocketManager.js`: Adaptado para gerenciar salas (uma por cena) e sincronizar jogadores apropriadamente
- `GameService.js`: Permite filtrar jogadores por cena e mantém eles separados
- `Player.js`: Inclui informação da cena atual e métodos para troca de cena

## Funcionalidades Implementadas

### Portais e Teleportes
- Cada cena contém portais visuais para outras cenas
- Portais são interativos e teleportam o jogador quando a tecla "E" é pressionada
- Sistema de feedback visual e mensagens indicam quando um portal está disponível
- Prompts na interface mostram qual tecla pressionar e para qual destino o portal leva
- O jogador precisa estar próximo de um portal para interagir com ele (não mais automático)
- Sistema de cooldown para evitar teleportes acidentais repetidos

### Sincronização de Jogadores por Cena
- Jogadores são sincronizados apenas com outros jogadores na mesma cena
- Ao mudar de cena, o jogador:
  1. É removido da sala (socket.io) da cena anterior
  2. É adicionado à sala da nova cena
  3. Recebe estado completo da nova cena (jogadores, objetos)
  4. Outros jogadores na nova cena são notificados sobre sua chegada
- Mecanismo aprimorado de solicitação de estado da cena para garantir visualização de todos os jogadores
- Tratamento especial para garantir que jogadores recém-chegados sejam visíveis para todos

### Sistema de Salas
- Cada cena é uma "sala" no servidor
- Mensagens de chat são encaminhadas apenas para jogadores na mesma sala
- Atualizações de posição são enviadas apenas aos jogadores relevantes
- Notificações de entrada e saída de jogadores são específicas por sala

## Preparação para Modelos FBX
O sistema está preparado para a futura substituição de geometrias por modelos 3D:

- Todos os objetos nas cenas estão encapsulados em grupos THREE.Group
- As geometrias básicas podem ser facilmente substituídas por modelos carregados
- A estrutura de cena é modular, permitindo substituição de componentes
- As referências a objetos importantes são mantidas em mapas

## Expandindo o Sistema

### Adicionando Novas Cenas
Para adicionar uma nova cena:

1. Criar uma nova classe que estenda BaseScene
2. Implementar os métodos de inicialização e configuração específica
3. Adicionar a cena ao SceneManager
4. Registrar a cena no backend (SocketManager e configurações)
5. Criar portais em outras cenas que levem à nova cena

### Adicionando Novos Objetos
Para adicionar novos objetos:

1. Criar o objeto usando geometrias ou carregando modelos
2. Adicionar à cena apropriada
3. Se necessário, implementar lógica de interação

## Próximos Passos
- Implementação de carregamento de modelos FBX
- Melhorias no sistema de colisão e física
- Adição de elementos específicos em cada cena (inimigos, itens)
- Otimização do sistema de renderização para cenas mais complexas
- Implementação de efeitos visuais mais avançados para os portais 