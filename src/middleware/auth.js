// middleware/auth.js
// Verificación de JWT para rutas protegidas.
// Exporta también PUBLIC_ROUTES para referencia futura.

const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger').child({ module: 'auth' });

/** Rutas que no requieren JWT. */
const PUBLIC_ROUTES = [
  { path: '/health', method: 'GET' },
  { path: '/api/auth/login', method: 'POST' },
];

/**
 * Verifica el JWT en el header Authorization (Bearer).
 * Si es válido, adjunta req.user = { userId, email, rol } y llama next().
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @throws {AppError} code: 'TOKEN_REQUIRED' (401) si no hay header
 * @throws {AppError} code: 'TOKEN_EXPIRED'  (401) si el token venció
 * @throws {AppError} code: 'TOKEN_INVALID'  (401) si el token es inválido
 */
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token requerido', 'TOKEN_REQUIRED', 401));
  }

  const token = authHeader.slice(7); // quitar "Bearer "

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = { userId: payload.userId, email: payload.email, rol: payload.rol };
    logger.info('Token verificado', { userId: payload.userId });
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expirado', 'TOKEN_EXPIRED', 401));
    }
    return next(new AppError('Token inválido', 'TOKEN_INVALID', 401));
  }
}

module.exports = { verificarToken, PUBLIC_ROUTES };
