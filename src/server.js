// server.js
// Entry point del proceso Node. Arranca el servidor HTTP.
// No contiene lógica de negocio ni configuración de rutas.

const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger').child({ module: 'server' });
require('./utils/limpiarTmp');

const server = app.listen(config.port, () => {
  logger.info(`KarIA Scout corriendo`, { port: config.port, env: config.env });
});

// Graceful shutdown — cierra conexiones activas antes de salir
function shutdown(signal) {
  logger.info(`Señal ${signal} recibida. Cerrando servidor...`);
  server.close(() => {
    logger.info('Servidor cerrado correctamente.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', { error: reason instanceof Error ? reason.message : String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { error: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = server;
