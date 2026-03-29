// tools/scrapers/mercadolibre.js
// Búsqueda de productos en MercadoLibre Argentina vía API oficial.

const config = require('../../config');
const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger').child({ module: 'scraper.mercadolibre' });

const TIMEOUT_MS = 8000;
const BASE_URL = 'https://api.mercadolibre.com/sites/MLA/search';

/**
 * Busca productos en MercadoLibre Argentina usando la API oficial.
 *
 * @param {string} query - Producto a buscar
 * @param {number} [limite=10] - Cantidad máxima de resultados
 * @returns {Promise<Object[]>} array de { nombre, precio, precioAnterior, url, disponible, vendedorOficial }
 * @throws {AppError} code: 'MELI_SCRAPER_ERROR'
 */
async function buscarEnMercadoLibre(query, limite = 10) {
  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&limit=${limite}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = { Accept: 'application/json' };
  if (config.mercadolibre.accessToken) {
    headers.Authorization = `Bearer ${config.mercadolibre.accessToken}`;
  }

  try {
    const res = await fetch(url, { signal: controller.signal, headers });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Respuesta inesperada de MercadoLibre');
    }

    const resultados = data.results
      .map((item) => ({
        nombre: item.title,
        precio: item.price ?? null,
        precioAnterior: item.original_price ?? null,
        url: item.permalink,
        disponible: (item.available_quantity ?? 0) > 0,
        vendedorOficial: !!item.official_store_id,
      }))
      .filter((r) => r.precio !== null && r.precio > 0);

    logger.info('MercadoLibre API OK', { query, resultados: resultados.length });
    return resultados;
  } catch (err) {
    clearTimeout(timeout);
    if (err.isOperational) throw err;
    logger.warn('MercadoLibre API error', { query, error: err.message });
    throw new AppError(`Error MercadoLibre: ${err.message}`, 'MELI_SCRAPER_ERROR', 500);
  }
}

module.exports = { buscarEnMercadoLibre };
