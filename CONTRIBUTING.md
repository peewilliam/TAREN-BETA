# Guia de Contribuição

Obrigado pelo interesse em contribuir com o projeto MMORPG Top-Down! Este guia fornece informações sobre como você pode participar no desenvolvimento deste jogo.

## Preparando o Ambiente de Desenvolvimento

1. **Fork do repositório**
   - Faça um fork deste repositório para sua conta GitHub

2. **Clone o seu fork**
   ```bash
   git clone https://github.com/SEU-USUARIO/TAREN-BETA.git
   cd TAREN-BETA
   ```

3. **Instale as dependências**
   ```bash
   # Dependências do backend
   cd backend
   npm install
   
   # Dependências do frontend
   cd ..
   npm install
   ```

4. **Configure as variáveis de ambiente**
   - Copie o arquivo `.env.example` (se existir) ou crie um novo arquivo `.env` na pasta `backend`
   - Defina as variáveis necessárias:
     ```
     PORT=3000
     NODE_ENV=development
     JWT_SECRET=sua_chave_secreta_para_desenvolvimento
     ```

## Estrutura do Código

Respeite a estrutura modular do projeto:

- **Backend**:
  - Coloque novos modelos em `backend/models/`
  - Adicione serviços em `backend/services/`
  - Implemente controladores em `backend/controllers/`
  - Defina novas rotas em `backend/routes/`
  - Para funcionalidades de socket, use `backend/sockets/`

- **Frontend**:
  - Componentes visuais devem ir em `src/components/`
  - Assets estáticos em `src/assets/`
  - Lógicas específicas em módulos separados

## Padrões de Código

1. **Estilo de código**:
   - Use 2 espaços para indentação
   - Termine cada arquivo com uma linha em branco
   - Use ponto e vírgula no final das declarações
   - Prefira aspas simples para strings

2. **Convenções de nomenclatura**:
   - Classes: PascalCase (ex: `PlayerModel`)
   - Funções e variáveis: camelCase (ex: `getPlayerPosition`)
   - Constantes: UPPER_SNAKE_CASE (ex: `MAX_PLAYERS`)

3. **Comentários**:
   - Comente seções complexas do código
   - Use JSDoc para documentar funções e classes
   - Mantenha comentários atualizados ao alterar o código

## Processo de Contribuição

1. **Crie uma branch para sua feature**:
   ```bash
   git checkout -b feature/nome-da-feature
   ```

2. **Faça commits pequenos e descritivos**:
   ```bash
   git commit -m "Adiciona sistema de inventário para jogadores"
   ```

3. **Mantenha seu fork atualizado**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/TAREN-BETA.git
   git fetch upstream
   git merge upstream/main
   ```

4. **Envie sua branch para o seu fork**:
   ```bash
   git push origin feature/nome-da-feature
   ```

5. **Abra um Pull Request**:
   - Vá para o repositório original e abra um PR
   - Descreva as mudanças que você implementou
   - Mencione quaisquer problemas que sua implementação resolve

## Diretrizes de Teste

Antes de enviar um PR, certifique-se de:

1. Testar todas as novas funcionalidades
2. Verificar se o código não quebra funcionalidades existentes
3. Testar em diferentes navegadores para recursos de frontend
4. Garantir que o código está livre de erros de lint

## Áreas para Contribuição

Algumas áreas específicas onde contribuições são bem-vindas:

- **Sistema de Persistência**: Implementação de banco de dados
- **Autenticação**: Sistema completo de login/registro
- **Mundo do Jogo**: Novos ambientes e elementos de cenário
- **Gameplay**: Mecânicas adicionais como combate, inventário, etc.
- **Otimização**: Melhorias de desempenho no cliente e servidor
- **UI/UX**: Interface de usuário mais amigável e intuitiva
- **Documentação**: Melhorias na documentação do projeto

## Contato

Se tiver dúvidas sobre como contribuir, entre em contato através de:
- Issues do GitHub
- [Adicionar email do projeto, se aplicável]
- [Adicionar canal de Discord, se aplicável]

Agradecemos muito sua contribuição para tornar este projeto melhor! 