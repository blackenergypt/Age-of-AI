const Sentry = require('@sentry/node');
const { RewriteFrames } = require('@sentry/integrations');
const config = require('../config');
const path = require('path');

// Inicializar o Sentry para monitoramento de erros
function initSentry() {
  if (config.sentry && config.sentry.dsn) {
    console.log('Inicializando Sentry com DSN:', config.sentry.dsn);
    try {
      Sentry.init({
        dsn: config.sentry.dsn,
        environment: config.sentry.environment,
        integrations: [
          // new RewriteFrames({
          //   root: path.dirname(require.main.filename),
          // }),
        ],
        tracesSampleRate: config.sentry.tracesSampleRate,
      });
      console.log('Sentry inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar Sentry:', error);
    }
  } else {
    console.warn('Sentry não configurado - DSN não fornecido');
  }
}

// Middleware para capturar erros e enviar para o Sentry
function sentryErrorHandler() {
  return (err, req, res, next) => {
    if (config.sentry && config.sentry.dsn) {
      Sentry.captureException(err);
    }
    next(err);
  };
}

// Configurar tratamento global de erros
function setupGlobalErrorHandling() {
  if (config.sentry && config.sentry.dsn) {
    process.on('uncaughtException', (error) => {
      console.error('Exceção não capturada:', error);
      Sentry.captureException(error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Promessa rejeitada não tratada:', reason);
      Sentry.captureException(reason);
    });
  }
}

module.exports = {
  Sentry,
  initSentry,
  sentryErrorHandler,
  setupGlobalErrorHandling,
}; 