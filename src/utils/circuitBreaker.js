// utils/circuitBreaker.js
// Circuit breaker para proteger llamadas a APIs externas.
// Estados: CLOSED (normal) → OPEN (rechaza todo) → CLOSED (tras cooldown).

const { AppError } = require('../middleware/errorHandler');
const logger = require('./logger').child({ module: 'circuitBreaker' });

/**
 * Envuelve una función async con un circuit breaker.
 * Si falla más de maxFallos veces consecutivas, abre el circuito
 * y rechaza todas las llamadas durante cooldownMs milisegundos.
 *
 * @param {Function} fn - Función async a proteger
 * @param {Object} opciones
 * @param {number} opciones.maxFallos   - Fallos consecutivos antes de abrir (default 5)
 * @param {number} opciones.cooldownMs  - Tiempo de espera en ms (default 30000)
 * @param {string} opciones.nombre      - Nombre del circuito para logs
 * @returns {Function} función envuelta con circuit breaker
 */
function withCircuitBreaker(fn, { maxFallos = 5, cooldownMs = 30000, nombre = 'default' } = {}) {
  let fallosConsecutivos = 0;
  let abiertoDesde = null;

  return async function (...args) {
    // Verificar estado del circuito
    if (abiertoDesde !== null) {
      const transcurrido = Date.now() - abiertoDesde;
      if (transcurrido < cooldownMs) {
        const restante = Math.ceil((cooldownMs - transcurrido) / 1000);
        throw new AppError(
          `Circuito '${nombre}' abierto. Reintentá en ${restante}s`,
          'CIRCUIT_OPEN',
          503
        );
      }
      // Cooldown expirado → cerrar y probar
      abiertoDesde = null;
      fallosConsecutivos = 0;
      logger.info('Circuito cerrado tras cooldown', { nombre });
    }

    try {
      const resultado = await fn(...args);
      if (fallosConsecutivos > 0) {
        logger.info('Circuito recuperado', { nombre, fallosConsecutivos });
      }
      fallosConsecutivos = 0;
      return resultado;
    } catch (err) {
      fallosConsecutivos++;
      logger.warn('Fallo registrado en circuito', { nombre, fallosConsecutivos, error: err.message });

      if (fallosConsecutivos >= maxFallos) {
        abiertoDesde = Date.now();
        logger.error('Circuito abierto', { nombre, fallosConsecutivos, cooldownMs });
      }

      throw err;
    }
  };
}

module.exports = { withCircuitBreaker };
