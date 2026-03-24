// middleware/auditoria.js
// Middleware de auditoría para acciones sensibles del agente.

const logger = require('../utils/logger').child({ module: 'auditoria' });

/**
 * Middleware de auditoría para acciones sensibles.
 * Registra en log: usuario, acción, IP y timestamp.
 * Usar en routes que involucren envío de correos o exportación de archivos.
 *
 * @param {string} accion - Nombre de la acción ('envio_mail', 'exportar_excel', etc.)
 * @returns {Function} middleware de Express
 */
function auditarAccion(accion) {
  return (req, _res, next) => {
    logger.info('Auditoría de acción sensible', {
      userId: req.user?.userId,
      accion,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    next();
  };
}

module.exports = { auditarAccion };
