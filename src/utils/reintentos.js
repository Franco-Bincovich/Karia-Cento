// utils/reintentos.js
// Retry logic con backoff exponencial para llamadas a APIs externas.

const logger = require('./logger').child({ module: 'reintentos' });

/**
 * Envuelve una función async con retry logic y backoff exponencial.
 * No reintenta errores operacionales (AppError.isOperational === true).
 *
 * @param {Function} fn - Función async a reintentar
 * @param {Object} opciones
 * @param {number}   opciones.maxIntentos  - Máximo de intentos (default 3)
 * @param {number}   opciones.delayBase    - Delay base en ms (default 500)
 * @param {Function} [opciones.shouldRetry] - Función que decide si reintentar según el error
 * @returns {Function} función envuelta con retry
 *
 * @example
 * const buscarSeguro = withRetry(buscarEnNaldo, { maxIntentos: 3, delayBase: 500 });
 */
function withRetry(fn, { maxIntentos = 3, delayBase = 500, shouldRetry } = {}) {
  return async function (...args) {
    let ultimoError;

    for (let intento = 1; intento <= maxIntentos; intento++) {
      try {
        // eslint-disable-next-line no-await-in-loop
        return await fn(...args);
      } catch (err) {
        ultimoError = err;

        // Errores de negocio o errores que no deben reintentarse
        if (err.isOperational) throw err;
        if (shouldRetry && !shouldRetry(err)) throw err;
        if (intento === maxIntentos) throw err;

        const delay = delayBase * 2 ** (intento - 1);
        logger.warn('Reintentando tras error', {
          intento,
          maxIntentos,
          delayMs: delay,
          error: err.message,
        });

        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    throw ultimoError;
  };
}

module.exports = { withRetry };
