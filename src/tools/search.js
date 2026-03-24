// tools/search.js
// Búsqueda de precios en tiendas de electrodomésticos de Argentina.
// Flujo: Opción A (scraper VTEX directo) → Opción B (sub-agente web_search si A falla o retorna vacío).

const { buscarEnVTEX, TIENDAS_VTEX } = require('./scrapers/vtex');
const { buscarConWebSearch } = require('./scrapers/webSearch');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'search' });

/**
 * Normaliza un string: minúsculas sin tildes.
 *
 * @param {string} s
 * @returns {string}
 */
function normalizar(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Detecta qué tiendas menciona el usuario en un mensaje.
 *
 * @param {string} mensaje
 * @returns {string[]} array de nombres canónicos de tiendas detectadas
 */
function detectarTiendas(mensaje) {
  const lower = normalizar(mensaje);
  return Object.keys(TIENDAS_VTEX).filter((t) => lower.includes(t));
}

/**
 * Busca precios de un producto en las tiendas solicitadas.
 * Opción A: scraper VTEX directo para cada tienda.
 * Opción B: sub-agente web_search cuando A retorna vacío o falla.
 *
 * @param {{ query: string, tiendas?: string[] }} params
 * tiendas puede incluir: 'naldo', 'oncity', 'fravega', 'cetrogar', 'megatone', 'musimundo'
 * Si tiendas está vacío, busca en todas.
 *
 * @returns {Promise<Object[]>} array de { tienda, nombre, precio, precioAnterior, url, disponible }
 * @throws {AppError} code: 'SEARCH_ERROR'
 */
async function buscarPrecios({ query, tiendas = [] }) {
  const todasLasTiendas = Object.keys(TIENDAS_VTEX);
  const tiendasActivas =
    tiendas.length > 0 ? tiendas.map(normalizar).filter((t) => todasLasTiendas.includes(t)) : todasLasTiendas;

  try {
    const promesas = tiendasActivas.map(async (tienda) => {
      // Opción A — scraper VTEX directo
      let resultados = await buscarEnVTEX(TIENDAS_VTEX[tienda], query).catch((err) => {
        logger.warn('VTEX falló, intentando web_search', { tienda, error: err.message });
        return [];
      });

      // Opción B — fallback web_search si A no obtuvo resultados
      if (resultados.length === 0) {
        logger.info('Fallback a web_search', { tienda, query });
        resultados = await buscarConWebSearch(query, tienda).catch((err) => {
          logger.warn('web_search falló', { tienda, error: err.message });
          return [];
        });
      }

      return resultados.map((r) => ({ tienda, ...r }));
    });

    const arrays = await Promise.all(promesas);
    const resultados = arrays.flat();

    logger.info('Búsqueda de precios completada', {
      query,
      tiendas: tiendasActivas,
      total: resultados.length,
    });
    return resultados;
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error en buscarPrecios', { error: err.message, query });
    throw new AppError(`Error al buscar precios: ${err.message}`, 'SEARCH_ERROR', 500);
  }
}

module.exports = { buscarPrecios, detectarTiendas };
