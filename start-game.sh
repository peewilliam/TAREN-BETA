#!/bin/bash

# Cores para mensagens
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sem cor

echo -e "${GREEN}Iniciando o jogo MMORPG...${NC}"

# Verificar se as dependências estão instaladas
echo -e "${YELLOW}Verificando dependências do backend...${NC}"
cd backend && npm install

echo -e "${YELLOW}Verificando dependências do frontend...${NC}"
cd .. && npm install

# Iniciar o backend em um terminal separado
echo -e "${GREEN}Iniciando o servidor backend...${NC}"
gnome-terminal -- bash -c "cd backend && npm run dev; exec bash" || 
xterm -e "cd backend && npm run dev" || 
start cmd.exe /k "cd backend && npm run dev" || 
open -a Terminal.app "cd backend && npm run dev"

# Esperar um pouco para o backend iniciar
sleep 2

# Iniciar o frontend
echo -e "${GREEN}Iniciando o cliente frontend...${NC}"
npm run dev

echo -e "${GREEN}Ambos os serviços estão rodando!${NC}" 