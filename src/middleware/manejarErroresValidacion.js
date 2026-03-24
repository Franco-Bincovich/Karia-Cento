// middleware/manejarErroresValidacion.js
// Middleware para leer los errores de express-validator y lanzarlos
// como AppError con código VALIDATION_ERROR.
// Usar en cada ruta después de la cadena de validators.

const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

/**
 * Lee el resultado de express-validator y, si hay errores,
 * llama a next() con un AppError 400 para que errorHandler lo procese.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function manejarErroresValidacion(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    const mensaje = errores.array().map((e) => e.msg).join(', ');
    return next(new AppError(mensaje, 'VALIDATION_ERROR', 400));
  }
  next();
}

module.exports = manejarErroresValidacion;
