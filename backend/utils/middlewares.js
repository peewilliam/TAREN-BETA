const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const config = require('../config');

// Configuração de Rate Limit
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Muitas requisições, por favor tente novamente mais tarde'
    }
  });
};

// Middleware de log
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Quando a resposta for enviada
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  
  next();
};

// Middleware de erro 404
const notFound = (req, res, next) => {
  const error = new Error(`Não encontrado - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware de tratamento de erros
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};

// Configuração de CORS
const corsOptions = {
  origin: config.cors.origin,
  methods: config.cors.methods,
  optionsSuccessStatus: 200
};

module.exports = {
  requestLogger,
  notFound,
  errorHandler,
  createRateLimiter,
  securityMiddlewares: [
    helmet(),
    cors(corsOptions)
  ]
}; 