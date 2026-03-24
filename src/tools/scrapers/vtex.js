// tools/scrapers/vtex.js
// Función genérica de scraping para tiendas VTEX argentinas.

const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger').child({ module: 'scraper.vtex' });

const TIMEOUT_MS = 8000;

/** URLs base VTEX por tienda (canónico sin acento). */
const TIENDAS_VTEX = {
  naldo: 'https://www.naldo.com.ar/api/catalog_system/pub/products/search',
  oncity: 'https://www.oncity.com.ar/api/catalog_system/pub/products/search',
  fravega: 'https://www.fravega.com/api/catalog_system/pub/products/search',
  cetrogar: 'https://www.cetrogar.com.ar/api/catalog_system/pub/products/search',
  megatone: 'https://www.megatone.net/api/catalog_system/pub/products/search',
  musimundo: 'https://www.musimundo.com/api/catalog_system/pub/products/search',
};

/**
 * Parsea un producto VTEX al formato estándar del agente.
 *
 * @param {Object} p - Producto del response VTEX
 * @returns {{ nombre: string, precio: number|null, precioAnterior: number|null, url: string, disponible: boolean }}
 */
function parsearProducto(p) {
  const offer = p.items?.[0]?.sellers?.[0]?.commertialOffer;
  const dominio = Object.entries(TIENDAS_VTEX).find(([, u]) => u.includes(p.link?.split('/')[2] ?? ''));
  const base = dominio ? `https://${p.link?.split('/')[2]}` : '';
  return {
    nombre: p.productName,
    precio: offer?.Price ?? null,
    precioAnterior: offer?.ListPrice ?? null,
    url: p.link || `${base}/${p.linkText}/p`,
    disponible: (offer?.AvailableQuantity ?? 0) > 0,
  };
}

/**
 * Busca productos en cualquier tienda VTEX argentina.
 *
 * @param {string} baseUrl - URL base del endpoint VTEX de la tienda
 * @param {string} query   - Término de búsqueda
 * @returns {Promise<Object[]>} array de { nombre, precio, precioAnterior, url, disponible }
 * @throws {AppError} code: 'VTEX_SCRAPER_ERROR'
 */
async function buscarEnVTEX(baseUrl, query) {
  const url = `${baseUrl}?ft=${encodeURIComponent(query)}&_from=0&_to=9`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'KarIA-Scout/1.0' },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const productos = await res.json();
    if (!Array.isArray(productos)) throw new Error('Respuesta inesperada de VTEX');

    const resultados = productos.map(parsearProducto).filter((p) => p.precio !== null);
    logger.info('VTEX scraper OK', { baseUrl, query, resultados: resultados.length });
    return resultados;
  } catch (err) {
    clearTimeout(timeout);
    if (err.isOperational) throw err;
    logger.warn('VTEX scraper error', { baseUrl, query, error: err.message });
    throw new AppError(`Error VTEX (${baseUrl}): ${err.message}`, 'VTEX_SCRAPER_ERROR', 500);
  }
}

module.exports = { buscarEnVTEX, TIENDAS_VTEX };
