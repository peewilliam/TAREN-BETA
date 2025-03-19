const express = require('express');
const middlewares = require('./utils/middlewares');
const apiRoutes = require('./routes/api');
const logger = require('./utils/logger');
const config = require('./config');

// Inicializar o Express
const app = express();

// Middlewares de segurança
app.use(middlewares.securityMiddlewares);

// Parser de JSON
app.use(express.json());

// Logger de requisições
app.use(middlewares.requestLogger);

// Rotas da API
app.use('/api', apiRoutes);

// Middleware para rotas não encontradas
app.use(middlewares.notFound);

// Middleware de tratamento de erros
app.use(middlewares.errorHandler);

module.exports = app; 