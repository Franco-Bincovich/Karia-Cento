// middleware/errorHandler.js
// Exporta AppError (clase base para todos los errores operacionales)
// y errorHandler (middleware global de Express para respuestas de error).
// Formato estándar: { error: true, message: string, code: string }

const config = require('../config');

class AppError extends Error {
  /**
   * @param {string} message - Descripción legible del error
   * @param {string} code    - Código SNAKE_CASE para el cliente
   * @param {number} [statusCode=500] - HTTP status
   */
  constructor(message, code, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

/**
 * Middleware global de manejo de errores para Express.
 * Debe montarse al final de app.js, después de todas las rutas.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars -- Express requiere 4 params para reconocer error handlers
function errorHandler(err, req, res, _next) {
  // Intentar usar el logger; si no existe todavía, caer a console.error
  let logger;
  try {
    logger = require('../utils/logger').child({ module: 'errorHandler' });
  } catch (_) {
    logger = null;
  }

  const log = (msg, meta) => {
    if (logger) {
      logger.error(msg, meta);
    } else {
      // eslint-disable-next-line no-console
      console.error(`[errorHandler] ${msg}`, meta);
    }
  };

  // Payload demasiado grande — express.json() lanza este tipo
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: true, message: 'El cuerpo de la solicitud es demasiado grande', code: 'PAYLOAD_TOO_LARGE' });
  }

  // JSON malformado — express.json() lanza SyntaxError
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: true, message: 'JSON inválido', code: 'INVALID_JSON' });
  }

  // Error de validación de express-validator
  if (err.array && typeof err.array === 'function') {
    const mensaje = err.array().map((e) => e.msg).join(', ');
    log('Error de validación', { message: mensaje });
    return res.status(400).json({ error: true, message: mensaje, code: 'VALIDATION_ERROR' });
  }

  // Error operacional conocido (AppError)
  if (err.isOperational) {
    log('Error operacional', { code: err.code, message: err.message, status: err.statusCode });
    return res.status(err.statusCode).json({
      error: true,
      message: err.message,
      code: err.code,
    });
  }

  // Error inesperado — no exponer detalles en producción
  log('Error inesperado', { message: err.message, stack: err.stack });

  const message =
    config.env === 'production' ? 'Error interno del servidor' : err.message;

  return res.status(500).json({
    error: true,
    message,
    code: 'INTERNAL_ERROR',
  });
}

module.exports = { AppError, errorHandler };
